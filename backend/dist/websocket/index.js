"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = initializeWebSocket;
const auth_service_1 = require("../services/auth.service");
const valkey_1 = require("../valkey");
const kafka_1 = require("../kafka");
const repositories_1 = require("../repositories");
function initializeWebSocket(io) {
    // Store active socket IDs per user: userId -> Set<socketId>
    const activeSockets = new Map();
    // Authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        const decoded = auth_service_1.authService.verifyToken(token);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }
        socket.userId = decoded.id;
        socket.username = decoded.username;
        next();
    });
    io.on('connection', async (socket) => {
        const userId = socket.userId;
        const username = socket.username;
        // Track user socket
        if (!activeSockets.has(userId)) {
            activeSockets.set(userId, new Set());
        }
        activeSockets.get(userId).add(socket.id);
        // Join personal user room for direct alerts & notifications
        socket.join(`user:${userId}`);
        // Update Valkey presence
        await valkey_1.valkey.setUserPresence(userId, 'online', 120);
        await repositories_1.userRepo.update(userId, { online_status: 'online', last_seen: new Date().toISOString() });
        // Emit presence to all clients
        io.emit('presence:update', {
            userId,
            status: 'online',
            lastSeen: new Date().toISOString(),
        });
        // Publish presence event to Kafka
        await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.PRESENCE, {
            event: 'USER_PRESENCE_CHANGED',
            userId,
            status: 'online',
            timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET CONNECTED] User: ${username} (${userId}) | Socket: ${socket.id}`);
        // Join Conversation Room
        socket.on('conversation:join', async ({ conversationId }) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`[SOCKET] User ${username} joined room conversation:${conversationId}`);
            // Mark delivered/read
            await repositories_1.messageRepo.updateStatus(conversationId, userId, 'read');
            io.to(`conversation:${conversationId}`).emit('message:read', {
                conversationId,
                readByUserId: userId,
                timestamp: new Date().toISOString(),
            });
        });
        // Leave Conversation Room
        socket.on('conversation:leave', ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
        });
        // Typing Indicators (via Valkey with TTL)
        socket.on('typing:start', async ({ conversationId }) => {
            await valkey_1.valkey.setTyping(conversationId, userId, 5);
            socket.to(`conversation:${conversationId}`).emit('typing:update', {
                conversationId,
                userId,
                username,
                isTyping: true,
            });
            // Kafka event
            await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.TYPING, {
                event: 'USER_TYPING',
                conversationId,
                userId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on('typing:stop', async ({ conversationId }) => {
            await valkey_1.valkey.clearTyping(conversationId, userId);
            socket.to(`conversation:${conversationId}`).emit('typing:update', {
                conversationId,
                userId,
                username,
                isTyping: false,
            });
        });
        // Send Real-Time Message
        socket.on('message:send', async (payload) => {
            try {
                const { conversationId, message, messageType = 'text', replyToMessageId } = payload;
                if (!message || !message.trim())
                    return;
                // Persist message in database
                const savedMessage = await repositories_1.messageRepo.create({
                    conversation_id: conversationId,
                    sender_id: userId,
                    message: message.trim(),
                    message_type: messageType,
                    status: 'sent',
                    reply_to_message_id: replyToMessageId || null,
                });
                const sender = await repositories_1.userRepo.findById(userId);
                const fullMessage = {
                    ...savedMessage,
                    sender: sender ? { ...sender, password_hash: undefined } : undefined,
                    reactions: [],
                };
                // 1. Emit instant message delivery to room
                io.to(`conversation:${conversationId}`).emit('message:new', fullMessage);
                // 2. Publish to Kafka MESSAGE_SENT event
                await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.MESSAGES, {
                    event: 'MESSAGE_SENT',
                    messageId: savedMessage.id,
                    conversationId,
                    senderId: userId,
                    messageType,
                    timestamp: savedMessage.created_at,
                    content: message.substring(0, 50),
                });
                // 3. Notify other conversation members
                const members = await repositories_1.convRepo.getMembers(conversationId);
                for (const member of members) {
                    if (member.id !== userId) {
                        // Create notification record
                        const notif = await repositories_1.notificationRepo.create({
                            user_id: member.id,
                            sender_id: userId,
                            message_id: savedMessage.id,
                            type: 'new_message',
                        });
                        // Push notification to user socket
                        io.to(`user:${member.id}`).emit('notification:new', {
                            ...notif,
                            sender,
                        });
                        // Publish to Kafka NOTIFICATIONS
                        await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.NOTIFICATIONS, {
                            event: 'NOTIFICATION_CREATED',
                            userId: member.id,
                            senderId: userId,
                            type: 'new_message',
                            messageId: savedMessage.id,
                            timestamp: new Date().toISOString(),
                        });
                    }
                }
            }
            catch (err) {
                console.error('[SOCKET ERROR: message:send]', err.message);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });
        // Message Delivered Status
        socket.on('message:delivered', async ({ messageId, conversationId }) => {
            io.to(`conversation:${conversationId}`).emit('message:status_update', {
                messageId,
                status: 'delivered',
            });
            await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.MESSAGE_STATUS, {
                event: 'MESSAGE_DELIVERED',
                messageId,
                conversationId,
                senderId: userId,
                timestamp: new Date().toISOString(),
            });
        });
        // Message Read Status
        socket.on('message:read', async ({ conversationId }) => {
            await repositories_1.messageRepo.updateStatus(conversationId, userId, 'read');
            io.to(`conversation:${conversationId}`).emit('message:read_all', {
                conversationId,
                readByUserId: userId,
            });
            await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.MESSAGE_STATUS, {
                event: 'MESSAGE_READ',
                conversationId,
                senderId: userId,
                timestamp: new Date().toISOString(),
            });
        });
        // Edit Message
        socket.on('message:edit', async ({ messageId, conversationId, newText }) => {
            const msg = await repositories_1.messageRepo.findById(messageId);
            if (!msg || msg.sender_id !== userId)
                return;
            const updated = await repositories_1.messageRepo.update(messageId, newText);
            io.to(`conversation:${conversationId}`).emit('message:edited', updated);
        });
        // Delete Message
        socket.on('message:delete', async ({ messageId, conversationId }) => {
            const msg = await repositories_1.messageRepo.findById(messageId);
            if (!msg || msg.sender_id !== userId)
                return;
            await repositories_1.messageRepo.delete(messageId);
            io.to(`conversation:${conversationId}`).emit('message:deleted', { messageId });
        });
        // Add Reaction
        socket.on('reaction:add', async ({ messageId, conversationId, reaction }) => {
            const rx = await repositories_1.messageRepo.addReaction(messageId, userId, reaction);
            io.to(`conversation:${conversationId}`).emit('reaction:updated', {
                messageId,
                reaction: rx,
                action: 'add',
            });
        });
        // Remove Reaction
        socket.on('reaction:remove', async ({ messageId, conversationId, reaction }) => {
            await repositories_1.messageRepo.removeReaction(messageId, userId, reaction);
            io.to(`conversation:${conversationId}`).emit('reaction:updated', {
                messageId,
                userId,
                reaction,
                action: 'remove',
            });
        });
        // Poll Vote
        socket.on('poll:vote', async ({ pollId, optionId, messageId, conversationId }) => {
            await repositories_1.pollRepo.vote(pollId, optionId, userId);
            const updatedPoll = await repositories_1.pollRepo.getPollByMessageId(messageId, userId);
            io.to(`conversation:${conversationId}`).emit('poll:updated', {
                messageId,
                poll: updatedPoll,
            });
        });
        // Task Status Update
        socket.on('task:update', async ({ taskId, groupId, conversationId, status }) => {
            const updated = await repositories_1.groupRepo.updateTaskStatus(taskId, status);
            io.to(`conversation:${conversationId}`).emit('task:updated', updated);
        });
        // Disconnect
        socket.on('disconnect', async () => {
            const userSockets = activeSockets.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    activeSockets.delete(userId);
                    // Update presence to offline
                    const lastSeen = new Date().toISOString();
                    await valkey_1.valkey.setUserPresence(userId, 'offline', 60);
                    await repositories_1.userRepo.update(userId, { online_status: 'offline', last_seen: lastSeen });
                    io.emit('presence:update', {
                        userId,
                        status: 'offline',
                        lastSeen,
                    });
                    await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.PRESENCE, {
                        event: 'USER_PRESENCE_CHANGED',
                        userId,
                        status: 'offline',
                        timestamp: lastSeen,
                    });
                }
            }
            console.log(`[SOCKET DISCONNECTED] User: ${username} | Socket: ${socket.id}`);
        });
    });
}

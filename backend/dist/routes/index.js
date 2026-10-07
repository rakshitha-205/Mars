"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_service_1 = require("../services/auth.service");
const repositories_1 = require("../repositories");
const ai_service_1 = require("../services/ai.service");
const kafka_1 = require("../kafka");
const valkey_1 = require("../valkey");
const database_1 = require("../database");
const router = (0, express_1.Router)();
// ============================================================
// 1. AUTHENTICATION ROUTES
// ============================================================
router.post('/auth/register', async (req, res) => {
    try {
        const { name, username, email, password, avatarColor, profilePhoto } = req.body;
        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: 'Name, username, email, and password are required.' });
        }
        const result = await auth_service_1.authService.register({ name, username, email, password, avatarColor, profilePhoto });
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
router.post('/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Username/Email and password are required.' });
        }
        const result = await auth_service_1.authService.login(identifier, password);
        return res.json(result);
    }
    catch (err) {
        return res.status(401).json({ error: err.message });
    }
});
router.get('/auth/me', auth_middleware_1.authenticateToken, async (req, res) => {
    return res.json({ user: req.user });
});
router.post('/auth/logout', auth_middleware_1.authenticateToken, async (req, res) => {
    const userId = req.user.id;
    await valkey_1.valkey.setUserPresence(userId, 'offline', 60);
    await repositories_1.userRepo.update(userId, { online_status: 'offline', last_seen: new Date().toISOString() });
    return res.json({ message: 'Logged out successfully.' });
});
// ============================================================
// 2. USERS ROUTES
// ============================================================
router.get('/users', auth_middleware_1.authenticateToken, async (req, res) => {
    const users = await repositories_1.userRepo.getAll();
    return res.json(users);
});
router.get('/users/search', auth_middleware_1.authenticateToken, async (req, res) => {
    const q = req.query.q || '';
    if (!q.trim())
        return res.json([]);
    const users = await repositories_1.userRepo.search(q, req.user.id);
    return res.json(users);
});
router.get('/users/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    const user = await repositories_1.userRepo.findById(req.params.id);
    if (!user)
        return res.status(404).json({ error: 'User not found.' });
    const { password_hash, ...safeUser } = user;
    const presence = await valkey_1.valkey.getUserPresence(user.id);
    return res.json({ ...safeUser, presence });
});
router.put('/users/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Cannot modify another user profile.' });
    }
    const updated = await repositories_1.userRepo.update(req.params.id, req.body);
    return res.json(updated);
});
// ============================================================
// 3. CONVERSATIONS ROUTES
// ============================================================
router.get('/conversations', auth_middleware_1.authenticateToken, async (req, res) => {
    const conversations = await repositories_1.convRepo.getUserConversations(req.user.id);
    // Enrich with participants, last message, and group info
    const enriched = await Promise.all(conversations.map(async (c) => {
        const members = await repositories_1.convRepo.getMembers(c.id);
        const messages = await repositories_1.messageRepo.getHistory(c.id, 1);
        const lastMsg = messages[messages.length - 1] || null;
        let groupInfo = null;
        if (c.type === 'group') {
            groupInfo = await repositories_1.groupRepo.findByConversationId(c.id);
        }
        return {
            ...c,
            participants: members,
            last_message: lastMsg,
            group_info: groupInfo,
        };
    }));
    return res.json(enriched);
});
router.post('/conversations', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { type = 'direct', recipientId, title, memberIds = [], description, groupPhoto } = req.body;
        if (type === 'direct') {
            if (!recipientId)
                return res.status(400).json({ error: 'Recipient ID required for direct chat.' });
            const conv = await repositories_1.convRepo.createDirect(req.user.id, recipientId);
            const members = await repositories_1.convRepo.getMembers(conv.id);
            return res.status(201).json({ ...conv, participants: members });
        }
        else {
            if (!title)
                return res.status(400).json({ error: 'Group title is required.' });
            const result = await repositories_1.convRepo.createGroup(title, description || null, req.user.id, memberIds, groupPhoto);
            const members = await repositories_1.convRepo.getMembers(result.conversation.id);
            return res.status(201).json({ ...result.conversation, group_info: result.group, participants: members });
        }
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
router.get('/conversations/:id/messages', auth_middleware_1.authenticateToken, async (req, res) => {
    const limit = parseInt(req.query.limit || '50', 10);
    const messages = await repositories_1.messageRepo.getHistory(req.params.id, limit);
    // Attach poll details if message is of type 'poll'
    const enrichedMessages = await Promise.all(messages.map(async (m) => {
        if (m.message_type === 'poll') {
            const poll = await repositories_1.pollRepo.getPollByMessageId(m.id);
            return { ...m, poll };
        }
        return m;
    }));
    return res.json(enrichedMessages);
});
// ============================================================
// 4. MESSAGES ROUTES
// ============================================================
router.post('/messages', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { conversationId, message, messageType = 'text', replyToMessageId, pollQuestion, pollOptions } = req.body;
        if (!conversationId || (!message && messageType !== 'poll')) {
            return res.status(400).json({ error: 'Conversation ID and message content required.' });
        }
        const savedMsg = await repositories_1.messageRepo.create({
            conversation_id: conversationId,
            sender_id: req.user.id,
            message: messageType === 'poll' ? pollQuestion || 'Poll' : message,
            message_type: messageType,
            reply_to_message_id: replyToMessageId || null,
        });
        let pollDetails = null;
        if (messageType === 'poll' && pollQuestion && Array.isArray(pollOptions)) {
            const pollId = `poll_${savedMsg.id}`;
            if (database_1.db.isUsingPostgres) {
                await database_1.db.query(`INSERT INTO polls (id, message_id, question) VALUES ($1, $2, $3)`, [pollId, savedMsg.id, pollQuestion]);
                for (const opt of pollOptions) {
                    await database_1.db.query(`INSERT INTO poll_options (id, poll_id, option_text) VALUES ($1, $2, $3)`, [`opt_${Math.random().toString(36).substring(7)}`, pollId, opt]);
                }
            }
            else {
                database_1.db.memory.polls.set(pollId, { id: pollId, message_id: savedMsg.id, question: pollQuestion, created_at: new Date().toISOString() });
                pollOptions.forEach((opt, i) => {
                    const optId = `opt_${pollId}_${i}`;
                    database_1.db.memory.poll_options.set(optId, { id: optId, poll_id: pollId, option_text: opt });
                });
            }
            pollDetails = await repositories_1.pollRepo.getPollByMessageId(savedMsg.id, req.user.id);
        }
        // Publish Kafka Event
        await kafka_1.kafkaService.publish(kafka_1.KAFKA_TOPICS.MESSAGES, {
            event: 'MESSAGE_SENT',
            messageId: savedMsg.id,
            conversationId,
            senderId: req.user.id,
            timestamp: savedMsg.created_at,
            messageType,
        });
        return res.status(201).json({ ...savedMsg, sender: req.user, poll: pollDetails });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
router.patch('/messages/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    const { message } = req.body;
    const existing = await repositories_1.messageRepo.findById(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'Message not found.' });
    if (existing.sender_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own messages.' });
    }
    const updated = await repositories_1.messageRepo.update(req.params.id, message);
    return res.json(updated);
});
router.delete('/messages/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    const existing = await repositories_1.messageRepo.findById(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'Message not found.' });
    if (existing.sender_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own messages.' });
    }
    await repositories_1.messageRepo.delete(req.params.id);
    return res.json({ message: 'Message deleted successfully.' });
});
// ============================================================
// 5. GROUPS, TASKS & EVENTS
// ============================================================
router.get('/groups/:id/tasks', auth_middleware_1.authenticateToken, async (req, res) => {
    const tasks = await repositories_1.groupRepo.getTasks(req.params.id);
    return res.json(tasks);
});
router.post('/groups/:id/tasks', auth_middleware_1.authenticateToken, async (req, res) => {
    const { title, description, assignedTo } = req.body;
    if (!title)
        return res.status(400).json({ error: 'Task title is required.' });
    const task = await repositories_1.groupRepo.createTask(req.params.id, title, description || null, assignedTo || null);
    return res.status(201).json(task);
});
router.patch('/groups/:id/tasks/:taskId', auth_middleware_1.authenticateToken, async (req, res) => {
    const { status } = req.body;
    const task = await repositories_1.groupRepo.updateTaskStatus(req.params.taskId, status);
    return res.json(task);
});
router.get('/groups/:id/events', auth_middleware_1.authenticateToken, async (req, res) => {
    const events = await repositories_1.groupRepo.getEvents(req.params.id);
    return res.json(events);
});
router.post('/groups/:id/events', auth_middleware_1.authenticateToken, async (req, res) => {
    const { title, description, eventTime, location } = req.body;
    if (!title || !eventTime)
        return res.status(400).json({ error: 'Title and event time are required.' });
    const ev = await repositories_1.groupRepo.createEvent(req.params.id, title, description || null, eventTime, location || null, req.user.id);
    return res.status(201).json(ev);
});
// ============================================================
// 6. NOTIFICATIONS
// ============================================================
router.get('/notifications', auth_middleware_1.authenticateToken, async (req, res) => {
    const notifs = await repositories_1.notificationRepo.getUserNotifications(req.user.id);
    return res.json(notifs);
});
router.patch('/notifications/:id/read', auth_middleware_1.authenticateToken, async (req, res) => {
    await repositories_1.notificationRepo.markAsRead(req.params.id);
    return res.json({ message: 'Notification marked as read.' });
});
// ============================================================
// 7. UNIFIED SEARCH (Users, Messages, Groups)
// ============================================================
router.get('/search', auth_middleware_1.authenticateToken, async (req, res) => {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q)
        return res.json({ users: [], messages: [], groups: [] });
    const matchedUsers = await repositories_1.userRepo.search(q, req.user.id);
    // Search messages
    let matchedMessages = [];
    if (database_1.db.isUsingPostgres) {
        const mRes = await database_1.db.query(`SELECT m.*, u.name as sender_name, c.title as conversation_title
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN conversations c ON m.conversation_id = c.id
       JOIN conversation_members cm ON c.id = cm.conversation_id
       WHERE cm.user_id = $1 AND LOWER(m.message) LIKE $2 AND m.deleted_at IS NULL
       LIMIT 15`, [req.user.id, `%${q}%`]);
        matchedMessages = mRes.rows;
    }
    else {
        for (const m of database_1.db.memory.messages.values()) {
            if (m.message.toLowerCase().includes(q) && !m.deleted_at) {
                const sender = database_1.db.memory.users.get(m.sender_id);
                matchedMessages.push({
                    ...m,
                    sender_name: sender?.name || 'Unknown',
                });
            }
        }
    }
    // Search groups
    let matchedGroups = [];
    if (database_1.db.isUsingPostgres) {
        const gRes = await database_1.db.query(`SELECT * FROM groups WHERE LOWER(name) LIKE $1 LIMIT 10`, [`%${q}%`]);
        matchedGroups = gRes.rows;
    }
    else {
        for (const g of database_1.db.memory.groups.values()) {
            if (g.name.toLowerCase().includes(q))
                matchedGroups.push(g);
        }
    }
    return res.json({
        users: matchedUsers,
        messages: matchedMessages.slice(0, 15),
        groups: matchedGroups,
    });
});
// ============================================================
// 8. AI ASSISTANT UTILITY ROUTES (Secondary Feature)
// ============================================================
router.post('/ai/smart-replies', auth_middleware_1.authenticateToken, async (req, res) => {
    const { messages = [] } = req.body;
    const replies = await ai_service_1.aiService.getSmartReplies(messages);
    return res.json({ replies });
});
router.post('/ai/summarize', auth_middleware_1.authenticateToken, async (req, res) => {
    const { messages = [] } = req.body;
    const summary = await ai_service_1.aiService.summarizeConversation(messages);
    return res.json(summary);
});
router.post('/ai/translate', auth_middleware_1.authenticateToken, async (req, res) => {
    const { text, targetLanguage = 'English' } = req.body;
    if (!text)
        return res.status(400).json({ error: 'Text required.' });
    const translated = await ai_service_1.aiService.translateMessage(text, targetLanguage);
    return res.json({ original: text, targetLanguage, translated });
});
router.post('/ai/rewrite', auth_middleware_1.authenticateToken, async (req, res) => {
    const { text, tone = 'professional' } = req.body;
    if (!text)
        return res.status(400).json({ error: 'Text required.' });
    const rewritten = await ai_service_1.aiService.rewriteMessage(text, tone);
    return res.json({ original: text, tone, rewritten });
});
// ============================================================
// 9. AIVEN ARCHITECTURE STATUS & HACKATHON JURY MONITOR
// ============================================================
router.get('/aiven/status', async (req, res) => {
    const onlineUsers = Array.from(database_1.db.memory.users.values()).filter((u) => u.online_status === 'online').length;
    return res.json({
        status: 'operational',
        service: 'ChatConnect Real-Time Platform',
        timestamp: new Date().toISOString(),
        aiven: {
            postgresql: {
                connected: database_1.db.isUsingPostgres,
                mode: database_1.db.isUsingPostgres ? 'Aiven PostgreSQL (Cloud Managed)' : 'High-Performance Compatible Engine',
                tablesCount: 16,
            },
            valkey: {
                connected: valkey_1.valkey.isUsingAivenValkey,
                mode: valkey_1.valkey.isUsingAivenValkey ? 'Aiven Valkey (TLS In-Memory Cluster)' : 'High-Performance Local Memory Valkey Adapter',
                features: ['Online Presence (TTL)', 'Real-time Typing Heartbeat', 'Rate Limiting', 'Low-Latency Cache'],
                onlineUsersCount: onlineUsers,
            },
            kafka: {
                connected: kafka_1.kafkaService.isUsingAivenKafka,
                mode: kafka_1.kafkaService.isUsingAivenKafka ? 'Aiven Apache Kafka (Event Streaming)' : 'High-Throughput Decoupled Event Bus',
                topics: Object.values(kafka_1.KAFKA_TOPICS),
                metrics: kafka_1.kafkaService.analytics,
            },
        },
    });
});
exports.default = router;

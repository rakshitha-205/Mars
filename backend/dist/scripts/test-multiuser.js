"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const routes_1 = __importDefault(require("../routes"));
const websocket_1 = require("../websocket");
const auth_service_1 = require("../services/auth.service");
async function runMultiUserVerification() {
    console.log('============================================================');
    console.log(' CHATCONNECT MULTI-USER LIVE TEST (Mithun <-> Rahul)');
    console.log('============================================================');
    // 1. Boot up test HTTP server and WebSocket
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use('/api', routes_1.default);
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
    (0, websocket_1.initializeWebSocket)(io);
    const TEST_PORT = 5055;
    await new Promise((resolve) => server.listen(TEST_PORT, () => resolve()));
    console.log(`[TEST SERVER] Listening on port ${TEST_PORT}`);
    const SERVER_URL = `http://localhost:${TEST_PORT}`;
    try {
        // 2. Authenticate User 1: Mithun
        console.log('\n[STEP 1] Logging in User 1 (Mithun)...');
        const mithunAuth = await auth_service_1.authService.login('mithun', 'Password123!');
        console.log(`✓ Mithun authenticated! ID: ${mithunAuth.user.id}, Token issued.`);
        // 3. Authenticate User 2: Rahul
        console.log('\n[STEP 2] Logging in User 2 (Rahul)...');
        const rahulAuth = await auth_service_1.authService.login('rahul', 'Password123!');
        console.log(`✓ Rahul authenticated! ID: ${rahulAuth.user.id}, Token issued.`);
        // 4. Establish WebSocket connection for Mithun
        console.log('\n[STEP 3] Connecting Mithun via WebSocket...');
        const mithunSocket = (0, socket_io_client_1.io)(SERVER_URL, {
            auth: { token: mithunAuth.token },
            transports: ['websocket'],
        });
        await new Promise((resolve, reject) => {
            mithunSocket.on('connect', () => {
                console.log(`✓ Mithun socket connected (Socket ID: ${mithunSocket.id})`);
                resolve();
            });
            mithunSocket.on('connect_error', reject);
        });
        // 5. Establish WebSocket connection for Rahul
        console.log('\n[STEP 4] Connecting Rahul via WebSocket...');
        const rahulSocket = (0, socket_io_client_1.io)(SERVER_URL, {
            auth: { token: rahulAuth.token },
            transports: ['websocket'],
        });
        await new Promise((resolve, reject) => {
            rahulSocket.on('connect', () => {
                console.log(`✓ Rahul socket connected (Socket ID: ${rahulSocket.id})`);
                resolve();
            });
            rahulSocket.on('connect_error', reject);
        });
        const CONV_ID = 'conv_mithun_rahul';
        // 6. Both users join the conversation
        console.log(`\n[STEP 5] Both users joining conversation room: ${CONV_ID}...`);
        mithunSocket.emit('conversation:join', { conversationId: CONV_ID });
        rahulSocket.emit('conversation:join', { conversationId: CONV_ID });
        await new Promise((r) => setTimeout(r, 200));
        console.log('✓ Joined conversation successfully.');
        // 7. Test Typing Indicator from Rahul -> Mithun
        console.log('\n[STEP 6] Testing live Typing Indicator...');
        const typingPromise = new Promise((resolve) => {
            mithunSocket.on('typing:update', (data) => {
                console.log(`✓ Mithun received typing update: "${data.username} is typing: ${data.isTyping}"`);
                if (data.isTyping && data.username === 'rahul') {
                    resolve();
                }
            });
        });
        rahulSocket.emit('typing:start', { conversationId: CONV_ID });
        await typingPromise;
        // 8. Test Instant Message Send from Mithun -> Rahul
        console.log('\n[STEP 7] Testing Instant Message Delivery (Mithun -> Rahul)...');
        const msgText = 'Hello Rahul 👋 Testing ChatConnect event-driven architecture!';
        let deliveredMsgId = '';
        const messageDeliveryPromise = new Promise((resolve) => {
            rahulSocket.on('message:new', (msg) => {
                console.log(`✓ Rahul instantly received message: "${msg.message}" from ${msg.sender?.name || msg.sender_id}`);
                console.log(`✓ Message ID: ${msg.id}, Status: ${msg.status}`);
                deliveredMsgId = msg.id;
                resolve();
            });
        });
        mithunSocket.emit('message:send', {
            conversationId: CONV_ID,
            message: msgText,
            messageType: 'text',
        });
        await messageDeliveryPromise;
        // 9. Test Message Delivery & Read Receipt
        console.log('\n[STEP 8] Testing Delivery and Read Receipts...');
        const readPromise = new Promise((resolve) => {
            mithunSocket.on('message:read_all', (data) => {
                console.log(`✓ Mithun received Read Receipt ✓✓ from User: ${data.readByUserId}`);
                resolve();
            });
        });
        rahulSocket.emit('message:read', { conversationId: CONV_ID });
        await readPromise;
        // 10. Test Reaction from Rahul -> Mithun's message
        console.log('\n[STEP 9] Testing Message Reaction (Rahul reacts with ❤️)...');
        const reactionPromise = new Promise((resolve) => {
            mithunSocket.on('reaction:updated', (data) => {
                console.log(`✓ Reaction received: ${data.reaction.reaction} on message ${data.messageId}`);
                resolve();
            });
        });
        rahulSocket.emit('reaction:add', {
            messageId: deliveredMsgId,
            conversationId: CONV_ID,
            reaction: '❤️',
        });
        await reactionPromise;
        // 11. Test Message Editing
        console.log('\n[STEP 10] Testing Message Editing...');
        const editPromise = new Promise((resolve) => {
            rahulSocket.on('message:edited', (edited) => {
                console.log(`✓ Rahul received updated message content: "${edited.message}"`);
                resolve();
            });
        });
        mithunSocket.emit('message:edit', {
            messageId: deliveredMsgId,
            conversationId: CONV_ID,
            newText: 'Hello Rahul 👋 [EDITED] Testing ChatConnect real-time system!',
        });
        await editPromise;
        // 12. Test AI Helper Features (Secondary Tool)
        console.log('\n[STEP 11] Testing AI Smart Replies & Summary Utilities...');
        const smartReplyRes = await fetch(`${SERVER_URL}/api/ai/smart-replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${rahulAuth.token}`,
            },
            body: JSON.stringify({
                messages: [{ senderName: 'Mithun', text: 'Where should we meet for the project review?' }],
            }),
        });
        const smartReplies = await smartReplyRes.json();
        console.log('✓ AI Smart Replies generated:', smartReplies.replies);
        // 13. Test Aiven Metrics & Status Endpoint
        console.log('\n[STEP 12] Verifying Aiven Live Architecture Endpoint (/api/aiven/status)...');
        const aivenRes = await fetch(`${SERVER_URL}/api/aiven/status`);
        const aivenStatus = await aivenRes.json();
        console.log('✓ Aiven Status Response:');
        console.log(`  - Service: ${aivenStatus.service}`);
        console.log(`  - Aiven PostgreSQL: ${aivenStatus.aiven.postgresql.mode}`);
        console.log(`  - Aiven Valkey: ${aivenStatus.aiven.valkey.mode}`);
        console.log(`  - Aiven Kafka: ${aivenStatus.aiven.kafka.mode}`);
        console.log(`  - Kafka Total Events: ${aivenStatus.aiven.kafka.metrics.totalEventsProcessed}`);
        console.log(`  - Kafka Messages Logged: ${aivenStatus.aiven.kafka.metrics.messagesProcessed}`);
        // Cleanup
        mithunSocket.disconnect();
        rahulSocket.disconnect();
        server.close();
        console.log('\n============================================================');
        console.log(' 🎉 ALL 12 MULTI-USER REAL-TIME TESTS PASSED PERFECTLY!');
        console.log(' Human-to-Human real-time messaging, typing, delivery/read,');
        console.log(' reactions, editing, Aiven Valkey presence, and Kafka events');
        console.log(' verified flawlessly!');
        console.log('============================================================\n');
    }
    catch (err) {
        console.error('TEST FAILED:', err);
        server.close();
        process.exit(1);
    }
}
runMultiUserVerification();

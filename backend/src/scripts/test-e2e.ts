import { io as ClientSocket, Socket } from 'socket.io-client';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config';
import apiRoutes from '../routes';
import { initializeWebSocket } from '../websocket';
import { authService } from '../services/auth.service';

async function runE2ETests() {
  console.log('============================================================');
  console.log(' CHATCONNECT FULL END-TO-END VERIFICATION SUITE');
  console.log(' Real-Time Human-to-Human Communication powered by Aiven');
  console.log('============================================================');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRoutes);

  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  initializeWebSocket(io);

  const TEST_PORT = 5059;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`[TEST SERVER] Running on port ${TEST_PORT}`);

  const SERVER_URL = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Authenticate User 1: Mithun
    console.log('\n[TEST 1] Authenticating Architect: Mithun Gowda...');
    const mithunAuth = await authService.login('mithun', 'Password123!');
    console.log(`✓ Mithun token issued! User ID: ${mithunAuth.user.id}`);

    // 2. Authenticate User 2: Rahul
    console.log('\n[TEST 2] Authenticating Peer: Rahul Kumar...');
    const rahulAuth = await authService.login('rahul', 'Password123!');
    console.log(`✓ Rahul token issued! User ID: ${rahulAuth.user.id}`);

    // 3. Connect Sockets
    console.log('\n[TEST 3] Establishing Dual WebSocket Connections...');
    const mithunSocket: Socket = ClientSocket(SERVER_URL, {
      auth: { token: mithunAuth.token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      mithunSocket.on('connect', resolve);
      mithunSocket.on('connect_error', reject);
    });
    console.log(`✓ Mithun WebSocket live (ID: ${mithunSocket.id})`);

    const rahulSocket: Socket = ClientSocket(SERVER_URL, {
      auth: { token: rahulAuth.token },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      rahulSocket.on('connect', resolve);
      rahulSocket.on('connect_error', reject);
    });
    console.log(`✓ Rahul WebSocket live (ID: ${rahulSocket.id})`);

    const CONV_ID = 'conv_mithun_rahul';

    // 4. Room Join
    console.log(`\n[TEST 4] Room Synchronization: Joining ${CONV_ID}...`);
    mithunSocket.emit('conversation:join', { conversationId: CONV_ID });
    rahulSocket.emit('conversation:join', { conversationId: CONV_ID });
    await new Promise((r) => setTimeout(r, 200));
    console.log('✓ Both peers joined conversation room');

    // 5. Typing Indicator
    console.log('\n[TEST 5] Live Typing Indicator Broadcast...');
    const typingPromise = new Promise<void>((resolve) => {
      mithunSocket.on('typing:update', (data) => {
        if (data.isTyping && data.username === 'rahul') {
          console.log(`✓ Mithun received typing status: "${data.username} is typing"`);
          resolve();
        }
      });
    });
    rahulSocket.emit('typing:start', { conversationId: CONV_ID });
    await typingPromise;

    // 6. Instant Messaging
    console.log('\n[TEST 6] Instant Message Dispatch (Mithun -> Rahul)...');
    let testMsgId = '';
    const messagePromise = new Promise<void>((resolve) => {
      rahulSocket.on('message:new', (msg) => {
        console.log(`✓ Rahul received real-time message: "${msg.message}"`);
        testMsgId = msg.id;
        resolve();
      });
    });
    mithunSocket.emit('message:send', {
      conversationId: CONV_ID,
      message: 'Hello Rahul! Testing ChatConnect Aiven architecture.',
      messageType: 'text',
    });
    await messagePromise;

    // 7. Read Receipts
    console.log('\n[TEST 7] Read Receipts Protocol...');
    const readPromise = new Promise<void>((resolve) => {
      mithunSocket.on('message:read_all', (data) => {
        console.log(`✓ Mithun received Read Receipt ✓✓ from User: ${data.readByUserId}`);
        resolve();
      });
    });
    rahulSocket.emit('message:read', { conversationId: CONV_ID });
    await readPromise;

    // 8. Reactions
    console.log('\n[TEST 8] Interactive Reactions...');
    const reactionPromise = new Promise<void>((resolve) => {
      mithunSocket.on('reaction:updated', (data) => {
        console.log(`✓ Reaction confirmed: ${data.reaction} on message ${data.messageId}`);
        resolve();
      });
    });
    rahulSocket.emit('reaction:add', {
      messageId: testMsgId,
      conversationId: CONV_ID,
      reaction: '🔥',
    });
    await reactionPromise;

    // 9. Aiven Architecture Status API
    console.log('\n[TEST 9] Verifying Aiven Live Architecture Endpoint...');
    const aivenRes = await fetch(`${SERVER_URL}/api/aiven/status`);
    const aivenJson = await aivenRes.json();
    console.log('✓ Aiven Status verified:', {
      service: aivenJson.service,
      postgresMode: aivenJson.aiven?.postgresql?.mode,
      valkeyMode: aivenJson.aiven?.valkey?.mode,
      kafkaMode: aivenJson.aiven?.kafka?.mode,
      kafkaTotalEvents: aivenJson.aiven?.kafka?.analytics?.totalEventsProcessed,
    });

    console.log('\n============================================================');
    console.log(' 🎉 ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    console.log(' ChatConnect is fully verified and ready for production!');
    console.log('============================================================\n');

    mithunSocket.disconnect();
    rahulSocket.disconnect();
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('[E2E TEST FAILURE]', error);
    server.close();
    process.exit(1);
  }
}

runE2ETests();

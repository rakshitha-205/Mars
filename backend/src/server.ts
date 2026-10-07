import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import apiRoutes from './routes';
import { initializeWebSocket } from './websocket';

const app = express();
const server = http.createServer(app);

// Cross-Origin Resource Sharing setup
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path !== '/api/aiven/status') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Mount API routes at both /api and root to support all Vercel rewrite formats
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Root & API health check
const healthCheck = (req: express.Request, res: express.Response) => {
  res.json({
    app: 'ChatConnect',
    tagline: 'Connect. Communicate. Collaborate.',
    status: 'online',
    version: '1.0.0',
    docs: '/docs',
    aivenStatus: '/api/aiven/status',
  });
};

app.get('/', healthCheck);
app.get('/api', healthCheck);
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Global error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err?.message || 'An unexpected error occurred.',
  });
});

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

initializeWebSocket(io);

// Determine if running inside a serverless / lambda environment
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.NOW_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (process.env.NODE_ENV === 'production' && !process.env.PORT)
);

// Start Server (only in non-serverless / local environments when directly executed)
if (!isServerless && typeof require !== 'undefined' && require.main === module) {
  server.listen(config.port, () => {
    console.log('============================================================');
    console.log(` CHATCONNECT BACKEND SERVICE RUNNING ON PORT ${config.port}`);
    console.log(' Tagline: "Connect. Communicate. Collaborate."');
    console.log(` Mode: ${config.nodeEnv}`);
    console.log(` Aiven Status API: http://localhost:${config.port}/api/aiven/status`);
    console.log('============================================================');
  });
}

// Process signal & error handling
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] Gracefully terminating server...');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

// Export Express application for Vercel and serverless environments
module.exports = app;
module.exports.default = app;
module.exports.app = app;
module.exports.server = server;
module.exports.io = io;

export default app;
export { app, server, io };



"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const websocket_1 = require("./websocket");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// Cross-Origin Resource Sharing setup
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Request logging middleware
app.use((req, res, next) => {
    if (req.path !== '/api/aiven/status') {
        console.log(`[HTTP] ${req.method} ${req.path}`);
    }
    next();
});
// Mount API routes
app.use('/api', routes_1.default);
// Root health check
app.get('/', (req, res) => {
    res.json({
        app: 'ChatConnect',
        tagline: 'Connect. Communicate. Collaborate.',
        status: 'online',
        version: '1.0.0',
        docs: '/docs',
        aivenStatus: '/api/aiven/status',
    });
});
// Global error handling
app.use((err, req, res, next) => {
    console.error('[UNHANDLED ERROR]', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config_1.config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred.',
    });
});
// Initialize Socket.IO with CORS
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 10000,
});
exports.io = io;
(0, websocket_1.initializeWebSocket)(io);
// Start Server (only in non-serverless / local environments)
if (!process.env.VERCEL) {
    server.listen(config_1.config.port, () => {
        console.log('============================================================');
        console.log(` CHATCONNECT BACKEND SERVICE RUNNING ON PORT ${config_1.config.port}`);
        console.log(' Tagline: "Connect. Communicate. Collaborate."');
        console.log(` Mode: ${config_1.config.nodeEnv}`);
        console.log(` Aiven Status API: http://localhost:${config_1.config.port}/api/aiven/status`);
        console.log('============================================================');
    });
}
// Process signal handling
process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Gracefully terminating server...');
    server.close(() => process.exit(0));
});
// Export Express application for Vercel and serverless environments
module.exports = app;
module.exports.default = app;
module.exports.app = app;
module.exports.server = server;
module.exports.io = io;
exports.default = app;

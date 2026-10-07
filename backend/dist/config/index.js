"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'chatconnect_jwt_dev_secret_key_2026',
    jwtExpiresIn: process.env.JWT_EXPIRATION || '7d',
    database: {
        url: process.env.DATABASE_URL || '',
        ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.NODE_ENV === 'production',
    },
    kafka: {
        brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : [],
        username: process.env.KAFKA_USERNAME || '',
        password: process.env.KAFKA_PASSWORD || '',
        ssl: process.env.KAFKA_SSL === 'true' || true,
        clientId: 'chatconnect-service',
        groupId: 'chatconnect-consumer-group',
    },
    valkey: {
        url: process.env.VALKEY_URL || process.env.REDIS_URL || '',
    },
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
    },
    corsOrigin: process.env.CORS_ORIGIN || '*',
};

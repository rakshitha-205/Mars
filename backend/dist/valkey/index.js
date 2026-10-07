"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.valkey = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
// In-Memory Redis/Valkey Simulator for fallback or offline demo
class MemoryValkey {
    store = new Map();
    listeners = new Map();
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiresAt && item.expiresAt < Date.now()) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, mode, duration) {
        let expiresAt;
        if (mode === 'EX' && duration) {
            expiresAt = Date.now() + duration * 1000;
        }
        else if (mode === 'PX' && duration) {
            expiresAt = Date.now() + duration;
        }
        this.store.set(key, { value, expiresAt });
        return 'OK';
    }
    async setex(key, seconds, value) {
        return this.set(key, value, 'EX', seconds);
    }
    async del(key) {
        return this.store.delete(key) ? 1 : 0;
    }
    async expire(key, seconds) {
        const item = this.store.get(key);
        if (!item)
            return 0;
        item.expiresAt = Date.now() + seconds * 1000;
        return 1;
    }
    async ttl(key) {
        const item = this.store.get(key);
        if (!item)
            return -2;
        if (!item.expiresAt)
            return -1;
        const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    async keys(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const result = [];
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (item.expiresAt && item.expiresAt < now) {
                this.store.delete(key);
                continue;
            }
            if (regex.test(key)) {
                result.push(key);
            }
        }
        return result;
    }
    async incr(key) {
        const current = await this.get(key);
        const num = (parseInt(current || '0', 10) || 0) + 1;
        await this.set(key, num.toString());
        return num;
    }
    async publish(channel, message) {
        const subs = this.listeners.get(channel);
        if (!subs)
            return 0;
        subs.forEach((cb) => cb(message));
        return subs.size;
    }
    async subscribe(channel, callback) {
        if (!this.listeners.has(channel)) {
            this.listeners.set(channel, new Set());
        }
        this.listeners.get(channel).add(callback);
    }
}
class ValkeyClientService {
    redisClient = null;
    memoryClient = new MemoryValkey();
    isUsingAivenValkey = false;
    constructor() {
        this.init();
    }
    init() {
        if (config_1.config.valkey.url) {
            try {
                console.log('[VALKEY] Connecting to Aiven Valkey...');
                this.redisClient = new ioredis_1.default(config_1.config.valkey.url, {
                    tls: config_1.config.valkey.url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
                    retryStrategy: (times) => {
                        if (times > 3) {
                            console.warn('[VALKEY] Aiven Valkey unreachable, continuing with in-memory adapter.');
                            return null;
                        }
                        return Math.min(times * 100, 2000);
                    },
                    lazyConnect: true,
                });
                this.redisClient.on('error', (err) => {
                    console.warn('[VALKEY] Redis error event caught:', err.message);
                    this.isUsingAivenValkey = false;
                });
                this.redisClient
                    .connect()
                    .then(() => {
                    console.log('[VALKEY] Connected to Aiven Valkey successfully! ⚡');
                    this.isUsingAivenValkey = true;
                })
                    .catch((err) => {
                    console.warn('[VALKEY] Aiven Valkey connection failed:', err.message);
                    console.log('[VALKEY] Operating with high-performance in-memory Valkey adapter.');
                    this.isUsingAivenValkey = false;
                });
            }
            catch (err) {
                console.warn('[VALKEY] Initialization error:', err.message);
                this.isUsingAivenValkey = false;
            }
        }
        else {
            console.log('[VALKEY] No VALKEY_URL set. Running in-memory Valkey adapter with TTL & presence.');
        }
    }
    // High-level Valkey methods for ChatConnect
    async setUserPresence(userId, status, ttlSeconds = 60) {
        const key = `presence:user:${userId}`;
        const lastActiveKey = `last_active:user:${userId}`;
        const now = new Date().toISOString();
        if (this.isUsingAivenValkey && this.redisClient) {
            await this.redisClient.set(key, status, 'EX', ttlSeconds);
            await this.redisClient.set(lastActiveKey, now);
        }
        else {
            await this.memoryClient.set(key, status, 'EX', ttlSeconds);
            await this.memoryClient.set(lastActiveKey, now);
        }
    }
    async getUserPresence(userId) {
        const key = `presence:user:${userId}`;
        const lastActiveKey = `last_active:user:${userId}`;
        let status = null;
        let lastActive = null;
        if (this.isUsingAivenValkey && this.redisClient) {
            status = await this.redisClient.get(key);
            lastActive = await this.redisClient.get(lastActiveKey);
        }
        else {
            status = await this.memoryClient.get(key);
            lastActive = await this.memoryClient.get(lastActiveKey);
        }
        return {
            status: status || 'offline',
            lastActive,
        };
    }
    async setTyping(conversationId, userId, ttlSeconds = 6) {
        const key = `typing:conversation:${conversationId}:user:${userId}`;
        if (this.isUsingAivenValkey && this.redisClient) {
            await this.redisClient.set(key, '1', 'EX', ttlSeconds);
        }
        else {
            await this.memoryClient.set(key, '1', 'EX', ttlSeconds);
        }
    }
    async clearTyping(conversationId, userId) {
        const key = `typing:conversation:${conversationId}:user:${userId}`;
        if (this.isUsingAivenValkey && this.redisClient) {
            await this.redisClient.del(key);
        }
        else {
            await this.memoryClient.del(key);
        }
    }
    async getTypingUsers(conversationId) {
        const pattern = `typing:conversation:${conversationId}:user:*`;
        let keys = [];
        if (this.isUsingAivenValkey && this.redisClient) {
            keys = await this.redisClient.keys(pattern);
        }
        else {
            keys = await this.memoryClient.keys(pattern);
        }
        return keys.map((k) => k.split(':user:')[1]).filter(Boolean);
    }
    async rateLimit(identifier, limit = 60, windowSeconds = 60) {
        const key = `rate_limit:${identifier}`;
        let count = 0;
        if (this.isUsingAivenValkey && this.redisClient) {
            count = await this.redisClient.incr(key);
            if (count === 1) {
                await this.redisClient.expire(key, windowSeconds);
            }
        }
        else {
            count = await this.memoryClient.incr(key);
            if (count === 1) {
                await this.memoryClient.expire(key, windowSeconds);
            }
        }
        return count <= limit;
    }
}
exports.valkey = new ValkeyClientService();

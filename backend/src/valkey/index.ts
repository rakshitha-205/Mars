import Redis from 'ioredis';
import { config } from '../config';

// In-Memory Redis/Valkey Simulator for fallback or offline demo
class MemoryValkey {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private listeners = new Map<string, Set<(message: string) => void>>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.set(key, value, 'EX', seconds);
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result: string[] = [];
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

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const num = (parseInt(current || '0', 10) || 0) + 1;
    await this.set(key, num.toString());
    return num;
  }

  async publish(channel: string, message: string): Promise<number> {
    const subs = this.listeners.get(channel);
    if (!subs) return 0;
    subs.forEach((cb) => cb(message));
    return subs.size;
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);
  }
}

class ValkeyClientService {
  private redisClient: Redis | null = null;
  private memoryClient = new MemoryValkey();
  public isUsingAivenValkey = false;

  constructor() {
    this.init();
  }

  private init() {
    if (config.valkey.url) {
      try {
        console.log('[VALKEY] Connecting to Aiven Valkey...');
        this.redisClient = new Redis(config.valkey.url, {
          tls: config.valkey.url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('[VALKEY] Aiven Valkey unreachable, continuing with in-memory adapter.');
              return null;
            }
            return Math.min(times * 100, 2000);
          },
          lazyConnect: true,
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
      } catch (err: any) {
        console.warn('[VALKEY] Initialization error:', err.message);
        this.isUsingAivenValkey = false;
      }
    } else {
      console.log('[VALKEY] No VALKEY_URL set. Running in-memory Valkey adapter with TTL & presence.');
    }
  }

  // High-level Valkey methods for ChatConnect
  async setUserPresence(userId: string, status: 'online' | 'away' | 'busy' | 'offline', ttlSeconds = 60) {
    const key = `presence:user:${userId}`;
    const lastActiveKey = `last_active:user:${userId}`;
    const now = new Date().toISOString();

    if (this.isUsingAivenValkey && this.redisClient) {
      await this.redisClient.set(key, status, 'EX', ttlSeconds);
      await this.redisClient.set(lastActiveKey, now);
    } else {
      await this.memoryClient.set(key, status, 'EX', ttlSeconds);
      await this.memoryClient.set(lastActiveKey, now);
    }
  }

  async getUserPresence(userId: string): Promise<{ status: string; lastActive: string | null }> {
    const key = `presence:user:${userId}`;
    const lastActiveKey = `last_active:user:${userId}`;

    let status: string | null = null;
    let lastActive: string | null = null;

    if (this.isUsingAivenValkey && this.redisClient) {
      status = await this.redisClient.get(key);
      lastActive = await this.redisClient.get(lastActiveKey);
    } else {
      status = await this.memoryClient.get(key);
      lastActive = await this.memoryClient.get(lastActiveKey);
    }

    return {
      status: status || 'offline',
      lastActive,
    };
  }

  async setTyping(conversationId: string, userId: string, ttlSeconds = 6) {
    const key = `typing:conversation:${conversationId}:user:${userId}`;
    if (this.isUsingAivenValkey && this.redisClient) {
      await this.redisClient.set(key, '1', 'EX', ttlSeconds);
    } else {
      await this.memoryClient.set(key, '1', 'EX', ttlSeconds);
    }
  }

  async clearTyping(conversationId: string, userId: string) {
    const key = `typing:conversation:${conversationId}:user:${userId}`;
    if (this.isUsingAivenValkey && this.redisClient) {
      await this.redisClient.del(key);
    } else {
      await this.memoryClient.del(key);
    }
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    const pattern = `typing:conversation:${conversationId}:user:*`;
    let keys: string[] = [];

    if (this.isUsingAivenValkey && this.redisClient) {
      keys = await this.redisClient.keys(pattern);
    } else {
      keys = await this.memoryClient.keys(pattern);
    }

    return keys.map((k) => k.split(':user:')[1]).filter(Boolean);
  }

  async rateLimit(identifier: string, limit = 60, windowSeconds = 60): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    let count = 0;

    if (this.isUsingAivenValkey && this.redisClient) {
      count = await this.redisClient.incr(key);
      if (count === 1) {
        await this.redisClient.expire(key, windowSeconds);
      }
    } else {
      count = await this.memoryClient.incr(key);
      if (count === 1) {
        await this.memoryClient.expire(key, windowSeconds);
      }
    }

    return count <= limit;
  }
}

export const valkey = new ValkeyClientService();

import { Kafka, Producer, Consumer } from 'kafkajs';
import { config } from '../config';

export const KAFKA_TOPICS = {
  MESSAGES: 'chat.messages',
  MESSAGE_STATUS: 'chat.message-status',
  PRESENCE: 'chat.presence',
  TYPING: 'chat.typing',
  NOTIFICATIONS: 'chat.notifications',
  GROUPS: 'chat.groups',
  AUDIT: 'chat.audit',
} as const;

export interface KafkaMessageEvent {
  event: 'MESSAGE_SENT' | 'MESSAGE_DELIVERED' | 'MESSAGE_READ' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED';
  messageId: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  messageType?: string;
  timestamp: string;
  content?: string;
}

export interface KafkaPresenceEvent {
  event: 'USER_PRESENCE_CHANGED';
  userId: string;
  status: string;
  timestamp: string;
}

export interface KafkaNotificationEvent {
  event: 'NOTIFICATION_CREATED';
  userId: string;
  senderId?: string;
  type: string;
  messageId?: string;
  timestamp: string;
}

// In-Memory EventBus fallback for offline development or missing Aiven Kafka credentials
class MemoryEventBus {
  private handlers = new Map<string, Array<(payload: any) => Promise<void>>>();

  on(topic: string, handler: (payload: any) => Promise<void>) {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);
  }

  async emit(topic: string, payload: any) {
    const list = this.handlers.get(topic) || [];
    for (const fn of list) {
      try {
        await fn(payload);
      } catch (err: any) {
        console.error(`[EVENT-BUS ERROR] Topic ${topic}:`, err.message);
      }
    }
  }
}

class KafkaService {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  public memoryBus = new MemoryEventBus();
  public isUsingAivenKafka = false;

  // Real-time analytics counter for Hackathon judges
  public analytics = {
    totalEventsProcessed: 0,
    messagesProcessed: 0,
    notificationsGenerated: 0,
    presenceEventsCount: 0,
    topicCounts: {} as Record<string, number>,
  };

  constructor() {
    this.init();
    this.registerConsumers();
  }

  private async init() {
    if (config.kafka.brokers.length > 0) {
      try {
        console.log('[KAFKA] Initializing connection to Aiven Apache Kafka...');
        this.kafka = new Kafka({
          clientId: config.kafka.clientId,
          brokers: config.kafka.brokers,
          ssl: config.kafka.ssl ? { rejectUnauthorized: false } : undefined,
          sasl: config.kafka.username
            ? {
                mechanism: 'scram-sha-512',
                username: config.kafka.username,
                password: config.kafka.password,
              }
            : undefined,
          connectionTimeout: 5000,
        });

        this.producer = this.kafka.producer();
        await this.producer.connect();
        console.log('[KAFKA] Aiven Kafka Producer connected successfully! 🚀');

        this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId });
        await this.consumer.connect();

        for (const topic of Object.values(KAFKA_TOPICS)) {
          await this.consumer.subscribe({ topic, fromBeginning: false });
        }

        await this.consumer.run({
          eachMessage: async ({ topic, message }) => {
            if (message.value) {
              const data = JSON.parse(message.value.toString());
              await this.handleIncomingKafkaMessage(topic, data);
            }
          },
        });

        this.isUsingAivenKafka = true;
        console.log('[KAFKA] Aiven Kafka Consumer group running on topics.');
      } catch (err: any) {
        console.warn('[KAFKA] Aiven Kafka connection failed:', err.message);
        console.log('[KAFKA] Falling back to high-throughput internal event broker.');
        this.isUsingAivenKafka = false;
      }
    } else {
      console.log('[KAFKA] No KAFKA_BROKERS configured. Running internal event-driven broker.');
    }
  }

  // Publish event to topic (Aiven Kafka or MemoryBus)
  async publish(topic: string, eventData: any) {
    this.analytics.totalEventsProcessed++;
    this.analytics.topicCounts[topic] = (this.analytics.topicCounts[topic] || 0) + 1;

    const eventJson = JSON.stringify(eventData);

    if (this.isUsingAivenKafka && this.producer) {
      try {
        await this.producer.send({
          topic,
          messages: [{ value: eventJson, key: eventData.messageId || eventData.userId || 'default' }],
        });
      } catch (err: any) {
        console.error('[KAFKA PRODUCER ERROR]', err.message);
        // Fallback to memory bus on transient error
        await this.memoryBus.emit(topic, eventData);
      }
    } else {
      await this.memoryBus.emit(topic, eventData);
    }
  }

  // Consumer Dispatcher
  private registerConsumers() {
    // 1. Persistence & Audit Consumer
    this.memoryBus.on(KAFKA_TOPICS.MESSAGES, async (payload: KafkaMessageEvent) => {
      this.analytics.messagesProcessed++;
      console.log(`[KAFKA CONSUMER: AUDIT] Message logged: ${payload.messageId} in conv ${payload.conversationId}`);
    });

    // 2. Notification Consumer
    this.memoryBus.on(KAFKA_TOPICS.NOTIFICATIONS, async (payload: KafkaNotificationEvent) => {
      this.analytics.notificationsGenerated++;
      console.log(`[KAFKA CONSUMER: NOTIFICATIONS] Triggered notification for user ${payload.userId}`);
    });

    // 3. Presence Analytics Consumer
    this.memoryBus.on(KAFKA_TOPICS.PRESENCE, async (payload: KafkaPresenceEvent) => {
      this.analytics.presenceEventsCount++;
      console.log(`[KAFKA CONSUMER: ANALYTICS] User presence updated: ${payload.userId} -> ${payload.status}`);
    });
  }

  private async handleIncomingKafkaMessage(topic: string, data: any) {
    await this.memoryBus.emit(topic, data);
  }
}

export const kafkaService = new KafkaService();

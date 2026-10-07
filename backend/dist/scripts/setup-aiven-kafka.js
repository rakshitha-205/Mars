"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const kafkajs_1 = require("kafkajs");
const kafka_1 = require("../kafka");
async function setupKafka() {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : [];
    const username = process.env.KAFKA_USERNAME;
    const password = process.env.KAFKA_PASSWORD;
    console.log('[KAFKA SETUP] Connecting to Aiven Kafka admin client...');
    const kafka = new kafkajs_1.Kafka({
        clientId: 'chatconnect-topic-setup',
        brokers,
        ssl: { rejectUnauthorized: false },
        sasl: username ? { mechanism: 'scram-sha-512', username, password: password || '' } : undefined,
        connectionTimeout: 10000,
    });
    const admin = kafka.admin();
    await admin.connect();
    console.log('✓ Admin connected!');
    const existingTopics = await admin.listTopics();
    console.log('Existing topics:', existingTopics);
    const desiredTopics = Object.values(kafka_1.KAFKA_TOPICS);
    const topicsToCreate = desiredTopics
        .filter((t) => !existingTopics.includes(t))
        .map((t) => ({
        topic: t,
        numPartitions: 3,
        replicationFactor: 1, // Or 2 depending on Aiven cluster tier
    }));
    if (topicsToCreate.length > 0) {
        console.log(`Creating ${topicsToCreate.length} missing topics:`, topicsToCreate.map((t) => t.topic));
        try {
            await admin.createTopics({
                topics: topicsToCreate,
                waitForLeaders: true,
            });
            console.log('✓ Successfully created Kafka topics!');
        }
        catch (err) {
            console.warn('Note on topic creation:', err.message);
            // If replication factor 1 failed or 2 needed, retry with default settings
            if (err.message.includes('replication factor')) {
                await admin.createTopics({
                    topics: desiredTopics
                        .filter((t) => !existingTopics.includes(t))
                        .map((t) => ({ topic: t, numPartitions: 1 })),
                    waitForLeaders: true,
                });
            }
        }
    }
    else {
        console.log('All required topics already exist!');
    }
    const finalTopics = await admin.listTopics();
    console.log('Final topics list in Aiven Kafka:', finalTopics);
    await admin.disconnect();
}
setupKafka()
    .then(() => process.exit(0))
    .catch((e) => {
    console.error('Kafka Setup Error:', e);
    process.exit(1);
});

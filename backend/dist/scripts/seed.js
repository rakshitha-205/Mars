"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
const repositories_1 = require("../repositories");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runSeed() {
    console.log('============================================================');
    console.log(' CHATCONNECT DATABASE SEEDING ROUTINE');
    console.log('============================================================');
    if (database_1.db.isUsingPostgres) {
        console.log('[DATABASE] Connecting to Aiven PostgreSQL...');
        const seedSqlPath = path_1.default.resolve(__dirname, '../../../database/seed/seed.sql');
        if (fs_1.default.existsSync(seedSqlPath)) {
            const sql = fs_1.default.readFileSync(seedSqlPath, 'utf8');
            console.log(`[SEED] Executing ${seedSqlPath}...`);
            await database_1.db.query(sql);
            console.log('✓ Successfully executed seed SQL in Aiven PostgreSQL!');
        }
        else {
            console.warn(`[SEED] Seed SQL file not found at ${seedSqlPath}`);
        }
    }
    else {
        console.log('[DATABASE] Running high-speed in-memory engine.');
        console.log('[SEED] Validating seeded users...');
        const users = ['mithun', 'rahul', 'ananya', 'kiran', 'priya'];
        for (const u of users) {
            const found = await repositories_1.userRepo.findByUsername(u);
            if (found) {
                console.log(`  ✓ User "${found.name}" (@${found.username}) ready.`);
            }
        }
        const convs = await repositories_1.convRepo.getUserConversations('usr_mithun');
        console.log(`  ✓ Seeded conversations for Mithun: ${convs.length} active threads.`);
        console.log('✓ In-memory database successfully initialized with demo seed data!');
    }
    console.log('============================================================');
    console.log(' SEEDING COMPLETE - Ready for Hackathon / Demonstration');
    console.log('============================================================');
}
runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('[SEED ERROR]', err);
    process.exit(1);
});

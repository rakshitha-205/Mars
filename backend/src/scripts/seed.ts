import { db } from '../database';
import { userRepo, convRepo, messageRepo } from '../repositories';
import fs from 'fs';
import path from 'path';

async function runSeed() {
  console.log('============================================================');
  console.log(' CHATCONNECT DATABASE SEEDING ROUTINE');
  console.log('============================================================');

  if (db.isUsingPostgres) {
    console.log('[DATABASE] Connecting to Aiven PostgreSQL...');
    const seedSqlPath = path.resolve(__dirname, '../../../database/seed/seed.sql');
    if (fs.existsSync(seedSqlPath)) {
      const sql = fs.readFileSync(seedSqlPath, 'utf8');
      console.log(`[SEED] Executing ${seedSqlPath}...`);
      await db.query(sql);
      console.log('✓ Successfully executed seed SQL in Aiven PostgreSQL!');
    } else {
      console.warn(`[SEED] Seed SQL file not found at ${seedSqlPath}`);
    }
  } else {
    console.log('[DATABASE] Running high-speed in-memory engine.');
    console.log('[SEED] Validating seeded users...');
    const users = ['mithun', 'rahul', 'ananya', 'kiran', 'priya'];
    for (const u of users) {
      const found = await userRepo.findByUsername(u);
      if (found) {
        console.log(`  ✓ User "${found.name}" (@${found.username}) ready.`);
      }
    }

    const convs = await convRepo.getUserConversations('usr_mithun');
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

import { Pool } from 'pg';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// Memory store fallback if remote Aiven PostgreSQL is not provided or during offline dev
export class MemoryDatabase {
  users = new Map<string, any>();
  conversations = new Map<string, any>();
  conversation_members = new Map<string, any>();
  messages = new Map<string, any>();
  message_reactions = new Map<string, any>();
  groups = new Map<string, any>();
  group_members = new Map<string, any>();
  notifications = new Map<string, any>();
  attachments = new Map<string, any>();
  bookmarks = new Map<string, any>();
  polls = new Map<string, any>();
  poll_options = new Map<string, any>();
  poll_votes = new Map<string, any>();
  group_tasks = new Map<string, any>();
  events = new Map<string, any>();
  user_settings = new Map<string, any>();

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    const now = new Date().toISOString();
    // Default development users
    const defaultUsers = [
      {
        id: 'usr_mithun',
        name: 'Mithun Gowda',
        username: 'mithun',
        email: 'mithun@chatconnect.app',
        // 'Password123!' bcrypt hash
        password_hash: '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y',
        profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        avatar_color: '#2563EB',
        bio: 'Building high-throughput real-time systems. ChatConnect Architect.',
        online_status: 'online',
        last_seen: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_rahul',
        name: 'Rahul Kumar',
        username: 'rahul',
        email: 'rahul@chatconnect.app',
        password_hash: '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y',
        profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        avatar_color: '#10B981',
        bio: 'Frontend engineer & UI enthusiast. Coffee lover.',
        online_status: 'online',
        last_seen: now,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_ananya',
        name: 'Ananya Sharma',
        username: 'ananya',
        email: 'ananya@chatconnect.app',
        password_hash: '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y',
        profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        avatar_color: '#EC4899',
        bio: 'Full-stack developer | Exploring event-driven architectures with Kafka.',
        online_status: 'away',
        last_seen: new Date(Date.now() - 15 * 60000).toISOString(),
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_kiran',
        name: 'Kiran Rao',
        username: 'kiran',
        email: 'kiran@chatconnect.app',
        password_hash: '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y',
        profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        avatar_color: '#F59E0B',
        bio: 'DevOps & Cloud Engineer | Keeping latency low with Valkey.',
        online_status: 'offline',
        last_seen: new Date(Date.now() - 120 * 60000).toISOString(),
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_priya',
        name: 'Priya Patel',
        username: 'priya',
        email: 'priya@chatconnect.app',
        password_hash: '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y',
        profile_photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        avatar_color: '#8B5CF6',
        bio: 'Product Designer & Material Design 3 practitioner.',
        online_status: 'online',
        last_seen: now,
        created_at: now,
        updated_at: now,
      },
    ];

    for (const u of defaultUsers) {
      this.users.set(u.id, u);
      this.user_settings.set(u.id, {
        id: `set_${u.id}`,
        user_id: u.id,
        theme: 'system',
        enter_to_send: true,
        show_timestamps: true,
        notification_preferences: '{"sound": true, "desktop": true, "email": false}',
        created_at: now,
        updated_at: now,
      });
    }

    // Direct Conversation: Mithun <-> Rahul
    const conv1 = {
      id: 'conv_mithun_rahul',
      type: 'direct',
      title: 'Rahul Kumar',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: now,
    };
    this.conversations.set(conv1.id, conv1);
    this.conversation_members.set('cm_1', { id: 'cm_1', conversation_id: conv1.id, user_id: 'usr_mithun', joined_at: now, last_read_message_id: 'msg_mr_2' });
    this.conversation_members.set('cm_2', { id: 'cm_2', conversation_id: conv1.id, user_id: 'usr_rahul', joined_at: now, last_read_message_id: 'msg_mr_2' });

    const msg1 = {
      id: 'msg_mr_1',
      conversation_id: conv1.id,
      sender_id: 'usr_mithun',
      message: 'Hey Rahul! Did you check out the new event-driven architecture using Kafka?',
      message_type: 'text',
      status: 'read',
      reply_to_message_id: null,
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 45 * 60000).toISOString(),
      deleted_at: null,
    };
    const msg2 = {
      id: 'msg_mr_2',
      conversation_id: conv1.id,
      sender_id: 'usr_rahul',
      message: 'Yes Mithun! The latency with Aiven Valkey presence is lightning fast! 🚀',
      message_type: 'text',
      status: 'read',
      reply_to_message_id: null,
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      updated_at: new Date(Date.now() - 40 * 60000).toISOString(),
      deleted_at: null,
    };
    this.messages.set(msg1.id, msg1);
    this.messages.set(msg2.id, msg2);

    // Group Conversation: BMSIT Project Team
    const conv2 = {
      id: 'conv_group_bmsit',
      type: 'group',
      title: 'BMSIT Project Team',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: now,
    };
    this.conversations.set(conv2.id, conv2);

    const grp = {
      id: 'grp_bmsit',
      conversation_id: conv2.id,
      name: 'BMSIT Project Team',
      description: 'Official coordination hub for ChatConnect real-time hackathon submission.',
      group_photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      created_by: 'usr_mithun',
      created_at: conv2.created_at,
      updated_at: now,
    };
    this.groups.set(grp.id, grp);

    const members = ['usr_mithun', 'usr_rahul', 'usr_ananya', 'usr_kiran', 'usr_priya'];
    members.forEach((uid, idx) => {
      this.group_members.set(`gm_${idx}`, {
        id: `gm_${idx}`,
        group_id: grp.id,
        user_id: uid,
        role: uid === 'usr_mithun' ? 'admin' : 'member',
        joined_at: conv2.created_at,
      });
      this.conversation_members.set(`cm_grp_${idx}`, {
        id: `cm_grp_${idx}`,
        conversation_id: conv2.id,
        user_id: uid,
        joined_at: conv2.created_at,
        last_read_message_id: 'msg_poll_1',
      });
    });

    const msgGrp1 = {
      id: 'msg_grp_1',
      conversation_id: conv2.id,
      sender_id: 'usr_mithun',
      message: 'Welcome everyone to the ChatConnect project group! Let us coordinate our hackathon demonstration here.',
      message_type: 'text',
      status: 'read',
      reply_to_message_id: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      deleted_at: null,
    };
    this.messages.set(msgGrp1.id, msgGrp1);

    // Group Poll
    const msgPoll = {
      id: 'msg_poll_1',
      conversation_id: conv2.id,
      sender_id: 'usr_mithun',
      message: 'Where should our team assemble for the pre-demo rehearsal?',
      message_type: 'poll',
      status: 'read',
      reply_to_message_id: null,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      deleted_at: null,
    };
    this.messages.set(msgPoll.id, msgPoll);

    const poll = {
      id: 'poll_1',
      message_id: msgPoll.id,
      question: 'Where should our team assemble for the pre-demo rehearsal?',
      created_at: msgPoll.created_at,
    };
    this.polls.set(poll.id, poll);
    this.poll_options.set('opt_1', { id: 'opt_1', poll_id: poll.id, option_text: 'Campus Central Library' });
    this.poll_options.set('opt_2', { id: 'opt_2', poll_id: poll.id, option_text: 'Innovation Lab 3' });
    this.poll_options.set('opt_3', { id: 'opt_3', poll_id: poll.id, option_text: 'Cafeteria Conference Room' });

    this.poll_votes.set('vote_1', { id: 'vote_1', poll_id: poll.id, option_id: 'opt_2', user_id: 'usr_mithun' });
    this.poll_votes.set('vote_2', { id: 'vote_2', poll_id: poll.id, option_id: 'opt_2', user_id: 'usr_rahul' });
    this.poll_votes.set('vote_3', { id: 'vote_3', poll_id: poll.id, option_id: 'opt_1', user_id: 'usr_ananya' });

    // Group Tasks
    this.group_tasks.set('tsk_1', {
      id: 'tsk_1',
      group_id: grp.id,
      title: 'Material Design 3 Theme Polish',
      description: 'Refine color tokens and smooth bubble transitions in DESIGN.md',
      assigned_to: 'usr_priya',
      status: 'completed',
      created_at: now,
      updated_at: now,
    });
    this.group_tasks.set('tsk_2', {
      id: 'tsk_2',
      group_id: grp.id,
      title: 'Kafka Event Streaming Pipeline',
      description: 'Verify topics chat.messages, chat.presence and consumers',
      assigned_to: 'usr_ananya',
      status: 'completed',
      created_at: now,
      updated_at: now,
    });
    this.group_tasks.set('tsk_3', {
      id: 'tsk_3',
      group_id: grp.id,
      title: 'Aiven Valkey Presence Caching',
      description: 'Configure TTL keys for online presence and typing heartbeat',
      assigned_to: 'usr_kiran',
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    });
    this.group_tasks.set('tsk_4', {
      id: 'tsk_4',
      group_id: grp.id,
      title: 'Live Dual-User Demonstration',
      description: 'Simulate User A (Mithun) & User B (Rahul) real-time exchange',
      assigned_to: 'usr_mithun',
      status: 'in_progress',
      created_at: now,
      updated_at: now,
    });

    // Group Event
    this.events.set('evt_1', {
      id: 'evt_1',
      group_id: grp.id,
      title: 'Final Hackathon Jury Presentation',
      description: 'Demonstrate human-to-human real-time chat, Aiven architecture, and live multi-user sync.',
      event_time: new Date(Date.now() + 86400000).toISOString(),
      location: 'Main Hackathon Stage / BMSIT Hall',
      created_by: 'usr_mithun',
      created_at: now,
    });
  }
}

class DatabaseManager {
  private pool: Pool | null = null;
  public memory: MemoryDatabase;
  public isUsingPostgres = false;

  constructor() {
    this.memory = new MemoryDatabase();
    this.initialize();
  }

  private async initialize() {
    if (config.database.url) {
      try {
        console.log('[DATABASE] Connecting to Aiven PostgreSQL...');
        const cleanUrl = config.database.url.replace(/[?&]sslmode=[^&]+/, '');
        this.pool = new Pool({
          connectionString: cleanUrl,
          ssl: { rejectUnauthorized: false },
          max: 20,
          idleTimeoutMillis: 30000,
        });

        const client = await this.pool.connect();
        const res = await client.query('SELECT NOW()');
        console.log('[DATABASE] Connected to Aiven PostgreSQL successfully at:', res.rows[0].now);
        client.release();
        this.isUsingPostgres = true;

        // Auto-run schema if tables do not exist
        await this.ensureSchema();
      } catch (err: any) {
        console.warn('[DATABASE] Aiven PostgreSQL connection failed or not available:', err.message);
        console.log('[DATABASE] Falling back to high-performance internal database engine.');
        this.isUsingPostgres = false;
      }
    } else {
      console.log('[DATABASE] No DATABASE_URL provided. Operating with high-performance internal database engine.');
      this.isUsingPostgres = false;
    }
  }

  private async ensureSchema() {
    if (!this.pool) return;
    try {
      const schemaPath = path.resolve(__dirname, '../../../database/schema/schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await this.pool.query(sql);
        console.log('[DATABASE] Aiven PostgreSQL schema applied.');
      }
    } catch (e: any) {
      console.warn('[DATABASE] Schema check warning:', e.message);
    }
  }

  public async query(text: string, params: any[] = []): Promise<any> {
    if (this.isUsingPostgres && this.pool) {
      return this.pool.query(text, params);
    }
    throw new Error('Using in-memory repository store.');
  }

  public getPool(): Pool | null {
    return this.pool;
  }
}

export const db = new DatabaseManager();

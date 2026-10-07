import { db } from '../database';
import {
  User,
  Conversation,
  Message,
  MessageReaction,
  Group,
  GroupMember,
  Notification,
  Poll,
  PollOption,
  PollVote,
  PollWithDetails,
  GroupTask,
  GroupEvent,
  Bookmark,
  UserSettings,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return db.memory.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0] || null;
    }
    for (const u of db.memory.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
      return res.rows[0] || null;
    }
    for (const u of db.memory.users.values()) {
      if (u.username.toLowerCase() === username.toLowerCase()) return u;
    }
    return null;
  }

  async create(user: Partial<User> & { password_hash: string }): Promise<User> {
    const id = user.id || `usr_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      name: user.name!,
      username: user.username!,
      email: user.email!,
      password_hash: user.password_hash,
      profile_photo: user.profile_photo || null,
      avatar_color: user.avatar_color || '#2563EB',
      bio: user.bio || 'Hey there! I am using ChatConnect.',
      online_status: 'online',
      last_seen: now,
      created_at: now,
      updated_at: now,
    };

    if (db.isUsingPostgres) {
      const res = await db.query(
        `INSERT INTO users (id, name, username, email, password_hash, profile_photo, avatar_color, bio, online_status, last_seen, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          newUser.id,
          newUser.name,
          newUser.username,
          newUser.email,
          newUser.password_hash,
          newUser.profile_photo,
          newUser.avatar_color,
          newUser.bio,
          newUser.online_status,
          newUser.last_seen,
          newUser.created_at,
          newUser.updated_at,
        ]
      );
      return res.rows[0];
    }

    db.memory.users.set(id, newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    const updated = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (db.isUsingPostgres) {
      const res = await db.query(
        `UPDATE users SET name=$1, bio=$2, profile_photo=$3, avatar_color=$4, online_status=$5, last_seen=$6, updated_at=$7 WHERE id=$8 RETURNING *`,
        [
          updated.name,
          updated.bio,
          updated.profile_photo,
          updated.avatar_color,
          updated.online_status,
          updated.last_seen,
          updated.updated_at,
          id,
        ]
      );
      return res.rows[0];
    }

    db.memory.users.set(id, updated);
    return updated;
  }

  async search(query: string, excludeUserId?: string): Promise<User[]> {
    const q = query.toLowerCase().trim();
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT id, name, username, email, profile_photo, avatar_color, bio, online_status, last_seen, created_at, updated_at
         FROM users
         WHERE (LOWER(name) LIKE $1 OR LOWER(username) LIKE $1) AND id != $2
         LIMIT 20`,
        [`%${q}%`, excludeUserId || '']
      );
      return res.rows;
    }

    const results: User[] = [];
    for (const u of db.memory.users.values()) {
      if (excludeUserId && u.id === excludeUserId) continue;
      if (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) {
        const { password_hash, ...safeUser } = u;
        results.push(safeUser as User);
      }
    }
    return results.slice(0, 20);
  }

  async getAll(): Promise<User[]> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT id, name, username, email, profile_photo, avatar_color, bio, online_status, last_seen, created_at, updated_at FROM users');
      return res.rows;
    }
    return Array.from(db.memory.users.values()).map(({ password_hash, ...u }) => u);
  }
}

export class ConversationRepository {
  async findById(id: string): Promise<Conversation | null> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM conversations WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return db.memory.conversations.get(id) || null;
  }

  async getMembers(conversationId: string): Promise<User[]> {
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT u.id, u.name, u.username, u.email, u.profile_photo, u.avatar_color, u.bio, u.online_status, u.last_seen, u.created_at, u.updated_at
         FROM conversation_members cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.conversation_id = $1`,
        [conversationId]
      );
      return res.rows;
    }

    const members: User[] = [];
    for (const cm of db.memory.conversation_members.values()) {
      if (cm.conversation_id === conversationId) {
        const u = db.memory.users.get(cm.user_id);
        if (u) {
          const { password_hash, ...safe } = u;
          members.push(safe as User);
        }
      }
    }
    return members;
  }

  async findDirect(userId1: string, userId2: string): Promise<Conversation | null> {
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT c.* FROM conversations c
         JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = $1
         JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = $2
         WHERE c.type = 'direct'`,
        [userId1, userId2]
      );
      return res.rows[0] || null;
    }

    for (const conv of db.memory.conversations.values()) {
      if (conv.type === 'direct') {
        const memberIds = Array.from(db.memory.conversation_members.values())
          .filter((cm) => cm.conversation_id === conv.id)
          .map((cm) => cm.user_id);
        if (memberIds.includes(userId1) && memberIds.includes(userId2)) {
          return conv;
        }
      }
    }
    return null;
  }

  async createDirect(userId1: string, userId2: string): Promise<Conversation> {
    const existing = await this.findDirect(userId1, userId2);
    if (existing) return existing;

    const id = `conv_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const conv: Conversation = {
      id,
      type: 'direct',
      title: null,
      created_at: now,
      updated_at: now,
    };

    if (db.isUsingPostgres) {
      await db.query(`INSERT INTO conversations (id, type, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`, [
        conv.id,
        conv.type,
        conv.title,
        conv.created_at,
        conv.updated_at,
      ]);
      await db.query(
        `INSERT INTO conversation_members (id, conversation_id, user_id, joined_at) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
        [`cm_${uuidv4().substring(0, 8)}`, id, userId1, now, `cm_${uuidv4().substring(0, 8)}`, id, userId2, now]
      );
      return conv;
    }

    db.memory.conversations.set(id, conv);
    db.memory.conversation_members.set(`cm_${id}_1`, { id: `cm_${id}_1`, conversation_id: id, user_id: userId1, joined_at: now, last_read_message_id: null });
    db.memory.conversation_members.set(`cm_${id}_2`, { id: `cm_${id}_2`, conversation_id: id, user_id: userId2, joined_at: now, last_read_message_id: null });
    return conv;
  }

  async createGroup(name: string, description: string | null, creatorId: string, memberIds: string[], groupPhoto?: string | null): Promise<{ conversation: Conversation; group: Group }> {
    const convId = `conv_grp_${uuidv4().substring(0, 8)}`;
    const grpId = `grp_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const conversation: Conversation = {
      id: convId,
      type: 'group',
      title: name,
      created_at: now,
      updated_at: now,
    };

    const group: Group = {
      id: grpId,
      conversation_id: convId,
      name,
      description,
      group_photo: groupPhoto || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      created_by: creatorId,
      created_at: now,
      updated_at: now,
    };

    const allMembers = Array.from(new Set([creatorId, ...memberIds]));

    if (db.isUsingPostgres) {
      await db.query(`INSERT INTO conversations (id, type, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`, [
        convId,
        'group',
        name,
        now,
        now,
      ]);
      await db.query(
        `INSERT INTO groups (id, conversation_id, name, description, group_photo, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [grpId, convId, name, description, group.group_photo, creatorId, now, now]
      );

      for (const m of allMembers) {
        await db.query(`INSERT INTO conversation_members (id, conversation_id, user_id, joined_at) VALUES ($1, $2, $3, $4)`, [
          `cm_${uuidv4().substring(0, 8)}`,
          convId,
          m,
          now,
        ]);
        await db.query(`INSERT INTO group_members (id, group_id, user_id, role, joined_at) VALUES ($1, $2, $3, $4, $5)`, [
          `gm_${uuidv4().substring(0, 8)}`,
          grpId,
          m,
          m === creatorId ? 'admin' : 'member',
          now,
        ]);
      }

      return { conversation, group };
    }

    db.memory.conversations.set(convId, conversation);
    db.memory.groups.set(grpId, group);

    allMembers.forEach((m, idx) => {
      db.memory.conversation_members.set(`cm_${convId}_${idx}`, {
        id: `cm_${convId}_${idx}`,
        conversation_id: convId,
        user_id: m,
        joined_at: now,
        last_read_message_id: null,
      });
      db.memory.group_members.set(`gm_${grpId}_${idx}`, {
        id: `gm_${grpId}_${idx}`,
        group_id: grpId,
        user_id: m,
        role: m === creatorId ? 'admin' : 'member',
        joined_at: now,
      });
    });

    return { conversation, group };
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT c.* FROM conversations c
         JOIN conversation_members cm ON c.id = cm.conversation_id
         WHERE cm.user_id = $1
         ORDER BY c.updated_at DESC`,
        [userId]
      );
      return res.rows;
    }

    const myConvIds = Array.from(db.memory.conversation_members.values())
      .filter((cm) => cm.user_id === userId)
      .map((cm) => cm.conversation_id);

    const list: Conversation[] = [];
    for (const id of myConvIds) {
      const c = db.memory.conversations.get(id);
      if (c) list.push(c);
    }

    return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }
}

export class MessageRepository {
  async findById(id: string): Promise<Message | null> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM messages WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return db.memory.messages.get(id) || null;
  }

  async create(msg: Partial<Message>): Promise<Message> {
    const id = msg.id || `msg_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const newMsg: Message = {
      id,
      conversation_id: msg.conversation_id!,
      sender_id: msg.sender_id!,
      message: msg.message!,
      message_type: msg.message_type || 'text',
      status: msg.status || 'sent',
      reply_to_message_id: msg.reply_to_message_id || null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    if (db.isUsingPostgres) {
      await db.query(
        `INSERT INTO messages (id, conversation_id, sender_id, message, message_type, status, reply_to_message_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newMsg.id,
          newMsg.conversation_id,
          newMsg.sender_id,
          newMsg.message,
          newMsg.message_type,
          newMsg.status,
          newMsg.reply_to_message_id,
          newMsg.created_at,
          newMsg.updated_at,
        ]
      );
      await db.query(`UPDATE conversations SET updated_at = $1 WHERE id = $2`, [now, newMsg.conversation_id]);
      return newMsg;
    }

    db.memory.messages.set(id, newMsg);
    const conv = db.memory.conversations.get(newMsg.conversation_id);
    if (conv) {
      conv.updated_at = now;
      db.memory.conversations.set(conv.id, conv);
    }
    return newMsg;
  }

  async getHistory(conversationId: string, limit = 50): Promise<Message[]> {
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT m.*, u.name as sender_name, u.username as sender_username, u.profile_photo as sender_photo, u.avatar_color as sender_color
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
         ORDER BY m.created_at ASC
         LIMIT $2`,
        [conversationId, limit]
      );
      return res.rows;
    }

    const list: Message[] = [];
    for (const m of db.memory.messages.values()) {
      if (m.conversation_id === conversationId && !m.deleted_at) {
        const sender = db.memory.users.get(m.sender_id);
        const reactions = Array.from(db.memory.message_reactions.values()).filter((r) => r.message_id === m.id);
        list.push({
          ...m,
          sender: sender ? { ...sender, password_hash: undefined } : undefined,
          reactions,
        });
      }
    }

    return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(-limit);
  }

  async update(id: string, text: string): Promise<Message | null> {
    const msg = await this.findById(id);
    if (!msg) return null;
    const now = new Date().toISOString();

    if (db.isUsingPostgres) {
      const res = await db.query(`UPDATE messages SET message = $1, updated_at = $2 WHERE id = $3 RETURNING *`, [text, now, id]);
      return res.rows[0];
    }

    msg.message = text;
    msg.updated_at = now;
    db.memory.messages.set(id, msg);
    return msg;
  }

  async delete(id: string): Promise<boolean> {
    const msg = await this.findById(id);
    if (!msg) return false;
    const now = new Date().toISOString();

    if (db.isUsingPostgres) {
      await db.query(`UPDATE messages SET deleted_at = $1 WHERE id = $2`, [now, id]);
      return true;
    }

    msg.deleted_at = now;
    db.memory.messages.set(id, msg);
    return true;
  }

  async updateStatus(conversationId: string, currentUserId: string, status: 'delivered' | 'read') {
    if (db.isUsingPostgres) {
      await db.query(`UPDATE messages SET status = $1 WHERE conversation_id = $2 AND sender_id != $3 AND status != 'read'`, [status, conversationId, currentUserId]);
      return;
    }

    for (const m of db.memory.messages.values()) {
      if (m.conversation_id === conversationId && m.sender_id !== currentUserId && m.status !== 'read') {
        m.status = status;
        db.memory.messages.set(m.id, m);
      }
    }
  }

  async addReaction(messageId: string, userId: string, reaction: string): Promise<MessageReaction> {
    const id = `rx_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const rx: MessageReaction = {
      id,
      message_id: messageId,
      user_id: userId,
      reaction,
      created_at: now,
    };

    if (db.isUsingPostgres) {
      await db.query(
        `INSERT INTO message_reactions (id, message_id, user_id, reaction, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (message_id, user_id, reaction) DO NOTHING`,
        [id, messageId, userId, reaction, now]
      );
      return rx;
    }

    db.memory.message_reactions.set(`${messageId}_${userId}_${reaction}`, rx);
    return rx;
  }

  async removeReaction(messageId: string, userId: string, reaction: string): Promise<boolean> {
    if (db.isUsingPostgres) {
      await db.query(`DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND reaction = $3`, [messageId, userId, reaction]);
      return true;
    }

    db.memory.message_reactions.delete(`${messageId}_${userId}_${reaction}`);
    return true;
  }
}

export class GroupRepository {
  async findByConversationId(conversationId: string): Promise<Group | null> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM groups WHERE conversation_id = $1', [conversationId]);
      return res.rows[0] || null;
    }
    for (const g of db.memory.groups.values()) {
      if (g.conversation_id === conversationId) return g;
    }
    return null;
  }

  async getMembers(groupId: string): Promise<GroupMember[]> {
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT gm.*, u.name, u.username, u.profile_photo, u.avatar_color, u.online_status
         FROM group_members gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1`,
        [groupId]
      );
      return res.rows;
    }

    const members: GroupMember[] = [];
    for (const gm of db.memory.group_members.values()) {
      if (gm.group_id === groupId) {
        const u = db.memory.users.get(gm.user_id);
        members.push({
          ...gm,
          user: u ? { ...u, password_hash: undefined } : undefined,
        });
      }
    }
    return members;
  }

  async getTasks(groupId: string): Promise<GroupTask[]> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM group_tasks WHERE group_id = $1 ORDER BY created_at ASC', [groupId]);
      return res.rows;
    }
    return Array.from(db.memory.group_tasks.values()).filter((t) => t.group_id === groupId);
  }

  async createTask(groupId: string, title: string, description: string | null, assignedTo: string | null): Promise<GroupTask> {
    const id = `tsk_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const task: GroupTask = {
      id,
      group_id: groupId,
      title,
      description,
      assigned_to: assignedTo,
      status: 'todo',
      created_at: now,
      updated_at: now,
    };

    if (db.isUsingPostgres) {
      await db.query(`INSERT INTO group_tasks (id, group_id, title, description, assigned_to, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
        id,
        groupId,
        title,
        description,
        assignedTo,
        'todo',
        now,
        now,
      ]);
      return task;
    }

    db.memory.group_tasks.set(id, task);
    return task;
  }

  async updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'completed'): Promise<GroupTask | null> {
    const now = new Date().toISOString();
    if (db.isUsingPostgres) {
      const res = await db.query(`UPDATE group_tasks SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *`, [status, now, taskId]);
      return res.rows[0] || null;
    }

    const t = db.memory.group_tasks.get(taskId);
    if (!t) return null;
    t.status = status;
    t.updated_at = now;
    db.memory.group_tasks.set(taskId, t);
    return t;
  }

  async getEvents(groupId: string): Promise<GroupEvent[]> {
    if (db.isUsingPostgres) {
      const res = await db.query('SELECT * FROM events WHERE group_id = $1 ORDER BY event_time ASC', [groupId]);
      return res.rows;
    }
    return Array.from(db.memory.events.values()).filter((e) => e.group_id === groupId);
  }

  async createEvent(groupId: string, title: string, description: string | null, eventTime: string, location: string | null, createdBy: string): Promise<GroupEvent> {
    const id = `evt_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const ev: GroupEvent = {
      id,
      group_id: groupId,
      title,
      description,
      event_time: eventTime,
      location,
      created_by: createdBy,
      created_at: now,
    };

    if (db.isUsingPostgres) {
      await db.query(`INSERT INTO events (id, group_id, title, description, event_time, location, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
        id,
        groupId,
        title,
        description,
        eventTime,
        location,
        createdBy,
        now,
      ]);
      return ev;
    }

    db.memory.events.set(id, ev);
    return ev;
  }
}

export class PollRepository {
  async getPollByMessageId(messageId: string, currentUserId?: string): Promise<PollWithDetails | null> {
    if (db.isUsingPostgres) {
      const pRes = await db.query('SELECT * FROM polls WHERE message_id = $1', [messageId]);
      if (!pRes.rows[0]) return null;
      const poll = pRes.rows[0];

      const optRes = await db.query('SELECT * FROM poll_options WHERE poll_id = $1', [poll.id]);
      const voteRes = await db.query('SELECT * FROM poll_votes WHERE poll_id = $1', [poll.id]);

      const options = optRes.rows.map((opt: any) => ({
        id: opt.id,
        poll_id: opt.poll_id,
        option_text: opt.option_text,
        votes_count: voteRes.rows.filter((v: any) => v.option_id === opt.id).length,
        voted_by_me: currentUserId ? voteRes.rows.some((v: any) => v.option_id === opt.id && v.user_id === currentUserId) : false,
      }));

      return {
        ...poll,
        options,
        total_votes: voteRes.rows.length,
      };
    }

    let poll: Poll | null = null;
    for (const p of db.memory.polls.values()) {
      if (p.message_id === messageId) {
        poll = p;
        break;
      }
    }
    if (!poll) return null;

    const allOptions = Array.from(db.memory.poll_options.values()).filter((o) => o.poll_id === poll!.id);
    const allVotes = Array.from(db.memory.poll_votes.values()).filter((v) => v.poll_id === poll!.id);

    const options = allOptions.map((opt) => ({
      ...opt,
      votes_count: allVotes.filter((v) => v.option_id === opt.id).length,
      voted_by_me: currentUserId ? allVotes.some((v) => v.option_id === opt.id && v.user_id === currentUserId) : false,
    }));

    return {
      ...poll,
      options,
      total_votes: allVotes.length,
    };
  }

  async vote(pollId: string, optionId: string, userId: string): Promise<boolean> {
    if (db.isUsingPostgres) {
      await db.query(
        `INSERT INTO poll_votes (id, poll_id, option_id, user_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (poll_id, user_id) DO UPDATE SET option_id = $3`,
        [`vote_${uuidv4().substring(0, 8)}`, pollId, optionId, userId]
      );
      return true;
    }

    // Remove previous vote by this user on this poll
    for (const [key, v] of db.memory.poll_votes.entries()) {
      if (v.poll_id === pollId && v.user_id === userId) {
        db.memory.poll_votes.delete(key);
      }
    }

    db.memory.poll_votes.set(`vote_${pollId}_${userId}`, {
      id: `vote_${uuidv4().substring(0, 8)}`,
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    });

    return true;
  }
}

export class NotificationRepository {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    if (db.isUsingPostgres) {
      const res = await db.query(
        `SELECT n.*, u.name as sender_name, u.avatar_color as sender_color, u.profile_photo as sender_photo
         FROM notifications n
         LEFT JOIN users u ON n.sender_id = u.id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC LIMIT 50`,
        [userId]
      );
      return res.rows;
    }

    const list: Notification[] = [];
    for (const n of db.memory.notifications.values()) {
      if (n.user_id === userId) {
        const sender = n.sender_id ? db.memory.users.get(n.sender_id) : undefined;
        list.push({ ...n, sender });
      }
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async create(notif: Partial<Notification>): Promise<Notification> {
    const id = notif.id || `notif_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    const newNotif: Notification = {
      id,
      user_id: notif.user_id!,
      sender_id: notif.sender_id || null,
      message_id: notif.message_id || null,
      type: notif.type!,
      is_read: false,
      created_at: now,
    };

    if (db.isUsingPostgres) {
      await db.query(`INSERT INTO notifications (id, user_id, sender_id, message_id, type, is_read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
        newNotif.id,
        newNotif.user_id,
        newNotif.sender_id,
        newNotif.message_id,
        newNotif.type,
        newNotif.is_read,
        newNotif.created_at,
      ]);
      return newNotif;
    }

    db.memory.notifications.set(id, newNotif);
    return newNotif;
  }

  async markAsRead(id: string): Promise<boolean> {
    if (db.isUsingPostgres) {
      await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
      return true;
    }
    const n = db.memory.notifications.get(id);
    if (n) {
      n.is_read = true;
      db.memory.notifications.set(id, n);
    }
    return true;
  }
}

export const userRepo = new UserRepository();
export const convRepo = new ConversationRepository();
export const messageRepo = new MessageRepository();
export const groupRepo = new GroupRepository();
export const pollRepo = new PollRepository();
export const notificationRepo = new NotificationRepository();

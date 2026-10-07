-- ============================================================
-- CHATCONNECT DATABASE SCHEMA (Aiven PostgreSQL)
-- Complete 16-table Schema with Indexes, Foreign Keys & Cascades
-- ============================================================

-- Enable UUID extension if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_photo TEXT,
    avatar_color VARCHAR(30) DEFAULT '#2563EB',
    bio TEXT DEFAULT 'Hey there! I am using ChatConnect.',
    online_status VARCHAR(20) DEFAULT 'offline' CHECK (online_status IN ('online', 'away', 'busy', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_online_status ON users(online_status);

-- 2. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    title VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 3. CONVERSATION_MEMBERS
CREATE TABLE IF NOT EXISTS conversation_members (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id VARCHAR(64),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON conversation_members(conversation_id);

-- 4. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'poll', 'task', 'event')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    reply_to_message_id VARCHAR(64) REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- 5. MESSAGE_REACTIONS
CREATE TABLE IF NOT EXISTS message_reactions (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);

-- 6. GROUPS
CREATE TABLE IF NOT EXISTS groups (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    group_photo TEXT,
    created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_groups_conv ON groups(conversation_id);

-- 7. GROUP_MEMBERS
CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    message_id VARCHAR(64) REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifs_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifs_created ON notifications(created_at DESC);

-- 9. ATTACHMENTS
CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attachments_msg ON attachments(message_id);

-- 10. BOOKMARKS
CREATE TABLE IF NOT EXISTS bookmarks (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id VARCHAR(64) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- 11. POLLS
CREATE TABLE IF NOT EXISTS polls (
    id VARCHAR(64) PRIMARY KEY,
    message_id VARCHAR(64) NOT NULL UNIQUE REFERENCES messages(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. POLL_OPTIONS
CREATE TABLE IF NOT EXISTS poll_options (
    id VARCHAR(64) PRIMARY KEY,
    poll_id VARCHAR(64) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);

-- 13. POLL_VOTES
CREATE TABLE IF NOT EXISTS poll_votes (
    id VARCHAR(64) PRIMARY KEY,
    poll_id VARCHAR(64) NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id VARCHAR(64) NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);

-- 14. GROUP_TASKS
CREATE TABLE IF NOT EXISTS group_tasks (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_group ON group_tasks(group_id);

-- 15. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    created_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_id);

-- 16. USER_SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    enter_to_send BOOLEAN DEFAULT TRUE,
    show_timestamps BOOLEAN DEFAULT TRUE,
    notification_preferences TEXT DEFAULT '{"sound": true, "desktop": true, "email": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

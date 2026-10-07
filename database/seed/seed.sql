-- ============================================================
-- CHATCONNECT DATABASE SEED DATA (Development / Hackathon Demo)
-- Development Users: Mithun, Rahul, Ananya, Kiran, Priya
-- Passwords are all hashed for 'Password123!' with bcrypt
-- ============================================================

-- 1. USERS
-- Default bcrypt hash for 'Password123!' (cost 10): $2b$10$wT8m9sO.xMh/R5o3n4q3neI5WqjHqLz4l3C1x9H3O9P1X5X8yT1Ky
INSERT INTO users (id, name, username, email, password_hash, profile_photo, avatar_color, bio, online_status, last_seen, created_at, updated_at)
VALUES
('usr_mithun', 'Mithun Gowda', 'mithun', 'mithun@chatconnect.app', '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '#2563EB', 'Building high-throughput real-time systems. ChatConnect Architect.', 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_rahul', 'Rahul Kumar', 'rahul', 'rahul@chatconnect.app', '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '#10B981', 'Frontend engineer & UI enthusiast. Coffee lover.', 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_ananya', 'Ananya Sharma', 'ananya', 'ananya@chatconnect.app', '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '#EC4899', 'Full-stack developer | Exploring event-driven architectures with Kafka.', 'away', CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_kiran', 'Kiran Rao', 'kiran', 'kiran@chatconnect.app', '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '#F59E0B', 'DevOps & Cloud Engineer | Keeping latency low with Valkey.', 'offline', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('usr_priya', 'Priya Patel', 'priya', 'priya@chatconnect.app', '$2a$10$q/1cO2TRr4oa.whnlofDsumLwjQ8WpEgxfVtOBSqFEGdv5yQIlB/y', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', '#8B5CF6', 'Product Designer & Material Design 3 practitioner.', 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. USER SETTINGS
INSERT INTO user_settings (id, user_id, theme, enter_to_send, show_timestamps, notification_preferences)
VALUES
('set_mithun', 'usr_mithun', 'system', TRUE, TRUE, '{"sound": true, "desktop": true, "email": false}'),
('set_rahul', 'usr_rahul', 'dark', TRUE, TRUE, '{"sound": true, "desktop": true, "email": false}'),
('set_ananya', 'usr_ananya', 'light', TRUE, TRUE, '{"sound": true, "desktop": true, "email": false}'),
('set_kiran', 'usr_kiran', 'system', TRUE, TRUE, '{"sound": true, "desktop": true, "email": false}'),
('set_priya', 'usr_priya', 'system', TRUE, TRUE, '{"sound": true, "desktop": true, "email": false}')
ON CONFLICT (id) DO NOTHING;

-- 3. DIRECT CONVERSATION (Mithun <-> Rahul)
INSERT INTO conversations (id, type, title, created_at, updated_at)
VALUES
('conv_mithun_rahul', 'direct', 'Rahul Kumar', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_members (id, conversation_id, user_id, joined_at)
VALUES
('cm_mr_1', 'conv_mithun_rahul', 'usr_mithun', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('cm_mr_2', 'conv_mithun_rahul', 'usr_rahul', CURRENT_TIMESTAMP - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Messages between Mithun & Rahul
INSERT INTO messages (id, conversation_id, sender_id, message, message_type, status, created_at, updated_at)
VALUES
('msg_mr_1', 'conv_mithun_rahul', 'usr_mithun', 'Hey Rahul! Did you check out the new event-driven architecture using Kafka?', 'text', 'read', CURRENT_TIMESTAMP - INTERVAL '45 minutes', CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
('msg_mr_2', 'conv_mithun_rahul', 'usr_rahul', 'Yes Mithun! The latency with Aiven Valkey presence is lightning fast! 🚀', 'text', 'read', CURRENT_TIMESTAMP - INTERVAL '40 minutes', CURRENT_TIMESTAMP - INTERVAL '40 minutes')
ON CONFLICT (id) DO NOTHING;

-- 4. GROUP CONVERSATION (BMSIT Project Team)
INSERT INTO conversations (id, type, title, created_at, updated_at)
VALUES
('conv_group_bmsit', 'group', 'BMSIT Project Team', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO groups (id, conversation_id, name, description, group_photo, created_by, created_at, updated_at)
VALUES
('grp_bmsit', 'conv_group_bmsit', 'BMSIT Project Team', 'Official coordination hub for ChatConnect real-time hackathon submission.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150', 'usr_mithun', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

INSERT INTO group_members (id, group_id, user_id, role, joined_at)
VALUES
('gm_1', 'grp_bmsit', 'usr_mithun', 'admin', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('gm_2', 'grp_bmsit', 'usr_rahul', 'member', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('gm_3', 'grp_bmsit', 'usr_ananya', 'member', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('gm_4', 'grp_bmsit', 'usr_kiran', 'member', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('gm_5', 'grp_bmsit', 'usr_priya', 'member', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO conversation_members (id, conversation_id, user_id, joined_at)
VALUES
('cm_grp_1', 'conv_group_bmsit', 'usr_mithun', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cm_grp_2', 'conv_group_bmsit', 'usr_rahul', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cm_grp_3', 'conv_group_bmsit', 'usr_ananya', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cm_grp_4', 'conv_group_bmsit', 'usr_kiran', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cm_grp_5', 'conv_group_bmsit', 'usr_priya', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Group Welcome Message
INSERT INTO messages (id, conversation_id, sender_id, message, message_type, status, created_at, updated_at)
VALUES
('msg_grp_1', 'conv_group_bmsit', 'usr_mithun', 'Welcome everyone to the ChatConnect project group! Let us coordinate our hackathon demonstration here.', 'text', 'read', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Group Tasks
INSERT INTO group_tasks (id, group_id, title, description, assigned_to, status, created_at, updated_at)
VALUES
('tsk_1', 'grp_bmsit', 'Material Design 3 Theme Polish', 'Refine color tokens and smooth bubble transitions in DESIGN.md', 'usr_priya', 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP),
('tsk_2', 'grp_bmsit', 'Kafka Event Streaming Pipeline', 'Verify topics chat.messages, chat.presence and consumers', 'usr_ananya', 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP),
('tsk_3', 'grp_bmsit', 'Aiven Valkey Presence Caching', 'Configure TTL keys for online presence and typing heartbeat', 'usr_kiran', 'in_progress', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP),
('tsk_4', 'grp_bmsit', 'Live Dual-User Demonstration', 'Simulate User A (Mithun) & User B (Rahul) real-time exchange', 'usr_mithun', 'in_progress', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Group Event Card
INSERT INTO events (id, group_id, title, description, event_time, location, created_by, created_at)
VALUES
('evt_1', 'grp_bmsit', 'Final Hackathon Jury Presentation', 'Demonstrate human-to-human real-time chat, Aiven architecture, and live multi-user sync.', CURRENT_TIMESTAMP + INTERVAL '1 day', 'Main Hackathon Stage / BMSIT Hall', 'usr_mithun', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Sample Poll
INSERT INTO messages (id, conversation_id, sender_id, message, message_type, status, created_at, updated_at)
VALUES
('msg_poll_1', 'conv_group_bmsit', 'usr_mithun', 'Where should our team assemble for the pre-demo rehearsal?', 'poll', 'read', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO polls (id, message_id, question, created_at)
VALUES
('poll_1', 'msg_poll_1', 'Where should our team assemble for the pre-demo rehearsal?', CURRENT_TIMESTAMP - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO poll_options (id, poll_id, option_text)
VALUES
('opt_1', 'poll_1', 'Campus Central Library'),
('opt_2', 'poll_1', 'Innovation Lab 3'),
('opt_3', 'poll_1', 'Cafeteria Conference Room')
ON CONFLICT (id) DO NOTHING;

INSERT INTO poll_votes (id, poll_id, option_id, user_id)
VALUES
('vote_1', 'poll_1', 'opt_2', 'usr_mithun'),
('vote_2', 'poll_1', 'opt_2', 'usr_rahul'),
('vote_3', 'poll_1', 'opt_1', 'usr_ananya')
ON CONFLICT (id) DO NOTHING;

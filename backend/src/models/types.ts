// ============================================================
// CHATCONNECT DATA MODELS & TYPES (16 Database Entities)
// ============================================================

export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';
export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'poll' | 'task' | 'event';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type GroupRole = 'admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type ThemeMode = 'light' | 'dark' | 'system';

// 1. User
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash?: string;
  profile_photo: string | null;
  avatar_color: string;
  bio: string;
  online_status: OnlineStatus;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

// 2. Conversation
export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  created_at: string;
  updated_at: string;
  // Extended view fields
  last_message?: Message | null;
  unread_count?: number;
  participants?: User[];
  group_info?: Group | null;
}

// 3. ConversationMember
export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_message_id: string | null;
}

// 4. Message
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  message_type: MessageType;
  status: MessageStatus;
  reply_to_message_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Extended view fields
  sender?: User;
  reactions?: MessageReaction[];
  reply_to?: Message | null;
  attachments?: Attachment[];
  poll?: PollWithDetails | null;
  task?: GroupTask | null;
  event?: GroupEvent | null;
}

// 5. MessageReaction
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  username?: string;
}

// 6. Group
export interface Group {
  id: string;
  conversation_id: string;
  name: string;
  description: string | null;
  group_photo: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  members_count?: number;
  online_count?: number;
}

// 7. GroupMember
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user?: User;
}

// 8. Notification
export interface Notification {
  id: string;
  user_id: string;
  sender_id: string | null;
  message_id: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

// 9. Attachment
export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

// 10. Bookmark
export interface Bookmark {
  id: string;
  user_id: string;
  message_id: string;
  created_at: string;
  message?: Message;
}

// 11-13. Polls
export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count?: number;
  voted_by_me?: boolean;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
}

export interface Poll {
  id: string;
  message_id: string;
  question: string;
  created_at: string;
}

export interface PollWithDetails extends Poll {
  options: PollOption[];
  total_votes: number;
}

// 14. GroupTask
export interface GroupTask {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  assignee?: User;
}

// 15. GroupEvent
export interface GroupEvent {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  event_time: string;
  location: string | null;
  created_by: string;
  created_at: string;
  creator?: User;
}

// 16. UserSettings
export interface UserSettings {
  id: string;
  user_id: string;
  theme: ThemeMode;
  enter_to_send: boolean;
  show_timestamps: boolean;
  notification_preferences: string;
  created_at: string;
  updated_at: string;
}

// WebSocket & Kafka Event Payloads
export interface ChatEventPayload<T = any> {
  event: string;
  timestamp: string;
  data: T;
  source: string;
}

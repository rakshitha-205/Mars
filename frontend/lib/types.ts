export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';
export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'poll' | 'task' | 'event';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type GroupRole = 'admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  profile_photo: string | null;
  avatar_color: string;
  bio: string;
  online_status: OnlineStatus;
  last_seen: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message?: Message | null;
  unread_count?: number;
  participants?: User[];
  group_info?: Group | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes_count?: number;
  voted_by_me?: boolean;
}

export interface PollWithDetails {
  id: string;
  message_id: string;
  question: string;
  created_at: string;
  options: PollOption[];
  total_votes: number;
}

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
  sender?: User;
  reactions?: MessageReaction[];
  reply_to?: Message | null;
  poll?: PollWithDetails | null;
  task?: GroupTask | null;
  event?: GroupEvent | null;
}

export interface Group {
  id: string;
  conversation_id: string;
  name: string;
  description: string | null;
  group_photo: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user?: User;
}

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

export interface GroupEvent {
  id: string;
  group_id: string;
  title: string;
  description: string | null;
  event_time: string;
  location: string | null;
  created_by: string;
  created_at: string;
}

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

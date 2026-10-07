/**
 * ChatConnect API Client
 * Configured for multi-service Vercel deployment with service bindings
 */

function getApiBaseUrl(): string {
  // 1. Server-side in Vercel: Use the service binding injected into BACKEND_URL
  if (typeof window === 'undefined' && process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  // 2. Explicit public URL if configured
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // 3. Client-side in browser: Empty string (relative paths route via Vercel rewrites)
  if (typeof window !== 'undefined') {
    return '';
  }
  // 4. Server-side local dev fallback
  return 'http://localhost:5000';
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return normalizedPath;
  }
  try {
    return new URL(normalizedPath, base).toString();
  } catch {
    return `${base.replace(/\/$/, '')}${normalizedPath}`;
  }
}

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chatconnect_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Auth
  async login(identifier: string, password: string) {
    const res = await fetch(buildApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async register(data: { name: string; username: string; email: string; password: string; avatarColor?: string; profilePhoto?: string }) {
    const res = await fetch(buildApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(buildApiUrl('/api/auth/me'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Users
  async searchUsers(query: string) {
    const res = await fetch(buildApiUrl(`/api/users/search?q=${encodeURIComponent(query)}`), { headers: getHeaders() });
    return res.json();
  },

  async getAllUsers() {
    const res = await fetch(buildApiUrl('/api/users'), { headers: getHeaders() });
    return res.json();
  },

  // Conversations
  async getConversations() {
    const res = await fetch(buildApiUrl('/api/conversations'), { headers: getHeaders() });
    return res.json();
  },

  async createDirectChat(recipientId: string) {
    const res = await fetch(buildApiUrl('/api/conversations'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type: 'direct', recipientId }),
    });
    return res.json();
  },

  async createGroupChat(data: { title: string; description?: string; memberIds: string[]; groupPhoto?: string }) {
    const res = await fetch(buildApiUrl('/api/conversations'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type: 'group', ...data }),
    });
    return res.json();
  },

  // Messages
  async getMessages(conversationId: string, limit = 50) {
    const res = await fetch(buildApiUrl(`/api/conversations/${conversationId}/messages?limit=${limit}`), { headers: getHeaders() });
    return res.json();
  },

  async sendMessage(data: { conversationId: string; message: string; messageType?: string; replyToMessageId?: string; pollQuestion?: string; pollOptions?: string[] }) {
    const res = await fetch(buildApiUrl('/api/messages'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async editMessage(messageId: string, message: string) {
    const res = await fetch(buildApiUrl(`/api/messages/${messageId}`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    return res.json();
  },

  async deleteMessage(messageId: string) {
    const res = await fetch(buildApiUrl(`/api/messages/${messageId}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Tasks & Events
  async getGroupTasks(groupId: string) {
    const res = await fetch(buildApiUrl(`/api/groups/${groupId}/tasks`), { headers: getHeaders() });
    return res.json();
  },

  async createGroupTask(groupId: string, data: { title: string; description?: string; assignedTo?: string }) {
    const res = await fetch(buildApiUrl(`/api/groups/${groupId}/tasks`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateTaskStatus(groupId: string, taskId: string, status: string) {
    const res = await fetch(buildApiUrl(`/api/groups/${groupId}/tasks/${taskId}`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getGroupEvents(groupId: string) {
    const res = await fetch(buildApiUrl(`/api/groups/${groupId}/events`), { headers: getHeaders() });
    return res.json();
  },

  async createGroupEvent(groupId: string, data: { title: string; description?: string; eventTime: string; location?: string }) {
    const res = await fetch(buildApiUrl(`/api/groups/${groupId}/events`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(buildApiUrl('/api/notifications'), { headers: getHeaders() });
    return res.json();
  },

  async markNotificationRead(id: string) {
    const res = await fetch(buildApiUrl(`/api/notifications/${id}/read`), {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Search
  async search(query: string) {
    const res = await fetch(buildApiUrl(`/api/search?q=${encodeURIComponent(query)}`), { headers: getHeaders() });
    return res.json();
  },

  // AI Utility Services
  async getSmartReplies(messages: any[]) {
    const res = await fetch(buildApiUrl('/api/ai/smart-replies'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messages }),
    });
    return res.json();
  },

  async summarize(messages: any[]) {
    const res = await fetch(buildApiUrl('/api/ai/summarize'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messages }),
    });
    return res.json();
  },

  async translate(text: string, targetLanguage: string) {
    const res = await fetch(buildApiUrl('/api/ai/translate'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, targetLanguage }),
    });
    return res.json();
  },

  async rewrite(text: string, tone: string) {
    const res = await fetch(buildApiUrl('/api/ai/rewrite'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, tone }),
    });
    return res.json();
  },

  // Aiven Live Status Monitor
  async getAivenStatus() {
    const res = await fetch(buildApiUrl('/api/aiven/status'));
    return res.json();
  },
};

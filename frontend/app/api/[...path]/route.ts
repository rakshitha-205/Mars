import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Seeded user database for ChatConnect
const USERS = [
  {
    id: 'usr_mithun',
    name: 'Mithun Gowda',
    username: 'mithun',
    email: 'mithun@chatconnect.app',
    profile_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    avatar_color: '#2563EB',
    bio: 'Building high-throughput real-time systems. ChatConnect Architect.',
    online_status: 'online',
    last_seen: new Date().toISOString(),
  },
  {
    id: 'usr_rahul',
    name: 'Rahul Kumar',
    username: 'rahul',
    email: 'rahul@chatconnect.app',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    avatar_color: '#10B981',
    bio: 'Frontend engineer & UI enthusiast. Coffee lover.',
    online_status: 'online',
    last_seen: new Date().toISOString(),
  },
  {
    id: 'usr_ananya',
    name: 'Ananya Sharma',
    username: 'ananya',
    email: 'ananya@chatconnect.app',
    profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    avatar_color: '#EC4899',
    bio: 'Full-stack developer | Exploring event-driven architectures with Kafka.',
    online_status: 'away',
    last_seen: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'usr_kiran',
    name: 'Kiran Rao',
    username: 'kiran',
    email: 'kiran@chatconnect.app',
    profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    avatar_color: '#F59E0B',
    bio: 'DevOps & Cloud Engineer | Keeping latency low with Valkey.',
    online_status: 'offline',
    last_seen: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'usr_priya',
    name: 'Priya Patel',
    username: 'priya',
    email: 'priya@chatconnect.app',
    profile_photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    avatar_color: '#8B5CF6',
    bio: 'Product Designer & Material Design 3 practitioner.',
    online_status: 'online',
    last_seen: new Date().toISOString(),
  },
];

const CONVERSATIONS = [
  {
    id: 'conv_mithun_rahul',
    type: 'direct',
    title: 'Rahul Kumar',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    participants: [USERS[0], USERS[1]],
    last_message: {
      id: 'msg_mr_2',
      conversation_id: 'conv_mithun_rahul',
      sender_id: 'usr_rahul',
      message: 'Yes Mithun! The latency with Aiven Valkey presence is lightning fast! 🚀',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    },
    group_info: null,
  },
  {
    id: 'conv_group_bmsit',
    type: 'group',
    title: 'BMSIT Project Team',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    participants: USERS,
    last_message: {
      id: 'msg_grp_1',
      conversation_id: 'conv_group_bmsit',
      sender_id: 'usr_mithun',
      message: 'Welcome everyone to the ChatConnect project group! Let us coordinate our hackathon demonstration here.',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    group_info: {
      id: 'grp_bmsit',
      conversation_id: 'conv_group_bmsit',
      name: 'BMSIT Project Team',
      description: 'Official coordination hub for ChatConnect real-time hackathon submission.',
      group_photo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      created_by: 'usr_mithun',
    },
  },
];

const MESSAGES: Record<string, any[]> = {
  conv_mithun_rahul: [
    {
      id: 'msg_mr_1',
      conversation_id: 'conv_mithun_rahul',
      sender_id: 'usr_mithun',
      message: 'Hey Rahul! Did you check out the new event-driven architecture using Kafka?',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
      sender: USERS[0],
    },
    {
      id: 'msg_mr_2',
      conversation_id: 'conv_mithun_rahul',
      sender_id: 'usr_rahul',
      message: 'Yes Mithun! The latency with Aiven Valkey presence is lightning fast! 🚀',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      sender: USERS[1],
    },
  ],
  conv_group_bmsit: [
    {
      id: 'msg_grp_1',
      conversation_id: 'conv_group_bmsit',
      sender_id: 'usr_mithun',
      message: 'Welcome everyone to the ChatConnect project group! Let us coordinate our hackathon demonstration here.',
      message_type: 'text',
      status: 'read',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      sender: USERS[0],
    },
  ],
};

function generateToken(user: any) {
  return `mock_jwt_${user.id}_${Date.now()}`;
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join('/') : '';

  // Auth /me
  if (path === 'auth/me') {
    return NextResponse.json({ user: USERS[0] });
  }

  // Users search
  if (path === 'users/search') {
    const q = req.nextUrl.searchParams.get('q')?.toLowerCase() || '';
    const filtered = USERS.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    return NextResponse.json(filtered);
  }

  // Users list
  if (path === 'users') {
    return NextResponse.json(USERS);
  }

  // Single user
  if (path.startsWith('users/')) {
    const userId = path.replace('users/', '');
    const user = USERS.find((u) => u.id === userId) || USERS[0];
    return NextResponse.json(user);
  }

  // Conversations list
  if (path === 'conversations') {
    return NextResponse.json(CONVERSATIONS);
  }

  // Messages in conversation: conversations/:id/messages
  if (path.startsWith('conversations/') && path.endsWith('/messages')) {
    const parts = path.split('/');
    const convId = parts[1];
    const msgs = MESSAGES[convId] || [];
    return NextResponse.json(msgs);
  }

  // Notifications
  if (path === 'notifications') {
    return NextResponse.json([]);
  }

  // Search
  if (path === 'search') {
    const q = req.nextUrl.searchParams.get('q')?.toLowerCase() || '';
    const matchedUsers = USERS.filter((u) => u.name.toLowerCase().includes(q));
    return NextResponse.json({ users: matchedUsers, messages: [], groups: [] });
  }

  return NextResponse.json({ message: 'OK', path });
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join('/') : '';
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  // Login
  if (path === 'auth/login') {
    const { identifier, password } = body;
    const user = USERS.find((u) => u.username === identifier || u.email === identifier) || USERS[0];
    return NextResponse.json({
      user,
      token: generateToken(user),
    });
  }

  // Register
  if (path === 'auth/register') {
    const { name, username, email, avatarColor } = body;
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name || 'Demo User',
      username: username || 'demouser',
      email: email || 'demo@chatconnect.app',
      profile_photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      avatar_color: avatarColor || '#2563EB',
      bio: 'ChatConnect Member',
      online_status: 'online',
      last_seen: new Date().toISOString(),
    };
    return NextResponse.json({
      user: newUser,
      token: generateToken(newUser),
    });
  }

  // Messages send
  if (path === 'messages') {
    const { conversationId, message, messageType = 'text' } = body;
    const newMsg = {
      id: `msg_${Date.now()}`,
      conversation_id: conversationId,
      sender_id: USERS[0].id,
      message,
      message_type: messageType,
      status: 'sent',
      created_at: new Date().toISOString(),
      sender: USERS[0],
    };
    if (!MESSAGES[conversationId]) {
      MESSAGES[conversationId] = [];
    }
    MESSAGES[conversationId].push(newMsg);
    return NextResponse.json(newMsg);
  }

  // AI Smart Replies
  if (path === 'ai/smart-replies') {
    return NextResponse.json({
      replies: ['Sounds great! 👍', 'Let us discuss this in the demo.', 'I am checking the Kafka topics now.'],
    });
  }

  // AI Summarize
  if (path === 'ai/summarize') {
    return NextResponse.json({
      summary: 'Discussion centered around real-time latency with Aiven Valkey and Kafka event streaming pipeline verification.',
      keyPoints: ['Aiven Valkey provides ultra-low latency presence', 'Multi-user sync confirmed', 'Kafka event streaming verified'],
    });
  }

  // AI Translate
  if (path === 'ai/translate') {
    return NextResponse.json({
      original: body.text || '',
      targetLanguage: body.targetLanguage || 'Spanish',
      translated: `[Translated]: ${body.text}`,
    });
  }

  // AI Rewrite
  if (path === 'ai/rewrite') {
    return NextResponse.json({
      original: body.text || '',
      tone: body.tone || 'professional',
      rewritten: `[Polished]: ${body.text}`,
    });
  }

  return NextResponse.json({ message: 'Created', path });
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return NextResponse.json({ message: 'Updated' });
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return NextResponse.json({ message: 'Deleted' });
}

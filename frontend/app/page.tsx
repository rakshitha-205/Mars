'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Conversation, Message, User } from '../lib/types';
import { api } from '../lib/api';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { DetailsDrawer } from '../components/chat/DetailsDrawer';
import { AuthModal } from '../components/auth/AuthModal';
import { CreateGroupModal } from '../components/modals/CreateGroupModal';
import { GlobalSearchModal } from '../components/modals/GlobalSearchModal';
import { AivenStatusModal } from '../components/modals/AivenStatusModal';
import { AiToolsModal } from '../components/modals/AiToolsModal';
import { MessageSquare, ShieldCheck, Zap, Database, Sparkles, LogIn, Lock } from 'lucide-react';

export default function ChatConnectApp() {
  const { user, token, isLoading: isAuthLoading, logout } = useAuth();
  const { socket } = useSocket();

  // Conversations & Navigation State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('sidebar');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAivenStatusOpen, setIsAivenStatusOpen] = useState(false);
  const [isAiToolsOpen, setIsAiToolsOpen] = useState(false);

  // Theme (Dark / Light)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('chatconnect_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDarkMode(shouldDark);
    if (shouldDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('chatconnect_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('chatconnect_theme', 'light');
      }
      return next;
    });
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch Conversations for logged in user
  const fetchConversations = useCallback(async () => {
    if (!token || !user) return;
    setIsLoadingConversations(true);
    try {
      const list = await api.getConversations();
      setConversations(list || []);

      // If active conversation not set or invalid, default to first conversation
      if (list && list.length > 0) {
        setActiveConversationId((prev) => {
          if (!prev || !list.some((c: Conversation) => c.id === prev)) {
            return list[0].id;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('[FETCH CONVERSATIONS ERROR]', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (user && token) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [user, token, fetchConversations]);

  // Socket Live Events for conversations list
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg: Message) => {
      setConversations((prev) => {
        const foundIndex = prev.findIndex((c) => c.id === msg.conversation_id);
        if (foundIndex === -1) {
          // If conversation is new to this user, refresh conversations list
          fetchConversations();
          return prev;
        }

        const conv = { ...prev[foundIndex] };
        conv.last_message = msg;
        if (msg.conversation_id !== activeConversationId && msg.sender_id !== user.id) {
          conv.unread_count = (conv.unread_count || 0) + 1;
        }

        const updated = [...prev];
        updated.splice(foundIndex, 1);
        return [conv, ...updated];
      });
    };

    const handleConversationUpdated = () => {
      fetchConversations();
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:new', handleConversationUpdated);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:new', handleConversationUpdated);
    };
  }, [socket, user, activeConversationId, fetchConversations]);

  // Handler when selecting a conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileView('chat');

    // Reset unread counter for selected conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
    );
  };

  // Handler when selecting a user to chat with from global search
  const handleSelectUserToChat = async (targetUserId: string) => {
    try {
      const conv = await api.createDirectChat(targetUserId);
      setIsGlobalSearchOpen(false);

      setConversations((prev) => {
        if (!prev.some((c) => c.id === conv.id)) {
          return [conv, ...prev];
        }
        return prev;
      });

      setActiveConversationId(conv.id);
      setMobileView('chat');
    } catch (err) {
      console.error('[CREATE DIRECT CHAT ERROR]', err);
    }
  };

  // Handler when a new group is created
  const handleGroupCreated = (newGroupConv: Conversation) => {
    setConversations((prev) => [newGroupConv, ...prev]);
    setActiveConversationId(newGroupConv.id);
    setMobileView('chat');
  };

  // Active conversation object
  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  // -------------------------------------------------------------
  // 1. Loading State
  // -------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30 animate-pulse">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold font-display tracking-tight">ChatConnect</h2>
          <p className="text-xs text-slate-400 mt-1">Initializing real-time event pipeline...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. Unauthenticated View (Hero Landing + Quick Login)
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="h-screen w-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
        {/* Navigation Bar */}
        <header className="px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white">ChatConnect</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-brand-400 font-medium px-2 py-0.5 rounded-full bg-brand-950/60 border border-brand-800/40">
                Aiven Powered
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsAivenStatusOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Aiven Architecture</span>
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Demo</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-brand-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Built for High-Throughput Real-Time Communication</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight leading-tight text-white">
            Connect. Communicate. <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Collaborate in Real-Time.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            ChatConnect is engineered with <strong>Material Design 3</strong> principles and powered by <strong>Aiven PostgreSQL</strong>, <strong>Apache Kafka</strong> event streaming, and ultra-fast <strong>Aiven Valkey</strong> presence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-600/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Launch ChatConnect (1-Click Test Users)</span>
            </button>

            <button
              onClick={() => setIsAivenStatusOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspect Infrastructure</span>
            </button>
          </div>

          {/* Infrastructure Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Aiven PostgreSQL</h3>
              <p className="text-xs text-slate-400">
                16 relational tables with ACID compliance, relational integrity, foreign keys, and indexes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Apache Kafka Event Bus</h3>
              <p className="text-xs text-slate-400">
                Decoupled pub/sub event pipeline handling audit logs, notifications, and telemetry.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Aiven Valkey Cache</h3>
              <p className="text-xs text-slate-400">
                Sub-millisecond presence tracking, live typing TTL indicators, and cached hot data.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center border-t border-slate-800/60 text-xs text-slate-500">
          ChatConnect © 2026 • Powered by Aiven Cloud • Engineered for Human-to-Human Communication
        </footer>

        {/* Auth Modal */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        {/* Aiven Status Modal */}
        <AivenStatusModal isOpen={isAivenStatusOpen} onClose={() => setIsAivenStatusOpen(false)} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. Authenticated 3-Pane Application Interface
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Sidebar (340px) */}
        <div
          className={`h-full w-full md:w-80 lg:w-88 flex-shrink-0 transition-transform duration-200 z-20 ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            currentUser={user}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
            onOpenAivenStatus={() => setIsAivenStatusOpen(true)}
            onLogout={logout}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        </div>

        {/* Center Column: Active Conversation Stage (Flex-1) */}
        <div
          className={`h-full flex-1 flex flex-col min-w-0 transition-all duration-200 z-10 ${
            mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <ChatArea
              conversation={activeConversation}
              currentUser={user}
              onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
              onOpenAiTools={() => setIsAiToolsOpen(true)}
              onOpenAivenStatus={() => setIsAivenStatusOpen(true)}
              onBackMobile={() => setMobileView('sidebar')}
            />
          ) : (
            <div className="h-full flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900/60 border-l border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-bold font-display text-lg text-slate-900 dark:text-white">
                  Welcome to ChatConnect, {user.name}!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Select a conversation from the left sidebar or start a new direct or group chat to begin collaborating.
                </p>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setIsGlobalSearchOpen(true)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                  Search Users (Ctrl+K)
                </button>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
                >
                  Create Group
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Details Drawer (320px Collapsible) */}
        {isDrawerOpen && activeConversation && (
          <div className="fixed inset-y-0 right-0 z-40 md:static md:z-auto flex-shrink-0 animate-in slide-in-from-right duration-200 shadow-2xl md:shadow-none">
            <DetailsDrawer
              conversation={activeConversation}
              currentUser={user}
              onClose={() => setIsDrawerOpen(false)}
              onOpenAivenStatus={() => setIsAivenStatusOpen(true)}
            />
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- */}
      {/* Global Modals */}
      {/* --------------------------------------------------------- */}

      {/* 1. Global Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectUserToChat={handleSelectUserToChat}
        onSelectConversation={(id) => {
          handleSelectConversation(id);
          setIsGlobalSearchOpen(false);
        }}
      />

      {/* 2. Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        currentUser={user}
        onGroupCreated={handleGroupCreated}
      />

      {/* 3. Aiven Status Inspector Modal */}
      <AivenStatusModal
        isOpen={isAivenStatusOpen}
        onClose={() => setIsAivenStatusOpen(false)}
      />

      {/* 4. AI Communication Utilities Modal */}
      <AiToolsModal
        isOpen={isAiToolsOpen}
        onClose={() => setIsAiToolsOpen(false)}
        activeConversationMessages={[]}
        onInsertText={(text) => {
          if (activeConversation && socket) {
            socket.emit('message:send', {
              conversationId: activeConversation.id,
              message: text,
              messageType: 'text',
            });
          }
        }}
      />

      {/* 5. Switch Account / Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

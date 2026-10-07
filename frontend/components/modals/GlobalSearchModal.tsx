'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { Search, User as UserIcon, MessageSquare, Users, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUserToChat: (userId: string) => void;
  onSelectConversation: (conversationId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUserToChat,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: any[]; messages: any[]; groups: any[] }>({
    users: [],
    messages: [],
    groups: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], messages: [], groups: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-850">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, messages, or groups... (Type name or message text)"
            className="flex-1 bg-transparent border-0 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded text-xs font-mono">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {isLoading && <div className="text-center py-6 text-xs text-slate-400">Searching ChatConnect...</div>}

          {!isLoading && query && results.users.length === 0 && results.messages.length === 0 && results.groups.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">No matching users, messages, or groups found.</div>
          )}

          {/* Users Results */}
          {results.users.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <UserIcon className="w-3.5 h-3.5" />
                <span>People</span>
              </span>
              <div className="space-y-1">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSelectUserToChat(u.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar name={u.name} photoUrl={u.profile_photo} color={u.avatar_color} size="sm" isOnline={u.online_status === 'online'} />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">@{u.username} • {u.bio?.slice(0, 40)}</div>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 rounded-lg text-xs font-semibold hover:bg-brand-100">
                      Chat
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Results */}
          {results.messages.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Messages</span>
              </span>
              <div className="space-y-1">
                {results.messages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectConversation(m.conversation_id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">{m.sender_name || 'User'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 italic">
                      "{m.message}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups Results */}
          {results.groups.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Groups</span>
              </span>
              <div className="space-y-1">
                {results.groups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      onSelectConversation(g.conversation_id);
                      onClose();
                    }}
                    className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <Avatar name={g.name} photoUrl={g.group_photo} color="#7C3AED" size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{g.name}</div>
                      <div className="text-[11px] text-slate-400">{g.description || 'Project coordination group'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

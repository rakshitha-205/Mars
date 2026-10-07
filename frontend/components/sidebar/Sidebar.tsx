'use client';

import React, { useState } from 'react';
import { Conversation, User } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { Search, Plus, Users, MessageSquare, Moon, Sun, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  currentUser: User;
  onOpenCreateGroup: () => void;
  onOpenGlobalSearch: () => void;
  onOpenAivenStatus: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUser,
  onOpenCreateGroup,
  onOpenGlobalSearch,
  onOpenAivenStatus,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');

  const filtered = conversations.filter((c) => {
    // Tab filter
    if (activeTab === 'direct' && c.type !== 'direct') return false;
    if (activeTab === 'groups' && c.type !== 'group') return false;

    // Search query filter
    if (!filterQuery) return true;
    const partner = c.type === 'direct' ? c.participants?.find((p) => p.id !== currentUser.id) : null;
    const title = c.type === 'group' ? c.title : partner?.name || partner?.username;
    return title?.toLowerCase().includes(filterQuery.toLowerCase());
  });

  return (
    <aside className="w-full md:w-80 lg:w-88 h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col select-none">
      {/* Top Profile Card */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
        <div className="flex items-center space-x-3">
          <Avatar
            name={currentUser.name}
            photoUrl={currentUser.profile_photo}
            color={currentUser.avatar_color}
            size="md"
            isOnline={true}
          />
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</h3>
            <p className="text-xs text-slate-400 truncate">@{currentUser.username}</p>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenAivenStatus}
            title="Inspect Aiven Architecture"
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleDarkMode}
            title="Toggle theme"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Search & Action Bar */}
      <div className="p-3 space-y-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenGlobalSearch}
            className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 rounded-xl text-xs flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search chats, people...</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono">
              Ctrl K
            </kbd>
          </button>

          <button
            onClick={onOpenCreateGroup}
            title="Create new group"
            className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex space-x-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
          {(['all', 'direct', 'groups'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 rounded-lg font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'all' ? 'All Chats' : tab === 'direct' ? 'Direct' : 'Groups'}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
            <p>No conversations found.</p>
            <button
              onClick={onOpenGlobalSearch}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Find people to chat with
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const isGroup = conv.type === 'group';
            const partner = !isGroup ? conv.participants?.find((p) => p.id !== currentUser.id) : null;
            const title = isGroup ? conv.title : partner?.name || 'Direct Chat';
            const isOnline = partner?.online_status === 'online';
            const isActive = conv.id === activeConversationId;
            const lastMsg = conv.last_message;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center space-x-3 p-3.5 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-brand-50/80 dark:bg-brand-950/40 border-r-4 border-brand-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Avatar
                  name={title || 'Chat'}
                  photoUrl={isGroup ? conv.group_info?.group_photo : partner?.profile_photo}
                  color={isGroup ? '#7C3AED' : partner?.avatar_color}
                  size="md"
                  isOnline={isGroup ? undefined : isOnline}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-brand-900 dark:text-brand-200 font-bold' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {title}
                    </h4>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-1">
                        {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {lastMsg ? (
                        <>
                          {lastMsg.sender_id === currentUser.id && <span className="font-medium text-slate-400">You: </span>}
                          {lastMsg.message_type === 'poll' ? '📊 Poll' : lastMsg.message}
                        </>
                      ) : (
                        <span className="italic text-slate-400">Start conversation...</span>
                      )}
                    </p>

                    {conv.unread_count && conv.unread_count > 0 ? (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

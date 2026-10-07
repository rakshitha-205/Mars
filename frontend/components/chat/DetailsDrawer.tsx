'use client';

import React, { useState, useEffect } from 'react';
import { Conversation, User, GroupTask, GroupEvent } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { api } from '../../lib/api';
import { X, Users, CheckSquare, Calendar, Shield, Plus, Sparkles, Activity } from 'lucide-react';

interface DetailsDrawerProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onOpenAivenStatus: () => void;
}

export const DetailsDrawer: React.FC<DetailsDrawerProps> = ({
  conversation,
  currentUser,
  onClose,
  onOpenAivenStatus,
}) => {
  const isGroup = conversation.type === 'group';
  const partner = !isGroup ? conversation.participants?.find((p) => p.id !== currentUser.id) : null;

  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    if (isGroup && conversation.group_info) {
      api.getGroupTasks(conversation.group_info.id).then((t) => setTasks(t || []));
      api.getGroupEvents(conversation.group_info.id).then((e) => setEvents(e || []));
    }
  }, [conversation.id, isGroup]);

  const handleToggleTask = async (task: GroupTask) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    if (!conversation.group_info) return;
    await api.updateTaskStatus(conversation.group_info.id, task.id, nextStatus);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !conversation.group_info) return;
    const t = await api.createGroupTask(conversation.group_info.id, { title: newTaskTitle.trim() });
    setTasks((prev) => [...prev, t]);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  return (
    <div className="w-80 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          {isGroup ? 'Group Information' : 'Contact Details'}
        </h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Profile Info */}
      <div className="p-6 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-800">
        <Avatar
          name={isGroup ? conversation.title || 'Group' : partner?.name || 'User'}
          photoUrl={isGroup ? conversation.group_info?.group_photo : partner?.profile_photo}
          color={isGroup ? '#7C3AED' : partner?.avatar_color}
          size="xl"
          isOnline={partner?.online_status === 'online'}
        />
        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-3">
          {isGroup ? conversation.title : partner?.name}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isGroup ? `${conversation.participants?.length || 0} members` : `@${partner?.username}`}
        </p>

        {/* Bio / Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 px-2 italic">
          "{isGroup ? conversation.group_info?.description || 'Team coordination group' : partner?.bio || 'Hey there! I am using ChatConnect.'}"
        </p>

        {/* Live Aiven Inspector Action Button */}
        <button
          onClick={onOpenAivenStatus}
          className="mt-4 w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all"
        >
          <Activity className="w-4 h-4" />
          <span>Inspect Aiven Architecture</span>
        </button>
      </div>

      {/* Group Members List */}
      {isGroup && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Members ({conversation.participants?.length || 0})</span>
            </span>
          </div>

          <div className="space-y-2">
            {conversation.participants?.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar name={m.name} photoUrl={m.profile_photo} color={m.avatar_color} size="sm" isOnline={m.online_status === 'online'} />
                  <div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[10px] text-slate-400">@{m.username}</div>
                  </div>
                </div>
                {m.id === conversation.group_info?.created_by && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Group Tasks */}
      {isGroup && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Project Tasks ({tasks.length})</span>
            </span>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="p-1 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showAddTask && (
            <div className="flex items-center space-x-1.5 mb-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task..."
                className="flex-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
              <button
                onClick={handleCreateTask}
                className="px-2.5 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className="flex items-start space-x-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-brand-600"
                />
                <span
                  className={`text-xs ${
                    task.status === 'completed'
                      ? 'line-through text-slate-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Group Events */}
      {isGroup && events.length > 0 && (
        <div className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled Events</span>
          </span>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="p-3 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 rounded-xl">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{ev.title}</div>
                <div className="text-[11px] text-brand-600 dark:text-brand-400 mt-0.5">{new Date(ev.event_time).toLocaleDateString()}</div>
                {ev.location && <div className="text-[10px] text-slate-500 mt-0.5">📍 {ev.location}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

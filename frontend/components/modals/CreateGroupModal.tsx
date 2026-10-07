'use client';

import React, { useState, useEffect } from 'react';
import { User } from '../../lib/types';
import { api } from '../../lib/api';
import { Avatar } from '../ui/Avatar';
import { X, Users, Check } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onGroupCreated: (newGroupConv: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGroupCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getAllUsers().then((res) => {
        setUsers(res.filter((u: User) => u.id !== currentUser.id));
      });
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const toggleUser = (uid: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.createGroupChat({
        title: title.trim(),
        description: description.trim() || undefined,
        memberIds: selectedUserIds,
      });
      onGroupCreated(res);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New Group</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Group Name *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BMSIT Project Team"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Members Checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Members ({selectedUserIds.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/30">
              {users.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Avatar name={u.name} photoUrl={u.profile_photo} color={u.avatar_color} size="sm" isOnline={u.online_status === 'online'} />
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400">@{u.username}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-brand-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !title.trim()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Message, User } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { Check, CheckCheck, Smile, CornerUpLeft, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  currentUser: User;
  onReact: (messageId: string, reaction: string) => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onVotePoll: (pollId: string, optionId: string, messageId: string) => void;
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '🔥', '🎉', '😮'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUser,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onVotePoll,
}) => {
  const isMe = message.sender_id === currentUser.id;
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Format time
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`group flex flex-col mb-3 ${isMe ? 'items-end' : 'items-start'} relative`}>
      <div className={`flex items-end space-x-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar for received messages in group chats */}
        {!isMe && (
          <Avatar
            name={message.sender?.name || 'User'}
            photoUrl={message.sender?.profile_photo}
            color={message.sender?.avatar_color || '#2563EB'}
            size="sm"
          />
        )}

        {/* Bubble Body */}
        <div className="relative">
          {/* Sender Name in group chats */}
          {!isMe && message.sender && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 ml-1 mb-1 block">
              {message.sender.name}
            </span>
          )}

          {/* Bubble Surface */}
          <div
            className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-sm transition-all duration-150 ${
              isMe
                ? 'bg-brand-600 text-white rounded-br-xs'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/60 rounded-bl-xs'
            }`}
          >
            {/* Poll Card Content */}
            {message.message_type === 'poll' && message.poll && (
              <div className="space-y-2.5 my-1 min-w-[240px]">
                <div className="font-semibold text-sm border-b border-black/10 dark:border-white/10 pb-1.5 flex items-center justify-between">
                  <span>📊 {message.poll.question}</span>
                  <span className="text-[10px] font-normal opacity-70">{message.poll.total_votes} votes</span>
                </div>
                <div className="space-y-1.5">
                  {message.poll.options.map((opt) => {
                    const percent = message.poll!.total_votes > 0 ? Math.round(((opt.votes_count || 0) / message.poll!.total_votes) * 100) : 0;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onVotePoll(message.poll!.id, opt.id, message.id)}
                        className={`w-full text-left p-2 rounded-xl text-xs relative overflow-hidden transition-all border ${
                          opt.voted_by_me
                            ? 'border-brand-400 bg-brand-500/20 font-medium'
                            : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-brand-500/30 rounded-xl transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                        <div className="relative flex justify-between items-center z-10">
                          <span>{opt.option_text}</span>
                          <span className="font-semibold text-[11px]">{percent}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard Text Content */}
            {message.message_type !== 'poll' && (
              <p className="whitespace-pre-wrap break-words leading-relaxed select-text">{message.message}</p>
            )}

            {/* Bubble Footer: Timestamp & Read Status */}
            <div className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
              <span>{formatTime(message.created_at)}</span>
              {isMe && (
                <span>
                  {message.status === 'read' ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-300 inline" />
                  ) : message.status === 'delivered' ? (
                    <CheckCheck className="w-3.5 h-3.5 opacity-80 inline" />
                  ) : (
                    <Check className="w-3.5 h-3.5 opacity-70 inline" />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Reactions Dock */}
          {message.reactions && message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {Array.from(new Set(message.reactions.map((r) => r.reaction))).map((emoji) => {
                const count = message.reactions!.filter((r) => r.reaction === emoji).length;
                return (
                  <span
                    key={emoji}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span className="ml-1 text-[10px] font-semibold text-slate-500">{count}</span>}
                  </span>
                );
              })}
            </div>
          )}

          {/* Context Actions Menu Button on Hover */}
          <div
            className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ${
              isMe ? '-left-16' : '-right-16'
            }`}
          >
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-700"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-700"
              title="Reply"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>
            {isMe && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Reaction Popup */}
          {showReactionPicker && (
            <div className="absolute top-8 z-30 flex items-center space-x-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(message.id, emoji);
                    setShowReactionPicker(false);
                  }}
                  className="p-1 hover:scale-125 transition-transform text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Owner Actions Dropdown */}
          {showMenu && isMe && (
            <div className="absolute top-8 z-30 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[120px] text-xs">
              <button
                onClick={() => {
                  onEdit(message);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  onDelete(message.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center space-x-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

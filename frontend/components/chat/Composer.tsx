'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Sparkles, X } from 'lucide-react';

interface ComposerProps {
  onSendMessage: (text: string, type?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onOpenAiTools: () => void;
  replyToMessage: any | null;
  onCancelReply: () => void;
  smartReplies: string[];
}

const COMMON_EMOJIS = ['😊', '👍', '❤️', '🔥', '🎉', '🚀', '🙌', '👋', '💯', '😂', '🤝', '✨'];

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onOpenAiTools,
  replyToMessage,
  onCancelReply,
  smartReplies,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing debounce
    onTypingStart();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    onTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 relative">
      {/* Smart Reply Suggestions Bar */}
      {smartReplies.length > 0 && !text && (
        <div className="flex items-center space-x-2 mb-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-violet-500" /> Suggestions:
          </span>
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => setText(reply)}
              className="px-3 py-1 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full border border-violet-200/60 dark:border-violet-800/60 whitespace-nowrap transition-all shadow-xs"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Reply Quote Banner */}
      {replyToMessage && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs border-l-4 border-brand-500">
          <div className="truncate">
            <span className="font-semibold text-brand-600 dark:text-brand-400">Replying to {replyToMessage.sender?.name || 'User'}: </span>
            <span className="text-slate-600 dark:text-slate-300 italic">{replyToMessage.message}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 grid grid-cols-6 gap-1 animate-in zoom-in-95">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              className="p-2 text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="flex items-end space-x-2 bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          title="Add Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenAiTools}
          className="p-1.5 text-violet-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-colors"
          title="AI Communication Tools"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <textarea
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          rows={1}
          className="flex-1 bg-transparent border-0 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none max-h-32 py-1 leading-relaxed"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`p-2 rounded-xl transition-all shadow-sm ${
            text.trim()
              ? 'bg-brand-600 text-white hover:bg-brand-700 hover:scale-105 active:scale-95'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

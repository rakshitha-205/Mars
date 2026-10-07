'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Conversation, Message, User } from '../../lib/types';
import { Avatar } from '../ui/Avatar';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../lib/api';
import { PanelRightOpen, BarChart2, Sparkles, ShieldCheck, ArrowLeft, Search } from 'lucide-react';

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: User;
  onToggleDrawer: () => void;
  onOpenAiTools: () => void;
  onOpenAivenStatus: () => void;
  onBackMobile?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  onToggleDrawer,
  onOpenAiTools,
  onOpenAivenStatus,
  onBackMobile,
}) => {
  const { socket, typingUsers } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGroup = conversation.type === 'group';
  const partner = !isGroup ? conversation.participants?.find((p) => p.id !== currentUser.id) : null;
  const chatTitle = isGroup ? conversation.title : partner?.name || 'Chat';
  const isOnline = partner?.online_status === 'online';

  // Typing status for this conversation
  const currentTyping = typingUsers[conversation.id] || [];
  const typingText =
    currentTyping.length === 1
      ? `${currentTyping[0]} is typing...`
      : currentTyping.length > 1
      ? `${currentTyping.join(', ')} are typing...`
      : null;

  // Fetch messages history
  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const msgs = await api.getMessages(conversation.id, 50);
      setMessages(msgs || []);

      // Generate initial smart replies from last message
      if (msgs && msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.sender_id !== currentUser.id) {
          api
            .getSmartReplies(
              msgs.slice(-3).map((m: any) => ({
                senderName: m.sender?.name || 'User',
                text: m.message,
              }))
            )
            .then((res) => {
              if (res?.replies) setSmartReplies(res.replies);
            });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    if (socket) {
      socket.emit('conversation:join', { conversationId: conversation.id });

      const handleNewMessage = (msg: Message) => {
        if (msg.conversation_id === conversation.id) {
          setMessages((prev) => [...prev, msg]);

          // Notify socket of delivery & read
          socket.emit('message:delivered', { messageId: msg.id, conversationId: conversation.id });
          socket.emit('message:read', { conversationId: conversation.id });

          // Refresh smart replies if received from partner
          if (msg.sender_id !== currentUser.id) {
            api
              .getSmartReplies([{ senderName: msg.sender?.name || 'User', text: msg.message }])
              .then((res) => {
                if (res?.replies) setSmartReplies(res.replies);
              });
          }
        }
      };

      const handleEdited = (editedMsg: Message) => {
        setMessages((prev) => prev.map((m) => (m.id === editedMsg.id ? { ...m, message: editedMsg.message } : m)));
      };

      const handleDeleted = (data: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      };

      const handleReaction = (data: any) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === data.messageId) {
              const currentRx = m.reactions || [];
              if (data.action === 'add') {
                return { ...m, reactions: [...currentRx, data.reaction] };
              } else {
                return { ...m, reactions: currentRx.filter((r) => !(r.user_id === data.userId && r.reaction === data.reaction)) };
              }
            }
            return m;
          })
        );
      };

      const handlePollUpdated = (data: any) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.messageId ? { ...m, poll: data.poll } : m))
        );
      };

      const handleReadAll = (data: { readByUserId: string }) => {
        if (data.readByUserId !== currentUser.id) {
          setMessages((prev) => prev.map((m) => (m.sender_id === currentUser.id ? { ...m, status: 'read' } : m)));
        }
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:edited', handleEdited);
      socket.on('message:deleted', handleDeleted);
      socket.on('reaction:updated', handleReaction);
      socket.on('poll:updated', handlePollUpdated);
      socket.on('message:read_all', handleReadAll);

      return () => {
        socket.emit('conversation:leave', { conversationId: conversation.id });
        socket.off('message:new', handleNewMessage);
        socket.off('message:edited', handleEdited);
        socket.off('message:deleted', handleDeleted);
        socket.off('reaction:updated', handleReaction);
        socket.off('poll:updated', handlePollUpdated);
        socket.off('message:read_all', handleReadAll);
      };
    }
  }, [conversation.id, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  const handleSendMessage = (text: string) => {
    if (socket) {
      socket.emit('message:send', {
        conversationId: conversation.id,
        message: text,
        messageType: 'text',
        replyToMessageId: replyToMessage?.id,
      });
    }
    setReplyToMessage(null);
    setSmartReplies([]);
  };

  const handleTypingStart = () => {
    if (socket) socket.emit('typing:start', { conversationId: conversation.id });
  };

  const handleTypingStop = () => {
    if (socket) socket.emit('typing:stop', { conversationId: conversation.id });
  };

  const handleReact = (messageId: string, reaction: string) => {
    if (socket) {
      socket.emit('reaction:add', { messageId, conversationId: conversation.id, reaction });
    }
  };

  const handleEdit = async (msg: Message) => {
    const newText = prompt('Edit your message:', msg.message);
    if (newText && newText.trim() && newText !== msg.message && socket) {
      socket.emit('message:edit', { messageId: msg.id, conversationId: conversation.id, newText: newText.trim() });
    }
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Delete this message for everyone?') && socket) {
      socket.emit('message:delete', { messageId, conversationId: conversation.id });
    }
  };

  const handleVotePoll = (pollId: string, optionId: string, messageId: string) => {
    if (socket) {
      socket.emit('poll:vote', { pollId, optionId, messageId, conversationId: conversation.id });
    }
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2) return;
    try {
      await api.sendMessage({
        conversationId: conversation.id,
        message: pollQuestion,
        messageType: 'poll',
        pollQuestion: pollQuestion.trim(),
        pollOptions: pollOptions.filter((o) => o.trim()),
      });
      setShowPollCreator(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      loadMessages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Active Conversation Top Bar */}
      <div className="h-16 px-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-10 shadow-2xs">
        <div className="flex items-center space-x-3">
          {onBackMobile && (
            <button onClick={onBackMobile} className="md:hidden p-1.5 text-slate-500 rounded-lg hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Avatar
            name={chatTitle || 'Chat'}
            photoUrl={isGroup ? conversation.group_info?.group_photo : partner?.profile_photo}
            color={isGroup ? '#7C3AED' : partner?.avatar_color}
            size="md"
            isOnline={isGroup ? undefined : isOnline}
          />

          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <span>{chatTitle}</span>
              {isGroup && (
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Group
                </span>
              )}
            </h3>

            {/* Dynamic Status / Typing line */}
            <p className="text-xs">
              {typingText ? (
                <span className="text-brand-600 dark:text-brand-400 font-medium flex items-center space-x-1">
                  <span>{typingText}</span>
                  <span className="inline-flex space-x-0.5 ml-1">
                    <span className="w-1 h-1 bg-brand-600 rounded-full animate-typing-dot-1" />
                    <span className="w-1 h-1 bg-brand-600 rounded-full animate-typing-dot-2" />
                    <span className="w-1 h-1 bg-brand-600 rounded-full animate-typing-dot-3" />
                  </span>
                </span>
              ) : isGroup ? (
                <span className="text-slate-400">{conversation.participants?.length || 0} members</span>
              ) : isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
              ) : (
                <span className="text-slate-400">Offline</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {isGroup && (
            <button
              onClick={() => setShowPollCreator(!showPollCreator)}
              title="Create a Poll"
              className="p-2 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenAiTools}
            title="AI Utilities"
            className="p-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAivenStatus}
            title="Inspect Aiven Architecture"
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDrawer}
            title="Conversation Details"
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Poll Creator Popup */}
      {showPollCreator && (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2.5 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Create Team Poll</span>
            <button onClick={() => setShowPollCreator(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <input
            type="text"
            placeholder="Ask a question (e.g., Where should we meet?)"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
          <div className="space-y-1.5">
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const copy = [...pollOptions];
                  copy[i] = e.target.value;
                  setPollOptions(copy);
                }}
                className="w-full px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            ))}
          </div>
          <div className="flex justify-between items-center pt-1">
            <button
              onClick={() => setPollOptions([...pollOptions, ''])}
              className="text-xs text-brand-600 hover:underline"
            >
              + Add Option
            </button>
            <button
              onClick={handleCreatePoll}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold"
            >
              Post Poll
            </button>
          </div>
        </div>
      )}

      {/* Messages Stage */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Say hello to {chatTitle}!</p>
            <p className="text-xs">Start a real-time conversation.</p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              currentUser={currentUser}
              onReact={handleReact}
              onReply={(msg) => setReplyToMessage(msg)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onVotePoll={handleVotePoll}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Dock */}
      <Composer
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        onOpenAiTools={onOpenAiTools}
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
        smartReplies={smartReplies}
      />
    </div>
  );
};

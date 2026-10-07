'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientSocket, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Record<string, string[]>; // conversationId -> array of usernames
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const s = ClientSocket(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('[SOCKET] Connected to real-time gateway:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('[SOCKET] Disconnected from gateway');
      setIsConnected(false);
    });

    s.on('presence:update', (data: { userId: string; status: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === 'online') {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    s.on('typing:update', (data: { conversationId: string; userId: string; username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const current = prev[data.conversationId] || [];
        if (data.isTyping) {
          if (!current.includes(data.username)) {
            return { ...prev, [data.conversationId]: [...current, data.username] };
          }
        } else {
          return { ...prev, [data.conversationId]: current.filter((u) => u !== data.username) };
        }
        return prev;
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers, typingUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

'use client';

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  );
}

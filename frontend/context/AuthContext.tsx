'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../lib/types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('chatconnect_token');
    const savedUser = localStorage.getItem('chatconnect_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login(identifier, pass);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('chatconnect_token', res.token);
    localStorage.setItem('chatconnect_user', JSON.stringify(res.user));
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('chatconnect_token', res.token);
    localStorage.setItem('chatconnect_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('chatconnect_token');
    localStorage.removeItem('chatconnect_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

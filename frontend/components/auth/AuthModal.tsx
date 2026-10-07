'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const SEED_USERS = [
  { name: 'Mithun Gowda', username: 'mithun', email: 'mithun@chatconnect.app', role: 'Architect & Admin' },
  { name: 'Rahul Kumar', username: 'rahul', email: 'rahul@chatconnect.app', role: 'Frontend Engineer' },
  { name: 'Ananya Sharma', username: 'ananya', email: 'ananya@chatconnect.app', role: 'Full-Stack Dev' },
  { name: 'Kiran Rao', username: 'kiran', email: 'kiran@chatconnect.app', role: 'DevOps Lead' },
  { name: 'Priya Patel', username: 'priya', email: 'priya@chatconnect.app', role: 'Product Designer' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        await register({ name, username, email, password });
      } else {
        await login(email || username, password);
      }
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (usr: typeof SEED_USERS[0]) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(usr.username, 'Password123!');
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Brand Banner */}
        <div className="p-6 bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 text-white text-center relative">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">ChatConnect</h2>
          <p className="text-xs text-blue-100 mt-1">"Connect. Communicate. Collaborate."</p>
        </div>

        {/* Form Container */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Quick Demo Test Users Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Hackathon 1-Click Test Users:</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SEED_USERS.map((u) => (
                <button
                  key={u.username}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:scale-105"
                >
                  {u.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mithun Gowda"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="mithun"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isRegister ? 'Email Address' : 'Email or Username'}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mithun@chatconnect.app or mithun"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1 hover:scale-101 active:scale-98"
            >
              <span>{isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In to ChatConnect'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

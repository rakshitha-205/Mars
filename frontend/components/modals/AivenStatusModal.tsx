'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Database, Zap, Activity, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface AivenStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AivenStatusModal: React.FC<AivenStatusModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAivenStatus();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Aiven Architecture & Infrastructure</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live Hackathon Inspection: PostgreSQL, Kafka & Valkey</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {data ? (
            <>
              {/* 1. PostgreSQL Card */}
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-950/20 flex items-start space-x-4">
                <div className="p-3 bg-blue-500 text-white rounded-xl shadow-sm">
                  <Database className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">Aiven PostgreSQL</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Mode: <span className="font-mono text-blue-600 dark:text-blue-400">{data.aiven.postgresql.mode}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Persistent Storage: All 16 tables (Users, Conversations, Messages, Groups, Reactions, Polls, Tasks, Events, Settings, Bookmarks)
                  </p>
                </div>
              </div>

              {/* 2. Valkey Card */}
              <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 flex items-start space-x-4">
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">Aiven Valkey (Redis-Compatible)</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      Sub-millisecond State
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Mode: <span className="font-mono text-amber-600 dark:text-amber-400">{data.aiven.valkey.mode}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400">Presence TTL:</span> Key <code className="text-amber-600 dark:text-amber-400">presence:user:*</code>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400">Typing Heartbeat:</span> Key <code className="text-amber-600 dark:text-amber-400">typing:conv:*</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Kafka Card */}
              <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-950/20 flex items-start space-x-4">
                <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">Aiven Apache Kafka</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400">
                      Event-Driven Stream
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Mode: <span className="font-mono text-purple-600 dark:text-purple-400">{data.aiven.kafka.mode}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.aiven.kafka.metrics.totalEventsProcessed}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Total Events</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.aiven.kafka.metrics.messagesProcessed}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Messages Logged</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data.aiven.kafka.metrics.presenceEventsCount}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Presence Events</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Kafka Topics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.aiven.kafka.topics.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">Loading infrastructure telemetry...</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-xs font-semibold rounded-xl transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

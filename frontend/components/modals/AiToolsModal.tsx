'use client';

import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Sparkles, X, Languages, FileText, Wand2, Copy, Check } from 'lucide-react';

interface AiToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationMessages: any[];
  onInsertText: (text: string) => void;
}

export const AiToolsModal: React.FC<AiToolsModalProps> = ({
  isOpen,
  onClose,
  activeConversationMessages,
  onInsertText,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'translate' | 'rewrite'>('summary');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [translateText, setTranslateText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [translatedResult, setTranslatedResult] = useState('');
  const [rewriteText, setRewriteText] = useState('');
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'concise' | 'grammar'>('professional');
  const [rewrittenResult, setRewrittenResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const msgs = activeConversationMessages.map((m) => ({
        senderName: m.sender?.name || 'User',
        text: m.message,
        time: m.created_at,
      }));
      const res = await api.summarize(msgs);
      setSummaryData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.translate(translateText, selectedLanguage);
      setTranslatedResult(res.translated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!rewriteText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.rewrite(rewriteText, selectedTone);
      setRewrittenResult(res.rewritten);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Communication Utilities</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Supporting communication utilities for human chat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 space-x-4 bg-slate-50/20 dark:bg-slate-800/20">
          <button
            onClick={() => {
              setActiveTab('summary');
              if (!summaryData) handleSummarize();
            }}
            className={`py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Summarize Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'translate'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>Translate</span>
          </button>

          <button
            onClick={() => setActiveTab('rewrite')}
            className={`py-3 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'rewrite'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Tone Rewrite</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Summary generated from active messages</span>
                <button
                  onClick={handleSummarize}
                  disabled={isLoading}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isLoading ? 'Summarizing...' : 'Refresh Summary'}
                </button>
              </div>

              {summaryData ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3 border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Highlights</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {summaryData.summary.map((point: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-brand-500 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {summaryData.actionItems?.length > 0 && (
                    <>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
                        Follow-Up Actions
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {summaryData.actionItems.map((item: string, i: number) => (
                          <li key={i} className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  {isLoading ? 'Processing conversation messages...' : 'Click "Refresh Summary" to analyze conversation highlights.'}
                </div>
              )}
            </div>
          )}

          {activeTab === 'translate' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message to Translate</label>
                <textarea
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder="Paste or type text to translate..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Language:</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="English">English</option>
                </select>
                <button
                  onClick={handleTranslate}
                  disabled={isLoading || !translateText.trim()}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Translating...' : 'Translate'}
                </button>
              </div>

              {translatedResult && (
                <div className="p-3 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-brand-700 dark:text-brand-300">
                    <span>{selectedLanguage} Translation</span>
                    <button
                      onClick={() => {
                        onInsertText(translatedResult);
                        onClose();
                      }}
                      className="px-2 py-0.5 bg-brand-600 text-white rounded-lg text-[11px] hover:bg-brand-700"
                    >
                      Insert in Chat
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">{translatedResult}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewrite' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Your Draft Message</label>
                <textarea
                  value={rewriteText}
                  onChange={(e) => setRewriteText(e.target.value)}
                  placeholder="Type draft message here..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Desired Tone:</label>
                {(['professional', 'friendly', 'concise', 'grammar'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTone(t)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize font-medium transition-colors ${
                      selectedTone === t
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRewrite}
                disabled={isLoading || !rewriteText.trim()}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Rewriting...' : 'Rewrite Message'}
              </button>

              {rewrittenResult && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="capitalize">{selectedTone} Version</span>
                    <button
                      onClick={() => {
                        onInsertText(rewrittenResult);
                        onClose();
                      }}
                      className="px-2 py-0.5 bg-brand-600 text-white rounded-lg text-[11px] hover:bg-brand-700"
                    >
                      Use This Draft
                    </button>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 italic font-sans">{rewrittenResult}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

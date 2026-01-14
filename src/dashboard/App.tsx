import React, { useState, useEffect } from 'react';
import {
  Library,
  History,
  Dna,
  Settings,
  BarChart3,
  Sparkles,
  Star,
  Copy,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { PLATFORMS } from '@/shared/constants';
import { copyToClipboard, formatRelativeTime, truncate } from '@/shared/utils';
import type { PromptRecord, TasteProfile } from '@/shared/types';

type TabType = 'library' | 'history' | 'genome' | 'analytics';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [savedPrompts, setSavedPrompts] = useState<PromptRecord[]>([]);
  const [historyPrompts, setHistoryPrompts] = useState<PromptRecord[]>([]);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [savedRes, historyRes, profileRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_SAVED' }),
        chrome.runtime.sendMessage({ type: 'GET_HISTORY' }),
        chrome.runtime.sendMessage({ type: 'GET_TASTE_PROFILE' }),
      ]);

      if (savedRes.success) setSavedPrompts(savedRes.data || []);
      if (historyRes.success) setHistoryPrompts(historyRes.data || []);
      if (profileRes.success) setTasteProfile(profileRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const handleCopy = async (id: string, content: string) => {
    if (await copyToClipboard(content)) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    await chrome.runtime.sendMessage({ type: 'DELETE_SAVED_PROMPT', payload: id });
    setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveFromHistory = async (item: PromptRecord) => {
    await chrome.runtime.sendMessage({
      type: 'SAVE_PROMPT',
      payload: { content: item.content, platform: item.platform, tags: item.tags },
    });
    const res = await chrome.runtime.sendMessage({ type: 'GET_SAVED' });
    if (res.success) setSavedPrompts(res.data || []);
  };

  // Analytics calculations
  const getAnalytics = () => {
    const total = historyPrompts.length;
    const platformCounts: Record<string, number> = {};
    const recentCount = historyPrompts.filter(
      (p) => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    historyPrompts.forEach((p) => {
      platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
    });

    const topPlatform =
      Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return { total, recentCount, topPlatform, platformCounts };
  };

  const analytics = getAnalytics();

  const tabs = [
    { id: 'library' as const, label: 'Library', icon: <Library className="w-5 h-5" /> },
    { id: 'history' as const, label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'genome' as const, label: 'Genome', icon: <Dna className="w-5 h-5" /> },
    { id: 'analytics' as const, label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-refyn-base text-zinc-100">
      {/* Header */}
      <header className="border-b border-refyn-active sticky top-0 bg-refyn-base/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-refyn-cyan via-refyn-violet to-refyn-amber rounded-xl opacity-80" />
              <div className="absolute inset-[2px] bg-refyn-base rounded-lg flex items-center justify-center">
                <span className="text-refyn-cyan font-bold">R</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">REFYN</h1>
              <p className="text-xs text-zinc-500">Dashboard</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-refyn-surface rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-refyn-hover text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => chrome.runtime.openOptionsPage?.()}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-refyn-surface transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-refyn-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Library Tab */}
            {activeTab === 'library' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-6 h-6 text-refyn-amber" />
                    Saved Prompts
                  </h2>
                  <span className="text-sm text-zinc-500">{savedPrompts.length} prompts</span>
                </div>

                {savedPrompts.length === 0 ? (
                  <div className="text-center py-16 bg-refyn-elevated rounded-xl border border-refyn-active">
                    <Star className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-lg text-zinc-400">No saved prompts yet</p>
                    <p className="text-sm text-zinc-600 mt-2">
                      Save your favorite refined prompts to access them quickly
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {savedPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="p-4 bg-refyn-elevated rounded-xl border border-refyn-active hover:border-refyn-cyan/30 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PLATFORMS[prompt.platform].color }}
                            />
                            <span className="text-xs text-zinc-500">
                              {PLATFORMS[prompt.platform].name}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-600">
                            {formatRelativeTime(prompt.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-zinc-300 mb-4 line-clamp-3">
                          {prompt.content}
                        </p>

                        {prompt.tags && prompt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {prompt.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs bg-refyn-surface rounded-full text-zinc-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopy(prompt.id, prompt.content)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-refyn-surface"
                            title="Copy"
                          >
                            {copiedId === prompt.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-refyn-surface"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6 text-refyn-violet" />
                    Prompt History
                  </h2>
                  <span className="text-sm text-zinc-500">{historyPrompts.length} prompts</span>
                </div>

                {historyPrompts.length === 0 ? (
                  <div className="text-center py-16 bg-refyn-elevated rounded-xl border border-refyn-active">
                    <History className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-lg text-zinc-400">No history yet</p>
                    <p className="text-sm text-zinc-600 mt-2">
                      Your refined prompts will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="p-4 bg-refyn-elevated rounded-xl border border-refyn-active hover:border-refyn-cyan/30 transition-all group flex items-start gap-4"
                      >
                        <div
                          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: PLATFORMS[prompt.platform].color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-zinc-500">
                              {PLATFORMS[prompt.platform].name}
                            </span>
                            <span className="text-xs text-zinc-600">
                              {formatRelativeTime(prompt.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-300">{truncate(prompt.content, 200)}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopy(prompt.id, prompt.content)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-refyn-surface"
                          >
                            {copiedId === prompt.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleSaveFromHistory(prompt)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-refyn-amber hover:bg-refyn-surface"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Genome Tab */}
            {activeTab === 'genome' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Dna className="w-6 h-6 text-refyn-cyan" />
                    Your Creative Genome
                  </h2>
                </div>

                {!tasteProfile ? (
                  <div className="text-center py-16 bg-refyn-elevated rounded-xl border border-refyn-active">
                    <Dna className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-lg text-zinc-400">No genome data yet</p>
                    <p className="text-sm text-zinc-600 mt-2">
                      Use Refyn more to build your creative DNA profile
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Visual Preferences */}
                    <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-refyn-amber" />
                        Visual Preferences
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Styles</p>
                          <div className="flex flex-wrap gap-2">
                            {tasteProfile.visual.style.length > 0 ? (
                              tasteProfile.visual.style.map((style) => (
                                <span
                                  key={style}
                                  className="px-3 py-1 bg-refyn-surface rounded-full text-sm text-refyn-cyan"
                                >
                                  {style}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-zinc-600">No preferences yet</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Color Palettes</p>
                          <div className="flex flex-wrap gap-2">
                            {tasteProfile.visual.colorPalette.length > 0 ? (
                              tasteProfile.visual.colorPalette.map((palette) => (
                                <span
                                  key={palette}
                                  className="px-3 py-1 bg-refyn-surface rounded-full text-sm text-refyn-amber"
                                >
                                  {palette}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-zinc-600">No preferences yet</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Lighting</p>
                          <div className="flex flex-wrap gap-2">
                            {tasteProfile.visual.lighting.length > 0 ? (
                              tasteProfile.visual.lighting.map((light) => (
                                <span
                                  key={light}
                                  className="px-3 py-1 bg-refyn-surface rounded-full text-sm text-refyn-violet"
                                >
                                  {light}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-zinc-600">No preferences yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Audio Preferences */}
                    <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-refyn-violet" />
                        Audio Preferences
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Genres</p>
                          <div className="flex flex-wrap gap-2">
                            {tasteProfile.audio.genres.length > 0 ? (
                              tasteProfile.audio.genres.map((genre) => (
                                <span
                                  key={genre}
                                  className="px-3 py-1 bg-refyn-surface rounded-full text-sm text-refyn-cyan"
                                >
                                  {genre}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-zinc-600">No preferences yet</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-2">Moods</p>
                          <div className="flex flex-wrap gap-2">
                            {tasteProfile.audio.moods.length > 0 ? (
                              tasteProfile.audio.moods.map((mood) => (
                                <span
                                  key={mood}
                                  className="px-3 py-1 bg-refyn-surface rounded-full text-sm text-refyn-amber"
                                >
                                  {mood}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-zinc-600">No preferences yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Frequent Keywords */}
                    <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active md:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Frequent Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(tasteProfile.patterns.frequentKeywords)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 20)
                          .map(([keyword, count]) => (
                            <span
                              key={keyword}
                              className="px-3 py-1 bg-refyn-surface rounded-full text-sm"
                              style={{
                                opacity: Math.min(1, 0.4 + (count as number) * 0.1),
                              }}
                            >
                              {keyword}
                              <span className="ml-1 text-zinc-600">{count}</span>
                            </span>
                          ))}
                        {Object.keys(tasteProfile.patterns.frequentKeywords).length === 0 && (
                          <span className="text-sm text-zinc-600">No keywords tracked yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-green-400" />
                  Analytics
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active">
                    <p className="text-sm text-zinc-500 mb-2">Total Refinements</p>
                    <p className="text-3xl font-bold text-refyn-cyan">{analytics.total}</p>
                  </div>
                  <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active">
                    <p className="text-sm text-zinc-500 mb-2">This Week</p>
                    <p className="text-3xl font-bold text-refyn-amber">{analytics.recentCount}</p>
                  </div>
                  <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active">
                    <p className="text-sm text-zinc-500 mb-2">Top Platform</p>
                    <p className="text-3xl font-bold text-refyn-violet">
                      {analytics.topPlatform !== 'none'
                        ? PLATFORMS[analytics.topPlatform as keyof typeof PLATFORMS]?.name || 'None'
                        : 'None'}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-refyn-elevated rounded-xl border border-refyn-active">
                  <h3 className="text-lg font-semibold mb-4">Platform Usage</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.platformCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([platform, count]) => {
                        const platformInfo = PLATFORMS[platform as keyof typeof PLATFORMS];
                        const percentage = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                        return (
                          <div key={platform} className="flex items-center gap-3">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: platformInfo?.color || '#888' }}
                            />
                            <span className="text-sm text-zinc-300 w-32">
                              {platformInfo?.name || platform}
                            </span>
                            <div className="flex-1 h-2 bg-refyn-surface rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: platformInfo?.color || '#888',
                                }}
                              />
                            </div>
                            <span className="text-sm text-zinc-500 w-12 text-right">{count}</span>
                          </div>
                        );
                      })}
                    {Object.keys(analytics.platformCounts).length === 0 && (
                      <p className="text-sm text-zinc-600">No usage data yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-refyn-active mt-12">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-sm text-zinc-500">
          <span>Refyn v1.0.0 - Evolve the signal</span>
          <a
            href="https://anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-zinc-300"
          >
            Powered by Claude
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;

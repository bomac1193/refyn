import React, { useState, useEffect, useCallback } from 'react';
import { Star, History, ExternalLink, Download, Upload, RefreshCw } from 'lucide-react';
import { Header } from './components/Header';
import { PlatformSelector } from './components/PlatformSelector';
import { PromptInput } from './components/PromptInput';
import { PromptOutput } from './components/PromptOutput';
import { QuickActions } from './components/QuickActions';
import { GenomeTags } from './components/GenomeTags';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryItem } from './components/HistoryItem';
import { Button } from './components/Button';
import {
  getApiKey,
  getPromptHistory,
  getSavedPrompts,
  addToHistory,
  savePrompt,
  removeSavedPrompt,
  getTasteProfile,
} from '@/lib/storage';
import { STORAGE_KEYS } from '@/shared/constants';
import type { Platform, OptimizationMode, GenomeTag, PromptRecord } from '@/shared/types';

type TabType = 'refyn' | 'history' | 'saved';

const App: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('refyn');
  const [platform, setPlatform] = useState<Platform>('midjourney');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');
  const [inputPrompt, setInputPrompt] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [mode, setMode] = useState<OptimizationMode>('enhance');
  const [genomeTags, setGenomeTags] = useState<GenomeTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [history, setHistory] = useState<PromptRecord[]>([]);
  const [saved, setSaved] = useState<PromptRecord[]>([]);
  const [currentTabId, setCurrentTabId] = useState<number | null>(null);
  const [canInsert, setCanInsert] = useState(false);

  // Initialize
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check for API key
    const key = await getApiKey();
    setHasApiKey(!!key);

    // Load history and saved prompts
    const historyData = await getPromptHistory();
    setHistory(historyData);

    const savedData = await getSavedPrompts();
    setSaved(savedData);

    // Load last used platform and mode from storage
    const stored = await chrome.storage.local.get([STORAGE_KEYS.LAST_PLATFORM, STORAGE_KEYS.LAST_MODE]);
    const lastPlatform = stored[STORAGE_KEYS.LAST_PLATFORM] as Platform | undefined;
    const lastMode = stored[STORAGE_KEYS.LAST_MODE] as OptimizationMode | undefined;

    if (lastPlatform) {
      setPlatform(lastPlatform);
    }
    if (lastMode) {
      setMode(lastMode);
    }

    // Detect current platform and auto-grab prompt
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        setCurrentTabId(tabs[0].id);
        try {
          // Detect platform
          const platformResult = await chrome.tabs.sendMessage(tabs[0].id, { type: 'DETECT_PLATFORM' });
          if (platformResult?.platform && platformResult.platform !== 'unknown') {
            setDetectedPlatform(platformResult.platform);
            setCanInsert(true);
            // Only auto-switch if user hasn't manually selected a different platform
            if (!lastPlatform) {
              setPlatform(platformResult.platform);
              chrome.storage.local.set({ [STORAGE_KEYS.LAST_PLATFORM]: platformResult.platform });
            }

            // Auto-grab prompt from page
            const grabResult = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GRAB_PROMPT' });
            if (grabResult?.text && grabResult.text.trim()) {
              setInputPrompt(grabResult.text.trim());
            }
          }
        } catch {
          // Content script not loaded, ignore
          setCanInsert(false);
        }
      }
    });
  };

  // Handle Refyn optimization
  const handleRefyn = useCallback(async () => {
    console.log('[Refyn App] handleRefyn called, hasApiKey:', hasApiKey, 'inputPrompt:', inputPrompt.substring(0, 50));
    if (!inputPrompt.trim() || loading) return;

    if (!hasApiKey) {
      console.log('[Refyn App] No API key, opening settings');
      setSettingsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setOutputPrompt('');
    setGenomeTags([]);

    try {
      // Get taste profile for personalization
      const tasteProfile = await getTasteProfile();
      console.log('[Refyn App] Sending OPTIMIZE_PROMPT message...');

      // Send optimization request to background script
      const response = await chrome.runtime.sendMessage({
        type: 'OPTIMIZE_PROMPT',
        payload: {
          prompt: inputPrompt,
          platform,
          mode,
          tasteProfile,
        },
      });

      console.log('[Refyn App] Response received:', response);

      if (response.success && response.data) {
        setOutputPrompt(response.data.optimizedPrompt);
        setGenomeTags(response.data.genomeTags || []);

        // Add to history
        await addToHistory(response.data.optimizedPrompt, platform);
        const updatedHistory = await getPromptHistory();
        setHistory(updatedHistory);
      } else {
        console.error('[Refyn App] Error response:', response.error);
        setError(response.error || 'Failed to optimize prompt');
      }
    } catch (err) {
      console.error('[Refyn App] Exception:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [inputPrompt, platform, mode, loading, hasApiKey]);

  // Handle save to library
  const handleSaveToLibrary = async () => {
    if (!outputPrompt) return;

    await savePrompt(outputPrompt, platform, genomeTags.map(t => `${t.category}:${t.value}`));
    const updatedSaved = await getSavedPrompts();
    setSaved(updatedSaved);
  };

  // Handle delete saved prompt
  const handleDeleteSaved = async (id: string) => {
    await removeSavedPrompt(id);
    const updatedSaved = await getSavedPrompts();
    setSaved(updatedSaved);
  };

  // Handle selecting a prompt from history/saved
  const handleSelectPrompt = (content: string) => {
    setInputPrompt(content);
    setActiveTab('refyn');
  };

  // Handle platform change with persistence
  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
    chrome.storage.local.set({ [STORAGE_KEYS.LAST_PLATFORM]: newPlatform });
  };

  // Handle mode change with persistence
  const handleModeChange = (newMode: OptimizationMode) => {
    setMode(newMode);
    chrome.storage.local.set({ [STORAGE_KEYS.LAST_MODE]: newMode });
  };

  // Grab prompt from page
  const handleGrabFromPage = async () => {
    if (!currentTabId) return;
    try {
      const result = await chrome.tabs.sendMessage(currentTabId, { type: 'GRAB_PROMPT' });
      if (result?.text && result.text.trim()) {
        setInputPrompt(result.text.trim());
      }
    } catch {
      setError('Could not grab prompt from page');
    }
  };

  // Insert prompt to page
  const handleInsertToPage = async (text: string) => {
    if (!currentTabId || !text) return;
    try {
      await chrome.tabs.sendMessage(currentTabId, { type: 'INSERT_PROMPT', payload: text });
      // Visual feedback - close popup after inserting
      window.close();
    } catch {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(text);
      setError('Copied to clipboard (could not insert directly)');
    }
  };

  // Open dashboard
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
  };

  return (
    <div className="w-[480px] h-[600px] bg-refyn-base text-zinc-100 flex flex-col overflow-hidden">
      <Header
        onSettingsClick={() => setSettingsOpen(true)}
        onHelpClick={openDashboard}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-refyn-active">
        <button
          onClick={() => setActiveTab('refyn')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'refyn'
              ? 'text-refyn-cyan border-b-2 border-refyn-cyan'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Refyn
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'text-refyn-cyan border-b-2 border-refyn-cyan'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'saved'
              ? 'text-refyn-cyan border-b-2 border-refyn-cyan'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Star className="w-4 h-4" />
          Saved
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'refyn' && (
          <div className="p-4 space-y-4">
            {/* API Key Warning */}
            {!hasApiKey && (
              <div className="p-3 bg-refyn-amber/10 border border-refyn-amber/30 rounded-lg">
                <p className="text-sm text-refyn-amber">
                  Please configure your Anthropic API key in settings to start using Refyn.
                </p>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="mt-2 text-xs text-refyn-amber hover:underline"
                >
                  Open Settings →
                </button>
              </div>
            )}

            {/* Platform Selector */}
            <PlatformSelector
              value={platform}
              onChange={handlePlatformChange}
              detectedPlatform={detectedPlatform}
            />

            {/* Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Original Prompt</span>
                {canInsert && (
                  <button
                    onClick={handleGrabFromPage}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-refyn-cyan hover:bg-refyn-cyan/10 rounded transition-colors"
                    title="Refresh from page"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Grab from page
                  </button>
                )}
              </div>
              <PromptInput
                value={inputPrompt}
                onChange={setInputPrompt}
                placeholder={canInsert ? "Prompt auto-grabbed from page..." : "Enter your prompt to enhance..."}
              />
            </div>

            {/* Quick Actions */}
            <QuickActions
              selectedMode={mode}
              onModeChange={handleModeChange}
              onRefyn={handleRefyn}
              loading={loading}
              disabled={!inputPrompt.trim() || !hasApiKey}
            />

            {/* Output */}
            <PromptOutput
              value={outputPrompt}
              loading={loading}
              error={error || undefined}
              onReset={() => {
                setOutputPrompt('');
                setGenomeTags([]);
                setError(null);
              }}
            />

            {/* Genome Tags */}
            {genomeTags.length > 0 && <GenomeTags tags={genomeTags} />}

            {/* Bottom Actions */}
            {outputPrompt && !loading && (
              <div className="space-y-2">
                {/* Primary action - Insert to page */}
                {canInsert && (
                  <Button
                    onClick={() => handleInsertToPage(outputPrompt)}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4" />
                    Insert to Page & Close
                  </Button>
                )}

                {/* Secondary actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveToLibrary}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Star className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    onClick={() => navigator.clipboard.writeText(outputPrompt)}
                    variant="secondary"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button onClick={openDashboard} variant="ghost">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No history yet</p>
                <p className="text-xs mt-1">Your refined prompts will appear here</p>
              </div>
            ) : (
              history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onSelect={handleSelectPrompt}
                  onSave={(item) => {
                    savePrompt(item.content, item.platform, item.tags).then(() => {
                      getSavedPrompts().then(setSaved);
                    });
                  }}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="p-4 space-y-3">
            {saved.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No saved prompts</p>
                <p className="text-xs mt-1">Save your favorite prompts for quick access</p>
              </div>
            ) : (
              saved.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onSelect={handleSelectPrompt}
                  onDelete={handleDeleteSaved}
                  isSaved
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          getApiKey().then((key) => setHasApiKey(!!key));
        }}
      />
    </div>
  );
};

export default App;

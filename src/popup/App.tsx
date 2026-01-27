import React, { useState, useEffect, useCallback } from 'react';
import { Star, History, ExternalLink, Download, Upload, RefreshCw, PanelRightOpen, User, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { PlatformSelector } from './components/PlatformSelector';
import { PromptInput } from './components/PromptInput';
import { PromptOutput } from './components/PromptOutput';
import { QuickActions } from './components/QuickActions';
import { ChaosSlider } from './components/ChaosSlider';
import { GenomeTags } from './components/GenomeTags';
import { SettingsPanel } from './components/SettingsPanel';
import { HistoryItem } from './components/HistoryItem';
import { Button } from './components/Button';
import { DimensionSelector } from './components/DimensionSelector';
import {
  getApiKey,
  getPromptHistory,
  getSavedPrompts,
  addToHistory,
  savePrompt,
  removeSavedPrompt,
  getTasteProfile,
  exportSavedPrompts,
  importSavedPrompts,
  recoverFromHistory,
  enableAutoSync,
} from '@/lib/storage';
import { syncToCloud, syncFromCloud, scheduleSyncToCloud } from '@/lib/supabase/sync';
import { getCurrentUser } from '@/lib/supabase/auth';
import { STORAGE_KEYS, PLATFORMS } from '@/shared/constants';
import { getPresetsForCategory } from '@/shared/presets';
import type { StylePreset } from '@/shared/types';
import type { Platform, OptimizationMode, GenomeTag, PromptRecord, TasteProfile } from '@/shared/types';

type TabType = 'refyn' | 'history' | 'saved' | 'profile';

interface DeepPreference {
  keyword: string;
  category: string;
  score: number;
  lastSeen: string;
}

/**
 * Strip --weird parameter from Midjourney prompts for moodboard compatibility
 */
function stripWeirdParameter(prompt: string): string {
  return prompt
    .replace(/\s*--weird\s*\d+/gi, '')
    .replace(/\s*--w\s+\d+/gi, '')
    .replace(/\s*--w\d+/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
}

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
  const [isMoodboardMode, setIsMoodboardMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [availablePresets, setAvailablePresets] = useState<StylePreset[]>([]);
  const [chaosIntensity, setChaosIntensity] = useState(0);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null);
  const [deepPreferences, setDeepPreferences] = useState<DeepPreference[]>([]);
  const [profileStats, setProfileStats] = useState({ refined: 0, saved: 0, liked: 0, disliked: 0 });
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);

  // Initialize
  useEffect(() => {
    initializeApp();
  }, []);

  // Update presets when platform changes
  useEffect(() => {
    const platformInfo = PLATFORMS[platform] || PLATFORMS.unknown;
    const presets = getPresetsForCategory(platformInfo.category);
    setAvailablePresets(presets);

    // Load saved preset
    chrome.storage.local.get(['refyn-last-preset']).then((result) => {
      const savedPreset = result['refyn-last-preset'];
      if (savedPreset && presets.some(p => p.id === savedPreset)) {
        setSelectedPreset(savedPreset);
      } else {
        setSelectedPreset(null);
      }
    });
  }, [platform]);

  const initializeApp = async () => {
    // Check for API key
    const key = await getApiKey();
    setHasApiKey(!!key);

    // Load history and saved prompts
    const historyData = await getPromptHistory();
    setHistory(historyData);

    let savedData = await getSavedPrompts();

    // If no saved prompts locally, try to restore from cloud
    if (savedData.length === 0) {
      const user = await getCurrentUser();
      if (user) {
        console.log('[Refyn] No local prompts, attempting cloud restore...');
        const result = await syncFromCloud();
        if (result.success && result.restoredPrompts && result.restoredPrompts > 0) {
          console.log(`[Refyn] Restored ${result.restoredPrompts} prompts from cloud`);
          savedData = await getSavedPrompts();
        }
      }
    }

    setSaved(savedData);

    // Enable auto-sync for future saves
    enableAutoSync(() => {
      scheduleSyncToCloud(5000); // Sync 5 seconds after changes
    });

    // Load last used platform and mode from storage
    const stored = await chrome.storage.local.get([STORAGE_KEYS.LAST_PLATFORM, STORAGE_KEYS.LAST_MODE, 'refyn-moodboard-mode', 'refyn-chaos-intensity', 'refyn-selected-dimensions']);
    const lastPlatform = stored[STORAGE_KEYS.LAST_PLATFORM] as Platform | undefined;
    const lastMode = stored[STORAGE_KEYS.LAST_MODE] as OptimizationMode | undefined;
    const moodboardMode = stored['refyn-moodboard-mode'] as boolean | undefined;
    const savedChaosIntensity = stored['refyn-chaos-intensity'] as number | undefined;
    const savedDimensions = stored['refyn-selected-dimensions'] as string[] | undefined;

    if (lastPlatform) {
      setPlatform(lastPlatform);
    }
    if (lastMode) {
      setMode(lastMode);
    }
    if (moodboardMode) {
      setIsMoodboardMode(moodboardMode);
    }
    if (typeof savedChaosIntensity === 'number') {
      setChaosIntensity(savedChaosIntensity);
    }
    if (Array.isArray(savedDimensions)) {
      setSelectedDimensions(savedDimensions);
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
          chaosIntensity,
          tasteProfile,
          presetId: selectedPreset,
        },
      });

      console.log('[Refyn App] Response received:', response);

      if (response.success && response.data) {
        // Apply moodboard stripping if enabled for Midjourney
        let finalPrompt = response.data.optimizedPrompt;
        if (isMoodboardMode && platform === 'midjourney') {
          finalPrompt = stripWeirdParameter(finalPrompt);
        }
        setOutputPrompt(finalPrompt);
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
  }, [inputPrompt, platform, mode, loading, hasApiKey, isMoodboardMode, selectedPreset, chaosIntensity]);

  // Handle moodboard toggle
  const handleMoodboardToggle = (enabled: boolean) => {
    setIsMoodboardMode(enabled);
    chrome.storage.local.set({ 'refyn-moodboard-mode': enabled });
  };

  // Handle preset selection
  const handlePresetChange = (presetId: string | null) => {
    setSelectedPreset(presetId);
    if (presetId) {
      chrome.storage.local.set({ 'refyn-last-preset': presetId });
    } else {
      chrome.storage.local.remove('refyn-last-preset');
    }
  };

  // Handle chaos intensity change
  const handleChaosIntensityChange = (intensity: number) => {
    setChaosIntensity(intensity);
    chrome.storage.local.set({ 'refyn-chaos-intensity': intensity });
  };

  // Handle dimension selection change
  const handleDimensionsChange = (dimensions: string[]) => {
    setSelectedDimensions(dimensions);
    chrome.storage.local.set({ 'refyn-selected-dimensions': dimensions });
    // Also apply dimensions to taste profile
    if (dimensions.length > 0) {
      chrome.runtime.sendMessage({
        type: 'APPLY_TASTE_DIMENSIONS',
        payload: { dimensionIds: dimensions, mode: 'merge' },
      }).catch(console.error);
    }
  };

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

  // Stock keywords to filter out - these are too generic
  const STOCK_KEYWORDS = [
    'trending on artstation', 'artstation', 'artstation hq', 'deviantart',
    'unreal engine', 'unreal engine 5', 'ue5', 'unity',
    'octane render', 'octane', 'vray', 'v-ray', 'cinema 4d',
    '8k', '4k', '8k resolution', '4k uhd', 'hyper-realistic',
    'highly detailed', 'ultra detailed', 'hyper detailed', 'intricate details',
    'best quality', 'masterpiece', 'award winning', 'award-winning',
    'professional', 'professional photography', 'dslr', 'canon eos', 'nikon',
    'ray tracing', 'global illumination', 'photorealistic',
  ];

  const isStockKeyword = (keyword: string): boolean => {
    const lower = keyword.toLowerCase();
    return STOCK_KEYWORDS.some(stock => lower === stock || lower.includes(stock));
  };

  // Load profile data
  const loadProfile = async () => {
    try {
      // Load deep preferences
      const deepPrefsResponse = await chrome.runtime.sendMessage({ type: 'GET_DEEP_PREFERENCES' });
      if (deepPrefsResponse?.success && deepPrefsResponse.data) {
        const prefs = deepPrefsResponse.data;

        // Niche categories to prioritize
        const nicheCategories = ['custom', 'quoted', 'technique', 'subjects', 'setting', 'colors'];

        // Extract top keywords from all categories, filtering stock keywords
        const allKeywords: DeepPreference[] = [];
        if (prefs.keywordScores) {
          for (const [category, keywords] of Object.entries(prefs.keywordScores)) {
            for (const [keyword, score] of Object.entries(keywords as Record<string, number>)) {
              // Filter out stock keywords for positive scores
              if (score > 0 && isStockKeyword(keyword)) continue;

              if (Math.abs(score) > 0.5) {
                allKeywords.push({
                  keyword,
                  category,
                  score,
                  lastSeen: prefs.stats?.lastUpdated || '',
                });
              }
            }
          }
        }

        // Sort: prioritize niche categories, then by absolute score
        allKeywords.sort((a, b) => {
          const aIsNiche = nicheCategories.includes(a.category) ? 1 : 0;
          const bIsNiche = nicheCategories.includes(b.category) ? 1 : 0;
          if (aIsNiche !== bIsNiche) return bIsNiche - aIsNiche;
          return Math.abs(b.score) - Math.abs(a.score);
        });
        setDeepPreferences(allKeywords.slice(0, 25));

        // Set stats
        if (prefs.stats) {
          setProfileStats({
            refined: history.length,
            saved: saved.length,
            liked: prefs.stats.totalLikes || 0,
            // Combine dislikes and deletes for total negative feedback
            disliked: (prefs.stats.totalDislikes || 0) + (prefs.stats.totalDeletes || 0),
          });
        }
      }

      // Also load taste profile
      const tasteResponse = await chrome.runtime.sendMessage({ type: 'GET_TASTE_PROFILE' });
      if (tasteResponse?.success && tasteResponse.data) {
        setTasteProfile(tasteResponse.data);
      }
    } catch (error) {
      console.error('[Refyn] Failed to load profile:', error);
    }
  };

  // Load profile when switching to profile tab
  useEffect(() => {
    if (activeTab === 'profile') {
      loadProfile();
    }
  }, [activeTab, history.length, saved.length]);

  // Open dashboard
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
  };

  // Open floating panel on page
  const openFloatingPanel = async () => {
    if (!currentTabId) return;
    try {
      await chrome.tabs.sendMessage(currentTabId, { type: 'FORCE_SHOW_FLOATING_PANEL' });
      window.close(); // Close popup after opening panel
    } catch {
      setError('Could not open panel on this page. Content script may not be loaded.');
    }
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
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'text-refyn-cyan border-b-2 border-refyn-cyan'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
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

            {/* Moodboard Toggle (Midjourney only) */}
            {platform === 'midjourney' && (
              <div className="flex items-center justify-between px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">Moodboard Mode</span>
                  <span className="text-xs text-zinc-500">(removes --weird)</span>
                </div>
                <button
                  onClick={() => handleMoodboardToggle(!isMoodboardMode)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    isMoodboardMode
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      isMoodboardMode ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Open Floating Panel Button */}
            <button
              onClick={openFloatingPanel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-refyn-active/50 hover:bg-refyn-active border border-refyn-cyan/20 hover:border-refyn-cyan/40 rounded-lg text-sm text-zinc-200 hover:text-refyn-cyan transition-all group"
              title="Open floating panel on page (Ctrl+Shift+E)"
            >
              <PanelRightOpen className="w-4 h-4 group-hover:text-refyn-cyan transition-colors" />
              <span>Open Floating Panel on Page</span>
              <span className="text-xs text-zinc-500 group-hover:text-zinc-400">(Ctrl+Shift+E)</span>
            </button>

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

            {/* Chaos Intensity Slider */}
            <ChaosSlider
              value={chaosIntensity}
              onChange={handleChaosIntensityChange}
              disabled={loading}
            />

            {/* Taste Stack - Modular dimension selection */}
            <DimensionSelector
              selectedDimensions={selectedDimensions}
              onDimensionsChange={handleDimensionsChange}
              disabled={loading}
            />

            {/* Quick Style Presets */}
            {availablePresets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Quick Presets</span>
                  {selectedPreset && (
                    <button
                      onClick={() => handlePresetChange(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availablePresets.slice(0, 8).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id === selectedPreset ? null : preset.id)}
                      className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-refyn-cyan/20 text-refyn-cyan border border-refyn-cyan/40'
                          : 'bg-refyn-active/50 text-zinc-400 border border-transparent hover:bg-refyn-active hover:text-zinc-200'
                      }`}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            {/* Library Actions */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-700/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const json = await exportSavedPrompts();
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `refyn-library-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Export failed:', err);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-refyn-cyan hover:bg-refyn-cyan/10 rounded transition-colors"
                  title="Export library to JSON"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <label className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-refyn-cyan hover:bg-refyn-cyan/10 rounded transition-colors cursor-pointer">
                  <Upload className="w-3 h-3" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const result = await importSavedPrompts(text);
                        const updated = await getSavedPrompts();
                        setSaved(updated);
                        alert(`Imported ${result.imported} prompts (${result.skipped} already existed)`);
                      } catch (err) {
                        alert('Import failed: ' + String(err));
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && saved.length === 0 && (
                  <button
                    onClick={async () => {
                      const recovered = await recoverFromHistory();
                      if (recovered > 0) {
                        const updated = await getSavedPrompts();
                        setSaved(updated);
                        alert(`Recovered ${recovered} prompts from history!`);
                      } else {
                        alert('No new prompts to recover');
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 hover:bg-amber-400/10 rounded transition-colors"
                    title="Recover prompts from history"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Recover
                  </button>
                )}
                <button
                  onClick={async () => {
                    const user = await getCurrentUser();
                    if (!user) {
                      alert('Please sign in to sync');
                      return;
                    }
                    const result = await syncToCloud();
                    if (result.success) {
                      alert('Synced to cloud!');
                    } else {
                      alert('Sync failed: ' + result.error);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-refyn-cyan hover:bg-refyn-cyan/10 rounded transition-colors"
                  title="Sync to cloud"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync
                </button>
              </div>
            </div>

            {saved.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No saved prompts</p>
                <p className="text-xs mt-1">Save your favorite prompts for quick access</p>
                {history.length > 0 && (
                  <button
                    onClick={async () => {
                      const recovered = await recoverFromHistory();
                      if (recovered > 0) {
                        const updated = await getSavedPrompts();
                        setSaved(updated);
                      }
                    }}
                    className="mt-3 px-3 py-1.5 text-xs text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 rounded transition-colors"
                  >
                    Recover {history.length} from History
                  </button>
                )}
              </div>
            ) : (
              saved
                .filter((item) => item && item.id && item.content) // Filter out invalid items
                .map((item) => (
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

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            {/* Profile Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-200">Taste Profile</h3>
              <button
                onClick={loadProfile}
                className="flex items-center gap-1 px-2 py-1 text-xs text-refyn-cyan hover:bg-refyn-cyan/10 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {/* Taste Learning Progress */}
            {(() => {
              const totalFeedback = profileStats.liked + profileStats.disliked;
              const targetBasic = 20;
              const targetGood = 50;
              const targetExcellent = 100;
              const maxTarget = 150;

              let level = 'Getting Started';
              let levelColor = 'text-zinc-400';
              let progressColor = 'bg-zinc-500';
              let nextMilestone = targetBasic;
              let progressPercent = Math.min((totalFeedback / maxTarget) * 100, 100);

              if (totalFeedback >= targetExcellent) {
                level = 'Excellent';
                levelColor = 'text-green-400';
                progressColor = 'bg-green-500';
                nextMilestone = maxTarget;
              } else if (totalFeedback >= targetGood) {
                level = 'Good Understanding';
                levelColor = 'text-refyn-cyan';
                progressColor = 'bg-refyn-cyan';
                nextMilestone = targetExcellent;
              } else if (totalFeedback >= targetBasic) {
                level = 'Learning';
                levelColor = 'text-yellow-400';
                progressColor = 'bg-yellow-500';
                nextMilestone = targetGood;
              }

              return (
                <div className="bg-refyn-active/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Taste Recognition:</span>
                      <span className={`text-xs font-medium ${levelColor}`}>{level}</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {totalFeedback}/{nextMilestone} ratings
                    </span>
                  </div>
                  <div className="h-2 bg-refyn-active/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressColor} transition-all duration-500`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-600">
                    <span>0</span>
                    <span className={totalFeedback >= targetBasic ? 'text-yellow-500' : ''}>20</span>
                    <span className={totalFeedback >= targetGood ? 'text-refyn-cyan' : ''}>50</span>
                    <span className={totalFeedback >= targetExcellent ? 'text-green-400' : ''}>100</span>
                    <span>150+</span>
                  </div>
                  {totalFeedback < targetBasic && (
                    <p className="text-[10px] text-zinc-500 text-center">
                      Rate {targetBasic - totalFeedback} more images for basic taste recognition
                    </p>
                  )}
                  {totalFeedback >= targetBasic && totalFeedback < targetGood && (
                    <p className="text-[10px] text-zinc-500 text-center">
                      Rate {targetGood - totalFeedback} more for improved suggestions
                    </p>
                  )}
                  {totalFeedback >= targetGood && totalFeedback < targetExcellent && (
                    <p className="text-[10px] text-zinc-500 text-center">
                      Rate {targetExcellent - totalFeedback} more for excellent personalization
                    </p>
                  )}
                  {totalFeedback >= targetExcellent && (
                    <p className="text-[10px] text-green-400/70 text-center">
                      Great job! Your taste profile is well-trained
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-refyn-active/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-refyn-cyan">{profileStats.refined}</div>
                <div className="text-xs text-zinc-500">Refined</div>
              </div>
              <div className="bg-refyn-active/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-400">{profileStats.saved}</div>
                <div className="text-xs text-zinc-500">Saved</div>
              </div>
              <div className="bg-refyn-active/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-400">{profileStats.liked}</div>
                <div className="text-xs text-zinc-500">Liked</div>
              </div>
              <div className="bg-refyn-active/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-400">{profileStats.disliked}</div>
                <div className="text-xs text-zinc-500">Disliked</div>
              </div>
            </div>

            {/* Taste Profile Keywords */}
            {deepPreferences.length > 0 ? (
              <div className="space-y-3">
                {/* Liked Keywords */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-medium text-zinc-300">Keywords You Like</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {deepPreferences
                      .filter((p) => p.score > 0)
                      .slice(0, 10)
                      .map((pref, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20"
                          title={`${pref.category}: ${pref.score.toFixed(1)}`}
                        >
                          {pref.keyword}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Disliked Keywords - Always show */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 text-red-400 text-xs">✕</span>
                    <span className="text-xs font-medium text-zinc-300">Keywords to Avoid</span>
                  </div>
                  {deepPreferences.filter((p) => p.score < 0).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {deepPreferences
                        .filter((p) => p.score < 0)
                        .slice(0, 10)
                        .map((pref, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                            title={`${pref.category}: ${pref.score.toFixed(1)}`}
                          >
                            {pref.keyword}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Dislike outputs to teach Refyn what to avoid
                    </p>
                  )}
                </div>

                {/* Learning Source - More specific than generic categories */}
                <div className="space-y-2 pt-2 border-t border-refyn-active/20">
                  <span className="text-xs font-medium text-zinc-500">Learned From</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const sources = new Map<string, number>();
                      deepPreferences.slice(0, 15).forEach(p => {
                        const source = p.category === 'custom' ? 'Your Prompts' :
                                      p.category === 'quoted' ? 'Quoted Text' :
                                      p.category === 'technique' ? 'AI Vision' :
                                      p.category === 'subjects' ? 'AI Vision' :
                                      p.category === 'colors' ? 'AI Vision' :
                                      p.category === 'setting' ? 'AI Vision' :
                                      'Prompt Keywords';
                        sources.set(source, (sources.get(source) || 0) + 1);
                      });
                      return Array.from(sources.entries()).map(([source, count]) => (
                        <span
                          key={source}
                          className="px-2 py-1 text-xs rounded-full bg-refyn-active/30 text-zinc-400"
                        >
                          {source} ({count})
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Your taste profile builds as you use Refyn</p>
                <p className="text-xs mt-1">Like/dislike results to train your preferences</p>
              </div>
            )}

            {/* Taste Profile from simple system */}
            {tasteProfile && (tasteProfile.visual?.style?.length || tasteProfile.visual?.lighting?.length) && (
              <div className="space-y-2 pt-2 border-t border-refyn-active/30">
                <span className="text-xs font-medium text-zinc-400">Style Preferences</span>
                <div className="flex flex-wrap gap-1.5">
                  {tasteProfile.visual?.style?.slice(0, 4).map((style, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    >
                      {style}
                    </span>
                  ))}
                  {tasteProfile.visual?.lighting?.slice(0, 3).map((light, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    >
                      {light}
                    </span>
                  ))}
                </div>
              </div>
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

import { optimizePrompt, validateApiKey } from './api';
import {
  getApiKey,
  saveApiKey,
  removeApiKey,
  getSettings,
  saveSettings,
  getTasteProfile,
  saveTasteProfile,
  getPromptHistory,
  addToHistory,
  getSavedPrompts,
  savePrompt,
  removeSavedPrompt,
  addLineageNode,
  getLineage,
  updatePromptRating,
  updatePromptFeedback,
  updatePromptLiked,
} from '@/lib/storage';
import { CLAUDE_API_ENDPOINT, CLAUDE_MODEL } from '@/shared/constants';
import {
  saveSupabaseConfig,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import {
  signIn,
  signUp,
  signOut,
  getAuthState,
} from '@/lib/supabase/auth';
import {
  syncToCloud,
  syncFromCloud,
  getSyncStatus,
} from '@/lib/supabase/sync';
import {
  startCaptureSession,
  logPromptVersion,
  logRejection,
  logSelection,
  endCaptureSession,
  setContributionConsent,
  getContributorStats,
  getContributorId,
  restoreActiveSession,
  processPendingSubmissions,
  getActiveSession,
  getCurrentVersionId,
} from '@/lib/processCapture';
import type { Platform, OptimizationMode, TasteProfile } from '@/shared/types';
import { getDeepPreferences } from '@/lib/deepLearning';
import {
  exportTastePack,
  importTastePack,
  TASTE_DIMENSIONS,
  TASTE_LAYERS,
  getDimensionsByLayer,
  applyDimensions,
  type TastePack,
  type TasteLayer,
} from '@/lib/tasteLibrary';
import {
  buildVisionPrompt,
  parseVisionResponse,
} from '@/lib/visionAnalysis';

// Message types
interface OptimizeMessage {
  type: 'OPTIMIZE_PROMPT';
  payload: {
    prompt: string;
    platform: Platform;
    mode: OptimizationMode;
    chaosIntensity?: number;
    variationIntensity?: number;
    previousRefinedPrompt?: string | null;
    tasteProfile?: TasteProfile;
    presetId?: string | null;
    preferenceContext?: string;
    themeId?: string | null;
  };
}

interface ApiKeyMessage {
  type: 'GET_API_KEY' | 'REMOVE_API_KEY';
}

interface SetApiKeyMessage {
  type: 'SET_API_KEY' | 'VALIDATE_API_KEY';
  payload: string;
}

interface SavePromptMessage {
  type: 'SAVE_PROMPT';
  payload: {
    content: string;
    platform: Platform;
    tags?: string[];
    outputImageUrl?: string;
    referenceImages?: string[];
    imagePrompts?: string[];
    extractedParams?: Record<string, string | undefined>;
  };
}

interface GetDataMessage {
  type: 'GET_HISTORY' | 'GET_SAVED' | 'GET_SETTINGS' | 'GET_TASTE_PROFILE' | 'GET_DEEP_PREFERENCES';
}

interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  payload: Record<string, unknown>;
}

interface UpdateTasteProfileMessage {
  type: 'UPDATE_TASTE_PROFILE';
  payload: TasteProfile;
}

interface DeletePromptMessage {
  type: 'DELETE_SAVED_PROMPT';
  payload: string;
}

interface RatePromptMessage {
  type: 'RATE_PROMPT';
  payload: {
    promptId: string;
    rating: number; // 1-5
  };
}

interface SetPromptLikedMessage {
  type: 'SET_PROMPT_LIKED';
  payload: {
    promptId: string;
    liked: boolean | undefined; // true = liked, false = disliked, undefined = neutral
  };
}

interface AnalyzePromptMessage {
  type: 'ANALYZE_PROMPT';
  payload: {
    promptId: string;
    content: string;
    platform: Platform;
  };
}

interface LineageMessage {
  type: 'ADD_LINEAGE_NODE' | 'GET_LINEAGE';
  payload: {
    content?: string;
    platform?: Platform;
    parentId?: string;
    mode?: string;
    nodeId?: string;
  };
}

// CTAD Process Capture Messages
interface StartCaptureMessage {
  type: 'START_CAPTURE_SESSION';
  payload: { platform: Platform };
}

interface LogPromptVersionMessage {
  type: 'LOG_PROMPT_VERSION';
  payload: {
    content: string;
    mode: OptimizationMode | 'manual';
    parentId?: string;
    metadata?: Record<string, unknown>;
  };
}

interface LogRejectionMessage {
  type: 'LOG_REJECTION';
  payload: {
    promptVersionId: string;
    reason?: string;
    customFeedback?: string;
  };
}

interface LogSelectionMessage {
  type: 'LOG_SELECTION';
  payload: {
    promptVersionId: string;
    likeReason?: string;
    customFeedback?: string;
    outputHash?: string;
  };
}

interface EndCaptureMessage {
  type: 'END_CAPTURE_SESSION';
}

interface ContributionConsentMessage {
  type: 'SET_CONTRIBUTION_CONSENT';
  payload: { enabled: boolean };
}

interface GetContributorDataMessage {
  type: 'GET_CONTRIBUTOR_STATS' | 'GET_CONTRIBUTOR_ID' | 'GET_ACTIVE_SESSION' | 'GET_CURRENT_VERSION_ID';
}

// Auth Messages
interface AuthSignInMessage {
  type: 'AUTH_SIGN_IN';
  payload: { email: string; password: string };
}

interface AuthSignUpMessage {
  type: 'AUTH_SIGN_UP';
  payload: { email: string; password: string };
}

interface AuthSignOutMessage {
  type: 'AUTH_SIGN_OUT';
}

interface AuthGetStateMessage {
  type: 'AUTH_GET_STATE';
}

interface AuthConfigureMessage {
  type: 'AUTH_CONFIGURE';
  payload: { url: string; anonKey: string };
}

interface SyncMessage {
  type: 'SYNC_TO_CLOUD' | 'SYNC_FROM_CLOUD' | 'GET_SYNC_STATUS';
}

// Vision Analysis Messages
interface AnalyzeImageMessage {
  type: 'ANALYZE_IMAGE';
  payload: { imageUrl: string; platform: Platform };
}

// Taste Library Messages
interface ExportTastePackMessage {
  type: 'EXPORT_TASTE_PACK';
  payload: { name: string; description: string; tags: string[] };
}

interface ImportTastePackMessage {
  type: 'IMPORT_TASTE_PACK';
  payload: { pack: unknown; mode: 'merge' | 'replace' };
}

interface GetTasteLayersMessage {
  type: 'GET_TASTE_LAYERS';
}

interface GetTasteDimensionsMessage {
  type: 'GET_TASTE_DIMENSIONS';
  payload?: { layer?: TasteLayer };
}

interface ApplyTasteDimensionsMessage {
  type: 'APPLY_TASTE_DIMENSIONS';
  payload: { dimensionIds: string[]; mode: 'merge' | 'replace' };
}

interface GetPreferencesMessage {
  type: 'GET_PREFERENCES';
}

type Message =
  | OptimizeMessage
  | ApiKeyMessage
  | SetApiKeyMessage
  | SavePromptMessage
  | GetDataMessage
  | UpdateSettingsMessage
  | UpdateTasteProfileMessage
  | DeletePromptMessage
  | RatePromptMessage
  | SetPromptLikedMessage
  | AnalyzePromptMessage
  | LineageMessage
  | StartCaptureMessage
  | LogPromptVersionMessage
  | LogRejectionMessage
  | LogSelectionMessage
  | EndCaptureMessage
  | ContributionConsentMessage
  | GetContributorDataMessage
  | AuthSignInMessage
  | AuthSignUpMessage
  | AuthSignOutMessage
  | AuthGetStateMessage
  | AuthConfigureMessage
  | SyncMessage
  | AnalyzeImageMessage
  | ExportTastePackMessage
  | ImportTastePackMessage
  | GetTasteLayersMessage
  | GetTasteDimensionsMessage
  | ApplyTasteDimensionsMessage
  | GetPreferencesMessage;

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    handleMessage(message)
      .then(sendResponse)
      .catch((error) => {
        console.error('[Refyn Background] Error:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error' });
      });

    return true; // Keep channel open for async response
  }
);

// Main message handler
async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    // Prompt optimization
    case 'OPTIMIZE_PROMPT': {
      const { prompt, platform, mode, chaosIntensity, variationIntensity, previousRefinedPrompt, tasteProfile, presetId, preferenceContext, themeId } = message.payload;
      console.log('[Refyn Background] Optimizing prompt for platform:', platform, 'mode:', mode, 'variation:', variationIntensity);

      // Build preference context from deep preferences if not provided
      let finalPreferenceContext = preferenceContext;
      if (!finalPreferenceContext) {
        try {
          const deepPrefs = await getDeepPreferences();
          if (deepPrefs && deepPrefs.keywordScores && Object.keys(deepPrefs.keywordScores).length > 0) {
            const likedKeywords: string[] = [];
            const avoidKeywords: string[] = [];

            for (const [_category, keywords] of Object.entries(deepPrefs.keywordScores)) {
              for (const [keyword, score] of Object.entries(keywords)) {
                if (score >= 2) {
                  likedKeywords.push(keyword);
                } else if (score <= -2) {
                  avoidKeywords.push(keyword);
                }
              }
            }

            if (likedKeywords.length > 0 || avoidKeywords.length > 0) {
              finalPreferenceContext = `\n\nUSER TASTE PREFERENCES (from learned taste stack):\n`;
              if (likedKeywords.length > 0) {
                finalPreferenceContext += `STRONGLY INCORPORATE: ${likedKeywords.slice(0, 20).join(', ')}\n`;
              }
              if (avoidKeywords.length > 0) {
                finalPreferenceContext += `AVOID: ${avoidKeywords.slice(0, 10).join(', ')}\n`;
              }
            }
          }
        } catch (e) {
          console.error('[Refyn Background] Failed to get deep preferences:', e);
        }
      }

      const result = await optimizePrompt(prompt, platform, mode, tasteProfile, presetId, finalPreferenceContext, chaosIntensity, themeId as any, variationIntensity, previousRefinedPrompt);

      if (result.success && result.optimizedPrompt) {
        // Add to history
        console.log('[Refyn Background] Adding to history...');
        try {
          await addToHistory(result.optimizedPrompt, platform);
          console.log('[Refyn Background] Added to history successfully');
        } catch (e) {
          console.error('[Refyn Background] Failed to add to history:', e);
        }

        // Add to lineage tree
        try {
          await addLineageNode(result.optimizedPrompt, platform, undefined, mode);
        } catch (e) {
          console.error('[Refyn Background] Failed to add lineage:', e);
        }
      } else {
        console.log('[Refyn Background] Optimization failed:', result.error);
      }

      return {
        success: result.success,
        data: {
          optimizedPrompt: result.optimizedPrompt,
          genomeTags: result.genomeTags,
        },
        error: result.error,
      };
    }

    // API Key management
    case 'GET_API_KEY': {
      const key = await getApiKey();
      return { success: true, data: !!key };
    }

    case 'SET_API_KEY': {
      await saveApiKey(message.payload);
      return { success: true };
    }

    case 'REMOVE_API_KEY': {
      await removeApiKey();
      return { success: true };
    }

    case 'VALIDATE_API_KEY': {
      const isValid = await validateApiKey(message.payload);
      return { success: true, data: isValid };
    }

    // Prompt saving
    case 'SAVE_PROMPT': {
      const { content, platform, tags, outputImageUrl, referenceImages, imagePrompts, extractedParams } = message.payload;
      const saved = await savePrompt(content, platform, tags || [], {
        outputImageUrl,
        referenceImages,
        imagePrompts,
        extractedParams,
      });
      return { success: true, data: saved };
    }

    case 'DELETE_SAVED_PROMPT': {
      await removeSavedPrompt(message.payload);
      return { success: true };
    }

    // Rate a saved prompt (1-5 stars)
    case 'RATE_PROMPT': {
      const { promptId, rating } = message.payload;
      await updatePromptRating(promptId, rating);
      return { success: true };
    }

    // Set prompt liked/disliked status
    case 'SET_PROMPT_LIKED': {
      const { promptId, liked } = message.payload;
      await updatePromptLiked(promptId, liked);
      return { success: true };
    }

    // Analyze a prompt and get AI feedback
    case 'ANALYZE_PROMPT': {
      const { promptId, content, platform } = message.payload;
      const feedback = await analyzePromptQuality(content, platform);
      if (feedback) {
        await updatePromptFeedback(promptId, feedback);
      }
      return { success: true, data: feedback };
    }

    // Data retrieval
    case 'GET_HISTORY': {
      const history = await getPromptHistory();
      console.log('[Refyn Background] GET_HISTORY returning', history.length, 'items');
      return { success: true, data: history };
    }

    case 'GET_SAVED': {
      const saved = await getSavedPrompts();
      console.log('[Refyn Background] GET_SAVED returning', saved.length, 'items');
      return { success: true, data: saved };
    }

    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { success: true, data: settings };
    }

    case 'UPDATE_SETTINGS': {
      await saveSettings(message.payload);
      return { success: true };
    }

    // Taste profile
    case 'GET_TASTE_PROFILE': {
      const profile = await getTasteProfile();
      return { success: true, data: profile };
    }

    // Deep preferences
    case 'GET_DEEP_PREFERENCES': {
      const deepPrefs = await getDeepPreferences();
      return { success: true, data: deepPrefs };
    }

    case 'UPDATE_TASTE_PROFILE': {
      await saveTasteProfile(message.payload);
      return { success: true };
    }

    // Lineage
    case 'ADD_LINEAGE_NODE': {
      const { content, platform, parentId, mode } = message.payload;
      if (content && platform) {
        const node = await addLineageNode(
          content,
          platform,
          parentId,
          (mode as 'enhance' | 'expand' | 'style' | 'params' | 'manual') || 'manual'
        );
        return { success: true, data: node };
      }
      return { success: false, error: 'Missing required fields' };
    }

    case 'GET_LINEAGE': {
      const { nodeId } = message.payload;
      if (nodeId) {
        const lineage = await getLineage(nodeId);
        return { success: true, data: lineage };
      }
      return { success: false, error: 'Node ID required' };
    }

    // ========================================
    // CTAD Process Capture
    // ========================================

    case 'START_CAPTURE_SESSION': {
      const { platform } = message.payload;
      const session = await startCaptureSession(platform);
      return { success: true, data: session };
    }

    case 'LOG_PROMPT_VERSION': {
      const { content, mode, parentId, metadata } = message.payload;
      const version = await logPromptVersion(content, mode, parentId || null, metadata);
      return { success: true, data: version };
    }

    case 'LOG_REJECTION': {
      const { promptVersionId, reason, customFeedback } = message.payload;
      const rejection = await logRejection(
        promptVersionId,
        reason as 'poor-quality' | 'wrong-style' | 'doesnt-match' | 'too-generic' | 'technical-issue' | 'other' | undefined,
        customFeedback
      );
      return { success: true, data: rejection };
    }

    case 'LOG_SELECTION': {
      const { promptVersionId, likeReason, customFeedback, outputHash } = message.payload;
      const selection = await logSelection(
        promptVersionId,
        likeReason as 'great-style' | 'perfect-colors' | 'matches-intent' | 'unique' | 'technical-quality' | 'other' | undefined,
        customFeedback,
        outputHash
      );
      return { success: true, data: selection };
    }

    case 'END_CAPTURE_SESSION': {
      await endCaptureSession();
      return { success: true };
    }

    case 'SET_CONTRIBUTION_CONSENT': {
      const { enabled } = message.payload;
      await setContributionConsent(enabled);
      return { success: true };
    }

    case 'GET_CONTRIBUTOR_STATS': {
      const stats = await getContributorStats();
      return { success: true, data: stats };
    }

    case 'GET_CONTRIBUTOR_ID': {
      const contributorId = await getContributorId();
      return { success: true, data: contributorId };
    }

    case 'GET_ACTIVE_SESSION': {
      const session = getActiveSession();
      return { success: true, data: session };
    }

    case 'GET_CURRENT_VERSION_ID': {
      const versionId = getCurrentVersionId();
      return { success: true, data: versionId };
    }

    // ========================================
    // Authentication & Cloud Sync
    // ========================================

    case 'AUTH_CONFIGURE': {
      const { url, anonKey } = message.payload;
      await saveSupabaseConfig({ url, anonKey });
      return { success: true };
    }

    case 'AUTH_SIGN_IN': {
      const { email, password } = message.payload;
      const signInResult = await signIn(email, password);
      if (signInResult.success) {
        // Auto-sync after login
        syncFromCloud().catch(console.error);
      }
      return signInResult;
    }

    case 'AUTH_SIGN_UP': {
      const signUpPayload = message.payload;
      const signUpResult = await signUp(signUpPayload.email, signUpPayload.password);
      return signUpResult;
    }

    case 'AUTH_SIGN_OUT': {
      // Sync before logging out
      await syncToCloud().catch(console.error);
      const signOutResult = await signOut();
      return signOutResult;
    }

    case 'AUTH_GET_STATE': {
      const authState = await getAuthState();
      const configured = await isSupabaseConfigured();
      return {
        success: true,
        data: {
          ...authState,
          isConfigured: configured,
        },
      };
    }

    case 'SYNC_TO_CLOUD': {
      const toCloudResult = await syncToCloud();
      return toCloudResult;
    }

    case 'SYNC_FROM_CLOUD': {
      const fromCloudResult = await syncFromCloud();
      return fromCloudResult;
    }

    case 'GET_SYNC_STATUS': {
      const syncStatus = await getSyncStatus();
      return { success: true, data: syncStatus };
    }

    // Vision Analysis
    case 'ANALYZE_IMAGE': {
      const { imageUrl, platform: _platform } = message.payload;

      try {
        // Get API key for Claude vision
        const apiKey = await getApiKey();
        if (!apiKey) {
          return { success: false, error: 'API key required for image analysis' };
        }

        // Call Claude API with vision
        const response = await fetch(CLAUDE_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'url',
                      url: imageUrl,
                    },
                  },
                  {
                    type: 'text',
                    text: buildVisionPrompt(),
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return { success: false, error: errorData.error?.message || 'Vision API failed' };
        }

        const data = await response.json();
        const assistantMessage = data.content?.[0]?.text || '';
        const descriptors = parseVisionResponse(assistantMessage);

        if (descriptors) {
          return { success: true, descriptors };
        }

        return { success: false, error: 'Failed to parse vision response' };
      } catch (error) {
        console.error('[Refyn] Vision analysis error:', error);
        return { success: false, error: String(error) };
      }
    }

    // Taste Library - Export
    case 'EXPORT_TASTE_PACK': {
      const { name, description, tags } = message.payload;
      try {
        const pack = await exportTastePack(name, description, tags);
        return { success: true, pack };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }

    // Taste Library - Import
    case 'IMPORT_TASTE_PACK': {
      const { pack, mode } = message.payload;
      try {
        const result = await importTastePack(pack as TastePack, mode);
        return result;
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }

    // Taste Library - Get Layers
    case 'GET_TASTE_LAYERS': {
      return {
        success: true,
        layers: Object.entries(TASTE_LAYERS).map(([id, info]) => ({
          id,
          name: info.name,
          description: info.description,
        })),
      };
    }

    // Taste Library - Get Dimensions
    case 'GET_TASTE_DIMENSIONS': {
      const layer = message.payload?.layer;
      const dimensions = layer
        ? getDimensionsByLayer(layer)
        : TASTE_DIMENSIONS;

      return {
        success: true,
        dimensions: dimensions.map((d) => ({
          id: d.id,
          name: d.name,
          layer: d.layer,
          description: d.description,
        })),
      };
    }

    // Taste Library - Apply Dimensions
    case 'APPLY_TASTE_DIMENSIONS': {
      const { dimensionIds, mode } = message.payload;
      try {
        const result = await applyDimensions(dimensionIds, mode);
        return result;
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }

    // Get Deep Preferences (for taste learning progress)
    case 'GET_PREFERENCES': {
      try {
        const prefs = await getDeepPreferences();
        return { success: true, data: prefs };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Refyn] Extension installed');

    // Open onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/index.html?onboarding=true'),
    });
  } else if (details.reason === 'update') {
    console.log('[Refyn] Extension updated to version', chrome.runtime.getManifest().version);
  } else if (details.reason === 'chrome_update') {
    console.log('[Refyn] Browser updated, reinitializing auth...');
    initializeAuth().catch(console.error);
  }

  // Create context menu items
  try {
    chrome.contextMenus.create({
      id: 'refyn-selection',
      title: 'Refyn this prompt',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'refyn-open-dashboard',
      title: 'Open Refyn Dashboard',
      contexts: ['action'],
    });
  } catch (e) {
    console.log('[Refyn] Context menus already exist');
  }
});

// Handle browser startup - restore auth session
chrome.runtime.onStartup.addListener(() => {
  console.log('[Refyn] Browser started, restoring auth session...');
  initializeAuth().catch(console.error);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'refyn-selection' && info.selectionText && tab?.id) {
    // Send message to content script to optimize selection
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'OPTIMIZE_SELECTION',
        payload: 'enhance',
      });
    } catch (error) {
      console.error('[Refyn] Failed to optimize selection:', error);
    }
  } else if (info.menuItemId === 'refyn-open-dashboard') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('dashboard/index.html'),
    });
  }
});

// Keep service worker alive for API calls
// This is needed because the service worker can be terminated between API calls
const keepAlive = () => {
  setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // Just to keep the service worker active
    });
  }, 25000);
};

keepAlive();

// Initialize CTAD process capture
async function initializeProcessCapture() {
  try {
    // Restore any active session from storage
    await restoreActiveSession();

    // Process any pending submissions from previous sessions
    await processPendingSubmissions();

    console.log('[Refyn] Process capture initialized');
  } catch (error) {
    console.error('[Refyn] Failed to initialize process capture:', error);
  }
}

// Initialize authentication - restore session on startup
async function initializeAuth() {
  try {
    console.log('[Refyn] Restoring auth session...');

    // Check if Supabase is configured
    const configured = await isSupabaseConfigured();
    if (!configured) {
      console.log('[Refyn] Supabase not configured, skipping auth restore');
      return;
    }

    // Get auth state - this will attempt to refresh the session from stored tokens
    const authState = await getAuthState();

    if (authState.isLoggedIn && authState.user) {
      console.log('[Refyn] Auth session restored for:', authState.user.email);

      // Optionally sync from cloud on restore
      try {
        await syncFromCloud();
        console.log('[Refyn] Synced from cloud after auth restore');
      } catch (syncError) {
        console.error('[Refyn] Failed to sync from cloud:', syncError);
      }
    } else {
      console.log('[Refyn] No active auth session found');
    }
  } catch (error) {
    console.error('[Refyn] Failed to initialize auth:', error);
  }
}

// Analyze prompt quality using Claude API
async function analyzePromptQuality(
  content: string,
  platform: Platform
): Promise<{ score: number; strengths: string[]; improvements: string[]; analyzedAt: string } | null> {
  const apiKey = await getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(CLAUDE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        system: `You are an expert prompt analyst for AI image/music/video generation. Analyze prompts and provide actionable feedback. Be concise but specific. Platform: ${platform}`,
        messages: [{
          role: 'user',
          content: `Analyze this prompt and respond in EXACTLY this JSON format (no markdown, no code blocks):
{"score":X,"strengths":["strength1","strength2"],"improvements":["improvement1","improvement2"]}

Score 1-5 (5=excellent). Max 2-3 items per array. Keep each item under 10 words.

Prompt to analyze:
${content}`
        }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();

    if (!text) return null;

    // Parse JSON response
    const parsed = JSON.parse(text);

    return {
      score: Math.max(1, Math.min(5, parsed.score || 3)),
      strengths: (parsed.strengths || []).slice(0, 3),
      improvements: (parsed.improvements || []).slice(0, 3),
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Refyn] Failed to analyze prompt:', error);
    return null;
  }
}

// Run initialization
async function initialize() {
  console.log('[Refyn] Starting service worker initialization...');

  // Initialize auth first to restore user session
  await initializeAuth();

  // Then initialize process capture
  await initializeProcessCapture();

  console.log('[Refyn] Background service worker fully initialized');
}

initialize();

// Periodically try to submit pending contributions (every 5 minutes)
setInterval(() => {
  processPendingSubmissions().catch((error) => {
    console.error('[Refyn] Failed to process pending submissions:', error);
  });
}, 5 * 60 * 1000);

// Periodically refresh auth session to prevent expiry (every 10 minutes)
setInterval(async () => {
  try {
    const configured = await isSupabaseConfigured();
    if (configured) {
      const authState = await getAuthState();
      if (authState.isLoggedIn) {
        console.log('[Refyn] Auth session refreshed');
      }
    }
  } catch (error) {
    console.error('[Refyn] Failed to refresh auth session:', error);
  }
}, 10 * 60 * 1000);

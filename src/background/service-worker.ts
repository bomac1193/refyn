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
} from '@/lib/storage';
import type { Platform, OptimizationMode, TasteProfile } from '@/shared/types';

// Message types
interface OptimizeMessage {
  type: 'OPTIMIZE_PROMPT';
  payload: {
    prompt: string;
    platform: Platform;
    mode: OptimizationMode;
    tasteProfile?: TasteProfile;
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
  };
}

interface GetDataMessage {
  type: 'GET_HISTORY' | 'GET_SAVED' | 'GET_SETTINGS' | 'GET_TASTE_PROFILE';
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

type Message =
  | OptimizeMessage
  | ApiKeyMessage
  | SetApiKeyMessage
  | SavePromptMessage
  | GetDataMessage
  | UpdateSettingsMessage
  | UpdateTasteProfileMessage
  | DeletePromptMessage
  | LineageMessage;

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
      const { prompt, platform, mode, tasteProfile } = message.payload;
      const result = await optimizePrompt(prompt, platform, mode, tasteProfile);

      if (result.success && result.optimizedPrompt) {
        // Add to history
        await addToHistory(result.optimizedPrompt, platform);

        // Add to lineage tree
        await addLineageNode(result.optimizedPrompt, platform, undefined, mode);
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
      const { content, platform, tags } = message.payload;
      const saved = await savePrompt(content, platform, tags || []);
      return { success: true, data: saved };
    }

    case 'DELETE_SAVED_PROMPT': {
      await removeSavedPrompt(message.payload);
      return { success: true };
    }

    // Data retrieval
    case 'GET_HISTORY': {
      const history = await getPromptHistory();
      return { success: true, data: history };
    }

    case 'GET_SAVED': {
      const saved = await getSavedPrompts();
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

console.log('[Refyn] Background service worker initialized');

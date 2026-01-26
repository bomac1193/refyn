import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/shared/constants';
import { encryptKey, decryptKey, generateId } from '@/shared/utils';
import type {
  TasteProfile,
  PromptRecord,
  PromptNode,
  UserSettings,
  Platform,
} from '@/shared/types';

/**
 * Chrome Storage wrapper with type safety
 */

// API Key Management
export async function saveApiKey(key: string): Promise<void> {
  console.log('[Refyn Storage] Saving API key:', key.substring(0, 15) + '...');
  const encrypted = encryptKey(key);
  await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: encrypted });
  console.log('[Refyn Storage] API key saved successfully');
}

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  if (result[STORAGE_KEYS.API_KEY]) {
    const decrypted = decryptKey(result[STORAGE_KEYS.API_KEY]);
    console.log('[Refyn Storage] API key retrieved:', decrypted.substring(0, 15) + '...');
    return decrypted;
  }
  console.log('[Refyn Storage] No API key found');
  return null;
}

export async function removeApiKey(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.API_KEY);
}

// Settings Management
export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: { ...current, ...settings },
  });
}

// Taste Profile Management
export async function getTasteProfile(): Promise<TasteProfile | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TASTE_PROFILE);
  return result[STORAGE_KEYS.TASTE_PROFILE] || null;
}

export async function saveTasteProfile(profile: TasteProfile): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.TASTE_PROFILE]: {
      ...profile,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function createDefaultTasteProfile(): TasteProfile {
  return {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    visual: {
      colorPalette: [],
      lighting: [],
      composition: [],
      style: [],
    },
    audio: {
      genres: [],
      moods: [],
      tempo: [],
      production: [],
      vocalStyle: [],
    },
    patterns: {
      frequentKeywords: {},
      preferredParameters: {},
      successfulPrompts: [],
    },
  };
}

// Prompt History Management
export async function getPromptHistory(): Promise<PromptRecord[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROMPT_HISTORY);
  return result[STORAGE_KEYS.PROMPT_HISTORY] || [];
}

export async function addToHistory(
  content: string,
  platform: Platform,
  tags: string[] = []
): Promise<PromptRecord> {
  const history = await getPromptHistory();
  const record: PromptRecord = {
    id: generateId(),
    content,
    platform,
    createdAt: new Date(),
    tags,
  };

  // Keep last 100 entries
  const newHistory = [record, ...history].slice(0, 100);
  await chrome.storage.local.set({
    [STORAGE_KEYS.PROMPT_HISTORY]: newHistory,
  });

  return record;
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.PROMPT_HISTORY]: [],
  });
}

// Saved Prompts Management
export async function getSavedPrompts(): Promise<PromptRecord[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SAVED_PROMPTS);
  return result[STORAGE_KEYS.SAVED_PROMPTS] || [];
}

export async function savePrompt(
  content: string,
  platform: Platform,
  tags: string[] = [],
  imageData?: {
    outputImageUrl?: string;
    referenceImages?: string[];
    imagePrompts?: string[];
    extractedParams?: Record<string, string | undefined>;
  }
): Promise<PromptRecord> {
  const saved = await getSavedPrompts();
  const record: PromptRecord = {
    id: generateId(),
    content,
    platform,
    createdAt: new Date(),
    tags,
    outputImageUrl: imageData?.outputImageUrl,
    referenceImages: imageData?.referenceImages,
    imagePrompts: imageData?.imagePrompts,
    extractedParams: imageData?.extractedParams,
  };

  await chrome.storage.local.set({
    [STORAGE_KEYS.SAVED_PROMPTS]: [record, ...saved],
  });

  return record;
}

export async function removeSavedPrompt(id: string): Promise<void> {
  const saved = await getSavedPrompts();
  await chrome.storage.local.set({
    [STORAGE_KEYS.SAVED_PROMPTS]: saved.filter(p => p.id !== id),
  });
}

export async function updateSavedPrompt(
  id: string,
  updates: Partial<PromptRecord>
): Promise<void> {
  const saved = await getSavedPrompts();
  await chrome.storage.local.set({
    [STORAGE_KEYS.SAVED_PROMPTS]: saved.map(p =>
      p.id === id ? { ...p, ...updates } : p
    ),
  });
}

export async function updatePromptRating(id: string, rating: number): Promise<void> {
  await updateSavedPrompt(id, { rating: Math.max(1, Math.min(5, rating)) });
}

export async function updatePromptFeedback(
  id: string,
  feedback: PromptRecord['aiFeedback']
): Promise<void> {
  await updateSavedPrompt(id, { aiFeedback: feedback });
}

export async function updatePromptLiked(
  id: string,
  liked: boolean | undefined
): Promise<void> {
  await updateSavedPrompt(id, { liked });
}

// Lineage Tree Management
export async function getLineageTree(): Promise<Record<string, PromptNode>> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LINEAGE_TREE);
  return result[STORAGE_KEYS.LINEAGE_TREE] || {};
}

export async function addLineageNode(
  content: string,
  platform: Platform,
  parentId: string | null = null,
  mode: PromptNode['metadata']['mode'] = 'manual'
): Promise<PromptNode> {
  const tree = await getLineageTree();

  const node: PromptNode = {
    id: generateId(),
    content,
    platform,
    parentId,
    children: [],
    createdAt: new Date(),
    metadata: {
      mode,
      tags: [],
    },
  };

  // Update parent's children array
  if (parentId && tree[parentId]) {
    tree[parentId].children.push(node.id);
  }

  tree[node.id] = node;

  await chrome.storage.local.set({
    [STORAGE_KEYS.LINEAGE_TREE]: tree,
  });

  return node;
}

export async function getLineage(nodeId: string): Promise<PromptNode[]> {
  const tree = await getLineageTree();
  const lineage: PromptNode[] = [];
  let current: PromptNode | undefined = tree[nodeId];

  while (current) {
    lineage.unshift(current);
    current = current.parentId ? tree[current.parentId] : undefined;
  }

  return lineage;
}

// Export all data (for backup)
export async function exportAllData(): Promise<string> {
  const data = await chrome.storage.local.get(null);
  return JSON.stringify(data, null, 2);
}

// Import data (from backup)
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  await chrome.storage.local.set(data);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
}

/**
 * Supabase Sync Service
 *
 * Handles syncing taste profile, preferences, and saved prompts to the cloud
 */

import { getSupabase } from './config';
import { getCurrentUser } from './auth';
import { getDeepPreferences, saveDeepPreferences, type DeepPreferences } from '../deepLearning';
import { getSavedPrompts, getTasteProfile, saveTasteProfile } from '../storage';
import type { TasteProfile } from '@/shared/types';

const LAST_SYNC_KEY = 'refyn_last_sync';

export interface SyncStatus {
  lastSync: string | null;
  isSyncing: boolean;
  error?: string;
}

let isSyncing = false;

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(LAST_SYNC_KEY);
    return result[LAST_SYNC_KEY] || null;
  } catch {
    return null;
  }
}

/**
 * Update last sync timestamp
 */
async function setLastSync(timestamp: string): Promise<void> {
  await chrome.storage.local.set({ [LAST_SYNC_KEY]: timestamp });
}

/**
 * Sync all data to Supabase
 */
export async function syncToCloud(): Promise<{ success: boolean; error?: string }> {
  if (isSyncing) {
    return { success: false, error: 'Sync already in progress' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not logged in' };
  }

  const supabase = await getSupabase();
  isSyncing = true;

  try {
    // Get local data
    const [deepPrefs, tasteProfile, savedPrompts] = await Promise.all([
      getDeepPreferences(),
      getTasteProfile(),
      getSavedPrompts(),
    ]);

    // Sync deep preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        deep_preferences: deepPrefs,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (prefsError) {
      console.error('[Refyn Sync] Preferences sync error:', prefsError);
    }

    // Sync taste profile
    if (tasteProfile) {
      const { error: profileError } = await supabase
        .from('taste_profiles')
        .upsert({
          user_id: user.id,
          profile_data: tasteProfile,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (profileError) {
        console.error('[Refyn Sync] Taste profile sync error:', profileError);
      }
    }

    // Sync saved prompts (batch upsert)
    if (savedPrompts.length > 0) {
      const promptsToSync = savedPrompts.map(prompt => ({
        id: prompt.id,
        user_id: user.id,
        content: prompt.content,
        platform: prompt.platform,
        created_at: prompt.createdAt,
        rating: prompt.rating,
        liked: prompt.liked,
        tags: prompt.tags,
        output_image_url: prompt.outputImageUrl,
        reference_images: prompt.referenceImages,
        extracted_params: prompt.extractedParams,
        ai_feedback: prompt.aiFeedback,
      }));

      const { error: promptsError } = await supabase
        .from('saved_prompts')
        .upsert(promptsToSync, {
          onConflict: 'id',
        });

      if (promptsError) {
        console.error('[Refyn Sync] Prompts sync error:', promptsError);
      }
    }

    await setLastSync(new Date().toISOString());
    isSyncing = false;

    console.log('[Refyn Sync] Sync complete');
    return { success: true };
  } catch (err) {
    isSyncing = false;
    console.error('[Refyn Sync] Sync failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Pull data from Supabase and merge with local
 */
export async function syncFromCloud(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Not logged in' };
  }

  const supabase = await getSupabase();

  try {
    // Fetch cloud data (promptsResult intentionally unused - for future use)
    const [prefsResult, profileResult, _promptsResult] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('deep_preferences, updated_at')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('taste_profiles')
        .select('profile_data, updated_at')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('saved_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    // Merge deep preferences (cloud takes precedence if newer)
    if (prefsResult.data?.deep_preferences) {
      const localPrefs = await getDeepPreferences();
      const cloudPrefs = prefsResult.data.deep_preferences as DeepPreferences;

      // Merge: keep higher scores, combine arrays
      const mergedPrefs = mergeDeepPreferences(localPrefs, cloudPrefs);
      await saveDeepPreferences(mergedPrefs);
    }

    // Merge taste profile
    if (profileResult.data?.profile_data) {
      const localProfile = await getTasteProfile();
      const cloudProfile = profileResult.data.profile_data as TasteProfile;

      if (!localProfile || new Date(cloudProfile.updatedAt) > new Date(localProfile.updatedAt)) {
        await saveTasteProfile(cloudProfile);
      }
    }

    // Prompts are handled individually - cloud data is informational
    // Local prompts remain local for privacy

    await setLastSync(new Date().toISOString());
    console.log('[Refyn Sync] Pull from cloud complete');
    return { success: true };
  } catch (err) {
    console.error('[Refyn Sync] Pull failed:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Merge two deep preference objects
 */
function mergeDeepPreferences(
  local: DeepPreferences,
  cloud: DeepPreferences
): DeepPreferences {
  const merged: DeepPreferences = {
    keywordScores: {},
    platformScores: {} as DeepPreferences['platformScores'],
    successfulCombinations: [],
    failedCombinations: [],
    stats: {
      totalLikes: Math.max(local.stats.totalLikes, cloud.stats.totalLikes),
      totalDislikes: Math.max(local.stats.totalDislikes, cloud.stats.totalDislikes),
      totalDeletes: Math.max(local.stats.totalDeletes, cloud.stats.totalDeletes),
      lastUpdated: new Date().toISOString(),
    },
    likeReasons: {},
    trashReasons: {},
    likeKeywords: {},
    reasonKeywords: {},
  };

  // Merge keyword scores (keep higher absolute score)
  const allCategories = new Set([
    ...Object.keys(local.keywordScores || {}),
    ...Object.keys(cloud.keywordScores || {}),
  ]);

  for (const category of allCategories) {
    merged.keywordScores[category] = {};
    const localCat = local.keywordScores?.[category] || {};
    const cloudCat = cloud.keywordScores?.[category] || {};
    const allKeywords = new Set([...Object.keys(localCat), ...Object.keys(cloudCat)]);

    for (const keyword of allKeywords) {
      const localScore = localCat[keyword] || 0;
      const cloudScore = cloudCat[keyword] || 0;
      // Keep the score with higher absolute value (stronger signal)
      merged.keywordScores[category][keyword] =
        Math.abs(localScore) > Math.abs(cloudScore) ? localScore : cloudScore;
    }
  }

  // Merge successful combinations (union)
  const successSet = new Set<string>();
  for (const combo of [...(local.successfulCombinations || []), ...(cloud.successfulCombinations || [])]) {
    successSet.add(JSON.stringify(combo));
  }
  merged.successfulCombinations = Array.from(successSet).map(s => JSON.parse(s)).slice(-100);

  // Merge failed combinations (union)
  const failSet = new Set<string>();
  for (const combo of [...(local.failedCombinations || []), ...(cloud.failedCombinations || [])]) {
    failSet.add(JSON.stringify(combo));
  }
  merged.failedCombinations = Array.from(failSet).map(s => JSON.parse(s)).slice(-50);

  // Merge like/trash reasons (sum counts)
  for (const [reason, count] of Object.entries(local.likeReasons || {})) {
    merged.likeReasons![reason] = (merged.likeReasons![reason] || 0) + count;
  }
  for (const [reason, count] of Object.entries(cloud.likeReasons || {})) {
    merged.likeReasons![reason] = (merged.likeReasons![reason] || 0) + count;
  }

  for (const [reason, count] of Object.entries(local.trashReasons || {})) {
    merged.trashReasons![reason] = (merged.trashReasons![reason] || 0) + count;
  }
  for (const [reason, count] of Object.entries(cloud.trashReasons || {})) {
    merged.trashReasons![reason] = (merged.trashReasons![reason] || 0) + count;
  }

  // Merge keyword associations (union)
  for (const [reason, keywords] of Object.entries(local.likeKeywords || {})) {
    merged.likeKeywords![reason] = [...new Set([...(merged.likeKeywords![reason] || []), ...keywords])];
  }
  for (const [reason, keywords] of Object.entries(cloud.likeKeywords || {})) {
    merged.likeKeywords![reason] = [...new Set([...(merged.likeKeywords![reason] || []), ...keywords])];
  }

  return merged;
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const lastSync = await getLastSync();
  return {
    lastSync,
    isSyncing,
  };
}

/**
 * Auto-sync on preference changes (debounced)
 */
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncToCloud(delayMs: number = 30000): void {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(async () => {
    const user = await getCurrentUser();
    if (user) {
      await syncToCloud();
    }
  }, delayMs);
}

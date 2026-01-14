/**
 * User Preference Learning System
 * Tracks user feedback to learn and personalize prompt generation
 */

import type { UserPreferences, PromptFeedback, Platform } from '@/shared/types';

const STORAGE_KEY = 'refyn_user_preferences';
const MAX_FEEDBACK_HISTORY = 100;

// Common keywords to extract from prompts
const STYLE_KEYWORDS = [
  // Visual styles
  'cinematic', 'photorealistic', 'anime', 'artistic', 'minimalist', 'vintage',
  'fantasy', 'dark', 'moody', 'editorial', 'surreal', 'abstract', 'modern',
  'retro', 'futuristic', 'gothic', 'ethereal', 'dreamy', 'vibrant', 'muted',
  // Technical terms often added
  'unreal engine', '8k', '4k', 'hdr', 'ray tracing', 'octane render', 'blender',
  'dramatic lighting', 'soft lighting', 'golden hour', 'blue hour', 'studio lighting',
  'depth of field', 'bokeh', 'sharp focus', 'film grain', '35mm', 'anamorphic',
  // Art styles
  'oil painting', 'watercolor', 'digital art', 'illustration', 'concept art',
  'fine art', 'pop art', 'art nouveau', 'baroque', 'impressionist',
  // Music styles (for audio platforms)
  'lo-fi', 'cinematic', 'electronic', 'acoustic', 'ambient', 'upbeat',
  'indie', 'hip-hop', 'orchestral', 'jazz', 'rock', 'pop', 'classical',
  // Video styles
  'documentary', 'commercial', 'slow motion', 'timelapse', 'handheld',
];

/**
 * Get default empty preferences
 */
function getDefaultPreferences(): UserPreferences {
  return {
    likedKeywords: {},
    dislikedKeywords: {},
    likedStyles: {},
    dislikedStyles: {},
    promptFeedback: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Load user preferences from storage
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || getDefaultPreferences();
}

/**
 * Save user preferences to storage
 */
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  prefs.lastUpdated = new Date().toISOString();
  await chrome.storage.local.set({ [STORAGE_KEY]: prefs });
}

/**
 * Extract keywords from a prompt
 */
export function extractKeywords(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  return STYLE_KEYWORDS.filter(keyword => lowerPrompt.includes(keyword.toLowerCase()));
}

/**
 * Record user feedback on a prompt
 */
export async function recordFeedback(
  originalPrompt: string,
  refinedPrompt: string,
  platform: Platform,
  feedback: 'like' | 'dislike' | 'used' | 'regenerate',
  presetId?: string
): Promise<void> {
  const prefs = await getUserPreferences();
  const extractedKeywords = extractKeywords(refinedPrompt);

  // Create feedback record
  const feedbackRecord: PromptFeedback = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    originalPrompt,
    refinedPrompt,
    platform,
    preset: presetId,
    feedback,
    timestamp: new Date().toISOString(),
    extractedKeywords,
  };

  // Add to history (keep last N)
  prefs.promptFeedback = [feedbackRecord, ...prefs.promptFeedback].slice(0, MAX_FEEDBACK_HISTORY);

  // Update keyword preferences based on feedback
  const weight = feedback === 'like' || feedback === 'used' ? 1 : -1;

  for (const keyword of extractedKeywords) {
    if (weight > 0) {
      prefs.likedKeywords[keyword] = (prefs.likedKeywords[keyword] || 0) + 1;
      // Decay dislike if they now like it
      if (prefs.dislikedKeywords[keyword]) {
        prefs.dislikedKeywords[keyword] = Math.max(0, prefs.dislikedKeywords[keyword] - 0.5);
      }
    } else {
      prefs.dislikedKeywords[keyword] = (prefs.dislikedKeywords[keyword] || 0) + 1;
      // Decay like if they now dislike it
      if (prefs.likedKeywords[keyword]) {
        prefs.likedKeywords[keyword] = Math.max(0, prefs.likedKeywords[keyword] - 0.5);
      }
    }
  }

  // Update style preferences
  if (presetId) {
    if (weight > 0) {
      prefs.likedStyles[presetId] = (prefs.likedStyles[presetId] || 0) + 1;
    } else {
      prefs.dislikedStyles[presetId] = (prefs.dislikedStyles[presetId] || 0) + 1;
    }
  }

  await saveUserPreferences(prefs);
  console.log('[Refyn Preferences] Recorded feedback:', feedback, 'Keywords:', extractedKeywords);
}

/**
 * Get keywords to prefer based on user history
 */
export async function getPreferredKeywords(): Promise<string[]> {
  const prefs = await getUserPreferences();

  // Sort by like count and filter out those with more dislikes
  return Object.entries(prefs.likedKeywords)
    .filter(([keyword, count]) => {
      const dislikeCount = prefs.dislikedKeywords[keyword] || 0;
      return count > dislikeCount && count >= 2; // At least 2 likes and more than dislikes
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

/**
 * Get keywords to avoid based on user history
 */
export async function getAvoidKeywords(): Promise<string[]> {
  const prefs = await getUserPreferences();

  // Sort by dislike count and filter out those with more likes
  return Object.entries(prefs.dislikedKeywords)
    .filter(([keyword, count]) => {
      const likeCount = prefs.likedKeywords[keyword] || 0;
      return count > likeCount && count >= 2; // At least 2 dislikes and more than likes
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword]) => keyword);
}

/**
 * Get preferred styles based on user history
 */
export async function getPreferredStyles(): Promise<string[]> {
  const prefs = await getUserPreferences();

  return Object.entries(prefs.likedStyles)
    .filter(([style, count]) => {
      const dislikeCount = prefs.dislikedStyles[style] || 0;
      return count > dislikeCount;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([style]) => style);
}

/**
 * Generate preference context for the AI prompt
 */
export async function getPreferenceContext(): Promise<string> {
  const [preferred, avoid, preferredStyles] = await Promise.all([
    getPreferredKeywords(),
    getAvoidKeywords(),
    getPreferredStyles(),
  ]);

  const parts: string[] = [];

  if (preferred.length > 0) {
    parts.push(`User prefers: ${preferred.join(', ')}`);
  }

  if (avoid.length > 0) {
    parts.push(`User dislikes (AVOID these): ${avoid.join(', ')}`);
  }

  if (preferredStyles.length > 0) {
    parts.push(`Preferred styles: ${preferredStyles.join(', ')}`);
  }

  return parts.length > 0
    ? `\n\nUSER PREFERENCES (personalize based on these):\n${parts.join('\n')}`
    : '';
}

/**
 * Clear all user preferences (reset learning)
 */
export async function clearPreferences(): Promise<void> {
  await saveUserPreferences(getDefaultPreferences());
  console.log('[Refyn Preferences] Cleared all preferences');
}

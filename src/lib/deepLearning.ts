/**
 * Deep Learning Module - Advanced preference learning from user behavior
 * Extracts patterns from prompts and learns what works/doesn't work for the user
 */

import type { Platform, PlatformCategory } from '@/shared/types';
import { PLATFORMS } from '@/shared/constants';

// Storage keys
const DEEP_PREFS_KEY = 'refyn_deep_preferences';
const PROMPT_OUTPUTS_KEY = 'refyn_prompt_outputs';

// Weight values for different feedback types
const FEEDBACK_WEIGHTS = {
  like: 2,
  use: 1.5,
  dislike: -2,
  delete: -3,
  regenerate: -1,
};

// Advanced keyword categories for extraction
const KEYWORD_CATEGORIES = {
  // Visual elements
  lighting: [
    'golden hour', 'blue hour', 'studio lighting', 'natural light', 'dramatic lighting',
    'soft lighting', 'rim lighting', 'backlit', 'ambient', 'high contrast', 'low key',
    'high key', 'neon', 'volumetric', 'cinematic lighting', 'moody lighting',
  ],
  color: [
    'warm tones', 'cool tones', 'vibrant', 'muted', 'pastel', 'monochrome',
    'black and white', 'saturated', 'desaturated', 'earthy', 'neon', 'grayscale',
  ],
  style: [
    'photorealistic', 'cinematic', 'artistic', 'abstract', 'minimal', 'maximalist',
    'surreal', 'vintage', 'retro', 'futuristic', 'gothic', 'ethereal', 'dreamy',
    'gritty', 'clean', 'editorial', 'fine art', 'commercial', 'documentary',
  ],
  quality: [
    'highly detailed', '8k', '4k', 'ultra hd', 'sharp focus', 'professional',
    'masterpiece', 'best quality', 'award winning', 'museum quality',
  ],
  camera: [
    '35mm', '50mm', '85mm', 'wide angle', 'telephoto', 'macro', 'fisheye',
    'bokeh', 'depth of field', 'shallow dof', 'anamorphic', 'tilt shift',
  ],
  medium: [
    'oil painting', 'watercolor', 'digital art', 'photograph', '3d render',
    'illustration', 'concept art', 'pencil sketch', 'charcoal', 'acrylic',
  ],
  render: [
    'unreal engine', 'octane render', 'blender', 'vray', 'cinema 4d',
    'ray tracing', 'global illumination', 'subsurface scattering',
  ],
  composition: [
    'rule of thirds', 'centered', 'symmetrical', 'asymmetrical', 'dynamic',
    'close up', 'wide shot', 'medium shot', 'full body', 'portrait',
  ],
  mood: [
    'peaceful', 'dramatic', 'intense', 'serene', 'melancholic', 'uplifting',
    'mysterious', 'whimsical', 'powerful', 'gentle', 'energetic', 'calm',
  ],
  // Music elements
  genre: [
    'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical', 'r&b',
    'folk', 'country', 'metal', 'indie', 'lo-fi', 'ambient', 'house',
    'techno', 'trap', 'drill', 'soul', 'funk', 'blues', 'reggae',
  ],
  tempo: [
    'slow', 'fast', 'upbeat', 'mid-tempo', 'ballad', 'uptempo', 'downtempo',
  ],
  instruments: [
    'guitar', 'piano', 'synth', 'drums', '808s', 'strings', 'brass',
    'bass', 'violin', 'saxophone', 'flute', 'beats', 'percussion',
  ],
  vocals: [
    'male vocals', 'female vocals', 'falsetto', 'raspy', 'smooth',
    'whispered', 'powerful', 'harmonies', 'auto-tune', 'a cappella',
  ],
  // Video elements
  movement: [
    'slow motion', 'timelapse', 'tracking shot', 'dolly', 'pan', 'zoom',
    'crane shot', 'steadicam', 'handheld', 'static', 'orbital', 'dynamic',
  ],
};

// Deep preferences structure
export interface DeepPreferences {
  // Keyword preferences by category
  keywordScores: Record<string, Record<string, number>>;
  // Platform-specific preferences
  platformScores: Record<Platform, Record<string, number>>;
  // Combination patterns (keywords that work well together)
  successfulCombinations: string[][];
  // Combinations to avoid
  failedCombinations: string[][];
  // Overall statistics
  stats: {
    totalLikes: number;
    totalDislikes: number;
    totalDeletes: number;
    lastUpdated: string;
  };
  // Trash feedback tracking
  trashReasons?: Record<string, number>;
  // Reason-keyword associations for dislikes
  reasonKeywords?: Record<string, string[]>;
  // Custom trash feedback entries
  customFeedback?: Array<{
    text: string;
    prompt: string;
    platform: Platform;
    timestamp: number;
  }>;
  // Like feedback tracking - why users like outputs
  likeReasons?: Record<string, number>;
  // Reason-keyword associations for likes
  likeKeywords?: Record<string, string[]>;
  // Custom like feedback entries with enhanced context
  customLikeFeedback?: Array<{
    text: string;
    prompt: string;
    platform: Platform;
    reason: string;
    timestamp: number;
  }>;
  // Cross-platform patterns - keywords that work across multiple platforms
  crossPlatformKeywords?: Record<string, {
    platforms: Platform[];
    totalScore: number;
    count: number;
  }>;
  // Prompt language patterns - common phrase structures that work
  promptPatterns?: Array<{
    pattern: string;
    score: number;
    platforms: Platform[];
    count: number;
  }>;
  // User's signature style - their unique prompt characteristics
  signatureStyle?: {
    preferredLength: 'short' | 'medium' | 'long';
    usesParameters: boolean;
    usesArtistReferences: boolean;
    preferredMoods: string[];
    preferredQualifiers: string[];
  };
}

// Prompt-Output linking for tracking
interface PromptOutputLink {
  promptId: string;
  prompt: string;
  outputIds: string[];
  platform: Platform;
  extractedKeywords: Record<string, string[]>;
  timestamp: number;
  feedback?: 'like' | 'dislike' | 'delete' | 'use' | 'regenerate';
}

/**
 * Get default deep preferences
 */
function getDefaultDeepPreferences(): DeepPreferences {
  return {
    keywordScores: {},
    platformScores: {} as Record<Platform, Record<string, number>>,
    successfulCombinations: [],
    failedCombinations: [],
    stats: {
      totalLikes: 0,
      totalDislikes: 0,
      totalDeletes: 0,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Load deep preferences from storage
 */
export async function getDeepPreferences(): Promise<DeepPreferences> {
  try {
    const result = await chrome.storage.local.get(DEEP_PREFS_KEY);
    return result[DEEP_PREFS_KEY] || getDefaultDeepPreferences();
  } catch {
    return getDefaultDeepPreferences();
  }
}

/**
 * Save deep preferences to storage
 */
export async function saveDeepPreferences(prefs: DeepPreferences): Promise<void> {
  prefs.stats.lastUpdated = new Date().toISOString();
  await chrome.storage.local.set({ [DEEP_PREFS_KEY]: prefs });

  // Schedule cloud sync (debounced)
  try {
    const { scheduleSyncToCloud } = await import('./supabase/sync');
    scheduleSyncToCloud(30000); // 30 second delay to batch changes
  } catch {
    // Supabase not available, skip sync
  }
}

/**
 * Extract keywords from a prompt with categorization
 */
export function extractKeywordsFromPrompt(prompt: string): Record<string, string[]> {
  const lowerPrompt = prompt.toLowerCase();
  const extracted: Record<string, string[]> = {};

  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    const found = keywords.filter((kw) => lowerPrompt.includes(kw.toLowerCase()));
    if (found.length > 0) {
      extracted[category] = found;
    }
  }

  // Also extract any quoted terms
  const quotedTerms = prompt.match(/"([^"]+)"/g);
  if (quotedTerms) {
    extracted['quoted'] = quotedTerms.map((t) => t.replace(/"/g, ''));
  }

  // Extract comma-separated terms that might be style keywords
  const terms = prompt.split(',').map((t) => t.trim().toLowerCase());
  const unknownTerms = terms.filter((t) => {
    return t.length > 2 && t.length < 30 && !Object.values(KEYWORD_CATEGORIES).flat().includes(t);
  });
  if (unknownTerms.length > 0) {
    extracted['custom'] = unknownTerms.slice(0, 10);
  }

  return extracted;
}

/**
 * Link a prompt to an output for tracking
 */
export async function linkPromptToOutput(
  prompt: string,
  outputId: string,
  platform: Platform
): Promise<void> {
  try {
    const result = await chrome.storage.local.get(PROMPT_OUTPUTS_KEY);
    const links: PromptOutputLink[] = result[PROMPT_OUTPUTS_KEY] || [];

    // Check if prompt already exists
    const promptId = generatePromptId(prompt);
    const existingLink = links.find((l) => l.promptId === promptId);

    if (existingLink) {
      // Add output to existing link
      if (!existingLink.outputIds.includes(outputId)) {
        existingLink.outputIds.push(outputId);
      }
    } else {
      // Create new link
      const newLink: PromptOutputLink = {
        promptId,
        prompt,
        outputIds: [outputId],
        platform,
        extractedKeywords: extractKeywordsFromPrompt(prompt),
        timestamp: Date.now(),
      };
      links.unshift(newLink);
    }

    // Keep only last 200 links
    const trimmedLinks = links.slice(0, 200);
    await chrome.storage.local.set({ [PROMPT_OUTPUTS_KEY]: trimmedLinks });

    // Store prompt for potential later retrieval
    localStorage.setItem('refyn-last-prompt', prompt);
  } catch (error) {
    console.error('[Refyn Deep Learning] Error linking prompt:', error);
  }
}

/**
 * Generate a unique ID for a prompt
 */
function generatePromptId(prompt: string): string {
  const normalized = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
  return btoa(normalized).substring(0, 30);
}

/**
 * Record feedback for an output and learn from it
 */
export async function recordOutputFeedback(
  prompt: string,
  _outputId: string, // Used for future reference/linking
  platform: Platform,
  feedback: 'like' | 'dislike' | 'delete' | 'use' | 'regenerate'
): Promise<void> {
  console.log('[Refyn Deep Learning] Recording feedback:', { feedback, platform, promptLength: prompt.length });

  const prefs = await getDeepPreferences();
  const weight = FEEDBACK_WEIGHTS[feedback];
  const keywords = extractKeywordsFromPrompt(prompt);

  // Update keyword scores by category
  for (const [category, kws] of Object.entries(keywords)) {
    if (!prefs.keywordScores[category]) {
      prefs.keywordScores[category] = {};
    }

    for (const kw of kws) {
      const currentScore = prefs.keywordScores[category][kw] || 0;
      prefs.keywordScores[category][kw] = currentScore + weight;

      // Clamp scores between -10 and 10
      prefs.keywordScores[category][kw] = Math.max(-10, Math.min(10, prefs.keywordScores[category][kw]));
    }
  }

  // Update platform-specific scores
  if (!prefs.platformScores[platform]) {
    prefs.platformScores[platform] = {};
  }

  const allKeywords = Object.values(keywords).flat();
  for (const kw of allKeywords) {
    const currentScore = prefs.platformScores[platform][kw] || 0;
    prefs.platformScores[platform][kw] = currentScore + weight;
  }

  // Track successful/failed combinations
  if (allKeywords.length >= 2) {
    const combination = allKeywords.slice(0, 5).sort();

    if (weight > 0) {
      // Successful combination
      if (!prefs.successfulCombinations.find((c) => JSON.stringify(c) === JSON.stringify(combination))) {
        prefs.successfulCombinations.push(combination);
        // Keep only last 50
        prefs.successfulCombinations = prefs.successfulCombinations.slice(-50);
      }
    } else if (weight < -1) {
      // Failed combination
      if (!prefs.failedCombinations.find((c) => JSON.stringify(c) === JSON.stringify(combination))) {
        prefs.failedCombinations.push(combination);
        // Keep only last 50
        prefs.failedCombinations = prefs.failedCombinations.slice(-50);
      }
    }
  }

  // Update stats
  if (feedback === 'like' || feedback === 'use') {
    prefs.stats.totalLikes++;
  } else if (feedback === 'dislike' || feedback === 'regenerate') {
    prefs.stats.totalDislikes++;
  } else if (feedback === 'delete') {
    prefs.stats.totalDeletes++;
  }

  await saveDeepPreferences(prefs);

  // Also update the simpler preferences system
  try {
    const { recordFeedback } = await import('./preferences');
    // Map feedback types to what preferences.ts accepts
    let simpleFeedback: 'like' | 'dislike' | 'used' | 'regenerate';
    if (feedback === 'use') {
      simpleFeedback = 'used';
    } else if (feedback === 'delete') {
      simpleFeedback = 'dislike'; // Treat delete as strong dislike
    } else {
      simpleFeedback = feedback;
    }
    await recordFeedback(prompt, prompt, platform, simpleFeedback);
  } catch (error) {
    console.log('[Refyn Deep Learning] Could not update preferences:', error);
  }

  // Learn cross-platform patterns and prompt structures
  const isPositive = feedback === 'like' || feedback === 'use';
  await recordEnhancedFeedback(prompt, platform, isPositive);

  console.log('[Refyn Deep Learning] Preferences updated with pattern learning');
}

/**
 * Record like feedback with reason
 * This helps learn what makes outputs successful for the user
 */
export async function recordLikeFeedback(
  prompt: string,
  platform: Platform,
  reason: string,
  customText?: string
): Promise<void> {
  console.log('[Refyn Deep Learning] Recording like feedback:', { reason, platform, customText });

  const prefs = await getDeepPreferences();
  const keywords = extractKeywordsFromPrompt(prompt);

  // Positive weight for like with reason - stronger than basic like
  const weight = reason === 'skipped' ? 2 : 3.5;

  // Update keyword scores with stronger positive weight
  const allKeywords = Object.values(keywords).flat();
  for (const kw of allKeywords) {
    for (const [category, kws] of Object.entries(keywords)) {
      if (kws.includes(kw)) {
        if (!prefs.keywordScores[category]) {
          prefs.keywordScores[category] = {};
        }
        const currentScore = prefs.keywordScores[category][kw] || 0;
        prefs.keywordScores[category][kw] = Math.max(-10, Math.min(10, currentScore + weight));
      }
    }
  }

  // Store the like reason for future analysis
  if (!prefs.likeReasons) {
    prefs.likeReasons = {};
  }
  if (!prefs.likeReasons[reason]) {
    prefs.likeReasons[reason] = 0;
  }
  prefs.likeReasons[reason]++;

  // If specific reason, extract and amplify patterns
  if (reason !== 'skipped' && reason !== 'other') {
    // Store reason-keyword associations for smarter suggestions
    if (!prefs.likeKeywords) {
      prefs.likeKeywords = {};
    }
    if (!prefs.likeKeywords[reason]) {
      prefs.likeKeywords[reason] = [];
    }

    // Associate keywords with this positive reason
    for (const kw of allKeywords.slice(0, 5)) {
      if (!prefs.likeKeywords[reason].includes(kw)) {
        prefs.likeKeywords[reason].push(kw);
      }
    }
    // Keep only last 30 per reason for better pattern recognition
    prefs.likeKeywords[reason] = prefs.likeKeywords[reason].slice(-30);
  }

  // Store custom text for detailed analysis
  if (customText && customText.trim()) {
    if (!prefs.customLikeFeedback) {
      prefs.customLikeFeedback = [];
    }
    prefs.customLikeFeedback.push({
      text: customText.trim(),
      prompt: prompt.substring(0, 100),
      platform,
      reason,
      timestamp: Date.now(),
    });
    // Keep only last 100 for comprehensive learning
    prefs.customLikeFeedback = prefs.customLikeFeedback.slice(-100);

    // Extract keywords from custom feedback text and boost them
    const customKeywords = extractKeywordsFromPrompt(customText);
    for (const [category, kws] of Object.entries(customKeywords)) {
      if (!prefs.keywordScores[category]) {
        prefs.keywordScores[category] = {};
      }
      for (const kw of kws) {
        const currentScore = prefs.keywordScores[category][kw] || 0;
        prefs.keywordScores[category][kw] = Math.max(-10, Math.min(10, currentScore + 2));
      }
    }
  }

  // Update successful combinations more aggressively
  if (allKeywords.length >= 2) {
    const combination = allKeywords.slice(0, 5).sort();
    if (!prefs.successfulCombinations.find((c) => JSON.stringify(c) === JSON.stringify(combination))) {
      prefs.successfulCombinations.push(combination);
      // Keep more successful combinations since they're valuable
      prefs.successfulCombinations = prefs.successfulCombinations.slice(-100);
    }
  }

  // Update stats
  prefs.stats.totalLikes++;

  await saveDeepPreferences(prefs);

  // Learn cross-platform patterns and prompt structures
  await recordEnhancedFeedback(prompt, platform, true);

  console.log('[Refyn Deep Learning] Like feedback recorded with cross-platform pattern learning');
}

/**
 * Record trash/delete feedback with reason
 * This helps learn why certain outputs fail
 */
export async function recordTrashFeedback(
  prompt: string,
  platform: Platform,
  reason: string,
  customText?: string
): Promise<void> {
  console.log('[Refyn Deep Learning] Recording trash feedback:', { reason, platform, customText });

  const prefs = await getDeepPreferences();
  const keywords = extractKeywordsFromPrompt(prompt);

  // More negative weight for trash with reason
  const weight = reason === 'skipped' ? -1 : -2.5;

  // Update keyword scores
  const allKeywords = Object.values(keywords).flat();
  for (const kw of allKeywords) {
    for (const [category, kws] of Object.entries(keywords)) {
      if (kws.includes(kw)) {
        if (!prefs.keywordScores[category]) {
          prefs.keywordScores[category] = {};
        }
        const currentScore = prefs.keywordScores[category][kw] || 0;
        prefs.keywordScores[category][kw] = Math.max(-10, Math.min(10, currentScore + weight));
      }
    }
  }

  // Store the reason for future analysis
  if (!prefs.trashReasons) {
    prefs.trashReasons = {};
  }
  if (!prefs.trashReasons[reason]) {
    prefs.trashReasons[reason] = 0;
  }
  prefs.trashReasons[reason]++;

  // If specific reason, extract patterns
  if (reason !== 'skipped' && reason !== 'other') {
    // Store reason-keyword associations for smarter learning
    if (!prefs.reasonKeywords) {
      prefs.reasonKeywords = {};
    }
    if (!prefs.reasonKeywords[reason]) {
      prefs.reasonKeywords[reason] = [];
    }

    // Associate keywords with this reason
    for (const kw of allKeywords.slice(0, 5)) {
      if (!prefs.reasonKeywords[reason].includes(kw)) {
        prefs.reasonKeywords[reason].push(kw);
      }
    }
    // Keep only last 20 per reason
    prefs.reasonKeywords[reason] = prefs.reasonKeywords[reason].slice(-20);
  }

  // Store custom text for analysis
  if (customText && customText.trim()) {
    if (!prefs.customFeedback) {
      prefs.customFeedback = [];
    }
    prefs.customFeedback.push({
      text: customText.trim(),
      prompt: prompt.substring(0, 100),
      platform,
      timestamp: Date.now(),
    });
    // Keep only last 50
    prefs.customFeedback = prefs.customFeedback.slice(-50);
  }

  // Update stats
  prefs.stats.totalDeletes++;

  await saveDeepPreferences(prefs);

  // Learn cross-platform patterns (negative feedback)
  await recordEnhancedFeedback(prompt, platform, false);

  console.log('[Refyn Deep Learning] Trash feedback recorded with pattern learning');
}

/**
 * Get keywords to suggest (high positive scores)
 */
export async function getSuggestedKeywords(
  platform: Platform,
  limit: number = 10
): Promise<{ keyword: string; category: string; score: number }[]> {
  const prefs = await getDeepPreferences();
  const platformInfo = PLATFORMS[platform];
  const suggestions: { keyword: string; category: string; score: number }[] = [];

  // Combine global and platform-specific scores
  for (const [category, keywords] of Object.entries(prefs.keywordScores)) {
    for (const [keyword, score] of Object.entries(keywords)) {
      if (score > 0) {
        const platformBonus = prefs.platformScores[platform]?.[keyword] || 0;
        const totalScore = score + platformBonus * 0.5;

        // Filter by category relevance to platform
        if (isRelevantCategory(category, platformInfo.category)) {
          suggestions.push({ keyword, category, score: totalScore });
        }
      }
    }
  }

  // Sort by score and return top N
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get keywords to avoid (negative scores)
 */
export async function getKeywordsToAvoid(
  platform: Platform,
  limit: number = 10
): Promise<{ keyword: string; category: string; score: number }[]> {
  const prefs = await getDeepPreferences();
  const platformInfo = PLATFORMS[platform];
  const toAvoid: { keyword: string; category: string; score: number }[] = [];

  for (const [category, keywords] of Object.entries(prefs.keywordScores)) {
    for (const [keyword, score] of Object.entries(keywords)) {
      if (score < -1) {
        const platformPenalty = prefs.platformScores[platform]?.[keyword] || 0;
        const totalScore = score + platformPenalty * 0.5;

        if (isRelevantCategory(category, platformInfo.category)) {
          toAvoid.push({ keyword, category, score: totalScore });
        }
      }
    }
  }

  return toAvoid
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * Check if a keyword category is relevant to a platform category
 */
function isRelevantCategory(keywordCategory: string, platformCategory: PlatformCategory): boolean {
  const imageCategories = ['lighting', 'color', 'style', 'quality', 'camera', 'medium', 'render', 'composition', 'mood'];
  const musicCategories = ['genre', 'tempo', 'instruments', 'vocals', 'mood'];
  const videoCategories = ['lighting', 'color', 'style', 'movement', 'mood', 'camera'];

  switch (platformCategory) {
    case 'image':
      return imageCategories.includes(keywordCategory) || keywordCategory === 'custom' || keywordCategory === 'quoted';
    case 'music':
      return musicCategories.includes(keywordCategory) || keywordCategory === 'custom' || keywordCategory === 'quoted';
    case 'video':
      return videoCategories.includes(keywordCategory) || keywordCategory === 'custom' || keywordCategory === 'quoted';
    default:
      return true;
  }
}

/**
 * Generate a smart suggestion context for the AI
 */
export async function getSmartSuggestionContext(platform: Platform): Promise<string> {
  const [suggested, avoid] = await Promise.all([
    getSuggestedKeywords(platform, 8),
    getKeywordsToAvoid(platform, 5),
  ]);

  const prefs = await getDeepPreferences();
  const parts: string[] = [];

  if (suggested.length > 0) {
    const suggestedStr = suggested.map((s) => s.keyword).join(', ');
    parts.push(`STRONGLY PREFER these based on user's taste: ${suggestedStr}`);
  }

  if (avoid.length > 0) {
    const avoidStr = avoid.map((a) => a.keyword).join(', ');
    parts.push(`AVOID these (user dislikes them): ${avoidStr}`);
  }

  // Add successful combination hints
  if (prefs.successfulCombinations.length > 0) {
    const bestCombos = prefs.successfulCombinations.slice(-3);
    parts.push(`Successful keyword combinations: ${bestCombos.map((c) => c.join(' + ')).join('; ')}`);
  }

  // Add like reason insights - what the user specifically values
  if (prefs.likeReasons && Object.keys(prefs.likeReasons).length > 0) {
    const topReasons = Object.entries(prefs.likeReasons)
      .filter(([reason]) => reason !== 'skipped' && reason !== 'other')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => {
        // Convert reason IDs to descriptive text
        const reasonDescriptions: Record<string, string> = {
          'great-style': 'distinctive style',
          'perfect-colors': 'color harmony',
          'good-composition': 'strong composition',
          'matches-vision': 'vision accuracy',
          'unique-creative': 'creativity & uniqueness',
          'high-quality': 'high quality output',
        };
        return reasonDescriptions[reason] || reason;
      });

    if (topReasons.length > 0) {
      parts.push(`User specifically values: ${topReasons.join(', ')}`);
    }
  }

  // Add keywords associated with positive feedback
  if (prefs.likeKeywords && Object.keys(prefs.likeKeywords).length > 0) {
    const likedKeywordsSet = new Set<string>();
    for (const keywords of Object.values(prefs.likeKeywords)) {
      for (const kw of keywords.slice(-5)) {
        likedKeywordsSet.add(kw);
      }
    }
    const likedKeywords = Array.from(likedKeywordsSet).slice(0, 8);
    if (likedKeywords.length > 0) {
      parts.push(`Keywords from liked outputs: ${likedKeywords.join(', ')}`);
    }
  }

  // Add trash reason insights - what to avoid
  if (prefs.trashReasons && Object.keys(prefs.trashReasons).length > 0) {
    const topTrashReasons = Object.entries(prefs.trashReasons)
      .filter(([reason]) => reason !== 'skipped' && reason !== 'other')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([reason]) => {
        const reasonDescriptions: Record<string, string> = {
          'poor-quality': 'low quality',
          'wrong-style': 'wrong style',
          'doesnt-match': 'prompt mismatch',
          'too-similar': 'repetitive results',
          'wrong-composition': 'poor composition',
        };
        return reasonDescriptions[reason] || reason;
      });

    if (topTrashReasons.length > 0) {
      parts.push(`User often deletes due to: ${topTrashReasons.join(', ')} - avoid these issues`);
    }
  }

  // Add universal keywords that work across platforms
  const universalKeywords = await getUniversalKeywords(2, 5);
  if (universalKeywords.length > 0) {
    const universalStr = universalKeywords.map((u) => u.keyword).join(', ');
    parts.push(`Universal keywords (work everywhere): ${universalStr}`);
  }

  // Add signature style insights
  const styleNote = await getSignatureStyleSummary();
  if (styleNote) {
    parts.push(`User's prompt style: ${styleNote}`);
  }

  // Add top prompt patterns
  const patterns = await getTopPatterns(platform, 4);
  if (patterns.length > 0) {
    const patternsStr = patterns.map((p) => p.pattern).join(', ');
    parts.push(`Effective phrase patterns: ${patternsStr}`);
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\nDEEP USER PREFERENCES (learned from behavior):\n${parts.join('\n')}`;
}

/**
 * Analyze a prompt and suggest improvements
 */
export async function analyzePromptWithPreferences(
  prompt: string,
  platform: Platform
): Promise<{
  warnings: string[];
  suggestions: string[];
  score: number;
}> {
  const keywords = extractKeywordsFromPrompt(prompt);
  const [suggested, avoid] = await Promise.all([
    getSuggestedKeywords(platform, 20),
    getKeywordsToAvoid(platform, 20),
  ]);

  const allKeywords = Object.values(keywords).flat();
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 50; // Start with neutral score

  // Check for keywords to avoid
  const avoidSet = new Set(avoid.map((a) => a.keyword));
  for (const kw of allKeywords) {
    if (avoidSet.has(kw)) {
      warnings.push(`"${kw}" - you've disliked outputs with this before`);
      score -= 10;
    }
  }

  // Check for missing preferred keywords
  const suggestedSet = new Set(suggested.map((s) => s.keyword));
  const usedSuggested = allKeywords.filter((kw) => suggestedSet.has(kw));
  const missingSuggested = suggested.filter((s) => !allKeywords.includes(s.keyword)).slice(0, 3);

  if (usedSuggested.length > 0) {
    score += usedSuggested.length * 5;
  }

  if (missingSuggested.length > 0) {
    for (const s of missingSuggested) {
      suggestions.push(`Consider adding "${s.keyword}" - you've liked outputs with this`);
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { warnings, suggestions, score };
}

/**
 * Clear all deep preferences
 */
export async function clearDeepPreferences(): Promise<void> {
  await chrome.storage.local.remove([DEEP_PREFS_KEY, PROMPT_OUTPUTS_KEY]);
  console.log('[Refyn Deep Learning] All preferences cleared');
}

/**
 * Export preferences for backup
 */
export async function exportPreferences(): Promise<string> {
  const prefs = await getDeepPreferences();
  return JSON.stringify(prefs, null, 2);
}

/**
 * Import preferences from backup
 */
export async function importPreferences(json: string): Promise<boolean> {
  try {
    const prefs = JSON.parse(json) as DeepPreferences;
    await saveDeepPreferences(prefs);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update cross-platform keyword tracking
 * Identifies keywords that work well across multiple platforms
 */
async function updateCrossPlatformKeywords(
  keywords: string[],
  platform: Platform,
  isPositive: boolean
): Promise<void> {
  const prefs = await getDeepPreferences();

  if (!prefs.crossPlatformKeywords) {
    prefs.crossPlatformKeywords = {};
  }

  const weight = isPositive ? 1 : -0.5;

  for (const keyword of keywords) {
    const lowerKw = keyword.toLowerCase();

    if (!prefs.crossPlatformKeywords[lowerKw]) {
      prefs.crossPlatformKeywords[lowerKw] = {
        platforms: [],
        totalScore: 0,
        count: 0,
      };
    }

    const entry = prefs.crossPlatformKeywords[lowerKw];

    // Add platform if not already tracked
    if (!entry.platforms.includes(platform)) {
      entry.platforms.push(platform);
    }

    entry.totalScore += weight;
    entry.count++;
  }

  await saveDeepPreferences(prefs);
}

/**
 * Extract and learn prompt patterns (phrase structures)
 */
async function learnPromptPatterns(
  prompt: string,
  platform: Platform,
  isPositive: boolean
): Promise<void> {
  const prefs = await getDeepPreferences();

  if (!prefs.promptPatterns) {
    prefs.promptPatterns = [];
  }

  // Extract common patterns
  const patterns: string[] = [];

  // Pattern: adjective + noun (e.g., "cinematic lighting", "warm colors")
  const adjectiveNounPattern = /\b((\w+)\s+(lighting|colors?|tones?|style|quality|mood|atmosphere|composition|texture|detail))\b/gi;
  let match;
  while ((match = adjectiveNounPattern.exec(prompt)) !== null) {
    patterns.push(match[1].toLowerCase());
  }

  // Pattern: "in the style of X"
  const styleOfPattern = /in the style of\s+(\w+(?:\s+\w+)?)/gi;
  while ((match = styleOfPattern.exec(prompt)) !== null) {
    patterns.push(`style of ${match[1].toLowerCase()}`);
  }

  // Pattern: quality modifiers (e.g., "highly detailed", "ultra realistic")
  const qualityPattern = /\b(highly|ultra|extremely|very|super)\s+(\w+)/gi;
  while ((match = qualityPattern.exec(prompt)) !== null) {
    patterns.push(match[0].toLowerCase());
  }

  // Pattern: camera/lens references
  const cameraPattern = /\b(\d+mm|wide angle|telephoto|macro|bokeh|depth of field|dof)\b/gi;
  while ((match = cameraPattern.exec(prompt)) !== null) {
    patterns.push(match[1].toLowerCase());
  }

  // Update pattern scores
  const weight = isPositive ? 1.5 : -1;

  for (const pattern of patterns) {
    const existing = prefs.promptPatterns.find((p) => p.pattern === pattern);

    if (existing) {
      existing.score += weight;
      existing.count++;
      if (!existing.platforms.includes(platform)) {
        existing.platforms.push(platform);
      }
    } else {
      prefs.promptPatterns.push({
        pattern,
        score: weight,
        platforms: [platform],
        count: 1,
      });
    }
  }

  // Keep only top 100 patterns sorted by score
  prefs.promptPatterns.sort((a, b) => b.score - a.score);
  prefs.promptPatterns = prefs.promptPatterns.slice(0, 100);

  // Update signature style
  await updateSignatureStyle(prompt, prefs);

  await saveDeepPreferences(prefs);
}

/**
 * Update user's signature style based on their prompts
 */
async function updateSignatureStyle(
  prompt: string,
  prefs: DeepPreferences
): Promise<void> {
  if (!prefs.signatureStyle) {
    prefs.signatureStyle = {
      preferredLength: 'medium',
      usesParameters: false,
      usesArtistReferences: false,
      preferredMoods: [],
      preferredQualifiers: [],
    };
  }

  const style = prefs.signatureStyle;

  // Track prompt length preference
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount < 20) {
    style.preferredLength = 'short';
  } else if (wordCount > 60) {
    style.preferredLength = 'long';
  } else {
    style.preferredLength = 'medium';
  }

  // Check for parameters (--ar, --v, etc.)
  if (/--\w+/.test(prompt)) {
    style.usesParameters = true;
  }

  // Check for artist references
  if (/\b(by|artist|style of|inspired by)\s+[A-Z][a-z]+/i.test(prompt)) {
    style.usesArtistReferences = true;
  }

  // Extract moods
  const moodWords = ['peaceful', 'dramatic', 'intense', 'serene', 'melancholic', 'uplifting',
    'mysterious', 'whimsical', 'powerful', 'gentle', 'energetic', 'calm', 'dark', 'bright',
    'moody', 'ethereal', 'dreamy', 'vibrant', 'muted'];
  for (const mood of moodWords) {
    if (prompt.toLowerCase().includes(mood) && !style.preferredMoods.includes(mood)) {
      style.preferredMoods.push(mood);
      if (style.preferredMoods.length > 5) {
        style.preferredMoods.shift(); // Keep only last 5
      }
    }
  }

  // Extract qualifiers
  const qualifiers = ['highly detailed', 'ultra realistic', 'photorealistic', '8k', '4k',
    'masterpiece', 'best quality', 'professional', 'cinematic', 'sharp focus'];
  for (const qualifier of qualifiers) {
    if (prompt.toLowerCase().includes(qualifier) && !style.preferredQualifiers.includes(qualifier)) {
      style.preferredQualifiers.push(qualifier);
      if (style.preferredQualifiers.length > 5) {
        style.preferredQualifiers.shift();
      }
    }
  }
}

/**
 * Get cross-platform keywords that work well everywhere
 */
export async function getUniversalKeywords(
  minPlatforms: number = 2,
  limit: number = 10
): Promise<{ keyword: string; platforms: Platform[]; avgScore: number }[]> {
  const prefs = await getDeepPreferences();

  if (!prefs.crossPlatformKeywords) {
    return [];
  }

  const universal = Object.entries(prefs.crossPlatformKeywords)
    .filter(([, data]) => data.platforms.length >= minPlatforms && data.totalScore > 0)
    .map(([keyword, data]) => ({
      keyword,
      platforms: data.platforms,
      avgScore: data.totalScore / data.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);

  return universal;
}

/**
 * Get top prompt patterns for a platform (or universal)
 */
export async function getTopPatterns(
  platform?: Platform,
  limit: number = 8
): Promise<{ pattern: string; score: number; isUniversal: boolean }[]> {
  const prefs = await getDeepPreferences();

  if (!prefs.promptPatterns) {
    return [];
  }

  let patterns = prefs.promptPatterns
    .filter((p) => p.score > 0)
    .map((p) => ({
      pattern: p.pattern,
      score: p.score,
      isUniversal: p.platforms.length >= 2,
    }));

  // If platform specified, boost platform-specific patterns
  if (platform) {
    patterns = patterns.map((p) => {
      const original = prefs.promptPatterns!.find((pp) => pp.pattern === p.pattern);
      if (original?.platforms.includes(platform)) {
        return { ...p, score: p.score * 1.5 };
      }
      return p;
    });
  }

  return patterns.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Get user's signature style summary
 */
export async function getSignatureStyleSummary(): Promise<string> {
  const prefs = await getDeepPreferences();

  if (!prefs.signatureStyle) {
    return '';
  }

  const style = prefs.signatureStyle;
  const parts: string[] = [];

  parts.push(`Preferred prompt length: ${style.preferredLength}`);

  if (style.usesParameters) {
    parts.push('Uses platform parameters');
  }

  if (style.usesArtistReferences) {
    parts.push('Includes artist references');
  }

  if (style.preferredMoods.length > 0) {
    parts.push(`Preferred moods: ${style.preferredMoods.join(', ')}`);
  }

  if (style.preferredQualifiers.length > 0) {
    parts.push(`Preferred qualifiers: ${style.preferredQualifiers.slice(0, 3).join(', ')}`);
  }

  return parts.join('. ');
}

/**
 * Enhanced feedback recording that also learns patterns
 */
export async function recordEnhancedFeedback(
  prompt: string,
  platform: Platform,
  isPositive: boolean
): Promise<void> {
  const keywords = extractKeywordsFromPrompt(prompt);
  const allKeywords = Object.values(keywords).flat();

  // Update cross-platform tracking
  await updateCrossPlatformKeywords(allKeywords, platform, isPositive);

  // Learn prompt patterns
  await learnPromptPatterns(prompt, platform, isPositive);
}

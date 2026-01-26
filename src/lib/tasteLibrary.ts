/**
 * Taste Library Module
 * Modular layered taste system - stack dimensions to build your aesthetic
 */

import { getDeepPreferences, saveDeepPreferences, type DeepPreferences } from './deepLearning';
import { getTasteProfile, saveTasteProfile } from './storage';
import type { TasteProfile } from '@/shared/types';

// Version for compatibility checking
const TASTE_PACK_VERSION = '2.0';

/**
 * Taste layer categories
 */
export type TasteLayer = 'mood' | 'palette' | 'light' | 'era' | 'lens' | 'form';

/**
 * Individual taste dimension within a layer
 */
export interface TasteDimension {
  id: string;
  name: string;
  layer: TasteLayer;
  description: string;
  keywords: Record<string, Record<string, number>>; // category -> keyword -> score
}

/**
 * Complete taste pack structure for import/export
 */
export interface TastePack {
  version: string;
  name: string;
  description: string;
  author?: string;
  createdAt: string;
  tags: string[];
  deepPreferences: Partial<DeepPreferences>;
  tasteProfile?: Partial<TasteProfile>;
  stats?: {
    totalKeywords: number;
    topLikedCategories: string[];
    topDislikedCategories: string[];
  };
}

/**
 * Layer definitions with their dimensions
 */
export const TASTE_LAYERS: Record<TasteLayer, { name: string; description: string }> = {
  mood: { name: 'Mood', description: 'Emotional atmosphere' },
  palette: { name: 'Palette', description: 'Color and tone' },
  light: { name: 'Light', description: 'Lighting approach' },
  era: { name: 'Era', description: 'Temporal aesthetic' },
  lens: { name: 'Lens', description: 'Cultural perspective' },
  form: { name: 'Form', description: 'Technical style' },
};

/**
 * All available taste dimensions organized by layer
 */
export const TASTE_DIMENSIONS: TasteDimension[] = [
  // ============ MOOD LAYER ============
  {
    id: 'brooding',
    name: 'Brooding',
    layer: 'mood',
    description: 'Dark, contemplative, introspective',
    keywords: {
      mood: { 'dark': 3, 'mysterious': 2.5, 'melancholic': 2, 'somber': 2, 'introspective': 2, 'haunting': 2, 'bright': -2, 'cheerful': -2 },
      style: { 'dramatic': 2, 'moody': 2.5, 'atmospheric': 2 },
    },
  },
  {
    id: 'serene',
    name: 'Serene',
    layer: 'mood',
    description: 'Calm, peaceful, tranquil',
    keywords: {
      mood: { 'peaceful': 3, 'calm': 3, 'serene': 3, 'tranquil': 2.5, 'gentle': 2, 'harmonious': 2, 'chaotic': -2, 'intense': -1.5 },
      style: { 'meditative': 2, 'zen': 2, 'contemplative': 2 },
    },
  },
  {
    id: 'electric',
    name: 'Electric',
    layer: 'mood',
    description: 'High energy, vibrant, dynamic',
    keywords: {
      mood: { 'energetic': 3, 'dynamic': 2.5, 'intense': 2, 'powerful': 2, 'vibrant': 2.5, 'exciting': 2, 'calm': -1.5, 'subtle': -1 },
      style: { 'bold': 2, 'striking': 2, 'impactful': 2 },
    },
  },
  {
    id: 'tender',
    name: 'Tender',
    layer: 'mood',
    description: 'Soft, intimate, emotional',
    keywords: {
      mood: { 'intimate': 3, 'tender': 3, 'romantic': 2.5, 'gentle': 2.5, 'emotional': 2, 'vulnerable': 2, 'harsh': -2, 'cold': -1.5 },
      style: { 'soft': 2, 'delicate': 2, 'subtle': 2 },
    },
  },
  {
    id: 'fierce',
    name: 'Fierce',
    layer: 'mood',
    description: 'Bold, aggressive, powerful',
    keywords: {
      mood: { 'powerful': 3, 'fierce': 3, 'bold': 2.5, 'aggressive': 2, 'intense': 2.5, 'dramatic': 2, 'gentle': -2, 'soft': -1.5 },
      style: { 'striking': 2, 'impactful': 2.5, 'raw': 2 },
    },
  },

  // ============ PALETTE LAYER ============
  {
    id: 'ember',
    name: 'Ember',
    layer: 'palette',
    description: 'Warm oranges, reds, golden tones',
    keywords: {
      color: { 'warm tones': 3, 'orange': 2.5, 'red': 2, 'golden': 2.5, 'amber': 2, 'fire': 2, 'cool tones': -2, 'blue': -1 },
      lighting: { 'golden hour': 2, 'warm': 2.5 },
    },
  },
  {
    id: 'frost',
    name: 'Frost',
    layer: 'palette',
    description: 'Cool blues, silvers, icy tones',
    keywords: {
      color: { 'cool tones': 3, 'blue': 2.5, 'silver': 2, 'icy': 2, 'cold': 2, 'teal': 2, 'warm tones': -2, 'orange': -1 },
      lighting: { 'blue hour': 2, 'cold': 2 },
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    layer: 'palette',
    description: 'Vivid, saturated, electric colors',
    keywords: {
      color: { 'neon': 3, 'vibrant': 3, 'saturated': 2.5, 'electric': 2, 'fluorescent': 2, 'vivid': 2.5, 'muted': -2, 'desaturated': -2 },
      style: { 'bold': 2, 'striking': 2 },
    },
  },
  {
    id: 'earth',
    name: 'Earth',
    layer: 'palette',
    description: 'Natural browns, greens, organic tones',
    keywords: {
      color: { 'earthy': 3, 'brown': 2, 'green': 2, 'natural': 2.5, 'organic': 2, 'muted': 2, 'neon': -2, 'artificial': -1.5 },
      style: { 'natural': 2, 'organic': 2 },
    },
  },
  {
    id: 'mono',
    name: 'Mono',
    layer: 'palette',
    description: 'Black, white, grayscale',
    keywords: {
      color: { 'monochrome': 3, 'black and white': 3, 'grayscale': 2.5, 'desaturated': 2, 'neutral': 2, 'vibrant': -2, 'colorful': -2 },
      style: { 'minimal': 2, 'stark': 2 },
    },
  },

  // ============ LIGHT LAYER ============
  {
    id: 'chiaroscuro',
    name: 'Chiaroscuro',
    layer: 'light',
    description: 'Strong contrast, dramatic shadows',
    keywords: {
      lighting: { 'chiaroscuro': 3, 'dramatic lighting': 3, 'high contrast': 2.5, 'low key': 2.5, 'shadows': 2, 'rim lighting': 2, 'flat': -2, 'even': -1.5 },
      style: { 'dramatic': 2, 'cinematic': 2 },
    },
  },
  {
    id: 'diffused',
    name: 'Diffused',
    layer: 'light',
    description: 'Soft, even, gentle lighting',
    keywords: {
      lighting: { 'soft lighting': 3, 'diffused': 3, 'even': 2, 'gentle': 2.5, 'overcast': 2, 'ambient': 2, 'harsh': -2, 'dramatic': -1.5 },
      style: { 'soft': 2, 'ethereal': 2 },
    },
  },
  {
    id: 'harsh',
    name: 'Harsh',
    layer: 'light',
    description: 'Hard edges, stark shadows',
    keywords: {
      lighting: { 'hard lighting': 3, 'harsh': 2.5, 'direct': 2.5, 'stark': 2, 'midday sun': 2, 'sharp shadows': 2, 'soft': -2, 'diffused': -2 },
      style: { 'raw': 2, 'gritty': 2 },
    },
  },
  {
    id: 'golden',
    name: 'Golden',
    layer: 'light',
    description: 'Warm sunset/sunrise glow',
    keywords: {
      lighting: { 'golden hour': 3, 'warm light': 2.5, 'sunset': 2.5, 'sunrise': 2, 'magic hour': 2.5, 'backlit': 2, 'cold': -1.5, 'blue': -1 },
      color: { 'warm tones': 2, 'golden': 2 },
    },
  },
  {
    id: 'void',
    name: 'Void',
    layer: 'light',
    description: 'Minimal light, deep shadows',
    keywords: {
      lighting: { 'low key': 3, 'dark': 2.5, 'minimal light': 2, 'shadows': 2.5, 'noir': 2, 'silhouette': 2, 'bright': -2, 'high key': -2 },
      mood: { 'mysterious': 2, 'dark': 2 },
    },
  },

  // ============ ERA LAYER ============
  {
    id: 'analog',
    name: 'Analog',
    layer: 'era',
    description: 'Film grain, vintage processing',
    keywords: {
      style: { 'film': 3, 'analog': 3, 'grain': 2.5, 'vintage': 2, 'retro': 2, 'nostalgic': 2, 'digital': -1.5, 'clean': -1 },
      quality: { 'film grain': 2.5, 'textured': 2 },
      color: { 'muted': 2, 'faded': 2 },
    },
  },
  {
    id: 'future',
    name: 'Future',
    layer: 'era',
    description: 'Sleek, technological, forward-looking',
    keywords: {
      style: { 'futuristic': 3, 'sci-fi': 2.5, 'technological': 2, 'sleek': 2.5, 'modern': 2, 'cutting-edge': 2, 'vintage': -2, 'retro': -1.5 },
      mood: { 'futuristic': 2 },
    },
  },
  {
    id: 'timeless',
    name: 'Timeless',
    layer: 'era',
    description: 'Classic, enduring, no specific period',
    keywords: {
      style: { 'timeless': 3, 'classic': 2.5, 'elegant': 2, 'refined': 2, 'sophisticated': 2, 'enduring': 2 },
      quality: { 'polished': 2, 'professional': 2 },
    },
  },
  {
    id: 'decay',
    name: 'Decay',
    layer: 'era',
    description: 'Weathered, aged, distressed',
    keywords: {
      style: { 'weathered': 3, 'aged': 2.5, 'distressed': 2.5, 'worn': 2, 'patina': 2, 'rustic': 2, 'pristine': -2, 'clean': -1.5 },
      quality: { 'textured': 2, 'rough': 2 },
    },
  },

  // ============ LENS LAYER (Cultural) ============
  {
    id: 'sankofa',
    name: 'Sankofa',
    layer: 'lens',
    description: 'African/diaspora futurism, ancestral + forward',
    keywords: {
      style: { 'afrofuturism': 3, 'afrofuturist': 3, 'african': 2.5, 'tribal': 2, 'ancestral': 2, 'diaspora': 2 },
      mood: { 'powerful': 2, 'majestic': 2, 'regal': 2, 'spiritual': 2 },
      color: { 'vibrant': 2, 'gold': 2, 'rich': 2 },
    },
  },
  {
    id: 'wabisabi',
    name: 'Wabi-Sabi',
    layer: 'lens',
    description: 'Japanese aesthetic of imperfection',
    keywords: {
      style: { 'wabi-sabi': 3, 'japanese': 2.5, 'imperfect': 2, 'asymmetrical': 2, 'organic': 2, 'natural': 2 },
      mood: { 'contemplative': 2, 'serene': 2, 'humble': 2 },
      color: { 'muted': 2, 'earthy': 2, 'subtle': 2 },
    },
  },
  {
    id: 'baroque',
    name: 'Baroque',
    layer: 'lens',
    description: 'Ornate European grandeur',
    keywords: {
      style: { 'baroque': 3, 'ornate': 2.5, 'opulent': 2.5, 'dramatic': 2, 'grand': 2, 'classical': 2, 'minimal': -2 },
      lighting: { 'dramatic lighting': 2, 'chiaroscuro': 2 },
      color: { 'rich': 2, 'gold': 2 },
    },
  },
  {
    id: 'nordic',
    name: 'Nordic',
    layer: 'lens',
    description: 'Scandinavian minimalism and nature',
    keywords: {
      style: { 'scandinavian': 3, 'nordic': 3, 'minimal': 2.5, 'clean': 2, 'functional': 2, 'hygge': 2 },
      mood: { 'calm': 2, 'cozy': 2, 'peaceful': 2 },
      color: { 'neutral': 2, 'white': 2, 'muted': 2 },
    },
  },
  {
    id: 'latinx',
    name: 'Latinx',
    layer: 'lens',
    description: 'Latin American vibrancy and magic realism',
    keywords: {
      style: { 'latin': 2.5, 'magical realism': 2.5, 'vibrant': 2, 'folkloric': 2, 'surreal': 2 },
      mood: { 'passionate': 2, 'mystical': 2, 'warm': 2 },
      color: { 'vibrant': 2.5, 'saturated': 2, 'warm tones': 2 },
    },
  },

  // ============ FORM LAYER (Technical) ============
  {
    id: 'cinematic',
    name: 'Cinematic',
    layer: 'form',
    description: 'Film-like, wide aspect, color graded',
    keywords: {
      style: { 'cinematic': 3, 'film': 2.5, 'movie': 2, 'theatrical': 2, 'widescreen': 2, 'anamorphic': 2 },
      quality: { 'professional': 2, 'polished': 2 },
      composition: { 'widescreen': 2, 'rule of thirds': 2 },
    },
  },
  {
    id: 'painterly',
    name: 'Painterly',
    layer: 'form',
    description: 'Brushstrokes, texture, artistic',
    keywords: {
      style: { 'painterly': 3, 'oil painting': 2.5, 'impressionist': 2, 'artistic': 2.5, 'textured': 2, 'brushwork': 2, 'photorealistic': -1.5 },
      medium: { 'painting': 2.5, 'oil': 2, 'acrylic': 2 },
    },
  },
  {
    id: 'graphic',
    name: 'Graphic',
    layer: 'form',
    description: 'Bold shapes, flat colors, design-forward',
    keywords: {
      style: { 'graphic': 3, 'flat': 2.5, 'bold': 2.5, 'vector': 2, 'illustrative': 2, 'poster': 2, 'realistic': -1.5 },
      composition: { 'geometric': 2, 'bold shapes': 2 },
    },
  },
  {
    id: 'raw',
    name: 'Raw',
    layer: 'form',
    description: 'Unpolished, documentary, authentic',
    keywords: {
      style: { 'raw': 3, 'documentary': 2.5, 'authentic': 2.5, 'candid': 2, 'unpolished': 2, 'real': 2, 'staged': -2, 'polished': -1.5 },
      quality: { 'grain': 2, 'imperfect': 2 },
    },
  },
  {
    id: 'hyperreal',
    name: 'Hyperreal',
    layer: 'form',
    description: 'Ultra-detailed, sharp, pristine',
    keywords: {
      style: { 'hyperrealistic': 3, 'photorealistic': 2.5, 'detailed': 2.5, 'sharp': 2, 'pristine': 2, 'perfect': 2 },
      quality: { 'highly detailed': 2.5, '8k': 2, 'sharp': 2, 'crisp': 2 },
    },
  },
];

/**
 * Get dimensions by layer
 */
export function getDimensionsByLayer(layer: TasteLayer): TasteDimension[] {
  return TASTE_DIMENSIONS.filter(d => d.layer === layer);
}

/**
 * Get a dimension by ID
 */
export function getDimensionById(id: string): TasteDimension | undefined {
  return TASTE_DIMENSIONS.find(d => d.id === id);
}

/**
 * Apply multiple dimensions to create a combined taste profile
 */
export async function applyDimensions(
  dimensionIds: string[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; error?: string }> {
  try {
    const existingPrefs = mode === 'merge' ? await getDeepPreferences() : getDefaultPreferences();
    const mergedKeywords: Record<string, Record<string, number>> = { ...existingPrefs.keywordScores };

    for (const id of dimensionIds) {
      const dimension = getDimensionById(id);
      if (!dimension) continue;

      for (const [category, keywords] of Object.entries(dimension.keywords)) {
        if (!mergedKeywords[category]) {
          mergedKeywords[category] = {};
        }
        for (const [keyword, score] of Object.entries(keywords)) {
          // Stack scores from multiple dimensions
          mergedKeywords[category][keyword] = (mergedKeywords[category][keyword] || 0) + score;
        }
      }
    }

    existingPrefs.keywordScores = mergedKeywords;
    await saveDeepPreferences(existingPrefs);

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get default empty preferences
 */
function getDefaultPreferences(): DeepPreferences {
  return {
    keywordScores: {},
    platformScores: {} as DeepPreferences['platformScores'],
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
 * Export current taste profile as a downloadable pack
 */
export async function exportTastePack(
  name: string,
  description: string,
  tags: string[]
): Promise<TastePack> {
  const deepPrefs = await getDeepPreferences();
  const tasteProfile = await getTasteProfile();

  let totalKeywords = 0;
  const categoryScores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(deepPrefs.keywordScores || {})) {
    const scores = Object.values(keywords);
    totalKeywords += scores.length;
    categoryScores[category] = scores.reduce((a, b) => a + b, 0);
  }

  const sortedCategories = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const topLiked = sortedCategories.filter(([, score]) => score > 0).slice(0, 5).map(([cat]) => cat);
  const topDisliked = sortedCategories.filter(([, score]) => score < 0).slice(0, 5).map(([cat]) => cat);

  return {
    version: TASTE_PACK_VERSION,
    name,
    description,
    tags,
    createdAt: new Date().toISOString(),
    deepPreferences: deepPrefs,
    tasteProfile: tasteProfile || undefined,
    stats: { totalKeywords, topLikedCategories: topLiked, topDislikedCategories: topDisliked },
  };
}

/**
 * Import a taste pack and merge with existing preferences
 */
export async function importTastePack(
  pack: TastePack,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (mode === 'replace') {
      if (pack.deepPreferences) {
        await saveDeepPreferences(pack.deepPreferences as DeepPreferences);
      }
      if (pack.tasteProfile) {
        await saveTasteProfile(pack.tasteProfile as TasteProfile);
      }
    } else {
      const existingPrefs = await getDeepPreferences();
      const mergedPrefs = mergeDeepPreferences(existingPrefs, pack.deepPreferences);
      await saveDeepPreferences(mergedPrefs);

      if (pack.tasteProfile) {
        const existingProfile = await getTasteProfile();
        if (existingProfile) {
          const mergedProfile = mergeTasteProfiles(existingProfile, pack.tasteProfile);
          await saveTasteProfile(mergedProfile);
        } else {
          await saveTasteProfile(pack.tasteProfile as TasteProfile);
        }
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function mergeDeepPreferences(existing: DeepPreferences, incoming: Partial<DeepPreferences>): DeepPreferences {
  const merged = { ...existing };

  if (incoming.keywordScores) {
    merged.keywordScores = merged.keywordScores || {};
    for (const [category, keywords] of Object.entries(incoming.keywordScores)) {
      merged.keywordScores[category] = merged.keywordScores[category] || {};
      for (const [keyword, score] of Object.entries(keywords)) {
        const existingScore = merged.keywordScores[category][keyword];
        merged.keywordScores[category][keyword] = existingScore !== undefined
          ? (existingScore + score) / 2
          : score;
      }
    }
  }

  if (incoming.successfulCombinations) {
    const existingSet = new Set((merged.successfulCombinations || []).map(c => JSON.stringify(c)));
    for (const combo of incoming.successfulCombinations) {
      existingSet.add(JSON.stringify(combo));
    }
    merged.successfulCombinations = Array.from(existingSet).map(s => JSON.parse(s)).slice(-100);
  }

  if (incoming.failedCombinations) {
    const existingSet = new Set((merged.failedCombinations || []).map(c => JSON.stringify(c)));
    for (const combo of incoming.failedCombinations) {
      existingSet.add(JSON.stringify(combo));
    }
    merged.failedCombinations = Array.from(existingSet).map(s => JSON.parse(s)).slice(-50);
  }

  if (incoming.likeReasons) {
    merged.likeReasons = merged.likeReasons || {};
    for (const [reason, count] of Object.entries(incoming.likeReasons)) {
      merged.likeReasons[reason] = (merged.likeReasons[reason] || 0) + count;
    }
  }

  if (incoming.trashReasons) {
    merged.trashReasons = merged.trashReasons || {};
    for (const [reason, count] of Object.entries(incoming.trashReasons)) {
      merged.trashReasons[reason] = (merged.trashReasons[reason] || 0) + count;
    }
  }

  return merged;
}

function mergeTasteProfiles(existing: TasteProfile, incoming: Partial<TasteProfile>): TasteProfile {
  const merged: TasteProfile = { ...existing, updatedAt: new Date() };

  if (incoming.visual) {
    merged.visual = {
      colorPalette: [...new Set([...(existing.visual?.colorPalette || []), ...(incoming.visual.colorPalette || [])])],
      lighting: [...new Set([...(existing.visual?.lighting || []), ...(incoming.visual.lighting || [])])],
      composition: [...new Set([...(existing.visual?.composition || []), ...(incoming.visual.composition || [])])],
      style: [...new Set([...(existing.visual?.style || []), ...(incoming.visual.style || [])])],
    };
  }

  if (incoming.audio) {
    merged.audio = {
      genres: [...new Set([...(existing.audio?.genres || []), ...(incoming.audio.genres || [])])],
      moods: [...new Set([...(existing.audio?.moods || []), ...(incoming.audio.moods || [])])],
      tempo: [...new Set([...(existing.audio?.tempo || []), ...(incoming.audio.tempo || [])])],
      production: [...new Set([...(existing.audio?.production || []), ...(incoming.audio.production || [])])],
      vocalStyle: [...new Set([...(existing.audio?.vocalStyle || []), ...(incoming.audio.vocalStyle || [])])],
    };
  }

  if (incoming.patterns) {
    merged.patterns = {
      frequentKeywords: { ...(existing.patterns?.frequentKeywords || {}), ...(incoming.patterns.frequentKeywords || {}) },
      preferredParameters: { ...(existing.patterns?.preferredParameters || {}), ...(incoming.patterns.preferredParameters || {}) },
      successfulPrompts: [...(existing.patterns?.successfulPrompts || []), ...(incoming.patterns.successfulPrompts || [])].slice(-50),
    };
  }

  return merged;
}

/**
 * Get all layer names for UI
 */
export function getLayerNames(): { id: TasteLayer; name: string; description: string }[] {
  return Object.entries(TASTE_LAYERS).map(([id, info]) => ({
    id: id as TasteLayer,
    name: info.name,
    description: info.description,
  }));
}

// Legacy support - map old presets to new dimension combinations
export const TASTE_PRESETS: TastePack[] = [];

export function getPresetByName(_name: string): TastePack | undefined {
  return undefined; // Presets replaced by modular dimensions
}

/**
 * Taste Library Module
 * Import/export taste profiles and manage taste presets
 */

import { getDeepPreferences, saveDeepPreferences, type DeepPreferences } from './deepLearning';
import { getTasteProfile, saveTasteProfile } from './storage';
import type { TasteProfile } from '@/shared/types';

// Version for compatibility checking
const TASTE_PACK_VERSION = '1.0';

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

  // The actual preference data
  deepPreferences: Partial<DeepPreferences>;
  tasteProfile?: Partial<TasteProfile>;

  // Metadata
  stats?: {
    totalKeywords: number;
    topLikedCategories: string[];
    topDislikedCategories: string[];
  };
}

/**
 * Preset taste packs for common aesthetics
 */
export const TASTE_PRESETS: TastePack[] = [
  {
    version: TASTE_PACK_VERSION,
    name: 'Shadow Theatre',
    description: 'Moody, dramatic visuals with rich shadows and cinematic color grading',
    tags: ['cinematic', 'dark', 'moody', 'dramatic'],
    createdAt: new Date().toISOString(),
    deepPreferences: {
      keywordScores: {
        lighting: {
          'dramatic lighting': 3,
          'low key': 3,
          'chiaroscuro': 2.5,
          'rim lighting': 2,
          'volumetric': 2,
          'moody lighting': 3,
          'high key': -2,
          'flat lighting': -2,
        },
        mood: {
          'dramatic': 3,
          'mysterious': 2.5,
          'intense': 2,
          'dark': 2.5,
          'haunting': 2,
          'epic': 2,
          'bright': -1.5,
          'cheerful': -1,
        },
        style: {
          'cinematic': 3,
          'photorealistic': 2,
          'gritty': 2,
          'editorial': 1.5,
          'fine art': 1.5,
          'cartoon': -2,
          'anime': -1,
        },
        color: {
          'high contrast': 2.5,
          'desaturated': 1.5,
          'cool tones': 2,
          'teal and orange': 2,
          'pastel': -2,
          'vibrant': -1,
        },
      },
    },
  },
  {
    version: TASTE_PACK_VERSION,
    name: 'Mist & Honey',
    description: 'Soft, dreamy aesthetics with pastel colors and gentle lighting',
    tags: ['ethereal', 'dreamy', 'soft', 'pastel', 'fantasy'],
    createdAt: new Date().toISOString(),
    deepPreferences: {
      keywordScores: {
        lighting: {
          'soft lighting': 3,
          'natural light': 2.5,
          'golden hour': 2,
          'diffused': 2.5,
          'backlit': 2,
          'hard lighting': -2,
          'dramatic lighting': -1,
        },
        mood: {
          'dreamy': 3,
          'ethereal': 3,
          'peaceful': 2.5,
          'serene': 2.5,
          'whimsical': 2,
          'gentle': 2,
          'romantic': 2,
          'gritty': -2,
          'intense': -1.5,
        },
        style: {
          'ethereal': 3,
          'fantasy': 2.5,
          'painterly': 2,
          'impressionist': 2,
          'fine art': 2,
          'gritty': -2,
          'cyberpunk': -1.5,
        },
        color: {
          'pastel': 3,
          'soft': 2.5,
          'warm tones': 2,
          'muted': 2,
          'high contrast': -2,
          'neon': -2,
        },
      },
    },
  },
  {
    version: TASTE_PACK_VERSION,
    name: 'Chrome Rain',
    description: 'Futuristic cityscapes with neon lights and high-tech aesthetics',
    tags: ['cyberpunk', 'neon', 'futuristic', 'sci-fi', 'tech'],
    createdAt: new Date().toISOString(),
    deepPreferences: {
      keywordScores: {
        lighting: {
          'neon': 3,
          'volumetric': 2.5,
          'rim lighting': 2,
          'dramatic lighting': 2,
          'high contrast': 2,
          'natural light': -1,
          'soft lighting': -1,
        },
        mood: {
          'futuristic': 3,
          'intense': 2.5,
          'energetic': 2,
          'mysterious': 2,
          'dark': 2,
          'peaceful': -1.5,
          'nostalgic': -1,
        },
        style: {
          'cyberpunk': 3,
          'sci-fi': 2.5,
          'futuristic': 2.5,
          'cinematic': 2,
          '3d render': 2,
          'cgi': 2,
          'vintage': -2,
          'retro': -1,
        },
        color: {
          'neon': 3,
          'vibrant': 2.5,
          'saturated': 2,
          'teal and orange': 2,
          'cool tones': 2,
          'pastel': -2,
          'muted': -1.5,
        },
      },
    },
  },
  {
    version: TASTE_PACK_VERSION,
    name: 'Analog Soul',
    description: 'Classic film photography look with grain, warm tones, and nostalgic feel',
    tags: ['vintage', 'film', 'nostalgic', 'analog', 'retro'],
    createdAt: new Date().toISOString(),
    deepPreferences: {
      keywordScores: {
        lighting: {
          'natural light': 3,
          'golden hour': 2.5,
          'soft lighting': 2,
          'ambient': 2,
          'studio lighting': -1,
          'neon': -2,
        },
        mood: {
          'nostalgic': 3,
          'warm': 2.5,
          'intimate': 2,
          'melancholic': 2,
          'romantic': 2,
          'futuristic': -2,
          'intense': -1,
        },
        style: {
          'vintage': 3,
          'retro': 2.5,
          'film': 3,
          'analog': 2.5,
          'documentary': 2,
          'photorealistic': 2,
          'cyberpunk': -2,
          'futuristic': -2,
        },
        color: {
          'warm tones': 3,
          'sepia': 2,
          'muted': 2.5,
          'grain': 2,
          'earthy': 2,
          'neon': -2,
          'vibrant': -1,
        },
        quality: {
          'grain': 2.5,
          'film grain': 3,
          'soft focus': 1.5,
          'textured': 2,
          'crisp': -1,
          'sharp': -0.5,
        },
      },
    },
  },
  {
    version: TASTE_PACK_VERSION,
    name: 'Void & Form',
    description: 'Simple, clean aesthetics with lots of negative space and subtle tones',
    tags: ['minimal', 'clean', 'simple', 'modern', 'elegant'],
    createdAt: new Date().toISOString(),
    deepPreferences: {
      keywordScores: {
        lighting: {
          'soft lighting': 3,
          'natural light': 2.5,
          'high key': 2,
          'diffused': 2,
          'flat': 1.5,
          'dramatic lighting': -1.5,
          'low key': -1,
        },
        mood: {
          'calm': 3,
          'peaceful': 2.5,
          'serene': 2.5,
          'elegant': 2,
          'sophisticated': 2,
          'chaotic': -2,
          'intense': -1.5,
        },
        style: {
          'minimalist': 3,
          'minimal': 3,
          'clean': 3,
          'modern': 2.5,
          'simple': 2,
          'elegant': 2,
          'maximalist': -3,
          'cluttered': -2,
        },
        color: {
          'muted': 3,
          'monochrome': 2.5,
          'neutral': 2.5,
          'desaturated': 2,
          'subtle': 2,
          'neon': -2,
          'vibrant': -1.5,
        },
        composition: {
          'negative space': 3,
          'centered': 2.5,
          'symmetrical': 2,
          'balanced': 2,
          'simple': 2,
          'busy': -2,
          'cluttered': -2,
        },
      },
    },
  },
  {
    version: TASTE_PACK_VERSION,
    name: 'Sankofa Rising',
    description: 'Bold African-inspired futurism with vibrant patterns and cultural elements',
    tags: ['afrofuturism', 'african', 'futuristic', 'cultural', 'bold'],
    createdAt: new Date().toISOString(),
    deepPreferences: {
      keywordScores: {
        lighting: {
          'dramatic lighting': 2.5,
          'golden hour': 2.5,
          'warm': 2,
          'volumetric': 2,
          'rim lighting': 2,
        },
        mood: {
          'powerful': 3,
          'majestic': 2.5,
          'futuristic': 2.5,
          'spiritual': 2,
          'ancestral': 2,
          'regal': 2.5,
          'bold': 2,
        },
        style: {
          'afrofuturism': 3,
          'afrofuturist': 3,
          'tribal': 2,
          'african': 2.5,
          'futuristic': 2,
          'ornate': 2,
          'bold': 2,
          'cultural': 2,
        },
        color: {
          'vibrant': 3,
          'warm tones': 2.5,
          'gold': 2.5,
          'rich': 2,
          'saturated': 2,
          'earthy': 2,
          'jewel tones': 2,
        },
      },
    },
  },
];

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

  // Calculate stats
  let totalKeywords = 0;
  const categoryScores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(deepPrefs.keywordScores || {})) {
    const scores = Object.values(keywords);
    totalKeywords += scores.length;
    categoryScores[category] = scores.reduce((a, b) => a + b, 0);
  }

  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1]);

  const topLiked = sortedCategories
    .filter(([, score]) => score > 0)
    .slice(0, 5)
    .map(([cat]) => cat);

  const topDisliked = sortedCategories
    .filter(([, score]) => score < 0)
    .slice(0, 5)
    .map(([cat]) => cat);

  return {
    version: TASTE_PACK_VERSION,
    name,
    description,
    tags,
    createdAt: new Date().toISOString(),
    deepPreferences: deepPrefs,
    tasteProfile: tasteProfile || undefined,
    stats: {
      totalKeywords,
      topLikedCategories: topLiked,
      topDislikedCategories: topDisliked,
    },
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
      // Replace entirely
      if (pack.deepPreferences) {
        await saveDeepPreferences(pack.deepPreferences as DeepPreferences);
      }
      if (pack.tasteProfile) {
        await saveTasteProfile(pack.tasteProfile as TasteProfile);
      }
    } else {
      // Merge with existing
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

/**
 * Merge two deep preference objects
 */
function mergeDeepPreferences(
  existing: DeepPreferences,
  incoming: Partial<DeepPreferences>
): DeepPreferences {
  const merged = { ...existing };

  // Merge keyword scores
  if (incoming.keywordScores) {
    merged.keywordScores = merged.keywordScores || {};
    for (const [category, keywords] of Object.entries(incoming.keywordScores)) {
      merged.keywordScores[category] = merged.keywordScores[category] || {};
      for (const [keyword, score] of Object.entries(keywords)) {
        // Average the scores if both exist, otherwise use the new score
        const existingScore = merged.keywordScores[category][keyword];
        if (existingScore !== undefined) {
          merged.keywordScores[category][keyword] = (existingScore + score) / 2;
        } else {
          merged.keywordScores[category][keyword] = score;
        }
      }
    }
  }

  // Merge successful combinations
  if (incoming.successfulCombinations) {
    const existingSet = new Set(
      (merged.successfulCombinations || []).map(c => JSON.stringify(c))
    );
    for (const combo of incoming.successfulCombinations) {
      existingSet.add(JSON.stringify(combo));
    }
    merged.successfulCombinations = Array.from(existingSet)
      .map(s => JSON.parse(s))
      .slice(-100);
  }

  // Merge failed combinations
  if (incoming.failedCombinations) {
    const existingSet = new Set(
      (merged.failedCombinations || []).map(c => JSON.stringify(c))
    );
    for (const combo of incoming.failedCombinations) {
      existingSet.add(JSON.stringify(combo));
    }
    merged.failedCombinations = Array.from(existingSet)
      .map(s => JSON.parse(s))
      .slice(-50);
  }

  // Merge like/trash reasons
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

/**
 * Merge two taste profiles
 */
function mergeTasteProfiles(
  existing: TasteProfile,
  incoming: Partial<TasteProfile>
): TasteProfile {
  const merged: TasteProfile = {
    ...existing,
    updatedAt: new Date(),
  };

  // Merge visual preferences
  if (incoming.visual) {
    merged.visual = {
      colorPalette: [...new Set([...(existing.visual?.colorPalette || []), ...(incoming.visual.colorPalette || [])])],
      lighting: [...new Set([...(existing.visual?.lighting || []), ...(incoming.visual.lighting || [])])],
      composition: [...new Set([...(existing.visual?.composition || []), ...(incoming.visual.composition || [])])],
      style: [...new Set([...(existing.visual?.style || []), ...(incoming.visual.style || [])])],
    };
  }

  // Merge audio preferences
  if (incoming.audio) {
    merged.audio = {
      genres: [...new Set([...(existing.audio?.genres || []), ...(incoming.audio.genres || [])])],
      moods: [...new Set([...(existing.audio?.moods || []), ...(incoming.audio.moods || [])])],
      tempo: [...new Set([...(existing.audio?.tempo || []), ...(incoming.audio.tempo || [])])],
      production: [...new Set([...(existing.audio?.production || []), ...(incoming.audio.production || [])])],
      vocalStyle: [...new Set([...(existing.audio?.vocalStyle || []), ...(incoming.audio.vocalStyle || [])])],
    };
  }

  // Merge patterns
  if (incoming.patterns) {
    merged.patterns = {
      frequentKeywords: {
        ...(existing.patterns?.frequentKeywords || {}),
        ...(incoming.patterns.frequentKeywords || {}),
      },
      preferredParameters: {
        ...(existing.patterns?.preferredParameters || {}),
        ...(incoming.patterns.preferredParameters || {}),
      },
      successfulPrompts: [
        ...(existing.patterns?.successfulPrompts || []),
        ...(incoming.patterns.successfulPrompts || []),
      ].slice(-50), // Keep last 50
    };
  }

  return merged;
}

/**
 * Download taste pack as JSON file
 */
export function downloadTastePack(pack: TastePack): void {
  const json = JSON.stringify(pack, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `refyn-taste-${pack.name.toLowerCase().replace(/\s+/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded taste pack file
 */
export async function parseTastePackFile(file: File): Promise<TastePack | null> {
  try {
    const text = await file.text();
    const pack = JSON.parse(text) as TastePack;

    // Validate basic structure
    if (!pack.version || !pack.name || !pack.deepPreferences) {
      console.error('[Refyn] Invalid taste pack structure');
      return null;
    }

    return pack;
  } catch (error) {
    console.error('[Refyn] Failed to parse taste pack:', error);
    return null;
  }
}

/**
 * Get all available preset names
 */
export function getPresetNames(): string[] {
  return TASTE_PRESETS.map(p => p.name);
}

/**
 * Get a preset by name
 */
export function getPresetByName(name: string): TastePack | undefined {
  return TASTE_PRESETS.find(p => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Vision Analysis Module
 * Analyzes images to extract visual style descriptors for taste learning
 */

import type { Platform } from '@/shared/types';

// Visual descriptor categories that can be extracted from images
export interface VisualDescriptors {
  // Core visual elements
  style: string[];
  mood: string[];
  colors: string[];
  lighting: string[];
  composition: string[];
  quality: string[];

  // Technical aspects
  medium: string[];
  technique: string[];

  // Subject matter
  subjects: string[];
  setting: string[];

  // Overall assessment
  overallAesthetic: string;
  confidence: number;
}

// Predefined visual vocabulary for analysis
const VISUAL_VOCABULARY = {
  style: [
    'photorealistic', 'cinematic', 'artistic', 'abstract', 'minimalist', 'maximalist',
    'surreal', 'vintage', 'retro', 'futuristic', 'gothic', 'ethereal', 'dreamy',
    'gritty', 'clean', 'editorial', 'fine art', 'commercial', 'documentary',
    'impressionist', 'expressionist', 'pop art', 'art nouveau', 'art deco',
    'cyberpunk', 'steampunk', 'fantasy', 'sci-fi', 'anime', 'manga', 'cartoon',
    'hyperrealistic', 'stylized', 'painterly', 'graphic', 'illustrative',
  ],
  mood: [
    'peaceful', 'dramatic', 'intense', 'serene', 'melancholic', 'uplifting',
    'mysterious', 'whimsical', 'powerful', 'gentle', 'energetic', 'calm',
    'dark', 'bright', 'warm', 'cold', 'nostalgic', 'futuristic', 'romantic',
    'haunting', 'joyful', 'somber', 'playful', 'serious', 'epic', 'intimate',
  ],
  colors: [
    'warm tones', 'cool tones', 'vibrant', 'muted', 'pastel', 'monochrome',
    'high contrast', 'low contrast', 'saturated', 'desaturated', 'earthy',
    'neon', 'grayscale', 'sepia', 'teal and orange', 'complementary',
    'analogous', 'triadic', 'split complementary', 'golden', 'silver',
  ],
  lighting: [
    'natural light', 'golden hour', 'blue hour', 'studio lighting', 'dramatic lighting',
    'soft lighting', 'hard lighting', 'rim lighting', 'backlit', 'silhouette',
    'high key', 'low key', 'chiaroscuro', 'volumetric', 'ambient', 'spotlit',
    'diffused', 'directional', 'flat', 'three-point', 'rembrandt', 'butterfly',
  ],
  composition: [
    'rule of thirds', 'centered', 'symmetrical', 'asymmetrical', 'dynamic',
    'balanced', 'unbalanced', 'leading lines', 'framing', 'negative space',
    'close up', 'wide shot', 'medium shot', 'full body', 'portrait', 'landscape',
    'birds eye', 'worms eye', 'dutch angle', 'over the shoulder', 'pov',
  ],
  quality: [
    'highly detailed', 'sharp', 'crisp', 'soft focus', 'bokeh', 'shallow depth of field',
    'deep depth of field', 'grain', 'noise', 'clean', 'textured', 'smooth',
    'professional', 'amateur', 'polished', 'raw', 'refined', 'rough',
  ],
  medium: [
    'photography', 'digital art', 'oil painting', 'watercolor', 'acrylic',
    'pencil', 'charcoal', 'ink', 'pastel', '3d render', 'cgi', 'mixed media',
    'collage', 'vector', 'pixel art', 'sculpture', 'installation', 'generative',
  ],
  technique: [
    'impasto', 'glazing', 'blending', 'layering', 'stippling', 'hatching',
    'cross-hatching', 'wet on wet', 'dry brush', 'splattering', 'pouring',
    'masking', 'compositing', 'photo manipulation', 'double exposure',
  ],
};

/**
 * Analyze an image using AI vision to extract visual descriptors
 * This sends the image to the background script which handles the API call
 */
export async function analyzeImage(
  imageUrl: string,
  platform: Platform
): Promise<VisualDescriptors | null> {
  try {
    // Send to background script for vision analysis
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_IMAGE',
      payload: { imageUrl, platform },
    });

    if (response?.success && response.descriptors) {
      return response.descriptors as VisualDescriptors;
    }

    // Fallback: If API analysis fails, try basic analysis from URL/metadata
    return performBasicAnalysis(imageUrl);
  } catch (error) {
    console.error('[Refyn Vision] Analysis failed:', error);
    return performBasicAnalysis(imageUrl);
  }
}

/**
 * Basic analysis fallback when AI vision is unavailable
 * Extracts what we can from URL patterns and common naming conventions
 */
function performBasicAnalysis(imageUrl: string): VisualDescriptors {
  const url = imageUrl.toLowerCase();
  const descriptors: VisualDescriptors = {
    style: [],
    mood: [],
    colors: [],
    lighting: [],
    composition: [],
    quality: [],
    medium: [],
    technique: [],
    subjects: [],
    setting: [],
    overallAesthetic: 'unknown',
    confidence: 0.2, // Low confidence for basic analysis
  };

  // Check URL for style hints
  for (const [category, terms] of Object.entries(VISUAL_VOCABULARY)) {
    for (const term of terms) {
      if (url.includes(term.replace(/\s+/g, '-')) || url.includes(term.replace(/\s+/g, '_'))) {
        const arr = descriptors[category as keyof typeof descriptors];
        if (Array.isArray(arr)) {
          arr.push(term);
        }
      }
    }
  }

  return descriptors;
}

/**
 * Build a vision analysis prompt for AI
 */
export function buildVisionPrompt(): string {
  return `Analyze this image and extract visual style descriptors. Return a JSON object with these categories:

{
  "style": ["list of artistic/visual styles detected"],
  "mood": ["emotional qualities and atmosphere"],
  "colors": ["color palette and tonal qualities"],
  "lighting": ["lighting style and quality"],
  "composition": ["compositional elements and framing"],
  "quality": ["technical quality descriptors"],
  "medium": ["apparent medium or technique"],
  "technique": ["specific artistic techniques visible"],
  "subjects": ["main subjects or elements"],
  "setting": ["environment or background"],
  "overallAesthetic": "one phrase summary of the overall aesthetic"
}

Be specific and use standard art/photography terminology. Focus on elements that define the visual style.`;
}

/**
 * Parse AI vision response into VisualDescriptors
 */
export function parseVisionResponse(response: string): VisualDescriptors | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      style: Array.isArray(parsed.style) ? parsed.style : [],
      mood: Array.isArray(parsed.mood) ? parsed.mood : [],
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      lighting: Array.isArray(parsed.lighting) ? parsed.lighting : [],
      composition: Array.isArray(parsed.composition) ? parsed.composition : [],
      quality: Array.isArray(parsed.quality) ? parsed.quality : [],
      medium: Array.isArray(parsed.medium) ? parsed.medium : [],
      technique: Array.isArray(parsed.technique) ? parsed.technique : [],
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      setting: Array.isArray(parsed.setting) ? parsed.setting : [],
      overallAesthetic: parsed.overallAesthetic || 'unknown',
      confidence: 0.8,
    };
  } catch {
    return null;
  }
}

/**
 * Convert visual descriptors to keyword scores for deep learning
 */
export function descriptorsToKeywordScores(
  descriptors: VisualDescriptors,
  isLiked: boolean
): Record<string, Record<string, number>> {
  const scoreMultiplier = isLiked ? 1.5 : -1.5;
  const confidenceMultiplier = descriptors.confidence;
  const scores: Record<string, Record<string, number>> = {};

  const categories = ['style', 'mood', 'colors', 'lighting', 'composition', 'quality', 'medium', 'technique'];

  for (const category of categories) {
    const terms = descriptors[category as keyof VisualDescriptors];
    if (Array.isArray(terms) && terms.length > 0) {
      scores[category] = {};
      for (const term of terms) {
        scores[category][term.toLowerCase()] = scoreMultiplier * confidenceMultiplier;
      }
    }
  }

  return scores;
}

/**
 * Merge visual analysis results into existing deep preferences
 */
export function mergeVisualAnalysis(
  existingScores: Record<string, Record<string, number>>,
  newScores: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const merged = { ...existingScores };

  for (const [category, terms] of Object.entries(newScores)) {
    if (!merged[category]) {
      merged[category] = {};
    }
    for (const [term, score] of Object.entries(terms)) {
      merged[category][term] = (merged[category][term] || 0) + score;
    }
  }

  return merged;
}

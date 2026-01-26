// Platform Types
export type Platform =
  | 'midjourney'
  | 'suno'
  | 'udio'
  | 'runway'
  | 'pika'
  | 'dalle'
  | 'flux'
  | 'leonardo'
  | 'stable-diffusion'
  | 'higgsfield'
  | 'chatgpt'
  | 'claude'
  | 'unknown';

export type PlatformCategory = 'image' | 'music' | 'video' | 'text';

export interface PlatformInfo {
  id: Platform;
  name: string;
  category: PlatformCategory;
  icon: string;
  color: string;
}

// Optimization Types
export type OptimizationMode = 'enhance' | 'expand' | 'style' | 'params' | 'crazy';

// Theme Remix Types - transforms aesthetic while keeping subject
export type ThemeRemixId =
  | 'freaq'      // Experimental, glitchy, rule-breaking
  | 'egun'       // Dark, ancestral, spiritual, shadows
  | 'alien'      // Sci-fi, otherworldly, biomechanical
  | 'bk2dvd'     // Cinematic, film aesthetic, widescreen
  | 'wahala'     // Chaotic, meme, ironic, African internet energy
  | 'minimal'    // Clean, simple, negative space
  | 'surreal'    // Dreamlike, impossible, Dali-esque
  | 'y2k'        // Early 2000s, chrome, cyber
  | 'vaporwave'  // Aesthetic, nostalgic, neon pink/blue
  | 'brutalist'  // Raw, concrete, stark, industrial
  | null;        // No theme selected

export interface ThemeRemix {
  id: ThemeRemixId;
  name: string;
  emoji: string;
  description: string;
  keywords: string[];
  styleGuide: string; // Instructions for AI on how to apply this theme
}

// Style Presets
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: PlatformCategory;
  keywords: string[];
  avoid: string[]; // Keywords to avoid when this style is selected
  icon?: string;
}

// User Preferences & Learning
export interface UserPreferences {
  likedKeywords: Record<string, number>;    // keyword -> count of times liked
  dislikedKeywords: Record<string, number>; // keyword -> count of times disliked
  likedStyles: Record<string, number>;      // preset id -> count
  dislikedStyles: Record<string, number>;   // preset id -> count
  promptFeedback: PromptFeedback[];         // Recent feedback history
  lastUpdated: string;
}

export interface PromptFeedback {
  id: string;
  originalPrompt: string;
  refinedPrompt: string;
  platform: Platform;
  preset?: string;
  feedback: 'like' | 'dislike' | 'used' | 'regenerate';
  timestamp: string;
  extractedKeywords: string[];
}

export interface OptimizeRequest {
  prompt: string;
  platform: Platform;
  mode: OptimizationMode;
  chaosIntensity?: number; // 0-100
  tasteProfile?: TasteProfile;
}

export interface OptimizeResponse {
  success: boolean;
  optimizedPrompt?: string;
  genomeTags?: GenomeTag[];
  error?: string;
}

// Genome Types
export interface GenomeTag {
  category: string;
  value: string;
  confidence: number;
}

export interface TasteProfile {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  visual: {
    colorPalette: ('warm' | 'cool' | 'neutral' | 'vibrant' | 'muted')[];
    lighting: ('natural' | 'studio' | 'dramatic' | 'soft' | 'high-contrast')[];
    composition: ('centered' | 'rule-of-thirds' | 'symmetrical' | 'dynamic')[];
    style: ('photorealistic' | 'cinematic' | 'artistic' | 'abstract' | 'minimal')[];
  };

  audio: {
    genres: string[];
    moods: string[];
    tempo: ('slow' | 'medium' | 'fast' | 'variable')[];
    production: ('clean' | 'lo-fi' | 'layered' | 'minimal' | 'experimental')[];
    vocalStyle: string[];
  };

  patterns: {
    frequentKeywords: Record<string, number>;
    preferredParameters: Partial<Record<Platform, string[]>>;
    successfulPrompts: PromptRecord[];
  };
}

// Prompt Records & Lineage
export interface PromptRecord {
  id: string;
  content: string;
  platform: Platform;
  createdAt: Date;
  rating?: number; // 1-5 star rating
  liked?: boolean; // true = liked style, false = disliked style, undefined = neutral
  tags: string[];
  metadata?: Record<string, unknown>;
  // Image references (for Midjourney etc.)
  outputImageUrl?: string; // The generated image URL
  referenceImages?: string[]; // --sref, --cref URLs
  imagePrompts?: string[]; // Image-to-image input URLs
  extractedParams?: { // Parsed parameters
    ar?: string; // aspect ratio
    v?: string; // version
    seed?: string;
    stylize?: string;
    chaos?: string;
    weird?: string;
    style?: string;
    [key: string]: string | undefined;
  };
  // AI feedback on prompt quality
  aiFeedback?: {
    score: number; // 1-5
    strengths: string[];
    improvements: string[];
    analyzedAt: string;
  };
}

export interface PromptNode {
  id: string;
  content: string;
  platform: Platform;
  parentId: string | null;
  children: string[];
  createdAt: Date;
  metadata: {
    mode: OptimizationMode | 'manual';
    rating?: number;
    tags: string[];
  };
}

// Storage Types
export interface StorageData {
  apiKey?: string;
  tasteProfile?: TasteProfile;
  promptHistory: PromptRecord[];
  savedPrompts: PromptRecord[];
  lineageTree: Record<string, PromptNode>;
  settings: UserSettings;
}

export interface UserSettings {
  autoDetectPlatform: boolean;
  showFloatingToolbar: boolean;
  defaultMode: OptimizationMode;
  theme: 'dark' | 'light';
}

// Message Types (for Chrome messaging)
export type MessageType =
  | 'OPTIMIZE_PROMPT'
  | 'GET_API_KEY'
  | 'SET_API_KEY'
  | 'SAVE_PROMPT'
  | 'GET_HISTORY'
  | 'GET_TASTE_PROFILE'
  | 'UPDATE_TASTE_PROFILE'
  | 'DETECT_PLATFORM';

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

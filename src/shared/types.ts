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
export type OptimizationMode = 'enhance' | 'expand' | 'style' | 'params';

export interface OptimizeRequest {
  prompt: string;
  platform: Platform;
  mode: OptimizationMode;
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
  rating?: number;
  tags: string[];
  metadata?: Record<string, unknown>;
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

import type { Platform, PlatformInfo, PlatformCategory, UserSettings } from './types';

// Platform Information
export const PLATFORMS: Record<Platform, PlatformInfo> = {
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'image',
    icon: 'image',
    color: '#00F0FF',
  },
  dalle: {
    id: 'dalle',
    name: 'DALL-E',
    category: 'image',
    icon: 'image',
    color: '#10B981',
  },
  'stable-diffusion': {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    category: 'image',
    icon: 'image',
    color: '#8B5CF6',
  },
  leonardo: {
    id: 'leonardo',
    name: 'Leonardo.AI',
    category: 'image',
    icon: 'image',
    color: '#F59E0B',
  },
  flux: {
    id: 'flux',
    name: 'Flux',
    category: 'image',
    icon: 'image',
    color: '#EC4899',
  },
  suno: {
    id: 'suno',
    name: 'Suno',
    category: 'music',
    icon: 'music',
    color: '#FFB800',
  },
  udio: {
    id: 'udio',
    name: 'Udio',
    category: 'music',
    icon: 'music',
    color: '#A855F7',
  },
  runway: {
    id: 'runway',
    name: 'Runway',
    category: 'video',
    icon: 'video',
    color: '#3B82F6',
  },
  pika: {
    id: 'pika',
    name: 'Pika',
    category: 'video',
    icon: 'video',
    color: '#F472B6',
  },
  higgsfield: {
    id: 'higgsfield',
    name: 'Higgsfield',
    category: 'video',
    icon: 'video',
    color: '#22D3EE',
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    category: 'text',
    icon: 'message-square',
    color: '#10B981',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    category: 'text',
    icon: 'message-square',
    color: '#D97706',
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
    category: 'text',
    icon: 'help-circle',
    color: '#71717A',
  },
};

// Platform categories for grouping
export const PLATFORM_CATEGORIES: Record<PlatformCategory, Platform[]> = {
  image: ['midjourney', 'dalle', 'stable-diffusion', 'leonardo', 'flux'],
  music: ['suno', 'udio'],
  video: ['runway', 'pika', 'higgsfield'],
  text: ['chatgpt', 'claude'],
};

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  autoDetectPlatform: true,
  showFloatingToolbar: true,
  defaultMode: 'enhance',
  theme: 'dark',
};

// API Configuration
export const CLAUDE_API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
export const CLAUDE_MODEL = 'claude-3-5-haiku-20241022'; // Fast model for quick responses
export const MAX_TOKENS = 512; // Reduced for faster responses

// Storage Keys
export const STORAGE_KEYS = {
  API_KEY: 'refyn_api_key',
  TASTE_PROFILE: 'refyn_taste_profile',
  PROMPT_HISTORY: 'refyn_prompt_history',
  SAVED_PROMPTS: 'refyn_saved_prompts',
  LINEAGE_TREE: 'refyn_lineage_tree',
  SETTINGS: 'refyn_settings',
  LAST_PLATFORM: 'refyn_last_platform',
  LAST_MODE: 'refyn_last_mode',
  USER_PREFERENCES: 'refyn_user_preferences',
  LAST_PRESET: 'refyn_last_preset',

  // CTAD Integration - Process Capture
  CTAD_SETTINGS: 'refyn_ctad_settings',
  CONTRIBUTOR_ID: 'refyn_contributor_id',
  CONTRIBUTOR_STATS: 'refyn_contributor_stats',
  CONTRIBUTION_CONSENT: 'refyn_contribution_consent',
  CAPTURE_SESSION: 'refyn_capture_session',
  PENDING_SUBMISSIONS: 'refyn_pending_submissions',
} as const;

// CTAD API Configuration
export const CTAD_API_URL = 'http://localhost:3001/api/process-declaration';

// Contributor Tier Thresholds
export const TIER_THRESHOLDS = {
  EXPLORER: { min: 0, max: 99 },
  CURATOR: { min: 100, max: 499 },
  TASTEMAKER: { min: 500, max: 1999 },
  ORACLE: { min: 2000, max: Infinity },
} as const;

export type ContributorTier = 'explorer' | 'curator' | 'tastemaker' | 'oracle';

// UI Constants
export const POPUP_DIMENSIONS = {
  width: 480,
  height: 600,
};

// Optimization Mode Labels
export const MODE_LABELS: Record<string, { label: string; description: string }> = {
  enhance: {
    label: 'Enhance',
    description: 'Improve clarity and detail',
  },
  expand: {
    label: 'Expand',
    description: 'Add more descriptive elements',
  },
  style: {
    label: 'Style+',
    description: 'Add artistic style references',
  },
  params: {
    label: 'Params',
    description: 'Add platform-specific parameters',
  },
  crazy: {
    label: 'Crazy',
    description: 'Hidden platform tricks & magic triggers',
  },
};

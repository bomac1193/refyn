/**
 * Taste Gamification System
 *
 * Provides XP, tiers, achievements, streaks, and discovery tracking
 * to incentivize continuous taste profile training beyond the basic 150 threshold.
 */

// Storage keys
const GAMIFICATION_KEY = 'refyn_taste_gamification';

// =====================================================
// TIER SYSTEM - Progressive ranks with unique names
// =====================================================
export interface TasteTier {
  id: string;
  name: string;
  emoji: string;
  minXP: number;
  maxXP: number;
  color: string;
  description: string;
  perks: string[];
}

export const TASTE_TIERS: TasteTier[] = [
  {
    id: 'novice',
    name: 'Novice',
    emoji: '🌱',
    minXP: 0,
    maxXP: 99,
    color: '#6B7280', // gray
    description: 'Just getting started',
    perks: ['Basic taste recognition'],
  },
  {
    id: 'apprentice',
    name: 'Apprentice',
    emoji: '🎨',
    minXP: 100,
    maxXP: 299,
    color: '#10B981', // emerald
    description: 'Learning the basics',
    perks: ['Basic taste recognition', 'Keyword avoidance'],
  },
  {
    id: 'artisan',
    name: 'Artisan',
    emoji: '⚒️',
    minXP: 300,
    maxXP: 599,
    color: '#3B82F6', // blue
    description: 'Developing good taste',
    perks: ['Refined suggestions', 'Style preferences', 'Negative filtering'],
  },
  {
    id: 'connoisseur',
    name: 'Connoisseur',
    emoji: '🍷',
    minXP: 600,
    maxXP: 999,
    color: '#8B5CF6', // violet
    description: 'Excellent taste recognition',
    perks: ['Deep personalization', 'Artist preferences', 'Mood matching'],
  },
  {
    id: 'virtuoso',
    name: 'Virtuoso',
    emoji: '🎭',
    minXP: 1000,
    maxXP: 1999,
    color: '#EC4899', // pink
    description: 'Masterful aesthetic sense',
    perks: ['All features unlocked', 'Predictive suggestions', 'Cross-style insights'],
  },
  {
    id: 'sage',
    name: 'Sage',
    emoji: '🔮',
    minXP: 2000,
    maxXP: 4999,
    color: '#F59E0B', // amber
    description: 'Profound aesthetic wisdom',
    perks: ['Sage-level personalization', 'Nuanced combinations', 'Subtle variations'],
  },
  {
    id: 'oracle',
    name: 'Oracle',
    emoji: '👁️',
    minXP: 5000,
    maxXP: 9999,
    color: '#06B6D4', // cyan
    description: 'Sees patterns others cannot',
    perks: ['Oracle-tier predictions', 'Genre-crossing insights', 'Avant-garde suggestions'],
  },
  {
    id: 'transcendent',
    name: 'Transcendent',
    emoji: '✨',
    minXP: 10000,
    maxXP: Infinity,
    color: '#FFD700', // gold
    description: 'Beyond categorization',
    perks: ['Maximum personalization', 'All achievements unlocked', 'Legendary status'],
  },
];

// =====================================================
// XP REWARDS - Points for various actions
// =====================================================
export const XP_REWARDS = {
  // Rating actions
  like: 10,
  dislike: 8, // Dislikes are valuable too - they train negative space
  delete: 5,
  regenerate: 3,

  // Engagement actions
  save_prompt: 15,
  use_prompt: 5, // Copy/insert
  refine: 3, // Each refinement

  // Discovery actions
  discover_new_artist: 25, // First time seeing an artist in liked prompt
  discover_new_style: 20, // First time liking a specific style
  discover_new_theme: 15, // First time liking a theme

  // Streak bonuses
  daily_streak_bonus: 10, // Per day in streak
  weekly_milestone: 50, // Completing a week
  monthly_milestone: 200, // Completing a month

  // Achievement bonuses (one-time)
  achievement_common: 25,
  achievement_uncommon: 50,
  achievement_rare: 100,
  achievement_epic: 250,
  achievement_legendary: 500,
};

// =====================================================
// ACHIEVEMENTS SYSTEM
// =====================================================
export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  condition: (stats: GamificationStats) => boolean;
  progress?: (stats: GamificationStats) => { current: number; target: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Rating milestones
  {
    id: 'first_rating',
    name: 'First Taste',
    emoji: '👅',
    description: 'Rate your first output',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.totalRatings >= 1,
  },
  {
    id: 'ten_ratings',
    name: 'Developing Palette',
    emoji: '🎨',
    description: 'Rate 10 outputs',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.totalRatings >= 10,
    progress: (s) => ({ current: Math.min(s.totalRatings, 10), target: 10 }),
  },
  {
    id: 'fifty_ratings',
    name: 'Taste Trained',
    emoji: '🧠',
    description: 'Rate 50 outputs',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.totalRatings >= 50,
    progress: (s) => ({ current: Math.min(s.totalRatings, 50), target: 50 }),
  },
  {
    id: 'hundred_ratings',
    name: 'Refined Palate',
    emoji: '🍷',
    description: 'Rate 100 outputs',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.totalRatings >= 100,
    progress: (s) => ({ current: Math.min(s.totalRatings, 100), target: 100 }),
  },
  {
    id: 'five_hundred_ratings',
    name: 'Aesthetic Authority',
    emoji: '👑',
    description: 'Rate 500 outputs',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.totalRatings >= 500,
    progress: (s) => ({ current: Math.min(s.totalRatings, 500), target: 500 }),
  },
  {
    id: 'thousand_ratings',
    name: 'Taste Sage',
    emoji: '🔮',
    description: 'Rate 1000 outputs',
    rarity: 'epic',
    xpReward: XP_REWARDS.achievement_epic,
    condition: (s) => s.totalRatings >= 1000,
    progress: (s) => ({ current: Math.min(s.totalRatings, 1000), target: 1000 }),
  },

  // Streak achievements
  {
    id: 'three_day_streak',
    name: 'Getting Started',
    emoji: '🔥',
    description: '3-day rating streak',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.longestStreak >= 3,
  },
  {
    id: 'week_streak',
    name: 'Week Warrior',
    emoji: '🗓️',
    description: '7-day rating streak',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.longestStreak >= 7,
    progress: (s) => ({ current: Math.min(s.longestStreak, 7), target: 7 }),
  },
  {
    id: 'month_streak',
    name: 'Monthly Maven',
    emoji: '📅',
    description: '30-day rating streak',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.longestStreak >= 30,
    progress: (s) => ({ current: Math.min(s.longestStreak, 30), target: 30 }),
  },
  {
    id: 'hundred_day_streak',
    name: 'Centurion',
    emoji: '💯',
    description: '100-day rating streak',
    rarity: 'epic',
    xpReward: XP_REWARDS.achievement_epic,
    condition: (s) => s.longestStreak >= 100,
    progress: (s) => ({ current: Math.min(s.longestStreak, 100), target: 100 }),
  },

  // Discovery achievements
  {
    id: 'first_artist',
    name: 'Art Explorer',
    emoji: '🖼️',
    description: 'Discover your first artist preference',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.artistsDiscovered >= 1,
  },
  {
    id: 'ten_artists',
    name: 'Gallery Walker',
    emoji: '🏛️',
    description: 'Discover 10 artist preferences',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.artistsDiscovered >= 10,
    progress: (s) => ({ current: Math.min(s.artistsDiscovered, 10), target: 10 }),
  },
  {
    id: 'twenty_five_artists',
    name: 'Curator',
    emoji: '🎨',
    description: 'Discover 25 artist preferences',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.artistsDiscovered >= 25,
    progress: (s) => ({ current: Math.min(s.artistsDiscovered, 25), target: 25 }),
  },
  {
    id: 'fifty_artists',
    name: 'Art Historian',
    emoji: '📚',
    description: 'Discover 50 artist preferences',
    rarity: 'epic',
    xpReward: XP_REWARDS.achievement_epic,
    condition: (s) => s.artistsDiscovered >= 50,
    progress: (s) => ({ current: Math.min(s.artistsDiscovered, 50), target: 50 }),
  },

  // Style diversity
  {
    id: 'five_styles',
    name: 'Style Sampler',
    emoji: '🎭',
    description: 'Like prompts with 5 different styles',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.stylesDiscovered >= 5,
  },
  {
    id: 'fifteen_styles',
    name: 'Style Chameleon',
    emoji: '🦎',
    description: 'Like prompts with 15 different styles',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.stylesDiscovered >= 15,
    progress: (s) => ({ current: Math.min(s.stylesDiscovered, 15), target: 15 }),
  },
  {
    id: 'thirty_styles',
    name: 'Omni-Aesthetic',
    emoji: '🌈',
    description: 'Like prompts with 30 different styles',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.stylesDiscovered >= 30,
    progress: (s) => ({ current: Math.min(s.stylesDiscovered, 30), target: 30 }),
  },

  // Negative feedback (valuable for training)
  {
    id: 'first_dislike',
    name: 'Quality Control',
    emoji: '🚫',
    description: 'Dislike your first output',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.totalDislikes >= 1,
  },
  {
    id: 'fifty_dislikes',
    name: 'Discerning Eye',
    emoji: '👁️',
    description: 'Dislike 50 outputs (helps train what to avoid)',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.totalDislikes >= 50,
    progress: (s) => ({ current: Math.min(s.totalDislikes, 50), target: 50 }),
  },
  {
    id: 'critical_eye',
    name: 'Critical Eye',
    emoji: '🧐',
    description: 'Dislike 100 outputs (excellent negative training)',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.totalDislikes >= 100,
    progress: (s) => ({ current: Math.min(s.totalDislikes, 100), target: 100 }),
  },

  // Balance achievement
  {
    id: 'balanced_feedback',
    name: 'Balanced Critic',
    emoji: '⚖️',
    description: 'Have at least 50 likes AND 50 dislikes',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.totalLikes >= 50 && s.totalDislikes >= 50,
  },

  // Prompts saved
  {
    id: 'first_save',
    name: 'Collector',
    emoji: '⭐',
    description: 'Save your first prompt',
    rarity: 'common',
    xpReward: XP_REWARDS.achievement_common,
    condition: (s) => s.promptsSaved >= 1,
  },
  {
    id: 'twenty_five_saves',
    name: 'Library Builder',
    emoji: '📖',
    description: 'Save 25 prompts',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.promptsSaved >= 25,
    progress: (s) => ({ current: Math.min(s.promptsSaved, 25), target: 25 }),
  },
  {
    id: 'hundred_saves',
    name: 'Archivist',
    emoji: '🗃️',
    description: 'Save 100 prompts',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.promptsSaved >= 100,
    progress: (s) => ({ current: Math.min(s.promptsSaved, 100), target: 100 }),
  },

  // Special achievements
  {
    id: 'night_owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Rate 10 outputs between midnight and 5am',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.nightRatings >= 10,
    progress: (s) => ({ current: Math.min(s.nightRatings, 10), target: 10 }),
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    emoji: '🎉',
    description: 'Rate 50 outputs on weekends',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.weekendRatings >= 50,
    progress: (s) => ({ current: Math.min(s.weekendRatings, 50), target: 50 }),
  },

  // Tier achievements
  {
    id: 'reach_artisan',
    name: 'Rising Artisan',
    emoji: '⚒️',
    description: 'Reach Artisan tier',
    rarity: 'uncommon',
    xpReward: XP_REWARDS.achievement_uncommon,
    condition: (s) => s.totalXP >= 300,
  },
  {
    id: 'reach_connoisseur',
    name: 'True Connoisseur',
    emoji: '🍷',
    description: 'Reach Connoisseur tier',
    rarity: 'rare',
    xpReward: XP_REWARDS.achievement_rare,
    condition: (s) => s.totalXP >= 600,
  },
  {
    id: 'reach_virtuoso',
    name: 'Virtuoso Ascended',
    emoji: '🎭',
    description: 'Reach Virtuoso tier',
    rarity: 'epic',
    xpReward: XP_REWARDS.achievement_epic,
    condition: (s) => s.totalXP >= 1000,
  },
  {
    id: 'reach_oracle',
    name: 'Oracle Awakened',
    emoji: '👁️',
    description: 'Reach Oracle tier',
    rarity: 'legendary',
    xpReward: XP_REWARDS.achievement_legendary,
    condition: (s) => s.totalXP >= 5000,
  },
  {
    id: 'reach_transcendent',
    name: 'Transcendence',
    emoji: '✨',
    description: 'Reach Transcendent tier',
    rarity: 'legendary',
    xpReward: XP_REWARDS.achievement_legendary,
    condition: (s) => s.totalXP >= 10000,
  },
];

// =====================================================
// GAMIFICATION STATE
// =====================================================
export interface GamificationStats {
  // Core XP
  totalXP: number;

  // Rating stats
  totalRatings: number;
  totalLikes: number;
  totalDislikes: number;
  totalDeletes: number;

  // Engagement
  promptsRefined: number;
  promptsSaved: number;
  promptsUsed: number;

  // Discovery
  artistsDiscovered: number;
  stylesDiscovered: number;
  themesDiscovered: number;
  discoveredArtists: string[]; // Names of discovered artists
  discoveredStyles: string[];
  discoveredThemes: string[];

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date string

  // Time-based
  nightRatings: number; // Between midnight and 5am
  weekendRatings: number;

  // Achievements
  unlockedAchievements: string[]; // Achievement IDs
  pendingAchievementRewards: string[]; // Newly unlocked, not yet shown

  // Meta
  createdAt: string;
  lastUpdated: string;
}

const DEFAULT_STATS: GamificationStats = {
  totalXP: 0,
  totalRatings: 0,
  totalLikes: 0,
  totalDislikes: 0,
  totalDeletes: 0,
  promptsRefined: 0,
  promptsSaved: 0,
  promptsUsed: 0,
  artistsDiscovered: 0,
  stylesDiscovered: 0,
  themesDiscovered: 0,
  discoveredArtists: [],
  discoveredStyles: [],
  discoveredThemes: [],
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  nightRatings: 0,
  weekendRatings: 0,
  unlockedAchievements: [],
  pendingAchievementRewards: [],
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
};

// =====================================================
// GAMIFICATION FUNCTIONS
// =====================================================

/**
 * Get current gamification stats from storage
 */
export async function getGamificationStats(): Promise<GamificationStats> {
  try {
    const result = await chrome.storage.local.get(GAMIFICATION_KEY);
    return result[GAMIFICATION_KEY] || { ...DEFAULT_STATS };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

/**
 * Save gamification stats to storage
 */
async function saveGamificationStats(stats: GamificationStats): Promise<void> {
  stats.lastUpdated = new Date().toISOString();
  await chrome.storage.local.set({ [GAMIFICATION_KEY]: stats });
}

/**
 * Get tier for given XP amount
 */
export function getTierForXP(xp: number): TasteTier {
  for (let i = TASTE_TIERS.length - 1; i >= 0; i--) {
    if (xp >= TASTE_TIERS[i].minXP) {
      return TASTE_TIERS[i];
    }
  }
  return TASTE_TIERS[0];
}

/**
 * Get progress to next tier
 */
export function getProgressToNextTier(xp: number): { current: number; needed: number; percent: number; nextTier: TasteTier | null } {
  const currentTier = getTierForXP(xp);
  const currentIndex = TASTE_TIERS.findIndex(t => t.id === currentTier.id);

  if (currentIndex >= TASTE_TIERS.length - 1) {
    // At max tier
    return { current: xp, needed: xp, percent: 100, nextTier: null };
  }

  const nextTier = TASTE_TIERS[currentIndex + 1];
  const xpInCurrentTier = xp - currentTier.minXP;
  const xpNeededForNext = nextTier.minXP - currentTier.minXP;
  const percent = Math.min(100, Math.floor((xpInCurrentTier / xpNeededForNext) * 100));

  return { current: xpInCurrentTier, needed: xpNeededForNext, percent, nextTier };
}

/**
 * Update streak based on activity
 */
function updateStreak(stats: GamificationStats): GamificationStats {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = stats.lastActiveDate;

  if (!lastActive) {
    // First activity
    stats.currentStreak = 1;
    stats.longestStreak = Math.max(stats.longestStreak, 1);
  } else if (lastActive === today) {
    // Already active today, no change
  } else {
    const lastDate = new Date(lastActive);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      stats.currentStreak += 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);

      // Streak bonuses
      stats.totalXP += XP_REWARDS.daily_streak_bonus;

      // Weekly milestone
      if (stats.currentStreak % 7 === 0) {
        stats.totalXP += XP_REWARDS.weekly_milestone;
      }

      // Monthly milestone
      if (stats.currentStreak % 30 === 0) {
        stats.totalXP += XP_REWARDS.monthly_milestone;
      }
    } else if (diffDays > 1) {
      // Streak broken
      stats.currentStreak = 1;
    }
  }

  stats.lastActiveDate = today;
  return stats;
}

/**
 * Check and unlock achievements
 */
function checkAchievements(stats: GamificationStats): GamificationStats {
  for (const achievement of ACHIEVEMENTS) {
    if (!stats.unlockedAchievements.includes(achievement.id)) {
      if (achievement.condition(stats)) {
        stats.unlockedAchievements.push(achievement.id);
        stats.pendingAchievementRewards.push(achievement.id);
        stats.totalXP += achievement.xpReward;
      }
    }
  }
  return stats;
}

/**
 * Check if current time is night (midnight to 5am)
 */
function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour < 5;
}

/**
 * Check if current day is weekend
 */
function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

// =====================================================
// PUBLIC API - RECORD ACTIONS
// =====================================================

/**
 * Record a like action
 */
export async function recordLike(promptContent?: string): Promise<{ xpGained: number; newAchievements: string[] }> {
  let stats = await getGamificationStats();
  const oldXP = stats.totalXP;
  const oldAchievements = [...stats.unlockedAchievements];

  stats.totalLikes += 1;
  stats.totalRatings += 1;
  stats.totalXP += XP_REWARDS.like;

  // Time-based tracking
  if (isNightTime()) stats.nightRatings += 1;
  if (isWeekend()) stats.weekendRatings += 1;

  // Discovery tracking from prompt content
  if (promptContent) {
    stats = trackDiscoveries(stats, promptContent);
  }

  stats = updateStreak(stats);
  stats = checkAchievements(stats);

  await saveGamificationStats(stats);

  return {
    xpGained: stats.totalXP - oldXP,
    newAchievements: stats.unlockedAchievements.filter(a => !oldAchievements.includes(a)),
  };
}

/**
 * Record a dislike action
 */
export async function recordDislike(): Promise<{ xpGained: number; newAchievements: string[] }> {
  let stats = await getGamificationStats();
  const oldXP = stats.totalXP;
  const oldAchievements = [...stats.unlockedAchievements];

  stats.totalDislikes += 1;
  stats.totalRatings += 1;
  stats.totalXP += XP_REWARDS.dislike;

  if (isNightTime()) stats.nightRatings += 1;
  if (isWeekend()) stats.weekendRatings += 1;

  stats = updateStreak(stats);
  stats = checkAchievements(stats);

  await saveGamificationStats(stats);

  return {
    xpGained: stats.totalXP - oldXP,
    newAchievements: stats.unlockedAchievements.filter(a => !oldAchievements.includes(a)),
  };
}

/**
 * Record a delete action
 */
export async function recordDelete(): Promise<{ xpGained: number; newAchievements: string[] }> {
  let stats = await getGamificationStats();
  const oldXP = stats.totalXP;
  const oldAchievements = [...stats.unlockedAchievements];

  stats.totalDeletes += 1;
  stats.totalRatings += 1;
  stats.totalXP += XP_REWARDS.delete;

  stats = updateStreak(stats);
  stats = checkAchievements(stats);

  await saveGamificationStats(stats);

  return {
    xpGained: stats.totalXP - oldXP,
    newAchievements: stats.unlockedAchievements.filter(a => !oldAchievements.includes(a)),
  };
}

/**
 * Record saving a prompt
 */
export async function recordSavePrompt(): Promise<{ xpGained: number; newAchievements: string[] }> {
  let stats = await getGamificationStats();
  const oldXP = stats.totalXP;
  const oldAchievements = [...stats.unlockedAchievements];

  stats.promptsSaved += 1;
  stats.totalXP += XP_REWARDS.save_prompt;

  stats = updateStreak(stats);
  stats = checkAchievements(stats);

  await saveGamificationStats(stats);

  return {
    xpGained: stats.totalXP - oldXP,
    newAchievements: stats.unlockedAchievements.filter(a => !oldAchievements.includes(a)),
  };
}

/**
 * Record using a prompt (copy/insert)
 */
export async function recordUsePrompt(): Promise<void> {
  let stats = await getGamificationStats();
  stats.promptsUsed += 1;
  stats.totalXP += XP_REWARDS.use_prompt;
  stats = updateStreak(stats);
  stats = checkAchievements(stats);
  await saveGamificationStats(stats);
}

/**
 * Record refining a prompt
 */
export async function recordRefine(): Promise<void> {
  let stats = await getGamificationStats();
  stats.promptsRefined += 1;
  stats.totalXP += XP_REWARDS.refine;
  stats = updateStreak(stats);
  stats = checkAchievements(stats);
  await saveGamificationStats(stats);
}

/**
 * Track discoveries from prompt content
 */
function trackDiscoveries(stats: GamificationStats, promptContent: string): GamificationStats {
  const lowerContent = promptContent.toLowerCase();

  // Style keywords to track
  const styleKeywords = [
    'surreal', 'minimalist', 'brutalist', 'ethereal', 'gothic', 'cyberpunk',
    'vaporwave', 'afrofuturist', 'impressionist', 'expressionist', 'abstract',
    'photorealistic', 'cinematic', 'editorial', 'documentary', 'conceptual',
    'mixed media', 'collage', 'textile', 'installation', 'performance',
  ];

  // Theme keywords to track
  const themeKeywords = [
    'diaspora', 'identity', 'colonialism', 'spirituality', 'mythology',
    'memory', 'trauma', 'healing', 'migration', 'urban', 'nature',
    'technology', 'body', 'feminism', 'community', 'resistance',
  ];

  // Check for new styles
  for (const style of styleKeywords) {
    if (lowerContent.includes(style) && !stats.discoveredStyles.includes(style)) {
      stats.discoveredStyles.push(style);
      stats.stylesDiscovered += 1;
      stats.totalXP += XP_REWARDS.discover_new_style;
    }
  }

  // Check for new themes
  for (const theme of themeKeywords) {
    if (lowerContent.includes(theme) && !stats.discoveredThemes.includes(theme)) {
      stats.discoveredThemes.push(theme);
      stats.themesDiscovered += 1;
      stats.totalXP += XP_REWARDS.discover_new_theme;
    }
  }

  return stats;
}

/**
 * Record discovering a new artist (called when artist is in liked prompt)
 */
export async function recordArtistDiscovery(artistName: string): Promise<void> {
  let stats = await getGamificationStats();

  if (!stats.discoveredArtists.includes(artistName)) {
    stats.discoveredArtists.push(artistName);
    stats.artistsDiscovered += 1;
    stats.totalXP += XP_REWARDS.discover_new_artist;
    stats = checkAchievements(stats);
    await saveGamificationStats(stats);
  }
}

/**
 * Get unlocked achievements
 */
export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const stats = await getGamificationStats();
  return ACHIEVEMENTS.filter(a => stats.unlockedAchievements.includes(a.id));
}

/**
 * Get locked achievements with progress
 */
export async function getLockedAchievements(): Promise<Array<Achievement & { progressInfo?: { current: number; target: number } }>> {
  const stats = await getGamificationStats();
  return ACHIEVEMENTS
    .filter(a => !stats.unlockedAchievements.includes(a.id))
    .map(a => ({
      ...a,
      progressInfo: a.progress ? a.progress(stats) : undefined,
    }));
}

/**
 * Clear pending achievement rewards (after showing to user)
 */
export async function clearPendingAchievements(): Promise<string[]> {
  const stats = await getGamificationStats();
  const pending = [...stats.pendingAchievementRewards];
  stats.pendingAchievementRewards = [];
  await saveGamificationStats(stats);
  return pending;
}

/**
 * Get leaderboard-style summary
 */
export async function getLeaderboardSummary(): Promise<{
  tier: TasteTier;
  xp: number;
  nextTierProgress: { current: number; needed: number; percent: number; nextTier: TasteTier | null };
  stats: {
    totalRatings: number;
    currentStreak: number;
    longestStreak: number;
    artistsDiscovered: number;
    achievementsUnlocked: number;
    totalAchievements: number;
  };
  topAchievements: Achievement[];
}> {
  const stats = await getGamificationStats();
  const tier = getTierForXP(stats.totalXP);
  const nextTierProgress = getProgressToNextTier(stats.totalXP);

  // Get top 3 rarest unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS.filter(a => stats.unlockedAchievements.includes(a.id));
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const topAchievements = unlockedAchievements
    .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity])
    .slice(0, 3);

  return {
    tier,
    xp: stats.totalXP,
    nextTierProgress,
    stats: {
      totalRatings: stats.totalRatings,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      artistsDiscovered: stats.artistsDiscovered,
      achievementsUnlocked: stats.unlockedAchievements.length,
      totalAchievements: ACHIEVEMENTS.length,
    },
    topAchievements,
  };
}

/**
 * Migrate existing stats from deepLearning to gamification
 * Call this once to seed gamification from existing data
 */
export async function migrateFromDeepLearning(existingStats: {
  totalLikes?: number;
  totalDislikes?: number;
  totalDeletes?: number;
}): Promise<void> {
  let stats = await getGamificationStats();

  // Only migrate if we haven't already
  if (stats.totalRatings === 0) {
    const likes = existingStats.totalLikes || 0;
    const dislikes = existingStats.totalDislikes || 0;
    const deletes = existingStats.totalDeletes || 0;

    stats.totalLikes = likes;
    stats.totalDislikes = dislikes;
    stats.totalDeletes = deletes;
    stats.totalRatings = likes + dislikes + deletes;

    // Calculate retroactive XP
    stats.totalXP = (likes * XP_REWARDS.like) + (dislikes * XP_REWARDS.dislike) + (deletes * XP_REWARDS.delete);

    stats = checkAchievements(stats);
    await saveGamificationStats(stats);
  }
}

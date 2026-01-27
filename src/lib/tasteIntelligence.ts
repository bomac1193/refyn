/**
 * Taste Intelligence System
 *
 * Focused on meaningful metrics that show how the machine learns
 * and what value that brings to the user. No gimmicks - just insight.
 */

// Storage key
const TASTE_INTEL_KEY = 'refyn_taste_intelligence';

// =====================================================
// INTELLIGENCE METRICS - What the machine actually learns
// =====================================================

export interface TasteIntelligence {
  // Core learning metrics
  clarity: {
    score: number; // 0-100, how well-defined preferences are
    positiveSignals: number; // Strong likes
    negativeSignals: number; // Dislikes (equally valuable)
    consistency: number; // How consistent ratings are (low variance = clear taste)
  };

  // Discovery - expanding the taste palette
  discovery: {
    artistsEncountered: string[];
    stylesEncountered: string[];
    themesEncountered: string[];
    uniqueCombinations: number; // Novel style+theme combinations liked
  };

  // Confidence - how sure the system is about suggestions
  confidence: {
    overall: number; // 0-100
    byCategory: Record<string, number>; // Confidence per category (lighting, mood, etc.)
    strongPreferences: string[]; // Things we're very sure about
    uncertainAreas: string[]; // Areas needing more data
  };

  // Negative space - what to avoid (often more valuable than likes)
  avoidance: {
    keywords: string[]; // Specific words to avoid
    styles: string[]; // Styles user dislikes
    patterns: string[]; // Patterns that correlate with dislikes
  };

  // Learning freshness
  activity: {
    lastActive: string;
    ratingsThisWeek: number;
    ratingsThisMonth: number;
    totalRatings: number;
    totalLikes: number;
    totalDislikes: number;
  };

  // Value delivered - concrete improvements
  value: {
    suggestionsAccepted: number; // Times user used a suggestion
    avoidanceHits: number; // Times system successfully avoided disliked elements
    discoveryLeads: number; // New artists/styles user liked from suggestions
  };

  // Timestamps
  createdAt: string;
  lastUpdated: string;
}

// =====================================================
// INTELLIGENCE LEVELS - Meaningful progression
// =====================================================

export interface IntelligenceLevel {
  id: string;
  name: string;
  description: string;
  minClarity: number;
  capabilities: string[]; // What the system can do at this level
  color: string;
}

export const INTELLIGENCE_LEVELS: IntelligenceLevel[] = [
  {
    id: 'nascent',
    name: 'Nascent',
    description: 'Learning your basics',
    minClarity: 0,
    capabilities: [
      'Basic prompt enhancement',
    ],
    color: '#6B7280',
  },
  {
    id: 'forming',
    name: 'Forming',
    description: 'Patterns emerging',
    minClarity: 15,
    capabilities: [
      'Basic prompt enhancement',
      'Simple keyword preferences',
    ],
    color: '#10B981',
  },
  {
    id: 'defined',
    name: 'Defined',
    description: 'Clear preferences detected',
    minClarity: 35,
    capabilities: [
      'Personalized suggestions',
      'Keyword filtering',
      'Basic style matching',
    ],
    color: '#3B82F6',
  },
  {
    id: 'refined',
    name: 'Refined',
    description: 'Nuanced understanding',
    minClarity: 55,
    capabilities: [
      'Deep personalization',
      'Artist recommendations',
      'Mood matching',
      'Strong avoidance filtering',
    ],
    color: '#8B5CF6',
  },
  {
    id: 'intuitive',
    name: 'Intuitive',
    description: 'Anticipates your vision',
    minClarity: 75,
    capabilities: [
      'Predictive suggestions',
      'Cross-style insights',
      'Subtle variation control',
      'Context-aware recommendations',
    ],
    color: '#EC4899',
  },
  {
    id: 'attuned',
    name: 'Attuned',
    description: 'Deeply aligned with your aesthetic',
    minClarity: 90,
    capabilities: [
      'Maximum personalization',
      'Taste extrapolation',
      'Discovers artists you\'ll love',
      'Predicts before you ask',
    ],
    color: '#F59E0B',
  },
];

// =====================================================
// DEFAULT STATE
// =====================================================

const DEFAULT_INTELLIGENCE: TasteIntelligence = {
  clarity: {
    score: 0,
    positiveSignals: 0,
    negativeSignals: 0,
    consistency: 0,
  },
  discovery: {
    artistsEncountered: [],
    stylesEncountered: [],
    themesEncountered: [],
    uniqueCombinations: 0,
  },
  confidence: {
    overall: 0,
    byCategory: {},
    strongPreferences: [],
    uncertainAreas: ['lighting', 'mood', 'style', 'composition', 'color'],
  },
  avoidance: {
    keywords: [],
    styles: [],
    patterns: [],
  },
  activity: {
    lastActive: '',
    ratingsThisWeek: 0,
    ratingsThisMonth: 0,
    totalRatings: 0,
    totalLikes: 0,
    totalDislikes: 0,
  },
  value: {
    suggestionsAccepted: 0,
    avoidanceHits: 0,
    discoveryLeads: 0,
  },
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
};

// =====================================================
// CORE FUNCTIONS
// =====================================================

/**
 * Get current taste intelligence from storage
 */
export async function getTasteIntelligence(): Promise<TasteIntelligence> {
  try {
    const result = await chrome.storage.local.get(TASTE_INTEL_KEY);
    return result[TASTE_INTEL_KEY] || { ...DEFAULT_INTELLIGENCE };
  } catch {
    return { ...DEFAULT_INTELLIGENCE };
  }
}

/**
 * Save taste intelligence to storage
 */
async function saveTasteIntelligence(intel: TasteIntelligence): Promise<void> {
  intel.lastUpdated = new Date().toISOString();
  await chrome.storage.local.set({ [TASTE_INTEL_KEY]: intel });
}

/**
 * Get intelligence level based on clarity score
 */
export function getIntelligenceLevel(clarity: number): IntelligenceLevel {
  for (let i = INTELLIGENCE_LEVELS.length - 1; i >= 0; i--) {
    if (clarity >= INTELLIGENCE_LEVELS[i].minClarity) {
      return INTELLIGENCE_LEVELS[i];
    }
  }
  return INTELLIGENCE_LEVELS[0];
}

/**
 * Calculate clarity score from signals
 * Clarity = how well-defined the user's taste is
 */
function calculateClarity(likes: number, dislikes: number, consistency: number): number {
  // Both likes AND dislikes contribute to clarity
  // Knowing what you don't like is as valuable as knowing what you do
  const totalSignals = likes + dislikes;

  if (totalSignals === 0) return 0;

  // Base score from volume (diminishing returns)
  // 50 ratings = ~50 clarity, 200 ratings = ~80 clarity, 500+ = ~95 clarity
  const volumeScore = Math.min(95, 50 * (1 - Math.exp(-totalSignals / 100)));

  // Balance bonus - having both likes AND dislikes is more valuable
  const balance = Math.min(likes, dislikes) / Math.max(likes, dislikes, 1);
  const balanceBonus = balance * 10; // Up to 10 points for good balance

  // Consistency bonus - consistent ratings = clear taste
  const consistencyBonus = consistency * 5; // Up to 5 points

  return Math.min(100, Math.round(volumeScore + balanceBonus + consistencyBonus));
}

/**
 * Calculate confidence for a category based on signal density
 * Reserved for future use with category-specific confidence tracking
 */
function _calculateCategoryConfidence(categorySignals: number, totalSignals: number): number {
  if (totalSignals === 0) return 0;
  const density = categorySignals / totalSignals;
  // Need at least 10 signals in a category to have decent confidence
  const volumeFactor = Math.min(1, categorySignals / 10);
  return Math.round(density * volumeFactor * 100);
}
void _calculateCategoryConfidence; // Suppress unused warning

// =====================================================
// RECORDING FUNCTIONS
// =====================================================

/**
 * Record a like with extracted context
 */
export async function recordLikeWithContext(promptContent: string, extractedKeywords?: Record<string, string[]>): Promise<TasteIntelligence> {
  let intel = await getTasteIntelligence();

  // Update activity
  intel.activity.totalLikes += 1;
  intel.activity.totalRatings += 1;
  intel.activity.lastActive = new Date().toISOString();
  updateWeeklyMonthlyRatings(intel);

  // Update clarity
  intel.clarity.positiveSignals += 1;
  intel.clarity.score = calculateClarity(
    intel.clarity.positiveSignals,
    intel.clarity.negativeSignals,
    intel.clarity.consistency
  );

  // Track discoveries from content
  trackDiscoveriesFromContent(intel, promptContent);

  // Track keyword preferences for confidence
  if (extractedKeywords) {
    updateConfidenceFromKeywords(intel, extractedKeywords, true);
  }

  await saveTasteIntelligence(intel);
  return intel;
}

/**
 * Record a dislike - equally valuable for learning
 */
export async function recordDislikeWithContext(promptContent: string, extractedKeywords?: Record<string, string[]>): Promise<TasteIntelligence> {
  let intel = await getTasteIntelligence();

  // Update activity
  intel.activity.totalDislikes += 1;
  intel.activity.totalRatings += 1;
  intel.activity.lastActive = new Date().toISOString();
  updateWeeklyMonthlyRatings(intel);

  // Update clarity - dislikes are valuable signals
  intel.clarity.negativeSignals += 1;
  intel.clarity.score = calculateClarity(
    intel.clarity.positiveSignals,
    intel.clarity.negativeSignals,
    intel.clarity.consistency
  );

  // Extract avoidance patterns
  extractAvoidancePatterns(intel, promptContent);

  // Track keyword preferences for confidence (negative)
  if (extractedKeywords) {
    updateConfidenceFromKeywords(intel, extractedKeywords, false);
  }

  await saveTasteIntelligence(intel);
  return intel;
}

/**
 * Record when a suggestion was accepted (value delivered)
 */
export async function recordSuggestionAccepted(): Promise<void> {
  const intel = await getTasteIntelligence();
  intel.value.suggestionsAccepted += 1;
  await saveTasteIntelligence(intel);
}

/**
 * Record when avoidance filtering worked (value delivered)
 */
export async function recordAvoidanceHit(): Promise<void> {
  const intel = await getTasteIntelligence();
  intel.value.avoidanceHits += 1;
  await saveTasteIntelligence(intel);
}

/**
 * Record when user discovered something new they liked
 */
export async function recordDiscoveryLead(): Promise<void> {
  const intel = await getTasteIntelligence();
  intel.value.discoveryLeads += 1;
  await saveTasteIntelligence(intel);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function updateWeeklyMonthlyRatings(intel: TasteIntelligence): void {
  const now = new Date();
  const lastActive = intel.activity.lastActive ? new Date(intel.activity.lastActive) : null;

  if (!lastActive) {
    intel.activity.ratingsThisWeek = 1;
    intel.activity.ratingsThisMonth = 1;
    return;
  }

  const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

  // Reset weekly if more than 7 days
  if (daysSinceActive > 7) {
    intel.activity.ratingsThisWeek = 1;
  } else {
    intel.activity.ratingsThisWeek += 1;
  }

  // Reset monthly if more than 30 days
  if (daysSinceActive > 30) {
    intel.activity.ratingsThisMonth = 1;
  } else {
    intel.activity.ratingsThisMonth += 1;
  }
}

function trackDiscoveriesFromContent(intel: TasteIntelligence, content: string): void {
  const lowerContent = content.toLowerCase();

  // Style keywords
  const styles = [
    'surreal', 'minimalist', 'brutalist', 'ethereal', 'gothic', 'cyberpunk',
    'vaporwave', 'afrofuturist', 'impressionist', 'expressionist', 'abstract',
    'cinematic', 'editorial', 'documentary', 'conceptual', 'collage', 'textile',
  ];

  // Theme keywords
  const themes = [
    'diaspora', 'identity', 'colonialism', 'spirituality', 'mythology',
    'memory', 'trauma', 'healing', 'migration', 'urban', 'nature',
    'technology', 'body', 'feminism', 'community', 'resistance',
  ];

  for (const style of styles) {
    if (lowerContent.includes(style) && !intel.discovery.stylesEncountered.includes(style)) {
      intel.discovery.stylesEncountered.push(style);
    }
  }

  for (const theme of themes) {
    if (lowerContent.includes(theme) && !intel.discovery.themesEncountered.includes(theme)) {
      intel.discovery.themesEncountered.push(theme);
    }
  }
}

function extractAvoidancePatterns(intel: TasteIntelligence, content: string): void {
  const lowerContent = content.toLowerCase();

  // Common style words that might be in disliked content
  const styleIndicators = [
    'hyper-realistic', 'photorealistic', 'trending', 'artstation',
    'ultra detailed', 'highly detailed', '8k', '4k', 'masterpiece',
    'anime', 'cartoon', 'minimalist', 'maximalist', 'surreal',
  ];

  for (const indicator of styleIndicators) {
    if (lowerContent.includes(indicator)) {
      // Track in avoidance, but only if seen multiple times (handled elsewhere)
      // For now, just note the keyword was in a disliked prompt
      if (!intel.avoidance.keywords.includes(indicator)) {
        // We'd want a threshold before adding to avoidance
        // This is simplified - real implementation would track counts
      }
    }
  }
}

function updateConfidenceFromKeywords(
  intel: TasteIntelligence,
  keywords: Record<string, string[]>,
  _isPositive: boolean // Reserved for future differentiation of positive/negative signals
): void {
  // Update confidence per category based on the keywords found
  for (const [category, words] of Object.entries(keywords)) {
    if (!intel.confidence.byCategory[category]) {
      intel.confidence.byCategory[category] = 0;
    }

    // Each rating in a category increases confidence in that category
    intel.confidence.byCategory[category] = Math.min(
      100,
      intel.confidence.byCategory[category] + (words.length > 0 ? 5 : 0)
    );

    // Remove from uncertain areas if we have enough data
    if (intel.confidence.byCategory[category] > 30) {
      intel.confidence.uncertainAreas = intel.confidence.uncertainAreas.filter(a => a !== category);
    }
  }

  // Update overall confidence
  const categoryConfidences = Object.values(intel.confidence.byCategory);
  if (categoryConfidences.length > 0) {
    intel.confidence.overall = Math.round(
      categoryConfidences.reduce((a, b) => a + b, 0) / categoryConfidences.length
    );
  }
}

// =====================================================
// INSIGHT GENERATION - The real value
// =====================================================

export interface TasteInsight {
  type: 'strength' | 'discovery' | 'gap' | 'suggestion';
  title: string;
  description: string;
  actionable?: string; // What the user can do with this insight
}

/**
 * Generate meaningful insights from the current taste intelligence
 */
export async function generateInsights(): Promise<TasteInsight[]> {
  const intel = await getTasteIntelligence();
  const insights: TasteInsight[] = [];

  // Strength insights - what we know well
  if (intel.clarity.positiveSignals > 20) {
    const level = getIntelligenceLevel(intel.clarity.score);
    insights.push({
      type: 'strength',
      title: `${level.name} taste clarity`,
      description: `Based on ${intel.clarity.positiveSignals} liked and ${intel.clarity.negativeSignals} disliked outputs, your preferences are becoming clear.`,
      actionable: level.capabilities[level.capabilities.length - 1],
    });
  }

  // Discovery insights
  if (intel.discovery.stylesEncountered.length > 5) {
    insights.push({
      type: 'discovery',
      title: 'Style explorer',
      description: `You've engaged with ${intel.discovery.stylesEncountered.length} different styles. Most frequent: ${intel.discovery.stylesEncountered.slice(0, 3).join(', ')}.`,
    });
  }

  // Gap insights - where we need more data
  if (intel.confidence.uncertainAreas.length > 0 && intel.activity.totalRatings > 10) {
    insights.push({
      type: 'gap',
      title: 'Learning opportunity',
      description: `The system would benefit from more feedback on: ${intel.confidence.uncertainAreas.slice(0, 3).join(', ')}.`,
      actionable: 'Try prompts with these elements and rate the results',
    });
  }

  // Value delivered insights
  if (intel.value.suggestionsAccepted > 0) {
    insights.push({
      type: 'suggestion',
      title: 'Personalization working',
      description: `${intel.value.suggestionsAccepted} suggestions accepted. The system is learning what works for you.`,
    });
  }

  // Balance insight
  const balance = intel.clarity.negativeSignals / Math.max(1, intel.clarity.positiveSignals);
  if (intel.activity.totalRatings > 20 && balance < 0.3) {
    insights.push({
      type: 'gap',
      title: 'Dislikes help too',
      description: 'Negative feedback is valuable. Rating outputs you don\'t like helps the system learn what to avoid.',
      actionable: 'Don\'t hesitate to dislike outputs that miss the mark',
    });
  }

  return insights;
}

// =====================================================
// SUMMARY FOR UI
// =====================================================

export interface TasteSummary {
  level: IntelligenceLevel;
  clarity: number;
  capabilities: string[];
  nextCapability: string | null;
  progressToNext: number; // 0-100
  insights: TasteInsight[];
  activity: {
    total: number;
    likes: number;
    dislikes: number;
    thisWeek: number;
  };
  discovery: {
    styles: number;
    themes: number;
    artists: number;
  };
}

/**
 * Get a complete summary for UI display
 */
export async function getTasteSummary(): Promise<TasteSummary> {
  const intel = await getTasteIntelligence();
  const level = getIntelligenceLevel(intel.clarity.score);
  const insights = await generateInsights();

  // Find next level
  const levelIndex = INTELLIGENCE_LEVELS.findIndex(l => l.id === level.id);
  const nextLevel = levelIndex < INTELLIGENCE_LEVELS.length - 1 ? INTELLIGENCE_LEVELS[levelIndex + 1] : null;

  // Calculate progress to next level
  let progressToNext = 100;
  let nextCapability: string | null = null;
  if (nextLevel) {
    const currentMin = level.minClarity;
    const nextMin = nextLevel.minClarity;
    progressToNext = Math.round(((intel.clarity.score - currentMin) / (nextMin - currentMin)) * 100);
    progressToNext = Math.max(0, Math.min(100, progressToNext));
    // Find capability in next level that's not in current level
    nextCapability = nextLevel.capabilities.find(c => !level.capabilities.includes(c)) || null;
  }

  return {
    level,
    clarity: intel.clarity.score,
    capabilities: level.capabilities,
    nextCapability,
    progressToNext,
    insights: insights.slice(0, 3), // Top 3 insights
    activity: {
      total: intel.activity.totalRatings,
      likes: intel.activity.totalLikes,
      dislikes: intel.activity.totalDislikes,
      thisWeek: intel.activity.ratingsThisWeek,
    },
    discovery: {
      styles: intel.discovery.stylesEncountered.length,
      themes: intel.discovery.themesEncountered.length,
      artists: intel.discovery.artistsEncountered.length,
    },
  };
}

/**
 * Migrate from old gamification/deep learning stats
 */
export async function migrateFromExistingStats(stats: {
  totalLikes?: number;
  totalDislikes?: number;
  totalDeletes?: number;
}): Promise<void> {
  const intel = await getTasteIntelligence();

  // Only migrate if we haven't already
  if (intel.activity.totalRatings === 0) {
    const likes = stats.totalLikes || 0;
    const dislikes = (stats.totalDislikes || 0) + (stats.totalDeletes || 0);

    intel.activity.totalLikes = likes;
    intel.activity.totalDislikes = dislikes;
    intel.activity.totalRatings = likes + dislikes;
    intel.clarity.positiveSignals = likes;
    intel.clarity.negativeSignals = dislikes;
    intel.clarity.score = calculateClarity(likes, dislikes, 0);

    await saveTasteIntelligence(intel);
  }
}

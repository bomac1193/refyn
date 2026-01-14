/**
 * Prompt Quality Analyzer
 *
 * Based on best practices from:
 * - Anthropic's Prompt Engineering & Context Engineering guides
 * - DAIR.AI Prompt Engineering Guide
 * - Key insight: "Prompting is persuasion, not programming"
 */

import type { Platform, PlatformCategory } from '@/shared/types';
import { PLATFORMS } from '@/shared/constants';

// Quality dimensions based on research
export interface PromptQuality {
  clarity: number;        // 0-100: Clear, direct, no ambiguity
  specificity: number;    // 0-100: Concrete details vs vague
  structure: number;      // 0-100: Well-organized, uses separators
  context: number;        // 0-100: Provides necessary background
  actionability: number;  // 0-100: Clear desired outcome
  overall: number;        // 0-100: Weighted average
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface PromptAnalysis {
  quality: PromptQuality;
  issues: PromptIssue[];
  suggestions: string[];
  strengths: string[];
  wordCount: number;
  estimatedTokens: number;
}

export interface PromptIssue {
  type: 'clarity' | 'specificity' | 'structure' | 'context' | 'actionability';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}

// Common vague words that reduce prompt effectiveness
const VAGUE_WORDS = [
  'nice', 'good', 'cool', 'awesome', 'beautiful', 'pretty', 'interesting',
  'something', 'somehow', 'somewhere', 'anything', 'stuff', 'things',
  'maybe', 'probably', 'kind of', 'sort of', 'a bit', 'a little',
  'very', 'really', 'quite', 'extremely', 'absolutely', // empty intensifiers
  'etc', 'and so on', 'and more',
];

// Specific descriptors that improve prompts
const SPECIFIC_DESCRIPTORS: Record<PlatformCategory, string[]> = {
  image: [
    'lighting', 'composition', 'angle', 'perspective', 'focal length',
    'depth of field', 'color palette', 'texture', 'material', 'atmosphere',
    'style', 'medium', 'resolution', '4k', '8k', 'hdr', 'ray tracing',
    'photorealistic', 'cinematic', 'dramatic', 'soft', 'harsh', 'ambient',
  ],
  music: [
    'bpm', 'tempo', 'key', 'minor', 'major', 'genre', 'instrument',
    'vocals', 'beat', 'melody', 'harmony', 'bass', 'drums', 'synth',
    'reverb', 'lo-fi', 'crisp', 'layered', 'minimal', 'atmospheric',
  ],
  video: [
    'camera', 'movement', 'pan', 'tilt', 'dolly', 'tracking', 'crane',
    'slow motion', 'time-lapse', 'transition', 'cut', 'fade', 'dissolve',
    'frame rate', 'aspect ratio', 'cinematic', 'documentary',
  ],
  text: [
    'format', 'tone', 'audience', 'length', 'structure', 'style',
    'formal', 'casual', 'technical', 'creative', 'step-by-step',
    'bullet points', 'paragraphs', 'examples', 'constraints',
  ],
};

// Structure markers that improve organization
const STRUCTURE_MARKERS = [
  ',', '.', ':', ';', '-', '|', '/', '\\',
  '[', ']', '(', ')', '{', '}', '<', '>',
  '--', '::', '##', '**',
];

// Platform-specific parameter patterns
const PLATFORM_PARAMS: Record<Platform, RegExp[]> = {
  midjourney: [/--ar\s*\d+:\d+/i, /--v\s*\d+/i, /--stylize\s*\d+/i, /--chaos\s*\d+/i, /--no\s+\w+/i],
  dalle: [/\d+x\d+/i, /style:/i],
  'stable-diffusion': [/\(\w+:\d+\.?\d*\)/i, /\[\w+\]/i, /masterpiece/i, /best quality/i],
  flux: [/detailed/i, /high quality/i],
  leonardo: [/negative:/i, /style:/i],
  suno: [/\[.*\]/i, /bpm/i, /key of/i],
  udio: [/genre:/i, /mood:/i],
  runway: [/camera/i, /movement/i, /motion/i],
  pika: [/motion/i, /style/i],
  higgsfield: [/\[.*\]/i, /emotion/i],
  chatgpt: [/step by step/i, /format:/i, /example:/i],
  claude: [/<\w+>/i, /think.*step/i],
  unknown: [],
};

/**
 * Analyze a prompt for quality and provide actionable feedback
 */
export function analyzePrompt(prompt: string, platform: Platform): PromptAnalysis {
  const category = PLATFORMS[platform]?.category || 'text';
  const words = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const estimatedTokens = Math.ceil(wordCount * 1.3); // Rough token estimate

  // Calculate each quality dimension
  const clarity = calculateClarity(prompt, words);
  const specificity = calculateSpecificity(prompt, words, category);
  const structure = calculateStructure(prompt);
  const context = calculateContext(prompt, words, category);
  const actionability = calculateActionability(prompt, platform);

  // Weighted overall score (clarity and specificity most important)
  const overall = Math.round(
    clarity * 0.25 +
    specificity * 0.30 +
    structure * 0.15 +
    context * 0.15 +
    actionability * 0.15
  );

  const grade = getGrade(overall);

  const quality: PromptQuality = {
    clarity,
    specificity,
    structure,
    context,
    actionability,
    overall,
    grade,
  };

  // Generate issues and suggestions
  const issues = generateIssues(prompt, words, quality, platform, category);
  const suggestions = generateSuggestions(issues, platform, category);
  const strengths = generateStrengths(quality, prompt, platform);

  return {
    quality,
    issues,
    suggestions,
    strengths,
    wordCount,
    estimatedTokens,
  };
}

/**
 * Calculate clarity score
 * High clarity = direct, unambiguous, no fluff
 */
function calculateClarity(prompt: string, words: string[]): number {
  let score = 70; // Base score

  // Penalize vague words
  const vagueCount = words.filter(w => VAGUE_WORDS.includes(w)).length;
  score -= vagueCount * 5;

  // Penalize excessive length (over-explanation reduces clarity)
  if (words.length > 100) score -= 10;
  if (words.length > 200) score -= 15;

  // Penalize repetition
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;
  if (repetitionRatio < 0.5) score -= 15;
  else if (repetitionRatio < 0.7) score -= 5;

  // Reward conciseness with substance
  if (words.length >= 10 && words.length <= 50) score += 10;

  // Penalize all caps (shouting)
  const capsRatio = (prompt.match(/[A-Z]/g) || []).length / prompt.length;
  if (capsRatio > 0.3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate specificity score
 * High specificity = concrete details, precise descriptors
 */
function calculateSpecificity(prompt: string, words: string[], category: PlatformCategory): number {
  let score = 50; // Base score

  // Reward platform-specific descriptors
  const descriptors = SPECIFIC_DESCRIPTORS[category] || [];
  const foundDescriptors = descriptors.filter(d =>
    prompt.toLowerCase().includes(d.toLowerCase())
  );
  score += foundDescriptors.length * 5;

  // Reward numbers (dimensions, quantities, ratios)
  const numberCount = (prompt.match(/\d+/g) || []).length;
  score += Math.min(numberCount * 3, 15);

  // Reward color specificity
  const colorPatterns = /\b(red|blue|green|yellow|orange|purple|pink|cyan|magenta|teal|navy|gold|silver|bronze|crimson|azure|emerald|amber|coral|ivory|obsidian)\b/gi;
  const colorCount = (prompt.match(colorPatterns) || []).length;
  score += colorCount * 3;

  // Penalize vague words heavily for specificity
  const vagueCount = words.filter(w => VAGUE_WORDS.includes(w)).length;
  score -= vagueCount * 8;

  // Reward technical terms
  const technicalPattern = /\b(iso|aperture|shutter|focal|macro|telephoto|wide-angle|bokeh|hdri|pbr|subdivision|topology|rigging)\b/gi;
  const technicalCount = (prompt.match(technicalPattern) || []).length;
  score += technicalCount * 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate structure score
 * Good structure = organized, uses separators, logical flow
 */
function calculateStructure(prompt: string): number {
  let score = 60; // Base score

  // Reward use of structure markers
  const markerCount = STRUCTURE_MARKERS.filter(m => prompt.includes(m)).length;
  score += Math.min(markerCount * 3, 20);

  // Reward line breaks for long prompts
  const lines = prompt.split('\n').filter(l => l.trim().length > 0);
  if (prompt.length > 100 && lines.length > 1) score += 10;

  // Reward bracketed sections
  const bracketPairs = (prompt.match(/\[.*?\]/g) || []).length;
  score += Math.min(bracketPairs * 4, 15);

  // Reward parameter formatting (key:value or --param)
  const paramPatterns = (prompt.match(/(\w+:\s*\w+|--\w+)/g) || []).length;
  score += Math.min(paramPatterns * 5, 20);

  // Penalize run-on sentences (very long with no punctuation)
  const sentences = prompt.split(/[.!?;]/).filter(s => s.trim().length > 0);
  const avgSentenceLength = prompt.length / Math.max(sentences.length, 1);
  if (avgSentenceLength > 150) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate context score
 * Good context = provides background, sets the scene
 */
function calculateContext(prompt: string, words: string[], _category: PlatformCategory): number {
  let score = 50; // Base score

  // Check for subject clarity
  const subjectIndicators = ['a ', 'an ', 'the ', 'portrait of', 'image of', 'photo of', 'scene of'];
  const hasSubject = subjectIndicators.some(s => prompt.toLowerCase().includes(s));
  if (hasSubject) score += 15;

  // Check for environment/setting
  const settingWords = ['in', 'at', 'on', 'inside', 'outside', 'background', 'environment', 'setting', 'scene'];
  const hasSetting = settingWords.some(s => words.includes(s));
  if (hasSetting) score += 10;

  // Check for mood/atmosphere
  const moodWords = ['mood', 'atmosphere', 'feeling', 'vibe', 'tone', 'emotion', 'dramatic', 'peaceful', 'energetic'];
  const hasMood = moodWords.some(m => prompt.toLowerCase().includes(m));
  if (hasMood) score += 10;

  // Check for style reference
  const styleIndicators = ['style', 'like', 'inspired', 'reminiscent', 'aesthetic', 'genre'];
  const hasStyle = styleIndicators.some(s => prompt.toLowerCase().includes(s));
  if (hasStyle) score += 10;

  // Penalize too short (lacks context)
  if (words.length < 5) score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate actionability score
 * High actionability = clear what output should look like
 */
function calculateActionability(prompt: string, platform: Platform): number {
  let score = 60; // Base score

  // Reward platform-specific parameters
  const params = PLATFORM_PARAMS[platform] || [];
  const matchedParams = params.filter(p => p.test(prompt)).length;
  score += matchedParams * 8;

  // Check for output specification
  const outputIndicators = ['generate', 'create', 'make', 'produce', 'render', 'design', 'compose', 'write'];
  const hasOutputVerb = outputIndicators.some(v => prompt.toLowerCase().includes(v));
  if (hasOutputVerb) score += 5;

  // Check for quality indicators
  const qualityWords = ['high quality', 'detailed', 'professional', 'polished', '4k', '8k', 'hd', 'masterpiece'];
  const hasQuality = qualityWords.some(q => prompt.toLowerCase().includes(q));
  if (hasQuality) score += 10;

  // Check for negative constraints
  const negativeIndicators = ['no ', 'without', 'avoid', 'exclude', 'not ', '--no'];
  const hasNegative = negativeIndicators.some(n => prompt.toLowerCase().includes(n));
  if (hasNegative) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Convert score to letter grade
 */
function getGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Generate specific issues found in the prompt
 */
function generateIssues(
  prompt: string,
  words: string[],
  quality: PromptQuality,
  platform: Platform,
  category: PlatformCategory
): PromptIssue[] {
  const issues: PromptIssue[] = [];

  // Clarity issues
  const vagueFound = words.filter(w => VAGUE_WORDS.includes(w));
  if (vagueFound.length > 0) {
    issues.push({
      type: 'clarity',
      severity: vagueFound.length > 3 ? 'high' : 'medium',
      message: `Vague words detected: "${vagueFound.slice(0, 3).join('", "')}"`,
      suggestion: 'Replace vague words with specific descriptors. Instead of "nice" use "warm-toned" or "high-contrast".',
    });
  }

  // Specificity issues
  if (quality.specificity < 50) {
    const descriptors = SPECIFIC_DESCRIPTORS[category]?.slice(0, 5) || [];
    issues.push({
      type: 'specificity',
      severity: quality.specificity < 30 ? 'high' : 'medium',
      message: 'Prompt lacks specific details',
      suggestion: `Add specific descriptors like: ${descriptors.join(', ')}`,
    });
  }

  // Structure issues
  if (quality.structure < 50 && words.length > 20) {
    issues.push({
      type: 'structure',
      severity: 'medium',
      message: 'Long prompt without clear structure',
      suggestion: 'Use commas, brackets, or line breaks to organize elements. Group related concepts together.',
    });
  }

  // Context issues
  if (quality.context < 40) {
    issues.push({
      type: 'context',
      severity: 'medium',
      message: 'Missing contextual information',
      suggestion: 'Add setting, mood, or style references to guide the output.',
    });
  }

  // Platform-specific issues
  const params = PLATFORM_PARAMS[platform] || [];
  if (params.length > 0 && !params.some(p => p.test(prompt))) {
    issues.push({
      type: 'actionability',
      severity: 'low',
      message: `No ${platform} parameters detected`,
      suggestion: `Consider adding platform-specific parameters for better control.`,
    });
  }

  // Too short
  if (words.length < 5) {
    issues.push({
      type: 'context',
      severity: 'high',
      message: 'Prompt is too brief',
      suggestion: 'Expand with subject details, environment, lighting, and style.',
    });
  }

  // Too long
  if (words.length > 150) {
    issues.push({
      type: 'clarity',
      severity: 'medium',
      message: 'Prompt may be too long',
      suggestion: 'Focus on essential elements. LLMs work best with concise, high-signal content.',
    });
  }

  return issues;
}

/**
 * Generate improvement suggestions based on issues
 */
function generateSuggestions(
  issues: PromptIssue[],
  _platform: Platform,
  category: PlatformCategory
): string[] {
  const suggestions: string[] = [];

  // Core principle reminder
  if (issues.some(i => i.severity === 'high')) {
    suggestions.push('Remember: prompting is persuasion, not programming. Be clear and direct.');
  }

  // Add category-specific tips
  const descriptors = SPECIFIC_DESCRIPTORS[category]?.slice(0, 3) || [];
  if (descriptors.length > 0 && issues.some(i => i.type === 'specificity')) {
    suggestions.push(`Try adding: ${descriptors.join(', ')}`);
  }

  // Few-shot suggestion for text platforms
  if (category === 'text') {
    suggestions.push('Consider adding an example of desired output (few-shot prompting).');
  }

  // Structure suggestion
  if (issues.some(i => i.type === 'structure')) {
    suggestions.push('Use separators like commas or brackets to organize your prompt.');
  }

  return suggestions;
}

/**
 * Generate strengths found in the prompt
 */
function generateStrengths(quality: PromptQuality, prompt: string, platform: Platform): string[] {
  const strengths: string[] = [];

  if (quality.clarity >= 70) strengths.push('Clear and direct language');
  if (quality.specificity >= 70) strengths.push('Good use of specific descriptors');
  if (quality.structure >= 70) strengths.push('Well-organized structure');
  if (quality.context >= 70) strengths.push('Strong contextual foundation');
  if (quality.actionability >= 70) strengths.push('Clear output expectations');

  // Check for platform params
  const params = PLATFORM_PARAMS[platform] || [];
  if (params.some(p => p.test(prompt))) {
    strengths.push('Uses platform-specific parameters');
  }

  return strengths;
}

/**
 * Get a quick quality summary for UI display
 */
export function getQuickQuality(prompt: string, platform: Platform): {
  score: number;
  grade: string;
  color: string;
} {
  const analysis = analyzePrompt(prompt, platform);

  const color =
    analysis.quality.overall >= 80 ? '#22C55E' :  // Green
    analysis.quality.overall >= 60 ? '#FBBF24' :  // Yellow
    analysis.quality.overall >= 40 ? '#F97316' :  // Orange
    '#EF4444';  // Red

  return {
    score: analysis.quality.overall,
    grade: analysis.quality.grade,
    color,
  };
}

/**
 * Prompt improvement principles to inject into optimization
 */
export const PROMPT_PRINCIPLES = {
  core: 'Prompting is persuasion, not programming. Convince the AI to see your vision.',

  techniques: {
    clarity: 'Be clear and direct. Strip fluff. Use plain language. No ambiguity.',
    examples: 'Show, don\'t just tell. Examples are worth a thousand words.',
    chainOfThought: 'For complex prompts, encourage step-by-step reasoning.',
    structure: 'Use XML tags, brackets, or separators to organize elements.',
    specificity: 'Replace vague words with concrete descriptors.',
  },

  avoid: [
    'Empty intensifiers (very, really, extremely)',
    'Vague qualifiers (nice, good, cool, beautiful)',
    'Undefined pronouns (it, this, that, something)',
    'Run-on descriptions without structure',
    'Repetition without purpose',
  ],

  maximize: [
    'Specific visual/audio descriptors',
    'Concrete numbers and ratios',
    'Platform-specific parameters',
    'Clear subject-action-context structure',
    'Mood and atmosphere keywords',
  ],
};

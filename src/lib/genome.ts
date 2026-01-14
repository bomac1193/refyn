import { getTasteProfile, saveTasteProfile, createDefaultTasteProfile } from './storage';
import { extractKeywords, analyzeSentiment, measureComplexity } from '@/shared/utils';
import type { Platform, TasteProfile, GenomeTag, PromptRecord } from '@/shared/types';

export interface GenomeAnalysis {
  keywords: string[];
  sentiment: string;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedEnhancements: string[];
  detectedPatterns: GenomeTag[];
}

/**
 * GenomeEngine - Learns and applies user preferences
 */
export class GenomeEngine {
  private profile: TasteProfile | null = null;

  /**
   * Initialize or load the taste profile
   */
  async initialize(): Promise<void> {
    this.profile = await getTasteProfile();
    if (!this.profile) {
      this.profile = createDefaultTasteProfile();
      await saveTasteProfile(this.profile);
    }
  }

  /**
   * Get current taste profile
   */
  getProfile(): TasteProfile | null {
    return this.profile;
  }

  /**
   * Analyze a prompt and extract patterns
   */
  async analyze(prompt: string, platform: Platform): Promise<GenomeAnalysis> {
    const keywords = extractKeywords(prompt);
    const sentiment = analyzeSentiment(prompt);
    const complexity = measureComplexity(prompt);
    const detectedPatterns = this.detectPatterns(prompt, platform);
    const suggestedEnhancements = this.getSuggestions(platform, keywords);

    return {
      keywords,
      sentiment,
      complexity,
      suggestedEnhancements,
      detectedPatterns,
    };
  }

  /**
   * Learn from a prompt (reinforcement)
   */
  async learn(prompt: string, platform: Platform, rating: number): Promise<void> {
    if (!this.profile) await this.initialize();
    if (!this.profile) return;

    const keywords = extractKeywords(prompt);

    if (rating >= 4) {
      // Positive reinforcement
      this.reinforcePatterns(prompt, platform, keywords);
    } else if (rating <= 2) {
      // Negative reinforcement
      this.diminishPatterns(keywords);
    }

    // Add to successful prompts if highly rated
    if (rating >= 4) {
      const record: PromptRecord = {
        id: crypto.randomUUID(),
        content: prompt,
        platform,
        createdAt: new Date(),
        rating,
        tags: keywords.slice(0, 5),
      };

      this.profile.patterns.successfulPrompts = [
        record,
        ...this.profile.patterns.successfulPrompts.slice(0, 49),
      ];
    }

    await saveTasteProfile(this.profile);
  }

  /**
   * Reinforce patterns from a successful prompt
   */
  private reinforcePatterns(prompt: string, platform: Platform, keywords: string[]): void {
    if (!this.profile) return;

    const lower = prompt.toLowerCase();

    // Update keyword frequencies
    for (const kw of keywords) {
      this.profile.patterns.frequentKeywords[kw] =
        (this.profile.patterns.frequentKeywords[kw] || 0) + 1;
    }

    // Detect and reinforce visual preferences
    this.updateVisualPreferences(lower);

    // Detect and reinforce audio preferences
    this.updateAudioPreferences(lower);

    // Update platform-specific parameters
    this.updatePlatformParams(prompt, platform);
  }

  /**
   * Diminish patterns from unsuccessful prompts
   */
  private diminishPatterns(keywords: string[]): void {
    if (!this.profile) return;

    for (const kw of keywords) {
      if (this.profile.patterns.frequentKeywords[kw]) {
        this.profile.patterns.frequentKeywords[kw] =
          Math.max(0, this.profile.patterns.frequentKeywords[kw] - 1);

        if (this.profile.patterns.frequentKeywords[kw] === 0) {
          delete this.profile.patterns.frequentKeywords[kw];
        }
      }
    }
  }

  /**
   * Update visual preferences based on prompt content
   */
  private updateVisualPreferences(prompt: string): void {
    if (!this.profile) return;

    // Color palette
    const palettes: Record<string, TasteProfile['visual']['colorPalette'][number]> = {
      warm: 'warm',
      cold: 'cool',
      cool: 'cool',
      vibrant: 'vibrant',
      muted: 'muted',
      neutral: 'neutral',
    };

    for (const [keyword, palette] of Object.entries(palettes)) {
      if (prompt.includes(keyword) && !this.profile.visual.colorPalette.includes(palette)) {
        this.profile.visual.colorPalette.push(palette);
      }
    }

    // Lighting
    const lightings: Record<string, TasteProfile['visual']['lighting'][number]> = {
      'natural light': 'natural',
      'studio light': 'studio',
      dramatic: 'dramatic',
      'soft light': 'soft',
      'high contrast': 'high-contrast',
    };

    for (const [keyword, lighting] of Object.entries(lightings)) {
      if (prompt.includes(keyword) && !this.profile.visual.lighting.includes(lighting)) {
        this.profile.visual.lighting.push(lighting);
      }
    }

    // Style
    const styles: Record<string, TasteProfile['visual']['style'][number]> = {
      photorealistic: 'photorealistic',
      cinematic: 'cinematic',
      artistic: 'artistic',
      abstract: 'abstract',
      minimal: 'minimal',
    };

    for (const [keyword, style] of Object.entries(styles)) {
      if (prompt.includes(keyword) && !this.profile.visual.style.includes(style)) {
        this.profile.visual.style.push(style);
      }
    }

    // Keep arrays manageable
    this.profile.visual.colorPalette = this.profile.visual.colorPalette.slice(0, 3);
    this.profile.visual.lighting = this.profile.visual.lighting.slice(0, 3);
    this.profile.visual.style = this.profile.visual.style.slice(0, 3);
  }

  /**
   * Update audio preferences based on prompt content
   */
  private updateAudioPreferences(prompt: string): void {
    if (!this.profile) return;

    // Genres
    const genres = [
      'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical',
      'r&b', 'folk', 'country', 'metal', 'indie', 'lo-fi',
    ];

    for (const genre of genres) {
      if (prompt.includes(genre) && !this.profile.audio.genres.includes(genre)) {
        this.profile.audio.genres.push(genre);
      }
    }

    // Moods
    const moods = [
      'energetic', 'melancholic', 'uplifting', 'dark', 'dreamy',
      'aggressive', 'peaceful', 'nostalgic',
    ];

    for (const mood of moods) {
      if (prompt.includes(mood) && !this.profile.audio.moods.includes(mood)) {
        this.profile.audio.moods.push(mood);
      }
    }

    // Keep arrays manageable
    this.profile.audio.genres = this.profile.audio.genres.slice(0, 5);
    this.profile.audio.moods = this.profile.audio.moods.slice(0, 3);
  }

  /**
   * Update platform-specific parameters
   */
  private updatePlatformParams(prompt: string, platform: Platform): void {
    if (!this.profile) return;

    // Extract parameters (e.g., --ar 16:9, --v 6.1)
    const paramMatches = prompt.match(/--\w+\s+[\w:.]+/g) || [];

    if (paramMatches.length > 0) {
      const current = this.profile.patterns.preferredParameters[platform] || [];
      const updated = [...new Set([...current, ...paramMatches])].slice(0, 10);
      this.profile.patterns.preferredParameters[platform] = updated;
    }
  }

  /**
   * Detect patterns in a prompt
   */
  private detectPatterns(prompt: string, platform: Platform): GenomeTag[] {
    const tags: GenomeTag[] = [];
    const lower = prompt.toLowerCase();

    // Visual patterns
    if (['midjourney', 'dalle', 'stable-diffusion', 'leonardo', 'flux'].includes(platform)) {
      // Style detection
      const styles = ['cinematic', 'photorealistic', 'artistic', 'abstract', 'minimal', 'surreal'];
      for (const style of styles) {
        if (lower.includes(style)) {
          tags.push({ category: 'Style', value: style, confidence: 0.9 });
          break;
        }
      }

      // Mood detection
      const moods = ['dramatic', 'peaceful', 'vibrant', 'dark', 'nostalgic', 'ethereal'];
      for (const mood of moods) {
        if (lower.includes(mood)) {
          tags.push({ category: 'Mood', value: mood, confidence: 0.85 });
          break;
        }
      }
    }

    // Audio patterns
    if (['suno', 'udio'].includes(platform)) {
      const genres = ['pop', 'rock', 'electronic', 'jazz', 'hip-hop', 'classical'];
      for (const genre of genres) {
        if (lower.includes(genre)) {
          tags.push({ category: 'Genre', value: genre, confidence: 0.9 });
          break;
        }
      }
    }

    return tags;
  }

  /**
   * Get personalized suggestions based on profile
   */
  getSuggestions(platform: Platform, context: string[]): string[] {
    if (!this.profile) return [];

    const suggestions: string[] = [];

    // Add frequently used keywords that match context
    const topKeywords = Object.entries(this.profile.patterns.frequentKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    const relevantKeywords = topKeywords.filter(
      (kw) => !context.includes(kw) && context.some((c) => c.includes(kw.substring(0, 3)))
    );

    if (relevantKeywords.length > 0) {
      suggestions.push(`Consider adding: ${relevantKeywords.slice(0, 3).join(', ')}`);
    }

    // Add preferred parameters for platform
    const platformParams = this.profile.patterns.preferredParameters[platform];
    if (platformParams && platformParams.length > 0) {
      const unusedParams = platformParams.filter(
        (p) => !context.some((c) => c.includes(p.split(' ')[0]))
      );
      if (unusedParams.length > 0) {
        suggestions.push(`Your preferred params: ${unusedParams.slice(0, 2).join(', ')}`);
      }
    }

    // Style suggestions for visual platforms
    if (['midjourney', 'dalle', 'stable-diffusion'].includes(platform)) {
      if (this.profile.visual.style.length > 0) {
        const styleStr = this.profile.visual.style.join(', ');
        if (!context.some((c) => this.profile!.visual.style.some((s) => c.includes(s)))) {
          suggestions.push(`Your style preferences: ${styleStr}`);
        }
      }
    }

    return suggestions;
  }

  /**
   * Get profile statistics
   */
  getStats(): {
    totalKeywords: number;
    topKeywords: string[];
    favoriteStyles: string[];
    favoriteGenres: string[];
    promptCount: number;
  } {
    if (!this.profile) {
      return {
        totalKeywords: 0,
        topKeywords: [],
        favoriteStyles: [],
        favoriteGenres: [],
        promptCount: 0,
      };
    }

    const topKeywords = Object.entries(this.profile.patterns.frequentKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);

    return {
      totalKeywords: Object.keys(this.profile.patterns.frequentKeywords).length,
      topKeywords,
      favoriteStyles: this.profile.visual.style,
      favoriteGenres: this.profile.audio.genres,
      promptCount: this.profile.patterns.successfulPrompts.length,
    };
  }
}

// Export singleton instance
export const genomeEngine = new GenomeEngine();

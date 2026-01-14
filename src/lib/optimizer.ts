import { genomeEngine } from './genome';
import { lineageTree } from './lineage';
import type { Platform, OptimizationMode, TasteProfile } from '@/shared/types';

/**
 * High-level optimization orchestrator
 */
export class PromptOptimizer {
  /**
   * Pre-process prompt before sending to API
   */
  async preProcess(
    prompt: string,
    platform: Platform
  ): Promise<{
    cleanedPrompt: string;
    suggestions: string[];
    analysis: Awaited<ReturnType<typeof genomeEngine.analyze>>;
  }> {
    // Analyze prompt
    const analysis = await genomeEngine.analyze(prompt, platform);

    // Clean up prompt
    const cleanedPrompt = this.cleanPrompt(prompt);

    // Get personalized suggestions
    const suggestions = genomeEngine.getSuggestions(platform, analysis.keywords);

    return {
      cleanedPrompt,
      suggestions,
      analysis,
    };
  }

  /**
   * Post-process optimized prompt
   */
  async postProcess(
    originalPrompt: string,
    optimizedPrompt: string,
    platform: Platform,
    mode: OptimizationMode
  ): Promise<{
    finalPrompt: string;
    lineageNodeId: string;
  }> {
    // Create lineage node
    const node = await lineageTree.createNode(optimizedPrompt, platform, undefined, mode);

    // Find similar prompts for potential linking
    const similar = await lineageTree.findSimilar(originalPrompt, 0.5);
    if (similar.length > 0 && similar[0].node.id !== node.id) {
      // Could link as a variant of existing prompt
      console.log('[Refyn] Found similar prompt:', similar[0].node.id);
    }

    return {
      finalPrompt: optimizedPrompt,
      lineageNodeId: node.id,
    };
  }

  /**
   * Learn from user feedback
   */
  async learn(prompt: string, platform: Platform, rating: number): Promise<void> {
    await genomeEngine.learn(prompt, platform, rating);
  }

  /**
   * Clean up a prompt
   */
  private cleanPrompt(prompt: string): string {
    return prompt
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Remove extra commas
      .replace(/,\s*,/g, ',')
      // Trim
      .trim();
  }

  /**
   * Get personalization context for API call
   */
  async getPersonalizationContext(
    platform: Platform,
    tasteProfile?: TasteProfile
  ): Promise<string> {
    const profile = tasteProfile || genomeEngine.getProfile();
    if (!profile) return '';

    const parts: string[] = [];

    // Visual preferences
    if (['midjourney', 'dalle', 'stable-diffusion', 'leonardo', 'flux'].includes(platform)) {
      if (profile.visual.style.length > 0) {
        parts.push(`Preferred styles: ${profile.visual.style.join(', ')}`);
      }
      if (profile.visual.colorPalette.length > 0) {
        parts.push(`Preferred colors: ${profile.visual.colorPalette.join(', ')}`);
      }
      if (profile.visual.lighting.length > 0) {
        parts.push(`Preferred lighting: ${profile.visual.lighting.join(', ')}`);
      }
    }

    // Audio preferences
    if (['suno', 'udio'].includes(platform)) {
      if (profile.audio.genres.length > 0) {
        parts.push(`Preferred genres: ${profile.audio.genres.join(', ')}`);
      }
      if (profile.audio.moods.length > 0) {
        parts.push(`Preferred moods: ${profile.audio.moods.join(', ')}`);
      }
    }

    // Frequent keywords
    const topKeywords = Object.entries(profile.patterns.frequentKeywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);

    if (topKeywords.length > 0) {
      parts.push(`Frequently used terms: ${topKeywords.join(', ')}`);
    }

    // Platform parameters
    const platformParams = profile.patterns.preferredParameters[platform];
    if (platformParams && platformParams.length > 0) {
      parts.push(`Preferred parameters: ${platformParams.slice(0, 3).join(', ')}`);
    }

    return parts.length > 0 ? `\n\nUser preferences:\n${parts.join('\n')}` : '';
  }

  /**
   * Get optimization statistics
   */
  async getStats(): Promise<{
    genomeStats: ReturnType<typeof genomeEngine.getStats>;
    lineageStats: Awaited<ReturnType<typeof lineageTree.getStats>>;
  }> {
    const genomeStats = genomeEngine.getStats();
    const lineageStats = await lineageTree.getStats();

    return {
      genomeStats,
      lineageStats,
    };
  }
}

// Export singleton instance
export const promptOptimizer = new PromptOptimizer();

/**
 * Stress Test for Refyn Save Functionality
 * Run this in the browser console or import it for testing
 */

import { savePrompt, getSavedPrompts, removeSavedPrompt } from './storage';
import type { Platform } from '@/shared/types';

const TEST_PLATFORMS: Platform[] = ['midjourney', 'dalle', 'suno', 'runway', 'higgsfield'];

const SAMPLE_PROMPTS = [
  'A cyberpunk cityscape at night with neon lights reflecting on wet streets, flying cars, holographic advertisements, cinematic lighting --ar 16:9 --v 6',
  'Portrait of an elderly wizard with a long silver beard, wise eyes, dramatic rim lighting, fantasy art style, highly detailed',
  'Lofi hip-hop beats, rainy day vibes, warm piano chords, soft drums, nostalgic, 85 BPM',
  'A majestic dragon flying over snow-capped mountains at sunrise, epic scale, volumetric lighting, 8k resolution',
  'Slow motion dolly shot of a dancer in flowing red dress, particles floating in air, dramatic backlight, cinematic',
  'Abstract geometric patterns with gold and deep blue, art deco style, symmetric composition, luxury aesthetic',
  'Cozy coffee shop interior, morning light through windows, steam rising from cups, warm color palette',
  'Synthwave track, retro 80s vibes, pulsing bassline, arpeggiated synths, energetic, 120 BPM',
  'Underwater scene with bioluminescent jellyfish, dark ocean depths, ethereal glow, mysterious atmosphere',
  'Time-lapse of flowers blooming in a meadow, golden hour lighting, macro details, nature documentary style',
];

/**
 * Run comprehensive stress test on save functionality
 */
export async function runSaveStressTest(): Promise<{
  success: boolean;
  results: string[];
  errors: string[];
}> {
  const results: string[] = [];
  const errors: string[] = [];

  console.log('[Refyn Test] Starting save stress test...');

  try {
    // Test 1: Clear existing saved prompts
    results.push('Test 1: Clearing existing saved prompts');
    const existingSaved = await getSavedPrompts();
    for (const prompt of existingSaved) {
      await removeSavedPrompt(prompt.id);
    }
    results.push(`  ✓ Cleared ${existingSaved.length} existing prompts`);

    // Test 2: Save multiple prompts rapidly
    results.push('Test 2: Rapid save test (10 prompts)');
    const savePromises = SAMPLE_PROMPTS.map((content, i) => {
      const platform = TEST_PLATFORMS[i % TEST_PLATFORMS.length];
      return savePrompt(content, platform, [`test-${i}`, 'stress-test']);
    });

    const savedPrompts = await Promise.all(savePromises);
    results.push(`  ✓ Saved ${savedPrompts.length} prompts`);

    // Test 3: Verify all prompts were saved correctly
    results.push('Test 3: Verification');
    const retrieved = await getSavedPrompts();

    if (retrieved.length !== SAMPLE_PROMPTS.length) {
      errors.push(`  ✗ Expected ${SAMPLE_PROMPTS.length} prompts, got ${retrieved.length}`);
    } else {
      results.push(`  ✓ All ${retrieved.length} prompts retrieved`);
    }

    // Test 4: Verify data integrity
    results.push('Test 4: Data integrity check');
    let integrityPassed = true;
    for (const prompt of retrieved) {
      if (!prompt.id) {
        errors.push('  ✗ Found prompt without ID');
        integrityPassed = false;
      }
      if (!prompt.content) {
        errors.push('  ✗ Found prompt without content');
        integrityPassed = false;
      }
      if (!prompt.platform) {
        errors.push('  ✗ Found prompt without platform');
        integrityPassed = false;
      }
      if (!prompt.createdAt) {
        errors.push('  ✗ Found prompt without createdAt');
        integrityPassed = false;
      }
    }
    if (integrityPassed) {
      results.push('  ✓ All prompts have required fields');
    }

    // Test 5: Delete test
    results.push('Test 5: Delete test');
    const promptToDelete = retrieved[0];
    await removeSavedPrompt(promptToDelete.id);
    const afterDelete = await getSavedPrompts();

    if (afterDelete.length === retrieved.length - 1) {
      results.push('  ✓ Delete working correctly');
    } else {
      errors.push(`  ✗ Delete failed: expected ${retrieved.length - 1}, got ${afterDelete.length}`);
    }

    // Test 6: Large content test
    results.push('Test 6: Large content test');
    const largeContent = 'A '.repeat(500) + 'very long prompt with lots of details...';
    const largePrompt = await savePrompt(largeContent, 'midjourney', ['large-test']);
    const retrievedLarge = await getSavedPrompts();
    const foundLarge = retrievedLarge.find(p => p.id === largePrompt.id);

    if (foundLarge && foundLarge.content === largeContent) {
      results.push('  ✓ Large content saved correctly');
    } else {
      errors.push('  ✗ Large content save failed');
    }

    // Test 7: Special characters test
    results.push('Test 7: Special characters test');
    const specialContent = 'Test with émojis 🎨✨ and spëcial "quotes" & <symbols>';
    const specialPrompt = await savePrompt(specialContent, 'dalle', ['special-test']);
    const retrievedSpecial = await getSavedPrompts();
    const foundSpecial = retrievedSpecial.find(p => p.id === specialPrompt.id);

    if (foundSpecial && foundSpecial.content === specialContent) {
      results.push('  ✓ Special characters handled correctly');
    } else {
      errors.push('  ✗ Special characters handling failed');
    }

    // Cleanup
    results.push('Cleanup: Removing test prompts');
    const finalCleanup = await getSavedPrompts();
    const testPrompts = finalCleanup.filter(p => p.tags?.includes('stress-test') || p.tags?.includes('large-test') || p.tags?.includes('special-test'));
    for (const prompt of testPrompts) {
      await removeSavedPrompt(prompt.id);
    }
    results.push(`  ✓ Removed ${testPrompts.length} test prompts`);

    console.log('[Refyn Test] Stress test complete!');
    console.log('Results:', results);
    if (errors.length > 0) {
      console.error('Errors:', errors);
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Fatal error: ${errorMsg}`);
    console.error('[Refyn Test] Fatal error:', error);

    return {
      success: false,
      results,
      errors,
    };
  }
}

/**
 * Quick validation of saved prompts data structure
 */
export async function validateSavedPrompts(): Promise<{
  valid: boolean;
  count: number;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    const saved = await getSavedPrompts();

    for (let i = 0; i < saved.length; i++) {
      const prompt = saved[i];

      if (!prompt) {
        issues.push(`Item at index ${i} is null/undefined`);
        continue;
      }

      if (typeof prompt.id !== 'string' || !prompt.id) {
        issues.push(`Item ${i}: invalid or missing id`);
      }

      if (typeof prompt.content !== 'string' || !prompt.content) {
        issues.push(`Item ${i}: invalid or missing content`);
      }

      if (typeof prompt.platform !== 'string') {
        issues.push(`Item ${i}: invalid or missing platform`);
      }
    }

    return {
      valid: issues.length === 0,
      count: saved.length,
      issues,
    };

  } catch (error) {
    return {
      valid: false,
      count: 0,
      issues: [`Failed to read saved prompts: ${error}`],
    };
  }
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).refynStressTest = runSaveStressTest;
  (window as unknown as Record<string, unknown>).refynValidate = validateSavedPrompts;
}

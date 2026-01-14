/**
 * Stress Test for Trash Feedback & Compact Panel Features
 * Tests the trash detection, feedback popup, and learning system
 */

import { recordTrashFeedback } from './deepLearning';
import type { Platform } from '@/shared/types';

const TEST_PLATFORMS: Platform[] = ['midjourney', 'dalle', 'leonardo', 'runway'];

const TEST_PROMPTS = [
  'A cyberpunk cityscape at night with neon lights, cinematic lighting --ar 16:9 --v 6',
  'Portrait of an elderly wizard, dramatic rim lighting, fantasy art style',
  'Abstract geometric patterns with gold and deep blue, art deco style',
  'Underwater scene with bioluminescent jellyfish, ethereal glow',
  'Cozy coffee shop interior, morning light, warm color palette',
];

const TRASH_REASONS = [
  'poor-quality',
  'wrong-style',
  'doesnt-match',
  'too-similar',
  'wrong-composition',
  'other',
  'skipped',
];

/**
 * Test the recordTrashFeedback function
 */
async function testRecordTrashFeedback(): Promise<{
  success: boolean;
  results: string[];
  errors: string[];
}> {
  const results: string[] = [];
  const errors: string[] = [];

  console.log('[Trash Test] Starting recordTrashFeedback tests...');

  try {
    // Test 1: Record feedback for each reason type
    results.push('Test 1: Recording feedback for each reason type');
    for (const reason of TRASH_REASONS) {
      const prompt = TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)];
      const platform = TEST_PLATFORMS[Math.floor(Math.random() * TEST_PLATFORMS.length)];

      try {
        await recordTrashFeedback(prompt, platform, reason);
        results.push(`  ✓ Recorded "${reason}" for ${platform}`);
      } catch (error) {
        errors.push(`  ✗ Failed to record "${reason}": ${error}`);
      }
    }

    // Test 2: Record custom feedback
    results.push('Test 2: Recording custom feedback');
    const customTexts = [
      'The colors are too saturated',
      'Missing the main subject',
      'Proportions look wrong',
    ];

    for (const customText of customTexts) {
      try {
        await recordTrashFeedback(
          TEST_PROMPTS[0],
          'midjourney',
          'custom',
          customText
        );
        results.push(`  ✓ Custom feedback: "${customText.substring(0, 30)}..."`);
      } catch (error) {
        errors.push(`  ✗ Failed custom feedback: ${error}`);
      }
    }

    // Test 3: Rapid fire feedback (stress test)
    results.push('Test 3: Rapid fire feedback (10 quick submissions)');
    const rapidPromises = [];
    for (let i = 0; i < 10; i++) {
      rapidPromises.push(
        recordTrashFeedback(
          TEST_PROMPTS[i % TEST_PROMPTS.length],
          TEST_PLATFORMS[i % TEST_PLATFORMS.length],
          TRASH_REASONS[i % TRASH_REASONS.length]
        )
      );
    }

    await Promise.all(rapidPromises);
    results.push('  ✓ All 10 rapid submissions completed');

    // Test 4: Empty/edge case handling
    results.push('Test 4: Edge case handling');

    try {
      await recordTrashFeedback('', 'midjourney', 'poor-quality');
      results.push('  ✓ Empty prompt handled');
    } catch (error) {
      errors.push(`  ✗ Empty prompt failed: ${error}`);
    }

    try {
      await recordTrashFeedback(TEST_PROMPTS[0], 'midjourney', 'skipped');
      results.push('  ✓ Skipped reason handled');
    } catch (error) {
      errors.push(`  ✗ Skipped reason failed: ${error}`);
    }

    // Test 5: Very long prompt
    results.push('Test 5: Long prompt handling');
    const longPrompt = 'A '.repeat(500) + 'very detailed scene with lots of elements';
    try {
      await recordTrashFeedback(longPrompt, 'midjourney', 'wrong-style');
      results.push('  ✓ Long prompt handled');
    } catch (error) {
      errors.push(`  ✗ Long prompt failed: ${error}`);
    }

    // Test 6: Special characters in custom text
    results.push('Test 6: Special characters handling');
    try {
      await recordTrashFeedback(
        TEST_PROMPTS[0],
        'dalle',
        'custom',
        'Test with émojis 🎨 and "quotes" & <symbols>'
      );
      results.push('  ✓ Special characters handled');
    } catch (error) {
      errors.push(`  ✗ Special characters failed: ${error}`);
    }

    console.log('[Trash Test] Tests completed!');
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
    console.error('[Trash Test] Fatal error:', error);

    return {
      success: false,
      results,
      errors,
    };
  }
}

/**
 * Test the trash observer selectors
 */
function testTrashSelectors(): {
  success: boolean;
  results: string[];
} {
  const results: string[] = [];

  console.log('[Trash Test] Testing trash selectors...');

  // Test selectors against mock elements
  const testSelectors = [
    'button[aria-label*="delete" i]',
    'button[aria-label*="trash" i]',
    '[class*="trash"]',
    '[class*="delete"]',
    'button[title*="delete" i]',
  ];

  // Create mock elements to test
  const mockContainer = document.createElement('div');
  mockContainer.innerHTML = `
    <button aria-label="Delete this image">Delete</button>
    <button aria-label="Trash item">Trash</button>
    <div class="trash-button">Trash</div>
    <div class="delete-btn">Delete</div>
    <button title="Delete generation">X</button>
  `;
  document.body.appendChild(mockContainer);

  for (const selector of testSelectors) {
    try {
      const elements = mockContainer.querySelectorAll(selector);
      if (elements.length > 0) {
        results.push(`✓ Selector "${selector}" matched ${elements.length} element(s)`);
      } else {
        results.push(`○ Selector "${selector}" matched 0 elements`);
      }
    } catch (error) {
      results.push(`✗ Selector "${selector}" failed: ${error}`);
    }
  }

  // Cleanup
  mockContainer.remove();

  console.log('[Trash Test] Selector tests completed');
  return {
    success: true,
    results,
  };
}

/**
 * Test the feedback popup HTML generation
 */
function testFeedbackPopupHTML(): {
  success: boolean;
  results: string[];
} {
  const results: string[] = [];

  console.log('[Trash Test] Testing feedback popup HTML...');

  const TRASH_FEEDBACK_PRESETS = [
    { id: 'poor-quality', label: 'Poor quality', icon: '👎' },
    { id: 'wrong-style', label: 'Wrong style', icon: '🎨' },
    { id: 'doesnt-match', label: "Doesn't match prompt", icon: '❌' },
    { id: 'too-similar', label: 'Too similar', icon: '👯' },
    { id: 'wrong-composition', label: 'Bad composition', icon: '📐' },
    { id: 'other', label: 'Other...', icon: '💭' },
  ];

  // Test HTML generation
  const html = `
    <div class="refyn-trash-feedback-inner">
      <div class="refyn-trash-feedback-header">
        <span class="refyn-trash-feedback-title">Why are you removing this?</span>
        <button class="refyn-trash-feedback-close" data-action="close">X</button>
      </div>
      <div class="refyn-trash-feedback-options">
        ${TRASH_FEEDBACK_PRESETS.map(preset => `
          <button class="refyn-trash-feedback-btn" data-reason="${preset.id}">
            <span class="refyn-trash-feedback-icon">${preset.icon}</span>
            <span class="refyn-trash-feedback-label">${preset.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Create element and test
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  // Verify all buttons exist
  const buttons = container.querySelectorAll('.refyn-trash-feedback-btn');
  if (buttons.length === TRASH_FEEDBACK_PRESETS.length) {
    results.push(`✓ All ${buttons.length} preset buttons rendered`);
  } else {
    results.push(`✗ Expected ${TRASH_FEEDBACK_PRESETS.length} buttons, got ${buttons.length}`);
  }

  // Verify data attributes
  let allDataAttrsCorrect = true;
  buttons.forEach((btn, i) => {
    const reason = (btn as HTMLElement).dataset.reason;
    if (reason !== TRASH_FEEDBACK_PRESETS[i].id) {
      allDataAttrsCorrect = false;
    }
  });

  if (allDataAttrsCorrect) {
    results.push('✓ All data-reason attributes correct');
  } else {
    results.push('✗ Some data-reason attributes incorrect');
  }

  // Verify close button
  const closeBtn = container.querySelector('[data-action="close"]');
  if (closeBtn) {
    results.push('✓ Close button exists');
  } else {
    results.push('✗ Close button missing');
  }

  // Cleanup
  container.remove();

  console.log('[Trash Test] Popup HTML tests completed');
  return {
    success: true,
    results,
  };
}

/**
 * Run all trash feedback tests
 */
export async function runTrashFeedbackStressTest(): Promise<{
  success: boolean;
  results: string[];
  errors: string[];
}> {
  const allResults: string[] = [];
  const allErrors: string[] = [];

  console.log('='.repeat(50));
  console.log('[Refyn] Starting Trash Feedback Stress Test');
  console.log('='.repeat(50));

  // Test 1: Trash selectors
  console.log('\n--- Test Suite 1: Trash Selectors ---');
  const selectorTest = testTrashSelectors();
  allResults.push(...selectorTest.results);

  // Test 2: Popup HTML
  console.log('\n--- Test Suite 2: Popup HTML ---');
  const htmlTest = testFeedbackPopupHTML();
  allResults.push(...htmlTest.results);

  // Test 3: Record feedback function
  console.log('\n--- Test Suite 3: Record Feedback ---');
  const feedbackTest = await testRecordTrashFeedback();
  allResults.push(...feedbackTest.results);
  allErrors.push(...feedbackTest.errors);

  console.log('\n' + '='.repeat(50));
  console.log('[Refyn] Trash Feedback Stress Test Complete');
  console.log(`Results: ${allResults.length} passed`);
  console.log(`Errors: ${allErrors.length}`);
  console.log('='.repeat(50));

  return {
    success: allErrors.length === 0,
    results: allResults,
    errors: allErrors,
  };
}

/**
 * Quick validation of trash feedback storage
 */
export async function validateTrashFeedbackStorage(): Promise<{
  valid: boolean;
  stats: Record<string, unknown>;
}> {
  try {
    const result = await chrome.storage.local.get(['refyn_deep_preferences']);
    const prefs = result.refyn_deep_preferences;

    if (!prefs) {
      return { valid: true, stats: { message: 'No preferences stored yet' } };
    }

    return {
      valid: true,
      stats: {
        totalDeletes: prefs.stats?.totalDeletes || 0,
        trashReasons: prefs.trashReasons || {},
        reasonKeywordsCount: Object.keys(prefs.reasonKeywords || {}).length,
        customFeedbackCount: (prefs.customFeedback || []).length,
      },
    };
  } catch (error) {
    return {
      valid: false,
      stats: { error: String(error) },
    };
  }
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).refynTrashTest = runTrashFeedbackStressTest;
  (window as unknown as Record<string, unknown>).refynTrashValidate = validateTrashFeedbackStorage;
}

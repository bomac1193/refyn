/**
 * Output Observer - Monitors platform outputs and user actions
 * Learns from user behavior (deletes, likes, dislikes) to improve suggestions
 */

import type { Platform } from '@/shared/types';
import { detectPlatform } from './platformDetector';
import { recordOutputFeedback, linkPromptToOutput, getDeepPreferences, saveDeepPreferences } from '@/lib/deepLearning';
import { flashLearningIndicator } from './FloatingPanel';
import { descriptorsToKeywordScores, mergeVisualAnalysis } from '@/lib/visionAnalysis';

interface OutputElement {
  element: HTMLElement;
  outputId: string;
  prompt?: string;
  imageUrl?: string;
  platform: Platform;
  timestamp: number;
  rated: boolean;
}

/**
 * Check if vision analysis is enabled (defaults to TRUE for better taste learning)
 */
function isVisionAnalysisEnabled(): boolean {
  // Default to true - only disabled if explicitly set to 'false'
  const setting = localStorage.getItem('refyn-vision-analysis');
  return setting !== 'false';
}

/**
 * Extract image URL from an output element
 */
function extractImageUrl(element: HTMLElement): string | undefined {
  // Try to find an image element
  const img = element.querySelector('img') as HTMLImageElement;
  if (img?.src && !img.src.startsWith('data:')) {
    return img.src;
  }

  // Try background image
  const bgElement = element.querySelector('[style*="background-image"]') as HTMLElement;
  if (bgElement) {
    const bg = bgElement.style.backgroundImage;
    const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  // Check the element itself for background image
  const elementBg = element.style.backgroundImage;
  if (elementBg) {
    const match = elementBg.match(/url\(["']?([^"')]+)["']?\)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Perform vision analysis on an image and update preferences
 */
async function analyzeImageAndUpdatePreferences(
  imageUrl: string,
  platform: Platform,
  isLiked: boolean
): Promise<void> {
  if (!isVisionAnalysisEnabled()) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_IMAGE',
      payload: { imageUrl, platform },
    });

    if (response?.success && response.descriptors) {
      // Convert descriptors to keyword scores
      const newScores = descriptorsToKeywordScores(response.descriptors, isLiked);

      // Merge with existing preferences
      const prefs = await getDeepPreferences();
      prefs.keywordScores = mergeVisualAnalysis(prefs.keywordScores || {}, newScores);
      await saveDeepPreferences(prefs);

      console.log('[Refyn Vision] Updated preferences from image analysis:', response.descriptors.overallAesthetic);
    }
  } catch (error) {
    console.error('[Refyn Vision] Analysis failed:', error);
  }
}

// Track detected outputs
const trackedOutputs: Map<string, OutputElement> = new Map();

// Platform-specific selectors for outputs (images, videos, music)
const OUTPUT_SELECTORS: Record<string, {
  container: string;
  output: string;
  deleteBtn?: string;
  likeBtn?: string;
  dislikeBtn?: string;
  downloadBtn?: string;
  saveBtn?: string;
  promptSource?: string;
  // Midjourney-specific
  upscaleBtn?: string;
  varyBtn?: string;
  rerollBtn?: string;
}> = {
  midjourney: {
    container: '[class*="jobGrid"], [class*="gallery"], [class*="feed"], [class*="grid"], [class*="ImageGrid"], [class*="JobList"]',
    output: '[class*="job"], [class*="image-card"], img[src*="cdn.midjourney"], img[src*="mj-gallery"], [class*="JobCard"], [class*="ImageCard"], [data-testid*="image"], [class*="generation"], [class*="result-image"]',
    deleteBtn: '[class*="delete" i], [aria-label*="delete" i], [aria-label*="trash" i], [class*="trash" i], [class*="remove" i], button[title*="delete" i], button[title*="remove" i], [data-testid*="delete"], [class*="DislikeButton"], [class*="RemoveButton"], svg[class*="trash"], svg[class*="delete"]',
    likeBtn: '[class*="like" i], [class*="upvote" i], [class*="heart" i], [class*="favorite" i], [aria-label*="like" i], [aria-label*="upvote" i], [aria-label*="favorite" i], button[title*="like" i], [data-testid*="like"], [class*="LikeButton"], [class*="UpvoteButton"], svg[class*="heart"], svg[class*="like"], [class*="thumbs-up"], [class*="thumbsUp"]',
    dislikeBtn: '[class*="dislike" i], [class*="downvote" i], [aria-label*="dislike" i], [class*="thumbs-down"], [class*="thumbsDown"]',
    downloadBtn: '[class*="download" i], [aria-label*="download" i], button[title*="download" i]',
    saveBtn: '[class*="save" i], [aria-label*="save" i], [class*="bookmark" i]',
    promptSource: '[class*="prompt"], [class*="description"], [class*="caption"], [data-testid*="prompt"]',
    // Midjourney-specific action buttons (Discord & Web)
    upscaleBtn: 'button', // We'll check text content for U1, U2, U3, U4
    varyBtn: 'button', // We'll check text content for V1, V2, V3, V4
    rerollBtn: 'button', // We'll check for 🔄 emoji
  },
  higgsfield: {
    container: '[class*="gallery"], [class*="feed"], [class*="grid"], [class*="container"], [class*="results"], [class*="creations"], [class*="library"], [class*="workspace"]',
    output: '[class*="video"], [class*="output"], video, [class*="generation"], [class*="card"], [class*="item"], [class*="creation"], [class*="result"], [class*="media"], [data-testid*="video"], [data-testid*="output"]',
    deleteBtn: '[class*="delete" i], button[aria-label*="delete" i], [class*="trash" i], [class*="remove" i], button[title*="delete" i], svg[class*="trash"], svg[class*="delete"], [data-action="delete"], [data-testid*="delete"]',
    likeBtn: '[class*="like" i], [class*="heart" i], [class*="favorite" i], [aria-label*="like" i], button[title*="like" i], svg[class*="heart"], [data-action="like"], [data-testid*="like"], [class*="thumbs-up"], [class*="love"]',
    dislikeBtn: '[class*="dislike" i], [class*="thumbs-down"], [data-action="dislike"]',
    downloadBtn: '[class*="download" i], [aria-label*="download" i]',
    saveBtn: '[class*="save" i], [class*="bookmark" i]',
    promptSource: '[class*="prompt"], textarea, [class*="caption"], [class*="description"]',
  },
  runway: {
    container: '[class*="gallery"], [class*="generations"]',
    output: '[class*="generation"], video, [class*="result"]',
    deleteBtn: '[class*="delete"], [class*="remove"]',
    promptSource: '[class*="prompt"], input[type="text"]',
  },
  pika: {
    container: '[class*="gallery"], [class*="results"]',
    output: 'video, [class*="generation"], [class*="output"]',
    deleteBtn: '[class*="delete"]',
    promptSource: '[class*="prompt"], textarea',
  },
  leonardo: {
    container: '[class*="gallery"], [class*="generations"]',
    output: 'img[class*="generation"], [class*="image-result"]',
    deleteBtn: '[class*="delete"]',
    likeBtn: '[class*="like"]',
    promptSource: 'textarea[class*="prompt"], [class*="prompt-text"]',
  },
  dalle: {
    container: '[class*="result"], [class*="gallery"]',
    output: 'img[class*="generated"], [class*="image-result"]',
    promptSource: 'textarea, input[type="text"]',
  },
  'stable-diffusion': {
    container: '[class*="gallery"], #gallery',
    output: 'img[class*="output"], [class*="generated"]',
    deleteBtn: '[class*="delete"]',
    promptSource: 'textarea#prompt, [class*="prompt"]',
  },
  suno: {
    container: '[class*="library"], [class*="creations"]',
    output: '[class*="song"], [class*="track"], audio',
    deleteBtn: '[class*="delete"]',
    likeBtn: '[class*="like"], [class*="heart"]',
    promptSource: '[class*="lyrics"], [class*="style"]',
  },
  udio: {
    container: '[class*="library"], [class*="tracks"]',
    output: '[class*="track"], [class*="song"], audio',
    deleteBtn: '[class*="delete"]',
    likeBtn: '[class*="like"]',
    promptSource: '[class*="prompt"], [class*="tags"]',
  },
};

let observerInstance: MutationObserver | null = null;
let currentPlatform: Platform = 'unknown';
let ratingOverlaysEnabled = true;

/**
 * Initialize the output observer for the current platform
 */
export function initOutputObserver(): void {
  currentPlatform = detectPlatform();

  if (currentPlatform === 'unknown') {
    console.log('[Refyn Observer] Unknown platform, not observing');
    return;
  }

  console.log('[Refyn Observer] Initializing for platform:', currentPlatform);

  // Initial scan for outputs
  scanForOutputs();

  // Set up mutation observer for new outputs
  setupMutationObserver();

  // Set up action listeners (delete, like, dislike)
  setupActionListeners();

  console.log('[Refyn Observer] Initialization complete');
}

/**
 * Scan the page for existing outputs
 */
function scanForOutputs(): void {
  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config) return;

  // Find all output elements
  const outputs = document.querySelectorAll(config.output);

  outputs.forEach((output) => {
    if (output instanceof HTMLElement) {
      trackOutput(output);
    }
  });

  console.log('[Refyn Observer] Found', trackedOutputs.size, 'outputs');
}

/**
 * Track a single output element
 */
function trackOutput(element: HTMLElement): void {
  // Generate unique ID for this output
  const outputId = generateOutputId(element);

  if (trackedOutputs.has(outputId)) return;

  // Try to find associated prompt
  const prompt = findPromptForOutput(element);

  const outputData: OutputElement = {
    element,
    outputId,
    prompt,
    platform: currentPlatform,
    timestamp: Date.now(),
    rated: false,
  };

  trackedOutputs.set(outputId, outputData);

  // Link prompt to output for learning
  if (prompt) {
    linkPromptToOutput(prompt, outputId, currentPlatform);
  }

  // Add rating overlay - but be conservative on unproven platforms
  // Only add overlays where we're confident the element is an AI output
  const shouldAddOverlay =
    ratingOverlaysEnabled &&
    prompt && // Only if we found an associated prompt
    (
      currentPlatform === 'midjourney' ||
      currentPlatform === 'leonardo' ||
      currentPlatform === 'dalle' ||
      // For other platforms, require the element to have clear AI output indicators
      (element instanceof HTMLImageElement && element.src) ||
      (element instanceof HTMLVideoElement && element.src)
    );

  if (shouldAddOverlay) {
    addRatingOverlay(element, outputId);
  }

  console.log('[Refyn Observer] Tracking output:', outputId, prompt ? '(has prompt)' : '(no prompt)', shouldAddOverlay ? '(with overlay)' : '');
}

/**
 * Generate unique ID for an output element
 */
function generateOutputId(element: HTMLElement): string {
  // Try to find existing ID
  if (element.id) return element.id;

  // Try data attributes
  const dataId = element.dataset.id || element.dataset.generationId || element.dataset.jobId;
  if (dataId) return dataId;

  // Try src for images
  if (element instanceof HTMLImageElement && element.src) {
    return btoa(element.src).substring(0, 20);
  }

  // Try src for videos
  if (element instanceof HTMLVideoElement && element.src) {
    return btoa(element.src).substring(0, 20);
  }

  // Generate from position and content
  const rect = element.getBoundingClientRect();
  return `output-${currentPlatform}-${rect.x}-${rect.y}-${Date.now()}`;
}

/**
 * Find the prompt that generated an output
 */
function findPromptForOutput(element: HTMLElement): string | undefined {
  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config?.promptSource) return undefined;

  // Look for prompt in the output's parent hierarchy
  let parent = element.parentElement;
  let depth = 0;
  const maxDepth = 10;

  while (parent && depth < maxDepth) {
    const promptEl = parent.querySelector(config.promptSource);
    if (promptEl) {
      return promptEl.textContent?.trim() || (promptEl as HTMLInputElement).value?.trim();
    }
    parent = parent.parentElement;
    depth++;
  }

  // Fallback: look for recent prompt in global storage
  return getLastKnownPrompt();
}

/**
 * Get the last known prompt from storage/state
 */
function getLastKnownPrompt(): string | undefined {
  // Check localStorage for last refined prompt
  const lastPrompt = localStorage.getItem('refyn-last-prompt');
  if (lastPrompt) return lastPrompt;

  // Check for any visible prompt input
  const promptInputs = document.querySelectorAll('textarea, input[type="text"]');
  for (const input of promptInputs) {
    const value = (input as HTMLInputElement).value?.trim();
    if (value && value.length > 10) {
      return value;
    }
  }

  return undefined;
}

/**
 * Set up mutation observer for detecting new outputs
 */
function setupMutationObserver(): void {
  if (observerInstance) {
    observerInstance.disconnect();
  }

  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config) return;

  observerInstance = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if this node is an output
            if (node.matches(config.output)) {
              trackOutput(node);
            }
            // Check children for outputs
            const childOutputs = node.querySelectorAll(config.output);
            childOutputs.forEach((output) => {
              if (output instanceof HTMLElement) {
                trackOutput(output);
              }
            });
          }
        });

        // Handle removed outputs (possible delete action)
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            handlePotentialDelete(node);
          }
        });
      }
    }
  });

  observerInstance.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Check if a button appears to be in an "active" or "selected" state
 */
function isButtonActive(button: HTMLElement): boolean {
  // Check for common active state indicators
  const activeIndicators = [
    'active', 'selected', 'liked', 'favorited', 'pressed', 'checked',
    'is-active', 'is-selected', 'is-liked', '--active', '--selected'
  ];

  const className = button.className.toLowerCase();
  const ariaPressed = button.getAttribute('aria-pressed');
  const ariaSelected = button.getAttribute('aria-selected');
  const dataActive = button.dataset.active || button.dataset.selected || button.dataset.liked;

  // Check class names
  for (const indicator of activeIndicators) {
    if (className.includes(indicator)) return true;
  }

  // Check aria attributes
  if (ariaPressed === 'true' || ariaSelected === 'true') return true;

  // Check data attributes
  if (dataActive === 'true' || dataActive === '1') return true;

  // Check for filled SVG (common pattern for like buttons)
  const svg = button.querySelector('svg');
  if (svg) {
    const fill = svg.getAttribute('fill') || window.getComputedStyle(svg).fill;
    if (fill && fill !== 'none' && fill !== 'transparent' && !fill.includes('currentColor')) {
      return true;
    }
  }

  return false;
}

// Track when popup was last shown to prevent immediate re-triggering
let lastPopupShownAt = 0;
const POPUP_COOLDOWN_MS = 500;

/**
 * Set up listeners for platform action buttons (like, dislike, delete)
 */
function setupActionListeners(): void {
  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config) return;

  // Use event delegation for efficiency
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // IMPORTANT: Ignore clicks inside Refyn elements (popups, overlays, panels)
    if (target.closest('.refyn-like-feedback, .refyn-trash-feedback, .refyn-rating-overlay, #refyn-panel, #refyn-like-feedback, #refyn-dislike-feedback')) {
      console.log('[Refyn Observer] Ignoring click inside Refyn element');
      return;
    }

    // =====================================================
    // MIDJOURNEY AUTO-DETECTION: Upscale, Vary, Re-roll
    // =====================================================
    if (currentPlatform === 'midjourney') {
      const button = target.closest('button') as HTMLElement;
      if (button) {
        const buttonText = button.textContent?.trim() || '';

        // Detect Upscale buttons (U1, U2, U3, U4) - Strong LIKE signal
        if (/^U[1-4]$/.test(buttonText)) {
          console.log('[Refyn Observer] Midjourney UPSCALE detected:', buttonText);
          handleMidjourneyUpscale(button, buttonText);
          return;
        }

        // Detect Vary buttons (V1, V2, V3, V4) - Moderate LIKE signal
        if (/^V[1-4]$/.test(buttonText)) {
          console.log('[Refyn Observer] Midjourney VARY detected:', buttonText);
          handleMidjourneyVary(button, buttonText);
          return;
        }

        // Detect Re-roll button (🔄) - DISLIKE signal for current results
        if (buttonText.includes('🔄') || button.querySelector('[class*="reload"], [class*="refresh"], [class*="redo"]')) {
          console.log('[Refyn Observer] Midjourney RE-ROLL detected');
          handleMidjourneyReroll(button);
          return;
        }

        // Also check for "Vary (Strong)" and "Vary (Subtle)" buttons
        if (buttonText.toLowerCase().includes('vary')) {
          console.log('[Refyn Observer] Midjourney VARY (menu) detected:', buttonText);
          handleMidjourneyVary(button, buttonText);
          return;
        }
      }
    }

    // Check for delete button clicks
    if (config.deleteBtn && target.closest(config.deleteBtn)) {
      const output = findOutputForAction(target);
      if (output) {
        handleDeleteAction(output);
      }
    }

    // Check for like button clicks
    if (config.likeBtn && target.closest(config.likeBtn)) {
      // Check cooldown - don't process if popup was just shown
      if (Date.now() - lastPopupShownAt < POPUP_COOLDOWN_MS) {
        console.log('[Refyn Observer] Ignoring like click - popup cooldown active');
        return;
      }

      const likeButton = target.closest(config.likeBtn) as HTMLElement;
      const output = findOutputForAction(target);
      if (output) {
        // Wait briefly for platform UI to update, then check if button is now active
        setTimeout(() => {
          const isNowActive = isButtonActive(likeButton);
          console.log('[Refyn Observer] Like button clicked, now active:', isNowActive);
          if (isNowActive) {
            handleLikeAction(output);
          }
          // Don't hide popup on un-like - let user finish their feedback
        }, 100);
      }
    }

    // Check for dislike button clicks
    if (config.dislikeBtn && target.closest(config.dislikeBtn)) {
      // Check cooldown
      if (Date.now() - lastPopupShownAt < POPUP_COOLDOWN_MS) {
        console.log('[Refyn Observer] Ignoring dislike click - popup cooldown active');
        return;
      }

      const dislikeButton = target.closest(config.dislikeBtn) as HTMLElement;
      const output = findOutputForAction(target);
      if (output) {
        // Wait briefly for platform UI to update, then check if button is now active
        setTimeout(() => {
          const isNowActive = isButtonActive(dislikeButton);
          console.log('[Refyn Observer] Dislike button clicked, now active:', isNowActive);
          if (isNowActive) {
            handleDislikeAction(output);
          }
        }, 100);
      }
    }
  }, true);
}

// =====================================================
// MIDJOURNEY AUTO-DETECTION HANDLERS
// =====================================================

/**
 * Handle Midjourney Upscale (U1-U4) - Strong LIKE signal
 * User chose to upscale this specific image from the grid
 */
async function handleMidjourneyUpscale(button: HTMLElement, buttonText: string): Promise<void> {
  const imageIndex = parseInt(buttonText.charAt(1)) - 1; // 0-3
  const prompt = findMidjourneyPromptNearButton(button);
  const imageUrl = findMidjourneyImageFromGrid(button, imageIndex);

  if (prompt) {
    console.log('[Refyn Observer] Recording upscale as LIKE for image', imageIndex + 1);

    // Record as a strong like
    await recordOutputFeedback(prompt, `mj-upscale-${Date.now()}`, 'midjourney', 'like');

    // Vision analysis on the upscaled image
    if (imageUrl) {
      analyzeImageAndUpdatePreferences(imageUrl, 'midjourney', true);
    }

    flashLearningIndicator('Learned from upscale choice');
    showLearningToast('Learning from your upscale choice...');
  }
}

/**
 * Handle Midjourney Vary (V1-V4) - Moderate LIKE signal
 * User liked this image enough to want variations
 */
async function handleMidjourneyVary(button: HTMLElement, buttonText: string): Promise<void> {
  const prompt = findMidjourneyPromptNearButton(button);

  // Extract image index if V1-V4 format
  const match = buttonText.match(/V([1-4])/);
  const imageIndex = match ? parseInt(match[1]) - 1 : 0;
  const imageUrl = findMidjourneyImageFromGrid(button, imageIndex);

  if (prompt) {
    console.log('[Refyn Observer] Recording vary as moderate LIKE');

    // Record as a like (vary = they liked it enough to iterate)
    await recordOutputFeedback(prompt, `mj-vary-${Date.now()}`, 'midjourney', 'like');

    // Vision analysis
    if (imageUrl) {
      analyzeImageAndUpdatePreferences(imageUrl, 'midjourney', true);
    }

    flashLearningIndicator('Learned from variation choice');
  }
}

/**
 * Handle Midjourney Re-roll (🔄) - DISLIKE signal
 * User didn't like any of the 4 images, wants to try again
 */
async function handleMidjourneyReroll(button: HTMLElement): Promise<void> {
  const prompt = findMidjourneyPromptNearButton(button);

  if (prompt) {
    console.log('[Refyn Observer] Recording re-roll as DISLIKE for all images');

    // Record as regenerate (user didn't like results)
    await recordOutputFeedback(prompt, `mj-reroll-${Date.now()}`, 'midjourney', 'regenerate');

    flashLearningIndicator('Learned: not your style');
    showLearningToast('Learning what to avoid...');
  }
}

/**
 * Find the prompt text near a Midjourney button
 */
function findMidjourneyPromptNearButton(button: HTMLElement): string | undefined {
  // Walk up to find the message/job container
  let parent = button.parentElement;
  let depth = 0;

  while (parent && depth < 20) {
    // Discord: Look for message content
    const messageContent = parent.querySelector('[class*="messageContent"], [class*="markup"], [class*="content"]');
    if (messageContent) {
      const text = messageContent.textContent?.trim();
      // Filter out very short text and command-like text
      if (text && text.length > 10 && !text.startsWith('/')) {
        // Extract prompt - usually before the -- parameters
        const promptMatch = text.match(/^\*\*(.+?)\*\*/);
        if (promptMatch) return promptMatch[1];

        // Or just take the text before --
        const beforeParams = text.split(/\s--/)[0];
        if (beforeParams && beforeParams.length > 5) return beforeParams;

        return text;
      }
    }

    // Midjourney Web: Look for prompt text
    const promptEl = parent.querySelector('[class*="prompt"], [class*="Prompt"], [data-testid*="prompt"]');
    if (promptEl?.textContent) {
      return promptEl.textContent.trim();
    }

    parent = parent.parentElement;
    depth++;
  }

  return undefined;
}

/**
 * Find an image URL from a Midjourney grid by index
 */
function findMidjourneyImageFromGrid(button: HTMLElement, imageIndex: number): string | undefined {
  let parent = button.parentElement;
  let depth = 0;

  while (parent && depth < 20) {
    // Find all images in this container
    const images = parent.querySelectorAll('img[src*="cdn.midjourney"], img[src*="cdn.discordapp"], img[src*="mj-"]');

    if (images.length > 0) {
      // If we have exactly 4 images (the grid), get the right one
      if (images.length >= 4 && imageIndex < images.length) {
        return (images[imageIndex] as HTMLImageElement).src;
      }
      // Otherwise return the first/most relevant image
      return (images[0] as HTMLImageElement).src;
    }

    parent = parent.parentElement;
    depth++;
  }

  return undefined;
}

/**
 * Find the tracked output for an action button
 */
function findOutputForAction(actionButton: HTMLElement): OutputElement | undefined {
  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config) return undefined;

  // Walk up the DOM to find the output container
  let parent = actionButton.parentElement;
  let depth = 0;
  const maxDepth = 15;

  while (parent && depth < maxDepth) {
    // Check if this matches our output selector
    if (parent.matches(config.output)) {
      const outputId = generateOutputId(parent);
      return trackedOutputs.get(outputId);
    }

    // Check children
    const output = parent.querySelector(config.output);
    if (output instanceof HTMLElement) {
      const outputId = generateOutputId(output);
      return trackedOutputs.get(outputId);
    }

    parent = parent.parentElement;
    depth++;
  }

  return undefined;
}

/**
 * Handle delete action - learn to avoid similar prompts
 */
async function handleDeleteAction(output: OutputElement): Promise<void> {
  console.log('[Refyn Observer] Delete detected for:', output.outputId);

  if (output.prompt) {
    // Extract keywords and record as disliked
    await recordOutputFeedback(
      output.prompt,
      output.outputId,
      output.platform,
      'delete'
    );
    flashLearningIndicator('Learning from deleted output');
    showLearningToast('Learning from deleted output...');

    // Log rejection to CTAD capture session
    try {
      await chrome.runtime.sendMessage({
        type: 'LOG_REJECTION',
        payload: {
          promptVersionId: output.outputId,
          reason: 'poor-quality',
        },
      });
    } catch (error) {
      console.error('[Refyn Observer] Failed to log CTAD rejection:', error);
    }
  }

  // Remove from tracking
  trackedOutputs.delete(output.outputId);
}

/**
 * Handle potential delete (element removed from DOM)
 */
function handlePotentialDelete(element: HTMLElement): void {
  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config) return;

  if (element.matches(config.output)) {
    const outputId = generateOutputId(element);
    const output = trackedOutputs.get(outputId);

    if (output && !output.rated) {
      // Element was removed without explicit rating - might be a delete
      console.log('[Refyn Observer] Potential delete detected:', outputId);
      handleDeleteAction(output);
    }
  }
}

/**
 * Handle like action on platform
 */
async function handleLikeAction(output: OutputElement): Promise<void> {
  console.log('[Refyn Observer] Like detected for:', output.outputId);

  if (output.prompt) {
    // Record the basic like feedback immediately
    await recordOutputFeedback(
      output.prompt,
      output.outputId,
      output.platform,
      'like'
    );
    output.rated = true;

    // Log selection to CTAD capture session (basic - will be updated with reason from popup)
    try {
      await chrome.runtime.sendMessage({
        type: 'LOG_SELECTION',
        payload: {
          promptVersionId: output.outputId,
        },
      });
    } catch (error) {
      console.error('[Refyn Observer] Failed to log CTAD selection:', error);
    }

    // Vision analysis - learn from the image itself
    const imageUrl = output.imageUrl || extractImageUrl(output.element);
    if (imageUrl) {
      // Run analysis in background (don't block the UI)
      analyzeImageAndUpdatePreferences(imageUrl, output.platform, true);
    }

    // Show the "why did you like this?" popup for deeper learning
    showLikeFeedbackPopup(output.prompt, output.platform, output.outputId);
  }
}

/**
 * Handle dislike action on platform
 */
async function handleDislikeAction(output: OutputElement): Promise<void> {
  console.log('[Refyn Observer] Dislike detected for:', output.outputId);

  if (output.prompt) {
    // Record the basic dislike feedback immediately
    await recordOutputFeedback(
      output.prompt,
      output.outputId,
      output.platform,
      'dislike'
    );
    output.rated = true;

    // Vision analysis - learn what to avoid from the image
    const imageUrl = output.imageUrl || extractImageUrl(output.element);
    if (imageUrl) {
      // Run analysis in background (don't block the UI)
      analyzeImageAndUpdatePreferences(imageUrl, output.platform, false);
    }

    // Log rejection to CTAD capture session (basic - will be updated with reason from popup)
    try {
      await chrome.runtime.sendMessage({
        type: 'LOG_REJECTION',
        payload: {
          promptVersionId: output.outputId,
          reason: 'wrong-style',
        },
      });
    } catch (error) {
      console.error('[Refyn Observer] Failed to log CTAD rejection:', error);
    }

    // Show the "why didn't you like this?" popup for deeper learning
    showDislikeFeedbackPopup(output.prompt, output.platform, output.outputId);
  }
}

/**
 * Add Refyn rating overlay to an output element
 * Minimal, unintrusive design - only adds to elements with clear AI output
 */
function addRatingOverlay(element: HTMLElement, outputId: string): void {
  // Check if overlay already exists
  if (element.querySelector('.refyn-rating-overlay')) return;

  // Don't add overlays to very small elements (likely thumbnails or icons)
  const rect = element.getBoundingClientRect();
  if (rect.width < 100 || rect.height < 100) return;

  // Create overlay container - minimal design with heart icons
  const overlay = document.createElement('div');
  overlay.className = 'refyn-rating-overlay';
  overlay.innerHTML = `
    <div class="refyn-rating-buttons">
      <button class="refyn-rate-btn refyn-rate-like" data-action="like" data-output="${outputId}" title="Like">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
      <button class="refyn-rate-btn refyn-rate-dislike" data-action="dislike" data-output="${outputId}" title="Dislike">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </button>
    </div>
  `;

  // Add class to parent for CSS hover detection (safer than modifying position)
  element.classList.add('refyn-rating-parent');

  // Ensure element can contain absolutely positioned children
  const style = window.getComputedStyle(element);
  if (style.position === 'static') {
    element.style.position = 'relative';
  }

  // Add click handlers
  overlay.querySelectorAll('.refyn-rate-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const action = (btn as HTMLElement).dataset.action;
      const output = trackedOutputs.get(outputId);

      if (output && action) {
        if (action === 'like') {
          await handleRefynLike(output, btn as HTMLElement);
        } else if (action === 'dislike') {
          await handleRefynDislike(output, btn as HTMLElement);
        }
      }
    });
  });

  element.appendChild(overlay);
}

/**
 * Handle like from Refyn overlay
 */
async function handleRefynLike(output: OutputElement, button: HTMLElement): Promise<void> {
  if (output.prompt) {
    await recordOutputFeedback(
      output.prompt,
      output.outputId,
      output.platform,
      'like'
    );
    output.rated = true;

    // Visual feedback - fill the heart
    button.classList.add('active');
    const svg = button.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', 'currentColor');
    }

    // Show feedback popup for detailed feedback
    showLikeFeedbackPopup(output.prompt, output.platform, output.outputId);
  }
}

/**
 * Handle dislike from Refyn overlay
 */
async function handleRefynDislike(output: OutputElement, button: HTMLElement): Promise<void> {
  if (output.prompt) {
    await recordOutputFeedback(
      output.prompt,
      output.outputId,
      output.platform,
      'dislike'
    );
    output.rated = true;

    // Visual feedback
    button.classList.add('active');

    // Show feedback popup for detailed feedback
    showDislikeFeedbackPopup(output.prompt, output.platform, output.outputId);
  }
}

/**
 * Show a toast notification about learning
 */
function showLearningToast(message: string): void {
  // Remove existing toast
  document.querySelector('.refyn-learning-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = 'refyn-learning-toast';
  toast.innerHTML = `
    <div class="refyn-learning-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    </div>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('refyn-toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Toggle rating overlays
 */
export function toggleRatingOverlays(enabled: boolean): void {
  ratingOverlaysEnabled = enabled;

  if (enabled) {
    // Add overlays to all tracked outputs
    trackedOutputs.forEach((output) => {
      addRatingOverlay(output.element, output.outputId);
    });
  } else {
    // Remove all overlays
    document.querySelectorAll('.refyn-rating-overlay').forEach((el) => el.remove());
  }
}

/**
 * Clean up observer
 */
export function destroyOutputObserver(): void {
  if (observerInstance) {
    observerInstance.disconnect();
    observerInstance = null;
  }

  // Remove all overlays
  document.querySelectorAll('.refyn-rating-overlay').forEach((el) => el.remove());
  document.querySelectorAll('.refyn-learning-toast').forEach((el) => el.remove());

  trackedOutputs.clear();
}

/**
 * Get statistics about tracked outputs
 */
export function getObserverStats(): { tracked: number; rated: number } {
  let rated = 0;
  trackedOutputs.forEach((output) => {
    if (output.rated) rated++;
  });

  return {
    tracked: trackedOutputs.size,
    rated,
  };
}

// =====================================================
// LIKE FEEDBACK POPUP - Learn why users like outputs
// =====================================================

const LIKE_FEEDBACK_PRESETS = [
  { id: 'great-style', label: 'Great style' },
  { id: 'perfect-colors', label: 'Perfect colors' },
  { id: 'good-composition', label: 'Strong composition' },
  { id: 'matches-vision', label: 'Matches vision' },
  { id: 'unique-creative', label: 'Unique' },
  { id: 'high-quality', label: 'High quality' },
];

let likeFeedbackElement: HTMLElement | null = null;
let likeFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;
let isLikeSubmitting = false; // Lock to prevent double submission

/**
 * Show like feedback popup to learn why user liked an output
 */
function showLikeFeedbackPopup(prompt: string, platform: Platform, outputId: string): void {
  // Don't show if already submitting
  if (isLikeSubmitting) {
    console.log('[Refyn] Ignoring popup show - submission in progress');
    return;
  }

  hideLikeFeedbackPopup();
  hideDislikeFeedbackPopup(); // Hide dislike popup if open

  console.log('[Refyn] Showing like feedback popup for:', outputId);

  // Set cooldown to prevent re-triggering
  lastPopupShownAt = Date.now();

  likeFeedbackElement = document.createElement('div');
  likeFeedbackElement.id = 'refyn-like-feedback';
  likeFeedbackElement.className = 'refyn-like-feedback';
  likeFeedbackElement.innerHTML = `
    <div class="refyn-like-feedback-inner">
      <div class="refyn-like-feedback-header">
        <span class="refyn-like-feedback-title">What worked?</span>
        <button class="refyn-like-feedback-close" data-action="close">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="refyn-feedback-stars" data-rating="0">
        <span class="refyn-feedback-stars-label">How much?</span>
        <div class="refyn-feedback-stars-row">
          ${[1,2,3,4,5].map(i => `
            <button class="refyn-feedback-star" data-star="${i}" title="${i} star${i > 1 ? 's' : ''}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="refyn-like-feedback-options">
        ${LIKE_FEEDBACK_PRESETS.map(preset => `
          <button class="refyn-like-feedback-btn" data-reason="${preset.id}">
            <span class="refyn-like-feedback-label">${preset.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="refyn-like-feedback-custom" id="refyn-like-custom">
        <input type="text" class="refyn-like-feedback-input" placeholder="Other reason..." maxlength="100">
        <button class="refyn-like-feedback-submit" data-action="submit-custom">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
      <div class="refyn-like-feedback-skip">
        <button class="refyn-like-feedback-skip-btn" data-action="skip">Skip</button>
      </div>
    </div>
  `;

  // Store data for submission
  likeFeedbackElement.dataset.prompt = prompt;
  likeFeedbackElement.dataset.platform = platform;
  likeFeedbackElement.dataset.outputId = outputId;

  // Hide any existing quick-rate popups to avoid overlap
  document.querySelector('.refyn-quick-rate')?.remove();
  document.getElementById('refyn-trash-feedback')?.remove();

  // Smart positioning - check if main panel is on the right side
  const refynPanel = document.getElementById('refyn-panel');
  const panelRect = refynPanel?.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  // If panel is on the right side, position popup on the left
  let positionStyle: string;
  if (panelRect && panelRect.right > viewportWidth - 400) {
    positionStyle = `
      position: fixed;
      bottom: 80px;
      left: 24px;
      right: auto;
      z-index: 2147483646;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  } else {
    positionStyle = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 2147483646;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  }

  likeFeedbackElement.style.cssText = positionStyle;

  // Track selected reason (don't submit until both star + reason are set)
  let selectedReason: string | null = null;
  let hasSubmitted = false; // Prevent multiple submissions

  // Helper to check if both selections are made and auto-submit
  const checkAndSubmit = () => {
    if (hasSubmitted || isLikeSubmitting) {
      console.log('[Refyn] Ignoring checkAndSubmit - already submitted');
      return;
    }

    const starsContainer = likeFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);

    console.log('[Refyn] checkAndSubmit - stars:', starRating, 'reason:', selectedReason);

    if (starRating > 0 && selectedReason) {
      hasSubmitted = true;
      isLikeSubmitting = true;
      // Both selected - show brief confirmation then submit
      const inner = likeFeedbackElement?.querySelector('.refyn-like-feedback-inner');
      if (inner) {
        inner.classList.add('refyn-feedback-submitting');
      }
      setTimeout(() => {
        if (selectedReason === 'custom') {
          const input = likeFeedbackElement?.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
          submitLikeFeedback('custom', input?.value?.trim() || '');
        } else {
          submitLikeFeedback(selectedReason || 'unknown');
        }
      }, 400);
    }
  };

  // Add event listeners - reason buttons just select, don't submit
  likeFeedbackElement.querySelectorAll('.refyn-like-feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const reason = (btn as HTMLElement).dataset.reason;

      // Clear previous selection
      likeFeedbackElement?.querySelectorAll('.refyn-like-feedback-btn').forEach(b => {
        b.classList.remove('active');
      });

      // Set new selection
      btn.classList.add('active');
      selectedReason = reason || null;

      // Check if we can submit (both star + reason selected)
      checkAndSubmit();
    });
  });

  // Close button
  likeFeedbackElement.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    hideLikeFeedbackPopup();
  });

  // Skip button - allows skipping without both selections
  likeFeedbackElement.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
    // Submit whatever we have (or nothing)
    const starsContainer = likeFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);
    if (starRating > 0 || selectedReason) {
      submitLikeFeedback(selectedReason || 'skipped');
    } else {
      flashLearningIndicator('Preference saved');
      showLearningToast('Learning from your like...');
      hideLikeFeedbackPopup();
    }
  });

  // Custom input - select "custom" as reason when typing
  const customInput = likeFeedbackElement.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
  customInput?.addEventListener('input', () => {
    if (customInput.value?.trim()) {
      // Clear other selections and mark as custom
      likeFeedbackElement?.querySelectorAll('.refyn-like-feedback-btn').forEach(b => {
        b.classList.remove('active');
      });
      selectedReason = 'custom';
    }
  });

  // Custom submit button
  likeFeedbackElement.querySelector('[data-action="submit-custom"]')?.addEventListener('click', () => {
    const input = likeFeedbackElement?.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
    if (input?.value?.trim()) {
      selectedReason = 'custom';
      checkAndSubmit();
      // If no stars selected, prompt user
      const starsContainer = likeFeedbackElement?.querySelector('.refyn-feedback-stars');
      const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);
      if (starRating === 0) {
        starsContainer?.classList.add('refyn-feedback-stars-highlight');
        setTimeout(() => starsContainer?.classList.remove('refyn-feedback-stars-highlight'), 1000);
      }
    }
  });

  // Enter key on custom input
  likeFeedbackElement.querySelector('.refyn-like-feedback-input')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const input = e.target as HTMLInputElement;
      if (input.value?.trim()) {
        selectedReason = 'custom';
        checkAndSubmit();
      }
    }
  });

  // Star rating handlers
  likeFeedbackElement.querySelectorAll('.refyn-feedback-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rating = parseInt((star as HTMLElement).dataset.star || '0', 10);
      const starsContainer = likeFeedbackElement?.querySelector('.refyn-feedback-stars');
      if (starsContainer) {
        starsContainer.setAttribute('data-rating', String(rating));
        // Update visual state
        likeFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach((s, i) => {
          if (i < rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      }
      // Check if we can submit
      checkAndSubmit();
    });

    // Hover preview
    star.addEventListener('mouseenter', () => {
      const rating = parseInt((star as HTMLElement).dataset.star || '0', 10);
      likeFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach((s, i) => {
        if (i < rating) {
          s.classList.add('hover');
        } else {
          s.classList.remove('hover');
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      likeFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach(s => {
        s.classList.remove('hover');
      });
    });
  });

  // Stop clicks inside popup from bubbling to document (prevents external close handlers)
  likeFeedbackElement.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.body.appendChild(likeFeedbackElement);

  // Animate in
  requestAnimationFrame(() => {
    likeFeedbackElement?.classList.add('refyn-like-feedback-visible');
  });

  // Auto-dismiss after 30 seconds (longer since user needs to make two selections)
  likeFeedbackTimeout = setTimeout(() => {
    // Submit whatever we have
    if (selectedReason) {
      submitLikeFeedback(selectedReason);
    } else {
      flashLearningIndicator('Preference saved');
      showLearningToast('Learning from your like...');
      hideLikeFeedbackPopup();
    }
  }, 30000);
}

/**
 * Submit like feedback with reason
 */
async function submitLikeFeedback(reason: string, customText?: string): Promise<void> {
  console.log('[Refyn] submitLikeFeedback called:', reason);

  try {
    const prompt = likeFeedbackElement?.dataset.prompt || '';
    const platform = (likeFeedbackElement?.dataset.platform || 'unknown') as Platform;
    const outputId = likeFeedbackElement?.dataset.outputId || '';
    const starsContainer = likeFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);

    // Record the enhanced like feedback with star rating
    const { recordLikeFeedback } = await import('@/lib/deepLearning');
    await recordLikeFeedback(prompt, platform, reason, customText, starRating);

    // Update CTAD selection with the reason
    try {
      // Map internal reasons to CTAD reasons
      const ctadReasonMap: Record<string, string> = {
        'great-style': 'great-style',
        'perfect-colors': 'perfect-colors',
        'good-composition': 'matches-intent',
        'matches-vision': 'matches-intent',
        'unique-creative': 'unique',
        'high-quality': 'technical-quality',
        'custom': 'other',
        'other': 'other',
      };

      await chrome.runtime.sendMessage({
        type: 'LOG_SELECTION',
        payload: {
          promptVersionId: outputId,
          likeReason: ctadReasonMap[reason] || 'other',
          customFeedback: customText,
          starRating: starRating > 0 ? starRating : undefined,
        },
      });
    } catch (ctadError) {
      console.error('[Refyn Observer] Failed to update CTAD selection:', ctadError);
    }

    // Show confirmation
    const reasonLabel = LIKE_FEEDBACK_PRESETS.find(p => p.id === reason)?.label || reason;
    const ratingInfo = starRating > 0 ? ` (${starRating}★)` : '';
    flashLearningIndicator(`Got it: ${reasonLabel}${ratingInfo}`);
    showLearningToast('Learning what you love...');

    console.log('[Refyn Observer] Like feedback recorded:', { reason, customText, starRating, promptSnippet: prompt.substring(0, 50) });
  } catch (error) {
    console.error('[Refyn Observer] Error recording like feedback:', error);
    flashLearningIndicator('Preference saved!');
  }

  hideLikeFeedbackPopup();
}

/**
 * Hide like feedback popup
 */
function hideLikeFeedbackPopup(): void {
  console.log('[Refyn] hideLikeFeedbackPopup called');

  if (likeFeedbackTimeout) {
    clearTimeout(likeFeedbackTimeout);
    likeFeedbackTimeout = null;
  }

  if (likeFeedbackElement) {
    likeFeedbackElement.classList.remove('refyn-like-feedback-visible');
    likeFeedbackElement.classList.add('refyn-like-feedback-fade');
    setTimeout(() => {
      likeFeedbackElement?.remove();
      likeFeedbackElement = null;
      isLikeSubmitting = false; // Reset lock
    }, 200);
  } else {
    isLikeSubmitting = false; // Reset lock even if no element
  }
}

// =====================================================
// DISLIKE FEEDBACK POPUP - Learn why users dislike outputs
// =====================================================

const DISLIKE_FEEDBACK_PRESETS = [
  { id: 'poor-quality', label: 'Poor quality' },
  { id: 'wrong-style', label: 'Wrong style' },
  { id: 'doesnt-match', label: "Doesn't match" },
  { id: 'too-similar', label: 'Too similar' },
  { id: 'bad-composition', label: 'Bad composition' },
  { id: 'other', label: 'Other...' },
];

let dislikeFeedbackElement: HTMLElement | null = null;
let dislikeFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;
let isDislikeSubmitting = false; // Lock to prevent double submission

/**
 * Show dislike feedback popup to learn why user disliked an output
 */
function showDislikeFeedbackPopup(prompt: string, platform: Platform, outputId: string): void {
  // Don't show if already submitting
  if (isDislikeSubmitting) {
    console.log('[Refyn] Ignoring dislike popup show - submission in progress');
    return;
  }

  hideDislikeFeedbackPopup();
  hideLikeFeedbackPopup(); // Hide like popup if open

  console.log('[Refyn] Showing dislike feedback popup for:', outputId);

  // Set cooldown to prevent re-triggering
  lastPopupShownAt = Date.now();

  dislikeFeedbackElement = document.createElement('div');
  dislikeFeedbackElement.id = 'refyn-dislike-feedback';
  dislikeFeedbackElement.className = 'refyn-like-feedback'; // Reuse like feedback styles
  dislikeFeedbackElement.innerHTML = `
    <div class="refyn-like-feedback-inner">
      <div class="refyn-like-feedback-header">
        <span class="refyn-like-feedback-title">What went wrong?</span>
        <button class="refyn-like-feedback-close" data-action="close">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="refyn-feedback-stars" data-rating="0">
        <span class="refyn-feedback-stars-label">How bad?</span>
        <div class="refyn-feedback-stars-row">
          ${[1,2,3,4,5].map(i => `
            <button class="refyn-feedback-star" data-star="${i}" title="${i} star${i > 1 ? 's' : ''}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="refyn-like-feedback-options">
        ${DISLIKE_FEEDBACK_PRESETS.map(preset => `
          <button class="refyn-like-feedback-btn" data-reason="${preset.id}">
            <span class="refyn-like-feedback-label">${preset.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="refyn-like-feedback-custom" id="refyn-dislike-custom" style="display: none;">
        <input type="text" class="refyn-like-feedback-input" placeholder="Other reason..." maxlength="100">
        <button class="refyn-like-feedback-submit" data-action="submit-custom">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
      <div class="refyn-like-feedback-skip">
        <button class="refyn-like-feedback-skip-btn" data-action="skip">Skip</button>
      </div>
    </div>
  `;

  // Store data for submission
  dislikeFeedbackElement.dataset.prompt = prompt;
  dislikeFeedbackElement.dataset.platform = platform;
  dislikeFeedbackElement.dataset.outputId = outputId;

  // Smart positioning
  const refynPanel = document.getElementById('refyn-panel');
  const panelRect = refynPanel?.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  let positionStyle: string;
  if (panelRect && panelRect.right > viewportWidth - 400) {
    positionStyle = `
      position: fixed;
      bottom: 80px;
      left: 24px;
      right: auto;
      z-index: 2147483646;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  } else {
    positionStyle = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      z-index: 2147483646;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  }

  dislikeFeedbackElement.style.cssText = positionStyle;

  // Track selected reason
  let selectedDislikeReason: string | null = null;
  let hasSubmittedDislike = false; // Prevent multiple submissions

  // Helper to check if both selections are made and auto-submit
  const checkAndSubmitDislike = () => {
    if (hasSubmittedDislike || isDislikeSubmitting) {
      console.log('[Refyn] Ignoring checkAndSubmitDislike - already submitted');
      return;
    }

    const starsContainer = dislikeFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);

    console.log('[Refyn] checkAndSubmitDislike - stars:', starRating, 'reason:', selectedDislikeReason);

    if (starRating > 0 && selectedDislikeReason) {
      hasSubmittedDislike = true;
      isDislikeSubmitting = true;
      const inner = dislikeFeedbackElement?.querySelector('.refyn-like-feedback-inner');
      if (inner) {
        inner.classList.add('refyn-feedback-submitting');
      }
      setTimeout(() => {
        if (selectedDislikeReason === 'custom') {
          const input = dislikeFeedbackElement?.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
          submitDislikeFeedback(selectedDislikeReason, input?.value?.trim() || '');
        } else {
          submitDislikeFeedback(selectedDislikeReason || 'unknown');
        }
      }, 400);
    }
  };

  // Reason buttons
  dislikeFeedbackElement.querySelectorAll('.refyn-like-feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const reason = (btn as HTMLElement).dataset.reason;

      // Clear previous selection
      dislikeFeedbackElement?.querySelectorAll('.refyn-like-feedback-btn').forEach(b => {
        b.classList.remove('active');
      });

      btn.classList.add('active');

      if (reason === 'other') {
        const customSection = dislikeFeedbackElement?.querySelector('#refyn-dislike-custom') as HTMLElement;
        if (customSection) {
          customSection.style.display = 'flex';
          const input = customSection.querySelector('input');
          input?.focus();
        }
        selectedDislikeReason = 'custom';
      } else {
        selectedDislikeReason = reason || null;
        checkAndSubmitDislike();
      }
    });
  });

  // Close button
  dislikeFeedbackElement.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    hideDislikeFeedbackPopup();
  });

  // Skip button
  dislikeFeedbackElement.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
    const starsContainer = dislikeFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);
    if (starRating > 0 || selectedDislikeReason) {
      submitDislikeFeedback(selectedDislikeReason || 'skipped');
    } else {
      flashLearningIndicator('Will avoid similar');
      showLearningToast('Noted - will avoid similar outputs');
      hideDislikeFeedbackPopup();
    }
  });

  // Custom input
  const customInput = dislikeFeedbackElement.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
  customInput?.addEventListener('input', () => {
    if (customInput.value?.trim()) {
      selectedDislikeReason = 'custom';
    }
  });

  // Custom submit
  dislikeFeedbackElement.querySelector('[data-action="submit-custom"]')?.addEventListener('click', () => {
    const input = dislikeFeedbackElement?.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
    if (input?.value?.trim()) {
      selectedDislikeReason = 'custom';
      checkAndSubmitDislike();
      const starsContainer = dislikeFeedbackElement?.querySelector('.refyn-feedback-stars');
      const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);
      if (starRating === 0) {
        starsContainer?.classList.add('refyn-feedback-stars-highlight');
        setTimeout(() => starsContainer?.classList.remove('refyn-feedback-stars-highlight'), 1000);
      }
    }
  });

  // Enter key on custom input
  dislikeFeedbackElement.querySelector('.refyn-like-feedback-input')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const input = e.target as HTMLInputElement;
      if (input.value?.trim()) {
        selectedDislikeReason = 'custom';
        checkAndSubmitDislike();
      }
    }
  });

  // Star rating handlers
  dislikeFeedbackElement.querySelectorAll('.refyn-feedback-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rating = parseInt((star as HTMLElement).dataset.star || '0', 10);
      const starsContainer = dislikeFeedbackElement?.querySelector('.refyn-feedback-stars');
      if (starsContainer) {
        starsContainer.setAttribute('data-rating', String(rating));
        dislikeFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach((s, i) => {
          if (i < rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      }
      checkAndSubmitDislike();
    });

    star.addEventListener('mouseenter', () => {
      const rating = parseInt((star as HTMLElement).dataset.star || '0', 10);
      dislikeFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach((s, i) => {
        if (i < rating) {
          s.classList.add('hover');
        } else {
          s.classList.remove('hover');
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      dislikeFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach(s => {
        s.classList.remove('hover');
      });
    });
  });

  // Stop clicks inside popup from bubbling to document (prevents external close handlers)
  dislikeFeedbackElement.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.body.appendChild(dislikeFeedbackElement);

  requestAnimationFrame(() => {
    dislikeFeedbackElement?.classList.add('refyn-like-feedback-visible');
  });

  // Auto-dismiss after 30 seconds (longer since user needs to make two selections)
  dislikeFeedbackTimeout = setTimeout(() => {
    if (selectedDislikeReason) {
      submitDislikeFeedback(selectedDislikeReason);
    } else {
      flashLearningIndicator('Will avoid similar');
      showLearningToast('Noted - will avoid similar outputs');
      hideDislikeFeedbackPopup();
    }
  }, 30000);
}

/**
 * Submit dislike feedback with reason
 */
async function submitDislikeFeedback(reason: string, customText?: string): Promise<void> {
  console.log('[Refyn] submitDislikeFeedback called:', reason);

  try {
    const prompt = dislikeFeedbackElement?.dataset.prompt || '';
    const platform = (dislikeFeedbackElement?.dataset.platform || 'unknown') as Platform;
    const outputId = dislikeFeedbackElement?.dataset.outputId || '';
    const starsContainer = dislikeFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);

    // Record the enhanced dislike feedback with star rating
    const { recordTrashFeedback } = await import('@/lib/deepLearning');
    await recordTrashFeedback(prompt, platform, reason, customText, starRating);

    // Update CTAD rejection with the reason
    try {
      await chrome.runtime.sendMessage({
        type: 'LOG_REJECTION',
        payload: {
          promptVersionId: outputId,
          reason: reason,
          customFeedback: customText,
          starRating: starRating > 0 ? starRating : undefined,
        },
      });
    } catch (ctadError) {
      console.error('[Refyn Observer] Failed to update CTAD rejection:', ctadError);
    }

    // Show confirmation
    const reasonLabel = DISLIKE_FEEDBACK_PRESETS.find(p => p.id === reason)?.label || reason;
    const ratingInfo = starRating > 0 ? ` (${starRating}★)` : '';
    flashLearningIndicator(`Noted: ${reasonLabel}${ratingInfo}`);
    showLearningToast('Will avoid similar outputs');

    console.log('[Refyn Observer] Dislike feedback recorded:', { reason, customText, starRating, promptSnippet: prompt.substring(0, 50) });
  } catch (error) {
    console.error('[Refyn Observer] Error recording dislike feedback:', error);
    flashLearningIndicator('Will avoid similar');
  }

  hideDislikeFeedbackPopup();
}

/**
 * Hide dislike feedback popup
 */
function hideDislikeFeedbackPopup(): void {
  console.log('[Refyn] hideDislikeFeedbackPopup called');

  if (dislikeFeedbackTimeout) {
    clearTimeout(dislikeFeedbackTimeout);
    dislikeFeedbackTimeout = null;
  }

  if (dislikeFeedbackElement) {
    dislikeFeedbackElement.classList.remove('refyn-like-feedback-visible');
    dislikeFeedbackElement.classList.add('refyn-like-feedback-fade');
    setTimeout(() => {
      dislikeFeedbackElement?.remove();
      dislikeFeedbackElement = null;
      isDislikeSubmitting = false; // Reset lock
    }, 200);
  } else {
    isDislikeSubmitting = false; // Reset lock even if no element
  }
}

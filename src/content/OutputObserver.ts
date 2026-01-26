/**
 * Output Observer - Monitors platform outputs and user actions
 * Learns from user behavior (deletes, likes, dislikes) to improve suggestions
 */

import type { Platform } from '@/shared/types';
import { detectPlatform } from './platformDetector';
import { recordOutputFeedback, linkPromptToOutput } from '@/lib/deepLearning';
import { flashLearningIndicator } from './FloatingPanel';

interface OutputElement {
  element: HTMLElement;
  outputId: string;
  prompt?: string;
  platform: Platform;
  timestamp: number;
  rated: boolean;
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

  // Add rating overlay (users can rate from there instead of popup spam)
  if (ratingOverlaysEnabled) {
    addRatingOverlay(element, outputId);
  }

  // NOTE: Removed automatic quick-rate popup - it was too intrusive
  // Users can rate outputs via the overlay that appears on hover

  console.log('[Refyn Observer] Tracking new output:', outputId, prompt ? '(has prompt)' : '(no prompt)');
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
 * Set up listeners for platform action buttons (like, dislike, delete)
 */
function setupActionListeners(): void {
  const config = OUTPUT_SELECTORS[currentPlatform];
  if (!config) return;

  // Use event delegation for efficiency
  document.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Check for delete button clicks
    if (config.deleteBtn && target.closest(config.deleteBtn)) {
      const output = findOutputForAction(target);
      if (output) {
        handleDeleteAction(output);
      }
    }

    // Check for like button clicks
    if (config.likeBtn && target.closest(config.likeBtn)) {
      const output = findOutputForAction(target);
      if (output) {
        handleLikeAction(output);
      }
    }

    // Check for dislike button clicks
    if (config.dislikeBtn && target.closest(config.dislikeBtn)) {
      const output = findOutputForAction(target);
      if (output) {
        handleDislikeAction(output);
      }
    }
  }, true);
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
    await recordOutputFeedback(
      output.prompt,
      output.outputId,
      output.platform,
      'dislike'
    );
    output.rated = true;
    flashLearningIndicator('Will avoid similar');
    showLearningToast('Noted - will avoid similar outputs');

    // Log rejection to CTAD capture session
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
  }
}

/**
 * Add Refyn rating overlay to an output element
 */
function addRatingOverlay(element: HTMLElement, outputId: string): void {
  // Check if overlay already exists
  if (element.querySelector('.refyn-rating-overlay')) return;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = 'refyn-rating-overlay';
  overlay.innerHTML = `
    <div class="refyn-rating-buttons">
      <button class="refyn-rate-btn refyn-rate-like" data-action="like" data-output="${outputId}" title="I like this">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      </button>
      <button class="refyn-rate-btn refyn-rate-dislike" data-action="dislike" data-output="${outputId}" title="I don't like this">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
        </svg>
      </button>
    </div>
    <div class="refyn-rating-label">Rate with Refyn</div>
  `;

  // Position the overlay
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

    // Visual feedback
    button.classList.add('active');
    const overlay = button.closest('.refyn-rating-overlay');
    if (overlay) {
      const label = overlay.querySelector('.refyn-rating-label');
      if (label) {
        label.textContent = 'Preference saved!';
        label.classList.add('refyn-rated');
      }
    }

    showLearningToast('Learning your preferences...');
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
    const overlay = button.closest('.refyn-rating-overlay');
    if (overlay) {
      const label = overlay.querySelector('.refyn-rating-label');
      if (label) {
        label.textContent = 'Will avoid similar';
        label.classList.add('refyn-rated');
      }
    }

    showLearningToast('Noted - adjusting suggestions');
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

/**
 * Show like feedback popup to learn why user liked an output
 */
function showLikeFeedbackPopup(prompt: string, platform: Platform, outputId: string): void {
  hideLikeFeedbackPopup();

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

  // Position in bottom right corner
  likeFeedbackElement.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 2147483647;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  // Add event listeners
  likeFeedbackElement.querySelectorAll('.refyn-like-feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const reason = (btn as HTMLElement).dataset.reason;
      submitLikeFeedback(reason || 'unknown');
    });
  });

  // Close button
  likeFeedbackElement.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    hideLikeFeedbackPopup();
  });

  // Skip button
  likeFeedbackElement.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
    flashLearningIndicator('Preference saved');
    showLearningToast('Learning from your like...');
    hideLikeFeedbackPopup();
  });

  // Custom submit
  likeFeedbackElement.querySelector('[data-action="submit-custom"]')?.addEventListener('click', () => {
    const input = likeFeedbackElement?.querySelector('.refyn-like-feedback-input') as HTMLInputElement;
    if (input?.value?.trim()) {
      submitLikeFeedback('custom', input.value.trim());
    }
  });

  // Enter key on custom input
  likeFeedbackElement.querySelector('.refyn-like-feedback-input')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const input = e.target as HTMLInputElement;
      if (input.value?.trim()) {
        submitLikeFeedback('custom', input.value.trim());
      }
    }
  });

  document.body.appendChild(likeFeedbackElement);

  // Animate in
  requestAnimationFrame(() => {
    likeFeedbackElement?.classList.add('refyn-like-feedback-visible');
  });

  // Auto-dismiss after 10 seconds
  likeFeedbackTimeout = setTimeout(() => {
    flashLearningIndicator('Preference saved');
    showLearningToast('Learning from your like...');
    hideLikeFeedbackPopup();
  }, 10000);
}

/**
 * Submit like feedback with reason
 */
async function submitLikeFeedback(reason: string, customText?: string): Promise<void> {
  try {
    const prompt = likeFeedbackElement?.dataset.prompt || '';
    const platform = (likeFeedbackElement?.dataset.platform || 'unknown') as Platform;
    const outputId = likeFeedbackElement?.dataset.outputId || '';

    // Record the enhanced like feedback
    const { recordLikeFeedback } = await import('@/lib/deepLearning');
    await recordLikeFeedback(prompt, platform, reason, customText);

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
        },
      });
    } catch (ctadError) {
      console.error('[Refyn Observer] Failed to update CTAD selection:', ctadError);
    }

    // Show confirmation
    const reasonLabel = LIKE_FEEDBACK_PRESETS.find(p => p.id === reason)?.label || reason;
    flashLearningIndicator(`Got it: ${reasonLabel}`);
    showLearningToast('Learning what you love...');

    console.log('[Refyn Observer] Like feedback recorded:', { reason, customText, promptSnippet: prompt.substring(0, 50) });
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
    }, 200);
  }
}

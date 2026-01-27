import { detectPlatform, findPromptInputs, getInputText, setInputText, getPlatformInputSelector } from './platformDetector';
import type { Platform, OptimizationMode, ThemeRemixId } from '@/shared/types';
import { PLATFORMS, THEME_REMIXES, THEME_REMIX_IDS } from '@/shared/constants';
import { recordFeedback, getPreferenceContext } from '@/lib/preferences';
import { getSuggestedKeywords, getKeywordsToAvoid, getSmartSuggestionContext } from '@/lib/deepLearning';
import { getQuickQuality } from '@/lib/promptAnalyzer';

let panel: HTMLElement | null = null;
let isMinimized = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentPlatform: Platform = 'unknown';
let selectedMode: OptimizationMode = 'crazy';
let selectedPreset: string | null = null;
let selectedTheme: ThemeRemixId = null;
let lastOriginalPrompt = '';
let lastRefinedPrompt = '';
let isMoodboardMode = false;
let chaosIntensity = 0;
let variationIntensity = 50; // Controls how much each re-refine diverges from previous
let activeTab: 'refyn' | 'library' | 'profile' = 'refyn';
let savedPrompts: Array<{
  id: string;
  content: string;
  platform: string;
  createdAt: string;
  rating?: number;
  liked?: boolean;
  outputImageUrl?: string;
  referenceImages?: string[];
  imagePrompts?: string[];
  extractedParams?: Record<string, string | undefined>;
  aiFeedback?: {score: number; strengths: string[]; improvements: string[]; analyzedAt: string};
}> = [];
let tasteProfile: {visual?: {style?: string[]; lighting?: string[]}; patterns?: {frequentKeywords?: Record<string, number>}} | null = null;

// =====================================================
// PROMPT PARSING UTILITIES
// =====================================================

/**
 * Extract image URLs from a prompt (image prompts at start, --sref, --cref)
 */
function extractImageReferences(prompt: string): { imagePrompts: string[]; referenceImages: string[] } {
  const imagePrompts: string[] = [];
  const referenceImages: string[] = [];

  // Match URLs at the start of prompt (image-to-image)
  const urlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?/gi;
  const startMatches = prompt.match(urlRegex);
  if (startMatches) {
    // URLs before any text are likely image prompts
    const firstTextIndex = prompt.search(/[a-zA-Z]{3,}/);
    startMatches.forEach(url => {
      const urlIndex = prompt.indexOf(url);
      if (urlIndex < firstTextIndex || firstTextIndex === -1) {
        imagePrompts.push(url);
      }
    });
  }

  // Match --sref URLs (style reference)
  const srefMatch = prompt.match(/--sref\s+(https?:\/\/[^\s]+)/gi);
  if (srefMatch) {
    srefMatch.forEach(match => {
      const url = match.replace(/--sref\s+/i, '');
      referenceImages.push(url);
    });
  }

  // Match --cref URLs (character reference)
  const crefMatch = prompt.match(/--cref\s+(https?:\/\/[^\s]+)/gi);
  if (crefMatch) {
    crefMatch.forEach(match => {
      const url = match.replace(/--cref\s+/i, '');
      referenceImages.push(url);
    });
  }

  return { imagePrompts, referenceImages };
}

/**
 * Extract Midjourney parameters from a prompt
 */
function extractMidjourneyParams(prompt: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Common parameters
  const paramPatterns: [string, RegExp][] = [
    ['ar', /--ar\s+(\d+:\d+)/i],
    ['v', /--v\s+([\d.]+)/i],
    ['seed', /--seed\s+(\d+)/i],
    ['stylize', /--stylize\s+(\d+)/i],
    ['s', /--s\s+(\d+)/i],
    ['chaos', /--chaos\s+(\d+)/i],
    ['c', /--c\s+(\d+)/i],
    ['weird', /--weird\s+(\d+)/i],
    ['w', /--w\s+(\d+)/i],
    ['style', /--style\s+(\w+)/i],
    ['q', /--q\s+([\d.]+)/i],
    ['tile', /--tile/i],
    ['no', /--no\s+([^-]+?)(?=--|$)/i],
    ['p', /--p(?:ersonalize)?/i],
  ];

  paramPatterns.forEach(([name, pattern]) => {
    const match = prompt.match(pattern);
    if (match) {
      params[name] = match[1] || 'true';
    }
  });

  // Normalize stylize (--s is shorthand)
  if (params.s && !params.stylize) params.stylize = params.s;
  if (params.c && !params.chaos) params.chaos = params.c;
  if (params.w && !params.weird) params.weird = params.w;

  return params;
}

/**
 * Try to find the output image URL from the page (Midjourney Discord)
 */
function findOutputImageOnPage(): string | null {
  // For Midjourney on Discord, look for the most recently generated image
  // This is a best-effort approach

  // Look for images in Discord message content
  const discordImages = document.querySelectorAll('a[href*="cdn.discordapp.com"][href*=".png"], a[href*="cdn.discordapp.com"][href*=".jpg"], a[href*="cdn.discordapp.com"][href*=".webp"]');
  if (discordImages.length > 0) {
    const lastImage = discordImages[discordImages.length - 1] as HTMLAnchorElement;
    return lastImage.href;
  }

  // Look for Midjourney CDN images
  const mjImages = document.querySelectorAll('img[src*="cdn.midjourney.com"]');
  if (mjImages.length > 0) {
    const lastImage = mjImages[mjImages.length - 1] as HTMLImageElement;
    return lastImage.src;
  }

  return null;
}

// Live sync state
let isLiveSyncEnabled = true;
let trackedInput: HTMLElement | null = null;
let inputObserver: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_DELAY = 150; // ms

const PANEL_ID = 'refyn-floating-panel';

/**
 * Strip --weird parameter from Midjourney prompts for moodboard compatibility
 * Matches: --weird [number], --w [number], --weird[number], --w[number]
 */
function stripWeirdParameter(prompt: string): string {
  // Match --weird or --w followed by optional space and a number
  return prompt
    .replace(/\s*--weird\s*\d+/gi, '')
    .replace(/\s*--w\s+\d+/gi, '')
    .replace(/\s*--w\d+/gi, '')
    .trim()
    .replace(/\s+/g, ' '); // Clean up any double spaces
}

export function createFloatingPanel(): void {
  if (document.getElementById(PANEL_ID)) return;

  currentPlatform = detectPlatform();

  // Only show on supported platforms
  if (currentPlatform === 'unknown') return;

  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = generatePanelHTML();

  // Set initial position (bottom right)
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483646;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  document.body.appendChild(panel);

  // Add event listeners
  setupEventListeners();

  // Restore position from localStorage
  restorePosition();

  // Restore minimized state
  const wasMinimized = localStorage.getItem('refyn-panel-minimized') === 'true';
  if (wasMinimized && !isMinimized) {
    // Use setTimeout to ensure panel is fully rendered before minimizing
    setTimeout(() => toggleMinimize(), 100);
  }

  // Start live sync
  if (isLiveSyncEnabled) {
    startLiveSync();
  }

  console.log('[Refyn] Floating panel initialized for:', currentPlatform);
}

// Smart suggestions section (populated dynamically)
async function loadSmartSuggestions(): Promise<void> {
  const suggestionsContainer = panel?.querySelector('#refyn-suggestions-content');
  if (!suggestionsContainer) return;

  try {
    // Get more keywords for better suggestions
    const [suggested, avoid] = await Promise.all([
      getSuggestedKeywords(currentPlatform, 10),
      getKeywordsToAvoid(currentPlatform, 8),
    ]);

    if (suggested.length === 0 && avoid.length === 0) {
      // No preferences learned yet
      suggestionsContainer.innerHTML = `
        <span class="refyn-no-suggestions">Rate some outputs to see personalized suggestions</span>
      `;
      return;
    }

    let html = '';

    // Keywords You Like section
    if (suggested.length > 0) {
      html += `<div class="refyn-suggestion-section">
        <span class="refyn-suggestion-section-label refyn-like-label">Keywords You Like</span>
        <div class="refyn-suggestion-chips">`;
      for (const s of suggested) {
        html += `
          <button class="refyn-suggestion-chip refyn-like" data-keyword="${s.keyword}" title="Score: ${s.score.toFixed(1)} | Click to add">
            <span class="refyn-suggestion-add">+</span>
            ${s.keyword}
          </button>
        `;
      }
      html += `</div></div>`;
    }

    // Keywords to Avoid section
    if (avoid.length > 0) {
      html += `<div class="refyn-suggestion-section">
        <span class="refyn-suggestion-section-label refyn-avoid-label">Keywords to Avoid</span>
        <div class="refyn-suggestion-chips">`;
      for (const a of avoid) {
        html += `
          <button class="refyn-suggestion-chip refyn-avoid" data-avoid="${a.keyword}" title="Score: ${a.score.toFixed(1)} | System avoids this">
            <span class="refyn-suggestion-remove">-</span>
            ${a.keyword}
          </button>
        `;
      }
      html += `</div></div>`;
    }

    suggestionsContainer.innerHTML = html;

    // Add click handlers for liked keywords
    suggestionsContainer.querySelectorAll('.refyn-suggestion-chip[data-keyword]').forEach(chip => {
      chip.addEventListener('click', () => {
        const keyword = (chip as HTMLElement).dataset.keyword;
        if (keyword) {
          addKeywordToPrompt(keyword);
        }
      });
    });
  } catch (error) {
    console.log('[Refyn] Could not load smart suggestions:', error);
    suggestionsContainer.innerHTML = '';
  }
}

function addKeywordToPrompt(keyword: string): void {
  const textarea = panel?.querySelector('#refyn-input') as HTMLTextAreaElement;
  if (!textarea) return;

  const currentValue = textarea.value.trim();
  if (currentValue.toLowerCase().includes(keyword.toLowerCase())) {
    showToast('Already in prompt');
    return;
  }

  // Add keyword to the prompt
  if (currentValue) {
    textarea.value = `${currentValue}, ${keyword}`;
  } else {
    textarea.value = keyword;
  }

  updateCharCount(textarea.value.length);
  showToast(`Added: ${keyword}`);
}

function generatePanelHTML(): string {
  const platformInfo = PLATFORMS[currentPlatform] || PLATFORMS.unknown;

  return `
    <div class="refyn-panel-container ${isMinimized ? 'refyn-minimized' : ''}">
      <!-- Compact Header -->
      <div class="refyn-panel-header" id="refyn-drag-handle">
        <div class="refyn-panel-logo">
          <div class="refyn-logo-icon">R</div>
          <span class="refyn-logo-text">Refyn</span>
        </div>
        <div class="refyn-panel-platform">
          <span class="refyn-platform-dot" style="background: ${platformInfo.color}"></span>
          <span class="refyn-platform-name">${platformInfo.name}</span>
        </div>
        <div class="refyn-panel-controls">
          <button class="refyn-control-btn" id="refyn-open-popup-btn" title="Open Extension">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          <button class="refyn-control-btn" id="refyn-minimize-btn" title="${isMinimized ? 'Expand' : 'Minimize'}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isMinimized
                ? '<polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>'
                : '<line x1="5" y1="12" x2="19" y2="12"></line>'
              }
            </svg>
          </button>
          <button class="refyn-control-btn" id="refyn-close-btn" title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="refyn-tabs">
        <button class="refyn-tab ${activeTab === 'refyn' ? 'active' : ''}" data-tab="refyn">Refyn</button>
        <button class="refyn-tab ${activeTab === 'library' ? 'active' : ''}" data-tab="library">Library</button>
        <button class="refyn-tab ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">Profile</button>
      </div>

      <!-- Body (hidden when minimized) -->
      <div class="refyn-panel-body" id="refyn-panel-body">
        <!-- REFYN TAB CONTENT -->
        <div class="refyn-tab-content ${activeTab === 'refyn' ? 'active' : ''}" id="refyn-tab-refyn">
          <!-- Compact Controls Row -->
          <div class="refyn-compact-row">
            <div class="refyn-sync-mini">
              <span class="refyn-sync-dot ${isLiveSyncEnabled ? 'refyn-sync-active' : ''}" id="refyn-sync-dot"></span>
              <button class="refyn-sync-toggle-mini ${isLiveSyncEnabled ? 'active' : ''}" id="refyn-sync-toggle" title="Toggle live sync">
                ${isLiveSyncEnabled ? 'Synced' : 'Sync'}
              </button>
            </div>
            ${currentPlatform === 'midjourney' ? `
            <label class="refyn-moodboard-mini">
              <input type="checkbox" id="refyn-moodboard-checkbox" ${isMoodboardMode ? 'checked' : ''}>
              <span>Moodboard</span>
            </label>
            ` : ''}
          </div>

          <!-- Sliders Section -->
          <div class="refyn-sliders-section">
            <!-- Chaos Slider -->
            <div class="refyn-slider-row">
              <div class="refyn-slider-label">
                <span class="refyn-slider-name">Chaos</span>
                <span class="refyn-chaos-level" id="refyn-chaos-level">Clean</span>
              </div>
              <input type="range" min="0" max="100" value="${chaosIntensity}" class="refyn-chaos-slider" id="refyn-chaos-slider">
            </div>
            <!-- Variation Slider -->
            <div class="refyn-slider-row">
              <div class="refyn-slider-label">
                <span class="refyn-slider-name">Variation</span>
                <span class="refyn-variation-level" id="refyn-variation-level">Medium</span>
              </div>
              <input type="range" min="0" max="100" value="${variationIntensity}" class="refyn-variation-slider" id="refyn-variation-slider">
            </div>
          </div>

          <!-- Mode Selector (Compact) -->
          <div class="refyn-mode-selector-compact">
          <button class="refyn-mode-btn ${selectedMode === 'enhance' ? 'active' : ''}" data-mode="enhance" title="Improve clarity and detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Enhance
          </button>
          <button class="refyn-mode-btn ${selectedMode === 'expand' ? 'active' : ''}" data-mode="expand" title="Add more details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            Expand
          </button>
          <button class="refyn-mode-btn ${selectedMode === 'style' ? 'active' : ''}" data-mode="style" title="Add style references">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="13.5" cy="6.5" r="2.5"></circle>
              <circle cx="19" cy="17" r="2"></circle>
              <circle cx="6" cy="12" r="3"></circle>
            </svg>
            Style+
          </button>
          <button class="refyn-mode-btn ${selectedMode === 'params' ? 'active' : ''}" data-mode="params" title="Add parameters">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Params
          </button>
          <button class="refyn-mode-btn refyn-mode-crazy ${selectedMode === 'crazy' ? 'active' : ''}" data-mode="crazy" title="Hidden platform tricks & magic triggers">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Crazy
          </button>
        </div>

        <!-- Theme Remix Section -->
        <div class="refyn-theme-section">
          <div class="refyn-theme-header">
            <span class="refyn-theme-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              Theme Remix
            </span>
            <button class="refyn-theme-shuffle" id="refyn-theme-shuffle" title="Random theme">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 3 21 3 21 8"></polyline>
                <line x1="4" y1="20" x2="21" y2="3"></line>
                <polyline points="21 16 21 21 16 21"></polyline>
                <line x1="15" y1="15" x2="21" y2="21"></line>
                <line x1="4" y1="4" x2="9" y2="9"></line>
              </svg>
            </button>
          </div>
          <div class="refyn-theme-chips" id="refyn-theme-chips">
            ${THEME_REMIX_IDS.map(id => {
              const theme = THEME_REMIXES[id];
              return `<button class="refyn-theme-chip ${selectedTheme === id ? 'active' : ''}" data-theme="${id}" title="${theme.description}">
                <span class="refyn-theme-name">${theme.name}</span>
              </button>`;
            }).join('')}
          </div>
        </div>

        <!-- Input Area (Compact) -->
        <div class="refyn-input-compact">
          <textarea id="refyn-input" class="refyn-textarea-compact" placeholder="Type your prompt or it syncs from the page..." rows="2"></textarea>
          <div class="refyn-input-actions-mini">
            <button class="refyn-input-action-btn" id="refyn-save-input" title="Save to Library">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
            <button class="refyn-input-action-btn" id="refyn-grab-prompt" title="Grab from page">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Action Button -->
        <button class="refyn-action-btn" id="refyn-refine-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span>Refyn It</span>
        </button>

        <!-- Output Area -->
        <div class="refyn-output-section" id="refyn-output-section" style="display: none;">
          <div class="refyn-output-header">
            <span>Refined Prompt</span>
            <button class="refyn-small-btn" id="refyn-save-btn" title="Save to Library">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          </div>
          <div id="refyn-output" class="refyn-output-text"></div>

          <!-- Prominent Action Buttons -->
          <div class="refyn-output-actions-main">
            <button class="refyn-action-btn-secondary" id="refyn-copy-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
            <button class="refyn-action-btn-primary" id="refyn-insert-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Use Prompt
            </button>
          </div>

          <!-- Feedback Section -->
          <div class="refyn-feedback-section">
            <span class="refyn-feedback-label">Rate this:</span>
            <div class="refyn-feedback-buttons">
              <button class="refyn-feedback-btn refyn-feedback-like" id="refyn-like-btn" title="I like this">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </button>
              <button class="refyn-feedback-btn refyn-feedback-dislike" id="refyn-dislike-btn" title="I don't like this">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                </svg>
              </button>
              <button class="refyn-feedback-btn refyn-feedback-regen" id="refyn-regen-btn" title="Try again">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div class="refyn-loading" id="refyn-loading" style="display: none;">
          <div class="refyn-spinner"></div>
          <span>Refining your prompt...</span>
        </div>

        <!-- Error State -->
        <div class="refyn-error" id="refyn-error" style="display: none;"></div>

        </div><!-- End Refyn Tab -->

        <!-- LIBRARY TAB CONTENT -->
        <div class="refyn-tab-content ${activeTab === 'library' ? 'active' : ''}" id="refyn-tab-library">
          <div class="refyn-library-header">
            <span class="refyn-library-count" id="refyn-library-count">0 saved prompts</span>
            <button class="refyn-refresh-btn" id="refyn-refresh-library" title="Refresh">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          </div>
          <div class="refyn-library-list" id="refyn-library-list">
            <div class="refyn-library-empty">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>No saved prompts</span>
            </div>
          </div>
        </div>

        <!-- PROFILE TAB CONTENT -->
        <div class="refyn-tab-content ${activeTab === 'profile' ? 'active' : ''}" id="refyn-tab-profile">
          <!-- Account Section -->
          <div class="refyn-profile-section refyn-account-section" id="refyn-account-section">
            <div class="refyn-profile-header">
              <span>Account</span>
              <div id="refyn-sync-status" class="refyn-sync-indicator"></div>
            </div>
            <div id="refyn-auth-content">
              <!-- Logged out state -->
              <div class="refyn-auth-form" id="refyn-auth-form">
                <input type="email" class="refyn-auth-input" id="refyn-auth-email" placeholder="Email" autocomplete="email">
                <input type="password" class="refyn-auth-input" id="refyn-auth-password" placeholder="Password" autocomplete="current-password">
                <div class="refyn-auth-buttons">
                  <button class="refyn-auth-btn refyn-auth-login" id="refyn-auth-login">Log In</button>
                  <button class="refyn-auth-btn refyn-auth-signup" id="refyn-auth-signup">Sign Up</button>
                </div>
                <div class="refyn-auth-error" id="refyn-auth-error"></div>
                <div class="refyn-auth-hint">Sync your taste profile across devices</div>
              </div>
              <!-- Logged in state -->
              <div class="refyn-auth-logged-in" id="refyn-auth-logged-in" style="display: none;">
                <div class="refyn-user-info">
                  <div class="refyn-user-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <span class="refyn-user-email" id="refyn-user-email"></span>
                </div>
                <div class="refyn-account-actions">
                  <button class="refyn-sync-btn" id="refyn-sync-btn">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M23 4v6h-6"></path>
                      <path d="M1 20v-6h6"></path>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Sync
                  </button>
                  <button class="refyn-logout-btn" id="refyn-logout-btn">Log Out</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Taste Layers Section -->
          <div class="refyn-profile-section refyn-taste-library-section">
            <div class="refyn-profile-header">
              <span>Taste Layers</span>
              <button class="refyn-apply-layers-btn" id="refyn-apply-layers" title="Apply selected">Apply</button>
            </div>
            <div class="refyn-taste-library-content">
              <div class="refyn-taste-layers" id="refyn-taste-layers">
                <!-- Populated dynamically -->
              </div>
              <div class="refyn-taste-actions">
                <button class="refyn-taste-btn" id="refyn-export-taste" title="Export your taste profile">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export
                </button>
                <button class="refyn-taste-btn" id="refyn-import-taste" title="Import a taste pack">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Import
                </button>
                <input type="file" id="refyn-import-file" accept=".json" style="display: none;">
              </div>
              <div class="refyn-vision-toggle">
                <label class="refyn-toggle-label">
                  <input type="checkbox" id="refyn-vision-analysis" checked>
                  <span>Analyze images when rating</span>
                </label>
                <span class="refyn-vision-hint">Uses AI to learn from visual styles</span>
              </div>
            </div>
          </div>

          <!-- Taste Learning Progress -->
          <div class="refyn-profile-section refyn-taste-progress-section">
            <div class="refyn-profile-header">
              <span>Taste Learning</span>
            </div>
            <div class="refyn-taste-progress" id="refyn-taste-progress">
              <!-- Populated dynamically by renderTasteProgress() -->
              <div class="refyn-progress-loading">Loading...</div>
            </div>
          </div>

          <!-- Midjourney History Import -->
          ${currentPlatform === 'midjourney' ? `
          <div class="refyn-profile-section refyn-import-section">
            <div class="refyn-profile-header">
              <span>Import History</span>
            </div>
            <div class="refyn-import-content">
              <p class="refyn-import-desc">Scan your Midjourney gallery to import past upscales and train your taste profile instantly.</p>
              <button class="refyn-import-btn" id="refyn-import-mj-history">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Scan Gallery & Import
              </button>
              <div class="refyn-import-progress" id="refyn-import-progress" style="display: none;">
                <div class="refyn-import-progress-bar">
                  <div class="refyn-import-progress-fill" id="refyn-import-progress-fill"></div>
                </div>
                <span class="refyn-import-status" id="refyn-import-status">Scanning...</span>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Taste Profile Section -->
          <div class="refyn-profile-section">
            <div class="refyn-profile-header">
              <span>Taste Profile</span>
              <button class="refyn-refresh-btn" id="refyn-refresh-profile" title="Refresh">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6"></path>
                  <path d="M1 20v-6h6"></path>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
            </div>
            <div class="refyn-profile-content" id="refyn-profile-content">
              <div class="refyn-profile-empty">
                <span>Profile builds as you use Refyn</span>
                <span class="refyn-profile-hint">Like/dislike results to train your preferences</span>
              </div>
            </div>
          </div>
          <div class="refyn-profile-stats" id="refyn-profile-stats">
            <div class="refyn-stat-item">
              <span class="refyn-stat-label">Prompts Refined</span>
              <span class="refyn-stat-value" id="refyn-stat-refined">0</span>
            </div>
            <div class="refyn-stat-item">
              <span class="refyn-stat-label">Saved</span>
              <span class="refyn-stat-value" id="refyn-stat-saved">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupEventListeners(): void {
  if (!panel) return;

  // Drag handling
  const dragHandle = panel.querySelector('#refyn-drag-handle') as HTMLElement;
  dragHandle?.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);

  // Click on header to expand when minimized
  dragHandle?.addEventListener('click', (e) => {
    // Only expand if clicking on the header itself, not buttons
    const target = e.target as HTMLElement;
    if (isMinimized && !target.closest('button')) {
      toggleMinimize();
    }
  });

  // Tab navigation
  panel.querySelectorAll('.refyn-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const tabName = (tab as HTMLElement).dataset.tab as 'refyn' | 'library' | 'profile';
      switchTab(tabName);
    });
  });

  // Library refresh
  panel.querySelector('#refyn-refresh-library')?.addEventListener('click', loadLibrary);

  // Profile refresh
  panel.querySelector('#refyn-refresh-profile')?.addEventListener('click', loadProfile);

  // Open extension popup button
  panel.querySelector('#refyn-open-popup-btn')?.addEventListener('click', () => {
    // Send message to background to open the popup
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  });

  // Minimize button
  panel.querySelector('#refyn-minimize-btn')?.addEventListener('click', toggleMinimize);

  // Close button
  panel.querySelector('#refyn-close-btn')?.addEventListener('click', closePanel);

  // Live sync toggle
  panel.querySelector('#refyn-sync-toggle')?.addEventListener('click', toggleLiveSync);

  // Moodboard toggle (Midjourney only)
  panel.querySelector('#refyn-moodboard-checkbox')?.addEventListener('change', (e) => {
    isMoodboardMode = (e.target as HTMLInputElement).checked;
    localStorage.setItem('refyn-moodboard-mode', isMoodboardMode ? 'true' : 'false');
    showToast(isMoodboardMode ? 'Moodboard mode: --weird will be removed' : 'Moodboard mode off');
  });

  // Chaos slider
  const chaosSlider = panel.querySelector('#refyn-chaos-slider') as HTMLInputElement;
  chaosSlider?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    setChaosIntensity(value);
  });

  // Variation slider
  const variationSlider = panel.querySelector('#refyn-variation-slider') as HTMLInputElement;
  variationSlider?.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    setVariationIntensity(value);
  });

  // Chaos level labels (click to set)
  panel.querySelectorAll('.refyn-chaos-labels span').forEach(label => {
    label.addEventListener('click', () => {
      const value = parseInt((label as HTMLElement).dataset.chaos || '0', 10);
      setChaosIntensity(value);
      if (chaosSlider) chaosSlider.value = value.toString();
    });
  });

  // Mode buttons
  panel.querySelectorAll('.refyn-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = (e.currentTarget as HTMLElement).dataset.mode as OptimizationMode;
      setMode(mode);
    });
  });

  // Preset buttons
  panel.querySelectorAll('.refyn-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const presetId = (e.currentTarget as HTMLElement).dataset.preset;
      if (presetId) {
        setPreset(presetId);
      }
    });
  });

  // Clear preset button
  panel.querySelector('#refyn-clear-preset')?.addEventListener('click', () => {
    setPreset(null);
  });

  // Theme chips
  panel.querySelectorAll('.refyn-theme-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const themeId = (e.currentTarget as HTMLElement).dataset.theme as ThemeRemixId;
      setTheme(themeId === selectedTheme ? null : themeId); // Toggle if same theme clicked
    });
  });

  // Theme shuffle button
  panel.querySelector('#refyn-theme-shuffle')?.addEventListener('click', shuffleTheme);

  // Refresh suggestions button
  panel.querySelector('#refyn-refresh-suggestions')?.addEventListener('click', () => {
    loadSmartSuggestions();
  });

  // Load smart suggestions on init
  loadSmartSuggestions();

  // Feedback buttons
  panel.querySelector('#refyn-like-btn')?.addEventListener('click', () => handleFeedback('like'));
  panel.querySelector('#refyn-dislike-btn')?.addEventListener('click', () => handleFeedback('dislike'));
  panel.querySelector('#refyn-regen-btn')?.addEventListener('click', () => handleFeedback('regenerate'));

  // Grab prompt button
  panel.querySelector('#refyn-grab-prompt')?.addEventListener('click', grabPromptFromPage);

  // Save input button (save original prompt to library)
  panel.querySelector('#refyn-save-input')?.addEventListener('click', saveInputToLibrary);

  // Refine button
  panel.querySelector('#refyn-refine-btn')?.addEventListener('click', refinePrompt);

  // Save button
  panel.querySelector('#refyn-save-btn')?.addEventListener('click', saveToLibrary);

  // Copy button
  panel.querySelector('#refyn-copy-btn')?.addEventListener('click', copyOutput);

  // Insert button
  panel.querySelector('#refyn-insert-btn')?.addEventListener('click', insertIntoPage);

  // Panel input character count
  const inputTextarea = panel.querySelector('#refyn-input') as HTMLTextAreaElement;
  inputTextarea?.addEventListener('input', () => {
    updateCharCount(inputTextarea.value.length);
  });

  // Auth event listeners
  panel.querySelector('#refyn-auth-login')?.addEventListener('click', handleLogin);
  panel.querySelector('#refyn-auth-signup')?.addEventListener('click', handleSignUp);
  panel.querySelector('#refyn-logout-btn')?.addEventListener('click', handleLogout);
  panel.querySelector('#refyn-sync-btn')?.addEventListener('click', handleSync);

  // Taste library event listeners
  panel.querySelector('#refyn-apply-layers')?.addEventListener('click', handleApplyLayers);
  panel.querySelector('#refyn-export-taste')?.addEventListener('click', handleExportTaste);
  panel.querySelector('#refyn-import-taste')?.addEventListener('click', () => {
    (panel?.querySelector('#refyn-import-file') as HTMLInputElement)?.click();
  });
  panel.querySelector('#refyn-import-file')?.addEventListener('change', handleImportTaste);
  panel.querySelector('#refyn-vision-analysis')?.addEventListener('change', handleVisionToggle);

  // Midjourney history import
  panel.querySelector('#refyn-import-mj-history')?.addEventListener('click', handleMidjourneyHistoryImport);

  // Check auth state on init
  checkAuthState();

  // Load taste layers
  loadTasteLayers();
}

// =====================================================
// LIVE SYNC FUNCTIONALITY
// =====================================================

function startLiveSync(): void {
  // Find initial input
  findAndTrackInput();

  // Set up mutation observer to detect new inputs or page changes
  setupPageObserver();

  // Update status
  updateSyncStatus(true);
}

function stopLiveSync(): void {
  // Clear tracked input listeners
  if (trackedInput) {
    trackedInput.removeEventListener('input', handleInputChange);
    trackedInput.removeEventListener('keyup', handleInputChange);
    trackedInput.removeEventListener('focus', handleInputFocus);
  }
  trackedInput = null;

  // Stop observing
  if (inputObserver) {
    inputObserver.disconnect();
    inputObserver = null;
  }

  // Clear debounce
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // Update status
  updateSyncStatus(false);
}

function toggleLiveSync(): void {
  isLiveSyncEnabled = !isLiveSyncEnabled;

  const toggleBtn = panel?.querySelector('#refyn-sync-toggle');
  toggleBtn?.classList.toggle('active', isLiveSyncEnabled);

  if (isLiveSyncEnabled) {
    startLiveSync();
    showToast('Live sync enabled');
  } else {
    stopLiveSync();
    showToast('Live sync disabled');
  }

  // Persist preference
  localStorage.setItem('refyn-live-sync', isLiveSyncEnabled ? 'true' : 'false');
}

function updateSyncStatus(active: boolean, inputFound: boolean = true): void {
  const dot = panel?.querySelector('.refyn-sync-dot');
  const text = panel?.querySelector('#refyn-sync-text');

  if (dot) {
    dot.classList.toggle('refyn-sync-active', active && inputFound);
    dot.classList.toggle('refyn-sync-searching', active && !inputFound);
  }

  if (text) {
    if (!active) {
      text.textContent = 'Live Sync Off';
    } else if (inputFound) {
      text.textContent = 'Live Sync Active';
    } else {
      text.textContent = 'Looking for input...';
    }
  }
}

function isRefynElement(el: HTMLElement): boolean {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.id?.startsWith('refyn-') ||
        current.className?.toString().includes('refyn-')) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function findAndTrackInput(): void {
  // First try platform-specific selector
  const platformSelector = getPlatformInputSelector(currentPlatform);
  let input: HTMLElement | null = null;

  if (platformSelector) {
    const elements = document.querySelectorAll<HTMLElement>(platformSelector);
    for (const el of elements) {
      if (isVisibleElement(el) && !isRefynElement(el)) {
        input = el;
        break;
      }
    }
  }

  // Fallback to generic search
  if (!input) {
    const inputs = findPromptInputs();
    // findPromptInputs already excludes Refyn elements
    input = inputs[0] || null;
  }

  if (input && input !== trackedInput) {
    // Remove old listeners
    if (trackedInput) {
      trackedInput.removeEventListener('input', handleInputChange);
      trackedInput.removeEventListener('keyup', handleInputChange);
      trackedInput.removeEventListener('focus', handleInputFocus);
    }

    // Track new input
    trackedInput = input;
    input.addEventListener('input', handleInputChange);
    input.addEventListener('keyup', handleInputChange); // Backup for contenteditable
    input.addEventListener('focus', handleInputFocus);

    // Sync current content
    syncFromPageInput();
    updateSyncStatus(true, true);

    console.log('[Refyn] Now tracking input:', input);
  } else if (!input) {
    updateSyncStatus(true, false);
  }
}

function handleInputChange(): void {
  if (!isLiveSyncEnabled || !trackedInput) return;

  // Debounce to avoid excessive updates
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    syncFromPageInput();
  }, DEBOUNCE_DELAY);
}

function handleInputFocus(): void {
  // Flash the sync indicator to show we're tracking
  const dot = panel?.querySelector('.refyn-sync-dot');
  dot?.classList.add('refyn-sync-pulse');
  setTimeout(() => dot?.classList.remove('refyn-sync-pulse'), 500);
}

function syncFromPageInput(): void {
  if (!trackedInput || !panel) return;

  const text = getInputText(trackedInput);
  const textarea = panel.querySelector('#refyn-input') as HTMLTextAreaElement;

  if (textarea && textarea.value !== text) {
    textarea.value = text;
    updateCharCount(text.length);

    // Visual feedback
    textarea.classList.add('refyn-input-synced');
    setTimeout(() => textarea.classList.remove('refyn-input-synced'), 300);
  }
}

function setupPageObserver(): void {
  if (inputObserver) {
    inputObserver.disconnect();
  }

  inputObserver = new MutationObserver((mutations) => {
    // Check if we need to re-find the input
    let needsRefresh = false;

    for (const mutation of mutations) {
      // Check if tracked input was removed
      if (trackedInput && !document.body.contains(trackedInput)) {
        needsRefresh = true;
        trackedInput = null;
        break;
      }

      // Check for new nodes that might be inputs
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            if (isInputElement(node) || node.querySelector('textarea, [contenteditable="true"], [role="textbox"]')) {
              needsRefresh = true;
              break;
            }
          }
        }
      }
    }

    if (needsRefresh && isLiveSyncEnabled) {
      // Delay to let DOM settle
      setTimeout(findAndTrackInput, 100);
    }
  });

  inputObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function isInputElement(el: HTMLElement): boolean {
  const tagName = el.tagName.toLowerCase();
  return (
    tagName === 'textarea' ||
    tagName === 'input' ||
    el.isContentEditable ||
    el.getAttribute('role') === 'textbox'
  );
}

function isVisibleElement(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

function updateCharCount(count: number): void {
  const charCount = panel?.querySelector('#refyn-char-count');
  if (charCount) {
    charCount.textContent = `${count} chars`;
    charCount.classList.toggle('refyn-char-warning', count > 2000);
  }

  // Also update quality score
  const textarea = panel?.querySelector('#refyn-input') as HTMLTextAreaElement;
  if (textarea) {
    updateQualityScore(textarea.value);
  }
}

function updateQualityScore(prompt: string): void {
  const gradeEl = panel?.querySelector('#refyn-quality-grade');
  const fillEl = panel?.querySelector('#refyn-quality-fill') as HTMLElement;
  const indicator = panel?.querySelector('#refyn-quality-indicator') as HTMLElement;

  if (!gradeEl || !fillEl || !indicator) return;

  if (!prompt.trim()) {
    gradeEl.textContent = '-';
    fillEl.style.width = '0%';
    fillEl.style.background = '#52525B';
    indicator.title = 'Type a prompt to see quality score';
    return;
  }

  const quality = getQuickQuality(prompt, currentPlatform);

  gradeEl.textContent = quality.grade;
  fillEl.style.width = `${quality.score}%`;
  fillEl.style.background = quality.color;

  // Build tooltip with score breakdown
  let tooltip = `Quality: ${quality.grade} (${quality.score}/100)`;
  if (quality.score >= 80) {
    tooltip += '\nExcellent prompt!';
  } else if (quality.score >= 60) {
    tooltip += '\nGood prompt, could be better';
  } else if (quality.score >= 40) {
    tooltip += '\nAdd more specificity';
  } else {
    tooltip += '\nNeeds more detail and clarity';
  }
  indicator.title = tooltip;
}

// =====================================================
// DRAG FUNCTIONALITY
// =====================================================

function startDrag(e: MouseEvent): void {
  if ((e.target as HTMLElement).closest('.refyn-control-btn')) return;

  isDragging = true;
  const rect = panel!.getBoundingClientRect();
  dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
  panel!.style.cursor = 'grabbing';
}

function onDrag(e: MouseEvent): void {
  if (!isDragging || !panel) return;

  const x = e.clientX - dragOffset.x;
  const y = e.clientY - dragOffset.y;

  // Keep within viewport
  const maxX = window.innerWidth - panel.offsetWidth;
  const maxY = window.innerHeight - panel.offsetHeight;

  panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
  panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}

function stopDrag(): void {
  if (isDragging && panel) {
    isDragging = false;
    panel.style.cursor = '';
    savePosition();
  }
}

function savePosition(): void {
  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  localStorage.setItem('refyn-panel-position', JSON.stringify({
    left: rect.left,
    top: rect.top
  }));
}

function restorePosition(): void {
  try {
    const saved = localStorage.getItem('refyn-panel-position');
    if (saved && panel) {
      const pos = JSON.parse(saved);
      panel.style.left = `${pos.left}px`;
      panel.style.top = `${pos.top}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    }

    // Restore live sync preference
    const syncPref = localStorage.getItem('refyn-live-sync');
    if (syncPref === 'false') {
      isLiveSyncEnabled = false;
    }

    // Restore moodboard preference
    const moodboardPref = localStorage.getItem('refyn-moodboard-mode');
    if (moodboardPref === 'true') {
      isMoodboardMode = true;
      const checkbox = panel?.querySelector('#refyn-moodboard-checkbox') as HTMLInputElement;
      if (checkbox) checkbox.checked = true;
    }

    // Restore chaos intensity
    const savedChaosIntensity = localStorage.getItem('refyn-chaos-intensity');
    if (savedChaosIntensity) {
      const value = parseInt(savedChaosIntensity, 10);
      if (!isNaN(value)) {
        chaosIntensity = value;
        setTimeout(() => {
          const slider = panel?.querySelector('#refyn-chaos-slider') as HTMLInputElement;
          if (slider) slider.value = value.toString();
          setChaosIntensity(value);
        }, 50);
      }
    }

    // Restore variation intensity
    const savedVariationIntensity = localStorage.getItem('refyn-variation-intensity');
    if (savedVariationIntensity) {
      const value = parseInt(savedVariationIntensity, 10);
      if (!isNaN(value)) {
        variationIntensity = value;
        setTimeout(() => {
          const slider = panel?.querySelector('#refyn-variation-slider') as HTMLInputElement;
          if (slider) slider.value = value.toString();
          setVariationIntensity(value);
        }, 50);
      }
    } else {
      // Set default variation level on first load
      setTimeout(() => setVariationIntensity(50), 50);
    }

    // Restore last used preset
    const lastPreset = localStorage.getItem('refyn-last-preset');
    if (lastPreset) {
      selectedPreset = lastPreset;
      // Update UI after a brief delay to ensure panel is rendered
      setTimeout(() => {
        panel?.querySelectorAll('.refyn-preset-btn').forEach(btn => {
          btn.classList.toggle('active', (btn as HTMLElement).dataset.preset === lastPreset);
        });
        const clearBtn = panel?.querySelector('#refyn-clear-preset');
        clearBtn?.classList.toggle('hidden', !lastPreset);
      }, 50);
    }

    // Restore selected theme
    const savedTheme = localStorage.getItem('refyn-selected-theme') as ThemeRemixId;
    if (savedTheme && THEME_REMIX_IDS.includes(savedTheme as Exclude<ThemeRemixId, null>)) {
      selectedTheme = savedTheme;
      setTimeout(() => {
        panel?.querySelectorAll('.refyn-theme-chip').forEach(chip => {
          chip.classList.toggle('active', (chip as HTMLElement).dataset.theme === savedTheme);
        });
      }, 50);
    }
  } catch {
    // Use default position
  }
}

// =====================================================
// PANEL ACTIONS
// =====================================================

function toggleMinimize(): void {
  isMinimized = !isMinimized;
  const container = panel?.querySelector('.refyn-panel-container');
  const body = panel?.querySelector('#refyn-panel-body') as HTMLElement;
  const btn = panel?.querySelector('#refyn-minimize-btn');
  const closeBtn = panel?.querySelector('#refyn-close-btn') as HTMLElement;

  if (isMinimized) {
    container?.classList.add('refyn-minimized');
    container?.classList.add('refyn-compact');
    if (body) body.style.display = 'none';
    if (closeBtn) closeBtn.style.display = 'none';
    if (btn) btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="17 11 12 6 7 11"></polyline>
        <polyline points="17 18 12 13 7 18"></polyline>
      </svg>
    `;
  } else {
    container?.classList.remove('refyn-minimized');
    container?.classList.remove('refyn-compact');
    if (body) body.style.display = 'block';
    if (closeBtn) closeBtn.style.display = 'flex';
    if (btn) btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;
  }

  // Save state
  localStorage.setItem('refyn-panel-minimized', isMinimized ? 'true' : 'false');
}

function closePanel(): void {
  // Instead of fully closing, just minimize to compact mode
  if (!isMinimized) {
    toggleMinimize();
  }
}

function setMode(mode: OptimizationMode): void {
  selectedMode = mode;
  panel?.querySelectorAll('.refyn-mode-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
  });
}

function setChaosIntensity(value: number): void {
  chaosIntensity = Math.max(0, Math.min(100, value));

  // Update track fill
  const track = panel?.querySelector('#refyn-chaos-track') as HTMLElement;
  if (track) track.style.width = `${chaosIntensity}%`;

  // Update number display
  const numberEl = panel?.querySelector('#refyn-chaos-number');
  if (numberEl) numberEl.textContent = chaosIntensity.toString();

  // Update level label (short names to prevent overlap)
  const levelEl = panel?.querySelector('#refyn-chaos-level');
  if (levelEl) {
    let level = 'Chill';
    let color = '#71717A'; // zinc-500
    if (chaosIntensity >= 81) { level = 'Max'; color = '#EF4444'; } // red-500
    else if (chaosIntensity >= 61) { level = 'Wild'; color = '#EAB308'; } // yellow-500
    else if (chaosIntensity >= 41) { level = 'Mid'; color = '#06B6D4'; } // cyan-500
    else if (chaosIntensity >= 21) { level = 'Low'; color = '#3B82F6'; } // blue-500
    levelEl.textContent = level;
    (levelEl as HTMLElement).style.color = color;
  }

  // Update track color
  const track2 = panel?.querySelector('#refyn-chaos-track') as HTMLElement;
  if (track2) {
    let gradient = 'linear-gradient(90deg, #71717A, #52525B)';
    if (chaosIntensity >= 81) gradient = 'linear-gradient(90deg, #F97316, #EF4444)';
    else if (chaosIntensity >= 61) gradient = 'linear-gradient(90deg, #EAB308, #F97316)';
    else if (chaosIntensity >= 41) gradient = 'linear-gradient(90deg, #06B6D4, #22C55E)';
    else if (chaosIntensity >= 21) gradient = 'linear-gradient(90deg, #3B82F6, #06B6D4)';
    track2.style.background = gradient;
  }

  // Store preference
  localStorage.setItem('refyn-chaos-intensity', chaosIntensity.toString());
}

function setVariationIntensity(value: number): void {
  variationIntensity = Math.max(0, Math.min(100, value));

  // Update level label (short names to prevent overlap)
  const levelEl = panel?.querySelector('#refyn-variation-level');
  if (levelEl) {
    let level = 'Lock';
    let color = '#71717A'; // zinc-500
    if (variationIntensity >= 81) { level = 'New'; color = '#A855F7'; } // purple-500
    else if (variationIntensity >= 61) { level = 'High'; color = '#EC4899'; } // pink-500
    else if (variationIntensity >= 41) { level = 'Mid'; color = '#06B6D4'; } // cyan-500
    else if (variationIntensity >= 21) { level = 'Low'; color = '#3B82F6'; } // blue-500
    levelEl.textContent = level;
    (levelEl as HTMLElement).style.color = color;
  }

  // Store preference
  localStorage.setItem('refyn-variation-intensity', variationIntensity.toString());
}

function setPreset(presetId: string | null): void {
  selectedPreset = presetId;

  // Update preset button states
  panel?.querySelectorAll('.refyn-preset-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.preset === presetId);
  });

  // Show/hide clear button
  const clearBtn = panel?.querySelector('#refyn-clear-preset');
  clearBtn?.classList.toggle('hidden', !presetId);

  // Store preference
  if (presetId) {
    localStorage.setItem('refyn-last-preset', presetId);
    showToast(`Style: ${presetId}`);
  } else {
    localStorage.removeItem('refyn-last-preset');
  }
}

function setTheme(themeId: ThemeRemixId): void {
  selectedTheme = themeId;

  // Update theme chip states
  panel?.querySelectorAll('.refyn-theme-chip').forEach(chip => {
    chip.classList.toggle('active', (chip as HTMLElement).dataset.theme === themeId);
  });

  // Store preference
  if (themeId) {
    localStorage.setItem('refyn-selected-theme', themeId);
    const theme = THEME_REMIXES[themeId];
    showToast(`${theme.emoji} ${theme.name} theme active`);
  } else {
    localStorage.removeItem('refyn-selected-theme');
    showToast('Theme cleared');
  }
}

function shuffleTheme(): void {
  // Pick a random theme different from the current one
  const availableThemes = THEME_REMIX_IDS.filter(id => id !== selectedTheme);
  const randomIndex = Math.floor(Math.random() * availableThemes.length);
  const randomTheme = availableThemes[randomIndex];

  setTheme(randomTheme);

  // Add a little animation to the shuffle button
  const shuffleBtn = panel?.querySelector('#refyn-theme-shuffle');
  shuffleBtn?.classList.add('refyn-shuffling');
  setTimeout(() => shuffleBtn?.classList.remove('refyn-shuffling'), 500);
}

async function handleFeedback(type: 'like' | 'dislike' | 'regenerate'): Promise<void> {
  if (!lastOriginalPrompt || !lastRefinedPrompt) {
    return;
  }

  // Record feedback for learning
  await recordFeedback(
    lastOriginalPrompt,
    lastRefinedPrompt,
    currentPlatform,
    type,
    selectedPreset || undefined
  );

  // Visual feedback
  const btn = panel?.querySelector(`#refyn-${type === 'regenerate' ? 'regen' : type}-btn`);
  btn?.classList.add('active');
  setTimeout(() => btn?.classList.remove('active'), 500);

  if (type === 'like') {
    showToast('Thanks! Learning your preferences...');
    // Refresh suggestions to show updated preferences
    setTimeout(loadSmartSuggestions, 500);
  } else if (type === 'dislike') {
    showToast('Noted! Will adjust future suggestions.');
    // Refresh suggestions to show updated preferences
    setTimeout(loadSmartSuggestions, 500);
  } else if (type === 'regenerate') {
    // Re-run refinement
    refinePrompt();
  }
}

function grabPromptFromPage(): void {
  console.log('[Refyn Panel] Grab prompt clicked');
  const inputs = findPromptInputs();
  console.log('[Refyn Panel] Found inputs:', inputs.length, inputs);

  if (inputs.length > 0) {
    const text = getInputText(inputs[0]);
    console.log('[Refyn Panel] Got text:', text?.substring(0, 50));
    const textarea = panel?.querySelector('#refyn-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = text || '';
      updateCharCount((text || '').length);
      showToast(text ? 'Prompt grabbed!' : 'Input found but empty');
    }
  } else {
    showToast('No prompt input found', 'error');
  }
}

async function refinePrompt(): Promise<void> {
  console.log('[Refyn Panel] Refine clicked');
  const textarea = panel?.querySelector('#refyn-input') as HTMLTextAreaElement;
  const prompt = textarea?.value?.trim();

  if (!prompt) {
    showToast('Please enter a prompt', 'error');
    return;
  }

  // Store original prompt for feedback
  lastOriginalPrompt = prompt;

  // Get preference context from simple learning system
  let preferenceContext = '';
  let smartContext = '';

  try {
    preferenceContext = await getPreferenceContext();
  } catch (e) {
    console.warn('[Refyn Panel] Failed to get preference context:', e);
  }

  try {
    smartContext = await getSmartSuggestionContext(currentPlatform);
  } catch (e) {
    console.warn('[Refyn Panel] Failed to get smart context:', e);
  }

  // Combine both contexts
  const combinedContext = preferenceContext + smartContext;

  console.log('[Refyn Panel] Sending to background:', {
    platform: currentPlatform,
    mode: selectedMode,
    presetId: selectedPreset,
    themeId: selectedTheme,
    hasPreferences: !!combinedContext,
    promptLength: prompt.length
  });
  setLoading(true);
  hideError();

  try {
    console.log('[Refyn Panel] Sending message to background...');
    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      payload: {
        prompt,
        platform: currentPlatform,
        mode: selectedMode,
        chaosIntensity,
        variationIntensity,
        previousRefinedPrompt: lastRefinedPrompt || null,
        presetId: selectedPreset,
        themeId: selectedTheme,
        preferenceContext: combinedContext,
      },
    });

    console.log('[Refyn Panel] Response received:', response);

    if (response?.success && response?.data?.optimizedPrompt) {
      // Store refined prompt for feedback
      lastRefinedPrompt = response.data.optimizedPrompt;
      showOutput(response.data.optimizedPrompt);
      showToast('Prompt refined!');
    } else {
      const errorMsg = response?.error || 'Failed to refine prompt. Check your API key in settings.';
      console.error('[Refyn Panel] API Error:', errorMsg, 'Full response:', response);
      showError(errorMsg);
    }
  } catch (error) {
    console.error('[Refyn Panel] Connection error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    showError(`Connection error: ${errorMsg}. Make sure the extension is enabled.`);
  }

  setLoading(false);
}

function setLoading(loading: boolean): void {
  const btn = panel?.querySelector('#refyn-refine-btn') as HTMLButtonElement;
  const loadingEl = panel?.querySelector('#refyn-loading') as HTMLElement;

  if (btn) {
    btn.disabled = loading;
    btn.innerHTML = loading
      ? '<div class="refyn-btn-spinner"></div><span>Refining...</span>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg><span>Refyn It</span>';
  }

  if (loadingEl) {
    loadingEl.style.display = loading ? 'flex' : 'none';
  }
}

function showOutput(text: string): void {
  const section = panel?.querySelector('#refyn-output-section') as HTMLElement;
  const output = panel?.querySelector('#refyn-output') as HTMLElement;
  const container = panel?.querySelector('.refyn-panel-container') as HTMLElement;

  if (section && output) {
    // Apply moodboard stripping if enabled for Midjourney
    let displayText = text;
    if (isMoodboardMode && currentPlatform === 'midjourney') {
      displayText = stripWeirdParameter(text);
    }

    section.style.display = 'block';
    output.textContent = displayText;

    // Expand panel to show full output
    container?.classList.add('refyn-expanded');

    // Also update the stored refined prompt for copy/insert
    lastRefinedPrompt = displayText;
  }
}


function showError(message: string): void {
  const errorEl = panel?.querySelector('#refyn-error') as HTMLElement;
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function hideError(): void {
  const errorEl = panel?.querySelector('#refyn-error') as HTMLElement;
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

async function copyOutput(): Promise<void> {
  const output = panel?.querySelector('#refyn-output') as HTMLElement;
  if (output?.textContent) {
    await navigator.clipboard.writeText(output.textContent);
    showToast('Copied!');
  }
}

async function saveToLibrary(): Promise<void> {
  const output = panel?.querySelector('#refyn-output') as HTMLElement;
  if (!output?.textContent) {
    showToast('No prompt to save', 'error');
    return;
  }

  const content = output.textContent;

  // Extract image references and parameters
  const { imagePrompts, referenceImages } = extractImageReferences(content);
  const extractedParams = currentPlatform === 'midjourney' ? extractMidjourneyParams(content) : undefined;
  const outputImageUrl = findOutputImageOnPage();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_PROMPT',
      payload: {
        content,
        platform: currentPlatform,
        tags: ['refined'],
        outputImageUrl,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        imagePrompts: imagePrompts.length > 0 ? imagePrompts : undefined,
        extractedParams,
      },
    });

    if (response?.success) {
      showToast('Saved to library!');
      // Visual feedback on button
      const saveBtn = panel?.querySelector('#refyn-save-btn');
      saveBtn?.classList.add('refyn-saved');
      setTimeout(() => saveBtn?.classList.remove('refyn-saved'), 2000);
      // Refresh library
      loadLibrary();
    } else {
      showToast('Failed to save', 'error');
    }
  } catch (error) {
    showToast('Failed to save', 'error');
  }
}

async function saveInputToLibrary(): Promise<void> {
  const textarea = panel?.querySelector('#refyn-input') as HTMLTextAreaElement;
  const content = textarea?.value?.trim();

  if (!content) {
    showToast('No prompt to save', 'error');
    return;
  }

  // Extract image references and parameters
  const { imagePrompts, referenceImages } = extractImageReferences(content);
  const extractedParams = currentPlatform === 'midjourney' ? extractMidjourneyParams(content) : undefined;
  const outputImageUrl = findOutputImageOnPage();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_PROMPT',
      payload: {
        content,
        platform: currentPlatform,
        tags: ['original'],
        outputImageUrl,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        imagePrompts: imagePrompts.length > 0 ? imagePrompts : undefined,
        extractedParams,
      },
    });

    if (response?.success) {
      showToast('Saved original to library!');
      // Visual feedback on button
      const saveBtn = panel?.querySelector('#refyn-save-input');
      saveBtn?.classList.add('refyn-saved');
      setTimeout(() => saveBtn?.classList.remove('refyn-saved'), 2000);
      // Refresh library
      loadLibrary();
    } else {
      showToast('Failed to save', 'error');
    }
  } catch (error) {
    showToast('Failed to save', 'error');
  }
}

function switchTab(tabName: 'refyn' | 'library' | 'profile'): void {
  activeTab = tabName;

  // Update tab buttons
  panel?.querySelectorAll('.refyn-tab').forEach(tab => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.tab === tabName);
  });

  // Update tab content
  panel?.querySelectorAll('.refyn-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `refyn-tab-${tabName}`);
  });

  // Collapse panel when leaving refyn tab, expand back when returning if output exists
  const container = panel?.querySelector('.refyn-panel-container') as HTMLElement;
  const outputSection = panel?.querySelector('#refyn-output-section') as HTMLElement;

  if (tabName !== 'refyn') {
    container?.classList.remove('refyn-expanded');
  } else if (outputSection && outputSection.style.display !== 'none') {
    container?.classList.add('refyn-expanded');
  }

  // Load data when switching tabs
  if (tabName === 'library') {
    loadLibrary();
  } else if (tabName === 'profile') {
    loadProfile();
  }
}

async function loadLibrary(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SAVED' });
    if (response?.success && response.data) {
      savedPrompts = response.data;
      renderLibrary();
    }
  } catch (error) {
    console.error('[Refyn] Failed to load library:', error);
  }
}

function renderLibrary(): void {
  const list = panel?.querySelector('#refyn-library-list');
  const count = panel?.querySelector('#refyn-library-count');
  if (!list) return;

  if (count) {
    count.textContent = `${savedPrompts.length} saved prompt${savedPrompts.length !== 1 ? 's' : ''}`;
  }

  if (savedPrompts.length === 0) {
    list.innerHTML = `
      <div class="refyn-library-empty">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>No saved prompts yet</span>
        <span class="refyn-library-hint">Save prompts from the Refyn tab</span>
      </div>
    `;
    return;
  }

  list.innerHTML = savedPrompts.map(prompt => `
    <div class="refyn-library-item ${prompt.liked === true ? 'refyn-liked' : ''} ${prompt.liked === false ? 'refyn-disliked' : ''}" data-id="${prompt.id}">
      ${prompt.outputImageUrl || (prompt.referenceImages && prompt.referenceImages.length > 0) ? `
        <div class="refyn-library-images">
          ${prompt.outputImageUrl ? `<img src="${prompt.outputImageUrl}" class="refyn-lib-thumb refyn-lib-output" alt="Output" title="Generated output" loading="lazy" onerror="this.style.display='none'">` : ''}
          ${prompt.referenceImages?.map(url => `<img src="${url}" class="refyn-lib-thumb refyn-lib-ref" alt="Ref" title="Reference image" loading="lazy" onerror="this.style.display='none'">`).join('') || ''}
        </div>
      ` : ''}
      <div class="refyn-library-item-header">
        <div class="refyn-library-item-content">${prompt.content.substring(0, 80)}${prompt.content.length > 80 ? '...' : ''}</div>
        <div class="refyn-like-btns">
          <button class="refyn-like-btn ${prompt.liked === true ? 'active' : ''}" data-id="${prompt.id}" data-liked="true" title="Like this style">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="${prompt.liked === true ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
          <button class="refyn-dislike-btn ${prompt.liked === false ? 'active' : ''}" data-id="${prompt.id}" data-liked="false" title="Dislike this style">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="${prompt.liked === false ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
            </svg>
          </button>
        </div>
      </div>
      ${prompt.extractedParams && Object.keys(prompt.extractedParams).length > 0 ? `
        <div class="refyn-lib-params">
          ${Object.entries(prompt.extractedParams).filter(([,v]) => v).slice(0, 4).map(([k, v]) => `<span class="refyn-param-tag">--${k} ${v === 'true' ? '' : v}</span>`).join('')}
        </div>
      ` : ''}
      <div class="refyn-library-item-rating">
        <div class="refyn-star-row">
          ${[1,2,3,4,5].map(star => `<button class="refyn-star-btn ${(prompt.rating || 0) >= star ? 'active' : ''}" data-id="${prompt.id}" data-rating="${star}">★</button>`).join('')}
        </div>
        <button class="refyn-analyze-btn ${prompt.aiFeedback ? 'has-feedback' : ''}" data-id="${prompt.id}" data-content="${encodeURIComponent(prompt.content)}" data-platform="${prompt.platform}" title="${prompt.aiFeedback ? 'View feedback' : 'Analyze'}">
          ?
        </button>
      </div>
      ${prompt.aiFeedback ? `<div class="refyn-library-feedback">
        <div class="refyn-feedback-score">${prompt.aiFeedback.score}/5</div>
        ${prompt.aiFeedback.strengths?.length ? `<div class="refyn-feedback-good">+ ${prompt.aiFeedback.strengths.slice(0,2).join(' | ')}</div>` : ''}
        ${prompt.aiFeedback.improvements?.length ? `<div class="refyn-feedback-improve">→ ${prompt.aiFeedback.improvements.slice(0,2).join(' | ')}</div>` : ''}
      </div>` : ''}
      <div class="refyn-library-item-footer">
        <div class="refyn-library-item-meta">
          <span class="refyn-library-item-platform">${prompt.platform}</span>
          ${prompt.liked === true ? '<span class="refyn-pref-tag refyn-pref-liked">liked</span>' : ''}
          ${prompt.liked === false ? '<span class="refyn-pref-tag refyn-pref-disliked">disliked</span>' : ''}
        </div>
        <div class="refyn-library-item-actions">
          <button class="refyn-lib-btn refyn-lib-copy" data-content="${encodeURIComponent(prompt.content)}" title="Copy">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="refyn-lib-btn refyn-lib-use" data-content="${encodeURIComponent(prompt.content)}" title="Use">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </button>
          <button class="refyn-lib-btn refyn-lib-delete" data-id="${prompt.id}" title="Delete">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Add event listeners for library items
  list.querySelectorAll('.refyn-lib-copy').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const content = decodeURIComponent((btn as HTMLElement).dataset.content || '');
      await navigator.clipboard.writeText(content);
      showToast('Copied!');
    });
  });

  list.querySelectorAll('.refyn-lib-use').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = decodeURIComponent((btn as HTMLElement).dataset.content || '');
      const target = trackedInput || findPromptInputs()[0];
      if (target) {
        setInputText(target, content);
        showToast('Inserted!');
      } else {
        navigator.clipboard.writeText(content);
        showToast('Copied (no input found)');
      }
    });
  });

  list.querySelectorAll('.refyn-lib-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      if (id) {
        await chrome.runtime.sendMessage({ type: 'DELETE_SAVED_PROMPT', payload: id });
        showToast('Deleted');
        loadLibrary();
      }
    });
  });

  // Star rating buttons
  list.querySelectorAll('.refyn-star-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const el = btn as HTMLElement;
      const id = el.dataset.id;
      const rating = parseInt(el.dataset.rating || '0', 10);
      if (id && rating) {
        await chrome.runtime.sendMessage({
          type: 'RATE_PROMPT',
          payload: { promptId: id, rating }
        });
        // Update stars visually
        const item = el.closest('.refyn-library-item');
        item?.querySelectorAll('.refyn-star-btn').forEach((star, index) => {
          star.classList.toggle('active', index < rating);
        });
        showToast(`Rated ${rating}/5`);
      }
    });
  });

  // Like/Dislike buttons
  list.querySelectorAll('.refyn-like-btn, .refyn-dislike-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const el = btn as HTMLElement;
      const id = el.dataset.id;
      const likedStr = el.dataset.liked;
      const liked = likedStr === 'true';

      if (!id) return;

      // Toggle: if already in this state, clear it (set to null)
      const currentPrompt = savedPrompts.find(p => p.id === id);
      const newLiked = currentPrompt?.liked === liked ? undefined : liked;

      await chrome.runtime.sendMessage({
        type: 'SET_PROMPT_LIKED',
        payload: { promptId: id, liked: newLiked }
      });

      // Update UI
      const item = el.closest('.refyn-library-item');
      if (item) {
        item.classList.remove('refyn-liked', 'refyn-disliked');
        if (newLiked === true) item.classList.add('refyn-liked');
        if (newLiked === false) item.classList.add('refyn-disliked');

        // Update button states
        const likeBtn = item.querySelector('.refyn-like-btn');
        const dislikeBtn = item.querySelector('.refyn-dislike-btn');
        likeBtn?.classList.toggle('active', newLiked === true);
        dislikeBtn?.classList.toggle('active', newLiked === false);

        // Update SVG fill
        const likeSvg = likeBtn?.querySelector('svg');
        const dislikeSvg = dislikeBtn?.querySelector('svg');
        if (likeSvg) likeSvg.setAttribute('fill', newLiked === true ? 'currentColor' : 'none');
        if (dislikeSvg) dislikeSvg.setAttribute('fill', newLiked === false ? 'currentColor' : 'none');

        // Update tags
        const meta = item.querySelector('.refyn-library-item-meta');
        if (meta) {
          meta.querySelectorAll('.refyn-pref-tag').forEach(tag => tag.remove());
          if (newLiked === true) {
            meta.insertAdjacentHTML('beforeend', '<span class="refyn-pref-tag refyn-pref-liked">liked</span>');
          } else if (newLiked === false) {
            meta.insertAdjacentHTML('beforeend', '<span class="refyn-pref-tag refyn-pref-disliked">disliked</span>');
          }
        }
      }

      // Update local state
      const idx = savedPrompts.findIndex(p => p.id === id);
      if (idx !== -1) {
        savedPrompts[idx].liked = newLiked;
      }

      showToast(newLiked === true ? 'Liked!' : newLiked === false ? 'Disliked' : 'Preference cleared');
    });
  });

  // Analyze button
  list.querySelectorAll('.refyn-analyze-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const el = btn as HTMLElement;
      const id = el.dataset.id;
      const content = decodeURIComponent(el.dataset.content || '');
      const platform = el.dataset.platform || 'unknown';

      if (!id || !content) return;

      // Show loading state
      el.textContent = '...';
      el.classList.add('loading');

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'ANALYZE_PROMPT',
          payload: { promptId: id, content, platform }
        });

        if (response?.success && response.data) {
          showToast(`Score: ${response.data.score}/5`);
          loadLibrary(); // Reload to show feedback
        } else {
          showToast('Analysis failed', 'error');
          el.textContent = '?';
        }
      } catch {
        showToast('Analysis failed', 'error');
        el.textContent = '?';
      }
      el.classList.remove('loading');
    });
  });
}

async function loadProfile(): Promise<void> {
  try {
    // Load taste profile
    const profileResponse = await chrome.runtime.sendMessage({ type: 'GET_TASTE_PROFILE' });
    if (profileResponse?.success && profileResponse.data) {
      tasteProfile = profileResponse.data;
      renderProfile();
    }

    // Load saved count
    const savedResponse = await chrome.runtime.sendMessage({ type: 'GET_SAVED' });
    if (savedResponse?.success && savedResponse.data) {
      const savedCount = panel?.querySelector('#refyn-stat-saved');
      if (savedCount) savedCount.textContent = savedResponse.data.length.toString();
    }

    // Load history count
    const historyResponse = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
    if (historyResponse?.success && historyResponse.data) {
      const refinedCount = panel?.querySelector('#refyn-stat-refined');
      if (refinedCount) refinedCount.textContent = historyResponse.data.length.toString();
    }

    // Load preferences for taste learning progress
    const prefsResponse = await chrome.runtime.sendMessage({ type: 'GET_PREFERENCES' });
    if (prefsResponse?.success && prefsResponse.data) {
      renderTasteProgress(prefsResponse.data);
    }
  } catch (error) {
    console.error('[Refyn] Failed to load profile:', error);
  }
}

/**
 * Render the taste learning progress bar
 */
function renderTasteProgress(prefs: { stats?: { totalLikes?: number; totalDislikes?: number; totalDeletes?: number } }): void {
  const progressContainer = panel?.querySelector('#refyn-taste-progress');
  if (!progressContainer) return;

  const totalLikes = prefs.stats?.totalLikes || 0;
  const totalDislikes = (prefs.stats?.totalDislikes || 0) + (prefs.stats?.totalDeletes || 0);
  const totalFeedback = totalLikes + totalDislikes;

  // Milestones
  const targetBasic = 20;
  const targetGood = 50;
  const targetExcellent = 100;
  const maxTarget = 150;

  // Determine level
  let level = 'Getting Started';
  let levelColor = '#71717a'; // zinc-500
  let progressColor = '#71717a';
  let nextMilestone = targetBasic;

  if (totalFeedback >= targetExcellent) {
    level = 'Excellent';
    levelColor = '#22c55e'; // green-500
    progressColor = '#22c55e';
    nextMilestone = maxTarget;
  } else if (totalFeedback >= targetGood) {
    level = 'Good Understanding';
    levelColor = '#3b82f6'; // blue-500
    progressColor = '#3b82f6';
    nextMilestone = targetExcellent;
  } else if (totalFeedback >= targetBasic) {
    level = 'Learning';
    levelColor = '#f59e0b'; // amber-500
    progressColor = '#f59e0b';
    nextMilestone = targetGood;
  }

  const progressPercent = Math.min(100, (totalFeedback / nextMilestone) * 100);

  // Encouraging text
  let encourageText = '';
  if (totalFeedback < targetBasic) {
    encourageText = `Rate ${targetBasic - totalFeedback} more outputs to unlock personalized suggestions`;
  } else if (totalFeedback < targetGood) {
    encourageText = `${targetGood - totalFeedback} more ratings to improve taste accuracy`;
  } else if (totalFeedback < targetExcellent) {
    encourageText = `${targetExcellent - totalFeedback} more for excellent recommendations`;
  } else {
    encourageText = 'Your taste profile is highly trained!';
  }

  progressContainer.innerHTML = `
    <div class="refyn-progress-header">
      <span class="refyn-progress-level" style="color: ${levelColor}">${level}</span>
      <span class="refyn-progress-count">${totalFeedback}/${nextMilestone}</span>
    </div>
    <div class="refyn-progress-bar-container">
      <div class="refyn-progress-bar" style="width: ${progressPercent}%; background: ${progressColor}"></div>
      <div class="refyn-progress-markers">
        <div class="refyn-progress-marker" style="left: ${(targetBasic / maxTarget) * 100}%" title="Learning: ${targetBasic}"></div>
        <div class="refyn-progress-marker" style="left: ${(targetGood / maxTarget) * 100}%" title="Good: ${targetGood}"></div>
        <div class="refyn-progress-marker" style="left: ${(targetExcellent / maxTarget) * 100}%" title="Excellent: ${targetExcellent}"></div>
      </div>
    </div>
    <div class="refyn-progress-stats">
      <div class="refyn-progress-stat refyn-stat-positive">
        <span class="refyn-stat-value">${totalLikes}</span>
        <span class="refyn-stat-label">Liked</span>
      </div>
      <div class="refyn-progress-divider"></div>
      <div class="refyn-progress-stat refyn-stat-negative">
        <span class="refyn-stat-value">${totalDislikes}</span>
        <span class="refyn-stat-label">Disliked</span>
      </div>
    </div>
    <div class="refyn-progress-encourage">${encourageText}</div>
  `;
}

function renderProfile(): void {
  const content = panel?.querySelector('#refyn-profile-content');
  if (!content) return;

  if (!tasteProfile || !tasteProfile.visual) {
    content.innerHTML = `
      <div class="refyn-profile-empty">
        <span>Profile builds as you use Refyn</span>
        <span class="refyn-profile-hint">Like/dislike results to train</span>
      </div>
    `;
    return;
  }

  const styles = tasteProfile.visual?.style || [];
  const lighting = tasteProfile.visual?.lighting || [];
  const keywords = tasteProfile.patterns?.frequentKeywords || {};

  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  content.innerHTML = `
    ${styles.length > 0 ? `
      <div class="refyn-profile-group">
        <span class="refyn-profile-label">Styles</span>
        <div class="refyn-profile-tags">
          ${styles.slice(0, 4).map(s => `<span class="refyn-profile-tag">${s}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${lighting.length > 0 ? `
      <div class="refyn-profile-group">
        <span class="refyn-profile-label">Lighting</span>
        <div class="refyn-profile-tags">
          ${lighting.slice(0, 3).map(l => `<span class="refyn-profile-tag">${l}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${topKeywords.length > 0 ? `
      <div class="refyn-profile-group">
        <span class="refyn-profile-label">Top Keywords</span>
        <div class="refyn-profile-tags">
          ${topKeywords.map(k => `<span class="refyn-profile-tag">${k}</span>`).join('')}
        </div>
      </div>
    ` : ''}
    ${styles.length === 0 && lighting.length === 0 && topKeywords.length === 0 ? `
      <div class="refyn-profile-empty">
        <span>Keep using Refyn to build your profile</span>
      </div>
    ` : ''}
  `;
}

function insertIntoPage(): void {
  const output = panel?.querySelector('#refyn-output') as HTMLElement;
  if (!output?.textContent) return;

  // Try to use tracked input first
  const target = trackedInput || findPromptInputs()[0];

  if (target) {
    setInputText(target, output.textContent);
    showToast('Inserted into prompt!');
  } else {
    showToast('No prompt input found', 'error');
  }
}

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  // Remove existing toast
  document.querySelector('.refyn-panel-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = `refyn-panel-toast refyn-toast-${type}`;
  toast.textContent = message;
  panel?.appendChild(toast);

  setTimeout(() => toast.remove(), 2000);
}

export function destroyFloatingPanel(): void {
  stopLiveSync();
  panel?.remove();
  panel = null;
}

export function showFloatingPanel(): void {
  localStorage.removeItem('refyn-panel-closed');
  localStorage.removeItem('refyn-panel-minimized');
  removeTriggerButton();
  if (!panel) {
    createFloatingPanel();
  } else if (isMinimized) {
    toggleMinimize();
  }
}

/**
 * Toggle floating panel visibility (minimize/expand)
 * Used by keyboard shortcut Ctrl+Shift+E
 */
export function toggleFloatingPanel(): void {
  if (!panel) {
    // Panel doesn't exist, create it
    forceShowFloatingPanel();
  } else {
    // Toggle minimize state
    toggleMinimize();
  }
}

/**
 * Force show floating panel even on unknown platforms
 * Used when user explicitly requests via popup button
 */
export function forceShowFloatingPanel(): void {
  localStorage.removeItem('refyn-panel-closed');
  localStorage.removeItem('refyn-panel-minimized');
  removeTriggerButton();

  if (panel) {
    // Panel exists, just expand it
    if (isMinimized) {
      toggleMinimize();
    }
    return;
  }

  // Force create panel even on unknown platform
  const detectedPlatform = detectPlatform();
  currentPlatform = detectedPlatform === 'unknown' ? 'chatgpt' : detectedPlatform; // Default to chatgpt for unknown

  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = generatePanelHTML();

  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483646;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  document.body.appendChild(panel);
  setupEventListeners();
  restorePosition();

  if (isLiveSyncEnabled) {
    startLiveSync();
  }

  console.log('[Refyn] Floating panel force-initialized for:', currentPlatform);
}

// =====================================================
// TRIGGER BUTTON (Always visible when panel is closed)
// =====================================================

const TRIGGER_ID = 'refyn-trigger-btn';

function createTriggerButton(): void {
  // Don't create if already exists or on unknown platforms
  if (document.getElementById(TRIGGER_ID) || currentPlatform === 'unknown') return;

  const trigger = document.createElement('div');
  trigger.id = TRIGGER_ID;
  trigger.innerHTML = `
    <div class="refyn-trigger-inner">
      <div class="refyn-trigger-icon">R</div>
      <span class="refyn-trigger-text">Refyn</span>
    </div>
  `;

  trigger.addEventListener('click', () => {
    removeTriggerButton();
    showFloatingPanel();
  });

  // Add hover expand functionality
  trigger.addEventListener('mouseenter', () => {
    trigger.classList.add('refyn-trigger-expanded');
  });

  trigger.addEventListener('mouseleave', () => {
    trigger.classList.remove('refyn-trigger-expanded');
  });

  document.body.appendChild(trigger);
}

function removeTriggerButton(): void {
  document.getElementById(TRIGGER_ID)?.remove();
}

// Initialize trigger button if panel was previously closed
export function initTriggerIfNeeded(): void {
  if (currentPlatform !== 'unknown' && localStorage.getItem('refyn-panel-closed')) {
    createTriggerButton();
  }
}

// =====================================================
// HOVER-TO-SAVE FUNCTIONALITY
// =====================================================

let hoverSaveButton: HTMLElement | null = null;
let currentHoveredElement: HTMLElement | null = null;

/**
 * Initialize hover-to-save for prompts on the page
 */
export function initHoverToSave(): void {
  // Platform-specific prompt selectors (where user prompts appear)
  const promptSelectors: Record<string, string[]> = {
    midjourney: [
      '[class*="promptText"]',
      '[class*="prompt-text"]',
      '[data-prompt]',
      '.message-content',
    ],
    chatgpt: [
      '[data-message-author-role="user"]',
      '.user-message',
    ],
    claude: [
      '[data-role="user"]',
      '.human-message',
    ],
    dalle: [
      '[class*="prompt"]',
      '.prompt-text',
    ],
    leonardo: [
      '[class*="prompt"]',
      '.generation-prompt',
    ],
  };

  const selectors = promptSelectors[currentPlatform] || [];
  if (selectors.length === 0) return;

  // Use event delegation
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;

    // Don't show on Refyn elements
    if (target.closest('[id^="refyn-"]')) return;

    // Check if hovering over a prompt element
    for (const selector of selectors) {
      const promptEl = target.closest(selector) as HTMLElement;
      if (promptEl && promptEl !== currentHoveredElement) {
        showHoverSaveButton(promptEl);
        return;
      }
    }
  });

  document.addEventListener('mouseout', (e) => {
    const relatedTarget = e.relatedTarget as HTMLElement;

    // If moving to the save button itself, keep it visible
    if (relatedTarget?.closest('#refyn-hover-save')) return;

    // If moving to another prompt element, the mouseover handler will handle it
    // Otherwise, hide after a short delay
    setTimeout(() => {
      if (!document.querySelector('#refyn-hover-save:hover')) {
        hideHoverSaveButton();
      }
    }, 100);
  });

  console.log('[Refyn] Hover-to-save initialized for:', currentPlatform);
}

function showHoverSaveButton(promptElement: HTMLElement): void {
  const text = promptElement.textContent?.trim();
  if (!text || text.length < 5) return;

  currentHoveredElement = promptElement;

  // Remove existing button
  hideHoverSaveButton();

  // Create save button
  hoverSaveButton = document.createElement('div');
  hoverSaveButton.id = 'refyn-hover-save';
  hoverSaveButton.className = 'refyn-hover-save';
  hoverSaveButton.innerHTML = `
    <button class="refyn-hover-save-btn" title="Save to Refyn Library">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      <span>Save</span>
    </button>
  `;

  // Store the prompt text
  hoverSaveButton.dataset.prompt = text;

  // Position near the element
  const rect = promptElement.getBoundingClientRect();
  hoverSaveButton.style.cssText = `
    position: fixed;
    top: ${rect.top + window.scrollY - 30}px;
    left: ${rect.left}px;
    z-index: 2147483646;
  `;

  // Click handler
  hoverSaveButton.querySelector('.refyn-hover-save-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const promptText = hoverSaveButton?.dataset.prompt;
    if (!promptText) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_PROMPT',
        payload: {
          content: promptText,
          platform: currentPlatform,
          tags: ['captured'],
        },
      });

      if (response?.success) {
        // Visual feedback
        const btn = hoverSaveButton?.querySelector('.refyn-hover-save-btn');
        if (btn) {
          btn.classList.add('refyn-hover-saved');
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Saved!</span>
          `;
        }
        setTimeout(hideHoverSaveButton, 1500);
      }
    } catch (error) {
      console.error('[Refyn] Failed to save prompt:', error);
    }
  });

  document.body.appendChild(hoverSaveButton);

  // Animate in
  requestAnimationFrame(() => {
    hoverSaveButton?.classList.add('refyn-hover-save-visible');
  });
}

function hideHoverSaveButton(): void {
  if (hoverSaveButton) {
    hoverSaveButton.classList.remove('refyn-hover-save-visible');
    hoverSaveButton.classList.add('refyn-hover-save-fade');
    setTimeout(() => {
      hoverSaveButton?.remove();
      hoverSaveButton = null;
      currentHoveredElement = null;
    }, 150);
  }
}

// =====================================================
// LEARNING INDICATOR & QUICK RATE
// =====================================================

/**
 * Flash the learning indicator to show Refyn learned something
 */
export function flashLearningIndicator(message?: string): void {
  const indicator = document.getElementById('refyn-learning-indicator');
  if (!indicator) return;

  // Add active class for animation
  indicator.classList.add('refyn-learning-active');

  // Update tooltip with message
  if (message) {
    indicator.title = message;
  }

  // Remove active class after animation
  setTimeout(() => {
    indicator.classList.remove('refyn-learning-active');
    indicator.title = 'Refyn is learning your preferences';
  }, 2000);
}

/**
 * Global popup coordination - ensures only one feedback popup shows at a time
 */
function hideAllFeedbackPopups(): void {
  hideQuickRatePopup();
  hideTrashFeedbackPopup();
  // Also hide any like feedback popups from OutputObserver
  document.getElementById('refyn-like-feedback')?.remove();
}

/**
 * Get smart position for popups - avoids the main panel area
 */
function getSmartPopupPosition(): { bottom: number; right: number; left?: number } {
  const panelRect = panel?.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  // If panel is visible and on the right side, position popup on the left
  if (panelRect && panelRect.right > viewportWidth - 400) {
    return { bottom: 80, left: 24, right: -1 };
  }

  // Otherwise position on the right but above the panel area
  return { bottom: 80, right: 24 };
}

/**
 * Show quick-rate popup after a new output is detected
 */
let quickRateElement: HTMLElement | null = null;
let quickRateTimeout: ReturnType<typeof setTimeout> | null = null;

export function showQuickRatePopup(outputId: string, prompt?: string): void {
  // Hide all other feedback popups first
  hideAllFeedbackPopups();

  quickRateElement = document.createElement('div');
  quickRateElement.className = 'refyn-quick-rate';
  quickRateElement.innerHTML = `
    <div class="refyn-quick-rate-inner">
      <span class="refyn-quick-rate-label">New output detected</span>
      <div class="refyn-quick-rate-buttons">
        <button class="refyn-quick-rate-btn refyn-quick-like" data-action="like" title="I like this">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
        </button>
        <button class="refyn-quick-rate-btn refyn-quick-dislike" data-action="dislike" title="I don't like this">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
          </svg>
        </button>
        <button class="refyn-quick-rate-btn refyn-quick-dismiss" data-action="dismiss" title="Dismiss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Store output info for rating
  quickRateElement.dataset.outputId = outputId;
  quickRateElement.dataset.prompt = prompt || '';

  // Smart positioning to avoid main panel
  const pos = getSmartPopupPosition();
  if (pos.left !== undefined && pos.left >= 0) {
    quickRateElement.style.cssText = `
      position: fixed;
      bottom: ${pos.bottom}px;
      left: ${pos.left}px;
      right: auto;
      z-index: 2147483646;
      animation: refyn-quick-rate-in 0.3s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  } else {
    quickRateElement.style.cssText = `
      position: fixed;
      bottom: ${pos.bottom}px;
      right: ${pos.right}px;
      z-index: 2147483646;
      animation: refyn-quick-rate-in 0.3s ease;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  }

  // Add click handlers
  quickRateElement.querySelectorAll('.refyn-quick-rate-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const action = (btn as HTMLElement).dataset.action;
      const storedPrompt = quickRateElement?.dataset.prompt;
      const storedOutputId = quickRateElement?.dataset.outputId;

      if (action === 'dismiss') {
        hideQuickRatePopup();
        return;
      }

      if (action && storedPrompt && storedOutputId) {
        // Dynamic import to avoid circular dependency
        const { recordOutputFeedback } = await import('@/lib/deepLearning');
        await recordOutputFeedback(
          storedPrompt,
          storedOutputId,
          currentPlatform,
          action as 'like' | 'dislike'
        );

        // Visual feedback
        (btn as HTMLElement).classList.add('active');
        flashLearningIndicator(action === 'like' ? 'Preference saved!' : 'Will avoid similar');

        setTimeout(() => hideQuickRatePopup(), 500);
      } else {
        hideQuickRatePopup();
      }
    });
  });

  document.body.appendChild(quickRateElement);

  // Auto-dismiss after 8 seconds
  quickRateTimeout = setTimeout(() => {
    hideQuickRatePopup();
  }, 8000);
}

function hideQuickRatePopup(): void {
  if (quickRateTimeout) {
    clearTimeout(quickRateTimeout);
    quickRateTimeout = null;
  }

  if (quickRateElement) {
    quickRateElement.classList.add('refyn-quick-rate-fade');
    setTimeout(() => {
      quickRateElement?.remove();
      quickRateElement = null;
    }, 200);
  }
}

// =====================================================
// TRASH/DELETE OBSERVER & FEEDBACK
// =====================================================

const TRASH_FEEDBACK_PRESETS = [
  { id: 'poor-quality', label: 'Poor quality' },
  { id: 'wrong-style', label: 'Wrong style' },
  { id: 'doesnt-match', label: "Doesn't match" },
  { id: 'too-similar', label: 'Too similar' },
  { id: 'bad-composition', label: 'Bad composition' },
  { id: 'other', label: 'Other...' },
];

let trashFeedbackElement: HTMLElement | null = null;
let trashFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;
let trashObserver: MutationObserver | null = null;
let lastTrashedPrompt: string = '';

/**
 * Initialize trash/delete button observer
 */
export function initTrashObserver(): void {
  if (trashObserver) return;

  // Platform-specific selectors for trash/delete buttons
  const trashSelectors: Record<string, string[]> = {
    midjourney: [
      'button[aria-label*="delete" i]',
      'button[aria-label*="trash" i]',
      'button[aria-label*="remove" i]',
      '[class*="trash" i]',
      '[class*="delete" i]',
      '[class*="remove" i]',
      'button[title*="delete" i]',
      'button[title*="trash" i]',
      'button[title*="remove" i]',
      '[data-testid*="delete"]',
      // Midjourney specific
      '[class*="DislikeButton"]',
      '[class*="RemoveButton"]',
      'svg[class*="trash"]',
      'svg[class*="delete"]',
    ],
    higgsfield: [
      'button[aria-label*="delete" i]',
      'button[aria-label*="trash" i]',
      '[class*="delete" i]',
      '[class*="trash" i]',
      '[class*="remove" i]',
      'button[title*="delete" i]',
      '[data-action="delete"]',
      '[data-testid*="delete"]',
      'svg[class*="trash"]',
      'svg[class*="delete"]',
    ],
    dalle: [
      'button[aria-label*="delete" i]',
      '[class*="delete" i]',
      '[class*="trash" i]',
    ],
    leonardo: [
      'button[aria-label*="delete" i]',
      '[class*="trash" i]',
      '[class*="delete" i]',
    ],
    runway: [
      'button[aria-label*="delete" i]',
      '[class*="delete" i]',
      '[class*="remove" i]',
    ],
    pika: [
      'button[aria-label*="delete" i]',
      '[class*="delete" i]',
      '[class*="trash" i]',
    ],
  };

  const selectors = trashSelectors[currentPlatform] || trashSelectors.midjourney;

  // Use event delegation for better performance
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Check if clicked element or its parents match trash selectors
    for (const selector of selectors) {
      const trashButton = target.closest(selector);
      if (trashButton && !target.closest('[id^="refyn-"]')) {
        handleTrashClick(e, trashButton as HTMLElement);
        return;
      }
    }
  }, true);

  console.log('[Refyn] Trash observer initialized for:', currentPlatform);
}

/**
 * Handle trash button click
 */
function handleTrashClick(_event: MouseEvent, trashButton: HTMLElement): void {
  // Try to find the associated prompt or image
  const imageContainer = trashButton.closest('[class*="image"], [class*="generation"], [class*="output"], [class*="result"]');
  const promptElement = imageContainer?.querySelector('[class*="prompt"], [class*="description"]');

  // Get the prompt from the tracked input or the container
  lastTrashedPrompt = promptElement?.textContent || trackedInput ? getInputText(trackedInput!) : '';

  // Show feedback popup near the trash button
  const rect = trashButton.getBoundingClientRect();
  showTrashFeedbackPopup(rect.left, rect.top);
}

/**
 * Show trash feedback popup
 */
function showTrashFeedbackPopup(_x: number, _y: number): void {
  // Hide all other feedback popups first
  hideAllFeedbackPopups();

  trashFeedbackElement = document.createElement('div');
  trashFeedbackElement.id = 'refyn-trash-feedback';
  trashFeedbackElement.className = 'refyn-trash-feedback';
  trashFeedbackElement.innerHTML = `
    <div class="refyn-trash-feedback-inner">
      <div class="refyn-trash-feedback-header">
        <span class="refyn-trash-feedback-title">What went wrong?</span>
        <button class="refyn-trash-feedback-close" data-action="close">
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
      <div class="refyn-trash-feedback-options">
        ${TRASH_FEEDBACK_PRESETS.map(preset => `
          <button class="refyn-trash-feedback-btn" data-reason="${preset.id}">
            <span class="refyn-trash-feedback-label">${preset.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="refyn-trash-feedback-custom" id="refyn-trash-custom" style="display: none;">
        <input type="text" class="refyn-trash-feedback-input" placeholder="Other reason..." maxlength="100">
        <button class="refyn-trash-feedback-submit" data-action="submit-custom">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
      <div class="refyn-trash-feedback-skip">
        <button class="refyn-trash-feedback-skip-btn" data-action="skip">Skip</button>
      </div>
    </div>
  `;

  // Position at fixed corner (same as like feedback) with smart positioning
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
      right: 24px;
      z-index: 2147483646;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
  }

  trashFeedbackElement.style.cssText = positionStyle;

  // Track selected reason (don't submit until both star + reason are set)
  let selectedTrashReason: string | null = null;

  // Helper to check if both selections are made and auto-submit
  const checkAndSubmitTrash = () => {
    const starsContainer = trashFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);

    if (starRating > 0 && selectedTrashReason) {
      // Both selected - show brief confirmation then submit
      const inner = trashFeedbackElement?.querySelector('.refyn-trash-feedback-inner');
      if (inner) {
        inner.classList.add('refyn-feedback-submitting');
      }
      setTimeout(() => {
        if (selectedTrashReason === 'custom') {
          const input = trashFeedbackElement?.querySelector('.refyn-trash-feedback-input') as HTMLInputElement;
          submitTrashFeedback('custom', input?.value?.trim() || '');
        } else {
          submitTrashFeedback(selectedTrashReason || 'unknown');
        }
      }, 400);
    }
  };

  // Add event listeners - reason buttons just select, don't submit
  trashFeedbackElement.querySelectorAll('.refyn-trash-feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const reason = (btn as HTMLElement).dataset.reason;

      // Clear previous selection
      trashFeedbackElement?.querySelectorAll('.refyn-trash-feedback-btn').forEach(b => {
        b.classList.remove('active');
      });

      // Set new selection
      btn.classList.add('active');

      if (reason === 'other') {
        // Show custom input
        const customSection = trashFeedbackElement?.querySelector('#refyn-trash-custom') as HTMLElement;
        if (customSection) {
          customSection.style.display = 'flex';
          const input = customSection.querySelector('input');
          input?.focus();
        }
        selectedTrashReason = 'custom';
      } else {
        selectedTrashReason = reason || null;
        // Check if we can submit (both star + reason selected)
        checkAndSubmitTrash();
      }
    });
  });

  // Close button
  trashFeedbackElement.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    hideTrashFeedbackPopup();
  });

  // Skip button - allows skipping without both selections
  trashFeedbackElement.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
    const starsContainer = trashFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);
    if (starRating > 0 || selectedTrashReason) {
      submitTrashFeedback(selectedTrashReason || 'skipped');
    } else {
      flashLearningIndicator('Noted');
      hideTrashFeedbackPopup();
    }
  });

  // Custom input - track typing
  const trashCustomInput = trashFeedbackElement.querySelector('.refyn-trash-feedback-input') as HTMLInputElement;
  trashCustomInput?.addEventListener('input', () => {
    if (trashCustomInput.value?.trim()) {
      selectedTrashReason = 'custom';
    }
  });

  // Custom submit button
  trashFeedbackElement.querySelector('[data-action="submit-custom"]')?.addEventListener('click', () => {
    const input = trashFeedbackElement?.querySelector('.refyn-trash-feedback-input') as HTMLInputElement;
    if (input?.value?.trim()) {
      selectedTrashReason = 'custom';
      checkAndSubmitTrash();
      // If no stars selected, prompt user
      const starsContainer = trashFeedbackElement?.querySelector('.refyn-feedback-stars');
      const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);
      if (starRating === 0) {
        starsContainer?.classList.add('refyn-feedback-stars-highlight');
        setTimeout(() => starsContainer?.classList.remove('refyn-feedback-stars-highlight'), 1000);
      }
    }
  });

  // Enter key on custom input
  trashFeedbackElement.querySelector('.refyn-trash-feedback-input')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const input = e.target as HTMLInputElement;
      if (input.value?.trim()) {
        selectedTrashReason = 'custom';
        checkAndSubmitTrash();
      }
    }
  });

  // Star rating handlers
  trashFeedbackElement.querySelectorAll('.refyn-feedback-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rating = parseInt((star as HTMLElement).dataset.star || '0', 10);
      const starsContainer = trashFeedbackElement?.querySelector('.refyn-feedback-stars');
      if (starsContainer) {
        starsContainer.setAttribute('data-rating', String(rating));
        // Update visual state
        trashFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach((s, i) => {
          if (i < rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      }
      // Check if we can submit
      checkAndSubmitTrash();
    });

    // Hover preview
    star.addEventListener('mouseenter', () => {
      const rating = parseInt((star as HTMLElement).dataset.star || '0', 10);
      trashFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach((s, i) => {
        if (i < rating) {
          s.classList.add('hover');
        } else {
          s.classList.remove('hover');
        }
      });
    });

    star.addEventListener('mouseleave', () => {
      trashFeedbackElement?.querySelectorAll('.refyn-feedback-star').forEach(s => {
        s.classList.remove('hover');
      });
    });
  });

  document.body.appendChild(trashFeedbackElement);

  // Animate in
  requestAnimationFrame(() => {
    trashFeedbackElement?.classList.add('refyn-trash-feedback-visible');
  });

  // Auto-dismiss after 20 seconds (longer since user needs to make two selections)
  trashFeedbackTimeout = setTimeout(() => {
    if (selectedTrashReason) {
      submitTrashFeedback(selectedTrashReason);
    } else {
      hideTrashFeedbackPopup();
    }
  }, 20000);
}

/**
 * Submit trash feedback
 */
async function submitTrashFeedback(reason: string, customText?: string): Promise<void> {
  try {
    // Get star rating
    const starsContainer = trashFeedbackElement?.querySelector('.refyn-feedback-stars');
    const starRating = parseInt(starsContainer?.getAttribute('data-rating') || '0', 10);

    // Record the feedback with star rating
    const { recordTrashFeedback } = await import('@/lib/deepLearning');
    await recordTrashFeedback(
      lastTrashedPrompt,
      currentPlatform,
      reason,
      customText,
      starRating
    );

    // Show confirmation
    const ratingInfo = starRating > 0 ? ` (${starRating}★)` : '';
    flashLearningIndicator(`Noted: ${reason === 'skipped' ? 'Skipped' : reason.replace('-', ' ')}${ratingInfo}`);

    console.log('[Refyn] Trash feedback recorded:', { reason, customText, starRating, prompt: lastTrashedPrompt.substring(0, 50) });
  } catch (error) {
    console.error('[Refyn] Error recording trash feedback:', error);
  }

  hideTrashFeedbackPopup();
}

/**
 * Hide trash feedback popup
 */
function hideTrashFeedbackPopup(): void {
  if (trashFeedbackTimeout) {
    clearTimeout(trashFeedbackTimeout);
    trashFeedbackTimeout = null;
  }

  if (trashFeedbackElement) {
    trashFeedbackElement.classList.remove('refyn-trash-feedback-visible');
    trashFeedbackElement.classList.add('refyn-trash-feedback-fade');
    setTimeout(() => {
      trashFeedbackElement?.remove();
      trashFeedbackElement = null;
    }, 200);
  }
}

// =====================================================
// AUTH & CLOUD SYNC
// =====================================================

/**
 * Check authentication state on load
 */
async function checkAuthState(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'AUTH_GET_STATE' });

    if (response?.success && response.data) {
      updateAuthUI(response.data);
    }
  } catch (error) {
    console.error('[Refyn] Failed to check auth state:', error);
  }
}

/**
 * Update auth UI based on state
 */
function updateAuthUI(state: { isLoggedIn: boolean; isConfigured: boolean; user?: { email?: string } }): void {
  const authForm = panel?.querySelector('#refyn-auth-form') as HTMLElement;
  const loggedInSection = panel?.querySelector('#refyn-auth-logged-in') as HTMLElement;
  const userEmail = panel?.querySelector('#refyn-user-email');
  const syncIndicator = panel?.querySelector('#refyn-sync-status');

  if (!authForm || !loggedInSection) return;

  if (!state.isConfigured) {
    authForm.style.display = 'flex';
    loggedInSection.style.display = 'none';
    syncIndicator?.classList.add('offline');
    return;
  }

  if (state.isLoggedIn && state.user) {
    authForm.style.display = 'none';
    loggedInSection.style.display = 'flex';
    if (userEmail) userEmail.textContent = state.user.email || 'Logged in';
    syncIndicator?.classList.remove('offline');
    syncIndicator?.classList.add('synced');
  } else {
    authForm.style.display = 'flex';
    loggedInSection.style.display = 'none';
    syncIndicator?.classList.add('offline');
    syncIndicator?.classList.remove('synced');
  }
}

/**
 * Handle login
 */
async function handleLogin(): Promise<void> {
  const emailInput = panel?.querySelector('#refyn-auth-email') as HTMLInputElement;
  const passwordInput = panel?.querySelector('#refyn-auth-password') as HTMLInputElement;
  const errorEl = panel?.querySelector('#refyn-auth-error') as HTMLElement;
  const loginBtn = panel?.querySelector('#refyn-auth-login') as HTMLButtonElement;

  if (!emailInput?.value || !passwordInput?.value) {
    if (errorEl) errorEl.textContent = 'Email and password required';
    return;
  }

  if (errorEl) errorEl.textContent = '';
  if (loginBtn) loginBtn.textContent = '...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AUTH_SIGN_IN',
      payload: { email: emailInput.value, password: passwordInput.value },
    });

    if (response?.success) {
      updateAuthUI({ isLoggedIn: true, isConfigured: true, user: response.user });
      passwordInput.value = '';
      showToast('Logged in - syncing your data...');

      // Sync local data to cloud after login
      try {
        const syncResponse = await chrome.runtime.sendMessage({ type: 'SYNC_TO_CLOUD' });
        if (syncResponse?.success) {
          showToast('Data synced to cloud');
        }
      } catch (syncErr) {
        console.error('[Refyn] Post-login sync failed:', syncErr);
      }
    } else {
      if (errorEl) errorEl.textContent = response?.error || 'Login failed';
    }
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Login failed';
  }

  if (loginBtn) loginBtn.textContent = 'Log In';
}

/**
 * Handle sign up
 */
async function handleSignUp(): Promise<void> {
  const emailInput = panel?.querySelector('#refyn-auth-email') as HTMLInputElement;
  const passwordInput = panel?.querySelector('#refyn-auth-password') as HTMLInputElement;
  const errorEl = panel?.querySelector('#refyn-auth-error') as HTMLElement;
  const signupBtn = panel?.querySelector('#refyn-auth-signup') as HTMLButtonElement;

  if (!emailInput?.value || !passwordInput?.value) {
    if (errorEl) errorEl.textContent = 'Email and password required';
    return;
  }

  if (passwordInput.value.length < 6) {
    if (errorEl) errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  if (errorEl) errorEl.textContent = '';
  if (signupBtn) signupBtn.textContent = '...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'AUTH_SIGN_UP',
      payload: { email: emailInput.value, password: passwordInput.value },
    });

    if (response?.success) {
      passwordInput.value = '';

      // If user is returned, they're logged in (no email verification required)
      if (response.user) {
        updateAuthUI({ isLoggedIn: true, isConfigured: true, user: response.user });
        showToast('Account created - syncing your data...');

        // Sync local data to cloud immediately
        try {
          const syncResponse = await chrome.runtime.sendMessage({ type: 'SYNC_TO_CLOUD' });
          if (syncResponse?.success) {
            showToast('Data synced to cloud');
          }
        } catch (syncErr) {
          console.error('[Refyn] Post-signup sync failed:', syncErr);
        }
      } else {
        showToast('Account created! Check email to verify.');
      }
    } else {
      if (errorEl) errorEl.textContent = response?.error || 'Sign up failed';
    }
  } catch (error) {
    if (errorEl) errorEl.textContent = 'Sign up failed';
  }

  if (signupBtn) signupBtn.textContent = 'Sign Up';
}

/**
 * Handle logout
 */
async function handleLogout(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'AUTH_SIGN_OUT' });

    if (response?.success) {
      updateAuthUI({ isLoggedIn: false, isConfigured: true });
      showToast('Logged out');
    }
  } catch (error) {
    console.error('[Refyn] Logout failed:', error);
  }
}

/**
 * Handle manual sync
 */
async function handleSync(): Promise<void> {
  const syncBtn = panel?.querySelector('#refyn-sync-btn') as HTMLButtonElement;
  const syncIndicator = panel?.querySelector('#refyn-sync-status');

  if (syncBtn) syncBtn.classList.add('syncing');
  syncIndicator?.classList.add('syncing');
  syncIndicator?.classList.remove('synced');

  try {
    const response = await chrome.runtime.sendMessage({ type: 'SYNC_TO_CLOUD' });

    if (response?.success) {
      showToast('Synced');
      syncIndicator?.classList.add('synced');
    } else {
      showToast('Sync failed', 'error');
    }
  } catch (error) {
    showToast('Sync failed', 'error');
  }

  syncBtn?.classList.remove('syncing');
  syncIndicator?.classList.remove('syncing');
}

// =====================================================
// TASTE LIBRARY HANDLERS
// =====================================================

/**
 * Load taste layers and dimensions into the UI
 */
async function loadTasteLayers(): Promise<void> {
  try {
    const [layersResponse, dimensionsResponse] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'GET_TASTE_LAYERS' }),
      chrome.runtime.sendMessage({ type: 'GET_TASTE_DIMENSIONS' }),
    ]);

    if (!layersResponse?.success || !dimensionsResponse?.success) return;

    const container = panel?.querySelector('#refyn-taste-layers');
    if (!container) return;

    const layers = layersResponse.layers;
    const dimensions = dimensionsResponse.dimensions;

    // Group dimensions by layer
    const dimensionsByLayer: Record<string, typeof dimensions> = {};
    for (const dim of dimensions) {
      if (!dimensionsByLayer[dim.layer]) {
        dimensionsByLayer[dim.layer] = [];
      }
      dimensionsByLayer[dim.layer].push(dim);
    }

    // Build the UI
    let html = '';
    for (const layer of layers as Array<{ id: string; name: string; description: string }>) {
      const layerDims = dimensionsByLayer[layer.id] || [];
      html += `
        <div class="refyn-taste-layer" data-layer="${layer.id}">
          <div class="refyn-layer-label">${layer.name}</div>
          <div class="refyn-layer-options">
            ${layerDims.map((dim: { id: string; name: string; description: string }) => `
              <button class="refyn-dim-btn" data-dim="${dim.id}" title="${dim.description}">
                ${dim.name}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;

    // Add click handlers for dimension buttons
    container.querySelectorAll('.refyn-dim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
      });
    });
  } catch (error) {
    console.error('[Refyn] Failed to load taste layers:', error);
  }
}

/**
 * Handle applying selected taste dimensions
 */
async function handleApplyLayers(): Promise<void> {
  const container = panel?.querySelector('#refyn-taste-layers');
  if (!container) return;

  const selectedDims = Array.from(container.querySelectorAll('.refyn-dim-btn.selected'))
    .map(btn => (btn as HTMLElement).dataset.dim)
    .filter(Boolean) as string[];

  if (selectedDims.length === 0) {
    showToast('Select at least one dimension');
    return;
  }

  const applyBtn = panel?.querySelector('#refyn-apply-layers') as HTMLButtonElement;
  if (applyBtn) applyBtn.textContent = '...';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'APPLY_TASTE_DIMENSIONS',
      payload: { dimensionIds: selectedDims, mode: 'merge' },
    });

    if (response?.success) {
      const names = selectedDims.join(' + ');
      showToast(`Applied: ${names}`);
      // Clear selections
      container.querySelectorAll('.refyn-dim-btn.selected').forEach(btn => {
        btn.classList.remove('selected');
      });
    } else {
      showToast(response?.error || 'Failed to apply', 'error');
    }
  } catch (error) {
    showToast('Failed to apply dimensions', 'error');
  }

  if (applyBtn) applyBtn.textContent = 'Apply';
}

/**
 * Handle exporting taste profile
 */
async function handleExportTaste(): Promise<void> {
  const exportBtn = panel?.querySelector('#refyn-export-taste') as HTMLButtonElement;
  if (exportBtn) exportBtn.classList.add('loading');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT_TASTE_PACK',
      payload: {
        name: 'My Taste Profile',
        description: 'Exported from Refyn',
        tags: ['custom', 'personal'],
      },
    });

    if (response?.success && response.pack) {
      // Download the pack
      const json = JSON.stringify(response.pack, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `refyn-taste-profile-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Taste profile exported');
    } else {
      showToast(response?.error || 'Export failed', 'error');
    }
  } catch (error) {
    showToast('Export failed', 'error');
  }

  if (exportBtn) exportBtn.classList.remove('loading');
}

/**
 * Handle importing taste pack
 */
async function handleImportTaste(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  try {
    const text = await file.text();
    const pack = JSON.parse(text);

    // Validate basic structure
    if (!pack.name || !pack.deepPreferences) {
      showToast('Invalid taste pack file', 'error');
      return;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'IMPORT_TASTE_PACK',
      payload: { pack, mode: 'merge' },
    });

    if (response?.success) {
      showToast(`Imported "${pack.name}"`);
    } else {
      showToast(response?.error || 'Import failed', 'error');
    }
  } catch (error) {
    showToast('Invalid JSON file', 'error');
  }

  // Clear the input
  input.value = '';
}

/**
 * Handle vision analysis toggle
 */
function handleVisionToggle(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  localStorage.setItem('refyn-vision-analysis', checked ? 'true' : 'false');
  showToast(checked ? 'Vision analysis enabled' : 'Vision analysis disabled');
}

// =====================================================
// MIDJOURNEY HISTORY IMPORT
// =====================================================

interface MidjourneyJob {
  prompt: string;
  imageUrl: string;
  isUpscaled: boolean;
  jobId: string;
}

/**
 * Handle Midjourney history import button click
 */
async function handleMidjourneyHistoryImport(): Promise<void> {
  const btn = panel?.querySelector('#refyn-import-mj-history') as HTMLButtonElement;
  const progressContainer = panel?.querySelector('#refyn-import-progress') as HTMLElement;
  const progressFill = panel?.querySelector('#refyn-import-progress-fill') as HTMLElement;
  const statusText = panel?.querySelector('#refyn-import-status') as HTMLElement;

  if (!btn || !progressContainer) return;

  // Check if we're on midjourney.com
  const isMidjourneyWeb = window.location.hostname.includes('midjourney.com');
  const isDiscord = window.location.hostname.includes('discord.com');

  if (!isMidjourneyWeb && !isDiscord) {
    showToast('Go to midjourney.com/app or Discord to import', 'error');
    return;
  }

  // Disable button and show progress
  btn.disabled = true;
  btn.textContent = 'Scanning...';
  progressContainer.style.display = 'block';
  progressFill.style.width = '0%';
  statusText.textContent = 'Scanning gallery...';

  try {
    let jobs: MidjourneyJob[] = [];

    if (isMidjourneyWeb) {
      jobs = await scanMidjourneyWebGallery(statusText);
    } else if (isDiscord) {
      jobs = await scanDiscordHistory(statusText);
    }

    if (jobs.length === 0) {
      statusText.textContent = 'No images found on this page';
      showToast('No Midjourney images found. Try scrolling to load more images first.', 'error');
      resetImportUI(btn, progressContainer);
      return;
    }

    // Filter to upscaled images, or fall back to all images if none detected as upscaled
    let upscaledJobs = jobs.filter(j => j.isUpscaled);

    if (upscaledJobs.length === 0) {
      // No upscaled detected - ask if user wants to import all visible images
      statusText.textContent = `Found ${jobs.length} images but none detected as upscaled. Importing all...`;
      console.log('[Refyn] No upscaled images detected, importing all', jobs.length, 'images');
      // Import all images since the user likely has a gallery of their favorites
      upscaledJobs = jobs;
    } else {
      statusText.textContent = `Found ${upscaledJobs.length} upscaled images. Processing...`;
    }

    // Process in batches
    const batchSize = 5;
    let processed = 0;

    for (let i = 0; i < upscaledJobs.length; i += batchSize) {
      const batch = upscaledJobs.slice(i, i + batchSize);

      await Promise.all(batch.map(async (job) => {
        try {
          // Record as a like
          await chrome.runtime.sendMessage({
            type: 'RECORD_FEEDBACK',
            payload: {
              prompt: job.prompt,
              outputId: job.jobId,
              platform: 'midjourney',
              feedback: 'like',
            },
          });

          // Vision analysis
          if (job.imageUrl) {
            await chrome.runtime.sendMessage({
              type: 'ANALYZE_IMAGE',
              payload: { imageUrl: job.imageUrl, platform: 'midjourney' },
            });
          }
        } catch (e) {
          console.error('[Refyn] Failed to process job:', e);
        }
      }));

      processed += batch.length;
      const percent = Math.round((processed / upscaledJobs.length) * 100);
      progressFill.style.width = `${percent}%`;
      statusText.textContent = `Processed ${processed}/${upscaledJobs.length} images...`;

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < upscaledJobs.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    statusText.textContent = `Done! Imported ${upscaledJobs.length} images`;
    showToast(`Imported ${upscaledJobs.length} images to taste profile!`);

    // Refresh profile display
    loadProfile();

  } catch (error) {
    console.error('[Refyn] Import failed:', error);
    statusText.textContent = 'Import failed';
    showToast('Import failed: ' + String(error), 'error');
  }

  resetImportUI(btn, progressContainer);
}

function resetImportUI(btn: HTMLButtonElement, progressContainer: HTMLElement): void {
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Scan Gallery & Import
    `;
    progressContainer.style.display = 'none';
  }, 2000);
}

/**
 * Scan Midjourney web gallery for upscaled images
 */
async function scanMidjourneyWebGallery(statusText: HTMLElement): Promise<MidjourneyJob[]> {
  const jobs: MidjourneyJob[] = [];
  const seenUrls = new Set<string>();

  // Strategy 1: Find all images that look like Midjourney outputs
  const allImages = document.querySelectorAll('img');
  statusText.textContent = `Scanning ${allImages.length} images...`;

  console.log('[Refyn] Starting gallery scan, found', allImages.length, 'images');

  allImages.forEach((img, index) => {
    try {
      const src = img.src || img.getAttribute('data-src') || '';

      // Skip if not a Midjourney CDN image or already seen
      if (!src || seenUrls.has(src)) return;
      if (!src.includes('midjourney') && !src.includes('mj-') && !src.includes('cdn.discordapp')) {
        // Also check for common CDN patterns used by MJ
        if (!src.includes('imagedelivery') && !src.includes('cloudflare')) return;
      }

      seenUrls.add(src);

      // Find prompt by traversing up the DOM looking for text content
      let prompt = '';
      let element: HTMLElement | null = img as HTMLElement;
      let depth = 0;
      const maxDepth = 10;

      while (element && depth < maxDepth && !prompt) {
        depth++;
        element = element.parentElement;
        if (!element) break;

        // Look for prompt in various places
        // 1. Title attribute on any parent
        if (element.title && element.title.length > 10) {
          prompt = element.title;
          break;
        }

        // 2. Data attributes that might contain prompt
        const dataPrompt = element.getAttribute('data-prompt') ||
                          element.getAttribute('data-description') ||
                          element.getAttribute('aria-label');
        if (dataPrompt && dataPrompt.length > 10) {
          prompt = dataPrompt;
          break;
        }

        // 3. Look for a sibling or child element with prompt text
        const promptEl = element.querySelector('[class*="prompt" i], [class*="description" i], [class*="caption" i], [class*="text" i]');
        if (promptEl?.textContent && promptEl.textContent.length > 10 && promptEl.textContent.length < 2000) {
          prompt = promptEl.textContent.trim();
          break;
        }

        // 4. Check for text in the immediate area (but not too much)
        const textContent = element.textContent?.trim() || '';
        if (textContent.length > 15 && textContent.length < 500) {
          // Make sure it's not just UI text
          if (!textContent.match(/^(loading|error|click|download|share|copy|save|delete|edit)/i)) {
            prompt = textContent;
            break;
          }
        }
      }

      // Also try alt text
      if (!prompt && img.alt && img.alt.length > 10) {
        prompt = img.alt;
      }

      // Determine if upscaled
      const isUpscaled = detectIfUpscaledFromImage(img, src);

      // Only add if we have a prompt or it's definitely an upscaled MJ image
      if (prompt || isUpscaled) {
        jobs.push({
          prompt: prompt || '[No prompt found]',
          imageUrl: src,
          isUpscaled,
          jobId: `mj-import-${index}-${Date.now()}`,
        });
        console.log('[Refyn] Found image:', { prompt: prompt?.substring(0, 50), isUpscaled, src: src.substring(0, 80) });
      }
    } catch (e) {
      console.error('[Refyn] Failed to parse image:', e);
    }
  });

  // Strategy 2: Look for grid items / cards that might contain images
  const gridItems = document.querySelectorAll('[class*="grid"] > *, [class*="gallery"] > *, [class*="masonry"] > *, [role="listitem"], [role="gridcell"]');

  gridItems.forEach((item, index) => {
    try {
      const img = item.querySelector('img') as HTMLImageElement;
      if (!img?.src || seenUrls.has(img.src)) return;

      seenUrls.add(img.src);

      // Get prompt from the item
      const prompt = item.getAttribute('title') ||
                    item.getAttribute('aria-label') ||
                    item.querySelector('[class*="prompt" i], [class*="text" i]')?.textContent?.trim() || '';

      if (prompt.length > 10) {
        const isUpscaled = detectIfUpscaledFromImage(img, img.src);
        jobs.push({
          prompt,
          imageUrl: img.src,
          isUpscaled,
          jobId: `mj-grid-${index}-${Date.now()}`,
        });
      }
    } catch (e) {
      // Ignore errors
    }
  });

  console.log('[Refyn] Gallery scan complete. Found', jobs.length, 'potential images,', jobs.filter(j => j.isUpscaled).length, 'upscaled');
  statusText.textContent = `Found ${jobs.length} images (${jobs.filter(j => j.isUpscaled).length} upscaled)`;

  return jobs;
}

/**
 * Detect if an image is upscaled based on image properties and URL
 */
function detectIfUpscaledFromImage(img: HTMLImageElement, src: string): boolean {
  // Check URL patterns
  const urlLower = src.toLowerCase();
  if (urlLower.includes('upscale') || urlLower.includes('_u_') || urlLower.includes('-u-') || urlLower.includes('/u/')) {
    return true;
  }

  // Check for high resolution indicators in URL
  if (urlLower.includes('_2048') || urlLower.includes('_1024') || urlLower.includes('high') || urlLower.includes('full')) {
    return true;
  }

  // Check actual image dimensions if loaded
  if (img.naturalWidth > 1000 && img.naturalHeight > 1000) {
    return true;
  }

  // Check if displayed large (suggests it's a detail/upscaled view)
  const rect = img.getBoundingClientRect();
  if (rect.width > 500 && rect.height > 500) {
    return true;
  }

  // Check for single image in container (upscales are single, grids are 4)
  const parent = img.parentElement;
  if (parent) {
    const siblingImgs = parent.querySelectorAll('img');
    if (siblingImgs.length === 1) {
      // Single image - could be upscaled
      // Check grandparent for more context
      const grandparent = parent.parentElement;
      if (grandparent) {
        const nearbyImgs = grandparent.querySelectorAll('img');
        if (nearbyImgs.length === 1) {
          return true; // Definitely a single image view
        }
      }
    }
  }

  return false;
}

/**
 * Scan Discord history for Midjourney upscales
 */
async function scanDiscordHistory(statusText: HTMLElement): Promise<MidjourneyJob[]> {
  const jobs: MidjourneyJob[] = [];

  // Find all Midjourney bot messages
  const messages = document.querySelectorAll('[class*="message"]');

  statusText.textContent = `Scanning ${messages.length} messages...`;

  messages.forEach((msg, index) => {
    try {
      // Check if this is a Midjourney bot message
      const authorName = msg.querySelector('[class*="username"], [class*="author"]')?.textContent || '';
      if (!authorName.toLowerCase().includes('midjourney')) return;

      // Find images in this message
      const images = msg.querySelectorAll('img[src*="cdn.discordapp"], img[src*="cdn.midjourney"]');
      if (images.length === 0) return;

      // Find the prompt - usually in bold at the start of the message
      const messageContent = msg.querySelector('[class*="messageContent"], [class*="markup"]');
      const messageText = messageContent?.textContent || '';

      // Extract prompt from **prompt** format
      const promptMatch = messageText.match(/\*\*(.+?)\*\*/);
      const prompt = promptMatch ? promptMatch[1] : '';

      if (!prompt || prompt.length < 5) return;

      // Check if this is an upscaled image
      // Upscaled images typically:
      // - Have only 1 image (not 4-grid)
      // - Message contains "Upscaled" or "Image #"
      const isUpscaled = images.length === 1 &&
        (messageText.includes('Upscaled') ||
         messageText.includes('Image #') ||
         messageText.match(/U[1-4]\)/));

      if (isUpscaled) {
        const img = images[0] as HTMLImageElement;
        jobs.push({
          prompt,
          imageUrl: img.src,
          isUpscaled: true,
          jobId: `discord-import-${index}-${Date.now()}`,
        });
      }
    } catch (e) {
      console.error('[Refyn] Failed to parse Discord message:', e);
    }
  });

  return jobs;
}


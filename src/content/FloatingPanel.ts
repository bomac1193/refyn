import { detectPlatform, findPromptInputs, getInputText, setInputText, getPlatformInputSelector } from './platformDetector';
import type { Platform, OptimizationMode } from '@/shared/types';
import { PLATFORMS } from '@/shared/constants';
import { getPresetsForCategory } from '@/shared/presets';
import { recordFeedback, getPreferenceContext } from '@/lib/preferences';
import { getSuggestedKeywords, getKeywordsToAvoid, getSmartSuggestionContext } from '@/lib/deepLearning';
import { getQuickQuality } from '@/lib/promptAnalyzer';

let panel: HTMLElement | null = null;
let isMinimized = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentPlatform: Platform = 'unknown';
let selectedMode: OptimizationMode = 'enhance';
let selectedPreset: string | null = null;
let lastOriginalPrompt = '';
let lastRefinedPrompt = '';
let isMoodboardMode = false;

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

function generatePresetOptions(): string {
  const platformInfo = PLATFORMS[currentPlatform] || PLATFORMS.unknown;
  const presets = getPresetsForCategory(platformInfo.category);

  return presets.map(preset => `
    <button class="refyn-preset-btn ${selectedPreset === preset.id ? 'active' : ''}"
            data-preset="${preset.id}"
            title="${preset.description}">
      ${preset.name}
    </button>
  `).join('');
}

// Smart suggestions section (populated dynamically)
async function loadSmartSuggestions(): Promise<void> {
  const suggestionsContainer = panel?.querySelector('#refyn-suggestions-content');
  if (!suggestionsContainer) return;

  try {
    const [suggested, avoid] = await Promise.all([
      getSuggestedKeywords(currentPlatform, 5),
      getKeywordsToAvoid(currentPlatform, 3),
    ]);

    if (suggested.length === 0 && avoid.length === 0) {
      // No preferences learned yet
      suggestionsContainer.innerHTML = `
        <span class="refyn-no-suggestions">Rate some outputs to see personalized suggestions</span>
      `;
      return;
    }

    let html = '';

    // Suggested keywords (to add)
    for (const s of suggested) {
      html += `
        <button class="refyn-suggestion-chip" data-keyword="${s.keyword}" title="Click to add to prompt">
          <span class="refyn-suggestion-add">+</span>
          ${s.keyword}
        </button>
      `;
    }

    // Keywords to avoid
    for (const a of avoid) {
      html += `
        <button class="refyn-suggestion-chip refyn-avoid" data-avoid="${a.keyword}" title="You disliked outputs with this">
          <span class="refyn-suggestion-remove">-</span>
          ${a.keyword}
        </button>
      `;
    }

    suggestionsContainer.innerHTML = html;

    // Add click handlers
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
      <!-- Header (always visible) -->
      <div class="refyn-panel-header" id="refyn-drag-handle">
        <div class="refyn-panel-logo">
          <div class="refyn-logo-icon">R</div>
          <span class="refyn-logo-text">Refyn</span>
        </div>
        <div class="refyn-panel-platform">
          <span class="refyn-platform-dot" style="background: ${platformInfo.color}"></span>
          <span class="refyn-platform-name">${platformInfo.name}</span>
        </div>
        <div class="refyn-learning-indicator" id="refyn-learning-indicator" title="Refyn is learning your preferences">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
        </div>
        <div class="refyn-panel-controls">
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

      <!-- Body (hidden when minimized) -->
      <div class="refyn-panel-body" id="refyn-panel-body">
        <!-- Live Sync Toggle -->
        <div class="refyn-sync-bar">
          <div class="refyn-sync-status" id="refyn-sync-status">
            <span class="refyn-sync-dot ${isLiveSyncEnabled ? 'refyn-sync-active' : ''}"></span>
            <span class="refyn-sync-text" id="refyn-sync-text">${isLiveSyncEnabled ? 'Live Sync Active' : 'Live Sync Off'}</span>
          </div>
          <button class="refyn-sync-toggle ${isLiveSyncEnabled ? 'active' : ''}" id="refyn-sync-toggle" title="Toggle live sync">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>

        <!-- Moodboard Toggle (Midjourney only) -->
        ${currentPlatform === 'midjourney' ? `
        <div class="refyn-moodboard-toggle">
          <label class="refyn-toggle-label">
            <input type="checkbox" id="refyn-moodboard-checkbox" ${isMoodboardMode ? 'checked' : ''}>
            <span class="refyn-toggle-switch"></span>
            <span class="refyn-toggle-text">Moodboard Mode</span>
            <span class="refyn-toggle-hint">(removes --weird)</span>
          </label>
        </div>
        ` : ''}

        <!-- Mode Selector -->
        <div class="refyn-mode-selector">
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

        <!-- Style Presets -->
        <div class="refyn-presets-section">
          <div class="refyn-presets-header">
            <span>Style Preset</span>
            <button class="refyn-preset-clear ${!selectedPreset ? 'hidden' : ''}" id="refyn-clear-preset" title="Clear preset">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="refyn-presets-grid" id="refyn-presets-grid">
            ${generatePresetOptions()}
          </div>
        </div>

        <!-- Smart Suggestions (Learned Preferences) -->
        <div class="refyn-suggestions-section" id="refyn-suggestions-section">
          <div class="refyn-suggestions-header">
            <div class="refyn-suggestions-title">
              <span class="refyn-suggestions-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
              Your Taste Profile
            </div>
            <button class="refyn-suggestions-toggle" id="refyn-refresh-suggestions" title="Refresh suggestions">
              Refresh
            </button>
          </div>
          <div class="refyn-suggestions-content" id="refyn-suggestions-content">
            <span class="refyn-no-suggestions">Loading preferences...</span>
          </div>
        </div>

        <!-- Input Area -->
        <div class="refyn-input-section">
          <div class="refyn-input-header">
            <span>Your Prompt</span>
            <div class="refyn-input-actions">
              <div class="refyn-quality-indicator" id="refyn-quality-indicator" title="Prompt quality score">
                <span class="refyn-quality-grade" id="refyn-quality-grade">-</span>
                <div class="refyn-quality-bar">
                  <div class="refyn-quality-fill" id="refyn-quality-fill"></div>
                </div>
              </div>
              <span class="refyn-char-count" id="refyn-char-count">0 chars</span>
              <button class="refyn-grab-btn" id="refyn-grab-prompt" title="Grab from page">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Grab
              </button>
            </div>
          </div>
          <textarea id="refyn-input" class="refyn-textarea" placeholder="Type in your prompt field - syncs automatically..." rows="2"></textarea>
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
            <div class="refyn-output-actions">
              <button class="refyn-small-btn" id="refyn-save-btn" title="Save to Library">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              <button class="refyn-small-btn" id="refyn-copy-btn" title="Copy">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="refyn-small-btn" id="refyn-insert-btn" title="Insert into page">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </button>
            </div>
          </div>
          <div id="refyn-output" class="refyn-output-text"></div>

          <!-- Feedback Section -->
          <div class="refyn-feedback-section">
            <span class="refyn-feedback-label">How was this result?</span>
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
  const preferenceContext = await getPreferenceContext();

  // Get smart suggestion context from deep learning system
  const smartContext = await getSmartSuggestionContext(currentPlatform);

  // Combine both contexts
  const combinedContext = preferenceContext + smartContext;

  console.log('[Refyn Panel] Sending to background:', {
    platform: currentPlatform,
    mode: selectedMode,
    presetId: selectedPreset,
    hasPreferences: !!combinedContext,
    promptLength: prompt.length
  });
  setLoading(true);
  hideError();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      payload: {
        prompt,
        platform: currentPlatform,
        mode: selectedMode,
        presetId: selectedPreset,
        preferenceContext: combinedContext,
      },
    });

    console.log('[Refyn Panel] Response:', response);

    if (response?.success && response?.data?.optimizedPrompt) {
      // Store refined prompt for feedback
      lastRefinedPrompt = response.data.optimizedPrompt;
      showOutput(response.data.optimizedPrompt);
      showToast('Prompt refined!');
    } else {
      console.error('[Refyn Panel] Error:', response?.error);
      showError(response?.error || 'Failed to refine prompt. Check your API key in settings.');
    }
  } catch (error) {
    console.error('[Refyn Panel] Connection error:', error);
    showError('Connection error. Make sure the extension is enabled.');
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

  if (section && output) {
    // Apply moodboard stripping if enabled for Midjourney
    let displayText = text;
    if (isMoodboardMode && currentPlatform === 'midjourney') {
      displayText = stripWeirdParameter(text);
    }

    section.style.display = 'block';
    output.textContent = displayText;

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

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_PROMPT',
      payload: {
        content: output.textContent,
        platform: currentPlatform,
        tags: [],
      },
    });

    if (response?.success) {
      showToast('Saved to library!');
      // Visual feedback on button
      const saveBtn = panel?.querySelector('#refyn-save-btn');
      saveBtn?.classList.add('refyn-saved');
      setTimeout(() => saveBtn?.classList.remove('refyn-saved'), 2000);
    } else {
      showToast('Failed to save', 'error');
    }
  } catch (error) {
    showToast('Failed to save', 'error');
  }
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
 * Show quick-rate popup after a new output is detected
 */
let quickRateElement: HTMLElement | null = null;
let quickRateTimeout: ReturnType<typeof setTimeout> | null = null;

export function showQuickRatePopup(outputId: string, prompt?: string): void {
  // Remove existing popup
  hideQuickRatePopup();

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
  { id: 'poor-quality', label: 'Poor quality', icon: '👎' },
  { id: 'wrong-style', label: 'Wrong style', icon: '🎨' },
  { id: 'doesnt-match', label: "Doesn't match prompt", icon: '❌' },
  { id: 'too-similar', label: 'Too similar', icon: '👯' },
  { id: 'wrong-composition', label: 'Bad composition', icon: '📐' },
  { id: 'other', label: 'Other...', icon: '💭' },
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
function showTrashFeedbackPopup(x: number, y: number): void {
  hideTrashFeedbackPopup();

  trashFeedbackElement = document.createElement('div');
  trashFeedbackElement.id = 'refyn-trash-feedback';
  trashFeedbackElement.className = 'refyn-trash-feedback';
  trashFeedbackElement.innerHTML = `
    <div class="refyn-trash-feedback-inner">
      <div class="refyn-trash-feedback-header">
        <span class="refyn-trash-feedback-title">Why are you removing this?</span>
        <button class="refyn-trash-feedback-close" data-action="close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="refyn-trash-feedback-options">
        ${TRASH_FEEDBACK_PRESETS.map(preset => `
          <button class="refyn-trash-feedback-btn" data-reason="${preset.id}">
            <span class="refyn-trash-feedback-icon">${preset.icon}</span>
            <span class="refyn-trash-feedback-label">${preset.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="refyn-trash-feedback-custom" id="refyn-trash-custom" style="display: none;">
        <input type="text" class="refyn-trash-feedback-input" placeholder="Tell us more..." maxlength="100">
        <button class="refyn-trash-feedback-submit" data-action="submit-custom">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="refyn-trash-feedback-skip">
        <button class="refyn-trash-feedback-skip-btn" data-action="skip">Skip feedback</button>
      </div>
    </div>
  `;

  // Position popup
  const popupWidth = 260;
  const popupHeight = 280;
  const xPos = Math.max(10, Math.min(x - popupWidth / 2, window.innerWidth - popupWidth - 10));
  const yPos = y > popupHeight + 20 ? y - popupHeight - 10 : y + 30;

  trashFeedbackElement.style.cssText = `
    position: fixed;
    left: ${xPos}px;
    top: ${yPos}px;
    z-index: 2147483647;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  // Add event listeners
  trashFeedbackElement.querySelectorAll('.refyn-trash-feedback-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const reason = (btn as HTMLElement).dataset.reason;

      if (reason === 'other') {
        // Show custom input
        const customSection = trashFeedbackElement?.querySelector('#refyn-trash-custom') as HTMLElement;
        if (customSection) {
          customSection.style.display = 'flex';
          const input = customSection.querySelector('input');
          input?.focus();
        }
        // Highlight the "Other" button
        btn.classList.add('active');
      } else {
        // Submit preset feedback
        submitTrashFeedback(reason || 'unknown');
      }
    });
  });

  // Close button
  trashFeedbackElement.querySelector('[data-action="close"]')?.addEventListener('click', () => {
    hideTrashFeedbackPopup();
  });

  // Skip button
  trashFeedbackElement.querySelector('[data-action="skip"]')?.addEventListener('click', () => {
    submitTrashFeedback('skipped');
  });

  // Custom submit
  trashFeedbackElement.querySelector('[data-action="submit-custom"]')?.addEventListener('click', () => {
    const input = trashFeedbackElement?.querySelector('.refyn-trash-feedback-input') as HTMLInputElement;
    submitTrashFeedback('custom', input?.value || '');
  });

  // Enter key on custom input
  trashFeedbackElement.querySelector('.refyn-trash-feedback-input')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const input = e.target as HTMLInputElement;
      submitTrashFeedback('custom', input.value || '');
    }
  });

  document.body.appendChild(trashFeedbackElement);

  // Animate in
  requestAnimationFrame(() => {
    trashFeedbackElement?.classList.add('refyn-trash-feedback-visible');
  });

  // Auto-dismiss after 15 seconds
  trashFeedbackTimeout = setTimeout(() => {
    hideTrashFeedbackPopup();
  }, 15000);
}

/**
 * Submit trash feedback
 */
async function submitTrashFeedback(reason: string, customText?: string): Promise<void> {
  try {
    // Record the feedback
    const { recordTrashFeedback } = await import('@/lib/deepLearning');
    await recordTrashFeedback(
      lastTrashedPrompt,
      currentPlatform,
      reason,
      customText
    );

    // Show confirmation
    flashLearningIndicator(`Noted: ${reason === 'skipped' ? 'Skipped' : reason.replace('-', ' ')}`);

    console.log('[Refyn] Trash feedback recorded:', { reason, customText, prompt: lastTrashedPrompt.substring(0, 50) });
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

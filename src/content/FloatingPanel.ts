import { detectPlatform, findPromptInputs, getInputText, setInputText, getPlatformInputSelector } from './platformDetector';
import type { Platform, OptimizationMode } from '@/shared/types';
import { PLATFORMS } from '@/shared/constants';

let panel: HTMLElement | null = null;
let isMinimized = false;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentPlatform: Platform = 'unknown';
let selectedMode: OptimizationMode = 'enhance';

// Live sync state
let isLiveSyncEnabled = true;
let trackedInput: HTMLElement | null = null;
let inputObserver: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_DELAY = 150; // ms

const PANEL_ID = 'refyn-floating-panel';

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

  // Start live sync
  if (isLiveSyncEnabled) {
    startLiveSync();
  }

  console.log('[Refyn] Floating panel initialized for:', currentPlatform);
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
        </div>

        <!-- Input Area -->
        <div class="refyn-input-section">
          <div class="refyn-input-header">
            <span>Your Prompt</span>
            <div class="refyn-input-actions">
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
          <textarea id="refyn-input" class="refyn-textarea" placeholder="Start typing in your prompt field - I'll sync automatically..." rows="3"></textarea>
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

  // Minimize button
  panel.querySelector('#refyn-minimize-btn')?.addEventListener('click', toggleMinimize);

  // Close button
  panel.querySelector('#refyn-close-btn')?.addEventListener('click', closePanel);

  // Live sync toggle
  panel.querySelector('#refyn-sync-toggle')?.addEventListener('click', toggleLiveSync);

  // Mode buttons
  panel.querySelectorAll('.refyn-mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = (e.currentTarget as HTMLElement).dataset.mode as OptimizationMode;
      setMode(mode);
    });
  });

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

function findAndTrackInput(): void {
  // First try platform-specific selector
  const platformSelector = getPlatformInputSelector(currentPlatform);
  let input: HTMLElement | null = null;

  if (platformSelector) {
    const elements = document.querySelectorAll<HTMLElement>(platformSelector);
    for (const el of elements) {
      if (isVisibleElement(el)) {
        input = el;
        break;
      }
    }
  }

  // Fallback to generic search
  if (!input) {
    const inputs = findPromptInputs();
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

  if (isMinimized) {
    container?.classList.add('refyn-minimized');
    if (body) body.style.display = 'none';
    if (btn) btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
      </svg>
    `;
  } else {
    container?.classList.remove('refyn-minimized');
    if (body) body.style.display = 'block';
    if (btn) btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;
  }
}

function closePanel(): void {
  stopLiveSync();
  panel?.remove();
  panel = null;
  localStorage.setItem('refyn-panel-closed', 'true');

  // Show the trigger button instead
  createTriggerButton();
}

function setMode(mode: OptimizationMode): void {
  selectedMode = mode;
  panel?.querySelectorAll('.refyn-mode-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
  });
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

  console.log('[Refyn Panel] Sending to background:', { platform: currentPlatform, mode: selectedMode, promptLength: prompt.length });
  setLoading(true);
  hideError();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      payload: {
        prompt,
        platform: currentPlatform,
        mode: selectedMode,
      },
    });

    console.log('[Refyn Panel] Response:', response);

    if (response?.success && response?.data?.optimizedPrompt) {
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
    section.style.display = 'block';
    output.textContent = text;
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
  removeTriggerButton();
  if (!panel) {
    createFloatingPanel();
  }
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

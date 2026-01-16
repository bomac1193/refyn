import { detectPlatform, findPromptInputs, getInputText, setInputText } from './platformDetector';
import { createFloatingPanel, showFloatingPanel, toggleFloatingPanel, forceShowFloatingPanel, initTrashObserver } from './FloatingPanel';
import { initOutputObserver } from './OutputObserver';
import type { Platform, OptimizationMode } from '@/shared/types';

// State
let currentPlatform: Platform = 'unknown';
let floatingToolbar: HTMLElement | null = null;
let selectedText = '';
let selectedElement: HTMLElement | null = null;

// Initialize
function init() {
  currentPlatform = detectPlatform();
  console.log('[Refyn] Platform detected:', currentPlatform);

  // Set up event listeners
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('keydown', handleKeyDown);

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener(handleMessage);

  // Observe for dynamic content
  observeDOM();

  // Initialize floating panel on ALL pages (user can always toggle with Ctrl+Shift+E)
  // Minimal delay for DOM to be ready
  setTimeout(() => {
    // Always try to create the panel - forceShowFloatingPanel handles unknown platforms
    if (currentPlatform !== 'unknown') {
      createFloatingPanel();
    } else {
      // On unknown platforms, still create panel but use force method
      forceShowFloatingPanel();
    }
  }, 300);

  // Initialize output observer for learning (delayed further to ensure page is ready)
  if (currentPlatform !== 'unknown') {
    setTimeout(() => {
      initOutputObserver();
    }, 1500);

    // Initialize trash observer for feedback
    setTimeout(() => {
      initTrashObserver();
    }, 2000);

    // Start CTAD capture session for this platform
    setTimeout(() => {
      initCaptureSession();
    }, 500);
  }

  // Set up keyboard shortcut for panel toggle (Ctrl+Shift+E)
  document.addEventListener('keydown', handlePanelShortcut);
}

// Initialize CTAD capture session
async function initCaptureSession() {
  try {
    await chrome.runtime.sendMessage({
      type: 'START_CAPTURE_SESSION',
      payload: { platform: currentPlatform },
    });
    console.log('[Refyn] CTAD capture session started');
  } catch (error) {
    console.error('[Refyn] Failed to start capture session:', error);
  }
}

// End capture session when leaving page
window.addEventListener('beforeunload', () => {
  chrome.runtime.sendMessage({ type: 'END_CAPTURE_SESSION' }).catch(() => {
    // Ignore errors on page unload
  });
});

// Handle messages
function handleMessage(
  message: { type: string; payload?: unknown },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) {
  switch (message.type) {
    case 'DETECT_PLATFORM':
      sendResponse({ platform: currentPlatform });
      break;

    case 'GET_SELECTED_TEXT':
      sendResponse({ text: selectedText, platform: currentPlatform });
      break;

    case 'GRAB_PROMPT': {
      // Find and return the current prompt text from the page
      const inputs = findPromptInputs();
      if (inputs.length > 0) {
        const text = getInputText(inputs[0]);
        sendResponse({ text: text || '', platform: currentPlatform });
      } else {
        sendResponse({ text: '', platform: currentPlatform });
      }
      break;
    }

    case 'INSERT_PROMPT': {
      const promptText = typeof message.payload === 'string' ? message.payload : '';
      if (!promptText) {
        sendResponse({ success: false, error: 'No text provided' });
        break;
      }
      // Try selectedElement first, then find any prompt input
      const targetElement = selectedElement || findPromptInputs()[0];
      if (targetElement) {
        setInputText(targetElement, promptText);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No prompt input found on page' });
      }
      break;
    }

    case 'OPTIMIZE_SELECTION':
      if (selectedText) {
        optimizeAndInsert(selectedText, message.payload as OptimizationMode);
        sendResponse({ success: true });
      }
      break;

    case 'SHOW_FLOATING_PANEL':
      showFloatingPanel();
      sendResponse({ success: true });
      break;

    case 'FORCE_SHOW_FLOATING_PANEL':
      // Force show on any platform, even if unknown
      forceShowFloatingPanel();
      sendResponse({ success: true });
      break;

    case 'TOGGLE_FLOATING_PANEL':
      toggleFloatingPanel();
      sendResponse({ success: true });
      break;

    // CTAD reward notification
    case 'CTAD_REWARD_NOTIFICATION':
      showRewardNotification(message.payload as { pointsEarned: number; tierChange?: { from: string; to: string } });
      sendResponse({ success: true });
      break;

    // CTAD tier change notification
    case 'CTAD_TIER_CHANGE':
      showTierChangeNotification(message.payload as { from: string; to: string });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Keep channel open for async response
}

// Handle mouse up for text selection
function handleMouseUp(event: MouseEvent) {
  // Ignore if clicking on our toolbar
  if (floatingToolbar?.contains(event.target as Node)) return;

  const selection = window.getSelection();
  const text = selection?.toString().trim() || '';

  // Get the element being interacted with
  const target = event.target as HTMLElement;
  const isPromptInput = isPromptInputElement(target);

  if (text && text.length > 3) {
    selectedText = text;
    selectedElement = findClosestInput(target);

    // Show toolbar near selection
    const rect = selection?.getRangeAt(0).getBoundingClientRect();
    if (rect) {
      showFloatingToolbar(rect.left + rect.width / 2, rect.top);
    }
  } else if (isPromptInput) {
    // User clicked on a prompt input - get its content
    const inputText = getInputText(target);
    if (inputText && inputText.length > 3) {
      selectedText = inputText;
      selectedElement = target;
    }
  }
}

// Handle mouse down to close toolbar
function handleMouseDown(event: MouseEvent) {
  if (floatingToolbar && !floatingToolbar.contains(event.target as Node)) {
    hideFloatingToolbar();
  }
}

// Handle escape key
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && floatingToolbar) {
    hideFloatingToolbar();
  }
}

// Handle keyboard shortcut for floating panel (Ctrl+Shift+E)
function handlePanelShortcut(event: KeyboardEvent) {
  // Ctrl+Shift+E (E for Evolve/Enhance) - non-intrusive, memorable
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'e') {
    event.preventDefault();
    event.stopPropagation();
    toggleFloatingPanel();
  }
}

// Check if element is a prompt input
function isPromptInputElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'textarea') return true;
  if (tagName === 'input' && element.getAttribute('type') === 'text') return true;
  if (element.isContentEditable) return true;
  if (element.getAttribute('role') === 'textbox') return true;
  return false;
}

// Find closest input element
function findClosestInput(element: HTMLElement): HTMLElement | null {
  if (isPromptInputElement(element)) return element;

  // Search ancestors
  let parent = element.parentElement;
  while (parent) {
    if (isPromptInputElement(parent)) return parent;
    parent = parent.parentElement;
  }

  // Search for nearby inputs
  const inputs = findPromptInputs();
  return inputs[0] || null;
}

// Create and show floating toolbar
function showFloatingToolbar(x: number, y: number) {
  hideFloatingToolbar();

  floatingToolbar = document.createElement('div');
  floatingToolbar.id = 'refyn-toolbar';
  floatingToolbar.innerHTML = `
    <div class="refyn-toolbar-container">
      <div class="refyn-toolbar-logo">
        <div class="refyn-logo-icon">R</div>
      </div>
      <div class="refyn-toolbar-divider"></div>
      <button class="refyn-toolbar-btn refyn-btn-primary" data-action="refyn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        Refyn
      </button>
      <button class="refyn-toolbar-btn" data-action="copy" title="Copy">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      <button class="refyn-toolbar-btn" data-action="save" title="Save to Library">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
        </svg>
      </button>
      <button class="refyn-toolbar-btn refyn-btn-close" data-action="close" title="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="refyn-toolbar-arrow"></div>
  `;

  // Position toolbar
  const toolbarWidth = 280;
  const xPos = Math.max(toolbarWidth / 2, Math.min(x, window.innerWidth - toolbarWidth / 2));
  floatingToolbar.style.cssText = `
    position: fixed;
    left: ${xPos}px;
    top: ${y - 50}px;
    transform: translateX(-50%);
    z-index: 2147483647;
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  `;

  // Add event listeners
  floatingToolbar.addEventListener('click', handleToolbarClick);

  document.body.appendChild(floatingToolbar);

  // Animate in
  requestAnimationFrame(() => {
    if (floatingToolbar) {
      floatingToolbar.classList.add('refyn-toolbar-visible');
    }
  });
}

// Hide floating toolbar
function hideFloatingToolbar() {
  if (floatingToolbar) {
    floatingToolbar.remove();
    floatingToolbar = null;
  }
}

// Handle toolbar button clicks
async function handleToolbarClick(event: Event) {
  const target = event.target as HTMLElement;
  const button = target.closest('[data-action]') as HTMLElement;
  if (!button) return;

  const action = button.dataset.action;

  switch (action) {
    case 'refyn':
      await optimizeAndInsert(selectedText, 'enhance');
      break;

    case 'copy':
      await navigator.clipboard.writeText(selectedText);
      showToast('Copied to clipboard!');
      break;

    case 'save':
      chrome.runtime.sendMessage({
        type: 'SAVE_PROMPT',
        payload: { content: selectedText, platform: currentPlatform },
      });
      showToast('Saved to library!');
      break;

    case 'close':
      hideFloatingToolbar();
      break;
  }
}

// Optimize prompt and insert
async function optimizeAndInsert(text: string, mode: OptimizationMode) {
  if (!text) return;

  // Show loading state
  const refynBtn = floatingToolbar?.querySelector('[data-action="refyn"]');
  if (refynBtn) {
    refynBtn.innerHTML = `
      <svg class="refyn-spinner" width="14" height="14" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      Refining...
    `;
    (refynBtn as HTMLButtonElement).disabled = true;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      payload: {
        prompt: text,
        platform: currentPlatform,
        mode,
      },
    });

    if (response.success && response.data?.optimizedPrompt) {
      // Insert optimized prompt
      if (selectedElement) {
        setInputText(selectedElement, response.data.optimizedPrompt);
      }

      // Copy to clipboard as backup
      await navigator.clipboard.writeText(response.data.optimizedPrompt);

      // Log prompt version to CTAD capture session
      try {
        await chrome.runtime.sendMessage({
          type: 'LOG_PROMPT_VERSION',
          payload: {
            content: response.data.optimizedPrompt,
            mode,
            metadata: {
              originalPrompt: text,
              platform: currentPlatform,
            },
          },
        });
      } catch (ctadError) {
        console.error('[Refyn] Failed to log CTAD prompt version:', ctadError);
      }

      showToast('Prompt refined and inserted!');
      hideFloatingToolbar();
    } else {
      showToast(response.error || 'Failed to optimize', 'error');
    }
  } catch (error) {
    showToast('Error optimizing prompt', 'error');
    console.error('[Refyn] Error:', error);
  }
}

// Show toast notification
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div');
  toast.className = `refyn-toast refyn-toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    border-radius: 8px;
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 2147483647;
    animation: refyn-toast-in 0.3s ease;
    background: ${type === 'success' ? '#121214' : '#7f1d1d'};
    color: ${type === 'success' ? '#00F0FF' : '#fca5a5'};
    border: 1px solid ${type === 'success' ? '#00F0FF33' : '#dc262633'};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'refyn-toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Observe DOM for dynamic content
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Re-detect platform if URL might have changed (SPA navigation)
        const newPlatform = detectPlatform();
        if (newPlatform !== currentPlatform) {
          currentPlatform = newPlatform;
          console.log('[Refyn] Platform updated:', currentPlatform);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Show CTAD reward notification
function showRewardNotification(reward: { pointsEarned: number; tierChange?: { from: string; to: string } }) {
  const toast = document.createElement('div');
  toast.className = 'refyn-reward-toast';
  toast.innerHTML = `
    <div class="refyn-reward-inner">
      <span class="refyn-reward-icon">🎉</span>
      <div class="refyn-reward-text">
        <strong>+${reward.pointsEarned} taste points</strong>
        <span class="refyn-reward-subtitle">Thanks for contributing!</span>
      </div>
    </div>
  `;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #121214 0%, #1a1a1e 100%);
    border: 1px solid #00F0FF33;
    border-radius: 12px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    color: #fff;
    z-index: 2147483647;
    animation: refyn-slide-in 0.3s ease;
    box-shadow: 0 8px 32px rgba(0, 240, 255, 0.15);
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'refyn-slide-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Show CTAD tier change notification
function showTierChangeNotification(tierChange: { from: string; to: string }) {
  const tierEmojis: Record<string, string> = {
    explorer: '🔍',
    curator: '🎨',
    tastemaker: '✨',
    oracle: '👁️',
  };

  const toast = document.createElement('div');
  toast.className = 'refyn-tier-toast';
  toast.innerHTML = `
    <div class="refyn-tier-inner">
      <div class="refyn-tier-icon">${tierEmojis[tierChange.to] || '🏆'}</div>
      <div class="refyn-tier-text">
        <strong>Level Up!</strong>
        <span>You're now a ${tierChange.to.charAt(0).toUpperCase() + tierChange.to.slice(1)}</span>
      </div>
    </div>
  `;
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid #a855f7;
    border-radius: 16px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    color: #fff;
    z-index: 2147483647;
    animation: refyn-tier-bounce 0.5s ease;
    box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
  `;

  document.body.appendChild(toast);

  // Add confetti effect
  createConfetti();

  setTimeout(() => {
    toast.style.animation = 'refyn-slide-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Simple confetti effect for tier changes
function createConfetti() {
  const colors = ['#00F0FF', '#a855f7', '#f59e0b', '#10b981'];
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
    overflow: hidden;
  `;

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}%;
      top: -10px;
      opacity: ${0.7 + Math.random() * 0.3};
      transform: rotate(${Math.random() * 360}deg);
      animation: refyn-confetti-fall ${2 + Math.random() * 2}s ease-out forwards;
      animation-delay: ${Math.random() * 0.5}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    container.appendChild(confetti);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

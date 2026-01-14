import type { Platform } from '@/shared/types';

/**
 * Check if test/debug mode is enabled
 */
function isTestMode(): boolean {
  // Enable test mode via URL parameter or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  return (
    urlParams.get('refyn-test') === 'true' ||
    localStorage.getItem('refyn-test-mode') === 'true'
  );
}

/**
 * Detect the current AI platform based on URL and page content
 */
export function detectPlatform(): Platform {
  // Test mode - treat as ChatGPT for testing
  if (isTestMode()) {
    console.log('[Refyn] Test mode enabled');
    return 'chatgpt';
  }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Direct hostname matching
  const hostnameMap: Record<string, Platform | (() => Platform)> = {
    'www.midjourney.com': 'midjourney',
    'midjourney.com': 'midjourney',
    'discord.com': detectDiscordChannel,
    'suno.com': 'suno',
    'www.suno.com': 'suno',
    'suno.ai': 'suno',
    'www.suno.ai': 'suno',
    'udio.com': 'udio',
    'www.udio.com': 'udio',
    'runwayml.com': 'runway',
    'www.runwayml.com': 'runway',
    'app.runwayml.com': 'runway',
    'pika.art': 'pika',
    'www.pika.art': 'pika',
    'chat.openai.com': 'chatgpt',
    'chatgpt.com': 'chatgpt',
    'www.chatgpt.com': 'chatgpt',
    'labs.openai.com': 'dalle',
    'openai.com': () => detectOpenAIPlatform(pathname),
    'www.openai.com': () => detectOpenAIPlatform(pathname),
    'leonardo.ai': 'leonardo',
    'www.leonardo.ai': 'leonardo',
    'app.leonardo.ai': 'leonardo',
    'dreamstudio.ai': 'stable-diffusion',
    'www.dreamstudio.ai': 'stable-diffusion',
    'stability.ai': 'stable-diffusion',
    'www.stability.ai': 'stable-diffusion',
    'higgsfield.ai': 'higgsfield',
    'www.higgsfield.ai': 'higgsfield',
    'app.higgsfield.ai': 'higgsfield',
    'create.higgsfield.ai': 'higgsfield',
    'studio.higgsfield.ai': 'higgsfield',
    'claude.ai': 'claude',
    'www.claude.ai': 'claude',
    'replicate.com': () => detectReplicatePlatform(),
    'www.replicate.com': () => detectReplicatePlatform(),
  };

  // Check exact hostname match
  if (hostname in hostnameMap) {
    const result = hostnameMap[hostname];
    return typeof result === 'function' ? result() : result;
  }

  // Check for partial matches
  for (const [domain, platformOrFn] of Object.entries(hostnameMap)) {
    if (hostname.includes(domain.replace('www.', ''))) {
      return typeof platformOrFn === 'function' ? platformOrFn() : platformOrFn;
    }
  }

  return 'unknown';
}

/**
 * Detect if Discord is being used for Midjourney
 */
function detectDiscordChannel(): Platform {
  // Check for Midjourney server indicators
  const serverName = document.querySelector('[class*="guildName"]')?.textContent?.toLowerCase();
  const channelName = document.querySelector('[class*="channelName"]')?.textContent?.toLowerCase();

  if (serverName?.includes('midjourney') || channelName?.includes('midjourney')) {
    return 'midjourney';
  }

  // Check for Midjourney bot presence
  const hasmidjourneyBot = document.body.innerHTML.includes('Midjourney Bot');
  if (hasmidjourneyBot) {
    return 'midjourney';
  }

  return 'unknown';
}

/**
 * Detect specific OpenAI platform based on path
 */
function detectOpenAIPlatform(pathname: string): Platform {
  if (pathname.includes('/chat') || pathname.includes('/g/')) {
    return 'chatgpt';
  }
  if (pathname.includes('/dall-e') || pathname.includes('/image')) {
    return 'dalle';
  }
  return 'chatgpt'; // Default to ChatGPT for OpenAI domain
}

/**
 * Detect which model is being used on Replicate
 */
function detectReplicatePlatform(): Platform {
  const pathname = window.location.pathname.toLowerCase();
  const pageContent = document.body.innerText.toLowerCase();

  if (pathname.includes('flux') || pageContent.includes('flux')) {
    return 'flux';
  }
  if (pathname.includes('stable-diffusion') || pageContent.includes('stable diffusion')) {
    return 'stable-diffusion';
  }
  if (pathname.includes('midjourney')) {
    return 'midjourney';
  }

  return 'unknown';
}

/**
 * Check if element belongs to Refyn (should be excluded from detection)
 */
function isRefynElement(el: HTMLElement): boolean {
  // Check if element or any ancestor has refyn ID or class
  let current: HTMLElement | null = el;
  while (current) {
    if (current.id?.startsWith('refyn-') ||
        current.className?.toString().includes('refyn-') ||
        current.closest('[id^="refyn-"]')) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

/**
 * Find prompt input elements on the current page
 */
export function findPromptInputs(): HTMLElement[] {
  console.log('[Refyn Detector] Searching for prompt inputs...');

  // Platform-specific selectors (highest priority)
  const platformSelectors = [
    // Midjourney web
    '#desktop_input_bar',
    'textarea[id*="input_bar"]',

    // Discord (Midjourney)
    '[class*="textArea"] [class*="editor"]',
    '[role="textbox"][data-slate-editor="true"]',

    // ChatGPT / Claude
    '#prompt-textarea',
    'textarea[data-id="root"]',
    '[contenteditable="true"][data-placeholder]',

    // Suno
    '[class*="prompt-input"]',
    'textarea[class*="prompt"]',

    // Higgsfield
    'textarea[placeholder*="describe" i]',
    'textarea[placeholder*="prompt" i]',

    // Runway
    'textarea[placeholder*="describe" i]',
  ];

  // Generic selectors (lower priority)
  const genericSelectors = [
    'textarea[placeholder*="imagine" i]',
    'textarea[placeholder*="create" i]',
    'input[placeholder*="prompt" i]',
    '[contenteditable="true"]',
    'textarea',
    'input[type="text"]',
  ];

  const inputs: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  // First try platform-specific selectors
  for (const selector of platformSelectors) {
    try {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      elements.forEach(el => {
        if (!seen.has(el) && isVisibleElement(el) && !isRefynElement(el)) {
          seen.add(el);
          inputs.push(el);
          console.log('[Refyn Detector] Found input:', selector, el);
        }
      });
    } catch {
      // Invalid selector, skip
    }
  }

  // If no platform-specific inputs found, try generic selectors
  if (inputs.length === 0) {
    for (const selector of genericSelectors) {
      try {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        elements.forEach(el => {
          if (!seen.has(el) && isVisibleElement(el) && !isRefynElement(el)) {
            seen.add(el);
            inputs.push(el);
            console.log('[Refyn Detector] Found input:', selector, el);
          }
        });
      } catch {
        // Invalid selector, skip
      }
    }
  }

  console.log('[Refyn Detector] Total inputs found:', inputs.length);
  return inputs;
}

/**
 * Check if an element is visible
 */
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

/**
 * Get text content from various input types
 */
export function getInputText(element: HTMLElement): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    return element.value;
  }

  if (element.isContentEditable) {
    return element.innerText || element.textContent || '';
  }

  // Slate editor (Discord, etc.)
  const slateNode = element.querySelector('[data-slate-string="true"]');
  if (slateNode) {
    return slateNode.textContent || '';
  }

  return element.innerText || element.textContent || '';
}

/**
 * Set text content for various input types
 * Uses native setter to properly trigger React/Vue state updates
 */
export function setInputText(element: HTMLElement, text: string): void {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
    // Focus the element first
    element.focus();

    // Use native setter to bypass React's synthetic event system
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, text);
    } else {
      element.value = text;
    }

    // Dispatch multiple events to ensure framework picks up the change
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    // Also dispatch keyboard events to simulate typing
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    console.log('[Refyn] Set text on textarea/input:', text.substring(0, 50));
    return;
  }

  if (element.isContentEditable) {
    element.focus();

    // Clear existing content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Insert new text
    document.execCommand('insertText', false, text);

    // Dispatch events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    console.log('[Refyn] Set text on contenteditable:', text.substring(0, 50));
    return;
  }

  // Fallback: try to focus and use document.execCommand
  element.focus();
  document.execCommand('selectAll', false);
  document.execCommand('insertText', false, text);
  console.log('[Refyn] Set text via execCommand:', text.substring(0, 50));
}

/**
 * Get platform-specific prompt input selector
 */
export function getPlatformInputSelector(platform: Platform): string | null {
  const selectors: Partial<Record<Platform, string>> = {
    midjourney: '#desktop_input_bar, textarea[id*="input_bar"], [class*="textArea"] [role="textbox"], [data-slate-editor="true"]',
    chatgpt: '#prompt-textarea, textarea[data-id="root"]',
    claude: '[contenteditable="true"][data-placeholder]',
    suno: 'textarea[class*="prompt"], textarea[placeholder*="describe"]',
    udio: 'textarea[placeholder*="describe"], textarea[class*="prompt"]',
    dalle: 'textarea[placeholder*="describe"]',
    leonardo: 'textarea[placeholder*="prompt"]',
    runway: 'textarea[placeholder*="describe"]',
    pika: 'textarea[placeholder*="describe"]',
    higgsfield: 'textarea[placeholder*="describe"], textarea[placeholder*="prompt"], textarea:not([id^="refyn-"]), [contenteditable="true"]:not([id^="refyn-"])',
  };

  return selectors[platform] || null;
}

import { CLAUDE_API_ENDPOINT, CLAUDE_MODEL, MAX_TOKENS } from '@/shared/constants';
import { buildOptimizationPrompt } from '@/lib/platforms/prompts';
import { getApiKey } from '@/lib/storage';
import type {
  Platform,
  OptimizationMode,
  OptimizeResponse,
  TasteProfile,
  GenomeTag,
} from '@/shared/types';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeError {
  type: string;
  error: {
    type: string;
    message: string;
  };
}

/**
 * Call Claude API to optimize a prompt
 */
export async function optimizePrompt(
  prompt: string,
  platform: Platform,
  mode: OptimizationMode,
  tasteProfile?: TasteProfile,
  presetId?: string | null,
  preferenceContext?: string
): Promise<OptimizeResponse> {
  console.log('[Refyn API] Starting optimization:', { platform, mode, presetId, promptLength: prompt.length });

  const apiKey = await getApiKey();
  console.log('[Refyn API] API key retrieved:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT FOUND');

  if (!apiKey) {
    console.error('[Refyn API] No API key configured');
    return {
      success: false,
      error: 'API key not configured. Please add your Anthropic API key in settings.',
    };
  }

  try {
    const { system, user } = buildOptimizationPrompt(prompt, platform, mode, tasteProfile, presetId, preferenceContext);
    console.log('[Refyn API] Built prompt, making API call...');

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: user,
      },
    ];

    const response = await fetch(CLAUDE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages,
      }),
    });

    console.log('[Refyn API] Response status:', response.status);

    if (!response.ok) {
      const errorData = (await response.json()) as ClaudeError;
      console.error('[Refyn API] API error:', errorData);
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as ClaudeResponse;
    console.log('[Refyn API] Response received, tokens:', data.usage);

    if (!data.content || data.content.length === 0) {
      console.error('[Refyn API] No content in response');
      return {
        success: false,
        error: 'No response from API',
      };
    }

    const optimizedPrompt = data.content[0].text.trim();
    console.log('[Refyn API] Optimization successful, output length:', optimizedPrompt.length);

    // Extract genome tags from the optimized prompt
    const genomeTags = extractGenomeTags(optimizedPrompt, platform);

    return {
      success: true,
      optimizedPrompt,
      genomeTags,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Extract genome tags from an optimized prompt
 */
function extractGenomeTags(prompt: string, platform: Platform): GenomeTag[] {
  const tags: GenomeTag[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Style detection
  const styles = [
    'cinematic', 'photorealistic', 'artistic', 'abstract', 'minimal',
    'editorial', 'fine art', 'commercial', 'documentary', 'surreal',
    'vintage', 'modern', 'futuristic', 'classic', 'experimental',
  ];

  for (const style of styles) {
    if (lowerPrompt.includes(style)) {
      tags.push({ category: 'Style', value: style, confidence: 0.8 });
      break;
    }
  }

  // Mood detection
  const moods = [
    'dramatic', 'peaceful', 'energetic', 'melancholic', 'uplifting',
    'dark', 'vibrant', 'nostalgic', 'mysterious', 'whimsical',
    'serene', 'intense', 'dreamy', 'powerful', 'gentle',
  ];

  for (const mood of moods) {
    if (lowerPrompt.includes(mood)) {
      tags.push({ category: 'Mood', value: mood, confidence: 0.8 });
      break;
    }
  }

  // Lighting detection (for image platforms)
  if (['midjourney', 'dalle', 'stable-diffusion', 'leonardo', 'flux'].includes(platform)) {
    const lightings = [
      'golden hour', 'blue hour', 'studio lighting', 'natural light',
      'dramatic lighting', 'soft lighting', 'rim lighting', 'backlit',
      'ambient', 'high contrast', 'low key', 'high key',
    ];

    for (const lighting of lightings) {
      if (lowerPrompt.includes(lighting)) {
        tags.push({ category: 'Lighting', value: lighting, confidence: 0.85 });
        break;
      }
    }

    // Color palette detection
    const palettes = [
      { keywords: ['warm', 'amber', 'orange', 'golden'], value: 'Warm' },
      { keywords: ['cool', 'blue', 'teal', 'cyan'], value: 'Cool' },
      { keywords: ['vibrant', 'saturated', 'colorful'], value: 'Vibrant' },
      { keywords: ['muted', 'desaturated', 'pastel'], value: 'Muted' },
      { keywords: ['monochrome', 'black and white', 'grayscale'], value: 'Monochrome' },
    ];

    for (const palette of palettes) {
      if (palette.keywords.some(kw => lowerPrompt.includes(kw))) {
        tags.push({ category: 'Palette', value: palette.value, confidence: 0.75 });
        break;
      }
    }
  }

  // Music-specific tags
  if (['suno', 'udio'].includes(platform)) {
    const genres = [
      'pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'classical',
      'r&b', 'folk', 'country', 'metal', 'indie', 'lo-fi',
    ];

    for (const genre of genres) {
      if (lowerPrompt.includes(genre)) {
        tags.push({ category: 'Genre', value: genre, confidence: 0.9 });
        break;
      }
    }

    const tempos = [
      { keywords: ['slow', 'ballad', 'ambient'], value: 'Slow' },
      { keywords: ['mid-tempo', 'moderate', 'groove'], value: 'Medium' },
      { keywords: ['fast', 'upbeat', 'energetic'], value: 'Fast' },
    ];

    for (const tempo of tempos) {
      if (tempo.keywords.some(kw => lowerPrompt.includes(kw))) {
        tags.push({ category: 'Tempo', value: tempo.value, confidence: 0.7 });
        break;
      }
    }
  }

  // Video-specific tags
  if (['runway', 'pika', 'higgsfield'].includes(platform)) {
    const cameras = [
      'dolly', 'pan', 'tracking', 'crane', 'steadicam', 'handheld',
      'zoom', 'orbit', 'static', 'aerial',
    ];

    for (const camera of cameras) {
      if (lowerPrompt.includes(camera)) {
        tags.push({ category: 'Camera', value: camera, confidence: 0.85 });
        break;
      }
    }
  }

  return tags;
}

/**
 * Quick format validation for API key (instant, no network)
 */
export function validateApiKeyFormat(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  const trimmed = apiKey.trim();

  // Check prefix
  if (!trimmed.startsWith('sk-ant-')) {
    return { valid: false, error: 'Must start with sk-ant-' };
  }

  // Check minimum length (sk-ant- + api3- + at least 20 chars)
  if (trimmed.length < 40) {
    return { valid: false, error: 'API key is too short' };
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^sk-ant-[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Invalid characters in API key' };
  }

  return { valid: true };
}

/**
 * Validate an API key by making a minimal request (with fast timeout)
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  // Quick format check first
  const formatCheck = validateApiKeyFormat(apiKey);
  if (!formatCheck.valid) {
    return false;
  }

  // Create abort controller for FAST timeout (3 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(CLAUDE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 200 = success, 401 = invalid key
    if (response.ok) {
      return true;
    }

    // 401 = definitely invalid
    if (response.status === 401) {
      return false;
    }

    // 400, 429, 500, etc = key format is valid, just other issues
    // Accept these as "valid enough"
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[Refyn] API validation timed out - accepting key');
      // On timeout, accept the key if format is valid (network might be slow)
      return true;
    }
    console.error('[Refyn] API validation error:', error);
    // On network error, accept if format is valid
    return true;
  }
}

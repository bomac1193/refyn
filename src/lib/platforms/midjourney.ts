/**
 * Midjourney-specific utilities and parameter handling
 */

export interface MidjourneyParams {
  aspectRatio?: string;
  version?: string;
  stylize?: number;
  chaos?: number;
  quality?: number;
  weird?: number;
  tile?: boolean;
  no?: string[];
  style?: string;
  seed?: number;
}

/**
 * Parse Midjourney parameters from a prompt
 */
export function parseMidjourneyParams(prompt: string): {
  basePrompt: string;
  params: MidjourneyParams;
} {
  const params: MidjourneyParams = {};
  let basePrompt = prompt;

  // Aspect ratio --ar
  const arMatch = prompt.match(/--ar\s+(\d+:\d+)/i);
  if (arMatch) {
    params.aspectRatio = arMatch[1];
    basePrompt = basePrompt.replace(arMatch[0], '');
  }

  // Version --v
  const vMatch = prompt.match(/--v\s+([\d.]+)/i);
  if (vMatch) {
    params.version = vMatch[1];
    basePrompt = basePrompt.replace(vMatch[0], '');
  }

  // Stylize --stylize or --s
  const stylizeMatch = prompt.match(/--(?:stylize|s)\s+(\d+)/i);
  if (stylizeMatch) {
    params.stylize = parseInt(stylizeMatch[1]);
    basePrompt = basePrompt.replace(stylizeMatch[0], '');
  }

  // Chaos --chaos or --c
  const chaosMatch = prompt.match(/--(?:chaos|c)\s+(\d+)/i);
  if (chaosMatch) {
    params.chaos = parseInt(chaosMatch[1]);
    basePrompt = basePrompt.replace(chaosMatch[0], '');
  }

  // Quality --quality or --q
  const qualityMatch = prompt.match(/--(?:quality|q)\s+([\d.]+)/i);
  if (qualityMatch) {
    params.quality = parseFloat(qualityMatch[1]);
    basePrompt = basePrompt.replace(qualityMatch[0], '');
  }

  // Weird --weird or --w
  const weirdMatch = prompt.match(/--(?:weird|w)\s+(\d+)/i);
  if (weirdMatch) {
    params.weird = parseInt(weirdMatch[1]);
    basePrompt = basePrompt.replace(weirdMatch[0], '');
  }

  // Tile --tile
  if (/--tile\b/i.test(prompt)) {
    params.tile = true;
    basePrompt = basePrompt.replace(/--tile\b/gi, '');
  }

  // Style --style
  const styleMatch = prompt.match(/--style\s+(\w+)/i);
  if (styleMatch) {
    params.style = styleMatch[1];
    basePrompt = basePrompt.replace(styleMatch[0], '');
  }

  // No --no
  const noMatches = prompt.match(/--no\s+([^-]+?)(?=--|$)/gi);
  if (noMatches) {
    params.no = noMatches.map(m => m.replace(/--no\s+/i, '').trim());
    noMatches.forEach(m => {
      basePrompt = basePrompt.replace(m, '');
    });
  }

  // Seed --seed
  const seedMatch = prompt.match(/--seed\s+(\d+)/i);
  if (seedMatch) {
    params.seed = parseInt(seedMatch[1]);
    basePrompt = basePrompt.replace(seedMatch[0], '');
  }

  return {
    basePrompt: basePrompt.trim().replace(/\s+/g, ' '),
    params,
  };
}

/**
 * Build Midjourney parameters string
 */
export function buildMidjourneyParams(params: MidjourneyParams): string {
  const parts: string[] = [];

  if (params.aspectRatio) parts.push(`--ar ${params.aspectRatio}`);
  if (params.version) parts.push(`--v ${params.version}`);
  if (params.stylize !== undefined) parts.push(`--stylize ${params.stylize}`);
  if (params.chaos !== undefined) parts.push(`--chaos ${params.chaos}`);
  if (params.quality !== undefined) parts.push(`--q ${params.quality}`);
  if (params.weird !== undefined) parts.push(`--weird ${params.weird}`);
  if (params.tile) parts.push('--tile');
  if (params.style) parts.push(`--style ${params.style}`);
  if (params.no && params.no.length > 0) {
    parts.push(`--no ${params.no.join(', ')}`);
  }
  if (params.seed !== undefined) parts.push(`--seed ${params.seed}`);

  return parts.join(' ');
}

/**
 * Common aspect ratios for quick selection
 */
export const ASPECT_RATIOS = [
  { label: 'Square', value: '1:1' },
  { label: 'Landscape', value: '16:9' },
  { label: 'Portrait', value: '9:16' },
  { label: 'Wide', value: '21:9' },
  { label: 'Photo', value: '4:3' },
  { label: 'Portrait Photo', value: '3:4' },
  { label: 'Cinematic', value: '2.39:1' },
];

/**
 * Midjourney versions
 */
export const MJ_VERSIONS = [
  { label: 'V6.1 (Latest)', value: '6.1' },
  { label: 'V6', value: '6' },
  { label: 'V5.2', value: '5.2' },
  { label: 'V5.1', value: '5.1' },
  { label: 'V5', value: '5' },
  { label: 'Niji 6', value: 'niji 6' },
  { label: 'Niji 5', value: 'niji 5' },
];

/**
 * Style presets
 */
export const MJ_STYLES = [
  { label: 'Default', value: '' },
  { label: 'Raw', value: 'raw' },
];

/**
 * Suggest parameters based on prompt content
 */
export function suggestParams(prompt: string): MidjourneyParams {
  const lower = prompt.toLowerCase();
  const params: MidjourneyParams = {};

  // Suggest version
  params.version = '6.1';

  // Suggest aspect ratio based on content
  if (lower.includes('landscape') || lower.includes('panorama') || lower.includes('wide')) {
    params.aspectRatio = '16:9';
  } else if (lower.includes('portrait') || lower.includes('vertical') || lower.includes('phone')) {
    params.aspectRatio = '9:16';
  } else if (lower.includes('cinematic') || lower.includes('movie')) {
    params.aspectRatio = '21:9';
  }

  // Suggest stylize based on content
  if (lower.includes('photorealistic') || lower.includes('realistic') || lower.includes('photo')) {
    params.style = 'raw';
    params.stylize = 50;
  } else if (lower.includes('artistic') || lower.includes('creative') || lower.includes('stylized')) {
    params.stylize = 750;
  }

  // Suggest chaos for experimental prompts
  if (lower.includes('experimental') || lower.includes('varied') || lower.includes('diverse')) {
    params.chaos = 50;
  }

  return params;
}

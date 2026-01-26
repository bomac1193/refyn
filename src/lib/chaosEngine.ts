/**
 * Chaos Engine - Platform-specific chaos enhancements based on intensity level
 * Unlocks hidden model capabilities through algorithm tricks
 */

import type { Platform } from '@/shared/types';

export type ChaosLevel = 'clean' | 'refined' | 'creative' | 'wild' | 'unhinged';

export interface ChaosConfig {
  level: ChaosLevel;
  label: string;
  range: [number, number];
  description: string;
}

export const CHAOS_LEVELS: ChaosConfig[] = [
  { level: 'clean', label: 'Clean', range: [0, 20], description: 'Minimal changes, standard structure' },
  { level: 'refined', label: 'Refined', range: [21, 40], description: 'Subtle enhancements' },
  { level: 'creative', label: 'Creative', range: [41, 60], description: 'Experimental elements' },
  { level: 'wild', label: 'Wild', range: [61, 80], description: 'Heavy algorithm tricks' },
  { level: 'unhinged', label: 'Unhinged', range: [81, 100], description: 'Maximum chaos' },
];

export function getChaosLevel(intensity: number): ChaosConfig {
  const clamped = Math.max(0, Math.min(100, intensity));
  return CHAOS_LEVELS.find(l => clamped >= l.range[0] && clamped <= l.range[1]) || CHAOS_LEVELS[0];
}

/**
 * Magic symbols that trigger unique aesthetics in various models
 */
const MAGIC_SYMBOLS = ['✦', '✧', '⟡', '◈', '◇', '❖', '✶', '✴', '✵', '⚝'];

/**
 * Get chaos enhancement system prompt for a platform and intensity
 */
export function getChaosEnhancementPrompt(platform: Platform, intensity: number): string {
  if (intensity <= 0) return '';

  const level = getChaosLevel(intensity);
  const config = getPlatformChaosConfig(platform);

  let prompt = `\n\n`;
  prompt += `████████████████████████████████████████████████████████\n`;
  prompt += `█  CHAOS INTENSITY: ${intensity}/100 (${level.label.toUpperCase()})  █\n`;
  prompt += `████████████████████████████████████████████████████████\n\n`;

  // Intensity scaling message
  if (intensity <= 20) {
    prompt += `CHAOS LEVEL: MINIMAL - Make subtle refinements only.\n\n`;
  } else if (intensity <= 40) {
    prompt += `CHAOS LEVEL: MODERATE - Add creative flourishes and quality boosters.\n\n`;
  } else if (intensity <= 60) {
    prompt += `CHAOS LEVEL: HIGH - Push creative boundaries. Add experimental elements. Be bold.\n\n`;
  } else if (intensity <= 80) {
    prompt += `CHAOS LEVEL: EXTREME - Break conventions. Combine unexpected elements. Go wild.\n\n`;
  } else {
    prompt += `CHAOS LEVEL: MAXIMUM UNHINGED - Throw out the rulebook. Create something unprecedented. Combine impossible elements. Make it unforgettable.\n\n`;
  }

  prompt += `MANDATORY CHAOS TECHNIQUES TO APPLY:\n\n`;

  // Add instructions based on level
  if (intensity >= 1) {
    prompt += config.clean.join('\n') + '\n\n';
  }

  if (intensity >= 21) {
    prompt += config.refined.join('\n') + '\n\n';
  }

  if (intensity >= 41) {
    prompt += config.creative.join('\n') + '\n\n';
  }

  if (intensity >= 61) {
    prompt += config.wild.join('\n') + '\n\n';
  }

  if (intensity >= 81) {
    prompt += `★★★ UNHINGED MODE ACTIVE ★★★\n`;
    prompt += config.unhinged.join('\n') + '\n\n';
    prompt += `At UNHINGED level, you MUST:\n`;
    prompt += `- Add AT LEAST 3 experimental/unusual elements\n`;
    prompt += `- Combine styles that don't normally go together\n`;
    prompt += `- Include unexpected juxtapositions\n`;
    prompt += `- Push every descriptor to its extreme\n`;
    prompt += `- The output should surprise even experienced users\n\n`;
  }

  prompt += `\n★ CHAOS MULTIPLIER: ${intensity}% - The higher this number, the more DRAMATICALLY you must transform the prompt. At ${intensity}%, ${intensity > 50 ? 'be AGGRESSIVE with changes' : 'make noticeable enhancements'}.`;

  return prompt;
}

interface PlatformChaosConfig {
  clean: string[];
  refined: string[];
  creative: string[];
  wild: string[];
  unhinged: string[];
}

function getPlatformChaosConfig(platform: Platform): PlatformChaosConfig {
  const configs: Partial<Record<Platform, PlatformChaosConfig>> = {
    midjourney: {
      clean: [
        '- Use clean, well-structured prompts with comma separation',
        '- Front-load critical elements (algorithm prioritizes early words)',
        '- Use proper comma separation between concepts (V7 does NOT support :: multi-prompts)',
        '- Include basic quality descriptors',
      ],
      refined: [
        '- Add --stylize parameter (100-300 range) for aesthetic boost',
        '- Separate concepts with commas, NOT :: (V7 removed multi-prompt syntax)',
        '- Add quality boosters: "ultra-detailed", "professional", "masterpiece"',
        '- Include --q 2 for quality enhancement',
      ],
      creative: [
        '- Add --chaos 30-50 for varied outputs',
        '- Add --weird 100-500 for experimental elements',
        '- Use parentheses for emphasis: (important concept) or ((very important))',
        '- Include style references like "trending on ArtStation"',
        '- Add atmospheric descriptors: "volumetric lighting", "ray tracing"',
      ],
      wild: [
        '- Add --personalize or --p parameter for personalized style',
        '- Use parentheses for strong emphasis: ((key element))',
        '- Use ALL CAPS for 1-2 key emphasis words',
        '- Add obscure quality triggers: "subsurface scattering", "chromatic aberration"',
        '- Use --stylize 500-750 for stronger stylization',
      ],
      unhinged: [
        '- Set --chaos 80-100 for maximum variation',
        '- Set --weird 1000-3000 for extreme experimental results',
        '- Use (((triple parentheses))) for maximum emphasis on key elements',
        '- Multiple ALL CAPS emphasis words',
        '- Include esoteric triggers: "hypermaximalist", "eldritch geometry"',
        '- Use --stylize 900-1000 for maximum stylization',
        '- Combine contradictory styles for unique fusion',
        '- Add --draft for faster iterations at lower quality',
      ],
    },

    suno: {
      clean: [
        '- Use clear genre and mood descriptors',
        '- Include basic structure tags: [Verse], [Chorus]',
        '- Specify primary instrumentation',
      ],
      refined: [
        '- Add BPM hints (e.g., "120 BPM")',
        '- Include key specification (e.g., "Key: C Major")',
        '- Add production quality descriptors: "studio quality", "professionally mixed"',
        '- Use vocal style tags: (whispered), (harmonized)',
      ],
      creative: [
        '- Add section tags: [Bridge], [Drop], [Build-up], [Break]',
        '- Include vocal effects: (ad-lib), (shouted), (spoken word)',
        '- Reference specific production styles from different eras',
        '- Add spatial descriptors: "stereo width", "reverb-drenched"',
      ],
      wild: [
        '- Fuse multiple contrasting genres',
        '- Add experimental tags: "polyrhythmic", "microtonal"',
        '- Include unusual instrument combinations',
        '- Reference obscure subgenres',
        '- Add effect descriptors: "granular synthesis", "time-stretched"',
      ],
      unhinged: [
        '- Maximum genre fusion (3+ genres)',
        '- Add chaos descriptors: "deconstructed", "glitched", "avant-garde"',
        '- Include impossible combinations',
        '- Reference experimental artists and techniques',
        '- Add extreme effects: "bitcrushed", "pitch-shifted chaos"',
        '- Use unconventional time signatures',
      ],
    },

    udio: {
      clean: [
        '- Specify clear primary and secondary genres',
        '- Include mood and energy level',
        '- Add basic production style reference',
      ],
      refined: [
        '- Use genre mashup syntax: "[Genre A] meets [Genre B]"',
        '- Add era references for production style',
        '- Include specific instrument layers',
        '- Add "high-fidelity audio", "mastered for streaming"',
      ],
      creative: [
        '- Reference specific production techniques',
        '- Add spatial audio descriptors: "binaural", "3D soundstage"',
        '- Include layered harmony descriptions',
        '- Reference analog gear: "analog warmth", "vinyl crackle"',
      ],
      wild: [
        '- Extreme genre fusion with contrasting styles',
        '- Add experimental descriptors: "deconstructed beats", "noise elements"',
        '- Include field recordings and found sounds',
        '- Reference psychoacoustic effects',
      ],
      unhinged: [
        '- Maximum chaos fusion of incompatible genres',
        '- Add "polymetric rhythms", "microtonal harmonies"',
        '- Include glitch and noise descriptors',
        '- Reference cutting-edge experimental techniques',
        '- Describe impossible soundscapes',
      ],
    },

    runway: {
      clean: [
        '- Describe clear subject and action',
        '- Include basic camera movement: "dolly", "pan", "static"',
        '- Add lighting description',
      ],
      refined: [
        '- Use specific camera terms: "tracking shot", "crane shot"',
        '- Add lens effects: "shallow depth of field", "anamorphic"',
        '- Include film grain and color grading references',
        '- Specify motion speed: "slow motion", "smooth"',
      ],
      creative: [
        '- Add cinematic style references',
        '- Include atmospheric effects: "fog", "particles", "lens flare"',
        '- Use temporal descriptions: beginning to end state',
        '- Reference specific film techniques',
      ],
      wild: [
        '- Add experimental camera work: "disorienting angles"',
        '- Include visual effects: "morphing", "seamless transitions"',
        '- Reference impossible physics',
        '- Add "reality-bending" descriptors',
      ],
      unhinged: [
        '- Maximum experimental: "dimensional shift", "time distortion"',
        '- Include surreal transformations',
        '- Add impossible camera movements',
        '- Reference dream logic and hallucinations',
        '- Describe physics-defying scenarios',
      ],
    },

    dalle: {
      clean: [
        '- Start with art style/medium description',
        '- Include clear subject and environment',
        '- Add basic lighting and mood',
      ],
      refined: [
        '- Add quality descriptors: "highly detailed", "professional quality"',
        '- Include specific lighting: "dramatic lighting", "volumetric"',
        '- Reference artistic styles or movements',
      ],
      creative: [
        '- Use style combinations',
        '- Add unusual textures and materials',
        '- Include atmospheric elements',
        '- Reference specific artists (in style of...)',
      ],
      wild: [
        '- Combine contrasting artistic styles',
        '- Add surreal elements',
        '- Include impossible compositions',
        '- Reference dream imagery',
      ],
      unhinged: [
        '- Maximum style fusion',
        '- Add psychedelic and abstract elements',
        '- Include impossible geometry',
        '- Reference otherworldly aesthetics',
        '- Describe reality-warping scenarios',
      ],
    },

    'stable-diffusion': {
      clean: [
        '- Use quality tags at start: (masterpiece:1.2), (best quality:1.2)',
        '- Include clear subject description',
        '- Add basic lighting and environment',
      ],
      refined: [
        '- Use proper weighting: (important_word:1.3-1.5)',
        '- Add detailed quality tags: (ultra-detailed:1.2), (8k:1.1)',
        '- Include BREAK for concept separation',
        '- Add style tags: (photorealistic:1.3), (cinematic:1.2)',
      ],
      creative: [
        '- Increase weights: (crucial_element:1.5-1.7)',
        '- Layer multiple quality enhancers',
        '- Add atmospheric BREAK sections',
        '- Include complex lighting descriptions',
      ],
      wild: [
        '- Use high weights: (element:1.8-2.0)',
        '- Add experimental style tags: (surreal:1.4), (dreamlike:1.3)',
        '- Include unusual style combinations',
        '- Reference obscure artistic techniques',
      ],
      unhinged: [
        '- Maximum weights where appropriate: (element:2.0+)',
        '- Add chaos combinations: (abstract:1.5), (ethereal:1.5), (cosmic:1.4)',
        '- Include eldritch and otherworldly descriptors',
        '- Reference impossible aesthetics',
        '- Layer extreme quality tags',
      ],
    },

    flux: {
      clean: [
        '- Write detailed, natural language descriptions',
        '- Include clear subject and action',
        '- Specify environment and lighting',
      ],
      refined: [
        '- Add camera/lens references for photography',
        '- Include magazine quality descriptors',
        '- Reference specific styles and techniques',
        '- Add texture and material details',
      ],
      creative: [
        '- Use longer, more detailed descriptions',
        '- Include unusual style combinations',
        '- Add atmospheric and mood elements',
        '- Reference fine art photography',
      ],
      wild: [
        '- Add experimental photography terms',
        '- Include unconventional perspectives',
        '- Reference avant-garde techniques',
        '- Describe complex compositions',
      ],
      unhinged: [
        '- Maximum detail and complexity',
        '- Include surreal and impossible elements',
        '- Reference experimental art movements',
        '- Describe reality-bending scenarios',
        '- Add abstract and conceptual descriptors',
      ],
    },

    leonardo: {
      clean: [
        '- Match prompt style to selected model',
        '- Include clear subject and environment',
        '- Add basic quality descriptors',
      ],
      refined: [
        '- Add model-appropriate quality tags',
        '- Include lighting and atmosphere',
        '- Reference relevant artistic styles',
      ],
      creative: [
        '- Layer quality descriptors',
        '- Add unusual style combinations',
        '- Include detailed texture descriptions',
      ],
      wild: [
        '- Combine contrasting styles',
        '- Add experimental elements',
        '- Reference obscure techniques',
      ],
      unhinged: [
        '- Maximum stylization',
        '- Include surreal and abstract elements',
        '- Reference extreme aesthetics',
        '- Describe impossible scenarios',
      ],
    },

    pika: {
      clean: [
        '- Describe clear motion and subject',
        '- Include basic camera movement',
        '- Add environment context',
      ],
      refined: [
        '- Use specific motion descriptors',
        '- Add smooth animation quality markers',
        '- Include consistent lighting',
      ],
      creative: [
        '- Add cinematic camera work',
        '- Include atmospheric effects',
        '- Reference fluid transitions',
      ],
      wild: [
        '- Add experimental motion',
        '- Include reality-warping elements',
        '- Reference impossible physics',
      ],
      unhinged: [
        '- Maximum experimental motion',
        '- Include dimensional shifts',
        '- Add surreal transformations',
        '- Describe physics-defying scenarios',
      ],
    },

    higgsfield: {
      clean: [
        '- Describe subject with motion',
        '- Include basic environment and mood',
        '- Add quality descriptors',
      ],
      refined: [
        '- Use magic symbols at start: ' + MAGIC_SYMBOLS.slice(0, 3).join(' '),
        '- Add ethereal descriptors',
        '- Include smooth motion quality',
      ],
      creative: [
        '- Layer symbols and descriptors',
        '- Add bioluminescent and holographic elements',
        '- Include cosmic and ethereal themes',
      ],
      wild: [
        '- Use [[double brackets]] for strong emphasis',
        '- Add fractal and sacred geometry',
        '- Include dimensional and reality-bending',
      ],
      unhinged: [
        '- Maximum symbol injection: ' + MAGIC_SYMBOLS.join(' '),
        '- Add "CHAOS MODE", "REALITY DISTORTION"',
        '- Include eldritch and void elements',
        '- Describe hyperdimensional scenarios',
        '- Combine all ethereal and cosmic descriptors',
      ],
    },
  };

  // Default config for platforms not explicitly defined
  const defaultConfig: PlatformChaosConfig = {
    clean: [
      '- Use clean, well-structured prompts',
      '- Include clear subject and context',
      '- Add basic quality descriptors',
    ],
    refined: [
      '- Add detailed quality markers',
      '- Include specific style references',
      '- Enhance with atmospheric elements',
    ],
    creative: [
      '- Combine multiple style references',
      '- Add unusual combinations',
      '- Include experimental elements',
    ],
    wild: [
      '- Push style boundaries',
      '- Add contrasting elements',
      '- Include unexpected combinations',
    ],
    unhinged: [
      '- Maximum experimentation',
      '- Break conventional rules',
      '- Include impossible combinations',
      '- Reference extreme aesthetics',
    ],
  };

  return configs[platform] || defaultConfig;
}

/**
 * Apply chaos modifications directly to a prompt (for preview purposes)
 */
export function applyChaosToPrompt(prompt: string, platform: Platform, intensity: number): string {
  if (intensity <= 20) return prompt;

  let modified = prompt;

  // Platform-specific modifications for Midjourney (most complex)
  if (platform === 'midjourney') {
    // Add symbols at higher intensities
    if (intensity >= 61) {
      const symbolCount = Math.floor((intensity - 60) / 20) + 1;
      const symbols = MAGIC_SYMBOLS.slice(0, symbolCount);
      modified = `${symbols[0]} ${modified}`;
      if (symbolCount > 1) {
        modified = `${modified} ${symbols[1]}`;
      }
    }

    // Add parameters based on intensity
    if (intensity >= 21 && !modified.includes('--stylize') && !modified.includes('--s ')) {
      const stylize = Math.floor(100 + (intensity - 20) * 8); // 100 at 21, 740 at 100
      modified = `${modified} --stylize ${Math.min(stylize, 1000)}`;
    }

    if (intensity >= 41 && !modified.includes('--chaos')) {
      const chaos = Math.floor((intensity - 40) * 1.5); // 0 at 41, 90 at 100
      modified = `${modified} --chaos ${Math.min(chaos, 100)}`;
    }

    if (intensity >= 51 && !modified.includes('--weird')) {
      const weird = Math.floor((intensity - 50) * 50); // 0 at 51, 2500 at 100
      modified = `${modified} --weird ${Math.min(weird, 3000)}`;
    }

    if (intensity >= 71 && !modified.includes('--exp')) {
      modified = `${modified} --exp`;
    }
  }

  return modified;
}

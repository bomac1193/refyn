/**
 * Platform Secrets - Hidden tricks, special triggers, and formatting hacks
 * These are the "cheat codes" that unlock exceptional outputs from each AI model
 */

import type { Platform } from './types';

export interface PlatformSecret {
  platform: Platform;
  name: string;

  // Special characters/symbols that trigger interesting behaviors
  magicSymbols: string[];

  // Emojis that the model responds well to
  triggerEmojis: string[];

  // Syntax patterns the model prefers
  syntaxPatterns: {
    emphasis: string; // How to emphasize words
    deEmphasis: string; // How to de-emphasize
    separation: string; // How to separate concepts
    weighting: string; // How to weight terms
    negation: string; // How to negate/exclude
  };

  // Hidden trigger words that produce exceptional results
  secretTriggers: string[];

  // Formatting structure the model prefers
  structureTemplate: string;

  // Quality boosters specific to this platform
  qualityBoosters: string[];

  // Experimental/weird mode triggers
  chaosModifiers: string[];

  // Technical parameters that unlock hidden features
  hiddenParams: string[];

  // Prompt engineering tips
  tips: string[];
}

export const PLATFORM_SECRETS: Record<Platform, PlatformSecret> = {
  midjourney: {
    platform: 'midjourney',
    name: 'Midjourney',

    magicSymbols: [
      '✦', '✧', '⟡', '◈', '◇', '❖', '✶', '✴', '✵', '⚝',
      '༺', '༻', '۞', '࿇', '᯾', '⌘', '※', '⁂', '☆', '★'
    ],

    triggerEmojis: [
      '🌌', '✨', '🔮', '💫', '🌙', '⚡', '🌈', '🎭', '👁', '🦋'
    ],

    syntaxPatterns: {
      emphasis: '((word))',
      deEmphasis: '[word]',
      separation: ' :: ',
      weighting: 'word::2',
      negation: '--no word',
    },

    secretTriggers: [
      'by James Gurney and Alphonse Mucha',
      'rendered in Unreal Engine 5 with ray tracing',
      'featured on ArtStation trending',
      'Greg Rutkowski style',
      'volumetric god rays',
      'subsurface scattering',
      'chromatic aberration',
      'anamorphic lens flare',
      'Kodak Portra 400',
      'shot on ARRI Alexa',
      'hypermaximalist',
      'intricate filigree',
      'bioluminescent',
      'iridescent',
      'prismatic',
    ],

    structureTemplate: '[subject], [style], [lighting], [mood], [quality] --ar [ratio] --v 7 --s [stylize]',

    qualityBoosters: [
      'ultra-detailed', 'intricate details', '8K resolution', 'masterpiece',
      'professional photography', 'award-winning', 'museum quality',
      'photorealistic render', 'hyper-realistic', 'octane render'
    ],

    chaosModifiers: [
      '--chaos 100', '--weird 3000', '--style raw', '--stylize 1000',
      '--seed random', '--tile', '--niji 6'
    ],

    hiddenParams: [
      '--v 7', '--ar 16:9', '--s 750', '--c 50', '--w 250',
      '--q 2', '--style raw', '--exp', '--no blur ugly deformed'
    ],

    tips: [
      'V7 does NOT support :: multi-prompts - use commas to separate concepts',
      '--chaos adds variation, --weird adds experimental elements',
      'Use parentheses for emphasis: (word), ((stronger)), (((strongest)))',
      'End with quality boosters for better results',
      '--style raw removes MJ beautification for more raw results',
      '--personalize or --p applies your trained style preferences'
    ]
  },

  dalle: {
    platform: 'dalle',
    name: 'DALL-E',

    magicSymbols: ['✦', '◆', '●', '■', '▲'],

    triggerEmojis: ['🎨', '🖼️', '✨', '🌟', '💡'],

    syntaxPatterns: {
      emphasis: 'WORD in capitals',
      deEmphasis: 'subtle word',
      separation: ', ',
      weighting: 'extremely detailed word',
      negation: 'without word, no word',
    },

    secretTriggers: [
      'digital art by Beeple',
      'trending on DeviantArt',
      'concept art for a AAA video game',
      'matte painting',
      'in the style of Studio Ghibli',
      'hyperrealistic photograph',
      'macro photography',
      'tilt-shift photography',
      'double exposure effect',
      'vaporwave aesthetic',
    ],

    structureTemplate: '[style] of [subject], [details], [lighting], [mood], [quality descriptors]',

    qualityBoosters: [
      'highly detailed', 'professional quality', 'sharp focus',
      'studio lighting', 'dramatic lighting', 'volumetric lighting',
      'detailed textures', 'intricate patterns', 'photorealistic'
    ],

    chaosModifiers: [
      'surrealist interpretation', 'abstract expressionist style',
      'psychedelic colors', 'impossible geometry', 'dreamlike quality',
      'glitch art aesthetic', 'maximalist composition'
    ],

    hiddenParams: [],

    tips: [
      'Start with art style/medium for best results',
      'DALL-E responds well to artist references (in style of...)',
      'Be specific about lighting conditions',
      'Include mood and atmosphere descriptors'
    ]
  },

  'stable-diffusion': {
    platform: 'stable-diffusion',
    name: 'Stable Diffusion',

    magicSymbols: ['✶', '❋', '✺', '❂', '✧'],

    triggerEmojis: ['🎭', '🌀', '💠', '🔷', '⚙️'],

    syntaxPatterns: {
      emphasis: '(word:1.5)',
      deEmphasis: '[word:0.5]',
      separation: ', ',
      weighting: '(word:1.8)',
      negation: 'BREAK negative: word',
    },

    secretTriggers: [
      '(masterpiece:1.4), (best quality:1.4)',
      '(extremely detailed CG unity 8k wallpaper)',
      '(photorealistic:1.4), (RAW photo:1.2)',
      'professional photograph',
      'cinematic lighting, volumetric fog',
      '(intricate details:1.3)',
      'depth of field, bokeh',
      'HDR, UHD, 64K',
      'Fujifilm XT3',
      'sharp focus on subject',
    ],

    structureTemplate: '(masterpiece:1.4), (best quality:1.4), [subject], [style], [details], [lighting], BREAK [mood]',

    qualityBoosters: [
      '(masterpiece:1.4)', '(best quality:1.4)', '(ultra-detailed:1.2)',
      '(8k:1.2)', '(photorealistic:1.3)', '(sharp focus:1.2)',
      '(professional:1.1)', '(high resolution:1.2)'
    ],

    chaosModifiers: [
      'BREAK psychedelic', '(abstract:1.5)', '(surreal:1.4)',
      '(dreamlike:1.3)', '(ethereal:1.4)', '(otherworldly:1.3)',
      '(cosmic horror:1.2)', '(eldritch:1.3)'
    ],

    hiddenParams: [
      'CFG Scale: 7-12 for quality, 15+ for strict adherence',
      'Steps: 30-50 for quality',
      'Sampler: DPM++ 2M Karras or Euler a'
    ],

    tips: [
      'Use (word:weight) syntax - 1.0 is normal, 1.5 is strong',
      'BREAK keyword separates concepts in SDXL',
      'Put quality tags at the start of prompt',
      'Negative prompts are crucial: ugly, blurry, deformed, bad anatomy'
    ]
  },

  leonardo: {
    platform: 'leonardo',
    name: 'Leonardo.AI',

    magicSymbols: ['◈', '◇', '✧', '❖', '✦'],

    triggerEmojis: ['🎨', '✨', '🌟', '💎', '🔥'],

    syntaxPatterns: {
      emphasis: 'detailed word',
      deEmphasis: 'subtle word',
      separation: ', ',
      weighting: 'highly detailed word',
      negation: 'Negative prompt: word',
    },

    secretTriggers: [
      'concept art masterpiece',
      'trending on CGSociety',
      'Unreal Engine 5 render',
      'cinematic composition',
      'dramatic chiaroscuro lighting',
      'intricate ornate details',
      'fantasy art illustration',
      'epic scene',
      'dynamic pose',
      'atmospheric perspective',
    ],

    structureTemplate: '[subject], [action/pose], [environment], [style], [lighting], [quality], Negative prompt: [exclusions]',

    qualityBoosters: [
      'highly detailed', 'sharp focus', 'professional artwork',
      'trending', 'award winning', 'masterpiece', '8K resolution',
      'intricate details', 'stunning', 'breathtaking'
    ],

    chaosModifiers: [
      'fever dream aesthetic', 'maximum detail overload',
      'hypersaturated colors', 'extreme dramatic lighting',
      'otherworldly atmosphere', 'cosmic scale'
    ],

    hiddenParams: [
      'Use PhotoReal model for realistic outputs',
      'DreamShaper for artistic/fantasy',
      'Guidance Scale: 7-9 recommended'
    ],

    tips: [
      'Match prompt style to selected model',
      'Leonardo models are fine-tuned for specific styles',
      'Use alchemy for enhanced quality',
      'Negative prompts prevent common issues'
    ]
  },

  flux: {
    platform: 'flux',
    name: 'Flux',

    magicSymbols: ['⚡', '✴', '❇', '✳', '⚛'],

    triggerEmojis: ['⚡', '🔥', '💥', '✨', '🌊'],

    syntaxPatterns: {
      emphasis: 'extremely word',
      deEmphasis: 'hint of word',
      separation: ', ',
      weighting: 'intensely detailed word',
      negation: 'without word',
    },

    secretTriggers: [
      'award-winning photograph',
      'National Geographic quality',
      'Hasselblad medium format',
      'Phase One IQ4 150MP',
      'editorial photography',
      'Leibovitz lighting',
      'fine art print quality',
      'museum exhibition piece',
      'Ansel Adams inspired',
      'perfectly composed',
    ],

    structureTemplate: '[detailed subject description], [specific style], [technical details], [lighting], [atmosphere], [quality markers]',

    qualityBoosters: [
      'phenomenal detail', 'ultra-high resolution', 'pristine quality',
      'professionally shot', 'magazine cover quality', 'gallery worthy',
      'crisp details', 'perfect exposure', 'balanced composition'
    ],

    chaosModifiers: [
      'experimental photography', 'avant-garde composition',
      'unconventional perspective', 'abstract interpretation',
      'radical lighting', 'extreme close-up'
    ],

    hiddenParams: [
      'Flux excels at text in images',
      'Very long, detailed prompts work well',
      'Specific camera/lens references improve quality'
    ],

    tips: [
      'Flux handles complex prompts very well',
      'Include specific camera and lens for photography',
      'Text rendering is a strength - include text carefully',
      'Be extremely specific about what you want'
    ]
  },

  suno: {
    platform: 'suno',
    name: 'Suno',

    magicSymbols: ['♪', '♫', '♬', '♩', '🎵'],

    triggerEmojis: ['🎵', '🎶', '🎤', '🎸', '🥁', '🎹', '🎷', '🎺'],

    syntaxPatterns: {
      emphasis: '[STYLE: word]',
      deEmphasis: 'subtle word',
      separation: ', ',
      weighting: 'heavy word influences',
      negation: 'no word elements',
    },

    secretTriggers: [
      '[Verse]', '[Chorus]', '[Bridge]', '[Outro]', '[Intro]',
      '[Drop]', '[Build-up]', '[Break]', '[Hook]',
      '(whispered)', '(shouted)', '(harmonized)',
      '(ad-lib)', '(spoken word)', '(humming)',
      'BPM: 120', 'Key: C Major',
    ],

    structureTemplate: '[STYLE: genre, mood, era] [INSTRUMENTATION: instruments] [VOCALS: vocal style] [Verse] lyrics [Chorus] lyrics',

    qualityBoosters: [
      'studio quality production', 'professionally mixed',
      'radio-ready', 'chart-topping sound', 'crisp audio',
      'dynamic range', 'punchy drums', 'warm bass'
    ],

    chaosModifiers: [
      'experimental fusion', 'genre-defying', 'avant-garde',
      'polyrhythmic', 'microtonal', 'glitched vocals',
      'reverse reverb', 'heavy distortion', 'granular synthesis'
    ],

    hiddenParams: [
      'Use [Section] tags to structure songs',
      '(vocal effect) in parentheses',
      'Specify BPM for tempo control',
      'Key specification affects mood'
    ],

    tips: [
      'Use [Verse], [Chorus], [Bridge] to structure',
      'Parentheses (whispered) change vocal delivery',
      'Be specific about genre combinations',
      'Include era references (80s synth-pop, 90s grunge)'
    ]
  },

  udio: {
    platform: 'udio',
    name: 'Udio',

    magicSymbols: ['♪', '♫', '🎼', '♭', '♯'],

    triggerEmojis: ['🎵', '🎧', '🔊', '🎹', '🎸'],

    syntaxPatterns: {
      emphasis: 'heavy word',
      deEmphasis: 'light word touches',
      separation: ', ',
      weighting: 'dominant word',
      negation: 'without word',
    },

    secretTriggers: [
      'fusion of [genre A] and [genre B]',
      'production style of [era]',
      'reminiscent of [mood] soundscapes',
      'layered harmonies', 'complex chord progressions',
      'analog warmth', 'vinyl crackle',
      'side-chain compression', 'stereo width',
      'psychoacoustic effects', 'binaural elements',
    ],

    structureTemplate: '[primary genre] meets [secondary genre], [mood], [tempo description], [instrumentation], [production style], [vocal type]',

    qualityBoosters: [
      'high-fidelity audio', 'mastered for streaming',
      'full frequency spectrum', 'punchy and clear',
      'balanced mix', 'professional production',
      'spatial audio', 'immersive sound'
    ],

    chaosModifiers: [
      'experimental sound design', 'deconstructed beats',
      'noise elements', 'field recordings', 'found sounds',
      'time-stretched', 'pitch-shifted chaos',
      'polymetric rhythms', 'microtonal harmonies'
    ],

    hiddenParams: [
      'Genre fusion is Udio\'s strength',
      'Longer prompts with more detail work well',
      'Production technique mentions improve output'
    ],

    tips: [
      'Udio excels at genre mashups',
      'Be specific about production techniques',
      'Reference specific eras and sounds',
      'Include stereo and spatial descriptors'
    ]
  },

  runway: {
    platform: 'runway',
    name: 'Runway',

    magicSymbols: ['▶', '◀', '⏩', '🎬', '📽'],

    triggerEmojis: ['🎬', '🎥', '📹', '🎞️', '📽️', '🌊', '💨'],

    syntaxPatterns: {
      emphasis: 'dramatic word',
      deEmphasis: 'subtle word movement',
      separation: ', ',
      weighting: 'intense word action',
      negation: 'static, no word',
    },

    secretTriggers: [
      'smooth camera dolly forward',
      'cinematic tracking shot',
      'slow motion at 120fps',
      'anamorphic lens flare',
      'shallow depth of field rack focus',
      'parallax movement',
      'seamless loop',
      'fluid motion', 'organic movement',
      'temporal coherence',
    ],

    structureTemplate: '[camera movement] of [subject] [action with motion], [environment], [lighting], [cinematic style], [quality]',

    qualityBoosters: [
      'cinematic quality', 'film grain', '4K resolution',
      'smooth motion', 'professional videography',
      'color graded', 'theatrical lighting', 'IMAX quality'
    ],

    chaosModifiers: [
      'experimental camera work', 'disorienting angles',
      'strobe lighting', 'visual glitches', 'morphing elements',
      'impossible physics', 'reality-bending', 'dream sequence'
    ],

    hiddenParams: [
      'Motion brush for specific element movement',
      'Camera motion presets for consistent movement',
      'Upscale for higher quality'
    ],

    tips: [
      'Describe motion explicitly: "camera slowly pulls back"',
      'Include temporal flow: beginning to end state',
      'Reference specific camera movements',
      'Keep main subject consistent throughout'
    ]
  },

  pika: {
    platform: 'pika',
    name: 'Pika',

    magicSymbols: ['⚡', '✦', '◆', '▸', '►'],

    triggerEmojis: ['🎬', '✨', '🌀', '💫', '🔮'],

    syntaxPatterns: {
      emphasis: 'strongly word',
      deEmphasis: 'gently word',
      separation: ', ',
      weighting: 'prominently word',
      negation: 'frozen, static word',
    },

    secretTriggers: [
      'seamless animation loop',
      'natural flowing motion',
      'physics-accurate movement',
      'cinematic camera sweep',
      'dynamic energy flow',
      'particle effects', 'magic sparkles',
      'ethereal glow animation',
      'morphing transformation',
    ],

    structureTemplate: '[subject] [specific motion/action], [environment], [atmosphere], [style], smooth motion, high quality',

    qualityBoosters: [
      'smooth animation', 'high frame rate', 'detailed motion',
      'natural movement', 'professional quality', 'crisp details',
      'consistent lighting', 'fluid transitions'
    ],

    chaosModifiers: [
      'reality warping', 'dimensional shift', 'abstract motion',
      'psychedelic flow', 'impossible physics', 'melting effect',
      'explosion of particles', 'cosmic transformation'
    ],

    hiddenParams: [
      '-gs for guidance scale',
      '-motion for motion intensity',
      '-camera for camera movement'
    ],

    tips: [
      'Focus on clear, describable motion',
      'Simple subjects animate better',
      'Include motion direction and speed',
      'Environment should complement motion'
    ]
  },

  higgsfield: {
    platform: 'higgsfield',
    name: 'Higgsfield',

    magicSymbols: [
      '✶', '✴', '✵', '❋', '✺', '❂', '✧', '✦', '⚝', '✫',
      '᯾', '࿇', '۞', '༺', '༻', '※', '⁂', '⌘', '◈', '◇'
    ],

    triggerEmojis: [
      '🌈', '✨', '💫', '🔮', '🌀', '⚡', '🦋', '🌊', '🔥', '❄️',
      '🌸', '🍃', '💎', '🌙', '☀️', '🌟', '💥', '🎆', '🎇', '👁'
    ],

    syntaxPatterns: {
      emphasis: '[word]',
      deEmphasis: 'soft word',
      separation: ', ',
      weighting: '[[word]]',
      negation: 'frozen, still word',
    },

    secretTriggers: [
      'hypnotic loop animation',
      'fluid organic motion',
      'ethereal energy particles',
      'bioluminescent glow',
      'aurora borealis effect',
      'liquid metal morphing',
      'cosmic nebula swirls',
      'crystalline formations',
      'holographic shimmer',
      'dimensional rift opening',
      'time-lapse transformation',
      'sacred geometry patterns',
      'fractal infinite zoom',
    ],

    structureTemplate: '[✶ or symbol] [subject with motion] [environment], [magical/ethereal elements], [lighting effects], [style] [emoji accents]',

    qualityBoosters: [
      'ultra smooth motion', 'mesmerizing flow', 'hypnotic quality',
      'pristine detail', 'ethereal beauty', 'otherworldly',
      'transcendent visuals', 'immersive experience'
    ],

    chaosModifiers: [
      '✶ CHAOS MODE ✶', '[[REALITY DISTORTION]]', 'MAXIMUM WEIRD',
      'dimensional collapse', 'eldritch geometry', 'void energy',
      'antimatter explosion', 'quantum fluctuation', 'singularity event',
      '🌀 HYPERDIMENSIONAL 🌀', '⚡ REALITY GLITCH ⚡'
    ],

    hiddenParams: [
      'Symbols at start trigger unique behaviors',
      'Double brackets [[word]] for strong emphasis',
      'Emoji combinations create unique effects',
      'Mythological references work well'
    ],

    tips: [
      'Magic symbols ✶ ✴ ✧ trigger ethereal/alien aesthetics',
      'Emojis like 🌈 ✨ 🔮 enhance magical elements',
      'Use [[double brackets]] for emphasis',
      'Combine symbols + emojis for maximum effect',
      'Mythological and cosmic themes work exceptionally well'
    ]
  },

  chatgpt: {
    platform: 'chatgpt',
    name: 'ChatGPT',

    magicSymbols: [],
    triggerEmojis: [],

    syntaxPatterns: {
      emphasis: '**word**',
      deEmphasis: 'optionally word',
      separation: '\n',
      weighting: 'IMPORTANT: word',
      negation: 'Do NOT word',
    },

    secretTriggers: [
      'You are an expert...',
      'Think step by step',
      'Let\'s work through this systematically',
      'Provide your response in the following format:',
      'Consider the following constraints:',
    ],

    structureTemplate: 'Role: [expert role]\n\nContext: [background]\n\nTask: [specific request]\n\nFormat: [output structure]\n\nConstraints: [limitations]',

    qualityBoosters: [
      'Be specific and detailed',
      'Include examples',
      'Consider edge cases',
      'Explain your reasoning'
    ],

    chaosModifiers: [
      'Think outside the box',
      'Consider unconventional approaches',
      'Challenge assumptions',
      'Be creative and innovative'
    ],

    hiddenParams: [],

    tips: [
      'Use XML tags for structured input/output',
      'Chain of thought improves reasoning',
      'Role assignment affects response style',
      'Format specifications get followed closely'
    ]
  },

  claude: {
    platform: 'claude',
    name: 'Claude',

    magicSymbols: [],
    triggerEmojis: [],

    syntaxPatterns: {
      emphasis: '<important>word</important>',
      deEmphasis: 'if relevant, word',
      separation: '\n\n',
      weighting: 'CRITICAL: word',
      negation: 'Never word, avoid word',
    },

    secretTriggers: [
      '<task>description</task>',
      '<context>background</context>',
      '<output_format>structure</output_format>',
      'Please think through this carefully',
      'Consider multiple perspectives',
    ],

    structureTemplate: '<context>\n[background]\n</context>\n\n<task>\n[specific request]\n</task>\n\n<output_format>\n[structure]\n</output_format>',

    qualityBoosters: [
      'Be thorough yet concise',
      'Cite your reasoning',
      'Acknowledge uncertainty',
      'Consider implications'
    ],

    chaosModifiers: [
      'Explore creative solutions',
      'Think divergently',
      'Consider unusual angles',
      'Question conventional wisdom'
    ],

    hiddenParams: [],

    tips: [
      'XML tags work excellently for structure',
      'Claude responds well to clear task definition',
      'Numbered steps improve multi-part tasks',
      'Be direct and specific about what you want'
    ]
  },

  unknown: {
    platform: 'unknown',
    name: 'Unknown',

    magicSymbols: ['✦', '✧', '◆', '◇'],
    triggerEmojis: ['✨', '🔥', '💫'],

    syntaxPatterns: {
      emphasis: 'word',
      deEmphasis: 'subtle word',
      separation: ', ',
      weighting: 'detailed word',
      negation: 'no word',
    },

    secretTriggers: [
      'high quality', 'detailed', 'professional',
      'masterpiece', 'award-winning'
    ],

    structureTemplate: '[subject], [style], [details], [quality]',

    qualityBoosters: [
      'high quality', 'detailed', 'professional', 'masterpiece'
    ],

    chaosModifiers: [
      'experimental', 'unique', 'creative', 'unconventional'
    ],

    hiddenParams: [],

    tips: [
      'Be specific and detailed',
      'Include style references',
      'Add quality descriptors'
    ]
  },
};

/**
 * Get platform secrets for a specific platform
 */
export function getPlatformSecrets(platform: Platform): PlatformSecret {
  return PLATFORM_SECRETS[platform] || PLATFORM_SECRETS.unknown;
}

/**
 * Generate a "crazy mode" enhanced prompt
 */
export function applyCrazyMode(prompt: string, platform: Platform): string {
  const secrets = getPlatformSecrets(platform);

  // Pick random magic symbols
  const symbol1 = secrets.magicSymbols[Math.floor(Math.random() * secrets.magicSymbols.length)] || '';
  const symbol2 = secrets.magicSymbols[Math.floor(Math.random() * secrets.magicSymbols.length)] || '';

  // Pick random trigger emojis
  const emoji1 = secrets.triggerEmojis[Math.floor(Math.random() * secrets.triggerEmojis.length)] || '';
  const emoji2 = secrets.triggerEmojis[Math.floor(Math.random() * secrets.triggerEmojis.length)] || '';

  // Pick random secret triggers
  const trigger1 = secrets.secretTriggers[Math.floor(Math.random() * secrets.secretTriggers.length)] || '';
  const trigger2 = secrets.secretTriggers[Math.floor(Math.random() * secrets.secretTriggers.length)] || '';

  // Pick random chaos modifiers
  const chaos1 = secrets.chaosModifiers[Math.floor(Math.random() * secrets.chaosModifiers.length)] || '';

  // Pick random quality boosters
  const quality1 = secrets.qualityBoosters[Math.floor(Math.random() * secrets.qualityBoosters.length)] || '';
  const quality2 = secrets.qualityBoosters[Math.floor(Math.random() * secrets.qualityBoosters.length)] || '';

  // Construct enhanced prompt based on platform
  let enhancedPrompt = prompt;

  if (platform === 'midjourney') {
    enhancedPrompt = `${symbol1} ${prompt} :: ${trigger1} :: ${quality1}, ${quality2} ${symbol2} ${chaos1}`;
  } else if (platform === 'stable-diffusion') {
    enhancedPrompt = `(masterpiece:1.4), (best quality:1.4), ${prompt}, ${trigger1}, (${quality1}:1.3), BREAK ${chaos1}`;
  } else if (platform === 'higgsfield') {
    enhancedPrompt = `${symbol1}${emoji1} ${prompt}, ${trigger1}, ${trigger2}, ${quality1} ${emoji2}${symbol2}`;
  } else if (platform === 'suno' || platform === 'udio') {
    enhancedPrompt = `${prompt}, ${trigger1}, ${trigger2}, ${quality1}, ${chaos1}`;
  } else if (platform === 'runway' || platform === 'pika') {
    enhancedPrompt = `${prompt}, ${trigger1}, ${quality1}, ${quality2}, ${chaos1}`;
  } else {
    enhancedPrompt = `${prompt}, ${trigger1}, ${quality1}, ${quality2}`;
  }

  return enhancedPrompt;
}

/**
 * Get the system prompt addition for crazy mode
 */
export function getCrazyModeSystemPrompt(platform: Platform): string {
  const secrets = getPlatformSecrets(platform);

  return `
CRAZY MODE ACTIVATED - USE THESE PLATFORM SECRETS:

MAGIC SYMBOLS (use 1-2 at start/end): ${secrets.magicSymbols.slice(0, 5).join(' ')}
TRIGGER EMOJIS (sprinkle these in): ${secrets.triggerEmojis.slice(0, 5).join(' ')}

SECRET TRIGGER WORDS (incorporate these):
${secrets.secretTriggers.slice(0, 6).join('\n')}

SYNTAX PATTERNS FOR THIS PLATFORM:
- Emphasis: ${secrets.syntaxPatterns.emphasis}
- Weighting: ${secrets.syntaxPatterns.weighting}
- Separation: "${secrets.syntaxPatterns.separation}"
- Negation: ${secrets.syntaxPatterns.negation}

CHAOS MODIFIERS (add 1-2):
${secrets.chaosModifiers.slice(0, 4).join('\n')}

QUALITY BOOSTERS (include several):
${secrets.qualityBoosters.slice(0, 5).join(', ')}

PLATFORM STRUCTURE TEMPLATE:
${secrets.structureTemplate}

PLATFORM TIPS:
${secrets.tips.join('\n')}

IMPORTANT: Use these secrets to create an EXCEPTIONAL, boundary-pushing prompt that leverages the hidden capabilities of ${secrets.name}. Make it creative, unexpected, and optimized for maximum impact.
`;
}

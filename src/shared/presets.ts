import type { StylePreset, PlatformCategory } from './types';

// Image Generation Presets (Midjourney, DALL-E, Stable Diffusion, Leonardo, Flux)
export const IMAGE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Film-like quality with dramatic lighting',
    category: 'image',
    keywords: ['cinematic', 'film grain', 'anamorphic', 'dramatic lighting', 'movie still', 'depth of field', '35mm'],
    avoid: ['unreal engine', 'video game', 'cartoon', '3D render'],
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Ultra-realistic photography style',
    category: 'image',
    keywords: ['photorealistic', 'hyperrealistic', 'DSLR', 'sharp focus', 'natural lighting', '8K', 'professional photography'],
    avoid: ['illustration', 'painting', 'cartoon', 'stylized', 'unreal engine'],
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style',
    category: 'image',
    keywords: ['anime', 'manga style', 'cel shaded', 'Studio Ghibli inspired', 'vibrant colors', 'expressive'],
    avoid: ['photorealistic', 'hyperrealistic', '3D render', 'unreal engine'],
  },
  {
    id: 'artistic',
    name: 'Fine Art',
    description: 'Classical artistic painting style',
    category: 'image',
    keywords: ['oil painting', 'fine art', 'masterpiece', 'classical', 'brush strokes', 'museum quality', 'artistic'],
    avoid: ['photograph', 'digital', '3D', 'unreal engine', 'CGI'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, simple, elegant',
    category: 'image',
    keywords: ['minimalist', 'clean', 'simple', 'white space', 'elegant', 'modern', 'subtle'],
    avoid: ['busy', 'cluttered', 'detailed', 'complex', 'ornate'],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Retro and nostalgic feel',
    category: 'image',
    keywords: ['vintage', 'retro', 'nostalgic', 'film photography', 'faded colors', '1970s', 'analog'],
    avoid: ['modern', 'futuristic', 'digital', 'crisp', 'HDR'],
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Magical and ethereal',
    category: 'image',
    keywords: ['fantasy', 'magical', 'ethereal', 'mystical', 'enchanted', 'dreamlike', 'otherworldly'],
    avoid: ['realistic', 'mundane', 'everyday', 'documentary'],
  },
  {
    id: 'dark-moody',
    name: 'Dark & Moody',
    description: 'Atmospheric with deep shadows',
    category: 'image',
    keywords: ['dark', 'moody', 'atmospheric', 'chiaroscuro', 'shadows', 'noir', 'dramatic contrast'],
    avoid: ['bright', 'cheerful', 'pastel', 'high key', 'saturated'],
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-quality fashion/commercial',
    category: 'image',
    keywords: ['editorial', 'fashion photography', 'vogue', 'high-end', 'commercial', 'studio lighting', 'polished'],
    avoid: ['candid', 'casual', 'amateur', 'snapshot'],
  },
  {
    id: 'surreal',
    name: 'Surreal',
    description: 'Dreamlike and impossible',
    category: 'image',
    keywords: ['surreal', 'surrealism', 'dreamlike', 'impossible', 'Dali inspired', 'abstract', 'mind-bending'],
    avoid: ['realistic', 'ordinary', 'conventional'],
  },
];

// Music Generation Presets (Suno, Udio)
export const MUSIC_PRESETS: StylePreset[] = [
  {
    id: 'lofi',
    name: 'Lo-Fi',
    description: 'Chill, relaxed beats',
    category: 'music',
    keywords: ['lo-fi', 'chill', 'relaxed', 'vinyl crackle', 'mellow', 'jazzy samples', 'study beats'],
    avoid: ['aggressive', 'loud', 'EDM', 'metal'],
  },
  {
    id: 'cinematic-music',
    name: 'Cinematic',
    description: 'Epic orchestral soundscapes',
    category: 'music',
    keywords: ['cinematic', 'orchestral', 'epic', 'film score', 'sweeping', 'emotional', 'Hans Zimmer inspired'],
    avoid: ['lo-fi', 'simple', 'acoustic only'],
  },
  {
    id: 'electronic',
    name: 'Electronic',
    description: 'Modern synth-driven',
    category: 'music',
    keywords: ['electronic', 'synth', 'EDM', 'bass-heavy', 'modern production', 'club', 'energetic'],
    avoid: ['acoustic', 'organic', 'unplugged', 'folk'],
  },
  {
    id: 'acoustic',
    name: 'Acoustic',
    description: 'Organic, natural instruments',
    category: 'music',
    keywords: ['acoustic', 'organic', 'natural', 'unplugged', 'intimate', 'warm', 'singer-songwriter'],
    avoid: ['electronic', 'synth', 'heavy production', 'auto-tune'],
  },
  {
    id: 'ambient',
    name: 'Ambient',
    description: 'Atmospheric and meditative',
    category: 'music',
    keywords: ['ambient', 'atmospheric', 'meditative', 'ethereal', 'soundscape', 'dreamy', 'relaxing'],
    avoid: ['upbeat', 'energetic', 'vocals', 'drums'],
  },
  {
    id: 'upbeat-pop',
    name: 'Upbeat Pop',
    description: 'Catchy and energetic',
    category: 'music',
    keywords: ['pop', 'upbeat', 'catchy', 'radio-friendly', 'hooks', 'bright', 'feel-good'],
    avoid: ['sad', 'melancholic', 'dark', 'slow'],
  },
  {
    id: 'indie',
    name: 'Indie',
    description: 'Alternative and authentic',
    category: 'music',
    keywords: ['indie', 'alternative', 'authentic', 'raw', 'emotional', 'guitar-driven', 'introspective'],
    avoid: ['overproduced', 'mainstream', 'polished'],
  },
  {
    id: 'hip-hop',
    name: 'Hip-Hop',
    description: 'Rhythm-focused with beats',
    category: 'music',
    keywords: ['hip-hop', 'rap', 'beats', '808s', 'trap', 'boom bap', 'rhythm'],
    avoid: ['country', 'folk', 'classical'],
  },
];

// Video Generation Presets (Runway, Pika, Higgsfield)
export const VIDEO_PRESETS: StylePreset[] = [
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Real, observational footage',
    category: 'video',
    keywords: ['documentary style', 'handheld', 'natural lighting', 'observational', 'authentic', 'real footage'],
    avoid: ['stylized', 'fantasy', 'special effects'],
  },
  {
    id: 'commercial',
    name: 'Commercial',
    description: 'Polished advertising quality',
    category: 'video',
    keywords: ['commercial', 'advertisement', 'polished', 'product shot', 'professional', 'clean', 'high production'],
    avoid: ['raw', 'amateur', 'shaky'],
  },
  {
    id: 'music-video',
    name: 'Music Video',
    description: 'Stylized performance visuals',
    category: 'video',
    keywords: ['music video', 'stylized', 'performance', 'dynamic', 'creative transitions', 'visual effects'],
    avoid: ['static', 'documentary', 'talking head'],
  },
  {
    id: 'slow-motion',
    name: 'Slow Motion',
    description: 'Dramatic slowed footage',
    category: 'video',
    keywords: ['slow motion', 'high fps', 'dramatic', 'time stretch', 'detailed motion', 'smooth'],
    avoid: ['fast cuts', 'timelapse', 'quick edits'],
  },
  {
    id: 'timelapse',
    name: 'Timelapse',
    description: 'Accelerated time passage',
    category: 'video',
    keywords: ['timelapse', 'hyperlapse', 'time passage', 'accelerated', 'transformation', 'day to night'],
    avoid: ['slow motion', 'real-time', 'static'],
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Soft, ethereal atmosphere',
    category: 'video',
    keywords: ['dreamy', 'soft focus', 'ethereal', 'hazy', 'romantic', 'gentle motion', 'flowing'],
    avoid: ['sharp', 'harsh', 'gritty', 'realistic'],
  },
];

// Get presets by category
export function getPresetsForCategory(category: PlatformCategory): StylePreset[] {
  switch (category) {
    case 'image':
      return IMAGE_PRESETS;
    case 'music':
      return MUSIC_PRESETS;
    case 'video':
      return VIDEO_PRESETS;
    default:
      return IMAGE_PRESETS; // Default to image presets
  }
}

// Get preset by ID
export function getPresetById(id: string): StylePreset | undefined {
  return [...IMAGE_PRESETS, ...MUSIC_PRESETS, ...VIDEO_PRESETS].find(p => p.id === id);
}

// Get all presets
export function getAllPresets(): StylePreset[] {
  return [...IMAGE_PRESETS, ...MUSIC_PRESETS, ...VIDEO_PRESETS];
}

/**
 * Udio-specific utilities and tag handling
 */

export interface UdioTags {
  primaryGenre?: string;
  secondaryGenre?: string;
  mood?: string[];
  instruments?: string[];
  production?: string[];
  vocals?: string;
  era?: string;
}

/**
 * Parse Udio-style prompt elements
 */
export function parseUdioPrompt(prompt: string): {
  description: string;
  tags: UdioTags;
} {
  const tags: UdioTags = {};
  let description = prompt;

  // Detect "X meets Y" pattern
  const meetsMatch = prompt.match(/(\w+(?:\s+\w+)?)\s+meets\s+(\w+(?:\s+\w+)?)/i);
  if (meetsMatch) {
    tags.primaryGenre = meetsMatch[1].trim();
    tags.secondaryGenre = meetsMatch[2].trim();
  }

  // Detect era references
  const eras = ['60s', '70s', '80s', '90s', '2000s', '2010s', 'modern', 'vintage', 'retro', 'futuristic'];
  for (const era of eras) {
    if (prompt.toLowerCase().includes(era)) {
      tags.era = era;
      break;
    }
  }

  return {
    description: description.trim(),
    tags,
  };
}

/**
 * Build Udio-style prompt
 */
export function buildUdioPrompt(tags: UdioTags, description: string): string {
  const parts: string[] = [];

  // Genre fusion
  if (tags.primaryGenre && tags.secondaryGenre) {
    parts.push(`${tags.primaryGenre} meets ${tags.secondaryGenre}`);
  } else if (tags.primaryGenre) {
    parts.push(tags.primaryGenre);
  }

  // Mood
  if (tags.mood && tags.mood.length > 0) {
    parts.push(tags.mood.join(', '));
  }

  // Instruments
  if (tags.instruments && tags.instruments.length > 0) {
    parts.push(tags.instruments.join(', '));
  }

  // Production
  if (tags.production && tags.production.length > 0) {
    parts.push(tags.production.join(' '));
  }

  // Vocals
  if (tags.vocals) {
    parts.push(tags.vocals);
  }

  // Era
  if (tags.era) {
    parts.push(`${tags.era} influence`);
  }

  // Add description if different from constructed prompt
  if (description && !parts.some(p => p.includes(description))) {
    parts.push(description);
  }

  return parts.join(', ');
}

/**
 * Genre combinations that work well in Udio
 */
export const UDIO_GENRE_FUSIONS = [
  { primary: 'Jazz', secondary: 'Hip-Hop', label: 'Jazz-Hop' },
  { primary: 'Electronic', secondary: 'Classical', label: 'Neoclassical' },
  { primary: 'Rock', secondary: 'Electronic', label: 'Electro-Rock' },
  { primary: 'Folk', secondary: 'Electronic', label: 'Folktronica' },
  { primary: 'R&B', secondary: 'Electronic', label: 'Future R&B' },
  { primary: 'Metal', secondary: 'Orchestral', label: 'Symphonic Metal' },
  { primary: 'Pop', secondary: 'Indie', label: 'Indie Pop' },
  { primary: 'Hip-Hop', secondary: 'Soul', label: 'Neo-Soul' },
];

/**
 * Production techniques Udio handles well
 */
export const UDIO_PRODUCTION_STYLES = [
  'Wide stereo imaging',
  'Layered textures',
  'Complex arrangements',
  'Build-ups and drops',
  'Atmospheric pads',
  'Punchy drums',
  'Glitchy effects',
  'Smooth transitions',
  'Heavy compression',
  'Lo-fi warmth',
  'Crystal clear highs',
  'Deep sub-bass',
];

/**
 * Temporal/structure descriptors for Udio
 */
export const UDIO_STRUCTURE_ELEMENTS = [
  'Intro',
  'Build-up',
  'Drop',
  'Verse',
  'Chorus',
  'Bridge',
  'Breakdown',
  'Outro',
  'Crescendo',
  'Fade out',
];

/**
 * Suggest Udio-optimized prompt elements
 */
export function suggestUdioEnhancements(prompt: string): string[] {
  const suggestions: string[] = [];
  const lower = prompt.toLowerCase();

  // Suggest genre fusion if single genre detected
  const genres = ['rock', 'pop', 'jazz', 'electronic', 'hip-hop', 'classical', 'folk', 'metal'];
  const detectedGenres = genres.filter(g => lower.includes(g));

  if (detectedGenres.length === 1) {
    const fusion = UDIO_GENRE_FUSIONS.find(f =>
      f.primary.toLowerCase() === detectedGenres[0] ||
      f.secondary.toLowerCase() === detectedGenres[0]
    );
    if (fusion) {
      suggestions.push(`Try: "${fusion.primary} meets ${fusion.secondary}" for interesting results`);
    }
  }

  // Suggest production techniques
  if (!lower.includes('production') && !lower.includes('mix')) {
    suggestions.push('Add production style for better results (e.g., "wide stereo imaging", "layered textures")');
  }

  // Suggest structure elements
  if (!UDIO_STRUCTURE_ELEMENTS.some(el => lower.includes(el.toLowerCase()))) {
    suggestions.push('Consider adding structure hints (e.g., "build-up into epic drop")');
  }

  return suggestions;
}

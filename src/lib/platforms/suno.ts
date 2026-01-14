/**
 * Suno-specific utilities and tag handling
 */

export interface SunoTags {
  genre?: string[];
  mood?: string[];
  instruments?: string[];
  vocals?: string[];
  production?: string[];
  tempo?: string;
  key?: string;
}

/**
 * Parse Suno meta tags from a prompt
 */
export function parseSunoTags(prompt: string): {
  description: string;
  tags: SunoTags;
} {
  const tags: SunoTags = {};
  let description = prompt;

  // Parse [STYLE: ...] format
  const styleMatch = prompt.match(/\[STYLE:\s*([^\]]+)\]/i);
  if (styleMatch) {
    tags.genre = styleMatch[1].split(',').map(s => s.trim());
    description = description.replace(styleMatch[0], '');
  }

  // Parse [MOOD: ...] format
  const moodMatch = prompt.match(/\[MOOD:\s*([^\]]+)\]/i);
  if (moodMatch) {
    tags.mood = moodMatch[1].split(',').map(s => s.trim());
    description = description.replace(moodMatch[0], '');
  }

  // Parse [INSTRUMENTATION: ...] format
  const instrMatch = prompt.match(/\[INSTRUMENTATION:\s*([^\]]+)\]/i);
  if (instrMatch) {
    tags.instruments = instrMatch[1].split(',').map(s => s.trim());
    description = description.replace(instrMatch[0], '');
  }

  // Parse [VOCALS: ...] format
  const vocalsMatch = prompt.match(/\[VOCALS:\s*([^\]]+)\]/i);
  if (vocalsMatch) {
    tags.vocals = vocalsMatch[1].split(',').map(s => s.trim());
    description = description.replace(vocalsMatch[0], '');
  }

  // Parse BPM
  const bpmMatch = prompt.match(/(\d{2,3})\s*BPM/i);
  if (bpmMatch) {
    tags.tempo = `${bpmMatch[1]} BPM`;
  }

  // Parse key
  const keyMatch = prompt.match(/\b([A-G][#b]?)\s*(major|minor|maj|min)?\b/i);
  if (keyMatch) {
    tags.key = keyMatch[0].trim();
  }

  return {
    description: description.trim().replace(/\s+/g, ' '),
    tags,
  };
}

/**
 * Build Suno meta tags string
 */
export function buildSunoTags(tags: SunoTags): string {
  const parts: string[] = [];

  if (tags.genre && tags.genre.length > 0) {
    parts.push(`[STYLE: ${tags.genre.join(', ')}]`);
  }
  if (tags.mood && tags.mood.length > 0) {
    parts.push(`[MOOD: ${tags.mood.join(', ')}]`);
  }
  if (tags.instruments && tags.instruments.length > 0) {
    parts.push(`[INSTRUMENTATION: ${tags.instruments.join(', ')}]`);
  }
  if (tags.vocals && tags.vocals.length > 0) {
    parts.push(`[VOCALS: ${tags.vocals.join(', ')}]`);
  }

  return parts.join(' ');
}

/**
 * Available genres for Suno
 */
export const SUNO_GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Dance',
  'Jazz', 'Classical', 'Folk', 'Country', 'Metal', 'Punk',
  'Indie', 'Alternative', 'Blues', 'Soul', 'Funk', 'Reggae',
  'Lo-fi', 'Ambient', 'Orchestral', 'Cinematic', 'World',
];

/**
 * Available moods for Suno
 */
export const SUNO_MOODS = [
  'Energetic', 'Uplifting', 'Happy', 'Joyful', 'Euphoric',
  'Melancholic', 'Sad', 'Emotional', 'Nostalgic', 'Bittersweet',
  'Dark', 'Moody', 'Mysterious', 'Tense', 'Dramatic',
  'Peaceful', 'Calm', 'Relaxing', 'Dreamy', 'Ethereal',
  'Aggressive', 'Intense', 'Powerful', 'Epic', 'Triumphant',
];

/**
 * Available instruments for Suno
 */
export const SUNO_INSTRUMENTS = [
  'Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Piano',
  'Synthesizer', 'Drums', '808s', 'Strings', 'Brass', 'Woodwinds',
  'Violin', 'Cello', 'Saxophone', 'Trumpet', 'Flute',
  'Organ', 'Harp', 'Percussion', 'Orchestra', 'Beat',
];

/**
 * Available vocal styles for Suno
 */
export const SUNO_VOCALS = [
  'Male Vocals', 'Female Vocals', 'Duet', 'Choir', 'Harmonies',
  'Raspy', 'Smooth', 'Powerful', 'Soft', 'Whispered',
  'Falsetto', 'Belting', 'Rap', 'Spoken Word', 'Instrumental',
];

/**
 * Available production styles for Suno
 */
export const SUNO_PRODUCTION = [
  'Polished', 'Raw', 'Lo-fi', 'Hi-fi', 'Layered',
  'Minimal', 'Dense', 'Spacious', 'Intimate', 'Grand',
  'Vintage', 'Modern', 'Futuristic', 'Organic', 'Electronic',
  'Reverb-drenched', 'Dry', 'Compressed', 'Dynamic',
];

/**
 * Suggest tags based on prompt content
 */
export function suggestSunoTags(prompt: string): SunoTags {
  const lower = prompt.toLowerCase();
  const tags: SunoTags = {};

  // Detect genre
  for (const genre of SUNO_GENRES) {
    if (lower.includes(genre.toLowerCase())) {
      tags.genre = tags.genre || [];
      tags.genre.push(genre);
    }
  }

  // Detect mood
  for (const mood of SUNO_MOODS) {
    if (lower.includes(mood.toLowerCase())) {
      tags.mood = tags.mood || [];
      tags.mood.push(mood);
    }
  }

  // Detect instruments
  for (const instrument of SUNO_INSTRUMENTS) {
    if (lower.includes(instrument.toLowerCase())) {
      tags.instruments = tags.instruments || [];
      tags.instruments.push(instrument);
    }
  }

  // Limit arrays to avoid overly complex prompts
  if (tags.genre) tags.genre = tags.genre.slice(0, 3);
  if (tags.mood) tags.mood = tags.mood.slice(0, 2);
  if (tags.instruments) tags.instruments = tags.instruments.slice(0, 4);

  return tags;
}

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Extract keywords from a prompt
 */
export function extractKeywords(prompt: string): string[] {
  // Remove common words and extract meaningful keywords
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
    'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Return unique keywords
  return [...new Set(words)];
}

/**
 * Calculate text similarity (simple Jaccard index)
 */
export function textSimilarity(text1: string, text2: string): number {
  const words1 = new Set(extractKeywords(text1));
  const words2 = new Set(extractKeywords(text2));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Simple XOR encryption/decryption for API key storage
 * Note: This is basic obfuscation, not secure encryption
 */
const ENCRYPTION_KEY = 'refyn-signal-dna';

export function encryptKey(key: string): string {
  let result = '';
  for (let i = 0; i < key.length; i++) {
    result += String.fromCharCode(
      key.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return btoa(result);
}

export function decryptKey(encrypted: string): string {
  const decoded = atob(encrypted);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    );
  }
  return result;
}

/**
 * Classify prompt sentiment/mood
 */
export function analyzeSentiment(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  const moods: Record<string, string[]> = {
    dramatic: ['dramatic', 'intense', 'powerful', 'bold', 'striking', 'epic'],
    peaceful: ['peaceful', 'calm', 'serene', 'tranquil', 'gentle', 'soft'],
    dark: ['dark', 'moody', 'mysterious', 'noir', 'shadow', 'gothic'],
    vibrant: ['vibrant', 'colorful', 'bright', 'vivid', 'energetic', 'dynamic'],
    nostalgic: ['nostalgic', 'vintage', 'retro', 'classic', 'timeless', 'old'],
    futuristic: ['futuristic', 'sci-fi', 'cyber', 'neon', 'tech', 'modern'],
    whimsical: ['whimsical', 'fantasy', 'magical', 'dreamy', 'ethereal', 'surreal'],
  };

  for (const [mood, keywords] of Object.entries(moods)) {
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      return mood;
    }
  }

  return 'neutral';
}

/**
 * Measure prompt complexity
 */
export function measureComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
  const wordCount = prompt.split(/\s+/).length;
  const hasParameters = /--\w+/.test(prompt);
  const commaCount = (prompt.match(/,/g) || []).length;

  if (wordCount > 50 || commaCount > 5 || hasParameters) return 'complex';
  if (wordCount > 20 || commaCount > 2) return 'moderate';
  return 'simple';
}

/**
 * Class name helper (like clsx/classnames)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

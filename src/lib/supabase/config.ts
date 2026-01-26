/**
 * Supabase Configuration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase credentials
const DEFAULT_SUPABASE_URL = 'https://ujamipkgwqinwxyiemiw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqYW1pcGtnd3Fpbnd4eWllbWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDM4MTYsImV4cCI6MjA4NTAxOTgxNn0.6NTMi8EIxpiYOXUXXxEqX0IVTrVavoljIBPNbNiSnGI';

// Storage key for custom Supabase credentials (optional override)
const SUPABASE_CONFIG_KEY = 'refyn_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase configuration (uses defaults, can be overridden via storage)
 */
export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    const result = await chrome.storage.local.get(SUPABASE_CONFIG_KEY);
    if (result[SUPABASE_CONFIG_KEY]?.url && result[SUPABASE_CONFIG_KEY]?.anonKey) {
      return result[SUPABASE_CONFIG_KEY];
    }
  } catch {
    // Use defaults
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
  };
}

/**
 * Save Supabase configuration to storage
 */
export async function saveSupabaseConfig(config: SupabaseConfig): Promise<void> {
  await chrome.storage.local.set({ [SUPABASE_CONFIG_KEY]: config });
  // Reset client so it reinitializes with new config
  supabaseClient = null;
}

// Storage key prefix for Supabase auth
const STORAGE_PREFIX = 'refyn_sb_';

/**
 * Get or create Supabase client
 */
export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = await getSupabaseConfig();

  supabaseClient = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: `${STORAGE_PREFIX}auth`,
      storage: {
        getItem: async (key) => {
          try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            const result = await chrome.storage.local.get(storageKey);
            return result[storageKey] || null;
          } catch (err) {
            console.error('[Refyn Storage] getItem error:', err);
            return null;
          }
        },
        setItem: async (key, value) => {
          try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            await chrome.storage.local.set({ [storageKey]: value });
          } catch (err) {
            console.error('[Refyn Storage] setItem error:', err);
          }
        },
        removeItem: async (key) => {
          try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            await chrome.storage.local.remove(storageKey);
          } catch (err) {
            console.error('[Refyn Storage] removeItem error:', err);
          }
        },
      },
    },
  });

  return supabaseClient;
}

/**
 * Check if Supabase is configured (always true with defaults)
 */
export async function isSupabaseConfigured(): Promise<boolean> {
  return true;
}

/**
 * Clear Supabase configuration
 */
export async function clearSupabaseConfig(): Promise<void> {
  await chrome.storage.local.remove(SUPABASE_CONFIG_KEY);
  supabaseClient = null;
}

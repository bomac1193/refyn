/**
 * Supabase Authentication Service
 *
 * Handles user login, signup, and session management
 */

import { getSupabase, isSupabaseConfigured } from './config';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  session: Session | null;
}

/**
 * Get current auth state with robust session recovery
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    console.log('[Refyn Auth] Getting auth state...');

    // First check if we have session data in storage
    const storageKey = 'refyn_sb_auth';
    const stored = await chrome.storage.local.get(storageKey);
    const hasStoredSession = !!stored[storageKey];
    console.log('[Refyn Auth] Stored session exists:', hasStoredSession);

    const supabase = await getSupabase();

    // Try to get the current session (Supabase should load from storage automatically)
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Refyn Auth] getSession error:', error);
      return { isLoggedIn: false, user: null, session: null };
    }

    if (session) {
      console.log('[Refyn Auth] Session found for:', session.user.email);
      return {
        isLoggedIn: true,
        user: session.user,
        session,
      };
    }

    // If no session but we have stored data, try to refresh
    if (hasStoredSession) {
      console.log('[Refyn Auth] No active session but have stored data, attempting refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('[Refyn Auth] Refresh error:', refreshError);
        // Clear invalid session data
        await chrome.storage.local.remove(storageKey);
        return { isLoggedIn: false, user: null, session: null };
      }

      if (refreshData.session) {
        console.log('[Refyn Auth] Session refreshed for:', refreshData.session.user.email);
        return {
          isLoggedIn: true,
          user: refreshData.session.user,
          session: refreshData.session,
        };
      }
    }

    console.log('[Refyn Auth] No session found');
    return { isLoggedIn: false, user: null, session: null };
  } catch (err) {
    console.error('[Refyn Auth] getAuthState error:', err);
    return { isLoggedIn: false, user: null, session: null };
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Initialize user profile in database
      await initializeUserProfile(data.user.id);
      return { success: true, user: data.user };
    }

    return { success: false, error: 'Unknown error during signup' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    console.log('[Refyn Auth] Signing in:', email);
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Refyn Auth] Sign in error:', error);
      return { success: false, error: error.message };
    }

    if (data.user && data.session) {
      console.log('[Refyn Auth] Sign in successful:', data.user.email);

      // Verify the session was saved to storage
      const storageKey = 'refyn_sb_auth';
      setTimeout(async () => {
        const stored = await chrome.storage.local.get(storageKey);
        console.log('[Refyn Auth] Session saved to storage:', !!stored[storageKey]);
      }, 500);

      return { success: true, user: data.user };
    }

    return { success: false, error: 'Unknown error during login' };
  } catch (err) {
    console.error('[Refyn Auth] Sign in exception:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Initialize user profile in database after signup
 */
async function initializeUserProfile(userId: string): Promise<void> {
  const supabase = await getSupabase();

  try {
    await supabase.from('profiles').upsert({
      id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Refyn Auth] Failed to initialize profile:', err);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const configured = await isSupabaseConfigured();
  if (!configured) return false;

  const user = await getCurrentUser();
  return !!user;
}

/**
 * Listen for auth state changes
 */
export async function onAuthStateChange(
  callback: (state: AuthState) => void
): Promise<() => void> {
  const supabase = await getSupabase();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('[Refyn Auth] Auth state changed:', event);
      callback({
        isLoggedIn: !!session,
        user: session?.user || null,
        session,
      });
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

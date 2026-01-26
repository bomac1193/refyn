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
 * Get current auth state
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const supabase = await getSupabase();

    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Refyn Auth] getSession error:', error);
      return { isLoggedIn: false, user: null, session: null };
    }

    if (session) {
      return {
        isLoggedIn: true,
        user: session.user,
        session,
      };
    }

    // If no session, try to refresh from stored token
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !refreshData.session) {
      return { isLoggedIn: false, user: null, session: null };
    }

    return {
      isLoggedIn: true,
      user: refreshData.session.user,
      session: refreshData.session,
    };
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
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      return { success: true, user: data.user };
    }

    return { success: false, error: 'Unknown error during login' };
  } catch (err) {
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

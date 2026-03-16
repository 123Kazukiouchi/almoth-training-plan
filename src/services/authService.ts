import { supabase } from '../utils/supabaseClient';

/**
 * Authentication and Session Management Service (Supabase)
 */

export interface UserProfile {
    email: string;
    id: string;
    lastLogin: number;
}

const SESSION_KEY = 'almoth_auth_session';

export async function getCurrentUser(): Promise<UserProfile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) return null;

    return {
        email: session.user.email || '',
        id: session.user.id,
        lastLogin: new Date(session.user.last_sign_in_at || Date.now()).getTime()
    };
}

// Synchronous version for simple UI checks (based on last known session)
export function getCachedUser(): UserProfile | null {
    // Supabase stores session in localStorage. 
    // But let's keep one simple state variable.
    const userJson = localStorage.getItem(SESSION_KEY);
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch (e) {
        return null;
    }
}

export async function loginWithEmail(email: string, _password?: string): Promise<{ user: UserProfile | null, error: any }> {
    // If password provided, use it. Otherwise, use a default for this simple app or Magic Link.
    // For KAZU's convenience, let's use a standard password or Magic Link.
    // Let's try Magic Link first as it's provided in Supabase by default.
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.origin
        }
    });

    if (error) return { user: null, error };
    return { user: null, error: null }; // User needs to check email
}

export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
    return { error };
}

export async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    window.location.hash = '#/login';
}

/**
 * Returns a prefix for localStorage keys based on current user
 */
export async function getStoragePrefix(): Promise<string> {
    const user = await getCurrentUser();
    return user ? `u_${user.id}_` : 'guest_';
}

// Sync version for initialization
export function getStoragePrefixSync(): string {
    const user = getCachedUser();
    return user ? `u_${user.id}_` : 'guest_';
}

/**
 * Listen for auth changes and sync with local session
 */
// This space intentionally left to be handled in main.ts to avoid circular deps

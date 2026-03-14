/**
 * Authentication and Session Management Service
 */

export interface UserProfile {
    email: string;
    id: string; // derived from email
    lastLogin: number;
}

const SESSION_KEY = 'almoth_auth_session';
const PROFILES_KEY = 'almoth_user_profiles';

export function getCurrentUser(): UserProfile | null {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    try {
        return JSON.parse(session);
    } catch (e) {
        return null;
    }
}

export function login(email: string): UserProfile {
    const id = btoa(email.toLowerCase()).replace(/=/g, '');
    const user: UserProfile = {
        email,
        id,
        lastLogin: Date.now()
    };
    
    // Save session
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    // Update profiles list
    const profiles = getProfiles();
    const existingIndex = profiles.findIndex(p => p.email === email);
    if (existingIndex > -1) {
        profiles[existingIndex] = user;
    } else {
        profiles.push(user);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    
    return user;
}

export function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.hash = '/login';
}

export function getProfiles(): UserProfile[] {
    const profiles = localStorage.getItem(PROFILES_KEY);
    if (!profiles) return [];
    try {
        return JSON.parse(profiles);
    } catch (e) {
        return [];
    }
}

/**
 * Returns a prefix for localStorage keys based on current user
 */
export function getStoragePrefix(): string {
    const user = getCurrentUser();
    return user ? `u_${user.id}_` : 'guest_';
}

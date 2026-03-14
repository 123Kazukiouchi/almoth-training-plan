/**
 * LocalStorage wrapper for per-user data isolation
 */
import { getStoragePrefix } from '../services/authService';

export const storage = {
    setItem(key: string, value: string) {
        const fullKey = getStoragePrefix() + key;
        localStorage.setItem(fullKey, value);
    },
    
    getItem(key: string): string | null {
        const fullKey = getStoragePrefix() + key;
        return localStorage.getItem(fullKey);
    },
    
    removeItem(key: string) {
        const fullKey = getStoragePrefix() + key;
        localStorage.removeItem(fullKey);
    }
};

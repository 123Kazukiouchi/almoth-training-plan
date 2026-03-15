import { getStoragePrefixSync, getCurrentUser } from '../services/authService';
import { supabase } from './supabaseClient';

export const storage = {
    setItem(key: string, value: string) {
        const prefix = getStoragePrefixSync();
        const fullKey = prefix + key;
        localStorage.setItem(fullKey, value);
        
        // Background sync to Supabase
        storage.pushToCloud(key, value);
    },
    
    getItem(key: string): string | null {
        const prefix = getStoragePrefixSync();
        const fullKey = prefix + key;
        return localStorage.getItem(fullKey);
    },
    
    removeItem(key: string) {
        const prefix = getStoragePrefixSync();
        const fullKey = prefix + key;
        localStorage.removeItem(fullKey);
        
        // Background remove from Supabase
        storage.removeFromCloud(key);
    },

    async pushToCloud(key: string, value: string) {
        const user = await getCurrentUser();
        if (!user) return;

        try {
            // Attempt parse to store as JSONB if valid JSON
            let jsonValue;
            try { jsonValue = JSON.parse(value); } catch { jsonValue = value; }

            await supabase
                .from('user_settings')
                .upsert({ 
                    user_id: user.id, 
                    key: key, 
                    value: jsonValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,key' });
        } catch (e) {
            console.error('Supabase sync error:', e);
        }
    },

    async removeFromCloud(key: string) {
        const user = await getCurrentUser();
        if (!user) return;

        await supabase
            .from('user_settings')
            .delete()
            .match({ user_id: user.id, key: key });
    },

    /**
     * Pulls all data for the current user from Supabase and overwrites local storage
     */
    async pullAll(): Promise<{ success: boolean; error?: any }> {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: 'User not logged in' };

        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('key, value')
                .eq('user_id', user.id);

            if (error) throw error;

            if (data) {
                const prefix = getStoragePrefixSync();
                data.forEach((item: any) => {
                    const val = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
                    localStorage.setItem(prefix + item.key, val);
                });
            }
            return { success: true };
        } catch (e) {
            console.error('Error pulling from Supabase:', e);
            return { success: false, error: e };
        }
    },

    /**
     * Migrates data from guest_ prefix to current user's prefix
     */
    async migrateGuestToUser() {
        const user = await getCurrentUser();
        if (!user) return;

        console.log('Migrating guest data to user:', user.id);
        const userPrefix = `u_${user.id}_`;
        const guestPrefix = 'guest_';

        for (let i = 0; i < localStorage.length; i++) {
            const fullKey = localStorage.key(i);
            if (fullKey && fullKey.startsWith(guestPrefix)) {
                const key = fullKey.substring(guestPrefix.length);
                const value = localStorage.getItem(fullKey);
                if (value) {
                    // Save to user storage
                    localStorage.setItem(userPrefix + key, value);
                    // Push to cloud
                    await storage.pushToCloud(key, value);
                    // Note: We keep guest data until logout or explicit cleanup
                }
            }
        }
    }
};

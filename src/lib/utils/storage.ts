/**
 * Safe storage utilities that work in both browser and server environments
 */

/**
 * Check if we're in a browser environment
 */
export const isBrowser = (): boolean => {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

/**
 * Safe localStorage wrapper that handles server-side rendering
 */
export const safeLocalStorage = {
    /**
     * Get item from localStorage
     */
    getItem: (key: string): string | null => {
        if (!isBrowser()) {
            return null;
        }
        
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.warn(`Failed to get item from localStorage: ${key}`, error);
            return null;
        }
    },

    /**
     * Set item in localStorage
     */
    setItem: (key: string, value: string): boolean => {
        if (!isBrowser()) {
            return false;
        }
        
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn(`Failed to set item in localStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     */
    removeItem: (key: string): boolean => {
        if (!isBrowser()) {
            return false;
        }
        
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove item from localStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Clear all localStorage
     */
    clear: (): boolean => {
        if (!isBrowser()) {
            return false;
        }
        
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.warn('Failed to clear localStorage', error);
            return false;
        }
    },

    /**
     * Get all keys from localStorage
     */
    getAllKeys: (): string[] => {
        if (!isBrowser()) {
            return [];
        }
        
        try {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    keys.push(key);
                }
            }
            return keys;
        } catch (error) {
            console.warn('Failed to get keys from localStorage', error);
            return [];
        }
    },

    /**
     * Get storage size in bytes (approximate)
     */
    getStorageSize: (): number => {
        if (!isBrowser()) {
            return 0;
        }
        
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        total += key.length + value.length;
                    }
                }
            }
            return total;
        } catch (error) {
            console.warn('Failed to calculate localStorage size', error);
            return 0;
        }
    }
};

/**
 * Safe sessionStorage wrapper that handles server-side rendering
 */
export const safeSessionStorage = {
    /**
     * Get item from sessionStorage
     */
    getItem: (key: string): string | null => {
        if (!isBrowser() || typeof window.sessionStorage === 'undefined') {
            return null;
        }
        
        try {
            return sessionStorage.getItem(key);
        } catch (error) {
            console.warn(`Failed to get item from sessionStorage: ${key}`, error);
            return null;
        }
    },

    /**
     * Set item in sessionStorage
     */
    setItem: (key: string, value: string): boolean => {
        if (!isBrowser() || typeof window.sessionStorage === 'undefined') {
            return false;
        }
        
        try {
            sessionStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.warn(`Failed to set item in sessionStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Remove item from sessionStorage
     */
    removeItem: (key: string): boolean => {
        if (!isBrowser() || typeof window.sessionStorage === 'undefined') {
            return false;
        }
        
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove item from sessionStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Clear all sessionStorage
     */
    clear: (): boolean => {
        if (!isBrowser() || typeof window.sessionStorage === 'undefined') {
            return false;
        }
        
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.warn('Failed to clear sessionStorage', error);
            return false;
        }
    }
};

/**
 * JSON storage utilities with safe parsing
 */
export const jsonStorage = {
    /**
     * Get and parse JSON from localStorage
     */
    getItem: <T = any>(key: string, defaultValue?: T): T | null => {
        const item = safeLocalStorage.getItem(key);
        if (!item) {
            return defaultValue ?? null;
        }
        
        try {
            return JSON.parse(item) as T;
        } catch (error) {
            console.warn(`Failed to parse JSON from localStorage: ${key}`, error);
            return defaultValue ?? null;
        }
    },

    /**
     * Stringify and set JSON in localStorage
     */
    setItem: <T = any>(key: string, value: T): boolean => {
        try {
            const serialized = JSON.stringify(value);
            return safeLocalStorage.setItem(key, serialized);
        } catch (error) {
            console.warn(`Failed to stringify JSON for localStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     */
    removeItem: (key: string): boolean => {
        return safeLocalStorage.removeItem(key);
    }
};

/**
 * Session JSON storage utilities
 */
export const sessionJsonStorage = {
    /**
     * Get and parse JSON from sessionStorage
     */
    getItem: <T = any>(key: string, defaultValue?: T): T | null => {
        const item = safeSessionStorage.getItem(key);
        if (!item) {
            return defaultValue ?? null;
        }
        
        try {
            return JSON.parse(item) as T;
        } catch (error) {
            console.warn(`Failed to parse JSON from sessionStorage: ${key}`, error);
            return defaultValue ?? null;
        }
    },

    /**
     * Stringify and set JSON in sessionStorage
     */
    setItem: <T = any>(key: string, value: T): boolean => {
        try {
            const serialized = JSON.stringify(value);
            return safeSessionStorage.setItem(key, serialized);
        } catch (error) {
            console.warn(`Failed to stringify JSON for sessionStorage: ${key}`, error);
            return false;
        }
    },

    /**
     * Remove item from sessionStorage
     */
    removeItem: (key: string): boolean => {
        return safeSessionStorage.removeItem(key);
    }
};

/**
 * Intelligent caching utilities for user preferences and settings
 * Implements multi-level caching with TTL and invalidation strategies
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    version: string;
}

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    version?: string; // Cache version for invalidation
    serialize?: boolean; // Whether to serialize data for storage
    storage?: 'memory' | 'localStorage' | 'sessionStorage';
}

/**
 * Multi-level cache implementation
 */
export class SettingsCache {
    private memoryCache = new Map<string, CacheEntry<any>>();
    private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
    private readonly maxMemoryEntries = 100;

    /**
     * Get cached data
     */
    get<T>(key: string, options: CacheOptions = {}): T | null {
        const { storage = 'memory' } = options;

        // Try memory cache first
        const memoryEntry = this.memoryCache.get(key);
        if (memoryEntry && this.isValidEntry(memoryEntry)) {
            return memoryEntry.data;
        }

        // Try persistent storage
        if (storage !== 'memory' && typeof window !== 'undefined') {
            const storageEntry = this.getFromStorage(key, storage);
            if (storageEntry && this.isValidEntry(storageEntry)) {
                // Promote to memory cache
                this.memoryCache.set(key, storageEntry);
                return storageEntry.data;
            }
        }

        return null;
    }

    /**
     * Set cached data
     */
    set<T>(key: string, data: T, options: CacheOptions = {}): void {
        const {
            ttl = this.defaultTTL,
            version = '1.0',
            serialize = true,
            storage = 'memory',
        } = options;

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            version,
        };

        // Set in memory cache
        this.memoryCache.set(key, entry);
        this.enforceMemoryLimit();

        // Set in persistent storage if requested
        if (storage !== 'memory' && typeof window !== 'undefined') {
            this.setInStorage(key, entry, storage, serialize);
        }
    }

    /**
     * Invalidate cached data
     */
    invalidate(key: string): void {
        this.memoryCache.delete(key);

        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(this.getStorageKey(key));
                sessionStorage.removeItem(this.getStorageKey(key));
            } catch (error) {
                console.warn('Failed to invalidate storage cache:', error);
            }
        }
    }

    /**
     * Invalidate all cached data
     */
    invalidateAll(): void {
        this.memoryCache.clear();

        if (typeof window !== 'undefined') {
            try {
                const prefix = this.getStorageKey('');

                // Clear localStorage entries
                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith(prefix)) {
                        localStorage.removeItem(key);
                    }
                });

                // Clear sessionStorage entries
                Object.keys(sessionStorage).forEach((key) => {
                    if (key.startsWith(prefix)) {
                        sessionStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.warn('Failed to invalidate all storage cache:', error);
            }
        }
    }

    /**
     * Invalidate by version
     */
    invalidateByVersion(version: string): void {
        // Memory cache
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.version !== version) {
                this.memoryCache.delete(key);
            }
        }

        // Storage cache
        if (typeof window !== 'undefined') {
            this.cleanStorageByVersion(localStorage, version);
            this.cleanStorageByVersion(sessionStorage, version);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        memoryEntries: number;
        memorySize: number;
        hitRate: number;
    } {
        return {
            memoryEntries: this.memoryCache.size,
            memorySize: this.estimateMemorySize(),
            hitRate: this.calculateHitRate(),
        };
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): void {
        const now = Date.now();

        // Cleanup memory cache
        for (const [key, entry] of this.memoryCache.entries()) {
            if (now > entry.timestamp + entry.ttl) {
                this.memoryCache.delete(key);
            }
        }

        // Cleanup storage cache
        if (typeof window !== 'undefined') {
            this.cleanupStorage(localStorage);
            this.cleanupStorage(sessionStorage);
        }
    }

    private isValidEntry<T>(entry: CacheEntry<T>): boolean {
        const now = Date.now();
        return now <= entry.timestamp + entry.ttl;
    }

    private getFromStorage(
        key: string,
        storage: 'localStorage' | 'sessionStorage'
    ): CacheEntry<any> | null {
        try {
            const storageObj =
                storage === 'localStorage' ? localStorage : sessionStorage;
            const item = storageObj.getItem(this.getStorageKey(key));

            if (item) {
                return JSON.parse(item);
            }
        } catch (error) {
            console.warn('Failed to get from storage cache:', error);
        }

        return null;
    }

    private setInStorage<T>(
        key: string,
        entry: CacheEntry<T>,
        storage: 'localStorage' | 'sessionStorage',
        serialize: boolean
    ): void {
        try {
            const storageObj =
                storage === 'localStorage' ? localStorage : sessionStorage;
            const data = serialize ? JSON.stringify(entry) : entry;
            storageObj.setItem(this.getStorageKey(key), JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to set storage cache:', error);
        }
    }

    private getStorageKey(key: string): string {
        return `revlr_settings_cache_${key}`;
    }

    private enforceMemoryLimit(): void {
        if (this.memoryCache.size > this.maxMemoryEntries) {
            // Remove oldest entries
            const entries = Array.from(this.memoryCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toRemove = entries.slice(
                0,
                this.memoryCache.size - this.maxMemoryEntries
            );
            toRemove.forEach(([key]) => this.memoryCache.delete(key));
        }
    }

    private cleanStorageByVersion(
        storage: Storage,
        currentVersion: string
    ): void {
        try {
            const prefix = this.getStorageKey('');
            const keysToRemove: string[] = [];

            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        const entry = JSON.parse(storage.getItem(key) || '{}');
                        if (entry.version !== currentVersion) {
                            keysToRemove.push(key);
                        }
                    } catch {
                        // Invalid entry, remove it
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach((key) => storage.removeItem(key));
        } catch (error) {
            console.warn('Failed to clean storage by version:', error);
        }
    }

    private cleanupStorage(storage: Storage): void {
        try {
            const prefix = this.getStorageKey('');
            const now = Date.now();
            const keysToRemove: string[] = [];

            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        const entry = JSON.parse(storage.getItem(key) || '{}');
                        if (now > entry.timestamp + entry.ttl) {
                            keysToRemove.push(key);
                        }
                    } catch {
                        // Invalid entry, remove it
                        keysToRemove.push(key);
                    }
                }
            }

            keysToRemove.forEach((key) => storage.removeItem(key));
        } catch (error) {
            console.warn('Failed to cleanup storage:', error);
        }
    }

    private estimateMemorySize(): number {
        let size = 0;
        for (const entry of this.memoryCache.values()) {
            size += JSON.stringify(entry).length * 2; // Rough estimate
        }
        return size;
    }

    private calculateHitRate(): number {
        // This would need to be implemented with actual hit/miss tracking
        return 0.85; // Placeholder
    }
}

/**
 * Singleton cache instance
 */
export const settingsCache = new SettingsCache();

/**
 * Cache keys for different settings types
 */
export const CacheKeys = {
    USER_PROFILE: 'user_profile',
    NOTIFICATION_PREFERENCES: 'notification_preferences',
    INTERFACE_PREFERENCES: 'interface_preferences',
    SECURITY_SETTINGS: 'security_settings',
    MEDIA_PROVIDERS: 'media_providers',
    BILLING_INFO: 'billing_info',
    EXPORT_HISTORY: 'export_history',
    AUDIT_LOG: 'audit_log',
} as const;

/**
 * Cache TTL configurations
 */
export const CacheTTL = {
    SHORT: 1 * 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
    VERY_LONG: 2 * 60 * 60 * 1000, // 2 hours
} as const;

/**
 * Initialize cache cleanup
 */
export const initializeCacheCleanup = (): void => {
    if (typeof window !== 'undefined') {
        // Cleanup on page load
        settingsCache.cleanup();

        // Periodic cleanup
        setInterval(
            () => {
                settingsCache.cleanup();
            },
            5 * 60 * 1000
        ); // Every 5 minutes

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            settingsCache.cleanup();
        });
    }
};

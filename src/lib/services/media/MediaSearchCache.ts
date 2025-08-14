import { MediaSearchResult, CachedResult } from '@/types/media-search';

export class MediaSearchCache {
    private cache = new Map<string, CachedResult>();
    private readonly maxCacheSize: number;
    private readonly cacheExpiry: number; // in milliseconds
    private accessOrder: string[] = []; // For LRU tracking

    constructor(maxCacheSize: number = 1000, cacheExpiryMinutes: number = 30) {
        this.maxCacheSize = maxCacheSize;
        this.cacheExpiry = cacheExpiryMinutes * 60 * 1000;
    }

    /**
     * Generate cache key from query parameters
     */
    private generateCacheKey(
        query: string,
        filters?: any,
        providers?: string[]
    ): string {
        const normalizedQuery = query.toLowerCase().trim();
        const filtersStr = filters ? JSON.stringify(filters) : '';
        const providersStr = providers ? providers.sort().join(',') : '';

        return `${normalizedQuery}|${filtersStr}|${providersStr}`;
    }

    /**
     * Set cache entry with LRU eviction
     */
    set(
        query: string,
        result: MediaSearchResult,
        filters?: any,
        providers?: string[]
    ): void {
        const key = this.generateCacheKey(query, filters, providers);

        // Remove existing entry if it exists (for LRU reordering)
        if (this.cache.has(key)) {
            this.removeFromAccessOrder(key);
        }

        // Evict least recently used entries if cache is full
        while (this.cache.size >= this.maxCacheSize) {
            this.evictLRU();
        }

        const cachedResult: CachedResult = {
            result,
            timestamp: Date.now(),
            accessCount: 0,
            query: query.toLowerCase().trim(),
        };

        this.cache.set(key, cachedResult);
        this.accessOrder.push(key); // Most recently used goes to end
    }

    /**
     * Get cache entry and update access tracking
     */
    get(
        query: string,
        filters?: any,
        providers?: string[]
    ): MediaSearchResult | null {
        const key = this.generateCacheKey(query, filters, providers);
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            return null;
        }

        // Update access tracking
        cached.accessCount++;
        this.updateAccessOrder(key);

        return cached.result;
    }

    /**
     * Check if query exists in cache (without updating access)
     */
    has(query: string, filters?: any, providers?: string[]): boolean {
        const key = this.generateCacheKey(query, filters, providers);
        const cached = this.cache.get(key);

        if (!cached) {
            return false;
        }

        // Check expiry
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            return false;
        }

        return true;
    }

    /**
     * Remove entry from cache
     */
    delete(query: string, filters?: any, providers?: string[]): boolean {
        const key = this.generateCacheKey(query, filters, providers);
        const deleted = this.cache.delete(key);

        if (deleted) {
            this.removeFromAccessOrder(key);
        }

        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        mostPopularQueries: Array<{ query: string; accessCount: number }>;
    } {
        const entries = Array.from(this.cache.values());
        const totalAccesses = entries.reduce(
            (sum, entry) => sum + entry.accessCount,
            0
        );
        const totalEntries = entries.length;

        // Calculate hit rate (approximation based on access counts)
        const hitRate =
            totalEntries > 0
                ? totalAccesses / (totalAccesses + totalEntries)
                : 0;

        // Get most popular queries
        const mostPopularQueries = entries
            .filter((entry) => entry.accessCount > 0)
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 10)
            .map((entry) => ({
                query: entry.query,
                accessCount: entry.accessCount,
            }));

        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: Math.round(hitRate * 100) / 100,
            mostPopularQueries,
        };
    }

    /**
     * Preload popular searches
     */
    async preloadPopularSearches(
        searchFunction: (query: string) => Promise<MediaSearchResult>
    ): Promise<void> {
        const popularQueries = [
            'conference',
            'business meeting',
            'technology',
            'music concert',
            'food festival',
            'sports event',
            'education workshop',
            'networking event',
            'celebration party',
            'corporate event',
            'seminar',
            'exhibition',
            'trade show',
            'product launch',
            'team building',
        ];

        const preloadPromises = popularQueries.map(async (query) => {
            try {
                // Only preload if not already cached
                if (!this.has(query)) {
                    const result = await searchFunction(query);
                    this.set(query, result);
                }
            } catch (error) {
                console.warn(`Failed to preload search for "${query}":`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Clean up expired entries
     */
    cleanupExpired(): number {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        if (this.accessOrder.length === 0) {
            return;
        }

        const lruKey = this.accessOrder.shift(); // Remove first (least recently used)
        if (lruKey) {
            this.cache.delete(lruKey);
        }
    }

    /**
     * Update access order for LRU tracking
     */
    private updateAccessOrder(key: string): void {
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key); // Move to end (most recently used)
    }

    /**
     * Remove key from access order array
     */
    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Get cache entries sorted by access frequency
     */
    getPopularEntries(
        limit: number = 10
    ): Array<{ query: string; accessCount: number; timestamp: number }> {
        return Array.from(this.cache.values())
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit)
            .map((entry) => ({
                query: entry.query,
                accessCount: entry.accessCount,
                timestamp: entry.timestamp,
            }));
    }

    /**
     * Warm cache with specific queries
     */
    async warmCache(
        queries: string[],
        searchFunction: (query: string) => Promise<MediaSearchResult>
    ): Promise<void> {
        const warmupPromises = queries.map(async (query) => {
            try {
                if (!this.has(query)) {
                    const result = await searchFunction(query);
                    this.set(query, result);
                }
            } catch (error) {
                console.warn(`Failed to warm cache for "${query}":`, error);
            }
        });

        await Promise.allSettled(warmupPromises);
    }
}

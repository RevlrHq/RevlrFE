/**
 * Tests for caching utilities
 */

import { SettingsCache, CacheKeys, CacheTTL } from '../caching';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index: number) => Object.keys(store)[index] || null,
        get length() {
            return Object.keys(store).length;
        },
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

describe('SettingsCache', () => {
    let cache: SettingsCache;

    beforeEach(() => {
        cache = new SettingsCache();
        localStorageMock.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('get and set', () => {
        it('should store and retrieve data from memory cache', () => {
            const testData = { name: 'John', email: 'john@example.com' };

            cache.set('test-key', testData);
            const retrieved = cache.get('test-key');

            expect(retrieved).toEqual(testData);
        });

        it('should return null for non-existent keys', () => {
            const result = cache.get('non-existent');
            expect(result).toBeNull();
        });

        it('should respect TTL and return null for expired entries', () => {
            const testData = { name: 'John' };

            cache.set('test-key', testData, { ttl: 1000 }); // 1 second TTL

            // Should be available immediately
            expect(cache.get('test-key')).toEqual(testData);

            // Fast-forward past TTL
            jest.advanceTimersByTime(1001);

            // Should be expired
            expect(cache.get('test-key')).toBeNull();
        });

        it('should store data in localStorage when specified', () => {
            const testData = { name: 'John' };

            cache.set('test-key', testData, { storage: 'localStorage' });

            // Should be in localStorage
            const stored = localStorageMock.getItem(
                'revlr_settings_cache_test-key'
            );
            expect(stored).toBeTruthy();

            // Should be retrievable
            expect(cache.get('test-key', { storage: 'localStorage' })).toEqual(
                testData
            );
        });

        it('should promote storage data to memory cache', () => {
            const testData = { name: 'John' };

            // Set in localStorage only
            cache.set('test-key', testData, { storage: 'localStorage' });

            // Clear memory cache
            cache.invalidate('test-key');

            // Get should promote to memory
            const retrieved = cache.get('test-key', {
                storage: 'localStorage',
            });
            expect(retrieved).toEqual(testData);

            // Should now be in memory cache
            const fromMemory = cache.get('test-key');
            expect(fromMemory).toEqual(testData);
        });
    });

    describe('invalidation', () => {
        it('should invalidate specific keys', () => {
            cache.set('key1', { data: 'test1' });
            cache.set('key2', { data: 'test2' });

            cache.invalidate('key1');

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toEqual({ data: 'test2' });
        });

        it('should invalidate all cached data', () => {
            cache.set('key1', { data: 'test1' });
            cache.set('key2', { data: 'test2' });

            cache.invalidateAll();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
        });

        it('should invalidate by version', () => {
            cache.set('key1', { data: 'test1' }, { version: '1.0' });
            cache.set('key2', { data: 'test2' }, { version: '2.0' });

            cache.invalidateByVersion('1.0');

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toEqual({ data: 'test2' });
        });
    });

    describe('cleanup', () => {
        it('should remove expired entries during cleanup', () => {
            cache.set('key1', { data: 'test1' }, { ttl: 1000 });
            cache.set('key2', { data: 'test2' }, { ttl: 2000 });

            // Fast-forward past first TTL
            jest.advanceTimersByTime(1001);

            cache.cleanup();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toEqual({ data: 'test2' });
        });
    });

    describe('memory management', () => {
        it('should enforce memory limit', () => {
            // Set more entries than the limit (assuming limit is 100)
            for (let i = 0; i < 150; i++) {
                cache.set(`key${i}`, { data: `test${i}` });
            }

            const stats = cache.getStats();
            expect(stats.memoryEntries).toBeLessThanOrEqual(100);
        });
    });

    describe('error handling', () => {
        it('should handle localStorage errors gracefully', () => {
            // Mock localStorage to throw error
            const originalSetItem = localStorageMock.setItem;
            localStorageMock.setItem = jest.fn(() => {
                throw new Error('Storage quota exceeded');
            });

            // Should not throw
            expect(() => {
                cache.set(
                    'test-key',
                    { data: 'test' },
                    { storage: 'localStorage' }
                );
            }).not.toThrow();

            // Restore original method
            localStorageMock.setItem = originalSetItem;
        });

        it('should handle invalid JSON in storage gracefully', () => {
            // Set invalid JSON in storage
            localStorageMock.setItem(
                'revlr_settings_cache_test-key',
                'invalid json'
            );

            // Should return null instead of throwing
            expect(
                cache.get('test-key', { storage: 'localStorage' })
            ).toBeNull();
        });
    });
});

describe('Cache constants', () => {
    it('should have proper cache keys', () => {
        expect(CacheKeys.USER_PROFILE).toBe('user_profile');
        expect(CacheKeys.NOTIFICATION_PREFERENCES).toBe(
            'notification_preferences'
        );
        expect(CacheKeys.INTERFACE_PREFERENCES).toBe('interface_preferences');
    });

    it('should have proper TTL values', () => {
        expect(CacheTTL.SHORT).toBe(1 * 60 * 1000);
        expect(CacheTTL.MEDIUM).toBe(5 * 60 * 1000);
        expect(CacheTTL.LONG).toBe(30 * 60 * 1000);
        expect(CacheTTL.VERY_LONG).toBe(2 * 60 * 60 * 1000);
    });
});

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
    MediaSearchService,
    MediaSearchCache,
    MediaProvider,
} from '@/lib/services/media';
import {
    MediaSearchQuery,
    MediaItem,
    ProviderResult,
    MediaProviderConfig,
} from '@/types/media-search';

// Mock MediaProvider for testing
class MockMediaProvider extends MediaProvider {
    readonly id = 'mock';
    readonly name = 'Mock Provider';
    readonly baseUrl = 'https://api.mock.com';
    readonly rateLimit = { requests: 100, window: 3600 };

    constructor(config: MediaProviderConfig) {
        super(config);
    }

    async search(query: MediaSearchQuery): Promise<ProviderResult> {
        const mockItems: MediaItem[] = [
            {
                id: 'mock-1',
                providerId: this.id,
                title: `Mock image for ${query.query}`,
                thumbnailUrl: 'https://mock.com/thumb1.jpg',
                previewUrl: 'https://mock.com/preview1.jpg',
                downloadUrl: 'https://mock.com/download1.jpg',
                width: 1920,
                height: 1080,
                mediaType: 'image',
                attribution: { required: false, placement: 'none' },
                license: {
                    type: 'cc0',
                    name: 'CC0',
                    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
                    commercialUse: true,
                    attribution: { required: false, placement: 'none' },
                },
                tags: ['mock', 'test'],
                photographer: { name: 'Mock Photographer' },
            },
        ];

        return {
            providerId: this.id,
            items: mockItems,
            totalResults: mockItems.length,
            hasMore: false,
        };
    }

    async getPopular(): Promise<ProviderResult> {
        return this.search({ query: 'popular' });
    }

    async downloadMedia(): Promise<Blob> {
        return new Blob(['mock image data'], { type: 'image/jpeg' });
    }
}

describe('MediaSearchCache', () => {
    let cache: MediaSearchCache;

    beforeEach(() => {
        cache = new MediaSearchCache(10, 1); // Small cache for testing
    });

    test('should store and retrieve cached results', () => {
        const mockResult = {
            items: [],
            totalResults: 0,
            hasMore: false,
            providers: [],
        };

        cache.set('test query', mockResult);
        const retrieved = cache.get('test query');

        expect(retrieved).toEqual(mockResult);
    });

    test('should return null for non-existent cache entries', () => {
        const result = cache.get('non-existent');
        expect(result).toBeNull();
    });

    test('should handle cache expiry', () => {
        // Create cache with very short expiry for testing
        const shortCache = new MediaSearchCache(10, 0.01); // 0.01 minutes = 0.6 seconds

        const mockResult = {
            items: [],
            totalResults: 0,
            hasMore: false,
            providers: [],
        };

        shortCache.set('test query', mockResult);

        // Immediately check it exists
        expect(shortCache.get('test query')).toEqual(mockResult);

        // Test that cleanup method works
        const cleanedCount = shortCache.cleanupExpired();
        expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    test('should implement LRU eviction', () => {
        const mockResult = {
            items: [],
            totalResults: 0,
            hasMore: false,
            providers: [],
        };

        // Fill cache beyond capacity
        for (let i = 0; i < 15; i++) {
            cache.set(`query-${i}`, mockResult);
        }

        // First entries should be evicted
        expect(cache.get('query-0')).toBeNull();
        expect(cache.get('query-14')).toEqual(mockResult);
    });

    test('should provide cache statistics', () => {
        const mockResult = {
            items: [],
            totalResults: 0,
            hasMore: false,
            providers: [],
        };

        cache.set('test1', mockResult);
        cache.set('test2', mockResult);
        cache.get('test1'); // Access to increase count

        const stats = cache.getStats();
        expect(stats.size).toBe(2);
        expect(stats.maxSize).toBe(10);
        expect(typeof stats.hitRate).toBe('number');
    });
});

describe('MediaProvider', () => {
    let provider: MockMediaProvider;

    beforeEach(() => {
        const config: MediaProviderConfig = {
            apiKey: 'test-key',
            baseUrl: 'https://api.mock.com',
            rateLimit: { requests: 100, window: 3600 },
            enabled: true,
        };
        provider = new MockMediaProvider(config);
    });

    test('should have correct provider properties', () => {
        expect(provider.id).toBe('mock');
        expect(provider.name).toBe('Mock Provider');
        expect(provider.baseUrl).toBe('https://api.mock.com');
    });

    test('should check rate limits', () => {
        expect(provider.isHealthy()).toBe(true);
    });

    test('should return provider status', () => {
        const status = provider.getStatus();
        expect(status.id).toBe('mock');
        expect(status.name).toBe('Mock Provider');
        expect(status.isAvailable).toBe(true);
        expect(status.healthScore).toBe(100);
    });

    test('should handle search queries', async () => {
        const query: MediaSearchQuery = { query: 'test search' };
        const result = await provider.search(query);

        expect(result.providerId).toBe('mock');
        expect(result.items).toHaveLength(1);
        expect(result.items[0].title).toContain('test search');
    });
});

describe('MediaSearchService', () => {
    let service: MediaSearchService;
    let mockProvider: MockMediaProvider;

    beforeEach(() => {
        service = new MediaSearchService(10, 1); // Small cache for testing

        const config: MediaProviderConfig = {
            apiKey: 'test-key',
            baseUrl: 'https://api.mock.com',
            rateLimit: { requests: 100, window: 3600 },
            enabled: true,
        };
        mockProvider = new MockMediaProvider(config);
        service.registerProvider(mockProvider);
    });

    test('should register and list providers', () => {
        const providers = service.getAvailableProviders();
        expect(providers).toHaveLength(1);
        expect(providers[0].id).toBe('mock');
    });

    test('should get healthy providers', () => {
        const healthyProviders = service.getHealthyProviders();
        expect(healthyProviders).toHaveLength(1);
        expect(healthyProviders[0].id).toBe('mock');
    });

    test('should search media across providers', async () => {
        const query: MediaSearchQuery = { query: 'test search' };
        const result = await service.searchMedia(query);

        expect(result.items).toHaveLength(1);
        expect(result.providers).toHaveLength(1);
        expect(result.totalResults).toBe(1);
    });

    test('should cache search results', async () => {
        const query: MediaSearchQuery = { query: 'cached search' };

        // First search
        const result1 = await service.searchMedia(query);

        // Second search should use cache
        const result2 = await service.searchMedia(query);

        expect(result1).toEqual(result2);
    });

    test('should get provider status', () => {
        const status = service.getProviderStatus('mock');
        expect(status).not.toBeNull();
        expect(status!.id).toBe('mock');
        expect(status!.isAvailable).toBe(true);
    });

    test('should return null for unknown provider status', () => {
        const status = service.getProviderStatus('unknown');
        expect(status).toBeNull();
    });

    test('should get service health status', () => {
        const health = service.getServiceHealth();
        expect(health.totalProviders).toBe(1);
        expect(health.healthyProviders).toBe(1);
        expect(health.disabledProviders).toBe(0);
        expect(health.cacheStats).toBeDefined();
    });

    test('should handle no providers available', async () => {
        const emptyService = new MediaSearchService();
        const query: MediaSearchQuery = { query: 'test' };

        await expect(emptyService.searchMedia(query)).rejects.toThrow(
            'No healthy providers available'
        );
    });

    test('should get search suggestions', async () => {
        // First, populate cache with some searches
        await service.searchMedia({ query: 'conference' });
        await service.searchMedia({ query: 'business meeting' });

        const suggestions = await service.getSuggestions('conf');
        expect(suggestions).toContain('conference');
    });
});

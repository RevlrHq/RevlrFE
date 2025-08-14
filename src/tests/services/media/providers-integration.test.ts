import {
    createProvider,
    getAvailableProviderIds,
    isProviderSupported,
} from '@/lib/services/media/providers';
import { UnsplashProvider } from '@/lib/services/media/providers/UnsplashProvider';
import { MEDIA_PROVIDER_CONFIGS } from '@/lib/config/media-providers';

describe('Media Providers Integration', () => {
    describe('Provider Factory', () => {
        test('should create UnsplashProvider instance', () => {
            const config = {
                apiKey: 'test-key',
                baseUrl: 'https://api.unsplash.com',
                rateLimit: { requests: 50, window: 3600 },
                enabled: true,
            };

            const provider = createProvider('unsplash', config);

            expect(provider).toBeInstanceOf(UnsplashProvider);
            expect(provider?.id).toBe('unsplash');
            expect(provider?.name).toBe('Unsplash');
        });

        test('should return null for unknown provider', () => {
            const config = {
                apiKey: 'test-key',
                baseUrl: 'https://example.com',
                rateLimit: { requests: 50, window: 3600 },
                enabled: true,
            };

            const provider = createProvider('unknown', config);
            expect(provider).toBeNull();
        });

        test('should get available provider IDs', () => {
            const providerIds = getAvailableProviderIds();
            expect(providerIds).toContain('unsplash');
            expect(providerIds.length).toBeGreaterThan(0);
        });

        test('should check if provider is supported', () => {
            expect(isProviderSupported('unsplash')).toBe(true);
            expect(isProviderSupported('unknown')).toBe(false);
        });
    });

    describe('Configuration Integration', () => {
        test('should have Unsplash configuration', () => {
            expect(MEDIA_PROVIDER_CONFIGS.unsplash).toBeDefined();
            expect(MEDIA_PROVIDER_CONFIGS.unsplash.baseUrl).toBe(
                'https://api.unsplash.com'
            );
            expect(MEDIA_PROVIDER_CONFIGS.unsplash.rateLimit.requests).toBe(50);
        });

        test('should create provider from configuration', () => {
            const config = MEDIA_PROVIDER_CONFIGS.unsplash;

            // Override for testing (in case env var is not set)
            const testConfig = {
                ...config,
                apiKey: 'test-key',
                enabled: true,
            };

            const provider = createProvider('unsplash', testConfig);

            expect(provider).toBeInstanceOf(UnsplashProvider);
            expect(provider?.rateLimit).toEqual(config.rateLimit);
        });
    });

    describe('Provider Interface Compliance', () => {
        test('should implement all required methods', () => {
            const config = {
                apiKey: 'test-key',
                baseUrl: 'https://api.unsplash.com',
                rateLimit: { requests: 50, window: 3600 },
                enabled: true,
            };

            const provider = createProvider('unsplash', config);

            expect(provider).toBeDefined();
            expect(typeof provider?.search).toBe('function');
            expect(typeof provider?.getPopular).toBe('function');
            expect(typeof provider?.downloadMedia).toBe('function');
            expect(typeof provider?.getStatus).toBe('function');
            expect(typeof provider?.isHealthy).toBe('function');
        });

        test('should have correct provider properties', () => {
            const config = {
                apiKey: 'test-key',
                baseUrl: 'https://api.unsplash.com',
                rateLimit: { requests: 50, window: 3600 },
                enabled: true,
            };

            const provider = createProvider('unsplash', config);

            expect(provider?.id).toBe('unsplash');
            expect(provider?.name).toBe('Unsplash');
            expect(provider?.baseUrl).toBe('https://api.unsplash.com');
            expect(provider?.rateLimit).toEqual(config.rateLimit);
        });
    });
});

import { MediaSearchService } from './MediaSearchService';
import { UnsplashProvider } from './providers/UnsplashProvider';
import { PexelsProvider } from './providers/PexelsProvider';
import { MediaProviderConfig } from '@/types/media-search';

/**
 * Factory for creating and configuring MediaSearchService instances
 */
export class MediaSearchServiceFactory {
    private static instance: MediaSearchService | null = null;

    /**
     * Create a new MediaSearchService instance with configured providers
     */
    static create(
        options: {
            cacheSize?: number;
            cacheExpiryMinutes?: number;
            enabledProviders?: string[];
            providerConfigs?: Record<string, MediaProviderConfig>;
        } = {}
    ): MediaSearchService {
        const {
            cacheSize = 1000,
            cacheExpiryMinutes = 30,
            enabledProviders = ['unsplash', 'pexels'],
            providerConfigs = {},
        } = options;

        const service = new MediaSearchService(cacheSize, cacheExpiryMinutes);

        // Default configurations for development/testing
        const defaultConfigs: Record<string, MediaProviderConfig> = {
            unsplash: {
                apiKey:
                    process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || 
                    process.env.UNSPLASH_ACCESS_KEY || 
                    'demo-key',
                secretKey: process.env.UNSPLASH_SECRET_KEY,
                baseUrl: 'https://api.unsplash.com',
                rateLimit: { requests: 50, window: 3600 },
                enabled: true,
                oauth: process.env.UNSPLASH_SECRET_KEY ? {
                    clientId: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY || '',
                    clientSecret: process.env.UNSPLASH_SECRET_KEY || '',
                    redirectUri: process.env.NEXT_PUBLIC_UNSPLASH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/unsplash/callback`,
                    scopes: ['public', 'read_user', 'write_likes', 'read_collections'],
                } : undefined,
            },
            pexels: {
                apiKey: process.env.NEXT_PUBLIC_PEXELS_API_KEY || 'demo-key',
                baseUrl: 'https://api.pexels.com/v1',
                rateLimit: { requests: 200, window: 3600 },
                enabled: true,
            },
        };

        // Register enabled providers
        enabledProviders.forEach((providerId) => {
            const config =
                providerConfigs[providerId] || defaultConfigs[providerId];

            if (!config) {
                console.warn(
                    `No configuration found for provider: ${providerId}`
                );
                return;
            }

            try {
                let provider;
                switch (providerId) {
                    case 'unsplash':
                        provider = new UnsplashProvider(config);
                        break;
                    case 'pexels':
                        provider = new PexelsProvider(config);
                        break;
                    default:
                        console.warn(`Unknown provider: ${providerId}`);
                        return;
                }

                service.registerProvider(provider);
                console.log(`Registered ${providerId} provider`);
            } catch (error) {
                console.warn(
                    `Failed to register ${providerId} provider:`,
                    error
                );
            }
        });

        return service;
    }

    /**
     * Get or create a singleton instance
     */
    static getInstance(
        options?: Parameters<typeof MediaSearchServiceFactory.create>[0]
    ): MediaSearchService {
        if (!this.instance) {
            this.instance = this.create(options);
        }
        return this.instance;
    }

    /**
     * Reset the singleton instance (useful for testing)
     */
    static resetInstance(): void {
        this.instance = null;
    }

    /**
     * Create a service with mock providers for testing
     */
    static createMock(): MediaSearchService {
        const service = new MediaSearchService(100, 5); // Small cache for testing

        // Create mock providers
        const mockUnsplashProvider = {
            id: 'unsplash',
            name: 'Unsplash (Mock)',
            getStatus: () => ({
                id: 'unsplash',
                name: 'Unsplash (Mock)',
                isAvailable: true,
                rateLimit: { requests: 50, window: 3600, remaining: 50 },
                healthScore: 100,
            }),
            isHealthy: () => true,
            search: jest.fn().mockResolvedValue({
                providerId: 'unsplash',
                items: [
                    {
                        id: 'mock-1',
                        providerId: 'unsplash',
                        title: 'Mock Unsplash Image',
                        thumbnailUrl: 'https://via.placeholder.com/300x200',
                        previewUrl: 'https://via.placeholder.com/800x600',
                        downloadUrl: 'https://via.placeholder.com/1920x1080',
                        width: 1920,
                        height: 1080,
                        mediaType: 'image' as const,
                        attribution: {
                            required: true,
                            text: 'Mock attribution',
                            placement: 'image-caption' as const,
                        },
                        license: {
                            type: 'unsplash' as const,
                            name: 'Unsplash License',
                            url: 'https://unsplash.com/license',
                            commercialUse: true,
                            attribution: {
                                required: true,
                                text: 'Mock attribution',
                                placement: 'image-caption' as const,
                            },
                        },
                        tags: ['mock', 'test'],
                    },
                ],
                totalResults: 1,
                hasMore: false,
            }),
            getPopular: jest.fn().mockResolvedValue({
                providerId: 'unsplash',
                items: [],
                totalResults: 0,
                hasMore: false,
            }),
            downloadMedia: jest.fn().mockResolvedValue(new Blob()),
        };

        const mockPexelsProvider = {
            id: 'pexels',
            name: 'Pexels (Mock)',
            getStatus: () => ({
                id: 'pexels',
                name: 'Pexels (Mock)',
                isAvailable: true,
                rateLimit: { requests: 200, window: 3600, remaining: 200 },
                healthScore: 100,
            }),
            isHealthy: () => true,
            search: jest.fn().mockResolvedValue({
                providerId: 'pexels',
                items: [
                    {
                        id: 'mock-2',
                        providerId: 'pexels',
                        title: 'Mock Pexels Image',
                        thumbnailUrl: 'https://via.placeholder.com/300x200',
                        previewUrl: 'https://via.placeholder.com/800x600',
                        downloadUrl: 'https://via.placeholder.com/1920x1080',
                        width: 1920,
                        height: 1080,
                        mediaType: 'image' as const,
                        attribution: {
                            required: true,
                            text: 'Mock attribution',
                            placement: 'image-caption' as const,
                        },
                        license: {
                            type: 'pexels' as const,
                            name: 'Pexels License',
                            url: 'https://www.pexels.com/license/',
                            commercialUse: true,
                            attribution: {
                                required: true,
                                text: 'Mock attribution',
                                placement: 'image-caption' as const,
                            },
                        },
                        tags: ['mock', 'test'],
                    },
                ],
                totalResults: 1,
                hasMore: false,
            }),
            getPopular: jest.fn().mockResolvedValue({
                providerId: 'pexels',
                items: [],
                totalResults: 0,
                hasMore: false,
            }),
            downloadMedia: jest.fn().mockResolvedValue(new Blob()),
        };

        // Register mock providers
        service.registerProvider(mockUnsplashProvider as any);
        service.registerProvider(mockPexelsProvider as any);

        return service;
    }
}

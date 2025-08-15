import { MediaSearchService } from './MediaSearchService';
import {
    MediaProviderFactory,
    ProviderConfiguration,
} from './MediaProviderFactory';
import { MediaProviderConfig } from '@/types/media-search';

/**
 * Factory for creating and configuring MediaSearchService instances
 */
export class MediaSearchServiceFactory {
    private static instance: MediaSearchService | null = null;

    /**
     * Create a new MediaSearchService instance with configured providers
     */
    static async create(
        options: {
            cacheSize?: number;
            cacheExpiryMinutes?: number;
            enabledProviders?: string[];
            providerConfigs?: Record<string, MediaProviderConfig>;
        } = {}
    ): Promise<MediaSearchService> {
        const {
            cacheSize = 1000,
            cacheExpiryMinutes = 30,
            enabledProviders = ['unsplash', 'pexels'],
            providerConfigs = {},
        } = options;

        const service = new MediaSearchService(cacheSize, cacheExpiryMinutes);

        // Get the MediaProviderFactory instance
        const providerFactory = service.getProviderFactory();

        // Build provider configuration from environment and options
        const providerConfiguration: ProviderConfiguration = {};

        // Configure Unsplash if enabled
        if (enabledProviders.includes('unsplash')) {
            const unsplashConfig = providerConfigs['unsplash'];
            const apiKey =
                unsplashConfig?.apiKey ||
                process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
                process.env.UNSPLASH_ACCESS_KEY;

            if (apiKey && apiKey !== 'demo-key') {
                providerConfiguration.unsplash = {
                    apiKey,
                    secretKey:
                        unsplashConfig?.secretKey ||
                        process.env.NEXT_PUBLIC_UNSPLASH_SECRET_KEY ||
                        process.env.UNSPLASH_SECRET_KEY,
                    enabled: true,
                    rateLimit: unsplashConfig?.rateLimit || {
                        requests: 50,
                        window: 3600,
                    },
                    oauth: (() => {
                        const clientSecret =
                            process.env.NEXT_PUBLIC_UNSPLASH_SECRET_KEY ||
                            process.env.UNSPLASH_SECRET_KEY;
                        return clientSecret
                            ? {
                                  clientId: apiKey,
                                  clientSecret,
                                  redirectUri:
                                      process.env
                                          .NEXT_PUBLIC_UNSPLASH_REDIRECT_URI ||
                                      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/unsplash/callback`,
                                  scopes: [
                                      'public',
                                      'read_user',
                                      'write_likes',
                                      'read_collections',
                                  ],
                              }
                            : undefined;
                    })(),
                };
            } else {
                console.warn(
                    'Unsplash API key not found or is demo key - provider will be disabled'
                );
            }
        }

        // Configure Pexels if enabled
        if (enabledProviders.includes('pexels')) {
            const pexelsConfig = providerConfigs['pexels'];
            const apiKey =
                pexelsConfig?.apiKey || process.env.NEXT_PUBLIC_PEXELS_API_KEY;

            if (apiKey && apiKey !== 'demo-key') {
                providerConfiguration.pexels = {
                    apiKey,
                    enabled: true,
                    rateLimit: pexelsConfig?.rateLimit || {
                        requests: 200,
                        window: 3600,
                    },
                };
            } else {
                console.warn(
                    'Pexels API key not found or is demo key - provider will be disabled'
                );
            }
        }

        // Configure Pixabay if enabled
        if (enabledProviders.includes('pixabay')) {
            const pixabayConfig = providerConfigs['pixabay'];
            const apiKey =
                pixabayConfig?.apiKey ||
                process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

            if (apiKey && apiKey !== 'demo-key') {
                providerConfiguration.pixabay = {
                    apiKey,
                    enabled: true,
                    rateLimit: pixabayConfig?.rateLimit || {
                        requests: 100,
                        window: 3600,
                    },
                };
            } else {
                console.warn(
                    'Pixabay API key not found or is demo key - provider will be disabled'
                );
            }
        }

        // Initialize the provider factory with the configuration
        try {
            const result = await providerFactory.initialize(
                providerConfiguration
            );

            if (!result.success) {
                console.warn(
                    'Failed to initialize any providers:',
                    result.failedProviders
                );
                if (result.warnings.length > 0) {
                    console.warn('Initialization warnings:', result.warnings);
                }
            } else {
                console.log(
                    `Successfully initialized providers: ${result.initializedProviders.join(', ')}`
                );
                if (result.failedProviders.length > 0) {
                    console.warn(
                        'Some providers failed to initialize:',
                        result.failedProviders
                    );
                }
            }
        } catch (error) {
            console.error('Failed to initialize MediaProviderFactory:', error);
        }

        return service;
    }

    /**
     * Get or create a singleton instance
     */
    static async getInstance(
        options?: Parameters<typeof MediaSearchServiceFactory.create>[0]
    ): Promise<MediaSearchService> {
        if (!this.instance) {
            this.instance = await this.create(options);
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

        // Note: Mock providers would be registered through the MediaProviderFactory
        // For testing purposes, we'll create a basic service without provider initialization

        return service;
    }
}

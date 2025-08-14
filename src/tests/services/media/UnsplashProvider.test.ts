import { UnsplashProvider } from '@/lib/services/media/providers/UnsplashProvider';
import {
    MediaSearchQuery,
    MediaProviderConfig,
    MediaProviderErrorType,
} from '@/types/media-search';

// Mock fetch globally
global.fetch = jest.fn();

describe('UnsplashProvider', () => {
    let provider: UnsplashProvider;
    let mockConfig: MediaProviderConfig;

    beforeEach(() => {
        mockConfig = {
            apiKey: 'test-api-key',
            baseUrl: 'https://api.unsplash.com',
            rateLimit: {
                requests: 50,
                window: 3600,
            },
            enabled: true,
        };

        provider = new UnsplashProvider(mockConfig);
        jest.clearAllMocks();
    });

    describe('Provider Properties', () => {
        test('should have correct provider properties', () => {
            expect(provider.id).toBe('unsplash');
            expect(provider.name).toBe('Unsplash');
            expect(provider.baseUrl).toBe('https://api.unsplash.com');
            expect(provider.rateLimit).toEqual(mockConfig.rateLimit);
        });
    });

    describe('search', () => {
        const mockUnsplashResponse = {
            total: 100,
            total_pages: 5,
            results: [
                {
                    id: 'test-photo-1',
                    created_at: '2023-01-01T00:00:00Z',
                    updated_at: '2023-01-01T00:00:00Z',
                    width: 1920,
                    height: 1080,
                    color: '#FF5733',
                    blur_hash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
                    description: 'A beautiful conference room',
                    alt_description:
                        'Modern conference room with large windows',
                    urls: {
                        raw: 'https://images.unsplash.com/photo-1/raw',
                        full: 'https://images.unsplash.com/photo-1/full',
                        regular: 'https://images.unsplash.com/photo-1/regular',
                        small: 'https://images.unsplash.com/photo-1/small',
                        thumb: 'https://images.unsplash.com/photo-1/thumb',
                    },
                    links: {
                        self: 'https://api.unsplash.com/photos/test-photo-1',
                        html: 'https://unsplash.com/photos/test-photo-1',
                        download:
                            'https://unsplash.com/photos/test-photo-1/download',
                        download_location:
                            'https://api.unsplash.com/photos/test-photo-1/download',
                    },
                    user: {
                        id: 'user-1',
                        username: 'testuser',
                        name: 'Test User',
                        first_name: 'Test',
                        last_name: 'User',
                        twitter_username: null,
                        portfolio_url: null,
                        bio: 'Test photographer',
                        location: 'Test City',
                        links: {
                            self: 'https://api.unsplash.com/users/testuser',
                            html: 'https://unsplash.com/@testuser',
                            photos: 'https://api.unsplash.com/users/testuser/photos',
                            likes: 'https://api.unsplash.com/users/testuser/likes',
                            portfolio:
                                'https://api.unsplash.com/users/testuser/portfolio',
                            following:
                                'https://api.unsplash.com/users/testuser/following',
                            followers:
                                'https://api.unsplash.com/users/testuser/followers',
                        },
                        profile_image: {
                            small: 'https://images.unsplash.com/profile-1/small',
                            medium: 'https://images.unsplash.com/profile-1/medium',
                            large: 'https://images.unsplash.com/profile-1/large',
                        },
                    },
                    tags: [
                        { type: 'search', title: 'conference' },
                        { type: 'search', title: 'meeting' },
                        { type: 'search', title: 'business' },
                    ],
                },
            ],
        };

        test('should search for photos successfully', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockUnsplashResponse,
            });

            const query: MediaSearchQuery = {
                query: 'conference',
                page: 1,
                perPage: 20,
            };

            const result = await provider.search(query);

            expect(result.providerId).toBe('unsplash');
            expect(result.items).toHaveLength(1);
            expect(result.totalResults).toBe(100);
            expect(result.hasMore).toBe(true);
            expect(result.nextPage).toBe(2);

            const item = result.items[0];
            expect(item.id).toBe('test-photo-1');
            expect(item.providerId).toBe('unsplash');
            expect(item.title).toBe('A beautiful conference room');
            expect(item.width).toBe(1920);
            expect(item.height).toBe(1080);
            expect(item.mediaType).toBe('image');
            expect(item.attribution.required).toBe(true);
            expect(item.attribution.text).toBe(
                'Photo by Test User on Unsplash'
            );
            expect(item.license.type).toBe('unsplash');
            expect(item.license.commercialUse).toBe(true);
            expect(item.photographer?.name).toBe('Test User');
            expect(item.tags).toContain('conference');
        });

        test('should handle search with filters', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockUnsplashResponse,
            });

            const query: MediaSearchQuery = {
                query: 'business',
                page: 1,
                perPage: 10,
                filters: {
                    orientation: 'landscape',
                    color: 'blue',
                    category: 'technology',
                },
            };

            await provider.search(query);

            const fetchCall = (fetch as jest.Mock).mock.calls[0];
            const url = fetchCall[0];

            expect(url).toContain('orientation=landscape');
            expect(url).toContain('color=blue');
            expect(url).toContain('business+technology');
        });

        test('should handle API errors gracefully', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Network error occurred')
            );

            const query: MediaSearchQuery = {
                query: 'test',
            };

            const result = await provider.search(query);

            expect(result.providerId).toBe('unsplash');
            expect(result.items).toHaveLength(0);
            expect(result.totalResults).toBe(0);
            expect(result.hasMore).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error?.type).toBe(
                MediaProviderErrorType.SEARCH_FAILED
            );
        });

        test('should include proper authorization header', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockUnsplashResponse,
            });

            const query: MediaSearchQuery = {
                query: 'test',
            };

            await provider.search(query);

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Client-ID test-api-key',
                    }),
                })
            );
        });
    });

    describe('getPopular', () => {
        const mockPopularPhotos = [
            {
                id: 'popular-1',
                created_at: '2023-01-01T00:00:00Z',
                updated_at: '2023-01-01T00:00:00Z',
                width: 1920,
                height: 1080,
                color: '#FF5733',
                blur_hash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
                description: 'Popular business photo',
                alt_description: 'Business meeting in progress',
                urls: {
                    raw: 'https://images.unsplash.com/popular-1/raw',
                    full: 'https://images.unsplash.com/popular-1/full',
                    regular: 'https://images.unsplash.com/popular-1/regular',
                    small: 'https://images.unsplash.com/popular-1/small',
                    thumb: 'https://images.unsplash.com/popular-1/thumb',
                },
                links: {
                    self: 'https://api.unsplash.com/photos/popular-1',
                    html: 'https://unsplash.com/photos/popular-1',
                    download: 'https://unsplash.com/photos/popular-1/download',
                    download_location:
                        'https://api.unsplash.com/photos/popular-1/download',
                },
                user: {
                    id: 'user-2',
                    username: 'popularuser',
                    name: 'Popular User',
                    first_name: 'Popular',
                    last_name: 'User',
                    twitter_username: null,
                    portfolio_url: null,
                    bio: 'Popular photographer',
                    location: 'Popular City',
                    links: {
                        self: 'https://api.unsplash.com/users/popularuser',
                        html: 'https://unsplash.com/@popularuser',
                        photos: 'https://api.unsplash.com/users/popularuser/photos',
                        likes: 'https://api.unsplash.com/users/popularuser/likes',
                        portfolio:
                            'https://api.unsplash.com/users/popularuser/portfolio',
                        following:
                            'https://api.unsplash.com/users/popularuser/following',
                        followers:
                            'https://api.unsplash.com/users/popularuser/followers',
                    },
                    profile_image: {
                        small: 'https://images.unsplash.com/profile-2/small',
                        medium: 'https://images.unsplash.com/profile-2/medium',
                        large: 'https://images.unsplash.com/profile-2/large',
                    },
                },
            },
        ];

        test('should get popular photos without category', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockPopularPhotos,
            });

            const result = await provider.getPopular();

            expect(result.providerId).toBe('unsplash');
            expect(result.items).toHaveLength(1);
            expect(result.hasMore).toBe(false);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/photos?per_page=30&order_by=popular'),
                expect.any(Object)
            );
        });

        test('should get popular photos for specific category', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockPopularPhotos,
            });

            const result = await provider.getPopular('business');

            expect(result.providerId).toBe('unsplash');
            expect(result.items).toHaveLength(1);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/collections/3348849/photos'),
                expect.any(Object)
            );
        });

        test('should handle unknown category gracefully', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockPopularPhotos,
            });

            const result = await provider.getPopular('unknown-category');

            expect(result.providerId).toBe('unsplash');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/photos?per_page=30&order_by=popular'),
                expect.any(Object)
            );
        });
    });

    describe('downloadMedia', () => {
        const mockMediaItem = {
            id: 'test-photo-1',
            providerId: 'unsplash',
            title: 'Test Photo',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
            mediaType: 'image' as const,
            attribution: {
                required: true,
                text: 'Photo by Test User on Unsplash',
                linkUrl: 'https://unsplash.com/photos/test-photo-1',
                placement: 'image-caption' as const,
            },
            license: {
                type: 'unsplash' as const,
                name: 'Unsplash License',
                url: 'https://unsplash.com/license',
                commercialUse: true,
                attribution: {
                    required: true,
                    text: 'Photo by Test User on Unsplash',
                    linkUrl: 'https://unsplash.com/photos/test-photo-1',
                    placement: 'image-caption' as const,
                },
            },
            tags: ['test'],
        };

        test('should download media successfully', async () => {
            const mockBlob = new Blob(['test image data'], {
                type: 'image/jpeg',
            });

            // Mock the download tracking call
            (fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({}),
                })
                // Mock the actual image download
                .mockResolvedValueOnce({
                    ok: true,
                    blob: async () => mockBlob,
                });

            const result = await provider.downloadMedia(mockMediaItem);

            expect(result).toBe(mockBlob);
            expect(fetch).toHaveBeenCalledTimes(2);

            // Check download tracking call
            expect(fetch).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('/photos/test-photo-1/download'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Client-ID test-api-key',
                    }),
                })
            );

            // Check actual download call
            expect(fetch).toHaveBeenNthCalledWith(
                2,
                'https://example.com/download.jpg',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'User-Agent': 'REVLR-Event-Platform/1.0',
                    }),
                })
            );
        });

        test('should continue download even if tracking fails', async () => {
            const mockBlob = new Blob(['test image data'], {
                type: 'image/jpeg',
            });

            // Mock failed tracking but successful download
            (fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    blob: async () => mockBlob,
                });

            const result = await provider.downloadMedia(mockMediaItem);

            expect(result).toBe(mockBlob);
        });
    });

    describe('Helper Methods', () => {
        test('should get category suggestions', () => {
            const suggestions = provider.getCategorySuggestions();

            expect(suggestions).toContain('business');
            expect(suggestions).toContain('technology');
            expect(suggestions).toContain('conference');
            expect(suggestions.length).toBeGreaterThan(5);
        });

        test('should get search suggestions', async () => {
            const suggestions = await provider.getSearchSuggestions('conf');

            expect(suggestions).toContain('conference');
            expect(suggestions.length).toBeLessThanOrEqual(10);
        });

        test('should validate image quality', () => {
            const highQualityItem = {
                ...mockMediaItem,
                width: 1920,
                height: 1080,
            };

            const lowQualityItem = {
                ...mockMediaItem,
                width: 300,
                height: 200,
            };

            const highQualityResult =
                provider.validateImageQuality(highQualityItem);
            expect(highQualityResult.isValid).toBe(true);
            expect(highQualityResult.warnings).toHaveLength(0);

            const lowQualityResult =
                provider.validateImageQuality(lowQualityItem);
            expect(lowQualityResult.isValid).toBe(false);
            expect(lowQualityResult.warnings.length).toBeGreaterThan(0);
        });

        test('should generate attribution text for different placements', () => {
            const mockItem = {
                ...mockMediaItem,
                photographer: {
                    name: 'Test Photographer',
                    profileUrl: 'https://unsplash.com/@testphotographer',
                },
                attribution: {
                    required: true,
                    linkUrl: 'https://unsplash.com/photos/test-photo',
                    placement: 'image-caption' as const,
                },
            };

            const captionText = provider.getAttributionText(
                mockItem,
                'image-caption'
            );
            expect(captionText).toBe('Photo by Test Photographer on Unsplash');

            const descriptionText = provider.getAttributionText(
                mockItem,
                'event-description'
            );
            expect(descriptionText).toContain('Test Photographer');
            expect(descriptionText).toContain('Unsplash');

            const footerText = provider.getAttributionText(mockItem, 'footer');
            expect(footerText).toContain('Test Photographer');
            expect(footerText).toContain('Unsplash');
        });
    });

    describe('Rate Limiting', () => {
        test('should respect rate limits', async () => {
            // Test that the provider tracks rate limits correctly
            const status = provider.getStatus();
            expect(status.rateLimit.remaining).toBe(50); // Initial limit

            // Mock a successful request
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ total: 0, total_pages: 0, results: [] }),
            });

            await provider.search({ query: 'test' });

            // Check that rate limit was decremented
            const newStatus = provider.getStatus();
            expect(newStatus.rateLimit.remaining).toBe(49);
        });
    });

    describe('Health Monitoring', () => {
        test('should track health score', () => {
            expect(provider.isHealthy()).toBe(true);

            const status = provider.getStatus();
            expect(status.id).toBe('unsplash');
            expect(status.name).toBe('Unsplash');
            expect(status.isAvailable).toBe(true);
            expect(status.healthScore).toBe(100);
        });

        test('should become unhealthy after errors', async () => {
            // Create a fresh provider for this test
            const testProvider = new UnsplashProvider(mockConfig);

            const initialHealth = testProvider.getStatus().healthScore;
            expect(initialHealth).toBe(100);

            // Simulate a failure
            (fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Server error')
            );

            // Make a failed request
            await testProvider.search({ query: 'test' });

            const status = testProvider.getStatus();
            expect(status.healthScore).toBeLessThan(initialHealth);
        });
    });
});

const mockMediaItem = {
    id: 'test-photo-1',
    providerId: 'unsplash',
    title: 'Test Photo',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewUrl: 'https://example.com/preview.jpg',
    downloadUrl: 'https://example.com/download.jpg',
    width: 1920,
    height: 1080,
    mediaType: 'image' as const,
    attribution: {
        required: true,
        text: 'Photo by Test User on Unsplash',
        linkUrl: 'https://unsplash.com/photos/test-photo-1',
        placement: 'image-caption' as const,
    },
    license: {
        type: 'unsplash' as const,
        name: 'Unsplash License',
        url: 'https://unsplash.com/license',
        commercialUse: true,
        attribution: {
            required: true,
            text: 'Photo by Test User on Unsplash',
            linkUrl: 'https://unsplash.com/photos/test-photo-1',
            placement: 'image-caption' as const,
        },
    },
    tags: ['test'],
};

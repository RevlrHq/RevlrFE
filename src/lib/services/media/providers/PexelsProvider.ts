import { MediaProvider } from '../MediaProvider';
import {
    MediaSearchQuery,
    MediaItem,
    ProviderResult,
    RateLimit,
    MediaProviderConfig,
    AttributionInfo,
    LicenseInfo,
} from '@/types/media-search';

// Pexels API response types
interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    liked: boolean;
    alt: string;
}

interface PexelsVideo {
    id: number;
    width: number;
    height: number;
    duration: number;
    full_res?: any;
    tags: string[];
    url: string;
    image: string;
    avg_color?: string;
    user: {
        id: number;
        name: string;
        url: string;
    };
    video_files: Array<{
        id: number;
        quality: string;
        file_type: string;
        width: number;
        height: number;
        fps: number;
        link: string;
    }>;
    video_pictures: Array<{
        id: number;
        picture: string;
        nr: number;
    }>;
}

interface PexelsSearchResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    total_results: number;
    next_page?: string;
    prev_page?: string;
}

interface PexelsVideoSearchResponse {
    page: number;
    per_page: number;
    videos: PexelsVideo[];
    total_results: number;
    next_page?: string;
    prev_page?: string;
}

interface PexelsCuratedResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    next_page?: string;
    prev_page?: string;
}

interface PexelsPopularVideosResponse {
    page: number;
    per_page: number;
    videos: PexelsVideo[];
    total_results: number;
    next_page?: string;
    prev_page?: string;
}

/**
 * Pexels provider implementation
 * Integrates with Pexels API for high-quality stock photography and videos
 */
export class PexelsProvider extends MediaProvider {
    readonly id = 'pexels';
    readonly name = 'Pexels';
    readonly baseUrl = 'https://api.pexels.com/v1';
    readonly rateLimit: RateLimit;

    // Health monitoring
    private consecutiveErrors = 0;
    private lastHealthCheck = 0;
    private readonly healthCheckInterval = 5 * 60 * 1000; // 5 minutes

    constructor(config: MediaProviderConfig) {
        super(config);
        this.rateLimit = config.rateLimit;
    }

    /**
     * Search for photos and videos using Pexels search API
     */
    async search(query: MediaSearchQuery): Promise<ProviderResult> {
        if (!this.isHealthy()) {
            throw this.handleError(
                new Error('Provider is not healthy'),
                'search'
            );
        }

        try {
            const mediaType = query.filters?.mediaType || 'image';
            let items: MediaItem[] = [];
            let totalResults = 0;
            let hasMore = false;
            let nextPage: number | undefined;

            if (mediaType === 'video') {
                // Search for videos
                const searchParams = this.buildVideoSearchParams(query);
                const url = `${this.baseUrl}/videos/search?${searchParams}`;

                const response =
                    await this.makeRequest<PexelsVideoSearchResponse>(url, {
                        headers: {
                            Authorization: this.config.apiKey,
                        },
                    });

                items = response.videos.map((video) =>
                    this.transformPexelsVideo(video)
                );
                totalResults = response.total_results;
                hasMore = !!response.next_page;
                nextPage = query.page ? query.page + 1 : 2;
            } else {
                // Search for photos (default)
                const searchParams = this.buildSearchParams(query);
                const url = `${this.baseUrl}/search?${searchParams}`;

                const response = await this.makeRequest<PexelsSearchResponse>(
                    url,
                    {
                        headers: {
                            Authorization: this.config.apiKey,
                        },
                    }
                );

                items = response.photos.map((photo) =>
                    this.transformPexelsPhoto(photo)
                );
                totalResults = response.total_results;
                hasMore = !!response.next_page;
                nextPage = query.page ? query.page + 1 : 2;
            }

            this.consecutiveErrors = 0; // Reset error count on success
            return {
                providerId: this.id,
                items,
                totalResults,
                hasMore,
                nextPage,
            };
        } catch (error) {
            this.consecutiveErrors++;
            const providerError = this.handleError(error, 'search');
            return {
                providerId: this.id,
                items: [],
                totalResults: 0,
                hasMore: false,
                error: providerError,
            };
        }
    }

    /**
     * Get popular/curated photos and videos
     */
    async getPopular(
        category?: string,
        mediaType: 'image' | 'video' = 'image'
    ): Promise<ProviderResult> {
        if (!this.isHealthy()) {
            throw this.handleError(
                new Error('Provider is not healthy'),
                'getPopular'
            );
        }

        try {
            let url: string;
            let items: MediaItem[] = [];
            let totalResults = 0;
            let hasMore = false;

            if (mediaType === 'video') {
                if (category) {
                    // Search for category-specific popular videos
                    const searchParams = new URLSearchParams({
                        query: category,
                        per_page: '30',
                        page: '1',
                    });
                    url = `${this.baseUrl}/videos/search?${searchParams}`;

                    const response =
                        await this.makeRequest<PexelsVideoSearchResponse>(url, {
                            headers: {
                                Authorization: this.config.apiKey,
                            },
                        });

                    items = response.videos.map((video) =>
                        this.transformPexelsVideo(video)
                    );
                    totalResults = response.total_results;
                    hasMore = !!response.next_page;
                } else {
                    // Get popular videos
                    url = `${this.baseUrl}/videos/popular?per_page=30&page=1`;

                    const response =
                        await this.makeRequest<PexelsPopularVideosResponse>(
                            url,
                            {
                                headers: {
                                    Authorization: this.config.apiKey,
                                },
                            }
                        );

                    items = response.videos.map((video) =>
                        this.transformPexelsVideo(video)
                    );
                    totalResults = response.total_results;
                    hasMore = !!response.next_page;
                }
            } else {
                if (category) {
                    // Search for category-specific popular photos
                    const searchParams = new URLSearchParams({
                        query: category,
                        per_page: '30',
                        page: '1',
                    });
                    url = `${this.baseUrl}/search?${searchParams}`;

                    const response =
                        await this.makeRequest<PexelsSearchResponse>(url, {
                            headers: {
                                Authorization: this.config.apiKey,
                            },
                        });

                    items = response.photos.map((photo) =>
                        this.transformPexelsPhoto(photo)
                    );
                    totalResults = response.total_results;
                    hasMore = !!response.next_page;
                } else {
                    // Get curated photos
                    url = `${this.baseUrl}/curated?per_page=30&page=1`;

                    const response =
                        await this.makeRequest<PexelsCuratedResponse>(url, {
                            headers: {
                                Authorization: this.config.apiKey,
                            },
                        });

                    items = response.photos.map((photo) =>
                        this.transformPexelsPhoto(photo)
                    );
                    totalResults = items.length;
                    hasMore = !!response.next_page;
                }
            }

            this.consecutiveErrors = 0; // Reset error count on success
            return {
                providerId: this.id,
                items,
                totalResults,
                hasMore,
            };
        } catch (error) {
            this.consecutiveErrors++;
            const providerError = this.handleError(error, 'getPopular');
            return {
                providerId: this.id,
                items: [],
                totalResults: 0,
                hasMore: false,
                error: providerError,
            };
        }
    }

    /**
     * Download media item as blob
     */
    async downloadMedia(item: MediaItem): Promise<Blob> {
        if (!this.isHealthy()) {
            throw this.handleError(
                new Error('Provider is not healthy'),
                'downloadMedia'
            );
        }

        try {
            const response = await fetch(item.downloadUrl, {
                headers: {
                    'User-Agent': 'REVLR-Event-Platform/1.0',
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Download failed: HTTP ${response.status}: ${response.statusText}`
                );
            }

            const blob = await response.blob();
            this.resetHealthScore(); // Successful download
            return blob;
        } catch (error) {
            throw this.handleError(error, 'downloadMedia');
        }
    }

    /**
     * Build search parameters for Pexels photo API
     */
    private buildSearchParams(query: MediaSearchQuery): string {
        const params = new URLSearchParams();

        // Required parameters
        params.set('query', query.query);
        params.set('page', (query.page || 1).toString());
        params.set('per_page', (query.perPage || 20).toString());

        // Optional filters
        if (query.filters) {
            if (query.filters.orientation) {
                params.set('orientation', query.filters.orientation);
            }

            if (query.filters.color) {
                // Pexels supports: red, orange, yellow, green, turquoise, blue, violet, pink, brown, black, gray, white
                params.set('color', query.filters.color);
            }

            if (query.filters.category) {
                // Add category as additional search term
                params.set('query', `${query.query} ${query.filters.category}`);
            }

            // Size filter (Pexels supports large, medium, small)
            if (query.filters.minWidth && query.filters.minWidth >= 1920) {
                params.set('size', 'large');
            } else if (
                query.filters.minWidth &&
                query.filters.minWidth >= 1280
            ) {
                params.set('size', 'medium');
            } else if (
                query.filters.minWidth &&
                query.filters.minWidth < 1280
            ) {
                params.set('size', 'small');
            }
        }

        return params.toString();
    }

    /**
     * Build search parameters for Pexels video API
     */
    private buildVideoSearchParams(query: MediaSearchQuery): string {
        const params = new URLSearchParams();

        // Required parameters
        params.set('query', query.query);
        params.set('page', (query.page || 1).toString());
        params.set('per_page', (query.perPage || 20).toString());

        // Optional filters
        if (query.filters) {
            if (query.filters.orientation) {
                params.set('orientation', query.filters.orientation);
            }

            if (query.filters.category) {
                // Add category as additional search term
                params.set('query', `${query.query} ${query.filters.category}`);
            }

            // Size filter for videos
            if (query.filters.minWidth && query.filters.minWidth >= 1920) {
                params.set('size', 'large');
            } else if (
                query.filters.minWidth &&
                query.filters.minWidth >= 1280
            ) {
                params.set('size', 'medium');
            } else if (
                query.filters.minWidth &&
                query.filters.minWidth < 1280
            ) {
                params.set('size', 'small');
            }
        }

        return params.toString();
    }

    /**
     * Transform Pexels photo to MediaItem
     */
    private transformPexelsPhoto(photo: PexelsPhoto): MediaItem {
        // Create attribution info according to Pexels license requirements
        const attribution: AttributionInfo = {
            required: true,
            text: `Photo by ${photo.photographer} from Pexels`,
            linkUrl: photo.photographer_url,
            placement: 'image-caption',
        };

        // Pexels license info
        const license: LicenseInfo = {
            type: 'pexels',
            name: 'Pexels License',
            url: 'https://www.pexels.com/license/',
            commercialUse: true,
            attribution,
            restrictions: [
                'Cannot be sold without significant modification',
                'Cannot be used to create a competing service',
                'Cannot be used for illegal or harmful purposes',
            ],
        };

        // Generate tags from alt text
        const tags: string[] = [];
        if (photo.alt) {
            tags.push(
                ...photo.alt
                    .split(' ')
                    .filter((word) => word.length > 2)
                    .map((word) => word.toLowerCase())
            );
        }

        return {
            id: photo.id.toString(),
            providerId: this.id,
            title: photo.alt || `Photo by ${photo.photographer}`,
            description: photo.alt || undefined,
            thumbnailUrl: photo.src.small,
            previewUrl: photo.src.medium,
            downloadUrl: photo.src.large,
            width: photo.width,
            height: photo.height,
            mediaType: 'image',
            attribution,
            license,
            tags: [...new Set(tags)], // Remove duplicates
            color: photo.avg_color,
            photographer: {
                name: photo.photographer,
                profileUrl: photo.photographer_url,
            },
        };
    }

    /**
     * Transform Pexels video to MediaItem
     */
    private transformPexelsVideo(video: PexelsVideo): MediaItem {
        // Create attribution info according to Pexels license requirements
        const attribution: AttributionInfo = {
            required: true,
            text: `Video by ${video.user.name} from Pexels`,
            linkUrl: video.user.url,
            placement: 'image-caption',
        };

        // Pexels license info
        const license: LicenseInfo = {
            type: 'pexels',
            name: 'Pexels License',
            url: 'https://www.pexels.com/license/',
            commercialUse: true,
            attribution,
            restrictions: [
                'Cannot be sold without significant modification',
                'Cannot be used to create a competing service',
                'Cannot be used for illegal or harmful purposes',
            ],
        };

        // Get the best quality video file
        const bestVideoFile =
            video.video_files
                .filter((file) => file.quality !== 'sd')
                .sort((a, b) => {
                    // Prefer HD over other qualities
                    if (a.quality === 'hd' && b.quality !== 'hd') return -1;
                    if (b.quality === 'hd' && a.quality !== 'hd') return 1;
                    // Then sort by resolution
                    return b.width * b.height - a.width * a.height;
                })[0] || video.video_files[0];

        // Use video tags or generate from user name
        const tags: string[] = [...video.tags];
        if (tags.length === 0) {
            tags.push('video', 'stock footage');
        }

        return {
            id: video.id.toString(),
            providerId: this.id,
            title: `Video by ${video.user.name}`,
            description: `${video.duration}s video by ${video.user.name}`,
            thumbnailUrl: video.image,
            previewUrl: video.image,
            downloadUrl: bestVideoFile.link,
            width: video.width,
            height: video.height,
            fileSize: undefined, // Pexels doesn't provide file size
            mediaType: 'video',
            attribution,
            license,
            tags: [...new Set(tags)], // Remove duplicates
            color: video.avg_color,
            photographer: {
                name: video.user.name,
                profileUrl: video.user.url,
            },
        };
    }

    /**
     * Get category suggestions
     */
    getCategorySuggestions(): string[] {
        return [
            'business',
            'technology',
            'nature',
            'people',
            'food',
            'travel',
            'architecture',
            'fashion',
            'sports',
            'music',
            'education',
            'health',
            'lifestyle',
            'abstract',
            'animals',
            'automotive',
            'city',
            'culture',
            'family',
            'fitness',
        ];
    }

    /**
     * Get search suggestions for a given query
     */
    async getSearchSuggestions(query: string): Promise<string[]> {
        const categories = this.getCategorySuggestions();
        const suggestions = categories.filter((category) =>
            category.toLowerCase().includes(query.toLowerCase())
        );

        // Add some common search terms
        const commonTerms = [
            'meeting',
            'conference',
            'presentation',
            'team',
            'office',
            'workspace',
            'collaboration',
            'discussion',
            'planning',
            'strategy',
        ];

        suggestions.push(
            ...commonTerms.filter((term) =>
                term.toLowerCase().includes(query.toLowerCase())
            )
        );

        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }

    /**
     * Validate that an image meets minimum quality requirements
     */
    validateImageQuality(item: MediaItem): {
        isValid: boolean;
        warnings: string[];
    } {
        const warnings: string[] = [];
        let isValid = true;

        // Check minimum dimensions
        if (item.width < 800 || item.height < 600) {
            warnings.push(
                'Image resolution is below recommended minimum (800x600)'
            );
            if (item.width < 400 || item.height < 300) {
                isValid = false;
            }
        }

        // Check aspect ratio for common use cases
        const aspectRatio = item.width / item.height;
        if (aspectRatio < 0.5 || aspectRatio > 3) {
            warnings.push(
                'Image has an unusual aspect ratio that may not display well'
            );
        }

        return { isValid, warnings };
    }

    /**
     * Get attribution text for a specific placement
     */
    getAttributionText(
        item: MediaItem,
        placement: AttributionInfo['placement']
    ): string {
        const photographer = item.photographer?.name || 'Unknown';
        const photoUrl = item.attribution.linkUrl || '';
        const mediaType = item.mediaType === 'video' ? 'Video' : 'Photo';

        switch (placement) {
            case 'event-description':
                return `${mediaType} by ${photographer} from Pexels (${photoUrl})`;
            case 'image-caption':
                return `${mediaType} by ${photographer} from Pexels`;
            case 'footer':
                return `${mediaType}: ${photographer} via Pexels`;
            default:
                return (
                    item.attribution.text || `${mediaType} by ${photographer}`
                );
        }
    }

    /**
     * Check provider health and perform health monitoring
     */
    async checkHealth(): Promise<boolean> {
        const now = Date.now();

        // Only check health every 5 minutes
        if (now - this.lastHealthCheck < this.healthCheckInterval) {
            return this.isHealthy();
        }

        this.lastHealthCheck = now;

        try {
            // Perform a simple API call to check health
            const url = `${this.baseUrl}/curated?per_page=1&page=1`;
            await this.makeRequest(url, {
                headers: {
                    Authorization: this.config.apiKey,
                },
            });

            // Reset consecutive errors on successful health check
            this.consecutiveErrors = 0;
            this.resetHealthScore();
            return true;
        } catch (error) {
            this.consecutiveErrors++;
            this.handleError(error, 'healthCheck');
            return false;
        }
    }

    /**
     * Override isHealthy to include consecutive error tracking
     */
    isHealthy(): boolean {
        // Consider unhealthy if too many consecutive errors
        if (this.consecutiveErrors >= 5) {
            return false;
        }

        return super.isHealthy();
    }

    /**
     * Get provider-specific optimization suggestions
     */
    getSearchOptimizations(query: string): {
        optimizedQuery: string;
        suggestions: string[];
    } {
        let optimizedQuery = query.toLowerCase().trim();
        const suggestions: string[] = [];

        // Pexels-specific optimizations
        const pexelsKeywords = {
            meeting: ['business meeting', 'conference room', 'team discussion'],
            office: ['modern office', 'workspace', 'coworking space'],
            technology: ['tech startup', 'computer', 'digital'],
            food: ['restaurant', 'cuisine', 'dining'],
            nature: ['landscape', 'outdoor', 'natural'],
            people: ['portrait', 'lifestyle', 'human'],
        };

        // Add relevant keywords for better results
        for (const [key, keywords] of Object.entries(pexelsKeywords)) {
            if (optimizedQuery.includes(key)) {
                suggestions.push(...keywords);
                break;
            }
        }

        // Remove common stop words that don't help with search
        const stopWords = [
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
        ];
        optimizedQuery = optimizedQuery
            .split(' ')
            .filter((word) => !stopWords.includes(word))
            .join(' ');

        return {
            optimizedQuery,
            suggestions: suggestions.slice(0, 5), // Limit suggestions
        };
    }

    /**
     * Get provider-specific rate limit information
     */
    getRateLimitInfo(): {
        provider: string;
        limit: number;
        window: string;
        remaining: number;
        resetTime?: Date;
    } {
        const status = this.getStatus();
        return {
            provider: this.name,
            limit: this.rateLimit.requests,
            window: `${this.rateLimit.window}s`,
            remaining: status.rateLimit.remaining || 0,
            resetTime: status.rateLimit.resetTime
                ? new Date(status.rateLimit.resetTime)
                : undefined,
        };
    }

    /**
     * Get supported media types
     */
    getSupportedMediaTypes(): ('image' | 'video')[] {
        return ['image', 'video'];
    }

    /**
     * Get supported filters
     */
    getSupportedFilters(): {
        orientation: boolean;
        color: boolean;
        size: boolean;
        category: boolean;
    } {
        return {
            orientation: true,
            color: true, // For photos only
            size: true,
            category: true,
        };
    }

    /**
     * Get available color filters
     */
    getAvailableColors(): string[] {
        return [
            'red',
            'orange',
            'yellow',
            'green',
            'turquoise',
            'blue',
            'violet',
            'pink',
            'brown',
            'black',
            'gray',
            'white',
        ];
    }
}

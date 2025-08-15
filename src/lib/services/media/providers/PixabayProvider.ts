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

// Pixabay API response types
interface PixabayImage {
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    previewURL: string;
    previewWidth: number;
    previewHeight: number;
    webformatURL: string;
    webformatWidth: number;
    webformatHeight: number;
    largeImageURL: string;
    fullHDURL?: string;
    vectorURL?: string;
    views: number;
    downloads: number;
    collections: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
}

interface PixabayVideo {
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    duration: number;
    picture_id: string;
    videos: {
        large: {
            url: string;
            width: number;
            height: number;
            size: number;
        };
        medium: {
            url: string;
            width: number;
            height: number;
            size: number;
        };
        small: {
            url: string;
            width: number;
            height: number;
            size: number;
        };
        tiny: {
            url: string;
            width: number;
            height: number;
            size: number;
        };
    };
    views: number;
    downloads: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
}

interface PixabaySearchResponse {
    total: number;
    totalHits: number;
    hits: PixabayImage[];
}

interface PixabayVideoSearchResponse {
    total: number;
    totalHits: number;
    hits: PixabayVideo[];
}

/**
 * Pixabay provider implementation
 * Integrates with Pixabay API for high-quality stock photography and videos
 */
export class PixabayProvider extends MediaProvider {
    readonly id = 'pixabay';
    readonly name = 'Pixabay';
    readonly baseUrl = 'https://pixabay.com/api';
    readonly rateLimit: RateLimit;

    // Health monitoring
    private consecutiveErrors = 0;
    private lastHealthCheck = 0;
    private readonly healthCheckInterval = 5 * 60 * 1000; // 5 minutes

    // Category mapping for better search results
    private readonly categoryMapping: Record<string, string> = {
        business: 'business',
        technology: 'computer',
        conference: 'business',
        music: 'music',
        food: 'food',
        sports: 'sports',
        education: 'education',
        networking: 'business',
        celebration: 'celebration',
        nature: 'nature',
        travel: 'travel',
        lifestyle: 'people',
        health: 'health',
        fashion: 'fashion',
        architecture: 'buildings',
        animals: 'animals',
        transportation: 'transportation',
        science: 'science',
        religion: 'religion',
        places: 'places',
        backgrounds: 'backgrounds',
        feelings: 'feelings',
        industry: 'industry',
    };

    constructor(config: MediaProviderConfig) {
        super(config);
        this.rateLimit = config.rateLimit;
    }

    /**
     * Search for images and videos using Pixabay search API
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
                const url = `${this.baseUrl}/videos/?${searchParams}`;

                const response =
                    await this.makeRequest<PixabayVideoSearchResponse>(url);

                items = response.hits.map((video) =>
                    this.transformPixabayVideo(video)
                );
                totalResults = response.total;
                hasMore =
                    response.totalHits >
                    (query.page || 1) * (query.perPage || 20);
                nextPage = hasMore ? (query.page || 1) + 1 : undefined;
            } else {
                // Search for images (default)
                const searchParams = this.buildSearchParams(query);
                const url = `${this.baseUrl}/?${searchParams}`;

                const response =
                    await this.makeRequest<PixabaySearchResponse>(url);

                items = response.hits.map((image) =>
                    this.transformPixabayImage(image)
                );
                totalResults = response.total;
                hasMore =
                    response.totalHits >
                    (query.page || 1) * (query.perPage || 20);
                nextPage = hasMore ? (query.page || 1) + 1 : undefined;
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
     * Get popular/featured images and videos
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
            let items: MediaItem[] = [];
            let totalResults = 0;
            let hasMore = false;

            const searchQuery: MediaSearchQuery = {
                query: category
                    ? this.categoryMapping[category.toLowerCase()] || category
                    : '',
                page: 1,
                perPage: 30,
                filters: {
                    mediaType,
                },
            };

            if (mediaType === 'video') {
                const searchParams = this.buildVideoSearchParams(searchQuery);
                // Add popular sorting
                const params = new URLSearchParams(searchParams);
                params.set('order', 'popular');
                params.set('min_width', '1280');
                params.set('min_height', '720');

                const url = `${this.baseUrl}/videos/?${params.toString()}`;
                const response =
                    await this.makeRequest<PixabayVideoSearchResponse>(url);

                items = response.hits.map((video) =>
                    this.transformPixabayVideo(video)
                );
                totalResults = response.total;
                hasMore = response.totalHits > 30;
            } else {
                const searchParams = this.buildSearchParams(searchQuery);
                // Add popular sorting and quality filters
                const params = new URLSearchParams(searchParams);
                params.set('order', 'popular');
                params.set('min_width', '1920');
                params.set('min_height', '1080');

                const url = `${this.baseUrl}/?${params.toString()}`;
                const response =
                    await this.makeRequest<PixabaySearchResponse>(url);

                items = response.hits.map((image) =>
                    this.transformPixabayImage(image)
                );
                totalResults = response.total;
                hasMore = response.totalHits > 30;
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
     * Build search parameters for Pixabay image API
     */
    private buildSearchParams(query: MediaSearchQuery): string {
        const params = new URLSearchParams();

        // Required parameters
        params.set('key', this.config.apiKey);
        params.set('q', query.query || '');
        params.set('page', (query.page || 1).toString());
        params.set('per_page', Math.min(query.perPage || 20, 200).toString()); // Pixabay max is 200
        params.set('safesearch', 'true');
        params.set('image_type', 'photo');

        // Optional filters
        if (query.filters) {
            if (query.filters.orientation) {
                params.set('orientation', query.filters.orientation);
            }

            if (query.filters.color) {
                // Pixabay supports: grayscale, transparent, red, orange, yellow, green, turquoise, blue, lilac, pink, white, gray, black, brown
                const pixabayColors: Record<string, string> = {
                    red: 'red',
                    orange: 'orange',
                    yellow: 'yellow',
                    green: 'green',
                    blue: 'blue',
                    purple: 'lilac',
                    pink: 'pink',
                    white: 'white',
                    gray: 'gray',
                    grey: 'gray',
                    black: 'black',
                    brown: 'brown',
                    turquoise: 'turquoise',
                };

                const pixabayColor =
                    pixabayColors[query.filters.color.toLowerCase()];
                if (pixabayColor) {
                    params.set('colors', pixabayColor);
                }
            }

            if (query.filters.category) {
                const pixabayCategory =
                    this.categoryMapping[query.filters.category.toLowerCase()];
                if (pixabayCategory) {
                    params.set('category', pixabayCategory);
                }
            }

            // Size filters
            if (query.filters.minWidth) {
                params.set('min_width', query.filters.minWidth.toString());
            }
            if (query.filters.minHeight) {
                params.set('min_height', query.filters.minHeight.toString());
            }
        }

        // Default to high quality images
        params.set('order', 'popular');

        return params.toString();
    }

    /**
     * Build search parameters for Pixabay video API
     */
    private buildVideoSearchParams(query: MediaSearchQuery): string {
        const params = new URLSearchParams();

        // Required parameters
        params.set('key', this.config.apiKey);
        params.set('q', query.query || '');
        params.set('page', (query.page || 1).toString());
        params.set('per_page', Math.min(query.perPage || 20, 200).toString()); // Pixabay max is 200
        params.set('safesearch', 'true');
        params.set('video_type', 'film');

        // Optional filters
        if (query.filters) {
            if (query.filters.category) {
                const pixabayCategory =
                    this.categoryMapping[query.filters.category.toLowerCase()];
                if (pixabayCategory) {
                    params.set('category', pixabayCategory);
                }
            }

            // Size filters
            if (query.filters.minWidth) {
                params.set('min_width', query.filters.minWidth.toString());
            }
            if (query.filters.minHeight) {
                params.set('min_height', query.filters.minHeight.toString());
            }
        }

        // Default to high quality videos
        params.set('order', 'popular');

        return params.toString();
    }

    /**
     * Transform Pixabay image to MediaItem
     */
    private transformPixabayImage(image: PixabayImage): MediaItem {
        // Pixabay images don't require attribution but it's good practice
        const attribution: AttributionInfo = {
            required: false,
            text: `Image by ${image.user} from Pixabay`,
            linkUrl: image.pageURL,
            placement: 'none',
        };

        // Pixabay license info (very permissive)
        const license: LicenseInfo = {
            type: 'pixabay-standard',
            name: 'Pixabay License',
            url: 'https://pixabay.com/service/license/',
            commercialUse: true,
            attribution,
            restrictions: [
                'Cannot be redistributed or sold as stock photos',
                'Cannot be used to create a competing service',
                'Cannot be used for illegal or harmful purposes',
            ],
        };

        // Parse tags
        const tags = image.tags
            .split(', ')
            .map((tag) => tag.trim().toLowerCase());

        // Choose the best available image URL
        const downloadUrl =
            image.fullHDURL || image.largeImageURL || image.webformatURL;

        return {
            id: image.id.toString(),
            providerId: this.id,
            title: `${image.tags.split(', ').slice(0, 3).join(', ')} by ${image.user}`,
            description: `High-quality image featuring: ${image.tags}`,
            thumbnailUrl: image.previewURL,
            previewUrl: image.webformatURL,
            downloadUrl,
            width: image.webformatWidth,
            height: image.webformatHeight,
            mediaType: 'image',
            attribution,
            license,
            tags: [...new Set(tags)], // Remove duplicates
            photographer: {
                name: image.user,
                profileUrl: `https://pixabay.com/users/${image.user}-${image.user_id}/`,
                avatarUrl: image.userImageURL,
            },
        };
    }

    /**
     * Transform Pixabay video to MediaItem
     */
    private transformPixabayVideo(video: PixabayVideo): MediaItem {
        // Pixabay videos don't require attribution but it's good practice
        const attribution: AttributionInfo = {
            required: false,
            text: `Video by ${video.user} from Pixabay`,
            linkUrl: video.pageURL,
            placement: 'none',
        };

        // Pixabay license info (very permissive)
        const license: LicenseInfo = {
            type: 'pixabay-standard',
            name: 'Pixabay License',
            url: 'https://pixabay.com/service/license/',
            commercialUse: true,
            attribution,
            restrictions: [
                'Cannot be redistributed or sold as stock videos',
                'Cannot be used to create a competing service',
                'Cannot be used for illegal or harmful purposes',
            ],
        };

        // Parse tags
        const tags = video.tags
            .split(', ')
            .map((tag) => tag.trim().toLowerCase());

        // Choose the best available video quality
        const bestVideo =
            video.videos.large || video.videos.medium || video.videos.small;

        return {
            id: video.id.toString(),
            providerId: this.id,
            title: `${video.tags.split(', ').slice(0, 3).join(', ')} by ${video.user}`,
            description: `${video.duration}s video featuring: ${video.tags}`,
            thumbnailUrl: `https://i.vimeocdn.com/video/${video.picture_id}_640x360.jpg`,
            previewUrl: `https://i.vimeocdn.com/video/${video.picture_id}_640x360.jpg`,
            downloadUrl: bestVideo.url,
            width: bestVideo.width,
            height: bestVideo.height,
            fileSize: bestVideo.size,
            mediaType: 'video',
            attribution,
            license,
            tags: [...new Set(tags)], // Remove duplicates
            photographer: {
                name: video.user,
                profileUrl: `https://pixabay.com/users/${video.user}-${video.user_id}/`,
                avatarUrl: video.userImageURL,
            },
        };
    }

    /**
     * Get category suggestions
     */
    getCategorySuggestions(): string[] {
        return Object.keys(this.categoryMapping);
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
            'innovation',
            'startup',
            'corporate',
            'professional',
            'business',
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
        const mediaType = item.mediaType === 'video' ? 'Video' : 'Image';

        // Pixabay doesn't require attribution, but it's good practice
        switch (placement) {
            case 'event-description':
                return `${mediaType} by ${photographer} from Pixabay (${photoUrl})`;
            case 'image-caption':
                return `${mediaType} by ${photographer} from Pixabay`;
            case 'footer':
                return `${mediaType}: ${photographer} via Pixabay`;
            default:
                return `${mediaType} by ${photographer}`;
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
            const params = new URLSearchParams({
                key: this.config.apiKey,
                q: 'test',
                per_page: '3',
                page: '1',
                safesearch: 'true',
            });

            const url = `${this.baseUrl}/?${params.toString()}`;
            await this.makeRequest(url);

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

        // Pixabay-specific optimizations
        const pixabayKeywords = {
            meeting: ['business meeting', 'conference', 'team work'],
            office: ['workplace', 'corporate', 'professional'],
            technology: ['computer', 'digital', 'innovation'],
            food: ['cuisine', 'restaurant', 'cooking'],
            nature: ['landscape', 'outdoor', 'environment'],
            people: ['portrait', 'lifestyle', 'human'],
        };

        // Add relevant keywords for better results
        for (const [key, keywords] of Object.entries(pixabayKeywords)) {
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
            color: true, // For images only
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
            'lilac',
            'pink',
            'white',
            'gray',
            'black',
            'brown',
        ];
    }

    /**
     * Get available categories
     */
    getAvailableCategories(): string[] {
        return [
            'backgrounds',
            'fashion',
            'nature',
            'science',
            'education',
            'feelings',
            'health',
            'people',
            'religion',
            'places',
            'animals',
            'industry',
            'computer',
            'food',
            'sports',
            'transportation',
            'travel',
            'buildings',
            'business',
            'music',
        ];
    }
}

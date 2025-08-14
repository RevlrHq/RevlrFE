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

interface PexelsSearchResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
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

/**
 * Pexels provider implementation
 * Integrates with Pexels API for high-quality stock photography
 */
export class PexelsProvider extends MediaProvider {
    readonly id = 'pexels';
    readonly name = 'Pexels';
    readonly baseUrl = 'https://api.pexels.com/v1';
    readonly rateLimit: RateLimit;

    constructor(config: MediaProviderConfig) {
        super(config);
        this.rateLimit = config.rateLimit;
    }

    /**
     * Search for photos using Pexels search API
     */
    async search(query: MediaSearchQuery): Promise<ProviderResult> {
        if (!this.isHealthy()) {
            throw this.handleError(
                new Error('Provider is not healthy'),
                'search'
            );
        }

        try {
            const searchParams = this.buildSearchParams(query);
            const url = `${this.baseUrl}/search?${searchParams}`;

            const response = await this.makeRequest<PexelsSearchResponse>(url, {
                headers: {
                    Authorization: this.config.apiKey,
                },
            });

            const items = response.photos.map((photo) =>
                this.transformPexelsPhoto(photo)
            );

            return {
                providerId: this.id,
                items,
                totalResults: response.total_results,
                hasMore: !!response.next_page,
                nextPage: query.page ? query.page + 1 : 2,
            };
        } catch (error) {
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
     * Get popular/curated photos
     */
    async getPopular(category?: string): Promise<ProviderResult> {
        if (!this.isHealthy()) {
            throw this.handleError(
                new Error('Provider is not healthy'),
                'getPopular'
            );
        }

        try {
            let url: string;

            if (category) {
                // Search for category-specific popular photos
                const searchParams = new URLSearchParams({
                    query: category,
                    per_page: '30',
                    page: '1',
                });
                url = `${this.baseUrl}/search?${searchParams}`;
            } else {
                // Get curated photos
                url = `${this.baseUrl}/curated?per_page=30&page=1`;
            }

            const response = await this.makeRequest<
                PexelsSearchResponse | PexelsCuratedResponse
            >(url, {
                headers: {
                    Authorization: this.config.apiKey,
                },
            });

            const items = response.photos.map((photo) =>
                this.transformPexelsPhoto(photo)
            );

            return {
                providerId: this.id,
                items,
                totalResults:
                    'total_results' in response
                        ? response.total_results
                        : items.length,
                hasMore: !!response.next_page,
            };
        } catch (error) {
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
     * Build search parameters for Pexels API
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

        switch (placement) {
            case 'event-description':
                return `Image by ${photographer} from Pexels (${photoUrl})`;
            case 'image-caption':
                return `Photo by ${photographer} from Pexels`;
            case 'footer':
                return `Photography: ${photographer} via Pexels`;
            default:
                return item.attribution.text || `Photo by ${photographer}`;
        }
    }
}

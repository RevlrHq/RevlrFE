import { MediaProvider } from '../MediaProvider';
import {
    MediaSearchQuery,
    MediaItem,
    ProviderResult,
    RateLimit,
    MediaProviderConfig,
    AttributionInfo,
    LicenseInfo,
    MediaProviderErrorType,
} from '@/types/media-search';

// Unsplash API response types
interface UnsplashPhoto {
    id: string;
    created_at: string;
    updated_at: string;
    width: number;
    height: number;
    color: string;
    blur_hash: string;
    description: string | null;
    alt_description: string | null;
    urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
    };
    links: {
        self: string;
        html: string;
        download: string;
        download_location: string;
    };
    user: {
        id: string;
        username: string;
        name: string;
        first_name: string;
        last_name: string | null;
        twitter_username: string | null;
        portfolio_url: string | null;
        bio: string | null;
        location: string | null;
        links: {
            self: string;
            html: string;
            photos: string;
            likes: string;
            portfolio: string;
            following: string;
            followers: string;
        };
        profile_image: {
            small: string;
            medium: string;
            large: string;
        };
    };
    tags?: Array<{
        type: string;
        title: string;
    }>;
}

interface UnsplashSearchResponse {
    total: number;
    total_pages: number;
    results: UnsplashPhoto[];
}

interface UnsplashCollectionResponse {
    id: string;
    title: string;
    description: string | null;
    published_at: string;
    last_collected_at: string;
    updated_at: string;
    total_photos: number;
    private: boolean;
    share_key: string;
    tags: Array<{
        type: string;
        title: string;
    }>;
    cover_photo: UnsplashPhoto;
    preview_photos: UnsplashPhoto[];
    user: UnsplashPhoto['user'];
    links: {
        self: string;
        html: string;
        photos: string;
        related: string;
    };
}

/**
 * Unsplash provider implementation
 * Integrates with Unsplash API for high-quality stock photography
 */
export class UnsplashProvider extends MediaProvider {
    readonly id = 'unsplash';
    readonly name = 'Unsplash';
    readonly baseUrl = 'https://api.unsplash.com';
    readonly rateLimit: RateLimit;

    // Featured collections for category-based suggestions
    private readonly featuredCollections: Record<string, string> = {
        business: '3348849', // Business & Work
        technology: '3330445', // Technology
        conference: '1319040', // Events & Conferences
        music: '1154337', // Music
        food: '1114848', // Food & Drink
        sports: '1154328', // Sports
        education: '1319041', // Education
        networking: '3348849', // Business & Work (reused)
        celebration: '1319042', // Celebrations
        nature: '1154332', // Nature
        travel: '1154333', // Travel
        lifestyle: '1154334', // Lifestyle
        health: '1154335', // Health & Wellness
        fashion: '1154336', // Fashion
        architecture: '1154337', // Architecture
    };

    constructor(config: MediaProviderConfig) {
        super(config);
        this.rateLimit = config.rateLimit;
    }

    /**
     * Search for photos using Unsplash search API
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
            const url = `${this.baseUrl}/search/photos?${searchParams}`;

            const response = await this.makeRequest<UnsplashSearchResponse>(
                url,
                {
                    headers: {
                        Authorization: `Client-ID ${this.config.apiKey}`,
                    },
                }
            );

            const items = response.results.map((photo) =>
                this.transformUnsplashPhoto(photo)
            );

            return {
                providerId: this.id,
                items,
                totalResults: response.total,
                hasMore: query.page
                    ? query.page < response.total_pages
                    : response.total_pages > 1,
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
     * Get popular/featured photos for a category
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
            let response: UnsplashPhoto[] | UnsplashSearchResponse;

            if (category && this.featuredCollections[category.toLowerCase()]) {
                // Get photos from featured collection for the category
                const collectionId =
                    this.featuredCollections[category.toLowerCase()];
                url = `${this.baseUrl}/collections/${collectionId}/photos?per_page=30&order_by=popular`;

                response = await this.makeRequest<UnsplashPhoto[]>(url, {
                    headers: {
                        Authorization: `Client-ID ${this.config.apiKey}`,
                    },
                });

                const items = (response as UnsplashPhoto[]).map((photo) =>
                    this.transformUnsplashPhoto(photo)
                );

                return {
                    providerId: this.id,
                    items,
                    totalResults: items.length,
                    hasMore: false,
                };
            } else {
                // Get general popular photos
                url = `${this.baseUrl}/photos?per_page=30&order_by=popular`;

                response = await this.makeRequest<UnsplashPhoto[]>(url, {
                    headers: {
                        Authorization: `Client-ID ${this.config.apiKey}`,
                    },
                });

                const items = (response as UnsplashPhoto[]).map((photo) =>
                    this.transformUnsplashPhoto(photo)
                );

                return {
                    providerId: this.id,
                    items,
                    totalResults: items.length,
                    hasMore: false,
                };
            }
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
     * Download media item as blob with proper attribution tracking
     */
    async downloadMedia(item: MediaItem): Promise<Blob> {
        if (!this.isHealthy()) {
            throw this.handleError(
                new Error('Provider is not healthy'),
                'downloadMedia'
            );
        }

        try {
            // First, trigger the download tracking endpoint as required by Unsplash
            await this.triggerDownloadTracking(item.id);

            // Then download the actual image
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
     * Build search parameters for Unsplash API
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
                // Unsplash supports: black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, blue
                params.set('color', query.filters.color);
            }

            if (query.filters.category) {
                // Add category as additional search term
                params.set('query', `${query.query} ${query.filters.category}`);
            }
        }

        // Always request high-quality images
        params.set('order_by', 'relevant');

        return params.toString();
    }

    /**
     * Transform Unsplash photo to MediaItem
     */
    private transformUnsplashPhoto(photo: UnsplashPhoto): MediaItem {
        // Create attribution info according to Unsplash license requirements
        const attribution: AttributionInfo = {
            required: true,
            text: `Photo by ${photo.user.name} on Unsplash`,
            linkUrl: photo.links.html,
            placement: 'image-caption',
        };

        // Unsplash license info
        const license: LicenseInfo = {
            type: 'unsplash',
            name: 'Unsplash License',
            url: 'https://unsplash.com/license',
            commercialUse: true,
            attribution,
            restrictions: [
                'Cannot be sold without significant modification',
                'Cannot be used to create a competing service',
                'Cannot be used for illegal or harmful purposes',
            ],
        };

        // Extract tags from the photo
        const tags: string[] = [];
        if (photo.tags) {
            tags.push(...photo.tags.map((tag) => tag.title));
        }
        if (photo.alt_description) {
            // Add alt description words as tags
            tags.push(
                ...photo.alt_description
                    .split(' ')
                    .filter((word) => word.length > 2)
            );
        }

        return {
            id: photo.id,
            providerId: this.id,
            title:
                photo.description ||
                photo.alt_description ||
                `Photo by ${photo.user.name}`,
            description:
                photo.description || photo.alt_description || undefined,
            thumbnailUrl: photo.urls.thumb,
            previewUrl: photo.urls.regular,
            downloadUrl: photo.urls.full,
            width: photo.width,
            height: photo.height,
            mediaType: 'image',
            attribution,
            license,
            tags: [...new Set(tags)], // Remove duplicates
            color: photo.color,
            photographer: {
                name: photo.user.name,
                profileUrl: photo.user.links.html,
                avatarUrl: photo.user.profile_image.medium,
            },
        };
    }

    /**
     * Trigger download tracking as required by Unsplash API
     * This is required for Unsplash's analytics and photographer compensation
     */
    private async triggerDownloadTracking(photoId: string): Promise<void> {
        try {
            const url = `${this.baseUrl}/photos/${photoId}/download`;
            await this.makeRequest(url, {
                headers: {
                    Authorization: `Client-ID ${this.config.apiKey}`,
                },
            });
        } catch (error) {
            // Log the error but don't fail the download
            console.warn(
                `Failed to trigger download tracking for photo ${photoId}:`,
                error
            );
        }
    }

    /**
     * Get category suggestions based on Unsplash collections
     */
    getCategorySuggestions(): string[] {
        return Object.keys(this.featuredCollections);
    }

    /**
     * Get search suggestions for a given query
     */
    async getSearchSuggestions(query: string): Promise<string[]> {
        // For now, return category-based suggestions
        // In a full implementation, this could use Unsplash's autocomplete API
        const categories = this.getCategorySuggestions();
        const suggestions = categories.filter((category) =>
            category.toLowerCase().includes(query.toLowerCase())
        );

        // Add some common search terms
        const commonTerms = [
            'meeting',
            'presentation',
            'team',
            'office',
            'workspace',
            'collaboration',
            'discussion',
            'planning',
            'strategy',
            'innovation',
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
                return `Image by ${photographer} from Unsplash (${photoUrl})`;
            case 'image-caption':
                return `Photo by ${photographer} on Unsplash`;
            case 'footer':
                return `Photography: ${photographer} via Unsplash`;
            default:
                return item.attribution.text || `Photo by ${photographer}`;
        }
    }
}

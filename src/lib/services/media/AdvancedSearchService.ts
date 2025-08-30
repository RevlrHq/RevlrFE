import {
    MediaSearchQuery,
    MediaSearchResult,
    MediaItem,
    MediaFilters,
    ProviderResult,
} from '@/types/media-search';
import { MediaSearchService } from './MediaSearchService';
import { SearchAnalyticsService } from './SearchAnalyticsService';
import { PersonalizationService } from './PersonalizationService';

export interface AdvancedSearchOptions {
    enablePersonalization?: boolean;
    enableAnalytics?: boolean;
    userId?: string;
    sessionId?: string;
}

export class AdvancedSearchService extends MediaSearchService {
    private analyticsService: SearchAnalyticsService;
    private personalizationService: PersonalizationService;

    constructor(
        cacheSize: number = 1000,
        cacheExpiryMinutes: number = 30,
        analyticsService?: SearchAnalyticsService,
        personalizationService?: PersonalizationService
    ) {
        super(cacheSize, cacheExpiryMinutes);

        this.analyticsService =
            analyticsService || new SearchAnalyticsService();
        this.personalizationService =
            personalizationService ||
            new PersonalizationService(this.analyticsService);
    }

    /**
     * Enhanced search with advanced filtering, sorting, and personalization
     */
    async searchMediaAdvanced(
        query: MediaSearchQuery,
        options: AdvancedSearchOptions = {}
    ): Promise<MediaSearchResult> {
        const startTime = Date.now();
        const {
            enablePersonalization = true,
            enableAnalytics = true,
            userId,
        } = options;

        try {
            // Apply advanced filters to the query
            const enhancedQuery = this.enhanceQuery(
                query,
                userId,
                enablePersonalization
            );

            // Perform the base search
            const baseResult = await super.searchMedia(enhancedQuery);

            // Apply advanced filtering
            const filteredResult = this.applyAdvancedFilters(
                baseResult,
                query.filters
            );

            // Apply sorting
            const sortedResult = this.applySorting(
                filteredResult,
                query.sortBy,
                query.sortOrder
            );

            // Apply personalization if enabled
            const personalizedResult =
                enablePersonalization && userId
                    ? this.applyPersonalization(sortedResult, userId)
                    : sortedResult;

            // Track analytics if enabled
            if (enableAnalytics) {
                const searchDuration = Date.now() - startTime;
                this.analyticsService.trackSearch({
                    userId,
                    query: query.query,
                    filters: query.filters,
                    totalResults: personalizedResult.totalResults,
                    searchDuration,
                    eventCategory: query.eventCategory,
                });
            }

            return personalizedResult;
        } catch (error) {
            // Track error if analytics enabled
            if (enableAnalytics) {
                console.debug('Advanced search failed:', error);
            }
            throw error;
        }
    }

    /**
     * Get advanced search suggestions with personalization
     */
    async getAdvancedSuggestions(params: {
        query: string;
        userId?: string;
        eventCategory?: string;
        limit?: number;
        includeFilters?: boolean;
    }): Promise<
        Array<{
            text: string;
            type: 'query' | 'category' | 'filter' | 'trending' | 'personalized';
            score: number;
            metadata?: any;
        }>
    > {
        const { SmartSuggestionsService } = await import(
            './SmartSuggestionsService'
        );
        const suggestionsService = new SmartSuggestionsService(
            this.analyticsService
        );

        return suggestionsService.getSmartSuggestions(params);
    }

    /**
     * Apply advanced color filtering
     */
    private applyColorFilter(
        items: MediaItem[],
        colorFilter: string
    ): MediaItem[] {
        if (!colorFilter) return items;

        const colorKeywords = this.getColorKeywords(colorFilter);

        return items.filter((item) => {
            // Check item color property
            if (item.color && this.matchesColor(item.color, colorFilter)) {
                return true;
            }

            // Check tags for color keywords
            const hasColorTag = item.tags.some((tag) =>
                colorKeywords.some((keyword) =>
                    tag.toLowerCase().includes(keyword.toLowerCase())
                )
            );

            return hasColorTag;
        });
    }

    /**
     * Apply dimension-based filtering
     */
    private applyDimensionFilter(
        items: MediaItem[],
        filters: MediaFilters
    ): MediaItem[] {
        return items.filter((item) => {
            // Min/Max width filtering
            if (filters.minWidth && item.width < filters.minWidth) return false;
            if (filters.maxWidth && item.width > filters.maxWidth) return false;

            // Min/Max height filtering
            if (filters.minHeight && item.height < filters.minHeight)
                return false;
            if (filters.maxHeight && item.height > filters.maxHeight)
                return false;

            // Aspect ratio filtering
            if (filters.aspectRatio) {
                const itemAspectRatio = this.calculateAspectRatioCategory(
                    item.width,
                    item.height
                );
                if (itemAspectRatio !== filters.aspectRatio) return false;
            }

            // Resolution filtering
            if (filters.resolution) {
                const itemResolution = this.calculateResolutionCategory(
                    item.width,
                    item.height
                );
                if (itemResolution !== filters.resolution) return false;
            }

            return true;
        });
    }

    /**
     * Apply file size filtering
     */
    private applyFileSizeFilter(
        items: MediaItem[],
        sizeFilter: string
    ): MediaItem[] {
        if (!sizeFilter) return items;

        return items.filter((item) => {
            if (!item.fileSize) return true; // Include items without size info

            const sizeInMB = item.fileSize / (1024 * 1024);

            switch (sizeFilter) {
                case 'small':
                    return sizeInMB < 2;
                case 'medium':
                    return sizeInMB >= 2 && sizeInMB < 10;
                case 'large':
                    return sizeInMB >= 10;
                default:
                    return true;
            }
        });
    }

    /**
     * Apply license filtering
     */
    private applyLicenseFilter(
        items: MediaItem[],
        licenseFilter: string
    ): MediaItem[] {
        if (!licenseFilter) return items;

        return items.filter((item) => {
            switch (licenseFilter) {
                case 'cc0':
                    return item.license.type === 'cc0';
                case 'commercial':
                    return item.license.commercialUse;
                case 'editorial':
                    return !item.license.commercialUse;
                default:
                    return true;
            }
        });
    }

    /**
     * Apply safe search filtering
     */
    private applySafeSearchFilter(
        items: MediaItem[],
        safeSearch: boolean
    ): MediaItem[] {
        if (!safeSearch) return items;

        // Filter out items with potentially unsafe tags
        const unsafeTags = [
            'adult',
            'explicit',
            'nsfw',
            'mature',
            'suggestive',
        ];

        return items.filter((item) => {
            const hasUnsafeTag = item.tags.some((tag) =>
                unsafeTags.some((unsafeTag) =>
                    tag.toLowerCase().includes(unsafeTag)
                )
            );
            return !hasUnsafeTag;
        });
    }

    /**
     * Enhanced query with personalization and smart defaults
     */
    private enhanceQuery(
        query: MediaSearchQuery,
        userId?: string,
        enablePersonalization: boolean = true
    ): MediaSearchQuery {
        const enhancedQuery = { ...query };

        // Apply personalized filters if user is available
        if (enablePersonalization && userId) {
            const personalizedFilters =
                this.personalizationService.getPersonalizedFilters(
                    userId,
                    query.eventCategory
                );

            // Merge with existing filters, giving priority to explicit user filters
            enhancedQuery.filters = {
                ...personalizedFilters,
                ...query.filters,
            };
        }

        // Apply smart defaults based on event category
        if (query.eventCategory && !query.filters?.safeSearch) {
            enhancedQuery.filters = {
                ...enhancedQuery.filters,
                safeSearch: true, // Default to safe search for events
            };
        }

        return enhancedQuery;
    }

    /**
     * Apply all advanced filters to search results
     */
    private applyAdvancedFilters(
        result: MediaSearchResult,
        filters?: MediaFilters
    ): MediaSearchResult {
        if (!filters) return result;

        let filteredItems = [...result.items];

        // Apply color filtering
        if (filters.color) {
            filteredItems = this.applyColorFilter(filteredItems, filters.color);
        }

        // Apply dimension filtering
        filteredItems = this.applyDimensionFilter(filteredItems, filters);

        // Apply file size filtering
        if (filters.fileSize) {
            filteredItems = this.applyFileSizeFilter(
                filteredItems,
                filters.fileSize
            );
        }

        // Apply license filtering
        if (filters.license) {
            filteredItems = this.applyLicenseFilter(
                filteredItems,
                filters.license
            );
        }

        // Apply safe search filtering
        if (filters.safeSearch) {
            filteredItems = this.applySafeSearchFilter(
                filteredItems,
                filters.safeSearch
            );
        }

        return {
            ...result,
            items: filteredItems,
            totalResults: filteredItems.length,
        };
    }

    /**
     * Apply sorting to search results
     */
    private applySorting(
        result: MediaSearchResult,
        sortBy?: string,
        sortOrder: 'asc' | 'desc' = 'desc'
    ): MediaSearchResult {
        if (!sortBy || sortBy === 'relevance') {
            // Default relevance sorting is already applied by base service
            return result;
        }

        const sortedItems = [...result.items].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'popularity':
                    // Sort by download count or view count (if available)
                    // For now, use a combination of provider health and image quality
                    const aPopularity = this.calculatePopularityScore(a);
                    const bPopularity = this.calculatePopularityScore(b);
                    comparison = bPopularity - aPopularity;
                    break;

                case 'recency':
                    // Sort by upload date (if available in metadata)
                    // For now, use a proxy based on provider and ID
                    const aRecency = this.calculateRecencyScore(a);
                    const bRecency = this.calculateRecencyScore(b);
                    comparison = bRecency - aRecency;
                    break;

                case 'downloads':
                    // Sort by download count (if available)
                    // This would need to be tracked by the application
                    comparison = 0; // Placeholder
                    break;

                case 'views':
                    // Sort by view count (if available)
                    // This would need to be tracked by the application
                    comparison = 0; // Placeholder
                    break;

                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return {
            ...result,
            items: sortedItems,
        };
    }

    /**
     * Apply personalization to search results
     */
    private applyPersonalization(
        result: MediaSearchResult,
        userId: string
    ): MediaSearchResult {
        const personalizedItems =
            this.personalizationService.personalizeSearchResults(
                userId,
                result.items
            );

        return {
            ...result,
            items: personalizedItems,
        };
    }

    /**
     * Calculate popularity score for an item
     */
    private calculatePopularityScore(item: MediaItem): number {
        let score = 0;

        // Provider-based scoring
        const providerScores: Record<string, number> = {
            unsplash: 0.8,
            pexels: 0.7,
            pixabay: 0.6,
        };
        score += providerScores[item.providerId] || 0.5;

        // Resolution-based scoring (higher resolution = more popular)
        const pixels = item.width * item.height;
        score += Math.min(0.3, pixels / 10000000); // Normalize to 0-0.3

        // Tag count (more tags might indicate more curated content)
        score += Math.min(0.2, item.tags.length / 20);

        return score;
    }

    /**
     * Calculate recency score for an item
     */
    private calculateRecencyScore(item: MediaItem): number {
        // This is a placeholder implementation
        // In a real system, you'd have actual upload dates

        // Use a hash of the ID to create pseudo-random recency
        let hash = 0;
        for (let i = 0; i < item.id.length; i++) {
            const char = item.id.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash) / 2147483647; // Normalize to 0-1
    }

    /**
     * Get color keywords for filtering
     */
    private getColorKeywords(color: string): string[] {
        const colorMap: Record<string, string[]> = {
            red: ['red', 'crimson', 'scarlet', 'burgundy', 'maroon'],
            blue: ['blue', 'navy', 'azure', 'cyan', 'teal'],
            green: ['green', 'emerald', 'lime', 'olive', 'forest'],
            yellow: ['yellow', 'gold', 'amber', 'lemon', 'sunshine'],
            purple: ['purple', 'violet', 'lavender', 'magenta', 'plum'],
            orange: ['orange', 'tangerine', 'peach', 'coral', 'amber'],
            pink: ['pink', 'rose', 'magenta', 'fuchsia', 'salmon'],
            brown: ['brown', 'tan', 'beige', 'chocolate', 'coffee'],
            black: ['black', 'dark', 'charcoal', 'ebony', 'midnight'],
            white: ['white', 'ivory', 'cream', 'pearl', 'snow'],
            gray: ['gray', 'grey', 'silver', 'slate', 'ash'],
        };

        return colorMap[color.toLowerCase()] || [color];
    }

    /**
     * Check if item color matches filter
     */
    private matchesColor(itemColor: string, filterColor: string): boolean {
        const itemColorLower = itemColor.toLowerCase();
        const filterColorLower = filterColor.toLowerCase();

        // Direct match
        if (itemColorLower === filterColorLower) return true;

        // Check color family
        const colorKeywords = this.getColorKeywords(filterColor);
        return colorKeywords.some((keyword) =>
            itemColorLower.includes(keyword)
        );
    }

    /**
     * Calculate aspect ratio category
     */
    private calculateAspectRatioCategory(
        width: number,
        height: number
    ): string {
        const ratio = width / height;

        if (ratio > 1.5) return 'wide';
        if (ratio < 0.75) return 'tall';
        if (ratio >= 0.9 && ratio <= 1.1) return 'square';
        return 'standard';
    }

    /**
     * Calculate resolution category
     */
    private calculateResolutionCategory(width: number, height: number): string {
        const pixels = width * height;

        if (pixels < 500000) return 'low'; // < 0.5MP
        if (pixels < 2000000) return 'medium'; // < 2MP
        if (pixels < 8000000) return 'high'; // < 8MP
        return 'ultra'; // >= 8MP
    }

    /**
     * Track media selection for analytics and personalization
     */
    trackSelection(params: {
        userId?: string;
        query?: string;
        providerId: string;
        mediaId: string;
        resultPosition: number;
        eventCategory?: string;
        selectedItems?: MediaItem[];
    }): void {
        const { userId, selectedItems, ...trackingParams } = params;

        // Track in analytics
        this.analyticsService.trackSelection(trackingParams);

        // Update personalization if user is available
        if (userId && selectedItems) {
            this.personalizationService.updateUserPersonalization(userId, {
                selectedItems,
                eventCategory: params.eventCategory,
            });
        }
    }

    /**
     * Track filter application
     */
    trackFilterApplication(params: {
        userId?: string;
        filters: MediaFilters;
        query?: string;
        eventCategory?: string;
    }): void {
        // Track in analytics
        this.analyticsService.trackFilterApplication(params);

        // Update personalization if user is available
        if (params.userId) {
            this.personalizationService.updateUserPersonalization(
                params.userId,
                {
                    appliedFilters: params.filters,
                    eventCategory: params.eventCategory,
                }
            );
        }
    }

    /**
     * Get analytics service
     */
    getAnalyticsService(): SearchAnalyticsService {
        return this.analyticsService;
    }

    /**
     * Get personalization service
     */
    getPersonalizationService(): PersonalizationService {
        return this.personalizationService;
    }
}

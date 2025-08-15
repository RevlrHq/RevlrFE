import {
    PersonalizationData,
    MediaItem,
    MediaFilters,
    UserBehaviorPattern,
    PreloadingStrategy,
} from '@/types/media-search';
import { SearchAnalyticsService } from './SearchAnalyticsService';

export class PersonalizationService {
    private analyticsService: SearchAnalyticsService;
    private userProfiles: Map<string, PersonalizationData> = new Map();
    private preloadingStrategies: Map<string, PreloadingStrategy> = new Map();

    constructor(analyticsService: SearchAnalyticsService) {
        this.analyticsService = analyticsService;
        this.loadUserProfiles();
    }

    /**
     * Get or create user personalization data
     */
    getUserPersonalization(userId: string): PersonalizationData {
        let personalization = this.userProfiles.get(userId);

        if (!personalization) {
            personalization = this.createDefaultPersonalization(userId);
            this.userProfiles.set(userId, personalization);
        }

        return personalization;
    }

    /**
     * Update user personalization based on search behavior
     */
    updateUserPersonalization(
        userId: string,
        update: {
            searchQuery?: string;
            selectedItems?: MediaItem[];
            appliedFilters?: MediaFilters;
            eventCategory?: string;
            searchDuration?: number;
        }
    ): void {
        const personalization = this.getUserPersonalization(userId);
        const now = Date.now();

        // Update search history
        if (update.searchQuery) {
            personalization.searchHistory.push({
                query: update.searchQuery,
                timestamp: now,
                resultCount: 0, // Will be updated when results are received
                selectedItems: update.selectedItems?.length || 0,
            });

            // Keep only last 100 searches
            if (personalization.searchHistory.length > 100) {
                personalization.searchHistory =
                    personalization.searchHistory.slice(-100);
            }
        }

        // Update selection history
        if (update.selectedItems && update.selectedItems.length > 0) {
            update.selectedItems.forEach((item) => {
                personalization.selectionHistory.push({
                    mediaId: item.id,
                    providerId: item.providerId,
                    query: update.searchQuery || '',
                    timestamp: now,
                    eventCategory: update.eventCategory,
                });
            });

            // Keep only last 200 selections
            if (personalization.selectionHistory.length > 200) {
                personalization.selectionHistory =
                    personalization.selectionHistory.slice(-200);
            }

            // Update preferred providers
            this.updatePreferredProviders(
                personalization,
                update.selectedItems
            );
        }

        // Update preferred filters
        if (update.appliedFilters) {
            this.updatePreferredFilters(personalization, update.appliedFilters);
        }

        // Update behavior metrics
        this.updateBehaviorMetrics(personalization, update);

        // Save updated personalization
        this.userProfiles.set(userId, personalization);
        this.saveUserProfiles();
    }

    /**
     * Get personalized search results by reordering based on user preferences
     */
    personalizeSearchResults(userId: string, items: MediaItem[]): MediaItem[] {
        const personalization = this.getUserPersonalization(userId);

        return items.sort((a, b) => {
            let scoreA = this.calculatePersonalizationScore(a, personalization);
            let scoreB = this.calculatePersonalizationScore(b, personalization);

            return scoreB - scoreA;
        });
    }

    /**
     * Get personalized filters based on user behavior
     */
    getPersonalizedFilters(
        userId: string,
        eventCategory?: string
    ): MediaFilters {
        const personalization = this.getUserPersonalization(userId);
        const filters: MediaFilters = {
            ...personalization.preferences.preferredFilters,
        };

        // Add category-specific preferences if available
        if (eventCategory) {
            const categorySelections = personalization.selectionHistory.filter(
                (selection) => selection.eventCategory === eventCategory
            );

            if (categorySelections.length > 0) {
                // Analyze common patterns in category selections
                // This could be enhanced with more sophisticated analysis
                const recentSelections = categorySelections.slice(-20);

                // For now, just use the base preferred filters
                // In a real implementation, you'd analyze the media items
                // to determine common characteristics
            }
        }

        return filters;
    }

    /**
     * Get preloading strategy for a user
     */
    getPreloadingStrategy(userId: string): PreloadingStrategy {
        let strategy = this.preloadingStrategies.get(userId);

        if (!strategy) {
            strategy = this.generatePreloadingStrategy(userId);
            this.preloadingStrategies.set(userId, strategy);
        }

        return strategy;
    }

    /**
     * Get personalized search suggestions
     */
    getPersonalizedSearchSuggestions(
        userId: string,
        limit: number = 10
    ): string[] {
        const personalization = this.getUserPersonalization(userId);
        const suggestions: Array<{ query: string; score: number }> = [];

        // Get suggestions from search history
        const queryFrequency = new Map<string, number>();
        personalization.searchHistory.forEach((search) => {
            const query = search.query.toLowerCase().trim();
            queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);
        });

        // Score queries based on frequency and recency
        queryFrequency.forEach((frequency, query) => {
            const recentSearches = personalization.searchHistory
                .filter((search) => search.query.toLowerCase() === query)
                .slice(-5);

            const avgRecency =
                recentSearches.reduce(
                    (sum, search) => sum + (Date.now() - search.timestamp),
                    0
                ) / recentSearches.length;

            const recencyScore = Math.max(
                0,
                1 - avgRecency / (30 * 24 * 60 * 60 * 1000)
            ); // 30 days
            const frequencyScore = Math.min(1, frequency / 10);

            suggestions.push({
                query,
                score: frequencyScore * 0.6 + recencyScore * 0.4,
            });
        });

        // Add category-based suggestions
        Object.entries(personalization.preferences.favoriteCategories).forEach(
            ([category]) => {
                const categoryQueries = this.getCategoryQueries(category);
                categoryQueries.forEach((query) => {
                    if (!suggestions.some((s) => s.query === query)) {
                        suggestions.push({
                            query,
                            score: 0.3,
                        });
                    }
                });
            }
        );

        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((s) => s.query);
    }

    /**
     * Calculate personalization score for a media item
     */
    private calculatePersonalizationScore(
        item: MediaItem,
        personalization: PersonalizationData
    ): number {
        let score = 0;

        // Provider preference (40% weight)
        const providerIndex =
            personalization.preferences.preferredProviders.indexOf(
                item.providerId
            );
        if (providerIndex !== -1) {
            score += (5 - providerIndex) * 0.08; // 0.4 max
        }

        // Tag matching (30% weight)
        const userTags = this.extractUserTags(personalization);
        const matchingTags = item.tags.filter((tag) =>
            userTags.some(
                (userTag) =>
                    tag.toLowerCase().includes(userTag.toLowerCase()) ||
                    userTag.toLowerCase().includes(tag.toLowerCase())
            )
        );
        score += (matchingTags.length / Math.max(item.tags.length, 1)) * 0.3;

        // Aspect ratio preference (15% weight)
        const preferredAspectRatio =
            personalization.behaviorMetrics.preferredImageAspectRatio;
        const itemAspectRatio = this.calculateAspectRatio(
            item.width,
            item.height
        );
        if (preferredAspectRatio === itemAspectRatio) {
            score += 0.15;
        }

        // Color preference (10% weight)
        if (item.color && personalization.preferences.preferredFilters.color) {
            if (
                item.color ===
                personalization.preferences.preferredFilters.color
            ) {
                score += 0.1;
            }
        }

        // Photographer preference (5% weight)
        const photographerSelections = personalization.selectionHistory.filter(
            (selection) => {
                // This would need to be enhanced to track photographer info
                return false; // Placeholder
            }
        );
        if (photographerSelections.length > 0) {
            score += 0.05;
        }

        return score;
    }

    /**
     * Extract user tags from personalization data
     */
    private extractUserTags(personalization: PersonalizationData): string[] {
        const tags = new Set<string>();

        // Extract from search history
        personalization.searchHistory.forEach((search) => {
            const searchTerms = search.query.toLowerCase().split(' ');
            searchTerms.forEach((term) => {
                if (term.length > 2) {
                    tags.add(term);
                }
            });
        });

        // Extract from favorite categories
        personalization.preferences.favoriteCategories.forEach((category) => {
            tags.add(category.toLowerCase());
        });

        return Array.from(tags);
    }

    /**
     * Calculate aspect ratio category
     */
    private calculateAspectRatio(width: number, height: number): string {
        const ratio = width / height;

        if (ratio > 1.5) return 'wide';
        if (ratio < 0.75) return 'tall';
        if (ratio >= 0.9 && ratio <= 1.1) return 'square';
        return 'standard';
    }

    /**
     * Update preferred providers based on selections
     */
    private updatePreferredProviders(
        personalization: PersonalizationData,
        selectedItems: MediaItem[]
    ): void {
        const providerCounts = new Map<string, number>();

        // Count current selections
        selectedItems.forEach((item) => {
            providerCounts.set(
                item.providerId,
                (providerCounts.get(item.providerId) || 0) + 1
            );
        });

        // Update preferences
        providerCounts.forEach((count, providerId) => {
            const existingIndex =
                personalization.preferences.preferredProviders.indexOf(
                    providerId
                );

            if (existingIndex !== -1) {
                // Move to front if already exists
                personalization.preferences.preferredProviders.splice(
                    existingIndex,
                    1
                );
            }

            personalization.preferences.preferredProviders.unshift(providerId);
        });

        // Keep only top 5 providers
        personalization.preferences.preferredProviders =
            personalization.preferences.preferredProviders.slice(0, 5);
    }

    /**
     * Update preferred filters
     */
    private updatePreferredFilters(
        personalization: PersonalizationData,
        appliedFilters: MediaFilters
    ): void {
        // Merge with existing preferences, giving more weight to recent filters
        Object.entries(appliedFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                (personalization.preferences.preferredFilters as any)[key] =
                    value;
            }
        });
    }

    /**
     * Update behavior metrics
     */
    private updateBehaviorMetrics(
        personalization: PersonalizationData,
        update: {
            searchDuration?: number;
            selectedItems?: MediaItem[];
            eventCategory?: string;
        }
    ): void {
        const metrics = personalization.behaviorMetrics;

        // Update average search time
        if (update.searchDuration) {
            const currentAvg = metrics.averageSearchTime || 0;
            const searchCount = personalization.searchHistory.length;
            metrics.averageSearchTime =
                (currentAvg * (searchCount - 1) + update.searchDuration) /
                searchCount;
        }

        // Update average selection count
        if (update.selectedItems) {
            const currentAvg = metrics.averageSelectionCount || 0;
            const searchCount = personalization.searchHistory.length;
            metrics.averageSelectionCount =
                (currentAvg * (searchCount - 1) + update.selectedItems.length) /
                searchCount;

            // Update preferred aspect ratio
            if (update.selectedItems.length > 0) {
                const aspectRatios = update.selectedItems.map((item) =>
                    this.calculateAspectRatio(item.width, item.height)
                );

                const ratioCount = new Map<string, number>();
                aspectRatios.forEach((ratio) => {
                    ratioCount.set(ratio, (ratioCount.get(ratio) || 0) + 1);
                });

                const mostCommon = Array.from(ratioCount.entries()).sort(
                    (a, b) => b[1] - a[1]
                )[0];

                if (mostCommon) {
                    metrics.preferredImageAspectRatio = mostCommon[0];
                }
            }
        }

        // Update most active time of day
        const currentHour = new Date().getHours();
        metrics.mostActiveTimeOfDay = currentHour;
    }

    /**
     * Generate preloading strategy for user
     */
    private generatePreloadingStrategy(userId: string): PreloadingStrategy {
        const personalization = this.getUserPersonalization(userId);
        const userPattern =
            this.analyticsService.getUserBehaviorPattern(userId);

        const strategy: PreloadingStrategy = {
            popularQueries: [],
            categoryBasedQueries: {},
            userBasedQueries: {},
            trendingQueries: [],
            seasonalQueries: {},
            timeBasedQueries: {},
        };

        // Popular queries from user history
        const queryFrequency = new Map<string, number>();
        personalization.searchHistory.forEach((search) => {
            queryFrequency.set(
                search.query,
                (queryFrequency.get(search.query) || 0) + 1
            );
        });

        strategy.popularQueries = Array.from(queryFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query]) => query);

        // Category-based queries
        personalization.preferences.favoriteCategories.forEach((category) => {
            strategy.categoryBasedQueries[category] =
                this.getCategoryQueries(category);
        });

        // User-based queries from behavior patterns
        if (userPattern) {
            strategy.userBasedQueries[userId] =
                userPattern.commonSearchTerms.slice(0, 10);
        }

        // Time-based queries
        const currentHour = new Date().getHours();
        strategy.timeBasedQueries[currentHour.toString()] =
            this.getTimeBasedQueries(currentHour);

        return strategy;
    }

    /**
     * Get category-specific queries
     */
    private getCategoryQueries(category: string): string[] {
        // This would be populated from analytics or predefined lists
        const categoryQueries: Record<string, string[]> = {
            business: ['conference', 'meeting', 'presentation', 'corporate'],
            technology: ['tech', 'innovation', 'startup', 'digital'],
            music: ['concert', 'festival', 'performance', 'band'],
            food: ['restaurant', 'cooking', 'culinary', 'dining'],
            // Add more categories...
        };

        return categoryQueries[category.toLowerCase()] || [];
    }

    /**
     * Get time-based queries
     */
    private getTimeBasedQueries(hour: number): string[] {
        if (hour >= 9 && hour <= 17) {
            return ['business', 'professional', 'office', 'meeting'];
        } else if (hour >= 18 && hour <= 22) {
            return ['entertainment', 'music', 'food', 'social'];
        } else {
            return ['creative', 'art', 'inspiration', 'lifestyle'];
        }
    }

    /**
     * Create default personalization data
     */
    private createDefaultPersonalization(userId: string): PersonalizationData {
        return {
            userId,
            searchHistory: [],
            selectionHistory: [],
            preferences: {
                preferredProviders: [],
                preferredFilters: {},
                excludedTags: [],
                favoriteCategories: [],
            },
            behaviorMetrics: {
                averageSearchTime: 0,
                averageSelectionCount: 0,
                mostActiveTimeOfDay: new Date().getHours(),
                preferredImageAspectRatio: 'standard',
            },
        };
    }

    /**
     * Load user profiles from storage
     */
    private loadUserProfiles(): void {
        try {
            const stored = localStorage.getItem('media-search-personalization');
            if (stored) {
                const data = JSON.parse(stored);
                this.userProfiles = new Map(data.userProfiles || []);
                this.preloadingStrategies = new Map(
                    data.preloadingStrategies || []
                );
            }
        } catch (error) {
            console.warn('Failed to load personalization data:', error);
        }
    }

    /**
     * Save user profiles to storage
     */
    private saveUserProfiles(): void {
        try {
            const data = {
                userProfiles: Array.from(this.userProfiles.entries()),
                preloadingStrategies: Array.from(
                    this.preloadingStrategies.entries()
                ),
            };
            localStorage.setItem(
                'media-search-personalization',
                JSON.stringify(data)
            );
        } catch (error) {
            console.warn('Failed to save personalization data:', error);
        }
    }

    /**
     * Clear user personalization data
     */
    clearUserData(userId: string): void {
        this.userProfiles.delete(userId);
        this.preloadingStrategies.delete(userId);
        this.saveUserProfiles();
    }

    /**
     * Export user personalization data
     */
    exportUserData(userId: string): PersonalizationData | null {
        return this.userProfiles.get(userId) || null;
    }
}

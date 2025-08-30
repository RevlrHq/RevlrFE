import {
    PreloadingStrategy,
    MediaSearchResult,
    MediaSearchQuery,
} from '@/types/media-search';
import { SearchAnalyticsService } from './SearchAnalyticsService';
import { PersonalizationService } from './PersonalizationService';
import { MediaSearchCache } from './MediaSearchCache';
import { EventCategory } from '@/lib/constants/eventCategories';

export interface PreloadingOptions {
    enableCategoryPreloading?: boolean;
    enableUserPreloading?: boolean;
    enableTimeBasedPreloading?: boolean;
    enableTrendingPreloading?: boolean;
    enableSeasonalPreloading?: boolean;
    maxConcurrentPreloads?: number;
    preloadingInterval?: number; // in milliseconds
}

export class PreloadingService {
    private analyticsService: SearchAnalyticsService;
    private personalizationService: PersonalizationService;
    private cache: MediaSearchCache;
    private searchFunction: (
        query: MediaSearchQuery
    ) => Promise<MediaSearchResult>;
    private preloadingTimer: NodeJS.Timeout | null = null;
    private isPreloading = false;
    private options: Required<PreloadingOptions>;

    constructor(
        analyticsService: SearchAnalyticsService,
        personalizationService: PersonalizationService,
        cache: MediaSearchCache,
        searchFunction: (query: MediaSearchQuery) => Promise<MediaSearchResult>,
        options: PreloadingOptions = {}
    ) {
        this.analyticsService = analyticsService;
        this.personalizationService = personalizationService;
        this.cache = cache;
        this.searchFunction = searchFunction;

        this.options = {
            enableCategoryPreloading: true,
            enableUserPreloading: true,
            enableTimeBasedPreloading: true,
            enableTrendingPreloading: true,
            enableSeasonalPreloading: false,
            maxConcurrentPreloads: 5,
            preloadingInterval: 30 * 60 * 1000, // 30 minutes
            ...options,
        };
    }

    /**
     * Start automatic preloading
     */
    startPreloading(): void {
        if (this.preloadingTimer) {
            this.stopPreloading();
        }

        // Initial preload
        this.performPreloading();

        // Set up recurring preloading
        this.preloadingTimer = setInterval(() => {
            this.performPreloading();
        }, this.options.preloadingInterval);
    }

    /**
     * Stop automatic preloading
     */
    stopPreloading(): void {
        if (this.preloadingTimer) {
            clearInterval(this.preloadingTimer);
            this.preloadingTimer = null;
        }
    }

    /**
     * Perform comprehensive preloading
     */
    async performPreloading(): Promise<void> {
        if (this.isPreloading) {
            console.log('Preloading already in progress, skipping...');
            return;
        }

        this.isPreloading = true;
        console.log('Starting media search preloading...');

        try {
            const preloadingTasks: Promise<void>[] = [];

            // Popular queries preloading
            preloadingTasks.push(this.preloadPopularQueries());

            // Category-based preloading
            if (this.options.enableCategoryPreloading) {
                preloadingTasks.push(this.preloadCategoryBasedQueries());
            }

            // User-based preloading
            if (this.options.enableUserPreloading) {
                preloadingTasks.push(this.preloadUserBasedQueries());
            }

            // Time-based preloading
            if (this.options.enableTimeBasedPreloading) {
                preloadingTasks.push(this.preloadTimeBasedQueries());
            }

            // Trending preloading
            if (this.options.enableTrendingPreloading) {
                preloadingTasks.push(this.preloadTrendingQueries());
            }

            // Seasonal preloading
            if (this.options.enableSeasonalPreloading) {
                preloadingTasks.push(this.preloadSeasonalQueries());
            }

            // Execute preloading tasks with concurrency limit
            await this.executeConcurrentTasks(
                preloadingTasks,
                this.options.maxConcurrentPreloads
            );

            console.log('Media search preloading completed successfully');
        } catch (error) {
            console.debug('Error during preloading:', error);
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * Preload popular queries based on analytics
     */
    private async preloadPopularQueries(): Promise<void> {
        const analytics = this.analyticsService.getAnalytics();
        const popularQueries = analytics.topQueries
            .slice(0, 20)
            .map((q) => q.query);

        await this.preloadQueries(popularQueries, 'popular');
    }

    /**
     * Preload category-based queries
     */
    private async preloadCategoryBasedQueries(): Promise<void> {
        const categoryQueries = this.getCategoryBasedQueries();
        const preloadPromises: Promise<void>[] = [];

        Object.entries(categoryQueries).forEach(([category, queries]) => {
            preloadPromises.push(
                this.preloadQueries(
                    queries.slice(0, 10),
                    `category_${category}`
                )
            );
        });

        await Promise.all(preloadPromises);
    }

    /**
     * Preload user-based queries for active users
     */
    private async preloadUserBasedQueries(): Promise<void> {
        // Get active users from recent analytics
        const recentEvents = this.analyticsService
            .exportData()
            .events.filter(
                (event) =>
                    Date.now() - event.timestamp < 7 * 24 * 60 * 60 * 1000
            ) // Last 7 days
            .filter((event) => event.userId);

        const activeUsers = Array.from(
            new Set(recentEvents.map((event) => event.userId).filter(Boolean))
        ).slice(0, 50); // Limit to top 50 active users

        const preloadPromises = activeUsers.map(async (userId) => {
            const suggestions =
                this.personalizationService.getPersonalizedSearchSuggestions(
                    userId!,
                    5
                );
            await this.preloadQueries(suggestions, `user_${userId}`);
        });

        await Promise.all(preloadPromises);
    }

    /**
     * Preload time-based queries
     */
    private async preloadTimeBasedQueries(): Promise<void> {
        const timeBasedQueries = this.getTimeBasedQueries();
        const currentHour = new Date().getHours();

        // Preload for current hour and next 2 hours
        const relevantHours = [
            currentHour,
            (currentHour + 1) % 24,
            (currentHour + 2) % 24,
        ];

        const preloadPromises = relevantHours.map(async (hour) => {
            const queries = timeBasedQueries[hour.toString()] || [];
            await this.preloadQueries(queries, `time_${hour}`);
        });

        await Promise.all(preloadPromises);
    }

    /**
     * Preload trending queries
     */
    private async preloadTrendingQueries(): Promise<void> {
        const trendingQueries = this.analyticsService.getTrendingQueries(15);
        await this.preloadQueries(trendingQueries, 'trending');
    }

    /**
     * Preload seasonal queries
     */
    private async preloadSeasonalQueries(): Promise<void> {
        const seasonalQueries = this.getSeasonalQueries();
        const currentSeason = this.getCurrentSeason();

        const queries = seasonalQueries[currentSeason] || [];
        await this.preloadQueries(queries, `seasonal_${currentSeason}`);
    }

    /**
     * Preload specific queries with context
     */
    private async preloadQueries(
        queries: string[],
        context: string
    ): Promise<void> {
        const preloadPromises = queries.map(async (query) => {
            try {
                const cacheKey = `${query}_${context}`;

                if (!this.cache.has(cacheKey)) {
                    const searchQuery: MediaSearchQuery = {
                        query,
                        page: 1,
                        perPage: 30,
                    };

                    const result = await this.searchFunction(searchQuery);
                    this.cache.set(cacheKey, result);
                }
            } catch (error) {
                console.warn(
                    `Failed to preload query "${query}" for context "${context}":`,
                    error
                );
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Get category-based queries
     */
    private getCategoryBasedQueries(): Record<string, string[]> {
        return {
            [EventCategory.BusinessProfessional]: [
                'business meeting',
                'conference',
                'presentation',
                'corporate event',
                'networking',
                'seminar',
                'workshop',
                'professional',
                'office',
                'handshake',
                'team collaboration',
                'boardroom',
                'executive',
            ],
            [EventCategory.TechnologyInnovation]: [
                'technology',
                'innovation',
                'startup',
                'tech conference',
                'coding',
                'programming',
                'software',
                'digital',
                'computer',
                'artificial intelligence',
                'machine learning',
                'blockchain',
            ],
            [EventCategory.MusicEntertainment]: [
                'music concert',
                'festival',
                'performance',
                'band',
                'entertainment',
                'stage',
                'dancing',
                'party',
                'celebration',
                'live music',
                'dj',
                'nightclub',
                'audience',
            ],
            [EventCategory.FoodDrink]: [
                'food festival',
                'restaurant',
                'cooking',
                'culinary',
                'chef',
                'dining',
                'meal',
                'drink',
                'beverage',
                'kitchen',
                'recipe',
                'catering',
                'wine tasting',
            ],
            [EventCategory.SportsFitness]: [
                'sports event',
                'fitness',
                'gym',
                'exercise',
                'athletic',
                'competition',
                'training',
                'workout',
                'running',
                'cycling',
                'swimming',
                'team sports',
            ],
            [EventCategory.ArtsCulture]: [
                'art exhibition',
                'gallery',
                'museum',
                'painting',
                'sculpture',
                'creative',
                'artistic',
                'cultural event',
                'theater',
                'performance art',
                'installation',
            ],
            [EventCategory.EducationLearning]: [
                'education',
                'learning',
                'school',
                'university',
                'classroom',
                'teaching',
                'student',
                'academic',
                'course',
                'lecture',
                'study',
                'training',
            ],
            [EventCategory.HealthWellness]: [
                'health seminar',
                'wellness',
                'medical',
                'healthcare',
                'therapy',
                'meditation',
                'yoga',
                'mindfulness',
                'mental health',
                'nutrition',
                'spa',
            ],
        };
    }

    /**
     * Get time-based queries
     */
    private getTimeBasedQueries(): Record<string, string[]> {
        const queries: Record<string, string[]> = {};

        // Morning (6-11)
        for (let hour = 6; hour <= 11; hour++) {
            queries[hour.toString()] = [
                'morning meeting',
                'breakfast',
                'coffee',
                'sunrise',
                'early bird',
                'fresh start',
                'productivity',
            ];
        }

        // Afternoon (12-17)
        for (let hour = 12; hour <= 17; hour++) {
            queries[hour.toString()] = [
                'business meeting',
                'conference',
                'presentation',
                'professional',
                'office',
                'work',
                'corporate',
            ];
        }

        // Evening (18-22)
        for (let hour = 18; hour <= 22; hour++) {
            queries[hour.toString()] = [
                'entertainment',
                'music',
                'food',
                'social',
                'party',
                'celebration',
                'dinner',
                'nightlife',
            ];
        }

        // Night/Early Morning (23-5)
        for (let hour = 23; hour <= 23; hour++) {
            queries[hour.toString()] = [
                'creative',
                'art',
                'inspiration',
                'lifestyle',
                'peaceful',
                'quiet',
                'reflection',
            ];
        }
        for (let hour = 0; hour <= 5; hour++) {
            queries[hour.toString()] = [
                'creative',
                'art',
                'inspiration',
                'lifestyle',
                'peaceful',
                'quiet',
                'reflection',
            ];
        }

        return queries;
    }

    /**
     * Get seasonal queries
     */
    private getSeasonalQueries(): Record<string, string[]> {
        return {
            spring: [
                'spring',
                'flowers',
                'bloom',
                'fresh',
                'renewal',
                'garden',
                'nature',
                'growth',
                'outdoor',
            ],
            summer: [
                'summer',
                'beach',
                'vacation',
                'sun',
                'outdoor',
                'festival',
                'travel',
                'adventure',
                'bright',
            ],
            autumn: [
                'autumn',
                'fall',
                'leaves',
                'harvest',
                'cozy',
                'warm colors',
                'thanksgiving',
                'seasonal',
            ],
            winter: [
                'winter',
                'snow',
                'holiday',
                'celebration',
                'warm',
                'indoor',
                'festive',
                'new year',
            ],
        };
    }

    /**
     * Get current season
     */
    private getCurrentSeason(): string {
        const month = new Date().getMonth();

        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    /**
     * Execute tasks with concurrency limit
     */
    private async executeConcurrentTasks<T>(
        tasks: Promise<T>[],
        concurrencyLimit: number
    ): Promise<T[]> {
        const results: T[] = [];
        const executing: Promise<void>[] = [];

        for (const task of tasks) {
            const promise = task.then((result) => {
                results.push(result);
                executing.splice(executing.indexOf(promise), 1);
            });

            executing.push(promise);

            if (executing.length >= concurrencyLimit) {
                await Promise.race(executing);
            }
        }

        await Promise.all(executing);
        return results;
    }

    /**
     * Get preloading statistics
     */
    getPreloadingStats(): {
        isPreloading: boolean;
        cacheStats: any;
        lastPreloadTime: number | null;
        preloadingOptions: Required<PreloadingOptions>;
    } {
        return {
            isPreloading: this.isPreloading,
            cacheStats: this.cache.getPerformanceMetrics(),
            lastPreloadTime: null, // Would need to track this
            preloadingOptions: this.options,
        };
    }

    /**
     * Update preloading options
     */
    updateOptions(options: Partial<PreloadingOptions>): void {
        this.options = { ...this.options, ...options };

        // Restart preloading if interval changed
        if (options.preloadingInterval && this.preloadingTimer) {
            this.stopPreloading();
            this.startPreloading();
        }
    }

    /**
     * Force immediate preloading
     */
    async forcePreload(): Promise<void> {
        await this.performPreloading();
    }

    /**
     * Clear preloading cache
     */
    clearPreloadingCache(): void {
        this.cache.clear();
    }
}

import {
    SearchSuggestion,
    UserBehaviorPattern,
    PersonalizationData,
    MediaFilters,
} from '@/types/media-search';
import { SearchAnalyticsService } from './SearchAnalyticsService';
import { EventCategory } from '@/lib/constants/eventCategories';

export class SmartSuggestionsService {
    private analyticsService: SearchAnalyticsService;
    private categoryKeywords: Map<string, string[]> = new Map();
    private trendingCache: {
        suggestions: SearchSuggestion[];
        timestamp: number;
    } | null = null;
    private readonly TRENDING_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    constructor(analyticsService: SearchAnalyticsService) {
        this.analyticsService = analyticsService;
        this.initializeCategoryKeywords();
    }

    /**
     * Get smart suggestions based on query, user behavior, and context
     */
    async getSmartSuggestions(params: {
        query: string;
        userId?: string;
        eventCategory?: string;
        limit?: number;
        includeFilters?: boolean;
    }): Promise<SearchSuggestion[]> {
        const {
            query,
            userId,
            eventCategory,
            limit = 8,
            includeFilters = false,
        } = params;
        const suggestions: SearchSuggestion[] = [];

        // Get different types of suggestions
        const [
            querySuggestions,
            categorySuggestions,
            trendingSuggestions,
            personalizedSuggestions,
            filterSuggestions,
        ] = await Promise.all([
            this.getQueryBasedSuggestions(query, limit),
            this.getCategoryBasedSuggestions(query, eventCategory, limit),
            this.getTrendingSuggestions(query, limit),
            userId ? this.getPersonalizedSuggestions(query, userId, limit) : [],
            includeFilters
                ? this.getFilterSuggestions(query, eventCategory)
                : [],
        ]);

        // Combine and score suggestions
        suggestions.push(
            ...querySuggestions,
            ...categorySuggestions,
            ...trendingSuggestions,
            ...personalizedSuggestions,
            ...filterSuggestions
        );

        // Remove duplicates and sort by score
        const uniqueSuggestions = this.deduplicateAndScore(suggestions);

        return uniqueSuggestions.slice(0, limit);
    }

    /**
     * Get query-based suggestions using fuzzy matching and analytics
     */
    private async getQueryBasedSuggestions(
        query: string,
        limit: number
    ): Promise<SearchSuggestion[]> {
        const analytics = this.analyticsService.getAnalytics();
        const normalizedQuery = query.toLowerCase().trim();

        if (normalizedQuery.length < 2) {
            return [];
        }

        const suggestions: SearchSuggestion[] = [];

        // Match against popular queries
        analytics.topQueries.forEach((topQuery) => {
            const similarity = this.calculateStringSimilarity(
                normalizedQuery,
                topQuery.query.toLowerCase()
            );

            if (
                similarity > 0.3 &&
                topQuery.query.toLowerCase() !== normalizedQuery
            ) {
                suggestions.push({
                    text: topQuery.query,
                    type: 'query',
                    score: similarity * 0.8 + (topQuery.count / 100) * 0.2,
                    metadata: {
                        popularity: topQuery.count,
                        recentUsage: topQuery.avgResults,
                    },
                });
            }
        });

        // Add common completions
        const commonCompletions = this.getCommonCompletions(normalizedQuery);
        commonCompletions.forEach((completion) => {
            suggestions.push({
                text: completion,
                type: 'query',
                score: 0.6,
                metadata: {
                    popularity: 50,
                },
            });
        });

        return suggestions.slice(0, limit);
    }

    /**
     * Get category-based suggestions
     */
    private async getCategoryBasedSuggestions(
        query: string,
        eventCategory?: string,
        limit: number = 5
    ): Promise<SearchSuggestion[]> {
        const suggestions: SearchSuggestion[] = [];
        const normalizedQuery = query.toLowerCase().trim();

        if (eventCategory) {
            const categoryKeywords =
                this.categoryKeywords.get(eventCategory) || [];
            const popularCategoryQueries =
                this.analyticsService.getPopularQueriesForCategory(
                    eventCategory,
                    10
                );

            // Add category-specific keywords
            categoryKeywords.forEach((keyword) => {
                if (
                    keyword.toLowerCase().includes(normalizedQuery) ||
                    normalizedQuery.includes(keyword.toLowerCase())
                ) {
                    suggestions.push({
                        text: keyword,
                        type: 'category',
                        score: 0.7,
                        metadata: {
                            category: eventCategory,
                            popularity: 30,
                        },
                    });
                }
            });

            // Add popular queries for this category
            popularCategoryQueries.forEach((popularQuery) => {
                if (
                    popularQuery.toLowerCase().includes(normalizedQuery) &&
                    popularQuery.toLowerCase() !== normalizedQuery
                ) {
                    suggestions.push({
                        text: popularQuery,
                        type: 'category',
                        score: 0.8,
                        metadata: {
                            category: eventCategory,
                            popularity: 40,
                        },
                    });
                }
            });
        }

        return suggestions.slice(0, limit);
    }

    /**
     * Get trending suggestions
     */
    private async getTrendingSuggestions(
        query: string,
        limit: number = 3
    ): Promise<SearchSuggestion[]> {
        // Use cached trending suggestions if available and fresh
        if (
            this.trendingCache &&
            Date.now() - this.trendingCache.timestamp <
                this.TRENDING_CACHE_DURATION
        ) {
            return this.filterTrendingSuggestions(
                this.trendingCache.suggestions,
                query,
                limit
            );
        }

        // Generate new trending suggestions
        const trendingQueries = this.analyticsService.getTrendingQueries(20);
        const suggestions: SearchSuggestion[] = trendingQueries.map(
            (trendingQuery) => ({
                text: trendingQuery,
                type: 'trending',
                score: 0.6,
                metadata: {
                    popularity: 60,
                    recentUsage: Date.now(),
                },
            })
        );

        // Cache the results
        this.trendingCache = {
            suggestions,
            timestamp: Date.now(),
        };

        return this.filterTrendingSuggestions(suggestions, query, limit);
    }

    /**
     * Get personalized suggestions based on user behavior
     */
    private async getPersonalizedSuggestions(
        query: string,
        userId: string,
        limit: number = 3
    ): Promise<SearchSuggestion[]> {
        const userPattern =
            this.analyticsService.getUserBehaviorPattern(userId);
        if (!userPattern) {
            return [];
        }

        const suggestions: SearchSuggestion[] = [];
        const normalizedQuery = query.toLowerCase().trim();

        // Suggestions based on common search terms
        userPattern.commonSearchTerms.forEach((term) => {
            if (
                term.includes(normalizedQuery) ||
                normalizedQuery.includes(term)
            ) {
                suggestions.push({
                    text: term,
                    type: 'query',
                    score: 0.9,
                    metadata: {
                        userRelevance: 100,
                        popularity: 20,
                    },
                });
            }
        });

        // Suggestions based on category preferences
        Object.entries(userPattern.categoryPreferences)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .forEach(([category, frequency]) => {
                const categoryKeywords =
                    this.categoryKeywords.get(category) || [];
                categoryKeywords.forEach((keyword) => {
                    if (
                        keyword.toLowerCase().includes(normalizedQuery) &&
                        !suggestions.some((s) => s.text === keyword)
                    ) {
                        suggestions.push({
                            text: keyword,
                            type: 'category',
                            score: 0.8 + (frequency / 100) * 0.2,
                            metadata: {
                                category,
                                userRelevance: frequency,
                                popularity: 25,
                            },
                        });
                    }
                });
            });

        return suggestions.slice(0, limit);
    }

    /**
     * Get filter-based suggestions
     */
    private async getFilterSuggestions(
        query: string,
        eventCategory?: string
    ): Promise<SearchSuggestion[]> {
        const suggestions: SearchSuggestion[] = [];
        const normalizedQuery = query.toLowerCase().trim();

        // Suggest filters based on query content
        const filterSuggestions = this.analyzeQueryForFilters(
            normalizedQuery,
            eventCategory
        );

        filterSuggestions.forEach((filter) => {
            suggestions.push({
                text: filter.text,
                type: 'filter',
                score: filter.score,
                metadata: {
                    popularity: 15,
                },
            });
        });

        return suggestions;
    }

    /**
     * Analyze query to suggest relevant filters
     */
    private analyzeQueryForFilters(
        query: string,
        eventCategory?: string
    ): Array<{ text: string; score: number }> {
        const suggestions: Array<{ text: string; score: number }> = [];

        // Orientation suggestions
        if (query.includes('vertical') || query.includes('portrait')) {
            suggestions.push({ text: 'Portrait orientation', score: 0.8 });
        } else if (
            query.includes('horizontal') ||
            query.includes('landscape')
        ) {
            suggestions.push({ text: 'Landscape orientation', score: 0.8 });
        } else if (query.includes('square')) {
            suggestions.push({ text: 'Square orientation', score: 0.8 });
        }

        // Color suggestions
        const colors = [
            'red',
            'blue',
            'green',
            'yellow',
            'black',
            'white',
            'purple',
            'orange',
        ];
        colors.forEach((color) => {
            if (query.includes(color)) {
                suggestions.push({ text: `${color} color filter`, score: 0.7 });
            }
        });

        // Size suggestions
        if (
            query.includes('large') ||
            query.includes('big') ||
            query.includes('high resolution')
        ) {
            suggestions.push({ text: 'High resolution', score: 0.6 });
        } else if (query.includes('small') || query.includes('thumbnail')) {
            suggestions.push({ text: 'Small size', score: 0.6 });
        }

        // Category-specific filter suggestions
        if (eventCategory) {
            const categoryFilters =
                this.getCategorySpecificFilters(eventCategory);
            suggestions.push(...categoryFilters);
        }

        return suggestions;
    }

    /**
     * Get category-specific filter suggestions
     */
    private getCategorySpecificFilters(
        category: string
    ): Array<{ text: string; score: number }> {
        const filterMap: Record<
            string,
            Array<{ text: string; score: number }>
        > = {
            [EventCategory.BusinessProfessional]: [
                { text: 'Professional photos only', score: 0.7 },
                { text: 'High resolution', score: 0.6 },
                { text: 'Landscape orientation', score: 0.5 },
            ],
            [EventCategory.MusicEntertainment]: [
                { text: 'Vibrant colors', score: 0.7 },
                { text: 'High energy photos', score: 0.6 },
                { text: 'Square format', score: 0.5 },
            ],
            [EventCategory.FoodDrink]: [
                { text: 'High resolution', score: 0.8 },
                { text: 'Warm colors', score: 0.6 },
                { text: 'Close-up shots', score: 0.5 },
            ],
        };

        return filterMap[category] || [];
    }

    /**
     * Filter trending suggestions based on query relevance
     */
    private filterTrendingSuggestions(
        suggestions: SearchSuggestion[],
        query: string,
        limit: number
    ): SearchSuggestion[] {
        const normalizedQuery = query.toLowerCase().trim();

        if (normalizedQuery.length < 2) {
            return suggestions.slice(0, limit);
        }

        return suggestions
            .filter(
                (suggestion) =>
                    suggestion.text.toLowerCase().includes(normalizedQuery) ||
                    normalizedQuery.includes(suggestion.text.toLowerCase())
            )
            .slice(0, limit);
    }

    /**
     * Remove duplicates and score suggestions
     */
    private deduplicateAndScore(
        suggestions: SearchSuggestion[]
    ): SearchSuggestion[] {
        const uniqueMap = new Map<string, SearchSuggestion>();

        suggestions.forEach((suggestion) => {
            const key = suggestion.text.toLowerCase();
            const existing = uniqueMap.get(key);

            if (!existing || suggestion.score > existing.score) {
                uniqueMap.set(key, suggestion);
            }
        });

        return Array.from(uniqueMap.values()).sort((a, b) => b.score - a.score);
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity(str1: string, str2: string): number {
        const matrix = Array(str2.length + 1)
            .fill(null)
            .map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }

        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1, // deletion
                    matrix[j - 1][i] + 1, // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }

        const distance = matrix[str2.length][str1.length];
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - distance / maxLength;
    }

    /**
     * Get common query completions
     */
    private getCommonCompletions(query: string): string[] {
        const completions: Record<string, string[]> = {
            business: [
                'business meeting',
                'business conference',
                'business presentation',
            ],
            tech: ['technology conference', 'tech startup', 'tech innovation'],
            music: ['music concert', 'music festival', 'music performance'],
            food: ['food festival', 'food photography', 'food event'],
            sport: ['sports event', 'sports competition', 'sports team'],
            art: ['art exhibition', 'art gallery', 'art workshop'],
            education: [
                'education workshop',
                'education seminar',
                'education conference',
            ],
            health: ['health seminar', 'health workshop', 'health conference'],
            fashion: ['fashion show', 'fashion event', 'fashion photography'],
            travel: [
                'travel destination',
                'travel adventure',
                'travel photography',
            ],
        };

        const matches: string[] = [];
        Object.entries(completions).forEach(([key, values]) => {
            if (key.startsWith(query) || query.includes(key)) {
                matches.push(...values);
            }
        });

        return matches.slice(0, 5);
    }

    /**
     * Initialize category keywords mapping
     */
    private initializeCategoryKeywords(): void {
        this.categoryKeywords.set(EventCategory.BusinessProfessional, [
            'conference',
            'meeting',
            'presentation',
            'corporate',
            'professional',
            'networking',
            'seminar',
            'workshop',
            'business',
            'office',
            'handshake',
            'team',
            'collaboration',
            'boardroom',
            'executive',
        ]);

        this.categoryKeywords.set(EventCategory.TechnologyInnovation, [
            'technology',
            'tech',
            'innovation',
            'startup',
            'digital',
            'software',
            'coding',
            'programming',
            'computer',
            'data',
            'artificial intelligence',
            'machine learning',
            'blockchain',
            'cloud',
        ]);

        this.categoryKeywords.set(EventCategory.MusicEntertainment, [
            'music',
            'concert',
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
            'venue',
            'audience',
        ]);

        this.categoryKeywords.set(EventCategory.FoodDrink, [
            'food',
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
            'ingredients',
            'catering',
            'wine',
            'cocktail',
        ]);

        this.categoryKeywords.set(EventCategory.SportsFitness, [
            'sports',
            'fitness',
            'gym',
            'exercise',
            'athletic',
            'competition',
            'training',
            'health',
            'active',
            'workout',
            'running',
            'cycling',
            'swimming',
            'team sports',
            'marathon',
        ]);

        this.categoryKeywords.set(EventCategory.ArtsCulture, [
            'art',
            'culture',
            'gallery',
            'exhibition',
            'museum',
            'painting',
            'sculpture',
            'creative',
            'artistic',
            'cultural',
            'theater',
            'performance art',
            'installation',
            'contemporary',
        ]);

        this.categoryKeywords.set(EventCategory.EducationLearning, [
            'education',
            'learning',
            'school',
            'university',
            'academic',
            'classroom',
            'teaching',
            'student',
            'workshop',
            'training',
            'course',
            'lecture',
            'study',
            'knowledge',
            'skill development',
        ]);

        this.categoryKeywords.set(EventCategory.HealthWellness, [
            'health',
            'wellness',
            'medical',
            'healthcare',
            'therapy',
            'meditation',
            'yoga',
            'mindfulness',
            'wellbeing',
            'healing',
            'mental health',
            'physical therapy',
            'nutrition',
            'spa',
        ]);

        // Add more categories as needed...
    }

    /**
     * Update category keywords based on analytics
     */
    updateCategoryKeywords(category: string, keywords: string[]): void {
        const existing = this.categoryKeywords.get(category) || [];
        const updated = Array.from(new Set([...existing, ...keywords]));
        this.categoryKeywords.set(category, updated);
    }

    /**
     * Clear trending cache
     */
    clearTrendingCache(): void {
        this.trendingCache = null;
    }
}

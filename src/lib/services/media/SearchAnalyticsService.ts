import {
    SearchAnalyticsEvent,
    UserBehaviorPattern,
    SearchAnalytics,
    PersonalizationData,
    MediaFilters,
} from '@/types/media-search';

export class SearchAnalyticsService {
    private events: SearchAnalyticsEvent[] = [];
    private userPatterns: Map<string, UserBehaviorPattern> = new Map();
    private sessionId: string;
    private maxEvents: number = 10000; // Limit memory usage

    constructor() {
        this.sessionId = this.generateSessionId();
        this.loadFromStorage();
    }

    /**
     * Track a search analytics event
     */
    trackEvent(
        event: Omit<SearchAnalyticsEvent, 'id' | 'sessionId' | 'timestamp'>
    ): void {
        const analyticsEvent: SearchAnalyticsEvent = {
            ...event,
            id: this.generateEventId(),
            sessionId: this.sessionId,
            timestamp: Date.now(),
        };

        this.events.push(analyticsEvent);

        // Limit memory usage
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }

        // Update user behavior patterns
        if (event.userId) {
            this.updateUserBehaviorPattern(event.userId, analyticsEvent);
        }

        // Persist to storage periodically
        if (this.events.length % 10 === 0) {
            this.saveToStorage();
        }
    }

    /**
     * Track search event
     */
    trackSearch(params: {
        userId?: string;
        query: string;
        filters?: MediaFilters;
        totalResults: number;
        searchDuration: number;
        eventCategory?: string;
    }): void {
        this.trackEvent({
            eventType: 'search',
            ...params,
        });
    }

    /**
     * Track media selection event
     */
    trackSelection(params: {
        userId?: string;
        query?: string;
        providerId: string;
        mediaId: string;
        resultPosition: number;
        eventCategory?: string;
    }): void {
        this.trackEvent({
            eventType: 'select',
            ...params,
        });
    }

    /**
     * Track media download event
     */
    trackDownload(params: {
        userId?: string;
        providerId: string;
        mediaId: string;
        eventCategory?: string;
    }): void {
        this.trackEvent({
            eventType: 'download',
            ...params,
        });
    }

    /**
     * Track filter application event
     */
    trackFilterApplication(params: {
        userId?: string;
        filters: MediaFilters;
        query?: string;
        eventCategory?: string;
    }): void {
        this.trackEvent({
            eventType: 'filter_applied',
            ...params,
        });
    }

    /**
     * Get search analytics summary
     */
    getAnalytics(timeRange?: { start: number; end: number }): SearchAnalytics {
        const filteredEvents = timeRange
            ? this.events.filter(
                  (event) =>
                      event.timestamp >= timeRange.start &&
                      event.timestamp <= timeRange.end
              )
            : this.events;

        const searchEvents = filteredEvents.filter(
            (e) => e.eventType === 'search'
        );
        const selectionEvents = filteredEvents.filter(
            (e) => e.eventType === 'select'
        );

        // Calculate top queries
        const queryCount = new Map<
            string,
            { count: number; totalResults: number }
        >();
        searchEvents.forEach((event) => {
            if (event.query) {
                const existing = queryCount.get(event.query) || {
                    count: 0,
                    totalResults: 0,
                };
                queryCount.set(event.query, {
                    count: existing.count + 1,
                    totalResults:
                        existing.totalResults + (event.totalResults || 0),
                });
            }
        });

        const topQueries = Array.from(queryCount.entries())
            .map(([query, data]) => ({
                query,
                count: data.count,
                avgResults: Math.round(data.totalResults / data.count),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        // Calculate category usage
        const categoryCount = new Map<string, number>();
        filteredEvents.forEach((event) => {
            if (event.eventCategory) {
                categoryCount.set(
                    event.eventCategory,
                    (categoryCount.get(event.eventCategory) || 0) + 1
                );
            }
        });

        const topCategories = Array.from(categoryCount.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Calculate provider performance
        const providerStats = new Map<
            string,
            { searches: number; selections: number; responseTimes: number[] }
        >();

        searchEvents.forEach((event) => {
            if (event.providerId) {
                const stats = providerStats.get(event.providerId) || {
                    searches: 0,
                    selections: 0,
                    responseTimes: [],
                };
                stats.searches++;
                if (event.searchDuration) {
                    stats.responseTimes.push(event.searchDuration);
                }
                providerStats.set(event.providerId, stats);
            }
        });

        selectionEvents.forEach((event) => {
            if (event.providerId) {
                const stats = providerStats.get(event.providerId) || {
                    searches: 0,
                    selections: 0,
                    responseTimes: [],
                };
                stats.selections++;
                providerStats.set(event.providerId, stats);
            }
        });

        const providerPerformance = Array.from(providerStats.entries()).map(
            ([providerId, stats]) => ({
                providerId,
                searches: stats.searches,
                selections: stats.selections,
                avgResponseTime:
                    stats.responseTimes.length > 0
                        ? Math.round(
                              stats.responseTimes.reduce((a, b) => a + b, 0) /
                                  stats.responseTimes.length
                          )
                        : 0,
                errorRate: 0, // Would need error tracking
            })
        );

        // Calculate filter usage
        const filterUsage: Record<string, number> = {};
        filteredEvents
            .filter((e) => e.eventType === 'filter_applied' && e.filters)
            .forEach((event) => {
                if (event.filters) {
                    Object.keys(event.filters).forEach((filterKey) => {
                        filterUsage[filterKey] =
                            (filterUsage[filterKey] || 0) + 1;
                    });
                }
            });

        // Calculate time patterns
        const timePatterns: Record<string, number> = {};
        filteredEvents.forEach((event) => {
            const hour = new Date(event.timestamp).getHours();
            const timeSlot = `${hour}:00`;
            timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1;
        });

        // Calculate conversion rate
        const uniqueSearchSessions = new Set(
            searchEvents.map((e) => `${e.sessionId}-${e.query}`)
        ).size;
        const uniqueSelectionSessions = new Set(
            selectionEvents.map((e) => e.sessionId)
        ).size;
        const conversionRate =
            uniqueSearchSessions > 0
                ? uniqueSelectionSessions / uniqueSearchSessions
                : 0;

        return {
            totalSearches: searchEvents.length,
            uniqueUsers: new Set(
                filteredEvents.map((e) => e.userId).filter(Boolean)
            ).size,
            averageSearchDuration:
                searchEvents.length > 0
                    ? Math.round(
                          searchEvents
                              .filter((e) => e.searchDuration)
                              .reduce(
                                  (sum, e) => sum + (e.searchDuration || 0),
                                  0
                              ) /
                              searchEvents.filter((e) => e.searchDuration)
                                  .length
                      )
                    : 0,
            topQueries,
            topCategories,
            providerPerformance,
            filterUsage,
            timePatterns,
            conversionRate: Math.round(conversionRate * 100) / 100,
        };
    }

    /**
     * Get user behavior pattern
     */
    getUserBehaviorPattern(userId: string): UserBehaviorPattern | null {
        return this.userPatterns.get(userId) || null;
    }

    /**
     * Get trending queries based on recent activity
     */
    getTrendingQueries(limit: number = 10): string[] {
        const recentEvents = this.events.filter(
            (e) =>
                e.eventType === 'search' &&
                Date.now() - e.timestamp < 24 * 60 * 60 * 1000
        );

        const queryCount = new Map<string, number>();
        recentEvents.forEach((event) => {
            if (event.query) {
                queryCount.set(
                    event.query,
                    (queryCount.get(event.query) || 0) + 1
                );
            }
        });

        return Array.from(queryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query]) => query);
    }

    /**
     * Get popular queries for a specific category
     */
    getPopularQueriesForCategory(
        category: string,
        limit: number = 10
    ): string[] {
        const categoryEvents = this.events.filter(
            (e) => e.eventType === 'search' && e.eventCategory === category
        );

        const queryCount = new Map<string, number>();
        categoryEvents.forEach((event) => {
            if (event.query) {
                queryCount.set(
                    event.query,
                    (queryCount.get(event.query) || 0) + 1
                );
            }
        });

        return Array.from(queryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query]) => query);
    }

    /**
     * Update user behavior pattern
     */
    private updateUserBehaviorPattern(
        userId: string,
        event: SearchAnalyticsEvent
    ): void {
        let pattern = this.userPatterns.get(userId);

        if (!pattern) {
            pattern = {
                userId,
                preferredProviders: [],
                commonSearchTerms: [],
                preferredFilters: {},
                averageSelectionTime: 0,
                preferredImageSizes: [],
                categoryPreferences: {},
                timeOfDayPatterns: {},
                lastUpdated: Date.now(),
            };
        }

        // Update based on event type
        switch (event.eventType) {
            case 'search':
                if (event.query) {
                    this.updateCommonSearchTerms(pattern, event.query);
                }
                if (event.eventCategory) {
                    this.updateCategoryPreferences(
                        pattern,
                        event.eventCategory
                    );
                }
                break;

            case 'select':
                if (event.providerId) {
                    this.updatePreferredProviders(pattern, event.providerId);
                }
                break;

            case 'filter_applied':
                if (event.filters) {
                    this.updatePreferredFilters(pattern, event.filters);
                }
                break;
        }

        // Update time patterns
        const hour = new Date(event.timestamp).getHours();
        pattern.timeOfDayPatterns[hour] =
            (pattern.timeOfDayPatterns[hour] || 0) + 1;

        pattern.lastUpdated = Date.now();
        this.userPatterns.set(userId, pattern);
    }

    private updateCommonSearchTerms(
        pattern: UserBehaviorPattern,
        query: string
    ): void {
        const terms = query
            .toLowerCase()
            .split(' ')
            .filter((term) => term.length > 2);
        terms.forEach((term) => {
            if (!pattern.commonSearchTerms.includes(term)) {
                pattern.commonSearchTerms.push(term);
            }
        });

        // Keep only top 50 terms
        if (pattern.commonSearchTerms.length > 50) {
            pattern.commonSearchTerms = pattern.commonSearchTerms.slice(0, 50);
        }
    }

    private updatePreferredProviders(
        pattern: UserBehaviorPattern,
        providerId: string
    ): void {
        const index = pattern.preferredProviders.indexOf(providerId);
        if (index > -1) {
            // Move to front
            pattern.preferredProviders.splice(index, 1);
        }
        pattern.preferredProviders.unshift(providerId);

        // Keep only top 5 providers
        pattern.preferredProviders = pattern.preferredProviders.slice(0, 5);
    }

    private updateCategoryPreferences(
        pattern: UserBehaviorPattern,
        category: string
    ): void {
        pattern.categoryPreferences[category] =
            (pattern.categoryPreferences[category] || 0) + 1;
    }

    private updatePreferredFilters(
        pattern: UserBehaviorPattern,
        filters: MediaFilters
    ): void {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                (pattern.preferredFilters as any)[key] = value;
            }
        });
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save analytics data to localStorage
     */
    private saveToStorage(): void {
        try {
            const data = {
                events: this.events.slice(-1000), // Keep last 1000 events
                userPatterns: Array.from(this.userPatterns.entries()),
            };
            localStorage.setItem(
                'media-search-analytics',
                JSON.stringify(data)
            );
        } catch (error) {
            console.warn('Failed to save analytics to storage:', error);
        }
    }

    /**
     * Load analytics data from localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem('media-search-analytics');
            if (stored) {
                const data = JSON.parse(stored);
                this.events = data.events || [];
                this.userPatterns = new Map(data.userPatterns || []);
            }
        } catch (error) {
            console.warn('Failed to load analytics from storage:', error);
        }
    }

    /**
     * Clear all analytics data
     */
    clearData(): void {
        this.events = [];
        this.userPatterns.clear();
        localStorage.removeItem('media-search-analytics');
    }

    /**
     * Export analytics data
     */
    exportData(): {
        events: SearchAnalyticsEvent[];
        userPatterns: Array<[string, UserBehaviorPattern]>;
        analytics: SearchAnalytics;
    } {
        return {
            events: this.events,
            userPatterns: Array.from(this.userPatterns.entries()),
            analytics: this.getAnalytics(),
        };
    }
}

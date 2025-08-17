import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebouncedValue } from './useDebounce';
import { useApiErrorHandler } from './useErrorHandler';
import { withApiRetry } from '@/lib/error-handling/RetryMechanism';
// import { useOfflineAwareFetch } from '@/components/error-handling/OfflineIndicator';
import {
    OrganizerService,
    EventSummaryView,
    EventRegistrationSummary,
    AttendeeView,
} from '../lib/api';
import type { AdvancedFilterOptions } from '../components/AdvancedFilters';

export interface GlobalSearchResult {
    events: EventSummaryView[];
    registrations: EventRegistrationSummary[];
    attendees: AttendeeView[];
    totalResults: number;
    searchTime: number;
}

export interface SearchResultCounts {
    events: number;
    registrations: number;
    attendees: number;
    total: number;
}

export interface UseGlobalSearchOptions {
    debounceMs?: number;
    maxResultsPerType?: number;
    enableCaching?: boolean;
    cacheTimeout?: number;
}

export interface UseGlobalSearchResult {
    // Search state
    query: string;
    results: GlobalSearchResult | null;
    counts: SearchResultCounts;
    isSearching: boolean;
    hasSearched: boolean;

    // Error handling
    error: Error | null;
    hasError: boolean;
    clearError: () => void;

    // Search actions
    search: (
        searchQuery: string,
        filters?: Partial<AdvancedFilterOptions>
    ) => Promise<void>;
    clearSearch: () => void;

    // Individual searches
    searchEvents: (
        searchQuery: string,
        filters?: Partial<AdvancedFilterOptions>
    ) => Promise<EventSummaryView[]>;
    searchRegistrations: (
        searchQuery: string,
        filters?: Partial<AdvancedFilterOptions>
    ) => Promise<EventRegistrationSummary[]>;
    searchAttendees: (
        searchQuery: string,
        filters?: Partial<AdvancedFilterOptions>
    ) => Promise<AttendeeView[]>;

    // Search suggestions
    recentSearches: string[];
    popularSearches: string[];
    addToRecentSearches: (query: string) => void;
    clearRecentSearches: () => void;

    // Search analytics
    searchStats: {
        totalSearches: number;
        averageResultCount: number;
        mostSearchedTerms: Array<{ term: string; count: number }>;
    };
}

const MAX_RECENT_SEARCHES = 10;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface SearchCache {
    [key: string]: {
        results: GlobalSearchResult;
        timestamp: number;
    };
}

interface SearchStats {
    totalSearches: number;
    totalResults: number;
    searchTerms: Record<string, number>;
}

export const useGlobalSearch = (
    options: UseGlobalSearchOptions = {}
): UseGlobalSearchResult => {
    const {
        debounceMs = 300,
        maxResultsPerType = 10,
        enableCaching = true,
        cacheTimeout = CACHE_TIMEOUT,
    } = options;

    // State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GlobalSearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchCache, setSearchCache] = useState<SearchCache>({});

    // Error handling
    const errorHandler = useApiErrorHandler('GlobalSearch');
    // const { fetchWithOfflineSupport } = useOfflineAwareFetch();

    // Recent searches from localStorage
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('organizer-recent-searches');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Search statistics from localStorage
    const [searchStats, setSearchStats] = useState<SearchStats>(() => {
        if (typeof window === 'undefined')
            return { totalSearches: 0, totalResults: 0, searchTerms: {} };
        try {
            const saved = localStorage.getItem('organizer-search-stats');
            return saved
                ? JSON.parse(saved)
                : { totalSearches: 0, totalResults: 0, searchTerms: {} };
        } catch {
            return { totalSearches: 0, totalResults: 0, searchTerms: {} };
        }
    });

    // Debounced query for automatic search
    const debouncedQuery = useDebouncedValue(query, debounceMs);

    // Calculate result counts
    const counts = useMemo((): SearchResultCounts => {
        if (!results) {
            return { events: 0, registrations: 0, attendees: 0, total: 0 };
        }

        return {
            events: results.events.length,
            registrations: results.registrations.length,
            attendees: results.attendees.length,
            total: results.totalResults,
        };
    }, [results]);

    // Popular searches based on stats
    const popularSearches = useMemo(() => {
        return Object.entries(searchStats.searchTerms)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([term]) => term);
    }, [searchStats.searchTerms]);

    // Computed search analytics
    const computedSearchStats = useMemo(
        () => ({
            totalSearches: searchStats.totalSearches,
            averageResultCount:
                searchStats.totalSearches > 0
                    ? Math.round(
                          searchStats.totalResults / searchStats.totalSearches
                      )
                    : 0,
            mostSearchedTerms: Object.entries(searchStats.searchTerms)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([term, count]) => ({ term, count })),
        }),
        [searchStats]
    );

    // Generate cache key
    const getCacheKey = useCallback(
        (searchQuery: string, filters?: Partial<AdvancedFilterOptions>) => {
            return `${searchQuery}-${JSON.stringify(filters || {})}`;
        },
        []
    );

    // Check if cache is valid
    const isCacheValid = useCallback(
        (timestamp: number) => {
            return Date.now() - timestamp < cacheTimeout;
        },
        [cacheTimeout]
    );

    // Update search statistics
    const updateSearchStats = useCallback(
        (searchQuery: string, resultCount: number) => {
            const newStats = {
                totalSearches: searchStats.totalSearches + 1,
                totalResults: searchStats.totalResults + resultCount,
                searchTerms: {
                    ...searchStats.searchTerms,
                    [searchQuery]:
                        (searchStats.searchTerms[searchQuery] || 0) + 1,
                },
            };

            setSearchStats(newStats);

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    'organizer-search-stats',
                    JSON.stringify(newStats)
                );
            }
        },
        [searchStats]
    );

    // Add to recent searches
    const addToRecentSearches = useCallback(
        (searchQuery: string) => {
            if (!searchQuery.trim()) return;

            const newRecentSearches = [
                searchQuery,
                ...recentSearches.filter((s) => s !== searchQuery),
            ].slice(0, MAX_RECENT_SEARCHES);

            setRecentSearches(newRecentSearches);

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    'organizer-recent-searches',
                    JSON.stringify(newRecentSearches)
                );
            }
        },
        [recentSearches]
    );

    // Clear recent searches
    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('organizer-recent-searches');
        }
    }, []);

    // Search events
    const searchEvents = useCallback(
        async (
            searchQuery: string,
            filters?: Partial<AdvancedFilterOptions>
        ): Promise<EventSummaryView[]> => {
            const response = await withApiRetry(
                () =>
                    OrganizerService.getApiOrganizerEvents({
                        pageNumber: 1,
                        pageSize: maxResultsPerType,
                        searchTerm: searchQuery,
                        sortBy: filters?.sortBy || 'dateCreated',
                        sortOrder: filters?.sortOrder || 'desc',
                        status: filters?.status,
                        category: filters?.category,
                        startDate: filters?.startDate,
                        endDate: filters?.endDate,
                        isVirtual: filters?.isVirtual,
                        hasRegistrations: filters?.hasRegistrations,
                        minRevenue: filters?.minRevenue,
                        maxRevenue: filters?.maxRevenue,
                        minRegistrations: filters?.minRegistrations,
                        maxRegistrations: filters?.maxRegistrations,
                    }),
                { maxAttempts: 2, baseDelay: 500 }
            );

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to search events');
            }

            return response.data.items || [];
        },
        [maxResultsPerType]
    );

    // Search registrations
    const searchRegistrations = useCallback(
        async (
            searchQuery: string,
            filters?: Partial<AdvancedFilterOptions>
        ): Promise<EventRegistrationSummary[]> => {
            const response = await withApiRetry(
                () =>
                    OrganizerService.getApiOrganizerRegistrations({
                        pageNumber: 1,
                        pageSize: maxResultsPerType,
                        searchTerm: searchQuery,
                        sortBy: filters?.sortBy || 'registrationDate',
                        sortOrder: filters?.sortOrder || 'desc',
                        eventId: undefined, // Global search across all events
                        paymentStatus: filters?.paymentStatus,
                        isFinanced: filters?.isFinanced,
                        registrationStartDate: filters?.registrationStartDate,
                        registrationEndDate: filters?.registrationEndDate,
                        minAmount: filters?.minAmount,
                        maxAmount: filters?.maxAmount,
                    }),
                { maxAttempts: 2, baseDelay: 500 }
            );

            if (!response.success || !response.data) {
                throw new Error(
                    response.message || 'Failed to search registrations'
                );
            }

            return response.data.items || [];
        },
        [maxResultsPerType]
    );

    // Search attendees
    const searchAttendees = useCallback(
        async (
            searchQuery: string,
            filters?: Partial<AdvancedFilterOptions>
        ): Promise<AttendeeView[]> => {
            const response = await withApiRetry(
                () =>
                    OrganizerService.getApiOrganizerAttendees({
                        pageNumber: 1,
                        pageSize: maxResultsPerType,
                        searchTerm: filters?.attendeeSearchTerm || searchQuery,
                        sortBy: filters?.sortBy || 'lastRegistration',
                        sortOrder: filters?.sortOrder || 'desc',
                    }),
                { maxAttempts: 2, baseDelay: 500 }
            );

            if (!response.success || !response.data) {
                throw new Error(
                    response.message || 'Failed to search attendees'
                );
            }

            return response.data.items || [];
        },
        [maxResultsPerType]
    );

    // Main search function
    const search = useCallback(
        async (
            searchQuery: string,
            filters?: Partial<AdvancedFilterOptions>
        ) => {
            if (!searchQuery.trim()) {
                setResults(null);
                setHasSearched(false);
                return;
            }

            const cacheKey = getCacheKey(searchQuery, filters);

            // Check cache first
            if (
                enableCaching &&
                searchCache[cacheKey] &&
                isCacheValid(searchCache[cacheKey].timestamp)
            ) {
                setResults(searchCache[cacheKey].results);
                setHasSearched(true);
                return;
            }

            setIsSearching(true);
            errorHandler.clearError();

            const startTime = Date.now();

            try {
                // Perform parallel searches
                const [events, registrations, attendees] = await Promise.all([
                    searchEvents(searchQuery, filters),
                    searchRegistrations(searchQuery, filters),
                    searchAttendees(searchQuery, filters),
                ]);

                const searchTime = Date.now() - startTime;
                const totalResults =
                    events.length + registrations.length + attendees.length;

                const searchResult: GlobalSearchResult = {
                    events,
                    registrations,
                    attendees,
                    totalResults,
                    searchTime,
                };

                setResults(searchResult);
                setHasSearched(true);

                // Update cache
                if (enableCaching) {
                    setSearchCache((prev) => ({
                        ...prev,
                        [cacheKey]: {
                            results: searchResult,
                            timestamp: Date.now(),
                        },
                    }));
                }

                // Update statistics and recent searches
                updateSearchStats(searchQuery, totalResults);
                addToRecentSearches(searchQuery);
            } catch (error) {
                errorHandler.handleError(error as Error, 'search');
            } finally {
                setIsSearching(false);
            }
        },
        [
            getCacheKey,
            enableCaching,
            searchCache,
            isCacheValid,
            errorHandler,
            searchEvents,
            searchRegistrations,
            searchAttendees,
            updateSearchStats,
            addToRecentSearches,
        ]
    );

    // Clear search
    const clearSearch = useCallback(() => {
        setQuery('');
        setResults(null);
        setHasSearched(false);
        errorHandler.clearError();
    }, [errorHandler]);

    // Auto-search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim()) {
            search(debouncedQuery);
        }
    }, [debouncedQuery, search]);

    // Clean up old cache entries periodically
    useEffect(() => {
        const cleanup = () => {
            // const now = Date.now();
            const cleanedCache: SearchCache = {};

            Object.entries(searchCache).forEach(([key, value]) => {
                if (isCacheValid(value.timestamp)) {
                    cleanedCache[key] = value;
                }
            });

            setSearchCache(cleanedCache);
        };

        const interval = setInterval(cleanup, cacheTimeout);
        return () => clearInterval(interval);
    }, [searchCache, isCacheValid, cacheTimeout]);

    return {
        // Search state
        query,
        results,
        counts,
        isSearching,
        hasSearched,

        // Error handling
        error: errorHandler.error,
        hasError: errorHandler.hasError,
        clearError: errorHandler.clearError,

        // Search actions
        search,
        clearSearch,

        // Individual searches
        searchEvents,
        searchRegistrations,
        searchAttendees,

        // Search suggestions
        recentSearches,
        popularSearches,
        addToRecentSearches,
        clearRecentSearches,

        // Search analytics
        searchStats: computedSearchStats,
    };
};

export default useGlobalSearch;

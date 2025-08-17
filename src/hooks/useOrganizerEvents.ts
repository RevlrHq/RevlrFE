import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    EventSummaryView,
    PagedCollectionOfEventSummaryView,
} from '../lib/api';
import { useApiErrorHandler } from './useErrorHandler';
import { withApiRetry } from '@/lib/error-handling/RetryMechanism';
import { useOfflineAwareFetch } from '@/components/error-handling/OfflineIndicator';

export interface OrganizerEventFilters {
    // Pagination
    pageNumber?: number;
    pageSize?: number;

    // Sorting
    sortBy?: string;
    sortOrder?: string;

    // Search and filtering
    searchTerm?: string;
    status?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    isVirtual?: boolean;
    hasRegistrations?: boolean;
    minRevenue?: number;
    maxRevenue?: number;
    minRegistrations?: number;
    maxRegistrations?: number;
}

export interface UseOrganizerEventsResult {
    events: EventSummaryView[];
    loading: boolean;
    error: Error | null;
    isRetrying: boolean;
    retryCount: number;
    hasError: boolean;
    canRetry: boolean;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    fetchEvents: (
        page?: number,
        filters?: OrganizerEventFilters
    ) => Promise<void>;
    refetch: () => Promise<void>;
    retry: () => Promise<void>;
    clearError: () => void;
}

export const useOrganizerEvents = (
    initialPageSize: number = 10,
    initialFilters?: OrganizerEventFilters
): UseOrganizerEventsResult => {
    const [events, setEvents] = useState<EventSummaryView[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<OrganizerEventFilters>(
        initialFilters || {}
    );

    const errorHandler = useApiErrorHandler('OrganizerEvents');
    const { fetchWithOfflineSupport, isOnline } = useOfflineAwareFetch();

    const fetchEvents = useCallback(
        async (page: number = 1, newFilters?: OrganizerEventFilters) => {
            setLoading(true);
            errorHandler.clearError();

            const currentFilters = newFilters || filters;
            const cacheKey = `organizer-events-${page}-${JSON.stringify(currentFilters)}`;

            const result = await errorHandler.executeWithErrorHandling(
                async () => {
                    return await fetchWithOfflineSupport(
                        cacheKey,
                        async () => {
                            const response = await withApiRetry(
                                () =>
                                    OrganizerService.getApiOrganizerEvents({
                                        pageNumber: page,
                                        pageSize: pageSize,
                                        sortBy: currentFilters.sortBy,
                                        sortOrder: currentFilters.sortOrder,
                                        searchTerm: currentFilters.searchTerm,
                                        status: currentFilters.status,
                                        category: currentFilters.category,
                                        startDate: currentFilters.startDate,
                                        endDate: currentFilters.endDate,
                                        isVirtual: currentFilters.isVirtual,
                                        hasRegistrations:
                                            currentFilters.hasRegistrations,
                                        minRevenue: currentFilters.minRevenue,
                                        maxRevenue: currentFilters.maxRevenue,
                                        minRegistrations:
                                            currentFilters.minRegistrations,
                                        maxRegistrations:
                                            currentFilters.maxRegistrations,
                                    }),
                                {
                                    maxAttempts: 3,
                                    baseDelay: 1000,
                                    maxDelay: 5000,
                                }
                            );

                            if (!response.success || !response.data) {
                                throw new Error(
                                    response.message || 'Failed to fetch events'
                                );
                            }

                            return response.data as PagedCollectionOfEventSummaryView;
                        },
                        // Use current events as fallback when offline
                        page === currentPage
                            ? {
                                  items: events,
                                  metadata: { totalCount, totalPages },
                              }
                            : undefined
                    );
                },
                'fetch_events'
            );

            if (result) {
                setEvents(result.items || []);
                setTotalCount(result.metadata?.totalCount || 0);
                setTotalPages(result.metadata?.totalPages || 0);
                setCurrentPage(page);

                if (newFilters) {
                    setFilters(newFilters);
                }
            }

            setLoading(false);
        },
        [
            pageSize,
            filters,
            errorHandler,
            fetchWithOfflineSupport,
            events,
            totalCount,
            totalPages,
            currentPage,
        ]
    );

    const refetch = useCallback(() => {
        return fetchEvents(currentPage, filters);
    }, [fetchEvents, currentPage, filters]);

    const retry = useCallback(async () => {
        await errorHandler.retry();
    }, [errorHandler]);

    // Initial fetch
    useEffect(() => {
        fetchEvents(1, initialFilters);
    }, []);

    // Retry when coming back online
    useEffect(() => {
        if (isOnline && errorHandler.hasError) {
            const timer = setTimeout(() => {
                retry();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, errorHandler.hasError, retry]);

    return {
        events,
        loading,
        error: errorHandler.error,
        isRetrying: errorHandler.isRetrying,
        retryCount: errorHandler.retryCount,
        hasError: errorHandler.hasError,
        canRetry: errorHandler.canRetry,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages && totalPages > 0,
        hasPreviousPage: currentPage > 1,
        fetchEvents,
        refetch,
        retry,
        clearError: errorHandler.clearError,
    };
};

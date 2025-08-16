import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    EventSummaryView,
    PagedCollectionOfEventSummaryView,
} from '../lib/api';

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
    error: string | null;
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
}

export const useOrganizerEvents = (
    initialPageSize: number = 10,
    initialFilters?: OrganizerEventFilters
): UseOrganizerEventsResult => {
    const [events, setEvents] = useState<EventSummaryView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<OrganizerEventFilters>(
        initialFilters || {}
    );

    const fetchEvents = useCallback(
        async (page: number = 1, newFilters?: OrganizerEventFilters) => {
            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;

                const response = await OrganizerService.getApiOrganizerEvents({
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
                    hasRegistrations: currentFilters.hasRegistrations,
                    minRevenue: currentFilters.minRevenue,
                    maxRevenue: currentFilters.maxRevenue,
                    minRegistrations: currentFilters.minRegistrations,
                    maxRegistrations: currentFilters.maxRegistrations,
                });

                if (response.success && response.data) {
                    const pagedData =
                        response.data as PagedCollectionOfEventSummaryView;
                    setEvents(pagedData.items || []);
                    setTotalCount(pagedData.metadata?.totalCount || 0);
                    setTotalPages(pagedData.metadata?.totalPages || 0);
                    setCurrentPage(page);

                    if (newFilters) {
                        setFilters(newFilters);
                    }
                } else {
                    throw new Error(
                        response.message || 'Failed to fetch events'
                    );
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching events';
                setError(errorMessage);
                console.error('Error fetching organizer events:', err);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, filters]
    );

    const refetch = useCallback(() => {
        return fetchEvents(currentPage, filters);
    }, [fetchEvents, currentPage, filters]);

    // Initial fetch
    useEffect(() => {
        fetchEvents(1, initialFilters);
    }, []);

    return {
        events,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages && totalPages > 0,
        hasPreviousPage: currentPage > 1,
        fetchEvents,
        refetch,
    };
};

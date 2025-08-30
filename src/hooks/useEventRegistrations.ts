import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    EventRegistrationView,
    PagedCollectionOfEventRegistrationView,
} from '../lib/api';

export interface EventRegistrationFilters {
    // Pagination
    pageNumber?: number;
    pageSize?: number;

    // Sorting
    sortBy?: string;
    sortOrder?: string;
}

export interface UseEventRegistrationsResult {
    registrations: EventRegistrationView[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    fetchRegistrations: (
        page?: number,
        filters?: EventRegistrationFilters
    ) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useEventRegistrations = (
    eventId: string,
    initialPageSize: number = 10,
    initialFilters?: EventRegistrationFilters
): UseEventRegistrationsResult => {
    const [registrations, setRegistrations] = useState<EventRegistrationView[]>(
        []
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<EventRegistrationFilters>(
        initialFilters || {}
    );

    const fetchRegistrations = useCallback(
        async (page: number = 1, newFilters?: EventRegistrationFilters) => {
            if (!eventId) {
                setError('Event ID is required');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;

                const response =
                    await OrganizerService.getApiOrganizerEventsRegistrations({
                        eventId,
                        pageNumber: page,
                        pageSize: pageSize,
                        sortBy: currentFilters.sortBy,
                        sortOrder: currentFilters.sortOrder,
                    });

                if (response.success && response.data) {
                    const pagedData =
                        response.data as PagedCollectionOfEventRegistrationView;
                    setRegistrations(pagedData.items || []);
                    setTotalCount(pagedData.metadata?.totalCount || 0);
                    setTotalPages(pagedData.metadata?.totalPages || 0);
                    setCurrentPage(page);

                    if (newFilters) {
                        setFilters(newFilters);
                    }
                } else {
                    throw new Error(
                        response.message ||
                            'Failed to fetch event registrations'
                    );
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching event registrations';
                setError(errorMessage);
                console.debug('Error fetching event registrations:', err);
            } finally {
                setLoading(false);
            }
        },
        [eventId, pageSize, filters]
    );

    const refetch = useCallback(() => {
        return fetchRegistrations(currentPage, filters);
    }, [fetchRegistrations, currentPage, filters]);

    // Initial fetch
    useEffect(() => {
        if (eventId) {
            fetchRegistrations(1, initialFilters);
        }
    }, [eventId]);

    return {
        registrations,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages && totalPages > 0,
        hasPreviousPage: currentPage > 1,
        fetchRegistrations,
        refetch,
    };
};

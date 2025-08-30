import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    EventRegistrationSummary,
    PagedCollectionOfEventRegistrationSummary,
} from '../lib/api';

export interface RegistrationFilters {
    // Pagination
    pageNumber?: number;
    pageSize?: number;

    // Sorting
    sortBy?: string;
    sortOrder?: string;

    // Search and filtering
    searchTerm?: string;
    eventId?: string;
    paymentStatus?: string;
    isFinanced?: boolean;
    registrationStartDate?: string;
    registrationEndDate?: string;
    minAmount?: number;
    maxAmount?: number;
}

export interface UseOrganizerRegistrationsResult {
    registrations: EventRegistrationSummary[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    fetchRegistrations: (
        page?: number,
        filters?: RegistrationFilters
    ) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useOrganizerRegistrations = (
    initialPageSize: number = 10,
    initialFilters?: RegistrationFilters
): UseOrganizerRegistrationsResult => {
    const [registrations, setRegistrations] = useState<
        EventRegistrationSummary[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<RegistrationFilters>(
        initialFilters || {}
    );

    const fetchRegistrations = useCallback(
        async (page: number = 1, newFilters?: RegistrationFilters) => {
            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;

                const response =
                    await OrganizerService.getApiOrganizerRegistrations({
                        pageNumber: page,
                        pageSize: pageSize,
                        sortBy: currentFilters.sortBy,
                        sortOrder: currentFilters.sortOrder,
                        searchTerm: currentFilters.searchTerm,
                        eventId: currentFilters.eventId,
                        paymentStatus: currentFilters.paymentStatus,
                        isFinanced: currentFilters.isFinanced,
                        registrationStartDate:
                            currentFilters.registrationStartDate,
                        registrationEndDate: currentFilters.registrationEndDate,
                        minAmount: currentFilters.minAmount,
                        maxAmount: currentFilters.maxAmount,
                    });

                if (response.success && response.data) {
                    const pagedData =
                        response.data as PagedCollectionOfEventRegistrationSummary;
                    setRegistrations(pagedData.items || []);
                    setTotalCount(pagedData.metadata?.totalCount || 0);
                    setTotalPages(pagedData.metadata?.totalPages || 0);
                    setCurrentPage(page);

                    if (newFilters) {
                        setFilters(newFilters);
                    }
                } else {
                    throw new Error(
                        response.message || 'Failed to fetch registrations'
                    );
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching registrations';
                setError(errorMessage);
                console.debug('Error fetching organizer registrations:', err);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, filters]
    );

    const refetch = useCallback(() => {
        return fetchRegistrations(currentPage, filters);
    }, [fetchRegistrations, currentPage, filters]);

    // Initial fetch
    useEffect(() => {
        fetchRegistrations(1, initialFilters);
    }, []);

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

import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    AttendeeView,
    PagedCollectionOfAttendeeView,
} from '../lib/api';

export interface AttendeeFilters {
    // Pagination
    pageNumber?: number;
    pageSize?: number;

    // Sorting
    sortBy?: string;
    sortOrder?: string;

    // Search
    searchTerm?: string;
}

export interface UseOrganizerAttendeesResult {
    attendees: AttendeeView[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    fetchAttendees: (page?: number, filters?: AttendeeFilters) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useOrganizerAttendees = (
    initialPageSize: number = 10,
    initialFilters?: AttendeeFilters
): UseOrganizerAttendeesResult => {
    const [attendees, setAttendees] = useState<AttendeeView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<AttendeeFilters>(
        initialFilters || {}
    );

    const fetchAttendees = useCallback(
        async (page: number = 1, newFilters?: AttendeeFilters) => {
            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;

                const response =
                    await OrganizerService.getApiOrganizerAttendees({
                        pageNumber: page,
                        pageSize: pageSize,
                        sortBy: currentFilters.sortBy,
                        sortOrder: currentFilters.sortOrder,
                        searchTerm: currentFilters.searchTerm,
                    });

                if (response.success && response.data) {
                    const pagedData =
                        response.data as PagedCollectionOfAttendeeView;
                    setAttendees(pagedData.items || []);
                    setTotalCount(pagedData.metadata?.totalCount || 0);
                    setTotalPages(pagedData.metadata?.totalPages || 0);
                    setCurrentPage(page);

                    if (newFilters) {
                        setFilters(newFilters);
                    }
                } else {
                    throw new Error(
                        response.message || 'Failed to fetch attendees'
                    );
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching attendees';
                setError(errorMessage);
                console.error('Error fetching organizer attendees:', err);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, filters]
    );

    const refetch = useCallback(() => {
        return fetchAttendees(currentPage, filters);
    }, [fetchAttendees, currentPage, filters]);

    // Initial fetch
    useEffect(() => {
        fetchAttendees(1, initialFilters);
    }, []);

    return {
        attendees,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages && totalPages > 0,
        hasPreviousPage: currentPage > 1,
        fetchAttendees,
        refetch,
    };
};

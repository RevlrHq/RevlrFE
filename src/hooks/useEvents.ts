import { useState, useEffect, useCallback } from 'react';
import {
    EventsService,
    EventView2,
    PagedCollectionOfEventView,
} from '../lib/services';

export interface EventFilters {
    // Pagination
    PageNumber?: number;
    PageSize?: number;

    // Sorting
    SortBy?: string;
    SortOrder?: string;

    // Search and filtering
    SearchTerm?: string;
    StartDate?: string;
    EndDate?: string;
    LocationType?: number | string;
    IncludeTickets?: boolean;
    MinPrice?: number;
    MaxPrice?: number;

    // Category filtering
    Category?: string;
    Categories?: string[];

    // Additional filters
    Status?: string;
    Organizer?: string;
    City?: string;
    IncludePastEvents?: boolean;
}

export interface UseEventsResult {
    events: EventView2[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    fetchEvents: (page?: number, filters?: EventFilters) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useEvents = (
    initialPageSize: number = 8,
    initialFilters?: EventFilters
): UseEventsResult => {
    const [events, setEvents] = useState<EventView2[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<EventFilters>(initialFilters || {});

    const fetchEvents = useCallback(
        async (page: number = 1, newFilters?: EventFilters) => {
            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;

                // Build API parameters according to the new documentation
                const apiParams: Record<string, unknown> = {
                    // Pagination (1-based as per API docs)
                    PageNumber: page,
                    PageSize: pageSize,

                    // Sorting
                    SortBy: currentFilters.SortBy,
                    SortOrder: currentFilters.SortOrder,

                    // Search and filtering
                    SearchTerm: currentFilters.SearchTerm,
                    StartDate: currentFilters.StartDate,
                    EndDate: currentFilters.EndDate,
                    LocationType: currentFilters.LocationType,
                    IncludeTickets:
                        currentFilters.IncludeTickets !== undefined
                            ? currentFilters.IncludeTickets
                            : true,
                    MinPrice: currentFilters.MinPrice,
                    MaxPrice: currentFilters.MaxPrice,

                    // Category filtering - handle both single and multiple categories
                    Category:
                        currentFilters.Category &&
                        currentFilters.Category !== 'All'
                            ? currentFilters.Category
                            : undefined,

                    // Additional filters
                    Status: currentFilters.Status,
                    Organizer: currentFilters.Organizer,
                    City: currentFilters.City,
                    IncludePastEvents: currentFilters.IncludePastEvents,
                };

                // Handle multiple categories - append each category separately as per API docs
                if (
                    currentFilters.Categories &&
                    currentFilters.Categories.length > 0
                ) {
                    // For now, use the first category as the main Category parameter
                    // The API documentation shows Categories as array but the service only accepts single category
                    apiParams.Category = currentFilters.Categories[0];
                }

                // Remove undefined values to avoid sending empty parameters
                Object.keys(apiParams).forEach((key) => {
                    if (
                        apiParams[key] === undefined ||
                        apiParams[key] === null ||
                        apiParams[key] === ''
                    ) {
                        delete apiParams[key];
                    }
                });

                console.log('API Parameters:', apiParams); // Debug log

                const response = await EventsService.getApiEvents({
                    pageNumber: apiParams.PageNumber as number,
                    pageSize: apiParams.PageSize as number,
                    sortBy: apiParams.SortBy as string,
                    sortOrder: apiParams.SortOrder as string,
                    searchTerm: apiParams.SearchTerm as string,
                    category: apiParams.Category as string,
                    categories: currentFilters.Categories,
                    startDate: apiParams.StartDate as string,
                    endDate: apiParams.EndDate as string,
                    locationType: apiParams.LocationType as string | number,
                    minPrice: apiParams.MinPrice as number,
                    maxPrice: apiParams.MaxPrice as number,
                    includeTickets: apiParams.IncludeTickets as boolean,
                    status: apiParams.Status as string,
                    organizer: apiParams.Organizer as string,
                    city: apiParams.City as string,
                    includePastEvents: apiParams.IncludePastEvents as boolean,
                });

                if (response.data && response.success) {
                    const pagedData =
                        response.data as PagedCollectionOfEventView;
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
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        },
        [filters, pageSize]
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

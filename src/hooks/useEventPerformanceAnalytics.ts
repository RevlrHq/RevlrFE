import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    EventSummaryView,
    EventPerformanceView,
    StandardResponseOfListOfEventSummaryView,
    StandardResponseOfEventPerformanceView,
} from '../lib/api';

export interface EventPerformanceFilters {
    maxEvents?: number;
    timeRange?: {
        startDate?: string;
        endDate?: string;
    };
}

export interface UseEventPerformanceAnalyticsResult {
    topPerformingEvents: EventSummaryView[] | null;
    eventPerformance: EventPerformanceView | null;
    loading: boolean;
    error: string | null;
    fetchTopPerforming: (filters?: EventPerformanceFilters) => Promise<void>;
    fetchEventPerformance: (eventId: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useEventPerformanceAnalytics = (
    initialFilters?: EventPerformanceFilters
): UseEventPerformanceAnalyticsResult => {
    const [topPerformingEvents, setTopPerformingEvents] = useState<
        EventSummaryView[] | null
    >(null);
    const [eventPerformance, setEventPerformance] =
        useState<EventPerformanceView | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<EventPerformanceFilters>(
        initialFilters || { maxEvents: 10 }
    );

    const fetchTopPerforming = useCallback(
        async (newFilters?: EventPerformanceFilters) => {
            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;

                const response =
                    await OrganizerService.getApiOrganizerEventsTopPerforming({
                        count: currentFilters.maxEvents || 10,
                        startDate:
                            currentFilters.timeRange?.startDate || undefined,
                        endDate: currentFilters.timeRange?.endDate || undefined,
                    });

                if (response.success && response.data) {
                    setTopPerformingEvents(response.data);

                    if (newFilters) {
                        setFilters(newFilters);
                    }
                } else {
                    throw new Error(
                        response.message ||
                            'Failed to fetch top performing events'
                    );
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching top performing events';
                setError(errorMessage);
                console.error('Error fetching top performing events:', err);
            } finally {
                setLoading(false);
            }
        },
        [filters]
    );

    const fetchEventPerformance = useCallback(async (eventId: string) => {
        if (!eventId) {
            setError('Event ID is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response =
                await OrganizerService.getApiOrganizerEventsPerformance({
                    eventId,
                });

            if (response.success && response.data) {
                setEventPerformance(response.data);
            } else {
                throw new Error(
                    response.message || 'Failed to fetch event performance'
                );
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'An error occurred while fetching event performance';
            setError(errorMessage);
            console.error('Error fetching event performance:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        await fetchTopPerforming(filters);
    }, [fetchTopPerforming, filters]);

    // Initial fetch
    useEffect(() => {
        if (initialFilters) {
            fetchTopPerforming(initialFilters);
        }
    }, []);

    return {
        topPerformingEvents,
        eventPerformance,
        loading,
        error,
        fetchTopPerforming,
        fetchEventPerformance,
        refetch,
    };
};

export default useEventPerformanceAnalytics;

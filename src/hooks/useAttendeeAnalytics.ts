import { useState, useEffect, useCallback } from 'react';
import { OrganizerService, AttendeeAnalyticsView } from '../lib/api';

export interface UseAttendeeAnalyticsResult {
    analytics: AttendeeAnalyticsView | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useAttendeeAnalytics = (): UseAttendeeAnalyticsResult => {
    const [analytics, setAnalytics] = useState<AttendeeAnalyticsView | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await OrganizerService.getApiOrganizerAttendeesAnalytics();

            if (response.success && response.data) {
                setAnalytics(response.data);
            } else {
                throw new Error(
                    response.message || 'Failed to fetch attendee analytics'
                );
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'An error occurred while fetching attendee analytics';
            setError(errorMessage);
            console.debug('Error fetching attendee analytics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        return fetchAnalytics();
    }, [fetchAnalytics]);

    // Initial fetch
    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return {
        analytics,
        loading,
        error,
        refetch,
    };
};

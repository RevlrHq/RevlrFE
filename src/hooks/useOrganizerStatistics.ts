import { useState, useEffect, useCallback } from 'react';
import { OrganizerService, EventStatistics2 } from '../lib/api';

export interface UseOrganizerStatisticsResult {
    data: EventStatistics2 | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useOrganizerStatistics = (): UseOrganizerStatisticsResult => {
    const [data, setData] = useState<EventStatistics2 | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await OrganizerService.getApiOrganizerStatistics();

            if (response.success && response.data) {
                setData(response.data);
            } else {
                throw new Error(
                    response.message || 'Failed to fetch statistics data'
                );
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'An error occurred while fetching statistics data';
            setError(errorMessage);
            console.error('Error fetching organizer statistics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        return fetchStatistics();
    }, [fetchStatistics]);

    // Initial fetch
    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    return {
        data,
        loading,
        error,
        refetch,
    };
};

import { useState, useEffect, useCallback } from 'react';
import { OrganizerService, OrganizerDashboardView } from '../lib/api';

export interface UseOrganizerDashboardResult {
    data: OrganizerDashboardView | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export const useOrganizerDashboard = (): UseOrganizerDashboardResult => {
    const [data, setData] = useState<OrganizerDashboardView | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await OrganizerService.getApiOrganizerDashboard();

            if (!response.success || !response.data) {
                throw new Error(
                    response.errors?.[0] || 'Failed to fetch dashboard data'
                );
            }

            setData(response.data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        await fetchDashboard();
    }, [fetchDashboard]);

    // Initial fetch
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return {
        data,
        loading,
        error,
        refetch,
    };
};

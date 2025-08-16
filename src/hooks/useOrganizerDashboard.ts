import { useState, useEffect, useCallback } from 'react';
import { OrganizerService, OrganizerDashboardView } from '../lib/api';

export interface UseOrganizerDashboardResult {
    data: OrganizerDashboardView | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export const useOrganizerDashboard = (): UseOrganizerDashboardResult => {
    const [data, setData] = useState<OrganizerDashboardView | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await OrganizerService.getApiOrganizerDashboard();

            if (response.success && response.data) {
                setData(response.data);
            } else {
                throw new Error(
                    response.message || 'Failed to fetch dashboard data'
                );
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'An error occurred while fetching dashboard data';
            setError(errorMessage);
            console.error('Error fetching organizer dashboard:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        return fetchDashboard();
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

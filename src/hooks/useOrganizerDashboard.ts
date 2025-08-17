import { useState, useEffect, useCallback } from 'react';
import { OrganizerService, OrganizerDashboardView } from '../lib/api';
import { useApiErrorHandler } from './useErrorHandler';
import { withApiRetry } from '@/lib/error-handling/RetryMechanism';
import { useOfflineAwareFetch } from '@/components/error-handling/OfflineIndicator';

export interface UseOrganizerDashboardResult {
    data: OrganizerDashboardView | null;
    loading: boolean;
    error: Error | null;
    isRetrying: boolean;
    retryCount: number;
    hasError: boolean;
    canRetry: boolean;
    refetch: () => Promise<void>;
    retry: () => Promise<void>;
    clearError: () => void;
}

export const useOrganizerDashboard = (): UseOrganizerDashboardResult => {
    const [data, setData] = useState<OrganizerDashboardView | null>(null);
    const [loading, setLoading] = useState(false);

    const errorHandler = useApiErrorHandler('OrganizerDashboard');
    const { fetchWithOfflineSupport, isOnline } = useOfflineAwareFetch();

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        errorHandler.clearError();

        const result = await errorHandler.executeWithErrorHandling(async () => {
            return await fetchWithOfflineSupport(
                'organizer-dashboard',
                async () => {
                    const response = await withApiRetry(
                        () => OrganizerService.getApiOrganizerDashboard(),
                        {
                            maxAttempts: 3,
                            baseDelay: 1000,
                            maxDelay: 5000,
                        }
                    );

                    if (!response.success || !response.data) {
                        throw new Error(
                            response.message || 'Failed to fetch dashboard data'
                        );
                    }

                    return response.data;
                },
                data // Use current data as fallback when offline
            );
        }, 'fetch_dashboard');

        if (result) {
            setData(result);
        }

        setLoading(false);
    }, [errorHandler, fetchWithOfflineSupport, data]);

    const refetch = useCallback(async () => {
        await fetchDashboard();
    }, [fetchDashboard]);

    const retry = useCallback(async () => {
        await errorHandler.retry();
    }, [errorHandler]);

    // Initial fetch
    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // Retry when coming back online
    useEffect(() => {
        if (isOnline && errorHandler.hasError) {
            const timer = setTimeout(() => {
                retry();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, errorHandler.hasError, retry]);

    return {
        data,
        loading,
        error: errorHandler.error,
        isRetrying: errorHandler.isRetrying,
        retryCount: errorHandler.retryCount,
        hasError: errorHandler.hasError,
        canRetry: errorHandler.canRetry,
        refetch,
        retry,
        clearError: errorHandler.clearError,
    };
};

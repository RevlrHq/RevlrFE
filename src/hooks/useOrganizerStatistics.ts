import { useState, useEffect, useCallback } from 'react';
import { OrganizerService, EventStatistics2 } from '../lib/api';
import { useApiErrorHandler } from './useErrorHandler';
import { withApiRetry } from '@/lib/error-handling/RetryMechanism';
import { useOfflineAwareFetch } from '@/components/error-handling/OfflineIndicator';

export interface UseOrganizerStatisticsResult {
    data: EventStatistics2 | null;
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

export const useOrganizerStatistics = (): UseOrganizerStatisticsResult => {
    const [data, setData] = useState<EventStatistics2 | null>(null);
    const [loading, setLoading] = useState(false);

    const errorHandler = useApiErrorHandler('OrganizerStatistics');
    const { fetchWithOfflineSupport, isOnline } = useOfflineAwareFetch();

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        errorHandler.clearError();

        const result = await errorHandler.executeWithErrorHandling(async () => {
            return await fetchWithOfflineSupport(
                'organizer-statistics',
                async () => {
                    const response = await withApiRetry(
                        () => OrganizerService.getApiOrganizerStatistics(),
                        {
                            maxAttempts: 3,
                            baseDelay: 1000,
                            maxDelay: 5000,
                        }
                    );

                    if (!response.success || !response.data) {
                        throw new Error(
                            response.message ||
                                'Failed to fetch statistics data'
                        );
                    }

                    return response.data;
                },
                data // Use current data as fallback when offline
            );
        }, 'fetch_statistics');

        if (result) {
            setData(result);
        }

        setLoading(false);
    }, [errorHandler, fetchWithOfflineSupport, data]);

    const refetch = useCallback(async () => {
        await fetchStatistics();
    }, [fetchStatistics]);

    const retry = useCallback(async () => {
        await errorHandler.retry();
    }, [errorHandler]);

    // Initial fetch
    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

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

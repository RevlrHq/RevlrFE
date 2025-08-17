/**
 * Custom hook for centralized error handling with retry mechanisms
 */

import { useState, useCallback, useRef } from 'react';
import { errorLogger } from '@/lib/error-handling/ErrorLogger';
import {
    RetryMechanism,
    RetryConfig,
} from '@/lib/error-handling/RetryMechanism';
import { useOnlineStatus } from './useOnlineStatus';

export interface ErrorState {
    error: Error | null;
    isRetrying: boolean;
    retryCount: number;
    lastRetryAt: number | null;
}

export interface UseErrorHandlerOptions {
    maxRetries?: number;
    retryConfig?: Partial<RetryConfig>;
    onError?: (error: Error) => void;
    onRetry?: () => void;
    onMaxRetriesReached?: (error: Error) => void;
    component?: string;
}

export interface UseErrorHandlerReturn {
    error: Error | null;
    isRetrying: boolean;
    retryCount: number;
    hasError: boolean;
    canRetry: boolean;
    handleError: (error: Error, context?: string) => void;
    retry: () => Promise<void>;
    clearError: () => void;
    executeWithErrorHandling: <T>(
        operation: () => Promise<T>,
        context?: string
    ) => Promise<T | null>;
}

export const useErrorHandler = (
    options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn => {
    const {
        maxRetries = 3,
        retryConfig = {},
        onError,
        onRetry,
        onMaxRetriesReached,
        component = 'Unknown',
    } = options;

    const [errorState, setErrorState] = useState<ErrorState>({
        error: null,
        isRetrying: false,
        retryCount: 0,
        lastRetryAt: null,
    });

    const isOnline = useOnlineStatus();
    const lastOperationRef = useRef<(() => Promise<unknown>) | null>(null);

    const handleError = useCallback(
        (error: Error, context?: string) => {
            // Log the error
            errorLogger.logError(
                error,
                {
                    component,
                    action: context || 'unknown',
                    metadata: {
                        retryCount: errorState.retryCount,
                        isOnline,
                    },
                },
                'medium'
            );

            setErrorState((prev) => ({
                ...prev,
                error,
            }));

            // Call custom error handler
            onError?.(error);
        },
        [component, errorState.retryCount, isOnline, onError]
    );

    const clearError = useCallback(() => {
        setErrorState({
            error: null,
            isRetrying: false,
            retryCount: 0,
            lastRetryAt: null,
        });
        lastOperationRef.current = null;
    }, []);

    const retry = useCallback(async () => {
        const { error, retryCount } = errorState;

        if (!error || !lastOperationRef.current || retryCount >= maxRetries) {
            return;
        }

        setErrorState((prev) => ({
            ...prev,
            isRetrying: true,
        }));

        onRetry?.();

        try {
            const result = await RetryMechanism.retry(
                lastOperationRef.current,
                {
                    maxAttempts: 1, // Single retry attempt since we're managing retries ourselves
                    ...retryConfig,
                }
            );

            if (result.success) {
                clearError();
            } else {
                throw result.error;
            }
        } catch (retryError) {
            const newRetryCount = retryCount + 1;

            setErrorState((prev) => ({
                ...prev,
                error: retryError instanceof Error ? retryError : error,
                isRetrying: false,
                retryCount: newRetryCount,
                lastRetryAt: Date.now(),
            }));

            if (newRetryCount >= maxRetries) {
                onMaxRetriesReached?.(
                    retryError instanceof Error ? retryError : error
                );
            }

            // Log retry failure
            errorLogger.logError(
                retryError instanceof Error ? retryError : error,
                {
                    component,
                    action: 'retry_failed',
                    metadata: {
                        retryCount: newRetryCount,
                        maxRetries,
                        isOnline,
                    },
                },
                newRetryCount >= maxRetries ? 'high' : 'medium'
            );
        }
    }, [
        errorState,
        maxRetries,
        retryConfig,
        onRetry,
        onMaxRetriesReached,
        component,
        isOnline,
        clearError,
    ]);

    const executeWithErrorHandling = useCallback(
        async <T>(
            operation: () => Promise<T>,
            context?: string
        ): Promise<T | null> => {
            // Store the operation for potential retries
            lastOperationRef.current = operation;

            try {
                clearError();
                const result = await operation();
                return result;
            } catch (error) {
                const errorInstance =
                    error instanceof Error ? error : new Error(String(error));
                handleError(errorInstance, context);
                return null;
            }
        },
        [handleError, clearError]
    );

    return {
        error: errorState.error,
        isRetrying: errorState.isRetrying,
        retryCount: errorState.retryCount,
        hasError: errorState.error !== null,
        canRetry:
            errorState.error !== null &&
            errorState.retryCount < maxRetries &&
            !errorState.isRetrying,
        handleError,
        retry,
        clearError,
        executeWithErrorHandling,
    };
};

/**
 * Hook specifically for API error handling
 */
export const useApiErrorHandler = (component?: string) => {
    return useErrorHandler({
        maxRetries: 3,
        retryConfig: {
            baseDelay: 1000,
            maxDelay: 5000,
            exponentialBase: 2,
            jitter: true,
        },
        component: component || 'API',
    });
};

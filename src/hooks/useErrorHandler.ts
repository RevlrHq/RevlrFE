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
    const errorStateRef = useRef(errorState);

    // Keep ref in sync with state
    errorStateRef.current = errorState;

    const handleError = useCallback(
        (error: Error, context?: string) => {
            try {
                // Log the error
                errorLogger.logError(
                    error,
                    {
                        component,
                        action: context || 'unknown',
                        metadata: {
                            retryCount: errorStateRef.current?.retryCount || 0,
                            isOnline,
                        },
                    },
                    'medium'
                );
            } catch (logError) {
                // Prevent infinite loops from logging errors
                console.debug('Failed to log error:', logError);
            }

            setErrorState((prev) => ({
                ...prev,
                error,
            }));

            // Call custom error handler
            try {
                onError?.(error);
            } catch (handlerError) {
                console.debug('Error in custom error handler:', handlerError);
            }
        },
        [component, isOnline, onError]
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
        try {
            const currentState = errorStateRef.current;
            if (!currentState) {
                return;
            }

            const { error, retryCount } = currentState;

            if (
                !error ||
                !lastOperationRef.current ||
                retryCount >= maxRetries
            ) {
                return;
            }

            setErrorState((prev) => ({
                ...prev,
                isRetrying: true,
            }));

            try {
                onRetry?.();
            } catch (callbackError) {
                console.debug('Error in onRetry callback:', callbackError);
            }

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
                    try {
                        onMaxRetriesReached?.(
                            retryError instanceof Error ? retryError : error
                        );
                    } catch (callbackError) {
                        console.debug(
                            'Error in onMaxRetriesReached callback:',
                            callbackError
                        );
                    }
                }

                // Log retry failure with protection
                try {
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
                } catch (logError) {
                    console.debug('Failed to log retry error:', logError);
                }
            }
        } catch (outerError) {
            console.debug('Unexpected error in retry function:', outerError);
            setErrorState((prev) => ({
                ...prev,
                isRetrying: false,
            }));
        }
    }, [
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

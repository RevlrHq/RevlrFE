/**
 * Tests for useErrorHandler hook
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, useApiErrorHandler } from '@/hooks/useErrorHandler';

// Mock the error logger
jest.mock('@/lib/error-handling/ErrorLogger', () => ({
    errorLogger: {
        logError: jest.fn(),
    },
}));

// Mock the retry mechanism
jest.mock('@/lib/error-handling/RetryMechanism', () => ({
    RetryMechanism: {
        retry: jest.fn(),
    },
}));

// Mock useOnlineStatus
jest.mock('@/hooks/useOnlineStatus', () => ({
    useOnlineStatus: jest.fn(() => true),
}));

describe('useErrorHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Error Handling', () => {
        it('should initialize with no error', () => {
            const { result } = renderHook(() => useErrorHandler());

            expect(result.current.error).toBeNull();
            expect(result.current.hasError).toBe(false);
            expect(result.current.isRetrying).toBe(false);
            expect(result.current.retryCount).toBe(0);
        });

        it('should handle errors correctly', () => {
            const { result } = renderHook(() => useErrorHandler());
            const testError = new Error('Test error');

            act(() => {
                result.current.handleError(testError, 'test_context');
            });

            expect(result.current.error).toBe(testError);
            expect(result.current.hasError).toBe(true);
            expect(result.current.canRetry).toBe(true);
        });

        it('should clear errors', () => {
            const { result } = renderHook(() => useErrorHandler());
            const testError = new Error('Test error');

            act(() => {
                result.current.handleError(testError);
            });

            expect(result.current.hasError).toBe(true);

            act(() => {
                result.current.clearError();
            });

            expect(result.current.error).toBeNull();
            expect(result.current.hasError).toBe(false);
            expect(result.current.retryCount).toBe(0);
        });
    });

    describe('Execute with Error Handling', () => {
        it('should execute operation successfully', async () => {
            const { result } = renderHook(() => useErrorHandler());
            const successfulOperation = jest.fn().mockResolvedValue('success');

            let operationResult;
            await act(async () => {
                operationResult = await result.current.executeWithErrorHandling(
                    successfulOperation,
                    'test_operation'
                );
            });

            expect(operationResult).toBe('success');
            expect(result.current.hasError).toBe(false);
            expect(successfulOperation).toHaveBeenCalledTimes(1);
        });

        it('should handle operation errors', async () => {
            const { result } = renderHook(() => useErrorHandler());
            const testError = new Error('Operation failed');
            const failingOperation = jest.fn().mockRejectedValue(testError);

            let operationResult;
            await act(async () => {
                operationResult = await result.current.executeWithErrorHandling(
                    failingOperation,
                    'test_operation'
                );
            });

            expect(operationResult).toBeNull();
            expect(result.current.error).toBe(testError);
            expect(result.current.hasError).toBe(true);
        });

        it('should handle non-Error objects', async () => {
            const { result } = renderHook(() => useErrorHandler());
            const failingOperation = jest
                .fn()
                .mockRejectedValue('String error');

            await act(async () => {
                await result.current.executeWithErrorHandling(failingOperation);
            });

            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.error?.message).toBe('String error');
        });
    });

    describe('Retry Functionality', () => {
        it('should retry failed operations', async () => {
            const { RetryMechanism } = await import(
                '@/lib/error-handling/RetryMechanism'
            );
            (RetryMechanism.retry as jest.Mock).mockResolvedValue({
                success: true,
            });

            const { result } = renderHook(() => useErrorHandler());
            const testError = new Error('Test error');

            // First, set an error
            act(() => {
                result.current.handleError(testError);
            });

            expect(result.current.canRetry).toBe(true);

            // Then retry
            await act(async () => {
                await result.current.retry();
            });

            expect(RetryMechanism.retry).toHaveBeenCalled();
        });

        it('should handle retry failures', async () => {
            const { RetryMechanism } = await import(
                '@/lib/error-handling/RetryMechanism'
            );
            const retryError = new Error('Retry failed');
            (RetryMechanism.retry as jest.Mock).mockRejectedValue(retryError);

            const { result } = renderHook(() => useErrorHandler());
            const testError = new Error('Test error');

            act(() => {
                result.current.handleError(testError);
            });

            await act(async () => {
                await result.current.retry();
            });

            expect(result.current.error).toBe(retryError);
            expect(result.current.retryCount).toBe(1);
        });

        it('should disable retry after max attempts', async () => {
            const { result } = renderHook(() =>
                useErrorHandler({ maxRetries: 2 })
            );
            const testError = new Error('Test error');

            act(() => {
                result.current.handleError(testError);
            });

            // Simulate failed retries
            const { RetryMechanism } = await import(
                '@/lib/error-handling/RetryMechanism'
            );
            (RetryMechanism.retry as jest.Mock).mockRejectedValue(testError);

            await act(async () => {
                await result.current.retry();
            });
            await act(async () => {
                await result.current.retry();
            });

            expect(result.current.retryCount).toBe(2);
            expect(result.current.canRetry).toBe(false);
        });
    });

    describe('Error Logging Integration', () => {
        it('should log errors with context', async () => {
            const { errorLogger } = await import(
                '@/lib/error-handling/ErrorLogger'
            );
            const { result } = renderHook(() =>
                useErrorHandler({ component: 'TestComponent' })
            );
            const testError = new Error('Test error');

            act(() => {
                result.current.handleError(testError, 'test_action');
            });

            expect(errorLogger.logError).toHaveBeenCalledWith(
                testError,
                expect.objectContaining({
                    component: 'TestComponent',
                    action: 'test_action',
                }),
                'medium'
            );
        });
    });

    describe('Callback Handlers', () => {
        it('should call onError callback', () => {
            const onError = jest.fn();
            const { result } = renderHook(() => useErrorHandler({ onError }));
            const testError = new Error('Test error');

            act(() => {
                result.current.handleError(testError);
            });

            expect(onError).toHaveBeenCalledWith(testError);
        });

        it('should call onRetry callback', async () => {
            const onRetry = jest.fn();
            const { result } = renderHook(() => useErrorHandler({ onRetry }));
            const testError = new Error('Test error');

            const { RetryMechanism } = await import(
                '@/lib/error-handling/RetryMechanism'
            );
            (RetryMechanism.retry as jest.Mock).mockResolvedValue({
                success: true,
            });

            act(() => {
                result.current.handleError(testError);
            });

            await act(async () => {
                await result.current.retry();
            });

            expect(onRetry).toHaveBeenCalled();
        });

        it('should call onMaxRetriesReached callback', async () => {
            const onMaxRetriesReached = jest.fn();
            const { result } = renderHook(() =>
                useErrorHandler({ maxRetries: 1, onMaxRetriesReached })
            );
            const testError = new Error('Test error');

            const { RetryMechanism } = await import(
                '@/lib/error-handling/RetryMechanism'
            );
            (RetryMechanism.retry as jest.Mock).mockRejectedValue(testError);

            act(() => {
                result.current.handleError(testError);
            });

            await act(async () => {
                await result.current.retry();
            });

            expect(onMaxRetriesReached).toHaveBeenCalledWith(testError);
        });
    });

    describe('Configuration Options', () => {
        it('should use custom retry configuration', async () => {
            const customRetryConfig = {
                baseDelay: 2000,
                maxDelay: 10000,
                exponentialBase: 3,
            };

            const { result } = renderHook(() =>
                useErrorHandler({ retryConfig: customRetryConfig })
            );
            const testError = new Error('Test error');

            const { RetryMechanism } = await import(
                '@/lib/error-handling/RetryMechanism'
            );
            (RetryMechanism.retry as jest.Mock).mockResolvedValue({
                success: true,
            });

            act(() => {
                result.current.handleError(testError);
            });

            await act(async () => {
                await result.current.retry();
            });

            expect(RetryMechanism.retry).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining(customRetryConfig)
            );
        });
    });
});

describe('useApiErrorHandler', () => {
    it('should use API-specific configuration', () => {
        const { result } = renderHook(() => useApiErrorHandler('TestAPI'));

        expect(result.current.error).toBeNull();
        expect(result.current.hasError).toBe(false);

        // Should have API-specific retry configuration
        const testError = new Error('API error');
        act(() => {
            result.current.handleError(testError);
        });

        expect(result.current.hasError).toBe(true);
    });

    it('should use default component name when not provided', async () => {
        const { errorLogger } = await import(
            '@/lib/error-handling/ErrorLogger'
        );
        const { result } = renderHook(() => useApiErrorHandler());
        const testError = new Error('API error');

        act(() => {
            result.current.handleError(testError);
        });

        expect(errorLogger.logError).toHaveBeenCalledWith(
            testError,
            expect.objectContaining({
                component: 'API',
            }),
            'medium'
        );
    });
});

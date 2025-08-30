import { renderHook, waitFor } from '@testing-library/react';
import { useOrganizerDashboard } from '@/hooks/useOrganizerDashboard';

// Mock all dependencies
jest.mock('@/hooks/useErrorHandler', () => ({
    useApiErrorHandler: jest.fn(() => ({
        error: null,
        isRetrying: false,
        retryCount: 0,
        hasError: false,
        canRetry: false,
        handleError: jest.fn(),
        retry: jest.fn(),
        clearError: jest.fn(),
        executeWithErrorHandling: jest.fn().mockResolvedValue(null),
    })),
}));

jest.mock('@/components/error-handling/OfflineIndicator', () => ({
    useOfflineAwareFetch: jest.fn(() => ({
        fetchWithOfflineSupport: jest.fn().mockResolvedValue(null),
        isOnline: true,
    })),
}));

jest.mock('@/lib/error-handling/RetryMechanism', () => ({
    withApiRetry: jest.fn().mockResolvedValue({
        success: true,
        data: null,
    }),
}));

jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerDashboard: jest.fn(),
    },
}));

describe('useOrganizerDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useOrganizerDashboard());

        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.refetch).toBe('function');
        expect(typeof result.current.retry).toBe('function');
        expect(typeof result.current.clearError).toBe('function');
    });

    it('should not cause infinite loops during error handling', async () => {
        const mockRetry = jest.fn();
        const mockExecuteWithErrorHandling = jest.fn().mockResolvedValue(null);

        // Mock error handler to simulate error state
        const { useApiErrorHandler } = require('@/hooks/useErrorHandler');
        useApiErrorHandler.mockReturnValue({
            error: new Error('Test error'),
            isRetrying: false,
            retryCount: 1,
            hasError: true,
            canRetry: true,
            handleError: jest.fn(),
            retry: mockRetry,
            clearError: jest.fn(),
            executeWithErrorHandling: mockExecuteWithErrorHandling,
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        // Wait for effects to run
        await waitFor(() => {
            expect(result.current.hasError).toBe(true);
        });

        // Verify that retry is not called excessively due to circuit breaker
        expect(mockRetry).toHaveBeenCalledTimes(0);

        // Verify the hook provides stable functions
        expect(typeof result.current.retry).toBe('function');
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should provide circuit breaker protection', async () => {
        const mockRetry = jest.fn();

        // Mock online status and error handler
        const {
            useOfflineAwareFetch,
        } = require('@/components/error-handling/OfflineIndicator');
        useOfflineAwareFetch.mockReturnValue({
            fetchWithOfflineSupport: jest.fn().mockResolvedValue(null),
            isOnline: true,
        });

        const { useApiErrorHandler } = require('@/hooks/useErrorHandler');
        useApiErrorHandler.mockReturnValue({
            error: new Error('Test error'),
            isRetrying: false,
            retryCount: 0,
            hasError: true,
            canRetry: true,
            handleError: jest.fn(),
            retry: mockRetry,
            clearError: jest.fn(),
            executeWithErrorHandling: jest.fn().mockResolvedValue(null),
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        // Wait for initial render and effects
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Even with error state and online status, retry should be limited
        expect(mockRetry).toHaveBeenCalledTimes(0); // Circuit breaker should prevent immediate retry
    });
});

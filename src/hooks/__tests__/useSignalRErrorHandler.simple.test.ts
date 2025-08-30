import { renderHook, act } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import {
    useSignalRErrorHandler,
    RecoveryStrategy,
    ErrorSeverity,
} from '../useSignalRErrorHandler';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import type { SignalRError } from '@/types/signalr';

// Mock dependencies
jest.mock('@/lib/services/SignalRAuthService');
jest.mock('../useOnlineStatus', () => ({
    useOnlineStatus: jest.fn(() => true),
}));

const mockSignalRAuthService = SignalRAuthService as jest.Mocked<
    typeof SignalRAuthService
>;

// Helper function to create test errors
const createTestError = (
    type: SignalRError['type'],
    message: string = 'Test error',
    retryable: boolean = true
): SignalRError => ({
    type,
    message,
    timestamp: new Date(),
    retryable,
    connectionState: HubConnectionState.Disconnected,
});

describe('useSignalRErrorHandler - Core Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock SignalRAuthService methods
        mockSignalRAuthService.getUserContext.mockReturnValue({
            userId: 'test-user-id',
            role: 'user',
            isAuthenticated: true,
        });

        mockSignalRAuthService.handleAuthenticationFailure.mockResolvedValue({
            type: 'authentication',
            message: 'Token refreshed',
            timestamp: new Date(),
            retryable: true,
        });
    });

    describe('Error Categorization', () => {
        it('should categorize authentication errors as HIGH severity', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const authError = createTestError('authentication');

            const severity = result.current.getErrorSeverity(authError);
            expect(severity).toBe(ErrorSeverity.HIGH);
        });

        it('should categorize connection errors as MEDIUM severity when online', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const connectionError = createTestError('connection');

            const severity = result.current.getErrorSeverity(connectionError);
            expect(severity).toBe(ErrorSeverity.MEDIUM);
        });

        it('should categorize unexpected errors as CRITICAL severity', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const unexpectedError = createTestError('unexpected');

            const severity = result.current.getErrorSeverity(unexpectedError);
            expect(severity).toBe(ErrorSeverity.CRITICAL);
        });

        it('should categorize hub method errors as MEDIUM severity', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const hubError = createTestError('hub_method');

            const severity = result.current.getErrorSeverity(hubError);
            expect(severity).toBe(ErrorSeverity.MEDIUM);
        });
    });

    describe('Recovery Strategy Selection', () => {
        it('should select REFRESH_TOKEN_AND_RETRY for authentication errors', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const authError = createTestError('authentication');
            const context = {
                isOnline: true,
                timestamp: new Date(),
                userId: 'test-user',
                userRole: 'user',
            };

            const strategy = result.current.getRecoveryStrategy(
                authError,
                context
            );
            expect(strategy).toBe(RecoveryStrategy.REFRESH_TOKEN_AND_RETRY);
        });

        it('should select RECONNECT for connection errors when online', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const connectionError = createTestError('connection');
            const context = {
                isOnline: true,
                timestamp: new Date(),
                userId: 'test-user',
                userRole: 'user',
            };

            const strategy = result.current.getRecoveryStrategy(
                connectionError,
                context
            );
            expect(strategy).toBe(RecoveryStrategy.RECONNECT);
        });

        it('should select USER_INTERVENTION for connection errors when offline', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const connectionError = createTestError('connection');
            const context = {
                isOnline: false,
                timestamp: new Date(),
                userId: 'test-user',
                userRole: 'user',
            };

            const strategy = result.current.getRecoveryStrategy(
                connectionError,
                context
            );
            expect(strategy).toBe(RecoveryStrategy.USER_INTERVENTION);
        });

        it('should select NO_RECOVERY for non-retryable errors', () => {
            const { result } = renderHook(() => useSignalRErrorHandler());
            const nonRetryableError = createTestError(
                'unexpected',
                'Fatal error',
                false
            );
            const context = {
                isOnline: true,
                timestamp: new Date(),
                userId: 'test-user',
                userRole: 'user',
            };

            const strategy = result.current.getRecoveryStrategy(
                nonRetryableError,
                context
            );
            expect(strategy).toBe(RecoveryStrategy.NO_RECOVERY);
        });
    });

    describe('Error Handling', () => {
        it('should handle errors and update state correctly', async () => {
            const onError = jest.fn();
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ onError })
            );

            const testError = createTestError(
                'connection',
                'Connection failed'
            );

            await act(async () => {
                await result.current.handleError(testError);
            });

            expect(result.current.errorState.currentError).toEqual(testError);
            expect(result.current.errorState.errorHistory).toHaveLength(1);
            expect(result.current.errorState.consecutiveFailures).toBe(1);
            expect(onError).toHaveBeenCalledWith(testError, expect.any(Object));
        });

        it('should maintain error history with max limit', async () => {
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ maxErrorHistory: 2 })
            );

            const error1 = createTestError('connection', 'Error 1');
            const error2 = createTestError('network', 'Error 2');
            const error3 = createTestError('hub_method', 'Error 3');

            await act(async () => {
                await result.current.handleError(error1);
            });
            await act(async () => {
                await result.current.handleError(error2);
            });
            await act(async () => {
                await result.current.handleError(error3);
            });

            expect(result.current.errorState.errorHistory).toHaveLength(2);
            expect(result.current.errorState.errorHistory[0]).toEqual(error3);
            expect(result.current.errorState.errorHistory[1]).toEqual(error2);
        });

        it('should call onCriticalError for critical errors', async () => {
            const onCriticalError = jest.fn();
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ onCriticalError })
            );

            const criticalError = createTestError(
                'unexpected',
                'Critical failure'
            );

            await act(async () => {
                await result.current.handleError(criticalError);
            });

            expect(onCriticalError).toHaveBeenCalledWith(
                criticalError,
                expect.any(Object)
            );
        });
    });

    describe('Recovery Attempts', () => {
        it('should attempt authentication recovery successfully', async () => {
            const onRecoverySuccess = jest.fn();
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ onRecoverySuccess })
            );

            const authError = createTestError('authentication');

            await act(async () => {
                await result.current.handleError(authError);
            });

            const success = await act(async () => {
                return await result.current.attemptRecovery(
                    RecoveryStrategy.REFRESH_TOKEN_AND_RETRY
                );
            });

            expect(success).toBe(true);
            expect(result.current.errorState.currentError).toBeNull();
            expect(result.current.errorState.consecutiveFailures).toBe(0);
            expect(onRecoverySuccess).toHaveBeenCalledWith(
                RecoveryStrategy.REFRESH_TOKEN_AND_RETRY
            );
        });

        it('should handle recovery failure', async () => {
            const onRecoveryFailure = jest.fn();
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ onRecoveryFailure })
            );

            // Mock authentication failure
            mockSignalRAuthService.handleAuthenticationFailure.mockRejectedValue(
                new Error('Token refresh failed')
            );

            const authError = createTestError('authentication');

            await act(async () => {
                await result.current.handleError(authError);
            });

            const success = await act(async () => {
                return await result.current.attemptRecovery(
                    RecoveryStrategy.REFRESH_TOKEN_AND_RETRY
                );
            });

            expect(success).toBe(false);
            expect(result.current.errorState.currentError).toEqual(authError);
            expect(onRecoveryFailure).toHaveBeenCalled();
        });

        it('should not attempt recovery when already recovering', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            const error = createTestError('connection');

            await act(async () => {
                await result.current.handleError(error);
            });

            // Start first recovery attempt
            const firstAttempt = act(async () => {
                return result.current.attemptRecovery();
            });

            // Try second recovery attempt while first is in progress
            const secondAttempt = await act(async () => {
                return await result.current.attemptRecovery();
            });

            expect(secondAttempt).toBe(false);

            await firstAttempt;
        });
    });

    describe('State Management', () => {
        it('should clear current error', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            const error = createTestError('connection');

            await act(async () => {
                await result.current.handleError(error);
            });

            expect(result.current.errorState.currentError).toEqual(error);

            act(() => {
                result.current.clearError();
            });

            expect(result.current.errorState.currentError).toBeNull();
            expect(result.current.errorState.consecutiveFailures).toBe(0);
        });

        it('should clear error history', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            await act(async () => {
                await result.current.handleError(
                    createTestError('network', 'Error 1')
                );
            });
            await act(async () => {
                await result.current.handleError(
                    createTestError('connection', 'Error 2')
                );
            });

            expect(result.current.errorState.errorHistory).toHaveLength(2);

            act(() => {
                result.current.clearErrorHistory();
            });

            expect(result.current.errorState.errorHistory).toHaveLength(0);
            expect(result.current.errorState.recoveryAttempts).toHaveLength(0);
        });

        it('should determine canAttemptRecovery correctly', async () => {
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ maxRetryAttempts: 2 })
            );

            // No error - cannot recover
            expect(result.current.canAttemptRecovery).toBe(false);

            // Add error - can recover
            await act(async () => {
                await result.current.handleError(createTestError('network'));
            });
            expect(result.current.canAttemptRecovery).toBe(true);

            // Add more errors to exceed max attempts
            await act(async () => {
                await result.current.handleError(createTestError('network'));
            });
            await act(async () => {
                await result.current.handleError(createTestError('network'));
            });

            expect(result.current.canAttemptRecovery).toBe(false);
        });
    });

    describe('Debug Information', () => {
        it('should provide comprehensive debug information', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            await act(async () => {
                await result.current.handleError(
                    createTestError('network', 'Test error')
                );
            });

            const debugInfo = result.current.getDebugInfo();

            expect(debugInfo).toHaveProperty('sessionId');
            expect(debugInfo).toHaveProperty('userContext');
            expect(debugInfo).toHaveProperty('isOnline');
            expect(debugInfo).toHaveProperty('errorState');
            expect(debugInfo).toHaveProperty('errorFrequency');
            expect(debugInfo).toHaveProperty('config');

            expect(debugInfo.userContext).toEqual({
                userId: 'test-user-id',
                role: 'user',
                isAuthenticated: true,
            });
        });

        it('should export error log as JSON string', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            await act(async () => {
                await result.current.handleError(
                    createTestError('connection', 'Export test')
                );
            });

            const exportedLog = result.current.exportErrorLog();

            expect(() => JSON.parse(exportedLog)).not.toThrow();

            const parsedLog = JSON.parse(exportedLog);
            expect(parsedLog).toHaveProperty('errorState');
            expect(parsedLog.errorState.errorHistory).toHaveLength(1);
        });
    });

    describe('Configuration Options', () => {
        it('should respect maxRetryAttempts configuration', async () => {
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ maxRetryAttempts: 1 })
            );

            await act(async () => {
                await result.current.handleError(createTestError('network'));
            });
            await act(async () => {
                await result.current.handleError(createTestError('network'));
            });

            expect(result.current.canAttemptRecovery).toBe(false);
        });

        it('should respect maxErrorHistory configuration', async () => {
            const { result } = renderHook(() =>
                useSignalRErrorHandler({ maxErrorHistory: 1 })
            );

            await act(async () => {
                await result.current.handleError(
                    createTestError('network', 'Error 1')
                );
            });
            await act(async () => {
                await result.current.handleError(
                    createTestError('connection', 'Error 2')
                );
            });

            expect(result.current.errorState.errorHistory).toHaveLength(1);
            expect(result.current.errorState.errorHistory[0].message).toBe(
                'Error 2'
            );
        });
    });
});

import { useState, useCallback, useRef, useEffect } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import type { SignalRError, SignalRErrorType } from '@/types/signalr';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import { useOnlineStatus } from './useOnlineStatus';

// Helper function to create SignalR errors
const createSignalRError = (
    type: SignalRErrorType,
    message: string,
    originalError?: Error,
    connectionState?: HubConnectionState,
    retryable: boolean = true
): SignalRError => ({
    type,
    message,
    originalError,
    timestamp: new Date(),
    connectionState,
    retryable,
});

// Error recovery strategies
export enum RecoveryStrategy {
    RETRY_WITH_BACKOFF = 'retry_with_backoff',
    REFRESH_TOKEN_AND_RETRY = 'refresh_token_and_retry',
    RECONNECT = 'reconnect',
    FALLBACK_TO_POLLING = 'fallback_to_polling',
    USER_INTERVENTION = 'user_intervention',
    NO_RECOVERY = 'no_recovery',
}

// Error severity levels
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

// Error context for debugging
export interface ErrorContext {
    connectionState?: HubConnectionState;
    userId?: string | null;
    userRole?: string | null;
    isOnline: boolean;
    timestamp: Date;
    sessionId?: string;
    hubUrl?: string;
    retryAttempt?: number;
    lastSuccessfulConnection?: Date;
}

// Recovery attempt result
export interface RecoveryAttempt {
    strategy: RecoveryStrategy;
    success: boolean;
    error?: Error;
    timestamp: Date;
    duration: number;
}

// Error handler state
export interface SignalRErrorState {
    currentError: SignalRError | null;
    errorHistory: SignalRError[];
    recoveryAttempts: RecoveryAttempt[];
    isRecovering: boolean;
    lastRecoveryAttempt: Date | null;
    consecutiveFailures: number;
    errorFrequency: number; // errors per minute
}

// Error handler options
export interface UseSignalRErrorHandlerOptions {
    maxRetryAttempts?: number;
    maxErrorHistory?: number;
    retryIntervals?: number[]; // milliseconds
    enableLogging?: boolean;
    enableUserNotifications?: boolean;
    onError?: (error: SignalRError, context: ErrorContext) => void;
    onRecoveryAttempt?: (attempt: RecoveryAttempt) => void;
    onRecoverySuccess?: (strategy: RecoveryStrategy) => void;
    onRecoveryFailure?: (
        error: SignalRError,
        attempts: RecoveryAttempt[]
    ) => void;
    onCriticalError?: (error: SignalRError, context: ErrorContext) => void;
}

// Error handler return type
export interface UseSignalRErrorHandlerResult {
    // Current state
    errorState: SignalRErrorState;

    // Error handling
    handleError: (
        error: SignalRError,
        context?: Partial<ErrorContext>
    ) => Promise<void>;
    clearError: () => void;
    clearErrorHistory: () => void;

    // Recovery
    attemptRecovery: (strategy?: RecoveryStrategy) => Promise<boolean>;
    canAttemptRecovery: boolean;

    // Error analysis
    getErrorSeverity: (error: SignalRError) => ErrorSeverity;
    getRecoveryStrategy: (
        error: SignalRError,
        context: ErrorContext
    ) => RecoveryStrategy;
    getErrorFrequency: () => number;

    // Debugging
    getDebugInfo: () => Record<string, unknown>;
    exportErrorLog: () => string;
}

// Default configuration
const DEFAULT_OPTIONS: Required<UseSignalRErrorHandlerOptions> = {
    maxRetryAttempts: 3,
    maxErrorHistory: 50,
    retryIntervals: [1000, 2000, 5000, 10000, 30000], // exponential backoff
    enableLogging: process.env.NODE_ENV === 'development',
    enableUserNotifications: true,
    onError: () => {},
    onRecoveryAttempt: () => {},
    onRecoverySuccess: () => {},
    onRecoveryFailure: () => {},
    onCriticalError: () => {},
};

export const useSignalRErrorHandler = (
    options: UseSignalRErrorHandlerOptions = {}
): UseSignalRErrorHandlerResult => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    const isOnline = useOnlineStatus();

    // State
    const [errorState, setErrorState] = useState<SignalRErrorState>({
        currentError: null,
        errorHistory: [],
        recoveryAttempts: [],
        isRecovering: false,
        lastRecoveryAttempt: null,
        consecutiveFailures: 0,
        errorFrequency: 0,
    });

    // Refs for cleanup and tracking
    const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const errorFrequencyWindowRef = useRef<Date[]>([]);
    const sessionIdRef = useRef<string>(crypto.randomUUID());

    // Helper function to create error context
    const createErrorContext = useCallback(
        (partialContext: Partial<ErrorContext> = {}): ErrorContext => {
            const userContext = SignalRAuthService.getUserContext();

            return {
                userId: userContext.userId,
                userRole: userContext.role,
                isOnline,
                timestamp: new Date(),
                sessionId: sessionIdRef.current,
                ...partialContext,
            };
        },
        [isOnline]
    );

    // Determine error severity
    const getErrorSeverity = useCallback(
        (error: SignalRError): ErrorSeverity => {
            switch (error.type) {
                case 'authentication':
                    return ErrorSeverity.HIGH;
                case 'connection':
                    return isOnline ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW;
                case 'network':
                    return isOnline ? ErrorSeverity.HIGH : ErrorSeverity.LOW;
                case 'hub_method':
                    return ErrorSeverity.MEDIUM;
                case 'unexpected':
                    return ErrorSeverity.CRITICAL;
                default:
                    return ErrorSeverity.MEDIUM;
            }
        },
        [isOnline]
    );

    // Determine recovery strategy
    const getRecoveryStrategy = useCallback(
        (error: SignalRError, context: ErrorContext): RecoveryStrategy => {
            // No recovery for non-retryable errors
            if (!error.retryable) {
                return RecoveryStrategy.NO_RECOVERY;
            }

            // Check consecutive failures
            if (errorState.consecutiveFailures >= config.maxRetryAttempts) {
                return RecoveryStrategy.USER_INTERVENTION;
            }

            // Strategy based on error type
            switch (error.type) {
                case 'authentication':
                    return RecoveryStrategy.REFRESH_TOKEN_AND_RETRY;

                case 'connection':
                    if (!context.isOnline) {
                        return RecoveryStrategy.USER_INTERVENTION;
                    }
                    return RecoveryStrategy.RECONNECT;

                case 'network':
                    if (!context.isOnline) {
                        return RecoveryStrategy.USER_INTERVENTION;
                    }
                    return RecoveryStrategy.RETRY_WITH_BACKOFF;

                case 'hub_method':
                    return RecoveryStrategy.RETRY_WITH_BACKOFF;

                case 'unexpected':
                    return RecoveryStrategy.RECONNECT;

                default:
                    return RecoveryStrategy.RETRY_WITH_BACKOFF;
            }
        },
        [errorState.consecutiveFailures, config.maxRetryAttempts]
    );

    // Calculate error frequency
    const getErrorFrequency = useCallback((): number => {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);

        // Filter errors from the last minute
        const recentErrors = errorFrequencyWindowRef.current.filter(
            (timestamp) => timestamp > oneMinuteAgo
        );

        // Update the window
        errorFrequencyWindowRef.current = recentErrors;

        return recentErrors.length;
    }, []);

    // Log error for debugging
    const logError = useCallback(
        (
            error: SignalRError,
            context: ErrorContext,
            severity: ErrorSeverity
        ) => {
            if (!config.enableLogging) return;

            const logData = {
                error: {
                    type: error.type,
                    message: error.message,
                    timestamp: error.timestamp,
                    retryable: error.retryable,
                    connectionState: error.connectionState,
                },
                context,
                severity,
                sessionId: sessionIdRef.current,
                errorFrequency: getErrorFrequency(),
                consecutiveFailures: errorState.consecutiveFailures,
            };

            switch (severity) {
                case ErrorSeverity.LOW:
                    console.info('SignalR Error (Low):', logData);
                    break;
                case ErrorSeverity.MEDIUM:
                    console.warn('SignalR Error (Medium):', logData);
                    break;
                case ErrorSeverity.HIGH:
                    console.debug('SignalR Error (High):', logData);
                    break;
                case ErrorSeverity.CRITICAL:
                    console.debug('SignalR Error (CRITICAL):', logData);
                    break;
            }
        },
        [
            config.enableLogging,
            getErrorFrequency,
            errorState.consecutiveFailures,
        ]
    );

    // Handle error
    const handleError = useCallback(
        async (
            error: SignalRError,
            partialContext: Partial<ErrorContext> = {}
        ): Promise<void> => {
            const context = createErrorContext(partialContext);
            const severity = getErrorSeverity(error);

            // Log the error
            logError(error, context, severity);

            // Update error frequency tracking
            errorFrequencyWindowRef.current.push(new Date());

            // Update state
            setErrorState((prev) => {
                const newErrorHistory = [error, ...prev.errorHistory].slice(
                    0,
                    config.maxErrorHistory
                );

                return {
                    ...prev,
                    currentError: error,
                    errorHistory: newErrorHistory,
                    consecutiveFailures: prev.consecutiveFailures + 1,
                    errorFrequency: getErrorFrequency(),
                };
            });

            // Call error callback
            config.onError(error, context);

            // Handle critical errors
            if (severity === ErrorSeverity.CRITICAL) {
                config.onCriticalError(error, context);
            }

            // Attempt automatic recovery if appropriate and within retry limits
            const strategy = getRecoveryStrategy(error, context);
            if (
                strategy !== RecoveryStrategy.NO_RECOVERY &&
                strategy !== RecoveryStrategy.USER_INTERVENTION &&
                errorState.consecutiveFailures < config.maxRetryAttempts
            ) {
                // Delay recovery attempt based on consecutive failures
                const delay =
                    config.retryIntervals[
                        Math.min(
                            errorState.consecutiveFailures,
                            config.retryIntervals.length - 1
                        )
                    ] || 30000;

                recoveryTimeoutRef.current = setTimeout(() => {
                    attemptRecovery(strategy);
                }, delay);
            } else if (
                errorState.consecutiveFailures >= config.maxRetryAttempts
            ) {
                // Stop automatic recovery after max attempts
                console.warn(
                    `SignalR Error Handler: Maximum retry attempts (${config.maxRetryAttempts}) reached. Stopping automatic recovery.`
                );

                // Create a final error indicating retry limit reached
                const finalError = createSignalRError(
                    'connection' as SignalRErrorType,
                    `Maximum retry attempts (${config.maxRetryAttempts}) reached. Manual intervention required.`,
                    error.originalError,
                    error.connectionState,
                    false // Not retryable anymore
                );

                config.onCriticalError(finalError, context);
            }
        },
        [
            createErrorContext,
            getErrorSeverity,
            logError,
            getErrorFrequency,
            getRecoveryStrategy,
            config,
            errorState.consecutiveFailures,
        ]
    );

    // Attempt recovery
    const attemptRecovery = useCallback(
        async (strategy?: RecoveryStrategy): Promise<boolean> => {
            return new Promise((resolve) => {
                setErrorState((prev) => {
                    if (prev.isRecovering || !prev.currentError) {
                        resolve(false);
                        return prev;
                    }

                    const context = createErrorContext();
                    const recoveryStrategy =
                        strategy ||
                        getRecoveryStrategy(prev.currentError, context);

                    // Start recovery process
                    const performRecovery = async () => {
                        const startTime = Date.now();
                        let success = false;
                        let recoveryError: Error | undefined;

                        try {
                            switch (recoveryStrategy) {
                                case RecoveryStrategy.REFRESH_TOKEN_AND_RETRY:
                                    try {
                                        const authError =
                                            await SignalRAuthService.handleAuthenticationFailure(
                                                new Error(
                                                    'Token refresh required for recovery'
                                                )
                                            );
                                        success = authError.retryable;
                                    } catch (error) {
                                        success = false;
                                        recoveryError =
                                            error instanceof Error
                                                ? error
                                                : new Error(String(error));
                                    }
                                    break;

                                case RecoveryStrategy.RETRY_WITH_BACKOFF:
                                    success = true;
                                    break;

                                case RecoveryStrategy.RECONNECT:
                                    success = true;
                                    break;

                                case RecoveryStrategy.FALLBACK_TO_POLLING:
                                    success = false;
                                    recoveryError = new Error(
                                        'Polling fallback not implemented'
                                    );
                                    break;

                                default:
                                    success = false;
                                    recoveryError = new Error(
                                        `Recovery strategy ${recoveryStrategy} not supported`
                                    );
                            }
                        } catch (error) {
                            success = false;
                            recoveryError =
                                error instanceof Error
                                    ? error
                                    : new Error(String(error));
                        }

                        const duration = Date.now() - startTime;
                        const attempt: RecoveryAttempt = {
                            strategy: recoveryStrategy,
                            success,
                            error: recoveryError,
                            timestamp: new Date(),
                            duration,
                        };

                        // Update state with recovery result
                        setErrorState((current) => ({
                            ...current,
                            isRecovering: false,
                            recoveryAttempts: [
                                attempt,
                                ...current.recoveryAttempts,
                            ].slice(0, 20),
                            consecutiveFailures: success
                                ? 0
                                : current.consecutiveFailures,
                            currentError: success ? null : current.currentError,
                        }));

                        // Call callbacks
                        config.onRecoveryAttempt(attempt);

                        if (success) {
                            config.onRecoverySuccess(recoveryStrategy);
                        } else {
                            config.onRecoveryFailure(prev.currentError!, [
                                attempt,
                                ...prev.recoveryAttempts,
                            ]);
                        }

                        resolve(success);
                    };

                    // Start async recovery
                    performRecovery();

                    return {
                        ...prev,
                        isRecovering: true,
                        lastRecoveryAttempt: new Date(),
                    };
                });
            });
        },
        [createErrorContext, getRecoveryStrategy, config]
    );

    // Clear current error
    const clearError = useCallback(() => {
        if (recoveryTimeoutRef.current) {
            clearTimeout(recoveryTimeoutRef.current);
            recoveryTimeoutRef.current = null;
        }

        setErrorState((prev) => ({
            ...prev,
            currentError: null,
            consecutiveFailures: 0,
        }));
    }, []);

    // Clear error history
    const clearErrorHistory = useCallback(() => {
        setErrorState((prev) => ({
            ...prev,
            errorHistory: [],
            recoveryAttempts: [],
        }));

        errorFrequencyWindowRef.current = [];
    }, []);

    // Get debug information
    const getDebugInfo = useCallback((): Record<string, unknown> => {
        const userContext = SignalRAuthService.getUserContext();

        return {
            sessionId: sessionIdRef.current,
            userContext,
            isOnline,
            errorState,
            errorFrequency: getErrorFrequency(),
            config: {
                maxRetryAttempts: config.maxRetryAttempts,
                maxErrorHistory: config.maxErrorHistory,
                retryIntervals: config.retryIntervals,
            },
        };
    }, [errorState, isOnline, getErrorFrequency, config]);

    // Export error log
    const exportErrorLog = useCallback((): string => {
        const debugInfo = getDebugInfo();
        return JSON.stringify(debugInfo, null, 2);
    }, [getDebugInfo]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recoveryTimeoutRef.current) {
                clearTimeout(recoveryTimeoutRef.current);
            }
        };
    }, []);

    // Update error frequency periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setErrorState((prev) => ({
                ...prev,
                errorFrequency: getErrorFrequency(),
            }));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [getErrorFrequency]);

    return {
        errorState,
        handleError,
        clearError,
        clearErrorHistory,
        attemptRecovery,
        canAttemptRecovery:
            !errorState.isRecovering &&
            errorState.currentError !== null &&
            errorState.consecutiveFailures < config.maxRetryAttempts,
        getErrorSeverity,
        getRecoveryStrategy,
        getErrorFrequency,
        getDebugInfo,
        exportErrorLog,
    };
};

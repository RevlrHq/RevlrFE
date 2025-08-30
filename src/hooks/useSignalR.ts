import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    HubConnectionBuilder,
    HubConnection,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import { signalRCircuitBreaker } from '@/lib/utils/signalr-circuit-breaker';
import type {
    SignalRConfig,
    SignalRError,
    SignalRErrorType,
    SignalRConnectionState,
    UseSignalROptions,
    UseSignalRResult,
} from '@/types/signalr';

// Default configuration with conservative retry settings
const DEFAULT_CONFIG: SignalRConfig = {
    hubUrl: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL || '',
    automaticReconnect: true,
    reconnectIntervals: [0, 2000, 10000, 30000, null], // null stops automatic reconnection after 4 attempts
    enableLogging: process.env.NODE_ENV === 'development',
    logLevel:
        process.env.NODE_ENV === 'development' ? 'information' : 'warning',
    accessTokenFactory: SignalRAuthService.createTokenFactory(),
};

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

// Helper function to determine error type
const determineErrorType = (error: Error): SignalRErrorType => {
    const message = error.message.toLowerCase();

    if (
        message.includes('unauthorized') ||
        message.includes('authentication') ||
        message.includes('401') ||
        message.includes('forbidden') ||
        message.includes('403')
    ) {
        return 'authentication' as SignalRErrorType;
    }
    if (message.includes('network') || message.includes('connection')) {
        return 'network' as SignalRErrorType;
    }
    if (message.includes('hub') || message.includes('method')) {
        return 'hub_method' as SignalRErrorType;
    }

    return 'unexpected' as SignalRErrorType;
};

// Helper function to handle authentication errors
const handleAuthenticationError = async (
    error: Error
): Promise<SignalRError> => {
    return await SignalRAuthService.handleAuthenticationFailure(error);
};

export const useSignalR = (
    options: UseSignalROptions = {}
): UseSignalRResult => {
    const {
        config = {},
        eventHandlers = {},
        autoConnect = true,
        enableHealthCheck = true,
        healthCheckInterval = 30000,
    } = options;

    // Merge configuration with defaults - memoized to prevent dependency changes
    const finalConfig: SignalRConfig = useMemo(
        () => ({ ...DEFAULT_CONFIG, ...config }),
        [config]
    );

    // State
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [connectionState, setConnectionState] =
        useState<SignalRConnectionState>({
            state: HubConnectionState.Disconnected,
            reconnectAttempts: 0,
            isHealthy: false,
        });
    const [, setError] = useState<SignalRError | null>(null);

    // Refs for cleanup and health checking
    const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef(false);

    // Helper function to update connection state
    const updateConnectionState = useCallback(
        (updates: Partial<SignalRConnectionState>) => {
            setConnectionState((prev) => ({ ...prev, ...updates }));
        },
        []
    );

    // Health check function
    const checkHealth = useCallback(async (): Promise<boolean> => {
        if (!connection || connection.state !== HubConnectionState.Connected) {
            return false;
        }

        try {
            const startTime = Date.now();
            await connection.invoke('Ping');
            const latency = Date.now() - startTime;

            updateConnectionState({
                isHealthy: true,
                latency,
            });

            return true;
        } catch {
            updateConnectionState({ isHealthy: false });
            return false;
        }
    }, [connection, updateConnectionState]);

    // Measure latency function
    const measureLatency = useCallback(async (): Promise<number> => {
        if (!connection || connection.state !== HubConnectionState.Connected) {
            return -1;
        }

        try {
            const startTime = Date.now();
            await connection.invoke('Ping');
            const latency = Date.now() - startTime;

            updateConnectionState({ latency });
            return latency;
        } catch {
            return -1;
        }
    }, [connection, updateConnectionState]);

    // Create connection function
    const createConnection = useCallback((): HubConnection => {
        const builder = new HubConnectionBuilder().withUrl(finalConfig.hubUrl, {
            accessTokenFactory: finalConfig.accessTokenFactory,
        });

        if (finalConfig.automaticReconnect) {
            builder.withAutomaticReconnect(finalConfig.reconnectIntervals);
        }

        if (finalConfig.enableLogging) {
            const logLevel = {
                trace: LogLevel.Trace,
                debug: LogLevel.Debug,
                information: LogLevel.Information,
                warning: LogLevel.Warning,
                error: LogLevel.Error,
                critical: LogLevel.Critical,
                none: LogLevel.None,
            }[finalConfig.logLevel];

            builder.configureLogging(logLevel);
        }

        return builder.build();
    }, [finalConfig]);

    // Circuit breaker check function
    // Circuit breaker functions using centralized circuit breaker
    const checkCircuitBreaker = useCallback((): boolean => {
        const canConnect = signalRCircuitBreaker.canAttemptConnection();

        if (!canConnect) {
            const state = signalRCircuitBreaker.getState();
            console.warn(
                `SignalR: ${signalRCircuitBreaker.getStatusMessage()}`
            );

            // Notify about circuit breaker blocking connection
            const circuitBreakerError = createSignalRError(
                'connection' as SignalRErrorType,
                signalRCircuitBreaker.getStatusMessage(),
                undefined,
                HubConnectionState.Disconnected,
                false // Not retryable while circuit breaker is open
            );
            setError(circuitBreakerError);
            eventHandlers.onError?.(circuitBreakerError);
        }

        return canConnect;
    }, [eventHandlers]);

    // Record connection failure for circuit breaker
    const recordFailure = useCallback(() => {
        signalRCircuitBreaker.recordFailure();
    }, []);

    // Record connection success for circuit breaker
    const recordSuccess = useCallback(() => {
        signalRCircuitBreaker.recordSuccess();
    }, []);

    // Connect function with retry logic and circuit breaker
    const connect = useCallback(async (): Promise<void> => {
        if (
            isConnectingRef.current ||
            (connection && connection.state === HubConnectionState.Connected)
        ) {
            return;
        }

        // Check circuit breaker before attempting connection
        if (!checkCircuitBreaker()) {
            throw createSignalRError(
                'connection' as SignalRErrorType,
                'Connection blocked by circuit breaker due to repeated failures',
                undefined,
                HubConnectionState.Disconnected,
                false
            );
        }

        isConnectingRef.current = true;
        setError(null);

        try {
            let hubConnection = connection;

            if (
                !hubConnection ||
                hubConnection.state === HubConnectionState.Disconnected
            ) {
                hubConnection = createConnection();
                setConnection(hubConnection);
            }

            updateConnectionState({
                state: HubConnectionState.Connecting,
                reconnectAttempts: connectionState.reconnectAttempts + 1,
            });

            // Set up event handlers
            hubConnection.onclose((error) => {
                updateConnectionState({
                    state: HubConnectionState.Disconnected,
                    lastDisconnected: new Date(),
                    isHealthy: false,
                });

                if (error) {
                    const signalRError = createSignalRError(
                        determineErrorType(error),
                        `Connection closed: ${error.message}`,
                        error,
                        HubConnectionState.Disconnected
                    );
                    setError(signalRError);
                    eventHandlers.onError?.(signalRError);
                }

                eventHandlers.onDisconnected?.(error);
            });

            hubConnection.onreconnecting((error) => {
                updateConnectionState({
                    state: HubConnectionState.Reconnecting,
                    isHealthy: false,
                });

                if (error) {
                    const signalRError = createSignalRError(
                        determineErrorType(error),
                        `Reconnecting: ${error.message}`,
                        error,
                        HubConnectionState.Reconnecting
                    );
                    setError(signalRError);
                }

                eventHandlers.onReconnecting?.(error);
            });

            hubConnection.onreconnected((connectionId) => {
                updateConnectionState({
                    state: HubConnectionState.Connected,
                    connectionId,
                    lastConnected: new Date(),
                    reconnectAttempts: 0,
                    isHealthy: true,
                });

                setError(null);
                eventHandlers.onReconnected?.(connectionId);
            });

            // Start the connection
            await hubConnection.start();

            // Record successful connection
            recordSuccess();

            updateConnectionState({
                state: HubConnectionState.Connected,
                connectionId: hubConnection.connectionId || undefined,
                lastConnected: new Date(),
                reconnectAttempts: 0,
                isHealthy: true,
            });

            eventHandlers.onConnected?.();
        } catch (error) {
            // Record failure for circuit breaker
            recordFailure();

            const errorType = determineErrorType(error as Error);
            let signalRError: SignalRError;

            // Handle authentication errors specially
            if (errorType === 'authentication') {
                signalRError = await handleAuthenticationError(error as Error);
            } else {
                signalRError = createSignalRError(
                    errorType,
                    `Failed to connect: ${(error as Error).message}`,
                    error as Error,
                    HubConnectionState.Disconnected
                );
            }

            setError(signalRError);
            updateConnectionState({
                state: HubConnectionState.Disconnected,
                isHealthy: false,
            });

            eventHandlers.onError?.(signalRError);
            throw signalRError;
        } finally {
            isConnectingRef.current = false;
        }
    }, [
        connection,
        connectionState.reconnectAttempts,
        createConnection,
        updateConnectionState,
        eventHandlers,
        checkCircuitBreaker,
        recordFailure,
        recordSuccess,
    ]);

    // Disconnect function
    const disconnect = useCallback(async (): Promise<void> => {
        if (healthCheckIntervalRef.current) {
            clearInterval(healthCheckIntervalRef.current);
            healthCheckIntervalRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (
            connection &&
            connection.state !== HubConnectionState.Disconnected
        ) {
            try {
                await connection.stop();
            } catch (error) {
                console.warn('Error stopping SignalR connection:', error);
            }
        }

        setConnection(null);
        updateConnectionState({
            state: HubConnectionState.Disconnected,
            connectionId: undefined,
            lastDisconnected: new Date(),
            isHealthy: false,
        });

        setError(null);
    }, [connection, updateConnectionState]);

    // Reconnect function
    const reconnect = useCallback(async (): Promise<void> => {
        await disconnect();
        await connect();
    }, [disconnect, connect]);

    // Event handling functions
    const on = useCallback(
        (methodName: string, handler: (...args: unknown[]) => void) => {
            if (connection) {
                connection.on(methodName, handler);
            }
        },
        [connection]
    );

    const off = useCallback(
        (methodName: string, handler?: (...args: unknown[]) => void) => {
            if (connection) {
                if (handler) {
                    connection.off(methodName, handler);
                } else {
                    connection.off(methodName);
                }
            }
        },
        [connection]
    );

    const invoke = useCallback(
        async <T = unknown>(
            methodName: string,
            ...args: unknown[]
        ): Promise<T> => {
            if (
                !connection ||
                connection.state !== HubConnectionState.Connected
            ) {
                throw createSignalRError(
                    'connection' as SignalRErrorType,
                    'Cannot invoke method: connection is not established',
                    undefined,
                    connection?.state,
                    true
                );
            }

            try {
                return await connection.invoke<T>(methodName, ...args);
            } catch (error) {
                const signalRError = createSignalRError(
                    'hub_method' as SignalRErrorType,
                    `Failed to invoke ${methodName}: ${(error as Error).message}`,
                    error as Error,
                    connection.state,
                    true
                );

                setError(signalRError);
                eventHandlers.onError?.(signalRError);
                throw signalRError;
            }
        },
        [connection, eventHandlers]
    );

    const send = useCallback(
        async (methodName: string, ...args: unknown[]): Promise<void> => {
            if (
                !connection ||
                connection.state !== HubConnectionState.Connected
            ) {
                throw createSignalRError(
                    'connection' as SignalRErrorType,
                    'Cannot send message: connection is not established',
                    undefined,
                    connection?.state,
                    true
                );
            }

            try {
                await connection.send(methodName, ...args);
            } catch (error) {
                const signalRError = createSignalRError(
                    'hub_method' as SignalRErrorType,
                    `Failed to send ${methodName}: ${(error as Error).message}`,
                    error as Error,
                    connection.state,
                    true
                );

                setError(signalRError);
                eventHandlers.onError?.(signalRError);
                throw signalRError;
            }
        },
        [connection, eventHandlers]
    );

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect && finalConfig.hubUrl) {
            connect().catch((error) => {
                console.debug('Auto-connect failed:', error);
            });
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, finalConfig.hubUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // Health check interval
    useEffect(() => {
        if (
            enableHealthCheck &&
            connection &&
            connection.state === HubConnectionState.Connected
        ) {
            healthCheckIntervalRef.current = setInterval(() => {
                checkHealth().catch((error) => {
                    console.warn('Health check failed:', error);
                });
            }, healthCheckInterval);
        }

        return () => {
            if (healthCheckIntervalRef.current) {
                clearInterval(healthCheckIntervalRef.current);
                healthCheckIntervalRef.current = null;
            }
        };
    }, [
        connection,
        connectionState.state,
        enableHealthCheck,
        healthCheckInterval,
        checkHealth,
    ]);

    // Authentication state monitoring
    useEffect(() => {
        const unsubscribe = SignalRAuthService.subscribeToAuthChanges(
            async (isAuthenticated, userId) => {
                if (!isAuthenticated) {
                    // User logged out, disconnect SignalR
                    await disconnect();
                } else if (userId && autoConnect) {
                    // User logged in or changed, reconnect if auto-connect is enabled
                    if (
                        connection &&
                        connection.state === HubConnectionState.Connected
                    ) {
                        await reconnect();
                    } else {
                        await connect().catch((error) => {
                            console.debug(
                                'Failed to connect after auth change:',
                                error
                            );
                        });
                    }
                }
            }
        );

        return unsubscribe;
    }, [autoConnect, connection, connect, disconnect, reconnect]);

    // Computed state helpers
    const isConnected = connectionState.state === HubConnectionState.Connected;
    const isConnecting =
        connectionState.state === HubConnectionState.Connecting;
    const isReconnecting =
        connectionState.state === HubConnectionState.Reconnecting;
    const isDisconnected =
        connectionState.state === HubConnectionState.Disconnected;

    return {
        // Connection state
        connection,
        connectionState,
        error: null, // Always return null since we removed the error state variable

        // Connection status helpers
        isConnected,
        isConnecting,
        isReconnecting,
        isDisconnected,

        // Connection actions
        connect,
        disconnect,
        reconnect,

        // Health monitoring
        checkHealth,
        measureLatency,

        // Event handling
        on,
        off,
        invoke,
        send,
    };
};

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSignalR } from '@/hooks/useSignalR';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import type {
    UseSignalRResult,
    UseSignalROptions,
    SignalRError,
} from '@/types/signalr';

// SignalR Context interface
interface SignalRContextValue extends UseSignalRResult {
    // Additional context-specific methods
    isReady: boolean;
    lastError: SignalRError | null;
    clearError: () => void;
}

// Create the context
const SignalRContext = createContext<SignalRContextValue | null>(null);

// Provider props interface
interface SignalRProviderProps {
    children: React.ReactNode;
    options?: UseSignalROptions;
    enableGlobalErrorHandling?: boolean;
    enableConnectionLogging?: boolean;
}

/**
 * SignalR Provider component that manages the global SignalR connection
 * and provides it to all child components through React Context
 */
export function SignalRProvider({
    children,
    options = {},
    enableGlobalErrorHandling = true,
    enableConnectionLogging = process.env.NODE_ENV === 'development',
}: SignalRProviderProps) {
    // State for provider-specific functionality
    const [isReady, setIsReady] = useState(false);
    const [lastError, setLastError] = useState<SignalRError | null>(null);

    // Default options with authentication integration
    const defaultOptions: UseSignalROptions = {
        autoConnect: true,
        enableHealthCheck: true,
        healthCheckInterval: 30000,
        config: {
            enableLogging: enableConnectionLogging,
            accessTokenFactory: SignalRAuthService.createTokenFactory(),
        },
        eventHandlers: {
            onConnected: () => {
                if (enableConnectionLogging) {
                    console.log('SignalR: Connected successfully');
                }
                setIsReady(true);
                setLastError(null);
            },
            onDisconnected: (error) => {
                if (enableConnectionLogging) {
                    console.log(
                        'SignalR: Disconnected',
                        error?.message || 'No error'
                    );
                }
                setIsReady(false);
                if (error && enableGlobalErrorHandling) {
                    setLastError({
                        type: 'connection',
                        message: `Connection lost: ${error.message}`,
                        originalError: error,
                        timestamp: new Date(),
                        retryable: true,
                    });
                }
            },
            onReconnecting: (error) => {
                if (enableConnectionLogging) {
                    console.log(
                        'SignalR: Reconnecting...',
                        error?.message || 'No error'
                    );
                }
                setIsReady(false);
            },
            onReconnected: (connectionId) => {
                if (enableConnectionLogging) {
                    console.log('SignalR: Reconnected with ID:', connectionId);
                }
                setIsReady(true);
                setLastError(null);
            },
            onError: (error) => {
                if (enableConnectionLogging) {
                    console.debug('SignalR: Error occurred:', error);
                }
                if (enableGlobalErrorHandling) {
                    setLastError(error);
                }
            },
        },
        ...options,
    };

    // Merge event handlers properly
    if (options.eventHandlers) {
        defaultOptions.eventHandlers = {
            ...defaultOptions.eventHandlers,
            ...options.eventHandlers,
        };
    }

    // Use the SignalR hook with merged options
    const signalRResult = useSignalR(defaultOptions);

    // Clear error function
    const clearError = () => {
        setLastError(null);
    };

    // Monitor authentication state for connection readiness
    useEffect(() => {
        const isAuthenticated = SignalRAuthService.isAuthenticated();

        if (!isAuthenticated) {
            setIsReady(false);
        } else if (signalRResult.isConnected) {
            setIsReady(true);
        }
    }, [signalRResult.isConnected]);

    // Global error handling effect
    useEffect(() => {
        if (enableGlobalErrorHandling && signalRResult.error) {
            setLastError(signalRResult.error);

            // Log critical errors
            if (
                signalRResult.error.type === 'authentication' &&
                !signalRResult.error.retryable
            ) {
                console.debug(
                    'SignalR: Critical authentication error - user will be redirected to login'
                );
            }
        }
    }, [signalRResult.error, enableGlobalErrorHandling]);

    // Context value
    const contextValue: SignalRContextValue = {
        ...signalRResult,
        isReady,
        lastError,
        clearError,
    };

    return (
        <SignalRContext.Provider value={contextValue}>
            {children}
        </SignalRContext.Provider>
    );
}

/**
 * Hook to use the SignalR context
 * Must be used within a SignalRProvider
 */
export function useSignalRContext(): SignalRContextValue {
    const context = useContext(SignalRContext);

    if (!context) {
        throw new Error(
            'useSignalRContext must be used within a SignalRProvider'
        );
    }

    return context;
}

/**
 * Hook to check if SignalR is available and ready
 * Returns false if not within a SignalRProvider
 */
export function useSignalRAvailable(): boolean {
    const context = useContext(SignalRContext);
    return context?.isReady ?? false;
}

/**
 * Hook to get SignalR connection status
 * Returns null if not within a SignalRProvider
 */
export function useSignalRStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    isReady: boolean;
    error: SignalRError | null;
} | null {
    const context = useContext(SignalRContext);

    if (!context) {
        return null;
    }

    return {
        isConnected: context.isConnected,
        isConnecting: context.isConnecting,
        isReconnecting: context.isReconnecting,
        isReady: context.isReady,
        error: context.lastError,
    };
}

/**
 * Higher-order component that provides SignalR context
 */
export function withSignalR<P extends object>(
    Component: React.ComponentType<P>,
    providerOptions?: Omit<SignalRProviderProps, 'children'>
) {
    return function SignalRWrappedComponent(props: P) {
        return (
            <SignalRProvider {...providerOptions}>
                <Component {...props} />
            </SignalRProvider>
        );
    };
}

/**
 * Component that renders children only when SignalR is ready
 */
export function SignalRReady({
    children,
    fallback = null,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const isReady = useSignalRAvailable();

    return isReady ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders children only when SignalR is connected
 */
export function SignalRConnected({
    children,
    fallback = null,
}: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    const status = useSignalRStatus();

    return status?.isConnected ? <>{children}</> : <>{fallback}</>;
}

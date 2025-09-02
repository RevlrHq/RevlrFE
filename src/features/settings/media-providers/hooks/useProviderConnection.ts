import { useState, useCallback, useMemo } from 'react';
import { MediaProviderService } from '../../services/MediaProviderService';
import type { MediaProvider, MediaProviderConnection } from '../types';

/**
 * Hook for managing individual provider connection flows
 * Handles OAuth workflows and connection state management
 */
export function useProviderConnection(provider: MediaProvider) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [oauthWindow, setOauthWindow] = useState<Window | null>(null);

    const mediaProviderService = useMemo(() => new MediaProviderService(), []);

    /**
     * Initiate connection to the provider
     */
    const connect = useCallback(
        async (connection: MediaProviderConnection) => {
            try {
                setIsConnecting(true);
                setError(null);

                const result =
                    await mediaProviderService.connectProvider(connection);

                // If result contains an auth URL, handle OAuth flow
                if (result.includes('http')) {
                    const authWindow = window.open(
                        result,
                        'oauth-popup',
                        'width=600,height=600,scrollbars=yes,resizable=yes'
                    );

                    setOauthWindow(authWindow);

                    // Monitor OAuth window
                    return new Promise<void>((resolve, reject) => {
                        const checkClosed = setInterval(() => {
                            if (authWindow?.closed) {
                                clearInterval(checkClosed);
                                setOauthWindow(null);
                                setIsConnecting(false);
                                reject(new Error('OAuth window was closed'));
                            }
                        }, 1000);

                        // Listen for OAuth success message
                        const handleMessage = (event: MessageEvent) => {
                            if (
                                event.data?.type === 'oauth-success' &&
                                event.data?.providerId === provider.id
                            ) {
                                clearInterval(checkClosed);
                                authWindow?.close();
                                setOauthWindow(null);
                                setIsConnecting(false);
                                window.removeEventListener(
                                    'message',
                                    handleMessage
                                );
                                resolve();
                            } else if (event.data?.type === 'oauth-error') {
                                clearInterval(checkClosed);
                                authWindow?.close();
                                setOauthWindow(null);
                                setIsConnecting(false);
                                window.removeEventListener(
                                    'message',
                                    handleMessage
                                );
                                reject(
                                    new Error(
                                        event.data.error || 'OAuth failed'
                                    )
                                );
                            }
                        };

                        window.addEventListener('message', handleMessage);
                    });
                }
            } catch (err) {
                setIsConnecting(false);
                const errorMessage =
                    err instanceof Error ? err.message : 'Connection failed';
                setError(errorMessage);
                throw err;
            }
        },
        [provider.id, mediaProviderService]
    );

    /**
     * Disconnect from the provider
     */
    const disconnect = useCallback(
        async (revokeAccess = true) => {
            try {
                setIsDisconnecting(true);
                setError(null);

                await mediaProviderService.disconnectProvider({
                    providerId: provider.id,
                    revokeAccess,
                });
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Disconnection failed';
                setError(errorMessage);
                throw err;
            } finally {
                setIsDisconnecting(false);
            }
        },
        [provider.id, mediaProviderService]
    );

    /**
     * Refresh the provider connection
     */
    const refresh = useCallback(async () => {
        try {
            setError(null);
            await mediaProviderService.refreshConnection(provider.id);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Refresh failed';
            setError(errorMessage);
            throw err;
        }
    }, [provider.id, mediaProviderService]);

    /**
     * Test the provider connection
     */
    const testConnection = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);
            return await mediaProviderService.testConnection(provider.id);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Connection test failed';
            setError(errorMessage);
            return false;
        }
    }, [provider.id, mediaProviderService]);

    /**
     * Cancel ongoing OAuth flow
     */
    const cancelOAuth = useCallback(() => {
        if (oauthWindow) {
            oauthWindow.close();
            setOauthWindow(null);
            setIsConnecting(false);
        }
    }, [oauthWindow]);

    /**
     * Clear any errors
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isConnecting,
        isDisconnecting,
        error,
        oauthWindow,
        connect,
        disconnect,
        refresh,
        testConnection,
        cancelOAuth,
        clearError,
    };
}

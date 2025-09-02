import { useState, useEffect, useCallback, useMemo } from 'react';
import { MediaProviderService } from '../../services/MediaProviderService';
import type {
    MediaProvider,
    MediaProviderConnection,
    MediaProviderDisconnection,
} from '../types';

/**
 * Hook for managing media provider state and operations
 * Provides CRUD operations and real-time status updates
 */
export function useMediaProviders() {
    const [providers, setProviders] = useState<MediaProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mediaProviderService = useMemo(() => new MediaProviderService(), []);

    /**
     * Load providers from the API
     */
    const loadProviders = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await mediaProviderService.getProviders();
            setProviders(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load providers';
            setError(errorMessage);
            console.error('Error loading providers:', err);
        } finally {
            setIsLoading(false);
        }
    }, [mediaProviderService]);

    /**
     * Connect to a media provider
     */
    const connectProvider = useCallback(
        async (connection: MediaProviderConnection) => {
            try {
                setError(null);
                await mediaProviderService.connectProvider(connection);

                // Refresh providers list to get updated status
                await loadProviders();
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to connect provider';
                setError(errorMessage);
                throw err;
            }
        },
        [loadProviders, mediaProviderService]
    );

    /**
     * Disconnect from a media provider
     */
    const disconnectProvider = useCallback(
        async (disconnection: MediaProviderDisconnection) => {
            try {
                setError(null);
                await mediaProviderService.disconnectProvider(disconnection);

                // Update local state immediately for better UX
                setProviders((prev) =>
                    prev.map((provider) =>
                        provider.id === disconnection.providerId
                            ? {
                                  ...provider,
                                  isConnected: false,
                                  connectionStatus: 'disconnected' as const,
                              }
                            : provider
                    )
                );

                // Refresh providers list to get accurate status
                await loadProviders();
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to disconnect provider';
                setError(errorMessage);
                throw err;
            }
        },
        [loadProviders, mediaProviderService]
    );

    /**
     * Refresh connection for a provider
     */
    const refreshProvider = useCallback(
        async (providerId: string) => {
            try {
                setError(null);
                await mediaProviderService.refreshConnection(providerId);

                // Update local state to show refreshing status
                setProviders((prev) =>
                    prev.map((provider) =>
                        provider.id === providerId
                            ? {
                                  ...provider,
                                  connectionStatus: 'pending' as const,
                              }
                            : provider
                    )
                );

                // Refresh providers list to get updated status
                await loadProviders();
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to refresh provider';
                setError(errorMessage);
                throw err;
            }
        },
        [loadProviders, mediaProviderService]
    );

    /**
     * Update permissions for a provider
     */
    const updatePermissions = useCallback(
        async (providerId: string, permissions: string[]) => {
            try {
                setError(null);
                await mediaProviderService.updatePermissions(
                    providerId,
                    permissions
                );

                // Update local state
                setProviders((prev) =>
                    prev.map((provider) =>
                        provider.id === providerId
                            ? {
                                  ...provider,
                                  permissions: provider.permissions.map(
                                      (perm) => ({
                                          ...perm,
                                          granted: permissions.includes(
                                              perm.id
                                          ),
                                      })
                                  ),
                              }
                            : provider
                    )
                );
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to update permissions';
                setError(errorMessage);
                throw err;
            }
        },
        [mediaProviderService]
    );

    /**
     * Test connection for a provider
     */
    const testConnection = useCallback(
        async (providerId: string): Promise<boolean> => {
            try {
                return await mediaProviderService.testConnection(providerId);
            } catch (err) {
                console.error('Error testing connection:', err);
                return false;
            }
        },
        [mediaProviderService]
    );

    /**
     * Get connected providers only
     */
    const getConnectedProviders = useCallback(() => {
        return providers.filter((provider) => provider.isConnected);
    }, [providers]);

    /**
     * Get available (not connected) providers
     */
    const getAvailableProviders = useCallback(() => {
        return providers.filter((provider) => !provider.isConnected);
    }, [providers]);

    // Load providers on mount
    useEffect(() => {
        loadProviders();
    }, [loadProviders]);

    // Listen for OAuth callback messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'oauth-success') {
                // Refresh providers when OAuth completes
                loadProviders();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [loadProviders]);

    return {
        providers,
        isLoading,
        error,
        connectProvider,
        disconnectProvider,
        refreshProvider,
        updatePermissions,
        testConnection,
        getConnectedProviders,
        getAvailableProviders,
        reload: loadProviders,
    };
}

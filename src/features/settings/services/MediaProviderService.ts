import type {
    MediaProvider,
    MediaProviderConnection,
    MediaProviderDisconnection,
    ProviderConfig,
} from '../types/media-providers';

/**
 * Service class for managing media provider integrations
 * Handles OAuth flows, connection management, and provider operations
 */
export class MediaProviderService {
    private readonly baseUrl = '/api/settings/media-providers';

    /**
     * Get all available and connected media providers
     */
    async getProviders(): Promise<MediaProvider[]> {
        try {
            const response = await fetch(`${this.baseUrl}`);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch providers: ${response.statusText}`
                );
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching media providers:', error);
            throw error;
        }
    }

    /**
     * Get connected providers only
     */
    async getConnectedProviders(): Promise<MediaProvider[]> {
        const providers = await this.getProviders();
        return providers.filter((provider) => provider.isConnected);
    }

    /**
     * Initiate connection to a media provider
     */
    async connectProvider(
        connection: MediaProviderConnection
    ): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(connection),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to connect provider');
            }

            const result = await response.json();

            // If OAuth is required, return the auth URL
            if (result.authUrl) {
                // Open OAuth window
                window.open(result.authUrl, 'oauth', 'width=600,height=600');
                return result.authUrl;
            }

            return result.message || 'Connected successfully';
        } catch (error) {
            console.error('Error connecting provider:', error);
            throw error;
        }
    }

    /**
     * Disconnect a media provider
     */
    async disconnectProvider(
        disconnection: MediaProviderDisconnection
    ): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(disconnection),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || 'Failed to disconnect provider'
                );
            }
        } catch (error) {
            console.error('Error disconnecting provider:', error);
            throw error;
        }
    }

    /**
     * Refresh connection for a provider (re-authenticate)
     */
    async refreshConnection(providerId: string): Promise<void> {
        try {
            const response = await fetch(
                `${this.baseUrl}/${providerId}/refresh`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || 'Failed to refresh connection'
                );
            }
        } catch (error) {
            console.error('Error refreshing connection:', error);
            throw error;
        }
    }

    /**
     * Update permissions for a connected provider
     */
    async updatePermissions(
        providerId: string,
        permissions: string[]
    ): Promise<void> {
        try {
            const response = await fetch(
                `${this.baseUrl}/${providerId}/permissions`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ permissions }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || 'Failed to update permissions'
                );
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            throw error;
        }
    }

    /**
     * Get provider configuration
     */
    async getProviderConfig(providerId: string): Promise<ProviderConfig> {
        try {
            const response = await fetch(
                `${this.baseUrl}/${providerId}/config`
            );
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch provider config: ${response.statusText}`
                );
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching provider config:', error);
            throw error;
        }
    }

    /**
     * Test provider connection
     */
    async testConnection(providerId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/${providerId}/test`, {
                method: 'POST',
            });
            return response.ok;
        } catch (error) {
            console.error('Error testing connection:', error);
            return false;
        }
    }
}

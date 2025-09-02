import type {
    AccountInfo,
    AccountDeletionRequest,
    AccountDeletionConfirmation,
    DataRetentionSettings,
    AccountActivity,
} from '../types/account';

/**
 * AccountService - Service class for account management operations
 *
 * Handles all account-related operations including:
 * - Account information retrieval
 * - Account deletion requests and cancellation
 * - Data retention settings management
 * - Account activity tracking
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export class AccountService {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Get current account information
     */
    async getAccountInfo(): Promise<AccountInfo> {
        try {
            const response = await fetch(`${this.baseUrl}/account/info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch account info: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching account info:', error);
            throw error;
        }
    }

    /**
     * Request account deletion
     */
    async requestAccountDeletion(
        confirmation: AccountDeletionConfirmation
    ): Promise<AccountDeletionRequest> {
        try {
            const response = await fetch(`${this.baseUrl}/account/deletion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(confirmation),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message ||
                        `Failed to request deletion: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error requesting account deletion:', error);
            throw error;
        }
    }

    /**
     * Cancel pending account deletion
     */
    async cancelAccountDeletion(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/account/deletion`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to cancel deletion: ${response.statusText}`
                );
            }
        } catch (error) {
            console.error('Error cancelling account deletion:', error);
            throw error;
        }
    }

    /**
     * Get pending deletion request
     */
    async getDeletionRequest(): Promise<AccountDeletionRequest | null> {
        try {
            const response = await fetch(`${this.baseUrl}/account/deletion`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.status === 404) {
                return null; // No pending deletion
            }

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch deletion request: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching deletion request:', error);
            throw error;
        }
    }

    /**
     * Check if user has active subscription
     */
    async hasActiveSubscription(): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/account/subscription/status`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to check subscription: ${response.statusText}`
                );
            }

            const data = await response.json();
            return data.hasActiveSubscription || false;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false; // Default to false on error
        }
    }

    /**
     * Request data export
     */
    async requestDataExport(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/account/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to request data export: ${response.statusText}`
                );
            }
        } catch (error) {
            console.error('Error requesting data export:', error);
            throw error;
        }
    }

    /**
     * Get account activity history
     */
    async getAccountActivity(limit: number = 50): Promise<AccountActivity[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/account/activity?limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch activity: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching account activity:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const accountService = new AccountService();

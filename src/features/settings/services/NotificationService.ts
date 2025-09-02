import type {
    NotificationPreferences,
    NotificationChannel,
    NotificationType,
    NotificationUpdateRequest,
    NotificationTestRequest,
} from '../types/notifications';

/**
 * Service for managing notification preferences and testing
 */
export class NotificationService {
    private baseUrl = '/api/settings/notifications';

    /**
     * Get current notification preferences for the user
     */
    async getPreferences(): Promise<NotificationPreferences> {
        try {
            const response = await fetch(`${this.baseUrl}/preferences`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch preferences: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            throw error;
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(
        preferences: Partial<NotificationPreferences>
    ): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ preferences }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to update preferences: ${response.statusText}`
                );
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    /**
     * Test a specific notification type and channel
     */
    async testNotification(
        channel: NotificationChannel,
        type: NotificationType
    ): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ channel, type }),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to send test notification: ${response.statusText}`
                );
            }

            const result = await response.json();
            return result.success === true;
        } catch (error) {
            console.error('Error sending test notification:', error);
            return false;
        }
    }

    /**
     * Request push notification permission
     */
    async requestPushPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting push permission:', error);
            return false;
        }
    }

    /**
     * Check if push notifications are supported and enabled
     */
    isPushSupported(): boolean {
        return 'Notification' in window && 'serviceWorker' in navigator;
    }

    /**
     * Get current push notification permission status
     */
    getPushPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isPushSupported()) {
            return 'unsupported';
        }
        return Notification.permission;
    }
}

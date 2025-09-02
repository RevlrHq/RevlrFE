import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../../services/NotificationService';
import type {
    NotificationPreferences,
    EmailNotificationSettings,
    PushNotificationSettings,
    InAppNotificationSettings,
    NotificationFrequencySettings,
    NotificationChannel,
    NotificationType,
} from '../types';

interface UseNotificationPreferencesReturn {
    preferences: NotificationPreferences | null;
    isLoading: boolean;
    error: string | null;
    updateEmailSettings: (settings: EmailNotificationSettings) => Promise<void>;
    updatePushSettings: (settings: PushNotificationSettings) => Promise<void>;
    updateInAppSettings: (settings: InAppNotificationSettings) => Promise<void>;
    updateFrequencySettings: (
        settings: NotificationFrequencySettings
    ) => Promise<void>;
    testNotification: (
        channel: NotificationChannel,
        type: NotificationType
    ) => Promise<boolean>;
    requestPushPermission: () => Promise<boolean>;
    refreshPreferences: () => Promise<void>;
}

/**
 * Hook for managing notification preferences
 */
export const useNotificationPreferences =
    (): UseNotificationPreferencesReturn => {
        const [preferences, setPreferences] =
            useState<NotificationPreferences | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        const notificationService = new NotificationService();

        /**
         * Load notification preferences from the server
         */
        const loadPreferences = useCallback(async () => {
            try {
                setIsLoading(true);
                setError(null);
                const prefs = await notificationService.getPreferences();
                setPreferences(prefs);
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load preferences';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }, []);

        /**
         * Update preferences on the server and locally
         */
        const updatePreferences = useCallback(
            async (updates: Partial<NotificationPreferences>) => {
                if (!preferences) return;

                try {
                    setError(null);
                    await notificationService.updatePreferences(updates);

                    // Update local state
                    setPreferences((prev) =>
                        prev ? { ...prev, ...updates } : null
                    );
                } catch (err) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : 'Failed to update preferences';
                    setError(errorMessage);
                    throw err;
                }
            },
            [preferences]
        );

        /**
         * Update email notification settings
         */
        const updateEmailSettings = useCallback(
            async (settings: EmailNotificationSettings) => {
                await updatePreferences({ email: settings });
            },
            [updatePreferences]
        );

        /**
         * Update push notification settings
         */
        const updatePushSettings = useCallback(
            async (settings: PushNotificationSettings) => {
                await updatePreferences({ push: settings });
            },
            [updatePreferences]
        );

        /**
         * Update in-app notification settings
         */
        const updateInAppSettings = useCallback(
            async (settings: InAppNotificationSettings) => {
                await updatePreferences({ inApp: settings });
            },
            [updatePreferences]
        );

        /**
         * Update notification frequency settings
         */
        const updateFrequencySettings = useCallback(
            async (settings: NotificationFrequencySettings) => {
                await updatePreferences({ frequency: settings });
            },
            [updatePreferences]
        );

        /**
         * Test a notification
         */
        const testNotification = useCallback(
            async (
                channel: NotificationChannel,
                type: NotificationType
            ): Promise<boolean> => {
                try {
                    setError(null);
                    return await notificationService.testNotification(
                        channel,
                        type
                    );
                } catch (err) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : 'Failed to test notification';
                    setError(errorMessage);
                    return false;
                }
            },
            []
        );

        /**
         * Request push notification permission
         */
        const requestPushPermission =
            useCallback(async (): Promise<boolean> => {
                try {
                    setError(null);
                    const granted =
                        await notificationService.requestPushPermission();

                    if (granted && preferences) {
                        // Enable push notifications if permission was granted
                        await updatePushSettings({
                            ...preferences.push,
                            enabled: true,
                        });
                    }

                    return granted;
                } catch (err) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : 'Failed to request permission';
                    setError(errorMessage);
                    return false;
                }
            }, [preferences, updatePushSettings]);

        /**
         * Refresh preferences from server
         */
        const refreshPreferences = useCallback(async () => {
            await loadPreferences();
        }, [loadPreferences]);

        // Load preferences on mount
        useEffect(() => {
            loadPreferences();
        }, [loadPreferences]);

        return {
            preferences,
            isLoading,
            error,
            updateEmailSettings,
            updatePushSettings,
            updateInAppSettings,
            updateFrequencySettings,
            testNotification,
            requestPushPermission,
            refreshPreferences,
        };
    };

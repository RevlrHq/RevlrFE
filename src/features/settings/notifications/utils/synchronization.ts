import type { NotificationPreferences } from '../types';

/**
 * Utilities for synchronizing notification preferences across devices
 */

interface SyncEvent {
    type: 'preferences_updated';
    data: NotificationPreferences;
    timestamp: number;
    deviceId: string;
}

type SyncCallback = (preferences: NotificationPreferences) => void;

/**
 * Notification preference synchronization manager
 */
export class NotificationSyncManager {
    private callbacks: Set<SyncCallback> = new Set();
    private channel: BroadcastChannel | null = null;
    private deviceId: string;

    constructor() {
        this.deviceId = this.generateDeviceId();
        this.initializeBroadcastChannel();
    }

    /**
     * Initialize broadcast channel for cross-tab communication
     */
    private initializeBroadcastChannel(): void {
        if (typeof BroadcastChannel !== 'undefined') {
            this.channel = new BroadcastChannel(
                'notification-preferences-sync'
            );
            this.channel.addEventListener(
                'message',
                this.handleSyncMessage.bind(this)
            );
        }
    }

    /**
     * Generate a unique device identifier
     */
    private generateDeviceId(): string {
        const stored = localStorage.getItem('notification-device-id');
        if (stored) {
            return stored;
        }

        const deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('notification-device-id', deviceId);
        return deviceId;
    }

    /**
     * Handle incoming sync messages
     */
    private handleSyncMessage(event: MessageEvent<SyncEvent>): void {
        const { type, data, deviceId } = event.data;

        // Ignore messages from the same device
        if (deviceId === this.deviceId) {
            return;
        }

        if (type === 'preferences_updated') {
            this.notifyCallbacks(data);
        }
    }

    /**
     * Notify all registered callbacks
     */
    private notifyCallbacks(preferences: NotificationPreferences): void {
        this.callbacks.forEach((callback) => {
            try {
                callback(preferences);
            } catch (error) {
                console.error('Error in sync callback:', error);
            }
        });
    }

    /**
     * Broadcast preference changes to other tabs/devices
     */
    broadcastPreferenceUpdate(preferences: NotificationPreferences): void {
        if (this.channel) {
            const syncEvent: SyncEvent = {
                type: 'preferences_updated',
                data: preferences,
                timestamp: Date.now(),
                deviceId: this.deviceId,
            };

            this.channel.postMessage(syncEvent);
        }

        // Also store in localStorage for persistence
        this.storePreferencesLocally(preferences);
    }

    /**
     * Store preferences in localStorage for offline access
     */
    private storePreferencesLocally(
        preferences: NotificationPreferences
    ): void {
        try {
            const data = {
                preferences,
                timestamp: Date.now(),
                deviceId: this.deviceId,
            };
            localStorage.setItem(
                'notification-preferences-cache',
                JSON.stringify(data)
            );
        } catch (error) {
            console.error('Failed to store preferences locally:', error);
        }
    }

    /**
     * Get cached preferences from localStorage
     */
    getCachedPreferences(): NotificationPreferences | null {
        try {
            const cached = localStorage.getItem(
                'notification-preferences-cache'
            );
            if (!cached) {
                return null;
            }

            const data = JSON.parse(cached);

            // Check if cache is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > maxAge) {
                localStorage.removeItem('notification-preferences-cache');
                return null;
            }

            return data.preferences;
        } catch (error) {
            console.error('Failed to get cached preferences:', error);
            return null;
        }
    }

    /**
     * Subscribe to preference changes from other devices
     */
    subscribe(callback: SyncCallback): () => void {
        this.callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.callbacks.delete(callback);
        };
    }

    /**
     * Check if the browser supports synchronization features
     */
    isSupported(): boolean {
        return (
            typeof BroadcastChannel !== 'undefined' &&
            typeof localStorage !== 'undefined'
        );
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        this.callbacks.clear();
    }
}

// Singleton instance
export const notificationSyncManager = new NotificationSyncManager();

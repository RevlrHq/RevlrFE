import {
    MediaProviderError,
    MediaProviderErrorType,
} from '@/types/media-search';
import { ErrorRecoveryAction } from './ErrorHandlingService';

export interface ErrorNotification {
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    duration?: number;
    actions?: NotificationAction[];
    metadata?: {
        providerId?: string;
        errorType?: MediaProviderErrorType;
        canRetry?: boolean;
        canDismiss?: boolean;
        priority?: 'low' | 'medium' | 'high';
    };
}

export interface NotificationAction {
    label: string;
    action: 'retry' | 'dismiss' | 'settings' | 'help' | 'custom';
    handler?: () => void;
    primary?: boolean;
}

export interface NotificationConfig {
    maxNotifications: number;
    defaultDuration: number;
    enableGrouping: boolean;
    enableSound: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Service for creating user-friendly error notifications
 */
export class ErrorNotificationService {
    private notifications: Map<string, ErrorNotification> = new Map();
    private listeners: Array<(notifications: ErrorNotification[]) => void> = [];
    private config: NotificationConfig;

    constructor(config: Partial<NotificationConfig> = {}) {
        this.config = {
            maxNotifications: 5,
            defaultDuration: 5000,
            enableGrouping: true,
            enableSound: false,
            position: 'top-right',
            ...config,
        };
    }

    /**
     * Create user-friendly notification from error and recovery action
     */
    createErrorNotification(
        error: MediaProviderError,
        recoveryAction: ErrorRecoveryAction,
        context?: { canRetry?: boolean; onRetry?: () => void }
    ): ErrorNotification {
        return {
            id: this.generateId(),
            type: this.getNotificationType(recoveryAction.severity),
            title: this.getNotificationTitle(error, recoveryAction),
            message: recoveryAction.userMessage,
            duration: this.getNotificationDuration(recoveryAction.severity),
            actions: this.createNotificationActions(
                error,
                recoveryAction,
                context
            ),
            metadata: {
                providerId: error.providerId,
                errorType: error.type,
                canRetry: context?.canRetry ?? false,
                canDismiss: true,
                priority: this.mapSeverityToPriority(recoveryAction.severity),
            },
        };
    } /**

     * Show notification to user
     */
    showNotification(notification: ErrorNotification): void {
        if (this.config.enableGrouping) {
            const existing = this.findSimilarNotification(notification);
            if (existing) {
                this.updateNotification(existing.id, {
                    message: `${existing.message} (${this.getOccurrenceCount(existing) + 1} times)`,
                });
                return;
            }
        }

        this.addNotification(notification);
    }

    /**
     * Show network offline notification
     */
    showOfflineNotification(): void {
        const notification: ErrorNotification = {
            id: 'offline-notification',
            type: 'warning',
            title: 'Connection Lost',
            message:
                'You appear to be offline. Some features may not work properly.',
            duration: 0,
            actions: [
                {
                    label: 'Retry',
                    action: 'retry',
                    handler: () => window.location.reload(),
                },
                {
                    label: 'Dismiss',
                    action: 'dismiss',
                },
            ],
            metadata: {
                canDismiss: true,
                priority: 'high',
            },
        };

        this.showNotification(notification);
    }

    /**
     * Show network back online notification
     */
    showOnlineNotification(): void {
        this.removeNotification('offline-notification');

        const notification: ErrorNotification = {
            id: 'online-notification',
            type: 'success',
            title: 'Connection Restored',
            message: 'You are back online. All features are now available.',
            duration: 3000,
            metadata: {
                canDismiss: true,
                priority: 'medium',
            },
        };

        this.showNotification(notification);
    }

    /**
     * Update existing notification
     */
    updateNotification(id: string, updates: Partial<ErrorNotification>): void {
        const existing = this.notifications.get(id);
        if (existing) {
            const updated = { ...existing, ...updates };
            this.notifications.set(id, updated);
            this.notifyListeners();
        }
    }

    /**
     * Remove notification
     */
    removeNotification(id: string): void {
        if (this.notifications.delete(id)) {
            this.notifyListeners();
        }
    }

    /**
     * Get all active notifications
     */
    getNotifications(): ErrorNotification[] {
        return Array.from(this.notifications.values()).sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.metadata?.priority || 'low'];
            const bPriority = priorityOrder[b.metadata?.priority || 'low'];

            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            return parseInt(b.id.split('-')[0]) - parseInt(a.id.split('-')[0]);
        });
    }

    /**
     * Subscribe to notification changes
     */
    subscribe(
        listener: (notifications: ErrorNotification[]) => void
    ): () => void {
        this.listeners.push(listener);

        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Private methods

    private addNotification(notification: ErrorNotification): void {
        this.notifications.set(notification.id, notification);

        if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, notification.duration);
        }

        if (this.notifications.size > this.config.maxNotifications) {
            const oldest = Array.from(this.notifications.keys())[0];
            this.removeNotification(oldest);
        }

        this.notifyListeners();
    }

    private findSimilarNotification(
        notification: ErrorNotification
    ): ErrorNotification | null {
        for (const existing of this.notifications.values()) {
            if (
                existing.metadata?.providerId ===
                    notification.metadata?.providerId &&
                existing.metadata?.errorType ===
                    notification.metadata?.errorType &&
                existing.type === notification.type
            ) {
                return existing;
            }
        }
        return null;
    }

    private getOccurrenceCount(notification: ErrorNotification): number {
        const match = notification.message.match(/\((\d+) times\)$/);
        return match ? parseInt(match[1]) : 1;
    }

    private getNotificationType(
        severity: string
    ): 'error' | 'warning' | 'info' | 'success' {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
            default:
                return 'info';
        }
    }

    private getNotificationTitle(
        error: MediaProviderError,
        recoveryAction: ErrorRecoveryAction
    ): string {
        switch (error.type) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'Connection Issue';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 'Service Limit Reached';
            case MediaProviderErrorType.API_KEY_INVALID:
                return 'Service Configuration Issue';
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 'Service Temporarily Unavailable';
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'Download Failed';
            case MediaProviderErrorType.SEARCH_FAILED:
                return 'Search Issue';
            default:
                return 'Unexpected Error';
        }
    }

    private getNotificationDuration(severity: string): number {
        switch (severity) {
            case 'critical':
                return 0;
            case 'high':
                return 10000;
            case 'medium':
                return 7000;
            case 'low':
            default:
                return this.config.defaultDuration;
        }
    }

    private createNotificationActions(
        error: MediaProviderError,
        recoveryAction: ErrorRecoveryAction,
        context?: { canRetry?: boolean; onRetry?: () => void }
    ): NotificationAction[] {
        const actions: NotificationAction[] = [];

        if (
            context?.canRetry &&
            ['retry_with_backoff', 'network_error'].includes(
                recoveryAction.action
            )
        ) {
            actions.push({
                label: 'Retry',
                action: 'retry',
                handler: context.onRetry,
                primary: true,
            });
        }

        if (error.type === MediaProviderErrorType.API_KEY_INVALID) {
            actions.push({
                label: 'Help',
                action: 'help',
                handler: () => {
                    window.open('/help/provider-configuration', '_blank');
                },
            });
        }

        actions.push({
            label: 'Dismiss',
            action: 'dismiss',
        });

        return actions;
    }

    private mapSeverityToPriority(severity: string): 'low' | 'medium' | 'high' {
        switch (severity) {
            case 'critical':
            case 'high':
                return 'high';
            case 'medium':
                return 'medium';
            case 'low':
            default:
                return 'low';
        }
    }

    private notifyListeners(): void {
        const notifications = this.getNotifications();
        this.listeners.forEach((listener) => {
            try {
                listener(notifications);
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        });
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

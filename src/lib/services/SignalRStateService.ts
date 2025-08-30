import { useAuthStore } from '@/stores/authStore';
import type {
    NotificationMessage,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
} from '@/types/notifications';

/**
 * SignalR State Management Service
 * Integrates SignalR notifications with Zustand stores for consistent state management
 */
export class SignalRStateService {
    private static notificationHistory: NotificationMessage[] = [];
    private static readonly MAX_HISTORY_SIZE = 100;

    /**
     * Handle incoming notification and update relevant stores
     */
    static handleNotification(notification: NotificationMessage): void {
        try {
            // Add to notification history
            this.addToHistory(notification);

            // Update stores based on notification type
            switch (notification.type) {
                case 'EventRegistration':
                case 'EventUpdate':
                case 'EventPublished':
                case 'EventCancelled':
                    this.handleEventNotification(notification);
                    break;

                case 'PaymentCompleted':
                case 'PaymentFailed':
                case 'PaymentPending':
                case 'RecurringPaymentProcessed':
                    this.handlePaymentNotification(notification);
                    break;

                case 'FinancingApplicationSubmitted':
                case 'FinancingApplicationApproved':
                case 'FinancingApplicationRejected':
                case 'FinancingPaymentDue':
                    this.handleFinancingNotification(notification);
                    break;

                case 'SystemMaintenance':
                case 'SystemUpdate':
                    this.handleSystemNotification(notification);
                    break;

                default:
                    console.warn(
                        'SignalRStateService: Unknown notification type:',
                        notification.type
                    );
            }

            // Log notification handling in development
            if (process.env.NODE_ENV === 'development') {
                console.log('SignalRStateService: Handled notification', {
                    type: notification.type,
                    id: notification.id,
                    title: notification.title,
                });
            }
        } catch (error) {
            console.debug(
                'SignalRStateService: Error handling notification:',
                error
            );
        }
    }

    /**
     * Handle event-related notifications
     */
    private static handleEventNotification(
        notification: NotificationMessage
    ): void {
        const eventData = notification.data as EventNotificationData;

        if (!eventData) {
            console.warn(
                'SignalRStateService: Event notification missing data'
            );
            return;
        }

        // Update event-related state
        // Note: This would integrate with event stores when they exist
        // For now, we'll just log the event data
        if (process.env.NODE_ENV === 'development') {
            console.log('SignalRStateService: Event notification data', {
                eventId: eventData.eventId,
                eventTitle: eventData.eventTitle,
                organizerName: eventData.organizerName,
                eventDate: eventData.eventDate,
            });
        }

        // Trigger any event-specific state updates
        this.triggerEventStateUpdate(notification.type, eventData);
    }

    /**
     * Handle payment-related notifications
     */
    private static handlePaymentNotification(
        notification: NotificationMessage
    ): void {
        const paymentData = notification.data as PaymentNotificationData;

        if (!paymentData) {
            console.warn(
                'SignalRStateService: Payment notification missing data'
            );
            return;
        }

        // Update payment-related state
        if (process.env.NODE_ENV === 'development') {
            console.log('SignalRStateService: Payment notification data', {
                paymentId: paymentData.paymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                status: paymentData.status,
                eventId: paymentData.eventId,
            });
        }

        // Trigger payment state updates
        this.triggerPaymentStateUpdate(notification.type, paymentData);
    }

    /**
     * Handle financing-related notifications
     */
    private static handleFinancingNotification(
        notification: NotificationMessage
    ): void {
        const financingData = notification.data as FinancingNotificationData;

        if (!financingData) {
            console.warn(
                'SignalRStateService: Financing notification missing data'
            );
            return;
        }

        // Update financing-related state
        if (process.env.NODE_ENV === 'development') {
            console.log('SignalRStateService: Financing notification data', {
                applicationId: financingData.applicationId,
                amount: financingData.amount,
                status: financingData.status,
                eventId: financingData.eventId,
            });
        }

        // Trigger financing state updates
        this.triggerFinancingStateUpdate(notification.type, financingData);
    }

    /**
     * Handle system-related notifications
     */
    private static handleSystemNotification(
        notification: NotificationMessage
    ): void {
        // System notifications typically don't need state updates
        // but we can log them for monitoring
        if (process.env.NODE_ENV === 'development') {
            console.log('SignalRStateService: System notification', {
                type: notification.type,
                message: notification.message,
            });
        }

        // Trigger system state updates if needed
        this.triggerSystemStateUpdate(notification.type, notification);
    }

    /**
     * Add notification to history with size limit
     */
    private static addToHistory(notification: NotificationMessage): void {
        this.notificationHistory.unshift(notification);

        // Maintain history size limit
        if (this.notificationHistory.length > this.MAX_HISTORY_SIZE) {
            this.notificationHistory = this.notificationHistory.slice(
                0,
                this.MAX_HISTORY_SIZE
            );
        }
    }

    /**
     * Get notification history
     */
    static getNotificationHistory(): NotificationMessage[] {
        return [...this.notificationHistory];
    }

    /**
     * Clear notification history
     */
    static clearNotificationHistory(): void {
        this.notificationHistory = [];
    }

    /**
     * Get notifications by type
     */
    static getNotificationsByType(type: string): NotificationMessage[] {
        return this.notificationHistory.filter((n) => n.type === type);
    }

    /**
     * Get recent notifications (last N notifications)
     */
    static getRecentNotifications(count: number = 10): NotificationMessage[] {
        return this.notificationHistory.slice(0, count);
    }

    /**
     * Get unread notifications count
     * Note: This would integrate with a notification read/unread store when implemented
     */
    static getUnreadNotificationsCount(): number {
        // For now, return 0 as we don't have read/unread tracking
        return 0;
    }

    /**
     * Mark notification as read
     * Note: This would integrate with a notification read/unread store when implemented
     */
    static markNotificationAsRead(notificationId: string): void {
        if (process.env.NODE_ENV === 'development') {
            console.log(
                'SignalRStateService: Marking notification as read:',
                notificationId
            );
        }
        // Implementation would update read/unread state
    }

    /**
     * Trigger event state updates
     */
    private static triggerEventStateUpdate(
        notificationType: string,
        eventData: EventNotificationData
    ): void {
        // This would integrate with event stores when they exist
        // For now, we'll emit a custom event that components can listen to
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('signalr-event-update', {
                    detail: { type: notificationType, data: eventData },
                })
            );
        }
    }

    /**
     * Trigger payment state updates
     */
    private static triggerPaymentStateUpdate(
        notificationType: string,
        paymentData: PaymentNotificationData
    ): void {
        // This would integrate with payment stores when they exist
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('signalr-payment-update', {
                    detail: { type: notificationType, data: paymentData },
                })
            );
        }
    }

    /**
     * Trigger financing state updates
     */
    private static triggerFinancingStateUpdate(
        notificationType: string,
        financingData: FinancingNotificationData
    ): void {
        // This would integrate with financing stores when they exist
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('signalr-financing-update', {
                    detail: { type: notificationType, data: financingData },
                })
            );
        }
    }

    /**
     * Trigger system state updates
     */
    private static triggerSystemStateUpdate(
        notificationType: string,
        notification: NotificationMessage
    ): void {
        // System notifications might trigger global state changes
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('signalr-system-update', {
                    detail: { type: notificationType, notification },
                })
            );
        }
    }

    /**
     * Get current user context for state management
     */
    static getCurrentUserContext(): {
        userId: string | null;
        role: string | null;
        isAuthenticated: boolean;
    } {
        const { user, isAuthenticated } = useAuthStore.getState();

        return {
            userId: isAuthenticated && user ? user.id : null,
            role: isAuthenticated && user ? user.role || null : null,
            isAuthenticated,
        };
    }

    /**
     * Check if notification is relevant to current user
     */
    static isNotificationRelevantToUser(
        notification: NotificationMessage
    ): boolean {
        const userContext = this.getCurrentUserContext();

        if (!userContext.isAuthenticated) {
            return false;
        }

        // System notifications are relevant to all users
        if (notification.type.startsWith('System')) {
            return true;
        }

        // Check if notification has user-specific data
        if (notification.data) {
            const data = notification.data as any;

            // Check for userId in notification data
            if (data.userId && data.userId !== userContext.userId) {
                return false;
            }

            // Check for organizer-specific notifications
            if (data.organizerId && data.organizerId !== userContext.userId) {
                return false;
            }
        }

        return true;
    }

    /**
     * Filter notifications for current user
     */
    static getNotificationsForCurrentUser(): NotificationMessage[] {
        return this.notificationHistory.filter((notification) =>
            this.isNotificationRelevantToUser(notification)
        );
    }

    /**
     * Subscribe to state updates via custom events
     */
    static subscribeToStateUpdates(
        eventType: 'event' | 'payment' | 'financing' | 'system',
        callback: (detail: any) => void
    ): () => void {
        if (typeof window === 'undefined') {
            return () => {};
        }

        const eventName = `signalr-${eventType}-update`;
        const handler = (event: CustomEvent) => callback(event.detail);

        window.addEventListener(eventName, handler as EventListener);

        return () => {
            window.removeEventListener(eventName, handler as EventListener);
        };
    }

    /**
     * Get state statistics
     */
    static getStateStatistics(): {
        totalNotifications: number;
        notificationsByType: Record<string, number>;
        recentNotificationsCount: number;
        unreadCount: number;
    } {
        const notificationsByType: Record<string, number> = {};

        this.notificationHistory.forEach((notification) => {
            notificationsByType[notification.type] =
                (notificationsByType[notification.type] || 0) + 1;
        });

        return {
            totalNotifications: this.notificationHistory.length,
            notificationsByType,
            recentNotificationsCount: this.getRecentNotifications(10).length,
            unreadCount: this.getUnreadNotificationsCount(),
        };
    }
}

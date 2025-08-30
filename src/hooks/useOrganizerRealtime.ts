import { useEffect, useCallback, useState } from 'react';
import { useSignalRContext } from '@/providers/SignalRProvider';
// import { useNotificationGroups } from '@/hooks/useNotificationGroups';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useToast } from './use-toast';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    EventNotificationData,
    PaymentNotificationData,
} from '@/types/notifications';
import type { EventRegistrationSummary, EventStatus } from '@/lib/api';

// Real-time update types
export interface DashboardMetricUpdate {
    totalEvents?: number;
    activeEvents?: number;
    totalRevenue?: number;
    totalAttendees?: number;
    revenueGrowth?: number;
    attendeeGrowth?: number;
}

export interface EventStatusUpdate {
    eventId: string;
    eventTitle: string;
    oldStatus: EventStatus;
    newStatus: EventStatus;
    timestamp: string;
}

export interface RegistrationUpdate {
    eventId: string;
    eventTitle: string;
    registration: EventRegistrationSummary;
    timestamp: string;
}

export interface RevenueUpdate {
    eventId?: string;
    eventTitle?: string;
    amount: number;
    totalRevenue: number;
    timestamp: string;
}

export interface OrganizerNotification {
    id: string;
    type: 'registration' | 'event_status' | 'revenue' | 'system' | 'alert';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    timestamp: string;
    eventId?: string;
    actionUrl?: string;
    read: boolean;
}

export interface UseOrganizerRealtimeOptions {
    organizerId?: string;
    enableNotifications?: boolean;
    enableToasts?: boolean;
    notificationPriority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface UseOrganizerRealtimeResult {
    // Connection status
    isConnected: boolean;
    connectionError: string | null;

    // Real-time data updates
    dashboardUpdates: DashboardMetricUpdate | null;
    eventStatusUpdates: EventStatusUpdate[];
    registrationUpdates: RegistrationUpdate[];
    revenueUpdates: RevenueUpdate[];

    // Notifications
    notifications: OrganizerNotification[];
    unreadCount: number;

    // Actions
    markNotificationAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    dismissNotification: (notificationId: string) => void;
    clearAllNotifications: () => void;
    reconnect: () => Promise<void>;

    // Update handlers for external components
    onDashboardUpdate: (
        callback: (update: DashboardMetricUpdate) => void
    ) => () => void;
    onEventStatusUpdate: (
        callback: (update: EventStatusUpdate) => void
    ) => () => void;
    onRegistrationUpdate: (
        callback: (update: RegistrationUpdate) => void
    ) => () => void;
    onRevenueUpdate: (callback: (update: RevenueUpdate) => void) => () => void;
}

export const useOrganizerRealtime = (
    options: UseOrganizerRealtimeOptions = {}
): UseOrganizerRealtimeResult => {
    const {
        // organizerId,
        enableNotifications = true,
        enableToasts = true,
        // notificationPriority = 'medium',
    } = options;

    // Use new SignalR infrastructure
    const signalR = useSignalRContext();
    const { toast } = useToast();

    // Use new notification system
    // const notificationGroups = useNotificationGroups({
    //     userId: organizerId,
    //     userRole: 'organizer',
    //     autoJoinGroups: true,
    // });

    const notificationHandler = useTypedNotificationHandler({
        enableToastNotifications: enableToasts,
        enableHistory: true,
        maxHistorySize: 100,
        onNotificationReceived: (notification) => {
            // Handle organizer-specific notifications
            handleNewNotification(notification);
        },
    });

    // State for real-time updates
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [dashboardUpdates, setDashboardUpdates] =
        useState<DashboardMetricUpdate | null>(null);
    const [eventStatusUpdates, setEventStatusUpdates] = useState<
        EventStatusUpdate[]
    >([]);
    const [registrationUpdates, setRegistrationUpdates] = useState<
        RegistrationUpdate[]
    >([]);
    const [revenueUpdates, setRevenueUpdates] = useState<RevenueUpdate[]>([]);
    const [notifications, setNotifications] = useState<OrganizerNotification[]>(
        []
    );

    // Callback registries for external components
    const [dashboardCallbacks] = useState<
        Set<(update: DashboardMetricUpdate) => void>
    >(new Set());
    const [eventStatusCallbacks] = useState<
        Set<(update: EventStatusUpdate) => void>
    >(new Set());
    const [registrationCallbacks] = useState<
        Set<(update: RegistrationUpdate) => void>
    >(new Set());
    const [revenueCallbacks] = useState<Set<(update: RevenueUpdate) => void>>(
        new Set()
    );

    // Helper function to convert new notifications to legacy format
    const convertToLegacyNotification = useCallback(
        (notification: NotificationMessage): OrganizerNotification => {
            // Map new notification types to legacy types
            const typeMapping: Record<
                NotificationType,
                OrganizerNotification['type']
            > = {
                [NotificationType.EventRegistration]: 'registration',
                [NotificationType.EventUpdate]: 'event_status',
                [NotificationType.EventPublished]: 'event_status',
                [NotificationType.EventCancelled]: 'event_status',
                [NotificationType.PaymentCompleted]: 'revenue',
                [NotificationType.PaymentFailed]: 'alert',
                [NotificationType.PaymentPending]: 'system',
                [NotificationType.RecurringPaymentProcessed]: 'revenue',
                [NotificationType.FinancingApplicationSubmitted]: 'system',
                [NotificationType.FinancingApplicationApproved]: 'system',
                [NotificationType.FinancingApplicationRejected]: 'alert',
                [NotificationType.FinancingPaymentDue]: 'alert',
                [NotificationType.SystemMaintenance]: 'system',
                [NotificationType.SystemUpdate]: 'system',
            };

            // Map new priority to legacy priority
            const priorityMapping: Record<
                NotificationPriority,
                OrganizerNotification['priority']
            > = {
                [NotificationPriority.Low]: 'low',
                [NotificationPriority.Normal]: 'medium',
                [NotificationPriority.High]: 'high',
                [NotificationPriority.Critical]: 'critical',
            };

            // Extract eventId from notification data
            let eventId: string | undefined;
            if (notification.data && 'eventId' in notification.data) {
                eventId = (notification.data as EventNotificationData).eventId;
            }

            return {
                id: notification.id,
                type: typeMapping[notification.type] || 'system',
                priority: priorityMapping[notification.priority] || 'medium',
                title: notification.title,
                message: notification.message,
                timestamp: notification.timestamp,
                eventId,
                actionUrl: notification.actionUrl,
                read: false,
            };
        },
        []
    );

    // Helper function to create notifications (legacy compatibility)
    const createNotification = useCallback(
        (
            type: OrganizerNotification['type'],
            priority: OrganizerNotification['priority'],
            title: string,
            message: string,
            eventId?: string,
            actionUrl?: string
        ): OrganizerNotification => ({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type,
            priority,
            title,
            message,
            timestamp: new Date().toISOString(),
            eventId,
            actionUrl,
            read: false,
        }),
        []
    );

    // Handle new notifications from the new system
    const handleNewNotification = useCallback(
        (notification: NotificationMessage) => {
            const legacyNotification =
                convertToLegacyNotification(notification);
            setNotifications((prev) => [legacyNotification, ...prev]);

            // Process specific notification types for real-time updates
            if (
                notification.type === NotificationType.EventRegistration &&
                notification.data
            ) {
                const eventData = notification.data as EventNotificationData;
                const registrationUpdate: RegistrationUpdate = {
                    eventId: eventData.eventId,
                    eventTitle: eventData.eventTitle,
                    registration: {
                        // Map from new notification data to legacy format
                        attendeeFirstName: 'New',
                        attendeeLastName: 'Attendee',
                        attendeeEmail: 'attendee@example.com',
                        ticketType: 'General',
                        ticketPrice: 0,
                        registrationDate: notification.timestamp,
                        paymentStatus: 'Completed' as unknown,
                    } as EventRegistrationSummary,
                    timestamp: notification.timestamp,
                };
                setRegistrationUpdates((prev) => [
                    registrationUpdate,
                    ...prev.slice(0, 99),
                ]);
                registrationCallbacks.forEach((callback) =>
                    callback(registrationUpdate)
                );
            }

            if (
                notification.type === NotificationType.PaymentCompleted &&
                notification.data
            ) {
                const paymentData =
                    notification.data as PaymentNotificationData;
                const revenueUpdate: RevenueUpdate = {
                    eventId: paymentData.eventId,
                    eventTitle: paymentData.eventTitle,
                    amount: paymentData.amount,
                    totalRevenue: paymentData.amount, // This would need to be calculated properly
                    timestamp: notification.timestamp,
                };
                setRevenueUpdates((prev) => [
                    revenueUpdate,
                    ...prev.slice(0, 49),
                ]);
                revenueCallbacks.forEach((callback) => callback(revenueUpdate));
            }
        },
        [convertToLegacyNotification, registrationCallbacks, revenueCallbacks]
    );

    // Add missing callback arrays that are referenced in the handlers
    // const [registrationCallbacks] = useState<
    //     Set<(update: RegistrationUpdate) => void>
    // >(new Set());
    // const [revenueCallbacks] = useState<Set<(update: RevenueUpdate) => void>>(
    //     new Set()
    // );

    // Helper function to show toast notifications
    const showToast = useCallback(
        (notification: OrganizerNotification) => {
            if (!enableToasts) return;

            const variant =
                notification.priority === 'critical'
                    ? 'destructive'
                    : notification.priority === 'high'
                      ? 'default'
                      : 'default';

            toast({
                title: notification.title,
                description: notification.message,
                variant,
                duration: notification.priority === 'critical' ? 10000 : 5000,
            });
        },
        [enableToasts, toast]
    );

    // Dashboard metrics update handler
    const handleDashboardUpdate = useCallback(
        (update: DashboardMetricUpdate) => {
            setDashboardUpdates(update);

            // Notify external callbacks
            dashboardCallbacks.forEach((callback) => callback(update));

            if (enableNotifications) {
                const notification = createNotification(
                    'system',
                    'low',
                    'Dashboard Updated',
                    'Your dashboard metrics have been updated with the latest data.'
                );
                setNotifications((prev) => [notification, ...prev]);
            }
        },
        [dashboardCallbacks, enableNotifications, createNotification]
    );

    // Event status change handler
    const handleEventStatusUpdate = useCallback(
        (update: EventStatusUpdate) => {
            setEventStatusUpdates((prev) => [update, ...prev.slice(0, 49)]); // Keep last 50 updates

            // Notify external callbacks
            eventStatusCallbacks.forEach((callback) => callback(update));

            if (enableNotifications) {
                // EventStatus is a number, so we need to check the numeric value
                // Assuming Published status has a specific numeric value (this should be documented)
                const priority = update.newStatus === 1 ? 'high' : 'medium'; // Adjust the number based on actual enum values
                const notification = createNotification(
                    'event_status',
                    priority,
                    'Event Status Changed',
                    `"${update.eventTitle}" status changed from ${update.oldStatus} to ${update.newStatus}`,
                    update.eventId,
                    `/dashboard/event/${update.eventId}`
                );
                setNotifications((prev) => [notification, ...prev]);

                if (priority === 'high') {
                    showToast(notification);
                }
            }
        },
        [
            eventStatusCallbacks,
            enableNotifications,
            createNotification,
            showToast,
        ]
    );

    // New registration handler
    const handleRegistrationUpdate = useCallback(
        (update: RegistrationUpdate) => {
            setRegistrationUpdates((prev) => [update, ...prev.slice(0, 99)]); // Keep last 100 updates

            // Notify external callbacks
            registrationCallbacks.forEach((callback) => callback(update));

            if (enableNotifications) {
                const notification = createNotification(
                    'registration',
                    'medium',
                    'New Registration',
                    `New registration for "${update.eventTitle}" by ${update.registration.attendeeFirstName} ${update.registration.attendeeLastName}`,
                    update.eventId,
                    `/dashboard/event/${update.eventId}/registrations`
                );
                setNotifications((prev) => [notification, ...prev]);
                showToast(notification);
            }
        },
        [
            registrationCallbacks,
            enableNotifications,
            createNotification,
            showToast,
        ]
    );

    // Revenue update handler
    const handleRevenueUpdate = useCallback(
        (update: RevenueUpdate) => {
            setRevenueUpdates((prev) => [update, ...prev.slice(0, 49)]); // Keep last 50 updates

            // Notify external callbacks
            revenueCallbacks.forEach((callback) => callback(update));

            if (enableNotifications && update.amount > 0) {
                const notification = createNotification(
                    'revenue',
                    'medium',
                    'Revenue Update',
                    update.eventTitle
                        ? `New payment of $${update.amount.toFixed(2)} for "${update.eventTitle}"`
                        : `Revenue updated: +$${update.amount.toFixed(2)}`,
                    update.eventId,
                    update.eventId
                        ? `/dashboard/event/${update.eventId}`
                        : '/dashboard'
                );
                setNotifications((prev) => [notification, ...prev]);

                if (update.amount >= 100) {
                    // Show toast for significant amounts
                    showToast(notification);
                }
            }
        },
        [revenueCallbacks, enableNotifications, createNotification, showToast]
    );

    // Setup SignalR event handlers using new system
    useEffect(() => {
        if (!signalR.connection || !signalR.isConnected) return;

        // Legacy event handlers for backward compatibility
        const connection = signalR.connection;

        // Dashboard metrics updates
        connection.on('OrganizerDashboardUpdate', handleDashboardUpdate);

        // Event status changes
        connection.on('OrganizerEventStatusChanged', handleEventStatusUpdate);

        // New registrations
        connection.on('OrganizerNewRegistration', handleRegistrationUpdate);

        // Revenue updates
        connection.on('OrganizerRevenueUpdate', handleRevenueUpdate);

        // Cleanup function
        return () => {
            connection.off('OrganizerDashboardUpdate', handleDashboardUpdate);
            connection.off(
                'OrganizerEventStatusChanged',
                handleEventStatusUpdate
            );
            connection.off(
                'OrganizerNewRegistration',
                handleRegistrationUpdate
            );
            connection.off('OrganizerRevenueUpdate', handleRevenueUpdate);
        };
    }, [
        signalR.connection,
        signalR.isConnected,
        handleDashboardUpdate,
        handleEventStatusUpdate,
        handleRegistrationUpdate,
        handleRevenueUpdate,
    ]);

    // Monitor connection state from new SignalR system
    useEffect(() => {
        if (signalR.error) {
            setConnectionError(signalR.error.message);
            if (enableNotifications) {
                const notification = createNotification(
                    'system',
                    signalR.error.type === 'authentication'
                        ? 'critical'
                        : 'high',
                    'Connection Error',
                    signalR.error.message
                );
                setNotifications((prev) => [notification, ...prev]);
            }
        } else {
            setConnectionError(null);
        }
    }, [signalR.error, enableNotifications, createNotification]);

    // Monitor connection status changes
    useEffect(() => {
        if (signalR.isConnected && enableNotifications) {
            const notification = createNotification(
                'system',
                'low',
                'Connection Restored',
                'Real-time updates have been restored.'
            );
            setNotifications((prev) => [notification, ...prev]);
        }
    }, [signalR.isConnected, enableNotifications, createNotification]);

    // Notification management functions
    const markNotificationAsRead = useCallback((notificationId: string) => {
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) =>
            prev.map((notification) => ({ ...notification, read: true }))
        );
    }, []);

    const dismissNotification = useCallback((notificationId: string) => {
        setNotifications((prev) =>
            prev.filter((notification) => notification.id !== notificationId)
        );
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Reconnection function using new SignalR system
    const reconnect = useCallback(async () => {
        try {
            setConnectionError(null);
            await signalR.reconnect();
        } catch (error) {
            setConnectionError(
                error instanceof Error ? error.message : 'Failed to reconnect'
            );
        }
    }, [signalR]);

    // External callback registration functions
    const onDashboardUpdate = useCallback(
        (callback: (update: DashboardMetricUpdate) => void) => {
            dashboardCallbacks.add(callback);
            return () => dashboardCallbacks.delete(callback);
        },
        [dashboardCallbacks]
    );

    const onEventStatusUpdate = useCallback(
        (callback: (update: EventStatusUpdate) => void) => {
            eventStatusCallbacks.add(callback);
            return () => eventStatusCallbacks.delete(callback);
        },
        [eventStatusCallbacks]
    );

    const onRegistrationUpdate = useCallback(
        (callback: (update: RegistrationUpdate) => void) => {
            registrationCallbacks.add(callback);
            return () => registrationCallbacks.delete(callback);
        },
        [registrationCallbacks]
    );

    const onRevenueUpdate = useCallback(
        (callback: (update: RevenueUpdate) => void) => {
            revenueCallbacks.add(callback);
            return () => revenueCallbacks.delete(callback);
        },
        [revenueCallbacks]
    );

    // Calculate unread count
    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
        // Connection status - use new SignalR system
        isConnected: signalR.isConnected,
        connectionError,

        // Real-time data updates
        dashboardUpdates,
        eventStatusUpdates,
        registrationUpdates,
        revenueUpdates,

        // Notifications - use legacy notifications only since new handler doesn't expose notifications array
        notifications,
        unreadCount,

        // Actions
        markNotificationAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
        reconnect,

        // Update handlers
        onDashboardUpdate,
        onEventStatusUpdate,
        onRegistrationUpdate,
        onRevenueUpdate,
    };
};

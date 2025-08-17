import { useEffect, useCallback, useState } from 'react';
import { useSignalRStore } from '@/lib/signalR';
import { useToast } from './use-toast';
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
        organizerId,
        enableNotifications = true,
        enableToasts = true,
        // notificationPriority = 'medium',
    } = options;

    const { connection, isConnected, connect } = useSignalRStore();
    const { toast } = useToast();

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

    // Helper function to create notifications
    const createNotification = useCallback(
        (
            type: OrganizerNotification['type'],
            priority: OrganizerNotification['priority'],
            title: string,
            message: string,
            eventId?: string,
            actionUrl?: string
        ): OrganizerNotification => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
                const priority =
                    update.newStatus === 'Published' ? 'high' : 'medium';
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

    // Setup SignalR event handlers
    useEffect(() => {
        if (!connection || !isConnected) return;

        // Dashboard metrics updates
        connection.on('OrganizerDashboardUpdate', handleDashboardUpdate);

        // Event status changes
        connection.on('OrganizerEventStatusChanged', handleEventStatusUpdate);

        // New registrations
        connection.on('OrganizerNewRegistration', handleRegistrationUpdate);

        // Revenue updates
        connection.on('OrganizerRevenueUpdate', handleRevenueUpdate);

        // Connection error handling
        connection.onclose((error) => {
            setConnectionError(error?.message || 'Connection lost');
            if (enableNotifications) {
                const notification = createNotification(
                    'system',
                    'high',
                    'Connection Lost',
                    'Real-time updates have been disconnected. Attempting to reconnect...'
                );
                setNotifications((prev) => [notification, ...prev]);
            }
        });

        connection.onreconnected(() => {
            setConnectionError(null);
            if (enableNotifications) {
                const notification = createNotification(
                    'system',
                    'low',
                    'Connection Restored',
                    'Real-time updates have been restored.'
                );
                setNotifications((prev) => [notification, ...prev]);
            }
        });

        // Join organizer group if organizerId is provided
        if (organizerId) {
            connection
                .invoke('JoinOrganizerGroup', organizerId)
                .catch((err) => {
                    console.error('Failed to join organizer group:', err);
                    setConnectionError('Failed to join real-time updates');
                });
        }

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

            if (organizerId) {
                connection
                    .invoke('LeaveOrganizerGroup', organizerId)
                    .catch((err) => {
                        console.error('Failed to leave organizer group:', err);
                    });
            }
        };
    }, [
        connection,
        isConnected,
        organizerId,
        handleDashboardUpdate,
        handleEventStatusUpdate,
        handleRegistrationUpdate,
        handleRevenueUpdate,
        enableNotifications,
        createNotification,
    ]);

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

    // Reconnection function
    const reconnect = useCallback(async () => {
        try {
            setConnectionError(null);
            await connect();
        } catch (error) {
            setConnectionError(
                error instanceof Error ? error.message : 'Failed to reconnect'
            );
        }
    }, [connect]);

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
        // Connection status
        isConnected,
        connectionError,

        // Real-time data updates
        dashboardUpdates,
        eventStatusUpdates,
        registrationUpdates,
        revenueUpdates,

        // Notifications
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

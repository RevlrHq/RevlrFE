import { useEffect, useCallback, useState, useRef } from 'react';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import {
    NotificationType,
    isEventNotificationData,
    isPaymentNotificationData,
    isFinancingNotificationData,
} from '@/types/notifications';
import type {
    NotificationMessage,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    EventRegistrationData,
    PaymentCompletedData,
    FinancingApplicationApprovedData,
    FinancingApplicationRejectedData,
} from '@/types/notifications';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Dashboard metrics that can be updated in real-time
 */
export interface DashboardMetrics {
    totalEvents: number;
    activeEvents: number;
    draftEvents: number;
    publishedEvents: number;
    cancelledEvents: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalAttendees: number;
    monthlyAttendees: number;
    pendingPayments: number;
    failedPayments: number;
    revenueGrowth: number;
    attendeeGrowth: number;
    conversionRate: number;
    averageTicketPrice: number;
    lastUpdated: Date;
}

/**
 * Event status change information
 */
export interface EventStatusChange {
    eventId: string;
    eventTitle: string;
    oldStatus: string;
    newStatus: string;
    timestamp: Date;
    organizerId: string;
    reason?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Registration update information
 */
export interface RegistrationUpdate {
    eventId: string;
    eventTitle: string;
    attendeeId: string;
    attendeeName: string;
    attendeeEmail: string;
    ticketType: string;
    ticketPrice: number;
    paymentStatus: string;
    registrationDate: Date;
    totalRegistrations: number;
    revenue: number;
}

/**
 * Revenue update information
 */
export interface RevenueUpdate {
    eventId?: string;
    eventTitle?: string;
    paymentId: string;
    amount: number;
    netAmount: number;
    currency: string;
    paymentMethod: string;
    transactionDate: Date;
    totalRevenue: number;
    monthlyRevenue: number;
    organizerId: string;
}

/**
 * Financing application update information
 */
export interface FinancingUpdate {
    applicationId: string;
    eventId: string;
    eventTitle: string;
    userId: string;
    requestedAmount: number;
    approvedAmount?: number;
    status: string;
    previousStatus?: string;
    applicationDate: Date;
    reviewDate?: Date;
    reason?: string;
    interestRate?: number;
    repaymentTerms?: Record<string, unknown>;
}

/**
 * Real-time update types
 */
export type RealtimeUpdateType =
    | 'dashboard_metrics'
    | 'event_status'
    | 'registration'
    | 'revenue'
    | 'financing';

/**
 * Real-time update payload
 */
export interface RealtimeUpdate {
    type: RealtimeUpdateType;
    timestamp: Date;
    organizerId: string;
    data:
        | DashboardMetrics
        | EventStatusChange
        | RegistrationUpdate
        | RevenueUpdate
        | FinancingUpdate;
}

/**
 * Hook options
 */
export interface UseOrganizerDashboardRealtimeOptions {
    organizerId: string;
    enableMetricsUpdates?: boolean;
    enableEventStatusUpdates?: boolean;
    enableRegistrationUpdates?: boolean;
    enableRevenueUpdates?: boolean;
    enableFinancingUpdates?: boolean;
    enableNotifications?: boolean;
    enableToasts?: boolean;
    metricsUpdateInterval?: number;
    maxUpdateHistory?: number;
    onMetricsUpdate?: (metrics: DashboardMetrics) => void;
    onEventStatusChange?: (change: EventStatusChange) => void;
    onRegistrationUpdate?: (update: RegistrationUpdate) => void;
    onRevenueUpdate?: (update: RevenueUpdate) => void;
    onFinancingUpdate?: (update: FinancingUpdate) => void;
    onRealtimeUpdate?: (update: RealtimeUpdate) => void;
}

/**
 * Hook result interface
 */
export interface UseOrganizerDashboardRealtimeResult {
    // Current metrics
    metrics: DashboardMetrics | null;
    isMetricsLoading: boolean;
    metricsError: string | null;

    // Update history
    eventStatusChanges: EventStatusChange[];
    registrationUpdates: RegistrationUpdate[];
    revenueUpdates: RevenueUpdate[];
    financingUpdates: FinancingUpdate[];
    updateHistory: RealtimeUpdate[];

    // Statistics
    stats: {
        totalUpdates: number;
        todayUpdates: number;
        recentRegistrations: number;
        recentRevenue: number;
        pendingFinancing: number;
    };

    // Actions
    refreshMetrics: () => Promise<void>;
    clearUpdateHistory: () => void;
    getUpdatesByType: (type: RealtimeUpdateType) => RealtimeUpdate[];
    getRecentUpdates: (hours?: number) => RealtimeUpdate[];

    // Event handlers for external components
    onMetricsChange: (
        callback: (metrics: DashboardMetrics) => void
    ) => () => void;
    onEventStatusChange: (
        callback: (change: EventStatusChange) => void
    ) => () => void;
    onRegistrationChange: (
        callback: (update: RegistrationUpdate) => void
    ) => () => void;
    onRevenueChange: (callback: (update: RevenueUpdate) => void) => () => void;
    onFinancingChange: (
        callback: (update: FinancingUpdate) => void
    ) => () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts dashboard metrics from notification data
 */
const extractMetricsFromNotification = (
    notification: NotificationMessage,
    currentMetrics: DashboardMetrics | null
): Partial<DashboardMetrics> | null => {
    if (!currentMetrics) return null;

    const updates: Partial<DashboardMetrics> = {
        lastUpdated: new Date(),
    };

    if (isEventNotificationData(notification.data)) {
        const eventData = notification.data as EventNotificationData;

        if (
            notification.type === NotificationType.EventRegistration &&
            'attendeeName' in eventData
        ) {
            const regData = eventData as EventRegistrationData;
            updates.totalAttendees = currentMetrics.totalAttendees + 1;
            updates.monthlyAttendees = currentMetrics.monthlyAttendees + 1;

            if (regData.ticketPrice > 0) {
                updates.totalRevenue =
                    currentMetrics.totalRevenue + regData.ticketPrice;
                updates.monthlyRevenue =
                    currentMetrics.monthlyRevenue + regData.ticketPrice;
            }
        } else if (notification.type === NotificationType.EventPublished) {
            updates.publishedEvents = currentMetrics.publishedEvents + 1;
            updates.activeEvents = currentMetrics.activeEvents + 1;
        } else if (notification.type === NotificationType.EventCancelled) {
            updates.cancelledEvents = currentMetrics.cancelledEvents + 1;
            updates.activeEvents = Math.max(0, currentMetrics.activeEvents - 1);
        }
    }

    if (isPaymentNotificationData(notification.data)) {
        const paymentData = notification.data as PaymentNotificationData;

        if (
            notification.type === NotificationType.PaymentCompleted &&
            'netAmount' in paymentData
        ) {
            const completedData = paymentData as PaymentCompletedData;
            updates.totalRevenue =
                currentMetrics.totalRevenue + completedData.netAmount;
            updates.monthlyRevenue =
                currentMetrics.monthlyRevenue + completedData.netAmount;
        } else if (notification.type === NotificationType.PaymentFailed) {
            updates.failedPayments = currentMetrics.failedPayments + 1;
        } else if (notification.type === NotificationType.PaymentPending) {
            updates.pendingPayments = currentMetrics.pendingPayments + 1;
        }
    }

    return Object.keys(updates).length > 1 ? updates : null;
};

/**
 * Converts notification to event status change
 */
const notificationToEventStatusChange = (
    notification: NotificationMessage
): EventStatusChange | null => {
    if (!isEventNotificationData(notification.data)) return null;

    const eventData = notification.data as EventNotificationData;
    let newStatus = '';
    let oldStatus = '';

    switch (notification.type) {
        case NotificationType.EventPublished:
            newStatus = 'Published';
            oldStatus = 'Draft';
            break;
        case NotificationType.EventCancelled:
            newStatus = 'Cancelled';
            oldStatus = 'Published';
            break;
        case NotificationType.EventUpdate:
            newStatus = 'Updated';
            oldStatus = 'Published';
            break;
        default:
            return null;
    }

    return {
        eventId: eventData.eventId,
        eventTitle: eventData.eventTitle,
        oldStatus,
        newStatus,
        timestamp: new Date(notification.timestamp),
        organizerId: '', // Will be set by the hook
        reason: notification.message,
        metadata: notification.metadata,
    };
};

/**
 * Converts notification to registration update
 */
const notificationToRegistrationUpdate = (
    notification: NotificationMessage
): RegistrationUpdate | null => {
    if (notification.type !== NotificationType.EventRegistration) return null;
    if (!isEventNotificationData(notification.data)) return null;

    const eventData = notification.data as EventNotificationData;

    if (!('attendeeName' in eventData)) return null;
    const regData = eventData as EventRegistrationData;

    return {
        eventId: regData.eventId,
        eventTitle: regData.eventTitle,
        attendeeId: regData.attendeeId,
        attendeeName: regData.attendeeName,
        attendeeEmail: regData.attendeeEmail,
        ticketType: regData.ticketType,
        ticketPrice: regData.ticketPrice,
        paymentStatus: regData.paymentStatus,
        registrationDate: new Date(regData.registrationDate),
        totalRegistrations: 1, // Will be updated by the hook
        revenue: regData.ticketPrice,
    };
};

/**
 * Converts notification to revenue update
 */
const notificationToRevenueUpdate = (
    notification: NotificationMessage
): RevenueUpdate | null => {
    if (!isPaymentNotificationData(notification.data)) return null;
    if (notification.type !== NotificationType.PaymentCompleted) return null;

    const paymentData = notification.data as PaymentNotificationData;

    if (!('netAmount' in paymentData)) return null;
    const completedData = paymentData as PaymentCompletedData;

    return {
        eventId: paymentData.eventId,
        eventTitle: paymentData.eventTitle,
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        netAmount: completedData.netAmount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        transactionDate: new Date(paymentData.transactionDate),
        totalRevenue: completedData.netAmount, // Will be updated by the hook
        monthlyRevenue: completedData.netAmount, // Will be updated by the hook
        organizerId: '', // Will be set by the hook
    };
};

/**
 * Converts notification to financing update
 */
const notificationToFinancingUpdate = (
    notification: NotificationMessage
): FinancingUpdate | null => {
    if (!isFinancingNotificationData(notification.data)) return null;

    const financingData = notification.data as FinancingNotificationData;
    let status = '';
    let previousStatus = '';

    switch (notification.type) {
        case NotificationType.FinancingApplicationSubmitted:
            status = 'Submitted';
            previousStatus = 'Draft';
            break;
        case NotificationType.FinancingApplicationApproved:
            status = 'Approved';
            previousStatus = 'Under Review';
            break;
        case NotificationType.FinancingApplicationRejected:
            status = 'Rejected';
            previousStatus = 'Under Review';
            break;
        default:
            return null;
    }

    const update: FinancingUpdate = {
        applicationId: financingData.applicationId,
        eventId: financingData.eventId,
        eventTitle: financingData.eventTitle,
        userId: financingData.userId,
        requestedAmount: financingData.requestedAmount,
        status,
        previousStatus,
        applicationDate: new Date(financingData.applicationDate),
    };

    // Add specific data based on notification type
    if (
        notification.type === NotificationType.FinancingApplicationApproved &&
        'approvedAmount' in financingData
    ) {
        const approvedData = financingData as FinancingApplicationApprovedData;
        update.approvedAmount = approvedData.approvedAmount;
        update.interestRate = approvedData.interestRate;
        update.repaymentTerms = approvedData.repaymentTerms as unknown as Record<string, unknown>;
        update.reviewDate = new Date(approvedData.approvalDate);
    } else if (
        notification.type === NotificationType.FinancingApplicationRejected &&
        'rejectionReason' in financingData
    ) {
        const rejectedData = financingData as FinancingApplicationRejectedData;
        update.reason = rejectedData.rejectionReason;
        update.reviewDate = new Date(rejectedData.rejectionDate);
    }

    return update;
};


// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for managing organizer dashboard real-time updates
 */
export const useOrganizerDashboardRealtime = (
    options: UseOrganizerDashboardRealtimeOptions
): UseOrganizerDashboardRealtimeResult => {
    const {
        organizerId,
        enableMetricsUpdates = true,
        enableEventStatusUpdates = true,
        enableRegistrationUpdates = true,
        enableRevenueUpdates = true,
        enableFinancingUpdates = true,
        enableNotifications = true,
        enableToasts = false,
        metricsUpdateInterval = 30000, // 30 seconds
        maxUpdateHistory = 1000,
        onMetricsUpdate,
        onEventStatusChange,
        onRegistrationUpdate,
        onRevenueUpdate,
        onFinancingUpdate,
        onRealtimeUpdate,
    } = options;

    // State
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isMetricsLoading, setIsMetricsLoading] = useState(false);
    const [metricsError, setMetricsError] = useState<string | null>(null);
    const [eventStatusChanges, setEventStatusChanges] = useState<
        EventStatusChange[]
    >([]);
    const [registrationUpdates, setRegistrationUpdates] = useState<
        RegistrationUpdate[]
    >([]);
    const [revenueUpdates, setRevenueUpdates] = useState<RevenueUpdate[]>([]);
    const [financingUpdates, setFinancingUpdates] = useState<FinancingUpdate[]>(
        []
    );
    const [updateHistory, setUpdateHistory] = useState<RealtimeUpdate[]>([]);

    // Refs for external callbacks
    const metricsCallbacksRef = useRef<
        Set<(metrics: DashboardMetrics) => void>
    >(new Set());
    const eventStatusCallbacksRef = useRef<
        Set<(change: EventStatusChange) => void>
    >(new Set());
    const registrationCallbacksRef = useRef<
        Set<(update: RegistrationUpdate) => void>
    >(new Set());
    const revenueCallbacksRef = useRef<Set<(update: RevenueUpdate) => void>>(
        new Set()
    );
    const financingCallbacksRef = useRef<
        Set<(update: FinancingUpdate) => void>
    >(new Set());

    // Notification history for tracking organizer-specific notifications
    useNotificationHistory({
        maxSize: maxUpdateHistory,
        enablePersistence: true,
        storageKey: `organizer_dashboard_${organizerId}`,
        enableAutoCleanup: true,
    });

    // Typed notification handler for processing real-time updates
    useTypedNotificationHandler({
        enableToastNotifications: enableToasts,
        enableAutoNavigation: false,
        enableHistory: true,
        onNotificationReceived: useCallback(
            (notification: NotificationMessage) => {
                if (!enableNotifications) return;

                // Process metrics updates
                if (enableMetricsUpdates) {
                    const metricsUpdate = extractMetricsFromNotification(
                        notification,
                        metrics
                    );
                    if (metricsUpdate) {
                        const updatedMetrics = {
                            ...metrics!,
                            ...metricsUpdate,
                        };
                        setMetrics(updatedMetrics);
                        onMetricsUpdate?.(updatedMetrics);

                        // Notify external callbacks
                        metricsCallbacksRef.current.forEach((callback) =>
                            callback(updatedMetrics)
                        );

                        // Add to update history
                        const realtimeUpdate: RealtimeUpdate = {
                            type: 'dashboard_metrics',
                            timestamp: new Date(),
                            organizerId,
                            data: updatedMetrics,
                        };
                        setUpdateHistory((prev) => [
                            realtimeUpdate,
                            ...prev.slice(0, maxUpdateHistory - 1),
                        ]);
                        onRealtimeUpdate?.(realtimeUpdate);
                    }
                }

                // Process event status changes
                if (enableEventStatusUpdates) {
                    const statusChange =
                        notificationToEventStatusChange(notification);
                    if (statusChange) {
                        const change = { ...statusChange, organizerId };
                        setEventStatusChanges((prev) => [
                            change,
                            ...prev.slice(0, 99),
                        ]);
                        onEventStatusChange?.(change);

                        // Notify external callbacks
                        eventStatusCallbacksRef.current.forEach((callback) =>
                            callback(change)
                        );

                        // Add to update history
                        const realtimeUpdate: RealtimeUpdate = {
                            type: 'event_status',
                            timestamp: new Date(),
                            organizerId,
                            data: change,
                        };
                        setUpdateHistory((prev) => [
                            realtimeUpdate,
                            ...prev.slice(0, maxUpdateHistory - 1),
                        ]);
                        onRealtimeUpdate?.(realtimeUpdate);
                    }
                }

                // Process registration updates
                if (enableRegistrationUpdates) {
                    const registrationUpdate =
                        notificationToRegistrationUpdate(notification);
                    if (registrationUpdate) {
                        setRegistrationUpdates((prev) => {
                            const updated = [
                                registrationUpdate,
                                ...prev.slice(0, 99),
                            ];
                            // Update total registrations count
                            registrationUpdate.totalRegistrations =
                                updated.length;
                            return updated;
                        });
                        onRegistrationUpdate?.(registrationUpdate);

                        // Notify external callbacks
                        registrationCallbacksRef.current.forEach((callback) =>
                            callback(registrationUpdate)
                        );

                        // Add to update history
                        const realtimeUpdate: RealtimeUpdate = {
                            type: 'registration',
                            timestamp: new Date(),
                            organizerId,
                            data: registrationUpdate,
                        };
                        setUpdateHistory((prev) => [
                            realtimeUpdate,
                            ...prev.slice(0, maxUpdateHistory - 1),
                        ]);
                        onRealtimeUpdate?.(realtimeUpdate);
                    }
                }

                // Process revenue updates
                if (enableRevenueUpdates) {
                    const revenueUpdate =
                        notificationToRevenueUpdate(notification);
                    if (revenueUpdate) {
                        const update = { ...revenueUpdate, organizerId };
                        setRevenueUpdates((prev) => {
                            const updated = [update, ...prev.slice(0, 99)];
                            // Update total revenue
                            const totalRevenue = updated.reduce(
                                (sum, u) => sum + u.netAmount,
                                0
                            );
                            update.totalRevenue = totalRevenue;

                            // Calculate monthly revenue (last 30 days)
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            const monthlyRevenue = updated
                                .filter(
                                    (u) => u.transactionDate >= thirtyDaysAgo
                                )
                                .reduce((sum, u) => sum + u.netAmount, 0);
                            update.monthlyRevenue = monthlyRevenue;

                            return updated;
                        });
                        onRevenueUpdate?.(update);

                        // Notify external callbacks
                        revenueCallbacksRef.current.forEach((callback) =>
                            callback(update)
                        );

                        // Add to update history
                        const realtimeUpdate: RealtimeUpdate = {
                            type: 'revenue',
                            timestamp: new Date(),
                            organizerId,
                            data: update,
                        };
                        setUpdateHistory((prev) => [
                            realtimeUpdate,
                            ...prev.slice(0, maxUpdateHistory - 1),
                        ]);
                        onRealtimeUpdate?.(realtimeUpdate);
                    }
                }

                // Process financing updates
                if (enableFinancingUpdates) {
                    const financingUpdate =
                        notificationToFinancingUpdate(notification);
                    if (financingUpdate) {
                        setFinancingUpdates((prev) => [
                            financingUpdate,
                            ...prev.slice(0, 99),
                        ]);
                        onFinancingUpdate?.(financingUpdate);

                        // Notify external callbacks
                        financingCallbacksRef.current.forEach((callback) =>
                            callback(financingUpdate)
                        );

                        // Add to update history
                        const realtimeUpdate: RealtimeUpdate = {
                            type: 'financing',
                            timestamp: new Date(),
                            organizerId,
                            data: financingUpdate,
                        };
                        setUpdateHistory((prev) => [
                            realtimeUpdate,
                            ...prev.slice(0, maxUpdateHistory - 1),
                        ]);
                        onRealtimeUpdate?.(realtimeUpdate);
                    }
                }
            },
            [
                enableNotifications,
                enableMetricsUpdates,
                enableEventStatusUpdates,
                enableRegistrationUpdates,
                enableRevenueUpdates,
                enableFinancingUpdates,
                metrics,
                organizerId,
                maxUpdateHistory,
                onMetricsUpdate,
                onEventStatusChange,
                onRegistrationUpdate,
                onRevenueUpdate,
                onFinancingUpdate,
                onRealtimeUpdate,
            ]
        ),
    });

    // Initialize metrics (mock data for now - in real implementation, this would fetch from API)
    const initializeMetrics = useCallback(async () => {
        if (metrics) return;

        setIsMetricsLoading(true);
        setMetricsError(null);

        try {
            // Mock initial metrics - replace with actual API call
            const initialMetrics: DashboardMetrics = {
                totalEvents: 0,
                activeEvents: 0,
                draftEvents: 0,
                publishedEvents: 0,
                cancelledEvents: 0,
                totalRevenue: 0,
                monthlyRevenue: 0,
                totalAttendees: 0,
                monthlyAttendees: 0,
                pendingPayments: 0,
                failedPayments: 0,
                revenueGrowth: 0,
                attendeeGrowth: 0,
                conversionRate: 0,
                averageTicketPrice: 0,
                lastUpdated: new Date(),
            };

            setMetrics(initialMetrics);
            onMetricsUpdate?.(initialMetrics);
        } catch (error) {
            setMetricsError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load metrics'
            );
        } finally {
            setIsMetricsLoading(false);
        }
    }, [metrics, onMetricsUpdate]);

    // Refresh metrics
    const refreshMetrics = useCallback(async () => {
        setIsMetricsLoading(true);
        setMetricsError(null);

        try {
            // Mock refresh - replace with actual API call
            if (metrics) {
                const refreshedMetrics = {
                    ...metrics,
                    lastUpdated: new Date(),
                };
                setMetrics(refreshedMetrics);
                onMetricsUpdate?.(refreshedMetrics);
            }
        } catch (error) {
            setMetricsError(
                error instanceof Error
                    ? error.message
                    : 'Failed to refresh metrics'
            );
        } finally {
            setIsMetricsLoading(false);
        }
    }, [metrics, onMetricsUpdate]);

    // Clear update history
    const clearUpdateHistory = useCallback(() => {
        setUpdateHistory([]);
        setEventStatusChanges([]);
        setRegistrationUpdates([]);
        setRevenueUpdates([]);
        setFinancingUpdates([]);
    }, []);

    // Get updates by type
    const getUpdatesByType = useCallback(
        (type: RealtimeUpdateType) => {
            return updateHistory.filter((update) => update.type === type);
        },
        [updateHistory]
    );

    // Get recent updates
    const getRecentUpdates = useCallback(
        (hours: number = 24) => {
            const cutoff = new Date();
            cutoff.setHours(cutoff.getHours() - hours);
            return updateHistory.filter((update) => update.timestamp >= cutoff);
        },
        [updateHistory]
    );

    // External callback registration functions
    const onMetricsChange = useCallback(
        (callback: (metrics: DashboardMetrics) => void) => {
            metricsCallbacksRef.current.add(callback);
            return () => metricsCallbacksRef.current.delete(callback);
        },
        []
    );

    const onEventStatusChange = useCallback(
        (callback: (change: EventStatusChange) => void) => {
            eventStatusCallbacksRef.current.add(callback);
            return () => eventStatusCallbacksRef.current.delete(callback);
        },
        []
    );

    const onRegistrationChange = useCallback(
        (callback: (update: RegistrationUpdate) => void) => {
            registrationCallbacksRef.current.add(callback);
            return () => registrationCallbacksRef.current.delete(callback);
        },
        []
    );

    const onRevenueChange = useCallback(
        (callback: (update: RevenueUpdate) => void) => {
            revenueCallbacksRef.current.add(callback);
            return () => revenueCallbacksRef.current.delete(callback);
        },
        []
    );

    const onFinancingChange = useCallback(
        (callback: (update: FinancingUpdate) => void) => {
            financingCallbacksRef.current.add(callback);
            return () => financingCallbacksRef.current.delete(callback);
        },
        []
    );

    // Calculate statistics
    const stats = {
        totalUpdates: updateHistory.length,
        todayUpdates: getRecentUpdates(24).length,
        recentRegistrations: registrationUpdates.filter(
            (update) =>
                update.registrationDate >=
                new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        recentRevenue: revenueUpdates
            .filter(
                (update) =>
                    update.transactionDate >=
                    new Date(Date.now() - 24 * 60 * 60 * 1000)
            )
            .reduce((sum, update) => sum + update.netAmount, 0),
        pendingFinancing: financingUpdates.filter(
            (update) =>
                update.status === 'Submitted' ||
                update.status === 'Under Review'
        ).length,
    };

    // Initialize metrics on mount
    useEffect(() => {
        initializeMetrics();
    }, [initializeMetrics]);

    // Set up periodic metrics refresh
    useEffect(() => {
        if (!enableMetricsUpdates || metricsUpdateInterval <= 0) return;

        const interval = setInterval(refreshMetrics, metricsUpdateInterval);
        return () => clearInterval(interval);
    }, [enableMetricsUpdates, metricsUpdateInterval, refreshMetrics]);

    return {
        // Current metrics
        metrics,
        isMetricsLoading,
        metricsError,

        // Update history
        eventStatusChanges,
        registrationUpdates,
        revenueUpdates,
        financingUpdates,
        updateHistory,

        // Statistics
        stats,

        // Actions
        refreshMetrics,
        clearUpdateHistory,
        getUpdatesByType,
        getRecentUpdates,

        // Event handlers
        onMetricsChange,
        onEventStatusChange,
        onRegistrationChange,
        onRevenueChange,
        onFinancingChange,
    };
};

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    Clock,
} from 'lucide-react';
import {
    Toast,
    ToastAction,
    ToastClose,
    ToastDescription,
    ToastTitle,
} from '@/components/ui/toast';
import type {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,
    isEventNotificationData,
    isPaymentNotificationData,
    isFinancingNotificationData,
    isSystemNotificationData,
} from '@/types/notifications';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface NotificationToastProps {
    notification: NotificationMessage;
    onNavigate?: (notification: NotificationMessage) => void;
    onDismiss?: (notificationId: string) => void;
    className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the appropriate icon for a notification type
 */
const getNotificationIcon = (
    type: NotificationType,
    priority: NotificationPriority
) => {
    const iconClass = cn(
        'h-5 w-5 flex-shrink-0',
        priority === 'Critical' || priority === 'High'
            ? 'text-destructive'
            : 'text-muted-foreground'
    );

    switch (type) {
        case NotificationType.EventRegistration:
        case NotificationType.EventUpdate:
        case NotificationType.EventPublished:
            return <CheckCircle className={iconClass} />;

        case NotificationType.EventCancelled:
            return <XCircle className={iconClass} />;

        case NotificationType.PaymentCompleted:
        case NotificationType.RecurringPaymentProcessed:
            return <CheckCircle className={iconClass} />;

        case NotificationType.PaymentFailed:
            return <XCircle className={iconClass} />;

        case NotificationType.PaymentPending:
            return <Clock className={iconClass} />;

        case NotificationType.FinancingApplicationSubmitted:
        case NotificationType.FinancingPaymentDue:
            return <Info className={iconClass} />;

        case NotificationType.FinancingApplicationApproved:
            return <CheckCircle className={iconClass} />;

        case NotificationType.FinancingApplicationRejected:
            return <XCircle className={iconClass} />;

        case NotificationType.SystemMaintenance:
        case NotificationType.SystemUpdate:
            return <AlertTriangle className={iconClass} />;

        default:
            return <Bell className={iconClass} />;
    }
};

/**
 * Gets toast variant based on notification priority and type
 */
const getToastVariant = (
    type: NotificationType,
    priority: NotificationPriority
): 'default' | 'destructive' => {
    // Critical and high priority notifications use destructive variant
    if (priority === 'Critical' || priority === 'High') {
        return 'destructive';
    }

    // Failed/cancelled notifications use destructive variant regardless of priority
    if (
        type === NotificationType.PaymentFailed ||
        type === NotificationType.EventCancelled ||
        type === NotificationType.FinancingApplicationRejected
    ) {
        return 'destructive';
    }

    return 'default';
};

/**
 * Formats notification data for display
 */
const formatNotificationData = (
    notification: NotificationMessage
): {
    subtitle?: string;
    metadata?: string[];
} => {
    if (!notification.data) {
        return {};
    }

    const metadata: string[] = [];

    if (isEventNotificationData(notification.data)) {
        const eventData = notification.data as EventNotificationData;
        const subtitle = eventData.eventTitle;

        if (eventData.organizerName) {
            metadata.push(`Organizer: ${eventData.organizerName}`);
        }

        if (eventData.eventDate) {
            const eventDate = new Date(eventData.eventDate);
            metadata.push(`Date: ${eventDate.toLocaleDateString()}`);
        }

        if (eventData.eventLocation) {
            metadata.push(`Location: ${eventData.eventLocation}`);
        }

        return { subtitle, metadata };
    }

    if (isPaymentNotificationData(notification.data)) {
        const paymentData = notification.data as PaymentNotificationData;
        const subtitle =
            paymentData.eventTitle || `Payment ${paymentData.paymentId}`;

        metadata.push(
            `Amount: ${paymentData.currency} ${paymentData.amount.toFixed(2)}`
        );
        metadata.push(`Method: ${paymentData.paymentMethod}`);

        const transactionDate = new Date(paymentData.transactionDate);
        metadata.push(`Date: ${transactionDate.toLocaleDateString()}`);

        return { subtitle, metadata };
    }

    if (isFinancingNotificationData(notification.data)) {
        const financingData = notification.data as FinancingNotificationData;
        const subtitle = financingData.eventTitle;

        metadata.push(
            `Amount: ${financingData.currency} ${financingData.requestedAmount.toFixed(2)}`
        );

        const applicationDate = new Date(financingData.applicationDate);
        metadata.push(`Applied: ${applicationDate.toLocaleDateString()}`);

        return { subtitle, metadata };
    }

    if (isSystemNotificationData(notification.data)) {
        const systemData = notification.data as SystemNotificationData;
        const subtitle = `${systemData.category} Notification`;

        if (
            systemData.affectedServices &&
            systemData.affectedServices.length > 0
        ) {
            metadata.push(
                `Services: ${systemData.affectedServices.join(', ')}`
            );
        }

        if (systemData.estimatedDuration) {
            metadata.push(`Duration: ${systemData.estimatedDuration}`);
        }

        return { subtitle, metadata };
    }

    return {};
};

/**
 * Gets action button text based on notification type
 */
const getActionButtonText = (type: NotificationType): string => {
    switch (type) {
        case NotificationType.EventRegistration:
        case NotificationType.EventUpdate:
        case NotificationType.EventPublished:
        case NotificationType.EventCancelled:
            return 'View Event';

        case NotificationType.PaymentCompleted:
        case NotificationType.RecurringPaymentProcessed:
            return 'View Receipt';

        case NotificationType.PaymentFailed:
            return 'Retry Payment';

        case NotificationType.PaymentPending:
            return 'Check Status';

        case NotificationType.FinancingApplicationSubmitted:
        case NotificationType.FinancingApplicationApproved:
        case NotificationType.FinancingApplicationRejected:
            return 'View Application';

        case NotificationType.FinancingPaymentDue:
            return 'Make Payment';

        case NotificationType.SystemMaintenance:
        case NotificationType.SystemUpdate:
            return 'Learn More';

        default:
            return 'View Details';
    }
};

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Specialized toast component for SignalR notifications with priority-based styling
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onNavigate,
    onDismiss,
    className,
}) => {
    const router = useRouter();
    const { subtitle, metadata } = formatNotificationData(notification);
    const variant = getToastVariant(notification.type, notification.priority);
    const icon = getNotificationIcon(notification.type, notification.priority);
    const actionText = getActionButtonText(notification.type);

    const handleNavigate = () => {
        if (onNavigate) {
            onNavigate(notification);
        } else if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
    };

    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss(notification.id);
        }
    };

    return (
        <Toast
            variant={variant}
            className={cn(
                'group relative overflow-hidden',
                // Priority-based border styling
                notification.priority === 'Critical' &&
                    'border-l-4 border-l-red-500',
                notification.priority === 'High' &&
                    'border-l-4 border-l-orange-500',
                notification.priority === 'Normal' &&
                    'border-l-4 border-l-blue-500',
                notification.priority === 'Low' &&
                    'border-l-4 border-l-gray-400',
                className
            )}
        >
            <div className='flex items-start space-x-3'>
                {/* Notification Icon */}
                <div className='shrink-0 pt-0.5'>{icon}</div>

                {/* Content */}
                <div className='min-w-0 flex-1'>
                    <ToastTitle className='text-sm font-semibold leading-5'>
                        {notification.title}
                    </ToastTitle>

                    {subtitle && (
                        <div className='mt-1 text-xs font-medium text-muted-foreground'>
                            {subtitle}
                        </div>
                    )}

                    <ToastDescription className='mt-1 text-sm leading-5'>
                        {notification.message}
                    </ToastDescription>

                    {metadata && metadata.length > 0 && (
                        <div className='mt-2 space-y-1'>
                            {metadata.map((item, index) => (
                                <div
                                    key={index}
                                    className='text-xs text-muted-foreground'
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Timestamp */}
                    <div className='mt-2 text-xs text-muted-foreground'>
                        {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            {(notification.actionUrl || onNavigate) && (
                <ToastAction
                    altText={actionText}
                    onClick={handleNavigate}
                    className='ml-3 shrink-0'
                >
                    {actionText}
                </ToastAction>
            )}

            {/* Close Button */}
            <ToastClose onClick={handleDismiss} />

            {/* Priority Indicator */}
            {notification.priority === 'Critical' && (
                <div className='absolute left-2 top-2 size-2 animate-pulse rounded-full bg-red-500' />
            )}
        </Toast>
    );
};

export default NotificationToast;

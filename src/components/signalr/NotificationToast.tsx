'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    DollarSign,
    Calendar,
    AlertTriangle,
    Info,
    CheckCircle2,
    XCircle,
    ExternalLink,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { NotificationType, NotificationPriority } from '@/types/notifications';
import type {
    NotificationMessage,
    // NotificationData,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,
} from '@/types/notifications';

// Icon mapping for different notification types
const NOTIFICATION_ICONS: Record<
    NotificationType,
    React.ComponentType<{ className?: string }>
> = {
    [NotificationType.EventRegistration]: Calendar,
    [NotificationType.EventUpdate]: Calendar,
    [NotificationType.EventPublished]: Calendar,
    [NotificationType.EventCancelled]: XCircle,
    [NotificationType.PaymentCompleted]: CheckCircle2,
    [NotificationType.PaymentFailed]: XCircle,
    [NotificationType.PaymentPending]: CreditCard,
    [NotificationType.RecurringPaymentProcessed]: CreditCard,
    [NotificationType.FinancingApplicationSubmitted]: DollarSign,
    [NotificationType.FinancingApplicationApproved]: CheckCircle2,
    [NotificationType.FinancingApplicationRejected]: XCircle,
    [NotificationType.FinancingPaymentDue]: AlertTriangle,
    [NotificationType.SystemMaintenance]: AlertTriangle,
    [NotificationType.SystemUpdate]: Info,
};

// Priority-based styling configuration
interface PriorityConfig {
    variant: 'default' | 'destructive';
    className: string;
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
    duration: number; // in milliseconds
}

const PRIORITY_CONFIGS: Record<NotificationPriority, PriorityConfig> = {
    [NotificationPriority.Low]: {
        variant: 'default',
        className: 'border-blue-200 bg-blue-50 text-blue-900',
        badgeVariant: 'secondary',
        duration: 5000,
    },
    [NotificationPriority.Normal]: {
        variant: 'default',
        className: 'border-gray-200 bg-white text-gray-900',
        badgeVariant: 'default',
        duration: 7000,
    },
    [NotificationPriority.High]: {
        variant: 'default',
        className: 'border-orange-200 bg-orange-50 text-orange-900',
        badgeVariant: 'outline',
        duration: 10000,
    },
    [NotificationPriority.Critical]: {
        variant: 'destructive',
        className: 'border-red-200 bg-red-50 text-red-900',
        badgeVariant: 'destructive',
        duration: 0, // Don't auto-dismiss critical notifications
    },
};

// Props interface
interface NotificationToastProps {
    /**
     * The notification message to display
     */
    notification: NotificationMessage;

    /**
     * Whether to show the action button
     */
    showActionButton?: boolean;

    /**
     * Custom action button text
     */
    actionButtonText?: string;

    /**
     * Whether to show the dismiss button
     */
    showDismissButton?: boolean;

    /**
     * Whether to show the notification type badge
     */
    showTypeBadge?: boolean;

    /**
     * Whether to show the priority indicator
     */
    showPriorityIndicator?: boolean;

    /**
     * Custom CSS classes
     */
    className?: string;

    /**
     * Callback when the action button is clicked
     */
    onActionClick?: (notification: NotificationMessage) => void;

    /**
     * Callback when the notification is dismissed
     */
    onDismiss?: (notification: NotificationMessage) => void;

    /**
     * Whether to auto-dismiss the notification
     */
    autoDismiss?: boolean;

    /**
     * Custom auto-dismiss duration (overrides priority-based duration)
     */
    autoDismissDuration?: number;
}

/**
 * NotificationToast component displays notifications with priority-based styling
 * and action button handling for navigation
 */
export function NotificationToast({
    notification,
    showActionButton = true,
    actionButtonText,
    showDismissButton = true,
    showTypeBadge = true,
    showPriorityIndicator = true,
    className,
    onActionClick,
    onDismiss,
    autoDismiss = true,
    autoDismissDuration,
}: NotificationToastProps) {
    const router = useRouter();
    // const { toast } = useToast();

    // Get configuration for the notification priority
    const priorityConfig = PRIORITY_CONFIGS[notification.priority];
    const IconComponent = NOTIFICATION_ICONS[notification.type];

    // Auto-dismiss timer
    React.useEffect(() => {
        if (!autoDismiss || priorityConfig.duration === 0) return;

        const duration = autoDismissDuration || priorityConfig.duration;
        const timer = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
    }, [autoDismiss, autoDismissDuration, priorityConfig.duration]);

    // Handle action button click
    const handleActionClick = () => {
        if (onActionClick) {
            onActionClick(notification);
        } else if (notification.actionUrl) {
            // Navigate to the action URL
            if (notification.actionUrl.startsWith('http')) {
                // External URL
                window.open(
                    notification.actionUrl,
                    '_blank',
                    'noopener,noreferrer'
                );
            } else {
                // Internal route
                router.push(notification.actionUrl);
            }
        }

        // Dismiss the notification after action
        handleDismiss();
    };

    // Handle dismiss
    const handleDismiss = () => {
        if (onDismiss) {
            onDismiss(notification);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    // Get action button text
    const getActionButtonText = (): string => {
        if (actionButtonText) return actionButtonText;

        // Default text based on notification type
        switch (notification.type) {
            case NotificationType.EventRegistration:
            case NotificationType.EventUpdate:
            case NotificationType.EventPublished:
                return 'View Event';
            case NotificationType.EventCancelled:
                return 'View Details';
            case NotificationType.PaymentCompleted:
            case NotificationType.PaymentPending:
                return 'View Receipt';
            case NotificationType.PaymentFailed:
                return 'Retry Payment';
            case NotificationType.RecurringPaymentProcessed:
                return 'View Subscription';
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
                return 'View';
        }
    };

    // Get additional context from notification data
    const getContextInfo = (): string | null => {
        if (!notification.data) return null;

        switch (notification.type) {
            case NotificationType.EventRegistration:
            case NotificationType.EventUpdate:
            case NotificationType.EventPublished:
            case NotificationType.EventCancelled: {
                const eventData = notification.data as EventNotificationData;
                return eventData.eventTitle;
            }
            case NotificationType.PaymentCompleted:
            case NotificationType.PaymentFailed:
            case NotificationType.PaymentPending:
            case NotificationType.RecurringPaymentProcessed: {
                const paymentData =
                    notification.data as PaymentNotificationData;
                return `${paymentData.currency} ${paymentData.amount.toFixed(2)}`;
            }
            case NotificationType.FinancingApplicationSubmitted:
            case NotificationType.FinancingApplicationApproved:
            case NotificationType.FinancingApplicationRejected:
            case NotificationType.FinancingPaymentDue: {
                const financingData =
                    notification.data as FinancingNotificationData;
                return `${financingData.currency} ${financingData.requestedAmount.toFixed(2)}`;
            }
            case NotificationType.SystemMaintenance:
            case NotificationType.SystemUpdate: {
                const systemData = notification.data as SystemNotificationData;
                return systemData.category;
            }
            default:
                return null;
        }
    };

    const contextInfo = getContextInfo();
    const hasActionUrl = Boolean(notification.actionUrl);

    return (
        <div
            className={cn(
                'relative flex items-start gap-3 rounded-lg border p-4 shadow-sm',
                priorityConfig.className,
                className
            )}
            role='alert'
            aria-live={
                notification.priority === NotificationPriority.Critical
                    ? 'assertive'
                    : 'polite'
            }
        >
            {/* Priority indicator */}
            {showPriorityIndicator &&
                notification.priority !== NotificationPriority.Normal && (
                    <div
                        className={cn(
                            'absolute bottom-0 left-0 top-0 w-1 rounded-l-lg',
                            {
                                'bg-blue-500':
                                    notification.priority ===
                                    NotificationPriority.Low,
                                'bg-orange-500':
                                    notification.priority ===
                                    NotificationPriority.High,
                                'bg-red-500':
                                    notification.priority ===
                                    NotificationPriority.Critical,
                            }
                        )}
                    />
                )}

            {/* Icon */}
            <div className='mt-0.5 shrink-0'>
                <IconComponent className='size-5' />
            </div>

            {/* Content */}
            <div className='min-w-0 flex-1'>
                {/* Header */}
                <div className='mb-1 flex items-start justify-between gap-2'>
                    <div className='flex min-w-0 flex-1 items-center gap-2'>
                        <h4 className='truncate text-sm font-medium'>
                            {notification.title}
                        </h4>
                        {showTypeBadge && (
                            <Badge
                                variant={priorityConfig.badgeVariant}
                                className='shrink-0 text-xs'
                            >
                                {notification.type
                                    .replace(/([A-Z])/g, ' $1')
                                    .trim()}
                            </Badge>
                        )}
                    </div>

                    {/* Dismiss button */}
                    {showDismissButton && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleDismiss}
                            className='size-6 shrink-0 p-0 hover:bg-black/10'
                        >
                            <X className='size-3' />
                            <span className='sr-only'>
                                Dismiss notification
                            </span>
                        </Button>
                    )}
                </div>

                {/* Message */}
                <p className='mb-2 text-sm text-muted-foreground'>
                    {notification.message}
                </p>

                {/* Context info */}
                {contextInfo && (
                    <p className='mb-2 text-xs font-medium text-muted-foreground'>
                        {contextInfo}
                    </p>
                )}

                {/* Footer */}
                <div className='flex items-center justify-between gap-2'>
                    <span className='text-xs text-muted-foreground'>
                        {formatTimestamp(notification.timestamp)}
                    </span>

                    {/* Action button */}
                    {showActionButton && hasActionUrl && (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleActionClick}
                            className='h-7 text-xs'
                        >
                            {getActionButtonText()}
                            {notification.actionUrl?.startsWith('http') && (
                                <ExternalLink className='ml-1 size-3' />
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to show notifications as toasts using the existing toast system
 */
export function useNotificationToast() {
    const { toast } = useToast();
    const router = useRouter();

    const showNotification = React.useCallback(
        (
            notification: NotificationMessage,
            options: {
                showActionButton?: boolean;
                actionButtonText?: string;
                onActionClick?: (notification: NotificationMessage) => void;
                autoDismiss?: boolean;
                autoDismissDuration?: number;
            } = {}
        ) => {
            const priorityConfig = PRIORITY_CONFIGS[notification.priority];
            const IconComponent = NOTIFICATION_ICONS[notification.type];

            const handleActionClick = () => {
                if (options.onActionClick) {
                    options.onActionClick(notification);
                } else if (notification.actionUrl) {
                    if (notification.actionUrl.startsWith('http')) {
                        window.open(
                            notification.actionUrl,
                            '_blank',
                            'noopener,noreferrer'
                        );
                    } else {
                        router.push(notification.actionUrl);
                    }
                }
            };

            const getActionButtonText = (): string => {
                if (options.actionButtonText) return options.actionButtonText;

                switch (notification.type) {
                    case NotificationType.EventRegistration:
                    case NotificationType.EventUpdate:
                    case NotificationType.EventPublished:
                        return 'View Event';
                    case NotificationType.PaymentFailed:
                        return 'Retry Payment';
                    case NotificationType.FinancingPaymentDue:
                        return 'Make Payment';
                    default:
                        return 'View';
                }
            };

            toast({
                title: (
                    <div className='flex items-center gap-2'>
                        <IconComponent className='size-4' />
                        <span>{notification.title}</span>
                        <Badge
                            variant={priorityConfig.badgeVariant}
                            className='text-xs'
                        >
                            {notification.type
                                .replace(/([A-Z])/g, ' $1')
                                .trim()}
                        </Badge>
                    </div>
                ),
                description: notification.message,
                variant: priorityConfig.variant,
                action:
                    options.showActionButton !== false &&
                    notification.actionUrl ? (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleActionClick}
                            className='h-8'
                        >
                            {getActionButtonText()}
                            {notification.actionUrl.startsWith('http') && (
                                <ExternalLink className='ml-1 size-3' />
                            )}
                        </Button>
                    ) : undefined,
            });
        },
        [toast, router]
    );

    const showEventNotification = React.useCallback(
        (
            notification: NotificationMessage & { data: EventNotificationData }
        ) => {
            showNotification(notification, {
                actionButtonText: 'View Event',
            });
        },
        [showNotification]
    );

    const showPaymentNotification = React.useCallback(
        (
            notification: NotificationMessage & {
                data: PaymentNotificationData;
            }
        ) => {
            const actionText =
                notification.type === NotificationType.PaymentFailed
                    ? 'Retry Payment'
                    : 'View Receipt';

            showNotification(notification, {
                actionButtonText: actionText,
            });
        },
        [showNotification]
    );

    const showFinancingNotification = React.useCallback(
        (
            notification: NotificationMessage & {
                data: FinancingNotificationData;
            }
        ) => {
            const actionText =
                notification.type === NotificationType.FinancingPaymentDue
                    ? 'Make Payment'
                    : 'View Application';

            showNotification(notification, {
                actionButtonText: actionText,
            });
        },
        [showNotification]
    );

    const showSystemNotification = React.useCallback(
        (
            notification: NotificationMessage & { data: SystemNotificationData }
        ) => {
            showNotification(notification, {
                actionButtonText: 'Learn More',
                autoDismiss:
                    notification.priority !== NotificationPriority.Critical,
            });
        },
        [showNotification]
    );

    return {
        showNotification,
        showEventNotification,
        showPaymentNotification,
        showFinancingNotification,
        showSystemNotification,
    };
}

/**
 * Component that automatically shows notifications as toasts
 */
interface NotificationToastProviderProps {
    children: React.ReactNode;
    notifications: NotificationMessage[];
    onNotificationShown?: (notification: NotificationMessage) => void;
}

export function NotificationToastProvider({
    children,
    notifications,
    onNotificationShown,
}: NotificationToastProviderProps) {
    const { showNotification } = useNotificationToast();
    const shownNotifications = React.useRef(new Set<string>());

    React.useEffect(() => {
        notifications.forEach((notification) => {
            if (!shownNotifications.current.has(notification.id)) {
                showNotification(notification);
                shownNotifications.current.add(notification.id);
                onNotificationShown?.(notification);
            }
        });
    }, [notifications, showNotification, onNotificationShown]);

    return <>{children}</>;
}

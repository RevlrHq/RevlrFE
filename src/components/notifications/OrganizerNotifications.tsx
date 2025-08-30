'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    X,
    Trash2,
    Search,
    Calendar,
    CreditCard,
    DollarSign,
    Settings,
    Clock,
    ExternalLink,
    Eye,
    EyeOff,
    Users,
    TrendingUp,
    FileText,
    Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import {
    NotificationType,
    NotificationPriority,
    isEventNotificationData,
    isPaymentNotificationData,
    isFinancingNotificationData,
    isSystemNotificationData,
} from '@/types/notifications';
import type {
    NotificationMessage,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,
    EventRegistrationData,
    PaymentCompletedData,
    FinancingApplicationSubmittedData,
} from '@/types/notifications';
import type { NotificationHistoryEntry } from '@/hooks/useNotificationHistory';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface OrganizerNotificationsProps {
    className?: string;
    maxHeight?: string;
    showHeader?: boolean;
    showFilters?: boolean;
    showSearch?: boolean;
    showBulkActions?: boolean;
    enableSelection?: boolean;
    enableGrouping?: boolean;
    organizerId?: string;
    onNotificationClick?: (notification: NotificationMessage) => void;
    onNotificationAction?: (
        notification: NotificationMessage,
        action: 'read' | 'unread' | 'dismiss' | 'remove'
    ) => void;
    onRevenueUpdate?: (notification: NotificationMessage) => void;
    onRegistrationUpdate?: (notification: NotificationMessage) => void;
}

interface OrganizerNotificationItemProps {
    entry: NotificationHistoryEntry;
    isSelected?: boolean;
    onSelect?: (selected: boolean) => void;
    onMarkAsRead: (id: string) => void;
    onMarkAsUnread: (id: string) => void;
    onDismiss: (id: string) => void;
    onRemove: (id: string) => void;
    onNavigate: (notification: NotificationMessage) => void;
    onAction?: (
        notification: NotificationMessage,
        action: 'read' | 'unread' | 'dismiss' | 'remove'
    ) => void;
}

interface FilterState {
    types: NotificationType[];
    priorities: NotificationPriority[];
    readStatus: 'all' | 'read' | 'unread';
    dismissedStatus: 'all' | 'active' | 'dismissed';
    searchQuery: string;
    eventId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}

interface NotificationGroup {
    eventId?: string;
    eventTitle?: string;
    notifications: NotificationHistoryEntry[];
    totalRevenue?: number;
    registrationCount?: number;
    lastUpdate: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the appropriate icon for organizer-specific notification types
 */
const getOrganizerNotificationIcon = (type: NotificationType) => {
    const iconClass = 'h-4 w-4 flex-shrink-0';

    switch (type) {
        case NotificationType.EventRegistration:
            return <Users className={iconClass} />;
        case NotificationType.EventUpdate:
        case NotificationType.EventPublished:
        case NotificationType.EventCancelled:
            return <Calendar className={iconClass} />;
        case NotificationType.PaymentCompleted:
        case NotificationType.RecurringPaymentProcessed:
            return <TrendingUp className={iconClass} />;
        case NotificationType.PaymentFailed:
        case NotificationType.PaymentPending:
            return <CreditCard className={iconClass} />;
        case NotificationType.FinancingApplicationSubmitted:
        case NotificationType.FinancingApplicationApproved:
        case NotificationType.FinancingApplicationRejected:
            return <FileText className={iconClass} />;
        case NotificationType.FinancingPaymentDue:
            return <DollarSign className={iconClass} />;
        case NotificationType.SystemMaintenance:
        case NotificationType.SystemUpdate:
            return <Settings className={iconClass} />;
        default:
            return <Bell className={iconClass} />;
    }
};

/**
 * Gets priority-based styling for organizer notifications
 */
const getOrganizerPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
        case NotificationPriority.Critical:
            return {
                badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                border: 'border-l-red-500',
                bg: 'bg-red-50/50 dark:bg-red-950/20',
                glow: 'shadow-red-200/50 dark:shadow-red-900/50',
            };
        case NotificationPriority.High:
            return {
                badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                border: 'border-l-orange-500',
                bg: 'bg-orange-50/50 dark:bg-orange-950/20',
                glow: 'shadow-orange-200/50 dark:shadow-orange-900/50',
            };
        case NotificationPriority.Normal:
            return {
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                border: 'border-l-blue-500',
                bg: 'bg-blue-50/50 dark:bg-blue-950/20',
                glow: 'shadow-blue-200/50 dark:shadow-blue-900/50',
            };
        case NotificationPriority.Low:
            return {
                badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                border: 'border-l-gray-400',
                bg: 'bg-gray-50/50 dark:bg-gray-950/20',
                glow: 'shadow-gray-200/50 dark:shadow-gray-900/50',
            };
        default:
            return {
                badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                border: 'border-l-gray-400',
                bg: 'bg-gray-50/50 dark:bg-gray-950/20',
                glow: 'shadow-gray-200/50 dark:shadow-gray-900/50',
            };
    }
};

/**
 * Formats organizer-specific notification data for display
 */
const formatOrganizerNotificationData = (notification: NotificationMessage) => {
    if (!notification.data) return null;

    if (isEventNotificationData(notification.data)) {
        const data = notification.data as EventNotificationData;

        // Handle registration-specific data
        if (
            notification.type === NotificationType.EventRegistration &&
            'attendeeName' in data
        ) {
            const regData = data as EventRegistrationData;
            return {
                subtitle: data.eventTitle,
                details: [
                    `New attendee: ${regData.attendeeName}`,
                    `Ticket: ${regData.ticketType}`,
                    `Revenue: ${regData.ticketPrice > 0 ? `$${regData.ticketPrice.toFixed(2)}` : 'Free'}`,
                    `Payment: ${regData.paymentStatus}`,
                ],
                metrics: {
                    revenue: regData.ticketPrice,
                    attendeeCount: 1,
                },
            };
        }

        return {
            subtitle: data.eventTitle,
            details: [
                data.organizerName && `Organizer: ${data.organizerName}`,
                data.eventDate &&
                    `Date: ${new Date(data.eventDate).toLocaleDateString()}`,
                data.eventLocation && `Location: ${data.eventLocation}`,
            ].filter(Boolean),
        };
    }

    if (isPaymentNotificationData(notification.data)) {
        const data = notification.data as PaymentNotificationData;

        // Handle completed payment data
        if (
            notification.type === NotificationType.PaymentCompleted &&
            'netAmount' in data
        ) {
            const paymentData = data as PaymentCompletedData;
            return {
                subtitle: data.eventTitle || `Payment ${data.paymentId}`,
                details: [
                    `Gross: $${data.amount.toFixed(2)}`,
                    `Net: $${paymentData.netAmount.toFixed(2)}`,
                    `Method: ${data.paymentMethod}`,
                    `Date: ${new Date(data.transactionDate).toLocaleDateString()}`,
                ],
                metrics: {
                    revenue: paymentData.netAmount,
                },
            };
        }

        return {
            subtitle: data.eventTitle || `Payment ${data.paymentId}`,
            details: [
                `Amount: ${data.currency} ${data.amount.toFixed(2)}`,
                `Method: ${data.paymentMethod}`,
                `Date: ${new Date(data.transactionDate).toLocaleDateString()}`,
            ],
            metrics: {
                revenue: data.amount,
            },
        };
    }

    if (isFinancingNotificationData(notification.data)) {
        const data = notification.data as FinancingNotificationData;

        // Handle financing application data
        if (
            notification.type ===
                NotificationType.FinancingApplicationSubmitted &&
            'applicationStatus' in data
        ) {
            const finData = data as FinancingApplicationSubmittedData;
            return {
                subtitle: data.eventTitle,
                details: [
                    `Amount: ${data.currency} ${data.requestedAmount.toFixed(2)}`,
                    `Status: ${finData.applicationStatus}`,
                    `Review time: ${finData.expectedReviewTime}`,
                    `Applied: ${new Date(data.applicationDate).toLocaleDateString()}`,
                ],
            };
        }

        return {
            subtitle: data.eventTitle,
            details: [
                `Amount: ${data.currency} ${data.requestedAmount.toFixed(2)}`,
                `Applied: ${new Date(data.applicationDate).toLocaleDateString()}`,
            ],
        };
    }

    if (isSystemNotificationData(notification.data)) {
        const data = notification.data as SystemNotificationData;
        return {
            subtitle: `${data.category} Notification`,
            details: [
                data.affectedServices?.length &&
                    `Services: ${data.affectedServices.join(', ')}`,
                data.estimatedDuration && `Duration: ${data.estimatedDuration}`,
                data.actionRequired && 'Action Required',
            ].filter(Boolean),
        };
    }

    return null;
};

/**
 * Groups notifications by event for better organization
 */
const groupNotificationsByEvent = (
    notifications: NotificationHistoryEntry[]
): NotificationGroup[] => {
    const groups = new Map<string, NotificationGroup>();
    const ungrouped: NotificationHistoryEntry[] = [];

    notifications.forEach((entry) => {
        const { notification } = entry;
        let eventId: string | undefined;
        let eventTitle: string | undefined;

        // Extract event information from notification data
        if (isEventNotificationData(notification.data)) {
            eventId = notification.data.eventId;
            eventTitle = notification.data.eventTitle;
        } else if (isPaymentNotificationData(notification.data)) {
            eventId = notification.data.eventId;
            eventTitle = notification.data.eventTitle;
        } else if (isFinancingNotificationData(notification.data)) {
            eventId = notification.data.eventId;
            eventTitle = notification.data.eventTitle;
        }

        if (eventId && eventTitle) {
            const key = eventId;
            if (!groups.has(key)) {
                groups.set(key, {
                    eventId,
                    eventTitle,
                    notifications: [],
                    totalRevenue: 0,
                    registrationCount: 0,
                    lastUpdate: entry.receivedAt,
                });
            }

            const group = groups.get(key)!;
            group.notifications.push(entry);

            // Update metrics
            const formattedData = formatOrganizerNotificationData(notification);
            if (formattedData?.metrics) {
                if (formattedData.metrics.revenue) {
                    group.totalRevenue =
                        (group.totalRevenue || 0) +
                        formattedData.metrics.revenue;
                }
                if (formattedData.metrics.attendeeCount) {
                    group.registrationCount =
                        (group.registrationCount || 0) +
                        formattedData.metrics.attendeeCount;
                }
            }

            // Update last update time
            if (entry.receivedAt > group.lastUpdate) {
                group.lastUpdate = entry.receivedAt;
            }
        } else {
            ungrouped.push(entry);
        }
    });

    const result = Array.from(groups.values());

    // Add ungrouped notifications as individual groups
    ungrouped.forEach((entry) => {
        result.push({
            notifications: [entry],
            lastUpdate: entry.receivedAt,
        });
    });

    // Sort groups by last update time (newest first)
    return result.sort(
        (a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime()
    );
};

/**
 * Formats time ago display
 */
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

// ============================================================================
// Organizer Notification Item Component
// ============================================================================

const OrganizerNotificationItem: React.FC<OrganizerNotificationItemProps> = ({
    entry,
    isSelected = false,
    onSelect,
    onMarkAsRead,
    onMarkAsUnread,
    onDismiss,
    onRemove,
    onNavigate,
    onAction,
}) => {
    const { notification } = entry;
    const priorityStyles = getOrganizerPriorityStyles(notification.priority);
    const typeIcon = getOrganizerNotificationIcon(notification.type);
    const formattedData = formatOrganizerNotificationData(notification);

    const handleClick = () => {
        if (!entry.isRead) {
            onMarkAsRead(notification.id);
            onAction?.(notification, 'read');
        }
        onNavigate(notification);
    };

    const handleMarkAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkAsRead(notification.id);
        onAction?.(notification, 'read');
    };

    const handleMarkAsUnread = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkAsUnread(notification.id);
        onAction?.(notification, 'unread');
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDismiss(notification.id);
        onAction?.(notification, 'dismiss');
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(notification.id);
        onAction?.(notification, 'remove');
    };

    const handleSelect = (checked: boolean) => {
        onSelect?.(checked);
    };

    return (
        <div
            className={cn(
                'group relative cursor-pointer border-l-4 p-4 transition-all duration-200 hover:bg-muted/50',
                entry.isRead
                    ? 'border-l-gray-200 opacity-70 dark:border-l-gray-700'
                    : cn(priorityStyles.border, priorityStyles.bg),
                entry.isDismissed && 'opacity-50',
                isSelected && 'bg-accent',
                // Add subtle glow for high priority notifications
                !entry.isRead &&
                    (notification.priority === 'Critical' ||
                        notification.priority === 'High') &&
                    `shadow-lg ${priorityStyles.glow}`
            )}
            onClick={handleClick}
        >
            <div className='flex items-start space-x-3'>
                {/* Selection Checkbox */}
                {onSelect && (
                    <div className='shrink-0 pt-1'>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={handleSelect}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                {/* Type Icon */}
                <div className='shrink-0 pt-1'>{typeIcon}</div>

                {/* Content */}
                <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between'>
                        <div className='min-w-0 flex-1'>
                            {/* Title and Priority */}
                            <div className='flex items-center space-x-2'>
                                <h4
                                    className={cn(
                                        'truncate text-sm font-medium',
                                        entry.isRead
                                            ? 'text-muted-foreground'
                                            : 'text-foreground'
                                    )}
                                >
                                    {notification.title}
                                </h4>
                                <Badge
                                    variant='secondary'
                                    className={cn(
                                        'px-1.5 py-0.5 text-xs',
                                        priorityStyles.badge
                                    )}
                                >
                                    {notification.priority}
                                </Badge>
                                {!entry.isRead && (
                                    <div className='size-2 animate-pulse rounded-full bg-blue-500' />
                                )}
                            </div>

                            {/* Subtitle */}
                            {formattedData?.subtitle && (
                                <div className='mt-1 flex items-center space-x-2'>
                                    <Building className='size-3 text-muted-foreground' />
                                    <span className='text-xs font-medium text-muted-foreground'>
                                        {formattedData.subtitle}
                                    </span>
                                </div>
                            )}

                            {/* Message */}
                            <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                                {notification.message}
                            </p>

                            {/* Organizer-specific Details */}
                            {formattedData?.details && (
                                <div className='mt-2 grid grid-cols-2 gap-2'>
                                    {formattedData.details.map(
                                        (detail, index) => (
                                            <div
                                                key={index}
                                                className='rounded bg-muted/30 px-2 py-1 text-xs text-muted-foreground'
                                            >
                                                {detail}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Metrics Display */}
                            {formattedData?.metrics && (
                                <div className='mt-2 flex items-center space-x-4'>
                                    {formattedData.metrics.revenue && (
                                        <div className='flex items-center space-x-1 text-green-600 dark:text-green-400'>
                                            <TrendingUp className='size-3' />
                                            <span className='text-xs font-medium'>
                                                +$
                                                {formattedData.metrics.revenue.toFixed(
                                                    2
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {formattedData.metrics.attendeeCount && (
                                        <div className='flex items-center space-x-1 text-blue-600 dark:text-blue-400'>
                                            <Users className='size-3' />
                                            <span className='text-xs font-medium'>
                                                +
                                                {
                                                    formattedData.metrics
                                                        .attendeeCount
                                                }
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className='mt-2 flex items-center space-x-2 text-xs text-muted-foreground'>
                                <Clock className='size-3' />
                                <span>{formatTimeAgo(entry.receivedAt)}</span>
                                {entry.readAt && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            Read {formatTimeAgo(entry.readAt)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='flex shrink-0 items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100'>
                            {/* Read/Unread Toggle */}
                            <Button
                                variant='ghost'
                                size='sm'
                                className='size-6 p-0'
                                onClick={
                                    entry.isRead
                                        ? handleMarkAsUnread
                                        : handleMarkAsRead
                                }
                                title={
                                    entry.isRead
                                        ? 'Mark as unread'
                                        : 'Mark as read'
                                }
                            >
                                {entry.isRead ? (
                                    <EyeOff className='size-3' />
                                ) : (
                                    <Eye className='size-3' />
                                )}
                            </Button>

                            {/* Action URL */}
                            {notification.actionUrl && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='size-6 p-0'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate(notification);
                                    }}
                                    title='Open link'
                                >
                                    <ExternalLink className='size-3' />
                                </Button>
                            )}

                            {/* Dismiss Action */}
                            <Button
                                variant='ghost'
                                size='sm'
                                className='size-6 p-0'
                                onClick={handleDismiss}
                                title='Dismiss notification'
                            >
                                <BellOff className='size-3' />
                            </Button>

                            {/* Remove Action */}
                            <Button
                                variant='ghost'
                                size='sm'
                                className='size-6 p-0 text-destructive hover:text-destructive'
                                onClick={handleRemove}
                                title='Remove notification'
                            >
                                <Trash2 className='size-3' />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// Event Group Component
// ============================================================================

const EventNotificationGroup: React.FC<{
    group: NotificationGroup;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    onSelectAll: (selected: boolean) => void;
    selectedIds: Set<string>;
    onSelectNotification: (id: string, selected: boolean) => void;
    onMarkAsRead: (id: string) => void;
    onMarkAsUnread: (id: string) => void;
    onDismiss: (id: string) => void;
    onRemove: (id: string) => void;
    onNavigate: (notification: NotificationMessage) => void;
    onAction?: (
        notification: NotificationMessage,
        action: 'read' | 'unread' | 'dismiss' | 'remove'
    ) => void;
}> = ({
    group,
    isExpanded,
    onToggleExpanded,
    onSelectAll,
    selectedIds,
    onSelectNotification,
    onMarkAsRead,
    onMarkAsUnread,
    onDismiss,
    onRemove,
    onNavigate,
    onAction,
}) => {
    const unreadCount = group.notifications.filter(
        (entry) => !entry.isRead
    ).length;
    const allSelected = group.notifications.every((entry) =>
        selectedIds.has(entry.notification.id)
    );
    const someSelected = group.notifications.some((entry) =>
        selectedIds.has(entry.notification.id)
    );

    const handleSelectAll = (checked: boolean) => {
        onSelectAll(checked);
    };

    return (
        <div className='overflow-hidden rounded-lg border'>
            {/* Group Header */}
            <div
                className='cursor-pointer bg-muted/30 p-3 transition-colors hover:bg-muted/50'
                onClick={onToggleExpanded}
            >
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                        <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                                if (el)
                                    el.indeterminate =
                                        someSelected && !allSelected;
                            }}
                            onCheckedChange={handleSelectAll}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <Building className='size-4 text-muted-foreground' />
                        <div>
                            <h3 className='text-sm font-medium'>
                                {group.eventTitle || 'System Notifications'}
                            </h3>
                            <div className='flex items-center space-x-4 text-xs text-muted-foreground'>
                                <span>
                                    {group.notifications.length} notifications
                                </span>
                                {unreadCount > 0 && (
                                    <Badge
                                        variant='destructive'
                                        className='px-1.5 py-0.5 text-xs'
                                    >
                                        {unreadCount} unread
                                    </Badge>
                                )}
                                {group.totalRevenue &&
                                    group.totalRevenue > 0 && (
                                        <div className='flex items-center space-x-1 text-green-600'>
                                            <TrendingUp className='size-3' />
                                            <span>
                                                ${group.totalRevenue.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                {group.registrationCount &&
                                    group.registrationCount > 0 && (
                                        <div className='flex items-center space-x-1 text-blue-600'>
                                            <Users className='size-3' />
                                            <span>
                                                {group.registrationCount}
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                        <span className='text-xs text-muted-foreground'>
                            {formatTimeAgo(group.lastUpdate)}
                        </span>
                        <Button
                            variant='ghost'
                            size='sm'
                            className='size-6 p-0'
                        >
                            {isExpanded ? (
                                <X className='size-3' />
                            ) : (
                                <Eye className='size-3' />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Group Content */}
            {isExpanded && (
                <div className='divide-y'>
                    {group.notifications.map((entry) => (
                        <OrganizerNotificationItem
                            key={entry.notification.id}
                            entry={entry}
                            isSelected={selectedIds.has(entry.notification.id)}
                            onSelect={(selected) =>
                                onSelectNotification(
                                    entry.notification.id,
                                    selected
                                )
                            }
                            onMarkAsRead={onMarkAsRead}
                            onMarkAsUnread={onMarkAsUnread}
                            onDismiss={onDismiss}
                            onRemove={onRemove}
                            onNavigate={onNavigate}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * OrganizerNotifications component for displaying and managing organizer-specific notifications
 * with event grouping, revenue tracking, and registration updates
 */
export const OrganizerNotifications: React.FC<OrganizerNotificationsProps> = ({
    className,
    maxHeight = '600px',
    showHeader = true,
    showFilters = true,
    showSearch = true,
    showBulkActions = true,
    enableGrouping = true,
    organizerId,
    onNotificationClick,
    onNotificationAction,
    onRevenueUpdate,
    onRegistrationUpdate,
}) => {
    const router = useRouter();

    // Hooks
    const historyManager = useNotificationHistory({
        config: {
            maxSize: 1000, // Organizers might have more notifications
            enablePersistence: true,
            enableAutoCleanup: true,
            storageKey: `organizer_notifications_${organizerId}`,
        },
    });

    useTypedNotificationHandler({
        enableToastNotifications: false, // We're showing them in the list
        enableAutoNavigation: false,
        enableHistory: true,
        // Custom handlers for organizer-specific notifications
        onNotificationReceived: (notification) => {
            // Handle revenue updates
            if (
                notification.type === NotificationType.PaymentCompleted ||
                notification.type === NotificationType.RecurringPaymentProcessed
            ) {
                onRevenueUpdate?.(notification);
            }

            // Handle registration updates
            if (notification.type === NotificationType.EventRegistration) {
                onRegistrationUpdate?.(notification);
            }
        },
    });

    // State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set()
    );
    const [activeTab, setActiveTab] = useState<
        'all' | 'events' | 'revenue' | 'financing'
    >('all');
    const [filter, setFilter] = useState<FilterState>({
        types: [],
        priorities: [],
        readStatus: 'all',
        dismissedStatus: 'active',
        searchQuery: '',
    });

    // Filter notifications for organizer-specific types
    const organizerNotifications = useMemo(() => {
        const organizerTypes = [
            NotificationType.EventRegistration,
            NotificationType.EventUpdate,
            NotificationType.EventPublished,
            NotificationType.EventCancelled,
            NotificationType.PaymentCompleted,
            NotificationType.PaymentFailed,
            NotificationType.PaymentPending,
            NotificationType.RecurringPaymentProcessed,
            NotificationType.FinancingApplicationSubmitted,
            NotificationType.FinancingApplicationApproved,
            NotificationType.FinancingApplicationRejected,
            NotificationType.FinancingPaymentDue,
        ];

        return historyManager.entries.filter((entry: NotificationHistoryEntry) =>
            organizerTypes.includes(entry.notification.type)
        );
    }, [historyManager.entries]);

    // Apply filters to notifications
    const filteredNotifications = useMemo(() => {
        let filtered = organizerNotifications;

        // Apply tab filter
        if (activeTab !== 'all') {
            const tabTypes = {
                events: [
                    NotificationType.EventRegistration,
                    NotificationType.EventUpdate,
                    NotificationType.EventPublished,
                    NotificationType.EventCancelled,
                ],
                revenue: [
                    NotificationType.PaymentCompleted,
                    NotificationType.PaymentFailed,
                    NotificationType.PaymentPending,
                    NotificationType.RecurringPaymentProcessed,
                ],
                financing: [
                    NotificationType.FinancingApplicationSubmitted,
                    NotificationType.FinancingApplicationApproved,
                    NotificationType.FinancingApplicationRejected,
                    NotificationType.FinancingPaymentDue,
                ],
            };

            filtered = filtered.filter((entry: NotificationHistoryEntry) =>
                tabTypes[activeTab].includes(entry.notification.type)
            );
        }

        // Apply read status filter
        if (filter.readStatus === 'read') {
            filtered = filtered.filter((entry: NotificationHistoryEntry) => entry.isRead);
        } else if (filter.readStatus === 'unread') {
            filtered = filtered.filter((entry: NotificationHistoryEntry) => !entry.isRead);
        }

        // Apply dismissed status filter
        if (filter.dismissedStatus === 'active') {
            filtered = filtered.filter((entry: NotificationHistoryEntry) => !entry.isDismissed);
        } else if (filter.dismissedStatus === 'dismissed') {
            filtered = filtered.filter((entry: NotificationHistoryEntry) => entry.isDismissed);
        }

        // Apply type filter
        if (filter.types.length > 0) {
            filtered = filtered.filter((entry) =>
                filter.types.includes(entry.notification.type)
            );
        }

        // Apply priority filter
        if (filter.priorities.length > 0) {
            filtered = filtered.filter((entry) =>
                filter.priorities.includes(entry.notification.priority)
            );
        }

        // Apply search filter
        if (filter.searchQuery.trim()) {
            const query = filter.searchQuery.toLowerCase();
            filtered = filtered.filter((entry) => {
                const searchableText = [
                    entry.notification.title,
                    entry.notification.message,
                    entry.notification.type,
                    entry.notification.priority,
                ]
                    .join(' ')
                    .toLowerCase();
                return searchableText.includes(query);
            });
        }

        // Sort by received date (newest first)
        return filtered.sort(
            (a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()
        );
    }, [organizerNotifications, activeTab, filter]);

    // Group notifications if enabled
    const notificationGroups = useMemo(() => {
        if (!enableGrouping) {
            return [
                {
                    notifications: filteredNotifications,
                    lastUpdate:
                        filteredNotifications[0]?.receivedAt || new Date(),
                },
            ];
        }
        return groupNotificationsByEvent(filteredNotifications);
    }, [filteredNotifications, enableGrouping]);

    // Calculate stats
    const stats = useMemo(() => {
        const unreadCount = filteredNotifications.filter(
            (entry) => !entry.isRead
        ).length;
        const totalRevenue = filteredNotifications.reduce((sum, entry) => {
            const formattedData = formatOrganizerNotificationData(
                entry.notification
            );
            return sum + (formattedData?.metrics?.revenue || 0);
        }, 0);
        const registrationCount = filteredNotifications.filter(
            (entry) =>
                entry.notification.type === NotificationType.EventRegistration
        ).length;

        return {
            total: filteredNotifications.length,
            unread: unreadCount,
            totalRevenue,
            registrationCount,
        };
    }, [filteredNotifications]);

    // Handlers
    const handleNotificationClick = useCallback(
        (notification: NotificationMessage) => {
            if (onNotificationClick) {
                onNotificationClick(notification);
            } else if (notification.actionUrl) {
                router.push(notification.actionUrl);
            }
        },
        [onNotificationClick, router]
    );


    const handleSelectNotification = useCallback(
        (notificationId: string, selected: boolean) => {
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                if (selected) {
                    newSet.add(notificationId);
                } else {
                    newSet.delete(notificationId);
                }
                return newSet;
            });
        },
        []
    );

    const handleGroupSelectAll = useCallback(
        (group: NotificationGroup, selected: boolean) => {
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                group.notifications.forEach((entry) => {
                    if (selected) {
                        newSet.add(entry.notification.id);
                    } else {
                        newSet.delete(entry.notification.id);
                    }
                });
                return newSet;
            });
        },
        []
    );

    const handleToggleGroupExpanded = useCallback((groupKey: string) => {
        setExpandedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    }, []);

    const handleBulkMarkAsRead = useCallback(() => {
        let count = 0;
        Array.from(selectedIds).forEach(id => {
            if (historyManager.markAsRead(id)) {
                count++;
            }
        });
        setSelectedIds(new Set());
        console.log(`Marked ${count} notifications as read`);
    }, [historyManager, selectedIds]);

    const handleBulkDismiss = useCallback(() => {
        let count = 0;
        Array.from(selectedIds).forEach(id => {
            if (historyManager.dismissNotification(id)) {
                count++;
            }
        });
        setSelectedIds(new Set());
        console.log(`Dismissed ${count} notifications`);
    }, [historyManager, selectedIds]);

    const handleBulkRemove = useCallback(() => {
        let count = 0;
        Array.from(selectedIds).forEach(id => {
            if (historyManager.removeNotification(id)) {
                count++;
            }
        });
        setSelectedIds(new Set());
        console.log(`Removed ${count} notifications`);
    }, [historyManager, selectedIds]);

    const selectedCount = selectedIds.size;

    // Auto-expand first group if there are notifications
    useEffect(() => {
        if (notificationGroups.length > 0 && expandedGroups.size === 0) {
            const firstGroupKey = notificationGroups[0].eventId || 'system';
            setExpandedGroups(new Set([firstGroupKey]));
        }
    }, [notificationGroups, expandedGroups.size]);

    return (
        <Card className={cn('flex flex-col', className)}>
            {showHeader && (
                <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                        <CardTitle className='flex items-center space-x-2'>
                            <Building className='size-5' />
                            <span>Organizer Notifications</span>
                            {stats.unread > 0 && (
                                <Badge variant='destructive' className='ml-2'>
                                    {stats.unread}
                                </Badge>
                            )}
                        </CardTitle>

                        {/* Header Actions */}
                        <div className='flex items-center space-x-2'>
                            {stats.unread > 0 && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={historyManager.markAllAsRead}
                                >
                                    <CheckCheck className='mr-2 size-4' />
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={historyManager.clearHistory}
                                className='text-destructive hover:text-destructive'
                            >
                                <Trash2 className='size-4' />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Display */}
                    <div className='flex items-center space-x-6 text-sm text-muted-foreground'>
                        <div className='flex items-center space-x-1'>
                            <Bell className='size-4' />
                            <span>{stats.total} total</span>
                        </div>
                        {stats.totalRevenue > 0 && (
                            <div className='flex items-center space-x-1 text-green-600'>
                                <TrendingUp className='size-4' />
                                <span>
                                    ${stats.totalRevenue.toFixed(2)} revenue
                                </span>
                            </div>
                        )}
                        {stats.registrationCount > 0 && (
                            <div className='flex items-center space-x-1 text-blue-600'>
                                <Users className='size-4' />
                                <span>
                                    {stats.registrationCount} registrations
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}

            <CardContent className='flex-1 p-0'>
                {/* Tabs */}
                <Tabs
                    value={activeTab}
                        onValueChange={(value) => setActiveTab(value as 'all' | 'events' | 'revenue' | 'financing')}
                    className='w-full'
                >
                    <div className='border-b px-4'>
                        <TabsList className='grid w-full grid-cols-4'>
                            <TabsTrigger value='all'>All</TabsTrigger>
                            <TabsTrigger value='events'>Events</TabsTrigger>
                            <TabsTrigger value='revenue'>Revenue</TabsTrigger>
                            <TabsTrigger value='financing'>
                                Financing
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Search and Filters */}
                    {(showSearch || showFilters) && (
                        <div className='border-b p-4'>
                            {showSearch && (
                                <div className='relative mb-3'>
                                    <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                                    <Input
                                        placeholder='Search organizer notifications...'
                                        value={filter.searchQuery}
                                        onChange={(e) =>
                                            setFilter((prev) => ({
                                                ...prev,
                                                searchQuery: e.target.value,
                                            }))
                                        }
                                        className='pl-9'
                                    />
                                </div>
                            )}

                            {showFilters && (
                                <div className='flex flex-wrap gap-2'>
                                    <Select
                                        value={filter.readStatus}
                                        onValueChange={(value) =>
                                            setFilter((prev) => ({
                                                ...prev,
                                                readStatus: value as 'all' | 'read' | 'unread',
                                            }))
                                        }
                                    >
                                        <SelectTrigger className='w-32'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='all'>
                                                All
                                            </SelectItem>
                                            <SelectItem value='unread'>
                                                Unread
                                            </SelectItem>
                                            <SelectItem value='read'>
                                                Read
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filter.dismissedStatus}
                                        onValueChange={(value) =>
                                            setFilter((prev) => ({
                                                ...prev,
                                                dismissedStatus: value as 'all' | 'active' | 'dismissed',
                                            }))
                                        }
                                    >
                                        <SelectTrigger className='w-32'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='all'>
                                                All
                                            </SelectItem>
                                            <SelectItem value='active'>
                                                Active
                                            </SelectItem>
                                            <SelectItem value='dismissed'>
                                                Dismissed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {enableGrouping && (
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() => {
                                                // Expand all groups
                                                const allGroupKeys =
                                                    notificationGroups.map(
                                                        (group) =>
                                                            group.eventId ||
                                                            'system'
                                                    );
                                                setExpandedGroups(
                                                    new Set(allGroupKeys)
                                                );
                                            }}
                                        >
                                            Expand All
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {showBulkActions && selectedCount > 0 && (
                        <div className='border-b bg-muted/30 p-3'>
                            <div className='flex items-center justify-between'>
                                <span className='text-sm text-muted-foreground'>
                                    {selectedCount} selected
                                </span>
                                <div className='flex items-center space-x-2'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleBulkMarkAsRead}
                                    >
                                        <Check className='mr-2 size-4' />
                                        Mark as read
                                    </Button>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleBulkDismiss}
                                    >
                                        <BellOff className='mr-2 size-4' />
                                        Dismiss
                                    </Button>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleBulkRemove}
                                        className='text-destructive hover:text-destructive'
                                    >
                                        <Trash2 className='mr-2 size-4' />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content for each tab */}
                    <TabsContent value={activeTab} className='mt-0'>
                        <ScrollArea className='h-full' style={{ maxHeight }}>
                            {filteredNotifications.length === 0 ? (
                                <div className='flex flex-col items-center justify-center p-8 text-center'>
                                    <Building className='mb-4 size-12 text-muted-foreground/50' />
                                    <h3 className='mb-2 text-lg font-medium text-muted-foreground'>
                                        No notifications yet
                                    </h3>
                                    <p className='max-w-sm text-sm text-muted-foreground'>
                                        {activeTab === 'all'
                                            ? "You'll see real-time updates about your events, revenue, and registrations here."
                                            : `No ${activeTab} notifications to show.`}
                                    </p>
                                </div>
                            ) : enableGrouping ? (
                                <div className='space-y-4 p-4'>
                                    {notificationGroups.map((group, index) => {
                                        const groupKey =
                                            group.eventId || `system-${index}`;
                                        return (
                                            <EventNotificationGroup
                                                key={groupKey}
                                                group={group}
                                                isExpanded={expandedGroups.has(
                                                    groupKey
                                                )}
                                                onToggleExpanded={() =>
                                                    handleToggleGroupExpanded(
                                                        groupKey
                                                    )
                                                }
                                                onSelectAll={(selected) =>
                                                    handleGroupSelectAll(
                                                        group,
                                                        selected
                                                    )
                                                }
                                                selectedIds={selectedIds}
                                                onSelectNotification={
                                                    handleSelectNotification
                                                }
                                                onMarkAsRead={
                                                    historyManager.markAsRead
                                                }
                                                onMarkAsUnread={(id: string) => {
                                                    console.log(`Mark as unread not implemented for: ${id}`);
                                                }}
                                                onDismiss={historyManager.dismissNotification}
                                                onRemove={historyManager.removeNotification}
                                                onNavigate={
                                                    handleNotificationClick
                                                }
                                                onAction={onNotificationAction}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className='divide-y'>
                                    {filteredNotifications.map((entry) => (
                                        <OrganizerNotificationItem
                                            key={entry.notification.id}
                                            entry={entry}
                                            isSelected={selectedIds.has(
                                                entry.notification.id
                                            )}
                                            onSelect={(selected) =>
                                                handleSelectNotification(
                                                    entry.notification.id,
                                                    selected
                                                )
                                            }
                                            onMarkAsRead={
                                                historyManager.markAsRead
                                            }
                                            onMarkAsUnread={(id: string) => {
                                                console.log(`Mark as unread not implemented for: ${id}`);
                                            }}
                                            onDismiss={historyManager.dismissNotification}
                                            onRemove={historyManager.removeNotification}
                                            onNavigate={handleNotificationClick}
                                            onAction={onNotificationAction}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default OrganizerNotifications;

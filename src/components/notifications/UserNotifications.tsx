'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    Search,
    Calendar,
    CreditCard,
    DollarSign,
    Settings,
    Clock,
    ExternalLink,
    Eye,
    EyeOff,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
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
} from '@/types/notifications';
import type { NotificationHistoryEntry } from '@/hooks/useNotificationHistory';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface UserNotificationsProps {
    className?: string;
    maxHeight?: string;
    showHeader?: boolean;
    showFilters?: boolean;
    showSearch?: boolean;
    showBulkActions?: boolean;
    enableSelection?: boolean;
    onNotificationClick?: (notification: NotificationMessage) => void;
    onNotificationAction?: (
        notification: NotificationMessage,
        action: 'read' | 'unread' | 'dismiss' | 'remove'
    ) => void;
}

interface NotificationItemProps {
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
    dateRange?: {
        start: Date;
        end: Date;
    };
    sortBy: 'date' | 'priority' | 'type' | 'title';
    sortOrder: 'asc' | 'desc';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the appropriate icon for a notification type
 */
const getNotificationTypeIcon = (type: NotificationType) => {
    const iconClass = 'h-4 w-4 flex-shrink-0';

    switch (type) {
        case NotificationType.EventRegistration:
        case NotificationType.EventUpdate:
        case NotificationType.EventPublished:
        case NotificationType.EventCancelled:
            return <Calendar className={iconClass} />;

        case NotificationType.PaymentCompleted:
        case NotificationType.PaymentFailed:
        case NotificationType.PaymentPending:
        case NotificationType.RecurringPaymentProcessed:
            return <CreditCard className={iconClass} />;

        case NotificationType.FinancingApplicationSubmitted:
        case NotificationType.FinancingApplicationApproved:
        case NotificationType.FinancingApplicationRejected:
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
 * Gets priority-based styling
 */
const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
        case NotificationPriority.Critical:
            return {
                badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                border: 'border-l-red-500',
                bg: 'bg-red-50/50 dark:bg-red-950/20',
            };
        case NotificationPriority.High:
            return {
                badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                border: 'border-l-orange-500',
                bg: 'bg-orange-50/50 dark:bg-orange-950/20',
            };
        case NotificationPriority.Normal:
            return {
                badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                border: 'border-l-blue-500',
                bg: 'bg-blue-50/50 dark:bg-blue-950/20',
            };
        case NotificationPriority.Low:
            return {
                badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                border: 'border-l-gray-400',
                bg: 'bg-gray-50/50 dark:bg-gray-950/20',
            };
        default:
            return {
                badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
                border: 'border-l-gray-400',
                bg: 'bg-gray-50/50 dark:bg-gray-950/20',
            };
    }
};

/**
 * Formats notification data for display
 */
const formatNotificationData = (notification: NotificationMessage) => {
    if (!notification.data) return null;

    if (isEventNotificationData(notification.data)) {
        const data = notification.data as EventNotificationData;
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
        return {
            subtitle: data.eventTitle || `Payment ${data.paymentId}`,
            details: [
                `Amount: ${data.currency} ${data.amount.toFixed(2)}`,
                `Method: ${data.paymentMethod}`,
                `Date: ${new Date(data.transactionDate).toLocaleDateString()}`,
            ],
        };
    }

    if (isFinancingNotificationData(notification.data)) {
        const data = notification.data as FinancingNotificationData;
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
            ].filter(Boolean),
        };
    }

    return null;
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
// Notification Item Component
// ============================================================================

const NotificationItem: React.FC<NotificationItemProps> = ({
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
    const priorityStyles = getPriorityStyles(notification.priority);
    const typeIcon = getNotificationTypeIcon(notification.type);
    const formattedData = formatNotificationData(notification);

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
                isSelected && 'bg-accent'
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
                                    <div className='size-2 rounded-full bg-blue-500' />
                                )}
                            </div>

                            {/* Subtitle */}
                            {formattedData?.subtitle && (
                                <div className='mt-1 text-xs font-medium text-muted-foreground'>
                                    {formattedData.subtitle}
                                </div>
                            )}

                            {/* Message */}
                            <p className='mt-1 line-clamp-2 text-sm text-muted-foreground'>
                                {notification.message}
                            </p>

                            {/* Details */}
                            {formattedData?.details && (
                                <div className='mt-2 space-y-1'>
                                    {formattedData.details.map(
                                        (detail, index) => (
                                            <div
                                                key={index}
                                                className='text-xs text-muted-foreground'
                                            >
                                                {detail}
                                            </div>
                                        )
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
// Main Component
// ============================================================================

/**
 * UserNotifications component for displaying and managing user notifications
 */
export const UserNotifications: React.FC<UserNotificationsProps> = ({
    className,
    maxHeight = '600px',
    showHeader = true,
    showFilters = true,
    showSearch = true,
    showBulkActions = true,
    enableSelection = true,
    onNotificationClick,
    onNotificationAction,
}) => {
    const router = useRouter();

    // Hooks
    const historyManager = useNotificationHistory({
        config: {
            maxSize: 500,
            enablePersistence: true,
            enableAutoCleanup: true,
        },
    });

    useTypedNotificationHandler({
        enableToastNotifications: false, // We're showing them in the list
        enableAutoNavigation: false,
        enableHistory: true,
    });

    // State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<FilterState>({
        types: [],
        priorities: [],
        readStatus: 'all',
        dismissedStatus: 'active',
        searchQuery: '',
        sortBy: 'date',
        sortOrder: 'desc',
    });

    // Apply filters to history using the hook's filtering capabilities
    const filteredNotifications = useMemo(() => {
        // Convert local filter state to hook filter format
        const hookFilter = {
            types: filter.types.length > 0 ? filter.types : undefined,
            priorities:
                filter.priorities.length > 0 ? filter.priorities : undefined,
            isRead:
                filter.readStatus === 'all'
                    ? undefined
                    : filter.readStatus === 'read',
            isDismissed:
                filter.dismissedStatus === 'all'
                    ? undefined
                    : filter.dismissedStatus === 'dismissed',
            searchQuery: filter.searchQuery.trim() || undefined,
            dateRange: filter.dateRange,
        };

        // Use entries from the hook and apply client-side filtering
        const filtered = historyManager.entries.filter((entry: NotificationHistoryEntry) => {
            // Apply read status filter
            if (filter.readStatus === 'read' && !entry.isRead) return false;
            if (filter.readStatus === 'unread' && entry.isRead)
                return false;

            // Apply dismissed status filter
            if (filter.dismissedStatus === 'active' && entry.isDismissed)
                return false;
            if (
                filter.dismissedStatus === 'dismissed' &&
                !entry.isDismissed
            )
                return false;

            // Apply type filter
            if (
                filter.types.length > 0 &&
                !filter.types.includes(entry.notification.type)
            )
                return false;

            // Apply priority filter
            if (
                filter.priorities.length > 0 &&
                !filter.priorities.includes(entry.notification.priority)
            )
                return false;

            // Apply search filter
            if (filter.searchQuery.trim()) {
                const query = filter.searchQuery.toLowerCase();
                const searchableText = [
                    entry.notification.title,
                    entry.notification.message,
                    entry.notification.type,
                    entry.notification.priority,
                ]
                    .join(' ')
                    .toLowerCase();
                if (!searchableText.includes(query)) return false;
            }

            // Apply date range filter
            if (filter.dateRange) {
                if (
                    entry.receivedAt < filter.dateRange.start ||
                    entry.receivedAt > filter.dateRange.end
                ) {
                    return false;
                }
            }

            return true;
        });

        // Apply sorting
        const sortedFiltered = [...filtered].sort((a, b) => {
            let comparison = 0;

            switch (filter.sortBy) {
                case 'date':
                    comparison =
                        a.receivedAt.getTime() - b.receivedAt.getTime();
                    break;
                case 'priority':
                    const priorityOrder: Record<NotificationPriority, number> = {
                        [NotificationPriority.Critical]: 4,
                        [NotificationPriority.High]: 3,
                        [NotificationPriority.Normal]: 2,
                        [NotificationPriority.Low]: 1,
                    };
                    comparison =
                        (priorityOrder[a.notification.priority] || 0) -
                        (priorityOrder[b.notification.priority] || 0);
                    break;
                case 'type':
                    comparison = a.notification.type.localeCompare(
                        b.notification.type
                    );
                    break;
                case 'title':
                    comparison = a.notification.title.localeCompare(
                        b.notification.title
                    );
                    break;
                default:
                    comparison =
                        b.receivedAt.getTime() - a.receivedAt.getTime();
            }

            return filter.sortOrder === 'asc' ? comparison : -comparison;
        });

        return sortedFiltered;
    }, [historyManager.entries, filter]);

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

    const handleSelectAll = useCallback(
        (checked: boolean) => {
            if (checked) {
                setSelectedIds(
                    new Set(
                        filteredNotifications.map(
                            (entry) => entry.notification.id
                        )
                    )
                );
            } else {
                setSelectedIds(new Set());
            }
        },
        [filteredNotifications]
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
    const unreadCount = historyManager.stats.unread;

    return (
        <Card className={cn('flex flex-col', className)}>
            {showHeader && (
                <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                        <CardTitle className='flex items-center space-x-2'>
                            <Bell className='size-5' />
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <Badge variant='destructive' className='ml-2'>
                                    {unreadCount}
                                </Badge>
                            )}
                        </CardTitle>

                        {/* Header Actions */}
                        <div className='flex items-center space-x-2'>
                            {unreadCount > 0 && (
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
                </CardHeader>
            )}

            <CardContent className='flex-1 p-0'>
                {/* Search and Filters */}
                {(showSearch || showFilters) && (
                    <div className='border-b p-4'>
                        {showSearch && (
                            <div className='relative mb-3'>
                                <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                                <Input
                                    placeholder='Search notifications...'
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
                                        <SelectItem value='all'>All</SelectItem>
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
                                        <SelectItem value='all'>All</SelectItem>
                                        <SelectItem value='active'>
                                            Active
                                        </SelectItem>
                                        <SelectItem value='dismissed'>
                                            Dismissed
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Sort Controls */}
                                <Select
                                    value={filter.sortBy}
                                    onValueChange={(value) =>
                                        setFilter((prev) => ({
                                            ...prev,
                                            sortBy: value as 'date' | 'priority' | 'type' | 'title',
                                        }))
                                    }
                                >
                                    <SelectTrigger className='w-32'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='date'>
                                            Date
                                        </SelectItem>
                                        <SelectItem value='priority'>
                                            Priority
                                        </SelectItem>
                                        <SelectItem value='type'>
                                            Type
                                        </SelectItem>
                                        <SelectItem value='title'>
                                            Title
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='h-9 px-2'
                                    onClick={() =>
                                        setFilter((prev) => ({
                                            ...prev,
                                            sortOrder:
                                                prev.sortOrder === 'asc'
                                                    ? 'desc'
                                                    : 'asc',
                                        }))
                                    }
                                    title={`Sort ${filter.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                >
                                    {filter.sortOrder === 'asc' ? (
                                        <ArrowUp className='size-4' />
                                    ) : (
                                        <ArrowDown className='size-4' />
                                    )}
                                </Button>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            className='h-9'
                                        >
                                            <Filter className='mr-2 size-4' />
                                            Filters
                                            {(filter.types.length > 0 ||
                                                filter.priorities.length > 0 ||
                                                filter.dateRange) && (
                                                <Badge
                                                    variant='secondary'
                                                    className='ml-2'
                                                >
                                                    {filter.types.length +
                                                        filter.priorities
                                                            .length +
                                                        (filter.dateRange
                                                            ? 1
                                                            : 0)}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-80'>
                                        <div className='space-y-4'>
                                            <div>
                                                <h4 className='mb-2 text-sm font-medium'>
                                                    Types
                                                </h4>
                                                <div className='space-y-2'>
                                                    {Object.values(
                                                        NotificationType
                                                    ).map((type) => (
                                                        <div
                                                            key={type}
                                                            className='flex items-center space-x-2'
                                                        >
                                                            <Checkbox
                                                                id={type}
                                                                checked={filter.types.includes(
                                                                    type
                                                                )}
                                                                onCheckedChange={(
                                                                    checked
                                                                ) => {
                                                                    setFilter(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            types: checked
                                                                                ? [
                                                                                      ...prev.types,
                                                                                      type,
                                                                                  ]
                                                                                : prev.types.filter(
                                                                                      (
                                                                                          t
                                                                                      ) =>
                                                                                          t !==
                                                                                          type
                                                                                  ),
                                                                        })
                                                                    );
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={type}
                                                                className='text-sm'
                                                            >
                                                                {type}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div>
                                                <h4 className='mb-2 text-sm font-medium'>
                                                    Priorities
                                                </h4>
                                                <div className='space-y-2'>
                                                    {Object.values(
                                                        NotificationPriority
                                                    ).map((priority) => (
                                                        <div
                                                            key={priority}
                                                            className='flex items-center space-x-2'
                                                        >
                                                            <Checkbox
                                                                id={priority}
                                                                checked={filter.priorities.includes(
                                                                    priority
                                                                )}
                                                                onCheckedChange={(
                                                                    checked
                                                                ) => {
                                                                    setFilter(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            priorities:
                                                                                checked
                                                                                    ? [
                                                                                          ...prev.priorities,
                                                                                          priority,
                                                                                      ]
                                                                                    : prev.priorities.filter(
                                                                                          (
                                                                                              p
                                                                                          ) =>
                                                                                              p !==
                                                                                              priority
                                                                                      ),
                                                                        })
                                                                    );
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={
                                                                    priority
                                                                }
                                                                className='text-sm'
                                                            >
                                                                {priority}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            <div>
                                                <h4 className='mb-2 text-sm font-medium'>
                                                    Date Range
                                                </h4>
                                                <div className='space-y-2'>
                                                    <div className='grid grid-cols-2 gap-2'>
                                                        <div>
                                                            <Label
                                                                htmlFor='date-from'
                                                                className='text-xs'
                                                            >
                                                                From
                                                            </Label>
                                                            <Input
                                                                id='date-from'
                                                                type='date'
                                                                value={
                                                                    filter
                                                                        .dateRange
                                                                        ?.start
                                                                        ? filter.dateRange.start
                                                                              .toISOString()
                                                                              .split(
                                                                                  'T'
                                                                              )[0]
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const date =
                                                                        e.target
                                                                            .value
                                                                            ? new Date(
                                                                                  e.target.value
                                                                              )
                                                                            : undefined;
                                                                    setFilter(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            dateRange:
                                                                                date
                                                                                    ? {
                                                                                          start: date,
                                                                                          end:
                                                                                              prev
                                                                                                  .dateRange
                                                                                                  ?.end ||
                                                                                              new Date(),
                                                                                      }
                                                                                    : undefined,
                                                                        })
                                                                    );
                                                                }}
                                                                className='h-8 text-xs'
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label
                                                                htmlFor='date-to'
                                                                className='text-xs'
                                                            >
                                                                To
                                                            </Label>
                                                            <Input
                                                                id='date-to'
                                                                type='date'
                                                                value={
                                                                    filter
                                                                        .dateRange
                                                                        ?.end
                                                                        ? filter.dateRange.end
                                                                              .toISOString()
                                                                              .split(
                                                                                  'T'
                                                                              )[0]
                                                                        : ''
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const date =
                                                                        e.target
                                                                            .value
                                                                            ? new Date(
                                                                                  e.target.value
                                                                              )
                                                                            : undefined;
                                                                    setFilter(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            dateRange:
                                                                                date
                                                                                    ? {
                                                                                          start:
                                                                                              prev
                                                                                                  .dateRange
                                                                                                  ?.start ||
                                                                                              new Date(
                                                                                                  0
                                                                                              ),
                                                                                          end: date,
                                                                                      }
                                                                                    : undefined,
                                                                        })
                                                                    );
                                                                }}
                                                                className='h-8 text-xs'
                                                            />
                                                        </div>
                                                    </div>
                                                    {filter.dateRange && (
                                                        <Button
                                                            variant='ghost'
                                                            size='sm'
                                                            className='h-6 w-full text-xs'
                                                            onClick={() =>
                                                                setFilter(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        dateRange:
                                                                            undefined,
                                                                    })
                                                                )
                                                            }
                                                        >
                                                            Clear date range
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>
                )}

                {/* Bulk Actions */}
                {showBulkActions && selectedCount > 0 && (
                    <div className='border-b bg-muted/50 p-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-2'>
                                <Checkbox
                                    checked={
                                        selectedCount ===
                                        filteredNotifications.length
                                    }
                                    onCheckedChange={handleSelectAll}
                                />
                                <span className='text-sm text-muted-foreground'>
                                    {selectedCount} selected
                                </span>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={handleBulkMarkAsRead}
                                >
                                    <Check className='mr-2 size-4' />
                                    Mark read
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

                {/* Notifications List */}
                <ScrollArea style={{ height: maxHeight }}>
                    {filteredNotifications.length === 0 ? (
                        <div className='flex flex-col items-center justify-center p-8 text-center'>
                            <Bell className='mb-4 size-12 text-muted-foreground/50' />
                            <h3 className='mb-2 text-lg font-medium'>
                                No notifications
                            </h3>
                            <p className='text-sm text-muted-foreground'>
                                {filter.searchQuery ||
                                filter.types.length > 0 ||
                                filter.priorities.length > 0
                                    ? 'No notifications match your filters'
                                    : "You're all caught up! New notifications will appear here."}
                            </p>
                        </div>
                    ) : (
                        <div className='divide-y'>
                            {filteredNotifications.map((entry) => (
                                <NotificationItem
                                    key={entry.notification.id}
                                    entry={entry}
                                    isSelected={
                                        enableSelection &&
                                        selectedIds.has(entry.notification.id)
                                    }
                                    onSelect={
                                        enableSelection
                                            ? (selected) =>
                                                  handleSelectNotification(
                                                      entry.notification.id,
                                                      selected
                                                  )
                                            : undefined
                                    }
                                    onMarkAsRead={historyManager.markAsRead}
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
            </CardContent>
        </Card>
    );
};

export default UserNotifications;

'use client';

import React, { useState } from 'react';
import { Bell, X, CheckCheck, Trash2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    useOrganizerRealtime,
    type OrganizerNotification,
} from '@/hooks/useOrganizerRealtime';

interface OrganizerNotificationCenterProps {
    organizerId?: string;
    className?: string;
}

const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const typeIcons = {
    registration: '👤',
    event_status: '📅',
    revenue: '💰',
    system: '⚙️',
    alert: '⚠️',
};

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const NotificationItem: React.FC<{
    notification: OrganizerNotification;
    onMarkAsRead: (id: string) => void;
    onDismiss: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDismiss }) => {
    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }

        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    return (
        <div
            className={`cursor-pointer border-l-4 p-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                notification.read
                    ? 'border-gray-200 opacity-70 dark:border-gray-700'
                    : 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/50'
            }`}
            onClick={handleClick}
        >
            <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 flex-1 items-start gap-3'>
                    <span className='mt-0.5 flex-shrink-0 text-lg'>
                        {typeIcons[notification.type]}
                    </span>
                    <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-center gap-2'>
                            <h4 className='truncate text-sm font-medium text-gray-900 dark:text-gray-100'>
                                {notification.title}
                            </h4>
                            <Badge
                                variant='secondary'
                                className={`px-1.5 py-0.5 text-xs ${priorityColors[notification.priority]}`}
                            >
                                {notification.priority}
                            </Badge>
                        </div>
                        <p className='line-clamp-2 text-sm text-gray-600 dark:text-gray-400'>
                            {notification.message}
                        </p>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-500'>
                            {formatTimeAgo(notification.timestamp)}
                        </p>
                    </div>
                </div>
                <div className='flex flex-shrink-0 items-center gap-1'>
                    {!notification.read && (
                        <Button
                            variant='ghost'
                            size='sm'
                            className='h-6 w-6 p-0'
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                            }}
                            title='Mark as read'
                        >
                            <CheckCheck className='h-3 w-3' />
                        </Button>
                    )}
                    <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0 text-gray-400 hover:text-red-500'
                        onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(notification.id);
                        }}
                        title='Dismiss'
                    >
                        <X className='h-3 w-3' />
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ConnectionStatus: React.FC<{
    isConnected: boolean;
    connectionError: string | null;
    onReconnect: () => void;
}> = ({ isConnected, connectionError, onReconnect }) => {
    if (isConnected) {
        return (
            <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                <Wifi className='h-4 w-4' />
                <span>Connected</span>
            </div>
        );
    }

    return (
        <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2 text-sm text-red-600 dark:text-red-400'>
                <WifiOff className='h-4 w-4' />
                <span>{connectionError || 'Disconnected'}</span>
            </div>
            <Button
                variant='outline'
                size='sm'
                onClick={onReconnect}
                className='h-6 text-xs'
            >
                Reconnect
            </Button>
        </div>
    );
};

export const OrganizerNotificationCenter: React.FC<
    OrganizerNotificationCenterProps
> = ({ organizerId, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const {
        isConnected,
        connectionError,
        notifications,
        unreadCount,
        markNotificationAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
        reconnect,
    } = useOrganizerRealtime({
        organizerId,
        enableNotifications: true,
        enableToasts: true,
    });

    const sortedNotifications = [...notifications].sort((a, b) => {
        // Sort by read status first (unread first), then by priority, then by timestamp
        if (a.read !== b.read) return a.read ? 1 : -1;

        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    });

    return (
        <div className={className}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='relative p-2'
                        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                    >
                        <Bell className='h-5 w-5' />
                        {unreadCount > 0 && (
                            <Badge
                                variant='destructive'
                                className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-96 p-0' align='end' side='bottom'>
                    <Card className='border-0 shadow-lg'>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center justify-between'>
                                <CardTitle className='text-lg'>
                                    Notifications
                                </CardTitle>
                                <div className='flex items-center gap-2'>
                                    {notifications.length > 0 && (
                                        <>
                                            {unreadCount > 0 && (
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    onClick={markAllAsRead}
                                                    className='text-xs'
                                                >
                                                    Mark all read
                                                </Button>
                                            )}
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={clearAllNotifications}
                                                className='text-xs text-red-600 hover:text-red-700'
                                            >
                                                <Trash2 className='h-3 w-3' />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <ConnectionStatus
                                isConnected={isConnected}
                                connectionError={connectionError}
                                onReconnect={reconnect}
                            />
                        </CardHeader>
                        <CardContent className='p-0'>
                            {sortedNotifications.length === 0 ? (
                                <div className='p-6 text-center text-gray-500 dark:text-gray-400'>
                                    <Bell className='mx-auto mb-2 h-8 w-8 opacity-50' />
                                    <p>No notifications yet</p>
                                    <p className='mt-1 text-sm'>
                                        You'll see real-time updates here
                                    </p>
                                </div>
                            ) : (
                                <ScrollArea className='h-96'>
                                    <div className='space-y-0'>
                                        {sortedNotifications.map(
                                            (notification, index) => (
                                                <React.Fragment
                                                    key={notification.id}
                                                >
                                                    <NotificationItem
                                                        notification={
                                                            notification
                                                        }
                                                        onMarkAsRead={
                                                            markNotificationAsRead
                                                        }
                                                        onDismiss={
                                                            dismissNotification
                                                        }
                                                    />
                                                    {index <
                                                        sortedNotifications.length -
                                                            1 && <Separator />}
                                                </React.Fragment>
                                            )
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default OrganizerNotificationCenter;

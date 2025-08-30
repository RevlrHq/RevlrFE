'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    DollarSign,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    Activity,
    Zap,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrganizerDashboardRealtime } from '@/hooks/useOrganizerDashboardRealtime';
import type {
    DashboardMetrics,
    EventStatusChange,
    RegistrationUpdate,
    RevenueUpdate,
    FinancingUpdate,
} from '@/hooks/useOrganizerDashboardRealtime';
import { cn } from '@/lib/utils';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface OrganizerDashboardRealtimeProps {
    organizerId: string;
    className?: string;
    showMetrics?: boolean;
    showRecentActivity?: boolean;
    showLiveUpdates?: boolean;
    maxRecentItems?: number;
    refreshInterval?: number;
    onMetricsUpdate?: (metrics: DashboardMetrics) => void;
    onActivityUpdate?: (activity: any) => void;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    isLoading?: boolean;
    className?: string;
}

interface ActivityItemProps {
    type: 'registration' | 'revenue' | 'event_status' | 'financing';
    title: string;
    description: string;
    timestamp: Date;
    value?: number;
    currency?: string;
    status?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats currency values
 */
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
};

/**
 * Formats large numbers with abbreviations
 */
const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

/**
 * Formats time ago
 */
const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

/**
 * Gets trend direction from change percentage
 */
const getTrend = (change: number): 'up' | 'down' | 'neutral' => {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
};

/**
 * Gets activity icon based on type
 */
const getActivityIcon = (type: ActivityItemProps['type']) => {
    const iconClass = 'h-4 w-4';

    switch (type) {
        case 'registration':
            return <Users className={iconClass} />;
        case 'revenue':
            return <DollarSign className={iconClass} />;
        case 'event_status':
            return <Calendar className={iconClass} />;
        case 'financing':
            return <FileText className={iconClass} />;
        default:
            return <Activity className={iconClass} />;
    }
};

/**
 * Gets status color based on priority
 */
const getStatusColor = (priority: ActivityItemProps['priority'] = 'medium') => {
    switch (priority) {
        case 'critical':
            return 'text-red-600 bg-red-50 border-red-200';
        case 'high':
            return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'medium':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'low':
            return 'text-gray-600 bg-gray-50 border-gray-200';
        default:
            return 'text-blue-600 bg-blue-50 border-blue-200';
    }
};

// ============================================================================
// Metric Card Component
// ============================================================================

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    changeLabel,
    icon,
    trend = 'neutral',
    isLoading = false,
    className,
}) => {
    const trendIcon =
        trend === 'up'
            ? TrendingUp
            : trend === 'down'
              ? TrendingDown
              : Activity;
    const trendColor =
        trend === 'up'
            ? 'text-green-600'
            : trend === 'down'
              ? 'text-red-600'
              : 'text-gray-600';

    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-muted-foreground'>
                    {title}
                </CardTitle>
                <div className='text-muted-foreground'>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className='flex items-center justify-between'>
                    <div>
                        {isLoading ? (
                            <div className='h-8 w-20 animate-pulse rounded bg-muted' />
                        ) : (
                            <div className='text-2xl font-bold'>{value}</div>
                        )}
                        {change !== undefined && changeLabel && (
                            <div
                                className={cn(
                                    'flex items-center text-xs',
                                    trendColor
                                )}
                            >
                                <trendIcon className='mr-1 size-3' />
                                <span>
                                    {change > 0 ? '+' : ''}
                                    {change.toFixed(1)}% {changeLabel}
                                </span>
                            </div>
                        )}
                    </div>
                    {trend !== 'neutral' && (
                        <div
                            className={cn(
                                'rounded-full p-1',
                                trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                            )}
                        >
                            <trendIcon className={cn('h-4 w-4', trendColor)} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// ============================================================================
// Activity Item Component
// ============================================================================

const ActivityItem: React.FC<ActivityItemProps> = ({
    type,
    title,
    description,
    timestamp,
    value,
    currency = 'USD',
    status,
    priority = 'medium',
}) => {
    const icon = getActivityIcon(type);
    const statusColor = getStatusColor(priority);

    return (
        <div className='flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-muted/50'>
            <div className={cn('rounded-full border p-2', statusColor)}>
                {icon}
            </div>
            <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between'>
                    <p className='truncate text-sm font-medium text-foreground'>
                        {title}
                    </p>
                    <div className='flex items-center space-x-2'>
                        {value && (
                            <Badge variant='secondary' className='text-xs'>
                                {formatCurrency(value, currency)}
                            </Badge>
                        )}
                        {status && (
                            <Badge
                                variant={
                                    status === 'Completed'
                                        ? 'default'
                                        : 'secondary'
                                }
                                className='text-xs'
                            >
                                {status}
                            </Badge>
                        )}
                    </div>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>
                    {description}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                    {formatTimeAgo(timestamp)}
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Real-time dashboard component for organizers with live metrics and activity feed
 */
export const OrganizerDashboardRealtime: React.FC<
    OrganizerDashboardRealtimeProps
> = ({
    organizerId,
    className,
    showMetrics = true,
    showRecentActivity = true,
    showLiveUpdates = true,
    maxRecentItems = 10,
    refreshInterval = 30000,
    onMetricsUpdate,
    onActivityUpdate,
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

    // Real-time dashboard hook
    const {
        metrics,
        isMetricsLoading,
        metricsError,
        eventStatusChanges,
        registrationUpdates,
        revenueUpdates,
        financingUpdates,
        stats,
        refreshMetrics,
        getRecentUpdates,
    } = useOrganizerDashboardRealtime({
        organizerId,
        enableMetricsUpdates: showMetrics,
        enableEventStatusUpdates: showRecentActivity,
        enableRegistrationUpdates: showRecentActivity,
        enableRevenueUpdates: showRecentActivity,
        enableFinancingUpdates: showRecentActivity,
        enableNotifications: true,
        enableToasts: false,
        metricsUpdateInterval: refreshInterval,
        onMetricsUpdate: useCallback(
            (updatedMetrics: DashboardMetrics) => {
                setLastUpdateTime(new Date());
                onMetricsUpdate?.(updatedMetrics);
            },
            [onMetricsUpdate]
        ),
        onRegistrationUpdate: useCallback(
            (update: RegistrationUpdate) => {
                onActivityUpdate?.(update);
            },
            [onActivityUpdate]
        ),
        onRevenueUpdate: useCallback(
            (update: RevenueUpdate) => {
                onActivityUpdate?.(update);
            },
            [onActivityUpdate]
        ),
        onEventStatusChange: useCallback(
            (change: EventStatusChange) => {
                onActivityUpdate?.(change);
            },
            [onActivityUpdate]
        ),
        onFinancingUpdate: useCallback(
            (update: FinancingUpdate) => {
                onActivityUpdate?.(update);
            },
            [onActivityUpdate]
        ),
    });

    // Manual refresh handler
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await refreshMetrics();
            setLastUpdateTime(new Date());
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshMetrics]);

    // Combine all activity items
    const recentActivity = React.useMemo(() => {
        const activities: ActivityItemProps[] = [];

        // Add registration updates
        registrationUpdates.slice(0, maxRecentItems).forEach((update) => {
            activities.push({
                type: 'registration',
                title: 'New Registration',
                description: `${update.attendeeName} registered for ${update.eventTitle}`,
                timestamp: update.registrationDate,
                value: update.ticketPrice,
                status: update.paymentStatus,
                priority: 'medium',
            });
        });

        // Add revenue updates
        revenueUpdates.slice(0, maxRecentItems).forEach((update) => {
            activities.push({
                type: 'revenue',
                title: 'Payment Received',
                description: update.eventTitle
                    ? `Payment for ${update.eventTitle}`
                    : `Payment ${update.paymentId}`,
                timestamp: update.transactionDate,
                value: update.netAmount,
                currency: update.currency,
                status: 'Completed',
                priority: 'medium',
            });
        });

        // Add event status changes
        eventStatusChanges.slice(0, maxRecentItems).forEach((change) => {
            activities.push({
                type: 'event_status',
                title: 'Event Status Changed',
                description: `${change.eventTitle} changed from ${change.oldStatus} to ${change.newStatus}`,
                timestamp: change.timestamp,
                status: change.newStatus,
                priority: change.newStatus === 'Cancelled' ? 'high' : 'medium',
            });
        });

        // Add financing updates
        financingUpdates.slice(0, maxRecentItems).forEach((update) => {
            activities.push({
                type: 'financing',
                title: 'Financing Update',
                description: `Application for ${update.eventTitle} is ${update.status}`,
                timestamp: update.reviewDate || update.applicationDate,
                value: update.approvedAmount || update.requestedAmount,
                status: update.status,
                priority:
                    update.status === 'Approved'
                        ? 'high'
                        : update.status === 'Rejected'
                          ? 'high'
                          : 'medium',
            });
        });

        // Sort by timestamp (newest first) and limit
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, maxRecentItems);
    }, [
        registrationUpdates,
        revenueUpdates,
        eventStatusChanges,
        financingUpdates,
        maxRecentItems,
    ]);

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header with refresh button */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>
                        Dashboard
                    </h2>
                    <p className='text-muted-foreground'>
                        Real-time overview of your events and performance
                    </p>
                </div>
                <div className='flex items-center space-x-2'>
                    {showLiveUpdates && (
                        <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
                            <div className='flex items-center space-x-1'>
                                <div className='size-2 animate-pulse rounded-full bg-green-500' />
                                <span>Live</span>
                            </div>
                            <span>•</span>
                            <span>Updated {formatTimeAgo(lastUpdateTime)}</span>
                        </div>
                    )}
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={cn(
                                'mr-2 h-4 w-4',
                                isRefreshing && 'animate-spin'
                            )}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Error state */}
            {metricsError && (
                <Card className='border-red-200 bg-red-50'>
                    <CardContent className='pt-6'>
                        <div className='flex items-center space-x-2 text-red-600'>
                            <AlertCircle className='size-4' />
                            <span className='text-sm font-medium'>
                                Error loading metrics
                            </span>
                        </div>
                        <p className='mt-1 text-sm text-red-600'>
                            {metricsError}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Metrics Cards */}
            {showMetrics && metrics && (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    <MetricCard
                        title='Total Events'
                        value={formatNumber(metrics.totalEvents)}
                        change={
                            metrics.totalEvents > 0
                                ? (metrics.activeEvents / metrics.totalEvents) *
                                  100
                                : 0
                        }
                        changeLabel='active'
                        icon={<Calendar className='size-4' />}
                        trend={getTrend(metrics.totalEvents)}
                        isLoading={isMetricsLoading}
                    />
                    <MetricCard
                        title='Total Revenue'
                        value={formatCurrency(metrics.totalRevenue)}
                        change={metrics.revenueGrowth}
                        changeLabel='this month'
                        icon={<DollarSign className='size-4' />}
                        trend={getTrend(metrics.revenueGrowth)}
                        isLoading={isMetricsLoading}
                    />
                    <MetricCard
                        title='Total Attendees'
                        value={formatNumber(metrics.totalAttendees)}
                        change={metrics.attendeeGrowth}
                        changeLabel='this month'
                        icon={<Users className='size-4' />}
                        trend={getTrend(metrics.attendeeGrowth)}
                        isLoading={isMetricsLoading}
                    />
                    <MetricCard
                        title='Conversion Rate'
                        value={`${metrics.conversionRate.toFixed(1)}%`}
                        icon={<TrendingUp className='size-4' />}
                        trend={getTrend(metrics.conversionRate - 50)} // Assuming 50% is baseline
                        isLoading={isMetricsLoading}
                    />
                </div>
            )}

            {/* Additional Metrics Row */}
            {showMetrics && metrics && (
                <div className='grid gap-4 md:grid-cols-3'>
                    <Card>
                        <CardHeader className='pb-2'>
                            <CardTitle className='text-sm font-medium text-muted-foreground'>
                                Event Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <div className='flex justify-between text-sm'>
                                    <span>Published</span>
                                    <span className='font-medium'>
                                        {metrics.publishedEvents}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span>Draft</span>
                                    <span className='font-medium'>
                                        {metrics.draftEvents}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span>Cancelled</span>
                                    <span className='font-medium'>
                                        {metrics.cancelledEvents}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='pb-2'>
                            <CardTitle className='text-sm font-medium text-muted-foreground'>
                                Payment Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <div className='flex justify-between text-sm'>
                                    <span>Pending</span>
                                    <span className='font-medium'>
                                        {metrics.pendingPayments}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span>Failed</span>
                                    <span className='font-medium text-red-600'>
                                        {metrics.failedPayments}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span>Avg. Ticket</span>
                                    <span className='font-medium'>
                                        {formatCurrency(
                                            metrics.averageTicketPrice
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='pb-2'>
                            <CardTitle className='text-sm font-medium text-muted-foreground'>
                                Activity Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-2'>
                                <div className='flex justify-between text-sm'>
                                    <span>Today's Updates</span>
                                    <span className='font-medium'>
                                        {stats.todayUpdates}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span>Recent Revenue</span>
                                    <span className='font-medium text-green-600'>
                                        {formatCurrency(stats.recentRevenue)}
                                    </span>
                                </div>
                                <div className='flex justify-between text-sm'>
                                    <span>New Registrations</span>
                                    <span className='font-medium'>
                                        {stats.recentRegistrations}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Activity */}
            {showRecentActivity && (
                <Card>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='flex items-center space-x-2'>
                                <Activity className='size-5' />
                                <span>Recent Activity</span>
                            </CardTitle>
                            {showLiveUpdates && (
                                <Badge
                                    variant='secondary'
                                    className='flex items-center space-x-1'
                                >
                                    <Zap className='size-3' />
                                    <span>Live Updates</span>
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className='p-0'>
                        <ScrollArea className='h-96'>
                            {recentActivity.length === 0 ? (
                                <div className='flex flex-col items-center justify-center p-8 text-center'>
                                    <Activity className='mb-4 size-12 text-muted-foreground/50' />
                                    <h3 className='mb-2 text-lg font-medium text-muted-foreground'>
                                        No recent activity
                                    </h3>
                                    <p className='text-sm text-muted-foreground'>
                                        Activity will appear here as events,
                                        registrations, and payments occur.
                                    </p>
                                </div>
                            ) : (
                                <div className='divide-y'>
                                    {recentActivity.map((activity, index) => (
                                        <ActivityItem
                                            key={`${activity.type}-${index}`}
                                            {...activity}
                                        />
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default OrganizerDashboardRealtime;

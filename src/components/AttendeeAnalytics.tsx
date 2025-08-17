'use client';

import React from 'react';
import { useAttendeeAnalytics } from '../hooks/useAttendeeAnalytics';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
    Users,
    UserPlus,
    RotateCcw,
    DollarSign,
    TrendingUp,
    RefreshCw,
    Award,
    Mail,
    Calendar,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface AttendeeAnalyticsProps {
    className?: string;
}

const AttendeeAnalytics: React.FC<AttendeeAnalyticsProps> = ({
    className = '',
}) => {
    const { analytics, loading, error, refetch } = useAttendeeAnalytics();

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatNumber = (num: number | undefined) => {
        if (num === undefined) return '0';
        return new Intl.NumberFormat('en-US').format(num);
    };

    const formatPercentage = (num: number | undefined) => {
        if (num === undefined) return '0%';
        return `${num.toFixed(1)}%`;
    };

    if (error) {
        return (
            <div className={`p-6 ${className}`}>
                <div className='py-8 text-center'>
                    <div className='mb-2 text-red-500'>
                        Error loading attendee analytics
                    </div>
                    <p className='mb-4 text-gray-600 dark:text-gray-400'>
                        {error}
                    </p>
                    <Button onClick={refetch} variant='outline'>
                        <RefreshCw className='mr-2 size-4' />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className='flex items-center justify-between'>
                    <div>
                        <Skeleton className='mb-2 h-8 w-48' />
                        <Skeleton className='h-4 w-64' />
                    </div>
                    <Skeleton className='h-10 w-24' />
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className='p-6'>
                            <Skeleton className='mb-4 size-6' />
                            <Skeleton className='mb-2 h-8 w-16' />
                            <Skeleton className='h-4 w-24' />
                        </Card>
                    ))}
                </div>

                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                    <Card className='p-6'>
                        <Skeleton className='mb-4 h-6 w-32' />
                        <div className='space-y-4'>
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className='flex items-center justify-between'
                                >
                                    <Skeleton className='h-4 w-24' />
                                    <Skeleton className='h-4 w-16' />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className='p-6'>
                        <Skeleton className='mb-4 h-6 w-32' />
                        <div className='space-y-4'>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className='flex items-center space-x-3'
                                >
                                    <Skeleton className='size-10 rounded-full' />
                                    <div className='flex-1'>
                                        <Skeleton className='mb-1 h-4 w-32' />
                                        <Skeleton className='h-3 w-24' />
                                    </div>
                                    <Skeleton className='h-4 w-16' />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className={`p-6 ${className}`}>
                <div className='py-8 text-center'>
                    <Users className='mx-auto mb-4 size-12 text-gray-400' />
                    <p className='text-gray-600 dark:text-gray-400'>
                        No analytics data available
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        Attendee Analytics
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Insights into your attendee demographics and behavior
                    </p>
                </div>
                <Button variant='outline' onClick={refetch}>
                    <RefreshCw className='mr-2 size-4' />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                <Card className='p-6'>
                    <div className='flex items-center'>
                        <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900'>
                            <Users className='size-6 text-blue-600 dark:text-blue-400' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                                Total Attendees
                            </p>
                            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                {formatNumber(analytics.totalUniqueAttendees)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='p-6'>
                    <div className='flex items-center'>
                        <div className='rounded-lg bg-green-100 p-2 dark:bg-green-900'>
                            <UserPlus className='size-6 text-green-600 dark:text-green-400' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                                New This Month
                            </p>
                            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                {formatNumber(analytics.newAttendeesThisMonth)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='p-6'>
                    <div className='flex items-center'>
                        <div className='rounded-lg bg-purple-100 p-2 dark:bg-purple-900'>
                            <RotateCcw className='size-6 text-purple-600 dark:text-purple-400' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                                Returning Attendees
                            </p>
                            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                {formatNumber(analytics.returningAttendees)}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className='p-6'>
                    <div className='flex items-center'>
                        <div className='rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900'>
                            <DollarSign className='size-6 text-yellow-600 dark:text-yellow-400' />
                        </div>
                        <div className='ml-4'>
                            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
                                Avg. Spend
                            </p>
                            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                                {formatCurrency(
                                    analytics.averageSpendPerAttendee
                                )}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detailed Analytics */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Attendee Segments */}
                <Card className='p-6'>
                    <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                            Attendee Segments
                        </h3>
                        <TrendingUp className='size-5 text-gray-400' />
                    </div>

                    {analytics.attendeeSegments &&
                    analytics.attendeeSegments.length > 0 ? (
                        <div className='space-y-4'>
                            {analytics.attendeeSegments.map(
                                (segment, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center justify-between'
                                    >
                                        <div className='flex-1'>
                                            <div className='mb-1 flex items-center justify-between'>
                                                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                                                    {segment.segmentName}
                                                </span>
                                                <span className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {formatNumber(
                                                        segment.count
                                                    )}{' '}
                                                    (
                                                    {formatPercentage(
                                                        segment.percentage
                                                    )}
                                                    )
                                                </span>
                                            </div>
                                            <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                                                <div
                                                    className='h-2 rounded-full bg-blue-600 transition-all duration-300'
                                                    style={{
                                                        width: `${segment.percentage || 0}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                                Avg. Spend:{' '}
                                                {formatCurrency(
                                                    segment.averageSpend
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className='py-8 text-center'>
                            <Users className='mx-auto mb-2 size-8 text-gray-400' />
                            <p className='text-gray-500 dark:text-gray-400'>
                                No segment data available
                            </p>
                        </div>
                    )}
                </Card>

                {/* Top Attendees */}
                <Card className='p-6'>
                    <div className='mb-6 flex items-center justify-between'>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                            Top Attendees
                        </h3>
                        <Award className='size-5 text-gray-400' />
                    </div>

                    {analytics.topAttendees &&
                    analytics.topAttendees.length > 0 ? (
                        <div className='space-y-4'>
                            {analytics.topAttendees.map((attendee, index) => (
                                <div
                                    key={attendee.attendeeId}
                                    className='flex items-center space-x-3'
                                >
                                    <div className='shrink-0'>
                                        <div className='flex size-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600'>
                                            <span className='text-sm font-medium text-white'>
                                                #{index + 1}
                                            </span>
                                        </div>
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                                            {attendee.name}
                                        </p>
                                        <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                                            <Mail className='mr-1 size-3' />
                                            <span className='truncate'>
                                                {attendee.email}
                                            </span>
                                        </div>
                                    </div>
                                    <div className='shrink-0 text-right'>
                                        <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                            {formatCurrency(
                                                attendee.totalSpent
                                            )}
                                        </p>
                                        <div className='flex items-center text-xs text-gray-500 dark:text-gray-400'>
                                            <Calendar className='mr-1 size-3' />
                                            {formatNumber(
                                                attendee.eventsAttended
                                            )}{' '}
                                            events
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='py-8 text-center'>
                            <Award className='mx-auto mb-2 size-8 text-gray-400' />
                            <p className='text-gray-500 dark:text-gray-400'>
                                No top attendees data available
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Summary Stats */}
            <Card className='p-6'>
                <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                    Summary
                </h3>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                    <div className='text-center'>
                        <div className='mb-1 text-2xl font-bold text-blue-600 dark:text-blue-400'>
                            {analytics.totalUniqueAttendees &&
                            analytics.newAttendeesThisMonth
                                ? formatPercentage(
                                      (analytics.newAttendeesThisMonth /
                                          analytics.totalUniqueAttendees) *
                                          100
                                  )
                                : '0%'}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                            New Attendee Rate
                        </div>
                    </div>
                    <div className='text-center'>
                        <div className='mb-1 text-2xl font-bold text-green-600 dark:text-green-400'>
                            {analytics.totalUniqueAttendees &&
                            analytics.returningAttendees
                                ? formatPercentage(
                                      (analytics.returningAttendees /
                                          analytics.totalUniqueAttendees) *
                                          100
                                  )
                                : '0%'}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                            Retention Rate
                        </div>
                    </div>
                    <div className='text-center'>
                        <div className='mb-1 text-2xl font-bold text-purple-600 dark:text-purple-400'>
                            {formatCurrency(analytics.averageSpendPerAttendee)}
                        </div>
                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                            Average Lifetime Value
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AttendeeAnalytics;

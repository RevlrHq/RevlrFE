'use client';

import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Ticket,
    Calendar,
    Target,
    Activity,
} from 'lucide-react';
import { EventPerformanceView } from '@/lib/api';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
    getChartColors,
    getBaseChartOptions,
} from '@/lib/utils/chartConfig';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface IndividualEventPerformanceProps {
    eventPerformance: EventPerformanceView;
    loading?: boolean;
    isDark?: boolean;
    className?: string;
}

interface PerformanceMetric {
    label: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
}

export const IndividualEventPerformance: React.FC<
    IndividualEventPerformanceProps
> = ({ eventPerformance, loading = false, isDark = false, className = '' }) => {
    // Calculate key metrics
    const keyMetrics = useMemo((): PerformanceMetric[] => {
        if (!eventPerformance) return [];

        const salesRate =
            eventPerformance.totalTickets && eventPerformance.totalTickets > 0
                ? (eventPerformance.ticketsSold || 0) /
                  eventPerformance.totalTickets
                : 0;

        const completionRate =
            eventPerformance.totalRegistrations &&
            eventPerformance.totalRegistrations > 0
                ? (eventPerformance.completedRegistrations || 0) /
                  eventPerformance.totalRegistrations
                : 0;

        return [
            {
                label: 'Total Revenue',
                value: formatCurrency(eventPerformance.totalRevenue || 0),
                trend: 'up',
                icon: <DollarSign className='size-4' />,
                color: 'text-green-600',
            },
            {
                label: 'Sales Rate',
                value: formatPercentage(salesRate),
                trend:
                    salesRate > 0.7
                        ? 'up'
                        : salesRate > 0.4
                          ? 'neutral'
                          : 'down',
                icon: <Target className='size-4' />,
                color:
                    salesRate > 0.7
                        ? 'text-green-600'
                        : salesRate > 0.4
                          ? 'text-yellow-600'
                          : 'text-red-600',
            },
            {
                label: 'Avg. Ticket Price',
                value: formatCurrency(eventPerformance.averageTicketPrice || 0),
                trend: 'neutral',
                icon: <Ticket className='size-4' />,
                color: 'text-blue-600',
            },
            {
                label: 'Completion Rate',
                value: formatPercentage(completionRate),
                trend:
                    completionRate > 0.8
                        ? 'up'
                        : completionRate > 0.6
                          ? 'neutral'
                          : 'down',
                icon: <Users className='size-4' />,
                color:
                    completionRate > 0.8
                        ? 'text-green-600'
                        : completionRate > 0.6
                          ? 'text-yellow-600'
                          : 'text-red-600',
            },
        ];
    }, [eventPerformance]);

    // Prepare daily registration chart data
    const dailyRegistrationChartData = useMemo(() => {
        if (
            !eventPerformance?.dailyStats ||
            eventPerformance.dailyStats.length === 0
        ) {
            return null;
        }

        const colors = getChartColors(isDark);
        const sortedStats = [...eventPerformance.dailyStats].sort(
            (a, b) =>
                new Date(a.date || '').getTime() -
                new Date(b.date || '').getTime()
        );

        return {
            labels: sortedStats.map((stat) =>
                new Date(stat.date || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                })
            ),
            datasets: [
                {
                    label: 'Registrations',
                    data: sortedStats.map((stat) => stat.registrations || 0),
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '20',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Revenue',
                    data: sortedStats.map((stat) => stat.revenue || 0),
                    borderColor: colors.secondary,
                    backgroundColor: colors.secondary + '20',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1',
                },
            ],
        };
    }, [eventPerformance?.dailyStats, isDark]);

    // Prepare ticket performance chart data
    const ticketPerformanceChartData = useMemo(() => {
        if (
            !eventPerformance?.ticketPerformance ||
            eventPerformance.ticketPerformance.length === 0
        ) {
            return null;
        }

        const colors = getChartColors(isDark);

        return {
            labels: eventPerformance.ticketPerformance.map(
                (ticket) => ticket.ticketName || 'Unnamed Ticket'
            ),
            datasets: [
                {
                    label: 'Sold',
                    data: eventPerformance.ticketPerformance.map(
                        (ticket) => ticket.soldQuantity || 0
                    ),
                    backgroundColor: colors.primary + '80',
                    borderColor: colors.primary,
                    borderWidth: 1,
                },
                {
                    label: 'Available',
                    data: eventPerformance.ticketPerformance.map(
                        (ticket) => ticket.availableQuantity || 0
                    ),
                    backgroundColor: colors.muted + '80',
                    borderColor: colors.muted,
                    borderWidth: 1,
                },
            ],
        };
    }, [eventPerformance?.ticketPerformance, isDark]);

    // Prepare registration status pie chart data
    const registrationStatusChartData = useMemo(() => {
        if (!eventPerformance) return null;

        const colors = getChartColors(isDark);

        return {
            labels: ['Completed', 'Pending', 'Cancelled'],
            datasets: [
                {
                    data: [
                        eventPerformance.completedRegistrations || 0,
                        eventPerformance.pendingRegistrations || 0,
                        eventPerformance.cancelledRegistrations || 0,
                    ],
                    backgroundColor: [
                        colors.primary + '80',
                        colors.secondary + '80',
                        colors.destructive + '80',
                    ],
                    borderColor: [
                        colors.primary,
                        colors.secondary,
                        colors.destructive,
                    ],
                    borderWidth: 2,
                },
            ],
        };
    }, [eventPerformance, isDark]);

    const chartOptions = useMemo(() => {
        const baseOptions = getBaseChartOptions(isDark);
        return {
            ...baseOptions,
            scales: {
                ...baseOptions.scales,
                y: {
                    ...baseOptions.scales?.y,
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                        display: true,
                        text: 'Registrations',
                        color: getChartColors(isDark).muted,
                    },
                },
                y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                        display: true,
                        text: 'Revenue ($)',
                        color: getChartColors(isDark).muted,
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: getChartColors(isDark).muted,
                        callback: function (value: string | number) {
                            return formatCurrency(Number(value));
                        },
                    },
                },
            },
        };
    }, [isDark]);

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className='pb-2'>
                                <Skeleton className='h-4 w-24' />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='mb-2 h-8 w-20' />
                                <Skeleton className='h-3 w-16' />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <Skeleton className='h-6 w-48' />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='h-64 w-full' />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className='h-6 w-48' />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className='h-64 w-full' />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!eventPerformance) {
        return (
            <div className={`py-8 text-center ${className}`}>
                <Activity className='mx-auto mb-4 size-12 opacity-50' />
                <p className='text-muted-foreground'>
                    No performance data available for this event.
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Event Header */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-xl'>
                                {eventPerformance.eventTitle}
                            </CardTitle>
                            <p className='text-sm text-muted-foreground'>
                                {eventPerformance.startDate &&
                                    new Date(
                                        eventPerformance.startDate
                                    ).toLocaleDateString()}{' '}
                                -{' '}
                                {eventPerformance.endDate &&
                                    new Date(
                                        eventPerformance.endDate
                                    ).toLocaleDateString()}
                            </p>
                        </div>
                        <Badge variant='outline'>
                            {eventPerformance.eventId}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {keyMetrics.map((metric, index) => (
                    <Card key={index}>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                                {metric.label}
                            </CardTitle>
                            <div className={metric.color}>{metric.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>
                                {metric.value}
                            </div>
                            {metric.trend && (
                                <div className='flex items-center text-xs text-muted-foreground'>
                                    {metric.trend === 'up' && (
                                        <TrendingUp className='mr-1 size-3 text-green-500' />
                                    )}
                                    {metric.trend === 'down' && (
                                        <TrendingDown className='mr-1 size-3 text-red-500' />
                                    )}
                                    {metric.trend === 'neutral' && (
                                        <Activity className='mr-1 size-3 text-gray-500' />
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Grid */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Daily Registration Trends */}
                {dailyRegistrationChartData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Calendar className='size-5' />
                                Daily Registration Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: 300 }}>
                                <Line
                                    data={dailyRegistrationChartData}
                                    options={chartOptions}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Registration Status Breakdown */}
                {registrationStatusChartData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Users className='size-5' />
                                Registration Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: 300 }}>
                                <Doughnut
                                    data={registrationStatusChartData}
                                    options={{
                                        ...getBaseChartOptions(isDark),
                                        plugins: {
                                            legend: {
                                                position: 'bottom' as const,
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Ticket Performance */}
            {eventPerformance.ticketPerformance &&
                eventPerformance.ticketPerformance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Ticket className='size-5' />
                                Ticket Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                {/* Ticket Performance Chart */}
                                {ticketPerformanceChartData && (
                                    <div style={{ height: 300 }}>
                                        <Bar
                                            data={ticketPerformanceChartData}
                                            options={{
                                                ...getBaseChartOptions(isDark),
                                                plugins: {
                                                    title: {
                                                        display: true,
                                                        text: 'Tickets Sold vs Available',
                                                    },
                                                    legend: {
                                                        position:
                                                            'top' as const,
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Ticket Details Table */}
                                <div className='space-y-3'>
                                    <h4 className='font-medium'>
                                        Ticket Details
                                    </h4>
                                    {eventPerformance.ticketPerformance.map(
                                        (ticket, index) => (
                                            <div
                                                key={index}
                                                className='rounded-lg border p-4'
                                            >
                                                <div className='mb-2 flex items-center justify-between'>
                                                    <h5 className='font-medium'>
                                                        {ticket.ticketName}
                                                    </h5>
                                                    <Badge variant='outline'>
                                                        {formatCurrency(
                                                            ticket.price || 0
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div className='mb-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                                                    <div>
                                                        <span className='text-muted-foreground'>
                                                            Sold:
                                                        </span>
                                                        <div className='font-medium'>
                                                            {formatNumber(
                                                                ticket.soldQuantity ||
                                                                    0
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>
                                                            Available:
                                                        </span>
                                                        <div className='font-medium'>
                                                            {formatNumber(
                                                                ticket.availableQuantity ||
                                                                    0
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>
                                                            Total:
                                                        </span>
                                                        <div className='font-medium'>
                                                            {formatNumber(
                                                                ticket.totalQuantity ||
                                                                    0
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className='text-muted-foreground'>
                                                            Revenue:
                                                        </span>
                                                        <div className='font-medium'>
                                                            {formatCurrency(
                                                                ticket.revenue ||
                                                                    0
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='space-y-1'>
                                                    <div className='flex justify-between text-sm'>
                                                        <span>Sales Rate</span>
                                                        <span>
                                                            {formatPercentage(
                                                                ticket.salesRate ||
                                                                    0
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            (ticket.salesRate ||
                                                                0) * 100
                                                        }
                                                        className='h-2'
                                                    />
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
        </div>
    );
};

export default IndividualEventPerformance;

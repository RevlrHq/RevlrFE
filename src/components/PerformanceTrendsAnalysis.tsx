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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Activity,
    Calendar,
    Target,
} from 'lucide-react';
import { EventSummaryView } from '@/lib/api';
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
    Legend
);

interface PerformanceTrendsAnalysisProps {
    events: EventSummaryView[];
    loading?: boolean;
    isDark?: boolean;
    className?: string;
    timeRange?: {
        startDate?: string;
        endDate?: string;
    };
}

interface TrendMetric {
    label: string;
    value: string | number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
}

interface MonthlyPerformance {
    month: string;
    revenue: number;
    registrations: number;
    events: number;
    averageRevenue: number;
    averageRegistrations: number;
}

export const PerformanceTrendsAnalysis: React.FC<
    PerformanceTrendsAnalysisProps
> = ({
    events,
    loading = false,
    isDark = false,
    className = '',
    timeRange,
}) => {
    // Group events by month for trend analysis
    const monthlyPerformance = useMemo((): MonthlyPerformance[] => {
        if (!events || events.length === 0) return [];

        const monthlyData = new Map<
            string,
            {
                revenue: number;
                registrations: number;
                events: number;
            }
        >();

        events.forEach((event) => {
            if (!event.startDate) return;

            const date = new Date(event.startDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
            });

            const existing = monthlyData.get(monthKey) || {
                revenue: 0,
                registrations: 0,
                events: 0,
            };
            monthlyData.set(monthKey, {
                revenue: existing.revenue + (event.revenue || 0),
                registrations:
                    existing.registrations + (event.registrationCount || 0),
                events: existing.events + 1,
            });
        });

        return Array.from(monthlyData.entries())
            .map(([key, data]) => {
                const date = new Date(key + '-01');
                return {
                    month: date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                    }),
                    revenue: data.revenue,
                    registrations: data.registrations,
                    events: data.events,
                    averageRevenue:
                        data.events > 0 ? data.revenue / data.events : 0,
                    averageRegistrations:
                        data.events > 0 ? data.registrations / data.events : 0,
                };
            })
            .sort(
                (a, b) =>
                    new Date(a.month + ' 1').getTime() -
                    new Date(b.month + ' 1').getTime()
            );
    }, [events]);

    // Calculate trend metrics
    const trendMetrics = useMemo((): TrendMetric[] => {
        if (monthlyPerformance.length < 2) return [];

        const current = monthlyPerformance[monthlyPerformance.length - 1];
        const previous = monthlyPerformance[monthlyPerformance.length - 2];

        const revenueChange =
            previous.revenue > 0
                ? ((current.revenue - previous.revenue) / previous.revenue) *
                  100
                : 0;

        const registrationChange =
            previous.registrations > 0
                ? ((current.registrations - previous.registrations) /
                      previous.registrations) *
                  100
                : 0;

        const eventCountChange =
            previous.events > 0
                ? ((current.events - previous.events) / previous.events) * 100
                : 0;

        const avgRevenueChange =
            previous.averageRevenue > 0
                ? ((current.averageRevenue - previous.averageRevenue) /
                      previous.averageRevenue) *
                  100
                : 0;

        return [
            {
                label: 'Revenue Trend',
                value: formatCurrency(current.revenue),
                change: revenueChange,
                trend:
                    revenueChange > 5
                        ? 'up'
                        : revenueChange < -5
                          ? 'down'
                          : 'neutral',
                icon: <TrendingUp className='h-4 w-4' />,
                color:
                    revenueChange > 5
                        ? 'text-green-600'
                        : revenueChange < -5
                          ? 'text-red-600'
                          : 'text-gray-600',
            },
            {
                label: 'Registration Trend',
                value: formatNumber(current.registrations),
                change: registrationChange,
                trend:
                    registrationChange > 5
                        ? 'up'
                        : registrationChange < -5
                          ? 'down'
                          : 'neutral',
                icon: <Target className='h-4 w-4' />,
                color:
                    registrationChange > 5
                        ? 'text-green-600'
                        : registrationChange < -5
                          ? 'text-red-600'
                          : 'text-gray-600',
            },
            {
                label: 'Event Count',
                value: formatNumber(current.events),
                change: eventCountChange,
                trend:
                    eventCountChange > 0
                        ? 'up'
                        : eventCountChange < 0
                          ? 'down'
                          : 'neutral',
                icon: <Calendar className='h-4 w-4' />,
                color:
                    eventCountChange > 0
                        ? 'text-green-600'
                        : eventCountChange < 0
                          ? 'text-red-600'
                          : 'text-gray-600',
            },
            {
                label: 'Avg Revenue/Event',
                value: formatCurrency(current.averageRevenue),
                change: avgRevenueChange,
                trend:
                    avgRevenueChange > 5
                        ? 'up'
                        : avgRevenueChange < -5
                          ? 'down'
                          : 'neutral',
                icon: <BarChart3 className='h-4 w-4' />,
                color:
                    avgRevenueChange > 5
                        ? 'text-green-600'
                        : avgRevenueChange < -5
                          ? 'text-red-600'
                          : 'text-gray-600',
            },
        ];
    }, [monthlyPerformance]);

    // Prepare monthly revenue trend chart data
    const monthlyRevenueChartData = useMemo(() => {
        if (monthlyPerformance.length === 0) return null;

        const colors = getChartColors(isDark);

        return {
            labels: monthlyPerformance.map((data) => data.month),
            datasets: [
                {
                    label: 'Total Revenue',
                    data: monthlyPerformance.map((data) => data.revenue),
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '20',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y',
                },
                {
                    label: 'Average Revenue per Event',
                    data: monthlyPerformance.map((data) => data.averageRevenue),
                    borderColor: colors.secondary,
                    backgroundColor: colors.secondary + '20',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y',
                },
            ],
        };
    }, [monthlyPerformance, isDark]);

    // Prepare monthly registrations chart data
    const monthlyRegistrationsChartData = useMemo(() => {
        if (monthlyPerformance.length === 0) return null;

        const colors = getChartColors(isDark);

        return {
            labels: monthlyPerformance.map((data) => data.month),
            datasets: [
                {
                    label: 'Total Registrations',
                    data: monthlyPerformance.map((data) => data.registrations),
                    backgroundColor: colors.primary + '80',
                    borderColor: colors.primary,
                    borderWidth: 1,
                },
                {
                    label: 'Events Count',
                    data: monthlyPerformance.map((data) => data.events),
                    backgroundColor: colors.secondary + '80',
                    borderColor: colors.secondary,
                    borderWidth: 1,
                    yAxisID: 'y1',
                },
            ],
        };
    }, [monthlyPerformance, isDark]);

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
                        text: 'Revenue ($)',
                        color: getChartColors(isDark).muted,
                    },
                    ticks: {
                        ...baseOptions.scales?.y?.ticks,
                        callback: function (value: any) {
                            return formatCurrency(value);
                        },
                    },
                },
            },
        };
    }, [isDark]);

    const barChartOptions = useMemo(() => {
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
                        text: 'Events Count',
                        color: getChartColors(isDark).muted,
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: getChartColors(isDark).muted,
                        stepSize: 1,
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

    if (!events || events.length === 0) {
        return (
            <div className={`py-8 text-center ${className}`}>
                <BarChart3 className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p className='text-muted-foreground'>
                    No event data available for trend analysis.
                </p>
                <p className='mt-2 text-xs text-muted-foreground'>
                    Trends will appear once you have events with historical
                    data.
                </p>
            </div>
        );
    }

    if (monthlyPerformance.length < 2) {
        return (
            <div className={`py-8 text-center ${className}`}>
                <Activity className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <p className='text-muted-foreground'>
                    Insufficient data for trend analysis.
                </p>
                <p className='mt-2 text-xs text-muted-foreground'>
                    At least 2 months of event data are needed to show trends.
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Trend Metrics */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {trendMetrics.map((metric, index) => (
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
                            <div className='flex items-center text-xs text-muted-foreground'>
                                {metric.trend === 'up' && (
                                    <TrendingUp className='mr-1 h-3 w-3 text-green-500' />
                                )}
                                {metric.trend === 'down' && (
                                    <TrendingDown className='mr-1 h-3 w-3 text-red-500' />
                                )}
                                {metric.trend === 'neutral' && (
                                    <Activity className='mr-1 h-3 w-3 text-gray-500' />
                                )}
                                <span
                                    className={
                                        metric.change > 0
                                            ? 'text-green-600'
                                            : metric.change < 0
                                              ? 'text-red-600'
                                              : 'text-gray-600'
                                    }
                                >
                                    {metric.change > 0 ? '+' : ''}
                                    {metric.change.toFixed(1)}%
                                </span>
                                <span className='ml-1'>vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Trend Charts */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Revenue Trends */}
                {monthlyRevenueChartData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <TrendingUp className='h-5 w-5' />
                                Revenue Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: 300 }}>
                                <Line
                                    data={monthlyRevenueChartData}
                                    options={chartOptions}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Registration and Event Count Trends */}
                {monthlyRegistrationsChartData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <BarChart3 className='h-5 w-5' />
                                Activity Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: 300 }}>
                                <Bar
                                    data={monthlyRegistrationsChartData}
                                    options={barChartOptions}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Monthly Performance Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Calendar className='h-5 w-5' />
                        Monthly Performance Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-3'>
                        {monthlyPerformance
                            .slice(-6)
                            .reverse()
                            .map((month, index) => (
                                <div
                                    key={index}
                                    className='rounded-lg border p-4'
                                >
                                    <div className='mb-2 flex items-center justify-between'>
                                        <h4 className='font-medium'>
                                            {month.month}
                                        </h4>
                                        <Badge variant='outline'>
                                            {formatNumber(month.events)} events
                                        </Badge>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                                        <div>
                                            <span className='text-muted-foreground'>
                                                Total Revenue:
                                            </span>
                                            <div className='font-medium'>
                                                {formatCurrency(month.revenue)}
                                            </div>
                                        </div>
                                        <div>
                                            <span className='text-muted-foreground'>
                                                Registrations:
                                            </span>
                                            <div className='font-medium'>
                                                {formatNumber(
                                                    month.registrations
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className='text-muted-foreground'>
                                                Avg Revenue:
                                            </span>
                                            <div className='font-medium'>
                                                {formatCurrency(
                                                    month.averageRevenue
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className='text-muted-foreground'>
                                                Avg Registrations:
                                            </span>
                                            <div className='font-medium'>
                                                {formatNumber(
                                                    month.averageRegistrations
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PerformanceTrendsAnalysis;

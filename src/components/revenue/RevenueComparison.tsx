'use client';

import React, { useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import { MonthlyRevenue, EventRevenueBreakdown } from '@/lib/api';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '@/lib/utils/chartConfig';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getBaseChartOptions, getChartColors } from '@/lib/utils/chartConfig';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface RevenueComparisonProps {
    monthlyData: MonthlyRevenue[];
    eventData: EventRevenueBreakdown[];
    loading: boolean;
    isDark?: boolean;
}

export const RevenueComparison: React.FC<RevenueComparisonProps> = ({
    monthlyData,
    eventData,
    loading,
    isDark = false,
}) => {
    const [comparisonPeriod, setComparisonPeriod] = useState<
        'month' | 'quarter' | 'year'
    >('month');

    // Calculate period comparisons
    const periodComparisons = useMemo(() => {
        if (!monthlyData || monthlyData.length === 0) {
            return {
                currentPeriod: 0,
                previousPeriod: 0,
                growth: 0,
                isPositive: false,
            };
        }

        const sortedData = [...monthlyData].sort((a, b) => {
            const aDate = new Date(a.year || 0, (a.month || 1) - 1);
            const bDate = new Date(b.year || 0, (b.month || 1) - 1);
            return bDate.getTime() - aDate.getTime();
        });

        let currentPeriod = 0;
        let previousPeriod = 0;

        if (comparisonPeriod === 'month') {
            currentPeriod = sortedData[0]?.revenue || 0;
            previousPeriod = sortedData[1]?.revenue || 0;
        } else if (comparisonPeriod === 'quarter') {
            // Last 3 months vs previous 3 months
            currentPeriod = sortedData
                .slice(0, 3)
                .reduce((sum, month) => sum + (month.revenue || 0), 0);
            previousPeriod = sortedData
                .slice(3, 6)
                .reduce((sum, month) => sum + (month.revenue || 0), 0);
        } else if (comparisonPeriod === 'year') {
            // Last 12 months vs previous 12 months
            currentPeriod = sortedData
                .slice(0, 12)
                .reduce((sum, month) => sum + (month.revenue || 0), 0);
            previousPeriod = sortedData
                .slice(12, 24)
                .reduce((sum, month) => sum + (month.revenue || 0), 0);
        }

        const growth =
            previousPeriod > 0
                ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
                : 0;
        const isPositive = growth >= 0;

        return {
            currentPeriod,
            previousPeriod,
            growth,
            isPositive,
        };
    }, [monthlyData, comparisonPeriod]);

    // Top vs bottom performing events
    const eventPerformanceComparison = useMemo(() => {
        if (!eventData || eventData.length === 0) {
            return {
                topEvents: [],
                bottomEvents: [],
                averageRevenue: 0,
            };
        }

        const sortedEvents = [...eventData].sort(
            (a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)
        );
        const topEvents = sortedEvents.slice(0, 5);
        const bottomEvents = sortedEvents.slice(-5).reverse();
        const averageRevenue =
            eventData.reduce(
                (sum, event) => sum + (event.totalRevenue || 0),
                0
            ) / eventData.length;

        return {
            topEvents,
            bottomEvents,
            averageRevenue,
        };
    }, [eventData]);

    // Revenue distribution chart data
    const revenueDistributionData = useMemo(() => {
        if (!eventData || eventData.length === 0) return null;

        const colors = getChartColors(isDark);
        const topEvents = eventData
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
            .slice(0, 8);

        const otherRevenue = eventData
            .slice(8)
            .reduce((sum, event) => sum + (event.totalRevenue || 0), 0);

        const labels = [
            ...topEvents.map((event) => event.eventTitle || 'Untitled Event'),
        ];
        const data = [...topEvents.map((event) => event.totalRevenue || 0)];

        if (otherRevenue > 0) {
            labels.push('Other Events');
            data.push(otherRevenue);
        }

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: [
                        colors.primary,
                        colors.secondary,
                        colors.tertiary,
                        colors.quaternary,
                        colors.quinary,
                        colors.primary + '80',
                        colors.secondary + '80',
                        colors.tertiary + '80',
                        colors.muted,
                    ],
                    borderWidth: 2,
                    borderColor: colors.background,
                },
            ],
        };
    }, [eventData, isDark]);

    // Monthly comparison chart data
    const monthlyComparisonData = useMemo(() => {
        if (!monthlyData || monthlyData.length === 0) return null;

        const colors = getChartColors(isDark);
        const sortedData = [...monthlyData].sort((a, b) => {
            const aDate = new Date(a.year || 0, (a.month || 1) - 1);
            const bDate = new Date(b.year || 0, (b.month || 1) - 1);
            return aDate.getTime() - bDate.getTime();
        });

        const labels = sortedData.map(
            (month) => month.monthName || `${month.month}/${month.year}`
        );
        const revenueData = sortedData.map((month) => month.revenue || 0);
        const eventCountData = sortedData.map((month) => month.eventCount || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: colors.primary + '80',
                    borderColor: colors.primary,
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: 'Event Count',
                    data: eventCountData,
                    backgroundColor: colors.secondary + '80',
                    borderColor: colors.secondary,
                    borderWidth: 1,
                    yAxisID: 'y1',
                },
            ],
        };
    }, [monthlyData, isDark]);

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
                        callback: function (value: unknown) {
                            return formatCurrency(value as number);
                        },
                    },
                },
                y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                        display: true,
                        text: 'Event Count',
                        color: getChartColors(isDark).muted,
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: getChartColors(isDark).muted,
                    },
                },
            },
        };
    }, [isDark]);

    return (
        <div className='space-y-6'>
            {/* Period Comparison Controls */}
            <div className='flex items-center justify-between'>
                <div>
                    <h3 className='text-lg font-semibold'>
                        Revenue Comparison & Analysis
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                        Compare performance across different time periods and
                        events
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        variant={
                            comparisonPeriod === 'month' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setComparisonPeriod('month')}
                    >
                        Month
                    </Button>
                    <Button
                        variant={
                            comparisonPeriod === 'quarter'
                                ? 'default'
                                : 'outline'
                        }
                        size='sm'
                        onClick={() => setComparisonPeriod('quarter')}
                    >
                        Quarter
                    </Button>
                    <Button
                        variant={
                            comparisonPeriod === 'year' ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setComparisonPeriod('year')}
                    >
                        Year
                    </Button>
                </div>
            </div>

            {/* Period Comparison Cards */}
            <div className='grid gap-4 md:grid-cols-3'>
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            <Calendar className='mr-2 size-4' />
                            Current {comparisonPeriod}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <div className='text-2xl font-bold'>
                                {formatCurrency(
                                    periodComparisons.currentPeriod
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            <Activity className='mr-2 size-4' />
                            Previous {comparisonPeriod}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <div className='text-2xl font-bold'>
                                {formatCurrency(
                                    periodComparisons.previousPeriod
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            {periodComparisons.isPositive ? (
                                <TrendingUp className='mr-2 size-4 text-green-500' />
                            ) : (
                                <TrendingDown className='mr-2 size-4 text-red-500' />
                            )}
                            Growth Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div
                                    className={`text-2xl font-bold ${
                                        periodComparisons.isPositive
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                    }`}
                                >
                                    {periodComparisons.isPositive ? '+' : ''}
                                    {formatPercentage(periodComparisons.growth)}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    vs previous {comparisonPeriod}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Analysis */}
            <Tabs defaultValue='monthly' className='space-y-4'>
                <TabsList>
                    <TabsTrigger value='monthly'>Monthly Trends</TabsTrigger>
                    <TabsTrigger value='distribution'>
                        Revenue Distribution
                    </TabsTrigger>
                    <TabsTrigger value='performance'>
                        Event Performance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value='monthly'>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Monthly Revenue vs Event Count
                            </CardTitle>
                            <CardDescription>
                                Compare revenue trends with event activity
                                levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className='h-[400px] w-full' />
                            ) : monthlyComparisonData ? (
                                <div style={{ height: '400px' }}>
                                    <Bar
                                        data={monthlyComparisonData}
                                        options={chartOptions}
                                    />
                                </div>
                            ) : (
                                <div className='py-8 text-center text-muted-foreground'>
                                    No monthly data available for comparison
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value='distribution'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Distribution</CardTitle>
                                <CardDescription>
                                    Revenue breakdown by top performing events
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className='h-[300px] w-full' />
                                ) : revenueDistributionData ? (
                                    <div style={{ height: '300px' }}>
                                        <Doughnut
                                            data={revenueDistributionData}
                                            options={{
                                                ...getBaseChartOptions(isDark),
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    ...getBaseChartOptions(
                                                        isDark
                                                    ).plugins,
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: {
                                                            color: getChartColors(
                                                                isDark
                                                            ).foreground,
                                                            usePointStyle: true,
                                                            padding: 15,
                                                            font: {
                                                                size: 11,
                                                            },
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className='py-8 text-center text-muted-foreground'>
                                        No event data available for distribution
                                        analysis
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Insights</CardTitle>
                                <CardDescription>
                                    Key insights from revenue distribution
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className='space-y-3'>
                                        {[...Array(4)].map((_, i) => (
                                            <Skeleton
                                                key={i}
                                                className='h-4 w-full'
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        <div>
                                            <div className='text-sm font-medium'>
                                                Average Event Revenue
                                            </div>
                                            <div className='text-2xl font-bold'>
                                                {formatCurrency(
                                                    eventPerformanceComparison.averageRevenue
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className='mb-2 text-sm font-medium'>
                                                Top Performer
                                            </div>
                                            {eventPerformanceComparison
                                                .topEvents[0] ? (
                                                <div className='rounded-lg bg-muted p-3'>
                                                    <div className='text-sm font-medium'>
                                                        {
                                                            eventPerformanceComparison
                                                                .topEvents[0]
                                                                .eventTitle
                                                        }
                                                    </div>
                                                    <div className='text-lg font-bold text-green-600'>
                                                        {formatCurrency(
                                                            eventPerformanceComparison
                                                                .topEvents[0]
                                                                .totalRevenue ||
                                                                0
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='text-sm text-muted-foreground'>
                                                    No data available
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className='text-sm font-medium'>
                                                Revenue Concentration
                                            </div>
                                            <div className='text-sm text-muted-foreground'>
                                                Top 5 events generate{' '}
                                                {eventData &&
                                                eventData.length > 0 ? (
                                                    <span className='font-semibold'>
                                                        {formatPercentage(
                                                            (eventPerformanceComparison.topEvents.reduce(
                                                                (sum, event) =>
                                                                    sum +
                                                                    (event.totalRevenue ||
                                                                        0),
                                                                0
                                                            ) /
                                                                eventData.reduce(
                                                                    (
                                                                        sum,
                                                                        event
                                                                    ) =>
                                                                        sum +
                                                                        (event.totalRevenue ||
                                                                            0),
                                                                    0
                                                                )) *
                                                                100
                                                        )}
                                                    </span>
                                                ) : (
                                                    '0%'
                                                )}{' '}
                                                of total revenue
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value='performance'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Events</CardTitle>
                                <CardDescription>
                                    Events with highest revenue generation
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className='space-y-3'>
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center justify-between'
                                            >
                                                <Skeleton className='h-4 w-32' />
                                                <Skeleton className='h-4 w-20' />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        {eventPerformanceComparison.topEvents.map(
                                            (event, index) => (
                                                <div
                                                    key={event.eventId}
                                                    className='flex items-center justify-between'
                                                >
                                                    <div className='flex items-center gap-2'>
                                                        <Badge
                                                            variant='default'
                                                            className='flex size-6 items-center justify-center p-0 text-xs'
                                                        >
                                                            {index + 1}
                                                        </Badge>
                                                        <span className='truncate text-sm font-medium'>
                                                            {event.eventTitle}
                                                        </span>
                                                    </div>
                                                    <div className='text-right'>
                                                        <div className='text-sm font-semibold text-green-600'>
                                                            {formatCurrency(
                                                                event.totalRevenue ||
                                                                    0
                                                            )}
                                                        </div>
                                                        <div className='text-xs text-muted-foreground'>
                                                            {formatNumber(
                                                                event.totalRegistrations ||
                                                                    0
                                                            )}{' '}
                                                            registrations
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Underperforming Events</CardTitle>
                                <CardDescription>
                                    Events that may need attention or
                                    optimization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className='space-y-3'>
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className='flex items-center justify-between'
                                            >
                                                <Skeleton className='h-4 w-32' />
                                                <Skeleton className='h-4 w-20' />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        {eventPerformanceComparison.bottomEvents.map(
                                            (event, index) => (
                                                <div
                                                    key={event.eventId}
                                                    className='flex items-center justify-between'
                                                >
                                                    <div className='flex items-center gap-2'>
                                                        <Badge
                                                            variant='secondary'
                                                            className='flex size-6 items-center justify-center p-0 text-xs'
                                                        >
                                                            {eventData.length -
                                                                eventPerformanceComparison
                                                                    .bottomEvents
                                                                    .length +
                                                                index +
                                                                1}
                                                        </Badge>
                                                        <span className='truncate text-sm font-medium'>
                                                            {event.eventTitle}
                                                        </span>
                                                    </div>
                                                    <div className='text-right'>
                                                        <div className='text-sm font-semibold text-orange-600'>
                                                            {formatCurrency(
                                                                event.totalRevenue ||
                                                                    0
                                                            )}
                                                        </div>
                                                        <div className='text-xs text-muted-foreground'>
                                                            {formatNumber(
                                                                event.totalRegistrations ||
                                                                    0
                                                            )}{' '}
                                                            registrations
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RevenueComparison;

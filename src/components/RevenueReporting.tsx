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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    BarChart3,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { useOrganizerRevenue } from '@/hooks/useOrganizerRevenue';
import { RevenueChart } from '@/components/charts/RevenueChart';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '@/lib/utils/chartConfig';
import { MonthlyRevenueChart } from './revenue/MonthlyRevenueChart';
import { EventRevenueBreakdown } from './revenue/EventRevenueBreakdown';
import { RevenueComparison } from './revenue/RevenueComparison';
import { CustomReportGenerator } from './revenue/CustomReportGenerator';

interface RevenueReportingProps {
    className?: string;
    isDark?: boolean;
}

export const RevenueReporting: React.FC<RevenueReportingProps> = ({
    className = '',
    isDark = false,
}) => {
    const [dateRange, setDateRange] = useState<{
        startDate?: string;
        endDate?: string;
    }>({});

    const {
        monthlyRevenue,
        eventRevenue,
        revenueStatistics,
        loading,
        error,
        refetch,
        generateCustomReport,
    } = useOrganizerRevenue(dateRange);

    // Calculate growth indicators and trends
    const revenueMetrics = useMemo(() => {
        if (!revenueStatistics) return null;

        const monthlyGrowth =
            revenueStatistics.thisMonthRevenue &&
            revenueStatistics.lastMonthRevenue
                ? ((revenueStatistics.thisMonthRevenue -
                      revenueStatistics.lastMonthRevenue) /
                      revenueStatistics.lastMonthRevenue) *
                  100
                : 0;

        const totalPending = revenueStatistics.pendingRevenue || 0;
        const totalRefunded = revenueStatistics.refundedRevenue || 0;
        const netRevenue =
            (revenueStatistics.totalRevenue || 0) - totalRefunded;

        return {
            totalRevenue: revenueStatistics.totalRevenue || 0,
            thisMonthRevenue: revenueStatistics.thisMonthRevenue || 0,
            lastMonthRevenue: revenueStatistics.lastMonthRevenue || 0,
            pendingRevenue: totalPending,
            refundedRevenue: totalRefunded,
            netRevenue,
            monthlyGrowth,
            isGrowthPositive: monthlyGrowth >= 0,
        };
    }, [revenueStatistics]);

    const handleRefresh = () => {
        refetch();
    };

    const handleDateRangeChange = (startDate?: string, endDate?: string) => {
        setDateRange({ startDate, endDate });
    };

    if (error) {
        return (
            <div className={`space-y-4 ${className}`}>
                <Alert variant='destructive'>
                    <AlertCircle className='size-4' />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={handleRefresh} variant='outline'>
                    <RefreshCw className='mr-2 size-4' />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>
                        Revenue & Financial Reports
                    </h2>
                    <p className='text-muted-foreground'>
                        Comprehensive financial analytics and revenue insights
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        onClick={handleRefresh}
                        variant='outline'
                        size='sm'
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Revenue Overview Cards */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Revenue
                        </CardTitle>
                        <DollarSign className='size-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold'>
                                    {formatCurrency(
                                        revenueMetrics?.totalRevenue || 0
                                    )}
                                </div>
                                <p className='text-xs text-muted-foreground'>
                                    Net:{' '}
                                    {formatCurrency(
                                        revenueMetrics?.netRevenue || 0
                                    )}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            This Month
                        </CardTitle>
                        <Calendar className='size-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold'>
                                    {formatCurrency(
                                        revenueMetrics?.thisMonthRevenue || 0
                                    )}
                                </div>
                                {revenueMetrics && (
                                    <div className='flex items-center text-xs'>
                                        {revenueMetrics.isGrowthPositive ? (
                                            <TrendingUp className='mr-1 size-3 text-green-500' />
                                        ) : (
                                            <TrendingDown className='mr-1 size-3 text-red-500' />
                                        )}
                                        <span
                                            className={
                                                revenueMetrics.isGrowthPositive
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }
                                        >
                                            {formatPercentage(
                                                Math.abs(
                                                    revenueMetrics.monthlyGrowth
                                                )
                                            )}
                                        </span>
                                        <span className='ml-1 text-muted-foreground'>
                                            vs last month
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Pending Revenue
                        </CardTitle>
                        <BarChart3 className='size-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold'>
                                    {formatCurrency(
                                        revenueMetrics?.pendingRevenue || 0
                                    )}
                                </div>
                                <Badge variant='secondary' className='text-xs'>
                                    Awaiting Payment
                                </Badge>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Refunded
                        </CardTitle>
                        <TrendingDown className='size-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold text-red-500'>
                                    {formatCurrency(
                                        revenueMetrics?.refundedRevenue || 0
                                    )}
                                </div>
                                <p className='text-xs text-muted-foreground'>
                                    Total refunds issued
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue='overview' className='space-y-4'>
                <TabsList>
                    <TabsTrigger value='overview'>Overview</TabsTrigger>
                    <TabsTrigger value='monthly'>Monthly Trends</TabsTrigger>
                    <TabsTrigger value='events'>Event Breakdown</TabsTrigger>
                    <TabsTrigger value='comparison'>Comparison</TabsTrigger>
                    <TabsTrigger value='reports'>Custom Reports</TabsTrigger>
                </TabsList>

                <TabsContent value='overview' className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue Trends</CardTitle>
                                <CardDescription>
                                    Monthly revenue performance over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className='h-[300px] w-full' />
                                ) : (
                                    <RevenueChart
                                        data={monthlyRevenue}
                                        isDark={isDark}
                                        height={300}
                                        showEventCount={true}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Events</CardTitle>
                                <CardDescription>
                                    Events generating the highest revenue
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
                                        {eventRevenue
                                            .slice(0, 5)
                                            .map((event, index) => (
                                                <div
                                                    key={event.eventId}
                                                    className='flex items-center justify-between'
                                                >
                                                    <div className='flex items-center gap-2'>
                                                        <Badge
                                                            variant='outline'
                                                            className='flex size-6 items-center justify-center p-0 text-xs'
                                                        >
                                                            {index + 1}
                                                        </Badge>
                                                        <span className='truncate text-sm font-medium'>
                                                            {event.eventTitle}
                                                        </span>
                                                    </div>
                                                    <div className='text-right'>
                                                        <div className='text-sm font-semibold'>
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
                                            ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value='monthly'>
                    <MonthlyRevenueChart
                        data={monthlyRevenue}
                        loading={loading}
                        isDark={isDark}
                        onDateRangeChange={handleDateRangeChange}
                    />
                </TabsContent>

                <TabsContent value='events'>
                    <EventRevenueBreakdown
                        data={eventRevenue}
                        loading={loading}
                        isDark={isDark}
                    />
                </TabsContent>

                <TabsContent value='comparison'>
                    <RevenueComparison
                        monthlyData={monthlyRevenue}
                        eventData={eventRevenue}
                        loading={loading}
                        isDark={isDark}
                    />
                </TabsContent>

                <TabsContent value='reports'>
                    <CustomReportGenerator
                        onGenerateReport={generateCustomReport}
                        loading={loading}
                        revenueStatistics={revenueStatistics}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RevenueReporting;

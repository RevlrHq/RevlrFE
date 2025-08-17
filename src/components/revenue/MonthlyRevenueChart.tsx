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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Download, Filter } from 'lucide-react';
import { MonthlyRevenue } from '@/lib/api';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { formatCurrency, formatNumber } from '@/lib/utils/chartConfig';

interface MonthlyRevenueChartProps {
    data: MonthlyRevenue[];
    loading: boolean;
    isDark?: boolean;
    onDateRangeChange?: (startDate?: string, endDate?: string) => void;
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({
    data,
    loading,
    isDark = false,
    onDateRangeChange,
}) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalRevenue: 0,
                averageMonthlyRevenue: 0,
                totalEvents: 0,
                totalRegistrations: 0,
                bestMonth: null,
                worstMonth: null,
            };
        }

        const totalRevenue = data.reduce(
            (sum, month) => sum + (month.revenue || 0),
            0
        );
        const totalEvents = data.reduce(
            (sum, month) => sum + (month.eventCount || 0),
            0
        );
        const totalRegistrations = data.reduce(
            (sum, month) => sum + (month.registrationCount || 0),
            0
        );
        const averageMonthlyRevenue = totalRevenue / data.length;

        const sortedByRevenue = [...data].sort(
            (a, b) => (b.revenue || 0) - (a.revenue || 0)
        );
        const bestMonth = sortedByRevenue[0];
        const worstMonth = sortedByRevenue[sortedByRevenue.length - 1];

        return {
            totalRevenue,
            averageMonthlyRevenue,
            totalEvents,
            totalRegistrations,
            bestMonth,
            worstMonth,
        };
    }, [data]);

    const handleApplyFilters = () => {
        onDateRangeChange?.(startDate || undefined, endDate || undefined);
    };

    const handleClearFilters = () => {
        setStartDate('');
        setEndDate('');
        onDateRangeChange?.(undefined, undefined);
    };

    const handleExportData = () => {
        if (!data || data.length === 0) return;

        const csvContent = [
            [
                'Month',
                'Year',
                'Revenue',
                'Event Count',
                'Registration Count',
            ].join(','),
            ...data.map((month) =>
                [
                    month.monthName || month.month,
                    month.year,
                    month.revenue || 0,
                    month.eventCount || 0,
                    month.registrationCount || 0,
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `monthly-revenue-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className='space-y-4'>
            {/* Controls */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className='mr-2 h-4 w-4' />
                        Filters
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleExportData}
                        disabled={loading || !data || data.length === 0}
                    >
                        <Download className='mr-2 h-4 w-4' />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Date Range Filters */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Date Range Filter
                        </CardTitle>
                        <CardDescription>
                            Filter revenue data by specific date range
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <div className='space-y-2'>
                                <Label htmlFor='start-date'>Start Date</Label>
                                <Input
                                    id='start-date'
                                    type='date'
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='end-date'>End Date</Label>
                                <Input
                                    id='end-date'
                                    type='date'
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='mt-4 flex items-center gap-2'>
                            <Button onClick={handleApplyFilters} size='sm'>
                                Apply Filters
                            </Button>
                            <Button
                                onClick={handleClearFilters}
                                variant='outline'
                                size='sm'
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary Statistics */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <div className='text-2xl font-bold'>
                                {formatCurrency(summaryStats.totalRevenue)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Average Monthly
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <div className='text-2xl font-bold'>
                                {formatCurrency(
                                    summaryStats.averageMonthlyRevenue
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Best Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : summaryStats.bestMonth ? (
                            <>
                                <div className='text-lg font-bold'>
                                    {summaryStats.bestMonth.monthName}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                    {formatCurrency(
                                        summaryStats.bestMonth.revenue || 0
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className='text-sm text-muted-foreground'>
                                No data
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <div className='text-2xl font-bold'>
                                {formatNumber(summaryStats.totalEvents)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Revenue Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Revenue Trends</CardTitle>
                    <CardDescription>
                        Revenue and event count trends over time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <Skeleton className='h-[400px] w-full' />
                    ) : (
                        <RevenueChart
                            data={data}
                            isDark={isDark}
                            height={400}
                            showEventCount={true}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Monthly Breakdown Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                    <CardDescription>
                        Detailed monthly revenue and performance data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='space-y-3'>
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className='flex items-center justify-between'
                                >
                                    <Skeleton className='h-4 w-24' />
                                    <Skeleton className='h-4 w-20' />
                                    <Skeleton className='h-4 w-16' />
                                    <Skeleton className='h-4 w-20' />
                                </div>
                            ))}
                        </div>
                    ) : data && data.length > 0 ? (
                        <div className='overflow-x-auto'>
                            <table className='w-full'>
                                <thead>
                                    <tr className='border-b'>
                                        <th className='py-2 text-left'>
                                            Month
                                        </th>
                                        <th className='py-2 text-right'>
                                            Revenue
                                        </th>
                                        <th className='py-2 text-right'>
                                            Events
                                        </th>
                                        <th className='py-2 text-right'>
                                            Registrations
                                        </th>
                                        <th className='py-2 text-right'>
                                            Avg per Event
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((month, index) => {
                                        const avgPerEvent =
                                            month.eventCount &&
                                            month.eventCount > 0
                                                ? (month.revenue || 0) /
                                                  month.eventCount
                                                : 0;

                                        return (
                                            <tr
                                                key={index}
                                                className='border-b'
                                            >
                                                <td className='py-2 font-medium'>
                                                    {month.monthName}{' '}
                                                    {month.year}
                                                </td>
                                                <td className='py-2 text-right'>
                                                    {formatCurrency(
                                                        month.revenue || 0
                                                    )}
                                                </td>
                                                <td className='py-2 text-right'>
                                                    {formatNumber(
                                                        month.eventCount || 0
                                                    )}
                                                </td>
                                                <td className='py-2 text-right'>
                                                    {formatNumber(
                                                        month.registrationCount ||
                                                            0
                                                    )}
                                                </td>
                                                <td className='py-2 text-right'>
                                                    {formatCurrency(
                                                        avgPerEvent
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className='py-8 text-center text-muted-foreground'>
                            No monthly revenue data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default MonthlyRevenueChart;

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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Search,
    Download,
    SortAsc,
    SortDesc,
    DollarSign,
    Users,
    Clock,
    TrendingUp,
} from 'lucide-react';
import { EventRevenueBreakdown as EventRevenueData } from '@/lib/api';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '@/lib/utils/chartConfig';

interface EventRevenueBreakdownProps {
    data: EventRevenueData[];
    loading: boolean;
    isDark?: boolean;
}

type SortField =
    | 'title'
    | 'totalRevenue'
    | 'paidRevenue'
    | 'totalRegistrations'
    | 'conversionRate';
type SortOrder = 'asc' | 'desc';

export const EventRevenueBreakdown: React.FC<EventRevenueBreakdownProps> = ({
    data,
    loading,
    // isDark = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('totalRevenue');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Filter and sort data
    const processedData = useMemo(() => {
        if (!data) return [];

        const filtered = data.filter((event) =>
            event.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filtered.sort((a, b) => {
            let aValue: number | string = 0;
            let bValue: number | string = 0;

            switch (sortField) {
                case 'title':
                    aValue = a.eventTitle || '';
                    bValue = b.eventTitle || '';
                    break;
                case 'totalRevenue':
                    aValue = a.totalRevenue || 0;
                    bValue = b.totalRevenue || 0;
                    break;
                case 'paidRevenue':
                    aValue = a.paidRevenue || 0;
                    bValue = b.paidRevenue || 0;
                    break;
                case 'totalRegistrations':
                    aValue = a.totalRegistrations || 0;
                    bValue = b.totalRegistrations || 0;
                    break;
                case 'conversionRate':
                    aValue =
                        ((a.paidRegistrations || 0) /
                            (a.totalRegistrations || 1)) *
                        100;
                    bValue =
                        ((b.paidRegistrations || 0) /
                            (b.totalRegistrations || 1)) *
                        100;
                    break;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return sortOrder === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        });

        return filtered;
    }, [data, searchTerm, sortField, sortOrder]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                totalRevenue: 0,
                totalPaidRevenue: 0,
                totalPendingRevenue: 0,
                totalRegistrations: 0,
                totalPaidRegistrations: 0,
                averageConversionRate: 0,
                topPerformingEvent: null,
            };
        }

        const totalRevenue = data.reduce(
            (sum, event) => sum + (event.totalRevenue || 0),
            0
        );
        const totalPaidRevenue = data.reduce(
            (sum, event) => sum + (event.paidRevenue || 0),
            0
        );
        const totalPendingRevenue = data.reduce(
            (sum, event) => sum + (event.pendingRevenue || 0),
            0
        );
        const totalRegistrations = data.reduce(
            (sum, event) => sum + (event.totalRegistrations || 0),
            0
        );
        const totalPaidRegistrations = data.reduce(
            (sum, event) => sum + (event.paidRegistrations || 0),
            0
        );

        const averageConversionRate =
            totalRegistrations > 0
                ? (totalPaidRegistrations / totalRegistrations) * 100
                : 0;

        const topPerformingEvent = [...data].sort(
            (a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)
        )[0];

        return {
            totalRevenue,
            totalPaidRevenue,
            totalPendingRevenue,
            totalRegistrations,
            totalPaidRegistrations,
            averageConversionRate,
            topPerformingEvent,
        };
    }, [data]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleExportData = () => {
        if (!processedData || processedData.length === 0) return;

        const csvContent = [
            [
                'Event Title',
                'Total Revenue',
                'Paid Revenue',
                'Pending Revenue',
                'Total Registrations',
                'Paid Registrations',
                'Pending Registrations',
                'Conversion Rate',
            ].join(','),
            ...processedData.map((event) => {
                const conversionRate =
                    ((event.paidRegistrations || 0) /
                        (event.totalRegistrations || 1)) *
                    100;
                return [
                    `"${event.eventTitle || ''}"`,
                    event.totalRevenue || 0,
                    event.paidRevenue || 0,
                    event.pendingRevenue || 0,
                    event.totalRegistrations || 0,
                    event.paidRegistrations || 0,
                    event.pendingRegistrations || 0,
                    conversionRate.toFixed(2),
                ].join(',');
            }),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-revenue-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const SortButton: React.FC<{
        field: SortField;
        children: React.ReactNode;
    }> = ({ field, children }) => (
        <Button
            variant='ghost'
            size='sm'
            onClick={() => handleSort(field)}
            className='h-auto p-1 font-medium'
        >
            {children}
            {sortField === field &&
                (sortOrder === 'asc' ? (
                    <SortAsc className='ml-1 size-3' />
                ) : (
                    <SortDesc className='ml-1 size-3' />
                ))}
        </Button>
    );

    return (
        <div className='space-y-4'>
            {/* Controls */}
            <div className='flex items-center justify-between gap-4'>
                <div className='relative max-w-sm flex-1'>
                    <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        placeholder='Search events...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                    />
                </div>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={handleExportData}
                    disabled={
                        loading || !processedData || processedData.length === 0
                    }
                >
                    <Download className='mr-2 size-4' />
                    Export CSV
                </Button>
            </div>

            {/* Summary Statistics */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            <DollarSign className='mr-2 size-4' />
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold'>
                                    {formatCurrency(summaryStats.totalRevenue)}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    Paid:{' '}
                                    {formatCurrency(
                                        summaryStats.totalPaidRevenue
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            <Clock className='mr-2 size-4' />
                            Pending Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold text-orange-500'>
                                    {formatCurrency(
                                        summaryStats.totalPendingRevenue
                                    )}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    {formatPercentage(
                                        (summaryStats.totalPendingRevenue /
                                            summaryStats.totalRevenue) *
                                            100
                                    )}{' '}
                                    of total
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            <Users className='mr-2 size-4' />
                            Total Registrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold'>
                                    {formatNumber(
                                        summaryStats.totalRegistrations
                                    )}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    Paid:{' '}
                                    {formatNumber(
                                        summaryStats.totalPaidRegistrations
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='flex items-center text-sm font-medium'>
                            <TrendingUp className='mr-2 size-4' />
                            Avg Conversion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className='h-8 w-24' />
                        ) : (
                            <>
                                <div className='text-2xl font-bold'>
                                    {formatPercentage(
                                        summaryStats.averageConversionRate
                                    )}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                    Registration to payment
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Event Revenue Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Event Revenue Breakdown</CardTitle>
                    <CardDescription>
                        Detailed revenue analysis for each event
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='space-y-3'>
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className='flex items-center justify-between'
                                >
                                    <Skeleton className='h-4 w-48' />
                                    <Skeleton className='h-4 w-20' />
                                    <Skeleton className='h-4 w-16' />
                                    <Skeleton className='h-4 w-20' />
                                </div>
                            ))}
                        </div>
                    ) : processedData && processedData.length > 0 ? (
                        <div className='overflow-x-auto'>
                            <table className='w-full'>
                                <thead>
                                    <tr className='border-b'>
                                        <th className='py-2 text-left'>
                                            <SortButton field='title'>
                                                Event Title
                                            </SortButton>
                                        </th>
                                        <th className='py-2 text-right'>
                                            <SortButton field='totalRevenue'>
                                                Total Revenue
                                            </SortButton>
                                        </th>
                                        <th className='py-2 text-right'>
                                            <SortButton field='paidRevenue'>
                                                Paid Revenue
                                            </SortButton>
                                        </th>
                                        <th className='py-2 text-right'>
                                            <SortButton field='totalRegistrations'>
                                                Registrations
                                            </SortButton>
                                        </th>
                                        <th className='py-2 text-right'>
                                            <SortButton field='conversionRate'>
                                                Conversion
                                            </SortButton>
                                        </th>
                                        <th className='py-2 text-center'>
                                            Payment Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedData.map((event, index) => {
                                        const conversionRate =
                                            ((event.paidRegistrations || 0) /
                                                (event.totalRegistrations ||
                                                    1)) *
                                            100;
                                        const paymentProgress =
                                            ((event.paidRevenue || 0) /
                                                (event.totalRevenue || 1)) *
                                            100;

                                        return (
                                            <tr
                                                key={event.eventId || index}
                                                className='border-b hover:bg-muted/50'
                                            >
                                                <td className='py-3'>
                                                    <div className='font-medium'>
                                                        {event.eventTitle}
                                                    </div>
                                                    <div className='text-xs text-muted-foreground'>
                                                        ID: {event.eventId}
                                                    </div>
                                                </td>
                                                <td className='py-3 text-right font-semibold'>
                                                    {formatCurrency(
                                                        event.totalRevenue || 0
                                                    )}
                                                </td>
                                                <td className='py-3 text-right'>
                                                    <div className='font-medium text-green-600'>
                                                        {formatCurrency(
                                                            event.paidRevenue ||
                                                                0
                                                        )}
                                                    </div>
                                                    {(event.pendingRevenue ||
                                                        0) > 0 && (
                                                        <div className='text-xs text-orange-500'>
                                                            +
                                                            {formatCurrency(
                                                                event.pendingRevenue ||
                                                                    0
                                                            )}{' '}
                                                            pending
                                                        </div>
                                                    )}
                                                </td>
                                                <td className='py-3 text-right'>
                                                    <div className='font-medium'>
                                                        {formatNumber(
                                                            event.totalRegistrations ||
                                                                0
                                                        )}
                                                    </div>
                                                    <div className='text-xs text-muted-foreground'>
                                                        {formatNumber(
                                                            event.paidRegistrations ||
                                                                0
                                                        )}{' '}
                                                        paid
                                                    </div>
                                                </td>
                                                <td className='py-3 text-right'>
                                                    <Badge
                                                        variant={
                                                            conversionRate >= 80
                                                                ? 'default'
                                                                : conversionRate >=
                                                                    60
                                                                  ? 'secondary'
                                                                  : 'destructive'
                                                        }
                                                        className='text-xs'
                                                    >
                                                        {formatPercentage(
                                                            conversionRate
                                                        )}
                                                    </Badge>
                                                </td>
                                                <td className='py-3 text-center'>
                                                    <div className='mx-auto w-full max-w-[100px]'>
                                                        <Progress
                                                            value={
                                                                paymentProgress
                                                            }
                                                            className='h-2'
                                                        />
                                                        <div className='mt-1 text-xs text-muted-foreground'>
                                                            {formatPercentage(
                                                                paymentProgress
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className='py-8 text-center text-muted-foreground'>
                            {searchTerm
                                ? 'No events found matching your search'
                                : 'No event revenue data available'}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default EventRevenueBreakdown;

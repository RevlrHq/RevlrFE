'use client';

import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    FileText,
    Download,
    Calendar,
    DollarSign,
    BarChart3,
    Clock,
    CheckCircle,
} from 'lucide-react';
import { OrganizerRevenueReportRequest, RevenueStatistics } from '@/lib/api';
import { formatCurrency } from '@/lib/utils/chartConfig';

interface CustomReportGeneratorProps {
    onGenerateReport: (request: OrganizerRevenueReportRequest) => Promise<void>;
    loading: boolean;
    revenueStatistics: RevenueStatistics | null;
}

export const CustomReportGenerator: React.FC<CustomReportGeneratorProps> = ({
    onGenerateReport,
    loading,
    revenueStatistics,
}) => {
    const [reportConfig, setReportConfig] =
        useState<OrganizerRevenueReportRequest>({
            startDate: '',
            endDate: '',
            eventId: '',
            includeMonthlyBreakdown: true,
            includeEventBreakdown: true,
            includePendingPayments: true,
        });

    const [isGenerating, setIsGenerating] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);

    const handleInputChange = (
        field: keyof OrganizerRevenueReportRequest,
        value: string | boolean
    ) => {
        setReportConfig((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setReportGenerated(false);

        try {
            // Clean up the request - remove empty strings
            const cleanRequest: OrganizerRevenueReportRequest = {
                ...reportConfig,
                startDate: reportConfig.startDate || null,
                endDate: reportConfig.endDate || null,
                eventId: reportConfig.eventId || null,
            };

            await onGenerateReport(cleanRequest);
            setReportGenerated(true);
        } catch (error) {
            console.debug('Failed to generate report:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportReport = () => {
        if (!revenueStatistics) return;

        // Create comprehensive CSV report
        const csvContent = [
            ['Revenue Report Generated:', new Date().toISOString()],
            [''],
            ['Summary Statistics'],
            ['Total Revenue', revenueStatistics.totalRevenue || 0],
            ['This Month Revenue', revenueStatistics.thisMonthRevenue || 0],
            ['Last Month Revenue', revenueStatistics.lastMonthRevenue || 0],
            ['Pending Revenue', revenueStatistics.pendingRevenue || 0],
            ['Refunded Revenue', revenueStatistics.refundedRevenue || 0],
            [''],
        ];

        if (
            revenueStatistics.monthlyBreakdown &&
            revenueStatistics.monthlyBreakdown.length > 0
        ) {
            csvContent.push(
                ['Monthly Breakdown'],
                [
                    'Month',
                    'Year',
                    'Revenue',
                    'Event Count',
                    'Registration Count',
                ],
                ...revenueStatistics.monthlyBreakdown.map((month) => [
                    month.monthName || month.month,
                    month.year,
                    month.revenue || 0,
                    month.eventCount || 0,
                    month.registrationCount || 0,
                ])
            );
            csvContent.push(['']);
        }

        if (
            revenueStatistics.eventBreakdown &&
            revenueStatistics.eventBreakdown.length > 0
        ) {
            csvContent.push(
                ['Event Breakdown'],
                [
                    'Event ID',
                    'Event Title',
                    'Total Revenue',
                    'Paid Revenue',
                    'Pending Revenue',
                    'Total Registrations',
                    'Paid Registrations',
                ],
                ...revenueStatistics.eventBreakdown.map((event) => [
                    event.eventId,
                    `"${event.eventTitle || ''}"`,
                    event.totalRevenue || 0,
                    event.paidRevenue || 0,
                    event.pendingRevenue || 0,
                    event.totalRegistrations || 0,
                    event.paidRegistrations || 0,
                ])
            );
        }

        const csvString = csvContent.map((row) => row.join(',')).join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2'>
                {/* Report Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'>
                            <FileText className='mr-2 size-5' />
                            Custom Report Generator
                        </CardTitle>
                        <CardDescription>
                            Configure and generate detailed revenue reports with
                            custom parameters
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {/* Date Range */}
                        <div className='space-y-3'>
                            <Label className='text-sm font-medium'>
                                Date Range (Optional)
                            </Label>
                            <div className='grid gap-3 md:grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='report-start-date'
                                        className='text-xs text-muted-foreground'
                                    >
                                        Start Date
                                    </Label>
                                    <Input
                                        id='report-start-date'
                                        type='date'
                                        value={reportConfig.startDate || ''}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'startDate',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='report-end-date'
                                        className='text-xs text-muted-foreground'
                                    >
                                        End Date
                                    </Label>
                                    <Input
                                        id='report-end-date'
                                        type='date'
                                        value={reportConfig.endDate || ''}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'endDate',
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Event ID Filter */}
                        <div className='space-y-2'>
                            <Label
                                htmlFor='event-id'
                                className='text-sm font-medium'
                            >
                                Specific Event ID (Optional)
                            </Label>
                            <Input
                                id='event-id'
                                placeholder='Enter event ID to filter by specific event'
                                value={reportConfig.eventId || ''}
                                onChange={(e) =>
                                    handleInputChange('eventId', e.target.value)
                                }
                            />
                        </div>

                        {/* Report Options */}
                        <div className='space-y-3'>
                            <Label className='text-sm font-medium'>
                                Report Sections
                            </Label>
                            <div className='space-y-3'>
                                <div className='flex items-center space-x-2'>
                                    <Checkbox
                                        id='monthly-breakdown'
                                        checked={
                                            reportConfig.includeMonthlyBreakdown ||
                                            false
                                        }
                                        onCheckedChange={(checked) =>
                                            handleInputChange(
                                                'includeMonthlyBreakdown',
                                                checked as boolean
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor='monthly-breakdown'
                                        className='text-sm'
                                    >
                                        Include Monthly Breakdown
                                    </Label>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <Checkbox
                                        id='event-breakdown'
                                        checked={
                                            reportConfig.includeEventBreakdown ||
                                            false
                                        }
                                        onCheckedChange={(checked) =>
                                            handleInputChange(
                                                'includeEventBreakdown',
                                                checked as boolean
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor='event-breakdown'
                                        className='text-sm'
                                    >
                                        Include Event Breakdown
                                    </Label>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <Checkbox
                                        id='pending-payments'
                                        checked={
                                            reportConfig.includePendingPayments ||
                                            false
                                        }
                                        onCheckedChange={(checked) =>
                                            handleInputChange(
                                                'includePendingPayments',
                                                checked as boolean
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor='pending-payments'
                                        className='text-sm'
                                    >
                                        Include Pending Payments
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerateReport}
                            disabled={isGenerating || loading}
                            className='w-full'
                        >
                            {isGenerating ? (
                                <>
                                    <div className='mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <BarChart3 className='mr-2 size-4' />
                                    Generate Report
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Report Preview/Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'>
                            <DollarSign className='mr-2 size-5' />
                            Report Results
                        </CardTitle>
                        <CardDescription>
                            Generated report summary and export options
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading || isGenerating ? (
                            <div className='space-y-4'>
                                <Skeleton className='h-4 w-full' />
                                <Skeleton className='h-4 w-3/4' />
                                <Skeleton className='h-4 w-1/2' />
                                <Skeleton className='h-8 w-full' />
                            </div>
                        ) : reportGenerated && revenueStatistics ? (
                            <div className='space-y-4'>
                                <Alert>
                                    <CheckCircle className='size-4' />
                                    <AlertDescription>
                                        Report generated successfully! Review
                                        the summary below.
                                    </AlertDescription>
                                </Alert>

                                {/* Summary Statistics */}
                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm font-medium'>
                                            Total Revenue:
                                        </span>
                                        <Badge
                                            variant='default'
                                            className='text-sm'
                                        >
                                            {formatCurrency(
                                                revenueStatistics.totalRevenue ||
                                                    0
                                            )}
                                        </Badge>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm font-medium'>
                                            This Month:
                                        </span>
                                        <Badge
                                            variant='secondary'
                                            className='text-sm'
                                        >
                                            {formatCurrency(
                                                revenueStatistics.thisMonthRevenue ||
                                                    0
                                            )}
                                        </Badge>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm font-medium'>
                                            Pending:
                                        </span>
                                        <Badge
                                            variant='outline'
                                            className='text-sm'
                                        >
                                            {formatCurrency(
                                                revenueStatistics.pendingRevenue ||
                                                    0
                                            )}
                                        </Badge>
                                    </div>
                                    {revenueStatistics.refundedRevenue &&
                                        revenueStatistics.refundedRevenue >
                                            0 && (
                                            <div className='flex items-center justify-between'>
                                                <span className='text-sm font-medium'>
                                                    Refunded:
                                                </span>
                                                <Badge
                                                    variant='destructive'
                                                    className='text-sm'
                                                >
                                                    {formatCurrency(
                                                        revenueStatistics.refundedRevenue
                                                    )}
                                                </Badge>
                                            </div>
                                        )}
                                </div>

                                {/* Report Sections Included */}
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>
                                        Report Sections:
                                    </Label>
                                    <div className='flex flex-wrap gap-2'>
                                        {revenueStatistics.monthlyBreakdown && (
                                            <Badge
                                                variant='outline'
                                                className='text-xs'
                                            >
                                                Monthly Data (
                                                {
                                                    revenueStatistics
                                                        .monthlyBreakdown.length
                                                }{' '}
                                                months)
                                            </Badge>
                                        )}
                                        {revenueStatistics.eventBreakdown && (
                                            <Badge
                                                variant='outline'
                                                className='text-xs'
                                            >
                                                Event Data (
                                                {
                                                    revenueStatistics
                                                        .eventBreakdown.length
                                                }{' '}
                                                events)
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Export Button */}
                                <Button
                                    onClick={handleExportReport}
                                    variant='outline'
                                    className='w-full'
                                >
                                    <Download className='mr-2 size-4' />
                                    Export Report (CSV)
                                </Button>
                            </div>
                        ) : (
                            <div className='py-8 text-center'>
                                <FileText className='mx-auto mb-4 size-12 text-muted-foreground' />
                                <p className='text-sm text-muted-foreground'>
                                    Configure your report parameters and click
                                    "Generate Report" to create a custom revenue
                                    analysis.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Report Templates */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Report Templates</CardTitle>
                    <CardDescription>
                        Pre-configured report templates for common analysis
                        needs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='grid gap-3 md:grid-cols-3'>
                        <Button
                            variant='outline'
                            onClick={() => {
                                const lastMonth = new Date();
                                lastMonth.setMonth(lastMonth.getMonth() - 1);
                                const startOfLastMonth = new Date(
                                    lastMonth.getFullYear(),
                                    lastMonth.getMonth(),
                                    1
                                );
                                const endOfLastMonth = new Date(
                                    lastMonth.getFullYear(),
                                    lastMonth.getMonth() + 1,
                                    0
                                );

                                setReportConfig({
                                    startDate: startOfLastMonth
                                        .toISOString()
                                        .split('T')[0],
                                    endDate: endOfLastMonth
                                        .toISOString()
                                        .split('T')[0],
                                    eventId: null,
                                    includeMonthlyBreakdown: true,
                                    includeEventBreakdown: true,
                                    includePendingPayments: true,
                                });
                            }}
                            className='flex h-auto flex-col items-start p-4'
                        >
                            <Calendar className='mb-2 size-5' />
                            <div className='text-left'>
                                <div className='font-medium'>Last Month</div>
                                <div className='text-xs text-muted-foreground'>
                                    Complete previous month analysis
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant='outline'
                            onClick={() => {
                                const threeMonthsAgo = new Date();
                                threeMonthsAgo.setMonth(
                                    threeMonthsAgo.getMonth() - 3
                                );

                                setReportConfig({
                                    startDate: threeMonthsAgo
                                        .toISOString()
                                        .split('T')[0],
                                    endDate: new Date()
                                        .toISOString()
                                        .split('T')[0],
                                    eventId: null,
                                    includeMonthlyBreakdown: true,
                                    includeEventBreakdown: true,
                                    includePendingPayments: false,
                                });
                            }}
                            className='flex h-auto flex-col items-start p-4'
                        >
                            <BarChart3 className='mb-2 size-5' />
                            <div className='text-left'>
                                <div className='font-medium'>Quarterly</div>
                                <div className='text-xs text-muted-foreground'>
                                    Last 3 months performance
                                </div>
                            </div>
                        </Button>

                        <Button
                            variant='outline'
                            onClick={() => {
                                setReportConfig({
                                    startDate: null,
                                    endDate: null,
                                    eventId: null,
                                    includeMonthlyBreakdown: false,
                                    includeEventBreakdown: false,
                                    includePendingPayments: true,
                                });
                            }}
                            className='flex h-auto flex-col items-start p-4'
                        >
                            <Clock className='mb-2 size-5' />
                            <div className='text-left'>
                                <div className='font-medium'>Pending Only</div>
                                <div className='text-xs text-muted-foreground'>
                                    Focus on pending payments
                                </div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default CustomReportGenerator;

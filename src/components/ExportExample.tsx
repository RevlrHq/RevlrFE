'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExportModal, type ExportDataType } from '@/components/ExportModal';
import { useDataExport } from '@/hooks/useDataExport';
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';
import { useOrganizerRegistrations } from '@/hooks/useOrganizerRegistrations';
import { useOrganizerRevenue } from '@/hooks/useOrganizerRevenue';
import { getExportFields } from '@/lib/constants/exportFields';
import {
    Download,
    Calendar,
    Users,
    DollarSign,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ExportExample: React.FC = () => {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [currentExportType, setCurrentExportType] =
        useState<ExportDataType>('events');
    const { toast } = useToast();

    // Data hooks
    const {
        events,
        loading: eventsLoading,
        totalCount: eventsCount,
    } = useOrganizerEvents(50);
    const {
        registrations,
        loading: registrationsLoading,
        totalCount: registrationsCount,
    } = useOrganizerRegistrations(50);
    const {
        monthlyRevenue,
        eventRevenue,
        loading: revenueLoading,
    } = useOrganizerRevenue();

    // Export hook
    const {
        exportEvents,
        exportRegistrations,
        exportRevenue,
        isExporting,
        exportError,
    } = useDataExport({
        onExportStart: () => {
            toast({
                title: 'Export Started',
                description: 'Your data export is being prepared...',
            });
        },
        onExportComplete: (result) => {
            toast({
                title: 'Export Complete',
                description: `Successfully exported ${result.filename}`,
            });
        },
        onExportError: (error) => {
            toast({
                title: 'Export Failed',
                description: error,
                variant: 'destructive',
            });
        },
    });

    const handleExportClick = (dataType: ExportDataType) => {
        setCurrentExportType(dataType);
        setIsExportModalOpen(true);
    };

    const handleExport = async (options: Record<string, unknown>) => {
        try {
            switch (currentExportType) {
                case 'events':
                    await exportEvents(events, options);
                    break;
                case 'registrations':
                    await exportRegistrations(registrations, options);
                    break;
                case 'revenue':
                    // Use monthly revenue data, but could also use event revenue
                    await exportRevenue(monthlyRevenue, options);
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const exportCards = [
        {
            type: 'events' as ExportDataType,
            title: 'Events Export',
            description:
                'Export your event data including details, status, and performance metrics',
            icon: Calendar,
            data: events,
            loading: eventsLoading,
            count: eventsCount,
            color: 'bg-blue-500',
        },
        {
            type: 'registrations' as ExportDataType,
            title: 'Registrations Export',
            description:
                'Export attendee registration data and payment information',
            icon: Users,
            data: registrations,
            loading: registrationsLoading,
            count: registrationsCount,
            color: 'bg-green-500',
        },
        {
            type: 'revenue' as ExportDataType,
            title: 'Revenue Export',
            description: 'Export financial reports and revenue analytics',
            icon: DollarSign,
            data: [...monthlyRevenue, ...eventRevenue],
            loading: revenueLoading,
            count: monthlyRevenue.length + eventRevenue.length,
            color: 'bg-purple-500',
        },
    ];

    return (
        <div className='space-y-6'>
            <div>
                <h2 className='text-2xl font-bold tracking-tight'>
                    Data Export
                </h2>
                <p className='text-muted-foreground'>
                    Export your organizer data in various formats for analysis
                    and reporting.
                </p>
            </div>

            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {exportCards.map((card) => {
                    const Icon = card.icon;
                    const hasData = card.data && card.data.length > 0;

                    return (
                        <Card
                            key={card.type}
                            className='relative overflow-hidden'
                        >
                            <CardHeader className='pb-3'>
                                <div className='flex items-center justify-between'>
                                    <div
                                        className={`rounded-lg p-2 ${card.color} text-white`}
                                    >
                                        <Icon className='size-5' />
                                    </div>
                                    <Badge
                                        variant={
                                            hasData ? 'default' : 'secondary'
                                        }
                                    >
                                        {card.loading
                                            ? 'Loading...'
                                            : `${card.count || 0} records`}
                                    </Badge>
                                </div>
                                <CardTitle className='text-lg'>
                                    {card.title}
                                </CardTitle>
                                <CardDescription>
                                    {card.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-3'>
                                    {/* Data Status */}
                                    <div className='flex items-center gap-2 text-sm'>
                                        {hasData ? (
                                            <>
                                                <CheckCircle className='size-4 text-green-500' />
                                                <span className='text-green-700 dark:text-green-400'>
                                                    Data available
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className='size-4 text-amber-500' />
                                                <span className='text-amber-700 dark:text-amber-400'>
                                                    {card.loading
                                                        ? 'Loading data...'
                                                        : 'No data available'}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Export Button */}
                                    <Button
                                        onClick={() =>
                                            handleExportClick(card.type)
                                        }
                                        disabled={
                                            !hasData ||
                                            card.loading ||
                                            isExporting
                                        }
                                        className='w-full'
                                        variant={
                                            hasData ? 'default' : 'secondary'
                                        }
                                    >
                                        <Download className='mr-2 size-4' />
                                        {isExporting &&
                                        currentExportType === card.type
                                            ? 'Exporting...'
                                            : 'Export Data'}
                                    </Button>

                                    {/* Available Fields Preview */}
                                    {hasData && (
                                        <div className='text-xs text-muted-foreground'>
                                            <p className='mb-1 font-medium'>
                                                Available fields:
                                            </p>
                                            <div className='flex flex-wrap gap-1'>
                                                {getExportFields(card.type)
                                                    .slice(0, 3)
                                                    .map((field) => (
                                                        <Badge
                                                            key={field.key}
                                                            variant='outline'
                                                            className='text-xs'
                                                        >
                                                            {field.label}
                                                        </Badge>
                                                    ))}
                                                {getExportFields(card.type)
                                                    .length > 3 && (
                                                    <Badge
                                                        variant='outline'
                                                        className='text-xs'
                                                    >
                                                        +
                                                        {getExportFields(
                                                            card.type
                                                        ).length - 3}{' '}
                                                        more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Export Error Display */}
            {exportError && (
                <Card className='border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'>
                    <CardContent className='pt-6'>
                        <div className='flex items-center gap-2 text-red-800 dark:text-red-400'>
                            <AlertCircle className='size-4' />
                            <span className='font-medium'>Export Error</span>
                        </div>
                        <p className='mt-1 text-sm text-red-700 dark:text-red-300'>
                            {exportError}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                dataType={currentExportType}
                availableFields={getExportFields(currentExportType)}
                totalRecords={
                    currentExportType === 'events'
                        ? eventsCount
                        : currentExportType === 'registrations'
                          ? registrationsCount
                          : monthlyRevenue.length + eventRevenue.length
                }
            />
        </div>
    );
};

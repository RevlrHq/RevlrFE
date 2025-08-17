'use client';

import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
    Download,
    FileText,
    FileSpreadsheet,
    File,
    X,
    Calendar,
    Users,
    DollarSign,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExportFormat = 'csv' | 'pdf' | 'excel';
export type ExportDataType = 'events' | 'registrations' | 'revenue';

export interface ExportOptions {
    format: ExportFormat;
    dataType: ExportDataType;
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    includeFields: string[];
    filters?: Record<string, any>;
}

export interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<void>;
    dataType: ExportDataType;
    availableFields: Array<{
        key: string;
        label: string;
        description?: string;
        required?: boolean;
    }>;
    totalRecords?: number;
    className?: string;
}

const formatIcons = {
    csv: FileSpreadsheet,
    pdf: FileText,
    excel: File,
};

const dataTypeIcons = {
    events: Calendar,
    registrations: Users,
    revenue: DollarSign,
};

const dataTypeLabels = {
    events: 'Events',
    registrations: 'Registrations',
    revenue: 'Revenue Reports',
};

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    onExport,
    dataType,
    availableFields,
    totalRecords = 0,
    className,
}) => {
    const [format, setFormat] = useState<ExportFormat>('csv');
    const [includeFields, setIncludeFields] = useState<string[]>(
        availableFields
            .filter((field) => field.required)
            .map((field) => field.key)
    );
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatus, setExportStatus] = useState<
        'idle' | 'preparing' | 'exporting' | 'complete' | 'error'
    >('idle');
    const [exportError, setExportError] = useState<string | null>(null);

    const handleFieldToggle = useCallback(
        (fieldKey: string, checked: boolean) => {
            setIncludeFields((prev) => {
                if (checked) {
                    return [...prev, fieldKey];
                } else {
                    return prev.filter((key) => key !== fieldKey);
                }
            });
        },
        []
    );

    const handleSelectAll = useCallback(() => {
        setIncludeFields(availableFields.map((field) => field.key));
    }, [availableFields]);

    const handleSelectRequired = useCallback(() => {
        setIncludeFields(
            availableFields
                .filter((field) => field.required)
                .map((field) => field.key)
        );
    }, [availableFields]);

    const handleExport = useCallback(async () => {
        if (includeFields.length === 0) {
            setExportError('Please select at least one field to export');
            return;
        }

        setIsExporting(true);
        setExportProgress(0);
        setExportStatus('preparing');
        setExportError(null);

        try {
            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setExportProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            setExportStatus('exporting');

            const exportOptions: ExportOptions = {
                format,
                dataType,
                includeFields,
            };

            await onExport(exportOptions);

            clearInterval(progressInterval);
            setExportProgress(100);
            setExportStatus('complete');

            // Auto-close after successful export
            setTimeout(() => {
                onClose();
                resetState();
            }, 1500);
        } catch (error) {
            setExportStatus('error');
            setExportError(
                error instanceof Error ? error.message : 'Export failed'
            );
        } finally {
            setIsExporting(false);
        }
    }, [format, dataType, includeFields, onExport, onClose]);

    const resetState = useCallback(() => {
        setExportProgress(0);
        setExportStatus('idle');
        setExportError(null);
        setIsExporting(false);
    }, []);

    const handleClose = useCallback(() => {
        if (!isExporting) {
            onClose();
            resetState();
        }
    }, [isExporting, onClose, resetState]);

    const DataTypeIcon = dataTypeIcons[dataType];
    const selectedFormatIcon = formatIcons[format];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={cn('max-w-2xl', className)}>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <DataTypeIcon className='size-5' />
                        Export {dataTypeLabels[dataType]}
                    </DialogTitle>
                    <DialogDescription>
                        Export your {dataTypeLabels[dataType].toLowerCase()}{' '}
                        data in your preferred format.
                        {totalRecords > 0 &&
                            ` ${totalRecords} records available for export.`}
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-6'>
                    {/* Export Format Selection */}
                    <div className='space-y-3'>
                        <Label className='text-sm font-medium'>
                            Export Format
                        </Label>
                        <RadioGroup
                            value={format}
                            onValueChange={(value) =>
                                setFormat(value as ExportFormat)
                            }
                            className='grid grid-cols-3 gap-4'
                            disabled={isExporting}
                        >
                            {(['csv', 'pdf', 'excel'] as ExportFormat[]).map(
                                (formatOption) => {
                                    const Icon = formatIcons[formatOption];
                                    return (
                                        <div key={formatOption}>
                                            <RadioGroupItem
                                                value={formatOption}
                                                id={formatOption}
                                                className='peer sr-only'
                                            />
                                            <Label
                                                htmlFor={formatOption}
                                                className={cn(
                                                    'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary',
                                                    isExporting &&
                                                        'cursor-not-allowed opacity-50'
                                                )}
                                            >
                                                <Icon className='mb-2 size-6' />
                                                <span className='text-sm font-medium uppercase'>
                                                    {formatOption}
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                }
                            )}
                        </RadioGroup>
                    </div>

                    <Separator />

                    {/* Field Selection */}
                    <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                            <Label className='text-sm font-medium'>
                                Fields to Export
                            </Label>
                            <div className='flex gap-2'>
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={handleSelectRequired}
                                    disabled={isExporting}
                                >
                                    Required Only
                                </Button>
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={handleSelectAll}
                                    disabled={isExporting}
                                >
                                    Select All
                                </Button>
                            </div>
                        </div>

                        <div className='max-h-48 space-y-2 overflow-y-auto rounded-md border p-3'>
                            {availableFields.map((field) => {
                                const isChecked = includeFields.includes(
                                    field.key
                                );
                                const isRequired = field.required;

                                return (
                                    <div
                                        key={field.key}
                                        className='flex items-start space-x-2'
                                    >
                                        <Checkbox
                                            id={field.key}
                                            checked={isChecked}
                                            onCheckedChange={(checked) =>
                                                handleFieldToggle(
                                                    field.key,
                                                    checked as boolean
                                                )
                                            }
                                            disabled={isExporting || isRequired}
                                        />
                                        <div className='grid gap-1.5 leading-none'>
                                            <Label
                                                htmlFor={field.key}
                                                className={cn(
                                                    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                                                    isRequired && 'text-primary'
                                                )}
                                            >
                                                {field.label}
                                                {isRequired && ' *'}
                                            </Label>
                                            {field.description && (
                                                <p className='text-xs text-muted-foreground'>
                                                    {field.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className='text-xs text-muted-foreground'>
                            {includeFields.length} of {availableFields.length}{' '}
                            fields selected
                            {availableFields.some((f) => f.required) &&
                                ' (* Required fields)'}
                        </p>
                    </div>

                    {/* Export Progress */}
                    {isExporting && (
                        <div className='space-y-3'>
                            <Separator />
                            <div className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <Label className='text-sm font-medium'>
                                        Export Progress
                                    </Label>
                                    <span className='text-sm text-muted-foreground'>
                                        {exportProgress}%
                                    </span>
                                </div>
                                <Progress
                                    value={exportProgress}
                                    className='h-2'
                                />
                                <p className='text-xs text-muted-foreground'>
                                    {exportStatus === 'preparing' &&
                                        'Preparing export...'}
                                    {exportStatus === 'exporting' &&
                                        'Exporting data...'}
                                    {exportStatus === 'complete' &&
                                        'Export completed successfully!'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Export Status */}
                    {exportStatus === 'complete' && (
                        <div className='flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-400'>
                            <CheckCircle className='size-4' />
                            <span className='text-sm font-medium'>
                                Export completed successfully!
                            </span>
                        </div>
                    )}

                    {exportError && (
                        <div className='flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-400'>
                            <AlertCircle className='size-4' />
                            <span className='text-sm font-medium'>
                                {exportError}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={handleClose}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Exporting...' : 'Cancel'}
                    </Button>
                    <Button
                        type='button'
                        onClick={handleExport}
                        disabled={isExporting || includeFields.length === 0}
                        className='min-w-[120px]'
                    >
                        {isExporting ? (
                            <>
                                <div className='mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className='mr-2 size-4' />
                                Export{' '}
                                {selectedFormatIcon && (
                                    <selectedFormatIcon className='ml-1 size-4' />
                                )}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

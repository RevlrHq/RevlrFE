'use client';

import { useState, useCallback } from 'react';
import { ExportService, type ExportResult } from '@/lib/services/ExportService';
import type { ExportOptions, ExportDataType } from '@/components/ExportModal';
import type {
    EventSummaryView,
    EventRegistrationSummary,
    MonthlyRevenue,
    EventRevenueBreakdown,
} from '@/lib/api';

export interface UseDataExportOptions {
    onExportStart?: () => void;
    onExportComplete?: (result: ExportResult) => void;
    onExportError?: (error: string) => void;
}

export interface UseDataExportResult {
    isExporting: boolean;
    exportProgress: number;
    exportError: string | null;
    exportEvents: (
        events: EventSummaryView[],
        options: Omit<ExportOptions, 'dataType'>
    ) => Promise<ExportResult>;
    exportRegistrations: (
        registrations: EventRegistrationSummary[],
        options: Omit<ExportOptions, 'dataType'>
    ) => Promise<ExportResult>;
    exportRevenue: (
        revenueData: MonthlyRevenue[] | EventRevenueBreakdown[],
        options: Omit<ExportOptions, 'dataType'>
    ) => Promise<ExportResult>;
    exportData: (data: any[], options: ExportOptions) => Promise<ExportResult>;
    clearError: () => void;
}

export const useDataExport = (
    options?: UseDataExportOptions
): UseDataExportResult => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportError, setExportError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setExportError(null);
    }, []);

    const simulateProgress = useCallback(() => {
        setExportProgress(0);
        const interval = setInterval(() => {
            setExportProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + Math.random() * 20;
            });
        }, 100);
        return interval;
    }, []);

    const exportEvents = useCallback(
        async (
            events: EventSummaryView[],
            exportOptions: Omit<ExportOptions, 'dataType'>
        ): Promise<ExportResult> => {
            setIsExporting(true);
            setExportError(null);
            options?.onExportStart?.();

            const progressInterval = simulateProgress();

            try {
                const result = await ExportService.exportEvents(
                    events,
                    exportOptions
                );

                clearInterval(progressInterval);
                setExportProgress(100);

                if (result.success) {
                    options?.onExportComplete?.(result);
                } else {
                    setExportError(result.error || 'Export failed');
                    options?.onExportError?.(result.error || 'Export failed');
                }

                return result;
            } catch (error) {
                clearInterval(progressInterval);
                const errorMessage =
                    error instanceof Error ? error.message : 'Export failed';
                setExportError(errorMessage);
                options?.onExportError?.(errorMessage);

                return {
                    success: false,
                    filename: '',
                    error: errorMessage,
                };
            } finally {
                setIsExporting(false);
            }
        },
        [options, simulateProgress]
    );

    const exportRegistrations = useCallback(
        async (
            registrations: EventRegistrationSummary[],
            exportOptions: Omit<ExportOptions, 'dataType'>
        ): Promise<ExportResult> => {
            setIsExporting(true);
            setExportError(null);
            options?.onExportStart?.();

            const progressInterval = simulateProgress();

            try {
                const result = await ExportService.exportRegistrations(
                    registrations,
                    exportOptions
                );

                clearInterval(progressInterval);
                setExportProgress(100);

                if (result.success) {
                    options?.onExportComplete?.(result);
                } else {
                    setExportError(result.error || 'Export failed');
                    options?.onExportError?.(result.error || 'Export failed');
                }

                return result;
            } catch (error) {
                clearInterval(progressInterval);
                const errorMessage =
                    error instanceof Error ? error.message : 'Export failed';
                setExportError(errorMessage);
                options?.onExportError?.(errorMessage);

                return {
                    success: false,
                    filename: '',
                    error: errorMessage,
                };
            } finally {
                setIsExporting(false);
            }
        },
        [options, simulateProgress]
    );

    const exportRevenue = useCallback(
        async (
            revenueData: MonthlyRevenue[] | EventRevenueBreakdown[],
            exportOptions: Omit<ExportOptions, 'dataType'>
        ): Promise<ExportResult> => {
            setIsExporting(true);
            setExportError(null);
            options?.onExportStart?.();

            const progressInterval = simulateProgress();

            try {
                const result = await ExportService.exportRevenue(
                    revenueData,
                    exportOptions
                );

                clearInterval(progressInterval);
                setExportProgress(100);

                if (result.success) {
                    options?.onExportComplete?.(result);
                } else {
                    setExportError(result.error || 'Export failed');
                    options?.onExportError?.(result.error || 'Export failed');
                }

                return result;
            } catch (error) {
                clearInterval(progressInterval);
                const errorMessage =
                    error instanceof Error ? error.message : 'Export failed';
                setExportError(errorMessage);
                options?.onExportError?.(errorMessage);

                return {
                    success: false,
                    filename: '',
                    error: errorMessage,
                };
            } finally {
                setIsExporting(false);
            }
        },
        [options, simulateProgress]
    );

    const exportData = useCallback(
        async (
            data: any[],
            exportOptions: ExportOptions
        ): Promise<ExportResult> => {
            setIsExporting(true);
            setExportError(null);
            options?.onExportStart?.();

            const progressInterval = simulateProgress();

            try {
                const result = await ExportService.exportData(
                    data,
                    exportOptions
                );

                clearInterval(progressInterval);
                setExportProgress(100);

                if (result.success) {
                    options?.onExportComplete?.(result);
                } else {
                    setExportError(result.error || 'Export failed');
                    options?.onExportError?.(result.error || 'Export failed');
                }

                return result;
            } catch (error) {
                clearInterval(progressInterval);
                const errorMessage =
                    error instanceof Error ? error.message : 'Export failed';
                setExportError(errorMessage);
                options?.onExportError?.(errorMessage);

                return {
                    success: false,
                    filename: '',
                    error: errorMessage,
                };
            } finally {
                setIsExporting(false);
            }
        },
        [options, simulateProgress]
    );

    return {
        isExporting,
        exportProgress,
        exportError,
        exportEvents,
        exportRegistrations,
        exportRevenue,
        exportData,
        clearError,
    };
};

import { useState, useEffect, useCallback } from 'react';
import { ExportService } from '../../services/ExportService';
import type { DataExportRequest, ExportDataTypeOption } from '../types';

const exportService = new ExportService();

/**
 * Hook for managing data export operations
 */
export const useDataExport = () => {
    const [availableDataTypes, setAvailableDataTypes] = useState<
        ExportDataTypeOption[]
    >([]);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load available data types on mount
    useEffect(() => {
        loadAvailableDataTypes();
    }, []);

    const loadAvailableDataTypes = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const dataTypes = await exportService.getAvailableDataTypes();
            setAvailableDataTypes(dataTypes);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load data types'
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    const requestExport = useCallback(async (request: DataExportRequest) => {
        try {
            setIsRequesting(true);
            setError(null);

            // Validate request
            if (request.dataTypes.length === 0) {
                throw new Error(
                    'Please select at least one data type to export'
                );
            }

            // Check rate limiting (client-side validation)
            const recentRequests = getRecentExportRequests();
            if (recentRequests >= 3) {
                throw new Error(
                    'You have reached the daily limit of 3 export requests. Please try again tomorrow.'
                );
            }

            const job = await exportService.requestExport(request);

            // Track request for rate limiting
            trackExportRequest();

            return job;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to request export';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsRequesting(false);
        }
    }, []);

    const downloadExport = useCallback(async (jobId: string) => {
        try {
            const blob = await exportService.downloadExport(jobId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `export-${jobId}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            throw new Error(
                err instanceof Error ? err.message : 'Failed to download export'
            );
        }
    }, []);

    const cancelExport = useCallback(async (jobId: string) => {
        try {
            await exportService.cancelExport(jobId);
        } catch (err) {
            throw new Error(
                err instanceof Error ? err.message : 'Failed to cancel export'
            );
        }
    }, []);

    return {
        availableDataTypes,
        isRequesting,
        isLoading,
        error,
        requestExport,
        downloadExport,
        cancelExport,
        retry: loadAvailableDataTypes,
    };
};

// Helper functions for rate limiting
function getRecentExportRequests(): number {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('exportRequests');

    if (!stored) return 0;

    try {
        const data = JSON.parse(stored);
        return data.date === today ? data.count : 0;
    } catch {
        return 0;
    }
}

function trackExportRequest(): void {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('exportRequests');

    let data = { date: today, count: 1 };

    if (stored) {
        try {
            const existing = JSON.parse(stored);
            if (existing.date === today) {
                data.count = existing.count + 1;
            }
        } catch {
            // Use default data
        }
    }

    localStorage.setItem('exportRequests', JSON.stringify(data));
}

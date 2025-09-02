import { useState, useEffect, useCallback } from 'react';
import { ExportService } from '../../services/ExportService';
import type { ExportHistory, DataExportJob } from '../types';

const exportService = new ExportService();

/**
 * Hook for managing export history operations
 */
export const useExportHistory = () => {
    const [history, setHistory] = useState<ExportHistory>({
        jobs: [],
        totalCount: 0,
        hasMore: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load export history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = useCallback(async (reset = true) => {
        try {
            setIsLoading(true);
            setError(null);

            const offset = reset ? 0 : history.jobs.length;
            const newHistory = await exportService.getExportHistory(offset);

            setHistory(prev => ({
                jobs: reset ? newHistory.jobs : [...prev.jobs, ...newHistory.jobs],
                totalCount: newHistory.totalCount,
                hasMore: newHistory.hasMore,
            }));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load export history'
            );
        } finally {
            setIsLoading(false);
        }
    }, [history.jobs.length]);

    const loadMore = useCallback(async () => {
        if (!history.hasMore || isLoading) return;
        await loadHistory(false);
    }, [history.hasMore, isLoading, loadHistory]);

    const downloadExport = useCallback(async (jobId: string) => {
        try {
            setIsDownloading(jobId);
            setError(null);

            const job = history.jobs.find(j => j.id === jobId);
            if (!job) {
                throw new Error('Export job not found');
            }

            if (job.status !== 'completed') {
                throw new Error('Export is not ready for download');
            }

            if (job.expiresAt && new Date() > new Date(job.expiresAt)) {
                throw new Error('Export has expired');
            }

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
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to download export';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsDownloading(null);
        }
    }, [history.jobs]);

    const deleteExport = useCallback(async (jobId: string) => {
        try {
            setIsDeleting(jobId);
            setError(null);

            await exportService.deleteExport(jobId);

            // Remove the job from local state
            setHistory(prev => ({
                ...prev,
                jobs: prev.jobs.filter(job => job.id !== jobId),
                totalCount: prev.totalCount - 1,
            }));
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to delete export';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsDeleting(null);
        }
    }, []);

    const refreshHistory = useCallback(() => {
        loadHistory(true);
    }, [loadHistory]);

    const getJobById = useCallback((jobId: string): DataExportJob | undefined => {
        return history.jobs.find(job => job.id === jobId);
    }, [history.jobs]);

    const updateJobStatus = useCallback((jobId: string, updates: Partial<DataExportJob>) => {
        setHistory(prev => ({
            ...prev,
            jobs: prev.jobs.map(job =>
                job.id === jobId ? { ...job, ...updates } : job
            ),
        }));
    }, []);

    return {
        history,
        isLoading,
        isDownloading,
        isDeleting,
        error,
        downloadExport,
        deleteExport,
        loadMore,
        refreshHistory,
        getJobById,
        updateJobStatus,
        retry: refreshHistory,
    };
};

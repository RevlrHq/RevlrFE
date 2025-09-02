import type {
    DataExportRequest,
    DataExportJob,
    ExportHistory,
    ExportDataTypeOption,
} from '../types';

/**
 * Service for handling data export operations
 */
export class ExportService {
    private readonly baseUrl = '/api/settings/export';

    /**
     * Get available data types for export
     */
    async getAvailableDataTypes(): Promise<ExportDataTypeOption[]> {
        const response = await fetch(`${this.baseUrl}/data-types`);
        if (!response.ok) {
            throw new Error('Failed to fetch available data types');
        }
        return response.json();
    }

    /**
     * Request a new data export
     */
    async requestExport(request: DataExportRequest): Promise<DataExportJob> {
        const response = await fetch(`${this.baseUrl}/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to request export');
        }

        return response.json();
    }

    /**
     * Get export history with pagination
     */
    async getExportHistory(page = 1, limit = 10): Promise<ExportHistory> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await fetch(`${this.baseUrl}/history?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch export history');
        }

        return response.json();
    }

    /**
     * Download an export file
     */
    async downloadExport(jobId: string): Promise<Blob> {
        const response = await fetch(`${this.baseUrl}/download/${jobId}`);
        if (!response.ok) {
            throw new Error('Failed to download export');
        }

        return response.blob();
    }

    /**
     * Delete an export record
     */
    async deleteExport(jobId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${jobId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete export');
        }
    }

    /**
     * Cancel a pending export
     */
    async cancelExport(jobId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${jobId}/cancel`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to cancel export');
        }
    }

    /**
     * Get export status
     */
    async getExportStatus(jobId: string): Promise<DataExportJob> {
        const response = await fetch(`${this.baseUrl}/${jobId}/status`);
        if (!response.ok) {
            throw new Error('Failed to get export status');
        }

        return response.json();
    }
}

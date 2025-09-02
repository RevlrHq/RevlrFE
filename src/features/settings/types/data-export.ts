/**
 * Data export settings types and interfaces
 */

export interface DataExportRequest {
    dataTypes: ExportDataType[];
    format: ExportFormat;
    dateRange?: DateRange;
    includeDeleted: boolean;
    compression: boolean;
}

export interface DataExportJob {
    id: string;
    userId: string;
    status: ExportStatus;
    dataTypes: ExportDataType[];
    format: ExportFormat;
    requestedAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    expiresAt?: Date;
    fileSize?: number;
    error?: string;
}

export type ExportDataType =
    | 'profile'
    | 'events'
    | 'attendees'
    | 'tickets'
    | 'revenue'
    | 'analytics'
    | 'media'
    | 'settings'
    | 'all';

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

export type ExportStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'expired';

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface ExportHistory {
    jobs: DataExportJob[];
    totalCount: number;
    hasMore: boolean;
}

export interface ExportRequestProps {
    onSubmit: (request: DataExportRequest) => Promise<void>;
    isLoading?: boolean;
    availableDataTypes: ExportDataTypeOption[];
}

export interface ExportHistoryProps {
    history: ExportHistory;
    onDownload: (jobId: string) => Promise<void>;
    onDelete: (jobId: string) => Promise<void>;
    onLoadMore: () => Promise<void>;
    isLoading?: boolean;
}

export interface ExportItemProps {
    job: DataExportJob;
    onDownload: () => Promise<void>;
    onDelete: () => Promise<void>;
    isDownloading?: boolean;
    isDeleting?: boolean;
}

export interface ExportOptionsProps {
    options: DataExportRequest;
    onChange: (options: DataExportRequest) => void;
    availableDataTypes: ExportDataTypeOption[];
}

export interface DownloadButtonProps {
    job: DataExportJob;
    onDownload: () => Promise<void>;
    isDownloading?: boolean;
}

export interface ExportDataTypeOption {
    type: ExportDataType;
    label: string;
    description: string;
    estimatedSize: string;
    isAvailable: boolean;
}

export interface ExportProgress {
    jobId: string;
    progress: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
}

export interface ExportNotification {
    jobId: string;
    status: ExportStatus;
    message: string;
    downloadUrl?: string;
}

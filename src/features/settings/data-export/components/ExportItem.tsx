import React from 'react';
import { DownloadButton } from './DownloadButton';
import type { ExportItemProps } from '../types';

export const ExportItem: React.FC<ExportItemProps> = ({
    job,
    onDownload,
    onDelete,
    isDownloading = false,
    isDeleting = false,
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-100';
            case 'processing':
                return 'text-blue-600 bg-blue-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            case 'failed':
                return 'text-red-600 bg-red-100';
            case 'expired':
                return 'text-gray-600 bg-gray-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    const isExpired = job.expiresAt && new Date() > new Date(job.expiresAt);
    const canDownload =
        job.status === 'completed' && job.downloadUrl && !isExpired;

    return (
        <div className='rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50'>
            <div className='flex items-start justify-between'>
                <div className='min-w-0 flex-1'>
                    <div className='mb-2 flex items-center space-x-3'>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                                job.status
                            )}`}
                        >
                            {job.status.charAt(0).toUpperCase() +
                                job.status.slice(1)}
                        </span>
                        <span className='text-sm text-gray-500'>
                            {formatDate(job.requestedAt)}
                        </span>
                    </div>

                    <div className='space-y-1'>
                        <div className='flex items-center space-x-4 text-sm'>
                            <span className='text-gray-600'>
                                Data: {job.dataTypes.join(', ')}
                            </span>
                            <span className='text-gray-600'>
                                Format: {job.format.toUpperCase()}
                            </span>
                            {job.fileSize && (
                                <span className='text-gray-600'>
                                    Size: {formatFileSize(job.fileSize)}
                                </span>
                            )}
                        </div>

                        {job.completedAt && (
                            <div className='text-sm text-gray-500'>
                                Completed: {formatDate(job.completedAt)}
                            </div>
                        )}

                        {job.expiresAt && (
                            <div className='text-sm text-gray-500'>
                                {isExpired ? (
                                    <span className='text-red-600'>
                                        Expired
                                    </span>
                                ) : (
                                    <>Expires: {formatDate(job.expiresAt)}</>
                                )}
                            </div>
                        )}

                        {job.error && (
                            <div className='rounded bg-red-50 p-2 text-sm text-red-600'>
                                Error: {job.error}
                            </div>
                        )}
                    </div>
                </div>

                <div className='ml-4 flex items-center space-x-2'>
                    {canDownload && (
                        <DownloadButton
                            job={job}
                            onDownload={onDownload}
                            isDownloading={isDownloading}
                        />
                    )}

                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className='p-2 text-gray-400 transition-colors hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50'
                        title='Delete export record'
                    >
                        {isDeleting ? (
                            <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600' />
                        ) : (
                            <svg
                                className='h-4 w-4'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

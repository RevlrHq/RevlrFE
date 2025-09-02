import React from 'react';
import { LoadingSpinner } from '../../shared/components';
import { ExportItem } from './ExportItem';
import type { ExportHistoryProps } from '../types';

export const ExportHistory: React.FC<ExportHistoryProps> = ({
    history,
    onDownload,
    onDelete,
    onLoadMore,
    isLoading = false,
    isDownloading = {},
    isDeleting = {},
}) => {
    if (isLoading && history.jobs.length === 0) {
        return (
            <div className='flex justify-center py-8'>
                <LoadingSpinner />
            </div>
        );
    }

    if (history.jobs.length === 0) {
        return (
            <div className='py-8 text-center'>
                <div className='mx-auto h-12 w-12 text-gray-400'>
                    <svg fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                    </svg>
                </div>
                <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    No exports yet
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                    You haven't requested any data exports. Create your first
                    export to get started.
                </p>
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <div>
                <h3 className='mb-2 text-lg font-medium text-gray-900'>
                    Export History
                </h3>
                <p className='text-sm text-gray-600'>
                    View and download your previous data exports. Downloads
                    expire after 7 days.
                </p>
            </div>

            <div className='space-y-3'>
                {history.jobs.map((job) => (
                    <ExportItem
                        key={job.id}
                        job={job}
                        onDownload={() => onDownload(job.id)}
                        onDelete={() => onDelete(job.id)}
                        isDownloading={isDownloading[job.id] || false}
                        isDeleting={isDeleting[job.id] || false}
                    />
                ))}
            </div>

            {history.hasMore && (
                <div className='flex justify-center pt-4'>
                    <button
                        onClick={onLoadMore}
                        disabled={isLoading}
                        className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isLoading ? (
                            <div className='flex items-center'>
                                <LoadingSpinner size='sm' className='mr-2' />
                                Loading...
                            </div>
                        ) : (
                            'Load More'
                        )}
                    </button>
                </div>
            )}

            {/* Summary */}
            <div className='rounded-lg bg-gray-50 p-4'>
                <div className='flex items-center justify-between text-sm'>
                    <span className='text-gray-600'>
                        Showing {history.jobs.length} of {history.totalCount}{' '}
                        exports
                    </span>
                    <span className='text-gray-500'>
                        Downloads expire after 7 days
                    </span>
                </div>
            </div>
        </div>
    );
};

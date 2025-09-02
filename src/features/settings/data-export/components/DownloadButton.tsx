import React from 'react';
import type { DownloadButtonProps } from '../types';

export const DownloadButton: React.FC<DownloadButtonProps> = ({
    job,
    onDownload,
    isDownloading = false,
}) => {
    const isExpired = job.expiresAt && new Date() > new Date(job.expiresAt);
    const canDownload =
        job.status === 'completed' && job.downloadUrl && !isExpired;

    if (!canDownload) {
        return null;
    }

    return (
        <button
            onClick={onDownload}
            disabled={isDownloading}
            className='inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium leading-4 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        >
            {isDownloading ? (
                <>
                    <div className='-ml-1 mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Downloading...
                </>
            ) : (
                <>
                    <svg
                        className='-ml-1 mr-2 h-4 w-4'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        />
                    </svg>
                    Download
                </>
            )}
        </button>
    );
};

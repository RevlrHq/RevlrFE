import React, { useState } from 'react';
import { SaveButton, ErrorMessage } from '../../shared/components';
import { ExportOptions } from './ExportOptions';
import type { DataExportRequest, ExportRequestProps } from '../types';

export const ExportRequest: React.FC<ExportRequestProps> = ({
    onSubmit,
    isLoading = false,
    availableDataTypes,
}) => {
    const [options, setOptions] = useState<DataExportRequest>({
        dataTypes: ['profile'],
        format: 'json',
        includeDeleted: false,
        compression: true,
    });

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (options.dataTypes.length === 0) {
            setError('Please select at least one data type to export');
            return;
        }

        try {
            await onSubmit(options);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to request export'
            );
        }
    };

    const estimatedSize = calculateEstimatedSize(
        options.dataTypes,
        availableDataTypes
    );
    const estimatedTime = calculateEstimatedTime(options.dataTypes);

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-4'>
                <div>
                    <h3 className='mb-2 text-lg font-medium text-gray-900'>
                        Export Configuration
                    </h3>
                    <p className='text-sm text-gray-600'>
                        Select the data you want to export and configure the
                        export options.
                    </p>
                </div>

                <ExportOptions
                    options={options}
                    onChange={setOptions}
                    availableDataTypes={availableDataTypes}
                />

                {/* Export Summary */}
                <div className='rounded-lg bg-gray-50 p-4'>
                    <h4 className='mb-2 font-medium text-gray-900'>
                        Export Summary
                    </h4>
                    <div className='space-y-1 text-sm text-gray-600'>
                        <div className='flex justify-between'>
                            <span>Data types:</span>
                            <span>{options.dataTypes.length} selected</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Format:</span>
                            <span className='uppercase'>{options.format}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Estimated size:</span>
                            <span>{estimatedSize}</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Estimated time:</span>
                            <span>{estimatedTime}</span>
                        </div>
                        {options.compression && (
                            <div className='flex justify-between'>
                                <span>Compression:</span>
                                <span>Enabled</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Important Notice */}
                <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                    <div className='flex'>
                        <div className='flex-shrink-0'>
                            <svg
                                className='h-5 w-5 text-blue-400'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                            >
                                <path
                                    fillRule='evenodd'
                                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                        <div className='ml-3'>
                            <h3 className='text-sm font-medium text-blue-800'>
                                Important Information
                            </h3>
                            <div className='mt-2 text-sm text-blue-700'>
                                <ul className='list-inside list-disc space-y-1'>
                                    <li>
                                        Export processing may take several
                                        minutes depending on data size
                                    </li>
                                    <li>
                                        You'll receive an email notification
                                        when your export is ready
                                    </li>
                                    <li>
                                        Download links expire after 7 days for
                                        security
                                    </li>
                                    <li>
                                        You can request up to 3 exports per day
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <ErrorMessage message={error} />}
            </div>

            <div className='flex justify-end'>
                <SaveButton
                    type='submit'
                    isLoading={isLoading}
                    disabled={options.dataTypes.length === 0}
                >
                    {isLoading ? 'Requesting Export...' : 'Request Export'}
                </SaveButton>
            </div>
        </form>
    );
};

function calculateEstimatedSize(
    dataTypes: string[],
    availableDataTypes: Array<{ type: string; estimatedSize: string }>
): string {
    if (dataTypes.includes('all')) {
        return '50-200 MB';
    }

    const totalSizeEstimate = dataTypes.reduce((total, type) => {
        const typeInfo = availableDataTypes.find((dt) => dt.type === type);
        if (!typeInfo) return total;

        // Extract numeric value from size string (e.g., "5 MB" -> 5)
        const sizeMatch = typeInfo.estimatedSize.match(/(\d+)/);
        return total + (sizeMatch ? parseInt(sizeMatch[1]) : 1);
    }, 0);

    return `${Math.max(1, totalSizeEstimate)}-${totalSizeEstimate * 2} MB`;
}

function calculateEstimatedTime(dataTypes: string[]): string {
    if (dataTypes.includes('all')) {
        return '10-30 minutes';
    }

    const baseTime = Math.max(1, dataTypes.length * 2);
    return `${baseTime}-${baseTime * 2} minutes`;
}

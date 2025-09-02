import React from 'react';
import type {
    ExportOptionsProps,
    ExportDataType,
    ExportFormat,
} from '../types';

export const ExportOptions: React.FC<ExportOptionsProps> = ({
    options,
    onChange,
    availableDataTypes,
}) => {
    const handleDataTypeChange = (type: ExportDataType, checked: boolean) => {
        if (type === 'all') {
            onChange({
                ...options,
                dataTypes: checked ? ['all'] : [],
            });
        } else {
            const newDataTypes = checked
                ? [...options.dataTypes.filter((t) => t !== 'all'), type]
                : options.dataTypes.filter((t) => t !== type);

            onChange({
                ...options,
                dataTypes: newDataTypes,
            });
        }
    };

    const handleFormatChange = (format: ExportFormat) => {
        onChange({
            ...options,
            format,
        });
    };

    const handleDateRangeChange = (
        field: 'startDate' | 'endDate',
        value: string
    ) => {
        const date = value ? new Date(value) : undefined;
        onChange({
            ...options,
            dateRange: {
                ...options.dateRange,
                [field]: date,
            } as any,
        });
    };

    const formatOptions: {
        value: ExportFormat;
        label: string;
        description: string;
    }[] = [
        {
            value: 'json',
            label: 'JSON',
            description: 'Machine-readable format, best for developers',
        },
        {
            value: 'csv',
            label: 'CSV',
            description: 'Spreadsheet format, good for analysis',
        },
        {
            value: 'xlsx',
            label: 'Excel',
            description: 'Excel format with multiple sheets',
        },
        {
            value: 'pdf',
            label: 'PDF',
            description: 'Human-readable format for reports',
        },
    ];

    const isAllSelected = options.dataTypes.includes('all');

    return (
        <div className='space-y-6'>
            {/* Data Types Selection */}
            <div>
                <label className='text-base font-medium text-gray-900'>
                    Select Data to Export
                </label>
                <p className='mb-4 text-sm text-gray-600'>
                    Choose which types of data you want to include in your
                    export.
                </p>

                <div className='space-y-3'>
                    {availableDataTypes.map((dataType) => (
                        <div key={dataType.type} className='flex items-start'>
                            <div className='flex h-5 items-center'>
                                <input
                                    id={`data-type-${dataType.type}`}
                                    type='checkbox'
                                    checked={
                                        isAllSelected ||
                                        options.dataTypes.includes(
                                            dataType.type as ExportDataType
                                        )
                                    }
                                    onChange={(e) =>
                                        handleDataTypeChange(
                                            dataType.type as ExportDataType,
                                            e.target.checked
                                        )
                                    }
                                    disabled={
                                        !dataType.isAvailable ||
                                        (isAllSelected &&
                                            dataType.type !== 'all')
                                    }
                                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50'
                                />
                            </div>
                            <div className='ml-3 text-sm'>
                                <label
                                    htmlFor={`data-type-${dataType.type}`}
                                    className={`font-medium ${
                                        dataType.isAvailable
                                            ? 'text-gray-700'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {dataType.label}
                                </label>
                                <p className='text-gray-500'>
                                    {dataType.description} • Est. size:{' '}
                                    {dataType.estimatedSize}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Format Selection */}
            <div>
                <label className='text-base font-medium text-gray-900'>
                    Export Format
                </label>
                <p className='mb-4 text-sm text-gray-600'>
                    Choose the format for your exported data.
                </p>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    {formatOptions.map((format) => (
                        <div key={format.value}>
                            <label className='relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none'>
                                <input
                                    type='radio'
                                    name='format'
                                    value={format.value}
                                    checked={options.format === format.value}
                                    onChange={() =>
                                        handleFormatChange(format.value)
                                    }
                                    className='sr-only'
                                />
                                <span className='flex flex-1'>
                                    <span className='flex flex-col'>
                                        <span className='block text-sm font-medium text-gray-900'>
                                            {format.label}
                                        </span>
                                        <span className='mt-1 flex items-center text-sm text-gray-500'>
                                            {format.description}
                                        </span>
                                    </span>
                                </span>
                                <span
                                    className={`${
                                        options.format === format.value
                                            ? 'border-blue-500'
                                            : 'border-transparent'
                                    } pointer-events-none absolute -inset-px rounded-lg border-2`}
                                />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional Options */}
            <div>
                <label className='text-base font-medium text-gray-900'>
                    Additional Options
                </label>

                <div className='mt-4 space-y-4'>
                    <div className='flex items-center'>
                        <input
                            id='include-deleted'
                            type='checkbox'
                            checked={options.includeDeleted}
                            onChange={(e) =>
                                onChange({
                                    ...options,
                                    includeDeleted: e.target.checked,
                                })
                            }
                            className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <label
                            htmlFor='include-deleted'
                            className='ml-3 text-sm text-gray-700'
                        >
                            Include deleted items
                        </label>
                    </div>

                    <div className='flex items-center'>
                        <input
                            id='compression'
                            type='checkbox'
                            checked={options.compression}
                            onChange={(e) =>
                                onChange({
                                    ...options,
                                    compression: e.target.checked,
                                })
                            }
                            className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <label
                            htmlFor='compression'
                            className='ml-3 text-sm text-gray-700'
                        >
                            Compress export file (recommended)
                        </label>
                    </div>
                </div>
            </div>

            {/* Date Range (Optional) */}
            <div>
                <label className='text-base font-medium text-gray-900'>
                    Date Range (Optional)
                </label>
                <p className='mb-4 text-sm text-gray-600'>
                    Limit export to data within a specific date range.
                </p>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div>
                        <label
                            htmlFor='start-date'
                            className='block text-sm font-medium text-gray-700'
                        >
                            Start Date
                        </label>
                        <input
                            type='date'
                            id='start-date'
                            value={
                                options.dateRange?.startDate
                                    ? options.dateRange.startDate
                                          .toISOString()
                                          .split('T')[0]
                                    : ''
                            }
                            onChange={(e) =>
                                handleDateRangeChange(
                                    'startDate',
                                    e.target.value
                                )
                            }
                            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                        />
                    </div>

                    <div>
                        <label
                            htmlFor='end-date'
                            className='block text-sm font-medium text-gray-700'
                        >
                            End Date
                        </label>
                        <input
                            type='date'
                            id='end-date'
                            value={
                                options.dateRange?.endDate
                                    ? options.dateRange.endDate
                                          .toISOString()
                                          .split('T')[0]
                                    : ''
                            }
                            onChange={(e) =>
                                handleDateRangeChange('endDate', e.target.value)
                            }
                            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

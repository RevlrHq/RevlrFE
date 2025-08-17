'use client';

import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationConfig {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}

interface EventTablePaginationProps {
    pagination: PaginationConfig;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    theme: string;
}

const EventTablePagination: React.FC<EventTablePaginationProps> = ({
    pagination,
    onPageChange,
    onPageSizeChange,
    theme,
}) => {
    const { pageNumber, pageSize, totalPages, totalItems } = pagination;

    const startItem = (pageNumber - 1) * pageSize + 1;
    const endItem = Math.min(pageNumber * pageSize, totalItems);

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, pageNumber - delta);
            i <= Math.min(totalPages - 1, pageNumber + delta);
            i++
        ) {
            range.push(i);
        }

        if (pageNumber - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (pageNumber + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className='flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row'>
            <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                    <span className='text-sm'>Show:</span>
                    <select
                        value={pageSize}
                        onChange={(e) =>
                            onPageSizeChange(Number(e.target.value))
                        }
                        className={`rounded border px-3 py-1 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                        }`}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <span
                    className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                    Showing {startItem}-{endItem} of {totalItems} events
                </span>
            </div>

            <div className='flex items-center gap-2'>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onPageChange(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    className='flex items-center gap-1'
                >
                    <ChevronLeft className='size-4' />
                    Previous
                </Button>

                <div className='flex items-center gap-1'>
                    {getVisiblePages().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className='px-2 py-1 text-sm'>...</span>
                            ) : (
                                <Button
                                    variant={
                                        page === pageNumber
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => onPageChange(page as number)}
                                    className='size-8 p-0'
                                >
                                    {page}
                                </Button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => onPageChange(pageNumber + 1)}
                    disabled={pageNumber >= totalPages}
                    className='flex items-center gap-1'
                >
                    Next
                    <ChevronRight className='size-4' />
                </Button>
            </div>
        </div>
    );
};

export default EventTablePagination;

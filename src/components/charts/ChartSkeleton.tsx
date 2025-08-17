'use client';

import React from 'react';

interface ChartSkeletonProps {
    height?: number;
    className?: string;
    title?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
    height = 300,
    className = '',
    title = 'Loading chart...',
}) => {
    return (
        <div
            className={`animate-pulse rounded-lg border bg-card p-4 ${className}`}
            style={{ height: height + 32 }} // Add padding
            role='status'
            aria-label={title}
        >
            {/* Chart title skeleton */}
            <div className='mb-4'>
                <div className='h-5 w-1/3 rounded bg-muted'></div>
            </div>

            {/* Chart area skeleton */}
            <div
                className='flex items-center justify-center rounded-md bg-muted/30'
                style={{ height }}
            >
                <div className='text-center'>
                    <div className='mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                    <div className='text-sm text-muted-foreground'>
                        Loading chart data...
                    </div>
                </div>
            </div>

            {/* Legend skeleton */}
            <div className='mt-4 flex justify-center space-x-4'>
                <div className='flex items-center space-x-2'>
                    <div className='h-3 w-3 rounded-full bg-muted'></div>
                    <div className='h-3 w-16 rounded bg-muted'></div>
                </div>
                <div className='flex items-center space-x-2'>
                    <div className='h-3 w-3 rounded-full bg-muted'></div>
                    <div className='h-3 w-20 rounded bg-muted'></div>
                </div>
            </div>
        </div>
    );
};

export default ChartSkeleton;

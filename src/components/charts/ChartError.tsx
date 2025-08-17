'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ChartErrorProps {
    height?: number;
    className?: string;
    title?: string;
    message?: string;
    onRetry?: () => void;
    showRetry?: boolean;
}

export const ChartError: React.FC<ChartErrorProps> = ({
    height = 300,
    className = '',
    title = 'Chart Error',
    message = 'Unable to load chart data. Please try again.',
    onRetry,
    showRetry = true,
}) => {
    return (
        <div
            className={`rounded-lg border bg-card p-4 ${className}`}
            style={{ height: height + 32 }} // Add padding
            role='alert'
            aria-label={`${title}: ${message}`}
        >
            <div
                className='flex h-full flex-col items-center justify-center text-center'
                style={{ height }}
            >
                <AlertCircle className='mb-4 h-12 w-12 text-destructive' />

                <h3 className='mb-2 text-lg font-semibold text-foreground'>
                    {title}
                </h3>

                <p className='mb-4 max-w-sm text-sm text-muted-foreground'>
                    {message}
                </p>

                {showRetry && onRetry && (
                    <button
                        onClick={onRetry}
                        className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                        aria-label='Retry loading chart data'
                    >
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChartError;

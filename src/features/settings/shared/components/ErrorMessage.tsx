'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
    message: string;
    onDismiss?: () => void;
    className?: string;
    variant?: 'error' | 'warning';
}

export function ErrorMessage({
    message,
    onDismiss,
    className,
    variant = 'error',
}: ErrorMessageProps) {
    const variantClasses = {
        error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
        warning:
            'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    };

    return (
        <div
            className={cn(
                'flex items-start rounded-md border p-3',
                variantClasses[variant],
                className
            )}
            role='alert'
        >
            <AlertCircle className='mr-2 mt-0.5 size-4 shrink-0' />
            <span className='flex-1 text-sm'>{message}</span>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className='ml-2 shrink-0 hover:opacity-70'
                    aria-label='Dismiss error'
                >
                    <X className='size-4' />
                </button>
            )}
        </div>
    );
}

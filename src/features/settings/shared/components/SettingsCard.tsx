'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function SettingsCard({
    title,
    description,
    children,
    className,
}: SettingsCardProps) {
    return (
        <div
            className={cn(
                'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
                'dark:border-gray-700 dark:bg-gray-800',
                className
            )}
        >
            <div className='mb-4'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                    {title}
                </h3>
                {description && (
                    <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                        {description}
                    </p>
                )}
            </div>
            <div className='space-y-4'>{children}</div>
        </div>
    );
}

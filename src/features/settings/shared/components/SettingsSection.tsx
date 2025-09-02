'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function SettingsSection({
    title,
    children,
    className,
}: SettingsSectionProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {title && (
                <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
                    {title}
                </h2>
            )}
            <div className='space-y-4'>{children}</div>
        </div>
    );
}

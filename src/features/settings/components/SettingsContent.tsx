'use client';

import type { SettingsContentProps } from '../types';

/**
 * Settings Content Wrapper Component
 *
 * Simple wrapper component that provides consistent padding and structure
 * for settings section content.
 */
export function SettingsContent({
    children,
    title,
    description,
}: SettingsContentProps) {
    return (
        <div className='p-6'>
            {(title || description) && (
                <div className='mb-6 border-b border-gray-200 pb-4 dark:border-gray-700'>
                    {title && (
                        <h2 className='text-lg font-medium text-gray-900 dark:text-white'>
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                            {description}
                        </p>
                    )}
                </div>
            )}

            <div className='space-y-6'>{children}</div>
        </div>
    );
}

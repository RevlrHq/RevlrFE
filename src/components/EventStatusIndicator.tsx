'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface EventStatusIndicatorProps {
    status: 'draft' | 'published';
    className?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const EventStatusIndicator: React.FC<EventStatusIndicatorProps> = ({
    status,
    className = '',
    showIcon = true,
    size = 'md',
}) => {
    const { theme } = useTheme();

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'published':
                return {
                    label: 'Published',
                    bgColor: 'bg-revlr-accent-green/10',
                    textColor: 'text-revlr-accent-green',
                    borderColor: 'border-revlr-accent-green/20',
                    icon: (
                        <svg
                            className={iconSizes[size]}
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                    ),
                };
            case 'draft':
            default:
                return {
                    label: 'Draft',
                    bgColor:
                        theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-50',
                    textColor: 'text-yellow-600',
                    borderColor:
                        theme === 'dark'
                            ? 'border-yellow-500/20'
                            : 'border-yellow-200',
                    icon: (
                        <svg
                            className={iconSizes[size]}
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                        </svg>
                    ),
                };
        }
    };

    const config = getStatusConfig();

    return (
        <span
            className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
        >
            {showIcon && <span className='mr-1'>{config.icon}</span>}
            {config.label}
        </span>
    );
};

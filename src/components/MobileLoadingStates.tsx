'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { Skeleton } from './LoadingStates';

// Mobile-specific skeleton components
export const MobileCardSkeleton: React.FC<{ className?: string }> = ({
    className = '',
}) => {
    const { theme } = useTheme();

    return (
        <div
            className={`rounded-xl border p-4 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-white'
            } ${className}`}
        >
            <div className='flex items-start gap-3'>
                <Skeleton width='w-16' height='h-16' rounded />
                <div className='flex-1 space-y-2'>
                    <Skeleton width='w-3/4' height='h-5' />
                    <Skeleton width='w-1/2' height='h-4' />
                    <div className='mt-3 flex items-center gap-2'>
                        <Skeleton width='w-16' height='h-6' rounded />
                        <Skeleton width='w-20' height='h-6' rounded />
                    </div>
                </div>
                <Skeleton width='w-8' height='h-8' rounded />
            </div>
        </div>
    );
};

export const MobileStatsSkeleton: React.FC<{ className?: string }> = ({
    className = '',
}) => {
    const { theme } = useTheme();

    return (
        <div className={`grid grid-cols-2 gap-4 ${className}`}>
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={`rounded-xl border p-4 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    <div className='mb-3 flex items-center justify-between'>
                        <Skeleton width='w-8' height='h-8' rounded />
                        <Skeleton width='w-6' height='h-6' rounded />
                    </div>
                    <Skeleton width='w-16' height='h-8' />
                    <Skeleton width='w-12' height='h-4' className='mt-2' />
                </div>
            ))}
        </div>
    );
};

export const MobileChartSkeleton: React.FC<{
    className?: string;
    height?: string;
}> = ({ className = '', height = 'h-64' }) => {
    const { theme } = useTheme();

    return (
        <div
            className={`rounded-xl border p-4 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-white'
            } ${className}`}
        >
            {/* Chart Header */}
            <div className='mb-4 flex items-center justify-between'>
                <div className='space-y-2'>
                    <Skeleton width='w-32' height='h-5' />
                    <Skeleton width='w-24' height='h-4' />
                </div>
                <Skeleton width='w-8' height='h-8' rounded />
            </div>

            {/* Chart Area */}
            <div className={`${height} relative overflow-hidden rounded-lg`}>
                <Skeleton width='w-full' height='h-full' rounded={false} />

                {/* Simulated chart elements */}
                <div className='absolute inset-4 flex items-end justify-between'>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div
                            key={i}
                            className={`w-6 rounded-t ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-border'
                                    : 'bg-gray-300'
                            }`}
                            style={{
                                height: `${Math.random() * 60 + 20}%`,
                                opacity: 0.6,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export const MobileTableSkeleton: React.FC<{
    rows?: number;
    className?: string;
}> = ({ rows = 5, className = '' }) => {
    const { theme } = useTheme();

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Table Header */}
            <div
                className={`rounded-lg border p-3 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <Skeleton width='w-24' height='h-4' />
                    <div className='flex gap-2'>
                        <Skeleton width='w-8' height='h-8' rounded />
                        <Skeleton width='w-8' height='h-8' rounded />
                    </div>
                </div>
            </div>

            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <MobileCardSkeleton key={i} />
            ))}

            {/* Pagination */}
            <div
                className={`rounded-lg border p-3 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <Skeleton width='w-20' height='h-4' />
                    <div className='flex gap-1'>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton
                                key={i}
                                width='w-8'
                                height='h-8'
                                rounded
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MobileDashboardSkeleton: React.FC<{ className?: string }> = ({
    className = '',
}) => {
    return (
        <div className={`space-y-6 p-4 ${className}`}>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <Skeleton width='w-8' height='h-8' rounded />
                    <div className='space-y-2'>
                        <Skeleton width='w-32' height='h-6' />
                        <Skeleton width='w-24' height='h-4' />
                    </div>
                </div>
                <div className='flex gap-2'>
                    <Skeleton width='w-8' height='h-8' rounded />
                    <Skeleton width='w-8' height='h-8' rounded />
                </div>
            </div>

            {/* Stats Grid */}
            <MobileStatsSkeleton />

            {/* Chart */}
            <MobileChartSkeleton />

            {/* Quick Actions */}
            <div className='grid grid-cols-2 gap-4'>
                {[1, 2, 3, 4].map((i) => (
                    <MobileCardSkeleton key={i} />
                ))}
            </div>

            {/* Recent Items */}
            <MobileTableSkeleton rows={3} />
        </div>
    );
};

// Mobile-specific loading spinner with touch feedback
export const MobileLoadingSpinner: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    className?: string;
}> = ({ size = 'md', message, className = '' }) => {
    const { theme } = useTheme();

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div
            className={`flex flex-col items-center justify-center p-8 ${className}`}
        >
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-revlr-primary-blue ${
                    theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`}
            />
            {message && (
                <p
                    className={`mt-4 text-center text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
};

// Pull-to-refresh loading indicator
export const PullToRefreshIndicator: React.FC<{
    isVisible: boolean;
    isLoading: boolean;
    progress: number;
    className?: string;
}> = ({ isVisible, isLoading, progress, className = '' }) => {
    const { theme } = useTheme();

    if (!isVisible) return null;

    return (
        <div
            className={`flex items-center justify-center py-4 transition-all duration-200 ${className}`}
        >
            <div className='relative'>
                {isLoading ? (
                    <div
                        className={`size-8 animate-spin rounded-full border-4 border-gray-200 border-t-revlr-primary-blue ${
                            theme === 'dark'
                                ? 'border-gray-600'
                                : 'border-gray-200'
                        }`}
                    />
                ) : (
                    <div className='relative size-8'>
                        <svg className='size-8 -rotate-90' viewBox='0 0 32 32'>
                            <circle
                                cx='16'
                                cy='16'
                                r='14'
                                stroke={
                                    theme === 'dark' ? '#374151' : '#e5e7eb'
                                }
                                strokeWidth='4'
                                fill='none'
                            />
                            <circle
                                cx='16'
                                cy='16'
                                r='14'
                                stroke='#3b82f6'
                                strokeWidth='4'
                                fill='none'
                                strokeDasharray={`${progress * 87.96} 87.96`}
                                className='transition-all duration-200'
                            />
                        </svg>
                        <div className='absolute inset-0 flex items-center justify-center'>
                            <div
                                className={`size-2 rounded-full transition-all duration-200 ${
                                    progress > 0.8
                                        ? 'scale-125 bg-revlr-primary-blue'
                                        : 'bg-gray-400'
                                }`}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Swipe action feedback
export const SwipeActionFeedback: React.FC<{
    direction: 'left' | 'right';
    progress: number;
    action: string;
    icon: React.ReactNode;
    className?: string;
}> = ({ direction, progress, action, icon, className = '' }) => {
    const { theme } = useTheme();

    return (
        <div
            className={`absolute inset-y-0 ${direction === 'left' ? 'left-0' : 'right-0'} flex items-center px-4 transition-all duration-200 ${
                progress > 0.5
                    ? 'bg-revlr-primary-blue'
                    : theme === 'dark'
                      ? 'bg-revlr-dark-border'
                      : 'bg-gray-200'
            } ${className}`}
            style={{
                width: `${Math.min(progress * 100, 100)}px`,
                opacity: Math.min(progress * 2, 1),
            }}
        >
            <div
                className={`flex items-center gap-2 ${
                    progress > 0.5
                        ? 'text-white'
                        : theme === 'dark'
                          ? 'text-gray-400'
                          : 'text-gray-600'
                }`}
            >
                {icon}
                {progress > 0.3 && (
                    <span className='whitespace-nowrap text-sm font-medium'>
                        {action}
                    </span>
                )}
            </div>
        </div>
    );
};

const MobileLoadingStates = {
    MobileCardSkeleton,
    MobileStatsSkeleton,
    MobileChartSkeleton,
    MobileTableSkeleton,
    MobileDashboardSkeleton,
    MobileLoadingSpinner,
    PullToRefreshIndicator,
    SwipeActionFeedback,
};

export default MobileLoadingStates;

'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';

interface MediaGridSkeletonProps {
    count?: number;
    className?: string;
}

export const MediaGridSkeleton: React.FC<MediaGridSkeletonProps> = ({
    count = 24,
    className = '',
}) => {
    const { theme } = useTheme();

    return (
        <div
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 ${className}`}
            role='status'
            aria-label='Loading media results'
        >
            {Array.from({ length: count }, (_, index) => (
                <MediaCardSkeleton key={index} theme={theme} index={index} />
            ))}
        </div>
    );
};

interface MediaCardSkeletonProps {
    theme: 'light' | 'dark';
    index: number;
}

const MediaCardSkeleton: React.FC<MediaCardSkeletonProps> = ({
    theme,
    index,
}) => {
    // Stagger animation delays for a more natural loading effect
    const animationDelay = `${(index % 8) * 100}ms`;

    return (
        <div
            className={`aspect-square overflow-hidden rounded-xl border-2 border-transparent ${
                theme === 'dark' ? 'bg-revlr-dark-border' : 'bg-gray-200'
            }`}
            style={{ animationDelay }}
        >
            {/* Main skeleton area */}
            <div className='relative size-full animate-pulse'>
                {/* Image placeholder */}
                <div
                    className={`size-full ${
                        theme === 'dark' ? 'bg-revlr-dark-card' : 'bg-gray-300'
                    }`}
                />

                {/* Provider badge skeleton */}
                <div className='absolute left-2 top-2'>
                    <div
                        className={`h-5 w-16 rounded ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-bg'
                                : 'bg-gray-400'
                        }`}
                    />
                </div>

                {/* Action buttons skeleton */}
                <div className='absolute right-2 top-2 flex space-x-1'>
                    <div
                        className={`size-8 rounded-full ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-bg'
                                : 'bg-gray-400'
                        }`}
                    />
                    <div
                        className={`size-8 rounded-full ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-bg'
                                : 'bg-gray-400'
                        }`}
                    />
                </div>

                {/* Bottom info skeleton */}
                <div className='absolute inset-x-2 bottom-2'>
                    <div
                        className={`mb-1 h-3 w-3/4 rounded ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-bg'
                                : 'bg-gray-400'
                        }`}
                    />
                    <div
                        className={`h-2 w-1/2 rounded ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-bg'
                                : 'bg-gray-400'
                        }`}
                    />
                </div>

                {/* Attribution indicator skeleton */}
                {index % 3 === 0 && (
                    <div className='absolute bottom-2 right-2'>
                        <div
                            className={`size-5 rounded ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-bg'
                                    : 'bg-gray-400'
                            }`}
                        />
                    </div>
                )}

                {/* Shimmer effect */}
                <div className='absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent' />
            </div>
        </div>
    );
};

// Add shimmer animation to global styles if not already present
export const shimmerKeyframes = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;

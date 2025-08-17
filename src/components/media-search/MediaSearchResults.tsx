'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { MediaItem } from '@/types/media-search';
import { MediaCard } from './MediaCard';
import { MediaGridSkeleton } from './MediaGridSkeleton';
import { EmptyState } from './EmptyState';
import { AlertCircle, WifiOff } from 'lucide-react';

interface MediaSearchResultsProps {
    items: MediaItem[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    selectedItems: MediaItem[];
    onLoadMore: () => Promise<void>;
    onSelectItem: (item: MediaItem) => void;
    onPreviewItem: (item: MediaItem) => void;
    disabled?: boolean;
    className?: string;
}

export const MediaSearchResults: React.FC<MediaSearchResultsProps> = ({
    items,
    isLoading,
    error,
    hasMore,
    selectedItems,
    onLoadMore,
    onSelectItem,
    onPreviewItem,
    disabled = false,
    className = '',
}) => {
    const { theme } = useTheme();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Infinite scroll implementation
    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || disabled || !isOnline) {
            return;
        }

        setIsLoadingMore(true);
        try {
            await onLoadMore();
        } catch (error) {
            console.error('Failed to load more results:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, disabled, isOnline, onLoadMore]);

    // Set up intersection observer for infinite scroll
    useEffect(() => {
        if (!loadMoreTriggerRef.current || !hasMore || disabled) {
            return;
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && !isLoadingMore) {
                    handleLoadMore();
                }
            },
            {
                rootMargin: '100px', // Start loading 100px before the trigger comes into view
                threshold: 0.1,
            }
        );

        observerRef.current.observe(loadMoreTriggerRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, disabled, isLoadingMore, handleLoadMore]);

    // Helper function to check if item is selected
    const isItemSelected = useCallback(
        (item: MediaItem) => {
            return selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );
        },
        [selectedItems]
    );

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;

            // Handle arrow key navigation
            if (e.key === 'ArrowDown' && e.ctrlKey) {
                e.preventDefault();
                handleLoadMore();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [disabled, handleLoadMore]);

    // Show initial loading state
    if (isLoading && items.length === 0) {
        return (
            <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
                <MediaGridSkeleton count={24} />
            </div>
        );
    }

    // Show error state
    if (error && items.length === 0) {
        return (
            <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
                <div className='flex h-64 items-center justify-center'>
                    <div className='text-center'>
                        <AlertCircle className='mx-auto mb-4 size-8 text-red-500' />
                        <p
                            className={`mb-2 font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Something went wrong
                        </p>
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {error}
                        </p>
                        {!isOnline && (
                            <div className='mt-4 flex items-center justify-center space-x-2'>
                                <WifiOff className='size-4 text-red-500' />
                                <span
                                    className={`text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    You appear to be offline
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Show empty state
    if (items.length === 0 && !isLoading) {
        return (
            <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
                <EmptyState />
            </div>
        );
    }

    return (
        <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
            {/* Offline indicator */}
            {!isOnline && (
                <div
                    className={`mb-4 flex items-center justify-center space-x-2 rounded-lg border p-3 ${
                        theme === 'dark'
                            ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                            : 'border-yellow-500/20 bg-yellow-50 text-yellow-700'
                    }`}
                >
                    <WifiOff className='size-4' />
                    <span className='font-inter text-sm'>
                        You're offline. Some features may not work properly.
                    </span>
                </div>
            )}

            {/* Results Grid */}
            <div
                className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'
                role='grid'
                aria-label='Media search results'
            >
                {items.map((item, index) => (
                    <MediaCard
                        key={`${item.providerId}-${item.id}`}
                        item={item}
                        isSelected={isItemSelected(item)}
                        onSelect={() => onSelectItem(item)}
                        onPreview={() => onPreviewItem(item)}
                        disabled={disabled}
                        index={index}
                        aria-label={`Image ${index + 1} of ${items.length}: ${item.title}`}
                    />
                ))}
            </div>

            {/* Load More Trigger */}
            {hasMore && (
                <div
                    ref={loadMoreTriggerRef}
                    className='mt-8 flex justify-center'
                    aria-hidden='true'
                >
                    {isLoadingMore && (
                        <div className='text-center'>
                            <div className='mx-auto mb-2 size-6 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Loading more images...
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* End of results indicator */}
            {!hasMore && items.length > 0 && (
                <div className='mt-8 text-center'>
                    <p
                        className={`font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        You've reached the end of the results
                    </p>
                </div>
            )}

            {/* Loading more error */}
            {error && items.length > 0 && (
                <div className='mt-8 text-center'>
                    <div className='inline-flex items-center space-x-2 rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-900/20 dark:text-red-400'>
                        <AlertCircle className='size-4' />
                        <span className='font-inter text-sm'>
                            Failed to load more results
                        </span>
                    </div>
                </div>
            )}

            {/* Accessibility announcements */}
            <div className='sr-only' aria-live='polite' aria-atomic='true'>
                {isLoading && 'Loading search results'}
                {isLoadingMore && 'Loading more results'}
                {error && `Error: ${error}`}
                {items.length > 0 && `Found ${items.length} images`}
            </div>
        </div>
    );
};

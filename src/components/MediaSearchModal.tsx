'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useMediaSearch } from '@src/hooks/useMediaSearch';
import { useMediaSearchAnalytics } from '@src/hooks/useMediaSearchAnalytics';
import type { MediaItem } from '@src/types/media-search';
import type { EventImage } from '@src/types/event-creation';
import { X, Search, Filter, Download, BarChart3 } from 'lucide-react';
import PerformanceDashboard from './media-search/PerformanceDashboard';
import MediaSearchErrorDisplay from './media-search/MediaSearchErrorDisplay';
import ProviderStatusPanel from './media-search/ProviderStatusPanel';
import MediaSearchFallback from './media-search/MediaSearchFallback';
import { MediaCard } from './media-search/MediaCard';
import { MediaPreviewModal } from './media-search/MediaPreviewModal';

interface MediaSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMedia: (images: EventImage[]) => void;
    eventCategory?: string;
    existingImages?: EventImage[];
    maxImages?: number;
    className?: string;
}

export const MediaSearchModal: React.FC<MediaSearchModalProps> = ({
    isOpen,
    onClose,
    onSelectMedia,
    eventCategory,
    existingImages = [],
    maxImages = 5,
    className = '',
}) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [showPerformanceDashboard, setShowPerformanceDashboard] =
        useState(false);
    const [modalOpenTime] = useState(Date.now());

    // Initialize analytics
    const analytics = useMediaSearchAnalytics({
        eventCategory,
        enablePerformanceTracking: true,
        enableABTesting: true,
    });

    const { state, actions } = useMediaSearch({
        maxSelectedItems: maxImages - existingImages.length,
    });

    // Handle search input changes
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            if ('setQuery' in state && typeof state.setQuery === 'function') {
                state.setQuery(query);
            }
        },
        [state]
    );

    // Handle search submission
    const handleSearchSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (searchQuery.trim()) {
                const searchStartTime = Date.now();

                // Track search initiation
                analytics.trackSearch(
                    searchQuery.trim(),
                    state.filters,
                    state.activeProviders
                );

                actions
                    .search(searchQuery.trim())
                    .then(() => {
                        const searchEndTime = Date.now();
                        const responseTime = searchEndTime - searchStartTime;

                        // Track successful search
                        analytics.trackSearchResults(
                            searchQuery.trim(),
                            state.results?.items.length || 0,
                            responseTime,
                            state.activeProviders || []
                        );
                    })
                    .catch((error) => {
                        // Track search error
                        analytics.trackSearchError(
                            searchQuery.trim(),
                            error.message || 'Unknown error',
                            state.activeProviders || []
                        );
                    });
            }
        },
        [searchQuery, actions, analytics, state.filters, state.activeProviders]
    );

    // Handle suggestion selection
    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            setSearchQuery(suggestion);
            actions.applySuggestion(suggestion);

            // Track suggestion usage
            analytics.trackInteraction(
                'search_suggestions',
                'suggestion_clicked',
                {
                    suggestion,
                    eventCategory,
                }
            );
        },
        [actions, analytics, eventCategory]
    );

    // Handle media selection
    const handleMediaSelect = useCallback(
        (item: MediaItem) => {
            const wasSelected = state.selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );

            actions.toggleItemSelection(item);

            // Track selection/deselection
            const position =
                state.results?.items.findIndex(
                    (resultItem) =>
                        resultItem.id === item.id &&
                        resultItem.providerId === item.providerId
                ) ?? -1;

            if (wasSelected) {
                analytics.trackMediaDeselection(item, searchQuery);
            } else {
                analytics.trackMediaSelection(item, searchQuery, position);
            }
        },
        [actions, analytics, searchQuery, state.selectedItems, state.results]
    );

    // Handle using selected media
    const handleUseSelectedMedia = useCallback(async () => {
        if (state.selectedItems.length === 0) return;

        setIsProcessing(true);
        setProcessingProgress(0);

        const downloadStartTime = Date.now();

        try {
            // Track download initiation
            analytics.trackMediaDownload(state.selectedItems, searchQuery);

            // Mock processing - in real implementation, this would download and process images
            const processedImages: EventImage[] = [];

            for (let i = 0; i < state.selectedItems.length; i++) {
                const item = state.selectedItems[i];
                const itemStartTime = Date.now();

                setProcessingProgress(
                    ((i + 1) / state.selectedItems.length) * 100
                );

                // Simulate processing delay
                await new Promise((resolve) => setTimeout(resolve, 500));

                const itemEndTime = Date.now();
                const processingTime = itemEndTime - itemStartTime;

                // Track individual item processing performance
                analytics.trackPerformanceMetric(
                    'image_processing_time',
                    processingTime,
                    'ms',
                    { mediaId: item.id, providerId: item.providerId }
                );

                // Create EventImage from MediaItem
                const eventImage: EventImage = {
                    id: `external_${item.providerId}_${item.id}`,
                    url: item.downloadUrl,
                    cdnUrl: item.previewUrl,
                    name: item.title || `Image from ${item.providerId}`,
                    size: item.fileSize || 0,
                    mimeType: 'image/jpeg', // Default, would be determined during actual processing
                    order: existingImages.length + i,
                    // Extended properties for external media
                    source: 'external' as const,
                    providerId: item.providerId,
                    originalId: item.id,
                    attribution: item.attribution,
                    license: item.license,
                    photographer: item.photographer,
                    downloadedAt: new Date().toISOString(),
                    originalUrl: item.downloadUrl,
                };

                processedImages.push(eventImage);
            }

            const downloadEndTime = Date.now();
            const totalDownloadTime = downloadEndTime - downloadStartTime;

            // Track overall download performance
            analytics.trackPerformanceMetric(
                'download_speed',
                state.selectedItems.length / (totalDownloadTime / 1000),
                'items_per_second',
                { itemCount: state.selectedItems.length }
            );

            // Track conversion for A/B testing
            analytics.trackConversion(
                'media_search_layout',
                'media_downloaded',
                {
                    itemCount: state.selectedItems.length,
                    totalTime: totalDownloadTime,
                }
            );

            onSelectMedia(processedImages);
            onClose();
        } catch (error) {
            console.error('Failed to process selected media:', error);

            // Track error
            analytics.trackInteraction('media_download', 'download_error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                itemCount: state.selectedItems.length,
            });
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
        }
    }, [
        state.selectedItems,
        existingImages.length,
        onSelectMedia,
        onClose,
        analytics,
        searchQuery,
    ]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    if (!isProcessing) {
                        onClose();
                    }
                    break;
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        handleUseSelectedMedia();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isProcessing, onClose, handleUseSelectedMedia]);

    // Track modal open/close and prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            // Track modal open
            analytics.trackModalOpen();

            // Track page load performance
            const loadTime = Date.now() - modalOpenTime;
            analytics.trackPageLoad(loadTime);
        } else {
            document.body.style.overflow = 'unset';

            // Track modal close with session duration
            const sessionDuration = Date.now() - modalOpenTime;
            analytics.trackModalClose(sessionDuration);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, analytics, modalOpenTime]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 ${className}`}
            role='dialog'
            aria-modal='true'
            aria-labelledby='media-search-title'
        >
            <div
                className={`relative max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-xl shadow-2xl ${
                    theme === 'dark' ? 'bg-revlr-dark-bg' : 'bg-white'
                }`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between border-b p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <div>
                        <h2
                            id='media-search-title'
                            className={`font-inter text-xl font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Browse Media Library
                        </h2>
                        <p
                            className={`mt-1 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Search and select high-quality images for your event
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className={`rounded-full p-2 transition-colors ${
                            theme === 'dark'
                                ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                        aria-label='Close media search'
                    >
                        <X className='size-5' />
                    </button>
                </div>

                {/* Search Bar */}
                <div
                    className={`border-b p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <form onSubmit={handleSearchSubmit} className='relative'>
                        <div className='relative'>
                            <Search
                                className={`absolute left-3 top-1/2 size-5 -translate-y-1/2 ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            />
                            <input
                                type='text'
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder='Search for images...'
                                className={`w-full rounded-xl border py-3 pl-10 pr-12 font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                }`}
                                disabled={isProcessing}
                                aria-label='Search for images'
                            />
                            <div className='absolute right-3 top-1/2 flex -translate-y-1/2 space-x-1'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowFilters(!showFilters);
                                        if (!showFilters) {
                                            analytics.trackInteraction(
                                                'media_search_layout',
                                                'filters_opened'
                                            );
                                        }
                                    }}
                                    className={`rounded-lg p-1 transition-colors ${
                                        showFilters
                                            ? 'bg-revlr-primary-blue text-white'
                                            : theme === 'dark'
                                              ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                                    disabled={isProcessing}
                                    aria-label='Toggle filters'
                                >
                                    <Filter className='size-4' />
                                </button>

                                {process.env.NODE_ENV === 'development' && (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setShowPerformanceDashboard(true)
                                        }
                                        className={`rounded-lg p-1 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                        disabled={isProcessing}
                                        aria-label='Show performance dashboard'
                                        title='Performance Dashboard (Dev Only)'
                                    >
                                        <BarChart3 className='size-4' />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search Suggestions */}
                        {state.showSuggestions &&
                            state.suggestions.length > 0 && (
                                <div
                                    className={`absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border shadow-lg ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    {state.suggestions.map(
                                        (suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    handleSuggestionClick(
                                                        suggestion
                                                    )
                                                }
                                                className={`w-full px-4 py-2 text-left font-inter text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                                    theme === 'dark'
                                                        ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                {suggestion}
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                    </form>
                </div>

                {/* Main Content */}
                <div className='flex h-[calc(90vh-200px)]'>
                    {/* Results Area */}
                    <div className='flex-1 overflow-y-auto p-6'>
                        {state.isLoading && !state.results && (
                            <div className='flex h-64 items-center justify-center'>
                                <div className='text-center'>
                                    <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                                    <p
                                        className={`font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        Searching for images...
                                    </p>
                                </div>
                            </div>
                        )}

                        {state.error && (
                            <div className='space-y-4'>
                                <MediaSearchErrorDisplay
                                    error={state.error}
                                    providerErrors={state.providerErrors}
                                    isInitializing={state.isInitializing}
                                    isInitialized={state.isInitialized}
                                    initializationError={
                                        state.initializationError
                                    }
                                    availableProviders={
                                        state.activeProviders.length
                                    }
                                    totalProviders={
                                        state.availableProviders.length
                                    }
                                    onRetry={() => {
                                        if (actions.retryInitialization) {
                                            actions.retryInitialization();
                                        } else if (searchQuery.trim()) {
                                            actions.search(searchQuery.trim());
                                        }
                                    }}
                                />

                                {/* Show fallback options if no providers are available */}
                                {state.activeProviders.length === 0 && (
                                    <MediaSearchFallback
                                        reason={
                                            state.initializationError
                                                ? 'initialization_failed'
                                                : state.error.includes(
                                                        'network'
                                                    )
                                                  ? 'network_error'
                                                  : state.error.includes(
                                                          'rate limit'
                                                      )
                                                    ? 'rate_limited'
                                                    : state.error.includes(
                                                            'configuration'
                                                        )
                                                      ? 'configuration_error'
                                                      : 'no_providers'
                                        }
                                        availableProviders={
                                            state.activeProviders.length
                                        }
                                        totalProviders={
                                            state.availableProviders.length
                                        }
                                        onRetry={() => {
                                            if (actions.retryInitialization) {
                                                actions.retryInitialization();
                                            }
                                        }}
                                        onUpload={() => {
                                            // This would trigger the image upload component
                                            console.log(
                                                'Upload fallback triggered'
                                            );
                                        }}
                                        onBrowseLocal={() => {
                                            // This would open a file browser
                                            const input =
                                                document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.multiple = true;
                                            input.onchange = (e) => {
                                                const files = (
                                                    e.target as HTMLInputElement
                                                ).files;
                                                if (files) {
                                                    console.log(
                                                        'Local files selected:',
                                                        files
                                                    );
                                                    // Handle file selection
                                                }
                                            };
                                            input.click();
                                        }}
                                        onUsePlaceholder={() => {
                                            // This would add placeholder images
                                            const placeholderImages: EventImage[] =
                                                [
                                                    {
                                                        id: 'placeholder-1',
                                                        url: '/assets/images/event-image.png',
                                                        cdnUrl: '/assets/images/event-image.png',
                                                        name: 'Placeholder Image',
                                                        size: 0,
                                                        mimeType: 'image/png',
                                                        order: 0,
                                                        source: 'external' as const,
                                                    },
                                                ];
                                            onSelectMedia(placeholderImages);
                                            onClose();
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        {state.results && state.results.items.length > 0 && (
                            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                                {state.results.items.map((item) => {
                                    const isSelected = state.selectedItems.some(
                                        (selected) =>
                                            selected.id === item.id &&
                                            selected.providerId ===
                                                item.providerId
                                    );

                                    return (
                                        <MediaCard
                                            key={`${item.providerId}-${item.id}`}
                                            item={item}
                                            isSelected={isSelected}
                                            onSelect={() =>
                                                handleMediaSelect(item)
                                            }
                                            onPreview={() => {
                                                const position =
                                                    state.results?.items.findIndex(
                                                        (resultItem) =>
                                                            resultItem.id ===
                                                                item.id &&
                                                            resultItem.providerId ===
                                                                item.providerId
                                                    ) ?? -1;
                                                analytics.trackMediaPreview(
                                                    item,
                                                    searchQuery,
                                                    position
                                                );
                                                actions.previewItem(item);
                                            }}
                                            disabled={isProcessing}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {state.results &&
                            state.results.items.length === 0 &&
                            !state.isLoading && (
                                <div className='flex h-64 items-center justify-center'>
                                    <div className='text-center'>
                                        <Search
                                            className={`mx-auto mb-4 size-8 ${
                                                theme === 'dark'
                                                    ? 'text-gray-600'
                                                    : 'text-gray-400'
                                            }`}
                                        />
                                        <p
                                            className={`font-inter text-sm ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            No images found. Try a different
                                            search term.
                                        </p>
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Selected Items Sidebar */}
                    {state.selectedItems.length > 0 && (
                        <div
                            className={`w-80 overflow-y-auto border-l ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className='p-6'>
                                <h3
                                    className={`mb-4 font-inter text-lg font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    Selected Images (
                                    {state.selectedItems.length})
                                </h3>

                                <div className='mb-6 space-y-3'>
                                    {state.selectedItems.map((item) => (
                                        <div
                                            key={`${item.providerId}-${item.id}`}
                                            className={`flex items-center space-x-3 rounded-lg border p-3 ${
                                                theme === 'dark'
                                                    ? 'border-revlr-dark-border bg-revlr-dark-bg'
                                                    : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={item.title}
                                                className='size-12 rounded object-cover'
                                            />
                                            <div className='min-w-0 flex-1'>
                                                <p
                                                    className={`truncate font-inter text-sm font-medium ${
                                                        theme === 'dark'
                                                            ? 'text-white'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {item.title}
                                                </p>
                                                <p
                                                    className={`truncate font-inter text-xs ${
                                                        theme === 'dark'
                                                            ? 'text-gray-400'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    by{' '}
                                                    {item.photographer?.name ||
                                                        'Unknown'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    actions.deselectItem(
                                                        item.id
                                                    )
                                                }
                                                disabled={isProcessing}
                                                className={`rounded-full p-1 transition-colors ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                                                aria-label={`Remove ${item.title}`}
                                            >
                                                <X className='size-4' />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleUseSelectedMedia}
                                    disabled={
                                        isProcessing ||
                                        state.selectedItems.length === 0
                                    }
                                    className={`w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-3 font-inter font-semibold text-white transition-opacity ${
                                        isProcessing ||
                                        state.selectedItems.length === 0
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'hover:opacity-90'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <div className='flex items-center justify-center space-x-2'>
                                            <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                                            <span>
                                                Processing...{' '}
                                                {Math.round(processingProgress)}
                                                %
                                            </span>
                                        </div>
                                    ) : (
                                        <div className='flex items-center justify-center space-x-2'>
                                            <Download className='size-4' />
                                            <span>Use Selected Images</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Provider Status Sidebar - Show when no items selected or as additional info */}
                    {(state.selectedItems.length === 0 ||
                        state.availableProviders.length > 0) && (
                        <div
                            className={`w-80 overflow-y-auto border-l ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className='space-y-4 p-6'>
                                {/* Provider Status Panel */}
                                <ProviderStatusPanel
                                    providers={state.availableProviders}
                                    activeProviders={state.activeProviders}
                                    onToggleProvider={actions.toggleProvider}
                                    onRetryProvider={(providerId) => {
                                        // Retry specific provider
                                        console.log(
                                            'Retrying provider:',
                                            providerId
                                        );
                                        if (actions.retryInitialization) {
                                            actions.retryInitialization();
                                        }
                                    }}
                                    compact={state.selectedItems.length > 0}
                                    showInactive={true}
                                />

                                {/* Search Tips */}
                                {!state.results &&
                                    !state.error &&
                                    !state.isLoading && (
                                        <div
                                            className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}
                                        >
                                            <h4
                                                className={`mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                            >
                                                Search Tips
                                            </h4>
                                            <ul
                                                className={`space-y-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                            >
                                                <li>
                                                    • Use specific keywords for
                                                    better results
                                                </li>
                                                <li>
                                                    • Try different search terms
                                                    if no results
                                                </li>
                                                <li>
                                                    • Use filters to narrow down
                                                    results
                                                </li>
                                                <li>
                                                    • Check provider status if
                                                    search fails
                                                </li>
                                            </ul>
                                        </div>
                                    )}

                                {/* Attribution Info */}
                                {state.selectedItems.length > 0 && (
                                    <div
                                        className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}
                                    >
                                        <h4
                                            className={`mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                        >
                                            Attribution Required
                                        </h4>
                                        <p
                                            className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                        >
                                            Some selected images may require
                                            attribution. Check individual image
                                            licenses for requirements.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Modal */}
                {state.previewItem && (
                    <MediaPreviewModal
                        item={state.previewItem}
                        onClose={actions.closePreview}
                        onSelect={() => handleMediaSelect(state.previewItem!)}
                        isSelected={state.selectedItems.some(
                            (selected) =>
                                selected.id === state.previewItem!.id &&
                                selected.providerId ===
                                    state.previewItem!.providerId
                        )}
                        disabled={isProcessing}
                        maxSelections={maxImages}
                        currentSelectionCount={state.selectedItems.length}
                    />
                )}
            </div>

            {/* Performance Dashboard */}
            <PerformanceDashboard
                isVisible={showPerformanceDashboard}
                onClose={() => setShowPerformanceDashboard(false)}
            />
        </div>
    );
};

export default MediaSearchModal;

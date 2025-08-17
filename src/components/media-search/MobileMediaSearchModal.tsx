'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useMediaSearch } from '@src/hooks/useMediaSearch';
import { useMediaSearchAnalytics } from '@src/hooks/useMediaSearchAnalytics';
import { useTouchGestures } from '@src/hooks/useTouchGestures';
import { useVoiceSearch } from '@src/hooks/useVoiceSearch';
import { useAccessibility } from '@src/hooks/useAccessibility';
import type { MediaItem } from '@src/types/media-search';
import type { EventImage } from '@src/types/event-creation';
import { EventCategory } from '@src/lib/constants/eventCategories';
import {
    X,
    Search,
    Filter,
    Mic,
    MicOff,
    Eye,
    Plus,
    Check,
    Download,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Grid3X3,
    List,
    Settings,
    Contrast,
    Type,
    Zap,
} from 'lucide-react';

interface MobileMediaSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMedia: (images: EventImage[]) => void;
    eventCategory?: string;
    existingImages?: EventImage[];
    maxImages?: number;
    className?: string;
}

type ViewMode = 'grid' | 'list';
type BottomSheetState = 'closed' | 'peek' | 'half' | 'full';

export const MobileMediaSearchModal: React.FC<MobileMediaSearchModalProps> = ({
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
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [bottomSheetState, setBottomSheetState] =
        useState<BottomSheetState>('closed');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [selectedPreview, setSelectedPreview] = useState<MediaItem | null>(
        null
    );

    // Refs for touch handling
    const modalRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const bottomSheetRef = useRef<HTMLDivElement>(null);

    // Initialize analytics
    const analytics = useMediaSearchAnalytics({
        eventCategory,
        enablePerformanceTracking: true,
        enableABTesting: true,
    });

    // Initialize media search
    const { state, actions } = useMediaSearch({
        eventCategory: eventCategory as EventCategory | undefined,
        maxSelectedItems: maxImages - existingImages.length,
        enableAutoSuggestions: true,
        preloadPopular: true,
    });

    // Initialize accessibility
    const accessibility = useAccessibility({
        enableHighContrast: true,
        enableReducedMotion: true,
        enableFocusManagement: true,
        enableScreenReaderSupport: true,
        announceChanges: true,
    });

    // Initialize voice search
    const voiceSearch = useVoiceSearch({
        onResult: (transcript) => {
            setSearchQuery(transcript);
            actions.search(transcript);
            accessibility.announce(`Voice search result: ${transcript}`);
        },
        onError: (error) => {
            accessibility.announce(`Voice search error: ${error}`, 'assertive');
        },
        onStart: () => {
            accessibility.announce('Voice search started', 'polite');
        },
        onEnd: () => {
            accessibility.announce('Voice search ended', 'polite');
        },
        language: 'en-US',
        continuous: false,
        interimResults: true,
    });

    // Initialize touch gestures
    const touchGestures = useTouchGestures({
        onSwipeLeft: () => {
            if (selectedPreview) {
                // Navigate to next image
                const currentIndex =
                    state.results?.items.findIndex(
                        (item) =>
                            item.id === selectedPreview.id &&
                            item.providerId === selectedPreview.providerId
                    ) ?? -1;
                const nextIndex = currentIndex + 1;
                if (state.results?.items[nextIndex]) {
                    setSelectedPreview(state.results.items[nextIndex]);
                }
            }
        },
        onSwipeRight: () => {
            if (selectedPreview) {
                // Navigate to previous image
                const currentIndex =
                    state.results?.items.findIndex(
                        (item) =>
                            item.id === selectedPreview.id &&
                            item.providerId === selectedPreview.providerId
                    ) ?? -1;
                const prevIndex = currentIndex - 1;
                if (state.results?.items[prevIndex]) {
                    setSelectedPreview(state.results.items[prevIndex]);
                }
            }
        },
        onSwipeDown: () => {
            if (selectedPreview) {
                setSelectedPreview(null);
            } else if (bottomSheetState !== 'closed') {
                setBottomSheetState('closed');
            }
        },
        onSwipeUp: () => {
            if (bottomSheetState === 'closed') {
                setBottomSheetState('peek');
            } else if (bottomSheetState === 'peek') {
                setBottomSheetState('half');
            } else if (bottomSheetState === 'half') {
                setBottomSheetState('full');
            }
        },
        onDoubleTap: () => {
            if (selectedPreview) {
                handleMediaSelect(selectedPreview);
            }
        },
        enableSwipe: true,
        enableDoubleTap: true,
        swipeThreshold: 50,
    });

    // Attach touch gestures to modal
    useEffect(() => {
        if (modalRef.current && isOpen) {
            return touchGestures.attachGestureListeners(modalRef.current);
        }
    }, [isOpen, touchGestures]);

    // Handle search input changes
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            if (query.trim()) {
                actions.search(query.trim());
            }
        },
        [actions]
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

            // Provide haptic feedback on mobile
            if ('vibrate' in navigator) {
                navigator.vibrate(wasSelected ? 50 : 100);
            }

            // Announce selection change
            accessibility.announce(
                wasSelected
                    ? `Deselected ${item.title}`
                    : `Selected ${item.title}. ${state.selectedItems.length + 1} of ${maxImages} images selected.`
            );

            // Track selection
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
        [
            actions,
            analytics,
            searchQuery,
            state.selectedItems,
            state.results,
            accessibility,
            maxImages,
        ]
    );

    // Handle using selected media
    const handleUseSelectedMedia = useCallback(async () => {
        if (state.selectedItems.length === 0) return;

        setIsProcessing(true);
        setProcessingProgress(0);

        try {
            analytics.trackMediaDownload(state.selectedItems, searchQuery);

            const processedImages: EventImage[] = [];

            for (let i = 0; i < state.selectedItems.length; i++) {
                const item = state.selectedItems[i];
                setProcessingProgress(
                    ((i + 1) / state.selectedItems.length) * 100
                );

                // Simulate processing delay
                await new Promise((resolve) => setTimeout(resolve, 500));

                const eventImage: EventImage = {
                    id: `external_${item.providerId}_${item.id}`,
                    url: item.downloadUrl,
                    cdnUrl: item.previewUrl,
                    name: item.title || `Image from ${item.providerId}`,
                    size: item.fileSize || 0,
                    mimeType: 'image/jpeg',
                    order: existingImages.length + i,
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

            // Provide success haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([100, 50, 100]);
            }

            accessibility.announce(
                `Successfully processed ${processedImages.length} images for your event.`
            );

            onSelectMedia(processedImages);
            onClose();
        } catch (error) {
            console.error('Failed to process selected media:', error);
            accessibility.announce(
                'Failed to process selected images. Please try again.',
                'assertive'
            );
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
        accessibility,
    ]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    if (selectedPreview) {
                        setSelectedPreview(null);
                    } else if (!isProcessing) {
                        onClose();
                    }
                    break;
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        handleUseSelectedMedia();
                    }
                    break;
                case 'v':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        voiceSearch.toggleListening();
                    }
                    break;
                case 'f':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        setShowFilters(!showFilters);
                    }
                    break;
                case 'g':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
        isOpen,
        selectedPreview,
        isProcessing,
        onClose,
        handleUseSelectedMedia,
        voiceSearch,
        showFilters,
        viewMode,
    ]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';

            // Focus management
            accessibility.manageFocus(searchInputRef.current);

            // Track modal open
            analytics.trackModalOpen();
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';

            // Restore focus
            accessibility.restoreFocus();
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isOpen, analytics, accessibility]);

    if (!isOpen) return null;

    return (
        <>
            {/* Accessibility announcements */}
            <div
                ref={accessibility.announceRef}
                className='sr-only'
                aria-live='polite'
                aria-atomic='true'
            />

            <div
                ref={modalRef}
                className={`fixed inset-0 z-50 bg-black/80 ${className}`}
                role='dialog'
                aria-modal='true'
                aria-labelledby='mobile-media-search-title'
                {...accessibility.getAriaAttributes(
                    'Media search modal',
                    'Search and select images for your event'
                )}
            >
                <div
                    className={`flex h-full flex-col ${
                        theme === 'dark' ? 'bg-revlr-dark-bg' : 'bg-white'
                    } ${accessibility.state.isHighContrast ? 'high-contrast' : ''}`}
                >
                    {/* Header */}
                    <div
                        className={`flex items-center justify-between border-b p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border'
                                : 'border-gray-200'
                        }`}
                    >
                        <div className='flex items-center space-x-3'>
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className={`rounded-full p-2 transition-colors ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                                {...accessibility.createButtonProps(
                                    'Close media search',
                                    onClose,
                                    {
                                        disabled: isProcessing,
                                    }
                                )}
                            >
                                <X className='size-5' />
                            </button>
                            <h1
                                id='mobile-media-search-title'
                                className={`font-inter text-lg font-semibold ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Media Library
                            </h1>
                        </div>

                        <div className='flex items-center space-x-2'>
                            {/* Accessibility Settings */}
                            <button
                                onClick={() => setBottomSheetState('full')}
                                className={`rounded-lg p-2 transition-colors ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                {...accessibility.createButtonProps(
                                    'Accessibility settings',
                                    () => setBottomSheetState('full')
                                )}
                            >
                                <Settings className='size-4' />
                            </button>

                            {/* View Mode Toggle */}
                            <button
                                onClick={() => {
                                    const newMode =
                                        viewMode === 'grid' ? 'list' : 'grid';
                                    setViewMode(newMode);
                                    accessibility.announce(
                                        `Switched to ${newMode} view`
                                    );
                                }}
                                className={`rounded-lg p-2 transition-colors ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                {...accessibility.createButtonProps(
                                    `Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`,
                                    () =>
                                        setViewMode(
                                            viewMode === 'grid'
                                                ? 'list'
                                                : 'grid'
                                        )
                                )}
                            >
                                {viewMode === 'grid' ? (
                                    <List className='size-4' />
                                ) : (
                                    <Grid3X3 className='size-4' />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div
                        className={`border-b p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border'
                                : 'border-gray-200'
                        }`}
                    >
                        <div className='relative'>
                            <Search
                                className={`absolute left-3 top-1/2 size-5 -translate-y-1/2 ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            />
                            <input
                                ref={searchInputRef}
                                type='text'
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder='Search for images...'
                                className={`w-full rounded-xl border py-3 pl-10 pr-20 font-inter text-base transition-colors focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                                }`}
                                disabled={isProcessing}
                                {...accessibility.getAriaAttributes(
                                    'Search for images',
                                    'Enter keywords to search for images'
                                )}
                            />
                            <div className='absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-1'>
                                {/* Voice Search Button */}
                                {voiceSearch.isSupported && (
                                    <button
                                        onClick={voiceSearch.toggleListening}
                                        disabled={isProcessing}
                                        className={`rounded-lg p-2 transition-colors ${
                                            voiceSearch.isListening
                                                ? 'bg-red-500 text-white'
                                                : theme === 'dark'
                                                  ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                                        {...accessibility.createButtonProps(
                                            voiceSearch.isListening
                                                ? 'Stop voice search'
                                                : 'Start voice search',
                                            voiceSearch.toggleListening,
                                            { disabled: isProcessing }
                                        )}
                                    >
                                        {voiceSearch.isListening ? (
                                            <MicOff className='size-4' />
                                        ) : (
                                            <Mic className='size-4' />
                                        )}
                                    </button>
                                )}

                                {/* Filters Button */}
                                <button
                                    onClick={() => {
                                        setShowFilters(!showFilters);
                                        accessibility.announce(
                                            showFilters
                                                ? 'Filters hidden'
                                                : 'Filters shown'
                                        );
                                    }}
                                    disabled={isProcessing}
                                    className={`rounded-lg p-2 transition-colors ${
                                        showFilters
                                            ? 'bg-revlr-primary-blue text-white'
                                            : theme === 'dark'
                                              ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                                    {...accessibility.createButtonProps(
                                        'Toggle filters',
                                        () => setShowFilters(!showFilters),
                                        {
                                            disabled: isProcessing,
                                            pressed: showFilters,
                                        }
                                    )}
                                >
                                    <Filter className='size-4' />
                                </button>
                            </div>
                        </div>

                        {/* Voice Search Status */}
                        {voiceSearch.isListening && (
                            <div className='mt-2 flex items-center space-x-2 text-sm text-red-500'>
                                <div className='size-2 animate-pulse rounded-full bg-red-500' />
                                <span>
                                    Listening... {voiceSearch.interimTranscript}
                                </span>
                            </div>
                        )}

                        {/* Voice Search Error */}
                        {voiceSearch.error && (
                            <div className='mt-2 flex items-center space-x-2 text-sm text-red-500'>
                                <AlertCircle className='size-4' />
                                <span>{voiceSearch.error}</span>
                                <button
                                    onClick={voiceSearch.clearError}
                                    className='text-red-600 underline'
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className='flex-1 overflow-hidden'>
                        {/* Loading State */}
                        {state.isLoading && !state.results && (
                            <div className='flex h-full items-center justify-center'>
                                <div className='text-center'>
                                    <div className='mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-revlr-primary-blue' />
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

                        {/* Error State */}
                        {state.error && (
                            <div className='flex h-full items-center justify-center p-4'>
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
                                        {state.error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {state.results && state.results.items.length > 0 && (
                            <div className='h-full overflow-y-auto p-4'>
                                {viewMode === 'grid' ? (
                                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                                        {state.results.items.map(
                                            (item, index) => {
                                                const isSelected =
                                                    state.selectedItems.some(
                                                        (selected) =>
                                                            selected.id ===
                                                                item.id &&
                                                            selected.providerId ===
                                                                item.providerId
                                                    );

                                                return (
                                                    <div
                                                        key={`${item.providerId}-${item.id}`}
                                                        className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                                            isSelected
                                                                ? 'border-revlr-primary-blue ring-2 ring-revlr-primary-blue/20'
                                                                : 'border-transparent'
                                                        }`}
                                                        role='button'
                                                        tabIndex={0}
                                                        onClick={() =>
                                                            handleMediaSelect(
                                                                item
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                e.preventDefault();
                                                                handleMediaSelect(
                                                                    item
                                                                );
                                                            }
                                                        }}
                                                        {...accessibility.getAriaAttributes(
                                                            `${item.title} by ${item.photographer?.name || 'Unknown'}`,
                                                            `Image ${index + 1} of ${state.results.items.length}. ${
                                                                isSelected
                                                                    ? 'Selected'
                                                                    : 'Not selected'
                                                            }`
                                                        )}
                                                    >
                                                        <img
                                                            src={
                                                                item.thumbnailUrl
                                                            }
                                                            alt={item.title}
                                                            className='size-full object-cover transition-transform duration-200 group-active:scale-95'
                                                            loading='lazy'
                                                        />

                                                        {/* Selection Overlay */}
                                                        {isSelected && (
                                                            <div className='absolute inset-0 bg-revlr-primary-blue/20'>
                                                                <div className='absolute right-2 top-2'>
                                                                    <div className='rounded-full bg-revlr-primary-blue p-1'>
                                                                        <Check className='size-3 text-white' />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Provider Badge */}
                                                        <div className='absolute left-2 top-2'>
                                                            <span className='rounded bg-black/70 px-2 py-1 text-xs font-medium uppercase text-white'>
                                                                {
                                                                    item.providerId
                                                                }
                                                            </span>
                                                        </div>

                                                        {/* Preview Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPreview(
                                                                    item
                                                                );
                                                            }}
                                                            className='absolute bottom-2 right-2 rounded-full bg-black/70 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100'
                                                            {...accessibility.createButtonProps(
                                                                `Preview ${item.title}`,
                                                                () =>
                                                                    setSelectedPreview(
                                                                        item
                                                                    )
                                                            )}
                                                        >
                                                            <Eye className='size-3' />
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        {state.results.items.map(
                                            (item, index) => {
                                                const isSelected =
                                                    state.selectedItems.some(
                                                        (selected) =>
                                                            selected.id ===
                                                                item.id &&
                                                            selected.providerId ===
                                                                item.providerId
                                                    );

                                                return (
                                                    <div
                                                        key={`${item.providerId}-${item.id}`}
                                                        className={`flex items-center space-x-3 rounded-lg border p-3 transition-colors ${
                                                            isSelected
                                                                ? 'border-revlr-primary-blue bg-revlr-primary-blue/5'
                                                                : theme ===
                                                                    'dark'
                                                                  ? 'border-revlr-dark-border bg-revlr-dark-card'
                                                                  : 'border-gray-200 bg-white'
                                                        }`}
                                                        role='button'
                                                        tabIndex={0}
                                                        onClick={() =>
                                                            handleMediaSelect(
                                                                item
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                e.preventDefault();
                                                                handleMediaSelect(
                                                                    item
                                                                );
                                                            }
                                                        }}
                                                        {...accessibility.getAriaAttributes(
                                                            `${item.title} by ${item.photographer?.name || 'Unknown'}`,
                                                            `Image ${index + 1} of ${state.results.items.length}. ${
                                                                isSelected
                                                                    ? 'Selected'
                                                                    : 'Not selected'
                                                            }`
                                                        )}
                                                    >
                                                        <img
                                                            src={
                                                                item.thumbnailUrl
                                                            }
                                                            alt={item.title}
                                                            className='size-16 rounded object-cover'
                                                            loading='lazy'
                                                        />
                                                        <div className='min-w-0 flex-1'>
                                                            <p
                                                                className={`truncate font-inter text-sm font-medium ${
                                                                    theme ===
                                                                    'dark'
                                                                        ? 'text-white'
                                                                        : 'text-gray-900'
                                                                }`}
                                                            >
                                                                {item.title}
                                                            </p>
                                                            <p
                                                                className={`truncate font-inter text-xs ${
                                                                    theme ===
                                                                    'dark'
                                                                        ? 'text-gray-400'
                                                                        : 'text-gray-600'
                                                                }`}
                                                            >
                                                                by{' '}
                                                                {item
                                                                    .photographer
                                                                    ?.name ||
                                                                    'Unknown'}
                                                            </p>
                                                            <div className='mt-1 flex items-center space-x-2'>
                                                                <span className='rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                                                                    {
                                                                        item.providerId
                                                                    }
                                                                </span>
                                                                {item.width &&
                                                                    item.height && (
                                                                        <span
                                                                            className={`text-xs ${
                                                                                theme ===
                                                                                'dark'
                                                                                    ? 'text-gray-400'
                                                                                    : 'text-gray-500'
                                                                            }`}
                                                                        >
                                                                            {
                                                                                item.width
                                                                            }{' '}
                                                                            ×{' '}
                                                                            {
                                                                                item.height
                                                                            }
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        </div>
                                                        <div className='flex items-center space-x-2'>
                                                            <button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setSelectedPreview(
                                                                        item
                                                                    );
                                                                }}
                                                                className={`rounded-lg p-2 transition-colors ${
                                                                    theme ===
                                                                    'dark'
                                                                        ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                                                }`}
                                                                {...accessibility.createButtonProps(
                                                                    `Preview ${item.title}`,
                                                                    () =>
                                                                        setSelectedPreview(
                                                                            item
                                                                        )
                                                                )}
                                                            >
                                                                <Eye className='size-4' />
                                                            </button>
                                                            <div
                                                                className={`rounded-full p-2 ${
                                                                    isSelected
                                                                        ? 'bg-revlr-primary-blue text-white'
                                                                        : theme ===
                                                                            'dark'
                                                                          ? 'bg-revlr-dark-border text-gray-400'
                                                                          : 'bg-gray-100 text-gray-500'
                                                                }`}
                                                            >
                                                                {isSelected ? (
                                                                    <Check className='size-4' />
                                                                ) : (
                                                                    <Plus className='size-4' />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}

                                {/* Load More */}
                                {state.hasMore && (
                                    <div className='mt-6 text-center'>
                                        <button
                                            onClick={actions.loadMore}
                                            disabled={state.isLoading}
                                            className='rounded-xl bg-revlr-primary-blue px-6 py-3 font-inter font-medium text-white transition-colors hover:bg-revlr-primary-blue/90 disabled:cursor-not-allowed disabled:opacity-50'
                                            {...accessibility.createButtonProps(
                                                'Load more images',
                                                actions.loadMore,
                                                { disabled: state.isLoading }
                                            )}
                                        >
                                            {state.isLoading
                                                ? 'Loading...'
                                                : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {state.results &&
                            state.results.items.length === 0 &&
                            !state.isLoading && (
                                <div className='flex h-full items-center justify-center p-4'>
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

                    {/* Bottom Action Bar */}
                    {state.selectedItems.length > 0 && (
                        <div
                            className={`border-t p-4 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p
                                        className={`font-inter text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {state.selectedItems.length} of{' '}
                                        {maxImages} selected
                                    </p>
                                    <p
                                        className={`font-inter text-xs ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        Tap images to select
                                    </p>
                                </div>
                                <button
                                    onClick={handleUseSelectedMedia}
                                    disabled={
                                        isProcessing ||
                                        state.selectedItems.length === 0
                                    }
                                    className='flex items-center space-x-2 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50'
                                    {...accessibility.createButtonProps(
                                        `Use ${state.selectedItems.length} selected images`,
                                        handleUseSelectedMedia,
                                        {
                                            disabled:
                                                isProcessing ||
                                                state.selectedItems.length ===
                                                    0,
                                        }
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className='size-4 animate-spin rounded-full border-b-2 border-white' />
                                            <span>
                                                {Math.round(processingProgress)}
                                                %
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className='size-4' />
                                            <span>Use Images</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Preview Modal */}
                {selectedPreview && (
                    <div className='absolute inset-0 z-10 bg-black/95'>
                        <div className='flex h-full flex-col'>
                            {/* Preview Header */}
                            <div className='flex items-center justify-between p-4'>
                                <button
                                    onClick={() => setSelectedPreview(null)}
                                    className='rounded-full bg-black/50 p-2 text-white'
                                    {...accessibility.createButtonProps(
                                        'Close preview',
                                        () => setSelectedPreview(null)
                                    )}
                                >
                                    <X className='size-5' />
                                </button>
                                <div className='flex items-center space-x-2'>
                                    <button
                                        onClick={() => {
                                            const currentIndex =
                                                state.results?.items.findIndex(
                                                    (item) =>
                                                        item.id ===
                                                            selectedPreview.id &&
                                                        item.providerId ===
                                                            selectedPreview.providerId
                                                ) ?? -1;
                                            const prevIndex = currentIndex - 1;
                                            if (
                                                state.results?.items[prevIndex]
                                            ) {
                                                setSelectedPreview(
                                                    state.results.items[
                                                        prevIndex
                                                    ]
                                                );
                                            }
                                        }}
                                        disabled={!state.results?.items.length}
                                        className='rounded-full bg-black/50 p-2 text-white disabled:opacity-50'
                                        {...accessibility.createButtonProps(
                                            'Previous image',
                                            () => {}
                                        )}
                                    >
                                        <ChevronLeft className='size-5' />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currentIndex =
                                                state.results?.items.findIndex(
                                                    (item) =>
                                                        item.id ===
                                                            selectedPreview.id &&
                                                        item.providerId ===
                                                            selectedPreview.providerId
                                                ) ?? -1;
                                            const nextIndex = currentIndex + 1;
                                            if (
                                                state.results?.items[nextIndex]
                                            ) {
                                                setSelectedPreview(
                                                    state.results.items[
                                                        nextIndex
                                                    ]
                                                );
                                            }
                                        }}
                                        disabled={!state.results?.items.length}
                                        className='rounded-full bg-black/50 p-2 text-white disabled:opacity-50'
                                        {...accessibility.createButtonProps(
                                            'Next image',
                                            () => {}
                                        )}
                                    >
                                        <ChevronRight className='size-5' />
                                    </button>
                                </div>
                            </div>

                            {/* Preview Image */}
                            <div className='flex flex-1 items-center justify-center p-4'>
                                <img
                                    src={selectedPreview.previewUrl}
                                    alt={selectedPreview.title}
                                    className='max-h-full max-w-full object-contain'
                                />
                            </div>

                            {/* Preview Footer */}
                            <div className='p-4'>
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='font-inter text-sm font-medium text-white'>
                                            {selectedPreview.title}
                                        </p>
                                        <p className='font-inter text-xs text-gray-300'>
                                            by{' '}
                                            {selectedPreview.photographer
                                                ?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleMediaSelect(selectedPreview);
                                            setSelectedPreview(null);
                                        }}
                                        className='rounded-xl bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white'
                                        {...accessibility.createButtonProps(
                                            `Select ${selectedPreview.title}`,
                                            () =>
                                                handleMediaSelect(
                                                    selectedPreview
                                                )
                                        )}
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Accessibility Settings Bottom Sheet */}
                {bottomSheetState !== 'closed' && (
                    <div
                        ref={bottomSheetRef}
                        className={`absolute inset-x-0 bottom-0 z-20 transition-transform duration-300${
                            bottomSheetState === 'full'
                                ? 'translate-y-0'
                                : bottomSheetState === 'half'
                                  ? 'translate-y-1/2'
                                  : 'translate-y-3/4'
                        } ${
                            theme === 'dark' ? 'bg-revlr-dark-card' : 'bg-white'
                        } rounded-t-xl border-t ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border'
                                : 'border-gray-200'
                        }`}
                    >
                        <div className='p-4'>
                            <div className='mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300' />
                            <h3
                                className={`mb-4 font-inter text-lg font-semibold ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Accessibility Settings
                            </h3>

                            <div className='space-y-4'>
                                {/* High Contrast Toggle */}
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                        <Contrast className='size-5 text-gray-500' />
                                        <div>
                                            <p
                                                className={`font-inter text-sm font-medium ${
                                                    theme === 'dark'
                                                        ? 'text-white'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                High Contrast
                                            </p>
                                            <p
                                                className={`font-inter text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Improve visibility with higher
                                                contrast
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={
                                            accessibility.toggleHighContrast
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            accessibility.state.isHighContrast
                                                ? 'bg-revlr-primary-blue'
                                                : 'bg-gray-300'
                                        }`}
                                        {...accessibility.createButtonProps(
                                            'Toggle high contrast mode',
                                            accessibility.toggleHighContrast,
                                            {
                                                pressed:
                                                    accessibility.state
                                                        .isHighContrast,
                                            }
                                        )}
                                    >
                                        <span
                                            className={`inline-block size-4 rounded-full bg-white transition-transform${
                                                accessibility.state
                                                    .isHighContrast
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Reduced Motion Toggle */}
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                        <Zap className='size-5 text-gray-500' />
                                        <div>
                                            <p
                                                className={`font-inter text-sm font-medium ${
                                                    theme === 'dark'
                                                        ? 'text-white'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                Reduced Motion
                                            </p>
                                            <p
                                                className={`font-inter text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Minimize animations and
                                                transitions
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={
                                            accessibility.toggleReducedMotion
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            accessibility.state.isReducedMotion
                                                ? 'bg-revlr-primary-blue'
                                                : 'bg-gray-300'
                                        }`}
                                        {...accessibility.createButtonProps(
                                            'Toggle reduced motion',
                                            accessibility.toggleReducedMotion,
                                            {
                                                pressed:
                                                    accessibility.state
                                                        .isReducedMotion,
                                            }
                                        )}
                                    >
                                        <span
                                            className={`inline-block size-4 rounded-full bg-white transition-transform${
                                                accessibility.state
                                                    .isReducedMotion
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Font Size */}
                                <div>
                                    <div className='mb-2 flex items-center space-x-3'>
                                        <Type className='size-5 text-gray-500' />
                                        <p
                                            className={`font-inter text-sm font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            Font Size
                                        </p>
                                    </div>
                                    <div className='flex space-x-2'>
                                        {(
                                            [
                                                'small',
                                                'medium',
                                                'large',
                                                'extra-large',
                                            ] as const
                                        ).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() =>
                                                    accessibility.setFontSize(
                                                        size
                                                    )
                                                }
                                                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                                    accessibility.state
                                                        .fontSize === size
                                                        ? 'bg-revlr-primary-blue text-white'
                                                        : theme === 'dark'
                                                          ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-bg'
                                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                {...accessibility.createButtonProps(
                                                    `Set font size to ${size}`,
                                                    () =>
                                                        accessibility.setFontSize(
                                                            size
                                                        ),
                                                    {
                                                        pressed:
                                                            accessibility.state
                                                                .fontSize ===
                                                            size,
                                                    }
                                                )}
                                            >
                                                {size.charAt(0).toUpperCase() +
                                                    size.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setBottomSheetState('closed')}
                                className='mt-6 w-full rounded-xl bg-gray-100 py-3 font-inter font-medium text-gray-700 dark:bg-revlr-dark-border dark:text-gray-300'
                                {...accessibility.createButtonProps(
                                    'Close accessibility settings',
                                    () => setBottomSheetState('closed')
                                )}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default MobileMediaSearchModal;

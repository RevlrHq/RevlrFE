'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useMediaSearch } from '@src/hooks/useMediaSearch';
import type { MediaItem, MediaFilters } from '@src/types/media-search';
import type { EventImage } from '@src/types/event-creation';
import {
    X,
    Search,
    Filter,
    Eye,
    Plus,
    Check,
    Download,
    AlertCircle,
} from 'lucide-react';

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

    const { state, actions } = useMediaSearch({
        eventCategory: eventCategory as any,
        maxSelectedItems: maxImages - existingImages.length,
        enableAutoSuggestions: true,
        preloadPopular: true,
    });

    // Handle search input changes
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            if (state.setQuery) {
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
                actions.search(searchQuery.trim());
            }
        },
        [searchQuery, actions]
    );

    // Handle suggestion selection
    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            setSearchQuery(suggestion);
            actions.applySuggestion(suggestion);
        },
        [actions]
    );

    // Handle media selection
    const handleMediaSelect = useCallback(
        (item: MediaItem) => {
            actions.toggleItemSelection(item);
        },
        [actions]
    );

    // Handle using selected media
    const handleUseSelectedMedia = useCallback(async () => {
        if (state.selectedItems.length === 0) return;

        setIsProcessing(true);
        setProcessingProgress(0);

        try {
            // Mock processing - in real implementation, this would download and process images
            const processedImages: EventImage[] = [];

            for (let i = 0; i < state.selectedItems.length; i++) {
                const item = state.selectedItems[i];
                setProcessingProgress(
                    ((i + 1) / state.selectedItems.length) * 100
                );

                // Simulate processing delay
                await new Promise((resolve) => setTimeout(resolve, 500));

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
                    source: 'external' as any,
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

            onSelectMedia(processedImages);
            onClose();
        } catch (error) {
            console.error('Failed to process selected media:', error);
            // Handle error - show toast or error message
        } finally {
            setIsProcessing(false);
            setProcessingProgress(0);
        }
    }, [state.selectedItems, existingImages.length, onSelectMedia, onClose]);

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

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

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
                            <button
                                type='button'
                                onClick={() => setShowFilters(!showFilters)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors ${
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
                            <div className='flex h-64 items-center justify-center'>
                                <div className='text-center'>
                                    <AlertCircle className='mx-auto mb-4 size-8 text-red-500' />
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
                                            onPreview={() =>
                                                actions.previewItem(item)
                                            }
                                            theme={theme}
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
                        theme={theme}
                        disabled={isProcessing}
                    />
                )}
            </div>
        </div>
    );
};

// Media Card Component
interface MediaCardProps {
    item: MediaItem;
    isSelected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    theme: 'light' | 'dark';
    disabled?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
    item,
    isSelected,
    onSelect,
    onPreview,
    theme,
    disabled = false,
}) => {
    return (
        <div
            className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                isSelected
                    ? 'border-revlr-primary-blue ring-2 ring-revlr-primary-blue/20'
                    : 'border-transparent hover:border-revlr-primary-blue/50'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            <img
                src={item.thumbnailUrl}
                alt={item.title}
                className='size-full object-cover transition-transform duration-200 group-hover:scale-105'
                loading='lazy'
            />

            {/* Overlay with actions */}
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                <div className='absolute bottom-2 left-2 right-2'>
                    <p className='truncate font-inter text-xs text-white'>
                        {item.title}
                    </p>
                    <p className='font-inter text-xs text-gray-300'>
                        by {item.photographer?.name || 'Unknown'}
                    </p>
                </div>

                <div className='absolute right-2 top-2 flex space-x-1'>
                    <button
                        onClick={onPreview}
                        disabled={disabled}
                        className='rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label={`Preview ${item.title}`}
                    >
                        <Eye className='size-4' />
                    </button>
                    <button
                        onClick={onSelect}
                        disabled={disabled}
                        className={`rounded-full p-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSelected
                                ? 'bg-revlr-primary-blue hover:bg-revlr-primary-blue/80'
                                : 'bg-black/50 hover:bg-revlr-primary-blue'
                        }`}
                        aria-label={
                            isSelected
                                ? `Deselect ${item.title}`
                                : `Select ${item.title}`
                        }
                    >
                        {isSelected ? (
                            <Check className='size-4' />
                        ) : (
                            <Plus className='size-4' />
                        )}
                    </button>
                </div>
            </div>

            {/* Provider badge */}
            <div className='absolute left-2 top-2'>
                <span
                    className={`rounded px-2 py-1 text-xs font-medium text-white ${
                        item.providerId === 'unsplash'
                            ? 'bg-black/70'
                            : item.providerId === 'pexels'
                              ? 'bg-green-600/70'
                              : 'bg-blue-600/70'
                    }`}
                >
                    {item.providerId}
                </span>
            </div>

            {/* Attribution indicator */}
            {item.attribution.required && (
                <div className='absolute bottom-2 right-2'>
                    <div className='rounded bg-orange-500/70 px-1.5 py-0.5'>
                        <span className='text-xs font-medium text-white'>
                            ©
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Media Preview Modal Component
interface MediaPreviewModalProps {
    item: MediaItem;
    onClose: () => void;
    onSelect: () => void;
    isSelected: boolean;
    theme: 'light' | 'dark';
    disabled?: boolean;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
    item,
    onClose,
    onSelect,
    isSelected,
    theme,
    disabled = false,
}) => {
    return (
        <div className='z-60 fixed inset-0 flex items-center justify-center bg-black/90 p-4'>
            <div className='relative max-h-full w-full max-w-6xl'>
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={disabled}
                    className='absolute -right-4 -top-4 z-10 rounded-full bg-white p-2 text-gray-900 shadow-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
                    aria-label='Close preview'
                >
                    <X className='size-5' />
                </button>

                <div className='flex h-full max-h-[90vh] overflow-hidden rounded-xl bg-white'>
                    {/* Image preview */}
                    <div className='flex flex-1 items-center justify-center bg-gray-100'>
                        <img
                            src={item.previewUrl}
                            alt={item.title}
                            className='max-h-full max-w-full object-contain'
                        />
                    </div>

                    {/* Metadata sidebar */}
                    <div className='w-80 overflow-y-auto bg-white p-6'>
                        <div className='space-y-4'>
                            <div>
                                <h3 className='font-inter text-lg font-semibold text-gray-900'>
                                    {item.title}
                                </h3>
                                {item.photographer && (
                                    <p className='font-inter text-sm text-gray-600'>
                                        by {item.photographer.name}
                                    </p>
                                )}
                            </div>

                            <div className='space-y-2'>
                                <div className='flex justify-between'>
                                    <span className='font-inter text-sm text-gray-600'>
                                        Dimensions:
                                    </span>
                                    <span className='font-inter text-sm text-gray-900'>
                                        {item.width} × {item.height}
                                    </span>
                                </div>
                                {item.fileSize && (
                                    <div className='flex justify-between'>
                                        <span className='font-inter text-sm text-gray-600'>
                                            Size:
                                        </span>
                                        <span className='font-inter text-sm text-gray-900'>
                                            {(
                                                item.fileSize /
                                                (1024 * 1024)
                                            ).toFixed(1)}{' '}
                                            MB
                                        </span>
                                    </div>
                                )}
                                <div className='flex justify-between'>
                                    <span className='font-inter text-sm text-gray-600'>
                                        Provider:
                                    </span>
                                    <span className='font-inter text-sm capitalize text-gray-900'>
                                        {item.providerId}
                                    </span>
                                </div>
                            </div>

                            {item.attribution.required && (
                                <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'>
                                    <p className='font-inter text-sm text-orange-800'>
                                        <strong>Attribution Required:</strong>{' '}
                                        This image requires attribution when
                                        used.
                                    </p>
                                </div>
                            )}

                            <div className='space-y-3 pt-4'>
                                <button
                                    onClick={onSelect}
                                    disabled={disabled}
                                    className={`w-full rounded-xl px-4 py-3 font-inter font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isSelected
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple hover:opacity-90'
                                    }`}
                                >
                                    {isSelected
                                        ? 'Selected'
                                        : 'Select This Image'}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={disabled}
                                    className='w-full rounded-xl border border-gray-300 px-4 py-3 font-inter font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaSearchModal;

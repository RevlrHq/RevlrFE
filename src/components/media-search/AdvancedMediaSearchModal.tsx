'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { useMediaSearch } from '@/hooks/useMediaSearch';
import { MediaItem } from '@/types/media-search';
import { EventCategory } from '@/lib/constants/eventCategories';
import { mediaFavoritesService } from '@/lib/services/media/MediaFavoritesService';
import {
    mediaCollectionsService,
    MediaCollection,
} from '@/lib/services/media/MediaCollectionsService';
import { mediaBulkOperationsService } from '@/lib/services/media/MediaBulkOperationsService';
import { DragDropMediaGrid } from './DragDropMediaGrid';
import { MediaExportModal } from './MediaExportModal';
import { SelectedMediaPanel } from './SelectedMediaPanel';
import {
    X,
    Search,
    Filter,
    Heart,
    Share2,
    Sparkles,
    Grid,
    Folder,
    CheckSquare,
    Square,
} from 'lucide-react';

interface AdvancedMediaSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMedia: (items: MediaItem[]) => void;
    eventCategory?: EventCategory;
    eventTitle?: string;
    maxItems?: number;
    className?: string;
}

type ViewMode = 'grid' | 'list' | 'favorites' | 'collections';
type SelectionMode = 'single' | 'multiple';
type SortOption = 'relevance' | 'date' | 'size' | 'provider' | 'title';

export const AdvancedMediaSearchModal: React.FC<
    AdvancedMediaSearchModalProps
> = ({
    isOpen,
    onClose,
    onSelectMedia,
    eventCategory,
    eventTitle,
    maxItems = 10,
    className = '',
}) => {
    const { theme } = useTheme();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('single');
    const [sortBy] = useState<SortOption>('relevance');
    const [sortOrder] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Advanced features state
    const [favorites, setFavorites] = useState<MediaItem[]>([]);
    const [collections, setCollections] = useState<MediaCollection[]>([]);
    const [selectedCollection, setSelectedCollection] =
        useState<MediaCollection | null>(null);
    const [bulkSelectedItems, setBulkSelectedItems] = useState<Set<string>>(
        new Set()
    );

    const { state, actions } = useMediaSearch({
        eventCategory,
        maxSelectedItems: maxItems,
        enableAutoSuggestions: true,
        preloadPopular: true,
    });

    // Load favorites and collections on mount
    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const favs = await mediaFavoritesService.getFavorites();
                setFavorites(favs);
            } catch (error) {
                console.debug('Failed to load favorites:', error);
            }
        };

        const loadCollections = async () => {
            try {
                const colls = await mediaCollectionsService.getAllCollections();
                setCollections(colls);
            } catch (error) {
                console.debug('Failed to load collections:', error);
            }
        };

        if (isOpen) {
            loadFavorites();
            loadCollections();
        }
    }, [isOpen]);

    const loadFavorites = useCallback(async () => {
        try {
            const favs = await mediaFavoritesService.getFavorites();
            setFavorites(
                favs.map((fav) => ({
                    ...fav,
                    tags: fav.tags || [],
                }))
            );
        } catch (error) {
            console.debug('Failed to load favorites:', error);
        }
    }, []);

    const loadCollections = useCallback(async () => {
        try {
            const colls = await mediaCollectionsService.getAllCollections();
            setCollections(colls);
        } catch (error) {
            console.debug('Failed to load collections:', error);
        }
    }, []);

    // Handle collections
    const addToCollection = useCallback(
        async (items: MediaItem[], collectionId?: string) => {
            try {
                let targetCollectionId = collectionId;

                if (!targetCollectionId) {
                    // Create new collection
                    const collectionName = `${eventTitle || 'Event'} Media - ${new Date().toLocaleDateString()}`;
                    const newCollection =
                        await mediaCollectionsService.createCollection(
                            collectionName,
                            `Media collection for ${eventTitle || 'event'}`,
                            [eventCategory || 'general']
                        );
                    targetCollectionId = newCollection.id;
                }

                await mediaCollectionsService.addMultipleItemsToCollection(
                    targetCollectionId,
                    items
                );
                await loadCollections();
            } catch (error) {
                console.debug('Failed to add to collection:', error);
            }
        },
        [eventTitle, eventCategory, loadCollections]
    );

    // Handle bulk selection
    const toggleBulkSelection = useCallback((item: MediaItem) => {
        const itemKey = `${item.providerId}-${item.id}`;
        setBulkSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) {
                newSet.delete(itemKey);
            } else {
                newSet.add(itemKey);
            }
            return newSet;
        });
    }, []);

    const clearBulkSelection = useCallback(() => {
        setBulkSelectedItems(new Set());
    }, []);

    // Helper functions
    const getBulkSelectedItems = useCallback((): MediaItem[] => {
        if (!state.results) return [];

        return state.results.items.filter((item) =>
            bulkSelectedItems.has(`${item.providerId}-${item.id}`)
        );
    }, [state.results, bulkSelectedItems]);

    // Handle bulk operations
    const handleBulkFavorites = useCallback(async () => {
        const selectedItems = getBulkSelectedItems();
        if (selectedItems.length === 0) return;

        try {
            await mediaBulkOperationsService.addMultipleToFavorites(
                selectedItems,
                [eventCategory || 'general']
            );
            await loadFavorites();
            clearBulkSelection();
        } catch (error) {
            console.debug('Failed to add bulk favorites:', error);
        }
    }, [
        eventCategory,
        clearBulkSelection,
        getBulkSelectedItems,
        loadFavorites,
    ]);

    const handleBulkCollection = useCallback(async () => {
        const selectedItems = getBulkSelectedItems();
        if (selectedItems.length === 0) return;

        await addToCollection(selectedItems);
        clearBulkSelection();
    }, [addToCollection, clearBulkSelection, getBulkSelectedItems]);

    const handleBulkDownload = useCallback(async () => {
        const selectedItems = getBulkSelectedItems();
        if (selectedItems.length === 0) return;

        try {
            await mediaBulkOperationsService.downloadMultiple(selectedItems);
            clearBulkSelection();
        } catch (error) {
            console.debug('Failed to bulk download:', error);
        }
    }, [clearBulkSelection, getBulkSelectedItems]);

    // Sort and filter items
    const getSortedItems = useCallback(
        (items: MediaItem[]): MediaItem[] => {
            if (sortBy === 'relevance') {
                // For relevance, just return items as-is since they're already sorted by relevance from the API
                return items;
            }
            return mediaBulkOperationsService.sortItems(
                items,
                sortBy as 'date' | 'size' | 'provider' | 'title',
                sortOrder
            );
        },
        [sortBy, sortOrder]
    );

    // Render different view modes
    const renderContent = () => {
        switch (viewMode) {
            case 'favorites':
                return renderFavoritesView();
            case 'collections':
                return renderCollectionsView();
            default:
                return renderSearchResults();
        }
    };

    const renderSearchResults = () => {
        if (state.isLoading && !state.results) {
            return (
                <div className='flex h-64 items-center justify-center'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                        <p
                            className={`font-inter text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            Searching for images...
                        </p>
                    </div>
                </div>
            );
        }

        if (state.results && state.results.items.length > 0) {
            const sortedItems = getSortedItems(state.results.items);

            return (
                <DragDropMediaGrid
                    items={sortedItems}
                    selectedItems={state.selectedItems}
                    onReorder={actions.reorderItems}
                    onSelect={(item) => {
                        if (selectionMode === 'multiple') {
                            toggleBulkSelection(item);
                        } else {
                            actions.toggleItemSelection(item);
                        }
                    }}
                    onPreview={actions.previewItem}
                    showReorderControls={state.selectedItems.length > 1}
                    gridCols={6}
                />
            );
        }

        return (
            <div className='flex h-64 items-center justify-center'>
                <div className='text-center'>
                    <Search
                        className={`mx-auto mb-4 size-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}
                    />
                    <p
                        className={`font-inter text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        {state.query
                            ? 'No images found. Try a different search term.'
                            : 'Start searching for images...'}
                    </p>
                </div>
            </div>
        );
    };

    const renderFavoritesView = () => {
        if (favorites.length === 0) {
            return (
                <div className='flex h-64 items-center justify-center'>
                    <div className='text-center'>
                        <Heart
                            className={`mx-auto mb-4 size-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}
                        />
                        <p
                            className={`font-inter text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            No favorite images yet
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <DragDropMediaGrid
                items={favorites}
                selectedItems={state.selectedItems}
                onReorder={() => {}} // Favorites don't support reordering
                onSelect={actions.toggleItemSelection}
                onPreview={actions.previewItem}
                showReorderControls={false}
                gridCols={6}
            />
        );
    };

    const renderCollectionsView = () => {
        if (selectedCollection) {
            return (
                <div>
                    <div className='mb-4 flex items-center justify-between'>
                        <div>
                            <h3
                                className={`font-inter text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                            >
                                {selectedCollection.name}
                            </h3>
                            <p
                                className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                {selectedCollection.items.length} items
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedCollection(null)}
                            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-card text-gray-300 hover:bg-revlr-dark-border'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Back to Collections
                        </button>
                    </div>

                    <DragDropMediaGrid
                        items={selectedCollection.items}
                        selectedItems={state.selectedItems}
                        onReorder={(items) => {
                            // Update collection item order
                            const itemIds = items.map(
                                (item) => `${item.providerId}-${item.id}`
                            );
                            mediaCollectionsService.reorderCollectionItems(
                                selectedCollection.id,
                                itemIds
                            );
                        }}
                        onSelect={actions.toggleItemSelection}
                        onPreview={actions.previewItem}
                        showReorderControls={true}
                        gridCols={6}
                    />
                </div>
            );
        }

        return (
            <div>
                <div className='mb-4 flex items-center justify-between'>
                    <h3
                        className={`font-inter text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    >
                        Collections
                    </h3>
                    <button
                        onClick={() => addToCollection([])}
                        className='rounded-lg bg-revlr-primary-blue px-3 py-1 text-sm font-medium text-white hover:opacity-90'
                    >
                        New Collection
                    </button>
                </div>

                {collections.length === 0 ? (
                    <div className='flex h-64 items-center justify-center'>
                        <div className='text-center'>
                            <Folder
                                className={`mx-auto mb-4 size-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}
                            />
                            <p
                                className={`font-inter text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                No collections yet
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
                        {collections.map((collection) => (
                            <div
                                key={collection.id}
                                onClick={() =>
                                    setSelectedCollection(collection)
                                }
                                className={`cursor-pointer rounded-lg border p-4 transition-colors hover:border-revlr-primary-blue ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className='mb-2 aspect-square overflow-hidden rounded bg-gray-100'>
                                    {collection.coverImage ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={
                                                    collection.coverImage
                                                        ?.thumbnailUrl
                                                }
                                                alt={collection.name}
                                                className='size-full object-cover'
                                            />
                                        </>
                                    ) : (
                                        <div className='flex h-full items-center justify-center'>
                                            <Folder className='size-8 text-gray-400' />
                                        </div>
                                    )}
                                </div>
                                <h4
                                    className={`font-inter font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                >
                                    {collection.name}
                                </h4>
                                <p
                                    className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                    {collection.items.length} items
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 ${className}`}
            >
                <div
                    className={`relative max-h-[95vh] w-full max-w-7xl overflow-hidden rounded-xl shadow-2xl ${
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
                        <div className='flex items-center space-x-4'>
                            <div>
                                <h2
                                    className={`font-inter text-xl font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    Advanced Media Search
                                </h2>
                                <p
                                    className={`mt-1 font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Search, organize, and manage your event
                                    media
                                </p>
                            </div>
                        </div>

                        {/* View Mode Tabs */}
                        <div className='flex items-center space-x-2'>
                            {[
                                {
                                    mode: 'grid' as ViewMode,
                                    icon: Grid,
                                    label: 'Search',
                                },
                                {
                                    mode: 'favorites' as ViewMode,
                                    icon: Heart,
                                    label: 'Favorites',
                                },
                                {
                                    mode: 'collections' as ViewMode,
                                    icon: Folder,
                                    label: 'Collections',
                                },
                            ].map(({ mode, icon: Icon, label }) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        viewMode === mode
                                            ? 'bg-revlr-primary-blue text-white'
                                            : theme === 'dark'
                                              ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className='size-4' />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className={`rounded-full p-2 transition-colors ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                        >
                            <X className='size-5' />
                        </button>
                    </div>

                    {/* Search Bar and Controls */}
                    {viewMode === 'grid' && (
                        <div
                            className={`border-b p-6 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border'
                                    : 'border-gray-200'
                            }`}
                        >
                            <div className='mb-4 flex items-center space-x-4'>
                                {/* Search Input */}
                                <div className='relative flex-1'>
                                    <Search
                                        className={`absolute left-3 top-1/2 size-5 -translate-y-1/2 ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-500'
                                        }`}
                                    />
                                    <input
                                        type='text'
                                        value={state.query}
                                        onChange={(e) =>
                                            actions.search(e.target.value)
                                        }
                                        placeholder='Search for images...'
                                        className={`w-full rounded-xl border py-3 pl-10 pr-4 font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                                        }`}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className='flex items-center space-x-2'>
                                    <button
                                        onClick={() =>
                                            setSelectionMode(
                                                selectionMode === 'single'
                                                    ? 'multiple'
                                                    : 'single'
                                            )
                                        }
                                        className={`rounded-lg p-2 transition-colors ${
                                            selectionMode === 'multiple'
                                                ? 'bg-revlr-primary-blue text-white'
                                                : theme === 'dark'
                                                  ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                        title={
                                            selectionMode === 'single'
                                                ? 'Enable bulk selection'
                                                : 'Disable bulk selection'
                                        }
                                    >
                                        {selectionMode === 'multiple' ? (
                                            <CheckSquare className='size-4' />
                                        ) : (
                                            <Square className='size-4' />
                                        )}
                                    </button>

                                    <button
                                        onClick={() =>
                                            setShowFilters(!showFilters)
                                        }
                                        className={`rounded-lg p-2 transition-colors ${
                                            showFilters
                                                ? 'bg-revlr-primary-blue text-white'
                                                : theme === 'dark'
                                                  ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                    >
                                        <Filter className='size-4' />
                                    </button>

                                    <button
                                        onClick={() => setShowExportModal(true)}
                                        disabled={
                                            state.selectedItems.length === 0
                                        }
                                        className='rounded-lg p-2 text-gray-400 transition-colors hover:bg-revlr-dark-card hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
                                        title='Export selected items'
                                    >
                                        <Share2 className='size-4' />
                                    </button>
                                </div>
                            </div>

                            {/* Bulk Actions Bar */}
                            {selectionMode === 'multiple' &&
                                bulkSelectedItems.size > 0 && (
                                    <div
                                        className={`rounded-lg border p-3 ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                                : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className='flex items-center justify-between'>
                                            <span
                                                className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                                            >
                                                {bulkSelectedItems.size} items
                                                selected
                                            </span>
                                            <div className='flex items-center space-x-2'>
                                                <button
                                                    onClick={
                                                        handleBulkFavorites
                                                    }
                                                    className='rounded px-3 py-1 text-sm text-revlr-primary-blue hover:bg-revlr-primary-blue/10'
                                                >
                                                    Add to Favorites
                                                </button>
                                                <button
                                                    onClick={
                                                        handleBulkCollection
                                                    }
                                                    className='rounded px-3 py-1 text-sm text-revlr-primary-blue hover:bg-revlr-primary-blue/10'
                                                >
                                                    Add to Collection
                                                </button>
                                                <button
                                                    onClick={handleBulkDownload}
                                                    className='rounded px-3 py-1 text-sm text-revlr-primary-blue hover:bg-revlr-primary-blue/10'
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={clearBulkSelection}
                                                    className='rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100'
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Template Suggestions */}
                            {templateSuggestions.length > 0 && !state.query && (
                                <div className='mt-4'>
                                    <div className='mb-2 flex items-center space-x-2'>
                                        <Sparkles className='size-4 text-revlr-accent-purple' />
                                        <span
                                            className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                                        >
                                            Suggested for your event
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-6 gap-2'>
                                        {templateSuggestions.map((item) => (
                                            <button
                                                key={`${item.providerId}-${item.id}`}
                                                onClick={() =>
                                                    actions.toggleItemSelection(
                                                        item
                                                    )
                                                }
                                                className='aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-revlr-primary-blue'
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={item.thumbnailUrl}
                                                    alt={item.title}
                                                    className='size-full object-cover'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Content */}
                    <div className='flex h-[calc(95vh-300px)]'>
                        {/* Results Area */}
                        <div className='flex-1 overflow-y-auto p-6'>
                            {renderContent()}
                        </div>

                        {/* Selected Items Panel */}
                        {state.selectedItems.length > 0 && (
                            <SelectedMediaPanel
                                selectedItems={state.selectedItems}
                                onRemoveItem={actions.deselectItem}
                                onClearAll={actions.clearSelection}
                                onPreviewItem={actions.previewItem}
                                onDownloadSelected={actions.downloadSelected}
                                onReorderItems={actions.reorderItems}
                                maxSelections={maxItems}
                                isDownloading={state.isDownloading}
                                downloadProgress={state.downloadProgress}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className={`border-t p-6 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border'
                                : 'border-gray-200'
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-4 text-sm'>
                                <span
                                    className={
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }
                                >
                                    {state.selectedItems.length} of {maxItems}{' '}
                                    selected
                                </span>
                                {state.results && (
                                    <span
                                        className={
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }
                                    >
                                        {state.results.totalResults} results
                                        found
                                    </span>
                                )}
                            </div>

                            <div className='flex space-x-3'>
                                <button
                                    onClick={onClose}
                                    className={`rounded-xl border px-4 py-2 font-inter font-medium transition-colors ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() =>
                                        onSelectMedia(state.selectedItems)
                                    }
                                    disabled={state.selectedItems.length === 0}
                                    className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 font-inter font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    Use Selected ({state.selectedItems.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <MediaExportModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    items={state.selectedItems}
                    title='Export Selected Media'
                />
            )}
        </>
    );
};

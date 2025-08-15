import { useState, useCallback, useEffect, useMemo } from 'react';
import { useMediaSearch, UseMediaSearchOptions } from './useMediaSearch';
import { MediaItem } from '@/types/media-search';
import {
    mediaFavoritesService,
    FavoriteMediaItem,
} from '@/lib/services/media/MediaFavoritesService';
import {
    mediaCollectionsService,
    MediaCollection,
} from '@/lib/services/media/MediaCollectionsService';
import {
    mediaBulkOperationsService,
    BulkOperationProgress,
    BulkOperationResult,
} from '@/lib/services/media/MediaBulkOperationsService';
import {
    eventTemplateMediaService,
    EventTemplate,
    TemplateMediaRecommendation,
} from '@/lib/services/media/EventTemplateMediaService';

export interface AdvancedMediaSearchState {
    // Base media search state
    baseState: ReturnType<typeof useMediaSearch>['state'];

    // Favorites
    favorites: FavoriteMediaItem[];
    favoritesLoading: boolean;

    // Collections
    collections: MediaCollection[];
    collectionsLoading: boolean;
    selectedCollection: MediaCollection | null;

    // Bulk operations
    bulkSelectedItems: Set<string>;
    bulkOperationInProgress: boolean;
    bulkOperationProgress: BulkOperationProgress | null;

    // Templates and suggestions
    availableTemplates: EventTemplate[];
    templateRecommendations: TemplateMediaRecommendation[];
    templateSuggestions: MediaItem[];
    templatesLoading: boolean;

    // UI state
    viewMode: 'search' | 'favorites' | 'collections' | 'templates';
    selectionMode: 'single' | 'multiple';
    sortBy: 'relevance' | 'date' | 'size' | 'provider' | 'title';
    sortOrder: 'asc' | 'desc';
    showAdvancedFilters: boolean;
}

export interface AdvancedMediaSearchActions {
    // Base actions
    baseActions: ReturnType<typeof useMediaSearch>['actions'];

    // Favorites management
    toggleFavorite: (item: MediaItem) => Promise<void>;
    addToFavorites: (items: MediaItem[], tags?: string[]) => Promise<void>;
    removeFromFavorites: (items: MediaItem[]) => Promise<void>;
    loadFavorites: () => Promise<void>;
    searchFavorites: (query: string) => Promise<void>;

    // Collections management
    createCollection: (
        name: string,
        description?: string,
        tags?: string[]
    ) => Promise<MediaCollection>;
    addToCollection: (
        items: MediaItem[],
        collectionId?: string
    ) => Promise<void>;
    removeFromCollection: (
        items: MediaItem[],
        collectionId: string
    ) => Promise<void>;
    selectCollection: (collection: MediaCollection | null) => void;
    loadCollections: () => Promise<void>;
    shareCollection: (collectionId: string) => Promise<string>;
    exportCollection: (
        collectionId: string,
        format: 'json' | 'csv' | 'zip'
    ) => Promise<void>;

    // Bulk operations
    toggleBulkSelection: (item: MediaItem) => void;
    selectAllVisible: () => void;
    clearBulkSelection: () => void;
    bulkAddToFavorites: (tags?: string[]) => Promise<BulkOperationResult>;
    bulkAddToCollection: (
        collectionId?: string
    ) => Promise<BulkOperationResult>;
    bulkDownload: () => Promise<BulkOperationResult>;
    bulkRemove: () => Promise<BulkOperationResult>;

    // Template and suggestions
    loadTemplates: () => Promise<void>;
    loadTemplateRecommendations: () => Promise<void>;
    loadTemplateSuggestions: () => Promise<void>;
    applyTemplate: (templateId: string) => Promise<void>;
    generateSearchFromTemplate: (templateId: string) => void;

    // UI actions
    setViewMode: (mode: AdvancedMediaSearchState['viewMode']) => void;
    setSelectionMode: (mode: AdvancedMediaSearchState['selectionMode']) => void;
    setSortBy: (sortBy: AdvancedMediaSearchState['sortBy']) => void;
    setSortOrder: (order: AdvancedMediaSearchState['sortOrder']) => void;
    toggleAdvancedFilters: () => void;

    // Utility actions
    isItemFavorite: (item: MediaItem) => boolean;
    isBulkSelected: (item: MediaItem) => boolean;
    getBulkSelectedItems: () => MediaItem[];
    getSortedItems: (items: MediaItem[]) => MediaItem[];
    getFilteredItems: (items: MediaItem[]) => MediaItem[];
}

export interface UseAdvancedMediaSearchOptions extends UseMediaSearchOptions {
    enableFavorites?: boolean;
    enableCollections?: boolean;
    enableBulkOperations?: boolean;
    enableTemplates?: boolean;
    autoLoadFavorites?: boolean;
    autoLoadCollections?: boolean;
    autoLoadTemplates?: boolean;
}

export function useAdvancedMediaSearch(
    options: UseAdvancedMediaSearchOptions = {}
): {
    state: AdvancedMediaSearchState;
    actions: AdvancedMediaSearchActions;
} {
    const {
        enableFavorites = true,
        enableCollections = true,
        enableBulkOperations = true,
        enableTemplates = true,
        autoLoadFavorites = true,
        autoLoadCollections = true,
        autoLoadTemplates = true,
        ...baseOptions
    } = options;

    // Base media search hook
    const baseMediaSearch = useMediaSearch(baseOptions);

    // Advanced state
    const [favorites, setFavorites] = useState<FavoriteMediaItem[]>([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);

    const [collections, setCollections] = useState<MediaCollection[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const [selectedCollection, setSelectedCollection] =
        useState<MediaCollection | null>(null);

    const [bulkSelectedItems, setBulkSelectedItems] = useState<Set<string>>(
        new Set()
    );
    const [bulkOperationInProgress, setBulkOperationInProgress] =
        useState(false);
    const [bulkOperationProgress, setBulkOperationProgress] =
        useState<BulkOperationProgress | null>(null);

    const [availableTemplates, setAvailableTemplates] = useState<
        EventTemplate[]
    >([]);
    const [templateRecommendations, setTemplateRecommendations] = useState<
        TemplateMediaRecommendation[]
    >([]);
    const [templateSuggestions, setTemplateSuggestions] = useState<MediaItem[]>(
        []
    );
    const [templatesLoading, setTemplatesLoading] = useState(false);

    const [viewMode, setViewMode] =
        useState<AdvancedMediaSearchState['viewMode']>('search');
    const [selectionMode, setSelectionMode] =
        useState<AdvancedMediaSearchState['selectionMode']>('single');
    const [sortBy, setSortBy] =
        useState<AdvancedMediaSearchState['sortBy']>('relevance');
    const [sortOrder, setSortOrder] =
        useState<AdvancedMediaSearchState['sortOrder']>('desc');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Auto-load data on mount
    useEffect(() => {
        if (enableFavorites && autoLoadFavorites) {
            loadFavorites();
        }
        if (enableCollections && autoLoadCollections) {
            loadCollections();
        }
        if (enableTemplates && autoLoadTemplates) {
            loadTemplates();
            if (baseOptions.eventCategory) {
                loadTemplateRecommendations();
                loadTemplateSuggestions();
            }
        }
    }, [
        enableFavorites,
        enableCollections,
        enableTemplates,
        autoLoadFavorites,
        autoLoadCollections,
        autoLoadTemplates,
        baseOptions.eventCategory,
    ]);

    // Favorites actions
    const loadFavorites = useCallback(async () => {
        if (!enableFavorites) return;

        setFavoritesLoading(true);
        try {
            const favs = await mediaFavoritesService.getFavorites();
            setFavorites(favs);
        } catch (error) {
            console.error('Failed to load favorites:', error);
        } finally {
            setFavoritesLoading(false);
        }
    }, [enableFavorites]);

    const toggleFavorite = useCallback(
        async (item: MediaItem) => {
            if (!enableFavorites) return;

            try {
                const isFav = await mediaFavoritesService.isFavorite(
                    item.id,
                    item.providerId
                );

                if (isFav) {
                    await mediaFavoritesService.removeFromFavorites(
                        item.id,
                        item.providerId
                    );
                } else {
                    const tags = baseOptions.eventCategory
                        ? [baseOptions.eventCategory]
                        : [];
                    await mediaFavoritesService.addToFavorites(item, tags);
                }

                await loadFavorites();
            } catch (error) {
                console.error('Failed to toggle favorite:', error);
            }
        },
        [enableFavorites, baseOptions.eventCategory, loadFavorites]
    );

    const addToFavorites = useCallback(
        async (items: MediaItem[], tags: string[] = []) => {
            if (!enableFavorites) return;

            try {
                await mediaFavoritesService.addMultipleToFavorites(items, tags);
                await loadFavorites();
            } catch (error) {
                console.error('Failed to add to favorites:', error);
            }
        },
        [enableFavorites, loadFavorites]
    );

    const removeFromFavorites = useCallback(
        async (items: MediaItem[]) => {
            if (!enableFavorites) return;

            try {
                const itemIds = items.map((item) => ({
                    id: item.id,
                    providerId: item.providerId,
                }));
                await mediaFavoritesService.removeMultipleFromFavorites(
                    itemIds
                );
                await loadFavorites();
            } catch (error) {
                console.error('Failed to remove from favorites:', error);
            }
        },
        [enableFavorites, loadFavorites]
    );

    const searchFavorites = useCallback(
        async (query: string) => {
            if (!enableFavorites) return;

            try {
                const results =
                    await mediaFavoritesService.searchFavorites(query);
                setFavorites(results);
            } catch (error) {
                console.error('Failed to search favorites:', error);
            }
        },
        [enableFavorites]
    );

    // Collections actions
    const loadCollections = useCallback(async () => {
        if (!enableCollections) return;

        setCollectionsLoading(true);
        try {
            const colls = await mediaCollectionsService.getAllCollections();
            setCollections(colls);
        } catch (error) {
            console.error('Failed to load collections:', error);
        } finally {
            setCollectionsLoading(false);
        }
    }, [enableCollections]);

    const createCollection = useCallback(
        async (
            name: string,
            description?: string,
            tags: string[] = []
        ): Promise<MediaCollection> => {
            if (!enableCollections) throw new Error('Collections not enabled');

            const collection = await mediaCollectionsService.createCollection(
                name,
                description,
                tags
            );
            await loadCollections();
            return collection;
        },
        [enableCollections, loadCollections]
    );

    const addToCollection = useCallback(
        async (items: MediaItem[], collectionId?: string) => {
            if (!enableCollections) return;

            try {
                let targetCollectionId = collectionId;

                if (!targetCollectionId) {
                    // Create new collection
                    const collectionName = `Collection - ${new Date().toLocaleDateString()}`;
                    const newCollection =
                        await createCollection(collectionName);
                    targetCollectionId = newCollection.id;
                }

                await mediaCollectionsService.addMultipleItemsToCollection(
                    targetCollectionId,
                    items
                );
                await loadCollections();
            } catch (error) {
                console.error('Failed to add to collection:', error);
            }
        },
        [enableCollections, createCollection, loadCollections]
    );

    const removeFromCollection = useCallback(
        async (items: MediaItem[], collectionId: string) => {
            if (!enableCollections) return;

            try {
                const itemIds = items.map((item) => ({
                    id: item.id,
                    providerId: item.providerId,
                }));
                await mediaCollectionsService.removeMultipleItemsFromCollection(
                    collectionId,
                    itemIds
                );
                await loadCollections();
            } catch (error) {
                console.error('Failed to remove from collection:', error);
            }
        },
        [enableCollections, loadCollections]
    );

    const selectCollection = useCallback(
        (collection: MediaCollection | null) => {
            setSelectedCollection(collection);
        },
        []
    );

    const shareCollection = useCallback(
        async (collectionId: string): Promise<string> => {
            if (!enableCollections) throw new Error('Collections not enabled');

            const shareData =
                await mediaCollectionsService.shareCollection(collectionId);
            return shareData.shareUrl;
        },
        [enableCollections]
    );

    const exportCollection = useCallback(
        async (collectionId: string, format: 'json' | 'csv' | 'zip') => {
            if (!enableCollections) return;

            try {
                const blob = await mediaCollectionsService.exportCollection(
                    collectionId,
                    format
                );

                // Download the blob
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `collection-${collectionId}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Failed to export collection:', error);
            }
        },
        [enableCollections]
    );

    // Bulk operations actions
    const toggleBulkSelection = useCallback(
        (item: MediaItem) => {
            if (!enableBulkOperations) return;

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
        },
        [enableBulkOperations]
    );

    const selectAllVisible = useCallback(() => {
        if (!enableBulkOperations || !baseMediaSearch.state.results) return;

        const allKeys = baseMediaSearch.state.results.items.map(
            (item) => `${item.providerId}-${item.id}`
        );
        setBulkSelectedItems(new Set(allKeys));
    }, [enableBulkOperations, baseMediaSearch.state.results]);

    const clearBulkSelection = useCallback(() => {
        setBulkSelectedItems(new Set());
    }, []);

    const getBulkSelectedItems = useCallback((): MediaItem[] => {
        if (!baseMediaSearch.state.results) return [];

        return baseMediaSearch.state.results.items.filter((item) =>
            bulkSelectedItems.has(`${item.providerId}-${item.id}`)
        );
    }, [baseMediaSearch.state.results, bulkSelectedItems]);

    const bulkAddToFavorites = useCallback(
        async (tags: string[] = []): Promise<BulkOperationResult> => {
            if (!enableBulkOperations || !enableFavorites) {
                throw new Error('Bulk operations or favorites not enabled');
            }

            const selectedItems = getBulkSelectedItems();
            setBulkOperationInProgress(true);

            try {
                const result =
                    await mediaBulkOperationsService.addMultipleToFavorites(
                        selectedItems,
                        tags,
                        (progress) => setBulkOperationProgress(progress)
                    );

                await loadFavorites();
                clearBulkSelection();
                return result;
            } finally {
                setBulkOperationInProgress(false);
                setBulkOperationProgress(null);
            }
        },
        [
            enableBulkOperations,
            enableFavorites,
            getBulkSelectedItems,
            loadFavorites,
            clearBulkSelection,
        ]
    );

    const bulkAddToCollection = useCallback(
        async (collectionId?: string): Promise<BulkOperationResult> => {
            if (!enableBulkOperations || !enableCollections) {
                throw new Error('Bulk operations or collections not enabled');
            }

            const selectedItems = getBulkSelectedItems();
            setBulkOperationInProgress(true);

            try {
                let targetCollectionId = collectionId;

                if (!targetCollectionId) {
                    const newCollection = await createCollection(
                        `Bulk Collection - ${new Date().toLocaleDateString()}`
                    );
                    targetCollectionId = newCollection.id;
                }

                const result =
                    await mediaBulkOperationsService.addMultipleToCollection(
                        selectedItems,
                        targetCollectionId,
                        (progress) => setBulkOperationProgress(progress)
                    );

                await loadCollections();
                clearBulkSelection();
                return result;
            } finally {
                setBulkOperationInProgress(false);
                setBulkOperationProgress(null);
            }
        },
        [
            enableBulkOperations,
            enableCollections,
            getBulkSelectedItems,
            createCollection,
            loadCollections,
            clearBulkSelection,
        ]
    );

    const bulkDownload = useCallback(async (): Promise<BulkOperationResult> => {
        if (!enableBulkOperations) {
            throw new Error('Bulk operations not enabled');
        }

        const selectedItems = getBulkSelectedItems();
        setBulkOperationInProgress(true);

        try {
            const result = await mediaBulkOperationsService.downloadMultiple(
                selectedItems,
                {},
                (progress) => setBulkOperationProgress(progress)
            );

            clearBulkSelection();
            return result;
        } finally {
            setBulkOperationInProgress(false);
            setBulkOperationProgress(null);
        }
    }, [enableBulkOperations, getBulkSelectedItems, clearBulkSelection]);

    const bulkRemove = useCallback(async (): Promise<BulkOperationResult> => {
        if (!enableBulkOperations) {
            throw new Error('Bulk operations not enabled');
        }

        const selectedItems = getBulkSelectedItems();

        // Remove from current context (favorites or collection)
        if (viewMode === 'favorites') {
            await removeFromFavorites(selectedItems);
        } else if (selectedCollection) {
            await removeFromCollection(selectedItems, selectedCollection.id);
        }

        clearBulkSelection();

        return {
            success: true,
            completed: selectedItems.length,
            failed: 0,
            errors: [],
            duration: 0,
        };
    }, [
        enableBulkOperations,
        getBulkSelectedItems,
        viewMode,
        selectedCollection,
        removeFromFavorites,
        removeFromCollection,
        clearBulkSelection,
    ]);

    // Template actions
    const loadTemplates = useCallback(async () => {
        if (!enableTemplates) return;

        setTemplatesLoading(true);
        try {
            const templates = await eventTemplateMediaService.getAllTemplates();
            setAvailableTemplates(templates);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setTemplatesLoading(false);
        }
    }, [enableTemplates]);

    const loadTemplateRecommendations = useCallback(async () => {
        if (!enableTemplates || !baseOptions.eventCategory) return;

        try {
            const recommendations =
                await eventTemplateMediaService.getMediaRecommendationsForEvent(
                    baseOptions.eventCategory,
                    baseOptions.eventTitle,
                    baseOptions.eventDescription
                );
            setTemplateRecommendations(recommendations);
        } catch (error) {
            console.error('Failed to load template recommendations:', error);
        }
    }, [
        enableTemplates,
        baseOptions.eventCategory,
        baseOptions.eventTitle,
        baseOptions.eventDescription,
    ]);

    const loadTemplateSuggestions = useCallback(async () => {
        if (!enableTemplates || !baseOptions.eventCategory) return;

        try {
            const suggestions =
                await eventTemplateMediaService.autoPopulateEventMedia(
                    `${baseOptions.eventCategory.toLowerCase()}-template`,
                    6
                );
            setTemplateSuggestions(suggestions);
        } catch (error) {
            console.error('Failed to load template suggestions:', error);
        }
    }, [enableTemplates, baseOptions.eventCategory]);

    const applyTemplate = useCallback(
        async (templateId: string) => {
            if (!enableTemplates) return;

            try {
                const suggestions =
                    await eventTemplateMediaService.autoPopulateEventMedia(
                        templateId,
                        10
                    );

                // Add suggestions to selected items
                suggestions.forEach((item) => {
                    baseMediaSearch.actions.selectItem(item);
                });
            } catch (error) {
                console.error('Failed to apply template:', error);
            }
        },
        [enableTemplates, baseMediaSearch.actions]
    );

    const generateSearchFromTemplate = useCallback(
        (templateId: string) => {
            if (!enableTemplates) return;

            const template = availableTemplates.find(
                (t) => t.id === templateId
            );
            if (!template) return;

            const queries =
                eventTemplateMediaService.generateSearchQueriesFromTemplate(
                    template
                );
            if (queries.length > 0) {
                baseMediaSearch.actions.search(queries[0]);
            }
        },
        [enableTemplates, availableTemplates, baseMediaSearch.actions]
    );

    // Utility functions
    const isItemFavorite = useCallback(
        (item: MediaItem): boolean => {
            return favorites.some(
                (fav) =>
                    fav.id === item.id && fav.providerId === item.providerId
            );
        },
        [favorites]
    );

    const isBulkSelected = useCallback(
        (item: MediaItem): boolean => {
            return bulkSelectedItems.has(`${item.providerId}-${item.id}`);
        },
        [bulkSelectedItems]
    );

    const getSortedItems = useCallback(
        (items: MediaItem[]): MediaItem[] => {
            return mediaBulkOperationsService.sortItems(
                items,
                sortBy,
                sortOrder
            );
        },
        [sortBy, sortOrder]
    );

    const getFilteredItems = useCallback((items: MediaItem[]): MediaItem[] => {
        // Apply any additional filtering logic here
        return items;
    }, []);

    // Memoized state and actions
    const state = useMemo<AdvancedMediaSearchState>(
        () => ({
            baseState: baseMediaSearch.state,
            favorites,
            favoritesLoading,
            collections,
            collectionsLoading,
            selectedCollection,
            bulkSelectedItems,
            bulkOperationInProgress,
            bulkOperationProgress,
            availableTemplates,
            templateRecommendations,
            templateSuggestions,
            templatesLoading,
            viewMode,
            selectionMode,
            sortBy,
            sortOrder,
            showAdvancedFilters,
        }),
        [
            baseMediaSearch.state,
            favorites,
            favoritesLoading,
            collections,
            collectionsLoading,
            selectedCollection,
            bulkSelectedItems,
            bulkOperationInProgress,
            bulkOperationProgress,
            availableTemplates,
            templateRecommendations,
            templateSuggestions,
            templatesLoading,
            viewMode,
            selectionMode,
            sortBy,
            sortOrder,
            showAdvancedFilters,
        ]
    );

    const actions = useMemo<AdvancedMediaSearchActions>(
        () => ({
            baseActions: baseMediaSearch.actions,
            toggleFavorite,
            addToFavorites,
            removeFromFavorites,
            loadFavorites,
            searchFavorites,
            createCollection,
            addToCollection,
            removeFromCollection,
            selectCollection,
            loadCollections,
            shareCollection,
            exportCollection,
            toggleBulkSelection,
            selectAllVisible,
            clearBulkSelection,
            bulkAddToFavorites,
            bulkAddToCollection,
            bulkDownload,
            bulkRemove,
            loadTemplates,
            loadTemplateRecommendations,
            loadTemplateSuggestions,
            applyTemplate,
            generateSearchFromTemplate,
            setViewMode,
            setSelectionMode,
            setSortBy,
            setSortOrder,
            toggleAdvancedFilters: () =>
                setShowAdvancedFilters((prev) => !prev),
            isItemFavorite,
            isBulkSelected,
            getBulkSelectedItems,
            getSortedItems,
            getFilteredItems,
        }),
        [
            baseMediaSearch.actions,
            toggleFavorite,
            addToFavorites,
            removeFromFavorites,
            loadFavorites,
            searchFavorites,
            createCollection,
            addToCollection,
            removeFromCollection,
            selectCollection,
            loadCollections,
            shareCollection,
            exportCollection,
            toggleBulkSelection,
            selectAllVisible,
            clearBulkSelection,
            bulkAddToFavorites,
            bulkAddToCollection,
            bulkDownload,
            bulkRemove,
            loadTemplates,
            loadTemplateRecommendations,
            loadTemplateSuggestions,
            applyTemplate,
            generateSearchFromTemplate,
            isItemFavorite,
            isBulkSelected,
            getBulkSelectedItems,
            getSortedItems,
            getFilteredItems,
        ]
    );

    return { state, actions };
}

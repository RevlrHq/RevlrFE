import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDebouncedValue } from './useDebounce';
import { MediaSearchService } from '@/lib/services/media/MediaSearchService';
import { MediaSearchServiceFactory } from '@/lib/services/media/MediaSearchServiceFactory';
import {
    MediaSearchQuery,
    MediaSearchResult,
    MediaItem,
    MediaFilters,
    ProviderStatus,
} from '@/types/media-search';
import {
    MediaSelectionValidator,
    SelectionValidationResult,
    SelectionLimits,
    DEFAULT_EVENT_LIMITS,
} from '@/lib/utils/mediaSelectionValidation';

export interface MediaSearchState {
    // Search state
    query: string;
    filters: MediaFilters;
    results: MediaSearchResult | null;
    isLoading: boolean;
    error: string | null;

    // UI state
    selectedItems: MediaItem[];
    previewItem: MediaItem | null;
    currentPage: number;
    hasMore: boolean;

    // Provider state
    availableProviders: ProviderStatus[];
    activeProviders: string[];
    providerErrors: Record<string, string>;

    // Initialization state
    isInitializing: boolean;
    isInitialized: boolean;
    initializationError: string | null;
    initializationWarnings: string[];

    // Suggestions
    suggestions: string[];
    showSuggestions: boolean;

    // Selection validation
    selectionValidation: SelectionValidationResult;
    isDownloading: boolean;
    downloadProgress: number;
}

export interface MediaSearchActions {
    // Search actions
    search: (query: string, filters?: MediaFilters) => Promise<void>;
    loadMore: () => Promise<void>;
    clearSearch: () => void;

    // Item selection
    selectItem: (item: MediaItem) => void;
    deselectItem: (itemId: string) => void;
    toggleItemSelection: (item: MediaItem) => void;
    clearSelection: () => void;
    reorderItems: (items: MediaItem[]) => void;

    // Preview
    previewItem: (item: MediaItem) => void;
    closePreview: () => void;

    // Filters
    applyFilters: (filters: MediaFilters) => Promise<void>;
    clearFilters: () => void;

    // Providers
    toggleProvider: (providerId: string) => void;

    // Initialization
    retryInitialization: () => Promise<void>;
    getInitializationStatus: () => {
        isInitializing: boolean;
        isInitialized: boolean;
        error: string | null;
        warnings: string[];
    };

    // Suggestions
    getSuggestions: (query: string) => Promise<void>;
    applySuggestion: (suggestion: string) => void;
    hideSuggestions: () => void;

    // Popular content
    loadPopularContent: (category?: string) => Promise<void>;

    // Download and processing
    downloadSelected: () => Promise<void>;
    validateSelection: (item?: MediaItem) => SelectionValidationResult;
}

export interface UseMediaSearchOptions {
    initialQuery?: string;
    initialFilters?: MediaFilters;
    maxSelectedItems?: number;
    debounceDelay?: number;
    selectionLimits?: SelectionLimits;
    onDownloadComplete?: (items: MediaItem[]) => void;
    onDownloadError?: (error: Error) => void;
}

export interface UseMediaSearchReturn {
    state: MediaSearchState;
    actions: MediaSearchActions;
    service: MediaSearchService | null;
}

export function useMediaSearch(
    options: UseMediaSearchOptions = {}
): UseMediaSearchReturn {
    const {
        initialQuery = '',
        initialFilters = {},
        maxSelectedItems = 10,
        debounceDelay = 500,
        selectionLimits = DEFAULT_EVENT_LIMITS,
        onDownloadComplete,
        onDownloadError,
    } = options;

    // Service and validator refs
    const serviceRef = useRef<MediaSearchService | null>(null);
    const validatorRef = useRef<MediaSelectionValidator | null>(null);
    const [isServiceReady, setIsServiceReady] = useState(false);

    // Initialize validator
    if (!validatorRef.current) {
        validatorRef.current = new MediaSelectionValidator({
            ...selectionLimits,
            maxItems: maxSelectedItems,
        });
    }

    const validator = validatorRef.current;

    // State management
    const [state, setState] = useState<MediaSearchState>({
        query: initialQuery,
        filters: initialFilters,
        results: null,
        isLoading: false,
        error: null,
        selectedItems: [],
        previewItem: null,
        currentPage: 1,
        hasMore: false,
        availableProviders: [],
        activeProviders: [],
        providerErrors: {},
        isInitializing: true,
        isInitialized: false,
        initializationError: null,
        initializationWarnings: [],
        suggestions: [],
        showSuggestions: false,
        selectionValidation: { isValid: true, errors: [], warnings: [] },
        isDownloading: false,
        downloadProgress: 0,
    });

    // Initialize service
    useEffect(() => {
        const initializeService = async () => {
            try {
                setState((prev) => ({
                    ...prev,
                    isInitializing: true,
                    error: null,
                }));

                const service = await MediaSearchServiceFactory.create({
                    cacheSize: 1000,
                    cacheExpiryMinutes: 30,
                    enabledProviders: ['unsplash', 'pexels', 'pixabay'],
                });

                serviceRef.current = service;
                setIsServiceReady(true);

                // Get provider status
                const providers = service.getAvailableProviders();
                const providerStatuses = providers.map((provider) =>
                    provider.getStatus()
                );

                setState((prev) => ({
                    ...prev,
                    isInitializing: false,
                    isInitialized: true,
                    availableProviders: providerStatuses,
                    activeProviders: providerStatuses
                        .filter((status) => status.isAvailable)
                        .map((status) => status.id),
                }));
            } catch (error) {
                console.error(
                    'Failed to initialize media search service:',
                    error
                );
                setState((prev) => ({
                    ...prev,
                    isInitializing: false,
                    isInitialized: false,
                    initializationError:
                        error instanceof Error
                            ? error.message
                            : 'Failed to initialize',
                    error: 'Failed to initialize media search service',
                }));
            }
        };

        initializeService();
    }, []);

    // Debounced search query
    const debouncedQuery = useDebouncedValue(state.query, debounceDelay);

    // Auto-search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim() && isServiceReady && serviceRef.current) {
            // Call search directly without dependency to avoid circular reference
            const performSearch = async () => {
                if (!serviceRef.current) return;

                setState((prev) => ({
                    ...prev,
                    isLoading: true,
                    error: null,
                    currentPage: 1,
                    showSuggestions: false,
                }));

                try {
                    const searchQuery: MediaSearchQuery = {
                        query: debouncedQuery.trim(),
                        filters: state.filters,
                        providers:
                            state.activeProviders.length > 0
                                ? state.activeProviders
                                : undefined,
                        page: 1,
                        perPage: 30,
                        sortBy: 'relevance',
                        sortOrder: 'desc',
                    };

                    const result =
                        await serviceRef.current.searchMedia(searchQuery);

                    setState((prev) => ({
                        ...prev,
                        results: result,
                        hasMore: result.hasMore,
                        isLoading: false,
                        providerErrors: {},
                    }));
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Search failed';
                    setState((prev) => ({
                        ...prev,
                        error: errorMessage,
                        isLoading: false,
                        results: null,
                    }));
                }
            };

            performSearch();
        }
    }, [debouncedQuery, isServiceReady, state.filters, state.activeProviders]);

    // Search function
    const search = useCallback(
        async (query: string, filters: MediaFilters = {}) => {
            if (!query.trim() || !serviceRef.current) {
                setState((prev) => ({ ...prev, results: null, error: null }));
                return;
            }

            setState((prev) => ({
                ...prev,
                isLoading: true,
                error: null,
                currentPage: 1,
                showSuggestions: false,
            }));

            try {
                const searchQuery: MediaSearchQuery = {
                    query: query.trim(),
                    filters,
                    providers:
                        state.activeProviders.length > 0
                            ? state.activeProviders
                            : undefined,
                    page: 1,
                    perPage: 30,
                    sortBy: 'relevance',
                    sortOrder: 'desc',
                };

                const result =
                    await serviceRef.current.searchMedia(searchQuery);

                setState((prev) => ({
                    ...prev,
                    results: result,
                    hasMore: result.hasMore,
                    isLoading: false,
                    providerErrors: {},
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Search failed';
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                    results: null,
                }));
            }
        },
        [state.activeProviders]
    );

    // Load more results
    const loadMore = useCallback(async () => {
        if (
            !state.results ||
            !state.hasMore ||
            state.isLoading ||
            !serviceRef.current
        ) {
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const searchQuery: MediaSearchQuery = {
                query: state.query,
                filters: state.filters,
                providers:
                    state.activeProviders.length > 0
                        ? state.activeProviders
                        : undefined,
                page: state.currentPage + 1,
                perPage: 30,
            };

            const result = await serviceRef.current.searchMedia(searchQuery);

            setState((prev) => ({
                ...prev,
                results: prev.results
                    ? {
                          ...result,
                          items: [...prev.results.items, ...result.items],
                      }
                    : result,
                currentPage: prev.currentPage + 1,
                hasMore: result.hasMore,
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load more results';
            setState((prev) => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, [
        state.query,
        state.filters,
        state.activeProviders,
        state.results,
        state.hasMore,
        state.isLoading,
        state.currentPage,
    ]);

    // Clear search
    const clearSearch = useCallback(() => {
        setState((prev) => ({
            ...prev,
            query: '',
            results: null,
            error: null,
            currentPage: 1,
            hasMore: false,
            suggestions: [],
            showSuggestions: false,
        }));
    }, []);

    // Validation function
    const validateSelection = useCallback(
        (newItem?: MediaItem): SelectionValidationResult => {
            if (newItem) {
                return validator.validateAddition(state.selectedItems, newItem);
            } else {
                return validator.validateSelection(state.selectedItems);
            }
        },
        [validator, state.selectedItems]
    );

    // Item selection
    const selectItem = useCallback(
        (item: MediaItem) => {
            setState((prev) => {
                const validation = validator.validateAddition(
                    prev.selectedItems,
                    item
                );

                if (!validation.isValid) {
                    return {
                        ...prev,
                        selectionValidation: validation,
                    };
                }

                const isAlreadySelected = prev.selectedItems.some(
                    (selected) =>
                        selected.id === item.id &&
                        selected.providerId === item.providerId
                );

                if (isAlreadySelected) {
                    return prev;
                }

                const newSelectedItems = [...prev.selectedItems, item];
                const newValidation =
                    validator.validateSelection(newSelectedItems);

                return {
                    ...prev,
                    selectedItems: newSelectedItems,
                    selectionValidation: newValidation,
                };
            });
        },
        [validator]
    );

    const deselectItem = useCallback(
        (itemId: string) => {
            setState((prev) => {
                const newSelectedItems = prev.selectedItems.filter(
                    (item) =>
                        !(
                            item.id === itemId ||
                            `${item.providerId}-${item.id}` === itemId
                        )
                );

                const newValidation =
                    validator.validateSelection(newSelectedItems);

                return {
                    ...prev,
                    selectedItems: newSelectedItems,
                    selectionValidation: newValidation,
                };
            });
        },
        [validator]
    );

    const toggleItemSelection = useCallback(
        (item: MediaItem) => {
            const isSelected = state.selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );

            if (isSelected) {
                deselectItem(item.id);
            } else {
                selectItem(item);
            }
        },
        [state.selectedItems, selectItem, deselectItem]
    );

    const clearSelection = useCallback(() => {
        setState((prev) => ({
            ...prev,
            selectedItems: [],
            selectionValidation: { isValid: true, errors: [], warnings: [] },
        }));
    }, []);

    const reorderItems = useCallback((items: MediaItem[]) => {
        setState((prev) => ({
            ...prev,
            selectedItems: items,
        }));
    }, []);

    // Preview
    const previewItem = useCallback((item: MediaItem) => {
        setState((prev) => ({ ...prev, previewItem: item }));
    }, []);

    const closePreview = useCallback(() => {
        setState((prev) => ({ ...prev, previewItem: null }));
    }, []);

    // Filters
    const applyFilters = useCallback(
        async (filters: MediaFilters) => {
            setState((prev) => ({ ...prev, filters }));

            if (state.query.trim()) {
                await search(state.query, filters);
            }
        },
        [state.query, search]
    );

    const clearFilters = useCallback(() => {
        setState((prev) => ({ ...prev, filters: {} }));

        if (state.query.trim()) {
            search(state.query, {});
        }
    }, [state.query, search]);

    // Provider management
    const toggleProvider = useCallback((providerId: string) => {
        setState((prev) => {
            const isActive = prev.activeProviders.includes(providerId);
            const newActiveProviders = isActive
                ? prev.activeProviders.filter((id) => id !== providerId)
                : [...prev.activeProviders, providerId];

            return {
                ...prev,
                activeProviders: newActiveProviders,
            };
        });
    }, []);

    // Suggestions
    const getSuggestions = useCallback(async (query: string) => {
        if (!serviceRef.current) return;

        try {
            const suggestions = await serviceRef.current.getSuggestions(query);
            setState((prev) => ({
                ...prev,
                suggestions: suggestions.slice(0, 8),
                showSuggestions: suggestions.length > 0,
            }));
        } catch (error) {
            console.error('Failed to get suggestions:', error);
        }
    }, []);

    const applySuggestion = useCallback((suggestion: string) => {
        setState((prev) => ({
            ...prev,
            query: suggestion,
            showSuggestions: false,
        }));
    }, []);

    const hideSuggestions = useCallback(() => {
        setState((prev) => ({ ...prev, showSuggestions: false }));
    }, []);

    // Popular content
    const loadPopularContent = useCallback(async (category?: string) => {
        if (!serviceRef.current) return;

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await serviceRef.current.getPopularMedia(category);

            setState((prev) => ({
                ...prev,
                results: result,
                hasMore: result.hasMore,
                isLoading: false,
                query: '',
            }));
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load popular content';
            setState((prev) => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, []);

    // Download selected items
    const downloadSelected = useCallback(async () => {
        if (state.selectedItems.length === 0) {
            return;
        }

        setState((prev) => ({
            ...prev,
            isDownloading: true,
            downloadProgress: 0,
        }));

        try {
            // Simple download implementation using fetch
            const downloadPromises = state.selectedItems.map(
                async (item, index) => {
                    try {
                        const response = await fetch(item.downloadUrl);
                        if (!response.ok) {
                            throw new Error(
                                `Failed to download: ${response.statusText}`
                            );
                        }
                        const blob = await response.blob();
                        const progress =
                            ((index + 1) / state.selectedItems.length) * 100;
                        setState((prev) => ({
                            ...prev,
                            downloadProgress: progress,
                        }));
                        return { ...item, blob };
                    } catch (error) {
                        console.error(
                            `Failed to download item ${item.id}:`,
                            error
                        );
                        return item;
                    }
                }
            );

            const downloadedItems = await Promise.all(downloadPromises);

            setState((prev) => ({
                ...prev,
                isDownloading: false,
                downloadProgress: 100,
            }));

            onDownloadComplete?.(downloadedItems);

            setTimeout(() => {
                setState((prev) => ({ ...prev, downloadProgress: 0 }));
            }, 2000);
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isDownloading: false,
                downloadProgress: 0,
            }));

            const downloadError =
                error instanceof Error ? error : new Error('Download failed');
            onDownloadError?.(downloadError);
        }
    }, [state.selectedItems, onDownloadComplete, onDownloadError]);

    // Retry initialization
    const retryInitialization = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            isInitializing: true,
            initializationError: null,
            error: null,
        }));

        try {
            const service = await MediaSearchServiceFactory.create({
                cacheSize: 1000,
                cacheExpiryMinutes: 30,
                enabledProviders: ['unsplash', 'pexels', 'pixabay'],
            });

            serviceRef.current = service;
            setIsServiceReady(true);

            const providers = service.getAvailableProviders();
            const providerStatuses = providers.map((provider) =>
                provider.getStatus()
            );

            setState((prev) => ({
                ...prev,
                isInitializing: false,
                isInitialized: true,
                availableProviders: providerStatuses,
                activeProviders: providerStatuses
                    .filter((status) => status.isAvailable)
                    .map((status) => status.id),
                error: null,
            }));
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Initialization failed';
            setState((prev) => ({
                ...prev,
                isInitializing: false,
                isInitialized: false,
                initializationError: errorMessage,
                error: errorMessage,
            }));
        }
    }, []);

    const getInitializationStatus = useCallback(
        () => ({
            isInitializing: state.isInitializing,
            isInitialized: state.isInitialized,
            error: state.initializationError,
            warnings: state.initializationWarnings,
        }),
        [
            state.isInitializing,
            state.isInitialized,
            state.initializationError,
            state.initializationWarnings,
        ]
    );

    // Update query
    const setQuery = useCallback((query: string) => {
        setState((prev) => ({ ...prev, query }));
    }, []);

    // Memoized actions object
    const actions = useMemo<MediaSearchActions>(
        () => ({
            search,
            loadMore,
            clearSearch,
            selectItem,
            deselectItem,
            toggleItemSelection,
            clearSelection,
            reorderItems,
            previewItem,
            closePreview,
            applyFilters,
            clearFilters,
            toggleProvider,
            retryInitialization,
            getInitializationStatus,
            getSuggestions,
            applySuggestion,
            hideSuggestions,
            loadPopularContent,
            downloadSelected,
            validateSelection,
        }),
        [
            search,
            loadMore,
            clearSearch,
            selectItem,
            deselectItem,
            toggleItemSelection,
            clearSelection,
            reorderItems,
            previewItem,
            closePreview,
            applyFilters,
            clearFilters,
            toggleProvider,
            retryInitialization,
            getInitializationStatus,
            getSuggestions,
            applySuggestion,
            hideSuggestions,
            loadPopularContent,
            downloadSelected,
            validateSelection,
        ]
    );

    // Extended state with query setter
    const extendedState = useMemo(
        () => ({
            ...state,
            setQuery,
        }),
        [state, setQuery]
    );

    return {
        state: extendedState as MediaSearchState & {
            setQuery: (query: string) => void;
        },
        actions,
        service: serviceRef.current,
    };
}

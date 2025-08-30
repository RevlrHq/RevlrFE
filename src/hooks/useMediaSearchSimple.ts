import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebouncedValue } from './useDebounce';

// Simplified types for the basic implementation
export interface SimpleMediaItem {
    id: string;
    providerId: string;
    title: string;
    thumbnailUrl: string;
    previewUrl: string;
    downloadUrl: string;
    width: number;
    height: number;
    photographer?: {
        name: string;
        profileUrl?: string;
    };
}

export interface SimpleMediaFilters {
    orientation?: 'landscape' | 'portrait' | 'square';
    color?: string;
    category?: string;
}

export interface SimpleMediaSearchState {
    query: string;
    filters: SimpleMediaFilters;
    results: SimpleMediaItem[];
    isLoading: boolean;
    error: string | null;
    selectedItems: SimpleMediaItem[];
    previewItem: SimpleMediaItem | null;
    suggestions: string[];
    showSuggestions: boolean;
}

export interface SimpleMediaSearchActions {
    search: (query: string, filters?: SimpleMediaFilters) => Promise<void>;
    clearSearch: () => void;
    selectItem: (item: SimpleMediaItem) => void;
    deselectItem: (itemId: string) => void;
    toggleItemSelection: (item: SimpleMediaItem) => void;
    clearSelection: () => void;
    previewItem: (item: SimpleMediaItem) => void;
    closePreview: () => void;
    applyFilters: (filters: SimpleMediaFilters) => Promise<void>;
    clearFilters: () => void;
    getSuggestions: (query: string) => Promise<void>;
    applySuggestion: (suggestion: string) => void;
    hideSuggestions: () => void;
    setQuery: (query: string) => void;
}

export interface UseSimpleMediaSearchOptions {
    initialQuery?: string;
    initialFilters?: SimpleMediaFilters;
    maxSelectedItems?: number;
    debounceDelay?: number;
    enableAutoSuggestions?: boolean;
}

export interface UseSimpleMediaSearchReturn {
    state: SimpleMediaSearchState;
    actions: SimpleMediaSearchActions;
}

// Mock search function for demonstration
const mockSearch = async (
    query: string
    // filters?: SimpleMediaFilters
): Promise<SimpleMediaItem[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return mock results
    return [
        {
            id: '1',
            providerId: 'unsplash',
            title: `${query} - Professional Photo 1`,
            thumbnailUrl: 'https://via.placeholder.com/300x200',
            previewUrl: 'https://via.placeholder.com/800x600',
            downloadUrl: 'https://via.placeholder.com/1920x1080',
            width: 1920,
            height: 1080,
            photographer: {
                name: 'John Doe',
                profileUrl: 'https://example.com/john-doe',
            },
        },
        {
            id: '2',
            providerId: 'pexels',
            title: `${query} - Professional Photo 2`,
            thumbnailUrl: 'https://via.placeholder.com/300x200',
            previewUrl: 'https://via.placeholder.com/800x600',
            downloadUrl: 'https://via.placeholder.com/1920x1080',
            width: 1920,
            height: 1080,
            photographer: {
                name: 'Jane Smith',
                profileUrl: 'https://example.com/jane-smith',
            },
        },
    ];
};

// Mock suggestions function
const mockGetSuggestions = async (query: string): Promise<string[]> => {
    const commonSuggestions = [
        'business meeting',
        'conference',
        'presentation',
        'team collaboration',
        'office workspace',
        'networking event',
        'professional handshake',
        'corporate event',
        'seminar',
        'workshop',
    ];

    return commonSuggestions
        .filter((suggestion) =>
            suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5);
};

export function useSimpleMediaSearch(
    options: UseSimpleMediaSearchOptions = {}
): UseSimpleMediaSearchReturn {
    const {
        initialQuery = '',
        initialFilters = {},
        maxSelectedItems = 10,
        debounceDelay = 500,
        enableAutoSuggestions = true,
    } = options;

    // State management
    const [state, setState] = useState<SimpleMediaSearchState>({
        query: initialQuery,
        filters: initialFilters,
        results: [],
        isLoading: false,
        error: null,
        selectedItems: [],
        previewItem: null,
        suggestions: [],
        showSuggestions: false,
    });

    // Debounced search query
    const debouncedQuery = useDebouncedValue(state.query, debounceDelay);

    // Auto-search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim() && debouncedQuery !== initialQuery) {
            search(debouncedQuery, state.filters);
        }
    }, [debouncedQuery]);

    // Auto-suggestions when query changes
    useEffect(() => {
        if (enableAutoSuggestions && state.query.trim().length > 2) {
            getSuggestions(state.query);
        } else {
            setState((prev) => ({
                ...prev,
                suggestions: [],
                showSuggestions: false,
            }));
        }
    }, [state.query, enableAutoSuggestions]);

    // Search function
    const search = useCallback(
        async (query: string, filters: SimpleMediaFilters = {}) => {
            if (!query.trim()) {
                setState((prev) => ({ ...prev, results: [], error: null }));
                return;
            }

            setState((prev) => ({
                ...prev,
                isLoading: true,
                error: null,
                showSuggestions: false,
            }));

            try {
                const results = await mockSearch(query, filters);
                setState((prev) => ({
                    ...prev,
                    results,
                    isLoading: false,
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Search failed';
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                    results: [],
                }));
            }
        },
        []
    );

    // Clear search
    const clearSearch = useCallback(() => {
        setState((prev) => ({
            ...prev,
            query: '',
            results: [],
            error: null,
            suggestions: [],
            showSuggestions: false,
        }));
    }, []);

    // Item selection
    const selectItem = useCallback(
        (item: SimpleMediaItem) => {
            setState((prev) => {
                if (prev.selectedItems.length >= maxSelectedItems) {
                    return prev; // Don't add if at max limit
                }

                const isAlreadySelected = prev.selectedItems.some(
                    (selected) =>
                        selected.id === item.id &&
                        selected.providerId === item.providerId
                );

                if (isAlreadySelected) {
                    return prev;
                }

                return {
                    ...prev,
                    selectedItems: [...prev.selectedItems, item],
                };
            });
        },
        [maxSelectedItems]
    );

    const deselectItem = useCallback((itemId: string) => {
        setState((prev) => ({
            ...prev,
            selectedItems: prev.selectedItems.filter(
                (item) =>
                    !(
                        item.id === itemId ||
                        `${item.providerId}-${item.id}` === itemId
                    )
            ),
        }));
    }, []);

    const toggleItemSelection = useCallback(
        (item: SimpleMediaItem) => {
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
        setState((prev) => ({ ...prev, selectedItems: [] }));
    }, []);

    // Preview
    const previewItem = useCallback((item: SimpleMediaItem) => {
        setState((prev) => ({ ...prev, previewItem: item }));
    }, []);

    const closePreview = useCallback(() => {
        setState((prev) => ({ ...prev, previewItem: null }));
    }, []);

    // Filters
    const applyFilters = useCallback(
        async (filters: SimpleMediaFilters) => {
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

    // Suggestions
    const getSuggestions = useCallback(async (query: string) => {
        try {
            const suggestions = await mockGetSuggestions(query);
            setState((prev) => ({
                ...prev,
                suggestions: suggestions.slice(0, 8), // Limit to 8 suggestions
                showSuggestions: suggestions.length > 0,
            }));
        } catch (error) {
            console.debug('Failed to get suggestions:', error);
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

    // Update query (for controlled input)
    const setQuery = useCallback((query: string) => {
        setState((prev) => ({ ...prev, query }));
    }, []);

    // Memoized actions object
    const actions = useMemo<SimpleMediaSearchActions>(
        () => ({
            search,
            clearSearch,
            selectItem,
            deselectItem,
            toggleItemSelection,
            clearSelection,
            previewItem,
            closePreview,
            applyFilters,
            clearFilters,
            getSuggestions,
            applySuggestion,
            hideSuggestions,
            setQuery,
        }),
        [
            search,
            clearSearch,
            selectItem,
            deselectItem,
            toggleItemSelection,
            clearSelection,
            previewItem,
            closePreview,
            applyFilters,
            clearFilters,
            getSuggestions,
            applySuggestion,
            hideSuggestions,
            setQuery,
        ]
    );

    return {
        state,
        actions,
    };
}

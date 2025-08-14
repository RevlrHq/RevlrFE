import { useState, useCallback, useEffect } from 'react';

interface UseMediaSearchHistoryOptions {
    maxHistoryItems?: number;
    maxSavedSearches?: number;
    storageKey?: string;
}

interface MediaSearchHistoryState {
    searchHistory: string[];
    savedSearches: string[];
}

// interface MediaSearchHistoryActions {
//     addToHistory: (query: string) => void;
//     clearHistory: () => void;
//     saveSearch: (query: string) => void;
//     removeSavedSearch: (query: string) => void;
//     clearSavedSearches: () => void;
// }

export interface UseMediaSearchHistoryReturn {
    searchHistory: string[];
    savedSearches: string[];
    addToHistory: (query: string) => void;
    clearHistory: () => void;
    saveSearch: (query: string) => void;
    removeSavedSearch: (query: string) => void;
    clearSavedSearches: () => void;
}

const DEFAULT_STORAGE_KEY = 'media-search-history';
const DEFAULT_MAX_HISTORY = 10;
const DEFAULT_MAX_SAVED = 20;

export function useMediaSearchHistory(
    options: UseMediaSearchHistoryOptions = {}
): UseMediaSearchHistoryReturn {
    const {
        maxHistoryItems = DEFAULT_MAX_HISTORY,
        maxSavedSearches = DEFAULT_MAX_SAVED,
        storageKey = DEFAULT_STORAGE_KEY,
    } = options;

    // Initialize state from localStorage
    const [state, setState] = useState<MediaSearchHistoryState>(() => {
        if (typeof window === 'undefined') {
            return { searchHistory: [], savedSearches: [] };
        }

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    searchHistory: Array.isArray(parsed.searchHistory)
                        ? parsed.searchHistory
                        : [],
                    savedSearches: Array.isArray(parsed.savedSearches)
                        ? parsed.savedSearches
                        : [],
                };
            }
        } catch (error) {
            console.warn(
                'Failed to load media search history from localStorage:',
                error
            );
        }

        return { searchHistory: [], savedSearches: [] };
    });

    // Save state to localStorage whenever it changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (error) {
            console.warn(
                'Failed to save media search history to localStorage:',
                error
            );
        }
    }, [state, storageKey]);

    // Add search query to history
    const addToHistory = useCallback(
        (query: string) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) return;

            setState((prev) => {
                // Remove existing instance if it exists
                const filteredHistory = prev.searchHistory.filter(
                    (item) => item !== trimmedQuery
                );

                // Add to beginning and limit length
                const newHistory = [trimmedQuery, ...filteredHistory].slice(
                    0,
                    maxHistoryItems
                );

                return {
                    ...prev,
                    searchHistory: newHistory,
                };
            });
        },
        [maxHistoryItems]
    );

    // Clear search history
    const clearHistory = useCallback(() => {
        setState((prev) => ({
            ...prev,
            searchHistory: [],
        }));
    }, []);

    // Save search query
    const saveSearch = useCallback(
        (query: string) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) return;

            setState((prev) => {
                // Don't add if already saved
                if (prev.savedSearches.includes(trimmedQuery)) {
                    return prev;
                }

                // Add to beginning and limit length
                const newSavedSearches = [
                    trimmedQuery,
                    ...prev.savedSearches,
                ].slice(0, maxSavedSearches);

                return {
                    ...prev,
                    savedSearches: newSavedSearches,
                };
            });
        },
        [maxSavedSearches]
    );

    // Remove saved search
    const removeSavedSearch = useCallback((query: string) => {
        setState((prev) => ({
            ...prev,
            savedSearches: prev.savedSearches.filter((item) => item !== query),
        }));
    }, []);

    // Clear all saved searches
    const clearSavedSearches = useCallback(() => {
        setState((prev) => ({
            ...prev,
            savedSearches: [],
        }));
    }, []);

    return {
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        addToHistory,
        clearHistory,
        saveSearch,
        removeSavedSearch,
        clearSavedSearches,
    };
}

// Helper hook for managing search suggestions with history integration
export function useMediaSearchSuggestions(
    query: string,
    searchHistory: string[],
    savedSearches: string[],
    categorySuggestions: string[] = []
) {
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        const queryLower = query.toLowerCase();
        const allSuggestions: string[] = [];

        // Add matching saved searches (highest priority)
        const matchingSaved = savedSearches.filter(
            (search) =>
                search.toLowerCase().includes(queryLower) &&
                search.toLowerCase() !== queryLower
        );
        allSuggestions.push(...matchingSaved);

        // Add matching history items
        const matchingHistory = searchHistory.filter(
            (search) =>
                search.toLowerCase().includes(queryLower) &&
                search.toLowerCase() !== queryLower &&
                !allSuggestions.includes(search)
        );
        allSuggestions.push(...matchingHistory);

        // Add matching category suggestions
        const matchingCategory = categorySuggestions.filter(
            (suggestion) =>
                suggestion.toLowerCase().includes(queryLower) &&
                suggestion.toLowerCase() !== queryLower &&
                !allSuggestions.includes(suggestion)
        );
        allSuggestions.push(...matchingCategory);

        // Limit to reasonable number of suggestions
        setSuggestions(allSuggestions.slice(0, 8));
    }, [query, searchHistory, savedSearches, categorySuggestions]);

    return suggestions;
}

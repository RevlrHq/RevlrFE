import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebouncedValue } from './useDebounce';
import type {
    AdvancedFilterOptions,
    FilterPreset,
    SearchSuggestion,
    FilterResultSummary,
} from '../components/AdvancedFilters';

export interface UseAdvancedFiltersOptions {
    initialFilters?: Partial<AdvancedFilterOptions>;
    debounceMs?: number;
    enableHistory?: boolean;
    enablePresets?: boolean;
    maxHistoryItems?: number;
    storagePrefix?: string;
}

export interface UseAdvancedFiltersResult {
    // Filter state
    filters: AdvancedFilterOptions;
    debouncedFilters: AdvancedFilterOptions;
    activeFilterCount: number;

    // Filter actions
    updateFilters: (updates: Partial<AdvancedFilterOptions>) => void;
    updateFilter: (
        key: keyof AdvancedFilterOptions,
        value: string | number | boolean | null
    ) => void;
    clearFilters: () => void;
    clearFilter: (key: keyof AdvancedFilterOptions) => void;

    // Presets
    savedPresets: FilterPreset[];
    savePreset: (name: string) => void;
    loadPreset: (preset: FilterPreset) => void;
    deletePreset: (presetId: string) => void;

    // History
    filterHistory: Partial<AdvancedFilterOptions>[];
    loadFromHistory: (filters: Partial<AdvancedFilterOptions>) => void;
    clearHistory: () => void;

    // Search suggestions
    generateSuggestions: (
        query: string,
        availableData?: {
            categories?: string[];
            venues?: string[];
            recentSearches?: string[];
        }
    ) => SearchSuggestion[];

    // Result summary
    calculateResultSummary: (data: {
        totalResults: number;
        filteredResults: number;
        categories?: Array<{ name: string; count: number }>;
        dateRange?: { start: string; end: string };
        revenueRange?: { min: number; max: number };
    }) => FilterResultSummary;

    // Utilities
    exportFilters: () => string;
    importFilters: (filtersJson: string) => boolean;
    resetToDefaults: () => void;
}

const defaultFilters: AdvancedFilterOptions = {
    searchTerm: '',
    status: '',
    category: '',
    startDate: '',
    endDate: '',
    isVirtual: null,
    hasRegistrations: null,
    minRevenue: null,
    maxRevenue: null,
    minRegistrations: null,
    maxRegistrations: null,
    venue: '',
    paymentStatus: '',
    isFinanced: null,
    registrationStartDate: '',
    registrationEndDate: '',
    minAmount: null,
    maxAmount: null,
    attendeeSearchTerm: '',
    sortBy: 'dateCreated',
    sortOrder: 'desc',
};

export const useAdvancedFilters = (
    options: UseAdvancedFiltersOptions = {}
): UseAdvancedFiltersResult => {
    const {
        initialFilters = {},
        debounceMs = 300,
        enableHistory = true,
        enablePresets = true,
        maxHistoryItems = 10,
        storagePrefix = 'organizer-filters',
    } = options;

    // Initialize filters with defaults and initial values
    const [filters, setFilters] = useState<AdvancedFilterOptions>(() => ({
        ...defaultFilters,
        ...initialFilters,
    }));

    // Debounced filters for API calls
    const debouncedFilters = useDebouncedValue(filters, debounceMs);

    // Load saved presets from localStorage
    const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => {
        if (!enablePresets || typeof window === 'undefined') return [];

        try {
            const saved = localStorage.getItem(`${storagePrefix}-presets`);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Load filter history from localStorage
    const [filterHistory, setFilterHistory] = useState<
        Partial<AdvancedFilterOptions>[]
    >(() => {
        if (!enableHistory || typeof window === 'undefined') return [];

        try {
            const saved = localStorage.getItem(`${storagePrefix}-history`);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'sortBy' || key === 'sortOrder') return;
            if (value !== null && value !== undefined && value !== '') {
                count++;
            }
        });
        return count;
    }, [filters]);

    // Update filters
    const updateFilters = useCallback(
        (updates: Partial<AdvancedFilterOptions>) => {
            setFilters((prev) => ({ ...prev, ...updates }));
        },
        []
    );

    // Update single filter
    const updateFilter = useCallback(
        (
            key: keyof AdvancedFilterOptions,
            value: string | number | boolean | null
        ) => {
            setFilters((prev) => ({ ...prev, [key]: value }));
        },
        []
    );

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    // Clear single filter
    const clearFilter = useCallback((key: keyof AdvancedFilterOptions) => {
        const clearedValue = getClearedFilterValue(key);
        setFilters((prev) => ({ ...prev, [key]: clearedValue }));
    }, []);

    // Save current filters to history
    const saveToHistory = useCallback(() => {
        if (!enableHistory || activeFilterCount === 0) return;

        const newHistory = [
            filters,
            ...filterHistory.filter(
                (h) => JSON.stringify(h) !== JSON.stringify(filters)
            ),
        ].slice(0, maxHistoryItems);

        setFilterHistory(newHistory);

        if (typeof window !== 'undefined') {
            localStorage.setItem(
                `${storagePrefix}-history`,
                JSON.stringify(newHistory)
            );
        }
    }, [
        filters,
        filterHistory,
        activeFilterCount,
        enableHistory,
        maxHistoryItems,
        storagePrefix,
    ]);

    // Save filter preset
    const savePreset = useCallback(
        (name: string) => {
            if (!enablePresets || !name.trim() || activeFilterCount === 0)
                return;

            const newPreset: FilterPreset = {
                id: Date.now().toString(),
                name: name.trim(),
                filters: { ...filters },
                createdAt: new Date(),
                useCount: 0,
            };

            const newPresets = [...savedPresets, newPreset];
            setSavedPresets(newPresets);

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    `${storagePrefix}-presets`,
                    JSON.stringify(newPresets)
                );
            }

            saveToHistory();
        },
        [
            filters,
            savedPresets,
            activeFilterCount,
            enablePresets,
            storagePrefix,
            saveToHistory,
        ]
    );

    // Load filter preset
    const loadPreset = useCallback(
        (preset: FilterPreset) => {
            setFilters({ ...defaultFilters, ...preset.filters });

            // Update usage count
            const updatedPresets = savedPresets.map((p) =>
                p.id === preset.id
                    ? { ...p, useCount: p.useCount + 1, lastUsed: new Date() }
                    : p
            );
            setSavedPresets(updatedPresets);

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    `${storagePrefix}-presets`,
                    JSON.stringify(updatedPresets)
                );
            }
        },
        [savedPresets, storagePrefix]
    );

    // Delete preset
    const deletePreset = useCallback(
        (presetId: string) => {
            const newPresets = savedPresets.filter((p) => p.id !== presetId);
            setSavedPresets(newPresets);

            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    `${storagePrefix}-presets`,
                    JSON.stringify(newPresets)
                );
            }
        },
        [savedPresets, storagePrefix]
    );

    // Load from history
    const loadFromHistory = useCallback(
        (historyFilters: Partial<AdvancedFilterOptions>) => {
            setFilters({ ...defaultFilters, ...historyFilters });
        },
        []
    );

    // Clear history
    const clearHistory = useCallback(() => {
        setFilterHistory([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`${storagePrefix}-history`);
        }
    }, [storagePrefix]);

    // Generate search suggestions
    const generateSuggestions = useCallback(
        (
            query: string,
            availableData: {
                categories?: string[];
                venues?: string[];
                recentSearches?: string[];
            } = {}
        ): SearchSuggestion[] => {
            if (!query || query.length < 2) return [];

            const {
                categories = [],
                venues = [],
                recentSearches = [],
            } = availableData;
            const suggestions: SearchSuggestion[] = [];
            const queryLower = query.toLowerCase();

            // Recent searches
            recentSearches
                .filter((search) => search.toLowerCase().includes(queryLower))
                .slice(0, 3)
                .forEach((search) => {
                    suggestions.push({
                        text: search,
                        type: 'recent',
                        score: 0.9,
                    });
                });

            // Categories
            categories
                .filter((category) =>
                    category.toLowerCase().includes(queryLower)
                )
                .slice(0, 3)
                .forEach((category) => {
                    suggestions.push({
                        text: category,
                        type: 'category',
                        score: 0.8,
                    });
                });

            // Venues
            venues
                .filter((venue) => venue.toLowerCase().includes(queryLower))
                .slice(0, 3)
                .forEach((venue) => {
                    suggestions.push({
                        text: venue,
                        type: 'venue',
                        score: 0.7,
                    });
                });

            // Status suggestions
            const statuses = ['Draft', 'Published', 'Cancelled', 'Completed'];
            statuses
                .filter((status) => status.toLowerCase().includes(queryLower))
                .forEach((status) => {
                    suggestions.push({
                        text: status,
                        type: 'status',
                        score: 0.6,
                    });
                });

            return suggestions.sort((a, b) => b.score - a.score).slice(0, 8);
        },
        []
    );

    // Calculate result summary
    const calculateResultSummary = useCallback(
        (data: {
            totalResults: number;
            filteredResults: number;
            categories?: Array<{ name: string; count: number }>;
            dateRange?: { start: string; end: string };
            revenueRange?: { min: number; max: number };
        }): FilterResultSummary => {
            return {
                totalResults: data.totalResults,
                filteredResults: data.filteredResults,
                appliedFilters: activeFilterCount,
                topCategories: data.categories || [],
                dateRange: data.dateRange,
                revenueRange: data.revenueRange,
            };
        },
        [activeFilterCount]
    );

    // Export filters as JSON
    const exportFilters = useCallback(() => {
        return JSON.stringify(filters, null, 2);
    }, [filters]);

    // Import filters from JSON
    const importFilters = useCallback((filtersJson: string): boolean => {
        try {
            const importedFilters = JSON.parse(filtersJson);
            setFilters({ ...defaultFilters, ...importedFilters });
            return true;
        } catch {
            return false;
        }
    }, []);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    // Auto-save to history when filters change significantly
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeFilterCount > 0) {
                saveToHistory();
            }
        }, 2000); // Save to history 2 seconds after last change

        return () => clearTimeout(timer);
    }, [filters, activeFilterCount, saveToHistory]);

    return {
        // Filter state
        filters,
        debouncedFilters,
        activeFilterCount,

        // Filter actions
        updateFilters,
        updateFilter,
        clearFilters,
        clearFilter,

        // Presets
        savedPresets,
        savePreset,
        loadPreset,
        deletePreset,

        // History
        filterHistory,
        loadFromHistory,
        clearHistory,

        // Search suggestions
        generateSuggestions,

        // Result summary
        calculateResultSummary,

        // Utilities
        exportFilters,
        importFilters,
        resetToDefaults,
    };
};

// Helper function to get cleared filter value
const getClearedFilterValue = (
    key: keyof AdvancedFilterOptions
): string | number | boolean | null => {
    if (key.includes('is') || key.includes('has')) return null;
    if (
        key.includes('min') ||
        key.includes('max') ||
        key.includes('Amount') ||
        key.includes('Revenue')
    )
        return null;
    if (key === 'sortOrder') return 'desc';
    if (key === 'sortBy') return 'dateCreated';
    return '';
};

export default useAdvancedFilters;

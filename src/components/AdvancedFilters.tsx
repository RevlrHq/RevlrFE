'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebouncedValue } from '../hooks/useDebounce';
import { Button } from './ui/button';
import { Input } from './ui/input';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from './ui/dialog';
import {
    Search,
    Filter,
    X,
    RefreshCw,
    Save,
    History,
    Star,
    Tag,
    MapPin,
    Sparkles,
} from 'lucide-react';
import AdvancedFilterForm from './AdvancedFilterForm';
import FilterPresetsManager from './FilterPresetsManager';
import ActiveFiltersDisplay from './ActiveFiltersDisplay';
import FilterResultSummary from './FilterResultSummary';

// Enhanced filter interfaces
export interface AdvancedFilterOptions {
    // Basic filters
    searchTerm: string;
    status: string;
    category: string;
    startDate: string;
    endDate: string;
    isVirtual: boolean | null;
    hasRegistrations: boolean | null;

    // Revenue filters
    minRevenue: number | null;
    maxRevenue: number | null;

    // Registration filters
    minRegistrations: number | null;
    maxRegistrations: number | null;

    // Advanced filters
    venue: string;
    paymentStatus: string;
    isFinanced: boolean | null;
    registrationStartDate: string;
    registrationEndDate: string;
    minAmount: number | null;
    maxAmount: number | null;

    // Attendee filters
    attendeeSearchTerm: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface FilterPreset {
    id: string;
    name: string;
    filters: Partial<AdvancedFilterOptions>;
    isDefault?: boolean;
    createdAt: Date;
    lastUsed?: Date;
    useCount: number;
}

export interface SearchSuggestion {
    text: string;
    type: 'query' | 'category' | 'venue' | 'status' | 'recent';
    score: number;
    metadata?: unknown;
}

export interface FilterResultSummary {
    totalResults: number;
    filteredResults: number;
    appliedFilters: number;
    topCategories: Array<{ name: string; count: number }>;
    dateRange?: { start: string; end: string };
    revenueRange?: { min: number; max: number };
}

interface AdvancedFiltersProps {
    filters: AdvancedFilterOptions;
    onFiltersChange: (filters: Partial<AdvancedFilterOptions>) => void;
    onClearFilters: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    placeholder?: string;
    showGlobalSearch?: boolean;
    showPresets?: boolean;
    showSuggestions?: boolean;
    showResultSummary?: boolean;
    resultSummary?: FilterResultSummary;
    className?: string;
    // Data for suggestions
    availableCategories?: string[];
    availableVenues?: string[];
    recentSearches?: string[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
    onRefresh,
    isLoading = false,
    placeholder = 'Search across events, attendees, and registrations...',
    showGlobalSearch = true,
    showPresets = true,
    showSuggestions = true,
    showResultSummary = true,
    resultSummary,
    className = '',
    availableCategories = [],
    availableVenues = [],
    recentSearches = [],
}) => {
    // Local state
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const [showPresetsModal, setShowPresetsModal] = useState(false);
    const [showSavePresetModal, setShowSavePresetModal] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['basic'])
    );
    const [presetName, setPresetName] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<
        SearchSuggestion[]
    >([]);
    const [showSuggestionsDropdown, setShowSuggestionsDropdown] =
        useState(false);

    // Debounced search term
    const debouncedSearchTerm = useDebouncedValue(localSearchTerm, 300);

    // Load saved presets from localStorage
    const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('organizer-filter-presets');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    // Load filter history from localStorage
    const [filterHistory, setFilterHistory] = useState<
        Partial<AdvancedFilterOptions>[]
    >(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('organizer-filter-history');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    // Update search term when debounced value changes
    useEffect(() => {
        if (debouncedSearchTerm !== filters.searchTerm) {
            onFiltersChange({ searchTerm: debouncedSearchTerm });
        }
    }, [debouncedSearchTerm, filters.searchTerm, onFiltersChange]);

    // Generate search suggestions
    const generateSuggestions = useCallback(
        (query: string): SearchSuggestion[] => {
            if (!query || query.length < 2) return [];

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
            availableCategories
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
            availableVenues
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
        [recentSearches, availableCategories, availableVenues]
    );

    // Update suggestions when search term changes
    useEffect(() => {
        if (showSuggestions && localSearchTerm) {
            const suggestions = generateSuggestions(localSearchTerm);
            setSearchSuggestions(suggestions);
        } else {
            setSearchSuggestions([]);
        }
    }, [localSearchTerm, showSuggestions, generateSuggestions]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'searchTerm' || key === 'sortBy' || key === 'sortOrder')
                return;
            if (value !== null && value !== undefined && value !== '') {
                count++;
            }
        });
        return count;
    }, [filters]);

    // Handle filter change
    const handleFilterChange = useCallback(
        (key: keyof AdvancedFilterOptions, value: unknown) => {
            if (key === 'searchTerm') {
                setLocalSearchTerm(value as string);
            } else {
                onFiltersChange({ [key]: value });
            }
        },
        [onFiltersChange]
    );

    // Save current filters to history
    const saveToHistory = useCallback(() => {
        if (activeFilterCount === 0) return;

        const newHistory = [
            filters,
            ...filterHistory.filter(
                (h) => JSON.stringify(h) !== JSON.stringify(filters)
            ),
        ].slice(0, 10);

        setFilterHistory(newHistory);
        localStorage.setItem(
            'organizer-filter-history',
            JSON.stringify(newHistory)
        );
    }, [filters, filterHistory, activeFilterCount]);

    // Save filter preset
    const savePreset = useCallback(() => {
        if (!presetName.trim() || activeFilterCount === 0) return;

        const newPreset: FilterPreset = {
            id: Date.now().toString(),
            name: presetName.trim(),
            filters: { ...filters },
            createdAt: new Date(),
            useCount: 0,
        };

        const newPresets = [...savedPresets, newPreset];
        setSavedPresets(newPresets);
        localStorage.setItem(
            'organizer-filter-presets',
            JSON.stringify(newPresets)
        );

        setPresetName('');
        setShowSavePresetModal(false);
        saveToHistory();
    }, [presetName, filters, savedPresets, activeFilterCount, saveToHistory]);

    // Load filter preset
    const loadPreset = useCallback(
        (preset: FilterPreset) => {
            onFiltersChange(preset.filters);
            setLocalSearchTerm(preset.filters.searchTerm || '');

            // Update usage count
            const updatedPresets = savedPresets.map((p) =>
                p.id === preset.id
                    ? { ...p, useCount: p.useCount + 1, lastUsed: new Date() }
                    : p
            );
            setSavedPresets(updatedPresets);
            localStorage.setItem(
                'organizer-filter-presets',
                JSON.stringify(updatedPresets)
            );

            setShowPresetsModal(false);
        },
        [onFiltersChange, savedPresets]
    );

    // Delete preset
    const deletePreset = useCallback(
        (presetId: string) => {
            const newPresets = savedPresets.filter((p) => p.id !== presetId);
            setSavedPresets(newPresets);
            localStorage.setItem(
                'organizer-filter-presets',
                JSON.stringify(newPresets)
            );
        },
        [savedPresets]
    );

    // Apply suggestion
    const applySuggestion = useCallback(
        (suggestion: SearchSuggestion) => {
            switch (suggestion.type) {
                case 'category':
                    handleFilterChange('category', suggestion.text);
                    break;
                case 'venue':
                    handleFilterChange('venue', suggestion.text);
                    break;
                case 'status':
                    const statusMap: Record<string, string> = {
                        Draft: '0',
                        Published: '1',
                        Cancelled: '2',
                        Completed: '3',
                    };
                    handleFilterChange(
                        'status',
                        statusMap[suggestion.text] || ''
                    );
                    break;
                default:
                    setLocalSearchTerm(suggestion.text);
                    break;
            }
            setShowSuggestionsDropdown(false);
        },
        [handleFilterChange]
    );

    // Toggle section expansion
    const toggleSection = useCallback(
        (section: string) => {
            const newExpanded = new Set(expandedSections);
            if (newExpanded.has(section)) {
                newExpanded.delete(section);
            } else {
                newExpanded.add(section);
            }
            setExpandedSections(newExpanded);
        },
        [expandedSections]
    );

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Global Search Bar */}
            {showGlobalSearch && (
                <div className='relative'>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                        <Input
                            type='text'
                            placeholder={placeholder}
                            value={localSearchTerm}
                            onChange={(e) => setLocalSearchTerm(e.target.value)}
                            onFocus={() => setShowSuggestionsDropdown(true)}
                            onBlur={() =>
                                setTimeout(
                                    () => setShowSuggestionsDropdown(false),
                                    200
                                )
                            }
                            className='px-10'
                            disabled={isLoading}
                        />
                        {localSearchTerm && (
                            <button
                                onClick={() => {
                                    setLocalSearchTerm('');
                                    handleFilterChange('searchTerm', '');
                                }}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                disabled={isLoading}
                            >
                                <X className='size-4' />
                            </button>
                        )}
                    </div>

                    {/* Search Suggestions Dropdown */}
                    {showSuggestions &&
                        showSuggestionsDropdown &&
                        searchSuggestions.length > 0 && (
                            <div className='absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800'>
                                {searchSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            applySuggestion(suggestion)
                                        }
                                        className='flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700'
                                    >
                                        {suggestion.type === 'recent' && (
                                            <History className='size-4 text-gray-400' />
                                        )}
                                        {suggestion.type === 'category' && (
                                            <Tag className='size-4 text-blue-500' />
                                        )}
                                        {suggestion.type === 'venue' && (
                                            <MapPin className='size-4 text-green-500' />
                                        )}
                                        {suggestion.type === 'status' && (
                                            <Tag className='size-4 text-orange-500' />
                                        )}
                                        {suggestion.type === 'query' && (
                                            <Sparkles className='size-4 text-purple-500' />
                                        )}
                                        <span className='text-sm'>
                                            {suggestion.text}
                                        </span>
                                        <span className='ml-auto text-xs capitalize text-gray-400'>
                                            {suggestion.type}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                </div>
            )}

            {/* Filter Controls */}
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex flex-wrap items-center gap-2'>
                    {/* Advanced Filters Button */}
                    <Dialog
                        open={showFiltersModal}
                        onOpenChange={setShowFiltersModal}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant='outline'
                                size='sm'
                                className='flex items-center gap-2'
                                disabled={isLoading}
                            >
                                <Filter className='size-4' />
                                Advanced Filters
                                {activeFilterCount > 0 && (
                                    <span className='ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white'>
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
                            <DialogHeader>
                                <DialogTitle>Advanced Filters</DialogTitle>
                            </DialogHeader>
                            <AdvancedFilterForm
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                expandedSections={expandedSections}
                                onToggleSection={toggleSection}
                                availableCategories={availableCategories}
                                availableVenues={availableVenues}
                            />
                            <DialogFooter>
                                <Button
                                    variant='outline'
                                    onClick={() => setShowFiltersModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setShowFiltersModal(false)}
                                >
                                    Apply Filters
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Filter Presets */}
                    {showPresets && (
                        <>
                            <Dialog
                                open={showPresetsModal}
                                onOpenChange={setShowPresetsModal}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='flex items-center gap-2'
                                        disabled={isLoading}
                                    >
                                        <Star className='size-4' />
                                        Presets
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className='max-w-2xl'>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Filter Presets
                                        </DialogTitle>
                                    </DialogHeader>
                                    <FilterPresetsManager
                                        presets={savedPresets}
                                        onLoadPreset={loadPreset}
                                        onDeletePreset={deletePreset}
                                        filterHistory={filterHistory}
                                        onLoadFromHistory={(historyFilters) => {
                                            onFiltersChange(historyFilters);
                                            setLocalSearchTerm(
                                                historyFilters.searchTerm || ''
                                            );
                                            setShowPresetsModal(false);
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>

                            {activeFilterCount > 0 && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setShowSavePresetModal(true)}
                                    className='flex items-center gap-2'
                                    disabled={isLoading}
                                >
                                    <Save className='size-4' />
                                    Save Preset
                                </Button>
                            )}
                        </>
                    )}
                </div>

                <div className='flex items-center gap-2'>
                    {onRefresh && (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={onRefresh}
                            disabled={isLoading}
                            className='flex items-center gap-2'
                        >
                            <RefreshCw
                                className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    )}

                    {activeFilterCount > 0 && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onClearFilters}
                            disabled={isLoading}
                            className='flex items-center gap-2'
                        >
                            <X className='size-4' />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
                <ActiveFiltersDisplay
                    filters={filters}
                    onRemoveFilter={(key) => {
                        const clearedValue = getClearedFilterValue(key);
                        if (key === 'searchTerm') {
                            setLocalSearchTerm('');
                        }
                        handleFilterChange(key, clearedValue);
                    }}
                />
            )}

            {/* Result Summary */}
            {showResultSummary && resultSummary && (
                <FilterResultSummary summary={resultSummary} />
            )}

            {/* Save Preset Modal */}
            <Dialog
                open={showSavePresetModal}
                onOpenChange={setShowSavePresetModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Filter Preset</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <Input
                            placeholder='Enter preset name'
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && savePreset()
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setShowSavePresetModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={savePreset}
                            disabled={!presetName.trim()}
                        >
                            Save Preset
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Helper function to get cleared filter value
const getClearedFilterValue = (key: keyof AdvancedFilterOptions): unknown => {
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

export default React.memo(AdvancedFilters);

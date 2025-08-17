'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import {
    Search,
    Filter,
    X,
    ChevronDown,
    Clock,
    Star,
    AlertCircle,
    CheckCircle,
    Loader2,
    Palette,
    Maximize,
    Image,
    Shield,
    Sliders,
    TrendingUp,
    User,
    Sparkles,
} from 'lucide-react';
import type {
    MediaFilters,
    ProviderStatus,
    SearchSuggestion,
} from '@/types/media-search';
import {
    EventCategory,
    CATEGORY_DESCRIPTIONS,
} from '@/lib/constants/eventCategories';

interface AdvancedMediaSearchHeaderProps {
    query: string;
    onQueryChange: (query: string) => void;
    onSearch: (query: string) => void;
    suggestions: SearchSuggestion[];
    showSuggestions: boolean;
    onSuggestionSelect: (suggestion: string) => void;
    onHideSuggestions: () => void;
    filters: MediaFilters;
    onFiltersChange: (filters: MediaFilters) => void;
    onClearSearch: () => void;
    onResetFilters: () => void;
    availableProviders: ProviderStatus[];
    activeProviders: string[];
    onToggleProvider: (providerId: string) => void;
    eventCategory?: EventCategory;
    savedSearches: string[];
    onSaveSearch: (query: string) => void;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
    userId?: string;
    enablePersonalization?: boolean;
    enableSmartSuggestions?: boolean;
}

export const AdvancedMediaSearchHeader: React.FC<
    AdvancedMediaSearchHeaderProps
> = ({
    query,
    onQueryChange,
    onSearch,
    suggestions,
    showSuggestions,
    onSuggestionSelect,
    onHideSuggestions,
    filters,
    onFiltersChange,
    onClearSearch,
    onResetFilters,
    availableProviders,
    activeProviders,
    onToggleProvider,
    eventCategory,
    savedSearches,
    onSaveSearch,
    sortBy = 'relevance',
    sortOrder = 'desc',
    onSortChange,
    isLoading = false,
    disabled = false,
    className = '',
    userId,
    enablePersonalization = true,
    enableSmartSuggestions = true,
}) => {
    const { theme } = useTheme();
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const advancedFiltersRef = useRef<HTMLDivElement>(null);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Handle search form submission
    const handleSearchSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (query.trim()) {
                onSearch(query.trim());
                onHideSuggestions();
            }
        },
        [query, onSearch, onHideSuggestions]
    );

    // Handle input change
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            onQueryChange(value);
        },
        [onQueryChange]
    );

    // Handle suggestion click
    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            onSuggestionSelect(suggestion);
            onHideSuggestions();
            searchInputRef.current?.focus();
        },
        [onSuggestionSelect, onHideSuggestions]
    );

    // Handle clear search
    const handleClearSearch = useCallback(() => {
        onClearSearch();
        onHideSuggestions();
        searchInputRef.current?.focus();
    }, [onClearSearch, onHideSuggestions]);

    // Handle save search
    const handleSaveSearch = useCallback(() => {
        if (query.trim() && !savedSearches.includes(query.trim())) {
            onSaveSearch(query.trim());
        }
    }, [query, savedSearches, onSaveSearch]);

    // Handle filter changes
    const handleFilterChange = useCallback(
        (
            key: keyof MediaFilters,
            value: string | boolean | number | undefined
        ) => {
            const newFilters = { ...filters, [key]: value };
            onFiltersChange(newFilters);
        },
        [filters, onFiltersChange]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                onHideSuggestions();
                setShowAdvancedFilters(false);
                setShowProviderDropdown(false);
                setShowSortDropdown(false);
            }
        },
        [onHideSuggestions]
    );

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                advancedFiltersRef.current &&
                !advancedFiltersRef.current.contains(event.target as Node)
            ) {
                setShowAdvancedFilters(false);
            }
            if (
                providerDropdownRef.current &&
                !providerDropdownRef.current.contains(event.target as Node)
            ) {
                setShowProviderDropdown(false);
            }
            if (
                sortDropdownRef.current &&
                !sortDropdownRef.current.contains(event.target as Node)
            ) {
                setShowSortDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get suggestion icon based on type
    const getSuggestionIcon = (suggestion: SearchSuggestion) => {
        switch (suggestion.type) {
            case 'trending':
                return <TrendingUp className='size-3 text-orange-500' />;
            case 'query':
                return <Search className='size-3 text-gray-500' />;
            case 'category':
                return (
                    <Image
                        className='size-3 text-blue-500'
                        aria-label='Category suggestion'
                    />
                );
            case 'filter':
                return <Filter className='size-3 text-green-500' />;
            default:
                return <Search className='size-3 text-gray-500' />;
        }
    };

    // Get provider status indicator
    const getProviderStatusIcon = (provider: ProviderStatus) => {
        if (!provider.isAvailable) {
            return <AlertCircle className='size-3 text-red-500' />;
        }
        if (provider.healthScore < 70) {
            return <AlertCircle className='size-3 text-yellow-500' />;
        }
        return <CheckCircle className='size-3 text-green-500' />;
    };

    const activeFiltersCount = Object.values(filters).filter(
        (value) => value !== undefined && value !== '' && value !== null
    ).length;

    const sortOptions = [
        { value: 'relevance', label: 'Relevance', icon: Sparkles },
        { value: 'popularity', label: 'Popularity', icon: TrendingUp },
        { value: 'recency', label: 'Most Recent', icon: Clock },
        { value: 'downloads', label: 'Most Downloaded', icon: Image },
    ];

    return (
        <div
            className={`border-b p-6 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-bg'
                    : 'border-gray-200 bg-white'
            } ${className}`}
        >
            {/* Category Context Banner */}
            {eventCategory && (
                <div
                    className={`mb-4 rounded-lg p-3 ${
                        theme === 'dark'
                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                            : 'border border-blue-200 bg-blue-50'
                    }`}
                >
                    <div className='flex items-center justify-between'>
                        <div>
                            <p
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-blue-900'
                                }`}
                            >
                                Searching for{' '}
                                {CATEGORY_DESCRIPTIONS[eventCategory]} events
                            </p>
                            {enablePersonalization && userId && (
                                <p
                                    className={`font-inter text-xs ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-blue-700'
                                    }`}
                                >
                                    <User className='mr-1 inline size-3' />
                                    Personalized results enabled
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Search Bar */}
            <form onSubmit={handleSearchSubmit} className='relative'>
                <div className='relative'>
                    <Search
                        className={`absolute left-3 top-1/2 size-5 -translate-y-1/2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    />

                    <input
                        ref={searchInputRef}
                        type='text'
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            // Focus handler for potential future history dropdown functionality
                        }}
                        placeholder='Search for images and videos...'
                        className={`w-full rounded-xl border py-3 pl-10 pr-40 font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                        }`}
                        disabled={disabled}
                        aria-label='Search for images and videos'
                    />

                    {/* Search Actions */}
                    <div className='absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-1'>
                        {/* Sort Dropdown */}
                        <div className='relative' ref={sortDropdownRef}>
                            <button
                                type='button'
                                onClick={() =>
                                    setShowSortDropdown(!showSortDropdown)
                                }
                                className={`flex items-center space-x-1 rounded-lg p-1.5 transition-colors ${
                                    showSortDropdown
                                        ? 'bg-revlr-primary-blue text-white'
                                        : theme === 'dark'
                                          ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                disabled={disabled}
                                title='Sort results'
                            >
                                <Sliders className='size-4' />
                                <ChevronDown className='size-3' />
                            </button>

                            {showSortDropdown && (
                                <div
                                    className={`absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border shadow-lg ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className='p-2'>
                                        <h4
                                            className={`mb-2 px-2 font-inter text-xs font-medium uppercase tracking-wide ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Sort By
                                        </h4>
                                        {sortOptions.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        onSortChange(
                                                            option.value,
                                                            sortOrder
                                                        );
                                                        setShowSortDropdown(
                                                            false
                                                        );
                                                    }}
                                                    className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left font-inter text-sm transition-colors ${
                                                        sortBy === option.value
                                                            ? 'bg-revlr-primary-blue text-white'
                                                            : theme === 'dark'
                                                              ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <Icon className='size-4' />
                                                    <span>{option.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Search Button */}
                        {query.trim() &&
                            !savedSearches.includes(query.trim()) && (
                                <button
                                    type='button'
                                    onClick={handleSaveSearch}
                                    className={`rounded-lg p-1.5 transition-colors ${
                                        theme === 'dark'
                                            ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                                    disabled={disabled}
                                    title='Save search'
                                >
                                    <Star className='size-4' />
                                </button>
                            )}

                        {/* Clear Search Button */}
                        {query && (
                            <button
                                type='button'
                                onClick={handleClearSearch}
                                className={`rounded-lg p-1.5 transition-colors ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                disabled={disabled}
                                title='Clear search'
                            >
                                <X className='size-4' />
                            </button>
                        )}

                        {/* Advanced Filters Toggle */}
                        <button
                            type='button'
                            onClick={() =>
                                setShowAdvancedFilters(!showAdvancedFilters)
                            }
                            className={`relative rounded-lg p-1.5 transition-colors ${
                                showAdvancedFilters || activeFiltersCount > 0
                                    ? 'bg-revlr-primary-blue text-white'
                                    : theme === 'dark'
                                      ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                            disabled={disabled}
                            title='Advanced filters'
                        >
                            <Filter className='size-4' />
                            {activeFiltersCount > 0 && (
                                <span className='absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>

                        {/* Provider Selector */}
                        <div className='relative' ref={providerDropdownRef}>
                            <button
                                type='button'
                                onClick={() =>
                                    setShowProviderDropdown(
                                        !showProviderDropdown
                                    )
                                }
                                className={`flex items-center space-x-1 rounded-lg p-1.5 transition-colors ${
                                    showProviderDropdown
                                        ? 'bg-revlr-primary-blue text-white'
                                        : theme === 'dark'
                                          ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                disabled={disabled}
                                title='Select providers'
                            >
                                <span className='text-xs font-medium'>
                                    {activeProviders.length}/
                                    {availableProviders.length}
                                </span>
                                <ChevronDown className='size-3' />
                            </button>

                            {/* Provider Dropdown */}
                            {showProviderDropdown && (
                                <div
                                    className={`absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border shadow-lg ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    <div className='p-3'>
                                        <h4
                                            className={`mb-2 font-inter text-sm font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            Media Providers
                                        </h4>
                                        <div className='space-y-2'>
                                            {availableProviders.map(
                                                (provider) => (
                                                    <label
                                                        key={provider.id}
                                                        className={`flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-colors ${
                                                            theme === 'dark'
                                                                ? 'hover:bg-revlr-dark-border'
                                                                : 'hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type='checkbox'
                                                            checked={activeProviders.includes(
                                                                provider.id
                                                            )}
                                                            onChange={() =>
                                                                onToggleProvider(
                                                                    provider.id
                                                                )
                                                            }
                                                            className='rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        />
                                                        <div className='min-w-0 flex-1'>
                                                            <div className='flex items-center space-x-2'>
                                                                {getProviderStatusIcon(
                                                                    provider
                                                                )}
                                                                <span
                                                                    className={`font-inter text-sm font-medium capitalize ${
                                                                        theme ===
                                                                        'dark'
                                                                            ? 'text-white'
                                                                            : 'text-gray-900'
                                                                    }`}
                                                                >
                                                                    {
                                                                        provider.name
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className='mt-1 flex items-center space-x-2'>
                                                                <span
                                                                    className={`font-inter text-xs ${
                                                                        theme ===
                                                                        'dark'
                                                                            ? 'text-gray-400'
                                                                            : 'text-gray-600'
                                                                    }`}
                                                                >
                                                                    Health:{' '}
                                                                    {
                                                                        provider.healthScore
                                                                    }
                                                                    %
                                                                </span>
                                                                {!provider.isAvailable && (
                                                                    <span className='text-xs text-red-500'>
                                                                        Unavailable
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </label>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Smart Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div
                        className={`absolute inset-x-0 top-full z-10 mt-1 rounded-lg border shadow-lg ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='p-2'>
                            <h4
                                className={`mb-2 px-2 font-inter text-xs font-medium uppercase tracking-wide ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                {enableSmartSuggestions
                                    ? 'Smart Suggestions'
                                    : 'Suggestions'}
                            </h4>
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        handleSuggestionClick(suggestion.text)
                                    }
                                    className={`flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left font-inter text-sm transition-colors ${
                                        theme === 'dark'
                                            ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    {getSuggestionIcon(suggestion)}
                                    <span className='flex-1'>
                                        {suggestion.text}
                                    </span>
                                    {suggestion.metadata?.popularity && (
                                        <span
                                            className={`text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-500'
                                                    : 'text-gray-400'
                                            }`}
                                        >
                                            {suggestion.metadata.popularity}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </form>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
                <div
                    ref={advancedFiltersRef}
                    className={`mt-4 rounded-lg border p-4 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <div className='mb-3 flex items-center justify-between'>
                        <h3
                            className={`font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Advanced Filters
                        </h3>
                        <button
                            onClick={onResetFilters}
                            className={`font-inter text-xs transition-colors ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:text-white'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Reset All
                        </button>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                        {/* Orientation Filter */}
                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <Maximize className='mr-1 inline size-3' />
                                Orientation
                            </label>
                            <select
                                value={filters.orientation || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'orientation',
                                        e.target.value || undefined
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>Any</option>
                                <option value='landscape'>Landscape</option>
                                <option value='portrait'>Portrait</option>
                                <option value='square'>Square</option>
                            </select>
                        </div>

                        {/* Color Filter */}
                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <Palette className='mr-1 inline size-3' />
                                Color
                            </label>
                            <select
                                value={filters.color || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'color',
                                        e.target.value || undefined
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>Any Color</option>
                                <option value='red'>Red</option>
                                <option value='blue'>Blue</option>
                                <option value='green'>Green</option>
                                <option value='yellow'>Yellow</option>
                                <option value='orange'>Orange</option>
                                <option value='purple'>Purple</option>
                                <option value='pink'>Pink</option>
                                <option value='brown'>Brown</option>
                                <option value='black'>Black</option>
                                <option value='white'>White</option>
                                <option value='gray'>Gray</option>
                            </select>
                        </div>

                        {/* Resolution Filter */}
                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <Image
                                    className='mr-1 inline size-3'
                                    aria-label='Resolution filter'
                                />
                                Resolution
                            </label>
                            <select
                                value={filters.resolution || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'resolution',
                                        e.target.value || undefined
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>Any Resolution</option>
                                <option value='low'>Low (&lt; 0.5MP)</option>
                                <option value='medium'>Medium (0.5-2MP)</option>
                                <option value='high'>High (2-8MP)</option>
                                <option value='ultra'>Ultra (8MP+)</option>
                            </select>
                        </div>

                        {/* License Filter */}
                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <Shield className='mr-1 inline size-3' />
                                License
                            </label>
                            <select
                                value={filters.license || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'license',
                                        e.target.value || undefined
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>Any License</option>
                                <option value='cc0'>CC0 (Public Domain)</option>
                                <option value='commercial'>
                                    Commercial Use
                                </option>
                                <option value='editorial'>
                                    Editorial Only
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* Safe Search Toggle */}
                    <div className='mt-4 flex items-center space-x-3'>
                        <input
                            type='checkbox'
                            id='safeSearch'
                            checked={filters.safeSearch || false}
                            onChange={(e) =>
                                handleFilterChange(
                                    'safeSearch',
                                    e.target.checked
                                )
                            }
                            className='rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                        />
                        <label
                            htmlFor='safeSearch'
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            <Shield className='mr-1 inline size-4' />
                            Enable Safe Search
                        </label>
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <div className='mt-4 flex items-center justify-center'>
                    <Loader2 className='size-5 animate-spin text-revlr-primary-blue' />
                    <span
                        className={`ml-2 font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Searching...
                    </span>
                </div>
            )}
        </div>
    );
};

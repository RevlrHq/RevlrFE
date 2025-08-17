'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
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
} from 'lucide-react';
import type { MediaFilters, ProviderStatus } from '@src/types/media-search';
import {
    EventCategory,
    CATEGORY_DESCRIPTIONS,
} from '@src/lib/constants/eventCategories';

interface MediaSearchHeaderProps {
    query: string;
    onQueryChange: (query: string) => void;
    onSearch: (query: string) => void;
    suggestions: string[];
    showSuggestions: boolean;
    onSuggestionSelect: (suggestion: string) => void;
    onHideSuggestions: () => void;
    filters: MediaFilters;
    onFiltersChange: (filters: MediaFilters) => void;
    showFilters: boolean;
    onToggleFilters: () => void;
    onClearSearch: () => void;
    onResetFilters: () => void;
    availableProviders: ProviderStatus[];
    activeProviders: string[];
    onToggleProvider: (providerId: string) => void;
    eventCategory?: EventCategory;
    searchHistory: string[];
    onClearHistory: () => void;
    savedSearches: string[];
    onSaveSearch: (query: string) => void;
    onRemoveSavedSearch: (query: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export const MediaSearchHeader: React.FC<MediaSearchHeaderProps> = ({
    query,
    onQueryChange,
    onSearch,
    suggestions,
    showSuggestions,
    onSuggestionSelect,
    onHideSuggestions,
    filters,
    // onFiltersChange, // Currently handled by parent component
    showFilters,
    onToggleFilters,
    onClearSearch,
    onResetFilters,
    availableProviders,
    activeProviders,
    onToggleProvider,
    eventCategory,
    searchHistory,
    onClearHistory,
    savedSearches,
    onSaveSearch,
    onRemoveSavedSearch,
    isLoading = false,
    disabled = false,
    className = '',
}) => {
    const { theme } = useTheme();
    const [showProviderDropdown, setShowProviderDropdown] = useState(false);
    const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const providerDropdownRef = useRef<HTMLDivElement>(null);
    const historyDropdownRef = useRef<HTMLDivElement>(null);

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

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                onHideSuggestions();
                setShowHistoryDropdown(false);
            }
        },
        [onHideSuggestions]
    );

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                providerDropdownRef.current &&
                !providerDropdownRef.current.contains(event.target as Node)
            ) {
                setShowProviderDropdown(false);
            }
            if (
                historyDropdownRef.current &&
                !historyDropdownRef.current.contains(event.target as Node)
            ) {
                setShowHistoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get category-specific suggestions
    const getCategorySuggestions = useCallback(() => {
        if (!eventCategory) return [];

        const categoryTerms: Record<EventCategory, string[]> = {
            [EventCategory.BusinessProfessional]: [
                'conference',
                'meeting',
                'presentation',
                'office',
                'corporate',
            ],
            [EventCategory.TechnologyInnovation]: [
                'technology',
                'innovation',
                'startup',
                'coding',
                'digital',
            ],
            [EventCategory.ArtsCulture]: [
                'art',
                'gallery',
                'exhibition',
                'creative',
                'cultural',
            ],
            [EventCategory.MusicEntertainment]: [
                'music',
                'concert',
                'stage',
                'performance',
                'festival',
            ],
            [EventCategory.SportsFitness]: [
                'sports',
                'fitness',
                'gym',
                'athletic',
                'competition',
            ],
            [EventCategory.FoodDrink]: [
                'food',
                'restaurant',
                'cooking',
                'culinary',
                'dining',
            ],
            [EventCategory.HealthWellness]: [
                'health',
                'wellness',
                'medical',
                'therapy',
                'yoga',
            ],
            [EventCategory.EducationLearning]: [
                'education',
                'learning',
                'classroom',
                'teaching',
                'workshop',
            ],
            [EventCategory.CommunitySocial]: [
                'community',
                'social',
                'gathering',
                'networking',
                'meetup',
            ],
            [EventCategory.FashionBeauty]: [
                'fashion',
                'beauty',
                'style',
                'model',
                'runway',
            ],
            [EventCategory.TravelAdventure]: [
                'travel',
                'adventure',
                'vacation',
                'tourism',
                'nature',
            ],
            [EventCategory.FamilyKids]: [
                'family',
                'children',
                'kids',
                'playground',
                'activities',
            ],
            [EventCategory.ReligionSpirituality]: [
                'spiritual',
                'church',
                'faith',
                'meditation',
                'ceremony',
            ],
            [EventCategory.CharityCauses]: [
                'charity',
                'volunteer',
                'donation',
                'fundraising',
                'community service',
            ],
            [EventCategory.GovernmentPolitics]: [
                'government',
                'politics',
                'election',
                'civic',
                'democracy',
            ],
            [EventCategory.ScienceResearch]: [
                'science',
                'research',
                'laboratory',
                'experiment',
                'discovery',
            ],
            [EventCategory.Automotive]: [
                'automotive',
                'car',
                'vehicle',
                'driving',
                'racing',
            ],
            [EventCategory.RealEstate]: [
                'real estate',
                'property',
                'house',
                'building',
                'architecture',
            ],
            [EventCategory.FinanceInvestment]: [
                'finance',
                'investment',
                'banking',
                'money',
                'trading',
            ],
            [EventCategory.MarketingSales]: [
                'marketing',
                'sales',
                'advertising',
                'branding',
                'promotion',
            ],
            [EventCategory.GamingEsports]: [
                'gaming',
                'esports',
                'video games',
                'tournament',
                'competition',
            ],
            [EventCategory.Photography]: [
                'photography',
                'camera',
                'photo',
                'portrait',
                'studio',
            ],
            [EventCategory.FilmMedia]: [
                'film',
                'movie',
                'cinema',
                'video',
                'production',
            ],
            [EventCategory.Other]: [
                'event',
                'gathering',
                'celebration',
                'occasion',
                'activity',
            ],
        };

        return categoryTerms[eventCategory] || [];
    }, [eventCategory]);

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
                            <p
                                className={`font-inter text-xs ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-blue-700'
                                }`}
                            >
                                Try:{' '}
                                {getCategorySuggestions()
                                    .slice(0, 3)
                                    .join(', ')}
                            </p>
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
                            if (
                                searchHistory.length > 0 ||
                                savedSearches.length > 0
                            ) {
                                setShowHistoryDropdown(true);
                            }
                        }}
                        placeholder='Search for images and videos...'
                        className={`w-full rounded-xl border py-3 pl-10 pr-32 font-inter transition-colors focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                        }`}
                        disabled={disabled}
                        aria-label='Search for images and videos'
                    />

                    {/* Search Actions */}
                    <div className='absolute right-2 top-1/2 flex -translate-y-1/2 items-center space-x-1'>
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

                        {/* Filters Toggle */}
                        <button
                            type='button'
                            onClick={onToggleFilters}
                            className={`relative rounded-lg p-1.5 transition-colors ${
                                showFilters || activeFiltersCount > 0
                                    ? 'bg-revlr-primary-blue text-white'
                                    : theme === 'dark'
                                      ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                            disabled={disabled}
                            title='Toggle filters'
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
                                                                    {provider
                                                                        .rateLimit
                                                                        .remaining ||
                                                                        0}
                                                                    /
                                                                    {
                                                                        provider
                                                                            .rateLimit
                                                                            .requests
                                                                    }{' '}
                                                                    requests
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

                {/* Search Suggestions */}
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
                                Suggestions
                            </h4>
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        handleSuggestionClick(suggestion)
                                    }
                                    className={`w-full rounded-lg px-3 py-2 text-left font-inter text-sm transition-colors ${
                                        theme === 'dark'
                                            ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <Search className='mr-2 inline size-3' />
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search History & Saved Searches */}
                {showHistoryDropdown &&
                    (searchHistory.length > 0 || savedSearches.length > 0) && (
                        <div
                            ref={historyDropdownRef}
                            className={`absolute inset-x-0 top-full z-10 mt-1 rounded-lg border shadow-lg ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className='p-2'>
                                {/* Saved Searches */}
                                {savedSearches.length > 0 && (
                                    <div className='mb-3'>
                                        <div className='mb-2 flex items-center justify-between'>
                                            <h4
                                                className={`px-2 font-inter text-xs font-medium uppercase tracking-wide ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Saved Searches
                                            </h4>
                                        </div>
                                        {savedSearches
                                            .slice(0, 5)
                                            .map((search, index) => (
                                                <div
                                                    key={index}
                                                    className='group flex items-center'
                                                >
                                                    <button
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                search
                                                            )
                                                        }
                                                        className={`flex-1 rounded-lg px-3 py-2 text-left font-inter text-sm transition-colors ${
                                                            theme === 'dark'
                                                                ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        <Star className='mr-2 inline size-3 text-yellow-500' />
                                                        {search}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onRemoveSavedSearch(
                                                                search
                                                            )
                                                        }
                                                        className={`rounded p-1 opacity-0 transition-all group-hover:opacity-100 ${
                                                            theme === 'dark'
                                                                ? 'text-gray-400 hover:text-red-400'
                                                                : 'text-gray-500 hover:text-red-500'
                                                        }`}
                                                        title='Remove saved search'
                                                    >
                                                        <X className='size-3' />
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                )}

                                {/* Recent Searches */}
                                {searchHistory.length > 0 && (
                                    <div>
                                        <div className='mb-2 flex items-center justify-between'>
                                            <h4
                                                className={`px-2 font-inter text-xs font-medium uppercase tracking-wide ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Recent Searches
                                            </h4>
                                            <button
                                                onClick={onClearHistory}
                                                className={`px-2 font-inter text-xs transition-colors ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400 hover:text-white'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        {searchHistory
                                            .slice(0, 5)
                                            .map((search, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() =>
                                                        handleSuggestionClick(
                                                            search
                                                        )
                                                    }
                                                    className={`w-full rounded-lg px-3 py-2 text-left font-inter text-sm transition-colors ${
                                                        theme === 'dark'
                                                            ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <Clock className='mr-2 inline size-3' />
                                                    {search}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
            </form>

            {/* Loading Indicator */}
            {isLoading && (
                <div className='mt-3 flex items-center justify-center'>
                    <Loader2 className='mr-2 size-4 animate-spin text-revlr-primary-blue' />
                    <span
                        className={`font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Searching...
                    </span>
                </div>
            )}

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
                <div className='mt-3 flex items-center space-x-2'>
                    <span
                        className={`font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Active filters:
                    </span>
                    <div className='flex flex-wrap gap-1'>
                        {Object.entries(filters).map(([key, value]) => {
                            if (!value) return null;
                            return (
                                <span
                                    key={key}
                                    className='inline-flex items-center rounded-full bg-revlr-primary-blue/10 px-2 py-1 text-xs font-medium text-revlr-primary-blue'
                                >
                                    {key}: {value}
                                </span>
                            );
                        })}
                    </div>
                    <button
                        onClick={onResetFilters}
                        className={`font-inter text-xs transition-colors ${
                            theme === 'dark'
                                ? 'text-gray-400 hover:text-white'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
};

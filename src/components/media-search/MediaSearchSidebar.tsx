'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    Filter,
    X,
    ChevronDown,
    ChevronRight,
    Image,
    Video,
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Palette,
    Ruler,
    Grid3X3,
    RotateCcw,
} from 'lucide-react';
import type { MediaFilters } from '@src/types/media-search';
import {
    EventCategory,
    CATEGORY_DESCRIPTIONS,
    CATEGORY_GROUPS,
} from '@src/lib/constants/eventCategories';

interface MediaSearchSidebarProps {
    filters: MediaFilters;
    onFiltersChange: (filters: MediaFilters) => void;
    onResetFilters: () => void;
    eventCategory?: EventCategory;
    isVisible: boolean;
    onClose: () => void;
    className?: string;
}

// interface FilterSection {
//     id: string;
//     title: string;
//     icon: React.ReactNode;
//     isExpanded: boolean;
// }

const COLOR_OPTIONS = [
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'yellow', label: 'Yellow', color: '#eab308' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'pink', label: 'Pink', color: '#ec4899' },
    { value: 'black', label: 'Black', color: '#000000' },
    { value: 'white', label: 'White', color: '#ffffff' },
    { value: 'gray', label: 'Gray', color: '#6b7280' },
];

const SIZE_OPTIONS = [
    { value: 'small', label: 'Small', description: 'Up to 1024px' },
    { value: 'medium', label: 'Medium', description: '1024px - 2048px' },
    { value: 'large', label: 'Large', description: '2048px - 4096px' },
    { value: 'extra-large', label: 'Extra Large', description: '4096px+' },
];

export const MediaSearchSidebar: React.FC<MediaSearchSidebarProps> = ({
    filters,
    onFiltersChange,
    onResetFilters,
    eventCategory,
    isVisible,
    onClose,
    className = '',
}) => {
    const { theme } = useTheme();
    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >({
        mediaType: true,
        orientation: true,
        category: true,
        color: false,
        size: false,
    });

    // Toggle section expansion
    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    }, []);

    // Update filter value
    const updateFilter = useCallback(
        <K extends keyof MediaFilters>(key: K, value: MediaFilters[K]) => {
            onFiltersChange({
                ...filters,
                [key]: value,
            });
        },
        [filters, onFiltersChange]
    );

    // Clear specific filter
    const clearFilter = useCallback(
        (key: keyof MediaFilters) => {
            const newFilters = { ...filters };
            delete newFilters[key];
            onFiltersChange(newFilters);
        },
        [filters, onFiltersChange]
    );

    // Get active filters count
    const activeFiltersCount = Object.values(filters).filter(
        (value) => value !== undefined && value !== '' && value !== null
    ).length;

    // Get category suggestions based on event category
    const getCategorySuggestions = useCallback(() => {
        if (!eventCategory) return [];

        const group = Object.entries(CATEGORY_GROUPS).find(([, categories]) =>
            categories.includes(eventCategory)
        );

        return group ? group[1].filter((cat) => cat !== eventCategory) : [];
    }, [eventCategory]);

    if (!isVisible) return null;

    return (
        <div
            className={`w-80 overflow-y-auto border-r ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-gray-50'
            } ${className}`}
        >
            {/* Header */}
            <div
                className={`sticky top-0 z-10 border-b p-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-gray-50'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        <Filter
                            className={`size-5 ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        />
                        <h3
                            className={`font-inter text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Filters
                        </h3>
                        {activeFiltersCount > 0 && (
                            <span className='flex size-5 items-center justify-center rounded-full bg-revlr-primary-blue text-xs font-bold text-white'>
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <div className='flex items-center space-x-1'>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={onResetFilters}
                                className={`rounded-lg p-1.5 transition-colors ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                }`}
                                title='Reset all filters'
                            >
                                <RotateCcw className='size-4' />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`rounded-lg p-1.5 transition-colors ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                            title='Close filters'
                        >
                            <X className='size-4' />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Sections */}
            <div className='space-y-6 p-4'>
                {/* Media Type Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('mediaType')}
                        className={`flex w-full items-center justify-between rounded-lg p-2 transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-revlr-dark-border'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        <div className='flex items-center space-x-2'>
                            <Image
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Media Type
                            </span>
                        </div>
                        {expandedSections.mediaType ? (
                            <ChevronDown className='size-4' />
                        ) : (
                            <ChevronRight className='size-4' />
                        )}
                    </button>

                    {expandedSections.mediaType && (
                        <div className='mt-2 space-y-2 pl-6'>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='mediaType'
                                    value=''
                                    checked={!filters.mediaType}
                                    onChange={() => clearFilter('mediaType')}
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <span className='font-inter text-sm'>
                                    All Media
                                </span>
                            </label>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='mediaType'
                                    value='image'
                                    checked={filters.mediaType === 'image'}
                                    onChange={() =>
                                        updateFilter('mediaType', 'image')
                                    }
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <Image className='size-4' />
                                <span className='font-inter text-sm'>
                                    Images Only
                                </span>
                            </label>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='mediaType'
                                    value='video'
                                    checked={filters.mediaType === 'video'}
                                    onChange={() =>
                                        updateFilter('mediaType', 'video')
                                    }
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <Video className='size-4' />
                                <span className='font-inter text-sm'>
                                    Videos Only
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Orientation Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('orientation')}
                        className={`flex w-full items-center justify-between rounded-lg p-2 transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-revlr-dark-border'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        <div className='flex items-center space-x-2'>
                            <RectangleHorizontal
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Orientation
                            </span>
                        </div>
                        {expandedSections.orientation ? (
                            <ChevronDown className='size-4' />
                        ) : (
                            <ChevronRight className='size-4' />
                        )}
                    </button>

                    {expandedSections.orientation && (
                        <div className='mt-2 space-y-2 pl-6'>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='orientation'
                                    value=''
                                    checked={!filters.orientation}
                                    onChange={() => clearFilter('orientation')}
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <span className='font-inter text-sm'>
                                    Any Orientation
                                </span>
                            </label>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='orientation'
                                    value='landscape'
                                    checked={
                                        filters.orientation === 'landscape'
                                    }
                                    onChange={() =>
                                        updateFilter('orientation', 'landscape')
                                    }
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <RectangleHorizontal className='size-4' />
                                <span className='font-inter text-sm'>
                                    Landscape
                                </span>
                            </label>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='orientation'
                                    value='portrait'
                                    checked={filters.orientation === 'portrait'}
                                    onChange={() =>
                                        updateFilter('orientation', 'portrait')
                                    }
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <RectangleVertical className='size-4' />
                                <span className='font-inter text-sm'>
                                    Portrait
                                </span>
                            </label>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='orientation'
                                    value='square'
                                    checked={filters.orientation === 'square'}
                                    onChange={() =>
                                        updateFilter('orientation', 'square')
                                    }
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <Square className='size-4' />
                                <span className='font-inter text-sm'>
                                    Square
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Category Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('category')}
                        className={`flex w-full items-center justify-between rounded-lg p-2 transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-revlr-dark-border'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        <div className='flex items-center space-x-2'>
                            <Grid3X3
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Category
                            </span>
                        </div>
                        {expandedSections.category ? (
                            <ChevronDown className='size-4' />
                        ) : (
                            <ChevronRight className='size-4' />
                        )}
                    </button>

                    {expandedSections.category && (
                        <div className='mt-2 space-y-2 pl-6'>
                            {/* Current Event Category */}
                            {eventCategory && (
                                <div
                                    className={`mb-3 rounded-lg p-2 ${
                                        theme === 'dark'
                                            ? 'bg-revlr-dark-border'
                                            : 'bg-blue-50'
                                    }`}
                                >
                                    <p
                                        className={`font-inter text-xs font-medium ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-blue-700'
                                        }`}
                                    >
                                        Current Event Category
                                    </p>
                                    <p
                                        className={`font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-blue-900'
                                        }`}
                                    >
                                        {CATEGORY_DESCRIPTIONS[eventCategory]}
                                    </p>
                                </div>
                            )}

                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='category'
                                    value=''
                                    checked={!filters.category}
                                    onChange={() => clearFilter('category')}
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <span className='font-inter text-sm'>
                                    All Categories
                                </span>
                            </label>

                            {/* Related Categories */}
                            {eventCategory &&
                                getCategorySuggestions().length > 0 && (
                                    <div>
                                        <p
                                            className={`mb-2 font-inter text-xs font-medium uppercase tracking-wide ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Related Categories
                                        </p>
                                        {getCategorySuggestions()
                                            .slice(0, 5)
                                            .map((category) => (
                                                <label
                                                    key={category}
                                                    className={`flex cursor-pointer items-center space-x-3 ${
                                                        theme === 'dark'
                                                            ? 'text-gray-300'
                                                            : 'text-gray-700'
                                                    }`}
                                                >
                                                    <input
                                                        type='radio'
                                                        name='category'
                                                        value={category}
                                                        checked={
                                                            filters.category ===
                                                            category
                                                        }
                                                        onChange={() =>
                                                            updateFilter(
                                                                'category',
                                                                category
                                                            )
                                                        }
                                                        className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                    />
                                                    <span className='font-inter text-sm'>
                                                        {
                                                            CATEGORY_DESCRIPTIONS[
                                                                category
                                                            ]
                                                        }
                                                    </span>
                                                </label>
                                            ))}
                                    </div>
                                )}
                        </div>
                    )}
                </div>

                {/* Color Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('color')}
                        className={`flex w-full items-center justify-between rounded-lg p-2 transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-revlr-dark-border'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        <div className='flex items-center space-x-2'>
                            <Palette
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Color
                            </span>
                            {filters.color && (
                                <div
                                    className='size-3 rounded-full border border-gray-300'
                                    style={{
                                        backgroundColor: COLOR_OPTIONS.find(
                                            (c) => c.value === filters.color
                                        )?.color,
                                    }}
                                />
                            )}
                        </div>
                        {expandedSections.color ? (
                            <ChevronDown className='size-4' />
                        ) : (
                            <ChevronRight className='size-4' />
                        )}
                    </button>

                    {expandedSections.color && (
                        <div className='mt-2 pl-6'>
                            <div className='grid grid-cols-5 gap-2'>
                                {COLOR_OPTIONS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() =>
                                            filters.color === color.value
                                                ? clearFilter('color')
                                                : updateFilter(
                                                      'color',
                                                      color.value
                                                  )
                                        }
                                        className={`relative size-8 rounded-lg border-2 transition-all ${
                                            filters.color === color.value
                                                ? 'border-revlr-primary-blue ring-2 ring-revlr-primary-blue/20'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: color.color }}
                                        title={color.label}
                                    >
                                        {color.value === 'white' && (
                                            <div
                                                className='absolute inset-0 rounded-lg border border-gray-200'
                                                aria-hidden='true'
                                            />
                                        )}
                                        {filters.color === color.value && (
                                            <div className='absolute inset-0 flex items-center justify-center'>
                                                <div
                                                    className={`size-2 rounded-full ${
                                                        color.value ===
                                                            'white' ||
                                                        color.value === 'yellow'
                                                            ? 'bg-gray-800'
                                                            : 'bg-white'
                                                    }`}
                                                />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {filters.color && (
                                <button
                                    onClick={() => clearFilter('color')}
                                    className={`mt-2 w-full rounded-lg border border-dashed py-2 text-center font-inter text-xs transition-colors ${
                                        theme === 'dark'
                                            ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                            : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    Clear Color Filter
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Size Filter */}
                <div>
                    <button
                        onClick={() => toggleSection('size')}
                        className={`flex w-full items-center justify-between rounded-lg p-2 transition-colors ${
                            theme === 'dark'
                                ? 'hover:bg-revlr-dark-border'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        <div className='flex items-center space-x-2'>
                            <Ruler
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Size
                            </span>
                        </div>
                        {expandedSections.size ? (
                            <ChevronDown className='size-4' />
                        ) : (
                            <ChevronRight className='size-4' />
                        )}
                    </button>

                    {expandedSections.size && (
                        <div className='mt-2 space-y-2 pl-6'>
                            <label
                                className={`flex cursor-pointer items-center space-x-3 ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                <input
                                    type='radio'
                                    name='size'
                                    value=''
                                    checked={!filters.minWidth}
                                    onChange={() => {
                                        clearFilter('minWidth');
                                        clearFilter('minHeight');
                                    }}
                                    className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                />
                                <div>
                                    <span className='font-inter text-sm'>
                                        Any Size
                                    </span>
                                </div>
                            </label>
                            {SIZE_OPTIONS.map((size) => {
                                const minWidth =
                                    size.value === 'small'
                                        ? 0
                                        : size.value === 'medium'
                                          ? 1024
                                          : size.value === 'large'
                                            ? 2048
                                            : 4096;
                                const isSelected =
                                    filters.minWidth === minWidth;

                                return (
                                    <label
                                        key={size.value}
                                        className={`flex cursor-pointer items-center space-x-3 ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-700'
                                        }`}
                                    >
                                        <input
                                            type='radio'
                                            name='size'
                                            value={size.value}
                                            checked={isSelected}
                                            onChange={() => {
                                                updateFilter(
                                                    'minWidth',
                                                    minWidth
                                                );
                                                updateFilter(
                                                    'minHeight',
                                                    minWidth
                                                );
                                            }}
                                            className='text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                        />
                                        <div>
                                            <span className='font-inter text-sm'>
                                                {size.label}
                                            </span>
                                            <p
                                                className={`font-inter text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {size.description}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {activeFiltersCount > 0 && (
                <div
                    className={`sticky bottom-0 border-t p-4 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <button
                        onClick={onResetFilters}
                        className='w-full rounded-xl border border-gray-300 px-4 py-2 font-inter font-medium text-gray-700 transition-colors hover:bg-gray-50'
                    >
                        Clear All Filters ({activeFiltersCount})
                    </button>
                </div>
            )}
        </div>
    );
};

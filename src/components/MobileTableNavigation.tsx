'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useTouchGestures } from '@src/hooks/useTouchGestures';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
    ArrowUpDown,
    Filter,
    Search,
    Grid,
    List,
    Download,
} from 'lucide-react';
import { Button } from './ui/button';

interface MobileTableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    width?: string;
    priority: 'high' | 'medium' | 'low';
}

interface MobileTableNavigationProps {
    columns: MobileTableColumn[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onSort?: (column: string, direction: 'asc' | 'desc') => void;
    onSearch?: (query: string) => void;
    onViewModeChange?: (mode: 'grid' | 'list' | 'cards') => void;
    onExport?: () => void;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    viewMode?: 'grid' | 'list' | 'cards';
    className?: string;
    showSearch?: boolean;
    showFilters?: boolean;
    showViewToggle?: boolean;
    showExport?: boolean;
}

export const MobileTableNavigation: React.FC<MobileTableNavigationProps> = ({
    columns,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onSort,
    onSearch,
    onViewModeChange,
    onExport,
    sortColumn,
    sortDirection = 'asc',
    viewMode = 'list',
    className = '',
    showSearch = true,
    showFilters = true,
    showViewToggle = true,
    showExport = true,
}) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFiltersPanel, setShowFiltersPanel] = useState(false);
    const [showSortPanel, setShowSortPanel] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const navigationRef = useRef<HTMLDivElement>(null);

    // Touch gestures for pagination
    const { attachGestureListeners } = useTouchGestures({
        onSwipeLeft: () => {
            if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
            }
        },
        onSwipeRight: () => {
            if (currentPage > 1) {
                onPageChange(currentPage - 1);
            }
        },
        enableSwipe: true,
        swipeThreshold: 80,
    });

    // Attach gesture listeners to navigation
    useEffect(() => {
        if (navigationRef.current) {
            return attachGestureListeners(navigationRef.current);
        }
    }, [attachGestureListeners]);

    // Handle search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    // Handle sort
    const handleSort = (column: string) => {
        const newDirection =
            sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort?.(column, newDirection);
        setShowSortPanel(false);
    };

    // Generate page numbers for mobile pagination
    const getVisiblePages = () => {
        const delta = 1;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and Controls Bar */}
            <div className='flex items-center gap-2'>
                {/* Search Input */}
                {showSearch && (
                    <div className='flex-1'>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                            <input
                                type='text'
                                placeholder='Search...'
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm transition-all duration-200 ${
                                    isSearchFocused
                                        ? 'border-revlr-primary-blue ring-2 ring-revlr-primary-blue/20'
                                        : theme === 'dark'
                                          ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                          : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>
                    </div>
                )}

                {/* Control Buttons */}
                <div className='flex items-center gap-1'>
                    {showFilters && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                                setShowFiltersPanel(!showFiltersPanel)
                            }
                            className={`p-2 ${showFiltersPanel ? 'bg-revlr-primary-blue/10 text-revlr-primary-blue' : ''}`}
                            aria-label='Toggle filters'
                        >
                            <Filter className='size-4' />
                        </Button>
                    )}

                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowSortPanel(!showSortPanel)}
                        className={`p-2 ${showSortPanel ? 'bg-revlr-primary-blue/10 text-revlr-primary-blue' : ''}`}
                        aria-label='Toggle sort options'
                    >
                        <ArrowUpDown className='size-4' />
                    </Button>

                    {showViewToggle && (
                        <div className='flex overflow-hidden rounded-lg border border-gray-300 dark:border-revlr-dark-border'>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => onViewModeChange?.('list')}
                                className={`rounded-none p-2 ${
                                    viewMode === 'list'
                                        ? 'bg-revlr-primary-blue text-white'
                                        : ''
                                }`}
                                aria-label='List view'
                            >
                                <List className='size-4' />
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => onViewModeChange?.('grid')}
                                className={`rounded-none p-2 ${
                                    viewMode === 'grid'
                                        ? 'bg-revlr-primary-blue text-white'
                                        : ''
                                }`}
                                aria-label='Grid view'
                            >
                                <Grid className='size-4' />
                            </Button>
                        </div>
                    )}

                    {showExport && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onExport}
                            className='p-2'
                            aria-label='Export data'
                        >
                            <Download className='size-4' />
                        </Button>
                    )}
                </div>
            </div>

            {/* Sort Panel */}
            {showSortPanel && (
                <div
                    className={`rounded-lg border p-4 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    <h3 className='mb-3 font-semibold'>Sort by</h3>
                    <div className='grid grid-cols-1 gap-2'>
                        {columns
                            .filter((col) => col.sortable)
                            .map((column) => (
                                <button
                                    key={column.key}
                                    onClick={() => handleSort(column.key)}
                                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                                        sortColumn === column.key
                                            ? 'border-revlr-primary-blue bg-revlr-primary-blue/10 text-revlr-primary-blue'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border hover:bg-revlr-dark-border/50'
                                              : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className='font-medium'>
                                        {column.label}
                                    </span>
                                    {sortColumn === column.key && (
                                        <span className='text-sm'>
                                            {sortDirection === 'asc'
                                                ? '↑'
                                                : '↓'}
                                        </span>
                                    )}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            {/* Filters Panel */}
            {showFiltersPanel && (
                <div
                    className={`rounded-lg border p-4 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    <h3 className='mb-3 font-semibold'>Filters</h3>
                    <div className='space-y-3'>
                        {columns
                            .filter((col) => col.filterable)
                            .map((column) => (
                                <div key={column.key}>
                                    <label className='mb-1 block text-sm font-medium'>
                                        {column.label}
                                    </label>
                                    <input
                                        type='text'
                                        placeholder={`Filter by ${column.label.toLowerCase()}`}
                                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                    />
                                </div>
                            ))}
                        <div className='flex gap-2 pt-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setShowFiltersPanel(false)}
                                className='flex-1'
                            >
                                Apply
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setShowFiltersPanel(false)}
                                className='flex-1'
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div
                ref={navigationRef}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                {/* Results Info */}
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                    {totalItems > 0 ? (
                        <>
                            {(currentPage - 1) * pageSize + 1}-
                            {Math.min(currentPage * pageSize, totalItems)} of{' '}
                            {totalItems}
                        </>
                    ) : (
                        'No results'
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className='flex items-center gap-1'>
                        {/* First Page */}
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className='p-2'
                            aria-label='First page'
                        >
                            <ChevronsLeft className='size-4' />
                        </Button>

                        {/* Previous Page */}
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className='p-2'
                            aria-label='Previous page'
                        >
                            <ChevronLeft className='size-4' />
                        </Button>

                        {/* Page Numbers */}
                        <div className='flex items-center gap-1'>
                            {getVisiblePages().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === '...' ? (
                                        <span className='px-2 py-1 text-gray-400'>
                                            <MoreHorizontal className='size-4' />
                                        </span>
                                    ) : (
                                        <Button
                                            variant={
                                                currentPage === page
                                                    ? 'default'
                                                    : 'ghost'
                                            }
                                            size='sm'
                                            onClick={() =>
                                                onPageChange(page as number)
                                            }
                                            className='h-8 min-w-[32px] p-0'
                                        >
                                            {page}
                                        </Button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Next Page */}
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className='p-2'
                            aria-label='Next page'
                        >
                            <ChevronRight className='size-4' />
                        </Button>

                        {/* Last Page */}
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className='p-2'
                            aria-label='Last page'
                        >
                            <ChevronsRight className='size-4' />
                        </Button>
                    </div>
                )}
            </div>

            {/* Swipe Hint */}
            {totalPages > 1 && (
                <div
                    className={`text-center text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                    Swipe left/right to navigate pages
                </div>
            )}
        </div>
    );
};

export default MobileTableNavigation;

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue, useAdvancedDebounce } from '../hooks/useDebounce';
import { useTheme } from '../lib/ThemeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    Search,
    Filter,
    X,
    Calendar,
    DollarSign,
    Users,
    Tag,
    MapPin,
    Clock,
    RefreshCw,
} from 'lucide-react';

export interface SearchFilters {
    searchTerm: string;
    status: string;
    category: string;
    startDate: string;
    endDate: string;
    isVirtual: boolean | null;
    hasRegistrations: boolean | null;
    minRevenue: number | null;
    maxRevenue: number | null;
    minRegistrations: number | null;
    maxRegistrations: number | null;
    venue: string;
}

interface OptimizedSearchAndFilterProps {
    filters: SearchFilters;
    onFiltersChange: (filters: Partial<SearchFilters>) => void;
    onClearFilters: () => void;
    onRefresh?: () => void;
    isLoading?: boolean;
    placeholder?: string;
    showAdvancedFilters?: boolean;
    className?: string;
}

const OptimizedSearchAndFilter: React.FC<OptimizedSearchAndFilterProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
    onRefresh,
    isLoading = false,
    placeholder = 'Search events...',
    showAdvancedFilters = true,
    className = '',
}) => {
    const { theme } = useTheme();
    const [showFilters, setShowFilters] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);

    // Debounced search term
    const debouncedSearchTerm = useDebouncedValue(localSearchTerm, 300);

    // Advanced debounced filter change handler
    const { debouncedCallback: debouncedFilterChange } = useAdvancedDebounce(
        (filterUpdates: Partial<SearchFilters>) => {
            onFiltersChange(filterUpdates);
        },
        150,
        { trailing: true }
    );

    // Update search term when debounced value changes
    React.useEffect(() => {
        if (debouncedSearchTerm !== filters.searchTerm) {
            debouncedFilterChange({ searchTerm: debouncedSearchTerm });
        }
    }, [debouncedSearchTerm, filters.searchTerm, debouncedFilterChange]);

    // Optimized filter change handler
    const handleFilterChange = useCallback(
        (key: keyof SearchFilters, value: any) => {
            if (key === 'searchTerm') {
                setLocalSearchTerm(value);
            } else {
                debouncedFilterChange({ [key]: value });
            }
        },
        [debouncedFilterChange]
    );

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.status) count++;
        if (filters.category) count++;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        if (filters.isVirtual !== null) count++;
        if (filters.hasRegistrations !== null) count++;
        if (filters.minRevenue !== null) count++;
        if (filters.maxRevenue !== null) count++;
        if (filters.minRegistrations !== null) count++;
        if (filters.maxRegistrations !== null) count++;
        if (filters.venue) count++;
        return count;
    }, [filters]);

    // Clear individual filter
    const clearFilter = useCallback(
        (key: keyof SearchFilters) => {
            const clearedValue =
                key === 'searchTerm'
                    ? ''
                    : key.includes('is') || key.includes('has')
                      ? null
                      : key.includes('min') || key.includes('max')
                        ? null
                        : '';

            if (key === 'searchTerm') {
                setLocalSearchTerm('');
            }

            handleFilterChange(key, clearedValue);
        },
        [handleFilterChange]
    );

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and main controls */}
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                {/* Search input */}
                <div className='relative max-w-md flex-1'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                    <Input
                        type='text'
                        placeholder={placeholder}
                        value={localSearchTerm}
                        onChange={(e) => setLocalSearchTerm(e.target.value)}
                        className='pl-10 pr-10'
                        disabled={isLoading}
                    />
                    {localSearchTerm && (
                        <button
                            onClick={() => {
                                setLocalSearchTerm('');
                                handleFilterChange('searchTerm', '');
                            }}
                            className='absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600'
                            disabled={isLoading}
                        >
                            <X className='h-4 w-4' />
                        </button>
                    )}
                </div>

                {/* Action buttons */}
                <div className='flex items-center gap-2'>
                    {showAdvancedFilters && (
                        <Dialog
                            open={showFilters}
                            onOpenChange={setShowFilters}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className='flex items-center gap-2'
                                    disabled={isLoading}
                                >
                                    <Filter className='h-4 w-4' />
                                    Filters
                                    {activeFilterCount > 0 && (
                                        <span className='ml-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white'>
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className='max-w-2xl'>
                                <DialogHeader>
                                    <DialogTitle>Advanced Filters</DialogTitle>
                                </DialogHeader>
                                <AdvancedFilters
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onClearFilter={clearFilter}
                                />
                            </DialogContent>
                        </Dialog>
                    )}

                    {onRefresh && (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={onRefresh}
                            disabled={isLoading}
                            className='flex items-center gap-2'
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
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
                            <X className='h-4 w-4' />
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            {/* Active filters display */}
            {activeFilterCount > 0 && (
                <div className='flex flex-wrap gap-2'>
                    {filters.status && (
                        <FilterChip
                            label={`Status: ${getStatusLabel(filters.status)}`}
                            onRemove={() => clearFilter('status')}
                        />
                    )}
                    {filters.category && (
                        <FilterChip
                            label={`Category: ${filters.category}`}
                            onRemove={() => clearFilter('category')}
                        />
                    )}
                    {filters.startDate && (
                        <FilterChip
                            label={`From: ${new Date(filters.startDate).toLocaleDateString()}`}
                            onRemove={() => clearFilter('startDate')}
                        />
                    )}
                    {filters.endDate && (
                        <FilterChip
                            label={`To: ${new Date(filters.endDate).toLocaleDateString()}`}
                            onRemove={() => clearFilter('endDate')}
                        />
                    )}
                    {filters.isVirtual !== null && (
                        <FilterChip
                            label={
                                filters.isVirtual
                                    ? 'Virtual Events'
                                    : 'In-Person Events'
                            }
                            onRemove={() => clearFilter('isVirtual')}
                        />
                    )}
                    {filters.hasRegistrations !== null && (
                        <FilterChip
                            label={
                                filters.hasRegistrations
                                    ? 'Has Registrations'
                                    : 'No Registrations'
                            }
                            onRemove={() => clearFilter('hasRegistrations')}
                        />
                    )}
                    {filters.minRevenue !== null && (
                        <FilterChip
                            label={`Min Revenue: $${filters.minRevenue}`}
                            onRemove={() => clearFilter('minRevenue')}
                        />
                    )}
                    {filters.maxRevenue !== null && (
                        <FilterChip
                            label={`Max Revenue: $${filters.maxRevenue}`}
                            onRemove={() => clearFilter('maxRevenue')}
                        />
                    )}
                    {filters.venue && (
                        <FilterChip
                            label={`Venue: ${filters.venue}`}
                            onRemove={() => clearFilter('venue')}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// Advanced filters component
interface AdvancedFiltersProps {
    filters: SearchFilters;
    onFilterChange: (key: keyof SearchFilters, value: any) => void;
    onClearFilter: (key: keyof SearchFilters) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    filters,
    onFilterChange,
    onClearFilter,
}) => {
    return (
        <div className='space-y-6'>
            {/* Status and Category */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <Tag className='mr-2 inline h-4 w-4' />
                        Event Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            onFilterChange('status', e.target.value)
                        }
                        className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                    >
                        <option value=''>All Statuses</option>
                        <option value='0'>Draft</option>
                        <option value='1'>Published</option>
                        <option value='2'>Cancelled</option>
                        <option value='3'>Completed</option>
                    </select>
                </div>

                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <Tag className='mr-2 inline h-4 w-4' />
                        Category
                    </label>
                    <Input
                        type='text'
                        placeholder='Enter category'
                        value={filters.category}
                        onChange={(e) =>
                            onFilterChange('category', e.target.value)
                        }
                    />
                </div>
            </div>

            {/* Date Range */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <Calendar className='mr-2 inline h-4 w-4' />
                        Start Date From
                    </label>
                    <Input
                        type='date'
                        value={filters.startDate}
                        onChange={(e) =>
                            onFilterChange('startDate', e.target.value)
                        }
                    />
                </div>

                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <Calendar className='mr-2 inline h-4 w-4' />
                        Start Date To
                    </label>
                    <Input
                        type='date'
                        value={filters.endDate}
                        onChange={(e) =>
                            onFilterChange('endDate', e.target.value)
                        }
                    />
                </div>
            </div>

            {/* Revenue Range */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <DollarSign className='mr-2 inline h-4 w-4' />
                        Minimum Revenue
                    </label>
                    <Input
                        type='number'
                        placeholder='0'
                        value={filters.minRevenue || ''}
                        onChange={(e) =>
                            onFilterChange(
                                'minRevenue',
                                e.target.value ? Number(e.target.value) : null
                            )
                        }
                    />
                </div>

                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <DollarSign className='mr-2 inline h-4 w-4' />
                        Maximum Revenue
                    </label>
                    <Input
                        type='number'
                        placeholder='No limit'
                        value={filters.maxRevenue || ''}
                        onChange={(e) =>
                            onFilterChange(
                                'maxRevenue',
                                e.target.value ? Number(e.target.value) : null
                            )
                        }
                    />
                </div>
            </div>

            {/* Registration Range */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <Users className='mr-2 inline h-4 w-4' />
                        Minimum Registrations
                    </label>
                    <Input
                        type='number'
                        placeholder='0'
                        value={filters.minRegistrations || ''}
                        onChange={(e) =>
                            onFilterChange(
                                'minRegistrations',
                                e.target.value ? Number(e.target.value) : null
                            )
                        }
                    />
                </div>

                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        <Users className='mr-2 inline h-4 w-4' />
                        Maximum Registrations
                    </label>
                    <Input
                        type='number'
                        placeholder='No limit'
                        value={filters.maxRegistrations || ''}
                        onChange={(e) =>
                            onFilterChange(
                                'maxRegistrations',
                                e.target.value ? Number(e.target.value) : null
                            )
                        }
                    />
                </div>
            </div>

            {/* Venue */}
            <div>
                <label className='mb-2 block text-sm font-medium'>
                    <MapPin className='mr-2 inline h-4 w-4' />
                    Venue
                </label>
                <Input
                    type='text'
                    placeholder='Enter venue name'
                    value={filters.venue}
                    onChange={(e) => onFilterChange('venue', e.target.value)}
                />
            </div>

            {/* Boolean filters */}
            <div className='space-y-4'>
                <div className='flex items-center space-x-4'>
                    <label className='flex items-center space-x-2'>
                        <input
                            type='checkbox'
                            checked={filters.isVirtual === true}
                            onChange={(e) =>
                                onFilterChange(
                                    'isVirtual',
                                    e.target.checked ? true : null
                                )
                            }
                            className='rounded'
                        />
                        <span className='text-sm'>Virtual Events Only</span>
                    </label>

                    <label className='flex items-center space-x-2'>
                        <input
                            type='checkbox'
                            checked={filters.hasRegistrations === true}
                            onChange={(e) =>
                                onFilterChange(
                                    'hasRegistrations',
                                    e.target.checked ? true : null
                                )
                            }
                            className='rounded'
                        />
                        <span className='text-sm'>Has Registrations</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

// Filter chip component
interface FilterChipProps {
    label: string;
    onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => (
    <span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
        {label}
        <button
            onClick={onRemove}
            className='ml-1 hover:text-blue-600 dark:hover:text-blue-300'
        >
            <X className='h-3 w-3' />
        </button>
    </span>
);

// Helper function
const getStatusLabel = (status: string) => {
    switch (status) {
        case '0':
            return 'Draft';
        case '1':
            return 'Published';
        case '2':
            return 'Cancelled';
        case '3':
            return 'Completed';
        default:
            return status;
    }
};

export default React.memo(OptimizedSearchAndFilter);

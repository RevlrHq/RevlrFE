'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Star,
    Trash2,
    Clock,
    Filter,
    History,
    Search,
    Calendar,
    Users,
    DollarSign,
} from 'lucide-react';
import type { FilterPreset, AdvancedFilterOptions } from './AdvancedFilters';

interface FilterPresetsManagerProps {
    presets: FilterPreset[];
    onLoadPreset: (preset: FilterPreset) => void;
    onDeletePreset: (presetId: string) => void;
    filterHistory: Partial<AdvancedFilterOptions>[];
    onLoadFromHistory: (filters: Partial<AdvancedFilterOptions>) => void;
}

const FilterPresetsManager: React.FC<FilterPresetsManagerProps> = ({
    presets,
    onLoadPreset,
    onDeletePreset,
    filterHistory,
    onLoadFromHistory,
}) => {
    const [activeTab, setActiveTab] = useState<'presets' | 'history'>(
        'presets'
    );
    const [searchTerm, setSearchTerm] = useState('');

    // Filter presets based on search term
    const filteredPresets = presets.filter((preset) =>
        preset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort presets by usage and recency
    const sortedPresets = [...filteredPresets].sort((a, b) => {
        // First by usage count (descending)
        if (b.useCount !== a.useCount) {
            return b.useCount - a.useCount;
        }
        // Then by last used (most recent first)
        if (a.lastUsed && b.lastUsed) {
            return (
                new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
            );
        }
        // Finally by creation date (most recent first)
        return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    });

    // Get filter summary for display
    const getFilterSummary = (filters: Partial<AdvancedFilterOptions>) => {
        const summary: string[] = [];

        if (filters.searchTerm) {
            summary.push(`Search: "${filters.searchTerm}"`);
        }
        if (filters.status) {
            const statusLabels: Record<string, string> = {
                '0': 'Draft',
                '1': 'Published',
                '2': 'Cancelled',
                '3': 'Completed',
            };
            summary.push(
                `Status: ${statusLabels[filters.status] || filters.status}`
            );
        }
        if (filters.category) {
            summary.push(`Category: ${filters.category}`);
        }
        if (filters.startDate || filters.endDate) {
            const dateRange = [filters.startDate, filters.endDate]
                .filter(Boolean)
                .join(' - ');
            summary.push(`Dates: ${dateRange}`);
        }
        if (filters.minRevenue || filters.maxRevenue) {
            const revenueRange = [
                filters.minRevenue ? `$${filters.minRevenue}` : '',
                filters.maxRevenue ? `$${filters.maxRevenue}` : '',
            ]
                .filter(Boolean)
                .join(' - ');
            summary.push(`Revenue: ${revenueRange}`);
        }
        if (filters.minRegistrations || filters.maxRegistrations) {
            const regRange = [
                filters.minRegistrations,
                filters.maxRegistrations,
            ]
                .filter(Boolean)
                .join(' - ');
            summary.push(`Registrations: ${regRange}`);
        }
        if (filters.isVirtual !== null) {
            summary.push(filters.isVirtual ? 'Virtual Only' : 'In-Person Only');
        }
        if (filters.hasRegistrations !== null) {
            summary.push(
                filters.hasRegistrations
                    ? 'Has Registrations'
                    : 'No Registrations'
            );
        }

        return summary.length > 0 ? summary.join(', ') : 'No filters applied';
    };

    // Count active filters
    const countActiveFilters = (filters: Partial<AdvancedFilterOptions>) => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'sortBy' || key === 'sortOrder') return;
            if (value !== null && value !== undefined && value !== '') {
                count++;
            }
        });
        return count;
    };

    return (
        <div className='space-y-4'>
            {/* Tab Navigation */}
            <div className='flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800'>
                <button
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'presets'
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                >
                    <Star className='mr-2 inline size-4' />
                    Saved Presets ({
                        presets.length
                    })
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'history'
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                >
                    <History className='mr-2 inline size-4' />
                    Recent Filters ({
                        filterHistory.length
                    })
                </button>
            </div>

            {/* Search */}
            {activeTab === 'presets' && presets.length > 0 && (
                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                    <Input
                        type='text'
                        placeholder='Search presets...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                    />
                </div>
            )}

            {/* Content */}
            <div className='max-h-96 space-y-2 overflow-y-auto'>
                {activeTab === 'presets' ? (
                    <>
                        {sortedPresets.length === 0 ? (
                            <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
                                {searchTerm ? (
                                    <>
                                        <Search className='mx-auto mb-2 size-8 opacity-50' />
                                        <p>
                                            No presets found matching "
                                            {searchTerm}"
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Star className='mx-auto mb-2 size-8 opacity-50' />
                                        <p>No saved presets yet</p>
                                        <p className='mt-1 text-sm'>
                                            Apply some filters and save them as
                                            a preset for quick access
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            sortedPresets.map((preset) => (
                                <div
                                    key={preset.id}
                                    className='flex items-start justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800'
                                >
                                    <div className='min-w-0 flex-1'>
                                        <div className='mb-1 flex items-center gap-2'>
                                            <h4 className='truncate text-sm font-medium'>
                                                {preset.name}
                                            </h4>
                                            {preset.isDefault && (
                                                <span className='rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className='mb-2 line-clamp-2 text-xs text-gray-600 dark:text-gray-400'>
                                            {getFilterSummary(preset.filters)}
                                        </p>
                                        <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                                            <span className='flex items-center gap-1'>
                                                <Filter className='size-3' />
                                                {countActiveFilters(
                                                    preset.filters
                                                )}{' '}
                                                filters
                                            </span>
                                            <span className='flex items-center gap-1'>
                                                <Clock className='size-3' />
                                                Used {
                                                    preset.useCount
                                                } times
                                            </span>
                                            {preset.lastUsed && (
                                                <span>
                                                    Last used{' '}
                                                    {new Date(
                                                        preset.lastUsed
                                                    ).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className='ml-2 flex items-center gap-1'>
                                        <Button
                                            size='sm'
                                            variant='outline'
                                            onClick={() => onLoadPreset(preset)}
                                            className='h-8 px-2'
                                        >
                                            Load
                                        </Button>
                                        <Button
                                            size='sm'
                                            variant='ghost'
                                            onClick={() =>
                                                onDeletePreset(preset.id)
                                            }
                                            className='size-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20'
                                        >
                                            <Trash2 className='size-3' />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        {filterHistory.length === 0 ? (
                            <div className='py-8 text-center text-gray-500 dark:text-gray-400'>
                                <History className='mx-auto mb-2 size-8 opacity-50' />
                                <p>No filter history yet</p>
                                <p className='mt-1 text-sm'>
                                    Your recent filter combinations will appear
                                    here
                                </p>
                            </div>
                        ) : (
                            filterHistory.map((filters, index) => (
                                <div
                                    key={index}
                                    className='flex items-start justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800'
                                >
                                    <div className='min-w-0 flex-1'>
                                        <p className='mb-2 line-clamp-2 text-sm text-gray-900 dark:text-gray-100'>
                                            {getFilterSummary(filters)}
                                        </p>
                                        <div className='flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400'>
                                            <span className='flex items-center gap-1'>
                                                <Filter className='size-3' />
                                                {countActiveFilters(
                                                    filters
                                                )}{' '}
                                                filters
                                            </span>
                                            {filters.searchTerm && (
                                                <span className='flex items-center gap-1'>
                                                    <Search className='size-3' />
                                                    Search term
                                                </span>
                                            )}
                                            {(filters.startDate ||
                                                filters.endDate) && (
                                                <span className='flex items-center gap-1'>
                                                    <Calendar className='size-3' />
                                                    Date range
                                                </span>
                                            )}
                                            {(filters.minRevenue ||
                                                filters.maxRevenue) && (
                                                <span className='flex items-center gap-1'>
                                                    <DollarSign className='size-3' />
                                                    Revenue
                                                </span>
                                            )}
                                            {(filters.minRegistrations ||
                                                filters.maxRegistrations) && (
                                                <span className='flex items-center gap-1'>
                                                    <Users className='size-3' />
                                                    Registrations
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        onClick={() =>
                                            onLoadFromHistory(filters)
                                        }
                                        className='ml-2 h-8 px-2'
                                    >
                                        Load
                                    </Button>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default React.memo(FilterPresetsManager);

'use client';

import React from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Filter,
    Eye,
} from 'lucide-react';
import type { FilterResultSummary as FilterResultSummaryType } from './AdvancedFilters';

interface FilterResultSummaryProps {
    summary: FilterResultSummaryType;
    className?: string;
}

const FilterResultSummary: React.FC<FilterResultSummaryProps> = ({
    summary,
    className = '',
}) => {
    const {
        totalResults,
        filteredResults,
        appliedFilters,
        topCategories,
        dateRange,
        revenueRange,
    } = summary;

    const filterEfficiency =
        totalResults > 0 ? (filteredResults / totalResults) * 100 : 0;
    const isFiltered = appliedFilters > 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div
            className={`space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900 ${className}`}
        >
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <BarChart3 className='size-5 text-blue-500' />
                    <h3 className='font-medium text-gray-900 dark:text-gray-100'>
                        Filter Results Summary
                    </h3>
                </div>
                {isFiltered && (
                    <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                        <Filter className='size-3' />
                        {appliedFilters} filter{appliedFilters !== 1 ? 's' : ''}{' '}
                        applied
                    </div>
                )}
            </div>

            {/* Main Stats */}
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                {/* Total Results */}
                <div className='text-center'>
                    <div className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                        {totalResults.toLocaleString()}
                    </div>
                    <div className='flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                        <Eye className='size-3' />
                        Total Results
                    </div>
                </div>

                {/* Filtered Results */}
                <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                        {filteredResults.toLocaleString()}
                    </div>
                    <div className='flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                        <Filter className='size-3' />
                        Filtered
                    </div>
                </div>

                {/* Filter Efficiency */}
                <div className='text-center'>
                    <div
                        className={`text-2xl font-bold ${
                            filterEfficiency > 50
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-green-600 dark:text-green-400'
                        }`}
                    >
                        {filterEfficiency.toFixed(1)}%
                    </div>
                    <div className='flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                        {filterEfficiency > 50 ? (
                            <TrendingUp className='size-3' />
                        ) : (
                            <TrendingDown className='size-3' />
                        )}
                        Showing
                    </div>
                </div>

                {/* Applied Filters */}
                <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                        {appliedFilters}
                    </div>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                        Active Filters
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            {(topCategories.length > 0 || dateRange || revenueRange) && (
                <div className='space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700'>
                    {/* Top Categories */}
                    {topCategories.length > 0 && (
                        <div>
                            <div className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                                Top Categories in Results:
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {topCategories.slice(0, 5).map((category) => (
                                    <span
                                        key={category.name}
                                        className='inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    >
                                        {category.name}
                                        <span className='font-medium text-blue-600 dark:text-blue-300'>
                                            ({category.count})
                                        </span>
                                    </span>
                                ))}
                                {topCategories.length > 5 && (
                                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                                        +{topCategories.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Date Range */}
                    {dateRange && (
                        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                            <Calendar className='size-4' />
                            <span>
                                Date Range: {formatDate(dateRange.start)} -{' '}
                                {formatDate(dateRange.end)}
                            </span>
                        </div>
                    )}

                    {/* Revenue Range */}
                    {revenueRange && (
                        <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                            <DollarSign className='size-4' />
                            <span>
                                Revenue Range:{' '}
                                {formatCurrency(revenueRange.min)} -{' '}
                                {formatCurrency(revenueRange.max)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Filter Effectiveness Indicator */}
            {isFiltered && (
                <div className='border-t border-gray-200 pt-3 dark:border-gray-700'>
                    <div className='flex items-center justify-between text-xs'>
                        <span className='text-gray-500 dark:text-gray-400'>
                            Filter Effectiveness:
                        </span>
                        <span
                            className={`font-medium ${
                                filterEfficiency < 25
                                    ? 'text-green-600 dark:text-green-400'
                                    : filterEfficiency < 50
                                      ? 'text-yellow-600 dark:text-yellow-400'
                                      : filterEfficiency < 75
                                        ? 'text-orange-600 dark:text-orange-400'
                                        : 'text-red-600 dark:text-red-400'
                            }`}
                        >
                            {filterEfficiency < 25
                                ? 'Highly Selective'
                                : filterEfficiency < 50
                                  ? 'Selective'
                                  : filterEfficiency < 75
                                    ? 'Moderately Selective'
                                    : 'Broad Results'}
                        </span>
                    </div>
                    <div className='mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                filterEfficiency < 25
                                    ? 'bg-green-500'
                                    : filterEfficiency < 50
                                      ? 'bg-yellow-500'
                                      : filterEfficiency < 75
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                            }`}
                            style={{ width: `${filterEfficiency}%` }}
                        />
                    </div>
                </div>
            )}

            {/* No Results Message */}
            {filteredResults === 0 && isFiltered && (
                <div className='py-2 text-center text-sm text-gray-500 dark:text-gray-400'>
                    No results match your current filters. Try adjusting your
                    criteria.
                </div>
            )}
        </div>
    );
};

export default React.memo(FilterResultSummary);

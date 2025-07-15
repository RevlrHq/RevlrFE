import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EventFilterDropdown, {
    FilterValues,
    AppliedFilters,
} from './EventFilterDropdown';
import CategoryFilter from '../../../components/CategoryFilter';
import { useEvents, EventFilters } from '../../../hooks/useEvents';
import { useCategoryFilter } from '../../../hooks/useCategoryFilter';
import { EventCategory } from '../../../lib/constants/eventCategories';
import {
    formatEventDate,
    getEventPrice,
    getEventLocation,
    getEventImage,
    mapSortOptionToApi,
    mapDateRangeToApi,
    mapLocationTypeToApi,
} from '../../../lib/utils/eventUtils';

const EventListing = () => {
    const [showFilter, setShowFilter] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<FilterValues>({});
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});

    // Track whether user has applied any filters
    const [, setHasUserAppliedFilters] = useState(false);

    // Initialize category filter with legacy mapping
    const categoryFilter = useCategoryFilter();
    const { state: categoryState, actions: categoryActions } = categoryFilter;

    // Convert UI filters to API filters
    const convertToApiFilters = useCallback(
        (
            uiFilters: FilterValues,
            selectedCategories: EventCategory[] = []
        ): EventFilters => {
            const apiFilters: EventFilters = {
                IncludeTickets: true,
                IncludePastEvents: false,
            };

            // Handle category filtering
            if (selectedCategories.length === 1) {
                apiFilters.Category = selectedCategories[0];
            } else if (selectedCategories.length > 1) {
                apiFilters.Categories = selectedCategories;
            }

            // Only apply filters that are actually set
            if (uiFilters.sort) {
                const sortMapping = mapSortOptionToApi(uiFilters.sort);
                apiFilters.SortBy = sortMapping.sortBy;
                apiFilters.SortOrder = sortMapping.sortOrder;
            }

            if (uiFilters.dateRange) {
                const dateMapping = mapDateRangeToApi(uiFilters.dateRange);
                apiFilters.StartDate = dateMapping.startDate;
                apiFilters.EndDate = dateMapping.endDate;
            }

            if (uiFilters.customDateRange) {
                if (uiFilters.customDateRange.startDate) {
                    apiFilters.StartDate = new Date(
                        uiFilters.customDateRange.startDate
                    ).toISOString();
                }
                if (uiFilters.customDateRange.endDate) {
                    apiFilters.EndDate = new Date(
                        uiFilters.customDateRange.endDate
                    ).toISOString();
                }
            }

            if (uiFilters.eventType) {
                const locationTypeMapping = mapLocationTypeToApi(
                    uiFilters.eventType
                );
                if (locationTypeMapping) {
                    apiFilters.LocationType = parseInt(locationTypeMapping);
                }
            }

            if (uiFilters.priceRange && uiFilters.priceRange.length === 2) {
                if (uiFilters.priceRange[0] > 0) {
                    apiFilters.MinPrice = uiFilters.priceRange[0];
                }
                if (uiFilters.priceRange[1] < 5000) {
                    apiFilters.MaxPrice = uiFilters.priceRange[1];
                }
            }

            if (uiFilters.location) {
                apiFilters.SearchTerm = uiFilters.location;
            }

            return apiFilters;
        },
        []
    );

    const {
        events,
        loading,
        error,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        fetchEvents,
    } = useEvents(8);

    // Handle category change
    const handleCategoryChange = useCallback(
        (categories: EventCategory[]) => {
            categoryActions.selectMultipleCategories(categories);
            setHasUserAppliedFilters(categories.length > 0);

            if (categories.length > 0) {
                const newApiFilters = convertToApiFilters(
                    currentFilters,
                    categories
                );
                fetchEvents(1, newApiFilters);
            } else {
                // If no categories selected, fetch without any filters
                fetchEvents(1, {});
            }
        },
        [currentFilters, convertToApiFilters, fetchEvents, categoryActions]
    );

    // Handle filter application
    const handleApplyFilters = useCallback(
        (filters: FilterValues, appliedFiltersState: AppliedFilters) => {
            setCurrentFilters(filters);
            setAppliedFilters(appliedFiltersState);

            // Check if any filters are actually applied
            const hasAnyFilters =
                Object.values(appliedFiltersState).some(Boolean) ||
                categoryState.selectedCategories.length > 0;
            setHasUserAppliedFilters(hasAnyFilters);

            if (hasAnyFilters) {
                const newApiFilters = convertToApiFilters(
                    filters,
                    categoryState.selectedCategories
                );
                fetchEvents(1, newApiFilters);
            } else {
                // If no filters applied, fetch without any filters
                fetchEvents(1, {});
            }
            setShowFilter(false);
        },
        [categoryState.selectedCategories, convertToApiFilters, fetchEvents]
    );

    // Handle pagination
    const handlePageChange = useCallback(
        (page: number) => {
            const hasAnyFilters =
                Object.values(appliedFilters).some(Boolean) ||
                categoryState.selectedCategories.length > 0;

            if (hasAnyFilters) {
                const apiFilters = convertToApiFilters(
                    currentFilters,
                    categoryState.selectedCategories
                );
                fetchEvents(page, apiFilters);
            } else {
                // If no filters applied, fetch without any filters
                fetchEvents(page, {});
            }
        },
        [
            appliedFilters,
            currentFilters,
            categoryState.selectedCategories,
            convertToApiFilters,
            fetchEvents,
        ]
    );

    // Load events without any filters when component mounts
    useEffect(() => {
        fetchEvents(1, {});
    }, []);

    return (
        <div className='relative mb-24 px-4 py-2 md:px-24'>
            <div className='sticky top-[80px] z-50 mb-8 flex flex-col items-start justify-between bg-white pb-2 dark:bg-revlr-dark-bg sm:flex-row sm:items-center'>
                <div className='mb-4 flex items-center sm:mb-0'>
                    <button
                        className='mr-4 flex flex-row items-center gap-2 rounded-md border border-[#F2F3F5] bg-[#F1F6FF] p-2 font-inter text-[14px] font-medium text-[#374252] dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-gray-200'
                        onClick={() => setShowFilter(!showFilter)}
                    >
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            className='dark:fill-gray-200'
                        >
                            <path
                                d='M2.5 15C2.5 15.4583 2.875 15.8333 3.33333 15.8333H7.5V14.1667H3.33333C2.875 14.1667 2.5 14.5417 2.5 15ZM2.5 5C2.5 5.45833 2.875 5.83333 3.33333 5.83333H10.8333V4.16667H3.33333C2.875 4.16667 2.5 4.54167 2.5 5ZM10.8333 16.6667V15.8333H16.6667C17.125 15.8333 17.5 15.4583 17.5 15C17.5 14.5417 17.125 14.1667 16.6667 14.1667H10.8333V13.3333C10.8333 12.875 10.4583 12.5 10 12.5C9.54167 12.5 9.16667 12.875 9.16667 13.3333V16.6667C9.16667 17.125 9.54167 17.5 10 17.5C10.4583 17.5 10.8333 17.125 10.8333 16.6667ZM5.83333 8.33333V9.16667H3.33333C2.875 9.16667 2.5 9.54167 2.5 10C2.5 10.4583 2.875 10.8333 3.33333 10.8333H5.83333V11.6667C5.83333 12.125 6.20833 12.5 6.66667 12.5C7.125 12.5 7.5 12.125 7.5 11.6667V8.33333C7.5 7.875 7.125 7.5 6.66667 7.5C6.20833 7.5 5.83333 7.875 5.83333 8.33333ZM17.5 10C17.5 9.54167 17.125 9.16667 16.6667 9.16667H9.16667V10.8333H16.6667C17.125 10.8333 17.5 10.4583 17.5 10ZM13.3333 7.5C13.7917 7.5 14.1667 7.125 14.1667 6.66667V5.83333H16.6667C17.125 5.83333 17.5 5.45833 17.5 5C17.5 4.54167 17.125 4.16667 16.6667 4.16667H14.1667V3.33333C14.1667 2.875 13.7917 2.5 13.3333 2.5C12.875 2.5 12.5 2.875 12.5 3.33333V6.66667C12.5 7.125 12.875 7.5 13.3333 7.5Z'
                                fill='#374252'
                            />
                        </svg>
                        Filter
                    </button>
                </div>

                <div className='flex w-full overflow-x-auto sm:w-auto'>
                    <CategoryFilter
                        variant='tabs'
                        onCategoryChange={handleCategoryChange}
                        initialCategories={categoryState.selectedCategories}
                        showSearch={false}
                        className='w-full'
                    />
                </div>
            </div>

            <div className='flex'>
                {showFilter && (
                    <div className='mr-6 w-64 shrink-0'>
                        <EventFilterDropdown
                            onApply={handleApplyFilters}
                            onCancel={() => setShowFilter(false)}
                            initialFilters={currentFilters}
                            initialAppliedFilters={appliedFilters}
                        />
                    </div>
                )}

                <div className='w-full'>
                    {/* Loading State */}
                    {loading && (
                        <div className='flex items-center justify-center py-12'>
                            <div className='text-center'>
                                <div className='mx-auto size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400'></div>
                                <p className='mt-4 text-gray-600 dark:text-gray-300'>
                                    Loading events...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className='flex items-center justify-center py-12'>
                            <div className='text-center'>
                                <p className='text-red-600 dark:text-red-400'>
                                    Error loading events: {error}
                                </p>
                                <button
                                    onClick={() => {
                                        const hasAnyFilters =
                                            Object.values(appliedFilters).some(
                                                Boolean
                                            ) ||
                                            categoryState.selectedCategories
                                                .length > 0;

                                        if (hasAnyFilters) {
                                            const apiFilters =
                                                convertToApiFilters(
                                                    currentFilters,
                                                    categoryState.selectedCategories
                                                );
                                            fetchEvents(
                                                currentPage,
                                                apiFilters
                                            );
                                        } else {
                                            fetchEvents(currentPage, {});
                                        }
                                    }}
                                    className='mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Events Grid */}
                    {!loading && !error && (
                        <>
                            <div
                                className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                                    showFilter
                                        ? 'lg:grid-cols-3'
                                        : 'lg:grid-cols-3 xl:grid-cols-4'
                                }`}
                            >
                                {events.map((event) => {
                                    const eventPrice = getEventPrice(event);
                                    const eventDate = formatEventDate(
                                        event.startDate,
                                        event.startTime
                                    );
                                    const eventLocation =
                                        getEventLocation(event);
                                    const eventImage = getEventImage(event);

                                    return (
                                        <div key={event.id} className='group'>
                                            <Link
                                                href={`/events/event/${event.id}`}
                                            >
                                                <div className='relative mb-3 overflow-hidden rounded-lg bg-gray-200'>
                                                    <div className='relative h-[293px] w-full rounded-lg'>
                                                        <Image
                                                            src={eventImage}
                                                            alt={
                                                                event.title ||
                                                                'Event'
                                                            }
                                                            fill
                                                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                                                            onError={(e) => {
                                                                const target =
                                                                    e.target as HTMLImageElement;
                                                                target.src =
                                                                    '/assets/images/event-image.png';
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className='flex flex-col gap-2'>
                                                    <div className='font-inter text-[16px] font-semibold text-revlr-primary-blue dark:text-blue-400'>
                                                        {
                                                            eventPrice.displayPrice
                                                        }
                                                    </div>
                                                    <h3 className='w-full overflow-hidden truncate whitespace-nowrap font-inter text-[16px] font-semibold text-[#001433] dark:text-gray-100'>
                                                        {event.title ||
                                                            'Untitled Event'}
                                                    </h3>
                                                    <div className='font-inter text-sm font-medium text-[#6B7380] dark:text-gray-300'>
                                                        {eventDate}
                                                    </div>
                                                    <div className='font-inter text-sm font-medium text-[#6B7380] dark:text-gray-300'>
                                                        {eventLocation}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Empty State */}
                            {events.length === 0 && (
                                <div className='flex items-center justify-center py-12'>
                                    <div className='text-center'>
                                        <p className='text-gray-600 dark:text-gray-300'>
                                            No events found matching your
                                            criteria.
                                        </p>
                                        <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                                            Try adjusting your filters or search
                                            terms.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className='mt-12 flex items-center justify-center space-x-2'>
                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={!hasPreviousPage}
                                        className='rounded-md p-2 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700'
                                    >
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='size-5'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M15 19l-7-7 7-7'
                                            />
                                        </svg>
                                    </button>

                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;

                                        const shouldShow =
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 &&
                                                pageNum <= currentPage + 1) ||
                                            (totalPages <= 7 && pageNum <= 7);

                                        if (
                                            !shouldShow &&
                                            pageNum === currentPage + 2
                                        ) {
                                            return (
                                                <span
                                                    key={`ellipsis-after`}
                                                    className='px-3 py-2 dark:text-gray-300'
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        if (
                                            !shouldShow &&
                                            pageNum === currentPage - 2
                                        ) {
                                            return (
                                                <span
                                                    key={`ellipsis-before`}
                                                    className='px-3 py-2 dark:text-gray-300'
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        if (!shouldShow) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() =>
                                                    handlePageChange(pageNum)
                                                }
                                                className={`size-10 rounded-md ${
                                                    currentPage === pageNum
                                                        ? 'bg-blue-500 text-white dark:bg-blue-600'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={!hasNextPage}
                                        className='rounded-md p-2 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700'
                                    >
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='size-5'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 5l7 7-7 7'
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventListing;

'use client';

import { useState, useCallback, useEffect } from 'react';
import EventCard from '@components/event-card';
import { useEvents, EventFilters } from '@hooks/useEvents';
import { EventCategory } from '@lib/constants/eventCategories';
import CategoryFilter from '@components/CategoryFilter';
import { useCategoryFilter } from '@hooks/useCategoryFilter';
import Link from 'next/link';

const EventsSection = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const {
        events,
        loading,
        error,
        currentPage,
        // totalPages,
        hasNextPage,
        fetchEvents,
    } = useEvents(8); // Show 8 events on landing page

    const categoryFilter = useCategoryFilter();
    const { state: categoryState, actions: categoryActions } = categoryFilter;

    const applyFilters = useCallback(() => {
        const apiFilters: EventFilters = {
            IncludeTickets: true,
            IncludePastEvents: false,
        };

        if (searchTerm) {
            apiFilters.SearchTerm = searchTerm;
        }

        if (categoryState.selectedCategories.length === 1) {
            apiFilters.Category = categoryState.selectedCategories[0];
        } else if (categoryState.selectedCategories.length > 1) {
            apiFilters.Categories = categoryState.selectedCategories;
        }

        fetchEvents(1, apiFilters);
    }, [searchTerm, categoryState.selectedCategories, fetchEvents]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, applyFilters]);

    const handleCategoryChange = (categories: EventCategory[]) => {
        categoryActions.selectMultipleCategories(categories);
        applyFilters();
    };

    const handleLoadMore = () => {
        if (hasNextPage) {
            const apiFilters: EventFilters = {
                IncludeTickets: true,
                IncludePastEvents: false,
            };

            if (searchTerm) {
                apiFilters.SearchTerm = searchTerm;
            }

            if (categoryState.selectedCategories.length === 1) {
                apiFilters.Category = categoryState.selectedCategories[0];
            } else if (categoryState.selectedCategories.length > 1) {
                apiFilters.Categories = categoryState.selectedCategories;
            }

            fetchEvents(currentPage + 1, apiFilters);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchEvents(1, {
            IncludeTickets: true,
            IncludePastEvents: false,
        });
    }, []);

    return (
        <section className='mx-auto max-w-[1440px] px-6 py-16 md:px-24'>
            <div className='mb-12 text-center'>
                <h2 className='mb-4 font-montserrat text-4xl font-bold text-gray-900 dark:text-white'>
                    Discover
                    <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                        {' '}
                        Amazing Events
                    </span>
                </h2>
                <p className='mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
                    Find the perfect events happening around you. From concerts
                    to conferences, there's something for everyone.
                </p>
            </div>

            {/* Search and Filter Section */}
            <div className='mb-8 space-y-6'>
                {/* Search Bar */}
                <div className='relative mx-auto max-w-2xl'>
                    <div className='absolute left-4 top-1/2 -translate-y-1/2 text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                        <svg
                            className='size-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                            />
                        </svg>
                    </div>
                    <input
                        type='text'
                        placeholder='Search by event, artist, or venue'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='w-full rounded-xl border border-gray-200 bg-white/80 px-12 py-4 text-gray-800 shadow-sm backdrop-blur-sm transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card/80 dark:text-gray-200 dark:placeholder:text-gray-400'
                    />
                </div>

                {/* Category Filter */}
                <div className='flex justify-center'>
                    <CategoryFilter
                        variant='tabs'
                        onCategoryChange={handleCategoryChange}
                        initialCategories={categoryState.selectedCategories}
                        showSearch={false}
                        className='max-w-4xl'
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && events.length === 0 && (
                <div className='flex justify-center py-12'>
                    <div className='size-12 animate-spin rounded-full border-4 border-gray-300 border-t-revlr-primary-blue dark:border-gray-600 dark:border-t-revlr-primary-yellow'></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className='py-12 text-center'>
                    <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
                        <svg
                            className='size-8 text-red-600 dark:text-red-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                    </div>
                    <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
                        Something went wrong
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400'>{error}</p>
                    <button
                        onClick={() => fetchEvents(1, {})}
                        className='mt-4 rounded-lg bg-revlr-primary-blue px-6 py-2 text-white transition-colors hover:bg-revlr-primary-blue/90'
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Events Grid */}
            {!loading && !error && (
                <>
                    {events.length > 0 ? (
                        <div className='space-y-8'>
                            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                                {events.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>

                            {/* Load More / View All Section */}
                            <div className='flex flex-col items-center gap-4'>
                                {hasNextPage && (
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className='rounded-xl border-2 border-revlr-primary-blue bg-transparent px-8 py-3 font-semibold text-revlr-primary-blue transition-all duration-200 hover:bg-revlr-primary-blue hover:text-white disabled:opacity-50 dark:border-revlr-primary-yellow dark:text-revlr-primary-yellow dark:hover:bg-revlr-primary-yellow dark:hover:text-revlr-dark-bg'
                                    >
                                        {loading ? (
                                            <div className='flex items-center gap-2'>
                                                <div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                                                Loading...
                                            </div>
                                        ) : (
                                            'Load More Events'
                                        )}
                                    </button>
                                )}

                                <Link
                                    href='/events'
                                    className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                                >
                                    View All Events
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className='py-12 text-center'>
                            <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800'>
                                <svg
                                    className='size-8 text-gray-400'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                    />
                                </svg>
                            </div>
                            <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
                                No events found
                            </h3>
                            <p className='mb-4 text-gray-600 dark:text-gray-400'>
                                {searchTerm ||
                                categoryState.selectedCategories.length > 0
                                    ? 'Try adjusting your search or filters to find more events.'
                                    : 'There are no events available at the moment.'}
                            </p>
                            {(searchTerm ||
                                categoryState.selectedCategories.length >
                                    0) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        categoryActions.clearCategories();
                                        fetchEvents(1, {
                                            IncludeTickets: true,
                                            IncludePastEvents: false,
                                        });
                                    }}
                                    className='rounded-lg bg-revlr-primary-blue px-6 py-2 text-white transition-colors hover:bg-revlr-primary-blue/90'
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default EventsSection;

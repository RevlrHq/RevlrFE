'use client';

import { useState, useCallback, useEffect } from 'react';
import { Navbar } from '@components/Navbar';
import Footer from '@components/Footer';
import EventCard from '@components/event-card';
import { useEvents, EventFilters } from '@hooks/useEvents';
import { EventCategory } from '@lib/constants/eventCategories';
import CategoryFilter from '@components/CategoryFilter';
import { useCategoryFilter } from '@hooks/useCategoryFilter';

const EventsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const {
        events,
        loading,
        error,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        fetchEvents,
    } = useEvents(12);

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

    const handlePageChange = (page: number) => {
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

        fetchEvents(page, apiFilters);
    };

    useEffect(() => {
        fetchEvents(1, {});
    }, []);

    return (
        <div className='min-h-screen bg-white transition-colors duration-300 dark:bg-revlr-dark-bg'>
            <Navbar isOrganizer={false} />
            <main className='mx-auto max-w-[1440px] px-6 pt-24 md:px-24'>
                <div className='py-8'>
                    <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-white'>
                        Explore Events
                    </h1>
                    <p className='text-lg text-gray-600 dark:text-gray-300'>
                        Discover the best events happening around you.
                    </p>
                </div>

                <div className='mb-8 flex flex-col gap-4 md:flex-row'>
                    <div className='relative grow'>
                        <input
                            type='text'
                            placeholder='Search by event, artist, or venue'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full rounded-lg border border-gray-300 bg-white p-4 pl-12 text-gray-900 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-white'
                        />
                        <div className='absolute left-4 top-1/2 -translate-y-1/2'>
                            <svg
                                className='size-5 text-gray-400'
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
                    </div>
                </div>

                <div className='mb-8'>
                    <CategoryFilter
                        variant='tabs'
                        onCategoryChange={handleCategoryChange}
                        initialCategories={categoryState.selectedCategories}
                        showSearch={false}
                    />
                </div>

                {loading && (
                    <div className='flex justify-center py-12'>
                        <div className='size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400'></div>
                    </div>
                )}

                {error && (
                    <div className='py-12 text-center text-red-600 dark:text-red-400'>
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                            {events.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>

                        {events.length === 0 && (
                            <div className='py-12 text-center text-gray-500 dark:text-gray-400'>
                                No events found.
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className='mt-12 flex justify-center'>
                                <nav className='flex items-center space-x-2'>
                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={!hasPreviousPage}
                                        className='rounded-md p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700'
                                    >
                                        Previous
                                    </button>
                                    <span className='text-gray-600 dark:text-gray-300'>
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={!hasNextPage}
                                        className='rounded-md p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700'
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default EventsPage;

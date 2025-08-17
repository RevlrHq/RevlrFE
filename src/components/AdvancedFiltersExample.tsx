'use client';

import React, { useState, useCallback } from 'react';
import AdvancedFilters from './AdvancedFilters';
import useAdvancedFilters from '../hooks/useAdvancedFilters';
import useGlobalSearch from '../hooks/useGlobalSearch';
import { useOrganizerEvents } from '../hooks/useOrganizerEvents';
import { useOrganizerRegistrations } from '../hooks/useOrganizerRegistrations';
import { useOrganizerAttendees } from '../hooks/useOrganizerAttendees';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
    Calendar,
    Users,
    DollarSign,
    Search,
    Download,
    BarChart3,
} from 'lucide-react';

/**
 * Example component demonstrating advanced filtering and search capabilities
 * for the organizer dashboard enhancement.
 *
 * This component shows how to integrate:
 * - Advanced filtering with presets and history
 * - Global search across events, registrations, and attendees
 * - Real-time result summaries and analytics
 * - Export functionality
 */
const AdvancedFiltersExample: React.FC = () => {
    const [activeTab, setActiveTab] = useState('events');

    // Initialize advanced filters hook
    const {
        filters,
        debouncedFilters,
        activeFilterCount,
        updateFilters,
        clearFilters,
        calculateResultSummary,
    } = useAdvancedFilters({
        enablePresets: true,
        enableHistory: true,
        storagePrefix: 'organizer-dashboard',
    });

    // Initialize global search hook
    const {
        results: searchResults,
        isSearching,
        search,
        recentSearches,
        popularSearches,
        searchStats,
    } = useGlobalSearch({
        maxResultsPerType: 20,
        enableCaching: true,
    });

    // Initialize individual data hooks
    const {
        events,
        loading: eventsLoading,
        totalCount: eventsTotal,
        refetch: refetchEvents,
    } = useOrganizerEvents(20, {
        ...debouncedFilters,
        pageNumber: 1,
        pageSize: 20,
    });

    const {
        registrations,
        loading: registrationsLoading,
        totalCount: registrationsTotal,
        refetch: refetchRegistrations,
    } = useOrganizerRegistrations(20, {
        ...debouncedFilters,
        pageNumber: 1,
        pageSize: 20,
    });

    const {
        attendees,
        loading: attendeesLoading,
        totalCount: attendeesTotal,
        refetch: refetchAttendees,
    } = useOrganizerAttendees(20, {
        ...debouncedFilters,
        pageNumber: 1,
        pageSize: 20,
    });

    // Mock data for demonstration
    const availableCategories = [
        'Conference',
        'Workshop',
        'Seminar',
        'Webinar',
        'Networking',
        'Training',
        'Exhibition',
        'Concert',
    ];

    const availableVenues = [
        'Convention Center',
        'Hotel Ballroom',
        'Conference Room A',
        'Auditorium',
        'Online Platform',
        'Community Center',
        'University Campus',
    ];

    // Calculate result summary
    const resultSummary = calculateResultSummary({
        totalResults: eventsTotal + registrationsTotal + attendeesTotal,
        filteredResults:
            events.length + registrations.length + attendees.length,
        categories: [
            { name: 'Conference', count: 15 },
            { name: 'Workshop', count: 8 },
            { name: 'Seminar', count: 5 },
        ],
        dateRange:
            filters.startDate && filters.endDate
                ? { start: filters.startDate, end: filters.endDate }
                : undefined,
        revenueRange:
            filters.minRevenue && filters.maxRevenue
                ? { min: filters.minRevenue, max: filters.maxRevenue }
                : undefined,
    });

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetchEvents();
        refetchRegistrations();
        refetchAttendees();
    }, [refetchEvents, refetchRegistrations, refetchAttendees]);

    // Handle global search
    const handleGlobalSearch = useCallback(async () => {
        if (filters.searchTerm) {
            await search(filters.searchTerm, filters);
        }
    }, [filters, search]);

    // Handle export
    const handleExport = useCallback(() => {
        const exportData = {
            filters,
            results: {
                events: events.length,
                registrations: registrations.length,
                attendees: attendees.length,
            },
            timestamp: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organizer-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [filters, events, registrations, attendees]);

    const isLoading =
        eventsLoading ||
        registrationsLoading ||
        attendeesLoading ||
        isSearching;

    return (
        <div className='space-y-6 p-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
                        Advanced Filtering & Search Demo
                    </h1>
                    <p className='mt-1 text-gray-600 dark:text-gray-400'>
                        Comprehensive filtering and search across events,
                        registrations, and attendees
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        variant='outline'
                        onClick={handleGlobalSearch}
                        disabled={isLoading || !filters.searchTerm}
                        className='flex items-center gap-2'
                    >
                        <Search className='size-4' />
                        Global Search
                    </Button>
                    <Button
                        variant='outline'
                        onClick={handleExport}
                        disabled={isLoading}
                        className='flex items-center gap-2'
                    >
                        <Download className='size-4' />
                        Export
                    </Button>
                </div>
            </div>

            {/* Advanced Filters */}
            <Card className='p-6'>
                <AdvancedFilters
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onClearFilters={clearFilters}
                    onRefresh={handleRefresh}
                    isLoading={isLoading}
                    showGlobalSearch={true}
                    showPresets={true}
                    showSuggestions={true}
                    showResultSummary={true}
                    resultSummary={resultSummary}
                    availableCategories={availableCategories}
                    availableVenues={availableVenues}
                    recentSearches={recentSearches}
                />
            </Card>

            {/* Search Statistics */}
            {searchStats.totalSearches > 0 && (
                <Card className='p-4'>
                    <div className='mb-3 flex items-center gap-2'>
                        <BarChart3 className='size-5 text-blue-500' />
                        <h3 className='font-medium'>Search Analytics</h3>
                    </div>
                    <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                        <div className='text-center'>
                            <div className='text-lg font-bold text-blue-600'>
                                {searchStats.totalSearches}
                            </div>
                            <div className='text-gray-500'>Total Searches</div>
                        </div>
                        <div className='text-center'>
                            <div className='text-lg font-bold text-green-600'>
                                {searchStats.averageResultCount}
                            </div>
                            <div className='text-gray-500'>Avg Results</div>
                        </div>
                        <div className='text-center'>
                            <div className='text-lg font-bold text-purple-600'>
                                {popularSearches.length}
                            </div>
                            <div className='text-gray-500'>Popular Terms</div>
                        </div>
                        <div className='text-center'>
                            <div className='text-lg font-bold text-orange-600'>
                                {activeFilterCount}
                            </div>
                            <div className='text-gray-500'>Active Filters</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Results Tabs */}
            <Card className='p-6'>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger
                            value='events'
                            className='flex items-center gap-2'
                        >
                            <Calendar className='size-4' />
                            Events
                            <Badge variant='secondary'>{events.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value='registrations'
                            className='flex items-center gap-2'
                        >
                            <DollarSign className='size-4' />
                            Registrations
                            <Badge variant='secondary'>
                                {registrations.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value='attendees'
                            className='flex items-center gap-2'
                        >
                            <Users className='size-4' />
                            Attendees
                            <Badge variant='secondary'>
                                {attendees.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value='events' className='mt-4'>
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-lg font-medium'>Events</h3>
                                <div className='text-sm text-gray-500'>
                                    Showing {events.length} of {eventsTotal}{' '}
                                    events
                                </div>
                            </div>
                            {eventsLoading ? (
                                <div className='space-y-2'>
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className='h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800'
                                        />
                                    ))}
                                </div>
                            ) : events.length > 0 ? (
                                <div className='space-y-2'>
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className='rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div>
                                                    <h4 className='font-medium'>
                                                        {event.title}
                                                    </h4>
                                                    <p className='text-sm text-gray-500'>
                                                        {new Date(
                                                            event.startDate
                                                        ).toLocaleDateString()}{' '}
                                                        •
                                                        {
                                                            event.registrationCount
                                                        }{' '}
                                                        registrations • $
                                                        {event.revenue?.toLocaleString() ||
                                                            0}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        event.status === 1
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {event.status === 0
                                                        ? 'Draft'
                                                        : event.status === 1
                                                          ? 'Published'
                                                          : event.status === 2
                                                            ? 'Cancelled'
                                                            : 'Completed'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='py-8 text-center text-gray-500'>
                                    No events found matching your filters
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value='registrations' className='mt-4'>
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-lg font-medium'>
                                    Registrations
                                </h3>
                                <div className='text-sm text-gray-500'>
                                    Showing {registrations.length} of{' '}
                                    {registrationsTotal} registrations
                                </div>
                            </div>
                            {registrationsLoading ? (
                                <div className='space-y-2'>
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className='h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800'
                                        />
                                    ))}
                                </div>
                            ) : registrations.length > 0 ? (
                                <div className='space-y-2'>
                                    {registrations.map((registration) => (
                                        <div
                                            key={registration.id}
                                            className='rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div>
                                                    <h4 className='font-medium'>
                                                        {
                                                            registration.attendeeName
                                                        }
                                                    </h4>
                                                    <p className='text-sm text-gray-500'>
                                                        {new Date(
                                                            registration.registrationDate
                                                        ).toLocaleDateString()}{' '}
                                                        • ${registration.amount}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        registration.paymentStatus ===
                                                        'completed'
                                                            ? 'default'
                                                            : registration.paymentStatus ===
                                                                'pending'
                                                              ? 'secondary'
                                                              : 'destructive'
                                                    }
                                                >
                                                    {registration.paymentStatus}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='py-8 text-center text-gray-500'>
                                    No registrations found matching your filters
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value='attendees' className='mt-4'>
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-lg font-medium'>
                                    Attendees
                                </h3>
                                <div className='text-sm text-gray-500'>
                                    Showing {attendees.length} of{' '}
                                    {attendeesTotal} attendees
                                </div>
                            </div>
                            {attendeesLoading ? (
                                <div className='space-y-2'>
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className='h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800'
                                        />
                                    ))}
                                </div>
                            ) : attendees.length > 0 ? (
                                <div className='space-y-2'>
                                    {attendees.map((attendee) => (
                                        <div
                                            key={attendee.id}
                                            className='rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div>
                                                    <h4 className='font-medium'>
                                                        {attendee.name}
                                                    </h4>
                                                    <p className='text-sm text-gray-500'>
                                                        {attendee.email} •
                                                        {
                                                            attendee.totalRegistrations
                                                        }{' '}
                                                        registrations • Last:{' '}
                                                        {new Date(
                                                            attendee.lastRegistration
                                                        ).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='py-8 text-center text-gray-500'>
                                    No attendees found matching your filters
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Global Search Results */}
            {searchResults && (
                <Card className='p-6'>
                    <div className='mb-4 flex items-center gap-2'>
                        <Search className='size-5 text-blue-500' />
                        <h3 className='text-lg font-medium'>
                            Global Search Results
                        </h3>
                        <Badge variant='outline'>
                            {searchResults.totalResults} results in{' '}
                            {searchResults.searchTime}ms
                        </Badge>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        <div>
                            <h4 className='mb-2 font-medium'>
                                Events ({searchResults.events.length})
                            </h4>
                            <div className='max-h-40 space-y-2 overflow-y-auto'>
                                {searchResults.events.map((event) => (
                                    <div
                                        key={event.id}
                                        className='rounded bg-gray-50 p-2 text-sm dark:bg-gray-800'
                                    >
                                        {event.title}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className='mb-2 font-medium'>
                                Registrations (
                                {searchResults.registrations.length})
                            </h4>
                            <div className='max-h-40 space-y-2 overflow-y-auto'>
                                {searchResults.registrations.map((reg) => (
                                    <div
                                        key={reg.id}
                                        className='rounded bg-gray-50 p-2 text-sm dark:bg-gray-800'
                                    >
                                        {reg.attendeeName}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className='mb-2 font-medium'>
                                Attendees ({searchResults.attendees.length})
                            </h4>
                            <div className='max-h-40 space-y-2 overflow-y-auto'>
                                {searchResults.attendees.map((attendee) => (
                                    <div
                                        key={attendee.id}
                                        className='rounded bg-gray-50 p-2 text-sm dark:bg-gray-800'
                                    >
                                        {attendee.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AdvancedFiltersExample;

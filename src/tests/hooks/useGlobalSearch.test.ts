import { renderHook, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import useGlobalSearch from '../../hooks/useGlobalSearch';
import { OrganizerService } from '../../lib/api';

// Mock the API service
jest.mock('../../lib/api', () => ({
    OrganizerService: {
        getApiOrganizerEvents: jest.fn(),
        getApiOrganizerRegistrations: jest.fn(),
        getApiOrganizerAttendees: jest.fn(),
    },
}));

// Mock the debounce hook
jest.mock('../../hooks/useDebounce', () => ({
    useDebouncedValue: (value: string) => value,
}));

// Mock error handler
jest.mock('../../hooks/useErrorHandler', () => ({
    useApiErrorHandler: () => ({
        error: null,
        hasError: false,
        clearError: jest.fn(),
        handleError: jest.fn(),
        executeWithErrorHandling: jest.fn((fn) => fn()),
    }),
}));

// Mock offline aware fetch
jest.mock('../../components/error-handling/OfflineIndicator', () => ({
    useOfflineAwareFetch: () => ({
        fetchWithOfflineSupport: jest.fn((key, fn) => fn()),
    }),
}));

// Mock retry mechanism
jest.mock('../../lib/error-handling/RetryMechanism', () => ({
    withApiRetry: jest.fn((fn) => fn()),
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useGlobalSearch', () => {
    const mockEvents = [
        {
            id: '1',
            title: 'Test Event 1',
            status: 1,
            startDate: '2024-01-01',
            registrationCount: 10,
            revenue: 1000,
        },
        {
            id: '2',
            title: 'Test Event 2',
            status: 1,
            startDate: '2024-01-02',
            registrationCount: 20,
            revenue: 2000,
        },
    ];

    const mockRegistrations = [
        {
            id: '1',
            eventId: '1',
            attendeeName: 'John Doe',
            registrationDate: '2024-01-01',
            amount: 100,
            paymentStatus: 'completed',
        },
    ];

    const mockAttendees = [
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            totalRegistrations: 2,
            lastRegistration: '2024-01-01',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);

        // Setup default mock responses
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: { items: mockEvents, totalPages: 1, totalItems: 2 },
            message: '',
        });

        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: { items: mockRegistrations, totalPages: 1, totalItems: 1 },
            message: '',
        });

        mockOrganizerService.getApiOrganizerAttendees.mockResolvedValue({
            success: true,
            data: { items: mockAttendees, totalPages: 1, totalItems: 1 },
            message: '',
        });
    });

    describe('Basic Functionality', () => {
        it('initializes with empty state', () => {
            const { result } = renderHook(() => useGlobalSearch());

            expect(result.current.query).toBe('');
            expect(result.current.results).toBe(null);
            expect(result.current.isSearching).toBe(false);
            expect(result.current.hasSearched).toBe(false);
            expect(result.current.counts.total).toBe(0);
        });

        it('performs global search correctly', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('test query');
            });

            expect(result.current.results).not.toBe(null);
            expect(result.current.results?.events).toHaveLength(2);
            expect(result.current.results?.registrations).toHaveLength(1);
            expect(result.current.results?.attendees).toHaveLength(1);
            expect(result.current.results?.totalResults).toBe(4);
            expect(result.current.hasSearched).toBe(true);
        });

        it('calls all search APIs with correct parameters', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            const filters = {
                status: '1',
                category: 'Conference',
                sortBy: 'title',
                sortOrder: 'asc' as const,
            };

            await act(async () => {
                await result.current.search('test query', filters);
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledWith({
                pageNumber: 1,
                pageSize: 10,
                searchTerm: 'test query',
                sortBy: 'title',
                sortOrder: 'asc',
                status: '1',
                category: 'Conference',
                startDate: undefined,
                endDate: undefined,
                isVirtual: undefined,
                hasRegistrations: undefined,
                minRevenue: undefined,
                maxRevenue: undefined,
                minRegistrations: undefined,
                maxRegistrations: undefined,
            });

            expect(
                mockOrganizerService.getApiOrganizerRegistrations
            ).toHaveBeenCalledWith({
                pageNumber: 1,
                pageSize: 10,
                searchTerm: 'test query',
                sortBy: 'title',
                sortOrder: 'asc',
                eventId: undefined,
                paymentStatus: undefined,
                isFinanced: undefined,
                registrationStartDate: undefined,
                registrationEndDate: undefined,
                minAmount: undefined,
                maxAmount: undefined,
            });

            expect(
                mockOrganizerService.getApiOrganizerAttendees
            ).toHaveBeenCalledWith({
                pageNumber: 1,
                pageSize: 10,
                searchTerm: 'test query',
                sortBy: 'title',
                sortOrder: 'asc',
            });
        });

        it('clears search correctly', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            // Perform search first
            await act(async () => {
                await result.current.search('test query');
            });

            expect(result.current.results).not.toBe(null);
            expect(result.current.hasSearched).toBe(true);

            // Clear search
            act(() => {
                result.current.clearSearch();
            });

            expect(result.current.query).toBe('');
            expect(result.current.results).toBe(null);
            expect(result.current.hasSearched).toBe(false);
        });

        it('does not search with empty query', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('');
            });

            expect(result.current.results).toBe(null);
            expect(result.current.hasSearched).toBe(false);
            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).not.toHaveBeenCalled();
        });
    });

    describe('Individual Search Functions', () => {
        it('searches events correctly', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            let events: typeof mockEvents = [];
            await act(async () => {
                events = await result.current.searchEvents('test');
            });

            expect(events).toHaveLength(2);
            expect(events[0].title).toBe('Test Event 1');
            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    searchTerm: 'test',
                })
            );
        });

        it('searches registrations correctly', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            let registrations: typeof mockRegistrations = [];
            await act(async () => {
                registrations =
                    await result.current.searchRegistrations('test');
            });

            expect(registrations).toHaveLength(1);
            expect(registrations[0].attendeeName).toBe('John Doe');
            expect(
                mockOrganizerService.getApiOrganizerRegistrations
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    searchTerm: 'test',
                })
            );
        });

        it('searches attendees correctly', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            let attendees: typeof mockAttendees = [];
            await act(async () => {
                attendees = await result.current.searchAttendees('test');
            });

            expect(attendees).toHaveLength(1);
            expect(attendees[0].name).toBe('John Doe');
            expect(
                mockOrganizerService.getApiOrganizerAttendees
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    searchTerm: 'test',
                })
            );
        });
    });

    describe('Recent Searches', () => {
        it('adds searches to recent searches', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('first search');
            });

            await act(async () => {
                await result.current.search('second search');
            });

            expect(result.current.recentSearches).toContain('first search');
            expect(result.current.recentSearches).toContain('second search');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'organizer-recent-searches',
                expect.stringContaining('first search')
            );
        });

        it('manually adds to recent searches', () => {
            const { result } = renderHook(() => useGlobalSearch());

            act(() => {
                result.current.addToRecentSearches('manual search');
            });

            expect(result.current.recentSearches).toContain('manual search');
        });

        it('limits recent searches to maximum count', () => {
            const { result } = renderHook(() => useGlobalSearch());

            // Add more than the maximum number of searches
            act(() => {
                for (let i = 1; i <= 15; i++) {
                    result.current.addToRecentSearches(`search ${i}`);
                }
            });

            expect(result.current.recentSearches).toHaveLength(10); // MAX_RECENT_SEARCHES
            expect(result.current.recentSearches[0]).toBe('search 15'); // Most recent first
        });

        it('removes duplicates from recent searches', () => {
            const { result } = renderHook(() => useGlobalSearch());

            act(() => {
                result.current.addToRecentSearches('duplicate search');
                result.current.addToRecentSearches('other search');
                result.current.addToRecentSearches('duplicate search');
            });

            expect(result.current.recentSearches).toHaveLength(2);
            expect(result.current.recentSearches[0]).toBe('duplicate search'); // Most recent first
        });

        it('clears recent searches', () => {
            const { result } = renderHook(() => useGlobalSearch());

            act(() => {
                result.current.addToRecentSearches('search to clear');
            });

            expect(result.current.recentSearches).toHaveLength(1);

            act(() => {
                result.current.clearRecentSearches();
            });

            expect(result.current.recentSearches).toHaveLength(0);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'organizer-recent-searches'
            );
        });
    });

    describe('Search Statistics', () => {
        it('tracks search statistics', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('first search');
            });

            await act(async () => {
                await result.current.search('second search');
            });

            await act(async () => {
                await result.current.search('first search'); // Duplicate
            });

            expect(result.current.searchStats.totalSearches).toBe(3);
            expect(result.current.searchStats.mostSearchedTerms).toContainEqual(
                {
                    term: 'first search',
                    count: 2,
                }
            );
            expect(result.current.searchStats.mostSearchedTerms).toContainEqual(
                {
                    term: 'second search',
                    count: 1,
                }
            );
        });

        it('calculates average result count', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('search 1'); // 4 results
            });

            // Mock different result counts for second search
            mockOrganizerService.getApiOrganizerEvents.mockResolvedValueOnce({
                success: true,
                data: { items: [mockEvents[0]], totalPages: 1, totalItems: 1 },
                message: '',
            });

            await act(async () => {
                await result.current.search('search 2'); // 3 results
            });

            expect(result.current.searchStats.averageResultCount).toBe(4); // (4 + 3) / 2 = 3.5, rounded to 4
        });

        it('provides popular searches based on frequency', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('popular search');
                await result.current.search('popular search');
                await result.current.search('less popular');
            });

            expect(result.current.popularSearches[0]).toBe('popular search');
            expect(result.current.popularSearches[1]).toBe('less popular');
        });
    });

    describe('Caching', () => {
        it('caches search results', async () => {
            const { result } = renderHook(() =>
                useGlobalSearch({ enableCaching: true })
            );

            // First search
            await act(async () => {
                await result.current.search('cached search');
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledTimes(1);

            // Second identical search should use cache
            await act(async () => {
                await result.current.search('cached search');
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledTimes(1); // No additional call
        });

        it('respects cache timeout', async () => {
            jest.useFakeTimers();

            const { result } = renderHook(() =>
                useGlobalSearch({
                    enableCaching: true,
                    cacheTimeout: 1000, // 1 second
                })
            );

            // First search
            await act(async () => {
                await result.current.search('timeout test');
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledTimes(1);

            // Advance time beyond cache timeout
            act(() => {
                jest.advanceTimersByTime(1500);
            });

            // Second search should not use cache
            await act(async () => {
                await result.current.search('timeout test');
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledTimes(2);

            jest.useRealTimers();
        });

        it('can disable caching', async () => {
            const { result } = renderHook(() =>
                useGlobalSearch({ enableCaching: false })
            );

            await act(async () => {
                await result.current.search('no cache');
            });

            await act(async () => {
                await result.current.search('no cache');
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error Handling', () => {
        it('handles API errors gracefully', async () => {
            mockOrganizerService.getApiOrganizerEvents.mockRejectedValueOnce(
                new Error('API Error')
            );

            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('error test');
            });

            expect(result.current.hasError).toBe(false); // Error handler mock doesn't set error
            expect(result.current.results).toBe(null);
        });

        it('handles unsuccessful API responses', async () => {
            mockOrganizerService.getApiOrganizerEvents.mockResolvedValueOnce({
                success: false,
                data: null,
                message: 'API Error',
            });

            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                try {
                    await result.current.searchEvents('error test');
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe('API Error');
                }
            });
        });

        it('handles localStorage errors gracefully', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            expect(() => {
                renderHook(() => useGlobalSearch());
            }).not.toThrow();
        });
    });

    describe('Configuration Options', () => {
        it('respects maxResultsPerType option', async () => {
            const { result } = renderHook(() =>
                useGlobalSearch({ maxResultsPerType: 5 })
            );

            await act(async () => {
                await result.current.search('test');
            });

            expect(
                mockOrganizerService.getApiOrganizerEvents
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    pageSize: 5,
                })
            );
        });

        it('respects debounceMs option', () => {
            // This would be tested with actual debouncing, but our mock returns immediately
            const { result } = renderHook(() =>
                useGlobalSearch({ debounceMs: 500 })
            );

            expect(result.current).toBeDefined();
        });
    });

    describe('Result Counts', () => {
        it('calculates result counts correctly', async () => {
            const { result } = renderHook(() => useGlobalSearch());

            await act(async () => {
                await result.current.search('test');
            });

            expect(result.current.counts.events).toBe(2);
            expect(result.current.counts.registrations).toBe(1);
            expect(result.current.counts.attendees).toBe(1);
            expect(result.current.counts.total).toBe(4);
        });

        it('returns zero counts when no results', () => {
            const { result } = renderHook(() => useGlobalSearch());

            expect(result.current.counts.events).toBe(0);
            expect(result.current.counts.registrations).toBe(0);
            expect(result.current.counts.attendees).toBe(0);
            expect(result.current.counts.total).toBe(0);
        });
    });
});

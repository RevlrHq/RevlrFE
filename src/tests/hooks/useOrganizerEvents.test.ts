import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerEvents: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useOrganizerEvents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockEventsData = {
        items: [
            {
                id: 'event-1',
                title: 'Test Event 1',
                startDate: '2024-01-15T10:00:00Z',
                endDate: '2024-01-15T18:00:00Z',
                status: 'published',
                category: 'conference',
                isVirtual: false,
                venue: 'Test Venue',
                registrationCount: 25,
                ticketsSold: 20,
                totalTickets: 100,
                revenue: 1000,
                dateCreated: '2024-01-01T10:00:00Z',
            },
            {
                id: 'event-2',
                title: 'Test Event 2',
                startDate: '2024-02-15T10:00:00Z',
                endDate: '2024-02-15T18:00:00Z',
                status: 'draft',
                category: 'workshop',
                isVirtual: true,
                venue: null,
                registrationCount: 10,
                ticketsSold: 8,
                totalTickets: 50,
                revenue: 400,
                dateCreated: '2024-01-10T10:00:00Z',
            },
        ],
        metadata: {
            totalCount: 2,
            totalPages: 1,
            currentPage: 1,
            pageSize: 10,
        },
    };

    it('should initialize with correct default state', () => {
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: mockEventsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        expect(result.current.events).toEqual([]);
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.totalCount).toBe(0);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(0);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
        expect(typeof result.current.fetchEvents).toBe('function');
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch events data successfully', async () => {
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: mockEventsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.events).toEqual(mockEventsData.items);
        expect(result.current.totalCount).toBe(2);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerEvents
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination correctly', async () => {
        const multiPageData = {
            ...mockEventsData,
            metadata: {
                totalCount: 25,
                totalPages: 3,
                currentPage: 2,
                pageSize: 10,
            },
        };

        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: multiPageData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        await act(async () => {
            await result.current.fetchEvents(2);
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.currentPage).toBe(2);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.hasPreviousPage).toBe(true);
    });

    it('should handle filters correctly', async () => {
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: mockEventsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        const filters = {
            searchTerm: 'test',
            status: 'published',
            category: 'conference',
            isVirtual: false,
        };

        await act(async () => {
            await result.current.fetchEvents(1, filters);
        });

        expect(mockOrganizerService.getApiOrganizerEvents).toHaveBeenCalledWith(
            {
                pageNumber: 1,
                pageSize: 10,
                sortBy: undefined,
                sortOrder: undefined,
                searchTerm: 'test',
                status: 'published',
                category: 'conference',
                startDate: undefined,
                endDate: undefined,
                isVirtual: false,
                hasRegistrations: undefined,
                minRevenue: undefined,
                maxRevenue: undefined,
                minRegistrations: undefined,
                maxRegistrations: undefined,
            }
        );
    });

    it('should handle API error response', async () => {
        const errorMessage = 'Failed to fetch events';
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: false,
            data: null,
            message: errorMessage,
            statusCode: 500,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.events).toEqual([]);
        expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network error', async () => {
        const networkError = new Error('Network error');
        mockOrganizerService.getApiOrganizerEvents.mockRejectedValue(
            networkError
        );

        const { result } = renderHook(() => useOrganizerEvents());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.events).toEqual([]);
        expect(result.current.error).toBe('Network error');
    });

    it('should refetch data when refetch is called', async () => {
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: mockEventsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear the mock to verify refetch calls the API again
        mockOrganizerService.getApiOrganizerEvents.mockClear();

        await act(async () => {
            await result.current.refetch();
        });

        expect(
            mockOrganizerService.getApiOrganizerEvents
        ).toHaveBeenCalledTimes(1);
    });

    it('should use custom page size', () => {
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: mockEventsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        renderHook(() => useOrganizerEvents(20));

        expect(mockOrganizerService.getApiOrganizerEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                pageSize: 20,
            })
        );
    });

    it('should use initial filters', () => {
        const initialFilters = {
            status: 'published',
            category: 'conference',
        };

        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: mockEventsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        renderHook(() => useOrganizerEvents(10, initialFilters));

        expect(mockOrganizerService.getApiOrganizerEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'published',
                category: 'conference',
            })
        );
    });

    it('should handle empty response data', async () => {
        const emptyData = {
            items: [],
            metadata: {
                totalCount: 0,
                totalPages: 0,
                currentPage: 1,
                pageSize: 10,
            },
        };

        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue({
            success: true,
            data: emptyData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerEvents());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.events).toEqual([]);
        expect(result.current.totalCount).toBe(0);
        expect(result.current.totalPages).toBe(0);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
    });
});

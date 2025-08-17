import { renderHook, act, waitFor } from '@testing-library/react';
import { useEventPerformanceAnalytics } from '@/hooks/useEventPerformanceAnalytics';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerEventsTopPerforming: jest.fn(),
        getApiOrganizerEventsPerformance: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useEventPerformanceAnalytics', () => {
    const mockTopPerformingEvents = [
        {
            id: '1',
            title: 'Test Event 1',
            revenue: 1000,
            registrationCount: 50,
            ticketsSold: 45,
            totalTickets: 50,
            status: 'Published',
        },
        {
            id: '2',
            title: 'Test Event 2',
            revenue: 2000,
            registrationCount: 100,
            ticketsSold: 90,
            totalTickets: 100,
            status: 'Published',
        },
    ];

    const mockEventPerformance = {
        eventId: '1',
        eventTitle: 'Test Event 1',
        totalRevenue: 1000,
        totalRegistrations: 50,
        completedRegistrations: 45,
        pendingRegistrations: 3,
        cancelledRegistrations: 2,
        ticketsSold: 45,
        totalTickets: 50,
        salesRate: 0.9,
        averageTicketPrice: 22.22,
        ticketPerformance: [
            {
                ticketId: '1',
                ticketName: 'General Admission',
                price: 25,
                totalQuantity: 50,
                soldQuantity: 45,
                availableQuantity: 5,
                salesRate: 0.9,
                revenue: 1125,
            },
        ],
        dailyStats: [
            {
                date: '2024-01-01',
                registrations: 10,
                revenue: 250,
            },
            {
                date: '2024-01-02',
                registrations: 15,
                revenue: 375,
            },
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() => useEventPerformanceAnalytics());

        expect(result.current.topPerformingEvents).toBeNull();
        expect(result.current.eventPerformance).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.fetchTopPerforming).toBe('function');
        expect(typeof result.current.fetchEventPerformance).toBe('function');
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch top performing events successfully', async () => {
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: true,
                data: mockTopPerformingEvents,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        const { result } = renderHook(() => useEventPerformanceAnalytics());

        await act(async () => {
            await result.current.fetchTopPerforming();
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.topPerformingEvents).toEqual(
            mockTopPerformingEvents
        );
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerEventsTopPerforming
        ).toHaveBeenCalledWith({
            count: 10,
            startDate: undefined,
            endDate: undefined,
        });
    });

    it('should handle error when fetching top performing events', async () => {
        const errorMessage = 'Failed to fetch events';
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockRejectedValue(
            new Error(errorMessage)
        );

        const { result } = renderHook(() => useEventPerformanceAnalytics());

        await act(async () => {
            await result.current.fetchTopPerforming();
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.topPerformingEvents).toBeNull();
    });

    it('should fetch event performance successfully', async () => {
        mockOrganizerService.getApiOrganizerEventsPerformance.mockResolvedValue(
            {
                success: true,
                data: mockEventPerformance,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        const { result } = renderHook(() => useEventPerformanceAnalytics());

        await act(async () => {
            await result.current.fetchEventPerformance('1');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.eventPerformance).toEqual(mockEventPerformance);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerEventsPerformance
        ).toHaveBeenCalledWith({
            eventId: '1',
        });
    });

    it('should handle error when fetching event performance', async () => {
        const errorMessage = 'Failed to fetch event performance';
        mockOrganizerService.getApiOrganizerEventsPerformance.mockRejectedValue(
            new Error(errorMessage)
        );

        const { result } = renderHook(() => useEventPerformanceAnalytics());

        await act(async () => {
            await result.current.fetchEventPerformance('1');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.eventPerformance).toBeNull();
    });

    it('should handle empty event ID when fetching event performance', async () => {
        const { result } = renderHook(() => useEventPerformanceAnalytics());

        await act(async () => {
            await result.current.fetchEventPerformance('');
        });

        expect(result.current.error).toBe('Event ID is required');
        expect(
            mockOrganizerService.getApiOrganizerEventsPerformance
        ).not.toHaveBeenCalled();
    });

    it('should use custom filters when provided', async () => {
        const customFilters = {
            maxEvents: 5,
            timeRange: {
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            },
        };

        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: true,
                data: mockTopPerformingEvents,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        const { result } = renderHook(() =>
            useEventPerformanceAnalytics(customFilters)
        );

        await act(async () => {
            await result.current.fetchTopPerforming();
        });

        expect(
            mockOrganizerService.getApiOrganizerEventsTopPerforming
        ).toHaveBeenCalledWith({
            count: 5,
            startDate: '2024-01-01',
            endDate: '2024-01-31',
        });
    });

    it('should refetch top performing events', async () => {
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: true,
                data: mockTopPerformingEvents,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        const { result } = renderHook(() =>
            useEventPerformanceAnalytics({ maxEvents: 5 })
        );

        // Wait for initial fetch
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.refetch();
        });

        expect(
            mockOrganizerService.getApiOrganizerEventsTopPerforming
        ).toHaveBeenCalledTimes(2); // Initial + refetch
    });

    it('should handle API response with unsuccessful status', async () => {
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: false,
                data: null,
                message: 'API Error',
                statusCode: 400,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        const { result } = renderHook(() => useEventPerformanceAnalytics());

        await act(async () => {
            await result.current.fetchTopPerforming();
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('API Error');
        expect(result.current.topPerformingEvents).toBeNull();
    });

    it('should set loading state correctly during fetch', async () => {
        let resolvePromise: (value: any) => void;
        const promise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockReturnValue(
            promise as any
        );

        const { result } = renderHook(() => useEventPerformanceAnalytics());

        act(() => {
            result.current.fetchTopPerforming();
        });

        expect(result.current.loading).toBe(true);

        await act(async () => {
            resolvePromise({
                success: true,
                data: mockTopPerformingEvents,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            });
            await promise;
        });

        expect(result.current.loading).toBe(false);
    });
});

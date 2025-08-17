import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrganizerRevenue } from '@/hooks/useOrganizerRevenue';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerReportsMonthlyRevenue: jest.fn(),
        getApiOrganizerReportsEventRevenue: jest.fn(),
        postApiOrganizerRevenueReport: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

const mockMonthlyRevenueResponse = {
    success: true,
    data: [
        {
            year: 2024,
            month: 1,
            monthName: 'January',
            revenue: 15000,
            eventCount: 5,
            registrationCount: 150,
        },
        {
            year: 2024,
            month: 2,
            monthName: 'February',
            revenue: 18000,
            eventCount: 6,
            registrationCount: 180,
        },
    ],
    message: 'Success',
};

const mockEventRevenueResponse = {
    success: true,
    data: [
        {
            eventId: '1',
            eventTitle: 'Tech Conference 2024',
            totalRevenue: 25000,
            paidRevenue: 20000,
            pendingRevenue: 5000,
            totalRegistrations: 100,
            paidRegistrations: 80,
            pendingRegistrations: 20,
        },
    ],
    message: 'Success',
};

const mockRevenueStatisticsResponse = {
    success: true,
    data: {
        totalRevenue: 40000,
        thisMonthRevenue: 18000,
        lastMonthRevenue: 15000,
        pendingRevenue: 5000,
        refundedRevenue: 1000,
        monthlyBreakdown: mockMonthlyRevenueResponse.data,
        eventBreakdown: mockEventRevenueResponse.data,
    },
    message: 'Success',
};

describe('useOrganizerRevenue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOrganizerService.getApiOrganizerReportsMonthlyRevenue.mockResolvedValue(
            mockMonthlyRevenueResponse
        );
        mockOrganizerService.getApiOrganizerReportsEventRevenue.mockResolvedValue(
            mockEventRevenueResponse
        );
        mockOrganizerService.postApiOrganizerRevenueReport.mockResolvedValue(
            mockRevenueStatisticsResponse
        );
    });

    it('initializes with empty data and loading state', () => {
        const { result } = renderHook(() => useOrganizerRevenue());

        expect(result.current.monthlyRevenue).toEqual([]);
        expect(result.current.eventRevenue).toEqual([]);
        expect(result.current.revenueStatistics).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('fetches monthly and event revenue data on mount', async () => {
        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(
            mockOrganizerService.getApiOrganizerReportsMonthlyRevenue
        ).toHaveBeenCalledWith({
            startDate: undefined,
            endDate: undefined,
        });
        expect(
            mockOrganizerService.getApiOrganizerReportsEventRevenue
        ).toHaveBeenCalledWith({
            startDate: undefined,
            endDate: undefined,
        });

        expect(result.current.monthlyRevenue).toEqual(
            mockMonthlyRevenueResponse.data
        );
        expect(result.current.eventRevenue).toEqual(
            mockEventRevenueResponse.data
        );
    });

    it('applies date filters when provided', async () => {
        const filters = {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
        };

        const { result } = renderHook(() => useOrganizerRevenue(filters));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(
            mockOrganizerService.getApiOrganizerReportsMonthlyRevenue
        ).toHaveBeenCalledWith({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
        });
        expect(
            mockOrganizerService.getApiOrganizerReportsEventRevenue
        ).toHaveBeenCalledWith({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
        });
    });

    it('handles API errors gracefully', async () => {
        const errorMessage = 'Network error';
        mockOrganizerService.getApiOrganizerReportsMonthlyRevenue.mockRejectedValue(
            new Error(errorMessage)
        );

        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.monthlyRevenue).toEqual([]);
    });

    it('handles unsuccessful API responses', async () => {
        const unsuccessfulResponse = {
            success: false,
            data: null,
            message: 'Failed to fetch data',
        };

        mockOrganizerService.getApiOrganizerReportsMonthlyRevenue.mockResolvedValue(
            unsuccessfulResponse
        );

        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch data');
        expect(result.current.monthlyRevenue).toEqual([]);
    });

    it('refetches data when refetch is called', async () => {
        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear previous calls
        jest.clearAllMocks();

        await act(async () => {
            await result.current.refetch();
        });

        expect(
            mockOrganizerService.getApiOrganizerReportsMonthlyRevenue
        ).toHaveBeenCalledTimes(1);
        expect(
            mockOrganizerService.getApiOrganizerReportsEventRevenue
        ).toHaveBeenCalledTimes(1);
    });

    it('generates custom report successfully', async () => {
        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const reportRequest = {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            eventId: null,
            includeMonthlyBreakdown: true,
            includeEventBreakdown: true,
            includePendingPayments: true,
        };

        await act(async () => {
            await result.current.generateCustomReport(reportRequest);
        });

        expect(
            mockOrganizerService.postApiOrganizerRevenueReport
        ).toHaveBeenCalledWith({
            requestBody: reportRequest,
        });

        expect(result.current.revenueStatistics).toEqual(
            mockRevenueStatisticsResponse.data
        );
        expect(result.current.monthlyRevenue).toEqual(
            mockRevenueStatisticsResponse.data.monthlyBreakdown
        );
        expect(result.current.eventRevenue).toEqual(
            mockRevenueStatisticsResponse.data.eventBreakdown
        );
    });

    it('handles custom report generation errors', async () => {
        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const errorMessage = 'Report generation failed';
        mockOrganizerService.postApiOrganizerRevenueReport.mockRejectedValue(
            new Error(errorMessage)
        );

        const reportRequest = {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            eventId: null,
            includeMonthlyBreakdown: true,
            includeEventBreakdown: true,
            includePendingPayments: true,
        };

        await act(async () => {
            await result.current.generateCustomReport(reportRequest);
        });

        expect(result.current.error).toBe(errorMessage);
    });

    it('updates data when filters change', async () => {
        const initialFilters = { startDate: '2024-01-01' };
        const { result, rerender } = renderHook(
            ({ filters }) => useOrganizerRevenue(filters),
            { initialProps: { filters: initialFilters } }
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear previous calls
        jest.clearAllMocks();

        // Update filters
        const newFilters = { startDate: '2024-02-01', endDate: '2024-02-28' };
        rerender({ filters: newFilters });

        await waitFor(() => {
            expect(
                mockOrganizerService.getApiOrganizerReportsMonthlyRevenue
            ).toHaveBeenCalledWith({
                startDate: '2024-02-01',
                endDate: '2024-02-28',
            });
        });
    });

    it('sets loading state during custom report generation', async () => {
        const { result } = renderHook(() => useOrganizerRevenue());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const reportRequest = {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            eventId: null,
            includeMonthlyBreakdown: true,
            includeEventBreakdown: true,
            includePendingPayments: true,
        };

        // Mock a delayed response
        mockOrganizerService.postApiOrganizerRevenueReport.mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(
                        () => resolve(mockRevenueStatisticsResponse),
                        100
                    )
                )
        );

        act(() => {
            result.current.generateCustomReport(reportRequest);
        });

        // Should be loading immediately after calling generateCustomReport
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });
});

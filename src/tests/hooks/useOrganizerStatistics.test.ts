import { renderHook, waitFor } from '@testing-library/react';
import { useOrganizerStatistics } from '@/hooks/useOrganizerStatistics';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerStatistics: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useOrganizerStatistics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockStatisticsData = {
        totalEvents: 15,
        publishedEvents: 12,
        draftEvents: 2,
        cancelledEvents: 1,
        completedEvents: 10,
        totalRegistrations: 250,
        totalAttendees: 200,
        totalRevenue: 7500,
        pendingRevenue: 500,
    };

    it('should initialize with correct default state', () => {
        mockOrganizerService.getApiOrganizerStatistics.mockResolvedValue({
            success: true,
            data: mockStatisticsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerStatistics());

        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch statistics data successfully', async () => {
        mockOrganizerService.getApiOrganizerStatistics.mockResolvedValue({
            success: true,
            data: mockStatisticsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerStatistics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockStatisticsData);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerStatistics
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle API error response', async () => {
        const errorMessage = 'Failed to fetch statistics data';
        mockOrganizerService.getApiOrganizerStatistics.mockResolvedValue({
            success: false,
            data: null,
            message: errorMessage,
            statusCode: 500,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerStatistics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network error', async () => {
        const networkError = new Error('Network error');
        mockOrganizerService.getApiOrganizerStatistics.mockRejectedValue(
            networkError
        );

        const { result } = renderHook(() => useOrganizerStatistics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('Network error');
    });

    it('should handle unknown error', async () => {
        mockOrganizerService.getApiOrganizerStatistics.mockRejectedValue(
            'Unknown error'
        );

        const { result } = renderHook(() => useOrganizerStatistics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe(
            'An error occurred while fetching statistics data'
        );
    });

    it('should refetch data when refetch is called', async () => {
        mockOrganizerService.getApiOrganizerStatistics.mockResolvedValue({
            success: true,
            data: mockStatisticsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerStatistics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear the mock to verify refetch calls the API again
        mockOrganizerService.getApiOrganizerStatistics.mockClear();

        await result.current.refetch();

        expect(
            mockOrganizerService.getApiOrganizerStatistics
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle successful response without data', async () => {
        mockOrganizerService.getApiOrganizerStatistics.mockResolvedValue({
            success: true,
            data: null,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerStatistics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('Failed to fetch statistics data');
    });
});

import { renderHook, waitFor } from '@testing-library/react';
import { useOrganizerDashboard } from '@/hooks/useOrganizerDashboard';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerDashboard: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useOrganizerDashboard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockDashboardData = {
        organizerId: 'org-123',
        organizerName: 'Test Organizer',
        organizerEmail: 'test@example.com',
        statistics: {
            totalEvents: 10,
            publishedEvents: 8,
            draftEvents: 2,
            totalRegistrations: 150,
            totalRevenue: 5000,
        },
        recentEvents: [
            {
                id: 'event-1',
                title: 'Test Event 1',
                startDate: '2024-01-15T10:00:00Z',
                status: 'published',
                registrationCount: 25,
                revenue: 1000,
            },
        ],
        upcomingEvents: [],
        recentRegistrations: [],
        revenue: {
            totalRevenue: 5000,
            monthlyRevenue: 1200,
            pendingRevenue: 300,
        },
    };

    it('should initialize with correct default state', () => {
        mockOrganizerService.getApiOrganizerDashboard.mockResolvedValue({
            success: true,
            data: mockDashboardData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        expect(result.current.data).toBeNull();
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch dashboard data successfully', async () => {
        mockOrganizerService.getApiOrganizerDashboard.mockResolvedValue({
            success: true,
            data: mockDashboardData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual(mockDashboardData);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerDashboard
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle API error response', async () => {
        const errorMessage = 'Failed to fetch dashboard data';
        mockOrganizerService.getApiOrganizerDashboard.mockResolvedValue({
            success: false,
            data: null,
            message: errorMessage,
            statusCode: 500,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network error', async () => {
        const networkError = new Error('Network error');
        mockOrganizerService.getApiOrganizerDashboard.mockRejectedValue(
            networkError
        );

        const { result } = renderHook(() => useOrganizerDashboard());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('Network error');
    });

    it('should handle unknown error', async () => {
        mockOrganizerService.getApiOrganizerDashboard.mockRejectedValue(
            'Unknown error'
        );

        const { result } = renderHook(() => useOrganizerDashboard());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe(
            'An error occurred while fetching dashboard data'
        );
    });

    it('should refetch data when refetch is called', async () => {
        mockOrganizerService.getApiOrganizerDashboard.mockResolvedValue({
            success: true,
            data: mockDashboardData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear the mock to verify refetch calls the API again
        mockOrganizerService.getApiOrganizerDashboard.mockClear();

        await result.current.refetch();

        expect(
            mockOrganizerService.getApiOrganizerDashboard
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle successful response without data', async () => {
        mockOrganizerService.getApiOrganizerDashboard.mockResolvedValue({
            success: true,
            data: null,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerDashboard());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBe('Failed to fetch dashboard data');
    });
});

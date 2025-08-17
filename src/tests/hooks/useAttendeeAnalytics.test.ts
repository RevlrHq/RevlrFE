import { renderHook, waitFor } from '@testing-library/react';
import { useAttendeeAnalytics } from '../../hooks/useAttendeeAnalytics';
import { OrganizerService } from '../../lib/api';

// Mock the OrganizerService
jest.mock('../../lib/api', () => ({
    OrganizerService: {
        getApiOrganizerAttendeesAnalytics: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useAttendeeAnalytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockAnalyticsResponse = {
        success: true,
        data: {
            totalUniqueAttendees: 150,
            newAttendeesThisMonth: 25,
            returningAttendees: 75,
            averageSpendPerAttendee: 125.5,
            attendeeSegments: [
                {
                    segmentName: 'First-time Attendees',
                    count: 75,
                    percentage: 50.0,
                    averageSpend: 85.25,
                },
                {
                    segmentName: 'Returning Attendees',
                    count: 75,
                    percentage: 50.0,
                    averageSpend: 165.75,
                },
            ],
            topAttendees: [
                {
                    attendeeId: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    eventsAttended: 5,
                    totalSpent: 500.0,
                },
                {
                    attendeeId: '2',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    eventsAttended: 4,
                    totalSpent: 450.0,
                },
            ],
        },
    };

    it('should fetch analytics on mount', async () => {
        mockOrganizerService.getApiOrganizerAttendeesAnalytics.mockResolvedValue(
            mockAnalyticsResponse
        );

        const { result } = renderHook(() => useAttendeeAnalytics());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.analytics).toEqual(mockAnalyticsResponse.data);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerAttendeesAnalytics
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
        const errorMessage = 'Failed to fetch attendee analytics';
        mockOrganizerService.getApiOrganizerAttendeesAnalytics.mockRejectedValue(
            new Error(errorMessage)
        );

        const { result } = renderHook(() => useAttendeeAnalytics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.analytics).toBeNull();
    });

    it('should handle unsuccessful API response', async () => {
        const unsuccessfulResponse = {
            success: false,
            message: 'Analytics not available',
            data: null,
        };

        mockOrganizerService.getApiOrganizerAttendeesAnalytics.mockResolvedValue(
            unsuccessfulResponse
        );

        const { result } = renderHook(() => useAttendeeAnalytics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Analytics not available');
        expect(result.current.analytics).toBeNull();
    });

    it('should handle refetch correctly', async () => {
        mockOrganizerService.getApiOrganizerAttendeesAnalytics.mockResolvedValue(
            mockAnalyticsResponse
        );

        const { result } = renderHook(() => useAttendeeAnalytics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear previous calls
        mockOrganizerService.getApiOrganizerAttendeesAnalytics.mockClear();

        // Call refetch
        await result.current.refetch();

        expect(
            mockOrganizerService.getApiOrganizerAttendeesAnalytics
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle empty analytics data', async () => {
        const emptyResponse = {
            success: true,
            data: {
                totalUniqueAttendees: 0,
                newAttendeesThisMonth: 0,
                returningAttendees: 0,
                averageSpendPerAttendee: 0,
                attendeeSegments: [],
                topAttendees: [],
            },
        };

        mockOrganizerService.getApiOrganizerAttendeesAnalytics.mockResolvedValue(
            emptyResponse
        );

        const { result } = renderHook(() => useAttendeeAnalytics());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.analytics).toEqual(emptyResponse.data);
        expect(result.current.analytics?.attendeeSegments).toHaveLength(0);
        expect(result.current.analytics?.topAttendees).toHaveLength(0);
        expect(result.current.error).toBeNull();
    });
});

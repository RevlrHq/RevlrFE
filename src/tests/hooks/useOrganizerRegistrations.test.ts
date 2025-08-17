import { renderHook, waitFor } from '@testing-library/react';
import { useOrganizerRegistrations } from '../../hooks/useOrganizerRegistrations';
import { OrganizerService } from '../../lib/api';

// Mock the OrganizerService
jest.mock('../../lib/api', () => ({
    OrganizerService: {
        getApiOrganizerRegistrations: jest.fn(),
    },
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('useOrganizerRegistrations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockRegistrationsResponse = {
        success: true,
        data: {
            items: [
                {
                    registrationId: '1',
                    eventId: 'event-1',
                    eventTitle: 'Test Event',
                    attendeeFirstName: 'John',
                    attendeeLastName: 'Doe',
                    attendeeEmail: 'john@example.com',
                    ticketName: 'General Admission',
                    amountPaid: 50,
                    paymentStatus: 1,
                    registrationDate: '2024-01-15T10:00:00Z',
                    isFinanced: false,
                },
                {
                    registrationId: '2',
                    eventId: 'event-2',
                    eventTitle: 'Another Event',
                    attendeeFirstName: 'Jane',
                    attendeeLastName: 'Smith',
                    attendeeEmail: 'jane@example.com',
                    ticketName: 'VIP',
                    amountPaid: 100,
                    paymentStatus: 1,
                    registrationDate: '2024-01-16T14:30:00Z',
                    isFinanced: true,
                },
            ],
            metadata: {
                totalCount: 2,
                totalPages: 1,
                currentPage: 1,
                pageSize: 10,
            },
        },
    };

    it('should fetch registrations on mount', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue(
            mockRegistrationsResponse
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.registrations).toHaveLength(2);
        expect(result.current.totalCount).toBe(2);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledWith({
            pageNumber: 1,
            pageSize: 10,
            sortBy: undefined,
            sortOrder: undefined,
            searchTerm: undefined,
            eventId: undefined,
            paymentStatus: undefined,
            isFinanced: undefined,
            registrationStartDate: undefined,
            registrationEndDate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
        });
    });

    it('should handle API errors', async () => {
        const errorMessage = 'Failed to fetch registrations';
        mockOrganizerService.getApiOrganizerRegistrations.mockRejectedValue(
            new Error(errorMessage)
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.registrations).toHaveLength(0);
    });

    it('should apply filters correctly', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue(
            mockRegistrationsResponse
        );

        const filters = {
            searchTerm: 'john',
            paymentStatus: '1',
            isFinanced: false,
        };

        const { result } = renderHook(() =>
            useOrganizerRegistrations(10, filters)
        );

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledWith({
            pageNumber: 1,
            pageSize: 10,
            sortBy: undefined,
            sortOrder: undefined,
            searchTerm: 'john',
            eventId: undefined,
            paymentStatus: '1',
            isFinanced: false,
            registrationStartDate: undefined,
            registrationEndDate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
        });
    });

    it('should handle pagination correctly', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue(
            mockRegistrationsResponse
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Test fetchRegistrations with page parameter
        await result.current.fetchRegistrations(2);

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenLastCalledWith({
            pageNumber: 2,
            pageSize: 10,
            sortBy: undefined,
            sortOrder: undefined,
            searchTerm: undefined,
            eventId: undefined,
            paymentStatus: undefined,
            isFinanced: undefined,
            registrationStartDate: undefined,
            registrationEndDate: undefined,
            minAmount: undefined,
            maxAmount: undefined,
        });
    });

    it('should calculate pagination state correctly', async () => {
        const multiPageResponse = {
            ...mockRegistrationsResponse,
            data: {
                ...mockRegistrationsResponse.data,
                metadata: {
                    totalCount: 25,
                    totalPages: 3,
                    currentPage: 2,
                    pageSize: 10,
                },
            },
        };

        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue(
            multiPageResponse
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Simulate being on page 2
        await result.current.fetchRegistrations(2);

        await waitFor(() => {
            expect(result.current.currentPage).toBe(2);
            expect(result.current.totalPages).toBe(3);
            expect(result.current.hasNextPage).toBe(true);
            expect(result.current.hasPreviousPage).toBe(true);
        });
    });

    it('should handle refetch correctly', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue(
            mockRegistrationsResponse
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear previous calls
        mockOrganizerService.getApiOrganizerRegistrations.mockClear();

        // Call refetch
        await result.current.refetch();

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response', async () => {
        const emptyResponse = {
            success: true,
            data: {
                items: [],
                metadata: {
                    totalCount: 0,
                    totalPages: 0,
                    currentPage: 1,
                    pageSize: 10,
                },
            },
        };

        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue(
            emptyResponse
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.registrations).toHaveLength(0);
        expect(result.current.totalCount).toBe(0);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
    });
});

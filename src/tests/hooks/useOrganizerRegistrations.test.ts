import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrganizerRegistrations } from '@/hooks/useOrganizerRegistrations';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
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

    const mockRegistrationsData = {
        items: [
            {
                registrationId: 'reg-1',
                eventId: 'event-1',
                eventTitle: 'Test Event 1',
                attendeeFirstName: 'John',
                attendeeLastName: 'Doe',
                attendeeEmail: 'john.doe@example.com',
                ticketName: 'General Admission',
                amountPaid: 50,
                paymentStatus: 'completed',
                registrationDate: '2024-01-15T10:00:00Z',
                isFinanced: false,
            },
            {
                registrationId: 'reg-2',
                eventId: 'event-1',
                eventTitle: 'Test Event 1',
                attendeeFirstName: 'Jane',
                attendeeLastName: 'Smith',
                attendeeEmail: 'jane.smith@example.com',
                ticketName: 'VIP',
                amountPaid: 100,
                paymentStatus: 'pending',
                registrationDate: '2024-01-16T10:00:00Z',
                isFinanced: true,
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
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        expect(result.current.registrations).toEqual([]);
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.totalCount).toBe(0);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.totalPages).toBe(0);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
        expect(typeof result.current.fetchRegistrations).toBe('function');
        expect(typeof result.current.refetch).toBe('function');
    });

    it('should fetch registrations data successfully', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.registrations).toEqual(
            mockRegistrationsData.items
        );
        expect(result.current.totalCount).toBe(2);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.currentPage).toBe(1);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
        expect(result.current.error).toBeNull();
        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledTimes(1);
    });

    it('should handle pagination correctly', async () => {
        const multiPageData = {
            ...mockRegistrationsData,
            metadata: {
                totalCount: 25,
                totalPages: 3,
                currentPage: 2,
                pageSize: 10,
            },
        };

        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: multiPageData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        await act(async () => {
            await result.current.fetchRegistrations(2);
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
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        const filters = {
            searchTerm: 'john',
            eventId: 'event-1',
            paymentStatus: 'completed',
            isFinanced: false,
            minAmount: 25,
            maxAmount: 100,
        };

        await act(async () => {
            await result.current.fetchRegistrations(1, filters);
        });

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledWith({
            pageNumber: 1,
            pageSize: 10,
            sortBy: undefined,
            sortOrder: undefined,
            searchTerm: 'john',
            eventId: 'event-1',
            paymentStatus: 'completed',
            isFinanced: false,
            registrationStartDate: undefined,
            registrationEndDate: undefined,
            minAmount: 25,
            maxAmount: 100,
        });
    });

    it('should handle API error response', async () => {
        const errorMessage = 'Failed to fetch registrations';
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: false,
            data: null,
            message: errorMessage,
            statusCode: 500,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.registrations).toEqual([]);
        expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network error', async () => {
        const networkError = new Error('Network error');
        mockOrganizerService.getApiOrganizerRegistrations.mockRejectedValue(
            networkError
        );

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.registrations).toEqual([]);
        expect(result.current.error).toBe('Network error');
    });

    it('should refetch data when refetch is called', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Clear the mock to verify refetch calls the API again
        mockOrganizerService.getApiOrganizerRegistrations.mockClear();

        await act(async () => {
            await result.current.refetch();
        });

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledTimes(1);
    });

    it('should use custom page size', () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        renderHook(() => useOrganizerRegistrations(20));

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                pageSize: 20,
            })
        );
    });

    it('should use initial filters', () => {
        const initialFilters = {
            paymentStatus: 'completed',
            isFinanced: false,
        };

        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        renderHook(() => useOrganizerRegistrations(10, initialFilters));

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                paymentStatus: 'completed',
                isFinanced: false,
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

        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: emptyData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.registrations).toEqual([]);
        expect(result.current.totalCount).toBe(0);
        expect(result.current.totalPages).toBe(0);
        expect(result.current.hasNextPage).toBe(false);
        expect(result.current.hasPreviousPage).toBe(false);
    });

    it('should handle date range filters', async () => {
        mockOrganizerService.getApiOrganizerRegistrations.mockResolvedValue({
            success: true,
            data: mockRegistrationsData,
            message: null,
            statusCode: 200,
            errors: null,
        });

        const { result } = renderHook(() => useOrganizerRegistrations());

        const filters = {
            registrationStartDate: '2024-01-01',
            registrationEndDate: '2024-01-31',
        };

        await act(async () => {
            await result.current.fetchRegistrations(1, filters);
        });

        expect(
            mockOrganizerService.getApiOrganizerRegistrations
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                registrationStartDate: '2024-01-01',
                registrationEndDate: '2024-01-31',
            })
        );
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationManagement from '../../components/RegistrationManagement';
import { useOrganizerRegistrations } from '../../hooks/useOrganizerRegistrations';
import { useDebounce } from '../../hooks/useDebounce';

// Mock the hooks
jest.mock('../../hooks/useOrganizerRegistrations');
jest.mock('../../hooks/useDebounce');
jest.mock('../../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

const mockUseOrganizerRegistrations =
    useOrganizerRegistrations as jest.MockedFunction<
        typeof useOrganizerRegistrations
    >;
const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>;

describe('RegistrationManagement', () => {
    const mockRegistrations = [
        {
            registrationId: '1',
            eventId: 'event-1',
            eventTitle: 'Test Event 1',
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
            eventTitle: 'Test Event 2',
            attendeeFirstName: 'Jane',
            attendeeLastName: 'Smith',
            attendeeEmail: 'jane@example.com',
            ticketName: 'VIP',
            amountPaid: 100,
            paymentStatus: 1,
            registrationDate: '2024-01-16T14:30:00Z',
            isFinanced: true,
        },
    ];

    const defaultHookReturn = {
        registrations: mockRegistrations,
        loading: false,
        error: null,
        totalCount: 2,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        fetchRegistrations: jest.fn(),
        refetch: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDebounce.mockImplementation((value) => value);
        mockUseOrganizerRegistrations.mockReturnValue(defaultHookReturn);
    });

    it('should render registration management interface', () => {
        render(<RegistrationManagement />);

        expect(screen.getByText('Registration Management')).toBeInTheDocument();
        expect(
            screen.getByText('Manage and track event registrations')
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Search registrations...')
        ).toBeInTheDocument();
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should display registrations in table', () => {
        render(<RegistrationManagement />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        expect(screen.getByText('General Admission')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('Test Event 2')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should show loading state', () => {
        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            loading: true,
            registrations: [],
        });

        render(<RegistrationManagement />);

        // Should show skeleton loaders
        const loadingElements = document.querySelectorAll('.animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show error state', () => {
        const errorMessage = 'Failed to load registrations';
        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            error: errorMessage,
            registrations: [],
        });

        render(<RegistrationManagement />);

        expect(
            screen.getByText('Error loading registrations')
        ).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show empty state when no registrations', () => {
        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            registrations: [],
            totalCount: 0,
        });

        render(<RegistrationManagement />);

        expect(screen.getByText('No registrations found')).toBeInTheDocument();
        expect(
            screen.getByText('Try adjusting your search or filters')
        ).toBeInTheDocument();
    });

    it('should handle search input', async () => {
        const user = userEvent.setup();
        render(<RegistrationManagement />);

        const searchInput = screen.getByPlaceholderText(
            'Search registrations...'
        );
        await user.type(searchInput, 'john');

        expect(searchInput).toHaveValue('john');
        expect(mockUseDebounce).toHaveBeenCalledWith('john', 300);
    });

    it('should toggle filters panel', async () => {
        const user = userEvent.setup();
        render(<RegistrationManagement />);

        const filtersButton = screen.getByText('Filters');

        // Filters panel should not be visible initially
        expect(screen.queryByText('Payment Status')).not.toBeInTheDocument();

        await user.click(filtersButton);

        // Filters panel should be visible after clicking
        expect(screen.getByText('Payment Status')).toBeInTheDocument();
        expect(screen.getAllByText('Financing')).toHaveLength(2); // In filter and table header
        expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('should handle sorting', async () => {
        const user = userEvent.setup();
        render(<RegistrationManagement />);

        const attendeeHeader = screen.getByText('Attendee').closest('th');
        expect(attendeeHeader).toBeInTheDocument();

        // Should be clickable for sorting
        expect(attendeeHeader).toHaveClass('cursor-pointer');
    });

    it('should show export modal', async () => {
        const user = userEvent.setup();
        render(<RegistrationManagement />);

        const exportButton = screen.getByText('Export');
        await user.click(exportButton);

        expect(screen.getByText('Export Registrations')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Choose the format for exporting registration data'
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Export as CSV')).toBeInTheDocument();
        expect(screen.getByText('Export as Excel')).toBeInTheDocument();
        expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    });

    it('should handle refresh', async () => {
        const user = userEvent.setup();
        const mockRefetch = jest.fn();
        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            refetch: mockRefetch,
        });

        render(<RegistrationManagement />);

        const refreshButton = screen.getByText('Refresh');
        await user.click(refreshButton);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('should display payment status badges correctly', () => {
        const registrationsWithDifferentStatuses = [
            { ...mockRegistrations[0], paymentStatus: 0 }, // Pending
            { ...mockRegistrations[1], paymentStatus: 1 }, // Completed
        ];

        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            registrations: registrationsWithDifferentStatuses,
        });

        render(<RegistrationManagement />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should display financing status', () => {
        render(<RegistrationManagement />);

        // Jane Smith has financing
        expect(screen.getByText('Financed')).toBeInTheDocument();
    });

    it('should show pagination when multiple pages', () => {
        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            totalPages: 3,
            currentPage: 2,
            hasNextPage: true,
            hasPreviousPage: true,
        });

        render(<RegistrationManagement />);

        expect(screen.getByText('Previous')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
        // Check for pagination button with current page
        const pageButton = screen.getByRole('button', { name: '2' });
        expect(pageButton).toBeInTheDocument();
    });

    it('should handle pagination clicks', async () => {
        const user = userEvent.setup();
        const mockFetchRegistrations = jest.fn();

        mockUseOrganizerRegistrations.mockReturnValue({
            ...defaultHookReturn,
            totalPages: 3,
            currentPage: 1,
            hasNextPage: true,
            hasPreviousPage: false,
            fetchRegistrations: mockFetchRegistrations,
        });

        render(<RegistrationManagement />);

        const nextButton = screen.getByText('Next');
        await user.click(nextButton);

        expect(mockFetchRegistrations).toHaveBeenCalledWith(2);
    });

    it('should format currency correctly', () => {
        render(<RegistrationManagement />);

        expect(screen.getByText('$50.00')).toBeInTheDocument();
        expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
        render(<RegistrationManagement />);

        // Should format dates in a readable format
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 16, 2024/)).toBeInTheDocument();
    });
});

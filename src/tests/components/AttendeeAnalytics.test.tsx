import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttendeeAnalytics from '../../components/AttendeeAnalytics';
import { useAttendeeAnalytics } from '../../hooks/useAttendeeAnalytics';

// Mock the hooks
jest.mock('../../hooks/useAttendeeAnalytics');
jest.mock('../../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

const mockUseAttendeeAnalytics = useAttendeeAnalytics as jest.MockedFunction<
    typeof useAttendeeAnalytics
>;

describe('AttendeeAnalytics', () => {
    const mockAnalytics = {
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
    };

    const defaultHookReturn = {
        analytics: mockAnalytics,
        loading: false,
        error: null,
        refetch: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAttendeeAnalytics.mockReturnValue(defaultHookReturn);
    });

    it('should render attendee analytics interface', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('Attendee Analytics')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Insights into your attendee demographics and behavior'
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should display key metrics', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('Total Attendees')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();

        expect(screen.getByText('New This Month')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();

        expect(screen.getAllByText('Returning Attendees')).toHaveLength(2);
        expect(screen.getByText('75')).toBeInTheDocument();

        expect(screen.getByText('Avg. Spend')).toBeInTheDocument();
        expect(screen.getAllByText('$125.50')).toHaveLength(2); // Appears in metrics and summary
    });

    it('should display attendee segments', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('Attendee Segments')).toBeInTheDocument();
        expect(screen.getByText('First-time Attendees')).toBeInTheDocument();
        expect(screen.getAllByText('Returning Attendees')).toHaveLength(2); // Appears in metrics and segments
        expect(screen.getAllByText(/75.*50\.0%/)).toHaveLength(2);
        expect(screen.getByText(/Avg\. Spend: \$85\.25/)).toBeInTheDocument();
        expect(screen.getByText(/Avg\. Spend: \$165\.75/)).toBeInTheDocument();
    });

    it('should display top attendees', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('Top Attendees')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('$500.00')).toBeInTheDocument();
        expect(screen.getByText('5 events')).toBeInTheDocument();

        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('$450.00')).toBeInTheDocument();
        expect(screen.getByText('4 events')).toBeInTheDocument();
    });

    it('should display summary statistics', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('Summary')).toBeInTheDocument();
        expect(screen.getByText('New Attendee Rate')).toBeInTheDocument();
        expect(screen.getByText('Retention Rate')).toBeInTheDocument();
        expect(screen.getByText('Average Lifetime Value')).toBeInTheDocument();

        // Check calculated percentages
        expect(screen.getByText('16.7%')).toBeInTheDocument(); // 25/150 * 100
        expect(screen.getByText('50.0%')).toBeInTheDocument(); // 75/150 * 100
    });

    it('should show loading state', () => {
        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            loading: true,
            analytics: null,
        });

        render(<AttendeeAnalytics />);

        // Should show loading elements (skeleton components)
        const loadingElements = document.querySelectorAll('.animate-pulse');
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show error state', () => {
        const errorMessage = 'Failed to load analytics';
        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            error: errorMessage,
            analytics: null,
        });

        render(<AttendeeAnalytics />);

        expect(
            screen.getByText('Error loading attendee analytics')
        ).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show no data state', () => {
        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            analytics: null,
        });

        render(<AttendeeAnalytics />);

        expect(
            screen.getByText('No analytics data available')
        ).toBeInTheDocument();
    });

    it('should handle refresh', async () => {
        const user = userEvent.setup();
        const mockRefetch = jest.fn();
        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            refetch: mockRefetch,
        });

        render(<AttendeeAnalytics />);

        const refreshButton = screen.getByText('Refresh');
        await user.click(refreshButton);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty segments data', () => {
        const analyticsWithEmptySegments = {
            ...mockAnalytics,
            attendeeSegments: [],
        };

        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            analytics: analyticsWithEmptySegments,
        });

        render(<AttendeeAnalytics />);

        expect(
            screen.getByText('No segment data available')
        ).toBeInTheDocument();
    });

    it('should handle empty top attendees data', () => {
        const analyticsWithEmptyTopAttendees = {
            ...mockAnalytics,
            topAttendees: [],
        };

        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            analytics: analyticsWithEmptyTopAttendees,
        });

        render(<AttendeeAnalytics />);

        expect(
            screen.getByText('No top attendees data available')
        ).toBeInTheDocument();
    });

    it('should format currency correctly', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getAllByText('$125.50')).toHaveLength(2); // Appears in metrics and summary
        expect(screen.getByText(/\$85\.25/)).toBeInTheDocument();
        expect(screen.getByText(/\$165\.75/)).toBeInTheDocument();
        expect(screen.getByText('$500.00')).toBeInTheDocument();
        expect(screen.getByText('$450.00')).toBeInTheDocument();
    });

    it('should format numbers correctly', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
        expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('should format percentages correctly', () => {
        render(<AttendeeAnalytics />);

        expect(screen.getByText('50.0%')).toBeInTheDocument();
        expect(screen.getByText('16.7%')).toBeInTheDocument();
    });

    it('should display progress bars for segments', () => {
        render(<AttendeeAnalytics />);

        // Check for progress bar elements by class instead of role
        const progressBars = document.querySelectorAll('.bg-blue-600');
        expect(progressBars).toHaveLength(2); // One for each segment
    });

    it('should handle zero values gracefully', () => {
        const analyticsWithZeros = {
            totalUniqueAttendees: 0,
            newAttendeesThisMonth: 0,
            returningAttendees: 0,
            averageSpendPerAttendee: 0,
            attendeeSegments: [],
            topAttendees: [],
        };

        mockUseAttendeeAnalytics.mockReturnValue({
            ...defaultHookReturn,
            analytics: analyticsWithZeros,
        });

        render(<AttendeeAnalytics />);

        expect(screen.getAllByText('0')).toHaveLength(3); // Multiple zero values
        expect(screen.getAllByText(/\$0/)).toHaveLength(2);
        expect(screen.getAllByText('0%')).toHaveLength(2); // Multiple percentage values
    });

    it('should display attendee ranking badges', () => {
        render(<AttendeeAnalytics />);

        // Top attendees should have ranking badges
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
    });
});

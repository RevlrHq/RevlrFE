import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventPerformanceAnalytics } from '@/components/EventPerformanceAnalytics';
import { useEventPerformanceAnalytics } from '@/hooks/useEventPerformanceAnalytics';

// Mock the hook
jest.mock('@/hooks/useEventPerformanceAnalytics');

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
    Line: ({ data, options }: any) => (
        <div
            data-testid='line-chart'
            data-chart-data={JSON.stringify(data)}
            data-chart-options={JSON.stringify(options)}
        />
    ),
    Bar: ({ data, options }: any) => (
        <div
            data-testid='bar-chart'
            data-chart-data={JSON.stringify(data)}
            data-chart-options={JSON.stringify(options)}
        />
    ),
    Doughnut: ({ data, options }: any) => (
        <div
            data-testid='doughnut-chart'
            data-chart-data={JSON.stringify(data)}
            data-chart-options={JSON.stringify(options)}
        />
    ),
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
    Chart: {
        register: jest.fn(),
    },
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    PointElement: jest.fn(),
    LineElement: jest.fn(),
    BarElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
    ArcElement: jest.fn(),
}));

const mockUseEventPerformanceAnalytics =
    useEventPerformanceAnalytics as jest.MockedFunction<
        typeof useEventPerformanceAnalytics
    >;

describe('EventPerformanceAnalytics', () => {
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
    };

    const defaultMockReturn = {
        topPerformingEvents: mockTopPerformingEvents,
        eventPerformance: null,
        loading: false,
        error: null,
        fetchTopPerforming: jest.fn(),
        fetchEventPerformance: jest.fn(),
        refetch: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseEventPerformanceAnalytics.mockReturnValue(defaultMockReturn);
    });

    it('renders performance metrics correctly', () => {
        render(<EventPerformanceAnalytics />);

        // Check if performance metrics are displayed
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Total Registrations')).toBeInTheDocument();
        expect(screen.getByText('Average Revenue')).toBeInTheDocument();
        expect(screen.getByText('Average Sales Rate')).toBeInTheDocument();

        // Check calculated values
        expect(screen.getByText('$3,000.00')).toBeInTheDocument(); // Total revenue
        expect(screen.getByText('150')).toBeInTheDocument(); // Total registrations
        expect(screen.getByText('$1,500.00')).toBeInTheDocument(); // Average revenue
    });

    it('displays loading state correctly', () => {
        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            loading: true,
        });

        render(<EventPerformanceAnalytics />);

        // Check for skeleton loading states
        const skeletons = screen.getAllByTestId(/skeleton/i);
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error state correctly', () => {
        const errorMessage = 'Failed to load performance data';
        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            error: errorMessage,
        });

        render(<EventPerformanceAnalytics />);

        expect(
            screen.getByText(
                `Failed to load performance analytics: ${errorMessage}`
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', () => {
        const mockRefetch = jest.fn();
        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            error: 'Test error',
            refetch: mockRefetch,
        });

        render(<EventPerformanceAnalytics />);

        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('renders top performing events chart', () => {
        render(<EventPerformanceAnalytics />);

        expect(screen.getByText('Top Performing Events')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('displays performance alerts when enabled', () => {
        render(<EventPerformanceAnalytics showAlerts={true} />);

        expect(screen.getByText('Performance Alerts')).toBeInTheDocument();
    });

    it('displays recommendations when enabled', () => {
        render(<EventPerformanceAnalytics showRecommendations={true} />);

        // Switch to recommendations tab
        const recommendationsTab = screen.getByText('Recommendations');
        fireEvent.click(recommendationsTab);

        expect(
            screen.getByText('Performance Recommendations')
        ).toBeInTheDocument();
    });

    it('switches between tabs correctly', async () => {
        render(<EventPerformanceAnalytics />);

        // Check initial tab
        expect(screen.getByText('Top Performing Events')).toBeInTheDocument();

        // Switch to trends tab
        const trendsTab = screen.getByText('Trends');
        fireEvent.click(trendsTab);

        await waitFor(() => {
            expect(
                screen.getByText('Performance Trends Analysis')
            ).toBeInTheDocument();
        });

        // Switch to individual events tab
        const individualTab = screen.getByText('Individual Events');
        fireEvent.click(individualTab);

        await waitFor(() => {
            expect(
                screen.getByText('Individual Event Performance')
            ).toBeInTheDocument();
        });
    });

    it('displays individual event details correctly', async () => {
        render(<EventPerformanceAnalytics />);

        // Switch to individual events tab
        const individualTab = screen.getByText('Individual Events');
        fireEvent.click(individualTab);

        await waitFor(() => {
            // Check if events are displayed
            expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            expect(screen.getByText('Test Event 2')).toBeInTheDocument();

            // Check event details
            expect(screen.getByText('$1,000')).toBeInTheDocument(); // Event 1 revenue
            expect(screen.getByText('$2,000')).toBeInTheDocument(); // Event 2 revenue
        });
    });

    it('calls fetchEventPerformance when view details is clicked', async () => {
        const mockFetchEventPerformance = jest.fn();
        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            fetchEventPerformance: mockFetchEventPerformance,
        });

        render(<EventPerformanceAnalytics />);

        // Switch to individual events tab
        const individualTab = screen.getByText('Individual Events');
        fireEvent.click(individualTab);

        await waitFor(() => {
            // Click view details button
            const viewDetailsButtons = screen.getAllByText('View Details');
            fireEvent.click(viewDetailsButtons[0]);
        });

        expect(mockFetchEventPerformance).toHaveBeenCalledWith('1');
    });

    it('generates performance alerts correctly', () => {
        // Mock events with low performance
        const lowPerformingEvents = [
            {
                id: '1',
                title: 'Low Performing Event',
                revenue: 100,
                registrationCount: 0,
                ticketsSold: 5,
                totalTickets: 50,
                status: 'Published',
            },
        ];

        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            topPerformingEvents: lowPerformingEvents,
        });

        render(<EventPerformanceAnalytics showAlerts={true} />);

        // Check for low sales rate alert
        expect(screen.getByText('Low Sales Rate Detected')).toBeInTheDocument();
        expect(
            screen.getByText('Events Without Registrations')
        ).toBeInTheDocument();
    });

    it('generates performance recommendations correctly', async () => {
        // Mock events that would trigger recommendations
        const eventsNeedingRecommendations = [
            {
                id: '1',
                title: 'Low Revenue Event',
                revenue: 50, // Very low revenue
                registrationCount: 5, // Low registrations
                ticketsSold: 5,
                totalTickets: 50,
                status: 'Published',
            },
        ];

        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            topPerformingEvents: eventsNeedingRecommendations,
        });

        render(<EventPerformanceAnalytics showRecommendations={true} />);

        // Switch to recommendations tab
        const recommendationsTab = screen.getByText('Recommendations');
        fireEvent.click(recommendationsTab);

        await waitFor(() => {
            // Check for recommendations
            expect(
                screen.getByText('Optimize Pricing Strategy')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Increase Marketing Efforts')
            ).toBeInTheDocument();
        });
    });

    it('handles empty data gracefully', () => {
        mockUseEventPerformanceAnalytics.mockReturnValue({
            ...defaultMockReturn,
            topPerformingEvents: [],
        });

        render(<EventPerformanceAnalytics />);

        // Should show empty state message in the chart
        expect(
            screen.getByText('No event performance data available')
        ).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const customClass = 'custom-analytics-class';
        const { container } = render(
            <EventPerformanceAnalytics className={customClass} />
        );

        expect(container.firstChild).toHaveClass(customClass);
    });

    it('uses custom time range in hook', () => {
        const timeRange = {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
        };

        render(<EventPerformanceAnalytics timeRange={timeRange} />);

        expect(mockUseEventPerformanceAnalytics).toHaveBeenCalledWith({
            maxEvents: 10,
            timeRange,
        });
    });

    it('uses custom maxTopEvents parameter', () => {
        const maxTopEvents = 5;

        render(<EventPerformanceAnalytics maxTopEvents={maxTopEvents} />);

        expect(mockUseEventPerformanceAnalytics).toHaveBeenCalledWith({
            maxEvents: maxTopEvents,
            timeRange: undefined,
        });
    });

    it('hides recommendations tab when showRecommendations is false', () => {
        render(<EventPerformanceAnalytics showRecommendations={false} />);

        expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
    });

    it('does not display alerts when showAlerts is false', () => {
        render(<EventPerformanceAnalytics showAlerts={false} />);

        expect(
            screen.queryByText('Performance Alerts')
        ).not.toBeInTheDocument();
    });
});

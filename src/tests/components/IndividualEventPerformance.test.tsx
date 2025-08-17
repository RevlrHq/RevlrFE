import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IndividualEventPerformance } from '@/components/IndividualEventPerformance';
import { EventPerformanceView } from '@/lib/api';

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

describe('IndividualEventPerformance', () => {
    const mockEventPerformance: EventPerformanceView = {
        eventId: '1',
        eventTitle: 'Test Event',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-02T00:00:00Z',
        totalTickets: 100,
        ticketsSold: 80,
        salesRate: 0.8,
        totalRevenue: 2000,
        averageTicketPrice: 25,
        totalRegistrations: 85,
        completedRegistrations: 80,
        pendingRegistrations: 3,
        cancelledRegistrations: 2,
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
            {
                ticketId: '2',
                ticketName: 'VIP',
                price: 50,
                totalQuantity: 50,
                soldQuantity: 35,
                availableQuantity: 15,
                salesRate: 0.7,
                revenue: 1750,
            },
        ],
        dailyStats: [
            {
                date: '2024-01-01',
                registrations: 40,
                revenue: 1000,
            },
            {
                date: '2024-01-02',
                registrations: 40,
                revenue: 1000,
            },
        ],
    };

    it('renders event performance data correctly', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        // Check event header
        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Event ID badge

        // Check key metrics
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$2,000.00')).toBeInTheDocument();
        expect(screen.getByText('Sales Rate')).toBeInTheDocument();
        expect(screen.getByText('80.0%')).toBeInTheDocument();
        expect(screen.getByText('Avg. Ticket Price')).toBeInTheDocument();
        expect(screen.getByText('$25.00')).toBeInTheDocument();
        expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
                loading={true}
            />
        );

        // Check for skeleton loading states
        const skeletons = screen.getAllByTestId(/skeleton/i);
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays empty state when no performance data', () => {
        render(<IndividualEventPerformance eventPerformance={null as any} />);

        expect(
            screen.getByText('No performance data available for this event.')
        ).toBeInTheDocument();
    });

    it('renders daily registration trends chart when data is available', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        expect(
            screen.getByText('Daily Registration Trends')
        ).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders registration status breakdown chart', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        expect(screen.getByText('Registration Status')).toBeInTheDocument();
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });

    it('renders ticket performance section when ticket data is available', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        expect(screen.getByText('Ticket Performance')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

        // Check ticket details
        expect(screen.getByText('General Admission')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
        expect(screen.getByText('$25.00')).toBeInTheDocument();
        expect(screen.getByText('$50.00')).toBeInTheDocument();
    });

    it('displays ticket details correctly', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        // Check first ticket details
        const generalAdmissionSection = screen
            .getByText('General Admission')
            .closest('div');
        expect(generalAdmissionSection).toBeInTheDocument();

        // Check ticket metrics
        expect(screen.getByText('45')).toBeInTheDocument(); // Sold quantity
        expect(screen.getByText('5')).toBeInTheDocument(); // Available quantity
        expect(screen.getByText('50')).toBeInTheDocument(); // Total quantity
        expect(screen.getByText('$1,125.00')).toBeInTheDocument(); // Revenue
    });

    it('calculates and displays performance metrics correctly', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        // Sales rate should be 80% (80/100)
        expect(screen.getByText('80.0%')).toBeInTheDocument();

        // Completion rate should be ~94.1% (80/85)
        expect(screen.getByText('94.1%')).toBeInTheDocument();
    });

    it('handles event performance without ticket data', () => {
        const eventWithoutTickets = {
            ...mockEventPerformance,
            ticketPerformance: undefined,
        };

        render(
            <IndividualEventPerformance
                eventPerformance={eventWithoutTickets}
            />
        );

        // Should not render ticket performance section
        expect(
            screen.queryByText('Ticket Performance')
        ).not.toBeInTheDocument();
    });

    it('handles event performance without daily stats', () => {
        const eventWithoutDailyStats = {
            ...mockEventPerformance,
            dailyStats: undefined,
        };

        render(
            <IndividualEventPerformance
                eventPerformance={eventWithoutDailyStats}
            />
        );

        // Should not render daily trends chart
        expect(
            screen.queryByText('Daily Registration Trends')
        ).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
        const customClass = 'custom-performance-class';
        const { container } = render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
                className={customClass}
            />
        );

        expect(container.firstChild).toHaveClass(customClass);
    });

    it('formats dates correctly in event header', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        // Check if dates are formatted properly
        expect(screen.getByText(/1\/1\/2024 - 1\/2\/2024/)).toBeInTheDocument();
    });

    it('displays progress bars for ticket sales rates', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
            />
        );

        // Check for progress components (they should be in the DOM)
        const progressElements = screen.getAllByRole('progressbar');
        expect(progressElements.length).toBeGreaterThan(0);
    });

    it('handles zero values gracefully', () => {
        const eventWithZeros = {
            ...mockEventPerformance,
            totalRevenue: 0,
            totalRegistrations: 0,
            completedRegistrations: 0,
            ticketsSold: 0,
            totalTickets: 0,
        };

        render(
            <IndividualEventPerformance eventPerformance={eventWithZeros} />
        );

        expect(screen.getByText('$0.00')).toBeInTheDocument();
        expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('handles missing optional fields', () => {
        const minimalEventPerformance = {
            eventId: '1',
            eventTitle: 'Minimal Event',
        };

        render(
            <IndividualEventPerformance
                eventPerformance={minimalEventPerformance}
            />
        );

        expect(screen.getByText('Minimal Event')).toBeInTheDocument();
        expect(screen.getByText('$0.00')).toBeInTheDocument(); // Should default to 0
    });

    it('uses dark theme when isDark prop is true', () => {
        render(
            <IndividualEventPerformance
                eventPerformance={mockEventPerformance}
                isDark={true}
            />
        );

        // Charts should be rendered (dark theme affects chart colors internally)
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
});

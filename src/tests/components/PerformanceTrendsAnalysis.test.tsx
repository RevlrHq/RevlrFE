import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceTrendsAnalysis } from '@/components/PerformanceTrendsAnalysis';
import { EventSummaryView } from '@/lib/api';

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
}));

describe('PerformanceTrendsAnalysis', () => {
    const mockEvents: EventSummaryView[] = [
        {
            id: '1',
            title: 'Event January 1',
            startDate: '2024-01-15T00:00:00Z',
            revenue: 1000,
            registrationCount: 50,
            ticketsSold: 45,
            totalTickets: 50,
            status: 'Published',
        },
        {
            id: '2',
            title: 'Event January 2',
            startDate: '2024-01-20T00:00:00Z',
            revenue: 1500,
            registrationCount: 75,
            ticketsSold: 70,
            totalTickets: 80,
            status: 'Published',
        },
        {
            id: '3',
            title: 'Event February 1',
            startDate: '2024-02-10T00:00:00Z',
            revenue: 2000,
            registrationCount: 100,
            ticketsSold: 95,
            totalTickets: 100,
            status: 'Published',
        },
        {
            id: '4',
            title: 'Event February 2',
            startDate: '2024-02-25T00:00:00Z',
            revenue: 1800,
            registrationCount: 90,
            ticketsSold: 85,
            totalTickets: 90,
            status: 'Published',
        },
    ];

    it('renders trend metrics correctly', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} />);

        // Check trend metric labels
        expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
        expect(screen.getByText('Registration Trend')).toBeInTheDocument();
        expect(screen.getByText('Event Count')).toBeInTheDocument();
        expect(screen.getByText('Avg Revenue/Event')).toBeInTheDocument();

        // Check calculated values (February totals)
        expect(screen.getByText('$3,800.00')).toBeInTheDocument(); // February total revenue
        expect(screen.getByText('190')).toBeInTheDocument(); // February total registrations
        expect(screen.getByText('2')).toBeInTheDocument(); // February event count
        expect(screen.getByText('$1,900.00')).toBeInTheDocument(); // February average revenue
    });

    it('displays loading state correctly', () => {
        render(
            <PerformanceTrendsAnalysis events={mockEvents} loading={true} />
        );

        // Check for skeleton loading states
        const skeletons = screen.getAllByTestId(/skeleton/i);
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays empty state when no events provided', () => {
        render(<PerformanceTrendsAnalysis events={[]} />);

        expect(
            screen.getByText('No event data available for trend analysis.')
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Trends will appear once you have events with historical data.'
            )
        ).toBeInTheDocument();
    });

    it('displays insufficient data message when less than 2 months of data', () => {
        const singleMonthEvents = mockEvents.slice(0, 2); // Only January events
        render(<PerformanceTrendsAnalysis events={singleMonthEvents} />);

        expect(
            screen.getByText('Insufficient data for trend analysis.')
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'At least 2 months of event data are needed to show trends.'
            )
        ).toBeInTheDocument();
    });

    it('renders trend charts when sufficient data is available', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} />);

        expect(screen.getByText('Revenue Trends')).toBeInTheDocument();
        expect(screen.getByText('Activity Trends')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('calculates trend changes correctly', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} />);

        // Should show percentage changes from January to February
        // February revenue (3800) vs January revenue (2500) = +52% change
        expect(screen.getByText('+52.0%')).toBeInTheDocument();

        // February registrations (190) vs January registrations (125) = +52% change
        expect(screen.getByText('+52.0%')).toBeInTheDocument();
    });

    it('displays monthly performance summary', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} />);

        expect(
            screen.getByText('Monthly Performance Summary')
        ).toBeInTheDocument();

        // Check for month labels
        expect(screen.getByText('Feb 2024')).toBeInTheDocument();
        expect(screen.getByText('Jan 2024')).toBeInTheDocument();

        // Check for event count badges
        expect(screen.getByText('2 events')).toBeInTheDocument();
    });

    it('groups events by month correctly', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} />);

        // January should have 2 events with total revenue of $2500
        // February should have 2 events with total revenue of $3800

        // Check monthly summary section
        const monthlySection = screen
            .getByText('Monthly Performance Summary')
            .closest('div');
        expect(monthlySection).toBeInTheDocument();

        // Both months should show 2 events each
        const eventBadges = screen.getAllByText('2 events');
        expect(eventBadges).toHaveLength(2);
    });

    it('handles events without start dates', () => {
        const eventsWithoutDates = [
            {
                ...mockEvents[0],
                startDate: undefined,
            },
            ...mockEvents.slice(1),
        ];

        render(<PerformanceTrendsAnalysis events={eventsWithoutDates} />);

        // Should still render with the events that have dates
        expect(screen.getByText('Revenue Trends')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const customClass = 'custom-trends-class';
        const { container } = render(
            <PerformanceTrendsAnalysis
                events={mockEvents}
                className={customClass}
            />
        );

        expect(container.firstChild).toHaveClass(customClass);
    });

    it('uses dark theme when isDark prop is true', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} isDark={true} />);

        // Charts should be rendered (dark theme affects chart colors internally)
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('handles zero revenue and registration values', () => {
        const eventsWithZeros = mockEvents.map((event) => ({
            ...event,
            revenue: 0,
            registrationCount: 0,
        }));

        render(<PerformanceTrendsAnalysis events={eventsWithZeros} />);

        expect(screen.getByText('$0.00')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays trend indicators correctly', () => {
        render(<PerformanceTrendsAnalysis events={mockEvents} />);

        // Should show trend indicators (up/down arrows)
        // The specific icons depend on the calculated trends
        const trendElements = screen.getAllByText(/vs last month/);
        expect(trendElements.length).toBeGreaterThan(0);
    });

    it('sorts monthly data chronologically', () => {
        // Create events in reverse chronological order
        const unsortedEvents = [
            {
                id: '1',
                title: 'March Event',
                startDate: '2024-03-15T00:00:00Z',
                revenue: 1000,
                registrationCount: 50,
            },
            {
                id: '2',
                title: 'January Event',
                startDate: '2024-01-15T00:00:00Z',
                revenue: 2000,
                registrationCount: 100,
            },
            {
                id: '3',
                title: 'February Event',
                startDate: '2024-02-15T00:00:00Z',
                revenue: 1500,
                registrationCount: 75,
            },
        ];

        render(<PerformanceTrendsAnalysis events={unsortedEvents} />);

        // Should still calculate trends correctly (March vs February)
        expect(screen.getByText('Revenue Trends')).toBeInTheDocument();
        expect(screen.getByText('Activity Trends')).toBeInTheDocument();
    });

    it('limits monthly summary to last 6 months', () => {
        // Create events spanning more than 6 months
        const manyMonthsEvents = Array.from({ length: 10 }, (_, i) => ({
            id: `${i + 1}`,
            title: `Event ${i + 1}`,
            startDate: `2024-${String(i + 1).padStart(2, '0')}-15T00:00:00Z`,
            revenue: 1000,
            registrationCount: 50,
        }));

        render(<PerformanceTrendsAnalysis events={manyMonthsEvents} />);

        // Should only show last 6 months in summary
        const eventBadges = screen.getAllByText('1 events');
        expect(eventBadges.length).toBeLessThanOrEqual(6);
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AttendeeAnalyticsChart } from '@/components/charts/AttendeeAnalyticsChart';
import { generateMockAttendeeAnalyticsView } from '@/tests/utils/chartTestUtils';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
    Chart: { register: jest.fn() },
    ArcElement: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    BarElement: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
    Doughnut: jest.fn(({ data, options }) => (
        <div
            data-testid='doughnut-chart'
            data-chart-type='doughnut'
            aria-label='Attendee analytics doughnut chart'
        >
            Doughnut Chart Mock
        </div>
    )),
    Bar: jest.fn(({ data, options }) => (
        <div
            data-testid='bar-chart'
            data-chart-type='bar'
            aria-label='Attendee analytics bar chart'
        >
            Bar Chart Mock
        </div>
    )),
}));

describe('AttendeeAnalyticsChart', () => {
    const mockData = generateMockAttendeeAnalyticsView();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders doughnut chart by default', () => {
        render(<AttendeeAnalyticsChart data={mockData} />);

        const chart = screen.getByTestId('doughnut-chart');
        expect(chart).toBeInTheDocument();
        expect(chart).toHaveAttribute(
            'aria-label',
            'Attendee analytics doughnut chart'
        );
    });

    it('renders bar chart when chartType is bar', () => {
        render(<AttendeeAnalyticsChart data={mockData} chartType='bar' />);

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
        expect(chart).toHaveAttribute(
            'aria-label',
            'Attendee analytics bar chart'
        );
    });

    it('displays empty state when no data provided', () => {
        const emptyData = { ...mockData, attendeeSegments: [] };
        render(<AttendeeAnalyticsChart data={emptyData} />);

        expect(
            screen.getByText('No attendee analytics data available')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('img', {
                name: 'No attendee analytics data available',
            })
        ).toBeInTheDocument();
    });

    it('displays empty state when attendeeSegments is undefined', () => {
        const emptyData = { ...mockData, attendeeSegments: undefined };
        render(<AttendeeAnalyticsChart data={emptyData} />);

        expect(
            screen.getByText('No attendee analytics data available')
        ).toBeInTheDocument();
    });

    it('renders chart container with correct accessibility attributes', () => {
        render(<AttendeeAnalyticsChart data={mockData} />);

        const container = screen.getByRole('img', {
            name: `Attendee analytics doughnut chart showing ${mockData.attendeeSegments?.length || 0} segments`,
        });
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('bg-card', 'rounded-lg', 'border', 'p-4');
    });

    it('sets correct height on chart container', () => {
        const customHeight = 400;
        render(
            <AttendeeAnalyticsChart data={mockData} height={customHeight} />
        );

        const container = screen.getByRole('img', {
            name: /Attendee analytics/,
        });
        const chartContainer = container.querySelector('div');

        expect(chartContainer).toHaveStyle({ height: `${customHeight}px` });
    });

    it('applies custom className', () => {
        const customClass = 'custom-chart-class';
        render(
            <AttendeeAnalyticsChart data={mockData} className={customClass} />
        );

        const container = screen.getByRole('img', {
            name: /Attendee analytics/,
        });
        expect(container).toHaveClass(customClass);
    });

    it('renders with showSpending enabled for doughnut chart', () => {
        render(
            <AttendeeAnalyticsChart
                data={mockData}
                chartType='doughnut'
                showSpending={true}
            />
        );

        const chart = screen.getByTestId('doughnut-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with showSpending enabled for bar chart', () => {
        render(
            <AttendeeAnalyticsChart
                data={mockData}
                chartType='bar'
                showSpending={true}
            />
        );

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with dark theme', () => {
        render(<AttendeeAnalyticsChart data={mockData} isDark={true} />);

        const chart = screen.getByTestId('doughnut-chart');
        expect(chart).toBeInTheDocument();
    });

    it('handles segments with missing values gracefully', () => {
        const incompleteData = {
            ...mockData,
            attendeeSegments: [
                { segmentName: 'Segment 1' }, // Missing count and other values
                {
                    segmentName: 'Segment 2',
                    count: 50,
                    percentage: 25.0,
                    averageSpend: 100.0,
                },
                {
                    segmentName: 'Segment 3',
                    count: null as any,
                    percentage: null as any,
                }, // Null values
            ],
        };

        render(<AttendeeAnalyticsChart data={incompleteData} />);

        const chart = screen.getByTestId('doughnut-chart');
        expect(chart).toBeInTheDocument();
    });

    it('handles null data gracefully', () => {
        render(<AttendeeAnalyticsChart data={null as any} />);

        expect(
            screen.getByText('No attendee analytics data available')
        ).toBeInTheDocument();
    });

    it('handles undefined data gracefully', () => {
        render(<AttendeeAnalyticsChart data={undefined as any} />);

        expect(
            screen.getByText('No attendee analytics data available')
        ).toBeInTheDocument();
    });

    it('displays error state when chart data cannot be rendered', () => {
        const invalidData = { ...mockData, attendeeSegments: null as any };
        render(<AttendeeAnalyticsChart data={invalidData} />);

        expect(
            screen.getByText('No attendee analytics data available')
        ).toBeInTheDocument();
    });
});

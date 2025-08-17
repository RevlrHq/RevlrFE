import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventPerformanceChart } from '@/components/charts/EventPerformanceChart';
import { generateMockEventSummaryView } from '@/tests/utils/chartTestUtils';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
    Chart: { register: jest.fn() },
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    BarElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
    Bar: jest.fn(({ data, options }) => (
        <div
            data-testid='bar-chart'
            data-chart-type='bar'
            aria-label='Event performance horizontal bar chart'
        >
            Bar Chart Mock
        </div>
    )),
}));

describe('EventPerformanceChart', () => {
    const mockData = generateMockEventSummaryView(8);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders chart with data', () => {
        render(<EventPerformanceChart data={mockData} />);

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
        expect(chart).toHaveAttribute(
            'aria-label',
            'Event performance horizontal bar chart'
        );
    });

    it('displays empty state when no data provided', () => {
        render(<EventPerformanceChart data={[]} />);

        expect(
            screen.getByText('No event performance data available')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('img', {
                name: 'No event performance data available',
            })
        ).toBeInTheDocument();
    });

    it('renders chart container with correct accessibility attributes', () => {
        render(<EventPerformanceChart data={mockData} maxEvents={5} />);

        const container = screen.getByRole('img', {
            name: /Event performance chart showing top 5 events/,
        });
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('bg-card', 'rounded-lg', 'border', 'p-4');
    });

    it('sets correct height on chart container', () => {
        const customHeight = 400;
        render(<EventPerformanceChart data={mockData} height={customHeight} />);

        const container = screen.getByRole('img', {
            name: /Event performance chart/,
        });
        const chartContainer = container.querySelector('div');

        expect(chartContainer).toHaveStyle({ height: `${customHeight}px` });
    });

    it('applies custom className', () => {
        const customClass = 'custom-chart-class';
        render(
            <EventPerformanceChart data={mockData} className={customClass} />
        );

        const container = screen.getByRole('img', {
            name: /Event performance chart/,
        });
        expect(container).toHaveClass(customClass);
    });

    it('renders with revenue metric', () => {
        render(<EventPerformanceChart data={mockData} metric='revenue' />);

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with registrations metric', () => {
        render(
            <EventPerformanceChart data={mockData} metric='registrations' />
        );

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with both metrics', () => {
        render(<EventPerformanceChart data={mockData} metric='both' />);

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with dark theme', () => {
        render(<EventPerformanceChart data={mockData} isDark={true} />);

        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
    });

    it('handles events with missing revenue gracefully', () => {
        const incompleteData = [
            { ...mockData[0], revenue: undefined, title: 'Event 1' },
            { ...mockData[1], revenue: 5000, title: 'Event 2' },
            { ...mockData[2], revenue: null as any, title: 'Event 3' },
        ];

        render(<EventPerformanceChart data={incompleteData} />);

        // Should render chart if there's at least one event with revenue
        const chart = screen.getByTestId('bar-chart');
        expect(chart).toBeInTheDocument();
    });

    it('handles null data gracefully', () => {
        render(<EventPerformanceChart data={null as any} />);

        expect(
            screen.getByText('No event performance data available')
        ).toBeInTheDocument();
    });

    it('handles undefined data gracefully', () => {
        render(<EventPerformanceChart data={undefined as any} />);

        expect(
            screen.getByText('No event performance data available')
        ).toBeInTheDocument();
    });
});

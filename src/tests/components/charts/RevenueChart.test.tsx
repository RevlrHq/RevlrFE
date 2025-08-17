import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { generateMockMonthlyRevenue } from '@/tests/utils/chartTestUtils';

// Mock Chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
    Chart: { register: jest.fn() },
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    PointElement: jest.fn(),
    LineElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
    Filler: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
    Line: jest.fn(() => (
        <div
            data-testid='line-chart'
            data-chart-type='line'
            aria-label='Revenue trends line chart'
        >
            Line Chart Mock
        </div>
    )),
}));

describe('RevenueChart', () => {
    const mockData = generateMockMonthlyRevenue(6);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders chart with data', () => {
        render(<RevenueChart data={mockData} />);

        const chart = screen.getByTestId('line-chart');
        expect(chart).toBeInTheDocument();
        expect(chart).toHaveAttribute(
            'aria-label',
            'Revenue trends line chart'
        );
    });

    it('displays empty state when no data provided', () => {
        render(<RevenueChart data={[]} />);

        expect(
            screen.getByText('No revenue data available')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('img', { name: 'No revenue data available' })
        ).toBeInTheDocument();
    });

    it('renders chart container with correct accessibility attributes', () => {
        render(<RevenueChart data={mockData} />);

        const container = screen.getByRole('img', {
            name: `Revenue chart showing ${mockData.length} months of data`,
        });
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('bg-card', 'rounded-lg', 'border', 'p-4');
    });

    it('sets correct height on chart container', () => {
        const customHeight = 400;
        render(<RevenueChart data={mockData} height={customHeight} />);

        const container = screen.getByRole('img', {
            name: /Revenue chart showing/,
        });
        const chartContainer = container.querySelector('div');

        expect(chartContainer).toHaveStyle({ height: `${customHeight}px` });
    });

    it('applies custom className', () => {
        const customClass = 'custom-chart-class';
        render(<RevenueChart data={mockData} className={customClass} />);

        const container = screen.getByRole('img', {
            name: /Revenue chart showing/,
        });
        expect(container).toHaveClass(customClass);
    });

    it('handles data with missing values gracefully', () => {
        const incompleteData = [
            { year: 2024, month: 1, monthName: 'January' }, // Missing revenue
            { year: 2024, month: 2, monthName: 'February', revenue: 5000 },
            {
                year: 2024,
                month: 3,
                monthName: 'March',
                revenue: null as number | null,
            }, // Null revenue
        ];

        render(<RevenueChart data={incompleteData} />);

        // Should still render the chart component
        const chart = screen.getByTestId('line-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with showEventCount prop', () => {
        render(<RevenueChart data={mockData} showEventCount={true} />);

        const chart = screen.getByTestId('line-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with dark theme', () => {
        render(<RevenueChart data={mockData} isDark={true} />);

        const chart = screen.getByTestId('line-chart');
        expect(chart).toBeInTheDocument();
    });

    it('renders with light theme', () => {
        render(<RevenueChart data={mockData} isDark={false} />);

        const chart = screen.getByTestId('line-chart');
        expect(chart).toBeInTheDocument();
    });

    it('handles null data gracefully', () => {
        render(<RevenueChart data={null as never} />);

        expect(
            screen.getByText('No revenue data available')
        ).toBeInTheDocument();
    });

    it('handles undefined data gracefully', () => {
        render(<RevenueChart data={undefined as never} />);

        expect(
            screen.getByText('No revenue data available')
        ).toBeInTheDocument();
    });
});

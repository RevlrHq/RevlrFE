import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthlyRevenueChart } from '@/components/revenue/MonthlyRevenueChart';
import { MonthlyRevenue } from '@/lib/api';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
    Line: ({ data }: { data: unknown }) => (
        <div data-testid='line-chart' data-chart-data={JSON.stringify(data)} />
    ),
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
    Chart: {
        register: jest.fn(),
    },
    CategoryScale: {},
    LinearScale: {},
    PointElement: {},
    LineElement: {},
    Title: {},
    Tooltip: {},
    Legend: {},
    Filler: {},
}));

const mockData: MonthlyRevenue[] = [
    {
        year: 2024,
        month: 1,
        monthName: 'January',
        revenue: 15000,
        eventCount: 5,
        registrationCount: 150,
    },
    {
        year: 2024,
        month: 2,
        monthName: 'February',
        revenue: 18000,
        eventCount: 6,
        registrationCount: 180,
    },
];

describe('MonthlyRevenueChart', () => {
    const defaultProps = {
        data: mockData,
        loading: false,
        isDark: false,
        onDateRangeChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders monthly revenue chart with data', () => {
        render(<MonthlyRevenueChart {...defaultProps} />);

        expect(screen.getByText('Monthly Revenue Trends')).toBeInTheDocument();
        expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument();

        // Check summary statistics
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$33,000')).toBeInTheDocument(); // 15000 + 18000
        expect(screen.getByText('Average Monthly')).toBeInTheDocument();
        expect(screen.getByText('Best Month')).toBeInTheDocument();
        expect(screen.getByText('February')).toBeInTheDocument();
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('11')).toBeInTheDocument(); // 5 + 6
    });

    it('displays loading state correctly', () => {
        const { container } = render(
            <MonthlyRevenueChart {...defaultProps} loading={true} />
        );

        // Check for skeleton loading elements by class name
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles empty data gracefully', () => {
        render(<MonthlyRevenueChart {...defaultProps} data={[]} />);

        expect(screen.getByText('No data')).toBeInTheDocument();
        expect(
            screen.getByText('No monthly revenue data available')
        ).toBeInTheDocument();
    });

    it('shows and hides filters when filter button is clicked', () => {
        render(<MonthlyRevenueChart {...defaultProps} />);

        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);

        expect(screen.getByText('Date Range Filter')).toBeInTheDocument();
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
        expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });

    it('calls onDateRangeChange when filters are applied', () => {
        const mockOnDateRangeChange = jest.fn();
        render(
            <MonthlyRevenueChart
                {...defaultProps}
                onDateRangeChange={mockOnDateRangeChange}
            />
        );

        // Show filters
        const filterButton = screen.getByText('Filters');
        fireEvent.click(filterButton);

        // Set date values
        const startDateInput = screen.getByLabelText('Start Date');
        const endDateInput = screen.getByLabelText('End Date');

        fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

        // Apply filters
        const applyButton = screen.getByText('Apply Filters');
        fireEvent.click(applyButton);

        expect(mockOnDateRangeChange).toHaveBeenCalledWith(
            '2024-01-01',
            '2024-12-31'
        );
    });

    it('displays monthly breakdown table correctly', () => {
        render(<MonthlyRevenueChart {...defaultProps} />);

        // Check table headers
        expect(screen.getByText('Month')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Events')).toBeInTheDocument();
        expect(screen.getByText('Registrations')).toBeInTheDocument();
        expect(screen.getByText('Avg per Event')).toBeInTheDocument();

        // Check table data
        expect(screen.getByText('January 2024')).toBeInTheDocument();
        expect(screen.getByText('February 2024')).toBeInTheDocument();
    });

    it('disables export button when loading', () => {
        render(<MonthlyRevenueChart {...defaultProps} loading={true} />);

        const exportButton = screen.getByText('Export CSV');
        expect(exportButton).toBeDisabled();
    });
});

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
    {
        year: 2024,
        month: 3,
        monthName: 'March',
        revenue: 22000,
        eventCount: 8,
        registrationCount: 220,
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
        expect(screen.getByText('$55,000')).toBeInTheDocument(); // 15000 + 18000 + 22000
        expect(screen.getByText('Average Monthly')).toBeInTheDocument();
        expect(screen.getByText('$18,333')).toBeInTheDocument(); // 55000 / 3
        expect(screen.getByText('Best Month')).toBeInTheDocument();
        expect(screen.getByText('March')).toBeInTheDocument();
        expect(screen.getByText('Total Events')).toBeInTheDocument();
        expect(screen.getByText('19')).toBeInTheDocument(); // 5 + 6 + 8
    });

    it('displays loading state correctly', () => {
        render(<MonthlyRevenueChart {...defaultProps} loading={true} />);

        // Check for skeleton loading elements by class name
        const { container } = render(
            <MonthlyRevenueChart {...defaultProps} loading={true} />
        );
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('handles empty data gracefully', () => {
        render(<MonthlyRevenueChart {...defaultProps} data={[]} />);

        expect(screen.getAllByText('$0')).toHaveLength(2); // Total Revenue and Average Monthly both show $0
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

        // Click again to hide
        fireEvent.click(filterButton);
        expect(screen.queryByText('Date Range Filter')).not.toBeInTheDocument();
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

    it('clears filters when clear button is clicked', () => {
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
        fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

        // Clear filters
        const clearButton = screen.getByText('Clear');
        fireEvent.click(clearButton);

        expect(startDateInput).toHaveValue('');
        expect(mockOnDateRangeChange).toHaveBeenCalledWith(
            undefined,
            undefined
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
        expect(screen.getByText('March 2024')).toBeInTheDocument();

        expect(screen.getAllByText('$15,000')).toHaveLength(1);
        expect(screen.getAllByText('$18,000')).toHaveLength(1);
        expect(screen.getAllByText('$22,000')).toHaveLength(2); // Appears in best month and table
    });

    it('exports CSV data when export button is clicked', () => {
        // Mock URL.createObjectURL and related functions
        const mockCreateObjectURL = jest.fn(() => 'mock-url');
        const mockRevokeObjectURL = jest.fn();
        const mockClick = jest.fn();
        const mockAppendChild = jest.fn();
        const mockRemoveChild = jest.fn();

        Object.defineProperty(URL, 'createObjectURL', {
            value: mockCreateObjectURL,
        });
        Object.defineProperty(URL, 'revokeObjectURL', {
            value: mockRevokeObjectURL,
        });

        const mockLink = {
            href: '',
            download: '',
            click: mockClick,
        };

        jest.spyOn(document, 'createElement').mockReturnValue(
            mockLink as HTMLAnchorElement
        );
        jest.spyOn(document.body, 'appendChild').mockImplementation(
            mockAppendChild
        );
        jest.spyOn(document.body, 'removeChild').mockImplementation(
            mockRemoveChild
        );

        render(<MonthlyRevenueChart {...defaultProps} />);

        const exportButton = screen.getByText('Export CSV');
        fireEvent.click(exportButton);

        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockAppendChild).toHaveBeenCalled();
        expect(mockRemoveChild).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('disables export button when loading or no data', () => {
        render(<MonthlyRevenueChart {...defaultProps} loading={true} />);

        const exportButton = screen.getByText('Export CSV');
        expect(exportButton).toBeDisabled();
    });

    it('calculates average per event correctly', () => {
        render(<MonthlyRevenueChart {...defaultProps} />);

        // January: 15000 / 5 = 3000
        // February: 18000 / 6 = 3000
        // March: 22000 / 8 = 2750
        expect(screen.getByText('$3,000')).toBeInTheDocument();
        expect(screen.getByText('$2,750')).toBeInTheDocument();
    });
});

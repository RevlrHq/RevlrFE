import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RevenueReporting } from '@/components/RevenueReporting';
import { useOrganizerRevenue } from '@/hooks/useOrganizerRevenue';
import {
    MonthlyRevenue,
    EventRevenueBreakdown,
    RevenueStatistics,
} from '@/lib/api';

// Mock the hook
jest.mock('@/hooks/useOrganizerRevenue');
const mockUseOrganizerRevenue = useOrganizerRevenue as jest.MockedFunction<
    typeof useOrganizerRevenue
>;

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
    Line: ({ data, options }: any) => (
        <div data-testid='line-chart' data-chart-data={JSON.stringify(data)} />
    ),
    Bar: ({ data, options }: any) => (
        <div data-testid='bar-chart' data-chart-data={JSON.stringify(data)} />
    ),
    Doughnut: ({ data, options }: any) => (
        <div
            data-testid='doughnut-chart'
            data-chart-data={JSON.stringify(data)}
        />
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
    BarElement: {},
    ArcElement: {},
    Title: {},
    Tooltip: {},
    Legend: {},
    Filler: {},
}));

// Mock the sub-components to avoid complex rendering issues
jest.mock('@/components/revenue/MonthlyRevenueChart', () => ({
    MonthlyRevenueChart: ({ data, loading }: any) => (
        <div data-testid='monthly-revenue-chart'>
            {loading
                ? 'Loading...'
                : `Monthly chart with ${data?.length || 0} months`}
        </div>
    ),
}));

jest.mock('@/components/revenue/EventRevenueBreakdown', () => ({
    EventRevenueBreakdown: ({ data, loading }: any) => (
        <div data-testid='event-revenue-breakdown'>
            {loading
                ? 'Loading...'
                : `Event breakdown with ${data?.length || 0} events`}
        </div>
    ),
}));

jest.mock('@/components/revenue/RevenueComparison', () => ({
    RevenueComparison: ({ monthlyData, eventData, loading }: any) => (
        <div data-testid='revenue-comparison'>
            {loading ? 'Loading...' : 'Revenue comparison component'}
        </div>
    ),
}));

jest.mock('@/components/revenue/CustomReportGenerator', () => ({
    CustomReportGenerator: ({ loading, revenueStatistics }: any) => (
        <div data-testid='custom-report-generator'>
            {loading ? 'Loading...' : 'Custom report generator'}
        </div>
    ),
}));

const mockMonthlyRevenue: MonthlyRevenue[] = [
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

const mockEventRevenue: EventRevenueBreakdown[] = [
    {
        eventId: '1',
        eventTitle: 'Tech Conference 2024',
        totalRevenue: 25000,
        paidRevenue: 20000,
        pendingRevenue: 5000,
        totalRegistrations: 100,
        paidRegistrations: 80,
        pendingRegistrations: 20,
    },
    {
        eventId: '2',
        eventTitle: 'Music Festival',
        totalRevenue: 15000,
        paidRevenue: 15000,
        pendingRevenue: 0,
        totalRegistrations: 75,
        paidRegistrations: 75,
        pendingRegistrations: 0,
    },
];

const mockRevenueStatistics: RevenueStatistics = {
    totalRevenue: 40000,
    thisMonthRevenue: 18000,
    lastMonthRevenue: 15000,
    pendingRevenue: 5000,
    refundedRevenue: 1000,
    monthlyBreakdown: mockMonthlyRevenue,
    eventBreakdown: mockEventRevenue,
};

describe('RevenueReporting', () => {
    const defaultMockReturn = {
        monthlyRevenue: mockMonthlyRevenue,
        eventRevenue: mockEventRevenue,
        revenueStatistics: mockRevenueStatistics,
        loading: false,
        error: null,
        refetch: jest.fn(),
        generateCustomReport: jest.fn(),
    };

    beforeEach(() => {
        mockUseOrganizerRevenue.mockReturnValue(defaultMockReturn);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders revenue reporting component with data', () => {
        render(<RevenueReporting />);

        expect(
            screen.getByText('Revenue & Financial Reports')
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Comprehensive financial analytics and revenue insights'
            )
        ).toBeInTheDocument();

        // Check revenue overview cards
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$40,000')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.getByText('$18,000')).toBeInTheDocument();
        expect(screen.getByText('Pending Revenue')).toBeInTheDocument();
        expect(screen.getByText('$5,000')).toBeInTheDocument();
        expect(screen.getByText('Refunded')).toBeInTheDocument();
        expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            loading: true,
        });

        const { container } = render(<RevenueReporting />);

        // Should show skeleton loaders
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error state correctly', () => {
        const errorMessage = 'Failed to fetch revenue data';
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            error: errorMessage,
        });

        render(<RevenueReporting />);

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', () => {
        const mockRefetch = jest.fn();
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            error: 'Network error',
            refetch: mockRefetch,
        });

        render(<RevenueReporting />);

        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('calls refetch when refresh button is clicked', () => {
        const mockRefetch = jest.fn();
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            refetch: mockRefetch,
        });

        render(<RevenueReporting />);

        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('calculates and displays growth indicators correctly', () => {
        render(<RevenueReporting />);

        // Should show positive growth (18000 - 15000) / 15000 * 100 = 20%
        expect(screen.getByText('20.0%')).toBeInTheDocument();
        expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('displays top performing events correctly', () => {
        render(<RevenueReporting />);

        expect(screen.getByText('Top Performing Events')).toBeInTheDocument();
        expect(screen.getByText('Tech Conference 2024')).toBeInTheDocument();
        expect(screen.getByText('Music Festival')).toBeInTheDocument();
        expect(screen.getByText('$25,000')).toBeInTheDocument();
        expect(screen.getByText('$15,000')).toBeInTheDocument();
    });

    it('switches between tabs correctly', () => {
        render(<RevenueReporting />);

        // Check default tab content
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();

        // Click on Monthly Trends tab
        const monthlyTab = screen.getByText('Monthly Trends');
        fireEvent.click(monthlyTab);
        expect(screen.getByTestId('monthly-revenue-chart')).toBeInTheDocument();

        // Click on Event Breakdown tab
        const eventTab = screen.getByText('Event Breakdown');
        fireEvent.click(eventTab);
        expect(
            screen.getByTestId('event-revenue-breakdown')
        ).toBeInTheDocument();

        // Click on Comparison tab
        const comparisonTab = screen.getByText('Comparison');
        fireEvent.click(comparisonTab);
        expect(screen.getByTestId('revenue-comparison')).toBeInTheDocument();

        // Click on Custom Reports tab
        const reportsTab = screen.getByText('Custom Reports');
        fireEvent.click(reportsTab);
        expect(
            screen.getByTestId('custom-report-generator')
        ).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            monthlyRevenue: [],
            eventRevenue: [],
            revenueStatistics: null,
        });

        render(<RevenueReporting />);

        expect(screen.getAllByText('$0')).toHaveLength(4); // All revenue cards show $0
        expect(
            screen.getByText('No revenue data available')
        ).toBeInTheDocument();
    });

    it('applies dark theme correctly', () => {
        render(<RevenueReporting isDark={true} />);

        // The component should pass isDark prop to child components
        // This is tested indirectly through the chart components
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const customClass = 'custom-revenue-class';
        const { container } = render(
            <RevenueReporting className={customClass} />
        );

        expect(container.firstChild).toHaveClass(customClass);
    });
});

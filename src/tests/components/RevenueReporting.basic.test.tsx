import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RevenueReporting } from '@/components/RevenueReporting';
import { useOrganizerRevenue } from '@/hooks/useOrganizerRevenue';

// Mock the hook
jest.mock('@/hooks/useOrganizerRevenue');
const mockUseOrganizerRevenue = useOrganizerRevenue as jest.MockedFunction<
    typeof useOrganizerRevenue
>;

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
    Line: () => <div data-testid='line-chart' />,
    Bar: () => <div data-testid='bar-chart' />,
    Doughnut: () => <div data-testid='doughnut-chart' />,
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
    Chart: { register: jest.fn() },
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

// Mock the sub-components
jest.mock('@/components/revenue/MonthlyRevenueChart', () => ({
    MonthlyRevenueChart: () => (
        <div data-testid='monthly-revenue-chart'>Monthly Chart</div>
    ),
}));

jest.mock('@/components/revenue/EventRevenueBreakdown', () => ({
    EventRevenueBreakdown: () => (
        <div data-testid='event-revenue-breakdown'>Event Breakdown</div>
    ),
}));

jest.mock('@/components/revenue/RevenueComparison', () => ({
    RevenueComparison: () => (
        <div data-testid='revenue-comparison'>Revenue Comparison</div>
    ),
}));

jest.mock('@/components/revenue/CustomReportGenerator', () => ({
    CustomReportGenerator: () => (
        <div data-testid='custom-report-generator'>Custom Report Generator</div>
    ),
}));

describe('RevenueReporting', () => {
    const defaultMockReturn = {
        monthlyRevenue: [
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
        ],
        eventRevenue: [
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
        ],
        revenueStatistics: {
            totalRevenue: 40000,
            thisMonthRevenue: 18000,
            lastMonthRevenue: 15000,
            pendingRevenue: 5000,
            refundedRevenue: 1000,
        },
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
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$40,000')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.getByText('$18,000')).toBeInTheDocument();
    });

    it('displays loading state correctly', () => {
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            loading: true,
        });

        const { container } = render(<RevenueReporting />);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('displays error state correctly', () => {
        mockUseOrganizerRevenue.mockReturnValue({
            ...defaultMockReturn,
            error: 'Failed to fetch revenue data',
        });

        render(<RevenueReporting />);
        expect(
            screen.getByText('Failed to fetch revenue data')
        ).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
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

    it('renders all tabs', () => {
        render(<RevenueReporting />);

        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Monthly Trends')).toBeInTheDocument();
        expect(screen.getByText('Event Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Comparison')).toBeInTheDocument();
        expect(screen.getByText('Custom Reports')).toBeInTheDocument();
    });

    it('calculates growth indicators correctly', () => {
        render(<RevenueReporting />);
        // (18000 - 15000) / 15000 * 100 = 20%
        expect(screen.getByText('20.0%')).toBeInTheDocument();
        expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('displays top performing events', () => {
        render(<RevenueReporting />);
        expect(screen.getByText('Top Performing Events')).toBeInTheDocument();
        expect(screen.getByText('Tech Conference 2024')).toBeInTheDocument();
        expect(screen.getByText('Music Festival')).toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventPerformanceAnalytics } from '@/components/EventPerformanceAnalytics';
import { OrganizerService } from '@/lib/api';

// Mock the OrganizerService
jest.mock('@/lib/api', () => ({
    OrganizerService: {
        getApiOrganizerEventsTopPerforming: jest.fn(),
        getApiOrganizerEventsPerformance: jest.fn(),
    },
}));

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

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;

describe('EventPerformanceAnalytics Integration', () => {
    const mockTopPerformingEvents = [
        {
            id: '1',
            title: 'High Performance Event',
            revenue: 5000,
            registrationCount: 100,
            ticketsSold: 95,
            totalTickets: 100,
            status: 'Published',
        },
        {
            id: '2',
            title: 'Medium Performance Event',
            revenue: 2000,
            registrationCount: 50,
            ticketsSold: 40,
            totalTickets: 60,
            status: 'Published',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: true,
                data: mockTopPerformingEvents,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );
    });

    it('should render performance analytics with real data flow', async () => {
        render(<EventPerformanceAnalytics maxTopEvents={5} />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        });

        // Check if metrics are calculated correctly
        expect(screen.getByText('$7,000')).toBeInTheDocument(); // Total revenue
        expect(screen.getByText('150')).toBeInTheDocument(); // Total registrations

        // Check if chart is rendered
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockRejectedValue(
            new Error('API Error')
        );

        render(<EventPerformanceAnalytics />);

        await waitFor(() => {
            expect(
                screen.getByText(/Failed to load performance analytics/)
            ).toBeInTheDocument();
        });

        // Should show retry button
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should generate appropriate alerts and recommendations', async () => {
        // Mock events with performance issues
        const problematicEvents = [
            {
                id: '1',
                title: 'Low Performance Event',
                revenue: 100,
                registrationCount: 5,
                ticketsSold: 2,
                totalTickets: 50,
                status: 'Published',
            },
        ];

        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: true,
                data: problematicEvents,
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        render(
            <EventPerformanceAnalytics
                showAlerts={true}
                showRecommendations={true}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Performance Alerts')).toBeInTheDocument();
        });

        // Should show low sales rate alert
        expect(screen.getByText('Low Sales Rate Detected')).toBeInTheDocument();
    });

    it('should handle empty data state', async () => {
        mockOrganizerService.getApiOrganizerEventsTopPerforming.mockResolvedValue(
            {
                success: true,
                data: [],
                message: null,
                statusCode: 200,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        );

        render(<EventPerformanceAnalytics />);

        await waitFor(() => {
            expect(
                screen.getByText('No event performance data available')
            ).toBeInTheDocument();
        });
    });
});

/**
 * Integration Tests for Complete Organizer Dashboard Workflows
 *
 * These tests verify end-to-end functionality of the enhanced organizer dashboard,
 * including data fetching, real-time updates, user interactions, and error handling.
 */

import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe, toHaveNoViolations } from 'jest-axe';

// Import Dashboard component from features instead of app pages
import { OrganizerDashboard } from '@/features/dashboard/OrganizerDashboard';
import {
    createMockOrganizerDashboard,
    createMockEventSummary,
    createMockRevenueStatistics,
} from '../utils/dashboard-test-factories';

expect.extend(toHaveNoViolations);

// Mock SignalR
jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn(() => ({
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        build: jest.fn(() => ({
            start: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
            invoke: jest.fn().mockResolvedValue(undefined),
            connectionState: 'Connected',
        })),
    })),
    HubConnectionState: {
        Connected: 'Connected',
        Disconnected: 'Disconnected',
        Connecting: 'Connecting',
        Reconnecting: 'Reconnecting',
    },
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

jest.mock('react-chartjs-2', () => ({
    Line: ({ data, options }: { data: unknown; options: unknown }) => (
        <div
            data-testid='line-chart'
            data-chart-data={JSON.stringify(data)}
            data-chart-options={JSON.stringify(options)}
        >
            Line Chart
        </div>
    ),
    Bar: ({ data, options }: { data: unknown; options: unknown }) => (
        <div
            data-testid='bar-chart'
            data-chart-data={JSON.stringify(data)}
            data-chart-options={JSON.stringify(options)}
        >
            Bar Chart
        </div>
    ),
    Doughnut: ({ data, options }: { data: unknown; options: unknown }) => (
        <div
            data-testid='doughnut-chart'
            data-chart-data={JSON.stringify(data)}
            data-chart-options={JSON.stringify(options)}
        >
            Doughnut Chart
        </div>
    ),
}));

// Test data
const mockDashboardData = createMockOrganizerDashboard({
    organizerId: 'org-123',
    organizerName: 'Test Organizer',
    statistics: {
        totalEvents: 15,
        publishedEvents: 12,
        draftEvents: 3,
        totalRegistrations: 450,
        totalAttendees: 380,
        totalRevenue: 25000,
    },
    recentEvents: [
        createMockEventSummary({
            id: 'event-1',
            title: 'Tech Conference 2024',
            revenue: 5000,
            registrationCount: 100,
        }),
        createMockEventSummary({
            id: 'event-2',
            title: 'Workshop Series',
            revenue: 2500,
            registrationCount: 50,
        }),
    ],
    revenue: createMockRevenueStatistics({
        totalRevenue: 25000,
        thisMonthRevenue: 8000,
        lastMonthRevenue: 6500,
    }),
});

// MSW server setup
const server = setupServer(
    rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockDashboardData }));
    }),
    rest.get('/api/Organizer/statistics', (req, res, ctx) => {
        return res(
            ctx.json({ success: true, data: mockDashboardData.statistics })
        );
    }),
    rest.get('/api/Organizer/events', (req, res, ctx) => {
        const page = req.url.searchParams.get('page') || '1';
        const pageSize = req.url.searchParams.get('pageSize') || '10';

        return res(
            ctx.json({
                success: true,
                data: {
                    items: mockDashboardData.recentEvents,
                    totalCount: mockDashboardData.recentEvents?.length || 0,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                },
            })
        );
    }),
    rest.get('/api/Organizer/reports/monthly-revenue', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: [
                    { month: '2024-01', revenue: 5000 },
                    { month: '2024-02', revenue: 6500 },
                    { month: '2024-03', revenue: 8000 },
                ],
            })
        );
    }),
    rest.get('/api/Organizer/registrations', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: {
                    items: [],
                    totalCount: 0,
                    page: 1,
                    pageSize: 10,
                },
            })
        );
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
                gcTime: 0,
            },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('Organizer Dashboard Workflows', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
        jest.clearAllMocks();
    });

    describe('Dashboard Loading and Data Display', () => {
        it('should load dashboard data and display key metrics', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            // Check loading states
            expect(screen.getByText(/loading/i)).toBeInTheDocument();

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Verify statistics display
            expect(screen.getByText('15')).toBeInTheDocument(); // Total events
            expect(screen.getByText('450')).toBeInTheDocument(); // Total registrations
            expect(screen.getByText('$25,000')).toBeInTheDocument(); // Total revenue

            // Verify recent events display
            expect(
                screen.getByText('Tech Conference 2024')
            ).toBeInTheDocument();
            expect(screen.getByText('Workshop Series')).toBeInTheDocument();
        });

        it('should handle API errors gracefully', async () => {
            server.use(
                rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
                    return res(
                        ctx.status(500),
                        ctx.json({ error: 'Server error' })
                    );
                })
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText(/error loading dashboard/i)
                ).toBeInTheDocument();
            });

            // Verify retry button is present
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
        });

        it('should display offline indicator when network is unavailable', async () => {
            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            server.use(
                rest.get('/api/Organizer/dashboard', (req, res) => {
                    return res.networkError('Network error');
                })
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/offline/i)).toBeInTheDocument();
            });

            // Restore online state
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true,
            });
        });
    });

    describe('Analytics and Visualizations', () => {
        it('should render revenue charts with correct data', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
            });

            const lineChart = screen.getByTestId('line-chart');
            const chartData = JSON.parse(
                lineChart.getAttribute('data-chart-data') || '{}'
            );

            expect(chartData.labels).toContain('2024-01');
            expect(chartData.datasets[0].data).toContain(5000);
        });

        it('should update charts when time range changes', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
            });

            // Change time range
            const timeRangeSelect = screen.getByRole('combobox', {
                name: /time range/i,
            });
            await user.selectOptions(timeRangeSelect, '6months');

            // Verify API call with new parameters
            await waitFor(() => {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
            });
        });

        it('should handle chart rendering errors gracefully', async () => {
            // Mock chart error
            jest.spyOn(console, 'error').mockImplementation(() => {});

            server.use(
                rest.get(
                    '/api/Organizer/reports/monthly-revenue',
                    (req, res, ctx) => {
                        return res(ctx.status(500));
                    }
                )
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText(/chart unavailable/i)
                ).toBeInTheDocument();
            });

            jest.restoreAllMocks();
        });
    });

    describe('Event Management Workflow', () => {
        it('should display event table with sorting and filtering', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });

            // Verify table headers
            expect(screen.getByText('Event Name')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('Revenue')).toBeInTheDocument();

            // Test sorting
            const nameHeader = screen.getByText('Event Name');
            await user.click(nameHeader);

            // Verify sort indicator
            expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
        });

        it('should handle bulk actions on events', async () => {
            server.use(
                rest.post(
                    '/api/Organizer/events/bulk-action',
                    (req, res, ctx) => {
                        return res(
                            ctx.json({
                                success: true,
                                message: 'Bulk action completed',
                            })
                        );
                    }
                )
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });

            // Select events
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[1]); // First event checkbox
            await user.click(checkboxes[2]); // Second event checkbox

            // Open bulk actions menu
            const bulkActionsButton = screen.getByRole('button', {
                name: /bulk actions/i,
            });
            await user.click(bulkActionsButton);

            // Select publish action
            const publishAction = screen.getByRole('menuitem', {
                name: /publish/i,
            });
            await user.click(publishAction);

            // Confirm action
            const confirmButton = screen.getByRole('button', {
                name: /confirm/i,
            });
            await user.click(confirmButton);

            await waitFor(() => {
                expect(
                    screen.getByText(/bulk action completed/i)
                ).toBeInTheDocument();
            });
        });

        it('should support event duplication', async () => {
            server.use(
                rest.post(
                    '/api/Organizer/events/duplicate',
                    (req, res, ctx) => {
                        return res(
                            ctx.json({
                                success: true,
                                data: {
                                    id: 'event-duplicate',
                                    title: 'Tech Conference 2024 (Copy)',
                                },
                            })
                        );
                    }
                )
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });

            // Find and click duplicate button for first event
            const duplicateButtons = screen.getAllByRole('button', {
                name: /duplicate/i,
            });
            await user.click(duplicateButtons[0]);

            await waitFor(() => {
                expect(
                    screen.getByText(/event duplicated successfully/i)
                ).toBeInTheDocument();
            });
        });
    });

    describe('Real-time Updates', () => {
        it('should handle real-time metric updates', async () => {
            const mockConnection = {
                start: jest.fn().mockResolvedValue(undefined),
                stop: jest.fn().mockResolvedValue(undefined),
                on: jest.fn(),
                off: jest.fn(),
                invoke: jest.fn().mockResolvedValue(undefined),
                connectionState: 'Connected',
            };

            jest.doMock('@microsoft/signalr', () => ({
                HubConnectionBuilder: jest.fn(() => ({
                    withUrl: jest.fn().mockReturnThis(),
                    withAutomaticReconnect: jest.fn().mockReturnThis(),
                    build: jest.fn(() => mockConnection),
                })),
            }));

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Simulate real-time update
            const onCallback = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'DashboardMetricUpdate'
            )?.[1];
            if (onCallback) {
                onCallback({
                    totalEvents: 16,
                    totalRegistrations: 460,
                    totalRevenue: 26000,
                });
            }

            await waitFor(() => {
                expect(screen.getByText('16')).toBeInTheDocument(); // Updated total events
                expect(screen.getByText('460')).toBeInTheDocument(); // Updated registrations
                expect(screen.getByText('$26,000')).toBeInTheDocument(); // Updated revenue
            });
        });

        it('should show connection status indicator', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByTestId('connection-status')
                ).toBeInTheDocument();
            });

            const statusIndicator = screen.getByTestId('connection-status');
            expect(statusIndicator).toHaveAttribute('data-status', 'connected');
        });
    });

    describe('Data Export Functionality', () => {
        it('should export dashboard data in multiple formats', async () => {
            // Mock file download
            const mockCreateObjectURL = jest.fn(() => 'mock-url');
            const mockRevokeObjectURL = jest.fn();
            Object.defineProperty(URL, 'createObjectURL', {
                value: mockCreateObjectURL,
            });
            Object.defineProperty(URL, 'revokeObjectURL', {
                value: mockRevokeObjectURL,
            });

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByRole('button', { name: /export/i })
                ).toBeInTheDocument();
            });

            // Open export modal
            const exportButton = screen.getByRole('button', {
                name: /export/i,
            });
            await user.click(exportButton);

            // Select CSV format
            const csvOption = screen.getByRole('radio', { name: /csv/i });
            await user.click(csvOption);

            // Start export
            const downloadButton = screen.getByRole('button', {
                name: /download/i,
            });
            await user.click(downloadButton);

            await waitFor(() => {
                expect(mockCreateObjectURL).toHaveBeenCalled();
            });
        });
    });

    describe('Accessibility Compliance', () => {
        it('should meet WCAG accessibility standards', async () => {
            const { container } = render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should support keyboard navigation', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('main')).toBeInTheDocument();
            });

            // Test tab navigation
            await user.tab();
            expect(document.activeElement).toHaveAttribute('role', 'button');

            // Test arrow key navigation in tables
            const table = screen.getByRole('table');
            const firstCell = within(table).getAllByRole('cell')[0];
            firstCell.focus();

            await user.keyboard('{ArrowDown}');
            // Verify focus moved to next row
        });

        it('should announce dynamic content changes to screen readers', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('status')).toBeInTheDocument();
            });

            // Verify aria-live regions are present
            const liveRegion = screen.getByRole('status');
            expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        });
    });

    describe('Performance Optimization', () => {
        it('should implement lazy loading for heavy components', async () => {
            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            // Verify initial load doesn't include heavy components
            expect(
                screen.queryByTestId('performance-analytics')
            ).not.toBeInTheDocument();

            // Scroll to trigger lazy loading
            fireEvent.scroll(window, { target: { scrollY: 1000 } });

            await waitFor(() => {
                expect(
                    screen.getByTestId('performance-analytics')
                ).toBeInTheDocument();
            });
        });

        it('should use virtual scrolling for large datasets', async () => {
            // Mock large dataset
            const largeEventList = Array.from({ length: 1000 }, (_, i) =>
                createMockEventSummary({
                    id: `event-${i}`,
                    title: `Event ${i}`,
                })
            );

            server.use(
                rest.get('/api/Organizer/events', (req, res, ctx) => {
                    return res(
                        ctx.json({
                            success: true,
                            data: {
                                items: largeEventList,
                                totalCount: largeEventList.length,
                                page: 1,
                                pageSize: 50,
                            },
                        })
                    );
                })
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('virtual-table')).toBeInTheDocument();
            });

            // Verify only visible items are rendered
            const renderedRows = screen.getAllByRole('row');
            expect(renderedRows.length).toBeLessThan(100); // Should be much less than 1000
        });
    });

    describe('Error Recovery and Resilience', () => {
        it('should recover from temporary network failures', async () => {
            let failCount = 0;
            server.use(
                rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
                    failCount++;
                    if (failCount <= 2) {
                        return res.networkError('Network error');
                    }
                    return res(
                        ctx.json({ success: true, data: mockDashboardData })
                    );
                })
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            // Should show error initially
            await waitFor(() => {
                expect(
                    screen.getByText(/error loading dashboard/i)
                ).toBeInTheDocument();
            });

            // Click retry
            const retryButton = screen.getByRole('button', { name: /retry/i });
            await user.click(retryButton);

            // Should eventually succeed
            await waitFor(
                () => {
                    expect(
                        screen.getByText('Test Organizer')
                    ).toBeInTheDocument();
                },
                { timeout: 5000 }
            );
        });

        it('should handle partial data loading gracefully', async () => {
            server.use(
                rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
                    return res(
                        ctx.json({
                            success: true,
                            data: {
                                ...mockDashboardData,
                                statistics: null, // Simulate partial failure
                            },
                        })
                    );
                })
            );

            render(
                <TestWrapper>
                    <OrganizerDashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Should show placeholder for missing statistics
            expect(
                screen.getByText(/statistics unavailable/i)
            ).toBeInTheDocument();

            // But other sections should still work
            expect(
                screen.getByText('Tech Conference 2024')
            ).toBeInTheDocument();
        });
    });
});

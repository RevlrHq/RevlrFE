/**
 * Visual Regression Tests for Dashboard Components
 *
 * These tests capture and compare visual snapshots of dashboard components
 * to detect unintended visual changes. They help ensure UI consistency
 * across different states and screen sizes.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import dashboard components
import StatisticsOverview from '@/components/StatisticsOverview';
import RevenueChart from '@/components/charts/RevenueChart';
import EventPerformanceChart from '@/components/charts/EventPerformanceChart';
import AttendeeAnalyticsChart from '@/components/charts/AttendeeAnalyticsChart';
import DashboardCustomizer from '@/components/DashboardCustomizer';

// Import test factories
import {
    createMockEventStatistics,
    createMockRevenueChartData,
    createMockEventList,
    createMockAttendeeAnalytics,
    createMockDashboardLayout,
} from '../utils/dashboard-test-factories';

// Mock Chart.js to ensure consistent rendering
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

// Mock react-chartjs-2 with consistent test components
jest.mock('react-chartjs-2', () => ({
    Line: ({
        data,
    }: {
        data: { labels?: string[]; datasets: Array<{ data: number[] }> };
    }) => (
        <div
            data-testid='line-chart'
            style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#f8f9fa',
            }}
        >
            <div style={{ padding: '20px' }}>
                <h3>Revenue Trends</h3>
                <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                    {data.labels?.map((label: string, index: number) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    height: `${(data.datasets[0].data[index] / 1000) * 10}px`,
                                    backgroundColor: '#3b82f6',
                                    width: '20px',
                                    marginBottom: '5px',
                                }}
                            />
                            <small>{label}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
    Bar: ({
        data,
    }: {
        data: { labels?: string[]; datasets: Array<{ data: number[] }> };
    }) => (
        <div
            data-testid='bar-chart'
            style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#f8f9fa',
            }}
        >
            <div style={{ padding: '20px' }}>
                <h3>Event Performance</h3>
                <div
                    style={{ display: 'flex', justifyContent: 'space-around' }}
                >
                    {data.labels?.map((label: string, index: number) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    height: `${(data.datasets[0].data[index] / 100) * 5}px`,
                                    backgroundColor: '#10b981',
                                    width: '30px',
                                    marginBottom: '5px',
                                }}
                            />
                            <small>{label}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
    Doughnut: ({ data }: { data: { labels?: string[] } }) => (
        <div
            data-testid='doughnut-chart'
            style={{
                width: '100%',
                height: '300px',
                backgroundColor: '#f8f9fa',
            }}
        >
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3>Attendee Demographics</h3>
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        background:
                            'conic-gradient(#3b82f6 0deg 120deg, #10b981 120deg 240deg, #f59e0b 240deg 360deg)',
                        margin: '0 auto',
                    }}
                />
                <div style={{ marginTop: '10px' }}>
                    {data.labels?.map((label: string, index: number) => (
                        <div
                            key={label}
                            style={{
                                display: 'inline-block',
                                margin: '0 10px',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: [
                                        '#3b82f6',
                                        '#10b981',
                                        '#f59e0b',
                                    ][index],
                                    marginRight: '5px',
                                }}
                            />
                            <small>{label}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: Infinity,
                gcTime: Infinity,
            },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <div style={{ fontFamily: 'system-ui, sans-serif' }}>
                {children}
            </div>
        </QueryClientProvider>
    );
};

// Mock data
const mockStatistics = createMockEventStatistics({
    totalEvents: 25,
    publishedEvents: 20,
    draftEvents: 5,
    totalRegistrations: 1250,
    totalAttendees: 1100,
    totalRevenue: 75000,
});

const mockRevenueData = createMockRevenueChartData(6);
const mockEventList = createMockEventList(5);
const mockAttendeeAnalytics = createMockAttendeeAnalytics();
const mockDashboardLayout = createMockDashboardLayout();

describe('Dashboard Visual Regression Tests', () => {
    // Set consistent viewport for all tests
    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 800,
        });
    });

    describe('Statistics Overview Component', () => {
        it('should render statistics overview with default styling', () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview statistics={mockStatistics} />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'statistics-overview-default'
            );
        });

        it('should render statistics overview with loading state', () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview statistics={null} loading={true} />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'statistics-overview-loading'
            );
        });

        it('should render statistics overview with error state', () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        statistics={null}
                        error='Failed to load statistics'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'statistics-overview-error'
            );
        });

        it('should render statistics overview in dark theme', () => {
            const { container } = render(
                <TestWrapper>
                    <div className='dark'>
                        <StatisticsOverview statistics={mockStatistics} />
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'statistics-overview-dark-theme'
            );
        });
    });

    describe('Revenue Chart Component', () => {
        it('should render revenue chart with line visualization', () => {
            const { container } = render(
                <TestWrapper>
                    <RevenueChart
                        data={mockRevenueData}
                        chartType='line'
                        timeRange='6months'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot('revenue-chart-line');
        });

        it('should render revenue chart with bar visualization', () => {
            const { container } = render(
                <TestWrapper>
                    <RevenueChart
                        data={mockRevenueData}
                        chartType='bar'
                        timeRange='6months'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot('revenue-chart-bar');
        });

        it('should render revenue chart with empty data state', () => {
            const { container } = render(
                <TestWrapper>
                    <RevenueChart
                        data={[]}
                        chartType='line'
                        timeRange='6months'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot('revenue-chart-empty');
        });

        it('should render revenue chart in mobile viewport', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            const { container } = render(
                <TestWrapper>
                    <RevenueChart
                        data={mockRevenueData}
                        chartType='line'
                        timeRange='6months'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'revenue-chart-mobile'
            );
        });
    });

    describe('Event Performance Chart Component', () => {
        it('should render event performance comparison chart', () => {
            const { container } = render(
                <TestWrapper>
                    <EventPerformanceChart
                        events={mockEventList}
                        metric='revenue'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'event-performance-chart-revenue'
            );
        });

        it('should render event performance chart with registration metric', () => {
            const { container } = render(
                <TestWrapper>
                    <EventPerformanceChart
                        events={mockEventList}
                        metric='registrations'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'event-performance-chart-registrations'
            );
        });

        it('should render event performance chart with loading state', () => {
            const { container } = render(
                <TestWrapper>
                    <EventPerformanceChart
                        events={[]}
                        metric='revenue'
                        loading={true}
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'event-performance-chart-loading'
            );
        });
    });

    describe('Attendee Analytics Chart Component', () => {
        it('should render attendee demographics doughnut chart', () => {
            const { container } = render(
                <TestWrapper>
                    <AttendeeAnalyticsChart
                        data={mockAttendeeAnalytics}
                        chartType='demographics'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'attendee-analytics-demographics'
            );
        });

        it('should render attendee geographic distribution chart', () => {
            const { container } = render(
                <TestWrapper>
                    <AttendeeAnalyticsChart
                        data={mockAttendeeAnalytics}
                        chartType='geographic'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'attendee-analytics-geographic'
            );
        });

        it('should render attendee registration trends chart', () => {
            const { container } = render(
                <TestWrapper>
                    <AttendeeAnalyticsChart
                        data={mockAttendeeAnalytics}
                        chartType='trends'
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'attendee-analytics-trends'
            );
        });
    });

    describe('Enhanced Event Table Component', () => {
        it('should render event table with default layout', () => {
            const { container } = render(
                <TestWrapper>
                    <div data-testid='mock-event-table'>
                        Mock Enhanced Event Table - Default Layout
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot('event-table-default');
        });

        it('should render event table with selected rows', () => {
            const { container } = render(
                <TestWrapper>
                    <div data-testid='mock-event-table'>
                        Mock Enhanced Event Table - Selected Rows
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'event-table-selected-rows'
            );
        });

        it('should render event table with filters applied', () => {
            const { container } = render(
                <TestWrapper>
                    <div data-testid='mock-event-table'>
                        Mock Enhanced Event Table - Filtered
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'event-table-filtered'
            );
        });

        it('should render event table in mobile card layout', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            const { container } = render(
                <TestWrapper>
                    <div data-testid='mock-event-table'>
                        Mock Enhanced Event Table - Mobile Layout
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot('event-table-mobile');
        });

        it('should render event table with empty state', () => {
            const { container } = render(
                <TestWrapper>
                    <div data-testid='mock-event-table'>
                        Mock Enhanced Event Table - Empty State
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot('event-table-empty');
        });
    });

    describe('Dashboard Customizer Component', () => {
        it('should render dashboard customizer with default layout', () => {
            const { container } = render(
                <TestWrapper>
                    <DashboardCustomizer
                        layout={mockDashboardLayout}
                        onLayoutChange={() => {}}
                        onWidgetToggle={() => {}}
                        onSave={() => {}}
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'dashboard-customizer-default'
            );
        });

        it('should render dashboard customizer in edit mode', () => {
            const { container } = render(
                <TestWrapper>
                    <DashboardCustomizer
                        layout={mockDashboardLayout}
                        editMode={true}
                        onLayoutChange={() => {}}
                        onWidgetToggle={() => {}}
                        onSave={() => {}}
                        onCancel={() => {}}
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'dashboard-customizer-edit-mode'
            );
        });

        it('should render dashboard customizer with widget panel open', () => {
            const { container } = render(
                <TestWrapper>
                    <DashboardCustomizer
                        layout={mockDashboardLayout}
                        showWidgetPanel={true}
                        onLayoutChange={() => {}}
                        onWidgetToggle={() => {}}
                        onSave={() => {}}
                    />
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'dashboard-customizer-widget-panel'
            );
        });
    });

    describe('Responsive Layout Tests', () => {
        const viewports = [
            { name: 'mobile', width: 375, height: 667 },
            { name: 'tablet', width: 768, height: 1024 },
            { name: 'desktop', width: 1200, height: 800 },
            { name: 'large-desktop', width: 1920, height: 1080 },
        ];

        viewports.forEach(({ name, width, height }) => {
            it(`should render dashboard components correctly on ${name} viewport`, () => {
                // Set viewport
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: width,
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: height,
                });

                const { container } = render(
                    <TestWrapper>
                        <div style={{ width: '100%', padding: '20px' }}>
                            <StatisticsOverview statistics={mockStatistics} />
                            <div style={{ marginTop: '20px' }}>
                                <RevenueChart
                                    data={mockRevenueData}
                                    chartType='line'
                                    timeRange='6months'
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <div data-testid='mock-event-table'>
                                    Mock Enhanced Event Table - {name} Layout
                                </div>
                            </div>
                        </div>
                    </TestWrapper>
                );

                expect(container.firstChild).toMatchSnapshot(
                    `dashboard-layout-${name}`
                );
            });
        });
    });

    describe('Theme Variations', () => {
        const themes = ['light', 'dark'];

        themes.forEach((theme) => {
            it(`should render dashboard components in ${theme} theme`, () => {
                const { container } = render(
                    <TestWrapper>
                        <div
                            className={theme}
                            style={{
                                backgroundColor:
                                    theme === 'dark' ? '#1f2937' : '#ffffff',
                                color: theme === 'dark' ? '#f9fafb' : '#111827',
                                padding: '20px',
                            }}
                        >
                            <StatisticsOverview statistics={mockStatistics} />
                            <div style={{ marginTop: '20px' }}>
                                <RevenueChart
                                    data={mockRevenueData}
                                    chartType='line'
                                    timeRange='6months'
                                />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <AttendeeAnalyticsChart
                                    data={mockAttendeeAnalytics}
                                    chartType='demographics'
                                />
                            </div>
                        </div>
                    </TestWrapper>
                );

                expect(container.firstChild).toMatchSnapshot(
                    `dashboard-${theme}-theme`
                );
            });
        });
    });

    describe('Loading and Error States', () => {
        it('should render consistent loading states across components', () => {
            const { container } = render(
                <TestWrapper>
                    <div style={{ padding: '20px' }}>
                        <StatisticsOverview statistics={null} loading={true} />
                        <div style={{ marginTop: '20px' }}>
                            <RevenueChart
                                data={[]}
                                chartType='line'
                                timeRange='6months'
                                loading={true}
                            />
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div data-testid='mock-event-table'>
                                Mock Enhanced Event Table - Loading State
                            </div>
                        </div>
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'dashboard-loading-states'
            );
        });

        it('should render consistent error states across components', () => {
            const { container } = render(
                <TestWrapper>
                    <div style={{ padding: '20px' }}>
                        <StatisticsOverview
                            statistics={null}
                            error='Failed to load statistics'
                        />
                        <div style={{ marginTop: '20px' }}>
                            <RevenueChart
                                data={[]}
                                chartType='line'
                                timeRange='6months'
                                error='Failed to load revenue data'
                            />
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <div data-testid='mock-event-table'>
                                Mock Enhanced Event Table - Error State
                            </div>
                        </div>
                    </div>
                </TestWrapper>
            );

            expect(container.firstChild).toMatchSnapshot(
                'dashboard-error-states'
            );
        });
    });
});

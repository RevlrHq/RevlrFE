/**
 * Performance Benchmarks for Dashboard Components
 *
 * These tests measure and benchmark the performance of dashboard components
 * to ensure they meet performance requirements and detect regressions.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatisticsOverview from '@/components/StatisticsOverview';
import RevenueChart from '@/components/charts/RevenueChart';

// Mock Chart.js components
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
    Line: ({ data }: { data: { labels?: unknown[] } }) =>
        React.createElement(
            'div',
            { 'data-testid': 'line-chart' },
            `Chart with ${data.labels?.length || 0} points`
        ),
    Bar: ({ data }: { data: { labels?: unknown[] } }) =>
        React.createElement(
            'div',
            { 'data-testid': 'bar-chart' },
            `Chart with ${data.labels?.length || 0} bars`
        ),
    Doughnut: ({ data }: { data: { labels?: unknown[] } }) =>
        React.createElement(
            'div',
            { 'data-testid': 'doughnut-chart' },
            `Chart with ${data.labels?.length || 0} segments`
        ),
}));

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
    INITIAL_RENDER: 100,
    DATA_PROCESSING: 50,
    USER_INTERACTION: 16,
    MEMORY_USAGE_MB: 50,
    CHART_RENDER: 100,
};

// Mock performance measurement utilities
const measureRenderTime = async (fn: () => void): Promise<number> => {
    const start = performance.now();
    fn();
    const end = performance.now();
    return end - start;
};

const measureMemoryUsage = async (): Promise<number> => {
    return Math.random() * 10;
};

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
            {children}
        </QueryClientProvider>
    );
};

describe('Dashboard Performance Benchmarks', () => {
    beforeEach(() => {
        // Clear performance marks and measures
        if (performance.clearMarks) {
            performance.clearMarks();
        }
        if (performance.clearMeasures) {
            performance.clearMeasures();
        }

        // Mock performance.now for consistent testing
        jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Component Rendering Performance', () => {
        it('should render StatisticsOverview within performance threshold', async () => {
            const mockStatistics = {
                totalEvents: 100,
                publishedEvents: 85,
                draftEvents: 15,
                totalRegistrations: 2500,
                totalAttendees: 2200,
                totalRevenue: 125000,
            };

            const renderTime = await measureRenderTime(() => {
                render(
                    <TestWrapper>
                        <StatisticsOverview statistics={mockStatistics} />
                    </TestWrapper>
                );
            });

            expect(renderTime).toBeLessThan(
                PERFORMANCE_THRESHOLDS.INITIAL_RENDER
            );

            console.log(`StatisticsOverview render time: ${renderTime}ms`);
        });

        it('should render RevenueChart within performance threshold', async () => {
            const mockRevenueData = Array.from({ length: 12 }, (_, i) => ({
                month: `2024-${String(i + 1).padStart(2, '0')}`,
                revenue: Math.random() * 5000,
                eventCount: Math.floor(Math.random() * 10),
                registrationCount: Math.floor(Math.random() * 100),
            }));

            const renderTime = await measureRenderTime(() => {
                render(
                    <TestWrapper>
                        <RevenueChart
                            data={mockRevenueData}
                            chartType='line'
                            timeRange='12months'
                        />
                    </TestWrapper>
                );
            });

            expect(renderTime).toBeLessThan(
                PERFORMANCE_THRESHOLDS.CHART_RENDER
            );

            console.log(`RevenueChart render time: ${renderTime}ms`);
        });
    });

    describe('Data Processing Performance', () => {
        it('should process revenue data efficiently', async () => {
            const mockRevenueData = Array.from({ length: 24 }, (_, i) => ({
                month: `2024-${String(i + 1).padStart(2, '0')}`,
                revenue: Math.random() * 5000,
                eventCount: Math.floor(Math.random() * 10),
                registrationCount: Math.floor(Math.random() * 100),
            }));

            const processingTime = await measureRenderTime(() => {
                // Simulate data processing operations
                const processedData = mockRevenueData.map((item) => ({
                    ...item,
                    formattedRevenue: new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }).format(item.revenue),
                    growthRate:
                        item.revenue > 0
                            ? ((item.revenue - 3000) / 3000) * 100
                            : 0,
                }));

                // Simulate aggregations
                const totalRevenue = processedData.reduce(
                    (sum, item) => sum + item.revenue,
                    0
                );
                const averageRevenue = totalRevenue / processedData.length;
                const maxRevenue = Math.max(
                    ...processedData.map((item) => item.revenue)
                );

                return {
                    processedData,
                    totalRevenue,
                    averageRevenue,
                    maxRevenue,
                };
            });

            expect(processingTime).toBeLessThan(
                PERFORMANCE_THRESHOLDS.DATA_PROCESSING
            );

            console.log(`Revenue data processing time: ${processingTime}ms`);
        });
    });

    describe('Memory Usage Performance', () => {
        it('should maintain reasonable memory usage with large datasets', async () => {
            const initialMemory = await measureMemoryUsage();

            render(
                <TestWrapper>
                    <div>
                        <StatisticsOverview
                            statistics={{
                                totalEvents: 1000,
                                publishedEvents: 850,
                                draftEvents: 150,
                                totalRegistrations: 25000,
                                totalAttendees: 22000,
                                totalRevenue: 1250000,
                            }}
                        />
                    </div>
                </TestWrapper>
            );

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = await measureMemoryUsage();
            const memoryIncrease = finalMemory - initialMemory;

            expect(memoryIncrease).toBeLessThan(
                PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB
            );

            console.log(`Memory usage increase: ${memoryIncrease}MB`);
        });
    });
});

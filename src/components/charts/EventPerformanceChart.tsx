'use client';

import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { EventSummaryView } from '@/lib/api';
import {
    getBaseChartOptions,
    getChartColors,
    formatCurrency,
    formatNumber,
} from '@/lib/utils/chartConfig';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface EventPerformanceChartProps {
    data: EventSummaryView[];
    isDark?: boolean;
    height?: number;
    maxEvents?: number;
    metric?: 'revenue' | 'registrations' | 'both';
    className?: string;
}

export const EventPerformanceChart: React.FC<EventPerformanceChartProps> = ({
    data,
    isDark = false,
    height = 300,
    maxEvents = 10,
    metric = 'both',
    className = '',
}) => {
    const chartData = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return null;
        }

        const colors = getChartColors(isDark);

        // Sort events by revenue and take top N
        const sortedEvents = [...data]
            .filter((event) => event.revenue && event.revenue > 0)
            .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
            .slice(0, maxEvents);

        const labels = sortedEvents.map((event) => {
            const title = event.title || 'Untitled Event';
            return title.length > 20 ? `${title.substring(0, 20)}...` : title;
        });

        const revenueData = sortedEvents.map((event) => event.revenue || 0);
        const registrationData = sortedEvents.map(
            (event) => event.registrationCount || 0
        );

        const datasets = [];

        if (metric === 'revenue' || metric === 'both') {
            datasets.push({
                label: 'Revenue',
                data: revenueData,
                backgroundColor: colors.primary + '80', // 50% opacity
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            });
        }

        if (metric === 'registrations' || metric === 'both') {
            datasets.push({
                label: 'Registrations',
                data: registrationData,
                backgroundColor: colors.secondary + '80',
                borderColor: colors.secondary,
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
                yAxisID: metric === 'both' ? 'y1' : 'y',
            });
        }

        return {
            labels,
            datasets,
        };
    }, [data, isDark, maxEvents, metric]);

    const options = useMemo(() => {
        const baseOptions = getBaseChartOptions(isDark);

        return {
            ...baseOptions,
            indexAxis: 'y' as const, // Horizontal bar chart
            plugins: {
                ...baseOptions.plugins,
                title: {
                    display: true,
                    text: 'Top Performing Events',
                    color: getChartColors(isDark).foreground,
                    font: {
                        size: 16,
                        weight: '600',
                        family: 'Inter, sans-serif',
                    },
                    padding: {
                        bottom: 20,
                    },
                },
                tooltip: {
                    ...baseOptions.plugins?.tooltip,
                    callbacks: {
                        label: (context: {
                            dataset: { label?: string };
                            parsed: { x: number };
                        }) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.x;

                            if (label === 'Revenue') {
                                return `${label}: ${formatCurrency(value)}`;
                            }
                            return `${label}: ${formatNumber(value)}`;
                        },
                    },
                },
                legend: {
                    ...baseOptions.plugins?.legend,
                    display: metric === 'both',
                },
            },
            scales: {
                x: {
                    ...baseOptions.scales?.x,
                    type: 'linear' as const,
                    display: true,
                    position: 'bottom' as const,
                    title: {
                        display: true,
                        text:
                            metric === 'revenue'
                                ? 'Revenue ($)'
                                : metric === 'registrations'
                                  ? 'Registrations'
                                  : 'Revenue ($)',
                        color: getChartColors(isDark).muted,
                        font: {
                            size: 12,
                            weight: '500',
                        },
                    },
                    ticks: {
                        ...baseOptions.scales?.x?.ticks,
                        callback: function (value: number) {
                            if (metric === 'revenue' || metric === 'both') {
                                return formatCurrency(value);
                            }
                            return formatNumber(value);
                        },
                    },
                },
                y: {
                    ...baseOptions.scales?.y,
                    type: 'category' as const,
                    display: true,
                    position: 'left' as const,
                    ticks: {
                        ...baseOptions.scales?.y?.ticks,
                        maxRotation: 0,
                    },
                },
                ...(metric === 'both' && {
                    x1: {
                        type: 'linear' as const,
                        display: true,
                        position: 'top' as const,
                        title: {
                            display: true,
                            text: 'Registrations',
                            color: getChartColors(isDark).muted,
                            font: {
                                size: 12,
                                weight: '500',
                            },
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: getChartColors(isDark).muted,
                            font: {
                                size: 11,
                                family: 'Inter, sans-serif',
                            },
                            callback: function (value: number) {
                                return formatNumber(value);
                            },
                        },
                    },
                }),
            },
        };
    }, [isDark, metric]);

    if (!data || !Array.isArray(data) || data.length === 0 || !chartData) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border bg-card ${className}`}
                style={{ height }}
                role='img'
                aria-label='No event performance data available'
            >
                <div className='text-center'>
                    <div className='text-sm text-muted-foreground'>
                        No event performance data available
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border bg-card p-4 ${className}`}
            role='img'
            aria-label={`Event performance chart showing top ${Math.min(maxEvents, data.length)} events`}
        >
            <div style={{ height }}>
                <Bar
                    data={chartData}
                    options={options}
                    aria-label='Event performance horizontal bar chart'
                />
            </div>
        </div>
    );
};

export default EventPerformanceChart;

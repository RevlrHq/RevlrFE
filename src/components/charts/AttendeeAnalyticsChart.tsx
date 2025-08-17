'use client';

import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { AttendeeAnalyticsView } from '@/lib/api';
import {
    getBaseChartOptions,
    getChartColors,
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '@/lib/utils/chartConfig';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

interface AttendeeAnalyticsChartProps {
    data: AttendeeAnalyticsView;
    isDark?: boolean;
    height?: number;
    chartType?: 'doughnut' | 'bar';
    showSpending?: boolean;
    className?: string;
}

export const AttendeeAnalyticsChart: React.FC<AttendeeAnalyticsChartProps> = ({
    data,
    isDark = false,
    height = 300,
    chartType = 'doughnut',
    showSpending = false,
    className = '',
}) => {
    const chartData = useMemo(() => {
        if (!data) {
            return null;
        }

        const colors = getChartColors(isDark);
        const segments = data.attendeeSegments || [];

        if (segments.length === 0) {
            return null;
        }

        const labels = segments.map(
            (segment) => segment.segmentName || 'Unknown'
        );
        const counts = segments.map((segment) => segment.count || 0);
        segments.map((segment) => segment.percentage || 0);
        const spending = segments.map((segment) => segment.averageSpend || 0);

        // Generate colors for segments
        const backgroundColors = [
            colors.primary + '80',
            colors.secondary + '80',
            colors.tertiary + '80',
            colors.quaternary + '80',
            colors.quinary + '80',
        ];

        const borderColors = [
            colors.primary,
            colors.secondary,
            colors.tertiary,
            colors.quaternary,
            colors.quinary,
        ];

        if (chartType === 'doughnut') {
            return {
                labels,
                datasets: [
                    {
                        label: showSpending
                            ? 'Average Spend'
                            : 'Attendee Count',
                        data: showSpending ? spending : counts,
                        backgroundColor: backgroundColors.slice(
                            0,
                            segments.length
                        ),
                        borderColor: borderColors.slice(0, segments.length),
                        borderWidth: 2,
                        hoverBorderWidth: 3,
                    },
                ],
            };
        } else {
            // Bar chart
            const datasets = [
                {
                    label: 'Attendee Count',
                    data: counts,
                    backgroundColor: colors.primary + '80',
                    borderColor: colors.primary,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ];

            if (showSpending) {
                datasets.push({
                    label: 'Average Spend',
                    data: spending,
                    backgroundColor: colors.secondary + '80',
                    borderColor: colors.secondary,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                    yAxisID: 'y1',
                });
            }

            return {
                labels,
                datasets,
            };
        }
    }, [data, isDark, chartType, showSpending]);

    const options = useMemo(() => {
        const colors = getChartColors(isDark);

        if (chartType === 'doughnut') {
            return {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right' as const,
                        labels: {
                            color: colors.foreground,
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                family: 'Inter, sans-serif',
                            },
                        },
                    },
                    title: {
                        display: true,
                        text: showSpending
                            ? 'Attendee Spending by Segment'
                            : 'Attendee Distribution by Segment',
                        color: colors.foreground,
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
                        backgroundColor: colors.background,
                        titleColor: colors.foreground,
                        bodyColor: colors.foreground,
                        borderColor: colors.border,
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: (context: {
                                label?: string;
                                parsed: number;
                            }) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const segment =
                                    data.attendeeSegments?.[context.dataIndex];

                                if (showSpending) {
                                    return [
                                        `${label}: ${formatCurrency(value)}`,
                                        `Count: ${formatNumber(segment?.count || 0)}`,
                                        `Percentage: ${formatPercentage(segment?.percentage || 0)}`,
                                    ];
                                } else {
                                    return [
                                        `${label}: ${formatNumber(value)}`,
                                        `Percentage: ${formatPercentage(segment?.percentage || 0)}`,
                                        `Avg Spend: ${formatCurrency(segment?.averageSpend || 0)}`,
                                    ];
                                }
                            },
                        },
                    },
                },
                cutout: '60%', // Makes it a doughnut instead of pie
            };
        } else {
            // Bar chart options
            const baseOptions = getBaseChartOptions(isDark);

            return {
                ...baseOptions,
                plugins: {
                    ...baseOptions.plugins,
                    title: {
                        display: true,
                        text: 'Attendee Analytics by Segment',
                        color: colors.foreground,
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
                                parsed: { y: number };
                            }) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;

                                if (label === 'Average Spend') {
                                    return `${label}: ${formatCurrency(value)}`;
                                }
                                return `${label}: ${formatNumber(value)}`;
                            },
                        },
                    },
                    legend: {
                        ...baseOptions.plugins?.legend,
                        display: showSpending,
                    },
                },
                scales: {
                    ...baseOptions.scales,
                    y: {
                        ...baseOptions.scales?.y,
                        title: {
                            display: true,
                            text: 'Attendee Count',
                            color: colors.muted,
                            font: {
                                size: 12,
                                weight: '500',
                            },
                        },
                        ticks: {
                            ...baseOptions.scales?.y?.ticks,
                            callback: function (value: number) {
                                return formatNumber(value);
                            },
                        },
                    },
                    ...(showSpending && {
                        y1: {
                            type: 'linear' as const,
                            display: true,
                            position: 'right' as const,
                            title: {
                                display: true,
                                text: 'Average Spend ($)',
                                color: colors.muted,
                                font: {
                                    size: 12,
                                    weight: '500',
                                },
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                color: colors.muted,
                                font: {
                                    size: 11,
                                    family: 'Inter, sans-serif',
                                },
                                callback: function (value: number) {
                                    return formatCurrency(value);
                                },
                            },
                        },
                    }),
                },
            };
        }
    }, [isDark, chartType, showSpending, data]);

    if (!data || !data.attendeeSegments || data.attendeeSegments.length === 0) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border bg-card ${className}`}
                style={{ height }}
                role='img'
                aria-label='No attendee analytics data available'
            >
                <div className='text-center'>
                    <div className='text-sm text-muted-foreground'>
                        No attendee analytics data available
                    </div>
                </div>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border bg-card ${className}`}
                style={{ height }}
                role='img'
                aria-label='Unable to render chart data'
            >
                <div className='text-center'>
                    <div className='text-sm text-muted-foreground'>
                        Unable to render chart data
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border bg-card p-4 ${className}`}
            role='img'
            aria-label={`Attendee analytics ${chartType} chart showing ${data.attendeeSegments?.length || 0} segments`}
        >
            <div style={{ height }}>
                {chartType === 'doughnut' ? (
                    <Doughnut
                        data={chartData}
                        options={options}
                        aria-label='Attendee analytics doughnut chart'
                    />
                ) : (
                    <Bar
                        data={chartData}
                        options={options}
                        aria-label='Attendee analytics bar chart'
                    />
                )}
            </div>
        </div>
    );
};

export default AttendeeAnalyticsChart;

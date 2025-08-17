'use client';

import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MonthlyRevenue } from '@/lib/api';
import {
    getBaseChartOptions,
    getChartColors,
    formatCurrency,
    revenueTooltipFormatter,
} from '@/lib/utils/chartConfig';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface RevenueChartProps {
    data: MonthlyRevenue[];
    isDark?: boolean;
    height?: number;
    showEventCount?: boolean;
    className?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
    data,
    isDark = false,
    height = 300,
    showEventCount = false,
    className = '',
}) => {
    const chartData = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return null;
        }

        const colors = getChartColors(isDark);
        const labels = data.map(
            (item) => item.monthName || `${item.month}/${item.year}`
        );
        const revenueData = data.map((item) => item.revenue || 0);
        const eventCountData = data.map((item) => item.eventCount || 0);

        const datasets = [
            {
                label: 'Revenue',
                data: revenueData,
                borderColor: colors.primary,
                backgroundColor: colors.primary + '20', // 20% opacity
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors.primary,
                pointBorderColor: colors.background,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ];

        if (showEventCount) {
            datasets.push({
                label: 'Events',
                data: eventCountData,
                borderColor: colors.secondary,
                backgroundColor: colors.secondary + '20',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: colors.secondary,
                pointBorderColor: colors.background,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: 'y1',
            });
        }

        return {
            labels,
            datasets,
        };
    }, [data, isDark, showEventCount]);

    const options = useMemo(() => {
        const baseOptions = getBaseChartOptions(isDark);

        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                title: {
                    display: true,
                    text: 'Revenue Trends',
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
                        label: (context: any) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;

                            if (label === 'Revenue') {
                                return `${label}: ${formatCurrency(value)}`;
                            }
                            return `${label}: ${value}`;
                        },
                    },
                },
            },
            scales: {
                ...baseOptions.scales,
                y: {
                    ...baseOptions.scales?.y,
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                        display: true,
                        text: 'Revenue ($)',
                        color: getChartColors(isDark).muted,
                        font: {
                            size: 12,
                            weight: '500',
                        },
                    },
                    ticks: {
                        ...baseOptions.scales?.y?.ticks,
                        callback: function (value: any) {
                            return formatCurrency(value);
                        },
                    },
                },
                ...(showEventCount && {
                    y1: {
                        type: 'linear' as const,
                        display: true,
                        position: 'right' as const,
                        title: {
                            display: true,
                            text: 'Event Count',
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
                        },
                    },
                }),
            },
        };
    }, [isDark, showEventCount]);

    if (!data || !Array.isArray(data) || data.length === 0 || !chartData) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border bg-card ${className}`}
                style={{ height }}
                role='img'
                aria-label='No revenue data available'
            >
                <div className='text-center'>
                    <div className='text-sm text-muted-foreground'>
                        No revenue data available
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border bg-card p-4 ${className}`}
            role='img'
            aria-label={`Revenue chart showing ${data.length} months of data`}
        >
            <div style={{ height }}>
                <Line
                    data={chartData}
                    options={options}
                    aria-label='Revenue trends line chart'
                />
            </div>
        </div>
    );
};

export default RevenueChart;

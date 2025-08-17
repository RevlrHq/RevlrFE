'use client';

import React, { useMemo, useEffect, useState } from 'react';
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
} from '@/lib/utils/chartConfig';
import { useMobileOptimizations } from '@/hooks/useMobileOptimizations';
import ResponsiveChartContainer from '../ResponsiveChartContainer';

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
    enableFullscreen?: boolean;
    enableExport?: boolean;
    onExport?: () => void;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
    data,
    isDark = false,
    height = 300,
    showEventCount = false,
    className = '',
    enableFullscreen = true,
    enableExport = true,
    onExport,
}) => {
    const { isMobile, getResponsiveValue } = useMobileOptimizations();
    const [chartHeight, setChartHeight] = useState(height);

    // Adjust height for mobile
    useEffect(() => {
        const responsiveHeight = getResponsiveValue(
            Math.min(height, 250), // Mobile: max 250px
            Math.min(height, 350), // Tablet: max 350px
            height // Desktop: original height
        );
        setChartHeight(responsiveHeight);
    }, [height, getResponsiveValue]);
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                ...baseOptions.plugins,
                title: {
                    display: !isMobile, // Hide title on mobile to save space
                    text: 'Revenue Trends',
                    color: getChartColors(isDark).foreground,
                    font: {
                        size: isMobile ? 14 : 16,
                        weight: '600',
                        family: 'Inter, sans-serif',
                    },
                    padding: {
                        bottom: isMobile ? 10 : 20,
                    },
                },
                legend: {
                    display: true,
                    position: isMobile ? 'bottom' : 'top',
                    labels: {
                        usePointStyle: true,
                        padding: isMobile ? 10 : 20,
                        font: {
                            size: isMobile ? 12 : 14,
                        },
                    },
                },
                tooltip: {
                    ...baseOptions.plugins?.tooltip,
                    titleFont: {
                        size: isMobile ? 12 : 14,
                    },
                    bodyFont: {
                        size: isMobile ? 11 : 13,
                    },
                    callbacks: {
                        label: (context: {
                            dataset: { label?: string };
                            parsed: { y: number };
                        }) => {
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
                x: {
                    ...baseOptions.scales?.x,
                    ticks: {
                        ...baseOptions.scales?.x?.ticks,
                        maxRotation: isMobile ? 45 : 0,
                        minRotation: isMobile ? 45 : 0,
                        font: {
                            size: isMobile ? 10 : 12,
                        },
                    },
                },
                y: {
                    ...baseOptions.scales?.y,
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                        display: !isMobile, // Hide axis title on mobile
                        text: 'Revenue ($)',
                        color: getChartColors(isDark).muted,
                        font: {
                            size: isMobile ? 10 : 12,
                            weight: '500',
                        },
                    },
                    ticks: {
                        ...baseOptions.scales?.y?.ticks,
                        font: {
                            size: isMobile ? 10 : 12,
                        },
                        callback: function (value: number) {
                            return isMobile
                                ? formatCurrency(value).replace('₦', '₦')
                                : formatCurrency(value);
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
    }, [isDark, showEventCount, isMobile]);

    if (!data || !Array.isArray(data) || data.length === 0 || !chartData) {
        return (
            <div
                className={`flex items-center justify-center rounded-lg border bg-card ${className}`}
                style={{ height: chartHeight }}
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
        <ResponsiveChartContainer
            title='Revenue Trends'
            subtitle={`${data.length} months of data`}
            className={className}
            enableFullscreen={enableFullscreen}
            enableExport={enableExport}
            onExport={onExport}
            minHeight={isMobile ? 200 : 250}
            maxHeight={isMobile ? 400 : 600}
        >
            <div style={{ height: chartHeight }}>
                <Line
                    data={chartData}
                    options={options}
                    aria-label='Revenue trends line chart'
                />
            </div>
        </ResponsiveChartContainer>
    );
};

export default RevenueChart;

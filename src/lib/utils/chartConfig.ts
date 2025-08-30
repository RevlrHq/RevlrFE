import { ChartOptions } from 'chart.js';

export interface ChartColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    muted: string;
}

export function getChartColors(isDark: boolean): ChartColors {
    return {
        primary: isDark ? '#60a5fa' : '#3b82f6',
        secondary: isDark ? '#a78bfa' : '#8b5cf6',
        success: isDark ? '#4ade80' : '#22c55e',
        warning: isDark ? '#fbbf24' : '#f59e0b',
        error: isDark ? '#f87171' : '#ef4444',
        background: isDark ? '#1f2937' : '#ffffff',
        foreground: isDark ? '#f9fafb' : '#111827',
        muted: isDark ? '#9ca3af' : '#6b7280',
    };
}

export function getBaseChartOptions(
    isDark: boolean,
    isMobile: boolean = false
): ChartOptions {
    const colors = getChartColors(isDark);

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        plugins: {
            legend: {
                display: true,
                position: isMobile ? 'bottom' : 'top',
                labels: {
                    color: colors.foreground,
                    usePointStyle: true,
                    padding: isMobile ? 10 : 20,
                    font: {
                        size: isMobile ? 12 : 14,
                        family: 'Inter, sans-serif',
                    },
                },
            },
            tooltip: {
                backgroundColor: isDark ? '#374151' : '#ffffff',
                titleColor: colors.foreground,
                bodyColor: colors.foreground,
                borderColor: isDark ? '#4b5563' : '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                padding: isMobile ? 8 : 12,
                titleFont: {
                    size: isMobile ? 12 : 14,
                    weight: '600',
                    family: 'Inter, sans-serif',
                },
                bodyFont: {
                    size: isMobile ? 11 : 13,
                    family: 'Inter, sans-serif',
                },
                displayColors: true,
                usePointStyle: true,
            },
        },
        scales: {
            x: {
                grid: {
                    color: isDark ? '#374151' : '#f3f4f6',
                    drawBorder: false,
                },
                ticks: {
                    color: colors.muted,
                    font: {
                        size: isMobile ? 10 : 12,
                        family: 'Inter, sans-serif',
                    },
                    maxRotation: isMobile ? 45 : 0,
                    minRotation: isMobile ? 45 : 0,
                },
            },
            y: {
                grid: {
                    color: isDark ? '#374151' : '#f3f4f6',
                    drawBorder: false,
                },
                ticks: {
                    color: colors.muted,
                    font: {
                        size: isMobile ? 10 : 12,
                        family: 'Inter, sans-serif',
                    },
                },
            },
        },
        elements: {
            point: {
                radius: isMobile ? 3 : 4,
                hoverRadius: isMobile ? 5 : 6,
                borderWidth: 2,
            },
            line: {
                borderWidth: isMobile ? 2 : 3,
                tension: 0.4,
            },
            bar: {
                borderRadius: isMobile ? 4 : 6,
                borderSkipped: false,
            },
        },
        animation: {
            duration: isMobile ? 750 : 1000,
            easing: 'easeInOutQuart',
        },
    };
}

export function formatCurrency(
    amount: number,
    currency: string = 'NGN'
): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions
): string {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        ...options,
    }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

export function revenueTooltipFormatter(value: number, label: string): string {
    return `${label}: ${formatCurrency(value)}`;
}

export function getResponsiveChartHeight(
    baseHeight: number,
    isMobile: boolean,
    isTablet: boolean
): number {
    if (isMobile) {
        return Math.min(baseHeight, 250);
    }
    if (isTablet) {
        return Math.min(baseHeight, 350);
    }
    return baseHeight;
}

export function getResponsiveChartOptions(
    isDark: boolean,
    isMobile: boolean,
    chartType: 'line' | 'bar' | 'pie' | 'doughnut' = 'line'
): ChartOptions {
    const baseOptions = getBaseChartOptions(isDark, isMobile);

    // Chart-specific optimizations
    switch (chartType) {
        case 'pie':
        case 'doughnut':
            return {
                ...baseOptions,
                plugins: {
                    ...baseOptions.plugins,
                    legend: {
                        ...baseOptions.plugins?.legend,
                        position: isMobile ? 'bottom' : 'right',
                        labels: {
                            ...baseOptions.plugins?.legend?.labels,
                            generateLabels: (chart) => {
                                const data = chart.data;
                                if (data.labels && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i] as number;
                                        const total = (
                                            dataset.data as number[]
                                        ).reduce((a, b) => a + b, 0);
                                        const percentage = (
                                            (value / total) *
                                            100
                                        ).toFixed(1);

                                        return {
                                            text: isMobile
                                                ? `${label}`
                                                : `${label} (${percentage}%)`,
                                            fillStyle: dataset
                                                .backgroundColor?.[i] as string,
                                            strokeStyle: dataset.borderColor?.[
                                                i
                                            ] as string,
                                            lineWidth:
                                                dataset.borderWidth as number,
                                            hidden: false,
                                            index: i,
                                        };
                                    });
                                }
                                return [];
                            },
                        },
                    },
                },
                scales: undefined, // Remove scales for pie/doughnut charts
            };

        case 'bar':
            return {
                ...baseOptions,
                scales: {
                    ...baseOptions.scales,
                    x: {
                        ...baseOptions.scales?.x,
                        ticks: {
                            ...baseOptions.scales?.x?.ticks,
                            maxRotation: isMobile ? 90 : 45,
                            minRotation: isMobile ? 45 : 0,
                        },
                    },
                },
            };

        default:
            return baseOptions;
    }
}

export function createGradient(
    ctx: CanvasRenderingContext2D,
    color: string,
    opacity: number = 0.1
): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(
        0,
        color +
            Math.round(opacity * 255)
                .toString(16)
                .padStart(2, '0')
    );
    gradient.addColorStop(1, color + '00');
    return gradient;
}

export function getDatasetColors(isDark: boolean): string[] {
    const colors = getChartColors(isDark);
    return [
        colors.primary,
        colors.secondary,
        colors.success,
        colors.warning,
        colors.error,
        '#f97316', // orange
        '#06b6d4', // cyan
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#84cc16', // lime
    ];
}

export function truncateLabel(label: string, maxLength: number = 15): string {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
}

export function getOptimalTickCount(
    containerWidth: number,
    isMobile: boolean
): number {
    if (isMobile) {
        return Math.max(3, Math.floor(containerWidth / 80));
    }
    return Math.max(5, Math.floor(containerWidth / 100));
}

const chartConfig = {
    getChartColors,
    getBaseChartOptions,
    getResponsiveChartOptions,
    getResponsiveChartHeight,
    formatCurrency,
    formatNumber,
    formatPercentage,
    revenueTooltipFormatter,
    createGradient,
    getDatasetColors,
    truncateLabel,
    getOptimalTickCount,
};

export default chartConfig;

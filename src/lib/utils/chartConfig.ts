import { ChartOptions, TooltipItem } from 'chart.js';

// Chart.js theme-aware color configuration
export const getChartColors = (isDark: boolean = false) => {
    if (isDark) {
        return {
            primary: 'hsl(220, 70%, 50%)',
            secondary: 'hsl(160, 60%, 45%)',
            tertiary: 'hsl(30, 80%, 55%)',
            quaternary: 'hsl(280, 65%, 60%)',
            quinary: 'hsl(340, 75%, 55%)',
            background: 'hsl(0, 0%, 3.9%)',
            foreground: 'hsl(0, 0%, 98%)',
            muted: 'hsl(0, 0%, 63.9%)',
            border: 'hsl(0, 0%, 14.9%)',
            grid: 'hsl(0, 0%, 14.9%)',
        };
    }

    return {
        primary: 'hsl(12, 76%, 61%)',
        secondary: 'hsl(173, 58%, 39%)',
        tertiary: 'hsl(197, 37%, 24%)',
        quaternary: 'hsl(43, 74%, 66%)',
        quinary: 'hsl(27, 87%, 67%)',
        background: 'hsl(0, 0%, 100%)',
        foreground: 'hsl(0, 0%, 3.9%)',
        muted: 'hsl(0, 0%, 45.1%)',
        border: 'hsl(0, 0%, 89.8%)',
        grid: 'hsl(0, 0%, 89.8%)',
    };
};

// Base chart options with responsive design and accessibility
export const getBaseChartOptions = (
    isDark: boolean = false
): ChartOptions<any> => {
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
                position: 'top',
                labels: {
                    color: colors.foreground,
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                    },
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
                displayColors: true,
                titleFont: {
                    size: 14,
                    weight: '600',
                },
                bodyFont: {
                    size: 13,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: colors.grid,
                    drawBorder: false,
                },
                ticks: {
                    color: colors.muted,
                    font: {
                        size: 11,
                        family: 'Inter, sans-serif',
                    },
                },
            },
            y: {
                grid: {
                    color: colors.grid,
                    drawBorder: false,
                },
                ticks: {
                    color: colors.muted,
                    font: {
                        size: 11,
                        family: 'Inter, sans-serif',
                    },
                },
            },
        },
    };
};

// Format currency for tooltips and labels
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Format numbers with commas
export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
};

// Format percentage
export const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
};

// Custom tooltip formatter for revenue charts
export const revenueTooltipFormatter = (
    tooltipItem: TooltipItem<any>
): string => {
    const value = tooltipItem.parsed.y || tooltipItem.parsed;
    return formatCurrency(typeof value === 'number' ? value : 0);
};

// Custom tooltip formatter for count charts
export const countTooltipFormatter = (
    tooltipItem: TooltipItem<any>
): string => {
    const value = tooltipItem.parsed.y || tooltipItem.parsed;
    return formatNumber(typeof value === 'number' ? value : 0);
};

import {
    getChartColors,
    getBaseChartOptions,
    formatCurrency,
    formatNumber,
    formatPercentage,
    revenueTooltipFormatter,
    countTooltipFormatter,
} from '@/lib/utils/chartConfig';

describe('chartConfig utilities', () => {
    describe('getChartColors', () => {
        it('returns light theme colors by default', () => {
            const colors = getChartColors();

            expect(colors.primary).toBe('hsl(12, 76%, 61%)');
            expect(colors.background).toBe('hsl(0, 0%, 100%)');
            expect(colors.foreground).toBe('hsl(0, 0%, 3.9%)');
        });

        it('returns dark theme colors when isDark is true', () => {
            const colors = getChartColors(true);

            expect(colors.primary).toBe('hsl(220, 70%, 50%)');
            expect(colors.background).toBe('hsl(0, 0%, 3.9%)');
            expect(colors.foreground).toBe('hsl(0, 0%, 98%)');
        });

        it('returns light theme colors when isDark is false', () => {
            const colors = getChartColors(false);

            expect(colors.primary).toBe('hsl(12, 76%, 61%)');
            expect(colors.background).toBe('hsl(0, 0%, 100%)');
            expect(colors.foreground).toBe('hsl(0, 0%, 3.9%)');
        });
    });

    describe('getBaseChartOptions', () => {
        it('returns base chart options with light theme', () => {
            const options = getBaseChartOptions();

            expect(options.responsive).toBe(true);
            expect(options.maintainAspectRatio).toBe(false);
            expect(options.interaction.mode).toBe('index');
            expect(options.plugins?.legend?.labels?.color).toBe(
                'hsl(0, 0%, 3.9%)'
            );
        });

        it('returns base chart options with dark theme', () => {
            const options = getBaseChartOptions(true);

            expect(options.responsive).toBe(true);
            expect(options.maintainAspectRatio).toBe(false);
            expect(options.plugins?.legend?.labels?.color).toBe(
                'hsl(0, 0%, 98%)'
            );
        });

        it('configures scales with correct colors', () => {
            const lightOptions = getBaseChartOptions(false);
            const darkOptions = getBaseChartOptions(true);

            expect(lightOptions.scales?.x?.ticks?.color).toBe(
                'hsl(0, 0%, 45.1%)'
            );
            expect(darkOptions.scales?.x?.ticks?.color).toBe(
                'hsl(0, 0%, 63.9%)'
            );
        });

        it('configures tooltip with correct styling', () => {
            const options = getBaseChartOptions();

            expect(options.plugins?.tooltip?.cornerRadius).toBe(8);
            expect(options.plugins?.tooltip?.padding).toBe(12);
            expect(options.plugins?.tooltip?.borderWidth).toBe(1);
        });
    });

    describe('formatCurrency', () => {
        it('formats positive numbers as currency', () => {
            expect(formatCurrency(1234.56)).toBe('$1,235');
            expect(formatCurrency(1000)).toBe('$1,000');
            expect(formatCurrency(0)).toBe('$0');
        });

        it('formats large numbers correctly', () => {
            expect(formatCurrency(1234567)).toBe('$1,234,567');
            expect(formatCurrency(1000000)).toBe('$1,000,000');
        });

        it('rounds to nearest dollar', () => {
            expect(formatCurrency(1234.49)).toBe('$1,234');
            expect(formatCurrency(1234.51)).toBe('$1,235');
        });

        it('handles negative numbers', () => {
            expect(formatCurrency(-1234)).toBe('-$1,234');
        });
    });

    describe('formatNumber', () => {
        it('formats numbers with commas', () => {
            expect(formatNumber(1234)).toBe('1,234');
            expect(formatNumber(1234567)).toBe('1,234,567');
            expect(formatNumber(0)).toBe('0');
        });

        it('handles decimal numbers', () => {
            expect(formatNumber(1234.56)).toBe('1,234.56');
            expect(formatNumber(1000.1)).toBe('1,000.1');
        });

        it('handles negative numbers', () => {
            expect(formatNumber(-1234)).toBe('-1,234');
        });
    });

    describe('formatPercentage', () => {
        it('formats numbers as percentages with one decimal place', () => {
            expect(formatPercentage(45.678)).toBe('45.7%');
            expect(formatPercentage(100)).toBe('100.0%');
            expect(formatPercentage(0)).toBe('0.0%');
        });

        it('handles negative percentages', () => {
            expect(formatPercentage(-5.5)).toBe('-5.5%');
        });

        it('rounds to one decimal place', () => {
            expect(formatPercentage(45.67)).toBe('45.7%');
            expect(formatPercentage(45.64)).toBe('45.6%');
        });
    });

    describe('revenueTooltipFormatter', () => {
        it('formats tooltip item with y value as currency', () => {
            const tooltipItem = {
                parsed: { y: 1234.56 },
            } as any;

            expect(revenueTooltipFormatter(tooltipItem)).toBe('$1,235');
        });

        it('formats tooltip item with direct parsed value as currency', () => {
            const tooltipItem = {
                parsed: 1234.56,
            } as any;

            expect(revenueTooltipFormatter(tooltipItem)).toBe('$1,235');
        });

        it('handles missing or invalid values', () => {
            const tooltipItem = {
                parsed: { x: 1 },
            } as any;

            expect(revenueTooltipFormatter(tooltipItem)).toBe('$0');
        });

        it('handles non-numeric values', () => {
            const tooltipItem = {
                parsed: { y: 'invalid' },
            } as any;

            expect(revenueTooltipFormatter(tooltipItem)).toBe('$0');
        });
    });

    describe('countTooltipFormatter', () => {
        it('formats tooltip item with y value as number', () => {
            const tooltipItem = {
                parsed: { y: 1234 },
            } as any;

            expect(countTooltipFormatter(tooltipItem)).toBe('1,234');
        });

        it('formats tooltip item with direct parsed value as number', () => {
            const tooltipItem = {
                parsed: 1234,
            } as any;

            expect(countTooltipFormatter(tooltipItem)).toBe('1,234');
        });

        it('handles missing or invalid values', () => {
            const tooltipItem = {
                parsed: { x: 1 },
            } as any;

            expect(countTooltipFormatter(tooltipItem)).toBe('0');
        });

        it('handles non-numeric values', () => {
            const tooltipItem = {
                parsed: { y: 'invalid' },
            } as any;

            expect(countTooltipFormatter(tooltipItem)).toBe('0');
        });
    });
});

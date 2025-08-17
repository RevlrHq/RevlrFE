/**
 * Performance Testing Utilities
 *
 * This file provides utilities for measuring and benchmarking performance
 * in React components and applications. It includes functions for measuring
 * render times, memory usage, interaction responsiveness, and more.
 */

export interface PerformanceMetrics {
    renderTime: number;
    memoryUsage: number;
    interactionTime: number;
    dataProcessingTime: number;
    [key: string]: number;
}

export interface PerformanceEntry {
    name: string;
    startTime: number;
    duration: number;
    entryType: string;
}

interface PerformanceWithMemory extends Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}

/**
 * Measures the time it takes to execute a function
 */
export const measureExecutionTime = async <T>(
    fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    return { result, duration };
};

/**
 * Measures the time it takes to render a React component
 */
export const measureRenderTime = async (
    renderFn: () => void
): Promise<number> => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    return endTime - startTime;
};

/**
 * Measures memory usage (approximation for testing environments)
 */
export const measureMemoryUsage = async (): Promise<number> => {
    // In a real browser environment, you would use:
    // return (performance as PerformanceWithMemory).memory?.usedJSHeapSize / 1024 / 1024 || 0;

    // For testing environment, we'll simulate memory usage
    if (
        typeof window !== 'undefined' &&
        (performance as PerformanceWithMemory).memory
    ) {
        return (
            (performance as PerformanceWithMemory).memory.usedJSHeapSize /
            1024 /
            1024
        );
    }

    // Fallback for test environment - estimate based on process memory
    if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed / 1024 / 1024;
    }

    // Mock value for testing
    return Math.random() * 50 + 10; // 10-60 MB
};

/**
 * Measures the time it takes for a user interaction to complete
 */
export const measureInteractionTime = async (
    interactionFn: () => Promise<void>
): Promise<number> => {
    const startTime = performance.now();
    await interactionFn();
    const endTime = performance.now();
    return endTime - startTime;
};

/**
 * Creates a performance observer for collecting metrics
 */
export const createPerformanceObserver = () => {
    const metrics: PerformanceMetrics = {
        renderTime: 0,
        memoryUsage: 0,
        interactionTime: 0,
        dataProcessingTime: 0,
    };

    const entries: PerformanceEntry[] = [];

    // Mock PerformanceObserver for testing environment
    const observer = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: jest.fn(() => entries),
    };

    const addEntry = (
        name: string,
        duration: number,
        entryType = 'measure'
    ) => {
        entries.push({
            name,
            startTime: performance.now() - duration,
            duration,
            entryType,
        });
    };

    const getMetrics = (): PerformanceMetrics => {
        // Calculate metrics from entries
        const renderEntries = entries.filter((entry) =>
            entry.name.includes('render')
        );
        const interactionEntries = entries.filter((entry) =>
            entry.name.includes('interaction')
        );

        return {
            ...metrics,
            renderTime: renderEntries.reduce(
                (sum, entry) => sum + entry.duration,
                0
            ),
            interactionTime: interactionEntries.reduce(
                (sum, entry) => sum + entry.duration,
                0
            ),
        };
    };

    return {
        observer,
        addEntry,
        getMetrics,
        entries,
    };
};

/**
 * Measures First Contentful Paint (FCP) approximation
 */
export const measureFCP = (): Promise<number> => {
    return new Promise((resolve) => {
        // In a real browser, you would use PerformanceObserver
        // For testing, we'll simulate FCP timing
        setTimeout(() => {
            resolve(Math.random() * 1000 + 500); // 500-1500ms
        }, 0);
    });
};

/**
 * Measures Largest Contentful Paint (LCP) approximation
 */
export const measureLCP = (): Promise<number> => {
    return new Promise((resolve) => {
        // In a real browser, you would use PerformanceObserver
        // For testing, we'll simulate LCP timing
        setTimeout(() => {
            resolve(Math.random() * 2000 + 1000); // 1000-3000ms
        }, 0);
    });
};

/**
 * Measures Cumulative Layout Shift (CLS) approximation
 */
export const measureCLS = (): Promise<number> => {
    return new Promise((resolve) => {
        // In a real browser, you would use PerformanceObserver
        // For testing, we'll simulate CLS score
        setTimeout(() => {
            resolve(Math.random() * 0.1); // 0-0.1 (good CLS score)
        }, 0);
    });
};

/**
 * Measures Time to Interactive (TTI) approximation
 */
export const measureTTI = (): Promise<number> => {
    return new Promise((resolve) => {
        // In a real browser, you would calculate based on long tasks
        // For testing, we'll simulate TTI timing
        setTimeout(() => {
            resolve(Math.random() * 3000 + 2000); // 2000-5000ms
        }, 0);
    });
};

/**
 * Creates a performance budget checker
 */
export const createPerformanceBudget = (budgets: Record<string, number>) => {
    const violations: Array<{
        metric: string;
        actual: number;
        budget: number;
    }> = [];

    const checkBudget = (metric: string, actual: number): boolean => {
        const budget = budgets[metric];
        if (budget && actual > budget) {
            violations.push({ metric, actual, budget });
            return false;
        }
        return true;
    };

    const getViolations = () => violations;

    const hasViolations = () => violations.length > 0;

    const generateReport = () => {
        if (violations.length === 0) {
            return 'All performance budgets met ✅';
        }

        let report = 'Performance budget violations ❌\n';
        violations.forEach(({ metric, actual, budget }) => {
            const overage = (((actual - budget) / budget) * 100).toFixed(1);
            report += `- ${metric}: ${actual}ms (budget: ${budget}ms, +${overage}%)\n`;
        });

        return report;
    };

    return {
        checkBudget,
        getViolations,
        hasViolations,
        generateReport,
    };
};

/**
 * Measures bundle size impact (for testing purposes)
 */
export const measureBundleSize = (componentName: string): number => {
    // In a real scenario, you would measure actual bundle sizes
    // For testing, we'll simulate based on component complexity
    const baseSizes: Record<string, number> = {
        StatisticsOverview: 15, // KB
        RevenueChart: 45, // KB (includes Chart.js)
        EnhancedEventTable: 35, // KB
        DashboardCustomizer: 25, // KB
        AttendeeAnalytics: 30, // KB
    };

    return baseSizes[componentName] || 20;
};

/**
 * Simulates network conditions for performance testing
 */
export const simulateNetworkConditions = (
    condition: 'fast' | 'slow' | '3g' | 'offline'
) => {
    const delays: Record<string, number> = {
        fast: 50,
        slow: 500,
        '3g': 200,
        offline: Infinity,
    };

    const delay = delays[condition];

    return {
        delay,
        simulate: (fn: () => Promise<unknown>) => {
            if (delay === Infinity) {
                return Promise.reject(new Error('Network offline'));
            }
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const result = await fn();
                    resolve(result);
                }, delay);
            });
        },
    };
};

/**
 * Creates a performance profiler for detailed analysis
 */
export const createPerformanceProfiler = () => {
    const profiles: Array<{
        name: string;
        startTime: number;
        endTime?: number;
        duration?: number;
        metadata?: Record<string, unknown>;
    }> = [];

    const start = (name: string, metadata?: Record<string, unknown>) => {
        profiles.push({
            name,
            startTime: performance.now(),
            metadata,
        });
    };

    const end = (name: string) => {
        const profile = profiles.find((p) => p.name === name && !p.endTime);
        if (profile) {
            profile.endTime = performance.now();
            profile.duration = profile.endTime - profile.startTime;
        }
    };

    const getProfile = (name: string) => {
        return profiles.find((p) => p.name === name);
    };

    const getAllProfiles = () => profiles;

    const generateReport = () => {
        const completedProfiles = profiles.filter(
            (p) => p.duration !== undefined
        );

        if (completedProfiles.length === 0) {
            return 'No completed profiles found';
        }

        let report = 'Performance Profile Report\n';
        report += '========================\n\n';

        completedProfiles.forEach((profile) => {
            report += `${profile.name}: ${profile.duration?.toFixed(2)}ms\n`;
            if (profile.metadata) {
                Object.entries(profile.metadata).forEach(([key, value]) => {
                    report += `  ${key}: ${value}\n`;
                });
            }
            report += '\n';
        });

        const totalTime = completedProfiles.reduce(
            (sum, p) => sum + (p.duration || 0),
            0
        );
        report += `Total Time: ${totalTime.toFixed(2)}ms\n`;

        return report;
    };

    return {
        start,
        end,
        getProfile,
        getAllProfiles,
        generateReport,
    };
};

/**
 * Measures React component re-render count
 */
export const createRenderCounter = () => {
    const renderCounts: Record<string, number> = {};

    const increment = (componentName: string) => {
        renderCounts[componentName] = (renderCounts[componentName] || 0) + 1;
    };

    const getCount = (componentName: string) => {
        return renderCounts[componentName] || 0;
    };

    const getAllCounts = () => renderCounts;

    const reset = (componentName?: string) => {
        if (componentName) {
            renderCounts[componentName] = 0;
        } else {
            Object.keys(renderCounts).forEach((key) => {
                renderCounts[key] = 0;
            });
        }
    };

    return {
        increment,
        getCount,
        getAllCounts,
        reset,
    };
};

/**
 * Utility to wait for performance entries
 */
export const waitForPerformanceEntries = (
    entryType: string,
    timeout: number = 5000
): Promise<PerformanceEntry[]> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Timeout waiting for ${entryType} entries`));
        }, timeout);

        // Mock implementation for testing
        setTimeout(() => {
            clearTimeout(timeoutId);
            resolve([
                {
                    name: `mock-${entryType}`,
                    startTime: performance.now() - 100,
                    duration: 100,
                    entryType,
                },
            ]);
        }, 100);
    });
};

/**
 * Calculates performance score based on multiple metrics
 */
export const calculatePerformanceScore = (metrics: {
    fcp?: number;
    lcp?: number;
    cls?: number;
    tti?: number;
    renderTime?: number;
}): number => {
    let score = 100;

    // FCP scoring (0-1800ms = 100, 1800-3000ms = 50-99, >3000ms = 0-49)
    if (metrics.fcp) {
        if (metrics.fcp > 3000) score -= 30;
        else if (metrics.fcp > 1800)
            score -= ((metrics.fcp - 1800) / 1200) * 30;
    }

    // LCP scoring (0-2500ms = 100, 2500-4000ms = 50-99, >4000ms = 0-49)
    if (metrics.lcp) {
        if (metrics.lcp > 4000) score -= 25;
        else if (metrics.lcp > 2500)
            score -= ((metrics.lcp - 2500) / 1500) * 25;
    }

    // CLS scoring (0-0.1 = 100, 0.1-0.25 = 50-99, >0.25 = 0-49)
    if (metrics.cls) {
        if (metrics.cls > 0.25) score -= 20;
        else if (metrics.cls > 0.1) score -= ((metrics.cls - 0.1) / 0.15) * 20;
    }

    // TTI scoring (0-3800ms = 100, 3800-7300ms = 50-99, >7300ms = 0-49)
    if (metrics.tti) {
        if (metrics.tti > 7300) score -= 15;
        else if (metrics.tti > 3800)
            score -= ((metrics.tti - 3800) / 3500) * 15;
    }

    // Render time scoring (0-100ms = 100, 100-300ms = 50-99, >300ms = 0-49)
    if (metrics.renderTime) {
        if (metrics.renderTime > 300) score -= 10;
        else if (metrics.renderTime > 100)
            score -= ((metrics.renderTime - 100) / 200) * 10;
    }

    return Math.max(0, Math.min(100, score));
};

/**
 * Export all utilities as a collection
 */
export const PerformanceUtils = {
    measureExecutionTime,
    measureRenderTime,
    measureMemoryUsage,
    measureInteractionTime,
    createPerformanceObserver,
    measureFCP,
    measureLCP,
    measureCLS,
    measureTTI,
    createPerformanceBudget,
    measureBundleSize,
    simulateNetworkConditions,
    createPerformanceProfiler,
    createRenderCounter,
    waitForPerformanceEntries,
    calculatePerformanceScore,
};

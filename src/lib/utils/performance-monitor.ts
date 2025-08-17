/**
 * Performance monitoring utilities for dashboard optimization
 */

interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

interface BundleAnalytics {
    chunkSizes: Record<string, number>;
    loadTimes: Record<string, number>;
    cacheHitRates: Record<string, number>;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private observers: PerformanceObserver[] = [];

    constructor() {
        this.initializeObservers();
    }

    private initializeObservers() {
        // Core Web Vitals observer
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                const vitalsObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        this.recordMetric({
                            name: entry.name,
                            value:
                                entry.value ||
                                (
                                    entry as PerformanceEntry & {
                                        processingStart?: number;
                                    }
                                ).processingStart,
                            timestamp: Date.now(),
                            metadata: {
                                entryType: entry.entryType,
                                startTime: entry.startTime,
                            },
                        });
                    });
                });

                vitalsObserver.observe({
                    entryTypes: [
                        'largest-contentful-paint',
                        'first-input',
                        'layout-shift',
                    ],
                });
                this.observers.push(vitalsObserver);
            } catch (error) {
                console.warn('Performance observer not supported:', error);
            }

            // Navigation timing observer
            try {
                const navigationObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        const navEntry = entry as PerformanceNavigationTiming;
                        this.recordMetric({
                            name: 'navigation_timing',
                            value:
                                navEntry.loadEventEnd - navEntry.loadEventStart,
                            timestamp: Date.now(),
                            metadata: {
                                domContentLoaded:
                                    navEntry.domContentLoadedEventEnd -
                                    navEntry.domContentLoadedEventStart,
                                firstPaint:
                                    navEntry.loadEventStart -
                                    navEntry.fetchStart,
                                ttfb:
                                    navEntry.responseStart -
                                    navEntry.requestStart,
                            },
                        });
                    });
                });

                navigationObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navigationObserver);
            } catch (error) {
                console.warn('Navigation observer not supported:', error);
            }

            // Resource timing observer for chunk loading
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        const resourceEntry =
                            entry as PerformanceResourceTiming;
                        if (
                            resourceEntry.name.includes('_next/static/chunks/')
                        ) {
                            this.recordMetric({
                                name: 'chunk_load_time',
                                value:
                                    resourceEntry.responseEnd -
                                    resourceEntry.startTime,
                                timestamp: Date.now(),
                                metadata: {
                                    chunkName: this.extractChunkName(
                                        resourceEntry.name
                                    ),
                                    size: resourceEntry.transferSize,
                                    cached: resourceEntry.transferSize === 0,
                                },
                            });
                        }
                    });
                });

                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (error) {
                console.warn('Resource observer not supported:', error);
            }
        }
    }

    private extractChunkName(url: string): string {
        const match = url.match(/chunks\/(.+?)\.js/);
        return match ? match[1] : 'unknown';
    }

    recordMetric(metric: PerformanceMetric) {
        this.metrics.push(metric);

        // Send to analytics service if available
        if (
            typeof window !== 'undefined' &&
            (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
        ) {
            (window as Window & { gtag: (...args: unknown[]) => void }).gtag(
                'event',
                'performance_metric',
                {
                    metric_name: metric.name,
                    metric_value: metric.value,
                    custom_parameter: metric.metadata,
                }
            );
        }

        // Log performance issues
        if (this.isPerformanceIssue(metric)) {
            console.warn(
                `Performance issue detected: ${metric.name} = ${metric.value}ms`,
                metric.metadata
            );
        }
    }

    private isPerformanceIssue(metric: PerformanceMetric): boolean {
        const thresholds: Record<string, number> = {
            'largest-contentful-paint': 2500,
            'first-input': 100,
            chunk_load_time: 1000,
            navigation_timing: 3000,
        };

        return metric.value > (thresholds[metric.name] || Infinity);
    }

    getMetrics(name?: string): PerformanceMetric[] {
        return name
            ? this.metrics.filter((m) => m.name === name)
            : this.metrics;
    }

    getBundleAnalytics(): BundleAnalytics {
        const chunkMetrics = this.getMetrics('chunk_load_time');

        return {
            chunkSizes: chunkMetrics.reduce(
                (acc, metric) => {
                    const chunkName = metric.metadata?.chunkName || 'unknown';
                    acc[chunkName] = metric.metadata?.size || 0;
                    return acc;
                },
                {} as Record<string, number>
            ),

            loadTimes: chunkMetrics.reduce(
                (acc, metric) => {
                    const chunkName = metric.metadata?.chunkName || 'unknown';
                    acc[chunkName] = metric.value;
                    return acc;
                },
                {} as Record<string, number>
            ),

            cacheHitRates: chunkMetrics.reduce(
                (acc, metric) => {
                    const chunkName = metric.metadata?.chunkName || 'unknown';
                    if (!acc[chunkName]) acc[chunkName] = { hits: 0, total: 0 };
                    acc[chunkName].total++;
                    if (metric.metadata?.cached) acc[chunkName].hits++;
                    return acc;
                },
                {} as Record<string, { hits: number; total: number }>
            ),
        };
    }

    generatePerformanceReport(): string {
        const analytics = this.getBundleAnalytics();
        const vitals = {
            lcp:
                this.getMetrics('largest-contentful-paint').slice(-1)[0]
                    ?.value || 0,
            fid: this.getMetrics('first-input').slice(-1)[0]?.value || 0,
            cls: this.getMetrics('layout-shift').slice(-1)[0]?.value || 0,
        };

        return `
Dashboard Performance Report
===========================

Core Web Vitals:
- Largest Contentful Paint: ${vitals.lcp.toFixed(2)}ms
- First Input Delay: ${vitals.fid.toFixed(2)}ms
- Cumulative Layout Shift: ${vitals.cls.toFixed(4)}

Bundle Analytics:
${Object.entries(analytics.loadTimes)
    .map(
        ([chunk, time]) =>
            `- ${chunk}: ${time.toFixed(2)}ms (${(analytics.chunkSizes[chunk] / 1024).toFixed(2)}KB)`
    )
    .join('\n')}

Cache Performance:
${Object.entries(analytics.cacheHitRates)
    .map(
        ([chunk, stats]) =>
            `- ${chunk}: ${((stats.hits / stats.total) * 100).toFixed(1)}% hit rate`
    )
    .join('\n')}
        `.trim();
    }

    cleanup() {
        this.observers.forEach((observer) => observer.disconnect());
        this.observers = [];
        this.metrics = [];
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export const measureComponentRender = (componentName: string) => {
    const startTime = performance.now();

    return () => {
        const endTime = performance.now();
        performanceMonitor.recordMetric({
            name: 'component_render_time',
            value: endTime - startTime,
            timestamp: Date.now(),
            metadata: { componentName },
        });
    };
};

export const measureAsyncOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>
): Promise<T> => {
    const startTime = performance.now();

    try {
        const result = await operation();
        const endTime = performance.now();

        performanceMonitor.recordMetric({
            name: 'async_operation_time',
            value: endTime - startTime,
            timestamp: Date.now(),
            metadata: { operationName, success: true },
        });

        return result;
    } catch (error) {
        const endTime = performance.now();

        performanceMonitor.recordMetric({
            name: 'async_operation_time',
            value: endTime - startTime,
            timestamp: Date.now(),
            metadata: {
                operationName,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        });

        throw error;
    }
};

// React hook for performance tracking
export const usePerformanceTracking = () => {
    const trackPageView = (pageName: string) => {
        performanceMonitor.recordMetric({
            name: 'page_view',
            value: Date.now(),
            timestamp: Date.now(),
            metadata: { pageName },
        });
    };

    const trackUserAction = (
        actionName: string,
        metadata?: Record<string, unknown>
    ) => {
        performanceMonitor.recordMetric({
            name: 'user_action',
            value: Date.now(),
            timestamp: Date.now(),
            metadata: { actionName, ...metadata },
        });
    };

    const trackPerformanceMetric = (
        metricName: string,
        value: number,
        metadata?: Record<string, unknown>
    ) => {
        performanceMonitor.recordMetric({
            name: metricName,
            value,
            timestamp: Date.now(),
            metadata,
        });
    };

    return {
        trackPageView,
        trackUserAction,
        trackPerformanceMetric,
        getPerformanceReport: () =>
            performanceMonitor.generatePerformanceReport(),
    };
};

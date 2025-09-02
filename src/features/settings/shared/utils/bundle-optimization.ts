/**
 * Bundle optimization utilities for settings feature
 * Implements code splitting, tree shaking, and dynamic imports
 */

import { ComponentType, lazy } from 'react';

/**
 * Dynamic import with retry logic
 */
export const dynamicImport = async <T>(
    importFn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await importFn();
        } catch (error) {
            if (i === retries - 1) throw error;

            // Wait before retry with exponential backoff
            await new Promise((resolve) =>
                setTimeout(resolve, delay * Math.pow(2, i))
            );
        }
    }

    throw new Error('Dynamic import failed after retries');
};

/**
 * Create lazy component with error boundary and loading state
 */
export function createLazyComponent<P extends object>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    fallback?: ComponentType<P>
): ComponentType<P> {
    return lazy(() => dynamicImport(importFn));
}

/**
 * Preload components for better UX
 */
export const preloadComponents = {
    /**
     * Preload component when user hovers
     */
    onHover: (importFn: () => Promise<any>) => {
        let preloaded = false;

        return {
            onMouseEnter: () => {
                if (!preloaded) {
                    preloaded = true;
                    importFn().catch(console.warn);
                }
            },
        };
    },

    /**
     * Preload component when it becomes visible
     */
    onVisible: (importFn: () => Promise<any>, threshold: number = 0.1) => {
        return (element: Element | null) => {
            if (!element) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            importFn().catch(console.warn);
                            observer.disconnect();
                        }
                    });
                },
                { threshold }
            );

            observer.observe(element);
        };
    },

    /**
     * Preload component after delay
     */
    afterDelay: (importFn: () => Promise<any>, delay: number = 2000) => {
        setTimeout(() => {
            importFn().catch(console.warn);
        }, delay);
    },

    /**
     * Preload component on idle
     */
    onIdle: (importFn: () => Promise<any>) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                importFn().catch(console.warn);
            });
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => {
                importFn().catch(console.warn);
            }, 1000);
        }
    },
};

/**
 * Resource hints for better performance
 */
export const resourceHints = {
    /**
     * Prefetch JavaScript modules
     */
    prefetchModule: (modulePath: string) => {
        if (typeof document === 'undefined') return;

        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = modulePath;
        document.head.appendChild(link);
    },

    /**
     * Preload critical resources
     */
    preloadResource: (url: string, as: string, crossorigin?: string) => {
        if (typeof document === 'undefined') return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = as;
        if (crossorigin) link.crossOrigin = crossorigin;
        document.head.appendChild(link);
    },

    /**
     * Prefetch non-critical resources
     */
    prefetchResource: (url: string) => {
        if (typeof document === 'undefined') return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    },

    /**
     * Preconnect to external domains
     */
    preconnect: (domain: string, crossorigin?: boolean) => {
        if (typeof document === 'undefined') return;

        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        if (crossorigin) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    },
};

/**
 * Bundle analysis utilities
 */
export const bundleAnalysis = {
    /**
     * Measure component load time
     */
    measureLoadTime: async <T>(
        name: string,
        importFn: () => Promise<T>
    ): Promise<T> => {
        const startTime = performance.now();

        try {
            const result = await importFn();
            const loadTime = performance.now() - startTime;

            // Log to analytics or console
            console.log(`Component ${name} loaded in ${loadTime.toFixed(2)}ms`);

            // Send to analytics if available
            if ('gtag' in window) {
                (window as any).gtag('event', 'component_load_time', {
                    component_name: name,
                    load_time: Math.round(loadTime),
                });
            }

            return result;
        } catch (error) {
            console.error(`Failed to load component ${name}:`, error);
            throw error;
        }
    },

    /**
     * Track bundle size impact
     */
    trackBundleSize: (componentName: string, estimatedSize: number) => {
        if ('gtag' in window) {
            (window as any).gtag('event', 'bundle_size_impact', {
                component_name: componentName,
                estimated_size: estimatedSize,
            });
        }
    },
};

/**
 * Tree shaking helpers
 */
export const treeShaking = {
    /**
     * Import only specific functions from a module
     */
    importSpecific: async <T extends Record<string, any>, K extends keyof T>(
        importFn: () => Promise<T>,
        keys: K[]
    ): Promise<Pick<T, K>> => {
        const module = await importFn();
        const result = {} as Pick<T, K>;

        keys.forEach((key) => {
            if (key in module) {
                result[key] = module[key];
            }
        });

        return result;
    },

    /**
     * Conditionally import modules
     */
    conditionalImport: async <T>(
        condition: boolean | (() => boolean),
        importFn: () => Promise<T>
    ): Promise<T | null> => {
        const shouldImport =
            typeof condition === 'function' ? condition() : condition;

        if (shouldImport) {
            return await importFn();
        }

        return null;
    },
};

/**
 * Performance monitoring
 */
export const performanceMonitoring = {
    /**
     * Monitor component render performance
     */
    monitorRender: (componentName: string) => {
        return {
            onRenderStart: () => {
                performance.mark(`${componentName}-render-start`);
            },
            onRenderEnd: () => {
                performance.mark(`${componentName}-render-end`);
                performance.measure(
                    `${componentName}-render`,
                    `${componentName}-render-start`,
                    `${componentName}-render-end`
                );

                const measure = performance.getEntriesByName(
                    `${componentName}-render`
                )[0];
                if (measure) {
                    console.log(
                        `${componentName} render time: ${measure.duration.toFixed(2)}ms`
                    );
                }
            },
        };
    },

    /**
     * Monitor memory usage
     */
    monitorMemory: (componentName: string) => {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            console.log(`${componentName} memory usage:`, {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
            });
        }
    },

    /**
     * Monitor network requests
     */
    monitorNetwork: (resourceName: string) => {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name.includes(resourceName)) {
                    console.log(`${resourceName} network timing:`, {
                        duration: entry.duration,
                        transferSize: (entry as any).transferSize,
                        encodedBodySize: (entry as any).encodedBodySize,
                    });
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });

        return () => observer.disconnect();
    },
};

/**
 * Initialize bundle optimization
 */
export const initializeBundleOptimization = (): void => {
    // Preconnect to external domains
    resourceHints.preconnect('https://fonts.googleapis.com');
    resourceHints.preconnect('https://fonts.gstatic.com', true);

    // Prefetch critical resources after page load
    if (typeof window !== 'undefined') {
        window.addEventListener('load', () => {
            // Prefetch settings-related resources
            resourceHints.prefetchResource('/api/user/profile');
            resourceHints.prefetchResource('/api/user/preferences');

            // Preload critical components after initial render
            setTimeout(() => {
                preloadComponents.onIdle(
                    () => import('../../profile/components/ProfileSettings')
                );
                preloadComponents.onIdle(
                    () => import('../../security/components/SecuritySettings')
                );
            }, 2000);
        });
    }

    // Monitor performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'navigation') {
                    console.log('Navigation timing:', {
                        domContentLoaded:
                            (entry as any).domContentLoadedEventEnd -
                            (entry as any).domContentLoadedEventStart,
                        loadComplete:
                            (entry as any).loadEventEnd -
                            (entry as any).loadEventStart,
                    });
                }
            });
        });

        observer.observe({ entryTypes: ['navigation'] });
    }
};

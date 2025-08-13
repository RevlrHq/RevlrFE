/**
 * Bundle optimization utilities for the event creation module
 */

// Dynamic imports for code splitting
export const dynamicImports = {
    // Core event creation components
    createEvent: () => import('../../features/dashboard/CreateEvent'),
    // eventModal: () => import('../../features/dashboard/components/EventModal'), // Commented out - doesn't exist

    // Form components
    imageUpload: () => import('../../components/ImageUpload'),
    ticketManagement: () => import('../../components/TicketManagement'),
    locationSelector: () => import('../../components/LocationSelector'),
    organizerDetails: () => import('../../components/OrganizerDetails'),
    dateTimeSelector: () => import('../../components/DateTimeSelector'),
    categorySelector: () => import('../../components/CategorySelector'),

    // Validation and publishing
    prePublishValidation: () => import('../../components/PrePublishValidation'),
    publishConfirmationModal: () =>
        import('../../components/PublishConfirmationModal'),
    publishSuccessModal: () => import('../../components/PublishSuccessModal'),

    // Services
    // eventCreationService: () => import('../services/EventCreationService'), // Commented out - doesn't exist
    imageUploadService: () => import('../services/ImageUploadService'),
    draftBackupService: () => import('../services/DraftBackupService'),
    // monitoringService: () => import('../services/MonitoringService'), // Commented out - doesn't exist

    // Hooks
    useEventCreation: () => import('../../hooks/useEventCreation'),
    usePerformanceTracking: () => import('../../hooks/usePerformanceTracking'),
    useDebounce: () => import('../../hooks/useDebounce'),

    // Third-party libraries
    uploadcare: () => import('@uploadcare/upload-client'),
    dateLibrary: () => import('date-fns'),
};

/**
 * Preload critical components based on user interaction
 */
export class ComponentPreloader {
    private static preloadedComponents = new Set<string>();
    private static preloadPromises = new Map<string, Promise<unknown>>();

    /**
     * Preload a component by key
     */
    static async preload(
        componentKey: keyof typeof dynamicImports
    ): Promise<void> {
        if (this.preloadedComponents.has(componentKey)) {
            return;
        }

        if (this.preloadPromises.has(componentKey)) {
            await this.preloadPromises.get(componentKey);
            return;
        }

        const preloadPromise = dynamicImports[componentKey]()
            .then(() => {
                this.preloadedComponents.add(componentKey);
                this.preloadPromises.delete(componentKey);
            })
            .catch((error) => {
                console.warn(
                    `Failed to preload component ${componentKey}:`,
                    error
                );
                this.preloadPromises.delete(componentKey);
            });

        this.preloadPromises.set(componentKey, preloadPromise);
        return preloadPromise;
    }

    /**
     * Preload multiple components
     */
    static async preloadMultiple(
        componentKeys: (keyof typeof dynamicImports)[]
    ): Promise<void> {
        const promises = componentKeys.map((key) => this.preload(key));
        await Promise.allSettled(promises);
    }

    /**
     * Preload components based on current step
     */
    static preloadForStep(step: number): void {
        switch (step) {
            case 1:
                // Preload components for step 1
                this.preloadMultiple([
                    'imageUpload',
                    'categorySelector',
                    'locationSelector',
                    'dateTimeSelector',
                ]);
                break;
            case 2:
                // Preload components for step 2
                this.preloadMultiple([
                    'ticketManagement',
                    'organizerDetails',
                    'prePublishValidation',
                ]);
                break;
            case 3:
                // Preload publishing components
                this.preloadMultiple([
                    'publishConfirmationModal',
                    'publishSuccessModal',
                ]);
                break;
        }
    }

    /**
     * Preload on user interaction (hover, focus)
     */
    static setupInteractionPreloading(): void {
        if (typeof window === 'undefined') return;

        // Preload on hover over navigation elements
        const setupHoverPreload = (
            selector: string,
            componentKey: keyof typeof dynamicImports
        ) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element) => {
                element.addEventListener(
                    'mouseenter',
                    () => {
                        this.preload(componentKey);
                    },
                    { once: true }
                );
            });
        };

        // Setup hover preloading for common elements
        setupHoverPreload('[data-step="2"]', 'ticketManagement');
        setupHoverPreload('[data-component="image-upload"]', 'imageUpload');
        setupHoverPreload('[data-component="publish"]', 'prePublishValidation');
    }

    /**
     * Get preload status
     */
    static getPreloadStatus(): {
        preloaded: string[];
        pending: string[];
        total: number;
    } {
        return {
            preloaded: Array.from(this.preloadedComponents),
            pending: Array.from(this.preloadPromises.keys()),
            total: Object.keys(dynamicImports).length,
        };
    }
}

/**
 * Bundle analyzer utilities
 */
export class BundleAnalyzer {
    /**
     * Measure bundle load time
     */
    static measureLoadTime(bundleName: string): Promise<number> {
        const startTime = performance.now();

        return new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const bundleEntry = entries.find((entry) =>
                    entry.name.includes(bundleName)
                ) as PerformanceResourceTiming | undefined;

                if (bundleEntry) {
                    const loadTime =
                        bundleEntry.responseEnd - bundleEntry.requestStart;
                    resolve(loadTime);
                    observer.disconnect();
                }
            });

            observer.observe({ entryTypes: ['resource'] });

            // Fallback timeout
            setTimeout(() => {
                const endTime = performance.now();
                resolve(endTime - startTime);
                observer.disconnect();
            }, 5000);
        });
    }

    /**
     * Get bundle size information
     */
    static getBundleInfo(): {
        totalSize: number;
        gzippedSize: number;
        chunks: Array<{ name: string; size: number }>;
    } {
        // This would typically be populated by webpack-bundle-analyzer
        // or similar tools during build time
        interface BundleInfo {
            totalSize: number;
            gzippedSize: number;
            chunks: Array<{ name: string; size: number }>;
        }

        const bundleInfo: BundleInfo = (
            window as unknown as { __BUNDLE_INFO__?: BundleInfo }
        ).__BUNDLE_INFO__ || {
            totalSize: 0,
            gzippedSize: 0,
            chunks: [],
        };

        return bundleInfo;
    }

    /**
     * Track bundle performance
     */
    static trackBundlePerformance(): void {
        if (typeof window === 'undefined') return;

        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (
                    entry.name.includes('chunk') ||
                    entry.name.includes('bundle')
                ) {
                    const resourceEntry = entry as PerformanceResourceTiming;
                    const loadTime =
                        resourceEntry.responseEnd - resourceEntry.requestStart;

                    // Send to monitoring service
                    interface MonitoringService {
                        recordPerformanceMetric: (metric: {
                            name: string;
                            value: number;
                            timestamp: number;
                            metadata: Record<string, unknown>;
                        }) => void;
                    }

                    const windowWithMonitoring = window as unknown as {
                        monitoring?: MonitoringService;
                    };
                    if (windowWithMonitoring.monitoring) {
                        windowWithMonitoring.monitoring.recordPerformanceMetric(
                            {
                                name: 'bundle_load_time',
                                value: loadTime,
                                timestamp: Date.now(),
                                metadata: {
                                    bundleName: entry.name,
                                    size:
                                        (entry as PerformanceResourceTiming)
                                            .transferSize || 0,
                                },
                            }
                        );
                    }
                }
            });
        });

        observer.observe({ entryTypes: ['resource'] });
    }
}

/**
 * Tree shaking utilities
 */
export const treeShakingOptimizations = {
    // Import only specific functions from large libraries
    dateUtils: {
        format: () => import('date-fns/format'),
        parseISO: () => import('date-fns/parseISO'),
        isValid: () => import('date-fns/isValid'),
        addDays: () => import('date-fns/addDays'),
    },

    // Import only needed lodash functions
    lodashUtils: {
        debounce: () => import('lodash/debounce'),
        throttle: () => import('lodash/throttle'),
        isEqual: () => import('lodash/isEqual'),
        cloneDeep: () => import('lodash/cloneDeep'),
    },

    // Import only needed validation functions
    validationUtils: {
        isEmail: () => import('validator/lib/isEmail'),
        isURL: () => import('validator/lib/isURL'),
        isLength: () => import('validator/lib/isLength'),
    },
};

/**
 * Resource hints for better loading performance
 */
export class ResourceHints {
    /**
     * Add preload hints for critical resources
     */
    static addPreloadHints(): void {
        if (typeof document === 'undefined') return;

        const criticalResources = [
            '/api/events/categories',
            '/api/user/profile',
        ];

        criticalResources.forEach((resource) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = 'fetch';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    /**
     * Add prefetch hints for likely next resources
     */
    static addPrefetchHints(step: number): void {
        if (typeof document === 'undefined') return;

        const prefetchResources: Record<number, string[]> = {
            1: ['/api/events/draft', '/api/upload/image'],
            2: ['/api/events/tickets', '/api/events/publish'],
            3: ['/api/events/published'],
        };

        const resources = prefetchResources[step] || [];

        resources.forEach((resource) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    /**
     * Add DNS prefetch for external domains
     */
    static addDnsPrefetch(): void {
        if (typeof document === 'undefined') return;

        const externalDomains = [
            'https://ucarecdn.com',
            'https://api.uploadcare.com',
            'https://fonts.googleapis.com',
            'https://www.google-analytics.com',
        ];

        externalDomains.forEach((domain) => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            document.head.appendChild(link);
        });
    }
}

/**
 * Initialize bundle optimizations
 */
export function initializeBundleOptimizations(): void {
    // Setup component preloading
    ComponentPreloader.setupInteractionPreloading();

    // Track bundle performance
    BundleAnalyzer.trackBundlePerformance();

    // Add resource hints
    ResourceHints.addDnsPrefetch();
    ResourceHints.addPreloadHints();

    // Preload critical components after initial load
    setTimeout(() => {
        ComponentPreloader.preloadMultiple(['imageUpload', 'useEventCreation']);
    }, 1000);
}

/**
 * Webpack configuration helpers (for build time)
 */
export const webpackOptimizations = {
    splitChunks: {
        chunks: 'all',
        cacheGroups: {
            // Vendor libraries
            vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
            },
            // Event creation specific code
            eventCreation: {
                test: /[\\/]src[\\/](features[\\/]dashboard|components[\\/](ImageUpload|TicketManagement|LocationSelector))/,
                name: 'event-creation',
                chunks: 'all',
                priority: 20,
            },
            // Common utilities
            common: {
                test: /[\\/]src[\\/](lib|hooks|utils)[\\/]/,
                name: 'common',
                chunks: 'all',
                priority: 5,
                minChunks: 2,
            },
        },
    },

    // Minimize bundle size
    optimization: {
        usedExports: true,
        sideEffects: false,
        minimize: true,
    },
};

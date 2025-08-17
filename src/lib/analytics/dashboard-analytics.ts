/**
 * Dashboard-specific analytics tracking
 */

interface DashboardEvent {
    event: string;
    properties: Record<string, unknown>;
    timestamp: number;
    sessionId: string;
    userId?: string;
}

interface DashboardMetrics {
    pageViews: number;
    uniqueUsers: number;
    sessionDuration: number;
    bounceRate: number;
    featureUsage: Record<string, number>;
    errorRate: number;
    performanceMetrics: {
        loadTime: number;
        renderTime: number;
        interactionTime: number;
    };
}

class DashboardAnalytics {
    private events: DashboardEvent[] = [];
    private sessionId: string;
    private sessionStart: number;
    private userId?: string;
    private isInitialized = false;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.initialize();
    }

    private initialize() {
        if (this.isInitialized || typeof window === 'undefined') return;

        // Initialize PostHog if available
        if (
            (
                window as Window & {
                    posthog?: { identify: (id: string) => void };
                }
            ).posthog
        ) {
            (
                window as Window & {
                    posthog: { identify: (id: string) => void };
                }
            ).posthog.identify(this.sessionId);
        }

        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('dashboard_hidden', {
                    sessionDuration: Date.now() - this.sessionStart,
                });
            } else {
                this.trackEvent('dashboard_visible', {});
            }
        });

        // Track user interactions
        this.setupInteractionTracking();

        // Track performance metrics
        this.setupPerformanceTracking();

        this.isInitialized = true;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private setupInteractionTracking() {
        // Track clicks on dashboard elements
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const dashboardElement = target.closest('[data-analytics]');

            if (dashboardElement) {
                const elementType =
                    dashboardElement.getAttribute('data-analytics');
                const elementId = dashboardElement.id || 'unknown';

                this.trackEvent('dashboard_interaction', {
                    elementType,
                    elementId,
                    coordinates: { x: event.clientX, y: event.clientY },
                });
            }
        });

        // Track form interactions
        document.addEventListener('input', (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('.dashboard-form')) {
                this.trackEvent('dashboard_form_interaction', {
                    fieldType: target.tagName.toLowerCase(),
                    fieldName: (target as HTMLInputElement).name || 'unknown',
                });
            }
        });
    }

    private setupPerformanceTracking() {
        // Track Core Web Vitals
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.entryType === 'largest-contentful-paint') {
                            this.trackEvent('dashboard_lcp', {
                                value: entry.startTime,
                                threshold:
                                    entry.startTime > 2500
                                        ? 'poor'
                                        : entry.startTime > 1200
                                          ? 'needs_improvement'
                                          : 'good',
                            });
                        }

                        if (entry.entryType === 'first-input') {
                            const firstInputEntry =
                                entry as PerformanceEventTiming;
                            this.trackEvent('dashboard_fid', {
                                value:
                                    firstInputEntry.processingStart -
                                    entry.startTime,
                                threshold:
                                    firstInputEntry.processingStart -
                                        entry.startTime >
                                    100
                                        ? 'poor'
                                        : 'good',
                            });
                        }

                        if (entry.entryType === 'layout-shift') {
                            const layoutShiftEntry =
                                entry as PerformanceEntry & { value: number };
                            this.trackEvent('dashboard_cls', {
                                value: layoutShiftEntry.value,
                                threshold:
                                    layoutShiftEntry.value > 0.25
                                        ? 'poor'
                                        : layoutShiftEntry.value > 0.1
                                          ? 'needs_improvement'
                                          : 'good',
                            });
                        }
                    });
                });

                observer.observe({
                    entryTypes: [
                        'largest-contentful-paint',
                        'first-input',
                        'layout-shift',
                    ],
                });
            } catch (error) {
                console.warn('Performance observer not supported:', error);
            }
        }

        // Track resource loading times
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType(
                'navigation'
            )[0] as PerformanceNavigationTiming;

            this.trackEvent('dashboard_load_complete', {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded:
                    navigation.domContentLoadedEventEnd -
                    navigation.domContentLoadedEventStart,
                firstPaint: navigation.loadEventStart - navigation.fetchStart,
                ttfb: navigation.responseStart - navigation.requestStart,
            });
        });
    }

    trackEvent(event: string, properties: Record<string, unknown> = {}) {
        const dashboardEvent: DashboardEvent = {
            event,
            properties: {
                ...properties,
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent:
                    typeof window !== 'undefined' ? navigator.userAgent : '',
                viewport:
                    typeof window !== 'undefined'
                        ? {
                              width: window.innerWidth,
                              height: window.innerHeight,
                          }
                        : null,
            },
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
        };

        this.events.push(dashboardEvent);

        // Send to PostHog
        if (
            typeof window !== 'undefined' &&
            (
                window as Window & {
                    posthog?: {
                        capture: (
                            event: string,
                            properties: Record<string, unknown>
                        ) => void;
                    };
                }
            ).posthog
        ) {
            (
                window as Window & {
                    posthog: {
                        capture: (
                            event: string,
                            properties: Record<string, unknown>
                        ) => void;
                    };
                }
            ).posthog.capture(event, dashboardEvent.properties);
        }

        // Send to custom analytics endpoint
        this.sendToAnalyticsService(dashboardEvent);

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Dashboard Analytics:', dashboardEvent);
        }
    }

    private async sendToAnalyticsService(event: DashboardEvent) {
        try {
            if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
                await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(event),
                });
            }
        } catch (error) {
            console.warn('Failed to send analytics event:', error);
        }
    }

    // Feature usage tracking
    trackFeatureUsage(
        featureName: string,
        action: string,
        metadata?: Record<string, unknown>
    ) {
        this.trackEvent('dashboard_feature_usage', {
            feature: featureName,
            action,
            ...metadata,
        });
    }

    // Tab navigation tracking
    trackTabChange(fromTab: string, toTab: string, timeSpent: number) {
        this.trackEvent('dashboard_tab_change', {
            fromTab,
            toTab,
            timeSpent,
        });
    }

    // Error tracking
    trackError(error: Error, context?: Record<string, unknown>) {
        this.trackEvent('dashboard_error', {
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            ...context,
        });
    }

    // Performance tracking
    trackPerformanceMetric(
        metricName: string,
        value: number,
        context?: Record<string, unknown>
    ) {
        this.trackEvent('dashboard_performance', {
            metric: metricName,
            value,
            ...context,
        });
    }

    // User identification
    setUserId(userId: string, userProperties?: Record<string, unknown>) {
        this.userId = userId;

        if (
            typeof window !== 'undefined' &&
            (
                window as Window & {
                    posthog?: {
                        identify: (
                            userId: string,
                            properties?: Record<string, unknown>
                        ) => void;
                    };
                }
            ).posthog
        ) {
            (
                window as Window & {
                    posthog: {
                        identify: (
                            userId: string,
                            properties?: Record<string, unknown>
                        ) => void;
                    };
                }
            ).posthog.identify(userId, userProperties);
        }

        this.trackEvent('dashboard_user_identified', {
            userId,
            ...userProperties,
        });
    }

    // A/B testing support
    trackExperiment(
        experimentName: string,
        variant: string,
        metadata?: Record<string, unknown>
    ) {
        this.trackEvent('dashboard_experiment', {
            experiment: experimentName,
            variant,
            ...metadata,
        });
    }

    // Conversion tracking
    trackConversion(
        conversionType: string,
        value?: number,
        metadata?: Record<string, unknown>
    ) {
        this.trackEvent('dashboard_conversion', {
            type: conversionType,
            value,
            ...metadata,
        });
    }

    // Get analytics summary
    getAnalyticsSummary(): DashboardMetrics {
        const now = Date.now();
        const sessionDuration = now - this.sessionStart;

        const pageViewEvents = this.events.filter(
            (e) => e.event === 'dashboard_page_view'
        );
        const errorEvents = this.events.filter(
            (e) => e.event === 'dashboard_error'
        );
        const featureEvents = this.events.filter(
            (e) => e.event === 'dashboard_feature_usage'
        );

        const featureUsage = featureEvents.reduce(
            (acc, event) => {
                const feature = event.properties.feature;
                acc[feature] = (acc[feature] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const performanceEvents = this.events.filter(
            (e) =>
                e.event.includes('dashboard_') &&
                (e.event.includes('_lcp') ||
                    e.event.includes('_fid') ||
                    e.event.includes('_cls') ||
                    e.event.includes('_load'))
        );

        const avgLoadTime =
            performanceEvents
                .filter((e) => e.event === 'dashboard_load_complete')
                .reduce((sum, e) => sum + (e.properties.loadTime || 0), 0) /
            Math.max(
                1,
                performanceEvents.filter(
                    (e) => e.event === 'dashboard_load_complete'
                ).length
            );

        return {
            pageViews: pageViewEvents.length,
            uniqueUsers: new Set(
                this.events.map((e) => e.userId).filter(Boolean)
            ).size,
            sessionDuration,
            bounceRate: pageViewEvents.length === 1 ? 1 : 0,
            featureUsage,
            errorRate: errorEvents.length / Math.max(1, this.events.length),
            performanceMetrics: {
                loadTime: avgLoadTime,
                renderTime: 0, // TODO: Implement render time tracking
                interactionTime: 0, // TODO: Implement interaction time tracking
            },
        };
    }

    // Export analytics data
    exportAnalyticsData(): string {
        return JSON.stringify(
            {
                sessionId: this.sessionId,
                sessionStart: this.sessionStart,
                sessionDuration: Date.now() - this.sessionStart,
                userId: this.userId,
                events: this.events,
                summary: this.getAnalyticsSummary(),
            },
            null,
            2
        );
    }

    // Clear analytics data
    clearAnalyticsData() {
        this.events = [];
        this.sessionStart = Date.now();
    }
}

// Singleton instance
export const dashboardAnalytics = new DashboardAnalytics();

// React hook for dashboard analytics
export const useDashboardAnalytics = () => {
    return {
        trackEvent: (event: string, properties?: Record<string, unknown>) =>
            dashboardAnalytics.trackEvent(event, properties),

        trackFeatureUsage: (
            feature: string,
            action: string,
            metadata?: Record<string, unknown>
        ) => dashboardAnalytics.trackFeatureUsage(feature, action, metadata),

        trackTabChange: (fromTab: string, toTab: string, timeSpent: number) =>
            dashboardAnalytics.trackTabChange(fromTab, toTab, timeSpent),

        trackError: (error: Error, context?: Record<string, unknown>) =>
            dashboardAnalytics.trackError(error, context),

        trackPerformanceMetric: (
            metric: string,
            value: number,
            context?: Record<string, unknown>
        ) => dashboardAnalytics.trackPerformanceMetric(metric, value, context),

        setUserId: (userId: string, properties?: Record<string, unknown>) =>
            dashboardAnalytics.setUserId(userId, properties),

        trackExperiment: (
            experiment: string,
            variant: string,
            metadata?: Record<string, unknown>
        ) => dashboardAnalytics.trackExperiment(experiment, variant, metadata),

        trackConversion: (
            type: string,
            value?: number,
            metadata?: Record<string, unknown>
        ) => dashboardAnalytics.trackConversion(type, value, metadata),

        getAnalyticsSummary: () => dashboardAnalytics.getAnalyticsSummary(),

        exportAnalyticsData: () => dashboardAnalytics.exportAnalyticsData(),
    };
};

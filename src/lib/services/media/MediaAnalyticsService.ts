/**
 * MediaAnalyticsService - Comprehensive analytics and monitoring for media search
 * Tracks user behavior, search patterns, provider performance, and system metrics
 */

export interface SearchAnalyticsEvent {
    eventType: 'search_initiated' | 'search_completed' | 'search_failed';
    query: string;
    filters?: Record<string, any>;
    providers: string[];
    resultCount?: number;
    responseTime?: number;
    timestamp: number;
    userId?: string;
    sessionId: string;
    eventCategory?: string;
}

export interface SelectionAnalyticsEvent {
    eventType:
        | 'media_selected'
        | 'media_deselected'
        | 'media_previewed'
        | 'media_downloaded';
    mediaId: string;
    providerId: string;
    query: string;
    position: number;
    mediaType: 'image' | 'video';
    timestamp: number;
    userId?: string;
    sessionId: string;
}

export interface ProviderPerformanceMetric {
    providerId: string;
    responseTime: number;
    success: boolean;
    errorType?: string;
    resultCount?: number;
    timestamp: number;
    endpoint: string;
}

export interface UsageAnalyticsEvent {
    eventType:
        | 'modal_opened'
        | 'modal_closed'
        | 'filter_applied'
        | 'page_loaded'
        | 'download_completed';
    duration?: number;
    metadata?: Record<string, any>;
    timestamp: number;
    userId?: string;
    sessionId: string;
}

export interface PerformanceMetric {
    metricType:
        | 'search_response_time'
        | 'download_speed'
        | 'image_processing_time'
        | 'ui_render_time';
    value: number;
    unit: 'ms' | 'bytes_per_second' | 'items_per_second';
    metadata?: Record<string, any>;
    timestamp: number;
    sessionId: string;
}

export interface ABTestEvent {
    testId: string;
    variant: string;
    eventType: 'exposure' | 'conversion' | 'interaction';
    metadata?: Record<string, any>;
    timestamp: number;
    userId?: string;
    sessionId: string;
}

class MediaAnalyticsService {
    private static instance: MediaAnalyticsService;
    private sessionId: string;
    private userId?: string;
    private analyticsQueue: any[] = [];
    private performanceObserver?: PerformanceObserver;
    private isEnabled: boolean = true;

    private constructor() {
        this.sessionId = this.generateSessionId();
        this.initializePerformanceMonitoring();
        this.startBatchProcessor();
    }

    static getInstance(): MediaAnalyticsService {
        if (!MediaAnalyticsService.instance) {
            MediaAnalyticsService.instance = new MediaAnalyticsService();
        }
        return MediaAnalyticsService.instance;
    }

    /**
     * Initialize the analytics service with user context
     */
    initialize(userId?: string, config?: { enabled?: boolean }): void {
        this.userId = userId;
        this.isEnabled = config?.enabled ?? true;

        if (this.isEnabled) {
            this.trackUsageEvent({
                eventType: 'modal_opened',
                timestamp: Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
            });
        }
    }

    /**
     * Track search analytics events
     */
    trackSearchEvent(
        event: Omit<SearchAnalyticsEvent, 'timestamp' | 'sessionId' | 'userId'>
    ): void {
        if (!this.isEnabled) return;

        const analyticsEvent: SearchAnalyticsEvent = {
            ...event,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
        };

        this.queueEvent('search_analytics', analyticsEvent);
    }

    /**
     * Track media selection and interaction events
     */
    trackSelectionEvent(
        event: Omit<
            SelectionAnalyticsEvent,
            'timestamp' | 'sessionId' | 'userId'
        >
    ): void {
        if (!this.isEnabled) return;

        const analyticsEvent: SelectionAnalyticsEvent = {
            ...event,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
        };

        this.queueEvent('selection_analytics', analyticsEvent);
    }

    /**
     * Track provider performance metrics
     */
    trackProviderPerformance(
        metric: Omit<ProviderPerformanceMetric, 'timestamp'>
    ): void {
        if (!this.isEnabled) return;

        const performanceMetric: ProviderPerformanceMetric = {
            ...metric,
            timestamp: Date.now(),
        };

        this.queueEvent('provider_performance', performanceMetric);
    }

    /**
     * Track general usage analytics
     */
    trackUsageEvent(
        event: Omit<UsageAnalyticsEvent, 'timestamp' | 'sessionId' | 'userId'>
    ): void {
        if (!this.isEnabled) return;

        const analyticsEvent: UsageAnalyticsEvent = {
            ...event,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
        };

        this.queueEvent('usage_analytics', analyticsEvent);
    }

    /**
     * Track performance metrics
     */
    trackPerformanceMetric(
        metric: Omit<PerformanceMetric, 'timestamp' | 'sessionId'>
    ): void {
        if (!this.isEnabled) return;

        const performanceMetric: PerformanceMetric = {
            ...metric,
            timestamp: Date.now(),
            sessionId: this.sessionId,
        };

        this.queueEvent('performance_metrics', performanceMetric);
    }

    /**
     * Track A/B test events
     */
    trackABTestEvent(
        event: Omit<ABTestEvent, 'timestamp' | 'sessionId' | 'userId'>
    ): void {
        if (!this.isEnabled) return;

        const abTestEvent: ABTestEvent = {
            ...event,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
        };

        this.queueEvent('ab_test', abTestEvent);
    }

    /**
     * Get analytics summary for debugging/monitoring
     */
    getAnalyticsSummary(): {
        sessionId: string;
        userId?: string;
        queueSize: number;
        isEnabled: boolean;
        uptime: number;
    } {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            queueSize: this.analyticsQueue.length,
            isEnabled: this.isEnabled,
            uptime: Date.now() - this.sessionStartTime,
        };
    }

    /**
     * Flush all queued analytics events immediately
     */
    async flush(): Promise<void> {
        if (this.analyticsQueue.length > 0) {
            await this.processBatch();
        }
    }

    /**
     * Disable analytics tracking
     */
    disable(): void {
        this.isEnabled = false;
        this.analyticsQueue = [];
    }

    // Private methods

    private sessionStartTime = Date.now();

    private generateSessionId(): string {
        return `media_search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private queueEvent(category: string, event: any): void {
        this.analyticsQueue.push({
            category,
            event,
            queuedAt: Date.now(),
        });

        // Auto-flush if queue gets too large
        if (this.analyticsQueue.length >= 50) {
            this.processBatch();
        }
    }

    private initializePerformanceMonitoring(): void {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.name.includes('media-search')) {
                            this.trackPerformanceMetric({
                                metricType: 'ui_render_time',
                                value: entry.duration,
                                unit: 'ms',
                                metadata: {
                                    entryName: entry.name,
                                    entryType: entry.entryType,
                                },
                            });
                        }
                    });
                });

                this.performanceObserver.observe({
                    entryTypes: ['measure', 'navigation'],
                });
            } catch (error) {
                console.warn('Performance monitoring not available:', error);
            }
        }
    }

    private startBatchProcessor(): void {
        // Process analytics queue every 30 seconds
        setInterval(() => {
            if (this.analyticsQueue.length > 0) {
                this.processBatch();
            }
        }, 30000);

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flush();
            });
        }
    }

    private async processBatch(): Promise<void> {
        if (this.analyticsQueue.length === 0) return;

        const batch = [...this.analyticsQueue];
        this.analyticsQueue = [];

        try {
            // Send to analytics endpoint
            await this.sendAnalyticsBatch(batch);
        } catch (error) {
            console.debug('Failed to send analytics batch:', error);
            // Re-queue failed events (with limit to prevent infinite growth)
            if (this.analyticsQueue.length < 100) {
                this.analyticsQueue.unshift(...batch.slice(0, 50));
            }
        }
    }

    private async sendAnalyticsBatch(batch: any[]): Promise<void> {
        // In a real implementation, this would send to your analytics service
        // For now, we'll log to console in development and send to a mock endpoint

        if (process.env.NODE_ENV === 'development') {
            console.group('📊 Media Search Analytics Batch');
            batch.forEach(({ category, event }) => {
                console.log(`[${category}]`, event);
            });
            console.groupEnd();
        }

        // Send to analytics endpoint
        try {
            const response = await fetch('/api/analytics/media-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    batch,
                    sessionId: this.sessionId,
                    timestamp: Date.now(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Analytics API error: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local storage for offline scenarios
            this.storeAnalyticsLocally(batch);
            throw error;
        }
    }

    private storeAnalyticsLocally(batch: any[]): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored =
                    localStorage.getItem('media_search_analytics') || '[]';
                const existing = JSON.parse(stored);
                const updated = [...existing, ...batch].slice(-500); // Keep last 500 events
                localStorage.setItem(
                    'media_search_analytics',
                    JSON.stringify(updated)
                );
            } catch (error) {
                console.warn('Failed to store analytics locally:', error);
            }
        }
    }
}

export default MediaAnalyticsService;

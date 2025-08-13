interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
}

interface ErrorEvent {
    message: string;
    stack?: string;
    component?: string;
    action?: string;
    timestamp: number;
    userId?: string;
    sessionId: string;
    metadata?: Record<string, any>;
}

interface UserBehaviorEvent {
    event: string;
    component: string;
    action: string;
    timestamp: number;
    duration?: number;
    metadata?: Record<string, any>;
}

interface FormMetrics {
    formId: string;
    step: number;
    completionRate: number;
    abandonmentPoint?: string;
    timeSpent: number;
    errors: string[];
    timestamp: number;
}

export class MonitoringService {
    private static instance: MonitoringService;
    private sessionId: string;
    private userId?: string;
    private performanceMetrics: PerformanceMetric[] = [];
    private errorEvents: ErrorEvent[] = [];
    private userBehaviorEvents: UserBehaviorEvent[] = [];
    private formMetrics: FormMetrics[] = [];
    private isEnabled: boolean = true;

    private constructor() {
        this.sessionId = this.generateSessionId();
        this.initializePerformanceObserver();
        this.setupErrorHandlers();
    }

    static getInstance(): MonitoringService {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }

    /**
     * Initialize the monitoring service
     */
    static initialize(userId?: string): MonitoringService {
        const instance = MonitoringService.getInstance();
        instance.userId = userId;
        return instance;
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Set up performance observer for Core Web Vitals
     */
    private initializePerformanceObserver(): void {
        if (
            typeof window === 'undefined' ||
            !('PerformanceObserver' in window)
        ) {
            return;
        }

        try {
            // Observe Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    this.recordPerformanceMetric({
                        name: entry.name,
                        value: entry.startTime,
                        timestamp: Date.now(),
                        metadata: {
                            entryType: entry.entryType,
                            duration: (entry as any).duration,
                        },
                    });
                });
            });

            observer.observe({
                entryTypes: ['navigation', 'paint', 'largest-contentful-paint'],
            });

            // Observe layout shifts
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                list.getEntries().forEach((entry) => {
                    if (!(entry as any).hadRecentInput) {
                        clsValue += (entry as any).value;
                    }
                });

                if (clsValue > 0) {
                    this.recordPerformanceMetric({
                        name: 'cumulative-layout-shift',
                        value: clsValue,
                        timestamp: Date.now(),
                    });
                }
            });

            clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
            console.warn('Failed to initialize performance observer:', error);
        }
    }

    /**
     * Set up global error handlers
     */
    private setupErrorHandlers(): void {
        if (typeof window === 'undefined') return;

        // Handle unhandled errors
        window.addEventListener('error', (event) => {
            this.recordError({
                message: event.message,
                stack: event.error?.stack,
                component: 'global',
                action: 'unhandled_error',
                timestamp: Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
                metadata: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                },
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                component: 'global',
                action: 'unhandled_rejection',
                timestamp: Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
                metadata: {
                    reason: event.reason,
                },
            });
        });
    }

    /**
     * Record performance metric
     */
    recordPerformanceMetric(metric: PerformanceMetric): void {
        if (!this.isEnabled) return;

        this.performanceMetrics.push(metric);

        // Send to analytics if available
        this.sendToAnalytics('performance', metric);

        // Keep only last 100 metrics to prevent memory leaks
        if (this.performanceMetrics.length > 100) {
            this.performanceMetrics = this.performanceMetrics.slice(-100);
        }
    }

    /**
     * Record error event
     */
    recordError(error: ErrorEvent): void {
        if (!this.isEnabled) return;

        this.errorEvents.push(error);

        // Send to analytics
        this.sendToAnalytics('error', error);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('MonitoringService Error:', error);
        }

        // Keep only last 50 errors
        if (this.errorEvents.length > 50) {
            this.errorEvents = this.errorEvents.slice(-50);
        }
    }

    /**
     * Record user behavior event
     */
    recordUserBehavior(event: Omit<UserBehaviorEvent, 'timestamp'>): void {
        if (!this.isEnabled) return;

        const behaviorEvent: UserBehaviorEvent = {
            ...event,
            timestamp: Date.now(),
        };

        this.userBehaviorEvents.push(behaviorEvent);

        // Send to analytics
        this.sendToAnalytics('user_behavior', behaviorEvent);

        // Keep only last 200 events
        if (this.userBehaviorEvents.length > 200) {
            this.userBehaviorEvents = this.userBehaviorEvents.slice(-200);
        }
    }

    /**
     * Record form metrics
     */
    recordFormMetrics(metrics: FormMetrics): void {
        if (!this.isEnabled) return;

        this.formMetrics.push(metrics);

        // Send to analytics
        this.sendToAnalytics('form_metrics', metrics);

        // Keep only last 20 form sessions
        if (this.formMetrics.length > 20) {
            this.formMetrics = this.formMetrics.slice(-20);
        }
    }

    /**
     * Track event creation workflow step
     */
    trackEventCreationStep(
        step: number,
        action: string,
        metadata?: Record<string, any>
    ): void {
        this.recordUserBehavior({
            event: 'event_creation_step',
            component: 'CreateEvent',
            action: `step_${step}_${action}`,
            metadata: {
                step,
                ...metadata,
            },
        });
    }

    /**
     * Track form completion rate
     */
    trackFormCompletion(
        formId: string,
        step: number,
        totalSteps: number,
        timeSpent: number,
        errors: string[] = []
    ): void {
        const completionRate = (step / totalSteps) * 100;

        this.recordFormMetrics({
            formId,
            step,
            completionRate,
            timeSpent,
            errors,
            timestamp: Date.now(),
        });
    }

    /**
     * Track form abandonment
     */
    trackFormAbandonment(
        formId: string,
        step: number,
        totalSteps: number,
        abandonmentPoint: string,
        timeSpent: number
    ): void {
        const completionRate = (step / totalSteps) * 100;

        this.recordFormMetrics({
            formId,
            step,
            completionRate,
            abandonmentPoint,
            timeSpent,
            errors: [],
            timestamp: Date.now(),
        });

        this.recordUserBehavior({
            event: 'form_abandonment',
            component: 'CreateEvent',
            action: 'abandon',
            metadata: {
                formId,
                step,
                abandonmentPoint,
                completionRate,
                timeSpent,
            },
        });
    }

    /**
     * Track API performance
     */
    trackApiCall(
        endpoint: string,
        method: string,
        duration: number,
        success: boolean,
        statusCode?: number,
        errorMessage?: string
    ): void {
        this.recordPerformanceMetric({
            name: `api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`,
            value: duration,
            timestamp: Date.now(),
            metadata: {
                endpoint,
                method,
                success,
                statusCode,
                errorMessage,
            },
        });

        if (!success && errorMessage) {
            this.recordError({
                message: `API Error: ${errorMessage}`,
                component: 'EventCreationService',
                action: `${method} ${endpoint}`,
                timestamp: Date.now(),
                sessionId: this.sessionId,
                userId: this.userId,
                metadata: {
                    endpoint,
                    method,
                    statusCode,
                },
            });
        }
    }

    /**
     * Track image upload performance
     */
    trackImageUpload(
        fileSize: number,
        duration: number,
        success: boolean,
        compressionRatio?: number,
        errorMessage?: string
    ): void {
        this.recordPerformanceMetric({
            name: 'image_upload',
            value: duration,
            timestamp: Date.now(),
            metadata: {
                fileSize,
                success,
                compressionRatio,
                errorMessage,
            },
        });

        this.recordUserBehavior({
            event: 'image_upload',
            component: 'ImageUpload',
            action: success ? 'upload_success' : 'upload_failure',
            duration,
            metadata: {
                fileSize,
                compressionRatio,
                errorMessage,
            },
        });
    }

    /**
     * Send data to analytics service
     */
    private sendToAnalytics(type: string, data: any): void {
        try {
            // Google Analytics 4
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', type, {
                    custom_parameter_1: JSON.stringify(data),
                    session_id: this.sessionId,
                    user_id: this.userId,
                });
            }

            // Custom analytics endpoint (if configured)
            if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
                fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type,
                        data,
                        sessionId: this.sessionId,
                        userId: this.userId,
                        timestamp: Date.now(),
                    }),
                }).catch((error) => {
                    console.warn('Failed to send analytics data:', error);
                });
            }
        } catch (error) {
            console.warn('Failed to send analytics data:', error);
        }
    }

    /**
     * Get performance summary
     */
    getPerformanceSummary(): {
        averageApiResponseTime: number;
        totalErrors: number;
        formCompletionRate: number;
        imageUploadSuccessRate: number;
    } {
        const apiMetrics = this.performanceMetrics.filter((m) =>
            m.name.startsWith('api_')
        );
        const averageApiResponseTime =
            apiMetrics.length > 0
                ? apiMetrics.reduce((sum, m) => sum + m.value, 0) /
                  apiMetrics.length
                : 0;

        const imageUploads = this.userBehaviorEvents.filter(
            (e) => e.event === 'image_upload'
        );
        const successfulUploads = imageUploads.filter(
            (e) => e.action === 'upload_success'
        );
        const imageUploadSuccessRate =
            imageUploads.length > 0
                ? (successfulUploads.length / imageUploads.length) * 100
                : 0;

        const completedForms = this.formMetrics.filter(
            (m) => m.completionRate === 100
        );
        const formCompletionRate =
            this.formMetrics.length > 0
                ? (completedForms.length / this.formMetrics.length) * 100
                : 0;

        return {
            averageApiResponseTime,
            totalErrors: this.errorEvents.length,
            formCompletionRate,
            imageUploadSuccessRate,
        };
    }

    /**
     * Export data for debugging
     */
    exportData(): {
        sessionId: string;
        userId?: string;
        performanceMetrics: PerformanceMetric[];
        errorEvents: ErrorEvent[];
        userBehaviorEvents: UserBehaviorEvent[];
        formMetrics: FormMetrics[];
    } {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            performanceMetrics: [...this.performanceMetrics],
            errorEvents: [...this.errorEvents],
            userBehaviorEvents: [...this.userBehaviorEvents],
            formMetrics: [...this.formMetrics],
        };
    }

    /**
     * Clear all data
     */
    clearData(): void {
        this.performanceMetrics = [];
        this.errorEvents = [];
        this.userBehaviorEvents = [];
        this.formMetrics = [];
    }

    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

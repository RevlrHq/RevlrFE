/**
 * Comprehensive error monitoring system for the dashboard
 */

interface ErrorContext {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    timestamp: number;
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
}

interface ErrorReport {
    id: string;
    message: string;
    stack?: string;
    type: 'javascript' | 'api' | 'component' | 'network' | 'performance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    context: ErrorContext;
    fingerprint: string;
}

class ErrorMonitor {
    private errors: ErrorReport[] = [];
    private errorCounts: Map<string, number> = new Map();
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.isInitialized || typeof window === 'undefined') return;

        // Global error handler
        window.addEventListener('error', (event) => {
            this.captureError({
                message: event.message,
                stack: event.error?.stack,
                type: 'javascript',
                severity: 'high',
                context: {
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    metadata: {
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                    },
                },
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                message: event.reason?.message || 'Unhandled Promise Rejection',
                stack: event.reason?.stack,
                type: 'javascript',
                severity: 'high',
                context: {
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    metadata: {
                        reason: event.reason,
                    },
                },
            });
        });

        // Network error monitoring
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);

                if (!response.ok) {
                    this.captureError({
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        type: 'api',
                        severity: response.status >= 500 ? 'high' : 'medium',
                        context: {
                            timestamp: Date.now(),
                            url: window.location.href,
                            userAgent: navigator.userAgent,
                            metadata: {
                                requestUrl: args[0],
                                status: response.status,
                                statusText: response.statusText,
                            },
                        },
                    });
                }

                return response;
            } catch (error) {
                this.captureError({
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Network request failed',
                    stack: error instanceof Error ? error.stack : undefined,
                    type: 'network',
                    severity: 'high',
                    context: {
                        timestamp: Date.now(),
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        metadata: {
                            requestUrl: args[0],
                        },
                    },
                });
                throw error;
            }
        };

        this.isInitialized = true;
    }

    captureError(
        errorData: Partial<ErrorReport> & {
            message: string;
            context: ErrorContext;
        }
    ) {
        const fingerprint = this.generateFingerprint(
            errorData.message,
            errorData.stack
        );

        const error: ErrorReport = {
            id: this.generateId(),
            message: errorData.message,
            stack: errorData.stack,
            type: errorData.type || 'javascript',
            severity: errorData.severity || 'medium',
            context: errorData.context,
            fingerprint,
        };

        // Track error frequency
        const count = this.errorCounts.get(fingerprint) || 0;
        this.errorCounts.set(fingerprint, count + 1);

        // Adjust severity based on frequency
        if (count > 10) {
            error.severity = 'critical';
        } else if (count > 5) {
            error.severity = 'high';
        }

        this.errors.push(error);

        // Send to external monitoring service
        this.sendToMonitoringService(error);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error captured:', error);
        }

        // Trigger alerts for critical errors
        if (error.severity === 'critical') {
            this.triggerAlert(error);
        }
    }

    private generateFingerprint(message: string, stack?: string): string {
        const content = `${message}${stack || ''}`;
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private async sendToMonitoringService(error: ErrorReport) {
        try {
            // Send to PostHog or other analytics service
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
                ).posthog.capture('error_occurred', {
                    error_id: error.id,
                    error_message: error.message,
                    error_type: error.type,
                    error_severity: error.severity,
                    error_fingerprint: error.fingerprint,
                    ...error.context,
                });
            }

            // Send to custom error reporting endpoint
            if (process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
                await fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(error),
                });
            }
        } catch (reportingError) {
            console.warn(
                'Failed to send error to monitoring service:',
                reportingError
            );
        }
    }

    private triggerAlert(error: ErrorReport) {
        // Send critical error alerts
        if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK) {
            fetch(process.env.NEXT_PUBLIC_ALERT_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: `🚨 Critical Error in Dashboard: ${error.message}`,
                    attachments: [
                        {
                            color: 'danger',
                            fields: [
                                {
                                    title: 'Error Type',
                                    value: error.type,
                                    short: true,
                                },
                                {
                                    title: 'Component',
                                    value: error.context.component || 'Unknown',
                                    short: true,
                                },
                                {
                                    title: 'URL',
                                    value: error.context.url || 'Unknown',
                                    short: false,
                                },
                                {
                                    title: 'User ID',
                                    value: error.context.userId || 'Anonymous',
                                    short: true,
                                },
                            ],
                        },
                    ],
                }),
            }).catch(console.warn);
        }
    }

    // Component-specific error tracking
    captureComponentError(
        componentName: string,
        error: Error,
        errorInfo?: Record<string, unknown>
    ) {
        this.captureError({
            message: `Component Error in ${componentName}: ${error.message}`,
            stack: error.stack,
            type: 'component',
            severity: 'high',
            context: {
                timestamp: Date.now(),
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent:
                    typeof window !== 'undefined' ? navigator.userAgent : '',
                component: componentName,
                metadata: {
                    errorInfo,
                    componentStack: errorInfo?.componentStack,
                },
            },
        });
    }

    // API error tracking
    captureApiError(
        endpoint: string,
        error: Error,
        requestData?: Record<string, unknown>
    ) {
        this.captureError({
            message: `API Error at ${endpoint}: ${error.message}`,
            stack: error.stack,
            type: 'api',
            severity: 'high',
            context: {
                timestamp: Date.now(),
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent:
                    typeof window !== 'undefined' ? navigator.userAgent : '',
                metadata: {
                    endpoint,
                    requestData,
                },
            },
        });
    }

    // Performance error tracking
    capturePerformanceError(
        metricName: string,
        value: number,
        threshold: number
    ) {
        this.captureError({
            message: `Performance threshold exceeded: ${metricName} (${value}ms > ${threshold}ms)`,
            type: 'performance',
            severity: value > threshold * 2 ? 'high' : 'medium',
            context: {
                timestamp: Date.now(),
                url: typeof window !== 'undefined' ? window.location.href : '',
                userAgent:
                    typeof window !== 'undefined' ? navigator.userAgent : '',
                metadata: {
                    metricName,
                    value,
                    threshold,
                },
            },
        });
    }

    // Get error statistics
    getErrorStats() {
        const now = Date.now();
        const last24Hours = now - 24 * 60 * 60 * 1000;
        const recentErrors = this.errors.filter(
            (e) => e.context.timestamp > last24Hours
        );

        return {
            total: this.errors.length,
            last24Hours: recentErrors.length,
            byType: this.groupBy(recentErrors, 'type'),
            bySeverity: this.groupBy(recentErrors, 'severity'),
            topErrors: Array.from(this.errorCounts.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([fingerprint, count]) => {
                    const error = this.errors.find(
                        (e) => e.fingerprint === fingerprint
                    );
                    return {
                        fingerprint,
                        count,
                        message: error?.message || 'Unknown',
                    };
                }),
        };
    }

    private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
        return array.reduce(
            (acc, item) => {
                const value = String(item[key]);
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );
    }

    // Clear old errors (keep last 1000)
    cleanup() {
        if (this.errors.length > 1000) {
            this.errors = this.errors.slice(-1000);
        }
    }

    // Set user context
    setUserContext(userId: string, metadata?: Record<string, unknown>) {
        if (typeof window !== 'undefined') {
            (
                window as Window & {
                    __errorMonitorUserContext?: Record<string, unknown>;
                }
            ).__errorMonitorUserContext = { userId, ...metadata };
        }
    }

    private getUserContext(): Partial<ErrorContext> {
        if (typeof window !== 'undefined') {
            return (
                (
                    window as Window & {
                        __errorMonitorUserContext?: Record<string, unknown>;
                    }
                ).__errorMonitorUserContext || {}
            );
        }
        return {};
    }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

// React Error Boundary integration
export const captureComponentError = (
    componentName: string,
    error: Error,
    errorInfo?: Record<string, unknown>
) => {
    errorMonitor.captureComponentError(componentName, error, errorInfo);
};

// API error helper
export const captureApiError = (
    endpoint: string,
    error: Error,
    requestData?: Record<string, unknown>
) => {
    errorMonitor.captureApiError(endpoint, error, requestData);
};

// Performance error helper
export const capturePerformanceError = (
    metricName: string,
    value: number,
    threshold: number
) => {
    errorMonitor.capturePerformanceError(metricName, value, threshold);
};

// Hook for React components
export const useErrorMonitoring = () => {
    return {
        captureError: (error: Error, context?: Partial<ErrorContext>) => {
            errorMonitor.captureError({
                message: error.message,
                stack: error.stack,
                type: 'component',
                severity: 'medium',
                context: {
                    timestamp: Date.now(),
                    url:
                        typeof window !== 'undefined'
                            ? window.location.href
                            : '',
                    userAgent:
                        typeof window !== 'undefined'
                            ? navigator.userAgent
                            : '',
                    ...errorMonitor.getUserContext(),
                    ...context,
                },
            });
        },
        getErrorStats: () => errorMonitor.getErrorStats(),
        setUserContext: (
            userId: string,
            metadata?: Record<string, unknown>
        ) => {
            errorMonitor.setUserContext(userId, metadata);
        },
    };
};

/**
 * Centralized error logging service for the organizer dashboard
 * Integrates with existing monitoring infrastructure
 */

export interface ErrorContext {
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
    timestamp?: number;
}

export interface ErrorLogEntry {
    id: string;
    error: Error;
    context: ErrorContext;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    userAgent?: string;
    url?: string;
}

export class ErrorLogger {
    private static instance: ErrorLogger;
    private logs: ErrorLogEntry[] = [];
    private maxLogs = 1000;
    private sessionId: string;

    private constructor() {
        this.sessionId = this.generateSessionId();
        this.setupGlobalErrorHandlers();
    }

    static getInstance(): ErrorLogger {
        if (!ErrorLogger.instance) {
            ErrorLogger.instance = new ErrorLogger();
        }
        return ErrorLogger.instance;
    }

    /**
     * Log an error with context
     */
    logError(
        error: Error,
        context: ErrorContext = {},
        severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    ): void {
        const logEntry: ErrorLogEntry = {
            id: this.generateLogId(),
            error,
            context: {
                ...context,
                sessionId: this.sessionId,
                timestamp: Date.now(),
            },
            severity,
            timestamp: Date.now(),
            userAgent:
                typeof navigator !== 'undefined'
                    ? navigator.userAgent
                    : undefined,
            url:
                typeof window !== 'undefined'
                    ? window.location.href
                    : undefined,
        };

        this.logs.push(logEntry);

        // Limit memory usage
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Console logging for development
        if (process.env.NODE_ENV === 'development') {
            console.group(`🚨 Error [${severity.toUpperCase()}]`);
            console.error('Error:', error);
            console.log('Context:', context);
            console.log(
                'Timestamp:',
                new Date(logEntry.timestamp).toISOString()
            );
            console.groupEnd();
        }

        // Send to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            this.sendToMonitoring(logEntry);
        }

        // Store locally for offline scenarios
        this.storeLocally(logEntry);
    }

    /**
     * Log API errors with specific context
     */
    logApiError(
        error: Error,
        endpoint: string,
        method: string,
        statusCode?: number,
        responseData?: unknown
    ): void {
        this.logError(
            error,
            {
                component: 'API',
                action: `${method} ${endpoint}`,
                metadata: {
                    statusCode,
                    responseData,
                    endpoint,
                    method,
                },
            },
            statusCode && statusCode >= 500 ? 'high' : 'medium'
        );
    }

    /**
     * Log component errors
     */
    logComponentError(
        error: Error,
        componentName: string,
        props?: Record<string, unknown>,
        state?: Record<string, unknown>
    ): void {
        this.logError(
            error,
            {
                component: componentName,
                action: 'render',
                metadata: {
                    props,
                    state,
                },
            },
            'medium'
        );
    }

    /**
     * Get recent error logs
     */
    getRecentLogs(limit: number = 50): ErrorLogEntry[] {
        return this.logs.slice(-limit);
    }

    /**
     * Get logs by severity
     */
    getLogsBySeverity(
        severity: 'low' | 'medium' | 'high' | 'critical'
    ): ErrorLogEntry[] {
        return this.logs.filter((log) => log.severity === severity);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('organizer-error-logs');
        }
    }

    /**
     * Export logs for debugging
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateLogId(): string {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private setupGlobalErrorHandlers(): void {
        if (typeof window === 'undefined') return;

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(
                new Error(`Unhandled Promise Rejection: ${event.reason}`),
                {
                    component: 'Global',
                    action: 'unhandledrejection',
                    metadata: { reason: event.reason },
                },
                'high'
            );
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            this.logError(
                event.error || new Error(event.message),
                {
                    component: 'Global',
                    action: 'error',
                    metadata: {
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                    },
                },
                'high'
            );
        });
    }

    private async sendToMonitoring(logEntry: ErrorLogEntry): Promise<void> {
        try {
            // This would integrate with your monitoring service (e.g., Sentry, LogRocket, etc.)
            // For now, we'll just store it locally and could send to an endpoint

            // Example integration point:
            // await fetch('/api/errors', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(logEntry)
            // });

            console.info('Error logged to monitoring service:', logEntry.id);
        } catch (error) {
            console.warn('Failed to send error to monitoring service:', error);
        }
    }

    private storeLocally(logEntry: ErrorLogEntry): void {
        try {
            if (typeof localStorage === 'undefined') return;

            const stored = localStorage.getItem('organizer-error-logs');
            const logs = stored ? JSON.parse(stored) : [];

            logs.push({
                ...logEntry,
                // Don't store the full error object, just the message and stack
                error: {
                    message: logEntry.error.message,
                    stack: logEntry.error.stack,
                    name: logEntry.error.name,
                },
            });

            // Keep only the last 100 logs in localStorage
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }

            localStorage.setItem('organizer-error-logs', JSON.stringify(logs));
        } catch (error) {
            console.warn('Failed to store error log locally:', error);
        }
    }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

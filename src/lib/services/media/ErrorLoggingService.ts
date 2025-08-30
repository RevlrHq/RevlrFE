import {
    MediaProviderError,
    MediaProviderErrorType,
    SearchAnalyticsEvent,
} from '@/types/media-search';
import { ErrorContext, ErrorMetrics } from './ErrorHandlingService';

export interface ErrorLogEntry {
    id: string;
    timestamp: number;
    level: 'error' | 'warn' | 'info' | 'debug';
    category: 'provider' | 'network' | 'user' | 'system';
    error: MediaProviderError;
    context: ErrorContext;
    userAgent?: string;
    sessionId?: string;
    userId?: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
}

export interface ErrorAlert {
    id: string;
    type:
        | 'threshold_exceeded'
        | 'provider_down'
        | 'critical_error'
        | 'pattern_detected';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    timestamp: number;
    affectedProviders: string[];
    errorCount: number;
    timeWindow: number;
    actionRequired: boolean;
    suggestedActions: string[];
}

export interface ErrorPattern {
    id: string;
    pattern: string;
    description: string;
    errorTypes: MediaProviderErrorType[];
    providers: string[];
    frequency: number;
    firstSeen: number;
    lastSeen: number;
    impact: 'low' | 'medium' | 'high';
    resolution?: string;
}

export interface MonitoringConfig {
    enableLogging: boolean;
    enableAlerting: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    maxLogEntries: number;
    alertThresholds: {
        errorRate: number; // errors per minute
        providerFailureRate: number; // percentage
        criticalErrorCount: number;
        patternDetectionWindow: number; // minutes
    };
    retentionPeriod: number; // days
}

/**
 * Comprehensive error logging and monitoring service
 */
export class ErrorLoggingService {
    private logs: ErrorLogEntry[] = [];
    private alerts: ErrorAlert[] = [];
    private patterns: Map<string, ErrorPattern> = new Map();
    private config: MonitoringConfig;
    private alertCallbacks: Array<(alert: ErrorAlert) => void> = [];
    private metricsCollector: ErrorMetricsCollector;

    constructor(config: Partial<MonitoringConfig> = {}) {
        this.config = {
            enableLogging: true,
            enableAlerting: true,
            logLevel: 'warn',
            maxLogEntries: 10000,
            alertThresholds: {
                errorRate: 10, // 10 errors per minute
                providerFailureRate: 50, // 50% failure rate
                criticalErrorCount: 5,
                patternDetectionWindow: 15, // 15 minutes
            },
            retentionPeriod: 7, // 7 days
            ...config,
        };

        this.metricsCollector = new ErrorMetricsCollector();
        this.startPeriodicTasks();
    }

    /**
     * Log an error with context and metadata
     */
    logError(
        error: MediaProviderError,
        context: ErrorContext,
        level: 'error' | 'warn' | 'info' | 'debug' = 'error',
        metadata?: Record<string, any>
    ): void {
        if (!this.config.enableLogging || !this.shouldLog(level)) {
            return;
        }

        const logEntry: ErrorLogEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            level,
            category: this.categorizeError(error),
            error,
            context,
            userAgent:
                typeof window !== 'undefined' ? navigator.userAgent : undefined,
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            stackTrace: this.extractStackTrace(error),
            metadata,
        };

        this.addLogEntry(logEntry);
        this.updateMetrics(logEntry);
        this.detectPatterns(logEntry);
        this.checkAlertThresholds();

        // Console logging for development
        if (process.env.NODE_ENV === 'development') {
            this.consoleLog(logEntry);
        }

        // Send to external monitoring service if configured
        this.sendToExternalService(logEntry);
    }

    /**
     * Log a warning
     */
    logWarning(
        error: MediaProviderError,
        context: ErrorContext,
        metadata?: Record<string, any>
    ): void {
        this.logError(error, context, 'warn', metadata);
    }

    /**
     * Log informational message
     */
    logInfo(
        error: MediaProviderError,
        context: ErrorContext,
        metadata?: Record<string, any>
    ): void {
        this.logError(error, context, 'info', metadata);
    }

    /**
     * Register alert callback
     */
    onAlert(callback: (alert: ErrorAlert) => void): void {
        this.alertCallbacks.push(callback);
    }

    /**
     * Get error logs with filtering
     */
    getLogs(filters?: {
        level?: 'error' | 'warn' | 'info' | 'debug';
        category?: 'provider' | 'network' | 'user' | 'system';
        providerId?: string;
        errorType?: MediaProviderErrorType;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }): ErrorLogEntry[] {
        let filteredLogs = [...this.logs];

        if (filters) {
            if (filters.level) {
                filteredLogs = filteredLogs.filter(
                    (log) => log.level === filters.level
                );
            }
            if (filters.category) {
                filteredLogs = filteredLogs.filter(
                    (log) => log.category === filters.category
                );
            }
            if (filters.providerId) {
                filteredLogs = filteredLogs.filter(
                    (log) => log.error.providerId === filters.providerId
                );
            }
            if (filters.errorType) {
                filteredLogs = filteredLogs.filter(
                    (log) => log.error.type === filters.errorType
                );
            }
            if (filters.startTime) {
                filteredLogs = filteredLogs.filter(
                    (log) => log.timestamp >= filters.startTime!
                );
            }
            if (filters.endTime) {
                filteredLogs = filteredLogs.filter(
                    (log) => log.timestamp <= filters.endTime!
                );
            }
        }

        // Sort by timestamp (newest first)
        filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

        // Apply limit
        if (filters?.limit) {
            filteredLogs = filteredLogs.slice(0, filters.limit);
        }

        return filteredLogs;
    }

    /**
     * Get active alerts
     */
    getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): ErrorAlert[] {
        let alerts = [...this.alerts];

        if (severity) {
            alerts = alerts.filter((alert) => alert.severity === severity);
        }

        return alerts.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get detected error patterns
     */
    getPatterns(): ErrorPattern[] {
        return Array.from(this.patterns.values()).sort(
            (a, b) => b.frequency - a.frequency
        );
    }

    /**
     * Get error metrics and statistics
     */
    getMetrics(): {
        totalErrors: number;
        errorsByLevel: Record<string, number>;
        errorsByType: Record<MediaProviderErrorType, number>;
        errorsByProvider: Record<string, number>;
        errorRate: number; // errors per minute
        topErrors: Array<{ error: string; count: number }>;
        recentTrends: Array<{ timestamp: number; count: number }>;
    } {
        return this.metricsCollector.getMetrics(this.logs);
    }

    /**
     * Clear logs older than retention period
     */
    clearOldLogs(): void {
        const cutoffTime =
            Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000;
        this.logs = this.logs.filter((log) => log.timestamp > cutoffTime);
        this.alerts = this.alerts.filter(
            (alert) => alert.timestamp > cutoffTime
        );
    }

    /**
     * Export logs for analysis
     */
    exportLogs(format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            return this.exportToCsv();
        }
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Generate error report
     */
    generateReport(timeRange: { start: number; end: number }): {
        summary: {
            totalErrors: number;
            uniqueErrors: number;
            affectedProviders: string[];
            errorRate: number;
            criticalErrors: number;
        };
        breakdown: {
            byType: Record<MediaProviderErrorType, number>;
            byProvider: Record<string, number>;
            byHour: Array<{ hour: number; count: number }>;
        };
        patterns: ErrorPattern[];
        recommendations: string[];
    } {
        const logs = this.getLogs({
            startTime: timeRange.start,
            endTime: timeRange.end,
        });

        const summary = {
            totalErrors: logs.length,
            uniqueErrors: new Set(
                logs.map((log) => `${log.error.type}-${log.error.message}`)
            ).size,
            affectedProviders: Array.from(
                new Set(logs.map((log) => log.error.providerId))
            ),
            errorRate:
                logs.length / ((timeRange.end - timeRange.start) / 60000),
            criticalErrors: logs.filter(
                (log) =>
                    log.level === 'error' &&
                    [
                        MediaProviderErrorType.API_KEY_INVALID,
                        MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                    ].includes(log.error.type)
            ).length,
        };

        const breakdown = {
            byType: this.groupBy(logs, (log) => log.error.type),
            byProvider: this.groupBy(logs, (log) => log.error.providerId),
            byHour: this.groupByHour(logs, timeRange),
        };

        const patterns = this.getPatterns().filter(
            (pattern) =>
                pattern.lastSeen >= timeRange.start &&
                pattern.firstSeen <= timeRange.end
        );

        const recommendations = this.generateRecommendations(
            summary,
            breakdown,
            patterns
        );

        return {
            summary,
            breakdown,
            patterns,
            recommendations,
        };
    }

    // Private methods

    private shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
        const levels = ['error', 'warn', 'info', 'debug'];
        const configLevelIndex = levels.indexOf(this.config.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= configLevelIndex;
    }

    private categorizeError(
        error: MediaProviderError
    ): 'provider' | 'network' | 'user' | 'system' {
        switch (error.type) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'network';
            case MediaProviderErrorType.API_KEY_INVALID:
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 'provider';
            case MediaProviderErrorType.SEARCH_FAILED:
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'user';
            default:
                return 'system';
        }
    }

    private addLogEntry(entry: ErrorLogEntry): void {
        this.logs.push(entry);

        // Maintain max log entries
        if (this.logs.length > this.config.maxLogEntries) {
            this.logs.splice(0, this.logs.length - this.config.maxLogEntries);
        }
    }

    private updateMetrics(entry: ErrorLogEntry): void {
        this.metricsCollector.recordError(entry);
    }

    private detectPatterns(entry: ErrorLogEntry): void {
        const recentLogs = this.logs.filter(
            (log) =>
                Date.now() - log.timestamp <
                this.config.alertThresholds.patternDetectionWindow * 60000
        );

        // Pattern: Same error type from multiple providers
        const sameTypeErrors = recentLogs.filter(
            (log) => log.error.type === entry.error.type
        );

        if (sameTypeErrors.length >= 3) {
            const providers = Array.from(
                new Set(sameTypeErrors.map((log) => log.error.providerId))
            );

            if (providers.length >= 2) {
                const patternId = `multi-provider-${entry.error.type}`;
                this.updatePattern(patternId, {
                    pattern: 'Multiple providers experiencing same error type',
                    description: `${entry.error.type} affecting multiple providers`,
                    errorTypes: [entry.error.type],
                    providers,
                    impact: providers.length >= 3 ? 'high' : 'medium',
                });
            }
        }

        // Pattern: Rapid consecutive errors from same provider
        const providerErrors = recentLogs.filter(
            (log) => log.error.providerId === entry.error.providerId
        );

        if (providerErrors.length >= 5) {
            const patternId = `rapid-errors-${entry.error.providerId}`;
            this.updatePattern(patternId, {
                pattern: 'Rapid consecutive errors from provider',
                description: `${entry.error.providerId} experiencing rapid error sequence`,
                errorTypes: Array.from(
                    new Set(providerErrors.map((log) => log.error.type))
                ),
                providers: [entry.error.providerId],
                impact: 'high',
            });
        }
    }

    private updatePattern(
        id: string,
        patternData: Partial<ErrorPattern>
    ): void {
        const existing = this.patterns.get(id);

        if (existing) {
            existing.frequency++;
            existing.lastSeen = Date.now();
            if (patternData.errorTypes) {
                existing.errorTypes = Array.from(
                    new Set([...existing.errorTypes, ...patternData.errorTypes])
                );
            }
            if (patternData.providers) {
                existing.providers = Array.from(
                    new Set([...existing.providers, ...patternData.providers])
                );
            }
        } else {
            this.patterns.set(id, {
                id,
                pattern: patternData.pattern || 'Unknown pattern',
                description: patternData.description || 'Pattern detected',
                errorTypes: patternData.errorTypes || [],
                providers: patternData.providers || [],
                frequency: 1,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                impact: patternData.impact || 'medium',
                ...patternData,
            });
        }
    }

    private checkAlertThresholds(): void {
        if (!this.config.enableAlerting) {
            return;
        }

        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentErrors = this.logs.filter(
            (log) => log.timestamp > oneMinuteAgo
        );

        // Check error rate threshold
        if (recentErrors.length >= this.config.alertThresholds.errorRate) {
            this.createAlert({
                type: 'threshold_exceeded',
                severity: 'high',
                title: 'High Error Rate Detected',
                message: `${recentErrors.length} errors in the last minute`,
                affectedProviders: Array.from(
                    new Set(recentErrors.map((log) => log.error.providerId))
                ),
                errorCount: recentErrors.length,
                timeWindow: 60,
                actionRequired: true,
                suggestedActions: [
                    'Check provider status',
                    'Review network connectivity',
                    'Consider enabling fallback providers',
                ],
            });
        }

        // Check critical error threshold
        const criticalErrors = recentErrors.filter(
            (log) =>
                log.level === 'error' &&
                [
                    MediaProviderErrorType.API_KEY_INVALID,
                    MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                ].includes(log.error.type)
        );

        if (
            criticalErrors.length >=
            this.config.alertThresholds.criticalErrorCount
        ) {
            this.createAlert({
                type: 'critical_error',
                severity: 'critical',
                title: 'Critical Errors Detected',
                message: `${criticalErrors.length} critical errors in the last minute`,
                affectedProviders: Array.from(
                    new Set(criticalErrors.map((log) => log.error.providerId))
                ),
                errorCount: criticalErrors.length,
                timeWindow: 60,
                actionRequired: true,
                suggestedActions: [
                    'Check API key configuration',
                    'Verify provider service status',
                    'Contact provider support if needed',
                ],
            });
        }
    }

    private createAlert(alertData: Omit<ErrorAlert, 'id' | 'timestamp'>): void {
        const alert: ErrorAlert = {
            id: this.generateId(),
            timestamp: Date.now(),
            ...alertData,
        };

        this.alerts.push(alert);

        // Notify callbacks
        this.alertCallbacks.forEach((callback) => {
            try {
                callback(alert);
            } catch (error) {
                console.debug('Error in alert callback:', error);
            }
        });
    }

    private consoleLog(entry: ErrorLogEntry): void {
        const message = `[${entry.level.toUpperCase()}] ${entry.error.providerId}: ${entry.error.message}`;

        switch (entry.level) {
            case 'error':
                console.debug(message, entry);
                break;
            case 'warn':
                console.warn(message, entry);
                break;
            case 'info':
                console.info(message, entry);
                break;
            case 'debug':
                console.debug(message, entry);
                break;
        }
    }

    private sendToExternalService(entry: ErrorLogEntry): void {
        // Implementation would depend on external monitoring service
        // Examples: Sentry, LogRocket, DataDog, etc.

        if (typeof window !== 'undefined' && (window as any).gtag) {
            // Google Analytics example
            (window as any).gtag('event', 'exception', {
                description: entry.error.message,
                fatal: entry.level === 'error',
                custom_map: {
                    provider: entry.error.providerId,
                    error_type: entry.error.type,
                },
            });
        }
    }

    private startPeriodicTasks(): void {
        // Clean up old logs every hour
        setInterval(
            () => {
                this.clearOldLogs();
            },
            60 * 60 * 1000
        );

        // Check for patterns every 5 minutes
        setInterval(
            () => {
                this.detectPatterns(this.logs[this.logs.length - 1]);
            },
            5 * 60 * 1000
        );
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private getSessionId(): string {
        // Implementation would depend on session management
        return 'session-' + Date.now();
    }

    private getUserId(): string | undefined {
        // Implementation would depend on authentication system
        return undefined;
    }

    private extractStackTrace(error: MediaProviderError): string | undefined {
        return error.details?.stack?.join('\n');
    }

    private exportToCsv(): string {
        const headers = [
            'timestamp',
            'level',
            'category',
            'providerId',
            'errorType',
            'message',
            'operation',
            'userAgent',
        ];

        const rows = this.logs.map((log) => [
            new Date(log.timestamp).toISOString(),
            log.level,
            log.category,
            log.error.providerId,
            log.error.type,
            log.error.message,
            log.context.operation,
            log.userAgent || '',
        ]);

        return [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(','))
            .join('\n');
    }

    private groupBy<T>(
        items: T[],
        keyFn: (item: T) => string
    ): Record<string, number> {
        return items.reduce(
            (acc, item) => {
                const key = keyFn(item);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );
    }

    private groupByHour(
        logs: ErrorLogEntry[],
        timeRange: { start: number; end: number }
    ): Array<{ hour: number; count: number }> {
        const hours: Record<number, number> = {};

        logs.forEach((log) => {
            const hour =
                Math.floor(log.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
            hours[hour] = (hours[hour] || 0) + 1;
        });

        return Object.entries(hours)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
            .sort((a, b) => a.hour - b.hour);
    }

    private generateRecommendations(
        summary: any,
        breakdown: any,
        patterns: ErrorPattern[]
    ): string[] {
        const recommendations: string[] = [];

        if (summary.errorRate > 5) {
            recommendations.push(
                'High error rate detected - consider implementing circuit breakers'
            );
        }

        if (summary.criticalErrors > 0) {
            recommendations.push(
                'Critical errors present - verify API key configuration'
            );
        }

        if (patterns.some((p) => p.impact === 'high')) {
            recommendations.push(
                'High-impact error patterns detected - review provider health'
            );
        }

        const topProvider = Object.entries(breakdown.byProvider).sort(
            ([, a], [, b]) => (b as number) - (a as number)
        )[0];

        if (
            topProvider &&
            (topProvider[1] as number) > summary.totalErrors * 0.5
        ) {
            recommendations.push(
                `Provider ${topProvider[0]} has high error rate - consider temporary disable`
            );
        }

        return recommendations;
    }
}

/**
 * Collects and aggregates error metrics
 */
class ErrorMetricsCollector {
    private metrics: Map<string, any> = new Map();

    recordError(entry: ErrorLogEntry): void {
        const key = `${entry.error.type}-${entry.error.providerId}`;
        const existing = this.metrics.get(key) || {
            count: 0,
            firstSeen: entry.timestamp,
            lastSeen: entry.timestamp,
        };

        existing.count++;
        existing.lastSeen = entry.timestamp;

        this.metrics.set(key, existing);
    }

    getMetrics(logs: ErrorLogEntry[]): any {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const recentLogs = logs.filter((log) => log.timestamp > oneHourAgo);

        return {
            totalErrors: logs.length,
            errorsByLevel: this.groupBy(logs, (log) => log.level),
            errorsByType: this.groupBy(logs, (log) => log.error.type),
            errorsByProvider: this.groupBy(logs, (log) => log.error.providerId),
            errorRate: recentLogs.length / 60, // errors per minute
            topErrors: this.getTopErrors(logs),
            recentTrends: this.getTrends(logs),
        };
    }

    private groupBy<T>(
        items: T[],
        keyFn: (item: T) => string
    ): Record<string, number> {
        return items.reduce(
            (acc, item) => {
                const key = keyFn(item);
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );
    }

    private getTopErrors(
        logs: ErrorLogEntry[]
    ): Array<{ error: string; count: number }> {
        const errorCounts = this.groupBy(logs, (log) => log.error.message);

        return Object.entries(errorCounts)
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    private getTrends(
        logs: ErrorLogEntry[]
    ): Array<{ timestamp: number; count: number }> {
        const now = Date.now();
        const trends: Array<{ timestamp: number; count: number }> = [];

        // Group by 10-minute intervals for the last hour
        for (let i = 0; i < 6; i++) {
            const intervalStart = now - (i + 1) * 10 * 60 * 1000;
            const intervalEnd = now - i * 10 * 60 * 1000;

            const count = logs.filter(
                (log) =>
                    log.timestamp >= intervalStart &&
                    log.timestamp < intervalEnd
            ).length;

            trends.unshift({ timestamp: intervalStart, count });
        }

        return trends;
    }
}

/**
 * SignalR Debugging Utilities
 *
 * Provides comprehensive debugging capabilities for the SignalR notification system,
 * including verbose logging, connection state monitoring, and performance tracking.
 */

import {
    SignalRConnectionState,
    SignalRError,
    NotificationMessage,
    ConnectionHealthStatus,
} from '@/types/notifications';

// ============================================================================
// Debug Configuration
// ============================================================================

export interface SignalRDebugConfig {
    enabled: boolean;
    verboseLogging: boolean;
    logToConsole: boolean;
    logToStorage: boolean;
    maxLogEntries: number;
    performanceTracking: boolean;
    connectionMonitoring: boolean;
    errorTracking: boolean;
}

export interface DebugLogEntry {
    id: string;
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    category:
        | 'connection'
        | 'notification'
        | 'error'
        | 'performance'
        | 'auth'
        | 'group';
    message: string;
    data?: unknown;
    connectionId?: string;
    userId?: string;
    duration?: number;
}

export interface PerformanceMetric {
    id: string;
    timestamp: Date;
    operation: string;
    duration: number;
    success: boolean;
    metadata?: Record<string, unknown>;
}

export interface ConnectionEvent {
    id: string;
    timestamp: Date;
    connectionId: string;
    event:
        | 'connecting'
        | 'connected'
        | 'disconnecting'
        | 'disconnected'
        | 'reconnecting';
    previousState?: SignalRConnectionState;
    newState: SignalRConnectionState;
    userId?: string;
    error?: SignalRError;
}

// ============================================================================
// SignalR Debug Logger Class
// ============================================================================

export class SignalRDebugLogger {
    private config: SignalRDebugConfig;
    private logs: DebugLogEntry[] = [];
    private performanceMetrics: PerformanceMetric[] = [];
    private connectionEvents: ConnectionEvent[] = [];
    private activeOperations: Map<
        string,
        { startTime: Date; operation: string }
    > = new Map();

    constructor(config: Partial<SignalRDebugConfig> = {}) {
        this.config = {
            enabled: process.env.NODE_ENV === 'development',
            verboseLogging: process.env.NODE_ENV === 'development',
            logToConsole: true,
            logToStorage: true,
            maxLogEntries: 1000,
            performanceTracking: true,
            connectionMonitoring: true,
            errorTracking: true,
            ...config,
        };

        if (this.config.enabled) {
            this.initializeDebugger();
        }
    }

    // ============================================================================
    // Logging Methods
    // ============================================================================

    /**
     * Logs debug information
     */
    debug(
        category: DebugLogEntry['category'],
        message: string,
        data?: unknown,
        connectionId?: string,
        userId?: string
    ): void {
        this.log('debug', category, message, data, connectionId, userId);
    }

    /**
     * Logs informational messages
     */
    info(
        category: DebugLogEntry['category'],
        message: string,
        data?: unknown,
        connectionId?: string,
        userId?: string
    ): void {
        this.log('info', category, message, data, connectionId, userId);
    }

    /**
     * Logs warning messages
     */
    warn(
        category: DebugLogEntry['category'],
        message: string,
        data?: unknown,
        connectionId?: string,
        userId?: string
    ): void {
        this.log('warn', category, message, data, connectionId, userId);
    }

    /**
     * Logs error messages
     */
    error(
        category: DebugLogEntry['category'],
        message: string,
        data?: unknown,
        connectionId?: string,
        userId?: string
    ): void {
        this.log('error', category, message, data, connectionId, userId);
    }

    /**
     * Core logging method
     */
    private log(
        level: DebugLogEntry['level'],
        category: DebugLogEntry['category'],
        message: string,
        data?: unknown,
        connectionId?: string,
        userId?: string
    ): void {
        if (!this.config.enabled) return;

        const entry: DebugLogEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            level,
            category,
            message,
            data,
            connectionId,
            userId,
        };

        this.addLogEntry(entry);

        if (this.config.logToConsole) {
            this.logToConsole(entry);
        }

        if (this.config.logToStorage) {
            this.logToStorage(entry);
        }
    }

    // ============================================================================
    // Connection Monitoring
    // ============================================================================

    /**
     * Logs connection state changes
     */
    logConnectionStateChange(
        connectionId: string,
        previousState: SignalRConnectionState | undefined,
        newState: SignalRConnectionState,
        userId?: string,
        error?: SignalRError
    ): void {
        if (!this.config.connectionMonitoring) return;

        const event: ConnectionEvent = {
            id: this.generateId(),
            timestamp: new Date(),
            connectionId,
            event: this.mapStateToEvent(newState),
            previousState,
            newState,
            userId,
            error,
        };

        this.connectionEvents.push(event);
        this.trimConnectionEvents();

        this.info(
            'connection',
            `Connection state changed: ${previousState || 'unknown'} -> ${newState}`,
            { connectionId, userId, error },
            connectionId,
            userId
        );
    }

    /**
     * Logs connection attempt
     */
    logConnectionAttempt(connectionId: string, userId?: string): void {
        this.info(
            'connection',
            'Connection attempt started',
            { connectionId, userId },
            connectionId,
            userId
        );
    }

    /**
     * Logs successful connection
     */
    logConnectionSuccess(
        connectionId: string,
        userId?: string,
        duration?: number
    ): void {
        this.info(
            'connection',
            'Connection established successfully',
            { connectionId, userId, duration },
            connectionId,
            userId
        );

        if (duration !== undefined) {
            this.recordPerformanceMetric(
                'connection_establish',
                duration,
                true,
                {
                    connectionId,
                    userId,
                }
            );
        }
    }

    /**
     * Logs connection failure
     */
    logConnectionFailure(
        connectionId: string,
        error: SignalRError,
        userId?: string,
        duration?: number
    ): void {
        this.error(
            'connection',
            'Connection failed',
            { connectionId, error, userId, duration },
            connectionId,
            userId
        );

        if (duration !== undefined) {
            this.recordPerformanceMetric(
                'connection_establish',
                duration,
                false,
                {
                    connectionId,
                    userId,
                    error: error.message,
                }
            );
        }
    }

    // ============================================================================
    // Notification Monitoring
    // ============================================================================

    /**
     * Logs notification received
     */
    logNotificationReceived(
        notification: NotificationMessage,
        connectionId?: string,
        userId?: string
    ): void {
        this.info(
            'notification',
            `Notification received: ${notification.type}`,
            {
                notificationId: notification.id,
                type: notification.type,
                priority: notification.priority,
                title: notification.title,
            },
            connectionId,
            userId
        );
    }

    /**
     * Logs notification processing
     */
    logNotificationProcessing(
        notificationId: string,
        type: string,
        connectionId?: string,
        userId?: string
    ): void {
        this.debug(
            'notification',
            `Processing notification: ${type}`,
            { notificationId, type },
            connectionId,
            userId
        );
    }

    /**
     * Logs notification processing completion
     */
    logNotificationProcessed(
        notificationId: string,
        type: string,
        duration: number,
        success: boolean,
        connectionId?: string,
        userId?: string
    ): void {
        const level = success ? 'info' : 'warn';
        const message = success
            ? `Notification processed successfully: ${type}`
            : `Notification processing failed: ${type}`;

        this.log(
            level,
            'notification',
            message,
            { notificationId, type, duration, success },
            connectionId,
            userId
        );

        this.recordPerformanceMetric(
            'notification_processing',
            duration,
            success,
            {
                notificationId,
                type,
            }
        );
    }

    // ============================================================================
    // Error Monitoring
    // ============================================================================

    /**
     * Logs SignalR errors
     */
    logSignalRError(
        error: SignalRError,
        connectionId?: string,
        userId?: string
    ): void {
        if (!this.config.errorTracking) return;

        this.error(
            'error',
            `SignalR Error [${error.type}]: ${error.message}`,
            {
                errorType: error.type,
                message: error.message,
                canRetry: error.canRetry,
                retryCount: error.retryCount,
                connectionState: error.connectionState,
                originalError: error.originalError?.message,
            },
            connectionId,
            userId
        );
    }

    /**
     * Logs authentication errors
     */
    logAuthenticationError(
        message: string,
        details?: unknown,
        connectionId?: string,
        userId?: string
    ): void {
        this.error(
            'auth',
            `Authentication Error: ${message}`,
            details,
            connectionId,
            userId
        );
    }

    /**
     * Logs group management errors
     */
    logGroupError(
        operation: string,
        groupId: string,
        error: string,
        connectionId?: string,
        userId?: string
    ): void {
        this.error(
            'group',
            `Group ${operation} failed for ${groupId}: ${error}`,
            { operation, groupId, error },
            connectionId,
            userId
        );
    }

    // ============================================================================
    // Performance Tracking
    // ============================================================================

    /**
     * Starts performance tracking for an operation
     */
    startPerformanceTracking(operationId: string, operation: string): void {
        if (!this.config.performanceTracking) return;

        this.activeOperations.set(operationId, {
            startTime: new Date(),
            operation,
        });

        this.debug('performance', `Started tracking: ${operation}`, {
            operationId,
        });
    }

    /**
     * Ends performance tracking for an operation
     */
    endPerformanceTracking(
        operationId: string,
        success: boolean = true,
        metadata?: Record<string, unknown>
    ): number | undefined {
        if (!this.config.performanceTracking) return;

        const activeOp = this.activeOperations.get(operationId);
        if (!activeOp) {
            this.warn(
                'performance',
                `No active operation found for ID: ${operationId}`
            );
            return;
        }

        const duration = Date.now() - activeOp.startTime.getTime();
        this.activeOperations.delete(operationId);

        this.recordPerformanceMetric(
            activeOp.operation,
            duration,
            success,
            metadata
        );

        this.debug(
            'performance',
            `Completed tracking: ${activeOp.operation} (${duration}ms)`,
            { operationId, duration, success, metadata }
        );

        return duration;
    }

    /**
     * Records a performance metric
     */
    private recordPerformanceMetric(
        operation: string,
        duration: number,
        success: boolean,
        metadata?: Record<string, unknown>
    ): void {
        const metric: PerformanceMetric = {
            id: this.generateId(),
            timestamp: new Date(),
            operation,
            duration,
            success,
            metadata,
        };

        this.performanceMetrics.push(metric);
        this.trimPerformanceMetrics();
    }

    // ============================================================================
    // Data Retrieval Methods
    // ============================================================================

    /**
     * Gets all debug logs
     */
    getLogs(
        level?: DebugLogEntry['level'],
        category?: DebugLogEntry['category'],
        limit?: number
    ): DebugLogEntry[] {
        let filteredLogs = this.logs;

        if (level) {
            filteredLogs = filteredLogs.filter((log) => log.level === level);
        }

        if (category) {
            filteredLogs = filteredLogs.filter(
                (log) => log.category === category
            );
        }

        if (limit) {
            filteredLogs = filteredLogs.slice(-limit);
        }

        return filteredLogs.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
    }

    /**
     * Gets performance metrics
     */
    getPerformanceMetrics(
        operation?: string,
        limit?: number
    ): PerformanceMetric[] {
        let metrics = this.performanceMetrics;

        if (operation) {
            metrics = metrics.filter(
                (metric) => metric.operation === operation
            );
        }

        if (limit) {
            metrics = metrics.slice(-limit);
        }

        return metrics.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
    }

    /**
     * Gets connection events
     */
    getConnectionEvents(
        connectionId?: string,
        limit?: number
    ): ConnectionEvent[] {
        let events = this.connectionEvents;

        if (connectionId) {
            events = events.filter(
                (event) => event.connectionId === connectionId
            );
        }

        if (limit) {
            events = events.slice(-limit);
        }

        return events.sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
    }

    /**
     * Gets debug statistics
     */
    getStatistics(): {
        totalLogs: number;
        logsByLevel: Record<string, number>;
        logsByCategory: Record<string, number>;
        totalPerformanceMetrics: number;
        averageOperationTime: Record<string, number>;
        totalConnectionEvents: number;
        errorRate: number;
    } {
        const logsByLevel = this.logs.reduce(
            (acc, log) => {
                acc[log.level] = (acc[log.level] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const logsByCategory = this.logs.reduce(
            (acc, log) => {
                acc[log.category] = (acc[log.category] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const averageOperationTime = this.performanceMetrics.reduce(
            (acc, metric) => {
                if (!acc[metric.operation]) {
                    acc[metric.operation] = { total: 0, count: 0 };
                }
                acc[metric.operation].total += metric.duration;
                acc[metric.operation].count += 1;
                return acc;
            },
            {} as Record<string, { total: number; count: number }>
        );

        const avgTimes = Object.entries(averageOperationTime).reduce(
            (acc, [op, data]) => {
                acc[op] = data.total / data.count;
                return acc;
            },
            {} as Record<string, number>
        );

        const errorLogs = this.logs.filter(
            (log) => log.level === 'error'
        ).length;
        const errorRate =
            this.logs.length > 0 ? errorLogs / this.logs.length : 0;

        return {
            totalLogs: this.logs.length,
            logsByLevel,
            logsByCategory,
            totalPerformanceMetrics: this.performanceMetrics.length,
            averageOperationTime: avgTimes,
            totalConnectionEvents: this.connectionEvents.length,
            errorRate,
        };
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Clears all debug data
     */
    clear(): void {
        this.logs = [];
        this.performanceMetrics = [];
        this.connectionEvents = [];
        this.activeOperations.clear();

        this.info('debug', 'Debug data cleared');
    }

    /**
     * Exports debug data
     */
    exportData(): {
        logs: DebugLogEntry[];
        performanceMetrics: PerformanceMetric[];
        connectionEvents: ConnectionEvent[];
        statistics: ReturnType<SignalRDebugLogger['getStatistics']>;
        exportedAt: Date;
    } {
        return {
            logs: this.logs,
            performanceMetrics: this.performanceMetrics,
            connectionEvents: this.connectionEvents,
            statistics: this.getStatistics(),
            exportedAt: new Date(),
        };
    }

    /**
     * Updates debug configuration
     */
    updateConfig(newConfig: Partial<SignalRDebugConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.info('debug', 'Debug configuration updated', newConfig);
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private initializeDebugger(): void {
        this.info('debug', 'SignalR Debug Logger initialized', this.config);

        // Set up periodic cleanup
        if (typeof window !== 'undefined') {
            setInterval(() => {
                this.trimLogs();
                this.trimPerformanceMetrics();
                this.trimConnectionEvents();
            }, 60000); // Clean up every minute
        }
    }

    private addLogEntry(entry: DebugLogEntry): void {
        this.logs.push(entry);
        this.trimLogs();
    }

    private trimLogs(): void {
        if (this.logs.length > this.config.maxLogEntries) {
            this.logs = this.logs.slice(-this.config.maxLogEntries);
        }
    }

    private trimPerformanceMetrics(): void {
        if (this.performanceMetrics.length > this.config.maxLogEntries) {
            this.performanceMetrics = this.performanceMetrics.slice(
                -this.config.maxLogEntries
            );
        }
    }

    private trimConnectionEvents(): void {
        if (this.connectionEvents.length > this.config.maxLogEntries) {
            this.connectionEvents = this.connectionEvents.slice(
                -this.config.maxLogEntries
            );
        }
    }

    private logToConsole(entry: DebugLogEntry): void {
        const prefix = `[SignalR ${entry.level.toUpperCase()}] [${entry.category}]`;
        const message = `${prefix} ${entry.message}`;

        switch (entry.level) {
            case 'debug':
                console.debug(message, entry.data);
                break;
            case 'info':
                console.info(message, entry.data);
                break;
            case 'warn':
                console.warn(message, entry.data);
                break;
            case 'error':
                console.debug(message, entry.data);
                break;
        }
    }

    private logToStorage(entry: DebugLogEntry): void {
        if (typeof window === 'undefined') return;

        try {
            const storageKey = 'signalr_debug_logs';
            const existingLogs = JSON.parse(
                localStorage.getItem(storageKey) || '[]'
            );
            existingLogs.push({
                ...entry,
                timestamp: entry.timestamp.toISOString(),
            });

            // Keep only the last 500 entries in storage
            const trimmedLogs = existingLogs.slice(-500);
            localStorage.setItem(storageKey, JSON.stringify(trimmedLogs));
        } catch (error) {
            console.warn('Failed to save debug log to storage:', error);
        }
    }

    private mapStateToEvent(
        state: SignalRConnectionState
    ): ConnectionEvent['event'] {
        switch (state) {
            case SignalRConnectionState.Connecting:
                return 'connecting';
            case SignalRConnectionState.Connected:
                return 'connected';
            case SignalRConnectionState.Disconnecting:
                return 'disconnecting';
            case SignalRConnectionState.Disconnected:
                return 'disconnected';
            case SignalRConnectionState.Reconnecting:
                return 'reconnecting';
            default:
                return 'disconnected';
        }
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ============================================================================
// Connection State Monitor
// ============================================================================

export class SignalRConnectionMonitor {
    private healthChecks: Map<string, ConnectionHealthStatus> = new Map();
    private monitoringInterval?: NodeJS.Timeout;
    private logger: SignalRDebugLogger;

    constructor(logger: SignalRDebugLogger) {
        this.logger = logger;
    }

    /**
     * Starts monitoring a connection
     */
    startMonitoring(connectionId: string, pingInterval: number = 30000): void {
        this.logger.info(
            'connection',
            `Started monitoring connection: ${connectionId}`
        );

        const healthStatus: ConnectionHealthStatus = {
            isHealthy: true,
            consecutiveFailures: 0,
            uptime: 0,
        };

        this.healthChecks.set(connectionId, healthStatus);

        // Start periodic health checks
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck(connectionId);
        }, pingInterval);
    }

    /**
     * Stops monitoring a connection
     */
    stopMonitoring(connectionId: string): void {
        this.logger.info(
            'connection',
            `Stopped monitoring connection: ${connectionId}`
        );

        this.healthChecks.delete(connectionId);

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }

    /**
     * Updates connection health status
     */
    updateHealthStatus(
        connectionId: string,
        isHealthy: boolean,
        latency?: number,
        error?: string
    ): void {
        const healthStatus = this.healthChecks.get(connectionId);
        if (!healthStatus) return;

        const now = new Date();

        if (isHealthy) {
            healthStatus.isHealthy = true;
            healthStatus.latency = latency;
            healthStatus.lastPingTime = now;
            healthStatus.consecutiveFailures = 0;
            healthStatus.uptime += 1;
        } else {
            healthStatus.isHealthy = false;
            healthStatus.consecutiveFailures += 1;

            this.logger.warn(
                'connection',
                `Health check failed for connection: ${connectionId}`,
                { consecutiveFailures: healthStatus.consecutiveFailures, error }
            );
        }

        this.healthChecks.set(connectionId, healthStatus);
    }

    /**
     * Gets health status for a connection
     */
    getHealthStatus(connectionId: string): ConnectionHealthStatus | undefined {
        return this.healthChecks.get(connectionId);
    }

    /**
     * Gets health status for all monitored connections
     */
    getAllHealthStatuses(): Map<string, ConnectionHealthStatus> {
        return new Map(this.healthChecks);
    }

    /**
     * Performs a health check on a connection
     */
    private async performHealthCheck(connectionId: string): Promise<void> {
        const startTime = Date.now();

        try {
            // Simulate ping operation (in real implementation, this would ping the SignalR hub)
            await new Promise((resolve) => setTimeout(resolve, 10));

            const latency = Date.now() - startTime;
            this.updateHealthStatus(connectionId, true, latency);

            this.logger.debug(
                'connection',
                `Health check passed for connection: ${connectionId}`,
                { latency }
            );
        } catch (error) {
            this.updateHealthStatus(
                connectionId,
                false,
                undefined,
                String(error)
            );
        }
    }
}

// ============================================================================
// Factory Functions and Default Instance
// ============================================================================

/**
 * Creates a new SignalR debug logger instance
 */
export function createSignalRDebugLogger(
    config: Partial<SignalRDebugConfig> = {}
): SignalRDebugLogger {
    return new SignalRDebugLogger(config);
}

/**
 * Creates a new SignalR connection monitor instance
 */
export function createSignalRConnectionMonitor(
    logger: SignalRDebugLogger
): SignalRConnectionMonitor {
    return new SignalRConnectionMonitor(logger);
}

/**
 * Default debug logger instance
 */
export const signalRDebugLogger = createSignalRDebugLogger();

/**
 * Default connection monitor instance
 */
export const signalRConnectionMonitor =
    createSignalRConnectionMonitor(signalRDebugLogger);

export default SignalRDebugLogger;

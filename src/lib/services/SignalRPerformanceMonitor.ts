/**
 * SignalR Performance Monitor Service
 *
 * This service provides real-time performance monitoring and metrics
 * collection for the SignalR integration, including connection health,
 * notification processing times, memory usage, and user experience metrics.
 *
 * Features:
 * - Real-time performance metrics collection
 * - Connection health monitoring
 * - Memory usage tracking
 * - User experience metrics
 * - Performance alerts and thresholds
 * - Historical data analysis
 * - Performance reporting
 */

import { HubConnectionState } from '@microsoft/signalr';
import type { NotificationMessage } from '@/types/notifications';
import type { SignalRError } from '@/types/signalr';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PerformanceMetrics {
    connection: ConnectionMetrics;
    notifications: NotificationMetrics;
    memory: MemoryMetrics;
    userExperience: UserExperienceMetrics;
    errors: ErrorMetrics;
    timestamp: number;
}

export interface ConnectionMetrics {
    state: HubConnectionState;
    connectionTime: number;
    reconnectionCount: number;
    lastReconnectionTime?: number;
    uptime: number;
    latency: number;
    healthScore: number;
    isStable: boolean;
}

export interface NotificationMetrics {
    totalReceived: number;
    totalProcessed: number;
    totalFailed: number;
    averageProcessingTime: number;
    maxProcessingTime: number;
    minProcessingTime: number;
    throughputPerSecond: number;
    queueSize: number;
    batchingEfficiency: number;
}

export interface MemoryMetrics {
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    notificationHistorySize: number;
    cacheSize: number;
    memoryGrowthRate: number;
    gcFrequency: number;
}

export interface UserExperienceMetrics {
    timeToFirstNotification: number;
    notificationDisplayLatency: number;
    uiResponsiveness: number;
    errorRate: number;
    userSatisfactionScore: number;
    criticalPathPerformance: number;
}

export interface ErrorMetrics {
    totalErrors: number;
    connectionErrors: number;
    authenticationErrors: number;
    networkErrors: number;
    processingErrors: number;
    errorRate: number;
    meanTimeBetweenFailures: number;
    meanTimeToRecovery: number;
}

export interface PerformanceAlert {
    id: string;
    type: 'warning' | 'critical';
    category: 'connection' | 'performance' | 'memory' | 'errors';
    message: string;
    threshold: number;
    currentValue: number;
    timestamp: number;
    resolved: boolean;
}

export interface PerformanceThresholds {
    connection: {
        maxLatency: number;
        minHealthScore: number;
        maxReconnectionTime: number;
    };
    notifications: {
        maxProcessingTime: number;
        minThroughput: number;
        maxQueueSize: number;
    };
    memory: {
        maxHeapUsage: number;
        maxGrowthRate: number;
        maxHistorySize: number;
    };
    userExperience: {
        maxDisplayLatency: number;
        minResponsiveness: number;
        maxErrorRate: number;
    };
}

export interface PerformanceReport {
    period: {
        start: number;
        end: number;
        duration: number;
    };
    summary: {
        overallScore: number;
        connectionStability: number;
        processingEfficiency: number;
        memoryEfficiency: number;
        userExperience: number;
    };
    metrics: PerformanceMetrics[];
    alerts: PerformanceAlert[];
    trends: {
        connectionHealth: number[];
        processingTimes: number[];
        memoryUsage: number[];
        errorRates: number[];
    };
    recommendations: string[];
}

// ============================================================================
// Performance Monitor Implementation
// ============================================================================

export class SignalRPerformanceMonitor {
    private static instance: SignalRPerformanceMonitor | null = null;

    private metrics: PerformanceMetrics;
    private historicalMetrics: PerformanceMetrics[] = [];
    private alerts: PerformanceAlert[] = [];
    private thresholds: PerformanceThresholds;
    private startTime: number;
    private isMonitoring: boolean = false;
    private monitoringInterval: NodeJS.Timeout | null = null;

    // Performance tracking state
    private connectionStartTime: number = 0;
    private notificationProcessingTimes: number[] = [];
    private errorHistory: { timestamp: number; type: string }[] = [];
    private memorySnapshots: { timestamp: number; usage: number }[] = [];

    // Event listeners
    private listeners: {
        onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
        onAlert?: (alert: PerformanceAlert) => void;
        onThresholdExceeded?: (
            category: string,
            metric: string,
            value: number
        ) => void;
    } = {};

    private constructor() {
        this.startTime = Date.now();
        this.metrics = this.initializeMetrics();
        this.thresholds = this.getDefaultThresholds();
    }

    public static getInstance(): SignalRPerformanceMonitor {
        if (!SignalRPerformanceMonitor.instance) {
            SignalRPerformanceMonitor.instance =
                new SignalRPerformanceMonitor();
        }
        return SignalRPerformanceMonitor.instance;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    public startMonitoring(interval: number = 5000): void {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkThresholds();
            this.cleanupOldData();
        }, interval);

        console.log('📊 SignalR Performance Monitor started');
    }

    public stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log('📊 SignalR Performance Monitor stopped');
    }

    public getCurrentMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public getHistoricalMetrics(limit?: number): PerformanceMetrics[] {
        return limit
            ? this.historicalMetrics.slice(-limit)
            : [...this.historicalMetrics];
    }

    public getActiveAlerts(): PerformanceAlert[] {
        return this.alerts.filter((alert) => !alert.resolved);
    }

    public getAllAlerts(): PerformanceAlert[] {
        return [...this.alerts];
    }

    public setThresholds(thresholds: Partial<PerformanceThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    public setEventListeners(listeners: Partial<typeof this.listeners>): void {
        this.listeners = { ...this.listeners, ...listeners };
    }

    // ========================================================================
    // Event Tracking Methods
    // ========================================================================

    public trackConnectionStart(): void {
        this.connectionStartTime = Date.now();
        this.metrics.connection.state = HubConnectionState.Connecting;
    }

    public trackConnectionEstablished(connectionId?: string): void {
        const connectionTime = Date.now() - this.connectionStartTime;
        this.metrics.connection.connectionTime = connectionTime;
        this.metrics.connection.state = HubConnectionState.Connected;
        this.metrics.connection.uptime = Date.now() - this.startTime;
        this.metrics.connection.isStable = true;
    }

    public trackConnectionLost(): void {
        this.metrics.connection.state = HubConnectionState.Disconnected;
        this.metrics.connection.isStable = false;
    }

    public trackReconnection(): void {
        this.metrics.connection.reconnectionCount++;
        this.metrics.connection.lastReconnectionTime = Date.now();
        this.metrics.connection.state = HubConnectionState.Reconnecting;
    }

    public trackLatency(latency: number): void {
        this.metrics.connection.latency = latency;
        this.updateHealthScore();
    }

    public trackNotificationReceived(notification: NotificationMessage): void {
        this.metrics.notifications.totalReceived++;

        // Track time to first notification
        if (this.metrics.userExperience.timeToFirstNotification === 0) {
            this.metrics.userExperience.timeToFirstNotification =
                Date.now() - this.startTime;
        }
    }

    public trackNotificationProcessed(
        processingTime: number,
        success: boolean
    ): void {
        if (success) {
            this.metrics.notifications.totalProcessed++;
            this.notificationProcessingTimes.push(processingTime);

            // Update processing time statistics
            this.updateProcessingTimeStats();
        } else {
            this.metrics.notifications.totalFailed++;
        }

        // Update throughput
        this.updateThroughput();

        // Update user experience metrics
        this.metrics.userExperience.notificationDisplayLatency = processingTime;
    }

    public trackError(error: SignalRError): void {
        this.metrics.errors.totalErrors++;
        this.errorHistory.push({ timestamp: Date.now(), type: error.type });

        // Categorize errors
        switch (error.type) {
            case 'connection':
                this.metrics.errors.connectionErrors++;
                break;
            case 'authentication':
                this.metrics.errors.authenticationErrors++;
                break;
            case 'network':
                this.metrics.errors.networkErrors++;
                break;
            default:
                this.metrics.errors.processingErrors++;
        }

        this.updateErrorMetrics();
    }

    public trackMemoryUsage(): void {
        if (
            typeof window !== 'undefined' &&
            'performance' in window &&
            'memory' in window.performance
        ) {
            const memory = (window.performance as any).memory;
            this.metrics.memory.heapUsed = memory.usedJSHeapSize;
            this.metrics.memory.heapTotal = memory.totalJSHeapSize;
            this.metrics.memory.heapLimit = memory.jsHeapSizeLimit;

            this.memorySnapshots.push({
                timestamp: Date.now(),
                usage: memory.usedJSHeapSize,
            });

            this.updateMemoryGrowthRate();
        }
    }

    public trackQueueSize(size: number): void {
        this.metrics.notifications.queueSize = size;
    }

    public trackBatchingEfficiency(efficiency: number): void {
        this.metrics.notifications.batchingEfficiency = efficiency;
    }

    // ========================================================================
    // Reporting Methods
    // ========================================================================

    public generateReport(periodHours: number = 24): PerformanceReport {
        const endTime = Date.now();
        const startTime = endTime - periodHours * 60 * 60 * 1000;

        const periodMetrics = this.historicalMetrics.filter(
            (m) => m.timestamp >= startTime && m.timestamp <= endTime
        );

        const summary = this.calculateSummaryScores(periodMetrics);
        const trends = this.calculateTrends(periodMetrics);
        const recommendations = this.generateRecommendations(periodMetrics);

        return {
            period: {
                start: startTime,
                end: endTime,
                duration: endTime - startTime,
            },
            summary,
            metrics: periodMetrics,
            alerts: this.alerts.filter((a) => a.timestamp >= startTime),
            trends,
            recommendations,
        };
    }

    public exportMetrics(format: 'json' | 'csv' = 'json'): string {
        if (format === 'csv') {
            return this.exportToCSV();
        }

        return JSON.stringify(
            {
                currentMetrics: this.metrics,
                historicalMetrics: this.historicalMetrics,
                alerts: this.alerts,
                thresholds: this.thresholds,
            },
            null,
            2
        );
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private initializeMetrics(): PerformanceMetrics {
        return {
            connection: {
                state: HubConnectionState.Disconnected,
                connectionTime: 0,
                reconnectionCount: 0,
                uptime: 0,
                latency: 0,
                healthScore: 100,
                isStable: false,
            },
            notifications: {
                totalReceived: 0,
                totalProcessed: 0,
                totalFailed: 0,
                averageProcessingTime: 0,
                maxProcessingTime: 0,
                minProcessingTime: Infinity,
                throughputPerSecond: 0,
                queueSize: 0,
                batchingEfficiency: 0,
            },
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                heapLimit: 0,
                notificationHistorySize: 0,
                cacheSize: 0,
                memoryGrowthRate: 0,
                gcFrequency: 0,
            },
            userExperience: {
                timeToFirstNotification: 0,
                notificationDisplayLatency: 0,
                uiResponsiveness: 100,
                errorRate: 0,
                userSatisfactionScore: 100,
                criticalPathPerformance: 100,
            },
            errors: {
                totalErrors: 0,
                connectionErrors: 0,
                authenticationErrors: 0,
                networkErrors: 0,
                processingErrors: 0,
                errorRate: 0,
                meanTimeBetweenFailures: 0,
                meanTimeToRecovery: 0,
            },
            timestamp: Date.now(),
        };
    }

    private getDefaultThresholds(): PerformanceThresholds {
        return {
            connection: {
                maxLatency: 1000, // 1 second
                minHealthScore: 80,
                maxReconnectionTime: 30000, // 30 seconds
            },
            notifications: {
                maxProcessingTime: 100, // 100ms
                minThroughput: 10, // 10 notifications per second
                maxQueueSize: 50,
            },
            memory: {
                maxHeapUsage: 100 * 1024 * 1024, // 100MB
                maxGrowthRate: 10, // 10% per minute
                maxHistorySize: 1000,
            },
            userExperience: {
                maxDisplayLatency: 200, // 200ms
                minResponsiveness: 80,
                maxErrorRate: 5, // 5%
            },
        };
    }

    private collectMetrics(): void {
        // Update timestamp
        this.metrics.timestamp = Date.now();

        // Track memory usage
        this.trackMemoryUsage();

        // Update uptime
        if (this.metrics.connection.state === HubConnectionState.Connected) {
            this.metrics.connection.uptime = Date.now() - this.startTime;
        }

        // Update user experience metrics
        this.updateUserExperienceMetrics();

        // Store historical data
        this.historicalMetrics.push({ ...this.metrics });

        // Notify listeners
        if (this.listeners.onMetricsUpdate) {
            this.listeners.onMetricsUpdate(this.metrics);
        }
    }

    private updateProcessingTimeStats(): void {
        if (this.notificationProcessingTimes.length === 0) return;

        const times = this.notificationProcessingTimes;
        this.metrics.notifications.averageProcessingTime =
            times.reduce((sum, time) => sum + time, 0) / times.length;
        this.metrics.notifications.maxProcessingTime = Math.max(...times);
        this.metrics.notifications.minProcessingTime = Math.min(...times);
    }

    private updateThroughput(): void {
        const now = Date.now();
        const oneSecondAgo = now - 1000;

        // Count notifications processed in the last second
        const recentProcessingTimes = this.notificationProcessingTimes.filter(
            (_, index) => now - index * 100 > oneSecondAgo // Rough estimation
        );

        this.metrics.notifications.throughputPerSecond =
            recentProcessingTimes.length;
    }

    private updateErrorMetrics(): void {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        // Calculate error rate for the last hour
        const recentErrors = this.errorHistory.filter(
            (e) => e.timestamp > oneHourAgo
        );
        const totalOperations =
            this.metrics.notifications.totalReceived +
            this.metrics.notifications.totalProcessed;

        this.metrics.errors.errorRate =
            totalOperations > 0
                ? (recentErrors.length / totalOperations) * 100
                : 0;

        // Update user experience error rate
        this.metrics.userExperience.errorRate = this.metrics.errors.errorRate;
    }

    private updateMemoryGrowthRate(): void {
        if (this.memorySnapshots.length < 2) return;

        const recent = this.memorySnapshots.slice(-2);
        const timeDiff = recent[1].timestamp - recent[0].timestamp;
        const usageDiff = recent[1].usage - recent[0].usage;

        if (timeDiff > 0) {
            this.metrics.memory.memoryGrowthRate =
                (usageDiff / recent[0].usage) * 100;
        }
    }

    private updateHealthScore(): void {
        let score = 100;

        // Deduct points for high latency
        if (
            this.metrics.connection.latency >
            this.thresholds.connection.maxLatency
        ) {
            score -= 20;
        }

        // Deduct points for reconnections
        score -= Math.min(this.metrics.connection.reconnectionCount * 5, 30);

        // Deduct points for errors
        score -= Math.min(this.metrics.errors.errorRate * 2, 40);

        this.metrics.connection.healthScore = Math.max(0, score);
    }

    private updateUserExperienceMetrics(): void {
        // Calculate UI responsiveness based on processing times
        const avgProcessingTime =
            this.metrics.notifications.averageProcessingTime;
        this.metrics.userExperience.uiResponsiveness = Math.max(
            0,
            100 -
                (avgProcessingTime /
                    this.thresholds.notifications.maxProcessingTime) *
                    100
        );

        // Calculate user satisfaction score
        const healthScore = this.metrics.connection.healthScore;
        const responsiveness = this.metrics.userExperience.uiResponsiveness;
        const errorRate = this.metrics.userExperience.errorRate;

        this.metrics.userExperience.userSatisfactionScore =
            healthScore * 0.4 + responsiveness * 0.4 + (100 - errorRate) * 0.2;

        // Update critical path performance
        this.metrics.userExperience.criticalPathPerformance =
            this.metrics.userExperience.timeToFirstNotification > 0
                ? Math.max(
                      0,
                      100 -
                          (this.metrics.userExperience.timeToFirstNotification /
                              5000) *
                              100
                  )
                : 100;
    }

    private checkThresholds(): void {
        const alerts: PerformanceAlert[] = [];

        // Connection thresholds
        if (
            this.metrics.connection.latency >
            this.thresholds.connection.maxLatency
        ) {
            alerts.push(
                this.createAlert(
                    'critical',
                    'connection',
                    'High connection latency detected',
                    this.thresholds.connection.maxLatency,
                    this.metrics.connection.latency
                )
            );
        }

        // Notification processing thresholds
        if (
            this.metrics.notifications.averageProcessingTime >
            this.thresholds.notifications.maxProcessingTime
        ) {
            alerts.push(
                this.createAlert(
                    'warning',
                    'performance',
                    'Slow notification processing detected',
                    this.thresholds.notifications.maxProcessingTime,
                    this.metrics.notifications.averageProcessingTime
                )
            );
        }

        // Memory thresholds
        if (
            this.metrics.memory.heapUsed > this.thresholds.memory.maxHeapUsage
        ) {
            alerts.push(
                this.createAlert(
                    'critical',
                    'memory',
                    'High memory usage detected',
                    this.thresholds.memory.maxHeapUsage,
                    this.metrics.memory.heapUsed
                )
            );
        }

        // Add new alerts
        for (const alert of alerts) {
            this.alerts.push(alert);
            if (this.listeners.onAlert) {
                this.listeners.onAlert(alert);
            }
        }
    }

    private createAlert(
        type: 'warning' | 'critical',
        category: 'connection' | 'performance' | 'memory' | 'errors',
        message: string,
        threshold: number,
        currentValue: number
    ): PerformanceAlert {
        return {
            id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            category,
            message,
            threshold,
            currentValue,
            timestamp: Date.now(),
            resolved: false,
        };
    }

    private calculateSummaryScores(
        metrics: PerformanceMetrics[]
    ): PerformanceReport['summary'] {
        if (metrics.length === 0) {
            return {
                overallScore: 0,
                connectionStability: 0,
                processingEfficiency: 0,
                memoryEfficiency: 0,
                userExperience: 0,
            };
        }

        const avgHealthScore =
            metrics.reduce((sum, m) => sum + m.connection.healthScore, 0) /
            metrics.length;
        const avgProcessingTime =
            metrics.reduce(
                (sum, m) => sum + m.notifications.averageProcessingTime,
                0
            ) / metrics.length;
        const avgMemoryUsage =
            metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) /
            metrics.length;
        const avgUserSatisfaction =
            metrics.reduce(
                (sum, m) => sum + m.userExperience.userSatisfactionScore,
                0
            ) / metrics.length;

        const processingEfficiency = Math.max(
            0,
            100 -
                (avgProcessingTime /
                    this.thresholds.notifications.maxProcessingTime) *
                    100
        );
        const memoryEfficiency = Math.max(
            0,
            100 - (avgMemoryUsage / this.thresholds.memory.maxHeapUsage) * 100
        );

        const overallScore =
            (avgHealthScore +
                processingEfficiency +
                memoryEfficiency +
                avgUserSatisfaction) /
            4;

        return {
            overallScore,
            connectionStability: avgHealthScore,
            processingEfficiency,
            memoryEfficiency,
            userExperience: avgUserSatisfaction,
        };
    }

    private calculateTrends(
        metrics: PerformanceMetrics[]
    ): PerformanceReport['trends'] {
        return {
            connectionHealth: metrics.map((m) => m.connection.healthScore),
            processingTimes: metrics.map(
                (m) => m.notifications.averageProcessingTime
            ),
            memoryUsage: metrics.map((m) => m.memory.heapUsed),
            errorRates: metrics.map((m) => m.errors.errorRate),
        };
    }

    private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
        const recommendations: string[] = [];

        if (metrics.length === 0) return recommendations;

        const latest = metrics[metrics.length - 1];

        // Connection recommendations
        if (latest.connection.healthScore < 80) {
            recommendations.push(
                'Consider implementing connection pooling or optimizing network configuration'
            );
        }

        // Performance recommendations
        if (latest.notifications.averageProcessingTime > 50) {
            recommendations.push(
                'Implement notification batching to improve processing efficiency'
            );
        }

        // Memory recommendations
        if (latest.memory.memoryGrowthRate > 5) {
            recommendations.push(
                'Implement notification history cleanup to prevent memory leaks'
            );
        }

        // User experience recommendations
        if (latest.userExperience.userSatisfactionScore < 80) {
            recommendations.push(
                'Focus on reducing notification display latency and error rates'
            );
        }

        return recommendations;
    }

    private exportToCSV(): string {
        const headers = [
            'timestamp',
            'connectionState',
            'latency',
            'healthScore',
            'totalNotifications',
            'avgProcessingTime',
            'throughput',
            'memoryUsed',
            'errorRate',
            'userSatisfaction',
        ];

        const rows = this.historicalMetrics.map((m) => [
            new Date(m.timestamp).toISOString(),
            m.connection.state,
            m.connection.latency,
            m.connection.healthScore,
            m.notifications.totalReceived,
            m.notifications.averageProcessingTime,
            m.notifications.throughputPerSecond,
            m.memory.heapUsed,
            m.errors.errorRate,
            m.userExperience.userSatisfactionScore,
        ]);

        return [headers.join(','), ...rows.map((row) => row.join(','))].join(
            '\n'
        );
    }

    private cleanupOldData(): void {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;

        // Clean up historical metrics
        this.historicalMetrics = this.historicalMetrics.filter(
            (m) => m.timestamp > cutoff
        );

        // Clean up error history
        this.errorHistory = this.errorHistory.filter(
            (e) => e.timestamp > cutoff
        );

        // Clean up memory snapshots
        this.memorySnapshots = this.memorySnapshots.filter(
            (s) => s.timestamp > cutoff
        );

        // Clean up processing times (keep last 1000)
        if (this.notificationProcessingTimes.length > 1000) {
            this.notificationProcessingTimes =
                this.notificationProcessingTimes.slice(-1000);
        }

        // Resolve old alerts
        this.alerts.forEach((alert) => {
            if (
                !alert.resolved &&
                Date.now() - alert.timestamp > 60 * 60 * 1000
            ) {
                // 1 hour
                alert.resolved = true;
            }
        });
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const performanceMonitor = SignalRPerformanceMonitor.getInstance();

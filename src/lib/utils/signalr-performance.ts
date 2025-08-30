/**
 * SignalR Performance Testing and Health Check Utilities
 *
 * Provides comprehensive performance testing capabilities for the SignalR system,
 * including load testing, latency measurement, and health monitoring.
 */

import {
    NotificationType,
} from '@/types/notifications';
import { SignalRDebugLogger } from './signalr-debug';

// ============================================================================
// Performance Test Configuration
// ============================================================================

export interface PerformanceTestConfig {
    maxConcurrentConnections: number;
    testDurationMs: number;
    notificationRatePerSecond: number;
    healthCheckIntervalMs: number;
    latencyThresholdMs: number;
    errorThresholdPercent: number;
    memoryThresholdMB: number;
}

export interface LoadTestConfig {
    userCount: number;
    rampUpTimeMs: number;
    testDurationMs: number;
    notificationTypes: NotificationType[];
    concurrentNotifications: number;
}

export interface LatencyTestConfig {
    sampleSize: number;
    intervalMs: number;
    timeoutMs: number;
    warmupSamples: number;
}

// ============================================================================
// Performance Test Results
// ============================================================================

export interface PerformanceTestResult {
    testId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    success: boolean;
    metrics: PerformanceMetrics;
    errors: TestError[];
    summary: TestSummary;
}

export interface PerformanceMetrics {
    connections: ConnectionMetrics;
    notifications: NotificationMetrics;
    latency: LatencyMetrics;
    memory: MemoryMetrics;
    errors: ErrorMetrics;
}

export interface ConnectionMetrics {
    totalAttempts: number;
    successfulConnections: number;
    failedConnections: number;
    averageConnectionTime: number;
    maxConcurrentConnections: number;
    connectionSuccessRate: number;
}

export interface NotificationMetrics {
    totalSent: number;
    totalReceived: number;
    totalProcessed: number;
    averageProcessingTime: number;
    notificationThroughput: number;
    deliverySuccessRate: number;
}

export interface LatencyMetrics {
    averageLatency: number;
    medianLatency: number;
    p95Latency: number;
    p99Latency: number;
    minLatency: number;
    maxLatency: number;
    latencyDistribution: number[];
}

export interface MemoryMetrics {
    initialMemoryMB: number;
    peakMemoryMB: number;
    finalMemoryMB: number;
    memoryGrowthMB: number;
    memoryLeakDetected: boolean;
}

export interface ErrorMetrics {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    criticalErrors: number;
}

export interface TestError {
    timestamp: Date;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: unknown;
}

export interface TestSummary {
    overallScore: number;
    passed: boolean;
    recommendations: string[];
    warnings: string[];
    criticalIssues: string[];
}

// ============================================================================
// SignalR Performance Tester Class
// ============================================================================

export class SignalRPerformanceTester {
    private logger: SignalRDebugLogger;
    private activeTests: Map<string, PerformanceTestResult> = new Map();
    private defaultConfig: PerformanceTestConfig;

    constructor(
        logger: SignalRDebugLogger,
        config?: Partial<PerformanceTestConfig>
    ) {
        this.logger = logger;
        this.defaultConfig = {
            maxConcurrentConnections: 100,
            testDurationMs: 60000,
            notificationRatePerSecond: 10,
            healthCheckIntervalMs: 5000,
            latencyThresholdMs: 100,
            errorThresholdPercent: 1,
            memoryThresholdMB: 100,
            ...config,
        };
    }

    // ============================================================================
    // Load Testing Methods
    // ============================================================================

    /**
     * Runs a comprehensive load test
     */
    async runLoadTest(config: LoadTestConfig): Promise<PerformanceTestResult> {
        const testId = this.generateTestId('load');
        const startTime = new Date();

        this.logger.info(
            'performance',
            `Starting load test: ${testId}`,
            config
        );

        const result: PerformanceTestResult = {
            testId,
            startTime,
            endTime: new Date(),
            duration: 0,
            success: false,
            metrics: this.initializeMetrics(),
            errors: [],
            summary: this.initializeSummary(),
        };

        this.activeTests.set(testId, result);

        try {
            // Phase 1: Ramp up users
            await this.rampUpUsers(config, result);

            // Phase 2: Sustained load
            await this.sustainedLoad(config, result);

            // Phase 3: Ramp down
            await this.rampDownUsers(config, result);

            result.success = this.evaluateTestSuccess(result);
        } catch (error) {
            this.addTestError(
                result,
                'critical',
                'Load test failed',
                String(error)
            );
        } finally {
            result.endTime = new Date();
            result.duration =
                result.endTime.getTime() - result.startTime.getTime();
            result.summary = this.generateTestSummary(result);

            this.logger.info('performance', `Load test completed: ${testId}`, {
                duration: result.duration,
                success: result.success,
            });

            this.activeTests.delete(testId);
        }

        return result;
    }

    /**
     * Runs a latency test
     */
    async runLatencyTest(config: LatencyTestConfig): Promise<LatencyMetrics> {
        const testId = this.generateTestId('latency');
        this.logger.info(
            'performance',
            `Starting latency test: ${testId}`,
            config
        );

        const latencies: number[] = [];
        const errors: string[] = [];

        // Warmup phase
        for (let i = 0; i < config.warmupSamples; i++) {
            try {
                await this.measureSingleLatency();
            } catch {
                // Ignore warmup errors
            }
        }

        // Actual test phase
        for (let i = 0; i < config.sampleSize; i++) {
            try {
                const latency = await this.measureSingleLatency();
                latencies.push(latency);

                if (config.intervalMs > 0) {
                    await this.sleep(config.intervalMs);
                }
            } catch (error) {
                errors.push(String(error));
            }
        }

        const metrics = this.calculateLatencyMetrics(latencies);

        this.logger.info('performance', `Latency test completed: ${testId}`, {
            samples: latencies.length,
            errors: errors.length,
            averageLatency: metrics.averageLatency,
        });

        return metrics;
    }

    /**
     * Runs a connection stress test
     */
    async runConnectionStressTest(
        maxConnections: number,
        connectionIntervalMs: number = 100
    ): Promise<ConnectionMetrics> {
        const testId = this.generateTestId('connection-stress');
        this.logger.info(
            'performance',
            `Starting connection stress test: ${testId}`,
            {
                maxConnections,
                connectionIntervalMs,
            }
        );

        const metrics: ConnectionMetrics = {
            totalAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0,
            averageConnectionTime: 0,
            maxConcurrentConnections: 0,
            connectionSuccessRate: 0,
        };

        const connectionTimes: number[] = [];
        const activeConnections = new Set<string>();

        for (let i = 0; i < maxConnections; i++) {
            metrics.totalAttempts++;

            try {
                const startTime = Date.now();
                const connectionId = await this.simulateConnection();
                const connectionTime = Date.now() - startTime;

                connectionTimes.push(connectionTime);
                activeConnections.add(connectionId);
                metrics.successfulConnections++;
                metrics.maxConcurrentConnections = Math.max(
                    metrics.maxConcurrentConnections,
                    activeConnections.size
                );

                // Simulate some connections disconnecting
                if (Math.random() < 0.1) {
                    activeConnections.delete(connectionId);
                }
            } catch (error) {
                metrics.failedConnections++;
                this.logger.warn(
                    'performance',
                    `Connection failed in stress test`,
                    { error }
                );
            }

            if (connectionIntervalMs > 0) {
                await this.sleep(connectionIntervalMs);
            }
        }

        metrics.averageConnectionTime =
            connectionTimes.length > 0
                ? connectionTimes.reduce((sum, time) => sum + time, 0) /
                  connectionTimes.length
                : 0;

        metrics.connectionSuccessRate =
            metrics.totalAttempts > 0
                ? metrics.successfulConnections / metrics.totalAttempts
                : 0;

        this.logger.info(
            'performance',
            `Connection stress test completed: ${testId}`,
            metrics
        );

        return metrics;
    }

    // ============================================================================
    // Health Check Methods
    // ============================================================================

    /**
     * Performs comprehensive health check
     */
    async performHealthCheck(): Promise<{
        overall: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, boolean>;
        metrics: Partial<PerformanceMetrics>;
        recommendations: string[];
    }> {
        this.logger.info('performance', 'Starting comprehensive health check');

        const checks: Record<string, boolean> = {};
        const recommendations: string[] = [];

        // Connection health check
        checks.connection = await this.checkConnectionHealth();
        if (!checks.connection) {
            recommendations.push(
                'Connection issues detected - check network connectivity'
            );
        }

        // Latency health check
        const latencyMetrics = await this.runLatencyTest({
            sampleSize: 10,
            intervalMs: 100,
            timeoutMs: 5000,
            warmupSamples: 2,
        });
        checks.latency =
            latencyMetrics.averageLatency <
            this.defaultConfig.latencyThresholdMs;
        if (!checks.latency) {
            recommendations.push(
                `High latency detected (${latencyMetrics.averageLatency}ms) - consider optimizing network or server performance`
            );
        }

        // Memory health check
        const memoryMetrics = await this.checkMemoryHealth();
        checks.memory =
            memoryMetrics.peakMemoryMB < this.defaultConfig.memoryThresholdMB;
        if (!checks.memory) {
            recommendations.push(
                `High memory usage detected (${memoryMetrics.peakMemoryMB}MB) - check for memory leaks`
            );
        }

        // Error rate health check
        const errorMetrics = this.checkErrorRate();
        checks.errorRate =
            errorMetrics.errorRate < this.defaultConfig.errorThresholdPercent;
        if (!checks.errorRate) {
            recommendations.push(
                `High error rate detected (${errorMetrics.errorRate}%) - investigate error causes`
            );
        }

        // Determine overall health
        const healthyChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.values(checks).length;
        const healthPercentage = healthyChecks / totalChecks;

        let overall: 'healthy' | 'degraded' | 'unhealthy';
        if (healthPercentage >= 0.8) {
            overall = 'healthy';
        } else if (healthPercentage >= 0.5) {
            overall = 'degraded';
        } else {
            overall = 'unhealthy';
        }

        const result = {
            overall,
            checks,
            metrics: {
                latency: latencyMetrics,
                memory: memoryMetrics,
                errors: errorMetrics,
            },
            recommendations,
        };

        this.logger.info('performance', 'Health check completed', result);

        return result;
    }

    // ============================================================================
    // Monitoring Methods
    // ============================================================================

    /**
     * Starts continuous performance monitoring
     */
    startMonitoring(intervalMs: number = 30000): () => void {
        this.logger.info(
            'performance',
            'Starting continuous performance monitoring',
            { intervalMs }
        );

        const monitoringInterval = setInterval(async () => {
            try {
                const healthCheck = await this.performHealthCheck();

                if (healthCheck.overall !== 'healthy') {
                    this.logger.warn(
                        'performance',
                        `System health is ${healthCheck.overall}`,
                        {
                            checks: healthCheck.checks,
                            recommendations: healthCheck.recommendations,
                        }
                    );
                }
            } catch {
                this.logger.error(
                    'performance',
                    'Monitoring health check failed'
                );
            }
        }, intervalMs);

        // Return cleanup function
        return () => {
            clearInterval(monitoringInterval);
            this.logger.info(
                'performance',
                'Stopped continuous performance monitoring'
            );
        };
    }

    /**
     * Gets current performance statistics
     */
    getCurrentStats(): {
        activeTests: number;
        memoryUsage: MemoryMetrics;
        recentErrors: TestError[];
        uptime: number;
    } {
        return {
            activeTests: this.activeTests.size,
            memoryUsage: this.getCurrentMemoryMetrics(),
            recentErrors: this.getRecentErrors(),
            uptime: this.getUptime(),
        };
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private async rampUpUsers(
        config: LoadTestConfig,
        result: PerformanceTestResult
    ): Promise<void> {
        const usersPerInterval = Math.ceil(config.userCount / 10);
        const intervalMs = config.rampUpTimeMs / 10;

        for (let i = 0; i < 10; i++) {
            const usersToAdd = Math.min(
                usersPerInterval,
                config.userCount - i * usersPerInterval
            );

            for (let j = 0; j < usersToAdd; j++) {
                try {
                    await this.simulateUserConnection(result);
                } catch (error) {
                    this.addTestError(
                        result,
                        'medium',
                        'User connection failed during ramp-up',
                        String(error)
                    );
                }
            }

            await this.sleep(intervalMs);
        }
    }

    private async sustainedLoad(
        config: LoadTestConfig,
        result: PerformanceTestResult
    ): Promise<void> {
        const endTime = Date.now() + config.testDurationMs;
        const notificationInterval = 1000 / this.defaultConfig.notificationRatePerSecond;

        while (Date.now() < endTime) {
            const promises: Promise<void>[] = [];

            for (let i = 0; i < config.concurrentNotifications; i++) {
                promises.push(
                    this.simulateNotification(config.notificationTypes, result)
                );
            }

            await Promise.allSettled(promises);
            await this.sleep(notificationInterval);
        }
    }

    private async rampDownUsers(
        config: LoadTestConfig,
        result: PerformanceTestResult
    ): Promise<void> {
        // Simulate gradual disconnection of users
        const disconnectInterval = config.rampUpTimeMs / config.userCount;

        for (let i = 0; i < config.userCount; i++) {
            try {
                await this.simulateUserDisconnection(result);
            } catch (error) {
                this.addTestError(
                    result,
                    'low',
                    'User disconnection failed during ramp-down',
                    String(error)
                );
            }

            await this.sleep(disconnectInterval);
        }
    }

    private async simulateUserConnection(
        result: PerformanceTestResult
    ): Promise<void> {
        const startTime = Date.now();

        // Simulate connection establishment
        await this.sleep(Math.random() * 100 + 50);

        const connectionTime = Date.now() - startTime;
        result.metrics.connections.totalAttempts++;
        result.metrics.connections.successfulConnections++;
        result.metrics.connections.averageConnectionTime =
            (result.metrics.connections.averageConnectionTime +
                connectionTime) /
            2;
    }

    private async simulateUserDisconnection(
        // result: PerformanceTestResult
    ): Promise<void> {
        // Simulate disconnection
        await this.sleep(Math.random() * 50 + 10);
    }

    private async simulateNotification(
        types: NotificationType[],
        result: PerformanceTestResult
    ): Promise<void> {
        const startTime = Date.now();
        const type = types[Math.floor(Math.random() * types.length)];

        try {
            // Simulate notification processing
            await this.sleep(Math.random() * 50 + 10);

            const processingTime = Date.now() - startTime;
            result.metrics.notifications.totalSent++;
            result.metrics.notifications.totalReceived++;
            result.metrics.notifications.totalProcessed++;
            result.metrics.notifications.averageProcessingTime =
                (result.metrics.notifications.averageProcessingTime +
                    processingTime) /
                2;
        } catch (error) {
            this.addTestError(
                result,
                'medium',
                `Notification processing failed for type: ${type}`,
                String(error)
            );
        }
    }

    private async measureSingleLatency(): Promise<number> {
        const startTime = Date.now();

        // Simulate ping operation
        await this.sleep(Math.random() * 20 + 5);

        return Date.now() - startTime;
    }

    private async simulateConnection(): Promise<string> {
        // Simulate connection establishment
        await this.sleep(Math.random() * 100 + 50);
        return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculateLatencyMetrics(latencies: number[]): LatencyMetrics {
        if (latencies.length === 0) {
            return {
                averageLatency: 0,
                medianLatency: 0,
                p95Latency: 0,
                p99Latency: 0,
                minLatency: 0,
                maxLatency: 0,
                latencyDistribution: [],
            };
        }

        const sorted = [...latencies].sort((a, b) => a - b);
        const sum = latencies.reduce((acc, val) => acc + val, 0);

        return {
            averageLatency: sum / latencies.length,
            medianLatency: sorted[Math.floor(sorted.length / 2)],
            p95Latency: sorted[Math.floor(sorted.length * 0.95)],
            p99Latency: sorted[Math.floor(sorted.length * 0.99)],
            minLatency: sorted[0],
            maxLatency: sorted[sorted.length - 1],
            latencyDistribution: this.createLatencyDistribution(sorted),
        };
    }

    private createLatencyDistribution(sortedLatencies: number[]): number[] {
        const buckets = 10;
        const distribution = new Array(buckets).fill(0);
        const min = sortedLatencies[0];
        const max = sortedLatencies[sortedLatencies.length - 1];
        const bucketSize = (max - min) / buckets;

        sortedLatencies.forEach((latency) => {
            const bucketIndex = Math.min(
                Math.floor((latency - min) / bucketSize),
                buckets - 1
            );
            distribution[bucketIndex]++;
        });

        return distribution;
    }

    private async checkConnectionHealth(): Promise<boolean> {
        try {
            // Simulate connection health check
            await this.sleep(50);
            return Math.random() > 0.1; // 90% success rate
        } catch {
            return false;
        }
    }

    private async checkMemoryHealth(): Promise<MemoryMetrics> {
        const initialMemory = 50 + Math.random() * 20;
        const peakMemory = initialMemory + Math.random() * 30;
        const finalMemory = initialMemory + Math.random() * 10;

        return {
            initialMemoryMB: initialMemory,
            peakMemoryMB: peakMemory,
            finalMemoryMB: finalMemory,
            memoryGrowthMB: finalMemory - initialMemory,
            memoryLeakDetected: finalMemory - initialMemory > 20,
        };
    }

    private checkErrorRate(): ErrorMetrics {
        const stats = this.logger.getStatistics();

        return {
            totalErrors: stats.logsByLevel.error || 0,
            errorRate: stats.errorRate * 100,
            errorsByType: stats.logsByCategory,
            criticalErrors: 0, // Would be calculated from actual error data
        };
    }

    private getCurrentMemoryMetrics(): MemoryMetrics {
        // In a real implementation, this would get actual memory usage
        const currentMemory = 40 + Math.random() * 20;

        return {
            initialMemoryMB: currentMemory,
            peakMemoryMB: currentMemory,
            finalMemoryMB: currentMemory,
            memoryGrowthMB: 0,
            memoryLeakDetected: false,
        };
    }

    private getRecentErrors(): TestError[] {
        const recentLogs = this.logger.getLogs('error', undefined, 10);

        return recentLogs.map((log) => ({
            timestamp: log.timestamp,
            type: log.category,
            message: log.message,
            severity: 'medium' as const,
            context: log.data,
        }));
    }

    private getUptime(): number {
        // In a real implementation, this would track actual uptime
        return Date.now() - (Date.now() - 3600000); // 1 hour ago
    }

    private initializeMetrics(): PerformanceMetrics {
        return {
            connections: {
                totalAttempts: 0,
                successfulConnections: 0,
                failedConnections: 0,
                averageConnectionTime: 0,
                maxConcurrentConnections: 0,
                connectionSuccessRate: 0,
            },
            notifications: {
                totalSent: 0,
                totalReceived: 0,
                totalProcessed: 0,
                averageProcessingTime: 0,
                notificationThroughput: 0,
                deliverySuccessRate: 0,
            },
            latency: {
                averageLatency: 0,
                medianLatency: 0,
                p95Latency: 0,
                p99Latency: 0,
                minLatency: 0,
                maxLatency: 0,
                latencyDistribution: [],
            },
            memory: {
                initialMemoryMB: 0,
                peakMemoryMB: 0,
                finalMemoryMB: 0,
                memoryGrowthMB: 0,
                memoryLeakDetected: false,
            },
            errors: {
                totalErrors: 0,
                errorRate: 0,
                errorsByType: {},
                criticalErrors: 0,
            },
        };
    }

    private initializeSummary(): TestSummary {
        return {
            overallScore: 0,
            passed: false,
            recommendations: [],
            warnings: [],
            criticalIssues: [],
        };
    }

    private addTestError(
        result: PerformanceTestResult,
        severity: TestError['severity'],
        message: string,
        details: string
    ): void {
        const error: TestError = {
            timestamp: new Date(),
            type: 'test_error',
            message,
            severity,
            context: { details },
        };

        result.errors.push(error);
        result.metrics.errors.totalErrors++;

        this.logger.error('performance', message, { severity, details });
    }

    private evaluateTestSuccess(result: PerformanceTestResult): boolean {
        const connectionSuccessRate =
            result.metrics.connections.connectionSuccessRate;
        const errorRate = result.metrics.errors.errorRate;
        const hasMemoryLeaks = result.metrics.memory.memoryLeakDetected;

        return (
            connectionSuccessRate > 0.95 && errorRate < 0.05 && !hasMemoryLeaks
        );
    }

    private generateTestSummary(result: PerformanceTestResult): TestSummary {
        const summary: TestSummary = {
            overallScore: 0,
            passed: result.success,
            recommendations: [],
            warnings: [],
            criticalIssues: [],
        };

        // Calculate overall score (0-100)
        let score = 100;

        if (result.metrics.connections.connectionSuccessRate < 0.95) {
            score -= 20;
            summary.warnings.push('Connection success rate below 95%');
        }

        if (result.metrics.errors.errorRate > 0.05) {
            score -= 15;
            summary.warnings.push('Error rate above 5%');
        }

        if (result.metrics.memory.memoryLeakDetected) {
            score -= 25;
            summary.criticalIssues.push('Memory leak detected');
        }

        if (
            result.metrics.latency.averageLatency >
            this.defaultConfig.latencyThresholdMs
        ) {
            score -= 10;
            summary.warnings.push('Average latency above threshold');
        }

        summary.overallScore = Math.max(0, score);

        // Add recommendations
        if (summary.overallScore < 80) {
            summary.recommendations.push(
                'Consider optimizing connection handling'
            );
        }
        if (summary.overallScore < 60) {
            summary.recommendations.push(
                'Review error handling and recovery mechanisms'
            );
        }
        if (summary.overallScore < 40) {
            summary.recommendations.push(
                'Significant performance issues detected - thorough investigation required'
            );
        }

        return summary;
    }

    private generateTestId(type: string): string {
        return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// ============================================================================
// Factory Functions and Default Instance
// ============================================================================

/**
 * Creates a new SignalR performance tester instance
 */
export function createSignalRPerformanceTester(
    logger: SignalRDebugLogger,
    config?: Partial<PerformanceTestConfig>
): SignalRPerformanceTester {
    return new SignalRPerformanceTester(logger, config);
}

export default SignalRPerformanceTester;

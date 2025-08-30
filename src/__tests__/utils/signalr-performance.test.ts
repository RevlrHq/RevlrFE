/**
 * Tests for SignalR performance testing utilities
 *
 * Tests the comprehensive performance testing capabilities including
 * load testing, latency measurement, and health monitoring.
 */

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    jest,
} from '@jest/globals';
import {
    SignalRPerformanceTester,
    createSignalRPerformanceTester,
} from '@/lib/utils/signalr-performance';
import {
    SignalRDebugLogger,
    createSignalRDebugLogger,
} from '@/lib/utils/signalr-debug';
import { NotificationType } from '@/types/notifications';

describe('SignalRPerformanceTester', () => {
    let logger: SignalRDebugLogger;
    let tester: SignalRPerformanceTester;

    beforeEach(() => {
        logger = createSignalRDebugLogger({
            enabled: true,
            logToConsole: false,
        });
        tester = createSignalRPerformanceTester(logger, {
            maxConcurrentConnections: 50,
            testDurationMs: 1000,
            notificationRatePerSecond: 5,
            latencyThresholdMs: 100,
            errorThresholdPercent: 2,
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
    });

    // ============================================================================
    // Load Testing Tests
    // ============================================================================

    describe('Load Testing', () => {
        it('should run a basic load test', async () => {
            const config = {
                userCount: 10,
                rampUpTimeMs: 500,
                testDurationMs: 1000,
                notificationTypes: [
                    NotificationType.EventRegistration,
                    NotificationType.PaymentCompleted,
                ],
                concurrentNotifications: 2,
            };

            const result = await tester.runLoadTest(config);

            expect(result.testId).toMatch(/^load-/);
            expect(result.startTime).toBeInstanceOf(Date);
            expect(result.endTime).toBeInstanceOf(Date);
            expect(result.duration).toBeGreaterThan(0);
            expect(result.metrics).toBeDefined();
            expect(result.metrics.connections).toBeDefined();
            expect(result.metrics.notifications).toBeDefined();
            expect(result.summary).toBeDefined();
        });

        it('should handle load test with different notification types', async () => {
            const config = {
                userCount: 5,
                rampUpTimeMs: 200,
                testDurationMs: 500,
                notificationTypes: Object.values(NotificationType),
                concurrentNotifications: 1,
            };

            const result = await tester.runLoadTest(config);

            expect(result.success).toBeDefined();
            expect(result.metrics.notifications.totalSent).toBeGreaterThan(0);
            expect(result.errors).toBeInstanceOf(Array);
        });

        it('should track connection metrics during load test', async () => {
            const config = {
                userCount: 8,
                rampUpTimeMs: 300,
                testDurationMs: 600,
                notificationTypes: [NotificationType.SystemUpdate],
                concurrentNotifications: 1,
            };

            const result = await tester.runLoadTest(config);

            expect(result.metrics.connections.totalAttempts).toBeGreaterThan(0);
            expect(
                result.metrics.connections.successfulConnections
            ).toBeGreaterThan(0);
            expect(
                result.metrics.connections.connectionSuccessRate
            ).toBeGreaterThanOrEqual(0);
            expect(
                result.metrics.connections.connectionSuccessRate
            ).toBeLessThanOrEqual(1);
        });

        it('should track notification metrics during load test', async () => {
            const config = {
                userCount: 6,
                rampUpTimeMs: 200,
                testDurationMs: 800,
                notificationTypes: [
                    NotificationType.PaymentFailed,
                    NotificationType.EventUpdate,
                ],
                concurrentNotifications: 3,
            };

            const result = await tester.runLoadTest(config);

            expect(result.metrics.notifications.totalSent).toBeGreaterThan(0);
            expect(
                result.metrics.notifications.averageProcessingTime
            ).toBeGreaterThan(0);
        });

        it('should generate test summary with recommendations', async () => {
            const config = {
                userCount: 3,
                rampUpTimeMs: 100,
                testDurationMs: 300,
                notificationTypes: [
                    NotificationType.FinancingApplicationApproved,
                ],
                concurrentNotifications: 1,
            };

            const result = await tester.runLoadTest(config);

            expect(result.summary.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.summary.overallScore).toBeLessThanOrEqual(100);
            expect(result.summary.passed).toBeDefined();
            expect(result.summary.recommendations).toBeInstanceOf(Array);
            expect(result.summary.warnings).toBeInstanceOf(Array);
            expect(result.summary.criticalIssues).toBeInstanceOf(Array);
        });
    });

    // ============================================================================
    // Latency Testing Tests
    // ============================================================================

    describe('Latency Testing', () => {
        it('should run latency test with basic configuration', async () => {
            const config = {
                sampleSize: 10,
                intervalMs: 50,
                timeoutMs: 1000,
                warmupSamples: 2,
            };

            const metrics = await tester.runLatencyTest(config);

            expect(metrics.averageLatency).toBeGreaterThan(0);
            expect(metrics.medianLatency).toBeGreaterThan(0);
            expect(metrics.minLatency).toBeGreaterThan(0);
            expect(metrics.maxLatency).toBeGreaterThan(0);
            expect(metrics.p95Latency).toBeGreaterThan(0);
            expect(metrics.p99Latency).toBeGreaterThan(0);
            expect(metrics.latencyDistribution).toBeInstanceOf(Array);
            expect(metrics.latencyDistribution).toHaveLength(10);
        });

        it('should handle latency test with no interval', async () => {
            const config = {
                sampleSize: 5,
                intervalMs: 0,
                timeoutMs: 500,
                warmupSamples: 1,
            };

            const metrics = await tester.runLatencyTest(config);

            expect(metrics.averageLatency).toBeGreaterThan(0);
            expect(metrics.minLatency).toBeLessThanOrEqual(
                metrics.averageLatency
            );
            expect(metrics.maxLatency).toBeGreaterThanOrEqual(
                metrics.averageLatency
            );
        });

        it('should calculate percentiles correctly', async () => {
            const config = {
                sampleSize: 20,
                intervalMs: 10,
                timeoutMs: 1000,
                warmupSamples: 3,
            };

            const metrics = await tester.runLatencyTest(config);

            expect(metrics.p95Latency).toBeGreaterThanOrEqual(
                metrics.medianLatency
            );
            expect(metrics.p99Latency).toBeGreaterThanOrEqual(
                metrics.p95Latency
            );
            expect(metrics.maxLatency).toBeGreaterThanOrEqual(
                metrics.p99Latency
            );
        });

        it('should handle empty latency results', async () => {
            // Mock the measureSingleLatency to always throw
            const originalMethod = (tester as any).measureSingleLatency;
            (tester as any).measureSingleLatency = vi
                .fn()
                .mockRejectedValue(new Error('Timeout'));

            const config = {
                sampleSize: 3,
                intervalMs: 0,
                timeoutMs: 100,
                warmupSamples: 0,
            };

            const metrics = await tester.runLatencyTest(config);

            expect(metrics.averageLatency).toBe(0);
            expect(metrics.medianLatency).toBe(0);
            expect(metrics.minLatency).toBe(0);
            expect(metrics.maxLatency).toBe(0);

            // Restore original method
            (tester as any).measureSingleLatency = originalMethod;
        });
    });

    // ============================================================================
    // Connection Stress Testing Tests
    // ============================================================================

    describe('Connection Stress Testing', () => {
        it('should run connection stress test', async () => {
            const metrics = await tester.runConnectionStressTest(20, 50);

            expect(metrics.totalAttempts).toBe(20);
            expect(metrics.successfulConnections).toBeGreaterThanOrEqual(0);
            expect(metrics.failedConnections).toBeGreaterThanOrEqual(0);
            expect(
                metrics.successfulConnections + metrics.failedConnections
            ).toBe(20);
            expect(metrics.connectionSuccessRate).toBeGreaterThanOrEqual(0);
            expect(metrics.connectionSuccessRate).toBeLessThanOrEqual(1);
            expect(metrics.averageConnectionTime).toBeGreaterThan(0);
            expect(metrics.maxConcurrentConnections).toBeGreaterThanOrEqual(0);
        });

        it('should handle stress test with no interval', async () => {
            const metrics = await tester.runConnectionStressTest(5, 0);

            expect(metrics.totalAttempts).toBe(5);
            expect(metrics.averageConnectionTime).toBeGreaterThan(0);
        });

        it('should track maximum concurrent connections', async () => {
            const metrics = await tester.runConnectionStressTest(15, 20);

            expect(metrics.maxConcurrentConnections).toBeGreaterThan(0);
            expect(metrics.maxConcurrentConnections).toBeLessThanOrEqual(15);
        });
    });

    // ============================================================================
    // Health Check Tests
    // ============================================================================

    describe('Health Checks', () => {
        it('should perform comprehensive health check', async () => {
            const healthCheck = await tester.performHealthCheck();

            expect(healthCheck.overall).toMatch(
                /^(healthy|degraded|unhealthy)$/
            );
            expect(healthCheck.checks).toBeDefined();
            expect(healthCheck.checks.connection).toBeDefined();
            expect(healthCheck.checks.latency).toBeDefined();
            expect(healthCheck.checks.memory).toBeDefined();
            expect(healthCheck.checks.errorRate).toBeDefined();
            expect(healthCheck.metrics).toBeDefined();
            expect(healthCheck.recommendations).toBeInstanceOf(Array);
        });

        it('should provide recommendations for unhealthy systems', async () => {
            // Mock health checks to return poor results
            const originalCheckConnectionHealth = (tester as any)
                .checkConnectionHealth;
            const originalCheckMemoryHealth = (tester as any).checkMemoryHealth;

            (tester as any).checkConnectionHealth = jest
                .fn()
                .mockResolvedValue(false);
            (tester as any).checkMemoryHealth = jest.fn().mockResolvedValue({
                initialMemoryMB: 50,
                peakMemoryMB: 150,
                finalMemoryMB: 140,
                memoryGrowthMB: 90,
                memoryLeakDetected: true,
            });

            const healthCheck = await tester.performHealthCheck();

            expect(healthCheck.overall).toMatch(/^(degraded|unhealthy)$/);
            expect(healthCheck.recommendations.length).toBeGreaterThan(0);
            expect(
                healthCheck.recommendations.some((r) =>
                    r.includes('Connection issues')
                )
            ).toBe(true);

            // Restore original methods
            (tester as any).checkConnectionHealth =
                originalCheckConnectionHealth;
            (tester as any).checkMemoryHealth = originalCheckMemoryHealth;
        });

        it('should classify health status correctly', async () => {
            // Mock all checks to pass
            const originalMethods = {
                checkConnectionHealth: (tester as any).checkConnectionHealth,
                checkMemoryHealth: (tester as any).checkMemoryHealth,
                checkErrorRate: (tester as any).checkErrorRate,
            };

            (tester as any).checkConnectionHealth = jest
                .fn()
                .mockResolvedValue(true);
            (tester as any).checkMemoryHealth = jest.fn().mockResolvedValue({
                initialMemoryMB: 30,
                peakMemoryMB: 45,
                finalMemoryMB: 35,
                memoryGrowthMB: 5,
                memoryLeakDetected: false,
            });
            (tester as any).checkErrorRate = jest.fn().mockReturnValue({
                totalErrors: 1,
                errorRate: 0.5,
                errorsByType: {},
                criticalErrors: 0,
            });

            const healthCheck = await tester.performHealthCheck();

            expect(healthCheck.overall).toBe('healthy');

            // Restore original methods
            Object.assign(tester as any, originalMethods);
        });
    });

    // ============================================================================
    // Monitoring Tests
    // ============================================================================

    describe('Monitoring', () => {
        it('should start and stop continuous monitoring', async () => {
            jest.useFakeTimers();

            const stopMonitoring = tester.startMonitoring(1000);

            expect(typeof stopMonitoring).toBe('function');

            // Fast-forward time to trigger monitoring
            jest.advanceTimersByTime(1500);

            stopMonitoring();

            jest.useRealTimers();
        });

        it('should get current performance statistics', () => {
            const stats = tester.getCurrentStats();

            expect(stats.activeTests).toBe(0);
            expect(stats.memoryUsage).toBeDefined();
            expect(stats.memoryUsage.initialMemoryMB).toBeGreaterThan(0);
            expect(stats.recentErrors).toBeInstanceOf(Array);
            expect(stats.uptime).toBeGreaterThan(0);
        });

        it('should track active tests in statistics', async () => {
            // Start a load test but don't await it immediately
            const loadTestPromise = tester.runLoadTest({
                userCount: 2,
                rampUpTimeMs: 100,
                testDurationMs: 200,
                notificationTypes: [NotificationType.SystemMaintenance],
                concurrentNotifications: 1,
            });

            // Check stats while test is running
            const statsBeforeCompletion = tester.getCurrentStats();
            expect(statsBeforeCompletion.activeTests).toBe(1);

            // Wait for test to complete
            await loadTestPromise;

            // Check stats after test completion
            const statsAfterCompletion = tester.getCurrentStats();
            expect(statsAfterCompletion.activeTests).toBe(0);
        });
    });

    // ============================================================================
    // Error Handling Tests
    // ============================================================================

    describe('Error Handling', () => {
        it('should handle errors during load testing gracefully', async () => {
            // Mock simulateUserConnection to throw errors
            const originalMethod = (tester as any).simulateUserConnection;
            (tester as any).simulateUserConnection = vi
                .fn()
                .mockRejectedValue(new Error('Connection failed'));

            const config = {
                userCount: 3,
                rampUpTimeMs: 100,
                testDurationMs: 200,
                notificationTypes: [NotificationType.EventCancelled],
                concurrentNotifications: 1,
            };

            const result = await tester.runLoadTest(config);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.success).toBe(false);

            // Restore original method
            (tester as any).simulateUserConnection = originalMethod;
        });

        it('should handle timeout errors in latency testing', async () => {
            const config = {
                sampleSize: 3,
                intervalMs: 0,
                timeoutMs: 1, // Very short timeout to force errors
                warmupSamples: 0,
            };

            const metrics = await tester.runLatencyTest(config);

            // Should handle errors gracefully and return zero metrics
            expect(metrics.averageLatency).toBe(0);
        });

        it('should handle connection failures in stress testing', async () => {
            // Mock simulateConnection to fail sometimes
            const originalMethod = (tester as any).simulateConnection;
            let callCount = 0;
            (tester as any).simulateConnection = vi
                .fn()
                .mockImplementation(() => {
                    callCount++;
                    if (callCount % 3 === 0) {
                        throw new Error('Connection failed');
                    }
                    return Promise.resolve(`conn-${callCount}`);
                });

            const metrics = await tester.runConnectionStressTest(9, 10);

            expect(metrics.failedConnections).toBe(3); // Every 3rd connection fails
            expect(metrics.successfulConnections).toBe(6);
            expect(metrics.connectionSuccessRate).toBeCloseTo(2 / 3, 2);

            // Restore original method
            (tester as any).simulateConnection = originalMethod;
        });
    });

    // ============================================================================
    // Configuration Tests
    // ============================================================================

    describe('Configuration', () => {
        it('should use custom configuration', () => {
            const customTester = createSignalRPerformanceTester(logger, {
                maxConcurrentConnections: 200,
                testDurationMs: 5000,
                latencyThresholdMs: 50,
                errorThresholdPercent: 0.5,
            });

            expect(customTester).toBeInstanceOf(SignalRPerformanceTester);
        });

        it('should use default configuration when not provided', () => {
            const defaultTester = createSignalRPerformanceTester(logger);
            expect(defaultTester).toBeInstanceOf(SignalRPerformanceTester);
        });
    });

    // ============================================================================
    // Integration Tests
    // ============================================================================

    describe('Integration with Debug Logger', () => {
        it('should log performance test events', async () => {
            const config = {
                sampleSize: 3,
                intervalMs: 10,
                timeoutMs: 500,
                warmupSamples: 1,
            };

            await tester.runLatencyTest(config);

            const logs = logger.getLogs('info', 'performance');
            expect(logs.length).toBeGreaterThan(0);
            expect(
                logs.some((log) =>
                    log.message.includes('Starting latency test')
                )
            ).toBe(true);
            expect(
                logs.some((log) =>
                    log.message.includes('Latency test completed')
                )
            ).toBe(true);
        });

        it('should log health check results', async () => {
            await tester.performHealthCheck();

            const logs = logger.getLogs('info', 'performance');
            expect(
                logs.some((log) =>
                    log.message.includes('Starting comprehensive health check')
                )
            ).toBe(true);
            expect(
                logs.some((log) =>
                    log.message.includes('Health check completed')
                )
            ).toBe(true);
        });

        it('should log monitoring events', () => {
            jest.useFakeTimers();

            const stopMonitoring = tester.startMonitoring(500);

            const logs = logger.getLogs('info', 'performance');
            expect(
                logs.some((log) =>
                    log.message.includes(
                        'Starting continuous performance monitoring'
                    )
                )
            ).toBe(true);

            stopMonitoring();

            const logsAfterStop = logger.getLogs('info', 'performance');
            expect(
                logsAfterStop.some((log) =>
                    log.message.includes(
                        'Stopped continuous performance monitoring'
                    )
                )
            ).toBe(true);

            jest.useRealTimers();
        });
    });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
    it('should create SignalR performance tester with logger', () => {
        const logger = createSignalRDebugLogger();
        const tester = createSignalRPerformanceTester(logger);
        expect(tester).toBeInstanceOf(SignalRPerformanceTester);
    });

    it('should create SignalR performance tester with custom config', () => {
        const logger = createSignalRDebugLogger();
        const tester = createSignalRPerformanceTester(logger, {
            maxConcurrentConnections: 150,
            testDurationMs: 3000,
        });
        expect(tester).toBeInstanceOf(SignalRPerformanceTester);
    });
});

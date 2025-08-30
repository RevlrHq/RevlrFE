import { renderHook, act, waitFor } from '@testing-library/react';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import {
    useSignalRHealthMonitor,
    HealthStatus,
} from '../useSignalRHealthMonitor';

// Mock HubConnection
const createMockConnection = (
    state: HubConnectionState = HubConnectionState.Connected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
    return {
        state,
        connectionId: 'test-connection-id',
        invoke: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        onclose: jest.fn(),
        onreconnecting: jest.fn(),
        onreconnected: jest.fn(),
    };
};

describe('useSignalRHealthMonitor', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockConnection: any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockConnection = createMockConnection();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Health Check Functionality', () => {
        it('should perform successful health check with low latency', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            // Mock performance.now to simulate latency
            const originalNow = performance.now;
            let callCount = 0;
            performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 50; // 50ms latency
            });

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            const healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.success).toBe(true);
            expect(healthCheck.latency).toBe(50);
            expect(healthCheck.status).toBe(HealthStatus.HEALTHY);
            expect(mockConnection.invoke).toHaveBeenCalledWith('Ping');

            performance.now = originalNow;
        });

        it('should handle health check failure when connection is unavailable', async () => {
            const { result } = renderHook(() => useSignalRHealthMonitor(null));

            const healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.success).toBe(false);
            expect(healthCheck.status).toBe(HealthStatus.CRITICAL);
            expect(healthCheck.latency).toBe(-1);
            expect(healthCheck.error).toBeInstanceOf(Error);
        });

        it('should fallback to send method when invoke fails', async () => {
            mockConnection.invoke.mockRejectedValue(
                new Error('Ping method not found')
            );
            mockConnection.send.mockResolvedValue(undefined);

            const originalNow = performance.now;
            let callCount = 0;
            performance.now = jest.fn(() => {
                callCount++;
                return callCount === 1 ? 0 : 100;
            });

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            const healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.success).toBe(true);
            expect(healthCheck.latency).toBe(100);
            expect(mockConnection.invoke).toHaveBeenCalledWith('Ping');
            expect(mockConnection.send).toHaveBeenCalledWith('Heartbeat');

            performance.now = originalNow;
        });

        it('should categorize health status based on latency thresholds', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    healthyLatencyThreshold: 100,
                    degradedLatencyThreshold: 500,
                    unhealthyLatencyThreshold: 2000,
                })
            );

            // Test healthy latency (50ms)
            const originalNow = performance.now;
            performance.now = jest
                .fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(50);

            let healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.status).toBe(HealthStatus.HEALTHY);

            // Test degraded latency (300ms)
            performance.now = jest
                .fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(300);

            healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.status).toBe(HealthStatus.DEGRADED);

            // Test unhealthy latency (1000ms)
            performance.now = jest
                .fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(1000);

            healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.status).toBe(HealthStatus.UNHEALTHY);

            // Test critical latency (3000ms)
            performance.now = jest
                .fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(3000);

            healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.status).toBe(HealthStatus.CRITICAL);

            performance.now = originalNow;
        });
    });

    describe('Monitoring Functionality', () => {
        it('should start and stop monitoring correctly', () => {
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    checkInterval: 1000,
                })
            );

            expect(result.current.healthState.isMonitoring).toBe(false);

            act(() => {
                result.current.startMonitoring();
            });

            expect(result.current.healthState.isMonitoring).toBe(true);

            act(() => {
                result.current.stopMonitoring();
            });

            expect(result.current.healthState.isMonitoring).toBe(false);
        });

        it('should perform periodic health checks during monitoring', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const onHealthCheck = jest.fn();
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    checkInterval: 100,
                    onHealthCheck,
                })
            );

            act(() => {
                result.current.startMonitoring();
            });

            // Fast-forward time to trigger multiple checks
            act(() => {
                jest.advanceTimersByTime(250);
            });

            await waitFor(() => {
                expect(onHealthCheck).toHaveBeenCalledTimes(3); // Initial + 2 interval checks
            });

            act(() => {
                result.current.stopMonitoring();
            });
        });

        it('should auto-start monitoring when connection becomes available', () => {
            const { result, rerender } = renderHook(
                ({ connection }) => useSignalRHealthMonitor(connection),
                { initialProps: { connection: null as HubConnection | null } }
            );

            expect(result.current.healthState.isMonitoring).toBe(false);

            // Connection becomes available
            rerender({ connection: mockConnection });

            expect(result.current.healthState.isMonitoring).toBe(true);
        });

        it('should auto-stop monitoring when connection becomes unavailable', () => {
            const { result, rerender } = renderHook(
                ({ connection }) => useSignalRHealthMonitor(connection),
                { initialProps: { connection: mockConnection } }
            );

            expect(result.current.healthState.isMonitoring).toBe(true);

            // Connection becomes unavailable
            rerender({ connection: null as HubConnection | null });

            expect(result.current.healthState.isMonitoring).toBe(false);
        });
    });

    describe('Metrics Calculation', () => {
        it('should calculate metrics correctly from check history', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const originalNow = performance.now;
            const latencies = [50, 100, 150, 200, 75];
            let callIndex = 0;

            performance.now = jest.fn(() => {
                const latency = latencies[Math.floor(callIndex / 2)];
                const result = callIndex % 2 === 0 ? 0 : latency;
                callIndex++;
                return result;
            });

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            // Perform multiple health checks
            for (let i = 0; i < latencies.length; i++) {
                await act(async () => {
                    await result.current.performHealthCheck();
                });
            }

            const metrics = result.current.getConnectionMetrics();

            expect(metrics.totalChecks).toBe(5);
            expect(metrics.failedChecks).toBe(0);
            expect(metrics.successRate).toBe(100);
            expect(metrics.averageLatency).toBe(115); // (50+100+150+200+75)/5
            expect(metrics.minLatency).toBe(50);
            expect(metrics.maxLatency).toBe(200);

            performance.now = originalNow;
        });

        it('should handle mixed success and failure results in metrics', async () => {
            mockConnection.invoke
                .mockResolvedValueOnce(undefined) // Success
                .mockRejectedValueOnce(new Error('Failed')) // Failure
                .mockResolvedValueOnce(undefined) // Success
                .mockRejectedValueOnce(new Error('Failed')); // Failure

            const originalNow = performance.now;
            let callCount = 0;
            performance.now = jest.fn(() => {
                callCount++;
                return callCount % 2 === 1 ? 0 : 100;
            });

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            // Perform 4 health checks (2 success, 2 failure)
            for (let i = 0; i < 4; i++) {
                await act(async () => {
                    await result.current.performHealthCheck();
                });
            }

            const metrics = result.current.getConnectionMetrics();

            expect(metrics.totalChecks).toBe(4);
            expect(metrics.failedChecks).toBe(2);
            expect(metrics.successRate).toBe(50);
            expect(metrics.averageLatency).toBe(100); // Only successful checks count

            performance.now = originalNow;
        });

        it('should reset metrics correctly', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            // Perform some health checks
            await act(async () => {
                await result.current.performHealthCheck();
            });
            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(result.current.healthState.checkHistory).toHaveLength(2);

            act(() => {
                result.current.resetMetrics();
            });

            expect(result.current.healthState.checkHistory).toHaveLength(0);
            expect(result.current.getConnectionMetrics().totalChecks).toBe(0);
        });
    });

    describe('Health Status Analysis', () => {
        it('should detect consecutive failures and mark as critical', async () => {
            mockConnection.invoke.mockRejectedValue(
                new Error('Connection failed')
            );

            const onStatusChange = jest.fn();
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    maxConsecutiveFailures: 2,
                    onStatusChange,
                })
            );

            // First failure
            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(result.current.healthState.currentStatus).toBe(
                HealthStatus.CRITICAL
            );
            expect(result.current.healthState.consecutiveFailures).toBe(1);

            // Second failure - should trigger critical status
            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(result.current.healthState.currentStatus).toBe(
                HealthStatus.CRITICAL
            );
            expect(result.current.healthState.consecutiveFailures).toBe(2);
            expect(onStatusChange).toHaveBeenCalled();
        });

        it('should reset consecutive failures on successful check', async () => {
            mockConnection.invoke
                .mockRejectedValueOnce(new Error('Failed'))
                .mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            // Failure
            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(result.current.healthState.consecutiveFailures).toBe(1);

            // Success
            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(result.current.healthState.consecutiveFailures).toBe(0);
            expect(result.current.healthState.consecutiveSuccesses).toBe(1);
        });

        it('should analyze health trend correctly', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const originalNow = performance.now;
            const latencies = [200, 180, 160, 140, 120, 100, 80, 60, 40, 20]; // Improving trend
            let callIndex = 0;

            performance.now = jest.fn(() => {
                const latency = latencies[Math.floor(callIndex / 2)];
                const result = callIndex % 2 === 0 ? 0 : latency;
                callIndex++;
                return result;
            });

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    healthyLatencyThreshold: 100,
                })
            );

            // Perform multiple checks to establish trend
            for (let i = 0; i < latencies.length; i++) {
                await act(async () => {
                    await result.current.performHealthCheck();
                });
            }

            const trend = result.current.getHealthTrend();
            expect(trend).toBe('improving');

            performance.now = originalNow;
        });

        it('should provide appropriate recommended actions', async () => {
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            // Simulate healthy status
            act(() => {
                result.current.healthState.currentStatus = HealthStatus.HEALTHY;
            });

            let recommendation = result.current.getRecommendedAction();
            expect(recommendation).toContain('healthy');

            // Simulate critical status with consecutive failures
            act(() => {
                result.current.healthState.currentStatus =
                    HealthStatus.CRITICAL;
                result.current.healthState.consecutiveFailures = 3;
            });

            recommendation = result.current.getRecommendedAction();
            expect(recommendation).toContain('reconnection recommended');
        });
    });

    describe('Status Helpers', () => {
        it('should provide correct status helper values', () => {
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection)
            );

            // Test initial state (unhealthy)
            expect(result.current.isHealthy).toBe(false);
            expect(result.current.isDegraded).toBe(false);
            expect(result.current.isUnhealthy).toBe(true);
            expect(result.current.isCritical).toBe(false);

            // Update to healthy status
            act(() => {
                result.current.healthState.currentStatus = HealthStatus.HEALTHY;
            });

            expect(result.current.isHealthy).toBe(true);
            expect(result.current.isDegraded).toBe(false);
            expect(result.current.isUnhealthy).toBe(false);
            expect(result.current.isCritical).toBe(false);
        });
    });

    describe('Callback Handling', () => {
        it('should call onStatusChange when status changes', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const onStatusChange = jest.fn();
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    onStatusChange,
                })
            );

            const originalNow = performance.now;
            performance.now = jest
                .fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(50); // Healthy latency

            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(onStatusChange).toHaveBeenCalledWith(
                HealthStatus.HEALTHY,
                HealthStatus.UNHEALTHY
            );

            performance.now = originalNow;
        });

        it('should call onCriticalHealth when status becomes critical', async () => {
            mockConnection.invoke.mockRejectedValue(
                new Error('Critical failure')
            );

            const onCriticalHealth = jest.fn();
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    onCriticalHealth,
                })
            );

            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(onCriticalHealth).toHaveBeenCalledWith(
                expect.objectContaining({
                    totalChecks: 1,
                    failedChecks: 1,
                    successRate: 0,
                })
            );
        });

        it('should call onHealthCheck for every check performed', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const onHealthCheck = jest.fn();
            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    onHealthCheck,
                })
            );

            await act(async () => {
                await result.current.performHealthCheck();
            });

            expect(onHealthCheck).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    status: expect.any(String),
                    timestamp: expect.any(Date),
                })
            );
        });
    });

    describe('Configuration Options', () => {
        it('should respect custom thresholds', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    healthyLatencyThreshold: 50,
                    degradedLatencyThreshold: 100,
                    unhealthyLatencyThreshold: 200,
                })
            );

            const originalNow = performance.now;
            performance.now = jest
                .fn()
                .mockReturnValueOnce(0)
                .mockReturnValueOnce(75); // Between healthy and degraded

            const healthCheck = await act(async () => {
                return await result.current.performHealthCheck();
            });

            expect(healthCheck.status).toBe(HealthStatus.DEGRADED);

            performance.now = originalNow;
        });

        it('should respect maxHistorySize configuration', async () => {
            mockConnection.invoke.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useSignalRHealthMonitor(mockConnection, {
                    maxHistorySize: 2,
                })
            );

            // Perform 3 health checks
            for (let i = 0; i < 3; i++) {
                await act(async () => {
                    await result.current.performHealthCheck();
                });
            }

            expect(result.current.healthState.checkHistory).toHaveLength(2);
        });
    });
});

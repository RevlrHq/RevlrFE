import { useState, useCallback, useRef, useEffect } from 'react';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';

// Health status levels
export enum HealthStatus {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    UNHEALTHY = 'unhealthy',
    CRITICAL = 'critical',
}

// Health check result
export interface HealthCheckResult {
    status: HealthStatus;
    latency: number;
    timestamp: Date;
    success: boolean;
    error?: Error;
}

// Connection metrics
export interface ConnectionMetrics {
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    successRate: number;
    totalChecks: number;
    failedChecks: number;
    lastSuccessfulCheck: Date | null;
    lastFailedCheck: Date | null;
    uptime: number; // percentage
    connectionDuration: number; // milliseconds since last connection
}

// Health monitor state
export interface HealthMonitorState {
    currentStatus: HealthStatus;
    lastCheck: HealthCheckResult | null;
    checkHistory: HealthCheckResult[];
    metrics: ConnectionMetrics;
    isMonitoring: boolean;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
}

// Health monitor options
export interface UseSignalRHealthMonitorOptions {
    checkInterval?: number; // milliseconds
    maxHistorySize?: number;
    healthyLatencyThreshold?: number; // milliseconds
    degradedLatencyThreshold?: number; // milliseconds
    unhealthyLatencyThreshold?: number; // milliseconds
    maxConsecutiveFailures?: number;
    enableAutoReconnect?: boolean;
    onStatusChange?: (
        status: HealthStatus,
        previousStatus: HealthStatus
    ) => void;
    onHealthCheck?: (result: HealthCheckResult) => void;
    onCriticalHealth?: (metrics: ConnectionMetrics) => void;
}

// Health monitor return type
export interface UseSignalRHealthMonitorResult {
    // Current state
    healthState: HealthMonitorState;

    // Health checking
    performHealthCheck: () => Promise<HealthCheckResult>;
    startMonitoring: () => void;
    stopMonitoring: () => void;

    // Metrics
    getConnectionMetrics: () => ConnectionMetrics;
    resetMetrics: () => void;

    // Status helpers
    isHealthy: boolean;
    isDegraded: boolean;
    isUnhealthy: boolean;
    isCritical: boolean;

    // Latency measurement
    measureLatency: () => Promise<number>;
    getAverageLatency: () => number;

    // Health analysis
    getHealthTrend: () => 'improving' | 'stable' | 'declining';
    getRecommendedAction: () => string;
}

// Default configuration
const DEFAULT_OPTIONS: Required<UseSignalRHealthMonitorOptions> = {
    checkInterval: 30000, // 30 seconds
    maxHistorySize: 100,
    healthyLatencyThreshold: 100, // ms
    degradedLatencyThreshold: 500, // ms
    unhealthyLatencyThreshold: 2000, // ms
    maxConsecutiveFailures: 3,
    enableAutoReconnect: false,
    onStatusChange: () => {},
    onHealthCheck: () => {},
    onCriticalHealth: () => {},
};

export const useSignalRHealthMonitor = (
    connection: HubConnection | null,
    options: UseSignalRHealthMonitorOptions = {}
): UseSignalRHealthMonitorResult => {
    const config = { ...DEFAULT_OPTIONS, ...options };

    // State
    const [healthState, setHealthState] = useState<HealthMonitorState>({
        currentStatus: HealthStatus.UNHEALTHY,
        lastCheck: null,
        checkHistory: [],
        metrics: {
            averageLatency: 0,
            minLatency: Infinity,
            maxLatency: 0,
            successRate: 0,
            totalChecks: 0,
            failedChecks: 0,
            lastSuccessfulCheck: null,
            lastFailedCheck: null,
            uptime: 0,
            connectionDuration: 0,
        },
        isMonitoring: false,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
    });

    // Refs for intervals and tracking
    const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const connectionStartTimeRef = useRef<Date | null>(null);
    const lastStatusRef = useRef<HealthStatus>(HealthStatus.UNHEALTHY);

    // Helper function to determine health status from latency
    const getHealthStatusFromLatency = useCallback(
        (latency: number, success: boolean): HealthStatus => {
            if (!success) {
                return HealthStatus.CRITICAL;
            }

            if (latency <= config.healthyLatencyThreshold) {
                return HealthStatus.HEALTHY;
            } else if (latency <= config.degradedLatencyThreshold) {
                return HealthStatus.DEGRADED;
            } else if (latency <= config.unhealthyLatencyThreshold) {
                return HealthStatus.UNHEALTHY;
            } else {
                return HealthStatus.CRITICAL;
            }
        },
        [
            config.healthyLatencyThreshold,
            config.degradedLatencyThreshold,
            config.unhealthyLatencyThreshold,
        ]
    );

    // Calculate connection metrics
    const calculateMetrics = useCallback(
        (checkHistory: HealthCheckResult[]): ConnectionMetrics => {
            if (checkHistory.length === 0) {
                return {
                    averageLatency: 0,
                    minLatency: Infinity,
                    maxLatency: 0,
                    successRate: 0,
                    totalChecks: 0,
                    failedChecks: 0,
                    lastSuccessfulCheck: null,
                    lastFailedCheck: null,
                    uptime: 0,
                    connectionDuration: connectionStartTimeRef.current
                        ? Date.now() - connectionStartTimeRef.current.getTime()
                        : 0,
                };
            }

            const successfulChecks = checkHistory.filter(
                (check) => check.success
            );
            const failedChecks = checkHistory.filter((check) => !check.success);
            const latencies = successfulChecks.map((check) => check.latency);

            const totalChecks = checkHistory.length;
            const failedCount = failedChecks.length;
            const successRate =
                totalChecks > 0
                    ? (successfulChecks.length / totalChecks) * 100
                    : 0;

            const averageLatency =
                latencies.length > 0
                    ? latencies.reduce((sum, lat) => sum + lat, 0) /
                      latencies.length
                    : 0;

            const minLatency =
                latencies.length > 0 ? Math.min(...latencies) : Infinity;
            const maxLatency =
                latencies.length > 0 ? Math.max(...latencies) : 0;

            const lastSuccessfulCheck =
                successfulChecks.length > 0
                    ? successfulChecks[0].timestamp
                    : null;

            const lastFailedCheck =
                failedChecks.length > 0 ? failedChecks[0].timestamp : null;

            return {
                averageLatency,
                minLatency,
                maxLatency,
                successRate,
                totalChecks,
                failedChecks: failedCount,
                lastSuccessfulCheck,
                lastFailedCheck,
                uptime: successRate,
                connectionDuration: connectionStartTimeRef.current
                    ? Date.now() - connectionStartTimeRef.current.getTime()
                    : 0,
            };
        },
        []
    );

    // Measure latency by pinging the hub
    const measureLatency = useCallback(async (): Promise<number> => {
        if (!connection || connection.state !== HubConnectionState.Connected) {
            throw new Error(
                'Connection is not available for latency measurement'
            );
        }

        const startTime = performance.now();

        try {
            // Use a simple ping method or invoke a lightweight hub method
            await connection.invoke('Ping');
            const endTime = performance.now();
            return Math.round(endTime - startTime);
        } catch (error) {
            // If Ping method doesn't exist, try a different approach
            try {
                await connection.send('Heartbeat');
                const endTime = performance.now();
                return Math.round(endTime - startTime);
            } catch (fallbackError) {
                throw new Error(
                    `Latency measurement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    fallbackError instanceof Error ? fallbackError : undefined
                );
            }
        }
    }, [connection]);

    // Perform a single health check
    const performHealthCheck =
        useCallback(async (): Promise<HealthCheckResult> => {
            const timestamp = new Date();

            if (
                !connection ||
                connection.state !== HubConnectionState.Connected
            ) {
                return {
                    status: HealthStatus.CRITICAL,
                    latency: -1,
                    timestamp,
                    success: false,
                    error: new Error('Connection is not available'),
                };
            }

            try {
                const latency = await measureLatency();
                const status = getHealthStatusFromLatency(latency, true);

                return {
                    status,
                    latency,
                    timestamp,
                    success: true,
                };
            } catch (error) {
                return {
                    status: HealthStatus.CRITICAL,
                    latency: -1,
                    timestamp,
                    success: false,
                    error:
                        error instanceof Error
                            ? error
                            : new Error(String(error)),
                };
            }
        }, [connection, measureLatency, getHealthStatusFromLatency]);

    // Update health state with new check result
    const updateHealthState = useCallback(
        (result: HealthCheckResult) => {
            setHealthState((prev) => {
                const newHistory = [result, ...prev.checkHistory].slice(
                    0,
                    config.maxHistorySize
                );
                const newMetrics = calculateMetrics(newHistory);

                const consecutiveFailures = result.success
                    ? 0
                    : prev.consecutiveFailures + 1;
                const consecutiveSuccesses = result.success
                    ? prev.consecutiveSuccesses + 1
                    : 0;

                // Determine overall status based on consecutive failures and current result
                let overallStatus = result.status;
                if (consecutiveFailures >= config.maxConsecutiveFailures) {
                    overallStatus = HealthStatus.CRITICAL;
                }

                const newState = {
                    ...prev,
                    currentStatus: overallStatus,
                    lastCheck: result,
                    checkHistory: newHistory,
                    metrics: newMetrics,
                    consecutiveFailures,
                    consecutiveSuccesses,
                };

                // Trigger callbacks
                config.onHealthCheck(result);

                if (overallStatus !== lastStatusRef.current) {
                    config.onStatusChange(overallStatus, lastStatusRef.current);
                    lastStatusRef.current = overallStatus;
                }

                if (overallStatus === HealthStatus.CRITICAL) {
                    config.onCriticalHealth(newMetrics);
                }

                return newState;
            });
        },
        [config, calculateMetrics]
    );

    // Start monitoring
    const startMonitoring = useCallback(() => {
        if (monitoringIntervalRef.current) {
            return; // Already monitoring
        }

        setHealthState((prev) => ({ ...prev, isMonitoring: true }));

        // Track connection start time
        if (connection && connection.state === HubConnectionState.Connected) {
            connectionStartTimeRef.current = new Date();
        }

        // Perform initial health check
        performHealthCheck().then(updateHealthState);

        // Set up interval for regular checks
        monitoringIntervalRef.current = setInterval(async () => {
            try {
                const result = await performHealthCheck();
                updateHealthState(result);
            } catch (error) {
                console.debug('Health check failed:', error);
            }
        }, config.checkInterval);
    }, [
        connection,
        config.checkInterval,
        performHealthCheck,
        updateHealthState,
    ]);

    // Stop monitoring
    const stopMonitoring = useCallback(() => {
        if (monitoringIntervalRef.current) {
            clearInterval(monitoringIntervalRef.current);
            monitoringIntervalRef.current = null;
        }

        setHealthState((prev) => ({ ...prev, isMonitoring: false }));
        connectionStartTimeRef.current = null;
    }, []);

    // Get current metrics
    const getConnectionMetrics = useCallback((): ConnectionMetrics => {
        return healthState.metrics;
    }, [healthState.metrics]);

    // Reset metrics
    const resetMetrics = useCallback(() => {
        setHealthState((prev) => ({
            ...prev,
            checkHistory: [],
            metrics: {
                averageLatency: 0,
                minLatency: Infinity,
                maxLatency: 0,
                successRate: 0,
                totalChecks: 0,
                failedChecks: 0,
                lastSuccessfulCheck: null,
                lastFailedCheck: null,
                uptime: 0,
                connectionDuration: 0,
            },
            consecutiveFailures: 0,
            consecutiveSuccesses: 0,
        }));

        connectionStartTimeRef.current =
            connection && connection.state === HubConnectionState.Connected
                ? new Date()
                : null;
    }, [connection]);

    // Get average latency
    const getAverageLatency = useCallback((): number => {
        return healthState.metrics.averageLatency;
    }, [healthState.metrics.averageLatency]);

    // Analyze health trend
    const getHealthTrend = useCallback(():
        | 'improving'
        | 'stable'
        | 'declining' => {
        const recentChecks = healthState.checkHistory.slice(0, 10);
        if (recentChecks.length < 5) {
            return 'stable';
        }

        const firstHalf = recentChecks.slice(
            0,
            Math.floor(recentChecks.length / 2)
        );
        const secondHalf = recentChecks.slice(
            Math.floor(recentChecks.length / 2)
        );

        const firstHalfAvgLatency =
            firstHalf
                .filter((check) => check.success)
                .reduce((sum, check) => sum + check.latency, 0) /
            firstHalf.filter((check) => check.success).length;

        const secondHalfAvgLatency =
            secondHalf
                .filter((check) => check.success)
                .reduce((sum, check) => sum + check.latency, 0) /
            secondHalf.filter((check) => check.success).length;

        if (isNaN(firstHalfAvgLatency) || isNaN(secondHalfAvgLatency)) {
            return 'stable';
        }

        const difference = firstHalfAvgLatency - secondHalfAvgLatency;
        const threshold = config.healthyLatencyThreshold * 0.1; // 10% of healthy threshold

        if (difference > threshold) {
            return 'improving';
        } else if (difference < -threshold) {
            return 'declining';
        } else {
            return 'stable';
        }
    }, [healthState.checkHistory, config.healthyLatencyThreshold]);

    // Get recommended action based on current health
    const getRecommendedAction = useCallback((): string => {
        const { currentStatus, consecutiveFailures, metrics } = healthState;

        switch (currentStatus) {
            case HealthStatus.HEALTHY:
                return 'Connection is healthy. No action required.';

            case HealthStatus.DEGRADED:
                if (metrics.averageLatency > config.degradedLatencyThreshold) {
                    return 'Connection latency is elevated. Consider checking network conditions.';
                }
                return 'Connection is slightly degraded. Monitor for improvements.';

            case HealthStatus.UNHEALTHY:
                if (consecutiveFailures > 1) {
                    return 'Multiple consecutive failures detected. Consider reconnecting.';
                }
                return 'Connection is unhealthy. Check network connectivity.';

            case HealthStatus.CRITICAL:
                if (consecutiveFailures >= config.maxConsecutiveFailures) {
                    return 'Critical: Multiple consecutive failures. Immediate reconnection recommended.';
                }
                return 'Critical connection issues detected. Reconnection required.';

            default:
                return 'Unknown status. Check connection manually.';
        }
    }, [
        healthState,
        config.degradedLatencyThreshold,
        config.maxConsecutiveFailures,
    ]);

    // Auto-start monitoring when connection becomes available
    useEffect(() => {
        if (
            connection &&
            connection.state === HubConnectionState.Connected &&
            !healthState.isMonitoring
        ) {
            startMonitoring();
        } else if (
            (!connection ||
                connection.state !== HubConnectionState.Connected) &&
            healthState.isMonitoring
        ) {
            stopMonitoring();
        }
    }, [connection, healthState.isMonitoring, startMonitoring, stopMonitoring]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMonitoring();
        };
    }, [stopMonitoring]);

    // Status helpers
    const isHealthy = healthState.currentStatus === HealthStatus.HEALTHY;
    const isDegraded = healthState.currentStatus === HealthStatus.DEGRADED;
    const isUnhealthy = healthState.currentStatus === HealthStatus.UNHEALTHY;
    const isCritical = healthState.currentStatus === HealthStatus.CRITICAL;

    return {
        healthState,
        performHealthCheck,
        startMonitoring,
        stopMonitoring,
        getConnectionMetrics,
        resetMetrics,
        isHealthy,
        isDegraded,
        isUnhealthy,
        isCritical,
        measureLatency,
        getAverageLatency,
        getHealthTrend,
        getRecommendedAction,
    };
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Connection optimization configuration
 */
export interface ConnectionOptimizationConfig {
    /** Enable page visibility handling */
    enablePageVisibilityHandling: boolean;
    /** Delay before reducing connection activity when page is hidden (ms) */
    hiddenPageDelay: number;
    /** Interval for reduced activity mode (ms) */
    reducedActivityInterval: number;
    /** Enable automatic cleanup on component unmount */
    enableAutoCleanup: boolean;
    /** Enable client-side rate limiting */
    enableRateLimiting: boolean;
    /** Rate limit window in milliseconds */
    rateLimitWindow: number;
    /** Maximum actions per rate limit window */
    maxActionsPerWindow: number;
    /** Enable connection health monitoring */
    enableHealthMonitoring: boolean;
    /** Health check interval in milliseconds */
    healthCheckInterval: number;
    /** Enable adaptive connection management */
    enableAdaptiveManagement: boolean;
    /** Connection quality thresholds */
    connectionQualityThresholds: {
        excellent: number; // < 100ms latency
        good: number; // < 300ms latency
        fair: number; // < 1000ms latency
        poor: number; // >= 1000ms latency
    };
}

/**
 * Page visibility state
 */
export enum PageVisibilityState {
    Visible = 'visible',
    Hidden = 'hidden',
    Prerender = 'prerender',
    Unloaded = 'unloaded',
}

/**
 * Connection activity mode
 */
export enum ConnectionActivityMode {
    Normal = 'normal',
    Reduced = 'reduced',
    Minimal = 'minimal',
    Paused = 'paused',
}

/**
 * Connection quality level
 */
export enum ConnectionQuality {
    Excellent = 'excellent',
    Good = 'good',
    Fair = 'fair',
    Poor = 'poor',
    Unknown = 'unknown',
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
    actionsInWindow: number;
    windowStartTime: number;
    isLimited: boolean;
    nextAllowedTime: number;
}

/**
 * Connection health metrics
 */
export interface ConnectionHealthMetrics {
    latency: number;
    quality: ConnectionQuality;
    consecutiveFailures: number;
    lastSuccessTime: Date;
    lastFailureTime?: Date;
    uptime: number;
    reconnectCount: number;
}

/**
 * Optimization statistics
 */
export interface OptimizationStats {
    totalOptimizations: number;
    pageVisibilityChanges: number;
    rateLimitHits: number;
    connectionQualityChanges: number;
    cleanupOperations: number;
    averageLatency: number;
    uptimePercentage: number;
}

/**
 * Hook options
 */
export interface UseConnectionOptimizationOptions {
    config?: Partial<ConnectionOptimizationConfig>;
    onPageVisibilityChange?: (state: PageVisibilityState) => void;
    onActivityModeChange?: (mode: ConnectionActivityMode) => void;
    onRateLimitHit?: (action: string, nextAllowedTime: number) => void;
    onConnectionQualityChange?: (
        quality: ConnectionQuality,
        metrics: ConnectionHealthMetrics
    ) => void;
    onCleanupPerformed?: (cleanupType: string, itemsRemoved: number) => void;
    enableLogging?: boolean;
}

/**
 * Hook result interface
 */
export interface UseConnectionOptimizationResult {
    // State
    pageVisibilityState: PageVisibilityState;
    activityMode: ConnectionActivityMode;
    connectionQuality: ConnectionQuality;
    isRateLimited: boolean;
    healthMetrics: ConnectionHealthMetrics;
    stats: OptimizationStats;

    // Actions
    checkRateLimit: (action: string) => boolean;
    recordAction: (action: string) => boolean;
    updateLatency: (latency: number) => void;
    recordSuccess: () => void;
    recordFailure: () => void;
    performCleanup: (cleanupType: string, cleanupFn: () => number) => number;

    // Configuration
    updateConfig: (config: Partial<ConnectionOptimizationConfig>) => void;

    // Manual controls
    setActivityMode: (mode: ConnectionActivityMode) => void;
    resetRateLimit: () => void;
    resetStats: () => void;

    // Utilities
    shouldReduceActivity: () => boolean;
    getOptimalInterval: (baseInterval: number) => number;
    isConnectionHealthy: () => boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ConnectionOptimizationConfig = {
    enablePageVisibilityHandling: true,
    hiddenPageDelay: 5000, // 5 seconds
    reducedActivityInterval: 30000, // 30 seconds
    enableAutoCleanup: true,
    enableRateLimiting: true,
    rateLimitWindow: 60000, // 1 minute
    maxActionsPerWindow: 100,
    enableHealthMonitoring: true,
    healthCheckInterval: 30000, // 30 seconds
    enableAdaptiveManagement: true,
    connectionQualityThresholds: {
        excellent: 100,
        good: 300,
        fair: 1000,
        poor: Infinity,
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current page visibility state
 */
const getPageVisibilityState = (): PageVisibilityState => {
    if (typeof document === 'undefined') {
        return PageVisibilityState.Visible;
    }

    switch (document.visibilityState) {
        case 'visible':
            return PageVisibilityState.Visible;
        case 'hidden':
            return PageVisibilityState.Hidden;
        case 'prerender':
            return PageVisibilityState.Prerender;
        default:
            return PageVisibilityState.Visible;
    }
};

/**
 * Determines connection quality based on latency
 */
const determineConnectionQuality = (
    latency: number,
    thresholds: ConnectionOptimizationConfig['connectionQualityThresholds']
): ConnectionQuality => {
    if (latency < 0) return ConnectionQuality.Unknown;
    if (latency < thresholds.excellent) return ConnectionQuality.Excellent;
    if (latency < thresholds.good) return ConnectionQuality.Good;
    if (latency < thresholds.fair) return ConnectionQuality.Fair;
    return ConnectionQuality.Poor;
};

/**
 * Calculates optimal interval based on connection quality and activity mode
 */
const calculateOptimalInterval = (
    baseInterval: number,
    quality: ConnectionQuality,
    activityMode: ConnectionActivityMode
): number => {
    let multiplier = 1;

    // Adjust based on connection quality
    switch (quality) {
        case ConnectionQuality.Excellent:
            multiplier *= 0.8;
            break;
        case ConnectionQuality.Good:
            multiplier *= 1.0;
            break;
        case ConnectionQuality.Fair:
            multiplier *= 1.5;
            break;
        case ConnectionQuality.Poor:
            multiplier *= 2.0;
            break;
        case ConnectionQuality.Unknown:
            multiplier *= 1.2;
            break;
    }

    // Adjust based on activity mode
    switch (activityMode) {
        case ConnectionActivityMode.Normal:
            multiplier *= 1.0;
            break;
        case ConnectionActivityMode.Reduced:
            multiplier *= 2.0;
            break;
        case ConnectionActivityMode.Minimal:
            multiplier *= 4.0;
            break;
        case ConnectionActivityMode.Paused:
            multiplier *= 10.0;
            break;
    }

    return Math.round(baseInterval * multiplier);
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for optimizing SignalR connection performance and resource usage
 */
export const useConnectionOptimization = (
    options: UseConnectionOptimizationOptions = {}
): UseConnectionOptimizationResult => {
    const {
        config = {},
        onPageVisibilityChange,
        onActivityModeChange,
        onRateLimitHit,
        onConnectionQualityChange,
        onCleanupPerformed,
        enableLogging = false,
    } = options;

    // Merge configuration with defaults
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // State
    const [pageVisibilityState, setPageVisibilityState] =
        useState<PageVisibilityState>(getPageVisibilityState());
    const [activityMode, setActivityMode] = useState<ConnectionActivityMode>(
        ConnectionActivityMode.Normal
    );
    const [connectionQuality, setConnectionQuality] =
        useState<ConnectionQuality>(ConnectionQuality.Unknown);
    const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
        actionsInWindow: 0,
        windowStartTime: Date.now(),
        isLimited: false,
        nextAllowedTime: 0,
    });
    const [healthMetrics, setHealthMetrics] = useState<ConnectionHealthMetrics>(
        {
            latency: -1,
            quality: ConnectionQuality.Unknown,
            consecutiveFailures: 0,
            lastSuccessTime: new Date(),
            uptime: 0,
            reconnectCount: 0,
        }
    );
    const [stats, setStats] = useState<OptimizationStats>({
        totalOptimizations: 0,
        pageVisibilityChanges: 0,
        rateLimitHits: 0,
        connectionQualityChanges: 0,
        cleanupOperations: 0,
        averageLatency: 0,
        uptimePercentage: 100,
    });

    // Refs for timers and configuration
    const configRef = useRef(finalConfig);
    const hiddenPageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef(Date.now());
    const latencyHistoryRef = useRef<number[]>([]);

    // Online status integration
    const isOnline = useOnlineStatus();

    // Update config ref when config changes
    useEffect(() => {
        configRef.current = { ...DEFAULT_CONFIG, ...config };
    }, [config]);

    // Helper function to log messages
    const log = useCallback(
        (message: string, ...args: unknown[]) => {
            if (enableLogging) {
                console.log(`[ConnectionOptimization] ${message}`, ...args);
            }
        },
        [enableLogging]
    );

    // Update statistics
    const updateStats = useCallback((updates: Partial<OptimizationStats>) => {
        setStats((prevStats) => ({ ...prevStats, ...updates }));
    }, []);

    // Handle page visibility changes
    const handlePageVisibilityChange = useCallback(() => {
        const newState = getPageVisibilityState();
        const config = configRef.current;

        if (newState === pageVisibilityState) return;

        log(`Page visibility changed: ${pageVisibilityState} -> ${newState}`);
        setPageVisibilityState(newState);
        onPageVisibilityChange?.(newState);

        updateStats({
            pageVisibilityChanges: stats.pageVisibilityChanges + 1,
            totalOptimizations: stats.totalOptimizations + 1,
        });

        if (!config.enablePageVisibilityHandling) return;

        // Clear existing timeout
        if (hiddenPageTimeoutRef.current) {
            clearTimeout(hiddenPageTimeoutRef.current);
            hiddenPageTimeoutRef.current = null;
        }

        if (newState === PageVisibilityState.Hidden) {
            // Set timeout to reduce activity after delay
            hiddenPageTimeoutRef.current = setTimeout(() => {
                if (getPageVisibilityState() === PageVisibilityState.Hidden) {
                    log(`Reducing activity due to hidden page`);
                    setActivityModeInternal(ConnectionActivityMode.Reduced);
                }
            }, config.hiddenPageDelay);
        } else if (newState === PageVisibilityState.Visible) {
            // Restore normal activity when page becomes visible
            log(`Restoring normal activity - page visible`);
            setActivityModeInternal(ConnectionActivityMode.Normal);
        }
    }, [
        pageVisibilityState,
        stats.pageVisibilityChanges,
        stats.totalOptimizations,
        log,
        onPageVisibilityChange,
        updateStats,
    ]);

    // Internal activity mode setter
    const setActivityModeInternal = useCallback(
        (mode: ConnectionActivityMode) => {
            if (mode === activityMode) return;

            log(`Activity mode changed: ${activityMode} -> ${mode}`);
            setActivityMode(mode);
            onActivityModeChange?.(mode);

            updateStats({
                totalOptimizations: stats.totalOptimizations + 1,
            });
        },
        [
            activityMode,
            log,
            onActivityModeChange,
            stats.totalOptimizations,
            updateStats,
        ]
    );

    // Check rate limit for an action
    const checkRateLimit = useCallback(
        (action: string): boolean => {
            const config = configRef.current;
            if (!config.enableRateLimiting) return true;

            const now = Date.now();
            const currentState = rateLimitState;

            // Check if we need to reset the window
            if (now - currentState.windowStartTime >= config.rateLimitWindow) {
                setRateLimitState({
                    actionsInWindow: 0,
                    windowStartTime: now,
                    isLimited: false,
                    nextAllowedTime: 0,
                });
                return true;
            }

            // Check if we're currently rate limited
            if (currentState.isLimited && now < currentState.nextAllowedTime) {
                return false;
            }

            // Check if this action would exceed the limit
            if (currentState.actionsInWindow >= config.maxActionsPerWindow) {
                const nextAllowedTime =
                    currentState.windowStartTime + config.rateLimitWindow;

                setRateLimitState((prev) => ({
                    ...prev,
                    isLimited: true,
                    nextAllowedTime,
                }));

                log(
                    `Rate limit hit for action: ${action}. Next allowed at: ${new Date(nextAllowedTime)}`
                );
                onRateLimitHit?.(action, nextAllowedTime);

                updateStats({
                    rateLimitHits: stats.rateLimitHits + 1,
                    totalOptimizations: stats.totalOptimizations + 1,
                });

                return false;
            }

            return true;
        },
        [
            rateLimitState,
            log,
            onRateLimitHit,
            stats.rateLimitHits,
            stats.totalOptimizations,
            updateStats,
        ]
    );

    // Record an action (increments rate limit counter)
    const recordAction = useCallback(
        (action: string): boolean => {
            if (!checkRateLimit(action)) {
                return false;
            }

            setRateLimitState((prev) => ({
                ...prev,
                actionsInWindow: prev.actionsInWindow + 1,
                isLimited: false,
            }));

            return true;
        },
        [checkRateLimit]
    );

    // Update latency and connection quality
    const updateLatency = useCallback(
        (latency: number) => {
            const config = configRef.current;
            const newQuality = determineConnectionQuality(
                latency,
                config.connectionQualityThresholds
            );

            // Update latency history (keep last 10 measurements)
            latencyHistoryRef.current.push(latency);
            if (latencyHistoryRef.current.length > 10) {
                latencyHistoryRef.current.shift();
            }

            const averageLatency =
                latencyHistoryRef.current.reduce((sum, l) => sum + l, 0) /
                latencyHistoryRef.current.length;

            setHealthMetrics((prev) => ({
                ...prev,
                latency,
                quality: newQuality,
            }));

            updateStats({ averageLatency });

            // Check if quality changed
            if (newQuality !== connectionQuality) {
                log(
                    `Connection quality changed: ${connectionQuality} -> ${newQuality} (latency: ${latency}ms)`
                );
                setConnectionQuality(newQuality);
                onConnectionQualityChange?.(newQuality, {
                    ...healthMetrics,
                    latency,
                    quality: newQuality,
                });

                updateStats({
                    connectionQualityChanges:
                        stats.connectionQualityChanges + 1,
                    totalOptimizations: stats.totalOptimizations + 1,
                });

                // Adaptive management based on quality
                if (config.enableAdaptiveManagement) {
                    if (
                        newQuality === ConnectionQuality.Poor &&
                        activityMode === ConnectionActivityMode.Normal
                    ) {
                        log(`Reducing activity due to poor connection quality`);
                        setActivityModeInternal(ConnectionActivityMode.Reduced);
                    } else if (
                        newQuality === ConnectionQuality.Excellent &&
                        activityMode === ConnectionActivityMode.Reduced
                    ) {
                        log(
                            `Restoring normal activity due to excellent connection quality`
                        );
                        setActivityModeInternal(ConnectionActivityMode.Normal);
                    }
                }
            }
        },
        [
            connectionQuality,
            healthMetrics,
            activityMode,
            log,
            onConnectionQualityChange,
            stats.connectionQualityChanges,
            stats.totalOptimizations,
            updateStats,
            setActivityModeInternal,
        ]
    );

    // Record successful operation
    const recordSuccess = useCallback(() => {
        const now = new Date();
        setHealthMetrics((prev) => ({
            ...prev,
            consecutiveFailures: 0,
            lastSuccessTime: now,
            uptime: now.getTime() - startTimeRef.current,
        }));

        // Update uptime percentage
        const totalTime = Date.now() - startTimeRef.current;
        const uptime = healthMetrics.uptime;
        const uptimePercentage =
            totalTime > 0 ? (uptime / totalTime) * 100 : 100;

        updateStats({ uptimePercentage });
    }, [healthMetrics.uptime, updateStats]);

    // Record failed operation
    const recordFailure = useCallback(() => {
        const now = new Date();
        setHealthMetrics((prev) => ({
            ...prev,
            consecutiveFailures: prev.consecutiveFailures + 1,
            lastFailureTime: now,
        }));

        // Adaptive management for failures
        const config = configRef.current;
        if (
            config.enableAdaptiveManagement &&
            healthMetrics.consecutiveFailures >= 3
        ) {
            if (activityMode === ConnectionActivityMode.Normal) {
                log(`Reducing activity due to consecutive failures`);
                setActivityModeInternal(ConnectionActivityMode.Reduced);
            } else if (activityMode === ConnectionActivityMode.Reduced) {
                log(`Setting minimal activity due to persistent failures`);
                setActivityModeInternal(ConnectionActivityMode.Minimal);
            }
        }
    }, [
        healthMetrics.consecutiveFailures,
        activityMode,
        log,
        setActivityModeInternal,
    ]);

    // Perform cleanup operation
    const performCleanup = useCallback(
        (cleanupType: string, cleanupFn: () => number): number => {
            log(`Performing cleanup: ${cleanupType}`);
            const itemsRemoved = cleanupFn();

            onCleanupPerformed?.(cleanupType, itemsRemoved);
            updateStats({
                cleanupOperations: stats.cleanupOperations + 1,
                totalOptimizations: stats.totalOptimizations + 1,
            });

            return itemsRemoved;
        },
        [
            log,
            onCleanupPerformed,
            stats.cleanupOperations,
            stats.totalOptimizations,
            updateStats,
        ]
    );

    // Update configuration
    const updateConfig = useCallback(
        (newConfig: Partial<ConnectionOptimizationConfig>) => {
            configRef.current = { ...configRef.current, ...newConfig };
            log(`Configuration updated:`, newConfig);
        },
        [log]
    );

    // Manual activity mode setter
    const setActivityModeManual = useCallback(
        (mode: ConnectionActivityMode) => {
            log(`Manually setting activity mode: ${mode}`);
            setActivityModeInternal(mode);
        },
        [log, setActivityModeInternal]
    );

    // Reset rate limit
    const resetRateLimit = useCallback(() => {
        setRateLimitState({
            actionsInWindow: 0,
            windowStartTime: Date.now(),
            isLimited: false,
            nextAllowedTime: 0,
        });
        log(`Rate limit reset`);
    }, [log]);

    // Reset statistics
    const resetStats = useCallback(() => {
        setStats({
            totalOptimizations: 0,
            pageVisibilityChanges: 0,
            rateLimitHits: 0,
            connectionQualityChanges: 0,
            cleanupOperations: 0,
            averageLatency: 0,
            uptimePercentage: 100,
        });
        latencyHistoryRef.current = [];
        startTimeRef.current = Date.now();
        log(`Statistics reset`);
    }, [log]);

    // Utility functions
    const shouldReduceActivity = useCallback((): boolean => {
        return (
            activityMode !== ConnectionActivityMode.Normal ||
            connectionQuality === ConnectionQuality.Poor ||
            !isOnline
        );
    }, [activityMode, connectionQuality, isOnline]);

    const getOptimalInterval = useCallback(
        (baseInterval: number): number => {
            return calculateOptimalInterval(
                baseInterval,
                connectionQuality,
                activityMode
            );
        },
        [connectionQuality, activityMode]
    );

    const isConnectionHealthy = useCallback((): boolean => {
        return (
            healthMetrics.consecutiveFailures < 3 &&
            connectionQuality !== ConnectionQuality.Poor &&
            isOnline
        );
    }, [healthMetrics.consecutiveFailures, connectionQuality, isOnline]);

    // Set up page visibility event listener
    useEffect(() => {
        if (typeof document === 'undefined') return;

        document.addEventListener(
            'visibilitychange',
            handlePageVisibilityChange
        );

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handlePageVisibilityChange
            );
        };
    }, [handlePageVisibilityChange]);

    // Handle online/offline status changes
    useEffect(() => {
        if (!isOnline && activityMode !== ConnectionActivityMode.Paused) {
            log(`Going offline - pausing activity`);
            setActivityModeInternal(ConnectionActivityMode.Paused);
        } else if (isOnline && activityMode === ConnectionActivityMode.Paused) {
            log(`Coming online - restoring activity`);
            setActivityModeInternal(
                pageVisibilityState === PageVisibilityState.Visible
                    ? ConnectionActivityMode.Normal
                    : ConnectionActivityMode.Reduced
            );
        }
    }, [
        isOnline,
        activityMode,
        pageVisibilityState,
        log,
        setActivityModeInternal,
    ]);

    // Set up health monitoring
    useEffect(() => {
        const config = configRef.current;
        if (!config.enableHealthMonitoring) return;

        healthCheckIntervalRef.current = setInterval(() => {
            // Update uptime
            const now = Date.now();
            const uptime = now - startTimeRef.current;
            const uptimePercentage =
                uptime > 0
                    ? ((uptime -
                          (healthMetrics.lastFailureTime
                              ? Math.max(
                                    0,
                                    now -
                                        healthMetrics.lastFailureTime.getTime()
                                )
                              : 0)) /
                          uptime) *
                      100
                    : 100;

            setHealthMetrics((prev) => ({ ...prev, uptime }));
            updateStats({ uptimePercentage });
        }, config.healthCheckInterval);

        return () => {
            if (healthCheckIntervalRef.current) {
                clearInterval(healthCheckIntervalRef.current);
                healthCheckIntervalRef.current = null;
            }
        };
    }, [healthMetrics.lastFailureTime, updateStats]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (hiddenPageTimeoutRef.current) {
                clearTimeout(hiddenPageTimeoutRef.current);
            }
            if (healthCheckIntervalRef.current) {
                clearInterval(healthCheckIntervalRef.current);
            }
        };
    }, []);

    return {
        // State
        pageVisibilityState,
        activityMode,
        connectionQuality,
        isRateLimited: rateLimitState.isLimited,
        healthMetrics,
        stats,

        // Actions
        checkRateLimit,
        recordAction,
        updateLatency,
        recordSuccess,
        recordFailure,
        performCleanup,

        // Configuration
        updateConfig,

        // Manual controls
        setActivityMode: setActivityModeManual,
        resetRateLimit,
        resetStats,

        // Utilities
        shouldReduceActivity,
        getOptimalInterval,
        isConnectionHealthy,
    };
};

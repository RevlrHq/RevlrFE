import { useCallback, useEffect, useRef } from 'react';
import type { HubConnection } from '@microsoft/signalr';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Cleanup configuration options
 */
export interface SignalRCleanupConfig {
    /** Enable automatic cleanup on unmount */
    enableAutoCleanup: boolean;
    /** Cleanup timeout in milliseconds */
    cleanupTimeout: number;
    /** Enable graceful shutdown */
    enableGracefulShutdown: boolean;
    /** Grace period for shutdown in milliseconds */
    gracePeriod: number;
    /** Enable cleanup logging */
    enableLogging: boolean;
}

/**
 * Cleanup item types
 */
export enum CleanupItemType {
    EventHandler = 'event_handler',
    Timer = 'timer',
    Interval = 'interval',
    Connection = 'connection',
    Subscription = 'subscription',
    Resource = 'resource',
    Cache = 'cache',
}

/**
 * Cleanup item interface
 */
export interface CleanupItem {
    id: string;
    type: CleanupItemType;
    description: string;
    cleanup: () => void | Promise<void>;
    priority: number; // Lower numbers = higher priority
    isAsync: boolean;
    createdAt: Date;
}

/**
 * Cleanup statistics
 */
export interface CleanupStats {
    totalItems: number;
    cleanedItems: number;
    failedCleanups: number;
    averageCleanupTime: number;
    lastCleanupTime?: Date;
}

/**
 * Hook options
 */
export interface UseSignalRCleanupOptions {
    config?: Partial<SignalRCleanupConfig>;
    onCleanupStart?: () => void;
    onCleanupComplete?: (stats: CleanupStats) => void;
    onCleanupError?: (error: Error, item: CleanupItem) => void;
    enableLogging?: boolean;
}

/**
 * Hook result interface
 */
export interface UseSignalRCleanupResult {
    // Registration
    registerCleanup: (item: Omit<CleanupItem, 'id' | 'createdAt'>) => string;
    registerEventHandler: (
        connection: HubConnection | null,
        eventName: string,
        handler: (...args: unknown[]) => void,
        description?: string
    ) => string;
    registerTimer: (timerId: NodeJS.Timeout, description?: string) => string;
    registerInterval: (
        intervalId: NodeJS.Timeout,
        description?: string
    ) => string;
    registerConnection: (
        connection: HubConnection,
        description?: string
    ) => string;
    registerSubscription: (
        unsubscribe: () => void,
        description?: string
    ) => string;

    // Management
    unregisterCleanup: (id: string) => boolean;
    cleanupItem: (id: string) => Promise<boolean>;
    cleanupByType: (type: CleanupItemType) => Promise<number>;
    cleanupAll: () => Promise<CleanupStats>;

    // Information
    getCleanupItems: () => CleanupItem[];
    getCleanupStats: () => CleanupStats;
    hasCleanupItems: () => boolean;

    // Configuration
    updateConfig: (config: Partial<SignalRCleanupConfig>) => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SignalRCleanupConfig = {
    enableAutoCleanup: true,
    cleanupTimeout: 5000, // 5 seconds
    enableGracefulShutdown: true,
    gracePeriod: 2000, // 2 seconds
    enableLogging: process.env.NODE_ENV === 'development',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique cleanup item ID
 */
const generateCleanupId = (): string => {
    return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Executes cleanup with timeout
 */
const executeCleanupWithTimeout = async (
    cleanup: () => void | Promise<void>,
    timeout: number
): Promise<void> => {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Cleanup timed out after ${timeout}ms`));
        }, timeout);

        const result = cleanup();

        if (result instanceof Promise) {
            result
                .then(() => {
                    clearTimeout(timeoutId);
                    resolve();
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        } else {
            clearTimeout(timeoutId);
            resolve();
        }
    });
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for managing SignalR-related cleanup operations
 */
export const useSignalRCleanup = (
    options: UseSignalRCleanupOptions = {}
): UseSignalRCleanupResult => {
    const {
        config = {},
        onCleanupStart,
        onCleanupComplete,
        onCleanupError,
        enableLogging = false,
    } = options;

    // Merge configuration with defaults
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Refs for cleanup items and configuration
    const cleanupItemsRef = useRef<Map<string, CleanupItem>>(new Map());
    const configRef = useRef(finalConfig);
    const statsRef = useRef<CleanupStats>({
        totalItems: 0,
        cleanedItems: 0,
        failedCleanups: 0,
        averageCleanupTime: 0,
    });
    const cleanupTimesRef = useRef<number[]>([]);

    // Update config ref when config changes
    useEffect(() => {
        configRef.current = { ...DEFAULT_CONFIG, ...config };
    }, [config]);

    // Helper function to log messages
    const log = useCallback(
        (message: string, ...args: unknown[]) => {
            const config = configRef.current;
            if (enableLogging || config.enableLogging) {
                console.log(`[SignalRCleanup] ${message}`, ...args);
            }
        },
        [enableLogging]
    );

    // Update statistics
    const updateStats = useCallback(() => {
        const items = cleanupItemsRef.current;
        const cleanupTimes = cleanupTimesRef.current;

        statsRef.current = {
            totalItems: items.size,
            cleanedItems: statsRef.current.cleanedItems,
            failedCleanups: statsRef.current.failedCleanups,
            averageCleanupTime:
                cleanupTimes.length > 0
                    ? cleanupTimes.reduce((sum, time) => sum + time, 0) /
                      cleanupTimes.length
                    : 0,
            lastCleanupTime: statsRef.current.lastCleanupTime,
        };
    }, []);

    // Register cleanup item
    const registerCleanup = useCallback(
        (item: Omit<CleanupItem, 'id' | 'createdAt'>): string => {
            const id = generateCleanupId();
            const cleanupItem: CleanupItem = {
                ...item,
                id,
                createdAt: new Date(),
            };

            cleanupItemsRef.current.set(id, cleanupItem);
            updateStats();

            log(
                `Registered cleanup item: ${cleanupItem.type} - ${cleanupItem.description}`
            );
            return id;
        },
        [log, updateStats]
    );

    // Register event handler cleanup
    const registerEventHandler = useCallback(
        (
            connection: HubConnection | null,
            eventName: string,
            handler: (...args: unknown[]) => void,
            description?: string
        ): string => {
            return registerCleanup({
                type: CleanupItemType.EventHandler,
                description: description || `Event handler for '${eventName}'`,
                cleanup: () => {
                    if (connection) {
                        connection.off(eventName, handler);
                    }
                },
                priority: 1,
                isAsync: false,
            });
        },
        [registerCleanup]
    );

    // Register timer cleanup
    const registerTimer = useCallback(
        (timerId: NodeJS.Timeout, description?: string): string => {
            return registerCleanup({
                type: CleanupItemType.Timer,
                description: description || 'Timer cleanup',
                cleanup: () => {
                    clearTimeout(timerId);
                },
                priority: 2,
                isAsync: false,
            });
        },
        [registerCleanup]
    );

    // Register interval cleanup
    const registerInterval = useCallback(
        (intervalId: NodeJS.Timeout, description?: string): string => {
            return registerCleanup({
                type: CleanupItemType.Interval,
                description: description || 'Interval cleanup',
                cleanup: () => {
                    clearInterval(intervalId);
                },
                priority: 2,
                isAsync: false,
            });
        },
        [registerCleanup]
    );

    // Register connection cleanup
    const registerConnection = useCallback(
        (connection: HubConnection, description?: string): string => {
            return registerCleanup({
                type: CleanupItemType.Connection,
                description: description || 'SignalR connection cleanup',
                cleanup: async () => {
                    try {
                        if (connection.state !== 'Disconnected') {
                            await connection.stop();
                        }
                    } catch (error) {
                        log(`Error stopping connection during cleanup:`, error);
                    }
                },
                priority: 0, // Highest priority
                isAsync: true,
            });
        },
        [registerCleanup, log]
    );

    // Register subscription cleanup
    const registerSubscription = useCallback(
        (unsubscribe: () => void, description?: string): string => {
            return registerCleanup({
                type: CleanupItemType.Subscription,
                description: description || 'Subscription cleanup',
                cleanup: unsubscribe,
                priority: 1,
                isAsync: false,
            });
        },
        [registerCleanup]
    );

    // Unregister cleanup item
    const unregisterCleanup = useCallback(
        (id: string): boolean => {
            const success = cleanupItemsRef.current.delete(id);
            if (success) {
                updateStats();
                log(`Unregistered cleanup item: ${id}`);
            }
            return success;
        },
        [log, updateStats]
    );

    // Cleanup single item
    const cleanupItem = useCallback(
        async (id: string): Promise<boolean> => {
            const item = cleanupItemsRef.current.get(id);
            if (!item) {
                return false;
            }

            const config = configRef.current;
            const startTime = Date.now();

            try {
                log(`Cleaning up item: ${item.type} - ${item.description}`);

                if (item.isAsync) {
                    await executeCleanupWithTimeout(
                        item.cleanup,
                        config.cleanupTimeout
                    );
                } else {
                    item.cleanup();
                }

                const cleanupTime = Date.now() - startTime;
                cleanupTimesRef.current.push(cleanupTime);

                // Keep only last 100 cleanup times for performance
                if (cleanupTimesRef.current.length > 100) {
                    cleanupTimesRef.current.shift();
                }

                cleanupItemsRef.current.delete(id);
                statsRef.current.cleanedItems++;
                statsRef.current.lastCleanupTime = new Date();

                updateStats();
                log(
                    `Successfully cleaned up item: ${item.description} (${cleanupTime}ms)`
                );
                return true;
            } catch (error) {
                statsRef.current.failedCleanups++;
                updateStats();

                const cleanupError = error as Error;
                log(
                    `Failed to cleanup item: ${item.description} - ${cleanupError.message}`
                );
                onCleanupError?.(cleanupError, item);
                return false;
            }
        },
        [log, updateStats, onCleanupError]
    );

    // Cleanup items by type
    const cleanupByType = useCallback(
        async (type: CleanupItemType): Promise<number> => {
            const items = Array.from(cleanupItemsRef.current.values())
                .filter((item) => item.type === type)
                .sort((a, b) => a.priority - b.priority);

            let cleanedCount = 0;

            for (const item of items) {
                const success = await cleanupItem(item.id);
                if (success) {
                    cleanedCount++;
                }
            }

            log(
                `Cleaned up ${cleanedCount}/${items.length} items of type: ${type}`
            );
            return cleanedCount;
        },
        [cleanupItem, log]
    );

    // Cleanup all items
    const cleanupAll = useCallback(async (): Promise<CleanupStats> => {
        const startTime = Date.now();

        log(`Starting cleanup of ${cleanupItemsRef.current.size} items`);
        onCleanupStart?.();

        // Sort items by priority (lower number = higher priority)
        const items = Array.from(cleanupItemsRef.current.values()).sort(
            (a, b) => a.priority - b.priority
        );

        const initialStats = { ...statsRef.current };
        let cleanedCount = 0;
        let failedCount = 0;

        // Cleanup items in priority order
        for (const item of items) {
            try {
                const success = await cleanupItem(item.id);
                if (success) {
                    cleanedCount++;
                } else {
                    failedCount++;
                }
            } catch (error) {
                failedCount++;
                log(`Unexpected error during cleanup:`, error);
            }
        }

        const totalTime = Date.now() - startTime;
        const finalStats: CleanupStats = {
            totalItems: initialStats.totalItems,
            cleanedItems: cleanedCount,
            failedCleanups: failedCount,
            averageCleanupTime:
                totalTime / Math.max(1, cleanedCount + failedCount),
            lastCleanupTime: new Date(),
        };

        statsRef.current = finalStats;

        log(
            `Cleanup completed: ${cleanedCount} successful, ${failedCount} failed (${totalTime}ms total)`
        );
        onCleanupComplete?.(finalStats);

        return finalStats;
    }, [log, cleanupItem, onCleanupStart, onCleanupComplete]);

    // Get cleanup items
    const getCleanupItems = useCallback((): CleanupItem[] => {
        return Array.from(cleanupItemsRef.current.values()).sort(
            (a, b) => a.priority - b.priority
        );
    }, []);

    // Get cleanup statistics
    const getCleanupStats = useCallback((): CleanupStats => {
        updateStats();
        return { ...statsRef.current };
    }, [updateStats]);

    // Check if has cleanup items
    const hasCleanupItems = useCallback((): boolean => {
        return cleanupItemsRef.current.size > 0;
    }, []);

    // Update configuration
    const updateConfig = useCallback(
        (newConfig: Partial<SignalRCleanupConfig>) => {
            configRef.current = { ...configRef.current, ...newConfig };
            log(`Configuration updated:`, newConfig);
        },
        [log]
    );

    // Automatic cleanup on unmount
    useEffect(() => {
        // Capture current values inside the effect
        const currentCleanupItems = cleanupItemsRef.current;
        
        return () => {
            const config = configRef.current;
            
            if (config.enableAutoCleanup && currentCleanupItems.size > 0) {
                log(`Component unmounting - performing automatic cleanup`);

                if (config.enableGracefulShutdown) {
                    // Attempt graceful cleanup with timeout
                    const cleanupPromise = cleanupAll();
                    const timeoutPromise = new Promise<void>((resolve) => {
                        setTimeout(resolve, config.gracePeriod);
                    });

                    Promise.race([cleanupPromise, timeoutPromise])
                        .then(() => {
                            log(`Graceful cleanup completed or timed out`);
                        })
                        .catch((error) => {
                            log(`Error during graceful cleanup:`, error);
                        });
                } else {
                    // Immediate cleanup (synchronous only)
                    const items = Array.from(currentCleanupItems.values())
                        .filter((item) => !item.isAsync)
                        .sort((a, b) => a.priority - b.priority);

                    items.forEach((item) => {
                        try {
                            item.cleanup();
                            log(`Emergency cleanup: ${item.description}`);
                        } catch (error) {
                            log(
                                `Emergency cleanup failed: ${item.description}`,
                                error
                            );
                        }
                    });
                }
            }
        };
    }, [cleanupAll, log]); // Include dependencies to fix the warning

    return {
        // Registration
        registerCleanup,
        registerEventHandler,
        registerTimer,
        registerInterval,
        registerConnection,
        registerSubscription,

        // Management
        unregisterCleanup,
        cleanupItem,
        cleanupByType,
        cleanupAll,

        // Information
        getCleanupItems,
        getCleanupStats,
        hasCleanupItems,

        // Configuration
        updateConfig,
    };
};

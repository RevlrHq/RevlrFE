import { useCallback, useRef, useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { NotificationMessage } from '@/types/notifications';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Notification batch configuration
 */
export interface NotificationBatchConfig {
    /** Maximum number of notifications to batch together */
    batchSize: number;
    /** Delay in milliseconds before processing a batch */
    batchDelay: number;
    /** Maximum time to wait before forcing batch processing */
    maxWaitTime: number;
    /** Enable batching functionality */
    enableBatching: boolean;
    /** Enable debouncing for rapid notifications */
    enableDebouncing: boolean;
    /** Debounce delay in milliseconds */
    debounceDelay: number;
}

/**
 * Notification batch processing result
 */
export interface NotificationBatchResult {
    batchId: string;
    processedCount: number;
    successCount: number;
    failureCount: number;
    processingTime: number;
    timestamp: Date;
}

/**
 * Batch processing statistics
 */
export interface BatchingStats {
    totalBatches: number;
    totalNotifications: number;
    averageBatchSize: number;
    averageProcessingTime: number;
    successRate: number;
    lastBatchTime?: Date;
}

/**
 * Notification processor function type
 */
export type NotificationProcessor = (
    notifications: NotificationMessage[]
) => Promise<NotificationBatchResult>;

/**
 * Hook options
 */
export interface UseNotificationBatchingOptions {
    config?: Partial<NotificationBatchConfig>;
    processor: NotificationProcessor;
    onBatchProcessed?: (result: NotificationBatchResult) => void;
    onBatchError?: (error: Error, notifications: NotificationMessage[]) => void;
    enableLogging?: boolean;
}

/**
 * Hook result interface
 */
export interface UseNotificationBatchingResult {
    // State
    isProcessing: boolean;
    pendingCount: number;
    stats: BatchingStats;

    // Actions
    addNotification: (notification: NotificationMessage) => void;
    addNotifications: (notifications: NotificationMessage[]) => void;
    flushBatch: () => Promise<void>;
    clearPending: () => void;

    // Configuration
    updateConfig: (config: Partial<NotificationBatchConfig>) => void;

    // Statistics
    resetStats: () => void;
    getStats: () => BatchingStats;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: NotificationBatchConfig = {
    batchSize: 5,
    batchDelay: 1000, // 1 second
    maxWaitTime: 5000, // 5 seconds
    enableBatching: true,
    enableDebouncing: true,
    debounceDelay: 300, // 300ms
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique batch ID
 */
const generateBatchId = (): string => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculates average from array of numbers
 */
const calculateAverage = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for batching and debouncing notification processing
 */
export const useNotificationBatching = (
    options: UseNotificationBatchingOptions
): UseNotificationBatchingResult => {
    const {
        config = {},
        processor,
        onBatchProcessed,
        onBatchError,
        enableLogging = false,
    } = options;

    // Merge configuration with defaults
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // State
    const [isProcessing, setIsProcessing] = useState(false);
    const [stats, setStats] = useState<BatchingStats>({
        totalBatches: 0,
        totalNotifications: 0,
        averageBatchSize: 0,
        averageProcessingTime: 0,
        successRate: 0,
    });

    // Refs for batch management
    const pendingNotificationsRef = useRef<NotificationMessage[]>([]);
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const firstNotificationTimeRef = useRef<number | null>(null);
    const configRef = useRef(finalConfig);
    const statsHistoryRef = useRef<{
        batchSizes: number[];
        processingTimes: number[];
        successCounts: number[];
        totalCounts: number[];
    }>({
        batchSizes: [],
        processingTimes: [],
        successCounts: [],
        totalCounts: [],
    });

    // Update config ref when config changes
    useEffect(() => {
        configRef.current = { ...DEFAULT_CONFIG, ...config };
    }, [config]);

    // Helper function to log messages
    const log = useCallback(
        (message: string, ...args: unknown[]) => {
            if (enableLogging) {
                console.log(`[NotificationBatching] ${message}`, ...args);
            }
        },
        [enableLogging]
    );

    // Clear all timeouts
    const clearTimeouts = useCallback(() => {
        if (batchTimeoutRef.current) {
            clearTimeout(batchTimeoutRef.current);
            batchTimeoutRef.current = null;
        }
        if (maxWaitTimeoutRef.current) {
            clearTimeout(maxWaitTimeoutRef.current);
            maxWaitTimeoutRef.current = null;
        }
    }, []);

    // Update statistics
    const updateStats = useCallback((result: NotificationBatchResult) => {
        const history = statsHistoryRef.current;

        // Add to history
        history.batchSizes.push(result.processedCount);
        history.processingTimes.push(result.processingTime);
        history.successCounts.push(result.successCount);
        history.totalCounts.push(result.processedCount);

        // Keep only last 100 entries for performance
        const maxHistory = 100;
        if (history.batchSizes.length > maxHistory) {
            history.batchSizes = history.batchSizes.slice(-maxHistory);
            history.processingTimes =
                history.processingTimes.slice(-maxHistory);
            history.successCounts = history.successCounts.slice(-maxHistory);
            history.totalCounts = history.totalCounts.slice(-maxHistory);
        }

        // Calculate new statistics
        const totalBatches = history.batchSizes.length;
        const totalNotifications = history.totalCounts.reduce(
            (sum, count) => sum + count,
            0
        );
        const totalSuccesses = history.successCounts.reduce(
            (sum, count) => sum + count,
            0
        );

        setStats({
            totalBatches,
            totalNotifications,
            averageBatchSize: calculateAverage(history.batchSizes),
            averageProcessingTime: calculateAverage(history.processingTimes),
            successRate:
                totalNotifications > 0
                    ? (totalSuccesses / totalNotifications) * 100
                    : 0,
            lastBatchTime: result.timestamp,
        });
    }, []);

    // Process current batch
    const processBatch = useCallback(async (): Promise<void> => {
        if (pendingNotificationsRef.current.length === 0 || isProcessing) {
            return;
        }

        const notifications = [...pendingNotificationsRef.current];
        pendingNotificationsRef.current = [];
        firstNotificationTimeRef.current = null;
        clearTimeouts();

        setIsProcessing(true);

        try {
            log(`Processing batch of ${notifications.length} notifications`);
            const startTime = Date.now();

            const result = await processor(notifications);
            const processingTime = Date.now() - startTime;

            const finalResult: NotificationBatchResult = {
                ...result,
                processingTime,
                timestamp: new Date(),
            };

            log(
                `Batch processed successfully: ${result.successCount}/${result.processedCount} notifications`
            );

            updateStats(finalResult);
            onBatchProcessed?.(finalResult);
        } catch (error) {
            log(`Batch processing failed:`, error);
            onBatchError?.(error as Error, notifications);

            // Update stats with failure
            const failureResult: NotificationBatchResult = {
                batchId: generateBatchId(),
                processedCount: notifications.length,
                successCount: 0,
                failureCount: notifications.length,
                processingTime: 0,
                timestamp: new Date(),
            };
            updateStats(failureResult);
        } finally {
            setIsProcessing(false);
        }
    }, [
        isProcessing,
        processor,
        onBatchProcessed,
        onBatchError,
        log,
        clearTimeouts,
        updateStats,
    ]);

    // Debounced process batch function
    const debouncedProcessBatch = useDebounce(
        processBatch,
        configRef.current.enableDebouncing ? configRef.current.debounceDelay : 0
    );

    // Schedule batch processing
    const scheduleBatchProcessing = useCallback(() => {
        const config = configRef.current;

        if (!config.enableBatching) {
            // Process immediately if batching is disabled
            processBatch();
            return;
        }

        // Clear existing timeout
        if (batchTimeoutRef.current) {
            clearTimeout(batchTimeoutRef.current);
        }

        // Set up batch delay timeout
        batchTimeoutRef.current = setTimeout(() => {
            if (config.enableDebouncing) {
                debouncedProcessBatch();
            } else {
                processBatch();
            }
        }, config.batchDelay);

        // Set up max wait timeout if this is the first notification
        if (firstNotificationTimeRef.current === null) {
            firstNotificationTimeRef.current = Date.now();

            maxWaitTimeoutRef.current = setTimeout(() => {
                log(`Max wait time reached, forcing batch processing`);
                clearTimeouts();
                processBatch();
            }, config.maxWaitTime);
        }
    }, [processBatch, debouncedProcessBatch, log]);

    // Add single notification
    const addNotification = useCallback(
        (notification: NotificationMessage) => {
            const config = configRef.current;

            log(`Adding notification to batch: ${notification.id}`);
            pendingNotificationsRef.current.push(notification);

            // Check if we should process immediately
            if (
                !config.enableBatching ||
                pendingNotificationsRef.current.length >= config.batchSize
            ) {
                log(
                    `Batch size limit reached (${config.batchSize}), processing immediately`
                );
                clearTimeouts();
                processBatch();
            } else {
                scheduleBatchProcessing();
            }
        },
        [log, processBatch, scheduleBatchProcessing, clearTimeouts]
    );

    // Add multiple notifications
    const addNotifications = useCallback(
        (notifications: NotificationMessage[]) => {
            const config = configRef.current;

            log(`Adding ${notifications.length} notifications to batch`);
            pendingNotificationsRef.current.push(...notifications);

            // Check if we should process immediately
            if (
                !config.enableBatching ||
                pendingNotificationsRef.current.length >= config.batchSize
            ) {
                log(
                    `Batch size limit reached (${config.batchSize}), processing immediately`
                );
                clearTimeouts();
                processBatch();
            } else {
                scheduleBatchProcessing();
            }
        },
        [log, processBatch, scheduleBatchProcessing, clearTimeouts]
    );

    // Flush current batch immediately
    const flushBatch = useCallback(async (): Promise<void> => {
        log(
            `Flushing current batch (${pendingNotificationsRef.current.length} notifications)`
        );
        clearTimeouts();
        await processBatch();
    }, [log, clearTimeouts, processBatch]);

    // Clear pending notifications
    const clearPending = useCallback(() => {
        log(
            `Clearing ${pendingNotificationsRef.current.length} pending notifications`
        );
        pendingNotificationsRef.current = [];
        firstNotificationTimeRef.current = null;
        clearTimeouts();
    }, [log, clearTimeouts]);

    // Update configuration
    const updateConfig = useCallback(
        (newConfig: Partial<NotificationBatchConfig>) => {
            configRef.current = { ...configRef.current, ...newConfig };
            log(`Configuration updated:`, newConfig);
        },
        [log]
    );

    // Reset statistics
    const resetStats = useCallback(() => {
        statsHistoryRef.current = {
            batchSizes: [],
            processingTimes: [],
            successCounts: [],
            totalCounts: [],
        };
        setStats({
            totalBatches: 0,
            totalNotifications: 0,
            averageBatchSize: 0,
            averageProcessingTime: 0,
            successRate: 0,
        });
        log(`Statistics reset`);
    }, [log]);

    // Get current statistics
    const getStats = useCallback((): BatchingStats => {
        return { ...stats };
    }, [stats]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeouts();
        };
    }, [clearTimeouts]);

    return {
        // State
        isProcessing,
        pendingCount: pendingNotificationsRef.current.length,
        stats,

        // Actions
        addNotification,
        addNotifications,
        flushBatch,
        clearPending,

        // Configuration
        updateConfig,

        // Statistics
        resetStats,
        getStats,
    };
};

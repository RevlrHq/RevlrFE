import { useState, useCallback, useEffect, useRef } from 'react';
import type {
    NotificationMessage,
    NotificationType,
} from '@/types/notifications';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Notification history entry with metadata
 */
export interface NotificationHistoryEntry {
    notification: NotificationMessage;
    receivedAt: Date;
    readAt?: Date;
    dismissedAt?: Date;
    isRead: boolean;
    isDismissed: boolean;
    metadata?: Record<string, unknown>;
}

/**
 * History configuration options
 */
export interface NotificationHistoryConfig {
    /** Maximum number of notifications to keep in memory */
    maxSize: number;
    /** Enable persistence to localStorage */
    enablePersistence: boolean;
    /** Storage key for localStorage */
    storageKey: string;
    /** Enable automatic cleanup of old notifications */
    enableAutoCleanup: boolean;
    /** Maximum age of notifications in milliseconds */
    maxAge: number;
    /** Cleanup interval in milliseconds */
    cleanupInterval: number;
}

/**
 * History statistics
 */
export interface HistoryStats {
    total: number;
    unread: number;
    dismissed: number;
    recentCount: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    memoryUsage: number; // Estimated memory usage in bytes
}

/**
 * History filter options
 */
export interface HistoryFilter {
    types?: NotificationType[];
    isRead?: boolean;
    isDismissed?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    searchText?: string;
}

/**
 * Hook options
 */
export interface UseNotificationHistoryOptions {
    config?: Partial<NotificationHistoryConfig>;
    enableLogging?: boolean;
    onHistoryChange?: (entries: NotificationHistoryEntry[]) => void;
    onMemoryLimitReached?: (currentSize: number, maxSize: number) => void;
}

/**
 * Hook result interface
 */
export interface UseNotificationHistoryResult {
    // State
    entries: NotificationHistoryEntry[];
    stats: HistoryStats;
    isLoading: boolean;

    // Actions
    addNotification: (notification: NotificationMessage) => void;
    addNotifications: (notifications: NotificationMessage[]) => void;
    markAsRead: (notificationId: string) => boolean;
    markAllAsRead: () => number;
    dismissNotification: (notificationId: string) => boolean;
    dismissAll: () => number;
    removeNotification: (notificationId: string) => boolean;
    clearHistory: () => void;

    // Queries
    getNotification: (
        notificationId: string
    ) => NotificationHistoryEntry | undefined;
    getNotificationsByType: (
        type: NotificationType
    ) => NotificationHistoryEntry[];
    getUnreadNotifications: () => NotificationHistoryEntry[];
    getRecentNotifications: (count?: number) => NotificationHistoryEntry[];
    searchNotifications: (query: string) => NotificationHistoryEntry[];
    filterNotifications: (filter: HistoryFilter) => NotificationHistoryEntry[];

    // Statistics
    getStats: () => HistoryStats;
    getUnreadCount: () => number;
    getDismissedCount: () => number;

    // Persistence
    saveToStorage: () => boolean;
    loadFromStorage: () => boolean;
    clearStorage: () => void;

    // Memory management
    cleanup: () => number;
    forceCleanup: () => number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: NotificationHistoryConfig = {
    maxSize: 100,
    enablePersistence: true,
    storageKey: 'signalr_notification_history',
    enableAutoCleanup: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    cleanupInterval: 60 * 60 * 1000, // 1 hour
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Estimates memory usage of a notification entry
 */
const estimateEntrySize = (entry: NotificationHistoryEntry): number => {
    const jsonString = JSON.stringify(entry);
    return new Blob([jsonString]).size;
};

/**
 * Estimates total memory usage of entries
 */
const estimateTotalSize = (entries: NotificationHistoryEntry[]): number => {
    return entries.reduce(
        (total, entry) => total + estimateEntrySize(entry),
        0
    );
};

/**
 * Checks if a notification matches the search query
 */
const matchesSearchQuery = (
    entry: NotificationHistoryEntry,
    query: string
): boolean => {
    const searchText = query.toLowerCase();
    const notification = entry.notification;

    return (
        notification.title.toLowerCase().includes(searchText) ||
        notification.message.toLowerCase().includes(searchText) ||
        notification.type.toLowerCase().includes(searchText) ||
        (notification.data &&
            JSON.stringify(notification.data)
                .toLowerCase()
                .includes(searchText))
    );
};

/**
 * Checks if a notification matches the filter criteria
 */
const matchesFilter = (
    entry: NotificationHistoryEntry,
    filter: HistoryFilter
): boolean => {
    // Type filter
    if (filter.types && !filter.types.includes(entry.notification.type)) {
        return false;
    }

    // Read status filter
    if (filter.isRead !== undefined && entry.isRead !== filter.isRead) {
        return false;
    }

    // Dismissed status filter
    if (
        filter.isDismissed !== undefined &&
        entry.isDismissed !== filter.isDismissed
    ) {
        return false;
    }

    // Date range filter
    if (filter.dateRange) {
        const entryDate = entry.receivedAt;
        if (
            entryDate < filter.dateRange.start ||
            entryDate > filter.dateRange.end
        ) {
            return false;
        }
    }

    // Search text filter
    if (filter.searchText && !matchesSearchQuery(entry, filter.searchText)) {
        return false;
    }

    return true;
};

/**
 * Serializes entries for storage
 */
const serializeEntries = (entries: NotificationHistoryEntry[]): string => {
    return JSON.stringify(
        entries.map((entry) => ({
            ...entry,
            receivedAt: entry.receivedAt.toISOString(),
            readAt: entry.readAt?.toISOString(),
            dismissedAt: entry.dismissedAt?.toISOString(),
        }))
    );
};

/**
 * Deserializes entries from storage
 */
const deserializeEntries = (data: string): NotificationHistoryEntry[] => {
    try {
        const parsed = JSON.parse(data);
        return parsed.map((entry: unknown) => ({
            ...entry,
            receivedAt: new Date(entry.receivedAt),
            readAt: entry.readAt ? new Date(entry.readAt) : undefined,
            dismissedAt: entry.dismissedAt
                ? new Date(entry.dismissedAt)
                : undefined,
        }));
    } catch {
        return [];
    }
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for managing notification history with memory limits and persistence
 */
export const useNotificationHistory = (
    options: UseNotificationHistoryOptions = {}
): UseNotificationHistoryResult => {
    const {
        config = {},
        enableLogging = false,
        onHistoryChange,
        onMemoryLimitReached,
    } = options;

    // Merge configuration with defaults
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // State
    const [entries, setEntries] = useState<NotificationHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<HistoryStats>({
        total: 0,
        unread: 0,
        dismissed: 0,
        recentCount: 0,
        memoryUsage: 0,
    });

    // Refs for cleanup and configuration
    const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const configRef = useRef(finalConfig);

    // Update config ref when config changes
    useEffect(() => {
        configRef.current = { ...DEFAULT_CONFIG, ...config };
    }, [config]);

    // Helper function to log messages
    const log = useCallback(
        (message: string, ...args: unknown[]) => {
            if (enableLogging) {
                console.log(`[NotificationHistory] ${message}`, ...args);
            }
        },
        [enableLogging]
    );

    // Calculate and update statistics
    const updateStats = useCallback(
        (currentEntries: NotificationHistoryEntry[]) => {
            const now = new Date();
            const recentThreshold = new Date(
                now.getTime() - 24 * 60 * 60 * 1000
            ); // 24 hours ago

            const newStats: HistoryStats = {
                total: currentEntries.length,
                unread: currentEntries.filter((entry) => !entry.isRead).length,
                dismissed: currentEntries.filter((entry) => entry.isDismissed)
                    .length,
                recentCount: currentEntries.filter(
                    (entry) => entry.receivedAt > recentThreshold
                ).length,
                memoryUsage: estimateTotalSize(currentEntries),
            };

            if (currentEntries.length > 0) {
                const dates = currentEntries.map((entry) => entry.receivedAt);
                newStats.oldestEntry = new Date(
                    Math.min(...dates.map((d) => d.getTime()))
                );
                newStats.newestEntry = new Date(
                    Math.max(...dates.map((d) => d.getTime()))
                );
            }

            setStats(newStats);
            return newStats;
        },
        []
    );

    // Cleanup old entries based on age and size limits
    const performCleanup = useCallback(
        (
            currentEntries: NotificationHistoryEntry[]
        ): NotificationHistoryEntry[] => {
            const config = configRef.current;
            let cleanedEntries = [...currentEntries];
            let removedCount = 0;

            // Remove entries older than maxAge
            if (config.enableAutoCleanup && config.maxAge > 0) {
                const cutoffDate = new Date(Date.now() - config.maxAge);
                const beforeCount = cleanedEntries.length;
                cleanedEntries = cleanedEntries.filter(
                    (entry) => entry.receivedAt > cutoffDate
                );
                removedCount += beforeCount - cleanedEntries.length;
            }

            // Remove oldest entries if we exceed maxSize
            if (cleanedEntries.length > config.maxSize) {
                // Sort by receivedAt (oldest first) and remove excess
                cleanedEntries.sort(
                    (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()
                );
                const excessCount = cleanedEntries.length - config.maxSize;
                cleanedEntries = cleanedEntries.slice(excessCount);
                removedCount += excessCount;

                // Notify about memory limit
                if (onMemoryLimitReached) {
                    onMemoryLimitReached(
                        cleanedEntries.length + excessCount,
                        config.maxSize
                    );
                }
            }

            // Sort by receivedAt (newest first) for display
            cleanedEntries.sort(
                (a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()
            );

            if (removedCount > 0) {
                log(`Cleanup removed ${removedCount} old entries`);
            }

            return cleanedEntries;
        },
        [log, onMemoryLimitReached]
    );

    // Update entries with cleanup and stats update
    const updateEntries = useCallback(
        (newEntries: NotificationHistoryEntry[]) => {
            const cleanedEntries = performCleanup(newEntries);
            setEntries(cleanedEntries);
            updateStats(cleanedEntries);
            onHistoryChange?.(cleanedEntries);
            return cleanedEntries;
        },
        [performCleanup, updateStats, onHistoryChange]
    );

    // Add single notification
    const addNotification = useCallback(
        (notification: NotificationMessage) => {
            log(`Adding notification to history: ${notification.id}`);

            const newEntry: NotificationHistoryEntry = {
                notification,
                receivedAt: new Date(),
                isRead: false,
                isDismissed: false,
            };

            setEntries((currentEntries) => {
                // Check if notification already exists
                const existingIndex = currentEntries.findIndex(
                    (entry) => entry.notification.id === notification.id
                );

                let updatedEntries: NotificationHistoryEntry[];
                if (existingIndex >= 0) {
                    // Update existing entry
                    updatedEntries = [...currentEntries];
                    updatedEntries[existingIndex] = {
                        ...updatedEntries[existingIndex],
                        ...newEntry,
                    };
                    log(`Updated existing notification: ${notification.id}`);
                } else {
                    // Add new entry
                    updatedEntries = [newEntry, ...currentEntries];
                    log(`Added new notification: ${notification.id}`);
                }

                return updateEntries(updatedEntries);
            });
        },
        [log, updateEntries]
    );

    // Add multiple notifications
    const addNotifications = useCallback(
        (notifications: NotificationMessage[]) => {
            log(`Adding ${notifications.length} notifications to history`);

            const newEntries: NotificationHistoryEntry[] = notifications.map(
                (notification) => ({
                    notification,
                    receivedAt: new Date(),
                    isRead: false,
                    isDismissed: false,
                })
            );

            setEntries((currentEntries) => {
                const updatedEntries = [...currentEntries];

                newEntries.forEach((newEntry) => {
                    const existingIndex = updatedEntries.findIndex(
                        (entry) =>
                            entry.notification.id === newEntry.notification.id
                    );

                    if (existingIndex >= 0) {
                        // Update existing entry
                        updatedEntries[existingIndex] = {
                            ...updatedEntries[existingIndex],
                            ...newEntry,
                        };
                    } else {
                        // Add new entry at the beginning
                        updatedEntries.unshift(newEntry);
                    }
                });

                return updateEntries(updatedEntries);
            });
        },
        [log, updateEntries]
    );

    // Mark notification as read
    const markAsRead = useCallback(
        (notificationId: string): boolean => {
            let found = false;

            setEntries((currentEntries) => {
                const updatedEntries = currentEntries.map((entry) => {
                    if (
                        entry.notification.id === notificationId &&
                        !entry.isRead
                    ) {
                        found = true;
                        return {
                            ...entry,
                            isRead: true,
                            readAt: new Date(),
                        };
                    }
                    return entry;
                });

                if (found) {
                    log(`Marked notification as read: ${notificationId}`);
                    return updateEntries(updatedEntries);
                }

                return currentEntries;
            });

            return found;
        },
        [log, updateEntries]
    );

    // Mark all notifications as read
    const markAllAsRead = useCallback((): number => {
        let markedCount = 0;

        setEntries((currentEntries) => {
            const now = new Date();
            const updatedEntries = currentEntries.map((entry) => {
                if (!entry.isRead) {
                    markedCount++;
                    return {
                        ...entry,
                        isRead: true,
                        readAt: now,
                    };
                }
                return entry;
            });

            if (markedCount > 0) {
                log(`Marked ${markedCount} notifications as read`);
                return updateEntries(updatedEntries);
            }

            return currentEntries;
        });

        return markedCount;
    }, [log, updateEntries]);

    // Dismiss notification
    const dismissNotification = useCallback(
        (notificationId: string): boolean => {
            let found = false;

            setEntries((currentEntries) => {
                const updatedEntries = currentEntries.map((entry) => {
                    if (
                        entry.notification.id === notificationId &&
                        !entry.isDismissed
                    ) {
                        found = true;
                        return {
                            ...entry,
                            isDismissed: true,
                            dismissedAt: new Date(),
                        };
                    }
                    return entry;
                });

                if (found) {
                    log(`Dismissed notification: ${notificationId}`);
                    return updateEntries(updatedEntries);
                }

                return currentEntries;
            });

            return found;
        },
        [log, updateEntries]
    );

    // Dismiss all notifications
    const dismissAll = useCallback((): number => {
        let dismissedCount = 0;

        setEntries((currentEntries) => {
            const now = new Date();
            const updatedEntries = currentEntries.map((entry) => {
                if (!entry.isDismissed) {
                    dismissedCount++;
                    return {
                        ...entry,
                        isDismissed: true,
                        dismissedAt: now,
                    };
                }
                return entry;
            });

            if (dismissedCount > 0) {
                log(`Dismissed ${dismissedCount} notifications`);
                return updateEntries(updatedEntries);
            }

            return currentEntries;
        });

        return dismissedCount;
    }, [log, updateEntries]);

    // Remove notification from history
    const removeNotification = useCallback(
        (notificationId: string): boolean => {
            let found = false;

            setEntries((currentEntries) => {
                const updatedEntries = currentEntries.filter((entry) => {
                    if (entry.notification.id === notificationId) {
                        found = true;
                        return false;
                    }
                    return true;
                });

                if (found) {
                    log(`Removed notification from history: ${notificationId}`);
                    return updateEntries(updatedEntries);
                }

                return currentEntries;
            });

            return found;
        },
        [log, updateEntries]
    );

    // Clear all history
    const clearHistory = useCallback(() => {
        log(`Clearing all notification history (${entries.length} entries)`);
        setEntries([]);
        setStats({
            total: 0,
            unread: 0,
            dismissed: 0,
            recentCount: 0,
            memoryUsage: 0,
        });
        onHistoryChange?.([]);
    }, [log, entries.length, onHistoryChange]);

    // Query functions
    const getNotification = useCallback(
        (notificationId: string): NotificationHistoryEntry | undefined => {
            return entries.find(
                (entry) => entry.notification.id === notificationId
            );
        },
        [entries]
    );

    const getNotificationsByType = useCallback(
        (type: NotificationType): NotificationHistoryEntry[] => {
            return entries.filter((entry) => entry.notification.type === type);
        },
        [entries]
    );

    const getUnreadNotifications =
        useCallback((): NotificationHistoryEntry[] => {
            return entries.filter((entry) => !entry.isRead);
        }, [entries]);

    const getRecentNotifications = useCallback(
        (count: number = 10): NotificationHistoryEntry[] => {
            return entries.slice(0, count);
        },
        [entries]
    );

    const searchNotifications = useCallback(
        (query: string): NotificationHistoryEntry[] => {
            if (!query.trim()) return entries;
            return entries.filter((entry) => matchesSearchQuery(entry, query));
        },
        [entries]
    );

    const filterNotifications = useCallback(
        (filter: HistoryFilter): NotificationHistoryEntry[] => {
            return entries.filter((entry) => matchesFilter(entry, filter));
        },
        [entries]
    );

    // Statistics functions
    const getStats = useCallback((): HistoryStats => {
        return { ...stats };
    }, [stats]);

    const getUnreadCount = useCallback((): number => {
        return stats.unread;
    }, [stats.unread]);

    const getDismissedCount = useCallback((): number => {
        return stats.dismissed;
    }, [stats.dismissed]);

    // Persistence functions
    const saveToStorage = useCallback((): boolean => {
        if (!finalConfig.enablePersistence) return false;

        try {
            const serialized = serializeEntries(entries);
            localStorage.setItem(finalConfig.storageKey, serialized);
            log(`Saved ${entries.length} entries to storage`);
            return true;
        } catch (error) {
            log(`Failed to save to storage:`, error);
            return false;
        }
    }, [finalConfig.enablePersistence, finalConfig.storageKey, entries, log]);

    const loadFromStorage = useCallback((): boolean => {
        if (!finalConfig.enablePersistence) return false;

        try {
            setIsLoading(true);
            const stored = localStorage.getItem(finalConfig.storageKey);
            if (stored) {
                const loadedEntries = deserializeEntries(stored);
                const cleanedEntries = updateEntries(loadedEntries);
                log(`Loaded ${cleanedEntries.length} entries from storage`);
                return true;
            }
            return false;
        } catch (error) {
            log(`Failed to load from storage:`, error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [
        finalConfig.enablePersistence,
        finalConfig.storageKey,
        updateEntries,
        log,
    ]);

    const clearStorage = useCallback(() => {
        if (finalConfig.enablePersistence) {
            localStorage.removeItem(finalConfig.storageKey);
            log(`Cleared storage`);
        }
    }, [finalConfig.enablePersistence, finalConfig.storageKey, log]);

    // Manual cleanup functions
    const cleanup = useCallback((): number => {
        const beforeCount = entries.length;
        const cleanedEntries = performCleanup(entries);
        const removedCount = beforeCount - cleanedEntries.length;

        if (removedCount > 0) {
            setEntries(cleanedEntries);
            updateStats(cleanedEntries);
            onHistoryChange?.(cleanedEntries);
        }

        return removedCount;
    }, [entries, performCleanup, updateStats, onHistoryChange]);

    const forceCleanup = useCallback((): number => {
        const config = configRef.current;
        const beforeCount = entries.length;

        // Force cleanup to half the max size
        const targetSize = Math.floor(config.maxSize / 2);
        let cleanedEntries = [...entries];

        if (cleanedEntries.length > targetSize) {
            cleanedEntries.sort(
                (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()
            );
            cleanedEntries = cleanedEntries.slice(
                cleanedEntries.length - targetSize
            );
            cleanedEntries.sort(
                (a, b) => b.receivedAt.getTime() - a.receivedAt.getTime()
            );
        }

        const removedCount = beforeCount - cleanedEntries.length;

        if (removedCount > 0) {
            setEntries(cleanedEntries);
            updateStats(cleanedEntries);
            onHistoryChange?.(cleanedEntries);
            log(`Force cleanup removed ${removedCount} entries`);
        }

        return removedCount;
    }, [entries, updateStats, onHistoryChange, log]);

    // Auto-save to storage when entries change
    useEffect(() => {
        if (finalConfig.enablePersistence && entries.length > 0) {
            const timeoutId = setTimeout(() => {
                saveToStorage();
            }, 1000); // Debounce saves by 1 second

            return () => clearTimeout(timeoutId);
        }
    }, [entries, finalConfig.enablePersistence, saveToStorage]);

    // Load from storage on mount
    useEffect(() => {
        if (finalConfig.enablePersistence) {
            loadFromStorage();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Set up automatic cleanup interval
    useEffect(() => {
        if (finalConfig.enableAutoCleanup && finalConfig.cleanupInterval > 0) {
            cleanupIntervalRef.current = setInterval(() => {
                cleanup();
            }, finalConfig.cleanupInterval);

            return () => {
                if (cleanupIntervalRef.current) {
                    clearInterval(cleanupIntervalRef.current);
                    cleanupIntervalRef.current = null;
                }
            };
        }
    }, [finalConfig.enableAutoCleanup, finalConfig.cleanupInterval, cleanup]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current);
            }
        };
    }, []);

    return {
        // State
        entries,
        stats,
        isLoading,

        // Actions
        addNotification,
        addNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        dismissAll,
        removeNotification,
        clearHistory,

        // Queries
        getNotification,
        getNotificationsByType,
        getUnreadNotifications,
        getRecentNotifications,
        searchNotifications,
        filterNotifications,

        // Statistics
        getStats,
        getUnreadCount,
        getDismissedCount,

        // Persistence
        saveToStorage,
        loadFromStorage,
        clearStorage,

        // Memory management
        cleanup,
        forceCleanup,
    };
};

/**
 * Offline support utilities for settings management
 * Provides offline data access, sync queues, and conflict resolution
 */

import { useState, useEffect } from 'react';
import { settingsCache, CacheKeys, CacheTTL } from './caching';

export interface OfflineQueueItem {
    id: string;
    action: 'create' | 'update' | 'delete';
    resource: string;
    data: any;
    timestamp: number;
    retryCount: number;
    maxRetries: number;
}

export interface SyncResult {
    success: boolean;
    syncedItems: number;
    failedItems: number;
    conflicts: number;
    errors: Error[];
}

/**
 * Offline queue manager
 */
export class OfflineQueue {
    private queue: OfflineQueueItem[] = [];
    private readonly storageKey = 'revlr_offline_queue';
    private readonly maxQueueSize = 100;
    private syncInProgress = false;

    constructor() {
        this.loadQueue();
    }

    /**
     * Add item to offline queue
     */
    enqueue(
        action: 'create' | 'update' | 'delete',
        resource: string,
        data: any,
        maxRetries: number = 3
    ): string {
        const id = this.generateId();
        const item: OfflineQueueItem = {
            id,
            action,
            resource,
            data,
            timestamp: Date.now(),
            retryCount: 0,
            maxRetries,
        };

        this.queue.push(item);
        this.enforceQueueLimit();
        this.saveQueue();

        return id;
    }

    /**
     * Remove item from queue
     */
    dequeue(id: string): boolean {
        const index = this.queue.findIndex((item) => item.id === id);
        if (index !== -1) {
            this.queue.splice(index, 1);
            this.saveQueue();
            return true;
        }
        return false;
    }

    /**
     * Get queue status
     */
    getStatus(): {
        size: number;
        oldestItem: Date | null;
        syncInProgress: boolean;
    } {
        const oldestTimestamp =
            this.queue.length > 0
                ? Math.min(...this.queue.map((item) => item.timestamp))
                : null;

        return {
            size: this.queue.size,
            oldestItem: oldestTimestamp ? new Date(oldestTimestamp) : null,
            syncInProgress: this.syncInProgress,
        };
    }

    /**
     * Sync queue when online
     */
    async sync(
        syncFunction: (item: OfflineQueueItem) => Promise<void>
    ): Promise<SyncResult> {
        if (this.syncInProgress || !navigator.onLine) {
            return {
                success: false,
                syncedItems: 0,
                failedItems: 0,
                conflicts: 0,
                errors: [new Error('Sync already in progress or offline')],
            };
        }

        this.syncInProgress = true;
        const result: SyncResult = {
            success: true,
            syncedItems: 0,
            failedItems: 0,
            conflicts: 0,
            errors: [],
        };

        const itemsToSync = [...this.queue];

        for (const item of itemsToSync) {
            try {
                await syncFunction(item);
                this.dequeue(item.id);
                result.syncedItems++;
            } catch (error) {
                item.retryCount++;

                if (item.retryCount >= item.maxRetries) {
                    this.dequeue(item.id);
                    result.failedItems++;
                } else {
                    // Keep in queue for retry
                    result.failedItems++;
                }

                if (error instanceof Error) {
                    result.errors.push(error);

                    // Check if it's a conflict error
                    if (
                        error.message.includes('conflict') ||
                        error.message.includes('409')
                    ) {
                        result.conflicts++;
                    }
                }
            }
        }

        this.syncInProgress = false;
        result.success = result.failedItems === 0;

        return result;
    }

    /**
     * Clear all queue items
     */
    clear(): void {
        this.queue = [];
        this.saveQueue();
    }

    private generateId(): string {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private loadQueue(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load offline queue:', error);
            this.queue = [];
        }
    }

    private saveQueue(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
        } catch (error) {
            console.warn('Failed to save offline queue:', error);
        }
    }

    private enforceQueueLimit(): void {
        if (this.queue.length > this.maxQueueSize) {
            // Remove oldest items
            this.queue.sort((a, b) => a.timestamp - b.timestamp);
            this.queue = this.queue.slice(-this.maxQueueSize);
        }
    }
}

/**
 * Offline data manager
 */
export class OfflineDataManager {
    private offlineQueue = new OfflineQueue();

    /**
     * Get data with offline fallback
     */
    async getData<T>(
        key: string,
        fetchFunction: () => Promise<T>,
        options: {
            ttl?: number;
            fallbackToCache?: boolean;
            updateCacheOnFetch?: boolean;
        } = {}
    ): Promise<T | null> {
        const {
            ttl = CacheTTL.MEDIUM,
            fallbackToCache = true,
            updateCacheOnFetch = true,
        } = options;

        // Try to fetch fresh data if online
        if (navigator.onLine) {
            try {
                const data = await fetchFunction();

                if (updateCacheOnFetch) {
                    settingsCache.set(key, data, { ttl });
                }

                return data;
            } catch (error) {
                console.warn(
                    'Failed to fetch fresh data, falling back to cache:',
                    error
                );
            }
        }

        // Fallback to cached data
        if (fallbackToCache) {
            return settingsCache.get<T>(key);
        }

        return null;
    }

    /**
     * Save data with offline queue
     */
    async saveData<T>(
        key: string,
        data: T,
        saveFunction: (data: T) => Promise<void>,
        options: {
            queueIfOffline?: boolean;
            updateCacheImmediately?: boolean;
        } = {}
    ): Promise<void> {
        const { queueIfOffline = true, updateCacheImmediately = true } =
            options;

        // Update cache immediately for optimistic updates
        if (updateCacheImmediately) {
            settingsCache.set(key, data, { ttl: CacheTTL.MEDIUM });
        }

        if (navigator.onLine) {
            try {
                await saveFunction(data);
            } catch (error) {
                // Queue for retry if save fails
                if (queueIfOffline) {
                    this.offlineQueue.enqueue('update', key, data);
                }
                throw error;
            }
        } else if (queueIfOffline) {
            // Queue for later sync
            this.offlineQueue.enqueue('update', key, data);
        } else {
            throw new Error('Cannot save data while offline');
        }
    }

    /**
     * Delete data with offline queue
     */
    async deleteData(
        key: string,
        deleteFunction: () => Promise<void>,
        options: {
            queueIfOffline?: boolean;
            removeCacheImmediately?: boolean;
        } = {}
    ): Promise<void> {
        const { queueIfOffline = true, removeCacheImmediately = true } =
            options;

        // Remove from cache immediately for optimistic updates
        if (removeCacheImmediately) {
            settingsCache.invalidate(key);
        }

        if (navigator.onLine) {
            try {
                await deleteFunction();
            } catch (error) {
                // Queue for retry if delete fails
                if (queueIfOffline) {
                    this.offlineQueue.enqueue('delete', key, null);
                }
                throw error;
            }
        } else if (queueIfOffline) {
            // Queue for later sync
            this.offlineQueue.enqueue('delete', key, null);
        } else {
            throw new Error('Cannot delete data while offline');
        }
    }

    /**
     * Sync offline queue
     */
    async syncOfflineQueue(
        syncHandlers: Record<string, (item: OfflineQueueItem) => Promise<void>>
    ): Promise<SyncResult> {
        return this.offlineQueue.sync(async (item) => {
            const handler = syncHandlers[item.resource];
            if (handler) {
                await handler(item);
            } else {
                throw new Error(
                    `No sync handler for resource: ${item.resource}`
                );
            }
        });
    }

    /**
     * Get offline queue status
     */
    getOfflineStatus() {
        return {
            isOnline: navigator.onLine,
            queue: this.offlineQueue.getStatus(),
        };
    }

    /**
     * Clear offline queue
     */
    clearOfflineQueue(): void {
        this.offlineQueue.clear();
    }
}

/**
 * Singleton offline data manager
 */
export const offlineDataManager = new OfflineDataManager();

/**
 * Network status hook
 */
export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};

/**
 * Initialize offline support
 */
export const initializeOfflineSupport = (): void => {
    // Auto-sync when coming online
    window.addEventListener('online', async () => {
        try {
            // Define sync handlers for different resources
            const syncHandlers = {
                [CacheKeys.USER_PROFILE]: async (item: OfflineQueueItem) => {
                    // Implement profile sync logic
                    const response = await fetch('/api/profile', {
                        method: item.action === 'delete' ? 'DELETE' : 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body:
                            item.action !== 'delete'
                                ? JSON.stringify(item.data)
                                : undefined,
                    });

                    if (!response.ok) {
                        throw new Error(`Sync failed: ${response.statusText}`);
                    }
                },

                [CacheKeys.NOTIFICATION_PREFERENCES]: async (
                    item: OfflineQueueItem
                ) => {
                    // Implement notification preferences sync logic
                    const response = await fetch(
                        '/api/notifications/preferences',
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item.data),
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`Sync failed: ${response.statusText}`);
                    }
                },

                // Add more sync handlers as needed
            };

            const result =
                await offlineDataManager.syncOfflineQueue(syncHandlers);

            if (result.syncedItems > 0) {
                console.log(`Synced ${result.syncedItems} offline items`);
            }

            if (result.failedItems > 0) {
                console.warn(`Failed to sync ${result.failedItems} items`);
            }
        } catch (error) {
            console.error('Failed to sync offline queue:', error);
        }
    });

    // Periodic cleanup of old cache entries
    setInterval(
        () => {
            settingsCache.cleanup();
        },
        10 * 60 * 1000
    ); // Every 10 minutes
};

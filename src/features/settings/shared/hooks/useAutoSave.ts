/**
 * Auto-save hook with debouncing and intelligent saving strategies
 * Provides automatic form saving with conflict resolution and offline support
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { settingsCache, CacheKeys, CacheTTL } from '../utils/caching';
import { auditService } from '../../services/AuditService';

export interface AutoSaveOptions {
    debounceMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    enableOfflineQueue?: boolean;
    conflictResolution?: 'client' | 'server' | 'merge';
    onSaveStart?: () => void;
    onSaveSuccess?: (data: any) => void;
    onSaveError?: (error: Error) => void;
    onConflict?: (clientData: any, serverData: any) => any;
}

export interface AutoSaveState {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    saveError: Error | null;
    retryCount: number;
    isOnline: boolean;
}

export interface AutoSaveActions {
    save: (force?: boolean) => Promise<void>;
    reset: () => void;
    retry: () => Promise<void>;
    enableAutoSave: () => void;
    disableAutoSave: () => void;
}

/**
 * Auto-save hook with advanced features
 */
export const useAutoSave = <T extends Record<string, any>>(
    data: T,
    saveFunction: (data: T) => Promise<void>,
    options: AutoSaveOptions = {}
): [AutoSaveState, AutoSaveActions] => {
    const {
        debounceMs = 2000,
        maxRetries = 3,
        retryDelayMs = 1000,
        enableOfflineQueue = true,
        conflictResolution = 'client',
        onSaveStart,
        onSaveSuccess,
        onSaveError,
        onConflict,
    } = options;

    const [state, setState] = useState<AutoSaveState>({
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        saveError: null,
        retryCount: 0,
        isOnline: navigator.onLine,
    });

    const debounceTimerRef = useRef<NodeJS.Timeout>();
    const retryTimerRef = useRef<NodeJS.Timeout>();
    const lastDataRef = useRef<T>(data);
    const isAutoSaveEnabledRef = useRef(true);
    const offlineQueueRef = useRef<T[]>([]);

    /**
     * Check if data has changed
     */
    const hasDataChanged = useCallback((newData: T, oldData: T): boolean => {
        return JSON.stringify(newData) !== JSON.stringify(oldData);
    }, []);

    /**
     * Save data with retry logic
     */
    const performSave = useCallback(
        async (dataToSave: T, retryCount: number = 0): Promise<void> => {
            try {
                setState((prev) => ({
                    ...prev,
                    isSaving: true,
                    saveError: null,
                }));
                onSaveStart?.();

                // Check for conflicts if this is a retry
                if (retryCount > 0 && conflictResolution !== 'client') {
                    const cacheKey = `${CacheKeys.USER_PROFILE}_conflict_check`;
                    const cachedData = settingsCache.get<T>(cacheKey);

                    if (cachedData && hasDataChanged(dataToSave, cachedData)) {
                        if (conflictResolution === 'server') {
                            // Use server data
                            dataToSave = cachedData;
                        } else if (
                            conflictResolution === 'merge' &&
                            onConflict
                        ) {
                            // Use custom merge logic
                            dataToSave = onConflict(dataToSave, cachedData);
                        }
                    }
                }

                await saveFunction(dataToSave);

                // Cache successful save
                settingsCache.set(
                    `${CacheKeys.USER_PROFILE}_last_saved`,
                    dataToSave,
                    { ttl: CacheTTL.MEDIUM }
                );

                setState((prev) => ({
                    ...prev,
                    isSaving: false,
                    lastSaved: new Date(),
                    hasUnsavedChanges: false,
                    saveError: null,
                    retryCount: 0,
                }));

                lastDataRef.current = dataToSave;
                onSaveSuccess?.(dataToSave);

                // Log successful save
                await auditService.logEvent(
                    'AUTO_SAVE_SUCCESS',
                    'form_data',
                    { retryCount },
                    true
                );
            } catch (error) {
                const saveError =
                    error instanceof Error ? error : new Error('Save failed');

                setState((prev) => ({
                    ...prev,
                    isSaving: false,
                    saveError,
                    retryCount: retryCount + 1,
                }));

                onSaveError?.(saveError);

                // Log save error
                await auditService.logEvent(
                    'AUTO_SAVE_ERROR',
                    'form_data',
                    { retryCount, error: saveError.message },
                    false,
                    saveError.message
                );

                // Retry if under limit
                if (retryCount < maxRetries) {
                    retryTimerRef.current = setTimeout(
                        () => {
                            performSave(dataToSave, retryCount + 1);
                        },
                        retryDelayMs * Math.pow(2, retryCount)
                    ); // Exponential backoff
                } else if (enableOfflineQueue && !navigator.onLine) {
                    // Queue for offline retry
                    offlineQueueRef.current.push(dataToSave);
                }
            }
        },
        [
            saveFunction,
            maxRetries,
            retryDelayMs,
            conflictResolution,
            enableOfflineQueue,
            hasDataChanged,
            onSaveStart,
            onSaveSuccess,
            onSaveError,
            onConflict,
        ]
    );

    /**
     * Debounced save function
     */
    const debouncedSave = useCallback(
        (dataToSave: T) => {
            if (!isAutoSaveEnabledRef.current) return;

            // Clear existing timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Set new timer
            debounceTimerRef.current = setTimeout(() => {
                performSave(dataToSave);
            }, debounceMs);
        },
        [performSave, debounceMs]
    );

    /**
     * Manual save function
     */
    const save = useCallback(
        async (force: boolean = false): Promise<void> => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            if (force || hasDataChanged(data, lastDataRef.current)) {
                await performSave(data);
            }
        },
        [data, performSave, hasDataChanged]
    );

    /**
     * Reset auto-save state
     */
    const reset = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
        }

        setState({
            isSaving: false,
            lastSaved: null,
            hasUnsavedChanges: false,
            saveError: null,
            retryCount: 0,
            isOnline: navigator.onLine,
        });

        lastDataRef.current = data;
        offlineQueueRef.current = [];
    }, [data]);

    /**
     * Retry failed save
     */
    const retry = useCallback(async (): Promise<void> => {
        if (state.saveError) {
            await performSave(data, 0);
        }
    }, [data, performSave, state.saveError]);

    /**
     * Enable auto-save
     */
    const enableAutoSave = useCallback(() => {
        isAutoSaveEnabledRef.current = true;
    }, []);

    /**
     * Disable auto-save
     */
    const disableAutoSave = useCallback(() => {
        isAutoSaveEnabledRef.current = false;
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    }, []);

    /**
     * Handle online/offline status
     */
    useEffect(() => {
        const handleOnline = async () => {
            setState((prev) => ({ ...prev, isOnline: true }));

            // Process offline queue
            if (offlineQueueRef.current.length > 0) {
                const queuedData = offlineQueueRef.current.pop(); // Get latest
                if (queuedData) {
                    await performSave(queuedData);
                }
                offlineQueueRef.current = [];
            }
        };

        const handleOffline = () => {
            setState((prev) => ({ ...prev, isOnline: false }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [performSave]);

    /**
     * Auto-save when data changes
     */
    useEffect(() => {
        if (hasDataChanged(data, lastDataRef.current)) {
            setState((prev) => ({ ...prev, hasUnsavedChanges: true }));

            if (navigator.onLine) {
                debouncedSave(data);
            } else if (enableOfflineQueue) {
                // Queue for later
                offlineQueueRef.current.push(data);
            }
        }
    }, [data, hasDataChanged, debouncedSave, enableOfflineQueue]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
            }
        };
    }, []);

    /**
     * Save on page unload if there are unsaved changes
     */
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (state.hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue =
                    'You have unsaved changes. Are you sure you want to leave?';

                // Attempt to save synchronously (limited browser support)
                if (navigator.sendBeacon) {
                    const blob = new Blob([JSON.stringify(data)], {
                        type: 'application/json',
                    });
                    navigator.sendBeacon('/api/auto-save', blob);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [state.hasUnsavedChanges, data]);

    const actions: AutoSaveActions = {
        save,
        reset,
        retry,
        enableAutoSave,
        disableAutoSave,
    };

    return [state, actions];
};

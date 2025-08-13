import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook for debouncing function calls
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number,
    deps: React.DependencyList = []
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        }) as T,
        [delay, ...deps]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

/**
 * Custom hook for debouncing values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Advanced debounce hook with immediate execution option
 */
export function useAdvancedDebounce<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number,
    options: {
        leading?: boolean; // Execute immediately on first call
        trailing?: boolean; // Execute after delay (default: true)
        maxWait?: number; // Maximum time to wait before executing
    } = {}
): {
    debouncedCallback: T;
    cancel: () => void;
    flush: () => void;
    pending: boolean;
} {
    const { leading = false, trailing = true, maxWait } = options;

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);
    const argsRef = useRef<Parameters<T> | undefined>(undefined);
    const [pending, setPending] = useState(false);

    // Update callback ref when callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (maxTimeoutRef.current) {
            clearTimeout(maxTimeoutRef.current);
            maxTimeoutRef.current = null;
        }
        setPending(false);
    }, []);

    const flush = useCallback(() => {
        if (argsRef.current) {
            callbackRef.current(...argsRef.current);
        }
        cancel();
    }, [cancel]);

    const debouncedCallback = useCallback(
        ((...args: Parameters<T>) => {
            argsRef.current = args;
            setPending(true);

            const execute = () => {
                callbackRef.current(...args);
                cancel();
            };

            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Execute immediately if leading is true and no pending execution
            if (leading && !timeoutRef.current) {
                execute();
                return;
            }

            // Set up trailing execution
            if (trailing) {
                timeoutRef.current = setTimeout(execute, delay);
            }

            // Set up max wait timeout
            if (maxWait && !maxTimeoutRef.current) {
                maxTimeoutRef.current = setTimeout(execute, maxWait);
            }
        }) as T,
        [delay, leading, trailing, maxWait, cancel]
    );

    // Cleanup on unmount
    useEffect(() => {
        return cancel;
    }, [cancel]);

    return {
        debouncedCallback,
        cancel,
        flush,
        pending,
    };
}

/**
 * Hook for debounced auto-save functionality
 */
export function useAutoSave<T>(
    data: T,
    saveFunction: (data: T) => Promise<void>,
    options: {
        delay?: number;
        enabled?: boolean;
        onSaveStart?: () => void;
        onSaveSuccess?: () => void;
        onSaveError?: (error: Error) => void;
    } = {}
) {
    const {
        delay = 2000,
        enabled = true,
        onSaveStart,
        onSaveSuccess,
        onSaveError,
    } = options;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<Error | null>(null);

    const saveCallback = useCallback(
        async (dataToSave: T) => {
            if (!enabled) return;

            try {
                setIsSaving(true);
                setSaveError(null);
                onSaveStart?.();

                await saveFunction(dataToSave);

                setLastSaved(new Date());
                onSaveSuccess?.();
            } catch (error) {
                const saveError =
                    error instanceof Error ? error : new Error('Save failed');
                setSaveError(saveError);
                onSaveError?.(saveError);
            } finally {
                setIsSaving(false);
            }
        },
        [enabled, saveFunction, onSaveStart, onSaveSuccess, onSaveError]
    );

    const {
        debouncedCallback: debouncedSave,
        cancel,
        flush,
    } = useAdvancedDebounce(
        saveCallback as (...args: unknown[]) => unknown,
        delay,
        {
            trailing: true,
            maxWait: delay * 3,
        }
    );

    // Trigger auto-save when data changes
    useEffect(() => {
        if (enabled && data) {
            debouncedSave(data);
        }
    }, [data, enabled, debouncedSave]);

    return {
        isSaving,
        lastSaved,
        saveError,
        forceSave: () => flush(),
        cancelSave: cancel,
    };
}

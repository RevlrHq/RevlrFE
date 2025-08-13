import { useEffect, useRef, useCallback } from 'react';
import {
    monitoring,
    MonitoringService,
} from '../lib/services/MonitoringService';

/**
 * Hook for tracking component performance
 */
export function usePerformanceTracking(componentName: string) {
    const startTimeRef = useRef<number>(Date.now());
    const mountTimeRef = useRef<number | null>(null);

    useEffect(() => {
        mountTimeRef.current = Date.now();
        const mountDuration = mountTimeRef.current - startTimeRef.current;

        // Track component mount time
        monitoring.recordPerformanceMetric({
            name: `component_mount_${componentName.toLowerCase()}`,
            value: mountDuration,
            timestamp: Date.now(),
            metadata: {
                component: componentName,
            },
        });

        return () => {
            if (mountTimeRef.current) {
                const unmountTime = Date.now();
                const totalTime = unmountTime - mountTimeRef.current;

                // Track component lifetime
                monitoring.recordPerformanceMetric({
                    name: `component_lifetime_${componentName.toLowerCase()}`,
                    value: totalTime,
                    timestamp: Date.now(),
                    metadata: {
                        component: componentName,
                    },
                });
            }
        };
    }, [componentName]);

    const trackAction = useCallback(
        (action: string, metadata?: Record<string, unknown>) => {
            monitoring.recordUserBehavior({
                event: 'component_action',
                component: componentName,
                action,
                metadata,
            });
        },
        [componentName]
    );

    const trackError = useCallback(
        (error: Error, action?: string) => {
            monitoring.recordError({
                message: error.message,
                stack: error.stack,
                component: componentName,
                action: action || 'unknown',
                timestamp: Date.now(),
                sessionId:
                    MonitoringService.getInstance().exportData().sessionId,
                metadata: {
                    component: componentName,
                },
            });
        },
        [componentName]
    );

    return {
        trackAction,
        trackError,
    };
}

/**
 * Hook for tracking form performance and user behavior
 */
export function useFormTracking(formId: string, totalSteps: number) {
    const startTimeRef = useRef<number>(Date.now());
    const stepStartTimeRef = useRef<number>(Date.now());
    const currentStepRef = useRef<number>(1);
    const errorsRef = useRef<string[]>([]);
    const hasTrackedCompletionRef = useRef<boolean>(false);

    const trackStepStart = useCallback((step: number) => {
        const now = Date.now();

        // Track previous step completion if not the first step
        if (currentStepRef.current !== step && currentStepRef.current > 0) {
            const stepDuration = now - stepStartTimeRef.current;
            monitoring.trackEventCreationStep(
                currentStepRef.current,
                'complete',
                {
                    duration: stepDuration,
                    errors: errorsRef.current,
                }
            );
        }

        currentStepRef.current = step;
        stepStartTimeRef.current = now;
        errorsRef.current = [];

        monitoring.trackEventCreationStep(step, 'start');
    }, []);

    const trackStepError = useCallback((error: string) => {
        errorsRef.current.push(error);
        monitoring.trackEventCreationStep(currentStepRef.current, 'error', {
            error,
        });
    }, []);

    const trackFieldInteraction = useCallback(
        (fieldName: string, action: 'focus' | 'blur' | 'change' | 'error') => {
            monitoring.recordUserBehavior({
                event: 'field_interaction',
                component: formId,
                action: `${fieldName}_${action}`,
                metadata: {
                    fieldName,
                    step: currentStepRef.current,
                },
            });
        },
        [formId]
    );

    const trackFormCompletion = useCallback(() => {
        if (hasTrackedCompletionRef.current) return;

        const totalTime = Date.now() - startTimeRef.current;
        hasTrackedCompletionRef.current = true;

        monitoring.trackFormCompletion(
            formId,
            totalSteps,
            totalSteps,
            totalTime,
            errorsRef.current
        );

        monitoring.recordUserBehavior({
            event: 'form_completion',
            component: formId,
            action: 'complete',
            duration: totalTime,
            metadata: {
                totalSteps,
                errors: errorsRef.current,
            },
        });
    }, [formId, totalSteps]);

    const trackFormAbandonment = useCallback(
        (abandonmentPoint: string) => {
            const totalTime = Date.now() - startTimeRef.current;

            monitoring.trackFormAbandonment(
                formId,
                currentStepRef.current,
                totalSteps,
                abandonmentPoint,
                totalTime
            );
        },
        [formId, totalSteps]
    );

    // Track abandonment on unmount if form wasn't completed
    useEffect(() => {
        return () => {
            if (!hasTrackedCompletionRef.current) {
                trackFormAbandonment('component_unmount');
            }
        };
    }, [trackFormAbandonment]);

    return {
        trackStepStart,
        trackStepError,
        trackFieldInteraction,
        trackFormCompletion,
        trackFormAbandonment,
    };
}

/**
 * Hook for tracking API call performance
 */
export function useApiTracking() {
    const trackApiCall = useCallback(
        async <T>(
            apiCall: () => Promise<T>,
            endpoint: string,
            method: string = 'GET'
        ): Promise<T> => {
            const startTime = Date.now();
            let success = false;
            let statusCode: number | undefined;
            let errorMessage: string | undefined;

            try {
                const result = await apiCall();
                success = true;
                statusCode = 200; // Assume success if no error
                return result;
            } catch (error: unknown) {
                success = false;
                const err = error as {
                    status?: number;
                    statusCode?: number;
                    message?: string;
                };
                statusCode = err.status || err.statusCode || 500;
                errorMessage = err.message || 'Unknown API error';
                throw error;
            } finally {
                const duration = Date.now() - startTime;
                monitoring.trackApiCall(
                    endpoint,
                    method,
                    duration,
                    success,
                    statusCode,
                    errorMessage
                );
            }
        },
        []
    );

    return { trackApiCall };
}

/**
 * Hook for tracking image upload performance
 */
export function useImageUploadTracking() {
    const trackImageUpload = useCallback(
        async (
            uploadFn: () => Promise<unknown>,
            fileSize: number,
            compressionRatio?: number
        ): Promise<unknown> => {
            const startTime = Date.now();
            let success = false;
            let errorMessage: string | undefined;

            try {
                const result = await uploadFn();
                success = true;
                return result;
            } catch (error: unknown) {
                success = false;
                const err = error as { message?: string };
                errorMessage = err.message || 'Upload failed';
                throw error;
            } finally {
                const duration = Date.now() - startTime;
                monitoring.trackImageUpload(
                    fileSize,
                    duration,
                    success,
                    compressionRatio,
                    errorMessage
                );
            }
        },
        []
    );

    return { trackImageUpload };
}

/**
 * Hook for tracking user engagement and time spent
 */
export function useEngagementTracking(componentName: string) {
    const startTimeRef = useRef<number>(Date.now());
    const lastActivityRef = useRef<number>(Date.now());
    const totalActiveTimeRef = useRef<number>(0);
    const isActiveRef = useRef<boolean>(true);

    const updateActivity = useCallback(() => {
        const now = Date.now();
        if (isActiveRef.current) {
            totalActiveTimeRef.current += now - lastActivityRef.current;
        }
        lastActivityRef.current = now;
        isActiveRef.current = true;
    }, []);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            isActiveRef.current = false;
        } else {
            updateActivity();
        }
    }, [updateActivity]);

    useEffect(() => {
        // Track user activity
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
        ];
        events.forEach((event) => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        // Track visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            events.forEach((event) => {
                document.removeEventListener(event, updateActivity);
            });
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );

            // Record final engagement metrics
            const totalTime = Date.now() - startTimeRef.current;
            const activeTime =
                totalActiveTimeRef.current +
                (isActiveRef.current
                    ? Date.now() - lastActivityRef.current
                    : 0);

            monitoring.recordUserBehavior({
                event: 'engagement_summary',
                component: componentName,
                action: 'session_end',
                duration: totalTime,
                metadata: {
                    totalTime,
                    activeTime,
                    engagementRate: (activeTime / totalTime) * 100,
                },
            });
        };
    }, [componentName, updateActivity, handleVisibilityChange]);

    return {
        getTotalTime: () => Date.now() - startTimeRef.current,
        getActiveTime: () => {
            const now = Date.now();
            return (
                totalActiveTimeRef.current +
                (isActiveRef.current ? now - lastActivityRef.current : 0)
            );
        },
    };
}

/**
 * Hook for tracking Core Web Vitals
 */
export function useWebVitals() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Track First Contentful Paint
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                    monitoring.recordPerformanceMetric({
                        name: 'first_contentful_paint',
                        value: entry.startTime,
                        timestamp: Date.now(),
                    });
                }
            });
        });

        try {
            observer.observe({ entryTypes: ['paint'] });
        } catch (error) {
            console.warn('Failed to observe paint entries:', error);
        }

        return () => observer.disconnect();
    }, []);
}

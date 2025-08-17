import { useCallback } from 'react';
import { performanceMonitor } from '../lib/utils/performance-monitor';

export const usePerformanceTracking = () => {
    const trackPageView = useCallback((pageName: string) => {
        performanceMonitor.recordMetric({
            name: 'page_view',
            value: Date.now(),
            timestamp: Date.now(),
            metadata: { pageName },
        });
    }, []);

    const trackUserAction = useCallback(
        (actionName: string, metadata?: Record<string, unknown>) => {
            performanceMonitor.recordMetric({
                name: 'user_action',
                value: Date.now(),
                timestamp: Date.now(),
                metadata: { actionName, ...metadata },
            });
        },
        []
    );

    const trackPerformanceMetric = useCallback(
        (
            metricName: string,
            value: number,
            metadata?: Record<string, unknown>
        ) => {
            performanceMonitor.recordMetric({
                name: metricName,
                value,
                timestamp: Date.now(),
                metadata,
            });
        },
        []
    );

    const getPerformanceReport = useCallback(() => {
        return performanceMonitor.generatePerformanceReport();
    }, []);

    return {
        trackPageView,
        trackUserAction,
        trackPerformanceMetric,
        getPerformanceReport,
    };
};

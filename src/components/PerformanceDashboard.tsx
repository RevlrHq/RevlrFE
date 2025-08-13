'use client';

import React, { useState, useEffect } from 'react';
import { monitoring } from '../lib/services/MonitoringService';
import { ComponentPreloader } from '../lib/utils/bundleOptimization';
import { useTheme } from '../lib/ThemeContext';

interface PerformanceMetrics {
    averageApiResponseTime: number;
    totalErrors: number;
    formCompletionRate: number;
    imageUploadSuccessRate: number;
    bundleLoadTime: number;
    componentLoadTimes: Record<string, number>;
    userEngagement: {
        totalTime: number;
        activeTime: number;
        engagementRate: number;
    };
}

export const PerformanceDashboard: React.FC = () => {
    const { theme } = useTheme();
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [preloadStatus, setPreloadStatus] = useState(
        ComponentPreloader.getPreloadStatus()
    );

    useEffect(() => {
        // Only show in development or for admin users
        const shouldShow =
            process.env.NODE_ENV === 'development' ||
            localStorage.getItem('show_performance_dashboard') === 'true';
        setIsVisible(shouldShow);

        if (shouldShow) {
            const updateMetrics = () => {
                const summary = monitoring.getPerformanceSummary();
                const exportedData = monitoring.exportData();

                // Calculate additional metrics
                const componentLoadTimes: Record<string, number> = {};
                exportedData.performanceMetrics
                    .filter((m) => m.name.startsWith('component_mount_'))
                    .forEach((m) => {
                        const componentName = m.name.replace(
                            'component_mount_',
                            ''
                        );
                        componentLoadTimes[componentName] = m.value;
                    });

                const bundleMetrics = exportedData.performanceMetrics.filter(
                    (m) => m.name === 'bundle_load_time'
                );
                const averageBundleLoadTime =
                    bundleMetrics.length > 0
                        ? bundleMetrics.reduce((sum, m) => sum + m.value, 0) /
                          bundleMetrics.length
                        : 0;

                const engagementEvents = exportedData.userBehaviorEvents.filter(
                    (e) => e.event === 'engagement_summary'
                );
                const latestEngagement =
                    engagementEvents[engagementEvents.length - 1];

                setMetrics({
                    ...summary,
                    bundleLoadTime: averageBundleLoadTime,
                    componentLoadTimes,
                    userEngagement: (latestEngagement?.metadata as {
                        totalTime: number;
                        activeTime: number;
                        engagementRate: number;
                    }) || {
                        totalTime: 0,
                        activeTime: 0,
                        engagementRate: 0,
                    },
                });

                setPreloadStatus(ComponentPreloader.getPreloadStatus());
            };

            updateMetrics();
            const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

            return () => clearInterval(interval);
        }
    }, []);

    if (!isVisible || !metrics) {
        return null;
    }

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatPercentage = (value: number) => `${Math.round(value)}%`;

    const getStatusColor = (
        value: number,
        thresholds: { good: number; warning: number }
    ) => {
        if (value <= thresholds.good) return 'text-green-500';
        if (value <= thresholds.warning) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 w-80 rounded-lg border p-4 shadow-lg ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                    : 'border-gray-200 bg-white text-gray-900'
            }`}
        >
            <div className='mb-3 flex items-center justify-between'>
                <h3 className='font-semibold'>Performance Dashboard</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className='text-gray-400 hover:text-gray-600'
                >
                    ×
                </button>
            </div>

            <div className='space-y-3 text-sm'>
                {/* API Performance */}
                <div>
                    <div className='font-medium'>API Performance</div>
                    <div
                        className={`${getStatusColor(metrics.averageApiResponseTime, { good: 500, warning: 1000 })}`}
                    >
                        Avg Response:{' '}
                        {formatTime(metrics.averageApiResponseTime)}
                    </div>
                </div>

                {/* Bundle Performance */}
                <div>
                    <div className='font-medium'>Bundle Performance</div>
                    <div
                        className={`${getStatusColor(metrics.bundleLoadTime, { good: 1000, warning: 3000 })}`}
                    >
                        Load Time: {formatTime(metrics.bundleLoadTime)}
                    </div>
                </div>

                {/* Component Preloading */}
                <div>
                    <div className='font-medium'>Component Preloading</div>
                    <div className='text-xs'>
                        <div>
                            Preloaded: {preloadStatus.preloaded.length}/
                            {preloadStatus.total}
                        </div>
                        <div>Pending: {preloadStatus.pending.length}</div>
                    </div>
                </div>

                {/* Form Metrics */}
                <div>
                    <div className='font-medium'>Form Metrics</div>
                    <div
                        className={`${getStatusColor(100 - metrics.formCompletionRate, { good: 20, warning: 50 })}`}
                    >
                        Completion:{' '}
                        {formatPercentage(metrics.formCompletionRate)}
                    </div>
                </div>

                {/* Upload Performance */}
                <div>
                    <div className='font-medium'>Upload Performance</div>
                    <div
                        className={`${getStatusColor(100 - metrics.imageUploadSuccessRate, { good: 5, warning: 15 })}`}
                    >
                        Success Rate:{' '}
                        {formatPercentage(metrics.imageUploadSuccessRate)}
                    </div>
                </div>

                {/* User Engagement */}
                <div>
                    <div className='font-medium'>User Engagement</div>
                    <div className='text-xs'>
                        <div>
                            Total Time:{' '}
                            {formatTime(metrics.userEngagement.totalTime)}
                        </div>
                        <div>
                            Active Time:{' '}
                            {formatTime(metrics.userEngagement.activeTime)}
                        </div>
                        <div
                            className={`${getStatusColor(100 - metrics.userEngagement.engagementRate, { good: 20, warning: 50 })}`}
                        >
                            Engagement:{' '}
                            {formatPercentage(
                                metrics.userEngagement.engagementRate
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Count */}
                <div>
                    <div className='font-medium'>Errors</div>
                    <div
                        className={`${getStatusColor(metrics.totalErrors, { good: 0, warning: 3 })}`}
                    >
                        Total: {metrics.totalErrors}
                    </div>
                </div>

                {/* Component Load Times */}
                {Object.keys(metrics.componentLoadTimes).length > 0 && (
                    <div>
                        <div className='font-medium'>Component Load Times</div>
                        <div className='max-h-20 overflow-y-auto text-xs'>
                            {Object.entries(metrics.componentLoadTimes).map(
                                ([component, time]) => (
                                    <div
                                        key={component}
                                        className='flex justify-between'
                                    >
                                        <span className='truncate'>
                                            {component}
                                        </span>
                                        <span
                                            className={getStatusColor(time, {
                                                good: 100,
                                                warning: 300,
                                            })}
                                        >
                                            {formatTime(time)}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className='mt-3 flex space-x-2 text-xs'>
                <button
                    onClick={() => {
                        const data = monitoring.exportData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                            type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `performance-data-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    className='rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600'
                >
                    Export Data
                </button>
                <button
                    onClick={() => {
                        monitoring.clearData();
                        setMetrics({
                            averageApiResponseTime: 0,
                            totalErrors: 0,
                            formCompletionRate: 0,
                            imageUploadSuccessRate: 0,
                            bundleLoadTime: 0,
                            componentLoadTimes: {},
                            userEngagement: {
                                totalTime: 0,
                                activeTime: 0,
                                engagementRate: 0,
                            },
                        });
                    }}
                    className='rounded bg-gray-500 px-2 py-1 text-white hover:bg-gray-600'
                >
                    Clear Data
                </button>
            </div>
        </div>
    );
};

// Hook to toggle performance dashboard
export const usePerformanceDashboard = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Toggle with Ctrl+Shift+P
            if (event.ctrlKey && event.shiftKey && event.key === 'P') {
                event.preventDefault();
                setIsVisible((prev) => {
                    const newValue = !prev;
                    localStorage.setItem(
                        'show_performance_dashboard',
                        newValue.toString()
                    );
                    return newValue;
                });
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    return { isVisible, setIsVisible };
};

// Performance monitoring wrapper component
export const PerformanceMonitoringWrapper: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { isVisible } = usePerformanceDashboard();

    return (
        <>
            {children}
            {isVisible && <PerformanceDashboard />}
        </>
    );
};

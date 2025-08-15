/**
 * useMediaSearchAnalytics - Hook for tracking media search analytics and performance
 * Integrates with MediaAnalyticsService and ProviderPerformanceMonitor
 */

import { useEffect, useRef, useCallback } from 'react';
import MediaAnalyticsService from '../lib/services/media/MediaAnalyticsService';
import ProviderPerformanceMonitor from '../lib/services/media/ProviderPerformanceMonitor';
import ABTestingService from '../lib/services/media/ABTestingService';
import type { MediaItem, MediaFilters } from '../types/media-search';
import type { ABTestVariant } from '../lib/services/media/ABTestingService';
import type { ProviderHealthStatus } from '../lib/services/media/ProviderPerformanceMonitor';

interface PerformanceSummary {
    totalProviders: number;
    healthyProviders: number;
    averageResponseTime: number;
    totalRequests: number;
    overallSuccessRate: number;
    alerts: string[];
}

interface UseMediaSearchAnalyticsOptions {
    userId?: string;
    eventCategory?: string;
    enablePerformanceTracking?: boolean;
    enableABTesting?: boolean;
}

interface MediaSearchAnalyticsHook {
    // Search tracking
    trackSearch: (
        query: string,
        filters?: MediaFilters,
        providers?: string[]
    ) => void;
    trackSearchResults: (
        query: string,
        resultCount: number,
        responseTime: number,
        providers: string[]
    ) => void;
    trackSearchError: (
        query: string,
        error: string,
        providers: string[]
    ) => void;

    // Selection tracking
    trackMediaSelection: (
        item: MediaItem,
        query: string,
        position: number
    ) => void;
    trackMediaDeselection: (item: MediaItem, query: string) => void;
    trackMediaPreview: (
        item: MediaItem,
        query: string,
        position: number
    ) => void;
    trackMediaDownload: (items: MediaItem[], query: string) => void;

    // Performance tracking
    trackProviderRequest: (
        providerId: string,
        endpoint: string,
        startTime: number,
        endTime: number,
        success: boolean,
        errorType?: string,
        resultCount?: number
    ) => void;
    trackPerformanceMetric: (
        metricType: string,
        value: number,
        unit: string,
        metadata?: Record<string, unknown>
    ) => void;

    // UI interaction tracking
    trackModalOpen: (duration?: number) => void;
    trackModalClose: (duration?: number) => void;
    trackFilterApplied: (filters: MediaFilters) => void;
    trackPageLoad: (loadTime: number) => void;

    // A/B testing
    getVariant: (testId: string) => ABTestVariant | null;
    trackConversion: (
        testId: string,
        conversionType?: string,
        metadata?: Record<string, unknown>
    ) => void;
    trackInteraction: (
        testId: string,
        interactionType: string,
        metadata?: Record<string, unknown>
    ) => void;

    // Performance monitoring
    getProviderHealth: (providerId: string) => ProviderHealthStatus | null;
    getBestProviders: (limit?: number) => string[];
    getPerformanceSummary: () => PerformanceSummary;
}

export function useMediaSearchAnalytics(
    options: UseMediaSearchAnalyticsOptions = {}
): MediaSearchAnalyticsHook {
    const analyticsRef = useRef<MediaAnalyticsService>();
    const performanceMonitorRef = useRef<ProviderPerformanceMonitor>();
    const abTestingRef = useRef<ABTestingService>();
    const sessionStartTime = useRef<number>(Date.now());
    const searchStartTimes = useRef<Map<string, number>>(new Map());

    // Initialize services
    useEffect(() => {
        analyticsRef.current = MediaAnalyticsService.getInstance();
        performanceMonitorRef.current =
            ProviderPerformanceMonitor.getInstance();
        abTestingRef.current = ABTestingService.getInstance();

        // Initialize with user context
        analyticsRef.current.initialize(options.userId, { enabled: true });
        abTestingRef.current.initialize(options.userId);

        return () => {
            // Cleanup on unmount
            analyticsRef.current?.flush();
        };
    }, [options.userId]);

    // Search tracking methods
    const trackSearch = useCallback(
        (query: string, filters?: MediaFilters, providers?: string[]) => {
            const searchId = `${query}_${Date.now()}`;
            searchStartTimes.current.set(searchId, Date.now());

            analyticsRef.current?.trackSearchEvent({
                eventType: 'search_initiated',
                query,
                filters,
                providers: providers || [],
                eventCategory: options.eventCategory,
            });

            // Track performance metric
            if (options.enablePerformanceTracking) {
                analyticsRef.current?.trackPerformanceMetric({
                    metricType: 'search_response_time',
                    value: 0, // Will be updated when results arrive
                    unit: 'ms',
                    metadata: { query, searchId },
                });
            }
        },
        [options.eventCategory, options.enablePerformanceTracking]
    );

    const trackSearchResults = useCallback(
        (
            query: string,
            resultCount: number,
            responseTime: number,
            providers: string[]
        ) => {
            analyticsRef.current?.trackSearchEvent({
                eventType: 'search_completed',
                query,
                providers,
                resultCount,
                responseTime,
                eventCategory: options.eventCategory,
            });

            // Track performance metric
            if (options.enablePerformanceTracking) {
                analyticsRef.current?.trackPerformanceMetric({
                    metricType: 'search_response_time',
                    value: responseTime,
                    unit: 'ms',
                    metadata: { query, resultCount, providers },
                });
            }
        },
        [options.eventCategory, options.enablePerformanceTracking]
    );

    const trackSearchError = useCallback(
        (query: string, error: string, providers: string[]) => {
            analyticsRef.current?.trackSearchEvent({
                eventType: 'search_failed',
                query,
                providers,
                eventCategory: options.eventCategory,
            });

            analyticsRef.current?.trackUsageEvent({
                eventType: 'modal_opened', // Using existing event type
                metadata: {
                    errorType: 'search_error',
                    error,
                    query,
                    providers,
                },
            });
        },
        [options.eventCategory]
    );

    // Selection tracking methods
    const trackMediaSelection = useCallback(
        (item: MediaItem, query: string, position: number) => {
            analyticsRef.current?.trackSelectionEvent({
                eventType: 'media_selected',
                mediaId: item.id,
                providerId: item.providerId,
                query,
                position,
                mediaType: item.mediaType,
            });

            // Track A/B test conversion if applicable
            if (options.enableABTesting) {
                abTestingRef.current?.trackConversion(
                    'media_search_layout',
                    'media_selected',
                    {
                        mediaId: item.id,
                        providerId: item.providerId,
                        position,
                    }
                );
            }
        },
        [options.enableABTesting]
    );

    const trackMediaDeselection = useCallback(
        (item: MediaItem, query: string) => {
            analyticsRef.current?.trackSelectionEvent({
                eventType: 'media_deselected',
                mediaId: item.id,
                providerId: item.providerId,
                query,
                position: -1, // Not applicable for deselection
                mediaType: item.mediaType,
            });
        },
        []
    );

    const trackMediaPreview = useCallback(
        (item: MediaItem, query: string, position: number) => {
            analyticsRef.current?.trackSelectionEvent({
                eventType: 'media_previewed',
                mediaId: item.id,
                providerId: item.providerId,
                query,
                position,
                mediaType: item.mediaType,
            });

            // Track A/B test interaction
            if (options.enableABTesting) {
                abTestingRef.current?.trackInteraction(
                    'media_search_layout',
                    'media_previewed',
                    {
                        mediaId: item.id,
                        providerId: item.providerId,
                        position,
                    }
                );
            }
        },
        [options.enableABTesting]
    );

    const trackMediaDownload = useCallback(
        (items: MediaItem[], query: string) => {
            items.forEach((item, index) => {
                analyticsRef.current?.trackSelectionEvent({
                    eventType: 'media_downloaded',
                    mediaId: item.id,
                    providerId: item.providerId,
                    query,
                    position: index,
                    mediaType: item.mediaType,
                });
            });

            // Track A/B test conversion
            if (options.enableABTesting) {
                abTestingRef.current?.trackConversion(
                    'media_search_layout',
                    'media_downloaded',
                    {
                        itemCount: items.length,
                        providers: [
                            ...new Set(items.map((item) => item.providerId)),
                        ],
                    }
                );
            }
        },
        [options.enableABTesting]
    );

    // Performance tracking methods
    const trackProviderRequest = useCallback(
        (
            providerId: string,
            endpoint: string,
            startTime: number,
            endTime: number,
            success: boolean,
            errorType?: string,
            resultCount?: number
        ) => {
            if (options.enablePerformanceTracking) {
                performanceMonitorRef.current?.recordProviderRequest(
                    providerId,
                    endpoint,
                    startTime,
                    endTime,
                    success,
                    errorType,
                    resultCount
                );
            }
        },
        [options.enablePerformanceTracking]
    );

    const trackPerformanceMetric = useCallback(
        (
            metricType: string,
            value: number,
            unit: string,
            metadata?: Record<string, unknown>
        ) => {
            if (options.enablePerformanceTracking) {
                analyticsRef.current?.trackPerformanceMetric({
                    metricType: metricType as
                        | 'search_response_time'
                        | 'download_speed'
                        | 'image_processing_time'
                        | 'ui_render_time',
                    value,
                    unit: unit as
                        | 'ms'
                        | 'bytes_per_second'
                        | 'items_per_second',
                    metadata,
                });
            }
        },
        [options.enablePerformanceTracking]
    );

    // UI interaction tracking methods
    const trackModalOpen = useCallback(
        (duration?: number) => {
            analyticsRef.current?.trackUsageEvent({
                eventType: 'modal_opened',
                duration,
                metadata: {
                    modalType: 'media_search',
                    eventCategory: options.eventCategory,
                },
            });
        },
        [options.eventCategory]
    );

    const trackModalClose = useCallback((duration?: number) => {
        const sessionDuration = Date.now() - sessionStartTime.current;

        analyticsRef.current?.trackUsageEvent({
            eventType: 'modal_closed',
            duration: duration || sessionDuration,
            metadata: {
                modalType: 'media_search',
                sessionDuration,
            },
        });
    }, []);

    const trackFilterApplied = useCallback(
        (filters: MediaFilters) => {
            analyticsRef.current?.trackUsageEvent({
                eventType: 'filter_applied',
                metadata: {
                    filters,
                    filterCount: Object.keys(filters).length,
                },
            });

            // Track A/B test interaction
            if (options.enableABTesting) {
                abTestingRef.current?.trackInteraction(
                    'search_suggestions',
                    'filter_applied',
                    {
                        filters,
                    }
                );
            }
        },
        [options.enableABTesting]
    );

    const trackPageLoad = useCallback((loadTime: number) => {
        analyticsRef.current?.trackUsageEvent({
            eventType: 'page_loaded',
            duration: loadTime,
            metadata: {
                pageType: 'media_search',
            },
        });

        analyticsRef.current?.trackPerformanceMetric({
            metricType: 'ui_render_time',
            value: loadTime,
            unit: 'ms',
            metadata: {
                pageType: 'media_search',
            },
        });
    }, []);

    // A/B testing methods
    const getVariant = useCallback(
        (testId: string) => {
            if (!options.enableABTesting) return null;
            return abTestingRef.current?.getVariant(testId) || null;
        },
        [options.enableABTesting]
    );

    const trackConversion = useCallback(
        (
            testId: string,
            conversionType?: string,
            metadata?: Record<string, unknown>
        ) => {
            if (options.enableABTesting) {
                abTestingRef.current?.trackConversion(
                    testId,
                    conversionType,
                    metadata
                );
            }
        },
        [options.enableABTesting]
    );

    const trackInteraction = useCallback(
        (
            testId: string,
            interactionType: string,
            metadata?: Record<string, unknown>
        ) => {
            if (options.enableABTesting) {
                abTestingRef.current?.trackInteraction(
                    testId,
                    interactionType,
                    metadata
                );
            }
        },
        [options.enableABTesting]
    );

    // Performance monitoring methods
    const getProviderHealth = useCallback((providerId: string) => {
        try {
            return (
                performanceMonitorRef.current?.getProviderHealth(providerId) ||
                null
            );
        } catch (error) {
            console.warn(
                `Failed to get provider health for ${providerId}:`,
                error
            );
            return null;
        }
    }, []);

    const getBestProviders = useCallback((limit: number = 3) => {
        try {
            return performanceMonitorRef.current?.getBestProviders(limit) || [];
        } catch (error) {
            console.warn('Failed to get best providers:', error);
            return [];
        }
    }, []);

    const getPerformanceSummary = useCallback(() => {
        try {
            return (
                performanceMonitorRef.current?.getPerformanceSummary() || {
                    totalProviders: 3,
                    healthyProviders: 3,
                    averageResponseTime: 750,
                    totalRequests: 0,
                    overallSuccessRate: 95,
                    alerts: [],
                }
            );
        } catch (error) {
            console.warn('Failed to get performance summary:', error);
            return {
                totalProviders: 3,
                healthyProviders: 2,
                averageResponseTime: 1200,
                totalRequests: 0,
                overallSuccessRate: 85,
                alerts: ['Performance monitoring unavailable'],
            };
        }
    }, []);

    return {
        // Search tracking
        trackSearch,
        trackSearchResults,
        trackSearchError,

        // Selection tracking
        trackMediaSelection,
        trackMediaDeselection,
        trackMediaPreview,
        trackMediaDownload,

        // Performance tracking
        trackProviderRequest,
        trackPerformanceMetric,

        // UI interaction tracking
        trackModalOpen,
        trackModalClose,
        trackFilterApplied,
        trackPageLoad,

        // A/B testing
        getVariant,
        trackConversion,
        trackInteraction,

        // Performance monitoring
        getProviderHealth,
        getBestProviders,
        getPerformanceSummary,
    };
}

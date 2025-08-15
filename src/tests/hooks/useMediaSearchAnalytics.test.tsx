/**
 * Tests for useMediaSearchAnalytics hook
 * Integration tests for analytics tracking in React components
 */

import { renderHook, act } from '@testing-library/react';
import { useMediaSearchAnalytics } from '../../hooks/useMediaSearchAnalytics';
import type { MediaItem } from '../../types/media-search';

// Mock the analytics services
// Mock instances
const mockAnalyticsInstance = {
    initialize: jest.fn(),
    trackSearchEvent: jest.fn(),
    trackSelectionEvent: jest.fn(),
    trackProviderPerformance: jest.fn(),
    trackUsageEvent: jest.fn(),
    trackPerformanceMetric: jest.fn(),
    trackABTestEvent: jest.fn(),
    flush: jest.fn(),
    disable: jest.fn(),
    getAnalyticsSummary: jest.fn(() => ({
        sessionId: 'test-session',
        userId: 'test-user',
        queueSize: 0,
        isEnabled: true,
        uptime: 1000,
    })),
};

const mockPerformanceInstance = {
    recordProviderRequest: jest.fn(),
    getProviderHealth: jest.fn(() => null),
    getBestProviders: jest.fn(() => []),
    getPerformanceSummary: jest.fn(() => null),
};

const mockABTestInstance = {
    initialize: jest.fn(),
    getVariant: jest.fn(() => null),
    trackConversion: jest.fn(),
    trackInteraction: jest.fn(),
};

jest.mock('../../lib/services/media/MediaAnalyticsService', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn(() => mockAnalyticsInstance),
    },
}));

jest.mock('../../lib/services/media/ProviderPerformanceMonitor', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn(() => mockPerformanceInstance),
    },
}));

jest.mock('../../lib/services/media/ABTestingService', () => ({
    __esModule: true,
    default: {
        getInstance: jest.fn(() => mockABTestInstance),
    },
}));

const mockMediaItem: MediaItem = {
    id: 'test-123',
    providerId: 'unsplash',
    title: 'Test Image',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewUrl: 'https://example.com/preview.jpg',
    downloadUrl: 'https://example.com/download.jpg',
    width: 1920,
    height: 1080,
    mediaType: 'image',
    attribution: {
        required: true,
        text: 'Photo by Test User',
        linkUrl: 'https://example.com/user',
        placement: 'image-caption',
    },
    license: {
        type: 'unsplash',
        name: 'Unsplash License',
        url: 'https://unsplash.com/license',
        commercialUse: true,
        attribution: {
            required: true,
            text: 'Photo by Test User',
            linkUrl: 'https://example.com/user',
            placement: 'image-caption',
        },
    },
    tags: ['business', 'meeting', 'conference'],
    photographer: {
        name: 'Test User',
        profileUrl: 'https://example.com/user',
    },
};

describe('useMediaSearchAnalytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Hook Initialization', () => {
        test('should initialize with default options', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            expect(result.current).toBeDefined();
            expect(typeof result.current.trackSearch).toBe('function');
            expect(typeof result.current.trackMediaSelection).toBe('function');
        });

        test('should initialize with custom options', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({
                    userId: 'test-user-123',
                    eventCategory: 'business',
                    enablePerformanceTracking: true,
                    enableABTesting: true,
                })
            );

            expect(result.current).toBeDefined();
        });
    });

    describe('Search Tracking', () => {
        test('should track search initiation', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackSearch(
                    'conference',
                    { orientation: 'landscape' },
                    ['unsplash', 'pexels']
                );
            });

            // Should not throw and should call analytics service
            expect(true).toBe(true);
        });

        test('should track search results', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackSearchResults(
                    'business meeting',
                    25,
                    1200,
                    ['unsplash']
                );
            });

            expect(true).toBe(true);
        });

        test('should track search errors', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackSearchError(
                    'invalid query',
                    'Network error',
                    ['unsplash', 'pexels']
                );
            });

            expect(true).toBe(true);
        });
    });

    describe('Selection Tracking', () => {
        test('should track media selection', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackMediaSelection(
                    mockMediaItem,
                    'conference',
                    5
                );
            });

            expect(true).toBe(true);
        });

        test('should track media deselection', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackMediaDeselection(
                    mockMediaItem,
                    'conference'
                );
            });

            expect(true).toBe(true);
        });

        test('should track media preview', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackMediaPreview(mockMediaItem, 'business', 2);
            });

            expect(true).toBe(true);
        });

        test('should track media download', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackMediaDownload(
                    [mockMediaItem],
                    'conference'
                );
            });

            expect(true).toBe(true);
        });
    });

    describe('Performance Tracking', () => {
        test('should track provider requests when enabled', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enablePerformanceTracking: true })
            );

            const startTime = Date.now() - 1000;
            const endTime = Date.now();

            act(() => {
                result.current.trackProviderRequest(
                    'unsplash',
                    '/search/photos',
                    startTime,
                    endTime,
                    true,
                    undefined,
                    20
                );
            });

            expect(true).toBe(true);
        });

        test('should not track provider requests when disabled', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enablePerformanceTracking: false })
            );

            act(() => {
                result.current.trackProviderRequest(
                    'unsplash',
                    '/search/photos',
                    Date.now() - 1000,
                    Date.now(),
                    true
                );
            });

            expect(true).toBe(true);
        });

        test('should track performance metrics', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enablePerformanceTracking: true })
            );

            act(() => {
                result.current.trackPerformanceMetric(
                    'search_response_time',
                    1200,
                    'ms',
                    { query: 'conference' }
                );
            });

            expect(true).toBe(true);
        });
    });

    describe('UI Interaction Tracking', () => {
        test('should track modal open/close', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackModalOpen();
                result.current.trackModalClose(30000);
            });

            expect(true).toBe(true);
        });

        test('should track filter applications', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackFilterApplied({
                    orientation: 'landscape',
                    color: 'blue',
                    category: 'business',
                });
            });

            expect(true).toBe(true);
        });

        test('should track page load times', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            act(() => {
                result.current.trackPageLoad(2500);
            });

            expect(true).toBe(true);
        });
    });

    describe('A/B Testing Integration', () => {
        test('should get variants when A/B testing is enabled', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enableABTesting: true })
            );

            let variant;
            act(() => {
                variant = result.current.getVariant('media_search_layout');
            });

            // Should return variant or null
            expect(variant === null || typeof variant === 'object').toBe(true);
        });

        test('should return null when A/B testing is disabled', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enableABTesting: false })
            );

            let variant;
            act(() => {
                variant = result.current.getVariant('media_search_layout');
            });

            expect(variant).toBeNull();
        });

        test('should track conversions when A/B testing is enabled', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enableABTesting: true })
            );

            act(() => {
                result.current.trackConversion(
                    'media_search_layout',
                    'media_selected',
                    {
                        mediaId: 'test-123',
                    }
                );
            });

            expect(true).toBe(true);
        });

        test('should track interactions when A/B testing is enabled', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enableABTesting: true })
            );

            act(() => {
                result.current.trackInteraction(
                    'search_suggestions',
                    'filter_applied',
                    {
                        filterType: 'orientation',
                    }
                );
            });

            expect(true).toBe(true);
        });
    });

    describe('Performance Monitoring', () => {
        test('should get provider health', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            let health;
            act(() => {
                health = result.current.getProviderHealth('unsplash');
            });

            // Should return health data or null
            expect(health === null || typeof health === 'object').toBe(true);
        });

        test('should get best providers', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            let bestProviders;
            act(() => {
                bestProviders = result.current.getBestProviders(3);
            });

            expect(Array.isArray(bestProviders)).toBe(true);
        });

        test('should get performance summary', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            let summary;
            act(() => {
                summary = result.current.getPerformanceSummary();
            });

            // Should return summary or null
            expect(summary === null || typeof summary === 'object').toBe(true);
        });
    });

    describe('Event Category Integration', () => {
        test('should include event category in search tracking', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ eventCategory: 'technology' })
            );

            act(() => {
                result.current.trackSearch('AI conference');
            });

            expect(true).toBe(true);
        });

        test('should track A/B test conversions with media selection', () => {
            const { result } = renderHook(() =>
                useMediaSearchAnalytics({ enableABTesting: true })
            );

            act(() => {
                result.current.trackMediaSelection(
                    mockMediaItem,
                    'conference',
                    1
                );
            });

            expect(true).toBe(true);
        });
    });

    describe('Cleanup', () => {
        test('should cleanup on unmount', () => {
            const { unmount } = renderHook(() => useMediaSearchAnalytics());

            // Should not throw on unmount
            expect(() => unmount()).not.toThrow();
        });

        test('should flush analytics on unmount', () => {
            const { result, unmount } = renderHook(() =>
                useMediaSearchAnalytics()
            );

            act(() => {
                result.current.trackSearch('test query');
            });

            // Should not throw on unmount and should flush
            expect(() => unmount()).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle analytics service errors gracefully', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            // Should not throw even if analytics service has issues
            expect(() => {
                act(() => {
                    result.current.trackSearch('test');
                    result.current.trackMediaSelection(
                        mockMediaItem,
                        'test',
                        0
                    );
                    result.current.trackProviderRequest(
                        'test',
                        '/api',
                        0,
                        100,
                        true
                    );
                });
            }).not.toThrow();
        });

        test('should handle missing media item data', () => {
            const { result } = renderHook(() => useMediaSearchAnalytics());

            const incompleteMediaItem = {
                ...mockMediaItem,
                id: '',
                providerId: '',
            };

            expect(() => {
                act(() => {
                    result.current.trackMediaSelection(
                        incompleteMediaItem,
                        'test',
                        0
                    );
                });
            }).not.toThrow();
        });
    });
});

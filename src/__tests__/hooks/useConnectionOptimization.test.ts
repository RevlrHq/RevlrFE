import { renderHook, act, waitFor } from '@testing-library/react';
import { useConnectionOptimization } from '@/hooks/useConnectionOptimization';
import {
    PageVisibilityState,
    ConnectionActivityMode,
    ConnectionQuality,
} from '@/hooks/useConnectionOptimization';

// Mock the useOnlineStatus hook
jest.mock('@/hooks/useOnlineStatus', () => ({
    useOnlineStatus: jest.fn(() => true),
}));

const mockUseOnlineStatus = require('@/hooks/useOnlineStatus').useOnlineStatus;

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
    writable: true,
    value: 'visible',
});

// Mock document.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
});
Object.defineProperty(document, 'removeEventListener', {
    value: mockRemoveEventListener,
});

describe('useConnectionOptimization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockUseOnlineStatus.mockReturnValue(true);
        document.visibilityState = 'visible';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            expect(result.current.pageVisibilityState).toBe(
                PageVisibilityState.Visible
            );
            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );
            expect(result.current.connectionQuality).toBe(
                ConnectionQuality.Unknown
            );
            expect(result.current.isRateLimited).toBe(false);
            expect(result.current.stats.totalOptimizations).toBe(0);
        });

        it('should set up page visibility event listener', () => {
            renderHook(() => useConnectionOptimization());

            expect(mockAddEventListener).toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
        });

        it('should clean up event listener on unmount', () => {
            const { unmount } = renderHook(() => useConnectionOptimization());

            unmount();

            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
        });
    });

    describe('Page Visibility Handling', () => {
        it('should handle page becoming hidden', () => {
            const mockOnPageVisibilityChange = jest.fn();
            const mockOnActivityModeChange = jest.fn();

            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: { hiddenPageDelay: 1000 },
                    onPageVisibilityChange: mockOnPageVisibilityChange,
                    onActivityModeChange: mockOnActivityModeChange,
                })
            );

            // Simulate page becoming hidden
            act(() => {
                document.visibilityState = 'hidden';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            expect(result.current.pageVisibilityState).toBe(
                PageVisibilityState.Hidden
            );
            expect(mockOnPageVisibilityChange).toHaveBeenCalledWith(
                PageVisibilityState.Hidden
            );

            // Fast-forward past the hidden page delay
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Reduced
            );
            expect(mockOnActivityModeChange).toHaveBeenCalledWith(
                ConnectionActivityMode.Reduced
            );
        });

        it('should restore normal activity when page becomes visible', () => {
            const mockOnActivityModeChange = jest.fn();

            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: { hiddenPageDelay: 1000 },
                    onActivityModeChange: mockOnActivityModeChange,
                })
            );

            // First make page hidden and wait for reduced activity
            act(() => {
                document.visibilityState = 'hidden';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Reduced
            );

            // Now make page visible again
            act(() => {
                document.visibilityState = 'visible';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );
            expect(mockOnActivityModeChange).toHaveBeenCalledWith(
                ConnectionActivityMode.Normal
            );
        });

        it('should not reduce activity if page becomes visible before delay', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: { hiddenPageDelay: 1000 },
                })
            );

            // Make page hidden
            act(() => {
                document.visibilityState = 'hidden';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            // Make page visible before delay expires
            act(() => {
                jest.advanceTimersByTime(500);
                document.visibilityState = 'visible';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            // Complete the original delay
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // Should remain in normal mode
            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );
        });
    });

    describe('Rate Limiting', () => {
        it('should allow actions within rate limit', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: {
                        enableRateLimiting: true,
                        maxActionsPerWindow: 5,
                        rateLimitWindow: 60000,
                    },
                })
            );

            // Perform actions within limit
            for (let i = 0; i < 5; i++) {
                const allowed = result.current.checkRateLimit('test_action');
                expect(allowed).toBe(true);

                const recorded = result.current.recordAction('test_action');
                expect(recorded).toBe(true);
            }

            expect(result.current.isRateLimited).toBe(false);
        });

        it('should block actions when rate limit is exceeded', () => {
            const mockOnRateLimitHit = jest.fn();

            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: {
                        enableRateLimiting: true,
                        maxActionsPerWindow: 3,
                        rateLimitWindow: 60000,
                    },
                    onRateLimitHit: mockOnRateLimitHit,
                })
            );

            // Perform actions up to limit
            for (let i = 0; i < 3; i++) {
                result.current.recordAction('test_action');
            }

            // Next action should be blocked
            const allowed = result.current.checkRateLimit('test_action');
            expect(allowed).toBe(false);
            expect(result.current.isRateLimited).toBe(true);
            expect(mockOnRateLimitHit).toHaveBeenCalledWith(
                'test_action',
                expect.any(Number)
            );
        });

        it('should reset rate limit after window expires', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: {
                        enableRateLimiting: true,
                        maxActionsPerWindow: 2,
                        rateLimitWindow: 1000,
                    },
                })
            );

            // Exhaust rate limit
            result.current.recordAction('test_action');
            result.current.recordAction('test_action');

            expect(result.current.checkRateLimit('test_action')).toBe(false);

            // Fast-forward past rate limit window
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            // Should be allowed again
            expect(result.current.checkRateLimit('test_action')).toBe(true);
            expect(result.current.isRateLimited).toBe(false);
        });

        it('should allow manual rate limit reset', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: {
                        enableRateLimiting: true,
                        maxActionsPerWindow: 1,
                        rateLimitWindow: 60000,
                    },
                })
            );

            // Exhaust rate limit
            result.current.recordAction('test_action');
            expect(result.current.checkRateLimit('test_action')).toBe(false);

            // Reset rate limit
            act(() => {
                result.current.resetRateLimit();
            });

            expect(result.current.checkRateLimit('test_action')).toBe(true);
            expect(result.current.isRateLimited).toBe(false);
        });
    });

    describe('Connection Quality Management', () => {
        it('should update connection quality based on latency', () => {
            const mockOnConnectionQualityChange = jest.fn();

            const { result } = renderHook(() =>
                useConnectionOptimization({
                    onConnectionQualityChange: mockOnConnectionQualityChange,
                })
            );

            // Test excellent quality
            act(() => {
                result.current.updateLatency(50);
            });

            expect(result.current.connectionQuality).toBe(
                ConnectionQuality.Excellent
            );
            expect(mockOnConnectionQualityChange).toHaveBeenCalledWith(
                ConnectionQuality.Excellent,
                expect.objectContaining({ latency: 50 })
            );

            // Test poor quality
            act(() => {
                result.current.updateLatency(1500);
            });

            expect(result.current.connectionQuality).toBe(
                ConnectionQuality.Poor
            );
        });

        it('should adapt activity mode based on connection quality', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: { enableAdaptiveManagement: true },
                })
            );

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );

            // Poor connection should reduce activity
            act(() => {
                result.current.updateLatency(2000);
            });

            expect(result.current.connectionQuality).toBe(
                ConnectionQuality.Poor
            );
            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Reduced
            );

            // Excellent connection should restore normal activity
            act(() => {
                result.current.updateLatency(50);
            });

            expect(result.current.connectionQuality).toBe(
                ConnectionQuality.Excellent
            );
            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );
        });

        it('should calculate average latency correctly', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            const latencies = [100, 200, 150, 300, 250];

            latencies.forEach((latency) => {
                act(() => {
                    result.current.updateLatency(latency);
                });
            });

            const expectedAverage =
                latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
            expect(result.current.stats.averageLatency).toBe(expectedAverage);
        });
    });

    describe('Health Monitoring', () => {
        it('should track successful operations', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            act(() => {
                result.current.recordSuccess();
            });

            expect(result.current.healthMetrics.consecutiveFailures).toBe(0);
            expect(result.current.healthMetrics.lastSuccessTime).toBeInstanceOf(
                Date
            );
        });

        it('should track failed operations', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            act(() => {
                result.current.recordFailure();
            });

            expect(result.current.healthMetrics.consecutiveFailures).toBe(1);
            expect(result.current.healthMetrics.lastFailureTime).toBeInstanceOf(
                Date
            );
        });

        it('should adapt activity mode based on consecutive failures', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: { enableAdaptiveManagement: true },
                })
            );

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );

            // Record multiple failures
            act(() => {
                result.current.recordFailure();
                result.current.recordFailure();
                result.current.recordFailure();
            });

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Reduced
            );

            // More failures should lead to minimal activity
            act(() => {
                result.current.recordFailure();
                result.current.recordFailure();
                result.current.recordFailure();
            });

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Minimal
            );
        });

        it('should reset consecutive failures on success', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            // Record failures
            act(() => {
                result.current.recordFailure();
                result.current.recordFailure();
            });

            expect(result.current.healthMetrics.consecutiveFailures).toBe(2);

            // Record success
            act(() => {
                result.current.recordSuccess();
            });

            expect(result.current.healthMetrics.consecutiveFailures).toBe(0);
        });
    });

    describe('Online/Offline Handling', () => {
        it('should pause activity when going offline', () => {
            mockUseOnlineStatus.mockReturnValue(false);

            const { result } = renderHook(() => useConnectionOptimization());

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Paused
            );
        });

        it('should restore activity when coming online', () => {
            // Start offline
            mockUseOnlineStatus.mockReturnValue(false);
            const { result, rerender } = renderHook(() =>
                useConnectionOptimization()
            );

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Paused
            );

            // Go online
            mockUseOnlineStatus.mockReturnValue(true);
            rerender();

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Normal
            );
        });

        it('should consider page visibility when restoring from offline', () => {
            // Start offline with hidden page
            mockUseOnlineStatus.mockReturnValue(false);
            document.visibilityState = 'hidden';

            const { result, rerender } = renderHook(() =>
                useConnectionOptimization()
            );

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Paused
            );

            // Go online while page is still hidden
            mockUseOnlineStatus.mockReturnValue(true);
            rerender();

            expect(result.current.activityMode).toBe(
                ConnectionActivityMode.Reduced
            );
        });
    });

    describe('Utility Functions', () => {
        it('should correctly determine if activity should be reduced', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            // Normal conditions
            expect(result.current.shouldReduceActivity()).toBe(false);

            // Poor connection quality
            act(() => {
                result.current.updateLatency(2000);
            });
            expect(result.current.shouldReduceActivity()).toBe(true);

            // Offline
            mockUseOnlineStatus.mockReturnValue(false);
            const { result: result2 } = renderHook(() =>
                useConnectionOptimization()
            );
            expect(result2.current.shouldReduceActivity()).toBe(true);
        });

        it('should calculate optimal intervals based on quality and activity mode', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            const baseInterval = 1000;

            // Excellent quality, normal mode
            act(() => {
                result.current.updateLatency(50);
            });
            const excellentInterval =
                result.current.getOptimalInterval(baseInterval);
            expect(excellentInterval).toBeLessThan(baseInterval);

            // Poor quality
            act(() => {
                result.current.updateLatency(2000);
            });
            const poorInterval =
                result.current.getOptimalInterval(baseInterval);
            expect(poorInterval).toBeGreaterThan(baseInterval);

            // Reduced activity mode
            act(() => {
                result.current.setActivityMode(ConnectionActivityMode.Reduced);
            });
            const reducedInterval =
                result.current.getOptimalInterval(baseInterval);
            expect(reducedInterval).toBeGreaterThan(poorInterval);
        });

        it('should correctly determine connection health', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            // Healthy connection
            expect(result.current.isConnectionHealthy()).toBe(true);

            // Multiple failures
            act(() => {
                result.current.recordFailure();
                result.current.recordFailure();
                result.current.recordFailure();
            });
            expect(result.current.isConnectionHealthy()).toBe(false);

            // Poor quality
            act(() => {
                result.current.recordSuccess(); // Reset failures
                result.current.updateLatency(2000);
            });
            expect(result.current.isConnectionHealthy()).toBe(false);
        });
    });

    describe('Cleanup Operations', () => {
        it('should perform cleanup operations and track statistics', () => {
            const mockOnCleanupPerformed = jest.fn();
            const mockCleanupFn = jest.fn(() => 5);

            const { result } = renderHook(() =>
                useConnectionOptimization({
                    onCleanupPerformed: mockOnCleanupPerformed,
                })
            );

            const removedCount = result.current.performCleanup(
                'test_cleanup',
                mockCleanupFn
            );

            expect(removedCount).toBe(5);
            expect(mockCleanupFn).toHaveBeenCalled();
            expect(mockOnCleanupPerformed).toHaveBeenCalledWith(
                'test_cleanup',
                5
            );
            expect(result.current.stats.cleanupOperations).toBe(1);
        });
    });

    describe('Configuration Management', () => {
        it('should update configuration dynamically', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: {
                        enableRateLimiting: true,
                        maxActionsPerWindow: 5,
                    },
                })
            );

            // Test initial config
            for (let i = 0; i < 5; i++) {
                expect(result.current.recordAction('test')).toBe(true);
            }
            expect(result.current.checkRateLimit('test')).toBe(false);

            // Update config
            act(() => {
                result.current.updateConfig({ maxActionsPerWindow: 10 });
            });

            // Reset rate limit to test new config
            act(() => {
                result.current.resetRateLimit();
            });

            // Should now allow more actions
            for (let i = 0; i < 10; i++) {
                expect(result.current.recordAction('test')).toBe(true);
            }
            expect(result.current.checkRateLimit('test')).toBe(false);
        });
    });

    describe('Statistics Management', () => {
        it('should track various optimization statistics', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            expect(result.current.stats.totalOptimizations).toBe(0);

            // Trigger page visibility change
            act(() => {
                document.visibilityState = 'hidden';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            expect(result.current.stats.pageVisibilityChanges).toBe(1);
            expect(result.current.stats.totalOptimizations).toBe(1);

            // Trigger connection quality change
            act(() => {
                result.current.updateLatency(2000);
            });

            expect(result.current.stats.connectionQualityChanges).toBe(1);
            expect(result.current.stats.totalOptimizations).toBe(2);
        });

        it('should reset statistics', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            // Generate some statistics
            act(() => {
                result.current.updateLatency(100);
                document.visibilityState = 'hidden';
                const visibilityChangeHandler =
                    mockAddEventListener.mock.calls[0][1];
                visibilityChangeHandler();
            });

            expect(result.current.stats.totalOptimizations).toBeGreaterThan(0);

            // Reset statistics
            act(() => {
                result.current.resetStats();
            });

            expect(result.current.stats.totalOptimizations).toBe(0);
            expect(result.current.stats.pageVisibilityChanges).toBe(0);
            expect(result.current.stats.connectionQualityChanges).toBe(0);
        });
    });

    describe('Performance Tests', () => {
        it('should handle rapid latency updates efficiently', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            const startTime = performance.now();

            // Update latency 100 times rapidly
            act(() => {
                for (let i = 0; i < 100; i++) {
                    result.current.updateLatency(Math.random() * 1000);
                }
            });

            const updateTime = performance.now() - startTime;

            // Should handle updates quickly (< 100ms)
            expect(updateTime).toBeLessThan(100);
            expect(result.current.stats.averageLatency).toBeGreaterThan(0);
        });

        it('should handle many rate limit checks efficiently', () => {
            const { result } = renderHook(() =>
                useConnectionOptimization({
                    config: {
                        enableRateLimiting: true,
                        maxActionsPerWindow: 1000,
                    },
                })
            );

            const startTime = performance.now();

            // Perform 500 rate limit checks
            act(() => {
                for (let i = 0; i < 500; i++) {
                    result.current.checkRateLimit(`action_${i}`);
                }
            });

            const checkTime = performance.now() - startTime;

            // Should handle checks quickly (< 50ms)
            expect(checkTime).toBeLessThan(50);
        });

        it('should maintain performance with frequent activity mode changes', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            const startTime = performance.now();

            // Change activity mode 50 times
            act(() => {
                const modes = [
                    ConnectionActivityMode.Normal,
                    ConnectionActivityMode.Reduced,
                    ConnectionActivityMode.Minimal,
                    ConnectionActivityMode.Paused,
                ];

                for (let i = 0; i < 50; i++) {
                    result.current.setActivityMode(modes[i % modes.length]);
                }
            });

            const changeTime = performance.now() - startTime;

            // Should handle changes efficiently (< 50ms)
            expect(changeTime).toBeLessThan(50);
        });
    });

    describe('Memory Management', () => {
        it('should limit latency history to prevent memory leaks', () => {
            const { result } = renderHook(() => useConnectionOptimization());

            // Add many latency measurements
            act(() => {
                for (let i = 0; i < 20; i++) {
                    result.current.updateLatency(i * 10);
                }
            });

            // Average should be calculated from limited history (last 10 measurements)
            const expectedLatencies = Array.from(
                { length: 10 },
                (_, i) => (i + 10) * 10
            );
            const expectedAverage =
                expectedLatencies.reduce((sum, l) => sum + l, 0) /
                expectedLatencies.length;

            expect(result.current.stats.averageLatency).toBe(expectedAverage);
        });
    });
});

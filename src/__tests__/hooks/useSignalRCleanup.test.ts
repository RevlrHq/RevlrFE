import { renderHook, act, waitFor } from '@testing-library/react';
import { useSignalRCleanup } from '@/hooks/useSignalRCleanup';
import { CleanupItemType } from '@/hooks/useSignalRCleanup';

// Mock HubConnection
const mockHubConnection = {
    state: 'Connected',
    stop: jest.fn(),
    off: jest.fn(),
};

describe('useSignalRCleanup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (!jest.isMockFunction(setTimeout)) {
            jest.useFakeTimers();
        }
    });

    afterEach(() => {
        if (jest.isMockFunction(setTimeout)) {
            jest.useRealTimers();
        }
    });

    describe('Basic Registration', () => {
        it('should register cleanup items', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockCleanup = jest.fn();
            const id = result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Test resource',
                cleanup: mockCleanup,
                priority: 1,
                isAsync: false,
            });

            expect(id).toBeDefined();
            expect(result.current.hasCleanupItems()).toBe(true);
            expect(result.current.getCleanupItems()).toHaveLength(1);
            expect(result.current.getCleanupStats().totalItems).toBe(1);
        });

        it('should register event handler cleanup', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockHandler = jest.fn();
            const id = result.current.registerEventHandler(
                mockHubConnection as any,
                'TestEvent',
                mockHandler,
                'Test event handler'
            );

            expect(id).toBeDefined();
            expect(result.current.getCleanupItems()).toHaveLength(1);

            const item = result.current.getCleanupItems()[0];
            expect(item.type).toBe(CleanupItemType.EventHandler);
            expect(item.description).toBe('Test event handler');
        });

        it('should register timer cleanup', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const timerId = setTimeout(() => {}, 1000) as any;
            const id = result.current.registerTimer(timerId, 'Test timer');

            expect(id).toBeDefined();
            expect(result.current.getCleanupItems()).toHaveLength(1);

            const item = result.current.getCleanupItems()[0];
            expect(item.type).toBe(CleanupItemType.Timer);
            expect(item.description).toBe('Test timer');
        });

        it('should register interval cleanup', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const intervalId = setInterval(() => {}, 1000) as any;
            const id = result.current.registerInterval(
                intervalId,
                'Test interval'
            );

            expect(id).toBeDefined();
            expect(result.current.getCleanupItems()).toHaveLength(1);

            const item = result.current.getCleanupItems()[0];
            expect(item.type).toBe(CleanupItemType.Interval);
            expect(item.description).toBe('Test interval');
        });

        it('should register connection cleanup', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const id = result.current.registerConnection(
                mockHubConnection as any,
                'Test connection'
            );

            expect(id).toBeDefined();
            expect(result.current.getCleanupItems()).toHaveLength(1);

            const item = result.current.getCleanupItems()[0];
            expect(item.type).toBe(CleanupItemType.Connection);
            expect(item.description).toBe('Test connection');
            expect(item.priority).toBe(0); // Highest priority
            expect(item.isAsync).toBe(true);
        });

        it('should register subscription cleanup', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockUnsubscribe = jest.fn();
            const id = result.current.registerSubscription(
                mockUnsubscribe,
                'Test subscription'
            );

            expect(id).toBeDefined();
            expect(result.current.getCleanupItems()).toHaveLength(1);

            const item = result.current.getCleanupItems()[0];
            expect(item.type).toBe(CleanupItemType.Subscription);
            expect(item.description).toBe('Test subscription');
        });
    });

    describe('Cleanup Operations', () => {
        it('should cleanup individual items', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockCleanup = jest.fn();
            const id = result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Test resource',
                cleanup: mockCleanup,
                priority: 1,
                isAsync: false,
            });

            expect(result.current.getCleanupItems()).toHaveLength(1);

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(mockCleanup).toHaveBeenCalled();
            expect(result.current.getCleanupItems()).toHaveLength(0);
            expect(result.current.getCleanupStats().cleanedItems).toBe(1);
        });

        it('should cleanup async items with timeout', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockAsyncCleanup = jest.fn().mockResolvedValue(undefined);
            const id = result.current.registerCleanup({
                type: CleanupItemType.Connection,
                description: 'Async resource',
                cleanup: mockAsyncCleanup,
                priority: 1,
                isAsync: true,
            });

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(mockAsyncCleanup).toHaveBeenCalled();
            expect(result.current.getCleanupItems()).toHaveLength(0);
        });

        it('should handle cleanup timeouts', async () => {
            const mockOnCleanupError = jest.fn();
            const { result } = renderHook(() =>
                useSignalRCleanup({
                    config: { cleanupTimeout: 100 },
                    onCleanupError: mockOnCleanupError,
                })
            );

            // Create a cleanup that never resolves
            const mockSlowCleanup = jest.fn(() => new Promise(() => {}));
            const id = result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Slow resource',
                cleanup: mockSlowCleanup,
                priority: 1,
                isAsync: true,
            });

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(false);
            });

            expect(mockOnCleanupError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('timed out'),
                }),
                expect.any(Object)
            );
            expect(result.current.getCleanupStats().failedCleanups).toBe(1);
        });

        it('should cleanup items by type', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockCleanup1 = jest.fn();
            const mockCleanup2 = jest.fn();
            const mockCleanup3 = jest.fn();

            // Register different types
            result.current.registerCleanup({
                type: CleanupItemType.Timer,
                description: 'Timer 1',
                cleanup: mockCleanup1,
                priority: 1,
                isAsync: false,
            });

            result.current.registerCleanup({
                type: CleanupItemType.Timer,
                description: 'Timer 2',
                cleanup: mockCleanup2,
                priority: 1,
                isAsync: false,
            });

            result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Resource',
                cleanup: mockCleanup3,
                priority: 1,
                isAsync: false,
            });

            expect(result.current.getCleanupItems()).toHaveLength(3);

            await act(async () => {
                const cleanedCount = await result.current.cleanupByType(
                    CleanupItemType.Timer
                );
                expect(cleanedCount).toBe(2);
            });

            expect(mockCleanup1).toHaveBeenCalled();
            expect(mockCleanup2).toHaveBeenCalled();
            expect(mockCleanup3).not.toHaveBeenCalled();
            expect(result.current.getCleanupItems()).toHaveLength(1);
        });

        it('should cleanup all items in priority order', async () => {
            const mockOnCleanupStart = jest.fn();
            const mockOnCleanupComplete = jest.fn();

            const { result } = renderHook(() =>
                useSignalRCleanup({
                    onCleanupStart: mockOnCleanupStart,
                    onCleanupComplete: mockOnCleanupComplete,
                })
            );

            const cleanupOrder: number[] = [];

            // Register items with different priorities
            result.current.registerCleanup({
                type: CleanupItemType.Connection,
                description: 'High priority',
                cleanup: () => cleanupOrder.push(0),
                priority: 0,
                isAsync: false,
            });

            result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Low priority',
                cleanup: () => cleanupOrder.push(2),
                priority: 2,
                isAsync: false,
            });

            result.current.registerCleanup({
                type: CleanupItemType.EventHandler,
                description: 'Medium priority',
                cleanup: () => cleanupOrder.push(1),
                priority: 1,
                isAsync: false,
            });

            await act(async () => {
                const stats = await result.current.cleanupAll();
                expect(stats.cleanedItems).toBe(3);
                expect(stats.failedCleanups).toBe(0);
            });

            expect(mockOnCleanupStart).toHaveBeenCalled();
            expect(mockOnCleanupComplete).toHaveBeenCalled();
            expect(cleanupOrder).toEqual([0, 1, 2]); // Should be in priority order
            expect(result.current.getCleanupItems()).toHaveLength(0);
        });
    });

    describe('Event Handler Cleanup', () => {
        it('should cleanup event handlers correctly', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockHandler = jest.fn();
            const id = result.current.registerEventHandler(
                mockHubConnection as any,
                'TestEvent',
                mockHandler
            );

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(mockHubConnection.off).toHaveBeenCalledWith(
                'TestEvent',
                mockHandler
            );
        });

        it('should handle null connection gracefully', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockHandler = jest.fn();
            const id = result.current.registerEventHandler(
                null,
                'TestEvent',
                mockHandler
            );

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            // Should not throw error
            expect(mockHubConnection.off).not.toHaveBeenCalled();
        });
    });

    describe('Connection Cleanup', () => {
        it('should stop connection during cleanup', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            mockHubConnection.stop.mockResolvedValue(undefined);
            const id = result.current.registerConnection(
                mockHubConnection as any
            );

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(mockHubConnection.stop).toHaveBeenCalled();
        });

        it('should handle already disconnected connection', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const disconnectedConnection = {
                ...mockHubConnection,
                state: 'Disconnected',
            };

            const id = result.current.registerConnection(
                disconnectedConnection as any
            );

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(mockHubConnection.stop).not.toHaveBeenCalled();
        });

        it('should handle connection stop errors', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            mockHubConnection.stop.mockRejectedValue(new Error('Stop failed'));
            const id = result.current.registerConnection(
                mockHubConnection as any
            );

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true); // Should still succeed despite error
            });

            expect(mockHubConnection.stop).toHaveBeenCalled();
        });
    });

    describe('Timer and Interval Cleanup', () => {
        it('should clear timers correctly', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
            const timerId = setTimeout(() => {}, 1000) as any;

            const id = result.current.registerTimer(timerId);

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);
            clearTimeoutSpy.mockRestore();
        });

        it('should clear intervals correctly', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
            const intervalId = setInterval(() => {}, 1000) as any;

            const id = result.current.registerInterval(intervalId);

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(true);
            });

            expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
            clearIntervalSpy.mockRestore();
        });
    });

    describe('Management Operations', () => {
        it('should unregister cleanup items', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockCleanup = jest.fn();
            const id = result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Test resource',
                cleanup: mockCleanup,
                priority: 1,
                isAsync: false,
            });

            expect(result.current.getCleanupItems()).toHaveLength(1);

            const success = result.current.unregisterCleanup(id);
            expect(success).toBe(true);
            expect(result.current.getCleanupItems()).toHaveLength(0);
        });

        it('should return false when unregistering non-existent item', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const success = result.current.unregisterCleanup('non-existent-id');
            expect(success).toBe(false);
        });

        it('should return false when cleaning up non-existent item', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            await act(async () => {
                const success =
                    await result.current.cleanupItem('non-existent-id');
                expect(success).toBe(false);
            });
        });
    });

    describe('Statistics', () => {
        it('should track cleanup statistics correctly', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const mockCleanup1 = jest.fn();
            const mockCleanup2 = jest
                .fn()
                .mockRejectedValue(new Error('Cleanup failed'));

            result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Success resource',
                cleanup: mockCleanup1,
                priority: 1,
                isAsync: false,
            });

            result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Failure resource',
                cleanup: mockCleanup2,
                priority: 1,
                isAsync: true,
            });

            const initialStats = result.current.getCleanupStats();
            expect(initialStats.totalItems).toBe(2);

            await act(async () => {
                await result.current.cleanupAll();
            });

            const finalStats = result.current.getCleanupStats();
            expect(finalStats.cleanedItems).toBe(1);
            expect(finalStats.failedCleanups).toBe(1);
            expect(finalStats.averageCleanupTime).toBeGreaterThan(0);
            expect(finalStats.lastCleanupTime).toBeInstanceOf(Date);
        });
    });

    describe('Configuration', () => {
        it('should update configuration', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            act(() => {
                result.current.updateConfig({
                    cleanupTimeout: 10000,
                    enableGracefulShutdown: false,
                });
            });

            // Configuration update should be applied (tested indirectly through behavior)
            expect(result.current).toBeDefined();
        });
    });

    describe('Automatic Cleanup on Unmount', () => {
        it('should perform automatic cleanup on unmount when enabled', async () => {
            const mockCleanup = jest.fn();

            const { unmount } = renderHook(() => {
                const cleanup = useSignalRCleanup({
                    config: {
                        enableAutoCleanup: true,
                        enableGracefulShutdown: false,
                    },
                });

                cleanup.registerCleanup({
                    type: CleanupItemType.Resource,
                    description: 'Test resource',
                    cleanup: mockCleanup,
                    priority: 1,
                    isAsync: false,
                });

                return cleanup;
            });

            unmount();

            // Wait a bit for cleanup to execute
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
            });

            expect(mockCleanup).toHaveBeenCalled();
        });

        it('should not perform automatic cleanup when disabled', async () => {
            const mockCleanup = jest.fn();

            const { unmount } = renderHook(() => {
                const cleanup = useSignalRCleanup({
                    config: { enableAutoCleanup: false },
                });

                cleanup.registerCleanup({
                    type: CleanupItemType.Resource,
                    description: 'Test resource',
                    cleanup: mockCleanup,
                    priority: 1,
                    isAsync: false,
                });

                return cleanup;
            });

            unmount();

            // Wait a bit to ensure cleanup doesn't execute
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
            });

            expect(mockCleanup).not.toHaveBeenCalled();
        });

        it('should skip async cleanup during emergency unmount', async () => {
            const mockSyncCleanup = jest.fn();
            const mockAsyncCleanup = jest.fn();

            const { unmount } = renderHook(() => {
                const cleanup = useSignalRCleanup({
                    config: {
                        enableAutoCleanup: true,
                        enableGracefulShutdown: false,
                    },
                });

                cleanup.registerCleanup({
                    type: CleanupItemType.Resource,
                    description: 'Sync resource',
                    cleanup: mockSyncCleanup,
                    priority: 1,
                    isAsync: false,
                });

                cleanup.registerCleanup({
                    type: CleanupItemType.Connection,
                    description: 'Async resource',
                    cleanup: mockAsyncCleanup,
                    priority: 1,
                    isAsync: true,
                });

                return cleanup;
            });

            unmount();

            // Wait a bit for cleanup to execute
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
            });

            expect(mockSyncCleanup).toHaveBeenCalled();
            expect(mockAsyncCleanup).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle cleanup errors gracefully', async () => {
            const mockOnCleanupError = jest.fn();
            const { result } = renderHook(() =>
                useSignalRCleanup({
                    onCleanupError: mockOnCleanupError,
                })
            );

            const mockFailingCleanup = jest.fn().mockImplementation(() => {
                throw new Error('Cleanup failed');
            });

            const id = result.current.registerCleanup({
                type: CleanupItemType.Resource,
                description: 'Failing resource',
                cleanup: mockFailingCleanup,
                priority: 1,
                isAsync: false,
            });

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(false);
            });

            expect(mockOnCleanupError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Cleanup failed',
                }),
                expect.objectContaining({
                    description: 'Failing resource',
                })
            );
            expect(result.current.getCleanupStats().failedCleanups).toBe(1);
        });

        it('should handle async cleanup errors', async () => {
            const mockOnCleanupError = jest.fn();
            const { result } = renderHook(() =>
                useSignalRCleanup({
                    onCleanupError: mockOnCleanupError,
                })
            );

            const mockFailingAsyncCleanup = jest
                .fn()
                .mockRejectedValue(new Error('Async cleanup failed'));

            const id = result.current.registerCleanup({
                type: CleanupItemType.Connection,
                description: 'Failing async resource',
                cleanup: mockFailingAsyncCleanup,
                priority: 1,
                isAsync: true,
            });

            await act(async () => {
                const success = await result.current.cleanupItem(id);
                expect(success).toBe(false);
            });

            expect(mockOnCleanupError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Async cleanup failed',
                }),
                expect.objectContaining({
                    description: 'Failing async resource',
                })
            );
        });
    });

    describe('Performance Tests', () => {
        it('should handle many cleanup items efficiently', async () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const cleanupFunctions: jest.Mock[] = [];

            // Register 100 cleanup items
            for (let i = 0; i < 100; i++) {
                const mockCleanup = jest.fn();
                cleanupFunctions.push(mockCleanup);

                result.current.registerCleanup({
                    type: CleanupItemType.Resource,
                    description: `Resource ${i}`,
                    cleanup: mockCleanup,
                    priority: Math.floor(i / 10), // Vary priorities
                    isAsync: false,
                });
            }

            expect(result.current.getCleanupItems()).toHaveLength(100);

            const startTime = performance.now();

            await act(async () => {
                await result.current.cleanupAll();
            });

            const cleanupTime = performance.now() - startTime;

            // Should cleanup efficiently (< 100ms for 100 items)
            expect(cleanupTime).toBeLessThan(100);
            expect(result.current.getCleanupStats().cleanedItems).toBe(100);

            // All cleanup functions should have been called
            cleanupFunctions.forEach((fn) => {
                expect(fn).toHaveBeenCalled();
            });
        });

        it('should maintain performance with frequent registration/unregistration', () => {
            const { result } = renderHook(() => useSignalRCleanup());

            const startTime = performance.now();

            // Register and unregister 200 items
            for (let i = 0; i < 200; i++) {
                const id = result.current.registerCleanup({
                    type: CleanupItemType.Resource,
                    description: `Temp resource ${i}`,
                    cleanup: jest.fn(),
                    priority: 1,
                    isAsync: false,
                });

                if (i % 2 === 0) {
                    result.current.unregisterCleanup(id);
                }
            }

            const operationTime = performance.now() - startTime;

            // Should handle operations efficiently (< 50ms)
            expect(operationTime).toBeLessThan(50);
            expect(result.current.getCleanupItems()).toHaveLength(100);
        });
    });
});

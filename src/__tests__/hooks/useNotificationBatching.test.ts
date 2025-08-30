import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationBatching } from '@/hooks/useNotificationBatching';
import {
    createTestNotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/notifications';
import type { NotificationBatchResult } from '@/hooks/useNotificationBatching';

// Mock the debounce hook
jest.mock('@/hooks/useDebounce', () => ({
    useDebounce: jest.fn((fn, delay) => {
        if (delay === 0) return fn;

        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }),
}));

describe('useNotificationBatching', () => {
    // Mock processor function
    const mockProcessor = jest.fn();
    const mockOnBatchProcessed = jest.fn();
    const mockOnBatchError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Default successful processor
        mockProcessor.mockImplementation(async (notifications) => ({
            batchId: `batch_${Date.now()}`,
            processedCount: notifications.length,
            successCount: notifications.length,
            failureCount: 0,
            processingTime: 100,
            timestamp: new Date(),
        }));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Basic Functionality', () => {
        it('should initialize with default configuration', () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                })
            );

            expect(result.current.isProcessing).toBe(false);
            expect(result.current.pendingCount).toBe(0);
            expect(result.current.stats.totalBatches).toBe(0);
            expect(result.current.stats.totalNotifications).toBe(0);
        });

        it('should add single notification to batch', () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchSize: 3 },
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.pendingCount).toBe(1);
        });

        it('should add multiple notifications to batch', () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchSize: 5 },
                })
            );

            const notifications = [
                createTestNotificationMessage({ id: '1' }),
                createTestNotificationMessage({ id: '2' }),
                createTestNotificationMessage({ id: '3' }),
            ];

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.pendingCount).toBe(3);
        });
    });

    describe('Batching Behavior', () => {
        it('should process batch when size limit is reached', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchSize: 2 },
                    onBatchProcessed: mockOnBatchProcessed,
                })
            );

            const notifications = [
                createTestNotificationMessage({ id: '1' }),
                createTestNotificationMessage({ id: '2' }),
            ];

            act(() => {
                result.current.addNotifications(notifications);
            });

            await waitFor(() => {
                expect(mockProcessor).toHaveBeenCalledWith(notifications);
                expect(mockOnBatchProcessed).toHaveBeenCalled();
                expect(result.current.pendingCount).toBe(0);
            });
        });

        it('should process batch after delay when batching is enabled', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: {
                        enableBatching: true,
                        batchSize: 5,
                        batchDelay: 1000,
                        enableDebouncing: false,
                    },
                    onBatchProcessed: mockOnBatchProcessed,
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.pendingCount).toBe(1);
            expect(mockProcessor).not.toHaveBeenCalled();

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                expect(mockProcessor).toHaveBeenCalledWith([notification]);
                expect(result.current.pendingCount).toBe(0);
            });
        });

        it('should process immediately when batching is disabled', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                    onBatchProcessed: mockOnBatchProcessed,
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            await waitFor(() => {
                expect(mockProcessor).toHaveBeenCalledWith([notification]);
                expect(result.current.pendingCount).toBe(0);
            });
        });

        it('should respect max wait time', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: {
                        enableBatching: true,
                        batchSize: 10,
                        batchDelay: 2000,
                        maxWaitTime: 1000,
                        enableDebouncing: false,
                    },
                    onBatchProcessed: mockOnBatchProcessed,
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.pendingCount).toBe(1);

            // Fast-forward to max wait time
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                expect(mockProcessor).toHaveBeenCalledWith([notification]);
                expect(result.current.pendingCount).toBe(0);
            });
        });
    });

    describe('Debouncing', () => {
        it('should debounce rapid notifications when enabled', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: {
                        enableBatching: true,
                        enableDebouncing: true,
                        debounceDelay: 300,
                        batchDelay: 1000,
                        batchSize: 10,
                    },
                    onBatchProcessed: mockOnBatchProcessed,
                })
            );

            // Add notifications rapidly
            act(() => {
                result.current.addNotification(
                    createTestNotificationMessage({ id: '1' })
                );
            });

            act(() => {
                jest.advanceTimersByTime(100);
            });

            act(() => {
                result.current.addNotification(
                    createTestNotificationMessage({ id: '2' })
                );
            });

            act(() => {
                jest.advanceTimersByTime(100);
            });

            act(() => {
                result.current.addNotification(
                    createTestNotificationMessage({ id: '3' })
                );
            });

            expect(result.current.pendingCount).toBe(3);
            expect(mockProcessor).not.toHaveBeenCalled();

            // Fast-forward past debounce delay
            act(() => {
                jest.advanceTimersByTime(1200); // batchDelay + debounceDelay
            });

            await waitFor(() => {
                expect(mockProcessor).toHaveBeenCalledTimes(1);
                expect(mockProcessor).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ id: '1' }),
                        expect.objectContaining({ id: '2' }),
                        expect.objectContaining({ id: '3' }),
                    ])
                );
            });
        });
    });

    describe('Manual Operations', () => {
        it('should flush batch immediately', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchDelay: 5000 },
                    onBatchProcessed: mockOnBatchProcessed,
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.pendingCount).toBe(1);

            await act(async () => {
                await result.current.flushBatch();
            });

            expect(mockProcessor).toHaveBeenCalledWith([notification]);
            expect(result.current.pendingCount).toBe(0);
        });

        it('should clear pending notifications', () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchSize: 10 },
                })
            );

            const notifications = [
                createTestNotificationMessage({ id: '1' }),
                createTestNotificationMessage({ id: '2' }),
                createTestNotificationMessage({ id: '3' }),
            ];

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.pendingCount).toBe(3);

            act(() => {
                result.current.clearPending();
            });

            expect(result.current.pendingCount).toBe(0);
            expect(mockProcessor).not.toHaveBeenCalled();
        });

        it('should update configuration', () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { batchSize: 5 },
                })
            );

            act(() => {
                result.current.updateConfig({
                    batchSize: 10,
                    enableBatching: false,
                });
            });

            // Configuration update should be reflected in behavior
            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            // Should process immediately since batching is disabled
            expect(mockProcessor).toHaveBeenCalledWith([notification]);
        });
    });

    describe('Statistics', () => {
        it('should track processing statistics', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                })
            );

            const notifications = [
                createTestNotificationMessage({ id: '1' }),
                createTestNotificationMessage({ id: '2' }),
            ];

            // Process first batch
            act(() => {
                result.current.addNotification(notifications[0]);
            });

            await waitFor(() => {
                expect(result.current.stats.totalBatches).toBe(1);
                expect(result.current.stats.totalNotifications).toBe(1);
            });

            // Process second batch
            act(() => {
                result.current.addNotification(notifications[1]);
            });

            await waitFor(() => {
                expect(result.current.stats.totalBatches).toBe(2);
                expect(result.current.stats.totalNotifications).toBe(2);
                expect(result.current.stats.averageBatchSize).toBe(1);
                expect(result.current.stats.successRate).toBe(100);
            });
        });

        it('should calculate success rate correctly with failures', async () => {
            // Mock processor to fail on second call
            mockProcessor
                .mockResolvedValueOnce({
                    batchId: 'batch_1',
                    processedCount: 1,
                    successCount: 1,
                    failureCount: 0,
                    processingTime: 100,
                    timestamp: new Date(),
                })
                .mockRejectedValueOnce(new Error('Processing failed'));

            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                    onBatchError: mockOnBatchError,
                })
            );

            // First successful batch
            act(() => {
                result.current.addNotification(
                    createTestNotificationMessage({ id: '1' })
                );
            });

            await waitFor(() => {
                expect(result.current.stats.successRate).toBe(100);
            });

            // Second failed batch
            act(() => {
                result.current.addNotification(
                    createTestNotificationMessage({ id: '2' })
                );
            });

            await waitFor(() => {
                expect(mockOnBatchError).toHaveBeenCalled();
                expect(result.current.stats.totalBatches).toBe(2);
                expect(result.current.stats.successRate).toBe(50); // 1 success out of 2 total notifications
            });
        });

        it('should reset statistics', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                })
            );

            // Process some notifications
            act(() => {
                result.current.addNotification(createTestNotificationMessage());
            });

            await waitFor(() => {
                expect(result.current.stats.totalBatches).toBe(1);
            });

            // Reset statistics
            act(() => {
                result.current.resetStats();
            });

            expect(result.current.stats.totalBatches).toBe(0);
            expect(result.current.stats.totalNotifications).toBe(0);
            expect(result.current.stats.averageBatchSize).toBe(0);
            expect(result.current.stats.successRate).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle processor errors gracefully', async () => {
            mockProcessor.mockRejectedValue(new Error('Processing failed'));

            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                    onBatchError: mockOnBatchError,
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            await waitFor(() => {
                expect(mockOnBatchError).toHaveBeenCalledWith(
                    expect.any(Error),
                    [notification]
                );
                expect(result.current.isProcessing).toBe(false);
            });
        });

        it('should not process when already processing', async () => {
            // Mock a slow processor
            mockProcessor.mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 1000))
            );

            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                })
            );

            const notification1 = createTestNotificationMessage({ id: '1' });
            const notification2 = createTestNotificationMessage({ id: '2' });

            // Start first processing
            act(() => {
                result.current.addNotification(notification1);
            });

            expect(result.current.isProcessing).toBe(true);

            // Try to add another notification while processing
            act(() => {
                result.current.addNotification(notification2);
            });

            // Second notification should be pending
            expect(result.current.pendingCount).toBe(1);
            expect(mockProcessor).toHaveBeenCalledTimes(1);
        });
    });

    describe('Performance Tests', () => {
        it('should handle large batches efficiently', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchSize: 100 },
                })
            );

            // Create 100 notifications
            const notifications = Array.from({ length: 100 }, (_, i) =>
                createTestNotificationMessage({
                    id: `notification_${i}`,
                    type: NotificationType.EventRegistration,
                    priority: NotificationPriority.Normal,
                })
            );

            const startTime = performance.now();

            act(() => {
                result.current.addNotifications(notifications);
            });

            const addTime = performance.now() - startTime;

            await waitFor(() => {
                expect(mockProcessor).toHaveBeenCalledWith(notifications);
                expect(result.current.pendingCount).toBe(0);
            });

            // Adding 100 notifications should be fast (< 100ms)
            expect(addTime).toBeLessThan(100);
        });

        it('should maintain performance with frequent updates', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: {
                        enableBatching: true,
                        batchSize: 10,
                        batchDelay: 100,
                        enableDebouncing: true,
                        debounceDelay: 50,
                    },
                })
            );

            const startTime = performance.now();

            // Add notifications rapidly
            for (let i = 0; i < 50; i++) {
                act(() => {
                    result.current.addNotification(
                        createTestNotificationMessage({ id: `rapid_${i}` })
                    );
                });

                // Small delay between additions
                act(() => {
                    jest.advanceTimersByTime(10);
                });
            }

            const addTime = performance.now() - startTime;

            // Fast-forward to process all batches
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            await waitFor(() => {
                expect(result.current.pendingCount).toBe(0);
            });

            // Rapid additions should be efficient
            expect(addTime).toBeLessThan(200);
            expect(mockProcessor).toHaveBeenCalled();
        });

        it('should limit memory usage with statistics history', async () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: false },
                })
            );

            // Process many batches to test history limits
            for (let i = 0; i < 150; i++) {
                act(() => {
                    result.current.addNotification(
                        createTestNotificationMessage({
                            id: `memory_test_${i}`,
                        })
                    );
                });

                await waitFor(() => {
                    expect(result.current.isProcessing).toBe(false);
                });
            }

            // Statistics should still be reasonable (not growing indefinitely)
            expect(result.current.stats.totalBatches).toBe(150);
            expect(result.current.stats.averageBatchSize).toBe(1);
        });
    });

    describe('Configuration Updates', () => {
        it('should apply configuration changes immediately', () => {
            const { result } = renderHook(() =>
                useNotificationBatching({
                    processor: mockProcessor,
                    config: { enableBatching: true, batchSize: 5 },
                })
            );

            // Add some notifications
            act(() => {
                result.current.addNotifications([
                    createTestNotificationMessage({ id: '1' }),
                    createTestNotificationMessage({ id: '2' }),
                ]);
            });

            expect(result.current.pendingCount).toBe(2);

            // Disable batching
            act(() => {
                result.current.updateConfig({ enableBatching: false });
            });

            // Add another notification - should process immediately
            act(() => {
                result.current.addNotification(
                    createTestNotificationMessage({ id: '3' })
                );
            });

            expect(mockProcessor).toHaveBeenCalledWith([
                expect.objectContaining({ id: '3' }),
            ]);
        });
    });
});

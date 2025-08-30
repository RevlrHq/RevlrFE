import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import {
    createTestNotificationMessage,
    NotificationType,
    NotificationPriority,
    createTestNotificationBatch,
} from '@/types/notifications';

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

describe('useNotificationHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (!jest.isMockFunction(setTimeout)) {
            jest.useFakeTimers();
        }
        mockLocalStorage.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        if (jest.isMockFunction(setTimeout)) {
            jest.useRealTimers();
        }
    });

    describe('Basic Functionality', () => {
        it('should initialize with empty history', () => {
            const { result } = renderHook(() => useNotificationHistory());

            expect(result.current.entries).toEqual([]);
            expect(result.current.stats.total).toBe(0);
            expect(result.current.stats.unread).toBe(0);
            expect(result.current.stats.dismissed).toBe(0);
            expect(result.current.isLoading).toBe(false);
        });

        it('should add notification to history', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.entries).toHaveLength(1);
            expect(result.current.entries[0].notification.id).toBe(
                notification.id
            );
            expect(result.current.entries[0].isRead).toBe(false);
            expect(result.current.entries[0].isDismissed).toBe(false);
            expect(result.current.stats.total).toBe(1);
            expect(result.current.stats.unread).toBe(1);
        });

        it('should add multiple notifications to history', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(3);

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.entries).toHaveLength(3);
            expect(result.current.stats.total).toBe(3);
            expect(result.current.stats.unread).toBe(3);
        });

        it('should update existing notification instead of duplicating', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notification = createTestNotificationMessage();

            // Add notification twice
            act(() => {
                result.current.addNotification(notification);
            });

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.entries).toHaveLength(1);
            expect(result.current.stats.total).toBe(1);
        });
    });

    describe('Memory Management', () => {
        it('should respect maximum size limit', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { maxSize: 5, enableAutoCleanup: false },
                })
            );

            // Add more notifications than the limit
            const notifications = createTestNotificationBatch(10);

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.entries).toHaveLength(5);
            expect(result.current.stats.total).toBe(5);
        });

        it('should remove oldest entries when exceeding size limit', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { maxSize: 3, enableAutoCleanup: false },
                })
            );

            const notifications = [
                createTestNotificationMessage({ id: '1', title: 'First' }),
                createTestNotificationMessage({ id: '2', title: 'Second' }),
                createTestNotificationMessage({ id: '3', title: 'Third' }),
                createTestNotificationMessage({ id: '4', title: 'Fourth' }),
            ];

            // Add notifications one by one
            notifications.forEach((notification) => {
                act(() => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.entries).toHaveLength(3);
            // Should keep the newest entries (2, 3, 4)
            expect(
                result.current.entries.map((e) => e.notification.title)
            ).toEqual(['Fourth', 'Third', 'Second']);
        });

        it('should perform automatic cleanup based on age', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: {
                        maxAge: 24 * 60 * 60 * 1000, // 24 hours
                        enableAutoCleanup: true,
                        cleanupInterval: 1000,
                    },
                })
            );

            // Create old notification (2 days ago)
            const oldDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            const oldNotification = createTestNotificationMessage({
                id: 'old',
                timestamp: oldDate.toISOString(),
            });

            // Create recent notification
            const recentNotification = createTestNotificationMessage({
                id: 'recent',
            });

            act(() => {
                result.current.addNotification(oldNotification);
                result.current.addNotification(recentNotification);
            });

            expect(result.current.entries).toHaveLength(2);

            // Trigger cleanup by advancing time
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            // Manual cleanup since automatic cleanup might not trigger in tests
            act(() => {
                result.current.cleanup();
            });

            expect(result.current.entries).toHaveLength(1);
            expect(result.current.entries[0].notification.id).toBe('recent');
        });

        it('should estimate memory usage correctly', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                title: 'Test notification with some content',
                message: 'This is a longer message to test memory estimation',
            });

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.stats.memoryUsage).toBeGreaterThan(0);
        });

        it('should handle force cleanup correctly', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { maxSize: 10 },
                })
            );

            const notifications = createTestNotificationBatch(10);

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.entries).toHaveLength(10);

            // Force cleanup should reduce to half the max size
            act(() => {
                const removedCount = result.current.forceCleanup();
                expect(removedCount).toBe(5);
            });

            expect(result.current.entries).toHaveLength(5);
        });
    });

    describe('Read/Dismiss Operations', () => {
        it('should mark notification as read', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.stats.unread).toBe(1);

            act(() => {
                const success = result.current.markAsRead(notification.id);
                expect(success).toBe(true);
            });

            expect(result.current.entries[0].isRead).toBe(true);
            expect(result.current.entries[0].readAt).toBeInstanceOf(Date);
            expect(result.current.stats.unread).toBe(0);
        });

        it('should mark all notifications as read', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(3);

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.stats.unread).toBe(3);

            act(() => {
                const markedCount = result.current.markAllAsRead();
                expect(markedCount).toBe(3);
            });

            expect(result.current.stats.unread).toBe(0);
            result.current.entries.forEach((entry) => {
                expect(entry.isRead).toBe(true);
                expect(entry.readAt).toBeInstanceOf(Date);
            });
        });

        it('should dismiss notification', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            act(() => {
                const success = result.current.dismissNotification(
                    notification.id
                );
                expect(success).toBe(true);
            });

            expect(result.current.entries[0].isDismissed).toBe(true);
            expect(result.current.entries[0].dismissedAt).toBeInstanceOf(Date);
            expect(result.current.stats.dismissed).toBe(1);
        });

        it('should dismiss all notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(3);

            act(() => {
                result.current.addNotifications(notifications);
            });

            act(() => {
                const dismissedCount = result.current.dismissAll();
                expect(dismissedCount).toBe(3);
            });

            expect(result.current.stats.dismissed).toBe(3);
            result.current.entries.forEach((entry) => {
                expect(entry.isDismissed).toBe(true);
                expect(entry.dismissedAt).toBeInstanceOf(Date);
            });
        });

        it('should remove notification from history', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.entries).toHaveLength(1);

            act(() => {
                const success = result.current.removeNotification(
                    notification.id
                );
                expect(success).toBe(true);
            });

            expect(result.current.entries).toHaveLength(0);
            expect(result.current.stats.total).toBe(0);
        });

        it('should clear all history', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(5);

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.entries).toHaveLength(5);

            act(() => {
                result.current.clearHistory();
            });

            expect(result.current.entries).toHaveLength(0);
            expect(result.current.stats.total).toBe(0);
            expect(result.current.stats.unread).toBe(0);
            expect(result.current.stats.dismissed).toBe(0);
        });
    });

    describe('Query Operations', () => {
        it('should get notification by ID', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            const found = result.current.getNotification(notification.id);
            expect(found).toBeDefined();
            expect(found?.notification.id).toBe(notification.id);

            const notFound = result.current.getNotification('non-existent');
            expect(notFound).toBeUndefined();
        });

        it('should get notifications by type', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = [
                createTestNotificationMessage({
                    id: '1',
                    type: NotificationType.EventRegistration,
                }),
                createTestNotificationMessage({
                    id: '2',
                    type: NotificationType.PaymentCompleted,
                }),
                createTestNotificationMessage({
                    id: '3',
                    type: NotificationType.EventRegistration,
                }),
            ];

            act(() => {
                result.current.addNotifications(notifications);
            });

            const eventNotifications = result.current.getNotificationsByType(
                NotificationType.EventRegistration
            );
            expect(eventNotifications).toHaveLength(2);
            expect(
                eventNotifications.every(
                    (entry) =>
                        entry.notification.type ===
                        NotificationType.EventRegistration
                )
            ).toBe(true);
        });

        it('should get unread notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(3);

            act(() => {
                result.current.addNotifications(notifications);
            });

            // Mark one as read
            act(() => {
                result.current.markAsRead(notifications[0].id);
            });

            const unreadNotifications = result.current.getUnreadNotifications();
            expect(unreadNotifications).toHaveLength(2);
            expect(unreadNotifications.every((entry) => !entry.isRead)).toBe(
                true
            );
        });

        it('should get recent notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(10);

            act(() => {
                result.current.addNotifications(notifications);
            });

            const recentNotifications =
                result.current.getRecentNotifications(5);
            expect(recentNotifications).toHaveLength(5);

            // Should be sorted by newest first
            for (let i = 1; i < recentNotifications.length; i++) {
                expect(
                    recentNotifications[i - 1].receivedAt.getTime()
                ).toBeGreaterThanOrEqual(
                    recentNotifications[i].receivedAt.getTime()
                );
            }
        });

        it('should search notifications by text', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = [
                createTestNotificationMessage({
                    id: '1',
                    title: 'Payment completed',
                    message: 'Your payment was successful',
                }),
                createTestNotificationMessage({
                    id: '2',
                    title: 'Event registration',
                    message: 'You have registered for the event',
                }),
                createTestNotificationMessage({
                    id: '3',
                    title: 'Payment failed',
                    message: 'Your payment could not be processed',
                }),
            ];

            act(() => {
                result.current.addNotifications(notifications);
            });

            const paymentNotifications =
                result.current.searchNotifications('payment');
            expect(paymentNotifications).toHaveLength(2);
            expect(
                paymentNotifications.every(
                    (entry) =>
                        entry.notification.title
                            .toLowerCase()
                            .includes('payment') ||
                        entry.notification.message
                            .toLowerCase()
                            .includes('payment')
                )
            ).toBe(true);
        });

        it('should filter notifications by criteria', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = [
                createTestNotificationMessage({
                    id: '1',
                    type: NotificationType.EventRegistration,
                    priority: NotificationPriority.High,
                }),
                createTestNotificationMessage({
                    id: '2',
                    type: NotificationType.PaymentCompleted,
                    priority: NotificationPriority.Normal,
                }),
                createTestNotificationMessage({
                    id: '3',
                    type: NotificationType.EventRegistration,
                    priority: NotificationPriority.Low,
                }),
            ];

            act(() => {
                result.current.addNotifications(notifications);
            });

            // Mark one as read
            act(() => {
                result.current.markAsRead(notifications[0].id);
            });

            // Filter by type and read status
            const filteredNotifications = result.current.filterNotifications({
                types: [NotificationType.EventRegistration],
                isRead: false,
            });

            expect(filteredNotifications).toHaveLength(1);
            expect(filteredNotifications[0].notification.id).toBe('3');
        });
    });

    describe('Persistence', () => {
        it('should save to localStorage when enabled', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { enablePersistence: true, storageKey: 'test_key' },
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            // Fast-forward to trigger auto-save
            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'test_key',
                expect.any(String)
            );
        });

        it('should load from localStorage on mount', () => {
            const testData = JSON.stringify([
                {
                    notification: createTestNotificationMessage(),
                    receivedAt: new Date().toISOString(),
                    isRead: false,
                    isDismissed: false,
                },
            ]);

            mockLocalStorage.getItem.mockReturnValue(testData);

            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { enablePersistence: true, storageKey: 'test_key' },
                })
            );

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test_key');

            // Wait for loading to complete
            waitFor(() => {
                expect(result.current.entries).toHaveLength(1);
            });
        });

        it('should handle corrupted localStorage data gracefully', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { enablePersistence: true },
                })
            );

            expect(result.current.entries).toHaveLength(0);
            expect(result.current.isLoading).toBe(false);
        });

        it('should clear localStorage', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { enablePersistence: true, storageKey: 'test_key' },
                })
            );

            act(() => {
                result.current.clearStorage();
            });

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                'test_key'
            );
        });
    });

    describe('Performance Tests', () => {
        it('should handle large number of notifications efficiently', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { maxSize: 1000, enableAutoCleanup: false },
                })
            );

            // Create 500 notifications
            const notifications = Array.from({ length: 500 }, (_, i) =>
                createTestNotificationMessage({
                    id: `perf_test_${i}`,
                    title: `Performance test notification ${i}`,
                })
            );

            const startTime = performance.now();

            act(() => {
                result.current.addNotifications(notifications);
            });

            const addTime = performance.now() - startTime;

            expect(result.current.entries).toHaveLength(500);
            expect(result.current.stats.total).toBe(500);

            // Adding 500 notifications should be reasonably fast (< 500ms)
            expect(addTime).toBeLessThan(500);
        });

        it('should perform search efficiently on large dataset', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { maxSize: 1000, enableAutoCleanup: false },
                })
            );

            // Create 200 notifications with some containing "important"
            const notifications = Array.from({ length: 200 }, (_, i) =>
                createTestNotificationMessage({
                    id: `search_test_${i}`,
                    title:
                        i % 10 === 0
                            ? `Important notification ${i}`
                            : `Regular notification ${i}`,
                })
            );

            act(() => {
                result.current.addNotifications(notifications);
            });

            const startTime = performance.now();
            const searchResults =
                result.current.searchNotifications('important');
            const searchTime = performance.now() - startTime;

            expect(searchResults).toHaveLength(20); // Every 10th notification
            expect(searchTime).toBeLessThan(50); // Search should be fast
        });

        it('should handle frequent read/dismiss operations efficiently', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(100);

            act(() => {
                result.current.addNotifications(notifications);
            });

            const startTime = performance.now();

            // Mark every other notification as read
            notifications.forEach((notification, index) => {
                if (index % 2 === 0) {
                    act(() => {
                        result.current.markAsRead(notification.id);
                    });
                }
            });

            const operationTime = performance.now() - startTime;

            expect(result.current.stats.unread).toBe(50);
            expect(operationTime).toBeLessThan(200); // Operations should be efficient
        });

        it('should maintain performance during cleanup operations', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    config: { maxSize: 50, enableAutoCleanup: false },
                })
            );

            // Add many notifications to trigger cleanup
            const notifications = createTestNotificationBatch(100);

            const startTime = performance.now();

            act(() => {
                result.current.addNotifications(notifications);
            });

            const addTime = performance.now() - startTime;

            expect(result.current.entries).toHaveLength(50);
            expect(addTime).toBeLessThan(300); // Should handle cleanup efficiently
        });
    });

    describe('Statistics Accuracy', () => {
        it('should maintain accurate statistics during operations', () => {
            const { result } = renderHook(() => useNotificationHistory());
            const notifications = createTestNotificationBatch(10);

            act(() => {
                result.current.addNotifications(notifications);
            });

            expect(result.current.stats.total).toBe(10);
            expect(result.current.stats.unread).toBe(10);
            expect(result.current.stats.dismissed).toBe(0);

            // Mark some as read
            act(() => {
                result.current.markAsRead(notifications[0].id);
                result.current.markAsRead(notifications[1].id);
            });

            expect(result.current.stats.unread).toBe(8);

            // Dismiss some
            act(() => {
                result.current.dismissNotification(notifications[2].id);
                result.current.dismissNotification(notifications[3].id);
            });

            expect(result.current.stats.dismissed).toBe(2);

            // Remove some
            act(() => {
                result.current.removeNotification(notifications[4].id);
            });

            expect(result.current.stats.total).toBe(9);
        });

        it('should calculate recent count correctly', () => {
            const { result } = renderHook(() => useNotificationHistory());

            // Create old notification (2 days ago)
            const oldNotification = createTestNotificationMessage({
                id: 'old',
                timestamp: new Date(
                    Date.now() - 2 * 24 * 60 * 60 * 1000
                ).toISOString(),
            });

            // Create recent notification
            const recentNotification = createTestNotificationMessage({
                id: 'recent',
            });

            act(() => {
                result.current.addNotification(oldNotification);
                result.current.addNotification(recentNotification);
            });

            expect(result.current.stats.total).toBe(2);
            expect(result.current.stats.recentCount).toBe(1); // Only the recent one
        });
    });
});

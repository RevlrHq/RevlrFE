import { renderHook, act } from '@testing-library/react';
import { useNotificationHistory } from '../useNotificationHistory';
import {
    NotificationType,
    NotificationPriority,
    createTestNotificationMessage,
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
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Basic Functionality', () => {
        it('should initialize with empty history', () => {
            const { result } = renderHook(() => useNotificationHistory());

            expect(result.current.history).toEqual([]);
            expect(result.current.stats.total).toBe(0);
            expect(result.current.stats.unread).toBe(0);
        });

        it('should add notification to history', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
                title: 'Test Notification',
            });

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.history).toHaveLength(1);
            expect(result.current.history[0].notification.id).toBe('test-1');
            expect(result.current.history[0].isRead).toBe(false);
            expect(result.current.history[0].isDismissed).toBe(false);
        });

        it('should not add duplicate notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
            });

            act(() => {
                result.current.addNotification(notification);
                result.current.addNotification(notification); // Duplicate
            });

            expect(result.current.history).toHaveLength(1);
        });

        it('should mark notification as read', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
            });

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.history[0].isRead).toBe(false);

            act(() => {
                const success = result.current.markAsRead('test-1');
                expect(success).toBe(true);
            });

            expect(result.current.history[0].isRead).toBe(true);
            expect(result.current.history[0].readAt).toBeInstanceOf(Date);
        });

        it('should mark notification as unread', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
            });

            act(() => {
                result.current.addNotification(notification);
                result.current.markAsRead('test-1');
            });

            expect(result.current.history[0].isRead).toBe(true);

            act(() => {
                const success = result.current.markAsUnread('test-1');
                expect(success).toBe(true);
            });

            expect(result.current.history[0].isRead).toBe(false);
            expect(result.current.history[0].readAt).toBeUndefined();
        });

        it('should dismiss notification', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
            });

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.history[0].isDismissed).toBe(false);

            act(() => {
                const success = result.current.dismiss('test-1');
                expect(success).toBe(true);
            });

            expect(result.current.history[0].isDismissed).toBe(true);
            expect(result.current.history[0].dismissedAt).toBeInstanceOf(Date);
        });

        it('should remove notification from history', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
            });

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.history).toHaveLength(1);

            act(() => {
                const success = result.current.remove('test-1');
                expect(success).toBe(true);
            });

            expect(result.current.history).toHaveLength(0);
        });

        it('should clear all history', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.history).toHaveLength(3);

            act(() => {
                result.current.clear();
            });

            expect(result.current.history).toHaveLength(0);
        });
    });

    describe('Statistics Calculation', () => {
        it('should calculate correct statistics', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({
                    id: 'test-1',
                    type: NotificationType.EventRegistration,
                    priority: NotificationPriority.High,
                }),
                createTestNotificationMessage({
                    id: 'test-2',
                    type: NotificationType.PaymentCompleted,
                    priority: NotificationPriority.Normal,
                }),
                createTestNotificationMessage({
                    id: 'test-3',
                    type: NotificationType.EventRegistration,
                    priority: NotificationPriority.Low,
                }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.markAsRead('test-1');
                result.current.dismiss('test-2');
            });

            const stats = result.current.stats;

            expect(stats.total).toBe(3);
            expect(stats.unread).toBe(2); // test-2 and test-3
            expect(stats.dismissed).toBe(1); // test-2
            expect(stats.byType[NotificationType.EventRegistration]).toBe(2);
            expect(stats.byType[NotificationType.PaymentCompleted]).toBe(1);
            expect(stats.byPriority[NotificationPriority.High]).toBe(1);
            expect(stats.byPriority[NotificationPriority.Normal]).toBe(1);
            expect(stats.byPriority[NotificationPriority.Low]).toBe(1);
        });

        it('should calculate recent notifications count', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const now = new Date();
            const twentyFiveHoursAgo = new Date(
                now.getTime() - 25 * 60 * 60 * 1000
            );

            // Mock Date.now to control timestamps
            const originalNow = Date.now;
            Date.now = jest.fn(() => now.getTime());

            const recentNotification = createTestNotificationMessage({
                id: 'recent',
                timestamp: now.toISOString(),
            });

            const oldNotification = createTestNotificationMessage({
                id: 'old',
                timestamp: twentyFiveHoursAgo.toISOString(),
            });

            act(() => {
                result.current.addNotification(recentNotification);
                result.current.addNotification(oldNotification);
            });

            expect(result.current.stats.recentCount).toBe(2); // Both should be counted as recent based on receivedAt

            // Restore original Date.now
            Date.now = originalNow;
        });
    });

    describe('Filtering', () => {
        beforeEach(() => {
            // Setup test data for filtering tests
        });

        it('should filter by notification type', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({
                    id: 'event-1',
                    type: NotificationType.EventRegistration,
                }),
                createTestNotificationMessage({
                    id: 'payment-1',
                    type: NotificationType.PaymentCompleted,
                }),
                createTestNotificationMessage({
                    id: 'event-2',
                    type: NotificationType.EventUpdate,
                }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.setFilter({
                    types: [
                        NotificationType.EventRegistration,
                        NotificationType.EventUpdate,
                    ],
                });
            });

            expect(result.current.filteredHistory).toHaveLength(2);
            expect(result.current.filteredHistory[0].notification.id).toBe(
                'event-2'
            );
            expect(result.current.filteredHistory[1].notification.id).toBe(
                'event-1'
            );
        });

        it('should filter by priority', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({
                    id: 'high-1',
                    priority: NotificationPriority.High,
                }),
                createTestNotificationMessage({
                    id: 'normal-1',
                    priority: NotificationPriority.Normal,
                }),
                createTestNotificationMessage({
                    id: 'high-2',
                    priority: NotificationPriority.High,
                }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.setFilter({
                    priorities: [NotificationPriority.High],
                });
            });

            expect(result.current.filteredHistory).toHaveLength(2);
            expect(
                result.current.filteredHistory.every(
                    (entry) =>
                        entry.notification.priority ===
                        NotificationPriority.High
                )
            ).toBe(true);
        });

        it('should filter by read status', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'read-1' }),
                createTestNotificationMessage({ id: 'unread-1' }),
                createTestNotificationMessage({ id: 'read-2' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.markAsRead('read-1');
                result.current.markAsRead('read-2');
                result.current.setFilter({ isRead: true });
            });

            expect(result.current.filteredHistory).toHaveLength(2);
            expect(
                result.current.filteredHistory.every((entry) => entry.isRead)
            ).toBe(true);
        });

        it('should filter by search query', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({
                    id: 'match-1',
                    title: 'Event Registration Confirmed',
                }),
                createTestNotificationMessage({
                    id: 'match-2',
                    message: 'Your event has been updated',
                }),
                createTestNotificationMessage({
                    id: 'no-match',
                    title: 'Payment Completed',
                    message: 'Your payment was successful',
                }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.setFilter({ searchQuery: 'event' });
            });

            expect(result.current.filteredHistory).toHaveLength(2);
            expect(
                result.current.filteredHistory.some(
                    (entry) => entry.notification.id === 'match-1'
                )
            ).toBe(true);
            expect(
                result.current.filteredHistory.some(
                    (entry) => entry.notification.id === 'match-2'
                )
            ).toBe(true);
        });

        it('should clear filter', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.setFilter({
                    types: [NotificationType.EventRegistration],
                });
            });

            expect(result.current.filteredHistory).toHaveLength(2); // Both are EventRegistration by default

            act(() => {
                result.current.clearFilter();
            });

            expect(result.current.currentFilter).toEqual({});
            expect(result.current.filteredHistory).toHaveLength(2);
        });
    });

    describe('Bulk Operations', () => {
        it('should mark multiple notifications as read', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.stats.unread).toBe(3);

            act(() => {
                const count = result.current.markSelectedAsRead([
                    'test-1',
                    'test-3',
                ]);
                expect(count).toBe(2);
            });

            expect(result.current.stats.unread).toBe(1);
            expect(result.current.getNotification('test-1')?.isRead).toBe(true);
            expect(result.current.getNotification('test-2')?.isRead).toBe(
                false
            );
            expect(result.current.getNotification('test-3')?.isRead).toBe(true);
        });

        it('should dismiss multiple notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.stats.dismissed).toBe(0);

            act(() => {
                const count = result.current.dismissSelected([
                    'test-1',
                    'test-2',
                ]);
                expect(count).toBe(2);
            });

            expect(result.current.stats.dismissed).toBe(2);
        });

        it('should remove multiple notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.history).toHaveLength(3);

            act(() => {
                const count = result.current.removeSelected([
                    'test-1',
                    'test-3',
                ]);
                expect(count).toBe(2);
            });

            expect(result.current.history).toHaveLength(1);
            expect(result.current.history[0].notification.id).toBe('test-2');
        });

        it('should mark all notifications as read', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.stats.unread).toBe(3);

            act(() => {
                const count = result.current.markAllAsRead();
                expect(count).toBe(3);
            });

            expect(result.current.stats.unread).toBe(0);
        });
    });

    describe('Persistence', () => {
        it('should save to localStorage when persistence is enabled', () => {
            renderHook(() =>
                useNotificationHistory({
                    enablePersistence: true,
                    storageKey: 'test-key',
                })
            );

            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
        });

        it('should not save to localStorage when persistence is disabled', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    enablePersistence: false,
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        it('should export and import history', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            const exported = result.current.exportHistory();
            expect(exported).toBeTruthy();

            act(() => {
                result.current.clear();
            });

            expect(result.current.history).toHaveLength(0);

            act(() => {
                const success = result.current.importHistory(exported);
                expect(success).toBe(true);
            });

            expect(result.current.history).toHaveLength(2);
        });
    });

    describe('Auto Cleanup', () => {
        it('should clean up old notifications when auto cleanup is enabled', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    enableAutoCleanup: true,
                    maxAge: 1000, // 1 second
                    cleanupInterval: 500, // 0.5 seconds
                })
            );

            const notification = createTestNotificationMessage();

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.history).toHaveLength(1);

            // Fast forward time beyond maxAge
            act(() => {
                jest.advanceTimersByTime(1500);
            });

            expect(result.current.history).toHaveLength(0);
        });

        it('should limit history size', () => {
            const { result } = renderHook(() =>
                useNotificationHistory({
                    maxSize: 2,
                })
            );

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.history).toHaveLength(2);
            // Should keep the most recent ones
            expect(result.current.history[0].notification.id).toBe('test-3');
            expect(result.current.history[1].notification.id).toBe('test-2');
        });
    });

    describe('Utility Functions', () => {
        it('should get notification by ID', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notification = createTestNotificationMessage({
                id: 'test-1',
            });

            act(() => {
                result.current.addNotification(notification);
            });

            const retrieved = result.current.getNotification('test-1');
            expect(retrieved).toBeTruthy();
            expect(retrieved?.notification.id).toBe('test-1');

            const notFound = result.current.getNotification('not-found');
            expect(notFound).toBeNull();
        });

        it('should get unread count', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const notifications = [
                createTestNotificationMessage({ id: 'test-1' }),
                createTestNotificationMessage({ id: 'test-2' }),
                createTestNotificationMessage({ id: 'test-3' }),
            ];

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
                result.current.markAsRead('test-1');
            });

            expect(result.current.getUnreadCount()).toBe(2);
        });

        it('should get recent notifications', () => {
            const { result } = renderHook(() => useNotificationHistory());

            const now = new Date();
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

            // Mock Date.now for consistent testing
            const originalNow = Date.now;
            Date.now = jest.fn(() => now.getTime());

            const notifications = [
                createTestNotificationMessage({ id: 'recent' }),
                createTestNotificationMessage({ id: 'old' }),
            ];

            act(() => {
                result.current.addNotification(notifications[0]);

                // Manually set an older timestamp for the second notification
                Date.now = jest.fn(() => twoHoursAgo.getTime());
                result.current.addNotification(notifications[1]);
            });

            const recent = result.current.getRecentNotifications(1); // Last 1 hour
            expect(recent).toHaveLength(1);
            expect(recent[0].notification.id).toBe('recent');

            // Restore original Date.now
            Date.now = originalNow;
        });
    });
});

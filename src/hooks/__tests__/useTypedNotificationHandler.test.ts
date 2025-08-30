import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useTypedNotificationHandler } from '../useTypedNotificationHandler';
import { useSignalRContext } from '@/providers/SignalRProvider';
import { useToast } from '@/hooks/use-toast';
import {
    NotificationType,
    NotificationPriority,
    createTestNotificationMessage,
    createTestEventNotificationData,
    createTestPaymentNotificationData,
    createTestFinancingNotificationData,
    createTestSystemNotificationData,
} from '@/types/notifications';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/providers/SignalRProvider');
jest.mock('@/hooks/use-toast');

const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
};

const mockSignalR = {
    isConnected: true,
    on: jest.fn(),
    off: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
};

const mockToast = jest.fn();

describe('useTypedNotificationHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useSignalRContext as jest.Mock).mockReturnValue(mockSignalR);
        (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    });

    describe('Notification Routing', () => {
        it('should generate correct route for event notifications', () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventId: 'event-123',
                }),
            });

            const route =
                result.current.getNotificationRoute(eventNotification);
            expect(route).toBe('/dashboard/events/event-123');
        });

        it('should generate correct route for payment notifications', () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
                data: createTestPaymentNotificationData({
                    paymentId: 'payment-123',
                }),
            });

            const route =
                result.current.getNotificationRoute(paymentNotification);
            expect(route).toBe('/dashboard/payment/history');
        });

        it('should generate correct route for financing notifications', () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const financingNotification = createTestNotificationMessage({
                type: NotificationType.FinancingApplicationSubmitted,
                data: createTestFinancingNotificationData({
                    applicationId: 'app-123',
                    eventId: 'event-123',
                }),
            });

            const route = result.current.getNotificationRoute(
                financingNotification
            );
            expect(route).toBe('/dashboard/financing/applications');
        });

        it('should generate correct route for system notifications', () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const systemNotification = createTestNotificationMessage({
                type: NotificationType.SystemMaintenance,
                data: createTestSystemNotificationData({
                    notificationId: 'sys-123',
                }),
            });

            const route =
                result.current.getNotificationRoute(systemNotification);
            expect(route).toBe('/dashboard/system/maintenance');
        });

        it('should use actionUrl when available and no template interpolation occurs', () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                actionUrl: 'https://custom.example.com/event/123',
                data: undefined, // No data to interpolate
            });

            const route = result.current.getNotificationRoute(notification);
            expect(route).toBe('https://custom.example.com/event/123');
        });

        it('should return null for unknown notification types', () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    routing: {}, // Empty routing config
                })
            );

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
            });

            const route = result.current.getNotificationRoute(notification);
            expect(route).toBeNull();
        });

        it('should handle custom routing configuration', () => {
            const customRouting = {
                [NotificationType.EventRegistration]:
                    '/custom/events/{eventId}',
            };

            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    routing: customRouting,
                })
            );

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventId: 'event-456',
                }),
            });

            const route = result.current.getNotificationRoute(notification);
            expect(route).toBe('/custom/events/event-456');
        });
    });

    describe('Navigation Handling', () => {
        it('should navigate to notification route successfully', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventId: 'event-123',
                }),
            });

            const navigated =
                await result.current.navigateToNotification(notification);

            expect(navigated).toBe(true);
            expect(mockRouter.push).toHaveBeenCalledWith(
                '/dashboard/events/event-123'
            );
        });

        it('should handle navigation failure gracefully', async () => {
            mockRouter.push.mockImplementation(() => {
                throw new Error('Navigation failed');
            });

            const onNavigationError = jest.fn();
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    onNavigationError,
                })
            );

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventId: 'event-123',
                }),
            });

            const navigated =
                await result.current.navigateToNotification(notification);

            expect(navigated).toBe(false);
            expect(onNavigationError).toHaveBeenCalledWith(
                notification,
                expect.any(Error)
            );
        });

        it('should not navigate when no route is available', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    routing: {}, // Empty routing
                })
            );

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
            });

            const navigated =
                await result.current.navigateToNotification(notification);

            expect(navigated).toBe(false);
            expect(mockRouter.push).not.toHaveBeenCalled();
        });
    });

    describe('Notification Processing', () => {
        it('should process valid notification successfully', async () => {
            const onNotificationReceived = jest.fn();
            const onNotificationProcessed = jest.fn();

            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    onNotificationReceived,
                    onNotificationProcessed,
                    enableToastNotifications: true,
                })
            );

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                title: 'Event Registration',
                message: 'You have registered for an event',
                priority: NotificationPriority.Normal,
            });

            const processingResult =
                await result.current.processNotification(notification);

            expect(processingResult.success).toBe(true);
            expect(processingResult.notificationId).toBe(notification.id);
            expect(processingResult.type).toBe(notification.type);
            expect(processingResult.toastShown).toBe(true);

            expect(onNotificationReceived).toHaveBeenCalledWith(notification);
            expect(onNotificationProcessed).toHaveBeenCalledWith(
                processingResult
            );
            expect(mockToast).toHaveBeenCalledWith({
                title: 'Event Registration',
                description: 'You have registered for an event',
                variant: 'default',
                action: undefined,
            });
        });

        it('should handle validation errors', async () => {
            const onValidationError = jest.fn();

            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableValidation: true,
                    onValidationError,
                })
            );

            // Create invalid notification (missing required fields)
            const invalidNotification = {
                id: 'test-123',
                type: NotificationType.EventRegistration,
                title: 'Test',
                message: 'Test message',
                timestamp: '2024-01-01T00:00:00Z',
                priority: NotificationPriority.Normal,
                data: {
                    eventId: '', // Empty eventId should fail validation
                    eventTitle: 'Test Event',
                    organizerName: 'Test Organizer',
                    eventDate: '2024-06-15T18:00:00Z',
                },
            };

            const processingResult =
                await result.current.processNotification(invalidNotification);

            expect(processingResult.success).toBe(false);
            expect(processingResult.error).toContain('Validation failed');
            expect(onValidationError).toHaveBeenCalled();
        });

        it('should process notification batch', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const notifications = [
                createTestNotificationMessage({
                    id: 'notif-1',
                    type: NotificationType.EventRegistration,
                }),
                createTestNotificationMessage({
                    id: 'notif-2',
                    type: NotificationType.PaymentCompleted,
                }),
                createTestNotificationMessage({
                    id: 'notif-3',
                    type: NotificationType.SystemMaintenance,
                }),
            ];

            const results =
                await result.current.processNotificationBatch(notifications);

            expect(results).toHaveLength(3);
            expect(results.every((r) => r.success)).toBe(true);
            expect(results[0].notificationId).toBe('notif-1');
            expect(results[1].notificationId).toBe('notif-2');
            expect(results[2].notificationId).toBe('notif-3');
        });

        it('should handle auto-navigation when enabled', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableAutoNavigation: true,
                })
            );

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventId: 'event-123',
                }),
            });

            const processingResult =
                await result.current.processNotification(notification);

            expect(processingResult.success).toBe(true);
            expect(processingResult.navigated).toBe(true);
            expect(mockRouter.push).toHaveBeenCalledWith(
                '/dashboard/events/event-123'
            );
        });

        it('should show toast with correct variant based on priority', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableToastNotifications: true,
                })
            );

            // Test high priority notification
            const highPriorityNotification = createTestNotificationMessage({
                priority: NotificationPriority.High,
                title: 'High Priority',
                message: 'This is important',
            });

            await result.current.processNotification(highPriorityNotification);

            expect(mockToast).toHaveBeenCalledWith({
                title: 'High Priority',
                description: 'This is important',
                variant: 'destructive',
                action: undefined,
            });

            // Test normal priority notification
            const normalPriorityNotification = createTestNotificationMessage({
                priority: NotificationPriority.Normal,
                title: 'Normal Priority',
                message: 'This is normal',
            });

            await result.current.processNotification(
                normalPriorityNotification
            );

            expect(mockToast).toHaveBeenCalledWith({
                title: 'Normal Priority',
                description: 'This is normal',
                variant: 'default',
                action: undefined,
            });
        });
    });

    describe('Custom Handler Registration', () => {
        it('should register and call event handlers', async () => {
            const eventHandler = jest.fn();
            const { result } = renderHook(() => useTypedNotificationHandler());

            // Register handler
            const unregister =
                result.current.registerEventHandler(eventHandler);

            // Process event notification
            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData(),
            });

            await result.current.processNotification(eventNotification);

            expect(eventHandler).toHaveBeenCalledWith(eventNotification);

            // Unregister handler
            unregister();

            // Process another notification - handler should not be called
            await result.current.processNotification(eventNotification);

            expect(eventHandler).toHaveBeenCalledTimes(1); // Still only called once
        });

        it('should register and call payment handlers', async () => {
            const paymentHandler = jest.fn();
            const { result } = renderHook(() => useTypedNotificationHandler());

            result.current.registerPaymentHandler(paymentHandler);

            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
                data: createTestPaymentNotificationData(),
            });

            await result.current.processNotification(paymentNotification);

            expect(paymentHandler).toHaveBeenCalledWith(paymentNotification);
        });

        it('should register and call financing handlers', async () => {
            const financingHandler = jest.fn();
            const { result } = renderHook(() => useTypedNotificationHandler());

            result.current.registerFinancingHandler(financingHandler);

            const financingNotification = createTestNotificationMessage({
                type: NotificationType.FinancingApplicationSubmitted,
                data: createTestFinancingNotificationData(),
            });

            await result.current.processNotification(financingNotification);

            expect(financingHandler).toHaveBeenCalledWith(
                financingNotification
            );
        });

        it('should register and call system handlers', async () => {
            const systemHandler = jest.fn();
            const { result } = renderHook(() => useTypedNotificationHandler());

            result.current.registerSystemHandler(systemHandler);

            const systemNotification = createTestNotificationMessage({
                type: NotificationType.SystemMaintenance,
                data: createTestSystemNotificationData(),
            });

            await result.current.processNotification(systemNotification);

            expect(systemHandler).toHaveBeenCalledWith(systemNotification);
        });

        it('should handle errors in custom handlers gracefully', async () => {
            const faultyHandler = jest
                .fn()
                .mockRejectedValue(new Error('Handler error'));
            const { result } = renderHook(() => useTypedNotificationHandler());

            result.current.registerEventHandler(faultyHandler);

            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData(),
            });

            // Should not throw error
            const processingResult =
                await result.current.processNotification(notification);

            expect(processingResult.success).toBe(true); // Processing should still succeed
            expect(faultyHandler).toHaveBeenCalled();
        });
    });

    describe('History Management', () => {
        it('should maintain notification history', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableHistory: true,
                    maxHistorySize: 10,
                })
            );

            const notification1 = createTestNotificationMessage({
                id: 'notif-1',
                type: NotificationType.EventRegistration,
            });

            const notification2 = createTestNotificationMessage({
                id: 'notif-2',
                type: NotificationType.PaymentCompleted,
            });

            await result.current.processNotification(notification1);
            await result.current.processNotification(notification2);

            expect(result.current.notificationHistory).toHaveLength(2);
            expect(result.current.notificationHistory[0].notification.id).toBe(
                'notif-2'
            ); // Most recent first
            expect(result.current.notificationHistory[1].notification.id).toBe(
                'notif-1'
            );
        });

        it('should limit history size', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableHistory: true,
                    maxHistorySize: 2,
                })
            );

            // Process 3 notifications
            for (let i = 1; i <= 3; i++) {
                const notification = createTestNotificationMessage({
                    id: `notif-${i}`,
                    type: NotificationType.EventRegistration,
                });
                await result.current.processNotification(notification);
            }

            expect(result.current.notificationHistory).toHaveLength(2);
            expect(result.current.notificationHistory[0].notification.id).toBe(
                'notif-3'
            );
            expect(result.current.notificationHistory[1].notification.id).toBe(
                'notif-2'
            );
        });

        it('should filter history by type', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableHistory: true,
                })
            );

            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
            });

            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
            });

            await result.current.processNotification(eventNotification);
            await result.current.processNotification(paymentNotification);

            const eventHistory = result.current.getHistoryByType(
                NotificationType.EventRegistration
            );
            const paymentHistory = result.current.getHistoryByType(
                NotificationType.PaymentCompleted
            );

            expect(eventHistory).toHaveLength(1);
            expect(paymentHistory).toHaveLength(1);
            expect(eventHistory[0].notification.type).toBe(
                NotificationType.EventRegistration
            );
            expect(paymentHistory[0].notification.type).toBe(
                NotificationType.PaymentCompleted
            );
        });

        it('should clear history', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableHistory: true,
                })
            );

            const notification = createTestNotificationMessage();
            await result.current.processNotification(notification);

            expect(result.current.notificationHistory).toHaveLength(1);

            act(() => {
                result.current.clearHistory();
            });

            expect(result.current.notificationHistory).toHaveLength(0);
        });

        it('should not maintain history when disabled', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableHistory: false,
                })
            );

            const notification = createTestNotificationMessage();
            await result.current.processNotification(notification);

            expect(result.current.notificationHistory).toHaveLength(0);
        });
    });

    describe('SignalR Integration', () => {
        it('should set up SignalR listeners when connected', () => {
            renderHook(() => useTypedNotificationHandler());

            // Should register listeners for all notification types
            expect(mockSignalR.on).toHaveBeenCalledTimes(
                Object.values(NotificationType).length + 1
            ); // +1 for generic listener

            // Check some specific listeners
            expect(mockSignalR.on).toHaveBeenCalledWith(
                'ReceiveEventRegistration',
                expect.any(Function)
            );
            expect(mockSignalR.on).toHaveBeenCalledWith(
                'ReceivePaymentCompleted',
                expect.any(Function)
            );
            expect(mockSignalR.on).toHaveBeenCalledWith(
                'ReceiveNotification',
                expect.any(Function)
            );
        });

        it('should not set up listeners when SignalR is not connected', () => {
            (useSignalRContext as jest.Mock).mockReturnValue({
                ...mockSignalR,
                isConnected: false,
            });

            renderHook(() => useTypedNotificationHandler());

            expect(mockSignalR.on).not.toHaveBeenCalled();
        });

        it('should clean up listeners on unmount', () => {
            const { unmount } = renderHook(() => useTypedNotificationHandler());

            unmount();

            // Should unregister all listeners
            expect(mockSignalR.off).toHaveBeenCalledTimes(
                Object.values(NotificationType).length + 1
            );
        });
    });

    describe('Batch Processing', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should process notifications in batches when enabled', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    batchOptions: {
                        enableBatching: true,
                        batchSize: 2,
                        batchDelay: 1000,
                    },
                })
            );

            // Simulate receiving notifications through SignalR
            const notification1 = createTestNotificationMessage({
                id: 'notif-1',
            });
            const notification2 = createTestNotificationMessage({
                id: 'notif-2',
            });

            // Get the handler that was registered with SignalR
            const handleNotification = mockSignalR.on.mock.calls.find(
                (call) => call[0] === 'ReceiveNotification'
            )?.[1];

            expect(handleNotification).toBeDefined();

            // Simulate receiving notifications
            act(() => {
                handleNotification(notification1);
                handleNotification(notification2);
            });

            // Should be in processing queue
            expect(result.current.processingQueue).toHaveLength(2);

            // Fast-forward time to trigger batch processing
            await act(async () => {
                jest.advanceTimersByTime(1000);
                await waitFor(() =>
                    expect(result.current.processingQueue).toHaveLength(0)
                );
            });

            // Queue should be empty after processing
            expect(result.current.processingQueue).toHaveLength(0);
        });

        it('should process immediately when batch size is reached', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    batchOptions: {
                        enableBatching: true,
                        batchSize: 2,
                        batchDelay: 5000, // Long delay
                    },
                })
            );

            const handleNotification = mockSignalR.on.mock.calls.find(
                (call) => call[0] === 'ReceiveNotification'
            )?.[1];

            const notification1 = createTestNotificationMessage({
                id: 'notif-1',
            });
            const notification2 = createTestNotificationMessage({
                id: 'notif-2',
            });

            act(() => {
                handleNotification(notification1);
                handleNotification(notification2);
            });

            // Should process immediately without waiting for delay
            await waitFor(() =>
                expect(result.current.processingQueue).toHaveLength(0)
            );
        });

        it('should process immediately when batching is disabled', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    batchOptions: {
                        enableBatching: false,
                    },
                })
            );

            const handleNotification = mockSignalR.on.mock.calls.find(
                (call) => call[0] === 'ReceiveNotification'
            )?.[1];

            const notification = createTestNotificationMessage();

            act(() => {
                handleNotification(notification);
            });

            // Should not be queued when batching is disabled
            expect(result.current.processingQueue).toHaveLength(0);
        });
    });
});

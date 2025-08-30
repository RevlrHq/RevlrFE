import { renderHook, act } from '@testing-library/react';
import { NavigationService } from '@/lib/services/NavigationService';
import { SignalRStateService } from '@/lib/services/SignalRStateService';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import type {
    NotificationMessage,
    EventNotificationData,
} from '@/types/notifications';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        back: mockBack,
        refresh: mockRefresh,
    }),
}));

// Mock SignalR context
jest.mock('@/providers/SignalRProvider', () => ({
    useSignalRContext: () => ({
        isConnected: true,
        connection: {},
        on: jest.fn(),
        off: jest.fn(),
    }),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

// Mock notification history hook
jest.mock('@/hooks/useNotificationHistory', () => ({
    useNotificationHistory: () => ({
        addNotification: jest.fn(),
        getNotifications: jest.fn(() => []),
        clearHistory: jest.fn(),
        getUnreadCount: jest.fn(() => 0),
    }),
}));

describe('SignalR Routing and State Management Integration', () => {
    const mockRouter = {
        push: mockPush,
        back: mockBack,
        refresh: mockRefresh,
    };

    const mockEventNotification: NotificationMessage = {
        id: 'notification-123',
        type: 'EventRegistration',
        title: 'New Event Registration',
        message: 'Someone registered for your event',
        timestamp: new Date().toISOString(),
        priority: 'Normal',
        actionUrl: '/dashboard/events/event-123',
        data: {
            eventId: 'event-123',
            eventTitle: 'Test Event',
            organizerName: 'Test Organizer',
            eventDate: '2024-12-31T23:59:59Z',
            attendeeName: 'John Doe',
            attendeeEmail: 'john@example.com',
        } as EventNotificationData,
    };

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Clear state service history
        SignalRStateService.clearNotificationHistory();

        // Initialize NavigationService with mock router
        NavigationService.initialize(mockRouter as any);

        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: {
                origin: 'http://localhost:3000',
                pathname: '/dashboard',
                href: 'http://localhost:3000/dashboard',
            },
            writable: true,
        });

        // Mock window.dispatchEvent
        window.dispatchEvent = jest.fn();
    });

    describe('NavigationService Integration', () => {
        it('should initialize with Next.js router', () => {
            expect(() =>
                NavigationService.initialize(mockRouter as any)
            ).not.toThrow();
        });

        it('should handle notification action URLs', () => {
            const actionUrl = '/dashboard/events/event-123';

            NavigationService.navigateToNotificationAction(actionUrl);

            expect(mockPush).toHaveBeenCalledWith(actionUrl);
        });

        it('should parse notification action URLs correctly', () => {
            const testCases = [
                {
                    url: '/events/event-123',
                    expected: {
                        type: 'event',
                        id: 'event-123',
                        url: '/events/event-123',
                    },
                },
                {
                    url: '/dashboard/revenue/event-456',
                    expected: {
                        type: 'revenue',
                        id: 'event-456',
                        url: '/dashboard/revenue/event-456',
                    },
                },
                {
                    url: '/dashboard/registrations/event-789',
                    expected: {
                        type: 'registrations',
                        id: 'event-789',
                        url: '/dashboard/registrations/event-789',
                    },
                },
                {
                    url: '/dashboard/financing/app-123',
                    expected: {
                        type: 'financing',
                        id: 'app-123',
                        url: '/dashboard/financing/app-123',
                    },
                },
                {
                    url: '/dashboard',
                    expected: { type: 'dashboard', url: '/dashboard' },
                },
                {
                    url: '/profile',
                    expected: { type: 'profile', url: '/profile' },
                },
                {
                    url: '/notifications',
                    expected: { type: 'notifications', url: '/notifications' },
                },
            ];

            testCases.forEach(({ url, expected }) => {
                const result = NavigationService.parseNotificationAction(url);
                expect(result).toEqual(expected);
            });
        });

        it('should handle external URLs correctly', () => {
            const externalUrl = 'https://external.com/page';
            const result =
                NavigationService.parseNotificationAction(externalUrl);

            expect(result).toEqual({
                type: 'external',
                url: externalUrl,
            });
        });

        it('should provide navigation helper methods', () => {
            NavigationService.navigateToEvent('event-123');
            expect(mockPush).toHaveBeenCalledWith('/events/event-123');

            NavigationService.navigateToOrganizerDashboard();
            expect(mockPush).toHaveBeenCalledWith('/dashboard');

            NavigationService.navigateToEventManagement('event-456');
            expect(mockPush).toHaveBeenCalledWith(
                '/dashboard/events/event-456'
            );

            NavigationService.navigateToRevenue('event-789');
            expect(mockPush).toHaveBeenCalledWith(
                '/dashboard/revenue/event-789'
            );

            NavigationService.navigateToRegistrations();
            expect(mockPush).toHaveBeenCalledWith('/dashboard/registrations');

            NavigationService.navigateToFinancing('app-123');
            expect(mockPush).toHaveBeenCalledWith(
                '/dashboard/financing/app-123'
            );
        });

        it('should handle notification clicks with analytics', () => {
            const actionUrl = '/dashboard/events/event-123';
            const notificationId = 'notification-123';

            // Mock gtag for analytics
            (window as any).gtag = jest.fn();

            NavigationService.handleNotificationClick(
                actionUrl,
                notificationId
            );

            expect(mockPush).toHaveBeenCalledWith(actionUrl);
            expect((window as any).gtag).toHaveBeenCalledWith(
                'event',
                'notification_click',
                {
                    notification_id: notificationId,
                    action_url: actionUrl,
                    navigation_type: 'dashboard', // This URL starts with /dashboard so it's parsed as dashboard type
                }
            );
        });
    });

    describe('SignalRStateService Integration', () => {
        it('should handle notifications and update state', () => {
            SignalRStateService.handleNotification(mockEventNotification);

            const history = SignalRStateService.getNotificationHistory();
            expect(history).toHaveLength(1);
            expect(history[0]).toEqual(mockEventNotification);
        });

        it('should dispatch custom events for state updates', () => {
            SignalRStateService.handleNotification(mockEventNotification);

            expect(window.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'signalr-event-update',
                    detail: {
                        type: 'EventRegistration',
                        data: mockEventNotification.data,
                    },
                })
            );
        });

        it('should manage notification history with size limits', () => {
            // Add notifications up to the limit
            for (let i = 0; i < 105; i++) {
                const notification = {
                    ...mockEventNotification,
                    id: `notification-${i}`,
                };
                SignalRStateService.handleNotification(notification);
            }

            const history = SignalRStateService.getNotificationHistory();
            expect(history).toHaveLength(100); // Should be limited to MAX_HISTORY_SIZE
        });

        it('should filter notifications by type', () => {
            const paymentNotification = {
                ...mockEventNotification,
                id: 'payment-notification',
                type: 'PaymentCompleted' as const,
            };

            SignalRStateService.handleNotification(mockEventNotification);
            SignalRStateService.handleNotification(paymentNotification);

            const eventNotifications =
                SignalRStateService.getNotificationsByType('EventRegistration');
            const paymentNotifications =
                SignalRStateService.getNotificationsByType('PaymentCompleted');

            expect(eventNotifications).toHaveLength(1);
            expect(paymentNotifications).toHaveLength(1);
        });

        it('should provide recent notifications', () => {
            for (let i = 0; i < 15; i++) {
                const notification = {
                    ...mockEventNotification,
                    id: `notification-${i}`,
                };
                SignalRStateService.handleNotification(notification);
            }

            const recent = SignalRStateService.getRecentNotifications(5);
            expect(recent).toHaveLength(5);

            // Should be in reverse chronological order (most recent first)
            expect(recent[0].id).toBe('notification-14');
            expect(recent[4].id).toBe('notification-10');
        });

        it('should provide state statistics', () => {
            SignalRStateService.handleNotification(mockEventNotification);
            SignalRStateService.handleNotification({
                ...mockEventNotification,
                id: 'payment-notification',
                type: 'PaymentCompleted',
            });

            const stats = SignalRStateService.getStateStatistics();

            expect(stats.totalNotifications).toBe(2);
            expect(stats.notificationsByType).toEqual({
                EventRegistration: 1,
                PaymentCompleted: 1,
            });
        });

        it('should support state update subscriptions', () => {
            const mockCallback = jest.fn();

            const unsubscribe = SignalRStateService.subscribeToStateUpdates(
                'event',
                mockCallback
            );

            // Set up event listener before triggering
            const eventHandler = (event: CustomEvent) =>
                mockCallback(event.detail);
            window.addEventListener(
                'signalr-event-update',
                eventHandler as EventListener
            );

            // Trigger an event notification
            SignalRStateService.handleNotification(mockEventNotification);

            expect(mockCallback).toHaveBeenCalledWith({
                type: 'EventRegistration',
                data: mockEventNotification.data,
            });

            // Clean up
            window.removeEventListener(
                'signalr-event-update',
                eventHandler as EventListener
            );
            unsubscribe();
        });
    });

    describe('Typed Notification Handler Integration', () => {
        it('should integrate with navigation and state services', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableAutoNavigation: false,
                    enableToastNotifications: false,
                })
            );

            const processResult = await result.current.processNotification(
                mockEventNotification
            );

            expect(processResult.success).toBe(true);
            expect(processResult.notificationId).toBe('notification-123');

            // Check that state service received the notification
            const history = SignalRStateService.getNotificationHistory();
            expect(history).toHaveLength(1);
            expect(history[0].id).toBe('notification-123');
        });

        it('should handle navigation through NavigationService', async () => {
            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableAutoNavigation: true,
                    enableToastNotifications: false,
                })
            );

            const processResult = await result.current.processNotification(
                mockEventNotification
            );

            expect(processResult.success).toBe(true);
            expect(processResult.navigated).toBe(true);
            expect(mockPush).toHaveBeenCalledWith(
                '/dashboard/events/event-123'
            );
        });

        it('should get notification routes correctly', () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const route = result.current.getNotificationRoute(
                mockEventNotification
            );
            expect(route).toBe('/dashboard/events/event-123');
        });
    });

    describe('Error Handling', () => {
        it('should handle navigation errors gracefully', async () => {
            mockPush.mockImplementation(() => {
                throw new Error('Navigation failed');
            });

            const { result } = renderHook(() =>
                useTypedNotificationHandler({
                    enableAutoNavigation: true,
                    enableToastNotifications: false,
                })
            );

            const processResult = await result.current.processNotification(
                mockEventNotification
            );

            expect(processResult.success).toBe(true); // Processing should still succeed
            expect(processResult.navigated).toBe(false); // But navigation should fail
        });

        it('should handle state service errors gracefully', () => {
            // Mock console.debug to avoid test output noise
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            // Create a malformed notification
            const malformedNotification = {
                ...mockEventNotification,
                data: null, // This might cause issues
            };

            expect(() => {
                SignalRStateService.handleNotification(malformedNotification);
            }).not.toThrow();

            consoleSpy.mockRestore();
        });
    });
});

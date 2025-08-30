import { NavigationService } from '@/lib/services/NavigationService';
import { SignalRStateService } from '@/lib/services/SignalRStateService';
import type {
    NotificationMessage,
    EventNotificationData,
} from '@/types/notifications';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();

const mockRouter = {
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
};

describe('SignalR Routing and State Management Integration - Simple', () => {
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
                    url: '/dashboard',
                    expected: { type: 'dashboard', url: '/dashboard' },
                },
            ];

            testCases.forEach(({ url, expected }) => {
                const result = NavigationService.parseNotificationAction(url);
                expect(result).toEqual(expected);
            });
        });

        it('should provide navigation helper methods', () => {
            NavigationService.navigateToEvent('event-123');
            expect(mockPush).toHaveBeenCalledWith('/events/event-123');

            NavigationService.navigateToOrganizerDashboard();
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
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
    });

    describe('Integration Services', () => {
        it('should integrate navigation and state services', () => {
            // Test direct integration
            SignalRStateService.handleNotification(mockEventNotification);

            // Check that state service received the notification
            const history = SignalRStateService.getNotificationHistory();
            expect(history).toHaveLength(1);
            expect(history[0].id).toBe('notification-123');

            // Test navigation
            const actionUrl = '/dashboard/events/event-123';
            NavigationService.handleNotificationClick(
                actionUrl,
                'notification-123'
            );

            expect(mockPush).toHaveBeenCalledWith(actionUrl);
        });

        it('should parse notification routes correctly', () => {
            const actionUrl = '/dashboard/events/event-123';
            const parsed = NavigationService.parseNotificationAction(actionUrl);

            expect(parsed).toEqual({
                type: 'dashboard',
                url: actionUrl,
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle navigation errors gracefully', () => {
            mockPush.mockImplementation(() => {
                throw new Error('Navigation failed');
            });

            // Should not throw when navigation fails
            expect(() => {
                NavigationService.navigateToNotificationAction(
                    '/dashboard/events/event-123'
                );
            }).not.toThrow();
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

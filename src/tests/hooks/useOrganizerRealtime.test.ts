import { renderHook, act } from '@testing-library/react';
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';
import { useSignalRContext } from '@/providers/SignalRProvider';
import { useNotificationGroups } from '@/hooks/useNotificationGroups';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useToast } from '@/hooks/use-toast';
import type {
    DashboardMetricUpdate,
    EventStatusUpdate,
    RegistrationUpdate,
    RevenueUpdate,
} from '@/hooks/useOrganizerRealtime';

// Mock dependencies
jest.mock('@/providers/SignalRProvider');
jest.mock('@/hooks/useNotificationGroups');
jest.mock('@/hooks/useTypedNotificationHandler');
jest.mock('@/hooks/use-toast');

const mockUseSignalRContext = useSignalRContext as jest.MockedFunction<
    typeof useSignalRContext
>;
const mockUseNotificationGroups = useNotificationGroups as jest.MockedFunction<
    typeof useNotificationGroups
>;
const mockUseTypedNotificationHandler =
    useTypedNotificationHandler as jest.MockedFunction<
        typeof useTypedNotificationHandler
    >;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('useOrganizerRealtime', () => {
    let mockConnection: {
        on: jest.Mock;
        off: jest.Mock;
        invoke: jest.Mock;
        onclose: jest.Mock;
        onreconnected: jest.Mock;
    };
    let mockToast: jest.Mock;

    beforeEach(() => {
        mockConnection = {
            on: jest.fn(),
            off: jest.fn(),
            invoke: jest.fn().mockResolvedValue(undefined),
            onclose: jest.fn(),
            onreconnected: jest.fn(),
        };

        mockToast = jest.fn();

        // Mock new SignalR context
        mockUseSignalRContext.mockReturnValue({
            connection: mockConnection,
            isConnected: true,
            isConnecting: false,
            isReconnecting: false,
            isDisconnected: false,
            connect: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
            reconnect: jest.fn().mockResolvedValue(undefined),
            error: null,
            connectionState: {
                state: 'Connected' as HubConnectionState,
                reconnectAttempts: 0,
                isHealthy: true,
            },
            checkHealth: jest.fn().mockResolvedValue(true),
            measureLatency: jest.fn().mockResolvedValue(50),
            on: jest.fn(),
            off: jest.fn(),
            invoke: jest.fn().mockResolvedValue(undefined),
            send: jest.fn().mockResolvedValue(undefined),
            isReady: true,
            lastError: null,
            clearError: jest.fn(),
        });

        // Mock notification groups
        mockUseNotificationGroups.mockReturnValue({
            groups: [],
            isJoining: false,
            joinError: null,
            joinGroup: jest
                .fn()
                .mockResolvedValue({ success: true, groupId: 'test-group' }),
            leaveGroup: jest.fn().mockResolvedValue(undefined),
            leaveAllGroups: jest.fn().mockResolvedValue(undefined),
            rejoinGroups: jest.fn().mockResolvedValue(undefined),
        });

        // Mock typed notification handler
        mockUseTypedNotificationHandler.mockReturnValue({
            notifications: [],
            unreadCount: 0,
            isProcessing: false,
            processingError: null,
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
            dismissNotification: jest.fn(),
            clearAllNotifications: jest.fn(),
            clearProcessingError: jest.fn(),
        });

        mockUseToast.mockReturnValue({
            toast: mockToast,
            dismiss: jest.fn(),
            toasts: [],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useOrganizerRealtime());

            expect(result.current.isConnected).toBe(true);
            expect(result.current.connectionError).toBe(null);
            expect(result.current.dashboardUpdates).toBe(null);
            expect(result.current.eventStatusUpdates).toEqual([]);
            expect(result.current.registrationUpdates).toEqual([]);
            expect(result.current.revenueUpdates).toEqual([]);
            expect(result.current.notifications).toEqual([]);
            expect(result.current.unreadCount).toBe(0);
        });

        it('should setup SignalR event handlers when connected', () => {
            renderHook(() =>
                useOrganizerRealtime({ organizerId: 'test-org-id' })
            );

            expect(mockConnection.on).toHaveBeenCalledWith(
                'OrganizerDashboardUpdate',
                expect.any(Function)
            );
            expect(mockConnection.on).toHaveBeenCalledWith(
                'OrganizerEventStatusChanged',
                expect.any(Function)
            );
            expect(mockConnection.on).toHaveBeenCalledWith(
                'OrganizerNewRegistration',
                expect.any(Function)
            );
            expect(mockConnection.on).toHaveBeenCalledWith(
                'OrganizerRevenueUpdate',
                expect.any(Function)
            );
            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'JoinOrganizerGroup',
                'test-org-id'
            );
        });

        it('should not join organizer group when organizerId is not provided', () => {
            renderHook(() => useOrganizerRealtime());

            expect(mockConnection.invoke).not.toHaveBeenCalledWith(
                'JoinOrganizerGroup',
                expect.any(String)
            );
        });
    });

    describe('dashboard updates', () => {
        it('should handle dashboard metric updates', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            const dashboardUpdate: DashboardMetricUpdate = {
                totalEvents: 10,
                activeEvents: 5,
                totalRevenue: 1000,
                totalAttendees: 100,
            };

            // Get the handler that was registered
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            expect(dashboardHandler).toBeDefined();

            act(() => {
                dashboardHandler(dashboardUpdate);
            });

            expect(result.current.dashboardUpdates).toEqual(dashboardUpdate);
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('system');
            expect(result.current.notifications[0].title).toBe(
                'Dashboard Updated'
            );
        });

        it('should notify external callbacks on dashboard updates', async () => {
            const { result } = renderHook(() => useOrganizerRealtime());
            const mockCallback = jest.fn();

            act(() => {
                result.current.onDashboardUpdate(mockCallback);
            });

            const dashboardUpdate: DashboardMetricUpdate = {
                totalRevenue: 2000,
            };

            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler(dashboardUpdate);
            });

            expect(mockCallback).toHaveBeenCalledWith(dashboardUpdate);
        });
    });

    describe('event status updates', () => {
        it('should handle event status changes', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            const statusUpdate: EventStatusUpdate = {
                eventId: 'event-1',
                eventTitle: 'Test Event',
                oldStatus: 'Draft',
                newStatus: 'Published',
                timestamp: new Date().toISOString(),
            };

            const statusHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerEventStatusChanged'
            )?.[1];

            act(() => {
                statusHandler(statusUpdate);
            });

            expect(result.current.eventStatusUpdates).toHaveLength(1);
            expect(result.current.eventStatusUpdates[0]).toEqual(statusUpdate);
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('event_status');
            expect(result.current.notifications[0].priority).toBe('high'); // Published events are high priority
        });

        it('should show toast for high priority event status changes', async () => {
            renderHook(() => useOrganizerRealtime({ enableToasts: true }));

            const statusUpdate: EventStatusUpdate = {
                eventId: 'event-1',
                eventTitle: 'Test Event',
                oldStatus: 'Draft',
                newStatus: 'Published',
                timestamp: new Date().toISOString(),
            };

            const statusHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerEventStatusChanged'
            )?.[1];

            act(() => {
                statusHandler(statusUpdate);
            });

            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Event Status Changed',
                    description: expect.stringContaining('Test Event'),
                    variant: 'default',
                })
            );
        });
    });

    describe('registration updates', () => {
        it('should handle new registrations', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            const registrationUpdate: RegistrationUpdate = {
                eventId: 'event-1',
                eventTitle: 'Test Event',
                registration: {
                    registrationId: 'reg-1',
                    eventId: 'event-1',
                    attendeeFirstName: 'John',
                    attendeeLastName: 'Doe',
                    attendeeEmail: 'john@example.com',
                    amountPaid: 50,
                },
                timestamp: new Date().toISOString(),
            };

            const registrationHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerNewRegistration'
            )?.[1];

            act(() => {
                registrationHandler(registrationUpdate);
            });

            expect(result.current.registrationUpdates).toHaveLength(1);
            expect(result.current.registrationUpdates[0]).toEqual(
                registrationUpdate
            );
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('registration');
            expect(mockToast).toHaveBeenCalled(); // Should show toast for registrations
        });

        it('should limit registration updates to 100 items', async () => {
            const { result } = renderHook(() => useOrganizerRealtime());

            const registrationHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerNewRegistration'
            )?.[1];

            // Add 102 registration updates
            act(() => {
                for (let i = 0; i < 102; i++) {
                    registrationHandler({
                        eventId: `event-${i}`,
                        eventTitle: `Event ${i}`,
                        registration: { registrationId: `reg-${i}` },
                        timestamp: new Date().toISOString(),
                    });
                }
            });

            expect(result.current.registrationUpdates).toHaveLength(100);
            expect(result.current.registrationUpdates[0].eventId).toBe(
                'event-101'
            ); // Most recent first
        });
    });

    describe('revenue updates', () => {
        it('should handle revenue updates', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            const revenueUpdate: RevenueUpdate = {
                eventId: 'event-1',
                eventTitle: 'Test Event',
                amount: 150,
                totalRevenue: 1500,
                timestamp: new Date().toISOString(),
            };

            const revenueHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerRevenueUpdate'
            )?.[1];

            act(() => {
                revenueHandler(revenueUpdate);
            });

            expect(result.current.revenueUpdates).toHaveLength(1);
            expect(result.current.revenueUpdates[0]).toEqual(revenueUpdate);
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('revenue');
        });

        it('should show toast for significant revenue amounts', async () => {
            renderHook(() => useOrganizerRealtime({ enableToasts: true }));

            const revenueUpdate: RevenueUpdate = {
                amount: 150, // >= 100, should show toast
                totalRevenue: 1500,
                timestamp: new Date().toISOString(),
            };

            const revenueHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerRevenueUpdate'
            )?.[1];

            act(() => {
                revenueHandler(revenueUpdate);
            });

            expect(mockToast).toHaveBeenCalled();
        });

        it('should not show toast for small revenue amounts', async () => {
            renderHook(() => useOrganizerRealtime({ enableToasts: true }));

            const revenueUpdate: RevenueUpdate = {
                amount: 50, // < 100, should not show toast
                totalRevenue: 1500,
                timestamp: new Date().toISOString(),
            };

            const revenueHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerRevenueUpdate'
            )?.[1];

            act(() => {
                revenueHandler(revenueUpdate);
            });

            expect(mockToast).not.toHaveBeenCalled();
        });
    });

    describe('notification management', () => {
        it('should mark notifications as read', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            // Add a notification
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler({ totalEvents: 5 });
            });

            expect(result.current.notifications[0].read).toBe(false);
            expect(result.current.unreadCount).toBe(1);

            act(() => {
                result.current.markNotificationAsRead(
                    result.current.notifications[0].id
                );
            });

            expect(result.current.notifications[0].read).toBe(true);
            expect(result.current.unreadCount).toBe(0);
        });

        it('should mark all notifications as read', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            // Add multiple notifications
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler({ totalEvents: 5 });
                dashboardHandler({ totalEvents: 6 });
            });

            expect(result.current.unreadCount).toBe(2);

            act(() => {
                result.current.markAllAsRead();
            });

            expect(result.current.unreadCount).toBe(0);
            expect(result.current.notifications.every((n) => n.read)).toBe(
                true
            );
        });

        it('should dismiss notifications', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            // Add a notification
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler({ totalEvents: 5 });
            });

            expect(result.current.notifications).toHaveLength(1);

            act(() => {
                result.current.dismissNotification(
                    result.current.notifications[0].id
                );
            });

            expect(result.current.notifications).toHaveLength(0);
        });

        it('should clear all notifications', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            // Add multiple notifications
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler({ totalEvents: 5 });
                dashboardHandler({ totalEvents: 6 });
            });

            expect(result.current.notifications).toHaveLength(2);

            act(() => {
                result.current.clearAllNotifications();
            });

            expect(result.current.notifications).toHaveLength(0);
        });
    });

    describe('connection handling', () => {
        it('should handle connection errors', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            const onCloseHandler = mockConnection.onclose.mock.calls[0]?.[0];

            act(() => {
                onCloseHandler(new Error('Connection lost'));
            });

            expect(result.current.connectionError).toBe('Connection lost');
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('system');
            expect(result.current.notifications[0].priority).toBe('high');
        });

        it('should handle reconnection', async () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: true })
            );

            // First disconnect
            const onCloseHandler = mockConnection.onclose.mock.calls[0]?.[0];
            act(() => {
                onCloseHandler(new Error('Connection lost'));
            });

            expect(result.current.connectionError).toBe('Connection lost');

            // Then reconnect
            const onReconnectedHandler =
                mockConnection.onreconnected.mock.calls[0]?.[0];
            act(() => {
                onReconnectedHandler();
            });

            expect(result.current.connectionError).toBe(null);
            expect(
                result.current.notifications.some(
                    (n) => n.title === 'Connection Restored'
                )
            ).toBe(true);
        });

        it('should provide reconnect function', async () => {
            const mockReconnect = jest.fn().mockResolvedValue(undefined);
            mockUseSignalRContext.mockReturnValue({
                connection: mockConnection,
                isConnected: false,
                isConnecting: false,
                isReconnecting: false,
                isDisconnected: true,
                connect: jest.fn().mockResolvedValue(undefined),
                disconnect: jest.fn().mockResolvedValue(undefined),
                reconnect: mockReconnect,
                error: null,
                connectionState: {
                    state: 'Disconnected' as HubConnectionState,
                    reconnectAttempts: 0,
                    isHealthy: false,
                },
                checkHealth: jest.fn().mockResolvedValue(false),
                measureLatency: jest.fn().mockResolvedValue(0),
                on: jest.fn(),
                off: jest.fn(),
                invoke: jest.fn().mockResolvedValue(undefined),
                send: jest.fn().mockResolvedValue(undefined),
                isReady: false,
                lastError: null,
                clearError: jest.fn(),
            });

            const { result } = renderHook(() => useOrganizerRealtime());

            await act(async () => {
                await result.current.reconnect();
            });

            expect(mockReconnect).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should cleanup event handlers on unmount', () => {
            const { unmount } = renderHook(() =>
                useOrganizerRealtime({ organizerId: 'test-org-id' })
            );

            unmount();

            expect(mockConnection.off).toHaveBeenCalledWith(
                'OrganizerDashboardUpdate',
                expect.any(Function)
            );
            expect(mockConnection.off).toHaveBeenCalledWith(
                'OrganizerEventStatusChanged',
                expect.any(Function)
            );
            expect(mockConnection.off).toHaveBeenCalledWith(
                'OrganizerNewRegistration',
                expect.any(Function)
            );
            expect(mockConnection.off).toHaveBeenCalledWith(
                'OrganizerRevenueUpdate',
                expect.any(Function)
            );
            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'LeaveOrganizerGroup',
                'test-org-id'
            );
        });
    });

    describe('options', () => {
        it('should respect enableNotifications option', () => {
            const { result } = renderHook(() =>
                useOrganizerRealtime({ enableNotifications: false })
            );

            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler({ totalEvents: 5 });
            });

            expect(result.current.notifications).toHaveLength(0);
        });

        it('should respect enableToasts option', () => {
            renderHook(() => useOrganizerRealtime({ enableToasts: false }));

            const registrationHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerNewRegistration'
            )?.[1];

            act(() => {
                registrationHandler({
                    eventId: 'event-1',
                    eventTitle: 'Test Event',
                    registration: {
                        attendeeFirstName: 'John',
                        attendeeLastName: 'Doe',
                    },
                    timestamp: new Date().toISOString(),
                });
            });

            expect(mockToast).not.toHaveBeenCalled();
        });
    });
});

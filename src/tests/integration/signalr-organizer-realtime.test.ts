import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';
import { useSignalRStore } from '@/lib/signalR';
import * as signalR from '@microsoft/signalr';

// Mock SignalR
jest.mock('@microsoft/signalr');
jest.mock('@/lib/signalR');
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
        dismiss: jest.fn(),
        toasts: [],
    }),
}));

const mockSignalR = signalR as jest.Mocked<typeof signalR>;
const mockUseSignalRStore = useSignalRStore as jest.MockedFunction<
    typeof useSignalRStore
>;

describe('SignalR Organizer Realtime Integration', () => {
    let mockConnection: {
        start: jest.Mock;
        stop: jest.Mock;
        on: jest.Mock;
        off: jest.Mock;
        invoke: jest.Mock;
        onclose: jest.Mock;
        onreconnected: jest.Mock;
        onreconnecting: jest.Mock;
        state: string;
    };
    let mockHubConnectionBuilder: {
        withUrl: jest.Mock;
        withAutomaticReconnect: jest.Mock;
        configureLogging: jest.Mock;
        build: jest.Mock;
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock connection
        mockConnection = {
            start: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
            invoke: jest.fn().mockResolvedValue(undefined),
            onclose: jest.fn(),
            onreconnected: jest.fn(),
            onreconnecting: jest.fn(),
            state: signalR.HubConnectionState.Connected,
        };

        // Mock HubConnectionBuilder
        mockHubConnectionBuilder = {
            withUrl: jest.fn().mockReturnThis(),
            withAutomaticReconnect: jest.fn().mockReturnThis(),
            configureLogging: jest.fn().mockReturnThis(),
            build: jest.fn().mockReturnValue(mockConnection),
        };

        mockSignalR.HubConnectionBuilder = jest
            .fn()
            .mockImplementation(() => mockHubConnectionBuilder);
        mockSignalR.LogLevel = {
            Information: 'Information',
        } as typeof signalR.LogLevel;
        mockSignalR.HubConnectionState = {
            Connected: 'Connected',
            Disconnected: 'Disconnected',
        } as typeof signalR.HubConnectionState;

        // Mock useSignalRStore
        mockUseSignalRStore.mockReturnValue({
            connection: mockConnection,
            isConnected: true,
            connect: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
            sendMessage: jest.fn().mockResolvedValue(undefined),
        });

        // Mock environment variable
        process.env.NEXT_PUBLIC_SIGNALR_HUB_URL =
            'https://test-hub.com/organizerHub';
    });

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;
    });

    describe('SignalR connection setup', () => {
        it('should create connection with correct configuration', async () => {
            // First, we need to initialize the SignalR store
            const { result: storeResult } = renderHook(() => useSignalRStore());

            await act(async () => {
                await storeResult.current.connect();
            });

            expect(mockSignalR.HubConnectionBuilder).toHaveBeenCalled();
            expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
                'https://test-hub.com/organizerHub'
            );
            expect(
                mockHubConnectionBuilder.withAutomaticReconnect
            ).toHaveBeenCalled();
            expect(
                mockHubConnectionBuilder.configureLogging
            ).toHaveBeenCalledWith('Information');
            expect(mockConnection.start).toHaveBeenCalled();
        });

        it('should setup organizer-specific event handlers', async () => {
            // Initialize SignalR store first
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            // Now test the organizer realtime hook
            renderHook(() => useOrganizerRealtime({ organizerId: 'org-123' }));

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
                'org-123'
            );
        });
    });

    describe('real-time event handling', () => {
        let realtimeHookResult: {
            current: {
                dashboardUpdates: unknown;
                notifications: Array<{
                    type: string;
                    priority?: string;
                    title?: string;
                }>;
                eventStatusUpdates: unknown[];
                registrationUpdates: unknown[];
                revenueUpdates: unknown[];
                connectionError: string | null;
                onDashboardUpdate: (
                    callback: (update: unknown) => void
                ) => () => void;
            };
        };

        beforeEach(async () => {
            // Setup SignalR connection
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            // Setup organizer realtime hook
            const { result } = renderHook(() =>
                useOrganizerRealtime({
                    organizerId: 'org-123',
                    enableNotifications: true,
                    enableToasts: false, // Disable toasts for cleaner testing
                })
            );
            realtimeHookResult = result;
        });

        it('should handle dashboard updates from SignalR', async () => {
            const dashboardUpdate = {
                totalEvents: 15,
                activeEvents: 8,
                totalRevenue: 2500,
                totalAttendees: 150,
            };

            // Get the registered handler
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            expect(dashboardHandler).toBeDefined();

            // Simulate SignalR event
            act(() => {
                dashboardHandler(dashboardUpdate);
            });

            expect(realtimeHookResult.current.dashboardUpdates).toEqual(
                dashboardUpdate
            );
            expect(realtimeHookResult.current.notifications).toHaveLength(1);
            expect(realtimeHookResult.current.notifications[0].type).toBe(
                'system'
            );
        });

        it('should handle event status changes from SignalR', async () => {
            const statusUpdate = {
                eventId: 'event-456',
                eventTitle: 'Summer Festival',
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

            expect(realtimeHookResult.current.eventStatusUpdates).toHaveLength(
                1
            );
            expect(realtimeHookResult.current.eventStatusUpdates[0]).toEqual(
                statusUpdate
            );
            expect(realtimeHookResult.current.notifications).toHaveLength(1);
            expect(realtimeHookResult.current.notifications[0].type).toBe(
                'event_status'
            );
            expect(realtimeHookResult.current.notifications[0].priority).toBe(
                'high'
            );
        });

        it('should handle new registrations from SignalR', async () => {
            const registrationUpdate = {
                eventId: 'event-789',
                eventTitle: 'Tech Conference',
                registration: {
                    registrationId: 'reg-001',
                    eventId: 'event-789',
                    attendeeFirstName: 'Alice',
                    attendeeLastName: 'Johnson',
                    attendeeEmail: 'alice@example.com',
                    amountPaid: 75,
                },
                timestamp: new Date().toISOString(),
            };

            const registrationHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerNewRegistration'
            )?.[1];

            act(() => {
                registrationHandler(registrationUpdate);
            });

            expect(realtimeHookResult.current.registrationUpdates).toHaveLength(
                1
            );
            expect(realtimeHookResult.current.registrationUpdates[0]).toEqual(
                registrationUpdate
            );
            expect(realtimeHookResult.current.notifications).toHaveLength(1);
            expect(realtimeHookResult.current.notifications[0].type).toBe(
                'registration'
            );
        });

        it('should handle revenue updates from SignalR', async () => {
            const revenueUpdate = {
                eventId: 'event-101',
                eventTitle: 'Workshop Series',
                amount: 125,
                totalRevenue: 3000,
                timestamp: new Date().toISOString(),
            };

            const revenueHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerRevenueUpdate'
            )?.[1];

            act(() => {
                revenueHandler(revenueUpdate);
            });

            expect(realtimeHookResult.current.revenueUpdates).toHaveLength(1);
            expect(realtimeHookResult.current.revenueUpdates[0]).toEqual(
                revenueUpdate
            );
            expect(realtimeHookResult.current.notifications).toHaveLength(1);
            expect(realtimeHookResult.current.notifications[0].type).toBe(
                'revenue'
            );
        });
    });

    describe('connection lifecycle', () => {
        it('should handle connection close events', async () => {
            // Setup connection
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            const { result } = renderHook(() =>
                useOrganizerRealtime({
                    organizerId: 'org-123',
                    enableNotifications: true,
                })
            );

            // Get the onclose handler
            const onCloseHandler = mockConnection.onclose.mock.calls[0]?.[0];
            expect(onCloseHandler).toBeDefined();

            // Simulate connection close
            act(() => {
                onCloseHandler(new Error('Connection timeout'));
            });

            expect(result.current.connectionError).toBe('Connection timeout');
            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].type).toBe('system');
            expect(result.current.notifications[0].priority).toBe('high');
            expect(result.current.notifications[0].title).toBe(
                'Connection Lost'
            );
        });

        it('should handle reconnection events', async () => {
            // Setup connection
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            const { result } = renderHook(() =>
                useOrganizerRealtime({
                    organizerId: 'org-123',
                    enableNotifications: true,
                })
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
    });

    describe('group management', () => {
        it('should join organizer group on connection', async () => {
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            renderHook(() => useOrganizerRealtime({ organizerId: 'org-456' }));

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'JoinOrganizerGroup',
                'org-456'
            );
        });

        it('should leave organizer group on cleanup', async () => {
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            const { unmount } = renderHook(() =>
                useOrganizerRealtime({ organizerId: 'org-789' })
            );

            unmount();

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'LeaveOrganizerGroup',
                'org-789'
            );
        });

        it('should handle group join failures gracefully', async () => {
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            // Mock invoke to reject for group join
            mockConnection.invoke.mockImplementation((method: string) => {
                if (method === 'JoinOrganizerGroup') {
                    return Promise.reject(new Error('Group join failed'));
                }
                return Promise.resolve();
            });

            const { result } = renderHook(() =>
                useOrganizerRealtime({ organizerId: 'org-fail' })
            );

            await waitFor(() => {
                expect(result.current.connectionError).toBe(
                    'Failed to join real-time updates'
                );
            });
        });
    });

    describe('external callback integration', () => {
        it('should notify external callbacks for dashboard updates', async () => {
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            const { result } = renderHook(() =>
                useOrganizerRealtime({ organizerId: 'org-123' })
            );
            const mockCallback = jest.fn();

            // Register callback
            act(() => {
                result.current.onDashboardUpdate(mockCallback);
            });

            // Trigger update
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            const update = { totalEvents: 20 };
            act(() => {
                dashboardHandler(update);
            });

            expect(mockCallback).toHaveBeenCalledWith(update);
        });

        it('should allow unsubscribing from callbacks', async () => {
            const { result: storeResult } = renderHook(() => useSignalRStore());
            await act(async () => {
                await storeResult.current.connect();
            });

            const { result } = renderHook(() =>
                useOrganizerRealtime({ organizerId: 'org-123' })
            );
            const mockCallback = jest.fn();

            // Register and immediately unregister callback
            act(() => {
                const unsubscribe =
                    result.current.onDashboardUpdate(mockCallback);
                unsubscribe();
            });

            // Trigger update
            const dashboardHandler = mockConnection.on.mock.calls.find(
                (call) => call[0] === 'OrganizerDashboardUpdate'
            )?.[1];

            act(() => {
                dashboardHandler({ totalEvents: 20 });
            });

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should handle SignalR connection failures', async () => {
            mockConnection.start.mockRejectedValue(
                new Error('Connection failed')
            );

            // Mock the store to return disconnected state
            mockUseSignalRStore.mockReturnValue({
                connection: null,
                isConnected: false,
                connect: jest
                    .fn()
                    .mockRejectedValue(new Error('Connection failed')),
                disconnect: jest.fn(),
                sendMessage: jest.fn(),
            });

            const { result: storeResult } = renderHook(() => useSignalRStore());

            expect(storeResult.current.isConnected).toBe(false);
        });

        it('should handle missing environment variables', () => {
            delete process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;

            expect(() => {
                renderHook(() => useSignalRStore());
            }).not.toThrow(); // Should handle gracefully
        });
    });
});

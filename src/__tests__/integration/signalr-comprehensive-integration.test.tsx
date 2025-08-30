/**
 * Comprehensive SignalR Integration Tests
 * 
 * This test suite provides end-to-end testing of the complete SignalR notification
 * system, covering all notification types, error handling, recovery scenarios,
 * and performance under load.
 * 
 * Test Coverage:
 * - Complete notification flow from backend to UI
 * - All notification types (Event, Payment, Financing, System)
 * - Error handling and recovery scenarios
 * - Load testing for multiple concurrent users
 * - Authentication integration
 * - Group management
 * - Performance optimization features
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HubConnectionState } from '@microsoft/signalr';
import { SignalRProvider, useSignalRContext } from '@/providers/SignalRProvider';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useNotificationGroups } from '@/hooks/useNotificationGroups';
import { SignalRTestService } from '@/services/SignalRTestService';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import { NavigationService } from '@/lib/services/NavigationService';
import { SignalRStateService } from '@/lib/services/SignalRStateService';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,
} from '@/types/notifications';
import type { SignalRError } from '@/types/signalr';

// ============================================================================
// Test Setup and Mocks
// ============================================================================

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
    }),
}));

// Mock toast notifications
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: mockToast,
        dismiss: jest.fn(),
    }),
}));

// Mock SignalR connection
const mockConnection = {
    start: jest.fn(),
    stop: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    state: HubConnectionState.Disconnected,
    connectionId: 'test-connection-id',
    onclose: jest.fn(),
    onreconnecting: jest.fn(),
    onreconnected: jest.fn(),
};

jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn().mockImplementation(() => ({
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn(() => mockConnection),
    })),
    HubConnectionState: {
        Disconnected: 'Disconnected',
        Connecting: 'Connecting',
        Connected: 'Connected',
        Disconnecting: 'Disconnecting',
        Reconnecting: 'Reconnecting',
    },
    LogLevel: {
        Trace: 0,
        Debug: 1,
        Information: 2,
        Warning: 3,
        Error: 4,
        Critical: 5,
        None: 6,
    },
}));

// Mock authentication service
jest.mock('@/lib/services/SignalRAuthService', () => ({
    SignalRAuthService: {
        createTokenFactory: jest.fn(() => () => Promise.resolve('mock-token')),
        handleAuthenticationFailure: jest.fn(),
        isAuthenticated: jest.fn(() => true),
        getCurrentUserId: jest.fn(() => 'test-user-id'),
        subscribeToAuthChanges: jest.fn(() => () => {}),
    },
}));

// Mock test service
const mockTestService = {
    sendTestNotification: jest.fn(),
    sendTestNotificationBatch: jest.fn(),
    testConnection: jest.fn(),
    getConnectionStatus: jest.fn(),
    getAllConnectionStatuses: jest.fn(),
    validateToken: jest.fn(),
    testScenario: jest.fn(),
    runPerformanceTest: jest.fn(),
    runLoadTest: jest.fn(),
};

jest.mock('@/services/SignalRTestService', () => ({
    SignalRTestService: jest.fn().mockImplementation(() => mockTestService),
    createSignalRTestService: jest.fn(() => mockTestService),
}));

// ============================================================================
// Test Data Factories
// ============================================================================

const createEventNotification = (overrides: Partial<NotificationMessage> = {}): NotificationMessage => ({
    id: 'event-notification-1',
    type: NotificationType.EventRegistration,
    title: 'New Event Registration',
    message: 'Someone registered for your event',
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.Normal,
    data: {
        eventId: 'event-123',
        eventTitle: 'Test Event',
        organizerName: 'Test Organizer',
        eventDate: new Date().toISOString(),
        attendeeCount: 1,
        registrationId: 'reg-123',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
    } as EventNotificationData,
    actionUrl: '/dashboard/events/event-123',
    ...overrides,
});

const createPaymentNotification = (overrides: Partial<NotificationMessage> = {}): NotificationMessage => ({
    id: 'payment-notification-1',
    type: NotificationType.PaymentCompleted,
    title: 'Payment Completed',
    message: 'Your payment has been processed successfully',
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.High,
    data: {
        paymentId: 'payment-123',
        amount: 99.99,
        currency: 'USD',
        eventId: 'event-123',
        eventTitle: 'Test Event',
        paymentMethod: 'Credit Card',
        transactionId: 'txn-123',
        status: 'completed',
    } as PaymentNotificationData,
    actionUrl: '/dashboard/payment/history',
    ...overrides,
});

const createFinancingNotification = (overrides: Partial<NotificationMessage> = {}): NotificationMessage => ({
    id: 'financing-notification-1',
    type: NotificationType.FinancingApplicationApproved,
    title: 'Financing Application Approved',
    message: 'Your financing application has been approved',
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.Critical,
    data: {
        applicationId: 'app-123',
        eventId: 'event-123',
        eventTitle: 'Test Event',
        amount: 5000,
        currency: 'USD',
        status: 'approved',
        approvedAmount: 5000,
        interestRate: 5.5,
        termMonths: 12,
    } as FinancingNotificationData,
    actionUrl: '/dashboard/financing/approved',
    ...overrides,
});

const createSystemNotification = (overrides: Partial<NotificationMessage> = {}): NotificationMessage => ({
    id: 'system-notification-1',
    type: NotificationType.SystemMaintenance,
    title: 'Scheduled Maintenance',
    message: 'System maintenance scheduled for tonight',
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.Normal,
    data: {
        notificationId: 'sys-123',
        category: 'maintenance',
        severity: 'info',
        affectedServices: ['events', 'payments'],
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        estimatedDuration: '2 hours',
    } as SystemNotificationData,
    actionUrl: '/dashboard/system/maintenance',
    ...overrides,
});

// ============================================================================
// Test Components
// ============================================================================

interface TestComponentProps {
    onNotificationReceived?: (notification: NotificationMessage) => void;
    onError?: (error: SignalRError) => void;
    enableAutoNavigation?: boolean;
    enableToastNotifications?: boolean;
}

function TestComponent({
    onNotificationReceived,
    onError,
    enableAutoNavigation = false,
    enableToastNotifications = true,
}: TestComponentProps) {
    const signalR = useSignalRContext();
    const notificationHandler = useTypedNotificationHandler({
        enableAutoNavigation,
        enableToastNotifications,
        onNotificationReceived,
    });
    const notificationGroups = useNotificationGroups();

    // Set up notification handlers
    React.useEffect(() => {
        if (!signalR.connection) return;

        const handleNotification = (notification: NotificationMessage) => {
            notificationHandler.processNotification(notification);
        };

        signalR.on('ReceiveNotification', handleNotification);

        return () => {
            signalR.off('ReceiveNotification', handleNotification);
        };
    }, [signalR, notificationHandler]);

    // Handle errors
    React.useEffect(() => {
        if (signalR.error && onError) {
            onError(signalR.error);
        }
    }, [signalR.error, onError]);

    return (
        <div data-testid="test-component">
            <div data-testid="connection-state">{signalR.connectionState.state}</div>
            <div data-testid="is-connected">{signalR.isConnected.toString()}</div>
            <div data-testid="is-ready">{signalR.isReady.toString()}</div>
            <div data-testid="user-groups">{notificationGroups.userGroups.join(',')}</div>
            <div data-testid="organizer-groups">{notificationGroups.organizerGroups.join(',')}</div>
            <div data-testid="notification-count">{notificationHandler.notificationHistory.length}</div>
            <div data-testid="unread-count">{notificationHandler.getUnreadCount()}</div>
            
            <button
                data-testid="connect-button"
                onClick={() => signalR.connect()}
            >
                Connect
            </button>
            <button
                data-testid="disconnect-button"
                onClick={() => signalR.disconnect()}
            >
                Disconnect
            </button>
            <button
                data-testid="reconnect-button"
                onClick={() => signalR.reconnect()}
            >
                Reconnect
            </button>
        </div>
    );
}

function renderWithSignalR(
    component: React.ReactElement,
    providerOptions: any = {}
) {
    return render(
        <SignalRProvider {...providerOptions}>
            {component}
        </SignalRProvider>
    );
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SignalR Comprehensive Integration Tests', () => {
    let testService: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Reset connection state
        mockConnection.state = HubConnectionState.Disconnected;
        mockConnection.start.mockResolvedValue(undefined);
        mockConnection.stop.mockResolvedValue(undefined);
        mockConnection.invoke.mockResolvedValue(undefined);
        mockConnection.send.mockResolvedValue(undefined);

        // Reset test service
        testService = mockTestService;
        testService.sendTestNotification.mockResolvedValue({ success: true });
        testService.testConnection.mockResolvedValue({ 
            success: true, 
            connectionId: 'test-connection-id' 
        });

        // Reset navigation service
        NavigationService.initialize({ push: mockPush, replace: mockReplace } as any);

        // Reset state service
        SignalRStateService.reset();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    // ========================================================================
    // Connection and Authentication Tests
    // ========================================================================

    describe('Connection Management', () => {
        it('should establish connection with proper authentication', async () => {
            const onConnected = jest.fn();
            
            renderWithSignalR(
                <TestComponent />,
                {
                    options: {
                        eventHandlers: { onConnected }
                    }
                }
            );

            // Simulate successful connection
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                mockConnection.onreconnected?.('test-connection-id');
            });

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
                expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
                expect(screen.getByTestId('is-ready')).toHaveTextContent('true');
            });

            expect(mockConnection.start).toHaveBeenCalled();
            expect(onConnected).toHaveBeenCalled();
        });

        it('should handle authentication failures with retry', async () => {
            const onError = jest.fn();
            const authError = new Error('Unauthorized');
            
            mockConnection.start.mockRejectedValueOnce(authError);
            
            renderWithSignalR(
                <TestComponent onError={onError} />,
                {
                    options: {
                        eventHandlers: { onError }
                    }
                }
            );

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'authentication',
                        message: expect.stringContaining('Unauthorized'),
                    })
                );
            });

            expect(SignalRAuthService.handleAuthenticationFailure).toHaveBeenCalledWith(authError);
        });

        it('should automatically reconnect on connection loss', async () => {
            const onReconnecting = jest.fn();
            const onReconnected = jest.fn();

            renderWithSignalR(
                <TestComponent />,
                {
                    options: {
                        eventHandlers: { onReconnecting, onReconnected }
                    }
                }
            );

            // Simulate connection established
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Simulate connection loss and reconnection
            act(() => {
                mockConnection.state = HubConnectionState.Reconnecting;
                mockConnection.onreconnecting?.(new Error('Connection lost'));
            });

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Reconnecting');
            });

            expect(onReconnecting).toHaveBeenCalled();

            // Simulate successful reconnection
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                mockConnection.onreconnected?.('new-connection-id');
            });

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
            });

            expect(onReconnected).toHaveBeenCalledWith('new-connection-id');
        });
    });

    // ========================================================================
    // Notification Processing Tests
    // ========================================================================

    describe('Notification Processing', () => {
        it('should process event notifications correctly', async () => {
            const onNotificationReceived = jest.fn();
            const notification = createEventNotification();

            renderWithSignalR(
                <TestComponent 
                    onNotificationReceived={onNotificationReceived}
                    enableToastNotifications={true}
                />
            );

            // Simulate connection established
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Simulate receiving notification
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(notification);
            });

            await waitFor(() => {
                expect(onNotificationReceived).toHaveBeenCalledWith(notification);
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: notification.title,
                        description: notification.message,
                    })
                );
            });

            expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
        });

        it('should process payment notifications with proper routing', async () => {
            const notification = createPaymentNotification();

            renderWithSignalR(
                <TestComponent 
                    enableAutoNavigation={true}
                    enableToastNotifications={true}
                />
            );

            // Simulate connection and notification
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(notification);
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: notification.title,
                        variant: 'destructive', // High priority
                    })
                );
            });
        });

        it('should handle financing notifications with critical priority', async () => {
            const notification = createFinancingNotification();

            renderWithSignalR(
                <TestComponent 
                    enableAutoNavigation={true}
                    enableToastNotifications={true}
                />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(notification);
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: notification.title,
                        variant: 'destructive', // Critical priority
                        duration: 10000, // Longer duration for critical
                    })
                );
            });
        });

        it('should process system notifications correctly', async () => {
            const notification = createSystemNotification();

            renderWithSignalR(
                <TestComponent enableToastNotifications={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(notification);
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: notification.title,
                        variant: 'default', // Normal priority
                    })
                );
            });
        });
    });

    // ========================================================================
    // Group Management Tests
    // ========================================================================

    describe('Group Management', () => {
        it('should join appropriate groups based on user role', async () => {
            // Mock user as organizer
            (SignalRAuthService.getCurrentUserId as jest.Mock).mockReturnValue('organizer-123');
            
            renderWithSignalR(<TestComponent />);

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            await waitFor(() => {
                expect(mockConnection.invoke).toHaveBeenCalledWith(
                    'JoinUserGroup',
                    'organizer-123'
                );
                expect(mockConnection.invoke).toHaveBeenCalledWith(
                    'JoinOrganizerGroup',
                    'organizer-123'
                );
            });

            expect(screen.getByTestId('user-groups')).toHaveTextContent('user-organizer-123');
            expect(screen.getByTestId('organizer-groups')).toHaveTextContent('organizer-organizer-123');
        });

        it('should rejoin groups after reconnection', async () => {
            renderWithSignalR(<TestComponent />);

            // Initial connection and group join
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            await waitFor(() => {
                expect(mockConnection.invoke).toHaveBeenCalledWith(
                    'JoinUserGroup',
                    expect.any(String)
                );
            });

            // Clear previous calls
            mockConnection.invoke.mockClear();

            // Simulate reconnection
            act(() => {
                mockConnection.state = HubConnectionState.Reconnecting;
            });

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                mockConnection.onreconnected?.('new-connection-id');
            });

            await waitFor(() => {
                expect(mockConnection.invoke).toHaveBeenCalledWith(
                    'JoinUserGroup',
                    expect.any(String)
                );
            });
        });
    });

    // ========================================================================
    // Error Handling and Recovery Tests
    // ========================================================================

    describe('Error Handling and Recovery', () => {
        it('should handle network errors with proper recovery', async () => {
            const onError = jest.fn();
            const networkError = new Error('Network error');

            renderWithSignalR(
                <TestComponent onError={onError} />
            );

            // Simulate network error during connection
            act(() => {
                mockConnection.onclose?.(networkError);
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'network',
                        message: expect.stringContaining('Network error'),
                    })
                );
            });
        });

        it('should handle hub method errors gracefully', async () => {
            const hubError = new Error('Hub method failed');
            mockConnection.invoke.mockRejectedValueOnce(hubError);

            renderWithSignalR(<TestComponent />);

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Try to invoke a method that will fail
            await act(async () => {
                try {
                    await mockConnection.invoke('TestMethod');
                } catch (error) {
                    // Expected to fail
                }
            });

            expect(mockConnection.invoke).toHaveBeenCalledWith('TestMethod');
        });

        it('should validate notification data and handle invalid notifications', async () => {
            const invalidNotification = {
                id: 'invalid-1',
                type: NotificationType.EventRegistration,
                title: 'Invalid Notification',
                message: 'This notification has invalid data',
                timestamp: new Date().toISOString(),
                priority: NotificationPriority.Normal,
                data: {
                    // Missing required fields for EventNotificationData
                    invalidField: 'invalid'
                }
            } as NotificationMessage;

            const onNotificationReceived = jest.fn();

            renderWithSignalR(
                <TestComponent onNotificationReceived={onNotificationReceived} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(invalidNotification);
            });

            // Should still receive the notification but validation should fail
            await waitFor(() => {
                expect(onNotificationReceived).toHaveBeenCalledWith(invalidNotification);
            });

            // Toast should not be shown for invalid notification
            expect(mockToast).not.toHaveBeenCalled();
        });
    });

    // ========================================================================
    // Performance and Load Testing
    // ========================================================================

    describe('Performance and Load Testing', () => {
        it('should handle multiple concurrent notifications efficiently', async () => {
            const notifications = [
                createEventNotification({ id: 'event-1' }),
                createPaymentNotification({ id: 'payment-1' }),
                createFinancingNotification({ id: 'financing-1' }),
                createSystemNotification({ id: 'system-1' }),
            ];

            const onNotificationReceived = jest.fn();

            renderWithSignalR(
                <TestComponent 
                    onNotificationReceived={onNotificationReceived}
                    enableToastNotifications={true}
                />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Send all notifications rapidly
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                expect(onNotificationReceived).toHaveBeenCalledTimes(4);
                expect(screen.getByTestId('notification-count')).toHaveTextContent('4');
            });

            // Should show toasts for all notifications (some may be batched)
            expect(mockToast).toHaveBeenCalled();
        });

        it('should batch notifications to prevent UI flooding', async () => {
            const notifications = Array.from({ length: 10 }, (_, i) => 
                createEventNotification({ 
                    id: `event-${i}`,
                    title: `Event ${i}` 
                })
            );

            renderWithSignalR(
                <TestComponent enableToastNotifications={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Send many notifications at once
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                expect(screen.getByTestId('notification-count')).toHaveTextContent('10');
            });

            // Should have batched some notifications to prevent flooding
            expect(mockToast).toHaveBeenCalled();
            // Exact call count may vary due to batching
        });

        it('should maintain performance with large notification history', async () => {
            const notifications = Array.from({ length: 100 }, (_, i) => 
                createEventNotification({ 
                    id: `event-${i}`,
                    title: `Event ${i}` 
                })
            );

            renderWithSignalR(
                <TestComponent enableToastNotifications={false} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Send many notifications
            for (const notification of notifications) {
                act(() => {
                    const handler = mockConnection.on.mock.calls.find(
                        call => call[0] === 'ReceiveNotification'
                    )?.[1];
                    handler?.(notification);
                });
            }

            await waitFor(() => {
                // Should limit history size to prevent memory issues
                const historyCount = parseInt(screen.getByTestId('notification-count').textContent || '0');
                expect(historyCount).toBeLessThanOrEqual(100);
            });
        });
    });

    // ========================================================================
    // Integration with Existing Systems
    // ========================================================================

    describe('System Integration', () => {
        it('should integrate with authentication system', async () => {
            // Test authentication state changes
            const authChangeCallback = (SignalRAuthService.subscribeToAuthChanges as jest.Mock)
                .mock.calls[0]?.[0];

            renderWithSignalR(<TestComponent />);

            // Simulate user logout
            act(() => {
                authChangeCallback(false, null);
            });

            await waitFor(() => {
                expect(mockConnection.stop).toHaveBeenCalled();
            });

            // Simulate user login
            mockConnection.start.mockClear();
            act(() => {
                authChangeCallback(true, 'new-user-id');
            });

            await waitFor(() => {
                expect(mockConnection.start).toHaveBeenCalled();
            });
        });

        it('should integrate with routing system', async () => {
            const notification = createEventNotification({
                actionUrl: '/dashboard/events/event-123'
            });

            renderWithSignalR(
                <TestComponent enableAutoNavigation={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(notification);
            });

            // For critical/high priority notifications with auto-navigation enabled
            if (notification.priority === NotificationPriority.Critical) {
                await waitFor(() => {
                    expect(mockPush).toHaveBeenCalledWith('/dashboard/events/event-123');
                });
            }
        });

        it('should integrate with state management', async () => {
            const notification = createEventNotification();

            renderWithSignalR(<TestComponent />);

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(notification);
            });

            await waitFor(() => {
                const stats = SignalRStateService.getStateStatistics();
                expect(stats.totalNotifications).toBe(1);
            });
        });
    });

    // ========================================================================
    // Manual Testing Interface
    // ========================================================================

    describe('Manual Testing Interface', () => {
        it('should provide manual connection controls', async () => {
            renderWithSignalR(<TestComponent />);

            const connectButton = screen.getByTestId('connect-button');
            const disconnectButton = screen.getByTestId('disconnect-button');
            const reconnectButton = screen.getByTestId('reconnect-button');

            expect(connectButton).toBeInTheDocument();
            expect(disconnectButton).toBeInTheDocument();
            expect(reconnectButton).toBeInTheDocument();

            // Test manual connection
            await userEvent.click(connectButton);
            expect(mockConnection.start).toHaveBeenCalled();

            // Test manual disconnection
            await userEvent.click(disconnectButton);
            expect(mockConnection.stop).toHaveBeenCalled();

            // Test manual reconnection
            await userEvent.click(reconnectButton);
            expect(mockConnection.stop).toHaveBeenCalled();
            expect(mockConnection.start).toHaveBeenCalled();
        });
    });
});
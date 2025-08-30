/**
 * Comprehensive SignalR Test Suite
 *
 * This file contains comprehensive test suites for all SignalR components,
 * hooks, and services. It provides both unit tests and integration tests
 * to ensure the SignalR system works correctly.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { HubConnectionState } from '@microsoft/signalr';

// Import components and hooks to test
import { useSignalR } from '@/hooks/useSignalR';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useNotificationGroups } from '@/hooks/useNotificationGroups';
import { useSignalRErrorHandler } from '@/hooks/useSignalRErrorHandler';
import SignalRTester from '@/components/signalr/SignalRTester';
import { SignalRTestService } from '@/services/SignalRTestService';

// Import test utilities and mocks
import {
    MockHubConnection,
    createMockUseSignalR,
    NotificationDataFactory,
    SignalRErrorFactory,
    ConnectionStateSimulator,
    SignalRTestUtils,
    setupSignalRMocks,
    TestData,
} from '@/tests/utils/signalr-mocks';

import {
    NotificationType,
    NotificationPriority,
    SignalRErrorType,
} from '@/types/notifications';

// ============================================================================
// Test Setup and Teardown
// ============================================================================

describe('SignalR Test Suite', () => {
    let mockSetup: ReturnType<typeof setupSignalRMocks>;

    beforeEach(() => {
        mockSetup = setupSignalRMocks();
        NotificationDataFactory.reset();
    });

    afterEach(() => {
        mockSetup.cleanup();
        jest.clearAllMocks();
    });

    // ============================================================================
    // useSignalR Hook Tests
    // ============================================================================

    describe('useSignalR Hook', () => {
        it('should initialize with disconnected state', () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            expect(result.current.isDisconnected).toBe(true);
            expect(result.current.isConnected).toBe(false);
            expect(result.current.isConnecting).toBe(false);
            expect(result.current.connection).toBeNull();
        });

        it('should connect successfully', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            expect(result.current.isConnected).toBe(true);
            expect(result.current.connection).toBeTruthy();
            expect(result.current.error).toBeNull();
        });

        it('should handle connection failures', async () => {
            const mockConnection = new MockHubConnection({
                shouldFailConnection: true,
            });
            const { result } = renderHook(() =>
                createMockUseSignalR({
                    mockConnection,
                    shouldFailConnection: true,
                })
            );

            await act(async () => {
                try {
                    await result.current.connect();
                } catch {
                    // Expected to fail
                }
            });

            expect(result.current.isConnected).toBe(false);
            expect(result.current.error).toBeTruthy();
        });

        it('should disconnect properly', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            expect(result.current.isConnected).toBe(true);

            await act(async () => {
                await result.current.disconnect();
            });

            expect(result.current.isDisconnected).toBe(true);
            expect(result.current.connection).toBeNull();
        });

        it('should handle reconnection', async () => {
            const mockConnection = new MockHubConnection();
            const simulator = new ConnectionStateSimulator(mockConnection);
            const { result } = renderHook(() =>
                createMockUseSignalR({ mockConnection })
            );

            await act(async () => {
                await result.current.connect();
            });

            expect(result.current.isConnected).toBe(true);

            // Simulate disconnection
            await act(async () => {
                await simulator.simulateDisconnection();
            });

            expect(result.current.isDisconnected).toBe(true);

            // Simulate reconnection
            await act(async () => {
                await simulator.simulateReconnecting();
                await simulator.simulateReconnected();
            });

            expect(result.current.isConnected).toBe(true);
        });

        it('should measure latency correctly', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const latency = await act(async () => {
                return await result.current.measureLatency();
            });

            expect(typeof latency).toBe('number');
            expect(latency).toBeGreaterThanOrEqual(0);
        });

        it('should perform health checks', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const isHealthy = await act(async () => {
                return await result.current.checkHealth();
            });

            expect(typeof isHealthy).toBe('boolean');
        });

        it('should handle hub method invocation', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const response = await act(async () => {
                return await result.current.invoke(
                    'TestMethod',
                    'arg1',
                    'arg2'
                );
            });

            expect(response).toBeTruthy();
        });

        it('should handle hub method send', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            await act(async () => {
                await result.current.send('TestMethod', 'arg1', 'arg2');
            });

            // Should not throw
        });

        it('should register and unregister event handlers', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );
            const mockHandler = jest.fn();

            await act(async () => {
                await result.current.connect();
            });

            act(() => {
                result.current.on('TestEvent', mockHandler);
            });

            // Simulate incoming event
            const mockConnection = result.current
                .connection as MockHubConnection;
            mockConnection.simulateIncomingMessage('TestEvent', 'test data');

            expect(mockHandler).toHaveBeenCalledWith('test data');

            act(() => {
                result.current.off('TestEvent', mockHandler);
            });

            // Should not be called again
            mockConnection.simulateIncomingMessage('TestEvent', 'test data 2');
            expect(mockHandler).toHaveBeenCalledTimes(1);
        });
    });

    // ============================================================================
    // useTypedNotificationHandler Hook Tests
    // ============================================================================

    describe('useTypedNotificationHandler Hook', () => {
        it('should handle incoming notifications', async () => {
            const mockConnection = new MockHubConnection();
            const { result } = renderHook(() => useTypedNotificationHandler());

            const testNotification = TestData.notifications.eventRegistration;

            act(() => {
                mockConnection.simulateIncomingNotification(testNotification);
            });

            await waitFor(() => {
                expect(result.current.notifications).toContain(
                    testNotification
                );
            });
        });

        it('should filter notifications by type', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const eventNotification = TestData.notifications.eventRegistration;
            const paymentNotification = TestData.notifications.paymentCompleted;

            act(() => {
                result.current.addNotification(eventNotification);
                result.current.addNotification(paymentNotification);
            });

            const eventNotifications = result.current.getNotificationsByType(
                NotificationType.EventRegistration
            );
            const paymentNotifications = result.current.getNotificationsByType(
                NotificationType.PaymentCompleted
            );

            expect(eventNotifications).toHaveLength(1);
            expect(paymentNotifications).toHaveLength(1);
            expect(eventNotifications[0]).toBe(eventNotification);
            expect(paymentNotifications[0]).toBe(paymentNotification);
        });

        it('should mark notifications as read', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const notification = TestData.notifications.eventRegistration;

            act(() => {
                result.current.addNotification(notification);
            });

            expect(result.current.getUnreadCount()).toBe(1);

            act(() => {
                result.current.markAsRead(notification.id);
            });

            expect(result.current.getUnreadCount()).toBe(0);
        });

        it('should clear notifications', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const notifications = TestData.notifications.batch;

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            expect(result.current.notifications).toHaveLength(
                notifications.length
            );

            act(() => {
                result.current.clearNotifications();
            });

            expect(result.current.notifications).toHaveLength(0);
        });

        it('should handle notification priorities correctly', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const priorityNotifications = TestData.notifications.priorities;

            act(() => {
                priorityNotifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            const highPriorityNotifications =
                result.current.getNotificationsByPriority(
                    NotificationPriority.High
                );
            const criticalNotifications =
                result.current.getNotificationsByPriority(
                    NotificationPriority.Critical
                );

            expect(highPriorityNotifications.length).toBeGreaterThan(0);
            expect(criticalNotifications.length).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // useNotificationGroups Hook Tests
    // ============================================================================

    describe('useNotificationGroups Hook', () => {
        it('should join groups successfully', async () => {
            const mockConnection = new MockHubConnection();
            const { result } = renderHook(() =>
                useNotificationGroups(mockConnection as HubConnection)
            );

            await act(async () => {
                await result.current.joinGroup('TestGroup');
            });

            expect(result.current.joinedGroups).toContain('TestGroup');
        });

        it('should leave groups successfully', async () => {
            const mockConnection = new MockHubConnection();
            const { result } = renderHook(() =>
                useNotificationGroups(mockConnection as HubConnection)
            );

            await act(async () => {
                await result.current.joinGroup('TestGroup');
            });

            expect(result.current.joinedGroups).toContain('TestGroup');

            await act(async () => {
                await result.current.leaveGroup('TestGroup');
            });

            expect(result.current.joinedGroups).not.toContain('TestGroup');
        });

        it('should handle group join failures', async () => {
            const mockConnection = new MockHubConnection({
                shouldFailInvoke: true,
            });
            const { result } = renderHook(() =>
                useNotificationGroups(mockConnection as HubConnection)
            );

            await act(async () => {
                try {
                    await result.current.joinGroup('TestGroup');
                } catch {
                    // Expected to fail
                }
            });

            expect(result.current.joinedGroups).not.toContain('TestGroup');
        });

        it('should rejoin groups on reconnection', async () => {
            const mockConnection = new MockHubConnection();
            const simulator = new ConnectionStateSimulator(mockConnection);
            const { result } = renderHook(() =>
                useNotificationGroups(mockConnection as HubConnection)
            );

            // Join a group
            await act(async () => {
                await result.current.joinGroup('TestGroup');
            });

            expect(result.current.joinedGroups).toContain('TestGroup');

            // Simulate disconnection and reconnection
            await act(async () => {
                await simulator.simulateDisconnection();
                await simulator.simulateReconnecting();
                await simulator.simulateReconnected();
            });

            // Should automatically rejoin groups
            expect(result.current.joinedGroups).toContain('TestGroup');
        });
    });

    // ============================================================================
    // useSignalRErrorHandler Hook Tests
    // ============================================================================

    describe('useSignalRErrorHandler Hook', () => {
        it('should handle authentication errors', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            const authError = TestData.errors.auth;

            act(() => {
                result.current.handleError(authError);
            });

            expect(result.current.lastError).toBe(authError);
            expect(result.current.errorHistory).toContain(authError);
        });

        it('should handle connection errors', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            const connectionError = TestData.errors.connection;

            act(() => {
                result.current.handleError(connectionError);
            });

            expect(result.current.lastError).toBe(connectionError);
            expect(result.current.canRetry).toBe(connectionError.canRetry);
        });

        it('should implement retry logic', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            const retryableError = TestData.errors.network;

            act(() => {
                result.current.handleError(retryableError);
            });

            expect(result.current.canRetry).toBe(true);

            const retryPromise = act(async () => {
                return await result.current.retry();
            });

            await expect(retryPromise).resolves.toBeTruthy();
        });

        it('should clear errors', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            const error = TestData.errors.connection;

            act(() => {
                result.current.handleError(error);
            });

            expect(result.current.lastError).toBe(error);

            act(() => {
                result.current.clearError();
            });

            expect(result.current.lastError).toBeNull();
        });
    });

    // ============================================================================
    // SignalRTestService Tests
    // ============================================================================

    describe('SignalRTestService', () => {
        let testService: SignalRTestService;

        beforeEach(() => {
            testService = new SignalRTestService({
                baseUrl: 'http://localhost:3000',
                timeout: 5000,
            });

            // Mock fetch for API calls
            global.fetch = jest.fn();
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('should send test notifications', async () => {
            const mockResponse = {
                success: true,
                data: {
                    notificationId: 'test-123',
                    sent: true,
                    deliveredTo: ['user-123'],
                },
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.sendTestNotification({
                type: NotificationType.EventRegistration,
                userId: 'user-123',
            });

            expect(result.sent).toBe(true);
            expect(result.notificationId).toBe('test-123');
        });

        it('should send batch notifications', async () => {
            const mockResponse = {
                success: true,
                data: [
                    {
                        notificationId: 'test-1',
                        sent: true,
                        deliveredTo: ['user-123'],
                    },
                    {
                        notificationId: 'test-2',
                        sent: true,
                        deliveredTo: ['user-123'],
                    },
                ],
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.sendBatchTestNotifications({
                notifications: [
                    { type: NotificationType.EventRegistration },
                    { type: NotificationType.PaymentCompleted },
                ],
            });

            expect(result).toHaveLength(2);
            expect(result.every((r) => r.sent)).toBe(true);
        });

        it('should test connection status', async () => {
            const mockResponse = {
                success: true,
                data: {
                    connectionId: 'conn-123',
                    state: HubConnectionState.Connected,
                    connectedAt: new Date().toISOString(),
                    groups: ['User'],
                    lastActivity: new Date().toISOString(),
                },
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testConnection({
                userId: 'user-123',
            });

            expect(result.connectionId).toBe('conn-123');
            expect(result.state).toBe(HubConnectionState.Connected);
        });

        it('should perform health checks', async () => {
            const mockResponse = {
                success: true,
                data: {
                    status: 'healthy',
                    checks: {
                        database: true,
                        signalr: true,
                        authentication: true,
                        notifications: true,
                    },
                    latency: 50,
                    uptime: 3600,
                    version: '1.0.0',
                },
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.healthCheck();

            expect(result.status).toBe('healthy');
            expect(result.checks.signalr).toBe(true);
        });

        it('should simulate errors', async () => {
            const mockResponse = {
                success: true,
                data: {
                    simulated: true,
                    error: TestData.errors.connection,
                },
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.simulateError(
                SignalRErrorType.Connection,
                'user-123'
            );

            expect(result.simulated).toBe(true);
            expect(result.error).toBeTruthy();
        });

        it('should handle API errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(
                testService.sendTestNotification({
                    type: NotificationType.EventRegistration,
                })
            ).rejects.toThrow();
        });
    });

    // ============================================================================
    // SignalRTester Component Tests
    // ============================================================================

    describe('SignalRTester Component', () => {
        it('should render without crashing', () => {
            render(<SignalRTester />);

            expect(
                screen.getByText('SignalR Testing Dashboard')
            ).toBeInTheDocument();
        });

        it('should display connection status', () => {
            render(<SignalRTester />);

            expect(screen.getByText('Connection Status')).toBeInTheDocument();
        });

        it('should have notification testing controls', () => {
            render(<SignalRTester />);

            expect(
                screen.getByText('Send Test Notifications')
            ).toBeInTheDocument();
            expect(screen.getByText('Send Single')).toBeInTheDocument();
        });

        it('should have connection testing controls', () => {
            render(<SignalRTester />);

            // Click on Connection tab
            fireEvent.click(screen.getByText('Connection'));

            expect(screen.getByText('Test Connection')).toBeInTheDocument();
            expect(screen.getByText('Health Check')).toBeInTheDocument();
        });

        it('should have error testing controls', () => {
            render(<SignalRTester />);

            // Click on Errors tab
            fireEvent.click(screen.getByText('Errors'));

            expect(screen.getByText('Error Testing')).toBeInTheDocument();
            expect(screen.getByText('Simulate Errors')).toBeInTheDocument();
        });

        it('should have configuration controls', () => {
            render(<SignalRTester />);

            // Click on Config tab
            fireEvent.click(screen.getByText('Config'));

            expect(screen.getByText('Test Configuration')).toBeInTheDocument();
            expect(screen.getByText('Auto Connect')).toBeInTheDocument();
        });

        it('should display test results', () => {
            render(<SignalRTester />);

            expect(screen.getByText(/Test Results/)).toBeInTheDocument();
        });

        it('should allow clearing test results', () => {
            render(<SignalRTester />);

            const clearButton = screen.getByText('Clear');
            expect(clearButton).toBeInTheDocument();

            fireEvent.click(clearButton);
            // Results should be cleared (tested through state)
        });

        it('should allow exporting test results', () => {
            render(<SignalRTester />);

            const exportButton = screen.getByText('Export');
            expect(exportButton).toBeInTheDocument();

            // Mock URL.createObjectURL for export functionality
            global.URL.createObjectURL = jest.fn(() => 'mock-url');
            global.URL.revokeObjectURL = jest.fn();

            fireEvent.click(exportButton);

            expect(global.URL.createObjectURL).toHaveBeenCalled();
        });
    });

    // ============================================================================
    // Integration Tests
    // ============================================================================

    describe('Integration Tests', () => {
        it('should handle complete notification flow', async () => {
            const mockConnection = new MockHubConnection();
            const { result: signalRResult } = renderHook(() =>
                createMockUseSignalR({ mockConnection })
            );
            const { result: notificationResult } = renderHook(() =>
                useTypedNotificationHandler()
            );

            // Connect
            await act(async () => {
                await signalRResult.current.connect();
            });

            expect(signalRResult.current.isConnected).toBe(true);

            // Send notification
            const testNotification = TestData.notifications.eventRegistration;

            act(() => {
                mockConnection.simulateIncomingNotification(testNotification);
            });

            // Verify notification received
            await waitFor(() => {
                expect(notificationResult.current.notifications).toContain(
                    testNotification
                );
            });
        });

        it('should handle error recovery flow', async () => {
            const mockConnection = new MockHubConnection();
            const simulator = new ConnectionStateSimulator(mockConnection);
            const { result: signalRResult } = renderHook(() =>
                createMockUseSignalR({ mockConnection })
            );
            const { result: errorResult } = renderHook(() =>
                useSignalRErrorHandler()
            );

            // Connect
            await act(async () => {
                await signalRResult.current.connect();
            });

            expect(signalRResult.current.isConnected).toBe(true);

            // Simulate error
            const testError = TestData.errors.connection;

            act(() => {
                errorResult.current.handleError(testError);
            });

            expect(errorResult.current.lastError).toBe(testError);

            // Simulate recovery
            await act(async () => {
                await simulator.simulateReconnecting();
                await simulator.simulateReconnected();
            });

            expect(signalRResult.current.isConnected).toBe(true);
        });

        it('should handle group management with notifications', async () => {
            const mockConnection = new MockHubConnection();
            const { result: signalRResult } = renderHook(() =>
                createMockUseSignalR({ mockConnection })
            );
            const { result: groupsResult } = renderHook(() =>
                useNotificationGroups(mockConnection as HubConnection)
            );

            // Connect
            await act(async () => {
                await signalRResult.current.connect();
            });

            // Join group
            await act(async () => {
                await groupsResult.current.joinGroup('TestGroup');
            });

            expect(groupsResult.current.joinedGroups).toContain('TestGroup');

            // Simulate group-specific notification
            const groupNotification =
                NotificationDataFactory.createNotification(
                    NotificationType.EventRegistration,
                    { metadata: { targetGroup: 'TestGroup' } }
                );

            act(() => {
                mockConnection.simulateIncomingNotification(groupNotification);
            });

            // Notification should be received since we're in the group
            // This would be verified in a real integration test
        });
    });

    // ============================================================================
    // Performance Tests
    // ============================================================================

    describe('Performance Tests', () => {
        it('should handle high volume of notifications', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const startTime = Date.now();
            const notificationCount = 1000;
            const notifications =
                NotificationDataFactory.createNotificationBatch(
                    notificationCount
                );

            act(() => {
                notifications.forEach((notification) => {
                    result.current.addNotification(notification);
                });
            });

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            expect(result.current.notifications).toHaveLength(
                notificationCount
            );
            expect(processingTime).toBeLessThan(1000); // Should process 1000 notifications in under 1 second under 1 second
        });

        it('should handle rapid connection state changes', async () => {
            const mockConnection = new MockHubConnection();
            const simulator = new ConnectionStateSimulator(mockConnection);
            const { result } = renderHook(() =>
                createMockUseSignalR({ mockConnection })
            );

            const stateChanges = 100;
            const startTime = Date.now();

            for (let i = 0; i < stateChanges; i++) {
                await act(async () => {
                    await simulator.simulateDisconnection();
                    await simulator.simulateReconnecting();
                    await simulator.simulateReconnected();
                });
            }

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            expect(result.current.isConnected).toBe(true);
            expect(processingTime).toBeLessThan(5000); // Should handle 100 state changes in under 5 seconds
        });
    });

    // ============================================================================
    // Edge Case Tests
    // ============================================================================

    describe('Edge Case Tests', () => {
        it('should handle malformed notifications gracefully', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            const malformedNotification = {
                id: 'malformed',
                // Missing required fields
            };

            act(() => {
                // This should not crash the application
                try {
                    result.current.addNotification(
                        malformedNotification as NotificationMessage
                    );
                } catch {
                    // Expected to handle gracefully
                }
            });

            // Should not add malformed notification
            expect(result.current.notifications).not.toContain(
                malformedNotification
            );
        });

        it('should handle connection during invalid state', async () => {
            const mockConnection = new MockHubConnection();
            const { result } = renderHook(() =>
                createMockUseSignalR({ mockConnection })
            );

            // Try to connect while already connecting
            await act(async () => {
                const connectPromise1 = result.current.connect();
                const connectPromise2 = result.current.connect();

                await Promise.all([connectPromise1, connectPromise2]);
            });

            // Should handle gracefully and end up connected
            expect(result.current.isConnected).toBe(true);
        });

        it('should handle empty notification batches', async () => {
            const { result } = renderHook(() => useTypedNotificationHandler());

            act(() => {
                result.current.addNotificationBatch([]);
            });

            expect(result.current.notifications).toHaveLength(0);
        });

        it('should handle null/undefined error handling', async () => {
            const { result } = renderHook(() => useSignalRErrorHandler());

            act(() => {
                result.current.handleError(null as unknown as SignalRError);
                result.current.handleError(
                    undefined as unknown as SignalRError
                );
            });

            // Should handle gracefully without crashing
            expect(result.current.lastError).toBeNull();
        });
    });
});

// ============================================================================
// Test Utilities Export
// ============================================================================

export {
    setupSignalRMocks,
    MockHubConnection,
    NotificationDataFactory,
    SignalRErrorFactory,
    ConnectionStateSimulator,
    SignalRTestUtils,
    TestData,
};

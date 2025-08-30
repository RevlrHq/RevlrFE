/**
 * Integration tests for SignalRTestService
 *
 * Tests the comprehensive testing capabilities of the SignalR notification system,
 * including API endpoint integration, notification testing, and error handling.
 */

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    jest,
} from '@jest/globals';
import {
    SignalRTestService,
    createSignalRTestService,
    TestScenarios,
} from '@/services/SignalRTestService';
import {
    NotificationType,
    NotificationPriority,
    SignalRErrorType,
    SignalRConnectionState,
} from '@/types/notifications';

// Mock fetch globally
global.fetch = jest.fn();

describe('SignalRTestService', () => {
    let testService: SignalRTestService;
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
        mockFetch.mockClear();

        testService = createSignalRTestService({
            baseUrl: 'http://localhost:5000',
            timeout: 5000,
            retryAttempts: 2,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ============================================================================
    // Test Notification Methods
    // ============================================================================

    describe('sendTestNotification', () => {
        it('should send a test notification successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    notificationId: 'test-123',
                    sent: true,
                    deliveredTo: ['user-123'],
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.sendTestNotification({
                type: NotificationType.EventRegistration,
                userId: 'user-123',
                priority: NotificationPriority.Normal,
            });

            expect(result).toEqual(mockResponse.data);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/signalr/test/notification',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    body: expect.stringContaining('EventRegistration'),
                })
            );
        });

        it('should handle API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(
                testService.sendTestNotification({
                    type: NotificationType.PaymentFailed,
                    userId: 'user-123',
                })
            ).rejects.toThrow('Failed to send test notification');
        });

        it('should retry on network failures', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: {
                                notificationId: 'retry-123',
                                sent: true,
                                deliveredTo: [],
                            },
                            timestamp: '2024-01-15T12:00:00Z',
                        }),
                });

            const result = await testService.sendTestNotification({
                type: NotificationType.SystemUpdate,
            });

            expect(result.notificationId).toBe('retry-123');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('sendBatchTestNotifications', () => {
        it('should send multiple notifications in a batch', async () => {
            const mockResponse = {
                success: true,
                data: [
                    {
                        notificationId: 'batch-1',
                        sent: true,
                        deliveredTo: ['user-1'],
                    },
                    {
                        notificationId: 'batch-2',
                        sent: true,
                        deliveredTo: ['user-2'],
                    },
                ],
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.sendBatchTestNotifications({
                notifications: [
                    {
                        type: NotificationType.EventRegistration,
                        userId: 'user-1',
                    },
                    {
                        type: NotificationType.PaymentCompleted,
                        userId: 'user-2',
                    },
                ],
                batchSize: 2,
                intervalMs: 500,
            });

            expect(result).toHaveLength(2);
            expect(result[0].notificationId).toBe('batch-1');
            expect(result[1].notificationId).toBe('batch-2');
        });

        it('should handle empty batch requests', async () => {
            const mockResponse = {
                success: true,
                data: [],
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.sendBatchTestNotifications({
                notifications: [],
            });

            expect(result).toHaveLength(0);
        });
    });

    describe('sendAllNotificationTypes', () => {
        it('should send notifications for all types', async () => {
            const mockResponse = {
                success: true,
                data: Object.values(NotificationType).map((type, index) => ({
                    notificationId: `all-${index}`,
                    sent: true,
                    deliveredTo: ['user-123'],
                })),
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.sendAllNotificationTypes(
                'user-123',
                NotificationPriority.High
            );

            expect(result).toHaveLength(Object.values(NotificationType).length);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/signalr/test/batch',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('user-123'),
                })
            );
        });
    });

    // ============================================================================
    // Connection Testing Methods
    // ============================================================================

    describe('testConnection', () => {
        it('should test connection successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    connectionId: 'conn-123',
                    state: SignalRConnectionState.Connected,
                    connectedAt: '2024-01-15T12:00:00Z',
                    userId: 'user-123',
                    groups: ['User_user-123', 'Organizer_user-123'],
                    lastActivity: '2024-01-15T12:05:00Z',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testConnection({
                userId: 'user-123',
                groupTypes: ['User', 'Organizer'],
                testDuration: 5000,
            });

            expect(result.connectionId).toBe('conn-123');
            expect(result.state).toBe(SignalRConnectionState.Connected);
            expect(result.groups).toContain('User_user-123');
        });

        it('should handle connection test with default parameters', async () => {
            const mockResponse = {
                success: true,
                data: {
                    connectionId: 'conn-default',
                    state: SignalRConnectionState.Connected,
                    connectedAt: '2024-01-15T12:00:00Z',
                    groups: ['User'],
                    lastActivity: '2024-01-15T12:00:00Z',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testConnection();

            expect(result.connectionId).toBe('conn-default');
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/signalr/test/connection',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"groupTypes":["User"]'),
                })
            );
        });
    });

    describe('getConnectionStatus', () => {
        it('should get connection status for specific user', async () => {
            const mockResponse = {
                success: true,
                data: [
                    {
                        connectionId: 'conn-1',
                        state: SignalRConnectionState.Connected,
                        connectedAt: '2024-01-15T12:00:00Z',
                        userId: 'user-123',
                        groups: ['User_user-123'],
                        lastActivity: '2024-01-15T12:05:00Z',
                    },
                ],
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.getConnectionStatus('user-123');

            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe('user-123');
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/signalr/test/status?userId=user-123',
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('should get all connection statuses when no user specified', async () => {
            const mockResponse = {
                success: true,
                data: [
                    {
                        connectionId: 'conn-1',
                        state: SignalRConnectionState.Connected,
                        connectedAt: '2024-01-15T12:00:00Z',
                        groups: [],
                        lastActivity: '2024-01-15T12:00:00Z',
                    },
                    {
                        connectionId: 'conn-2',
                        state: SignalRConnectionState.Reconnecting,
                        connectedAt: '2024-01-15T11:55:00Z',
                        groups: [],
                        lastActivity: '2024-01-15T12:00:00Z',
                    },
                ],
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.getConnectionStatus();

            expect(result).toHaveLength(2);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/signalr/test/status',
                expect.objectContaining({ method: 'GET' })
            );
        });
    });

    describe('testGroupMembership', () => {
        it('should test group membership successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    joined: ['User_user-123', 'Organizer_user-123'],
                    failed: [],
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testGroupMembership('user-123', [
                'User',
                'Organizer',
            ]);

            expect(result.joined).toHaveLength(2);
            expect(result.failed).toHaveLength(0);
            expect(result.joined).toContain('User_user-123');
        });

        it('should handle partial group membership failures', async () => {
            const mockResponse = {
                success: true,
                data: {
                    joined: ['User_user-123'],
                    failed: ['Admin_user-123'],
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testGroupMembership('user-123', [
                'User',
                'Admin',
            ]);

            expect(result.joined).toHaveLength(1);
            expect(result.failed).toHaveLength(1);
            expect(result.failed).toContain('Admin_user-123');
        });
    });

    // ============================================================================
    // Authentication and Validation Methods
    // ============================================================================

    describe('validateToken', () => {
        it('should validate token successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    isValid: true,
                    userId: 'user-123',
                    roles: ['User', 'Organizer'],
                    expiresAt: '2024-01-15T18:00:00Z',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.validateToken({
                tokenToValidate: 'test-token',
                expectedUserId: 'user-123',
                expectedRoles: ['User'],
            });

            expect(result.isValid).toBe(true);
            expect(result.userId).toBe('user-123');
            expect(result.roles).toContain('User');
        });

        it('should handle invalid token', async () => {
            const mockResponse = {
                success: true,
                data: {
                    isValid: false,
                    error: 'Token expired',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.validateToken({
                tokenToValidate: 'expired-token',
            });

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Token expired');
        });
    });

    describe('testAuthentication', () => {
        it('should test authentication flow successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    authenticated: true,
                    userId: 'user-123',
                    roles: ['User'],
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testAuthentication(
                'user-123',
                'valid-token'
            );

            expect(result.authenticated).toBe(true);
            expect(result.userId).toBe('user-123');
        });

        it('should handle authentication failure', async () => {
            const mockResponse = {
                success: true,
                data: {
                    authenticated: false,
                    error: 'Invalid credentials',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testAuthentication(
                'user-123',
                'invalid-token'
            );

            expect(result.authenticated).toBe(false);
            expect(result.error).toBe('Invalid credentials');
        });
    });

    // ============================================================================
    // Health Check and Monitoring Methods
    // ============================================================================

    describe('healthCheck', () => {
        it('should perform health check successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    status: 'healthy' as const,
                    checks: {
                        database: true,
                        signalr: true,
                        authentication: true,
                        notifications: true,
                    },
                    latency: 45,
                    uptime: 86400,
                    version: '1.0.0',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.healthCheck();

            expect(result.status).toBe('healthy');
            expect(result.checks.signalr).toBe(true);
            expect(result.latency).toBe(45);
        });

        it('should handle degraded health status', async () => {
            const mockResponse = {
                success: true,
                data: {
                    status: 'degraded' as const,
                    checks: {
                        database: true,
                        signalr: false,
                        authentication: true,
                        notifications: true,
                    },
                    latency: 150,
                    uptime: 3600,
                    version: '1.0.0',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.healthCheck();

            expect(result.status).toBe('degraded');
            expect(result.checks.signalr).toBe(false);
        });
    });

    describe('getConnectionHealth', () => {
        it('should get connection health status', async () => {
            const mockResponse = {
                success: true,
                data: {
                    isHealthy: true,
                    latency: 25,
                    lastPingTime: new Date('2024-01-15T12:00:00Z'),
                    consecutiveFailures: 0,
                    uptime: 3600,
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.getConnectionHealth('conn-123');

            expect(result.isHealthy).toBe(true);
            expect(result.latency).toBe(25);
            expect(result.consecutiveFailures).toBe(0);
        });
    });

    describe('testNotificationPerformance', () => {
        it('should test notification performance', async () => {
            const mockResponse = {
                success: true,
                data: {
                    totalSent: 100,
                    totalDelivered: 98,
                    averageLatency: 45.5,
                    failureRate: 0.02,
                    errors: ['Connection timeout for user-456'],
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testNotificationPerformance(
                100,
                10
            );

            expect(result.totalSent).toBe(100);
            expect(result.totalDelivered).toBe(98);
            expect(result.failureRate).toBe(0.02);
            expect(result.errors).toHaveLength(1);
        });
    });

    // ============================================================================
    // Error Simulation Methods
    // ============================================================================

    describe('simulateError', () => {
        it('should simulate connection error', async () => {
            const mockResponse = {
                success: true,
                data: {
                    simulated: true,
                    error: {
                        type: SignalRErrorType.Connection,
                        message: 'Simulated connection error',
                        timestamp: new Date('2024-01-15T12:00:00Z'),
                        canRetry: true,
                    },
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.simulateError(
                SignalRErrorType.Connection,
                'user-123'
            );

            expect(result.simulated).toBe(true);
            expect(result.error?.type).toBe(SignalRErrorType.Connection);
        });
    });

    describe('testErrorRecovery', () => {
        it('should test error recovery successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    errorSimulated: true,
                    recoverySuccessful: true,
                    recoveryTime: 2500,
                    steps: [
                        'Error simulated',
                        'Reconnection attempted',
                        'Authentication renewed',
                        'Groups rejoined',
                        'Recovery completed',
                    ],
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.testErrorRecovery(
                SignalRErrorType.Authentication,
                'user-123'
            );

            expect(result.errorSimulated).toBe(true);
            expect(result.recoverySuccessful).toBe(true);
            expect(result.recoveryTime).toBe(2500);
            expect(result.steps).toHaveLength(5);
        });
    });

    // ============================================================================
    // Utility Methods
    // ============================================================================

    describe('resetTestEnvironment', () => {
        it('should reset test environment successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    reset: true,
                    message: 'Test environment reset successfully',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.resetTestEnvironment();

            expect(result.reset).toBe(true);
            expect(result.message).toContain('successfully');
        });
    });

    describe('getTestStatistics', () => {
        it('should get test statistics', async () => {
            const mockResponse = {
                success: true,
                data: {
                    totalNotificationsSent: 1250,
                    totalConnectionsActive: 45,
                    totalErrorsSimulated: 23,
                    averageResponseTime: 67.5,
                    uptime: 86400,
                    lastReset: '2024-01-14T12:00:00Z',
                },
                timestamp: '2024-01-15T12:00:00Z',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            });

            const result = await testService.getTestStatistics();

            expect(result.totalNotificationsSent).toBe(1250);
            expect(result.totalConnectionsActive).toBe(45);
            expect(result.averageResponseTime).toBe(67.5);
        });
    });

    // ============================================================================
    // Test Scenarios
    // ============================================================================

    describe('TestScenarios', () => {
        it('should create event notification scenarios', () => {
            const scenarios = TestScenarios.eventNotifications('user-123');

            expect(scenarios).toHaveLength(4);
            expect(scenarios.map((s) => s.type)).toEqual([
                NotificationType.EventRegistration,
                NotificationType.EventUpdate,
                NotificationType.EventPublished,
                NotificationType.EventCancelled,
            ]);
            expect(scenarios.every((s) => s.userId === 'user-123')).toBe(true);
        });

        it('should create payment notification scenarios', () => {
            const scenarios = TestScenarios.paymentNotifications();

            expect(scenarios).toHaveLength(4);
            expect(scenarios.map((s) => s.type)).toEqual([
                NotificationType.PaymentCompleted,
                NotificationType.PaymentFailed,
                NotificationType.PaymentPending,
                NotificationType.RecurringPaymentProcessed,
            ]);
        });

        it('should create financing notification scenarios', () => {
            const scenarios =
                TestScenarios.financingNotifications('organizer-456');

            expect(scenarios).toHaveLength(4);
            expect(scenarios.every((s) => s.userId === 'organizer-456')).toBe(
                true
            );
        });

        it('should create system notification scenarios', () => {
            const scenarios = TestScenarios.systemNotifications();

            expect(scenarios).toHaveLength(2);
            expect(scenarios.map((s) => s.type)).toEqual([
                NotificationType.SystemMaintenance,
                NotificationType.SystemUpdate,
            ]);
        });

        it('should create high priority notification scenarios', () => {
            const scenarios =
                TestScenarios.highPriorityNotifications('user-789');

            expect(scenarios).toHaveLength(3);
            expect(scenarios.every((s) => s.userId === 'user-789')).toBe(true);
            expect(
                scenarios.some((s) => s.priority === NotificationPriority.High)
            ).toBe(true);
            expect(
                scenarios.some(
                    (s) => s.priority === NotificationPriority.Critical
                )
            ).toBe(true);
        });

        it('should create load test notification scenarios', () => {
            const scenarios = TestScenarios.loadTestNotifications(
                50,
                'load-user'
            );

            expect(scenarios).toHaveLength(50);
            expect(scenarios.every((s) => s.userId === 'load-user')).toBe(true);
            expect(
                scenarios.every(
                    (s) => s.priority === NotificationPriority.Normal
                )
            ).toBe(true);
        });
    });

    // ============================================================================
    // Error Handling and Edge Cases
    // ============================================================================

    describe('Error Handling', () => {
        it('should handle timeout errors', async () => {
            mockFetch.mockImplementationOnce(
                () =>
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout')), 100)
                    )
            );

            await expect(
                testService.sendTestNotification({
                    type: NotificationType.EventRegistration,
                })
            ).rejects.toThrow('Failed to send test notification');
        });

        it('should handle network errors with retry', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            success: true,
                            data: {
                                notificationId: 'retry-success',
                                sent: true,
                                deliveredTo: [],
                            },
                            timestamp: '2024-01-15T12:00:00Z',
                        }),
                });

            const result = await testService.sendTestNotification({
                type: NotificationType.SystemUpdate,
            });

            expect(result.notificationId).toBe('retry-success');
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retry attempts', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'));

            await expect(
                testService.sendTestNotification({
                    type: NotificationType.PaymentFailed,
                })
            ).rejects.toThrow('Network error');

            expect(mockFetch).toHaveBeenCalledTimes(3);
        });
    });

    // ============================================================================
    // Factory Function Tests
    // ============================================================================

    describe('createSignalRTestService', () => {
        it('should create service with default configuration', () => {
            const service = createSignalRTestService();
            expect(service).toBeInstanceOf(SignalRTestService);
        });

        it('should create service with custom configuration', () => {
            const service = createSignalRTestService({
                baseUrl: 'https://custom-api.com',
                apiKey: 'test-key',
                timeout: 15000,
                retryAttempts: 5,
            });

            expect(service).toBeInstanceOf(SignalRTestService);
        });
    });
});

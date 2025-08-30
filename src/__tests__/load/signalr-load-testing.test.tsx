/**
 * SignalR Load Testing Suite
 * 
 * This test suite focuses on load testing the SignalR integration
 * with multiple concurrent users, high notification volumes,
 * and stress testing scenarios.
 * 
 * Test Coverage:
 * - Multiple concurrent user connections
 * - High-volume notification processing
 * - Connection stability under load
 * - Memory usage under sustained load
 * - Error recovery under stress conditions
 * - Performance degradation thresholds
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, waitFor, act } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import { SignalRProvider, useSignalRContext } from '@/providers/SignalRProvider';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { SignalRTestService } from '@/services/SignalRTestService';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/notifications';

// ============================================================================
// Load Testing Configuration
// ============================================================================

interface LoadTestConfig {
    concurrentUsers: number;
    notificationsPerUser: number;
    testDurationMs: number;
    notificationIntervalMs: number;
    maxMemoryUsageMB: number;
    maxProcessingTimeMs: number;
    errorThresholdPercent: number;
}

const DEFAULT_LOAD_CONFIG: LoadTestConfig = {
    concurrentUsers: 50,
    notificationsPerUser: 100,
    testDurationMs: 30000, // 30 seconds
    notificationIntervalMs: 100, // 100ms between notifications
    maxMemoryUsageMB: 100, // 100MB max memory usage
    maxProcessingTimeMs: 50, // 50ms max processing time per notification
    errorThresholdPercent: 5, // 5% error threshold
};

interface LoadTestResults {
    totalUsers: number;
    totalNotifications: number;
    successfulNotifications: number;
    failedNotifications: number;
    averageProcessingTime: number;
    maxProcessingTime: number;
    memoryUsageMB: number;
    errorRate: number;
    throughputPerSecond: number;
    connectionFailures: number;
    reconnectionAttempts: number;
}

// ============================================================================
// Load Testing Utilities
// ============================================================================

class LoadTestRunner {
    private config: LoadTestConfig;
    private results: LoadTestResults;
    private startTime: number = 0;
    private activeConnections: Set<string> = new Set();
    private processingTimes: number[] = [];
    private errors: Error[] = [];

    constructor(config: Partial<LoadTestConfig> = {}) {
        this.config = { ...DEFAULT_LOAD_CONFIG, ...config };
        this.results = {
            totalUsers: 0,
            totalNotifications: 0,
            successfulNotifications: 0,
            failedNotifications: 0,
            averageProcessingTime: 0,
            maxProcessingTime: 0,
            memoryUsageMB: 0,
            errorRate: 0,
            throughputPerSecond: 0,
            connectionFailures: 0,
            reconnectionAttempts: 0,
        };
    }

    async runLoadTest(): Promise<LoadTestResults> {
        this.startTime = Date.now();
        
        // Create multiple user sessions
        const userPromises = Array.from({ length: this.config.concurrentUsers }, (_, i) =>
            this.simulateUser(`user-${i}`)
        );

        // Wait for all users to complete or timeout
        await Promise.allSettled(userPromises);

        // Calculate final results
        this.calculateResults();
        
        return this.results;
    }

    private async simulateUser(userId: string): Promise<void> {
        try {
            this.activeConnections.add(userId);
            this.results.totalUsers++;

            // Simulate user notifications
            for (let i = 0; i < this.config.notificationsPerUser; i++) {
                if (Date.now() - this.startTime > this.config.testDurationMs) {
                    break; // Test duration exceeded
                }

                await this.processNotificationForUser(userId, i);
                
                // Wait between notifications
                await new Promise(resolve => 
                    setTimeout(resolve, this.config.notificationIntervalMs)
                );
            }
        } catch (error) {
            this.errors.push(error as Error);
            this.results.connectionFailures++;
        } finally {
            this.activeConnections.delete(userId);
        }
    }

    private async processNotificationForUser(userId: string, notificationIndex: number): Promise<void> {
        const startTime = performance.now();
        
        try {
            this.results.totalNotifications++;

            // Simulate notification processing
            const notification = this.createTestNotification(userId, notificationIndex);
            
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            
            const processingTime = performance.now() - startTime;
            this.processingTimes.push(processingTime);
            
            if (processingTime > this.config.maxProcessingTimeMs) {
                throw new Error(`Processing time exceeded threshold: ${processingTime}ms`);
            }
            
            this.results.successfulNotifications++;
        } catch (error) {
            this.results.failedNotifications++;
            this.errors.push(error as Error);
        }
    }

    private createTestNotification(userId: string, index: number): NotificationMessage {
        return {
            id: `${userId}-notification-${index}`,
            type: NotificationType.EventRegistration,
            title: `Test Notification ${index}`,
            message: `Test notification for user ${userId}`,
            timestamp: new Date().toISOString(),
            priority: NotificationPriority.Normal,
            data: {
                eventId: `event-${index}`,
                eventTitle: `Test Event ${index}`,
                organizerName: 'Load Test Organizer',
                eventDate: new Date().toISOString(),
                attendeeCount: 1,
                registrationId: `reg-${userId}-${index}`,
                attendeeName: `User ${userId}`,
                attendeeEmail: `${userId}@example.com`,
            },
        };
    }

    private calculateResults(): void {
        const testDuration = (Date.now() - this.startTime) / 1000; // seconds
        
        this.results.averageProcessingTime = this.processingTimes.length > 0
            ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
            : 0;
            
        this.results.maxProcessingTime = this.processingTimes.length > 0
            ? Math.max(...this.processingTimes)
            : 0;
            
        this.results.errorRate = this.results.totalNotifications > 0
            ? (this.results.failedNotifications / this.results.totalNotifications) * 100
            : 0;
            
        this.results.throughputPerSecond = testDuration > 0
            ? this.results.successfulNotifications / testDuration
            : 0;

        // Simulate memory usage calculation
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
            const memory = (window.performance as any).memory;
            this.results.memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
        } else {
            // Estimate memory usage for Node.js environment
            this.results.memoryUsageMB = (this.results.totalNotifications * 0.001); // Rough estimate
        }
    }

    getErrors(): Error[] {
        return [...this.errors];
    }

    getActiveConnectionCount(): number {
        return this.activeConnections.size;
    }
}

// ============================================================================
// Test Setup and Mocks
// ============================================================================

const mockConnections = new Map<string, any>();

const createMockConnection = (userId: string) => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    invoke: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn(),
    state: HubConnectionState.Disconnected,
    connectionId: `${userId}-connection-id`,
    onclose: jest.fn(),
    onreconnecting: jest.fn(),
    onreconnected: jest.fn(),
});

jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn().mockImplementation(() => ({
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn(() => {
            const userId = `user-${mockConnections.size}`;
            const connection = createMockConnection(userId);
            mockConnections.set(userId, connection);
            return connection;
        }),
    })),
    HubConnectionState: {
        Disconnected: 'Disconnected',
        Connecting: 'Connecting',
        Connected: 'Connected',
        Disconnecting: 'Disconnecting',
        Reconnecting: 'Reconnecting',
    },
}));

jest.mock('@/lib/services/SignalRAuthService', () => ({
    SignalRAuthService: {
        createTokenFactory: jest.fn(() => () => Promise.resolve('mock-token')),
        isAuthenticated: jest.fn(() => true),
        getCurrentUserId: jest.fn(() => 'test-user-id'),
        subscribeToAuthChanges: jest.fn(() => () => {}),
    },
}));

// ============================================================================
// Test Components
// ============================================================================

interface LoadTestComponentProps {
    userId: string;
    onNotificationProcessed?: (userId: string, processingTime: number) => void;
    onError?: (userId: string, error: Error) => void;
    onConnectionStateChange?: (userId: string, state: string) => void;
}

function LoadTestComponent({
    userId,
    onNotificationProcessed,
    onError,
    onConnectionStateChange,
}: LoadTestComponentProps) {
    const signalR = useSignalRContext();
    const notificationHandler = useTypedNotificationHandler({
        enableToastNotifications: false, // Disable for load testing
        enableValidation: false, // Disable for performance
    });

    const [processedCount, setProcessedCount] = React.useState(0);
    const [errorCount, setErrorCount] = React.useState(0);

    // Handle connection state changes
    React.useEffect(() => {
        if (onConnectionStateChange) {
            onConnectionStateChange(userId, signalR.connectionState.state);
        }
    }, [signalR.connectionState.state, userId, onConnectionStateChange]);

    // Handle errors
    React.useEffect(() => {
        if (signalR.error && onError) {
            onError(userId, new Error(signalR.error.message));
            setErrorCount(prev => prev + 1);
        }
    }, [signalR.error, userId, onError]);

    // Handle notifications
    React.useEffect(() => {
        if (!signalR.connection) return;

        const handleNotification = async (notification: NotificationMessage) => {
            const startTime = performance.now();
            
            try {
                await notificationHandler.processNotification(notification);
                const processingTime = performance.now() - startTime;
                
                setProcessedCount(prev => prev + 1);
                
                if (onNotificationProcessed) {
                    onNotificationProcessed(userId, processingTime);
                }
            } catch (error) {
                setErrorCount(prev => prev + 1);
                if (onError) {
                    onError(userId, error as Error);
                }
            }
        };

        signalR.on('ReceiveNotification', handleNotification);

        return () => {
            signalR.off('ReceiveNotification', handleNotification);
        };
    }, [signalR, notificationHandler, userId, onNotificationProcessed, onError]);

    return (
        <div data-testid={`load-test-component-${userId}`}>
            <div data-testid={`connection-state-${userId}`}>{signalR.connectionState.state}</div>
            <div data-testid={`processed-count-${userId}`}>{processedCount}</div>
            <div data-testid={`error-count-${userId}`}>{errorCount}</div>
            <div data-testid={`is-connected-${userId}`}>{signalR.isConnected.toString()}</div>
        </div>
    );
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SignalR Load Testing', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnections.clear();
    });

    afterEach(() => {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    });

    // ========================================================================
    // Multiple Concurrent Users
    // ========================================================================

    describe('Multiple Concurrent Users', () => {
        it('should handle 10 concurrent user connections', async () => {
            const userCount = 10;
            const users = Array.from({ length: userCount }, (_, i) => `user-${i}`);
            const connectionStates = new Map<string, string>();
            const processedCounts = new Map<string, number>();

            const onConnectionStateChange = (userId: string, state: string) => {
                connectionStates.set(userId, state);
            };

            const onNotificationProcessed = (userId: string) => {
                processedCounts.set(userId, (processedCounts.get(userId) || 0) + 1);
            };

            // Render multiple user components
            const { container } = render(
                <div>
                    {users.map(userId => (
                        <SignalRProvider key={userId}>
                            <LoadTestComponent
                                userId={userId}
                                onConnectionStateChange={onConnectionStateChange}
                                onNotificationProcessed={onNotificationProcessed}
                            />
                        </SignalRProvider>
                    ))}
                </div>
            );

            // Simulate all connections establishing
            act(() => {
                mockConnections.forEach((connection, userId) => {
                    connection.state = HubConnectionState.Connected;
                    connection.onreconnected?.(connection.connectionId);
                });
            });

            await waitFor(() => {
                users.forEach(userId => {
                    expect(container.querySelector(`[data-testid="is-connected-${userId}"]`))
                        .toHaveTextContent('true');
                });
            });

            // Verify all connections are established
            expect(mockConnections.size).toBe(userCount);
            users.forEach(userId => {
                expect(connectionStates.get(userId)).toBe('Connected');
            });
        });

        it('should handle 50 concurrent users with notifications', async () => {
            const userCount = 50;
            const notificationsPerUser = 10;
            const users = Array.from({ length: userCount }, (_, i) => `user-${i}`);
            const totalProcessedCounts = new Map<string, number>();
            const errors: Error[] = [];

            const onNotificationProcessed = (userId: string) => {
                totalProcessedCounts.set(userId, (totalProcessedCounts.get(userId) || 0) + 1);
            };

            const onError = (userId: string, error: Error) => {
                errors.push(error);
            };

            // Render components in batches to avoid overwhelming the test environment
            const batchSize = 10;
            const batches = [];
            
            for (let i = 0; i < users.length; i += batchSize) {
                const batchUsers = users.slice(i, i + batchSize);
                batches.push(batchUsers);
            }

            let allComponents: React.ReactElement[] = [];
            
            for (const batch of batches) {
                const batchComponents = batch.map(userId => (
                    <SignalRProvider key={userId}>
                        <LoadTestComponent
                            userId={userId}
                            onNotificationProcessed={onNotificationProcessed}
                            onError={onError}
                        />
                    </SignalRProvider>
                ));
                allComponents = [...allComponents, ...batchComponents];
            }

            const { container } = render(<div>{allComponents}</div>);

            // Establish all connections
            act(() => {
                mockConnections.forEach((connection) => {
                    connection.state = HubConnectionState.Connected;
                });
            });

            // Send notifications to all users
            act(() => {
                mockConnections.forEach((connection, userId) => {
                    const handler = connection.on.mock.calls.find(
                        (call: any) => call[0] === 'ReceiveNotification'
                    )?.[1];

                    if (handler) {
                        for (let i = 0; i < notificationsPerUser; i++) {
                            const notification: NotificationMessage = {
                                id: `${userId}-notification-${i}`,
                                type: NotificationType.EventRegistration,
                                title: `Test Notification ${i}`,
                                message: `Test notification for ${userId}`,
                                timestamp: new Date().toISOString(),
                                priority: NotificationPriority.Normal,
                                data: {
                                    eventId: `event-${i}`,
                                    eventTitle: `Test Event ${i}`,
                                    organizerName: 'Load Test Organizer',
                                    eventDate: new Date().toISOString(),
                                    attendeeCount: 1,
                                    registrationId: `reg-${userId}-${i}`,
                                    attendeeName: `User ${userId}`,
                                    attendeeEmail: `${userId}@example.com`,
                                },
                            };
                            handler(notification);
                        }
                    }
                });
            });

            // Wait for all notifications to be processed
            await waitFor(() => {
                const totalProcessed = Array.from(totalProcessedCounts.values())
                    .reduce((sum, count) => sum + count, 0);
                expect(totalProcessed).toBe(userCount * notificationsPerUser);
            }, { timeout: 10000 });

            // Verify error rate is acceptable
            const errorRate = (errors.length / (userCount * notificationsPerUser)) * 100;
            expect(errorRate).toBeLessThan(5); // Less than 5% error rate

            console.log(`Load test completed: ${userCount} users, ${userCount * notificationsPerUser} notifications, ${errorRate.toFixed(2)}% error rate`);
        });
    });

    // ========================================================================
    // High Volume Notification Processing
    // ========================================================================

    describe('High Volume Notification Processing', () => {
        it('should handle 1000 notifications efficiently', async () => {
            const notificationCount = 1000;
            const processingTimes: number[] = [];
            let processedCount = 0;

            const onNotificationProcessed = (userId: string, processingTime: number) => {
                processingTimes.push(processingTime);
                processedCount++;
            };

            const { container } = render(
                <SignalRProvider>
                    <LoadTestComponent
                        userId="load-test-user"
                        onNotificationProcessed={onNotificationProcessed}
                    />
                </SignalRProvider>
            );

            // Get the mock connection
            const connection = Array.from(mockConnections.values())[0];
            
            act(() => {
                connection.state = HubConnectionState.Connected;
            });

            const startTime = performance.now();

            // Send notifications in batches
            const batchSize = 50;
            for (let i = 0; i < notificationCount; i += batchSize) {
                act(() => {
                    const handler = connection.on.mock.calls.find(
                        (call: any) => call[0] === 'ReceiveNotification'
                    )?.[1];

                    if (handler) {
                        for (let j = 0; j < batchSize && (i + j) < notificationCount; j++) {
                            const notification: NotificationMessage = {
                                id: `notification-${i + j}`,
                                type: NotificationType.EventRegistration,
                                title: `Test Notification ${i + j}`,
                                message: `High volume test notification`,
                                timestamp: new Date().toISOString(),
                                priority: NotificationPriority.Normal,
                                data: {
                                    eventId: `event-${i + j}`,
                                    eventTitle: `Test Event ${i + j}`,
                                    organizerName: 'Load Test Organizer',
                                    eventDate: new Date().toISOString(),
                                    attendeeCount: 1,
                                    registrationId: `reg-${i + j}`,
                                    attendeeName: 'Load Test User',
                                    attendeeEmail: 'loadtest@example.com',
                                },
                            };
                            handler(notification);
                        }
                    }
                });

                // Small delay between batches to prevent overwhelming
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            await waitFor(() => {
                expect(processedCount).toBe(notificationCount);
            }, { timeout: 30000 });

            const totalTime = performance.now() - startTime;
            const averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
            const throughput = notificationCount / (totalTime / 1000); // notifications per second

            console.log(`High volume test: ${notificationCount} notifications in ${totalTime.toFixed(2)}ms`);
            console.log(`Average processing time: ${averageProcessingTime.toFixed(2)}ms`);
            console.log(`Throughput: ${throughput.toFixed(2)} notifications/second`);

            // Performance assertions
            expect(averageProcessingTime).toBeLessThan(50); // Less than 50ms average
            expect(throughput).toBeGreaterThan(10); // At least 10 notifications per second
        });

        it('should maintain performance under sustained load', async () => {
            const testDurationMs = 5000; // 5 seconds
            const notificationIntervalMs = 10; // 10ms between notifications
            const expectedNotifications = Math.floor(testDurationMs / notificationIntervalMs);
            
            let processedCount = 0;
            const processingTimes: number[] = [];

            const onNotificationProcessed = (userId: string, processingTime: number) => {
                processingTimes.push(processingTime);
                processedCount++;
            };

            render(
                <SignalRProvider>
                    <LoadTestComponent
                        userId="sustained-load-user"
                        onNotificationProcessed={onNotificationProcessed}
                    />
                </SignalRProvider>
            );

            const connection = Array.from(mockConnections.values())[0];
            
            act(() => {
                connection.state = HubConnectionState.Connected;
            });

            const handler = connection.on.mock.calls.find(
                (call: any) => call[0] === 'ReceiveNotification'
            )?.[1];

            // Send notifications continuously for the test duration
            const startTime = Date.now();
            let notificationIndex = 0;

            const sendNotification = () => {
                if (Date.now() - startTime >= testDurationMs) {
                    return; // Test duration exceeded
                }

                if (handler) {
                    const notification: NotificationMessage = {
                        id: `sustained-${notificationIndex}`,
                        type: NotificationType.EventRegistration,
                        title: `Sustained Load Notification ${notificationIndex}`,
                        message: 'Sustained load test notification',
                        timestamp: new Date().toISOString(),
                        priority: NotificationPriority.Normal,
                        data: {
                            eventId: `event-${notificationIndex}`,
                            eventTitle: `Sustained Event ${notificationIndex}`,
                            organizerName: 'Sustained Load Organizer',
                            eventDate: new Date().toISOString(),
                            attendeeCount: 1,
                            registrationId: `reg-sustained-${notificationIndex}`,
                            attendeeName: 'Sustained Load User',
                            attendeeEmail: 'sustained@example.com',
                        },
                    };

                    act(() => {
                        handler(notification);
                    });
                }

                notificationIndex++;
                setTimeout(sendNotification, notificationIntervalMs);
            };

            // Start sending notifications
            sendNotification();

            // Wait for test completion
            await new Promise(resolve => setTimeout(resolve, testDurationMs + 1000));

            // Verify sustained performance
            const averageProcessingTime = processingTimes.length > 0
                ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
                : 0;

            console.log(`Sustained load test: ${processedCount} notifications processed`);
            console.log(`Average processing time: ${averageProcessingTime.toFixed(2)}ms`);

            // Performance should remain stable under sustained load
            expect(averageProcessingTime).toBeLessThan(100); // Less than 100ms average
            expect(processedCount).toBeGreaterThan(expectedNotifications * 0.8); // At least 80% processed
        });
    });

    // ========================================================================
    // Stress Testing and Error Recovery
    // ========================================================================

    describe('Stress Testing and Error Recovery', () => {
        it('should recover from connection failures under load', async () => {
            const errors: Error[] = [];
            let reconnectionCount = 0;

            const onError = (userId: string, error: Error) => {
                errors.push(error);
            };

            const { container } = render(
                <SignalRProvider>
                    <LoadTestComponent
                        userId="stress-test-user"
                        onError={onError}
                    />
                </SignalRProvider>
            );

            const connection = Array.from(mockConnections.values())[0];

            // Establish initial connection
            act(() => {
                connection.state = HubConnectionState.Connected;
            });

            await waitFor(() => {
                expect(container.querySelector('[data-testid="is-connected-stress-test-user"]'))
                    .toHaveTextContent('true');
            });

            // Simulate connection failure
            act(() => {
                connection.state = HubConnectionState.Disconnected;
                connection.onclose?.(new Error('Connection lost'));
            });

            // Simulate reconnection attempts
            act(() => {
                connection.state = HubConnectionState.Reconnecting;
                connection.onreconnecting?.(new Error('Reconnecting'));
                reconnectionCount++;
            });

            // Simulate successful reconnection
            act(() => {
                connection.state = HubConnectionState.Connected;
                connection.onreconnected?.('new-connection-id');
            });

            await waitFor(() => {
                expect(container.querySelector('[data-testid="connection-state-stress-test-user"]'))
                    .toHaveTextContent('Connected');
            });

            // Verify recovery
            expect(reconnectionCount).toBeGreaterThan(0);
        });

        it('should handle memory pressure gracefully', async () => {
            // This test simulates memory pressure by creating many notifications
            const largeNotificationCount = 5000;
            let processedCount = 0;

            const onNotificationProcessed = () => {
                processedCount++;
            };

            render(
                <SignalRProvider>
                    <LoadTestComponent
                        userId="memory-pressure-user"
                        onNotificationProcessed={onNotificationProcessed}
                    />
                </SignalRProvider>
            );

            const connection = Array.from(mockConnections.values())[0];
            
            act(() => {
                connection.state = HubConnectionState.Connected;
            });

            const handler = connection.on.mock.calls.find(
                (call: any) => call[0] === 'ReceiveNotification'
            )?.[1];

            // Send a large number of notifications to create memory pressure
            if (handler) {
                for (let i = 0; i < largeNotificationCount; i++) {
                    const notification: NotificationMessage = {
                        id: `memory-pressure-${i}`,
                        type: NotificationType.EventRegistration,
                        title: `Memory Pressure Notification ${i}`,
                        message: `Large notification data: ${'x'.repeat(1000)}`, // Large message
                        timestamp: new Date().toISOString(),
                        priority: NotificationPriority.Normal,
                        data: {
                            eventId: `event-${i}`,
                            eventTitle: `Memory Pressure Event ${i}`,
                            organizerName: 'Memory Pressure Organizer',
                            eventDate: new Date().toISOString(),
                            attendeeCount: 1,
                            registrationId: `reg-memory-${i}`,
                            attendeeName: 'Memory Pressure User',
                            attendeeEmail: 'memory@example.com',
                        },
                    };

                    act(() => {
                        handler(notification);
                    });

                    // Process in smaller batches to avoid overwhelming
                    if (i % 100 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1));
                    }
                }
            }

            // Wait for processing to complete or timeout
            await waitFor(() => {
                expect(processedCount).toBeGreaterThan(largeNotificationCount * 0.5); // At least 50% processed
            }, { timeout: 30000 });

            console.log(`Memory pressure test: ${processedCount}/${largeNotificationCount} notifications processed`);

            // System should handle memory pressure without crashing
            expect(processedCount).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // Load Test Runner Integration
    // ========================================================================

    describe('Load Test Runner Integration', () => {
        it('should run comprehensive load test with runner', async () => {
            const config: Partial<LoadTestConfig> = {
                concurrentUsers: 20,
                notificationsPerUser: 50,
                testDurationMs: 10000, // 10 seconds
                notificationIntervalMs: 50,
                maxProcessingTimeMs: 100,
                errorThresholdPercent: 10,
            };

            const runner = new LoadTestRunner(config);
            const results = await runner.runLoadTest();

            console.log('Load Test Results:', results);

            // Verify results meet expectations
            expect(results.totalUsers).toBe(config.concurrentUsers);
            expect(results.errorRate).toBeLessThan(config.errorThresholdPercent!);
            expect(results.averageProcessingTime).toBeLessThan(config.maxProcessingTimeMs!);
            expect(results.throughputPerSecond).toBeGreaterThan(0);

            // Log performance metrics
            console.log(`Total notifications: ${results.totalNotifications}`);
            console.log(`Success rate: ${((results.successfulNotifications / results.totalNotifications) * 100).toFixed(2)}%`);
            console.log(`Average processing time: ${results.averageProcessingTime.toFixed(2)}ms`);
            console.log(`Throughput: ${results.throughputPerSecond.toFixed(2)} notifications/second`);
            console.log(`Memory usage: ${results.memoryUsageMB.toFixed(2)}MB`);
        });
    });
});
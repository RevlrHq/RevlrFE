/**
 * SignalR Test Helpers
 *
 * Additional utilities and helpers for testing SignalR functionality.
 * These helpers provide common testing patterns and scenarios.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { SignalRProvider } from '@/providers/SignalRProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { MockHubConnection } from './signalr-mocks';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    SignalRError,
    SignalRErrorType,
} from '@/types/notifications';

// ============================================================================
// Test Providers and Wrappers
// ============================================================================

interface TestProvidersProps {
    children: React.ReactNode;
    mockConnection?: MockHubConnection;
    initialAuth?: {
        isAuthenticated: boolean;
        user?: Record<string, unknown>;
        token?: string;
    };
}

/**
 * Provides all necessary providers for testing SignalR components
 */
export const TestProviders: React.FC<TestProvidersProps> = ({
    children,
    mockConnection,
    initialAuth = { isAuthenticated: true },
}) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider initialState={initialAuth}>
                    <SignalRProvider mockConnection={mockConnection as unknown}>
                        {children}
                    </SignalRProvider>
                </AuthProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
    ui: React.ReactElement,
    options: RenderOptions & {
        mockConnection?: MockHubConnection;
        initialAuth?: TestProvidersProps['initialAuth'];
    } = {}
) {
    const { mockConnection, initialAuth, ...renderOptions } = options;

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TestProviders
            mockConnection={mockConnection}
            initialAuth={initialAuth}
        >
            {children}
        </TestProviders>
    );

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// ============================================================================
// Test Scenario Builders
// ============================================================================

export class TestScenarioBuilder {
    private notifications: NotificationMessage[] = [];
    private errors: SignalRError[] = [];
    private connectionStates: Array<{
        state: HubConnectionState;
        delay: number;
    }> = [];

    /**
     * Adds a notification to the scenario
     */
    withNotification(
        type: NotificationType,
        overrides: Partial<NotificationMessage> = {}
    ): this {
        const notification: NotificationMessage = {
            id: `scenario-notification-${this.notifications.length + 1}`,
            type,
            title: `Test ${type} Notification`,
            message: `This is a test notification for ${type}`,
            timestamp: new Date().toISOString(),
            priority: NotificationPriority.Normal,
            ...overrides,
        };

        this.notifications.push(notification);
        return this;
    }

    /**
     * Adds multiple notifications of the same type
     */
    withNotifications(
        type: NotificationType,
        count: number,
        overrides: Partial<NotificationMessage> = {}
    ): this {
        for (let i = 0; i < count; i++) {
            this.withNotification(type, {
                ...overrides,
                id: `scenario-batch-${type}-${i + 1}`,
                title: `Batch ${type} ${i + 1}`,
            });
        }
        return this;
    }

    /**
     * Adds a high priority notification
     */
    withHighPriorityNotification(
        type: NotificationType,
        overrides: Partial<NotificationMessage> = {}
    ): this {
        return this.withNotification(type, {
            priority: NotificationPriority.High,
            ...overrides,
        });
    }

    /**
     * Adds a critical notification
     */
    withCriticalNotification(
        type: NotificationType,
        overrides: Partial<NotificationMessage> = {}
    ): this {
        return this.withNotification(type, {
            priority: NotificationPriority.Critical,
            ...overrides,
        });
    }

    /**
     * Adds an error to the scenario
     */
    withError(
        type: SignalRErrorType,
        message: string = 'Test error',
        overrides: Partial<SignalRError> = {}
    ): this {
        const error: SignalRError = {
            type,
            message,
            timestamp: new Date(),
            canRetry: true,
            ...overrides,
        };

        this.errors.push(error);
        return this;
    }

    /**
     * Adds a connection state change
     */
    withConnectionState(state: HubConnectionState, delay: number = 0): this {
        this.connectionStates.push({ state, delay });
        return this;
    }

    /**
     * Builds the scenario
     */
    build(): {
        notifications: NotificationMessage[];
        errors: SignalRError[];
        connectionStates: Array<{ state: HubConnectionState; delay: number }>;
    } {
        return {
            notifications: [...this.notifications],
            errors: [...this.errors],
            connectionStates: [...this.connectionStates],
        };
    }

    /**
     * Resets the builder
     */
    reset(): this {
        this.notifications = [];
        this.errors = [];
        this.connectionStates = [];
        return this;
    }
}

// ============================================================================
// Common Test Scenarios
// ============================================================================

export const CommonScenarios = {
    /**
     * Event organizer receiving various notifications
     */
    eventOrganizerFlow: () =>
        new TestScenarioBuilder()
            .withNotification(NotificationType.EventRegistration)
            .withNotification(NotificationType.PaymentCompleted)
            .withNotification(NotificationType.EventUpdate)
            .withHighPriorityNotification(NotificationType.PaymentFailed)
            .build(),

    /**
     * Regular user receiving event-related notifications
     */
    regularUserFlow: () =>
        new TestScenarioBuilder()
            .withNotification(NotificationType.EventRegistration)
            .withNotification(NotificationType.PaymentCompleted)
            .withNotification(NotificationType.EventUpdate)
            .build(),

    /**
     * System maintenance scenario
     */
    systemMaintenanceFlow: () =>
        new TestScenarioBuilder()
            .withCriticalNotification(NotificationType.SystemMaintenance, {
                title: 'Scheduled Maintenance',
                message: 'System will be down for maintenance',
            })
            .withNotification(NotificationType.SystemUpdate, {
                title: 'System Updated',
                message: 'System has been updated successfully',
            })
            .build(),

    /**
     * Error recovery scenario
     */
    errorRecoveryFlow: () =>
        new TestScenarioBuilder()
            .withError(SignalRErrorType.Connection, 'Connection lost')
            .withError(SignalRErrorType.Authentication, 'Token expired')
            .withError(SignalRErrorType.Network, 'Network timeout')
            .build(),

    /**
     * High volume notification scenario
     */
    highVolumeFlow: () =>
        new TestScenarioBuilder()
            .withNotifications(NotificationType.EventRegistration, 50)
            .withNotifications(NotificationType.PaymentCompleted, 30)
            .withNotifications(NotificationType.EventUpdate, 20)
            .build(),

    /**
     * Mixed priority scenario
     */
    mixedPriorityFlow: () =>
        new TestScenarioBuilder()
            .withNotification(NotificationType.EventRegistration, {
                priority: NotificationPriority.Low,
            })
            .withNotification(NotificationType.PaymentCompleted, {
                priority: NotificationPriority.Normal,
            })
            .withNotification(NotificationType.PaymentFailed, {
                priority: NotificationPriority.High,
            })
            .withNotification(NotificationType.EventCancelled, {
                priority: NotificationPriority.Critical,
            })
            .build(),
};

// ============================================================================
// Test Assertion Helpers
// ============================================================================

export class TestAssertions {
    /**
     * Asserts that a notification list contains specific types
     */
    static expectNotificationTypes(
        notifications: NotificationMessage[],
        expectedTypes: NotificationType[]
    ): void {
        const actualTypes = notifications.map((n) => n.type);
        expectedTypes.forEach((expectedType) => {
            expect(actualTypes).toContain(expectedType);
        });
    }

    /**
     * Asserts that notifications are sorted by priority
     */
    static expectSortedByPriority(notifications: NotificationMessage[]): void {
        const priorityOrder = [
            NotificationPriority.Critical,
            NotificationPriority.High,
            NotificationPriority.Normal,
            NotificationPriority.Low,
        ];

        for (let i = 0; i < notifications.length - 1; i++) {
            const currentPriorityIndex = priorityOrder.indexOf(
                notifications[i].priority
            );
            const nextPriorityIndex = priorityOrder.indexOf(
                notifications[i + 1].priority
            );

            expect(currentPriorityIndex).toBeLessThanOrEqual(nextPriorityIndex);
        }
    }

    /**
     * Asserts that notifications are sorted by timestamp
     */
    static expectSortedByTimestamp(
        notifications: NotificationMessage[],
        ascending: boolean = false
    ): void {
        for (let i = 0; i < notifications.length - 1; i++) {
            const currentTime = new Date(notifications[i].timestamp).getTime();
            const nextTime = new Date(notifications[i + 1].timestamp).getTime();

            if (ascending) {
                expect(currentTime).toBeLessThanOrEqual(nextTime);
            } else {
                expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
        }
    }

    /**
     * Asserts that all notifications have required fields
     */
    static expectValidNotificationStructure(
        notifications: NotificationMessage[]
    ): void {
        notifications.forEach((notification) => {
            expect(notification).toHaveProperty('id');
            expect(notification).toHaveProperty('type');
            expect(notification).toHaveProperty('title');
            expect(notification).toHaveProperty('message');
            expect(notification).toHaveProperty('timestamp');
            expect(notification).toHaveProperty('priority');

            expect(typeof notification.id).toBe('string');
            expect(typeof notification.title).toBe('string');
            expect(typeof notification.message).toBe('string');
            expect(typeof notification.timestamp).toBe('string');

            expect(Object.values(NotificationType)).toContain(
                notification.type
            );
            expect(Object.values(NotificationPriority)).toContain(
                notification.priority
            );
        });
    }

    /**
     * Asserts that error has correct structure
     */
    static expectValidErrorStructure(error: SignalRError): void {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('timestamp');
        expect(error).toHaveProperty('canRetry');

        expect(Object.values(SignalRErrorType)).toContain(error.type);
        expect(typeof error.message).toBe('string');
        expect(error.timestamp).toBeInstanceOf(Date);
        expect(typeof error.canRetry).toBe('boolean');
    }

    /**
     * Asserts that connection state is valid
     */
    static expectValidConnectionState(
        connectionState: Record<string, unknown>
    ): void {
        expect(connectionState).toHaveProperty('state');
        expect(connectionState).toHaveProperty('reconnectAttempts');
        expect(connectionState).toHaveProperty('isHealthy');

        expect(typeof connectionState.reconnectAttempts).toBe('number');
        expect(typeof connectionState.isHealthy).toBe('boolean');
    }
}

// ============================================================================
// Performance Test Helpers
// ============================================================================

export class PerformanceTestHelper {
    private startTime: number = 0;
    private endTime: number = 0;

    /**
     * Starts performance measurement
     */
    start(): this {
        this.startTime = performance.now();
        return this;
    }

    /**
     * Ends performance measurement
     */
    end(): this {
        this.endTime = performance.now();
        return this;
    }

    /**
     * Gets the elapsed time in milliseconds
     */
    getElapsedTime(): number {
        return this.endTime - this.startTime;
    }

    /**
     * Asserts that operation completed within time limit
     */
    expectWithinTimeLimit(maxTimeMs: number): void {
        const elapsed = this.getElapsedTime();
        expect(elapsed).toBeLessThan(maxTimeMs);
    }

    /**
     * Measures async operation performance
     */
    static async measureAsync<T>(
        operation: () => Promise<T>,
        maxTimeMs?: number
    ): Promise<{ result: T; elapsedTime: number }> {
        const helper = new PerformanceTestHelper();

        helper.start();
        const result = await operation();
        helper.end();

        const elapsedTime = helper.getElapsedTime();

        if (maxTimeMs) {
            expect(elapsedTime).toBeLessThan(maxTimeMs);
        }

        return { result, elapsedTime };
    }

    /**
     * Measures sync operation performance
     */
    static measure<T>(
        operation: () => T,
        maxTimeMs?: number
    ): { result: T; elapsedTime: number } {
        const helper = new PerformanceTestHelper();

        helper.start();
        const result = operation();
        helper.end();

        const elapsedTime = helper.getElapsedTime();

        if (maxTimeMs) {
            expect(elapsedTime).toBeLessThan(maxTimeMs);
        }

        return { result, elapsedTime };
    }
}

// ============================================================================
// Memory Test Helpers
// ============================================================================

export class MemoryTestHelper {
    /**
     * Measures memory usage of an operation
     */
    static measureMemoryUsage<T>(operation: () => T): {
        result: T;
        memoryBefore: number;
        memoryAfter: number;
        memoryDelta: number;
    } {
        // Force garbage collection if available (Node.js with --expose-gc)
        if (global.gc) {
            global.gc();
        }

        const memoryBefore = process.memoryUsage().heapUsed;
        const result = operation();
        const memoryAfter = process.memoryUsage().heapUsed;

        return {
            result,
            memoryBefore,
            memoryAfter,
            memoryDelta: memoryAfter - memoryBefore,
        };
    }

    /**
     * Asserts that memory usage is within acceptable limits
     */
    static expectMemoryWithinLimit(
        memoryDelta: number,
        maxMemoryMB: number
    ): void {
        const memoryMB = memoryDelta / (1024 * 1024);
        expect(memoryMB).toBeLessThan(maxMemoryMB);
    }
}

// ============================================================================
// Async Test Helpers
// ============================================================================

export class AsyncTestHelper {
    /**
     * Waits for a condition to be true
     */
    static async waitForCondition(
        condition: () => boolean,
        timeout: number = 5000,
        interval: number = 100
    ): Promise<void> {
        const startTime = Date.now();

        while (!condition()) {
            if (Date.now() - startTime > timeout) {
                throw new Error(
                    `Timeout waiting for condition after ${timeout}ms`
                );
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }

    /**
     * Waits for multiple conditions to be true
     */
    static async waitForAllConditions(
        conditions: (() => boolean)[],
        timeout: number = 5000
    ): Promise<void> {
        await Promise.all(
            conditions.map((condition) =>
                this.waitForCondition(condition, timeout)
            )
        );
    }

    /**
     * Waits for any condition to be true
     */
    static async waitForAnyCondition(
        conditions: (() => boolean)[],
        timeout: number = 5000
    ): Promise<number> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();

            const checkConditions = () => {
                for (let i = 0; i < conditions.length; i++) {
                    if (conditions[i]()) {
                        resolve(i);
                        return;
                    }
                }

                if (Date.now() - startTime > timeout) {
                    reject(
                        new Error(
                            `Timeout waiting for any condition after ${timeout}ms`
                        )
                    );
                    return;
                }

                setTimeout(checkConditions, 100);
            };

            checkConditions();
        });
    }

    /**
     * Retries an async operation with exponential backoff
     */
    static async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt === maxRetries) {
                    break;
                }

                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }
}

// ============================================================================
// Export All Helpers
// ============================================================================

export {
    TestScenarioBuilder,
    CommonScenarios,
    TestAssertions,
    PerformanceTestHelper,
    MemoryTestHelper,
    AsyncTestHelper,
};

export default {
    TestProviders,
    renderWithProviders,
    TestScenarioBuilder,
    CommonScenarios,
    TestAssertions,
    PerformanceTestHelper,
    MemoryTestHelper,
    AsyncTestHelper,
};

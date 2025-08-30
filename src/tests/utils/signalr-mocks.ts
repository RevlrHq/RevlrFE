/**
 * SignalR Mock Utilities
 *
 * Provides comprehensive mocking capabilities for SignalR connections,
 * notifications, and related functionality for unit testing.
 */

import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    SignalRError,
    SignalRErrorType,
    SignalRConnectionState,
    createTestNotificationMessage,
    createTestNotificationDataByType,
    createTestSignalRError,
} from '@/types/notifications';
import type { UseSignalRResult } from '@/types/signalr';

// ============================================================================
// Mock Hub Connection
// ============================================================================

export interface MockHubConnectionOptions {
    initialState?: HubConnectionState;
    connectionId?: string;
    shouldFailConnection?: boolean;
    shouldFailInvoke?: boolean;
    invokeDelay?: number;
    autoReconnect?: boolean;
}

export class MockHubConnection implements Partial<HubConnection> {
    public connectionId: string | null;
    public state: HubConnectionState;
    public baseUrl: string = 'mock://signalr-hub';

    private eventHandlers: Map<string, ((...args: unknown[]) => void)[]> =
        new Map();
    private onCloseHandlers: ((error?: Error) => void)[] = [];
    private onReconnectingHandlers: ((error?: Error) => void)[] = [];
    private onReconnectedHandlers: ((connectionId?: string) => void)[] = [];
    private options: MockHubConnectionOptions;
    private isStarted = false;
    private reconnectAttempts = 0;

    constructor(options: MockHubConnectionOptions = {}) {
        this.options = {
            initialState: HubConnectionState.Disconnected,
            connectionId: 'mock-connection-id',
            shouldFailConnection: false,
            shouldFailInvoke: false,
            invokeDelay: 0,
            autoReconnect: true,
            ...options,
        };

        this.state = this.options.initialState!;
        this.connectionId = this.options.connectionId!;
    }

    // Connection lifecycle methods
    async start(): Promise<void> {
        if (this.isStarted) {
            return;
        }

        if (this.options.shouldFailConnection) {
            this.state = HubConnectionState.Disconnected;
            throw new Error('Mock connection failed');
        }

        this.state = HubConnectionState.Connecting;

        // Simulate connection delay
        await new Promise((resolve) => setTimeout(resolve, 10));

        this.state = HubConnectionState.Connected;
        this.isStarted = true;
    }

    async stop(): Promise<void> {
        if (!this.isStarted) {
            return;
        }

        this.state = HubConnectionState.Disconnecting;

        // Simulate disconnection delay
        await new Promise((resolve) => setTimeout(resolve, 10));

        this.state = HubConnectionState.Disconnected;
        this.isStarted = false;

        // Trigger close handlers
        this.onCloseHandlers.forEach((handler) => handler());
    }

    // Event handling methods
    on(methodName: string, handler: (...args: unknown[]) => void): void {
        if (!this.eventHandlers.has(methodName)) {
            this.eventHandlers.set(methodName, []);
        }
        this.eventHandlers.get(methodName)!.push(handler);
    }

    off(methodName: string, handler?: (...args: unknown[]) => void): void {
        if (!this.eventHandlers.has(methodName)) {
            return;
        }

        if (handler) {
            const handlers = this.eventHandlers.get(methodName)!;
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        } else {
            this.eventHandlers.delete(methodName);
        }
    }

    onclose(callback: (error?: Error) => void): void {
        this.onCloseHandlers.push(callback);
    }

    onreconnecting(callback: (error?: Error) => void): void {
        this.onReconnectingHandlers.push(callback);
    }

    onreconnected(callback: (connectionId?: string) => void): void {
        this.onReconnectedHandlers.push(callback);
    }

    // Hub method invocation
    async invoke<T = unknown>(
        methodName: string,
        ...args: unknown[]
    ): Promise<T> {
        if (this.state !== HubConnectionState.Connected) {
            throw new Error('Connection is not in the Connected state');
        }

        if (this.options.shouldFailInvoke) {
            throw new Error(`Mock invoke failed for method: ${methodName}`);
        }

        // Simulate invoke delay
        if (this.options.invokeDelay && this.options.invokeDelay > 0) {
            await new Promise((resolve) =>
                setTimeout(resolve, this.options.invokeDelay)
            );
        }

        // Handle special mock methods
        switch (methodName) {
            case 'Ping':
                return 'Pong' as T;
            case 'JoinGroup':
                return { success: true, groupId: args[0] } as T;
            case 'LeaveGroup':
                return { success: true, groupId: args[0] } as T;
            case 'SendNotification':
                return {
                    sent: true,
                    notificationId: 'mock-notification-id',
                } as T;
            default:
                return { success: true, method: methodName, args } as T;
        }
    }

    async send(methodName: string, ...args: unknown[]): Promise<void> {
        // Send is fire-and-forget, so we just simulate the call
        await this.invoke(methodName, ...args);
    }

    // Mock-specific methods for testing
    simulateDisconnection(error?: Error): void {
        if (this.state === HubConnectionState.Connected) {
            this.state = HubConnectionState.Disconnected;
            this.isStarted = false;
            this.onCloseHandlers.forEach((handler) => handler(error));
        }
    }

    simulateReconnecting(error?: Error): void {
        if (this.state === HubConnectionState.Disconnected) {
            this.state = HubConnectionState.Reconnecting;
            this.reconnectAttempts++;
            this.onReconnectingHandlers.forEach((handler) => handler(error));
        }
    }

    simulateReconnected(connectionId?: string): void {
        if (this.state === HubConnectionState.Reconnecting) {
            this.state = HubConnectionState.Connected;
            this.isStarted = true;
            this.connectionId = connectionId || this.connectionId;
            this.reconnectAttempts = 0;
            this.onReconnectedHandlers.forEach((handler) =>
                handler(this.connectionId!)
            );
        }
    }

    simulateIncomingNotification(notification: NotificationMessage): void {
        const handlers = this.eventHandlers.get('ReceiveNotification') || [];
        handlers.forEach((handler) => handler(notification));
    }

    simulateIncomingMessage(methodName: string, ...args: unknown[]): void {
        const handlers = this.eventHandlers.get(methodName) || [];
        handlers.forEach((handler) => handler(...args));
    }

    getEventHandlers(methodName: string): ((...args: unknown[]) => void)[] {
        return this.eventHandlers.get(methodName) || [];
    }

    getReconnectAttempts(): number {
        return this.reconnectAttempts;
    }

    reset(): void {
        this.state = HubConnectionState.Disconnected;
        this.isStarted = false;
        this.reconnectAttempts = 0;
        this.eventHandlers.clear();
        this.onCloseHandlers.length = 0;
        this.onReconnectingHandlers.length = 0;
        this.onReconnectedHandlers.length = 0;
    }
}

// ============================================================================
// Mock SignalR Hook
// ============================================================================

export interface MockUseSignalROptions {
    initialConnectionState?: HubConnectionState;
    shouldFailConnection?: boolean;
    shouldFailInvoke?: boolean;
    autoConnect?: boolean;
    mockConnection?: MockHubConnection;
}

export function createMockUseSignalR(
    options: MockUseSignalROptions = {}
): UseSignalRResult {
    const mockConnection =
        options.mockConnection ||
        new MockHubConnection({
            initialState: options.initialConnectionState,
            shouldFailConnection: options.shouldFailConnection,
            shouldFailInvoke: options.shouldFailInvoke,
        });

    const connectionState: SignalRConnectionState = {
        state: mockConnection.state,
        connectionId: mockConnection.connectionId || undefined,
        reconnectAttempts: mockConnection.getReconnectAttempts(),
        isHealthy: mockConnection.state === HubConnectionState.Connected,
        lastConnected:
            mockConnection.state === HubConnectionState.Connected
                ? new Date()
                : undefined,
    };

    return {
        connection: mockConnection as HubConnection,
        connectionState,
        error: null,
        isConnected: mockConnection.state === HubConnectionState.Connected,
        isConnecting: mockConnection.state === HubConnectionState.Connecting,
        isReconnecting:
            mockConnection.state === HubConnectionState.Reconnecting,
        isDisconnected:
            mockConnection.state === HubConnectionState.Disconnected,
        connect: jest.fn().mockImplementation(() => mockConnection.start()),
        disconnect: jest.fn().mockImplementation(() => mockConnection.stop()),
        reconnect: jest.fn().mockImplementation(async () => {
            await mockConnection.stop();
            await mockConnection.start();
        }),
        checkHealth: jest.fn().mockResolvedValue(true),
        measureLatency: jest.fn().mockResolvedValue(50),
        on: jest
            .fn()
            .mockImplementation((methodName, handler) =>
                mockConnection.on(methodName, handler)
            ),
        off: jest
            .fn()
            .mockImplementation((methodName, handler) =>
                mockConnection.off(methodName, handler)
            ),
        invoke: jest
            .fn()
            .mockImplementation((methodName, ...args) =>
                mockConnection.invoke(methodName, ...args)
            ),
        send: jest
            .fn()
            .mockImplementation((methodName, ...args) =>
                mockConnection.send(methodName, ...args)
            ),
    };
}

// ============================================================================
// Notification Data Factories
// ============================================================================

export class NotificationDataFactory {
    private static notificationCounter = 0;

    /**
     * Creates a test notification with incremental ID
     */
    static createNotification(
        type: NotificationType = NotificationType.EventRegistration,
        overrides: Partial<NotificationMessage> = {}
    ): NotificationMessage {
        this.notificationCounter++;

        const data = createTestNotificationDataByType(type);

        return createTestNotificationMessage({
            id: `test-notification-${this.notificationCounter}`,
            type,
            title: `Test ${type} Notification`,
            message: `This is a test notification of type ${type}`,
            data,
            ...overrides,
        });
    }

    /**
     * Creates multiple notifications of different types
     */
    static createNotificationBatch(
        count: number = 5,
        types?: NotificationType[]
    ): NotificationMessage[] {
        const availableTypes = types || Object.values(NotificationType);
        const notifications: NotificationMessage[] = [];

        for (let i = 0; i < count; i++) {
            const type = availableTypes[i % availableTypes.length];
            notifications.push(
                this.createNotification(type, {
                    id: `batch-notification-${this.notificationCounter + i + 1}`,
                    title: `Batch ${type} ${i + 1}`,
                })
            );
        }

        this.notificationCounter += count;
        return notifications;
    }

    /**
     * Creates notifications with specific priorities
     */
    static createPriorityNotifications(): NotificationMessage[] {
        return Object.values(NotificationPriority).map((priority, index) =>
            this.createNotification(NotificationType.EventRegistration, {
                priority,
                title: `${priority} Priority Notification`,
                id: `priority-notification-${index + 1}`,
            })
        );
    }

    /**
     * Creates error notifications for testing error handling
     */
    static createErrorNotifications(): NotificationMessage[] {
        return [
            this.createNotification(NotificationType.PaymentFailed, {
                priority: NotificationPriority.High,
                title: 'Payment Failed',
                message: 'Your payment could not be processed',
            }),
            this.createNotification(NotificationType.EventCancelled, {
                priority: NotificationPriority.Critical,
                title: 'Event Cancelled',
                message:
                    'The event has been cancelled due to unforeseen circumstances',
            }),
        ];
    }

    /**
     * Resets the notification counter
     */
    static reset(): void {
        this.notificationCounter = 0;
    }
}

// ============================================================================
// SignalR Error Factory
// ============================================================================

export class SignalRErrorFactory {
    /**
     * Creates a mock SignalR error
     */
    static createError(
        type: SignalRErrorType = SignalRErrorType.Connection,
        message: string = 'Mock error',
        overrides: Partial<SignalRError> = {}
    ): SignalRError {
        return createTestSignalRError({
            type,
            message,
            ...overrides,
        });
    }

    /**
     * Creates authentication error
     */
    static createAuthError(): SignalRError {
        return this.createError(
            SignalRErrorType.Authentication,
            'Authentication failed: Invalid token'
        );
    }

    /**
     * Creates connection error
     */
    static createConnectionError(): SignalRError {
        return this.createError(
            SignalRErrorType.Connection,
            'Connection failed: Unable to connect to server'
        );
    }

    /**
     * Creates network error
     */
    static createNetworkError(): SignalRError {
        return this.createError(
            SignalRErrorType.Network,
            'Network error: Request timeout'
        );
    }

    /**
     * Creates hub method error
     */
    static createHubMethodError(): SignalRError {
        return this.createError(
            SignalRErrorType.HubMethod,
            'Hub method error: Method not found'
        );
    }
}

// ============================================================================
// Connection State Simulation
// ============================================================================

export class ConnectionStateSimulator {
    private mockConnection: MockHubConnection;
    private stateChangeCallbacks: ((state: HubConnectionState) => void)[] = [];

    constructor(mockConnection: MockHubConnection) {
        this.mockConnection = mockConnection;
    }

    /**
     * Simulates a complete connection lifecycle
     */
    async simulateConnectionLifecycle(
        includeReconnection: boolean = true
    ): Promise<void> {
        // Start connection
        await this.simulateConnecting();
        await this.simulateConnected();

        if (includeReconnection) {
            // Simulate disconnection and reconnection
            await this.simulateDisconnection();
            await this.simulateReconnecting();
            await this.simulateReconnected();
        }
    }

    /**
     * Simulates connecting state
     */
    async simulateConnecting(): Promise<void> {
        this.mockConnection.state = HubConnectionState.Connecting;
        this.notifyStateChange(HubConnectionState.Connecting);
        await this.delay(100);
    }

    /**
     * Simulates connected state
     */
    async simulateConnected(): Promise<void> {
        this.mockConnection.state = HubConnectionState.Connected;
        this.notifyStateChange(HubConnectionState.Connected);
        await this.delay(50);
    }

    /**
     * Simulates disconnection
     */
    async simulateDisconnection(error?: Error): Promise<void> {
        this.mockConnection.simulateDisconnection(error);
        this.notifyStateChange(HubConnectionState.Disconnected);
        await this.delay(50);
    }

    /**
     * Simulates reconnecting state
     */
    async simulateReconnecting(error?: Error): Promise<void> {
        this.mockConnection.simulateReconnecting(error);
        this.notifyStateChange(HubConnectionState.Reconnecting);
        await this.delay(200);
    }

    /**
     * Simulates reconnected state
     */
    async simulateReconnected(connectionId?: string): Promise<void> {
        this.mockConnection.simulateReconnected(connectionId);
        this.notifyStateChange(HubConnectionState.Connected);
        await this.delay(50);
    }

    /**
     * Simulates multiple reconnection attempts
     */
    async simulateReconnectionAttempts(attempts: number = 3): Promise<void> {
        for (let i = 0; i < attempts; i++) {
            await this.simulateReconnecting(
                new Error(`Reconnection attempt ${i + 1}`)
            );
            await this.delay(1000 * Math.pow(2, i)); // Exponential backoff
        }
        await this.simulateReconnected();
    }

    /**
     * Adds a state change callback
     */
    onStateChange(callback: (state: HubConnectionState) => void): void {
        this.stateChangeCallbacks.push(callback);
    }

    /**
     * Removes a state change callback
     */
    offStateChange(callback: (state: HubConnectionState) => void): void {
        const index = this.stateChangeCallbacks.indexOf(callback);
        if (index !== -1) {
            this.stateChangeCallbacks.splice(index, 1);
        }
    }

    private notifyStateChange(state: HubConnectionState): void {
        this.stateChangeCallbacks.forEach((callback) => callback(state));
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// ============================================================================
// Test Utilities
// ============================================================================

export class SignalRTestUtils {
    /**
     * Waits for a specific connection state
     */
    static async waitForConnectionState(
        mockConnection: MockHubConnection,
        targetState: HubConnectionState,
        timeout: number = 5000
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (mockConnection.state === targetState) {
                resolve();
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(
                    new Error(
                        `Timeout waiting for connection state: ${targetState}`
                    )
                );
            }, timeout);

            const checkState = () => {
                if (mockConnection.state === targetState) {
                    clearTimeout(timeoutId);
                    resolve();
                }
            };

            // Check state periodically
            const intervalId = setInterval(checkState, 100);

            setTimeout(() => {
                clearInterval(intervalId);
            }, timeout);
        });
    }

    /**
     * Waits for a notification to be received
     */
    static async waitForNotification(
        mockConnection: MockHubConnection,
        timeout: number = 5000
    ): Promise<NotificationMessage> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout waiting for notification'));
            }, timeout);

            const handler = (notification: NotificationMessage) => {
                clearTimeout(timeoutId);
                mockConnection.off('ReceiveNotification', handler);
                resolve(notification);
            };

            mockConnection.on('ReceiveNotification', handler);
        });
    }

    /**
     * Creates a test environment with mock connection and utilities
     */
    static createTestEnvironment(options: MockHubConnectionOptions = {}): {
        mockConnection: MockHubConnection;
        simulator: ConnectionStateSimulator;
        notificationFactory: typeof NotificationDataFactory;
        errorFactory: typeof SignalRErrorFactory;
        cleanup: () => void;
    } {
        const mockConnection = new MockHubConnection(options);
        const simulator = new ConnectionStateSimulator(mockConnection);

        const cleanup = () => {
            mockConnection.reset();
            NotificationDataFactory.reset();
        };

        return {
            mockConnection,
            simulator,
            notificationFactory: NotificationDataFactory,
            errorFactory: SignalRErrorFactory,
            cleanup,
        };
    }

    /**
     * Asserts that a mock function was called with specific arguments
     */
    static expectMockCall(
        mockFn: jest.MockedFunction<(...args: unknown[]) => unknown>,
        expectedArgs: unknown[],
        callIndex: number = 0
    ): void {
        expect(mockFn).toHaveBeenCalled();
        expect(mockFn.mock.calls[callIndex]).toEqual(expectedArgs);
    }

    /**
     * Asserts that a notification has the expected structure
     */
    static expectValidNotification(
        notification: unknown,
        expectedType?: NotificationType
    ): void {
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('title');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('timestamp');
        expect(notification).toHaveProperty('priority');

        if (expectedType) {
            expect(notification.type).toBe(expectedType);
        }

        expect(Object.values(NotificationType)).toContain(notification.type);
        expect(Object.values(NotificationPriority)).toContain(
            notification.priority
        );
    }

    /**
     * Asserts that an error has the expected SignalR error structure
     */
    static expectValidSignalRError(
        error: unknown,
        expectedType?: SignalRErrorType
    ): void {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('timestamp');
        expect(error).toHaveProperty('canRetry');

        if (expectedType) {
            expect(error.type).toBe(expectedType);
        }

        expect(Object.values(SignalRErrorType)).toContain(error.type);
        expect(typeof error.canRetry).toBe('boolean');
    }
}

// ============================================================================
// Jest Setup Helpers
// ============================================================================

/**
 * Sets up SignalR mocks for Jest tests
 */
export function setupSignalRMocks(): {
    mockHubConnectionBuilder: jest.MockedClass<
        typeof import('@microsoft/signalr').HubConnectionBuilder
    >;
    mockHubConnection: MockHubConnection;
    cleanup: () => void;
} {
    const mockHubConnection = new MockHubConnection();

    const mockHubConnectionBuilder = jest.fn().mockImplementation(() => ({
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue(mockHubConnection),
    }));

    // Mock the @microsoft/signalr module
    jest.mock('@microsoft/signalr', () => ({
        HubConnectionBuilder: mockHubConnectionBuilder,
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

    const cleanup = () => {
        mockHubConnection.reset();
        jest.clearAllMocks();
    };

    return {
        mockHubConnectionBuilder,
        mockHubConnection,
        cleanup,
    };
}

/**
 * Provides common test data and utilities
 */
export const TestData = {
    notifications: {
        eventRegistration: NotificationDataFactory.createNotification(
            NotificationType.EventRegistration
        ),
        paymentCompleted: NotificationDataFactory.createNotification(
            NotificationType.PaymentCompleted
        ),
        systemMaintenance: NotificationDataFactory.createNotification(
            NotificationType.SystemMaintenance
        ),
        batch: NotificationDataFactory.createNotificationBatch(5),
        priorities: NotificationDataFactory.createPriorityNotifications(),
        errors: NotificationDataFactory.createErrorNotifications(),
    },
    errors: {
        auth: SignalRErrorFactory.createAuthError(),
        connection: SignalRErrorFactory.createConnectionError(),
        network: SignalRErrorFactory.createNetworkError(),
        hubMethod: SignalRErrorFactory.createHubMethodError(),
    },
    users: {
        testUser: 'test-user-123',
        organizer: 'organizer-456',
        admin: 'admin-789',
    },
    groups: ['User', 'Organizer', 'Admin'],
};

const signalRMocksDefault = {
    MockHubConnection,
    createMockUseSignalR,
    NotificationDataFactory,
    SignalRErrorFactory,
    ConnectionStateSimulator,
    SignalRTestUtils,
    setupSignalRMocks,
    TestData,
};

export default signalRMocksDefault;

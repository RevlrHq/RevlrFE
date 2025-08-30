/**
 * SignalR Test Service
 *
 * Provides comprehensive testing capabilities for the SignalR notification system.
 * This service includes API endpoints for sending test notifications, validating
 * connections, and monitoring system health.
 */

import {
    NotificationType,
    NotificationPriority,
    SignalRConnectionState,
    SignalRError,
    SignalRErrorType,
    ConnectionHealthStatus,
} from '@/types/notifications';

// ============================================================================
// Missing Types and Helper Functions
// ============================================================================

interface NotificationMessage {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    data: Record<string, unknown>;
    timestamp: string;
}

function createTestNotificationDataByType(
    type: NotificationType,
    customData?: Record<string, unknown>
): Record<string, unknown> {
    const baseData = {
        testId: `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...customData,
    };

    switch (type) {
        case NotificationType.EventRegistration:
            return { ...baseData, eventId: 'test-event-123', userId: 'test-user' };
        case NotificationType.PaymentCompleted:
            return { ...baseData, paymentId: 'test-payment-123', amount: 100 };
        default:
            return baseData;
    }
}

function createTestNotificationMessage(params: {
    type: NotificationType;
    priority: NotificationPriority;
    data: Record<string, unknown>;
}): NotificationMessage {
    return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: params.type,
        priority: params.priority,
        data: params.data,
        timestamp: new Date().toISOString(),
    };
}

// ============================================================================
// Test Service Configuration
// ============================================================================

interface SignalRTestConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
    retryAttempts: number;
}

interface TestNotificationRequest {
    type: NotificationType;
    userId?: string;
    priority?: NotificationPriority;
    customData?: Record<string, unknown>;
    delay?: number;
}

interface BatchTestRequest {
    notifications: TestNotificationRequest[];
    batchSize?: number;
    intervalMs?: number;
}

interface ConnectionTestRequest {
    userId?: string;
    groupTypes?: string[];
    testDuration?: number;
}

interface ValidationTestRequest {
    tokenToValidate?: string;
    expectedUserId?: string;
    expectedRoles?: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

interface TestNotificationResponse {
    notificationId: string;
    sent: boolean;
    deliveredTo: string[];
    error?: string;
}

interface ConnectionStatusResponse {
    connectionId: string;
    state: SignalRConnectionState;
    connectedAt: string;
    userId?: string;
    groups: string[];
    lastActivity: string;
}

interface ValidationResponse {
    isValid: boolean;
    userId?: string;
    roles?: string[];
    expiresAt?: string;
    error?: string;
}

interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
        database: boolean;
        signalr: boolean;
        authentication: boolean;
        notifications: boolean;
    };
    latency: number;
    uptime: number;
    version: string;
}

// ============================================================================
// SignalR Test Service Class
// ============================================================================

export class SignalRTestService {
    private config: SignalRTestConfig;
    private baseHeaders: Record<string, string>;

    constructor(config: Partial<SignalRTestConfig> = {}) {
        this.config = {
            baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
            timeout: 10000,
            retryAttempts: 3,
            ...config,
        };

        this.baseHeaders = {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        };
    }

    // ============================================================================
    // Test Notification Methods
    // ============================================================================

    /**
     * Sends a test notification of the specified type
     */
    async sendTestNotification(
        request: TestNotificationRequest
    ): Promise<TestNotificationResponse> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/notification`;

        const testData = createTestNotificationDataByType(
            request.type,
            request.customData
        );

        const notification = createTestNotificationMessage({
            type: request.type,
            priority: request.priority || NotificationPriority.Normal,
            data: testData,
        });

        const payload = {
            notification,
            userId: request.userId,
            delay: request.delay || 0,
        };

        try {
            const response = await this.makeRequest<TestNotificationResponse>(
                endpoint,
                'POST',
                payload
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to send test notification: ${error}`);
        }
    }

    /**
     * Sends multiple test notifications in a batch
     */
    async sendBatchTestNotifications(
        request: BatchTestRequest
    ): Promise<TestNotificationResponse[]> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/batch`;

        const notifications = request.notifications.map((notifRequest) => {
            const testData = createTestNotificationDataByType(
                notifRequest.type,
                notifRequest.customData
            );

            return createTestNotificationMessage({
                type: notifRequest.type,
                priority: notifRequest.priority || NotificationPriority.Normal,
                data: testData,
            });
        });

        const payload = {
            notifications,
            batchSize: request.batchSize || 10,
            intervalMs: request.intervalMs || 1000,
        };

        try {
            const response = await this.makeRequest<TestNotificationResponse[]>(
                endpoint,
                'POST',
                payload
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to send batch notifications: ${error}`);
        }
    }

    /**
     * Sends test notifications for all notification types
     */
    async sendAllNotificationTypes(
        userId?: string,
        priority: NotificationPriority = NotificationPriority.Normal
    ): Promise<TestNotificationResponse[]> {
        const requests: TestNotificationRequest[] = Object.values(
            NotificationType
        ).map((type) => ({
            type,
            userId,
            priority,
        }));

        return this.sendBatchTestNotifications({
            notifications: requests,
            batchSize: 5,
            intervalMs: 500,
        });
    }

    // ============================================================================
    // Connection Testing Methods
    // ============================================================================

    /**
     * Tests SignalR connection status
     */
    async testConnection(
        request: ConnectionTestRequest = {}
    ): Promise<ConnectionStatusResponse> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/connection`;

        const payload = {
            userId: request.userId,
            groupTypes: request.groupTypes || ['User'],
            testDuration: request.testDuration || 5000,
        };

        try {
            const response = await this.makeRequest<ConnectionStatusResponse>(
                endpoint,
                'POST',
                payload
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to test connection: ${error}`);
        }
    }

    /**
     * Gets current connection status for a user
     */
    async getConnectionStatus(
        userId?: string
    ): Promise<ConnectionStatusResponse[]> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/status`;
        const url = userId ? `${endpoint}?userId=${userId}` : endpoint;

        try {
            const response = await this.makeRequest<ConnectionStatusResponse[]>(
                url,
                'GET'
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to get connection status: ${error}`);
        }
    }

    /**
     * Tests group membership functionality
     */
    async testGroupMembership(
        userId: string,
        groupTypes: string[]
    ): Promise<{ joined: string[]; failed: string[] }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/groups`;

        const payload = {
            userId,
            groupTypes,
        };

        try {
            const response = await this.makeRequest<{
                joined: string[];
                failed: string[];
            }>(endpoint, 'POST', payload);

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to test group membership: ${error}`);
        }
    }

    // ============================================================================
    // Authentication and Validation Methods
    // ============================================================================

    /**
     * Validates JWT token for SignalR authentication
     */
    async validateToken(
        request: ValidationTestRequest = {}
    ): Promise<ValidationResponse> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/validate-token`;

        const payload = {
            token: request.tokenToValidate,
            expectedUserId: request.expectedUserId,
            expectedRoles: request.expectedRoles,
        };

        try {
            const response = await this.makeRequest<ValidationResponse>(
                endpoint,
                'POST',
                payload
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to validate token: ${error}`);
        }
    }

    /**
     * Tests authentication flow for SignalR
     */
    async testAuthentication(
        userId: string,
        token?: string
    ): Promise<{
        authenticated: boolean;
        userId?: string;
        roles?: string[];
        error?: string;
    }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/auth`;

        const payload = {
            userId,
            token,
        };

        try {
            const response = await this.makeRequest<{
                authenticated: boolean;
                userId?: string;
                roles?: string[];
                error?: string;
            }>(endpoint, 'POST', payload);

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to test authentication: ${error}`);
        }
    }

    // ============================================================================
    // Health Check and Monitoring Methods
    // ============================================================================

    /**
     * Performs comprehensive health check
     */
    async healthCheck(): Promise<HealthCheckResponse> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/health`;

        try {
            const response = await this.makeRequest<HealthCheckResponse>(
                endpoint,
                'GET'
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to perform health check: ${error}`);
        }
    }

    /**
     * Gets connection health status
     */
    async getConnectionHealth(
        connectionId?: string
    ): Promise<ConnectionHealthStatus> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/connection-health`;
        const url = connectionId
            ? `${endpoint}?connectionId=${connectionId}`
            : endpoint;

        try {
            const response = await this.makeRequest<ConnectionHealthStatus>(
                url,
                'GET'
            );

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to get connection health: ${error}`);
        }
    }

    /**
     * Tests notification delivery performance
     */
    async testNotificationPerformance(
        notificationCount: number = 100,
        concurrency: number = 10
    ): Promise<{
        totalSent: number;
        totalDelivered: number;
        averageLatency: number;
        failureRate: number;
        errors: string[];
    }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/performance`;

        const payload = {
            notificationCount,
            concurrency,
        };

        try {
            const response = await this.makeRequest<{
                totalSent: number;
                totalDelivered: number;
                averageLatency: number;
                failureRate: number;
                errors: string[];
            }>(endpoint, 'POST', payload);

            return response.data!;
        } catch (error) {
            throw new Error(
                `Failed to test notification performance: ${error}`
            );
        }
    }

    // ============================================================================
    // Error Simulation Methods
    // ============================================================================

    /**
     * Simulates various error conditions for testing error handling
     */
    async simulateError(
        errorType: SignalRErrorType,
        userId?: string
    ): Promise<{ simulated: boolean; error?: SignalRError }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/simulate-error`;

        const payload = {
            errorType,
            userId,
        };

        try {
            const response = await this.makeRequest<{
                simulated: boolean;
                error?: SignalRError;
            }>(endpoint, 'POST', payload);

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to simulate error: ${error}`);
        }
    }

    /**
     * Tests error recovery mechanisms
     */
    async testErrorRecovery(
        errorType: SignalRErrorType,
        userId?: string
    ): Promise<{
        errorSimulated: boolean;
        recoverySuccessful: boolean;
        recoveryTime: number;
        steps: string[];
    }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/error-recovery`;

        const payload = {
            errorType,
            userId,
        };

        try {
            const response = await this.makeRequest<{
                errorSimulated: boolean;
                recoverySuccessful: boolean;
                recoveryTime: number;
                steps: string[];
            }>(endpoint, 'POST', payload);

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to test error recovery: ${error}`);
        }
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Clears all test data and resets the test environment
     */
    async resetTestEnvironment(): Promise<{ reset: boolean; message: string }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/reset`;

        try {
            const response = await this.makeRequest<{
                reset: boolean;
                message: string;
            }>(endpoint, 'POST');

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to reset test environment: ${error}`);
        }
    }

    /**
     * Gets test statistics and metrics
     */
    async getTestStatistics(): Promise<{
        totalNotificationsSent: number;
        totalConnectionsActive: number;
        totalErrorsSimulated: number;
        averageResponseTime: number;
        uptime: number;
        lastReset: string;
    }> {
        const endpoint = `${this.config.baseUrl}/api/signalr/test/statistics`;

        try {
            const response = await this.makeRequest<{
                totalNotificationsSent: number;
                totalConnectionsActive: number;
                totalErrorsSimulated: number;
                averageResponseTime: number;
                uptime: number;
                lastReset: string;
            }>(endpoint, 'GET');

            return response.data!;
        } catch (error) {
            throw new Error(`Failed to get test statistics: ${error}`);
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Makes HTTP request with retry logic and error handling
     */
    private async makeRequest<T>(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: unknown,
        attempt: number = 1
    ): Promise<ApiResponse<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.timeout
        );

        try {
            const options: RequestInit = {
                method,
                headers: this.baseHeaders,
                signal: controller.signal,
            };

            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            return data as ApiResponse<T>;
        } catch (error) {
            clearTimeout(timeoutId);

            if (attempt < this.config.retryAttempts) {
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.makeRequest<T>(url, method, body, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Validates service configuration
     */
    private validateConfig(): void {
        if (!this.config.baseUrl) {
            throw new Error('Base URL is required for SignalR test service');
        }

        if (this.config.timeout <= 0) {
            throw new Error('Timeout must be greater than 0');
        }

        if (this.config.retryAttempts < 0) {
            throw new Error('Retry attempts cannot be negative');
        }
    }
}

// ============================================================================
// Factory Functions and Utilities
// ============================================================================

/**
 * Creates a configured SignalR test service instance
 */
export function createSignalRTestService(
    config: Partial<SignalRTestConfig> = {}
): SignalRTestService {
    return new SignalRTestService(config);
}

/**
 * Creates test requests for common scenarios
 */
export const TestScenarios = {
    /**
     * Creates requests for testing all event notification types
     */
    eventNotifications: (userId?: string): TestNotificationRequest[] => [
        { type: NotificationType.EventRegistration, userId },
        { type: NotificationType.EventUpdate, userId },
        { type: NotificationType.EventPublished, userId },
        { type: NotificationType.EventCancelled, userId },
    ],

    /**
     * Creates requests for testing all payment notification types
     */
    paymentNotifications: (userId?: string): TestNotificationRequest[] => [
        { type: NotificationType.PaymentCompleted, userId },
        { type: NotificationType.PaymentFailed, userId },
        { type: NotificationType.PaymentPending, userId },
        { type: NotificationType.RecurringPaymentProcessed, userId },
    ],

    /**
     * Creates requests for testing all financing notification types
     */
    financingNotifications: (userId?: string): TestNotificationRequest[] => [
        { type: NotificationType.FinancingApplicationSubmitted, userId },
        { type: NotificationType.FinancingApplicationApproved, userId },
        { type: NotificationType.FinancingApplicationRejected, userId },
        { type: NotificationType.FinancingPaymentDue, userId },
    ],

    /**
     * Creates requests for testing all system notification types
     */
    systemNotifications: (userId?: string): TestNotificationRequest[] => [
        { type: NotificationType.SystemMaintenance, userId },
        { type: NotificationType.SystemUpdate, userId },
    ],

    /**
     * Creates requests for testing high-priority notifications
     */
    highPriorityNotifications: (userId?: string): TestNotificationRequest[] => [
        {
            type: NotificationType.PaymentFailed,
            userId,
            priority: NotificationPriority.High,
        },
        {
            type: NotificationType.EventCancelled,
            userId,
            priority: NotificationPriority.Critical,
        },
        {
            type: NotificationType.SystemMaintenance,
            userId,
            priority: NotificationPriority.High,
        },
    ],

    /**
     * Creates requests for load testing
     */
    loadTestNotifications: (
        count: number,
        userId?: string
    ): TestNotificationRequest[] => {
        const types = Object.values(NotificationType);
        return Array.from({ length: count }, (_, i) => ({
            type: types[i % types.length],
            userId,
            priority: NotificationPriority.Normal,
        }));
    },
};

/**
 * Default test service instance
 */
export const signalRTestService = createSignalRTestService();

export default SignalRTestService;

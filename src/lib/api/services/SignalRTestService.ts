/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BroadcastNotificationRequest } from '../models/BroadcastNotificationRequest';
import type { PerformanceTestRequest } from '../models/PerformanceTestRequest';
import type { SendGroupNotificationRequest } from '../models/SendGroupNotificationRequest';
import type { SendNotificationRequest } from '../models/SendNotificationRequest';
import type { TestEventNotificationRequest } from '../models/TestEventNotificationRequest';
import type { TestFinancingNotificationRequest } from '../models/TestFinancingNotificationRequest';
import type { TestNotificationRequest } from '../models/TestNotificationRequest';
import type { TestPaymentNotificationRequest } from '../models/TestPaymentNotificationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SignalRTestService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestTestUserNotification({
        requestBody,
    }: {
        requestBody: TestNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/test-user-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestTestOrganizerNotification({
        requestBody,
    }: {
        requestBody: TestNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/test-organizer-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestConnectionStatus(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/connection-status',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestValidateToken(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/validate-token',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestNotificationSchemas(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/notification-schemas',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestTestEventNotification({
        requestBody,
    }: {
        requestBody: TestEventNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/test-event-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestTestPaymentNotification({
        requestBody,
    }: {
        requestBody: TestPaymentNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/test-payment-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestTestFinancingNotification({
        requestBody,
    }: {
        requestBody: TestFinancingNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/test-financing-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestSendNotification({
        requestBody,
    }: {
        requestBody: SendNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/send-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestSendGroupNotification({
        requestBody,
    }: {
        requestBody: SendGroupNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/send-group-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestBroadcastNotification({
        requestBody,
    }: {
        requestBody: BroadcastNotificationRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/broadcast-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestConnectedUsers(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/connected-users',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestConnectionDetails(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/connection-details',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestUserConnectionStatus({
        userId,
    }: {
        userId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/user-connection-status/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestNotificationHistory({
        limit = 50,
        userId = null,
    }: {
        limit?: number,
        userId?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/notification-history',
            query: {
                'limit': limit,
                'userId': userId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiSignalRTestNotificationHistory(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/SignalRTest/notification-history',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestDisconnectUser({
        userId,
    }: {
        userId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/disconnect-user/{userId}',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestPerformanceMetrics(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/performance-metrics',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestThroughputMetrics(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/throughput-metrics',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestConnectionStats(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/connection-stats',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiSignalRTestPerformanceTest({
        requestBody,
    }: {
        requestBody: PerformanceTestRequest,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/SignalRTest/performance-test',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiSignalRTestSystemStats(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/SignalRTest/system-stats',
        });
    }
}

/**
 * Tests for SignalR debugging utilities
 *
 * Tests the comprehensive debugging capabilities including logging,
 * connection monitoring, and performance tracking.
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
    SignalRDebugLogger,
    SignalRConnectionMonitor,
    createSignalRDebugLogger,
    createSignalRConnectionMonitor,
} from '@/lib/utils/signalr-debug';
import {
    SignalRConnectionState,
    SignalRErrorType,
    NotificationType,
    NotificationPriority,
    createTestNotificationMessage,
    createTestSignalRError,
} from '@/types/notifications';

describe('SignalRDebugLogger', () => {
    let logger: SignalRDebugLogger;
    let consoleSpy: any;

    beforeEach(() => {
        logger = createSignalRDebugLogger({
            enabled: true,
            verboseLogging: true,
            logToConsole: false, // Disable console for tests
            logToStorage: false, // Disable storage for tests
            maxLogEntries: 100,
        });

        // Clear initialization logs
        logger.clear();

        consoleSpy = {
            debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
            info: jest.spyOn(console, 'info').mockImplementation(() => {}),
            warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
            error: jest.spyOn(console, 'error').mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // ============================================================================
    // Basic Logging Tests
    // ============================================================================

    describe('Basic Logging', () => {
        it('should log debug messages', () => {
            logger.debug('connection', 'Test debug message', { test: true });

            const logs = logger.getLogs('debug');
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('debug');
            expect(logs[0].category).toBe('connection');
            expect(logs[0].message).toBe('Test debug message');
            expect(logs[0].data).toEqual({ test: true });
            expect(consoleSpy.debug).toHaveBeenCalled();
        });

        it('should log info messages', () => {
            logger.info('notification', 'Test info message', {
                userId: 'user-123',
            });

            const logs = logger.getLogs('info');
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('info');
            expect(logs[0].category).toBe('notification');
            expect(logs[0].message).toBe('Test info message');
            expect(consoleSpy.info).toHaveBeenCalled();
        });

        it('should log warning messages', () => {
            logger.warn('error', 'Test warning message');

            const logs = logger.getLogs('warn');
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('warn');
            expect(logs[0].category).toBe('error');
            expect(logs[0].message).toBe('Test warning message');
            expect(consoleSpy.warn).toHaveBeenCalled();
        });

        it('should log error messages', () => {
            logger.error('auth', 'Test error message', { errorCode: 401 });

            const logs = logger.getLogs('error');
            expect(logs).toHaveLength(1);
            expect(logs[0].level).toBe('error');
            expect(logs[0].category).toBe('auth');
            expect(logs[0].message).toBe('Test error message');
            expect(logs[0].data).toEqual({ errorCode: 401 });
            expect(consoleSpy.error).toHaveBeenCalled();
        });

        it('should include connection and user IDs in logs', () => {
            logger.info(
                'connection',
                'Connection established',
                {},
                'conn-123',
                'user-456'
            );

            const logs = logger.getLogs();
            expect(logs[0].connectionId).toBe('conn-123');
            expect(logs[0].userId).toBe('user-456');
        });

        it('should not log when disabled', () => {
            const disabledLogger = createSignalRDebugLogger({ enabled: false });
            disabledLogger.info('test', 'This should not be logged');

            const logs = disabledLogger.getLogs();
            expect(logs).toHaveLength(0);
        });
    });

    // ============================================================================
    // Connection Monitoring Tests
    // ============================================================================

    describe('Connection Monitoring', () => {
        it('should log connection state changes', () => {
            logger.logConnectionStateChange(
                'conn-123',
                SignalRConnectionState.Connecting,
                SignalRConnectionState.Connected,
                'user-123'
            );

            const logs = logger.getLogs('info', 'connection');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toContain('Connection state changed');
            expect(logs[0].data.connectionId).toBe('conn-123');
            expect(logs[0].data.userId).toBe('user-123');

            const events = logger.getConnectionEvents();
            expect(events).toHaveLength(1);
            expect(events[0].connectionId).toBe('conn-123');
            expect(events[0].previousState).toBe(
                SignalRConnectionState.Connecting
            );
            expect(events[0].newState).toBe(SignalRConnectionState.Connected);
        });

        it('should log connection attempts', () => {
            logger.logConnectionAttempt('conn-456', 'user-789');

            const logs = logger.getLogs('info', 'connection');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Connection attempt started');
            expect(logs[0].connectionId).toBe('conn-456');
            expect(logs[0].userId).toBe('user-789');
        });

        it('should log successful connections with performance metrics', () => {
            logger.logConnectionSuccess('conn-789', 'user-123', 250);

            const logs = logger.getLogs('info', 'connection');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Connection established successfully');
            expect(logs[0].data.duration).toBe(250);

            const metrics = logger.getPerformanceMetrics(
                'connection_establish'
            );
            expect(metrics).toHaveLength(1);
            expect(metrics[0].duration).toBe(250);
            expect(metrics[0].success).toBe(true);
        });

        it('should log connection failures with error details', () => {
            const error = createTestSignalRError({
                type: SignalRErrorType.Connection,
                message: 'Connection timeout',
            });

            logger.logConnectionFailure('conn-fail', error, 'user-123', 5000);

            const logs = logger.getLogs('error', 'connection');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Connection failed');
            expect(logs[0].data.error).toEqual(error);

            const metrics = logger.getPerformanceMetrics(
                'connection_establish'
            );
            expect(metrics).toHaveLength(1);
            expect(metrics[0].success).toBe(false);
        });
    });

    // ============================================================================
    // Notification Monitoring Tests
    // ============================================================================

    describe('Notification Monitoring', () => {
        it('should log notification received', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                priority: NotificationPriority.High,
            });

            logger.logNotificationReceived(
                notification,
                'conn-123',
                'user-456'
            );

            const logs = logger.getLogs('info', 'notification');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toContain(
                'Notification received: EventRegistration'
            );
            expect(logs[0].data.type).toBe(NotificationType.EventRegistration);
            expect(logs[0].data.priority).toBe(NotificationPriority.High);
        });

        it('should log notification processing', () => {
            logger.logNotificationProcessing(
                'notif-123',
                'PaymentCompleted',
                'conn-456',
                'user-789'
            );

            const logs = logger.getLogs('debug', 'notification');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe(
                'Processing notification: PaymentCompleted'
            );
            expect(logs[0].data.notificationId).toBe('notif-123');
        });

        it('should log successful notification processing with metrics', () => {
            logger.logNotificationProcessed(
                'notif-456',
                'EventUpdate',
                150,
                true,
                'conn-789'
            );

            const logs = logger.getLogs('info', 'notification');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe(
                'Notification processed successfully: EventUpdate'
            );
            expect(logs[0].data.duration).toBe(150);
            expect(logs[0].data.success).toBe(true);

            const metrics = logger.getPerformanceMetrics(
                'notification_processing'
            );
            expect(metrics).toHaveLength(1);
            expect(metrics[0].duration).toBe(150);
            expect(metrics[0].success).toBe(true);
        });

        it('should log failed notification processing', () => {
            logger.logNotificationProcessed(
                'notif-fail',
                'SystemUpdate',
                300,
                false
            );

            const logs = logger.getLogs('warn', 'notification');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe(
                'Notification processing failed: SystemUpdate'
            );
            expect(logs[0].data.success).toBe(false);
        });
    });

    // ============================================================================
    // Error Monitoring Tests
    // ============================================================================

    describe('Error Monitoring', () => {
        it('should log SignalR errors', () => {
            const error = createTestSignalRError({
                type: SignalRErrorType.Authentication,
                message: 'Token expired',
                canRetry: true,
                retryCount: 2,
            });

            logger.logSignalRError(error, 'conn-123', 'user-456');

            const logs = logger.getLogs('error', 'error');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toContain(
                'SignalR Error [Authentication]: Token expired'
            );
            expect(logs[0].data.errorType).toBe(
                SignalRErrorType.Authentication
            );
            expect(logs[0].data.canRetry).toBe(true);
            expect(logs[0].data.retryCount).toBe(2);
        });

        it('should log authentication errors', () => {
            logger.logAuthenticationError(
                'Invalid token format',
                { token: 'invalid' },
                'conn-789'
            );

            const logs = logger.getLogs('error', 'auth');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe(
                'Authentication Error: Invalid token format'
            );
            expect(logs[0].data).toEqual({ token: 'invalid' });
        });

        it('should log group management errors', () => {
            logger.logGroupError(
                'join',
                'User_user-123',
                'Permission denied',
                'conn-456',
                'user-123'
            );

            const logs = logger.getLogs('error', 'group');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe(
                'Group join failed for User_user-123: Permission denied'
            );
            expect(logs[0].data.operation).toBe('join');
            expect(logs[0].data.groupId).toBe('User_user-123');
        });
    });

    // ============================================================================
    // Performance Tracking Tests
    // ============================================================================

    describe('Performance Tracking', () => {
        it('should track operation performance', () => {
            const operationId = 'op-123';
            logger.startPerformanceTracking(operationId, 'test_operation');

            // Simulate some work
            const duration = logger.endPerformanceTracking(operationId, true, {
                testData: 'value',
            });

            expect(duration).toBeGreaterThan(0);

            const metrics = logger.getPerformanceMetrics('test_operation');
            expect(metrics).toHaveLength(1);
            expect(metrics[0].operation).toBe('test_operation');
            expect(metrics[0].success).toBe(true);
            expect(metrics[0].metadata).toEqual({ testData: 'value' });
        });

        it('should handle missing operation tracking', () => {
            const duration = logger.endPerformanceTracking(
                'non-existent',
                true
            );
            expect(duration).toBeUndefined();

            const logs = logger.getLogs('warn', 'performance');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toContain('No active operation found');
        });

        it('should track failed operations', () => {
            const operationId = 'op-fail';
            logger.startPerformanceTracking(operationId, 'failing_operation');
            logger.endPerformanceTracking(operationId, false);

            const metrics = logger.getPerformanceMetrics('failing_operation');
            expect(metrics).toHaveLength(1);
            expect(metrics[0].success).toBe(false);
        });
    });

    // ============================================================================
    // Data Retrieval Tests
    // ============================================================================

    describe('Data Retrieval', () => {
        beforeEach(() => {
            // Add some test data
            logger.info('connection', 'Connection test');
            logger.warn('notification', 'Notification warning');
            logger.error('auth', 'Auth error');
            logger.debug('performance', 'Performance debug');
        });

        it('should filter logs by level', () => {
            const errorLogs = logger.getLogs('error');
            expect(errorLogs).toHaveLength(1);
            expect(errorLogs[0].level).toBe('error');

            const infoLogs = logger.getLogs('info');
            expect(infoLogs).toHaveLength(1);
            expect(infoLogs[0].level).toBe('info');
        });

        it('should filter logs by category', () => {
            const connectionLogs = logger.getLogs(undefined, 'connection');
            expect(connectionLogs).toHaveLength(1);
            expect(connectionLogs[0].category).toBe('connection');

            const authLogs = logger.getLogs(undefined, 'auth');
            expect(authLogs).toHaveLength(1);
            expect(authLogs[0].category).toBe('auth');
        });

        it('should limit log results', () => {
            const limitedLogs = logger.getLogs(undefined, undefined, 2);
            expect(limitedLogs).toHaveLength(2);
        });

        it('should return logs in reverse chronological order', () => {
            const logs = logger.getLogs();
            expect(logs).toHaveLength(4);

            // Should be sorted by timestamp descending
            for (let i = 1; i < logs.length; i++) {
                expect(logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
                    logs[i].timestamp.getTime()
                );
            }
        });
    });

    // ============================================================================
    // Statistics Tests
    // ============================================================================

    describe('Statistics', () => {
        beforeEach(() => {
            // Add test data
            logger.info('connection', 'Info 1');
            logger.info('notification', 'Info 2');
            logger.warn('error', 'Warning 1');
            logger.error('auth', 'Error 1');
            logger.error('group', 'Error 2');

            // Add performance metrics
            logger.startPerformanceTracking('op1', 'operation_a');
            logger.endPerformanceTracking('op1', true);
            logger.startPerformanceTracking('op2', 'operation_b');
            logger.endPerformanceTracking('op2', false);
        });

        it('should calculate statistics correctly', () => {
            const stats = logger.getStatistics();

            expect(stats.totalLogs).toBe(5);
            expect(stats.logsByLevel.info).toBe(2);
            expect(stats.logsByLevel.warn).toBe(1);
            expect(stats.logsByLevel.error).toBe(2);
            expect(stats.logsByCategory.connection).toBe(1);
            expect(stats.logsByCategory.notification).toBe(1);
            expect(stats.logsByCategory.error).toBe(1);
            expect(stats.logsByCategory.auth).toBe(1);
            expect(stats.logsByCategory.group).toBe(1);
            expect(stats.totalPerformanceMetrics).toBe(2);
            expect(stats.errorRate).toBe(0.4); // 2 errors out of 5 logs
        });

        it('should calculate average operation times', () => {
            const stats = logger.getStatistics();

            expect(stats.averageOperationTime.operation_a).toBeGreaterThan(0);
            expect(stats.averageOperationTime.operation_b).toBeGreaterThan(0);
        });
    });

    // ============================================================================
    // Utility Methods Tests
    // ============================================================================

    describe('Utility Methods', () => {
        it('should clear all debug data', () => {
            logger.info('test', 'Test message');
            logger.startPerformanceTracking('op1', 'test_op');
            logger.endPerformanceTracking('op1', true);

            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getPerformanceMetrics()).toHaveLength(1);

            logger.clear();

            expect(logger.getLogs()).toHaveLength(1); // Clear message itself
            expect(logger.getPerformanceMetrics()).toHaveLength(0);
        });

        it('should export debug data', () => {
            logger.info('test', 'Test message');

            const exportData = logger.exportData();

            expect(exportData.logs).toHaveLength(1);
            expect(exportData.statistics).toBeDefined();
            expect(exportData.exportedAt).toBeInstanceOf(Date);
        });

        it('should update configuration', () => {
            logger.updateConfig({ verboseLogging: false, maxLogEntries: 50 });

            const logs = logger.getLogs('info', 'debug');
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Debug configuration updated');
            expect(logs[0].data.verboseLogging).toBe(false);
            expect(logs[0].data.maxLogEntries).toBe(50);
        });
    });
});

// ============================================================================
// SignalRConnectionMonitor Tests
// ============================================================================

describe('SignalRConnectionMonitor', () => {
    let logger: SignalRDebugLogger;
    let monitor: SignalRConnectionMonitor;

    beforeEach(() => {
        logger = createSignalRDebugLogger({
            enabled: true,
            logToConsole: false,
        });
        monitor = createSignalRConnectionMonitor(logger);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should start monitoring a connection', () => {
        jest.useFakeTimers();

        monitor.startMonitoring('conn-123', 1000);

        const healthStatus = monitor.getHealthStatus('conn-123');
        expect(healthStatus).toBeDefined();
        expect(healthStatus?.isHealthy).toBe(true);
        expect(healthStatus?.consecutiveFailures).toBe(0);

        jest.useRealTimers();
    });

    it('should stop monitoring a connection', () => {
        monitor.startMonitoring('conn-456');
        expect(monitor.getHealthStatus('conn-456')).toBeDefined();

        monitor.stopMonitoring('conn-456');
        expect(monitor.getHealthStatus('conn-456')).toBeUndefined();
    });

    it('should update health status', () => {
        monitor.startMonitoring('conn-789');

        monitor.updateHealthStatus('conn-789', true, 50);
        let healthStatus = monitor.getHealthStatus('conn-789');
        expect(healthStatus?.isHealthy).toBe(true);
        expect(healthStatus?.latency).toBe(50);
        expect(healthStatus?.consecutiveFailures).toBe(0);

        monitor.updateHealthStatus(
            'conn-789',
            false,
            undefined,
            'Connection timeout'
        );
        healthStatus = monitor.getHealthStatus('conn-789');
        expect(healthStatus?.isHealthy).toBe(false);
        expect(healthStatus?.consecutiveFailures).toBe(1);
    });

    it('should track multiple connections', () => {
        monitor.startMonitoring('conn-1');
        monitor.startMonitoring('conn-2');
        monitor.startMonitoring('conn-3');

        const allStatuses = monitor.getAllHealthStatuses();
        expect(allStatuses.size).toBe(3);
        expect(allStatuses.has('conn-1')).toBe(true);
        expect(allStatuses.has('conn-2')).toBe(true);
        expect(allStatuses.has('conn-3')).toBe(true);
    });

    it('should handle health status for non-existent connection', () => {
        monitor.updateHealthStatus('non-existent', true, 100);

        const healthStatus = monitor.getHealthStatus('non-existent');
        expect(healthStatus).toBeUndefined();
    });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
    it('should create SignalR debug logger with default config', () => {
        const logger = createSignalRDebugLogger();
        expect(logger).toBeInstanceOf(SignalRDebugLogger);
    });

    it('should create SignalR debug logger with custom config', () => {
        const logger = createSignalRDebugLogger({
            enabled: false,
            maxLogEntries: 500,
            verboseLogging: false,
        });
        expect(logger).toBeInstanceOf(SignalRDebugLogger);
    });

    it('should create SignalR connection monitor', () => {
        const logger = createSignalRDebugLogger();
        const monitor = createSignalRConnectionMonitor(logger);
        expect(monitor).toBeInstanceOf(SignalRConnectionMonitor);
    });
});

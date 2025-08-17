/**
 * Tests for ErrorLogger functionality
 */

import { ErrorLogger } from '@/lib/error-handling/ErrorLogger';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock console methods
const consoleMock = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    info: jest.fn(),
};
Object.defineProperty(console, 'error', { value: consoleMock.error });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });
Object.defineProperty(console, 'log', { value: consoleMock.log });
Object.defineProperty(console, 'group', { value: consoleMock.group });
Object.defineProperty(console, 'groupEnd', { value: consoleMock.groupEnd });
Object.defineProperty(console, 'info', { value: consoleMock.info });

describe('ErrorLogger', () => {
    let errorLogger: ErrorLogger;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);

        // Get fresh instance
        errorLogger = ErrorLogger.getInstance();
        errorLogger.clearLogs();
    });

    afterEach(() => {
        errorLogger.clearLogs();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = ErrorLogger.getInstance();
            const instance2 = ErrorLogger.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Error Logging', () => {
        it('should log errors with context', () => {
            const error = new Error('Test error');
            const context = {
                component: 'TestComponent',
                action: 'test_action',
                userId: 'user123',
            };

            errorLogger.logError(error, context, 'high');

            const logs = errorLogger.getRecentLogs(1);
            expect(logs).toHaveLength(1);
            expect(logs[0].error).toBe(error);
            expect(logs[0].context.component).toBe('TestComponent');
            expect(logs[0].severity).toBe('high');
        });

        it('should log API errors with specific context', () => {
            const error = new Error('API Error');

            errorLogger.logApiError(error, '/api/dashboard', 'GET', 500, {
                message: 'Server error',
            });

            const logs = errorLogger.getRecentLogs(1);
            expect(logs).toHaveLength(1);
            expect(logs[0].context.component).toBe('API');
            expect(logs[0].context.metadata?.endpoint).toBe('/api/dashboard');
            expect(logs[0].context.metadata?.statusCode).toBe(500);
            expect(logs[0].severity).toBe('high'); // 500 status should be high severity
        });

        it('should log component errors', () => {
            const error = new Error('Component error');
            const props = { prop1: 'value1' };
            const state = { state1: 'value1' };

            errorLogger.logComponentError(error, 'TestComponent', props, state);

            const logs = errorLogger.getRecentLogs(1);
            expect(logs).toHaveLength(1);
            expect(logs[0].context.component).toBe('TestComponent');
            expect(logs[0].context.metadata?.props).toEqual(props);
            expect(logs[0].context.metadata?.state).toEqual(state);
        });
    });

    describe('Log Management', () => {
        it('should limit the number of logs stored', () => {
            // Log more than the max limit
            for (let i = 0; i < 1100; i++) {
                errorLogger.logError(new Error(`Error ${i}`));
            }

            const logs = errorLogger.getRecentLogs(2000);
            expect(logs.length).toBeLessThanOrEqual(1000);
        });

        it('should filter logs by severity', () => {
            errorLogger.logError(new Error('Low error'), {}, 'low');
            errorLogger.logError(new Error('High error'), {}, 'high');
            errorLogger.logError(new Error('Medium error'), {}, 'medium');

            const highLogs = errorLogger.getLogsBySeverity('high');
            const lowLogs = errorLogger.getLogsBySeverity('low');

            expect(highLogs).toHaveLength(1);
            expect(lowLogs).toHaveLength(1);
            expect(highLogs[0].error.message).toBe('High error');
        });

        it('should clear all logs', () => {
            errorLogger.logError(new Error('Test error'));
            expect(errorLogger.getRecentLogs()).toHaveLength(1);

            errorLogger.clearLogs();
            expect(errorLogger.getRecentLogs()).toHaveLength(0);
        });
    });

    describe('Local Storage Integration', () => {
        it('should store logs in localStorage', () => {
            const error = new Error('Test error');
            errorLogger.logError(error);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'organizer-error-logs',
                expect.any(String)
            );
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });

            expect(() => {
                errorLogger.logError(new Error('Test error'));
            }).not.toThrow();

            expect(consoleMock.warn).toHaveBeenCalledWith(
                'Failed to store error log locally:',
                expect.any(Error)
            );
        });
    });

    describe('Development vs Production', () => {
        const originalEnv = process.env.NODE_ENV;

        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });

        it('should log to console in development', () => {
            process.env.NODE_ENV = 'development';

            const error = new Error('Test error');
            errorLogger.logError(error, { component: 'Test' }, 'medium');

            expect(consoleMock.group).toHaveBeenCalledWith('🚨 Error [MEDIUM]');
            expect(consoleMock.error).toHaveBeenCalledWith('Error:', error);
            expect(consoleMock.groupEnd).toHaveBeenCalled();
        });

        it('should not log to console in production', () => {
            process.env.NODE_ENV = 'production';

            const error = new Error('Test error');
            errorLogger.logError(error, { component: 'Test' }, 'medium');

            expect(consoleMock.group).not.toHaveBeenCalled();
            expect(consoleMock.info).toHaveBeenCalledWith(
                'Error logged to monitoring service:',
                expect.any(String)
            );
        });
    });

    describe('Export Functionality', () => {
        it('should export logs as JSON string', () => {
            const error = new Error('Test error');
            errorLogger.logError(error, { component: 'Test' });

            const exported = errorLogger.exportLogs();
            const parsed = JSON.parse(exported);

            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(1);
            expect(parsed[0].error.message).toBe('Test error');
        });
    });
});

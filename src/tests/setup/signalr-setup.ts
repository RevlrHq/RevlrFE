/**
 * SignalR Test Setup
 *
 * Jest setup file specifically for SignalR tests.
 * Configures mocks, global test utilities, and common test environment.
 */

import '@testing-library/jest-dom';
import { setupSignalRMocks } from '../utils/signalr-mocks';

// ============================================================================
// Global Mocks
// ============================================================================

// Mock @microsoft/signalr
jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn().mockImplementation(() => ({
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({
            start: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
            invoke: jest.fn().mockResolvedValue('mock-response'),
            send: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
            onclose: jest.fn(),
            onreconnecting: jest.fn(),
            onreconnected: jest.fn(),
            state: 'Connected',
            connectionId: 'mock-connection-id',
        }),
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

// Mock environment variables
process.env.NEXT_PUBLIC_SIGNALR_HUB_URL = 'http://localhost:5000/signalr-hub';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000';
process.env.NODE_ENV = 'test';

// ============================================================================
// Global Test Utilities
// ============================================================================

// Make test utilities available globally
declare global {
    interface CustomMatchers<R = unknown> {
        toBeValidNotification(): R;
        toBeValidSignalRError(): R;
        toHaveNotificationType(type: string): R;
        toHaveNotificationPriority(priority: string): R;
    }

    // eslint-disable-next-line no-var
    var mockSignalRSetup: ReturnType<typeof setupSignalRMocks>;
}

declare module '@jest/expect' {
    interface Matchers<R> extends CustomMatchers<R> {
        // This interface extends CustomMatchers to add custom Jest matchers
        [key: string]: unknown;
    }
}

// ============================================================================
// Custom Jest Matchers
// ============================================================================

expect.extend({
    toBeValidNotification(received) {
        const pass =
            received &&
            typeof received === 'object' &&
            typeof received.id === 'string' &&
            typeof received.type === 'string' &&
            typeof received.title === 'string' &&
            typeof received.message === 'string' &&
            typeof received.timestamp === 'string' &&
            typeof received.priority === 'string';

        if (pass) {
            return {
                message: () =>
                    `expected ${JSON.stringify(received)} not to be a valid notification`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${JSON.stringify(received)} to be a valid notification`,
                pass: false,
            };
        }
    },

    toBeValidSignalRError(received) {
        const pass =
            received &&
            typeof received === 'object' &&
            typeof received.type === 'string' &&
            typeof received.message === 'string' &&
            received.timestamp instanceof Date &&
            typeof received.canRetry === 'boolean';

        if (pass) {
            return {
                message: () =>
                    `expected ${JSON.stringify(received)} not to be a valid SignalR error`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${JSON.stringify(received)} to be a valid SignalR error`,
                pass: false,
            };
        }
    },

    toHaveNotificationType(received, expectedType) {
        const pass = received && received.type === expectedType;

        if (pass) {
            return {
                message: () =>
                    `expected notification not to have type ${expectedType}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected notification to have type ${expectedType}, but got ${received?.type}`,
                pass: false,
            };
        }
    },

    toHaveNotificationPriority(received, expectedPriority) {
        const pass = received && received.priority === expectedPriority;

        if (pass) {
            return {
                message: () =>
                    `expected notification not to have priority ${expectedPriority}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected notification to have priority ${expectedPriority}, but got ${received?.priority}`,
                pass: false,
            };
        }
    },
});

// ============================================================================
// Global Setup and Teardown
// ============================================================================

beforeAll(() => {
    // Setup global SignalR mocks
    global.mockSignalRSetup = setupSignalRMocks();

    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
    // Cleanup global mocks
    if (global.mockSignalRSetup) {
        global.mockSignalRSetup.cleanup();
    }

    // Restore console methods
    jest.restoreAllMocks();
});

beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset mock connection state
    if (global.mockSignalRSetup) {
        global.mockSignalRSetup.mockHubConnection.reset();
    }
});

afterEach(() => {
    // Cleanup after each test
    jest.clearAllTimers();
    jest.useRealTimers();
});

// ============================================================================
// Mock Implementations
// ============================================================================

// Mock fetch for API calls
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () =>
            Promise.resolve({
                success: true,
                data: {},
            }),
    })
) as jest.MockedFunction<typeof fetch>;

// Mock URL.createObjectURL for file exports
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock performance.now for performance tests
global.performance.now = jest.fn(() => Date.now());

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as Storage;

// ============================================================================
// Test Environment Configuration
// ============================================================================

// Configure React Testing Library
import { configure } from '@testing-library/react';

configure({
    testIdAttribute: 'data-testid',
    asyncUtilTimeout: 5000,
});

// Configure Jest timeout for async tests
jest.setTimeout(10000);

// ============================================================================
// Mock Service Worker Setup (if using MSW)
// ============================================================================

// Uncomment if using Mock Service Worker
/*
import { server } from '../mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
*/

// ============================================================================
// Test Data Cleanup
// ============================================================================

// Utility to clean up test data
export const cleanupTestData = () => {
    // Clear any test data that might persist between tests
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Reset any global state
    if (global.mockSignalRSetup) {
        global.mockSignalRSetup.mockHubConnection.reset();
    }
};

// ============================================================================
// Test Helpers
// ============================================================================

// Helper to wait for async operations
export const waitForAsync = (ms: number = 0) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Helper to flush all promises
export const flushPromises = () => new Promise(setImmediate);

// Helper to advance timers and flush promises
export const advanceTimersAndFlush = async (ms: number) => {
    jest.advanceTimersByTime(ms);
    await flushPromises();
};

// ============================================================================
// Export Test Utilities
// ============================================================================

export {
    setupSignalRMocks,
    cleanupTestData,
    waitForAsync,
    flushPromises,
    advanceTimersAndFlush,
};

// ============================================================================
// Console Suppression for Specific Tests
// ============================================================================

// Utility to suppress console output for specific tests
export const suppressConsole = () => {
    const originalConsole = { ...console };

    beforeEach(() => {
        console.log = jest.fn();
        console.warn = jest.fn();
        console.debug = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();
    });

    afterEach(() => {
        Object.assign(console, originalConsole);
    });
};

// Utility to restore console output
export const restoreConsole = () => {
    jest.restoreAllMocks();
};

// ============================================================================
// Memory Leak Detection
// ============================================================================

// Helper to detect potential memory leaks in tests
export const detectMemoryLeaks = () => {
    let initialMemory: number;

    beforeEach(() => {
        if (global.gc) {
            global.gc();
        }
        initialMemory = process.memoryUsage().heapUsed;
    });

    afterEach(() => {
        if (global.gc) {
            global.gc();
        }
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryDelta = finalMemory - initialMemory;
        const memoryDeltaMB = memoryDelta / (1024 * 1024);

        // Warn if memory usage increased significantly
        if (memoryDeltaMB > 10) {
            console.warn(
                `Potential memory leak detected: ${memoryDeltaMB.toFixed(2)}MB increase`
            );
        }
    });
};

// ============================================================================
// Test Debugging Utilities
// ============================================================================

// Helper to debug test state
export const debugTestState = (label: string, data: unknown) => {
    if (process.env.DEBUG_TESTS === 'true') {
        console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
    }
};

// Helper to measure test performance
export const measureTestPerformance = (testName: string) => {
    let startTime: number;

    beforeEach(() => {
        startTime = performance.now();
    });

    afterEach(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (process.env.DEBUG_PERFORMANCE === 'true') {
            console.log(`[PERF] ${testName}: ${duration.toFixed(2)}ms`);
        }

        // Warn if test is slow
        if (duration > 1000) {
            console.warn(
                `Slow test detected: ${testName} took ${duration.toFixed(2)}ms`
            );
        }
    });
};

const signalRSetupDefault = {
    cleanupTestData,
    waitForAsync,
    flushPromises,
    advanceTimersAndFlush,
    suppressConsole,
    restoreConsole,
    detectMemoryLeaks,
    debugTestState,
    measureTestPerformance,
};

export default signalRSetupDefault;

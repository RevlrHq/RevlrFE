/**
 * Jest Configuration for SignalR Tests
 *
 * Specialized Jest configuration for running SignalR-specific tests.
 * This configuration extends the main Jest config with SignalR-specific settings.
 */

const baseConfig = require('./jest.config');

module.exports = {
    ...baseConfig,

    // Test environment
    testEnvironment: 'jsdom',

    // Setup files
    setupFilesAfterEnv: [
        '<rootDir>/src/tests/setup/signalr-setup.ts',
        ...(baseConfig.setupFilesAfterEnv || []),
    ],

    // Test match patterns - only run SignalR tests
    testMatch: [
        '<rootDir>/src/tests/signalr/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/tests/**/*signalr*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/__tests__/**/*signalr*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/?(*.)(signalr.)test.{js,jsx,ts,tsx}',
    ],

    // Module name mapping
    moduleNameMapping: {
        ...baseConfig.moduleNameMapping,
        '^@/tests/(.*)$': '<rootDir>/src/tests/$1',
        '^@/mocks/(.*)$': '<rootDir>/src/tests/mocks/$1',
    },

    // Transform configuration
    transform: {
        ...baseConfig.transform,
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: {
                    jsx: 'react-jsx',
                    esModuleInterop: true,
                    allowSyntheticDefaultImports: true,
                },
            },
        ],
    },

    // Coverage configuration
    collectCoverageFrom: [
        'src/hooks/useSignalR*.{js,jsx,ts,tsx}',
        'src/hooks/useNotification*.{js,jsx,ts,tsx}',
        'src/components/signalr/**/*.{js,jsx,ts,tsx}',
        'src/services/SignalR*.{js,jsx,ts,tsx}',
        'src/providers/SignalR*.{js,jsx,ts,tsx}',
        'src/types/signalr.ts',
        'src/types/notifications.ts',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{js,jsx,ts,tsx}',
        '!src/tests/**/*',
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        './src/hooks/useSignalR.ts': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
        './src/services/SignalRTestService.ts': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
        },
    },

    // Test timeout
    testTimeout: 15000,

    // Global setup and teardown
    globalSetup: '<rootDir>/src/tests/setup/global-setup.js',
    globalTeardown: '<rootDir>/src/tests/setup/global-teardown.js',

    // Module directories
    moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/src/tests'],

    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,

    // Verbose output for debugging
    verbose: process.env.JEST_VERBOSE === 'true',

    // Reporters
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: './coverage/signalr',
                outputName: 'signalr-test-results.xml',
                suiteName: 'SignalR Tests',
            },
        ],
        [
            'jest-html-reporters',
            {
                publicPath: './coverage/signalr',
                filename: 'signalr-test-report.html',
                pageTitle: 'SignalR Test Report',
            },
        ],
    ],

    // Watch mode configuration
    watchPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/coverage/',
        '<rootDir>/.next/',
    ],

    // Error handling
    errorOnDeprecated: true,

    // Performance monitoring
    detectOpenHandles: true,
    detectLeaks: true,

    // Test environment options
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
    },

    // Custom test sequencer for SignalR tests
    testSequencer: '<rootDir>/src/tests/utils/signalr-test-sequencer.js',

    // Max workers for parallel execution
    maxWorkers: process.env.CI ? 2 : '50%',

    // Cache configuration
    cacheDirectory: '<rootDir>/.jest-cache/signalr',

    // Snapshot configuration
    snapshotSerializers: ['enzyme-to-json/serializer'],

    // Mock configuration
    mockPathIgnorePatterns: ['<rootDir>/node_modules/'],

    // Ignore patterns
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/coverage/',
    ],

    // Transform ignore patterns
    transformIgnorePatterns: [
        'node_modules/(?!(@microsoft/signalr|other-esm-modules)/)',
    ],

    // Additional configuration for SignalR testing
    globals: {
        'ts-jest': {
            tsconfig: {
                jsx: 'react-jsx',
            },
        },
        __DEV__: true,
        __TEST__: true,
        __SIGNALR_TEST__: true,
    },

    // Test results processor
    testResultsProcessor:
        '<rootDir>/src/tests/utils/signalr-results-processor.js',
};

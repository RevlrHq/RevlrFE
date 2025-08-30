/**
 * SignalR Test Sequencer
 *
 * Custom test sequencer for SignalR tests to ensure proper test execution order.
 * This helps prevent race conditions and ensures integration tests run after unit tests.
 */

const Sequencer = require('@jest/test-sequencer').default;

class SignalRTestSequencer extends Sequencer {
    /**
     * Sort test files to run in optimal order for SignalR testing
     */
    sort(tests) {
        // Define test priority order
        const testPriorities = {
            // 1. Setup and utility tests first
            setup: 1,
            utils: 1,
            mocks: 1,

            // 2. Type and interface tests
            types: 2,
            interfaces: 2,

            // 3. Core hook tests
            useSignalR: 3,
            useSignalRErrorHandler: 3,

            // 4. Notification system tests
            useTypedNotificationHandler: 4,
            useNotificationGroups: 4,
            useNotificationBatching: 4,

            // 5. Service tests
            SignalRTestService: 5,
            SignalRAuthService: 5,

            // 6. Component tests
            SignalRTester: 6,
            ConnectionStatus: 6,
            NotificationToast: 6,

            // 7. Provider tests
            SignalRProvider: 7,

            // 8. Integration tests
            integration: 8,
            e2e: 8,

            // 9. Performance tests last
            performance: 9,
            load: 9,
        };

        // Sort tests based on priority and dependencies
        const sortedTests = tests.sort((testA, testB) => {
            const priorityA = this.getTestPriority(testA.path, testPriorities);
            const priorityB = this.getTestPriority(testB.path, testPriorities);

            // Primary sort by priority
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Secondary sort by file name for consistency
            return testA.path.localeCompare(testB.path);
        });

        return sortedTests;
    }

    /**
     * Determine test priority based on file path
     */
    getTestPriority(testPath, priorities) {
        const fileName = testPath.toLowerCase();

        // Check for specific test types in order of priority
        for (const [testType, priority] of Object.entries(priorities)) {
            if (fileName.includes(testType.toLowerCase())) {
                return priority;
            }
        }

        // Default priority for unmatched tests
        return 5;
    }

    /**
     * Determine if tests can run in parallel
     */
    allFailedTests(tests) {
        // Integration and performance tests should run serially
        const serialTests = tests.filter((test) => {
            const fileName = test.path.toLowerCase();
            return (
                fileName.includes('integration') ||
                fileName.includes('performance') ||
                fileName.includes('e2e')
            );
        });

        // Unit tests can run in parallel
        const parallelTests = tests.filter(
            (test) => !serialTests.includes(test)
        );

        return {
            serial: serialTests,
            parallel: parallelTests,
        };
    }
}

module.exports = SignalRTestSequencer;

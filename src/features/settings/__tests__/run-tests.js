#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
    log(`\n${colors.blue}Running: ${description}${colors.reset}`);
    log(`${colors.cyan}Command: ${command}${colors.reset}`);

    try {
        const output = execSync(command, {
            stdio: 'inherit',
            cwd: path.resolve(__dirname, '../../../..'),
        });
        log(
            `${colors.green}✓ ${description} completed successfully${colors.reset}`
        );
        return true;
    } catch (error) {
        log(`${colors.red}✗ ${description} failed${colors.reset}`);
        log(`${colors.red}Error: ${error.message}${colors.reset}`);
        return false;
    }
}

async function main() {
    log(
        `${colors.bright}${colors.magenta}Settings Feature Test Suite${colors.reset}`
    );
    log(
        `${colors.yellow}Running comprehensive tests for user settings management...${colors.reset}`
    );

    const testSuites = [
        {
            command:
                'npm test -- src/features/settings/shared/__tests__/components.test.tsx --run',
            description: 'Shared Components Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/shared/__tests__/hooks.test.ts --run',
            description: 'Shared Hooks Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/shared/__tests__/validation.test.ts --run',
            description: 'Validation Utils Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/profile/__tests__/components.test.tsx --run',
            description: 'Profile Components Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/security/__tests__/components.test.tsx --run',
            description: 'Security Components Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/notifications/__tests__/components.test.tsx --run',
            description: 'Notification Components Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/services/__tests__/services.test.ts --run',
            description: 'Services Unit Tests',
        },
        {
            command:
                'npm test -- src/features/settings/__tests__/integration/settings-workflows.test.tsx --run',
            description: 'Settings Workflows Integration Tests',
        },
        {
            command:
                'npm test -- src/features/settings/billing/__tests__/billing-integration.test.ts --run',
            description: 'Billing Integration Tests',
        },
        {
            command:
                'npm test -- src/features/settings/__tests__/accessibility/settings-accessibility.test.tsx --run',
            description: 'Accessibility Tests',
        },
    ];

    let passedTests = 0;
    let failedTests = 0;

    for (const suite of testSuites) {
        const success = runCommand(suite.command, suite.description);
        if (success) {
            passedTests++;
        } else {
            failedTests++;
        }
    }

    // Run E2E tests if available
    log(`\n${colors.blue}Checking for E2E test setup...${colors.reset}`);
    try {
        const playwrightInstalled = execSync('npx playwright --version', {
            stdio: 'pipe',
        });
        log(
            `${colors.green}Playwright detected: ${playwrightInstalled.toString().trim()}${colors.reset}`
        );

        const e2eSuccess = runCommand(
            'npx playwright test src/features/settings/__tests__/e2e/settings-e2e.spec.ts',
            'Settings E2E Tests'
        );

        if (e2eSuccess) {
            passedTests++;
        } else {
            failedTests++;
        }
    } catch (error) {
        log(
            `${colors.yellow}Playwright not available, skipping E2E tests${colors.reset}`
        );
        log(
            `${colors.yellow}To run E2E tests, install Playwright: npm install -D @playwright/test${colors.reset}`
        );
    }

    // Generate coverage report
    log(`\n${colors.blue}Generating test coverage report...${colors.reset}`);
    runCommand(
        'npm test -- --coverage --coverageDirectory=coverage/settings --collectCoverageFrom="src/features/settings/**/*.{ts,tsx}" --run',
        'Coverage Report Generation'
    );

    // Summary
    log(`\n${colors.bright}${colors.magenta}Test Summary${colors.reset}`);
    log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
    log(`${colors.cyan}Total: ${passedTests + failedTests}${colors.reset}`);

    if (failedTests === 0) {
        log(
            `\n${colors.bright}${colors.green}🎉 All tests passed! Settings feature is ready for production.${colors.reset}`
        );
        process.exit(0);
    } else {
        log(
            `\n${colors.bright}${colors.red}❌ Some tests failed. Please review and fix the issues.${colors.reset}`
        );
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    log(`${colors.bright}Settings Test Runner${colors.reset}`);
    log(`${colors.cyan}Usage: node run-tests.js [options]${colors.reset}`);
    log(`${colors.yellow}Options:${colors.reset}`);
    log(`  --help, -h     Show this help message`);
    log(`  --unit         Run only unit tests`);
    log(`  --integration  Run only integration tests`);
    log(`  --e2e          Run only E2E tests`);
    log(`  --accessibility Run only accessibility tests`);
    log(`  --coverage     Generate coverage report`);
    process.exit(0);
}

if (args.includes('--unit')) {
    log(`${colors.yellow}Running unit tests only...${colors.reset}`);
    const unitTests = [
        'npm test -- src/features/settings/shared/__tests__/ --run',
        'npm test -- src/features/settings/profile/__tests__/components.test.tsx --run',
        'npm test -- src/features/settings/security/__tests__/components.test.tsx --run',
        'npm test -- src/features/settings/notifications/__tests__/components.test.tsx --run',
        'npm test -- src/features/settings/services/__tests__/services.test.ts --run',
    ];

    unitTests.forEach((command) => {
        execSync(command, { stdio: 'inherit' });
    });
    process.exit(0);
}

if (args.includes('--integration')) {
    log(`${colors.yellow}Running integration tests only...${colors.reset}`);
    execSync('npm test -- src/features/settings/__tests__/integration/ --run', {
        stdio: 'inherit',
    });
    execSync(
        'npm test -- src/features/settings/billing/__tests__/billing-integration.test.ts --run',
        { stdio: 'inherit' }
    );
    process.exit(0);
}

if (args.includes('--e2e')) {
    log(`${colors.yellow}Running E2E tests only...${colors.reset}`);
    execSync('npx playwright test src/features/settings/__tests__/e2e/', {
        stdio: 'inherit',
    });
    process.exit(0);
}

if (args.includes('--accessibility')) {
    log(`${colors.yellow}Running accessibility tests only...${colors.reset}`);
    execSync(
        'npm test -- src/features/settings/__tests__/accessibility/ --run',
        { stdio: 'inherit' }
    );
    process.exit(0);
}

if (args.includes('--coverage')) {
    log(`${colors.yellow}Generating coverage report...${colors.reset}`);
    execSync(
        'npm test -- --coverage --coverageDirectory=coverage/settings --collectCoverageFrom="src/features/settings/**/*.{ts,tsx}" --run',
        { stdio: 'inherit' }
    );
    process.exit(0);
}

// Run all tests by default
main().catch((error) => {
    log(`${colors.red}Test runner failed: ${error.message}${colors.reset}`);
    process.exit(1);
});

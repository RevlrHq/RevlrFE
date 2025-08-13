#!/usr/bin/env node

/**
 * Test Runner Script
 *
 * This script provides different ways to run the comprehensive test suite
 * with various configurations and reporting options.
 */

const { execSync } = require('child_process');
const path = require('path');

// Test categories and their patterns
const testCategories = {
    unit: [
        'src/tests/hooks/**/*.test.ts',
        'src/tests/services/**/*.test.ts',
        'src/tests/utils/**/*.test.ts',
    ],
    components: ['src/tests/components/**/*.test.tsx'],
    integration: ['src/tests/integration/**/*.test.tsx'],
    e2e: ['src/tests/e2e/**/*.test.tsx'],
    all: ['src/tests/**/*.test.{ts,tsx}'],
};

// Parse command line arguments
const args = process.argv.slice(2);
const category = args[0] || 'all';
const options = args.slice(1);

// Validate category
if (!testCategories[category]) {
    console.error(`Invalid test category: ${category}`);
    console.error(
        `Available categories: ${Object.keys(testCategories).join(', ')}`
    );
    process.exit(1);
}

// Build Jest command
const patterns = testCategories[category];
const jestArgs = ['--passWithNoTests', '--verbose', ...patterns, ...options];

// Add coverage for comprehensive runs
if (category === 'all' || options.includes('--coverage')) {
    jestArgs.push('--coverage');
    jestArgs.push('--coverageReporters=text');
    jestArgs.push('--coverageReporters=lcov');
    jestArgs.push('--coverageReporters=html');
}

// Add watch mode if requested
if (options.includes('--watch')) {
    jestArgs.push('--watch');
}

// Add specific test file if provided
const testFile = options.find(
    (arg) => arg.endsWith('.test.ts') || arg.endsWith('.test.tsx')
);
if (testFile) {
    jestArgs.push(testFile);
}

try {
    console.log(`Running ${category} tests...`);
    console.log(`Jest command: npx jest ${jestArgs.join(' ')}`);

    execSync(`npx jest ${jestArgs.join(' ')}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
    });

    console.log(`\n✅ ${category} tests completed successfully!`);
} catch (error) {
    console.error(`\n❌ ${category} tests failed!`);
    process.exit(1);
}

// Additional reporting for comprehensive test runs
if (category === 'all' && !options.includes('--watch')) {
    console.log('\n📊 Test Summary:');
    console.log('- Unit Tests: Hook logic, service methods, utility functions');
    console.log(
        '- Component Tests: UI components, user interactions, props handling'
    );
    console.log(
        '- Integration Tests: Component integration, API communication, workflow'
    );
    console.log(
        '- End-to-End Tests: Complete user journeys, error scenarios, performance'
    );

    console.log('\n📁 Coverage Report:');
    console.log('- HTML Report: coverage/lcov-report/index.html');
    console.log('- LCOV Report: coverage/lcov.info');

    console.log('\n🔧 Next Steps:');
    console.log('- Review coverage report for any gaps');
    console.log(
        '- Run specific test categories: npm run test:unit, test:components, etc.'
    );
    console.log('- Use watch mode for development: npm run test:watch');
}

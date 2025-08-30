/**
 * SignalR Test Results Processor
 *
 * Custom test results processor for SignalR tests.
 * Processes test results and generates additional reports and metrics.
 */

const fs = require('fs');
const path = require('path');

/**
 * Process SignalR test results and generate additional reports
 */
function processSignalRTestResults(testResults) {
    const {
        numFailedTests,
        numPassedTests,
        numPendingTests,
        testResults: results,
        startTime,
        success,
    } = testResults;

    // Calculate test metrics
    const totalTests = numFailedTests + numPassedTests + numPendingTests;
    const passRate = totalTests > 0 ? (numPassedTests / totalTests) * 100 : 0;
    const duration = Date.now() - startTime;

    // Categorize tests by type
    const testCategories = categorizeTests(results);

    // Generate performance metrics
    const performanceMetrics = generatePerformanceMetrics(results);

    // Generate coverage summary
    const coverageSummary = generateCoverageSummary(testResults);

    // Create comprehensive report
    const report = {
        summary: {
            totalTests,
            passedTests: numPassedTests,
            failedTests: numFailedTests,
            pendingTests: numPendingTests,
            passRate: Math.round(passRate * 100) / 100,
            duration,
            success,
            timestamp: new Date().toISOString(),
        },
        categories: testCategories,
        performance: performanceMetrics,
        coverage: coverageSummary,
        failedTests: getFailedTestDetails(results),
        slowTests: getSlowTests(results),
    };

    // Write report to file
    writeReportToFile(report);

    // Log summary to console
    logSummaryToConsole(report);

    // Return original results for Jest
    return testResults;
}

/**
 * Categorize tests by SignalR component type
 */
function categorizeTests(results) {
    const categories = {
        hooks: { passed: 0, failed: 0, total: 0 },
        components: { passed: 0, failed: 0, total: 0 },
        services: { passed: 0, failed: 0, total: 0 },
        providers: { passed: 0, failed: 0, total: 0 },
        integration: { passed: 0, failed: 0, total: 0 },
        performance: { passed: 0, failed: 0, total: 0 },
        other: { passed: 0, failed: 0, total: 0 },
    };

    results.forEach((result) => {
        const category = determineTestCategory(result.testFilePath);
        const stats = categories[category];

        stats.total += result.numPassingTests + result.numFailingTests;
        stats.passed += result.numPassingTests;
        stats.failed += result.numFailingTests;
    });

    return categories;
}

/**
 * Determine test category based on file path
 */
function determineTestCategory(filePath) {
    const fileName = filePath.toLowerCase();

    if (fileName.includes('hook') || fileName.includes('use')) {
        return 'hooks';
    } else if (fileName.includes('component')) {
        return 'components';
    } else if (fileName.includes('service')) {
        return 'services';
    } else if (fileName.includes('provider')) {
        return 'providers';
    } else if (fileName.includes('integration')) {
        return 'integration';
    } else if (fileName.includes('performance')) {
        return 'performance';
    } else {
        return 'other';
    }
}

/**
 * Generate performance metrics from test results
 */
function generatePerformanceMetrics(results) {
    const allTests = results.flatMap((result) =>
        result.testResults.map((test) => ({
            ...test,
            filePath: result.testFilePath,
        }))
    );

    const durations = allTests
        .filter((test) => test.duration != null)
        .map((test) => test.duration);

    if (durations.length === 0) {
        return {
            averageDuration: 0,
            medianDuration: 0,
            maxDuration: 0,
            minDuration: 0,
            totalDuration: 0,
        };
    }

    durations.sort((a, b) => a - b);

    return {
        averageDuration: Math.round(
            durations.reduce((a, b) => a + b, 0) / durations.length
        ),
        medianDuration: durations[Math.floor(durations.length / 2)],
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        totalDuration: durations.reduce((a, b) => a + b, 0),
        testCount: durations.length,
    };
}

/**
 * Generate coverage summary
 */
function generateCoverageSummary(testResults) {
    if (!testResults.coverageMap) {
        return null;
    }

    const summary = testResults.coverageMap.getCoverageSummary();

    return {
        lines: {
            total: summary.lines.total,
            covered: summary.lines.covered,
            percentage: summary.lines.pct,
        },
        functions: {
            total: summary.functions.total,
            covered: summary.functions.covered,
            percentage: summary.functions.pct,
        },
        branches: {
            total: summary.branches.total,
            covered: summary.branches.covered,
            percentage: summary.branches.pct,
        },
        statements: {
            total: summary.statements.total,
            covered: summary.statements.covered,
            percentage: summary.statements.pct,
        },
    };
}

/**
 * Get details of failed tests
 */
function getFailedTestDetails(results) {
    const failedTests = [];

    results.forEach((result) => {
        result.testResults.forEach((test) => {
            if (test.status === 'failed') {
                failedTests.push({
                    testName: test.fullName,
                    filePath: result.testFilePath,
                    duration: test.duration,
                    failureMessages: test.failureMessages,
                    ancestorTitles: test.ancestorTitles,
                });
            }
        });
    });

    return failedTests;
}

/**
 * Get slow tests (duration > 1000ms)
 */
function getSlowTests(results) {
    const slowTests = [];

    results.forEach((result) => {
        result.testResults.forEach((test) => {
            if (test.duration && test.duration > 1000) {
                slowTests.push({
                    testName: test.fullName,
                    filePath: result.testFilePath,
                    duration: test.duration,
                    ancestorTitles: test.ancestorTitles,
                });
            }
        });
    });

    return slowTests.sort((a, b) => b.duration - a.duration);
}

/**
 * Write report to file
 */
function writeReportToFile(report) {
    const reportDir = path.join(process.cwd(), 'coverage', 'signalr');
    const reportPath = path.join(reportDir, 'signalr-test-report.json');

    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    // Write report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Also write a simplified HTML report
    writeHtmlReport(report, reportDir);
}

/**
 * Write HTML report
 */
function writeHtmlReport(report, reportDir) {
    const htmlPath = path.join(reportDir, 'signalr-test-summary.html');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SignalR Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 3px; }
        .success { color: green; }
        .failure { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .category-table { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>SignalR Test Report</h1>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <div class="metric">
            <strong>Total Tests:</strong> ${report.summary.totalTests}
        </div>
        <div class="metric ${report.summary.passedTests > 0 ? 'success' : ''}">
            <strong>Passed:</strong> ${report.summary.passedTests}
        </div>
        <div class="metric ${report.summary.failedTests > 0 ? 'failure' : ''}">
            <strong>Failed:</strong> ${report.summary.failedTests}
        </div>
        <div class="metric">
            <strong>Pass Rate:</strong> ${report.summary.passRate}%
        </div>
        <div class="metric">
            <strong>Duration:</strong> ${Math.round(report.summary.duration / 1000)}s
        </div>
    </div>

    <div class="category-table">
        <h2>Test Categories</h2>
        <table>
            <tr>
                <th>Category</th>
                <th>Total</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Pass Rate</th>
            </tr>
            ${Object.entries(report.categories)
                .map(
                    ([category, stats]) => `
                <tr>
                    <td>${category}</td>
                    <td>${stats.total}</td>
                    <td class="${stats.passed > 0 ? 'success' : ''}">${stats.passed}</td>
                    <td class="${stats.failed > 0 ? 'failure' : ''}">${stats.failed}</td>
                    <td>${stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%</td>
                </tr>
            `
                )
                .join('')}
        </table>
    </div>

    ${
        report.performance
            ? `
    <div>
        <h2>Performance Metrics</h2>
        <div class="metric">
            <strong>Average Duration:</strong> ${report.performance.averageDuration}ms
        </div>
        <div class="metric">
            <strong>Median Duration:</strong> ${report.performance.medianDuration}ms
        </div>
        <div class="metric">
            <strong>Max Duration:</strong> ${report.performance.maxDuration}ms
        </div>
        <div class="metric">
            <strong>Total Duration:</strong> ${Math.round(report.performance.totalDuration / 1000)}s
        </div>
    </div>
    `
            : ''
    }

    ${
        report.slowTests && report.slowTests.length > 0
            ? `
    <div>
        <h2>Slow Tests (>1s)</h2>
        <table>
            <tr>
                <th>Test Name</th>
                <th>Duration</th>
                <th>File</th>
            </tr>
            ${report.slowTests
                .slice(0, 10)
                .map(
                    (test) => `
                <tr>
                    <td>${test.testName}</td>
                    <td class="warning">${test.duration}ms</td>
                    <td>${path.basename(test.filePath)}</td>
                </tr>
            `
                )
                .join('')}
        </table>
    </div>
    `
            : ''
    }

    ${
        report.failedTests && report.failedTests.length > 0
            ? `
    <div>
        <h2>Failed Tests</h2>
        <table>
            <tr>
                <th>Test Name</th>
                <th>File</th>
                <th>Error</th>
            </tr>
            ${report.failedTests
                .map(
                    (test) => `
                <tr>
                    <td>${test.testName}</td>
                    <td>${path.basename(test.filePath)}</td>
                    <td class="failure">${test.failureMessages[0] ? test.failureMessages[0].substring(0, 100) + '...' : 'Unknown error'}</td>
                </tr>
            `
                )
                .join('')}
        </table>
    </div>
    `
            : ''
    }

    <div style="margin-top: 30px; font-size: 12px; color: #666;">
        Generated at: ${report.summary.timestamp}
    </div>
</body>
</html>
    `;

    fs.writeFileSync(htmlPath, html);
}

/**
 * Log summary to console
 */
function logSummaryToConsole(report) {
    console.log('\n📊 SignalR Test Results Summary:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   ✅ Passed: ${report.summary.passedTests}`);
    console.log(`   ❌ Failed: ${report.summary.failedTests}`);
    console.log(`   ⏸️  Pending: ${report.summary.pendingTests}`);
    console.log(`   📈 Pass Rate: ${report.summary.passRate}%`);
    console.log(
        `   ⏱️  Duration: ${Math.round(report.summary.duration / 1000)}s`
    );

    if (report.performance) {
        console.log(
            `   🚀 Avg Test Duration: ${report.performance.averageDuration}ms`
        );
    }

    if (report.slowTests && report.slowTests.length > 0) {
        console.log(`   🐌 Slow Tests: ${report.slowTests.length}`);
    }

    if (report.coverage) {
        console.log(
            `   📋 Line Coverage: ${report.coverage.lines.percentage}%`
        );
        console.log(
            `   🔧 Function Coverage: ${report.coverage.functions.percentage}%`
        );
    }

    console.log('\n📄 Detailed reports saved to: coverage/signalr/\n');
}

module.exports = processSignalRTestResults;

#!/usr/bin/env node

/**
 * Comprehensive Accessibility Test Runner
 *
 * This script runs all accessibility tests for the organizer dashboard
 * including automated axe-core tests, manual test scenarios, and
 * accessibility compliance checks.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
    suite: string;
    passed: number;
    failed: number;
    violations: Array<{
        rule: string;
        impact: string;
        description: string;
        nodes: number;
    }>;
    coverage: number;
}

interface AccessibilityReport {
    timestamp: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallScore: number;
    suites: TestResult[];
    recommendations: string[];
}

class AccessibilityTestRunner {
    private results: TestResult[] = [];
    private startTime: number = Date.now();

    constructor() {
        console.log('🔍 Starting Accessibility Test Suite...\n');
    }

    /**
     * Run all accessibility tests
     */
    async runAllTests(): Promise<void> {
        try {
            // Run Jest accessibility tests
            await this.runJestTests();

            // Run axe-core tests
            await this.runAxeTests();

            // Run keyboard navigation tests
            await this.runKeyboardTests();

            // Run screen reader tests
            await this.runScreenReaderTests();

            // Run color contrast tests
            await this.runContrastTests();

            // Generate report
            await this.generateReport();
        } catch (error) {
            console.error('❌ Accessibility test suite failed:', error);
            process.exit(1);
        }
    }

    /**
     * Run Jest-based accessibility tests
     */
    private async runJestTests(): Promise<void> {
        console.log('🧪 Running Jest accessibility tests...');

        try {
            const output = execSync(
                'npx jest src/tests/accessibility/ --verbose --coverage --passWithNoTests',
                { encoding: 'utf8', stdio: 'pipe' }
            );

            this.parseJestOutput(output);
            console.log('✅ Jest accessibility tests completed\n');
        } catch (error: any) {
            console.log(
                '⚠️  Some Jest tests failed, continuing with other tests...\n'
            );
            this.parseJestOutput(error.stdout || '');
        }
    }

    /**
     * Run axe-core accessibility tests
     */
    private async runAxeTests(): Promise<void> {
        console.log('🎯 Running axe-core accessibility tests...');

        try {
            // Run specific axe tests
            const output = execSync(
                'npx jest src/tests/accessibility/dashboard-accessibility.test.tsx --testNamePattern="should not have any accessibility violations" --verbose',
                { encoding: 'utf8', stdio: 'pipe' }
            );

            console.log('✅ Axe-core tests completed\n');
        } catch (error: any) {
            console.log('⚠️  Some axe-core tests failed\n');
            this.logAxeViolations(error.stdout || '');
        }
    }

    /**
     * Run keyboard navigation tests
     */
    private async runKeyboardTests(): Promise<void> {
        console.log('⌨️  Running keyboard navigation tests...');

        try {
            const output = execSync(
                'npx jest src/tests/accessibility/accessibility-hooks.test.tsx --testNamePattern="Keyboard Navigation" --verbose',
                { encoding: 'utf8', stdio: 'pipe' }
            );

            console.log('✅ Keyboard navigation tests completed\n');
        } catch (error: any) {
            console.log('⚠️  Some keyboard navigation tests failed\n');
        }
    }

    /**
     * Run screen reader tests
     */
    private async runScreenReaderTests(): Promise<void> {
        console.log('🔊 Running screen reader tests...');

        try {
            const output = execSync(
                'npx jest src/tests/accessibility/accessibility-hooks.test.tsx --testNamePattern="Screen Reader" --verbose',
                { encoding: 'utf8', stdio: 'pipe' }
            );

            console.log('✅ Screen reader tests completed\n');
        } catch (error: any) {
            console.log('⚠️  Some screen reader tests failed\n');
        }
    }

    /**
     * Run color contrast tests
     */
    private async runContrastTests(): Promise<void> {
        console.log('🎨 Running color contrast tests...');

        try {
            const output = execSync(
                'npx jest src/tests/accessibility/dashboard-accessibility.test.tsx --testNamePattern="Color and Contrast" --verbose',
                { encoding: 'utf8', stdio: 'pipe' }
            );

            console.log('✅ Color contrast tests completed\n');
        } catch (error: any) {
            console.log('⚠️  Some color contrast tests failed\n');
        }
    }

    /**
     * Parse Jest test output
     */
    private parseJestOutput(output: string): void {
        const lines = output.split('\n');
        let currentSuite = '';
        let passed = 0;
        let failed = 0;

        for (const line of lines) {
            if (line.includes('PASS') || line.includes('FAIL')) {
                const match = line.match(/(?:PASS|FAIL)\s+(.+\.test\.tsx?)/);
                if (match) {
                    currentSuite = match[1];
                }
            }

            if (line.includes('✓') || line.includes('√')) {
                passed++;
            }

            if (line.includes('✕') || line.includes('×')) {
                failed++;
            }
        }

        if (currentSuite) {
            this.results.push({
                suite: currentSuite,
                passed,
                failed,
                violations: [],
                coverage: this.extractCoverage(output),
            });
        }
    }

    /**
     * Log axe violations
     */
    private logAxeViolations(output: string): void {
        const violations = this.extractAxeViolations(output);

        if (violations.length > 0) {
            console.log('🚨 Accessibility violations found:');
            violations.forEach((violation, index) => {
                console.log(
                    `  ${index + 1}. ${violation.rule} (${violation.impact})`
                );
                console.log(`     ${violation.description}`);
                console.log(`     Affected nodes: ${violation.nodes}\n`);
            });
        }
    }

    /**
     * Extract axe violations from output
     */
    private extractAxeViolations(output: string): Array<{
        rule: string;
        impact: string;
        description: string;
        nodes: number;
    }> {
        // This would parse actual axe-core violation output
        // For now, return empty array as placeholder
        return [];
    }

    /**
     * Extract test coverage from output
     */
    private extractCoverage(output: string): number {
        const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
        return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
    }

    /**
     * Generate comprehensive accessibility report
     */
    private async generateReport(): Promise<void> {
        const totalTests = this.results.reduce(
            (sum, result) => sum + result.passed + result.failed,
            0
        );
        const passedTests = this.results.reduce(
            (sum, result) => sum + result.passed,
            0
        );
        const failedTests = this.results.reduce(
            (sum, result) => sum + result.failed,
            0
        );

        const overallScore =
            totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

        const report: AccessibilityReport = {
            timestamp: new Date().toISOString(),
            totalTests,
            passedTests,
            failedTests,
            overallScore,
            suites: this.results,
            recommendations: this.generateRecommendations(),
        };

        // Write report to file
        const reportPath = join(process.cwd(), 'accessibility-report.json');
        writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Generate HTML report
        await this.generateHtmlReport(report);

        // Print summary
        this.printSummary(report);
    }

    /**
     * Generate accessibility recommendations
     */
    private generateRecommendations(): string[] {
        const recommendations: string[] = [];

        // Analyze results and generate recommendations
        const totalViolations = this.results.reduce(
            (sum, result) => sum + result.violations.length,
            0
        );

        if (totalViolations > 0) {
            recommendations.push(
                'Address accessibility violations found by axe-core'
            );
        }

        const lowCoverageResults = this.results.filter(
            (result) => result.coverage < 80
        );
        if (lowCoverageResults.length > 0) {
            recommendations.push(
                'Increase test coverage for accessibility features'
            );
        }

        const failedTests = this.results.filter((result) => result.failed > 0);
        if (failedTests.length > 0) {
            recommendations.push('Fix failing accessibility tests');
        }

        // Add general recommendations
        recommendations.push(
            'Regularly test with actual screen readers (NVDA, JAWS, VoiceOver)',
            'Conduct manual keyboard navigation testing',
            'Verify color contrast ratios meet WCAG AA standards',
            'Test with users who have disabilities',
            'Keep accessibility documentation up to date'
        );

        return recommendations;
    }

    /**
     * Generate HTML report
     */
    private async generateHtmlReport(
        report: AccessibilityReport
    ): Promise<void> {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .score {
            font-size: 3em;
            font-weight: bold;
            color: ${report.overallScore >= 90 ? '#28a745' : report.overallScore >= 70 ? '#ffc107' : '#dc3545'};
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .total { color: #007bff; }
        .suite {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .suite-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .suite-name {
            font-weight: bold;
            font-size: 1.1em;
        }
        .suite-score {
            padding: 5px 10px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
        }
        .recommendations {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 20px;
            margin: 30px 0;
        }
        .recommendations h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .recommendations ul {
            margin: 0;
            padding-left: 20px;
        }
        .violations {
            background: #ffebee;
            border-left: 4px solid #f44336;
            padding: 15px;
            margin: 15px 0;
        }
        .violation {
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
        }
        .violation-rule {
            font-weight: bold;
            color: #d32f2f;
        }
        .violation-impact {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            margin-left: 10px;
        }
        .impact-critical { background: #ffcdd2; color: #c62828; }
        .impact-serious { background: #ffe0b2; color: #ef6c00; }
        .impact-moderate { background: #fff3e0; color: #f57c00; }
        .impact-minor { background: #e8f5e8; color: #2e7d32; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accessibility Test Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        <div class="score">${report.overallScore}%</div>
        <p>Overall Accessibility Score</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number total">${report.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number passed">${report.passedTests}</div>
            <div>Passed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number failed">${report.failedTests}</div>
            <div>Failed</div>
        </div>
    </div>

    <h2>Test Suites</h2>
    ${report.suites
        .map((suite) => {
            const suiteScore =
                suite.passed + suite.failed > 0
                    ? Math.round(
                          (suite.passed / (suite.passed + suite.failed)) * 100
                      )
                    : 0;
            const scoreClass =
                suiteScore >= 90
                    ? 'passed'
                    : suiteScore >= 70
                      ? 'total'
                      : 'failed';

            return `
        <div class="suite">
            <div class="suite-header">
                <div class="suite-name">${suite.suite}</div>
                <div class="suite-score ${scoreClass}" style="background-color: ${
                    suiteScore >= 90
                        ? '#28a745'
                        : suiteScore >= 70
                          ? '#ffc107'
                          : '#dc3545'
                }">${suiteScore}%</div>
            </div>
            <p>Passed: ${suite.passed} | Failed: ${suite.failed} | Coverage: ${suite.coverage}%</p>
            
            ${
                suite.violations.length > 0
                    ? `
            <div class="violations">
                <h4>Accessibility Violations</h4>
                ${suite.violations
                    .map(
                        (violation) => `
                <div class="violation">
                    <div class="violation-rule">${violation.rule}</div>
                    <span class="violation-impact impact-${violation.impact}">${violation.impact}</span>
                    <p>${violation.description}</p>
                    <small>Affected nodes: ${violation.nodes}</small>
                </div>
                `
                    )
                    .join('')}
            </div>
            `
                    : ''
            }
        </div>
        `;
        })
        .join('')}

    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d;">
        <p>Generated by Accessibility Test Runner</p>
    </footer>
</body>
</html>
        `;

        const htmlPath = join(process.cwd(), 'accessibility-report.html');
        writeFileSync(htmlPath, html);

        console.log(`📊 HTML report generated: ${htmlPath}`);
    }

    /**
     * Print test summary
     */
    private printSummary(report: AccessibilityReport): void {
        const duration = Math.round((Date.now() - this.startTime) / 1000);

        console.log('\n' + '='.repeat(60));
        console.log('🎯 ACCESSIBILITY TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📊 Overall Score: ${report.overallScore}%`);
        console.log(`✅ Passed: ${report.passedTests}`);
        console.log(`❌ Failed: ${report.failedTests}`);
        console.log(`📈 Total Tests: ${report.totalTests}`);

        if (report.overallScore >= 90) {
            console.log('\n🎉 Excellent accessibility compliance!');
        } else if (report.overallScore >= 70) {
            console.log('\n⚠️  Good accessibility, but room for improvement.');
        } else {
            console.log('\n🚨 Accessibility needs significant improvement.');
        }

        console.log('\n📋 Key Recommendations:');
        report.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });

        console.log('\n📄 Full report: accessibility-report.html');
        console.log('='.repeat(60) + '\n');
    }
}

// Run the accessibility test suite
if (require.main === module) {
    const runner = new AccessibilityTestRunner();
    runner.runAllTests().catch((error) => {
        console.error('Failed to run accessibility tests:', error);
        process.exit(1);
    });
}

export default AccessibilityTestRunner;

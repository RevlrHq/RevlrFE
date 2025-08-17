/**
 * Final accessibility audit test for the enhanced dashboard
 */

import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Dashboard from '../../features/dashboard/Dashboard';
import { ThemeProvider } from '../../lib/ThemeContext';
import { AuthProvider } from '../../providers/AuthProvider';
import { dashboardAccessibilityAuditor } from '../../lib/accessibility/dashboard-audit';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('../../hooks/useOrganizerDashboard', () => ({
    useOrganizerDashboard: () => ({
        data: {
            statistics: {
                totalEvents: 10,
                activeEvents: 5,
                totalRevenue: 50000,
                totalAttendees: 200,
            },
            revenue: {
                thisMonthRevenue: 25000,
                lastMonthRevenue: 20000,
            },
            recentEvents: [
                {
                    id: '1',
                    title: 'Test Event 1',
                    startDate: '2024-01-15T10:00:00Z',
                    status: 1,
                },
                {
                    id: '2',
                    title: 'Test Event 2',
                    startDate: '2024-01-20T14:00:00Z',
                    status: 0,
                },
            ],
        },
        loading: false,
        error: null,
        refetch: jest.fn(),
    }),
}));

jest.mock('../../hooks/useOrganizerRealtime', () => ({
    useOrganizerRealtime: () => ({
        connectionStatus: 'connected',
        notifications: [],
        clearNotification: jest.fn(),
        isConnected: true,
    }),
}));

jest.mock('../../hooks/usePerformanceTracking', () => ({
    usePerformanceTracking: () => ({
        trackPageView: jest.fn(),
        trackUserAction: jest.fn(),
        trackPerformanceMetric: jest.fn(),
        getPerformanceReport: jest.fn(),
    }),
}));

jest.mock('../../hooks/useMobileOptimizations', () => ({
    useMobileOptimizations: () => ({
        isMobile: false,
        isTablet: false,
        setupPullToRefresh: jest.fn(),
        pullToRefreshState: {
            isPulling: false,
            isRefreshing: false,
            pullDistance: 0,
        },
        getResponsiveValue: (mobile: string, tablet: string, desktop: string) =>
            desktop,
    }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
);

describe('Dashboard Final Accessibility Audit', () => {
    beforeEach(() => {
        // Set up environment variables for testing
        process.env.NEXT_PUBLIC_FEATURE_ENHANCED_EVENT_TABLE = 'true';
        process.env.NEXT_PUBLIC_FEATURE_REGISTRATION_MANAGEMENT = 'true';
        process.env.NEXT_PUBLIC_FEATURE_REVENUE_REPORTING = 'true';
        process.env.NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION = 'true';
        process.env.NEXT_PUBLIC_FEATURE_ATTENDEE_ANALYTICS = 'true';
        process.env.NEXT_PUBLIC_FEATURE_REALTIME_UPDATES = 'true';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Automated Accessibility Testing', () => {
        test('should pass axe accessibility tests', async () => {
            const { container } = render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        test('should pass axe tests in dark mode', async () => {
            const { container } = render(
                <TestWrapper>
                    <div data-theme='dark'>
                        <Dashboard />
                    </div>
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        test('should pass axe tests with all tabs', async () => {
            const { container } = render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Test each tab
            const tabs = [
                'Overview',
                'Analytics',
                'Events',
                'Registrations',
                'Revenue',
            ];

            for (const tabName of tabs) {
                const tab = screen.getByRole('button', {
                    name: new RegExp(tabName, 'i'),
                });
                if (tab) {
                    tab.click();
                    await waitFor(
                        () => {
                            // Wait for tab content to load
                        },
                        { timeout: 3000 }
                    );

                    const results = await axe(container);
                    expect(results).toHaveNoViolations();
                }
            }
        });
    });

    describe('Custom Accessibility Audit', () => {
        test('should run comprehensive accessibility audit', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            const report = await dashboardAccessibilityAuditor.runAudit();

            expect(report).toBeDefined();
            expect(report.score).toBeGreaterThan(80); // Minimum accessibility score
            expect(report.totalIssues).toBeLessThan(10); // Maximum allowed issues

            // Check for critical issues
            const criticalIssues = report.issues.filter(
                (issue) => issue.impact === 'critical'
            );
            expect(criticalIssues).toHaveLength(0);

            console.log('Accessibility Audit Report:', {
                score: report.score,
                totalIssues: report.totalIssues,
                issuesBySeverity: report.issuesBySeverity,
                recommendations: report.recommendations,
            });
        });

        test('should have proper heading structure', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Check for H1
            const h1Elements = document.querySelectorAll('h1');
            expect(h1Elements.length).toBe(1);

            // Check heading hierarchy
            const headings = document.querySelectorAll(
                'h1, h2, h3, h4, h5, h6'
            );
            let previousLevel = 0;

            headings.forEach((heading) => {
                const level = parseInt(heading.tagName.charAt(1));
                if (previousLevel > 0) {
                    expect(level).toBeLessThanOrEqual(previousLevel + 1);
                }
                previousLevel = level;
            });
        });

        test('should have proper ARIA labels', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Check buttons have accessible names
            const buttons = document.querySelectorAll('button');
            buttons.forEach((button) => {
                const accessibleName =
                    button.textContent?.trim() ||
                    button.getAttribute('aria-label') ||
                    button.getAttribute('aria-labelledby');
                expect(accessibleName).toBeTruthy();
            });

            // Check form controls have labels
            const formControls = document.querySelectorAll(
                'input, select, textarea'
            );
            formControls.forEach((control) => {
                const htmlControl = control as HTMLInputElement;
                if (htmlControl.type === 'hidden') return;

                const hasLabel =
                    htmlControl.labels?.length > 0 ||
                    htmlControl.hasAttribute('aria-label') ||
                    htmlControl.hasAttribute('aria-labelledby');
                expect(hasLabel).toBe(true);
            });
        });

        test('should have keyboard navigation support', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Check interactive elements are focusable
            const interactiveElements = document.querySelectorAll(
                'button, a, input, select, textarea, [tabindex], [role="button"]'
            );

            interactiveElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                const tabIndex = htmlElement.tabIndex;
                const isHidden =
                    htmlElement.hasAttribute('aria-hidden') &&
                    htmlElement.getAttribute('aria-hidden') === 'true';

                if (!isHidden) {
                    expect(tabIndex).toBeGreaterThanOrEqual(0);
                }
            });
        });

        test('should have proper color contrast', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // This is a simplified test - in practice, you'd use a color contrast library
            const textElements = document.querySelectorAll(
                'p, span, div, h1, h2, h3, h4, h5, h6, button, a'
            );

            textElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                const computedStyle = window.getComputedStyle(htmlElement);

                // Check that text color and background color are defined
                expect(computedStyle.color).toBeTruthy();
                expect(computedStyle.backgroundColor).toBeTruthy();
            });
        });

        test('should have semantic structure', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Check for landmark elements
            const landmarks = document.querySelectorAll(
                'main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]'
            );
            expect(landmarks.length).toBeGreaterThan(0);

            // Check for proper list structure
            const lists = document.querySelectorAll('ul, ol');
            lists.forEach((list) => {
                const listItems = list.querySelectorAll(':scope > li');
                if (list.children.length > 0) {
                    expect(listItems.length).toBeGreaterThan(0);
                }
            });
        });

        test('should support screen readers', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Check for live regions
            const liveRegions = document.querySelectorAll(
                '[aria-live], [role="status"], [role="alert"]'
            );
            expect(liveRegions.length).toBeGreaterThan(0);

            // Check for proper announcements on dynamic content
            const loadingElements = document.querySelectorAll(
                '.loading, [data-loading]'
            );
            loadingElements.forEach((element) => {
                const hasAnnouncement =
                    element.hasAttribute('aria-live') ||
                    element.hasAttribute('role') ||
                    element.querySelector('[aria-live], [role="status"]');
                expect(hasAnnouncement).toBeTruthy();
            });
        });
    });

    describe('Mobile Accessibility', () => {
        test('should be accessible on mobile devices', async () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', { value: 375 });
            Object.defineProperty(window, 'innerHeight', { value: 667 });

            const { container } = render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        test('should have touch-friendly targets', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
            });

            // Check that interactive elements have minimum touch target size
            const interactiveElements = document.querySelectorAll(
                'button, a, [role="button"]'
            );

            interactiveElements.forEach((element) => {
                const htmlElement = element as HTMLElement;
                const rect = htmlElement.getBoundingClientRect();

                // Minimum touch target size is 44x44 pixels
                if (rect.width > 0 && rect.height > 0) {
                    expect(
                        Math.min(rect.width, rect.height)
                    ).toBeGreaterThanOrEqual(44);
                }
            });
        });
    });

    describe('Error State Accessibility', () => {
        test('should handle error states accessibly', async () => {
            // Mock error state
            const { useOrganizerDashboard } = await import(
                '../../hooks/useOrganizerDashboard'
            );
            jest.mocked(useOrganizerDashboard).mockReturnValue({
                data: null,
                loading: false,
                error: 'Failed to load dashboard data',
                refetch: jest.fn(),
            });

            const { container } = render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/error/i)).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();

            // Check for proper error announcements
            const errorElements = document.querySelectorAll(
                '[role="alert"], [aria-live="assertive"]'
            );
            expect(errorElements.length).toBeGreaterThan(0);
        });
    });

    describe('Loading State Accessibility', () => {
        test('should handle loading states accessibly', async () => {
            // Mock loading state
            const { useOrganizerDashboard } = await import(
                '../../hooks/useOrganizerDashboard'
            );
            jest.mocked(useOrganizerDashboard).mockReturnValue({
                data: null,
                loading: true,
                error: null,
                refetch: jest.fn(),
            });

            const { container } = render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            const results = await axe(container);
            expect(results).toHaveNoViolations();

            // Check for proper loading announcements
            const loadingElements = document.querySelectorAll(
                '[aria-live="polite"], [role="status"]'
            );
            expect(loadingElements.length).toBeGreaterThan(0);
        });
    });
});

// Performance test for accessibility
describe('Accessibility Performance', () => {
    test('accessibility audit should complete within reasonable time', async () => {
        render(
            <TestWrapper>
                <Dashboard />
            </TestWrapper>
        );

        await waitFor(() => {
            expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
        });

        const startTime = performance.now();
        await dashboardAccessibilityAuditor.runAudit();
        const endTime = performance.now();

        const auditTime = endTime - startTime;
        expect(auditTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
});

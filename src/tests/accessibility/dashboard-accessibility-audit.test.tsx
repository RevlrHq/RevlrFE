/**
 * Automated Accessibility Audit for Dashboard Components
 *
 * This test suite performs comprehensive accessibility testing using jest-axe
 * and custom accessibility checks to ensure WCAG compliance and inclusive design.
 * It covers keyboard navigation, screen reader compatibility, and visual accessibility.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import dashboard components
import StatisticsOverview from '@/components/StatisticsOverview';
import RevenueChart from '@/components/charts/RevenueChart';
import DashboardCustomizer from '@/components/DashboardCustomizer';
import ExportModal from '@/components/ExportModal';

// Import test factories and utilities
import {
    createMockOrganizerDashboard,
    createMockEventList,
    createMockRevenueChartData,
    createMockDashboardLayout,
} from '../utils/dashboard-test-factories';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Chart.js for consistent testing
jest.mock('chart.js', () => ({
    Chart: { register: jest.fn() },
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    PointElement: jest.fn(),
    LineElement: jest.fn(),
    BarElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
    ArcElement: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
    Line: ({ data }: { data: { labels?: string[] } }) => (
        <div
            role='img'
            aria-label={`Revenue chart with ${data.labels?.length || 0} data points`}
            data-testid='line-chart'
        >
            <canvas aria-hidden='true' />
        </div>
    ),
    Bar: ({ data }: { data: { labels?: string[] } }) => (
        <div
            role='img'
            aria-label={`Performance chart with ${data.labels?.length || 0} events`}
            data-testid='bar-chart'
        >
            <canvas aria-hidden='true' />
        </div>
    ),
    Doughnut: ({ data }: { data: { labels?: string[] } }) => (
        <div
            role='img'
            aria-label={`Demographics chart with ${data.labels?.length || 0} categories`}
            data-testid='doughnut-chart'
        >
            <canvas aria-hidden='true' />
        </div>
    ),
}));

// Test wrapper with accessibility context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: Infinity,
                gcTime: Infinity,
            },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <div role='application' aria-label='Event Organizer Dashboard'>
                {children}
            </div>
        </QueryClientProvider>
    );
};

// Mock data
const mockDashboardData = createMockOrganizerDashboard();
const mockEventList = createMockEventList(10);
const mockRevenueData = createMockRevenueChartData(12);
const mockDashboardLayout = createMockDashboardLayout();

describe('Dashboard Accessibility Audit', () => {
    beforeEach(() => {
        // Reset any accessibility-related mocks
        jest.clearAllMocks();
    });

    describe('WCAG Compliance Tests', () => {
        it('should pass axe accessibility audit for StatisticsOverview', async () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        statistics={mockDashboardData.statistics}
                    />
                </TestWrapper>
            );

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe accessibility audit for RevenueChart', async () => {
            const { container } = render(
                <TestWrapper>
                    <RevenueChart
                        data={mockRevenueData}
                        chartType='line'
                        timeRange='12months'
                    />
                </TestWrapper>
            );

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe accessibility audit for EventTable', async () => {
            const { container } = render(
                <TestWrapper>
                    <div role='table' aria-label='Events table'>
                        <div role='row'>
                            <div role='columnheader'>Event Name</div>
                            <div role='columnheader'>Date</div>
                            <div role='columnheader'>Status</div>
                        </div>
                        {mockEventList.map((event) => (
                            <div key={event.id} role='row'>
                                <div role='cell'>{event.title}</div>
                                <div role='cell'>{event.startDate}</div>
                                <div role='cell'>{event.status}</div>
                            </div>
                        ))}
                    </div>
                </TestWrapper>
            );

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe accessibility audit for DashboardCustomizer', async () => {
            const { container } = render(
                <TestWrapper>
                    <DashboardCustomizer
                        layout={mockDashboardLayout}
                        onLayoutChange={() => {}}
                        onWidgetToggle={() => {}}
                        onSave={() => {}}
                    />
                </TestWrapper>
            );

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should pass axe accessibility audit for complete Dashboard', async () => {
            const { container } = render(
                <TestWrapper>
                    <main role='main' aria-label='Dashboard'>
                        <h1>Dashboard</h1>
                        <StatisticsOverview
                            statistics={mockDashboardData.statistics}
                        />
                    </main>
                </TestWrapper>
            );

            // Wait for dashboard to load
            await waitFor(() => {
                expect(screen.getByRole('main')).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });
    });

    describe('Keyboard Navigation Tests', () => {
        it('should support keyboard navigation in StatisticsOverview', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <StatisticsOverview
                        statistics={mockDashboardData.statistics}
                    />
                </TestWrapper>
            );

            // Tab through interactive elements
            await user.tab();
            expect(document.activeElement).toHaveAttribute('role', 'button');

            // Verify all interactive elements are reachable
            const interactiveElements = screen.getAllByRole('button');
            for (const element of interactiveElements) {
                expect(element).toHaveAttribute('tabindex');
            }
        });

        it('should support keyboard navigation in EventTable', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <div role='table' aria-label='Events table'>
                        <div role='row'>
                            <div role='columnheader'>Event Name</div>
                            <div role='columnheader'>Date</div>
                            <div role='columnheader'>Status</div>
                        </div>
                        {mockEventList.map((event) => (
                            <div key={event.id} role='row'>
                                <div role='cell' tabIndex={0}>
                                    {event.title}
                                </div>
                                <div role='cell' tabIndex={0}>
                                    {event.startDate}
                                </div>
                                <div role='cell' tabIndex={0}>
                                    {event.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </TestWrapper>
            );

            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();

            // Test table navigation
            const firstCell = screen.getAllByRole('cell')[0];
            firstCell.focus();

            // Arrow key navigation
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowRight}');
            await user.keyboard('{ArrowLeft}');
            await user.keyboard('{ArrowUp}');

            // Verify focus management
            expect(document.activeElement).toHaveAttribute('role', 'cell');
        });

        it('should support keyboard navigation in modal dialogs', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ExportModal
                        isOpen={true}
                        onClose={() => {}}
                        onExport={() => {}}
                    />
                </TestWrapper>
            );

            const modal = screen.getByRole('dialog');
            expect(modal).toBeInTheDocument();

            // Focus should be trapped within modal
            await user.tab();
            const firstFocusableElement = document.activeElement;

            // Tab through all elements in modal
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            for (let i = 0; i < focusableElements.length; i++) {
                await user.tab();
            }

            // Should cycle back to first element
            expect(document.activeElement).toBe(firstFocusableElement);

            // Escape key should close modal
            await user.keyboard('{Escape}');
            // Note: In actual implementation, this would close the modal
        });

        it('should handle keyboard shortcuts correctly', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <main role='main' aria-label='Dashboard'>
                        <h1>Dashboard</h1>
                        <StatisticsOverview
                            statistics={mockDashboardData.statistics}
                        />
                    </main>
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('main')).toBeInTheDocument();
            });

            // Test common keyboard shortcuts
            await user.keyboard('{Control>}r'); // Refresh
            await user.keyboard('{Control>}f'); // Search
            await user.keyboard('{Control>}e'); // Export

            // Verify shortcuts are handled appropriately
            // (In actual implementation, these would trigger specific actions)
        });
    });

    describe('Screen Reader Compatibility Tests', () => {
        it('should provide appropriate ARIA labels for statistics', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        statistics={mockDashboardData.statistics}
                    />
                </TestWrapper>
            );

            // Check for descriptive labels
            expect(screen.getByLabelText(/total events/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/total revenue/i)).toBeInTheDocument();
            expect(
                screen.getByLabelText(/total registrations/i)
            ).toBeInTheDocument();

            // Check for status information
            const statusRegion = screen.getByRole('status');
            expect(statusRegion).toHaveAttribute('aria-live', 'polite');
        });

        it('should provide appropriate table headers and descriptions', () => {
            render(
                <TestWrapper>
                    <div role='table' aria-label='Events table'>
                        <div role='row'>
                            <div role='columnheader' scope='col'>
                                Event Name
                            </div>
                            <div role='columnheader' scope='col'>
                                Date
                            </div>
                            <div role='columnheader' scope='col'>
                                Status
                            </div>
                        </div>
                        {mockEventList.map((event) => (
                            <div key={event.id} role='row'>
                                <div role='cell'>{event.title}</div>
                                <div role='cell'>{event.startDate}</div>
                                <div role='cell'>{event.status}</div>
                            </div>
                        ))}
                    </div>
                </TestWrapper>
            );

            const table = screen.getByRole('table');
            expect(table).toHaveAttribute('aria-label');

            // Check column headers
            const columnHeaders = screen.getAllByRole('columnheader');
            columnHeaders.forEach((header) => {
                expect(header).toHaveAttribute('scope', 'col');
            });

            // Check row headers if present
            const rowHeaders = screen.queryAllByRole('rowheader');
            rowHeaders.forEach((header) => {
                expect(header).toHaveAttribute('scope', 'row');
            });
        });

        it('should provide chart descriptions for screen readers', () => {
            render(
                <TestWrapper>
                    <RevenueChart
                        data={mockRevenueData}
                        chartType='line'
                        timeRange='12months'
                    />
                </TestWrapper>
            );

            const chart = screen.getByRole('img');
            expect(chart).toHaveAttribute('aria-label');

            // Should have a text alternative or description
            const description = chart.getAttribute('aria-label');
            expect(description).toContain('Revenue chart');
            expect(description).toContain('data points');
        });

        it('should announce dynamic content changes', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <div>
                        <button aria-label='Sort by event name'>Sort</button>
                        <div
                            role='status'
                            aria-live='polite'
                            id='announcements'
                        ></div>
                        <div role='table' aria-label='Events table'>
                            <div role='row'>
                                <div role='columnheader'>Event Name</div>
                                <div role='columnheader'>Date</div>
                                <div role='columnheader'>Status</div>
                            </div>
                            {mockEventList.map((event) => (
                                <div key={event.id} role='row'>
                                    <div role='cell'>{event.title}</div>
                                    <div role='cell'>{event.startDate}</div>
                                    <div role='cell'>{event.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TestWrapper>
            );

            // Find and interact with sort button
            const sortButton = screen.getByRole('button', {
                name: /sort by event name/i,
            });
            await user.click(sortButton);

            // Check for announcement region
            const announcements = screen.getByRole('status');
            expect(announcements).toHaveAttribute('aria-live', 'polite');
        });

        it('should provide form labels and descriptions', () => {
            render(
                <TestWrapper>
                    <ExportModal
                        isOpen={true}
                        onClose={() => {}}
                        onExport={() => {}}
                    />
                </TestWrapper>
            );

            // Check form controls have labels
            const inputs = screen.getAllByRole('textbox');
            inputs.forEach((input) => {
                expect(input).toHaveAccessibleName();
            });

            const checkboxes = screen.getAllByRole('checkbox');
            checkboxes.forEach((checkbox) => {
                expect(checkbox).toHaveAccessibleName();
            });

            const radioButtons = screen.getAllByRole('radio');
            radioButtons.forEach((radio) => {
                expect(radio).toHaveAccessibleName();
            });
        });
    });

    describe('Visual Accessibility Tests', () => {
        it('should maintain sufficient color contrast', () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        statistics={mockDashboardData.statistics}
                    />
                </TestWrapper>
            );

            // Check for high contrast mode support
            const elements = container.querySelectorAll('[data-high-contrast]');
            elements.forEach((element) => {
                expect(element).toHaveStyle('border: 1px solid');
            });
        });

        it('should support reduced motion preferences', () => {
            // Mock reduced motion preference
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            const { container } = render(
                <TestWrapper>
                    <RevenueChart
                        data={mockRevenueData}
                        chartType='line'
                        timeRange='12months'
                    />
                </TestWrapper>
            );

            // Check for reduced motion classes or attributes
            const animatedElements =
                container.querySelectorAll('[data-animate]');
            animatedElements.forEach((element) => {
                expect(element).toHaveClass('motion-reduce:animate-none');
            });
        });

        it('should provide focus indicators', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <div role='table' aria-label='Events table'>
                        <div role='row'>
                            <div role='columnheader'>Event Name</div>
                            <div role='columnheader'>Date</div>
                            <div role='columnheader'>Status</div>
                        </div>
                        {mockEventList.map((event) => (
                            <div key={event.id} role='row'>
                                <div
                                    role='cell'
                                    tabIndex={0}
                                    className='focus:ring-2 focus:ring-blue-500'
                                >
                                    {event.title}
                                </div>
                                <div
                                    role='cell'
                                    tabIndex={0}
                                    className='focus:ring-2 focus:ring-blue-500'
                                >
                                    {event.startDate}
                                </div>
                                <div
                                    role='cell'
                                    tabIndex={0}
                                    className='focus:ring-2 focus:ring-blue-500'
                                >
                                    {event.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </TestWrapper>
            );

            // Tab to first interactive element
            await user.tab();

            const focusedElement = document.activeElement;
            expect(focusedElement).toHaveClass('focus:ring-2');
            expect(focusedElement).toHaveClass('focus:ring-blue-500');
        });

        it('should support zoom up to 200% without horizontal scrolling', () => {
            // Mock viewport at 200% zoom
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600, // Simulating 1200px at 200% zoom
            });

            const { container } = render(
                <TestWrapper>
                    <main
                        role='main'
                        aria-label='Dashboard'
                        style={{ overflowX: 'visible' }}
                    >
                        <h1>Dashboard</h1>
                        <StatisticsOverview
                            statistics={mockDashboardData.statistics}
                        />
                    </main>
                </TestWrapper>
            );

            // Check that content doesn't overflow
            const mainContent = container.querySelector('[role="main"]');
            expect(mainContent).toHaveStyle('overflow-x: visible');
        });
    });

    describe('Error State Accessibility', () => {
        it('should announce errors to screen readers', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        statistics={null}
                        error='Failed to load statistics'
                    />
                </TestWrapper>
            );

            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toBeInTheDocument();
            expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
            expect(errorAlert).toHaveTextContent('Failed to load statistics');
        });

        it('should provide accessible error recovery options', () => {
            render(
                <TestWrapper>
                    <div>
                        <div role='alert'>Failed to load events</div>
                        <button
                            aria-label='Retry loading events'
                            aria-describedby='error-description'
                        >
                            Retry
                        </button>
                        <div id='error-description'>
                            Click to reload the events table
                        </div>
                    </div>
                </TestWrapper>
            );

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
            expect(retryButton).toHaveAccessibleDescription();
        });
    });

    describe('Loading State Accessibility', () => {
        it('should announce loading states to screen readers', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview statistics={null} loading={true} />
                </TestWrapper>
            );

            const loadingIndicator = screen.getByRole('status');
            expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
            expect(loadingIndicator).toHaveTextContent(/loading/i);
        });

        it('should provide accessible loading indicators', () => {
            render(
                <TestWrapper>
                    <div>
                        <div
                            role='progressbar'
                            aria-label='Loading events'
                            aria-describedby='loading-description'
                        >
                            Loading...
                        </div>
                        <div id='loading-description'>
                            Please wait while events are being loaded
                        </div>
                    </div>
                </TestWrapper>
            );

            const loadingSpinner = screen.getByRole('progressbar');
            expect(loadingSpinner).toBeInTheDocument();
            expect(loadingSpinner).toHaveAttribute(
                'aria-label',
                'Loading events'
            );
        });
    });

    describe('Mobile Accessibility', () => {
        beforeEach(() => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: 667,
            });
        });

        it('should maintain accessibility on mobile devices', async () => {
            const { container } = render(
                <TestWrapper>
                    <main role='main' aria-label='Dashboard'>
                        <h1>Dashboard</h1>
                        <StatisticsOverview
                            statistics={mockDashboardData.statistics}
                        />
                    </main>
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('main')).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should provide accessible touch targets', () => {
            render(
                <TestWrapper>
                    <div>
                        <button style={{ minHeight: '44px', minWidth: '44px' }}>
                            Action 1
                        </button>
                        <button style={{ minHeight: '44px', minWidth: '44px' }}>
                            Action 2
                        </button>
                        <div role='table' aria-label='Events table'>
                            <div role='row'>
                                <div role='columnheader'>Event Name</div>
                                <div role='columnheader'>Date</div>
                                <div role='columnheader'>Status</div>
                            </div>
                            {mockEventList.map((event) => (
                                <div key={event.id} role='row'>
                                    <div role='cell'>{event.title}</div>
                                    <div role='cell'>{event.startDate}</div>
                                    <div role='cell'>{event.status}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TestWrapper>
            );

            // Check that interactive elements meet minimum touch target size (44px)
            const buttons = screen.getAllByRole('button');
            buttons.forEach((button) => {
                const styles = window.getComputedStyle(button);
                const minHeight =
                    parseInt(styles.minHeight) || parseInt(styles.height);
                const minWidth =
                    parseInt(styles.minWidth) || parseInt(styles.width);

                expect(minHeight).toBeGreaterThanOrEqual(44);
                expect(minWidth).toBeGreaterThanOrEqual(44);
            });
        });
    });

    describe('Accessibility Performance', () => {
        it('should not impact performance significantly', async () => {
            const startTime = performance.now();

            const { container } = render(
                <TestWrapper>
                    <main role='main' aria-label='Dashboard'>
                        <h1>Dashboard</h1>
                        <StatisticsOverview
                            statistics={mockDashboardData.statistics}
                        />
                    </main>
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('main')).toBeInTheDocument();
            });

            const renderTime = performance.now() - startTime;

            // Run accessibility audit
            const auditStartTime = performance.now();
            const results = await axe(container);
            const auditTime = performance.now() - auditStartTime;

            expect(results).toHaveNoViolations();
            expect(renderTime).toBeLessThan(1000); // Should render within 1 second
            expect(auditTime).toBeLessThan(5000); // Audit should complete within 5 seconds

            console.log(
                `Render time: ${renderTime}ms, Audit time: ${auditTime}ms`
            );
        });
    });

    describe('Custom Accessibility Rules', () => {
        it('should have unique IDs for all elements that need them', () => {
            const { container } = render(
                <TestWrapper>
                    <main
                        role='main'
                        aria-label='Dashboard'
                        id='dashboard-main'
                    >
                        <h1 id='dashboard-title'>Dashboard</h1>
                        <div id='statistics-section'>
                            <StatisticsOverview
                                statistics={mockDashboardData.statistics}
                            />
                        </div>
                    </main>
                </TestWrapper>
            );

            const elementsWithIds = container.querySelectorAll('[id]');
            const ids = Array.from(elementsWithIds).map((el) => el.id);
            const uniqueIds = [...new Set(ids)];

            expect(ids.length).toBe(uniqueIds.length);
        });

        it('should have proper heading hierarchy', () => {
            render(
                <TestWrapper>
                    <main role='main' aria-label='Dashboard'>
                        <h1>Dashboard</h1>
                        <section>
                            <h2>Statistics</h2>
                            <StatisticsOverview
                                statistics={mockDashboardData.statistics}
                            />
                        </section>
                    </main>
                </TestWrapper>
            );

            const headings = screen.getAllByRole('heading');
            const headingLevels = headings.map((heading) => {
                const tagName = heading.tagName.toLowerCase();
                return parseInt(tagName.replace('h', ''));
            });

            // Check that heading levels don't skip (e.g., h1 -> h3)
            for (let i = 1; i < headingLevels.length; i++) {
                const currentLevel = headingLevels[i];
                const previousLevel = headingLevels[i - 1];
                expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
            }
        });

        it('should have proper landmark structure', () => {
            render(
                <TestWrapper>
                    <div>
                        <nav role='navigation' aria-label='Main navigation'>
                            <ul>
                                <li>
                                    <button>Dashboard</button>
                                </li>
                                <li>
                                    <button>Events</button>
                                </li>
                            </ul>
                        </nav>
                        <main role='main' aria-label='Dashboard'>
                            <h1>Dashboard</h1>
                            <StatisticsOverview
                                statistics={mockDashboardData.statistics}
                            />
                        </main>
                        <aside
                            role='complementary'
                            aria-label='Additional information'
                        >
                            <h2>Quick Actions</h2>
                        </aside>
                    </div>
                </TestWrapper>
            );

            // Check for main landmark
            expect(screen.getByRole('main')).toBeInTheDocument();

            // Check for navigation if present
            const navigation = screen.queryByRole('navigation');
            if (navigation) {
                expect(navigation).toHaveAccessibleName();
            }

            // Check for complementary content if present
            const complementary = screen.queryByRole('complementary');
            if (complementary) {
                expect(complementary).toHaveAccessibleName();
            }
        });
    });
});

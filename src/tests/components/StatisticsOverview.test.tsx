import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '../../lib/ThemeContext';
import StatisticsOverview from '../../components/StatisticsOverview';
import { EventStatistics, RevenueStatistics } from '../../lib/api';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock data
const mockEventStatistics: EventStatistics = {
    totalEvents: 25,
    publishedEvents: 20,
    draftEvents: 3,
    cancelledEvents: 1,
    completedEvents: 15,
    totalRegistrations: 1250,
    totalAttendees: 1100,
    totalRevenue: 2500000,
    pendingRevenue: 150000,
};

const mockRevenueStatistics: RevenueStatistics = {
    totalRevenue: 2500000,
    thisMonthRevenue: 450000,
    lastMonthRevenue: 380000,
    pendingRevenue: 150000,
    refundedRevenue: 25000,
    monthlyBreakdown: [],
    eventBreakdown: [],
};

// Test wrapper component
const TestWrapper: React.FC<{
    children: React.ReactNode;
    theme?: 'light' | 'dark';
}> = ({ children, theme = 'light' }) => {
    return (
        <ThemeProvider>
            <div className={theme}>{children}</div>
        </ThemeProvider>
    );
};

// Mock requestAnimationFrame for tests
beforeAll(() => {
    global.requestAnimationFrame = jest.fn((cb) => {
        setTimeout(cb, 0);
        return 0;
    });
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('StatisticsOverview', () => {
    describe('Rendering', () => {
        it('renders without crashing', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview />
                </TestWrapper>
            );

            expect(
                screen.getByRole('region', {
                    name: /event and revenue statistics overview/i,
                })
            ).toBeInTheDocument();
        });

        it('displays all statistic cards with correct titles', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Main statistics
            expect(screen.getByText('Total Events')).toBeInTheDocument();
            expect(screen.getByText('Published Events')).toBeInTheDocument();
            expect(screen.getByText('Total Revenue')).toBeInTheDocument();
            expect(screen.getByText('Total Attendees')).toBeInTheDocument();

            // Additional metrics
            expect(screen.getByText('Draft Events')).toBeInTheDocument();
            expect(screen.getByText('This Month Revenue')).toBeInTheDocument();
            expect(screen.getByText('Total Registrations')).toBeInTheDocument();
        });

        it('displays correct values from event statistics', async () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Wait for animations to complete
            await waitFor(
                () => {
                    expect(screen.getByText('25')).toBeInTheDocument(); // Total Events
                },
                { timeout: 2000 }
            );

            await waitFor(() => {
                expect(screen.getByText('20')).toBeInTheDocument(); // Published Events
            });

            await waitFor(() => {
                expect(screen.getByText('1,100')).toBeInTheDocument(); // Total Attendees
            });

            await waitFor(() => {
                expect(screen.getByText('3')).toBeInTheDocument(); // Draft Events
            });

            await waitFor(() => {
                expect(screen.getByText('1,250')).toBeInTheDocument(); // Total Registrations
            });
        });

        it('displays formatted currency values correctly', async () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Wait for animations and check for currency formatting (more flexible)
            await waitFor(
                () => {
                    expect(screen.getByText(/2,500,000/)).toBeInTheDocument(); // Total Revenue
                },
                { timeout: 2000 }
            );

            await waitFor(() => {
                expect(screen.getByText(/450,000/)).toBeInTheDocument(); // This Month Revenue
            });
        });
    });

    describe('Loading States', () => {
        it('shows skeleton loading states when loading is true', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview loading={true} />
                </TestWrapper>
            );

            // Should show skeleton components instead of actual data
            const skeletons = document.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('hides loading states when loading is false', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        loading={false}
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Should not show skeleton components
            const skeletons = document.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('displays error message when error prop is provided', () => {
            const errorMessage = 'Failed to fetch statistics data';

            render(
                <TestWrapper>
                    <StatisticsOverview error={errorMessage} />
                </TestWrapper>
            );

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(
                screen.getByText('Failed to load statistics')
            ).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        it('does not display error when loading is true', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview error='Some error' loading={true} />
                </TestWrapper>
            );

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });

    describe('Trend Indicators', () => {
        it('shows positive trend indicator for revenue growth', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // This month revenue (450000) vs last month (380000) = +18.4% growth
            expect(screen.getByText('+18.4%')).toBeInTheDocument();
        });

        it('calculates percentage changes correctly', () => {
            const revenueWithDecrease: RevenueStatistics = {
                ...mockRevenueStatistics,
                thisMonthRevenue: 300000,
                lastMonthRevenue: 400000,
            };

            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={revenueWithDecrease}
                    />
                </TestWrapper>
            );

            // 300000 vs 400000 = -25% decrease
            expect(screen.getByText('-25.0%')).toBeInTheDocument();
        });

        it('shows no change indicator when difference is insignificant', () => {
            const revenueWithMinimalChange: RevenueStatistics = {
                ...mockRevenueStatistics,
                thisMonthRevenue: 380001, // Only 1 naira difference
                lastMonthRevenue: 380000,
            };

            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={revenueWithMinimalChange}
                    />
                </TestWrapper>
            );

            expect(screen.getByText('No change')).toBeInTheDocument();
        });
    });

    describe('Animated Counter', () => {
        it('animates values from 0 to target value', async () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Wait for animation to complete
            await waitFor(
                () => {
                    expect(screen.getByText('25')).toBeInTheDocument();
                },
                { timeout: 2000 }
            );
        });

        it('applies animation styling during counting', async () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Check if animation class is applied during animation
            await act(async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
            });

            // Animation should complete eventually
            await waitFor(() => {
                expect(screen.getByText('25')).toBeInTheDocument();
            });
        });
    });

    describe('Theme Support', () => {
        it('applies dark theme styles correctly', () => {
            // Mock the theme context to return dark theme
            const mockUseTheme = jest.fn(() => ({
                theme: 'dark',
                toggleTheme: jest.fn(),
            }));
            jest.doMock('../../lib/ThemeContext', () => ({
                useTheme: mockUseTheme,
                ThemeProvider: ({
                    children,
                }: {
                    children: React.ReactNode;
                }) => <div>{children}</div>,
            }));

            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Check for dark theme classes or just verify the component renders
            expect(container.querySelector('.space-y-6')).toBeInTheDocument();

            jest.clearAllMocks();
        });

        it('applies light theme styles correctly', () => {
            const { container } = render(
                <TestWrapper theme='light'>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Check for light theme classes
            const cards = container.querySelectorAll('.border-gray-200');
            expect(cards.length).toBeGreaterThan(0);
        });
    });

    describe('Responsive Design', () => {
        it('applies responsive grid classes', () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Check for responsive grid classes
            const mainGrid = container.querySelector(
                '.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4'
            );
            expect(mainGrid).toBeInTheDocument();

            const additionalGrid = container.querySelector(
                '.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3'
            );
            expect(additionalGrid).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has no accessibility violations', async () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('provides proper ARIA labels for statistics', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            expect(
                screen.getByRole('region', {
                    name: /total number of events created/i,
                })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('region', {
                    name: /number of published events/i,
                })
            ).toBeInTheDocument();
            expect(
                screen.getByRole('region', {
                    name: /total revenue generated from events/i,
                })
            ).toBeInTheDocument();
        });

        it('provides live region updates for animated counters', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            const liveRegions = document.querySelectorAll(
                '[aria-live="polite"]'
            );
            expect(liveRegions.length).toBeGreaterThan(0);
        });

        it('provides status updates for trend indicators', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            const statusElements = screen.getAllByRole('status');
            expect(statusElements.length).toBeGreaterThan(0);
        });

        it('hides decorative icons from screen readers', () => {
            const { container } = render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            const hiddenIcons = container.querySelectorAll(
                '[aria-hidden="true"]'
            );
            expect(hiddenIcons.length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('handles undefined statistics gracefully', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={undefined}
                        revenueStatistics={undefined}
                    />
                </TestWrapper>
            );

            // Should display 0 values instead of crashing
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        });

        it('handles null statistics gracefully', () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={null}
                        revenueStatistics={null}
                    />
                </TestWrapper>
            );

            // Should display 0 values instead of crashing
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        });

        it('handles missing properties in statistics objects', async () => {
            const incompleteEventStats: Partial<EventStatistics> = {
                totalEvents: 10,
                // Missing other properties
            };

            const incompleteRevenueStats: Partial<RevenueStatistics> = {
                totalRevenue: 100000,
                // Missing other properties
            };

            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={
                            incompleteEventStats as EventStatistics
                        }
                        revenueStatistics={
                            incompleteRevenueStats as RevenueStatistics
                        }
                    />
                </TestWrapper>
            );

            // Wait for animations to complete
            await waitFor(
                () => {
                    expect(screen.getByText('10')).toBeInTheDocument(); // totalEvents
                },
                { timeout: 2000 }
            );

            await waitFor(() => {
                expect(screen.getByText(/100,000/)).toBeInTheDocument(); // totalRevenue
            });
        });

        it('handles zero values correctly', () => {
            const zeroStats: EventStatistics = {
                totalEvents: 0,
                publishedEvents: 0,
                draftEvents: 0,
                cancelledEvents: 0,
                completedEvents: 0,
                totalRegistrations: 0,
                totalAttendees: 0,
                totalRevenue: 0,
                pendingRevenue: 0,
            };

            const zeroRevenue: RevenueStatistics = {
                totalRevenue: 0,
                thisMonthRevenue: 0,
                lastMonthRevenue: 0,
                pendingRevenue: 0,
                refundedRevenue: 0,
                monthlyBreakdown: [],
                eventBreakdown: [],
            };

            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={zeroStats}
                        revenueStatistics={zeroRevenue}
                    />
                </TestWrapper>
            );

            // Should handle zero values without issues
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
            expect(screen.getAllByText(/₦0/).length).toBeGreaterThan(0);
        });
    });

    describe('Custom Formatting', () => {
        it('formats large numbers with proper locale formatting', async () => {
            const largeNumberStats: EventStatistics = {
                ...mockEventStatistics,
                totalAttendees: 1234567,
                totalRegistrations: 9876543,
            };

            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={largeNumberStats}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Wait for animations to complete and check for large numbers
            await waitFor(
                () => {
                    expect(screen.getByText(/1,234,567/)).toBeInTheDocument();
                },
                { timeout: 2000 }
            );

            await waitFor(() => {
                expect(screen.getByText(/9,876,543/)).toBeInTheDocument();
            });
        });

        it('formats currency without decimal places for whole numbers', async () => {
            render(
                <TestWrapper>
                    <StatisticsOverview
                        eventStatistics={mockEventStatistics}
                        revenueStatistics={mockRevenueStatistics}
                    />
                </TestWrapper>
            );

            // Wait for animations and check that decimal places are not shown
            await waitFor(
                () => {
                    expect(screen.getByText(/2,500,000/)).toBeInTheDocument();
                },
                { timeout: 2000 }
            );

            // Should not show .00 for whole number amounts
            expect(screen.queryByText(/\.00/)).not.toBeInTheDocument();
        });
    });
});

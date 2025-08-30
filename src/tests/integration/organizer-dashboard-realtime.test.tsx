import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerDashboardRealtime } from '@/components/OrganizerDashboardRealtime';
import { useOrganizerDashboardRealtime } from '@/hooks/useOrganizerDashboardRealtime';
import type {
    DashboardMetrics,
    EventStatusChange,
    RegistrationUpdate,
    RevenueUpdate,
} from '@/hooks/useOrganizerDashboardRealtime';

// Mock the hook
jest.mock('@/hooks/useOrganizerDashboardRealtime');

// Mock UI components that might cause issues in tests
jest.mock('@/components/ui/progress', () => ({
    Progress: ({
        value,
        className,
    }: {
        value?: number;
        className?: string;
    }) => (
        <div className={className} data-testid='progress' data-value={value} />
    ),
}));

const mockDashboardMetrics: DashboardMetrics = {
    totalEvents: 15,
    activeEvents: 8,
    draftEvents: 3,
    publishedEvents: 10,
    cancelledEvents: 2,
    totalRevenue: 12500.0,
    monthlyRevenue: 3200.0,
    totalAttendees: 450,
    monthlyAttendees: 120,
    pendingPayments: 5,
    failedPayments: 2,
    revenueGrowth: 15.5,
    attendeeGrowth: 22.3,
    conversionRate: 68.5,
    averageTicketPrice: 27.78,
    lastUpdated: new Date('2024-01-15T10:00:00Z'),
};

const mockEventStatusChange: EventStatusChange = {
    eventId: 'event-123',
    eventTitle: 'Test Event',
    oldStatus: 'Draft',
    newStatus: 'Published',
    timestamp: new Date('2024-01-15T09:30:00Z'),
    organizerId: 'org-123',
    reason: 'Event published by organizer',
};

const mockRegistrationUpdate: RegistrationUpdate = {
    eventId: 'event-123',
    eventTitle: 'Test Event',
    attendeeId: 'attendee-123',
    attendeeName: 'John Doe',
    attendeeEmail: 'john@example.com',
    ticketType: 'General Admission',
    ticketPrice: 50.0,
    paymentStatus: 'Completed',
    registrationDate: new Date('2024-01-15T09:45:00Z'),
    totalRegistrations: 25,
    revenue: 50.0,
};

const mockRevenueUpdate: RevenueUpdate = {
    eventId: 'event-123',
    eventTitle: 'Test Event',
    paymentId: 'payment-123',
    amount: 50.0,
    netAmount: 47.5,
    currency: 'USD',
    paymentMethod: 'CreditCard',
    transactionDate: new Date('2024-01-15T09:45:00Z'),
    totalRevenue: 12547.5,
    monthlyRevenue: 3247.5,
    organizerId: 'org-123',
};

const mockHookResult = {
    metrics: mockDashboardMetrics,
    isMetricsLoading: false,
    metricsError: null,
    eventStatusChanges: [mockEventStatusChange],
    registrationUpdates: [mockRegistrationUpdate],
    revenueUpdates: [mockRevenueUpdate],
    financingUpdates: [],
    updateHistory: [],
    stats: {
        totalUpdates: 3,
        todayUpdates: 3,
        recentRegistrations: 1,
        recentRevenue: 47.5,
        pendingFinancing: 0,
    },
    refreshMetrics: jest.fn(),
    clearUpdateHistory: jest.fn(),
    getUpdatesByType: jest.fn(),
    getRecentUpdates: jest.fn(),
    onMetricsChange: jest.fn(),
    onEventStatusChange: jest.fn(),
    onRegistrationChange: jest.fn(),
    onRevenueChange: jest.fn(),
    onFinancingChange: jest.fn(),
};

describe('OrganizerDashboardRealtime Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue(
            mockHookResult
        );
    });

    describe('Component Rendering', () => {
        it('renders dashboard with all sections', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(
                screen.getByText(
                    'Real-time overview of your events and performance'
                )
            ).toBeInTheDocument();
            expect(screen.getByText('Total Events')).toBeInTheDocument();
            expect(screen.getByText('Total Revenue')).toBeInTheDocument();
            expect(screen.getByText('Total Attendees')).toBeInTheDocument();
            expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
            expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        });

        it('displays correct metric values', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(screen.getByText('15')).toBeInTheDocument(); // Total Events
            expect(screen.getByText('$12,500.00')).toBeInTheDocument(); // Total Revenue
            expect(screen.getByText('450')).toBeInTheDocument(); // Total Attendees
            expect(screen.getByText('68.5%')).toBeInTheDocument(); // Conversion Rate
        });

        it('shows live indicator when live updates are enabled', () => {
            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    showLiveUpdates={true}
                />
            );

            expect(screen.getByText('Live')).toBeInTheDocument();
            expect(screen.getByText(/Updated/)).toBeInTheDocument();
        });

        it('hides live indicator when live updates are disabled', () => {
            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    showLiveUpdates={false}
                />
            );

            expect(screen.queryByText('Live')).not.toBeInTheDocument();
        });
    });

    describe('Metrics Display', () => {
        it('shows loading state for metrics', () => {
            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue({
                ...mockHookResult,
                isMetricsLoading: true,
                metrics: null,
            });

            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            // Should show loading placeholders
            const loadingElements = screen.getAllByRole('generic');
            const loadingPlaceholders = loadingElements.filter((el) =>
                el.className.includes('animate-pulse')
            );
            expect(loadingPlaceholders.length).toBeGreaterThan(0);
        });

        it('shows error state for metrics', () => {
            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue({
                ...mockHookResult,
                metricsError: 'Failed to load metrics',
                metrics: null,
            });

            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(
                screen.getByText('Error loading metrics')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Failed to load metrics')
            ).toBeInTheDocument();
        });

        it('displays trend indicators correctly', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            // Should show positive trends for revenue and attendee growth
            expect(screen.getByText('+15.5% this month')).toBeInTheDocument();
            expect(screen.getByText('+22.3% this month')).toBeInTheDocument();
        });

        it('hides metrics when showMetrics is false', () => {
            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    showMetrics={false}
                />
            );

            expect(screen.queryByText('Total Events')).not.toBeInTheDocument();
            expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
        });
    });

    describe('Recent Activity', () => {
        it('displays recent activity items', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(screen.getByText('New Registration')).toBeInTheDocument();
            expect(
                screen.getByText('John Doe registered for Test Event')
            ).toBeInTheDocument();
            expect(screen.getByText('Payment Received')).toBeInTheDocument();
            expect(
                screen.getByText('Payment for Test Event')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Event Status Changed')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Test Event changed from Draft to Published')
            ).toBeInTheDocument();
        });

        it('shows empty state when no activity', () => {
            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue({
                ...mockHookResult,
                eventStatusChanges: [],
                registrationUpdates: [],
                revenueUpdates: [],
                financingUpdates: [],
            });

            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(screen.getByText('No recent activity')).toBeInTheDocument();
            expect(
                screen.getByText(
                    'Activity will appear here as events, registrations, and payments occur.'
                )
            ).toBeInTheDocument();
        });

        it('hides recent activity when showRecentActivity is false', () => {
            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    showRecentActivity={false}
                />
            );

            expect(
                screen.queryByText('Recent Activity')
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText('New Registration')
            ).not.toBeInTheDocument();
        });

        it('limits activity items to maxRecentItems', () => {
            // Create multiple activity items
            const manyRegistrations = Array.from({ length: 10 }, (_, i) => ({
                ...mockRegistrationUpdate,
                attendeeId: `attendee-${i}`,
                attendeeName: `User ${i}`,
            }));

            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue({
                ...mockHookResult,
                registrationUpdates: manyRegistrations,
            });

            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    maxRecentItems={5}
                />
            );

            // Should only show 5 items (plus other activity types)
            const registrationItems = screen.getAllByText(
                /registered for Test Event/
            );
            expect(registrationItems.length).toBeLessThanOrEqual(5);
        });
    });

    describe('User Interactions', () => {
        it('handles refresh button click', async () => {
            const user = userEvent.setup();
            const mockRefreshMetrics = jest.fn().mockResolvedValue(undefined);

            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue({
                ...mockHookResult,
                refreshMetrics: mockRefreshMetrics,
            });

            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            const refreshButton = screen.getByRole('button', {
                name: /refresh/i,
            });
            await user.click(refreshButton);

            expect(mockRefreshMetrics).toHaveBeenCalled();
        });

        it('shows loading state during refresh', async () => {
            const user = userEvent.setup();
            let resolveRefresh: () => void;
            const refreshPromise = new Promise<void>((resolve) => {
                resolveRefresh = resolve;
            });

            const mockRefreshMetrics = jest
                .fn()
                .mockReturnValue(refreshPromise);

            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue({
                ...mockHookResult,
                refreshMetrics: mockRefreshMetrics,
            });

            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            const refreshButton = screen.getByRole('button', {
                name: /refresh/i,
            });
            await user.click(refreshButton);

            // Button should be disabled during refresh
            expect(refreshButton).toBeDisabled();

            // Resolve the refresh
            resolveRefresh!();
            await waitFor(() => {
                expect(refreshButton).not.toBeDisabled();
            });
        });
    });

    describe('Real-time Updates', () => {
        it('calls onMetricsUpdate callback when metrics change', () => {
            const onMetricsUpdate = jest.fn();

            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    onMetricsUpdate={onMetricsUpdate}
                />
            );

            // Simulate the hook calling the callback
            const hookCall = (useOrganizerDashboardRealtime as jest.Mock).mock
                .calls[0][0];
            hookCall.onMetricsUpdate(mockDashboardMetrics);

            expect(onMetricsUpdate).toHaveBeenCalledWith(mockDashboardMetrics);
        });

        it('calls onActivityUpdate callback when activity occurs', () => {
            const onActivityUpdate = jest.fn();

            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    onActivityUpdate={onActivityUpdate}
                />
            );

            // Simulate the hook calling the callback
            const hookCall = (useOrganizerDashboardRealtime as jest.Mock).mock
                .calls[0][0];
            hookCall.onRegistrationUpdate(mockRegistrationUpdate);

            expect(onActivityUpdate).toHaveBeenCalledWith(
                mockRegistrationUpdate
            );
        });

        it('updates last update time when metrics change', () => {
            const { rerender } = render(
                <OrganizerDashboardRealtime organizerId='org-123' />
            );

            // Simulate metrics update
            const hookCall = (useOrganizerDashboardRealtime as jest.Mock).mock
                .calls[0][0];
            hookCall.onMetricsUpdate({
                ...mockDashboardMetrics,
                lastUpdated: new Date(),
            });

            rerender(<OrganizerDashboardRealtime organizerId='org-123' />);

            // Time should be updated (though we can't easily test the exact value)
            expect(screen.getByText(/Updated/)).toBeInTheDocument();
        });
    });

    describe('Configuration Options', () => {
        it('passes correct options to the hook', () => {
            render(
                <OrganizerDashboardRealtime
                    organizerId='org-123'
                    showMetrics={false}
                    showRecentActivity={false}
                    refreshInterval={60000}
                />
            );

            const hookCall = (useOrganizerDashboardRealtime as jest.Mock).mock
                .calls[0][0];

            expect(hookCall.organizerId).toBe('org-123');
            expect(hookCall.enableMetricsUpdates).toBe(false);
            expect(hookCall.enableEventStatusUpdates).toBe(false);
            expect(hookCall.enableRegistrationUpdates).toBe(false);
            expect(hookCall.enableRevenueUpdates).toBe(false);
            expect(hookCall.enableFinancingUpdates).toBe(false);
            expect(hookCall.metricsUpdateInterval).toBe(60000);
        });

        it('uses default options when not specified', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            const hookCall = (useOrganizerDashboardRealtime as jest.Mock).mock
                .calls[0][0];

            expect(hookCall.enableMetricsUpdates).toBe(true);
            expect(hookCall.enableEventStatusUpdates).toBe(true);
            expect(hookCall.enableRegistrationUpdates).toBe(true);
            expect(hookCall.enableRevenueUpdates).toBe(true);
            expect(hookCall.enableFinancingUpdates).toBe(true);
            expect(hookCall.metricsUpdateInterval).toBe(30000);
        });
    });

    describe('Responsive Design', () => {
        it('renders metric cards in grid layout', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            const metricsContainer = screen
                .getByText('Total Events')
                .closest('.grid');
            expect(metricsContainer).toHaveClass(
                'grid',
                'gap-4',
                'md:grid-cols-2',
                'lg:grid-cols-4'
            );
        });

        it('renders additional metrics in responsive grid', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            const eventStatusCard = screen
                .getByText('Event Status')
                .closest('.grid');
            expect(eventStatusCard).toHaveClass(
                'grid',
                'gap-4',
                'md:grid-cols-3'
            );
        });
    });

    describe('Accessibility', () => {
        it('provides proper ARIA labels and roles', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(
                screen.getByRole('button', { name: /refresh/i })
            ).toBeInTheDocument();

            // Check for proper heading structure
            expect(
                screen.getByRole('heading', { level: 2, name: 'Dashboard' })
            ).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            // Tab to refresh button
            await user.tab();
            expect(
                screen.getByRole('button', { name: /refresh/i })
            ).toHaveFocus();
        });

        it('provides meaningful text for screen readers', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            expect(
                screen.getByText(
                    'Real-time overview of your events and performance'
                )
            ).toBeInTheDocument();
            expect(
                screen.getByText(
                    'Activity will appear here as events, registrations, and payments occur.' ||
                        'New Registration'
                )
            ).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('handles large amounts of activity data efficiently', () => {
            const largeDataset = {
                ...mockHookResult,
                registrationUpdates: Array.from({ length: 1000 }, (_, i) => ({
                    ...mockRegistrationUpdate,
                    attendeeId: `attendee-${i}`,
                    attendeeName: `User ${i}`,
                })),
                revenueUpdates: Array.from({ length: 1000 }, (_, i) => ({
                    ...mockRevenueUpdate,
                    paymentId: `payment-${i}`,
                })),
            };

            (useOrganizerDashboardRealtime as jest.Mock).mockReturnValue(
                largeDataset
            );

            const { container } = render(
                <OrganizerDashboardRealtime organizerId='org-123' />
            );

            // Should render without performance issues
            expect(container).toBeInTheDocument();

            // Should limit displayed items
            const activityItems = screen.getAllByText(
                /registered for Test Event|Payment for Test Event/
            );
            expect(activityItems.length).toBeLessThanOrEqual(20); // 10 default max * 2 types
        });

        it('uses ScrollArea for large activity lists', () => {
            render(<OrganizerDashboardRealtime organizerId='org-123' />);

            // ScrollArea should be present for the activity section
            const activitySection = screen
                .getByText('Recent Activity')
                .closest('.space-y-6');
            expect(
                activitySection?.querySelector(
                    '[data-radix-scroll-area-viewport]'
                )
            ).toBeInTheDocument();
        });
    });
});

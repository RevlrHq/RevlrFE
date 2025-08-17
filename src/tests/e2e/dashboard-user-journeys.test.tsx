/**
 * End-to-End Tests for Critical Dashboard User Journeys
 *
 * These tests simulate complete user workflows from login to task completion,
 * testing the entire application stack including authentication, navigation,
 * data persistence, and user interactions.
 */

import React from 'react';
import {
    render,
    screen,
    waitFor,
    fireEvent,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Dashboard from '@features/dashboard/Dashboard';
import {
    createMockOrganizerDashboard,
    createMockEventSummary,
} from '../utils/dashboard-test-factories';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
    }),
    usePathname: () => '/dashboard',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock authentication
const mockUser = {
    id: 'user-123',
    email: 'organizer@test.com',
    name: 'Test Organizer',
    role: 'organizer',
    token: 'mock-jwt-token',
};

jest.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: mockUser,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
    }),
}));

// Test data
const mockDashboardData = createMockOrganizerDashboard({
    organizerId: 'org-123',
    organizerName: 'Test Organizer',
    statistics: {
        totalEvents: 15,
        publishedEvents: 12,
        draftEvents: 3,
        totalRegistrations: 450,
        totalAttendees: 380,
        totalRevenue: 25000,
    },
    recentEvents: [
        createMockEventSummary({
            id: 'event-1',
            title: 'Tech Conference 2024',
            status: 'Published',
            revenue: 5000,
            registrationCount: 100,
        }),
        createMockEventSummary({
            id: 'event-2',
            title: 'Workshop Series',
            status: 'Draft',
            revenue: 0,
            registrationCount: 0,
        }),
        createMockEventSummary({
            id: 'event-3',
            title: 'Networking Event',
            status: 'Published',
            revenue: 1500,
            registrationCount: 75,
        }),
    ],
});

// MSW server setup
const server = setupServer(
    // Dashboard data
    rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
        return res(ctx.json({ success: true, data: mockDashboardData }));
    }),

    // Events list with pagination
    rest.get('/api/Organizer/events', (req, res, ctx) => {
        const page = parseInt(req.url.searchParams.get('page') || '1');
        const pageSize = parseInt(req.url.searchParams.get('pageSize') || '10');
        const status = req.url.searchParams.get('status');
        const search = req.url.searchParams.get('search');

        let filteredEvents = mockDashboardData.recentEvents || [];

        if (status) {
            filteredEvents = filteredEvents.filter(
                (event) => event.status === status
            );
        }

        if (search) {
            filteredEvents = filteredEvents.filter((event) =>
                event.title?.toLowerCase().includes(search.toLowerCase())
            );
        }

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

        return res(
            ctx.json({
                success: true,
                data: {
                    items: paginatedEvents,
                    totalCount: filteredEvents.length,
                    page,
                    pageSize,
                    totalPages: Math.ceil(filteredEvents.length / pageSize),
                },
            })
        );
    }),

    // Event details
    rest.get('/api/Organizer/events/:eventId', (req, res, ctx) => {
        const { eventId } = req.params;
        const event = mockDashboardData.recentEvents?.find(
            (e) => e.id === eventId
        );

        if (!event) {
            return res(ctx.status(404), ctx.json({ error: 'Event not found' }));
        }

        return res(ctx.json({ success: true, data: event }));
    }),

    // Event update
    rest.put('/api/Organizer/events/:eventId', (req, res, ctx) => {
        const { eventId } = req.params;
        return res(
            ctx.json({
                success: true,
                data: { id: eventId, message: 'Event updated successfully' },
            })
        );
    }),

    // Event publish
    rest.post('/api/Organizer/events/:eventId/publish', (req, res, ctx) => {
        const { eventId } = req.params;
        return res(
            ctx.json({
                success: true,
                data: { id: eventId, status: 'Published' },
            })
        );
    }),

    // Bulk actions
    rest.post('/api/Organizer/events/bulk-action', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                message: 'Bulk action completed successfully',
                affectedCount: 2,
            })
        );
    }),

    // Event duplication
    rest.post('/api/Organizer/events/duplicate', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: {
                    id: 'event-duplicate',
                    title: 'Tech Conference 2024 (Copy)',
                    status: 'Draft',
                },
            })
        );
    }),

    // Analytics data
    rest.get('/api/Organizer/reports/monthly-revenue', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: [
                    { month: '2024-01', revenue: 5000 },
                    { month: '2024-02', revenue: 6500 },
                    { month: '2024-03', revenue: 8000 },
                    { month: '2024-04', revenue: 7200 },
                    { month: '2024-05', revenue: 9500 },
                    { month: '2024-06', revenue: 11000 },
                ],
            })
        );
    }),

    // Event performance
    rest.get('/api/Organizer/events/top-performing', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: mockDashboardData.recentEvents?.slice(0, 3),
            })
        );
    }),

    // Registrations
    rest.get('/api/Organizer/registrations', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: {
                    items: [
                        {
                            id: 'reg-1',
                            eventId: 'event-1',
                            eventTitle: 'Tech Conference 2024',
                            attendeeName: 'John Doe',
                            attendeeEmail: 'john@example.com',
                            registrationDate: '2024-03-15T10:00:00Z',
                            status: 'Confirmed',
                        },
                        {
                            id: 'reg-2',
                            eventId: 'event-1',
                            eventTitle: 'Tech Conference 2024',
                            attendeeName: 'Jane Smith',
                            attendeeEmail: 'jane@example.com',
                            registrationDate: '2024-03-16T14:30:00Z',
                            status: 'Confirmed',
                        },
                    ],
                    totalCount: 2,
                    page: 1,
                    pageSize: 10,
                },
            })
        );
    }),

    // Export data
    rest.post('/api/Organizer/export', (req, res, ctx) => {
        return res(
            ctx.json({
                success: true,
                data: {
                    downloadUrl: 'https://example.com/export.csv',
                    fileName: 'dashboard-export.csv',
                },
            })
        );
    })
);

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
});
afterAll(() => server.close());

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
                gcTime: 0,
            },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('Dashboard User Journeys', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
        // Reset localStorage
        localStorage.clear();
        sessionStorage.clear();
    });

    describe('Complete Dashboard Overview Journey', () => {
        it('should load dashboard, view analytics, and navigate to event management', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            // Step 1: Dashboard loads with overview data
            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Verify key metrics are displayed
            expect(screen.getByText('15')).toBeInTheDocument(); // Total events
            expect(screen.getByText('450')).toBeInTheDocument(); // Total registrations
            expect(screen.getByText('$25,000')).toBeInTheDocument(); // Total revenue

            // Step 2: View analytics charts
            await waitFor(() => {
                expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
            });

            // Interact with time range selector
            const timeRangeSelect = screen.getByRole('combobox', {
                name: /time range/i,
            });
            await user.selectOptions(timeRangeSelect, '6months');

            // Verify chart updates
            await waitFor(() => {
                const chart = screen.getByTestId('revenue-chart');
                expect(chart).toBeInTheDocument();
            });

            // Step 3: Navigate to event management
            const viewAllEventsButton = screen.getByRole('button', {
                name: /view all events/i,
            });
            await user.click(viewAllEventsButton);

            // Verify navigation occurred
            expect(mockPush).toHaveBeenCalledWith('/dashboard/events');
        });

        it('should handle dashboard customization workflow', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Step 1: Open customization panel
            const customizeButton = screen.getByRole('button', {
                name: /customize dashboard/i,
            });
            await user.click(customizeButton);

            // Step 2: Toggle widget visibility
            const revenueWidgetToggle = screen.getByRole('switch', {
                name: /revenue analytics/i,
            });
            await user.click(revenueWidgetToggle);

            // Step 3: Rearrange widgets (simulate drag and drop)
            const statisticsWidget = screen.getByTestId('statistics-widget');
            const eventsWidget = screen.getByTestId('events-widget');

            fireEvent.dragStart(statisticsWidget);
            fireEvent.dragOver(eventsWidget);
            fireEvent.drop(eventsWidget);

            // Step 4: Save customization
            const saveButton = screen.getByRole('button', {
                name: /save layout/i,
            });
            await user.click(saveButton);

            // Verify customization is saved
            await waitFor(() => {
                expect(
                    screen.getByText(/layout saved successfully/i)
                ).toBeInTheDocument();
            });

            // Verify localStorage contains the customization
            const savedLayout = localStorage.getItem('dashboard-layout');
            expect(savedLayout).toBeTruthy();
        });
    });

    describe('Event Management Journey', () => {
        it('should complete full event management workflow', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });

            // Step 1: Filter events by status
            const statusFilter = screen.getByRole('combobox', {
                name: /status/i,
            });
            await user.selectOptions(statusFilter, 'Draft');

            await waitFor(() => {
                expect(screen.getByText('Workshop Series')).toBeInTheDocument();
                expect(
                    screen.queryByText('Tech Conference 2024')
                ).not.toBeInTheDocument();
            });

            // Step 2: Search for specific event
            const searchInput = screen.getByRole('textbox', {
                name: /search events/i,
            });
            await user.clear(searchInput);
            await user.type(searchInput, 'Workshop');

            await waitFor(() => {
                expect(screen.getByText('Workshop Series')).toBeInTheDocument();
            });

            // Step 3: Edit event inline
            const editButton = screen.getByRole('button', {
                name: /edit workshop series/i,
            });
            await user.click(editButton);

            const titleInput = screen.getByDisplayValue('Workshop Series');
            await user.clear(titleInput);
            await user.type(titleInput, 'Advanced Workshop Series');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            await waitFor(() => {
                expect(
                    screen.getByText(/event updated successfully/i)
                ).toBeInTheDocument();
            });

            // Step 4: Publish event
            const publishButton = screen.getByRole('button', {
                name: /publish/i,
            });
            await user.click(publishButton);

            const confirmPublishButton = screen.getByRole('button', {
                name: /confirm publish/i,
            });
            await user.click(confirmPublishButton);

            await waitFor(() => {
                expect(
                    screen.getByText(/event published successfully/i)
                ).toBeInTheDocument();
            });

            // Step 5: Duplicate event
            const duplicateButton = screen.getByRole('button', {
                name: /duplicate/i,
            });
            await user.click(duplicateButton);

            await waitFor(() => {
                expect(
                    screen.getByText(/event duplicated successfully/i)
                ).toBeInTheDocument();
            });
        });

        it('should handle bulk operations workflow', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('table')).toBeInTheDocument();
            });

            // Step 1: Select multiple events
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[1]); // First event
            await user.click(checkboxes[2]); // Second event

            // Verify selection count
            expect(screen.getByText('2 events selected')).toBeInTheDocument();

            // Step 2: Open bulk actions menu
            const bulkActionsButton = screen.getByRole('button', {
                name: /bulk actions/i,
            });
            await user.click(bulkActionsButton);

            // Step 3: Select bulk publish action
            const publishAction = screen.getByRole('menuitem', {
                name: /publish selected/i,
            });
            await user.click(publishAction);

            // Step 4: Confirm bulk action
            const confirmDialog = screen.getByRole('dialog');
            expect(confirmDialog).toBeInTheDocument();
            expect(
                within(confirmDialog).getByText(/publish 2 events/i)
            ).toBeInTheDocument();

            const confirmButton = within(confirmDialog).getByRole('button', {
                name: /confirm/i,
            });
            await user.click(confirmButton);

            // Step 5: Verify success
            await waitFor(() => {
                expect(
                    screen.getByText(/bulk action completed successfully/i)
                ).toBeInTheDocument();
                expect(
                    screen.getByText(/2 events affected/i)
                ).toBeInTheDocument();
            });

            // Verify selection is cleared
            expect(
                screen.queryByText('2 events selected')
            ).not.toBeInTheDocument();
        });
    });

    describe('Analytics and Reporting Journey', () => {
        it('should complete analytics exploration workflow', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
            });

            // Step 1: Explore revenue trends
            const revenueChart = screen.getByTestId('revenue-chart');
            expect(revenueChart).toBeInTheDocument();

            // Interact with chart (simulate hover)
            fireEvent.mouseOver(revenueChart);

            // Step 2: Change time period
            const timePeriodSelect = screen.getByRole('combobox', {
                name: /time period/i,
            });
            await user.selectOptions(timePeriodSelect, '12months');

            await waitFor(() => {
                // Chart should update with new data
                expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
            });

            // Step 3: View event performance comparison
            const performanceTab = screen.getByRole('tab', {
                name: /event performance/i,
            });
            await user.click(performanceTab);

            await waitFor(() => {
                expect(
                    screen.getByTestId('performance-chart')
                ).toBeInTheDocument();
            });

            // Step 4: Drill down into specific event
            const eventBar = screen.getByTestId('event-1-bar');
            await user.click(eventBar);

            // Should navigate to event details
            expect(mockPush).toHaveBeenCalledWith('/dashboard/events/event-1');
        });

        it('should complete data export workflow', async () => {
            // Mock file download
            const mockCreateObjectURL = jest.fn(() => 'mock-blob-url');
            const mockRevokeObjectURL = jest.fn();
            Object.defineProperty(URL, 'createObjectURL', {
                value: mockCreateObjectURL,
            });
            Object.defineProperty(URL, 'revokeObjectURL', {
                value: mockRevokeObjectURL,
            });

            // Mock link click
            const mockClick = jest.fn();
            const mockLink = { click: mockClick, href: '', download: '' };
            jest.spyOn(document, 'createElement').mockImplementation(
                (tagName) => {
                    if (tagName === 'a') {
                        return mockLink as HTMLAnchorElement;
                    }
                    return document.createElement(tagName) as HTMLElement;
                }
            );

            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Step 1: Open export modal
            const exportButton = screen.getByRole('button', {
                name: /export data/i,
            });
            await user.click(exportButton);

            const exportModal = screen.getByRole('dialog', {
                name: /export dashboard data/i,
            });
            expect(exportModal).toBeInTheDocument();

            // Step 2: Select data to export
            const eventsCheckbox = within(exportModal).getByRole('checkbox', {
                name: /events/i,
            });
            const revenueCheckbox = within(exportModal).getByRole('checkbox', {
                name: /revenue/i,
            });

            await user.click(eventsCheckbox);
            await user.click(revenueCheckbox);

            // Step 3: Select export format
            const csvRadio = within(exportModal).getByRole('radio', {
                name: /csv/i,
            });
            await user.click(csvRadio);

            // Step 4: Set date range
            const startDateInput =
                within(exportModal).getByLabelText(/start date/i);
            const endDateInput =
                within(exportModal).getByLabelText(/end date/i);

            await user.clear(startDateInput);
            await user.type(startDateInput, '2024-01-01');
            await user.clear(endDateInput);
            await user.type(endDateInput, '2024-06-30');

            // Step 5: Start export
            const downloadButton = within(exportModal).getByRole('button', {
                name: /download/i,
            });
            await user.click(downloadButton);

            // Step 6: Verify export process
            await waitFor(() => {
                expect(
                    screen.getByText(/preparing export/i)
                ).toBeInTheDocument();
            });

            await waitFor(
                () => {
                    expect(mockClick).toHaveBeenCalled();
                },
                { timeout: 5000 }
            );

            // Verify success message
            expect(
                screen.getByText(/export completed successfully/i)
            ).toBeInTheDocument();

            // Cleanup
            jest.restoreAllMocks();
        });
    });

    describe('Error Handling and Recovery Journey', () => {
        it('should handle and recover from API failures', async () => {
            // Start with failing API
            server.use(
                rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
                    return res(
                        ctx.status(500),
                        ctx.json({ error: 'Server error' })
                    );
                })
            );

            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            // Step 1: Show error state
            await waitFor(() => {
                expect(
                    screen.getByText(/error loading dashboard/i)
                ).toBeInTheDocument();
            });

            // Step 2: User tries to retry
            const retryButton = screen.getByRole('button', { name: /retry/i });
            await user.click(retryButton);

            // Still fails
            await waitFor(() => {
                expect(
                    screen.getByText(/error loading dashboard/i)
                ).toBeInTheDocument();
            });

            // Step 3: Fix the API
            server.use(
                rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
                    return res(
                        ctx.json({ success: true, data: mockDashboardData })
                    );
                })
            );

            // Step 4: Retry again
            await user.click(retryButton);

            // Step 5: Should recover successfully
            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Verify all data is loaded
            expect(screen.getByText('15')).toBeInTheDocument(); // Total events
            expect(screen.getByText('$25,000')).toBeInTheDocument(); // Total revenue
        });

        it('should handle partial data loading gracefully', async () => {
            // Return partial data
            server.use(
                rest.get('/api/Organizer/dashboard', (req, res, ctx) => {
                    return res(
                        ctx.json({
                            success: true,
                            data: {
                                ...mockDashboardData,
                                statistics: null, // Missing statistics
                                revenue: null, // Missing revenue
                            },
                        })
                    );
                })
            );

            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Should show placeholders for missing data
            expect(
                screen.getByText(/statistics unavailable/i)
            ).toBeInTheDocument();
            expect(
                screen.getByText(/revenue data unavailable/i)
            ).toBeInTheDocument();

            // But events should still be shown
            expect(
                screen.getByText('Tech Conference 2024')
            ).toBeInTheDocument();

            // User can still interact with available features
            const viewEventsButton = screen.getByRole('button', {
                name: /view events/i,
            });
            await user.click(viewEventsButton);

            expect(mockPush).toHaveBeenCalledWith('/dashboard/events');
        });
    });

    describe('Mobile Responsive Journey', () => {
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

            // Trigger resize event
            fireEvent(window, new Event('resize'));
        });

        it('should provide mobile-optimized dashboard experience', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Step 1: Verify mobile layout
            const mobileLayout = screen.getByTestId('mobile-dashboard-layout');
            expect(mobileLayout).toBeInTheDocument();

            // Step 2: Test mobile navigation
            const menuButton = screen.getByRole('button', { name: /menu/i });
            await user.click(menuButton);

            const mobileMenu = screen.getByTestId('mobile-menu');
            expect(mobileMenu).toBeInTheDocument();

            // Step 3: Navigate to events on mobile
            const eventsMenuItem = within(mobileMenu).getByRole('button', {
                name: /events/i,
            });
            await user.click(eventsMenuItem);

            // Step 4: Test mobile table interactions
            await waitFor(() => {
                expect(
                    screen.getByTestId('mobile-event-cards')
                ).toBeInTheDocument();
            });

            // Should show cards instead of table on mobile
            expect(screen.queryByRole('table')).not.toBeInTheDocument();

            // Step 5: Test swipe gestures (simulate touch events)
            const firstCard = screen.getByTestId('event-card-event-1');

            fireEvent.touchStart(firstCard, {
                touches: [{ clientX: 100, clientY: 100 }],
            });
            fireEvent.touchMove(firstCard, {
                touches: [{ clientX: 200, clientY: 100 }],
            });
            fireEvent.touchEnd(firstCard);

            // Should reveal action buttons
            await waitFor(() => {
                expect(
                    screen.getByRole('button', { name: /edit/i })
                ).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility Journey', () => {
        it('should support complete keyboard navigation workflow', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Step 1: Navigate using Tab key
            await user.tab();
            expect(document.activeElement).toHaveAttribute('role', 'button');

            // Step 2: Navigate to table using keyboard
            const table = screen.getByRole('table');
            table.focus();

            // Step 3: Use arrow keys to navigate table
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowRight}');

            // Step 4: Activate action using Enter
            await user.keyboard('{Enter}');

            // Should open action menu or perform action
            await waitFor(() => {
                expect(screen.getByRole('menu')).toBeInTheDocument();
            });

            // Step 5: Navigate menu with arrow keys
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{Enter}');

            // Should perform the selected action
        });

        it('should provide screen reader announcements for dynamic content', async () => {
            render(
                <TestWrapper>
                    <Dashboard />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Test Organizer')).toBeInTheDocument();
            });

            // Verify aria-live regions are present
            const statusRegion = screen.getByRole('status');
            expect(statusRegion).toHaveAttribute('aria-live', 'polite');

            const alertRegion = screen.getByRole('alert');
            expect(alertRegion).toHaveAttribute('aria-live', 'assertive');

            // Trigger an action that should announce changes
            const refreshButton = screen.getByRole('button', {
                name: /refresh/i,
            });
            await user.click(refreshButton);

            // Should announce the refresh action
            await waitFor(() => {
                expect(statusRegion).toHaveTextContent(/dashboard refreshed/i);
            });
        });
    });
});

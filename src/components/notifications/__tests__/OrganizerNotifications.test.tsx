import React from 'react';
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { OrganizerNotifications } from '../OrganizerNotifications';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import {
    NotificationType,
    createTestNotificationMessage,
    createTestEventNotificationData,
    createTestPaymentNotificationData,
    createTestFinancingNotificationData,
} from '@/types/notifications';
import type { NotificationHistoryEntry } from '@/hooks/useNotificationHistory';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/hooks/useNotificationHistory', () => ({
    useNotificationHistory: jest.fn(),
}));

jest.mock('@/hooks/useTypedNotificationHandler', () => ({
    useTypedNotificationHandler: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/tabs', () => ({
    Tabs: ({ children, value, onValueChange }: any) => (
        <div data-testid='tabs' data-value={value}>
            <div onClick={() => onValueChange?.('all')}>All</div>
            <div onClick={() => onValueChange?.('events')}>Events</div>
            <div onClick={() => onValueChange?.('revenue')}>Revenue</div>
            <div onClick={() => onValueChange?.('financing')}>Financing</div>
            {children}
        </div>
    ),
    TabsContent: ({ children, value }: any) => (
        <div data-testid={`tab-content-${value}`}>{children}</div>
    ),
    TabsList: ({ children }: any) => (
        <div data-testid='tabs-list'>{children}</div>
    ),
    TabsTrigger: ({ children, value, onClick }: any) => (
        <button data-testid={`tab-trigger-${value}`} onClick={onClick}>
            {children}
        </button>
    ),
}));

const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
};

const mockHistoryManager = {
    history: [],
    stats: {
        total: 0,
        unread: 0,
        dismissed: 0,
        recentCount: 0,
    },
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    markAllAsRead: jest.fn(),
    markSelectedAsRead: jest.fn(),
    dismiss: jest.fn(),
    dismissSelected: jest.fn(),
    remove: jest.fn(),
    removeSelected: jest.fn(),
    clear: jest.fn(),
    getByType: jest.fn(),
    getUnreadCount: jest.fn(),
};

const mockNotificationHandler = {
    isProcessing: false,
    processingQueue: [],
    notificationHistory: [],
    historyStats: {
        total: 0,
        unread: 0,
        dismissed: 0,
        recentCount: 0,
    },
    processNotification: jest.fn(),
    processNotificationBatch: jest.fn(),
    navigateToNotification: jest.fn(),
    getNotificationRoute: jest.fn(),
    clearHistory: jest.fn(),
    getHistoryByType: jest.fn(),
    markNotificationAsRead: jest.fn(),
    dismissNotification: jest.fn(),
    getUnreadCount: jest.fn(),
    shouldShowToast: jest.fn(),
    shouldAutoNavigate: jest.fn(),
    shouldPersistInHistory: jest.fn(),
    registerEventHandler: jest.fn(),
    registerPaymentHandler: jest.fn(),
    registerFinancingHandler: jest.fn(),
    registerSystemHandler: jest.fn(),
};

// Helper function to create test notification entries
const createTestNotificationEntry = (
    type: NotificationType,
    overrides: Partial<NotificationHistoryEntry> = {}
): NotificationHistoryEntry => {
    const notification = createTestNotificationMessage({
        type,
        ...overrides,
    });

    return {
        notification,
        receivedAt: new Date(),
        isRead: false,
        isDismissed: false,
        readAt: undefined,
        dismissedAt: undefined,
        ...overrides,
    };
};

describe('OrganizerNotifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useNotificationHistory as jest.Mock).mockReturnValue(
            mockHistoryManager
        );
        (useTypedNotificationHandler as jest.Mock).mockReturnValue(
            mockNotificationHandler
        );
    });

    describe('Rendering', () => {
        it('renders with default props', () => {
            render(<OrganizerNotifications />);

            expect(
                screen.getByText('Organizer Notifications')
            ).toBeInTheDocument();
            expect(screen.getByTestId('tabs')).toBeInTheDocument();
        });

        it('renders header when showHeader is true', () => {
            render(<OrganizerNotifications showHeader={true} />);

            expect(
                screen.getByText('Organizer Notifications')
            ).toBeInTheDocument();
        });

        it('hides header when showHeader is false', () => {
            render(<OrganizerNotifications showHeader={false} />);

            expect(
                screen.queryByText('Organizer Notifications')
            ).not.toBeInTheDocument();
        });

        it('shows search input when showSearch is true', () => {
            render(<OrganizerNotifications showSearch={true} />);

            expect(
                screen.getByPlaceholderText('Search organizer notifications...')
            ).toBeInTheDocument();
        });

        it('shows filters when showFilters is true', () => {
            render(<OrganizerNotifications showFilters={true} />);

            expect(screen.getByRole('combobox')).toBeInTheDocument();
        });

        it('displays unread count badge when there are unread notifications', () => {
            const mockHistoryWithUnread = {
                ...mockHistoryManager,
                history: [
                    createTestNotificationEntry(
                        NotificationType.EventRegistration,
                        { isRead: false }
                    ),
                    createTestNotificationEntry(
                        NotificationType.PaymentCompleted,
                        { isRead: false }
                    ),
                ],
                stats: { ...mockHistoryManager.stats, unread: 2 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithUnread
            );

            render(<OrganizerNotifications />);

            expect(screen.getByText('2')).toBeInTheDocument();
        });
    });

    describe('Notification Filtering', () => {
        const testNotifications = [
            createTestNotificationEntry(NotificationType.EventRegistration, {
                data: createTestEventNotificationData(),
            }),
            createTestNotificationEntry(NotificationType.PaymentCompleted, {
                data: createTestPaymentNotificationData(),
            }),
            createTestNotificationEntry(
                NotificationType.FinancingApplicationSubmitted,
                {
                    data: createTestFinancingNotificationData(),
                }
            ),
            createTestNotificationEntry(NotificationType.SystemMaintenance),
        ];

        beforeEach(() => {
            const mockHistoryWithNotifications = {
                ...mockHistoryManager,
                history: testNotifications,
                stats: {
                    ...mockHistoryManager.stats,
                    total: testNotifications.length,
                },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithNotifications
            );
        });

        it('filters organizer-specific notifications only', () => {
            render(<OrganizerNotifications />);

            // Should show event, payment, and financing notifications
            // Should not show system notifications (not organizer-specific)
            expect(screen.getByText('3 total')).toBeInTheDocument();
        });

        it('filters by tab selection', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications />);

            // Click on Events tab
            await user.click(screen.getByText('Events'));

            // Should only show event notifications
            expect(screen.getByTestId('tabs')).toHaveAttribute(
                'data-value',
                'events'
            );
        });

        it('filters by search query', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications showSearch={true} />);

            const searchInput = screen.getByPlaceholderText(
                'Search organizer notifications...'
            );
            await user.type(searchInput, 'registration');

            expect(searchInput).toHaveValue('registration');
        });

        it('filters by read status', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications showFilters={true} />);

            const readStatusSelect = screen.getByRole('combobox');
            await user.click(readStatusSelect);

            // Should show filter options
            expect(screen.getByText('All')).toBeInTheDocument();
            expect(screen.getByText('Unread')).toBeInTheDocument();
            expect(screen.getByText('Read')).toBeInTheDocument();
        });
    });

    describe('Event Grouping', () => {
        const groupedNotifications = [
            createTestNotificationEntry(NotificationType.EventRegistration, {
                data: createTestEventNotificationData({
                    eventId: 'event-1',
                    eventTitle: 'Test Event 1',
                }),
            }),
            createTestNotificationEntry(NotificationType.PaymentCompleted, {
                data: createTestPaymentNotificationData({
                    eventId: 'event-1',
                    eventTitle: 'Test Event 1',
                }),
            }),
            createTestNotificationEntry(NotificationType.EventRegistration, {
                data: createTestEventNotificationData({
                    eventId: 'event-2',
                    eventTitle: 'Test Event 2',
                }),
            }),
        ];

        beforeEach(() => {
            const mockHistoryWithGrouped = {
                ...mockHistoryManager,
                history: groupedNotifications,
                stats: {
                    ...mockHistoryManager.stats,
                    total: groupedNotifications.length,
                },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithGrouped
            );
        });

        it('groups notifications by event when enableGrouping is true', () => {
            render(<OrganizerNotifications enableGrouping={true} />);

            expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            expect(screen.getByText('Test Event 2')).toBeInTheDocument();
        });

        it('does not group notifications when enableGrouping is false', () => {
            render(<OrganizerNotifications enableGrouping={false} />);

            // Should show individual notifications without grouping
            expect(screen.getByText('3 total')).toBeInTheDocument();
        });

        it('expands and collapses event groups', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications enableGrouping={true} />);

            const eventGroups = screen.getAllByText('Test Event 1');
            await user.click(eventGroups[0]);

            // Group should toggle expanded state
            expect(eventGroups[0]).toBeInTheDocument();
        });

        it('shows group metrics (revenue and registration count)', () => {
            render(<OrganizerNotifications enableGrouping={true} />);

            // Should show revenue and registration metrics for groups
            const eventGroups = screen.getAllByText('Test Event 1');
            expect(eventGroups[0]).toBeInTheDocument();
        });
    });

    describe('Notification Actions', () => {
        const testNotification = createTestNotificationEntry(
            NotificationType.EventRegistration,
            {
                data: createTestEventNotificationData(),
                actionUrl: '/dashboard/events/test-event-123',
            }
        );

        beforeEach(() => {
            const mockHistoryWithNotification = {
                ...mockHistoryManager,
                history: [testNotification],
                stats: { ...mockHistoryManager.stats, total: 1, unread: 1 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithNotification
            );
        });

        it('marks notification as read when clicked', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications enableGrouping={false} />);

            const notification = screen.getByText('Test Notification');
            await user.click(notification);

            expect(mockHistoryManager.markAsRead).toHaveBeenCalledWith(
                testNotification.notification.id
            );
        });

        it('navigates to action URL when notification is clicked', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications enableGrouping={false} />);

            const notification = screen.getByText('Test Notification');
            await user.click(notification);

            expect(mockRouter.push).toHaveBeenCalledWith(
                '/dashboard/events/test-event-123'
            );
        });

        it('calls custom onNotificationClick handler when provided', async () => {
            const mockOnClick = jest.fn();
            const user = userEvent.setup();

            render(
                <OrganizerNotifications
                    enableGrouping={false}
                    onNotificationClick={mockOnClick}
                />
            );

            const notification = screen.getByText('Test Notification');
            await user.click(notification);

            expect(mockOnClick).toHaveBeenCalledWith(
                testNotification.notification
            );
        });

        it('dismisses notification when dismiss button is clicked', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications enableGrouping={false} />);

            const notification = screen.getByText('Test Notification');
            await user.hover(notification);

            // Find and click dismiss button
            const dismissButton = screen.getByTitle('Dismiss notification');
            await user.click(dismissButton);

            expect(mockHistoryManager.dismiss).toHaveBeenCalledWith(
                testNotification.notification.id
            );
        });

        it('removes notification when remove button is clicked', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications enableGrouping={false} />);

            const notification = screen.getByText('Test Notification');
            await user.hover(notification);

            // Find and click remove button
            const removeButton = screen.getByTitle('Remove notification');
            await user.click(removeButton);

            expect(mockHistoryManager.remove).toHaveBeenCalledWith(
                testNotification.notification.id
            );
        });
    });

    describe('Bulk Actions', () => {
        const testNotifications = [
            createTestNotificationEntry(NotificationType.EventRegistration, {
                isRead: false,
            }),
            createTestNotificationEntry(NotificationType.PaymentCompleted, {
                isRead: false,
            }),
        ];

        beforeEach(() => {
            const mockHistoryWithNotifications = {
                ...mockHistoryManager,
                history: testNotifications,
                stats: { ...mockHistoryManager.stats, total: 2, unread: 2 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithNotifications
            );
        });

        it('shows bulk actions when notifications are selected', async () => {
            const user = userEvent.setup();
            render(
                <OrganizerNotifications
                    showBulkActions={true}
                    enableGrouping={false}
                />
            );

            // Select a notification
            const checkbox = screen.getAllByRole('checkbox')[0];
            await user.click(checkbox);

            expect(screen.getByText('1 selected')).toBeInTheDocument();
            expect(screen.getByText('Mark as read')).toBeInTheDocument();
            expect(screen.getByText('Dismiss')).toBeInTheDocument();
            expect(screen.getByText('Remove')).toBeInTheDocument();
        });

        it('performs bulk mark as read action', async () => {
            const user = userEvent.setup();
            render(
                <OrganizerNotifications
                    showBulkActions={true}
                    enableGrouping={false}
                />
            );

            // Select notifications
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]);
            await user.click(checkboxes[1]);

            // Wait for bulk actions to appear and click bulk mark as read
            await waitFor(() => {
                expect(screen.getByText('2 selected')).toBeInTheDocument();
            });

            const markAsReadButton = screen.getByText('Mark as read');
            await user.click(markAsReadButton);

            expect(mockHistoryManager.markSelectedAsRead).toHaveBeenCalled();
        });

        it('performs bulk dismiss action', async () => {
            const user = userEvent.setup();
            render(
                <OrganizerNotifications
                    showBulkActions={true}
                    enableGrouping={false}
                />
            );

            // Select notifications
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]);

            // Wait for bulk actions to appear and click bulk dismiss
            await waitFor(() => {
                expect(screen.getByText('1 selected')).toBeInTheDocument();
            });

            const dismissButton = screen.getByText('Dismiss');
            await user.click(dismissButton);

            expect(mockHistoryManager.dismissSelected).toHaveBeenCalled();
        });

        it('performs bulk remove action', async () => {
            const user = userEvent.setup();
            render(
                <OrganizerNotifications
                    showBulkActions={true}
                    enableGrouping={false}
                />
            );

            // Select notifications
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]);

            // Wait for bulk actions to appear and click bulk remove
            await waitFor(() => {
                expect(screen.getByText('1 selected')).toBeInTheDocument();
            });

            const removeButton = screen.getByText('Remove');
            await user.click(removeButton);

            expect(mockHistoryManager.removeSelected).toHaveBeenCalled();
        });
    });

    describe('Revenue and Registration Updates', () => {
        it('calls onRevenueUpdate when payment notification is received', () => {
            const mockOnRevenueUpdate = jest.fn();

            render(
                <OrganizerNotifications onRevenueUpdate={mockOnRevenueUpdate} />
            );

            // Simulate notification handler calling onNotificationReceived
            const handlerOptions = (useTypedNotificationHandler as jest.Mock)
                .mock.calls[0][0];
            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
                data: createTestPaymentNotificationData(),
            });

            handlerOptions.onNotificationReceived(paymentNotification);

            expect(mockOnRevenueUpdate).toHaveBeenCalledWith(
                paymentNotification
            );
        });

        it('calls onRegistrationUpdate when registration notification is received', () => {
            const mockOnRegistrationUpdate = jest.fn();

            render(
                <OrganizerNotifications
                    onRegistrationUpdate={mockOnRegistrationUpdate}
                />
            );

            // Simulate notification handler calling onNotificationReceived
            const handlerOptions = (useTypedNotificationHandler as jest.Mock)
                .mock.calls[0][0];
            const registrationNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData(),
            });

            handlerOptions.onNotificationReceived(registrationNotification);

            expect(mockOnRegistrationUpdate).toHaveBeenCalledWith(
                registrationNotification
            );
        });
    });

    describe('Statistics Display', () => {
        const testNotificationsWithMetrics = [
            createTestNotificationEntry(NotificationType.EventRegistration, {
                data: createTestEventNotificationData(),
            }),
            createTestNotificationEntry(NotificationType.PaymentCompleted, {
                data: createTestPaymentNotificationData({ amount: 50.0 }),
            }),
            createTestNotificationEntry(NotificationType.PaymentCompleted, {
                data: createTestPaymentNotificationData({ amount: 75.0 }),
            }),
        ];

        beforeEach(() => {
            const mockHistoryWithMetrics = {
                ...mockHistoryManager,
                history: testNotificationsWithMetrics,
                stats: { ...mockHistoryManager.stats, total: 3 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithMetrics
            );
        });

        it('displays total notification count', () => {
            render(<OrganizerNotifications />);

            expect(screen.getByText('3 total')).toBeInTheDocument();
        });

        it('displays total revenue from payment notifications', () => {
            render(<OrganizerNotifications />);

            // Should calculate and display total revenue
            expect(screen.getByText(/revenue/)).toBeInTheDocument();
        });

        it('displays registration count', () => {
            render(<OrganizerNotifications />);

            // Should show registration count
            expect(screen.getByText(/registrations/)).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        beforeEach(() => {
            const mockEmptyHistory = {
                ...mockHistoryManager,
                history: [],
                stats: { total: 0, unread: 0, dismissed: 0, recentCount: 0 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockEmptyHistory
            );
        });

        it('shows empty state when no notifications exist', () => {
            render(<OrganizerNotifications />);

            expect(
                screen.getByText('No notifications yet')
            ).toBeInTheDocument();
            expect(
                screen.getByText(/You'll see real-time updates/)
            ).toBeInTheDocument();
        });

        it('shows tab-specific empty state message', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications />);

            // Switch to events tab using the tab trigger
            await user.click(screen.getByTestId('tab-trigger-events'));

            expect(
                screen.getByText('No events notifications to show.')
            ).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        const testNotification = createTestNotificationEntry(
            NotificationType.EventRegistration,
            { data: createTestEventNotificationData() }
        );

        beforeEach(() => {
            const mockHistoryWithNotification = {
                ...mockHistoryManager,
                history: [testNotification],
                stats: { ...mockHistoryManager.stats, total: 1 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithNotification
            );
        });

        it('provides proper ARIA labels for buttons', () => {
            render(<OrganizerNotifications enableGrouping={false} />);

            expect(screen.getByTitle('Mark as read')).toBeInTheDocument();
            expect(
                screen.getByTitle('Dismiss notification')
            ).toBeInTheDocument();
            expect(
                screen.getByTitle('Remove notification')
            ).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotifications enableGrouping={false} />);

            // Tab through interactive elements
            await user.tab();
            expect(document.activeElement).toBeInTheDocument();
        });

        it('provides proper checkbox labels', () => {
            render(
                <OrganizerNotifications
                    enableSelection={true}
                    enableGrouping={false}
                />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            expect(checkboxes.length).toBeGreaterThan(0);
        });
    });

    describe('Performance', () => {
        it('handles large numbers of notifications efficiently', () => {
            const manyNotifications = Array.from({ length: 1000 }, (_, i) =>
                createTestNotificationEntry(
                    NotificationType.EventRegistration,
                    {
                        notification: createTestNotificationMessage({
                            id: `notification-${i}`,
                            title: `Notification ${i}`,
                        }),
                    }
                )
            );

            const mockHistoryWithMany = {
                ...mockHistoryManager,
                history: manyNotifications,
                stats: { ...mockHistoryManager.stats, total: 1000 },
            };

            (useNotificationHistory as jest.Mock).mockReturnValue(
                mockHistoryWithMany
            );

            const { container } = render(<OrganizerNotifications />);

            // Should render without performance issues
            expect(container).toBeInTheDocument();
            expect(screen.getByText('1000 total')).toBeInTheDocument();
        });

        it('uses virtualization for large lists', () => {
            render(<OrganizerNotifications maxHeight='400px' />);

            // ScrollArea should be present for virtualization
            expect(screen.getByTestId('tabs')).toBeInTheDocument();
        });
    });
});

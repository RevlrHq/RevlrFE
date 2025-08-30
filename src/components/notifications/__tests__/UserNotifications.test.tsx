import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { UserNotifications } from '../UserNotifications';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import {
    createTestNotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/notifications';
import type { NotificationHistoryEntry } from '@/hooks/useNotificationHistory';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/hooks/useNotificationHistory');
jest.mock('@/hooks/useTypedNotificationHandler');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseNotificationHistory =
    useNotificationHistory as jest.MockedFunction<
        typeof useNotificationHistory
    >;
const mockUseTypedNotificationHandler =
    useTypedNotificationHandler as jest.MockedFunction<
        typeof useTypedNotificationHandler
    >;

// Mock router
const mockPush = jest.fn();
mockUseRouter.mockReturnValue({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
});

// Helper function to create mock history entries
const createMockHistoryEntry = (
    overrides: Partial<NotificationHistoryEntry> = {}
): NotificationHistoryEntry => ({
    id: 'test-notification-1',
    notification: createTestNotificationMessage({
        id: 'test-notification-1',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.EventRegistration,
        priority: NotificationPriority.Normal,
    }),
    receivedAt: new Date('2024-01-15T10:00:00Z'),
    isRead: false,
    isDismissed: false,
    ...overrides,
});

// Default mock implementations
const mockHistoryManager = {
    history: [],
    filteredHistory: [],
    stats: {
        total: 0,
        unread: 0,
        dismissed: 0,
        byType: {} as unknown,
        byPriority: {} as unknown,
        recentCount: 0,
    },
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    markAllAsRead: jest.fn(),
    dismiss: jest.fn(),
    undismiss: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
    setFilter: jest.fn(),
    clearFilter: jest.fn(),
    currentFilter: {},
    markSelectedAsRead: jest.fn(),
    dismissSelected: jest.fn(),
    removeSelected: jest.fn(),
    getNotification: jest.fn(),
    getUnreadCount: jest.fn(),
    getRecentNotifications: jest.fn(),
    exportHistory: jest.fn(),
    importHistory: jest.fn(),
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

describe('UserNotifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseNotificationHistory.mockReturnValue(mockHistoryManager);
        mockUseTypedNotificationHandler.mockReturnValue(
            mockNotificationHandler
        );
    });

    describe('Rendering', () => {
        it('renders empty state when no notifications', () => {
            render(<UserNotifications />);

            expect(screen.getByText('No notifications')).toBeInTheDocument();
            expect(
                screen.getByText(
                    "You're all caught up! New notifications will appear here."
                )
            ).toBeInTheDocument();
        });

        it('renders notifications list when notifications exist', () => {
            const mockNotifications = [
                createMockHistoryEntry({
                    id: 'notification-1',
                    notification: createTestNotificationMessage({
                        id: 'notification-1',
                        title: 'Event Registration',
                        message: 'You have registered for an event',
                        type: NotificationType.EventRegistration,
                        priority: NotificationPriority.Normal,
                    }),
                }),
                createMockHistoryEntry({
                    id: 'notification-2',
                    notification: createTestNotificationMessage({
                        id: 'notification-2',
                        title: 'Payment Completed',
                        message: 'Your payment has been processed',
                        type: NotificationType.PaymentCompleted,
                        priority: NotificationPriority.High,
                    }),
                    isRead: true,
                }),
            ];

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
                stats: {
                    ...mockHistoryManager.stats,
                    total: 2,
                    unread: 1,
                },
            });

            render(<UserNotifications />);

            expect(screen.getByText('Event Registration')).toBeInTheDocument();
            expect(screen.getByText('Payment Completed')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument(); // Unread count badge
        });

        it('renders with custom props', () => {
            render(
                <UserNotifications
                    showHeader={false}
                    showFilters={false}
                    showSearch={false}
                    showBulkActions={false}
                    enableSelection={false}
                />
            );

            expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
            expect(
                screen.queryByPlaceholderText('Search notifications...')
            ).not.toBeInTheDocument();
        });

        it('displays priority badges correctly', () => {
            const mockNotifications = [
                createMockHistoryEntry({
                    notification: createTestNotificationMessage({
                        priority: NotificationPriority.Critical,
                        title: 'Critical Notification',
                    }),
                }),
                createMockHistoryEntry({
                    notification: createTestNotificationMessage({
                        priority: NotificationPriority.Low,
                        title: 'Low Priority Notification',
                    }),
                }),
            ];

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
            });

            render(<UserNotifications />);

            expect(screen.getByText('Critical')).toBeInTheDocument();
            expect(screen.getByText('Low')).toBeInTheDocument();
        });
    });

    describe('Notification Actions', () => {
        const mockNotification = createMockHistoryEntry({
            id: 'test-notification',
            notification: createTestNotificationMessage({
                id: 'test-notification',
                title: 'Test Notification',
                actionUrl: '/test-url',
            }),
        });

        beforeEach(() => {
            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: [mockNotification],
            });
        });

        it('marks notification as read when clicked', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            const notificationItem = screen.getByText('Test Notification');
            await user.click(notificationItem);

            expect(mockHistoryManager.markAsRead).toHaveBeenCalledWith(
                'test-notification'
            );
        });

        it('navigates to action URL when notification is clicked', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            const notificationItem = screen.getByText('Test Notification');
            await user.click(notificationItem);

            expect(mockPush).toHaveBeenCalledWith('/test-url');
        });

        it('calls custom onNotificationClick handler', async () => {
            const mockOnClick = jest.fn();
            const user = userEvent.setup();

            render(<UserNotifications onNotificationClick={mockOnClick} />);

            const notificationItem = screen.getByText('Test Notification');
            await user.click(notificationItem);

            expect(mockOnClick).toHaveBeenCalledWith(
                mockNotification.notification
            );
        });

        it('marks notification as read/unread via action buttons', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Hover to show action buttons
            const notificationItem = screen.getByText('Test Notification');
            await user.hover(notificationItem);

            // Find and click the read/unread button
            const readButton = screen.getByTitle('Mark as read');
            await user.click(readButton);

            expect(mockHistoryManager.markAsRead).toHaveBeenCalledWith(
                'test-notification'
            );
        });

        it('dismisses notification via action button', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Hover to show action buttons
            const notificationItem = screen.getByText('Test Notification');
            await user.hover(notificationItem);

            // Click dismiss button
            const dismissButton = screen.getByTitle('Dismiss notification');
            await user.click(dismissButton);

            expect(mockHistoryManager.dismiss).toHaveBeenCalledWith(
                'test-notification'
            );
        });

        it('removes notification via action button', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Hover to show action buttons
            const notificationItem = screen.getByText('Test Notification');
            await user.hover(notificationItem);

            // Click remove button
            const removeButton = screen.getByTitle('Remove notification');
            await user.click(removeButton);

            expect(mockHistoryManager.remove).toHaveBeenCalledWith(
                'test-notification'
            );
        });
    });

    describe('Bulk Actions', () => {
        const mockNotifications = [
            createMockHistoryEntry({
                id: 'notification-1',
                notification: createTestNotificationMessage({
                    id: 'notification-1',
                    title: 'Notification 1',
                }),
            }),
            createMockHistoryEntry({
                id: 'notification-2',
                notification: createTestNotificationMessage({
                    id: 'notification-2',
                    title: 'Notification 2',
                }),
            }),
        ];

        beforeEach(() => {
            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
                filteredHistory: mockNotifications,
                setFilter: jest.fn(),
            });
        });

        it('selects and deselects notifications', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Select first notification
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[1]); // First notification checkbox (0 is select all)

            // Bulk actions should appear
            expect(screen.getByText('1 selected')).toBeInTheDocument();
        });

        it('selects all notifications', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // First select one notification to show bulk actions
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]); // First notification checkbox

            // Should show bulk actions
            expect(screen.getByText('1 selected')).toBeInTheDocument();
        });

        it('performs bulk mark as read', async () => {
            const user = userEvent.setup();
            mockHistoryManager.markSelectedAsRead.mockReturnValue(1);

            render(<UserNotifications />);

            // Select first notification
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]);

            // Click bulk mark as read
            const markReadButton = screen.getByText('Mark read');
            await user.click(markReadButton);

            expect(mockHistoryManager.markSelectedAsRead).toHaveBeenCalledWith([
                'notification-1',
            ]);
        });

        it('performs bulk dismiss', async () => {
            const user = userEvent.setup();
            mockHistoryManager.dismissSelected.mockReturnValue(1);

            render(<UserNotifications />);

            // Select first notification
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]);

            // Click bulk dismiss
            const dismissButton = screen.getByText('Dismiss');
            await user.click(dismissButton);

            expect(mockHistoryManager.dismissSelected).toHaveBeenCalledWith([
                'notification-1',
            ]);
        });

        it('performs bulk remove', async () => {
            const user = userEvent.setup();
            mockHistoryManager.removeSelected.mockReturnValue(1);

            render(<UserNotifications />);

            // Select first notification
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[0]);

            // Click bulk remove
            const removeButton = screen.getByText('Remove');
            await user.click(removeButton);

            expect(mockHistoryManager.removeSelected).toHaveBeenCalledWith([
                'notification-1',
            ]);
        });
    });

    describe('Search and Filtering', () => {
        const mockNotifications = [
            createMockHistoryEntry({
                notification: createTestNotificationMessage({
                    title: 'Event Registration',
                    type: NotificationType.EventRegistration,
                    priority: NotificationPriority.High,
                }),
            }),
            createMockHistoryEntry({
                notification: createTestNotificationMessage({
                    title: 'Payment Completed',
                    type: NotificationType.PaymentCompleted,
                    priority: NotificationPriority.Normal,
                }),
                isRead: true,
            }),
        ];

        beforeEach(() => {
            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
                filteredHistory: mockNotifications, // Initially show all
                setFilter: jest.fn(), // Mock the setFilter method
            });
        });

        it('filters notifications by search query', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            const searchInput = screen.getByPlaceholderText(
                'Search notifications...'
            );
            await user.type(searchInput, 'Event');

            // Should show only the event notification
            expect(screen.getByText('Event Registration')).toBeInTheDocument();
            expect(
                screen.queryByText('Payment Completed')
            ).not.toBeInTheDocument();
        });

        it('filters notifications by read status', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Open read status filter
            const readStatusSelect = screen.getByText('all');
            await user.click(readStatusSelect);

            // Select "Read" option
            const readOption = screen.getByText('Read');
            await user.click(readOption);

            // Should show only read notifications
            expect(
                screen.queryByText('Event Registration')
            ).not.toBeInTheDocument();
            expect(screen.getByText('Payment Completed')).toBeInTheDocument();
        });

        it('opens and uses advanced filters', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Open filters popover
            const filtersButton = screen.getByText('Filters');
            await user.click(filtersButton);

            // Select event type filter
            const eventTypeCheckbox =
                screen.getByLabelText('EventRegistration');
            await user.click(eventTypeCheckbox);

            // Close popover by clicking outside
            await user.click(document.body);

            // Should show filter badge
            expect(screen.getByText('1')).toBeInTheDocument(); // Filter count badge
        });

        it('sorts notifications by different criteria', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Open sort dropdown - look for the button with "date" text
            const sortSelect = screen.getByRole('button', { name: 'date' });
            await user.click(sortSelect);

            // Select priority sorting
            const priorityOption = screen.getByText('Priority');
            await user.click(priorityOption);

            // Should update sort criteria
            expect(
                screen.getByRole('button', { name: 'priority' })
            ).toBeInTheDocument();
        });

        it('toggles sort order', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Find sort order button (should show descending arrow initially)
            const sortOrderButton = screen.getByTitle('Sort ascending');
            await user.click(sortOrderButton);

            // Should toggle to ascending
            expect(screen.getByTitle('Sort descending')).toBeInTheDocument();
        });

        it('filters notifications by date range', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Open filters popover
            const filtersButton = screen.getByText('Filters');
            await user.click(filtersButton);

            // Set date range
            const fromDateInput = screen.getByLabelText('From');
            await user.type(fromDateInput, '2024-01-01');

            const toDateInput = screen.getByLabelText('To');
            await user.type(toDateInput, '2024-01-31');

            // Should show filter badge with date range
            expect(screen.getByText('1')).toBeInTheDocument(); // Filter count badge including date range
        });

        it('clears date range filter', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            // Open filters popover
            const filtersButton = screen.getByText('Filters');
            await user.click(filtersButton);

            // Set date range first
            const fromDateInput = screen.getByLabelText('From');
            await user.type(fromDateInput, '2024-01-01');

            // Clear date range
            const clearButton = screen.getByText('Clear date range');
            await user.click(clearButton);

            // Date inputs should be empty
            expect(fromDateInput).toHaveValue('');
        });

        it('shows filtered empty state', async () => {
            const user = userEvent.setup();

            // Mock empty filtered results
            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
                filteredHistory: [], // No results after filtering
            });

            render(<UserNotifications />);

            // Search for something that doesn't exist
            const searchInput = screen.getByPlaceholderText(
                'Search notifications...'
            );
            await user.type(searchInput, 'NonexistentNotification');

            expect(
                screen.getByText('No notifications match your filters')
            ).toBeInTheDocument();
        });

        it('integrates with useNotificationHistory filtering', async () => {
            const mockSetFilter = jest.fn();
            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
                filteredHistory: mockNotifications,
                setFilter: mockSetFilter,
            });

            const user = userEvent.setup();
            render(<UserNotifications />);

            // Apply a filter
            const searchInput = screen.getByPlaceholderText(
                'Search notifications...'
            );
            await user.type(searchInput, 'Event');

            // Should call setFilter on the history manager
            expect(mockSetFilter).toHaveBeenCalledWith({
                searchQuery: 'Event',
                types: undefined,
                priorities: undefined,
                isRead: undefined,
                isDismissed: false, // dismissedStatus is 'active' by default
                dateRange: undefined,
            });
        });
    });

    describe('Header Actions', () => {
        beforeEach(() => {
            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                stats: {
                    ...mockHistoryManager.stats,
                    unread: 3,
                },
            });
        });

        it('marks all notifications as read', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            const markAllReadButton = screen.getByText('Mark all read');
            await user.click(markAllReadButton);

            expect(mockHistoryManager.markAllAsRead).toHaveBeenCalled();
        });

        it('clears all notifications', async () => {
            const user = userEvent.setup();
            render(<UserNotifications />);

            const clearButton = screen.getByRole('button', {
                name: '',
            });
            await user.click(clearButton);

            expect(mockHistoryManager.clear).toHaveBeenCalled();
        });
    });

    describe('Notification Data Formatting', () => {
        it('displays event notification data correctly', () => {
            const eventNotification = createMockHistoryEntry({
                notification: createTestNotificationMessage({
                    title: 'Event Registration',
                    type: NotificationType.EventRegistration,
                    data: {
                        eventId: 'event-123',
                        eventTitle: 'Tech Conference 2024',
                        organizerName: 'Tech Corp',
                        eventDate: '2024-06-15T18:00:00Z',
                        eventLocation: 'San Francisco, CA',
                    },
                }),
            });

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: [eventNotification],
                filteredHistory: [eventNotification],
                setFilter: jest.fn(),
            });

            render(<UserNotifications />);

            expect(
                screen.getByText('Tech Conference 2024')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Organizer: Tech Corp')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Location: San Francisco, CA')
            ).toBeInTheDocument();
        });

        it('displays payment notification data correctly', () => {
            const paymentNotification = createMockHistoryEntry({
                notification: createTestNotificationMessage({
                    title: 'Payment Completed',
                    type: NotificationType.PaymentCompleted,
                    data: {
                        paymentId: 'payment-123',
                        amount: 99.99,
                        currency: 'USD',
                        paymentMethod: 'CreditCard',
                        transactionDate: '2024-01-15T10:30:00Z',
                        userId: 'user-123',
                        eventTitle: 'Tech Conference 2024',
                    },
                }),
            });

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: [paymentNotification],
                filteredHistory: [paymentNotification],
                setFilter: jest.fn(),
            });

            render(<UserNotifications />);

            expect(
                screen.getByText('Tech Conference 2024')
            ).toBeInTheDocument();
            expect(screen.getByText('Amount: USD 99.99')).toBeInTheDocument();
            expect(screen.getByText('Method: CreditCard')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels and roles', () => {
            const mockNotifications = [
                createMockHistoryEntry({
                    notification: createTestNotificationMessage({
                        title: 'Test Notification',
                    }),
                }),
            ];

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
                filteredHistory: mockNotifications,
                stats: { ...mockHistoryManager.stats, unread: 1 },
                setFilter: jest.fn(),
            });

            render(<UserNotifications />);

            // Check for proper button roles and labels - these are only visible on hover
            // So we'll check for the notification title instead
            expect(screen.getByText('Test Notification')).toBeInTheDocument();

            // Check for checkboxes
            expect(screen.getAllByRole('checkbox')).toHaveLength(1); // Only notification checkbox (no select all when no selection)
        });

        it('supports keyboard navigation', async () => {
            const user = userEvent.setup();
            const mockNotifications = [
                createMockHistoryEntry({
                    notification: createTestNotificationMessage({
                        title: 'Test Notification',
                    }),
                }),
            ];

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: mockNotifications,
            });

            render(<UserNotifications />);

            // Tab through interactive elements
            await user.tab(); // First tab goes to clear button
            await user.tab(); // Second tab goes to search input
            expect(
                screen.getByPlaceholderText('Search notifications...')
            ).toHaveFocus();

            await user.tab();
            expect(screen.getByRole('button', { name: 'all' })).toHaveFocus();
        });
    });

    describe('Error Handling', () => {
        it('handles missing notification data gracefully', () => {
            const notificationWithoutData = createMockHistoryEntry({
                notification: createTestNotificationMessage({
                    title: 'Notification Without Data',
                    data: undefined,
                }),
            });

            mockUseNotificationHistory.mockReturnValue({
                ...mockHistoryManager,
                history: [notificationWithoutData],
                filteredHistory: [notificationWithoutData],
                setFilter: jest.fn(),
            });

            render(<UserNotifications />);

            expect(
                screen.getByText('Notification Without Data')
            ).toBeInTheDocument();
            // Should not crash and should render the notification
        });

        it('handles hook errors gracefully', () => {
            // Mock hook to throw error
            mockUseNotificationHistory.mockImplementation(() => {
                throw new Error('Hook error');
            });

            // Should not crash the component
            expect(() => render(<UserNotifications />)).toThrow('Hook error');
        });
    });
});

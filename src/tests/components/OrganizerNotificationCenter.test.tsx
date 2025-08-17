import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrganizerNotificationCenter } from '@/components/OrganizerNotificationCenter';
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';
import type { OrganizerNotification } from '@/hooks/useOrganizerRealtime';

// Mock the hook
jest.mock('@/hooks/useOrganizerRealtime');

const mockUseOrganizerRealtime = useOrganizerRealtime as jest.MockedFunction<
    typeof useOrganizerRealtime
>;

// Mock window.location
const mockLocation = {
    href: '',
};
Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
});

describe('OrganizerNotificationCenter', () => {
    const mockNotifications: OrganizerNotification[] = [
        {
            id: '1',
            type: 'registration',
            priority: 'medium',
            title: 'New Registration',
            message: 'John Doe registered for Test Event',
            timestamp: new Date().toISOString(),
            eventId: 'event-1',
            actionUrl: '/dashboard/event/event-1',
            read: false,
        },
        {
            id: '2',
            type: 'event_status',
            priority: 'high',
            title: 'Event Published',
            message: 'Test Event 2 has been published',
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            eventId: 'event-2',
            read: true,
        },
        {
            id: '3',
            type: 'revenue',
            priority: 'critical',
            title: 'High Revenue Alert',
            message: 'Revenue exceeded $1000 for Test Event 3',
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            eventId: 'event-3',
            read: false,
        },
    ];

    const defaultMockReturn = {
        isConnected: true,
        connectionError: null,
        notifications: mockNotifications,
        unreadCount: 2,
        markNotificationAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        dismissNotification: jest.fn(),
        clearAllNotifications: jest.fn(),
        reconnect: jest.fn(),
        dashboardUpdates: null,
        eventStatusUpdates: [],
        registrationUpdates: [],
        revenueUpdates: [],
        onDashboardUpdate: jest.fn(),
        onEventStatusUpdate: jest.fn(),
        onRegistrationUpdate: jest.fn(),
        onRevenueUpdate: jest.fn(),
    };

    beforeEach(() => {
        mockUseOrganizerRealtime.mockReturnValue(defaultMockReturn);
        mockLocation.href = '';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render notification bell with unread count', () => {
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications \(2 unread\)/i,
            });
            expect(bellButton).toBeInTheDocument();

            const badge = screen.getByText('2');
            expect(badge).toBeInTheDocument();
        });

        it('should not show badge when no unread notifications', () => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                unreadCount: 0,
                notifications: mockNotifications.map((n) => ({
                    ...n,
                    read: true,
                })),
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications$/i,
            });
            expect(bellButton).toBeInTheDocument();
            expect(screen.queryByText('2')).not.toBeInTheDocument();
        });

        it('should show 99+ for counts over 99', () => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                unreadCount: 150,
            });

            render(<OrganizerNotificationCenter />);

            expect(screen.getByText('99+')).toBeInTheDocument();
        });
    });

    describe('notification list', () => {
        it('should show notifications when popover is opened', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            expect(screen.getByText('New Registration')).toBeInTheDocument();
            expect(screen.getByText('Event Published')).toBeInTheDocument();
            expect(screen.getByText('High Revenue Alert')).toBeInTheDocument();
        });

        it('should show empty state when no notifications', async () => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                notifications: [],
                unreadCount: 0,
            });

            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            expect(
                screen.getByText('No notifications yet')
            ).toBeInTheDocument();
            expect(
                screen.getByText("You'll see real-time updates here")
            ).toBeInTheDocument();
        });

        it('should sort notifications correctly', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const notifications = screen
                .getAllByRole('generic')
                .filter((el) => el.className.includes('border-l-4'));

            // Should be sorted: unread first, then by priority (critical > high > medium), then by timestamp
            expect(notifications).toHaveLength(3);

            // First should be the critical unread notification
            expect(notifications[0]).toHaveTextContent('High Revenue Alert');

            // Second should be the medium unread notification
            expect(notifications[1]).toHaveTextContent('New Registration');

            // Third should be the read high priority notification
            expect(notifications[2]).toHaveTextContent('Event Published');
        });
    });

    describe('notification interactions', () => {
        it('should mark notification as read when clicked', async () => {
            const user = userEvent.setup();
            const mockMarkAsRead = jest.fn();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                markNotificationAsRead: mockMarkAsRead,
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const notification = screen
                .getByText('New Registration')
                .closest('div[class*="border-l-4"]');
            expect(notification).toBeInTheDocument();

            await user.click(notification!);

            expect(mockMarkAsRead).toHaveBeenCalledWith('1');
            expect(mockLocation.href).toBe('/dashboard/event/event-1');
        });

        it('should mark notification as read using mark as read button', async () => {
            const user = userEvent.setup();
            const mockMarkAsRead = jest.fn();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                markNotificationAsRead: mockMarkAsRead,
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const markAsReadButtons = screen.getAllByTitle('Mark as read');
            await user.click(markAsReadButtons[0]);

            expect(mockMarkAsRead).toHaveBeenCalledWith('3'); // Critical notification (first in sorted order)
        });

        it('should dismiss notification', async () => {
            const user = userEvent.setup();
            const mockDismiss = jest.fn();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                dismissNotification: mockDismiss,
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const dismissButtons = screen.getAllByTitle('Dismiss');
            await user.click(dismissButtons[0]);

            expect(mockDismiss).toHaveBeenCalledWith('3'); // Critical notification (first in sorted order)
        });

        it('should mark all notifications as read', async () => {
            const user = userEvent.setup();
            const mockMarkAllAsRead = jest.fn();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                markAllAsRead: mockMarkAllAsRead,
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const markAllReadButton = screen.getByText('Mark all read');
            await user.click(markAllReadButton);

            expect(mockMarkAllAsRead).toHaveBeenCalled();
        });

        it('should clear all notifications', async () => {
            const user = userEvent.setup();
            const mockClearAll = jest.fn();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                clearAllNotifications: mockClearAll,
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const clearAllButton = screen.getByRole('button', { name: '' }); // Trash icon button
            await user.click(clearAllButton);

            expect(mockClearAll).toHaveBeenCalled();
        });
    });

    describe('connection status', () => {
        it('should show connected status', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            expect(screen.getByText('Connected')).toBeInTheDocument();
        });

        it('should show disconnected status with reconnect button', async () => {
            const user = userEvent.setup();
            const mockReconnect = jest.fn();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
                connectionError: 'Connection lost',
                reconnect: mockReconnect,
            });

            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            expect(screen.getByText('Connection lost')).toBeInTheDocument();

            const reconnectButton = screen.getByText('Reconnect');
            await user.click(reconnectButton);

            expect(mockReconnect).toHaveBeenCalled();
        });
    });

    describe('notification priority styling', () => {
        it('should apply correct priority colors', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            const criticalBadge = screen.getByText('critical');
            expect(criticalBadge).toHaveClass('bg-red-100', 'text-red-800');

            const highBadge = screen.getByText('high');
            expect(highBadge).toHaveClass('bg-orange-100', 'text-orange-800');

            const mediumBadge = screen.getByText('medium');
            expect(mediumBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
        });
    });

    describe('time formatting', () => {
        it('should format time correctly', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });
            await user.click(bellButton);

            expect(screen.getByText('Just now')).toBeInTheDocument(); // Recent notification
            expect(screen.getByText('1h ago')).toBeInTheDocument(); // 1 hour ago
            expect(screen.getByText('1d ago')).toBeInTheDocument(); // 1 day ago
        });
    });

    describe('accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications \(2 unread\)/i,
            });
            expect(bellButton).toHaveAttribute(
                'aria-label',
                'Notifications (2 unread)'
            );
        });

        it('should support keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<OrganizerNotificationCenter />);

            const bellButton = screen.getByRole('button', {
                name: /notifications/i,
            });

            // Focus and activate with keyboard
            bellButton.focus();
            await user.keyboard('{Enter}');

            expect(screen.getByText('New Registration')).toBeInTheDocument();
        });
    });

    describe('props', () => {
        it('should pass organizerId to hook', () => {
            render(<OrganizerNotificationCenter organizerId='test-org-123' />);

            expect(mockUseOrganizerRealtime).toHaveBeenCalledWith({
                organizerId: 'test-org-123',
                enableNotifications: true,
                enableToasts: true,
            });
        });

        it('should apply custom className', () => {
            const { container } = render(
                <OrganizerNotificationCenter className='custom-class' />
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });
    });
});

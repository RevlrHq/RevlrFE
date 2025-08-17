import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RealtimeConnectionStatus } from '@/components/RealtimeConnectionStatus';
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';

// Mock the hook
jest.mock('@/hooks/useOrganizerRealtime');

const mockUseOrganizerRealtime = useOrganizerRealtime as jest.MockedFunction<
    typeof useOrganizerRealtime
>;

describe('RealtimeConnectionStatus', () => {
    const mockReconnect = jest.fn();

    const defaultMockReturn = {
        isConnected: true,
        connectionError: null,
        reconnect: mockReconnect,
        // Other properties not used by this component
        notifications: [],
        unreadCount: 0,
        dashboardUpdates: null,
        eventStatusUpdates: [],
        registrationUpdates: [],
        revenueUpdates: [],
        markNotificationAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        dismissNotification: jest.fn(),
        clearAllNotifications: jest.fn(),
        onDashboardUpdate: jest.fn(),
        onEventStatusUpdate: jest.fn(),
        onRegistrationUpdate: jest.fn(),
        onRevenueUpdate: jest.fn(),
    };

    beforeEach(() => {
        mockUseOrganizerRealtime.mockReturnValue(defaultMockReturn);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('connected state', () => {
        it('should show connected status with indicator variant', () => {
            render(<RealtimeConnectionStatus />);

            // Should show wifi icon (connected)
            const wifiIcon = document.querySelector('svg');
            expect(wifiIcon).toBeInTheDocument();
            expect(wifiIcon).toHaveClass('text-green-600');
        });

        it('should show connected status with badge variant', () => {
            render(<RealtimeConnectionStatus variant='badge' showLabel />);

            expect(screen.getByText('Connected')).toBeInTheDocument();
            const badge = screen
                .getByText('Connected')
                .closest('.bg-green-100');
            expect(badge).toBeInTheDocument();
        });

        it('should show connected status with button variant', () => {
            render(<RealtimeConnectionStatus variant='button' showLabel />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
            expect(button).toHaveTextContent('Connected');
            expect(button).toBeDisabled(); // Connected buttons should be disabled
        });

        it('should show pulse animation for connected indicator', () => {
            render(<RealtimeConnectionStatus />);

            const pulseElement = document.querySelector('.animate-pulse');
            expect(pulseElement).toBeInTheDocument();
            expect(pulseElement).toHaveClass('bg-green-500');
        });
    });

    describe('disconnected state', () => {
        beforeEach(() => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
                connectionError: null,
            });
        });

        it('should show disconnected status with indicator variant', () => {
            render(<RealtimeConnectionStatus />);

            const wifiOffIcon = document.querySelector('svg');
            expect(wifiOffIcon).toHaveClass('text-yellow-600');
        });

        it('should show disconnected status with badge variant', () => {
            render(<RealtimeConnectionStatus variant='badge' showLabel />);

            expect(screen.getByText('Disconnected')).toBeInTheDocument();
            const badge = screen
                .getByText('Disconnected')
                .closest('.bg-yellow-100');
            expect(badge).toBeInTheDocument();
        });

        it('should show reconnect button with button variant', async () => {
            const user = userEvent.setup();
            render(<RealtimeConnectionStatus variant='button' showLabel />);

            const button = screen.getByRole('button');
            expect(button).toHaveTextContent('Disconnected');
            expect(button).not.toBeDisabled();

            await user.click(button);
            expect(mockReconnect).toHaveBeenCalled();
        });
    });

    describe('error state', () => {
        beforeEach(() => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
                connectionError: 'Network timeout',
            });
        });

        it('should show error status with indicator variant', () => {
            render(<RealtimeConnectionStatus />);

            const alertIcon = document.querySelector('svg');
            expect(alertIcon).toHaveClass('text-red-600');
        });

        it('should show error status with badge variant', () => {
            render(<RealtimeConnectionStatus variant='badge' showLabel />);

            expect(screen.getByText('Error')).toBeInTheDocument();
            const badge = screen.getByText('Error').closest('.bg-red-100');
            expect(badge).toBeInTheDocument();
        });

        it('should show refresh icon for error button variant', () => {
            render(<RealtimeConnectionStatus variant='button' showLabel />);

            const button = screen.getByRole('button');
            expect(button).toHaveTextContent('Error');

            // Should have refresh icon instead of alert icon
            const refreshIcon = button.querySelector('svg');
            expect(refreshIcon).toBeInTheDocument();
        });
    });

    describe('tooltips', () => {
        it('should have tooltip trigger elements', () => {
            render(<RealtimeConnectionStatus />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute('data-state', 'closed');
        });

        it('should have tooltip trigger for error state', () => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
                connectionError: 'Network timeout',
            });

            render(<RealtimeConnectionStatus />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute('data-state', 'closed');
        });

        it('should have tooltip trigger for disconnected state', () => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
                connectionError: null,
            });

            render(<RealtimeConnectionStatus />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute('data-state', 'closed');
        });
    });

    describe('props', () => {
        it('should pass organizerId to hook', () => {
            render(<RealtimeConnectionStatus organizerId='test-org-123' />);

            expect(mockUseOrganizerRealtime).toHaveBeenCalledWith({
                organizerId: 'test-org-123',
                enableNotifications: false,
                enableToasts: false,
            });
        });

        it('should apply custom className', () => {
            const { container } = render(
                <RealtimeConnectionStatus className='custom-class' />
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should show label when showLabel is true', () => {
            render(<RealtimeConnectionStatus showLabel />);

            expect(screen.getByText('Connected')).toBeInTheDocument();
        });

        it('should not show label when showLabel is false', () => {
            render(<RealtimeConnectionStatus showLabel={false} />);

            expect(screen.queryByText('Connected')).not.toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have proper role and aria-label', () => {
            render(<RealtimeConnectionStatus />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute(
                'aria-label',
                'Connection status: Connected'
            );
        });

        it('should update aria-label based on connection state', () => {
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
                connectionError: 'Network error',
            });

            render(<RealtimeConnectionStatus />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute(
                'aria-label',
                'Connection status: Error'
            );
        });

        it('should be keyboard accessible for button variant', async () => {
            const user = userEvent.setup();
            mockUseOrganizerRealtime.mockReturnValue({
                ...defaultMockReturn,
                isConnected: false,
            });

            render(<RealtimeConnectionStatus variant='button' />);

            const button = screen.getByRole('button');
            button.focus();
            await user.keyboard('{Enter}');

            expect(mockReconnect).toHaveBeenCalled();
        });
    });

    describe('variants', () => {
        it('should render indicator variant by default', () => {
            const { container } = render(<RealtimeConnectionStatus />);

            expect(
                container.querySelector('[role="status"]')
            ).toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should render badge variant', () => {
            render(<RealtimeConnectionStatus variant='badge' />);

            const badge = document.querySelector('.bg-green-100');
            expect(badge).toBeInTheDocument();
        });

        it('should render button variant', () => {
            render(<RealtimeConnectionStatus variant='button' />);

            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });

    describe('hook options', () => {
        it('should disable notifications and toasts for connection status only', () => {
            render(<RealtimeConnectionStatus />);

            expect(mockUseOrganizerRealtime).toHaveBeenCalledWith({
                organizerId: undefined,
                enableNotifications: false,
                enableToasts: false,
            });
        });
    });
});

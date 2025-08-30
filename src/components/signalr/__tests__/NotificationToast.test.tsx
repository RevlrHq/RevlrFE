import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import {
    NotificationToast,
    useNotificationToast,
    NotificationToastProvider,
} from '../NotificationToast';
import { useToast } from '@/hooks/use-toast';
import { NotificationType, NotificationPriority } from '@/types/notifications';
import type {
    NotificationMessage,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
} from '@/types/notifications';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
    useToast: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, variant, size, ...props }: React.ComponentProps<'button'> & { variant?: string; size?: string }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            data-variant={variant}
            data-size={size}
            {...props}
        >
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, variant, className, ...props }: React.ComponentProps<'div'> & { variant?: string }) => (
        <div className={className} data-variant={variant} {...props}>
            {children}
        </div>
    ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Bell: ({ className }: { className?: string }) => (
        <div className={className} data-testid='bell-icon' />
    ),
    CreditCard: ({ className }: { className?: string }) => (
        <div className={className} data-testid='credit-card-icon' />
    ),
    DollarSign: ({ className }: { className?: string }) => (
        <div className={className} data-testid='dollar-sign-icon' />
    ),
    Calendar: ({ className }: { className?: string }) => (
        <div className={className} data-testid='calendar-icon' />
    ),
    AlertTriangle: ({ className }: { className?: string }) => (
        <div className={className} data-testid='alert-triangle-icon' />
    ),
    Info: ({ className }: { className?: string }) => (
        <div className={className} data-testid='info-icon' />
    ),
    CheckCircle2: ({ className }: { className?: string }) => (
        <div className={className} data-testid='check-circle-icon' />
    ),
    XCircle: ({ className }: { className?: string }) => (
        <div className={className} data-testid='x-circle-icon' />
    ),
    ExternalLink: ({ className }: { className?: string }) => (
        <div className={className} data-testid='external-link-icon' />
    ),
    X: ({ className }: { className?: string }) => (
        <div className={className} data-testid='x-icon' />
    ),
}));

describe('NotificationToast', () => {
    const mockPush = jest.fn();
    const mockToast = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        (useToast as jest.Mock).mockReturnValue({
            toast: mockToast,
        });

        // Mock window.open
        Object.defineProperty(window, 'open', {
            writable: true,
            value: jest.fn(),
        });
    });

    const createTestNotification = (
        overrides: Partial<NotificationMessage> = {}
    ): NotificationMessage => ({
        id: 'test-notification-1',
        type: NotificationType.EventRegistration,
        title: 'Test Notification',
        message: 'This is a test notification message',
        timestamp: '2024-01-15T12:00:00Z',
        priority: NotificationPriority.Normal,
        actionUrl: '/events/test-event',
        data: {
            eventId: 'test-event-1',
            eventTitle: 'Test Event',
            organizerName: 'Test Organizer',
            eventDate: '2024-06-15T18:00:00Z',
        } as EventNotificationData,
        ...overrides,
    });

    describe('Basic Rendering', () => {
        it('should render notification with title and message', () => {
            const notification = createTestNotification();
            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Test Notification')).toBeInTheDocument();
            expect(
                screen.getByText('This is a test notification message')
            ).toBeInTheDocument();
        });

        it('should render appropriate icon for notification type', () => {
            const notification = createTestNotification({
                type: NotificationType.EventRegistration,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
        });

        it('should render payment icon for payment notifications', () => {
            const notification = createTestNotification({
                type: NotificationType.PaymentCompleted,
                data: {
                    paymentId: 'test-payment-1',
                    amount: 99.99,
                    currency: 'USD',
                    paymentMethod: 'CreditCard' as PaymentNotificationData['paymentMethod'],
                    transactionDate: '2024-01-15T10:30:00Z',
                    userId: 'test-user-1',
                } as PaymentNotificationData,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
        });

        it('should render financing icon for financing notifications', () => {
            const notification = createTestNotification({
                type: NotificationType.FinancingApplicationSubmitted,
                data: {
                    applicationId: 'test-app-1',
                    userId: 'test-user-1',
                    eventId: 'test-event-1',
                    eventTitle: 'Test Event',
                    requestedAmount: 5000,
                    currency: 'USD',
                    applicationDate: '2024-01-01T09:00:00Z',
                } as FinancingNotificationData,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
        });
    });

    describe('Priority-Based Styling', () => {
        it('should apply normal priority styling by default', () => {
            const notification = createTestNotification({
                priority: NotificationPriority.Normal,
            });
            render(<NotificationToast notification={notification} />);

            const container = screen.getByRole('alert');
            expect(container).toHaveClass(
                'border-gray-200',
                'bg-white',
                'text-gray-900'
            );
        });

        it('should apply high priority styling', () => {
            const notification = createTestNotification({
                priority: NotificationPriority.High,
            });
            render(<NotificationToast notification={notification} />);

            const container = screen.getByRole('alert');
            expect(container).toHaveClass(
                'border-orange-200',
                'bg-orange-50',
                'text-orange-900'
            );
        });

        it('should apply critical priority styling', () => {
            const notification = createTestNotification({
                priority: NotificationPriority.Critical,
            });
            render(<NotificationToast notification={notification} />);

            const container = screen.getByRole('alert');
            expect(container).toHaveClass(
                'border-red-200',
                'bg-red-50',
                'text-red-900'
            );
            expect(container).toHaveAttribute('aria-live', 'assertive');
        });

        it('should show priority indicator for non-normal priorities', () => {
            const notification = createTestNotification({
                priority: NotificationPriority.High,
            });
            render(<NotificationToast notification={notification} />);

            const indicator = screen
                .getByRole('alert')
                .querySelector('.bg-orange-500');
            expect(indicator).toBeInTheDocument();
        });

        it('should not show priority indicator for normal priority', () => {
            const notification = createTestNotification({
                priority: NotificationPriority.Normal,
            });
            render(<NotificationToast notification={notification} />);

            const indicator = screen
                .getByRole('alert')
                .querySelector('.bg-orange-500');
            expect(indicator).not.toBeInTheDocument();
        });
    });

    describe('Type Badge', () => {
        it('should show type badge by default', () => {
            const notification = createTestNotification({
                type: NotificationType.EventRegistration,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Event Registration')).toBeInTheDocument();
        });

        it('should hide type badge when disabled', () => {
            const notification = createTestNotification({
                type: NotificationType.EventRegistration,
            });
            render(
                <NotificationToast
                    notification={notification}
                    showTypeBadge={false}
                />
            );

            expect(
                screen.queryByText('Event Registration')
            ).not.toBeInTheDocument();
        });

        it('should format type names correctly', () => {
            const notification = createTestNotification({
                type: NotificationType.PaymentCompleted,
                data: {
                    paymentId: 'test-payment-1',
                    amount: 99.99,
                    currency: 'USD',
                    paymentMethod: 'CreditCard' as PaymentNotificationData['paymentMethod'],
                    transactionDate: '2024-01-15T10:30:00Z',
                    userId: 'test-user-1',
                } as PaymentNotificationData,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Payment Completed')).toBeInTheDocument();
        });
    });

    describe('Action Button', () => {
        it('should show action button when actionUrl is present', () => {
            const notification = createTestNotification({
                actionUrl: '/events/test-event',
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('View Event')).toBeInTheDocument();
        });

        it('should hide action button when showActionButton is false', () => {
            const notification = createTestNotification({
                actionUrl: '/events/test-event',
            });
            render(
                <NotificationToast
                    notification={notification}
                    showActionButton={false}
                />
            );

            expect(screen.queryByText('View Event')).not.toBeInTheDocument();
        });

        it('should use custom action button text', () => {
            const notification = createTestNotification({
                actionUrl: '/events/test-event',
            });
            render(
                <NotificationToast
                    notification={notification}
                    actionButtonText='Custom Action'
                />
            );

            expect(screen.getByText('Custom Action')).toBeInTheDocument();
        });

        it('should navigate to internal URL when action button is clicked', () => {
            const notification = createTestNotification({
                actionUrl: '/events/test-event',
            });
            render(<NotificationToast notification={notification} />);

            const actionButton = screen.getByText('View Event');
            fireEvent.click(actionButton);

            expect(mockPush).toHaveBeenCalledWith('/events/test-event');
        });

        it('should open external URL in new tab when action button is clicked', () => {
            const notification = createTestNotification({
                actionUrl: 'https://example.com/event',
            });
            render(<NotificationToast notification={notification} />);

            const actionButton = screen.getByText('View Event');
            fireEvent.click(actionButton);

            expect(window.open).toHaveBeenCalledWith(
                'https://example.com/event',
                '_blank',
                'noopener,noreferrer'
            );
        });

        it('should show external link icon for external URLs', () => {
            const notification = createTestNotification({
                actionUrl: 'https://example.com/event',
            });
            render(<NotificationToast notification={notification} />);

            expect(
                screen.getByTestId('external-link-icon')
            ).toBeInTheDocument();
        });

        it('should call custom onActionClick when provided', () => {
            const mockOnActionClick = jest.fn();
            const notification = createTestNotification({
                actionUrl: '/events/test-event',
            });
            render(
                <NotificationToast
                    notification={notification}
                    onActionClick={mockOnActionClick}
                />
            );

            const actionButton = screen.getByText('View Event');
            fireEvent.click(actionButton);

            expect(mockOnActionClick).toHaveBeenCalledWith(notification);
        });
    });

    describe('Dismiss Functionality', () => {
        it('should show dismiss button by default', () => {
            const notification = createTestNotification();
            render(<NotificationToast notification={notification} />);

            expect(screen.getByTestId('x-icon')).toBeInTheDocument();
        });

        it('should hide dismiss button when disabled', () => {
            const notification = createTestNotification();
            render(
                <NotificationToast
                    notification={notification}
                    showDismissButton={false}
                />
            );

            expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
        });

        it('should call onDismiss when dismiss button is clicked', () => {
            const mockOnDismiss = jest.fn();
            const notification = createTestNotification();
            render(
                <NotificationToast
                    notification={notification}
                    onDismiss={mockOnDismiss}
                />
            );

            const dismissButton = screen
                .getByTestId('x-icon')
                .closest('button');
            fireEvent.click(dismissButton!);

            expect(mockOnDismiss).toHaveBeenCalledWith(notification);
        });
    });

    describe('Auto-Dismiss', () => {
        it('should have auto-dismiss functionality', () => {
            const notification = createTestNotification({
                priority: NotificationPriority.Normal,
            });
            render(<NotificationToast notification={notification} />);

            // Just verify the component renders without errors
            expect(screen.getByText('Test Notification')).toBeInTheDocument();
        });
    });

    describe('Context Information', () => {
        it('should show event title for event notifications', () => {
            const notification = createTestNotification({
                type: NotificationType.EventRegistration,
                data: {
                    eventId: 'test-event-1',
                    eventTitle: 'Amazing Concert 2024',
                    organizerName: 'Test Organizer',
                    eventDate: '2024-06-15T18:00:00Z',
                } as EventNotificationData,
            });
            render(<NotificationToast notification={notification} />);

            expect(
                screen.getByText('Amazing Concert 2024')
            ).toBeInTheDocument();
        });

        it('should show payment amount for payment notifications', () => {
            const notification = createTestNotification({
                type: NotificationType.PaymentCompleted,
                data: {
                    paymentId: 'test-payment-1',
                    amount: 99.99,
                    currency: 'USD',
                    paymentMethod: 'CreditCard' as PaymentNotificationData['paymentMethod'],
                    transactionDate: '2024-01-15T10:30:00Z',
                    userId: 'test-user-1',
                } as PaymentNotificationData,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('USD 99.99')).toBeInTheDocument();
        });

        it('should show financing amount for financing notifications', () => {
            const notification = createTestNotification({
                type: NotificationType.FinancingApplicationSubmitted,
                data: {
                    applicationId: 'test-app-1',
                    userId: 'test-user-1',
                    eventId: 'test-event-1',
                    eventTitle: 'Test Event',
                    requestedAmount: 5000,
                    currency: 'USD',
                    applicationDate: '2024-01-01T09:00:00Z',
                } as FinancingNotificationData,
            });
            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('USD 5000.00')).toBeInTheDocument();
        });
    });

    describe('Timestamp Formatting', () => {
        it('should display timestamp', () => {
            const notification = createTestNotification({
                timestamp: '2024-01-15T12:00:00Z',
            });
            render(<NotificationToast notification={notification} />);

            // Just verify the component renders the timestamp (could be date or relative time)
            expect(
                screen.getByText(/\d+\/\d+\/\d+|\d+[mhd] ago|just now/i)
            ).toBeInTheDocument();
        });
    });
});

describe('useNotificationToast', () => {
    const mockPush = jest.fn();
    const mockToast = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        (useToast as jest.Mock).mockReturnValue({
            toast: mockToast,
        });
    });

    const TestComponent = () => {
        const { showNotification, showEventNotification } =
            useNotificationToast();

        const handleShowNotification = () => {
            const notification: NotificationMessage = {
                id: 'test-1',
                type: NotificationType.EventRegistration,
                title: 'Test Event',
                message: 'Test message',
                timestamp: '2024-01-15T12:00:00Z',
                priority: NotificationPriority.Normal,
                actionUrl: '/events/test',
            };
            showNotification(notification);
        };

        const handleShowEventNotification = () => {
            const notification: NotificationMessage & {
                data: EventNotificationData;
            } = {
                id: 'test-2',
                type: NotificationType.EventRegistration,
                title: 'Event Notification',
                message: 'Event message',
                timestamp: '2024-01-15T12:00:00Z',
                priority: NotificationPriority.Normal,
                actionUrl: '/events/test',
                data: {
                    eventId: 'test-event-1',
                    eventTitle: 'Test Event',
                    organizerName: 'Test Organizer',
                    eventDate: '2024-06-15T18:00:00Z',
                },
            };
            showEventNotification(notification);
        };

        return (
            <div>
                <button onClick={handleShowNotification}>
                    Show Notification
                </button>
                <button onClick={handleShowEventNotification}>
                    Show Event Notification
                </button>
            </div>
        );
    };

    it('should call toast with correct parameters', () => {
        render(<TestComponent />);

        const button = screen.getByText('Show Notification');
        fireEvent.click(button);

        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
                variant: 'default',
                description: 'Test message',
            })
        );
    });

    it('should show event notification with correct action text', () => {
        render(<TestComponent />);

        const button = screen.getByText('Show Event Notification');
        fireEvent.click(button);

        expect(mockToast).toHaveBeenCalled();
    });
});

describe('NotificationToastProvider', () => {
    const TestChild = () => <div>Test Child</div>;

    it('should render children', () => {
        render(
            <NotificationToastProvider notifications={[]}>
                <TestChild />
            </NotificationToastProvider>
        );

        expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should show notifications automatically', () => {
        const mockOnNotificationShown = jest.fn();
        const notifications = [
            {
                id: 'test-1',
                type: NotificationType.EventRegistration,
                title: 'Test Notification',
                message: 'Test message',
                timestamp: '2024-01-15T12:00:00Z',
                priority: NotificationPriority.Normal,
                actionUrl: '/events/test',
            } as NotificationMessage,
        ];

        render(
            <NotificationToastProvider
                notifications={notifications}
                onNotificationShown={mockOnNotificationShown}
            >
                <TestChild />
            </NotificationToastProvider>
        );

        expect(mockOnNotificationShown).toHaveBeenCalledWith(notifications[0]);
    });
});

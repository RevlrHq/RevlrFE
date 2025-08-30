import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { NotificationToast } from '../NotificationToast';
import {
    NotificationType,
    NotificationPriority,
    createTestNotificationMessage,
    createTestEventNotificationData,
    createTestPaymentNotificationData,
    createTestFinancingNotificationData,
    createTestSystemNotificationData,
} from '@/types/notifications';

// Mock dependencies
jest.mock('next/navigation');

const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
};

describe('NotificationToast', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
    });

    describe('Basic Rendering', () => {
        it('should render notification title and message', () => {
            const notification = createTestNotificationMessage({
                title: 'Test Notification',
                message: 'This is a test message',
                priority: NotificationPriority.Normal,
            });

            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Test Notification')).toBeInTheDocument();
            expect(
                screen.getByText('This is a test message')
            ).toBeInTheDocument();
        });

        it('should display timestamp', () => {
            const notification = createTestNotificationMessage({
                timestamp: '2024-01-15T12:00:00Z',
            });

            render(<NotificationToast notification={notification} />);

            // Check that some time format is displayed
            expect(screen.getByText(/12:00/)).toBeInTheDocument();
        });

        it('should show appropriate icon for notification type', () => {
            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
            });

            const { rerender } = render(
                <NotificationToast notification={eventNotification} />
            );

            // Check that an icon is rendered (we can't easily test specific icons)
            expect(document.querySelector('svg')).toBeInTheDocument();

            // Test different notification type
            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentFailed,
            });

            rerender(<NotificationToast notification={paymentNotification} />);
            expect(document.querySelector('svg')).toBeInTheDocument();
        });
    });

    describe('Priority-Based Styling', () => {
        it('should apply critical priority styling', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Critical,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-l-4', 'border-l-red-500');
        });

        it('should apply high priority styling', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.High,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-l-4', 'border-l-orange-500');
        });

        it('should apply normal priority styling', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Normal,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-l-4', 'border-l-blue-500');
        });

        it('should apply low priority styling', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Low,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-l-4', 'border-l-gray-400');
        });

        it('should show priority indicator for critical notifications', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Critical,
            });

            render(<NotificationToast notification={notification} />);

            const indicator = document.querySelector('.animate-pulse');
            expect(indicator).toBeInTheDocument();
            expect(indicator).toHaveClass('bg-red-500');
        });

        it('should not show priority indicator for non-critical notifications', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Normal,
            });

            render(<NotificationToast notification={notification} />);

            const indicator = document.querySelector('.animate-pulse');
            expect(indicator).not.toBeInTheDocument();
        });
    });

    describe('Notification Data Display', () => {
        it('should display event notification data', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventTitle: 'Test Event 2024',
                    organizerName: 'Test Organizer',
                    eventDate: '2024-06-15T18:00:00Z',
                    eventLocation: 'Test Venue',
                }),
            });

            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
            expect(
                screen.getByText('Organizer: Test Organizer')
            ).toBeInTheDocument();
            expect(screen.getByText(/Date: 6\/15\/2024/)).toBeInTheDocument();
            expect(
                screen.getByText('Location: Test Venue')
            ).toBeInTheDocument();
        });

        it('should display payment notification data', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
                data: createTestPaymentNotificationData({
                    eventTitle: 'Test Event',
                    amount: 99.99,
                    currency: 'USD',
                    paymentMethod: 'CreditCard',
                }),
            });

            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Test Event')).toBeInTheDocument();
            expect(screen.getByText('Amount: USD 99.99')).toBeInTheDocument();
            expect(screen.getByText('Method: CreditCard')).toBeInTheDocument();
        });

        it('should display financing notification data', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.FinancingApplicationSubmitted,
                data: createTestFinancingNotificationData({
                    eventTitle: 'Test Event',
                    requestedAmount: 5000,
                    currency: 'USD',
                }),
            });

            render(<NotificationToast notification={notification} />);

            expect(screen.getByText('Test Event')).toBeInTheDocument();
            expect(screen.getByText('Amount: USD 5000.00')).toBeInTheDocument();
        });

        it('should display system notification data', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.SystemMaintenance,
                data: createTestSystemNotificationData({
                    category: 'Maintenance',
                    affectedServices: ['auth', 'payments'],
                    estimatedDuration: '2 hours',
                }),
            });

            render(<NotificationToast notification={notification} />);

            expect(
                screen.getByText('Maintenance Notification')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Services: auth, payments')
            ).toBeInTheDocument();
            expect(screen.getByText('Duration: 2 hours')).toBeInTheDocument();
        });
    });

    describe('Action Handling', () => {
        it('should show action button when actionUrl is provided', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                actionUrl: 'https://example.com/event/123',
            });

            render(<NotificationToast notification={notification} />);

            const actionButton = screen.getByText('View Event');
            expect(actionButton).toBeInTheDocument();
        });

        it('should show action button when onNavigate is provided', () => {
            const onNavigate = jest.fn();
            const notification = createTestNotificationMessage({
                type: NotificationType.PaymentFailed,
            });

            render(
                <NotificationToast
                    notification={notification}
                    onNavigate={onNavigate}
                />
            );

            const actionButton = screen.getByText('Retry Payment');
            expect(actionButton).toBeInTheDocument();
        });

        it('should call onNavigate when action button is clicked', () => {
            const onNavigate = jest.fn();
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
            });

            render(
                <NotificationToast
                    notification={notification}
                    onNavigate={onNavigate}
                />
            );

            const actionButton = screen.getByText('View Event');
            fireEvent.click(actionButton);

            expect(onNavigate).toHaveBeenCalledWith(notification);
        });

        it('should navigate to actionUrl when no onNavigate is provided', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                actionUrl: '/events/123',
            });

            render(<NotificationToast notification={notification} />);

            const actionButton = screen.getByText('View Event');
            fireEvent.click(actionButton);

            expect(mockRouter.push).toHaveBeenCalledWith('/events/123');
        });

        it('should call onDismiss when close button is clicked', () => {
            const onDismiss = jest.fn();
            const notification = createTestNotificationMessage({
                id: 'test-123',
            });

            render(
                <NotificationToast
                    notification={notification}
                    onDismiss={onDismiss}
                />
            );

            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            expect(onDismiss).toHaveBeenCalledWith('test-123');
        });

        it('should display correct action text for different notification types', () => {
            const testCases = [
                {
                    type: NotificationType.EventRegistration,
                    expectedText: 'View Event',
                },
                {
                    type: NotificationType.PaymentCompleted,
                    expectedText: 'View Receipt',
                },
                {
                    type: NotificationType.PaymentFailed,
                    expectedText: 'Retry Payment',
                },
                {
                    type: NotificationType.PaymentPending,
                    expectedText: 'Check Status',
                },
                {
                    type: NotificationType.FinancingApplicationSubmitted,
                    expectedText: 'View Application',
                },
                {
                    type: NotificationType.FinancingPaymentDue,
                    expectedText: 'Make Payment',
                },
                {
                    type: NotificationType.SystemMaintenance,
                    expectedText: 'Learn More',
                },
            ];

            testCases.forEach(({ type, expectedText }) => {
                const notification = createTestNotificationMessage({
                    type,
                    actionUrl: 'https://example.com',
                });

                const { unmount } = render(
                    <NotificationToast notification={notification} />
                );

                expect(screen.getByText(expectedText)).toBeInTheDocument();

                unmount();
            });
        });
    });

    describe('Variant Selection', () => {
        it('should use destructive variant for critical priority', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Critical,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-destructive', 'bg-destructive');
        });

        it('should use destructive variant for high priority', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.High,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-destructive', 'bg-destructive');
        });

        it('should use destructive variant for failed notifications regardless of priority', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.PaymentFailed,
                priority: NotificationPriority.Normal,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border-destructive', 'bg-destructive');
        });

        it('should use default variant for normal priority', () => {
            const notification = createTestNotificationMessage({
                priority: NotificationPriority.Normal,
            });

            render(<NotificationToast notification={notification} />);

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('border', 'bg-background');
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA roles', () => {
            const notification = createTestNotificationMessage();

            render(<NotificationToast notification={notification} />);

            expect(screen.getByRole('region')).toBeInTheDocument();
        });

        it('should have accessible action button', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                actionUrl: 'https://example.com',
            });

            render(<NotificationToast notification={notification} />);

            const actionButton = screen.getByRole('button', {
                name: 'View Event',
            });
            expect(actionButton).toBeInTheDocument();
        });

        it('should have accessible close button', () => {
            const notification = createTestNotificationMessage();

            render(<NotificationToast notification={notification} />);

            const closeButton = screen.getByRole('button', { name: /close/i });
            expect(closeButton).toBeInTheDocument();
        });
    });

    describe('Custom Styling', () => {
        it('should apply custom className', () => {
            const notification = createTestNotificationMessage();

            render(
                <NotificationToast
                    notification={notification}
                    className='custom-class'
                />
            );

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass('custom-class');
        });

        it('should maintain base classes with custom className', () => {
            const notification = createTestNotificationMessage();

            render(
                <NotificationToast
                    notification={notification}
                    className='custom-class'
                />
            );

            const toast = screen.getByRole('region');
            expect(toast).toHaveClass(
                'group',
                'relative',
                'overflow-hidden',
                'custom-class'
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle notification without data', () => {
            const notification = createTestNotificationMessage({
                data: undefined,
            });

            render(<NotificationToast notification={notification} />);

            expect(screen.getByText(notification.title)).toBeInTheDocument();
            expect(screen.getByText(notification.message)).toBeInTheDocument();
        });

        it('should handle notification without actionUrl', () => {
            const notification = createTestNotificationMessage({
                actionUrl: undefined,
            });

            render(<NotificationToast notification={notification} />);

            expect(
                screen.queryByRole('button', { name: /view/i })
            ).not.toBeInTheDocument();
        });

        it('should handle invalid timestamp gracefully', () => {
            const notification = createTestNotificationMessage({
                timestamp: 'invalid-date',
            });

            expect(() => {
                render(<NotificationToast notification={notification} />);
            }).not.toThrow();
        });

        it('should handle missing optional data fields', () => {
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createTestEventNotificationData({
                    eventLocation: undefined,
                    eventImageUrl: undefined,
                }),
            });

            render(<NotificationToast notification={notification} />);

            expect(screen.getByText(notification.title)).toBeInTheDocument();
            // Should not crash when optional fields are missing
        });
    });
});

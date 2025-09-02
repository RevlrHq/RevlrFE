import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationSettings } from '../components/NotificationSettings';
import { EmailNotifications } from '../components/EmailNotifications';
import { PushNotifications } from '../components/PushNotifications';
import { InAppNotifications } from '../components/InAppNotifications';
import { NotificationToggle } from '../components/NotificationToggle';
import { NotificationFrequency } from '../components/NotificationFrequency';

// Mock the notification store
jest.mock('../../stores/preferencesStore', () => ({
    usePreferencesStore: () => ({
        notifications: {
            email: {
                eventUpdates: true,
                registrationAlerts: true,
                paymentNotifications: true,
                marketingEmails: false,
                securityAlerts: true,
            },
            push: {
                enabled: true,
                eventReminders: true,
                registrationAlerts: true,
                paymentNotifications: false,
            },
            inApp: {
                enabled: true,
                eventUpdates: true,
                systemNotifications: true,
            },
            frequency: 'immediate',
        },
        updateNotifications: jest.fn(),
        isLoading: false,
    }),
}));

// Mock UI components
jest.mock('@/components/ui/switch', () => ({
    Switch: ({ checked, onCheckedChange, disabled, ...props }: any) => (
        <input
            type='checkbox'
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={disabled}
            {...props}
        />
    ),
}));

jest.mock('@/components/ui/select', () => ({
    Select: ({ children, onValueChange, defaultValue }: any) => (
        <select
            onChange={(e) => onValueChange?.(e.target.value)}
            defaultValue={defaultValue}
        >
            {children}
        </select>
    ),
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => (
        <option value={value}>{children}</option>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

jest.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: any) => (
        <div className={className}>{children}</div>
    ),
    CardContent: ({ children, className }: any) => (
        <div className={className}>{children}</div>
    ),
    CardHeader: ({ children, className }: any) => (
        <div className={className}>{children}</div>
    ),
    CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

describe('Notification Components', () => {
    describe('NotificationSettings', () => {
        it('renders all notification sections', () => {
            render(<NotificationSettings />);

            expect(screen.getByText('Email Notifications')).toBeInTheDocument();
            expect(screen.getByText('Push Notifications')).toBeInTheDocument();
            expect(
                screen.getByText('In-App Notifications')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Notification Frequency')
            ).toBeInTheDocument();
        });
    });

    describe('EmailNotifications', () => {
        const defaultProps = {
            preferences: {
                eventUpdates: true,
                registrationAlerts: true,
                paymentNotifications: true,
                marketingEmails: false,
                securityAlerts: true,
            },
            onUpdate: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders email notification toggles', () => {
            render(<EmailNotifications {...defaultProps} />);

            expect(screen.getByText('Event Updates')).toBeInTheDocument();
            expect(screen.getByText('Registration Alerts')).toBeInTheDocument();
            expect(
                screen.getByText('Payment Notifications')
            ).toBeInTheDocument();
            expect(screen.getByText('Marketing Emails')).toBeInTheDocument();
            expect(screen.getByText('Security Alerts')).toBeInTheDocument();
        });

        it('reflects current preferences state', () => {
            render(<EmailNotifications {...defaultProps} />);

            const eventUpdatesToggle = screen.getByLabelText('Event Updates');
            const marketingToggle = screen.getByLabelText('Marketing Emails');

            expect(eventUpdatesToggle).toBeChecked();
            expect(marketingToggle).not.toBeChecked();
        });

        it('handles preference updates', async () => {
            const user = userEvent.setup();
            const mockOnUpdate = jest.fn();

            render(
                <EmailNotifications {...defaultProps} onUpdate={mockOnUpdate} />
            );

            const marketingToggle = screen.getByLabelText('Marketing Emails');
            await user.click(marketingToggle);

            expect(mockOnUpdate).toHaveBeenCalledWith({
                marketingEmails: true,
            });
        });

        it('shows security alerts as always enabled', () => {
            render(<EmailNotifications {...defaultProps} />);

            const securityToggle = screen.getByLabelText('Security Alerts');
            expect(securityToggle).toBeDisabled();
            expect(securityToggle).toBeChecked();
        });

        it('shows loading state', () => {
            render(<EmailNotifications {...defaultProps} isLoading={true} />);

            const toggles = screen.getAllByRole('checkbox');
            toggles.forEach((toggle) => {
                if (!toggle.hasAttribute('data-security')) {
                    expect(toggle).toBeDisabled();
                }
            });
        });
    });

    describe('PushNotifications', () => {
        const defaultProps = {
            preferences: {
                enabled: true,
                eventReminders: true,
                registrationAlerts: true,
                paymentNotifications: false,
            },
            onUpdate: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders push notification toggles', () => {
            render(<PushNotifications {...defaultProps} />);

            expect(
                screen.getByText('Enable Push Notifications')
            ).toBeInTheDocument();
            expect(screen.getByText('Event Reminders')).toBeInTheDocument();
            expect(screen.getByText('Registration Alerts')).toBeInTheDocument();
            expect(
                screen.getByText('Payment Notifications')
            ).toBeInTheDocument();
        });

        it('disables sub-options when push notifications disabled', () => {
            const disabledProps = {
                ...defaultProps,
                preferences: { ...defaultProps.preferences, enabled: false },
            };

            render(<PushNotifications {...disabledProps} />);

            const eventRemindersToggle =
                screen.getByLabelText('Event Reminders');
            expect(eventRemindersToggle).toBeDisabled();
        });

        it('handles master toggle', async () => {
            const user = userEvent.setup();
            const mockOnUpdate = jest.fn();

            render(
                <PushNotifications {...defaultProps} onUpdate={mockOnUpdate} />
            );

            const masterToggle = screen.getByLabelText(
                'Enable Push Notifications'
            );
            await user.click(masterToggle);

            expect(mockOnUpdate).toHaveBeenCalledWith({
                enabled: false,
            });
        });

        it('shows browser permission request', async () => {
            // Mock Notification API
            Object.defineProperty(window, 'Notification', {
                value: {
                    permission: 'default',
                    requestPermission: jest.fn().mockResolvedValue('granted'),
                },
                writable: true,
            });

            const user = userEvent.setup();
            render(<PushNotifications {...defaultProps} />);

            const enableButton = screen.getByText(
                'Enable Browser Notifications'
            );
            await user.click(enableButton);

            expect(window.Notification.requestPermission).toHaveBeenCalled();
        });
    });

    describe('InAppNotifications', () => {
        const defaultProps = {
            preferences: {
                enabled: true,
                eventUpdates: true,
                systemNotifications: true,
            },
            onUpdate: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders in-app notification toggles', () => {
            render(<InAppNotifications {...defaultProps} />);

            expect(
                screen.getByText('Enable In-App Notifications')
            ).toBeInTheDocument();
            expect(screen.getByText('Event Updates')).toBeInTheDocument();
            expect(
                screen.getByText('System Notifications')
            ).toBeInTheDocument();
        });

        it('handles preference updates', async () => {
            const user = userEvent.setup();
            const mockOnUpdate = jest.fn();

            render(
                <InAppNotifications {...defaultProps} onUpdate={mockOnUpdate} />
            );

            const eventUpdatesToggle = screen.getByLabelText('Event Updates');
            await user.click(eventUpdatesToggle);

            expect(mockOnUpdate).toHaveBeenCalledWith({
                eventUpdates: false,
            });
        });
    });

    describe('NotificationToggle', () => {
        const defaultProps = {
            label: 'Test Notification',
            description: 'Test description',
            checked: false,
            onChange: jest.fn(),
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders label and description', () => {
            render(<NotificationToggle {...defaultProps} />);

            expect(screen.getByText('Test Notification')).toBeInTheDocument();
            expect(screen.getByText('Test description')).toBeInTheDocument();
        });

        it('handles toggle changes', async () => {
            const user = userEvent.setup();
            const mockOnChange = jest.fn();

            render(
                <NotificationToggle {...defaultProps} onChange={mockOnChange} />
            );

            const toggle = screen.getByRole('checkbox');
            await user.click(toggle);

            expect(mockOnChange).toHaveBeenCalledWith(true);
        });

        it('shows checked state', () => {
            render(<NotificationToggle {...defaultProps} checked={true} />);

            const toggle = screen.getByRole('checkbox');
            expect(toggle).toBeChecked();
        });

        it('handles disabled state', () => {
            render(<NotificationToggle {...defaultProps} disabled={true} />);

            const toggle = screen.getByRole('checkbox');
            expect(toggle).toBeDisabled();
        });

        it('renders without description', () => {
            render(
                <NotificationToggle {...defaultProps} description={undefined} />
            );

            expect(screen.getByText('Test Notification')).toBeInTheDocument();
            expect(
                screen.queryByText('Test description')
            ).not.toBeInTheDocument();
        });
    });

    describe('NotificationFrequency', () => {
        const defaultProps = {
            frequency: 'immediate' as const,
            onFrequencyChange: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders frequency selector', () => {
            render(<NotificationFrequency {...defaultProps} />);

            expect(
                screen.getByText('Notification Frequency')
            ).toBeInTheDocument();
        });

        it('shows current frequency', () => {
            render(<NotificationFrequency {...defaultProps} />);

            const select = screen.getByDisplayValue('immediate');
            expect(select).toBeInTheDocument();
        });

        it('handles frequency changes', async () => {
            const user = userEvent.setup();
            const mockOnFrequencyChange = jest.fn();

            render(
                <NotificationFrequency
                    {...defaultProps}
                    onFrequencyChange={mockOnFrequencyChange}
                />
            );

            const select = screen.getByRole('combobox');
            await user.selectOptions(select, 'daily');

            expect(mockOnFrequencyChange).toHaveBeenCalledWith('daily');
        });

        it('shows frequency descriptions', () => {
            render(<NotificationFrequency {...defaultProps} />);

            expect(
                screen.getByText(/receive notifications immediately/i)
            ).toBeInTheDocument();
        });

        it('disables selector when loading', () => {
            render(
                <NotificationFrequency {...defaultProps} isLoading={true} />
            );

            const select = screen.getByRole('combobox');
            expect(select).toBeDisabled();
        });
    });
});

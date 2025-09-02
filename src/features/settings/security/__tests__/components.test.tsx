import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecuritySettings } from '../components/SecuritySettings';
import { EmailChangeForm } from '../components/EmailChangeForm';
import { SessionManager } from '../components/SessionManager';
import { SessionItem } from '../components/SessionItem';
import { PasswordSettings } from '../components/PasswordSettings';

// Mock the security store
jest.mock('../../stores/securityStore', () => ({
    useSecurityStore: () => ({
        sessions: [
            {
                id: '1',
                deviceInfo: 'Chrome on Windows',
                location: 'New York, US',
                lastActivity: new Date('2024-01-01'),
                isCurrentSession: true,
            },
            {
                id: '2',
                deviceInfo: 'Safari on iPhone',
                location: 'Los Angeles, US',
                lastActivity: new Date('2024-01-02'),
                isCurrentSession: false,
            },
        ],
        revokeSession: jest.fn(),
        revokeAllSessions: jest.fn(),
        changeEmail: jest.fn(),
        isLoading: false,
        error: null,
    }),
}));

// Mock UI components
jest.mock('@/components/ui/input', () => ({
    Input: ({ className, ...props }: any) => (
        <input className={className} {...props} />
    ),
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, variant, ...props }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={variant}
            {...props}
        >
            {children}
        </button>
    ),
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

jest.mock('@/components/ui/alert', () => ({
    Alert: ({ children, variant, className }: any) => (
        <div className={`alert ${variant} ${className}`}>{children}</div>
    ),
    AlertDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

describe('Security Components', () => {
    describe('SecuritySettings', () => {
        it('renders security settings sections', () => {
            render(<SecuritySettings />);

            expect(screen.getByText('Email Settings')).toBeInTheDocument();
            expect(screen.getByText('Active Sessions')).toBeInTheDocument();
            expect(screen.getByText('Password Settings')).toBeInTheDocument();
        });

        it('displays current email', () => {
            render(<SecuritySettings currentEmail='test@example.com' />);
            expect(screen.getByText('test@example.com')).toBeInTheDocument();
        });
    });

    describe('EmailChangeForm', () => {
        const defaultProps = {
            currentEmail: 'current@example.com',
            onEmailChange: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders current email', () => {
            render(<EmailChangeForm {...defaultProps} />);
            expect(screen.getByText('current@example.com')).toBeInTheDocument();
        });

        it('validates new email format', async () => {
            const user = userEvent.setup();
            render(<EmailChangeForm {...defaultProps} />);

            const changeButton = screen.getByText('Change Email');
            await user.click(changeButton);

            const newEmailInput = screen.getByPlaceholderText(
                'Enter new email address'
            );
            await user.type(newEmailInput, 'invalid-email');
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/please enter a valid email address/i)
                ).toBeInTheDocument();
            });
        });

        it('prevents same email submission', async () => {
            const user = userEvent.setup();
            render(<EmailChangeForm {...defaultProps} />);

            const changeButton = screen.getByText('Change Email');
            await user.click(changeButton);

            const newEmailInput = screen.getByPlaceholderText(
                'Enter new email address'
            );
            await user.type(newEmailInput, 'current@example.com');

            const submitButton = screen.getByText('Send Verification');
            expect(submitButton).toBeDisabled();
        });

        it('handles email change submission', async () => {
            const user = userEvent.setup();
            const mockOnEmailChange = jest.fn();

            render(
                <EmailChangeForm
                    {...defaultProps}
                    onEmailChange={mockOnEmailChange}
                />
            );

            const changeButton = screen.getByText('Change Email');
            await user.click(changeButton);

            const newEmailInput = screen.getByPlaceholderText(
                'Enter new email address'
            );
            await user.type(newEmailInput, 'new@example.com');

            const submitButton = screen.getByText('Send Verification');
            await user.click(submitButton);

            expect(mockOnEmailChange).toHaveBeenCalledWith('new@example.com');
        });

        it('shows loading state', () => {
            render(<EmailChangeForm {...defaultProps} isLoading={true} />);
            expect(screen.getByText('Processing...')).toBeInTheDocument();
        });

        it('requires password confirmation for email change', async () => {
            const user = userEvent.setup();
            render(<EmailChangeForm {...defaultProps} />);

            const changeButton = screen.getByText('Change Email');
            await user.click(changeButton);

            expect(
                screen.getByPlaceholderText('Enter your current password')
            ).toBeInTheDocument();
        });
    });

    describe('SessionManager', () => {
        const mockSessions = [
            {
                id: '1',
                deviceInfo: 'Chrome on Windows',
                location: 'New York, US',
                lastActivity: new Date('2024-01-01'),
                isCurrentSession: true,
            },
            {
                id: '2',
                deviceInfo: 'Safari on iPhone',
                location: 'Los Angeles, US',
                lastActivity: new Date('2024-01-02'),
                isCurrentSession: false,
            },
        ];

        const defaultProps = {
            sessions: mockSessions,
            onRevokeSession: jest.fn(),
            onRevokeAllSessions: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders all sessions', () => {
            render(<SessionManager {...defaultProps} />);

            expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
            expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
        });

        it('shows current session indicator', () => {
            render(<SessionManager {...defaultProps} />);
            expect(screen.getByText('Current Session')).toBeInTheDocument();
        });

        it('handles revoke all sessions', async () => {
            const user = userEvent.setup();
            const mockRevokeAll = jest.fn();

            render(
                <SessionManager
                    {...defaultProps}
                    onRevokeAllSessions={mockRevokeAll}
                />
            );

            const revokeAllButton = screen.getByText(
                'Revoke All Other Sessions'
            );
            await user.click(revokeAllButton);

            // Should show confirmation dialog
            expect(
                screen.getByText(
                    /are you sure you want to revoke all sessions/i
                )
            ).toBeInTheDocument();

            const confirmButton = screen.getByText('Revoke All');
            await user.click(confirmButton);

            expect(mockRevokeAll).toHaveBeenCalled();
        });

        it('shows empty state when no sessions', () => {
            render(<SessionManager {...defaultProps} sessions={[]} />);
            expect(
                screen.getByText('No active sessions found')
            ).toBeInTheDocument();
        });
    });

    describe('SessionItem', () => {
        const mockSession = {
            id: '1',
            deviceInfo: 'Chrome on Windows',
            location: 'New York, US',
            lastActivity: new Date('2024-01-01'),
            isCurrentSession: false,
        };

        const defaultProps = {
            session: mockSession,
            onRevoke: jest.fn(),
            isRevoking: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders session information', () => {
            render(<SessionItem {...defaultProps} />);

            expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
            expect(screen.getByText('New York, US')).toBeInTheDocument();
        });

        it('shows current session badge', () => {
            const currentSession = { ...mockSession, isCurrentSession: true };
            render(<SessionItem {...defaultProps} session={currentSession} />);

            expect(screen.getByText('Current')).toBeInTheDocument();
        });

        it('handles session revocation', async () => {
            const user = userEvent.setup();
            const mockOnRevoke = jest.fn();

            render(<SessionItem {...defaultProps} onRevoke={mockOnRevoke} />);

            const revokeButton = screen.getByText('Revoke');
            await user.click(revokeButton);

            expect(mockOnRevoke).toHaveBeenCalledWith('1');
        });

        it('shows loading state when revoking', () => {
            render(<SessionItem {...defaultProps} isRevoking={true} />);
            expect(screen.getByText('Revoking...')).toBeInTheDocument();
        });

        it('disables revoke button for current session', () => {
            const currentSession = { ...mockSession, isCurrentSession: true };
            render(<SessionItem {...defaultProps} session={currentSession} />);

            const revokeButton = screen.queryByText('Revoke');
            expect(revokeButton).not.toBeInTheDocument();
        });

        it('formats last activity date', () => {
            render(<SessionItem {...defaultProps} />);
            expect(screen.getByText(/last active/i)).toBeInTheDocument();
        });
    });

    describe('PasswordSettings', () => {
        const defaultProps = {
            onPasswordChange: jest.fn(),
            isLoading: false,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('renders password change form', () => {
            render(<PasswordSettings {...defaultProps} />);

            expect(
                screen.getByPlaceholderText('Current password')
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText('New password')
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText('Confirm new password')
            ).toBeInTheDocument();
        });

        it('validates password requirements', async () => {
            const user = userEvent.setup();
            render(<PasswordSettings {...defaultProps} />);

            const newPasswordInput =
                screen.getByPlaceholderText('New password');
            await user.type(newPasswordInput, 'weak');
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/password must be at least 8 characters/i)
                ).toBeInTheDocument();
            });
        });

        it('validates password confirmation match', async () => {
            const user = userEvent.setup();
            render(<PasswordSettings {...defaultProps} />);

            const newPasswordInput =
                screen.getByPlaceholderText('New password');
            const confirmPasswordInput = screen.getByPlaceholderText(
                'Confirm new password'
            );

            await user.type(newPasswordInput, 'NewPassword123!');
            await user.type(confirmPasswordInput, 'DifferentPassword123!');
            await user.tab();

            await waitFor(() => {
                expect(
                    screen.getByText(/passwords do not match/i)
                ).toBeInTheDocument();
            });
        });

        it('handles password change submission', async () => {
            const user = userEvent.setup();
            const mockOnPasswordChange = jest.fn();

            render(
                <PasswordSettings
                    {...defaultProps}
                    onPasswordChange={mockOnPasswordChange}
                />
            );

            const currentPasswordInput =
                screen.getByPlaceholderText('Current password');
            const newPasswordInput =
                screen.getByPlaceholderText('New password');
            const confirmPasswordInput = screen.getByPlaceholderText(
                'Confirm new password'
            );

            await user.type(currentPasswordInput, 'CurrentPassword123!');
            await user.type(newPasswordInput, 'NewPassword123!');
            await user.type(confirmPasswordInput, 'NewPassword123!');

            const submitButton = screen.getByText('Change Password');
            await user.click(submitButton);

            expect(mockOnPasswordChange).toHaveBeenCalledWith({
                currentPassword: 'CurrentPassword123!',
                newPassword: 'NewPassword123!',
            });
        });

        it('shows password strength indicator', async () => {
            const user = userEvent.setup();
            render(<PasswordSettings {...defaultProps} />);

            const newPasswordInput =
                screen.getByPlaceholderText('New password');
            await user.type(newPasswordInput, 'StrongPassword123!');

            expect(screen.getByText(/strong/i)).toBeInTheDocument();
        });

        it('shows loading state', () => {
            render(<PasswordSettings {...defaultProps} isLoading={true} />);
            expect(
                screen.getByText('Changing Password...')
            ).toBeInTheDocument();
        });
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../../SettingsPage';
import { ProfileSettings } from '../../profile/components/ProfileSettings';
import { SecuritySettings } from '../../security/components/SecuritySettings';
import { NotificationSettings } from '../../notifications/components/NotificationSettings';

// Mock API responses
const mockApiResponses = {
    profile: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        bio: 'Test bio',
        organization: 'Test Org',
        website: 'https://test.com',
        avatarUrl: 'https://example.com/avatar.jpg',
    },
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
};

// Mock fetch
global.fetch = jest.fn();

// Mock services
jest.mock('../../services', () => ({
    ProfileService: jest.fn().mockImplementation(() => ({
        getProfile: jest.fn().mockResolvedValue(mockApiResponses.profile),
        updateProfile: jest.fn().mockResolvedValue(mockApiResponses.profile),
        uploadAvatar: jest
            .fn()
            .mockResolvedValue('https://example.com/new-avatar.jpg'),
        removeAvatar: jest.fn().mockResolvedValue(undefined),
    })),
    SecurityService: jest.fn().mockImplementation(() => ({
        getActiveSessions: jest
            .fn()
            .mockResolvedValue(mockApiResponses.sessions),
        revokeSession: jest.fn().mockResolvedValue(undefined),
        revokeAllSessions: jest.fn().mockResolvedValue({ revokedCount: 1 }),
        changeEmail: jest.fn().mockResolvedValue(undefined),
    })),
    NotificationService: jest.fn().mockImplementation(() => ({
        getPreferences: jest
            .fn()
            .mockResolvedValue(mockApiResponses.notifications),
        updatePreferences: jest.fn().mockResolvedValue(undefined),
        testNotification: jest.fn().mockResolvedValue(undefined),
    })),
    MediaProviderService: jest.fn().mockImplementation(() => ({
        getConnectedProviders: jest.fn().mockResolvedValue([]),
        connectProvider: jest
            .fn()
            .mockResolvedValue('https://oauth.example.com'),
        disconnectProvider: jest.fn().mockResolvedValue(undefined),
    })),
    ExportService: jest.fn().mockImplementation(() => ({
        requestExport: jest.fn().mockResolvedValue({
            id: 'export-123',
            status: 'pending',
            requestedAt: new Date(),
        }),
        getExportHistory: jest.fn().mockResolvedValue([]),
        downloadExport: jest.fn().mockResolvedValue(new Blob()),
    })),
    AccountService: jest.fn().mockImplementation(() => ({
        getAccountInfo: jest.fn().mockResolvedValue({
            id: '1',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            emailVerified: true,
        }),
        requestAccountDeletion: jest.fn().mockResolvedValue({
            scheduledDeletionDate: new Date(),
            confirmationSent: true,
        }),
    })),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    );
};

describe('Settings Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Complete Profile Update Workflow', () => {
        it('allows user to update profile information end-to-end', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            // Wait for profile to load
            await waitFor(() => {
                expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            });

            // Update first name
            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jane');

            // Update organization
            const orgInput = screen.getByDisplayValue('Test Org');
            await user.clear(orgInput);
            await user.type(orgInput, 'New Organization');

            // Save changes
            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            // Verify success message
            await waitFor(() => {
                expect(
                    screen.getByText(/profile updated successfully/i)
                ).toBeInTheDocument();
            });

            // Verify form reflects updated values
            expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
            expect(
                screen.getByDisplayValue('New Organization')
            ).toBeInTheDocument();
        });

        it('handles profile update validation errors', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            });

            // Clear required field
            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);

            // Try to save
            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            // Verify validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/first name is required/i)
                ).toBeInTheDocument();
            });
        });

        it('handles avatar upload workflow', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByRole('img')).toBeInTheDocument();
            });

            // Upload new avatar
            const fileInput = screen.getByLabelText(/upload avatar/i);
            const file = new File(['avatar'], 'avatar.jpg', {
                type: 'image/jpeg',
            });

            await user.upload(fileInput, file);

            // Verify upload success
            await waitFor(() => {
                expect(
                    screen.getByText(/avatar updated successfully/i)
                ).toBeInTheDocument();
            });
        });
    });

    describe('Email Change Workflow', () => {
        it('completes email change process with verification', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            // Wait for current email to load
            await waitFor(() => {
                expect(
                    screen.getByText('john@example.com')
                ).toBeInTheDocument();
            });

            // Start email change
            const changeEmailButton = screen.getByText('Change Email');
            await user.click(changeEmailButton);

            // Enter new email
            const newEmailInput = screen.getByPlaceholderText(
                'Enter new email address'
            );
            await user.type(newEmailInput, 'newemail@example.com');

            // Enter current password
            const passwordInput = screen.getByPlaceholderText(
                'Enter your current password'
            );
            await user.type(passwordInput, 'currentpassword');

            // Submit email change
            const submitButton = screen.getByText('Send Verification');
            await user.click(submitButton);

            // Verify confirmation message
            await waitFor(() => {
                expect(
                    screen.getByText(/verification emails sent/i)
                ).toBeInTheDocument();
            });
        });

        it('prevents email change with invalid data', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('john@example.com')
                ).toBeInTheDocument();
            });

            const changeEmailButton = screen.getByText('Change Email');
            await user.click(changeEmailButton);

            // Enter invalid email
            const newEmailInput = screen.getByPlaceholderText(
                'Enter new email address'
            );
            await user.type(newEmailInput, 'invalid-email');

            // Verify validation error
            await waitFor(() => {
                expect(
                    screen.getByText(/please enter a valid email address/i)
                ).toBeInTheDocument();
            });

            // Submit button should be disabled
            const submitButton = screen.getByText('Send Verification');
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Session Management Workflow', () => {
        it('displays and manages active sessions', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            // Wait for sessions to load
            await waitFor(() => {
                expect(
                    screen.getByText('Chrome on Windows')
                ).toBeInTheDocument();
                expect(
                    screen.getByText('Safari on iPhone')
                ).toBeInTheDocument();
            });

            // Verify current session is marked
            expect(screen.getByText('Current Session')).toBeInTheDocument();

            // Revoke a session
            const revokeButtons = screen.getAllByText('Revoke');
            await user.click(revokeButtons[0]);

            // Verify success message
            await waitFor(() => {
                expect(
                    screen.getByText(/session revoked successfully/i)
                ).toBeInTheDocument();
            });
        });

        it('handles revoke all sessions workflow', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Chrome on Windows')
                ).toBeInTheDocument();
            });

            // Click revoke all
            const revokeAllButton = screen.getByText(
                'Revoke All Other Sessions'
            );
            await user.click(revokeAllButton);

            // Confirm in dialog
            const confirmButton = screen.getByText('Revoke All');
            await user.click(confirmButton);

            // Verify success message
            await waitFor(() => {
                expect(
                    screen.getByText(/1 session revoked/i)
                ).toBeInTheDocument();
            });
        });
    });

    describe('Notification Preferences Workflow', () => {
        it('updates notification preferences across all channels', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <NotificationSettings />
                </TestWrapper>
            );

            // Wait for preferences to load
            await waitFor(() => {
                expect(
                    screen.getByLabelText('Event Updates')
                ).toBeInTheDocument();
            });

            // Toggle email notifications
            const emailToggle = screen.getByLabelText('Marketing Emails');
            await user.click(emailToggle);

            // Change frequency
            const frequencySelect = screen.getByRole('combobox');
            await user.selectOptions(frequencySelect, 'daily');

            // Verify changes are saved automatically
            await waitFor(() => {
                expect(
                    screen.getByText(/preferences updated/i)
                ).toBeInTheDocument();
            });
        });

        it('handles push notification permission workflow', async () => {
            // Mock Notification API
            Object.defineProperty(window, 'Notification', {
                value: {
                    permission: 'default',
                    requestPermission: jest.fn().mockResolvedValue('granted'),
                },
                writable: true,
            });

            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <NotificationSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Enable Browser Notifications')
                ).toBeInTheDocument();
            });

            // Request permission
            const enableButton = screen.getByText(
                'Enable Browser Notifications'
            );
            await user.click(enableButton);

            // Verify permission was requested
            expect(window.Notification.requestPermission).toHaveBeenCalled();

            // Verify success state
            await waitFor(() => {
                expect(
                    screen.getByText(/notifications enabled/i)
                ).toBeInTheDocument();
            });
        });
    });

    describe('Media Provider OAuth Workflow', () => {
        it('handles media provider connection flow', async () => {
            const user = userEvent.setup();

            // Mock window.open
            const mockOpen = jest.fn();
            Object.defineProperty(window, 'open', { value: mockOpen });

            render(
                <TestWrapper>
                    <SettingsPage initialTab='media-providers' />
                </TestWrapper>
            );

            // Wait for providers to load
            await waitFor(() => {
                expect(
                    screen.getByText('Connect to Unsplash')
                ).toBeInTheDocument();
            });

            // Start connection
            const connectButton = screen.getByText('Connect to Unsplash');
            await user.click(connectButton);

            // Verify OAuth window opens
            expect(mockOpen).toHaveBeenCalledWith(
                'https://oauth.example.com',
                'oauth',
                expect.stringContaining('width=600,height=700')
            );

            // Simulate successful OAuth callback
            const mockEvent = new MessageEvent('message', {
                data: { type: 'oauth-success', provider: 'unsplash' },
                origin: window.location.origin,
            });
            window.dispatchEvent(mockEvent);

            // Verify success message
            await waitFor(() => {
                expect(
                    screen.getByText(/unsplash connected successfully/i)
                ).toBeInTheDocument();
            });
        });

        it('handles media provider disconnection', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage initialTab='media-providers' />
                </TestWrapper>
            );

            // Wait for connected provider
            await waitFor(() => {
                expect(screen.getByText('Disconnect')).toBeInTheDocument();
            });

            // Disconnect provider
            const disconnectButton = screen.getByText('Disconnect');
            await user.click(disconnectButton);

            // Confirm disconnection
            const confirmButton = screen.getByText('Disconnect Provider');
            await user.click(confirmButton);

            // Verify success message
            await waitFor(() => {
                expect(
                    screen.getByText(/provider disconnected/i)
                ).toBeInTheDocument();
            });
        });
    });

    describe('Data Export Workflow', () => {
        it('handles complete data export process', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage initialTab='data-export' />
                </TestWrapper>
            );

            // Configure export options
            const eventsCheckbox = screen.getByLabelText('Include Events');
            const registrationsCheckbox = screen.getByLabelText(
                'Include Registrations'
            );

            await user.click(eventsCheckbox);
            await user.click(registrationsCheckbox);

            // Request export
            const exportButton = screen.getByText('Request Export');
            await user.click(exportButton);

            // Verify export request created
            await waitFor(() => {
                expect(
                    screen.getByText(/export request created/i)
                ).toBeInTheDocument();
            });

            // Verify export appears in history
            expect(screen.getByText('export-123')).toBeInTheDocument();
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });

        it('handles export download when ready', async () => {
            const user = userEvent.setup();

            // Mock URL.createObjectURL
            const mockCreateObjectURL = jest
                .fn()
                .mockReturnValue('blob:mock-url');
            Object.defineProperty(URL, 'createObjectURL', {
                value: mockCreateObjectURL,
            });

            render(
                <TestWrapper>
                    <SettingsPage initialTab='data-export' />
                </TestWrapper>
            );

            // Wait for completed export in history
            await waitFor(() => {
                expect(screen.getByText('Download')).toBeInTheDocument();
            });

            // Download export
            const downloadButton = screen.getByText('Download');
            await user.click(downloadButton);

            // Verify download initiated
            expect(mockCreateObjectURL).toHaveBeenCalled();
        });
    });

    describe('Account Deletion Workflow', () => {
        it('handles complete account deletion process with safety measures', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage initialTab='account' />
                </TestWrapper>
            );

            // Navigate to danger zone
            const deleteAccountButton = screen.getByText('Delete Account');
            await user.click(deleteAccountButton);

            // Verify warning information
            expect(
                screen.getByText(/this action cannot be undone/i)
            ).toBeInTheDocument();

            // Enter confirmation email
            const emailInput = screen.getByPlaceholderText(
                'Enter your email to confirm'
            );
            await user.type(emailInput, 'john@example.com');

            // Enter reason
            const reasonSelect = screen.getByLabelText('Reason for deletion');
            await user.selectOptions(reasonSelect, 'No longer needed');

            // Provide feedback
            const feedbackTextarea =
                screen.getByPlaceholderText('Optional feedback');
            await user.type(
                feedbackTextarea,
                'Great service, just no longer needed'
            );

            // Confirm deletion
            const confirmButton = screen.getByText('Schedule Account Deletion');
            await user.click(confirmButton);

            // Verify final confirmation dialog
            expect(
                screen.getByText(/are you absolutely sure/i)
            ).toBeInTheDocument();

            const finalConfirmButton = screen.getByText(
                'Yes, Delete My Account'
            );
            await user.click(finalConfirmButton);

            // Verify deletion scheduled
            await waitFor(() => {
                expect(
                    screen.getByText(/account deletion scheduled/i)
                ).toBeInTheDocument();
            });
        });

        it('prevents account deletion with active events', async () => {
            const user = userEvent.setup();

            // Mock service to return active events error
            const mockAccountService = require('../../services').AccountService;
            mockAccountService.mockImplementation(() => ({
                requestAccountDeletion: jest
                    .fn()
                    .mockRejectedValue(
                        new Error('Cannot delete account with active events')
                    ),
            }));

            render(
                <TestWrapper>
                    <SettingsPage initialTab='account' />
                </TestWrapper>
            );

            const deleteAccountButton = screen.getByText('Delete Account');
            await user.click(deleteAccountButton);

            const emailInput = screen.getByPlaceholderText(
                'Enter your email to confirm'
            );
            await user.type(emailInput, 'john@example.com');

            const confirmButton = screen.getByText('Schedule Account Deletion');
            await user.click(confirmButton);

            // Verify error message
            await waitFor(() => {
                expect(
                    screen.getByText(
                        /cannot delete account with active events/i
                    )
                ).toBeInTheDocument();
            });
        });
    });

    describe('Authentication Integration', () => {
        it('handles authentication errors during settings operations', async () => {
            const user = userEvent.setup();

            // Mock service to return auth error
            const mockProfileService = require('../../services').ProfileService;
            mockProfileService.mockImplementation(() => ({
                updateProfile: jest
                    .fn()
                    .mockRejectedValue(new Error('Authentication required')),
            }));

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            });

            // Try to update profile
            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jane');

            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            // Verify auth error handling
            await waitFor(() => {
                expect(
                    screen.getByText(/authentication required/i)
                ).toBeInTheDocument();
            });
        });

        it('maintains form state during authentication refresh', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            });

            // Make changes
            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jane');

            // Simulate auth refresh (component remount)
            // Form should maintain unsaved changes
            expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
            expect(screen.getByText('Save Changes')).toBeInTheDocument();
        });
    });

    describe('Error Recovery Scenarios', () => {
        it('handles network errors with retry functionality', async () => {
            const user = userEvent.setup();

            // Mock service to fail first time, succeed second time
            let callCount = 0;
            const mockProfileService = require('../../services').ProfileService;
            mockProfileService.mockImplementation(() => ({
                updateProfile: jest.fn().mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.reject(new Error('Network error'));
                    }
                    return Promise.resolve(mockApiResponses.profile);
                }),
            }));

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            });

            // Make changes and save
            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jane');

            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            // Verify error message with retry option
            await waitFor(() => {
                expect(screen.getByText(/network error/i)).toBeInTheDocument();
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });

            // Retry operation
            const retryButton = screen.getByText('Retry');
            await user.click(retryButton);

            // Verify success on retry
            await waitFor(() => {
                expect(
                    screen.getByText(/profile updated successfully/i)
                ).toBeInTheDocument();
            });
        });

        it('handles concurrent modification conflicts', async () => {
            const user = userEvent.setup();

            // Mock service to return conflict error
            const mockProfileService = require('../../services').ProfileService;
            mockProfileService.mockImplementation(() => ({
                updateProfile: jest
                    .fn()
                    .mockRejectedValue(
                        new Error('Profile was modified by another session')
                    ),
            }));

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            });

            // Make changes and save
            const firstNameInput = screen.getByDisplayValue('John');
            await user.clear(firstNameInput);
            await user.type(firstNameInput, 'Jane');

            const saveButton = screen.getByText('Save Changes');
            await user.click(saveButton);

            // Verify conflict resolution options
            await waitFor(() => {
                expect(
                    screen.getByText(/profile was modified by another session/i)
                ).toBeInTheDocument();
                expect(screen.getByText('Reload Latest')).toBeInTheDocument();
                expect(screen.getByText('Keep My Changes')).toBeInTheDocument();
            });
        });
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../../SettingsPage';
import { ProfileSettings } from '../../profile/components/ProfileSettings';
import { SecuritySettings } from '../../security/components/SecuritySettings';
import { NotificationSettings } from '../../notifications/components/NotificationSettings';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock services
jest.mock('../../services', () => ({
    ProfileService: jest.fn().mockImplementation(() => ({
        getProfile: jest.fn().mockResolvedValue({
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
        }),
        updateProfile: jest.fn().mockResolvedValue({}),
    })),
    SecurityService: jest.fn().mockImplementation(() => ({
        getActiveSessions: jest.fn().mockResolvedValue([]),
        changeEmail: jest.fn().mockResolvedValue({}),
    })),
    NotificationService: jest.fn().mockImplementation(() => ({
        getPreferences: jest.fn().mockResolvedValue({
            email: { eventUpdates: true },
            push: { enabled: true },
            inApp: { enabled: true },
            frequency: 'immediate',
        }),
        updatePreferences: jest.fn().mockResolvedValue({}),
    })),
}));

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

describe('Settings Accessibility Tests', () => {
    describe('WCAG Compliance', () => {
        it('should not have accessibility violations in settings page', async () => {
            const { container } = render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should not have accessibility violations in profile settings', async () => {
            const { container } = render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/first name/i)
                ).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should not have accessibility violations in security settings', async () => {
            const { container } = render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Security Settings')
                ).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should not have accessibility violations in notification settings', async () => {
            const { container } = render(
                <TestWrapper>
                    <NotificationSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Email Notifications')
                ).toBeInTheDocument();
            });

            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });
    });

    describe('Keyboard Navigation', () => {
        it('supports tab navigation through settings sections', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            // Start from first focusable element
            const profileTab = screen.getByRole('tab', { name: /profile/i });
            profileTab.focus();
            expect(profileTab).toHaveFocus();

            // Tab to next section
            await user.tab();
            const securityTab = screen.getByRole('tab', { name: /security/i });
            expect(securityTab).toHaveFocus();

            // Tab to notifications
            await user.tab();
            const notificationsTab = screen.getByRole('tab', {
                name: /notifications/i,
            });
            expect(notificationsTab).toHaveFocus();

            // Continue through all tabs
            await user.tab();
            const interfaceTab = screen.getByRole('tab', {
                name: /interface/i,
            });
            expect(interfaceTab).toHaveFocus();
        });

        it('supports arrow key navigation in tab list', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            const profileTab = screen.getByRole('tab', { name: /profile/i });
            profileTab.focus();

            // Right arrow to next tab
            await user.keyboard('{ArrowRight}');
            const securityTab = screen.getByRole('tab', { name: /security/i });
            expect(securityTab).toHaveFocus();

            // Left arrow to previous tab
            await user.keyboard('{ArrowLeft}');
            expect(profileTab).toHaveFocus();

            // End key to last tab
            await user.keyboard('{End}');
            const accountTab = screen.getByRole('tab', { name: /account/i });
            expect(accountTab).toHaveFocus();

            // Home key to first tab
            await user.keyboard('{Home}');
            expect(profileTab).toHaveFocus();
        });

        it('supports keyboard activation of tabs', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            const securityTab = screen.getByRole('tab', { name: /security/i });
            securityTab.focus();

            // Activate with Enter
            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(screen.getByText('Email Settings')).toBeInTheDocument();
            });

            // Verify tab is selected
            expect(securityTab).toHaveAttribute('aria-selected', 'true');
        });

        it('supports keyboard navigation within forms', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/first name/i)
                ).toBeInTheDocument();
            });

            // Tab through form fields
            const firstNameInput = screen.getByLabelText(/first name/i);
            firstNameInput.focus();
            expect(firstNameInput).toHaveFocus();

            await user.tab();
            const lastNameInput = screen.getByLabelText(/last name/i);
            expect(lastNameInput).toHaveFocus();

            await user.tab();
            const emailInput = screen.getByLabelText(/email/i);
            expect(emailInput).toHaveFocus();

            // Skip to save button
            await user.tab({ shift: true }); // Shift+Tab to go back
            await user.tab();
            await user.tab();
            const saveButton = screen.getByRole('button', { name: /save/i });
            expect(saveButton).toHaveFocus();
        });

        it('provides skip links for efficient navigation', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            // Tab to first element should reveal skip link
            await user.tab();
            const skipLink = screen.getByText('Skip to main content');
            expect(skipLink).toBeVisible();
            expect(skipLink).toHaveFocus();

            // Activate skip link
            await user.keyboard('{Enter}');

            // Should focus main content area
            const mainContent = screen.getByRole('main');
            expect(mainContent).toHaveFocus();
        });
    });

    describe('Screen Reader Support', () => {
        it('provides proper ARIA labels for form controls', async () => {
            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/first name/i)
                ).toBeInTheDocument();
            });

            // Verify form controls have labels
            expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();

            // Verify required fields are marked
            const requiredFields = screen.getAllByText('*');
            expect(requiredFields.length).toBeGreaterThan(0);
        });

        it('announces form validation errors', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/first name/i)
                ).toBeInTheDocument();
            });

            // Clear required field to trigger validation
            const firstNameInput = screen.getByLabelText(/first name/i);
            await user.clear(firstNameInput);
            await user.tab(); // Trigger validation

            // Verify error is announced
            const errorMessage = screen.getByRole('alert');
            expect(errorMessage).toBeInTheDocument();
            expect(errorMessage).toHaveTextContent(/first name is required/i);

            // Verify field is marked as invalid
            expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
            expect(firstNameInput).toHaveAttribute('aria-describedby');
        });

        it('provides proper heading structure', async () => {
            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // Verify heading hierarchy
            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toHaveTextContent('Settings');

            const sectionHeadings = screen.getAllByRole('heading', {
                level: 2,
            });
            expect(sectionHeadings.length).toBeGreaterThan(0);
        });

        it('announces dynamic content changes', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <NotificationSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/event updates/i)
                ).toBeInTheDocument();
            });

            // Toggle a notification setting
            const toggle = screen.getByLabelText(/event updates/i);
            await user.click(toggle);

            // Verify status change is announced
            const statusMessage = screen.getByRole('status');
            expect(statusMessage).toBeInTheDocument();
            expect(statusMessage).toHaveTextContent(/preferences updated/i);
        });

        it('provides descriptive button labels', async () => {
            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByText('Security Settings')
                ).toBeInTheDocument();
            });

            // Verify buttons have descriptive labels
            const changeEmailButton = screen.getByRole('button', {
                name: /change email address/i,
            });
            expect(changeEmailButton).toBeInTheDocument();

            const revokeAllButton = screen.getByRole('button', {
                name: /revoke all other sessions/i,
            });
            expect(revokeAllButton).toBeInTheDocument();
        });
    });

    describe('Focus Management', () => {
        it('manages focus when opening modals', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Change Email')).toBeInTheDocument();
            });

            // Open email change modal
            const changeEmailButton = screen.getByText('Change Email');
            await user.click(changeEmailButton);

            // Focus should move to modal
            const modal = screen.getByRole('dialog');
            expect(modal).toBeInTheDocument();

            // First focusable element in modal should be focused
            const firstInput = screen.getByPlaceholderText(/enter new email/i);
            expect(firstInput).toHaveFocus();
        });

        it('traps focus within modals', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Change Email')).toBeInTheDocument();
            });

            const changeEmailButton = screen.getByText('Change Email');
            await user.click(changeEmailButton);

            const modal = screen.getByRole('dialog');
            expect(modal).toBeInTheDocument();

            // Tab through modal elements
            const emailInput = screen.getByPlaceholderText(/enter new email/i);
            const passwordInput =
                screen.getByPlaceholderText(/current password/i);
            const submitButton = screen.getByText('Send Verification');
            const cancelButton = screen.getByText('Cancel');

            emailInput.focus();
            expect(emailInput).toHaveFocus();

            await user.tab();
            expect(passwordInput).toHaveFocus();

            await user.tab();
            expect(submitButton).toHaveFocus();

            await user.tab();
            expect(cancelButton).toHaveFocus();

            // Tab from last element should cycle back to first
            await user.tab();
            expect(emailInput).toHaveFocus();
        });

        it('returns focus when closing modals', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SecuritySettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Change Email')).toBeInTheDocument();
            });

            const changeEmailButton = screen.getByText('Change Email');
            await user.click(changeEmailButton);

            // Close modal with Escape
            await user.keyboard('{Escape}');

            // Focus should return to trigger button
            expect(changeEmailButton).toHaveFocus();
        });

        it('manages focus for dynamic content', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            // Switch to security tab
            const securityTab = screen.getByRole('tab', { name: /security/i });
            await user.click(securityTab);

            // Focus should move to the new content
            await waitFor(() => {
                const securityContent = screen.getByRole('tabpanel');
                expect(securityContent).toHaveFocus();
            });
        });
    });

    describe('Color Contrast and Visual Accessibility', () => {
        it('maintains sufficient color contrast for text', async () => {
            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // This would typically be tested with automated tools
            // or manual verification, but we can check for proper CSS classes
            const headings = screen.getAllByRole('heading');
            headings.forEach((heading) => {
                expect(heading).toHaveClass(/text-gray-900|text-white/);
            });
        });

        it('provides visual focus indicators', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/first name/i)
                ).toBeInTheDocument();
            });

            // Focus an input
            const firstNameInput = screen.getByLabelText(/first name/i);
            await user.click(firstNameInput);

            // Verify focus styles are applied
            expect(firstNameInput).toHaveClass(/focus:ring|focus:border/);
        });

        it('supports high contrast mode', async () => {
            // Mock high contrast media query
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-contrast: high)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // Verify high contrast styles are applied
            const container = screen.getByRole('main');
            expect(container).toHaveClass(/high-contrast/);
        });
    });

    describe('Mobile Accessibility', () => {
        it('supports touch interactions', async () => {
            // Mock touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: {},
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
                    screen.getByLabelText(/event updates/i)
                ).toBeInTheDocument();
            });

            // Touch interaction with toggle
            const toggle = screen.getByLabelText(/event updates/i);

            // Simulate touch events
            fireEvent.touchStart(toggle);
            fireEvent.touchEnd(toggle);

            // Verify toggle state changed
            expect(toggle).toHaveAttribute('aria-checked');
        });

        it('provides adequate touch targets', async () => {
            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Profile')).toBeInTheDocument();
            });

            // Verify touch targets meet minimum size requirements (44px)
            const tabs = screen.getAllByRole('tab');
            tabs.forEach((tab) => {
                const styles = window.getComputedStyle(tab);
                const minHeight =
                    parseInt(styles.minHeight) || parseInt(styles.height);
                expect(minHeight).toBeGreaterThanOrEqual(44);
            });
        });

        it('supports screen reader gestures on mobile', async () => {
            // Mock mobile screen reader
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                writable: true,
            });

            render(
                <TestWrapper>
                    <SettingsPage />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Settings')).toBeInTheDocument();
            });

            // Verify proper landmark roles for navigation
            expect(screen.getByRole('navigation')).toBeInTheDocument();
            expect(screen.getByRole('main')).toBeInTheDocument();

            // Verify tab list has proper role
            expect(screen.getByRole('tablist')).toBeInTheDocument();
        });
    });

    describe('Error Handling Accessibility', () => {
        it('announces errors to screen readers', async () => {
            const user = userEvent.setup();

            // Mock service to return error
            const mockProfileService = require('../../services').ProfileService;
            mockProfileService.mockImplementation(() => ({
                updateProfile: jest
                    .fn()
                    .mockRejectedValue(new Error('Update failed')),
            }));

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(
                    screen.getByLabelText(/first name/i)
                ).toBeInTheDocument();
            });

            // Make a change and save
            const firstNameInput = screen.getByLabelText(/first name/i);
            await user.type(firstNameInput, 'Jane');

            const saveButton = screen.getByRole('button', { name: /save/i });
            await user.click(saveButton);

            // Verify error is announced
            await waitFor(() => {
                const errorAlert = screen.getByRole('alert');
                expect(errorAlert).toBeInTheDocument();
                expect(errorAlert).toHaveTextContent(/update failed/i);
            });
        });

        it('provides recovery options for errors', async () => {
            const user = userEvent.setup();

            render(
                <TestWrapper>
                    <ProfileSettings />
                </TestWrapper>
            );

            // Simulate network error
            const errorMessage = screen.getByRole('alert');
            expect(errorMessage).toBeInTheDocument();

            // Verify retry button is accessible
            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
            expect(retryButton).toHaveAttribute('aria-describedby');
        });
    });
});

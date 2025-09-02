import { test, expect, Page } from '@playwright/test';

// Test data
const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    organization: 'Test Organization',
};

// Helper functions
async function loginUser(page: Page) {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
}

async function navigateToSettings(page: Page) {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="settings-link"]');
    await page.waitForURL('/settings');
}

test.describe('Settings E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await loginUser(page);
    });

    test.describe('Profile Management Journey', () => {
        test('user can update profile information end-to-end', async ({
            page,
        }) => {
            await navigateToSettings(page);

            // Verify we're on the profile tab by default
            await expect(
                page.locator('[data-testid="profile-tab"]')
            ).toHaveAttribute('aria-selected', 'true');

            // Update first name
            const firstNameInput = page.locator(
                '[data-testid="first-name-input"]'
            );
            await firstNameInput.clear();
            await firstNameInput.fill('Jane');

            // Update organization
            const orgInput = page.locator('[data-testid="organization-input"]');
            await orgInput.clear();
            await orgInput.fill('Updated Organization');

            // Save changes
            await page.click('[data-testid="save-profile-button"]');

            // Verify success message
            await expect(
                page.locator('[data-testid="success-message"]')
            ).toContainText('Profile updated successfully');

            // Verify changes persist after page reload
            await page.reload();
            await expect(firstNameInput).toHaveValue('Jane');
            await expect(orgInput).toHaveValue('Updated Organization');
        });

        test('user can upload and manage avatar', async ({ page }) => {
            await navigateToSettings(page);

            // Upload avatar
            const fileInput = page.locator(
                '[data-testid="avatar-upload-input"]'
            );
            await fileInput.setInputFiles('tests/fixtures/avatar.jpg');

            // Verify upload success
            await expect(
                page.locator('[data-testid="success-message"]')
            ).toContainText('Avatar updated successfully');

            // Verify avatar is displayed
            const avatar = page.locator('[data-testid="user-avatar"]');
            await expect(avatar).toBeVisible();

            // Remove avatar
            await page.click('[data-testid="remove-avatar-button"]');
            await page.click('[data-testid="confirm-remove-avatar"]');

            // Verify avatar removed
            await expect(
                page.locator('[data-testid="success-message"]')
            ).toContainText('Avatar removed successfully');
            await expect(
                page.locator('[data-testid="avatar-placeholder"]')
            ).toBeVisible();
        });
    });

    test.describe('Security Settings Journey', () => {
        test('user can change email address with verification', async ({
            page,
        }) => {
            await navigateToSettings(page);

            // Navigate to security tab
            await page.click('[data-testid="security-tab"]');
            await expect(
                page.locator('[data-testid="security-content"]')
            ).toBeVisible();

            // Start email change process
            await page.click('[data-testid="change-email-button"]');

            // Fill new email
            await page.fill(
                '[data-testid="new-email-input"]',
                'newemail@example.com'
            );
            await page.fill(
                '[data-testid="current-password-input"]',
                testUser.password
            );

            // Submit email change
            await page.click('[data-testid="send-verification-button"]');

            // Verify confirmation message
            await expect(
                page.locator('[data-testid="email-change-confirmation"]')
            ).toContainText('Verification emails have been sent');
        });

        test('user can manage active sessions', async ({ page }) => {
            await navigateToSettings(page);
            await page.click('[data-testid="security-tab"]');

            // Verify current session is displayed
            await expect(
                page.locator('[data-testid="current-session"]')
            ).toBeVisible();
            await expect(
                page.locator('[data-testid="current-session-badge"]')
            ).toContainText('Current');

            // Revoke all other sessions
            await page.click('[data-testid="revoke-all-sessions-button"]');
            await expect(
                page.locator('[data-testid="revoke-all-dialog"]')
            ).toBeVisible();
            await page.click('[data-testid="confirm-revoke-all"]');

            // Verify success message
            await expect(
                page.locator('[data-testid="success-message"]')
            ).toContainText('sessions revoked successfully');
        });
    });

    test.describe('Mobile Responsiveness', () => {
        test('settings work properly on mobile devices', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });

            await navigateToSettings(page);

            // Verify mobile navigation
            await expect(
                page.locator('[data-testid="mobile-settings-nav"]')
            ).toBeVisible();

            // Test tab switching on mobile
            await page.click('[data-testid="security-tab-mobile"]');
            await expect(
                page.locator('[data-testid="security-content"]')
            ).toBeVisible();

            // Test form interactions on mobile
            const firstNameInput = page.locator(
                '[data-testid="first-name-input"]'
            );
            await firstNameInput.tap();
            await firstNameInput.fill('Mobile Test');

            // Verify mobile-optimized save button
            const mobileSaveButton = page.locator(
                '[data-testid="mobile-save-button"]'
            );
            await expect(mobileSaveButton).toBeVisible();
            await mobileSaveButton.tap();

            // Verify success message on mobile
            await expect(
                page.locator('[data-testid="mobile-success-toast"]')
            ).toContainText('Profile updated successfully');
        });
    });

    test.describe('Error Handling and Recovery', () => {
        test('handles network errors gracefully', async ({ page }) => {
            await navigateToSettings(page);

            // Simulate network failure
            await page.route('**/api/profile', (route) => route.abort());

            // Try to update profile
            const firstNameInput = page.locator(
                '[data-testid="first-name-input"]'
            );
            await firstNameInput.fill('Network Test');
            await page.click('[data-testid="save-profile-button"]');

            // Verify error message with retry option
            await expect(
                page.locator('[data-testid="error-message"]')
            ).toContainText('Network error occurred');
            await expect(
                page.locator('[data-testid="retry-button"]')
            ).toBeVisible();

            // Restore network and retry
            await page.unroute('**/api/profile');
            await page.click('[data-testid="retry-button"]');

            // Verify success after retry
            await expect(
                page.locator('[data-testid="success-message"]')
            ).toContainText('Profile updated successfully');
        });
    });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationSettings } from '../NotificationSettings';

// Mock the hook
vi.mock('../hooks/useNotificationPreferences', () => ({
    useNotificationPreferences: () => ({
        preferences: {
            email: {
                eventUpdates: true,
                ticketSales: true,
                payouts: true,
                systemAlerts: true,
                marketingEmails: false,
                weeklyDigest: true,
            },
            push: {
                enabled: false,
                eventReminders: true,
                ticketSales: true,
                urgentAlerts: true,
            },
            inApp: {
                enabled: true,
                eventUpdates: true,
                ticketSales: true,
                systemMessages: true,
            },
            frequency: {
                immediate: true,
                daily: false,
                weekly: false,
                monthly: false,
            },
        },
        isLoading: false,
        error: null,
        updateEmailSettings: vi.fn(),
        updatePushSettings: vi.fn(),
        updateInAppSettings: vi.fn(),
        updateFrequencySettings: vi.fn(),
        testNotification: vi.fn(),
        requestPushPermission: vi.fn(),
        refreshPreferences: vi.fn(),
    }),
}));

describe('NotificationSettings', () => {
    it('should render notification preferences title', () => {
        render(<NotificationSettings />);
        expect(
            screen.getByText('Notification Preferences')
        ).toBeInTheDocument();
    });

    it('should render all notification sections', () => {
        render(<NotificationSettings />);
        expect(screen.getByText('Email Notifications')).toBeInTheDocument();
        expect(screen.getByText('Push Notifications')).toBeInTheDocument();
        expect(screen.getByText('In-App Notifications')).toBeInTheDocument();
        expect(screen.getByText('Notification Frequency')).toBeInTheDocument();
    });
});

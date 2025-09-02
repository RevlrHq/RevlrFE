import type {
    NotificationPreferences,
    EmailNotificationSettings,
    PushNotificationSettings,
    InAppNotificationSettings,
    NotificationFrequencySettings,
} from '../types';

/**
 * Validation utilities for notification preferences
 */

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate email notification settings
 */
export const validateEmailSettings = (
    settings: EmailNotificationSettings
): ValidationResult => {
    const errors: string[] = [];

    // System alerts must always be enabled for security
    if (!settings.systemAlerts) {
        errors.push('System alerts cannot be disabled for security reasons');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate push notification settings
 */
export const validatePushSettings = (
    settings: PushNotificationSettings
): ValidationResult => {
    const errors: string[] = [];

    // If push is enabled, at least one notification type should be enabled
    if (settings.enabled) {
        const hasEnabledType =
            settings.eventReminders ||
            settings.ticketSales ||
            settings.urgentAlerts;

        if (!hasEnabledType) {
            errors.push('At least one push notification type must be enabled');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate in-app notification settings
 */
export const validateInAppSettings = (
    settings: InAppNotificationSettings
): ValidationResult => {
    const errors: string[] = [];

    // If in-app is enabled, at least one notification type should be enabled
    if (settings.enabled) {
        const hasEnabledType =
            settings.eventUpdates ||
            settings.ticketSales ||
            settings.systemMessages;

        if (!hasEnabledType) {
            errors.push(
                'At least one in-app notification type must be enabled'
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate frequency settings
 */
export const validateFrequencySettings = (
    settings: NotificationFrequencySettings
): ValidationResult => {
    const errors: string[] = [];

    // Exactly one frequency option should be selected
    const selectedOptions = [
        settings.immediate,
        settings.daily,
        settings.weekly,
        settings.monthly,
    ].filter(Boolean);

    if (selectedOptions.length === 0) {
        errors.push('At least one notification frequency must be selected');
    } else if (selectedOptions.length > 1) {
        errors.push('Only one notification frequency can be selected');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate complete notification preferences
 */
export const validateNotificationPreferences = (
    preferences: NotificationPreferences
): ValidationResult => {
    const errors: string[] = [];

    // Validate each section
    const emailValidation = validateEmailSettings(preferences.email);
    const pushValidation = validatePushSettings(preferences.push);
    const inAppValidation = validateInAppSettings(preferences.inApp);
    const frequencyValidation = validateFrequencySettings(
        preferences.frequency
    );

    errors.push(...emailValidation.errors);
    errors.push(...pushValidation.errors);
    errors.push(...inAppValidation.errors);
    errors.push(...frequencyValidation.errors);

    // At least one notification channel should be enabled
    const hasEnabledChannel =
        preferences.email.eventUpdates ||
        preferences.email.ticketSales ||
        preferences.email.payouts ||
        preferences.push.enabled ||
        preferences.inApp.enabled;

    if (!hasEnabledChannel) {
        errors.push('At least one notification channel must be enabled');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Get default notification preferences
 */
export const getDefaultNotificationPreferences =
    (): NotificationPreferences => {
        return {
            email: {
                eventUpdates: true,
                ticketSales: true,
                payouts: true,
                systemAlerts: true, // Always enabled
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
        };
    };

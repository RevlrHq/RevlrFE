// Settings navigation constants
export const SETTINGS_TABS = {
    PROFILE: 'profile',
    SECURITY: 'security',
    NOTIFICATIONS: 'notifications',
    INTERFACE: 'interface',
    MEDIA_PROVIDERS: 'media-providers',
    DATA_EXPORT: 'data-export',
    BILLING: 'billing',
    ACCOUNT: 'account',
} as const;

// Auto-save configuration
export const AUTO_SAVE_DELAY = 2000; // 2 seconds
export const AUTO_SAVE_RETRY_ATTEMPTS = 3;

// Validation constants
export const VALIDATION_LIMITS = {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    BIO_MAX_LENGTH: 500,
    PHONE_MIN_DIGITS: 10,
    PHONE_MAX_DIGITS: 15,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
} as const;

// Theme options
export const THEME_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
] as const;

// Date format options
export const DATE_FORMAT_OPTIONS = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
] as const;

// Time format options
export const TIME_FORMAT_OPTIONS = [
    { value: '12h', label: '12 Hour' },
    { value: '24h', label: '24 Hour' },
] as const;

// Notification frequency options
export const NOTIFICATION_FREQUENCY_OPTIONS = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Summary' },
] as const;

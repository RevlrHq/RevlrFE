/**
 * Notification settings types and interfaces
 */

export interface NotificationPreferences {
    email: EmailNotificationSettings;
    push: PushNotificationSettings;
    inApp: InAppNotificationSettings;
    frequency: NotificationFrequencySettings;
}

export interface EmailNotificationSettings {
    eventUpdates: boolean;
    ticketSales: boolean;
    payouts: boolean;
    systemAlerts: boolean;
    marketingEmails: boolean;
    weeklyDigest: boolean;
}

export interface PushNotificationSettings {
    eventReminders: boolean;
    ticketSales: boolean;
    urgentAlerts: boolean;
    enabled: boolean;
}

export interface InAppNotificationSettings {
    eventUpdates: boolean;
    ticketSales: boolean;
    systemMessages: boolean;
    enabled: boolean;
}

export interface NotificationFrequencySettings {
    immediate: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
}

export type NotificationChannel = 'email' | 'push' | 'inApp';
export type NotificationType =
    | 'eventUpdates'
    | 'ticketSales'
    | 'payouts'
    | 'systemAlerts'
    | 'marketingEmails'
    | 'weeklyDigest'
    | 'eventReminders'
    | 'urgentAlerts'
    | 'systemMessages';

export interface NotificationToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export interface EmailNotificationsProps {
    settings: EmailNotificationSettings;
    onChange: (settings: EmailNotificationSettings) => void;
}

export interface PushNotificationsProps {
    settings: PushNotificationSettings;
    onChange: (settings: PushNotificationSettings) => void;
    onRequestPermission: () => Promise<boolean>;
}

export interface InAppNotificationsProps {
    settings: InAppNotificationSettings;
    onChange: (settings: InAppNotificationSettings) => void;
}

export interface NotificationFrequencyProps {
    settings: NotificationFrequencySettings;
    onChange: (settings: NotificationFrequencySettings) => void;
}

export interface NotificationUpdateRequest {
    preferences: Partial<NotificationPreferences>;
    userId: string;
}

export interface NotificationTestRequest {
    channel: NotificationChannel;
    type: NotificationType;
    userId: string;
}

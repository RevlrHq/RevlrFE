import React from 'react';
import { SettingsCard } from '../shared/components/SettingsCard';
import { EmailNotifications } from './components/EmailNotifications';
import { PushNotifications } from './components/PushNotifications';
import { InAppNotifications } from './components/InAppNotifications';
import { NotificationFrequency } from './components/NotificationFrequency';
import { useNotificationPreferences } from './hooks/useNotificationPreferences';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';
import { ErrorMessage } from '../shared/components/ErrorMessage';

interface NotificationSettingsProps {
    className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    className = '',
}) => {
    const {
        preferences,
        isLoading,
        error,
        updateEmailSettings,
        updatePushSettings,
        updateInAppSettings,
        updateFrequencySettings,
        requestPushPermission,
    } = useNotificationPreferences();

    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`space-y-6 ${className}`}>
                <ErrorMessage message={error} />
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className={`space-y-6 ${className}`}>
                <ErrorMessage message='Failed to load notification preferences' />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            <div className='space-y-1'>
                <h2 className='text-2xl font-semibold text-gray-900'>
                    Notification Preferences
                </h2>
                <p className='text-sm text-gray-600'>
                    Control how and when you receive notifications about your
                    events and account activity.
                </p>
            </div>

            <SettingsCard
                title='Email Notifications'
                description="Configure which email notifications you'd like to receive"
            >
                <EmailNotifications
                    settings={preferences.email}
                    onChange={updateEmailSettings}
                />
            </SettingsCard>

            <SettingsCard
                title='Push Notifications'
                description='Manage push notifications for mobile and desktop'
            >
                <PushNotifications
                    settings={preferences.push}
                    onChange={updatePushSettings}
                    onRequestPermission={requestPushPermission}
                />
            </SettingsCard>

            <SettingsCard
                title='In-App Notifications'
                description='Control notifications that appear within the application'
            >
                <InAppNotifications
                    settings={preferences.inApp}
                    onChange={updateInAppSettings}
                />
            </SettingsCard>

            <SettingsCard
                title='Notification Frequency'
                description='Choose how often you receive notification summaries'
            >
                <NotificationFrequency
                    settings={preferences.frequency}
                    onChange={updateFrequencySettings}
                />
            </SettingsCard>
        </div>
    );
};

// Default export for lazy loading
export default NotificationSettings;

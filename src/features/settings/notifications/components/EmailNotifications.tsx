import React from 'react';
import { NotificationToggle } from './NotificationToggle';
import type { EmailNotificationsProps } from '../types';

export const EmailNotifications: React.FC<EmailNotificationsProps> = ({
    settings,
    onChange,
}) => {
    const handleToggle = (key: keyof typeof settings) => (checked: boolean) => {
        onChange({
            ...settings,
            [key]: checked,
        });
    };

    return (
        <div className='space-y-4'>
            <NotificationToggle
                label='Event Updates'
                description='Receive notifications when your events are updated or when attendees register'
                checked={settings.eventUpdates}
                onChange={handleToggle('eventUpdates')}
            />

            <NotificationToggle
                label='Ticket Sales'
                description='Get notified when tickets are purchased for your events'
                checked={settings.ticketSales}
                onChange={handleToggle('ticketSales')}
            />

            <NotificationToggle
                label='Payouts'
                description='Receive notifications about payment processing and payouts'
                checked={settings.payouts}
                onChange={handleToggle('payouts')}
            />

            <NotificationToggle
                label='System Alerts'
                description='Important system notifications and security alerts (always enabled)'
                checked={settings.systemAlerts}
                onChange={handleToggle('systemAlerts')}
                disabled={true}
            />

            <NotificationToggle
                label='Marketing Emails'
                description='Receive updates about new features, tips, and promotional content'
                checked={settings.marketingEmails}
                onChange={handleToggle('marketingEmails')}
            />

            <NotificationToggle
                label='Weekly Digest'
                description='Get a weekly summary of your event performance and activities'
                checked={settings.weeklyDigest}
                onChange={handleToggle('weeklyDigest')}
            />

            <div className='mt-4 rounded-lg bg-blue-50 p-3'>
                <p className='text-sm text-blue-800'>
                    <strong>Note:</strong> Critical security notifications will
                    always be sent regardless of your preferences.
                </p>
            </div>
        </div>
    );
};

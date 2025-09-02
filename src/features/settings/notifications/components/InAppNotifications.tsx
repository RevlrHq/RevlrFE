import React from 'react';
import { NotificationToggle } from './NotificationToggle';
import type { InAppNotificationsProps } from '../types';

export const InAppNotifications: React.FC<InAppNotificationsProps> = ({
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
                label='Enable In-App Notifications'
                description='Show notifications within the application interface'
                checked={settings.enabled}
                onChange={handleToggle('enabled')}
            />

            {settings.enabled && (
                <>
                    <div className='ml-6 space-y-4 border-l-2 border-gray-200 pl-4'>
                        <NotificationToggle
                            label='Event Updates'
                            description='Show notifications when your events are updated or modified'
                            checked={settings.eventUpdates}
                            onChange={handleToggle('eventUpdates')}
                        />

                        <NotificationToggle
                            label='Ticket Sales'
                            description='Display notifications when tickets are purchased'
                            checked={settings.ticketSales}
                            onChange={handleToggle('ticketSales')}
                        />

                        <NotificationToggle
                            label='System Messages'
                            description='Show important system announcements and updates'
                            checked={settings.systemMessages}
                            onChange={handleToggle('systemMessages')}
                        />
                    </div>

                    <div className='mt-4 rounded-lg bg-blue-50 p-3'>
                        <p className='text-sm text-blue-800'>
                            In-app notifications appear as toast messages and in
                            the notification center.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

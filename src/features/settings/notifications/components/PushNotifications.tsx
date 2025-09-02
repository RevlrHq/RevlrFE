import React, { useState } from 'react';
import { NotificationToggle } from './NotificationToggle';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import type { PushNotificationsProps } from '../types';

export const PushNotifications: React.FC<PushNotificationsProps> = ({
    settings,
    onChange,
    onRequestPermission,
}) => {
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);

    const handleToggle = (key: keyof typeof settings) => (checked: boolean) => {
        onChange({
            ...settings,
            [key]: checked,
        });
    };

    const handleRequestPermission = async () => {
        setIsRequestingPermission(true);
        try {
            const granted = await onRequestPermission();
            if (granted) {
                onChange({
                    ...settings,
                    enabled: true,
                });
            }
        } catch (error) {
            console.error(
                'Failed to request push notification permission:',
                error
            );
        } finally {
            setIsRequestingPermission(false);
        }
    };

    const isPushSupported =
        'Notification' in window && 'serviceWorker' in navigator;

    if (!isPushSupported) {
        return (
            <div className='space-y-4'>
                <div className='flex items-center space-x-3 rounded-lg bg-gray-50 p-4'>
                    <BellOff className='size-5 text-gray-400' />
                    <div>
                        <p className='text-sm font-medium text-gray-900'>
                            Push notifications not supported
                        </p>
                        <p className='text-sm text-gray-600'>
                            Your browser doesn't support push notifications.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div>
                    <h4 className='text-sm font-medium text-gray-900'>
                        Enable Push Notifications
                    </h4>
                    <p className='text-sm text-gray-600'>
                        Allow notifications to be sent to your device
                    </p>
                </div>
                {!settings.enabled && (
                    <Button
                        onClick={handleRequestPermission}
                        disabled={isRequestingPermission}
                        size='sm'
                        className='flex items-center space-x-2'
                    >
                        <Bell className='size-4' />
                        <span>
                            {isRequestingPermission
                                ? 'Requesting...'
                                : 'Enable'}
                        </span>
                    </Button>
                )}
            </div>

            {settings.enabled && (
                <>
                    <NotificationToggle
                        label='Event Reminders'
                        description="Get reminded about upcoming events you're organizing"
                        checked={settings.eventReminders}
                        onChange={handleToggle('eventReminders')}
                    />

                    <NotificationToggle
                        label='Ticket Sales'
                        description='Instant notifications when tickets are purchased'
                        checked={settings.ticketSales}
                        onChange={handleToggle('ticketSales')}
                    />

                    <NotificationToggle
                        label='Urgent Alerts'
                        description='Critical notifications that require immediate attention'
                        checked={settings.urgentAlerts}
                        onChange={handleToggle('urgentAlerts')}
                    />

                    <div className='mt-4 rounded-lg bg-green-50 p-3'>
                        <p className='text-sm text-green-800'>
                            <strong>Push notifications enabled.</strong> You can
                            disable them anytime in your browser settings.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

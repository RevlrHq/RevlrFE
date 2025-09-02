import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { NotificationPreview } from './NotificationPreview';
import { TestTube, RefreshCw } from 'lucide-react';
import type { NotificationChannel, NotificationType } from '../types';

interface NotificationTesterProps {
    onTest: (
        channel: NotificationChannel,
        type: NotificationType
    ) => Promise<boolean>;
    className?: string;
}

export const NotificationTester: React.FC<NotificationTesterProps> = ({
    onTest,
    className = '',
}) => {
    const [selectedChannel, setSelectedChannel] =
        useState<NotificationChannel>('email');
    const [selectedType, setSelectedType] =
        useState<NotificationType>('eventUpdates');
    const [isTestingAll, setIsTestingAll] = useState(false);

    const channels: { value: NotificationChannel; label: string }[] = [
        { value: 'email', label: 'Email' },
        { value: 'push', label: 'Push Notification' },
        { value: 'inApp', label: 'In-App Notification' },
    ];

    const notificationTypes: { value: NotificationType; label: string }[] = [
        { value: 'eventUpdates', label: 'Event Updates' },
        { value: 'ticketSales', label: 'Ticket Sales' },
        { value: 'payouts', label: 'Payouts' },
        { value: 'systemAlerts', label: 'System Alerts' },
        { value: 'marketingEmails', label: 'Marketing Emails' },
        { value: 'weeklyDigest', label: 'Weekly Digest' },
        { value: 'eventReminders', label: 'Event Reminders' },
        { value: 'urgentAlerts', label: 'Urgent Alerts' },
        { value: 'systemMessages', label: 'System Messages' },
    ];

    const handleTestAll = async () => {
        setIsTestingAll(true);

        try {
            // Test all channels for the selected notification type
            const promises = channels.map((channel) =>
                onTest(channel.value, selectedType)
            );

            await Promise.all(promises);
        } catch (error) {
            console.error('Failed to test all notifications:', error);
        } finally {
            setIsTestingAll(false);
        }
    };

    return (
        <Card className={`space-y-6 p-6 ${className}`}>
            <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                    <TestTube className='size-5 text-blue-600' />
                    <h3 className='text-lg font-semibold text-gray-900'>
                        Notification Tester
                    </h3>
                </div>
                <p className='text-sm text-gray-600'>
                    Test your notification settings to see how they'll appear to
                    you.
                </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>
                        Notification Channel
                    </label>
                    <Select
                        value={selectedChannel}
                        onValueChange={(value: NotificationChannel) =>
                            setSelectedChannel(value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {channels.map((channel) => (
                                <SelectItem
                                    key={channel.value}
                                    value={channel.value}
                                >
                                    {channel.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-700'>
                        Notification Type
                    </label>
                    <Select
                        value={selectedType}
                        onValueChange={(value: NotificationType) =>
                            setSelectedType(value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {notificationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <h4 className='text-sm font-medium text-gray-900'>
                        Preview
                    </h4>
                    <Button
                        onClick={handleTestAll}
                        disabled={isTestingAll}
                        size='sm'
                        variant='outline'
                        className='flex items-center space-x-2'
                    >
                        <RefreshCw
                            className={`size-4 ${isTestingAll ? 'animate-spin' : ''}`}
                        />
                        <span>
                            {isTestingAll
                                ? 'Testing All...'
                                : 'Test All Channels'}
                        </span>
                    </Button>
                </div>

                <NotificationPreview
                    channel={selectedChannel}
                    type={selectedType}
                    onTest={onTest}
                />
            </div>

            <div className='rounded-lg bg-blue-50 p-4'>
                <p className='text-sm text-blue-800'>
                    <strong>Note:</strong> Test notifications are sent to your
                    registered email and devices. They won't affect your actual
                    notification history or analytics.
                </p>
            </div>
        </Card>
    );
};

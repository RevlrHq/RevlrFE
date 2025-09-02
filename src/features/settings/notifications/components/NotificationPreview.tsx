import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Mail,
    Smartphone,
    Monitor,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import type { NotificationChannel, NotificationType } from '../types';

interface NotificationPreviewProps {
    channel: NotificationChannel;
    type: NotificationType;
    onTest?: (
        channel: NotificationChannel,
        type: NotificationType
    ) => Promise<boolean>;
}

export const NotificationPreview: React.FC<NotificationPreviewProps> = ({
    channel,
    type,
    onTest,
}) => {
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(
        null
    );

    const getChannelIcon = () => {
        switch (channel) {
            case 'email':
                return <Mail className='size-4' />;
            case 'push':
                return <Smartphone className='size-4' />;
            case 'inApp':
                return <Monitor className='size-4' />;
        }
    };

    const getChannelName = () => {
        switch (channel) {
            case 'email':
                return 'Email';
            case 'push':
                return 'Push';
            case 'inApp':
                return 'In-App';
        }
    };

    const getNotificationContent = () => {
        const baseContent = {
            eventUpdates: {
                title: 'Event Updated',
                message: 'Your event "Summer Music Festival" has been updated.',
            },
            ticketSales: {
                title: 'New Ticket Sale',
                message: 'Someone just purchased 2 tickets for your event.',
            },
            payouts: {
                title: 'Payout Processed',
                message: 'Your payout of $250.00 has been processed.',
            },
            systemAlerts: {
                title: 'Security Alert',
                message: 'New login detected from a different device.',
            },
            marketingEmails: {
                title: 'New Feature Available',
                message: 'Check out our new analytics dashboard!',
            },
            weeklyDigest: {
                title: 'Weekly Summary',
                message: 'Your events had 45 new registrations this week.',
            },
            eventReminders: {
                title: 'Event Reminder',
                message: 'Your event starts in 2 hours.',
            },
            urgentAlerts: {
                title: 'Urgent: Action Required',
                message:
                    'Payment method failed. Please update your billing information.',
            },
            systemMessages: {
                title: 'System Maintenance',
                message: 'Scheduled maintenance will occur tonight at 2 AM.',
            },
        };

        return baseContent[type] || baseContent.eventUpdates;
    };

    const handleTest = async () => {
        if (!onTest) return;

        setIsTesting(true);
        setTestResult(null);

        try {
            const success = await onTest(channel, type);
            setTestResult(success ? 'success' : 'error');
        } catch (error) {
            setTestResult('error');
        } finally {
            setIsTesting(false);
        }
    };

    const content = getNotificationContent();

    return (
        <Card className='space-y-3 p-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                    {getChannelIcon()}
                    <span className='text-sm font-medium'>
                        {getChannelName()} Preview
                    </span>
                    <Badge variant='outline' className='text-xs'>
                        {type}
                    </Badge>
                </div>
                {onTest && (
                    <Button
                        onClick={handleTest}
                        disabled={isTesting}
                        size='sm'
                        variant='outline'
                        className='flex items-center space-x-1'
                    >
                        <Bell className='size-3' />
                        <span>{isTesting ? 'Testing...' : 'Test'}</span>
                    </Button>
                )}
            </div>

            <div className='space-y-2 rounded-lg bg-gray-50 p-3'>
                <div className='text-sm font-medium text-gray-900'>
                    {content.title}
                </div>
                <div className='text-sm text-gray-600'>{content.message}</div>
                <div className='text-xs text-gray-500'>Just now • Revlr</div>
            </div>

            {testResult && (
                <div
                    className={`flex items-center space-x-2 text-sm ${
                        testResult === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                    }`}
                >
                    {testResult === 'success' ? (
                        <CheckCircle className='size-4' />
                    ) : (
                        <XCircle className='size-4' />
                    )}
                    <span>
                        {testResult === 'success'
                            ? 'Test notification sent successfully!'
                            : 'Failed to send test notification.'}
                    </span>
                </div>
            )}
        </Card>
    );
};

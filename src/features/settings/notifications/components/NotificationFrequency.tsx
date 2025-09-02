import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { NotificationFrequencyProps } from '../types';

export const NotificationFrequency: React.FC<NotificationFrequencyProps> = ({
    settings,
    onChange,
}) => {
    const getSelectedFrequency = (): string => {
        if (settings.immediate) return 'immediate';
        if (settings.daily) return 'daily';
        if (settings.weekly) return 'weekly';
        if (settings.monthly) return 'monthly';
        return 'immediate';
    };

    const handleFrequencyChange = (value: string) => {
        const newSettings = {
            immediate: false,
            daily: false,
            weekly: false,
            monthly: false,
        };

        switch (value) {
            case 'immediate':
                newSettings.immediate = true;
                break;
            case 'daily':
                newSettings.daily = true;
                break;
            case 'weekly':
                newSettings.weekly = true;
                break;
            case 'monthly':
                newSettings.monthly = true;
                break;
        }

        onChange(newSettings);
    };

    return (
        <div className='space-y-4'>
            <div>
                <h4 className='mb-2 text-sm font-medium text-gray-900'>
                    Notification Frequency
                </h4>
                <p className='mb-4 text-sm text-gray-600'>
                    Choose how often you receive notification summaries for
                    non-urgent updates.
                </p>
            </div>

            <RadioGroup
                value={getSelectedFrequency()}
                onValueChange={handleFrequencyChange}
                className='space-y-3'
            >
                <div className='flex items-center space-x-3'>
                    <RadioGroupItem value='immediate' id='immediate' />
                    <Label
                        htmlFor='immediate'
                        className='flex-1 cursor-pointer'
                    >
                        <div>
                            <div className='font-medium'>Immediate</div>
                            <div className='text-sm text-gray-600'>
                                Receive notifications as they happen
                            </div>
                        </div>
                    </Label>
                </div>

                <div className='flex items-center space-x-3'>
                    <RadioGroupItem value='daily' id='daily' />
                    <Label htmlFor='daily' className='flex-1 cursor-pointer'>
                        <div>
                            <div className='font-medium'>Daily Digest</div>
                            <div className='text-sm text-gray-600'>
                                Get a summary of notifications once per day
                            </div>
                        </div>
                    </Label>
                </div>

                <div className='flex items-center space-x-3'>
                    <RadioGroupItem value='weekly' id='weekly' />
                    <Label htmlFor='weekly' className='flex-1 cursor-pointer'>
                        <div>
                            <div className='font-medium'>Weekly Summary</div>
                            <div className='text-sm text-gray-600'>
                                Receive a weekly roundup of all notifications
                            </div>
                        </div>
                    </Label>
                </div>

                <div className='flex items-center space-x-3'>
                    <RadioGroupItem value='monthly' id='monthly' />
                    <Label htmlFor='monthly' className='flex-1 cursor-pointer'>
                        <div>
                            <div className='font-medium'>Monthly Report</div>
                            <div className='text-sm text-gray-600'>
                                Get a comprehensive monthly summary
                            </div>
                        </div>
                    </Label>
                </div>
            </RadioGroup>

            <div className='mt-4 rounded-lg bg-yellow-50 p-3'>
                <p className='text-sm text-yellow-800'>
                    <strong>Note:</strong> Urgent notifications and security
                    alerts are always sent immediately, regardless of this
                    setting.
                </p>
            </div>
        </div>
    );
};

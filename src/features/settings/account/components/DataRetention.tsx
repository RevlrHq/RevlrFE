'use client';

import React, { useState } from 'react';
import { SettingsCard } from '../../shared/components/SettingsCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DataRetentionSettings } from '../types';

export function DataRetention() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState<DataRetentionSettings>({
        retainEventData: true,
        retainAnalytics: true,
        retainMediaFiles: false,
        retentionPeriodDays: 365,
        autoDeleteAfterInactivity: false,
        inactivityPeriodDays: 730,
    });

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // TODO: Implement API call to save data retention settings
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast({
                title: 'Settings saved',
                description:
                    'Your data retention preferences have been updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    'Failed to save data retention settings. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateSetting = <K extends keyof DataRetentionSettings>(
        key: K,
        value: DataRetentionSettings[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <SettingsCard
            title='Data Retention'
            description='Configure how long your data is kept after account deletion'
        >
            <div className='space-y-6'>
                <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                    <div className='flex items-start space-x-2'>
                        <Info className='mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400' />
                        <div className='text-sm text-blue-800 dark:text-blue-200'>
                            <p className='mb-1 font-medium'>
                                Data Retention Policy
                            </p>
                            <p>
                                These settings control what happens to your data
                                if you delete your account. Some data may be
                                retained for legal or business purposes
                                regardless of these settings.
                            </p>
                        </div>
                    </div>
                </div>

                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                            <Label htmlFor='retain-events'>
                                Retain Event Data
                            </Label>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Keep event information for historical records
                            </p>
                        </div>
                        <Switch
                            id='retain-events'
                            checked={settings.retainEventData}
                            onCheckedChange={(checked) =>
                                updateSetting('retainEventData', checked)
                            }
                        />
                    </div>

                    <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                            <Label htmlFor='retain-analytics'>
                                Retain Analytics Data
                            </Label>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Keep anonymized analytics for platform
                                improvement
                            </p>
                        </div>
                        <Switch
                            id='retain-analytics'
                            checked={settings.retainAnalytics}
                            onCheckedChange={(checked) =>
                                updateSetting('retainAnalytics', checked)
                            }
                        />
                    </div>

                    <div className='flex items-center justify-between'>
                        <div className='space-y-1'>
                            <Label htmlFor='retain-media'>
                                Retain Media Files
                            </Label>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Keep uploaded images and media files
                            </p>
                        </div>
                        <Switch
                            id='retain-media'
                            checked={settings.retainMediaFiles}
                            onCheckedChange={(checked) =>
                                updateSetting('retainMediaFiles', checked)
                            }
                        />
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                        <Label htmlFor='retention-period'>
                            Data Retention Period (days)
                        </Label>
                        <Input
                            id='retention-period'
                            type='number'
                            min='30'
                            max='2555'
                            value={settings.retentionPeriodDays}
                            onChange={(e) =>
                                updateSetting(
                                    'retentionPeriodDays',
                                    parseInt(e.target.value) || 365
                                )
                            }
                        />
                        <p className='text-xs text-gray-600 dark:text-gray-400'>
                            How long to keep data after account deletion
                            (30-2555 days)
                        </p>
                    </div>

                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <Label htmlFor='auto-delete'>
                                Auto-delete after inactivity
                            </Label>
                            <Switch
                                id='auto-delete'
                                checked={settings.autoDeleteAfterInactivity}
                                onCheckedChange={(checked) =>
                                    updateSetting(
                                        'autoDeleteAfterInactivity',
                                        checked
                                    )
                                }
                            />
                        </div>
                        {settings.autoDeleteAfterInactivity && (
                            <div className='space-y-2'>
                                <Input
                                    type='number'
                                    min='365'
                                    max='2555'
                                    value={settings.inactivityPeriodDays}
                                    onChange={(e) =>
                                        updateSetting(
                                            'inactivityPeriodDays',
                                            parseInt(e.target.value) || 730
                                        )
                                    }
                                />
                                <p className='text-xs text-gray-600 dark:text-gray-400'>
                                    Days of inactivity before auto-deletion
                                    (365-2555 days)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex justify-end pt-4'>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className='flex items-center space-x-2'
                    >
                        <Save className='h-4 w-4' />
                        <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
                    </Button>
                </div>
            </div>
        </SettingsCard>
    );
}

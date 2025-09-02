import React from 'react';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock, Calendar, Bell } from 'lucide-react';

interface FrequencySettings {
    digestEnabled: boolean;
    digestTime: string; // HH:MM format
    digestDays: string[]; // Days of week for weekly digest
    quietHoursEnabled: boolean;
    quietHoursStart: string; // HH:MM format
    quietHoursEnd: string; // HH:MM format
}

interface FrequencyConfigurationProps {
    settings: FrequencySettings;
    onChange: (settings: FrequencySettings) => void;
    className?: string;
}

export const FrequencyConfiguration: React.FC<FrequencyConfigurationProps> = ({
    settings,
    onChange,
    className = '',
}) => {
    const timeOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return { value: `${hour}:00`, label: `${hour}:00` };
    });

    const daysOfWeek = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' },
    ];

    const handleToggle =
        (key: keyof FrequencySettings) => (checked: boolean) => {
            onChange({
                ...settings,
                [key]: checked,
            });
        };

    const handleTimeChange =
        (key: keyof FrequencySettings) => (value: string) => {
            onChange({
                ...settings,
                [key]: value,
            });
        };

    const handleDayToggle = (day: string) => (checked: boolean) => {
        const newDays = checked
            ? [...settings.digestDays, day]
            : settings.digestDays.filter((d) => d !== day);

        onChange({
            ...settings,
            digestDays: newDays,
        });
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Digest Settings */}
            <Card className='space-y-4 p-4'>
                <div className='flex items-center space-x-2'>
                    <Calendar className='size-5 text-blue-600' />
                    <h3 className='text-lg font-semibold text-gray-900'>
                        Digest Settings
                    </h3>
                </div>

                <div className='flex items-center justify-between'>
                    <div>
                        <Label className='text-sm font-medium text-gray-900'>
                            Enable Daily Digest
                        </Label>
                        <p className='text-sm text-gray-600'>
                            Receive a summary of notifications at a specific
                            time
                        </p>
                    </div>
                    <Switch
                        checked={settings.digestEnabled}
                        onCheckedChange={handleToggle('digestEnabled')}
                    />
                </div>

                {settings.digestEnabled && (
                    <div className='ml-4 space-y-4 border-l-2 border-gray-200 pl-4'>
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-700'>
                                Digest Time
                            </Label>
                            <Select
                                value={settings.digestTime}
                                onValueChange={handleTimeChange('digestTime')}
                            >
                                <SelectTrigger className='w-32'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptions.map((time) => (
                                        <SelectItem
                                            key={time.value}
                                            value={time.value}
                                        >
                                            {time.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-700'>
                                Weekly Digest Days
                            </Label>
                            <div className='grid grid-cols-2 gap-2'>
                                {daysOfWeek.map((day) => (
                                    <div
                                        key={day.value}
                                        className='flex items-center space-x-2'
                                    >
                                        <Switch
                                            id={day.value}
                                            checked={settings.digestDays.includes(
                                                day.value
                                            )}
                                            onCheckedChange={handleDayToggle(
                                                day.value
                                            )}
                                        />
                                        <Label
                                            htmlFor={day.value}
                                            className='cursor-pointer text-sm'
                                        >
                                            {day.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Quiet Hours */}
            <Card className='space-y-4 p-4'>
                <div className='flex items-center space-x-2'>
                    <Bell className='size-5 text-purple-600' />
                    <h3 className='text-lg font-semibold text-gray-900'>
                        Quiet Hours
                    </h3>
                </div>

                <div className='flex items-center justify-between'>
                    <div>
                        <Label className='text-sm font-medium text-gray-900'>
                            Enable Quiet Hours
                        </Label>
                        <p className='text-sm text-gray-600'>
                            Suppress non-urgent notifications during specific
                            hours
                        </p>
                    </div>
                    <Switch
                        checked={settings.quietHoursEnabled}
                        onCheckedChange={handleToggle('quietHoursEnabled')}
                    />
                </div>

                {settings.quietHoursEnabled && (
                    <div className='ml-4 space-y-4 border-l-2 border-gray-200 pl-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label className='text-sm font-medium text-gray-700'>
                                    Start Time
                                </Label>
                                <Select
                                    value={settings.quietHoursStart}
                                    onValueChange={handleTimeChange(
                                        'quietHoursStart'
                                    )}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeOptions.map((time) => (
                                            <SelectItem
                                                key={time.value}
                                                value={time.value}
                                            >
                                                {time.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-sm font-medium text-gray-700'>
                                    End Time
                                </Label>
                                <Select
                                    value={settings.quietHoursEnd}
                                    onValueChange={handleTimeChange(
                                        'quietHoursEnd'
                                    )}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {timeOptions.map((time) => (
                                            <SelectItem
                                                key={time.value}
                                                value={time.value}
                                            >
                                                {time.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className='rounded-lg bg-purple-50 p-3'>
                            <p className='text-sm text-purple-800'>
                                During quiet hours, only urgent notifications
                                (security alerts, payment failures) will be
                                delivered immediately.
                            </p>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

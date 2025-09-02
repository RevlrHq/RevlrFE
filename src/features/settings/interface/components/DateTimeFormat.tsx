'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { DateTimeFormatProps, DateFormat, TimeFormat } from '../types';

export function DateTimeFormat({ settings, onChange }: DateTimeFormatProps) {
    const handleChange = (field: keyof typeof settings, value: string) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    const dateFormats = [
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/31/2024' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '31/12/2024' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-31' },
    ] as const;

    const timeFormats = [
        { value: '12h', label: '12-hour', example: '2:30 PM' },
        { value: '24h', label: '24-hour', example: '14:30' },
    ] as const;

    const weekStartOptions = [
        { value: 'sunday', label: 'Sunday' },
        { value: 'monday', label: 'Monday' },
    ] as const;

    return (
        <div className='space-y-6'>
            {/* Date Format */}
            <div>
                <Label className='text-sm font-medium'>Date Format</Label>
                <RadioGroup
                    value={settings.dateFormat}
                    onValueChange={(value) =>
                        handleChange('dateFormat', value as DateFormat)
                    }
                    className='mt-2'
                >
                    <div className='space-y-2'>
                        {dateFormats.map((format) => (
                            <div
                                key={format.value}
                                className='flex items-center space-x-2'
                            >
                                <RadioGroupItem
                                    value={format.value}
                                    id={`date-${format.value}`}
                                />
                                <Label
                                    htmlFor={`date-${format.value}`}
                                    className='flex flex-1 cursor-pointer items-center justify-between'
                                >
                                    <span>{format.label}</span>
                                    <span className='text-sm text-muted-foreground'>
                                        {format.example}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            {/* Time Format */}
            <div>
                <Label className='text-sm font-medium'>Time Format</Label>
                <RadioGroup
                    value={settings.timeFormat}
                    onValueChange={(value) =>
                        handleChange('timeFormat', value as TimeFormat)
                    }
                    className='mt-2'
                >
                    <div className='space-y-2'>
                        {timeFormats.map((format) => (
                            <div
                                key={format.value}
                                className='flex items-center space-x-2'
                            >
                                <RadioGroupItem
                                    value={format.value}
                                    id={`time-${format.value}`}
                                />
                                <Label
                                    htmlFor={`time-${format.value}`}
                                    className='flex flex-1 cursor-pointer items-center justify-between'
                                >
                                    <span>{format.label}</span>
                                    <span className='text-sm text-muted-foreground'>
                                        {format.example}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            {/* First Day of Week */}
            <div>
                <Label className='text-sm font-medium'>First Day of Week</Label>
                <RadioGroup
                    value={settings.firstDayOfWeek}
                    onValueChange={(value) =>
                        handleChange('firstDayOfWeek', value)
                    }
                    className='mt-2'
                >
                    <div className='space-y-2'>
                        {weekStartOptions.map((option) => (
                            <div
                                key={option.value}
                                className='flex items-center space-x-2'
                            >
                                <RadioGroupItem
                                    value={option.value}
                                    id={`week-${option.value}`}
                                />
                                <Label
                                    htmlFor={`week-${option.value}`}
                                    className='cursor-pointer'
                                >
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>
        </div>
    );
}

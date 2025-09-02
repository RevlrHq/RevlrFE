'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { LanguageSelectorProps } from '../types';

export function LanguageSelector({
    settings,
    onChange,
    availableLocales,
}: LanguageSelectorProps) {
    const handleChange = (field: keyof typeof settings, value: string) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    const currencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    ];

    const timezones = [
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
        { value: 'Europe/Paris', label: 'Central European Time (CET)' },
        { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
        { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
    ];

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                {/* Language Selection */}
                <div className='space-y-2'>
                    <Label htmlFor='language'>Language</Label>
                    <Select
                        value={settings.locale}
                        onValueChange={(value) => handleChange('locale', value)}
                    >
                        <SelectTrigger id='language'>
                            <SelectValue placeholder='Select language' />
                        </SelectTrigger>
                        <SelectContent>
                            {availableLocales.map((locale) => (
                                <SelectItem
                                    key={locale.code}
                                    value={locale.code}
                                >
                                    <div className='flex items-center space-x-2'>
                                        <span>{locale.name}</span>
                                        <span className='text-sm text-muted-foreground'>
                                            ({locale.nativeName})
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Currency Selection */}
                <div className='space-y-2'>
                    <Label htmlFor='currency'>Currency</Label>
                    <Select
                        value={settings.currency}
                        onValueChange={(value) =>
                            handleChange('currency', value)
                        }
                    >
                        <SelectTrigger id='currency'>
                            <SelectValue placeholder='Select currency' />
                        </SelectTrigger>
                        <SelectContent>
                            {currencies.map((currency) => (
                                <SelectItem
                                    key={currency.code}
                                    value={currency.code}
                                >
                                    <div className='flex items-center space-x-2'>
                                        <span>{currency.symbol}</span>
                                        <span>{currency.name}</span>
                                        <span className='text-sm text-muted-foreground'>
                                            ({currency.code})
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Timezone Selection */}
            <div className='space-y-2'>
                <Label htmlFor='timezone'>Timezone</Label>
                <Select
                    value={settings.timezone}
                    onValueChange={(value) => handleChange('timezone', value)}
                >
                    <SelectTrigger id='timezone'>
                        <SelectValue placeholder='Select timezone' />
                    </SelectTrigger>
                    <SelectContent>
                        {timezones.map((timezone) => (
                            <SelectItem
                                key={timezone.value}
                                value={timezone.value}
                            >
                                {timezone.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

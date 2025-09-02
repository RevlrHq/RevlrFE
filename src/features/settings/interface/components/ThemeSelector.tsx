'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ThemeSelectorProps, ThemeMode } from '../types';

export function ThemeSelector({
    currentTheme,
    onChange,
    availableThemes,
}: ThemeSelectorProps) {
    const handleModeChange = (mode: ThemeMode) => {
        onChange({
            ...currentTheme,
            mode,
        });
    };

    const handleColorChange = (
        field: 'primaryColor' | 'accentColor',
        value: string
    ) => {
        onChange({
            ...currentTheme,
            [field]: value,
        });
    };

    const themeOptions = [
        {
            value: 'light',
            label: 'Light',
            description: 'Clean and bright interface',
        },
        {
            value: 'dark',
            label: 'Dark',
            description: 'Easy on the eyes in low light',
        },
        {
            value: 'system',
            label: 'System',
            description: 'Follow your device settings',
        },
    ] as const;

    const colorOptions = [
        { value: '#3b82f6', label: 'Blue', color: 'bg-blue-500' },
        { value: '#10b981', label: 'Green', color: 'bg-green-500' },
        { value: '#f59e0b', label: 'Amber', color: 'bg-amber-500' },
        { value: '#ef4444', label: 'Red', color: 'bg-red-500' },
        { value: '#8b5cf6', label: 'Purple', color: 'bg-purple-500' },
        { value: '#06b6d4', label: 'Cyan', color: 'bg-cyan-500' },
    ];

    return (
        <div className='space-y-6'>
            {/* Theme Mode Selection */}
            <div>
                <Label className='text-sm font-medium'>Theme Mode</Label>
                <RadioGroup
                    value={currentTheme.mode}
                    onValueChange={handleModeChange}
                    className='mt-2'
                >
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                        {themeOptions.map((option) => (
                            <div key={option.value} className='relative'>
                                <RadioGroupItem
                                    value={option.value}
                                    id={option.value}
                                    className='peer sr-only'
                                />
                                <Label
                                    htmlFor={option.value}
                                    className={cn(
                                        'flex cursor-pointer flex-col rounded-lg border-2 p-4 hover:bg-accent',
                                        'peer-checked:border-primary peer-checked:bg-primary/5'
                                    )}
                                >
                                    <span className='font-medium'>
                                        {option.label}
                                    </span>
                                    <span className='text-sm text-muted-foreground'>
                                        {option.description}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            {/* Primary Color Selection */}
            <div>
                <Label className='text-sm font-medium'>Primary Color</Label>
                <div className='mt-2 grid grid-cols-6 gap-2'>
                    {colorOptions.map((color) => (
                        <button
                            key={color.value}
                            type='button'
                            onClick={() =>
                                handleColorChange('primaryColor', color.value)
                            }
                            className={cn(
                                'h-8 w-8 rounded-full border-2 border-transparent',
                                color.color,
                                currentTheme.primaryColor === color.value &&
                                    'border-gray-900 dark:border-gray-100'
                            )}
                            title={color.label}
                        />
                    ))}
                </div>
            </div>

            {/* Accent Color Selection */}
            <div>
                <Label className='text-sm font-medium'>Accent Color</Label>
                <div className='mt-2 grid grid-cols-6 gap-2'>
                    {colorOptions.map((color) => (
                        <button
                            key={color.value}
                            type='button'
                            onClick={() =>
                                handleColorChange('accentColor', color.value)
                            }
                            className={cn(
                                'h-8 w-8 rounded-full border-2 border-transparent',
                                color.color,
                                currentTheme.accentColor === color.value &&
                                    'border-gray-900 dark:border-gray-100'
                            )}
                            title={color.label}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

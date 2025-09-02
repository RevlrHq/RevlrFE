'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { LayoutPreferencesProps, DashboardLayout } from '../types';

export function LayoutPreferences({
    settings,
    onChange,
}: LayoutPreferencesProps) {
    const handleToggleChange = (
        field: keyof typeof settings,
        value: boolean
    ) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    const handleLayoutChange = (
        dashboardLayout: 'compact' | 'comfortable' | 'spacious'
    ) => {
        onChange({
            ...settings,
            dashboardLayout,
        });
    };

    const layoutOptions = [
        {
            value: 'compact',
            label: 'Compact',
            description: 'Dense layout with minimal spacing',
            icon: '⊞',
        },
        {
            value: 'comfortable',
            label: 'Comfortable',
            description: 'Balanced spacing and readability',
            icon: '☰',
        },
        {
            value: 'spacious',
            label: 'Spacious',
            description: 'Generous spacing for easy scanning',
            icon: '▢',
        },
    ] as const;

    return (
        <div className='space-y-6'>
            {/* Dashboard Layout */}
            <div>
                <Label className='text-sm font-medium'>Dashboard Layout</Label>
                <RadioGroup
                    value={settings.dashboardLayout}
                    onValueChange={handleLayoutChange}
                    className='mt-2'
                >
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                        {layoutOptions.map((option) => (
                            <div key={option.value} className='relative'>
                                <RadioGroupItem
                                    value={option.value}
                                    id={`layout-${option.value}`}
                                    className='peer sr-only'
                                />
                                <Label
                                    htmlFor={`layout-${option.value}`}
                                    className={cn(
                                        'flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 hover:bg-accent',
                                        'peer-checked:border-primary peer-checked:bg-primary/5'
                                    )}
                                >
                                    <span className='mb-2 text-2xl'>
                                        {option.icon}
                                    </span>
                                    <span className='font-medium'>
                                        {option.label}
                                    </span>
                                    <span className='text-center text-sm text-muted-foreground'>
                                        {option.description}
                                    </span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            </div>

            {/* Layout Options */}
            <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                        <Label htmlFor='sidebar-collapsed'>
                            Collapse Sidebar
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                            Start with the sidebar collapsed to save space
                        </p>
                    </div>
                    <Switch
                        id='sidebar-collapsed'
                        checked={settings.sidebarCollapsed}
                        onCheckedChange={(checked) =>
                            handleToggleChange('sidebarCollapsed', checked)
                        }
                    />
                </div>

                <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                        <Label htmlFor='compact-mode'>Compact Mode</Label>
                        <p className='text-sm text-muted-foreground'>
                            Reduce spacing and padding for more content density
                        </p>
                    </div>
                    <Switch
                        id='compact-mode'
                        checked={settings.compactMode}
                        onCheckedChange={(checked) =>
                            handleToggleChange('compactMode', checked)
                        }
                    />
                </div>

                <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                        <Label htmlFor='quick-actions'>
                            Show Quick Actions
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                            Display quick action buttons in the header
                        </p>
                    </div>
                    <Switch
                        id='quick-actions'
                        checked={settings.showQuickActions}
                        onCheckedChange={(checked) =>
                            handleToggleChange('showQuickActions', checked)
                        }
                    />
                </div>
            </div>
        </div>
    );
}

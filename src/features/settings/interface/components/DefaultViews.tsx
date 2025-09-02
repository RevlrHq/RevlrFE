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
import type { DefaultViewsProps } from '../types';

export function DefaultViews({ settings, onChange }: DefaultViewsProps) {
    const handleViewChange = (field: keyof typeof settings, value: string) => {
        onChange({
            ...settings,
            [field]: value,
        });
    };

    const viewOptions = {
        dashboardView: [
            {
                value: 'overview',
                label: 'Overview',
                description: 'Summary of all activities',
            },
            {
                value: 'events',
                label: 'Events',
                description: 'Focus on event management',
            },
            {
                value: 'analytics',
                label: 'Analytics',
                description: 'Performance metrics first',
            },
            {
                value: 'revenue',
                label: 'Revenue',
                description: 'Financial overview',
            },
        ],
        eventListView: [
            {
                value: 'grid',
                label: 'Grid View',
                description: 'Cards in a grid layout',
            },
            {
                value: 'list',
                label: 'List View',
                description: 'Compact list format',
            },
            {
                value: 'table',
                label: 'Table View',
                description: 'Detailed data table',
            },
        ],
        attendeeView: [
            {
                value: 'table',
                label: 'Table View',
                description: 'Detailed data table',
            },
            {
                value: 'cards',
                label: 'Card View',
                description: 'Visual card layout',
            },
        ],
        revenueView: [
            {
                value: 'overview',
                label: 'Overview',
                description: 'High-level overview',
            },
            {
                value: 'detailed',
                label: 'Detailed',
                description: 'Comprehensive breakdown',
            },
            {
                value: 'custom',
                label: 'Custom',
                description: 'Customizable analytics view',
            },
        ],
    };

    return (
        <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                {/* Dashboard Default View */}
                <div className='space-y-2'>
                    <Label htmlFor='dashboard-view'>
                        Dashboard Default View
                    </Label>
                    <Select
                        value={settings.dashboardView}
                        onValueChange={(value) =>
                            handleViewChange('dashboardView', value)
                        }
                    >
                        <SelectTrigger id='dashboard-view'>
                            <SelectValue placeholder='Select default view' />
                        </SelectTrigger>
                        <SelectContent>
                            {viewOptions.dashboardView.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div className='font-medium'>
                                            {option.label}
                                        </div>
                                        <div className='text-sm text-muted-foreground'>
                                            {option.description}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Event List Default View */}
                <div className='space-y-2'>
                    <Label htmlFor='event-list-view'>
                        Event List Default View
                    </Label>
                    <Select
                        value={settings.eventListView}
                        onValueChange={(value) =>
                            handleViewChange('eventListView', value)
                        }
                    >
                        <SelectTrigger id='event-list-view'>
                            <SelectValue placeholder='Select default view' />
                        </SelectTrigger>
                        <SelectContent>
                            {viewOptions.eventListView.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div className='font-medium'>
                                            {option.label}
                                        </div>
                                        <div className='text-sm text-muted-foreground'>
                                            {option.description}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Attendee Default View */}
                <div className='space-y-2'>
                    <Label htmlFor='attendee-view'>Attendee Default View</Label>
                    <Select
                        value={settings.attendeeView}
                        onValueChange={(value) =>
                            handleViewChange('attendeeView', value)
                        }
                    >
                        <SelectTrigger id='attendee-view'>
                            <SelectValue placeholder='Select default view' />
                        </SelectTrigger>
                        <SelectContent>
                            {viewOptions.attendeeView.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div className='font-medium'>
                                            {option.label}
                                        </div>
                                        <div className='text-sm text-muted-foreground'>
                                            {option.description}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Revenue Default View */}
                <div className='space-y-2'>
                    <Label htmlFor='revenue-view'>Revenue Default View</Label>
                    <Select
                        value={settings.revenueView}
                        onValueChange={(value) =>
                            handleViewChange('revenueView', value)
                        }
                    >
                        <SelectTrigger id='revenue-view'>
                            <SelectValue placeholder='Select default view' />
                        </SelectTrigger>
                        <SelectContent>
                            {viewOptions.revenueView.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div className='font-medium'>
                                            {option.label}
                                        </div>
                                        <div className='text-sm text-muted-foreground'>
                                            {option.description}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

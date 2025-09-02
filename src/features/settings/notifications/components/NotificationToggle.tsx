import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { NotificationToggleProps } from '../types';

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
    label,
    description,
    checked,
    onChange,
    disabled = false,
}) => {
    const toggleId = `toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className='flex items-start justify-between space-x-4'>
            <div className='min-w-0 flex-1'>
                <Label
                    htmlFor={toggleId}
                    className={`cursor-pointer text-sm font-medium ${
                        disabled ? 'text-gray-400' : 'text-gray-900'
                    }`}
                >
                    {label}
                </Label>
                {description && (
                    <p
                        className={`mt-1 text-sm ${
                            disabled ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        {description}
                    </p>
                )}
            </div>
            <Switch
                id={toggleId}
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                aria-describedby={
                    description ? `${toggleId}-description` : undefined
                }
            />
        </div>
    );
};

'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Wifi } from 'lucide-react';
import type { ProviderStatusProps } from '../types';

/**
 * Status indicator component for media provider connections
 * Shows visual status with appropriate colors and icons
 */
export function ProviderStatus({
    status,
    lastSync,
    error,
}: ProviderStatusProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return {
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    label: 'Connected',
                };
            case 'error':
                return {
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    label: 'Error',
                };
            case 'expired':
                return {
                    icon: AlertCircle,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-100',
                    label: 'Expired',
                };
            case 'pending':
                return {
                    icon: Clock,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100',
                    label: 'Pending',
                };
            case 'disconnected':
            default:
                return {
                    icon: Wifi,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-100',
                    label: 'Disconnected',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className='flex items-center space-x-2'>
            <div
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}
                title={
                    error ||
                    `Status: ${config.label}${lastSync ? ` • Last sync: ${new Date(lastSync).toLocaleString()}` : ''}`
                }
            >
                <Icon className='mr-1 size-3' />
                <span>{config.label}</span>
            </div>
        </div>
    );
}

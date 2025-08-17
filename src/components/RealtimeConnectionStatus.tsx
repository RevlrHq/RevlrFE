'use client';

import React from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';

interface RealtimeConnectionStatusProps {
    organizerId?: string;
    showLabel?: boolean;
    variant?: 'badge' | 'button' | 'indicator';
    className?: string;
}

export const RealtimeConnectionStatus: React.FC<
    RealtimeConnectionStatusProps
> = ({
    organizerId,
    showLabel = false,
    variant = 'indicator',
    className = '',
}) => {
    const { isConnected, connectionError, reconnect } = useOrganizerRealtime({
        organizerId,
        enableNotifications: false, // Only track connection status
        enableToasts: false,
    });

    const getStatusInfo = () => {
        if (isConnected) {
            return {
                icon: Wifi,
                label: 'Connected',
                color: 'text-green-600 dark:text-green-400',
                bgColor: 'bg-green-100 dark:bg-green-900',
                description: 'Real-time updates are active',
            };
        } else if (connectionError) {
            return {
                icon: AlertCircle,
                label: 'Error',
                color: 'text-red-600 dark:text-red-400',
                bgColor: 'bg-red-100 dark:bg-red-900',
                description: connectionError,
            };
        } else {
            return {
                icon: WifiOff,
                label: 'Disconnected',
                color: 'text-yellow-600 dark:text-yellow-400',
                bgColor: 'bg-yellow-100 dark:bg-yellow-900',
                description: 'Real-time updates are not available',
            };
        }
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;

    if (variant === 'badge') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant='secondary'
                            className={`${statusInfo.bgColor} ${statusInfo.color} ${className}`}
                        >
                            <Icon className='mr-1 size-3' />
                            {showLabel && statusInfo.label}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{statusInfo.description}</p>
                        {!isConnected && (
                            <p className='mt-1 text-xs'>Click to reconnect</p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (variant === 'button') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isConnected ? 'ghost' : 'outline'}
                            size='sm'
                            onClick={!isConnected ? reconnect : undefined}
                            disabled={isConnected}
                            className={`${statusInfo.color} ${className}`}
                        >
                            {!isConnected && connectionError ? (
                                <RefreshCw className='mr-2 size-4' />
                            ) : (
                                <Icon className='mr-2 size-4' />
                            )}
                            {showLabel ? statusInfo.label : null}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{statusInfo.description}</p>
                        {!isConnected && (
                            <p className='mt-1 text-xs'>Click to reconnect</p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Default indicator variant
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={`flex items-center gap-2 ${className}`}
                        role='status'
                        aria-label={`Connection status: ${statusInfo.label}`}
                    >
                        <div className='relative'>
                            <Icon className={`size-4 ${statusInfo.color}`} />
                            {isConnected && (
                                <div className='absolute -right-1 -top-1 size-2 animate-pulse rounded-full bg-green-500' />
                            )}
                        </div>
                        {showLabel && (
                            <span className={`text-sm ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{statusInfo.description}</p>
                    {!isConnected && (
                        <p className='mt-1 text-xs'>
                            Real-time updates will resume when connection is
                            restored
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default RealtimeConnectionStatus;

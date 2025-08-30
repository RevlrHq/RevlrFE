import React from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { cn } from '@/lib/utils';
import { HealthStatus } from '@/hooks/useSignalRHealthMonitor';

// Connection status props
export interface ConnectionStatusIndicatorProps {
    connectionState: HubConnectionState;
    healthStatus?: HealthStatus;
    latency?: number;
    isReconnecting?: boolean;
    className?: string;
    showDetails?: boolean;
    onReconnect?: () => void;
}

// Status configuration
const STATUS_CONFIG = {
    [HubConnectionState.Connected]: {
        label: 'Connected',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: '●',
    },
    [HubConnectionState.Connecting]: {
        label: 'Connecting',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        icon: '◐',
    },
    [HubConnectionState.Reconnecting]: {
        label: 'Reconnecting',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        icon: '◑',
    },
    [HubConnectionState.Disconnected]: {
        label: 'Disconnected',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: '○',
    },
    [HubConnectionState.Disconnecting]: {
        label: 'Disconnecting',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: '◒',
    },
};

const HEALTH_CONFIG = {
    [HealthStatus.HEALTHY]: {
        label: 'Healthy',
        color: 'text-green-600',
        icon: '✓',
    },
    [HealthStatus.DEGRADED]: {
        label: 'Degraded',
        color: 'text-yellow-600',
        icon: '⚠',
    },
    [HealthStatus.UNHEALTHY]: {
        label: 'Unhealthy',
        color: 'text-orange-600',
        icon: '⚠',
    },
    [HealthStatus.CRITICAL]: {
        label: 'Critical',
        color: 'text-red-600',
        icon: '✗',
    },
};

export const ConnectionStatusIndicator: React.FC<
    ConnectionStatusIndicatorProps
> = ({
    connectionState,
    healthStatus,
    latency,
    isReconnecting = false,
    className,
    showDetails = false,
    onReconnect,
}) => {
    // Determine the effective connection state
    const effectiveState = isReconnecting
        ? HubConnectionState.Reconnecting
        : connectionState;
    const statusConfig = STATUS_CONFIG[effectiveState];
    const healthConfig = healthStatus ? HEALTH_CONFIG[healthStatus] : null;

    // Format latency display
    const formatLatency = (ms?: number): string => {
        if (ms === undefined || ms < 0) return 'N/A';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Determine if reconnect button should be shown
    const showReconnectButton =
        onReconnect &&
        (connectionState === HubConnectionState.Disconnected ||
            healthStatus === HealthStatus.CRITICAL);

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                statusConfig.bgColor,
                statusConfig.borderColor,
                statusConfig.color,
                className
            )}
            role='status'
            aria-live='polite'
            aria-label={`Connection status: ${statusConfig.label}${healthStatus ? `, Health: ${healthConfig?.label}` : ''}`}
        >
            {/* Connection status indicator */}
            <span
                className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    effectiveState === HubConnectionState.Connecting ||
                        effectiveState === HubConnectionState.Reconnecting
                        ? 'animate-pulse'
                        : ''
                )}
                style={{
                    backgroundColor: statusConfig.color
                        .replace('text-', '')
                        .replace('-600', ''),
                }}
                aria-hidden='true'
            >
                {statusConfig.icon}
            </span>

            {/* Status text */}
            <span className='font-medium'>{statusConfig.label}</span>

            {/* Health status */}
            {healthStatus &&
                healthConfig &&
                connectionState === HubConnectionState.Connected && (
                    <>
                        <span className='text-gray-400'>•</span>
                        <span
                            className={cn(
                                'inline-flex items-center gap-1',
                                healthConfig.color
                            )}
                        >
                            <span aria-hidden='true'>{healthConfig.icon}</span>
                            <span className='text-xs'>
                                {healthConfig.label}
                            </span>
                        </span>
                    </>
                )}

            {/* Latency display */}
            {showDetails && latency !== undefined && latency >= 0 && (
                <>
                    <span className='text-gray-400'>•</span>
                    <span className='text-xs text-gray-600'>
                        {formatLatency(latency)}
                    </span>
                </>
            )}

            {/* Reconnect button */}
            {showReconnectButton && (
                <button
                    onClick={onReconnect}
                    className={cn(
                        'ml-2 rounded border px-2 py-1 text-xs font-medium',
                        'transition-colors hover:bg-white hover:shadow-sm',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                    )}
                    aria-label='Reconnect to server'
                >
                    Reconnect
                </button>
            )}
        </div>
    );
};

// Compact version for minimal space usage
export const CompactConnectionStatus: React.FC<{
    connectionState: HubConnectionState;
    healthStatus?: HealthStatus;
    className?: string;
}> = ({ connectionState, healthStatus, className }) => {
    const statusConfig = STATUS_CONFIG[connectionState];
    const healthConfig = healthStatus ? HEALTH_CONFIG[healthStatus] : null;

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 text-xs',
                statusConfig.color,
                className
            )}
            role='status'
            aria-label={`Connection: ${statusConfig.label}${healthStatus ? `, Health: ${healthConfig?.label}` : ''}`}
        >
            <span
                className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    connectionState === HubConnectionState.Connecting ||
                        connectionState === HubConnectionState.Reconnecting
                        ? 'animate-pulse'
                        : ''
                )}
                style={{
                    backgroundColor: statusConfig.color
                        .replace('text-', '')
                        .replace('-600', ''),
                }}
                aria-hidden='true'
            />

            {healthStatus &&
                healthConfig &&
                connectionState === HubConnectionState.Connected && (
                    <span className={healthConfig.color} aria-hidden='true'>
                        {healthConfig.icon}
                    </span>
                )}
        </div>
    );
};

// Status badge for use in headers or toolbars
export const ConnectionStatusBadge: React.FC<{
    connectionState: HubConnectionState;
    healthStatus?: HealthStatus;
    latency?: number;
    className?: string;
    onClick?: () => void;
}> = ({ connectionState, healthStatus, latency, className, onClick }) => {
    const statusConfig = STATUS_CONFIG[connectionState];
    const healthConfig = healthStatus ? HEALTH_CONFIG[healthStatus] : null;

    // Determine badge color based on health or connection state
    let badgeColor = statusConfig.color;
    if (healthStatus && connectionState === HubConnectionState.Connected) {
        badgeColor = healthConfig?.color || statusConfig.color;
    }

    const isClickable = !!onClick;

    return (
        <button
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                'border transition-colors',
                badgeColor,
                statusConfig.bgColor,
                statusConfig.borderColor,
                isClickable && 'cursor-pointer hover:shadow-sm',
                !isClickable && 'cursor-default',
                className
            )}
            onClick={onClick}
            disabled={!isClickable}
            role={isClickable ? 'button' : 'status'}
            aria-label={`Connection status: ${statusConfig.label}${healthStatus ? `, Health: ${healthConfig?.label}` : ''}${latency ? `, Latency: ${latency}ms` : ''}`}
        >
            <span
                className={cn(
                    'inline-block h-1.5 w-1.5 rounded-full',
                    connectionState === HubConnectionState.Connecting ||
                        connectionState === HubConnectionState.Reconnecting
                        ? 'animate-pulse'
                        : ''
                )}
                style={{
                    backgroundColor: badgeColor
                        .replace('text-', '')
                        .replace('-600', ''),
                }}
                aria-hidden='true'
            />

            <span>{statusConfig.label}</span>

            {latency !== undefined && latency >= 0 && (
                <span className='text-gray-500'>({latency}ms)</span>
            )}
        </button>
    );
};

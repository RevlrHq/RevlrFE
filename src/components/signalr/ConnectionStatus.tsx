'use client';

import React from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import {
    WifiOff,
    Loader2,
    AlertCircle,
    RefreshCw,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSignalRContext } from '@/providers/SignalRProvider';
import type { SignalRError } from '@/types/signalr';

// Connection status display configuration
interface ConnectionStatusConfig {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    showReconnectButton: boolean;
}

// Status configurations for different connection states
const STATUS_CONFIGS: Record<HubConnectionState, ConnectionStatusConfig> = {
    [HubConnectionState.Connected]: {
        icon: CheckCircle2,
        label: 'Connected',
        description: 'Real-time connection is active',
        variant: 'default',
        className: 'text-green-600 bg-green-50 border-green-200',
        showReconnectButton: false,
    },
    [HubConnectionState.Connecting]: {
        icon: Loader2,
        label: 'Connecting',
        description: 'Establishing real-time connection...',
        variant: 'secondary',
        className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        showReconnectButton: false,
    },
    [HubConnectionState.Reconnecting]: {
        icon: RefreshCw,
        label: 'Reconnecting',
        description: 'Attempting to restore connection...',
        variant: 'secondary',
        className: 'text-blue-600 bg-blue-50 border-blue-200',
        showReconnectButton: false,
    },
    [HubConnectionState.Disconnected]: {
        icon: WifiOff,
        label: 'Disconnected',
        description: 'Real-time connection is not available',
        variant: 'destructive',
        className: 'text-red-600 bg-red-50 border-red-200',
        showReconnectButton: true,
    },
    [HubConnectionState.Disconnecting]: {
        icon: Loader2,
        label: 'Disconnecting',
        description: 'Closing real-time connection...',
        variant: 'secondary',
        className: 'text-gray-600 bg-gray-50 border-gray-200',
        showReconnectButton: false,
    },
};

// Props interface
interface ConnectionStatusProps {
    /**
     * Display variant - compact shows just an icon, full shows icon + text
     */
    variant?: 'compact' | 'full' | 'badge';

    /**
     * Additional CSS classes
     */
    className?: string;

    /**
     * Whether to show the manual reconnect button when disconnected
     */
    showReconnectButton?: boolean;

    /**
     * Whether to show connection health information (latency, etc.)
     */
    showHealthInfo?: boolean;

    /**
     * Custom error display component
     */
    errorComponent?: React.ComponentType<{ error: SignalRError }>;

    /**
     * Callback when reconnect button is clicked
     */
    onReconnectClick?: () => void;
}

/**
 * ConnectionStatus component displays the current SignalR connection status
 * with visual indicators and optional reconnect functionality
 */
export function ConnectionStatus({
    variant = 'full',
    className,
    showReconnectButton = true,
    showHealthInfo = false,
    errorComponent: ErrorComponent,
    onReconnectClick,
}: ConnectionStatusProps) {
    const {
        connectionState,
        isConnected,
        isConnecting,
        isReconnecting,
        isDisconnected,
        error,
        reconnect,
        measureLatency,
    } = useSignalRContext();

    const [isReconnecting_, setIsReconnecting] = React.useState(false);
    const [latency, setLatency] = React.useState<number | null>(null);

    // Get current status configuration
    const statusConfig = STATUS_CONFIGS[connectionState.state];
    const IconComponent = statusConfig.icon;

    // Handle manual reconnect
    const handleReconnect = async () => {
        if (isReconnecting_) return;

        setIsReconnecting(true);
        try {
            await reconnect();
            onReconnectClick?.();
        } catch (error) {
            console.debug('Manual reconnect failed:', error);
        } finally {
            setIsReconnecting(false);
        }
    };

    // Measure latency periodically when connected
    React.useEffect(() => {
        if (!isConnected || !showHealthInfo) {
            setLatency(null);
            return;
        }

        const measureLatencyPeriodically = async () => {
            try {
                const currentLatency = await measureLatency();
                if (currentLatency > 0) {
                    setLatency(currentLatency);
                }
            } catch (error) {
                console.warn('Failed to measure latency:', error);
            }
        };

        // Initial measurement
        measureLatencyPeriodically();

        // Set up periodic measurement
        const interval = setInterval(measureLatencyPeriodically, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [isConnected, showHealthInfo, measureLatency]);

    // Format latency display
    const formatLatency = (ms: number): string => {
        if (ms < 100) return `${ms}ms`;
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    // Render compact variant (just icon)
    if (variant === 'compact') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'inline-flex h-6 w-6 items-center justify-center rounded-full',
                                statusConfig.className,
                                className
                            )}
                            role='status'
                            aria-label={`Connection status: ${statusConfig.label}`}
                        >
                            <IconComponent
                                className={cn(
                                    'h-4 w-4',
                                    (isConnecting || isReconnecting) &&
                                        'animate-spin'
                                )}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className='text-sm'>
                            <div className='font-medium'>
                                {statusConfig.label}
                            </div>
                            <div className='text-muted-foreground'>
                                {statusConfig.description}
                            </div>
                            {showHealthInfo && latency && (
                                <div className='mt-1 text-xs'>
                                    Latency: {formatLatency(latency)}
                                </div>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Render badge variant
    if (variant === 'badge') {
        return (
            <Badge
                variant={statusConfig.variant}
                className={cn('inline-flex items-center gap-1.5', className)}
            >
                <IconComponent
                    className={cn(
                        'h-3 w-3',
                        (isConnecting || isReconnecting) && 'animate-spin'
                    )}
                />
                <span>{statusConfig.label}</span>
                {showHealthInfo && latency && (
                    <span className='text-xs opacity-75'>
                        ({formatLatency(latency)})
                    </span>
                )}
            </Badge>
        );
    }

    // Render full variant
    return (
        <div
            className={cn(
                'inline-flex items-center gap-3 rounded-lg border px-3 py-2',
                statusConfig.className,
                className
            )}
            role='status'
            aria-live='polite'
        >
            {/* Status icon */}
            <div className='shrink-0'>
                <IconComponent
                    className={cn(
                        'h-5 w-5',
                        (isConnecting || isReconnecting) && 'animate-spin'
                    )}
                />
            </div>

            {/* Status text */}
            <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium'>{statusConfig.label}</div>
                <div className='text-xs opacity-75'>
                    {statusConfig.description}
                </div>

                {/* Health information */}
                {showHealthInfo && isConnected && (
                    <div className='mt-1 text-xs opacity-75'>
                        {latency ? (
                            <>Latency: {formatLatency(latency)}</>
                        ) : (
                            <>Measuring latency...</>
                        )}
                        {connectionState.reconnectAttempts > 0 && (
                            <>
                                {' '}
                                • Reconnected{' '}
                                {connectionState.reconnectAttempts} times
                            </>
                        )}
                    </div>
                )}

                {/* Connection attempts info */}
                {(isReconnecting || connectionState.reconnectAttempts > 0) && (
                    <div className='mt-1 text-xs opacity-75'>
                        {isReconnecting
                            ? 'Reconnecting...'
                            : `Reconnected ${connectionState.reconnectAttempts} times`}
                    </div>
                )}
            </div>

            {/* Reconnect button */}
            {showReconnectButton &&
                statusConfig.showReconnectButton &&
                isDisconnected && (
                    <Button
                        size='sm'
                        variant='outline'
                        onClick={handleReconnect}
                        disabled={isReconnecting_}
                        className='shrink-0'
                    >
                        {isReconnecting_ ? (
                            <>
                                <Loader2 className='mr-1 size-3 animate-spin' />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <RefreshCw className='mr-1 size-3' />
                                Reconnect
                            </>
                        )}
                    </Button>
                )}

            {/* Error display */}
            {error && ErrorComponent && (
                <div className='shrink-0'>
                    <ErrorComponent error={error} />
                </div>
            )}
        </div>
    );
}

/**
 * Simple error display component for connection errors
 */
export function ConnectionError({ error }: { error: SignalRError }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertCircle className='size-4 text-red-500' />
                </TooltipTrigger>
                <TooltipContent>
                    <div className='max-w-xs text-sm'>
                        <div className='font-medium'>Connection Error</div>
                        <div className='mt-1 text-muted-foreground'>
                            {error.message}
                        </div>
                        <div className='mt-1 text-xs text-muted-foreground'>
                            {error.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Hook to get connection status information
 */
export function useConnectionStatus() {
    const {
        connectionState,
        isConnected,
        isConnecting,
        isReconnecting,
        isDisconnected,
        error,
    } = useSignalRContext();

    const statusConfig = STATUS_CONFIGS[connectionState.state];

    return {
        state: connectionState.state,
        isConnected,
        isConnecting,
        isReconnecting,
        isDisconnected,
        error,
        config: statusConfig,
        reconnectAttempts: connectionState.reconnectAttempts,
        lastConnected: connectionState.lastConnected,
        lastDisconnected: connectionState.lastDisconnected,
        isHealthy: connectionState.isHealthy,
        latency: connectionState.latency,
    };
}

'use client';

import React from 'react';
import { useSignalRCircuitBreakerState } from '@/lib/utils/signalr-circuit-breaker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SignalRCircuitBreakerStatusProps {
    className?: string;
    showDetails?: boolean;
}

/**
 * Debug component to display SignalR circuit breaker status
 * Only shows in development mode by default
 */
export function SignalRCircuitBreakerStatus({
    className,
    showDetails = process.env.NODE_ENV === 'development',
}: SignalRCircuitBreakerStatusProps) {
    const state = useSignalRCircuitBreakerState();

    if (!showDetails) {
        return null;
    }

    const getStatusIcon = () => {
        if (state.isOpen) {
            return <AlertCircle className='h-4 w-4 text-red-500' />;
        }
        if (state.consecutiveFailures > 0) {
            return <Clock className='h-4 w-4 text-yellow-500' />;
        }
        return <CheckCircle className='h-4 w-4 text-green-500' />;
    };

    const getStatusBadge = () => {
        if (state.isOpen) {
            return <Badge variant='destructive'>Open</Badge>;
        }
        if (state.consecutiveFailures > 0) {
            return <Badge variant='secondary'>Monitoring</Badge>;
        }
        return <Badge variant='default'>Closed</Badge>;
    };

    return (
        <Card className={className}>
            <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-sm font-medium'>
                    {getStatusIcon()}
                    SignalR Circuit Breaker
                    {getStatusBadge()}
                </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
                <div className='space-y-2 text-xs'>
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Status:</span>
                        <span>{state.statusMessage}</span>
                    </div>

                    {state.consecutiveFailures > 0 && (
                        <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                                Failures:
                            </span>
                            <span>{state.consecutiveFailures}</span>
                        </div>
                    )}

                    {state.isOpen && state.timeUntilReset > 0 && (
                        <div className='flex justify-between'>
                            <span className='text-muted-foreground'>
                                Reset in:
                            </span>
                            <span>
                                {Math.ceil(state.timeUntilReset / 1000)}s
                            </span>
                        </div>
                    )}

                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                            Can Connect:
                        </span>
                        <span
                            className={
                                state.canConnect
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            }
                        >
                            {state.canConnect ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

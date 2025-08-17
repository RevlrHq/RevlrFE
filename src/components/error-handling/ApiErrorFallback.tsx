/**
 * Fallback component for API errors with contextual recovery options
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ApiErrorFallbackProps {
    error: Error;
    onRetry?: () => void;
    title?: string;
    description?: string;
    showRetry?: boolean;
    isLoading?: boolean;
    className?: string;
}

export const ApiErrorFallback: React.FC<ApiErrorFallbackProps> = ({
    error,
    onRetry,
    title,
    description,
    showRetry = true,
    isLoading = false,
    className = '',
}) => {
    const isOnline = useOnlineStatus();

    const getErrorType = (error: Error) => {
        const message = error.message.toLowerCase();

        if (
            !isOnline ||
            message.includes('network') ||
            message.includes('fetch')
        ) {
            return 'network';
        }

        if (message.includes('unauthorized') || message.includes('401')) {
            return 'auth';
        }

        if (message.includes('forbidden') || message.includes('403')) {
            return 'permission';
        }

        if (message.includes('not found') || message.includes('404')) {
            return 'notfound';
        }

        if (message.includes('timeout')) {
            return 'timeout';
        }

        if (message.includes('server') || message.includes('500')) {
            return 'server';
        }

        return 'unknown';
    };

    const errorType = getErrorType(error);

    const getErrorConfig = () => {
        switch (errorType) {
            case 'network':
                return {
                    icon: isOnline ? Wifi : WifiOff,
                    title: isOnline ? 'Connection Error' : "You're Offline",
                    description: isOnline
                        ? 'Unable to connect to the server. Please check your connection and try again.'
                        : "Please check your internet connection and try again when you're back online.",
                    variant: 'destructive' as const,
                    showRetry: isOnline,
                };

            case 'auth':
                return {
                    icon: AlertTriangle,
                    title: 'Authentication Required',
                    description:
                        'Your session has expired. Please refresh the page to log in again.',
                    variant: 'destructive' as const,
                    showRetry: false,
                };

            case 'permission':
                return {
                    icon: AlertTriangle,
                    title: 'Access Denied',
                    description:
                        "You don't have permission to access this information.",
                    variant: 'destructive' as const,
                    showRetry: false,
                };

            case 'notfound':
                return {
                    icon: AlertTriangle,
                    title: 'Not Found',
                    description:
                        'The requested information could not be found.',
                    variant: 'destructive' as const,
                    showRetry: true,
                };

            case 'timeout':
                return {
                    icon: AlertTriangle,
                    title: 'Request Timeout',
                    description:
                        'The request took too long to complete. Please try again.',
                    variant: 'destructive' as const,
                    showRetry: true,
                };

            case 'server':
                return {
                    icon: AlertTriangle,
                    title: 'Server Error',
                    description:
                        'A server error occurred. Our team has been notified and is working on a fix.',
                    variant: 'destructive' as const,
                    showRetry: true,
                };

            default:
                return {
                    icon: AlertTriangle,
                    title: 'Something went wrong',
                    description:
                        error.message || 'An unexpected error occurred.',
                    variant: 'destructive' as const,
                    showRetry: true,
                };
        }
    };

    const config = getErrorConfig();
    const Icon = config.icon;

    return (
        <Card className={`border-destructive/50 ${className}`}>
            <CardHeader className='pb-3'>
                <CardTitle className='flex items-center gap-2 text-destructive'>
                    <Icon className='size-5' />
                    {title || config.title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant={config.variant}>
                    <AlertDescription>
                        {description || config.description}
                    </AlertDescription>
                </Alert>

                {showRetry && config.showRetry && onRetry && (
                    <div className='mt-4'>
                        <Button
                            onClick={onRetry}
                            disabled={isLoading}
                            variant='outline'
                            size='sm'
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className='mr-2 size-4 animate-spin' />
                                    Retrying...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className='mr-2 size-4' />
                                    Try Again
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {errorType === 'auth' && (
                    <div className='mt-4'>
                        <Button
                            onClick={() => window.location.reload()}
                            variant='outline'
                            size='sm'
                        >
                            <RefreshCw className='mr-2 size-4' />
                            Refresh Page
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

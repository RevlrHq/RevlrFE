'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    RefreshCw,
    Settings,
    Clock,
    ExternalLink,
    X,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    MediaProviderError,
    MediaProviderErrorType,
} from '@src/types/media-search';

export interface UserErrorMessage {
    title: string;
    message: string;
    actions: UserAction[];
    severity: 'error' | 'warning' | 'info';
    canRetry: boolean;
    retryAfter?: number;
    details?: string;
}

export interface UserAction {
    label: string;
    action:
        | 'retry'
        | 'configure'
        | 'contact_support'
        | 'dismiss'
        | 'learn_more';
    url?: string;
    onClick?: () => void;
    primary?: boolean;
}

interface MediaSearchErrorDisplayProps {
    error: string | MediaProviderError | null;
    providerErrors?: Record<string, string>;
    isInitializing?: boolean;
    isInitialized?: boolean;
    initializationError?: string | null;
    availableProviders?: number;
    totalProviders?: number;
    onRetry?: () => void;
    onDismiss?: () => void;
    className?: string;
}

export const MediaSearchErrorDisplay: React.FC<
    MediaSearchErrorDisplayProps
> = ({
    error,
    isInitializing = false,
    initializationError,
    availableProviders = 0,
    totalProviders = 0,
    onRetry,
    onDismiss,
    className = '',
}) => {
    const { theme } = useTheme();
    const [showDetails, setShowDetails] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

    // Convert error to user-friendly message
    const getUserErrorMessage = useCallback(
        (
            error: string | MediaProviderError | null
        ): UserErrorMessage | null => {
            if (!error) return null;

            // Handle initialization errors
            if (initializationError) {
                return {
                    title: 'Media Search Setup Issue',
                    message:
                        'The media search feature is not properly configured. Some providers may be unavailable.',
                    severity: 'warning',
                    canRetry: true,
                    actions: [
                        {
                            label: 'Retry Setup',
                            action: 'retry',
                            onClick: onRetry,
                            primary: true,
                        },
                        {
                            label: 'Learn More',
                            action: 'learn_more',
                            url: '/docs/media-search-setup',
                        },
                    ],
                    details: initializationError,
                };
            }

            // Handle provider errors
            if (typeof error === 'object' && 'type' in error) {
                const providerError = error as MediaProviderError;

                switch (providerError.type) {
                    case MediaProviderErrorType.API_KEY_INVALID:
                        return {
                            title: 'Authentication Issue',
                            message: `The API key for ${providerError.providerId} is invalid or expired. Please check your configuration.`,
                            severity: 'error',
                            canRetry: false,
                            actions: [
                                {
                                    label: 'Check Configuration',
                                    action: 'configure',
                                    url: '/settings/media-providers',
                                    primary: true,
                                },
                                {
                                    label: 'Contact Support',
                                    action: 'contact_support',
                                    url: '/support',
                                },
                            ],
                            details: providerError.message,
                        };

                    case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                        return {
                            title: 'Rate Limit Reached',
                            message: `${providerError.providerId} has reached its rate limit. Please wait before trying again.`,
                            severity: 'warning',
                            canRetry: true,
                            retryAfter: providerError.retryAfter,
                            actions: [
                                {
                                    label: 'Retry Later',
                                    action: 'retry',
                                    onClick: onRetry,
                                    primary: true,
                                },
                                {
                                    label: 'Learn About Limits',
                                    action: 'learn_more',
                                    url: '/docs/rate-limits',
                                },
                            ],
                            details: `Retry after: ${providerError.retryAfter ? new Date(Date.now() + providerError.retryAfter * 1000).toLocaleTimeString() : 'Unknown'}`,
                        };

                    case MediaProviderErrorType.NETWORK_ERROR:
                        return {
                            title: 'Connection Problem',
                            message:
                                'Unable to connect to media providers. Please check your internet connection.',
                            severity: 'error',
                            canRetry: true,
                            actions: [
                                {
                                    label: 'Try Again',
                                    action: 'retry',
                                    onClick: onRetry,
                                    primary: true,
                                },
                                {
                                    label: 'Check Connection',
                                    action: 'learn_more',
                                    url: '/docs/troubleshooting',
                                },
                            ],
                            details: providerError.message,
                        };

                    case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                        return {
                            title: 'Service Temporarily Unavailable',
                            message: `${providerError.providerId} is currently unavailable. Other providers may still work.`,
                            severity: 'warning',
                            canRetry: true,
                            actions: [
                                {
                                    label: 'Try Again',
                                    action: 'retry',
                                    onClick: onRetry,
                                    primary: true,
                                },
                                {
                                    label: 'Check Status',
                                    action: 'learn_more',
                                    url: '/status',
                                },
                            ],
                            details: providerError.message,
                        };

                    default:
                        return {
                            title: 'Search Error',
                            message:
                                providerError.message ||
                                'An unexpected error occurred while searching for media.',
                            severity: 'error',
                            canRetry: true,
                            actions: [
                                {
                                    label: 'Try Again',
                                    action: 'retry',
                                    onClick: onRetry,
                                    primary: true,
                                },
                                {
                                    label: 'Contact Support',
                                    action: 'contact_support',
                                    url: '/support',
                                },
                            ],
                            details: providerError.message,
                        };
                }
            }

            // Handle string errors
            if (typeof error === 'string') {
                // Check for common error patterns
                if (error.includes('No healthy providers')) {
                    return {
                        title: 'No Media Providers Available',
                        message:
                            'All media providers are currently unavailable. This might be due to configuration issues or temporary outages.',
                        severity: 'error',
                        canRetry: true,
                        actions: [
                            {
                                label: 'Retry Setup',
                                action: 'retry',
                                onClick: onRetry,
                                primary: true,
                            },
                            {
                                label: 'Check Configuration',
                                action: 'configure',
                                url: '/settings/media-providers',
                            },
                            {
                                label: 'Get Help',
                                action: 'contact_support',
                                url: '/support',
                            },
                        ],
                        details: error,
                    };
                }

                if (
                    error.includes('initializing') ||
                    error.includes('initialization')
                ) {
                    return {
                        title: 'Setting Up Media Search',
                        message:
                            'Media providers are still being set up. This usually takes a few seconds.',
                        severity: 'info',
                        canRetry: true,
                        actions: [
                            {
                                label: 'Wait and Retry',
                                action: 'retry',
                                onClick: onRetry,
                                primary: true,
                            },
                        ],
                        details: error,
                    };
                }

                if (error.includes('network') || error.includes('connection')) {
                    return {
                        title: 'Connection Issue',
                        message:
                            'Unable to connect to media providers. Please check your internet connection.',
                        severity: 'error',
                        canRetry: true,
                        actions: [
                            {
                                label: 'Try Again',
                                action: 'retry',
                                onClick: onRetry,
                                primary: true,
                            },
                        ],
                        details: error,
                    };
                }

                // Generic error
                return {
                    title: 'Search Error',
                    message:
                        'Something went wrong while searching for media. Please try again.',
                    severity: 'error',
                    canRetry: true,
                    actions: [
                        {
                            label: 'Try Again',
                            action: 'retry',
                            onClick: onRetry,
                            primary: true,
                        },
                        {
                            label: 'Contact Support',
                            action: 'contact_support',
                            url: '/support',
                        },
                    ],
                    details: error,
                };
            }

            return null;
        },
        [error, initializationError, onRetry]
    );

    const userMessage = getUserErrorMessage(error);

    // Handle retry countdown
    React.useEffect(() => {
        if (userMessage?.retryAfter && userMessage.retryAfter > 0) {
            setRetryCountdown(userMessage.retryAfter);
            const interval = setInterval(() => {
                setRetryCountdown((prev) => {
                    if (prev && prev > 1) {
                        return prev - 1;
                    } else {
                        clearInterval(interval);
                        return null;
                    }
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [userMessage?.retryAfter]);

    const getIcon = (severity: string) => {
        switch (severity) {
            case 'error':
                return <AlertCircle className='size-5 text-red-500' />;
            case 'warning':
                return <AlertTriangle className='size-5 text-yellow-500' />;
            case 'info':
                return <Info className='size-5 text-blue-500' />;
            default:
                return <AlertCircle className='size-5 text-gray-500' />;
        }
    };

    const getSeverityColors = (severity: string) => {
        switch (severity) {
            case 'error':
                return {
                    bg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50',
                    border: 'border-red-200',
                    text: theme === 'dark' ? 'text-red-200' : 'text-red-800',
                    button: 'bg-red-600 hover:bg-red-700 text-white',
                };
            case 'warning':
                return {
                    bg: theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text:
                        theme === 'dark'
                            ? 'text-yellow-200'
                            : 'text-yellow-800',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                };
            case 'info':
                return {
                    bg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50',
                    border: 'border-blue-200',
                    text: theme === 'dark' ? 'text-blue-200' : 'text-blue-800',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white',
                };
            default:
                return {
                    bg: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
                    border: 'border-gray-200',
                    text: theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
                    button: 'bg-gray-600 hover:bg-gray-700 text-white',
                };
        }
    };

    const handleActionClick = (action: UserAction) => {
        if (action.onClick) {
            action.onClick();
        } else if (action.url) {
            window.open(action.url, '_blank');
        }
    };

    if (!userMessage && !isInitializing) {
        return null;
    }

    // Show loading state during initialization
    if (isInitializing) {
        return (
            <div
                className={`rounded-lg border p-4 ${getSeverityColors('info').bg} ${getSeverityColors('info').border} ${className}`}
            >
                <div className='flex items-center space-x-3'>
                    <div className='animate-spin'>
                        <RefreshCw className='size-5 text-blue-500' />
                    </div>
                    <div>
                        <h3
                            className={`font-medium ${getSeverityColors('info').text}`}
                        >
                            Setting up media search...
                        </h3>
                        <p
                            className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            Initializing media providers, please wait.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!userMessage) return null;

    const colors = getSeverityColors(userMessage.severity);

    return (
        <div
            className={`rounded-lg border p-4 ${colors.bg} ${colors.border} ${className}`}
        >
            <div className='flex items-start space-x-3'>
                {getIcon(userMessage.severity)}
                <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                        <h3 className={`font-medium ${colors.text}`}>
                            {userMessage.title}
                        </h3>
                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className={`ml-2 rounded-full p-1 hover:bg-black/10 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                                aria-label='Dismiss error'
                            >
                                <X className='size-4' />
                            </button>
                        )}
                    </div>

                    <p
                        className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        {userMessage.message}
                    </p>

                    {/* Provider status summary */}
                    {totalProviders > 0 && (
                        <div
                            className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            {availableProviders} of {totalProviders} providers
                            available
                        </div>
                    )}

                    {/* Retry countdown */}
                    {retryCountdown && retryCountdown > 0 && (
                        <div
                            className={`mt-2 flex items-center space-x-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            <Clock className='size-3' />
                            <span>
                                Retry available in {retryCountdown} seconds
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    {userMessage.actions.length > 0 && (
                        <div className='mt-3 flex flex-wrap gap-2'>
                            {userMessage.actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    disabled={
                                        action.action === 'retry' &&
                                        retryCountdown !== null &&
                                        retryCountdown > 0
                                    }
                                    className={`inline-flex items-center space-x-1 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                        action.primary
                                            ? colors.button
                                            : `${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    {action.action === 'retry' && (
                                        <RefreshCw className='size-3' />
                                    )}
                                    {action.action === 'configure' && (
                                        <Settings className='size-3' />
                                    )}
                                    {action.action === 'learn_more' && (
                                        <ExternalLink className='size-3' />
                                    )}
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Details toggle */}
                    {userMessage.details && (
                        <div className='mt-3'>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className={`flex items-center space-x-1 text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                            >
                                {showDetails ? (
                                    <ChevronUp className='size-3' />
                                ) : (
                                    <ChevronDown className='size-3' />
                                )}
                                <span>
                                    {showDetails ? 'Hide' : 'Show'} details
                                </span>
                            </button>

                            {showDetails && (
                                <div
                                    className={`mt-2 rounded p-2 font-mono text-xs ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {userMessage.details}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaSearchErrorDisplay;

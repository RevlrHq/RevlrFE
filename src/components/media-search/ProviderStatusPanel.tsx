'use client';

import React, { useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    XCircle,
    Clock,
    Wifi,
    WifiOff,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
} from 'lucide-react';
import { ProviderStatus } from '@src/types/media-search';

interface ProviderStatusPanelProps {
    providers: ProviderStatus[];
    activeProviders: string[];
    onToggleProvider: (providerId: string) => void;
    onRetryProvider?: (providerId: string) => void;
    showInactive?: boolean;
    compact?: boolean;
    className?: string;
}

export const ProviderStatusPanel: React.FC<ProviderStatusPanelProps> = ({
    providers,
    activeProviders,
    onToggleProvider,
    onRetryProvider,
    showInactive = true,
    compact = false,
    className = '',
}) => {
    const { theme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(!compact);
    const [showDetails, setShowDetails] = useState<string | null>(null);

    const getProviderStatusInfo = (provider: ProviderStatus) => {
        if (!provider.isAvailable) {
            return {
                status: 'unavailable',
                icon: <XCircle className='size-4 text-red-500' />,
                color: 'text-red-500',
                bgColor: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50',
                borderColor: 'border-red-200',
                message: provider.lastError?.message || 'Provider unavailable',
            };
        }

        if (provider.healthScore < 50) {
            return {
                status: 'poor',
                icon: <AlertCircle className='size-4 text-red-500' />,
                color: 'text-red-500',
                bgColor: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50',
                borderColor: 'border-red-200',
                message: 'Poor connection quality',
            };
        }

        if (provider.healthScore < 80) {
            return {
                status: 'degraded',
                icon: <AlertTriangle className='size-4 text-yellow-500' />,
                color: 'text-yellow-500',
                bgColor: theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-50',
                borderColor: 'border-yellow-200',
                message: 'Degraded performance',
            };
        }

        if (
            provider.rateLimit?.remaining !== undefined &&
            provider.rateLimit.remaining < 10
        ) {
            return {
                status: 'limited',
                icon: <Clock className='size-4 text-orange-500' />,
                color: 'text-orange-500',
                bgColor: theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50',
                borderColor: 'border-orange-200',
                message: `Rate limit: ${provider.rateLimit.remaining} requests remaining`,
            };
        }

        return {
            status: 'healthy',
            icon: <CheckCircle className='size-4 text-green-500' />,
            color: 'text-green-500',
            bgColor: theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50',
            borderColor: 'border-green-200',
            message: 'Operating normally',
        };
    };

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const formatRateLimit = (rateLimit: ProviderStatus['rateLimit']) => {
        if (!rateLimit) {
            return {
                limit: 'Unknown',
                remaining: 'Unknown',
                resetTime: 'Unknown',
            };
        }

        const { requests, window, remaining, resetTime } = rateLimit;
        const resetDate = resetTime ? new Date(resetTime * 1000) : null;

        return {
            limit: `${requests}/${window}s`,
            remaining: remaining ?? 'Unknown',
            resetTime: resetDate ? resetDate.toLocaleTimeString() : 'Unknown',
        };
    };

    const availableProviders = providers.filter((p) => p.isAvailable);
    const unavailableProviders = providers.filter((p) => !p.isAvailable);

    if (providers.length === 0) {
        return (
            <div
                className={`rounded-lg border p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} ${className}`}
            >
                <div className='flex items-center space-x-2'>
                    <WifiOff
                        className={`size-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <span
                        className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                        No media providers configured
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} ${className}`}
        >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700'>
                <div className='flex items-center space-x-2'>
                    <Wifi
                        className={`size-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <span
                        className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
                    >
                        Media Providers
                    </span>
                    <span
                        className={`rounded-full px-2 py-1 text-xs ${
                            availableProviders.length > 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                    >
                        {availableProviders.length}/{providers.length} active
                    </span>
                </div>

                {compact && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        {isExpanded ? (
                            <ChevronUp className='size-4' />
                        ) : (
                            <ChevronDown className='size-4' />
                        )}
                    </button>
                )}
            </div>

            {/* Provider List */}
            {isExpanded && (
                <div className='space-y-2 p-3'>
                    {/* Available Providers */}
                    {availableProviders.map((provider) => {
                        const statusInfo = getProviderStatusInfo(provider);
                        const isActive = activeProviders.includes(provider.id);
                        const rateLimitInfo = formatRateLimit(
                            provider.rateLimit
                        );

                        return (
                            <div
                                key={provider.id}
                                className={`rounded-lg border p-3 transition-colors ${statusInfo.borderColor} ${statusInfo.bgColor}`}
                            >
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                        {statusInfo.icon}
                                        <div>
                                            <div className='flex items-center space-x-2'>
                                                <span
                                                    className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                                >
                                                    {provider.name}
                                                </span>
                                                <span
                                                    className={`text-xs ${getHealthScoreColor(provider.healthScore)}`}
                                                >
                                                    {provider.healthScore}%
                                                </span>
                                            </div>
                                            <p
                                                className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                            >
                                                {statusInfo.message}
                                            </p>
                                        </div>
                                    </div>

                                    <div className='flex items-center space-x-2'>
                                        {/* Rate limit indicator */}
                                        {provider.rateLimit?.remaining !==
                                            undefined && (
                                            <span
                                                className={`rounded px-2 py-1 text-xs ${
                                                    provider.rateLimit
                                                        .remaining > 50
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                        : provider.rateLimit
                                                                .remaining > 10
                                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                }`}
                                            >
                                                {provider.rateLimit.remaining}{' '}
                                                left
                                            </span>
                                        )}

                                        {/* Toggle button */}
                                        <button
                                            onClick={() =>
                                                onToggleProvider(provider.id)
                                            }
                                            className={`rounded p-1 transition-colors ${
                                                isActive
                                                    ? 'text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20'
                                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                            title={
                                                isActive
                                                    ? 'Disable provider'
                                                    : 'Enable provider'
                                            }
                                        >
                                            {isActive ? (
                                                <Eye className='size-4' />
                                            ) : (
                                                <EyeOff className='size-4' />
                                            )}
                                        </button>

                                        {/* Retry button for degraded providers */}
                                        {(statusInfo.status === 'poor' ||
                                            statusInfo.status === 'degraded') &&
                                            onRetryProvider && (
                                                <button
                                                    onClick={() =>
                                                        onRetryProvider(
                                                            provider.id
                                                        )
                                                    }
                                                    className={`rounded p-1 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                                    title='Retry provider'
                                                >
                                                    <RefreshCw className='size-4' />
                                                </button>
                                            )}

                                        {/* Details toggle */}
                                        <button
                                            onClick={() =>
                                                setShowDetails(
                                                    showDetails === provider.id
                                                        ? null
                                                        : provider.id
                                                )
                                            }
                                            className={`rounded p-1 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            {showDetails === provider.id ? (
                                                <ChevronUp className='size-4' />
                                            ) : (
                                                <ChevronDown className='size-4' />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Detailed information */}
                                {showDetails === provider.id && (
                                    <div
                                        className={`mt-3 space-y-2 border-t pt-3 text-xs ${theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-600'}`}
                                    >
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div>
                                                <span className='font-medium'>
                                                    Rate Limit:
                                                </span>
                                                <div className='ml-2'>
                                                    <div>
                                                        Limit:{' '}
                                                        {rateLimitInfo.limit}
                                                    </div>
                                                    <div>
                                                        Remaining:{' '}
                                                        {
                                                            rateLimitInfo.remaining
                                                        }
                                                    </div>
                                                    <div>
                                                        Resets:{' '}
                                                        {
                                                            rateLimitInfo.resetTime
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <span className='font-medium'>
                                                    Health Score:
                                                </span>
                                                <div className='ml-2'>
                                                    <div
                                                        className={getHealthScoreColor(
                                                            provider.healthScore
                                                        )}
                                                    >
                                                        {provider.healthScore}
                                                        /100
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {provider.lastError && (
                                            <div>
                                                <span className='font-medium text-red-500'>
                                                    Last Error:
                                                </span>
                                                <div className='ml-2 text-red-400'>
                                                    {provider.lastError.message}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Unavailable Providers */}
                    {showInactive && unavailableProviders.length > 0 && (
                        <>
                            {availableProviders.length > 0 && (
                                <div
                                    className={`mt-2 border-t pt-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}
                                >
                                    <span
                                        className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                    >
                                        Unavailable Providers
                                    </span>
                                </div>
                            )}

                            {unavailableProviders.map((provider) => {
                                const statusInfo =
                                    getProviderStatusInfo(provider);

                                return (
                                    <div
                                        key={provider.id}
                                        className={`rounded-lg border p-3 opacity-60 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
                                    >
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center space-x-3'>
                                                {statusInfo.icon}
                                                <div>
                                                    <span
                                                        className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                                    >
                                                        {provider.name}
                                                    </span>
                                                    <p
                                                        className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                                    >
                                                        {statusInfo.message}
                                                    </p>
                                                </div>
                                            </div>

                                            {onRetryProvider && (
                                                <button
                                                    onClick={() =>
                                                        onRetryProvider(
                                                            provider.id
                                                        )
                                                    }
                                                    className={`rounded p-1 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                                    title='Retry provider'
                                                >
                                                    <RefreshCw className='size-4' />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Summary */}
                    <div
                        className={`mt-3 border-t pt-3 text-xs ${theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-600'}`}
                    >
                        <div className='flex justify-between'>
                            <span>Total providers: {providers.length}</span>
                            <span>Available: {availableProviders.length}</span>
                        </div>
                        {availableProviders.length === 0 && (
                            <div className='mt-1 text-center text-red-500'>
                                No providers available for search
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderStatusPanel;

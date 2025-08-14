'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    CheckCircle,
    AlertCircle,
    XCircle,
    Clock,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import type { ProviderStatus } from '@src/types/media-search';

interface ProviderStatusIndicatorProps {
    providers: ProviderStatus[];
    activeProviders: string[];
    onToggleProvider: (providerId: string) => void;
    showDetails?: boolean;
    className?: string;
}

interface ProviderCardProps {
    provider: ProviderStatus;
    isActive: boolean;
    onToggle: () => void;
    showDetails: boolean;
    theme: 'light' | 'dark';
}

const ProviderCard: React.FC<ProviderCardProps> = ({
    provider,
    isActive,
    onToggle,
    showDetails,
    theme,
}) => {
    const getStatusIcon = () => {
        if (!provider.isAvailable) {
            return <XCircle className='size-4 text-red-500' />;
        }
        if (provider.healthScore >= 90) {
            return <CheckCircle className='size-4 text-green-500' />;
        }
        if (provider.healthScore >= 70) {
            return <AlertTriangle className='size-4 text-yellow-500' />;
        }
        return <AlertCircle className='size-4 text-red-500' />;
    };

    const getStatusText = () => {
        if (!provider.isAvailable) {
            return 'Unavailable';
        }
        if (provider.healthScore >= 90) {
            return 'Excellent';
        }
        if (provider.healthScore >= 70) {
            return 'Good';
        }
        return 'Poor';
    };

    const getStatusColor = () => {
        if (!provider.isAvailable) {
            return 'text-red-500';
        }
        if (provider.healthScore >= 90) {
            return 'text-green-500';
        }
        if (provider.healthScore >= 70) {
            return 'text-yellow-500';
        }
        return 'text-red-500';
    };

    const getRateLimitStatus = () => {
        const { remaining = 0, requests } = provider.rateLimit;
        const percentage = (remaining / requests) * 100;

        if (percentage > 50) {
            return {
                color: 'text-green-500',
                icon: <Zap className='size-3' />,
            };
        }
        if (percentage > 20) {
            return {
                color: 'text-yellow-500',
                icon: <Clock className='size-3' />,
            };
        }
        return {
            color: 'text-red-500',
            icon: <AlertCircle className='size-3' />,
        };
    };

    const rateLimitStatus = getRateLimitStatus();

    return (
        <div
            className={`rounded-lg border p-3 transition-all ${
                isActive
                    ? 'border-revlr-primary-blue bg-revlr-primary-blue/5'
                    : theme === 'dark'
                      ? 'border-revlr-dark-border bg-revlr-dark-card hover:border-revlr-primary-blue/50'
                      : 'border-gray-200 bg-white hover:border-revlr-primary-blue/50'
            }`}
        >
            <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                    <label className='flex cursor-pointer items-center'>
                        <input
                            type='checkbox'
                            checked={isActive}
                            onChange={onToggle}
                            className='rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                            aria-label={`Toggle ${provider.name} provider`}
                        />
                    </label>
                    <div>
                        <div className='flex items-center space-x-2'>
                            <h4
                                className={`font-inter text-sm font-medium capitalize ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                {provider.name}
                            </h4>
                            {getStatusIcon()}
                        </div>
                        {showDetails && (
                            <div className='mt-1 flex items-center space-x-3'>
                                <span
                                    className={`font-inter text-xs ${getStatusColor()}`}
                                >
                                    {getStatusText()}
                                </span>
                                <div className='flex items-center space-x-1'>
                                    {rateLimitStatus.icon}
                                    <span
                                        className={`font-inter text-xs ${rateLimitStatus.color}`}
                                    >
                                        {provider.rateLimit.remaining || 0}/
                                        {provider.rateLimit.requests}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {showDetails && (
                    <div className='text-right'>
                        <div
                            className={`font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Health: {provider.healthScore}%
                        </div>
                        {provider.lastError && (
                            <div className='mt-1'>
                                <span className='inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800'>
                                    Error
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showDetails && provider.lastError && (
                <div
                    className={`mt-2 rounded-lg p-2 ${
                        theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                    }`}
                >
                    <p
                        className={`font-inter text-xs ${
                            theme === 'dark' ? 'text-red-400' : 'text-red-700'
                        }`}
                    >
                        {provider.lastError.message}
                    </p>
                    {provider.lastError.retryAfter && (
                        <p
                            className={`mt-1 font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-red-300'
                                    : 'text-red-600'
                            }`}
                        >
                            Retry in{' '}
                            {Math.ceil(provider.lastError.retryAfter / 60)}{' '}
                            minutes
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export const ProviderStatusIndicator: React.FC<
    ProviderStatusIndicatorProps
> = ({
    providers,
    activeProviders,
    onToggleProvider,
    showDetails = false,
    className = '',
}) => {
    const { theme } = useTheme();

    const availableCount = providers.filter((p) => p.isAvailable).length;
    const activeCount = activeProviders.length;
    const healthyCount = providers.filter(
        (p) => p.isAvailable && p.healthScore >= 70
    ).length;

    if (providers.length === 0) {
        return (
            <div
                className={`rounded-lg border p-4 text-center ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-gray-50'
                } ${className}`}
            >
                <AlertCircle
                    className={`mx-auto mb-2 size-8 ${
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`}
                />
                <p
                    className={`font-inter text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                    No media providers available
                </p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* Summary */}
            <div
                className={`mb-4 rounded-lg border p-3 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-gray-50'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <div>
                        <h3
                            className={`font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Provider Status
                        </h3>
                        <div className='mt-1 flex items-center space-x-4'>
                            <span
                                className={`font-inter text-xs ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                {activeCount}/{availableCount} active
                            </span>
                            <span
                                className={`font-inter text-xs ${
                                    healthyCount === availableCount
                                        ? 'text-green-500'
                                        : 'text-yellow-500'
                                }`}
                            >
                                {healthyCount} healthy
                            </span>
                        </div>
                    </div>
                    <div className='flex items-center space-x-1'>
                        {availableCount === providers.length ? (
                            <CheckCircle className='size-5 text-green-500' />
                        ) : availableCount > 0 ? (
                            <AlertTriangle className='size-5 text-yellow-500' />
                        ) : (
                            <XCircle className='size-5 text-red-500' />
                        )}
                    </div>
                </div>
            </div>

            {/* Provider Cards */}
            <div className='space-y-2'>
                {providers.map((provider) => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isActive={activeProviders.includes(provider.id)}
                        onToggle={() => onToggleProvider(provider.id)}
                        showDetails={showDetails}
                        theme={theme}
                    />
                ))}
            </div>

            {/* Global Actions */}
            {providers.length > 1 && (
                <div className='mt-4 flex space-x-2'>
                    <button
                        onClick={() => {
                            const availableProviders = providers
                                .filter((p) => p.isAvailable)
                                .map((p) => p.id);
                            availableProviders.forEach((id) => {
                                if (!activeProviders.includes(id)) {
                                    onToggleProvider(id);
                                }
                            });
                        }}
                        className={`flex-1 rounded-lg border px-3 py-2 font-inter text-xs font-medium transition-colors ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Enable All
                    </button>
                    <button
                        onClick={() => {
                            activeProviders.forEach((id) =>
                                onToggleProvider(id)
                            );
                        }}
                        className={`flex-1 rounded-lg border px-3 py-2 font-inter text-xs font-medium transition-colors ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Disable All
                    </button>
                </div>
            )}
        </div>
    );
};

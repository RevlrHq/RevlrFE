'use client';

import React from 'react';
import { useMediaProviderInitialization } from '@/providers/MediaProviderInitializationProvider';
import { InitializationErrorSeverity } from '@/lib/services/media/InitializationErrorHandler';

interface MediaProviderErrorDisplayProps {
    showInProduction?: boolean;
    className?: string;
}

export function MediaProviderErrorDisplay({
    showInProduction = false,
    className = '',
}: MediaProviderErrorDisplayProps) {
    const {
        detailedErrors,
        recommendations,
        shouldContinue,
        initializationResult,
        isInitializing,
    } = useMediaProviderInitialization();

    // Only show in development unless explicitly enabled for production
    if (!showInProduction && process.env.NODE_ENV === 'production') {
        return null;
    }

    // Don't show anything if still initializing or no errors
    if (isInitializing || detailedErrors.length === 0) {
        return null;
    }

    const getSeverityColor = (
        severity: InitializationErrorSeverity
    ): string => {
        switch (severity) {
            case InitializationErrorSeverity.CRITICAL:
                return 'border-red-500 bg-red-50 text-red-900';
            case InitializationErrorSeverity.HIGH:
                return 'border-orange-500 bg-orange-50 text-orange-900';
            case InitializationErrorSeverity.MEDIUM:
                return 'border-yellow-500 bg-yellow-50 text-yellow-900';
            case InitializationErrorSeverity.LOW:
                return 'border-blue-500 bg-blue-50 text-blue-900';
            default:
                return 'border-gray-500 bg-gray-50 text-gray-900';
        }
    };

    const getSeverityIcon = (severity: InitializationErrorSeverity): string => {
        switch (severity) {
            case InitializationErrorSeverity.CRITICAL:
                return '🚨';
            case InitializationErrorSeverity.HIGH:
                return '⚠️';
            case InitializationErrorSeverity.MEDIUM:
                return '⚡';
            case InitializationErrorSeverity.LOW:
                return 'ℹ️';
            default:
                return '❓';
        }
    };

    return (
        <div className={`fixed right-4 top-4 z-50 max-w-md ${className}`}>
            <div className='rounded-lg border border-gray-300 bg-white p-4 shadow-lg'>
                <div className='mb-3 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                        Media Provider Issues
                    </h3>
                    <div className='flex items-center space-x-2'>
                        {!shouldContinue && (
                            <span className='font-medium text-red-600'>
                                Critical
                            </span>
                        )}
                        <span className='text-sm text-gray-500'>
                            {detailedErrors.length} error
                            {detailedErrors.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Status Summary */}
                <div className='mb-4 rounded-md bg-gray-50 p-3'>
                    <div className='text-sm'>
                        <div className='flex justify-between'>
                            <span>Initialized:</span>
                            <span className='font-medium'>
                                {initializationResult?.initializedProviders
                                    .length || 0}{' '}
                                provider(s)
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Failed:</span>
                            <span className='font-medium text-red-600'>
                                {initializationResult?.failedProviders.length ||
                                    0}{' '}
                                provider(s)
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Can Continue:</span>
                            <span
                                className={`font-medium ${shouldContinue ? 'text-green-600' : 'text-red-600'}`}
                            >
                                {shouldContinue ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error List */}
                <div className='mb-4 max-h-60 space-y-2 overflow-y-auto'>
                    {detailedErrors.map((error, index) => (
                        <div
                            key={index}
                            className={`rounded-md border p-3 ${getSeverityColor(error.severity)}`}
                        >
                            <div className='flex items-start space-x-2'>
                                <span className='text-lg'>
                                    {getSeverityIcon(error.severity)}
                                </span>
                                <div className='min-w-0 flex-1'>
                                    <div className='flex items-center justify-between'>
                                        <h4 className='text-sm font-medium'>
                                            {error.providerId}
                                        </h4>
                                        <span className='text-xs font-medium uppercase'>
                                            {error.category}
                                        </span>
                                    </div>
                                    <p className='mt-1 break-words text-sm'>
                                        {error.error}
                                    </p>
                                    {error.canRetry && (
                                        <div className='mt-1 text-xs opacity-75'>
                                            Can retry{' '}
                                            {error.retryDelay
                                                ? `in ${error.retryDelay}ms`
                                                : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className='border-t pt-3'>
                        <h4 className='mb-2 text-sm font-medium text-gray-900'>
                            💡 Recommendations:
                        </h4>
                        <ul className='space-y-1 text-xs text-gray-700'>
                            {recommendations.slice(0, 3).map((rec, index) => (
                                <li
                                    key={index}
                                    className='flex items-start space-x-1'
                                >
                                    <span className='text-gray-400'>•</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                            {recommendations.length > 3 && (
                                <li className='italic text-gray-500'>
                                    ... and {recommendations.length - 3} more
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Development Note */}
                <div className='mt-3 border-t pt-3 text-xs text-gray-500'>
                    This panel is only visible in development mode.
                </div>
            </div>
        </div>
    );
}

export default MediaProviderErrorDisplay;

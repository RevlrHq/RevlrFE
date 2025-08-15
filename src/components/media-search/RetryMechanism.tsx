'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Zap,
    Timer,
} from 'lucide-react';

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number; // in milliseconds
    backoffMultiplier: number;
    jitter: boolean;
    retryableErrors: string[];
}

export interface RetryAttempt {
    attempt: number;
    timestamp: number;
    error?: string;
    success: boolean;
    duration: number;
}

interface RetryMechanismProps {
    onRetry: () => Promise<void>;
    config?: Partial<RetryConfig>;
    disabled?: boolean;
    showHistory?: boolean;
    className?: string;
}

const DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
        'network',
        'timeout',
        'rate_limit',
        'temporary',
        'unavailable',
    ],
};

export const RetryMechanism: React.FC<RetryMechanismProps> = ({
    onRetry,
    config = {},
    disabled = false,
    showHistory = false,
    className = '',
}) => {
    const { theme } = useTheme();
    const [isRetrying, setIsRetrying] = useState(false);
    const [currentAttempt, setCurrentAttempt] = useState(0);
    const [retryHistory, setRetryHistory] = useState<RetryAttempt[]>([]);
    const [, setNextRetryTime] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // Calculate delay with exponential backoff and optional jitter
    const calculateDelay = useCallback(
        (attempt: number): number => {
            const baseDelay =
                finalConfig.baseDelay *
                Math.pow(finalConfig.backoffMultiplier, attempt - 1);

            if (finalConfig.jitter) {
                // Add random jitter (±25%)
                const jitterRange = baseDelay * 0.25;
                const jitter = (Math.random() - 0.5) * 2 * jitterRange;
                return Math.max(100, baseDelay + jitter);
            }

            return baseDelay;
        },
        [finalConfig]
    );

    // Handle retry with exponential backoff
    const handleRetry = useCallback(
        async (manual: boolean = false) => {
            if (disabled || isRetrying) return;

            const attempt = manual ? 1 : currentAttempt + 1;

            if (attempt > finalConfig.maxAttempts) {
                console.warn('Max retry attempts reached');
                return;
            }

            setIsRetrying(true);
            setCurrentAttempt(attempt);

            const startTime = Date.now();

            try {
                await onRetry();

                const duration = Date.now() - startTime;
                const successAttempt: RetryAttempt = {
                    attempt,
                    timestamp: startTime,
                    success: true,
                    duration,
                };

                setRetryHistory((prev) => [...prev, successAttempt]);
                setCurrentAttempt(0);
                setNextRetryTime(null);
                setCountdown(null);
            } catch (error) {
                const duration = Date.now() - startTime;
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';

                const failedAttempt: RetryAttempt = {
                    attempt,
                    timestamp: startTime,
                    error: errorMessage,
                    success: false,
                    duration,
                };

                setRetryHistory((prev) => [...prev, failedAttempt]);

                // Schedule next retry if we haven't exceeded max attempts
                if (attempt < finalConfig.maxAttempts) {
                    const delay = calculateDelay(attempt);
                    const nextRetry = Date.now() + delay;
                    setNextRetryTime(nextRetry);
                    setCountdown(Math.ceil(delay / 1000));

                    setTimeout(() => {
                        handleRetry(false);
                    }, delay);
                } else {
                    setCurrentAttempt(0);
                    setNextRetryTime(null);
                    setCountdown(null);
                }
            } finally {
                setIsRetrying(false);
            }
        },
        [
            disabled,
            isRetrying,
            currentAttempt,
            finalConfig,
            onRetry,
            calculateDelay,
        ]
    );

    // Countdown timer
    useEffect(() => {
        if (countdown === null || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    // Reset retry state when disabled
    useEffect(() => {
        if (disabled) {
            setIsRetrying(false);
            setCurrentAttempt(0);
            setNextRetryTime(null);
            setCountdown(null);
        }
    }, [disabled]);

    const getRetryButtonState = () => {
        if (disabled) {
            return {
                text: 'Retry Disabled',
                icon: <XCircle className='h-4 w-4' />,
                className: 'opacity-50 cursor-not-allowed',
                disabled: true,
            };
        }

        if (isRetrying) {
            return {
                text: `Retrying... (${currentAttempt}/${finalConfig.maxAttempts})`,
                icon: <RefreshCw className='h-4 w-4 animate-spin' />,
                className: 'opacity-75',
                disabled: true,
            };
        }

        if (countdown !== null && countdown > 0) {
            return {
                text: `Retry in ${countdown}s`,
                icon: <Timer className='h-4 w-4' />,
                className: 'opacity-75',
                disabled: true,
            };
        }

        if (currentAttempt >= finalConfig.maxAttempts) {
            return {
                text: 'Max Attempts Reached',
                icon: <XCircle className='h-4 w-4' />,
                className: 'opacity-50',
                disabled: true,
            };
        }

        return {
            text:
                currentAttempt > 0
                    ? `Retry (${currentAttempt}/${finalConfig.maxAttempts})`
                    : 'Retry',
            icon: <RefreshCw className='h-4 w-4' />,
            className: 'hover:bg-blue-700',
            disabled: false,
        };
    };

    const buttonState = getRetryButtonState();
    const lastAttempt = retryHistory[retryHistory.length - 1];
    const consecutiveFailures = retryHistory
        .slice()
        .reverse()
        .findIndex((attempt) => attempt.success);

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Retry Button */}
            <button
                onClick={() => handleRetry(true)}
                disabled={buttonState.disabled}
                className={`inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors ${buttonState.className}`}
            >
                {buttonState.icon}
                <span>{buttonState.text}</span>
            </button>

            {/* Status Information */}
            {(currentAttempt > 0 || lastAttempt) && (
                <div
                    className={`rounded-lg border p-3 ${
                        theme === 'dark'
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <div className='mb-2 flex items-center space-x-2'>
                        {isRetrying ? (
                            <>
                                <RefreshCw className='h-4 w-4 animate-spin text-blue-500' />
                                <span
                                    className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                >
                                    Attempting to reconnect...
                                </span>
                            </>
                        ) : lastAttempt?.success ? (
                            <>
                                <CheckCircle className='h-4 w-4 text-green-500' />
                                <span
                                    className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                >
                                    Connection restored
                                </span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className='h-4 w-4 text-red-500' />
                                <span
                                    className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                >
                                    Connection failed
                                </span>
                            </>
                        )}
                    </div>

                    {/* Progress indicator */}
                    {currentAttempt > 0 && (
                        <div className='mb-2'>
                            <div className='mb-1 flex justify-between text-xs'>
                                <span
                                    className={
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }
                                >
                                    Attempt {currentAttempt} of{' '}
                                    {finalConfig.maxAttempts}
                                </span>
                                {countdown !== null && countdown > 0 && (
                                    <span
                                        className={
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }
                                    >
                                        Next retry in {countdown}s
                                    </span>
                                )}
                            </div>
                            <div
                                className={`h-2 w-full rounded-full bg-gray-200 ${theme === 'dark' ? 'bg-gray-700' : ''}`}
                            >
                                <div
                                    className='h-2 rounded-full bg-blue-600 transition-all duration-300'
                                    style={{
                                        width: `${(currentAttempt / finalConfig.maxAttempts) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Last error */}
                    {lastAttempt && !lastAttempt.success && (
                        <p
                            className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            Last error: {lastAttempt.error}
                        </p>
                    )}
                </div>
            )}

            {/* Retry History */}
            {showHistory && retryHistory.length > 0 && (
                <div
                    className={`rounded-lg border p-3 ${
                        theme === 'dark'
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <h4
                        className={`mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                    >
                        Retry History
                    </h4>
                    <div className='max-h-32 space-y-1 overflow-y-auto'>
                        {retryHistory.slice(-5).map((attempt, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between text-xs'
                            >
                                <div className='flex items-center space-x-2'>
                                    {attempt.success ? (
                                        <CheckCircle className='h-3 w-3 text-green-500' />
                                    ) : (
                                        <XCircle className='h-3 w-3 text-red-500' />
                                    )}
                                    <span
                                        className={
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }
                                    >
                                        Attempt {attempt.attempt}
                                    </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <span
                                        className={
                                            theme === 'dark'
                                                ? 'text-gray-500'
                                                : 'text-gray-500'
                                        }
                                    >
                                        {attempt.duration}ms
                                    </span>
                                    <span
                                        className={
                                            theme === 'dark'
                                                ? 'text-gray-500'
                                                : 'text-gray-500'
                                        }
                                    >
                                        {new Date(
                                            attempt.timestamp
                                        ).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary stats */}
                    <div
                        className={`mt-2 border-t pt-2 text-xs ${
                            theme === 'dark'
                                ? 'border-gray-700 text-gray-400'
                                : 'border-gray-200 text-gray-600'
                        }`}
                    >
                        <div className='flex justify-between'>
                            <span>Success rate:</span>
                            <span>
                                {Math.round(
                                    (retryHistory.filter((a) => a.success)
                                        .length /
                                        retryHistory.length) *
                                        100
                                )}
                                %
                            </span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Avg duration:</span>
                            <span>
                                {Math.round(
                                    retryHistory.reduce(
                                        (sum, a) => sum + a.duration,
                                        0
                                    ) / retryHistory.length
                                )}
                                ms
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tips */}
            {consecutiveFailures >= 2 && (
                <div
                    className={`rounded-lg border p-3 ${
                        theme === 'dark'
                            ? 'border-yellow-700 bg-yellow-900/20'
                            : 'border-yellow-200 bg-yellow-50'
                    }`}
                >
                    <div className='flex items-start space-x-2'>
                        <Zap className='mt-0.5 h-4 w-4 text-yellow-500' />
                        <div>
                            <p
                                className={`text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-yellow-200'
                                        : 'text-yellow-800'
                                }`}
                            >
                                Multiple failures detected
                            </p>
                            <p
                                className={`mt-1 text-xs ${
                                    theme === 'dark'
                                        ? 'text-yellow-300'
                                        : 'text-yellow-700'
                                }`}
                            >
                                Consider checking your internet connection or
                                trying again later.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetryMechanism;

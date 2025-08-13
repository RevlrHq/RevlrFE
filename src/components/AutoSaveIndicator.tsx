'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface AutoSaveIndicatorProps {
    isSaving: boolean;
    lastSaved?: Date;
    hasUnsavedChanges: boolean;
    hasError?: boolean;
    isOnline: boolean;
    onRetry?: () => void;
    className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    hasError = false,
    isOnline,
    onRetry,
    className = '',
}) => {
    const { theme } = useTheme();
    const [timeAgo, setTimeAgo] = useState<string>('');

    // Update time ago display
    useEffect(() => {
        if (!lastSaved) return;

        const updateTimeAgo = () => {
            const now = new Date();
            const diff = now.getTime() - lastSaved.getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            if (seconds < 60) {
                setTimeAgo('just now');
            } else if (minutes < 60) {
                setTimeAgo(`${minutes}m ago`);
            } else if (hours < 24) {
                setTimeAgo(`${hours}h ago`);
            } else {
                setTimeAgo(lastSaved.toLocaleDateString());
            }
        };

        updateTimeAgo();
        const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [lastSaved]);

    const getStatusIcon = () => {
        if (isSaving) {
            return (
                <div className='flex items-center space-x-2'>
                    <div className='size-3 animate-spin rounded-full border-2 border-revlr-primary-blue border-t-transparent' />
                    <span className='text-revlr-primary-blue'>Saving...</span>
                </div>
            );
        }

        if (hasError) {
            return (
                <div className='flex items-center space-x-2'>
                    <svg
                        className='size-3 text-red-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                        aria-hidden='true'
                    >
                        <path
                            fillRule='evenodd'
                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                        />
                    </svg>
                    <span className='text-red-500'>Save failed</span>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className='text-xs text-revlr-primary-blue underline hover:text-revlr-primary-blue/80'
                        >
                            Retry
                        </button>
                    )}
                </div>
            );
        }

        if (!isOnline) {
            return (
                <div className='flex items-center space-x-2'>
                    <svg
                        className='size-3 text-yellow-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                        aria-hidden='true'
                    >
                        <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                        />
                    </svg>
                    <span className='text-yellow-600'>
                        Offline - saved locally
                    </span>
                </div>
            );
        }

        if (hasUnsavedChanges) {
            return (
                <div className='flex items-center space-x-2'>
                    <div className='size-2 rounded-full bg-yellow-500' />
                    <span
                        className={
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }
                    >
                        Unsaved changes
                    </span>
                </div>
            );
        }

        if (lastSaved) {
            return (
                <div className='flex items-center space-x-2'>
                    <svg
                        className='size-3 text-green-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                        aria-hidden='true'
                    >
                        <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                        />
                    </svg>
                    <span className='text-green-600'>Saved {timeAgo}</span>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={`flex items-center font-inter text-xs ${className}`}>
            {getStatusIcon()}
        </div>
    );
};

// Recovery prompt component
interface RecoveryPromptProps {
    isOpen: boolean;
    onRestore: () => void;
    onDiscard: () => void;
    onClose: () => void;
    lastSaved?: Date;
}

export const RecoveryPrompt: React.FC<RecoveryPromptProps> = ({
    isOpen,
    onRestore,
    onDiscard,
    onClose,
    lastSaved,
}) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div
                className={`w-full max-w-md rounded-xl p-6 shadow-xl ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-start space-x-3'>
                    <div className='shrink-0'>
                        <svg
                            className='size-6 text-revlr-primary-blue'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            aria-hidden='true'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                        </svg>
                    </div>
                    <div className='flex-1'>
                        <h3
                            className={`font-inter text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Restore Previous Work?
                        </h3>
                        <p
                            className={`mt-2 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            We found unsaved changes from your previous session
                            {lastSaved &&
                                ` from ${lastSaved.toLocaleString()}`}. Would
                            you like to restore them?
                        </p>
                    </div>
                </div>

                <div className='mt-6 flex space-x-3'>
                    <button
                        onClick={onRestore}
                        className='flex-1 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20'
                    >
                        Restore
                    </button>
                    <button
                        onClick={onDiscard}
                        className={`flex-1 rounded-xl px-4 py-2 font-inter font-medium transition-all duration-200 focus:outline-none focus:ring-2 ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80 focus:ring-gray-500/20'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500/20'
                        }`}
                    >
                        Start Fresh
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className={`mt-3 w-full text-center font-inter text-sm transition-colors duration-200 ${
                        theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-500 hover:text-gray-600'
                    }`}
                >
                    Decide later
                </button>
            </div>
        </div>
    );
};

export default AutoSaveIndicator;

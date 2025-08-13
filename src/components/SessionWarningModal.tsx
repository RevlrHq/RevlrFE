'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@lib/ThemeContext';

interface SessionWarningModalProps {
    isOpen: boolean;
    minutesLeft: number;
    onExtendSession: () => Promise<boolean>;
    onLogout: () => void;
    onClose: () => void;
}

export const SessionWarningModal = ({
    isOpen,
    minutesLeft,
    onExtendSession,
    onLogout,
    onClose,
}: SessionWarningModalProps) => {
    const { theme } = useTheme();
    const [isExtending, setIsExtending] = useState(false);
    const [countdown, setCountdown] = useState(minutesLeft);

    // Update countdown every minute
    useEffect(() => {
        if (!isOpen) return;

        setCountdown(minutesLeft);

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isOpen, minutesLeft, onLogout]);

    const handleExtendSession = async () => {
        setIsExtending(true);
        try {
            const success = await onExtendSession();
            if (success) {
                onClose();
            } else {
                // If extension failed, show error or logout
                alert('Failed to extend session. Please log in again.');
                onLogout();
            }
        } catch (error) {
            console.error('Error extending session:', error);
            alert('Failed to extend session. Please log in again.');
            onLogout();
        } finally {
            setIsExtending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
            <div
                className={`w-full max-w-md rounded-xl border p-6 shadow-xl ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                        : 'border-gray-200 bg-white text-gray-900'
                }`}
            >
                {/* Warning Icon */}
                <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20'>
                    <svg
                        className='size-6 text-yellow-600 dark:text-yellow-400'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                        />
                    </svg>
                </div>

                {/* Title */}
                <h3 className='mb-2 text-center font-inter text-lg font-semibold'>
                    Session Expiring Soon
                </h3>

                {/* Message */}
                <p
                    className={`mb-6 text-center font-inter text-sm ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}
                >
                    Your session will expire in{' '}
                    <span className='font-semibold text-yellow-600 dark:text-yellow-400'>
                        {countdown} minute{countdown !== 1 ? 's' : ''}
                    </span>
                    . Any unsaved work will be automatically backed up.
                </p>

                {/* Countdown Progress */}
                <div className='mb-6'>
                    <div
                        className={`h-2 rounded-full ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
                    >
                        <div
                            className='h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000'
                            style={{
                                width: `${Math.max(0, (countdown / minutesLeft) * 100)}%`,
                            }}
                        />
                    </div>
                    <p
                        className={`mt-2 text-center font-inter text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        Time remaining: {countdown} of {minutesLeft} minutes
                    </p>
                </div>

                {/* Action Buttons */}
                <div className='flex space-x-3'>
                    <button
                        onClick={onLogout}
                        className={`flex-1 rounded-xl border px-4 py-2 font-inter text-sm font-medium transition-all duration-200 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Logout Now
                    </button>

                    <button
                        onClick={handleExtendSession}
                        disabled={isExtending}
                        className='flex-1 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 font-inter text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isExtending ? (
                            <div className='flex items-center justify-center space-x-2'>
                                <div className='size-3 animate-spin rounded-full border border-white border-t-transparent'></div>
                                <span>Extending...</span>
                            </div>
                        ) : (
                            'Stay Logged In'
                        )}
                    </button>
                </div>

                {/* Additional Info */}
                <div
                    className={`mt-4 rounded-lg p-3 ${
                        theme === 'dark'
                            ? 'bg-revlr-dark-border/20'
                            : 'bg-gray-50'
                    }`}
                >
                    <p
                        className={`font-inter text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        <strong>Note:</strong> Your form data will be
                        automatically saved locally if your session expires, so
                        you won't lose your work.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningModal;

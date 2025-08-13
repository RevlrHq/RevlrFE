'use client';

import { useRouter } from 'next/navigation';

interface PaymentFailureProps {
    eventName?: string;
    errorMessage?: string;
    paymentReference?: string;
    isVisible: boolean;
    onClose: () => void;
    onRetry?: () => void;
}

const PaymentFailure = ({
    eventName,
    errorMessage = 'Payment could not be processed',
    paymentReference,
    isVisible,
    onClose,
    onRetry,
}: PaymentFailureProps) => {
    const router = useRouter();

    if (!isVisible) return null;

    const handleRetryPayment = () => {
        if (onRetry) {
            onRetry();
        }
        onClose();
    };

    const handleGoBack = () => {
        router.back();
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='relative mx-4 w-full max-w-md'>
                <div className='rounded-2xl border border-gray-200/50 bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:border-revlr-dark-border dark:bg-revlr-dark-card/95'>
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className='absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-revlr-dark-bg dark:hover:text-gray-300'
                    >
                        <svg
                            className='size-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>

                    {/* Error Icon */}
                    <div className='mb-6 text-center'>
                        <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600'>
                            <svg
                                className='size-8 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </div>
                        <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                            Payment Failed
                        </h2>
                        <p className='mt-2 text-gray-600 dark:text-gray-400'>
                            We couldn&apos;t process your payment
                        </p>
                    </div>

                    {/* Event Details */}
                    {eventName && (
                        <div className='mb-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/50'>
                            <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                                Event
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {eventName}
                            </p>
                        </div>
                    )}

                    {/* Error Details */}
                    <div className='mb-6 rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-800/30 dark:bg-red-900/20'>
                        <div className='flex items-start gap-3'>
                            <div className='rounded-lg bg-red-500 p-2'>
                                <svg
                                    className='size-4 text-white'
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
                            <div>
                                <h4 className='font-semibold text-red-900 dark:text-red-100'>
                                    What went wrong?
                                </h4>
                                <p className='text-sm text-red-700 dark:text-red-200'>
                                    {errorMessage}
                                </p>
                                {paymentReference && (
                                    <p className='mt-2 text-xs text-red-600 dark:text-red-300'>
                                        Reference: {paymentReference}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Common Issues */}
                    <div className='mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-900/20'>
                        <div className='flex items-start gap-3'>
                            <div className='rounded-lg bg-blue-500 p-2'>
                                <svg
                                    className='size-4 text-white'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className='font-semibold text-blue-900 dark:text-blue-100'>
                                    Common Issues
                                </h4>
                                <ul className='mt-1 text-sm text-blue-700 dark:text-blue-200'>
                                    <li>
                                        • Insufficient funds in your account
                                    </li>
                                    <li>• Card expired or blocked</li>
                                    <li>• Network connection issues</li>
                                    <li>• Bank security restrictions</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='space-y-3'>
                        {onRetry && (
                            <button
                                onClick={handleRetryPayment}
                                className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                            >
                                Try Again
                            </button>
                        )}

                        <button
                            onClick={handleGoBack}
                            className='w-full rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-white dark:hover:bg-revlr-dark-bg'
                        >
                            Go Back
                        </button>

                        <button
                            onClick={handleClose}
                            className='w-full rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 dark:bg-revlr-dark-bg dark:text-gray-300 dark:hover:bg-revlr-dark-border'
                        >
                            Close
                        </button>
                    </div>

                    {/* Support Info */}
                    <div className='mt-6 text-center'>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                            Need help? Contact our support team for assistance
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;

'use client';

import { useRouter } from 'next/navigation';

interface RegistrationSuccessProps {
    eventName?: string;
    registrationId?: string;
    paymentReference?: string;
    isVisible: boolean;
    onClose: () => void;
}

const RegistrationSuccess = ({
    eventName,
    registrationId,
    paymentReference,
    isVisible,
    onClose,
}: RegistrationSuccessProps) => {
    const router = useRouter();

    if (!isVisible) return null;

    const handleViewTicket = () => {
        // Navigate to user's tickets/registrations page
        router.push('/dashboard');
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

                    {/* Success Icon */}
                    <div className='mb-6 text-center'>
                        <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-revlr-accent-green to-green-500'>
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
                                    d='M5 13l4 4L19 7'
                                />
                            </svg>
                        </div>
                        <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                            Registration Successful!
                        </h2>
                        <p className='mt-2 text-gray-600 dark:text-gray-400'>
                            You have successfully registered for the event
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

                    {/* Registration Details */}
                    <div className='mb-6 space-y-3'>
                        {registrationId && (
                            <div className='flex justify-between text-sm'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Registration ID:
                                </span>
                                <span className='font-medium text-gray-900 dark:text-white'>
                                    {registrationId.slice(0, 8)}...
                                </span>
                            </div>
                        )}

                        {paymentReference && (
                            <div className='flex justify-between text-sm'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Payment Reference:
                                </span>
                                <span className='font-medium text-gray-900 dark:text-white'>
                                    {paymentReference}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Next Steps */}
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
                                    What&apos;s Next?
                                </h4>
                                <p className='text-sm text-blue-700 dark:text-blue-200'>
                                    You&apos;ll receive a confirmation email
                                    with your ticket details shortly. Keep an
                                    eye on your inbox for event updates.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='space-y-3'>
                        <button
                            onClick={handleViewTicket}
                            className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                        >
                            View My Tickets
                        </button>

                        <button
                            onClick={handleClose}
                            className='w-full rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-white dark:hover:bg-revlr-dark-bg'
                        >
                            Continue Browsing
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccess;

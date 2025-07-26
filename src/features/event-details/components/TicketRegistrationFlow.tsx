'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventView } from '../../../lib/services/models/EventView';

interface TicketSelection {
    ticketId: string;
    quantity: number;
    ticketName: string;
    ticketPrice: number;
}

interface TicketRegistrationFlowProps {
    event: EventView;
    selectedTickets: TicketSelection[];
    onClose: () => void;
}

const TicketRegistrationFlow = ({
    event,
    selectedTickets,
    onClose,
}: TicketRegistrationFlowProps) => {
    const [step, setStep] = useState<
        'auth-prompt' | 'guest-info' | 'processing'
    >('auth-prompt');
    const [guestInfo, setGuestInfo] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    const [isProcessing] = useState(false);
    const router = useRouter();

    const getTotalPrice = () => {
        return selectedTickets.reduce(
            (total, selection) =>
                total + selection.ticketPrice * selection.quantity,
            0
        );
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(price);
    };

    const handleSignIn = () => {
        // Store the intended action in localStorage to redirect back after login
        localStorage.setItem(
            'postLoginAction',
            JSON.stringify({
                type: 'register-for-event',
                eventId: event.id,
                selectedTickets: selectedTickets,
            })
        );
        router.push('/auth/login');
    };

    const handleSignUp = () => {
        // Store the intended action in localStorage to redirect back after signup
        localStorage.setItem(
            'postLoginAction',
            JSON.stringify({
                type: 'register-for-event',
                eventId: event.id,
                selectedTickets: selectedTickets,
            })
        );
        router.push('/auth');
    };

    const handleContinueAsGuest = () => {
        setStep('guest-info');
    };

    const handleGuestInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Navigate to checkout page with guest info and ticket details
        const checkoutParams = new URLSearchParams({
            eventId: event.id!,
            guestInfo: JSON.stringify(guestInfo),
            tickets: JSON.stringify(selectedTickets),
        });

        router.push(`/ticket-checkout?${checkoutParams.toString()}`);
        onClose();
    };

    const handleInputChange = (
        field: keyof typeof guestInfo,
        value: string
    ) => {
        setGuestInfo((prev) => ({ ...prev, [field]: value }));
    };

    if (step === 'auth-prompt') {
        return (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
                <div className='relative mx-4 w-full max-w-md'>
                    <div className='rounded-2xl border border-gray-200/50 bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:border-revlr-dark-border dark:bg-revlr-dark-card/95'>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
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

                        {/* Header */}
                        <div className='mb-6 text-center'>
                            <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple'>
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
                                        d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                                    />
                                </svg>
                            </div>
                            <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                                Register for Event
                            </h2>
                            <p className='mt-2 text-gray-600 dark:text-gray-400'>
                                Choose how you'd like to continue with your
                                registration
                            </p>
                        </div>

                        {/* Order Summary */}
                        <div className='mb-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/50'>
                            <h3 className='mb-3 font-semibold text-gray-900 dark:text-white'>
                                Order Summary
                            </h3>
                            <div className='space-y-2'>
                                {selectedTickets.map((ticket, index) => (
                                    <div
                                        key={index}
                                        className='flex justify-between text-sm'
                                    >
                                        <span className='text-gray-600 dark:text-gray-400'>
                                            {ticket.ticketName} ×{' '}
                                            {ticket.quantity}
                                        </span>
                                        <span className='font-medium text-gray-900 dark:text-white'>
                                            {formatPrice(
                                                ticket.ticketPrice *
                                                    ticket.quantity
                                            )}
                                        </span>
                                    </div>
                                ))}
                                <div className='border-t border-gray-200 pt-2 dark:border-revlr-dark-border'>
                                    <div className='flex justify-between font-semibold'>
                                        <span className='text-gray-900 dark:text-white'>
                                            Total
                                        </span>
                                        <span className='text-gray-900 dark:text-white'>
                                            {formatPrice(getTotalPrice())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='space-y-3'>
                            <button
                                onClick={handleSignIn}
                                className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                            >
                                Sign In to Continue
                            </button>

                            <button
                                onClick={handleSignUp}
                                className='w-full rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-white dark:hover:bg-revlr-dark-bg'
                            >
                                Create Account
                            </button>

                            <button
                                onClick={handleContinueAsGuest}
                                className='w-full rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 dark:bg-revlr-dark-bg dark:text-gray-300 dark:hover:bg-revlr-dark-border'
                            >
                                Continue as Guest
                            </button>
                        </div>

                        {/* Benefits */}
                        <div className='mt-6 text-center'>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                Creating an account helps you manage your
                                tickets and get event updates
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'guest-info') {
        return (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
                <div className='relative mx-4 w-full max-w-md'>
                    <div className='rounded-2xl border border-gray-200/50 bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:border-revlr-dark-border dark:bg-revlr-dark-card/95'>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
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

                        {/* Header */}
                        <div className='mb-6 text-center'>
                            <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                                Your Information
                            </h2>
                            <p className='mt-2 text-gray-600 dark:text-gray-400'>
                                Please provide your details to complete
                                registration
                            </p>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleGuestInfoSubmit}
                            className='space-y-4'
                        >
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label
                                        htmlFor='firstName'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                                    >
                                        First Name *
                                    </label>
                                    <input
                                        type='text'
                                        id='firstName'
                                        required
                                        value={guestInfo.firstName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'firstName',
                                                e.target.value
                                            )
                                        }
                                        className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-revlr-primary-blue focus:outline-none focus:ring-1 focus:ring-revlr-primary-blue dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor='lastName'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                                    >
                                        Last Name *
                                    </label>
                                    <input
                                        type='text'
                                        id='lastName'
                                        required
                                        value={guestInfo.lastName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'lastName',
                                                e.target.value
                                            )
                                        }
                                        className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-revlr-primary-blue focus:outline-none focus:ring-1 focus:ring-revlr-primary-blue dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor='email'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                                >
                                    Email Address *
                                </label>
                                <input
                                    type='email'
                                    id='email'
                                    required
                                    value={guestInfo.email}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'email',
                                            e.target.value
                                        )
                                    }
                                    className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-revlr-primary-blue focus:outline-none focus:ring-1 focus:ring-revlr-primary-blue dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor='phone'
                                    className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                                >
                                    Phone Number
                                </label>
                                <input
                                    type='tel'
                                    id='phone'
                                    value={guestInfo.phone}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'phone',
                                            e.target.value
                                        )
                                    }
                                    className='mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-revlr-primary-blue focus:outline-none focus:ring-1 focus:ring-revlr-primary-blue dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                />
                            </div>

                            <div className='flex gap-3 pt-4'>
                                <button
                                    type='button'
                                    onClick={() => setStep('auth-prompt')}
                                    className='flex-1 rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-900 shadow-sm transition-all duration-200 hover:bg-gray-50 dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-white dark:hover:bg-revlr-dark-bg'
                                >
                                    Back
                                </button>
                                <button
                                    type='submit'
                                    disabled={isProcessing}
                                    className='flex-1 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    {isProcessing ? (
                                        <div className='flex items-center justify-center gap-2'>
                                            <div className='size-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                                            Processing...
                                        </div>
                                    ) : (
                                        'Continue'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default TicketRegistrationFlow;

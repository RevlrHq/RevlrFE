'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Navbar } from '@components/Navbar';
import Footer from '@components/Footer';
import { useEventRegistration } from '../../hooks/useEventRegistration';

interface GuestInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface TicketInfo {
    ticketId: string;
    quantity: number;
    ticketName: string;
    ticketPrice: number;
}

const CheckoutPage = () => {
    const searchParams = useSearchParams();
    const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
    const [tickets, setTickets] = useState<TicketInfo[]>([]);
    const { registerForEvent, isLoading } = useEventRegistration();

    const eventId = searchParams.get('eventId');

    useEffect(() => {
        // Parse guest info and tickets from URL params
        const guestInfoParam = searchParams.get('guestInfo');
        const ticketsParam = searchParams.get('tickets');

        if (guestInfoParam) {
            try {
                const parsedGuestInfo = JSON.parse(guestInfoParam);
                setGuestInfo(parsedGuestInfo);
            } catch (error) {
                console.error('Error parsing guest info:', error);
            }
        }

        if (ticketsParam) {
            try {
                const parsedTickets = JSON.parse(ticketsParam);
                setTickets(parsedTickets);
            } catch (error) {
                console.error('Error parsing tickets:', error);
            }
        }

        // Fallback to legacy single ticket format
        const ticketId = searchParams.get('ticketId');
        const ticketName = searchParams.get('ticketName');
        const ticketPrice = searchParams.get('ticketPrice');

        if (ticketId && ticketName && ticketPrice && tickets.length === 0) {
            setTickets([
                {
                    ticketId,
                    quantity: 1,
                    ticketName,
                    ticketPrice: Number(ticketPrice),
                },
            ]);
        }
    }, [searchParams]);

    const getTotalPrice = () => {
        return tickets.reduce(
            (total, ticket) => total + ticket.ticketPrice * ticket.quantity,
            0
        );
    };

    const getTotalQuantity = () => {
        return tickets.reduce((total, ticket) => total + ticket.quantity, 0);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(price);
    };

    const handleConfirmPurchase = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!eventId || tickets.length === 0) {
            return;
        }

        try {
            const result = await registerForEvent({
                eventId,
                selectedTickets: tickets,
                guestInfo: guestInfo || undefined,
                isNewUser: false,
            });

            if (
                result &&
                typeof result === 'object' &&
                'success' in result &&
                result.success
            ) {
                // Registration successful - the hook will handle success messages and payment flow
                console.log('Registration completed successfully');
            }
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    //log variables for debugging
    console.log('Event ID:', eventId);
    console.log('Guest Info:', guestInfo);
    console.log('Tickets:', tickets);

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-white transition-colors duration-300 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
            <Navbar isOrganizer={false} />

            {/* Floating Background Elements */}
            <div className='pointer-events-none fixed inset-0 overflow-hidden'>
                <div className='absolute -right-40 -top-40 size-80 rounded-full bg-gradient-to-br from-revlr-primary-blue/10 to-revlr-accent-purple/10 blur-3xl'></div>
                <div className='absolute -bottom-40 -left-40 size-80 rounded-full bg-gradient-to-br from-revlr-accent-green/10 to-revlr-accent-orange/10 blur-3xl'></div>
            </div>

            <main className='relative mx-auto max-w-[1440px] px-6 pt-24 md:px-24'>
                {/* Header Section */}
                <div className='py-8 text-center'>
                    <div className='mb-6 flex justify-center'>
                        <div className='rounded-2xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple p-4'>
                            <svg
                                className='size-8 text-white'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                                />
                            </svg>
                        </div>
                    </div>
                    <h1 className='font-montserrat text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl'>
                        Complete Your{' '}
                        <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                            Purchase
                        </span>
                    </h1>
                    <p className='mt-4 text-lg text-gray-600 dark:text-gray-300'>
                        You're just one step away from securing your tickets
                    </p>
                </div>

                <div className='grid grid-cols-1 gap-8 pb-16 lg:grid-cols-3 lg:gap-12'>
                    {/* Main Content - Customer Information */}
                    <div className='lg:col-span-2'>
                        <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                            {/* Section Header */}
                            <div className='mb-8 flex items-center gap-4'>
                                <div className='rounded-xl bg-gradient-to-br from-revlr-accent-green to-revlr-accent-orange p-3'>
                                    <svg
                                        className='size-6 text-white'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                                        Your Information
                                    </h2>
                                    <p className='text-gray-600 dark:text-gray-300'>
                                        Please verify your details below
                                    </p>
                                </div>
                            </div>

                            <form
                                onSubmit={handleConfirmPurchase}
                                className='space-y-6'
                            >
                                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                                    <div className='space-y-2'>
                                        <label
                                            htmlFor='firstName'
                                            className='block text-sm font-semibold text-gray-700 dark:text-gray-300'
                                        >
                                            First Name
                                        </label>
                                        <input
                                            type='text'
                                            id='firstName'
                                            value={guestInfo?.firstName || ''}
                                            readOnly={!!guestInfo}
                                            className='block w-full rounded-xl border border-gray-200/50 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/60 dark:text-white dark:focus:bg-revlr-dark-bg'
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <label
                                            htmlFor='lastName'
                                            className='block text-sm font-semibold text-gray-700 dark:text-gray-300'
                                        >
                                            Last Name
                                        </label>
                                        <input
                                            type='text'
                                            id='lastName'
                                            value={guestInfo?.lastName || ''}
                                            readOnly={!!guestInfo}
                                            className='block w-full rounded-xl border border-gray-200/50 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/60 dark:text-white dark:focus:bg-revlr-dark-bg'
                                        />
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <label
                                        htmlFor='email'
                                        className='block text-sm font-semibold text-gray-700 dark:text-gray-300'
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type='email'
                                        id='email'
                                        value={guestInfo?.email || ''}
                                        readOnly={!!guestInfo}
                                        className='block w-full rounded-xl border border-gray-200/50 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/60 dark:text-white dark:focus:bg-revlr-dark-bg'
                                    />
                                </div>

                                {guestInfo?.phone && (
                                    <div className='space-y-2'>
                                        <label
                                            htmlFor='phone'
                                            className='block text-sm font-semibold text-gray-700 dark:text-gray-300'
                                        >
                                            Phone Number
                                        </label>
                                        <input
                                            type='tel'
                                            id='phone'
                                            value={guestInfo.phone}
                                            readOnly
                                            className='block w-full rounded-xl border border-gray-200/50 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-sm transition-all duration-200 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/60 dark:text-white dark:focus:bg-revlr-dark-bg'
                                        />
                                    </div>
                                )}

                                {/* Payment Method Section */}
                                <div className='mt-8 space-y-4'>
                                    <div className='flex items-center gap-3'>
                                        <div className='rounded-xl bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange p-2'>
                                            <svg
                                                className='size-5 text-white'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                                stroke='currentColor'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                                                />
                                            </svg>
                                        </div>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                            Payment Method
                                        </h3>
                                    </div>

                                    <div className='rounded-xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-4 dark:border-revlr-dark-border dark:from-revlr-dark-card dark:to-revlr-dark-bg/50'>
                                        <div className='flex items-center gap-3'>
                                            <div className='rounded-lg bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple p-2'>
                                                <svg
                                                    className='size-5 text-white'
                                                    fill='none'
                                                    viewBox='0 0 24 24'
                                                    stroke='currentColor'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                                                    />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className='font-medium text-gray-900 dark:text-white'>
                                                    Secure Payment Processing
                                                </p>
                                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                    Your payment will be
                                                    processed securely
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type='submit'
                                    disabled={isLoading}
                                    className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                                >
                                    {isLoading ? (
                                        <div className='flex items-center justify-center gap-3'>
                                            <div className='size-5 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                                            <span>Processing Payment...</span>
                                        </div>
                                    ) : (
                                        <div className='flex items-center justify-center gap-3'>
                                            <svg
                                                className='size-5'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                                stroke='currentColor'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                                />
                                            </svg>
                                            <span>Register & Pay</span>
                                        </div>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar - Order Summary */}
                    <div className='lg:col-span-1'>
                        <div className='sticky top-8 space-y-6'>
                            <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                                {/* Section Header */}
                                <div className='mb-6 flex items-center gap-3'>
                                    <div className='rounded-xl bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue p-3'>
                                        <svg
                                            className='size-5 text-white'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                                            />
                                        </svg>
                                    </div>
                                    <h2 className='font-montserrat text-xl font-bold text-gray-900 dark:text-white'>
                                        Order Summary
                                    </h2>
                                </div>

                                <div className='space-y-4'>
                                    {tickets.map((ticket, index) => (
                                        <div
                                            key={index}
                                            className='rounded-xl border border-gray-200/30 bg-gradient-to-br from-white to-gray-50/50 p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-card dark:to-revlr-dark-bg/50'
                                        >
                                            <div className='flex items-start justify-between'>
                                                <div className='flex-1'>
                                                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                                                        {ticket.ticketName}
                                                    </h3>
                                                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                        Quantity:{' '}
                                                        {ticket.quantity}
                                                    </p>
                                                </div>
                                                <div className='text-right'>
                                                    <p className='font-bold text-gray-900 dark:text-white'>
                                                        {ticket.ticketPrice ===
                                                        0
                                                            ? 'Free'
                                                            : formatPrice(
                                                                  ticket.ticketPrice *
                                                                      ticket.quantity
                                                              )}
                                                    </p>
                                                    {ticket.ticketPrice > 0 && (
                                                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                            {formatPrice(
                                                                ticket.ticketPrice
                                                            )}{' '}
                                                            each
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Summary Stats */}
                                    {tickets.length > 1 && (
                                        <div className='flex justify-between border-t border-gray-200/50 pt-4 text-sm text-gray-600 dark:border-revlr-dark-border/50 dark:text-gray-400'>
                                            <span>Total Tickets:</span>
                                            <span className='font-semibold'>
                                                {getTotalQuantity()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className='border-t border-gray-200/50 pt-4 dark:border-revlr-dark-border/50'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-xl font-bold text-gray-900 dark:text-white'>
                                                Total
                                            </span>
                                            <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-xl font-bold text-transparent'>
                                                {getTotalPrice() === 0
                                                    ? 'Free'
                                                    : formatPrice(
                                                          getTotalPrice()
                                                      )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Notice */}
                            <div className='rounded-xl border border-gray-200/30 bg-gradient-to-br from-revlr-accent-green/10 to-revlr-accent-green/5 p-4 dark:border-revlr-dark-border/30 dark:from-revlr-accent-green/20 dark:to-revlr-accent-green/10'>
                                <div className='flex items-start gap-3'>
                                    <div className='rounded-lg bg-revlr-accent-green p-2'>
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
                                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className='font-semibold text-gray-900 dark:text-white'>
                                            Secure Checkout
                                        </h4>
                                        <p className='text-sm text-gray-600 dark:text-gray-300'>
                                            Your information is protected with
                                            industry-standard encryption
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutPage;

'use client';

import { useSearchParams } from 'next/navigation';
import { Navbar } from '@components/Navbar';
import Footer from '@components/Footer';

const CheckoutPage = () => {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId');
    const ticketId = searchParams.get('ticketId');
    const ticketName = searchParams.get('ticketName');
    const ticketPrice = searchParams.get('ticketPrice');

    //log variables for debugging
    console.log('Event ID:', eventId);
    console.log('Ticket ID:', ticketId);
    console.log('Ticket Name:', ticketName);
    console.log('Ticket Price:', ticketPrice);

    return (
        <div className='min-h-screen bg-white transition-colors duration-300 dark:bg-revlr-dark-bg'>
            <Navbar isOrganizer={false} />
            <main className='mx-auto max-w-[1440px] px-6 pt-24 md:px-24'>
                <div className='py-8'>
                    <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-white'>
                        Ticket Checkout
                    </h1>
                </div>

                <div className='grid grid-cols-1 gap-12 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-revlr-dark-border dark:bg-revlr-dark-card'>
                            <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
                                Your Information
                            </h2>
                            <form className='space-y-4'>
                                <div>
                                    <label
                                        htmlFor='name'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                                    >
                                        Full Name
                                    </label>
                                    <input
                                        type='text'
                                        id='name'
                                        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-revlr-primary-blue focus:ring-revlr-primary-blue dark:border-revlr-dark-border dark:bg-revlr-dark-bg'
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor='email'
                                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type='email'
                                        id='email'
                                        className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-revlr-primary-blue focus:ring-revlr-primary-blue dark:border-revlr-dark-border dark:bg-revlr-dark-bg'
                                    />
                                </div>
                                <button
                                    type='submit'
                                    className='w-full rounded-lg bg-revlr-primary-blue px-4 py-2 text-white hover:bg-revlr-primary-blue/90'
                                >
                                    Confirm Purchase
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className='lg:col-span-1'>
                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-revlr-dark-border dark:bg-revlr-dark-card'>
                            <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
                                Order Summary
                            </h2>
                            <div className='space-y-4'>
                                <div className='flex justify-between'>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        Ticket:
                                    </span>
                                    <span className='font-semibold text-gray-900 dark:text-white'>
                                        {ticketName}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        Price:
                                    </span>
                                    <span className='font-semibold text-gray-900 dark:text-white'>
                                        {ticketPrice
                                            ? `₦${Number(ticketPrice).toLocaleString()}`
                                            : 'Free'}
                                    </span>
                                </div>
                                <div className='flex justify-between border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                                    <span className='text-lg font-bold text-gray-900 dark:text-white'>
                                        Total
                                    </span>
                                    <span className='text-lg font-bold text-gray-900 dark:text-white'>
                                        {ticketPrice
                                            ? `₦${Number(ticketPrice).toLocaleString()}`
                                            : 'Free'}
                                    </span>
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

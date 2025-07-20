'use client';

import { useParams } from 'next/navigation';
import { Navbar } from '@components/Navbar';
import Footer from '@components/Footer';
import { useEventDetails } from '@hooks/useEventDetails';
import Image from 'next/image';
import {
    getEventImage,
    formatEventDate,
    getEventLocation,
} from '@lib/utils/eventUtils';

import Link from 'next/link';

const EventDetailsPage = () => {
    const params = useParams();
    const eventId = params.eventId as string;
    const { event, loading, error } = useEventDetails(eventId);

    if (loading) {
        return (
            <div className='flex h-screen items-center justify-center bg-white dark:bg-revlr-dark-bg'>
                <div className='size-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400'></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='flex h-screen items-center justify-center bg-white dark:bg-revlr-dark-bg'>
                <div className='text-center text-red-600 dark:text-red-400'>
                    Error: {error}
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className='flex h-screen items-center justify-center bg-white dark:bg-revlr-dark-bg'>
                <div className='text-center text-gray-500 dark:text-gray-400'>
                    Event not found.
                </div>
            </div>
        );
    }

    const eventImage = getEventImage(event);
    const eventDate = formatEventDate(event.startDate, event.startTime);
    const eventLocation = getEventLocation(event);

    return (
        <div className='min-h-screen bg-white transition-colors duration-300 dark:bg-revlr-dark-bg'>
            <Navbar isOrganizer={false} />
            <main className='mx-auto max-w-[1440px] px-6 pt-24 md:px-24'>
                <div className='grid grid-cols-1 gap-12 lg:grid-cols-3'>
                    <div className='lg:col-span-2'>
                        <div className='relative mb-6 h-96 w-full overflow-hidden rounded-lg'>
                            <Image
                                src={eventImage}
                                alt={event.title || 'Event'}
                                fill
                                className='object-cover'
                            />
                        </div>
                        <h1 className='mb-4 text-4xl font-bold text-gray-900 dark:text-white'>
                            {event.title}
                        </h1>
                        <div
                            className='prose max-w-none text-gray-700 dark:text-gray-300'
                            dangerouslySetInnerHTML={{
                                __html: event.description || '',
                            }}
                        />
                    </div>
                    <div className='lg:col-span-1'>
                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-revlr-dark-border dark:bg-revlr-dark-card'>
                            <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
                                Event Details
                            </h2>
                            <div className='space-y-4'>
                                <div className='flex items-center'>
                                    <span className='mr-2'>📅</span>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        {eventDate}
                                    </span>
                                </div>
                                <div className='flex items-center'>
                                    <span className='mr-2'>📍</span>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        {eventLocation}
                                    </span>
                                </div>
                                <div className='flex items-center'>
                                    <span className='mr-2'>👤</span>
                                    <span className='text-gray-700 dark:text-gray-300'>
                                        {event.organizerName || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className='mt-6'>
                                <h3 className='mb-4 text-xl font-bold text-gray-900 dark:text-white'>
                                    Tickets
                                </h3>
                                {event.tickets && event.tickets.length > 0 ? (
                                    <div className='space-y-4'>
                                        {event.tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className='flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-revlr-dark-border'
                                            >
                                                <div>
                                                    <p className='font-semibold text-gray-800 dark:text-gray-200'>
                                                        {ticket.name}
                                                    </p>
                                                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                        {ticket.price &&
                                                        ticket.price > 0
                                                            ? `₦${ticket.price.toLocaleString()}`
                                                            : 'Free'}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={`/ticket-checkout?eventId=${event.id}&ticketId=${ticket.id}&ticketName=${ticket.name}&ticketPrice=${ticket.price || 0}`}
                                                    className='rounded-lg bg-revlr-primary-blue px-4 py-2 text-white hover:bg-revlr-primary-blue/90'
                                                >
                                                    Register
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className='text-gray-500 dark:text-gray-400'>
                                        No tickets available for this event.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default EventDetailsPage;

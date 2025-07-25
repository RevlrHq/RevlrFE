import Image from 'next/image';
import { EventView } from '../../../lib/services/models/EventView';
import { getEventLocation, getEventImage } from '../../../lib/utils/eventUtils';

interface EnhancedEventHeaderProps {
    event: EventView;
}

const EnhancedEventHeader = ({ event }: EnhancedEventHeaderProps) => {
    const eventLocation = getEventLocation(event);
    const eventImage = getEventImage(event);

    // Use banner image if available, otherwise fall back to regular event image
    const headerImage = event.bannerImageUrl || eventImage;

    const formatDateTime = (
        startDate?: string,
        endDate?: string,
        startTime?: string,
        endTime?: string
    ) => {
        if (!startDate) return 'Date TBD';

        const start = new Date(startDate);
        const startDateStr = start.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        let timeStr = '';
        if (startTime) {
            timeStr = ` at ${startTime}`;
            if (endTime && endTime !== startTime) {
                timeStr += ` - ${endTime}`;
            }
        }

        // If it's a multi-day event
        if (endDate && endDate !== startDate) {
            const end = new Date(endDate);
            const endDateStr = end.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            return `${startDateStr}${timeStr} - ${endDateStr}`;
        }

        return `${startDateStr}${timeStr}`;
    };

    return (
        <div className='space-y-8'>
            {/* Event Banner/Image with Modern Design */}
            <div className='relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-2xl dark:border-revlr-dark-border dark:from-revlr-dark-card dark:to-revlr-dark-bg'>
                <div className='relative h-64 w-full sm:h-80 lg:h-96'>
                    <Image
                        src={headerImage}
                        alt={event.title || 'Event'}
                        fill
                        className='object-cover'
                        priority
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/assets/images/event-image.png';
                        }}
                    />
                    {/* Gradient Overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />

                    {/* Event Status Badge */}
                    {event.status && (
                        <div className='absolute right-6 top-6'>
                            <span
                                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm ${
                                    event.status.toLowerCase() === 'published'
                                        ? 'bg-gradient-to-r from-revlr-accent-green to-revlr-accent-green/80 text-white'
                                        : event.status.toLowerCase() === 'draft'
                                          ? 'bg-gradient-to-r from-revlr-primary-yellow to-revlr-accent-orange text-white'
                                          : event.status.toLowerCase() ===
                                              'cancelled'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                            : 'bg-white/90 text-gray-800 dark:bg-revlr-dark-card/90 dark:text-gray-200'
                                }`}
                            >
                                {event.status.charAt(0).toUpperCase() +
                                    event.status.slice(1).toLowerCase()}
                            </span>
                        </div>
                    )}

                    {/* Floating Elements */}
                    <div className='absolute -right-4 -top-4 size-20 rounded-full bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange opacity-20 blur-xl'></div>
                    <div className='absolute -bottom-4 -left-4 size-16 rounded-full bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue opacity-20 blur-xl'></div>
                </div>
            </div>

            {/* Event Title and Info with Landing Page Styling */}
            <div className='space-y-8'>
                {/* Category Badge */}
                {event.eventCategory && (
                    <div className='flex justify-center'>
                        <div className='inline-flex items-center gap-2 rounded-full border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-6 py-3 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                            <span className='text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                🎫
                            </span>
                            <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                {event.eventCategory}
                            </span>
                        </div>
                    </div>
                )}

                {/* Event Title */}
                <div className='space-y-6 text-center'>
                    <h1 className='font-montserrat text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl'>
                        {event.title ? (
                            <>
                                {event.title.split(' ').slice(0, -1).join(' ')}{' '}
                                <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                    {event.title.split(' ').slice(-1)[0]}
                                </span>
                            </>
                        ) : (
                            <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                Untitled Event
                            </span>
                        )}
                    </h1>

                    {/* Event Type Badge */}
                    <div className='flex justify-center'>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg ${
                                event.isVirtual
                                    ? 'bg-gradient-to-r from-revlr-accent-purple to-revlr-primary-blue text-white'
                                    : 'bg-gradient-to-r from-revlr-accent-green to-revlr-accent-green/80 text-white'
                            }`}
                        >
                            <span className='text-lg'>
                                {event.isVirtual ? '💻' : '📍'}
                            </span>
                            {event.isVirtual
                                ? 'Virtual Event'
                                : 'In-Person Event'}
                        </span>
                    </div>
                </div>

                {/* Enhanced Date and Location Cards */}
                <div className='grid gap-6 md:grid-cols-2'>
                    {/* Date Card */}
                    <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                        <div className='flex items-start gap-4'>
                            <div className='rounded-xl bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple p-3'>
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
                                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                    />
                                </svg>
                            </div>
                            <div className='flex-1'>
                                <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                                    Event Date & Time
                                </h3>
                                <p className='leading-relaxed text-gray-600 dark:text-gray-300'>
                                    {formatDateTime(
                                        event.startDate,
                                        event.endDate,
                                        event.startTime,
                                        event.endTime
                                    )}
                                </p>
                                {event.timezone && (
                                    <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                                        {event.timezone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                        <div className='flex items-start gap-4'>
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
                                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                    />
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                    />
                                </svg>
                            </div>
                            <div className='flex-1'>
                                <h3 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                                    Location
                                </h3>
                                <p className='leading-relaxed text-gray-600 dark:text-gray-300'>
                                    {eventLocation}
                                </p>
                                {!event.isVirtual && event.address && (
                                    <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                                        {event.address}
                                    </p>
                                )}
                                {event.isVirtual && event.virtualMeetingUrl && (
                                    <a
                                        href={event.virtualMeetingUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='mt-2 inline-flex items-center gap-1 text-sm text-revlr-primary-blue transition-colors hover:text-revlr-accent-purple dark:text-revlr-primary-yellow dark:hover:text-revlr-accent-orange'
                                    >
                                        <svg
                                            className='size-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                            />
                                        </svg>
                                        Join Virtual Meeting
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Max Attendees Info */}
                {event.maxAttendees && (
                    <div className='flex justify-center'>
                        <div className='inline-flex items-center gap-3 rounded-full border border-gray-200/50 bg-white/60 px-6 py-3 backdrop-blur-sm dark:border-revlr-dark-border dark:bg-revlr-dark-card/60'>
                            <div className='rounded-full bg-gradient-to-br from-revlr-accent-orange to-revlr-primary-yellow p-2'>
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
                                        d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                    />
                                </svg>
                            </div>
                            <span className='font-medium text-gray-800 dark:text-gray-200'>
                                Maximum {event.maxAttendees.toLocaleString()}{' '}
                                attendees
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedEventHeader;

import Image from 'next/image';
import { EventView } from '../../../lib/services/models/EventView';
import {
    formatEventDate,
    getEventLocation,
    getEventImage,
} from '../../../lib/utils/eventUtils';

interface EventDetailsHeaderProps {
    event: EventView;
}

const EventDetailsHeader = ({ event }: EventDetailsHeaderProps) => {
    const eventDate = formatEventDate(event.startDate, event.startTime);
    const eventLocation = getEventLocation(event);
    const eventImage = getEventImage(event);

    return (
        <div className='mb-8'>
            {/* Event Image */}
            <div className='relative mb-6 h-64 w-full overflow-hidden rounded-lg sm:h-80'>
                <Image
                    src={eventImage}
                    alt={event.title || 'Event'}
                    fill
                    className='object-cover'
                    priority
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/assets/images/event-image.png';
                    }}
                />
            </div>

            {/* Event Title and Basic Info */}
            <div className='space-y-4'>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl'>
                    {event.title || 'Untitled Event'}
                </h1>

                {/* Event Category */}
                {event.eventCategory && (
                    <div className='inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                        {event.eventCategory}
                    </div>
                )}

                {/* Date and Location */}
                <div className='flex flex-col space-y-2 text-gray-600 dark:text-gray-300 sm:flex-row sm:space-x-6 sm:space-y-0'>
                    <div className='flex items-center'>
                        <svg
                            className='mr-2 size-5'
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
                        <span className='font-medium'>{eventDate}</span>
                    </div>

                    <div className='flex items-center'>
                        <svg
                            className='mr-2 size-5'
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
                        <span className='font-medium'>{eventLocation}</span>
                    </div>
                </div>

                {/* Event Status */}
                {event.status && (
                    <div className='flex items-center'>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                event.status.toLowerCase() === 'published'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : event.status.toLowerCase() === 'draft'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                        >
                            {event.status}
                        </span>
                    </div>
                )}

                {/* Max Attendees */}
                {event.maxAttendees && (
                    <div className='flex items-center text-sm text-gray-600 dark:text-gray-300'>
                        <svg
                            className='mr-2 size-4'
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
                        <span>Max {event.maxAttendees} attendees</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventDetailsHeader;

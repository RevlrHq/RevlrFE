import { EventView } from '../../../lib/services/models/EventView';

interface EventDetailsContentProps {
    event: EventView;
}

const EventDetailsContent = ({ event }: EventDetailsContentProps) => {
    return (
        <div className='space-y-8'>
            {/* About This Event */}
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
                <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                    About This Event
                </h2>
                <div className='prose max-w-none text-gray-700 dark:text-gray-300'>
                    {event.description ? (
                        <div
                            className='whitespace-pre-wrap'
                            dangerouslySetInnerHTML={{
                                __html: event.description.replace(
                                    /\n/g,
                                    '<br />'
                                ),
                            }}
                        />
                    ) : (
                        <p className='italic text-gray-500 dark:text-gray-400'>
                            No description available for this event.
                        </p>
                    )}
                </div>
            </div>

            {/* Event Details */}
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
                <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                    Event Details
                </h2>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    {/* Start Date & Time */}
                    <div className='flex items-start space-x-3'>
                        <div className='shrink-0'>
                            <svg
                                className='size-5 text-gray-400 dark:text-gray-500'
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
                        <div>
                            <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                Start
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                                {event.startDate &&
                                    new Date(
                                        event.startDate
                                    ).toLocaleDateString()}
                                {event.startTime && ` at ${event.startTime}`}
                            </p>
                        </div>
                    </div>

                    {/* End Date & Time */}
                    {(event.endDate || event.endTime) && (
                        <div className='flex items-start space-x-3'>
                            <div className='shrink-0'>
                                <svg
                                    className='size-5 text-gray-400 dark:text-gray-500'
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
                            <div>
                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                    End
                                </p>
                                <p className='text-sm text-gray-600 dark:text-gray-300'>
                                    {event.endDate &&
                                        new Date(
                                            event.endDate
                                        ).toLocaleDateString()}
                                    {event.endTime && ` at ${event.endTime}`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className='flex items-start space-x-3'>
                        <div className='shrink-0'>
                            <svg
                                className='size-5 text-gray-400 dark:text-gray-500'
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
                        <div>
                            <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                Location
                            </p>
                            <div className='text-sm text-gray-600 dark:text-gray-300'>
                                {event.isVirtual ? (
                                    <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200'>
                                        Virtual Event
                                    </span>
                                ) : (
                                    <>
                                        {event.venue && <p>{event.venue}</p>}
                                        {event.address && (
                                            <p>{event.address}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timezone */}
                    {event.timezone && (
                        <div className='flex items-start space-x-3'>
                            <div className='shrink-0'>
                                <svg
                                    className='size-5 text-gray-400 dark:text-gray-500'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                    Timezone
                                </p>
                                <p className='text-sm text-gray-600 dark:text-gray-300'>
                                    {event.timezone}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Google Maps Link */}
                {event.googleMapsLink && !event.isVirtual && (
                    <div className='mt-4 border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                        <a
                            href={event.googleMapsLink}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                        >
                            <svg
                                className='mr-1 size-4'
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
                            View on Google Maps
                        </a>
                    </div>
                )}

                {/* Virtual Meeting URL */}
                {event.virtualMeetingUrl && event.isVirtual && (
                    <div className='mt-4 border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                        <a
                            href={event.virtualMeetingUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                        >
                            <svg
                                className='mr-1 size-4'
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
                    </div>
                )}
            </div>

            {/* Additional Images */}
            {event.images && event.images.length > 0 && (
                <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
                    <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                        Event Gallery
                    </h2>
                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
                        {event.images.map((image, index) => (
                            <div
                                key={index}
                                className='relative h-32 overflow-hidden rounded-lg'
                            >
                                <img
                                    src={image}
                                    alt={`Event image ${index + 1}`}
                                    className='size-full object-cover'
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.src =
                                            '/assets/images/event-image.png';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetailsContent;

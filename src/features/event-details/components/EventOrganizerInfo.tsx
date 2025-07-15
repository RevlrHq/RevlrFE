import Image from 'next/image';
import { EventView } from '../../../lib/services/models/EventView';

interface EventOrganizerInfoProps {
    event: EventView;
}

const EventOrganizerInfo = ({ event }: EventOrganizerInfoProps) => {
    const hasOrganizerInfo =
        event.organizerName || event.organizerLogo || event.organizerWebsite;
    const hasSocialLinks =
        event.socials &&
        (event.socials.facebook ||
            event.socials.twitter ||
            event.socials.instagram);

    if (!hasOrganizerInfo && !hasSocialLinks) {
        return null;
    }

    return (
        <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
            <h2 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Event Organizer
            </h2>

            <div className='space-y-4'>
                {/* Organizer Basic Info */}
                <div className='flex items-start space-x-3'>
                    {event.organizerLogo && (
                        <div className='shrink-0'>
                            <div className='relative size-12 overflow-hidden rounded-full'>
                                <Image
                                    src={event.organizerLogo}
                                    alt={event.organizerName || 'Organizer'}
                                    fill
                                    className='object-cover'
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className='min-w-0 flex-1'>
                        {event.organizerName && (
                            <h3 className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                                {event.organizerName}
                            </h3>
                        )}

                        {event.organizerWebsite && (
                            <a
                                href={event.organizerWebsite}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='block truncate text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                            >
                                Visit Website
                            </a>
                        )}
                    </div>
                </div>

                {/* Social Links */}
                {hasSocialLinks && (
                    <div className='border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                        <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                            Follow Us
                        </h4>
                        <div className='flex flex-wrap gap-2'>
                            {event.socials?.facebook && (
                                <a
                                    href={event.socials.facebook}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex size-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700'
                                    title='Facebook'
                                >
                                    <svg
                                        className='size-4'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                                    </svg>
                                </a>
                            )}

                            {event.socials?.twitter && (
                                <a
                                    href={event.socials.twitter}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex size-8 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-600'
                                    title='Twitter'
                                >
                                    <svg
                                        className='size-4'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
                                    </svg>
                                </a>
                            )}

                            {event.socials?.instagram && (
                                <a
                                    href={event.socials.instagram}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex size-8 items-center justify-center rounded-full bg-pink-600 text-white transition-colors hover:bg-pink-700'
                                    title='Instagram'
                                >
                                    <svg
                                        className='size-4'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.198 7.053 7.708 8.35 7.708s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z' />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Contact Information */}
                <div className='border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                        Have questions about this event? Contact the organizer
                        directly.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EventOrganizerInfo;

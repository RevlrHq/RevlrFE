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
        <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
            <div className='mb-6 flex items-center gap-3'>
                <div className='rounded-xl bg-gradient-to-br from-revlr-accent-green to-revlr-accent-orange p-3'>
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
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                    </svg>
                </div>
                <h2 className='font-montserrat text-lg font-bold text-gray-900 dark:text-white'>
                    Event Organizer
                </h2>
            </div>

            <div className='space-y-4'>
                {/* Organizer Basic Info */}
                <div className='flex items-start space-x-3'>
                    {event.organizerLogo && (
                        <div className='shrink-0'>
                            <div className='relative size-14 overflow-hidden rounded-2xl border-2 border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-lg dark:border-revlr-dark-border/50 dark:from-revlr-dark-card dark:to-revlr-dark-bg'>
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
                            <h3 className='truncate font-semibold text-gray-900 dark:text-white'>
                                {event.organizerName}
                            </h3>
                        )}

                        {event.organizerWebsite && (
                            <a
                                href={event.organizerWebsite}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-1 text-sm text-revlr-primary-blue transition-colors hover:text-revlr-accent-purple dark:text-revlr-primary-yellow dark:hover:text-revlr-accent-orange'
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
                                Visit Website
                            </a>
                        )}
                    </div>
                </div>

                {/* Social Links */}
                {hasSocialLinks && (
                    <div className='border-t border-gray-200/50 pt-4 dark:border-revlr-dark-border/50'>
                        <h4 className='mb-3 font-semibold text-gray-900 dark:text-white'>
                            Follow Us
                        </h4>
                        <div className='flex flex-wrap gap-3'>
                            {event.socials?.facebook && (
                                <a
                                    href={event.socials.facebook}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl'
                                    title='Facebook'
                                >
                                    <svg
                                        className='size-5'
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
                                    className='inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:from-sky-500 hover:to-sky-600 hover:shadow-xl'
                                    title='Twitter'
                                >
                                    <svg
                                        className='size-5'
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
                                    className='inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:from-pink-600 hover:to-rose-600 hover:shadow-xl'
                                    title='Instagram'
                                >
                                    <svg
                                        className='size-5'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Contact Information */}
                <div className='border-t border-gray-200/50 pt-4 dark:border-revlr-dark-border/50'>
                    <div className='rounded-xl bg-gradient-to-r from-gray-50 to-white p-4 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <p className='text-sm text-gray-600 dark:text-gray-300'>
                            Have questions about this event? Contact the
                            organizer directly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventOrganizerInfo;

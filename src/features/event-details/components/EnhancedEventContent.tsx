import { useState } from 'react';
import { EventView } from '../../../lib/services/models/EventView';

interface EnhancedEventContentProps {
    event: EventView;
}

const EnhancedEventContent = ({ event }: EnhancedEventContentProps) => {
    const [shareStatus, setShareStatus] = useState<
        'idle' | 'copying' | 'copied' | 'error'
    >('idle');
    const [calendarStatus, setCalendarStatus] = useState<
        'idle' | 'opening' | 'error'
    >('idle');
    return (
        <div className='space-y-8'>
            {/* About This Event */}
            <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mb-6 flex items-center gap-3'>
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
                                d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                    </div>
                    <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                        About This Event
                    </h2>
                </div>

                <div className='prose max-w-none text-gray-700 dark:text-gray-300'>
                    {event.description ? (
                        <div
                            className='whitespace-pre-wrap text-lg leading-relaxed'
                            dangerouslySetInnerHTML={{
                                __html: event.description.replace(
                                    /\n/g,
                                    '<br />'
                                ),
                            }}
                        />
                    ) : (
                        <p className='text-lg italic text-gray-500 dark:text-gray-400'>
                            No description available for this event.
                        </p>
                    )}
                </div>
            </div>

            {/* Event Details Grid */}
            <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mb-6 flex items-center gap-3'>
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
                                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                        </svg>
                    </div>
                    <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                        Event Details
                    </h2>
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    {/* Start Date & Time */}
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-start gap-4'>
                            <div className='rounded-lg bg-gradient-to-br from-revlr-primary-blue/20 to-revlr-accent-purple/20 p-2'>
                                <svg
                                    className='size-5 text-revlr-primary-blue dark:text-revlr-primary-yellow'
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
                                <p className='mb-1 font-semibold text-gray-900 dark:text-white'>
                                    Start
                                </p>
                                <p className='text-gray-600 dark:text-gray-300'>
                                    {event.startDate &&
                                        new Date(
                                            event.startDate
                                        ).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    {event.startTime && (
                                        <span className='block text-sm text-gray-500 dark:text-gray-400'>
                                            at {event.startTime}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* End Date & Time */}
                    {(event.endDate || event.endTime) && (
                        <div className='rounded-xl border border-gray-200/30 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                            <div className='flex items-start gap-4'>
                                <div className='rounded-lg bg-gradient-to-br from-revlr-accent-green/20 to-revlr-accent-orange/20 p-2'>
                                    <svg
                                        className='size-5 text-revlr-accent-green dark:text-revlr-accent-orange'
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
                                    <p className='mb-1 font-semibold text-gray-900 dark:text-white'>
                                        End
                                    </p>
                                    <p className='text-gray-600 dark:text-gray-300'>
                                        {event.endDate &&
                                            new Date(
                                                event.endDate
                                            ).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        {event.endTime && (
                                            <span className='block text-sm text-gray-500 dark:text-gray-400'>
                                                at {event.endTime}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-start gap-4'>
                            <div className='rounded-lg bg-gradient-to-br from-revlr-accent-purple/20 to-revlr-primary-blue/20 p-2'>
                                <svg
                                    className='size-5 text-revlr-accent-purple dark:text-revlr-primary-blue'
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
                                <p className='mb-1 font-semibold text-gray-900 dark:text-white'>
                                    Location
                                </p>
                                <div className='text-gray-600 dark:text-gray-300'>
                                    {event.isVirtual ? (
                                        <span className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-revlr-accent-purple/10 to-revlr-primary-blue/10 px-3 py-1 text-sm font-medium text-revlr-accent-purple dark:text-revlr-primary-blue'>
                                            <span>💻</span>
                                            Virtual Event
                                        </span>
                                    ) : (
                                        <>
                                            {event.venue && (
                                                <p className='font-medium'>
                                                    {event.venue}
                                                </p>
                                            )}
                                            {event.address && (
                                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                    {event.address}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timezone */}
                    {event.timezone && (
                        <div className='rounded-xl border border-gray-200/30 bg-gradient-to-br from-gray-50 to-white p-6 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                            <div className='flex items-start gap-4'>
                                <div className='rounded-lg bg-gradient-to-br from-revlr-primary-yellow/20 to-revlr-accent-orange/20 p-2'>
                                    <svg
                                        className='size-5 text-revlr-primary-yellow dark:text-revlr-accent-orange'
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
                                <div className='flex-1'>
                                    <p className='mb-1 font-semibold text-gray-900 dark:text-white'>
                                        Timezone
                                    </p>
                                    <p className='text-gray-600 dark:text-gray-300'>
                                        {event.timezone}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Links */}
                <div className='mt-8 space-y-4'>
                    {/* Google Maps Link */}
                    {event.googleMapsLink && !event.isVirtual && (
                        <div className='border-t border-gray-200/50 pt-6 dark:border-revlr-dark-border/50'>
                            <a
                                href={event.googleMapsLink}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-revlr-accent-green to-revlr-accent-green/80 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-accent-green/90 hover:to-revlr-accent-green/70 hover:shadow-xl'
                            >
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
                                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                    />
                                </svg>
                                View on Google Maps
                            </a>
                        </div>
                    )}

                    {/* Virtual Meeting URL */}
                    {event.virtualMeetingUrl && event.isVirtual && (
                        <div className='border-t border-gray-200/50 pt-6 dark:border-revlr-dark-border/50'>
                            <a
                                href={event.virtualMeetingUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-revlr-accent-purple to-revlr-primary-blue px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-accent-purple/90 hover:to-revlr-primary-blue/90 hover:shadow-xl'
                            >
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
                                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                    />
                                </svg>
                                Join Virtual Meeting
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mb-6 flex items-center gap-3'>
                    <div className='rounded-xl bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange p-3'>
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
                                d='M13 10V3L4 14h7v7l9-11h-7z'
                            />
                        </svg>
                    </div>
                    <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                        Quick Actions
                    </h2>
                </div>

                <div className='space-y-4'>
                    {/* Share Event */}
                    <button
                        onClick={async () => {
                            setShareStatus('copying');
                            try {
                                if (navigator.share && navigator.canShare) {
                                    const shareData = {
                                        title: event.title || 'Event',
                                        text:
                                            event.description ||
                                            'Check out this event!',
                                        url: window.location.href,
                                    };

                                    if (navigator.canShare(shareData)) {
                                        await navigator.share(shareData);
                                        setShareStatus('copied');
                                    } else {
                                        throw new Error(
                                            'Cannot share this content'
                                        );
                                    }
                                } else {
                                    await navigator.clipboard.writeText(
                                        window.location.href
                                    );
                                    setShareStatus('copied');
                                }

                                // Reset status after 2 seconds
                                setTimeout(() => setShareStatus('idle'), 2000);
                            } catch (error) {
                                console.error('Share failed:', error);
                                setShareStatus('error');
                                setTimeout(() => setShareStatus('idle'), 2000);
                            }
                        }}
                        disabled={shareStatus === 'copying'}
                        className={`flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-4 font-semibold backdrop-blur-sm transition-all duration-300 ${
                            shareStatus === 'copied'
                                ? 'border-revlr-accent-green/50 bg-revlr-accent-green/10 text-revlr-accent-green dark:border-revlr-accent-green/30 dark:bg-revlr-accent-green/20'
                                : shareStatus === 'error'
                                  ? 'border-red-500/50 bg-red-500/10 text-red-600 dark:border-red-400/30 dark:bg-red-400/20 dark:text-red-400'
                                  : shareStatus === 'copying'
                                    ? 'border-gray-300/50 bg-gray-100/60 text-gray-500 dark:border-gray-600/50 dark:bg-gray-700/60 dark:text-gray-400'
                                    : 'border-gray-200/50 bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-revlr-primary-blue hover:to-revlr-accent-purple hover:text-white hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60 dark:text-gray-300'
                        }`}
                    >
                        {shareStatus === 'copying' ? (
                            <>
                                <div className='size-5 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                                Sharing...
                            </>
                        ) : shareStatus === 'copied' ? (
                            <>
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
                                        d='M5 13l4 4L19 7'
                                    />
                                </svg>
                                Link Copied!
                            </>
                        ) : shareStatus === 'error' ? (
                            <>
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
                                        d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                                Share Failed
                            </>
                        ) : (
                            <>
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
                                        d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                                    />
                                </svg>
                                Share Event
                            </>
                        )}
                    </button>

                    {/* Add to Calendar - Multiple Options */}
                    <div className='space-y-2'>
                        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                            {/* Google Calendar */}
                            <button
                                onClick={() => {
                                    setCalendarStatus('opening');
                                    try {
                                        const startDate = event.startDate
                                            ? new Date(event.startDate)
                                            : new Date();
                                        const endDate = event.endDate
                                            ? new Date(event.endDate)
                                            : new Date(
                                                  startDate.getTime() +
                                                      2 * 60 * 60 * 1000
                                              ); // Default 2 hours if no end date

                                        // Handle time if provided
                                        if (event.startTime) {
                                            const [hours, minutes] =
                                                event.startTime.split(':');
                                            startDate.setHours(
                                                parseInt(hours),
                                                parseInt(minutes)
                                            );
                                        }

                                        if (event.endTime) {
                                            const [hours, minutes] =
                                                event.endTime.split(':');
                                            endDate.setHours(
                                                parseInt(hours),
                                                parseInt(minutes)
                                            );
                                        } else if (event.startTime) {
                                            // If start time is provided but no end time, default to 2 hours later
                                            endDate.setTime(
                                                startDate.getTime() +
                                                    2 * 60 * 60 * 1000
                                            );
                                        }

                                        const formatDate = (date: Date) => {
                                            return (
                                                date
                                                    .toISOString()
                                                    .replace(/[-:]/g, '')
                                                    .split('.')[0] + 'Z'
                                            );
                                        };

                                        const location = event.isVirtual
                                            ? event.virtualMeetingUrl ||
                                              'Virtual Event'
                                            : event.venue ||
                                              event.address ||
                                              '';

                                        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title || 'Event')}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(location)}`;

                                        window.open(calendarUrl, '_blank');
                                        setTimeout(
                                            () => setCalendarStatus('idle'),
                                            1000
                                        );
                                    } catch (error) {
                                        console.error(
                                            'Calendar failed:',
                                            error
                                        );
                                        setCalendarStatus('error');
                                        setTimeout(
                                            () => setCalendarStatus('idle'),
                                            2000
                                        );
                                    }
                                }}
                                disabled={calendarStatus === 'opening'}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all duration-300 ${
                                    calendarStatus === 'error'
                                        ? 'border-red-500/50 bg-red-500/10 text-red-600 dark:border-red-400/30 dark:bg-red-400/20 dark:text-red-400'
                                        : calendarStatus === 'opening'
                                          ? 'border-gray-300/50 bg-gray-100/60 text-gray-500 dark:border-gray-600/50 dark:bg-gray-700/60 dark:text-gray-400'
                                          : 'border-gray-200/50 bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-revlr-accent-green hover:to-revlr-accent-orange hover:text-white hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60 dark:text-gray-300'
                                }`}
                            >
                                {calendarStatus === 'opening' ? (
                                    <div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                                ) : (
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
                                            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                        />
                                    </svg>
                                )}
                                Google Calendar
                            </button>

                            {/* Download ICS */}
                            <button
                                onClick={() => {
                                    try {
                                        const startDate = event.startDate
                                            ? new Date(event.startDate)
                                            : new Date();
                                        const endDate = event.endDate
                                            ? new Date(event.endDate)
                                            : new Date(
                                                  startDate.getTime() +
                                                      2 * 60 * 60 * 1000
                                              );

                                        // Handle time if provided
                                        if (event.startTime) {
                                            const [hours, minutes] =
                                                event.startTime.split(':');
                                            startDate.setHours(
                                                parseInt(hours),
                                                parseInt(minutes)
                                            );
                                        }

                                        if (event.endTime) {
                                            const [hours, minutes] =
                                                event.endTime.split(':');
                                            endDate.setHours(
                                                parseInt(hours),
                                                parseInt(minutes)
                                            );
                                        } else if (event.startTime) {
                                            endDate.setTime(
                                                startDate.getTime() +
                                                    2 * 60 * 60 * 1000
                                            );
                                        }

                                        const formatICSDate = (date: Date) => {
                                            return (
                                                date
                                                    .toISOString()
                                                    .replace(/[-:]/g, '')
                                                    .split('.')[0] + 'Z'
                                            );
                                        };

                                        const location = event.isVirtual
                                            ? event.virtualMeetingUrl ||
                                              'Virtual Event'
                                            : event.venue ||
                                              event.address ||
                                              '';

                                        const icsContent = [
                                            'BEGIN:VCALENDAR',
                                            'VERSION:2.0',
                                            'PRODID:-//REVLR//Event Calendar//EN',
                                            'BEGIN:VEVENT',
                                            `UID:${event.id || Date.now()}@revlr.com`,
                                            `DTSTART:${formatICSDate(startDate)}`,
                                            `DTEND:${formatICSDate(endDate)}`,
                                            `SUMMARY:${event.title || 'Event'}`,
                                            `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
                                            `LOCATION:${location}`,
                                            `URL:${window.location.href}`,
                                            'END:VEVENT',
                                            'END:VCALENDAR',
                                        ].join('\r\n');

                                        const blob = new Blob([icsContent], {
                                            type: 'text/calendar;charset=utf-8',
                                        });
                                        const url = URL.createObjectURL(blob);
                                        const link =
                                            document.createElement('a');
                                        link.href = url;
                                        link.download = `${(event.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                    } catch (error) {
                                        console.error(
                                            'ICS download failed:',
                                            error
                                        );
                                    }
                                }}
                                className='flex items-center justify-center gap-2 rounded-xl border border-gray-200/50 bg-white/60 px-4 py-3 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-revlr-accent-purple hover:to-revlr-primary-blue hover:text-white hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60 dark:text-gray-300'
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
                                        d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                    />
                                </svg>
                                Download .ics
                            </button>
                        </div>

                        <p className='text-center text-xs text-gray-500 dark:text-gray-400'>
                            .ics files work with Outlook, Apple Calendar, and
                            most calendar apps
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedEventContent;

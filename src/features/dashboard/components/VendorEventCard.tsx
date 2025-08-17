import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    Edit3,
    Trash2,
    Play,
    MoreHorizontal,
} from 'lucide-react';
import type { VendorEvent } from '../../../hooks/useVendorEvents';

interface VendorEventCardProps {
    event: VendorEvent;
    onContinueDraft?: (event: VendorEvent) => void;
    onDeleteDraft?: (event: VendorEvent) => void;
    theme?: 'light' | 'dark';
}

const VendorEventCard: React.FC<VendorEventCardProps> = ({
    event,
    onContinueDraft,
    onDeleteDraft,
    theme = 'light',
}) => {
    const getStatusBadgeStyles = (status: string, isDraft: boolean) => {
        if (isDraft) {
            return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
        }

        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
            case 'upcoming':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
            case 'past':
            case 'completed':
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
            case 'published':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not Set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return 'Not Set';
        try {
            // Handle both full datetime strings and time-only strings
            const time = timeString.includes('T')
                ? new Date(timeString)
                : new Date(`1970-01-01T${timeString}`);
            return time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return timeString;
        }
    };

    const getLocationText = () => {
        if (event.locationType === 1 || event.locationType === 'virtual') {
            return 'Virtual Event';
        } else if (
            event.locationType === 2 ||
            event.locationType === 'hybrid'
        ) {
            return event.venue || 'Hybrid Event';
        } else {
            return event.venue || event.address || 'In-Person Event';
        }
    };

    const getImageSrc = () => {
        if (event.images && event.images.length > 0) {
            return event.images[0];
        }
        if (event.bannerImageUrl) {
            return event.bannerImageUrl;
        }
        return null;
    };

    const eventTitle = event.title || event.eventName || 'Untitled Event';
    const eventDescription = event.description || event.eventDescription || '';

    return (
        <div
            className={`flex flex-row gap-4 rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
                theme === 'dark'
                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                    : 'border border-gray-200 bg-white'
            }`}
        >
            {/* Event Image */}
            <div className='relative size-48 shrink-0 overflow-hidden rounded-xl'>
                {getImageSrc() ? (
                    <Image
                        src={getImageSrc()!}
                        alt={eventTitle}
                        fill
                        className='object-cover'
                        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                    />
                ) : (
                    <div
                        className={`flex size-full items-center justify-center ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    >
                        <svg
                            className={`size-10 ${
                                theme === 'dark'
                                    ? 'text-gray-500'
                                    : 'text-gray-400'
                            }`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                        </svg>
                    </div>
                )}

                {/* Status Badge */}
                <div className='absolute right-2 top-2'>
                    <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusBadgeStyles(
                            event.status || '',
                            event.isDraft || false
                        )}`}
                    >
                        {event.isDraft ? 'Draft' : event.status || 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Event Details */}
            <div className='flex flex-1 flex-col justify-between'>
                <div className='space-y-3'>
                    {/* Title */}
                    <div className='flex items-start justify-between'>
                        <h3
                            className={`font-inter text-lg font-semibold leading-tight ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            {eventTitle}
                        </h3>

                        {/* Action Menu */}
                        <div className='flex items-center gap-1'>
                            {event.isDraft ? (
                                <>
                                    <button
                                        onClick={() => onContinueDraft?.(event)}
                                        className={`rounded-lg p-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                        title='Continue editing'
                                    >
                                        <Play className='size-4' />
                                    </button>
                                    <button
                                        onClick={() => onDeleteDraft?.(event)}
                                        className={`rounded-lg p-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-400 hover:bg-red-900/20 hover:text-red-400'
                                                : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                        title='Delete draft'
                                    >
                                        <Trash2 className='size-4' />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/dashboard/event/${event.id}/edit`}
                                        className={`rounded-lg p-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                        title='Edit event'
                                    >
                                        <Edit3 className='size-4' />
                                    </Link>
                                    <button
                                        className={`rounded-lg p-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                        }`}
                                        title='More options'
                                    >
                                        <MoreHorizontal className='size-4' />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {eventDescription && (
                        <p
                            className={`line-clamp-2 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            {eventDescription}
                        </p>
                    )}

                    {/* Event Details */}
                    <div className='space-y-2'>
                        {/* Date */}
                        <div className='flex items-center gap-2'>
                            <Calendar
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-600'
                                }`}
                            >
                                {formatDate(event.startDate)}
                                {event.endDate &&
                                    event.endDate !== event.startDate && (
                                        <span>
                                            {' '}
                                            - {formatDate(event.endDate)}
                                        </span>
                                    )}
                            </span>
                        </div>

                        {/* Time */}
                        <div className='flex items-center gap-2'>
                            <Clock
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-600'
                                }`}
                            >
                                {formatTime(event.startTime)}
                                {event.endTime &&
                                    event.endTime !== event.startTime && (
                                        <span>
                                            {' '}
                                            - {formatTime(event.endTime)}
                                        </span>
                                    )}
                            </span>
                        </div>

                        {/* Location */}
                        <div className='flex items-center gap-2'>
                            <MapPin
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-600'
                                }`}
                            >
                                {getLocationText()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className='flex items-center justify-between pt-4'>
                    {/* Tickets/Attendees Info */}
                    <div className='flex items-center gap-2'>
                        <Users
                            className={`size-4 ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            }`}
                        />
                        <span
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            {event.isDraft
                                ? 'Draft'
                                : event.tickets && event.tickets.length > 0
                                  ? `${event.tickets.length} ticket type${event.tickets.length > 1 ? 's' : ''}`
                                  : 'No tickets'}
                        </span>
                    </div>

                    {/* Last Modified */}
                    {event.isDraft && event.lastModified && (
                        <span
                            className={`font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-500'
                                    : 'text-gray-400'
                            }`}
                        >
                            Modified{' '}
                            {formatDate(event.lastModified.toISOString())}
                        </span>
                    )}

                    {/* Created Date for Published Events */}
                    {!event.isDraft && event.dateCreated && (
                        <span
                            className={`font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-500'
                                    : 'text-gray-400'
                            }`}
                        >
                            Created {formatDate(event.dateCreated)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorEventCard;

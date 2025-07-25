import { EventView } from '../../../lib/services/models/EventView';

interface EventMetadataProps {
    event: EventView;
}

const EventMetadata = ({ event }: EventMetadataProps) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const hasMetadata = event.dateCreated || event.dateUpdated || event.status;

    if (!hasMetadata) return null;

    return (
        <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
            <div className='mb-6 flex items-center gap-3'>
                <div className='rounded-xl bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange p-3'>
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
                            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                    </svg>
                </div>
                <h2 className='font-montserrat text-lg font-bold text-gray-900 dark:text-white'>
                    Event Information
                </h2>
            </div>

            <div className='space-y-4'>
                {/* Event Status */}
                {event.status && (
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-gray-700 dark:text-gray-300'>
                                Status
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
                                    event.status.toLowerCase() === 'published'
                                        ? 'bg-gradient-to-r from-revlr-accent-green to-revlr-accent-green/80 text-white'
                                        : event.status.toLowerCase() === 'draft'
                                          ? 'bg-gradient-to-r from-revlr-primary-yellow to-revlr-accent-orange text-white'
                                          : event.status.toLowerCase() ===
                                              'cancelled'
                                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                }`}
                            >
                                {event.status.charAt(0).toUpperCase() +
                                    event.status.slice(1).toLowerCase()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Max Attendees */}
                {event.maxAttendees && (
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-gray-700 dark:text-gray-300'>
                                Maximum Attendees
                            </span>
                            <span className='font-semibold text-gray-900 dark:text-white'>
                                {event.maxAttendees.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                {/* Location Type */}
                <div className='rounded-xl border border-gray-200/30 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                    <div className='flex items-center justify-between'>
                        <span className='font-medium text-gray-700 dark:text-gray-300'>
                            Event Type
                        </span>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
                                event.isVirtual
                                    ? 'bg-gradient-to-r from-revlr-accent-purple to-revlr-primary-blue text-white'
                                    : 'bg-gradient-to-r from-revlr-accent-green to-revlr-accent-green/80 text-white'
                            }`}
                        >
                            <span className='text-base'>
                                {event.isVirtual ? '💻' : '📍'}
                            </span>
                            {event.isVirtual
                                ? 'Virtual Event'
                                : 'In-Person Event'}
                        </span>
                    </div>
                </div>

                {/* Event Category */}
                {event.eventCategory && (
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-gray-700 dark:text-gray-300'>
                                Category
                            </span>
                            <span className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-4 py-2 text-sm font-semibold text-revlr-primary-blue dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20 dark:text-revlr-primary-yellow'>
                                <span>🎫</span>
                                {event.eventCategory}
                            </span>
                        </div>
                    </div>
                )}

                {/* Creation Date */}
                {event.dateCreated && (
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-gray-700 dark:text-gray-300'>
                                Event Created
                            </span>
                            <span className='text-sm font-medium text-gray-900 dark:text-white'>
                                {formatDate(event.dateCreated)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Last Updated */}
                {event.dateUpdated && (
                    <div className='rounded-xl border border-gray-200/30 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
                        <div className='flex items-center justify-between'>
                            <span className='font-medium text-gray-700 dark:text-gray-300'>
                                Last Updated
                            </span>
                            <span className='text-sm font-medium text-gray-900 dark:text-white'>
                                {formatDate(event.dateUpdated)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventMetadata;

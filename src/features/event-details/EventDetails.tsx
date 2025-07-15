'use client';

import { useEventDetails } from '../../hooks/useEventDetails';
import { Navbar } from '../../components/Navbar';
import EventDetailsHeader from './components/EventDetailsHeader';
import EventDetailsContent from './components/EventDetailsContent';
import EventTicketSection from './components/EventTicketSection';
import EventOrganizerInfo from './components/EventOrganizerInfo';
import EventDetailsLoading from './components/EventDetailsLoading';
import EventDetailsError from './components/EventDetailsError';

interface EventDetailsProps {
    eventId: string;
}

const EventDetails = ({ eventId }: EventDetailsProps) => {
    const { event, loading, error, refetch } = useEventDetails(eventId);

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-revlr-dark-bg'>
                <Navbar isOrganizer={false} />
                <div className='pt-20'>
                    <EventDetailsLoading />
                </div>
                {/* Footer would go here - moved to shared components */}
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className='min-h-screen bg-gray-50 dark:bg-revlr-dark-bg'>
                <Navbar isOrganizer={false} />
                <div className='pt-20'>
                    <EventDetailsError error={error} onRetry={refetch} />
                </div>
                {/* Footer would go here - moved to shared components */}
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-revlr-dark-bg'>
            {/* Header for logged out users */}
            <Navbar isOrganizer={false} />

            {/* Main Content */}
            <div className='pt-20'>
                {' '}
                {/* Add padding-top to account for fixed navbar */}
                <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                    <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
                        {/* Main Content */}
                        <div className='lg:col-span-2'>
                            <EventDetailsHeader event={event} />
                            <EventDetailsContent event={event} />
                        </div>

                        {/* Sidebar */}
                        <div className='lg:col-span-1'>
                            <div className='sticky top-28 space-y-6'>
                                {' '}
                                {/* Adjust top position for navbar */}
                                <EventTicketSection event={event} />
                                <EventOrganizerInfo event={event} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer for logged out users - moved to shared components */}
        </div>
    );
};

export default EventDetails;

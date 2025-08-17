'use client';

import { useEventDetails } from '../../hooks/useEventDetails';
import { Navbar } from '../../components/Navbar';
import Footer from '../../components/Footer';
import EventDetailsLoading from './components/EventDetailsLoading';
import EventDetailsError from './components/EventDetailsError';
import EventHeader from './components/EventHeader';
import EventContent from './components/EventContent';
import MediaGallery from './components/MediaGallery';
import EventTicketSection from './components/EventTicketSection';
import EventOrganizerInfo from './components/EventOrganizerInfo';
import EventMap from './components/EventMap';
import EventMetadata from './components/EventMetadata';
import TicketDetails from './components/TicketDetails';

interface EventDetailsProps {
    eventId: string;
}

const EventDetails = ({ eventId }: EventDetailsProps) => {
    const { event, loading, error, refetch } = useEventDetails(eventId);

    if (loading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
                <Navbar isOrganizer={false} />
                <div className='pt-20'>
                    <EventDetailsLoading />
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
                <Navbar isOrganizer={false} />
                <div className='pt-20'>
                    <EventDetailsError error={error} onRetry={refetch} />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
            {/* Background Pattern */}
            <div className='bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066FF" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFD700" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] absolute inset-0'></div>

            {/* Header for logged out users */}
            <Navbar isOrganizer={false} />

            {/* Main Content */}
            <div className='relative pt-20'>
                <div className='mx-auto max-w-[1440px] px-6 py-8 md:px-24'>
                    <div className='grid grid-cols-1 gap-12 lg:grid-cols-3'>
                        {/* Main Content */}
                        <div className='space-y-8 lg:col-span-2'>
                            <EventHeader event={event} />
                            <EventContent event={event} />
                            <MediaGallery event={event} />
                            <TicketDetails event={event} />
                            <EventMap event={event} />
                        </div>

                        {/* Sidebar */}
                        <div className='lg:col-span-1'>
                            <div className='sticky top-28 space-y-6'>
                                <EventTicketSection event={event} />
                                <EventOrganizerInfo event={event} />
                                <EventMetadata event={event} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer for logged out users */}
            <Footer />
        </div>
    );
};

export default EventDetails;

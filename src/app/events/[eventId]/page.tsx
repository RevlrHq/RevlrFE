'use client';

import { useParams } from 'next/navigation';
import EventDetails from '../../../features/event-details/EventDetails';

const EventDetailsPage = () => {
    const params = useParams();
    const eventId = params.eventId as string;

    return <EventDetails eventId={eventId} />;
};

export default EventDetailsPage;

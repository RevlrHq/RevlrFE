import { Suspense } from 'react';
import EventDetails from '../../../../features/event-details/EventDetails';

interface EventDetailsPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EventDetailsPage({
    params,
}: EventDetailsPageProps) {
    const { id } = await params;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EventDetails eventId={id} />
        </Suspense>
    );
}

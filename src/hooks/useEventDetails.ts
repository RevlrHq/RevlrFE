import { useState, useEffect } from 'react';
import { EventsService } from '../lib/services/services/EventsService';
import { EventView } from '../lib/services/models/EventView';

interface UseEventDetailsReturn {
    event: EventView | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useEventDetails = (eventId: string): UseEventDetailsReturn => {
    const [event, setEvent] = useState<EventView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvent = async () => {
        if (!eventId) {
            setError('Event ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await EventsService.getApiEvents1({ eventId });

            if (response.data) {
                setEvent(response.data);
            } else {
                setError('Event not found');
            }
        } catch (err: unknown) {
            console.error('Error fetching event details:', err);
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch event details';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [eventId]);

    const refetch = () => {
        fetchEvent();
    };

    return {
        event,
        loading,
        error,
        refetch,
    };
};

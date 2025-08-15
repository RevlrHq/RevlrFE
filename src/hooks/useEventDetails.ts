'use client';

import { useState, useEffect, useCallback } from 'react';
// import {  EventView } from '@lib/api/models/Event';
import { EventsService } from '@lib/api/services/EventsService';
import { StandardResponseOfEventView } from '@lib/api/models/StandardResponseOfEventView';
import { EventView } from '@lib/api';

export const useEventDetails = (eventId: string) => {
    const [event, setEvent] = useState<EventView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEventDetails = useCallback(async () => {
        if (!eventId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response: StandardResponseOfEventView =
                await EventsService.getApiEvents1({ eventId });
            if (response.data) {
                setEvent(response.data as EventView);
            } else {
                setError(response.message || 'Failed to fetch event details');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEventDetails();
    }, [fetchEventDetails]);

    return { event, loading, error, refetch: fetchEventDetails };
};

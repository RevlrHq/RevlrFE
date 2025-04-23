import React from 'react';
import EventCard from './EventCard';

const EventsCardGrid = () => {
    const events = [
        {
            id: 1,
            title: 'Sanda Music Festival 2025',
            date: 'Wednesday, April 15 2025',
            time: '5:00 PM - 5:00 AM',
            image: '/assets/images/event-image.png',
            ticketsSold: 0,
            status: 'Active',
        },
        {
            id: 2,
            title: 'Innovator Summit: Inside Europ...',
            date: 'Wednesday, April 15 2025',
            time: '5:00 PM - 5:00 AM',
            image: '/assets/images/event-image.png',
            ticketsSold: 315,
            status: 'Past',
        },
        {
            id: 3,
            title: 'Couples Movie Night by Eagen',
            date: 'Wednesday, April 15 2025',
            time: '5:00 PM - 5:00 AM',
            image: '/assets/images/event-image.png',
            ticketsSold: 48,
            status: 'Upcoming',
        },
        {
            id: 4,
            title: 'Offside Easter Pool Party',
            date: 'Wednesday, April 15 2025',
            time: '5:00 PM - 5:00 AM',
            image: '/assets/images/event-image.png',
            ticketsSold: 0,
            status: 'Drafts',
        },
        {
            id: 5,
            title: 'Painting Class',
            date: 'Not Set',
            time: 'Not Set',
            image: '/assets/images/event-image.png',
            ticketsSold: 0,
            status: 'Drafts',
        },
        {
            id: 6,
            title: 'Offside Easter Pool Party',
            date: 'Wednesday, April 15 2025',
            time: '5:00 PM - 5:00 AM',
            image: '/assets/images/event-image.png',
            ticketsSold: 0,
            status: 'Drafts',
        },
    ];
    return (
        <div className='container mx-auto p-4'>
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {events.map((event) => (
                    <EventCard
                        key={event.id.toString()}
                        event={{ ...event, id: event.id.toString() }}
                    />
                ))}
            </div>
        </div>
    );
};

export default EventsCardGrid;

import Link from 'next/link';
import Image from 'next/image';
import {
    formatEventDate,
    getEventPrice,
    getEventLocation,
    getEventImage,
} from '@lib/utils/eventUtils';
import { EventView } from '@lib/services';
// import { Event as EventView } from '@lib/services/models/Event';

interface EventCardProps {
    event: EventView;
}

const EventCard = ({ event }: EventCardProps) => {
    const eventPrice = getEventPrice(event);
    const eventDate = formatEventDate(event.startDate, event.startTime);
    const eventLocation = getEventLocation(event);
    const eventImage = getEventImage(event);

    return (
        <div className='group'>
            <Link href={`/events/${event.id}`}>
                <div className='relative mb-3 overflow-hidden rounded-lg bg-gray-200'>
                    <div className='relative h-[293px] w-full rounded-lg'>
                        <Image
                            src={eventImage}
                            alt={event.title || 'Event'}
                            fill
                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/assets/images/event-image.png';
                            }}
                        />
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    <div className='font-inter text-[16px] font-semibold text-revlr-primary-blue dark:text-blue-400'>
                        {eventPrice.displayPrice}
                    </div>
                    <h3 className='w-full overflow-hidden truncate whitespace-nowrap font-inter text-[16px] font-semibold text-[#001433] dark:text-gray-100'>
                        {event.title || 'Untitled Event'}
                    </h3>
                    <div className='font-inter text-sm font-medium text-[#6B7380] dark:text-gray-300'>
                        {eventDate}
                    </div>
                    <div className='font-inter text-sm font-medium text-[#6B7380] dark:text-gray-300'>
                        {eventLocation}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default EventCard;

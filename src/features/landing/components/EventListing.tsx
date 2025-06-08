import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EventFilterDropdown from './EventFilterDropdown';

const EventListing = () => {
    const [activeCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilter] = useState(false);

    const events = [
        {
            id: 1,
            title: 'Sanda Music Festival 2025',
            image: '/assets/images/flyer.png',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 2,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/assets/images/flyer.png',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
        {
            id: 3,
            title: 'Sanda Music Festival 2025',
            image: '/assets/images/flyer2.png',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 4,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/assets/images/flyer3.png',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
        {
            id: 5,
            title: 'Sanda Music Festival 2025',
            image: '/assets/images/flyer4.png',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 6,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/assets/images/flyer5.png',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
        {
            id: 7,
            title: 'Sanda Music Festival 2025',
            image: '/assets/images/flyer4.png',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 8,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/assets/images/flyer4.png',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
        {
            id: 9,
            title: 'Sanda Music Festival 2025',
            image: '/sanda-music-festival-5.jpg',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 10,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/innovator-summit-5.jpg',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
        {
            id: 11,
            title: 'Sanda Music Festival 2025',
            image: '/sanda-music-festival-6.jpg',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 12,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/innovator-summit-6.jpg',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
    ];

    const filteredEvents =
        activeCategory === 'All'
            ? events
            : events.filter((event) => event.category === activeCategory);

    const eventsPerPage = 8;
    const pagesCount = Math.ceil(filteredEvents.length / eventsPerPage);
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * eventsPerPage,
        currentPage * eventsPerPage
    );

    return (
        <div className='relative mb-24 px-4 py-2 md:px-24'>
            <div className='z-50 mb-8 bg-white pb-2 sm:sticky sm:top-[80px]'>
                <div className='flex w-full flex-col items-start justify-between overflow-x-auto whitespace-nowrap px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-row sm:items-center sm:px-0'>
                    <EventFilterDropdown />
                </div>
            </div>

            <div className='flex'>
                <div className='w-full'>
                    <div
                        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${
                            showFilter
                                ? 'lg:grid-cols-3'
                                : 'lg:grid-cols-3 xl:grid-cols-4'
                        }`}
                    >
                        {paginatedEvents.map((event) => (
                            <div key={event.id} className='group'>
                                <Link href={`/event-details`}>
                                    <div className='relative mb-3 overflow-hidden rounded-lg bg-gray-200'>
                                        <div className='relative h-[370px] w-full rounded-lg md:h-[293px]'>
                                            <Image
                                                src={event.image}
                                                alt={event.title}
                                                fill
                                                className='object-cover transition-transform duration-300 group-hover:scale-105'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex flex-col gap-2'>
                                        <div className='font-inter text-base font-semibold text-[#0066FF]'>
                                            {event.price === 0
                                                ? 'Free'
                                                : `From $${event.price}`}
                                        </div>
                                        <h3 className='w-full overflow-hidden truncate whitespace-nowrap font-inter text-base font-semibold text-[#001433]'>
                                            {event.title}
                                        </h3>
                                        <div className='font-inter text-sm font-medium text-[#6B7380]'>
                                            {event.date}
                                        </div>
                                        <div className='font-inter text-sm font-medium text-[#6B7380]'>
                                            {event.location}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className='mt-12 flex items-center justify-center space-x-2'>
                        <button
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className='rounded-md p-2 hover:bg-gray-100 disabled:opacity-50'
                        >
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='size-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 19l-7-7 7-7'
                                />
                            </svg>
                        </button>

                        {[...Array(pagesCount)].map((_, i) => {
                            const pageNum = i + 1;

                            const shouldShow =
                                pageNum === 1 ||
                                pageNum === pagesCount ||
                                (pageNum >= currentPage - 1 &&
                                    pageNum <= currentPage + 1) ||
                                (pagesCount <= 7 && pageNum <= 7);

                            if (!shouldShow && pageNum === currentPage + 2) {
                                return (
                                    <span
                                        key={`ellipsis-after`}
                                        className='px-3 py-2'
                                    >
                                        ...
                                    </span>
                                );
                            }

                            if (!shouldShow && pageNum === currentPage - 2) {
                                return (
                                    <span
                                        key={`ellipsis-before`}
                                        className='px-3 py-2'
                                    >
                                        ...
                                    </span>
                                );
                            }

                            if (!shouldShow) return null;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`size-10 rounded-md ${
                                        currentPage === pageNum
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(prev + 1, pagesCount)
                                )
                            }
                            disabled={currentPage === pagesCount}
                            className='rounded-md p-2 hover:bg-gray-100 disabled:opacity-50'
                        >
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='size-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5l7 7-7 7'
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventListing;

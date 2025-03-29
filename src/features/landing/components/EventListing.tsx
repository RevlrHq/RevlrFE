import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import EventFilterDropdown from './EventFilterDropdown';

const EventListing = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilter, setShowFilter] = useState(false);
    const [, setActiveFilters] = useState<{
        sort: string;
        dateRange: string;
        location: string;
        priceRange: number[];
        eventType: string;
    } | null>(null);

    const categories = [
        'All',
        'Tech',
        'Art',
        'Concerts',
        'Parties',
        'Culture',
        'Business',
        'Food & Drinks',
        'Dating',
    ];

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

    // Filter events by category
    const filteredEvents =
        activeCategory === 'All'
            ? events
            : events.filter((event) => event.category === activeCategory);

    // Pagination
    const eventsPerPage = 8;
    const pagesCount = Math.ceil(filteredEvents.length / eventsPerPage);
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * eventsPerPage,
        currentPage * eventsPerPage
    );

    const handleApplyFilters = (filters: {
        sort: string;
        dateRange: string;
        location: string;
        priceRange: number[];
        eventType: string;
    }) => {
        setActiveFilters(filters);
        setShowFilter(false);
    };

    return (
        <div className='relative mb-24 px-4 py-2 md:px-24'>
            <div className='sticky top-[80px] z-50 mb-8 flex flex-col items-start justify-between bg-white pb-2 sm:flex-row sm:items-center'>
                <div className='mb-4 flex items-center sm:mb-0'>
                    <button
                        className='mr-4 flex flex-row items-center gap-2 rounded-md border border-[#F2F3F5] bg-[#F1F6FF] p-2 font-inter text-[14px] font-medium text-[#374252]'
                        onClick={() => setShowFilter(!showFilter)}
                    >
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M2.5 15C2.5 15.4583 2.875 15.8333 3.33333 15.8333H7.5V14.1667H3.33333C2.875 14.1667 2.5 14.5417 2.5 15ZM2.5 5C2.5 5.45833 2.875 5.83333 3.33333 5.83333H10.8333V4.16667H3.33333C2.875 4.16667 2.5 4.54167 2.5 5ZM10.8333 16.6667V15.8333H16.6667C17.125 15.8333 17.5 15.4583 17.5 15C17.5 14.5417 17.125 14.1667 16.6667 14.1667H10.8333V13.3333C10.8333 12.875 10.4583 12.5 10 12.5C9.54167 12.5 9.16667 12.875 9.16667 13.3333V16.6667C9.16667 17.125 9.54167 17.5 10 17.5C10.4583 17.5 10.8333 17.125 10.8333 16.6667ZM5.83333 8.33333V9.16667H3.33333C2.875 9.16667 2.5 9.54167 2.5 10C2.5 10.4583 2.875 10.8333 3.33333 10.8333H5.83333V11.6667C5.83333 12.125 6.20833 12.5 6.66667 12.5C7.125 12.5 7.5 12.125 7.5 11.6667V8.33333C7.5 7.875 7.125 7.5 6.66667 7.5C6.20833 7.5 5.83333 7.875 5.83333 8.33333ZM17.5 10C17.5 9.54167 17.125 9.16667 16.6667 9.16667H9.16667V10.8333H16.6667C17.125 10.8333 17.5 10.4583 17.5 10ZM13.3333 7.5C13.7917 7.5 14.1667 7.125 14.1667 6.66667V5.83333H16.6667C17.125 5.83333 17.5 5.45833 17.5 5C17.5 4.54167 17.125 4.16667 16.6667 4.16667H14.1667V3.33333C14.1667 2.875 13.7917 2.5 13.3333 2.5C12.875 2.5 12.5 2.875 12.5 3.33333V6.66667C12.5 7.125 12.875 7.5 13.3333 7.5Z'
                                fill='#374252'
                            />
                        </svg>
                        Filter
                    </button>
                </div>

                <div className='flex w-full overflow-x-auto sm:w-auto'>
                    <div className='flex space-x-8'>
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`whitespace-nowrap font-inter text-[14px] ${
                                    activeCategory === category
                                        ? 'border-b-2 border-[#0066FF] font-semibold text-[#0066FF]'
                                        : 'font-normal text-[#374252]'
                                }`}
                                onClick={() => {
                                    setActiveCategory(category);
                                    setCurrentPage(1);
                                }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className='flex'>
                {showFilter && (
                    <div className='mr-6 w-64 shrink-0'>
                        <EventFilterDropdown
                            onApply={handleApplyFilters}
                            onCancel={() => setShowFilter(false)}
                        />
                    </div>
                )}

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
                                <Link href={`/events/event/${event.id}`}>
                                    <div className='relative mb-3 overflow-hidden rounded-lg bg-gray-200'>
                                        <div className='relative h-[293px] w-full rounded-lg'>
                                            <Image
                                                src={event.image}
                                                alt={event.title}
                                                fill
                                                className='object-cover transition-transform duration-300 group-hover:scale-105'
                                            />
                                        </div>
                                    </div>

                                    <div className='flex flex-col gap-2'>
                                        <div className='font-inter text-[16px] font-semibold text-[#0066FF]'>
                                            {event.price === 0
                                                ? 'Free'
                                                : `From $${event.price}`}
                                        </div>
                                        <h3 className='w-full overflow-hidden truncate whitespace-nowrap font-inter text-[16px] font-semibold text-[#001433]'>
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

                    {/* Pagination */}
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

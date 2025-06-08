import { useState } from 'react';

const EventFilterDropdown = () => {
    const [filtersOpen, setFiltersOpen] = useState({
        events: false,
        date: false,
        location: false,
        price: false,
        eventType: false,
        sort: false,
    });

    const toggleFilter = (filter: keyof typeof filtersOpen) => {
        setFiltersOpen((prev) => ({
            ...prev,
            [filter]: !prev[filter],
        }));
    };

    return (
        <div className='w-full bg-white'>
            <div className='flex flex-nowrap items-center justify-start gap-4 md:flex-wrap'>
                <div className='relative'>
                    <button
                        onClick={() => toggleFilter('events')}
                        className='flex items-center space-x-2 whitespace-nowrap rounded-md border border-[#F2F3F5] bg-white px-4 py-2 font-inter text-sm font-semibold text-[#4C5563]'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <rect
                                x='0.666809'
                                y='0.666504'
                                width='6.66667'
                                height='6.66667'
                                rx='1.33333'
                                fill='#4C5563'
                            />
                            <rect
                                x='8.66681'
                                y='0.666504'
                                width='6.66667'
                                height='6.66667'
                                rx='1.33333'
                                fill='#4C5563'
                            />
                            <rect
                                x='0.666809'
                                y='8.6665'
                                width='6.66667'
                                height='6.66667'
                                rx='1.33333'
                                fill='#4C5563'
                            />
                            <rect
                                x='8.66681'
                                y='8.6665'
                                width='6.66667'
                                height='6.66667'
                                rx='1.33333'
                                fill='#4C5563'
                            />
                        </svg>

                        <span>All Events</span>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.825 7.9126L10 11.7293L6.175 7.9126L5 9.0876L10 14.0876L15 9.0876L13.825 7.9126Z'
                                fill='#4C5563'
                            />
                        </svg>
                    </button>
                    {filtersOpen.events && (
                        <div className='absolute z-10 mt-1 w-48 rounded-md bg-white py-1 text-sm shadow-lg'>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                All Events
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Featured Events
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                My Events
                            </button>
                        </div>
                    )}
                </div>

                {/* Date Filter */}
                <div className='relative'>
                    <button
                        onClick={() => toggleFilter('date')}
                        className='flex items-center space-x-2 rounded-md border border-[#F2F3F5] bg-white px-4 py-2 font-inter text-sm font-semibold text-[#4C5563]'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M7.99996 1.44043C5.19996 1.44043 2.66663 3.5871 2.66663 6.9071C2.66663 9.0271 4.29996 11.5204 7.55996 14.3938C7.81329 14.6138 8.19329 14.6138 8.44663 14.3938C11.7 11.5204 13.3333 9.0271 13.3333 6.9071C13.3333 3.5871 10.8 1.44043 7.99996 1.44043ZM7.99996 8.1071C7.26663 8.1071 6.66663 7.5071 6.66663 6.77376C6.66663 6.04043 7.26663 5.44043 7.99996 5.44043C8.73329 5.44043 9.33329 6.04043 9.33329 6.77376C9.33329 7.5071 8.73329 8.1071 7.99996 8.1071Z'
                                fill='#4C5563'
                            />
                        </svg>
                        <span>Date</span>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.825 7.9126L10 11.7293L6.175 7.9126L5 9.0876L10 14.0876L15 9.0876L13.825 7.9126Z'
                                fill='#4C5563'
                            />
                        </svg>
                    </button>
                    {filtersOpen.date && (
                        <div className='absolute z-10 mt-1 w-56 rounded-md bg-white py-1 text-sm shadow-lg'>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Today
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                This Weekend
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                This Week
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Next Month
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Custom Range
                            </button>
                        </div>
                    )}
                </div>

                {/* Location Filter */}
                <div className='relative'>
                    <button
                        onClick={() => toggleFilter('location')}
                        className='flex items-center space-x-2 rounded-md border border-[#F2F3F5] bg-white px-4 py-2 font-inter text-sm font-semibold text-[#4C5563]'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M7.99996 1.44043C5.19996 1.44043 2.66663 3.5871 2.66663 6.9071C2.66663 9.0271 4.29996 11.5204 7.55996 14.3938C7.81329 14.6138 8.19329 14.6138 8.44663 14.3938C11.7 11.5204 13.3333 9.0271 13.3333 6.9071C13.3333 3.5871 10.8 1.44043 7.99996 1.44043ZM7.99996 8.1071C7.26663 8.1071 6.66663 7.5071 6.66663 6.77376C6.66663 6.04043 7.26663 5.44043 7.99996 5.44043C8.73329 5.44043 9.33329 6.04043 9.33329 6.77376C9.33329 7.5071 8.73329 8.1071 7.99996 8.1071Z'
                                fill='#4C5563'
                            />
                        </svg>

                        <span>Location</span>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.825 7.9126L10 11.7293L6.175 7.9126L5 9.0876L10 14.0876L15 9.0876L13.825 7.9126Z'
                                fill='#4C5563'
                            />
                        </svg>
                    </button>
                    {filtersOpen.location && (
                        <div className='absolute z-10 mt-1 w-56 rounded-md bg-white py-1 text-sm shadow-lg'>
                            <div className='px-4 py-2'>
                                <input
                                    type='text'
                                    placeholder='Search locations...'
                                    className='w-full rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Nearby
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Online Events
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Popular Cities
                            </button>
                        </div>
                    )}
                </div>

                <div className='relative'>
                    <button
                        onClick={() => toggleFilter('price')}
                        className='flex items-center space-x-2 rounded-md border border-[#F2F3F5] bg-white px-4 py-2 font-inter text-sm font-semibold text-[#4C5563]'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M8 1.3335C4.31999 1.3335 1.33333 4.32016 1.33333 8.00016C1.33333 11.6802 4.31999 14.6668 8 14.6668C11.68 14.6668 14.6667 11.6802 14.6667 8.00016C14.6667 4.32016 11.68 1.3335 8 1.3335ZM8.93999 12.0602V12.4468C8.93999 12.9335 8.54 13.3335 8.05333 13.3335H8.04666C7.55999 13.3335 7.16 12.9335 7.16 12.4468V12.0468C6.27333 11.8602 5.48666 11.3735 5.15333 10.5535C4.99999 10.1868 5.28666 9.78016 5.68666 9.78016H5.84666C6.09333 9.78016 6.29333 9.94683 6.38666 10.1802C6.58 10.6802 7.08666 11.0268 8.06 11.0268C9.36666 11.0268 9.66 10.3735 9.66 9.96683C9.66 9.4135 9.36666 8.8935 7.87999 8.54016C6.22666 8.14016 5.09333 7.46016 5.09333 6.0935C5.09333 4.94683 6.02 4.20016 7.16666 3.9535V3.5535C7.16666 3.06683 7.56666 2.66683 8.05333 2.66683H8.06C8.54666 2.66683 8.94666 3.06683 8.94666 3.5535V3.96683C9.86666 4.1935 10.4467 4.76683 10.7 5.4735C10.8333 5.84016 10.5533 6.22683 10.16 6.22683H9.98666C9.74 6.22683 9.54 6.0535 9.47333 5.8135C9.32 5.30683 8.9 4.98016 8.06 4.98016C7.06 4.98016 6.45999 5.4335 6.45999 6.0735C6.45999 6.6335 6.89333 7.00016 8.24 7.34683C9.58666 7.6935 11.0267 8.2735 11.0267 9.9535C11.0133 11.1735 10.1 11.8402 8.93999 12.0602Z'
                                fill='#4C5563'
                            />
                        </svg>

                        <span>Price</span>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.825 7.9126L10 11.7293L6.175 7.9126L5 9.0876L10 14.0876L15 9.0876L13.825 7.9126Z'
                                fill='#4C5563'
                            />
                        </svg>
                    </button>
                    {filtersOpen.price && (
                        <div className='absolute z-10 mt-1 w-48 rounded-md bg-white py-1 text-sm shadow-lg'>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Free
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Paid
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                All Prices
                            </button>
                            <div className='px-4 py-2'>
                                <div className='mb-1 text-gray-700'>
                                    Price Range
                                </div>
                                <div className='flex items-center gap-2'>
                                    <input
                                        type='number'
                                        placeholder='Min'
                                        className='w-20 rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                    <span>-</span>
                                    <input
                                        type='number'
                                        placeholder='Max'
                                        className='w-20 rounded-md border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className='relative'>
                    <button
                        onClick={() => toggleFilter('eventType')}
                        className='flex items-center space-x-2 rounded-md border border-[#F2F3F5] bg-white px-4 py-2 font-inter text-sm font-semibold text-[#4C5563]'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M2.00002 12.0005C2.00002 12.3672 2.30002 12.6672 2.66669 12.6672H6.00002V11.3338H2.66669C2.30002 11.3338 2.00002 11.6338 2.00002 12.0005ZM2.00002 4.00049C2.00002 4.36716 2.30002 4.66716 2.66669 4.66716H8.66669V3.33382H2.66669C2.30002 3.33382 2.00002 3.63382 2.00002 4.00049ZM8.66669 13.3338V12.6672H13.3334C13.7 12.6672 14 12.3672 14 12.0005C14 11.6338 13.7 11.3338 13.3334 11.3338H8.66669V10.6672C8.66669 10.3005 8.36669 10.0005 8.00002 10.0005C7.63336 10.0005 7.33335 10.3005 7.33335 10.6672V13.3338C7.33335 13.7005 7.63336 14.0005 8.00002 14.0005C8.36669 14.0005 8.66669 13.7005 8.66669 13.3338ZM4.66669 6.66716V7.33382H2.66669C2.30002 7.33382 2.00002 7.63382 2.00002 8.00049C2.00002 8.36716 2.30002 8.66716 2.66669 8.66716H4.66669V9.33382C4.66669 9.70049 4.96669 10.0005 5.33335 10.0005C5.70002 10.0005 6.00002 9.70049 6.00002 9.33382V6.66716C6.00002 6.30049 5.70002 6.00049 5.33335 6.00049C4.96669 6.00049 4.66669 6.30049 4.66669 6.66716ZM14 8.00049C14 7.63382 13.7 7.33382 13.3334 7.33382H7.33335V8.66716H13.3334C13.7 8.66716 14 8.36716 14 8.00049ZM10.6667 6.00049C11.0334 6.00049 11.3334 5.70049 11.3334 5.33382V4.66716H13.3334C13.7 4.66716 14 4.36716 14 4.00049C14 3.63382 13.7 3.33382 13.3334 3.33382H11.3334V2.66716C11.3334 2.30049 11.0334 2.00049 10.6667 2.00049C10.3 2.00049 10 2.30049 10 2.66716V5.33382C10 5.70049 10.3 6.00049 10.6667 6.00049Z'
                                fill='#4C5563'
                            />
                        </svg>
                        <span>Event Type</span>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.825 7.9126L10 11.7293L6.175 7.9126L5 9.0876L10 14.0876L15 9.0876L13.825 7.9126Z'
                                fill='#4C5563'
                            />
                        </svg>
                    </button>
                    {filtersOpen.eventType && (
                        <div className='absolute z-10 mt-1 w-48 rounded-md bg-white py-1 text-sm shadow-lg'>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Music
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Arts & Theater
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Sports
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Food & Drink
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Business
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Workshops
                            </button>
                        </div>
                    )}
                </div>

                <div className='relative'>
                    <button
                        onClick={() => toggleFilter('sort')}
                        className='flex items-center space-x-2 rounded-md border border-[#F2F3F5] bg-white px-4 py-2 font-inter text-sm font-semibold text-[#4C5563]'
                    >
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M5.76402 2.23709L3.90402 4.09709C3.69068 4.30376 3.83735 4.66376 4.13735 4.66376H5.33068V8.67042C5.33068 9.03709 5.63068 9.33709 5.99735 9.33709C6.36402 9.33709 6.66402 9.03709 6.66402 8.67042V4.66376H7.85735C8.15735 4.66376 8.30402 4.30376 8.09068 4.09709L6.23068 2.23709C6.10402 2.11042 5.89068 2.11042 5.76402 2.23709ZM10.664 11.3438V7.33709C10.664 6.97042 10.364 6.67042 9.99735 6.67042C9.63068 6.67042 9.33068 6.97042 9.33068 7.33709V11.3438H8.13735C7.83735 11.3438 7.69068 11.7038 7.90402 11.9104L9.76402 13.7638C9.89735 13.8904 10.104 13.8904 10.2373 13.7638L12.0973 11.9104C12.3107 11.7038 12.1573 11.3438 11.864 11.3438H10.664Z'
                                fill='#4C5563'
                            />
                        </svg>

                        <span>Sort</span>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.825 7.9126L10 11.7293L6.175 7.9126L5 9.0876L10 14.0876L15 9.0876L13.825 7.9126Z'
                                fill='#4C5563'
                            />
                        </svg>
                    </button>
                    {filtersOpen.sort && (
                        <div className='absolute right-0 z-10 mt-1 w-48 rounded-md bg-white py-1 text-sm shadow-lg'>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Date (Newest First)
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Date (Oldest First)
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Price (Low to High)
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Price (High to Low)
                            </button>
                            <button className='block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100'>
                                Popularity
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventFilterDropdown;

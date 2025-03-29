import { useState } from 'react';

interface EventFilterDropdownProps {
    onApply: (filters: {
        sort: string;
        dateRange: string;
        location: string;
        priceRange: number[];
        eventType: string;
    }) => void;
    onCancel: () => void;
}

const EventFilterDropdown = ({
    onApply,
    onCancel,
}: EventFilterDropdownProps) => {
    const [sort, setSort] = useState('Trending');
    const [dateRange, setDateRange] = useState('Today');
    const [location, setLocation] = useState('Lagos');
    const [priceRange, setPriceRange] = useState([50, 2000]);
    const [eventType, setEventType] = useState('In-person');

    // Handle price range slider changes
    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = parseInt(e.target.value);
        setPriceRange([newMin, priceRange[1]]);
    };

    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = parseInt(e.target.value);
        setPriceRange([priceRange[0], newMax]);
    };

    // Handle apply filters
    const handleApply = () => {
        if (onApply) {
            onApply({
                sort,
                dateRange,
                location,
                priceRange,
                eventType,
            });
        }
    };

    return (
        <div className='absolute left-[95px] top-[8px] z-50 w-64 rounded-lg border border-[#E4E6EB] bg-white'>
            <div className='flex cursor-pointer items-center justify-between bg-[#F1F6FF] px-4 py-2'>
                <div className='flex items-center gap-2 font-inter text-sm font-semibold text-[#001433]'>
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
                </div>
                <svg
                    onClick={onCancel}
                    width='8'
                    height='10'
                    viewBox='0 0 8 10'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                >
                    <path
                        d='M0.912109 1.175L4.72878 5L0.912109 8.825L2.08711 10L7.08711 5L2.08711 0L0.912109 1.175Z'
                        fill='#4C5563'
                    />
                </svg>
            </div>
            <div className='px-4 py-6'>
                {/* Sort */}
                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-[#001433]'>
                        Sort
                    </label>
                    <div className='relative'>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className='block w-full appearance-none rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm font-normal'
                        >
                            <option>Trending</option>
                            <option>Newest</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Upcoming</option>
                        </select>
                        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                            <svg
                                width='20'
                                height='20'
                                viewBox='0 0 20 20'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M13.825 7.91211L10 11.7288L6.175 7.91211L5 9.08711L10 14.0871L15 9.08711L13.825 7.91211Z'
                                    fill='#4C5563'
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Date Range */}
                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-[#001433]'>
                        Date Range
                    </label>
                    <div className='relative'>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className='block w-full appearance-none rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm font-normal'
                        >
                            <option>Today</option>
                            <option>Tomorrow</option>
                            <option>This Week</option>
                            <option>This Weekend</option>
                            <option>Next Week</option>
                            <option>This Month</option>
                        </select>
                        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                            <svg
                                className='size-4'
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                            >
                                <path
                                    fillRule='evenodd'
                                    d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-[#001433]'>
                        Location
                    </label>
                    <div className='relative'>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className='block w-full appearance-none rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm font-normal'
                        >
                            <option>Lagos</option>
                            <option>Abuja</option>
                            <option>Port Harcourt</option>
                            <option>Kano</option>
                            <option>Ibadan</option>
                            <option>Enugu</option>
                        </select>
                        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                            <svg
                                className='size-4'
                                xmlns='http://www.w3.org/2000/svg'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                            >
                                <path
                                    fillRule='evenodd'
                                    d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                                    clipRule='evenodd'
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Price Range */}
                <div className='mb-8'>
                    <label className='mb-3 block text-sm font-medium text-[#001433]'>
                        Price Range
                    </label>
                    <div className='mb-2 flex justify-between'>
                        <span className='text-gray-900'>${priceRange[0]}</span>
                        <span className='text-gray-900'>${priceRange[1]}+</span>
                    </div>
                    <div className='relative mb-4 h-4'>
                        <input
                            type='range'
                            min='0'
                            max='5000'
                            value={priceRange[0]}
                            onChange={handleMinPriceChange}
                            className='absolute h-1 w-full cursor-pointer appearance-none rounded-md bg-gray-200'
                        />
                        <input
                            type='range'
                            min='0'
                            max='5000'
                            value={priceRange[1]}
                            onChange={handleMaxPriceChange}
                            className='absolute h-1 w-full cursor-pointer appearance-none bg-transparent'
                        />
                    </div>
                    <div className='flex space-x-2'>
                        <span className='rounded-md bg-gray-700 px-2 py-1 text-xs font-medium text-white'>
                            ${priceRange[0]}
                        </span>
                        <span className='rounded-md bg-gray-700 px-2 py-1 text-xs font-medium text-white'>
                            ${priceRange[1]}
                        </span>
                    </div>
                </div>

                {/* Event Type */}
                <div className='mb-6'>
                    <label className='mb-2 block text-sm font-medium text-[#001433]'>
                        Event Type
                    </label>
                    <div className='space-y-2'>
                        <div className='flex items-center'>
                            <input
                                id='in-person'
                                name='event-type'
                                type='radio'
                                checked={eventType === 'In-person'}
                                onChange={() => setEventType('In-person')}
                                className='size-4 border-gray-300 text-[#0066FF]'
                            />
                            <label
                                htmlFor='in-person'
                                className='ml-2 block text-sm font-medium text-[#001433]'
                            >
                                In-person
                            </label>
                        </div>
                        <div className='flex items-center'>
                            <input
                                id='virtual'
                                name='event-type'
                                type='radio'
                                checked={eventType === 'Virtual'}
                                onChange={() => setEventType('Virtual')}
                                className='size-4 border-gray-300 text-[#0066FF]'
                            />
                            <label
                                htmlFor='virtual'
                                className='ml-2 block text-sm font-medium text-[#001433]'
                            >
                                Virtual
                            </label>
                        </div>
                        <div className='flex items-center'>
                            <input
                                id='hybrid'
                                name='event-type'
                                type='radio'
                                checked={eventType === 'Hybrid'}
                                onChange={() => setEventType('Hybrid')}
                                className='size-4 border-gray-300 text-[#0066FF]'
                            />
                            <label
                                htmlFor='hybrid'
                                className='ml-2 block text-sm font-medium text-[#001433]'
                            >
                                Hybrid
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex justify-between'>
                    <button
                        onClick={onCancel}
                        className='rounded-lg border border-[#E5F0FF] px-6 py-2 text-sm font-semibold text-[#0066FF]'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        className='rounded-lg bg-[#0066FF] px-6 py-2 text-sm font-medium text-white'
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventFilterDropdown;

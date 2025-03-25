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
        <div className='absolute left-0 top-12 z-10 w-64 rounded-lg border border-[#E4E6EB] bg-white px-4 py-6'>
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
                            className='h-4 w-4'
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
                            className='h-4 w-4'
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
    );
};

export default EventFilterDropdown;

import { useState } from 'react';

export interface FilterValues {
    sort?: string;
    dateRange?: string;
    customDateRange?: {
        startDate?: string;
        endDate?: string;
    };
    location?: string;
    priceRange?: number[];
    eventType?: string;
}

export interface AppliedFilters {
    sort?: boolean;
    dateRange?: boolean;
    customDateRange?: boolean;
    location?: boolean;
    priceRange?: boolean;
    eventType?: boolean;
}

interface EventFilterDropdownProps {
    onApply: (filters: FilterValues, appliedFilters: AppliedFilters) => void;
    onCancel: () => void;
    initialFilters?: Partial<FilterValues>;
    initialAppliedFilters?: AppliedFilters;
}

const EventFilterDropdown = ({
    onApply,
    onCancel,
    initialFilters,
    initialAppliedFilters,
}: EventFilterDropdownProps) => {
    const [sort, setSort] = useState(initialFilters?.sort || '');
    const [dateRange, setDateRange] = useState(initialFilters?.dateRange || '');
    const [customStartDate, setCustomStartDate] = useState(
        initialFilters?.customDateRange?.startDate || ''
    );
    const [customEndDate, setCustomEndDate] = useState(
        initialFilters?.customDateRange?.endDate || ''
    );
    const [location, setLocation] = useState(initialFilters?.location || '');
    const [priceRange, setPriceRange] = useState(
        initialFilters?.priceRange || [0, 5000]
    );
    const [eventType, setEventType] = useState(initialFilters?.eventType || '');
    const [useCustomDateRange, setUseCustomDateRange] = useState(false);

    // Track which filters have been modified by the user
    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(
        initialAppliedFilters || {}
    );

    // Handle filter changes and track what's been applied
    const handleSortChange = (value: string) => {
        setSort(value);
        setAppliedFilters((prev) => ({ ...prev, sort: value !== '' }));
    };

    const handleDateRangeChange = (value: string) => {
        setDateRange(value);
        setUseCustomDateRange(false);
        setAppliedFilters((prev) => ({
            ...prev,
            dateRange: value !== '',
            customDateRange: false,
        }));
    };

    const handleCustomDateChange = () => {
        setUseCustomDateRange(true);
        setDateRange('');
        setAppliedFilters((prev) => ({
            ...prev,
            customDateRange: customStartDate !== '' || customEndDate !== '',
            dateRange: false,
        }));
    };

    const handleLocationChange = (value: string) => {
        setLocation(value);
        setAppliedFilters((prev) => ({ ...prev, location: value !== '' }));
    };

    const handleEventTypeChange = (value: string) => {
        setEventType(value);
        setAppliedFilters((prev) => ({ ...prev, eventType: value !== '' }));
    };

    const handlePriceRangeChange = (newRange: number[]) => {
        setPriceRange(newRange);
        setAppliedFilters((prev) => ({
            ...prev,
            priceRange: newRange[0] > 0 || newRange[1] < 5000,
        }));
    };

    // Handle apply filters
    const handleApply = () => {
        if (onApply) {
            const filters: FilterValues = {};

            // Only include filters that have been applied
            if (appliedFilters.sort && sort) {
                filters.sort = sort;
            }
            if (appliedFilters.dateRange && dateRange) {
                filters.dateRange = dateRange;
            }
            if (
                appliedFilters.customDateRange &&
                (customStartDate || customEndDate)
            ) {
                filters.customDateRange = {
                    startDate: customStartDate,
                    endDate: customEndDate,
                };
            }
            if (appliedFilters.location && location) {
                filters.location = location;
            }
            if (
                appliedFilters.priceRange &&
                (priceRange[0] > 0 || priceRange[1] < 5000)
            ) {
                filters.priceRange = priceRange;
            }
            if (appliedFilters.eventType && eventType) {
                filters.eventType = eventType;
            }

            onApply(filters, appliedFilters);
        }
    };

    // Reset all filters
    const handleReset = () => {
        setSort('');
        setDateRange('');
        setCustomStartDate('');
        setCustomEndDate('');
        setLocation('');
        setPriceRange([0, 5000]);
        setEventType('');
        setUseCustomDateRange(false);
        setAppliedFilters({});
    };

    return (
        <div className='absolute left-[95px] top-[8px] z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card'>
            <div className='flex cursor-pointer items-center justify-between bg-blue-50 px-4 py-2 dark:bg-revlr-dark-bg'>
                <div className='flex items-center gap-2 font-inter text-sm font-semibold text-gray-900 dark:text-white'>
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
                    <label className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
                        Sort
                    </label>
                    <div className='relative'>
                        <select
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className='block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-normal text-gray-900 dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                        >
                            <option value=''>Select sort option</option>
                            <option value='Trending'>Trending</option>
                            <option value='Newest'>Newest</option>
                            <option value='Price: Low to High'>
                                Price: Low to High
                            </option>
                            <option value='Price: High to Low'>
                                Price: High to Low
                            </option>
                            <option value='Upcoming'>Upcoming</option>
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
                    <label className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
                        Date Range
                    </label>
                    <div className='space-y-2'>
                        <div className='relative'>
                            <select
                                value={useCustomDateRange ? '' : dateRange}
                                onChange={(e) =>
                                    handleDateRangeChange(e.target.value)
                                }
                                className='block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-normal text-gray-900 dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                disabled={useCustomDateRange}
                            >
                                <option value=''>Select date range</option>
                                <option value='Today'>Today</option>
                                <option value='Tomorrow'>Tomorrow</option>
                                <option value='This Week'>This Week</option>
                                <option value='This Weekend'>
                                    This Weekend
                                </option>
                                <option value='Next Week'>Next Week</option>
                                <option value='This Month'>This Month</option>
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

                        <div className='flex items-center'>
                            <input
                                type='checkbox'
                                id='custom-date'
                                checked={useCustomDateRange}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setUseCustomDateRange(true);
                                        setDateRange('');
                                        handleCustomDateChange();
                                    } else {
                                        setUseCustomDateRange(false);
                                        setCustomStartDate('');
                                        setCustomEndDate('');
                                        setAppliedFilters((prev) => ({
                                            ...prev,
                                            customDateRange: false,
                                        }));
                                    }
                                }}
                                className='mr-2 size-4 text-[#0066FF]'
                            />
                            <label
                                htmlFor='custom-date'
                                className='text-sm text-gray-900 dark:text-white'
                            >
                                Custom date range
                            </label>
                        </div>

                        {useCustomDateRange && (
                            <div className='space-y-2'>
                                <div>
                                    <label className='mb-1 block text-xs text-gray-600 dark:text-gray-300'>
                                        Start Date
                                    </label>
                                    <input
                                        type='datetime-local'
                                        value={customStartDate}
                                        onChange={(e) => {
                                            setCustomStartDate(e.target.value);
                                            handleCustomDateChange();
                                        }}
                                        className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                    />
                                </div>
                                <div>
                                    <label className='mb-1 block text-xs text-gray-600 dark:text-gray-300'>
                                        End Date
                                    </label>
                                    <input
                                        type='datetime-local'
                                        value={customEndDate}
                                        onChange={(e) => {
                                            setCustomEndDate(e.target.value);
                                            handleCustomDateChange();
                                        }}
                                        className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Location */}
                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-gray-900 dark:text-white'>
                        Location
                    </label>
                    <div className='relative'>
                        <select
                            value={location}
                            onChange={(e) =>
                                handleLocationChange(e.target.value)
                            }
                            className='block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-normal text-gray-900 dark:border-revlr-dark-border dark:bg-revlr-dark-bg dark:text-white'
                        >
                            <option value=''>Select location</option>
                            <option value='Lagos'>Lagos</option>
                            <option value='Abuja'>Abuja</option>
                            <option value='Port Harcourt'>Port Harcourt</option>
                            <option value='Kano'>Kano</option>
                            <option value='Ibadan'>Ibadan</option>
                            <option value='Enugu'>Enugu</option>
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
                    <label className='mb-3 block text-sm font-medium text-gray-900 dark:text-white'>
                        Price Range
                    </label>
                    <div className='mb-2 flex justify-between'>
                        <span className='text-gray-900 dark:text-white'>
                            ${priceRange[0]}
                        </span>
                        <span className='text-gray-900 dark:text-white'>
                            ${priceRange[1]}+
                        </span>
                    </div>
                    <div className='relative mb-4 h-4'>
                        <input
                            type='range'
                            min='0'
                            max='5000'
                            value={priceRange[0]}
                            onChange={(e) => {
                                const newMin = parseInt(e.target.value);
                                const newRange = [newMin, priceRange[1]];
                                handlePriceRangeChange(newRange);
                            }}
                            className='absolute h-1 w-full cursor-pointer appearance-none rounded-md bg-gray-200'
                        />
                        <input
                            type='range'
                            min='0'
                            max='5000'
                            value={priceRange[1]}
                            onChange={(e) => {
                                const newMax = parseInt(e.target.value);
                                const newRange = [priceRange[0], newMax];
                                handlePriceRangeChange(newRange);
                            }}
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
                    <label className='mb-2 block text-sm font-medium text-gray-900 dark:text-white'>
                        Event Type
                    </label>
                    <div className='space-y-2'>
                        <div className='flex items-center'>
                            <input
                                id='in-person'
                                name='event-type'
                                type='radio'
                                checked={eventType === 'In-person'}
                                onChange={() =>
                                    handleEventTypeChange('In-person')
                                }
                                className='size-4 border-gray-300 text-[#0066FF] dark:border-revlr-dark-border'
                            />
                            <label
                                htmlFor='in-person'
                                className='ml-2 block text-sm font-medium text-gray-900 dark:text-white'
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
                                onChange={() =>
                                    handleEventTypeChange('Virtual')
                                }
                                className='size-4 border-gray-300 text-[#0066FF] dark:border-revlr-dark-border'
                            />
                            <label
                                htmlFor='virtual'
                                className='ml-2 block text-sm font-medium text-gray-900 dark:text-white'
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
                                onChange={() => handleEventTypeChange('Hybrid')}
                                className='size-4 border-gray-300 text-[#0066FF] dark:border-revlr-dark-border'
                            />
                            <label
                                htmlFor='hybrid'
                                className='ml-2 block text-sm font-medium text-gray-900 dark:text-white'
                            >
                                Hybrid
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex justify-between'>
                    <div className='flex space-x-2'>
                        <button
                            onClick={onCancel}
                            className='rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-[#0066FF] hover:bg-blue-50 dark:border-revlr-dark-border dark:text-blue-400 dark:hover:bg-revlr-dark-bg'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReset}
                            className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-revlr-dark-border dark:text-gray-300 dark:hover:bg-revlr-dark-bg'
                        >
                            Reset
                        </button>
                    </div>
                    <button
                        onClick={handleApply}
                        className='rounded-lg bg-[#0066FF] px-6 py-2 text-sm font-medium text-white hover:bg-blue-700'
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventFilterDropdown;

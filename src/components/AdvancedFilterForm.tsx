'use client';

import React from 'react';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
    Calendar,
    DollarSign,
    Users,
    Tag,
    MapPin,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Button } from './ui/button';
import type { AdvancedFilterOptions } from './AdvancedFilters';

interface AdvancedFilterFormProps {
    filters: AdvancedFilterOptions;
    onFilterChange: (key: keyof AdvancedFilterOptions, value: unknown) => void;
    expandedSections: Set<string>;
    onToggleSection: (section: string) => void;
    availableCategories?: string[];
    availableVenues?: string[];
}

const AdvancedFilterForm: React.FC<AdvancedFilterFormProps> = ({
    filters,
    onFilterChange,
    expandedSections,
    onToggleSection,
    availableCategories = [],
    availableVenues = [],
}) => {
    const sections = [
        {
            id: 'basic',
            title: 'Basic Filters',
            icon: <Tag className='size-4' />,
            content: (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Event Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                onFilterChange('status', e.target.value)
                            }
                            className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                        >
                            <option value=''>All Statuses</option>
                            <option value='0'>Draft</option>
                            <option value='1'>Published</option>
                            <option value='2'>Cancelled</option>
                            <option value='3'>Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Category
                        </label>
                        {availableCategories.length > 0 ? (
                            <select
                                value={filters.category}
                                onChange={(e) =>
                                    onFilterChange('category', e.target.value)
                                }
                                className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                            >
                                <option value=''>All Categories</option>
                                {availableCategories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                type='text'
                                placeholder='Enter category'
                                value={filters.category}
                                onChange={(e) =>
                                    onFilterChange('category', e.target.value)
                                }
                            />
                        )}
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Venue
                        </label>
                        {availableVenues.length > 0 ? (
                            <select
                                value={filters.venue}
                                onChange={(e) =>
                                    onFilterChange('venue', e.target.value)
                                }
                                className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                            >
                                <option value=''>All Venues</option>
                                {availableVenues.map((venue) => (
                                    <option key={venue} value={venue}>
                                        {venue}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                type='text'
                                placeholder='Enter venue name'
                                value={filters.venue}
                                onChange={(e) =>
                                    onFilterChange('venue', e.target.value)
                                }
                            />
                        )}
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Sort By
                        </label>
                        <div className='flex gap-2'>
                            <select
                                value={filters.sortBy}
                                onChange={(e) =>
                                    onFilterChange('sortBy', e.target.value)
                                }
                                className='flex-1 rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                            >
                                <option value='dateCreated'>
                                    Date Created
                                </option>
                                <option value='startDate'>Start Date</option>
                                <option value='title'>Title</option>
                                <option value='registrationCount'>
                                    Registrations
                                </option>
                                <option value='revenue'>Revenue</option>
                                <option value='status'>Status</option>
                            </select>
                            <select
                                value={filters.sortOrder}
                                onChange={(e) =>
                                    onFilterChange(
                                        'sortOrder',
                                        e.target.value as 'asc' | 'desc'
                                    )
                                }
                                className='rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                            >
                                <option value='desc'>Descending</option>
                                <option value='asc'>Ascending</option>
                            </select>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'dates',
            title: 'Date Filters',
            icon: <Calendar className='size-4' />,
            content: (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Event Start Date From
                        </label>
                        <Input
                            type='date'
                            value={filters.startDate}
                            onChange={(e) =>
                                onFilterChange('startDate', e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Event Start Date To
                        </label>
                        <Input
                            type='date'
                            value={filters.endDate}
                            onChange={(e) =>
                                onFilterChange('endDate', e.target.value)
                            }
                        />
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Registration Start Date From
                        </label>
                        <Input
                            type='date'
                            value={filters.registrationStartDate}
                            onChange={(e) =>
                                onFilterChange(
                                    'registrationStartDate',
                                    e.target.value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Registration End Date To
                        </label>
                        <Input
                            type='date'
                            value={filters.registrationEndDate}
                            onChange={(e) =>
                                onFilterChange(
                                    'registrationEndDate',
                                    e.target.value
                                )
                            }
                        />
                    </div>
                </div>
            ),
        },
        {
            id: 'revenue',
            title: 'Revenue Filters',
            icon: <DollarSign className='size-4' />,
            content: (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Minimum Event Revenue
                        </label>
                        <Input
                            type='number'
                            placeholder='0'
                            value={filters.minRevenue || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'minRevenue',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null
                                )
                            }
                        />
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Maximum Event Revenue
                        </label>
                        <Input
                            type='number'
                            placeholder='No limit'
                            value={filters.maxRevenue || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'maxRevenue',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null
                                )
                            }
                        />
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Minimum Registration Amount
                        </label>
                        <Input
                            type='number'
                            placeholder='0'
                            value={filters.minAmount || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'minAmount',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null
                                )
                            }
                        />
                    </div>

                    <div>
                        <label className='mb-2 block text-sm font-medium'>
                            Maximum Registration Amount
                        </label>
                        <Input
                            type='number'
                            placeholder='No limit'
                            value={filters.maxAmount || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'maxAmount',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null
                                )
                            }
                        />
                    </div>
                </div>
            ),
        },
        {
            id: 'registrations',
            title: 'Registration Filters',
            icon: <Users className='size-4' />,
            content: (
                <div className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Minimum Registrations
                            </label>
                            <Input
                                type='number'
                                placeholder='0'
                                value={filters.minRegistrations || ''}
                                onChange={(e) =>
                                    onFilterChange(
                                        'minRegistrations',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Maximum Registrations
                            </label>
                            <Input
                                type='number'
                                placeholder='No limit'
                                value={filters.maxRegistrations || ''}
                                onChange={(e) =>
                                    onFilterChange(
                                        'maxRegistrations',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null
                                    )
                                }
                            />
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Payment Status
                            </label>
                            <select
                                value={filters.paymentStatus}
                                onChange={(e) =>
                                    onFilterChange(
                                        'paymentStatus',
                                        e.target.value
                                    )
                                }
                                className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                            >
                                <option value=''>All Payment Statuses</option>
                                <option value='pending'>Pending</option>
                                <option value='completed'>Completed</option>
                                <option value='failed'>Failed</option>
                                <option value='refunded'>Refunded</option>
                            </select>
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Attendee Search
                            </label>
                            <Input
                                type='text'
                                placeholder='Search attendees...'
                                value={filters.attendeeSearchTerm}
                                onChange={(e) =>
                                    onFilterChange(
                                        'attendeeSearchTerm',
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className='space-y-3'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='hasRegistrations'
                                checked={filters.hasRegistrations === true}
                                onCheckedChange={(checked) =>
                                    onFilterChange(
                                        'hasRegistrations',
                                        checked ? true : null
                                    )
                                }
                            />
                            <label
                                htmlFor='hasRegistrations'
                                className='text-sm'
                            >
                                Events with registrations only
                            </label>
                        </div>

                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='isFinanced'
                                checked={filters.isFinanced === true}
                                onCheckedChange={(checked) =>
                                    onFilterChange(
                                        'isFinanced',
                                        checked ? true : null
                                    )
                                }
                            />
                            <label htmlFor='isFinanced' className='text-sm'>
                                Financed registrations only
                            </label>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'event-type',
            title: 'Event Type Filters',
            icon: <MapPin className='size-4' />,
            content: (
                <div className='space-y-4'>
                    <div className='flex items-center space-x-2'>
                        <Checkbox
                            id='isVirtual'
                            checked={filters.isVirtual === true}
                            onCheckedChange={(checked) =>
                                onFilterChange(
                                    'isVirtual',
                                    checked ? true : null
                                )
                            }
                        />
                        <label htmlFor='isVirtual' className='text-sm'>
                            Virtual events only
                        </label>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <Checkbox
                            id='isInPerson'
                            checked={filters.isVirtual === false}
                            onCheckedChange={(checked) =>
                                onFilterChange(
                                    'isVirtual',
                                    checked ? false : null
                                )
                            }
                        />
                        <label htmlFor='isInPerson' className='text-sm'>
                            In-person events only
                        </label>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div className='space-y-4'>
            {sections.map((section) => (
                <div key={section.id} className='rounded-lg border'>
                    <Button
                        variant='ghost'
                        onClick={() => onToggleSection(section.id)}
                        className='h-auto w-full justify-between p-4'
                    >
                        <div className='flex items-center gap-2'>
                            {section.icon}
                            <span className='font-medium'>{section.title}</span>
                        </div>
                        {expandedSections.has(section.id) ? (
                            <ChevronUp className='size-4' />
                        ) : (
                            <ChevronDown className='size-4' />
                        )}
                    </Button>

                    {expandedSections.has(section.id) && (
                        <div className='border-t p-4 pt-0'>
                            {section.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default React.memo(AdvancedFilterForm);

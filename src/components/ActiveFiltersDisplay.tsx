'use client';

import React from 'react';
import {
    X,
    Calendar,
    DollarSign,
    Users,
    Tag,
    MapPin,
    Search,
    CreditCard,
} from 'lucide-react';
import type { AdvancedFilterOptions } from './AdvancedFilters';

interface ActiveFiltersDisplayProps {
    filters: AdvancedFilterOptions;
    onRemoveFilter: (key: keyof AdvancedFilterOptions) => void;
}

interface FilterChipProps {
    label: string;
    icon?: React.ReactNode;
    onRemove: () => void;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}

const FilterChip: React.FC<FilterChipProps> = ({
    label,
    icon,
    onRemove,
    color = 'blue',
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${colorClasses[color]}`}
        >
            {icon}
            <span className='max-w-32 truncate'>{label}</span>
            <button
                onClick={onRemove}
                className='ml-1 transition-opacity hover:opacity-70'
                aria-label={`Remove ${label} filter`}
            >
                <X className='size-3' />
            </button>
        </span>
    );
};

const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
    filters,
    onRemoveFilter,
}) => {
    const getStatusLabel = (status: string) => {
        const statusLabels: Record<string, string> = {
            '0': 'Draft',
            '1': 'Published',
            '2': 'Cancelled',
            '3': 'Completed',
        };
        return statusLabels[status] || status;
    };

    const getPaymentStatusLabel = (status: string) => {
        const statusLabels: Record<string, string> = {
            pending: 'Pending',
            completed: 'Completed',
            failed: 'Failed',
            refunded: 'Refunded',
        };
        return statusLabels[status] || status;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const activeFilters: Array<{
        key: keyof AdvancedFilterOptions;
        label: string;
        icon: React.ReactNode;
        color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
    }> = [];

    // Search term
    if (filters.searchTerm) {
        activeFilters.push({
            key: 'searchTerm',
            label: `Search: "${filters.searchTerm}"`,
            icon: <Search className='size-3' />,
            color: 'purple',
        });
    }

    // Status
    if (filters.status) {
        activeFilters.push({
            key: 'status',
            label: `Status: ${getStatusLabel(filters.status)}`,
            icon: <Tag className='size-3' />,
            color: 'blue',
        });
    }

    // Category
    if (filters.category) {
        activeFilters.push({
            key: 'category',
            label: `Category: ${filters.category}`,
            icon: <Tag className='size-3' />,
            color: 'green',
        });
    }

    // Venue
    if (filters.venue) {
        activeFilters.push({
            key: 'venue',
            label: `Venue: ${filters.venue}`,
            icon: <MapPin className='size-3' />,
            color: 'green',
        });
    }

    // Event date range
    if (filters.startDate && filters.endDate) {
        activeFilters.push({
            key: 'startDate',
            label: `Event Dates: ${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
            icon: <Calendar className='size-3' />,
            color: 'orange',
        });
    } else if (filters.startDate) {
        activeFilters.push({
            key: 'startDate',
            label: `From: ${formatDate(filters.startDate)}`,
            icon: <Calendar className='size-3' />,
            color: 'orange',
        });
    } else if (filters.endDate) {
        activeFilters.push({
            key: 'endDate',
            label: `To: ${formatDate(filters.endDate)}`,
            icon: <Calendar className='size-3' />,
            color: 'orange',
        });
    }

    // Registration date range
    if (filters.registrationStartDate && filters.registrationEndDate) {
        activeFilters.push({
            key: 'registrationStartDate',
            label: `Reg Dates: ${formatDate(filters.registrationStartDate)} - ${formatDate(filters.registrationEndDate)}`,
            icon: <Calendar className='size-3' />,
            color: 'orange',
        });
    } else if (filters.registrationStartDate) {
        activeFilters.push({
            key: 'registrationStartDate',
            label: `Reg From: ${formatDate(filters.registrationStartDate)}`,
            icon: <Calendar className='size-3' />,
            color: 'orange',
        });
    } else if (filters.registrationEndDate) {
        activeFilters.push({
            key: 'registrationEndDate',
            label: `Reg To: ${formatDate(filters.registrationEndDate)}`,
            icon: <Calendar className='size-3' />,
            color: 'orange',
        });
    }

    // Revenue range
    if (filters.minRevenue && filters.maxRevenue) {
        activeFilters.push({
            key: 'minRevenue',
            label: `Revenue: ${formatCurrency(filters.minRevenue)} - ${formatCurrency(filters.maxRevenue)}`,
            icon: <DollarSign className='size-3' />,
            color: 'green',
        });
    } else if (filters.minRevenue) {
        activeFilters.push({
            key: 'minRevenue',
            label: `Min Revenue: ${formatCurrency(filters.minRevenue)}`,
            icon: <DollarSign className='size-3' />,
            color: 'green',
        });
    } else if (filters.maxRevenue) {
        activeFilters.push({
            key: 'maxRevenue',
            label: `Max Revenue: ${formatCurrency(filters.maxRevenue)}`,
            icon: <DollarSign className='size-3' />,
            color: 'green',
        });
    }

    // Registration amount range
    if (filters.minAmount && filters.maxAmount) {
        activeFilters.push({
            key: 'minAmount',
            label: `Reg Amount: ${formatCurrency(filters.minAmount)} - ${formatCurrency(filters.maxAmount)}`,
            icon: <CreditCard className='size-3' />,
            color: 'green',
        });
    } else if (filters.minAmount) {
        activeFilters.push({
            key: 'minAmount',
            label: `Min Amount: ${formatCurrency(filters.minAmount)}`,
            icon: <CreditCard className='size-3' />,
            color: 'green',
        });
    } else if (filters.maxAmount) {
        activeFilters.push({
            key: 'maxAmount',
            label: `Max Amount: ${formatCurrency(filters.maxAmount)}`,
            icon: <CreditCard className='size-3' />,
            color: 'green',
        });
    }

    // Registration count range
    if (filters.minRegistrations && filters.maxRegistrations) {
        activeFilters.push({
            key: 'minRegistrations',
            label: `Registrations: ${filters.minRegistrations} - ${filters.maxRegistrations}`,
            icon: <Users className='size-3' />,
            color: 'blue',
        });
    } else if (filters.minRegistrations) {
        activeFilters.push({
            key: 'minRegistrations',
            label: `Min Registrations: ${filters.minRegistrations}`,
            icon: <Users className='size-3' />,
            color: 'blue',
        });
    } else if (filters.maxRegistrations) {
        activeFilters.push({
            key: 'maxRegistrations',
            label: `Max Registrations: ${filters.maxRegistrations}`,
            icon: <Users className='size-3' />,
            color: 'blue',
        });
    }

    // Payment status
    if (filters.paymentStatus) {
        activeFilters.push({
            key: 'paymentStatus',
            label: `Payment: ${getPaymentStatusLabel(filters.paymentStatus)}`,
            icon: <CreditCard className='size-3' />,
            color: 'purple',
        });
    }

    // Attendee search
    if (filters.attendeeSearchTerm) {
        activeFilters.push({
            key: 'attendeeSearchTerm',
            label: `Attendee: "${filters.attendeeSearchTerm}"`,
            icon: <Users className='size-3' />,
            color: 'purple',
        });
    }

    // Boolean filters
    if (filters.isVirtual !== null) {
        activeFilters.push({
            key: 'isVirtual',
            label: filters.isVirtual ? 'Virtual Events' : 'In-Person Events',
            icon: <MapPin className='size-3' />,
            color: 'gray',
        });
    }

    if (filters.hasRegistrations !== null) {
        activeFilters.push({
            key: 'hasRegistrations',
            label: filters.hasRegistrations
                ? 'Has Registrations'
                : 'No Registrations',
            icon: <Users className='size-3' />,
            color: 'gray',
        });
    }

    if (filters.isFinanced !== null) {
        activeFilters.push({
            key: 'isFinanced',
            label: filters.isFinanced ? 'Financed' : 'Not Financed',
            icon: <CreditCard className='size-3' />,
            color: 'gray',
        });
    }

    if (activeFilters.length === 0) {
        return null;
    }

    return (
        <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                <span className='font-medium'>Active Filters:</span>
                <span className='rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800'>
                    {activeFilters.length} applied
                </span>
            </div>
            <div className='flex flex-wrap gap-2'>
                {activeFilters.map((filter) => (
                    <FilterChip
                        key={filter.key}
                        label={filter.label}
                        icon={filter.icon}
                        color={filter.color}
                        onRemove={() => onRemoveFilter(filter.key)}
                    />
                ))}
            </div>
        </div>
    );
};

export default React.memo(ActiveFiltersDisplay);

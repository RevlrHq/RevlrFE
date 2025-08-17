'use client';

import React, { useState } from 'react';
import { EventSummaryView, EventStatus } from '../lib/api';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
    MoreHorizontal,
    Edit,
    Copy,
    Eye,
    Calendar,
    Users,
    DollarSign,
} from 'lucide-react';

interface EventTableRowProps {
    event: EventSummaryView;
    selected: boolean;
    onSelect: (checked: boolean) => void;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    showBulkActions: boolean;
    showActions: boolean;
    theme: string;
    formatCurrency: (amount: number) => string;
    formatDate: (date: string) => string;
    getStatusColor: (status: EventStatus) => string;
    getStatusLabel: (status: EventStatus) => string;
    getStatusIcon: (status: EventStatus) => React.ReactNode;
}

const EventTableRow: React.FC<EventTableRowProps> = ({
    event,
    selected,
    onSelect,
    onView,
    onEdit,
    onDuplicate,
    showBulkActions,
    showActions,
    theme,
    formatCurrency,
    formatDate,
    getStatusColor,
    getStatusLabel,
    getStatusIcon,
}) => {
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    return (
        <tr
            className={`border-b transition-colors hover:bg-gray-50 dark:hover:bg-revlr-dark-border ${
                theme === 'dark'
                    ? 'border-revlr-dark-border'
                    : 'border-gray-200'
            }`}
        >
            {showBulkActions && (
                <td className='p-4'>
                    <Checkbox
                        checked={selected}
                        onCheckedChange={onSelect}
                        aria-label={`Select ${event.title}`}
                    />
                </td>
            )}

            <td className='p-4'>
                <div className='flex items-center space-x-3'>
                    {event.bannerImageUrl ? (
                        <img
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className='h-12 w-12 rounded-lg object-cover'
                        />
                    ) : (
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700'>
                            <Calendar className='h-6 w-6 text-gray-400' />
                        </div>
                    )}
                    <div>
                        <h3 className='text-sm font-semibold'>{event.title}</h3>
                        <p
                            className={`text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {event.venue ||
                                (event.isVirtual ? 'Virtual Event' : 'TBA')}
                        </p>
                    </div>
                </div>
            </td>

            <td className='p-4'>
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(event.status!)}`}
                >
                    {getStatusIcon(event.status!)}
                    {getStatusLabel(event.status!)}
                </span>
            </td>

            <td className='p-4'>
                <div className='text-sm'>
                    <div className='font-medium'>
                        {formatDate(event.startDate!)}
                    </div>
                    {event.endDate && event.endDate !== event.startDate && (
                        <div
                            className={`text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            to {formatDate(event.endDate)}
                        </div>
                    )}
                </div>
            </td>

            <td className='p-4'>
                <div className='flex items-center gap-1 text-sm'>
                    <Users className='h-4 w-4 text-gray-400' />
                    <span className='font-medium'>
                        {event.registrationCount || 0}
                    </span>
                    {event.totalTickets && (
                        <span
                            className={`text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            / {event.totalTickets}
                        </span>
                    )}
                </div>
            </td>

            <td className='p-4'>
                <div className='flex items-center gap-1 text-sm'>
                    <DollarSign className='h-4 w-4 text-gray-400' />
                    <span className='font-medium'>
                        {formatCurrency(event.revenue || 0)}
                    </span>
                </div>
            </td>

            {showActions && (
                <td className='p-4'>
                    <div className='relative'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                            className='h-8 w-8 p-0'
                        >
                            <MoreHorizontal className='h-4 w-4' />
                        </Button>

                        {showActionsMenu && (
                            <div
                                className={`absolute right-0 top-8 z-10 w-48 rounded-lg border shadow-lg ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className='py-1'>
                                    <button
                                        onClick={() => {
                                            onView();
                                            setShowActionsMenu(false);
                                        }}
                                        className='flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-revlr-dark-border'
                                    >
                                        <Eye className='h-4 w-4' />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => {
                                            onEdit();
                                            setShowActionsMenu(false);
                                        }}
                                        className='flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-revlr-dark-border'
                                    >
                                        <Edit className='h-4 w-4' />
                                        Edit Event
                                    </button>
                                    <button
                                        onClick={() => {
                                            onDuplicate();
                                            setShowActionsMenu(false);
                                        }}
                                        className='flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-revlr-dark-border'
                                    >
                                        <Copy className='h-4 w-4' />
                                        Duplicate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
};

export default EventTableRow;

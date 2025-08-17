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

interface EventMobileCardProps {
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

const EventMobileCard: React.FC<EventMobileCardProps> = ({
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
        <div
            className={`rounded-lg border p-4 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <div className='mb-3 flex items-start justify-between'>
                <div className='flex flex-1 items-center gap-3'>
                    {showBulkActions && (
                        <Checkbox
                            checked={selected}
                            onCheckedChange={onSelect}
                            aria-label={`Select ${event.title}`}
                        />
                    )}

                    {event.bannerImageUrl ? (
                        <img
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className='h-16 w-16 rounded-lg object-cover'
                        />
                    ) : (
                        <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700'>
                            <Calendar className='h-8 w-8 text-gray-400' />
                        </div>
                    )}

                    <div className='min-w-0 flex-1'>
                        <h3 className='truncate text-sm font-semibold'>
                            {event.title}
                        </h3>
                        <p
                            className={`mt-1 text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {event.venue ||
                                (event.isVirtual ? 'Virtual Event' : 'TBA')}
                        </p>
                        <div className='mt-2'>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(event.status!)}`}
                            >
                                {getStatusIcon(event.status!)}
                                {getStatusLabel(event.status!)}
                            </span>
                        </div>
                    </div>
                </div>

                {showActions && (
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
                )}
            </div>

            <div className='mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                <div>
                    <div className='flex items-center gap-1 text-sm'>
                        <Calendar className='h-4 w-4 text-gray-400' />
                        <span className='font-medium'>
                            {formatDate(event.startDate!)}
                        </span>
                    </div>
                    {event.endDate && event.endDate !== event.startDate && (
                        <div
                            className={`ml-5 mt-1 text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            to {formatDate(event.endDate)}
                        </div>
                    )}
                </div>

                <div>
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
                </div>

                <div className='col-span-2'>
                    <div className='flex items-center gap-1 text-sm'>
                        <DollarSign className='h-4 w-4 text-gray-400' />
                        <span className='font-medium'>
                            {formatCurrency(event.revenue || 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventMobileCard;

'use client';

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { EventSummaryView } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import {
    MoreHorizontal,
    Edit,
    Copy,
    Eye,
    Calendar,
    Users,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    Archive,
} from 'lucide-react';

interface VirtualizedEventTableProps {
    events: EventSummaryView[];
    selectedEvents: Set<string>;
    onSelectEvent: (eventId: string, checked: boolean) => void;
    onEventEdit?: (eventId: string) => void;
    onEventView?: (eventId: string) => void;
    onEventDuplicate?: (eventId: string) => void;
    showBulkActions?: boolean;
    showActions?: boolean;
    height?: number;
    itemHeight?: number;
}

interface EventRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        events: EventSummaryView[];
        selectedEvents: Set<string>;
        onSelectEvent: (eventId: string, checked: boolean) => void;
        onEventEdit?: (eventId: string) => void;
        onEventView?: (eventId: string) => void;
        onEventDuplicate?: (eventId: string) => void;
        showBulkActions: boolean;
        showActions: boolean;
        theme: string;
    };
}

const EventRow: React.FC<EventRowProps> = ({ index, style, data }) => {
    const {
        events,
        selectedEvents,
        onSelectEvent,
        onEventEdit,
        onEventView,
        onEventDuplicate,
        showBulkActions,
        showActions,
        theme,
    } = data;

    const event = events[index];
    const isSelected = selectedEvents.has(event.id!);

    const getStatusColor = useCallback((status: number) => {
        switch (status) {
            case 1: // Published
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 0: // Draft
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 2: // Cancelled
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 3: // Completed
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    }, []);

    const getStatusLabel = useCallback((status: number) => {
        switch (status) {
            case 1:
                return 'Published';
            case 0:
                return 'Draft';
            case 2:
                return 'Cancelled';
            case 3:
                return 'Completed';
            default:
                return 'Unknown';
        }
    }, []);

    const getStatusIcon = useCallback((status: number) => {
        switch (status) {
            case 1:
                return <CheckCircle className='h-4 w-4' />;
            case 0:
                return <Clock className='h-4 w-4' />;
            case 2:
                return <XCircle className='h-4 w-4' />;
            case 3:
                return <Archive className='h-4 w-4' />;
            default:
                return <Clock className='h-4 w-4' />;
        }
    }, []);

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, []);

    return (
        <div
            style={style}
            className={`flex items-center border-b px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
        >
            {showBulkActions && (
                <div className='w-12 flex-shrink-0'>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                            onSelectEvent(event.id!, !!checked)
                        }
                        aria-label={`Select ${event.title}`}
                    />
                </div>
            )}

            {/* Event thumbnail and title */}
            <div className='flex min-w-0 flex-1 items-center space-x-4'>
                <div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700'>
                    {event.bannerImageUrl ? (
                        <img
                            src={event.bannerImageUrl}
                            alt={event.title}
                            className='h-full w-full object-cover'
                            loading='lazy'
                        />
                    ) : (
                        <div className='flex h-full w-full items-center justify-center'>
                            <Calendar className='h-6 w-6 text-gray-400' />
                        </div>
                    )}
                </div>
                <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                        {event.title}
                    </p>
                    <p className='truncate text-sm text-gray-500 dark:text-gray-400'>
                        {event.venue ||
                            (event.isVirtual ? 'Virtual Event' : 'TBA')}
                    </p>
                </div>
            </div>

            {/* Status */}
            <div className='w-24 flex-shrink-0'>
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(event.status!)}`}
                >
                    {getStatusIcon(event.status!)}
                    {getStatusLabel(event.status!)}
                </span>
            </div>

            {/* Date */}
            <div className='w-24 flex-shrink-0 text-sm text-gray-900 dark:text-white'>
                {formatDate(event.startDate!)}
            </div>

            {/* Registrations */}
            <div className='w-24 flex-shrink-0'>
                <div className='flex items-center text-sm text-gray-900 dark:text-white'>
                    <Users className='mr-1 h-4 w-4 text-gray-400' />
                    {event.registrationCount || 0}
                </div>
            </div>

            {/* Revenue */}
            <div className='w-32 flex-shrink-0'>
                <div className='flex items-center text-sm font-medium text-gray-900 dark:text-white'>
                    <DollarSign className='mr-1 h-4 w-4 text-gray-400' />
                    {formatCurrency(event.revenue || 0)}
                </div>
            </div>

            {/* Actions */}
            {showActions && (
                <div className='w-20 flex-shrink-0'>
                    <div className='flex items-center justify-end space-x-1'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEventView?.(event.id!)}
                            className='h-8 w-8 p-0'
                        >
                            <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEventEdit?.(event.id!)}
                            className='h-8 w-8 p-0'
                        >
                            <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => onEventDuplicate?.(event.id!)}
                            className='h-8 w-8 p-0'
                        >
                            <Copy className='h-4 w-4' />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const VirtualizedEventTable: React.FC<VirtualizedEventTableProps> = ({
    events,
    selectedEvents,
    onSelectEvent,
    onEventEdit,
    onEventView,
    onEventDuplicate,
    showBulkActions = true,
    showActions = true,
    height = 600,
    itemHeight = 80,
}) => {
    const { theme } = useTheme();

    const itemData = useMemo(
        () => ({
            events,
            selectedEvents,
            onSelectEvent,
            onEventEdit,
            onEventView,
            onEventDuplicate,
            showBulkActions,
            showActions,
            theme,
        }),
        [
            events,
            selectedEvents,
            onSelectEvent,
            onEventEdit,
            onEventView,
            onEventDuplicate,
            showBulkActions,
            showActions,
            theme,
        ]
    );

    if (events.length === 0) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <div className='text-center'>
                    <Calendar className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                        No events found
                    </h3>
                    <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                        Try adjusting your search or filters
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
        >
            {/* Header */}
            <div
                className={`flex items-center border-b px-4 py-3 font-medium text-gray-900 dark:text-white ${
                    theme === 'dark'
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-200 bg-gray-50'
                }`}
            >
                {showBulkActions && (
                    <div className='w-12 flex-shrink-0'>Select</div>
                )}
                <div className='min-w-0 flex-1'>Event</div>
                <div className='w-24 flex-shrink-0'>Status</div>
                <div className='w-24 flex-shrink-0'>Date</div>
                <div className='w-24 flex-shrink-0'>Registrations</div>
                <div className='w-32 flex-shrink-0'>Revenue</div>
                {showActions && (
                    <div className='w-20 flex-shrink-0'>Actions</div>
                )}
            </div>

            {/* Virtualized list */}
            <List
                height={height}
                itemCount={events.length}
                itemSize={itemHeight}
                itemData={itemData}
                overscanCount={5}
            >
                {EventRow}
            </List>
        </div>
    );
};

export default React.memo(VirtualizedEventTable);

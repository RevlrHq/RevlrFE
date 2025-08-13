'use client';

import React, { useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { TicketForm } from './TicketForm';
import { TicketList } from './TicketList';
import { TicketPreview } from './TicketPreview';
import type { EventTicket, EventCreationData } from '@src/types/event-creation';

interface TicketManagementProps {
    tickets: EventTicket[];
    eventData: EventCreationData;
    onAddTicket: (ticket: Omit<EventTicket, 'id'>) => void;
    onUpdateTicket: (ticketId: string, updates: Partial<EventTicket>) => void;
    onDeleteTicket: (ticketId: string) => void;
    onSelectTicket?: (ticketId: string) => void;
    isLoading?: boolean;
    errors?: Record<string, string>;
}

type ViewMode = 'list' | 'add' | 'edit' | 'preview';

export const TicketManagement: React.FC<TicketManagementProps> = ({
    tickets,
    eventData,
    onAddTicket,
    onUpdateTicket,
    onDeleteTicket,
    onSelectTicket,
    isLoading = false,
    errors = {},
}) => {
    const { theme } = useTheme();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingTicket, setEditingTicket] = useState<EventTicket | null>(
        null
    );
    const [previewTicket, setPreviewTicket] = useState<EventTicket | null>(
        null
    );

    const handleAddTicket = () => {
        setEditingTicket(null);
        setViewMode('add');
    };

    const handleEditTicket = (ticket: EventTicket) => {
        setEditingTicket(ticket);
        setViewMode('edit');
    };

    const handlePreviewTicket = (ticket: EventTicket) => {
        setPreviewTicket(ticket);
        setViewMode('preview');
    };

    const handleSaveTicket = (ticketData: Omit<EventTicket, 'id'>) => {
        if (editingTicket) {
            // Update existing ticket
            onUpdateTicket(editingTicket.id!, ticketData);
        } else {
            // Add new ticket
            onAddTicket(ticketData);
        }
        setViewMode('list');
        setEditingTicket(null);
    };

    const handleCancelForm = () => {
        setViewMode('list');
        setEditingTicket(null);
        setPreviewTicket(null);
    };

    const handleDeleteTicket = (ticketId: string) => {
        onDeleteTicket(ticketId);
        // If we're editing the deleted ticket, go back to list
        if (editingTicket?.id === ticketId) {
            setViewMode('list');
            setEditingTicket(null);
        }
    };

    const getEventDisplayData = () => ({
        name: eventData.eventName || 'Sample Event',
        date:
            eventData.dateRange?.startDate ||
            new Date().toISOString().split('T')[0],
        location:
            eventData.locationDetails?.venueName ||
            eventData.locationDetails?.eventLink ||
            'Event Location',
    });

    const eventDisplayData = getEventDisplayData();

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div
                className={`rounded-xl p-6 shadow-lg transition-all duration-200 ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <div>
                        <h2
                            className={`font-inter text-xl font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            <span className='mr-2 text-revlr-accent-orange'>
                                *
                            </span>
                            Ticket Configuration
                        </h2>
                        <p
                            className={`mt-1 text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Create and manage ticket types for your event
                        </p>
                    </div>

                    {viewMode === 'list' && (
                        <div className='flex space-x-3'>
                            {tickets.length > 0 && (
                                <button
                                    onClick={() =>
                                        handlePreviewTicket(tickets[0])
                                    }
                                    className={`rounded-xl px-4 py-2 font-inter font-medium transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Preview
                                </button>
                            )}
                            <button
                                onClick={handleAddTicket}
                                disabled={isLoading}
                                className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-2 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                Add Ticket
                            </button>
                        </div>
                    )}

                    {(viewMode === 'add' ||
                        viewMode === 'edit' ||
                        viewMode === 'preview') && (
                        <button
                            onClick={handleCancelForm}
                            className={`rounded-xl px-4 py-2 font-inter font-medium transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Back to List
                        </button>
                    )}
                </div>

                {/* Error Display */}
                {errors.tickets && (
                    <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3'>
                        <p className='font-inter text-sm text-red-700'>
                            {errors.tickets}
                        </p>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                {/* Main Content */}
                <div className='lg:col-span-2'>
                    {viewMode === 'list' && (
                        <TicketList
                            tickets={tickets}
                            onEditTicket={handleEditTicket}
                            onDeleteTicket={handleDeleteTicket}
                            onSelectTicket={onSelectTicket}
                            isLoading={isLoading}
                        />
                    )}

                    {(viewMode === 'add' || viewMode === 'edit') && (
                        <div
                            className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border border-gray-200 bg-white'
                            }`}
                        >
                            <TicketForm
                                ticket={editingTicket || undefined}
                                onSave={handleSaveTicket}
                                onCancel={handleCancelForm}
                                isEditing={viewMode === 'edit'}
                            />
                        </div>
                    )}

                    {viewMode === 'preview' && previewTicket && (
                        <div
                            className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border border-gray-200 bg-white'
                            }`}
                        >
                            <div className='mb-6 flex items-center justify-between'>
                                <h3
                                    className={`font-inter text-lg font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    Ticket Preview
                                </h3>
                                <div className='flex space-x-2'>
                                    <button
                                        onClick={() =>
                                            handleEditTicket(previewTicket)
                                        }
                                        className='px-4 py-2 text-sm font-medium text-revlr-primary-blue transition-colors duration-200 hover:text-revlr-primary-blue/80'
                                    >
                                        Edit Ticket
                                    </button>
                                </div>
                            </div>
                            <TicketPreview
                                ticket={previewTicket}
                                eventName={eventDisplayData.name}
                                eventDate={eventDisplayData.date}
                                eventLocation={eventDisplayData.location}
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className='space-y-6'>
                    {/* Quick Stats */}
                    <div
                        className={`rounded-xl p-6 shadow-lg transition-all duration-200 ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                : 'border border-gray-200 bg-white'
                        }`}
                    >
                        <h3
                            className={`mb-4 font-inter text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Ticket Summary
                        </h3>

                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <span
                                    className={`text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Total Tickets
                                </span>
                                <span
                                    className={`font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {tickets.length}
                                </span>
                            </div>

                            <div className='flex items-center justify-between'>
                                <span
                                    className={`text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Free Tickets
                                </span>
                                <span
                                    className={`font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {
                                        tickets.filter((t) => t.type === 'free')
                                            .length
                                    }
                                </span>
                            </div>

                            <div className='flex items-center justify-between'>
                                <span
                                    className={`text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Paid Tickets
                                </span>
                                <span
                                    className={`font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {
                                        tickets.filter((t) => t.type === 'paid')
                                            .length
                                    }
                                </span>
                            </div>

                            <div className='flex items-center justify-between'>
                                <span
                                    className={`text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Total Capacity
                                </span>
                                <span
                                    className={`font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {tickets.reduce(
                                        (sum, ticket) => sum + ticket.quantity,
                                        0
                                    )}
                                </span>
                            </div>

                            {tickets.length > 0 && (
                                <div className='flex items-center justify-between border-t border-gray-200 pt-2 dark:border-revlr-dark-border'>
                                    <span
                                        className={`text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        Price Range
                                    </span>
                                    <span
                                        className={`font-semibold ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {(() => {
                                            const paidTickets = tickets.filter(
                                                (t) =>
                                                    t.type === 'paid' && t.price
                                            );
                                            if (paidTickets.length === 0)
                                                return 'Free';
                                            const prices = paidTickets.map(
                                                (t) => t.price || 0
                                            );
                                            const min = Math.min(...prices);
                                            const max = Math.max(...prices);
                                            if (min === max) {
                                                return new Intl.NumberFormat(
                                                    'en-US',
                                                    {
                                                        style: 'currency',
                                                        currency: 'USD',
                                                    }
                                                ).format(min);
                                            }
                                            return `${new Intl.NumberFormat(
                                                'en-US',
                                                {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                }
                                            ).format(
                                                min
                                            )} - ${new Intl.NumberFormat(
                                                'en-US',
                                                {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                }
                                            ).format(max)}`;
                                        })()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips */}
                    <div
                        className={`rounded-xl p-6 shadow-lg transition-all duration-200 ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                : 'border border-gray-200 bg-white'
                        }`}
                    >
                        <h3
                            className={`mb-4 font-inter text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Tips
                        </h3>

                        <div className='space-y-3 text-sm'>
                            <div
                                className={`rounded-lg p-3 ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-bg'
                                        : 'bg-blue-50'
                                }`}
                            >
                                <p
                                    className={`mb-1 font-medium ${
                                        theme === 'dark'
                                            ? 'text-blue-400'
                                            : 'text-blue-700'
                                    }`}
                                >
                                    Early Bird Strategy
                                </p>
                                <p
                                    className={
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-blue-600'
                                    }
                                >
                                    Create early bird tickets with limited
                                    quantities to drive early sales.
                                </p>
                            </div>

                            <div
                                className={`rounded-lg p-3 ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-bg'
                                        : 'bg-green-50'
                                }`}
                            >
                                <p
                                    className={`mb-1 font-medium ${
                                        theme === 'dark'
                                            ? 'text-green-400'
                                            : 'text-green-700'
                                    }`}
                                >
                                    Sales Periods
                                </p>
                                <p
                                    className={
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-green-600'
                                    }
                                >
                                    Set sales periods to control when tickets
                                    become available.
                                </p>
                            </div>

                            <div
                                className={`rounded-lg p-3 ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-bg'
                                        : 'bg-purple-50'
                                }`}
                            >
                                <p
                                    className={`mb-1 font-medium ${
                                        theme === 'dark'
                                            ? 'text-purple-400'
                                            : 'text-purple-700'
                                    }`}
                                >
                                    Purchase Limits
                                </p>
                                <p
                                    className={
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-purple-600'
                                    }
                                >
                                    Use purchase limits to prevent bulk buying
                                    and ensure fair access.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Sample Ticket */}
                    {viewMode === 'list' && tickets.length > 0 && (
                        <div
                            className={`rounded-xl p-6 shadow-lg transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border border-gray-200 bg-white'
                            }`}
                        >
                            <div className='mb-4 flex items-center justify-between'>
                                <h3
                                    className={`font-inter text-lg font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    Quick Preview
                                </h3>
                                <button
                                    onClick={() =>
                                        handlePreviewTicket(tickets[0])
                                    }
                                    className='text-sm text-revlr-primary-blue transition-colors duration-200 hover:text-revlr-primary-blue/80'
                                >
                                    View Full Preview
                                </button>
                            </div>

                            <div className='origin-top scale-75'>
                                <TicketPreview
                                    ticket={tickets[0]}
                                    eventName={eventDisplayData.name}
                                    eventDate={eventDisplayData.date}
                                    eventLocation={eventDisplayData.location}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

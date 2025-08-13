'use client';

import React, { useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import type { EventTicket } from '@src/types/event-creation';

interface TicketListProps {
    tickets: EventTicket[];
    onEditTicket: (ticket: EventTicket) => void;
    onDeleteTicket: (ticketId: string) => void;
    onSelectTicket?: (ticketId: string) => void;
    isLoading?: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
    tickets,
    onEditTicket,
    onDeleteTicket,
    onSelectTicket,
    isLoading = false,
}) => {
    const { theme } = useTheme();
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return 'Invalid date';
        }
    };

    // const formatTime = (timeString?: string) => {
    //     if (!timeString) return 'Not set';
    //     try {
    //         return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
    //             'en-US',
    //             {
    //                 hour: 'numeric',
    //                 minute: '2-digit',
    //                 hour12: true,
    //             }
    //         );
    //     } catch {
    //         return 'Invalid time';
    //     }
    // };

    const handleDeleteClick = (ticketId: string) => {
        setDeleteConfirm(ticketId);
    };

    const handleConfirmDelete = (ticketId: string) => {
        onDeleteTicket(ticketId);
        setDeleteConfirm(null);
    };

    const handleCancelDelete = () => {
        setDeleteConfirm(null);
    };

    const getSalesStatus = (ticket: EventTicket) => {
        if (!ticket.salesPeriod?.startDate || !ticket.salesPeriod?.endDate) {
            return {
                status: 'active',
                label: 'Active',
                color: 'text-green-600',
            };
        }

        const now = new Date();
        const startDate = new Date(ticket.salesPeriod.startDate);
        const endDate = new Date(ticket.salesPeriod.endDate);

        if (now < startDate) {
            return {
                status: 'upcoming',
                label: 'Upcoming',
                color: 'text-yellow-600',
            };
        }

        if (now > endDate) {
            return { status: 'ended', label: 'Ended', color: 'text-red-600' };
        }

        return { status: 'active', label: 'Active', color: 'text-green-600' };
    };

    if (isLoading) {
        return (
            <div
                className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                <div className='animate-pulse space-y-4'>
                    <div
                        className={`h-6 rounded ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    ></div>
                    <div
                        className={`h-4 rounded ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    ></div>
                    <div
                        className={`h-4 rounded ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    ></div>
                </div>
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div
                className={`rounded-xl p-8 text-center shadow-lg transition-all duration-200 ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                <div
                    className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full ${
                        theme === 'dark' ? 'bg-revlr-dark-bg' : 'bg-gray-100'
                    }`}
                >
                    <svg
                        className='size-8 text-revlr-primary-blue'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                        />
                    </svg>
                </div>
                <h3
                    className={`mb-2 font-inter text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                >
                    No tickets created yet
                </h3>
                <p
                    className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}
                >
                    Add your first ticket to get started with event
                    registration.
                </p>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                theme === 'dark'
                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                    : 'border border-gray-200 bg-white'
            }`}
        >
            <div className='mb-6 flex items-center justify-between'>
                <h2
                    className={`font-inter text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                >
                    Tickets ({tickets.length})
                </h2>
            </div>

            {/* Desktop Table View */}
            <div className='hidden overflow-x-auto lg:block'>
                <table className='w-full text-sm'>
                    <thead>
                        <tr
                            className={`border-b font-inter text-xs font-semibold uppercase ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border text-gray-400'
                                    : 'border-gray-200 text-gray-600'
                            }`}
                        >
                            {onSelectTicket && (
                                <th className='w-12 p-3 text-left'></th>
                            )}
                            <th className='p-3 text-left'>Ticket Name</th>
                            <th className='p-3 text-left'>Type</th>
                            <th className='p-3 text-left'>Price</th>
                            <th className='p-3 text-left'>Quantity</th>
                            <th className='p-3 text-left'>Sales Period</th>
                            <th className='p-3 text-left'>Status</th>
                            <th className='p-3 text-left'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.map((ticket) => {
                            const salesStatus = getSalesStatus(ticket);
                            return (
                                <tr
                                    key={ticket.id}
                                    className={`border-b font-inter text-sm font-medium transition-colors duration-200 ${
                                        ticket.selected
                                            ? theme === 'dark'
                                                ? 'border-revlr-dark-border bg-revlr-primary-blue/10 text-white'
                                                : 'border-gray-200 bg-revlr-primary-blue/5 text-gray-900'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-bg'
                                              : 'border-gray-200 text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {onSelectTicket && (
                                        <td className='p-3'>
                                            <div
                                                className={`flex size-5 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                                    ticket.selected
                                                        ? 'border-revlr-primary-blue bg-revlr-primary-blue'
                                                        : theme === 'dark'
                                                          ? 'border-revlr-dark-border hover:border-revlr-primary-blue'
                                                          : 'border-gray-300 hover:border-revlr-primary-blue'
                                                }`}
                                                onClick={() =>
                                                    onSelectTicket(ticket.id!)
                                                }
                                            >
                                                {ticket.selected && (
                                                    <div className='size-2 rounded-full bg-white'></div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className='p-3'>
                                        <div>
                                            <p className='font-semibold'>
                                                {ticket.name}
                                            </p>
                                            {ticket.description && (
                                                <p
                                                    className={`mt-1 text-xs ${
                                                        theme === 'dark'
                                                            ? 'text-gray-400'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    {ticket.description.length >
                                                    50
                                                        ? `${ticket.description.substring(0, 50)}...`
                                                        : ticket.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className='p-3'>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                ticket.type === 'free'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {ticket.type === 'free'
                                                ? 'Free'
                                                : 'Paid'}
                                        </span>
                                    </td>
                                    <td className='p-3'>
                                        {ticket.type === 'free' ? (
                                            <span className='font-semibold text-green-600'>
                                                FREE
                                            </span>
                                        ) : (
                                            <div>
                                                <span className='font-semibold'>
                                                    {formatPrice(
                                                        ticket.price || 0
                                                    )}
                                                </span>
                                                {ticket.feeOption ===
                                                    'attendees' && (
                                                    <p
                                                        className={`text-xs ${
                                                            theme === 'dark'
                                                                ? 'text-gray-400'
                                                                : 'text-gray-500'
                                                        }`}
                                                    >
                                                        + fees
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className='p-3'>
                                        <div>
                                            <span className='font-semibold'>
                                                {ticket.quantity}
                                            </span>
                                            <p
                                                className={`text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                Limit: {ticket.purchaseLimit}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='p-3'>
                                        <div className='text-xs'>
                                            <p>
                                                {formatDate(
                                                    ticket.salesPeriod
                                                        ?.startDate
                                                )}
                                            </p>
                                            <p
                                                className={
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-500'
                                                }
                                            >
                                                to{' '}
                                                {formatDate(
                                                    ticket.salesPeriod?.endDate
                                                )}
                                            </p>
                                        </div>
                                    </td>
                                    <td className='p-3'>
                                        <span
                                            className={`text-xs font-medium ${salesStatus.color}`}
                                        >
                                            {salesStatus.label}
                                        </span>
                                    </td>
                                    <td className='p-3'>
                                        <div className='flex space-x-2'>
                                            <button
                                                onClick={() =>
                                                    onEditTicket(ticket)
                                                }
                                                className='text-revlr-primary-blue transition-colors duration-200 hover:text-revlr-primary-blue/80'
                                                title='Edit ticket'
                                            >
                                                <svg
                                                    className='size-4'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteClick(
                                                        ticket.id!
                                                    )
                                                }
                                                className={`transition-colors duration-200 ${
                                                    theme === 'dark'
                                                        ? 'text-gray-500 hover:text-red-400'
                                                        : 'text-gray-400 hover:text-red-600'
                                                }`}
                                                title='Delete ticket'
                                            >
                                                <svg
                                                    className='size-4'
                                                    fill='none'
                                                    stroke='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path
                                                        strokeLinecap='round'
                                                        strokeLinejoin='round'
                                                        strokeWidth={2}
                                                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className='space-y-4 lg:hidden'>
                {tickets.map((ticket) => {
                    const salesStatus = getSalesStatus(ticket);
                    return (
                        <div
                            key={ticket.id}
                            className={`rounded-lg border p-4 transition-all duration-200 ${
                                ticket.selected
                                    ? theme === 'dark'
                                        ? 'border-revlr-primary-blue bg-revlr-primary-blue/10'
                                        : 'border-revlr-primary-blue bg-revlr-primary-blue/5'
                                    : theme === 'dark'
                                      ? 'border-revlr-dark-border bg-revlr-dark-bg'
                                      : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className='mb-3 flex items-start justify-between'>
                                <div className='flex items-center space-x-3'>
                                    {onSelectTicket && (
                                        <div
                                            className={`flex size-5 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                                ticket.selected
                                                    ? 'border-revlr-primary-blue bg-revlr-primary-blue'
                                                    : theme === 'dark'
                                                      ? 'border-revlr-dark-border hover:border-revlr-primary-blue'
                                                      : 'border-gray-300 hover:border-revlr-primary-blue'
                                            }`}
                                            onClick={() =>
                                                onSelectTicket(ticket.id!)
                                            }
                                        >
                                            {ticket.selected && (
                                                <div className='size-2 rounded-full bg-white'></div>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <h3
                                            className={`font-inter font-semibold ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            {ticket.name}
                                        </h3>
                                        <div className='mt-1 flex items-center space-x-2'>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    ticket.type === 'free'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {ticket.type === 'free'
                                                    ? 'Free'
                                                    : 'Paid'}
                                            </span>
                                            <span
                                                className={`text-xs font-medium ${salesStatus.color}`}
                                            >
                                                {salesStatus.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    {ticket.type === 'free' ? (
                                        <span className='text-lg font-bold text-green-600'>
                                            FREE
                                        </span>
                                    ) : (
                                        <div>
                                            <span
                                                className={`text-lg font-bold ${
                                                    theme === 'dark'
                                                        ? 'text-white'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                {formatPrice(ticket.price || 0)}
                                            </span>
                                            {ticket.feeOption ===
                                                'attendees' && (
                                                <p
                                                    className={`text-xs ${
                                                        theme === 'dark'
                                                            ? 'text-gray-400'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    + fees
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {ticket.description && (
                                <p
                                    className={`mb-3 text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {ticket.description}
                                </p>
                            )}

                            <div className='mb-3 grid grid-cols-2 gap-4 text-sm'>
                                <div>
                                    <p
                                        className={`font-medium ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        Quantity
                                    </p>
                                    <p
                                        className={
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }
                                    >
                                        {ticket.quantity} (Limit:{' '}
                                        {ticket.purchaseLimit})
                                    </p>
                                </div>
                                <div>
                                    <p
                                        className={`font-medium ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        Sales Period
                                    </p>
                                    <p
                                        className={
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }
                                    >
                                        {formatDate(
                                            ticket.salesPeriod?.startDate
                                        )}{' '}
                                        -{' '}
                                        {formatDate(
                                            ticket.salesPeriod?.endDate
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className='flex justify-end space-x-2'>
                                <button
                                    onClick={() => onEditTicket(ticket)}
                                    className='px-3 py-2 text-sm font-medium text-revlr-primary-blue transition-colors duration-200 hover:text-revlr-primary-blue/80'
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() =>
                                        handleDeleteClick(ticket.id!)
                                    }
                                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                        theme === 'dark'
                                            ? 'text-gray-500 hover:text-red-400'
                                            : 'text-gray-400 hover:text-red-600'
                                    }`}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
                    <div
                        className={`mx-4 max-w-md rounded-xl p-6 shadow-xl ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                : 'border border-gray-200 bg-white'
                        }`}
                    >
                        <h3
                            className={`mb-4 text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Delete Ticket
                        </h3>
                        <p
                            className={`mb-6 text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            Are you sure you want to delete this ticket? This
                            action cannot be undone.
                        </p>
                        <div className='flex space-x-3'>
                            <button
                                onClick={() =>
                                    handleConfirmDelete(deleteConfirm)
                                }
                                className='flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700'
                            >
                                Delete
                            </button>
                            <button
                                onClick={handleCancelDelete}
                                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

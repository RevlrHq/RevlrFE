'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import type { EventTicket } from '@src/types/event-creation';

interface TicketPreviewProps {
    ticket: EventTicket;
    eventName?: string;
    eventDate?: string;
    eventLocation?: string;
}

export const TicketPreview: React.FC<TicketPreviewProps> = ({
    ticket,
    eventName = 'Sample Event',
    eventDate = 'TBD',
    eventLocation = 'TBD',
}) => {
    const { theme } = useTheme();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return '';
        try {
            return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
                'en-US',
                {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                }
            );
        } catch {
            return timeString;
        }
    };

    const getSalesStatus = () => {
        if (!ticket.salesPeriod?.startDate || !ticket.salesPeriod?.endDate) {
            return { status: 'available', message: 'Available now' };
        }

        const now = new Date();
        const startDate = new Date(ticket.salesPeriod.startDate);
        const endDate = new Date(ticket.salesPeriod.endDate);

        if (now < startDate) {
            return {
                status: 'upcoming',
                message: `Sales start ${formatDate(ticket.salesPeriod.startDate)}`,
            };
        }

        if (now > endDate) {
            return {
                status: 'ended',
                message: 'Sales ended',
            };
        }

        return { status: 'available', message: 'Available now' };
    };

    const salesStatus = getSalesStatus();

    return (
        <div className='mx-auto max-w-md'>
            <h4
                className={`mb-4 font-inter text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
            >
                Customer Preview
            </h4>

            {/* Ticket Card */}
            <div
                className={`overflow-hidden rounded-xl border shadow-lg transition-all duration-200 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                {/* Ticket Header */}
                <div
                    className={`border-b p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <div className='mb-2 flex items-start justify-between'>
                        <h3
                            className={`font-inter text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            {ticket.name}
                        </h3>
                        <div className='text-right'>
                            {ticket.type === 'free' ? (
                                <span className='text-2xl font-bold text-revlr-accent-green'>
                                    FREE
                                </span>
                            ) : (
                                <span
                                    className={`text-2xl font-bold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {formatPrice(ticket.price || 0)}
                                </span>
                            )}
                            {ticket.type === 'paid' &&
                                ticket.feeOption === 'attendees' && (
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
                    </div>

                    {ticket.description && (
                        <p
                            className={`text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            {ticket.description}
                        </p>
                    )}
                </div>

                {/* Event Details */}
                <div className='space-y-3 p-6'>
                    <div className='flex items-center space-x-3'>
                        <div
                            className={`rounded-lg p-2 ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-bg'
                                    : 'bg-gray-100'
                            }`}
                        >
                            <svg
                                className='size-4 text-revlr-primary-blue'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                />
                            </svg>
                        </div>
                        <div>
                            <p
                                className={`font-inter font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                {eventName}
                            </p>
                            <p
                                className={`text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                {formatDate(eventDate)}
                            </p>
                        </div>
                    </div>

                    <div className='flex items-center space-x-3'>
                        <div
                            className={`rounded-lg p-2 ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-bg'
                                    : 'bg-gray-100'
                            }`}
                        >
                            <svg
                                className='size-4 text-revlr-primary-blue'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                />
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                            </svg>
                        </div>
                        <div>
                            <p
                                className={`text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-600'
                                }`}
                            >
                                {eventLocation}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ticket Availability */}
                <div
                    className={`border-t p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <div className='mb-3 flex items-center justify-between'>
                        <span
                            className={`text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            Available
                        </span>
                        <span
                            className={`text-sm font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            {ticket.quantity} tickets
                        </span>
                    </div>

                    <div className='mb-4 flex items-center justify-between'>
                        <span
                            className={`text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            Limit per customer
                        </span>
                        <span
                            className={`text-sm font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            {ticket.purchaseLimit}
                        </span>
                    </div>

                    {/* Sales Status */}
                    <div
                        className={`mb-4 rounded-lg p-3 ${
                            salesStatus.status === 'available'
                                ? 'border border-green-200 bg-green-50'
                                : salesStatus.status === 'upcoming'
                                  ? 'border border-yellow-200 bg-yellow-50'
                                  : 'border border-red-200 bg-red-50'
                        }`}
                    >
                        <p
                            className={`text-sm font-medium ${
                                salesStatus.status === 'available'
                                    ? 'text-green-700'
                                    : salesStatus.status === 'upcoming'
                                      ? 'text-yellow-700'
                                      : 'text-red-700'
                            }`}
                        >
                            {salesStatus.message}
                        </p>
                        {ticket.salesPeriod?.startDate &&
                            ticket.salesPeriod?.endDate && (
                                <p
                                    className={`mt-1 text-xs ${
                                        salesStatus.status === 'available'
                                            ? 'text-green-600'
                                            : salesStatus.status === 'upcoming'
                                              ? 'text-yellow-600'
                                              : 'text-red-600'
                                    }`}
                                >
                                    Sales:{' '}
                                    {formatDate(ticket.salesPeriod.startDate)}
                                    {ticket.salesPeriod.startTime &&
                                        ` at ${formatTime(ticket.salesPeriod.startTime)}`}
                                    {' - '}
                                    {formatDate(ticket.salesPeriod.endDate)}
                                    {ticket.salesPeriod.endTime &&
                                        ` at ${formatTime(ticket.salesPeriod.endTime)}`}
                                </p>
                            )}
                    </div>

                    {/* Mock Purchase Button */}
                    <button
                        disabled
                        className={`w-full rounded-xl px-4 py-3 font-inter font-semibold transition-all duration-200 ${
                            salesStatus.status === 'available'
                                ? 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple text-white'
                                : 'cursor-not-allowed bg-gray-300 text-gray-500'
                        }`}
                    >
                        {salesStatus.status === 'available'
                            ? 'Select Tickets'
                            : 'Not Available'}
                    </button>

                    {ticket.refundPolicy && (
                        <div className='mt-4'>
                            <p
                                className={`mb-1 text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                Refund Policy:
                            </p>
                            <p
                                className={`text-xs ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-600'
                                }`}
                            >
                                {ticket.refundPolicy}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

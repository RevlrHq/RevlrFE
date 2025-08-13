'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import type { EventCreationData, EventTicket } from '@src/types/event-creation';

interface PublishConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    eventData: EventCreationData;
    tickets: EventTicket[];
    isPublishing: boolean;
}

export const PublishConfirmationModal: React.FC<
    PublishConfirmationModalProps
> = ({ isOpen, onClose, onConfirm, eventData, tickets, isPublishing }) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeString: string) => {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
            'en-US',
            {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            }
        );
    };

    const totalTickets = tickets.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0
    );
    const paidTickets = tickets.filter((ticket) => ticket.type === 'paid');
    const freeTickets = tickets.filter((ticket) => ticket.type === 'free');

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div
                className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl shadow-xl ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                {/* Header */}
                <div className='border-b p-6'>
                    <div className='flex items-center justify-between'>
                        <h2
                            className={`text-xl font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Publish Event
                        </h2>
                        <button
                            onClick={onClose}
                            disabled={isPublishing}
                            className={`rounded-lg p-2 transition-colors ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-gray-300'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            } disabled:opacity-50`}
                        >
                            <svg
                                className='size-5'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </button>
                    </div>
                    <p
                        className={`mt-2 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Review your event details before publishing. Once
                        published, your event will be visible to attendees.
                    </p>
                </div>

                {/* Event Summary */}
                <div className='space-y-6 p-6'>
                    {/* Basic Information */}
                    <div>
                        <h3
                            className={`mb-3 text-lg font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Event Information
                        </h3>
                        <div className='space-y-3'>
                            <div>
                                <span
                                    className={`text-sm font-medium ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Event Name:
                                </span>
                                <p
                                    className={`mt-1 ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {eventData.eventName}
                                </p>
                            </div>
                            <div>
                                <span
                                    className={`text-sm font-medium ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Category:
                                </span>
                                <p
                                    className={`mt-1 capitalize ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {eventData.eventCategory}
                                </p>
                            </div>
                            <div>
                                <span
                                    className={`text-sm font-medium ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Description:
                                </span>
                                <p
                                    className={`mt-1 text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {eventData.eventDescription.length > 150
                                        ? `${eventData.eventDescription.substring(0, 150)}...`
                                        : eventData.eventDescription}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Date and Time */}
                    {eventData.dateRange && eventData.timeRange && (
                        <div>
                            <h3
                                className={`mb-3 text-lg font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Date & Time
                            </h3>
                            <div className='space-y-2'>
                                <div className='flex items-center space-x-2'>
                                    <svg
                                        className='size-4 text-revlr-primary-blue'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                        />
                                    </svg>
                                    <span
                                        className={`text-sm ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {formatDate(
                                            eventData.dateRange.startDate
                                        )}
                                        {eventData.dateRange.startDate !==
                                            eventData.dateRange.endDate &&
                                            ` - ${formatDate(eventData.dateRange.endDate)}`}
                                    </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                    <svg
                                        className='size-4 text-revlr-primary-blue'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                        />
                                    </svg>
                                    <span
                                        className={`text-sm ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {formatTime(
                                            eventData.timeRange.startTime
                                        )}{' '}
                                        -{' '}
                                        {formatTime(
                                            eventData.timeRange.endTime
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div>
                        <h3
                            className={`mb-3 text-lg font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Location
                        </h3>
                        <div className='flex items-center space-x-2'>
                            <svg
                                className='size-4 text-revlr-primary-blue'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
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
                            <div>
                                <span
                                    className={`text-sm font-medium capitalize ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {eventData.locationType.replace('-', ' ')}{' '}
                                    Event
                                </span>
                                {eventData.locationDetails?.venueName && (
                                    <p
                                        className={`text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {eventData.locationDetails.venueName}
                                        {eventData.locationDetails.address &&
                                            `, ${eventData.locationDetails.address}`}
                                    </p>
                                )}
                                {eventData.locationDetails?.eventLink && (
                                    <p
                                        className={`text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        Virtual Link:{' '}
                                        {eventData.locationDetails.eventLink}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tickets Summary */}
                    <div>
                        <h3
                            className={`mb-3 text-lg font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Tickets ({tickets.length} type
                            {tickets.length !== 1 ? 's' : ''})
                        </h3>
                        <div className='space-y-3'>
                            <div className='grid grid-cols-3 gap-4 text-sm'>
                                <div
                                    className={`rounded-lg p-3 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-bg'
                                            : 'border border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div
                                        className={`font-medium ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Total Tickets
                                    </div>
                                    <div className='text-xl font-semibold text-revlr-primary-blue'>
                                        {totalTickets.toLocaleString()}
                                    </div>
                                </div>
                                <div
                                    className={`rounded-lg p-3 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-bg'
                                            : 'border border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div
                                        className={`font-medium ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Free Tickets
                                    </div>
                                    <div className='text-xl font-semibold text-revlr-accent-green'>
                                        {freeTickets.length}
                                    </div>
                                </div>
                                <div
                                    className={`rounded-lg p-3 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-bg'
                                            : 'border border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div
                                        className={`font-medium ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Paid Tickets
                                    </div>
                                    <div className='text-xl font-semibold text-revlr-accent-purple'>
                                        {paidTickets.length}
                                    </div>
                                </div>
                            </div>

                            {/* Ticket List */}
                            <div className='space-y-2'>
                                {tickets.map((ticket, index) => (
                                    <div
                                        key={ticket.id || index}
                                        className={`flex items-center justify-between rounded-lg p-3 ${
                                            theme === 'dark'
                                                ? 'border border-revlr-dark-border bg-revlr-dark-bg'
                                                : 'border border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div>
                                            <div
                                                className={`font-medium ${
                                                    theme === 'dark'
                                                        ? 'text-white'
                                                        : 'text-gray-900'
                                                }`}
                                            >
                                                {ticket.name}
                                            </div>
                                            <div
                                                className={`text-sm ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                {ticket.quantity} available •
                                                Limit {ticket.purchaseLimit} per
                                                person
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <div
                                                className={`font-semibold ${
                                                    ticket.type === 'free'
                                                        ? 'text-revlr-accent-green'
                                                        : 'text-revlr-primary-blue'
                                                }`}
                                            >
                                                {ticket.type === 'free'
                                                    ? 'FREE'
                                                    : `$${ticket.price?.toFixed(2)}`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Images */}
                    {eventData.images.length > 0 && (
                        <div>
                            <h3
                                className={`mb-3 text-lg font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Images ({eventData.images.length})
                            </h3>
                            <div className='flex space-x-2 overflow-x-auto'>
                                {eventData.images
                                    .slice(0, 5)
                                    .map((image, index) => (
                                        <div
                                            key={image.id || index}
                                            className='size-16 shrink-0 overflow-hidden rounded-lg'
                                        >
                                            <img
                                                src={image.url}
                                                alt={`Event image ${index + 1}`}
                                                className='size-full object-cover'
                                            />
                                        </div>
                                    ))}
                                {eventData.images.length > 5 && (
                                    <div
                                        className={`flex size-16 shrink-0 items-center justify-center rounded-lg text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'border border-revlr-dark-border bg-revlr-dark-bg text-gray-400'
                                                : 'border border-gray-200 bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        +{eventData.images.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`border-t p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <div className='flex items-center justify-between'>
                        <div>
                            <p
                                className={`text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Once published, your event will be visible to
                                all users and available for registration.
                            </p>
                        </div>
                        <div className='flex space-x-3'>
                            <button
                                onClick={onClose}
                                disabled={isPublishing}
                                className={`rounded-xl px-6 py-3 font-inter font-medium transition-all duration-200 ${
                                    theme === 'dark'
                                        ? 'border border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isPublishing}
                                className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                {isPublishing ? (
                                    <div className='flex items-center space-x-2'>
                                        <div className='size-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                                        <span>Publishing...</span>
                                    </div>
                                ) : (
                                    'Publish Event'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

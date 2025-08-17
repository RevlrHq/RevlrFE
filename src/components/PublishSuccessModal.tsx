'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@src/lib/ThemeContext';
import type { EventCreationData } from '@src/types/event-creation';

interface PublishSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewEvent: () => void;
    onManageEvent: () => void;
    eventData: EventCreationData;
}

export const PublishSuccessModal: React.FC<PublishSuccessModalProps> = ({
    isOpen,
    onClose,
    onViewEvent,
    onManageEvent,
    eventData,
}) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div
                className={`w-full max-w-md rounded-xl shadow-xl ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                <div className='p-8 text-center'>
                    {/* Success Icon */}
                    <div className='mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-revlr-accent-green to-revlr-accent-green/80'>
                        <svg
                            className='size-8 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                            />
                        </svg>
                    </div>

                    {/* Success Message */}
                    <h2
                        className={`mb-2 text-2xl font-bold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Event Published!
                    </h2>
                    <p
                        className={`mb-6 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Your event &quot;{eventData.eventName}&quot; has been
                        successfully published and is now live for attendees to
                        discover and register.
                    </p>

                    {/* Event Preview Card */}
                    <div
                        className={`mb-6 rounded-lg p-4 text-left ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border bg-revlr-dark-bg'
                                : 'border border-gray-200 bg-gray-50'
                        }`}
                    >
                        <div className='flex items-start space-x-3'>
                            {eventData.images.length > 0 && (
                                <div className='size-12 shrink-0 overflow-hidden rounded-lg'>
                                    <Image
                                        src={eventData.images[0].url}
                                        alt={eventData.eventName}
                                        width={48}
                                        height={48}
                                        className='size-full object-cover'
                                    />
                                </div>
                            )}
                            <div className='min-w-0 flex-1'>
                                <h3
                                    className={`truncate font-medium ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {eventData.eventName}
                                </h3>
                                <p
                                    className={`text-sm capitalize ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {eventData.eventCategory} •{' '}
                                    {eventData.locationType.replace('-', ' ')}
                                </p>
                                {eventData.dateRange && (
                                    <p
                                        className={`text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {new Date(
                                            eventData.dateRange.startDate
                                        ).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                )}
                            </div>
                            <div className='shrink-0'>
                                <span className='inline-flex items-center rounded-full bg-revlr-accent-green/10 px-2 py-1 text-xs font-medium text-revlr-accent-green'>
                                    Published
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='space-y-3'>
                        <button
                            onClick={onViewEvent}
                            className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20'
                        >
                            View Live Event
                        </button>
                        <button
                            onClick={onManageEvent}
                            className={`w-full rounded-xl px-6 py-3 font-inter font-medium transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Manage Event
                        </button>
                    </div>

                    {/* Share Options */}
                    <div className='mt-6 border-t border-gray-200 pt-6 dark:border-revlr-dark-border'>
                        <p
                            className={`mb-3 text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Share your event:
                        </p>
                        <div className='flex justify-center space-x-3'>
                            <button
                                onClick={() => {
                                    // Share on Facebook
                                    const url = `${window.location.origin}/events/${eventData.id}`;
                                    window.open(
                                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                                        '_blank'
                                    );
                                }}
                                className='flex size-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700'
                                title='Share on Facebook'
                            >
                                <svg
                                    className='size-5'
                                    fill='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    // Share on Twitter
                                    const url = `${window.location.origin}/events/${eventData.id}`;
                                    const text = `Check out this event: ${eventData.eventName}`;
                                    window.open(
                                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                                        '_blank'
                                    );
                                }}
                                className='flex size-10 items-center justify-center rounded-full bg-sky-500 text-white transition-colors hover:bg-sky-600'
                                title='Share on Twitter'
                            >
                                <svg
                                    className='size-5'
                                    fill='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    // Copy link to clipboard
                                    const url = `${window.location.origin}/events/${eventData.id}`;
                                    navigator.clipboard.writeText(url);
                                    // You could add a toast notification here
                                }}
                                className={`flex size-10 items-center justify-center rounded-full transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                title='Copy link'
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
                                        d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`mt-6 text-sm font-medium transition-colors ${
                            theme === 'dark'
                                ? 'text-gray-400 hover:text-gray-300'
                                : 'text-gray-600 hover:text-gray-700'
                        }`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

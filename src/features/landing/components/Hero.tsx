'use client';

import { useState } from 'react';

interface HeroProps {
    isOrganizer: boolean;
    setIsOrganizer: (value: boolean) => void;
}

export const Hero = ({ isOrganizer, setIsOrganizer }: HeroProps) => {
    const [email, setEmail] = useState('');

    const features = [
        { icon: '🎫', text: 'Smart Ticketing' },
        { icon: '💳', text: 'Flexible Payments' },
        { icon: '📊', text: 'Real-time Analytics' },
        { icon: '🔄', text: 'Ticket Resale' },
    ];

    const stats = [
        { number: '50K+', label: 'Events Created' },
        { number: '2M+', label: 'Tickets Sold' },
        { number: '98%', label: 'Customer Satisfaction' },
        { number: '24/7', label: 'Support' },
    ];

    return (
        <main className='relative min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
            {/* Background Pattern */}
            <div className='bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066FF" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFD700" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] absolute inset-0'></div>

            <div className='relative mx-auto max-w-[1440px] px-6 pb-16 pt-24 md:px-24 md:pt-32'>
                {/* Toggle Switch */}
                <div className='mb-12 flex justify-center'>
                    <div className='flex items-center gap-4 rounded-full border border-gray-200/50 bg-white/80 p-2 shadow-lg backdrop-blur-sm dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                        <span
                            className={`rounded-full px-4 py-2 font-inter text-sm font-medium transition-all duration-300 ${
                                isOrganizer
                                    ? 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            For Organizers
                        </span>
                        <button
                            onClick={() => setIsOrganizer(!isOrganizer)}
                            className='relative h-7 w-14 rounded-full bg-gray-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/50 dark:bg-revlr-dark-border'
                        >
                            <div
                                className={`absolute top-1 size-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                                    isOrganizer
                                        ? 'translate-x-1'
                                        : 'translate-x-8'
                                }`}
                            ></div>
                        </button>
                        <span
                            className={`rounded-full px-4 py-2 font-inter text-sm font-medium transition-all duration-300 ${
                                !isOrganizer
                                    ? 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                        >
                            For Attendees
                        </span>
                    </div>
                </div>

                {isOrganizer ? (
                    <div className='grid items-center gap-16 lg:grid-cols-2'>
                        {/* Left Content */}
                        <div className='space-y-8'>
                            <div className='space-y-6'>
                                <div className='inline-flex items-center gap-2 rounded-full border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-4 py-2 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                                    <span className='text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                        ✨
                                    </span>
                                    <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                        #1 Event Management Platform
                                    </span>
                                </div>

                                <h1 className='font-montserrat text-5xl font-bold leading-tight text-gray-900 dark:text-white md:text-6xl'>
                                    Create
                                    <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                        {' '}
                                        Unforgettable{' '}
                                    </span>
                                    Events
                                </h1>

                                <p className='text-xl leading-relaxed text-gray-600 dark:text-gray-300'>
                                    From intimate gatherings to massive
                                    festivals, our all-in-one platform handles
                                    ticketing, payments, analytics, and more.
                                    Launch your next event in minutes.
                                </p>
                            </div>

                            {/* Features Grid */}
                            <div className='grid grid-cols-2 gap-4'>
                                {features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center gap-3 rounded-xl border border-gray-200/50 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60'
                                    >
                                        <span className='text-2xl'>
                                            {feature.icon}
                                        </span>
                                        <span className='font-medium text-gray-800 dark:text-gray-200'>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Email Signup */}
                            <div className='space-y-4'>
                                <div className='flex flex-col gap-3 sm:flex-row'>
                                    <div className='relative flex-1'>
                                        <input
                                            type='email'
                                            placeholder='Enter your email to get started'
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            className='w-full rounded-xl border border-gray-200 bg-white/80 px-6 py-4 text-gray-800 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card/80 dark:text-gray-200 dark:placeholder:text-gray-400'
                                        />
                                    </div>
                                    <button className='whitespace-nowrap rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'>
                                        Create Event Free
                                    </button>
                                </div>
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                    No credit card required • Free for events
                                    under 100 attendees
                                </p>
                            </div>

                            {/* Stats */}
                            <div className='grid grid-cols-4 gap-6 border-t border-gray-200/50 pt-8 dark:border-revlr-dark-border'>
                                {stats.map((stat, index) => (
                                    <div key={index} className='text-center'>
                                        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                                            {stat.number}
                                        </div>
                                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Content - Dashboard Preview */}
                        <div className='relative'>
                            <div className='relative rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 p-8 shadow-2xl dark:border-revlr-dark-border dark:from-revlr-dark-card dark:to-revlr-dark-bg'>
                                {/* Mock Dashboard */}
                                <div className='space-y-6'>
                                    <div className='flex items-center justify-between'>
                                        <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
                                            Event Dashboard
                                        </h3>
                                        <div className='flex gap-2'>
                                            <div className='size-3 rounded-full bg-red-400'></div>
                                            <div className='size-3 rounded-full bg-yellow-400'></div>
                                            <div className='size-3 rounded-full bg-green-400'></div>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='rounded-lg border border-revlr-primary-blue/20 bg-gradient-to-br from-revlr-primary-blue/10 to-revlr-accent-purple/10 p-4'>
                                            <div className='text-2xl font-bold text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                                1,247
                                            </div>
                                            <div className='text-sm text-gray-600 dark:text-gray-400'>
                                                Tickets Sold
                                            </div>
                                        </div>
                                        <div className='rounded-lg border border-revlr-accent-green/20 bg-gradient-to-br from-revlr-accent-green/10 to-revlr-accent-green/20 p-4'>
                                            <div className='text-2xl font-bold text-revlr-accent-green'>
                                                $24,890
                                            </div>
                                            <div className='text-sm text-gray-600 dark:text-gray-400'>
                                                Revenue
                                            </div>
                                        </div>
                                    </div>

                                    <div className='space-y-3'>
                                        <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-revlr-dark-bg'>
                                            <div className='flex items-center gap-3'>
                                                <div className='size-10 rounded-lg bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple'></div>
                                                <div>
                                                    <div className='font-medium text-gray-800 dark:text-gray-200'>
                                                        Tech Conference 2024
                                                    </div>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        Dec 15, 2024
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='font-semibold text-revlr-accent-green'>
                                                Active
                                            </div>
                                        </div>

                                        <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-revlr-dark-bg'>
                                            <div className='flex items-center gap-3'>
                                                <div className='size-10 rounded-lg bg-gradient-to-br from-revlr-accent-orange to-revlr-primary-yellow'></div>
                                                <div>
                                                    <div className='font-medium text-gray-800 dark:text-gray-200'>
                                                        Music Festival
                                                    </div>
                                                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                                                        Jan 20, 2025
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='font-semibold text-gray-500 dark:text-gray-400'>
                                                Draft
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className='absolute -right-4 -top-4 size-20 rounded-full bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange opacity-20 blur-xl'></div>
                            <div className='absolute -bottom-4 -left-4 size-16 rounded-full bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue opacity-20 blur-xl'></div>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-12 text-center'>
                        {/* Attendee Hero Content */}
                        <div className='mx-auto max-w-4xl space-y-6'>
                            <div className='inline-flex items-center gap-2 rounded-full border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-4 py-2 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                                <span className='text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                    🎫
                                </span>
                                <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                    Discover Amazing Events
                                </span>
                            </div>

                            <h1 className='font-montserrat text-5xl font-bold leading-tight text-gray-900 dark:text-white md:text-6xl'>
                                Find Events You
                                <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                    {' '}
                                    Love
                                </span>
                                <br />
                                Sell Tickets You
                                <span className='bg-gradient-to-r from-revlr-accent-green to-revlr-accent-orange bg-clip-text text-transparent'>
                                    {' '}
                                    Can't Use
                                </span>
                            </h1>

                            <p className='mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300'>
                                Book events with confidence. If plans change,
                                our hassle-free resale marketplace lets you
                                recover your investment while helping others
                                discover great events.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className='mx-auto max-w-2xl'>
                            <div className='relative'>
                                <div className='absolute left-4 top-1/2 -translate-y-1/2 text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                    <svg
                                        className='size-6'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                        />
                                    </svg>
                                </div>
                                <input
                                    type='text'
                                    placeholder='Search events, artists, venues in Lagos...'
                                    className='w-full rounded-2xl border border-gray-200 bg-white/80 px-14 py-6 text-lg text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card/80 dark:text-gray-200 dark:placeholder:text-gray-400'
                                />
                                <button className='absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90'>
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Event Categories */}
                        <div className='mx-auto flex max-w-4xl flex-wrap justify-center gap-4'>
                            {[
                                '🎵 Music',
                                '🎭 Arts',
                                '🏃 Sports',
                                '💼 Business',
                                '🎓 Education',
                                '🍽️ Food & Drink',
                            ].map((category, index) => (
                                <button
                                    key={index}
                                    className='rounded-full border border-gray-200/50 bg-white/60 px-6 py-3 text-gray-700 backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-revlr-primary-blue hover:to-revlr-accent-purple hover:text-white hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60 dark:text-gray-300'
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Featured Events Preview */}
                        <div className='mx-auto grid max-w-6xl gap-6 md:grid-cols-3'>
                            {[
                                {
                                    title: 'Lagos Tech Summit',
                                    date: 'Dec 15',
                                    price: '₦15,000',
                                    image: 'bg-gradient-to-br from-blue-500 to-purple-600',
                                },
                                {
                                    title: 'Afrobeats Festival',
                                    date: 'Dec 22',
                                    price: '₦25,000',
                                    image: 'bg-gradient-to-br from-orange-500 to-red-600',
                                },
                                {
                                    title: 'Startup Pitch Night',
                                    date: 'Jan 5',
                                    price: 'Free',
                                    image: 'bg-gradient-to-br from-green-500 to-teal-600',
                                },
                            ].map((event, index) => (
                                <div
                                    key={index}
                                    className='group cursor-pointer'
                                >
                                    <div className='relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl group-hover:-translate-y-2 dark:bg-revlr-dark-card'>
                                        <div
                                            className={`h-48 ${event.image}`}
                                        ></div>
                                        <div className='p-6'>
                                            <h3 className='mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200'>
                                                {event.title}
                                            </h3>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-gray-600 dark:text-gray-400'>
                                                    {event.date}
                                                </span>
                                                <span className='font-bold text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                                    {event.price}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

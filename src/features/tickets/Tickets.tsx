'use client';

import React, { useState } from 'react';
import { Navbar } from '@components/navbar/Navbar';
import TicketCard from './components/TicketCard';

const Tickets = () => {
    const [hasTickets] = useState(false);
    const [selectedYear, setSelectedYear] = useState('2025');
    const [isOrganizer] = useState(false);
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const [selectedMonth, setSelectedMonth] = useState('January');

    const tickets = [
        {
            id: 1,
            title: 'Sanda Music Festival 2025',
            date: 'April 15, 5:00 AM',
            location: 'Central Park, 123 Festival Road, Echo City',
            quantity: '1 x Regular',
            price: 'Free',
            image: '/api/placeholder/120/120',
        },
        {
            id: 2,
            title: 'Sanda Music Festival 2025',
            date: 'April 15, 5:00 AM',
            location: 'Central Park, 123 Festival Road, Echo City',
            quantity: '1 x Regular',
            price: 'Free',
            image: '/api/placeholder/120/120',
        },
    ];

    const EmptyState = () => (
        <div className='flex flex-col items-center justify-center gap-4'>
            <div className='mb-6 flex size-24 items-center justify-center rounded-full bg-blue-100'>
                <svg
                    width='40'
                    height='40'
                    viewBox='0 0 40 40'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                >
                    <path
                        d='M36.6673 17.916C37.3507 17.916 37.9173 17.3493 37.9173 16.666V14.9993C37.9173 7.64935 35.684 5.41602 28.334 5.41602H17.9173V9.16602C17.9173 9.84935 17.3507 10.416 16.6673 10.416C15.984 10.416 15.4173 9.84935 15.4173 9.16602V5.41602H11.6673C4.31732 5.41602 2.08398 7.64935 2.08398 14.9993V15.8327C2.08398 16.516 2.65065 17.0827 3.33398 17.0827C4.93398 17.0827 6.25065 18.3993 6.25065 19.9993C6.25065 21.5993 4.93398 22.916 3.33398 22.916C2.65065 22.916 2.08398 23.4827 2.08398 24.166V24.9993C2.08398 32.3493 4.31732 34.5827 11.6673 34.5827H15.4173V30.8327C15.4173 30.1493 15.984 29.5827 16.6673 29.5827C17.3507 29.5827 17.9173 30.1493 17.9173 30.8327V34.5827H28.334C35.684 34.5827 37.9173 32.3493 37.9173 24.9993C37.9173 24.316 37.3507 23.7493 36.6673 23.7493C35.0673 23.7493 33.7507 22.4327 33.7507 20.8327C33.7507 19.2327 35.0673 17.916 36.6673 17.916ZM17.9173 23.616C17.9173 24.2994 17.3507 24.866 16.6673 24.866C15.984 24.866 15.4173 24.2994 15.4173 23.616V16.3827C15.4173 15.6993 15.984 15.1327 16.6673 15.1327C17.3507 15.1327 17.9173 15.6993 17.9173 16.3827V23.616Z'
                        fill='#3D8BFF'
                    />
                </svg>
            </div>
            <h3 className='mb-2 font-inter text-xl font-medium text-[#001433]'>
                No Tickets Yet
            </h3>
            <p className='font-inter text-lg font-normal text-[#374252]'>
                Your tickets will show up here once you book an event.
            </p>
            <button className='inline-flex items-center rounded-lg bg-[#0066FF] px-6 py-4 font-inter text-base font-semibold text-white'>
                Explore Events
            </button>
        </div>
    );

    return (
        <div>
            <Navbar isOrganizer={isOrganizer} />
            <div className='mx-auto max-w-[1440px] py-32 md:py-24'>
                <div className='bg-white'>
                    <div className='mb-8'>
                        <h1 className='mb-6 font-inter text-lg font-semibold text-[#001433]'>
                            My Tickets
                        </h1>

                        {hasTickets && (
                            <div className='mb-6 flex items-center justify-between'>
                                <div className='relative'>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) =>
                                            setSelectedYear(e.target.value)
                                        }
                                        className='appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    >
                                        <option value='2024'>2024</option>
                                        <option value='2025'>2025</option>
                                        <option value='2026'>2026</option>
                                    </select>
                                    <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                                        <svg
                                            className='size-4 text-gray-400'
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M19 9l-7 7-7-7'
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div className='flex gap-5 overflow-x-auto'>
                                    {months.map((month) => (
                                        <button
                                            key={month}
                                            onClick={() =>
                                                setSelectedMonth(month)
                                            }
                                            className={`whitespace-nowrap rounded-md px-3 py-2 font-inter text-sm transition-colors ${
                                                selectedMonth === month
                                                    ? 'bg-[#E5F0FF] font-medium text-[#0066FF]'
                                                    : 'bg-[#F2F3F5] font-normal text-[#6B7380]'
                                            }`}
                                        >
                                            {month}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    {hasTickets ? (
                        <div className='relative inset-x-1/2 mx-[50vw] mt-12 flex min-h-screen w-screen flex-col items-center space-y-4 bg-[#F9FAFB] pt-12'>
                            {tickets.map((ticket) => (
                                <TicketCard key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    ) : (
                        <div className='relative inset-x-1/2 mx-[50vw] mt-12 flex min-h-screen w-screen flex-col items-center justify-center space-y-4 bg-[#F9FAFB]'>
                            <EmptyState />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tickets;

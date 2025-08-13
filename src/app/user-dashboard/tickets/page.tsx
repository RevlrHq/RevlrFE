'use client';

import { useState } from 'react';
import { useTheme } from '../../../lib/ThemeContext';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Clock,
    QrCode,
    Download,
    Share2,
    Filter,
    Search,
    ChevronRight,
} from 'lucide-react';

interface UserTicket {
    id: string;
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    location: string;
    image: string;
    ticketType: string;
    ticketNumber: string;
    qrCode: string;
    status: 'upcoming' | 'past' | 'cancelled';
    price: number;
    purchaseDate: string;
}

const TicketsPage = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock ticket data - replace with actual API calls
    const [tickets] = useState<UserTicket[]>([
        {
            id: '1',
            eventTitle: 'Tech Conference 2024',
            eventDate: '2024-02-15',
            eventTime: '09:00 AM',
            location: 'Lagos, Nigeria',
            image: '/assets/images/event-image.png',
            ticketType: 'VIP',
            ticketNumber: 'TC2024-VIP-001',
            qrCode: 'QR_CODE_DATA_1',
            status: 'upcoming',
            price: 25000,
            purchaseDate: '2024-01-15',
        },
        {
            id: '2',
            eventTitle: 'Music Festival',
            eventDate: '2024-02-20',
            eventTime: '06:00 PM',
            location: 'Abuja, Nigeria',
            image: '/assets/images/flyer.png',
            ticketType: 'General',
            ticketNumber: 'MF2024-GEN-045',
            qrCode: 'QR_CODE_DATA_2',
            status: 'upcoming',
            price: 15000,
            purchaseDate: '2024-01-20',
        },
        {
            id: '3',
            eventTitle: 'Art Exhibition',
            eventDate: '2024-02-25',
            eventTime: '02:00 PM',
            location: 'Port Harcourt, Nigeria',
            image: '/assets/images/flyer2.png',
            ticketType: 'Standard',
            ticketNumber: 'AE2024-STD-123',
            qrCode: 'QR_CODE_DATA_3',
            status: 'upcoming',
            price: 8000,
            purchaseDate: '2024-01-25',
        },
        {
            id: '4',
            eventTitle: 'Business Summit 2023',
            eventDate: '2023-12-10',
            eventTime: '10:00 AM',
            location: 'Lagos, Nigeria',
            image: '/assets/images/flyer3.png',
            ticketType: 'Premium',
            ticketNumber: 'BS2023-PRM-089',
            qrCode: 'QR_CODE_DATA_4',
            status: 'past',
            price: 20000,
            purchaseDate: '2023-11-15',
        },
    ]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getDaysUntil = (dateString: string) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `${diffDays} days`;
        return formatDate(dateString);
    };

    const filteredTickets = tickets.filter((ticket) => {
        const matchesTab = ticket.status === activeTab;
        const matchesSearch =
            ticket.eventTitle
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            ticket.location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'past':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-gray-50 text-gray-900'
            }`}
        >
            {/* Header Section */}
            <div
                className={`${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                } border-b px-6 py-4`}
            >
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='font-inter text-2xl font-bold'>
                            My Tickets
                        </h1>
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Manage your event tickets and access codes.
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search tickets...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`rounded-lg border py-2 pl-10 pr-4 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                                }`}
                            />
                            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                        </div>

                        <button
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Filter className='size-4' />
                        </button>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                {/* Tabs */}
                <div className='mb-6 flex space-x-1'>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors ${
                            activeTab === 'upcoming'
                                ? 'bg-revlr-primary-blue text-white'
                                : theme === 'dark'
                                  ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        Upcoming (
                        {tickets.filter((t) => t.status === 'upcoming').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`rounded-lg px-4 py-2 font-inter text-sm font-medium transition-colors ${
                            activeTab === 'past'
                                ? 'bg-revlr-primary-blue text-white'
                                : theme === 'dark'
                                  ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                        Past Events (
                        {tickets.filter((t) => t.status === 'past').length})
                    </button>
                </div>

                {/* Tickets Grid */}
                {filteredTickets.length === 0 ? (
                    <div
                        className={`py-12 text-center ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        <QrCode className='mx-auto mb-4 size-16 opacity-50' />
                        <h3 className='mb-2 font-inter text-lg font-semibold'>
                            No tickets found
                        </h3>
                        <p className='mb-4 font-inter text-sm'>
                            {activeTab === 'upcoming'
                                ? "You don't have any upcoming events."
                                : "You haven't attended any events yet."}
                        </p>
                        <Link
                            href='/events'
                            className='inline-flex items-center gap-2 rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white transition-colors hover:bg-blue-700'
                        >
                            Browse Events <ChevronRight className='size-4' />
                        </Link>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                className={`rounded-xl border p-6 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                } transition-shadow hover:shadow-lg`}
                            >
                                <div className='flex items-start gap-4'>
                                    <img
                                        src={ticket.image}
                                        alt={ticket.eventTitle}
                                        className='size-20 rounded-lg object-cover'
                                    />
                                    <div className='flex-1'>
                                        <div className='mb-2 flex items-start justify-between'>
                                            <div>
                                                <h3 className='mb-1 font-inter text-lg font-semibold'>
                                                    {ticket.eventTitle}
                                                </h3>
                                                <span
                                                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(ticket.status)}`}
                                                >
                                                    {ticket.ticketType}
                                                </span>
                                            </div>
                                            <div className='text-right'>
                                                <p className='font-inter text-lg font-semibold'>
                                                    {formatCurrency(
                                                        ticket.price
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className='mb-4 space-y-2'>
                                            <div className='flex items-center gap-2 text-sm'>
                                                <Calendar className='size-4' />
                                                <span>
                                                    {activeTab === 'upcoming'
                                                        ? getDaysUntil(
                                                              ticket.eventDate
                                                          )
                                                        : formatDate(
                                                              ticket.eventDate
                                                          )}
                                                </span>
                                                <Clock className='ml-2 size-4' />
                                                <span>{ticket.eventTime}</span>
                                            </div>
                                            <div className='flex items-center gap-2 text-sm'>
                                                <MapPin className='size-4' />
                                                <span>{ticket.location}</span>
                                            </div>
                                            <div className='flex items-center gap-2 text-sm'>
                                                <QrCode className='size-4' />
                                                <span className='font-mono'>
                                                    {ticket.ticketNumber}
                                                </span>
                                            </div>
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            {activeTab === 'upcoming' && (
                                                <>
                                                    <button className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white transition-colors hover:bg-blue-700'>
                                                        <QrCode className='size-4' />
                                                        Show QR Code
                                                    </button>
                                                    <button
                                                        className={`rounded-lg border p-2 ${
                                                            theme === 'dark'
                                                                ? 'border-revlr-dark-border hover:bg-revlr-dark-border'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <Download className='size-4' />
                                                    </button>
                                                    <button
                                                        className={`rounded-lg border p-2 ${
                                                            theme === 'dark'
                                                                ? 'border-revlr-dark-border hover:bg-revlr-dark-border'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <Share2 className='size-4' />
                                                    </button>
                                                </>
                                            )}
                                            {activeTab === 'past' && (
                                                <>
                                                    <button className='flex-1 rounded-lg bg-revlr-accent-purple px-4 py-2 font-inter font-medium text-white transition-colors hover:bg-purple-700'>
                                                        Rate Event
                                                    </button>
                                                    <button
                                                        className={`rounded-lg border p-2 ${
                                                            theme === 'dark'
                                                                ? 'border-revlr-dark-border hover:bg-revlr-dark-border'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <Download className='size-4' />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketsPage;

'use client';

import { useState } from 'react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Clock,
    Heart,
    Users,
    Ticket,
    Search,
    Bell,
    Settings,
    ChevronRight,
    TrendingUp,
    Share2,
    QrCode,
    User,
} from 'lucide-react';

interface UserEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    category: string;
    status: 'upcoming' | 'past' | 'saved';
    ticketType?: string;
    rating?: number;
}

interface RecommendedEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    image: string;
    category: string;
    price: number;
    attendees: number;
    trending?: boolean;
}

interface UserStats {
    eventsAttended: number;
    upcomingEvents: number;
    savedEvents: number;
    friendsConnected: number;
}

const UserDashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuthStore();

    // Mock user data - replace with actual API calls
    const [userStats] = useState<UserStats>({
        eventsAttended: 24,
        upcomingEvents: 3,
        savedEvents: 12,
        friendsConnected: 45,
    });

    const [upcomingEvents] = useState<UserEvent[]>([
        {
            id: '1',
            title: 'Tech Conference 2024',
            date: '2024-02-15',
            time: '09:00 AM',
            location: 'Lagos, Nigeria',
            image: '/assets/images/event-image.png',
            category: 'Technology',
            status: 'upcoming',
            ticketType: 'VIP',
        },
        {
            id: '2',
            title: 'Music Festival',
            date: '2024-02-20',
            time: '06:00 PM',
            location: 'Abuja, Nigeria',
            image: '/assets/images/flyer.png',
            category: 'Music',
            status: 'upcoming',
            ticketType: 'General',
        },
        {
            id: '3',
            title: 'Art Exhibition',
            date: '2024-02-25',
            time: '02:00 PM',
            location: 'Port Harcourt, Nigeria',
            image: '/assets/images/flyer2.png',
            category: 'Art',
            status: 'upcoming',
            ticketType: 'Standard',
        },
    ]);

    const [recommendedEvents] = useState<RecommendedEvent[]>([
        {
            id: '4',
            title: 'Startup Pitch Night',
            date: '2024-03-01',
            location: 'Lagos, Nigeria',
            image: '/assets/images/flyer3.png',
            category: 'Business',
            price: 5000,
            attendees: 150,
            trending: true,
        },
        {
            id: '5',
            title: 'Food & Wine Festival',
            date: '2024-03-05',
            location: 'Abuja, Nigeria',
            image: '/assets/images/flyer4.png',
            category: 'Food',
            price: 8000,
            attendees: 300,
        },
        {
            id: '6',
            title: 'Photography Workshop',
            date: '2024-03-10',
            location: 'Lagos, Nigeria',
            image: '/assets/images/flyer5.png',
            category: 'Education',
            price: 12000,
            attendees: 50,
        },
    ]);

    const [recentActivity] = useState([
        {
            type: 'ticket_purchased',
            event: 'Tech Conference 2024',
            time: '2 hours ago',
            icon: <Ticket className='size-4' />,
        },
        {
            type: 'event_saved',
            event: 'Music Festival',
            time: '1 day ago',
            icon: <Heart className='size-4' />,
        },
        {
            type: 'friend_joined',
            event: 'Art Exhibition',
            time: '2 days ago',
            icon: <Users className='size-4' />,
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
                    <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-3'>
                            <div className='flex size-12 items-center justify-center rounded-full bg-revlr-primary-blue text-white'>
                                <User className='size-6' />
                            </div>
                            <div>
                                <h1 className='font-inter text-2xl font-bold'>
                                    {user?.firstName && user?.lastName
                                        ? `Welcome back, ${user.firstName} ${user.lastName}!`
                                        : user?.firstName
                                          ? `Welcome back, ${user.firstName}!`
                                          : 'Welcome back!'}
                                </h1>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {user?.email && (
                                        <span>{user.email} • </span>
                                    )}
                                    Discover amazing events and manage your
                                    tickets.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center gap-3'>
                        <button
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Search className='size-4' />
                        </button>

                        <button
                            className={`relative rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Bell className='size-4' />
                            <span className='absolute -right-1 -top-1 size-3 rounded-full bg-red-500'></span>
                        </button>

                        <Link
                            href='/dashboard/settings'
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Settings className='size-4' />
                        </Link>
                    </div>
                </div>
            </div>

            <div className='space-y-6 p-6'>
                {/* Stats Grid */}
                <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                    <div
                        className={`rounded-xl border p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <div>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Events Attended
                                </p>
                                <p className='mt-1 font-inter text-xl font-bold'>
                                    {userStats.eventsAttended}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-primary-blue/10 p-2'>
                                <Calendar className='size-5 text-revlr-primary-blue' />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <div>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Upcoming
                                </p>
                                <p className='mt-1 font-inter text-xl font-bold'>
                                    {userStats.upcomingEvents}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-accent-green/10 p-2'>
                                <Clock className='size-5 text-revlr-accent-green' />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <div>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Saved Events
                                </p>
                                <p className='mt-1 font-inter text-xl font-bold'>
                                    {userStats.savedEvents}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-accent-purple/10 p-2'>
                                <Heart className='size-5 text-revlr-accent-purple' />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='flex items-center justify-between'>
                            <div>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Friends
                                </p>
                                <p className='mt-1 font-inter text-xl font-bold'>
                                    {userStats.friendsConnected}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-accent-orange/10 p-2'>
                                <Users className='size-5 text-revlr-accent-orange' />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div
                    className={`rounded-xl border p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    <h2 className='mb-4 font-inter text-lg font-semibold'>
                        Quick Actions
                    </h2>
                    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                        <Link
                            href='/events'
                            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                    : 'border-gray-200 hover:border-revlr-primary-blue/50'
                            }`}
                        >
                            <div className='mb-3 flex size-10 items-center justify-center rounded-lg bg-revlr-primary-blue text-white'>
                                <Search className='size-5' />
                            </div>
                            <h3 className='mb-1 font-inter font-semibold'>
                                Browse Events
                            </h3>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Discover new events
                            </p>
                        </Link>

                        <Link
                            href='/user-dashboard/tickets'
                            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                    : 'border-gray-200 hover:border-revlr-primary-blue/50'
                            }`}
                        >
                            <div className='mb-3 flex size-10 items-center justify-center rounded-lg bg-revlr-accent-green text-white'>
                                <QrCode className='size-5' />
                            </div>
                            <h3 className='mb-1 font-inter font-semibold'>
                                My Tickets
                            </h3>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                View your tickets
                            </p>
                        </Link>

                        <Link
                            href='/user-dashboard/saved'
                            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                    : 'border-gray-200 hover:border-revlr-primary-blue/50'
                            }`}
                        >
                            <div className='mb-3 flex size-10 items-center justify-center rounded-lg bg-revlr-accent-purple text-white'>
                                <Heart className='size-5' />
                            </div>
                            <h3 className='mb-1 font-inter font-semibold'>
                                Saved Events
                            </h3>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Your wishlist
                            </p>
                        </Link>

                        <Link
                            href='/user-dashboard/friends'
                            className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                    : 'border-gray-200 hover:border-revlr-primary-blue/50'
                            }`}
                        >
                            <div className='mb-3 flex size-10 items-center justify-center rounded-lg bg-revlr-accent-orange text-white'>
                                <Share2 className='size-5' />
                            </div>
                            <h3 className='mb-1 font-inter font-semibold'>
                                Invite Friends
                            </h3>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Share events
                            </p>
                        </Link>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                    {/* Upcoming Events */}
                    <div
                        className={`rounded-xl border p-6 lg:col-span-2 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='mb-4 flex items-center justify-between'>
                            <h2 className='font-inter text-lg font-semibold'>
                                Your Upcoming Events
                            </h2>
                            <Link
                                href='/user-dashboard/tickets'
                                className='flex items-center gap-1 font-inter text-sm text-revlr-primary-blue hover:underline'
                            >
                                View all <ChevronRight className='size-4' />
                            </Link>
                        </div>

                        <div className='space-y-4'>
                            {upcomingEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className={`rounded-lg border p-4 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className='flex items-start gap-4'>
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className='size-16 rounded-lg object-cover'
                                        />
                                        <div className='flex-1'>
                                            <div className='flex items-start justify-between'>
                                                <div>
                                                    <h3 className='mb-1 font-inter font-semibold'>
                                                        {event.title}
                                                    </h3>
                                                    <div className='mb-2 flex items-center gap-4 text-sm'>
                                                        <div className='flex items-center gap-1'>
                                                            <Calendar className='size-4' />
                                                            <span>
                                                                {getDaysUntil(
                                                                    event.date
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center gap-1'>
                                                            <Clock className='size-4' />
                                                            <span>
                                                                {event.time}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className='flex items-center gap-1 text-sm'>
                                                        <MapPin className='size-4' />
                                                        <span>
                                                            {event.location}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <span className='inline-block rounded-full bg-revlr-primary-blue/10 px-2 py-1 text-xs font-medium text-revlr-primary-blue'>
                                                        {event.ticketType}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Content */}
                    <div className='space-y-6'>
                        {/* Recommended Events */}
                        <div
                            className={`rounded-xl border p-6 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className='mb-4 flex items-center justify-between'>
                                <h2 className='font-inter text-lg font-semibold'>
                                    Recommended
                                </h2>
                                <Link
                                    href='/events'
                                    className='font-inter text-sm text-revlr-primary-blue hover:underline'
                                >
                                    See more
                                </Link>
                            </div>

                            <div className='space-y-4'>
                                {recommendedEvents.slice(0, 2).map((event) => (
                                    <div
                                        key={event.id}
                                        className='group cursor-pointer'
                                    >
                                        <div className='relative mb-2'>
                                            <img
                                                src={event.image}
                                                alt={event.title}
                                                className='h-24 w-full rounded-lg object-cover transition-opacity group-hover:opacity-90'
                                            />
                                            {event.trending && (
                                                <div className='absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-xs text-white'>
                                                    <TrendingUp className='size-3' />
                                                    Trending
                                                </div>
                                            )}
                                        </div>
                                        <h3 className='mb-1 font-inter text-sm font-semibold transition-colors group-hover:text-revlr-primary-blue'>
                                            {event.title}
                                        </h3>
                                        <div className='flex items-center justify-between text-xs'>
                                            <span
                                                className={
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }
                                            >
                                                {formatDate(event.date)}
                                            </span>
                                            <span className='font-semibold text-revlr-primary-blue'>
                                                {formatCurrency(event.price)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div
                            className={`rounded-xl border p-6 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <h2 className='mb-4 font-inter text-lg font-semibold'>
                                Recent Activity
                            </h2>
                            <div className='space-y-3'>
                                {recentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className='flex items-start gap-3'
                                    >
                                        <div className='rounded-lg bg-revlr-primary-blue/10 p-2 text-revlr-primary-blue'>
                                            {activity.icon}
                                        </div>
                                        <div className='flex-1'>
                                            <p className='font-inter text-sm font-medium'>
                                                {activity.type ===
                                                    'ticket_purchased' &&
                                                    'Ticket purchased'}
                                                {activity.type ===
                                                    'event_saved' &&
                                                    'Event saved'}
                                                {activity.type ===
                                                    'friend_joined' &&
                                                    'Friend joined event'}
                                            </p>
                                            <p
                                                className={`font-inter text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                {activity.event} •{' '}
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;

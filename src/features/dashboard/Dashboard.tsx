'use client';

import { useState } from 'react';
import { useTheme } from '../../lib/ThemeContext';
import Link from 'next/link';
import {
    Calendar,
    DollarSign,
    Users,
    TrendingUp,
    Eye,
    Clock,
    MapPin,
    Star,
    ArrowUpRight,
    Plus,
    Download,
    Bell,
    Settings,
} from 'lucide-react';

interface DashboardStats {
    totalEvents: number;
    activeEvents: number;
    totalRevenue: number;
    totalAttendees: number;
    pendingPayouts: number;
    monthlyGrowth: number;
}

interface RecentEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    attendees: number;
    revenue: number;
    status: 'active' | 'upcoming' | 'completed' | 'draft';
    image?: string;
}

interface QuickAction {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

const Dashboard = () => {
    const { theme } = useTheme();
    const [timeRange, setTimeRange] = useState('30d');

    // Mock data - replace with actual API calls
    const [stats] = useState<DashboardStats>({
        totalEvents: 24,
        activeEvents: 8,
        totalRevenue: 45280,
        totalAttendees: 1247,
        pendingPayouts: 12450,
        monthlyGrowth: 12.5,
    });

    const [recentEvents] = useState<RecentEvent[]>([
        {
            id: '1',
            title: 'Tech Conference 2024',
            date: '2024-02-15',
            location: 'Lagos, Nigeria',
            attendees: 250,
            revenue: 12500,
            status: 'active',
        },
        {
            id: '2',
            title: 'Music Festival',
            date: '2024-02-20',
            location: 'Abuja, Nigeria',
            attendees: 500,
            revenue: 25000,
            status: 'upcoming',
        },
        {
            id: '3',
            title: 'Business Summit',
            date: '2024-01-28',
            location: 'Port Harcourt, Nigeria',
            attendees: 180,
            revenue: 9000,
            status: 'completed',
        },
    ]);

    const quickActions: QuickAction[] = [
        {
            title: 'Create Event',
            description: 'Start planning your next event',
            icon: <Plus className='size-6' />,
            href: '/dashboard/event/create-event',
            color: 'bg-revlr-primary-blue',
        },
        {
            title: 'View Analytics',
            description: 'Track your event performance',
            icon: <TrendingUp className='size-6' />,
            href: '/dashboard/analytics',
            color: 'bg-revlr-accent-purple',
        },
        {
            title: 'Manage Payouts',
            description: 'Handle your earnings',
            icon: <DollarSign className='size-6' />,
            href: '/dashboard/payment/payout-management',
            color: 'bg-revlr-accent-green',
        },
        {
            title: 'Event Settings',
            description: 'Configure your preferences',
            icon: <Settings className='size-6' />,
            href: '/dashboard/settings',
            color: 'bg-revlr-accent-orange',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'upcoming':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'completed':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

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
                            Dashboard Overview
                        </h1>
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Welcome back! Here's what's happening with your
                            events.
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className={`rounded-lg border px-3 py-2 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                    : 'border-gray-300 bg-white text-gray-900'
                            }`}
                        >
                            <option value='7d'>Last 7 days</option>
                            <option value='30d'>Last 30 days</option>
                            <option value='90d'>Last 90 days</option>
                            <option value='1y'>Last year</option>
                        </select>

                        <button
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Download className='size-4' />
                        </button>

                        <button
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Bell className='size-4' />
                        </button>
                    </div>
                </div>
            </div>

            <div className='space-y-6 p-6'>
                {/* Stats Grid */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                    <div
                        className={`rounded-xl border p-6 ${
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
                                    Total Events
                                </p>
                                <p className='mt-1 font-inter text-2xl font-bold'>
                                    {stats.totalEvents}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-primary-blue/10 p-3'>
                                <Calendar className='size-6 text-revlr-primary-blue' />
                            </div>
                        </div>
                        <div className='mt-4 flex items-center text-sm'>
                            <ArrowUpRight className='mr-1 size-4 text-green-500' />
                            <span className='font-medium text-green-500'>
                                +{stats.monthlyGrowth}%
                            </span>
                            <span
                                className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                vs last month
                            </span>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border p-6 ${
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
                                    Active Events
                                </p>
                                <p className='mt-1 font-inter text-2xl font-bold'>
                                    {stats.activeEvents}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-accent-green/10 p-3'>
                                <Eye className='size-6 text-revlr-accent-green' />
                            </div>
                        </div>
                        <div className='mt-4 flex items-center text-sm'>
                            <Clock className='mr-1 size-4 text-blue-500' />
                            <span
                                className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                {stats.activeEvents} running now
                            </span>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border p-6 ${
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
                                    Total Revenue
                                </p>
                                <p className='mt-1 font-inter text-2xl font-bold'>
                                    {formatCurrency(stats.totalRevenue)}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-accent-purple/10 p-3'>
                                <DollarSign className='size-6 text-revlr-accent-purple' />
                            </div>
                        </div>
                        <div className='mt-4 flex items-center text-sm'>
                            <ArrowUpRight className='mr-1 size-4 text-green-500' />
                            <span className='font-medium text-green-500'>
                                +18.2%
                            </span>
                            <span
                                className={`ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                vs last month
                            </span>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl border p-6 ${
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
                                    Total Attendees
                                </p>
                                <p className='mt-1 font-inter text-2xl font-bold'>
                                    {stats.totalAttendees.toLocaleString()}
                                </p>
                            </div>
                            <div className='rounded-lg bg-revlr-accent-orange/10 p-3'>
                                <Users className='size-6 text-revlr-accent-orange' />
                            </div>
                        </div>
                        <div className='mt-4 flex items-center text-sm'>
                            <Star className='mr-1 size-4 text-yellow-500' />
                            <span
                                className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                4.8 avg rating
                            </span>
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
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                        : 'border-gray-200 hover:border-revlr-primary-blue/50'
                                }`}
                            >
                                <div
                                    className={`size-12 ${action.color} mb-3 flex items-center justify-center rounded-lg text-white`}
                                >
                                    {action.icon}
                                </div>
                                <h3 className='mb-1 font-inter font-semibold'>
                                    {action.title}
                                </h3>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {action.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Events and Pending Payouts */}
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                    {/* Recent Events */}
                    <div
                        className={`rounded-xl border p-6 lg:col-span-2 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='mb-4 flex items-center justify-between'>
                            <h2 className='font-inter text-lg font-semibold'>
                                Recent Events
                            </h2>
                            <Link
                                href='/dashboard/event'
                                className='font-inter text-sm text-revlr-primary-blue hover:underline'
                            >
                                View all
                            </Link>
                        </div>

                        <div className='space-y-4'>
                            {recentEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className={`rounded-lg border p-4 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex-1'>
                                            <div className='mb-2 flex items-center gap-3'>
                                                <h3 className='font-inter font-semibold'>
                                                    {event.title}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(event.status)}`}
                                                >
                                                    {event.status}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-4 text-sm'>
                                                <div className='flex items-center gap-1'>
                                                    <Calendar className='size-4' />
                                                    <span>
                                                        {formatDate(event.date)}
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-1'>
                                                    <MapPin className='size-4' />
                                                    <span>
                                                        {event.location}
                                                    </span>
                                                </div>
                                                <div className='flex items-center gap-1'>
                                                    <Users className='size-4' />
                                                    <span>
                                                        {event.attendees}{' '}
                                                        attendees
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <p className='font-inter font-semibold'>
                                                {formatCurrency(event.revenue)}
                                            </p>
                                            <p
                                                className={`font-inter text-sm ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Revenue
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Payouts & Notifications */}
                    <div className='space-y-6'>
                        {/* Pending Payouts */}
                        <div
                            className={`rounded-xl border p-6 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className='mb-4 flex items-center justify-between'>
                                <h2 className='font-inter text-lg font-semibold'>
                                    Pending Payouts
                                </h2>
                                <Link
                                    href='/dashboard/payment/payout-management'
                                    className='font-inter text-sm text-revlr-primary-blue hover:underline'
                                >
                                    Manage
                                </Link>
                            </div>

                            <div className='py-6 text-center'>
                                <div className='mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-revlr-accent-green/10'>
                                    <DollarSign className='size-8 text-revlr-accent-green' />
                                </div>
                                <p className='mb-1 font-inter text-2xl font-bold'>
                                    {formatCurrency(stats.pendingPayouts)}
                                </p>
                                <p
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Available for withdrawal
                                </p>
                                <button className='mt-4 w-full rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white transition-colors hover:bg-blue-700'>
                                    Request Payout
                                </button>
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
                                <div className='flex items-start gap-3'>
                                    <div className='mt-2 size-2 rounded-full bg-green-500'></div>
                                    <div>
                                        <p className='font-inter text-sm font-medium'>
                                            New registration
                                        </p>
                                        <p
                                            className={`font-inter text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Tech Conference 2024 • 2 min ago
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <div className='mt-2 size-2 rounded-full bg-blue-500'></div>
                                    <div>
                                        <p className='font-inter text-sm font-medium'>
                                            Payment received
                                        </p>
                                        <p
                                            className={`font-inter text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            ₦5,000 • 15 min ago
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-start gap-3'>
                                    <div className='mt-2 size-2 rounded-full bg-yellow-500'></div>
                                    <div>
                                        <p className='font-inter text-sm font-medium'>
                                            Event updated
                                        </p>
                                        <p
                                            className={`font-inter text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Music Festival • 1 hour ago
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

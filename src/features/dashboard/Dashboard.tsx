'use client';

import { useState } from 'react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizerDashboard } from '../../hooks/useOrganizerDashboard';
import { EventSummaryView, EventStatus } from '../../lib/api';
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
    User,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { Skeleton, CardSkeleton } from '../../components/LoadingStates';
import StatisticsOverview from '../../components/StatisticsOverview';
import EventPerformanceAnalytics from '../../components/EventPerformanceAnalytics';
import { DashboardErrorBoundary } from '../../components/error-handling/DashboardErrorBoundary';
import { ApiErrorFallback } from '../../components/error-handling/ApiErrorFallback';
import { OfflineIndicator } from '../../components/error-handling/OfflineIndicator';

interface QuickAction {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const [timeRange, setTimeRange] = useState('30d');

    // Use real API data instead of mock data
    const {
        data: dashboardData,
        loading,
        error,
        refetch,
    } = useOrganizerDashboard();

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

    const getStatusColor = (status: EventStatus) => {
        // EventStatus is a number type, so we use numeric values
        switch (status) {
            case 1: // Published
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 0: // Draft
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 2: // Cancelled
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 3: // Completed
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status: EventStatus) => {
        // EventStatus is a number type, so we use numeric values
        switch (status) {
            case 1: // Published
                return 'Published';
            case 0: // Draft
                return 'Draft';
            case 2: // Cancelled
                return 'Cancelled';
            case 3: // Completed
                return 'Completed';
            default:
                return 'Unknown';
        }
    };

    // Calculate growth percentage for revenue
    const calculateRevenueGrowth = () => {
        if (
            !dashboardData?.revenue?.thisMonthRevenue ||
            !dashboardData?.revenue?.lastMonthRevenue
        ) {
            return 0;
        }
        const thisMonth = dashboardData.revenue.thisMonthRevenue;
        const lastMonth = dashboardData.revenue.lastMonthRevenue;
        return lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    };

    // Enhanced error fallback for API errors
    const renderApiErrorFallback = (title: string) => {
        if (error) {
            return (
                <ApiErrorFallback
                    error={new Error(error)}
                    onRetry={refetch}
                    title={`Failed to load ${title}`}
                    isLoading={loading}
                />
            );
        }
        return null;
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
            {/* Offline Indicator */}
            <OfflineIndicator
                className='mx-6 mt-4'
                onRetryConnection={refetch}
            />
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
                                    {user?.isOrganizer
                                        ? 'Event Organizer'
                                        : 'Event Attendee'}{' '}
                                    • Here's what's happening with your events.
                                </p>
                            </div>
                        </div>
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
                {/* Enhanced Statistics Overview */}
                <StatisticsOverview
                    eventStatistics={dashboardData?.statistics}
                    revenueStatistics={dashboardData?.revenue}
                    loading={loading}
                    error={error}
                />

                {/* Event Performance Analytics */}
                <EventPerformanceAnalytics
                    timeRange={{
                        startDate:
                            timeRange === '7d'
                                ? new Date(
                                      Date.now() - 7 * 24 * 60 * 60 * 1000
                                  ).toISOString()
                                : timeRange === '30d'
                                  ? new Date(
                                        Date.now() - 30 * 24 * 60 * 60 * 1000
                                    ).toISOString()
                                  : timeRange === '90d'
                                    ? new Date(
                                          Date.now() - 90 * 24 * 60 * 60 * 1000
                                      ).toISOString()
                                    : new Date(
                                          Date.now() - 365 * 24 * 60 * 60 * 1000
                                      ).toISOString(),
                        endDate: new Date().toISOString(),
                    }}
                    maxTopEvents={10}
                    showRecommendations={true}
                    showAlerts={true}
                />

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
                    <DashboardErrorBoundary
                        section='Recent Events'
                        onRetry={refetch}
                        fallback={renderApiErrorFallback('recent events')}
                    >
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
                                    href='/dashboard/events'
                                    className='font-inter text-sm text-revlr-primary-blue hover:underline'
                                >
                                    View all
                                </Link>
                            </div>

                            {loading ? (
                                <div className='space-y-4'>
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className='flex items-center space-x-4'
                                        >
                                            <Skeleton
                                                width='w-16'
                                                height='h-16'
                                                rounded
                                            />
                                            <div className='flex-1 space-y-2'>
                                                <Skeleton
                                                    width='w-3/4'
                                                    height='h-4'
                                                />
                                                <Skeleton
                                                    width='w-1/2'
                                                    height='h-3'
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : dashboardData?.recentEvents &&
                              dashboardData.recentEvents.length > 0 ? (
                                <div className='space-y-4'>
                                    {dashboardData.recentEvents
                                        .slice(0, 5)
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                className='flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-revlr-dark-border'
                                            >
                                                <div className='flex items-center space-x-4'>
                                                    <div className='flex size-12 items-center justify-center rounded-lg bg-revlr-primary-blue/10'>
                                                        <Calendar className='size-6 text-revlr-primary-blue' />
                                                    </div>
                                                    <div>
                                                        <h3 className='font-inter font-semibold'>
                                                            {event.title}
                                                        </h3>
                                                        <p
                                                            className={`font-inter text-sm ${
                                                                theme === 'dark'
                                                                    ? 'text-gray-400'
                                                                    : 'text-gray-600'
                                                            }`}
                                                        >
                                                            {formatDate(
                                                                event.startDate
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center space-x-2'>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                                            event.status
                                                        )}`}
                                                    >
                                                        {getStatusLabel(
                                                            event.status
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className='flex flex-col items-center justify-center py-12'>
                                    <Calendar className='mb-4 size-12 text-gray-400' />
                                    <h3 className='mb-2 font-inter text-lg font-semibold'>
                                        No recent events
                                    </h3>
                                    <p
                                        className={`mb-4 font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        Create your first event to get started
                                    </p>
                                    <Link
                                        href='/dashboard/event/create-event'
                                        className='rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter text-sm text-white transition-colors hover:bg-blue-700'
                                    >
                                        Create Event
                                    </Link>
                                </div>
                            )}
                        </div>
                    </DashboardErrorBoundary>

                    {/* Pending Payouts & Notifications */}
                    <div className='space-y-6'>
                        {/* Pending Payouts */}
                        <DashboardErrorBoundary
                            section='Pending Payouts'
                            onRetry={refetch}
                            fallback={renderApiErrorFallback('pending payouts')}
                        >
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
                                        View all
                                    </Link>
                                </div>

                                {loading ? (
                                    <div className='space-y-4'>
                                        {[1, 2, 3].map((i) => (
                                            <div
                                                key={i}
                                                className='flex items-center justify-between rounded-lg border p-4'
                                            >
                                                <div className='flex items-center space-x-3'>
                                                    <Skeleton
                                                        width='w-10'
                                                        height='h-10'
                                                        rounded
                                                    />
                                                    <div className='space-y-2'>
                                                        <Skeleton
                                                            width='w-24'
                                                            height='h-4'
                                                        />
                                                        <Skeleton
                                                            width='w-16'
                                                            height='h-3'
                                                        />
                                                    </div>
                                                </div>
                                                <Skeleton
                                                    width='w-20'
                                                    height='h-6'
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='flex flex-col items-center justify-center py-12'>
                                        <DollarSign className='mb-4 size-12 text-gray-400' />
                                        <h3 className='mb-2 font-inter text-lg font-semibold'>
                                            No pending payouts
                                        </h3>
                                        <p
                                            className={`font-inter text-sm ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Your payouts will appear here
                                        </p>
                                    </div>
                                )}
                            </div>
                        </DashboardErrorBoundary>

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
                            <div className='space-y-4'>
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className='flex items-center space-x-3'
                                    >
                                        <div className='flex size-8 items-center justify-center rounded-full bg-revlr-primary-blue/10'>
                                            <Star className='size-4 text-revlr-primary-blue' />
                                        </div>
                                        <div className='flex-1'>
                                            <p className='font-inter text-sm'>
                                                Activity item {i}
                                            </p>
                                            <p
                                                className={`font-inter text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                2 hours ago
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

export default Dashboard;

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { useAuthStore } from '../stores/authStore';
import { useOrganizerDashboard } from '../hooks/useOrganizerDashboard';
import { useAccessibility } from '../hooks/useAccessibility';
import { EventStatus } from '../lib/api';
import Link from 'next/link';
import {
    Calendar,
    DollarSign,
    TrendingUp,
    Star,
    Plus,
    Download,
    Bell,
    Settings,
    User,
    RefreshCw,
} from 'lucide-react';
import { Skeleton } from './LoadingStates';
import StatisticsOverview from './StatisticsOverview';
import EventPerformanceAnalytics from './EventPerformanceAnalytics';

interface QuickAction {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
    shortcut?: string;
}

interface AccessibleDashboardProps {
    className?: string;
}

const AccessibleDashboard: React.FC<AccessibleDashboardProps> = ({
    className = '',
}) => {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const [timeRange, setTimeRange] = useState('30d');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [skipLinksVisible, setSkipLinksVisible] = useState(false);

    // Enhanced accessibility
    const {
        focusManagement,
        screenReader,
        announceLoading,
        announceError,
        announceSuccess,
        announceDataChange,
        createButtonProps,
        getAriaAttributes,
    } = useAccessibility({
        enableHighContrast: true,
        enableReducedMotion: true,
        enableFocusManagement: true,
        enableScreenReaderSupport: true,
        announceChanges: true,
        enableKeyboardNavigation: true,
    });

    // Use real API data instead of mock data
    const {
        data: dashboardData,
        loading,
        error,
        refetch,
    } = useOrganizerDashboard();

    // Refs for accessibility
    const mainContentRef = useRef<HTMLElement>(null);
    const navigationRef = useRef<HTMLElement>(null);
    const quickActionsRef = useRef<HTMLDivElement>(null);
    const skipLinksRef = useRef<HTMLDivElement>(null);

    // Quick actions with keyboard shortcuts
    const quickActions: QuickAction[] = [
        {
            title: 'Create Event',
            description: 'Start planning your next event',
            icon: <Plus className='size-6' />,
            href: '/dashboard/event/create-event',
            color: 'bg-revlr-primary-blue',
            shortcut: 'Alt+C',
        },
        {
            title: 'View Analytics',
            description: 'Track your event performance',
            icon: <TrendingUp className='size-6' />,
            href: '/dashboard/analytics',
            color: 'bg-revlr-accent-purple',
            shortcut: 'Alt+A',
        },
        {
            title: 'Manage Payouts',
            description: 'Handle your earnings',
            icon: <DollarSign className='size-6' />,
            href: '/dashboard/payment/payout-management',
            color: 'bg-revlr-accent-green',
            shortcut: 'Alt+P',
        },
        {
            title: 'Event Settings',
            description: 'Configure your preferences',
            icon: <Settings className='size-6' />,
            href: '/dashboard/settings',
            color: 'bg-revlr-accent-orange',
            shortcut: 'Alt+S',
        },
    ];

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Skip links visibility
            if (event.key === 'Tab' && !skipLinksVisible) {
                setSkipLinksVisible(true);
            }

            // Quick action shortcuts
            if (event.altKey) {
                switch (event.key.toLowerCase()) {
                    case 'c':
                        event.preventDefault();
                        window.location.href = '/dashboard/event/create-event';
                        break;
                    case 'a':
                        event.preventDefault();
                        window.location.href = '/dashboard/analytics';
                        break;
                    case 'p':
                        event.preventDefault();
                        window.location.href =
                            '/dashboard/payment/payout-management';
                        break;
                    case 's':
                        event.preventDefault();
                        window.location.href = '/dashboard/settings';
                        break;
                    case 'm':
                        event.preventDefault();
                        if (mainContentRef.current) {
                            focusManagement.focusElement(
                                mainContentRef.current,
                                'main content'
                            );
                        }
                        break;
                    case 'n':
                        event.preventDefault();
                        if (navigationRef.current) {
                            focusManagement.focusElement(
                                navigationRef.current,
                                'navigation'
                            );
                        }
                        break;
                }
            }

            // Escape key handling
            if (event.key === 'Escape') {
                if (showMobileMenu) {
                    setShowMobileMenu(false);
                    screenReader.announce('Mobile menu closed');
                }
                setSkipLinksVisible(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showMobileMenu, skipLinksVisible, focusManagement, screenReader]);

    // Announce data changes
    useEffect(() => {
        if (dashboardData && !loading) {
            const eventCount = dashboardData.statistics?.totalEvents || 0;
            const revenue = dashboardData.revenue?.totalRevenue || 0;

            announceDataChange(
                'dashboard data',
                undefined,
                `loaded with ${eventCount} events and ${formatCurrency(revenue)} total revenue`
            );
        }
    }, [dashboardData, loading, announceDataChange]);

    // Announce loading states
    useEffect(() => {
        if (loading) {
            announceLoading('Loading dashboard data');
        }
    }, [loading, announceLoading]);

    // Announce errors
    useEffect(() => {
        if (error) {
            announceError(`Failed to load dashboard: ${error}`);
        }
    }, [error, announceError]);

    // Handle time range change
    const handleTimeRangeChange = (newTimeRange: string) => {
        setTimeRange(newTimeRange);
        screenReader.announce(
            `Time range changed to ${getTimeRangeLabel(newTimeRange)}`
        );
    };

    // Handle refresh
    const handleRefresh = async () => {
        announceLoading('Refreshing dashboard data');
        try {
            await refetch();
            announceSuccess('Dashboard data refreshed');
        } catch {
            announceError('Failed to refresh dashboard data');
        }
    };

    // Skip to main content
    const skipToMainContent = () => {
        if (mainContentRef.current) {
            focusManagement.focusElement(
                mainContentRef.current,
                'main content'
            );
        }
        setSkipLinksVisible(false);
    };

    // Skip to navigation
    const skipToNavigation = () => {
        if (navigationRef.current) {
            focusManagement.focusElement(navigationRef.current, 'navigation');
        }
        setSkipLinksVisible(false);
    };

    // Utility functions
    const getStatusColor = (status: EventStatus) => {
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
        switch (status) {
            case 1:
                return 'Published';
            case 0:
                return 'Draft';
            case 2:
                return 'Cancelled';
            case 3:
                return 'Completed';
            default:
                return 'Unknown';
        }
    };

    const getTimeRangeLabel = (range: string) => {
        switch (range) {
            case '7d':
                return 'Last 7 days';
            case '30d':
                return 'Last 30 days';
            case '90d':
                return 'Last 90 days';
            case '1y':
                return 'Last year';
            default:
                return range;
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
            } ${className}`}
            {...getAriaAttributes('Dashboard page', 'dashboard-main')}
        >
            {/* Screen reader announcements */}
            <div
                ref={screenReader.politeRef}
                aria-live='polite'
                aria-atomic='true'
                className='sr-only'
            />
            <div
                ref={screenReader.assertiveRef}
                aria-live='assertive'
                aria-atomic='true'
                className='sr-only'
            />

            {/* Skip links */}
            <div
                ref={skipLinksRef}
                className={`fixed left-4 top-4 z-50 space-y-2 ${
                    skipLinksVisible ? 'block' : 'sr-only'
                }`}
            >
                <button
                    onClick={skipToMainContent}
                    className='rounded-lg bg-revlr-primary-blue px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white'
                    {...createButtonProps(
                        'Skip to main content',
                        skipToMainContent
                    )}
                >
                    Skip to main content
                </button>
                <button
                    onClick={skipToNavigation}
                    className='rounded-lg bg-revlr-primary-blue px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white'
                    {...createButtonProps(
                        'Skip to navigation',
                        skipToNavigation
                    )}
                >
                    Skip to navigation
                </button>
            </div>

            {/* Header Section */}
            <header
                ref={navigationRef}
                className={`${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                } border-b px-6 py-4`}
                role='banner'
                aria-label='Dashboard header'
            >
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='flex items-center gap-3'>
                            <div
                                className='flex size-12 items-center justify-center rounded-full bg-revlr-primary-blue text-white'
                                aria-hidden='true'
                            >
                                <User className='size-6' />
                            </div>
                            <div>
                                <h1
                                    className='font-inter text-2xl font-bold'
                                    id='dashboard-title'
                                >
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
                                    aria-describedby='dashboard-title'
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

                    <nav
                        className='flex items-center gap-3'
                        aria-label='Dashboard controls'
                    >
                        <label htmlFor='time-range-select' className='sr-only'>
                            Select time range for dashboard data
                        </label>
                        <select
                            id='time-range-select'
                            value={timeRange}
                            onChange={(e) =>
                                handleTimeRangeChange(e.target.value)
                            }
                            className={`rounded-lg border px-3 py-2 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                    : 'border-gray-300 bg-white text-gray-900'
                            }`}
                            aria-describedby='time-range-help'
                        >
                            <option value='7d'>Last 7 days</option>
                            <option value='30d'>Last 30 days</option>
                            <option value='90d'>Last 90 days</option>
                            <option value='1y'>Last year</option>
                        </select>
                        <div id='time-range-help' className='sr-only'>
                            Changes the time period for all dashboard statistics
                            and charts
                        </div>

                        <button
                            {...createButtonProps(
                                'Export dashboard data',
                                () => {},
                                {
                                    describedBy: 'export-help',
                                }
                            )}
                            className={`rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Download className='size-4' aria-hidden='true' />
                        </button>
                        <div id='export-help' className='sr-only'>
                            Download dashboard data as CSV or PDF
                        </div>

                        <button
                            {...createButtonProps(
                                'View notifications',
                                () => {},
                                {
                                    describedBy: 'notifications-help',
                                }
                            )}
                            className={`rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Bell className='size-4' aria-hidden='true' />
                        </button>
                        <div id='notifications-help' className='sr-only'>
                            View recent notifications and alerts
                        </div>

                        <button
                            {...createButtonProps(
                                'Refresh dashboard',
                                handleRefresh,
                                {
                                    disabled: loading,
                                    describedBy: 'refresh-help',
                                }
                            )}
                            className={`rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                            <RefreshCw
                                className={`size-4 ${loading ? 'animate-spin' : ''}`}
                                aria-hidden='true'
                            />
                        </button>
                        <div id='refresh-help' className='sr-only'>
                            Reload all dashboard data from the server
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main
                ref={mainContentRef}
                className='space-y-6 p-6'
                role='main'
                aria-labelledby='dashboard-title'
                tabIndex={-1}
            >
                {/* Enhanced Statistics Overview */}
                <section aria-label='Event Statistics Overview'>
                    <h2 className='sr-only'>Event Statistics Overview</h2>
                    <StatisticsOverview
                        eventStatistics={dashboardData?.statistics}
                        revenueStatistics={dashboardData?.revenue}
                        loading={loading}
                        error={error}
                    />
                </section>

                {/* Event Performance Analytics */}
                <section aria-label='Event Performance Analytics'>
                    <h2 className='sr-only'>Event Performance Analytics</h2>
                    <EventPerformanceAnalytics
                        timeRange={{
                            startDate:
                                timeRange === '7d'
                                    ? new Date(
                                          Date.now() - 7 * 24 * 60 * 60 * 1000
                                      ).toISOString()
                                    : timeRange === '30d'
                                      ? new Date(
                                            Date.now() -
                                                30 * 24 * 60 * 60 * 1000
                                        ).toISOString()
                                      : timeRange === '90d'
                                        ? new Date(
                                              Date.now() -
                                                  90 * 24 * 60 * 60 * 1000
                                          ).toISOString()
                                        : new Date(
                                              Date.now() -
                                                  365 * 24 * 60 * 60 * 1000
                                          ).toISOString(),
                            endDate: new Date().toISOString(),
                        }}
                        maxTopEvents={10}
                        showRecommendations={true}
                        showAlerts={true}
                    />
                </section>

                {/* Quick Actions */}
                <section aria-label='Quick Actions'>
                    <div
                        ref={quickActionsRef}
                        className={`rounded-xl border p-6 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                        role='region'
                        aria-label='Quick Actions Panel'
                    >
                        <h2
                            id='quick-actions-heading'
                            className='mb-4 font-inter text-lg font-semibold'
                        >
                            Quick Actions
                        </h2>
                        <ul
                            className='m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-4'
                            aria-label='Available quick actions'
                        >
                            {quickActions.map((action, index) => (
                                <li key={index}>
                                    <Link
                                        href={action.href}
                                        className={`block rounded-lg border p-4 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                                : 'border-gray-200 hover:border-revlr-primary-blue/50'
                                        }`}
                                        aria-describedby={`action-${index}-desc`}
                                        title={`${action.title} - ${action.description}${action.shortcut ? ` (${action.shortcut})` : ''}`}
                                    >
                                        <div
                                            className={`size-12 ${action.color} mb-3 flex items-center justify-center rounded-lg text-white`}
                                            aria-hidden='true'
                                        >
                                            {action.icon}
                                        </div>
                                        <h3 className='mb-1 font-inter font-semibold'>
                                            {action.title}
                                            {action.shortcut && (
                                                <span className='ml-2 text-xs opacity-70'>
                                                    ({action.shortcut})
                                                </span>
                                            )}
                                        </h3>
                                        <p
                                            id={`action-${index}-desc`}
                                            className={`font-inter text-sm ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            {action.description}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Recent Events and Activity */}
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                    {/* Recent Events */}
                    <section
                        className='lg:col-span-2'
                        aria-label='Recent Events List'
                    >
                        <div
                            className={`rounded-xl border p-6 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-white'
                            }`}
                            role='region'
                            aria-label='Recent Events Panel'
                        >
                            <div className='mb-4 flex items-center justify-between'>
                                <h2
                                    id='recent-events-heading'
                                    className='font-inter text-lg font-semibold'
                                >
                                    Recent Events
                                </h2>
                                <Link
                                    href='/dashboard/events'
                                    className='font-inter text-sm text-revlr-primary-blue hover:underline focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue focus:ring-offset-2'
                                    aria-describedby='view-all-events-desc'
                                >
                                    View all
                                </Link>
                                <div
                                    id='view-all-events-desc'
                                    className='sr-only'
                                >
                                    Navigate to the complete events list page
                                </div>
                            </div>

                            {loading ? (
                                <div
                                    className='space-y-4'
                                    aria-label='Loading recent events'
                                >
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className='flex items-center space-x-4'
                                            aria-hidden='true'
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
                                <div
                                    className='space-y-4'
                                    role='list'
                                    aria-label={`${dashboardData.recentEvents.length} recent events`}
                                >
                                    {dashboardData.recentEvents
                                        .slice(0, 5)
                                        .map((event, index) => (
                                            <div
                                                key={event.id}
                                                className='flex items-center justify-between rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-revlr-primary-blue hover:bg-gray-50 dark:hover:bg-revlr-dark-border'
                                                role='listitem'
                                                aria-labelledby={`event-${index}-title`}
                                                aria-describedby={`event-${index}-details`}
                                            >
                                                <div className='flex items-center space-x-4'>
                                                    <div
                                                        className='flex size-12 items-center justify-center rounded-lg bg-revlr-primary-blue/10'
                                                        aria-hidden='true'
                                                    >
                                                        <Calendar className='size-6 text-revlr-primary-blue' />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            id={`event-${index}-title`}
                                                            className='font-inter font-semibold'
                                                        >
                                                            {event.title}
                                                        </h3>
                                                        <p
                                                            id={`event-${index}-details`}
                                                            className={`font-inter text-sm ${
                                                                theme === 'dark'
                                                                    ? 'text-gray-400'
                                                                    : 'text-gray-600'
                                                            }`}
                                                        >
                                                            {formatDate(
                                                                event.startDate
                                                            )}{' '}
                                                            •{' '}
                                                            {getStatusLabel(
                                                                event.status
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className='flex items-center space-x-2'>
                                                    <span
                                                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                                            event.status
                                                        )}`}
                                                        aria-label={`Event status: ${getStatusLabel(event.status)}`}
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
                                <div
                                    className='flex flex-col items-center justify-center py-12'
                                    role='status'
                                    aria-label='No recent events available'
                                >
                                    <Calendar
                                        className='mb-4 size-12 text-gray-400'
                                        aria-hidden='true'
                                    />
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
                                        className='rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter text-sm text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                    >
                                        Create Event
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Sidebar with additional info */}
                    <aside className='space-y-6' aria-label='Dashboard sidebar'>
                        {/* Pending Payouts */}
                        <section aria-label='Pending Payouts'>
                            <div
                                className={`rounded-xl border p-6 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                }`}
                                role='region'
                                aria-label='Pending Payouts Panel'
                            >
                                <div className='mb-4 flex items-center justify-between'>
                                    <h2
                                        id='payouts-heading'
                                        className='font-inter text-lg font-semibold'
                                    >
                                        Pending Payouts
                                    </h2>
                                    <Link
                                        href='/dashboard/payment/payout-management'
                                        className='font-inter text-sm text-revlr-primary-blue hover:underline focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue focus:ring-offset-2'
                                    >
                                        View all
                                    </Link>
                                </div>

                                <div
                                    className='flex flex-col items-center justify-center py-12'
                                    role='status'
                                    aria-label='No pending payouts'
                                >
                                    <DollarSign
                                        className='mb-4 size-12 text-gray-400'
                                        aria-hidden='true'
                                    />
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
                            </div>
                        </section>

                        {/* Recent Activity */}
                        <section aria-label='Recent Activity'>
                            <div
                                className={`rounded-xl border p-6 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                }`}
                                role='region'
                                aria-label='Recent Activity Panel'
                            >
                                <h2
                                    id='activity-heading'
                                    className='mb-4 font-inter text-lg font-semibold'
                                >
                                    Recent Activity
                                </h2>
                                <div
                                    className='space-y-4'
                                    role='list'
                                    aria-label='Recent activity items'
                                >
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className='flex items-center space-x-3'
                                            role='listitem'
                                        >
                                            <div
                                                className='flex size-8 items-center justify-center rounded-full bg-revlr-primary-blue/10'
                                                aria-hidden='true'
                                            >
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
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default AccessibleDashboard;

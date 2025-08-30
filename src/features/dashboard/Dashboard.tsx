'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizerDashboard } from '../../hooks/useOrganizerDashboard';
import { useOrganizerRealtime } from '../../hooks/useOrganizerRealtime';
import { useMobileOptimizations } from '../../hooks/useMobileOptimizations';
import { usePerformanceTracking } from '../../hooks/usePerformanceTracking';
import { EventStatus } from '../../lib/api';
import Link from 'next/link';
import {
    Calendar,
    DollarSign,
    Users,
    TrendingUp,
    Eye,
    Star,
    Plus,
    Download,
    Bell,
    User,
    BarChart3,
    Table,
    CreditCard,
    Sliders,
} from 'lucide-react';
import { Skeleton, CardSkeleton } from '../../components/LoadingStates';
import {
    MobileDashboardSkeleton,
    PullToRefreshIndicator,
} from '../../components/MobileLoadingStates';
import StatisticsOverview from '../../components/StatisticsOverview';
import EventPerformanceAnalytics from '../../components/EventPerformanceAnalytics';
import MobileDashboardLayout from '../../components/MobileDashboardLayout';
import { DashboardErrorBoundary } from '../../components/error-handling/DashboardErrorBoundary';
import { ApiErrorFallback } from '../../components/error-handling/ApiErrorFallback';
import { OfflineIndicator } from '../../components/error-handling/OfflineIndicator';
import { RealtimeConnectionStatus } from '../../components/RealtimeConnectionStatus';
import { OrganizerNotificationCenter } from '../../components/OrganizerNotificationCenter';

// Lazy load heavy components for better performance
const EventTable = lazy(() => import('../../components/EventTable'));
const RegistrationManagement = lazy(
    () => import('../../components/RegistrationManagement')
);
const RevenueReporting = lazy(
    () => import('../../components/RevenueReporting')
);
const DashboardCustomizer = lazy(
    () => import('../../components/DashboardCustomizer')
);
const AttendeeAnalytics = lazy(
    () => import('../../components/AttendeeAnalytics')
);

// Feature flags for gradual rollout
const FEATURE_FLAGS = {
    enhancedEventTable:
        process.env.NEXT_PUBLIC_FEATURE_ENHANCED_EVENT_TABLE === 'true',
    registrationManagement:
        process.env.NEXT_PUBLIC_FEATURE_REGISTRATION_MANAGEMENT === 'true',
    revenueReporting:
        process.env.NEXT_PUBLIC_FEATURE_REVENUE_REPORTING === 'true',
    dashboardCustomization:
        process.env.NEXT_PUBLIC_FEATURE_DASHBOARD_CUSTOMIZATION === 'true',
    attendeeAnalytics:
        process.env.NEXT_PUBLIC_FEATURE_ATTENDEE_ANALYTICS === 'true',
    realtimeUpdates:
        process.env.NEXT_PUBLIC_FEATURE_REALTIME_UPDATES === 'true',
};

interface QuickAction {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
    onClick?: () => void;
}

const Dashboard = () => {
    const { theme } = useTheme();
    const { user } = useAuthStore();
    const [timeRange, setTimeRange] = useState('30d');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
        new Set()
    );
    const [activeTab, setActiveTab] = useState('overview');
    const [showCustomizer, setShowCustomizer] = useState(false);

    // Performance tracking
    const { trackPageView, trackUserAction, trackPerformanceMetric } =
        usePerformanceTracking();

    // Mobile optimizations
    const {
        isMobile,
        setupPullToRefresh,
        pullToRefreshState,
        getResponsiveValue,
    } = useMobileOptimizations({
        enablePullToRefresh: true,
        enableSwipeNavigation: true,
        enableTouchFeedback: true,
    });

    // Use real API data instead of mock data
    const {
        data: dashboardData,
        loading,
        error,
        refetch,
    } = useOrganizerDashboard();

    // Real-time updates
    const { connectionStatus, notifications, clearNotification, isConnected } =
        useOrganizerRealtime({
            enabled: FEATURE_FLAGS.realtimeUpdates,
            onNewRegistration: (data) => {
                trackUserAction('realtime_registration_received', {
                    eventId: data.eventId,
                });
            },
            onRevenueUpdate: (data) => {
                trackUserAction('realtime_revenue_update', {
                    amount: data.amount,
                });
            },
        });

    // Setup pull-to-refresh for mobile
    useEffect(() => {
        if (isMobile) {
            const container = document.getElementById('dashboard-container');
            if (container) {
                return setupPullToRefresh(container, async () => {
                    await refetch();
                });
            }
        }
    }, [isMobile, setupPullToRefresh, refetch]);

    // Track page view and performance
    useEffect(() => {
        trackPageView('organizer_dashboard');

        // Track initial load performance (only in browser environment)
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'navigation') {
                            trackPerformanceMetric(
                                'dashboard_load_time',
                                entry.loadEventEnd - entry.loadEventStart
                            );
                        }
                    });
                });
                observer.observe({ entryTypes: ['navigation'] });

                return () => observer.disconnect();
            } catch (error) {
                console.warn('Performance observer not supported:', error);
            }
        }
    }, [trackPageView, trackPerformanceMetric]);

    // Track tab changes
    useEffect(() => {
        if (activeTab !== 'overview') {
            trackUserAction('dashboard_tab_change', { tab: activeTab });
        }
    }, [activeTab, trackUserAction]);

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
            href: '#',
            color: 'bg-revlr-accent-purple',
            onClick: () => setActiveTab('analytics'),
        },
        {
            title: 'Manage Events',
            description: 'View and manage all events',
            icon: <Table className='size-6' />,
            href: '#',
            color: 'bg-revlr-accent-green',
            onClick: () => setActiveTab('events'),
        },
        {
            title: 'Revenue Reports',
            description: 'View financial performance',
            icon: <CreditCard className='size-6' />,
            href: '#',
            color: 'bg-revlr-accent-orange',
            onClick: () => setActiveTab('revenue'),
        },
        {
            title: 'Registrations',
            description: 'Manage attendee registrations',
            icon: <Users className='size-6' />,
            href: '#',
            color: 'bg-purple-600',
            onClick: () => setActiveTab('registrations'),
        },
        {
            title: 'Customize Dashboard',
            description: 'Personalize your dashboard',
            icon: <Sliders className='size-6' />,
            href: '#',
            color: 'bg-indigo-600',
            onClick: () => setShowCustomizer(true),
        },
    ];

    // Dashboard tabs configuration
    const dashboardTabs = [
        { id: 'overview', label: 'Overview', icon: <Eye className='size-4' /> },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className='size-4' />,
        },
        {
            id: 'events',
            label: 'Events',
            icon: <Calendar className='size-4' />,
        },
        {
            id: 'registrations',
            label: 'Registrations',
            icon: <Users className='size-4' />,
        },
        {
            id: 'revenue',
            label: 'Revenue',
            icon: <DollarSign className='size-4' />,
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Handle section collapse/expand for mobile
    const handleSectionToggle = (sectionId: string) => {
        setCollapsedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    // Enhanced tab content renderer with lazy loading
    const renderTabContent = () => {
        const commonProps = {
            timeRange: {
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
            },
            loading,
            error,
            onRefresh: refetch,
        };

        switch (activeTab) {
            case 'overview':
                return (
                    <div className='space-y-6'>
                        <StatisticsOverview
                            eventStatistics={dashboardData?.statistics}
                            revenueStatistics={dashboardData?.revenue}
                            loading={loading}
                            error={error?.message || null}
                        />
                        <EventPerformanceAnalytics
                            {...commonProps}
                            maxTopEvents={isMobile ? 5 : 10}
                            showRecommendations={!isMobile}
                            showAlerts={true}
                        />
                    </div>
                );

            case 'analytics':
                return (
                    <Suspense fallback={<CardSkeleton />}>
                        <EventPerformanceAnalytics
                            {...commonProps}
                            maxTopEvents={20}
                            showRecommendations={true}
                            showAlerts={true}
                            detailed={true}
                        />
                        {FEATURE_FLAGS.attendeeAnalytics && (
                            <AttendeeAnalytics {...commonProps} />
                        )}
                    </Suspense>
                );

            case 'events':
                return (
                    <Suspense fallback={<CardSkeleton />}>
                        <EventTable
                            {...commonProps}
                            enableBulkActions={true}
                            enableInlineEditing={true}
                            enableExport={true}
                        />
                    </Suspense>
                );

            case 'registrations':
                return FEATURE_FLAGS.registrationManagement ? (
                    <Suspense fallback={<CardSkeleton />}>
                        <RegistrationManagement
                            {...commonProps}
                            enableExport={true}
                            enableFiltering={true}
                        />
                    </Suspense>
                ) : (
                    <div className='py-12 text-center'>
                        <Users className='mx-auto mb-4 size-12 text-gray-400' />
                        <h3 className='mb-2 text-lg font-semibold'>
                            Registration Management
                        </h3>
                        <p className='text-gray-600 dark:text-gray-400'>
                            This feature is currently being rolled out. Please
                            check back soon.
                        </p>
                    </div>
                );

            case 'revenue':
                return FEATURE_FLAGS.revenueReporting ? (
                    <Suspense fallback={<CardSkeleton />}>
                        <RevenueReporting
                            {...commonProps}
                            enableCustomReports={true}
                            enableExport={true}
                        />
                    </Suspense>
                ) : (
                    <div className='py-12 text-center'>
                        <DollarSign className='mx-auto mb-4 size-12 text-gray-400' />
                        <h3 className='mb-2 text-lg font-semibold'>
                            Revenue Reporting
                        </h3>
                        <p className='text-gray-600 dark:text-gray-400'>
                            This feature is currently being rolled out. Please
                            check back soon.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    // Mobile dashboard sections configuration
    const mobileDashboardSections = [
        {
            id: 'statistics',
            title: 'Statistics Overview',
            icon: <TrendingUp className='size-5' />,
            isCollapsible: true,
            isCollapsed: collapsedSections.has('statistics'),
            priority: 'high' as const,
            children: (
                <StatisticsOverview
                    eventStatistics={dashboardData?.statistics}
                    revenueStatistics={dashboardData?.revenue}
                    loading={loading}
                    error={error?.message || null}
                />
            ),
        },
        {
            id: 'analytics',
            title: 'Performance Analytics',
            icon: <BarChart3 className='size-5' />,
            isCollapsible: true,
            isCollapsed: collapsedSections.has('analytics'),
            priority: 'high' as const,
            children: (
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
                    maxTopEvents={isMobile ? 5 : 10}
                    showRecommendations={!isMobile}
                    showAlerts={true}
                />
            ),
        },
        {
            id: 'quick-actions',
            title: 'Quick Actions',
            icon: <Plus className='size-5' />,
            isCollapsible: false,
            isCollapsed: false,
            priority: 'medium' as const,
            children: (
                <div
                    className={`grid ${getResponsiveValue('grid-cols-2', 'grid-cols-3', 'grid-cols-4')} gap-4`}
                >
                    {quickActions
                        .slice(0, isMobile ? 4 : 6)
                        .map((action, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    if (action.onClick) {
                                        action.onClick();
                                    } else if (action.href !== '#') {
                                        window.location.href = action.href;
                                    }
                                    trackUserAction('quick_action_click', {
                                        action: action.title,
                                    });
                                }}
                                className={`rounded-lg border p-4 text-left transition-all duration-200 hover:shadow-lg ${
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
                                <h3 className='mb-1 font-inter text-sm font-semibold'>
                                    {action.title}
                                </h3>
                                <p
                                    className={`font-inter text-xs ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {action.description}
                                </p>
                            </button>
                        ))}
                </div>
            ),
        },
        {
            id: 'recent-events',
            title: 'Recent Events',
            icon: <Calendar className='size-5' />,
            isCollapsible: true,
            isCollapsed: collapsedSections.has('recent-events'),
            priority: 'medium' as const,
            children: (
                <div>
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
                                        <Skeleton width='w-3/4' height='h-4' />
                                        <Skeleton width='w-1/2' height='h-3' />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : dashboardData?.recentEvents &&
                      dashboardData.recentEvents.length > 0 ? (
                        <div className='space-y-4'>
                            {dashboardData.recentEvents
                                .slice(0, isMobile ? 3 : 5)
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
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(event.status)}`}
                                            >
                                                {getStatusLabel(event.status)}
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
            ),
        },
    ];

    // Show mobile loading skeleton
    if (loading && isMobile) {
        return <MobileDashboardSkeleton />;
    }

    // Mobile layout
    if (isMobile) {
        return (
            <div
                id='dashboard-container'
                className={`min-h-screen transition-colors duration-200 ${
                    theme === 'dark'
                        ? 'bg-revlr-dark-bg text-white'
                        : 'bg-gray-50 text-gray-900'
                }`}
            >
                {/* Pull to refresh indicator */}
                <PullToRefreshIndicator
                    isVisible={
                        pullToRefreshState.isPulling ||
                        pullToRefreshState.isRefreshing
                    }
                    isLoading={pullToRefreshState.isRefreshing}
                    progress={pullToRefreshState.pullDistance / 100}
                />

                {/* Offline Indicator */}
                <OfflineIndicator
                    className='mx-4 mt-4'
                    onRetryConnection={refetch}
                />

                {/* Mobile Dashboard Layout */}
                <MobileDashboardLayout
                    sections={mobileDashboardSections}
                    onSectionToggle={handleSectionToggle}
                    showSearch={false}
                    showFilters={false}
                />
            </div>
        );
    }

    // Desktop/Tablet layout
    return (
        <div
            id='dashboard-container'
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

            {/* Real-time Connection Status */}
            {FEATURE_FLAGS.realtimeUpdates && (
                <RealtimeConnectionStatus
                    connectionStatus={connectionStatus}
                    isConnected={isConnected}
                    className='mx-6 mt-2'
                />
            )}

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
                            onChange={(e) => {
                                setTimeRange(e.target.value);
                                trackUserAction('time_range_change', {
                                    range: e.target.value,
                                });
                            }}
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
                            onClick={() => {
                                trackUserAction('export_dashboard_data');
                                // TODO: Implement dashboard export
                            }}
                            className={`rounded-lg border p-2 transition-colors ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                            title='Export Dashboard Data'
                        >
                            <Download className='size-4' />
                        </button>

                        {FEATURE_FLAGS.realtimeUpdates && (
                            <OrganizerNotificationCenter
                                notifications={notifications}
                                onClearNotification={clearNotification}
                                trigger={
                                    <button
                                        className={`relative rounded-lg border p-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                                : 'border-gray-300 bg-white hover:bg-gray-50'
                                        }`}
                                        title='Notifications'
                                    >
                                        <Bell className='size-4' />
                                        {notifications.length > 0 && (
                                            <span className='absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs text-white'>
                                                {notifications.length}
                                            </span>
                                        )}
                                    </button>
                                }
                            />
                        )}

                        {FEATURE_FLAGS.dashboardCustomization && (
                            <button
                                onClick={() => {
                                    setShowCustomizer(true);
                                    trackUserAction(
                                        'open_dashboard_customizer'
                                    );
                                }}
                                className={`rounded-lg border p-2 transition-colors ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                        : 'border-gray-300 bg-white hover:bg-gray-50'
                                }`}
                                title='Customize Dashboard'
                            >
                                <Sliders className='size-4' />
                            </button>
                        )}
                    </div>
                </div>

                {/* Enhanced Tab Navigation */}
                <div className='mt-4 border-b border-gray-200 dark:border-revlr-dark-border'>
                    <nav className='-mb-px flex space-x-8'>
                        {dashboardTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    trackUserAction('dashboard_tab_click', {
                                        tab: tab.id,
                                    });
                                }}
                                className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-revlr-primary-blue text-revlr-primary-blue'
                                        : theme === 'dark'
                                          ? 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'
                                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className='p-6'>
                {/* Enhanced Tab Content */}
                <DashboardErrorBoundary
                    section={`Dashboard ${activeTab}`}
                    onRetry={refetch}
                    fallback={renderApiErrorFallback(`${activeTab} content`)}
                >
                    {renderTabContent()}
                </DashboardErrorBoundary>

                {/* Quick Actions - Only show on overview tab */}
                {activeTab === 'overview' && (
                    <div
                        className={`mt-6 rounded-xl border p-6 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <h2 className='mb-4 font-inter text-lg font-semibold'>
                            Quick Actions
                        </h2>
                        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (action.onClick) {
                                            action.onClick();
                                        } else if (action.href !== '#') {
                                            window.location.href = action.href;
                                        }
                                        trackUserAction('quick_action_click', {
                                            action: action.title,
                                        });
                                    }}
                                    className={`rounded-lg border p-4 text-left transition-all duration-200 hover:shadow-lg ${
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
                                    <h3 className='mb-1 font-inter text-sm font-semibold'>
                                        {action.title}
                                    </h3>
                                    <p
                                        className={`font-inter text-xs ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {action.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

                {/* Dashboard Customizer Modal */}
                {FEATURE_FLAGS.dashboardCustomization && showCustomizer && (
                    <Suspense fallback={<div>Loading customizer...</div>}>
                        <DashboardCustomizer
                            isOpen={showCustomizer}
                            onClose={() => setShowCustomizer(false)}
                            onSave={(config) => {
                                trackUserAction(
                                    'dashboard_customization_saved',
                                    { config }
                                );
                                setShowCustomizer(false);
                            }}
                        />
                    </Suspense>
                )}
            </div>
        </div>
    );
};

export default Dashboard;

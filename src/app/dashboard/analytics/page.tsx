'use client';

import { Suspense, useState } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { CardSkeleton } from '@/components/LoadingStates';
import EventPerformanceAnalytics from '@/components/EventPerformanceAnalytics';
import AttendeeAnalytics from '@/components/AttendeeAnalytics';
import { useOrganizerDashboard } from '@/hooks/useOrganizerDashboard';
import { BarChart3 } from 'lucide-react';

// Feature flags for gradual rollout
const FEATURE_FLAGS = {
    attendeeAnalytics:
        process.env.NEXT_PUBLIC_FEATURE_ATTENDEE_ANALYTICS === 'true',
};

const AnalyticsPage = () => {
    const { theme } = useTheme();
    const [timeRange, setTimeRange] = useState('30d');

    // Use the same data source as the dashboard
    const {
        data: dashboardData,
        loading,
        error,
        refetch,
    } = useOrganizerDashboard();

    // Common props for analytics components
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
                } border-b px-6 py-6`}
            >
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        <div className='flex size-12 items-center justify-center rounded-full bg-revlr-primary-blue text-white'>
                            <BarChart3 className='size-6' />
                        </div>
                        <div>
                            <h1 className='font-inter text-2xl font-bold'>
                                Analytics Dashboard
                            </h1>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Comprehensive event performance insights and
                                analytics
                            </p>
                        </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className='flex items-center gap-2'>
                        {['7d', '30d', '90d', '1y'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    timeRange === range
                                        ? 'bg-revlr-primary-blue text-white'
                                        : theme === 'dark'
                                          ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {range === '7d'
                                    ? '7 Days'
                                    : range === '30d'
                                      ? '30 Days'
                                      : range === '90d'
                                        ? '90 Days'
                                        : '1 Year'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className='p-6'>
                <div className='space-y-6'>
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
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;

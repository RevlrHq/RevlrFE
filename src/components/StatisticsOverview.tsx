'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { useMobileOptimizations } from '../hooks/useMobileOptimizations';
import {
    Calendar,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    Eye,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { EventStatistics, RevenueStatistics } from '../lib/api';
import { Skeleton } from './LoadingStates';

interface StatisticsOverviewProps {
    eventStatistics?: EventStatistics | null;
    revenueStatistics?: RevenueStatistics | null;
    loading?: boolean;
    error?: string | null;
    className?: string;
}

interface StatisticCardProps {
    title: string;
    value: number;
    previousValue?: number;
    icon: React.ReactNode;
    color: string;
    formatValue?: (value: number) => string;
    loading?: boolean;
    ariaLabel?: string;
    isMobile?: boolean;
}

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    formatValue?: (value: number) => string;
}

// Animated counter component with accessibility support
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    value,
    duration = 1000,
    formatValue = (val) => val.toLocaleString(),
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        // Skip animation in test environment
        if (process.env.NODE_ENV === 'test') {
            setDisplayValue(value);
            return;
        }

        if (value === displayValue) return;

        setIsAnimating(true);
        const startValue = displayValue;
        const difference = value - startValue;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.round(
                startValue + difference * easeOutQuart
            );

            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration, displayValue]);

    return (
        <span
            className={`transition-all duration-200 ${isAnimating ? 'text-revlr-primary-blue' : ''}`}
            aria-live='polite'
            aria-atomic='true'
        >
            {formatValue(displayValue)}
        </span>
    );
};

// Trend indicator component with accessibility
const TrendIndicator: React.FC<{
    current: number;
    previous?: number;
    className?: string;
}> = ({ current, previous, className = '' }) => {
    if (!previous || previous === 0) {
        return null;
    }

    const percentageChange = ((current - previous) / previous) * 100;
    const isPositive = percentageChange >= 0;
    const isSignificant = Math.abs(percentageChange) >= 0.1; // Only show if change is >= 0.1%

    if (!isSignificant) {
        return (
            <div className={`flex items-center text-sm ${className}`}>
                <span className='text-gray-500'>No change</span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center text-sm ${className}`}
            role='status'
            aria-label={`${isPositive ? 'Increase' : 'Decrease'} of ${Math.abs(percentageChange).toFixed(1)}% compared to previous period`}
        >
            {isPositive ? (
                <ArrowUpRight
                    className='mr-1 size-4 text-green-500'
                    aria-hidden='true'
                />
            ) : (
                <ArrowDownRight
                    className='mr-1 size-4 text-red-500'
                    aria-hidden='true'
                />
            )}
            <span
                className={`font-medium ${
                    isPositive ? 'text-green-500' : 'text-red-500'
                }`}
            >
                {isPositive ? '+' : ''}
                {percentageChange.toFixed(1)}%
            </span>
        </div>
    );
};

// Individual statistic card component
const StatisticCard: React.FC<StatisticCardProps> = ({
    title,
    value,
    previousValue,
    icon,
    color,
    formatValue = (val) => val.toLocaleString(),
    loading = false,
    ariaLabel,
    isMobile = false,
}) => {
    const { theme } = useTheme();

    if (loading) {
        return (
            <div
                className={`rounded-xl border p-6 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div className='space-y-2'>
                            <Skeleton width='w-24' height='h-4' />
                            <Skeleton width='w-20' height='h-8' />
                        </div>
                        <Skeleton width='w-12' height='h-12' rounded />
                    </div>
                    <Skeleton width='w-32' height='h-4' />
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl border ${isMobile ? 'p-4' : 'p-6'} transition-all duration-200 focus-within:ring-2 focus-within:ring-revlr-primary-blue hover:shadow-lg ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:border-revlr-primary-blue/30'
                    : 'border-gray-200 bg-white hover:border-revlr-primary-blue/30'
            }`}
            role='region'
            aria-label={ariaLabel || `${title} statistics`}
            tabIndex={0}
        >
            <div className='flex items-center justify-between'>
                <div>
                    <p
                        className={`font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                        id={`${title.replace(/\s+/g, '-').toLowerCase()}-label`}
                    >
                        {title}
                    </p>
                    <p
                        className={`mt-1 font-inter ${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}
                        aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-label`}
                        role='status'
                        aria-live='polite'
                    >
                        <AnimatedCounter
                            value={value}
                            formatValue={formatValue}
                        />
                    </p>
                </div>
                <div
                    className={`rounded-lg ${color}/10 ${isMobile ? 'p-2' : 'p-3'}`}
                    aria-hidden='true'
                >
                    <div
                        className={`${isMobile ? 'size-5' : 'size-6'} ${color.replace('/10', '')}`}
                    >
                        {icon}
                    </div>
                </div>
            </div>
            <div className='mt-4'>
                <TrendIndicator
                    current={value}
                    previous={previousValue}
                    className={
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }
                />
            </div>
        </div>
    );
};

// Main StatisticsOverview component
export const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({
    eventStatistics,
    revenueStatistics,
    loading = false,
    error = null,
    className = '',
}) => {
    const { theme } = useTheme();
    const { isMobile, getResponsiveValue } = useMobileOptimizations();

    // Format currency values
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Error state
    if (error && !loading) {
        return (
            <div
                className={`rounded-xl border p-6 ${
                    theme === 'dark'
                        ? 'border-red-800 bg-red-900/20'
                        : 'border-red-200 bg-red-50'
                } ${className}`}
                role='alert'
                aria-live='polite'
            >
                <div className='flex items-center space-x-3'>
                    <TrendingDown
                        className='size-6 text-red-500'
                        aria-hidden='true'
                    />
                    <div>
                        <h3 className='font-inter font-semibold text-red-800 dark:text-red-400'>
                            Failed to load statistics
                        </h3>
                        <p className='font-inter text-sm text-red-600 dark:text-red-300'>
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate previous month revenue for trend calculation
    const currentMonthRevenue = revenueStatistics?.thisMonthRevenue || 0;
    const previousMonthRevenue = revenueStatistics?.lastMonthRevenue || 0;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Statistics Grid */}
            <div
                className={`grid gap-4 ${getResponsiveValue(
                    'grid-cols-2', // Mobile: 2 columns
                    'grid-cols-3', // Tablet: 3 columns
                    'grid-cols-4' // Desktop: 4 columns
                )}`}
                role='region'
                aria-label='Event and revenue statistics overview'
            >
                {/* Total Events */}
                <StatisticCard
                    title='Total Events'
                    value={eventStatistics?.totalEvents || 0}
                    icon={<Calendar className='size-6' />}
                    color='text-revlr-primary-blue bg-revlr-primary-blue'
                    loading={loading}
                    ariaLabel='Total number of events created'
                    isMobile={isMobile}
                />

                {/* Published Events */}
                <StatisticCard
                    title='Published Events'
                    value={eventStatistics?.publishedEvents || 0}
                    previousValue={
                        eventStatistics?.totalEvents
                            ? eventStatistics.totalEvents -
                              (eventStatistics.publishedEvents || 0)
                            : undefined
                    }
                    icon={<Eye className='size-6' />}
                    color='text-revlr-accent-green bg-revlr-accent-green'
                    loading={loading}
                    ariaLabel='Number of published events'
                    isMobile={isMobile}
                />

                {/* Total Revenue */}
                <StatisticCard
                    title='Total Revenue'
                    value={revenueStatistics?.totalRevenue || 0}
                    previousValue={previousMonthRevenue}
                    icon={<DollarSign className='size-6' />}
                    color='text-revlr-accent-purple bg-revlr-accent-purple'
                    formatValue={formatCurrency}
                    loading={loading}
                    ariaLabel='Total revenue generated from events'
                    isMobile={isMobile}
                />

                {/* Total Attendees */}
                <StatisticCard
                    title='Total Attendees'
                    value={eventStatistics?.totalAttendees || 0}
                    icon={<Users className='size-6' />}
                    color='text-revlr-accent-orange bg-revlr-accent-orange'
                    loading={loading}
                    ariaLabel='Total number of event attendees'
                    isMobile={isMobile}
                />
            </div>

            {/* Additional Metrics Row */}
            <div
                className={`grid gap-4 ${getResponsiveValue(
                    'grid-cols-1', // Mobile: 1 column for additional metrics
                    'grid-cols-2', // Tablet: 2 columns
                    'grid-cols-3' // Desktop: 3 columns
                )}`}
                role='region'
                aria-label='Additional event statistics'
            >
                {/* Draft Events */}
                <StatisticCard
                    title='Draft Events'
                    value={eventStatistics?.draftEvents || 0}
                    icon={<Clock className='size-6' />}
                    color='text-yellow-500 bg-yellow-500'
                    loading={loading}
                    ariaLabel='Number of draft events'
                    isMobile={isMobile}
                />

                {/* This Month Revenue */}
                <StatisticCard
                    title='This Month Revenue'
                    value={currentMonthRevenue}
                    previousValue={previousMonthRevenue}
                    icon={<TrendingUp className='size-6' />}
                    color='text-green-500 bg-green-500'
                    formatValue={formatCurrency}
                    loading={loading}
                    ariaLabel='Revenue generated this month'
                    isMobile={isMobile}
                />

                {/* Total Registrations */}
                <StatisticCard
                    title='Total Registrations'
                    value={eventStatistics?.totalRegistrations || 0}
                    icon={<Users className='size-6' />}
                    color='text-blue-500 bg-blue-500'
                    loading={loading}
                    ariaLabel='Total number of event registrations'
                    isMobile={isMobile}
                />
            </div>
        </div>
    );
};

export default StatisticsOverview;

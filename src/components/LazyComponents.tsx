'use client';

import React, { lazy, Suspense } from 'react';
import { ChartSkeleton } from './charts/ChartSkeleton';
import { Skeleton } from './ui/skeleton';

// Lazy load chart components
export const LazyRevenueChart = lazy(() =>
    import('./charts/RevenueChart').then((module) => ({
        default: module.RevenueChart,
    }))
);

export const LazyEventPerformanceChart = lazy(() =>
    import('./charts/EventPerformanceChart').then((module) => ({
        default: module.EventPerformanceChart,
    }))
);

export const LazyAttendeeAnalyticsChart = lazy(() =>
    import('./charts/AttendeeAnalyticsChart').then((module) => ({
        default: module.AttendeeAnalyticsChart,
    }))
);

// Lazy load heavy dashboard components
export const LazyEnhancedEventTable = lazy(() =>
    import('./EnhancedEventTable').then((module) => ({
        default: module.default,
    }))
);

export const LazyRegistrationManagement = lazy(() =>
    import('./RegistrationManagement').then((module) => ({
        default: module.default,
    }))
);

export const LazyEventPerformanceAnalytics = lazy(() =>
    import('./EventPerformanceAnalytics').then((module) => ({
        default: module.default,
    }))
);

export const LazyRevenueReporting = lazy(() =>
    import('./RevenueReporting').then((module) => ({ default: module.default }))
);

export const LazyAttendeeAnalytics = lazy(() =>
    import('./AttendeeAnalytics').then((module) => ({
        default: module.default,
    }))
);

// Wrapper components with suspense and error boundaries
interface LazyComponentWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
}

class LazyErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: {
        children: React.ReactNode;
        fallback?: React.ReactNode;
    }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Lazy component loading error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div className='p-4 text-center'>
                        <p className='text-gray-500 dark:text-gray-400'>
                            Failed to load component. Please try refreshing the
                            page.
                        </p>
                    </div>
                )
            );
        }

        return this.props.children;
    }
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
    children,
    fallback,
    errorFallback,
}) => (
    <LazyErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback || <ChartSkeleton />}>{children}</Suspense>
    </LazyErrorBoundary>
);

// Chart wrapper with lazy loading
interface LazyChartWrapperProps {
    children: React.ReactNode;
    height?: number;
}

export const LazyChartWrapper: React.FC<LazyChartWrapperProps> = ({
    children,
    height = 300,
}) => (
    <LazyErrorBoundary
        fallback={
            <div className='p-4 text-center'>
                <p className='text-red-500'>Failed to load chart</p>
            </div>
        }
    >
        <Suspense fallback={<ChartSkeleton height={height} />}>
            {children}
        </Suspense>
    </LazyErrorBoundary>
);

// Table wrapper with lazy loading
export const LazyTableWrapper: React.FC<LazyComponentWrapperProps> = ({
    children,
    fallback,
    errorFallback,
}) => (
    <LazyErrorBoundary fallback={errorFallback}>
        <Suspense
            fallback={
                fallback || (
                    <div className='space-y-4'>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className='flex items-center space-x-4 rounded-lg border p-4'
                            >
                                <Skeleton className='h-4 w-4' />
                                <Skeleton className='h-16 w-16 rounded' />
                                <div className='flex-1 space-y-2'>
                                    <Skeleton className='h-4 w-3/4' />
                                    <Skeleton className='h-3 w-1/2' />
                                </div>
                                <Skeleton className='h-6 w-20' />
                                <Skeleton className='h-8 w-8' />
                            </div>
                        ))}
                    </div>
                )
            }
        >
            {children}
        </Suspense>
    </LazyErrorBoundary>
);

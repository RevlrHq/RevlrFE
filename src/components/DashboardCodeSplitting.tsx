'use client';

import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChartSkeleton } from './charts/ChartSkeleton';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Lazy load dashboard sections with proper chunk names
const LazyStatisticsOverview = lazy(() =>
    import('./StatisticsOverview').then((module) => ({
        default: module.default,
    }))
);

const LazyRevenueChart = lazy(() =>
    import('./charts/RevenueChart').then((module) => ({
        default: module.RevenueChart,
    }))
);

const LazyEventPerformanceChart = lazy(() =>
    import('./charts/EventPerformanceChart').then((module) => ({
        default: module.EventPerformanceChart,
    }))
);

const LazyAttendeeAnalyticsChart = lazy(() =>
    import('./charts/AttendeeAnalyticsChart').then((module) => ({
        default: module.AttendeeAnalyticsChart,
    }))
);

const LazyEnhancedEventTable = lazy(() =>
    import('./EnhancedEventTable').then((module) => ({
        default: module.default,
    }))
);

const LazyRegistrationManagement = lazy(() =>
    import('./RegistrationManagement').then((module) => ({
        default: module.default,
    }))
);

const LazyEventPerformanceAnalytics = lazy(() =>
    import('./EventPerformanceAnalytics').then((module) => ({
        default: module.default,
    }))
);

const LazyRevenueReporting = lazy(() =>
    import('./RevenueReporting').then((module) => ({
        default: module.default,
    }))
);

const LazyAttendeeAnalytics = lazy(() =>
    import('./AttendeeAnalytics').then((module) => ({
        default: module.default,
    }))
);

// Advanced lazy loading with preloading
const LazyVirtualizedEventTable = lazy(() =>
    import('./VirtualizedEventTable').then((module) => ({
        default: module.default,
    }))
);

const LazyVirtualizedRegistrationTable = lazy(() =>
    import('./VirtualizedRegistrationTable').then((module) => ({
        default: module.default,
    }))
);

// Error fallback component
interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
    componentName?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    componentName = 'Component',
}) => (
    <div className='flex flex-col items-center justify-center p-8 text-center'>
        <AlertTriangle className='mb-4 h-12 w-12 text-red-500' />
        <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
            Failed to load {componentName}
        </h3>
        <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
            {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={resetErrorBoundary} variant='outline' size='sm'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Try Again
        </Button>
    </div>
);

// Loading fallbacks for different component types
const StatisticsLoadingFallback = () => (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='rounded-lg border p-6'>
                <div className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-8 w-8 rounded' />
                </div>
                <Skeleton className='mt-2 h-8 w-24' />
                <Skeleton className='mt-1 h-3 w-16' />
            </div>
        ))}
    </div>
);

const TableLoadingFallback = () => (
    <div className='space-y-4'>
        <div className='flex items-center justify-between'>
            <Skeleton className='h-10 w-64' />
            <div className='flex gap-2'>
                <Skeleton className='h-10 w-20' />
                <Skeleton className='h-10 w-20' />
            </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
            <div
                key={i}
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
);

// Wrapper components with error boundaries and suspense
interface LazyWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    componentName?: string;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
    children,
    fallback,
    errorFallback,
    componentName = 'Component',
}) => (
    <ErrorBoundary
        FallbackComponent={(props) =>
            errorFallback || (
                <ErrorFallback {...props} componentName={componentName} />
            )
        }
        onError={(error, errorInfo) => {
            console.error(`Error in ${componentName}:`, error, errorInfo);
        }}
    >
        <Suspense fallback={fallback || <ChartSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
);

// Preloading utilities
export const preloadDashboardComponents = () => {
    // Preload critical components
    import('./StatisticsOverview');
    import('./charts/RevenueChart');

    // Preload secondary components after a delay
    setTimeout(() => {
        import('./EnhancedEventTable');
        import('./charts/EventPerformanceChart');
    }, 1000);

    // Preload heavy components after user interaction
    setTimeout(() => {
        import('./VirtualizedEventTable');
        import('./VirtualizedRegistrationTable');
        import('./EventPerformanceAnalytics');
    }, 3000);
};

// Hook for conditional preloading
export const useConditionalPreload = (
    condition: boolean,
    componentImports: (() => Promise<any>)[]
) => {
    React.useEffect(() => {
        if (condition) {
            componentImports.forEach((importFn) => {
                setTimeout(importFn, Math.random() * 1000); // Stagger the imports
            });
        }
    }, [condition, componentImports]);
};

// Exported lazy components with proper wrappers
export const LazyStatisticsOverviewWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<StatisticsLoadingFallback />}
        componentName='Statistics Overview'
    >
        <LazyStatisticsOverview {...props} />
    </LazyWrapper>
);

export const LazyRevenueChartWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<ChartSkeleton height={300} />}
        componentName='Revenue Chart'
    >
        <LazyRevenueChart {...props} />
    </LazyWrapper>
);

export const LazyEventPerformanceChartWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<ChartSkeleton height={300} />}
        componentName='Event Performance Chart'
    >
        <LazyEventPerformanceChart {...props} />
    </LazyWrapper>
);

export const LazyAttendeeAnalyticsChartWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<ChartSkeleton height={300} />}
        componentName='Attendee Analytics Chart'
    >
        <LazyAttendeeAnalyticsChart {...props} />
    </LazyWrapper>
);

export const LazyEnhancedEventTableWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<TableLoadingFallback />}
        componentName='Enhanced Event Table'
    >
        <LazyEnhancedEventTable {...props} />
    </LazyWrapper>
);

export const LazyRegistrationManagementWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<TableLoadingFallback />}
        componentName='Registration Management'
    >
        <LazyRegistrationManagement {...props} />
    </LazyWrapper>
);

export const LazyEventPerformanceAnalyticsWithWrapper: React.FC<any> = (
    props
) => (
    <LazyWrapper
        fallback={<ChartSkeleton height={400} />}
        componentName='Event Performance Analytics'
    >
        <LazyEventPerformanceAnalytics {...props} />
    </LazyWrapper>
);

export const LazyRevenueReportingWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<ChartSkeleton height={400} />}
        componentName='Revenue Reporting'
    >
        <LazyRevenueReporting {...props} />
    </LazyWrapper>
);

export const LazyAttendeeAnalyticsWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<ChartSkeleton height={300} />}
        componentName='Attendee Analytics'
    >
        <LazyAttendeeAnalytics {...props} />
    </LazyWrapper>
);

export const LazyVirtualizedEventTableWithWrapper: React.FC<any> = (props) => (
    <LazyWrapper
        fallback={<TableLoadingFallback />}
        componentName='Virtualized Event Table'
    >
        <LazyVirtualizedEventTable {...props} />
    </LazyWrapper>
);

export const LazyVirtualizedRegistrationTableWithWrapper: React.FC<any> = (
    props
) => (
    <LazyWrapper
        fallback={<TableLoadingFallback />}
        componentName='Virtualized Registration Table'
    >
        <LazyVirtualizedRegistrationTable {...props} />
    </LazyWrapper>
);

// Bundle analyzer helper (development only)
export const logBundleInfo = () => {
    if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard components loaded:', {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            connection:
                (navigator as any).connection?.effectiveType || 'unknown',
        });
    }
};

// Performance monitoring for lazy components
export const withPerformanceMonitoring = <P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
) => {
    return React.memo((props: P) => {
        const startTime = React.useRef<number>(0);

        React.useEffect(() => {
            startTime.current = performance.now();

            return () => {
                const endTime = performance.now();
                const loadTime = endTime - startTime.current;

                if (process.env.NODE_ENV === 'development') {
                    console.log(
                        `${componentName} load time: ${loadTime.toFixed(2)}ms`
                    );
                }

                // Send to analytics in production
                if (process.env.NODE_ENV === 'production' && loadTime > 1000) {
                    // Log slow component loads
                    console.warn(
                        `Slow component load: ${componentName} took ${loadTime.toFixed(2)}ms`
                    );
                }
            };
        }, []);

        return <Component {...props} />;
    });
};

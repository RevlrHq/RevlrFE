'use client';

import React, { lazy, Suspense, ComponentType } from 'react';
import { EventFormSkeleton } from './LoadingStates';

// Lazy load heavy components
export const LazyImageUpload = lazy(() =>
    import('./ImageUpload').then((module) => ({ default: module.ImageUpload }))
);

export const LazyTicketManagement = lazy(() =>
    import('./TicketManagement').then((module) => ({
        default: module.TicketManagement,
    }))
);

export const LazyLocationSelector = lazy(() =>
    import('./LocationSelector').then((module) => ({
        default: module.LocationSelector,
    }))
);

export const LazyOrganizerDetails = lazy(() =>
    import('./OrganizerDetails').then((module) => ({
        default: module.OrganizerDetails,
    }))
);

export const LazyDateTimeSelector = lazy(() =>
    import('./DateTimeSelector').then((module) => ({
        default: module.DateTimeSelector,
    }))
);

export const LazyPrePublishValidation = lazy(() =>
    import('./PrePublishValidation').then((module) => ({
        default: module.PrePublishValidation,
    }))
);

// Higher-order component for lazy loading with error boundary
interface LazyWrapperProps {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    children: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
    fallback = <EventFormSkeleton />,
    errorFallback = (
        <div className='p-4 text-red-500'>Failed to load component</div>
    ),
    children,
}) => {
    return (
        <Suspense fallback={fallback}>
            <ErrorBoundary fallback={errorFallback}>{children}</ErrorBoundary>
        </Suspense>
    );
};

// Error boundary component
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: {
        children: React.ReactNode;
        fallback: React.ReactNode;
    }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('LazyComponent Error:', error, errorInfo);

        // Report to monitoring service
        if (typeof window !== 'undefined' && 'gtag' in window) {
            const gtag = (window as { gtag: (...args: unknown[]) => void })
                .gtag;
            gtag('event', 'exception', {
                description: `LazyComponent Error: ${error.message}`,
                fatal: false,
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

// Utility function to create lazy components with consistent loading states
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ReactNode
) {
    const LazyComponent = lazy(importFn);

    const WrappedLazyComponent = (props: React.ComponentProps<T>) => (
        <LazyWrapper fallback={fallback}>
            <LazyComponent {...props} />
        </LazyWrapper>
    );

    WrappedLazyComponent.displayName = 'WrappedLazyComponent';

    return WrappedLazyComponent;
}

// Preload function for critical components
export const preloadComponents = {
    imageUpload: () => import('./ImageUpload'),
    ticketManagement: () => import('./TicketManagement'),
    locationSelector: () => import('./LocationSelector'),
    organizerDetails: () => import('./OrganizerDetails'),
    dateTimeSelector: () => import('./DateTimeSelector'),
    prePublishValidation: () => import('./PrePublishValidation'),
};

// Preload critical components on user interaction
export const preloadCriticalComponents = () => {
    // Preload components that are likely to be used next
    preloadComponents.imageUpload();
    preloadComponents.ticketManagement();
};

// Intersection Observer for lazy loading sections
export const useLazySection = (threshold = 0.1) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [hasLoaded, setHasLoaded] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold, hasLoaded]);

    return { ref, isVisible, hasLoaded };
};

'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { EventSummaryView, EventRegistrationSummary } from '../lib/api';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
    const renderCount = useRef(0);
    const startTime = useRef<number>(0);

    useEffect(() => {
        renderCount.current += 1;
        startTime.current = performance.now();

        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime.current;

            if (process.env.NODE_ENV === 'development') {
                console.log(
                    `${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
                );
            }
        };
    });

    return { renderCount: renderCount.current };
};

// Memoized calculations for event statistics
export const useEventStatistics = (events: EventSummaryView[]) => {
    return useMemo(() => {
        if (!events || events.length === 0) {
            return {
                totalEvents: 0,
                totalRevenue: 0,
                totalRegistrations: 0,
                averageRevenue: 0,
                publishedEvents: 0,
                draftEvents: 0,
                completedEvents: 0,
                cancelledEvents: 0,
                revenueGrowth: 0,
                registrationGrowth: 0,
            };
        }

        const totalEvents = events.length;
        const totalRevenue = events.reduce(
            (sum, event) => sum + (event.revenue || 0),
            0
        );
        const totalRegistrations = events.reduce(
            (sum, event) => sum + (event.registrationCount || 0),
            0
        );
        const averageRevenue = totalRevenue / totalEvents;

        // Status counts
        const publishedEvents = events.filter((e) => e.status === 1).length;
        const draftEvents = events.filter((e) => e.status === 0).length;
        const completedEvents = events.filter((e) => e.status === 3).length;
        const cancelledEvents = events.filter((e) => e.status === 2).length;

        // Growth calculations (simplified - would need historical data for real growth)
        const recentEvents = events.filter((e) => {
            const eventDate = new Date(e.dateCreated!);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return eventDate >= thirtyDaysAgo;
        });

        const recentRevenue = recentEvents.reduce(
            (sum, event) => sum + (event.revenue || 0),
            0
        );
        const recentRegistrations = recentEvents.reduce(
            (sum, event) => sum + (event.registrationCount || 0),
            0
        );

        const revenueGrowth =
            recentEvents.length > 0
                ? (recentRevenue / recentEvents.length / averageRevenue) * 100 -
                  100
                : 0;
        const registrationGrowth =
            recentEvents.length > 0
                ? (recentRegistrations /
                      recentEvents.length /
                      (totalRegistrations / totalEvents)) *
                      100 -
                  100
                : 0;

        return {
            totalEvents,
            totalRevenue,
            totalRegistrations,
            averageRevenue,
            publishedEvents,
            draftEvents,
            completedEvents,
            cancelledEvents,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            registrationGrowth: Math.round(registrationGrowth * 100) / 100,
        };
    }, [events]);
};

// Memoized calculations for registration statistics
export const useRegistrationStatistics = (
    registrations: EventRegistrationSummary[]
) => {
    return useMemo(() => {
        if (!registrations || registrations.length === 0) {
            return {
                totalRegistrations: 0,
                totalRevenue: 0,
                averageTicketPrice: 0,
                completedPayments: 0,
                pendingPayments: 0,
                failedPayments: 0,
                financedRegistrations: 0,
                completionRate: 0,
            };
        }

        const totalRegistrations = registrations.length;
        const totalRevenue = registrations.reduce(
            (sum, reg) => sum + (reg.amountPaid || 0),
            0
        );
        const averageTicketPrice = totalRevenue / totalRegistrations;

        const completedPayments = registrations.filter(
            (r) => r.paymentStatus === 1
        ).length;
        const pendingPayments = registrations.filter(
            (r) => r.paymentStatus === 0
        ).length;
        const failedPayments = registrations.filter(
            (r) => r.paymentStatus === 2
        ).length;
        const financedRegistrations = registrations.filter(
            (r) => r.isFinanced
        ).length;

        const completionRate = (completedPayments / totalRegistrations) * 100;

        return {
            totalRegistrations,
            totalRevenue,
            averageTicketPrice,
            completedPayments,
            pendingPayments,
            failedPayments,
            financedRegistrations,
            completionRate: Math.round(completionRate * 100) / 100,
        };
    }, [registrations]);
};

// Memoized chart data transformations
export const useChartData = (
    events: EventSummaryView[],
    type: 'revenue' | 'registrations' | 'performance'
) => {
    return useMemo(() => {
        if (!events || events.length === 0) return null;

        switch (type) {
            case 'revenue':
                return {
                    labels: events.map(
                        (e) => e.title?.substring(0, 20) + '...' || 'Untitled'
                    ),
                    datasets: [
                        {
                            label: 'Revenue',
                            data: events.map((e) => e.revenue || 0),
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                        },
                    ],
                };

            case 'registrations':
                return {
                    labels: events.map(
                        (e) => e.title?.substring(0, 20) + '...' || 'Untitled'
                    ),
                    datasets: [
                        {
                            label: 'Registrations',
                            data: events.map((e) => e.registrationCount || 0),
                            backgroundColor: 'rgba(16, 185, 129, 0.5)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1,
                        },
                    ],
                };

            case 'performance':
                return {
                    labels: events.map(
                        (e) => e.title?.substring(0, 20) + '...' || 'Untitled'
                    ),
                    datasets: [
                        {
                            label: 'Revenue',
                            data: events.map((e) => e.revenue || 0),
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            yAxisID: 'y',
                        },
                        {
                            label: 'Registrations',
                            data: events.map((e) => e.registrationCount || 0),
                            backgroundColor: 'rgba(16, 185, 129, 0.5)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            yAxisID: 'y1',
                        },
                    ],
                };

            default:
                return null;
        }
    }, [events, type]);
};

// Memoized filtering and sorting
export const useFilteredAndSortedEvents = (
    events: EventSummaryView[],
    searchTerm: string,
    statusFilter: string,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
) => {
    return useMemo(() => {
        if (!events) return [];

        let filtered = events;

        // Apply search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.title?.toLowerCase().includes(searchLower) ||
                    event.venue?.toLowerCase().includes(searchLower) ||
                    event.categoryDescription
                        ?.toLowerCase()
                        .includes(searchLower)
            );
        }

        // Apply status filter
        if (statusFilter) {
            const statusValue = parseInt(statusFilter);
            filtered = filtered.filter((event) => event.status === statusValue);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortBy) {
                case 'title':
                    aValue = a.title || '';
                    bValue = b.title || '';
                    break;
                case 'startDate':
                    aValue = new Date(a.startDate || 0);
                    bValue = new Date(b.startDate || 0);
                    break;
                case 'revenue':
                    aValue = a.revenue || 0;
                    bValue = b.revenue || 0;
                    break;
                case 'registrationCount':
                    aValue = a.registrationCount || 0;
                    bValue = b.registrationCount || 0;
                    break;
                case 'status':
                    aValue = a.status || 0;
                    bValue = b.status || 0;
                    break;
                default:
                    aValue = a.dateCreated || '';
                    bValue = b.dateCreated || '';
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [events, searchTerm, statusFilter, sortBy, sortOrder]);
};

// Memoized pagination
export const usePaginatedData = <T>(
    data: T[],
    page: number,
    pageSize: number
) => {
    return useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = data.slice(startIndex, endIndex);
        const totalPages = Math.ceil(data.length / pageSize);

        return {
            data: paginatedData,
            totalPages,
            totalItems: data.length,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }, [data, page, pageSize]);
};

// Optimized event handlers
export const useOptimizedEventHandlers = () => {
    const handleSelectEvent = useCallback(
        (
            eventId: string,
            checked: boolean,
            selectedEvents: Set<string>,
            setSelectedEvents: (events: Set<string>) => void
        ) => {
            setSelectedEvents((prev) => {
                const newSelected = new Set(prev);
                if (checked) {
                    newSelected.add(eventId);
                } else {
                    newSelected.delete(eventId);
                }
                return newSelected;
            });
        },
        []
    );

    const handleSelectAll = useCallback(
        (
            checked: boolean,
            events: EventSummaryView[],
            setSelectedEvents: (events: Set<string>) => void
        ) => {
            if (checked) {
                setSelectedEvents(new Set(events.map((event) => event.id!)));
            } else {
                setSelectedEvents(new Set());
            }
        },
        []
    );

    const handleSort = useCallback(
        (
            field: string,
            currentSortBy: string,
            currentSortOrder: string,
            setSortBy: (field: string) => void,
            setSortOrder: (order: string) => void
        ) => {
            if (currentSortBy === field) {
                setSortOrder(currentSortOrder === 'asc' ? 'desc' : 'asc');
            } else {
                setSortBy(field);
                setSortOrder('asc');
            }
        },
        []
    );

    return {
        handleSelectEvent,
        handleSelectAll,
        handleSort,
    };
};

// Performance-optimized formatters
export const useOptimizedFormatters = () => {
    const formatCurrency = useCallback(
        (amount: number, currency: string = 'NGN') => {
            return new Intl.NumberFormat('en-NG', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
            }).format(amount);
        },
        []
    );

    const formatDate = useCallback(
        (dateString: string, options?: Intl.DateTimeFormatOptions) => {
            const defaultOptions: Intl.DateTimeFormatOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            };
            return new Date(dateString).toLocaleDateString(
                'en-US',
                options || defaultOptions
            );
        },
        []
    );

    const formatNumber = useCallback((num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    }, []);

    const formatPercentage = useCallback(
        (value: number, decimals: number = 1) => {
            return `${value.toFixed(decimals)}%`;
        },
        []
    );

    return {
        formatCurrency,
        formatDate,
        formatNumber,
        formatPercentage,
    };
};

/**
 * Test Data Factories for Dashboard Components
 *
 * This file provides factory functions to create mock data structures
 * that match the API models used throughout the dashboard components.
 * These factories help maintain consistency in test data and make
 * tests more maintainable.
 */

import type {
    OrganizerDashboardView,
    EventSummaryView,
    EventStatistics,
    RevenueStatistics,
    EventRegistrationSummary,
    AttendeeAnalyticsView,
    MonthlyRevenue,
    EventRevenueBreakdown,
    EventStatus,
    EventCategory,
} from '@/lib/api';

// Base factory function type
type FactoryFunction<T> = (overrides?: Partial<T>) => T;

/**
 * Creates mock EventStatistics data
 */
export const createMockEventStatistics: FactoryFunction<EventStatistics> = (
    overrides = {}
) => ({
    totalEvents: 10,
    publishedEvents: 8,
    draftEvents: 2,
    cancelledEvents: 0,
    completedEvents: 5,
    totalRegistrations: 250,
    totalAttendees: 200,
    totalRevenue: 15000,
    pendingRevenue: 2500,
    ...overrides,
});

/**
 * Creates mock RevenueStatistics data
 */
export const createMockRevenueStatistics: FactoryFunction<RevenueStatistics> = (
    overrides = {}
) => ({
    totalRevenue: 15000,
    thisMonthRevenue: 5000,
    lastMonthRevenue: 4500,
    pendingRevenue: 2500,
    refundedRevenue: 500,
    monthlyBreakdown: [
        { month: '2024-01', revenue: 3000 },
        { month: '2024-02', revenue: 4500 },
        { month: '2024-03', revenue: 5000 },
    ],
    eventBreakdown: [
        { eventId: 'event-1', eventTitle: 'Tech Conference', revenue: 8000 },
        { eventId: 'event-2', eventTitle: 'Workshop', revenue: 4000 },
        { eventId: 'event-3', eventTitle: 'Networking', revenue: 3000 },
    ],
    ...overrides,
});

/**
 * Creates mock EventSummaryView data
 */
export const createMockEventSummary: FactoryFunction<EventSummaryView> = (
    overrides = {}
) => {
    const id =
        overrides.id || `event-${Math.random().toString(36).substr(2, 9)}`;
    const title = overrides.title || `Sample Event ${id}`;

    return {
        id,
        title,
        bannerImageUrl: `https://example.com/images/${id}.jpg`,
        startDate: '2024-06-15T09:00:00Z',
        endDate: '2024-06-15T17:00:00Z',
        status: 'Published' as EventStatus,
        category: 'Conference' as EventCategory,
        categoryDescription: 'Technology Conference',
        isVirtual: false,
        venue: 'Convention Center',
        registrationCount: 50,
        ticketsSold: 45,
        totalTickets: 100,
        revenue: 2500,
        dateCreated: '2024-03-01T10:00:00Z',
        dateUpdated: '2024-03-15T14:30:00Z',
        ...overrides,
    };
};

/**
 * Creates mock EventRegistrationSummary data
 */
export const createMockEventRegistration: FactoryFunction<
    EventRegistrationSummary
> = (overrides = {}) => {
    const id = overrides.id || `reg-${Math.random().toString(36).substr(2, 9)}`;

    return {
        id,
        eventId: 'event-1',
        eventTitle: 'Sample Event',
        attendeeName: 'John Doe',
        attendeeEmail: 'john.doe@example.com',
        registrationDate: '2024-03-15T10:00:00Z',
        status: 'Confirmed',
        ticketType: 'General Admission',
        amount: 50,
        ...overrides,
    };
};

/**
 * Creates mock OrganizerDashboardView data
 */
export const createMockOrganizerDashboard: FactoryFunction<
    OrganizerDashboardView
> = (overrides = {}) => ({
    organizerId: 'org-123',
    organizerName: 'Sample Organizer',
    organizerEmail: 'organizer@example.com',
    statistics: createMockEventStatistics(),
    recentEvents: [
        createMockEventSummary({ id: 'event-1', title: 'Recent Event 1' }),
        createMockEventSummary({ id: 'event-2', title: 'Recent Event 2' }),
    ],
    upcomingEvents: [
        createMockEventSummary({
            id: 'event-3',
            title: 'Upcoming Event 1',
            startDate: '2024-07-01T09:00:00Z',
            status: 'Published' as EventStatus,
        }),
    ],
    recentRegistrations: [
        createMockEventRegistration({ id: 'reg-1' }),
        createMockEventRegistration({ id: 'reg-2' }),
    ],
    revenue: createMockRevenueStatistics(),
    ...overrides,
});

/**
 * Creates mock MonthlyRevenue data
 */
export const createMockMonthlyRevenue: FactoryFunction<MonthlyRevenue> = (
    overrides = {}
) => ({
    month: '2024-03',
    revenue: 5000,
    eventCount: 3,
    registrationCount: 150,
    ...overrides,
});

/**
 * Creates mock EventRevenueBreakdown data
 */
export const createMockEventRevenueBreakdown: FactoryFunction<
    EventRevenueBreakdown
> = (overrides = {}) => ({
    eventId: 'event-1',
    eventTitle: 'Sample Event',
    revenue: 2500,
    ticketsSold: 50,
    refunds: 100,
    netRevenue: 2400,
    ...overrides,
});

/**
 * Creates mock AttendeeAnalyticsView data
 */
export const createMockAttendeeAnalytics: FactoryFunction<
    AttendeeAnalyticsView
> = (overrides = {}) => ({
    totalAttendees: 200,
    newAttendees: 150,
    returningAttendees: 50,
    demographics: {
        ageGroups: [
            { ageRange: '18-25', count: 40, percentage: 20 },
            { ageRange: '26-35', count: 80, percentage: 40 },
            { ageRange: '36-45', count: 60, percentage: 30 },
            { ageRange: '46+', count: 20, percentage: 10 },
        ],
        genderDistribution: [
            { gender: 'Male', count: 120, percentage: 60 },
            { gender: 'Female', count: 70, percentage: 35 },
            { gender: 'Other', count: 10, percentage: 5 },
        ],
    },
    geographicDistribution: [
        { country: 'United States', count: 150, percentage: 75 },
        { country: 'Canada', count: 30, percentage: 15 },
        { country: 'United Kingdom', count: 20, percentage: 10 },
    ],
    registrationTrends: [
        { date: '2024-03-01', registrations: 10 },
        { date: '2024-03-02', registrations: 15 },
        { date: '2024-03-03', registrations: 25 },
    ],
    ...overrides,
});

/**
 * Creates mock paginated response data
 */
export const createMockPaginatedResponse = <T>(
    items: T[],
    page: number = 1,
    pageSize: number = 10,
    totalCount?: number
) => ({
    items: items.slice((page - 1) * pageSize, page * pageSize),
    totalCount: totalCount || items.length,
    page,
    pageSize,
    totalPages: Math.ceil((totalCount || items.length) / pageSize),
    hasNextPage: page * pageSize < (totalCount || items.length),
    hasPreviousPage: page > 1,
});

/**
 * Creates mock API response wrapper
 */
export const createMockApiResponse = <T>(
    data: T,
    success: boolean = true,
    message?: string
) => ({
    success,
    data: success ? data : undefined,
    error: success ? undefined : message || 'An error occurred',
    message,
});

/**
 * Creates multiple mock events with varied data
 */
export const createMockEventList = (count: number = 5): EventSummaryView[] => {
    const statuses: EventStatus[] = ['Published', 'Draft', 'Cancelled'];
    const categories: EventCategory[] = [
        'Conference',
        'Workshop',
        'Networking',
        'Seminar',
    ];
    const venues = [
        'Convention Center',
        'Hotel Ballroom',
        'Community Center',
        'Online',
    ];

    return Array.from({ length: count }, (_, index) => {
        const eventNumber = index + 1;
        const status = statuses[index % statuses.length];
        const category = categories[index % categories.length];
        const isVirtual = index % 4 === 0; // Every 4th event is virtual

        return createMockEventSummary({
            id: `event-${eventNumber}`,
            title: `${category} Event ${eventNumber}`,
            status,
            category,
            isVirtual,
            venue: isVirtual ? null : venues[index % venues.length],
            registrationCount: Math.floor(Math.random() * 200) + 10,
            revenue: Math.floor(Math.random() * 10000) + 500,
            startDate: new Date(
                2024,
                5 + (index % 6),
                15 + index
            ).toISOString(),
        });
    });
};

/**
 * Creates multiple mock registrations with varied data
 */
export const createMockRegistrationList = (
    count: number = 10
): EventRegistrationSummary[] => {
    const statuses = ['Confirmed', 'Pending', 'Cancelled'];
    const ticketTypes = ['General Admission', 'VIP', 'Student', 'Early Bird'];
    const names = [
        'John Doe',
        'Jane Smith',
        'Bob Johnson',
        'Alice Brown',
        'Charlie Wilson',
    ];

    return Array.from({ length: count }, (_, index) => {
        const regNumber = index + 1;
        const status = statuses[index % statuses.length];
        const ticketType = ticketTypes[index % ticketTypes.length];
        const name = names[index % names.length];

        return createMockEventRegistration({
            id: `reg-${regNumber}`,
            attendeeName: `${name} ${regNumber}`,
            attendeeEmail: `${name.toLowerCase().replace(' ', '.')}${regNumber}@example.com`,
            status,
            ticketType,
            amount:
                ticketType === 'VIP' ? 100 : ticketType === 'Student' ? 25 : 50,
            registrationDate: new Date(2024, 2, index + 1).toISOString(),
        });
    });
};

/**
 * Creates mock revenue data for charts
 */
export const createMockRevenueChartData = (months: number = 12) => {
    const currentDate = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
        );
        const month = date.toISOString().substr(0, 7); // YYYY-MM format
        const revenue = Math.floor(Math.random() * 10000) + 2000;

        data.push(
            createMockMonthlyRevenue({
                month,
                revenue,
                eventCount: Math.floor(revenue / 1500), // Approximate events based on revenue
                registrationCount: Math.floor(revenue / 50), // Approximate registrations
            })
        );
    }

    return data;
};

/**
 * Creates mock performance metrics for events
 */
export const createMockPerformanceMetrics = (eventId: string) => ({
    eventId,
    conversionRate: Math.random() * 0.3 + 0.1, // 10-40%
    engagementScore: Math.random() * 40 + 60, // 60-100
    satisfactionRating: Math.random() * 2 + 3, // 3-5 stars
    revenuePerAttendee: Math.random() * 100 + 25, // $25-125
    registrationTrend: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        registrations: Math.floor(Math.random() * 10) + 1,
    })),
});

/**
 * Creates mock notification data
 */
export const createMockNotification = (overrides = {}) => ({
    id: `notification-${Math.random().toString(36).substr(2, 9)}`,
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    title: 'Sample Notification',
    message: 'This is a sample notification message.',
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: null,
    ...overrides,
});

/**
 * Creates mock dashboard widget configuration
 */
export const createMockWidgetConfig = (overrides = {}) => ({
    id: `widget-${Math.random().toString(36).substr(2, 9)}`,
    type: 'statistics' as 'statistics' | 'chart' | 'table' | 'list',
    title: 'Sample Widget',
    position: { x: 0, y: 0, width: 4, height: 2 },
    visible: true,
    settings: {},
    ...overrides,
});

/**
 * Creates mock dashboard layout
 */
export const createMockDashboardLayout = (overrides = {}) => ({
    id: `layout-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Default Layout',
    widgets: [
        createMockWidgetConfig({ type: 'statistics', title: 'Key Metrics' }),
        createMockWidgetConfig({ type: 'chart', title: 'Revenue Trends' }),
        createMockWidgetConfig({ type: 'table', title: 'Recent Events' }),
    ],
    isDefault: true,
    createdAt: new Date().toISOString(),
    ...overrides,
});

/**
 * Utility function to create mock error responses
 */
export const createMockErrorResponse = (
    message: string = 'An error occurred',
    status: number = 500
) => ({
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString(),
});

/**
 * Utility function to create mock loading states
 */
export const createMockLoadingState = (isLoading: boolean = true) => ({
    loading: isLoading,
    data: null,
    error: null,
});

/**
 * Creates mock filter options for testing
 */
export const createMockFilterOptions = () => ({
    statuses: ['All', 'Published', 'Draft', 'Cancelled'],
    categories: ['All', 'Conference', 'Workshop', 'Networking', 'Seminar'],
    dateRanges: [
        { label: 'Last 7 days', value: '7d' },
        { label: 'Last 30 days', value: '30d' },
        { label: 'Last 3 months', value: '3m' },
        { label: 'Last 6 months', value: '6m' },
        { label: 'Last year', value: '1y' },
    ],
});

/**
 * Creates mock search results
 */
export const createMockSearchResults = (
    query: string,
    totalResults: number = 5
) => ({
    query,
    totalResults,
    results: Array.from({ length: Math.min(totalResults, 10) }, (_, index) => ({
        id: `result-${index + 1}`,
        type: 'event',
        title: `Search Result ${index + 1} for "${query}"`,
        description: `This is a search result that matches the query "${query}".`,
        url: `/dashboard/events/result-${index + 1}`,
        relevanceScore: Math.random(),
    })),
    suggestions: [`${query} conference`, `${query} workshop`, `${query} 2024`],
});

// Export all factory functions as a collection for easy importing
export const DashboardTestFactories = {
    createMockEventStatistics,
    createMockRevenueStatistics,
    createMockEventSummary,
    createMockEventRegistration,
    createMockOrganizerDashboard,
    createMockMonthlyRevenue,
    createMockEventRevenueBreakdown,
    createMockAttendeeAnalytics,
    createMockPaginatedResponse,
    createMockApiResponse,
    createMockEventList,
    createMockRegistrationList,
    createMockRevenueChartData,
    createMockPerformanceMetrics,
    createMockNotification,
    createMockWidgetConfig,
    createMockDashboardLayout,
    createMockErrorResponse,
    createMockLoadingState,
    createMockFilterOptions,
    createMockSearchResults,
};

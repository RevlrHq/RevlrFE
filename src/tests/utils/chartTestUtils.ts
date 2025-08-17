import React from 'react';
import {
    MonthlyRevenue,
    EventSummaryView,
    AttendeeAnalyticsView,
    AttendeeSegment,
} from '@/lib/api';

// Mock data generators for testing
export const generateMockMonthlyRevenue = (
    count: number = 12
): MonthlyRevenue[] => {
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    return Array.from({ length: count }, (_, index) => ({
        year: 2024,
        month: (index % 12) + 1,
        monthName: months[index % 12],
        revenue: Math.floor(Math.random() * 50000) + 10000,
        eventCount: Math.floor(Math.random() * 20) + 1,
        registrationCount: Math.floor(Math.random() * 500) + 50,
    }));
};

export const generateMockEventSummaryView = (
    count: number = 10
): EventSummaryView[] => {
    const eventTitles = [
        'Tech Conference 2024',
        'Marketing Summit',
        'Design Workshop',
        'Startup Pitch Night',
        'Developer Meetup',
        'Business Networking',
        'Product Launch',
        'Training Session',
        'Industry Forum',
        'Innovation Expo',
    ];

    return Array.from({ length: count }, (_, index) => ({
        id: `event-${index + 1}`,
        title: eventTitles[index % eventTitles.length],
        bannerImageUrl: `https://example.com/banner-${index + 1}.jpg`,
        startDate: new Date(
            2024,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ).toISOString(),
        endDate: new Date(
            2024,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ).toISOString(),
        status: 'Published',
        category: 'Technology',
        categoryDescription: 'Technology events',
        isVirtual: Math.random() > 0.5,
        venue: Math.random() > 0.5 ? 'Convention Center' : null,
        registrationCount: Math.floor(Math.random() * 500) + 10,
        ticketsSold: Math.floor(Math.random() * 400) + 5,
        totalTickets: Math.floor(Math.random() * 600) + 100,
        revenue: Math.floor(Math.random() * 25000) + 1000,
        dateCreated: new Date(2024, 0, 1).toISOString(),
        dateUpdated: new Date().toISOString(),
    }));
};

export const generateMockAttendeeAnalyticsView = (): AttendeeAnalyticsView => {
    const segments: AttendeeSegment[] = [
        {
            segmentName: 'First-time Attendees',
            count: 150,
            percentage: 45.5,
            averageSpend: 125.5,
        },
        {
            segmentName: 'Returning Attendees',
            count: 120,
            percentage: 36.4,
            averageSpend: 185.75,
        },
        {
            segmentName: 'VIP Members',
            count: 60,
            percentage: 18.2,
            averageSpend: 350.25,
        },
    ];

    return {
        totalUniqueAttendees: 330,
        newAttendeesThisMonth: 85,
        returningAttendees: 120,
        averageSpendPerAttendee: 187.17,
        attendeeSegments: segments,
        topAttendees: [
            {
                attendeeId: 'att-1',
                name: 'John Doe',
                email: 'john@example.com',
                eventsAttended: 5,
                totalSpent: 875.5,
            },
            {
                attendeeId: 'att-2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                eventsAttended: 3,
                totalSpent: 650.25,
            },
        ],
    };
};

// Mock Chart.js for testing
export const mockChartJS = () => {
    // Mock Chart.js components
    jest.mock('chart.js', () => ({
        Chart: {
            register: jest.fn(),
        },
        CategoryScale: jest.fn(),
        LinearScale: jest.fn(),
        PointElement: jest.fn(),
        LineElement: jest.fn(),
        BarElement: jest.fn(),
        ArcElement: jest.fn(),
        Title: jest.fn(),
        Tooltip: jest.fn(),
        Legend: jest.fn(),
        Filler: jest.fn(),
    }));

    // Mock react-chartjs-2
    jest.mock('react-chartjs-2', () => ({
        Line: ({ data, options, ...props }: any) => {
            return React.createElement(
                'div',
                {
                    'data-testid': 'line-chart',
                    'data-chart-data': JSON.stringify(data),
                    'data-chart-options': JSON.stringify(options),
                    ...props,
                },
                'Line Chart Mock'
            );
        },
        Bar: ({ data, options, ...props }: any) => {
            return React.createElement(
                'div',
                {
                    'data-testid': 'bar-chart',
                    'data-chart-data': JSON.stringify(data),
                    'data-chart-options': JSON.stringify(options),
                    ...props,
                },
                'Bar Chart Mock'
            );
        },
        Doughnut: ({ data, options, ...props }: any) => {
            return React.createElement(
                'div',
                {
                    'data-testid': 'doughnut-chart',
                    'data-chart-data': JSON.stringify(data),
                    'data-chart-options': JSON.stringify(options),
                    ...props,
                },
                'Doughnut Chart Mock'
            );
        },
    }));
};

// Helper to extract chart data from rendered component
export const getChartDataFromElement = (element: HTMLElement) => {
    const dataAttr = element.getAttribute('data-chart-data');
    return dataAttr ? JSON.parse(dataAttr) : null;
};

// Helper to extract chart options from rendered component
export const getChartOptionsFromElement = (element: HTMLElement) => {
    const optionsAttr = element.getAttribute('data-chart-options');
    return optionsAttr ? JSON.parse(optionsAttr) : null;
};

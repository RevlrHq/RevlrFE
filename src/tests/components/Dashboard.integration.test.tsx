import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../features/dashboard/Dashboard';
import { useOrganizerDashboard } from '../../hooks/useOrganizerDashboard';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../stores/authStore';

// Mock the hooks
jest.mock('../../hooks/useOrganizerDashboard');
jest.mock('../../lib/ThemeContext');
jest.mock('../../stores/authStore');
jest.mock('next/link', () => {
    const MockLink = ({
        children,
        href,
    }: {
        children: React.ReactNode;
        href: string;
    }) => <a href={href}>{children}</a>;
    MockLink.displayName = 'MockLink';
    return MockLink;
});

const mockUseOrganizerDashboard = useOrganizerDashboard as jest.MockedFunction<
    typeof useOrganizerDashboard
>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
    typeof useAuthStore
>;

describe('Dashboard Integration', () => {
    beforeEach(() => {
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: jest.fn(),
        });

        mockUseAuthStore.mockReturnValue({
            user: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                isOrganizer: true,
            },
            login: jest.fn(),
            logout: jest.fn(),
            isAuthenticated: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should display loading states when data is loading', () => {
        mockUseOrganizerDashboard.mockReturnValue({
            data: null,
            loading: true,
            error: null,
            refetch: jest.fn(),
        });

        render(<Dashboard />);

        // Check that the component renders with loading states
        expect(screen.getByText('Welcome back, John Doe!')).toBeInTheDocument();
        // Loading states should be visible (skeleton components are rendered)
    });

    it('should display dashboard data when loaded successfully', async () => {
        const mockData = {
            organizerId: '123',
            organizerName: 'John Doe',
            organizerEmail: 'john.doe@example.com',
            statistics: {
                totalEvents: 10,
                publishedEvents: 8,
                draftEvents: 2,
                cancelledEvents: 0,
                completedEvents: 5,
                totalRegistrations: 150,
                totalAttendees: 120,
                totalRevenue: 50000,
                pendingRevenue: 5000,
            },
            recentEvents: [
                {
                    id: '1',
                    title: 'Test Event',
                    startDate: '2024-02-15T10:00:00Z',
                    status: 1, // Published status
                    venue: 'Test Venue',
                    registrationCount: 25,
                    revenue: 5000,
                    isVirtual: false,
                },
            ],
            revenue: {
                totalRevenue: 50000,
                thisMonthRevenue: 10000,
                lastMonthRevenue: 8000,
                pendingRevenue: 5000,
                refundedRevenue: 500,
            },
        };

        mockUseOrganizerDashboard.mockReturnValue({
            data: mockData,
            loading: false,
            error: null,
            refetch: jest.fn(),
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument(); // Total events
            expect(screen.getByText('8')).toBeInTheDocument(); // Published events
            expect(screen.getByText('Test Event')).toBeInTheDocument();
            expect(screen.getByText('Published')).toBeInTheDocument();
            expect(screen.getByText('25 registrations')).toBeInTheDocument();
        });
    });

    it('should display error states when API fails', async () => {
        const mockRefetch = jest.fn();
        mockUseOrganizerDashboard.mockReturnValue({
            data: null,
            loading: false,
            error: 'Failed to fetch dashboard data',
            refetch: mockRefetch,
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load dashboard statistics')
            ).toBeInTheDocument();
            expect(
                screen.getAllByText('Failed to fetch dashboard data')
            ).toHaveLength(3); // Multiple error boundaries
            expect(screen.getAllByText('Try Again')).toHaveLength(3);
        });
    });

    it('should display empty state when no recent events', async () => {
        const mockData = {
            organizerId: '123',
            organizerName: 'John Doe',
            statistics: {
                totalEvents: 0,
                publishedEvents: 0,
                draftEvents: 0,
                cancelledEvents: 0,
                completedEvents: 0,
                totalRegistrations: 0,
                totalAttendees: 0,
                totalRevenue: 0,
                pendingRevenue: 0,
            },
            recentEvents: [],
            revenue: {
                totalRevenue: 0,
                thisMonthRevenue: 0,
                lastMonthRevenue: 0,
                pendingRevenue: 0,
                refundedRevenue: 0,
            },
        };

        mockUseOrganizerDashboard.mockReturnValue({
            data: mockData,
            loading: false,
            error: null,
            refetch: jest.fn(),
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(
                screen.getByText('No recent events found')
            ).toBeInTheDocument();
        });
    });

    it('should calculate and display revenue growth correctly', async () => {
        const mockData = {
            organizerId: '123',
            organizerName: 'John Doe',
            statistics: {
                totalEvents: 5,
                publishedEvents: 4,
                draftEvents: 1,
                cancelledEvents: 0,
                completedEvents: 2,
                totalRegistrations: 50,
                totalAttendees: 40,
                totalRevenue: 25000,
                pendingRevenue: 2500,
            },
            recentEvents: [],
            revenue: {
                totalRevenue: 25000,
                thisMonthRevenue: 12000,
                lastMonthRevenue: 10000,
                pendingRevenue: 2500,
                refundedRevenue: 100,
            },
        };

        mockUseOrganizerDashboard.mockReturnValue({
            data: mockData,
            loading: false,
            error: null,
            refetch: jest.fn(),
        });

        render(<Dashboard />);

        await waitFor(() => {
            // Growth should be (12000 - 10000) / 10000 * 100 = 20%
            expect(screen.getByText('+20.0%')).toBeInTheDocument();
            expect(screen.getByText('vs last month')).toBeInTheDocument();
        });
    });

    it('should handle virtual events correctly', async () => {
        const mockData = {
            organizerId: '123',
            organizerName: 'John Doe',
            statistics: {
                totalEvents: 1,
                publishedEvents: 1,
                draftEvents: 0,
                cancelledEvents: 0,
                completedEvents: 0,
                totalRegistrations: 10,
                totalAttendees: 8,
                totalRevenue: 1000,
                pendingRevenue: 100,
            },
            recentEvents: [
                {
                    id: '1',
                    title: 'Virtual Conference',
                    startDate: '2024-02-20T14:00:00Z',
                    status: 1, // Published status
                    venue: 'Online Platform',
                    registrationCount: 10,
                    revenue: 1000,
                    isVirtual: true,
                },
            ],
            revenue: {
                totalRevenue: 1000,
                thisMonthRevenue: 1000,
                lastMonthRevenue: 0,
                pendingRevenue: 100,
                refundedRevenue: 0,
            },
        };

        mockUseOrganizerDashboard.mockReturnValue({
            data: mockData,
            loading: false,
            error: null,
            refetch: jest.fn(),
        });

        render(<Dashboard />);

        await waitFor(() => {
            expect(screen.getByText('Virtual Conference')).toBeInTheDocument();
            expect(screen.getByText('Virtual Event')).toBeInTheDocument();
        });
    });
});

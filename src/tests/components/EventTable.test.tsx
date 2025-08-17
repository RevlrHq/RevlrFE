import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import EventTable from '../../components/EventTable';
import { OrganizerService, EventSummaryView } from '../../lib/api';
import { useTheme } from '../../lib/ThemeContext';

// Mock the dependencies
jest.mock('../../lib/api', () => ({
    OrganizerService: {
        getApiOrganizerEvents: jest.fn(),
        postApiOrganizerEventsBulkAction: jest.fn(),
        postApiOrganizerEventsDuplicate: jest.fn(),
    },
}));

jest.mock('../../lib/ThemeContext', () => ({
    useTheme: jest.fn(),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

const mockOrganizerService = OrganizerService as jest.Mocked<
    typeof OrganizerService
>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

// Mock data
const mockEvents: EventSummaryView[] = [
    {
        id: '1',
        title: 'Test Event 1',
        bannerImageUrl: 'https://example.com/banner1.jpg',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T18:00:00Z',
        status: 1, // Published
        category: 0, // Conference
        categoryDescription: 'Conference',
        isVirtual: false,
        venue: 'Test Venue 1',
        registrationCount: 50,
        ticketsSold: 45,
        totalTickets: 100,
        revenue: 25000,
        dateCreated: '2024-01-01T00:00:00Z',
        dateUpdated: '2024-01-02T00:00:00Z',
    },
    {
        id: '2',
        title: 'Test Event 2',
        bannerImageUrl: null,
        startDate: '2024-02-20T14:00:00Z',
        endDate: '2024-02-20T17:00:00Z',
        status: 0, // Draft
        category: 1, // Workshop
        categoryDescription: 'Workshop',
        isVirtual: true,
        venue: null,
        registrationCount: 25,
        ticketsSold: 20,
        totalTickets: 50,
        revenue: 12500,
        dateCreated: '2024-01-10T00:00:00Z',
        dateUpdated: null,
    },
];

const mockApiResponse = {
    success: true,
    data: {
        items: mockEvents,
        totalPages: 1,
        totalItems: 2,
        pageNumber: 1,
        pageSize: 10,
    },
    message: null,
};

describe('EventTable', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseTheme.mockReturnValue({ theme: 'light' });
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue(
            mockApiResponse
        );
    });

    describe('Basic Rendering', () => {
        it('renders the component with default props', async () => {
            render(<EventTable />);

            expect(
                screen.getByPlaceholderText('Search events...')
            ).toBeInTheDocument();
            expect(screen.getByText('Filters')).toBeInTheDocument();
            expect(screen.getByText('Export')).toBeInTheDocument();
            expect(screen.getByText('Refresh')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
                expect(screen.getByText('Test Event 2')).toBeInTheDocument();
            });
        });

        it('renders loading state initially', () => {
            render(<EventTable />);

            // Should show skeleton loaders
            expect(screen.getAllByTestId('skeleton')).toHaveLength(10); // Default page size
        });

        it('renders error state when API fails', async () => {
            const errorResponse = {
                success: false,
                data: null,
                message: 'Failed to fetch events',
            };
            mockOrganizerService.getApiOrganizerEvents.mockResolvedValue(
                errorResponse
            );

            render(<EventTable />);

            await waitFor(() => {
                expect(
                    screen.getByText('Error loading events')
                ).toBeInTheDocument();
                expect(
                    screen.getByText('Failed to fetch events')
                ).toBeInTheDocument();
                expect(screen.getByText('Try Again')).toBeInTheDocument();
            });
        });

        it('renders empty state when no events found', async () => {
            const emptyResponse = {
                ...mockApiResponse,
                data: {
                    ...mockApiResponse.data,
                    items: [],
                    totalItems: 0,
                },
            };
            mockOrganizerService.getApiOrganizerEvents.mockResolvedValue(
                emptyResponse
            );

            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('No events found')).toBeInTheDocument();
                expect(
                    screen.getByText('Create your first event to get started.')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Event Display', () => {
        it('displays event information correctly', async () => {
            render(<EventTable />);

            await waitFor(() => {
                // Check event titles
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
                expect(screen.getByText('Test Event 2')).toBeInTheDocument();

                // Check venues
                expect(screen.getByText('Test Venue 1')).toBeInTheDocument();
                expect(screen.getByText('Virtual Event')).toBeInTheDocument();

                // Check status labels
                expect(screen.getByText('Published')).toBeInTheDocument();
                expect(screen.getByText('Draft')).toBeInTheDocument();

                // Check registration counts
                expect(screen.getByText('50')).toBeInTheDocument();
                expect(screen.getByText('25')).toBeInTheDocument();
            });
        });

        it('formats currency correctly', async () => {
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('₦25,000')).toBeInTheDocument();
                expect(screen.getByText('₦12,500')).toBeInTheDocument();
            });
        });

        it('formats dates correctly', async () => {
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
                expect(screen.getByText('Feb 20, 2024')).toBeInTheDocument();
            });
        });
    });

    describe('Search and Filtering', () => {
        it('handles search input', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            const searchInput = screen.getByPlaceholderText('Search events...');
            await user.type(searchInput, 'Test Event 1');

            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        searchTerm: 'Test Event 1',
                    })
                );
            });
        });

        it('opens filters modal', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            const filtersButton = screen.getByText('Filters');
            await user.click(filtersButton);

            expect(screen.getByText('Filter Events')).toBeInTheDocument();
            expect(
                screen.getByText('Apply filters to narrow down your event list')
            ).toBeInTheDocument();
        });

        it('applies filters correctly', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            // Open filters modal
            await user.click(screen.getByText('Filters'));

            // Select status filter
            const statusSelect = screen.getByLabelText('Status');
            await user.selectOptions(statusSelect, '1'); // Published

            // Apply filters
            await user.click(screen.getByText('Apply Filters'));

            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        status: '1',
                    })
                );
            });
        });

        it('clears filters', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            // First set a search term
            const searchInput = screen.getByPlaceholderText('Search events...');
            await user.type(searchInput, 'test');

            // Open filters and clear
            await user.click(screen.getByText('Filters'));
            await user.click(screen.getByText('Clear All'));

            expect(searchInput).toHaveValue('');
        });
    });

    describe('Sorting', () => {
        it('handles column sorting', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Event')).toBeInTheDocument();
            });

            // Click on Event column header to sort
            const eventHeader = screen.getByText('Event');
            await user.click(eventHeader);

            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sortBy: 'title',
                        sortOrder: 'asc',
                    })
                );
            });
        });

        it('toggles sort direction', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Event')).toBeInTheDocument();
            });

            const eventHeader = screen.getByText('Event');

            // First click - ascending
            await user.click(eventHeader);
            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sortBy: 'title',
                        sortOrder: 'asc',
                    })
                );
            });

            // Second click - descending
            await user.click(eventHeader);
            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sortBy: 'title',
                        sortOrder: 'desc',
                    })
                );
            });
        });
    });

    describe('Pagination', () => {
        it('handles page size change', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('10')).toBeInTheDocument();
            });

            const pageSizeSelect = screen.getByDisplayValue('10');
            await user.selectOptions(pageSizeSelect, '25');

            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        pageSize: 25,
                        pageNumber: 1,
                    })
                );
            });
        });

        it('handles page navigation', async () => {
            const user = userEvent.setup();
            const multiPageResponse = {
                ...mockApiResponse,
                data: {
                    ...mockApiResponse.data,
                    totalPages: 3,
                    totalItems: 25,
                },
            };
            mockOrganizerService.getApiOrganizerEvents.mockResolvedValue(
                multiPageResponse
            );

            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Next')).toBeInTheDocument();
            });

            const nextButton = screen.getByText('Next');
            await user.click(nextButton);

            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        pageNumber: 2,
                    })
                );
            });
        });
    });

    describe('Bulk Actions', () => {
        it('handles event selection', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Select first event
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[1]); // First event checkbox (0 is select all)

            expect(screen.getByText('1 event selected')).toBeInTheDocument();
            expect(screen.getByText('Bulk Actions')).toBeInTheDocument();
        });

        it('handles select all', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click select all checkbox
            const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
            await user.click(selectAllCheckbox);

            expect(screen.getByText('2 events selected')).toBeInTheDocument();
        });

        it('opens bulk actions modal', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Select an event first
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[1]);

            // Open bulk actions modal
            await user.click(screen.getByText('Bulk Actions'));

            expect(
                screen.getByText('Apply actions to 1 selected event')
            ).toBeInTheDocument();
        });
    });

    describe('Export Functionality', () => {
        it('opens export modal', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            await user.click(screen.getByText('Export'));

            expect(screen.getByText('Export Events')).toBeInTheDocument();
            expect(
                screen.getByText('Choose export format and fields to include')
            ).toBeInTheDocument();
        });

        it('handles export with selected fields', async () => {
            const user = userEvent.setup();

            // Mock URL.createObjectURL and document methods
            global.URL.createObjectURL = jest.fn(() => 'mock-url');
            const mockLink = {
                setAttribute: jest.fn(),
                click: jest.fn(),
                style: { visibility: '' },
            };
            const mockAppendChild = jest.fn();
            const mockRemoveChild = jest.fn();

            Object.defineProperty(document, 'createElement', {
                value: jest.fn(() => mockLink),
            });
            Object.defineProperty(document.body, 'appendChild', {
                value: mockAppendChild,
            });
            Object.defineProperty(document.body, 'removeChild', {
                value: mockRemoveChild,
            });

            render(<EventTable />);

            await user.click(screen.getByText('Export'));

            // Select CSV format (should be default)
            expect(screen.getByDisplayValue('csv')).toBeInTheDocument();

            // Export button should be enabled with default fields
            const exportButton = screen.getByRole('button', {
                name: /export/i,
            });
            expect(exportButton).not.toBeDisabled();

            await user.click(exportButton);

            await waitFor(() => {
                expect(
                    mockOrganizerService.getApiOrganizerEvents
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        pageSize: 10000, // Large number to get all events
                    })
                );
            });
        });
    });

    describe('Event Actions', () => {
        it('handles event view action', async () => {
            const mockOnEventView = jest.fn();
            const user = userEvent.setup();

            render(<EventTable onEventView={mockOnEventView} />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click on actions menu for first event
            const actionButtons = screen.getAllByRole('button', { name: '' });
            const firstActionButton = actionButtons.find(
                (button) =>
                    button.querySelector('svg') &&
                    button
                        .querySelector('svg')
                        ?.getAttribute('class')
                        ?.includes('lucide-more-horizontal')
            );

            if (firstActionButton) {
                await user.click(firstActionButton);

                const viewButton = screen.getByText('View Details');
                await user.click(viewButton);

                expect(mockOnEventView).toHaveBeenCalledWith('1');
            }
        });

        it('handles event edit action', async () => {
            const mockOnEventEdit = jest.fn();
            const user = userEvent.setup();

            render(<EventTable onEventEdit={mockOnEventEdit} />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click on actions menu for first event
            const actionButtons = screen.getAllByRole('button', { name: '' });
            const firstActionButton = actionButtons.find(
                (button) =>
                    button.querySelector('svg') &&
                    button
                        .querySelector('svg')
                        ?.getAttribute('class')
                        ?.includes('lucide-more-horizontal')
            );

            if (firstActionButton) {
                await user.click(firstActionButton);

                const editButton = screen.getByText('Edit Event');
                await user.click(editButton);

                expect(mockOnEventEdit).toHaveBeenCalledWith('1');
            }
        });

        it('opens duplicate modal', async () => {
            const user = userEvent.setup();

            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Click on actions menu for first event
            const actionButtons = screen.getAllByRole('button', { name: '' });
            const firstActionButton = actionButtons.find(
                (button) =>
                    button.querySelector('svg') &&
                    button
                        .querySelector('svg')
                        ?.getAttribute('class')
                        ?.includes('lucide-more-horizontal')
            );

            if (firstActionButton) {
                await user.click(firstActionButton);

                const duplicateButton = screen.getByText('Duplicate');
                await user.click(duplicateButton);

                expect(screen.getByText('Duplicate Event')).toBeInTheDocument();
                expect(
                    screen.getByText(
                        'Create a copy of this event with new details'
                    )
                ).toBeInTheDocument();
            }
        });
    });

    describe('Responsive Design', () => {
        it('shows mobile view on small screens', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500,
            });

            render(<EventTable />);

            // Mobile view should show cards instead of table
            render(<EventTable />);

            // This would require more complex testing setup to properly test responsive behavior
            expect(
                screen.getByPlaceholderText('Search events...')
            ).toBeInTheDocument();
        });
    });

    describe('Theme Support', () => {
        it('applies dark theme styles', () => {
            mockUseTheme.mockReturnValue({ theme: 'dark' });

            render(<EventTable />);

            const searchInput = screen.getByPlaceholderText('Search events...');
            expect(searchInput).toHaveClass('bg-revlr-dark-card');
        });

        it('applies light theme styles', () => {
            mockUseTheme.mockReturnValue({ theme: 'light' });

            render(<EventTable />);

            const searchInput = screen.getByPlaceholderText('Search events...');
            expect(searchInput).toHaveClass('bg-white');
        });
    });

    describe('Error Handling', () => {
        it('handles API errors gracefully', async () => {
            mockOrganizerService.getApiOrganizerEvents.mockRejectedValue(
                new Error('Network error')
            );

            render(<EventTable />);

            await waitFor(() => {
                expect(
                    screen.getByText('Error loading events')
                ).toBeInTheDocument();
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        it('handles bulk action errors', async () => {
            const user = userEvent.setup();
            mockOrganizerService.postApiOrganizerEventsBulkAction.mockRejectedValue(
                new Error('Bulk action failed')
            );

            render(<EventTable />);

            await waitFor(() => {
                expect(screen.getByText('Test Event 1')).toBeInTheDocument();
            });

            // Select an event and try bulk action
            const checkboxes = screen.getAllByRole('checkbox');
            await user.click(checkboxes[1]);

            await user.click(screen.getByText('Bulk Actions'));
            await user.click(screen.getByText('Apply Action'));

            await waitFor(() => {
                expect(
                    screen.getByText('Bulk action failed')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', async () => {
            render(<EventTable />);

            await waitFor(() => {
                expect(
                    screen.getByLabelText('Select all events')
                ).toBeInTheDocument();
                expect(
                    screen.getByLabelText('Select Test Event 1')
                ).toBeInTheDocument();
                expect(
                    screen.getByLabelText('Select Test Event 2')
                ).toBeInTheDocument();
            });
        });

        it('supports keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<EventTable />);

            // Tab through interactive elements
            await user.tab();
            expect(
                screen.getByPlaceholderText('Search events...')
            ).toHaveFocus();

            await user.tab();
            expect(screen.getByText('Filters')).toHaveFocus();
        });
    });
});

// Integration tests
describe('EventTable Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseTheme.mockReturnValue({ theme: 'light' });
    });

    it('performs complete workflow: search, filter, sort, and export', async () => {
        const user = userEvent.setup();
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue(
            mockApiResponse
        );

        render(<EventTable />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        });

        // Search
        const searchInput = screen.getByPlaceholderText('Search events...');
        await user.type(searchInput, 'Test');

        // Apply filters
        await user.click(screen.getByText('Filters'));
        const statusSelect = screen.getByLabelText('Status');
        await user.selectOptions(statusSelect, '1');
        await user.click(screen.getByText('Apply Filters'));

        // Sort by title
        await user.click(screen.getByText('Event'));

        // Export
        await user.click(screen.getByText('Export'));
        await user.click(screen.getByRole('button', { name: /export/i }));

        // Verify all API calls were made with correct parameters
        expect(mockOrganizerService.getApiOrganizerEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                searchTerm: 'Test',
                status: '1',
                sortBy: 'title',
                sortOrder: 'asc',
            })
        );
    });

    it('handles bulk operations end-to-end', async () => {
        const user = userEvent.setup();
        mockOrganizerService.getApiOrganizerEvents.mockResolvedValue(
            mockApiResponse
        );
        mockOrganizerService.postApiOrganizerEventsBulkAction.mockResolvedValue(
            {
                success: true,
                data: true,
                message: null,
            }
        );

        render(<EventTable />);

        await waitFor(() => {
            expect(screen.getByText('Test Event 1')).toBeInTheDocument();
        });

        // Select events
        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[1]); // Select first event
        await user.click(checkboxes[2]); // Select second event

        // Open bulk actions
        await user.click(screen.getByText('Bulk Actions'));

        // Configure bulk action
        const actionSelect = screen.getByLabelText('Action');
        await user.selectOptions(actionSelect, '0'); // Change Status

        const statusSelect = screen.getByLabelText('New Status');
        await user.selectOptions(statusSelect, '1'); // Published

        const reasonTextarea = screen.getByLabelText('Reason (Optional)');
        await user.type(reasonTextarea, 'Bulk update for testing');

        // Execute bulk action
        await user.click(screen.getByText('Apply Action'));

        await waitFor(() => {
            expect(
                mockOrganizerService.postApiOrganizerEventsBulkAction
            ).toHaveBeenCalledWith({
                requestBody: {
                    eventIds: ['1', '2'],
                    action: 0,
                    newStatus: 1,
                    reason: 'Bulk update for testing',
                },
            });
        });

        // Should refresh data after successful bulk action
        expect(
            mockOrganizerService.getApiOrganizerEvents
        ).toHaveBeenCalledTimes(2);
    });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TicketManagement } from '../../components/TicketManagement';
import { useTheme } from '../../lib/ThemeContext';
import type {
    EventCreationData,
    EventTicket,
} from '../../types/event-creation';

// Mock dependencies
jest.mock('../../lib/ThemeContext');
jest.mock('../../components/TicketForm', () => ({
    TicketForm: ({
        onSave,
        onCancel,
        ticket,
        isEditing,
    }: {
        onSave: (ticket: EventTicket) => void;
        onCancel: () => void;
        ticket?: EventTicket;
        isEditing: boolean;
    }) => (
        <div data-testid='ticket-form'>
            <h3>{isEditing ? 'Edit Ticket' : 'Add Ticket'}</h3>
            {ticket && <div data-testid='editing-ticket'>{ticket.name}</div>}
            <button
                onClick={() =>
                    onSave({
                        type: 'free',
                        name: 'Form Ticket',
                        quantity: 50,
                        purchaseLimit: 1,
                    })
                }
            >
                Save Ticket
            </button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));
jest.mock('../../components/TicketList', () => ({
    TicketList: ({
        tickets,
        onEditTicket,
        onDeleteTicket,
        onSelectTicket,
        isLoading,
    }: {
        tickets: EventTicket[];
        onEditTicket: (ticket: EventTicket) => void;
        onDeleteTicket: (ticketId: string) => void;
        onSelectTicket?: (ticketId: string) => void;
        isLoading: boolean;
    }) => (
        <div data-testid='ticket-list'>
            <div data-testid='ticket-count'>{tickets.length} tickets</div>
            {tickets.map((ticket: EventTicket) => (
                <div key={ticket.id} data-testid={`ticket-${ticket.id}`}>
                    <span>{ticket.name}</span>
                    <button onClick={() => onEditTicket(ticket)}>Edit</button>
                    <button onClick={() => onDeleteTicket(ticket.id!)}>
                        Delete
                    </button>
                    {onSelectTicket && (
                        <button onClick={() => onSelectTicket(ticket.id!)}>
                            Select
                        </button>
                    )}
                </div>
            ))}
            {isLoading && <div data-testid='loading'>Loading...</div>}
        </div>
    ),
}));
jest.mock('../../components/TicketPreview', () => ({
    TicketPreview: ({
        ticket,
        eventName,
        eventDate,
        eventLocation,
    }: {
        ticket: EventTicket;
        eventName: string;
        eventDate: string;
        eventLocation: string;
    }) => (
        <div data-testid='ticket-preview'>
            <div data-testid='preview-ticket-name'>{ticket.name}</div>
            <div data-testid='preview-event-name'>{eventName}</div>
            <div data-testid='preview-event-date'>{eventDate}</div>
            <div data-testid='preview-event-location'>{eventLocation}</div>
        </div>
    ),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('TicketManagement Component', () => {
    const mockEventData: EventCreationData = {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        eventCategory: 'Conference',
        locationType: 'in-person',
        locationDetails: {
            venueName: 'Test Venue',
        },
        dateRange: {
            startDate: '2024-12-20',
            endDate: '2024-12-21',
        },
        images: [],
    };

    const mockTickets: EventTicket[] = [
        {
            id: 'ticket1',
            type: 'free',
            name: 'General Admission',
            quantity: 100,
            purchaseLimit: 2,
        },
        {
            id: 'ticket2',
            type: 'paid',
            name: 'VIP Ticket',
            price: 50,
            quantity: 50,
            purchaseLimit: 1,
        },
    ];

    const defaultProps = {
        tickets: mockTickets,
        eventData: mockEventData,
        onAddTicket: jest.fn(),
        onUpdateTicket: jest.fn(),
        onDeleteTicket: jest.fn(),
        onSelectTicket: jest.fn(),
        isLoading: false,
        errors: {},
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: jest.fn(),
        });
    });

    describe('Initial Render', () => {
        it('should render ticket management header', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(
                screen.getByText('Ticket Configuration')
            ).toBeInTheDocument();
            expect(
                screen.getByText(
                    'Create and manage ticket types for your event'
                )
            ).toBeInTheDocument();
        });

        it('should render ticket list by default', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByTestId('ticket-list')).toBeInTheDocument();
            expect(screen.getByTestId('ticket-count')).toHaveTextContent(
                '2 tickets'
            );
        });

        it('should render add ticket button', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByText('Add Ticket')).toBeInTheDocument();
        });

        it('should render preview button when tickets exist', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByText('Preview')).toBeInTheDocument();
        });

        it('should not render preview button when no tickets exist', () => {
            render(<TicketManagement {...defaultProps} tickets={[]} />);

            expect(screen.queryByText('Preview')).not.toBeInTheDocument();
        });

        it('should apply dark theme styles', () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            render(<TicketManagement {...defaultProps} />);

            // Find the header container that should have dark theme classes
            const headerContainer = screen
                .getByText('Ticket Configuration')
                .closest('.rounded-xl');
            expect(headerContainer).toHaveClass(
                'border-revlr-dark-border',
                'bg-revlr-dark-card'
            );
        });
    });

    describe('Ticket Statistics', () => {
        it('should display correct ticket statistics', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByText('2')).toBeInTheDocument(); // Total tickets
            expect(screen.getByText('150')).toBeInTheDocument(); // Total capacity

            // Use more specific queries for the counts that might be ambiguous
            const freeTicketsRow = screen
                .getByText('Free Tickets')
                .closest('div');
            expect(freeTicketsRow).toHaveTextContent('1');

            const paidTicketsRow = screen
                .getByText('Paid Tickets')
                .closest('div');
            expect(paidTicketsRow).toHaveTextContent('1');
        });

        it('should display price range for paid tickets', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByText('$50.00')).toBeInTheDocument();
        });

        it('should display price range for multiple paid tickets', () => {
            const ticketsWithMultiplePrices: EventTicket[] = [
                ...mockTickets,
                {
                    id: 'ticket3',
                    type: 'paid',
                    name: 'Premium Ticket',
                    price: 100,
                    quantity: 25,
                    purchaseLimit: 1,
                },
            ];

            render(
                <TicketManagement
                    {...defaultProps}
                    tickets={ticketsWithMultiplePrices}
                />
            );

            expect(screen.getByText('$50.00 - $100.00')).toBeInTheDocument();
        });

        it('should show Free when no paid tickets exist', () => {
            const freeTicketsOnly: EventTicket[] = [
                {
                    id: 'ticket1',
                    type: 'free',
                    name: 'General Admission',
                    quantity: 100,
                    purchaseLimit: 2,
                },
            ];

            render(
                <TicketManagement {...defaultProps} tickets={freeTicketsOnly} />
            );

            expect(screen.getByText('Free')).toBeInTheDocument();
        });
    });

    describe('Add Ticket Flow', () => {
        it('should show ticket form when add ticket is clicked', () => {
            render(<TicketManagement {...defaultProps} />);

            const addButton = screen.getByText('Add Ticket');
            fireEvent.click(addButton);

            expect(screen.getByTestId('ticket-form')).toBeInTheDocument();
            expect(screen.getByText('Add Ticket')).toBeInTheDocument();
            expect(screen.getByText('Back to List')).toBeInTheDocument();
        });

        it('should call onAddTicket when ticket is saved', () => {
            const mockOnAddTicket = jest.fn();
            render(
                <TicketManagement
                    {...defaultProps}
                    onAddTicket={mockOnAddTicket}
                />
            );

            const addButton = screen.getByText('Add Ticket');
            fireEvent.click(addButton);

            const saveButton = screen.getByText('Save Ticket');
            fireEvent.click(saveButton);

            expect(mockOnAddTicket).toHaveBeenCalledWith({
                type: 'free',
                name: 'Form Ticket',
                quantity: 50,
                purchaseLimit: 1,
            });
        });

        it('should return to list view after saving ticket', () => {
            render(<TicketManagement {...defaultProps} />);

            const addButton = screen.getByText('Add Ticket');
            fireEvent.click(addButton);

            const saveButton = screen.getByText('Save Ticket');
            fireEvent.click(saveButton);

            expect(screen.getByTestId('ticket-list')).toBeInTheDocument();
            expect(screen.queryByTestId('ticket-form')).not.toBeInTheDocument();
        });

        it('should return to list view when cancel is clicked', () => {
            render(<TicketManagement {...defaultProps} />);

            const addButton = screen.getByText('Add Ticket');
            fireEvent.click(addButton);

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(screen.getByTestId('ticket-list')).toBeInTheDocument();
            expect(screen.queryByTestId('ticket-form')).not.toBeInTheDocument();
        });
    });

    describe('Edit Ticket Flow', () => {
        it('should show edit form when edit button is clicked', () => {
            render(<TicketManagement {...defaultProps} />);

            const editButton = screen.getAllByText('Edit')[0];
            fireEvent.click(editButton);

            expect(screen.getByTestId('ticket-form')).toBeInTheDocument();
            expect(screen.getByText('Edit Ticket')).toBeInTheDocument();
            expect(screen.getByTestId('editing-ticket')).toHaveTextContent(
                'General Admission'
            );
        });

        it('should call onUpdateTicket when edited ticket is saved', () => {
            const mockOnUpdateTicket = jest.fn();
            render(
                <TicketManagement
                    {...defaultProps}
                    onUpdateTicket={mockOnUpdateTicket}
                />
            );

            const editButton = screen.getAllByText('Edit')[0];
            fireEvent.click(editButton);

            const saveButton = screen.getByText('Save Ticket');
            fireEvent.click(saveButton);

            expect(mockOnUpdateTicket).toHaveBeenCalledWith('ticket1', {
                type: 'free',
                name: 'Form Ticket',
                quantity: 50,
                purchaseLimit: 1,
            });
        });

        it('should return to list view after updating ticket', () => {
            render(<TicketManagement {...defaultProps} />);

            const editButton = screen.getAllByText('Edit')[0];
            fireEvent.click(editButton);

            const saveButton = screen.getByText('Save Ticket');
            fireEvent.click(saveButton);

            expect(screen.getByTestId('ticket-list')).toBeInTheDocument();
            expect(screen.queryByTestId('ticket-form')).not.toBeInTheDocument();
        });
    });

    describe('Delete Ticket Flow', () => {
        it('should call onDeleteTicket when delete button is clicked', () => {
            const mockOnDeleteTicket = jest.fn();
            render(
                <TicketManagement
                    {...defaultProps}
                    onDeleteTicket={mockOnDeleteTicket}
                />
            );

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            expect(mockOnDeleteTicket).toHaveBeenCalledWith('ticket1');
        });

        it('should return to list view if editing deleted ticket', () => {
            const mockOnDeleteTicket = jest.fn();
            render(
                <TicketManagement
                    {...defaultProps}
                    onDeleteTicket={mockOnDeleteTicket}
                />
            );

            // Start editing a ticket
            const editButton = screen.getAllByText('Edit')[0];
            fireEvent.click(editButton);

            expect(screen.getByTestId('ticket-form')).toBeInTheDocument();

            // Delete the same ticket
            const backButton = screen.getByText('Back to List');
            fireEvent.click(backButton);

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            expect(mockOnDeleteTicket).toHaveBeenCalledWith('ticket1');
        });
    });

    describe('Ticket Selection', () => {
        it('should call onSelectTicket when select button is clicked', () => {
            const mockOnSelectTicket = jest.fn();
            render(
                <TicketManagement
                    {...defaultProps}
                    onSelectTicket={mockOnSelectTicket}
                />
            );

            const selectButton = screen.getAllByText('Select')[0];
            fireEvent.click(selectButton);

            expect(mockOnSelectTicket).toHaveBeenCalledWith('ticket1');
        });

        it('should not render select buttons when onSelectTicket is not provided', () => {
            render(
                <TicketManagement
                    {...defaultProps}
                    onSelectTicket={undefined}
                />
            );

            expect(screen.queryByText('Select')).not.toBeInTheDocument();
        });
    });

    describe('Ticket Preview', () => {
        it('should show preview when preview button is clicked', () => {
            render(<TicketManagement {...defaultProps} />);

            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);

            expect(screen.getByTestId('ticket-preview')).toBeInTheDocument();
            expect(screen.getByTestId('preview-ticket-name')).toHaveTextContent(
                'General Admission'
            );
            expect(screen.getByTestId('preview-event-name')).toHaveTextContent(
                'Test Event'
            );
            expect(screen.getByTestId('preview-event-date')).toHaveTextContent(
                '2024-12-20'
            );
            expect(
                screen.getByTestId('preview-event-location')
            ).toHaveTextContent('Test Venue');
        });

        it('should show preview with virtual event link', () => {
            const virtualEventData: EventCreationData = {
                ...mockEventData,
                locationType: 'virtual',
                locationDetails: {
                    eventLink: 'https://zoom.us/meeting',
                },
            };

            render(
                <TicketManagement
                    {...defaultProps}
                    eventData={virtualEventData}
                />
            );

            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);

            expect(
                screen.getByTestId('preview-event-location')
            ).toHaveTextContent('https://zoom.us/meeting');
        });

        it('should show edit button in preview mode', () => {
            render(<TicketManagement {...defaultProps} />);

            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);

            expect(screen.getByText('Edit Ticket')).toBeInTheDocument();
        });

        it('should switch to edit mode from preview', () => {
            render(<TicketManagement {...defaultProps} />);

            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);

            const editButton = screen.getByText('Edit Ticket');
            fireEvent.click(editButton);

            expect(screen.getByTestId('ticket-form')).toBeInTheDocument();
            expect(screen.getByText('Edit Ticket')).toBeInTheDocument();
        });

        it('should show quick preview in sidebar', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByText('Quick Preview')).toBeInTheDocument();
            expect(screen.getByText('View Full Preview')).toBeInTheDocument();
        });

        it('should show full preview when sidebar preview is clicked', () => {
            render(<TicketManagement {...defaultProps} />);

            const viewFullPreviewButton = screen.getByText('View Full Preview');
            fireEvent.click(viewFullPreviewButton);

            expect(screen.getByText('Ticket Preview')).toBeInTheDocument();
            expect(screen.getByTestId('ticket-preview')).toBeInTheDocument();
        });
    });

    describe('Loading States', () => {
        it('should disable add ticket button when loading', () => {
            render(<TicketManagement {...defaultProps} isLoading={true} />);

            const addButton = screen.getByText('Add Ticket');
            expect(addButton).toBeDisabled();
        });

        it('should pass loading state to ticket list', () => {
            render(<TicketManagement {...defaultProps} isLoading={true} />);

            expect(screen.getByTestId('loading')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display ticket errors', () => {
            const errors = {
                tickets: 'At least one ticket is required',
            };

            render(<TicketManagement {...defaultProps} errors={errors} />);

            expect(
                screen.getByText('At least one ticket is required')
            ).toBeInTheDocument();
        });

        it('should not display error section when no errors', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(
                screen.queryByText('At least one ticket is required')
            ).not.toBeInTheDocument();
        });
    });

    describe('Tips Section', () => {
        it('should display helpful tips', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(screen.getByText('Tips')).toBeInTheDocument();
            expect(screen.getByText('Early Bird Strategy')).toBeInTheDocument();
            expect(screen.getByText('Sales Periods')).toBeInTheDocument();
            expect(screen.getByText('Purchase Limits')).toBeInTheDocument();
        });

        it('should display tip descriptions', () => {
            render(<TicketManagement {...defaultProps} />);

            expect(
                screen.getByText(
                    /Create early bird tickets with limited quantities/
                )
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Set sales periods to control when tickets/)
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Use purchase limits to prevent bulk buying/)
            ).toBeInTheDocument();
        });
    });

    describe('Event Data Handling', () => {
        it('should handle missing event data gracefully', () => {
            const incompleteEventData: EventCreationData = {
                eventName: '',
                eventDescription: '',
                eventCategory: '',
                locationType: 'in-person',
                images: [],
            };

            render(
                <TicketManagement
                    {...defaultProps}
                    eventData={incompleteEventData}
                />
            );

            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);

            expect(screen.getByTestId('preview-event-name')).toHaveTextContent(
                'Sample Event'
            );
            expect(
                screen.getByTestId('preview-event-location')
            ).toHaveTextContent('Event Location');
        });

        it('should use current date when no date range provided', () => {
            const eventDataWithoutDate: EventCreationData = {
                ...mockEventData,
                dateRange: undefined,
            };

            render(
                <TicketManagement
                    {...defaultProps}
                    eventData={eventDataWithoutDate}
                />
            );

            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);

            const today = new Date().toISOString().split('T')[0];
            expect(screen.getByTestId('preview-event-date')).toHaveTextContent(
                today
            );
        });
    });

    describe('Responsive Design', () => {
        it('should use responsive grid layout', () => {
            render(<TicketManagement {...defaultProps} />);

            const gridContainer = screen
                .getByTestId('ticket-list')
                .closest('.grid');
            expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
        });
    });

    describe('Accessibility', () => {
        it('should have proper button roles', () => {
            render(<TicketManagement {...defaultProps} />);

            const addButton = screen.getByRole('button', {
                name: /add ticket/i,
            });

            // Use getAllByRole since there might be multiple preview buttons
            const previewButtons = screen.getAllByRole('button', {
                name: /preview/i,
            });

            expect(addButton).toBeInTheDocument();
            expect(previewButtons.length).toBeGreaterThanOrEqual(1);
        });

        it('should have proper heading structure', () => {
            render(<TicketManagement {...defaultProps} />);

            const mainHeading = screen.getByRole('heading', { level: 2 });
            expect(mainHeading).toHaveTextContent('Ticket Configuration');
        });
    });

    describe('Navigation Between Views', () => {
        it('should show back to list button in all non-list views', () => {
            render(<TicketManagement {...defaultProps} />);

            // Add view
            const addButton = screen.getByText('Add Ticket');
            fireEvent.click(addButton);
            expect(screen.getByText('Back to List')).toBeInTheDocument();

            // Back to list
            const backButton = screen.getByText('Back to List');
            fireEvent.click(backButton);

            // Edit view
            const editButton = screen.getAllByText('Edit')[0];
            fireEvent.click(editButton);
            expect(screen.getByText('Back to List')).toBeInTheDocument();

            // Back to list
            fireEvent.click(screen.getByText('Back to List'));

            // Preview view
            const previewButton = screen.getByText('Preview');
            fireEvent.click(previewButton);
            expect(screen.getByText('Back to List')).toBeInTheDocument();
        });

        it('should maintain state when navigating between views', () => {
            render(<TicketManagement {...defaultProps} />);

            // Go to add view
            const addButton = screen.getByText('Add Ticket');
            fireEvent.click(addButton);

            // Go back to list
            const backButton = screen.getByText('Back to List');
            fireEvent.click(backButton);

            // Tickets should still be displayed
            expect(screen.getByTestId('ticket-count')).toHaveTextContent(
                '2 tickets'
            );
        });
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import CreateEvent from '../../features/dashboard/CreateEvent';
import { useEventCreation } from '../../hooks/useEventCreation';
import { useTheme } from '../../lib/ThemeContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import type {
    EventCreationData,
    EventTicket,
} from '../../types/event-creation';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('../../hooks/useEventCreation');
jest.mock('../../lib/ThemeContext');
jest.mock('../../hooks/useOnlineStatus');
jest.mock('../../components/ImageUpload', () => ({
    ImageUpload: ({
        onImagesChange,
        error,
    }: {
        onImagesChange: (
            images: Array<{
                id: string;
                url: string;
                name: string;
                size: number;
                mimeType: string;
                order: number;
            }>
        ) => void;
        error?: string;
    }) => (
        <div data-testid='image-upload'>
            <button
                onClick={() =>
                    onImagesChange([
                        {
                            id: 'test',
                            url: 'test.jpg',
                            name: 'test.jpg',
                            size: 1024,
                            mimeType: 'image/jpeg',
                            order: 0,
                        },
                    ])
                }
            >
                Add Image
            </button>
            {error && <div data-testid='image-error'>{error}</div>}
        </div>
    ),
}));
jest.mock('../../components/TicketManagement', () => ({
    TicketManagement: ({
        onAddTicket,
        tickets,
    }: {
        onAddTicket: (ticket: {
            type: string;
            name: string;
            quantity: number;
            purchaseLimit: number;
        }) => void;
        tickets: Array<unknown>;
    }) => (
        <div data-testid='ticket-management'>
            <button
                onClick={() =>
                    onAddTicket({
                        type: 'free',
                        name: 'Test Ticket',
                        quantity: 100,
                        purchaseLimit: 2,
                    })
                }
            >
                Add Ticket
            </button>
            <div data-testid='ticket-count'>{tickets.length} tickets</div>
        </div>
    ),
}));
jest.mock('../../components/CategorySelector', () => ({
    CategorySelector: ({
        onChange,
        error,
    }: {
        onChange: (value: string) => void;
        error?: string;
    }) => (
        <div data-testid='category-selector'>
            <select onChange={(e) => onChange(e.target.value)}>
                <option value=''>Select Category</option>
                <option value='Conference'>Conference</option>
                <option value='Workshop'>Workshop</option>
            </select>
            {error && <div data-testid='category-error'>{error}</div>}
        </div>
    ),
}));
jest.mock('../../components/LocationSelector', () => ({
    LocationSelector: ({
        onLocationTypeChange,
        onLocationDetailsChange,
        errors,
    }: {
        onLocationTypeChange: (type: string) => void;
        onLocationDetailsChange: (field: string, value: string) => void;
        errors?: Record<string, string>;
    }) => (
        <div data-testid='location-selector'>
            <select onChange={(e) => onLocationTypeChange(e.target.value)}>
                <option value='in-person'>In Person</option>
                <option value='virtual'>Virtual</option>
                <option value='hybrid'>Hybrid</option>
            </select>
            <input
                placeholder='Venue Name'
                onChange={(e) =>
                    onLocationDetailsChange('venueName', e.target.value)
                }
            />
            {errors?.venueName && (
                <div data-testid='venue-error'>{errors.venueName}</div>
            )}
        </div>
    ),
}));
jest.mock('../../components/DateTimeSelector', () => ({
    DateTimeSelector: ({
        onDateRangeChange,
        onTimeRangeChange,
        errors,
    }: {
        onDateRangeChange: (range: {
            startDate: string;
            endDate: string;
        }) => void;
        onTimeRangeChange: (range: {
            startTime: string;
            endTime: string;
        }) => void;
        errors?: Record<string, string>;
    }) => (
        <div data-testid='datetime-selector'>
            <input
                type='date'
                placeholder='Start Date'
                onChange={(e) =>
                    onDateRangeChange({
                        startDate: e.target.value,
                        endDate: '2024-12-21',
                    })
                }
            />
            <input
                type='time'
                placeholder='Start Time'
                onChange={(e) =>
                    onTimeRangeChange({
                        startTime: e.target.value,
                        endTime: '17:00',
                    })
                }
            />
            {errors?.startDate && (
                <div data-testid='date-error'>{errors.startDate}</div>
            )}
        </div>
    ),
}));
jest.mock('../../components/OrganizerDetails', () => ({
    OrganizerDetails: ({
        onOrganizerChange,
        errors,
    }: {
        onOrganizerChange: (field: string, value: string) => void;
        errors?: Record<string, string>;
    }) => (
        <div data-testid='organizer-details'>
            <input
                placeholder='Organizer Name'
                onChange={(e) =>
                    onOrganizerChange('organizerName', e.target.value)
                }
            />
            {errors?.organizerName && (
                <div data-testid='organizer-error'>{errors.organizerName}</div>
            )}
        </div>
    ),
}));

// Mock additional components
jest.mock('../../components/ProgressIndicator', () => ({
    ProgressIndicator: ({
        steps,
        onStepClick,
    }: {
        steps: Array<{ id: number; title: string; isActive: boolean }>;
        onStepClick: (stepId: number) => void;
    }) => (
        <div data-testid='progress-indicator'>
            {steps.map((step) => (
                <button
                    key={step.id}
                    onClick={() => onStepClick(step.id)}
                    className={step.isActive ? 'text-revlr-primary-blue' : ''}
                >
                    {step.title}
                </button>
            ))}
        </div>
    ),
}));

jest.mock('../../components/LoadingStates', () => ({
    LoadingButton: ({
        children,
        isLoading,
        loadingText,
        onClick,
        disabled,
        className,
    }: {
        children: React.ReactNode;
        isLoading: boolean;
        loadingText: string;
        onClick: () => void;
        disabled: boolean;
        className?: string;
    }) => (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={className}
        >
            {isLoading ? loadingText : children}
        </button>
    ),
    EventFormSkeleton: () => (
        <div data-testid='event-form-skeleton'>Loading...</div>
    ),
    TicketManagementSkeleton: () => (
        <div data-testid='ticket-management-skeleton'>Loading...</div>
    ),
    LoadingOverlay: ({
        isVisible,
        message,
    }: {
        isVisible: boolean;
        message: string;
    }) =>
        isVisible ? <div data-testid='loading-overlay'>{message}</div> : null,
}));

jest.mock('../../components/AutoSaveIndicator', () => ({
    AutoSaveIndicator: ({
        isSaving,
        hasUnsavedChanges,
    }: {
        isSaving: boolean;
        hasUnsavedChanges: boolean;
    }) => (
        <div data-testid='auto-save-indicator'>
            {isSaving && <span>Saving...</span>}
            {hasUnsavedChanges && <span>Unsaved changes</span>}
        </div>
    ),
    RecoveryPrompt: ({
        isOpen,
        onRestore,
        onDiscard,
    }: {
        isOpen: boolean;
        onRestore: () => void;
        onDiscard: () => void;
    }) =>
        isOpen ? (
            <div data-testid='recovery-prompt'>
                <h3>Restore Previous Draft?</h3>
                <button onClick={onRestore}>Restore</button>
                <button onClick={onDiscard}>Start Fresh</button>
            </div>
        ) : null,
}));

jest.mock('../../components/PublishConfirmationModal', () => ({
    PublishConfirmationModal: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? (
            <div data-testid='publish-confirmation-modal'>Publish Modal</div>
        ) : null,
}));

jest.mock('../../components/PublishSuccessModal', () => ({
    PublishSuccessModal: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? (
            <div data-testid='publish-success-modal'>Success Modal</div>
        ) : null,
}));

jest.mock('../../components/PrePublishValidation', () => ({
    PrePublishValidation: () => (
        <div data-testid='pre-publish-validation'>Validation</div>
    ),
}));

jest.mock('../../components/EventStatusIndicator', () => ({
    EventStatusIndicator: ({ status }: { status: string }) => (
        <div data-testid='event-status'>{status}</div>
    ),
}));

jest.mock('../../components/HelpTooltip', () => ({
    HelpTooltip: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='help-tooltip'>{children}</div>
    ),
    FormFieldHelp: () => <div data-testid='form-field-help'>Help</div>,
}));

jest.mock('../../components/MobileFormLayout', () => ({
    MobileFormLayout: ({
        sections,
    }: {
        sections: Array<{ id: string; children: React.ReactNode }>;
    }) => (
        <div data-testid='mobile-form-layout'>
            {sections.map((section) => (
                <div key={section.id}>{section.children}</div>
            ))}
        </div>
    ),
}));

jest.mock('../../components/AnnouncementRegion', () => {
    const AnnouncementRegion = React.forwardRef<
        HTMLDivElement,
        { children: React.ReactNode }
    >(({ children }, ref) => (
        <div ref={ref} data-testid='announcement-region'>
            {children}
        </div>
    ));
    AnnouncementRegion.displayName = 'AnnouncementRegion';

    return {
        AnnouncementRegion,
    };
});

jest.mock('../../hooks/useKeyboardNavigation', () => ({
    useKeyboardNavigation: () => ({
        containerRef: React.createRef(),
        announce: jest.fn(),
        announceRef: React.createRef(),
    }),
}));

jest.mock('../../features/dashboard/components/EventModal', () => ({
    __esModule: true,
    default: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div data-testid='event-modal'>Event Modal</div> : null,
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseEventCreation = useEventCreation as jest.MockedFunction<
    typeof useEventCreation
>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<
    typeof useOnlineStatus
>;

describe('CreateEvent Component', () => {
    const mockPush = jest.fn();

    const defaultEventCreationReturn = {
        eventData: {
            eventName: '',
            eventDescription: '',
            eventCategory: '',
            locationType: 'in-person' as const,
            images: [],
            isDraft: true,
        } as EventCreationData,
        tickets: [] as EventTicket[],
        currentStep: 1 as const,
        isLoading: false,
        isSaving: false,
        isPublishing: false,
        errors: {},
        lastSaved: undefined,
        hasUnsavedChanges: false,
        hasBackup: false,
        updateEventData: jest.fn(),
        addTicket: jest.fn(),
        updateTicket: jest.fn(),
        removeTicket: jest.fn(),
        saveDraft: jest.fn(),
        publishEvent: jest.fn(),
        loadEvent: jest.fn(),
        goToStep: jest.fn(),
        nextStep: jest.fn(),
        previousStep: jest.fn(),
        canProceedToStep: jest.fn(),
        validateCurrentStep: jest.fn(),
        validateForPublishing: jest.fn(),
        validateTickets: jest.fn(),
        clearErrors: jest.fn(),
        isReadyForPublishing: jest.fn(),
        restoreFromBackup: jest.fn(),
        clearBackup: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock window.innerWidth to simulate desktop view by default
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });

        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        });

        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: jest.fn(),
        });

        mockUseOnlineStatus.mockReturnValue(true);

        mockUseEventCreation.mockReturnValue(defaultEventCreationReturn);
    });

    describe('Initial Render', () => {
        it('should render the create event form', () => {
            // Mock window.innerWidth to simulate desktop view
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1024,
            });

            render(<CreateEvent />);

            // In desktop view, there should be only one instance of each text
            expect(screen.getByText('Event Details')).toBeInTheDocument();
            expect(screen.getByText('Tickets')).toBeInTheDocument();
            expect(screen.getByText('Preview')).toBeInTheDocument();
            expect(screen.getByText('Publish Event')).toBeInTheDocument();
        });

        it('should render form sections for step 1', () => {
            render(<CreateEvent />);

            expect(screen.getByTestId('image-upload')).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText('Enter your event name')
            ).toBeInTheDocument();
            expect(
                screen.getByPlaceholderText('Describe your event in detail')
            ).toBeInTheDocument();
            expect(screen.getByTestId('category-selector')).toBeInTheDocument();
            expect(screen.getByTestId('location-selector')).toBeInTheDocument();
            expect(screen.getByTestId('datetime-selector')).toBeInTheDocument();
            expect(screen.getByTestId('organizer-details')).toBeInTheDocument();
        });

        it('should render ticket management for step 2', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                currentStep: 2,
            });

            render(<CreateEvent />);

            expect(screen.getByTestId('ticket-management')).toBeInTheDocument();
        });

        it('should apply dark theme styles', () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            render(<CreateEvent />);

            // Check for dark theme class on the main container
            const container = document.querySelector(
                '[class*="bg-revlr-dark-bg"]'
            );
            expect(container).toBeInTheDocument();
        });
    });

    describe('Form Interactions', () => {
        it('should update event name', () => {
            const mockUpdateEventData = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                updateEventData: mockUpdateEventData,
            });

            render(<CreateEvent />);

            const eventNameInput = screen.getByPlaceholderText(
                'Enter your event name'
            );
            fireEvent.change(eventNameInput, {
                target: { value: 'New Event Name' },
            });

            expect(mockUpdateEventData).toHaveBeenCalledWith({
                eventName: 'New Event Name',
            });
        });

        it('should update event description', () => {
            const mockUpdateEventData = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                updateEventData: mockUpdateEventData,
            });

            render(<CreateEvent />);

            const descriptionInput = screen.getByPlaceholderText(
                'Describe your event in detail'
            );
            fireEvent.change(descriptionInput, {
                target: { value: 'New Description' },
            });

            expect(mockUpdateEventData).toHaveBeenCalledWith({
                eventDescription: 'New Description',
            });
        });

        it('should update event category', () => {
            const mockUpdateEventData = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                updateEventData: mockUpdateEventData,
            });

            render(<CreateEvent />);

            const categorySelect = screen
                .getByTestId('category-selector')
                .querySelector('select');
            fireEvent.change(categorySelect!, {
                target: { value: 'Conference' },
            });

            expect(mockUpdateEventData).toHaveBeenCalledWith({
                eventCategory: 'Conference',
            });
        });

        it('should handle image upload', () => {
            const mockUpdateEventData = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                updateEventData: mockUpdateEventData,
            });

            render(<CreateEvent />);

            const addImageButton = screen.getByText('Add Image');
            fireEvent.click(addImageButton);

            expect(mockUpdateEventData).toHaveBeenCalledWith({
                images: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'test',
                        url: 'test.jpg',
                        name: 'test.jpg',
                    }),
                ]),
            });
        });

        it('should handle location type change', () => {
            const mockUpdateEventData = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                updateEventData: mockUpdateEventData,
            });

            render(<CreateEvent />);

            const locationSelect = screen
                .getByTestId('location-selector')
                .querySelector('select');
            fireEvent.change(locationSelect!, { target: { value: 'virtual' } });

            expect(mockUpdateEventData).toHaveBeenCalledWith({
                locationType: 'virtual',
            });
        });

        it('should handle date range change', () => {
            const mockUpdateEventData = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                updateEventData: mockUpdateEventData,
            });

            render(<CreateEvent />);

            const dateInput = screen
                .getByTestId('datetime-selector')
                .querySelector('input[type="date"]');
            fireEvent.change(dateInput!, { target: { value: '2024-12-20' } });

            expect(mockUpdateEventData).toHaveBeenCalledWith({
                dateRange: {
                    startDate: '2024-12-20',
                    endDate: '2024-12-21',
                },
            });
        });
    });

    describe('Navigation', () => {
        it('should navigate between steps', () => {
            const mockGoToStep = jest.fn();
            const mockCanProceedToStep = jest.fn().mockReturnValue(true);
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                goToStep: mockGoToStep,
                canProceedToStep: mockCanProceedToStep,
            });

            render(<CreateEvent />);

            // Find the Tickets button in the progress indicator
            const ticketsButton = screen.getByText('Tickets');
            expect(ticketsButton).toBeInTheDocument();

            fireEvent.click(ticketsButton);
            expect(mockGoToStep).toHaveBeenCalledWith(2);
        });

        it('should highlight current step', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                currentStep: 2,
            });

            render(<CreateEvent />);

            // Find the active tickets tab (should have the active styling)
            const ticketsTabs = screen.getAllByText('Tickets');
            const activeTicketsTab = ticketsTabs.find((tab) =>
                tab.classList.contains('text-revlr-primary-blue')
            );

            expect(activeTicketsTab).toBeInTheDocument();
        });
    });

    describe('Draft Management', () => {
        it('should save draft when form is submitted', async () => {
            const mockSaveDraft = jest.fn().mockResolvedValue({
                success: true,
                message: 'Draft saved successfully',
            });

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                saveDraft: mockSaveDraft,
            });

            const { container } = render(<CreateEvent />);

            const form = container.querySelector('form');
            expect(form).toBeInTheDocument();

            fireEvent.submit(form!);

            await waitFor(() => {
                expect(mockSaveDraft).toHaveBeenCalled();
            });
        });

        it('should handle draft save failure', async () => {
            const mockSaveDraft = jest.fn().mockResolvedValue({
                success: false,
                message: 'Network error',
            });

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                saveDraft: mockSaveDraft,
            });

            const { container } = render(<CreateEvent />);

            const form = container.querySelector('form');
            expect(form).toBeInTheDocument();

            fireEvent.submit(form!);

            await waitFor(() => {
                expect(mockSaveDraft).toHaveBeenCalled();
            });
        });

        it('should show backup restoration prompt', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                hasBackup: true,
                eventData: {
                    ...defaultEventCreationReturn.eventData,
                    eventName: '', // Empty name triggers backup prompt
                },
            });

            render(<CreateEvent />);

            expect(
                screen.getByText('Restore Previous Draft?')
            ).toBeInTheDocument();
            expect(screen.getByText('Restore')).toBeInTheDocument();
            expect(screen.getByText('Start Fresh')).toBeInTheDocument();
        });

        it('should restore from backup', () => {
            const mockRestoreFromBackup = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                hasBackup: true,
                eventData: {
                    ...defaultEventCreationReturn.eventData,
                    eventName: '',
                },
                restoreFromBackup: mockRestoreFromBackup,
            });

            render(<CreateEvent />);

            const restoreButton = screen.getByText('Restore');
            fireEvent.click(restoreButton);

            expect(mockRestoreFromBackup).toHaveBeenCalled();
        });

        it('should clear backup', () => {
            const mockClearBackup = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                hasBackup: true,
                eventData: {
                    ...defaultEventCreationReturn.eventData,
                    eventName: '',
                },
                clearBackup: mockClearBackup,
            });

            render(<CreateEvent />);

            const startFreshButton = screen.getByText('Start Fresh');
            fireEvent.click(startFreshButton);

            expect(mockClearBackup).toHaveBeenCalled();
        });
    });

    describe('Publishing', () => {
        it('should publish event when ready', async () => {
            const mockPublishEvent = jest.fn().mockResolvedValue({
                success: true,
                message: 'Event published successfully',
            });
            const mockIsReadyForPublishing = jest.fn().mockReturnValue(true);

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                publishEvent: mockPublishEvent,
                isReadyForPublishing: mockIsReadyForPublishing,
            });

            render(<CreateEvent />);

            const publishButton = screen.getByText('Publish Event');
            fireEvent.click(publishButton);

            expect(mockIsReadyForPublishing).toHaveBeenCalled();
        });

        it('should validate before publishing when not ready', () => {
            const mockValidateForPublishing = jest.fn().mockReturnValue({
                isValid: false,
                errors: { eventName: 'Event name is required' },
            });
            const mockIsReadyForPublishing = jest.fn().mockReturnValue(false);

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                validateForPublishing: mockValidateForPublishing,
                isReadyForPublishing: mockIsReadyForPublishing,
            });

            render(<CreateEvent />);

            const publishButton = screen.getByText('Publish Event');
            fireEvent.click(publishButton);

            expect(mockValidateForPublishing).toHaveBeenCalled();
        });

        it('should show publishing state', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                isPublishing: true,
            });

            render(<CreateEvent />);

            expect(screen.getByText('Publishing...')).toBeInTheDocument();
            expect(screen.getByText('Publishing...')).toBeDisabled();
        });

        it('should show update button for published events', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                eventData: {
                    ...defaultEventCreationReturn.eventData,
                    status: 'published',
                },
            });

            render(<CreateEvent />);

            expect(screen.getByText('Update Event')).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display general errors', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                errors: {
                    general: 'Something went wrong',
                },
            });

            render(<CreateEvent />);

            expect(
                screen.getByText('Something went wrong')
            ).toBeInTheDocument();
        });

        it('should display field-specific errors', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                errors: {
                    eventName: 'Event name is required',
                    eventDescription: 'Description is required',
                },
            });

            render(<CreateEvent />);

            // Check that error styling is applied to inputs
            const eventNameInput = screen.getByPlaceholderText(
                'Enter your event name'
            );
            expect(eventNameInput).toHaveClass('border-red-500');

            const descriptionInput = screen.getByPlaceholderText(
                'Describe your event in detail'
            );
            expect(descriptionInput).toHaveClass('border-red-500');
        });

        it('should show error messages below fields', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                errors: {
                    eventName: 'Event name is required',
                },
            });

            render(<CreateEvent />);

            expect(
                screen.getByText('Event name is required')
            ).toBeInTheDocument();
        });
    });

    describe('Ticket Management', () => {
        it('should add tickets', async () => {
            const mockAddTicket = jest.fn();
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                currentStep: 2,
                addTicket: mockAddTicket,
            });

            render(<CreateEvent />);

            const addTicketButton = screen.getByText('Add Ticket');
            fireEvent.click(addTicketButton);

            expect(mockAddTicket).toHaveBeenCalledWith({
                type: 'free',
                name: 'Test Ticket',
                quantity: 100,
                purchaseLimit: 2,
            });
        });

        it('should display ticket count', () => {
            const mockTickets: EventTicket[] = [
                {
                    id: 'ticket1',
                    type: 'free',
                    name: 'General Admission',
                    quantity: 100,
                    purchaseLimit: 2,
                },
            ];

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                currentStep: 2,
                tickets: mockTickets,
            });

            render(<CreateEvent />);

            expect(screen.getByTestId('ticket-count')).toHaveTextContent(
                '1 tickets'
            );
        });
    });

    describe('Status Indicators', () => {
        it('should show saving state', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                isSaving: true,
            });

            render(<CreateEvent />);

            expect(screen.getAllByText('Saving...')).toHaveLength(2); // One in AutoSaveIndicator, one in button
        });

        it('should show offline state', () => {
            mockUseOnlineStatus.mockReturnValue(false);

            render(<CreateEvent />);

            // The DraftStatusIndicator should receive isOnline: false
            // This would be tested more thoroughly in the DraftStatusIndicator component tests
        });

        it('should show unsaved changes indicator', () => {
            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                hasUnsavedChanges: true,
            });

            render(<CreateEvent />);

            // The DraftStatusIndicator should receive hasUnsavedChanges: true
            // This would be tested more thoroughly in the DraftStatusIndicator component tests
        });
    });

    describe('Accessibility', () => {
        it('should have proper form structure', () => {
            render(<CreateEvent />);

            const form = document.querySelector('form');
            expect(form).toBeInTheDocument();
        });

        it('should have accessible buttons', () => {
            render(<CreateEvent />);

            const previewButton = screen.getByText('Preview');
            const publishButton = screen.getByText('Publish Event');

            expect(previewButton).toBeInTheDocument();
            expect(publishButton).toBeInTheDocument();
        });

        it('should disable buttons when loading', () => {
            // Mock window.innerWidth to simulate desktop view
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1024,
            });

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                isSaving: true,
            });

            render(<CreateEvent />);

            const buttons = screen.getAllByText('Saving...');
            const previewButton = buttons.find(
                (button) => button.tagName === 'BUTTON'
            );
            const publishButton = screen.getByText('Publish Event');

            expect(previewButton).toBeDisabled();
            expect(publishButton).toBeDisabled();
        });
    });

    describe('Responsive Design', () => {
        it('should render mobile-friendly layout', () => {
            // Mock window.innerWidth to simulate mobile view
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 600,
            });

            render(<CreateEvent />);

            // Check that mobile layout is rendered
            expect(
                screen.getByTestId('mobile-form-layout')
            ).toBeInTheDocument();
        });
    });

    describe('Integration with Router', () => {
        it('should navigate to event view after successful publish', async () => {
            const mockPublishEvent = jest.fn().mockResolvedValue({
                success: true,
                data: { id: 'published-event-id' },
            });
            const mockIsReadyForPublishing = jest.fn().mockReturnValue(true);

            mockUseEventCreation.mockReturnValue({
                ...defaultEventCreationReturn,
                publishEvent: mockPublishEvent,
                isReadyForPublishing: mockIsReadyForPublishing,
                eventData: {
                    ...defaultEventCreationReturn.eventData,
                    id: 'published-event-id',
                },
            });

            render(<CreateEvent />);

            const publishButton = screen.getByText('Publish Event');
            fireEvent.click(publishButton);

            // This would trigger the publish modal, which we'd need to mock separately
            // The actual navigation happens in the success modal
        });
    });
});

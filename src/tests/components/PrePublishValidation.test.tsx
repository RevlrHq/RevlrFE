import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrePublishValidation } from '../../components/PrePublishValidation';
import { useTheme } from '../../lib/ThemeContext';
import { EventValidationUtils } from '../../lib/utils/eventValidation';
import type {
    EventCreationData,
    EventTicket,
    ValidationErrors,
} from '../../types/event-creation';

// Mock dependencies
jest.mock('../../lib/ThemeContext');
jest.mock('../../lib/utils/eventValidation');

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockEventValidationUtils = EventValidationUtils as jest.Mocked<
    typeof EventValidationUtils
>;

describe('PrePublishValidation Component', () => {
    const mockEventData: EventCreationData = {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        eventCategory: 'Conference',
        locationType: 'in-person',
        locationDetails: {
            venueName: 'Test Venue',
            address: '123 Test St',
        },
        dateRange: {
            startDate: '2024-12-20',
            endDate: '2024-12-21',
        },
        timeRange: {
            startTime: '09:00',
            endTime: '17:00',
        },
        images: [
            {
                id: 'img1',
                url: 'https://example.com/image.jpg',
                name: 'test.jpg',
                size: 1024,
                mimeType: 'image/jpeg',
                order: 0,
            },
        ],
    };

    const mockTickets: EventTicket[] = [
        {
            id: 'ticket1',
            type: 'free',
            name: 'General Admission',
            quantity: 100,
            purchaseLimit: 2,
        },
    ];

    const defaultProps = {
        eventData: mockEventData,
        tickets: mockTickets,
        errors: {} as ValidationErrors,
        onFixError: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: jest.fn(),
        });

        // Default mock for validation summary
        mockEventValidationUtils.getValidationSummary.mockReturnValue({
            totalErrors: 0,
            errorsByCategory: {},
            missingRequiredFields: [],
        });
    });

    describe('Success State', () => {
        it('should show ready to publish when no errors', () => {
            render(<PrePublishValidation {...defaultProps} />);

            expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
            expect(
                screen.getByText(/All required information has been provided/)
            ).toBeInTheDocument();
        });

        it('should show success icon when ready', () => {
            render(<PrePublishValidation {...defaultProps} />);

            const successIcon = document.querySelector(
                'svg.text-revlr-accent-green'
            );
            expect(successIcon).toBeInTheDocument();
        });

        it('should apply success styling', () => {
            render(<PrePublishValidation {...defaultProps} />);

            const container = screen
                .getByText('Ready to Publish')
                .closest('.rounded-xl');
            expect(container).toHaveClass('border-green-200', 'bg-green-50');
        });

        it('should apply dark theme success styling', () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            render(<PrePublishValidation {...defaultProps} />);

            const container = screen
                .getByText('Ready to Publish')
                .closest('.rounded-xl');
            expect(container).toHaveClass(
                'border-revlr-accent-green/20',
                'bg-revlr-accent-green/10'
            );
        });
    });

    describe('Error State', () => {
        const errorsWithValidation: ValidationErrors = {
            eventName: 'Event name is required',
            eventDescription: 'Event description is required',
            startDate: 'Start date is required',
            venueName: 'Venue name is required',
            tickets: 'At least one ticket is required',
        };

        beforeEach(() => {
            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 5,
                errorsByCategory: {
                    'Basic Information': 2,
                    'Date & Time': 1,
                    Location: 1,
                    Tickets: 1,
                },
                missingRequiredFields: [
                    'eventName',
                    'eventDescription',
                    'startDate',
                    'venueName',
                    'tickets',
                ],
            });
        });

        it('should show cannot publish when errors exist', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithValidation}
                />
            );

            expect(
                screen.getByText('Cannot Publish Event')
            ).toBeInTheDocument();
            expect(
                screen.getByText(/Please fix the following 5 issues/)
            ).toBeInTheDocument();
        });

        it('should show error icon when errors exist', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithValidation}
                />
            );

            const errorIcon = document.querySelector('svg.text-red-500');
            expect(errorIcon).toBeInTheDocument();
        });

        it('should apply error styling', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithValidation}
                />
            );

            const container = screen
                .getByText('Cannot Publish Event')
                .closest('.rounded-xl');
            expect(container).toHaveClass('border-red-200', 'bg-red-50');
        });

        it('should apply dark theme error styling', () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithValidation}
                />
            );

            const container = screen
                .getByText('Cannot Publish Event')
                .closest('.rounded-xl');
            expect(container).toHaveClass('border-red-500/20', 'bg-red-500/10');
        });

        it('should handle singular error count', () => {
            const singleError: ValidationErrors = {
                eventName: 'Event name is required',
            };

            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 1,
                errorsByCategory: {
                    'Basic Information': 1,
                },
                missingRequiredFields: ['eventName'],
            });

            render(
                <PrePublishValidation {...defaultProps} errors={singleError} />
            );

            expect(
                screen.getByText(/Please fix the following 1 issue before/)
            ).toBeInTheDocument();
        });
    });

    describe('Error Categories', () => {
        const categorizedErrors: ValidationErrors = {
            eventName: 'Event name is required',
            eventDescription: 'Event description is required',
            startDate: 'Start date is required',
            endDate: 'End date is required',
            venueName: 'Venue name is required',
            address: 'Address is required',
            tickets: 'At least one ticket is required',
            organizerName: 'Organizer name is required',
        };

        beforeEach(() => {
            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 8,
                errorsByCategory: {
                    'Basic Information': 2,
                    'Date & Time': 2,
                    Location: 2,
                    Tickets: 1,
                    Organizer: 1,
                },
                missingRequiredFields: Object.keys(categorizedErrors),
            });
        });

        it('should group errors by category', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={categorizedErrors}
                />
            );

            expect(
                screen.getByText('Basic Information (2 issues)')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Date & Time (2 issues)')
            ).toBeInTheDocument();
            expect(screen.getByText('Location (2 issues)')).toBeInTheDocument();
            expect(screen.getByText('Tickets (1 issue)')).toBeInTheDocument();
            expect(screen.getByText('Organizer (1 issue)')).toBeInTheDocument();
        });

        it('should display field names correctly', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={categorizedErrors}
                />
            );

            expect(screen.getByText('Event Name')).toBeInTheDocument();
            expect(screen.getByText('Event Description')).toBeInTheDocument();
            expect(screen.getByText('Start Date')).toBeInTheDocument();
            expect(screen.getByText('End Date')).toBeInTheDocument();
            expect(screen.getByText('Venue Name')).toBeInTheDocument();
            expect(screen.getByText('Address')).toBeInTheDocument();
            expect(screen.getByText('Tickets')).toBeInTheDocument();
            expect(screen.getByText('Organizer Name')).toBeInTheDocument();
        });

        it('should display error messages', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={categorizedErrors}
                />
            );

            expect(
                screen.getByText('Event name is required')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Event description is required')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Start date is required')
            ).toBeInTheDocument();
            expect(
                screen.getByText('At least one ticket is required')
            ).toBeInTheDocument();
        });

        it('should handle unknown field names', () => {
            const unknownFieldError: ValidationErrors = {
                unknownField: 'Unknown field error',
            };

            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 1,
                errorsByCategory: {
                    Other: 1,
                },
                missingRequiredFields: ['unknownField'],
            });

            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={unknownFieldError}
                />
            );

            expect(screen.getByText('unknownField')).toBeInTheDocument();
            expect(screen.getByText('Other (1 issue)')).toBeInTheDocument();
        });
    });

    describe('Fix Error Functionality', () => {
        const errorsWithFix: ValidationErrors = {
            eventName: 'Event name is required',
            startDate: 'Start date is required',
            tickets: 'At least one ticket is required',
        };

        beforeEach(() => {
            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 3,
                errorsByCategory: {
                    'Basic Information': 1,
                    'Date & Time': 1,
                    Tickets: 1,
                },
                missingRequiredFields: ['eventName', 'startDate', 'tickets'],
            });
        });

        it('should render fix buttons for each error', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithFix}
                />
            );

            const fixButtons = screen.getAllByText('Fix');
            expect(fixButtons).toHaveLength(3);
        });

        it('should call onFixError when fix button is clicked', () => {
            const mockOnFixError = jest.fn();
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithFix}
                    onFixError={mockOnFixError}
                />
            );

            const fixButtons = screen.getAllByText('Fix');
            fireEvent.click(fixButtons[0]);

            expect(mockOnFixError).toHaveBeenCalledWith('eventName');
        });

        it('should call onFixError with correct field names', () => {
            const mockOnFixError = jest.fn();
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={errorsWithFix}
                    onFixError={mockOnFixError}
                />
            );

            const fixButtons = screen.getAllByText('Fix');

            fireEvent.click(fixButtons[0]); // eventName
            fireEvent.click(fixButtons[1]); // startDate
            fireEvent.click(fixButtons[2]); // tickets

            expect(mockOnFixError).toHaveBeenCalledWith('eventName');
            expect(mockOnFixError).toHaveBeenCalledWith('startDate');
            expect(mockOnFixError).toHaveBeenCalledWith('tickets');
        });
    });

    describe('Quick Stats', () => {
        const statsErrors: ValidationErrors = {
            eventName: 'Event name is required',
            eventDescription: 'Event description is required',
            startDate: 'Start date is required',
        };

        beforeEach(() => {
            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 3,
                errorsByCategory: {
                    'Basic Information': 2,
                    'Date & Time': 1,
                },
                missingRequiredFields: [
                    'eventName',
                    'eventDescription',
                    'startDate',
                ],
            });
        });

        it('should display missing required fields count', () => {
            render(
                <PrePublishValidation {...defaultProps} errors={statsErrors} />
            );

            expect(
                screen.getByText('Missing Required Fields:')
            ).toBeInTheDocument();

            // Use more specific selector to avoid ambiguity
            const missingFieldsSection = screen
                .getByText('Missing Required Fields:')
                .closest('div');
            expect(missingFieldsSection).toHaveTextContent('3');
        });

        it('should display total issues count', () => {
            render(
                <PrePublishValidation {...defaultProps} errors={statsErrors} />
            );

            expect(screen.getByText('Total Issues:')).toBeInTheDocument();

            // Use more specific selector to avoid ambiguity
            const totalIssuesSection = screen
                .getByText('Total Issues:')
                .closest('div');
            expect(totalIssuesSection).toHaveTextContent('3');
        });
    });

    describe('Error Message Handling', () => {
        it('should handle string error messages', () => {
            const stringErrors: ValidationErrors = {
                eventName: 'Event name is required',
            };

            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 1,
                errorsByCategory: {
                    'Basic Information': 1,
                },
                missingRequiredFields: ['eventName'],
            });

            render(
                <PrePublishValidation {...defaultProps} errors={stringErrors} />
            );

            expect(
                screen.getByText('Event name is required')
            ).toBeInTheDocument();
        });

        it('should handle non-string error messages', () => {
            const nonStringErrors: ValidationErrors = {
                eventName: [
                    'Event name is required',
                    'Event name must be unique',
                ] as unknown as string,
            };

            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 1,
                errorsByCategory: {
                    'Basic Information': 1,
                },
                missingRequiredFields: ['eventName'],
            });

            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={nonStringErrors}
                />
            );

            expect(screen.getByText('Validation error')).toBeInTheDocument();
        });
    });

    describe('Theme Integration', () => {
        const themeErrors: ValidationErrors = {
            eventName: 'Event name is required',
        };

        beforeEach(() => {
            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 1,
                errorsByCategory: {
                    'Basic Information': 1,
                },
                missingRequiredFields: ['eventName'],
            });
        });

        it('should apply light theme styles to error items', () => {
            render(
                <PrePublishValidation {...defaultProps} errors={themeErrors} />
            );

            // Find the container div that has the styling classes
            const errorItem = screen
                .getByText('Event Name')
                .closest('.rounded-lg');
            expect(errorItem).toHaveClass('border-gray-200', 'bg-white');
        });

        it('should apply dark theme styles to error items', () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            render(
                <PrePublishValidation {...defaultProps} errors={themeErrors} />
            );

            // Find the container div that has the styling classes
            const errorItem = screen
                .getByText('Event Name')
                .closest('.rounded-lg');
            expect(errorItem).toHaveClass(
                'border-revlr-dark-border',
                'bg-revlr-dark-bg'
            );
        });

        it('should apply theme-aware text colors', () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            render(
                <PrePublishValidation {...defaultProps} errors={themeErrors} />
            );

            const fieldName = screen.getByText('Event Name');
            expect(fieldName).toHaveClass('text-white');
        });
    });

    describe('Accessibility', () => {
        const accessibilityErrors: ValidationErrors = {
            eventName: 'Event name is required',
            startDate: 'Start date is required',
        };

        beforeEach(() => {
            mockEventValidationUtils.getValidationSummary.mockReturnValue({
                totalErrors: 2,
                errorsByCategory: {
                    'Basic Information': 1,
                    'Date & Time': 1,
                },
                missingRequiredFields: ['eventName', 'startDate'],
            });
        });

        it('should have proper button roles', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={accessibilityErrors}
                />
            );

            const fixButtons = screen.getAllByRole('button', { name: /fix/i });
            expect(fixButtons).toHaveLength(2);
        });

        it('should have proper heading structure', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={accessibilityErrors}
                />
            );

            const mainHeading = screen.getByText('Cannot Publish Event');
            expect(mainHeading).toHaveClass('font-medium');
        });

        it('should have proper color contrast for error states', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={accessibilityErrors}
                />
            );

            const errorMessages = screen.getAllByText(/is required/);
            errorMessages.forEach((message) => {
                expect(message).toHaveClass('text-red-500');
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty errors object', () => {
            render(<PrePublishValidation {...defaultProps} errors={{}} />);

            expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
        });

        it('should handle undefined errors', () => {
            render(
                <PrePublishValidation
                    {...defaultProps}
                    errors={undefined as unknown as ValidationErrors}
                />
            );

            expect(screen.getByText('Ready to Publish')).toBeInTheDocument();
        });

        it('should handle validation summary errors', () => {
            mockEventValidationUtils.getValidationSummary.mockImplementation(
                () => {
                    throw new Error('Validation summary error');
                }
            );

            // Should not crash
            expect(() => {
                render(<PrePublishValidation {...defaultProps} />);
            }).not.toThrow();
        });
    });
});

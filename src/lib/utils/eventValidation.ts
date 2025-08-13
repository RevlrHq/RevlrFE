import type {
    EventCreationData,
    EventTicket,
    ValidationErrors,
    ValidationResult,
} from '../../types/event-creation';

export class EventValidationUtils {
    /**
     * Validate basic event information
     */
    static validateBasicInfo(eventData: EventCreationData): ValidationResult {
        const errors: ValidationErrors = {};

        if (!eventData.eventName?.trim()) {
            errors.eventName = 'Event name is required';
        } else if (eventData.eventName.length < 3) {
            errors.eventName = 'Event name must be at least 3 characters long';
        } else if (eventData.eventName.length > 100) {
            errors.eventName = 'Event name must be less than 100 characters';
        }

        if (!eventData.eventDescription?.trim()) {
            errors.eventDescription = 'Event description is required';
        } else if (eventData.eventDescription.length < 10) {
            errors.eventDescription =
                'Event description must be at least 10 characters long';
        } else if (eventData.eventDescription.length > 2000) {
            errors.eventDescription =
                'Event description must be less than 2000 characters';
        }

        if (!eventData.eventCategory?.trim()) {
            errors.eventCategory = 'Event category is required';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate date and time information
     */
    static validateDateTime(eventData: EventCreationData): ValidationResult {
        const errors: ValidationErrors = {};

        if (!eventData.dateRange?.startDate) {
            errors.startDate = 'Start date is required';
        }

        if (!eventData.dateRange?.endDate) {
            errors.endDate = 'End date is required';
        }

        if (!eventData.timeRange?.startTime) {
            errors.startTime = 'Start time is required';
        }

        if (!eventData.timeRange?.endTime) {
            errors.endTime = 'End time is required';
        }

        // Validate date logic
        if (eventData.dateRange?.startDate && eventData.dateRange?.endDate) {
            const startDate = new Date(eventData.dateRange.startDate);
            const endDate = new Date(eventData.dateRange.endDate);
            const now = new Date();

            if (startDate < now) {
                errors.startDate = 'Start date cannot be in the past';
            }

            if (endDate < startDate) {
                errors.endDate = 'End date cannot be before start date';
            }

            // If same day, validate times
            if (
                startDate.toDateString() === endDate.toDateString() &&
                eventData.timeRange?.startTime &&
                eventData.timeRange?.endTime
            ) {
                const startTime = this.parseTime(eventData.timeRange.startTime);
                const endTime = this.parseTime(eventData.timeRange.endTime);

                if (startTime >= endTime) {
                    errors.endTime = 'End time must be after start time';
                }
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate location information
     */
    static validateLocation(eventData: EventCreationData): ValidationResult {
        const errors: ValidationErrors = {};

        if (!eventData.locationType) {
            errors.locationType = 'Location type is required';
        }

        // Validate based on location type
        switch (eventData.locationType) {
            case 'in-person':
                if (!eventData.locationDetails?.venueName?.trim()) {
                    errors.venueName =
                        'Venue name is required for in-person events';
                }
                if (!eventData.locationDetails?.address?.trim()) {
                    errors.address = 'Address is required for in-person events';
                }
                break;

            case 'virtual':
                if (!eventData.locationDetails?.eventLink?.trim()) {
                    errors.eventLink =
                        'Event link is required for virtual events';
                } else if (
                    !this.isValidUrl(eventData.locationDetails.eventLink)
                ) {
                    errors.eventLink = 'Please enter a valid URL';
                }
                break;

            case 'hybrid':
                if (!eventData.locationDetails?.venueName?.trim()) {
                    errors.venueName =
                        'Venue name is required for hybrid events';
                }
                if (!eventData.locationDetails?.address?.trim()) {
                    errors.address = 'Address is required for hybrid events';
                }
                if (!eventData.locationDetails?.eventLink?.trim()) {
                    errors.eventLink =
                        'Event link is required for hybrid events';
                } else if (
                    !this.isValidUrl(eventData.locationDetails.eventLink)
                ) {
                    errors.eventLink = 'Please enter a valid URL';
                }
                break;
        }

        // Validate Google Maps link if provided
        if (
            eventData.locationDetails?.googleMapsLink &&
            !this.isValidUrl(eventData.locationDetails.googleMapsLink)
        ) {
            errors.googleMapsLink = 'Please enter a valid Google Maps URL';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate organizer information
     */
    static validateOrganizer(eventData: EventCreationData): ValidationResult {
        const errors: ValidationErrors = {};

        if (
            eventData.organizerWebsite &&
            !this.isValidUrl(eventData.organizerWebsite)
        ) {
            errors.organizerWebsite = 'Please enter a valid website URL';
        }

        // Validate social links
        if (eventData.socials) {
            if (
                eventData.socials.facebook &&
                !this.isValidUrl(eventData.socials.facebook)
            ) {
                errors.facebookUrl = 'Please enter a valid Facebook URL';
            }
            if (
                eventData.socials.instagram &&
                !this.isValidUrl(eventData.socials.instagram)
            ) {
                errors.instagramUrl = 'Please enter a valid Instagram URL';
            }
            if (
                eventData.socials.twitter &&
                !this.isValidUrl(eventData.socials.twitter)
            ) {
                errors.twitterUrl = 'Please enter a valid Twitter URL';
            }
            if (
                eventData.socials.website &&
                !this.isValidUrl(eventData.socials.website)
            ) {
                errors.websiteUrl = 'Please enter a valid website URL';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate tickets
     */
    static validateTickets(tickets: EventTicket[]): ValidationResult {
        const errors: ValidationErrors = {};

        if (tickets.length === 0) {
            errors.tickets = 'At least one ticket type is required';
            return { isValid: false, errors };
        }

        tickets.forEach((ticket, index) => {
            const ticketErrors: string[] = [];

            if (!ticket.name?.trim()) {
                ticketErrors.push('Ticket name is required');
            }

            if (ticket.type === 'paid') {
                if (!ticket.price || ticket.price <= 0) {
                    ticketErrors.push(
                        'Price must be greater than 0 for paid tickets'
                    );
                }
            }

            if (!ticket.quantity || ticket.quantity <= 0) {
                ticketErrors.push('Quantity must be greater than 0');
            }

            if (!ticket.purchaseLimit || ticket.purchaseLimit <= 0) {
                ticketErrors.push('Purchase limit must be greater than 0');
            }

            if (ticket.purchaseLimit > ticket.quantity) {
                ticketErrors.push(
                    'Purchase limit cannot exceed total quantity'
                );
            }

            // Validate sales period
            if (ticket.salesPeriod) {
                if (!ticket.salesPeriod.startDate) {
                    ticketErrors.push('Sales start date is required');
                }
                if (!ticket.salesPeriod.endDate) {
                    ticketErrors.push('Sales end date is required');
                }

                if (
                    ticket.salesPeriod.startDate &&
                    ticket.salesPeriod.endDate
                ) {
                    const startDate = new Date(ticket.salesPeriod.startDate);
                    const endDate = new Date(ticket.salesPeriod.endDate);

                    if (endDate <= startDate) {
                        ticketErrors.push(
                            'Sales end date must be after start date'
                        );
                    }
                }
            }

            if (ticketErrors.length > 0) {
                errors[`ticket_${index}`] = ticketErrors.join(', ');
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Validate images
     */
    static validateImages(images: unknown[]): ValidationResult {
        const errors: ValidationErrors = {};

        if (images.length === 0) {
            errors.images = 'At least one event image is required';
        }

        if (images.length > 10) {
            errors.images = 'Maximum 10 images allowed';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Comprehensive validation for publishing
     */
    static validateForPublishing(
        eventData: EventCreationData,
        tickets: EventTicket[]
    ): ValidationResult {
        const validations = [
            this.validateBasicInfo(eventData),
            this.validateDateTime(eventData),
            this.validateLocation(eventData),
            this.validateOrganizer(eventData),
            this.validateTickets(tickets),
            this.validateImages(eventData.images),
        ];

        const allErrors = validations.reduce(
            (acc, validation) => ({
                ...acc,
                ...validation.errors,
            }),
            {}
        );

        return {
            isValid: Object.keys(allErrors).length === 0,
            errors: allErrors,
        };
    }

    /**
     * Get required fields for a specific step
     */
    static getRequiredFieldsForStep(step: number): string[] {
        switch (step) {
            case 1:
                return ['eventName', 'eventDescription', 'eventCategory'];
            case 2:
                return [
                    'startDate',
                    'endDate',
                    'startTime',
                    'endTime',
                    'locationType',
                ];
            case 3:
                return ['images'];
            case 4:
                return ['tickets'];
            default:
                return [];
        }
    }

    /**
     * Check if a string is a valid URL
     */
    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Parse time string to minutes for comparison
     */
    private static parseTime(timeString: string): number {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Get validation summary
     */
    static getValidationSummary(
        eventData: EventCreationData,
        tickets: EventTicket[]
    ): {
        totalErrors: number;
        errorsByCategory: Record<string, number>;
        missingRequiredFields: string[];
    } {
        const validation = this.validateForPublishing(eventData, tickets);
        const errorsByCategory: Record<string, number> = {};
        const missingRequiredFields: string[] = [];

        Object.entries(validation.errors).forEach(([field]) => {
            const category = this.getCategoryForField(field);
            errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;

            if (this.isRequiredField(field)) {
                missingRequiredFields.push(field);
            }
        });

        return {
            totalErrors: Object.keys(validation.errors).length,
            errorsByCategory,
            missingRequiredFields,
        };
    }

    /**
     * Get category for a field (for grouping errors)
     */
    private static getCategoryForField(field: string): string {
        if (
            ['eventName', 'eventDescription', 'eventCategory'].includes(field)
        ) {
            return 'Basic Information';
        }
        if (['startDate', 'endDate', 'startTime', 'endTime'].includes(field)) {
            return 'Date & Time';
        }
        if (
            ['locationType', 'venueName', 'address', 'eventLink'].includes(
                field
            )
        ) {
            return 'Location';
        }
        if (['organizerName', 'organizerWebsite'].includes(field)) {
            return 'Organizer';
        }
        if (field.includes('ticket')) {
            return 'Tickets';
        }
        if (field === 'images') {
            return 'Images';
        }
        return 'Other';
    }

    /**
     * Check if a field is required
     */
    private static isRequiredField(field: string): boolean {
        const requiredFields = [
            'eventName',
            'eventDescription',
            'eventCategory',
            'startDate',
            'endDate',
            'startTime',
            'endTime',
            'locationType',
            'images',
            'tickets',
        ];
        return requiredFields.includes(field);
    }
}

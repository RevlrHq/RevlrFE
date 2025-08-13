import { EventsService } from './services/EventsService';
import type { EventCreationRequest } from './models/EventCreationRequest';
import type { EventTicketCreationRequest } from './models/EventTicketCreationRequest';
import type { EventView } from './models/EventView';
import type { StandardResponseOfEventView } from './models/StandardResponseOfEventView';
import type {
    EventCreationData,
    EventTicket,
    EventCreationResponse,
    EventCreationError,
} from '../../types/event-creation';

export class EventCreationService {
    /**
     * Save event as draft
     */
    static async saveDraft(
        eventData: EventCreationData
    ): Promise<EventCreationResponse> {
        try {
            const request = this.mapToEventCreationRequest(eventData, true);
            const response: StandardResponseOfEventView =
                await EventsService.postApiEventsDraft({
                    requestBody: request,
                });

            if (response.success && response.data) {
                return {
                    success: true,
                    data: this.mapFromEventView(response.data),
                    message: 'Draft saved successfully',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to save draft',
            };
        } catch (error) {
            return this.handleError(error, 'Failed to save draft');
        }
    }

    /**
     * Load existing draft or event
     */
    static async loadEvent(eventId: string): Promise<EventCreationResponse> {
        try {
            const response: StandardResponseOfEventView =
                await EventsService.getApiEvents1({
                    eventId,
                });

            if (response.success && response.data) {
                return {
                    success: true,
                    data: this.mapFromEventView(response.data),
                    message: 'Event loaded successfully',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to load event',
            };
        } catch (error) {
            return this.handleError(error, 'Failed to load event');
        }
    }

    /**
     * Update existing event
     */
    static async updateEvent(
        eventId: string,
        eventData: EventCreationData
    ): Promise<EventCreationResponse> {
        try {
            const request = this.mapToEventCreationRequest(
                eventData,
                eventData.isDraft
            );
            const response: StandardResponseOfEventView =
                await EventsService.putApiEvents({
                    eventId,
                    requestBody: request,
                });

            if (response.success && response.data) {
                return {
                    success: true,
                    data: this.mapFromEventView(response.data),
                    message: 'Event updated successfully',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to update event',
            };
        } catch (error) {
            return this.handleError(error, 'Failed to update event');
        }
    }

    /**
     * Add tickets to event
     */
    static async addTickets(
        eventId: string,
        tickets: EventTicket[]
    ): Promise<EventCreationResponse> {
        try {
            const ticketRequests = tickets.map(this.mapToTicketCreationRequest);
            const response: StandardResponseOfEventView =
                await EventsService.postApiEventsTickets({
                    eventId,
                    requestBody: ticketRequests,
                });

            if (response.success && response.data) {
                return {
                    success: true,
                    data: this.mapFromEventView(response.data),
                    message: 'Tickets added successfully',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to add tickets',
            };
        } catch (error) {
            return this.handleError(error, 'Failed to add tickets');
        }
    }

    /**
     * Publish event
     */
    static async publishEvent(eventId: string): Promise<EventCreationResponse> {
        try {
            const response: StandardResponseOfEventView =
                await EventsService.postApiEventsPublish({
                    eventId,
                });

            if (response.success && response.data) {
                return {
                    success: true,
                    data: this.mapFromEventView(response.data),
                    message: 'Event published successfully',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to publish event',
            };
        } catch (error) {
            return this.handleError(error, 'Failed to publish event');
        }
    }

    /**
     * Create new event (non-draft)
     */
    static async createEvent(
        eventData: EventCreationData
    ): Promise<EventCreationResponse> {
        try {
            const request = this.mapToEventCreationRequest(eventData, false);
            const response: StandardResponseOfEventView =
                await EventsService.postApiEvents({
                    requestBody: request,
                });

            if (response.success && response.data) {
                return {
                    success: true,
                    data: this.mapFromEventView(response.data),
                    message: 'Event created successfully',
                };
            }

            return {
                success: false,
                message: response.message || 'Failed to create event',
            };
        } catch (error) {
            return this.handleError(error, 'Failed to create event');
        }
    }

    /**
     * Map EventCreationData to EventCreationRequest
     */
    private static mapToEventCreationRequest(
        data: EventCreationData,
        isDraft: boolean = false
    ): EventCreationRequest {
        return {
            eventName: data.eventName,
            eventDescription: data.eventDescription,
            eventCategory: data.eventCategory,
            dateRange: data.dateRange,
            timeRange: data.timeRange,
            timezone: data.timezone,
            locationType: data.locationType,
            locationDetails: data.locationDetails,
            images: data.images?.map((img) =>
                typeof img === 'string' ? img : img.url
            ),
            organizerName: data.organizerName,
            organizerWebsite: data.organizerWebsite,
            organizerLogo: data.organizerLogo,
            socials: data.socials
                ? {
                      facebook: data.socials.facebook,
                      instagram: data.socials.instagram,
                      twitter: data.socials.twitter,
                  }
                : undefined,
            isDraft,
        };
    }

    /**
     * Map EventView to EventCreationData
     */
    private static mapFromEventView(eventView: EventView): EventCreationData {
        return {
            id: eventView.id,
            eventName: eventView.title || '',
            eventDescription: eventView.description || '',
            eventCategory: eventView.category || '',
            dateRange:
                eventView.startDate && eventView.endDate
                    ? {
                          startDate: eventView.startDate,
                          endDate: eventView.endDate,
                      }
                    : undefined,
            timeRange:
                eventView.startTime && eventView.endTime
                    ? {
                          startTime: eventView.startTime,
                          endTime: eventView.endTime,
                      }
                    : undefined,
            timezone: eventView.timezone,
            locationType: this.mapLocationTypeFromApi(eventView.locationType),
            locationDetails: {
                venueName: eventView.venue || undefined,
                address: eventView.address || undefined,
                googleMapsLink: eventView.googleMapsLink || undefined,
                eventLink: eventView.virtualMeetingUrl || undefined,
            },
            images: (eventView.images || []).map(
                (url: string, index: number) => ({
                    id: `img_${index}`,
                    url,
                    cdnUrl: url,
                    name: `image_${index}`,
                    size: 0,
                    mimeType: 'image/jpeg',
                    order: index,
                })
            ),
            organizerName: eventView.organizerName,
            organizerWebsite: eventView.organizerWebsite || undefined,
            organizerLogo: eventView.organizerLogo,
            socials: eventView.socials
                ? {
                      facebook: eventView.socials.facebook || undefined,
                      instagram: eventView.socials.instagram || undefined,
                      twitter: eventView.socials.twitter || undefined,
                      website: undefined, // API doesn't support website in socials
                  }
                : undefined,
            status: eventView.status === 'Published' ? 'published' : 'draft',
            isDraft: eventView.status !== 'Published',
            createdAt: eventView.dateCreated,
            updatedAt: eventView.dateUpdated || undefined,
        };
    }

    /**
     * Map EventTicket to EventTicketCreationRequest
     */
    private static mapToTicketCreationRequest(
        ticket: EventTicket
    ): EventTicketCreationRequest {
        return {
            type: ticket.type,
            name: ticket.name,
            description: ticket.description,
            price: ticket.price,
            quantity: ticket.quantity,
            purchaseLimit: ticket.purchaseLimit,
            salesPeriod: ticket.salesPeriod,
            refundPolicy: ticket.refundPolicy,
            feeOption: ticket.feeOption,
            selected: ticket.selected,
        };
    }

    /**
     * Map location type from API enum to string
     */
    private static mapLocationTypeFromApi(
        locationType: any
    ): 'in-person' | 'virtual' | 'hybrid' {
        switch (locationType) {
            case 0:
            case 'InPerson':
                return 'in-person';
            case 1:
            case 'Virtual':
                return 'virtual';
            case 2:
            case 'Hybrid':
                return 'hybrid';
            default:
                return 'in-person';
        }
    }

    /**
     * Handle API errors and convert to EventCreationResponse
     */
    private static handleError(
        error: any,
        defaultMessage: string
    ): EventCreationResponse {
        console.error('EventCreationService Error:', error);

        let errorType: EventCreationError['type'] = 'server';
        let message = defaultMessage;

        if (error?.status === 401) {
            errorType = 'authentication';
            message = 'Authentication required. Please log in again.';
        } else if (error?.status === 400) {
            errorType = 'validation';
            message =
                error.body?.message ||
                'Validation failed. Please check your input.';
        } else if (error?.status >= 500) {
            errorType = 'server';
            message = 'Server error. Please try again later.';
        } else if (!navigator.onLine) {
            errorType = 'network';
            message = 'Network error. Please check your connection.';
        }

        return {
            success: false,
            message,
            errors: error?.body?.errors || {},
        };
    }

    /**
     * Retry mechanism with exponential backoff
     */
    static async withRetry<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                // Don't retry on authentication or validation errors
                if (
                    (error as any)?.status === 401 ||
                    (error as any)?.status === 400
                ) {
                    throw error;
                }

                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    throw error;
                }

                // Wait before retrying with exponential backoff
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }
}

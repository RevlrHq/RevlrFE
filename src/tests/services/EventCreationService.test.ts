import { EventCreationService } from '../../lib/services/EventCreationService';
import { EventsService } from '../../lib/api/services/EventsService';
import type {
    EventCreationData,
    EventTicket,
} from '../../types/event-creation';
import type { StandardResponseOfEventView } from '../../lib/api/models/StandardResponseOfEventView';
import type { EventView } from '../../lib/api/models/EventView';

// Mock the EventsService
jest.mock('../../lib/api/services/EventsService');
const mockEventsService = EventsService as jest.Mocked<typeof EventsService>;

describe('EventCreationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockEventData: EventCreationData = {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        eventCategory: 'Conference',
        dateRange: {
            startDate: '2024-12-20',
            endDate: '2024-12-21',
        },
        timeRange: {
            startTime: '09:00',
            endTime: '17:00',
        },
        timezone: 'America/New_York',
        locationType: 'in-person',
        locationDetails: {
            venueName: 'Test Venue',
            address: '123 Test St',
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
        organizerName: 'Test Organizer',
        organizerWebsite: 'https://example.com',
        socials: {
            facebook: 'https://facebook.com/test',
            twitter: 'https://twitter.com/test',
        },
    };

    const mockEventView: EventView = {
        id: 'test-event-id',
        title: 'Test Event',
        description: 'Test Description',
        category: 'Conference',
        startDate: '2024-12-20',
        endDate: '2024-12-21',
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'America/New_York',
        locationType: 0, // InPerson
        venue: 'Test Venue',
        address: '123 Test St',
        images: ['https://example.com/image.jpg'],
        organizerName: 'Test Organizer',
        organizerWebsite: 'https://example.com',
        socials: {
            facebook: 'https://facebook.com/test',
            twitter: 'https://twitter.com/test',
        },
        status: 'Draft',
        dateCreated: '2024-12-08T10:00:00Z',
    };

    describe('saveDraft', () => {
        it('should save draft successfully', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Draft saved successfully',
            };

            mockEventsService.postApiEventsDraft.mockResolvedValue(
                mockResponse
            );

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(true);
            expect(result.data?.eventName).toBe('Test Event');
            expect(result.message).toBe('Draft saved successfully');
            expect(mockEventsService.postApiEventsDraft).toHaveBeenCalledWith({
                requestBody: expect.objectContaining({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                    eventCategory: 'Conference',
                }),
            });
        });

        it('should handle API failure', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: false,
                message: 'Validation failed',
            };

            mockEventsService.postApiEventsDraft.mockResolvedValue(
                mockResponse
            );

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(false);
            expect(result.message).toBe('Validation failed');
        });

        it('should handle network errors', async () => {
            mockEventsService.postApiEventsDraft.mockRejectedValue(
                new Error('Network error')
            );

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to save draft');
        });

        it('should map event data correctly', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Draft saved successfully',
            };

            mockEventsService.postApiEventsDraft.mockResolvedValue(
                mockResponse
            );

            await EventCreationService.saveDraft(mockEventData);

            expect(mockEventsService.postApiEventsDraft).toHaveBeenCalledWith({
                requestBody: expect.objectContaining({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                    eventCategory: 'Conference',
                    dateRange: {
                        startDate: '2024-12-20',
                        endDate: '2024-12-21',
                    },
                    timeRange: {
                        startTime: '09:00',
                        endTime: '17:00',
                    },
                    timezone: 'America/New_York',
                    locationType: 'in-person',
                    locationDetails: {
                        venueName: 'Test Venue',
                        address: '123 Test St',
                    },
                    images: ['https://example.com/image.jpg'],
                    organizerName: 'Test Organizer',
                    organizerWebsite: 'https://example.com',
                    socials: {
                        facebook: 'https://facebook.com/test',
                        twitter: 'https://twitter.com/test',
                    },
                    isDraft: true,
                }),
            });
        });
    });

    describe('loadEvent', () => {
        it('should load event successfully', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Event loaded successfully',
            };

            mockEventsService.getApiEvents1.mockResolvedValue(mockResponse);

            const result =
                await EventCreationService.loadEvent('test-event-id');

            expect(result.success).toBe(true);
            expect(result.data?.eventName).toBe('Test Event');
            expect(result.data?.locationType).toBe('in-person');
            expect(mockEventsService.getApiEvents1).toHaveBeenCalledWith({
                eventId: 'test-event-id',
            });
        });

        it('should handle load failure', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: false,
                message: 'Event not found',
            };

            mockEventsService.getApiEvents1.mockResolvedValue(mockResponse);

            const result = await EventCreationService.loadEvent('invalid-id');

            expect(result.success).toBe(false);
            expect(result.message).toBe('Event not found');
        });

        it('should map location types correctly', async () => {
            const virtualEventView: EventView = {
                ...mockEventView,
                locationType: 1, // Virtual
                virtualMeetingUrl: 'https://zoom.us/meeting',
            };

            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: virtualEventView,
                message: 'Event loaded successfully',
            };

            mockEventsService.getApiEvents1.mockResolvedValue(mockResponse);

            const result =
                await EventCreationService.loadEvent('test-event-id');

            expect(result.data?.locationType).toBe('virtual');
            expect(result.data?.locationDetails?.eventLink).toBe(
                'https://zoom.us/meeting'
            );
        });
    });

    describe('updateEvent', () => {
        it('should update event successfully', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: { ...mockEventView, title: 'Updated Event' },
                message: 'Event updated successfully',
            };

            mockEventsService.putApiEvents.mockResolvedValue(mockResponse);

            const updatedData = {
                ...mockEventData,
                eventName: 'Updated Event',
            };
            const result = await EventCreationService.updateEvent(
                'test-event-id',
                updatedData
            );

            expect(result.success).toBe(true);
            expect(result.data?.eventName).toBe('Updated Event');
            expect(mockEventsService.putApiEvents).toHaveBeenCalledWith({
                eventId: 'test-event-id',
                requestBody: expect.objectContaining({
                    eventName: 'Updated Event',
                }),
            });
        });

        it('should handle update failure', async () => {
            mockEventsService.putApiEvents.mockRejectedValue(
                new Error('Update failed')
            );

            const result = await EventCreationService.updateEvent(
                'test-event-id',
                mockEventData
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to update event');
        });
    });

    describe('addTickets', () => {
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
                salesPeriod: {
                    startDate: '2024-12-01',
                    endDate: '2024-12-19',
                },
            },
        ];

        it('should add tickets successfully', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Tickets added successfully',
            };

            mockEventsService.postApiEventsTickets.mockResolvedValue(
                mockResponse
            );

            const result = await EventCreationService.addTickets(
                'test-event-id',
                mockTickets
            );

            expect(result.success).toBe(true);
            expect(result.message).toBe('Tickets added successfully');
            expect(mockEventsService.postApiEventsTickets).toHaveBeenCalledWith(
                {
                    eventId: 'test-event-id',
                    requestBody: expect.arrayContaining([
                        expect.objectContaining({
                            type: 'free',
                            name: 'General Admission',
                            quantity: 100,
                            purchaseLimit: 2,
                        }),
                        expect.objectContaining({
                            type: 'paid',
                            name: 'VIP Ticket',
                            price: 50,
                            quantity: 50,
                            purchaseLimit: 1,
                            salesPeriod: {
                                startDate: '2024-12-01',
                                endDate: '2024-12-19',
                            },
                        }),
                    ]),
                }
            );
        });

        it('should handle ticket addition failure', async () => {
            mockEventsService.postApiEventsTickets.mockRejectedValue(
                new Error('Ticket validation failed')
            );

            const result = await EventCreationService.addTickets(
                'test-event-id',
                mockTickets
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to add tickets');
        });
    });

    describe('publishEvent', () => {
        it('should publish event successfully', async () => {
            const publishedEventView: EventView = {
                ...mockEventView,
                status: 'Published',
            };

            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: publishedEventView,
                message: 'Event published successfully',
            };

            mockEventsService.postApiEventsPublish.mockResolvedValue(
                mockResponse
            );

            const result =
                await EventCreationService.publishEvent('test-event-id');

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('published');
            expect(result.message).toBe('Event published successfully');
            expect(mockEventsService.postApiEventsPublish).toHaveBeenCalledWith(
                {
                    eventId: 'test-event-id',
                }
            );
        });

        it('should handle publish failure', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: false,
                message: 'Event validation failed',
            };

            mockEventsService.postApiEventsPublish.mockResolvedValue(
                mockResponse
            );

            const result =
                await EventCreationService.publishEvent('test-event-id');

            expect(result.success).toBe(false);
            expect(result.message).toBe('Event validation failed');
        });
    });

    describe('createEvent', () => {
        it('should create event successfully', async () => {
            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Event created successfully',
            };

            mockEventsService.postApiEvents.mockResolvedValue(mockResponse);

            const result =
                await EventCreationService.createEvent(mockEventData);

            expect(result.success).toBe(true);
            expect(result.data?.eventName).toBe('Test Event');
            expect(mockEventsService.postApiEvents).toHaveBeenCalledWith({
                requestBody: expect.objectContaining({
                    eventName: 'Test Event',
                    isDraft: false,
                }),
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication errors', async () => {
            const authError = {
                status: 401,
                body: { message: 'Unauthorized' },
            };

            mockEventsService.postApiEventsDraft.mockRejectedValue(authError);

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Authentication required');
        });

        it('should handle validation errors', async () => {
            const validationError = {
                status: 400,
                body: {
                    message: 'Validation failed',
                    errors: {
                        eventName: 'Event name is required',
                    },
                },
            };

            mockEventsService.postApiEventsDraft.mockRejectedValue(
                validationError
            );

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Validation failed');
            expect(result.errors).toEqual({
                eventName: 'Event name is required',
            });
        });

        it('should handle server errors', async () => {
            const serverError = {
                status: 500,
                body: { message: 'Internal server error' },
            };

            mockEventsService.postApiEventsDraft.mockRejectedValue(serverError);

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Server error');
        });

        it('should handle network errors', async () => {
            // Mock offline state
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: false,
            });

            mockEventsService.postApiEventsDraft.mockRejectedValue(
                new Error('Network error')
            );

            const result = await EventCreationService.saveDraft(mockEventData);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Network error');

            // Restore online state
            Object.defineProperty(navigator, 'onLine', {
                writable: true,
                value: true,
            });
        });
    });

    describe('Retry Mechanism', () => {
        it('should retry on transient failures', async () => {
            let callCount = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    throw new Error('Transient error');
                }
                return Promise.resolve('Success');
            });

            const result = await EventCreationService.withRetry(
                mockOperation,
                3,
                100
            );

            expect(result).toBe('Success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        it('should not retry on authentication errors', async () => {
            const authError = { status: 401 };
            const mockOperation = jest.fn().mockRejectedValue(authError);

            await expect(
                EventCreationService.withRetry(mockOperation, 3, 100)
            ).rejects.toEqual(authError);

            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should not retry on validation errors', async () => {
            const validationError = { status: 400 };
            const mockOperation = jest.fn().mockRejectedValue(validationError);

            await expect(
                EventCreationService.withRetry(mockOperation, 3, 100)
            ).rejects.toEqual(validationError);

            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should fail after max retries', async () => {
            const mockOperation = jest
                .fn()
                .mockRejectedValue(new Error('Persistent error'));

            await expect(
                EventCreationService.withRetry(mockOperation, 2, 100)
            ).rejects.toThrow('Persistent error');

            expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });
    });

    describe('Data Mapping', () => {
        it('should map virtual event correctly', async () => {
            const virtualEventData: EventCreationData = {
                ...mockEventData,
                locationType: 'virtual',
                locationDetails: {
                    eventLink: 'https://zoom.us/meeting',
                    platform: 'Zoom',
                },
            };

            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Draft saved successfully',
            };

            mockEventsService.postApiEventsDraft.mockResolvedValue(
                mockResponse
            );

            await EventCreationService.saveDraft(virtualEventData);

            expect(mockEventsService.postApiEventsDraft).toHaveBeenCalledWith({
                requestBody: expect.objectContaining({
                    locationType: 'virtual',
                    locationDetails: expect.objectContaining({
                        eventLink: 'https://zoom.us/meeting',
                        platform: 'Zoom',
                    }),
                }),
            });
        });

        it('should map hybrid event correctly', async () => {
            const hybridEventData: EventCreationData = {
                ...mockEventData,
                locationType: 'hybrid',
                locationDetails: {
                    venueName: 'Test Venue',
                    address: '123 Test St',
                    eventLink: 'https://zoom.us/meeting',
                },
            };

            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Draft saved successfully',
            };

            mockEventsService.postApiEventsDraft.mockResolvedValue(
                mockResponse
            );

            await EventCreationService.saveDraft(hybridEventData);

            expect(mockEventsService.postApiEventsDraft).toHaveBeenCalledWith({
                requestBody: expect.objectContaining({
                    locationType: 'hybrid',
                    locationDetails: expect.objectContaining({
                        venueName: 'Test Venue',
                        address: '123 Test St',
                        eventLink: 'https://zoom.us/meeting',
                    }),
                }),
            });
        });

        it('should handle missing optional fields', async () => {
            const minimalEventData: EventCreationData = {
                eventName: 'Minimal Event',
                eventDescription: 'Minimal Description',
                eventCategory: 'Other',
                locationType: 'in-person',
                images: [],
            };

            const mockResponse: StandardResponseOfEventView = {
                success: true,
                data: mockEventView,
                message: 'Draft saved successfully',
            };

            mockEventsService.postApiEventsDraft.mockResolvedValue(
                mockResponse
            );

            const result =
                await EventCreationService.saveDraft(minimalEventData);

            expect(result.success).toBe(true);
            expect(mockEventsService.postApiEventsDraft).toHaveBeenCalledWith({
                requestBody: expect.objectContaining({
                    eventName: 'Minimal Event',
                    eventDescription: 'Minimal Description',
                    eventCategory: 'Other',
                    locationType: 'in-person',
                    images: [],
                    isDraft: true,
                }),
            });
        });
    });
});

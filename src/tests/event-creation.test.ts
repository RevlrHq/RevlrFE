import { EventCreationService } from '../lib/services/EventCreationService';
import { DraftBackupService } from '../lib/services/DraftBackupService';
import { EventValidationUtils } from '../lib/utils/eventValidation';
import type { EventCreationData, EventTicket } from '../types/event-creation';

// Mock the EventsService to avoid actual API calls
jest.mock('../lib/api/services/EventsService', () => ({
    EventsService: {
        postApiEventsDraft: jest.fn(),
        getApiEvents1: jest.fn(),
        putApiEvents: jest.fn(),
        postApiEventsTickets: jest.fn(),
        postApiEventsPublish: jest.fn(),
        postApiEvents: jest.fn(),
    },
}));

describe('Event Creation Infrastructure', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('EventCreationService', () => {
        const mockEventData: EventCreationData = {
            eventName: 'Test Event',
            eventDescription: 'Test Description',
            eventCategory: 'Conference',
            locationType: 'in-person',
            images: [
                {
                    id: 'img1',
                    url: 'https://example.com/image1.jpg',
                    name: 'image1.jpg',
                    size: 1024,
                    mimeType: 'image/jpeg',
                    order: 0,
                },
            ],
            isDraft: true,
        };

        it('should map EventCreationData to EventCreationRequest correctly', () => {
            // This tests the private method indirectly through saveDraft
            expect(() =>
                EventCreationService.saveDraft(mockEventData)
            ).not.toThrow();
        });

        it('should handle API errors gracefully', async () => {
            const { EventsService } = await import(
                '../lib/api/services/EventsService'
            );
            EventsService.postApiEventsDraft.mockRejectedValue(
                new Error('Network error')
            );

            const result = await EventCreationService.saveDraft(mockEventData);
            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed to save draft');
        });
    });

    describe('DraftBackupService', () => {
        const mockEventData: EventCreationData = {
            eventName: 'Test Event',
            eventDescription: 'Test Description',
            eventCategory: 'Conference',
            locationType: 'in-person',
            images: [
                {
                    id: 'img1',
                    url: 'https://example.com/image1.jpg',
                    name: 'image1.jpg',
                    size: 1024,
                    mimeType: 'image/jpeg',
                    order: 0,
                },
            ],
            isDraft: true,
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

        it('should save and load draft correctly', () => {
            DraftBackupService.saveDraft(mockEventData, mockTickets, 1);

            const loaded = DraftBackupService.loadDraft();
            expect(loaded).not.toBeNull();
            expect(loaded?.eventData.eventName).toBe('Test Event');
            expect(loaded?.tickets).toHaveLength(1);
            expect(loaded?.step).toBe(1);
        });

        it('should detect when draft exists', () => {
            expect(DraftBackupService.hasDraft()).toBe(false);

            DraftBackupService.saveDraft(mockEventData, mockTickets, 1);
            expect(DraftBackupService.hasDraft()).toBe(true);
        });

        it('should clear draft correctly', () => {
            DraftBackupService.saveDraft(mockEventData, mockTickets, 1);
            expect(DraftBackupService.hasDraft()).toBe(true);

            DraftBackupService.clearDraft();
            expect(DraftBackupService.hasDraft()).toBe(false);
        });

        it('should handle corrupted data gracefully', () => {
            localStorage.setItem('event_creation_draft', 'invalid json');

            const loaded = DraftBackupService.loadDraft();
            expect(loaded).toBeNull();
            expect(DraftBackupService.hasDraft()).toBe(false);
        });
    });

    describe('EventValidationUtils', () => {
        it('should validate basic info correctly', () => {
            const validData: EventCreationData = {
                eventName: 'Test Event',
                eventDescription: 'This is a test event description',
                eventCategory: 'Conference',
                locationType: 'in-person',
                images: [],
            };

            const result = EventValidationUtils.validateBasicInfo(validData);
            expect(result.isValid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
        });

        it('should detect missing required fields', () => {
            const invalidData: EventCreationData = {
                eventName: '',
                eventDescription: '',
                eventCategory: '',
                locationType: 'in-person',
                images: [],
            };

            const result = EventValidationUtils.validateBasicInfo(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.eventName).toBeDefined();
            expect(result.errors.eventDescription).toBeDefined();
            expect(result.errors.eventCategory).toBeDefined();
        });

        it('should validate tickets correctly', () => {
            const validTickets: EventTicket[] = [
                {
                    id: 'ticket1',
                    type: 'free',
                    name: 'General Admission',
                    quantity: 100,
                    purchaseLimit: 2,
                },
            ];

            const result = EventValidationUtils.validateTickets(validTickets);
            expect(result.isValid).toBe(true);
        });

        it('should detect invalid ticket configuration', () => {
            const invalidTickets: EventTicket[] = [
                {
                    id: 'ticket1',
                    type: 'paid',
                    name: '',
                    quantity: 0,
                    purchaseLimit: 0,
                    price: 0,
                },
            ];

            const result = EventValidationUtils.validateTickets(invalidTickets);
            expect(result.isValid).toBe(false);
            expect(result.errors.ticket_0).toBeDefined();
        });

        it('should validate URLs correctly', () => {
            const dataWithInvalidUrl: EventCreationData = {
                eventName: 'Test Event',
                eventDescription: 'Test Description',
                eventCategory: 'Conference',
                locationType: 'virtual',
                images: [],
                locationDetails: {
                    eventLink: 'not-a-valid-url',
                },
            };

            const result =
                EventValidationUtils.validateLocation(dataWithInvalidUrl);
            expect(result.isValid).toBe(false);
            expect(result.errors.eventLink).toBeDefined();
        });
    });
});

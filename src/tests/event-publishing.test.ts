import { EventValidationUtils } from '../lib/utils/eventValidation';
import type { EventCreationData, EventTicket } from '../types/event-creation';

describe('Event Publishing Workflow', () => {
    const mockEventData: EventCreationData = {
        eventName: 'Test Event',
        eventDescription:
            'This is a test event description that is long enough to pass validation.',
        eventCategory: 'conference',
        locationType: 'in-person',
        locationDetails: {
            venueName: 'Test Venue',
            address: '123 Test Street, Test City',
        },
        dateRange: {
            startDate: '2025-12-01',
            endDate: '2025-12-01',
        },
        timeRange: {
            startTime: '10:00',
            endTime: '18:00',
        },
        timezone: 'America/New_York',
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
        status: 'draft',
    };

    const mockTickets: EventTicket[] = [
        {
            id: 'ticket1',
            type: 'free',
            name: 'General Admission',
            description: 'Free general admission ticket',
            price: 0,
            quantity: 100,
            purchaseLimit: 2,
            salesPeriod: {
                startDate: '2025-11-01',
                endDate: '2025-11-30',
            },
            isActive: true,
        },
    ];

    describe('Pre-publish validation', () => {
        it('should validate complete event data successfully', () => {
            const validation = EventValidationUtils.validateForPublishing(
                mockEventData,
                mockTickets
            );

            expect(validation.isValid).toBe(true);
            expect(Object.keys(validation.errors)).toHaveLength(0);
        });

        it('should fail validation when required fields are missing', () => {
            const incompleteEventData = {
                ...mockEventData,
                eventName: '',
                eventDescription: '',
            };

            const validation = EventValidationUtils.validateForPublishing(
                incompleteEventData,
                mockTickets
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors.eventName).toBeDefined();
            expect(validation.errors.eventDescription).toBeDefined();
        });

        it('should fail validation when no tickets are provided', () => {
            const validation = EventValidationUtils.validateForPublishing(
                mockEventData,
                []
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors.tickets).toBeDefined();
        });

        it('should fail validation when no images are provided', () => {
            const eventDataWithoutImages = {
                ...mockEventData,
                images: [],
            };

            const validation = EventValidationUtils.validateForPublishing(
                eventDataWithoutImages,
                mockTickets
            );

            expect(validation.isValid).toBe(false);
            expect(validation.errors.images).toBeDefined();
        });
    });

    describe('Validation summary', () => {
        it('should provide correct validation summary', () => {
            const incompleteEventData = {
                ...mockEventData,
                eventName: '',
                eventDescription: '',
                images: [],
            };

            const summary = EventValidationUtils.getValidationSummary(
                incompleteEventData,
                []
            );

            expect(summary.totalErrors).toBeGreaterThan(0);
            expect(summary.missingRequiredFields.length).toBeGreaterThan(0);
            expect(summary.errorsByCategory).toBeDefined();
        });
    });

    describe('Individual validation methods', () => {
        it('should validate basic info correctly', () => {
            const validation =
                EventValidationUtils.validateBasicInfo(mockEventData);
            expect(validation.isValid).toBe(true);
        });

        it('should validate date/time correctly', () => {
            const validation =
                EventValidationUtils.validateDateTime(mockEventData);
            expect(validation.isValid).toBe(true);
        });

        it('should validate location correctly', () => {
            const validation =
                EventValidationUtils.validateLocation(mockEventData);
            expect(validation.isValid).toBe(true);
        });

        it('should validate tickets correctly', () => {
            const validation =
                EventValidationUtils.validateTickets(mockTickets);
            expect(validation.isValid).toBe(true);
        });
    });
});

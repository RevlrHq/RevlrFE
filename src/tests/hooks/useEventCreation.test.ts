import { renderHook, act, waitFor } from '@testing-library/react';
import { useEventCreation } from '../../hooks/useEventCreation';
import { EventCreationService } from '../../lib/services/EventCreationService';
import { DraftBackupService } from '../../lib/services/DraftBackupService';
import type {
    EventCreationData,
    EventTicket,
    EventCreationResponse,
    ValidationResult,
} from '../../types/event-creation';

// Mock the services
jest.mock('../../lib/services/EventCreationService');
jest.mock('../../lib/services/DraftBackupService');
jest.mock('../../lib/services/MonitoringService', () => ({
    monitoring: {
        recordError: jest.fn(),
        recordUserBehavior: jest.fn(),
    },
    MonitoringService: {
        getInstance: jest.fn(() => ({
            exportData: jest.fn(() => ({ sessionId: 'test-session' })),
        })),
    },
}));

const mockEventCreationService = EventCreationService as jest.Mocked<
    typeof EventCreationService
>;
const mockDraftBackupService = DraftBackupService as jest.Mocked<
    typeof DraftBackupService
>;

describe('useEventCreation Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        // Setup default mocks
        mockDraftBackupService.hasDraft.mockReturnValue(false);
        mockDraftBackupService.loadDraft.mockReturnValue(null);
        mockDraftBackupService.saveDraft = jest
            .fn()
            .mockResolvedValue(undefined);
        mockDraftBackupService.clearDraft = jest
            .fn()
            .mockResolvedValue(undefined);
        mockDraftBackupService.autoSave = jest
            .fn()
            .mockResolvedValue(undefined);

        mockEventCreationService.saveDraft.mockResolvedValue({
            success: true,
            data: {
                id: 'test-event-id',
                eventName: 'Test Event',
            } as EventCreationData,
            message: 'Draft saved successfully',
        });

        mockEventCreationService.loadEvent = jest.fn().mockResolvedValue({
            success: true,
            data: {
                id: 'test-event-id',
                eventName: 'Test Event',
            } as EventCreationData,
            message: 'Event loaded successfully',
        });

        mockEventCreationService.addTickets = jest.fn().mockResolvedValue({
            success: true,
            data: { id: 'test-event-id' } as EventCreationData,
            message: 'Tickets added successfully',
        });

        mockEventCreationService.publishEvent = jest.fn().mockResolvedValue({
            success: true,
            data: {
                id: 'test-event-id',
                status: 'published',
            } as EventCreationData,
            message: 'Event published successfully',
        });
    });

    describe('Initial State', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useEventCreation());

            expect(result.current.eventData.eventName).toBe('');
            expect(result.current.eventData.eventDescription).toBe('');
            expect(result.current.eventData.locationType).toBe('in-person');
            expect(result.current.tickets).toEqual([]);
            expect(result.current.currentStep).toBe(1);
            expect(result.current.isLoading).toBe(false);
            expect(result.current.isSaving).toBe(false);
            expect(result.current.isPublishing).toBe(false);
            expect(result.current.hasUnsavedChanges).toBe(false);
        });

        it('should initialize with provided initial data', () => {
            const initialData: Partial<EventCreationData> = {
                eventName: 'Initial Event',
                eventDescription: 'Initial Description',
                eventCategory: 'Conference',
            };

            const { result } = renderHook(() =>
                useEventCreation({ initialData })
            );

            expect(result.current.eventData.eventName).toBe('Initial Event');
            expect(result.current.eventData.eventDescription).toBe(
                'Initial Description'
            );
            expect(result.current.eventData.eventCategory).toBe('Conference');
        });

        it('should check for backup on initialization', () => {
            mockDraftBackupService.hasDraft.mockReturnValue(true);

            renderHook(() => useEventCreation());

            expect(mockDraftBackupService.hasDraft).toHaveBeenCalled();
        });
    });

    describe('Event Data Management', () => {
        it('should update event data correctly', () => {
            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.updateEventData({
                    eventName: 'Updated Event Name',
                    eventDescription: 'Updated Description',
                });
            });

            expect(result.current.eventData.eventName).toBe(
                'Updated Event Name'
            );
            expect(result.current.eventData.eventDescription).toBe(
                'Updated Description'
            );
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should clear errors when updating event data', () => {
            const { result } = renderHook(() => useEventCreation());

            // Set some errors first
            act(() => {
                result.current.validateCurrentStep();
            });

            // Update data should clear errors
            act(() => {
                result.current.updateEventData({ eventName: 'Test Event' });
            });

            expect(Object.keys(result.current.errors)).toHaveLength(0);
        });
    });

    describe('Ticket Management', () => {
        it('should add ticket correctly', async () => {
            const { result } = renderHook(() => useEventCreation());

            const newTicket: Omit<EventTicket, 'id'> = {
                type: 'free',
                name: 'General Admission',
                quantity: 100,
                purchaseLimit: 2,
            };

            await act(async () => {
                await result.current.addTicket(newTicket);
            });

            expect(result.current.tickets).toHaveLength(1);
            expect(result.current.tickets[0].name).toBe('General Admission');
            expect(result.current.tickets[0].id).toBeDefined();
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should update ticket correctly', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Add a ticket first
            const newTicket: Omit<EventTicket, 'id'> = {
                type: 'free',
                name: 'General Admission',
                quantity: 100,
                purchaseLimit: 2,
            };

            await act(async () => {
                await result.current.addTicket(newTicket);
            });

            const ticketId = result.current.tickets[0].id!;

            // Update the ticket
            await act(async () => {
                await result.current.updateTicket(ticketId, {
                    name: 'Updated Ticket Name',
                    quantity: 150,
                });
            });

            expect(result.current.tickets[0].name).toBe('Updated Ticket Name');
            expect(result.current.tickets[0].quantity).toBe(150);
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should remove ticket correctly', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Add a ticket first
            const newTicket: Omit<EventTicket, 'id'> = {
                type: 'free',
                name: 'General Admission',
                quantity: 100,
                purchaseLimit: 2,
            };

            await act(async () => {
                await result.current.addTicket(newTicket);
            });

            const ticketId = result.current.tickets[0].id!;

            // Remove the ticket
            await act(async () => {
                await result.current.removeTicket(ticketId);
            });

            expect(result.current.tickets).toHaveLength(0);
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should sync tickets with API when event ID exists', async () => {
            mockEventCreationService.addTickets.mockResolvedValue({
                success: true,
                data: { id: 'test-event-id' } as EventCreationData,
                message: 'Tickets added successfully',
            });

            const { result } = renderHook(() => useEventCreation());

            // Set event ID
            act(() => {
                result.current.updateEventData({ id: 'test-event-id' });
            });

            const newTicket: Omit<EventTicket, 'id'> = {
                type: 'paid',
                name: 'VIP Ticket',
                price: 50,
                quantity: 50,
                purchaseLimit: 1,
            };

            await act(async () => {
                await result.current.addTicket(newTicket);
            });

            expect(mockEventCreationService.addTickets).toHaveBeenCalledWith(
                'test-event-id',
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'VIP Ticket',
                        price: 50,
                    }),
                ])
            );
        });
    });

    describe('Draft Management', () => {
        it('should save draft successfully', async () => {
            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                });
            });

            let response: EventCreationResponse | undefined;
            await act(async () => {
                response = await result.current.saveDraft();
            });

            expect(response!.success).toBe(true);
            expect(mockEventCreationService.saveDraft).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                })
            );
            expect(result.current.hasUnsavedChanges).toBe(false);
            expect(result.current.lastSaved).toBeDefined();
        });

        it('should handle draft save failure', async () => {
            mockEventCreationService.saveDraft.mockResolvedValue({
                success: false,
                message: 'Network error',
            });

            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.updateEventData({ eventName: 'Test Event' });
            });

            let response: EventCreationResponse | undefined;
            await act(async () => {
                response = await result.current.saveDraft();
            });

            expect(response!.success).toBe(false);
            expect(result.current.errors.general).toBe('Network error');
            // When the service returns success: false, it doesn't trigger backup
            // The backup is only triggered on network errors (exceptions)
        });

        it('should save draft with tickets', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Add event data and tickets
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                });
            });

            await act(async () => {
                await result.current.addTicket({
                    type: 'free',
                    name: 'General Admission',
                    quantity: 100,
                    purchaseLimit: 2,
                });
            });

            mockEventCreationService.saveDraft.mockResolvedValue({
                success: true,
                data: { id: 'test-event-id' } as EventCreationData,
                message: 'Draft saved successfully',
            });

            mockEventCreationService.addTickets.mockResolvedValue({
                success: true,
                data: { id: 'test-event-id' } as EventCreationData,
                message: 'Tickets added successfully',
            });

            await act(async () => {
                await result.current.saveDraft();
            });

            expect(mockEventCreationService.addTickets).toHaveBeenCalledWith(
                'test-event-id',
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'General Admission',
                    }),
                ])
            );
        });
    });

    describe('Event Publishing', () => {
        it('should publish event successfully', async () => {
            mockEventCreationService.publishEvent.mockResolvedValue({
                success: true,
                data: {
                    id: 'test-event-id',
                    status: 'published',
                } as EventCreationData,
                message: 'Event published successfully',
            });

            const { result } = renderHook(() => useEventCreation());

            // Set up complete event data
            act(() => {
                result.current.updateEventData({
                    id: 'test-event-id',
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
                });
            });

            await act(async () => {
                await result.current.addTicket({
                    type: 'free',
                    name: 'General Admission',
                    quantity: 100,
                    purchaseLimit: 2,
                });
            });

            let response: EventCreationResponse | undefined;
            await act(async () => {
                response = await result.current.publishEvent();
            });

            expect(response!.success).toBe(true);
            expect(mockEventCreationService.publishEvent).toHaveBeenCalledWith(
                'test-event-id'
            );
            expect(result.current.eventData.status).toBe('published');
            expect(result.current.hasUnsavedChanges).toBe(false);
        });

        it('should validate before publishing', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Set incomplete event data
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    // Missing required fields
                });
            });

            let response: EventCreationResponse | undefined;
            await act(async () => {
                response = await result.current.publishEvent();
            });

            expect(response!.success).toBe(false);
            expect(response!.message).toContain('Validation failed');
            expect(
                mockEventCreationService.publishEvent
            ).not.toHaveBeenCalled();
        });

        it('should create draft before publishing if no event ID', async () => {
            mockEventCreationService.saveDraft.mockResolvedValue({
                success: true,
                data: { id: 'new-event-id' } as EventCreationData,
                message: 'Draft saved successfully',
            });

            mockEventCreationService.publishEvent.mockResolvedValue({
                success: true,
                data: {
                    id: 'new-event-id',
                    status: 'published',
                } as EventCreationData,
                message: 'Event published successfully',
            });

            const { result } = renderHook(() => useEventCreation());

            // Set up complete event data without ID
            act(() => {
                result.current.updateEventData({
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
                });
            });

            await act(async () => {
                await result.current.addTicket({
                    type: 'free',
                    name: 'General Admission',
                    quantity: 100,
                    purchaseLimit: 2,
                });
            });

            await act(async () => {
                await result.current.publishEvent();
            });

            expect(mockEventCreationService.saveDraft).toHaveBeenCalled();
            expect(mockEventCreationService.publishEvent).toHaveBeenCalledWith(
                'new-event-id'
            );
        });
    });

    describe('Navigation', () => {
        it('should navigate between steps', () => {
            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.goToStep(2);
            });

            expect(result.current.currentStep).toBe(2);

            act(() => {
                result.current.nextStep();
            });

            expect(result.current.currentStep).toBe(3);

            act(() => {
                result.current.previousStep();
            });

            expect(result.current.currentStep).toBe(2);
        });

        it('should not exceed step boundaries', () => {
            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.goToStep(4);
                result.current.nextStep();
            });

            expect(result.current.currentStep).toBe(4);

            act(() => {
                result.current.goToStep(1);
                result.current.previousStep();
            });

            expect(result.current.currentStep).toBe(1);
        });

        it('should validate step progression', () => {
            const { result } = renderHook(() => useEventCreation());

            // Step 1 should always be accessible
            expect(result.current.canProceedToStep(1)).toBe(true);

            // Step 2 requires basic info
            expect(result.current.canProceedToStep(2)).toBe(false);

            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                    eventCategory: 'Conference',
                });
            });

            expect(result.current.canProceedToStep(2)).toBe(true);
        });
    });

    describe('Validation', () => {
        it('should validate current step', () => {
            const { result } = renderHook(() => useEventCreation());

            // Step 1 validation - should fail without required fields
            let validation: ValidationResult;
            act(() => {
                validation = result.current.validateCurrentStep();
            });

            expect(validation.isValid).toBe(false);
            expect(validation.errors.eventName).toBeDefined();
            expect(validation.errors.eventDescription).toBeDefined();
            expect(validation.errors.eventCategory).toBeDefined();

            // Add required fields
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                    eventCategory: 'Conference',
                });
            });

            act(() => {
                validation = result.current.validateCurrentStep();
            });

            expect(validation.isValid).toBe(true);
        });

        it('should validate tickets', () => {
            const { result } = renderHook(() => useEventCreation());

            // No tickets should fail validation
            let validation: ValidationResult;
            act(() => {
                validation = result.current.validateTickets();
            });

            expect(validation.isValid).toBe(false);
            expect(validation.errors.tickets).toBeDefined();
        });

        it('should validate for publishing', () => {
            const { result } = renderHook(() => useEventCreation());

            let validation: ValidationResult;
            act(() => {
                validation = result.current.validateForPublishing();
            });

            expect(validation.isValid).toBe(false);
            expect(Object.keys(validation.errors).length).toBeGreaterThan(0);

            // Check if ready for publishing
            expect(result.current.isReadyForPublishing()).toBe(false);
        });
    });

    describe('Backup Management', () => {
        it('should restore from backup', () => {
            const backupData = {
                eventData: {
                    eventName: 'Backup Event',
                    eventDescription: 'Backup Description',
                    eventCategory: 'Workshop',
                    locationType: 'virtual' as const,
                    images: [],
                },
                tickets: [
                    {
                        id: 'backup-ticket',
                        type: 'free' as const,
                        name: 'Backup Ticket',
                        quantity: 50,
                        purchaseLimit: 1,
                    },
                ],
                timestamp: Date.now(),
                step: 2,
            };

            mockDraftBackupService.loadDraft.mockReturnValue(backupData);

            const { result } = renderHook(() => useEventCreation());

            act(() => {
                const restored = result.current.restoreFromBackup();
                expect(restored).toBe(true);
            });

            expect(result.current.eventData.eventName).toBe('Backup Event');
            expect(result.current.tickets).toHaveLength(1);
            expect(result.current.currentStep).toBe(2);
            expect(result.current.hasUnsavedChanges).toBe(true);
        });

        it('should handle missing backup', () => {
            mockDraftBackupService.loadDraft.mockReturnValue(null);

            const { result } = renderHook(() => useEventCreation());

            act(() => {
                const restored = result.current.restoreFromBackup();
                expect(restored).toBe(false);
            });
        });

        it('should clear backup', () => {
            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.clearBackup();
            });

            expect(mockDraftBackupService.clearDraft).toHaveBeenCalled();
        });
    });

    describe('Auto-save Functionality', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            // Setup auto-save mock
            mockDraftBackupService.autoSave = jest
                .fn()
                .mockResolvedValue(undefined);
        });

        it('should auto-save after interval when changes exist', async () => {
            // Mock the auto-save to fail so it falls back to local storage
            mockEventCreationService.saveDraft.mockRejectedValue(
                new Error('Network error')
            );

            const { result } = renderHook(
                () => useEventCreation({ autoSaveInterval: 100 }) // Use shorter interval for testing
            );

            act(() => {
                result.current.updateEventData({ eventName: 'Auto-save Test' });
            });

            expect(result.current.hasUnsavedChanges).toBe(true);

            // Wait for auto-save to trigger (it should fallback to local storage)
            await waitFor(
                () => {
                    expect(
                        mockDraftBackupService.autoSave
                    ).toHaveBeenCalledWith(
                        expect.objectContaining({
                            eventName: 'Auto-save Test',
                        }),
                        [],
                        1
                    );
                },
                { timeout: 1000 }
            );
        });

        it('should not auto-save when already saving', async () => {
            mockEventCreationService.saveDraft.mockImplementation(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    success: true,
                                    data: { id: 'test' } as EventCreationData,
                                    message: 'Saved',
                                }),
                            200
                        )
                    )
            );

            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            act(() => {
                result.current.updateEventData({ eventName: 'Test' });
            });

            // Start saving
            act(() => {
                result.current.saveDraft();
            });

            // Wait a bit and check that auto-save wasn't called
            await new Promise((resolve) => setTimeout(resolve, 150));

            expect(mockDraftBackupService.autoSave).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            mockEventCreationService.saveDraft.mockRejectedValue(
                new Error('Network error')
            );

            const { result } = renderHook(() => useEventCreation());

            act(() => {
                result.current.updateEventData({ eventName: 'Test Event' });
            });

            let response: EventCreationResponse;
            await act(async () => {
                response = await result.current.saveDraft();
            });

            expect(response.success).toBe(false);
            expect(response.message).toContain('Network error');
            expect(mockDraftBackupService.saveDraft).toHaveBeenCalled();
        });

        it('should clear errors when requested', () => {
            const { result } = renderHook(() => useEventCreation());

            // Trigger validation to create errors by calling publishEvent with incomplete data
            act(() => {
                result.current.publishEvent();
            });

            // Wait for the validation errors to be set
            expect(Object.keys(result.current.errors).length).toBeGreaterThan(
                0
            );

            act(() => {
                result.current.clearErrors();
            });

            expect(Object.keys(result.current.errors)).toHaveLength(0);
        });
    });

    describe('Event Loading', () => {
        it('should load event by ID', async () => {
            const eventData = {
                id: 'test-event-id',
                eventName: 'Loaded Event',
                eventDescription: 'Loaded Description',
                eventCategory: 'Conference',
                locationType: 'in-person' as const,
                images: [],
            };

            mockEventCreationService.loadEvent.mockResolvedValue({
                success: true,
                data: eventData,
                message: 'Event loaded successfully',
            });

            const { result } = renderHook(() =>
                useEventCreation({ eventId: 'test-event-id' })
            );

            await waitFor(() => {
                expect(result.current.eventData.eventName).toBe('Loaded Event');
                expect(result.current.hasUnsavedChanges).toBe(false);
                expect(result.current.lastSaved).toBeDefined();
            });

            expect(mockEventCreationService.loadEvent).toHaveBeenCalledWith(
                'test-event-id'
            );
        });

        it('should handle load event failure', async () => {
            mockEventCreationService.loadEvent.mockResolvedValue({
                success: false,
                message: 'Event not found',
            });

            const { result } = renderHook(() =>
                useEventCreation({ eventId: 'invalid-id' })
            );

            await waitFor(() => {
                expect(result.current.errors.general).toBe('Event not found');
            });
        });
    });
});

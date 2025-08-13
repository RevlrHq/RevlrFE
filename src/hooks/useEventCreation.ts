import { useState, useEffect, useCallback } from 'react';
import { EventCreationService } from '../lib/services/EventCreationService';
import { DraftBackupService } from '../lib/services/DraftBackupService';
import { useAutoSave } from './useDebounce';
import {
    monitoring,
    MonitoringService,
} from '../lib/services/MonitoringService';
import type {
    EventCreationData,
    EventTicket,
    EventCreationState,
    ValidationErrors,
    ValidationResult,
    EventCreationStep,
    EventCreationResponse,
} from '../types/event-creation';

interface UseEventCreationProps {
    eventId?: string;
    initialData?: Partial<EventCreationData>;
    autoSaveInterval?: number; // in milliseconds
}

interface UseEventCreationReturn {
    // State
    eventData: EventCreationData;
    tickets: EventTicket[];
    currentStep: EventCreationStep;
    isLoading: boolean;
    isSaving: boolean;
    isPublishing: boolean;
    errors: ValidationErrors;
    lastSaved?: Date;
    hasUnsavedChanges: boolean;

    // Actions
    updateEventData: (data: Partial<EventCreationData>) => void;
    addTicket: (ticket: Omit<EventTicket, 'id'>) => Promise<void>;
    updateTicket: (
        ticketId: string,
        updates: Partial<EventTicket>
    ) => Promise<void>;
    removeTicket: (ticketId: string) => Promise<void>;
    saveDraft: () => Promise<EventCreationResponse>;
    publishEvent: () => Promise<EventCreationResponse>;
    loadEvent: (eventId: string) => Promise<EventCreationResponse>;

    // Navigation
    goToStep: (step: EventCreationStep) => void;
    nextStep: () => void;
    previousStep: () => void;
    canProceedToStep: (step: EventCreationStep) => boolean;

    // Validation
    validateCurrentStep: () => ValidationResult;
    validateForPublishing: () => ValidationResult;
    validateTickets: () => ValidationResult;
    clearErrors: () => void;
    isReadyForPublishing: () => boolean;

    // Draft management
    restoreFromBackup: () => boolean;
    clearBackup: () => void;
    hasBackup: boolean;
}

const initialEventData: EventCreationData = {
    eventName: '',
    eventDescription: '',
    eventCategory: '',
    locationType: 'in-person',
    images: [],
    isDraft: true,
};

export function useEventCreation({
    eventId,
    initialData,
    autoSaveInterval = 30000, // 30 seconds
}: UseEventCreationProps = {}): UseEventCreationReturn {
    const [state, setState] = useState<EventCreationState>({
        eventData: { ...initialEventData, ...initialData },
        tickets: [],
        currentStep: 1,
        isLoading: false,
        isSaving: false,
        isPublishing: false,
        errors: {},
        hasUnsavedChanges: false,
    });

    const [hasBackup, setHasBackup] = useState(DraftBackupService.hasDraft());
    // const formStartTimeRef = useRef<number>(Date.now()); // Commented out - unused

    // Debounced auto-save functionality
    const autoSaveData = useCallback(
        async (data: {
            eventData: EventCreationData;
            tickets: EventTicket[];
        }) => {
            try {
                // Try to save to server first
                const response = await EventCreationService.saveDraft(
                    data.eventData
                );

                if (response.success) {
                    // Clear local backup on successful server save
                    DraftBackupService.clearDraft();
                    setHasBackup(false);

                    // Update state with server response
                    setState((prev) => ({
                        ...prev,
                        eventData: response.data
                            ? { ...prev.eventData, ...response.data }
                            : prev.eventData,
                        lastSaved: new Date(),
                        hasUnsavedChanges: false,
                    }));
                } else {
                    throw new Error(response.message || 'Server save failed');
                }
            } catch (error) {
                // Fallback to local storage
                DraftBackupService.autoSave(
                    data.eventData,
                    data.tickets,
                    state.currentStep
                );
                setHasBackup(true);

                // Track the fallback
                monitoring.recordError({
                    message: `Auto-save fallback: ${(error as Error).message}`,
                    component: 'useEventCreation',
                    action: 'auto_save_fallback',
                    timestamp: Date.now(),
                    sessionId:
                        MonitoringService.getInstance().exportData().sessionId,
                });
            }
        },
        [state.currentStep]
    );

    useAutoSave(
        { eventData: state.eventData, tickets: state.tickets },
        autoSaveData,
        {
            delay: autoSaveInterval,
            enabled: state.hasUnsavedChanges && !state.isSaving,
            onSaveStart: () => {
                monitoring.recordUserBehavior({
                    event: 'auto_save',
                    component: 'useEventCreation',
                    action: 'start',
                });
            },
            onSaveSuccess: () => {
                monitoring.recordUserBehavior({
                    event: 'auto_save',
                    component: 'useEventCreation',
                    action: 'success',
                });
            },
            onSaveError: (error) => {
                monitoring.recordError({
                    message: error.message,
                    component: 'useEventCreation',
                    action: 'auto_save_error',
                    timestamp: Date.now(),
                    sessionId:
                        MonitoringService.getInstance().exportData().sessionId,
                });
            },
        }
    );

    // Load event on mount if eventId is provided
    useEffect(() => {
        if (eventId) {
            loadEvent(eventId);
        }
    }, [eventId]);

    // Update event data
    const updateEventData = useCallback((data: Partial<EventCreationData>) => {
        setState((prev) => ({
            ...prev,
            eventData: { ...prev.eventData, ...data },
            hasUnsavedChanges: true,
            errors: {}, // Clear errors when data changes
        }));
    }, []);

    // Add ticket
    const addTicket = useCallback(
        async (ticket: Omit<EventTicket, 'id'>) => {
            const newTicket: EventTicket = {
                ...ticket,
                id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            setState((prev) => ({
                ...prev,
                tickets: [...prev.tickets, newTicket],
                hasUnsavedChanges: true,
            }));

            // If we have an event ID, try to add the ticket via API
            if (state.eventData.id) {
                try {
                    const response = await EventCreationService.addTickets(
                        state.eventData.id,
                        [newTicket]
                    );

                    if (response.success && response.data) {
                        // Update the ticket with server response if available
                        setState((prev) => ({
                            ...prev,
                            tickets: prev.tickets.map((t) =>
                                t.id === newTicket.id
                                    ? {
                                          ...t,
                                          ...response.data?.tickets?.find(
                                              (st: EventTicket) =>
                                                  st.name === t.name
                                          ),
                                      }
                                    : t
                            ),
                        }));
                    }
                } catch (error) {
                    console.warn('Failed to sync ticket with server:', error);
                    // Keep the local ticket, will sync on next save
                }
            }
        },
        [state.eventData.id]
    );

    // Update ticket
    const updateTicket = useCallback(
        async (ticketId: string, updates: Partial<EventTicket>) => {
            setState((prev) => ({
                ...prev,
                tickets: prev.tickets.map((ticket) =>
                    ticket.id === ticketId ? { ...ticket, ...updates } : ticket
                ),
                hasUnsavedChanges: true,
            }));

            // If we have an event ID, try to update the ticket via API
            if (state.eventData.id) {
                try {
                    const updatedTicket = state.tickets.find(
                        (t) => t.id === ticketId
                    );
                    if (updatedTicket) {
                        const response = await EventCreationService.addTickets(
                            state.eventData.id,
                            [{ ...updatedTicket, ...updates }]
                        );

                        if (!response.success) {
                            console.warn(
                                'Failed to update ticket on server:',
                                response.message
                            );
                        }
                    }
                } catch (error) {
                    console.warn(
                        'Failed to sync ticket update with server:',
                        error
                    );
                    // Keep the local update, will sync on next save
                }
            }
        },
        [state.eventData.id, state.tickets]
    );

    // Remove ticket
    const removeTicket = useCallback(async (ticketId: string) => {
        setState((prev) => ({
            ...prev,
            tickets: prev.tickets.filter((ticket) => ticket.id !== ticketId),
            hasUnsavedChanges: true,
        }));

        // Note: API doesn't seem to have a delete ticket endpoint
        // The ticket will be removed from the server on next save/publish
        // when we send the updated tickets array
    }, []);

    // Save draft
    const saveDraft = useCallback(async (): Promise<EventCreationResponse> => {
        setState((prev) => ({ ...prev, isSaving: true, errors: {} }));

        try {
            const response = await EventCreationService.saveDraft(
                state.eventData
            );

            if (response.success) {
                // Add tickets if event was created and we have tickets
                if (response.data?.id && state.tickets.length > 0) {
                    const ticketResponse =
                        await EventCreationService.addTickets(
                            response.data.id,
                            state.tickets
                        );
                    if (!ticketResponse.success) {
                        console.warn(
                            'Failed to add tickets:',
                            ticketResponse.message
                        );
                    }
                }

                setState((prev) => ({
                    ...prev,
                    eventData: response.data
                        ? { ...prev.eventData, ...response.data }
                        : prev.eventData,
                    hasUnsavedChanges: false,
                    lastSaved: new Date(),
                }));

                // Clear local backup after successful save
                DraftBackupService.clearDraft();
                setHasBackup(false);
            } else {
                setState((prev) => ({
                    ...prev,
                    errors: response.errors || {
                        general: response.message || 'Failed to save draft',
                    },
                }));
            }

            return response;
        } catch (error) {
            console.warn('Failed to save draft:', error);
            const errorMessage = 'Network error. Draft saved locally.';
            setState((prev) => ({
                ...prev,
                errors: { general: errorMessage },
            }));

            // Save to local storage as fallback
            DraftBackupService.saveDraft(
                state.eventData,
                state.tickets,
                state.currentStep
            );
            setHasBackup(true);

            return { success: false, message: errorMessage };
        } finally {
            setState((prev) => ({ ...prev, isSaving: false }));
        }
    }, [state.eventData, state.tickets, state.currentStep]);

    // Publish event
    const publishEvent =
        useCallback(async (): Promise<EventCreationResponse> => {
            // Validate before publishing
            const validation = validateForPublishing();
            if (!validation.isValid) {
                setState((prev) => ({ ...prev, errors: validation.errors }));
                return {
                    success: false,
                    message:
                        'Validation failed. Please fix the errors before publishing.',
                    errors: validation.errors,
                };
            }

            setState((prev) => ({ ...prev, isPublishing: true, errors: {} }));

            try {
                let eventId = state.eventData.id;

                // Save as draft first if no ID
                if (!eventId) {
                    const draftResponse = await EventCreationService.saveDraft(
                        state.eventData
                    );
                    if (!draftResponse.success || !draftResponse.data?.id) {
                        throw new Error(
                            draftResponse.message ||
                                'Failed to create draft before publishing'
                        );
                    }
                    eventId = draftResponse.data.id;

                    // Update state with the new event ID
                    setState((prev) => ({
                        ...prev,
                        eventData: {
                            ...prev.eventData,
                            id: eventId,
                            ...draftResponse.data,
                        },
                    }));
                }

                if (!eventId) {
                    throw new Error('No event ID available for publishing');
                }

                // Add tickets if we have any
                if (state.tickets.length > 0) {
                    const ticketResponse =
                        await EventCreationService.addTickets(
                            eventId,
                            state.tickets
                        );
                    if (!ticketResponse.success) {
                        throw new Error(
                            ticketResponse.message ||
                                'Failed to add tickets to event'
                        );
                    }
                }

                // Publish the event
                const response =
                    await EventCreationService.publishEvent(eventId);

                if (response.success) {
                    setState((prev) => ({
                        ...prev,
                        eventData: response.data
                            ? {
                                  ...prev.eventData,
                                  ...response.data,
                                  status: 'published',
                                  isDraft: false,
                              }
                            : {
                                  ...prev.eventData,
                                  status: 'published',
                                  isDraft: false,
                              },
                        hasUnsavedChanges: false,
                        lastSaved: new Date(),
                    }));

                    // Clear local backup after successful publish
                    DraftBackupService.clearDraft();
                    setHasBackup(false);
                } else {
                    setState((prev) => ({
                        ...prev,
                        errors: response.errors || {
                            general:
                                response.message || 'Failed to publish event',
                        },
                    }));
                }

                return response;
            } catch (error: unknown) {
                const errorMessage =
                    (error instanceof Error
                        ? error.message
                        : 'Unknown error') || 'Failed to publish event';
                setState((prev) => ({
                    ...prev,
                    errors: { general: errorMessage },
                }));

                return { success: false, message: errorMessage };
            } finally {
                setState((prev) => ({ ...prev, isPublishing: false }));
            }
        }, [state.eventData, state.tickets]);

    // Load event
    const loadEvent = useCallback(
        async (eventId: string): Promise<EventCreationResponse> => {
            setState((prev) => ({ ...prev, isLoading: true, errors: {} }));

            try {
                const response = await EventCreationService.loadEvent(eventId);

                if (response.success && response.data) {
                    setState((prev) => ({
                        ...prev,
                        eventData: { ...prev.eventData, ...response.data },
                        hasUnsavedChanges: false,
                        lastSaved: new Date(),
                    }));
                } else {
                    setState((prev) => ({
                        ...prev,
                        errors: {
                            general: response.message || 'Failed to load event',
                        },
                    }));
                }

                return response;
            } catch {
                const errorMessage = 'Failed to load event';
                setState((prev) => ({
                    ...prev,
                    errors: { general: errorMessage },
                }));

                return { success: false, message: errorMessage };
            } finally {
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        },
        []
    );

    // Navigation functions
    const goToStep = useCallback((step: EventCreationStep) => {
        setState((prev) => ({ ...prev, currentStep: step }));
    }, []);

    const nextStep = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentStep: Math.min(4, prev.currentStep + 1) as EventCreationStep,
        }));
    }, []);

    const previousStep = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentStep: Math.max(1, prev.currentStep - 1) as EventCreationStep,
        }));
    }, []);

    const canProceedToStep = useCallback(
        (step: EventCreationStep): boolean => {
            // Basic validation for step progression
            const { eventData } = state;

            switch (step) {
                case 1:
                    return true;
                case 2:
                    return !!(
                        eventData.eventName &&
                        eventData.eventDescription &&
                        eventData.eventCategory
                    );
                case 3:
                    return !!(
                        eventData.eventName &&
                        eventData.eventDescription &&
                        eventData.eventCategory &&
                        eventData.dateRange &&
                        eventData.timeRange
                    );
                case 4:
                    return !!(
                        eventData.eventName &&
                        eventData.eventDescription &&
                        eventData.eventCategory &&
                        eventData.dateRange &&
                        eventData.timeRange &&
                        state.tickets.length > 0
                    );
                default:
                    return false;
            }
        },
        [state]
    );

    // Ticket validation
    const validateTickets = useCallback((): ValidationResult => {
        const errors: ValidationErrors = {};

        if (state.tickets.length === 0) {
            errors.tickets = 'At least one ticket type is required';
            return { isValid: false, errors };
        }

        // Validate individual tickets
        state.tickets.forEach((ticket, index) => {
            const ticketErrors: string[] = [];

            if (!ticket.name?.trim()) {
                ticketErrors.push('Ticket name is required');
            }

            if (ticket.quantity < 1) {
                ticketErrors.push('Quantity must be at least 1');
            }

            if (ticket.purchaseLimit < 1) {
                ticketErrors.push('Purchase limit must be at least 1');
            }

            if (ticket.purchaseLimit > ticket.quantity) {
                ticketErrors.push('Purchase limit cannot exceed quantity');
            }

            if (
                ticket.type === 'paid' &&
                (!ticket.price || ticket.price <= 0)
            ) {
                ticketErrors.push(
                    'Price must be greater than 0 for paid tickets'
                );
            }

            // Sales period validation
            if (ticket.salesPeriod?.startDate && ticket.salesPeriod?.endDate) {
                const startDate = new Date(ticket.salesPeriod.startDate);
                const endDate = new Date(ticket.salesPeriod.endDate);

                if (startDate >= endDate) {
                    ticketErrors.push('End date must be after start date');
                }

                // Check if start date is in the past
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (startDate < now) {
                    ticketErrors.push('Start date cannot be in the past');
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
    }, [state.tickets]);

    // Validation functions
    const validateCurrentStep = useCallback((): ValidationResult => {
        const errors: ValidationErrors = {};
        const { eventData } = state;

        switch (state.currentStep) {
            case 1:
                if (!eventData.eventName?.trim()) {
                    errors.eventName = 'Event name is required';
                }
                if (!eventData.eventDescription?.trim()) {
                    errors.eventDescription = 'Event description is required';
                }
                if (!eventData.eventCategory?.trim()) {
                    errors.eventCategory = 'Event category is required';
                }
                break;

            case 2:
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
                break;

            case 3:
                // Validate tickets for step 3
                const ticketValidation = validateTickets();
                Object.assign(errors, ticketValidation.errors);
                break;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }, [state, validateTickets]);

    const validateForPublishing = useCallback((): ValidationResult => {
        const errors: ValidationErrors = {};
        const { eventData } = state;

        // Required fields validation
        if (!eventData.eventName?.trim())
            errors.eventName = 'Event name is required';
        if (!eventData.eventDescription?.trim())
            errors.eventDescription = 'Event description is required';
        if (!eventData.eventCategory?.trim())
            errors.eventCategory = 'Event category is required';
        if (!eventData.dateRange?.startDate)
            errors.startDate = 'Start date is required';
        if (!eventData.dateRange?.endDate)
            errors.endDate = 'End date is required';
        if (!eventData.timeRange?.startTime)
            errors.startTime = 'Start time is required';
        if (!eventData.timeRange?.endTime)
            errors.endTime = 'End time is required';

        // Location validation
        if (
            eventData.locationType === 'in-person' ||
            eventData.locationType === 'hybrid'
        ) {
            if (!eventData.locationDetails?.venueName?.trim()) {
                errors.venueName =
                    'Venue name is required for in-person events';
            }
            if (!eventData.locationDetails?.address?.trim()) {
                errors.address = 'Address is required for in-person events';
            }
        }

        if (
            eventData.locationType === 'virtual' ||
            eventData.locationType === 'hybrid'
        ) {
            if (!eventData.locationDetails?.eventLink?.trim()) {
                errors.eventLink = 'Event link is required for virtual events';
            }
        }

        // Comprehensive ticket validation
        const ticketValidation = validateTickets();
        Object.assign(errors, ticketValidation.errors);

        // Image validation
        if (eventData.images.length === 0) {
            errors.images = 'At least one event image is required';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }, [state, validateTickets]);

    const clearErrors = useCallback(() => {
        setState((prev) => ({ ...prev, errors: {} }));
    }, []);

    // Check if event is ready for publishing
    const isReadyForPublishing = useCallback((): boolean => {
        const validation = validateForPublishing();
        return validation.isValid;
    }, [validateForPublishing]);

    // Backup management
    const restoreFromBackup = useCallback((): boolean => {
        const backup = DraftBackupService.loadDraft();
        if (!backup) return false;

        setState((prev) => ({
            ...prev,
            eventData: backup.eventData,
            tickets: backup.tickets,
            currentStep: backup.step as EventCreationStep,
            hasUnsavedChanges: true,
        }));

        setHasBackup(false);
        return true;
    }, []);

    const clearBackup = useCallback(() => {
        DraftBackupService.clearDraft();
        setHasBackup(false);
    }, []);

    return {
        // State
        eventData: state.eventData,
        tickets: state.tickets,
        currentStep: state.currentStep as EventCreationStep,
        isLoading: state.isLoading,
        isSaving: state.isSaving,
        isPublishing: state.isPublishing,
        errors: state.errors,
        lastSaved: state.lastSaved,
        hasUnsavedChanges: state.hasUnsavedChanges,

        // Actions
        updateEventData,
        addTicket,
        updateTicket,
        removeTicket,
        saveDraft,
        publishEvent,
        loadEvent,

        // Navigation
        goToStep,
        nextStep,
        previousStep,
        canProceedToStep,

        // Validation
        validateCurrentStep,
        validateForPublishing,
        validateTickets,
        clearErrors,
        isReadyForPublishing,

        // Draft management
        restoreFromBackup,
        clearBackup,
        hasBackup,
    };
}

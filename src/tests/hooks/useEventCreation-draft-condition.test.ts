import { renderHook, act, waitFor } from '@testing-library/react';
import { useEventCreation } from '../../hooks/useEventCreation';
import { EventCreationService } from '../../lib/services/EventCreationService';
import { DraftBackupService } from '../../lib/services/DraftBackupService';

// Mock the services
jest.mock('../../lib/services/EventCreationService');
jest.mock('../../lib/services/DraftBackupService');
jest.mock('../../lib/services/MonitoringService', () => ({
    monitoring: {
        recordUserBehavior: jest.fn(),
        recordError: jest.fn(),
    },
    MonitoringService: {
        getInstance: () => ({
            exportData: () => ({ sessionId: 'test-session' }),
        }),
    },
}));

const mockEventCreationService = EventCreationService as jest.Mocked<
    typeof EventCreationService
>;
const mockDraftBackupService = DraftBackupService as jest.Mocked<
    typeof DraftBackupService
>;

describe('useEventCreation - Draft Save Condition', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDraftBackupService.hasDraft.mockReturnValue(false);
        mockEventCreationService.saveDraft.mockResolvedValue({
            success: true,
            data: {
                id: 'test-event-id',
                eventName: '',
                eventDescription: '',
                eventCategory: '',
                locationType: 'in-person' as const,
                images: [],
                isDraft: true,
            },
        });
    });

    describe('Auto-save behavior', () => {
        it('should not auto-save when event name is empty', async () => {
            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            // Update event description without event name
            act(() => {
                result.current.updateEventData({
                    eventDescription: 'Test description',
                });
            });

            // Wait for potential auto-save
            await waitFor(
                () => new Promise((resolve) => setTimeout(resolve, 150)),
                {
                    timeout: 200,
                }
            );

            // Should not have called saveDraft
            expect(mockEventCreationService.saveDraft).not.toHaveBeenCalled();
        });

        it('should auto-save when event name is provided', async () => {
            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            // Update with event name
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    eventDescription: 'Test description',
                });
            });

            // Wait for auto-save to trigger
            await waitFor(
                () => {
                    expect(
                        mockEventCreationService.saveDraft
                    ).toHaveBeenCalled();
                },
                { timeout: 200 }
            );

            expect(mockEventCreationService.saveDraft).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventName: 'Test Event',
                    eventDescription: 'Test description',
                })
            );
        });

        it('should not auto-save when event name is only whitespace', async () => {
            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            // Update with whitespace-only event name
            act(() => {
                result.current.updateEventData({
                    eventName: '   ',
                    eventDescription: 'Test description',
                });
            });

            // Wait for potential auto-save
            await waitFor(
                () => new Promise((resolve) => setTimeout(resolve, 150)),
                {
                    timeout: 200,
                }
            );

            // Should not have called saveDraft
            expect(mockEventCreationService.saveDraft).not.toHaveBeenCalled();
        });

        it('should stop auto-saving when event name is removed', async () => {
            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            // First, set event name and trigger auto-save
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                    eventDescription: 'Test description',
                });
            });

            // Wait for first auto-save
            await waitFor(
                () => {
                    expect(
                        mockEventCreationService.saveDraft
                    ).toHaveBeenCalledTimes(1);
                },
                { timeout: 200 }
            );

            // Clear the mock to track subsequent calls
            mockEventCreationService.saveDraft.mockClear();

            // Remove event name
            act(() => {
                result.current.updateEventData({
                    eventName: '',
                    eventDescription: 'Updated description',
                });
            });

            // Wait for potential auto-save
            await waitFor(
                () => new Promise((resolve) => setTimeout(resolve, 150)),
                {
                    timeout: 200,
                }
            );

            // Should not have called saveDraft again
            expect(mockEventCreationService.saveDraft).not.toHaveBeenCalled();
        });
    });

    describe('Manual save behavior', () => {
        it('should prevent manual save when event name is empty', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Try to save without event name
            let saveResult;
            await act(async () => {
                saveResult = await result.current.saveDraft();
            });

            expect(saveResult).toEqual({
                success: false,
                message: 'Event name is required before saving draft',
                errors: { eventName: 'Event name is required' },
            });

            expect(mockEventCreationService.saveDraft).not.toHaveBeenCalled();
        });

        it('should allow manual save when event name is provided', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Set event name
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                });
            });

            // Try to save with event name
            let saveResult;
            await act(async () => {
                saveResult = await result.current.saveDraft();
            });

            expect(saveResult).toEqual({
                success: true,
                data: {
                    id: 'test-event-id',
                    eventName: '',
                    eventDescription: '',
                    eventCategory: '',
                    locationType: 'in-person',
                    images: [],
                    isDraft: true,
                },
            });

            expect(mockEventCreationService.saveDraft).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventName: 'Test Event',
                })
            );
        });

        it('should prevent manual save when event name is only whitespace', async () => {
            const { result } = renderHook(() => useEventCreation());

            // Set whitespace-only event name
            act(() => {
                result.current.updateEventData({
                    eventName: '   ',
                });
            });

            // Try to save
            let saveResult;
            await act(async () => {
                saveResult = await result.current.saveDraft();
            });

            expect(saveResult).toEqual({
                success: false,
                message: 'Event name is required before saving draft',
                errors: { eventName: 'Event name is required' },
            });

            expect(mockEventCreationService.saveDraft).not.toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('should handle event name with leading/trailing spaces correctly', async () => {
            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            // Update with event name that has spaces
            act(() => {
                result.current.updateEventData({
                    eventName: '  Test Event  ',
                    eventDescription: 'Test description',
                });
            });

            // Wait for auto-save to trigger
            await waitFor(
                () => {
                    expect(
                        mockEventCreationService.saveDraft
                    ).toHaveBeenCalled();
                },
                { timeout: 200 }
            );

            expect(mockEventCreationService.saveDraft).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventName: '  Test Event  ',
                })
            );
        });

        it('should work correctly when event name is updated multiple times', async () => {
            const { result } = renderHook(() =>
                useEventCreation({ autoSaveInterval: 100 })
            );

            // First update without event name
            act(() => {
                result.current.updateEventData({
                    eventDescription: 'Test description',
                });
            });

            // Wait a bit
            await waitFor(
                () => new Promise((resolve) => setTimeout(resolve, 50))
            );

            // Then add event name
            act(() => {
                result.current.updateEventData({
                    eventName: 'Test Event',
                });
            });

            // Wait for auto-save to trigger
            await waitFor(
                () => {
                    expect(
                        mockEventCreationService.saveDraft
                    ).toHaveBeenCalled();
                },
                { timeout: 200 }
            );

            expect(mockEventCreationService.saveDraft).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventName: 'Test Event',
                    eventDescription: 'Test description',
                })
            );
        });
    });
});

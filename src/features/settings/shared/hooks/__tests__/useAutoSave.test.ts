/**
 * Tests for useAutoSave hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
});

// Mock navigator.sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
    writable: true,
    value: jest.fn(),
});

describe('useAutoSave', () => {
    let mockSaveFunction: jest.MockedFunction<(data: any) => Promise<void>>;

    beforeEach(() => {
        mockSaveFunction = jest.fn().mockResolvedValue(undefined);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() =>
            useAutoSave({ name: 'John' }, mockSaveFunction)
        );

        const [state] = result.current;

        expect(state.isSaving).toBe(false);
        expect(state.lastSaved).toBeNull();
        expect(state.hasUnsavedChanges).toBe(false);
        expect(state.saveError).toBeNull();
        expect(state.retryCount).toBe(0);
        expect(state.isOnline).toBe(true);
    });

    it('should detect unsaved changes when data changes', () => {
        const { result, rerender } = renderHook(
            ({ data }) => useAutoSave(data, mockSaveFunction),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data
        rerender({ data: { name: 'Jane' } });

        const [state] = result.current;
        expect(state.hasUnsavedChanges).toBe(true);
    });

    it('should auto-save after debounce delay', async () => {
        const { result, rerender } = renderHook(
            ({ data }) =>
                useAutoSave(data, mockSaveFunction, { debounceMs: 1000 }),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data
        rerender({ data: { name: 'Jane' } });

        // Fast-forward past debounce delay
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Wait for async operations
        await act(async () => {
            await Promise.resolve();
        });

        expect(mockSaveFunction).toHaveBeenCalledWith({ name: 'Jane' });
    });

    it('should not auto-save when disabled', () => {
        const { result, rerender } = renderHook(
            ({ data }) =>
                useAutoSave(data, mockSaveFunction, { debounceMs: 1000 }),
            { initialProps: { data: { name: 'John' } } }
        );

        const [, actions] = result.current;

        // Disable auto-save
        act(() => {
            actions.disableAutoSave();
        });

        // Change data
        rerender({ data: { name: 'Jane' } });

        // Fast-forward past debounce delay
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockSaveFunction).not.toHaveBeenCalled();
    });

    it('should handle save errors and retry', async () => {
        mockSaveFunction
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce(undefined);

        const { result, rerender } = renderHook(
            ({ data }) =>
                useAutoSave(data, mockSaveFunction, {
                    debounceMs: 1000,
                    maxRetries: 2,
                    retryDelayMs: 500,
                }),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data
        rerender({ data: { name: 'Jane' } });

        // Fast-forward past debounce delay
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Wait for first save attempt to fail
        await act(async () => {
            await Promise.resolve();
        });

        let [state] = result.current;
        expect(state.saveError).toBeTruthy();
        expect(state.retryCount).toBe(1);

        // Fast-forward past retry delay
        act(() => {
            jest.advanceTimersByTime(500);
        });

        // Wait for retry to succeed
        await act(async () => {
            await Promise.resolve();
        });

        [state] = result.current;
        expect(state.saveError).toBeNull();
        expect(state.lastSaved).toBeTruthy();
    });

    it('should handle manual save', async () => {
        const { result } = renderHook(() =>
            useAutoSave({ name: 'John' }, mockSaveFunction)
        );

        const [, actions] = result.current;

        await act(async () => {
            await actions.save(true); // Force save
        });

        expect(mockSaveFunction).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should handle offline mode', () => {
        // Mock offline
        Object.defineProperty(navigator, 'onLine', { value: false });

        const { result, rerender } = renderHook(
            ({ data }) =>
                useAutoSave(data, mockSaveFunction, {
                    debounceMs: 1000,
                    enableOfflineQueue: true,
                }),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data while offline
        rerender({ data: { name: 'Jane' } });

        // Fast-forward past debounce delay
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Should not call save function while offline
        expect(mockSaveFunction).not.toHaveBeenCalled();

        const [state] = result.current;
        expect(state.isOnline).toBe(false);
    });

    it('should reset state correctly', () => {
        const { result, rerender } = renderHook(
            ({ data }) => useAutoSave(data, mockSaveFunction),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data to create unsaved changes
        rerender({ data: { name: 'Jane' } });

        const [, actions] = result.current;

        act(() => {
            actions.reset();
        });

        const [state] = result.current;
        expect(state.hasUnsavedChanges).toBe(false);
        expect(state.saveError).toBeNull();
        expect(state.retryCount).toBe(0);
    });

    it('should call lifecycle callbacks', async () => {
        const onSaveStart = jest.fn();
        const onSaveSuccess = jest.fn();
        const onSaveError = jest.fn();

        const { result, rerender } = renderHook(
            ({ data }) =>
                useAutoSave(data, mockSaveFunction, {
                    debounceMs: 1000,
                    onSaveStart,
                    onSaveSuccess,
                    onSaveError,
                }),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data
        rerender({ data: { name: 'Jane' } });

        // Fast-forward past debounce delay
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Wait for save to complete
        await act(async () => {
            await Promise.resolve();
        });

        expect(onSaveStart).toHaveBeenCalled();
        expect(onSaveSuccess).toHaveBeenCalledWith({ name: 'Jane' });
        expect(onSaveError).not.toHaveBeenCalled();
    });

    it('should handle conflict resolution', async () => {
        const onConflict = jest.fn().mockReturnValue({ name: 'Merged' });

        // Mock a conflict scenario by making the first save fail
        mockSaveFunction
            .mockRejectedValueOnce(new Error('Conflict'))
            .mockResolvedValueOnce(undefined);

        const { result, rerender } = renderHook(
            ({ data }) =>
                useAutoSave(data, mockSaveFunction, {
                    debounceMs: 1000,
                    conflictResolution: 'merge',
                    onConflict,
                    maxRetries: 1,
                    retryDelayMs: 100,
                }),
            { initialProps: { data: { name: 'John' } } }
        );

        // Change data
        rerender({ data: { name: 'Jane' } });

        // Fast-forward past debounce delay
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Wait for first attempt to fail
        await act(async () => {
            await Promise.resolve();
        });

        // Fast-forward past retry delay
        act(() => {
            jest.advanceTimersByTime(100);
        });

        // Wait for retry
        await act(async () => {
            await Promise.resolve();
        });

        // Should have called conflict resolution
        expect(onConflict).toHaveBeenCalled();
    });
});

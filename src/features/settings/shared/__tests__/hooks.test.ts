import { renderHook, act, waitFor } from '@testing-library/react';
import {
    useSettingsNavigation,
    useSettingsValidation,
    useAutoSave,
    type ValidationRule,
} from '../hooks';

describe('Settings Shared Hooks', () => {
    describe('useSettingsNavigation', () => {
        it('initializes with default tab', () => {
            const { result } = renderHook(() => useSettingsNavigation());
            expect(result.current.activeTab).toBe('profile');
        });

        it('initializes with custom tab', () => {
            const { result } = renderHook(() =>
                useSettingsNavigation('security')
            );
            expect(result.current.activeTab).toBe('security');
        });

        it('changes active tab', () => {
            const { result } = renderHook(() => useSettingsNavigation());

            act(() => {
                result.current.setActiveTab('notifications');
            });

            expect(result.current.activeTab).toBe('notifications');
        });

        it('checks if tab is active', () => {
            const { result } = renderHook(() =>
                useSettingsNavigation('security')
            );

            expect(result.current.isTabActive('security')).toBe(true);
            expect(result.current.isTabActive('profile')).toBe(false);
        });

        it('gets next tab', () => {
            const { result } = renderHook(() =>
                useSettingsNavigation('profile')
            );
            expect(result.current.getNextTab()).toBe('security');
        });

        it('gets previous tab', () => {
            const { result } = renderHook(() =>
                useSettingsNavigation('security')
            );
            expect(result.current.getPreviousTab()).toBe('profile');
        });

        it('returns null for next tab at end', () => {
            const { result } = renderHook(() =>
                useSettingsNavigation('account')
            );
            expect(result.current.getNextTab()).toBe(null);
        });

        it('returns null for previous tab at start', () => {
            const { result } = renderHook(() =>
                useSettingsNavigation('profile')
            );
            expect(result.current.getPreviousTab()).toBe(null);
        });
    });

    describe('useSettingsValidation', () => {
        const mockRules: ValidationRule<{ name: string; email: string }>[] = [
            {
                field: 'name',
                required: true,
                validator: (value) => {
                    if (value.length < 2)
                        return 'Name must be at least 2 characters';
                    return null;
                },
            },
            {
                field: 'email',
                required: true,
                validator: (value) => {
                    if (!value.includes('@')) return 'Invalid email format';
                    return null;
                },
            },
        ];

        it('initializes with no errors', () => {
            const { result } = renderHook(() =>
                useSettingsValidation({ rules: mockRules })
            );

            expect(result.current.errors).toEqual({});
            expect(result.current.isValid).toBe(true);
        });

        it('validates data and returns errors', () => {
            const { result } = renderHook(() =>
                useSettingsValidation({ rules: mockRules })
            );

            const testData = { name: 'A', email: 'invalid' };

            act(() => {
                const isValid = result.current.validate(testData);
                expect(isValid).toBe(false);
            });

            expect(result.current.errors.name).toBe(
                'Name must be at least 2 characters'
            );
            expect(result.current.errors.email).toBe('Invalid email format');
            expect(result.current.isValid).toBe(false);
        });

        it('validates individual field', () => {
            const { result } = renderHook(() =>
                useSettingsValidation({ rules: mockRules })
            );

            const testData = { name: 'John', email: 'john@example.com' };
            const error = result.current.validateField('name', 'A', testData);

            expect(error).toBe('Name must be at least 2 characters');
        });

        it('clears all errors', () => {
            const { result } = renderHook(() =>
                useSettingsValidation({ rules: mockRules })
            );

            const testData = { name: 'A', email: 'invalid' };

            act(() => {
                result.current.validate(testData);
            });

            expect(result.current.isValid).toBe(false);

            act(() => {
                result.current.clearErrors();
            });

            expect(result.current.errors).toEqual({});
            expect(result.current.isValid).toBe(true);
        });

        it('clears field error', () => {
            const { result } = renderHook(() =>
                useSettingsValidation({ rules: mockRules })
            );

            const testData = { name: 'A', email: 'invalid' };

            act(() => {
                result.current.validate(testData);
            });

            act(() => {
                result.current.clearFieldError('name');
            });

            expect(result.current.errors.name).toBeUndefined();
            expect(result.current.errors.email).toBe('Invalid email format');
        });

        it('checks if field has error', () => {
            const { result } = renderHook(() =>
                useSettingsValidation({ rules: mockRules })
            );

            const testData = { name: 'A', email: 'john@example.com' };

            act(() => {
                result.current.validate(testData);
            });

            expect(result.current.hasFieldError('name')).toBe(true);
            expect(result.current.hasFieldError('email')).toBe(false);
        });
    });

    describe('useAutoSave', () => {
        const mockOnSave = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('initializes with correct default state', () => {
            const { result } = renderHook(() =>
                useAutoSave({
                    data: { name: 'John' },
                    onSave: mockOnSave,
                })
            );

            expect(result.current.isSaving).toBe(false);
            expect(result.current.lastSaved).toBe(null);
            expect(result.current.hasUnsavedChanges).toBe(false);
            expect(result.current.error).toBe(null);
        });

        it('detects unsaved changes when data changes', async () => {
            const { result, rerender } = renderHook(
                ({ data }) =>
                    useAutoSave({
                        data,
                        onSave: mockOnSave,
                        delay: 100,
                    }),
                {
                    initialProps: { data: { name: 'John' } },
                }
            );

            // Change data
            rerender({ data: { name: 'Jane' } });

            await waitFor(() => {
                expect(result.current.hasUnsavedChanges).toBe(true);
            });
        });

        it('auto-saves after delay when enabled', async () => {
            mockOnSave.mockResolvedValue(undefined);

            const { result, rerender } = renderHook(
                ({ data }) =>
                    useAutoSave({
                        data,
                        onSave: mockOnSave,
                        delay: 100,
                        enabled: true,
                    }),
                {
                    initialProps: { data: { name: 'John' } },
                }
            );

            // Change data
            rerender({ data: { name: 'Jane' } });

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(100);
            });

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledWith({ name: 'Jane' });
                expect(result.current.hasUnsavedChanges).toBe(false);
                expect(result.current.lastSaved).toBeInstanceOf(Date);
            });
        });

        it('does not auto-save when disabled', async () => {
            const { rerender } = renderHook(
                ({ data }) =>
                    useAutoSave({
                        data,
                        onSave: mockOnSave,
                        delay: 100,
                        enabled: false,
                    }),
                {
                    initialProps: { data: { name: 'John' } },
                }
            );

            // Change data
            rerender({ data: { name: 'Jane' } });

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(200);
            });

            expect(mockOnSave).not.toHaveBeenCalled();
        });

        it('handles save errors gracefully', async () => {
            const error = new Error('Save failed');
            mockOnSave.mockRejectedValue(error);

            const { result, rerender } = renderHook(
                ({ data }) =>
                    useAutoSave({
                        data,
                        onSave: mockOnSave,
                        delay: 100,
                    }),
                {
                    initialProps: { data: { name: 'John' } },
                }
            );

            // Change data
            rerender({ data: { name: 'Jane' } });

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(100);
            });

            await waitFor(() => {
                expect(result.current.error).toBe('Save failed');
                expect(result.current.isSaving).toBe(false);
            });
        });

        it('allows manual save', async () => {
            mockOnSave.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useAutoSave({
                    data: { name: 'John' },
                    onSave: mockOnSave,
                    enabled: false, // Disable auto-save
                })
            );

            await act(async () => {
                await result.current.saveNow();
            });

            expect(mockOnSave).toHaveBeenCalledWith({ name: 'John' });
            expect(result.current.lastSaved).toBeInstanceOf(Date);
        });

        it('uses custom isEqual function', async () => {
            const customIsEqual = jest.fn((a, b) => a.id === b.id);

            const { result, rerender } = renderHook(
                ({ data }) =>
                    useAutoSave({
                        data,
                        onSave: mockOnSave,
                        isEqual: customIsEqual,
                    }),
                {
                    initialProps: { data: { id: 1, name: 'John' } },
                }
            );

            // Change name but keep same id
            rerender({ data: { id: 1, name: 'Jane' } });

            await waitFor(() => {
                expect(customIsEqual).toHaveBeenCalled();
                expect(result.current.hasUnsavedChanges).toBe(false);
            });
        });

        it('prevents concurrent saves', async () => {
            mockOnSave.mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 200))
            );

            const { result } = renderHook(() =>
                useAutoSave({
                    data: { name: 'John' },
                    onSave: mockOnSave,
                })
            );

            // Start first save
            act(() => {
                result.current.saveNow();
            });

            expect(result.current.isSaving).toBe(true);

            // Try to start second save
            act(() => {
                result.current.saveNow();
            });

            // Should only call onSave once
            expect(mockOnSave).toHaveBeenCalledTimes(1);
        });
    });
});

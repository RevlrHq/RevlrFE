import { renderHook, act, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import useAdvancedFilters from '../../hooks/useAdvancedFilters';
import type { AdvancedFilterOptions } from '../../components/AdvancedFilters';

// Mock the debounce hook
jest.mock('../../hooks/useDebounce', () => ({
    useDebouncedValue: (value: unknown) => value,
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('useAdvancedFilters', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('Basic Functionality', () => {
        it('initializes with default filters', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            expect(result.current.filters.searchTerm).toBe('');
            expect(result.current.filters.status).toBe('');
            expect(result.current.filters.sortBy).toBe('dateCreated');
            expect(result.current.filters.sortOrder).toBe('desc');
            expect(result.current.activeFilterCount).toBe(0);
        });

        it('initializes with provided initial filters', () => {
            const initialFilters: Partial<AdvancedFilterOptions> = {
                searchTerm: 'test',
                status: '1',
                category: 'Conference',
            };

            const { result } = renderHook(() =>
                useAdvancedFilters({ initialFilters })
            );

            expect(result.current.filters.searchTerm).toBe('test');
            expect(result.current.filters.status).toBe('1');
            expect(result.current.filters.category).toBe('Conference');
            expect(result.current.activeFilterCount).toBe(3);
        });

        it('updates filters correctly', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            act(() => {
                result.current.updateFilters({
                    searchTerm: 'new search',
                    status: '1',
                });
            });

            expect(result.current.filters.searchTerm).toBe('new search');
            expect(result.current.filters.status).toBe('1');
            expect(result.current.activeFilterCount).toBe(2);
        });

        it('updates single filter correctly', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            act(() => {
                result.current.updateFilter('searchTerm', 'single update');
            });

            expect(result.current.filters.searchTerm).toBe('single update');
            expect(result.current.activeFilterCount).toBe(1);
        });

        it('clears all filters', () => {
            const initialFilters: Partial<AdvancedFilterOptions> = {
                searchTerm: 'test',
                status: '1',
                category: 'Conference',
            };

            const { result } = renderHook(() =>
                useAdvancedFilters({ initialFilters })
            );

            expect(result.current.activeFilterCount).toBe(3);

            act(() => {
                result.current.clearFilters();
            });

            expect(result.current.filters.searchTerm).toBe('');
            expect(result.current.filters.status).toBe('');
            expect(result.current.filters.category).toBe('');
            expect(result.current.activeFilterCount).toBe(0);
        });

        it('clears single filter correctly', () => {
            const initialFilters: Partial<AdvancedFilterOptions> = {
                searchTerm: 'test',
                status: '1',
                isVirtual: true,
                minRevenue: 1000,
            };

            const { result } = renderHook(() =>
                useAdvancedFilters({ initialFilters })
            );

            act(() => {
                result.current.clearFilter('searchTerm');
            });
            expect(result.current.filters.searchTerm).toBe('');

            act(() => {
                result.current.clearFilter('isVirtual');
            });
            expect(result.current.filters.isVirtual).toBe(null);

            act(() => {
                result.current.clearFilter('minRevenue');
            });
            expect(result.current.filters.minRevenue).toBe(null);

            act(() => {
                result.current.clearFilter('sortOrder');
            });
            expect(result.current.filters.sortOrder).toBe('desc');
        });
    });

    describe('Filter Presets', () => {
        it('saves preset correctly', () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: true })
            );

            // Set some filters first
            act(() => {
                result.current.updateFilters({
                    searchTerm: 'test',
                    status: '1',
                });
            });

            // Save preset
            act(() => {
                result.current.savePreset('My Test Preset');
            });

            expect(result.current.savedPresets).toHaveLength(1);
            expect(result.current.savedPresets[0].name).toBe('My Test Preset');
            expect(result.current.savedPresets[0].filters.searchTerm).toBe(
                'test'
            );
            expect(result.current.savedPresets[0].filters.status).toBe('1');
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'organizer-filters-presets',
                expect.stringContaining('My Test Preset')
            );
        });

        it('loads preset correctly', () => {
            const mockPresets = [
                {
                    id: '1',
                    name: 'Test Preset',
                    filters: { searchTerm: 'preset search', status: '1' },
                    createdAt: new Date(),
                    useCount: 0,
                },
            ];

            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockPresets)
            );

            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: true })
            );

            expect(result.current.savedPresets).toHaveLength(1);

            act(() => {
                result.current.loadPreset(result.current.savedPresets[0]);
            });

            expect(result.current.filters.searchTerm).toBe('preset search');
            expect(result.current.filters.status).toBe('1');
            expect(result.current.savedPresets[0].useCount).toBe(1);
        });

        it('deletes preset correctly', () => {
            const mockPresets = [
                {
                    id: '1',
                    name: 'Test Preset',
                    filters: { searchTerm: 'test' },
                    createdAt: new Date(),
                    useCount: 0,
                },
                {
                    id: '2',
                    name: 'Another Preset',
                    filters: { status: '1' },
                    createdAt: new Date(),
                    useCount: 0,
                },
            ];

            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockPresets)
            );

            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: true })
            );

            expect(result.current.savedPresets).toHaveLength(2);

            act(() => {
                result.current.deletePreset('1');
            });

            expect(result.current.savedPresets).toHaveLength(1);
            expect(result.current.savedPresets[0].id).toBe('2');
        });

        it('does not save preset when no filters are active', () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: true })
            );

            act(() => {
                result.current.savePreset('Empty Preset');
            });

            expect(result.current.savedPresets).toHaveLength(0);
            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('does not save preset with empty name', () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: true })
            );

            // Set some filters first
            act(() => {
                result.current.updateFilter('searchTerm', 'test');
            });

            act(() => {
                result.current.savePreset('   '); // Empty/whitespace name
            });

            expect(result.current.savedPresets).toHaveLength(0);
        });
    });

    describe('Filter History', () => {
        it('saves filters to history automatically', async () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({ enableHistory: true })
            );

            act(() => {
                result.current.updateFilters({
                    searchTerm: 'test',
                    status: '1',
                });
            });

            // Fast-forward timers to trigger auto-save
            act(() => {
                jest.advanceTimersByTime(2000);
            });

            await waitFor(() => {
                expect(result.current.filterHistory).toHaveLength(1);
            });
        });

        it('loads from history correctly', () => {
            const mockHistory = [
                { searchTerm: 'history search', status: '1' },
                { category: 'Conference', minRevenue: 1000 },
            ];

            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockHistory)
            );

            const { result } = renderHook(() =>
                useAdvancedFilters({ enableHistory: true })
            );

            expect(result.current.filterHistory).toHaveLength(2);

            act(() => {
                result.current.loadFromHistory(result.current.filterHistory[0]);
            });

            expect(result.current.filters.searchTerm).toBe('history search');
            expect(result.current.filters.status).toBe('1');
        });

        it('clears history correctly', () => {
            const mockHistory = [{ searchTerm: 'test' }, { status: '1' }];

            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockHistory)
            );

            const { result } = renderHook(() =>
                useAdvancedFilters({ enableHistory: true })
            );

            expect(result.current.filterHistory).toHaveLength(2);

            act(() => {
                result.current.clearHistory();
            });

            expect(result.current.filterHistory).toHaveLength(0);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'organizer-filters-history'
            );
        });

        it('limits history to maxHistoryItems', async () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({
                    enableHistory: true,
                    maxHistoryItems: 2,
                })
            );

            // Add multiple filter sets
            for (let i = 1; i <= 4; i++) {
                act(() => {
                    result.current.updateFilter('searchTerm', `search ${i}`);
                });

                act(() => {
                    jest.advanceTimersByTime(2000);
                });

                await waitFor(() => {
                    expect(
                        result.current.filterHistory.length
                    ).toBeLessThanOrEqual(2);
                });
            }

            expect(result.current.filterHistory).toHaveLength(2);
        });
    });

    describe('Search Suggestions', () => {
        it('generates suggestions correctly', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            const suggestions = result.current.generateSuggestions('con', {
                categories: ['Conference', 'Concert'],
                venues: ['Convention Center', 'Concert Hall'],
                recentSearches: ['conference 2024', 'construction'],
            });

            expect(suggestions).toHaveLength(6); // 2 recent + 2 categories + 2 venues
            expect(suggestions.some((s) => s.text === 'conference 2024')).toBe(
                true
            );
            expect(suggestions.some((s) => s.text === 'Conference')).toBe(true);
            expect(
                suggestions.some((s) => s.text === 'Convention Center')
            ).toBe(true);
        });

        it('returns empty array for short queries', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            const suggestions = result.current.generateSuggestions('c');
            expect(suggestions).toHaveLength(0);
        });

        it('sorts suggestions by score', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            const suggestions = result.current.generateSuggestions('test', {
                categories: ['Testing'],
                venues: ['Test Venue'],
                recentSearches: ['test search'],
            });

            // Recent searches should have highest score (0.9)
            expect(suggestions[0].type).toBe('recent');
            expect(suggestions[0].score).toBe(0.9);
        });
    });

    describe('Result Summary', () => {
        it('calculates result summary correctly', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            // Set some active filters
            act(() => {
                result.current.updateFilters({
                    searchTerm: 'test',
                    status: '1',
                });
            });

            const summary = result.current.calculateResultSummary({
                totalResults: 100,
                filteredResults: 25,
                categories: [
                    { name: 'Conference', count: 15 },
                    { name: 'Workshop', count: 10 },
                ],
                dateRange: { start: '2024-01-01', end: '2024-12-31' },
                revenueRange: { min: 1000, max: 5000 },
            });

            expect(summary.totalResults).toBe(100);
            expect(summary.filteredResults).toBe(25);
            expect(summary.appliedFilters).toBe(2);
            expect(summary.topCategories).toHaveLength(2);
            expect(summary.dateRange).toEqual({
                start: '2024-01-01',
                end: '2024-12-31',
            });
            expect(summary.revenueRange).toEqual({ min: 1000, max: 5000 });
        });
    });

    describe('Import/Export', () => {
        it('exports filters as JSON', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            act(() => {
                result.current.updateFilters({
                    searchTerm: 'test',
                    status: '1',
                });
            });

            const exported = result.current.exportFilters();
            const parsed = JSON.parse(exported);

            expect(parsed.searchTerm).toBe('test');
            expect(parsed.status).toBe('1');
        });

        it('imports filters from JSON', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            const filtersJson = JSON.stringify({
                searchTerm: 'imported search',
                status: '2',
                category: 'Imported Category',
            });

            act(() => {
                const success = result.current.importFilters(filtersJson);
                expect(success).toBe(true);
            });

            expect(result.current.filters.searchTerm).toBe('imported search');
            expect(result.current.filters.status).toBe('2');
            expect(result.current.filters.category).toBe('Imported Category');
        });

        it('handles invalid JSON during import', () => {
            const { result } = renderHook(() => useAdvancedFilters());

            act(() => {
                const success = result.current.importFilters('invalid json');
                expect(success).toBe(false);
            });

            // Filters should remain unchanged
            expect(result.current.filters.searchTerm).toBe('');
        });
    });

    describe('Configuration Options', () => {
        it('respects enablePresets option', () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: false })
            );

            act(() => {
                result.current.updateFilter('searchTerm', 'test');
                result.current.savePreset('Test Preset');
            });

            expect(result.current.savedPresets).toHaveLength(0);
        });

        it('respects enableHistory option', async () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({ enableHistory: false })
            );

            act(() => {
                result.current.updateFilter('searchTerm', 'test');
            });

            act(() => {
                jest.advanceTimersByTime(2000);
            });

            await waitFor(() => {
                expect(result.current.filterHistory).toHaveLength(0);
            });
        });

        it('uses custom storage prefix', () => {
            const { result } = renderHook(() =>
                useAdvancedFilters({
                    enablePresets: true,
                    storagePrefix: 'custom-prefix',
                })
            );

            act(() => {
                result.current.updateFilter('searchTerm', 'test');
                result.current.savePreset('Test Preset');
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'custom-prefix-presets',
                expect.any(String)
            );
        });
    });

    describe('Error Handling', () => {
        it('handles localStorage errors gracefully', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            expect(() => {
                renderHook(() => useAdvancedFilters({ enablePresets: true }));
            }).not.toThrow();
        });

        it('handles JSON parse errors gracefully', () => {
            localStorageMock.getItem.mockReturnValue('invalid json');

            const { result } = renderHook(() =>
                useAdvancedFilters({ enablePresets: true })
            );

            expect(result.current.savedPresets).toHaveLength(0);
        });
    });
});

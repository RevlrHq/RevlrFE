import { renderHook, act, waitFor } from '@testing-library/react';
import { useSimpleMediaSearch } from '@/hooks/useMediaSearchSimple';

describe('useSimpleMediaSearch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        expect(result.current.state.query).toBe('');
        expect(result.current.state.results).toEqual([]);
        expect(result.current.state.isLoading).toBe(false);
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.selectedItems).toEqual([]);
        expect(result.current.state.previewItem).toBeNull();
        expect(result.current.state.suggestions).toEqual([]);
        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should initialize with custom options', () => {
        const initialQuery = 'test query';
        const initialFilters = { orientation: 'landscape' as const };

        const { result } = renderHook(() =>
            useSimpleMediaSearch({
                initialQuery,
                initialFilters,
                maxSelectedItems: 5,
            })
        );

        expect(result.current.state.query).toBe(initialQuery);
        expect(result.current.state.filters).toEqual(initialFilters);
    });

    it('should provide all required actions', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        expect(typeof result.current.actions.search).toBe('function');
        expect(typeof result.current.actions.clearSearch).toBe('function');
        expect(typeof result.current.actions.selectItem).toBe('function');
        expect(typeof result.current.actions.deselectItem).toBe('function');
        expect(typeof result.current.actions.toggleItemSelection).toBe(
            'function'
        );
        expect(typeof result.current.actions.clearSelection).toBe('function');
        expect(typeof result.current.actions.previewItem).toBe('function');
        expect(typeof result.current.actions.closePreview).toBe('function');
        expect(typeof result.current.actions.applyFilters).toBe('function');
        expect(typeof result.current.actions.clearFilters).toBe('function');
        expect(typeof result.current.actions.getSuggestions).toBe('function');
        expect(typeof result.current.actions.applySuggestion).toBe('function');
        expect(typeof result.current.actions.hideSuggestions).toBe('function');
        expect(typeof result.current.actions.setQuery).toBe('function');
    });

    it('should perform search and return results', async () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        act(() => {
            result.current.actions.search('business');
        });

        expect(result.current.state.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.results).toHaveLength(2);
        expect(result.current.state.results[0].title).toContain('business');
        expect(result.current.state.error).toBeNull();
    });

    it('should clear search correctly', () => {
        const { result } = renderHook(() =>
            useSimpleMediaSearch({ initialQuery: 'test' })
        );

        act(() => {
            result.current.actions.clearSearch();
        });

        expect(result.current.state.query).toBe('');
        expect(result.current.state.results).toEqual([]);
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.suggestions).toEqual([]);
        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should handle item selection correctly', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
            photographer: {
                name: 'Test Photographer',
                profileUrl: 'https://example.com/photographer',
            },
        };

        act(() => {
            result.current.actions.selectItem(mockItem);
        });

        expect(result.current.state.selectedItems).toHaveLength(1);
        expect(result.current.state.selectedItems[0]).toEqual(mockItem);

        act(() => {
            result.current.actions.deselectItem(mockItem.id);
        });

        expect(result.current.state.selectedItems).toHaveLength(0);
    });

    it('should handle preview correctly', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
            photographer: {
                name: 'Test Photographer',
                profileUrl: 'https://example.com/photographer',
            },
        };

        act(() => {
            result.current.actions.previewItem(mockItem);
        });

        expect(result.current.state.previewItem).toEqual(mockItem);

        act(() => {
            result.current.actions.closePreview();
        });

        expect(result.current.state.previewItem).toBeNull();
    });

    it('should respect max selected items limit', () => {
        const { result } = renderHook(() =>
            useSimpleMediaSearch({ maxSelectedItems: 2 })
        );

        const mockItem1 = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image 1',
            thumbnailUrl: 'https://example.com/thumb1.jpg',
            previewUrl: 'https://example.com/preview1.jpg',
            downloadUrl: 'https://example.com/download1.jpg',
            width: 1920,
            height: 1080,
        };

        const mockItem2 = { ...mockItem1, id: 'test-2', title: 'Test Image 2' };
        const mockItem3 = { ...mockItem1, id: 'test-3', title: 'Test Image 3' };

        act(() => {
            result.current.actions.selectItem(mockItem1);
            result.current.actions.selectItem(mockItem2);
            result.current.actions.selectItem(mockItem3); // Should be ignored
        });

        expect(result.current.state.selectedItems).toHaveLength(2);
        expect(
            result.current.state.selectedItems.map((item) => item.id)
        ).toEqual(['test-1', 'test-2']);
    });

    it('should apply suggestion correctly', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        act(() => {
            result.current.actions.applySuggestion('business meeting');
        });

        expect(result.current.state.query).toBe('business meeting');
        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should clear selection correctly', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
        };

        act(() => {
            result.current.actions.selectItem(mockItem);
        });

        expect(result.current.state.selectedItems).toHaveLength(1);

        act(() => {
            result.current.actions.clearSelection();
        });

        expect(result.current.state.selectedItems).toHaveLength(0);
    });

    it('should toggle item selection correctly', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
        };

        // Toggle to select
        act(() => {
            result.current.actions.toggleItemSelection(mockItem);
        });

        expect(result.current.state.selectedItems).toHaveLength(1);

        // Toggle to deselect
        act(() => {
            result.current.actions.toggleItemSelection(mockItem);
        });

        expect(result.current.state.selectedItems).toHaveLength(0);
    });

    it('should get suggestions based on query', async () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        act(() => {
            result.current.actions.getSuggestions('business');
        });

        await waitFor(() => {
            expect(result.current.state.suggestions.length).toBeGreaterThan(0);
        });

        expect(result.current.state.suggestions).toContain('business meeting');
        expect(result.current.state.showSuggestions).toBe(true);
    });

    it('should hide suggestions', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        // First set some suggestions
        act(() => {
            result.current.actions.getSuggestions('business');
        });

        // Then hide them
        act(() => {
            result.current.actions.hideSuggestions();
        });

        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should update query with setQuery', () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        act(() => {
            result.current.actions.setQuery('new query');
        });

        expect(result.current.state.query).toBe('new query');
    });

    it('should apply and clear filters', async () => {
        const { result } = renderHook(() => useSimpleMediaSearch());

        const filters = { orientation: 'landscape' as const, color: 'blue' };

        act(() => {
            result.current.actions.applyFilters(filters);
        });

        expect(result.current.state.filters).toEqual(filters);

        act(() => {
            result.current.actions.clearFilters();
        });

        expect(result.current.state.filters).toEqual({});
    });
});

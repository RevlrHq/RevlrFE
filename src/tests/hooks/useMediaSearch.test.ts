import { renderHook, act } from '@testing-library/react';
import { EventCategory } from '@/lib/constants/eventCategories';

// Mock the providers to avoid actual API calls in tests
jest.mock('@/lib/services/media/providers/UnsplashProvider', () => ({
    UnsplashProvider: jest.fn().mockImplementation(() => ({
        id: 'unsplash',
        name: 'Unsplash',
        getStatus: () => ({
            id: 'unsplash',
            name: 'Unsplash',
            isAvailable: true,
            rateLimit: { requests: 50, window: 3600 },
            healthScore: 100,
        }),
        isHealthy: () => true,
        search: jest.fn(),
        getPopular: jest.fn(),
        downloadMedia: jest.fn(),
    })),
}));

jest.mock('@/lib/services/media/providers/PexelsProvider', () => ({
    PexelsProvider: jest.fn().mockImplementation(() => ({
        id: 'pexels',
        name: 'Pexels',
        getStatus: () => ({
            id: 'pexels',
            name: 'Pexels',
            isAvailable: true,
            rateLimit: { requests: 200, window: 3600 },
            healthScore: 100,
        }),
        isHealthy: () => true,
        search: jest.fn(),
        getPopular: jest.fn(),
        downloadMedia: jest.fn(),
    })),
}));

// Import after mocking
import { useMediaSearch } from '@/hooks/useMediaSearch';

describe('useMediaSearch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useMediaSearch());

        expect(result.current.state.query).toBe('');
        expect(result.current.state.results).toBeNull();
        expect(result.current.state.isLoading).toBe(false);
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.selectedItems).toEqual([]);
        expect(result.current.state.previewItem).toBeNull();
        expect(result.current.state.currentPage).toBe(1);
        expect(result.current.state.hasMore).toBe(false);
        expect(result.current.state.suggestions).toEqual([]);
        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should initialize with custom options', () => {
        const initialQuery = 'test query';
        const initialFilters = { orientation: 'landscape' as const };
        const eventCategory = EventCategory.BusinessProfessional;

        const { result } = renderHook(() =>
            useMediaSearch({
                initialQuery,
                initialFilters,
                eventCategory,
                maxSelectedItems: 5,
            })
        );

        expect(result.current.state.query).toBe(initialQuery);
        expect(result.current.state.filters).toEqual(initialFilters);
    });

    it('should provide all required actions', () => {
        const { result } = renderHook(() => useMediaSearch());

        expect(typeof result.current.actions.search).toBe('function');
        expect(typeof result.current.actions.loadMore).toBe('function');
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
        expect(typeof result.current.actions.toggleProvider).toBe('function');
        expect(typeof result.current.actions.getSuggestions).toBe('function');
        expect(typeof result.current.actions.applySuggestion).toBe('function');
        expect(typeof result.current.actions.hideSuggestions).toBe('function');
        expect(typeof result.current.actions.loadPopularContent).toBe(
            'function'
        );
    });

    it('should clear search correctly', () => {
        const { result } = renderHook(() =>
            useMediaSearch({ initialQuery: 'test' })
        );

        act(() => {
            result.current.actions.clearSearch();
        });

        expect(result.current.state.query).toBe('');
        expect(result.current.state.results).toBeNull();
        expect(result.current.state.error).toBeNull();
        expect(result.current.state.currentPage).toBe(1);
        expect(result.current.state.hasMore).toBe(false);
        expect(result.current.state.suggestions).toEqual([]);
        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should handle item selection correctly', () => {
        const { result } = renderHook(() => useMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
            mediaType: 'image' as const,
            attribution: {
                required: true,
                text: 'Test attribution',
                placement: 'image-caption' as const,
            },
            license: {
                type: 'unsplash' as const,
                name: 'Unsplash License',
                url: 'https://unsplash.com/license',
                commercialUse: true,
                attribution: {
                    required: true,
                    text: 'Test attribution',
                    placement: 'image-caption' as const,
                },
            },
            tags: ['test'],
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
        const { result } = renderHook(() => useMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
            mediaType: 'image' as const,
            attribution: {
                required: true,
                text: 'Test attribution',
                placement: 'image-caption' as const,
            },
            license: {
                type: 'unsplash' as const,
                name: 'Unsplash License',
                url: 'https://unsplash.com/license',
                commercialUse: true,
                attribution: {
                    required: true,
                    text: 'Test attribution',
                    placement: 'image-caption' as const,
                },
            },
            tags: ['test'],
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
            useMediaSearch({ maxSelectedItems: 2 })
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
            mediaType: 'image' as const,
            attribution: {
                required: true,
                text: 'Test attribution',
                placement: 'image-caption' as const,
            },
            license: {
                type: 'unsplash' as const,
                name: 'Unsplash License',
                url: 'https://unsplash.com/license',
                commercialUse: true,
                attribution: {
                    required: true,
                    text: 'Test attribution',
                    placement: 'image-caption' as const,
                },
            },
            tags: ['test'],
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
        const { result } = renderHook(() => useMediaSearch());

        act(() => {
            result.current.actions.applySuggestion('business meeting');
        });

        expect(result.current.state.query).toBe('business meeting');
        expect(result.current.state.showSuggestions).toBe(false);
    });

    it('should clear selection correctly', () => {
        const { result } = renderHook(() => useMediaSearch());

        const mockItem = {
            id: 'test-1',
            providerId: 'unsplash',
            title: 'Test Image',
            thumbnailUrl: 'https://example.com/thumb.jpg',
            previewUrl: 'https://example.com/preview.jpg',
            downloadUrl: 'https://example.com/download.jpg',
            width: 1920,
            height: 1080,
            mediaType: 'image' as const,
            attribution: {
                required: true,
                text: 'Test attribution',
                placement: 'image-caption' as const,
            },
            license: {
                type: 'unsplash' as const,
                name: 'Unsplash License',
                url: 'https://unsplash.com/license',
                commercialUse: true,
                attribution: {
                    required: true,
                    text: 'Test attribution',
                    placement: 'image-caption' as const,
                },
            },
            tags: ['test'],
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
});

describe('useCategorySearchTerms', () => {
    it('should return empty array for undefined category', () => {
        const { result } = renderHook(
            () => useMediaSearch().actions // Just to import the helper
        );

        // Test the helper function directly
        const { useCategorySearchTerms } = require('@/hooks/useMediaSearch');
        const { result: termsResult } = renderHook(() =>
            useCategorySearchTerms()
        );

        expect(termsResult.current).toEqual([]);
    });

    it('should return search terms for business category', () => {
        const { useCategorySearchTerms } = require('@/hooks/useMediaSearch');
        const { result } = renderHook(() =>
            useCategorySearchTerms(EventCategory.BusinessProfessional)
        );

        expect(result.current).toContain('business meeting');
        expect(result.current).toContain('conference');
        expect(result.current).toContain('presentation');
    });
});

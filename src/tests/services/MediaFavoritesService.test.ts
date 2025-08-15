import { mediaFavoritesService } from '@/lib/services/media/MediaFavoritesService';
import { MediaItem } from '@/types/media-search';

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

const mockMediaItem: MediaItem = {
    id: 'test-item-1',
    providerId: 'unsplash',
    title: 'Test Image',
    description: 'A test image',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewUrl: 'https://example.com/preview.jpg',
    downloadUrl: 'https://example.com/download.jpg',
    width: 1920,
    height: 1080,
    fileSize: 2500000,
    mediaType: 'image',
    attribution: {
        required: false,
        placement: 'none',
    },
    license: {
        type: 'unsplash',
        name: 'Unsplash License',
        url: 'https://unsplash.com/license',
        commercialUse: true,
        attribution: {
            required: false,
            placement: 'none',
        },
    },
    tags: ['test', 'image'],
    photographer: {
        name: 'Test Photographer',
    },
};

describe('MediaFavoritesService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    describe('addToFavorites', () => {
        it('adds a new item to favorites', async () => {
            localStorageMock.getItem.mockReturnValue('[]');

            await mediaFavoritesService.addToFavorites(
                mockMediaItem,
                ['business'],
                'Great image'
            );

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorites',
                expect.stringContaining(mockMediaItem.id)
            );
        });

        it('updates existing favorite', async () => {
            const existingFavorite = {
                ...mockMediaItem,
                favoritedAt: '2023-01-01T00:00:00.000Z',
                tags: ['old-tag'],
            };
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify([existingFavorite])
            );

            await mediaFavoritesService.addToFavorites(
                mockMediaItem,
                ['new-tag'],
                'Updated notes'
            );

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorites',
                expect.stringContaining('new-tag')
            );
        });

        it('updates tags list when adding new tags', async () => {
            localStorageMock.getItem
                .mockReturnValueOnce('[]') // favorites
                .mockReturnValueOnce('["existing-tag"]'); // tags

            await mediaFavoritesService.addToFavorites(mockMediaItem, [
                'new-tag',
            ]);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorite_tags',
                expect.stringContaining('new-tag')
            );
        });
    });

    describe('removeFromFavorites', () => {
        it('removes item from favorites', async () => {
            const existingFavorite = {
                ...mockMediaItem,
                favoritedAt: '2023-01-01T00:00:00.000Z',
            };
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify([existingFavorite])
            );

            await mediaFavoritesService.removeFromFavorites(
                mockMediaItem.id,
                mockMediaItem.providerId
            );

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorites',
                '[]'
            );
        });

        it('does nothing if item not found', async () => {
            localStorageMock.getItem.mockReturnValue('[]');

            await mediaFavoritesService.removeFromFavorites(
                'non-existent',
                'provider'
            );

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorites',
                '[]'
            );
        });
    });

    describe('getFavorites', () => {
        it('returns empty array when no favorites', async () => {
            localStorageMock.getItem.mockReturnValue(null);

            const favorites = await mediaFavoritesService.getFavorites();

            expect(favorites).toEqual([]);
        });

        it('returns stored favorites', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                    tags: ['business'],
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const favorites = await mediaFavoritesService.getFavorites();

            expect(favorites).toEqual(storedFavorites);
        });

        it('handles corrupted storage gracefully', async () => {
            localStorageMock.getItem.mockReturnValue('invalid-json');

            const favorites = await mediaFavoritesService.getFavorites();

            expect(favorites).toEqual([]);
        });
    });

    describe('isFavorite', () => {
        it('returns true for favorited item', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const isFav = await mediaFavoritesService.isFavorite(
                mockMediaItem.id,
                mockMediaItem.providerId
            );

            expect(isFav).toBe(true);
        });

        it('returns false for non-favorited item', async () => {
            localStorageMock.getItem.mockReturnValue('[]');

            const isFav = await mediaFavoritesService.isFavorite(
                mockMediaItem.id,
                mockMediaItem.providerId
            );

            expect(isFav).toBe(false);
        });
    });

    describe('getFavoritesByTag', () => {
        it('returns favorites with specific tag', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    id: 'item1',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                    tags: ['business', 'professional'],
                },
                {
                    ...mockMediaItem,
                    id: 'item2',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                    tags: ['personal'],
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const businessFavorites =
                await mediaFavoritesService.getFavoritesByTag('business');

            expect(businessFavorites).toHaveLength(1);
            expect(businessFavorites[0].id).toBe('item1');
        });
    });

    describe('searchFavorites', () => {
        it('searches favorites by title', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    id: 'item1',
                    title: 'Business Meeting',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
                {
                    ...mockMediaItem,
                    id: 'item2',
                    title: 'Nature Landscape',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const results =
                await mediaFavoritesService.searchFavorites('business');

            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Business Meeting');
        });

        it('searches favorites by tags', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    id: 'item1',
                    title: 'Random Title',
                    tags: ['business', 'meeting'],
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const results =
                await mediaFavoritesService.searchFavorites('meeting');

            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('item1');
        });

        it('searches favorites by photographer name', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    id: 'item1',
                    photographer: { name: 'John Doe' },
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const results = await mediaFavoritesService.searchFavorites('john');

            expect(results).toHaveLength(1);
            expect(results[0].photographer?.name).toBe('John Doe');
        });
    });

    describe('addMultipleToFavorites', () => {
        it('adds multiple items to favorites', async () => {
            localStorageMock.getItem.mockReturnValue('[]');

            const items = [
                { ...mockMediaItem, id: 'item1' },
                { ...mockMediaItem, id: 'item2' },
            ];

            await mediaFavoritesService.addMultipleToFavorites(items, [
                'bulk-tag',
            ]);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorites',
                expect.stringContaining('item1')
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'media_favorites',
                expect.stringContaining('item2')
            );
        });
    });

    describe('removeMultipleFromFavorites', () => {
        it('removes multiple items from favorites', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    id: 'item1',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
                {
                    ...mockMediaItem,
                    id: 'item2',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
                {
                    ...mockMediaItem,
                    id: 'item3',
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            const itemsToRemove = [
                { id: 'item1', providerId: mockMediaItem.providerId },
                { id: 'item2', providerId: mockMediaItem.providerId },
            ];

            await mediaFavoritesService.removeMultipleFromFavorites(
                itemsToRemove
            );

            const savedData = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedData).toHaveLength(1);
            expect(savedData[0].id).toBe('item3');
        });
    });

    describe('updateFavoriteTags', () => {
        it('updates tags for existing favorite', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                    tags: ['old-tag'],
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            await mediaFavoritesService.updateFavoriteTags(
                mockMediaItem.id,
                mockMediaItem.providerId,
                ['new-tag', 'another-tag']
            );

            const savedData = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedData[0].tags).toEqual(['new-tag', 'another-tag']);
        });
    });

    describe('updateFavoriteNotes', () => {
        it('updates notes for existing favorite', async () => {
            const storedFavorites = [
                {
                    ...mockMediaItem,
                    favoritedAt: '2023-01-01T00:00:00.000Z',
                    notes: 'old notes',
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(storedFavorites)
            );

            await mediaFavoritesService.updateFavoriteNotes(
                mockMediaItem.id,
                mockMediaItem.providerId,
                'new notes'
            );

            const savedData = JSON.parse(
                localStorageMock.setItem.mock.calls[0][1]
            );
            expect(savedData[0].notes).toBe('new notes');
        });
    });
});

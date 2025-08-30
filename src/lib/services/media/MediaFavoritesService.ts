import { MediaItem } from '@/types/media-search';

export interface FavoriteMediaItem extends MediaItem {
    favoritedAt: string;
    tags?: string[];
    notes?: string;
}

export interface MediaFavoritesService {
    // Favorites management
    addToFavorites(
        item: MediaItem,
        tags?: string[],
        notes?: string
    ): Promise<void>;
    removeFromFavorites(itemId: string, providerId: string): Promise<void>;
    getFavorites(userId?: string): Promise<FavoriteMediaItem[]>;
    isFavorite(itemId: string, providerId: string): Promise<boolean>;

    // Favorites organization
    getFavoritesByTag(tag: string): Promise<FavoriteMediaItem[]>;
    getAllTags(): Promise<string[]>;
    updateFavoriteTags(
        itemId: string,
        providerId: string,
        tags: string[]
    ): Promise<void>;
    updateFavoriteNotes(
        itemId: string,
        providerId: string,
        notes: string
    ): Promise<void>;

    // Bulk operations
    addMultipleToFavorites(items: MediaItem[], tags?: string[]): Promise<void>;
    removeMultipleFromFavorites(
        itemIds: Array<{ id: string; providerId: string }>
    ): Promise<void>;

    // Search and filtering
    searchFavorites(query: string): Promise<FavoriteMediaItem[]>;
    getFavoritesByCategory(category: string): Promise<FavoriteMediaItem[]>;
}

class LocalStorageMediaFavoritesService implements MediaFavoritesService {
    private readonly storageKey = 'media_favorites';
    private readonly tagsKey = 'media_favorite_tags';

    private getFavoritesFromStorage(): FavoriteMediaItem[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.debug('Failed to load favorites from storage:', error);
            return [];
        }
    }

    private saveFavoritesToStorage(favorites: FavoriteMediaItem[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        } catch (error) {
            console.debug('Failed to save favorites to storage:', error);
        }
    }

    private getTagsFromStorage(): string[] {
        try {
            const stored = localStorage.getItem(this.tagsKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.debug('Failed to load tags from storage:', error);
            return [];
        }
    }

    private saveTagsToStorage(tags: string[]): void {
        try {
            localStorage.setItem(this.tagsKey, JSON.stringify(tags));
        } catch (error) {
            console.debug('Failed to save tags to storage:', error);
        }
    }

    async addToFavorites(
        item: MediaItem,
        tags: string[] = [],
        notes?: string
    ): Promise<void> {
        const favorites = this.getFavoritesFromStorage();

        // Check if already favorited
        const existingIndex = favorites.findIndex(
            (fav) => fav.id === item.id && fav.providerId === item.providerId
        );

        const favoriteItem: FavoriteMediaItem = {
            ...item,
            favoritedAt: new Date().toISOString(),
            tags,
            notes,
        };

        if (existingIndex >= 0) {
            // Update existing favorite
            favorites[existingIndex] = favoriteItem;
        } else {
            // Add new favorite
            favorites.push(favoriteItem);
        }

        this.saveFavoritesToStorage(favorites);

        // Update tags list
        if (tags.length > 0) {
            const allTags = this.getTagsFromStorage();
            const newTags = tags.filter((tag) => !allTags.includes(tag));
            if (newTags.length > 0) {
                this.saveTagsToStorage([...allTags, ...newTags]);
            }
        }
    }

    async removeFromFavorites(
        itemId: string,
        providerId: string
    ): Promise<void> {
        const favorites = this.getFavoritesFromStorage();
        const filtered = favorites.filter(
            (fav) => !(fav.id === itemId && fav.providerId === providerId)
        );
        this.saveFavoritesToStorage(filtered);
    }

    async getFavorites(userId?: string): Promise<FavoriteMediaItem[]> {
        // For local storage implementation, userId is ignored
        // In a real implementation, this would filter by user
        return this.getFavoritesFromStorage();
    }

    async isFavorite(itemId: string, providerId: string): Promise<boolean> {
        const favorites = this.getFavoritesFromStorage();
        return favorites.some(
            (fav) => fav.id === itemId && fav.providerId === providerId
        );
    }

    async getFavoritesByTag(tag: string): Promise<FavoriteMediaItem[]> {
        const favorites = this.getFavoritesFromStorage();
        return favorites.filter((fav) => fav.tags?.includes(tag));
    }

    async getAllTags(): Promise<string[]> {
        return this.getTagsFromStorage();
    }

    async updateFavoriteTags(
        itemId: string,
        providerId: string,
        tags: string[]
    ): Promise<void> {
        const favorites = this.getFavoritesFromStorage();
        const favoriteIndex = favorites.findIndex(
            (fav) => fav.id === itemId && fav.providerId === providerId
        );

        if (favoriteIndex >= 0) {
            favorites[favoriteIndex].tags = tags;
            this.saveFavoritesToStorage(favorites);

            // Update global tags list
            const allTags = this.getTagsFromStorage();
            const newTags = tags.filter((tag) => !allTags.includes(tag));
            if (newTags.length > 0) {
                this.saveTagsToStorage([...allTags, ...newTags]);
            }
        }
    }

    async updateFavoriteNotes(
        itemId: string,
        providerId: string,
        notes: string
    ): Promise<void> {
        const favorites = this.getFavoritesFromStorage();
        const favoriteIndex = favorites.findIndex(
            (fav) => fav.id === itemId && fav.providerId === providerId
        );

        if (favoriteIndex >= 0) {
            favorites[favoriteIndex].notes = notes;
            this.saveFavoritesToStorage(favorites);
        }
    }

    async addMultipleToFavorites(
        items: MediaItem[],
        tags: string[] = []
    ): Promise<void> {
        const favorites = this.getFavoritesFromStorage();
        const timestamp = new Date().toISOString();

        for (const item of items) {
            const existingIndex = favorites.findIndex(
                (fav) =>
                    fav.id === item.id && fav.providerId === item.providerId
            );

            const favoriteItem: FavoriteMediaItem = {
                ...item,
                favoritedAt: timestamp,
                tags,
            };

            if (existingIndex >= 0) {
                favorites[existingIndex] = favoriteItem;
            } else {
                favorites.push(favoriteItem);
            }
        }

        this.saveFavoritesToStorage(favorites);

        // Update tags list
        if (tags.length > 0) {
            const allTags = this.getTagsFromStorage();
            const newTags = tags.filter((tag) => !allTags.includes(tag));
            if (newTags.length > 0) {
                this.saveTagsToStorage([...allTags, ...newTags]);
            }
        }
    }

    async removeMultipleFromFavorites(
        itemIds: Array<{ id: string; providerId: string }>
    ): Promise<void> {
        const favorites = this.getFavoritesFromStorage();
        const filtered = favorites.filter(
            (fav) =>
                !itemIds.some(
                    (item) =>
                        item.id === fav.id && item.providerId === fav.providerId
                )
        );
        this.saveFavoritesToStorage(filtered);
    }

    async searchFavorites(query: string): Promise<FavoriteMediaItem[]> {
        const favorites = this.getFavoritesFromStorage();
        const lowercaseQuery = query.toLowerCase();

        return favorites.filter(
            (fav) =>
                fav.title.toLowerCase().includes(lowercaseQuery) ||
                fav.description?.toLowerCase().includes(lowercaseQuery) ||
                fav.tags?.some((tag) =>
                    tag.toLowerCase().includes(lowercaseQuery)
                ) ||
                fav.notes?.toLowerCase().includes(lowercaseQuery) ||
                fav.photographer?.name.toLowerCase().includes(lowercaseQuery)
        );
    }

    async getFavoritesByCategory(
        category: string
    ): Promise<FavoriteMediaItem[]> {
        const favorites = this.getFavoritesFromStorage();
        return favorites.filter((fav) =>
            fav.tags?.some(
                (tag) => tag.toLowerCase() === category.toLowerCase()
            )
        );
    }
}

// Factory function to create the appropriate service
export function createMediaFavoritesService(): MediaFavoritesService {
    // In a real application, this could return different implementations
    // based on environment or user preferences (localStorage, IndexedDB, API, etc.)
    return new LocalStorageMediaFavoritesService();
}

export const mediaFavoritesService = createMediaFavoritesService();

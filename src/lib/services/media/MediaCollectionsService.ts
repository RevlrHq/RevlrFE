import { MediaItem } from '@/types/media-search';

export interface MediaCollection {
    id: string;
    name: string;
    description?: string;
    items: MediaItem[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    shareToken?: string;
    eventCategory?: string;
    theme?: string;
    coverImage?: MediaItem;
}

export interface CollectionShareData {
    collection: MediaCollection;
    shareUrl: string;
    expiresAt?: string;
}

export interface MediaCollectionsService {
    // Collection management
    createCollection(
        name: string,
        description?: string,
        tags?: string[]
    ): Promise<MediaCollection>;
    updateCollection(
        id: string,
        updates: Partial<MediaCollection>
    ): Promise<MediaCollection>;
    deleteCollection(id: string): Promise<void>;
    getCollection(id: string): Promise<MediaCollection | null>;
    getAllCollections(userId?: string): Promise<MediaCollection[]>;

    // Item management
    addItemToCollection(collectionId: string, item: MediaItem): Promise<void>;
    removeItemFromCollection(
        collectionId: string,
        itemId: string,
        providerId: string
    ): Promise<void>;
    addMultipleItemsToCollection(
        collectionId: string,
        items: MediaItem[]
    ): Promise<void>;
    removeMultipleItemsFromCollection(
        collectionId: string,
        itemIds: Array<{ id: string; providerId: string }>
    ): Promise<void>;
    reorderCollectionItems(
        collectionId: string,
        itemIds: string[]
    ): Promise<void>;

    // Collection organization
    getCollectionsByTag(tag: string): Promise<MediaCollection[]>;
    getCollectionsByTheme(theme: string): Promise<MediaCollection[]>;
    getCollectionsByEventCategory(category: string): Promise<MediaCollection[]>;
    searchCollections(query: string): Promise<MediaCollection[]>;

    // Sharing and collaboration
    shareCollection(
        collectionId: string,
        options?: { expiresIn?: number; isPublic?: boolean }
    ): Promise<CollectionShareData>;
    getSharedCollection(shareToken: string): Promise<MediaCollection | null>;
    revokeCollectionShare(collectionId: string): Promise<void>;

    // Export functionality
    exportCollection(
        collectionId: string,
        format: 'json' | 'csv' | 'zip'
    ): Promise<Blob>;
    importCollection(data: string | File): Promise<MediaCollection>;

    // Bulk operations
    duplicateCollection(
        collectionId: string,
        newName?: string
    ): Promise<MediaCollection>;
    mergeCollections(
        sourceIds: string[],
        targetName: string
    ): Promise<MediaCollection>;
}

class LocalStorageMediaCollectionsService implements MediaCollectionsService {
    private readonly storageKey = 'media_collections';
    private readonly shareTokensKey = 'collection_share_tokens';

    private getCollectionsFromStorage(): MediaCollection[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load collections from storage:', error);
            return [];
        }
    }

    private saveCollectionsToStorage(collections: MediaCollection[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(collections));
        } catch (error) {
            console.error('Failed to save collections to storage:', error);
        }
    }

    private generateId(): string {
        return `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateShareToken(): string {
        return `share_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }

    async createCollection(
        name: string,
        description?: string,
        tags: string[] = []
    ): Promise<MediaCollection> {
        const collections = this.getCollectionsFromStorage();
        const now = new Date().toISOString();

        const newCollection: MediaCollection = {
            id: this.generateId(),
            name,
            description,
            items: [],
            tags,
            createdAt: now,
            updatedAt: now,
            isPublic: false,
        };

        collections.push(newCollection);
        this.saveCollectionsToStorage(collections);

        return newCollection;
    }

    async updateCollection(
        id: string,
        updates: Partial<MediaCollection>
    ): Promise<MediaCollection> {
        const collections = this.getCollectionsFromStorage();
        const collectionIndex = collections.findIndex((c) => c.id === id);

        if (collectionIndex === -1) {
            throw new Error('Collection not found');
        }

        const updatedCollection = {
            ...collections[collectionIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        collections[collectionIndex] = updatedCollection;
        this.saveCollectionsToStorage(collections);

        return updatedCollection;
    }

    async deleteCollection(id: string): Promise<void> {
        const collections = this.getCollectionsFromStorage();
        const filtered = collections.filter((c) => c.id !== id);
        this.saveCollectionsToStorage(filtered);
    }

    async getCollection(id: string): Promise<MediaCollection | null> {
        const collections = this.getCollectionsFromStorage();
        return collections.find((c) => c.id === id) || null;
    }

    async getAllCollections(userId?: string): Promise<MediaCollection[]> {
        // For local storage implementation, userId is ignored
        // In a real implementation, this would filter by user
        return this.getCollectionsFromStorage();
    }

    async addItemToCollection(
        collectionId: string,
        item: MediaItem
    ): Promise<void> {
        const collections = this.getCollectionsFromStorage();
        const collectionIndex = collections.findIndex(
            (c) => c.id === collectionId
        );

        if (collectionIndex === -1) {
            throw new Error('Collection not found');
        }

        const collection = collections[collectionIndex];

        // Check if item already exists
        const itemExists = collection.items.some(
            (existing) =>
                existing.id === item.id &&
                existing.providerId === item.providerId
        );

        if (!itemExists) {
            collection.items.push(item);
            collection.updatedAt = new Date().toISOString();

            // Set cover image if this is the first item
            if (collection.items.length === 1) {
                collection.coverImage = item;
            }

            this.saveCollectionsToStorage(collections);
        }
    }

    async removeItemFromCollection(
        collectionId: string,
        itemId: string,
        providerId: string
    ): Promise<void> {
        const collections = this.getCollectionsFromStorage();
        const collectionIndex = collections.findIndex(
            (c) => c.id === collectionId
        );

        if (collectionIndex === -1) {
            throw new Error('Collection not found');
        }

        const collection = collections[collectionIndex];
        collection.items = collection.items.filter(
            (item) => !(item.id === itemId && item.providerId === providerId)
        );
        collection.updatedAt = new Date().toISOString();

        // Update cover image if removed item was the cover
        if (
            collection.coverImage?.id === itemId &&
            collection.coverImage?.providerId === providerId
        ) {
            collection.coverImage =
                collection.items.length > 0 ? collection.items[0] : undefined;
        }

        this.saveCollectionsToStorage(collections);
    }

    async addMultipleItemsToCollection(
        collectionId: string,
        items: MediaItem[]
    ): Promise<void> {
        const collections = this.getCollectionsFromStorage();
        const collectionIndex = collections.findIndex(
            (c) => c.id === collectionId
        );

        if (collectionIndex === -1) {
            throw new Error('Collection not found');
        }

        const collection = collections[collectionIndex];
        const wasEmpty = collection.items.length === 0;

        for (const item of items) {
            const itemExists = collection.items.some(
                (existing) =>
                    existing.id === item.id &&
                    existing.providerId === item.providerId
            );

            if (!itemExists) {
                collection.items.push(item);
            }
        }

        collection.updatedAt = new Date().toISOString();

        // Set cover image if collection was empty
        if (wasEmpty && collection.items.length > 0) {
            collection.coverImage = collection.items[0];
        }

        this.saveCollectionsToStorage(collections);
    }

    async removeMultipleItemsFromCollection(
        collectionId: string,
        itemIds: Array<{ id: string; providerId: string }>
    ): Promise<void> {
        const collections = this.getCollectionsFromStorage();
        const collectionIndex = collections.findIndex(
            (c) => c.id === collectionId
        );

        if (collectionIndex === -1) {
            throw new Error('Collection not found');
        }

        const collection = collections[collectionIndex];
        collection.items = collection.items.filter(
            (item) =>
                !itemIds.some(
                    (toRemove) =>
                        toRemove.id === item.id &&
                        toRemove.providerId === item.providerId
                )
        );
        collection.updatedAt = new Date().toISOString();

        // Update cover image if needed
        const coverWasRemoved = itemIds.some(
            (toRemove) =>
                toRemove.id === collection.coverImage?.id &&
                toRemove.providerId === collection.coverImage?.providerId
        );

        if (coverWasRemoved) {
            collection.coverImage =
                collection.items.length > 0 ? collection.items[0] : undefined;
        }

        this.saveCollectionsToStorage(collections);
    }

    async reorderCollectionItems(
        collectionId: string,
        itemIds: string[]
    ): Promise<void> {
        const collections = this.getCollectionsFromStorage();
        const collectionIndex = collections.findIndex(
            (c) => c.id === collectionId
        );

        if (collectionIndex === -1) {
            throw new Error('Collection not found');
        }

        const collection = collections[collectionIndex];
        const reorderedItems: MediaItem[] = [];

        // Reorder items based on provided order
        for (const itemId of itemIds) {
            const item = collection.items.find(
                (item) => `${item.providerId}-${item.id}` === itemId
            );
            if (item) {
                reorderedItems.push(item);
            }
        }

        // Add any items that weren't in the reorder list
        for (const item of collection.items) {
            const itemKey = `${item.providerId}-${item.id}`;
            if (!itemIds.includes(itemKey)) {
                reorderedItems.push(item);
            }
        }

        collection.items = reorderedItems;
        collection.updatedAt = new Date().toISOString();

        this.saveCollectionsToStorage(collections);
    }

    async getCollectionsByTag(tag: string): Promise<MediaCollection[]> {
        const collections = this.getCollectionsFromStorage();
        return collections.filter((c) => c.tags.includes(tag));
    }

    async getCollectionsByTheme(theme: string): Promise<MediaCollection[]> {
        const collections = this.getCollectionsFromStorage();
        return collections.filter((c) => c.theme === theme);
    }

    async getCollectionsByEventCategory(
        category: string
    ): Promise<MediaCollection[]> {
        const collections = this.getCollectionsFromStorage();
        return collections.filter((c) => c.eventCategory === category);
    }

    async searchCollections(query: string): Promise<MediaCollection[]> {
        const collections = this.getCollectionsFromStorage();
        const lowercaseQuery = query.toLowerCase();

        return collections.filter(
            (c) =>
                c.name.toLowerCase().includes(lowercaseQuery) ||
                c.description?.toLowerCase().includes(lowercaseQuery) ||
                c.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
        );
    }

    async shareCollection(
        collectionId: string,
        options: { expiresIn?: number; isPublic?: boolean } = {}
    ): Promise<CollectionShareData> {
        const collection = await this.getCollection(collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        const shareToken = this.generateShareToken();
        const shareUrl = `${window.location.origin}/shared-collection/${shareToken}`;
        const expiresAt = options.expiresIn
            ? new Date(Date.now() + options.expiresIn * 1000).toISOString()
            : undefined;

        // Update collection with share info
        await this.updateCollection(collectionId, {
            shareToken,
            isPublic: options.isPublic || false,
        });

        // Store share token mapping
        const shareTokens = this.getShareTokensFromStorage();
        shareTokens[shareToken] = {
            collectionId,
            expiresAt,
            createdAt: new Date().toISOString(),
        };
        this.saveShareTokensToStorage(shareTokens);

        return {
            collection: (await this.getCollection(
                collectionId
            )) as MediaCollection,
            shareUrl,
            expiresAt,
        };
    }

    async getSharedCollection(
        shareToken: string
    ): Promise<MediaCollection | null> {
        const shareTokens = this.getShareTokensFromStorage();
        const shareInfo = shareTokens[shareToken];

        if (!shareInfo) {
            return null;
        }

        // Check if token has expired
        if (shareInfo.expiresAt && new Date(shareInfo.expiresAt) < new Date()) {
            delete shareTokens[shareToken];
            this.saveShareTokensToStorage(shareTokens);
            return null;
        }

        return this.getCollection(shareInfo.collectionId);
    }

    async revokeCollectionShare(collectionId: string): Promise<void> {
        const collection = await this.getCollection(collectionId);
        if (!collection || !collection.shareToken) {
            return;
        }

        // Remove share token
        const shareTokens = this.getShareTokensFromStorage();
        delete shareTokens[collection.shareToken];
        this.saveShareTokensToStorage(shareTokens);

        // Update collection
        await this.updateCollection(collectionId, {
            shareToken: undefined,
            isPublic: false,
        });
    }

    async exportCollection(
        collectionId: string,
        format: 'json' | 'csv' | 'zip'
    ): Promise<Blob> {
        const collection = await this.getCollection(collectionId);
        if (!collection) {
            throw new Error('Collection not found');
        }

        switch (format) {
            case 'json':
                return new Blob([JSON.stringify(collection, null, 2)], {
                    type: 'application/json',
                });

            case 'csv':
                const csvHeader =
                    'Title,Provider,URL,Photographer,Width,Height,Tags\n';
                const csvRows = collection.items
                    .map(
                        (item) =>
                            `"${item.title}","${item.providerId}","${item.downloadUrl}","${item.photographer?.name || ''}","${item.width}","${item.height}","${item.tags.join(';')}"`
                    )
                    .join('\n');
                return new Blob([csvHeader + csvRows], { type: 'text/csv' });

            case 'zip':
                // For a real implementation, this would create a ZIP file with images
                // For now, return JSON as placeholder
                return new Blob([JSON.stringify(collection, null, 2)], {
                    type: 'application/zip',
                });

            default:
                throw new Error('Unsupported export format');
        }
    }

    async importCollection(data: string | File): Promise<MediaCollection> {
        let collectionData: any;

        if (typeof data === 'string') {
            collectionData = JSON.parse(data);
        } else {
            const text = await data.text();
            collectionData = JSON.parse(text);
        }

        // Validate and create new collection
        const importedCollection = await this.createCollection(
            collectionData.name + ' (Imported)',
            collectionData.description,
            collectionData.tags
        );

        // Add items
        if (collectionData.items && Array.isArray(collectionData.items)) {
            await this.addMultipleItemsToCollection(
                importedCollection.id,
                collectionData.items
            );
        }

        return importedCollection;
    }

    async duplicateCollection(
        collectionId: string,
        newName?: string
    ): Promise<MediaCollection> {
        const original = await this.getCollection(collectionId);
        if (!original) {
            throw new Error('Collection not found');
        }

        const duplicate = await this.createCollection(
            newName || `${original.name} (Copy)`,
            original.description,
            [...original.tags]
        );

        await this.addMultipleItemsToCollection(duplicate.id, original.items);

        return duplicate;
    }

    async mergeCollections(
        sourceIds: string[],
        targetName: string
    ): Promise<MediaCollection> {
        const sourceCollections = await Promise.all(
            sourceIds.map((id) => this.getCollection(id))
        );

        const validCollections = sourceCollections.filter(
            (c) => c !== null
        ) as MediaCollection[];

        if (validCollections.length === 0) {
            throw new Error('No valid source collections found');
        }

        // Create merged collection
        const allTags = Array.from(
            new Set(validCollections.flatMap((c) => c.tags))
        );
        const mergedCollection = await this.createCollection(
            targetName,
            undefined,
            allTags
        );

        // Add all items
        const allItems = validCollections.flatMap((c) => c.items);
        const uniqueItems = allItems.filter(
            (item, index, array) =>
                array.findIndex(
                    (other) =>
                        other.id === item.id &&
                        other.providerId === item.providerId
                ) === index
        );

        await this.addMultipleItemsToCollection(
            mergedCollection.id,
            uniqueItems
        );

        return mergedCollection;
    }

    private getShareTokensFromStorage(): Record<string, any> {
        try {
            const stored = localStorage.getItem(this.shareTokensKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load share tokens from storage:', error);
            return {};
        }
    }

    private saveShareTokensToStorage(tokens: Record<string, any>): void {
        try {
            localStorage.setItem(this.shareTokensKey, JSON.stringify(tokens));
        } catch (error) {
            console.error('Failed to save share tokens to storage:', error);
        }
    }
}

// Factory function to create the appropriate service
export function createMediaCollectionsService(): MediaCollectionsService {
    return new LocalStorageMediaCollectionsService();
}

export const mediaCollectionsService = createMediaCollectionsService();

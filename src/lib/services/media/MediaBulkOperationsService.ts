import { MediaItem } from '@/types/media-search';
import { mediaFavoritesService } from './MediaFavoritesService';
import { mediaCollectionsService } from './MediaCollectionsService';

export interface BulkOperationProgress {
    total: number;
    completed: number;
    failed: number;
    currentItem?: string;
    errors: Array<{ item: MediaItem; error: string }>;
}

export interface BulkOperationResult {
    success: boolean;
    completed: number;
    failed: number;
    errors: Array<{ item: MediaItem; error: string }>;
    duration: number;
}

export interface BulkDownloadOptions {
    format?: 'original' | 'optimized';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    includeMetadata?: boolean;
    zipFileName?: string;
}

export interface MediaBulkOperationsService {
    // Selection operations
    selectAll(items: MediaItem[]): Promise<MediaItem[]>;
    selectByProvider(
        items: MediaItem[],
        providerId: string
    ): Promise<MediaItem[]>;
    selectByType(
        items: MediaItem[],
        mediaType: 'image' | 'video'
    ): Promise<MediaItem[]>;
    selectBySize(
        items: MediaItem[],
        minWidth?: number,
        minHeight?: number
    ): Promise<MediaItem[]>;
    selectByLicense(
        items: MediaItem[],
        licenseType: string
    ): Promise<MediaItem[]>;

    // Bulk favorites operations
    addMultipleToFavorites(
        items: MediaItem[],
        tags?: string[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult>;

    removeMultipleFromFavorites(
        items: MediaItem[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult>;

    // Bulk collection operations
    addMultipleToCollection(
        items: MediaItem[],
        collectionId: string,
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult>;

    removeMultipleFromCollection(
        items: MediaItem[],
        collectionId: string,
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult>;

    // Bulk download operations
    downloadMultiple(
        items: MediaItem[],
        options?: BulkDownloadOptions,
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult>;

    downloadAsZip(
        items: MediaItem[],
        fileName?: string,
        options?: BulkDownloadOptions,
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<Blob>;

    // Bulk metadata operations
    extractMetadata(
        items: MediaItem[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<Array<{ item: MediaItem; metadata: any }>>;

    validateLicenses(
        items: MediaItem[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<Array<{ item: MediaItem; isValid: boolean; issues: string[] }>>;

    // Bulk organization operations
    organizeByProvider(items: MediaItem[]): Record<string, MediaItem[]>;
    organizeByType(items: MediaItem[]): Record<string, MediaItem[]>;
    organizeBySize(items: MediaItem[]): Record<string, MediaItem[]>;
    organizeByColor(items: MediaItem[]): Record<string, MediaItem[]>;

    // Utility operations
    removeDuplicates(items: MediaItem[]): MediaItem[];
    sortItems(
        items: MediaItem[],
        sortBy: 'title' | 'size' | 'date' | 'provider',
        order?: 'asc' | 'desc'
    ): MediaItem[];
    filterItems(
        items: MediaItem[],
        filters: {
            minWidth?: number;
            minHeight?: number;
            maxFileSize?: number;
            providers?: string[];
            mediaTypes?: string[];
            hasAttribution?: boolean;
        }
    ): MediaItem[];
}

class MediaBulkOperationsServiceImpl implements MediaBulkOperationsService {
    async selectAll(items: MediaItem[]): Promise<MediaItem[]> {
        return [...items];
    }

    async selectByProvider(
        items: MediaItem[],
        providerId: string
    ): Promise<MediaItem[]> {
        return items.filter((item) => item.providerId === providerId);
    }

    async selectByType(
        items: MediaItem[],
        mediaType: 'image' | 'video'
    ): Promise<MediaItem[]> {
        return items.filter((item) => item.mediaType === mediaType);
    }

    async selectBySize(
        items: MediaItem[],
        minWidth?: number,
        minHeight?: number
    ): Promise<MediaItem[]> {
        return items.filter((item) => {
            if (minWidth && item.width < minWidth) return false;
            if (minHeight && item.height < minHeight) return false;
            return true;
        });
    }

    async selectByLicense(
        items: MediaItem[],
        licenseType: string
    ): Promise<MediaItem[]> {
        return items.filter((item) => item.license.type === licenseType);
    }

    async addMultipleToFavorites(
        items: MediaItem[],
        tags: string[] = [],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult> {
        const startTime = Date.now();
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            try {
                await mediaFavoritesService.addToFavorites(item, tags);
                progress.completed++;
            } catch (error) {
                progress.failed++;
                progress.errors.push({
                    item,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });
            }

            onProgress?.(progress);
        }

        return {
            success: progress.failed === 0,
            completed: progress.completed,
            failed: progress.failed,
            errors: progress.errors,
            duration: Date.now() - startTime,
        };
    }

    async removeMultipleFromFavorites(
        items: MediaItem[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult> {
        const startTime = Date.now();
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            try {
                await mediaFavoritesService.removeFromFavorites(
                    item.id,
                    item.providerId
                );
                progress.completed++;
            } catch (error) {
                progress.failed++;
                progress.errors.push({
                    item,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });
            }

            onProgress?.(progress);
        }

        return {
            success: progress.failed === 0,
            completed: progress.completed,
            failed: progress.failed,
            errors: progress.errors,
            duration: Date.now() - startTime,
        };
    }

    async addMultipleToCollection(
        items: MediaItem[],
        collectionId: string,
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult> {
        const startTime = Date.now();
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            try {
                await mediaCollectionsService.addItemToCollection(
                    collectionId,
                    item
                );
                progress.completed++;
            } catch (error) {
                progress.failed++;
                progress.errors.push({
                    item,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });
            }

            onProgress?.(progress);
        }

        return {
            success: progress.failed === 0,
            completed: progress.completed,
            failed: progress.failed,
            errors: progress.errors,
            duration: Date.now() - startTime,
        };
    }

    async removeMultipleFromCollection(
        items: MediaItem[],
        collectionId: string,
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult> {
        const startTime = Date.now();
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            try {
                await mediaCollectionsService.removeItemFromCollection(
                    collectionId,
                    item.id,
                    item.providerId
                );
                progress.completed++;
            } catch (error) {
                progress.failed++;
                progress.errors.push({
                    item,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                });
            }

            onProgress?.(progress);
        }

        return {
            success: progress.failed === 0,
            completed: progress.completed,
            failed: progress.failed,
            errors: progress.errors,
            duration: Date.now() - startTime,
        };
    }

    async downloadMultiple(
        items: MediaItem[],
        options: BulkDownloadOptions = {},
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<BulkOperationResult> {
        const startTime = Date.now();
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            try {
                // Simulate download - in real implementation, this would download the file
                await this.downloadSingleItem(item, options);
                progress.completed++;
            } catch (error) {
                progress.failed++;
                progress.errors.push({
                    item,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Download failed',
                });
            }

            onProgress?.(progress);
        }

        return {
            success: progress.failed === 0,
            completed: progress.completed,
            failed: progress.failed,
            errors: progress.errors,
            duration: Date.now() - startTime,
        };
    }

    async downloadAsZip(
        items: MediaItem[],
        fileName: string = 'media-collection.zip',
        options: BulkDownloadOptions = {},
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<Blob> {
        // In a real implementation, this would use a library like JSZip
        // For now, return a mock blob
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;
            progress.completed++;
            onProgress?.(progress);

            // Simulate processing time
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Return mock ZIP blob
        const zipContent = JSON.stringify({
            fileName,
            items: items.map((item) => ({
                id: item.id,
                title: item.title,
                url: item.downloadUrl,
                provider: item.providerId,
            })),
            createdAt: new Date().toISOString(),
        });

        return new Blob([zipContent], { type: 'application/zip' });
    }

    async extractMetadata(
        items: MediaItem[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<Array<{ item: MediaItem; metadata: any }>> {
        const results: Array<{ item: MediaItem; metadata: any }> = [];
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            try {
                const metadata = {
                    dimensions: `${item.width}x${item.height}`,
                    fileSize: item.fileSize,
                    provider: item.providerId,
                    license: item.license.type,
                    attribution: item.attribution.required,
                    photographer: item.photographer?.name,
                    tags: item.tags,
                    color: item.color,
                    extractedAt: new Date().toISOString(),
                };

                results.push({ item, metadata });
                progress.completed++;
            } catch (error) {
                progress.failed++;
                progress.errors.push({
                    item,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Metadata extraction failed',
                });
            }

            onProgress?.(progress);
        }

        return results;
    }

    async validateLicenses(
        items: MediaItem[],
        onProgress?: (progress: BulkOperationProgress) => void
    ): Promise<Array<{ item: MediaItem; isValid: boolean; issues: string[] }>> {
        const results: Array<{
            item: MediaItem;
            isValid: boolean;
            issues: string[];
        }> = [];
        const progress: BulkOperationProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: [],
        };

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            progress.currentItem = item.title;

            const issues: string[] = [];

            // Check commercial use
            if (!item.license.commercialUse) {
                issues.push('License does not allow commercial use');
            }

            // Check attribution requirements
            if (item.attribution.required && !item.attribution.text) {
                issues.push('Attribution required but text not provided');
            }

            // Check license validity
            if (!item.license.url) {
                issues.push('License URL not provided');
            }

            results.push({
                item,
                isValid: issues.length === 0,
                issues,
            });

            progress.completed++;
            onProgress?.(progress);
        }

        return results;
    }

    organizeByProvider(items: MediaItem[]): Record<string, MediaItem[]> {
        const organized: Record<string, MediaItem[]> = {};

        for (const item of items) {
            if (!organized[item.providerId]) {
                organized[item.providerId] = [];
            }
            organized[item.providerId].push(item);
        }

        return organized;
    }

    organizeByType(items: MediaItem[]): Record<string, MediaItem[]> {
        const organized: Record<string, MediaItem[]> = {};

        for (const item of items) {
            if (!organized[item.mediaType]) {
                organized[item.mediaType] = [];
            }
            organized[item.mediaType].push(item);
        }

        return organized;
    }

    organizeBySize(items: MediaItem[]): Record<string, MediaItem[]> {
        const organized: Record<string, MediaItem[]> = {
            small: [],
            medium: [],
            large: [],
            xlarge: [],
        };

        for (const item of items) {
            const pixels = item.width * item.height;

            if (pixels < 500000) {
                // < 0.5MP
                organized.small.push(item);
            } else if (pixels < 2000000) {
                // < 2MP
                organized.medium.push(item);
            } else if (pixels < 8000000) {
                // < 8MP
                organized.large.push(item);
            } else {
                organized.xlarge.push(item);
            }
        }

        return organized;
    }

    organizeByColor(items: MediaItem[]): Record<string, MediaItem[]> {
        const organized: Record<string, MediaItem[]> = {};

        for (const item of items) {
            const color = item.color || 'unknown';
            if (!organized[color]) {
                organized[color] = [];
            }
            organized[color].push(item);
        }

        return organized;
    }

    removeDuplicates(items: MediaItem[]): MediaItem[] {
        const seen = new Set<string>();
        return items.filter((item) => {
            const key = `${item.providerId}-${item.id}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    sortItems(
        items: MediaItem[],
        sortBy: 'title' | 'size' | 'date' | 'provider',
        order: 'asc' | 'desc' = 'asc'
    ): MediaItem[] {
        const sorted = [...items].sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'size':
                    comparison = a.width * a.height - b.width * b.height;
                    break;
                case 'provider':
                    comparison = a.providerId.localeCompare(b.providerId);
                    break;
                case 'date':
                    // For date sorting, we'd need a date field in MediaItem
                    // For now, sort by ID as a proxy
                    comparison = a.id.localeCompare(b.id);
                    break;
            }

            return order === 'desc' ? -comparison : comparison;
        });

        return sorted;
    }

    filterItems(
        items: MediaItem[],
        filters: {
            minWidth?: number;
            minHeight?: number;
            maxFileSize?: number;
            providers?: string[];
            mediaTypes?: string[];
            hasAttribution?: boolean;
        }
    ): MediaItem[] {
        return items.filter((item) => {
            if (filters.minWidth && item.width < filters.minWidth) return false;
            if (filters.minHeight && item.height < filters.minHeight)
                return false;
            if (
                filters.maxFileSize &&
                item.fileSize &&
                item.fileSize > filters.maxFileSize
            )
                return false;
            if (
                filters.providers &&
                !filters.providers.includes(item.providerId)
            )
                return false;
            if (
                filters.mediaTypes &&
                !filters.mediaTypes.includes(item.mediaType)
            )
                return false;
            if (
                filters.hasAttribution !== undefined &&
                item.attribution.required !== filters.hasAttribution
            )
                return false;

            return true;
        });
    }

    private async downloadSingleItem(
        item: MediaItem,
        options: BulkDownloadOptions
    ): Promise<void> {
        // Simulate download delay
        await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 1000 + 500)
        );

        // In a real implementation, this would:
        // 1. Fetch the image from item.downloadUrl
        // 2. Apply any optimization options
        // 3. Save to user's device or return blob

        console.log(`Downloaded: ${item.title} from ${item.providerId}`);
    }
}

export const mediaBulkOperationsService = new MediaBulkOperationsServiceImpl();

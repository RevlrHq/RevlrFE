import { MediaItem } from '@/types/media-search';

export interface SelectionValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface SelectionLimits {
    maxItems: number;
    maxTotalSize?: number; // in bytes
    allowedTypes?: ('image' | 'video')[];
    minDimensions?: {
        width: number;
        height: number;
    };
    maxDimensions?: {
        width: number;
        height: number;
    };
}

export class MediaSelectionValidator {
    private limits: SelectionLimits;

    constructor(limits: SelectionLimits) {
        this.limits = limits;
    }

    /**
     * Validate if a new item can be added to the current selection
     */
    validateAddition(
        currentSelection: MediaItem[],
        newItem: MediaItem
    ): SelectionValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check item count limit
        if (currentSelection.length >= this.limits.maxItems) {
            errors.push(
                `Maximum of ${this.limits.maxItems} items can be selected`
            );
        }

        // Check if item is already selected
        const isDuplicate = currentSelection.some(
            (item) =>
                item.id === newItem.id && item.providerId === newItem.providerId
        );
        if (isDuplicate) {
            errors.push('This item is already selected');
        }

        // Check media type
        if (
            this.limits.allowedTypes &&
            !this.limits.allowedTypes.includes(newItem.mediaType)
        ) {
            errors.push(`${newItem.mediaType} files are not allowed`);
        }

        // Check dimensions
        if (this.limits.minDimensions) {
            const { width: minWidth, height: minHeight } =
                this.limits.minDimensions;
            if (newItem.width < minWidth || newItem.height < minHeight) {
                errors.push(
                    `Image must be at least ${minWidth}×${minHeight} pixels (current: ${newItem.width}×${newItem.height})`
                );
            }
        }

        if (this.limits.maxDimensions) {
            const { width: maxWidth, height: maxHeight } =
                this.limits.maxDimensions;
            if (newItem.width > maxWidth || newItem.height > maxHeight) {
                warnings.push(
                    `Image is larger than recommended ${maxWidth}×${maxHeight} pixels`
                );
            }
        }

        // Check total file size
        if (this.limits.maxTotalSize && newItem.fileSize) {
            const currentTotalSize = currentSelection.reduce(
                (total, item) => total + (item.fileSize || 0),
                0
            );
            const newTotalSize = currentTotalSize + newItem.fileSize;

            if (newTotalSize > this.limits.maxTotalSize) {
                const maxSizeMB = Math.round(
                    this.limits.maxTotalSize / (1024 * 1024)
                );
                const currentSizeMB = Math.round(newTotalSize / (1024 * 1024));
                errors.push(
                    `Total file size would exceed ${maxSizeMB}MB limit (would be ${currentSizeMB}MB)`
                );
            }
        }

        // Quality warnings
        if (newItem.width < 1200 || newItem.height < 630) {
            warnings.push(
                'Image resolution is below recommended size for events'
            );
        }

        // Attribution warnings
        if (newItem.attribution.required) {
            warnings.push('This image requires attribution when used');
        }

        // Commercial use warnings
        if (!newItem.license.commercialUse) {
            errors.push('This image cannot be used for commercial purposes');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Validate the entire current selection
     */
    validateSelection(selection: MediaItem[]): SelectionValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check if selection is empty
        if (selection.length === 0) {
            warnings.push('No images selected');
            return { isValid: true, errors, warnings };
        }

        // Check item count
        if (selection.length > this.limits.maxItems) {
            errors.push(
                `Too many items selected (${selection.length}/${this.limits.maxItems})`
            );
        }

        // Check total file size
        if (this.limits.maxTotalSize) {
            const totalSize = selection.reduce(
                (total, item) => total + (item.fileSize || 0),
                0
            );
            if (totalSize > this.limits.maxTotalSize) {
                const maxSizeMB = Math.round(
                    this.limits.maxTotalSize / (1024 * 1024)
                );
                const currentSizeMB = Math.round(totalSize / (1024 * 1024));
                errors.push(
                    `Total file size exceeds ${maxSizeMB}MB limit (current: ${currentSizeMB}MB)`
                );
            }
        }

        // Check for duplicates
        const seen = new Set<string>();
        const duplicates: string[] = [];

        selection.forEach((item) => {
            const key = `${item.providerId}-${item.id}`;
            if (seen.has(key)) {
                duplicates.push(item.title);
            } else {
                seen.add(key);
            }
        });

        if (duplicates.length > 0) {
            errors.push(`Duplicate items found: ${duplicates.join(', ')}`);
        }

        // Check media types
        if (this.limits.allowedTypes) {
            const invalidTypes = selection.filter(
                (item) => !this.limits.allowedTypes!.includes(item.mediaType)
            );
            if (invalidTypes.length > 0) {
                errors.push(
                    `Invalid media types: ${invalidTypes.map((item) => item.mediaType).join(', ')}`
                );
            }
        }

        // Quality warnings
        const lowQualityItems = selection.filter(
            (item) => item.width < 1200 || item.height < 630
        );
        if (lowQualityItems.length > 0) {
            warnings.push(
                `${lowQualityItems.length} image(s) have low resolution and may appear pixelated`
            );
        }

        // Attribution warnings
        const attributionRequired = selection.filter(
            (item) => item.attribution.required
        );
        if (attributionRequired.length > 0) {
            warnings.push(
                `${attributionRequired.length} image(s) require attribution when used`
            );
        }

        // Commercial use check
        const nonCommercialItems = selection.filter(
            (item) => !item.license.commercialUse
        );
        if (nonCommercialItems.length > 0) {
            errors.push(
                `${nonCommercialItems.length} image(s) cannot be used for commercial purposes`
            );
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Get selection statistics
     */
    getSelectionStats(selection: MediaItem[]) {
        const totalSize = selection.reduce(
            (total, item) => total + (item.fileSize || 0),
            0
        );
        const mediaTypes = selection.reduce(
            (acc, item) => {
                acc[item.mediaType] = (acc[item.mediaType] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const providers = selection.reduce(
            (acc, item) => {
                acc[item.providerId] = (acc[item.providerId] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const attributionRequired = selection.filter(
            (item) => item.attribution.required
        ).length;
        const averageResolution =
            selection.length > 0
                ? {
                      width: Math.round(
                          selection.reduce((sum, item) => sum + item.width, 0) /
                              selection.length
                      ),
                      height: Math.round(
                          selection.reduce(
                              (sum, item) => sum + item.height,
                              0
                          ) / selection.length
                      ),
                  }
                : { width: 0, height: 0 };

        return {
            count: selection.length,
            maxCount: this.limits.maxItems,
            totalSize,
            maxTotalSize: this.limits.maxTotalSize,
            mediaTypes,
            providers,
            attributionRequired,
            averageResolution,
            utilizationPercentage:
                (selection.length / this.limits.maxItems) * 100,
        };
    }

    /**
     * Format file size for display
     */
    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    }

    /**
     * Get recommended image dimensions for events
     */
    static getRecommendedDimensions() {
        return {
            minimum: { width: 800, height: 400 },
            recommended: { width: 1200, height: 630 },
            optimal: { width: 1920, height: 1080 },
        };
    }

    /**
     * Check if image dimensions are suitable for events
     */
    static assessImageQuality(width: number, height: number) {
        const dimensions = MediaSelectionValidator.getRecommendedDimensions();

        if (
            width >= dimensions.optimal.width &&
            height >= dimensions.optimal.height
        ) {
            return {
                quality: 'excellent',
                message: 'Perfect for all display sizes',
            };
        } else if (
            width >= dimensions.recommended.width &&
            height >= dimensions.recommended.height
        ) {
            return {
                quality: 'good',
                message: 'Good quality for most displays',
            };
        } else if (
            width >= dimensions.minimum.width &&
            height >= dimensions.minimum.height
        ) {
            return {
                quality: 'fair',
                message: 'May appear pixelated on larger screens',
            };
        } else {
            return { quality: 'poor', message: 'Too small for event displays' };
        }
    }
}

// Default validation limits for event images
export const DEFAULT_EVENT_LIMITS: SelectionLimits = {
    maxItems: 10,
    maxTotalSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image', 'video'],
    minDimensions: { width: 400, height: 200 },
    maxDimensions: { width: 4000, height: 4000 },
};

// Strict validation limits for premium events
export const PREMIUM_EVENT_LIMITS: SelectionLimits = {
    maxItems: 20,
    maxTotalSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image', 'video'],
    minDimensions: { width: 800, height: 400 },
    maxDimensions: { width: 6000, height: 6000 },
};

// Basic validation limits for free events
export const BASIC_EVENT_LIMITS: SelectionLimits = {
    maxItems: 5,
    maxTotalSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image'],
    minDimensions: { width: 400, height: 200 },
    maxDimensions: { width: 2000, height: 2000 },
};

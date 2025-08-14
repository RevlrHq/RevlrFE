import {
    MediaSelectionValidator,
    SelectionLimits,
    DEFAULT_EVENT_LIMITS,
    PREMIUM_EVENT_LIMITS,
    BASIC_EVENT_LIMITS,
} from '@/lib/utils/mediaSelectionValidation';
import { MediaItem } from '@/types/media-search';

// Mock media items for testing
const createMockMediaItem = (
    overrides: Partial<MediaItem> = {}
): MediaItem => ({
    id: 'test-image-1',
    providerId: 'unsplash',
    title: 'Test Image',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewUrl: 'https://example.com/preview.jpg',
    downloadUrl: 'https://example.com/download.jpg',
    width: 1920,
    height: 1080,
    fileSize: 2048000, // 2MB
    mediaType: 'image',
    attribution: { required: false, placement: 'none' },
    license: {
        type: 'unsplash',
        name: 'Unsplash License',
        url: 'https://unsplash.com/license',
        commercialUse: true,
        attribution: { required: false, placement: 'none' },
    },
    tags: ['test'],
    photographer: { name: 'Test Photographer' },
    ...overrides,
});

describe('MediaSelectionValidator', () => {
    let validator: MediaSelectionValidator;
    const testLimits: SelectionLimits = {
        maxItems: 3,
        maxTotalSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image', 'video'],
        minDimensions: { width: 800, height: 400 },
        maxDimensions: { width: 4000, height: 4000 },
    };

    beforeEach(() => {
        validator = new MediaSelectionValidator(testLimits);
    });

    describe('validateAddition', () => {
        it('allows adding valid item to empty selection', () => {
            const item = createMockMediaItem();
            const result = validator.validateAddition([], item);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('prevents adding item when at maximum count', () => {
            const existingItems = [
                createMockMediaItem({ id: '1' }),
                createMockMediaItem({ id: '2' }),
                createMockMediaItem({ id: '3' }),
            ];
            const newItem = createMockMediaItem({ id: '4' });

            const result = validator.validateAddition(existingItems, newItem);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Maximum of 3 items can be selected'
            );
        });

        it('prevents adding duplicate item', () => {
            const existingItem = createMockMediaItem({
                id: 'duplicate',
                providerId: 'test',
            });
            const duplicateItem = createMockMediaItem({
                id: 'duplicate',
                providerId: 'test',
            });

            const result = validator.validateAddition(
                [existingItem],
                duplicateItem
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('This item is already selected');
        });

        it('prevents adding disallowed media type', () => {
            const validator = new MediaSelectionValidator({
                ...testLimits,
                allowedTypes: ['image'],
            });
            const videoItem = createMockMediaItem({ mediaType: 'video' });

            const result = validator.validateAddition([], videoItem);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('video files are not allowed');
        });

        it('prevents adding item below minimum dimensions', () => {
            const smallItem = createMockMediaItem({ width: 600, height: 300 });

            const result = validator.validateAddition([], smallItem);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Image must be at least 800×400 pixels (current: 600×300)'
            );
        });

        it('warns about items above maximum dimensions', () => {
            const largeItem = createMockMediaItem({
                width: 5000,
                height: 5000,
            });

            const result = validator.validateAddition([], largeItem);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                'Image is larger than recommended 4000×4000 pixels'
            );
        });

        it('prevents adding item that would exceed total file size limit', () => {
            const existingItems = [
                createMockMediaItem({ id: '1', fileSize: 6 * 1024 * 1024 }), // 6MB
            ];
            const newItem = createMockMediaItem({ fileSize: 5 * 1024 * 1024 }); // 5MB

            const result = validator.validateAddition(existingItems, newItem);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Total file size would exceed 10MB limit (would be 11MB)'
            );
        });

        it('warns about low resolution images', () => {
            const lowResItem = createMockMediaItem({
                width: 1000,
                height: 500,
            });

            const result = validator.validateAddition([], lowResItem);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                'Image resolution is below recommended size for events'
            );
        });

        it('warns about attribution requirements', () => {
            const attributionItem = createMockMediaItem({
                attribution: { required: true, placement: 'image-caption' },
            });

            const result = validator.validateAddition([], attributionItem);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                'This image requires attribution when used'
            );
        });

        it('prevents adding non-commercial items', () => {
            const nonCommercialItem = createMockMediaItem({
                license: {
                    type: 'cc0',
                    name: 'Non-commercial License',
                    url: 'https://example.com/license',
                    commercialUse: false,
                    attribution: { required: false, placement: 'none' },
                },
            });

            const result = validator.validateAddition([], nonCommercialItem);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'This image cannot be used for commercial purposes'
            );
        });
    });

    describe('validateSelection', () => {
        it('returns valid for empty selection with warning', () => {
            const result = validator.validateSelection([]);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain('No images selected');
        });

        it('validates selection with multiple items', () => {
            const items = [
                createMockMediaItem({ id: '1' }),
                createMockMediaItem({ id: '2' }),
            ];

            const result = validator.validateSelection(items);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('detects too many items', () => {
            const items = [
                createMockMediaItem({ id: '1' }),
                createMockMediaItem({ id: '2' }),
                createMockMediaItem({ id: '3' }),
                createMockMediaItem({ id: '4' }),
            ];

            const result = validator.validateSelection(items);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Too many items selected (4/3)');
        });

        it('detects duplicate items', () => {
            const items = [
                createMockMediaItem({ id: 'duplicate', providerId: 'test' }),
                createMockMediaItem({ id: 'duplicate', providerId: 'test' }),
            ];

            const result = validator.validateSelection(items);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Duplicate items found: Test Image'
            );
        });

        it('warns about low quality items', () => {
            const items = [
                createMockMediaItem({ width: 800, height: 400 }),
                createMockMediaItem({ width: 1000, height: 500 }),
            ];

            const result = validator.validateSelection(items);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                '2 image(s) have low resolution and may appear pixelated'
            );
        });

        it('warns about attribution requirements', () => {
            const items = [
                createMockMediaItem({
                    id: '1',
                    attribution: { required: true, placement: 'image-caption' },
                }),
                createMockMediaItem({ id: '2' }),
            ];

            const result = validator.validateSelection(items);

            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                '1 image(s) require attribution when used'
            );
        });
    });

    describe('getSelectionStats', () => {
        it('calculates correct statistics', () => {
            const items = [
                createMockMediaItem({
                    id: '1',
                    fileSize: 2 * 1024 * 1024,
                    providerId: 'unsplash',
                }),
                createMockMediaItem({
                    id: '2',
                    fileSize: 3 * 1024 * 1024,
                    providerId: 'pexels',
                    mediaType: 'video',
                }),
                createMockMediaItem({
                    id: '3',
                    fileSize: 1 * 1024 * 1024,
                    providerId: 'unsplash',
                    attribution: { required: true, placement: 'image-caption' },
                }),
            ];

            const stats = validator.getSelectionStats(items);

            expect(stats.count).toBe(3);
            expect(stats.maxCount).toBe(3);
            expect(stats.totalSize).toBe(6 * 1024 * 1024);
            expect(stats.mediaTypes).toEqual({ image: 2, video: 1 });
            expect(stats.providers).toEqual({ unsplash: 2, pexels: 1 });
            expect(stats.attributionRequired).toBe(1);
            expect(stats.utilizationPercentage).toBe(100);
        });

        it('calculates average resolution correctly', () => {
            const items = [
                createMockMediaItem({ width: 1920, height: 1080 }),
                createMockMediaItem({ width: 1600, height: 900 }),
            ];

            const stats = validator.getSelectionStats(items);

            expect(stats.averageResolution).toEqual({
                width: 1760,
                height: 990,
            });
        });
    });

    describe('static methods', () => {
        it('formats file size correctly', () => {
            expect(MediaSelectionValidator.formatFileSize(0)).toBe('0 B');
            expect(MediaSelectionValidator.formatFileSize(1024)).toBe('1 KB');
            expect(MediaSelectionValidator.formatFileSize(1024 * 1024)).toBe(
                '1 MB'
            );
            expect(
                MediaSelectionValidator.formatFileSize(1024 * 1024 * 1024)
            ).toBe('1 GB');
            expect(MediaSelectionValidator.formatFileSize(1536)).toBe('1.5 KB');
        });

        it('assesses image quality correctly', () => {
            expect(
                MediaSelectionValidator.assessImageQuality(1920, 1080)
            ).toEqual({
                quality: 'excellent',
                message: 'Perfect for all display sizes',
            });

            expect(
                MediaSelectionValidator.assessImageQuality(1200, 630)
            ).toEqual({
                quality: 'good',
                message: 'Good quality for most displays',
            });

            expect(
                MediaSelectionValidator.assessImageQuality(800, 400)
            ).toEqual({
                quality: 'fair',
                message: 'May appear pixelated on larger screens',
            });

            expect(
                MediaSelectionValidator.assessImageQuality(400, 200)
            ).toEqual({
                quality: 'poor',
                message: 'Too small for event displays',
            });
        });

        it('provides recommended dimensions', () => {
            const dimensions =
                MediaSelectionValidator.getRecommendedDimensions();

            expect(dimensions.minimum).toEqual({ width: 800, height: 400 });
            expect(dimensions.recommended).toEqual({
                width: 1200,
                height: 630,
            });
            expect(dimensions.optimal).toEqual({ width: 1920, height: 1080 });
        });
    });

    describe('predefined limits', () => {
        it('has correct default event limits', () => {
            expect(DEFAULT_EVENT_LIMITS.maxItems).toBe(10);
            expect(DEFAULT_EVENT_LIMITS.maxTotalSize).toBe(50 * 1024 * 1024);
            expect(DEFAULT_EVENT_LIMITS.allowedTypes).toEqual([
                'image',
                'video',
            ]);
        });

        it('has correct premium event limits', () => {
            expect(PREMIUM_EVENT_LIMITS.maxItems).toBe(20);
            expect(PREMIUM_EVENT_LIMITS.maxTotalSize).toBe(100 * 1024 * 1024);
        });

        it('has correct basic event limits', () => {
            expect(BASIC_EVENT_LIMITS.maxItems).toBe(5);
            expect(BASIC_EVENT_LIMITS.maxTotalSize).toBe(20 * 1024 * 1024);
            expect(BASIC_EVENT_LIMITS.allowedTypes).toEqual(['image']);
        });
    });
});

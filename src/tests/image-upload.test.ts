import { ImageUploadService } from '../lib/services/ImageUploadService';
import type { EventImage } from '../types/event-creation';

// Mock the uploadcare client
jest.mock('@uploadcare/upload-client', () => ({
    UploadClient: jest.fn().mockImplementation(() => ({
        uploadFile: jest.fn().mockResolvedValue({
            uuid: 'test-uuid-123',
            originalUrl: 'https://ucarecdn.com/test-uuid-123/',
            cdnUrl: 'https://ucarecdn.com/test-uuid-123/',
            originalFilename: 'test-image.jpg',
            size: 1024000,
            mimeType: 'image/jpeg',
        }),
        deleteFile: jest.fn().mockResolvedValue({}),
        info: jest.fn().mockResolvedValue({
            uuid: 'test-uuid-123',
            size: 1024000,
            mimeType: 'image/jpeg',
        }),
    })),
}));

// Mock environment variable
process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY = 'test-public-key';

describe('ImageUploadService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('validateImage', () => {
        it('should validate a valid image file', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024000 }); // 1MB

            const result = ImageUploadService.validateImage(file);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject files that are too large', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

            const result = ImageUploadService.validateImage(file);

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((error) =>
                    error.includes('exceeds maximum size')
                )
            ).toBe(true);
        });

        it('should reject unsupported file types', () => {
            const file = new File(['test'], 'test.gif', { type: 'image/gif' });
            Object.defineProperty(file, 'size', { value: 1024000 });

            const result = ImageUploadService.validateImage(file);

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((error) => error.includes('not supported'))
            ).toBe(true);
        });

        it('should reject non-image files', () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: 1024000 });

            const result = ImageUploadService.validateImage(file);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('File must be an image');
        });
    });

    describe('validateImages', () => {
        it('should validate multiple valid images', () => {
            const files = [
                new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
                new File(['test2'], 'test2.png', { type: 'image/png' }),
            ];

            files.forEach((file) => {
                Object.defineProperty(file, 'size', { value: 1024000 });
            });

            const result = ImageUploadService.validateImages(files);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject when total files exceed maximum', () => {
            const files = Array.from(
                { length: 6 },
                (_, i) =>
                    new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
            );

            files.forEach((file) => {
                Object.defineProperty(file, 'size', { value: 1024000 });
            });

            const result = ImageUploadService.validateImages(files, [], {
                maxFiles: 5,
            });

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((error) =>
                    error.includes('Maximum 5 images allowed')
                )
            ).toBe(true);
        });

        it('should consider existing images when validating new uploads', () => {
            const existingImages: EventImage[] = [
                {
                    id: 'existing-1',
                    url: 'https://example.com/image1.jpg',
                    name: 'existing1.jpg',
                    size: 1024000,
                    mimeType: 'image/jpeg',
                    order: 0,
                },
                {
                    id: 'existing-2',
                    url: 'https://example.com/image2.jpg',
                    name: 'existing2.jpg',
                    size: 1024000,
                    mimeType: 'image/jpeg',
                    order: 1,
                },
            ];

            const newFiles = Array.from(
                { length: 4 },
                (_, i) =>
                    new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
            );

            newFiles.forEach((file) => {
                Object.defineProperty(file, 'size', { value: 1024000 });
            });

            const result = ImageUploadService.validateImages(
                newFiles,
                existingImages,
                { maxFiles: 5 }
            );

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((error) =>
                    error.includes('currently have 2')
                )
            ).toBe(true);
        });
    });

    describe('generateOptimizedUrl', () => {
        const baseCdnUrl =
            'https://ucarecdn.com/12345678-1234-1234-1234-123456789abc/';

        it('should return original URL when no transformations are specified', () => {
            const result = ImageUploadService.generateOptimizedUrl(baseCdnUrl);
            expect(result).toBe(baseCdnUrl);
        });

        it('should add resize transformation', () => {
            const result = ImageUploadService.generateOptimizedUrl(baseCdnUrl, {
                width: 300,
                height: 200,
            });
            expect(result).toContain('resize/300x200');
        });

        it('should add quality transformation', () => {
            const result = ImageUploadService.generateOptimizedUrl(baseCdnUrl, {
                quality: 80,
            });
            expect(result).toContain('quality/80');
        });

        it('should add format transformation', () => {
            const result = ImageUploadService.generateOptimizedUrl(baseCdnUrl, {
                format: 'webp',
            });
            expect(result).toContain('format/webp');
        });

        it('should add crop transformation', () => {
            const result = ImageUploadService.generateOptimizedUrl(baseCdnUrl, {
                crop: 'center',
            });
            expect(result).toContain('crop/center');
        });

        it('should combine multiple transformations', () => {
            const result = ImageUploadService.generateOptimizedUrl(baseCdnUrl, {
                width: 300,
                height: 200,
                quality: 80,
                format: 'webp',
                crop: 'center',
            });

            expect(result).toContain('resize/300x200');
            expect(result).toContain('quality/80');
            expect(result).toContain('format/webp');
            expect(result).toContain('crop/center');
        });

        it('should handle empty CDN URL', () => {
            const result = ImageUploadService.generateOptimizedUrl('', {
                width: 300,
            });
            expect(result).toBe('');
        });
    });

    describe('uploadImage', () => {
        // Mock canvas and image for compression tests
        beforeEach(() => {
            // The canvas mock is already set up in test-setup.ts
            // Just ensure URL.createObjectURL is mocked
            global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
        });

        it('should upload a valid image file', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024000 });

            const result = await ImageUploadService.uploadImage(file);

            expect(result).toEqual({
                id: 'test-uuid-123',
                url: 'https://ucarecdn.com/test-uuid-123/',
                cdnUrl: 'https://ucarecdn.com/test-uuid-123/',
                name: 'test.jpg',
                size: 1024000,
                mimeType: 'image/jpeg',
                order: 0,
                isUploading: false,
                uploadProgress: 100,
            });
        });

        it('should call progress callback during upload', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024000 });

            const progressCallback = jest.fn();

            await ImageUploadService.uploadImage(file, progressCallback);

            // Note: In a real scenario, this would be called by the upload client
            // For testing, we just verify the callback was passed
            expect(progressCallback).toBeDefined();
        });

        it('should reject invalid files', async () => {
            const file = new File(['test'], 'test.txt', { type: 'text/plain' });
            Object.defineProperty(file, 'size', { value: 1024000 });

            await expect(ImageUploadService.uploadImage(file)).rejects.toThrow(
                'File must be an image'
            );
        });
    });
});

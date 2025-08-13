import { UploadClient } from '@uploadcare/upload-client';
import type {
    EventImage,
    ImageUploadOptions,
    ImageValidationResult,
} from '../../types/event-creation';

export class ImageUploadService {
    private static client: UploadClient | null = null;

    private static readonly DEFAULT_OPTIONS: ImageUploadOptions = {
        maxFiles: 5,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        compressionQuality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
    };

    private static getClient(): UploadClient {
        if (!this.client) {
            const publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;
            if (!publicKey) {
                throw new Error('Uploadcare public key not configured');
            }
            this.client = new UploadClient({ publicKey });
        }
        return this.client;
    }

    /**
     * Validate image file before upload
     */
    static validateImage(
        file: File,
        options: Partial<ImageUploadOptions> = {}
    ): ImageValidationResult {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const errors: string[] = [];

        // Check file type
        if (!opts.acceptedTypes.includes(file.type)) {
            errors.push(
                `File type ${file.type} is not supported. Supported types: ${opts.acceptedTypes.join(', ')}`
            );
        }

        // Check file size
        if (file.size > opts.maxFileSize) {
            const maxSizeMB = opts.maxFileSize / (1024 * 1024);
            errors.push(
                `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum size of ${maxSizeMB}MB`
            );
        }

        // Check if file is actually an image
        if (!file.type.startsWith('image/')) {
            errors.push('File must be an image');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate multiple images
     */
    static validateImages(
        files: File[],
        currentImages: EventImage[] = [],
        options: Partial<ImageUploadOptions> = {}
    ): ImageValidationResult {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const errors: string[] = [];

        // Check total number of files
        const totalFiles = files.length + currentImages.length;
        if (totalFiles > opts.maxFiles) {
            errors.push(
                `Cannot upload ${files.length} files. Maximum ${opts.maxFiles} images allowed (currently have ${currentImages.length})`
            );
        }

        // Validate each file
        files.forEach((file, index) => {
            const validation = this.validateImage(file, options);
            if (!validation.isValid) {
                errors.push(
                    `File ${index + 1} (${file.name}): ${validation.errors.join(', ')}`
                );
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Compress image before upload
     */
    static async compressImage(
        file: File,
        options: Partial<ImageUploadOptions> = {}
    ): Promise<File> {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                const aspectRatio = width / height;

                if (width > opts.maxWidth) {
                    width = opts.maxWidth;
                    height = width / aspectRatio;
                }

                if (height > opts.maxHeight) {
                    height = opts.maxHeight;
                    width = height * aspectRatio;
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    file.type,
                    opts.compressionQuality
                );
            };

            img.onerror = () =>
                reject(new Error('Failed to load image for compression'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Upload single image to Uploadcare
     */
    static async uploadImage(
        file: File,
        onProgress?: (progress: number) => void,
        options: Partial<ImageUploadOptions> = {}
    ): Promise<EventImage> {
        // Validate file
        const validation = this.validateImage(file, options);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        try {
            // Compress image if needed
            const compressedFile = await this.compressImage(file, options);

            const client = this.getClient();

            // Upload to Uploadcare
            const fileInfo = await client.uploadFile(compressedFile, {
                onProgress: (progressInfo) => {
                    const progress = Math.round(
                        (progressInfo.isComputable ? progressInfo.value : 0) *
                            100
                    );
                    onProgress?.(progress);
                },
                fileName: file.name,
                contentType: file.type,
            });

            // Create EventImage object
            const eventImage: EventImage = {
                id: fileInfo.uuid,
                url:
                    fileInfo.cdnUrl || `https://ucarecdn.com/${fileInfo.uuid}/`,
                cdnUrl:
                    fileInfo.cdnUrl || `https://ucarecdn.com/${fileInfo.uuid}/`,
                name: fileInfo.name || file.name,
                size: fileInfo.size || file.size,
                mimeType: fileInfo.mimeType || file.type,
                order: 0, // Will be set by the calling component
                isUploading: false,
                uploadProgress: 100,
            };

            return eventImage;
        } catch (error: any) {
            throw new Error(
                `Upload failed: ${error.message || 'Unknown error'}`
            );
        }
    }

    /**
     * Upload multiple images
     */
    static async uploadImages(
        files: File[],
        onProgress?: (fileIndex: number, progress: number) => void,
        onFileComplete?: (fileIndex: number, image: EventImage) => void,
        options: Partial<ImageUploadOptions> = {}
    ): Promise<EventImage[]> {
        const results: EventImage[] = [];
        const errors: string[] = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const image = await this.uploadImage(
                    files[i],
                    (progress) => onProgress?.(i, progress),
                    options
                );
                image.order = i;
                results.push(image);
                onFileComplete?.(i, image);
            } catch (error: any) {
                errors.push(`${files[i].name}: ${error.message}`);
            }
        }

        if (errors.length > 0 && results.length === 0) {
            throw new Error(`All uploads failed: ${errors.join(', ')}`);
        }

        return results;
    }

    /**
     * Delete image from Uploadcare
     */
    static async deleteImage(imageId: string): Promise<void> {
        try {
            // Note: The upload client doesn't have a delete method
            // This would typically be handled by a separate management API
            console.warn(
                `Delete functionality not implemented for image ${imageId}`
            );
        } catch (error: any) {
            console.warn(`Failed to delete image ${imageId}:`, error.message);
            // Don't throw error for delete failures as the image might already be deleted
        }
    }

    /**
     * Get image info from Uploadcare
     */
    static async getImageInfo(imageId: string): Promise<any> {
        try {
            const client = this.getClient();
            return await client.info(imageId);
        } catch (error: any) {
            throw new Error(`Failed to get image info: ${error.message}`);
        }
    }

    /**
     * Generate optimized CDN URL with transformations
     */
    static generateOptimizedUrl(
        cdnUrl: string,
        options: {
            width?: number;
            height?: number;
            quality?: number;
            format?: 'auto' | 'jpeg' | 'png' | 'webp';
            crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
        } = {}
    ): string {
        if (!cdnUrl) return '';

        const transformations: string[] = [];

        if (options.width || options.height) {
            const resize = `resize/${options.width || ''}x${options.height || ''}`;
            transformations.push(resize);
        }

        if (options.quality) {
            transformations.push(`quality/${options.quality}`);
        }

        if (options.format) {
            transformations.push(`format/${options.format}`);
        }

        if (options.crop) {
            transformations.push(`crop/${options.crop}`);
        }

        if (transformations.length === 0) {
            return cdnUrl;
        }

        // Insert transformations before the file UUID
        // Uploadcare URL format: https://ucarecdn.com/uuid/
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const parts = cdnUrl.split('/');
        const uuidIndex = parts.findIndex((part) => uuidRegex.test(part));

        if (uuidIndex !== -1) {
            parts.splice(uuidIndex, 0, '-', ...transformations);
            return parts.join('/');
        }

        // Fallback: if no UUID found, append transformations at the end
        const baseUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
        return `${baseUrl}/-/${transformations.join('/')}/`;
    }
}

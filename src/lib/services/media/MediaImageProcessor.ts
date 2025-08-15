import { MediaItem } from '@/types/media-search';
import { EventImage } from '@/types/event-creation';
import { ImageUploadService } from '../ImageUploadService';
import { extractErrorMessage } from '@/lib/utils/errorUtils';

export interface ProcessingOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    targetSizeKB?: number;
}

export interface ProcessingProgress {
    index: number;
    progress: number;
    item: MediaItem;
    status: 'downloading' | 'processing' | 'uploading' | 'complete' | 'error';
    error?: string;
}

export interface DownloadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface ProcessingError {
    item: MediaItem;
    error: string;
    stage: 'download' | 'processing' | 'upload' | 'validation';
}

export interface ProcessingResult {
    success: EventImage[];
    errors: ProcessingError[];
    totalProcessed: number;
}

export interface CancellationToken {
    isCancelled: boolean;
    cancel: () => void;
}

export class MediaImageProcessor {
    private static readonly DEFAULT_OPTIONS: ProcessingOptions = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'webp',
        targetSizeKB: 500,
    };

    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY = 1000; // 1 second

    /**
     * Process selected media items for use in events
     * Downloads, optimizes, and uploads media to CDN with progress tracking
     */
    static async processSelectedMedia(
        items: MediaItem[],
        onProgress?: (index: number, progress: number, status?: string) => void,
        onItemComplete?: (
            index: number,
            result: EventImage | ProcessingError
        ) => void,
        options: ProcessingOptions = {},
        cancellationToken?: CancellationToken
    ): Promise<ProcessingResult> {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const processedImages: EventImage[] = [];
        const errors: ProcessingError[] = [];

        for (let i = 0; i < items.length; i++) {
            if (cancellationToken?.isCancelled) {
                break;
            }

            const item = items[i];
            onProgress?.(i, 0, 'Starting...');

            try {
                const result = await this.processMediaItem(
                    item,
                    opts,
                    (progress, status) => onProgress?.(i, progress, status),
                    cancellationToken
                );

                result.order = processedImages.length;
                processedImages.push(result);
                onItemComplete?.(i, result);
                onProgress?.(i, 100, 'Complete');
            } catch (error) {
                const processingError: ProcessingError = {
                    item,
                    error: extractErrorMessage(error),
                    stage: 'processing',
                };
                errors.push(processingError);
                onItemComplete?.(i, processingError);
                onProgress?.(i, 0, `Error: ${processingError.error}`);
            }
        }

        return {
            success: processedImages,
            errors,
            totalProcessed: processedImages.length + errors.length,
        };
    }

    /**
     * Process a single media item with retry logic
     */
    private static async processMediaItem(
        item: MediaItem,
        options: ProcessingOptions,
        onProgress?: (progress: number, status?: string) => void,
        cancellationToken?: CancellationToken
    ): Promise<EventImage> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            if (cancellationToken?.isCancelled) {
                throw new Error('Processing cancelled');
            }

            try {
                onProgress?.(
                    0,
                    attempt > 1
                        ? `Retry ${attempt}/${this.MAX_RETRIES}`
                        : 'Starting'
                );

                // Step 1: Download image (0-30%)
                onProgress?.(5, 'Downloading...');
                const blob = await this.downloadWithProgress(
                    item.downloadUrl,
                    (downloadProgress) => {
                        const progress = 5 + (downloadProgress * 25) / 100;
                        onProgress?.(progress, 'Downloading...');
                    },
                    cancellationToken
                );

                if (cancellationToken?.isCancelled) {
                    throw new Error('Processing cancelled');
                }

                // Step 2: Validate downloaded image (30-35%)
                onProgress?.(30, 'Validating...');
                const validation = await this.validateImage(blob);
                if (!validation.isValid) {
                    throw new Error(
                        `Invalid image: ${validation.errors.join(', ')}`
                    );
                }

                // Step 3: Optimize image (35-70%)
                onProgress?.(35, 'Optimizing...');
                const optimizedBlob = await this.optimizeImage(blob, {
                    ...options,
                    onProgress: (optimizeProgress) => {
                        const progress = 35 + (optimizeProgress * 35) / 100;
                        onProgress?.(progress, 'Optimizing...');
                    },
                });

                if (cancellationToken?.isCancelled) {
                    throw new Error('Processing cancelled');
                }

                // Step 4: Upload to CDN (70-100%)
                onProgress?.(70, 'Uploading...');
                const uploadResult = await this.uploadToImageService(
                    optimizedBlob,
                    item,
                    (uploadProgress) => {
                        const progress = 70 + (uploadProgress * 30) / 100;
                        onProgress?.(progress, 'Uploading...');
                    }
                );

                // Step 5: Create EventImage with attribution
                const eventImage: EventImage = {
                    id: uploadResult.id,
                    url: uploadResult.url,
                    cdnUrl: uploadResult.cdnUrl,
                    name: item.title || `${item.providerId}-${item.id}`,
                    size: optimizedBlob.size,
                    mimeType: optimizedBlob.type,
                    order: 0, // Will be set by caller
                    source: 'external',
                    providerId: item.providerId,
                    originalId: item.id,
                    attribution: item.attribution,
                    license: item.license,
                    photographer: item.photographer,
                    downloadedAt: new Date().toISOString(),
                    originalUrl: item.downloadUrl,
                };

                return eventImage;
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                if (
                    cancellationToken?.isCancelled ||
                    attempt === this.MAX_RETRIES
                ) {
                    break;
                }

                // Wait before retry with exponential backoff
                const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
                onProgress?.(0, `Retrying in ${delay / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError || new Error('Processing failed after all retries');
    }

    /**
     * Download image from URL with progress tracking and cancellation support
     */
    static async downloadWithProgress(
        url: string,
        onProgress?: (progress: number) => void,
        cancellationToken?: CancellationToken
    ): Promise<Blob> {
        const controller = new AbortController();

        // Handle cancellation
        if (cancellationToken) {
            const originalCancel = cancellationToken.cancel;
            cancellationToken.cancel = () => {
                controller.abort();
                originalCancel();
            };
        }

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'REVLR-Event-Platform/1.0',
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Download failed: ${response.status} ${response.statusText}`
                );
            }

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            if (!response.body) {
                throw new Error('Response body is empty');
            }

            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let loaded = 0;

            while (true) {
                if (cancellationToken?.isCancelled) {
                    reader.cancel();
                    throw new Error('Download cancelled');
                }

                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                loaded += value.length;

                if (total > 0 && onProgress) {
                    const progress = Math.round((loaded / total) * 100);
                    onProgress(progress);
                }
            }

            // Combine chunks into a single Uint8Array
            const totalLength = chunks.reduce(
                (sum, chunk) => sum + chunk.length,
                0
            );
            const result = new Uint8Array(totalLength);
            let offset = 0;

            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }

            // Determine content type from response or URL
            const contentType =
                response.headers.get('content-type') ||
                this.guessContentType(url);

            return new Blob([result], { type: contentType });
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Download cancelled');
            }
            throw error;
        }
    }

    /**
     * Optimize image for web use with advanced compression and format conversion
     */
    static async optimizeImage(
        blob: Blob,
        options: ProcessingOptions & {
            onProgress?: (progress: number) => void;
        } = {}
    ): Promise<Blob> {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = async () => {
                try {
                    options.onProgress?.(10);

                    // Calculate optimal dimensions
                    const { width, height } = this.calculateOptimalDimensions(
                        img.width,
                        img.height,
                        opts.maxWidth!,
                        opts.maxHeight!
                    );

                    canvas.width = width;
                    canvas.height = height;

                    options.onProgress?.(30);

                    // Configure high-quality rendering
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }

                    options.onProgress?.(60);

                    // Try different formats and qualities to find optimal size
                    const optimizedBlob = await this.findOptimalCompression(
                        canvas,
                        opts,
                        (progress) => options.onProgress?.(60 + progress * 0.4)
                    );

                    options.onProgress?.(100);
                    resolve(optimizedBlob);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () =>
                reject(new Error('Failed to load image for optimization'));
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * Find optimal compression settings to meet target file size
     */
    private static async findOptimalCompression(
        canvas: HTMLCanvasElement,
        options: ProcessingOptions,
        onProgress?: (progress: number) => void
    ): Promise<Blob> {
        const targetSize = (options.targetSizeKB || 500) * 1024;
        const formats =
            options.format === 'webp' && this.supportsWebP()
                ? ['webp', 'jpeg']
                : options.format === 'png'
                  ? ['png', 'jpeg']
                  : ['jpeg'];

        let bestBlob: Blob | null = null;
        let bestScore = Infinity;

        for (let formatIndex = 0; formatIndex < formats.length; formatIndex++) {
            const format = formats[formatIndex];
            const mimeType = `image/${format}`;

            // Try different quality levels
            const qualities =
                format === 'png' ? [1] : [0.9, 0.8, 0.7, 0.6, 0.5];

            for (
                let qualityIndex = 0;
                qualityIndex < qualities.length;
                qualityIndex++
            ) {
                const quality = qualities[qualityIndex];

                const blob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob(resolve, mimeType, quality);
                });

                if (blob) {
                    // Score based on size vs target and quality
                    const sizeScore =
                        Math.abs(blob.size - targetSize) / targetSize;
                    const qualityScore = (1 - quality) * 0.1; // Prefer higher quality
                    const score = sizeScore + qualityScore;

                    if (
                        score < bestScore ||
                        (blob.size <= targetSize && !bestBlob)
                    ) {
                        bestBlob = blob;
                        bestScore = score;
                    }

                    // If we found a good size match, stop searching
                    if (
                        blob.size <= targetSize &&
                        blob.size >= targetSize * 0.8
                    ) {
                        break;
                    }
                }

                const progress =
                    ((formatIndex * qualities.length + qualityIndex + 1) /
                        (formats.length * qualities.length)) *
                    100;
                onProgress?.(progress);
            }
        }

        return (
            bestBlob ||
            (await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else
                            reject(
                                new Error('Failed to create optimized image')
                            );
                    },
                    'image/jpeg',
                    0.8
                );
            }))
        );
    }

    /**
     * Calculate optimal dimensions while maintaining aspect ratio
     */
    private static calculateOptimalDimensions(
        originalWidth: number,
        originalHeight: number,
        maxWidth: number,
        maxHeight: number
    ): { width: number; height: number } {
        const aspectRatio = originalWidth / originalHeight;

        let width = originalWidth;
        let height = originalHeight;

        // Scale down if too large
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        return {
            width: Math.round(width),
            height: Math.round(height),
        };
    }

    /**
     * Upload processed image to the existing ImageUploadService
     */
    private static async uploadToImageService(
        blob: Blob,
        item: MediaItem,
        onProgress?: (progress: number) => void
    ): Promise<EventImage> {
        // Create a File object from the blob
        const fileName = `${item.providerId}-${item.id}.${this.getFileExtension(blob.type)}`;
        const file = new File([blob], fileName, { type: blob.type });

        // Use the existing ImageUploadService
        return await ImageUploadService.uploadImage(file, onProgress);
    }

    /**
     * Validate image format, dimensions, and quality
     */
    static async validateImage(blob: Blob): Promise<{
        isValid: boolean;
        errors: string[];
        metadata: {
            width: number;
            height: number;
            format: string;
            size: number;
        };
    }> {
        const errors: string[] = [];

        // Check file size (max 10MB for processing)
        const maxSize = 10 * 1024 * 1024;
        if (blob.size > maxSize) {
            errors.push(
                `File size ${(blob.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum of 10MB`
            );
        }

        // Check if it's a valid image type
        if (!blob.type.startsWith('image/')) {
            errors.push('File is not a valid image');
            return {
                isValid: false,
                errors,
                metadata: {
                    width: 0,
                    height: 0,
                    format: 'unknown',
                    size: blob.size,
                },
            };
        }

        // Get image dimensions
        const metadata = await this.getImageMetadata(blob);

        // Check minimum dimensions
        if (metadata.width < 100 || metadata.height < 100) {
            errors.push('Image dimensions too small (minimum 100x100px)');
        }

        // Check maximum dimensions
        if (metadata.width > 5000 || metadata.height > 5000) {
            errors.push('Image dimensions too large (maximum 5000x5000px)');
        }

        return {
            isValid: errors.length === 0,
            errors,
            metadata: {
                ...metadata,
                size: blob.size,
            },
        };
    }

    /**
     * Get image metadata (dimensions, format)
     */
    private static async getImageMetadata(blob: Blob): Promise<{
        width: number;
        height: number;
        format: string;
    }> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    format: this.getFormatFromMimeType(blob.type),
                });
                URL.revokeObjectURL(img.src);
            };

            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(
                    new Error('Failed to load image for metadata extraction')
                );
            };

            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * Generate thumbnail from image
     */
    static async generateThumbnail(
        blob: Blob,
        size: { width: number; height: number }
    ): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = size.width;
                canvas.height = size.height;

                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Calculate crop dimensions to maintain aspect ratio
                    const aspectRatio = img.width / img.height;
                    const targetAspectRatio = size.width / size.height;

                    let sourceX = 0,
                        sourceY = 0,
                        sourceWidth = img.width,
                        sourceHeight = img.height;

                    if (aspectRatio > targetAspectRatio) {
                        // Image is wider, crop horizontally
                        sourceWidth = img.height * targetAspectRatio;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else {
                        // Image is taller, crop vertically
                        sourceHeight = img.width / targetAspectRatio;
                        sourceY = (img.height - sourceHeight) / 2;
                    }

                    ctx.drawImage(
                        img,
                        sourceX,
                        sourceY,
                        sourceWidth,
                        sourceHeight,
                        0,
                        0,
                        size.width,
                        size.height
                    );
                }

                canvas.toBlob(
                    (thumbnailBlob) => {
                        if (thumbnailBlob) {
                            resolve(thumbnailBlob);
                        } else {
                            reject(new Error('Failed to generate thumbnail'));
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            };

            img.onerror = () =>
                reject(
                    new Error('Failed to load image for thumbnail generation')
                );
            img.src = URL.createObjectURL(blob);
        });
    }

    /**
     * Create cancellation token for aborting operations
     */
    static createCancellationToken(): CancellationToken {
        let isCancelled = false;

        return {
            get isCancelled() {
                return isCancelled;
            },
            cancel: () => {
                isCancelled = true;
            },
        };
    }

    /**
     * Utility methods
     */
    private static supportsWebP(): boolean {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    private static guessContentType(url: string): string {
        const extension = url.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            case 'gif':
                return 'image/gif';
            default:
                return 'image/jpeg';
        }
    }

    private static getFileExtension(mimeType: string): string {
        switch (mimeType) {
            case 'image/jpeg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/webp':
                return 'webp';
            case 'image/gif':
                return 'gif';
            default:
                return 'jpg';
        }
    }

    private static getFormatFromMimeType(mimeType: string): string {
        return mimeType.split('/')[1] || 'unknown';
    }
}

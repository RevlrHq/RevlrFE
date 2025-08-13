'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { ImageUploadService } from '@src/lib/services/ImageUploadService';
import type { EventImage, ImageUploadOptions } from '@src/types/event-creation';
import { CameraIcon, AddIcon } from '@src/icons';
import { X, AlertCircle, Move, Eye } from 'lucide-react';

interface ImageUploadProps {
    images: EventImage[];
    onImagesChange: (images: EventImage[]) => void;
    maxImages?: number;
    maxFileSize?: number;
    className?: string;
    disabled?: boolean;
    error?: string;
}

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    images = [],
    onImagesChange,
    maxImages = 5,
    maxFileSize = 5 * 1024 * 1024, // 5MB
    className = '',
    disabled = false,
    error,
}) => {
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
        null
    );
    const [previewImage, setPreviewImage] = useState<EventImage | null>(null);

    const uploadOptions: Partial<ImageUploadOptions> = {
        maxFiles: maxImages,
        maxFileSize,
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        compressionQuality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
    };

    // Handle file selection
    const handleFileSelect = useCallback(
        async (files: FileList | File[]) => {
            if (disabled) return;

            const fileArray = Array.from(files);

            // Validate files
            const validation = ImageUploadService.validateImages(
                fileArray,
                images,
                uploadOptions
            );
            if (!validation.isValid) {
                alert(validation.errors.join('\n'));
                return;
            }

            // Create uploading file entries
            const newUploadingFiles: UploadingFile[] = fileArray.map(
                (file, index) => ({
                    id: `uploading_${Date.now()}_${index}`,
                    file,
                    progress: 0,
                })
            );

            setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

            // Upload files
            try {
                await ImageUploadService.uploadImages(
                    fileArray,
                    (fileIndex, progress) => {
                        const uploadingId = newUploadingFiles[fileIndex].id;
                        setUploadingFiles((prev) =>
                            prev.map((uf) =>
                                uf.id === uploadingId ? { ...uf, progress } : uf
                            )
                        );
                    },
                    (fileIndex, image) => {
                        const uploadingId = newUploadingFiles[fileIndex].id;
                        // Remove from uploading and add to images
                        setUploadingFiles((prev) =>
                            prev.filter((uf) => uf.id !== uploadingId)
                        );

                        const newImage = {
                            ...image,
                            order: images.length + fileIndex,
                        };
                        onImagesChange([...images, newImage]);
                    },
                    uploadOptions
                );
            } catch (error: unknown) {
                // Handle upload errors
                const errorMessage =
                    error instanceof Error ? error.message : 'Upload failed';
                setUploadingFiles((prev) =>
                    prev.map((uf) =>
                        newUploadingFiles.some((nuf) => nuf.id === uf.id)
                            ? { ...uf, error: errorMessage }
                            : uf
                    )
                );

                // Remove failed uploads after 3 seconds
                setTimeout(() => {
                    setUploadingFiles((prev) =>
                        prev.filter(
                            (uf) =>
                                !newUploadingFiles.some(
                                    (nuf) => nuf.id === uf.id
                                )
                        )
                    );
                }, 3000);
            }
        },
        [disabled, images, onImagesChange, uploadOptions]
    );

    // Handle drag and drop
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!disabled) {
                setIsDragOver(true);
            }
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            if (disabled) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files);
            }
        },
        [disabled, handleFileSelect]
    );

    // Handle file input change
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files);
            }
            // Reset input value to allow selecting the same file again
            e.target.value = '';
        },
        [handleFileSelect]
    );

    // Handle image deletion
    const handleDeleteImage = useCallback(
        async (imageIndex: number) => {
            const imageToDelete = images[imageIndex];

            try {
                // Delete from Uploadcare
                await ImageUploadService.deleteImage(imageToDelete.id);
            } catch (error) {
                console.warn('Failed to delete image from Uploadcare:', error);
            }

            // Remove from local state
            const newImages = images.filter((_, index) => index !== imageIndex);
            // Reorder remaining images
            const reorderedImages = newImages.map((img, index) => ({
                ...img,
                order: index,
            }));
            onImagesChange(reorderedImages);
        },
        [images, onImagesChange]
    );

    // Handle image reordering
    const handleImageDragStart = useCallback(
        (e: React.DragEvent, index: number) => {
            setDraggedImageIndex(index);
            e.dataTransfer.effectAllowed = 'move';
        },
        []
    );

    const handleImageDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }, []);

    const handleImageDrop = useCallback(
        (e: React.DragEvent, dropIndex: number) => {
            e.preventDefault();

            if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
                setDraggedImageIndex(null);
                return;
            }

            const newImages = [...images];
            const draggedImage = newImages[draggedImageIndex];

            // Remove dragged image
            newImages.splice(draggedImageIndex, 1);
            // Insert at new position
            newImages.splice(dropIndex, 0, draggedImage);

            // Update order
            const reorderedImages = newImages.map((img, index) => ({
                ...img,
                order: index,
            }));
            onImagesChange(reorderedImages);
            setDraggedImageIndex(null);
        },
        [draggedImageIndex, images, onImagesChange]
    );

    // Handle click to select files
    const handleUploadClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    const canAddMore = images.length + uploadingFiles.length < maxImages;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Main upload area */}
            <div
                className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                    isDragOver
                        ? 'border-revlr-primary-blue bg-revlr-primary-blue/5'
                        : error
                          ? 'border-red-500 bg-red-50/50'
                          : theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-bg hover:border-revlr-primary-blue'
                            : 'border-gray-300 bg-gray-50 hover:border-revlr-primary-blue'
                } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
                    images.length === 0 ? 'h-64' : 'h-32'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={canAddMore ? handleUploadClick : undefined}
            >
                <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    multiple
                    className='hidden'
                    onChange={handleInputChange}
                    disabled={disabled}
                />

                <div className='flex h-full flex-col items-center justify-center space-y-3 p-6'>
                    {images.length === 0 ? (
                        <>
                            <div
                                className={`rounded-full p-3 ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-card'
                                        : 'bg-white'
                                }`}
                            >
                                <CameraIcon />
                            </div>
                            <div className='text-center'>
                                <p
                                    className={`font-inter text-lg font-medium ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    Add Event Images
                                </p>
                                <p
                                    className={`mt-1 font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Drag and drop images here, or click to
                                    select
                                </p>
                                <p
                                    className={`mt-1 font-inter text-xs ${
                                        theme === 'dark'
                                            ? 'text-gray-500'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    JPEG, PNG, WebP up to{' '}
                                    {Math.round(maxFileSize / (1024 * 1024))}MB
                                    each
                                </p>
                            </div>
                        </>
                    ) : canAddMore ? (
                        <>
                            <AddIcon />
                            <p
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-600'
                                }`}
                            >
                                Add More Images ({images.length}/{maxImages})
                            </p>
                        </>
                    ) : (
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            Maximum images reached ({maxImages})
                        </p>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className='flex items-center space-x-2 text-red-600'>
                    <AlertCircle className='size-4' />
                    <span className='font-inter text-sm'>{error}</span>
                </div>
            )}

            {/* Uploading files */}
            {uploadingFiles.length > 0 && (
                <div className='space-y-2'>
                    <h4
                        className={`font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Uploading...
                    </h4>
                    {uploadingFiles.map((uploadingFile) => (
                        <div
                            key={uploadingFile.id}
                            className={`rounded-lg border p-3 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className='flex items-center justify-between'>
                                <span
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    {uploadingFile.file.name}
                                </span>
                                <span
                                    className={`font-inter text-xs ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-500'
                                    }`}
                                >
                                    {uploadingFile.progress}%
                                </span>
                            </div>
                            {uploadingFile.error ? (
                                <div className='mt-1 flex items-center space-x-1 text-red-600'>
                                    <AlertCircle className='size-3' />
                                    <span className='font-inter text-xs'>
                                        {uploadingFile.error}
                                    </span>
                                </div>
                            ) : (
                                <div className='mt-2'>
                                    <div
                                        className={`h-1 rounded-full ${
                                            theme === 'dark'
                                                ? 'bg-revlr-dark-border'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        <div
                                            className='h-1 rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple transition-all duration-200'
                                            style={{
                                                width: `${uploadingFile.progress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Uploaded images */}
            {images.length > 0 && (
                <div className='space-y-2'>
                    <h4
                        className={`font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Images ({images.length}/{maxImages})
                    </h4>
                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                                    draggedImageIndex === index
                                        ? 'border-revlr-primary-blue opacity-50'
                                        : theme === 'dark'
                                          ? 'border-revlr-dark-border hover:border-revlr-primary-blue'
                                          : 'border-gray-200 hover:border-revlr-primary-blue'
                                }`}
                                draggable
                                onDragStart={(e) =>
                                    handleImageDragStart(e, index)
                                }
                                onDragOver={handleImageDragOver}
                                onDrop={(e) => handleImageDrop(e, index)}
                            >
                                <img
                                    src={ImageUploadService.generateOptimizedUrl(
                                        image.cdnUrl || image.url,
                                        {
                                            width: 200,
                                            height: 200,
                                            crop: 'center',
                                            format: 'auto',
                                            quality: 80,
                                        }
                                    )}
                                    alt={image.name}
                                    className='size-full object-cover'
                                />

                                {/* Overlay with actions */}
                                <div className='absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                                    <div className='flex h-full items-center justify-center space-x-2'>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewImage(image);
                                            }}
                                            className='rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30'
                                            title='Preview'
                                        >
                                            <Eye className='size-4' />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage(index);
                                            }}
                                            className='rounded-full bg-red-500/80 p-2 text-white transition-colors hover:bg-red-500'
                                            title='Delete'
                                        >
                                            <X className='size-4' />
                                        </button>
                                    </div>
                                </div>

                                {/* Drag handle */}
                                <div className='absolute right-1 top-1 cursor-move rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100'>
                                    <Move className='size-3 text-white' />
                                </div>

                                {/* Order indicator */}
                                <div
                                    className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-xs font-medium text-white ${
                                        index === 0
                                            ? 'bg-revlr-primary-blue'
                                            : 'bg-black/50'
                                    }`}
                                >
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image preview modal */}
            {previewImage && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'>
                    <div className='relative max-h-full max-w-4xl'>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className='absolute -right-4 -top-4 rounded-full bg-white p-2 text-gray-900 shadow-lg hover:bg-gray-100'
                        >
                            <X className='size-5' />
                        </button>
                        <img
                            src={ImageUploadService.generateOptimizedUrl(
                                previewImage.cdnUrl || previewImage.url,
                                {
                                    width: 1200,
                                    format: 'auto',
                                    quality: 90,
                                }
                            )}
                            alt={previewImage.name}
                            className='max-h-full max-w-full rounded-lg object-contain'
                        />
                        <div className='mt-4 text-center'>
                            <p className='font-inter text-sm text-white'>
                                {previewImage.name}
                            </p>
                            <p className='font-inter text-xs text-gray-300'>
                                {(previewImage.size / (1024 * 1024)).toFixed(2)}{' '}
                                MB
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;

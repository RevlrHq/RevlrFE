'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from '@src/lib/ThemeContext';
import { ImageUploadService } from '@src/lib/services/ImageUploadService';
import type { EventImage, ImageUploadOptions } from '@src/types/event-creation';
import { CameraIcon, AddIcon } from '@src/icons';
import { X, AlertCircle, Move, Eye, Search } from 'lucide-react';
import { MediaSearchModal } from './MediaSearchModal';

interface ImageUploadProps {
    images: EventImage[];
    onImagesChange: (images: EventImage[]) => void;
    maxImages?: number;
    maxFileSize?: number;
    className?: string;
    disabled?: boolean;
    error?: string;
    enableMediaSearch?: boolean;
    eventCategory?: string;
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
    enableMediaSearch = true,
    eventCategory,
}) => {
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
        null
    );
    const [previewImage, setPreviewImage] = useState<EventImage | null>(null);
    const [isMediaSearchOpen, setIsMediaSearchOpen] = useState(false);

    // Handle file selection
    const handleFileSelect = useCallback(
        async (files: FileList | File[]) => {
            if (disabled) return;

            const fileArray = Array.from(files);

            const uploadOptions: Partial<ImageUploadOptions> = {
                maxFiles: maxImages,
                maxFileSize,
                acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                compressionQuality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
            };

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
        [disabled, images, onImagesChange, maxImages, maxFileSize]
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

    // Handle media search
    const handleMediaSearchOpen = useCallback(() => {
        if (!disabled) {
            setIsMediaSearchOpen(true);
        }
    }, [disabled]);

    const handleMediaSearchClose = useCallback(() => {
        setIsMediaSearchOpen(false);
    }, []);

    const handleMediaSearchSelect = useCallback(
        (selectedImages: EventImage[]) => {
            // Merge with existing images, respecting the max limit
            const availableSlots = maxImages - images.length;
            const imagesToAdd = selectedImages.slice(0, availableSlots);

            if (imagesToAdd.length > 0) {
                const newImages = [...images, ...imagesToAdd].map(
                    (img, index) => ({
                        ...img,
                        order: index,
                    })
                );
                onImagesChange(newImages);
            }

            setIsMediaSearchOpen(false);
        },
        [images, maxImages, onImagesChange]
    );

    const canAddMore = images.length + uploadingFiles.length < maxImages;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Main upload area */}
            <div className='space-y-4'>
                {/* Upload options when no images */}
                {images.length === 0 ? (
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        {/* Traditional Upload */}
                        <div
                            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                                isDragOver
                                    ? 'border-revlr-primary-blue bg-revlr-primary-blue/5'
                                    : error
                                      ? 'border-red-500 bg-red-50/50'
                                      : theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg hover:border-revlr-primary-blue'
                                        : 'border-gray-300 bg-gray-50 hover:border-revlr-primary-blue'
                            } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} h-48`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={handleUploadClick}
                            role='button'
                            tabIndex={disabled ? -1 : 0}
                            aria-label='Upload images from device'
                            onKeyDown={(e) => {
                                if (
                                    (e.key === 'Enter' || e.key === ' ') &&
                                    !disabled
                                ) {
                                    e.preventDefault();
                                    handleUploadClick();
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/jpeg,image/png,image/webp'
                                multiple
                                className='hidden'
                                onChange={handleInputChange}
                                disabled={disabled}
                                aria-hidden='true'
                            />

                            <div className='flex h-full flex-col items-center justify-center space-y-3 p-6'>
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
                                        className={`font-inter text-base font-medium ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Upload from Device
                                    </p>
                                    <p
                                        className={`mt-1 font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        Drag & drop or click to select
                                    </p>
                                    <p
                                        className={`mt-1 font-inter text-xs ${
                                            theme === 'dark'
                                                ? 'text-gray-500'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        JPEG, PNG, WebP up to{' '}
                                        {Math.round(
                                            maxFileSize / (1024 * 1024)
                                        )}
                                        MB
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Media Search Option */}
                        {enableMediaSearch && (
                            <div
                                className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg hover:border-revlr-primary-blue'
                                        : 'border-gray-300 bg-gray-50 hover:border-revlr-primary-blue'
                                } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} h-48`}
                                onClick={handleMediaSearchOpen}
                                role='button'
                                tabIndex={disabled ? -1 : 0}
                                aria-label='Browse media library'
                                onKeyDown={(e) => {
                                    if (
                                        (e.key === 'Enter' || e.key === ' ') &&
                                        !disabled
                                    ) {
                                        e.preventDefault();
                                        handleMediaSearchOpen();
                                    }
                                }}
                            >
                                <div className='flex h-full flex-col items-center justify-center space-y-3 p-6'>
                                    <div
                                        className={`rounded-full p-3 ${
                                            theme === 'dark'
                                                ? 'bg-revlr-dark-card'
                                                : 'bg-white'
                                        }`}
                                    >
                                        <Search className='size-8 text-revlr-primary-blue' />
                                    </div>
                                    <div className='text-center'>
                                        <p
                                            className={`font-inter text-base font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            Browse Media Library
                                        </p>
                                        <p
                                            className={`mt-1 font-inter text-sm ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Search high-quality stock images
                                        </p>
                                        <p
                                            className={`mt-1 font-inter text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-500'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            From Unsplash, Pexels & more
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Compact upload area when images exist */
                    <div className='flex gap-4'>
                        <div
                            className={`flex-1 rounded-xl border-2 border-dashed transition-all duration-200 ${
                                isDragOver
                                    ? 'border-revlr-primary-blue bg-revlr-primary-blue/5'
                                    : theme === 'dark'
                                      ? 'border-revlr-dark-border bg-revlr-dark-bg hover:border-revlr-primary-blue'
                                      : 'border-gray-300 bg-gray-50 hover:border-revlr-primary-blue'
                            } ${disabled ? 'cursor-not-allowed opacity-50' : canAddMore ? 'cursor-pointer' : ''} h-20`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={canAddMore ? handleUploadClick : undefined}
                            role={canAddMore ? 'button' : undefined}
                            tabIndex={disabled || !canAddMore ? -1 : 0}
                            aria-label={
                                canAddMore
                                    ? 'Upload more images from device'
                                    : undefined
                            }
                            onKeyDown={(e) => {
                                if (
                                    (e.key === 'Enter' || e.key === ' ') &&
                                    !disabled &&
                                    canAddMore
                                ) {
                                    e.preventDefault();
                                    handleUploadClick();
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/jpeg,image/png,image/webp'
                                multiple
                                className='hidden'
                                onChange={handleInputChange}
                                disabled={disabled}
                                aria-hidden='true'
                            />

                            <div className='flex h-full items-center justify-center space-x-3 p-4'>
                                {canAddMore ? (
                                    <>
                                        <AddIcon />
                                        <div>
                                            <p
                                                className={`font-inter text-sm font-medium ${
                                                    theme === 'dark'
                                                        ? 'text-gray-300'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Upload More ({images.length}/
                                                {maxImages})
                                            </p>
                                        </div>
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

                        {/* Media Search Button */}
                        {enableMediaSearch && canAddMore && (
                            <button
                                onClick={handleMediaSearchOpen}
                                disabled={disabled}
                                className={`rounded-xl border-2 border-dashed px-6 py-4 transition-all duration-200 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-gray-300 hover:border-revlr-primary-blue hover:text-white'
                                        : 'border-gray-300 bg-gray-50 text-gray-600 hover:border-revlr-primary-blue hover:text-gray-900'
                                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                aria-label='Browse media library'
                            >
                                <div className='flex items-center space-x-2'>
                                    <Search className='size-5 text-revlr-primary-blue' />
                                    <span className='whitespace-nowrap font-inter text-sm font-medium'>
                                        Browse Library
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                )}
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
                                <Image
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
                                    width={200}
                                    height={200}
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
                        <Image
                            src={ImageUploadService.generateOptimizedUrl(
                                previewImage.cdnUrl || previewImage.url,
                                {
                                    width: 1200,
                                    format: 'auto',
                                    quality: 90,
                                }
                            )}
                            alt={previewImage.name}
                            width={1200}
                            height={800}
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

            {/* Media Search Modal */}
            {enableMediaSearch && (
                <MediaSearchModal
                    isOpen={isMediaSearchOpen}
                    onClose={handleMediaSearchClose}
                    onSelectMedia={handleMediaSearchSelect}
                    eventCategory={eventCategory}
                    existingImages={images}
                    maxImages={maxImages}
                />
            )}
        </div>
    );
};

export default ImageUpload;

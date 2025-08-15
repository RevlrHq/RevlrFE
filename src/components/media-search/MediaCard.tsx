'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { MediaItem } from '@/types/media-search';
import { Eye, Plus, Check, Info } from 'lucide-react';

interface MediaCardProps {
    item: MediaItem;
    isSelected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    disabled?: boolean;
    index?: number;
    className?: string;
    'aria-label'?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
    item,
    isSelected,
    onSelect,
    onPreview,
    disabled = false,
    className = '',
    'aria-label': ariaLabel,
}) => {
    const { theme } = useTheme();
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isImageError, setIsImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Handle image loading states
    const handleImageLoad = useCallback(() => {
        setIsImageLoaded(true);
        setIsImageError(false);
    }, []);

    const handleImageError = useCallback(() => {
        setIsImageError(true);
        setIsImageLoaded(false);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (disabled) return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    onSelect();
                    break;
                case 'p':
                case 'P':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onPreview();
                    }
                    break;
            }
        },
        [disabled, onSelect, onPreview]
    );

    // Lazy loading intersection observer
    useEffect(() => {
        if (!imageRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && imageRef.current) {
                    // Start loading the image
                    const img = imageRef.current;
                    if (!img.src && item.thumbnailUrl) {
                        img.src = item.thumbnailUrl;
                    }
                }
            },
            {
                rootMargin: '50px', // Start loading 50px before coming into view
                threshold: 0.1,
            }
        );

        observer.observe(imageRef.current);

        return () => observer.disconnect();
    }, [item.thumbnailUrl]);

    // Get provider badge color
    const getProviderBadgeColor = useCallback((providerId: string) => {
        switch (providerId.toLowerCase()) {
            case 'unsplash':
                return 'bg-black/70 text-white';
            case 'pexels':
                return 'bg-green-600/70 text-white';
            case 'pixabay':
                return 'bg-blue-600/70 text-white';
            default:
                return 'bg-gray-600/70 text-white';
        }
    }, []);

    // Format file size
    const formatFileSize = useCallback((bytes?: number) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    }, []);

    // Get image dimensions text
    const getDimensionsText = useCallback(() => {
        if (item.width && item.height) {
            return `${item.width} × ${item.height}`;
        }
        return '';
    }, [item.width, item.height]);

    return (
        <div
            ref={cardRef}
            className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-revlr-primary-blue/20 ${
                isSelected
                    ? 'border-revlr-primary-blue shadow-lg ring-2 ring-revlr-primary-blue/20'
                    : 'border-transparent hover:border-revlr-primary-blue/50 hover:shadow-md'
            } ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            tabIndex={disabled ? -1 : 0}
            role='button'
            aria-label={
                ariaLabel ||
                `${item.title} by ${item.photographer?.name || 'Unknown'}`
            }
            onKeyDown={handleKeyDown}
            onClick={disabled ? undefined : onPreview}
        >
            {/* Image Container */}
            <div className='relative size-full'>
                {/* Loading skeleton */}
                {!isImageLoaded && !isImageError && (
                    <div
                        className={`absolute inset-0 animate-pulse ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    >
                        <div className='flex size-full items-center justify-center'>
                            <div className='h-6 w-6 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {isImageError && (
                    <div
                        className={`absolute inset-0 flex items-center justify-center ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    >
                        <div className='text-center'>
                            <div className='mx-auto mb-2 size-8 rounded-full bg-red-100 p-2 dark:bg-red-900/20'>
                                <Info className='size-4 text-red-600 dark:text-red-400' />
                            </div>
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                                Failed to load
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Image */}
                <img
                    ref={imageRef}
                    alt={item.title}
                    className={`size-full object-cover transition-all duration-300 ${
                        isHovered || isFocused ? 'scale-105' : 'scale-100'
                    } ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading='lazy'
                    decoding='async'
                />

                {/* Selection indicator overlay */}
                {isSelected && (
                    <div className='absolute inset-0 bg-revlr-primary-blue/20 ring-2 ring-inset ring-revlr-primary-blue'>
                        <div className='absolute right-2 top-2'>
                            <div className='rounded-full bg-revlr-primary-blue p-1'>
                                <Check className='size-3 text-white' />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hover/Focus Overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200 ${
                    isHovered || isFocused ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {/* Image Info */}
                <div className='absolute bottom-2 left-2 right-2'>
                    <p className='truncate font-inter text-xs font-medium text-white'>
                        {item.title}
                    </p>
                    <div className='flex items-center justify-between'>
                        <p className='truncate font-inter text-xs text-gray-300'>
                            by {item.photographer?.name || 'Unknown'}
                        </p>
                        {item.fileSize && (
                            <span className='font-inter text-xs text-gray-300'>
                                {formatFileSize(item.fileSize)}
                            </span>
                        )}
                    </div>
                    {getDimensionsText() && (
                        <p className='font-inter text-xs text-gray-400'>
                            {getDimensionsText()}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className='absolute right-2 top-2 flex space-x-1'>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPreview();
                        }}
                        disabled={disabled}
                        className='rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'
                        aria-label={`Preview ${item.title}`}
                        title='Preview image'
                    >
                        <Eye className='size-4' />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        disabled={disabled}
                        className={`rounded-full p-2 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isSelected
                                ? 'bg-revlr-primary-blue hover:bg-revlr-primary-blue/80'
                                : 'bg-black/50 hover:bg-revlr-primary-blue'
                        }`}
                        aria-label={
                            isSelected
                                ? `Deselect ${item.title}`
                                : `Select ${item.title}`
                        }
                        title={isSelected ? 'Deselect image' : 'Select image'}
                    >
                        {isSelected ? (
                            <Check className='size-4' />
                        ) : (
                            <Plus className='size-4' />
                        )}
                    </button>
                </div>
            </div>

            {/* Provider Badge */}
            <div className='absolute left-2 top-2'>
                <span
                    className={`rounded px-2 py-1 text-xs font-medium uppercase tracking-wide ${getProviderBadgeColor(
                        item.providerId
                    )}`}
                >
                    {item.providerId}
                </span>
            </div>

            {/* Attribution Indicator */}
            {item.attribution.required && (
                <div className='absolute bottom-2 right-2'>
                    <div
                        className='rounded bg-orange-500/80 px-1.5 py-0.5'
                        title='Attribution required'
                    >
                        <span className='text-xs font-bold text-white'>©</span>
                    </div>
                </div>
            )}

            {/* Media Type Indicator */}
            {item.mediaType === 'video' && (
                <div className='absolute bottom-2 left-2'>
                    <div className='rounded bg-purple-500/80 px-1.5 py-0.5'>
                        <span className='text-xs font-medium text-white'>
                            VIDEO
                        </span>
                    </div>
                </div>
            )}

            {/* Color Indicator */}
            {item.color && (
                <div className='absolute bottom-8 right-2'>
                    <div
                        className='size-4 rounded-full border-2 border-white/50 shadow-sm'
                        style={{ backgroundColor: item.color }}
                        title={`Dominant color: ${item.color}`}
                    />
                </div>
            )}

            {/* Focus indicator for keyboard navigation */}
            {isFocused && (
                <div className='absolute inset-0 rounded-xl ring-2 ring-revlr-primary-blue ring-offset-2 ring-offset-white dark:ring-offset-revlr-dark-bg' />
            )}
        </div>
    );
};

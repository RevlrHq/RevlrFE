'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useAccessibility } from '@src/hooks/useAccessibility';
import { useTouchGestures } from '@src/hooks/useTouchGestures';
import { MediaItem } from '@src/types/media-search';
import { Eye, Plus, Check, Info, Heart, Share2 } from 'lucide-react';

interface AccessibleMediaCardProps {
    item: MediaItem;
    isSelected: boolean;
    onSelect: () => void;
    onPreview: () => void;
    onFavorite?: () => void;
    onShare?: () => void;
    disabled?: boolean;
    index?: number;
    totalItems?: number;
    className?: string;
    isFavorited?: boolean;
    showActions?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export const AccessibleMediaCard: React.FC<AccessibleMediaCardProps> = ({
    item,
    isSelected,
    onSelect,
    onPreview,
    onFavorite,
    onShare,
    disabled = false,
    index = 0,
    totalItems = 0,
    className = '',
    isFavorited = false,
    showActions = true,
    size = 'medium',
}) => {
    const { theme } = useTheme();
    const accessibility = useAccessibility();
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isImageError, setIsImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Touch gestures
    const touchGestures = useTouchGestures({
        onDoubleTap: () => {
            onSelect();
            // Provide haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
        },
        onLongPress: () => {
            if (onPreview) {
                onPreview();
                // Provide haptic feedback
                if ('vibrate' in navigator) {
                    navigator.vibrate([50, 50, 50]);
                }
            }
        },
        enableDoubleTap: true,
        enableLongPress: true,
        longPressDelay: 500,
    });

    // Attach touch gestures
    useEffect(() => {
        if (cardRef.current) {
            return touchGestures.attachGestureListeners(cardRef.current);
        }
    }, [touchGestures]);

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
                    accessibility.announce(
                        isSelected
                            ? `Deselected ${item.title}`
                            : `Selected ${item.title}`
                    );
                    break;
                case 'p':
                case 'P':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        onPreview();
                        accessibility.announce(`Previewing ${item.title}`);
                    }
                    break;
                case 'f':
                case 'F':
                    if (onFavorite && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        onFavorite();
                        accessibility.announce(
                            isFavorited
                                ? `Removed ${item.title} from favorites`
                                : `Added ${item.title} to favorites`
                        );
                    }
                    break;
                case 's':
                case 'S':
                    if (onShare && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        onShare();
                        accessibility.announce(`Sharing ${item.title}`);
                    }
                    break;
                case 'i':
                case 'I':
                    e.preventDefault();
                    setShowTooltip(!showTooltip);
                    break;
            }
        },
        [
            disabled,
            onSelect,
            onPreview,
            onFavorite,
            onShare,
            item.title,
            isSelected,
            isFavorited,
            showTooltip,
            accessibility,
        ]
    );

    // Handle focus events
    const handleFocus = useCallback(() => {
        setIsFocused(true);
        accessibility.announce(
            `Image ${index + 1} of ${totalItems}: ${item.title} by ${item.photographer?.name || 'Unknown'}. ${
                isSelected ? 'Selected' : 'Not selected'
            }`
        );
    }, [
        index,
        totalItems,
        item.title,
        item.photographer?.name,
        isSelected,
        accessibility,
    ]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        setShowTooltip(false);
    }, []);

    // Handle mouse events
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
        tooltipTimeoutRef.current = setTimeout(() => {
            setShowTooltip(true);
        }, 1000);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setShowTooltip(false);
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
    }, []);

    // Lazy loading intersection observer
    useEffect(() => {
        if (!imageRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && imageRef.current) {
                    const img = imageRef.current;
                    if (!img.src && item.thumbnailUrl) {
                        img.src = item.thumbnailUrl;
                    }
                }
            },
            {
                rootMargin: '50px',
                threshold: 0.1,
            }
        );

        observer.observe(imageRef.current);
        return () => observer.disconnect();
    }, [item.thumbnailUrl]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
        };
    }, []);

    // Get size classes
    const getSizeClasses = useCallback(() => {
        switch (size) {
            case 'small':
                return 'aspect-square w-24 h-24';
            case 'large':
                return 'aspect-square w-48 h-48';
            default:
                return 'aspect-square w-32 h-32 sm:w-36 sm:h-36';
        }
    }, [size]);

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

    // Create ARIA label
    const getAriaLabel = useCallback(() => {
        const parts = [
            `Image ${index + 1} of ${totalItems}`,
            item.title,
            `by ${item.photographer?.name || 'Unknown'}`,
            `from ${item.providerId}`,
            isSelected ? 'Selected' : 'Not selected',
        ];

        if (item.width && item.height) {
            parts.push(`${item.width} by ${item.height} pixels`);
        }

        if (item.fileSize) {
            parts.push(formatFileSize(item.fileSize));
        }

        return parts.join(', ');
    }, [index, totalItems, item, isSelected, formatFileSize]);

    return (
        <div
            ref={cardRef}
            className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-200 focus-within:ring-2 focus-within:ring-revlr-primary-blue/20 ${getSizeClasses()} ${
                isSelected
                    ? 'border-revlr-primary-blue shadow-lg ring-2 ring-revlr-primary-blue/20'
                    : 'border-transparent hover:border-revlr-primary-blue/50 hover:shadow-md'
            } ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${
                accessibility.state.isReducedMotion ? 'transition-none' : ''
            } ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            tabIndex={disabled ? -1 : 0}
            role='button'
            aria-label={getAriaLabel()}
            aria-describedby={showTooltip ? `tooltip-${item.id}` : undefined}
            onKeyDown={handleKeyDown}
            onClick={disabled ? undefined : onSelect}
            {...accessibility.getAriaAttributes(
                getAriaLabel(),
                showTooltip ? `tooltip-${item.id}` : undefined,
                undefined,
                isSelected,
                disabled
            )}
        >
            {/* Image Container */}
            <div className='relative size-full'>
                {/* Loading skeleton */}
                {!isImageLoaded && !isImageError && (
                    <div
                        className={`absolute inset-0 ${
                            accessibility.state.isReducedMotion
                                ? ''
                                : 'animate-pulse'
                        } ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    >
                        <div className='flex size-full items-center justify-center'>
                            <div
                                className={`h-6 w-6 rounded-full border-b-2 border-revlr-primary-blue ${
                                    accessibility.state.isReducedMotion
                                        ? ''
                                        : 'animate-spin'
                                }`}
                            />
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
                        accessibility.state.isReducedMotion
                            ? ''
                            : isHovered || isFocused
                              ? 'scale-105'
                              : 'scale-100'
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

                {/* Focus indicator */}
                {isFocused && (
                    <div className='absolute inset-0 rounded-xl ring-2 ring-revlr-primary-blue ring-offset-2 ring-offset-white dark:ring-offset-revlr-dark-bg' />
                )}
            </div>

            {/* Hover/Focus Overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200 ${
                    accessibility.state.isReducedMotion ? 'transition-none' : ''
                } ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}`}
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
                {showActions && (
                    <div className='absolute right-2 top-2 flex flex-col space-y-1'>
                        {/* Preview Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview();
                            }}
                            disabled={disabled}
                            className='rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'
                            {...accessibility.createButtonProps(
                                `Preview ${item.title}`,
                                () => onPreview(),
                                { disabled }
                            )}
                            title='Preview image (P)'
                        >
                            <Eye className='size-3' />
                        </button>

                        {/* Favorite Button */}
                        {onFavorite && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFavorite();
                                }}
                                disabled={disabled}
                                className={`rounded-full p-2 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isFavorited
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-black/50 hover:bg-black/70'
                                }`}
                                {...accessibility.createButtonProps(
                                    isFavorited
                                        ? `Remove ${item.title} from favorites`
                                        : `Add ${item.title} to favorites`,
                                    () => onFavorite(),
                                    { disabled, pressed: isFavorited }
                                )}
                                title={`${isFavorited ? 'Remove from' : 'Add to'} favorites (Ctrl+F)`}
                            >
                                <Heart
                                    className={`size-3 ${isFavorited ? 'fill-current' : ''}`}
                                />
                            </button>
                        )}

                        {/* Share Button */}
                        {onShare && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare();
                                }}
                                disabled={disabled}
                                className='rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'
                                {...accessibility.createButtonProps(
                                    `Share ${item.title}`,
                                    () => onShare(),
                                    { disabled }
                                )}
                                title='Share image (Ctrl+S)'
                            >
                                <Share2 className='size-3' />
                            </button>
                        )}

                        {/* Select Button */}
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
                            {...accessibility.createButtonProps(
                                isSelected
                                    ? `Deselect ${item.title}`
                                    : `Select ${item.title}`,
                                () => onSelect(),
                                { disabled, pressed: isSelected }
                            )}
                            title={`${isSelected ? 'Deselect' : 'Select'} image (Enter/Space)`}
                        >
                            {isSelected ? (
                                <Check className='size-3' />
                            ) : (
                                <Plus className='size-3' />
                            )}
                        </button>
                    </div>
                )}
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

            {/* Tooltip */}
            {showTooltip && (
                <div
                    id={`tooltip-${item.id}`}
                    className={`absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg border p-3 shadow-lg ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                            : 'border-gray-200 bg-white text-gray-900'
                    }`}
                    role='tooltip'
                >
                    <div className='space-y-2'>
                        <div>
                            <p className='font-inter text-sm font-medium'>
                                {item.title}
                            </p>
                            <p className='font-inter text-xs text-gray-500 dark:text-gray-400'>
                                by {item.photographer?.name || 'Unknown'}
                            </p>
                        </div>

                        {(item.width || item.height || item.fileSize) && (
                            <div className='border-t pt-2 dark:border-gray-600'>
                                {getDimensionsText() && (
                                    <p className='font-inter text-xs text-gray-600 dark:text-gray-300'>
                                        Dimensions: {getDimensionsText()}
                                    </p>
                                )}
                                {item.fileSize && (
                                    <p className='font-inter text-xs text-gray-600 dark:text-gray-300'>
                                        Size: {formatFileSize(item.fileSize)}
                                    </p>
                                )}
                            </div>
                        )}

                        {item.tags && item.tags.length > 0 && (
                            <div className='border-t pt-2 dark:border-gray-600'>
                                <p className='font-inter text-xs text-gray-600 dark:text-gray-300'>
                                    Tags: {item.tags.slice(0, 3).join(', ')}
                                    {item.tags.length > 3 && '...'}
                                </p>
                            </div>
                        )}

                        <div className='border-t pt-2 dark:border-gray-600'>
                            <p className='font-inter text-xs text-gray-500 dark:text-gray-400'>
                                Press 'i' to toggle this info
                            </p>
                        </div>
                    </div>

                    {/* Tooltip arrow */}
                    <div
                        className={`absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    />
                </div>
            )}
        </div>
    );
};

export default AccessibleMediaCard;

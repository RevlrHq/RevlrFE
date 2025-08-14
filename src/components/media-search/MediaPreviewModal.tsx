'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { MediaItem } from '@/types/media-search';
import { EventCreationData } from '@/types/event-creation';
import {
    X,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Download,
    Info,
    Heart,
    Share2,
    ExternalLink,
    Check,
    Plus,
    AlertTriangle,
    Eye,
    Calendar,
    MapPin,
    User,
} from 'lucide-react';

interface MediaPreviewModalProps {
    item: MediaItem;
    isSelected: boolean;
    onClose: () => void;
    onSelect: () => void;
    onDeselect?: () => void;
    eventData?: EventCreationData;
    disabled?: boolean;
    maxSelections?: number;
    currentSelectionCount?: number;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
    item,
    isSelected,
    onClose,
    onSelect,
    onDeselect,
    eventData,
    disabled = false,
    maxSelections = 10,
    currentSelectionCount = 0,
}) => {
    const { theme } = useTheme();
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isImageError, setIsImageError] = useState(false);
    const [showMetadata, setShowMetadata] = useState(true);
    const [activeTab, setActiveTab] = useState<
        'metadata' | 'context' | 'attribution'
    >('metadata');
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    handleToggleSelection();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    handleZoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    handleZoomOut();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    handleRotate();
                    break;
                case '0':
                    e.preventDefault();
                    handleResetView();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    setShowMetadata(!showMetadata);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [disabled, onClose, isSelected, zoom, rotation, showMetadata]);

    // Image loading handlers
    const handleImageLoad = useCallback(() => {
        setIsImageLoaded(true);
        setIsImageError(false);
    }, []);

    const handleImageError = useCallback(() => {
        setIsImageError(true);
        setIsImageLoaded(false);
    }, []);

    // Zoom and rotation handlers
    const handleZoomIn = useCallback(() => {
        setZoom((prev) => Math.min(prev * 1.2, 5));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((prev) => Math.max(prev / 1.2, 0.1));
    }, []);

    const handleRotate = useCallback(() => {
        setRotation((prev) => (prev + 90) % 360);
    }, []);

    const handleResetView = useCallback(() => {
        setZoom(1);
        setRotation(0);
    }, []);

    // Selection handlers
    const handleToggleSelection = useCallback(() => {
        if (isSelected) {
            onDeselect?.();
        } else {
            onSelect();
        }
    }, [isSelected, onSelect, onDeselect]);

    // Format file size
    const formatFileSize = useCallback((bytes?: number) => {
        if (!bytes) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    }, []);

    // Get aspect ratio
    const getAspectRatio = useCallback(() => {
        if (!item.width || !item.height) return 'Unknown';
        const gcd = (a: number, b: number): number =>
            b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(item.width, item.height);
        return `${item.width / divisor}:${item.height / divisor}`;
    }, [item.width, item.height]);

    // Get provider info
    const getProviderInfo = useCallback(() => {
        switch (item.providerId.toLowerCase()) {
            case 'unsplash':
                return {
                    name: 'Unsplash',
                    color: 'bg-black',
                    website: 'https://unsplash.com',
                };
            case 'pexels':
                return {
                    name: 'Pexels',
                    color: 'bg-green-600',
                    website: 'https://pexels.com',
                };
            case 'pixabay':
                return {
                    name: 'Pixabay',
                    color: 'bg-blue-600',
                    website: 'https://pixabay.com',
                };
            default:
                return {
                    name: item.providerId,
                    color: 'bg-gray-600',
                    website: '#',
                };
        }
    }, [item.providerId]);

    // Check if selection is at limit
    const isAtSelectionLimit =
        currentSelectionCount >= maxSelections && !isSelected;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4'>
            <div className='relative flex h-full max-h-[95vh] w-full max-w-7xl overflow-hidden rounded-xl bg-white dark:bg-revlr-dark-card'>
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={disabled}
                    className='absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50'
                    aria-label='Close preview'
                >
                    <X className='size-5' />
                </button>

                {/* Image preview area */}
                <div
                    ref={containerRef}
                    className='relative flex flex-1 items-center justify-center overflow-hidden bg-gray-100 dark:bg-revlr-dark-bg'
                >
                    {/* Loading state */}
                    {!isImageLoaded && !isImageError && (
                        <div className='flex items-center justify-center'>
                            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                        </div>
                    )}

                    {/* Error state */}
                    {isImageError && (
                        <div className='text-center'>
                            <div className='mx-auto mb-4 size-16 rounded-full bg-red-100 p-4 dark:bg-red-900/20'>
                                <AlertTriangle className='size-8 text-red-600 dark:text-red-400' />
                            </div>
                            <p className='text-lg font-medium text-gray-900 dark:text-white'>
                                Failed to load image
                            </p>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>
                                The image could not be loaded from the provider
                            </p>
                        </div>
                    )}

                    {/* Main image */}
                    {!isImageError && (
                        <img
                            ref={imageRef}
                            src={item.previewUrl}
                            alt={item.title}
                            className={`max-h-full max-w-full object-contain transition-all duration-300 ${
                                isImageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transformOrigin: 'center',
                            }}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            draggable={false}
                        />
                    )}

                    {/* Image controls */}
                    <div className='absolute bottom-4 left-4 flex space-x-2'>
                        <div className='flex rounded-lg bg-black/50 p-1'>
                            <button
                                onClick={handleZoomOut}
                                disabled={disabled || zoom <= 0.1}
                                className='rounded p-2 text-white hover:bg-white/20 disabled:opacity-50'
                                title='Zoom out (-)'
                            >
                                <ZoomOut className='size-4' />
                            </button>
                            <button
                                onClick={handleResetView}
                                disabled={disabled}
                                className='rounded px-3 py-2 text-white hover:bg-white/20'
                                title='Reset view (0)'
                            >
                                {Math.round(zoom * 100)}%
                            </button>
                            <button
                                onClick={handleZoomIn}
                                disabled={disabled || zoom >= 5}
                                className='rounded p-2 text-white hover:bg-white/20 disabled:opacity-50'
                                title='Zoom in (+)'
                            >
                                <ZoomIn className='size-4' />
                            </button>
                        </div>
                        <button
                            onClick={handleRotate}
                            disabled={disabled}
                            className='rounded-lg bg-black/50 p-2 text-white hover:bg-black/70'
                            title='Rotate (R)'
                        >
                            <RotateCw className='size-4' />
                        </button>
                    </div>

                    {/* Toggle metadata button */}
                    <button
                        onClick={() => setShowMetadata(!showMetadata)}
                        className='absolute bottom-4 right-4 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70'
                        title='Toggle metadata (M)'
                    >
                        <Info className='size-4' />
                    </button>
                </div>

                {/* Metadata sidebar */}
                {showMetadata && (
                    <div className='flex w-96 flex-col border-l border-gray-200 bg-white dark:border-revlr-dark-border dark:bg-revlr-dark-card'>
                        {/* Header */}
                        <div className='border-b border-gray-200 p-6 dark:border-revlr-dark-border'>
                            <h2 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
                                {item.title}
                            </h2>
                            {item.photographer && (
                                <div className='flex items-center space-x-2'>
                                    <User className='size-4 text-gray-500' />
                                    <span className='text-sm text-gray-600 dark:text-gray-300'>
                                        by {item.photographer.name}
                                    </span>
                                    {item.photographer.profileUrl && (
                                        <a
                                            href={item.photographer.profileUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='text-revlr-primary-blue hover:underline'
                                        >
                                            <ExternalLink className='size-3' />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className='border-b border-gray-200 dark:border-revlr-dark-border'>
                            <nav className='flex'>
                                {[
                                    { id: 'metadata', label: 'Details' },
                                    { id: 'context', label: 'Preview' },
                                    { id: 'attribution', label: 'License' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() =>
                                            setActiveTab(tab.id as any)
                                        }
                                        className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-revlr-primary-blue text-revlr-primary-blue'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab content */}
                        <div className='flex-1 overflow-y-auto p-6'>
                            {activeTab === 'metadata' && (
                                <MediaMetadataPanel item={item} />
                            )}
                            {activeTab === 'context' && (
                                <EventContextPreview
                                    item={item}
                                    eventData={eventData}
                                />
                            )}
                            {activeTab === 'attribution' && (
                                <AttributionPanel item={item} />
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className='border-t border-gray-200 p-6 dark:border-revlr-dark-border'>
                            <div className='space-y-3'>
                                {isAtSelectionLimit && (
                                    <div className='rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20'>
                                        <p className='text-sm text-orange-800 dark:text-orange-200'>
                                            Maximum of {maxSelections} images
                                            can be selected
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleToggleSelection}
                                    disabled={disabled || isAtSelectionLimit}
                                    className={`w-full rounded-xl px-4 py-3 font-inter font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isSelected
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple hover:opacity-90'
                                    }`}
                                >
                                    <div className='flex items-center justify-center space-x-2'>
                                        {isSelected ? (
                                            <>
                                                <Check className='size-4' />
                                                <span>Selected</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className='size-4' />
                                                <span>Select This Image</span>
                                            </>
                                        )}
                                    </div>
                                </button>

                                <button
                                    onClick={onClose}
                                    disabled={disabled}
                                    className='w-full rounded-xl border border-gray-300 px-4 py-3 font-inter font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-revlr-dark-border dark:text-gray-200 dark:hover:bg-revlr-dark-border'
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Metadata Panel Component
interface MediaMetadataPanelProps {
    item: MediaItem;
}

const MediaMetadataPanel: React.FC<MediaMetadataPanelProps> = ({ item }) => {
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Unknown';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    };

    const getAspectRatio = () => {
        if (!item.width || !item.height) return 'Unknown';
        const gcd = (a: number, b: number): number =>
            b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(item.width, item.height);
        return `${item.width / divisor}:${item.height / divisor}`;
    };

    const getProviderInfo = () => {
        switch (item.providerId.toLowerCase()) {
            case 'unsplash':
                return {
                    name: 'Unsplash',
                    color: 'bg-black',
                    website: 'https://unsplash.com',
                };
            case 'pexels':
                return {
                    name: 'Pexels',
                    color: 'bg-green-600',
                    website: 'https://pexels.com',
                };
            case 'pixabay':
                return {
                    name: 'Pixabay',
                    color: 'bg-blue-600',
                    website: 'https://pixabay.com',
                };
            default:
                return {
                    name: item.providerId,
                    color: 'bg-gray-600',
                    website: '#',
                };
        }
    };

    const providerInfo = getProviderInfo();

    return (
        <div className='space-y-4'>
            {/* Basic info */}
            <div className='space-y-3'>
                <div className='flex justify-between'>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Dimensions:
                    </span>
                    <span className='text-sm font-medium text-gray-900 dark:text-white'>
                        {item.width} × {item.height}
                    </span>
                </div>

                <div className='flex justify-between'>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Aspect Ratio:
                    </span>
                    <span className='text-sm font-medium text-gray-900 dark:text-white'>
                        {getAspectRatio()}
                    </span>
                </div>

                {item.fileSize && (
                    <div className='flex justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                            File Size:
                        </span>
                        <span className='text-sm font-medium text-gray-900 dark:text-white'>
                            {formatFileSize(item.fileSize)}
                        </span>
                    </div>
                )}

                <div className='flex justify-between'>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Type:
                    </span>
                    <span className='text-sm font-medium capitalize text-gray-900 dark:text-white'>
                        {item.mediaType}
                    </span>
                </div>

                <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Provider:
                    </span>
                    <div className='flex items-center space-x-2'>
                        <span
                            className={`rounded px-2 py-1 text-xs font-medium text-white ${providerInfo.color}`}
                        >
                            {providerInfo.name}
                        </span>
                        <a
                            href={providerInfo.website}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-revlr-primary-blue hover:underline'
                        >
                            <ExternalLink className='size-3' />
                        </a>
                    </div>
                </div>
            </div>

            {/* Color info */}
            {item.color && (
                <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600 dark:text-gray-400'>
                        Dominant Color:
                    </span>
                    <div className='flex items-center space-x-2'>
                        <div
                            className='size-6 rounded border border-gray-300 dark:border-gray-600'
                            style={{ backgroundColor: item.color }}
                        />
                        <span className='text-sm font-medium text-gray-900 dark:text-white'>
                            {item.color}
                        </span>
                    </div>
                </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
                <div>
                    <span className='mb-2 block text-sm text-gray-600 dark:text-gray-400'>
                        Tags:
                    </span>
                    <div className='flex flex-wrap gap-1'>
                        {item.tags.slice(0, 10).map((tag, index) => (
                            <span
                                key={index}
                                className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-revlr-dark-border dark:text-gray-300'
                            >
                                {tag}
                            </span>
                        ))}
                        {item.tags.length > 10 && (
                            <span className='rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-revlr-dark-border dark:text-gray-400'>
                                +{item.tags.length - 10} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Description */}
            {item.description && (
                <div>
                    <span className='mb-2 block text-sm text-gray-600 dark:text-gray-400'>
                        Description:
                    </span>
                    <p className='text-sm text-gray-900 dark:text-white'>
                        {item.description}
                    </p>
                </div>
            )}
        </div>
    );
};

// Event Context Preview Component
interface EventContextPreviewProps {
    item: MediaItem;
    eventData?: EventCreationData;
}

const EventContextPreview: React.FC<EventContextPreviewProps> = ({
    item,
    eventData,
}) => {
    if (!eventData) {
        return (
            <div className='py-8 text-center'>
                <Eye className='mx-auto mb-4 size-12 text-gray-400' />
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                    No event data available for preview
                </p>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div>
                <h3 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                    How this will appear in your event
                </h3>

                {/* Event card preview */}
                <div className='overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-revlr-dark-border dark:bg-revlr-dark-bg'>
                    {/* Event image */}
                    <div className='relative aspect-video overflow-hidden bg-gray-100 dark:bg-revlr-dark-border'>
                        <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className='h-full w-full object-cover'
                        />
                        {/* Attribution overlay if required */}
                        {item.attribution.required && (
                            <div className='absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white'>
                                ©{' '}
                                {item.photographer?.name ||
                                    'Attribution required'}
                            </div>
                        )}
                    </div>

                    {/* Event details */}
                    <div className='p-4'>
                        <h4 className='mb-2 font-semibold text-gray-900 dark:text-white'>
                            {eventData.eventName || 'Your Event Name'}
                        </h4>

                        <div className='space-y-2 text-sm text-gray-600 dark:text-gray-300'>
                            {eventData.dateRange && (
                                <div className='flex items-center space-x-2'>
                                    <Calendar className='size-4' />
                                    <span>
                                        {new Date(
                                            eventData.dateRange.startDate
                                        ).toLocaleDateString()}
                                        {eventData.dateRange.endDate !==
                                            eventData.dateRange.startDate &&
                                            ` - ${new Date(eventData.dateRange.endDate).toLocaleDateString()}`}
                                    </span>
                                </div>
                            )}

                            {eventData.locationDetails?.venueName && (
                                <div className='flex items-center space-x-2'>
                                    <MapPin className='size-4' />
                                    <span>
                                        {eventData.locationDetails.venueName}
                                    </span>
                                </div>
                            )}

                            {eventData.organizerName && (
                                <div className='flex items-center space-x-2'>
                                    <User className='size-4' />
                                    <span>by {eventData.organizerName}</span>
                                </div>
                            )}
                        </div>

                        {eventData.eventDescription && (
                            <p className='mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300'>
                                {eventData.eventDescription}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Image quality assessment */}
            <div>
                <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                    Image Quality Assessment
                </h4>

                <div className='space-y-3'>
                    {/* Resolution check */}
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                            Resolution:
                        </span>
                        <div className='flex items-center space-x-2'>
                            {item.width >= 1200 && item.height >= 630 ? (
                                <>
                                    <div className='size-2 rounded-full bg-green-500'></div>
                                    <span className='text-sm text-green-600 dark:text-green-400'>
                                        Excellent
                                    </span>
                                </>
                            ) : item.width >= 800 && item.height >= 400 ? (
                                <>
                                    <div className='size-2 rounded-full bg-yellow-500'></div>
                                    <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                                        Good
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className='size-2 rounded-full bg-red-500'></div>
                                    <span className='text-sm text-red-600 dark:text-red-400'>
                                        Low
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Aspect ratio check */}
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                            Aspect Ratio:
                        </span>
                        <div className='flex items-center space-x-2'>
                            {item.width &&
                            item.height &&
                            Math.abs(item.width / item.height - 16 / 9) <
                                0.1 ? (
                                <>
                                    <div className='size-2 rounded-full bg-green-500'></div>
                                    <span className='text-sm text-green-600 dark:text-green-400'>
                                        Perfect for events
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className='size-2 rounded-full bg-yellow-500'></div>
                                    <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                                        Will be cropped
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* File size check */}
                    {item.fileSize && (
                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                File Size:
                            </span>
                            <div className='flex items-center space-x-2'>
                                {item.fileSize < 5 * 1024 * 1024 ? (
                                    <>
                                        <div className='size-2 rounded-full bg-green-500'></div>
                                        <span className='text-sm text-green-600 dark:text-green-400'>
                                            Optimized
                                        </span>
                                    </>
                                ) : item.fileSize < 10 * 1024 * 1024 ? (
                                    <>
                                        <div className='size-2 rounded-full bg-yellow-500'></div>
                                        <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                                            Large
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className='size-2 rounded-full bg-red-500'></div>
                                        <span className='text-sm text-red-600 dark:text-red-400'>
                                            Very large
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Recommendations */}
                {(item.width < 1200 || item.height < 630) && (
                    <div className='mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20'>
                        <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                            <strong>Recommendation:</strong> This image may
                            appear pixelated on larger screens. Consider
                            selecting a higher resolution image for better
                            quality.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Attribution Panel Component
interface AttributionPanelProps {
    item: MediaItem;
}

const AttributionPanel: React.FC<AttributionPanelProps> = ({ item }) => {
    const getLicenseInfo = () => {
        switch (item.license.type) {
            case 'cc0':
                return {
                    name: 'Creative Commons Zero (CC0)',
                    description:
                        'No rights reserved. You can use this image for any purpose without attribution.',
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                };
            case 'unsplash':
                return {
                    name: 'Unsplash License',
                    description:
                        'Free to use for commercial and non-commercial purposes. Attribution appreciated but not required.',
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                };
            case 'pexels':
                return {
                    name: 'Pexels License',
                    description:
                        'Free to use for commercial and non-commercial purposes. Attribution not required but appreciated.',
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                };
            case 'pixabay-standard':
                return {
                    name: 'Pixabay License',
                    description:
                        'Free for commercial use. Attribution not required but appreciated.',
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                };
            default:
                return {
                    name: item.license.name,
                    description:
                        'Please review the license terms before using this image.',
                    color: 'text-gray-600 dark:text-gray-400',
                    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
                    borderColor: 'border-gray-200 dark:border-gray-800',
                };
        }
    };

    const licenseInfo = getLicenseInfo();

    return (
        <div className='space-y-6'>
            {/* License information */}
            <div>
                <h3 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                    License Information
                </h3>

                <div
                    className={`rounded-lg border p-4 ${licenseInfo.bgColor} ${licenseInfo.borderColor}`}
                >
                    <div className='flex items-start space-x-3'>
                        <div className='flex-shrink-0'>
                            {item.license.commercialUse ? (
                                <Check
                                    className={`size-5 ${licenseInfo.color}`}
                                />
                            ) : (
                                <AlertTriangle className='size-5 text-orange-500' />
                            )}
                        </div>
                        <div>
                            <h4 className={`font-medium ${licenseInfo.color}`}>
                                {licenseInfo.name}
                            </h4>
                            <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
                                {licenseInfo.description}
                            </p>
                            {item.license.url && (
                                <a
                                    href={item.license.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='mt-2 inline-flex items-center space-x-1 text-sm text-revlr-primary-blue hover:underline'
                                >
                                    <span>View full license</span>
                                    <ExternalLink className='size-3' />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Commercial use */}
            <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                    Commercial Use:
                </span>
                <div className='flex items-center space-x-2'>
                    {item.license.commercialUse ? (
                        <>
                            <Check className='size-4 text-green-500' />
                            <span className='text-sm text-green-600 dark:text-green-400'>
                                Allowed
                            </span>
                        </>
                    ) : (
                        <>
                            <X className='size-4 text-red-500' />
                            <span className='text-sm text-red-600 dark:text-red-400'>
                                Not allowed
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Attribution requirements */}
            <div>
                <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                    Attribution Requirements
                </h4>

                {item.attribution.required ? (
                    <div className='space-y-3'>
                        <div className='rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20'>
                            <p className='text-sm text-orange-800 dark:text-orange-200'>
                                <strong>Attribution Required:</strong> You must
                                credit the photographer when using this image.
                            </p>
                        </div>

                        {item.attribution.text && (
                            <div>
                                <label className='mb-2 block text-sm text-gray-600 dark:text-gray-400'>
                                    Suggested Attribution:
                                </label>
                                <div className='rounded border bg-gray-50 p-3 font-mono text-sm dark:bg-revlr-dark-border'>
                                    {item.attribution.text}
                                </div>
                            </div>
                        )}

                        <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600 dark:text-gray-400'>
                                Placement:
                            </span>
                            <span className='text-sm font-medium capitalize text-gray-900 dark:text-white'>
                                {item.attribution.placement.replace('-', ' ')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20'>
                        <p className='text-sm text-green-800 dark:text-green-200'>
                            <strong>No Attribution Required:</strong> You can
                            use this image without crediting the photographer,
                            though attribution is always appreciated.
                        </p>
                    </div>
                )}
            </div>

            {/* Restrictions */}
            {item.license.restrictions &&
                item.license.restrictions.length > 0 && (
                    <div>
                        <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                            Usage Restrictions
                        </h4>
                        <ul className='space-y-2'>
                            {item.license.restrictions.map(
                                (restriction, index) => (
                                    <li
                                        key={index}
                                        className='flex items-start space-x-2'
                                    >
                                        <AlertTriangle className='mt-0.5 size-4 flex-shrink-0 text-orange-500' />
                                        <span className='text-sm text-gray-600 dark:text-gray-300'>
                                            {restriction}
                                        </span>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}

            {/* Photographer info */}
            {item.photographer && (
                <div>
                    <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-white'>
                        Photographer
                    </h4>
                    <div className='flex items-center space-x-3'>
                        {item.photographer.avatarUrl && (
                            <img
                                src={item.photographer.avatarUrl}
                                alt={item.photographer.name}
                                className='size-10 rounded-full'
                            />
                        )}
                        <div>
                            <p className='font-medium text-gray-900 dark:text-white'>
                                {item.photographer.name}
                            </p>
                            {item.photographer.profileUrl && (
                                <a
                                    href={item.photographer.profileUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='inline-flex items-center space-x-1 text-sm text-revlr-primary-blue hover:underline'
                                >
                                    <span>View profile</span>
                                    <ExternalLink className='size-3' />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

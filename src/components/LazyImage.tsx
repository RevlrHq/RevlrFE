'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Calendar, Image as ImageIcon } from 'lucide-react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    fallbackSrc?: string;
    placeholder?: React.ReactNode;
    onLoad?: () => void;
    onError?: () => void;
    threshold?: number;
    rootMargin?: string;
    width?: number;
    height?: number;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    priority?: boolean;
    sizes?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = '',
    fallbackSrc,
    placeholder,
    onLoad,
    onError,
    threshold = 0.1,
    rootMargin = '50px',
    width,
    height,
    objectFit = 'cover',
    priority = false,
    sizes,
}) => {
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string | null>(
        priority ? src : null
    );
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Intersection Observer setup
    useEffect(() => {
        if (priority || isInView) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        setCurrentSrc(src);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold,
                rootMargin,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [src, threshold, rootMargin, priority, isInView]);

    // Handle image load
    const handleLoad = useCallback(() => {
        setHasError(false);
        onLoad?.();
    }, [onLoad]);

    // Handle image error
    const handleError = useCallback(() => {
        setHasError(true);
        if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setHasError(false);
        } else {
            onError?.();
        }
    }, [fallbackSrc, currentSrc, onError]);

    // Error state
    if (hasError && !fallbackSrc) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
                style={{ width, height }}
            >
                <div className='text-center'>
                    <ImageIcon className='mx-auto size-8 text-gray-400' />
                    <p className='mt-2 text-xs text-gray-500'>Failed to load</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{ width, height }}
        >
            {/* Placeholder */}
            {!currentSrc &&
                (placeholder || (
                    <div
                        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
                        style={{ width, height }}
                    >
                        <ImageIcon className='size-8 text-gray-400' />
                    </div>
                ))}

            {/* Actual image */}
            {currentSrc && (
                <Image
                    ref={imgRef}
                    src={currentSrc}
                    alt={alt}
                    width={width || 0}
                    height={height || 0}
                    className={`transition-opacity duration-300 ${className}`}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                    }}
                    onLoad={handleLoad}
                    onError={handleError}
                    priority={priority}
                    sizes={sizes}
                />
            )}
        </div>
    );
};

// Optimized event thumbnail component
interface EventThumbnailProps {
    src?: string;
    alt: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    priority?: boolean;
}

export const EventThumbnail: React.FC<EventThumbnailProps> = ({
    src,
    alt,
    className = '',
    size = 'md',
    priority = false,
}) => {
    const sizeClasses = {
        sm: 'h-12 w-12',
        md: 'h-16 w-16',
        lg: 'h-24 w-24',
    };

    const placeholder = (
        <div
            className={`flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]}`}
        >
            <Calendar className='size-6 text-gray-400' />
        </div>
    );

    if (!src) {
        return placeholder;
    }

    return (
        <LazyImage
            src={src}
            alt={alt}
            className={`rounded-lg ${sizeClasses[size]} ${className}`}
            placeholder={placeholder}
            priority={priority}
            objectFit='cover'
        />
    );
};

// Optimized event banner component
interface EventBannerProps {
    src?: string;
    alt: string;
    className?: string;
    aspectRatio?: 'video' | 'square' | 'wide';
    priority?: boolean;
}

export const EventBanner: React.FC<EventBannerProps> = ({
    src,
    alt,
    className = '',
    aspectRatio = 'video',
    priority = false,
}) => {
    const aspectClasses = {
        video: 'aspect-video',
        square: 'aspect-square',
        wide: 'aspect-[21/9]',
    };

    const placeholder = (
        <div
            className={`flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 ${aspectClasses[aspectRatio]}`}
        >
            <div className='text-center'>
                <ImageIcon className='mx-auto size-12 text-gray-400' />
                <p className='mt-2 text-sm text-gray-500'>No image</p>
            </div>
        </div>
    );

    if (!src) {
        return placeholder;
    }

    return (
        <LazyImage
            src={src}
            alt={alt}
            className={`w-full rounded-lg ${aspectClasses[aspectRatio]} ${className}`}
            placeholder={placeholder}
            priority={priority}
            objectFit='cover'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
    );
};

// Progressive image loading with multiple sizes
interface ProgressiveImageProps {
    srcSet: {
        small: string;
        medium: string;
        large: string;
    };
    alt: string;
    className?: string;
    priority?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
    srcSet,
    alt,
    className = '',
    priority = false,
}) => {
    const [currentSrc, setCurrentSrc] = useState(srcSet.small);
    const [setIsLoaded] = useState(false);

    useEffect(() => {
        if (priority) {
            // Load medium quality first, then high quality
            const mediumImg = new Image();
            mediumImg.onload = () => {
                setCurrentSrc(srcSet.medium);

                // Then load high quality
                const largeImg = new Image();
                largeImg.onload = () => {
                    setCurrentSrc(srcSet.large);
                };
                largeImg.src = srcSet.large;
            };
            mediumImg.src = srcSet.medium;
        }
    }, [srcSet, priority]);

    return (
        <LazyImage
            src={currentSrc}
            alt={alt}
            className={className}
            priority={priority}
            onLoad={() => setIsLoaded(true)}
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
    );
};

// Image with blur-up effect
interface BlurImageProps {
    src: string;
    blurDataURL?: string;
    alt: string;
    className?: string;
    priority?: boolean;
}

export const BlurImage: React.FC<BlurImageProps> = ({
    src,
    blurDataURL,
    alt,
    className = '',
    priority = false,
}) => {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Blur placeholder */}
            {blurDataURL && (
                <Image
                    src={blurDataURL}
                    alt=''
                    fill
                    className='absolute inset-0 scale-110 object-cover blur-sm'
                    aria-hidden='true'
                />
            )}

            {/* Main image */}
            <LazyImage
                src={src}
                alt={alt}
                className='scale-100 blur-0 transition-all duration-700'
                priority={priority}
                width={400}
                height={300}
            />
        </div>
    );
};

export default LazyImage;

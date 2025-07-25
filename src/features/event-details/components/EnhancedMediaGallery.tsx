'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EventView } from '../../../lib/services/models/EventView';

interface EnhancedMediaGalleryProps {
    event: EventView;
}

const EnhancedMediaGallery = ({ event }: EnhancedMediaGalleryProps) => {
    const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    // Combine all media (images and potential videos in the future)
    const mediaItems = event.images || [];

    // Don't render if no media
    if (!mediaItems.length) {
        return null;
    }

    const openLightbox = (media: string, index: number) => {
        setSelectedMedia(media);
        setSelectedIndex(index);
    };

    const closeLightbox = () => {
        setSelectedMedia(null);
    };

    const navigateMedia = (direction: 'prev' | 'next') => {
        const newIndex =
            direction === 'prev'
                ? (selectedIndex - 1 + mediaItems.length) % mediaItems.length
                : (selectedIndex + 1) % mediaItems.length;

        setSelectedIndex(newIndex);
        setSelectedMedia(mediaItems[newIndex]);
    };

    const isVideo = (url: string) => {
        return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
    };

    return (
        <>
            <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mb-6 flex items-center gap-3'>
                    <div className='rounded-xl bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue p-3'>
                        <svg
                            className='size-6 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                        </svg>
                    </div>
                    <div className='flex-1'>
                        <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                            Event Gallery
                        </h2>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            {mediaItems.length}{' '}
                            {mediaItems.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                </div>

                {/* Media Grid */}
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                    {mediaItems.map((media, index) => (
                        <div
                            key={index}
                            className='group relative overflow-hidden rounded-2xl border border-gray-200/30 bg-gradient-to-br from-gray-50 to-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:border-revlr-dark-border/30 dark:from-revlr-dark-bg dark:to-revlr-dark-card'
                        >
                            <div
                                className='relative h-64 cursor-pointer'
                                onClick={() => openLightbox(media, index)}
                            >
                                {isVideo(media) ? (
                                    <div className='relative size-full'>
                                        <video
                                            src={media}
                                            className='size-full object-cover'
                                            muted
                                            preload='metadata'
                                        />
                                        {/* Video Play Overlay */}
                                        <div className='absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/50'>
                                            <div className='rounded-full bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110'>
                                                <svg
                                                    className='size-8 text-revlr-primary-blue'
                                                    fill='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path d='M8 5v14l11-7z' />
                                                </svg>
                                            </div>
                                        </div>
                                        {/* Video Badge */}
                                        <div className='absolute right-3 top-3'>
                                            <span className='inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                                                <svg
                                                    className='size-3'
                                                    fill='currentColor'
                                                    viewBox='0 0 24 24'
                                                >
                                                    <path d='M8 5v14l11-7z' />
                                                </svg>
                                                Video
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <Image
                                        src={media}
                                        alt={`Event media ${index + 1}`}
                                        fill
                                        className='object-cover transition-transform duration-300 group-hover:scale-110'
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.src =
                                                '/assets/images/event-image.png';
                                        }}
                                    />
                                )}

                                {/* Hover Overlay */}
                                <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

                                {/* Expand Icon */}
                                <div className='absolute right-3 top-3 opacity-0 transition-all duration-300 group-hover:opacity-100'>
                                    <div className='rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm'>
                                        <svg
                                            className='size-4 text-gray-800'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {/* Media Counter */}
                                <div className='absolute bottom-3 left-3 opacity-0 transition-all duration-300 group-hover:opacity-100'>
                                    <span className='inline-flex items-center rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm'>
                                        {index + 1} of {mediaItems.length}
                                    </span>
                                </div>

                                {/* Floating Elements */}
                                <div className='absolute -right-2 -top-2 size-8 rounded-full bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange opacity-20 blur-lg'></div>
                                <div className='absolute -bottom-2 -left-2 size-6 rounded-full bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue opacity-20 blur-lg'></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='mt-6 text-center'>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Click on any image or video to view in full size
                    </p>
                </div>
            </div>

            {/* Lightbox Modal */}
            {selectedMedia && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm'>
                    <div className='relative max-h-[90vh] max-w-[90vw]'>
                        {/* Close Button */}
                        <button
                            onClick={closeLightbox}
                            className='absolute -right-4 -top-4 z-10 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-revlr-dark-card/90 dark:hover:bg-revlr-dark-card'
                        >
                            <svg
                                className='size-6 text-gray-800 dark:text-gray-200'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </button>

                        {/* Navigation Buttons */}
                        {mediaItems.length > 1 && (
                            <>
                                <button
                                    onClick={() => navigateMedia('prev')}
                                    className='absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-revlr-dark-card/90 dark:hover:bg-revlr-dark-card'
                                >
                                    <svg
                                        className='size-6 text-gray-800 dark:text-gray-200'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M15 19l-7-7 7-7'
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => navigateMedia('next')}
                                    className='absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white dark:bg-revlr-dark-card/90 dark:hover:bg-revlr-dark-card'
                                >
                                    <svg
                                        className='size-6 text-gray-800 dark:text-gray-200'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 5l7 7-7 7'
                                        />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Media Content */}
                        <div className='rounded-2xl border border-gray-200/20 bg-white/10 p-4 shadow-2xl backdrop-blur-sm'>
                            {isVideo(selectedMedia) ? (
                                <video
                                    src={selectedMedia}
                                    controls
                                    autoPlay
                                    className='max-h-[80vh] max-w-full rounded-xl'
                                />
                            ) : (
                                <Image
                                    src={selectedMedia}
                                    alt={`Event media ${selectedIndex + 1}`}
                                    width={1200}
                                    height={800}
                                    className='max-h-[80vh] max-w-full rounded-xl object-contain'
                                    onError={(e) => {
                                        const target =
                                            e.target as HTMLImageElement;
                                        target.src =
                                            '/assets/images/event-image.png';
                                    }}
                                />
                            )}
                        </div>

                        {/* Media Info */}
                        <div className='mt-4 text-center'>
                            <p className='text-white/80'>
                                {selectedIndex + 1} of {mediaItems.length}
                            </p>
                        </div>
                    </div>

                    {/* Click outside to close */}
                    <div
                        className='absolute inset-0 -z-10'
                        onClick={closeLightbox}
                    />
                </div>
            )}
        </>
    );
};

export default EnhancedMediaGallery;

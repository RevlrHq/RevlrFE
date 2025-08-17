'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useTouchGestures } from '@src/hooks/useTouchGestures';
import {
    Maximize2,
    Minimize2,
    Download,
    Settings,
    RotateCcw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { Button } from './ui/button';

interface ResponsiveChartContainerProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    className?: string;
    enableFullscreen?: boolean;
    enableZoom?: boolean;
    enableExport?: boolean;
    onExport?: () => void;
    onReset?: () => void;
    minHeight?: number;
    maxHeight?: number;
    aspectRatio?: number;
}

export const ResponsiveChartContainer: React.FC<
    ResponsiveChartContainerProps
> = ({
    children,
    title,
    subtitle,
    className = '',
    enableFullscreen = true,
    enableZoom = true,
    enableExport = true,
    onExport,
    onReset,
    minHeight = 200,
    maxHeight = 600,
    aspectRatio = 16 / 9,
}) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [showControls, setShowControls] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle container resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                const height = Math.min(
                    Math.max(width / aspectRatio, minHeight),
                    maxHeight
                );
                setContainerSize({ width, height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [aspectRatio, minHeight, maxHeight]);

    // Touch gestures for mobile interaction
    const { attachGestureListeners } = useTouchGestures({
        onPinchZoom: enableZoom
            ? (scale) => {
                  setZoomLevel(Math.max(0.5, Math.min(3, scale)));
              }
            : undefined,
        onDoubleTap: enableFullscreen
            ? () => {
                  setIsFullscreen(!isFullscreen);
              }
            : undefined,
        enablePinchZoom: enableZoom,
        enableDoubleTap: enableFullscreen,
    });

    // Attach gesture listeners
    useEffect(() => {
        if (containerRef.current && isMobile) {
            return attachGestureListeners(containerRef.current);
        }
    }, [attachGestureListeners, isMobile]);

    // Handle fullscreen toggle
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Handle zoom controls
    const handleZoomIn = () => {
        setZoomLevel(Math.min(3, zoomLevel * 1.2));
    };

    const handleZoomOut = () => {
        setZoomLevel(Math.max(0.5, zoomLevel / 1.2));
    };

    // Handle reset
    const handleReset = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        onReset?.();
    };

    // Calculate responsive height
    const getResponsiveHeight = () => {
        if (isFullscreen) {
            return isMobile ? '70vh' : '80vh';
        }

        if (isMobile) {
            return Math.min(containerSize.width * 0.75, 300);
        }

        return containerSize.height;
    };

    return (
        <>
            {/* Chart Container */}
            <div
                ref={containerRef}
                className={`relative rounded-xl border transition-all duration-300 ${
                    isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'shadow-sm'
                } ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                } ${className}`}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
                style={{
                    height: getResponsiveHeight(),
                }}
            >
                {/* Header */}
                <div className='flex items-center justify-between border-b border-gray-200 p-4 dark:border-revlr-dark-border'>
                    <div className='min-w-0 flex-1'>
                        <h3 className='truncate text-lg font-semibold'>
                            {title}
                        </h3>
                        {subtitle && (
                            <p
                                className={`mt-1 truncate text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Desktop Controls */}
                    {!isMobile && (
                        <div
                            className={`flex items-center gap-2 transition-opacity duration-200 ${
                                showControls ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            {enableZoom && (
                                <>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleZoomOut}
                                        className='p-2'
                                        aria-label='Zoom out'
                                    >
                                        <ZoomOut className='size-4' />
                                    </Button>
                                    <span className='rounded bg-gray-100 px-2 py-1 text-xs dark:bg-revlr-dark-border'>
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleZoomIn}
                                        className='p-2'
                                        aria-label='Zoom in'
                                    >
                                        <ZoomIn className='size-4' />
                                    </Button>
                                </>
                            )}

                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleReset}
                                className='p-2'
                                aria-label='Reset view'
                            >
                                <RotateCcw className='size-4' />
                            </Button>

                            {enableExport && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={onExport}
                                    className='p-2'
                                    aria-label='Export chart'
                                >
                                    <Download className='size-4' />
                                </Button>
                            )}

                            {enableFullscreen && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={toggleFullscreen}
                                    className='p-2'
                                    aria-label={
                                        isFullscreen
                                            ? 'Exit fullscreen'
                                            : 'Enter fullscreen'
                                    }
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className='size-4' />
                                    ) : (
                                        <Maximize2 className='size-4' />
                                    )}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Mobile Controls */}
                    {isMobile && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setShowControls(!showControls)}
                            className='p-2'
                            aria-label='Toggle controls'
                        >
                            <Settings className='size-4' />
                        </Button>
                    )}
                </div>

                {/* Mobile Controls Panel */}
                {isMobile && showControls && (
                    <div
                        className={`absolute right-4 top-16 z-10 rounded-lg border p-3 shadow-lg ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <div className='flex flex-col gap-2'>
                            {enableZoom && (
                                <div className='flex items-center gap-2'>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleZoomOut}
                                        className='p-2'
                                    >
                                        <ZoomOut className='size-4' />
                                    </Button>
                                    <span className='min-w-[50px] rounded bg-gray-100 px-2 py-1 text-center text-xs dark:bg-revlr-dark-border'>
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleZoomIn}
                                        className='p-2'
                                    >
                                        <ZoomIn className='size-4' />
                                    </Button>
                                </div>
                            )}

                            <div className='flex items-center gap-2'>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={handleReset}
                                    className='flex-1 p-2'
                                >
                                    <RotateCcw className='mr-2 size-4' />
                                    Reset
                                </Button>

                                {enableFullscreen && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={toggleFullscreen}
                                        className='flex-1 p-2'
                                    >
                                        {isFullscreen ? (
                                            <>
                                                <Minimize2 className='mr-2 size-4' />
                                                Exit
                                            </>
                                        ) : (
                                            <>
                                                <Maximize2 className='mr-2 size-4' />
                                                Full
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            {enableExport && (
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={onExport}
                                    className='w-full p-2'
                                >
                                    <Download className='mr-2 size-4' />
                                    Export
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Chart Content */}
                <div
                    className='flex-1 overflow-hidden p-4'
                    style={{
                        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease-out',
                    }}
                >
                    {children}
                </div>

                {/* Mobile Interaction Hints */}
                {isMobile && !showControls && (
                    <div
                        className={`absolute inset-x-4 bottom-4 text-center text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        {enableZoom && enableFullscreen && (
                            <p>Pinch to zoom • Double tap for fullscreen</p>
                        )}
                        {enableZoom && !enableFullscreen && (
                            <p>Pinch to zoom</p>
                        )}
                        {!enableZoom && enableFullscreen && (
                            <p>Double tap for fullscreen</p>
                        )}
                    </div>
                )}
            </div>

            {/* Fullscreen Overlay */}
            {isFullscreen && (
                <div
                    className='fixed inset-0 z-40 bg-black/50'
                    onClick={toggleFullscreen}
                />
            )}
        </>
    );
};

export default ResponsiveChartContainer;

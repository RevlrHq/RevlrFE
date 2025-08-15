'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '@src/hooks/useAccessibility';
import { MediaSearchModal } from '../MediaSearchModal';
import { MobileMediaSearchModal } from './MobileMediaSearchModal';
import type { EventImage } from '@src/types/event-creation';

interface ResponsiveMediaSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMedia: (images: EventImage[]) => void;
    eventCategory?: string;
    existingImages?: EventImage[];
    maxImages?: number;
    className?: string;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';

export const ResponsiveMediaSearchModal: React.FC<
    ResponsiveMediaSearchModalProps
> = ({
    isOpen,
    onClose,
    onSelectMedia,
    eventCategory,
    existingImages = [],
    maxImages = 5,
    className = '',
}) => {
    const accessibility = useAccessibility();
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
    const [orientation, setOrientation] = useState<Orientation>('landscape');
    const [isTouch, setIsTouch] = useState(false);

    // Detect device type and capabilities
    useEffect(() => {
        const detectDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Detect device type based on screen size
            if (width < 768) {
                setDeviceType('mobile');
            } else if (width < 1024) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }

            // Detect orientation
            setOrientation(width > height ? 'landscape' : 'portrait');

            // Detect touch capability
            setIsTouch(
                'ontouchstart' in window || navigator.maxTouchPoints > 0
            );
        };

        detectDevice();

        // Listen for resize and orientation changes
        window.addEventListener('resize', detectDevice);
        window.addEventListener('orientationchange', detectDevice);

        return () => {
            window.removeEventListener('resize', detectDevice);
            window.removeEventListener('orientationchange', detectDevice);
        };
    }, []);

    // Handle viewport meta tag for mobile
    useEffect(() => {
        if (isOpen && deviceType === 'mobile') {
            // Ensure proper viewport settings for mobile
            const viewportMeta = document.querySelector(
                'meta[name="viewport"]'
            ) as HTMLMetaElement;
            const originalContent = viewportMeta?.content;

            if (viewportMeta) {
                viewportMeta.content =
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            }

            return () => {
                if (viewportMeta && originalContent) {
                    viewportMeta.content = originalContent;
                }
            };
        }
    }, [isOpen, deviceType]);

    // Announce device changes to screen readers
    useEffect(() => {
        if (isOpen) {
            const deviceInfo = `${deviceType} device in ${orientation} orientation${isTouch ? ' with touch support' : ''}`;
            accessibility.announce(`Media search opened on ${deviceInfo}`);
        }
    }, [isOpen, deviceType, orientation, isTouch, accessibility]);

    // Determine which modal component to use
    const shouldUseMobileModal = useCallback(() => {
        return (
            deviceType === 'mobile' ||
            (deviceType === 'tablet' && orientation === 'portrait') ||
            isTouch ||
            accessibility.state.fontSize === 'large' ||
            accessibility.state.fontSize === 'extra-large'
        );
    }, [deviceType, orientation, isTouch, accessibility.state.fontSize]);

    // Enhanced props for mobile optimization
    const getMobileOptimizedProps = useCallback(() => {
        return {
            isOpen,
            onClose,
            onSelectMedia,
            eventCategory,
            existingImages,
            maxImages,
            className: `${className} ${deviceType} ${orientation} ${isTouch ? 'touch-enabled' : 'no-touch'}`,
        };
    }, [
        isOpen,
        onClose,
        onSelectMedia,
        eventCategory,
        existingImages,
        maxImages,
        className,
        deviceType,
        orientation,
        isTouch,
    ]);

    // Enhanced props for desktop optimization
    const getDesktopOptimizedProps = useCallback(() => {
        return {
            isOpen,
            onClose,
            onSelectMedia,
            eventCategory,
            existingImages,
            maxImages,
            className: `${className} ${deviceType} ${orientation} keyboard-navigation`,
        };
    }, [
        isOpen,
        onClose,
        onSelectMedia,
        eventCategory,
        existingImages,
        maxImages,
        className,
        deviceType,
        orientation,
    ]);

    // Handle device-specific optimizations
    useEffect(() => {
        if (!isOpen) return;

        const body = document.body;
        const html = document.documentElement;

        // Add device-specific classes
        body.classList.add(`device-${deviceType}`);
        body.classList.add(`orientation-${orientation}`);

        if (isTouch) {
            body.classList.add('touch-device');
        } else {
            body.classList.add('no-touch-device');
        }

        // Prevent overscroll on mobile
        if (deviceType === 'mobile') {
            body.style.overscrollBehavior = 'none';
            html.style.overscrollBehavior = 'none';
        }

        // Handle safe area insets on mobile
        if (
            deviceType === 'mobile' &&
            'CSS' in window &&
            CSS.supports('padding-top: env(safe-area-inset-top)')
        ) {
            body.style.paddingTop = 'env(safe-area-inset-top)';
            body.style.paddingBottom = 'env(safe-area-inset-bottom)';
            body.style.paddingLeft = 'env(safe-area-inset-left)';
            body.style.paddingRight = 'env(safe-area-inset-right)';
        }

        return () => {
            body.classList.remove(`device-${deviceType}`);
            body.classList.remove(`orientation-${orientation}`);
            body.classList.remove('touch-device', 'no-touch-device');
            body.style.overscrollBehavior = '';
            html.style.overscrollBehavior = '';
            body.style.paddingTop = '';
            body.style.paddingBottom = '';
            body.style.paddingLeft = '';
            body.style.paddingRight = '';
        };
    }, [isOpen, deviceType, orientation, isTouch]);

    // Performance optimization: prevent unnecessary re-renders
    const MemoizedMobileModal = React.memo(MobileMediaSearchModal);
    const MemoizedDesktopModal = React.memo(MediaSearchModal);

    // Render appropriate modal based on device capabilities
    if (shouldUseMobileModal()) {
        return <MemoizedMobileModal {...getMobileOptimizedProps()} />;
    } else {
        return <MemoizedDesktopModal {...getDesktopOptimizedProps()} />;
    }
};

// Hook for responsive media search behavior
export function useResponsiveMediaSearch() {
    const [deviceInfo, setDeviceInfo] = useState({
        type: 'desktop' as DeviceType,
        orientation: 'landscape' as Orientation,
        isTouch: false,
        viewportSize: { width: 0, height: 0 },
        pixelRatio: 1,
        connectionType: 'unknown' as string,
    });

    useEffect(() => {
        const updateDeviceInfo = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            let type: DeviceType = 'desktop';
            if (width < 768) {
                type = 'mobile';
            } else if (width < 1024) {
                type = 'tablet';
            }

            const orientation: Orientation =
                width > height ? 'landscape' : 'portrait';
            const isTouch =
                'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const pixelRatio = window.devicePixelRatio || 1;

            // Detect connection type if available
            let connectionType = 'unknown';
            if ('connection' in navigator) {
                const connection = (
                    navigator as {
                        connection?: { effectiveType?: string; type?: string };
                    }
                ).connection;
                connectionType =
                    connection?.effectiveType || connection?.type || 'unknown';
            }

            setDeviceInfo({
                type,
                orientation,
                isTouch,
                viewportSize: { width, height },
                pixelRatio,
                connectionType,
            });
        };

        updateDeviceInfo();

        window.addEventListener('resize', updateDeviceInfo);
        window.addEventListener('orientationchange', updateDeviceInfo);

        return () => {
            window.removeEventListener('resize', updateDeviceInfo);
            window.removeEventListener('orientationchange', updateDeviceInfo);
        };
    }, []);

    // Get optimized settings based on device
    const getOptimizedSettings = useCallback(() => {
        const {
            type,
            orientation,
            isTouch,
            viewportSize,
            pixelRatio,
            connectionType,
        } = deviceInfo;

        // Adjust image quality based on device and connection
        let imageQuality = 'high';
        if (
            type === 'mobile' ||
            connectionType === 'slow-2g' ||
            connectionType === '2g'
        ) {
            imageQuality = 'medium';
        } else if (connectionType === '3g') {
            imageQuality = 'high';
        }

        // Adjust grid size based on device
        let gridColumns = 6;
        if (type === 'mobile') {
            gridColumns = orientation === 'portrait' ? 2 : 3;
        } else if (type === 'tablet') {
            gridColumns = orientation === 'portrait' ? 3 : 4;
        }

        // Adjust pagination based on device performance
        let itemsPerPage = 30;
        if (type === 'mobile' || pixelRatio > 2) {
            itemsPerPage = 20;
        }

        // Adjust animation preferences
        const enableAnimations = !window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        return {
            imageQuality,
            gridColumns,
            itemsPerPage,
            enableAnimations,
            enableLazyLoading: true,
            enableVirtualization: viewportSize.height > 600,
            enableTouchGestures: isTouch,
            enableKeyboardNavigation: !isTouch,
            preloadImages:
                connectionType !== 'slow-2g' && connectionType !== '2g',
        };
    }, [deviceInfo]);

    return {
        deviceInfo,
        getOptimizedSettings,
        isMobile: deviceInfo.type === 'mobile',
        isTablet: deviceInfo.type === 'tablet',
        isDesktop: deviceInfo.type === 'desktop',
        isTouch: deviceInfo.isTouch,
        isPortrait: deviceInfo.orientation === 'portrait',
        isLandscape: deviceInfo.orientation === 'landscape',
    };
}

export default ResponsiveMediaSearchModal;

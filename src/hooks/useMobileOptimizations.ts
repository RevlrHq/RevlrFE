import { useState, useEffect, useCallback, useRef } from 'react';

interface MobileOptimizationOptions {
    enablePullToRefresh?: boolean;
    enableSwipeNavigation?: boolean;
    enableTouchFeedback?: boolean;
    enableVirtualScrolling?: boolean;
    breakpoint?: number;
}

interface MobileState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
    screenHeight: number;
    orientation: 'portrait' | 'landscape';
    touchSupported: boolean;
    isOnline: boolean;
}

interface PullToRefreshState {
    isPulling: boolean;
    isRefreshing: boolean;
    pullDistance: number;
    canRefresh: boolean;
}

interface SwipeState {
    isSwipeActive: boolean;
    swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
    swipeProgress: number;
}

export function useMobileOptimizations(
    options: MobileOptimizationOptions = {}
) {
    const {
        enablePullToRefresh = true,
        enableSwipeNavigation = true,
        enableTouchFeedback = true,
        enableVirtualScrolling = false,
        breakpoint = 768,
    } = options;

    // Mobile state
    const [mobileState, setMobileState] = useState<MobileState>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 0,
        screenHeight: 0,
        orientation: 'portrait',
        touchSupported: false,
        isOnline: true,
    });

    // Pull to refresh state
    const [pullToRefreshState, setPullToRefreshState] =
        useState<PullToRefreshState>({
            isPulling: false,
            isRefreshing: false,
            pullDistance: 0,
            canRefresh: false,
        });

    // Swipe state
    const [swipeState, setSwipeState] = useState<SwipeState>({
        isSwipeActive: false,
        swipeDirection: null,
        swipeProgress: 0,
    });

    // Refs for touch handling
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
        null
    );
    const scrollElementRef = useRef<HTMLElement | null>(null);
    const refreshCallbackRef = useRef<(() => Promise<void>) | null>(null);

    // Update mobile state
    const updateMobileState = useCallback(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < breakpoint;
        const isTablet = width >= breakpoint && width < 1024;
        const isDesktop = width >= 1024;
        const orientation = width > height ? 'landscape' : 'portrait';
        const touchSupported =
            'ontouchstart' in window || navigator.maxTouchPoints > 0;

        setMobileState({
            isMobile,
            isTablet,
            isDesktop,
            screenWidth: width,
            screenHeight: height,
            orientation,
            touchSupported,
            isOnline: navigator.onLine,
        });
    }, [breakpoint]);

    // Initialize mobile state
    useEffect(() => {
        updateMobileState();

        const handleResize = () => updateMobileState();
        const handleOrientationChange = () => {
            // Delay to get accurate dimensions after orientation change
            setTimeout(updateMobileState, 100);
        };
        const handleOnlineStatusChange = () => {
            setMobileState((prev) => ({ ...prev, isOnline: navigator.onLine }));
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener(
                'orientationchange',
                handleOrientationChange
            );
            window.removeEventListener('online', handleOnlineStatusChange);
            window.removeEventListener('offline', handleOnlineStatusChange);
        };
    }, [updateMobileState]);

    // Pull to refresh functionality
    const setupPullToRefresh = useCallback(
        (element: HTMLElement, onRefresh: () => Promise<void>) => {
            if (!enablePullToRefresh || !mobileState.touchSupported) return;

            scrollElementRef.current = element;
            refreshCallbackRef.current = onRefresh;

            const handleTouchStart = (e: TouchEvent) => {
                if (element.scrollTop === 0) {
                    touchStartRef.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        time: Date.now(),
                    };
                }
            };

            const handleTouchMove = (e: TouchEvent) => {
                if (!touchStartRef.current || element.scrollTop > 0) return;

                const currentY = e.touches[0].clientY;
                const deltaY = currentY - touchStartRef.current.y;

                if (deltaY > 0) {
                    e.preventDefault();
                    const pullDistance = Math.min(deltaY * 0.5, 100);
                    const canRefresh = pullDistance > 60;

                    setPullToRefreshState({
                        isPulling: true,
                        isRefreshing: false,
                        pullDistance,
                        canRefresh,
                    });

                    // Haptic feedback
                    if (
                        enableTouchFeedback &&
                        canRefresh &&
                        pullDistance > 59 &&
                        pullDistance < 61
                    ) {
                        if ('vibrate' in navigator) {
                            navigator.vibrate(50);
                        }
                    }
                }
            };

            const handleTouchEnd = async () => {
                if (
                    pullToRefreshState.canRefresh &&
                    refreshCallbackRef.current
                ) {
                    setPullToRefreshState((prev) => ({
                        ...prev,
                        isRefreshing: true,
                        isPulling: false,
                    }));

                    try {
                        await refreshCallbackRef.current();
                    } finally {
                        setPullToRefreshState({
                            isPulling: false,
                            isRefreshing: false,
                            pullDistance: 0,
                            canRefresh: false,
                        });
                    }
                } else {
                    setPullToRefreshState({
                        isPulling: false,
                        isRefreshing: false,
                        pullDistance: 0,
                        canRefresh: false,
                    });
                }

                touchStartRef.current = null;
            };

            element.addEventListener('touchstart', handleTouchStart, {
                passive: false,
            });
            element.addEventListener('touchmove', handleTouchMove, {
                passive: false,
            });
            element.addEventListener('touchend', handleTouchEnd);

            return () => {
                element.removeEventListener('touchstart', handleTouchStart);
                element.removeEventListener('touchmove', handleTouchMove);
                element.removeEventListener('touchend', handleTouchEnd);
            };
        },
        [
            enablePullToRefresh,
            enableTouchFeedback,
            mobileState.touchSupported,
            pullToRefreshState.canRefresh,
        ]
    );

    // Swipe navigation functionality
    const setupSwipeNavigation = useCallback(
        (
            element: HTMLElement,
            onSwipeLeft?: () => void,
            onSwipeRight?: () => void,
            onSwipeUp?: () => void,
            onSwipeDown?: () => void
        ) => {
            if (!enableSwipeNavigation || !mobileState.touchSupported) return;

            let startTouch: { x: number; y: number; time: number } | null =
                null;
            let currentTouch: { x: number; y: number } | null = null;

            const handleTouchStart = (e: TouchEvent) => {
                startTouch = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    time: Date.now(),
                };
                currentTouch = { x: startTouch.x, y: startTouch.y };
            };

            const handleTouchMove = (e: TouchEvent) => {
                if (!startTouch) return;

                currentTouch = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                };

                const deltaX = currentTouch.x - startTouch.x;
                const deltaY = currentTouch.y - startTouch.y;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);

                // Determine swipe direction and progress
                let direction: 'left' | 'right' | 'up' | 'down' | null = null;
                let progress = 0;

                if (absDeltaX > absDeltaY && absDeltaX > 20) {
                    direction = deltaX > 0 ? 'right' : 'left';
                    progress = Math.min(absDeltaX / 100, 1);
                } else if (absDeltaY > absDeltaX && absDeltaY > 20) {
                    direction = deltaY > 0 ? 'down' : 'up';
                    progress = Math.min(absDeltaY / 100, 1);
                }

                setSwipeState({
                    isSwipeActive: progress > 0,
                    swipeDirection: direction,
                    swipeProgress: progress,
                });
            };

            const handleTouchEnd = () => {
                if (!startTouch || !currentTouch) return;

                const deltaX = currentTouch.x - startTouch.x;
                const deltaY = currentTouch.y - startTouch.y;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                const timeDelta = Date.now() - startTouch.time;

                // Check for valid swipe (minimum distance and maximum time)
                const isValidSwipe =
                    (absDeltaX > 50 || absDeltaY > 50) && timeDelta < 500;

                if (isValidSwipe) {
                    if (absDeltaX > absDeltaY) {
                        // Horizontal swipe
                        if (deltaX > 0 && onSwipeRight) {
                            onSwipeRight();
                        } else if (deltaX < 0 && onSwipeLeft) {
                            onSwipeLeft();
                        }
                    } else {
                        // Vertical swipe
                        if (deltaY > 0 && onSwipeDown) {
                            onSwipeDown();
                        } else if (deltaY < 0 && onSwipeUp) {
                            onSwipeUp();
                        }
                    }

                    // Haptic feedback for successful swipe
                    if (enableTouchFeedback && 'vibrate' in navigator) {
                        navigator.vibrate(30);
                    }
                }

                // Reset swipe state
                setSwipeState({
                    isSwipeActive: false,
                    swipeDirection: null,
                    swipeProgress: 0,
                });

                startTouch = null;
                currentTouch = null;
            };

            element.addEventListener('touchstart', handleTouchStart);
            element.addEventListener('touchmove', handleTouchMove);
            element.addEventListener('touchend', handleTouchEnd);

            return () => {
                element.removeEventListener('touchstart', handleTouchStart);
                element.removeEventListener('touchmove', handleTouchMove);
                element.removeEventListener('touchend', handleTouchEnd);
            };
        },
        [enableSwipeNavigation, enableTouchFeedback, mobileState.touchSupported]
    );

    // Virtual scrolling state
    const [virtualScrollTop, setVirtualScrollTop] = useState(0);

    // Virtual scrolling for large lists
    const createVirtualScrolling = useCallback(
        <T>(items: T[], itemHeight: number, containerHeight: number) => {
            const visibleStart = Math.floor(virtualScrollTop / itemHeight);
            const visibleEnd = Math.min(
                visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
                items.length
            );

            const visibleItems = items.slice(visibleStart, visibleEnd);
            const totalHeight = items.length * itemHeight;
            const offsetY = visibleStart * itemHeight;

            return {
                visibleItems,
                totalHeight,
                offsetY,
                onScroll: (e: React.UIEvent<HTMLElement>) => {
                    setVirtualScrollTop(e.currentTarget.scrollTop);
                },
            };
        },
        [virtualScrollTop]
    );

    // Responsive breakpoint utilities
    const getResponsiveValue = useCallback(
        <T>(mobile: T, tablet?: T, desktop?: T): T => {
            if (mobileState.isMobile) return mobile;
            if (mobileState.isTablet && tablet !== undefined) return tablet;
            if (mobileState.isDesktop && desktop !== undefined) return desktop;
            return mobile;
        },
        [mobileState]
    );

    // Touch-friendly button size
    const getTouchFriendlySize = useCallback(
        (baseSize: number): number => {
            return mobileState.touchSupported
                ? Math.max(baseSize, 44)
                : baseSize;
        },
        [mobileState.touchSupported]
    );

    return {
        // State
        mobileState,
        pullToRefreshState,
        swipeState,

        // Setup functions
        setupPullToRefresh,
        setupSwipeNavigation,

        // Utilities
        createVirtualScrolling: enableVirtualScrolling
            ? createVirtualScrolling
            : undefined,
        getResponsiveValue,
        getTouchFriendlySize,

        // Helpers
        isMobile: mobileState.isMobile,
        isTablet: mobileState.isTablet,
        isDesktop: mobileState.isDesktop,
        touchSupported: mobileState.touchSupported,
        isOnline: mobileState.isOnline,
        orientation: mobileState.orientation,
    };
}

export default useMobileOptimizations;

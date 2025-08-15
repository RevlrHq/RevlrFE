import { useCallback, useRef, useEffect } from 'react';

interface TouchGestureOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onPinchZoom?: (scale: number) => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
    swipeThreshold?: number;
    longPressDelay?: number;
    enablePinchZoom?: boolean;
    enableSwipe?: boolean;
    enableDoubleTap?: boolean;
    enableLongPress?: boolean;
}

interface TouchPoint {
    x: number;
    y: number;
    timestamp: number;
}

export function useTouchGestures({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchZoom,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50,
    longPressDelay = 500,
    enablePinchZoom = false,
    enableSwipe = true,
    enableDoubleTap = true,
    enableLongPress = true,
}: TouchGestureOptions = {}) {
    const touchStartRef = useRef<TouchPoint | null>(null);
    const touchEndRef = useRef<TouchPoint | null>(null);
    const lastTapRef = useRef<TouchPoint | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const initialDistanceRef = useRef<number>(0);
    const currentScaleRef = useRef<number>(1);

    // Calculate distance between two touch points
    const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }, []);

    // Handle touch start
    const handleTouchStart = useCallback(
        (event: TouchEvent) => {
            const touch = event.touches[0];
            const touchPoint: TouchPoint = {
                x: touch.clientX,
                y: touch.clientY,
                timestamp: Date.now(),
            };

            touchStartRef.current = touchPoint;

            // Handle pinch zoom initialization
            if (enablePinchZoom && event.touches.length === 2) {
                initialDistanceRef.current = getDistance(
                    event.touches[0],
                    event.touches[1]
                );
                event.preventDefault();
            }

            // Handle long press
            if (enableLongPress && onLongPress) {
                longPressTimerRef.current = setTimeout(() => {
                    onLongPress();
                }, longPressDelay);
            }
        },
        [
            enablePinchZoom,
            enableLongPress,
            onLongPress,
            longPressDelay,
            getDistance,
        ]
    );

    // Handle touch move
    const handleTouchMove = useCallback(
        (event: TouchEvent) => {
            // Cancel long press on move
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }

            // Handle pinch zoom
            if (enablePinchZoom && event.touches.length === 2 && onPinchZoom) {
                const currentDistance = getDistance(
                    event.touches[0],
                    event.touches[1]
                );
                const scale = currentDistance / initialDistanceRef.current;
                currentScaleRef.current = scale;
                onPinchZoom(scale);
                event.preventDefault();
            }
        },
        [enablePinchZoom, onPinchZoom, getDistance]
    );

    // Handle touch end
    const handleTouchEnd = useCallback(
        (event: TouchEvent) => {
            // Clear long press timer
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }

            if (!touchStartRef.current) return;

            const touch = event.changedTouches[0];
            const touchPoint: TouchPoint = {
                x: touch.clientX,
                y: touch.clientY,
                timestamp: Date.now(),
            };

            touchEndRef.current = touchPoint;

            // Handle double tap
            if (enableDoubleTap && onDoubleTap) {
                const timeDiff =
                    touchPoint.timestamp - (lastTapRef.current?.timestamp || 0);
                const distanceDiff = lastTapRef.current
                    ? Math.sqrt(
                          Math.pow(touchPoint.x - lastTapRef.current.x, 2) +
                              Math.pow(touchPoint.y - lastTapRef.current.y, 2)
                      )
                    : Infinity;

                if (timeDiff < 300 && distanceDiff < 50) {
                    onDoubleTap();
                    lastTapRef.current = null;
                } else {
                    lastTapRef.current = touchPoint;
                }
            }

            // Handle swipe gestures
            if (enableSwipe && touchStartRef.current) {
                const deltaX = touchPoint.x - touchStartRef.current.x;
                const deltaY = touchPoint.y - touchStartRef.current.y;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);

                // Determine swipe direction
                if (Math.max(absDeltaX, absDeltaY) > swipeThreshold) {
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
                }
            }

            touchStartRef.current = null;
            touchEndRef.current = null;
        },
        [
            enableDoubleTap,
            enableSwipe,
            onDoubleTap,
            onSwipeLeft,
            onSwipeRight,
            onSwipeUp,
            onSwipeDown,
            swipeThreshold,
        ]
    );

    // Attach event listeners
    const attachGestureListeners = useCallback(
        (element: HTMLElement) => {
            element.addEventListener('touchstart', handleTouchStart, {
                passive: false,
            });
            element.addEventListener('touchmove', handleTouchMove, {
                passive: false,
            });
            element.addEventListener('touchend', handleTouchEnd, {
                passive: false,
            });

            return () => {
                element.removeEventListener('touchstart', handleTouchStart);
                element.removeEventListener('touchmove', handleTouchMove);
                element.removeEventListener('touchend', handleTouchEnd);
            };
        },
        [handleTouchStart, handleTouchMove, handleTouchEnd]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
            }
        };
    }, []);

    return {
        attachGestureListeners,
        currentScale: currentScaleRef.current,
    };
}

export default useTouchGestures;

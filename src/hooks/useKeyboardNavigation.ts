import { useCallback, useEffect, useRef, useState } from 'react';

interface KeyboardNavigationOptions {
    enableArrowKeys?: boolean;
    enableTabTrapping?: boolean;
    enableEscapeHandling?: boolean;
    enableEnterActivation?: boolean;
    enableHomeEndKeys?: boolean;
    announceChanges?: boolean;
}

interface NavigationState {
    currentIndex: number;
    totalItems: number;
    isActive: boolean;
    focusedElement: HTMLElement | null;
}

export function useKeyboardNavigation({
    enableArrowKeys = true,
    enableTabTrapping = false,
    enableEscapeHandling = true,
    enableEnterActivation = true,
    enableHomeEndKeys = true,
    announceChanges = true,
}: KeyboardNavigationOptions = {}) {
    const [state, setState] = useState<NavigationState>({
        currentIndex: -1,
        totalItems: 0,
        isActive: false,
        focusedElement: null,
    });

    const containerRef = useRef<HTMLElement>(null);
    const itemsRef = useRef<HTMLElement[]>([]);
    const announceRef = useRef<HTMLDivElement>(null);

    // Get focusable elements within container
    const getFocusableElements = useCallback((): HTMLElement[] => {
        if (!containerRef.current) return [];

        const focusableSelectors = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="menuitem"]:not([disabled])',
            '[role="tab"]:not([disabled])',
            '[role="option"]:not([disabled])',
        ].join(', ');

        const elements = Array.from(
            containerRef.current.querySelectorAll(focusableSelectors)
        ) as HTMLElement[];

        return elements.filter((element) => {
            const style = window.getComputedStyle(element);
            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                !element.hasAttribute('aria-hidden')
            );
        });
    }, []);

    // Update items list
    const updateItems = useCallback(() => {
        const elements = getFocusableElements();
        itemsRef.current = elements;
        setState((prev) => ({
            ...prev,
            totalItems: elements.length,
        }));
    }, [getFocusableElements]);

    // Announce changes to screen readers
    const announce = useCallback(
        (message: string) => {
            if (!announceChanges || !announceRef.current) return;

            announceRef.current.textContent = message;
            setTimeout(() => {
                if (announceRef.current) {
                    announceRef.current.textContent = '';
                }
            }, 1000);
        },
        [announceChanges]
    );

    // Focus element at index
    const focusIndex = useCallback(
        (index: number) => {
            const elements = itemsRef.current;
            if (index < 0 || index >= elements.length) return;

            const element = elements[index];
            element.focus();

            setState((prev) => ({
                ...prev,
                currentIndex: index,
                focusedElement: element,
            }));

            // Announce focus change
            const elementText =
                element.textContent ||
                element.getAttribute('aria-label') ||
                element.tagName.toLowerCase();
            announce(
                `Focused on ${elementText}, ${index + 1} of ${elements.length}`
            );
        },
        [announce]
    );

    // Navigate to next item
    const navigateNext = useCallback(() => {
        const nextIndex = state.currentIndex + 1;
        if (nextIndex < state.totalItems) {
            focusIndex(nextIndex);
        } else if (enableArrowKeys) {
            // Wrap to first item
            focusIndex(0);
        }
    }, [state.currentIndex, state.totalItems, focusIndex, enableArrowKeys]);

    // Navigate to previous item
    const navigatePrevious = useCallback(() => {
        const prevIndex = state.currentIndex - 1;
        if (prevIndex >= 0) {
            focusIndex(prevIndex);
        } else if (enableArrowKeys) {
            // Wrap to last item
            focusIndex(state.totalItems - 1);
        }
    }, [state.currentIndex, state.totalItems, focusIndex, enableArrowKeys]);

    // Navigate to first item
    const navigateFirst = useCallback(() => {
        if (state.totalItems > 0) {
            focusIndex(0);
        }
    }, [state.totalItems, focusIndex]);

    // Navigate to last item
    const navigateLast = useCallback(() => {
        if (state.totalItems > 0) {
            focusIndex(state.totalItems - 1);
        }
    }, [state.totalItems, focusIndex]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!state.isActive) return;

            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    if (enableArrowKeys) {
                        event.preventDefault();
                        navigateNext();
                    }
                    break;

                case 'ArrowUp':
                case 'ArrowLeft':
                    if (enableArrowKeys) {
                        event.preventDefault();
                        navigatePrevious();
                    }
                    break;

                case 'Home':
                    if (enableHomeEndKeys) {
                        event.preventDefault();
                        navigateFirst();
                    }
                    break;

                case 'End':
                    if (enableHomeEndKeys) {
                        event.preventDefault();
                        navigateLast();
                    }
                    break;

                case 'Enter':
                case ' ':
                    if (enableEnterActivation && state.focusedElement) {
                        event.preventDefault();
                        state.focusedElement.click();
                    }
                    break;

                case 'Escape':
                    if (enableEscapeHandling) {
                        event.preventDefault();
                        deactivate();
                    }
                    break;

                case 'Tab':
                    if (enableTabTrapping) {
                        event.preventDefault();
                        if (event.shiftKey) {
                            navigatePrevious();
                        } else {
                            navigateNext();
                        }
                    }
                    break;
            }
        },
        [
            state.isActive,
            state.focusedElement,
            enableArrowKeys,
            enableHomeEndKeys,
            enableEnterActivation,
            enableEscapeHandling,
            enableTabTrapping,
            navigateNext,
            navigatePrevious,
            navigateFirst,
            navigateLast,
        ]
    );

    // Activate keyboard navigation
    const activate = useCallback(
        (startIndex: number = 0) => {
            updateItems();
            setState((prev) => ({ ...prev, isActive: true }));

            if (itemsRef.current.length > 0) {
                focusIndex(
                    Math.max(
                        0,
                        Math.min(startIndex, itemsRef.current.length - 1)
                    )
                );
            }

            announce('Keyboard navigation activated');
        },
        [updateItems, focusIndex, announce]
    );

    // Deactivate keyboard navigation
    const deactivate = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isActive: false,
            currentIndex: -1,
            focusedElement: null,
        }));

        announce('Keyboard navigation deactivated');
    }, [announce]);

    // Set up event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Update items when container changes
    useEffect(() => {
        if (state.isActive) {
            updateItems();
        }
    }, [state.isActive, updateItems]);

    // Focus management for dynamic content
    const handleFocusIn = useCallback(
        (event: FocusEvent) => {
            if (!state.isActive) return;

            const target = event.target as HTMLElement;
            const elements = itemsRef.current;
            const index = elements.indexOf(target);

            if (index !== -1) {
                setState((prev) => ({
                    ...prev,
                    currentIndex: index,
                    focusedElement: target,
                }));
            }
        },
        [state.isActive]
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('focusin', handleFocusIn);

        return () => {
            container.removeEventListener('focusin', handleFocusIn);
        };
    }, [handleFocusIn]);

    return {
        containerRef,
        announceRef,
        state,
        activate,
        deactivate,
        navigateNext,
        navigatePrevious,
        navigateFirst,
        navigateLast,
        focusIndex,
        updateItems,
    };
}

export default useKeyboardNavigation;

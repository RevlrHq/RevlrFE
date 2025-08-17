import { useCallback, useRef, useEffect } from 'react';

interface FocusManagementOptions {
    restoreOnUnmount?: boolean;
    trapFocus?: boolean;
    autoFocus?: boolean;
    announceChanges?: boolean;
}

interface FocusState {
    previousFocus: HTMLElement | null;
    isTrapped: boolean;
    container: HTMLElement | null;
}

export function useFocusManagement({
    restoreOnUnmount = true,
    // trapFocus = false,
    autoFocus = false,
    announceChanges = true,
}: FocusManagementOptions = {}) {
    const stateRef = useRef<FocusState>({
        previousFocus: null,
        isTrapped: false,
        container: null,
    });

    const announceRef = useRef<HTMLDivElement>(null);

    // Announce changes to screen readers
    const announce = useCallback(
        (message: string, priority: 'polite' | 'assertive' = 'polite') => {
            if (!announceChanges || !announceRef.current) return;

            announceRef.current.setAttribute('aria-live', priority);
            announceRef.current.textContent = message;

            setTimeout(() => {
                if (announceRef.current) {
                    announceRef.current.textContent = '';
                }
            }, 1000);
        },
        [announceChanges]
    );

    // Get focusable elements within a container
    const getFocusableElements = useCallback(
        (container: HTMLElement): HTMLElement[] => {
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
                container.querySelectorAll(focusableSelectors)
            ) as HTMLElement[];

            return elements.filter((element) => {
                const style = window.getComputedStyle(element);
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    !element.hasAttribute('aria-hidden') &&
                    element.offsetParent !== null
                );
            });
        },
        []
    );

    // Save current focus
    const saveFocus = useCallback(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement !== document.body) {
            stateRef.current.previousFocus = activeElement;
        }
    }, []);

    // Restore previous focus
    const restoreFocus = useCallback(() => {
        const { previousFocus } = stateRef.current;
        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
            announce('Focus restored to previous element');
        }
    }, [announce]);

    // Focus first element in container
    const focusFirst = useCallback(
        (container: HTMLElement) => {
            const focusableElements = getFocusableElements(container);
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
                const elementText =
                    focusableElements[0].textContent ||
                    focusableElements[0].getAttribute('aria-label') ||
                    focusableElements[0].tagName.toLowerCase();
                announce(`Focused on first element: ${elementText}`);
            }
        },
        [getFocusableElements, announce]
    );

    // Focus last element in container
    const focusLast = useCallback(
        (container: HTMLElement) => {
            const focusableElements = getFocusableElements(container);
            if (focusableElements.length > 0) {
                const lastElement =
                    focusableElements[focusableElements.length - 1];
                lastElement.focus();
                const elementText =
                    lastElement.textContent ||
                    lastElement.getAttribute('aria-label') ||
                    lastElement.tagName.toLowerCase();
                announce(`Focused on last element: ${elementText}`);
            }
        },
        [getFocusableElements, announce]
    );

    // Focus specific element with announcement
    const focusElement = useCallback(
        (element: HTMLElement | null, message?: string) => {
            if (!element) return;

            element.focus();

            const elementText =
                message ||
                element.textContent ||
                element.getAttribute('aria-label') ||
                element.tagName.toLowerCase();

            announce(`Focused on ${elementText}`);
        },
        [announce]
    );

    // Trap focus within container
    const enableFocusTrap = useCallback(
        (container: HTMLElement) => {
            if (stateRef.current.isTrapped) return;

            saveFocus();
            stateRef.current.container = container;
            stateRef.current.isTrapped = true;

            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key !== 'Tab') return;

                const focusableElements = getFocusableElements(container);
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement =
                    focusableElements[focusableElements.length - 1];
                const activeElement = document.activeElement as HTMLElement;

                if (event.shiftKey) {
                    // Shift + Tab
                    if (activeElement === firstElement) {
                        event.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (activeElement === lastElement) {
                        event.preventDefault();
                        firstElement.focus();
                    }
                }
            };

            container.addEventListener('keydown', handleKeyDown);
            container.setAttribute('data-focus-trap', 'true');

            // Store cleanup function
            (container as unknown).__focusTrapCleanup = () => {
                container.removeEventListener('keydown', handleKeyDown);
                container.removeAttribute('data-focus-trap');
            };

            if (autoFocus) {
                focusFirst(container);
            }

            announce('Focus trap enabled');
        },
        [saveFocus, getFocusableElements, autoFocus, focusFirst, announce]
    );

    // Disable focus trap
    const disableFocusTrap = useCallback(() => {
        const { container } = stateRef.current;
        if (!container || !stateRef.current.isTrapped) return;

        // Call cleanup function if it exists
        if ((container as HTMLElement).__focusTrapCleanup) {
            (container as HTMLElement).__focusTrapCleanup();
            delete (container as HTMLElement).__focusTrapCleanup;
        }

        stateRef.current.isTrapped = false;
        stateRef.current.container = null;

        announce('Focus trap disabled');
    }, [announce]);

    // Handle focus within container
    const handleFocusWithin = useCallback(
        (
            container: HTMLElement,
            direction: 'next' | 'previous' | 'first' | 'last'
        ) => {
            const focusableElements = getFocusableElements(container);
            if (focusableElements.length === 0) return;

            const activeElement = document.activeElement as HTMLElement;
            const currentIndex = focusableElements.indexOf(activeElement);

            let targetIndex: number;

            switch (direction) {
                case 'next':
                    targetIndex =
                        currentIndex < focusableElements.length - 1
                            ? currentIndex + 1
                            : 0;
                    break;
                case 'previous':
                    targetIndex =
                        currentIndex > 0
                            ? currentIndex - 1
                            : focusableElements.length - 1;
                    break;
                case 'first':
                    targetIndex = 0;
                    break;
                case 'last':
                    targetIndex = focusableElements.length - 1;
                    break;
                default:
                    return;
            }

            focusElement(focusableElements[targetIndex]);
        },
        [getFocusableElements, focusElement]
    );

    // Create focus management for modal/dialog
    const createModalFocusManagement = useCallback(
        (modalElement: HTMLElement) => {
            const originalFocus = document.activeElement as HTMLElement;

            // Enable focus trap
            enableFocusTrap(modalElement);

            // Return cleanup function
            return () => {
                disableFocusTrap();
                if (originalFocus && document.contains(originalFocus)) {
                    originalFocus.focus();
                }
            };
        },
        [enableFocusTrap, disableFocusTrap]
    );

    // Create focus management for dropdown/menu
    const createMenuFocusManagement = useCallback(
        (menuElement: HTMLElement, triggerElement?: HTMLElement) => {
            const originalFocus =
                triggerElement || (document.activeElement as HTMLElement);

            // Focus first menu item
            focusFirst(menuElement);

            // Handle keyboard navigation
            const handleKeyDown = (event: KeyboardEvent) => {
                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        handleFocusWithin(menuElement, 'next');
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        handleFocusWithin(menuElement, 'previous');
                        break;
                    case 'Home':
                        event.preventDefault();
                        handleFocusWithin(menuElement, 'first');
                        break;
                    case 'End':
                        event.preventDefault();
                        handleFocusWithin(menuElement, 'last');
                        break;
                    case 'Escape':
                        event.preventDefault();
                        if (originalFocus && document.contains(originalFocus)) {
                            originalFocus.focus();
                        }
                        break;
                }
            };

            menuElement.addEventListener('keydown', handleKeyDown);

            // Return cleanup function
            return () => {
                menuElement.removeEventListener('keydown', handleKeyDown);
                if (originalFocus && document.contains(originalFocus)) {
                    originalFocus.focus();
                }
            };
        },
        [focusFirst, handleFocusWithin]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (restoreOnUnmount) {
                restoreFocus();
            }
            disableFocusTrap();
        };
    }, [restoreOnUnmount, restoreFocus, disableFocusTrap]);

    return {
        announceRef,
        saveFocus,
        restoreFocus,
        focusFirst,
        focusLast,
        focusElement,
        enableFocusTrap,
        disableFocusTrap,
        handleFocusWithin,
        createModalFocusManagement,
        createMenuFocusManagement,
        getFocusableElements,
        announce,
    };
}

export default useFocusManagement;

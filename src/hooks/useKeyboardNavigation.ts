import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
    onNext?: () => void;
    onPrevious?: () => void;
    onSave?: () => void;
    onPublish?: () => void;
    onEscape?: () => void;
    onEnter?: () => void;
    enableArrowKeys?: boolean;
    enableTabNavigation?: boolean;
    enableShortcuts?: boolean;
}

export function useKeyboardNavigation({
    onNext,
    onPrevious,
    onSave,
    onPublish,
    onEscape,
    onEnter,
    enableArrowKeys = true,
    enableTabNavigation = true,
    enableShortcuts = true,
}: KeyboardNavigationOptions = {}) {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't handle keyboard events when user is typing in inputs
            const target = event.target as HTMLElement;
            const isInputElement =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.contentEditable === 'true' ||
                target.closest('[contenteditable="true"]');

            // Handle shortcuts even in input elements (with modifiers)
            if (enableShortcuts && (event.ctrlKey || event.metaKey)) {
                switch (event.key.toLowerCase()) {
                    case 's':
                        event.preventDefault();
                        onSave?.();
                        return;
                    case 'enter':
                        if (event.shiftKey) {
                            event.preventDefault();
                            onPublish?.();
                            return;
                        }
                        break;
                }
            }

            // Don't handle other keys when in input elements
            if (isInputElement && !event.ctrlKey && !event.metaKey) {
                return;
            }

            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    if (enableArrowKeys && onNext) {
                        event.preventDefault();
                        onNext();
                    }
                    break;

                case 'ArrowLeft':
                case 'ArrowUp':
                    if (enableArrowKeys && onPrevious) {
                        event.preventDefault();
                        onPrevious();
                    }
                    break;

                case 'Escape':
                    if (onEscape) {
                        event.preventDefault();
                        onEscape();
                    }
                    break;

                case 'Enter':
                    if (!isInputElement && onEnter) {
                        event.preventDefault();
                        onEnter();
                    }
                    break;

                case 'Tab':
                    if (enableTabNavigation) {
                        // Let default tab behavior work, but we can add custom logic here
                        // For example, trapping focus within a modal
                        handleTabNavigation(event);
                    }
                    break;
            }
        },
        [
            onNext,
            onPrevious,
            onSave,
            onPublish,
            onEscape,
            onEnter,
            enableArrowKeys,
            enableTabNavigation,
            enableShortcuts,
        ]
    );

    const handleTabNavigation = useCallback((event: KeyboardEvent) => {
        if (!containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
            focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey) {
            // Shift + Tab (backward)
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement?.focus();
            }
        } else {
            // Tab (forward)
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement?.focus();
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Focus management utilities
    const focusFirstElement = useCallback(() => {
        if (!containerRef.current) return;

        const firstFocusable = containerRef.current.querySelector(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        firstFocusable?.focus();
    }, []);

    const focusLastElement = useCallback(() => {
        if (!containerRef.current) return;

        const focusableElements = containerRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const lastElement = focusableElements[
            focusableElements.length - 1
        ] as HTMLElement;
        lastElement?.focus();
    }, []);

    const trapFocus = useCallback((element: HTMLElement) => {
        const focusableElements = element.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
            focusableElements.length - 1
        ] as HTMLElement;

        const handleTrapKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        event.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        event.preventDefault();
                        firstElement?.focus();
                    }
                }
            }
        };

        element.addEventListener('keydown', handleTrapKeyDown);
        firstElement?.focus();

        return () => {
            element.removeEventListener('keydown', handleTrapKeyDown);
        };
    }, []);

    return {
        containerRef,
        focusFirstElement,
        focusLastElement,
        trapFocus,
    };
}

// Hook for managing focus announcements for screen readers
export function useFocusAnnouncement() {
    const announceRef = useRef<HTMLDivElement>(null);

    const announce = useCallback(
        (message: string, priority: 'polite' | 'assertive' = 'polite') => {
            if (announceRef.current) {
                announceRef.current.setAttribute('aria-live', priority);
                announceRef.current.textContent = message;

                // Clear the message after a short delay to allow for re-announcements
                setTimeout(() => {
                    if (announceRef.current) {
                        announceRef.current.textContent = '';
                    }
                }, 1000);
            }
        },
        []
    );

    return {
        announce,
        announceRef,
    };
}

export default useKeyboardNavigation;

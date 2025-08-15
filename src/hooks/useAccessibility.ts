import { useCallback, useEffect, useRef, useState } from 'react';

interface AccessibilityOptions {
    enableHighContrast?: boolean;
    enableReducedMotion?: boolean;
    enableFocusManagement?: boolean;
    enableScreenReaderSupport?: boolean;
    announceChanges?: boolean;
}

interface AccessibilityState {
    isHighContrast: boolean;
    isReducedMotion: boolean;
    isScreenReaderActive: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    colorScheme: 'light' | 'dark' | 'high-contrast';
}

export function useAccessibility({
    enableHighContrast = true,
    enableReducedMotion = true,
    enableFocusManagement = true,
    enableScreenReaderSupport = true,
    announceChanges = true,
}: AccessibilityOptions = {}) {
    const [state, setState] = useState<AccessibilityState>({
        isHighContrast: false,
        isReducedMotion: false,
        isScreenReaderActive: false,
        fontSize: 'medium',
        colorScheme: 'light',
    });

    const announceRef = useRef<HTMLDivElement>(null);
    const focusHistoryRef = useRef<HTMLElement[]>([]);

    // Detect system preferences
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const detectPreferences = () => {
            const prefersReducedMotion = window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches;
            const prefersHighContrast = window.matchMedia(
                '(prefers-contrast: high)'
            ).matches;
            const prefersColorScheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches
                ? 'dark'
                : 'light';

            setState((prev) => ({
                ...prev,
                isReducedMotion: prefersReducedMotion,
                isHighContrast: prefersHighContrast,
                colorScheme: prefersHighContrast
                    ? 'high-contrast'
                    : (prefersColorScheme as 'light' | 'dark'),
            }));
        };

        detectPreferences();

        // Listen for changes in system preferences
        const mediaQueries = [
            window.matchMedia('(prefers-reduced-motion: reduce)'),
            window.matchMedia('(prefers-contrast: high)'),
            window.matchMedia('(prefers-color-scheme: dark)'),
        ];

        mediaQueries.forEach((mq) =>
            mq.addEventListener('change', detectPreferences)
        );

        return () => {
            mediaQueries.forEach((mq) =>
                mq.removeEventListener('change', detectPreferences)
            );
        };
    }, []);

    // Detect screen reader usage
    useEffect(() => {
        if (!enableScreenReaderSupport) return;

        const detectScreenReader = () => {
            // Check for common screen reader indicators
            const hasScreenReader =
                navigator.userAgent.includes('NVDA') ||
                navigator.userAgent.includes('JAWS') ||
                navigator.userAgent.includes('VoiceOver') ||
                window.speechSynthesis?.speaking ||
                document.querySelector('[aria-live]') !== null;

            setState((prev) => ({
                ...prev,
                isScreenReaderActive: hasScreenReader,
            }));
        };

        detectScreenReader();

        // Check periodically for screen reader activity
        const interval = setInterval(detectScreenReader, 5000);
        return () => clearInterval(interval);
    }, [enableScreenReaderSupport]);

    // Apply accessibility styles
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;

        // Apply high contrast mode
        if (enableHighContrast && state.isHighContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Apply reduced motion
        if (enableReducedMotion && state.isReducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }

        // Apply font size
        root.classList.remove(
            'font-small',
            'font-medium',
            'font-large',
            'font-extra-large'
        );
        root.classList.add(`font-${state.fontSize}`);

        // Apply color scheme
        root.classList.remove('light', 'dark', 'high-contrast');
        root.classList.add(state.colorScheme);
    }, [state, enableHighContrast, enableReducedMotion]);

    // Announce changes to screen readers
    const announce = useCallback(
        (message: string, priority: 'polite' | 'assertive' = 'polite') => {
            if (!announceChanges || !announceRef.current) return;

            announceRef.current.setAttribute('aria-live', priority);
            announceRef.current.textContent = message;

            // Clear after announcement
            setTimeout(() => {
                if (announceRef.current) {
                    announceRef.current.textContent = '';
                }
            }, 1000);
        },
        [announceChanges]
    );

    // Focus management
    const manageFocus = useCallback(
        (element: HTMLElement | null) => {
            if (!enableFocusManagement || !element) return;

            // Store current focus for restoration
            const currentFocus = document.activeElement as HTMLElement;
            if (currentFocus && currentFocus !== document.body) {
                focusHistoryRef.current.push(currentFocus);
            }

            // Focus the new element
            element.focus();

            // Announce focus change
            const elementText =
                element.textContent ||
                element.getAttribute('aria-label') ||
                element.tagName;
            announce(`Focused on ${elementText}`);
        },
        [enableFocusManagement, announce]
    );

    // Restore previous focus
    const restoreFocus = useCallback(() => {
        if (!enableFocusManagement) return;

        const previousFocus = focusHistoryRef.current.pop();
        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
        }
    }, [enableFocusManagement]);

    // Trap focus within an element
    const trapFocus = useCallback(
        (container: HTMLElement) => {
            if (!enableFocusManagement) return () => {};

            const focusableElements = container.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[
                focusableElements.length - 1
            ] as HTMLElement;

            const handleKeyDown = (event: KeyboardEvent) => {
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

            container.addEventListener('keydown', handleKeyDown);
            firstElement?.focus();

            return () => {
                container.removeEventListener('keydown', handleKeyDown);
            };
        },
        [enableFocusManagement]
    );

    // Toggle high contrast mode
    const toggleHighContrast = useCallback(() => {
        setState((prev) => {
            const newHighContrast = !prev.isHighContrast;
            announce(
                newHighContrast
                    ? 'High contrast mode enabled'
                    : 'High contrast mode disabled'
            );
            return {
                ...prev,
                isHighContrast: newHighContrast,
                colorScheme: newHighContrast ? 'high-contrast' : 'light',
            };
        });
    }, [announce]);

    // Toggle reduced motion
    const toggleReducedMotion = useCallback(() => {
        setState((prev) => {
            const newReducedMotion = !prev.isReducedMotion;
            announce(
                newReducedMotion
                    ? 'Reduced motion enabled'
                    : 'Reduced motion disabled'
            );
            return {
                ...prev,
                isReducedMotion: newReducedMotion,
            };
        });
    }, [announce]);

    // Change font size
    const setFontSize = useCallback(
        (size: AccessibilityState['fontSize']) => {
            setState((prev) => ({ ...prev, fontSize: size }));
            announce(`Font size changed to ${size}`);
        },
        [announce]
    );

    // Change color scheme
    const setColorScheme = useCallback(
        (scheme: AccessibilityState['colorScheme']) => {
            setState((prev) => ({ ...prev, colorScheme: scheme }));
            announce(`Color scheme changed to ${scheme}`);
        },
        [announce]
    );

    // Get ARIA attributes for elements
    const getAriaAttributes = useCallback(
        (
            label?: string,
            description?: string,
            expanded?: boolean,
            selected?: boolean,
            disabled?: boolean
        ) => {
            const attributes: Record<string, string | boolean> = {};

            if (label) attributes['aria-label'] = label;
            if (description) attributes['aria-describedby'] = description;
            if (expanded !== undefined) attributes['aria-expanded'] = expanded;
            if (selected !== undefined) attributes['aria-selected'] = selected;
            if (disabled !== undefined) attributes['aria-disabled'] = disabled;

            return attributes;
        },
        []
    );

    // Create accessible button props
    const createButtonProps = useCallback(
        (
            label: string,
            onClick: () => void,
            options: {
                disabled?: boolean;
                pressed?: boolean;
                expanded?: boolean;
                describedBy?: string;
            } = {}
        ) => {
            return {
                'aria-label': label,
                onClick,
                onKeyDown: (event: React.KeyboardEvent) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onClick();
                    }
                },
                ...getAriaAttributes(
                    label,
                    options.describedBy,
                    options.expanded,
                    undefined,
                    options.disabled
                ),
                ...(options.pressed !== undefined && {
                    'aria-pressed': options.pressed,
                }),
            };
        },
        [getAriaAttributes]
    );

    return {
        state,
        announce,
        manageFocus,
        restoreFocus,
        trapFocus,
        toggleHighContrast,
        toggleReducedMotion,
        setFontSize,
        setColorScheme,
        getAriaAttributes,
        createButtonProps,
        announceRef,
    };
}

export default useAccessibility;

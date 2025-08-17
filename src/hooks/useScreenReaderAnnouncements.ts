import { useCallback, useRef, useEffect, useState } from 'react';

interface AnnouncementOptions {
    priority?: 'polite' | 'assertive';
    delay?: number;
    clearAfter?: number;
    deduplicate?: boolean;
}

interface AnnouncementState {
    isActive: boolean;
    lastAnnouncement: string;
    announcementCount: number;
}

export function useScreenReaderAnnouncements() {
    const [state, setState] = useState<AnnouncementState>({
        isActive: false,
        lastAnnouncement: '',
        announcementCount: 0,
    });

    const politeRef = useRef<HTMLDivElement>(null);
    const assertiveRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const announcementQueueRef = useRef<
        Array<{ message: string; options: AnnouncementOptions }>
    >([]);

    // Detect if screen reader is likely active
    const detectScreenReader = useCallback(() => {
        // Check for common screen reader indicators
        const hasScreenReader =
            navigator.userAgent.includes('NVDA') ||
            navigator.userAgent.includes('JAWS') ||
            navigator.userAgent.includes('VoiceOver') ||
            window.speechSynthesis?.speaking ||
            document.querySelector('[aria-live]') !== null ||
            // Check for high contrast mode (often used with screen readers)
            window.matchMedia('(prefers-contrast: high)').matches ||
            // Check for reduced motion (often used with screen readers)
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        setState((prev) => ({ ...prev, isActive: hasScreenReader }));
        return hasScreenReader;
    }, []);

    // Process announcement queue
    const processQueue = useCallback(() => {
        if (announcementQueueRef.current.length === 0) return;

        const { message, options } = announcementQueueRef.current.shift()!;
        const { priority = 'polite', delay = 0, clearAfter = 3000 } = options;

        const targetRef = priority === 'assertive' ? assertiveRef : politeRef;

        if (delay > 0) {
            setTimeout(() => {
                if (targetRef.current) {
                    targetRef.current.textContent = message;
                    setState((prev) => ({
                        ...prev,
                        lastAnnouncement: message,
                        announcementCount: prev.announcementCount + 1,
                    }));
                }
            }, delay);
        } else {
            if (targetRef.current) {
                targetRef.current.textContent = message;
                setState((prev) => ({
                    ...prev,
                    lastAnnouncement: message,
                    announcementCount: prev.announcementCount + 1,
                }));
            }
        }

        // Clear announcement after specified time
        if (clearAfter > 0) {
            setTimeout(() => {
                if (targetRef.current) {
                    targetRef.current.textContent = '';
                }
                // Process next item in queue
                processQueue();
            }, clearAfter);
        } else {
            // Process next item immediately
            setTimeout(processQueue, 100);
        }
    }, []);

    // Main announce function
    const announce = useCallback(
        (message: string, options: AnnouncementOptions = {}) => {
            if (!message.trim()) return;

            const { deduplicate = true } = options;

            // Skip if same message was just announced
            if (deduplicate && message === state.lastAnnouncement) {
                return;
            }

            // Add to queue
            announcementQueueRef.current.push({ message, options });

            // Start processing if queue was empty
            if (announcementQueueRef.current.length === 1) {
                processQueue();
            }
        },
        [state.lastAnnouncement, processQueue]
    );

    // Announce loading states
    const announceLoading = useCallback(
        (message: string = 'Loading') => {
            announce(`${message}...`, { priority: 'polite', clearAfter: 1000 });
        },
        [announce]
    );

    // Announce completion
    const announceComplete = useCallback(
        (message: string = 'Complete') => {
            announce(message, { priority: 'polite' });
        },
        [announce]
    );

    // Announce errors
    const announceError = useCallback(
        (message: string) => {
            announce(`Error: ${message}`, { priority: 'assertive' });
        },
        [announce]
    );

    // Announce success
    const announceSuccess = useCallback(
        (message: string) => {
            announce(`Success: ${message}`, { priority: 'polite' });
        },
        [announce]
    );

    // Announce navigation changes
    const announceNavigation = useCallback(
        (location: string, context?: string) => {
            const message = context
                ? `Navigated to ${location} in ${context}`
                : `Navigated to ${location}`;
            announce(message, { priority: 'polite' });
        },
        [announce]
    );

    // Announce data changes
    const announceDataChange = useCallback(
        (type: string, count?: number, action?: string) => {
            let message = '';

            if (count !== undefined) {
                message = `${count} ${type}${count !== 1 ? 's' : ''}`;
                if (action) {
                    message += ` ${action}`;
                }
            } else {
                message = `${type}${action ? ` ${action}` : ' updated'}`;
            }

            announce(message, { priority: 'polite', delay: 500 });
        },
        [announce]
    );

    // Announce form validation
    const announceValidation = useCallback(
        (field: string, error?: string) => {
            if (error) {
                announce(`${field}: ${error}`, { priority: 'assertive' });
            } else {
                announce(`${field} is valid`, { priority: 'polite' });
            }
        },
        [announce]
    );

    // Announce modal/dialog state
    const announceModal = useCallback(
        (action: 'opened' | 'closed', title?: string) => {
            const message = title
                ? `${title} dialog ${action}`
                : `Dialog ${action}`;
            announce(message, { priority: 'polite' });
        },
        [announce]
    );

    // Announce progress updates
    const announceProgress = useCallback(
        (current: number, total: number, task?: string) => {
            const percentage = Math.round((current / total) * 100);
            const message = task
                ? `${task}: ${percentage}% complete, ${current} of ${total}`
                : `${percentage}% complete, ${current} of ${total}`;

            announce(message, {
                priority: 'polite',
                deduplicate: false,
                clearAfter: 2000,
            });
        },
        [announce]
    );

    // Announce table/list updates
    const announceTableUpdate = useCallback(
        (action: string, itemType: string, count?: number) => {
            let message = '';

            if (count !== undefined) {
                message = `${count} ${itemType}${count !== 1 ? 's' : ''} ${action}`;
            } else {
                message = `${itemType} ${action}`;
            }

            announce(message, { priority: 'polite' });
        },
        [announce]
    );

    // Announce filter/search results
    const announceSearchResults = useCallback(
        (count: number, query?: string, filters?: string[]) => {
            let message = `${count} result${count !== 1 ? 's' : ''} found`;

            if (query) {
                message += ` for "${query}"`;
            }

            if (filters && filters.length > 0) {
                message += ` with filters: ${filters.join(', ')}`;
            }

            announce(message, { priority: 'polite', delay: 300 });
        },
        [announce]
    );

    // Clear all announcements
    const clearAnnouncements = useCallback(() => {
        if (politeRef.current) {
            politeRef.current.textContent = '';
        }
        if (assertiveRef.current) {
            assertiveRef.current.textContent = '';
        }

        // Clear timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Clear queue
        announcementQueueRef.current = [];

        setState((prev) => ({
            ...prev,
            lastAnnouncement: '',
        }));
    }, []);

    // Initialize screen reader detection
    useEffect(() => {
        detectScreenReader();

        // Listen for changes in accessibility preferences
        const mediaQueries = [
            window.matchMedia('(prefers-contrast: high)'),
            window.matchMedia('(prefers-reduced-motion: reduce)'),
        ];

        const handleChange = () => detectScreenReader();

        mediaQueries.forEach((mq) =>
            mq.addEventListener('change', handleChange)
        );

        return () => {
            mediaQueries.forEach((mq) =>
                mq.removeEventListener('change', handleChange)
            );
        };
    }, [detectScreenReader]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAnnouncements();
        };
    }, [clearAnnouncements]);

    return {
        politeRef,
        assertiveRef,
        state,
        announce,
        announceLoading,
        announceComplete,
        announceError,
        announceSuccess,
        announceNavigation,
        announceDataChange,
        announceValidation,
        announceModal,
        announceProgress,
        announceTableUpdate,
        announceSearchResults,
        clearAnnouncements,
        detectScreenReader,
    };
}

export default useScreenReaderAnnouncements;

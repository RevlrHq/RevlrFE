import { useRouter } from 'next/navigation';

/**
 * Navigation service for handling notification action URLs
 * Integrates with Next.js App Router for seamless navigation
 */
export class NavigationService {
    private static router: ReturnType<typeof useRouter> | null = null;

    /**
     * Initialize the navigation service with Next.js router
     * This should be called from a component that has access to useRouter
     */
    static initialize(router: ReturnType<typeof useRouter>): void {
        this.router = router;
    }

    /**
     * Navigate to a URL from notification action
     * Handles both internal and external URLs
     */
    static navigateToNotificationAction(actionUrl: string): void {
        if (!actionUrl) {
            console.warn('NavigationService: No action URL provided');
            return;
        }

        try {
            // Check if it's an external URL
            if (this.isExternalUrl(actionUrl)) {
                this.navigateToExternalUrl(actionUrl);
                return;
            }

            // Handle internal navigation
            this.navigateToInternalUrl(actionUrl);
        } catch (error) {
            console.debug(
                'NavigationService: Failed to navigate to action URL:',
                error
            );

            // Fallback to window.location for critical navigation
            if (typeof window !== 'undefined') {
                window.location.href = actionUrl;
            }
        }
    }

    /**
     * Navigate to internal URL using Next.js router
     */
    private static navigateToInternalUrl(url: string): void {
        if (!this.router) {
            // Fallback to window.location if router not available
            if (typeof window !== 'undefined') {
                window.location.href = url;
            }
            return;
        }

        // Clean the URL (remove leading slash if present for consistency)
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;

        // Use Next.js router for navigation
        this.router.push(cleanUrl);
    }

    /**
     * Navigate to external URL
     */
    private static navigateToExternalUrl(url: string): void {
        if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    /**
     * Check if URL is external
     */
    private static isExternalUrl(url: string): boolean {
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.origin !== window.location.origin;
        } catch {
            // If URL parsing fails, assume it's internal
            return false;
        }
    }

    /**
     * Navigate to event details page
     */
    static navigateToEvent(eventId: string): void {
        this.navigateToNotificationAction(`/events/${eventId}`);
    }

    /**
     * Navigate to organizer dashboard
     */
    static navigateToOrganizerDashboard(): void {
        this.navigateToNotificationAction('/dashboard');
    }

    /**
     * Navigate to event management page
     */
    static navigateToEventManagement(eventId: string): void {
        this.navigateToNotificationAction(`/dashboard/events/${eventId}`);
    }

    /**
     * Navigate to revenue page
     */
    static navigateToRevenue(eventId?: string): void {
        const url = eventId
            ? `/dashboard/revenue/${eventId}`
            : '/dashboard/revenue';
        this.navigateToNotificationAction(url);
    }

    /**
     * Navigate to registrations page
     */
    static navigateToRegistrations(eventId?: string): void {
        const url = eventId
            ? `/dashboard/registrations/${eventId}`
            : '/dashboard/registrations';
        this.navigateToNotificationAction(url);
    }

    /**
     * Navigate to financing page
     */
    static navigateToFinancing(applicationId?: string): void {
        const url = applicationId
            ? `/dashboard/financing/${applicationId}`
            : '/dashboard/financing';
        this.navigateToNotificationAction(url);
    }

    /**
     * Navigate to user profile
     */
    static navigateToProfile(): void {
        this.navigateToNotificationAction('/profile');
    }

    /**
     * Navigate to notifications page
     */
    static navigateToNotifications(): void {
        this.navigateToNotificationAction('/notifications');
    }

    /**
     * Navigate back to previous page
     */
    static navigateBack(): void {
        if (!this.router) {
            if (typeof window !== 'undefined') {
                window.history.back();
            }
            return;
        }

        this.router.back();
    }

    /**
     * Refresh current page
     */
    static refresh(): void {
        if (!this.router) {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
            return;
        }

        this.router.refresh();
    }

    /**
     * Get current pathname
     */
    static getCurrentPath(): string {
        if (typeof window !== 'undefined') {
            return window.location.pathname;
        }
        return '/';
    }

    /**
     * Check if currently on a specific path
     */
    static isCurrentPath(path: string): boolean {
        return this.getCurrentPath() === path;
    }

    /**
     * Check if currently on organizer dashboard
     */
    static isOnOrganizerDashboard(): boolean {
        const currentPath = this.getCurrentPath();
        return currentPath.startsWith('/dashboard');
    }

    /**
     * Check if currently on event page
     */
    static isOnEventPage(): boolean {
        const currentPath = this.getCurrentPath();
        return currentPath.startsWith('/events/');
    }

    /**
     * Parse notification action URL to determine navigation type
     */
    static parseNotificationAction(actionUrl: string): {
        type:
            | 'event'
            | 'dashboard'
            | 'revenue'
            | 'registrations'
            | 'financing'
            | 'profile'
            | 'notifications'
            | 'external'
            | 'unknown';
        id?: string;
        url: string;
    } {
        if (!actionUrl) {
            return { type: 'unknown', url: '' };
        }

        if (this.isExternalUrl(actionUrl)) {
            return { type: 'external', url: actionUrl };
        }

        // Parse internal URLs
        const cleanUrl = actionUrl.startsWith('/')
            ? actionUrl
            : `/${actionUrl}`;

        if (cleanUrl.startsWith('/events/')) {
            const eventId = cleanUrl.split('/')[2];
            return { type: 'event', id: eventId, url: cleanUrl };
        }

        if (cleanUrl.startsWith('/dashboard/revenue/')) {
            const eventId = cleanUrl.split('/')[3];
            return { type: 'revenue', id: eventId, url: cleanUrl };
        }

        if (cleanUrl.startsWith('/dashboard/registrations/')) {
            const eventId = cleanUrl.split('/')[3];
            return { type: 'registrations', id: eventId, url: cleanUrl };
        }

        if (cleanUrl.startsWith('/dashboard/financing/')) {
            const applicationId = cleanUrl.split('/')[3];
            return { type: 'financing', id: applicationId, url: cleanUrl };
        }

        if (cleanUrl.startsWith('/dashboard')) {
            return { type: 'dashboard', url: cleanUrl };
        }

        if (cleanUrl === '/profile') {
            return { type: 'profile', url: cleanUrl };
        }

        if (cleanUrl === '/notifications') {
            return { type: 'notifications', url: cleanUrl };
        }

        return { type: 'unknown', url: cleanUrl };
    }

    /**
     * Handle notification click with automatic navigation
     */
    static handleNotificationClick(
        actionUrl: string,
        notificationId?: string
    ): void {
        if (process.env.NODE_ENV === 'development') {
            console.log('NavigationService: Handling notification click', {
                actionUrl,
                notificationId,
                parsed: this.parseNotificationAction(actionUrl),
            });
        }

        // Navigate to the action URL
        this.navigateToNotificationAction(actionUrl);

        // Optional: Track notification click analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'notification_click', {
                notification_id: notificationId,
                action_url: actionUrl,
                navigation_type: this.parseNotificationAction(actionUrl).type,
            });
        }
    }
}

/**
 * React hook to initialize NavigationService with Next.js router
 * Use this in your root component or layout
 */
export function useNavigationServiceInit(): void {
    const router = useRouter();

    // Initialize the service with the router
    NavigationService.initialize(router);
}

/**
 * React hook to get navigation utilities
 */
export function useNavigationService() {
    const router = useRouter();

    // Ensure service is initialized
    NavigationService.initialize(router);

    return {
        navigateToNotificationAction:
            NavigationService.navigateToNotificationAction,
        navigateToEvent: NavigationService.navigateToEvent,
        navigateToOrganizerDashboard:
            NavigationService.navigateToOrganizerDashboard,
        navigateToEventManagement: NavigationService.navigateToEventManagement,
        navigateToRevenue: NavigationService.navigateToRevenue,
        navigateToRegistrations: NavigationService.navigateToRegistrations,
        navigateToFinancing: NavigationService.navigateToFinancing,
        navigateToProfile: NavigationService.navigateToProfile,
        navigateToNotifications: NavigationService.navigateToNotifications,
        navigateBack: NavigationService.navigateBack,
        refresh: NavigationService.refresh,
        getCurrentPath: NavigationService.getCurrentPath,
        isCurrentPath: NavigationService.isCurrentPath,
        isOnOrganizerDashboard: NavigationService.isOnOrganizerDashboard,
        isOnEventPage: NavigationService.isOnEventPage,
        parseNotificationAction: NavigationService.parseNotificationAction,
        handleNotificationClick: NavigationService.handleNotificationClick,
    };
}

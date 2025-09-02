/**
 * Lazy loading utilities for settings sections
 * Implements code splitting and dynamic imports for better performance
 */

import { lazy, ComponentType } from 'react';

/**
 * Lazy load settings components with error boundaries
 */
export function createLazySettingsComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: ComponentType
): ComponentType<any> {
    return lazy(importFn);
}

/**
 * Preload a component for better UX
 */
export const preloadComponent = (importFn: () => Promise<any>): void => {
    // Start loading the component in the background
    importFn().catch((error) => {
        console.warn('Failed to preload component:', error);
    });
};

/**
 * Lazy loaded settings sections
 */
export const LazySettingsSections = {
    Profile: createLazySettingsComponent(
        () => import('../../profile/components/ProfileSettings')
    ),
    Security: createLazySettingsComponent(
        () => import('../../security/components/SecuritySettings')
    ),
    Notifications: createLazySettingsComponent(
        () => import('../../notifications/NotificationSettings')
    ),
    Interface: createLazySettingsComponent(
        () => import('../../interface/InterfaceSettings')
    ),
    MediaProviders: createLazySettingsComponent(
        () => import('../../media-providers/MediaProviderSettings')
    ),
    DataExport: createLazySettingsComponent(
        () => import('../../data-export/components/DataExportSettings')
    ),
    Billing: createLazySettingsComponent(
        () => import('../../billing/BillingSettings')
    ),
    Account: createLazySettingsComponent(
        () => import('../../account/AccountSettings')
    ),
};

/**
 * Preload settings sections based on user behavior
 */
export const preloadSettingsSections = {
    /**
     * Preload commonly accessed sections
     */
    preloadCommon: () => {
        preloadComponent(
            () => import('../../profile/components/ProfileSettings')
        );
        preloadComponent(
            () => import('../../security/components/SecuritySettings')
        );
    },

    /**
     * Preload section when user hovers over navigation
     */
    preloadOnHover: (sectionName: string) => {
        const importMap: Record<string, () => Promise<any>> = {
            profile: () => import('../../profile/components/ProfileSettings'),
            security: () =>
                import('../../security/components/SecuritySettings'),
            notifications: () =>
                import('../../notifications/NotificationSettings'),
            interface: () => import('../../interface/InterfaceSettings'),
            'media-providers': () =>
                import('../../media-providers/MediaProviderSettings'),
            'data-export': () =>
                import('../../data-export/components/DataExportSettings'),
            billing: () => import('../../billing/BillingSettings'),
            account: () => import('../../account/AccountSettings'),
        };

        const importFn = importMap[sectionName];
        if (importFn) {
            preloadComponent(importFn);
        }
    },

    /**
     * Preload all sections for offline support
     */
    preloadAll: () => {
        Object.values(LazySettingsSections).forEach((component) => {
            // Components are already lazy, this will trigger their loading
            preloadComponent(() => Promise.resolve({ default: component }));
        });
    },
};

/**
 * Intersection Observer for lazy loading content
 */
export class LazyContentLoader {
    private observer: IntersectionObserver | null = null;
    private loadedElements = new Set<Element>();

    constructor(
        private onIntersect: (element: Element) => void,
        private options: IntersectionObserverInit = {
            rootMargin: '50px',
            threshold: 0.1,
        }
    ) {
        if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                options
            );
        }
    }

    /**
     * Observe an element for lazy loading
     */
    observe(element: Element): void {
        if (this.observer && !this.loadedElements.has(element)) {
            this.observer.observe(element);
        }
    }

    /**
     * Stop observing an element
     */
    unobserve(element: Element): void {
        if (this.observer) {
            this.observer.unobserve(element);
        }
    }

    /**
     * Disconnect the observer
     */
    disconnect(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        entries.forEach((entry) => {
            if (
                entry.isIntersecting &&
                !this.loadedElements.has(entry.target)
            ) {
                this.loadedElements.add(entry.target);
                this.onIntersect(entry.target);
                this.unobserve(entry.target);
            }
        });
    }
}

/**
 * Hook for lazy loading content
 */
export const useLazyContentLoader = (
    onIntersect: (element: Element) => void,
    options?: IntersectionObserverInit
) => {
    const loader = new LazyContentLoader(onIntersect, options);

    return {
        observe: loader.observe.bind(loader),
        unobserve: loader.unobserve.bind(loader),
        disconnect: loader.disconnect.bind(loader),
    };
};

/**
 * Prefetch resources for better performance
 */
export const prefetchResource = (
    url: string,
    type: 'script' | 'style' | 'image' = 'script'
): void => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = type;

    document.head.appendChild(link);
};

/**
 * Preconnect to external domains
 */
export const preconnectToDomain = (domain: string): void => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;

    document.head.appendChild(link);
};

/**
 * Resource hints for better performance
 */
export const initializeResourceHints = (): void => {
    // Preconnect to common external domains
    preconnectToDomain('https://api.unsplash.com');
    preconnectToDomain('https://images.unsplash.com');

    // Prefetch critical resources
    if (typeof window !== 'undefined') {
        // Prefetch after initial load
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloadSettingsSections.preloadCommon();
            }, 1000);
        });
    }
};

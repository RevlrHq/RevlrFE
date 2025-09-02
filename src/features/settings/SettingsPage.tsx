'use client';

import { useEffect, Suspense } from 'react';
import { SettingsLayout } from './components/SettingsLayout';
import { SettingsContent } from './components/SettingsContent';
import { useSettingsStore } from './stores';
import {
    LazySettingsSections,
    preloadSettingsSections,
} from './shared/utils/lazy-loading';
import { initializeCacheCleanup } from './shared/utils/caching';
import { initializeOfflineSupport } from './shared/utils/offline-support';
import { initializeBundleOptimization } from './shared/utils/bundle-optimization';
import type {
    SettingsPageProps,
    SettingsSectionId,
    SettingsNavigation,
} from './types';

/**
 * Main Settings Page Component
 *
 * This is the entry point for the user settings management feature.
 * It provides the overall layout and routing for different settings sections.
 */
export function SettingsPage({ user, section = 'profile' }: SettingsPageProps) {
    const {
        activeTab,
        setActiveTab,
        initialize,
        isInitialized,
        isLoading,
        error,
    } = useSettingsStore();

    // Navigation configuration
    const navigation: SettingsNavigation = {
        sections: [
            {
                id: 'profile',
                title: 'Profile',
                description: 'Manage your personal information',
                path: '/settings/profile',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'security',
                title: 'Security',
                description: 'Password and session management',
                path: '/settings/security',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'notifications',
                title: 'Notifications',
                description: 'Email and push notification preferences',
                path: '/settings/notifications',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'interface',
                title: 'Interface',
                description: 'Theme and layout preferences',
                path: '/settings/interface',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'media-providers',
                title: 'Media Providers',
                description: 'Connected media services',
                path: '/settings/media-providers',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'data-export',
                title: 'Data Export',
                description: 'Download your account data',
                path: '/settings/data-export',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'billing',
                title: 'Billing',
                description: 'Payment methods and invoices',
                path: '/settings/billing',
                isEnabled: true,
                requiresAuth: true,
            },
            {
                id: 'account',
                title: 'Account',
                description: 'Account deletion and data retention',
                path: '/settings/account',
                isEnabled: true,
                requiresAuth: true,
            },
        ],
        activeSection: activeTab,
    };

    // Initialize performance optimizations
    useEffect(() => {
        initializeCacheCleanup();
        initializeOfflineSupport();
        initializeBundleOptimization();

        // Preload common sections
        preloadSettingsSections.preloadCommon();
    }, []);

    // Initialize settings store and handle section prop changes
    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized, initialize]);

    useEffect(() => {
        if (section && section !== activeTab) {
            setActiveTab(section as SettingsSectionId);
        }
    }, [section, activeTab, setActiveTab]);

    const handleTabChange = (tab: SettingsSectionId) => {
        setActiveTab(tab);
        // In a real app, this would update the URL
        // router.push(`/settings/${tab}`);
    };

    const handleTabHover = (tab: SettingsSectionId) => {
        // Preload section on hover for better UX
        preloadSettingsSections.preloadOnHover(tab);
    };

    const renderContent = () => {
        const currentSection = navigation.sections.find(
            (s) => s.id === activeTab
        );

        // Render lazy-loaded components with suspense
        const renderLazySection = () => {
            const LoadingFallback = () => (
                <div className='flex items-center justify-center py-12'>
                    <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
                    <span className='ml-2 text-gray-600 dark:text-gray-400'>
                        Loading...
                    </span>
                </div>
            );

            switch (activeTab) {
                case 'profile':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.Profile user={user} />
                        </Suspense>
                    );
                case 'security':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.Security user={user} />
                        </Suspense>
                    );
                case 'notifications':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.Notifications user={user} />
                        </Suspense>
                    );
                case 'interface':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.Interface user={user} />
                        </Suspense>
                    );
                case 'media-providers':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.MediaProviders user={user} />
                        </Suspense>
                    );
                case 'data-export':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.DataExport user={user} />
                        </Suspense>
                    );
                case 'billing':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.Billing user={user} />
                        </Suspense>
                    );
                case 'account':
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LazySettingsSections.Account user={user} />
                        </Suspense>
                    );
                default:
                    return (
                        <div className='py-12 text-center'>
                            <h3 className='mb-2 text-lg font-medium text-gray-900 dark:text-white'>
                                {currentSection?.title} Settings
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400'>
                                This section will be implemented in subsequent
                                tasks.
                            </p>
                        </div>
                    );
            }
        };

        return (
            <SettingsContent
                title={currentSection?.title}
                description={currentSection?.description}
            >
                {renderLazySection()}
            </SettingsContent>
        );
    };

    return (
        <SettingsLayout
            navigation={navigation}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onTabHover={handleTabHover}
            user={user}
        >
            {renderContent()}
        </SettingsLayout>
    );
}

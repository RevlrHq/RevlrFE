'use client';

import { useState, useCallback } from 'react';

export type SettingsTab =
    | 'profile'
    | 'security'
    | 'notifications'
    | 'interface'
    | 'media-providers'
    | 'data-export'
    | 'billing'
    | 'account';

interface UseSettingsNavigationReturn {
    activeTab: SettingsTab;
    setActiveTab: (tab: SettingsTab) => void;
    isTabActive: (tab: SettingsTab) => boolean;
    getNextTab: () => SettingsTab | null;
    getPreviousTab: () => SettingsTab | null;
}

const TAB_ORDER: SettingsTab[] = [
    'profile',
    'security',
    'notifications',
    'interface',
    'media-providers',
    'data-export',
    'billing',
    'account',
];

export function useSettingsNavigation(
    initialTab: SettingsTab = 'profile'
): UseSettingsNavigationReturn {
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    const isTabActive = useCallback(
        (tab: SettingsTab) => activeTab === tab,
        [activeTab]
    );

    const getNextTab = useCallback(() => {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const nextIndex = currentIndex + 1;
        return nextIndex < TAB_ORDER.length ? TAB_ORDER[nextIndex] : null;
    }, [activeTab]);

    const getPreviousTab = useCallback(() => {
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        const previousIndex = currentIndex - 1;
        return previousIndex >= 0 ? TAB_ORDER[previousIndex] : null;
    }, [activeTab]);

    return {
        activeTab,
        setActiveTab,
        isTabActive,
        getNextTab,
        getPreviousTab,
    };
}

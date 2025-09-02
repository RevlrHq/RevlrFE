import { useEffect, useCallback, useState } from 'react';
import { usePreferencesStore } from '../../stores/preferencesStore';
import type {
    InterfacePreferences,
    ThemeSettings,
    LayoutSettings,
    DefaultViewSettings,
    LanguageSettings,
    DateTimeSettings,
    LocaleOption,
    CustomTheme,
} from '../types';

/**
 * useInterfacePreferences Hook
 *
 * Provides interface for managing user interface preferences including:
 * - Theme and appearance settings
 * - Layout preferences
 * - Default view configurations
 * - Language and localization
 * - Date/time formatting
 *
 * Features:
 * - Automatic theme application
 * - Persistent storage
 * - Validation and error handling
 * - Optimistic updates
 *
 * Requirements: 4.2, 4.3, 4.5
 */
export function useInterfacePreferences() {
    const {
        interface: preferences,
        isLoading,
        isUpdating,
        error,
        updateInterface,
        loadPreferences,
        setError,
    } = usePreferencesStore();

    // Load preferences on mount
    useEffect(() => {
        if (!preferences) {
            loadPreferences();
        }
    }, [preferences, loadPreferences]);

    // Convert store preferences to component format
    const getThemeSettings = useCallback((): ThemeSettings => {
        return {
            mode: preferences?.theme || 'system',
            primaryColor: '#3b82f6', // Default primary color
            accentColor: '#06b6d4', // Default accent color
        };
    }, [preferences?.theme]);

    const getLayoutSettings = useCallback((): LayoutSettings => {
        return {
            sidebarCollapsed: preferences?.sidebarCollapsed || false,
            compactMode: preferences?.dashboardLayout === 'compact',
            showQuickActions: preferences?.showWelcomeMessages || true,
            dashboardLayout: preferences?.dashboardLayout || 'comfortable',
        };
    }, [preferences]);

    const getDefaultViewSettings = useCallback((): DefaultViewSettings => {
        return {
            dashboardView: 'overview',
            eventListView: preferences?.defaultEventView || 'grid',
            attendeeView: 'table',
            revenueView: preferences?.defaultAnalyticsView || 'overview',
        };
    }, [preferences]);

    const getLanguageSettings = useCallback((): LanguageSettings => {
        return {
            locale: preferences?.language || 'en-US',
            currency: preferences?.currency || 'USD',
            timezone: 'America/New_York', // Default timezone
        };
    }, [preferences]);

    const getDateTimeSettings = useCallback((): DateTimeSettings => {
        return {
            dateFormat: preferences?.dateFormat || 'MM/DD/YYYY',
            timeFormat: preferences?.timeFormat || '12h',
            firstDayOfWeek: 'sunday',
        };
    }, [preferences]);

    /**
     * Update theme settings
     */
    const updateTheme = useCallback(
        async (theme: ThemeSettings) => {
            try {
                await updateInterface({
                    theme: theme.mode,
                });
            } catch (error) {
                console.error('Failed to update theme:', error);
                throw error;
            }
        },
        [updateInterface]
    );

    /**
     * Update layout preferences
     */
    const updateLayout = useCallback(
        async (layout: LayoutSettings) => {
            try {
                await updateInterface({
                    sidebarCollapsed: layout.sidebarCollapsed,
                    dashboardLayout: layout.dashboardLayout,
                    showWelcomeMessages: layout.showQuickActions,
                });
            } catch (error) {
                console.error('Failed to update layout:', error);
                throw error;
            }
        },
        [updateInterface]
    );

    /**
     * Update default view settings
     */
    const updateDefaultViews = useCallback(
        async (defaultViews: DefaultViewSettings) => {
            try {
                await updateInterface({
                    defaultEventView: defaultViews.eventListView,
                    defaultAnalyticsView: defaultViews.revenueView,
                });
            } catch (error) {
                console.error('Failed to update default views:', error);
                throw error;
            }
        },
        [updateInterface]
    );

    /**
     * Update language settings
     */
    const updateLanguage = useCallback(
        async (language: LanguageSettings) => {
            try {
                await updateInterface({
                    language: language.locale,
                    currency: language.currency,
                });
            } catch (error) {
                console.error('Failed to update language:', error);
                throw error;
            }
        },
        [updateInterface]
    );

    /**
     * Update date/time format settings
     */
    const updateDateTime = useCallback(
        async (dateTime: DateTimeSettings) => {
            try {
                await updateInterface({
                    dateFormat: dateTime.dateFormat,
                    timeFormat: dateTime.timeFormat,
                });
            } catch (error) {
                console.error('Failed to update date/time format:', error);
                throw error;
            }
        },
        [updateInterface]
    );

    /**
     * Reset to default preferences
     */
    const resetToDefaults = useCallback(async () => {
        const defaultPreferences: Partial<InterfacePreferences> = {
            theme: 'system',
            dashboardLayout: 'comfortable',
            defaultEventView: 'grid',
            defaultAnalyticsView: 'overview',
            sidebarCollapsed: false,
            showWelcomeMessages: true,
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            currency: 'USD',
            language: 'en-US',
        };

        await updateInterface(defaultPreferences);
    }, [updateInterface]);

    // Mock data for available themes and locales
    const [availableThemes] = useState<CustomTheme[]>([
        {
            name: 'Default Blue',
            colors: {
                primary: '#3b82f6',
                secondary: '#64748b',
                accent: '#06b6d4',
                background: '#ffffff',
                surface: '#f8fafc',
                text: '#0f172a',
            },
        },
        {
            name: 'Forest Green',
            colors: {
                primary: '#10b981',
                secondary: '#64748b',
                accent: '#f59e0b',
                background: '#ffffff',
                surface: '#f0fdf4',
                text: '#0f172a',
            },
        },
    ]);

    const [availableLocales] = useState<LocaleOption[]>([
        {
            code: 'en-US',
            name: 'English (US)',
            nativeName: 'English',
            currency: 'USD',
            timezone: 'America/New_York',
        },
        {
            code: 'en-GB',
            name: 'English (UK)',
            nativeName: 'English',
            currency: 'GBP',
            timezone: 'Europe/London',
        },
        {
            code: 'es-ES',
            name: 'Spanish',
            nativeName: 'Español',
            currency: 'EUR',
            timezone: 'Europe/Madrid',
        },
        {
            code: 'fr-FR',
            name: 'French',
            nativeName: 'Français',
            currency: 'EUR',
            timezone: 'Europe/Paris',
        },
    ]);

    return {
        // Data - convert store format to component format
        preferences: preferences
            ? {
                  theme: getThemeSettings(),
                  layout: getLayoutSettings(),
                  defaultViews: getDefaultViewSettings(),
                  language: getLanguageSettings(),
                  dateTime: getDateTimeSettings(),
              }
            : null,
        availableThemes,
        availableLocales,

        // Loading states
        isLoading,
        isUpdating,
        error,

        // Actions
        updateTheme,
        updateLayout,
        updateDefaultViews,
        updateLanguage,
        updateDateTime,
        resetToDefaults,
        refresh: loadPreferences,
    };
}

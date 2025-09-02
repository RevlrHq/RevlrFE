import type {
    InterfacePreferences,
    InterfaceUpdateRequest,
    LocaleOption,
    CustomTheme,
} from '../types/interface';

/**
 * InterfaceService - Service class for interface preference operations
 *
 * Handles all interface customization operations including:
 * - Theme and appearance settings
 * - Layout preferences
 * - Default view configurations
 * - Language and localization settings
 * - Date/time format preferences
 *
 * Requirements: 4.2, 4.3, 4.5
 */
export class InterfaceService {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Get current interface preferences
     */
    async getPreferences(): Promise<InterfacePreferences> {
        try {
            const response = await fetch(`${this.baseUrl}/settings/interface`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch preferences: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('InterfaceService.getPreferences error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to load interface preferences'
            );
        }
    }

    /**
     * Update interface preferences
     */
    async updatePreferences(
        updates: Partial<InterfacePreferences>
    ): Promise<InterfacePreferences> {
        try {
            // Validate input data
            this.validatePreferences(updates);

            const response = await fetch(`${this.baseUrl}/settings/interface`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ preferences: updates }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Update failed: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('InterfaceService.updatePreferences error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update interface preferences'
            );
        }
    }

    /**
     * Get available themes
     */
    async getAvailableThemes(): Promise<CustomTheme[]> {
        try {
            const response = await fetch(`${this.baseUrl}/settings/themes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch themes: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('InterfaceService.getAvailableThemes error:', error);
            // Return default themes if API fails
            return this.getDefaultThemes();
        }
    }

    /**
     * Get available locales
     */
    async getAvailableLocales(): Promise<LocaleOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/settings/locales`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch locales: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('InterfaceService.getAvailableLocales error:', error);
            // Return default locales if API fails
            return this.getDefaultLocales();
        }
    }

    /**
     * Apply theme immediately to the document
     */
    applyTheme(theme: InterfacePreferences['theme']): void {
        const root = document.documentElement;

        // Remove existing theme classes
        root.classList.remove('light', 'dark');

        if (theme.mode === 'system') {
            // Use system preference
            const prefersDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
            ).matches;
            root.classList.add(prefersDark ? 'dark' : 'light');
        } else {
            root.classList.add(theme.mode);
        }

        // Apply custom colors if available
        if (theme.primaryColor) {
            root.style.setProperty('--primary-color', theme.primaryColor);
        }
        if (theme.accentColor) {
            root.style.setProperty('--accent-color', theme.accentColor);
        }
    }

    /**
     * Validate interface preferences
     */
    private validatePreferences(
        preferences: Partial<InterfacePreferences>
    ): void {
        const errors: Record<string, string> = {};

        // Validate theme settings
        if (preferences.theme) {
            const { mode, primaryColor, accentColor } = preferences.theme;

            if (mode && !['light', 'dark', 'system'].includes(mode)) {
                errors.themeMode = 'Invalid theme mode';
            }

            if (primaryColor && !this.isValidColor(primaryColor)) {
                errors.primaryColor = 'Invalid primary color format';
            }

            if (accentColor && !this.isValidColor(accentColor)) {
                errors.accentColor = 'Invalid accent color format';
            }
        }

        // Validate layout settings
        if (preferences.layout) {
            const { dashboardLayout } = preferences.layout;

            if (
                dashboardLayout &&
                !['grid', 'list', 'cards'].includes(dashboardLayout)
            ) {
                errors.dashboardLayout = 'Invalid dashboard layout';
            }
        }

        // Validate default views
        if (preferences.defaultViews) {
            const validViews = {
                dashboardView: ['overview', 'events', 'analytics', 'revenue'],
                eventListView: ['grid', 'list', 'calendar'],
                attendeeView: ['table', 'cards'],
                revenueView: ['summary', 'detailed', 'charts'],
            };

            Object.entries(validViews).forEach(([key, validOptions]) => {
                const value =
                    preferences.defaultViews?.[
                        key as keyof typeof preferences.defaultViews
                    ];
                if (value && !validOptions.includes(value)) {
                    errors[key] = `Invalid ${key} option`;
                }
            });
        }

        // Validate date/time settings
        if (preferences.dateTime) {
            const { dateFormat, timeFormat, firstDayOfWeek } =
                preferences.dateTime;

            if (
                dateFormat &&
                !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(dateFormat)
            ) {
                errors.dateFormat = 'Invalid date format';
            }

            if (timeFormat && !['12h', '24h'].includes(timeFormat)) {
                errors.timeFormat = 'Invalid time format';
            }

            if (
                firstDayOfWeek &&
                !['sunday', 'monday'].includes(firstDayOfWeek)
            ) {
                errors.firstDayOfWeek = 'Invalid first day of week';
            }
        }

        if (Object.keys(errors).length > 0) {
            const error = new Error('Validation failed') as Error & {
                validationErrors: Record<string, string>;
            };
            error.validationErrors = errors;
            throw error;
        }
    }

    /**
     * Validate color format (hex)
     */
    private isValidColor(color: string): boolean {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    /**
     * Get default themes
     */
    private getDefaultThemes(): CustomTheme[] {
        return [
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
        ];
    }

    /**
     * Get default locales
     */
    private getDefaultLocales(): LocaleOption[] {
        return [
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
        ];
    }
}

// Export singleton instance
export const interfaceService = new InterfaceService();

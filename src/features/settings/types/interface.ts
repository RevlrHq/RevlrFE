/**
 * Interface settings types and interfaces
 *
 * Note: These types extend the existing InterfacePreferences from the store
 * to provide more detailed component-level interfaces while maintaining compatibility
 */

// Extended interface preferences for component use
export interface ExtendedInterfacePreferences {
    theme: ThemeSettings;
    layout: LayoutSettings;
    defaultViews: DefaultViewSettings;
    language: LanguageSettings;
    dateTime: DateTimeSettings;
}

// Core interface preferences (matches store structure)
export interface InterfacePreferences {
    theme: 'light' | 'dark' | 'system';
    dashboardLayout: 'compact' | 'comfortable' | 'spacious';
    defaultEventView: 'grid' | 'list' | 'table';
    defaultAnalyticsView: 'overview' | 'detailed' | 'custom';
    sidebarCollapsed: boolean;
    showWelcomeMessages: boolean;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    currency: string;
    language: string;
}

export interface ThemeSettings {
    mode: 'light' | 'dark' | 'system';
    primaryColor: string;
    accentColor: string;
    customTheme?: CustomTheme;
}

export interface CustomTheme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: string;
    };
}

export interface LayoutSettings {
    sidebarCollapsed: boolean;
    compactMode: boolean;
    showQuickActions: boolean;
    dashboardLayout: 'compact' | 'comfortable' | 'spacious';
}

export interface DefaultViewSettings {
    dashboardView: 'overview' | 'events' | 'analytics' | 'revenue';
    eventListView: 'grid' | 'list' | 'table';
    attendeeView: 'table' | 'cards';
    revenueView: 'overview' | 'detailed' | 'custom';
}

export interface LanguageSettings {
    locale: string;
    currency: string;
    timezone: string;
}

export interface DateTimeSettings {
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 'sunday' | 'monday';
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type DashboardLayout = 'grid' | 'list' | 'cards';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';

export interface ThemeSelectorProps {
    currentTheme: ThemeSettings;
    onChange: (theme: ThemeSettings) => void;
    availableThemes: CustomTheme[];
}

export interface LayoutPreferencesProps {
    settings: LayoutSettings;
    onChange: (settings: LayoutSettings) => void;
}

export interface DefaultViewsProps {
    settings: DefaultViewSettings;
    onChange: (settings: DefaultViewSettings) => void;
}

export interface LanguageSelectorProps {
    settings: LanguageSettings;
    onChange: (settings: LanguageSettings) => void;
    availableLocales: LocaleOption[];
}

export interface DateTimeFormatProps {
    settings: DateTimeSettings;
    onChange: (settings: DateTimeSettings) => void;
}

export interface LocaleOption {
    code: string;
    name: string;
    nativeName: string;
    currency: string;
    timezone: string;
}

export interface InterfaceUpdateRequest {
    preferences: Partial<InterfacePreferences>;
    userId: string;
}

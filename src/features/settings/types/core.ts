import type { UserView } from '@lib/api';

/**
 * Core settings types and interfaces
 */

export interface SettingsSection {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    path: string;
    isEnabled: boolean;
    requiresAuth: boolean;
}

export interface SettingsNavigation {
    sections: SettingsSection[];
    activeSection: string;
}

export interface SettingsFormState<T = Record<string, unknown>> {
    data: T;
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
}

export interface SettingsValidationRule {
    field: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
}

export interface SettingsFormConfig {
    validationRules: SettingsValidationRule[];
    submitEndpoint: string;
    successMessage: string;
    errorMessage: string;
}

export interface SettingsPageProps {
    user: UserView;
    section?: string;
}

export interface SettingsLayoutProps {
    children: React.ReactNode;
    navigation: SettingsNavigation;
    user: UserView;
    activeTab: SettingsSectionId;
    onTabChange: (tab: SettingsSectionId) => void;
    onTabHover?: (tab: SettingsSectionId) => void;
}

export interface SettingsNavigationProps {
    navigation: SettingsNavigation;
    activeTab: SettingsSectionId;
    onTabChange: (tab: SettingsSectionId) => void;
    onTabHover?: (tab: SettingsSectionId) => void;
    user: UserView;
}

export interface SettingsContentProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export type SettingsSectionId =
    | 'profile'
    | 'security'
    | 'notifications'
    | 'interface'
    | 'media-providers'
    | 'data-export'
    | 'billing'
    | 'account';

export interface SettingsResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string>;
}

export interface SettingsUpdateRequest<T = Record<string, unknown>> {
    section: SettingsSectionId;
    data: T;
    userId: string;
}

'use client';

import React from 'react';
import { SettingsSection } from '../shared/components/SettingsSection';
import { SettingsCard } from '../shared/components/SettingsCard';
import {
    ThemeSelector,
    LayoutPreferences,
    DefaultViews,
    LanguageSelector,
    DateTimeFormat,
} from './components';
import { useInterfacePreferences } from './hooks/useInterfacePreferences';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';
import { ErrorMessage } from '../shared/components/ErrorMessage';

interface InterfaceSettingsProps {
    className?: string;
}

function InterfaceSettings({ className }: InterfaceSettingsProps) {
    const {
        preferences,
        isLoading,
        error,
        updateTheme,
        updateLayout,
        updateDefaultViews,
        updateLanguage,
        updateDateTime,
        availableThemes,
        availableLocales,
    } = useInterfacePreferences();

    if (isLoading) {
        return (
            <div className='flex items-center justify-center py-8'>
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <ErrorMessage
                message={typeof error === 'string' ? error : error.message}
            />
        );
    }

    if (!preferences) {
        return <ErrorMessage message='Failed to load interface preferences' />;
    }

    return (
        <div className={className}>
            <SettingsSection title='Interface Customization'>
                <SettingsCard
                    title='Theme & Appearance'
                    description='Customize the visual appearance of your dashboard'
                >
                    <ThemeSelector
                        currentTheme={preferences.theme}
                        onChange={updateTheme}
                        availableThemes={availableThemes}
                    />
                </SettingsCard>

                <SettingsCard
                    title='Layout Preferences'
                    description='Configure how your dashboard is organized'
                >
                    <LayoutPreferences
                        settings={preferences.layout}
                        onChange={updateLayout}
                    />
                </SettingsCard>

                <SettingsCard
                    title='Default Views'
                    description='Set your preferred default views for different sections'
                >
                    <DefaultViews
                        settings={preferences.defaultViews}
                        onChange={updateDefaultViews}
                    />
                </SettingsCard>

                <SettingsCard
                    title='Language & Region'
                    description='Configure language, currency, and timezone settings'
                >
                    <LanguageSelector
                        settings={preferences.language}
                        onChange={updateLanguage}
                        availableLocales={availableLocales}
                    />
                </SettingsCard>

                <SettingsCard
                    title='Date & Time Format'
                    description='Customize how dates and times are displayed'
                >
                    <DateTimeFormat
                        settings={preferences.dateTime}
                        onChange={updateDateTime}
                    />
                </SettingsCard>
            </SettingsSection>
        </div>
    );
}

// Default export for lazy loading
export default InterfaceSettings;

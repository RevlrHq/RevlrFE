'use client';

import React from 'react';
import { ConnectedProviders } from './components/ConnectedProviders';
import { SettingsCard } from '../shared/components/SettingsCard';
import { useMediaProviders } from './hooks/useMediaProviders';

interface MediaProviderSettingsProps {
    className?: string;
}

/**
 * Main container for media provider settings
 * Allows users to manage external media service integrations
 */
function MediaProviderSettings({
    className,
}: MediaProviderSettingsProps) {
    const {
        providers,
        isLoading,
        connectProvider,
        disconnectProvider,
        refreshProvider,
        error,
    } = useMediaProviders();

    return (
        <div className={className}>
            <SettingsCard
                title='Media Provider Integrations'
                description='Connect external media services to enhance your event content creation'
            >
                <ConnectedProviders
                    providers={providers}
                    onConnect={connectProvider}
                    onDisconnect={disconnectProvider}
                    onRefresh={refreshProvider}
                    isLoading={isLoading}
                />
                {error && (
                    <div className='mt-4 rounded-md border border-red-200 bg-red-50 p-3'>
                        <p className='text-sm text-red-600'>{error}</p>
                    </div>
                )}
            </SettingsCard>
        </div>
    );
}

// Default export for lazy loading
export default MediaProviderSettings;

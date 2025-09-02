'use client';

import React from 'react';
import { SettingsSection } from '../shared/components/SettingsSection';
import { AccountInfo } from './components/AccountInfo';
import { DataRetention } from './components/DataRetention';
import { DangerZone } from './components/DangerZone';
import { useAccountInfo } from './hooks/useAccountInfo';
import { useAccountDeletion } from './hooks/useAccountDeletion';

interface AccountSettingsProps {
    className?: string;
}

function AccountSettings({ className }: AccountSettingsProps) {
    const {
        accountInfo,
        isLoading: isAccountLoading,
        refreshAccountInfo,
    } = useAccountInfo();

    const {
        requestDeletion,
        cancelDeletion,
        exportData,
        deletionRequest,
        isLoading: isDeletionLoading,
        hasActiveSubscription,
    } = useAccountDeletion();

    const handleRequestDeletion = () => {
        // This will open the deletion confirmation dialog
        requestDeletion();
    };

    const handleExportData = () => {
        exportData();
    };

    if (isAccountLoading) {
        return (
            <div className='flex items-center justify-center py-8'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600' />
            </div>
        );
    }

    return (
        <div className={className}>
            <SettingsSection title='Account Management'>
                {accountInfo && (
                    <AccountInfo
                        accountInfo={accountInfo}
                        onRefresh={refreshAccountInfo}
                        isLoading={isAccountLoading}
                    />
                )}

                <DataRetention />

                <DangerZone
                    onRequestDeletion={handleRequestDeletion}
                    onExportData={handleExportData}
                    hasActiveSubscription={hasActiveSubscription}
                    hasPendingDeletion={!!deletionRequest}
                />
            </SettingsSection>
        </div>
    );
}

// Default export for lazy loading
export default AccountSettings;

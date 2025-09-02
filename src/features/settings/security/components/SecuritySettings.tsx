'use client';

import React from 'react';
import { SettingsSection } from '../../shared/components/SettingsSection';
import { SettingsCard } from '../../shared/components/SettingsCard';
import { EmailChangeForm } from './EmailChangeForm';
import { PasswordSettings } from './PasswordSettings';
import { SessionManager } from './SessionManager';
import { useSessionManager } from '../hooks/useSessionManager';
import { useEmailChange } from '../hooks/useEmailChange';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';

interface SecuritySettingsProps {
    className?: string;
}

function SecuritySettings({ className }: SecuritySettingsProps) {
    const {
        sessions,
        isLoading: sessionsLoading,
        error: sessionsError,
        terminateSession,
        terminateAllSessions,
        refreshSessions,
    } = useSessionManager();

    const {
        changeEmail,
        isLoading: emailLoading,
        error: emailError,
        clearError: clearEmailError,
    } = useEmailChange();

    // Mock current user email - in real app this would come from auth context
    const currentEmail = 'user@example.com';
    const lastPasswordChange = new Date('2024-01-15');

    const handlePasswordChange = async (request: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }) => {
        // This would be implemented in a password change hook
        console.log('Password change requested:', request);
    };

    if (sessionsLoading) {
        return (
            <div className={className}>
                <LoadingSpinner text='Loading security settings...' />
            </div>
        );
    }

    return (
        <div className={className}>
            <SettingsSection title='Security Settings'>
                {/* Email Change Section */}
                <SettingsCard
                    title='Email Address'
                    description="Change your account email address. You'll need to verify both your current and new email addresses."
                >
                    {emailError && (
                        <ErrorMessage
                            message={emailError}
                            onDismiss={clearEmailError}
                        />
                    )}
                    <EmailChangeForm
                        currentEmail={currentEmail}
                        onSubmit={changeEmail}
                        isLoading={emailLoading}
                    />
                </SettingsCard>

                {/* Password Settings Section */}
                <SettingsCard
                    title='Password'
                    description='Update your password to keep your account secure.'
                >
                    <PasswordSettings
                        lastPasswordChange={lastPasswordChange}
                        onChangePassword={handlePasswordChange}
                        isLoading={false}
                    />
                </SettingsCard>

                {/* Session Management Section */}
                <SettingsCard
                    title='Active Sessions'
                    description='Manage your active login sessions across different devices and browsers.'
                >
                    {sessionsError && (
                        <ErrorMessage
                            message={sessionsError}
                            onDismiss={refreshSessions}
                        />
                    )}
                    <SessionManager
                        sessions={sessions}
                        onTerminateSession={terminateSession}
                        onTerminateAll={terminateAllSessions}
                        isLoading={sessionsLoading}
                    />
                </SettingsCard>
            </SettingsSection>
        </div>
    );
}

// Default export for lazy loading
export default SecuritySettings;

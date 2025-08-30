'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuthStore } from '@src/stores/authStore';
import { VendorAuthUtils } from '@lib/utils/vendorAuth';
// import { DraftBackupService } from '@lib/services/DraftBackupService';
import { useSessionManagement } from '@hooks/useSessionManagement';
import SessionWarningModal from '@components/SessionWarningModal';

interface VendorAuthContextType {
    isVendor: boolean;
    hasVendorAccess: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    sessionInfo: {
        isExpired: boolean;
        minutesUntilExpiry: number | null;
        lastActivity: number;
    };
    extendSession: () => Promise<boolean>;
    checkVendorAccess: () => boolean;
    getRedirectPath: (currentPath?: string) => { path: string; reason: string };
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(
    undefined
);

interface VendorAuthProviderProps {
    children: ReactNode;
}

export const VendorAuthProvider = ({ children }: VendorAuthProviderProps) => {
    const { user, token, isAuthenticated, _hasHydrated } = useAuthStore();
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [warningMinutes, setWarningMinutes] = useState(0);

    // Session management with callbacks
    const { sessionInfo, extendSession, updateActivity } = useSessionManagement(
        {
            onSessionExpired: () => {
                console.log('Session expired in VendorAuthProvider');
                setShowSessionWarning(false);
            },
            onSessionWarning: (minutesLeft) => {
                console.log(`Session warning: ${minutesLeft} minutes left`);
                setWarningMinutes(minutesLeft);
                setShowSessionWarning(true);
            },
            warningThresholdMinutes: 5,
            checkIntervalSeconds: 60,
            enableDraftBackup: true,
        }
    );

    // Use the auth store's hydration state instead of arbitrary delay
    const isLoading = !_hasHydrated;

    // Vendor access checks
    const isVendor = VendorAuthUtils.isVendor(user);
    const hasVendorAccess = VendorAuthUtils.hasVendorAccess(user, token);

    const checkVendorAccess = (): boolean => {
        return VendorAuthUtils.hasVendorAccess(user, token);
    };

    const getRedirectPath = (
        currentPath: string = ''
    ): { path: string; reason: string } => {
        return VendorAuthUtils.getRedirectInfo(user, token, currentPath);
    };

    const handleExtendSession = async (): Promise<boolean> => {
        try {
            const success = await extendSession();
            if (success) {
                setShowSessionWarning(false);
                updateActivity();
            }
            return success;
        } catch (error) {
            console.debug('Failed to extend session:', error);
            return false;
        }
    };

    const handleLogout = () => {
        setShowSessionWarning(false);
        // The session management hook will handle the actual logout
    };

    const handleCloseWarning = () => {
        setShowSessionWarning(false);
    };

    const contextValue: VendorAuthContextType = {
        isVendor,
        hasVendorAccess,
        isAuthenticated,
        isLoading,
        sessionInfo,
        extendSession: handleExtendSession,
        checkVendorAccess,
        getRedirectPath,
    };

    return (
        <VendorAuthContext.Provider value={contextValue}>
            {children}

            {/* Session Warning Modal */}
            <SessionWarningModal
                isOpen={showSessionWarning}
                minutesLeft={warningMinutes}
                onExtendSession={handleExtendSession}
                onLogout={handleLogout}
                onClose={handleCloseWarning}
            />
        </VendorAuthContext.Provider>
    );
};

export const useVendorAuth = (): VendorAuthContextType => {
    const context = useContext(VendorAuthContext);
    if (context === undefined) {
        throw new Error(
            'useVendorAuth must be used within a VendorAuthProvider'
        );
    }
    return context;
};

export default VendorAuthProvider;

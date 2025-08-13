import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@src/stores/authStore';
import { DraftBackupService } from '@lib/services/DraftBackupService';

interface SessionManagementOptions {
    onSessionExpired?: () => void;
    onSessionWarning?: (minutesLeft: number) => void;
    warningThresholdMinutes?: number;
    checkIntervalSeconds?: number;
    enableDraftBackup?: boolean;
}

interface SessionInfo {
    isExpired: boolean;
    minutesUntilExpiry: number | null;
    lastActivity: number;
}

export const useSessionManagement = (
    options: SessionManagementOptions = {}
) => {
    const {
        onSessionExpired,
        onSessionWarning,
        warningThresholdMinutes = 5,
        checkIntervalSeconds = 60,
        enableDraftBackup = true,
    } = options;

    const router = useRouter();
    const { token, isAuthenticated, logout } = useAuthStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const warningShownRef = useRef<boolean>(false);

    // Update last activity timestamp
    const updateActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
        warningShownRef.current = false;
    }, []);

    // Check if session is expired based on token
    const checkSessionExpiry = useCallback((): SessionInfo => {
        if (!token || !isAuthenticated) {
            return {
                isExpired: true,
                minutesUntilExpiry: null,
                lastActivity: lastActivityRef.current,
            };
        }

        try {
            // Decode JWT token to get expiration time
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();
            const timeUntilExpiry = expirationTime - currentTime;
            const minutesUntilExpiry = Math.floor(
                timeUntilExpiry / (1000 * 60)
            );

            return {
                isExpired: timeUntilExpiry <= 0,
                minutesUntilExpiry:
                    minutesUntilExpiry > 0 ? minutesUntilExpiry : 0,
                lastActivity: lastActivityRef.current,
            };
        } catch (error) {
            console.warn('Failed to decode token:', error);
            return {
                isExpired: true,
                minutesUntilExpiry: null,
                lastActivity: lastActivityRef.current,
            };
        }
    }, [token, isAuthenticated]);

    // Handle session expiration
    const handleSessionExpired = useCallback(() => {
        console.log('Session expired, handling cleanup...');

        // Save draft if enabled and we're on an event creation page
        if (enableDraftBackup && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (
                currentPath.includes('/create-event') ||
                currentPath.includes('/event/create')
            ) {
                DraftBackupService.saveDraftOnAuthExpiration();
            }
        }

        // Call custom handler if provided
        if (onSessionExpired) {
            onSessionExpired();
        }

        // Logout user
        logout();

        // Redirect to login with return URL
        const currentPath = window.location.pathname;
        router.push(
            `/auth/login?returnUrl=${encodeURIComponent(currentPath)}&reason=session_expired`
        );
    }, [enableDraftBackup, onSessionExpired, logout, router]);

    // Handle session warning
    const handleSessionWarning = useCallback(
        (minutesLeft: number) => {
            if (!warningShownRef.current) {
                console.log(
                    `Session warning: ${minutesLeft} minutes remaining`
                );
                warningShownRef.current = true;

                if (onSessionWarning) {
                    onSessionWarning(minutesLeft);
                }
            }
        },
        [onSessionWarning]
    );

    // Main session check function
    const performSessionCheck = useCallback(() => {
        const sessionInfo = checkSessionExpiry();

        if (sessionInfo.isExpired) {
            handleSessionExpired();
            return;
        }

        if (
            sessionInfo.minutesUntilExpiry !== null &&
            sessionInfo.minutesUntilExpiry <= warningThresholdMinutes
        ) {
            handleSessionWarning(sessionInfo.minutesUntilExpiry);
        }
    }, [
        checkSessionExpiry,
        handleSessionExpired,
        handleSessionWarning,
        warningThresholdMinutes,
    ]);

    // Set up activity listeners
    useEffect(() => {
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
        ];

        const handleActivity = () => {
            updateActivity();
        };

        // Add event listeners
        activityEvents.forEach((event) => {
            document.addEventListener(event, handleActivity, true);
        });

        // Cleanup
        return () => {
            activityEvents.forEach((event) => {
                document.removeEventListener(event, handleActivity, true);
            });
        };
    }, [updateActivity]);

    // Set up session checking interval
    useEffect(() => {
        if (!isAuthenticated || !token) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Perform initial check
        performSessionCheck();

        // Set up interval for periodic checks
        intervalRef.current = setInterval(() => {
            performSessionCheck();
        }, checkIntervalSeconds * 1000);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isAuthenticated, token, performSessionCheck, checkIntervalSeconds]);

    // Extend session function (for when user wants to stay logged in)
    const extendSession = useCallback(async () => {
        try {
            // This would typically make an API call to refresh the token
            // For now, we'll just update the activity timestamp
            updateActivity();

            // In a real implementation, you might call a refresh token endpoint
            // const newToken = await refreshToken();
            // setUser(user, newToken);

            console.log('Session extended');
            return true;
        } catch (error) {
            console.error('Failed to extend session:', error);
            return false;
        }
    }, [updateActivity]);

    // Get current session info
    const getSessionInfo = useCallback((): SessionInfo => {
        return checkSessionExpiry();
    }, [checkSessionExpiry]);

    return {
        sessionInfo: getSessionInfo(),
        extendSession,
        updateActivity,
        isSessionActive: isAuthenticated && !getSessionInfo().isExpired,
    };
};

export default useSessionManagement;

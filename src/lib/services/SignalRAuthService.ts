import { useAuthStore } from '@/stores/authStore';
import { AuthService } from './AuthService';
import type { SignalRError, SignalRErrorType } from '@/types/signalr';

/**
 * SignalR Authentication Service
 * Handles JWT token management for SignalR connections
 */
export class SignalRAuthService {
    private static readonly TOKEN_REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds
    private static refreshPromise: Promise<string | null> | null = null;

    /**
     * JWT token factory for SignalR connections
     * This function is called by SignalR when establishing connections
     */
    static createTokenFactory(): () => string | Promise<string> {
        return async (): Promise<string> => {
            try {
                // Get current token from auth store
                const { token, isAuthenticated } = useAuthStore.getState();

                if (!isAuthenticated || !token) {
                    throw new Error('User is not authenticated');
                }

                // Check if token needs refresh
                const refreshedToken = await this.ensureTokenIsValid(token);

                if (!refreshedToken) {
                    throw new Error(
                        'Failed to obtain valid authentication token'
                    );
                }

                return refreshedToken;
            } catch (error) {
                console.debug('SignalR token factory error:', error);
                throw error;
            }
        };
    }

    /**
     * Ensure the token is valid and refresh if necessary
     */
    private static async ensureTokenIsValid(
        currentToken: string
    ): Promise<string | null> {
        try {
            // Check if token is close to expiration
            if (this.isTokenNearExpiration(currentToken)) {
                // Use existing refresh promise if one is in progress
                if (this.refreshPromise) {
                    return await this.refreshPromise;
                }

                // Start new refresh process
                this.refreshPromise = this.refreshTokenSafely();
                const refreshedToken = await this.refreshPromise;
                this.refreshPromise = null;

                return refreshedToken || currentToken;
            }

            return currentToken;
        } catch (error) {
            console.debug('Token validation error:', error);
            return currentToken; // Return current token as fallback
        }
    }

    /**
     * Check if token is near expiration
     */
    private static isTokenNearExpiration(token: string): boolean {
        try {
            const payload = this.decodeJWTPayload(token);
            if (!payload || !payload.exp) {
                return false;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = payload.exp - currentTime;

            return timeUntilExpiry <= this.TOKEN_REFRESH_THRESHOLD;
        } catch (error) {
            console.debug('Error checking token expiration:', error);
            return false;
        }
    }

    /**
     * Safely refresh the token with error handling
     */
    private static async refreshTokenSafely(): Promise<string | null> {
        try {
            const success = await AuthService.refreshToken();
            if (success) {
                const { token } = useAuthStore.getState();
                return token;
            }
            return null;
        } catch (error) {
            console.debug('Token refresh failed:', error);
            return null;
        }
    }

    /**
     * Handle authentication failures in SignalR context
     */
    static async handleAuthenticationFailure(
        error: Error
    ): Promise<SignalRError> {
        console.debug('SignalR authentication failure:', error);

        // Try to refresh token once
        try {
            const success = await AuthService.refreshTokenIfNeeded();
            if (success) {
                return {
                    type: 'authentication' as SignalRErrorType,
                    message: 'Authentication token refreshed, retry connection',
                    originalError: error,
                    timestamp: new Date(),
                    retryable: true,
                };
            }
        } catch (refreshError) {
            console.debug(
                'Token refresh failed during auth failure:',
                refreshError
            );
        }

        // If refresh failed, handle as unrecoverable auth error
        await this.handleUnrecoverableAuthError();

        return {
            type: 'authentication' as SignalRErrorType,
            message: 'Authentication failed and token refresh unsuccessful',
            originalError: error,
            timestamp: new Date(),
            retryable: false,
        };
    }

    /**
     * Handle unrecoverable authentication errors
     */
    private static async handleUnrecoverableAuthError(): Promise<void> {
        try {
            // Clear authentication state
            await AuthService.logout();

            // Redirect to login if in browser
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath !== '/auth/login') {
                    localStorage.setItem('redirectAfterLogin', currentPath);
                    localStorage.setItem('signalrAuthFailure', 'true');
                }

                // Small delay to allow state updates
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 100);
            }
        } catch (error) {
            console.debug('Error handling unrecoverable auth error:', error);
        }
    }

    /**
     * Check if user is authenticated for SignalR
     */
    static isAuthenticated(): boolean {
        const { isAuthenticated, token } = useAuthStore.getState();
        return isAuthenticated && !!token;
    }

    /**
     * Get current user ID for group management
     */
    static getCurrentUserId(): string | null {
        const { user, isAuthenticated } = useAuthStore.getState();
        return isAuthenticated && user ? user.id : null;
    }

    /**
     * Get current user role for group management
     */
    static getCurrentUserRole(): string | null {
        const { user, isAuthenticated } = useAuthStore.getState();
        return isAuthenticated && user ? user.role || null : null;
    }

    /**
     * Get user context for SignalR connection
     */
    static getUserContext(): {
        userId: string | null;
        role: string | null;
        isAuthenticated: boolean;
    } {
        const { user, isAuthenticated } = useAuthStore.getState();

        return {
            userId: isAuthenticated && user ? user.id : null,
            role: isAuthenticated && user ? user.role || null : null,
            isAuthenticated,
        };
    }

    /**
     * Validate token format and structure
     */
    static validateTokenFormat(token: string): boolean {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }

            const payload = this.decodeJWTPayload(token);
            return !!(payload && payload.exp && payload.sub);
        } catch {
            return false;
        }
    }

    /**
     * Get token expiration time
     */
    static getTokenExpiration(token: string): Date | null {
        try {
            const payload = this.decodeJWTPayload(token);
            if (payload && payload.exp) {
                return new Date(payload.exp * 1000);
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    static isTokenExpired(token: string): boolean {
        try {
            const expiration = this.getTokenExpiration(token);
            if (!expiration) {
                return true;
            }
            return expiration.getTime() <= Date.now();
        } catch {
            return true;
        }
    }

    /**
     * Decode JWT payload
     */
    private static decodeJWTPayload(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(
                        (c) =>
                            '%' +
                            ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                    )
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.debug('Error decoding JWT payload:', error);
            return null;
        }
    }

    /**
     * Subscribe to auth state changes for SignalR reconnection
     */
    static subscribeToAuthChanges(
        onAuthChange: (isAuthenticated: boolean, userId: string | null) => void
    ): () => void {
        return useAuthStore.subscribe((state, prevState) => {
            // Notify on authentication status change
            if (state.isAuthenticated !== prevState.isAuthenticated) {
                const userId = state.user?.id || null;
                onAuthChange(state.isAuthenticated, userId);
            }

            // Notify on user change (different user logged in)
            if (state.user?.id !== prevState.user?.id) {
                const userId = state.user?.id || null;
                onAuthChange(state.isAuthenticated, userId);
            }
        });
    }

    /**
     * Clear any cached refresh promises (useful for testing)
     */
    static clearRefreshPromise(): void {
        this.refreshPromise = null;
    }
}

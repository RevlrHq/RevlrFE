import { OpenAPI } from '../api/core/OpenAPI';
import { PasswordlessAuthService } from '../api/services/PasswordlessAuthService';
import { useAuthStore } from '../../stores/authStore';

/**
 * Authentication service that manages API authentication tokens
 */
export class AuthService {
    private static initialized = false;

    /**
     * Initialize the authentication service
     * This should be called once when the app starts
     */
    static initialize(): void {
        if (this.initialized) return;

        // Set up token resolver that gets token from auth store
        OpenAPI.TOKEN = () => {
            const token = useAuthStore.getState().token;
            return Promise.resolve(token || '');
        };

        this.initialized = true;
    }

    /**
     * Update the API token
     * This is called when user logs in or token changes
     */
    static setToken(token: string | null): void {
        // Ensure the service is initialized
        this.initialize();

        // Update the OpenAPI token resolver
        OpenAPI.TOKEN = () => Promise.resolve(token || '');
    }

    /**
     * Clear the API token
     * This is called when user logs out
     */
    static clearToken(): void {
        OpenAPI.TOKEN = undefined;
    }

    /**
     * Get current token from auth store
     */
    static getCurrentToken(): string | null {
        return useAuthStore.getState().token;
    }

    /**
     * Check if user is authenticated
     */
    static isAuthenticated(): boolean {
        return useAuthStore.getState().isAuthenticated;
    }

    /**
     * Set up automatic token synchronization with auth store
     * This ensures the API token is always in sync with the auth store
     */
    static setupTokenSync(): void {
        this.initialize();

        // Subscribe to auth store changes
        useAuthStore.subscribe((state, prevState) => {
            // Update token when it changes
            if (state.token !== prevState.token) {
                this.setToken(state.token);
            }

            // Clear token when user logs out
            if (prevState.isAuthenticated && !state.isAuthenticated) {
                this.clearToken();
            }
        });
    }

    /**
     * Manually sync token from auth store
     * Useful for ensuring token is up to date
     */
    static syncToken(): void {
        const { token, isAuthenticated } = useAuthStore.getState();

        if (isAuthenticated && token) {
            this.setToken(token);
        } else {
            this.clearToken();
        }
    }

    /**
     * Handle authentication errors
     * This can be called when API returns 401 to handle token expiration
     */
    static async handleAuthError(): Promise<void> {
        // Try to refresh the token first
        const refreshed = await this.refreshToken();

        if (!refreshed) {
            // If refresh failed, clear tokens and logout user
            this.clearToken();
            useAuthStore.getState().logout();

            // Optionally redirect to login page
            if (typeof window !== 'undefined') {
                // Save current page for redirect after login
                const currentPath = window.location.pathname;
                if (currentPath !== '/auth/login') {
                    localStorage.setItem('redirectAfterLogin', currentPath);
                }

                // Redirect to login
                window.location.href = '/auth/login';
            }
        }
    }

    /**
     * Refresh the access token using the refresh token
     */
    static async refreshToken(): Promise<boolean> {
        const { refreshToken, isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated || !refreshToken) {
            return false;
        }

        try {
            const response =
                await PasswordlessAuthService.postApiPasswordlessAuthRefresh({
                    requestBody: { refreshToken },
                });

            if (response.data && response.data.token) {
                // Update tokens in the store
                const newToken = response.data.token;
                const newRefreshToken =
                    response.data.refreshToken || refreshToken;

                useAuthStore.getState().updateTokens(newToken, newRefreshToken);

                return true;
            }

            return false;
        } catch (error) {
            console.debug('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Refresh token if needed
     * This checks if the current token is close to expiration and refreshes it
     */
    static async refreshTokenIfNeeded(): Promise<boolean> {
        const { token, refreshToken, isAuthenticated } =
            useAuthStore.getState();

        if (!isAuthenticated || !token || !refreshToken) {
            return false;
        }

        try {
            // Decode the JWT token to check expiration
            const tokenPayload = this.decodeJWT(token);
            if (!tokenPayload || !tokenPayload.exp) {
                return false;
            }

            // Check if token expires within the next 5 minutes
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = tokenPayload.exp - currentTime;
            const refreshThreshold = 5 * 60; // 5 minutes in seconds

            if (timeUntilExpiry <= refreshThreshold) {
                return await this.refreshToken();
            }

            return true;
        } catch (error) {
            console.debug('Error checking token expiration:', error);
            return false;
        }
    }

    /**
     * Get token expiration time
     * Used by SignalR for token management
     */
    static getTokenExpiration(token?: string): Date | null {
        const tokenToCheck = token || this.getCurrentToken();
        if (!tokenToCheck) {
            return null;
        }

        try {
            const payload = this.decodeJWT(tokenToCheck);
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
     * Used by SignalR for token validation
     */
    static isTokenExpired(token?: string): boolean {
        const tokenToCheck = token || this.getCurrentToken();
        if (!tokenToCheck) {
            return true;
        }

        try {
            const expiration = this.getTokenExpiration(tokenToCheck);
            if (!expiration) {
                return true;
            }
            return expiration.getTime() <= Date.now();
        } catch {
            return true;
        }
    }

    /**
     * Check if token is near expiration (within threshold)
     * Used by SignalR for proactive token refresh
     */
    static isTokenNearExpiration(
        token?: string,
        thresholdSeconds: number = 300
    ): boolean {
        const tokenToCheck = token || this.getCurrentToken();
        if (!tokenToCheck) {
            return true;
        }

        try {
            const payload = this.decodeJWT(tokenToCheck);
            if (!payload || !payload.exp) {
                return true;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = payload.exp - currentTime;

            return timeUntilExpiry <= thresholdSeconds;
        } catch {
            return true;
        }
    }

    /**
     * Get user context for SignalR
     * Returns user information needed for SignalR group management
     */
    static getUserContext(): {
        userId: string | null;
        role: string | null;
        isAuthenticated: boolean;
        email: string | null;
    } {
        const { user, isAuthenticated } = useAuthStore.getState();

        return {
            userId: isAuthenticated && user ? user.id : null,
            role: isAuthenticated && user ? user.role || null : null,
            isAuthenticated,
            email: isAuthenticated && user ? user.email || null : null,
        };
    }

    /**
     * Validate token format and structure
     * Used by SignalR for token validation
     */
    static validateTokenFormat(token?: string): boolean {
        const tokenToCheck = token || this.getCurrentToken();
        if (!tokenToCheck) {
            return false;
        }

        try {
            const parts = tokenToCheck.split('.');
            if (parts.length !== 3) {
                return false;
            }

            const payload = this.decodeJWT(tokenToCheck);
            return !!(payload && payload.exp && payload.sub);
        } catch {
            return false;
        }
    }

    /**
     * Revoke the refresh token
     */
    static async revokeRefreshToken(): Promise<boolean> {
        const { refreshToken } = useAuthStore.getState();

        if (!refreshToken) {
            return true; // No token to revoke
        }

        try {
            await PasswordlessAuthService.postApiPasswordlessAuthRevoke({
                requestBody: { refreshToken },
            });
            return true;
        } catch (error) {
            console.debug('Token revocation failed:', error);
            return false;
        }
    }

    /**
     * Logout and revoke refresh token
     */
    static async logout(): Promise<void> {
        // Revoke the refresh token on the server
        await this.revokeRefreshToken();

        // Clear local state
        this.clearToken();
        useAuthStore.getState().logout();
    }

    /**
     * Decode JWT token payload
     */
    private static decodeJWT(token: string): unknown {
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
            console.debug('Error decoding JWT:', error);
            return null;
        }
    }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
    AuthService.initialize();
    AuthService.setupTokenSync();
}

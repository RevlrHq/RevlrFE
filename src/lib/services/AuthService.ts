import { OpenAPI } from '../api/core/OpenAPI';
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
    static handleAuthError(): void {
        // Clear the token and logout user
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

    /**
     * Refresh token if needed
     * This is a placeholder for token refresh logic
     */
    static async refreshTokenIfNeeded(): Promise<boolean> {
        const { token, isAuthenticated } = useAuthStore.getState();

        if (!isAuthenticated || !token) {
            return false;
        }

        // TODO: Implement token refresh logic if your API supports it
        // For now, just return true if we have a token
        return true;
    }
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
    AuthService.initialize();
    AuthService.setupTokenSync();
}

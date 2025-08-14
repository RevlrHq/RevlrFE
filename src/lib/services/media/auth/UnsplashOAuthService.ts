import { MediaProviderError, MediaProviderErrorType } from '@/types/media-search';

export interface UnsplashOAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: string[];
}

export interface UnsplashTokenResponse {
    access_token: string;
    token_type: 'bearer';
    scope: string;
    created_at: number;
}

export interface UnsplashAuthState {
    isAuthenticated: boolean;
    accessToken?: string;
    scopes?: string[];
    user?: UnsplashUser;
    expiresAt?: number;
}

export interface UnsplashUser {
    id: string;
    username: string;
    name: string;
    first_name: string;
    last_name?: string;
    email?: string;
    profile_image: {
        small: string;
        medium: string;
        large: string;
    };
    links: {
        self: string;
        html: string;
        photos: string;
        likes: string;
        portfolio: string;
    };
}

/**
 * Handles OAuth2 authentication flow for Unsplash API
 */
export class UnsplashOAuthService {
    private config: UnsplashOAuthConfig;
    private authState: UnsplashAuthState = { isAuthenticated: false };
    private readonly baseUrl = 'https://unsplash.com/oauth';
    private readonly apiUrl = 'https://api.unsplash.com';
    private readonly storageKey = 'unsplash_auth_state';

    constructor(config: UnsplashOAuthConfig) {
        this.config = config;
        this.loadAuthState();
    }

    /**
     * Generate the authorization URL for OAuth2 flow
     */
    getAuthorizationUrl(state?: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: (this.config.scopes || ['public', 'read_user']).join('+'),
        });

        if (state) {
            params.set('state', state);
        }

        return `${this.baseUrl}/authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string): Promise<UnsplashTokenResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    redirect_uri: this.config.redirectUri,
                    code,
                    grant_type: 'authorization_code',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Token exchange failed: ${response.status} ${response.statusText}. ${
                        errorData.error_description || errorData.error || ''
                    }`
                );
            }

            const tokenData: UnsplashTokenResponse = await response.json();
            
            // Update auth state
            this.authState = {
                isAuthenticated: true,
                accessToken: tokenData.access_token,
                scopes: tokenData.scope.split(' '),
            };

            // Fetch user profile
            await this.fetchUserProfile();
            
            // Save to storage
            this.saveAuthState();

            return tokenData;
        } catch (error) {
            throw this.createError(
                MediaProviderErrorType.API_KEY_INVALID,
                `Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Fetch the current user's profile
     */
    async fetchUserProfile(): Promise<UnsplashUser> {
        if (!this.authState.accessToken) {
            throw this.createError(
                MediaProviderErrorType.API_KEY_INVALID,
                'No access token available'
            );
        }

        try {
            const response = await fetch(`${this.apiUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${this.authState.accessToken}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const user: UnsplashUser = await response.json();
            this.authState.user = user;
            this.saveAuthState();

            return user;
        } catch (error) {
            throw this.createError(
                MediaProviderErrorType.NETWORK_ERROR,
                `Failed to fetch user profile: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Revoke the current access token
     */
    async revokeToken(): Promise<void> {
        if (!this.authState.accessToken) {
            return;
        }

        try {
            // Unsplash doesn't have a revoke endpoint, so we just clear local state
            this.clearAuthState();
        } catch (error) {
            // Log error but don't throw - we still want to clear local state
            console.warn('Failed to revoke token:', error);
            this.clearAuthState();
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.authState.isAuthenticated && !!this.authState.accessToken;
    }

    /**
     * Get current auth state
     */
    getAuthState(): UnsplashAuthState {
        return { ...this.authState };
    }

    /**
     * Get access token for API requests
     */
    getAccessToken(): string | undefined {
        return this.authState.accessToken;
    }

    /**
     * Check if user has specific scope
     */
    hasScope(scope: string): boolean {
        return this.authState.scopes?.includes(scope) || false;
    }

    /**
     * Get authorization header for API requests
     */
    getAuthorizationHeader(): Record<string, string> {
        if (this.authState.accessToken) {
            return {
                'Authorization': `Bearer ${this.authState.accessToken}`,
            };
        }
        return {
            'Authorization': `Client-ID ${this.config.clientId}`,
        };
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback(
        code?: string,
        error?: string,
        state?: string
    ): Promise<{ success: boolean; error?: string }> {
        if (error) {
            return {
                success: false,
                error: `OAuth error: ${error}`,
            };
        }

        if (!code) {
            return {
                success: false,
                error: 'No authorization code received',
            };
        }

        try {
            await this.exchangeCodeForToken(code);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Load auth state from storage
     */
    private loadAuthState(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedState = JSON.parse(stored);
                // Validate the stored state
                if (parsedState.accessToken && parsedState.isAuthenticated) {
                    this.authState = parsedState;
                }
            }
        } catch (error) {
            console.warn('Failed to load auth state from storage:', error);
            this.clearAuthState();
        }
    }

    /**
     * Save auth state to storage
     */
    private saveAuthState(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.authState));
        } catch (error) {
            console.warn('Failed to save auth state to storage:', error);
        }
    }

    /**
     * Clear auth state
     */
    private clearAuthState(): void {
        this.authState = { isAuthenticated: false };
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Failed to clear auth state from storage:', error);
        }
    }

    /**
     * Create a standardized error
     */
    private createError(type: MediaProviderErrorType, message: string): MediaProviderError {
        return {
            type,
            providerId: 'unsplash',
            message,
            details: { context: 'OAuth' },
        };
    }

    /**
     * Refresh user profile if needed
     */
    async refreshUserProfile(): Promise<void> {
        if (this.isAuthenticated()) {
            try {
                await this.fetchUserProfile();
            } catch (error) {
                console.warn('Failed to refresh user profile:', error);
            }
        }
    }

    /**
     * Get available scopes for the current token
     */
    getAvailableScopes(): string[] {
        return this.authState.scopes || [];
    }

    /**
     * Check if authentication is required for a specific action
     */
    isAuthRequiredForAction(action: 'search' | 'download' | 'like' | 'collect' | 'upload'): boolean {
        switch (action) {
            case 'search':
            case 'download':
                return false; // These work with public authentication
            case 'like':
                return !this.hasScope('write_likes');
            case 'collect':
                return !this.hasScope('write_collections');
            case 'upload':
                return !this.hasScope('write_photos');
            default:
                return false;
        }
    }
}

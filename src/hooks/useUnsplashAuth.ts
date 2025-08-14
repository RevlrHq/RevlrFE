import { useState, useEffect, useCallback } from 'react';
import { MediaSearchServiceFactory } from '@/lib/services/media/MediaSearchServiceFactory';
import { UnsplashProvider } from '@/lib/services/media/providers/UnsplashProvider';
import { MediaProviderAuthState } from '@/types/media-search';

export interface UnsplashAuthHookReturn {
    isAuthenticated: boolean;
    authState: MediaProviderAuthState;
    isLoading: boolean;
    error: string | null;
    login: (scopes?: string[]) => void;
    logout: () => Promise<void>;
    handleCallback: (code?: string, error?: string, state?: string) => Promise<boolean>;
    likePhoto: (photoId: string) => Promise<{ success: boolean; error?: string }>;
    unlikePhoto: (photoId: string) => Promise<{ success: boolean; error?: string }>;
    getUserLikedPhotos: (page?: number, perPage?: number) => Promise<any>;
    getUserPhotos: (page?: number, perPage?: number) => Promise<any>;
    hasScope: (scope: string) => boolean;
    getAvailableScopes: () => string[];
}

/**
 * React hook for managing Unsplash OAuth authentication
 */
export function useUnsplashAuth(): UnsplashAuthHookReturn {
    const [authState, setAuthState] = useState<MediaProviderAuthState>({ isAuthenticated: false });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get the Unsplash provider instance
    const getUnsplashProvider = useCallback((): UnsplashProvider | null => {
        try {
            const mediaService = MediaSearchServiceFactory.getInstance();
            const providers = mediaService.getAvailableProviders();
            const unsplashProvider = providers.find((p: any) => p.id === 'unsplash') as UnsplashProvider;
            return unsplashProvider || null;
        } catch (error) {
            console.error('Failed to get Unsplash provider:', error);
            return null;
        }
    }, []);

    // Update auth state from provider
    const updateAuthState = useCallback(() => {
        const provider = getUnsplashProvider();
        if (provider) {
            const newAuthState = provider.getAuthState();
            setAuthState(newAuthState);
        }
    }, [getUnsplashProvider]);

    // Initialize auth state on mount
    useEffect(() => {
        updateAuthState();
    }, [updateAuthState]);

    // Login function - redirects to Unsplash OAuth
    const login = useCallback((scopes?: string[]) => {
        const provider = getUnsplashProvider();
        if (!provider) {
            setError('Unsplash provider not available');
            return;
        }

        const oauthService = provider.getOAuthService();
        if (!oauthService) {
            setError('OAuth not configured for Unsplash provider');
            return;
        }

        try {
            // Generate a random state for security
            const state = Math.random().toString(36).substring(2, 15);
            
            // Store state in sessionStorage for verification
            sessionStorage.setItem('unsplash_oauth_state', state);
            
            // Get authorization URL
            const authUrl = oauthService.getAuthorizationUrl(state);
            if (authUrl) {
                // Redirect to Unsplash OAuth
                window.location.href = authUrl;
            } else {
                setError('Failed to generate authorization URL');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to initiate login');
        }
    }, [getUnsplashProvider]);

    // Logout function
    const logout = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const provider = getUnsplashProvider();
            if (provider) {
                await provider.signOut();
                updateAuthState();
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to logout');
        } finally {
            setIsLoading(false);
        }
    }, [getUnsplashProvider, updateAuthState]);

    // Handle OAuth callback
    const handleCallback = useCallback(async (
        code?: string,
        error?: string,
        state?: string
    ): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Verify state parameter
            const storedState = sessionStorage.getItem('unsplash_oauth_state');
            if (state && storedState && state !== storedState) {
                throw new Error('Invalid state parameter');
            }

            // Clean up stored state
            sessionStorage.removeItem('unsplash_oauth_state');

            const provider = getUnsplashProvider();
            if (!provider) {
                throw new Error('Unsplash provider not available');
            }

            const result = await provider.handleOAuthCallback(code, error, state);
            
            if (result.success) {
                updateAuthState();
                return true;
            } else {
                setError(result.error || 'Authentication failed');
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [getUnsplashProvider, updateAuthState]);

    // Like a photo
    const likePhoto = useCallback(async (photoId: string) => {
        const provider = getUnsplashProvider();
        if (!provider) {
            return { success: false, error: 'Unsplash provider not available' };
        }

        return provider.likePhoto(photoId);
    }, [getUnsplashProvider]);

    // Unlike a photo
    const unlikePhoto = useCallback(async (photoId: string) => {
        const provider = getUnsplashProvider();
        if (!provider) {
            return { success: false, error: 'Unsplash provider not available' };
        }

        return provider.unlikePhoto(photoId);
    }, [getUnsplashProvider]);

    // Get user's liked photos
    const getUserLikedPhotos = useCallback(async (page = 1, perPage = 20) => {
        const provider = getUnsplashProvider();
        if (!provider) {
            throw new Error('Unsplash provider not available');
        }

        return provider.getUserLikedPhotos(page, perPage);
    }, [getUnsplashProvider]);

    // Get user's photos
    const getUserPhotos = useCallback(async (page = 1, perPage = 20) => {
        const provider = getUnsplashProvider();
        if (!provider) {
            throw new Error('Unsplash provider not available');
        }

        return provider.getUserPhotos(page, perPage);
    }, [getUnsplashProvider]);

    // Check if user has specific scope
    const hasScope = useCallback((scope: string): boolean => {
        const provider = getUnsplashProvider();
        return provider?.hasScope(scope) || false;
    }, [getUnsplashProvider]);

    // Get available scopes
    const getAvailableScopes = useCallback((): string[] => {
        const provider = getUnsplashProvider();
        return provider?.getAvailableScopes() || [];
    }, [getUnsplashProvider]);

    return {
        isAuthenticated: authState.isAuthenticated,
        authState,
        isLoading,
        error,
        login,
        logout,
        handleCallback,
        likePhoto,
        unlikePhoto,
        getUserLikedPhotos,
        getUserPhotos,
        hasScope,
        getAvailableScopes,
    };
}

/**
 * Hook for checking if Unsplash OAuth is configured
 */
export function useUnsplashOAuthAvailable(): boolean {
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        try {
            const mediaService = MediaSearchServiceFactory.getInstance();
            const providers = mediaService.getAvailableProviders();
            const unsplashProvider = providers.find((p: any) => p.id === 'unsplash') as UnsplashProvider;
            
            if (unsplashProvider) {
                const oauthService = unsplashProvider.getOAuthService();
                setIsAvailable(!!oauthService);
            }
        } catch (error) {
            console.error('Failed to check Unsplash OAuth availability:', error);
            setIsAvailable(false);
        }
    }, []);

    return isAvailable;
}

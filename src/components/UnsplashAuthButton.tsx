'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    useUnsplashAuth,
    useUnsplashOAuthAvailable,
} from '@/hooks/useUnsplashAuth';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Loader2,
    Camera,
    Heart,
    User,
    LogOut,
    ExternalLink,
} from 'lucide-react';

/**
 * Component for displaying available scopes
 */
function ScopesDisplay({
    getAvailableScopes,
}: {
    getAvailableScopes: () => Promise<string[]>;
}) {
    const [scopes, setScopes] = useState<string[]>([]);

    useEffect(() => {
        const loadScopes = async () => {
            try {
                const availableScopes = await getAvailableScopes();
                setScopes(availableScopes);
            } catch (error) {
                console.error('Failed to load scopes:', error);
                setScopes([]);
            }
        };

        loadScopes();
    }, [getAvailableScopes]);

    return (
        <div className='mb-3 flex flex-wrap gap-1'>
            {scopes.map((scope) => (
                <span
                    key={scope}
                    className='inline-flex items-center rounded-full border bg-gray-50 px-2 py-1 text-xs text-gray-700'
                >
                    {scope === 'read_user' && <User className='mr-1 h-3 w-3' />}
                    {scope === 'write_likes' && (
                        <Heart className='mr-1 h-3 w-3' />
                    )}
                    {scope}
                </span>
            ))}
        </div>
    );
}

/**
 * Component for displaying authentication status with async scope checks
 */
function AuthStatusDisplay({
    hasScope,
    authState,
}: {
    hasScope: (scope: string) => Promise<boolean>;
    authState: { user?: { name: string } };
}) {
    const [canLikePhotos, setCanLikePhotos] = useState(false);
    const [canAccessCollections, setCanAccessCollections] = useState(false);

    useEffect(() => {
        const checkScopes = async () => {
            try {
                const [likesScope, collectionsScope] = await Promise.all([
                    hasScope('write_likes'),
                    hasScope('read_collections'),
                ]);
                setCanLikePhotos(likesScope);
                setCanAccessCollections(collectionsScope);
            } catch (error) {
                console.error('Failed to check scopes:', error);
                setCanLikePhotos(false);
                setCanAccessCollections(false);
            }
        };

        checkScopes();
    }, [hasScope]);

    return (
        <AlertDescription>
            Connected to Unsplash as <strong>{authState.user?.name}</strong>
            {canLikePhotos && ' • Can like photos'}
            {canAccessCollections && ' • Can access collections'}
        </AlertDescription>
    );
}

interface UnsplashAuthButtonProps {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
    showUserInfo?: boolean;
    className?: string;
}

/**
 * Button component for Unsplash OAuth authentication
 */
export function UnsplashAuthButton({
    variant = 'default',
    size = 'default',
    showUserInfo = false,
    className = '',
}: UnsplashAuthButtonProps) {
    const searchParams = useSearchParams();
    const isOAuthAvailable = useUnsplashOAuthAvailable();
    const {
        isAuthenticated,
        authState,
        isLoading,
        error,
        login,
        logout,
        handleCallback,
        getAvailableScopes,
    } = useUnsplashAuth();

    // Handle OAuth callback on component mount
    useEffect(() => {
        const unsplashCallback = searchParams.get('unsplash_callback');
        const code = searchParams.get('unsplash_code');
        const error = searchParams.get('unsplash_error');
        const state = searchParams.get('unsplash_state');

        if (unsplashCallback === 'true') {
            handleCallback(
                code || undefined,
                error || undefined,
                state || undefined
            );

            // Clean up URL parameters
            const url = new URL(window.location.href);
            url.searchParams.delete('unsplash_callback');
            url.searchParams.delete('unsplash_code');
            url.searchParams.delete('unsplash_error');
            url.searchParams.delete('unsplash_state');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams, handleCallback]);

    // Don't render if OAuth is not available
    if (!isOAuthAvailable) {
        return null;
    }

    const handleLogin = async () => {
        await login();
    };

    const handleLogout = async () => {
        await logout();
    };

    if (isLoading) {
        return (
            <Button
                variant={variant}
                size={size}
                disabled
                className={className}
            >
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
            </Button>
        );
    }

    if (error) {
        return (
            <Alert className='max-w-md'>
                <AlertDescription>
                    <strong>Authentication Error:</strong> {error}
                </AlertDescription>
            </Alert>
        );
    }

    if (isAuthenticated && authState.user) {
        if (showUserInfo) {
            return (
                <Card className='max-w-md'>
                    <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                                {authState.user.avatarUrl && (
                                    <img
                                        src={authState.user.avatarUrl}
                                        alt={authState.user.name}
                                        className='h-10 w-10 rounded-full'
                                    />
                                )}
                                <div>
                                    <CardTitle className='text-sm font-medium'>
                                        {authState.user.name}
                                    </CardTitle>
                                    <CardDescription className='text-xs'>
                                        @{authState.user.username}
                                    </CardDescription>
                                </div>
                            </div>
                            <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800'>
                                <Camera className='mr-1 h-3 w-3' />
                                Unsplash
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className='pt-0'>
                        <ScopesDisplay
                            getAvailableScopes={getAvailableScopes}
                        />
                        <div className='flex space-x-2'>
                            {authState.user.profileUrl && (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() =>
                                        window.open(
                                            authState.user?.profileUrl,
                                            '_blank'
                                        )
                                    }
                                >
                                    <ExternalLink className='mr-1 h-3 w-3' />
                                    Profile
                                </Button>
                            )}
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={handleLogout}
                            >
                                <LogOut className='mr-1 h-3 w-3' />
                                Disconnect
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className='flex items-center space-x-2'>
                <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800'>
                    <Camera className='mr-1 h-3 w-3' />
                    Connected to Unsplash
                </span>
                <Button variant='outline' size='sm' onClick={handleLogout}>
                    <LogOut className='mr-1 h-3 w-3' />
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleLogin}
            className={className}
        >
            <Camera className='mr-2 h-4 w-4' />
            Connect to Unsplash
        </Button>
    );
}

/**
 * Hook for handling Unsplash OAuth callback in page components
 */
export function useUnsplashCallback() {
    const searchParams = useSearchParams();
    const { handleCallback } = useUnsplashAuth();

    useEffect(() => {
        const unsplashCallback = searchParams.get('unsplash_callback');
        const code = searchParams.get('unsplash_code');
        const error = searchParams.get('unsplash_error');
        const state = searchParams.get('unsplash_state');

        if (unsplashCallback === 'true') {
            handleCallback(
                code || undefined,
                error || undefined,
                state || undefined
            );
        }
    }, [searchParams, handleCallback]);
}

/**
 * Component for displaying Unsplash authentication status
 */
export function UnsplashAuthStatus() {
    const { isAuthenticated, authState, hasScope } = useUnsplashAuth();
    const isOAuthAvailable = useUnsplashOAuthAvailable();

    if (!isOAuthAvailable) {
        return (
            <Alert>
                <AlertDescription>
                    Unsplash OAuth is not configured. Please check your
                    environment variables.
                </AlertDescription>
            </Alert>
        );
    }

    if (!isAuthenticated) {
        return (
            <Alert>
                <AlertDescription>
                    Not connected to Unsplash. Some features may be limited.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert>
            <Camera className='h-4 w-4' />
            <AuthStatusDisplay hasScope={hasScope} authState={authState} />
        </Alert>
    );
}

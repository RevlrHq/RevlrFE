'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUnsplashAuth, useUnsplashOAuthAvailable } from '@/hooks/useUnsplashAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, Heart, User, LogOut, ExternalLink } from 'lucide-react';

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
        hasScope,
        getAvailableScopes,
    } = useUnsplashAuth();

    // Handle OAuth callback on component mount
    useEffect(() => {
        const unsplashCallback = searchParams.get('unsplash_callback');
        const code = searchParams.get('unsplash_code');
        const error = searchParams.get('unsplash_error');
        const state = searchParams.get('unsplash_state');

        if (unsplashCallback === 'true') {
            handleCallback(code || undefined, error || undefined, state || undefined);
            
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

    const handleLogin = () => {
        login(['public', 'read_user', 'write_likes', 'read_collections']);
    };

    const handleLogout = async () => {
        await logout();
    };

    if (isLoading) {
        return (
            <Button variant={variant} size={size} disabled className={className}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
            </Button>
        );
    }

    if (error) {
        return (
            <Alert className="max-w-md">
                <AlertDescription>
                    <strong>Authentication Error:</strong> {error}
                </AlertDescription>
            </Alert>
        );
    }

    if (isAuthenticated && authState.user) {
        if (showUserInfo) {
            return (
                <Card className="max-w-md">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {authState.user.avatarUrl && (
                                    <img
                                        src={authState.user.avatarUrl}
                                        alt={authState.user.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                )}
                                <div>
                                    <CardTitle className="text-sm font-medium">
                                        {authState.user.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        @{authState.user.username}
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                                <Camera className="w-3 h-3 mr-1" />
                                Unsplash
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1 mb-3">
                            {getAvailableScopes().map((scope) => (
                                <span key={scope} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-700 border">
                                    {scope === 'read_user' && <User className="w-3 h-3 mr-1" />}
                                    {scope === 'write_likes' && <Heart className="w-3 h-3 mr-1" />}
                                    {scope}
                                </span>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            {authState.user.profileUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(authState.user?.profileUrl, '_blank')}
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Profile
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOut className="w-3 h-3 mr-1" />
                                Disconnect
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                    <Camera className="w-3 h-3 mr-1" />
                    Connected to Unsplash
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="w-3 h-3 mr-1" />
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
            <Camera className="mr-2 h-4 w-4" />
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
            handleCallback(code || undefined, error || undefined, state || undefined);
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
                    Unsplash OAuth is not configured. Please check your environment variables.
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
            <Camera className="h-4 w-4" />
            <AlertDescription>
                Connected to Unsplash as <strong>{authState.user?.name}</strong>
                {hasScope('write_likes') && ' • Can like photos'}
                {hasScope('read_collections') && ' • Can access collections'}
            </AlertDescription>
        </Alert>
    );
}

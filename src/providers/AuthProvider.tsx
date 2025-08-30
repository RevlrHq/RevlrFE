'use client';

import React, { useEffect } from 'react';
import { AuthService } from '../lib/services/AuthService';
import { HttpInterceptorService } from '../lib/services/HttpInterceptorService';
import { SignalRAuthService } from '../lib/services/SignalRAuthService';
import { useAuthStore } from '../stores/authStore';

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * AuthProvider component that initializes the authentication service
 * and ensures API tokens are properly synchronized with the auth store
 * and SignalR connections
 */
export function AuthProvider({ children }: AuthProviderProps) {
    useEffect(() => {
        // Initialize the authentication service
        AuthService.initialize();

        // Initialize HTTP interceptors for automatic token refresh
        HttpInterceptorService.initialize();

        // Set up automatic token synchronization
        AuthService.setupTokenSync();

        // Sync the current token on mount
        AuthService.syncToken();

        // Log initialization for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log(
                'AuthService and HttpInterceptorService initialized with token sync enabled'
            );
        }
    }, []);

    // Monitor authentication state for SignalR integration
    useEffect(() => {
        const unsubscribe = useAuthStore.subscribe((state, prevState) => {
            // Handle authentication state changes for SignalR
            if (state.isAuthenticated !== prevState.isAuthenticated) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(
                        `Auth state changed: ${prevState.isAuthenticated} -> ${state.isAuthenticated}`
                    );
                }

                // Clear any cached refresh promises when auth state changes
                SignalRAuthService.clearRefreshPromise();
            }

            // Handle user changes (different user logged in)
            if (state.user?.id !== prevState.user?.id) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(
                        `User changed: ${prevState.user?.id} -> ${state.user?.id}`
                    );
                }

                // Clear cached refresh promises for user changes
                SignalRAuthService.clearRefreshPromise();
            }

            // Handle token changes
            if (state.token !== prevState.token) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('JWT token updated in auth store');
                }
            }
        });

        return unsubscribe;
    }, []);

    return <>{children}</>;
}

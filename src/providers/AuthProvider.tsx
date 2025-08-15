'use client';

import React, { useEffect } from 'react';
import { AuthService } from '../lib/services/AuthService';
import { HttpInterceptorService } from '../lib/services/HttpInterceptorService';

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * AuthProvider component that initializes the authentication service
 * and ensures API tokens are properly synchronized with the auth store
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

    return <>{children}</>;
}

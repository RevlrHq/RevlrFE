'use client';

import React, { useEffect } from 'react';
import { AuthService } from '../lib/services/AuthService';

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

        // Set up automatic token synchronization
        AuthService.setupTokenSync();

        // Sync the current token on mount
        AuthService.syncToken();

        // Log initialization for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('AuthService initialized and token sync enabled');
        }
    }, []);

    return <>{children}</>;
}

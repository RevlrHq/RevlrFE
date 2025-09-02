/**
 * useEmailChange Hook
 * Manages email change workflow with validation and error handling
 */

import { useState, useCallback } from 'react';
import { SecurityService } from '../../services/SecurityService';
import type { EmailChangeRequest } from '../types';

interface UseEmailChangeReturn {
    changeEmail: (request: EmailChangeRequest) => Promise<void>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

export function useEmailChange(): UseEmailChangeReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // const securityService = new SecurityService(); // TODO: Use in production

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const validateEmailRequest = (
        request: EmailChangeRequest
    ): string | null => {
        if (!request.newEmail.trim()) {
            return 'New email is required';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.newEmail)) {
            return 'Please enter a valid email address';
        }

        if (!request.currentPassword.trim()) {
            return 'Current password is required';
        }

        return null;
    };

    const changeEmail = useCallback(async (request: EmailChangeRequest) => {
        try {
            setIsLoading(true);
            setError(null);

            // Validate request
            const validationError = validateEmailRequest(request);
            if (validationError) {
                throw new Error(validationError);
            }

            // For development, simulate API call
            // In production, replace with: await securityService.requestEmailChange(request);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Simulate potential errors for testing
            if (request.newEmail.includes('taken@')) {
                throw new Error('This email address is already in use');
            }

            if (request.currentPassword === 'wrong') {
                throw new Error('Current password is incorrect');
            }

            // Success - in real implementation, this would trigger email verification flow
            console.log('Email change request sent successfully');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to change email';
            setError(errorMessage);
            console.error('Error changing email:', err);
            throw err; // Re-throw to allow component to handle
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        changeEmail,
        isLoading,
        error,
        clearError,
    };
}

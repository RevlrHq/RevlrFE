import { useState, useCallback } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { profileService } from '../../services/ProfileService';
import type { ProfileUpdateRequest } from '../types';

interface UseProfileUpdateOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

interface UseProfileUpdateReturn {
    updateProfile: (updates: ProfileUpdateRequest) => Promise<void>;
    isUpdating: boolean;
    error: string | null;
    validationErrors: Record<string, string>;
    clearError: () => void;
}

/**
 * useProfileUpdate - Hook for managing profile updates
 *
 * Provides a clean interface for updating user profile information
 * with proper error handling, validation, and state management.
 *
 * Requirements: 1.2, 1.3, 1.4, 10.1, 10.3
 */
export const useProfileUpdate = (
    options: UseProfileUpdateOptions = {}
): UseProfileUpdateReturn => {
    const { onSuccess, onError } = options;
    const {
        profile,
        setProfile,
        setUpdating,
        setError: setStoreError,
        setValidationErrors: setStoreValidationErrors,
        isUpdating,
    } = useProfileStore();

    const [localError, setLocalError] = useState<string | null>(null);
    const [localValidationErrors, setLocalValidationErrors] = useState<
        Record<string, string>
    >({});

    const updateProfile = useCallback(
        async (updates: ProfileUpdateRequest) => {
            if (!profile) {
                const error = 'No profile data available';
                setLocalError(error);
                setStoreError(error);
                onError?.(error);
                return;
            }

            setUpdating(true);
            setLocalError(null);
            setLocalValidationErrors({});
            setStoreError(null);
            setStoreValidationErrors({});

            try {
                // Validate updates locally first
                validateUpdates(updates);

                // Call API service
                const updatedProfile =
                    await profileService.updateProfile(updates);

                // Update store with new profile data
                setProfile({
                    ...profile,
                    ...updatedProfile,
                });

                // Call success callback
                onSuccess?.();
            } catch (error) {
                console.error('Profile update failed:', error);

                let errorMessage = 'Failed to update profile';
                let validationErrors: Record<string, string> = {};

                if (error instanceof Error) {
                    errorMessage = error.message;

                    // Check if it's a validation error
                    if ('validationErrors' in error) {
                        validationErrors = (error as any).validationErrors;
                    }
                }

                // Update error states
                setLocalError(errorMessage);
                setLocalValidationErrors(validationErrors);
                setStoreError(errorMessage);
                setStoreValidationErrors(validationErrors);

                // Call error callback
                onError?.(errorMessage);
            } finally {
                setUpdating(false);
            }
        },
        [
            profile,
            setProfile,
            setUpdating,
            setStoreError,
            setStoreValidationErrors,
            onSuccess,
            onError,
        ]
    );

    const clearError = useCallback(() => {
        setLocalError(null);
        setLocalValidationErrors({});
        setStoreError(null);
        setStoreValidationErrors({});
    }, [setStoreError, setStoreValidationErrors]);

    // Local validation function
    const validateUpdates = (updates: ProfileUpdateRequest) => {
        const errors: Record<string, string> = {};

        // Validate first name
        if (updates.firstName !== undefined) {
            const firstName = updates.firstName.trim();
            if (!firstName) {
                errors.firstName = 'First name is required';
            } else if (firstName.length < 2) {
                errors.firstName = 'First name must be at least 2 characters';
            } else if (firstName.length > 50) {
                errors.firstName = 'First name must be less than 50 characters';
            }
        }

        // Validate last name
        if (updates.lastName !== undefined) {
            const lastName = updates.lastName.trim();
            if (!lastName) {
                errors.lastName = 'Last name is required';
            } else if (lastName.length < 2) {
                errors.lastName = 'Last name must be at least 2 characters';
            } else if (lastName.length > 50) {
                errors.lastName = 'Last name must be less than 50 characters';
            }
        }

        // Validate phone number
        if (updates.phoneNumber !== undefined) {
            const phoneNumber = updates.phoneNumber.trim();
            if (phoneNumber) {
                const digitsOnly = phoneNumber.replace(/\D/g, '');
                if (digitsOnly.length < 10 || digitsOnly.length > 15) {
                    errors.phoneNumber =
                        'Phone number must be between 10 and 15 digits';
                }
            }
        }

        // Validate bio
        if (updates.bio !== undefined && updates.bio.length > 500) {
            errors.bio = 'Bio must be less than 500 characters';
        }

        // Validate organization name
        if (
            updates.organizationName !== undefined &&
            updates.organizationName.length > 100
        ) {
            errors.organizationName =
                'Organization name must be less than 100 characters';
        }

        // Validate website
        if (
            updates.organizationWebsite !== undefined &&
            updates.organizationWebsite.trim()
        ) {
            try {
                const url = new URL(
                    updates.organizationWebsite.startsWith('http')
                        ? updates.organizationWebsite
                        : `https://${updates.organizationWebsite}`
                );
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    errors.organizationWebsite =
                        'Please enter a valid website URL';
                }
            } catch {
                errors.organizationWebsite = 'Please enter a valid website URL';
            }
        }

        if (Object.keys(errors).length > 0) {
            const error = new Error('Validation failed') as Error & {
                validationErrors: Record<string, string>;
            };
            error.validationErrors = errors;
            throw error;
        }
    };

    return {
        updateProfile,
        isUpdating,
        error: localError,
        validationErrors: localValidationErrors,
        clearError,
    };
};

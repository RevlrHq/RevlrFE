import type {
    ProfileFormData,
    ProfileUpdateRequest,
    AvatarUploadRequest,
    AvatarUploadResponse,
} from '../types/profile';

/**
 * ProfileService - Service class for profile-related API operations
 *
 * Handles all profile management operations including:
 * - Profile data retrieval and updates
 * - Avatar upload and removal
 * - Form validation and error handling
 *
 * Requirements: 1.2, 1.3, 1.4, 10.1, 10.3
 */
export class ProfileService {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Get current user profile
     */
    async getProfile(): Promise<ProfileFormData> {
        try {
            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch profile: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('ProfileService.getProfile error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to load profile'
            );
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(
        updates: ProfileUpdateRequest
    ): Promise<ProfileFormData> {
        try {
            // Validate input data
            this.validateProfileUpdate(updates);

            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Update failed: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('ProfileService.updateProfile error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update profile'
            );
        }
    }

    /**
     * Upload user avatar
     */
    async uploadAvatar(
        file: File,
        userId: string
    ): Promise<AvatarUploadResponse> {
        try {
            // Validate file
            this.validateAvatarFile(file);

            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('userId', userId);

            const response = await fetch(`${this.baseUrl}/profile/avatar`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Upload failed: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('ProfileService.uploadAvatar error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to upload avatar'
            );
        }
    }

    /**
     * Remove user avatar
     */
    async removeAvatar(): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/profile/avatar`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Remove failed: ${response.statusText}`
                );
            }
        } catch (error) {
            console.error('ProfileService.removeAvatar error:', error);
            throw new Error(
                error instanceof Error
                    ? error.message
                    : 'Failed to remove avatar'
            );
        }
    }

    /**
     * Validate profile update data
     */
    private validateProfileUpdate(updates: ProfileUpdateRequest): void {
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
            } else if (!/^[a-zA-Z\s'-]+$/.test(firstName)) {
                errors.firstName =
                    'First name can only contain letters, spaces, hyphens, and apostrophes';
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
            } else if (!/^[a-zA-Z\s'-]+$/.test(lastName)) {
                errors.lastName =
                    'Last name can only contain letters, spaces, hyphens, and apostrophes';
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

        // Validate website URL
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
    }

    /**
     * Validate avatar file
     */
    private validateAvatarFile(file: File): void {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Please upload a JPEG, PNG, or WebP image');
        }

        if (file.size > maxSize) {
            throw new Error('Image must be smaller than 5MB');
        }

        if (file.size === 0) {
            throw new Error('Please select a valid image file');
        }
    }
}

// Export singleton instance
export const profileService = new ProfileService();

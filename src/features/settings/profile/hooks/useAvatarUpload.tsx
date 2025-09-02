import { useState, useCallback } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { profileService } from '../../services/ProfileService';

interface UseAvatarUploadOptions {
    onSuccess?: (avatarUrl: string) => void;
    onError?: (error: string) => void;
}

interface UseAvatarUploadReturn {
    uploadAvatar: (file: File) => Promise<void>;
    removeAvatar: () => Promise<void>;
    isUploading: boolean;
    isRemoving: boolean;
    error: string | null;
    clearError: () => void;
}

/**
 * useAvatarUpload - Hook for managing avatar upload and removal
 *
 * Provides functionality for:
 * - Avatar file upload with validation
 * - Avatar removal
 * - Progress tracking and error handling
 *
 * Requirements: 1.2, 1.3, 1.4, 10.1, 10.3
 */
export const useAvatarUpload = (
    options: UseAvatarUploadOptions = {}
): UseAvatarUploadReturn => {
    const { onSuccess, onError } = options;
    const {
        profile,
        setProfile,
        isUploadingAvatar,
        setError: setStoreError,
    } = useProfileStore();

    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const uploadAvatar = useCallback(
        async (file: File) => {
            if (!profile) {
                const error = 'No profile data available';
                setLocalError(error);
                setStoreError(error);
                onError?.(error);
                return;
            }

            setIsUploading(true);
            setLocalError(null);
            setStoreError(null);

            try {
                // Validate file before upload
                validateAvatarFile(file);

                // Upload avatar using service
                const response = await profileService.uploadAvatar(
                    file,
                    profile.id
                );

                if (response.success && response.avatarUrl) {
                    // Update profile with new avatar URL
                    setProfile({
                        ...profile,
                        avatarUrl: response.avatarUrl,
                    });

                    // Call success callback
                    onSuccess?.(response.avatarUrl);
                } else {
                    throw new Error(response.message || 'Upload failed');
                }
            } catch (error) {
                console.error('Avatar upload failed:', error);

                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Failed to upload avatar';

                setLocalError(errorMessage);
                setStoreError(errorMessage);
                onError?.(errorMessage);
            } finally {
                setIsUploading(false);
            }
        },
        [profile, setProfile, setStoreError, onSuccess, onError]
    );

    const removeAvatar = useCallback(async () => {
        if (!profile) {
            const error = 'No profile data available';
            setLocalError(error);
            setStoreError(error);
            onError?.(error);
            return;
        }

        setIsRemoving(true);
        setLocalError(null);
        setStoreError(null);

        try {
            // Remove avatar using service
            await profileService.removeAvatar();

            // Update profile to remove avatar URL
            setProfile({
                ...profile,
                avatarUrl: undefined,
            });

            // Call success callback with empty string
            onSuccess?.('');
        } catch (error) {
            console.error('Avatar removal failed:', error);

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to remove avatar';

            setLocalError(errorMessage);
            setStoreError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsRemoving(false);
        }
    }, [profile, setProfile, setStoreError, onSuccess, onError]);

    const clearError = useCallback(() => {
        setLocalError(null);
        setStoreError(null);
    }, [setStoreError]);

    // File validation function
    const validateAvatarFile = (file: File) => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!file) {
            throw new Error('Please select a file');
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Please upload a JPEG, PNG, or WebP image');
        }

        if (file.size > maxSize) {
            throw new Error('Image must be smaller than 5MB');
        }

        if (file.size === 0) {
            throw new Error('Please select a valid image file');
        }

        // Additional validation for image dimensions (optional)
        return new Promise<void>((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                // Check minimum dimensions
                if (img.width < 100 || img.height < 100) {
                    reject(new Error('Image must be at least 100x100 pixels'));
                    return;
                }

                // Check maximum dimensions
                if (img.width > 4000 || img.height > 4000) {
                    reject(
                        new Error('Image must be smaller than 4000x4000 pixels')
                    );
                    return;
                }

                resolve();
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Invalid image file'));
            };

            img.src = url;
        });
    };

    return {
        uploadAvatar,
        removeAvatar,
        isUploading: isUploading || isUploadingAvatar,
        isRemoving,
        error: localError,
        clearError,
    };
};

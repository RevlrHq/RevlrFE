import { create } from 'zustand';
import type { UserView } from '@lib/api';

/**
 * Profile Store
 *
 * Manages profile-specific state including user data, avatar, and form states.
 */
interface ExtendedUserProfile extends UserView {
    bio?: string;
    organization?: string;
    website?: string;
    timezone?: string;
    language?: string;
    avatarUrl?: string;
    createdAt?: Date;
    lastLoginAt?: Date;
    emailVerified?: boolean;
}

interface ProfileFormData {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    bio?: string;
    organization?: string;
    website?: string;
    timezone?: string;
    language?: string;
}

interface ProfileState {
    // Profile data
    profile: ExtendedUserProfile | null;

    // Loading states
    isLoading: boolean;
    isUpdating: boolean;
    isUploadingAvatar: boolean;

    // Error handling
    error: string | null;
    validationErrors: Record<string, string>;

    // Form state
    isDirty: boolean;

    // Actions
    setProfile: (profile: ExtendedUserProfile) => void;
    updateProfile: (updates: Partial<ProfileFormData>) => Promise<void>;
    uploadAvatar: (file: File) => Promise<void>;
    removeAvatar: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setUpdating: (updating: boolean) => void;
    setError: (error: string | null) => void;
    setValidationErrors: (errors: Record<string, string>) => void;
    setDirty: (dirty: boolean) => void;
    reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
    // Initial state
    profile: null,
    isLoading: false,
    isUpdating: false,
    isUploadingAvatar: false,
    error: null,
    validationErrors: {},
    isDirty: false,

    // Actions
    setProfile: (profile: ExtendedUserProfile) => {
        set({ profile, error: null });
    },

    updateProfile: async (updates: Partial<ProfileFormData>) => {
        const { profile } = get();
        if (!profile) return;

        set({ isUpdating: true, error: null, validationErrors: {} });

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Update the profile with new data
            const updatedProfile = { ...profile, ...updates };

            set({
                profile: updatedProfile,
                isUpdating: false,
                isDirty: false,
                error: null,
            });
        } catch (error) {
            set({
                isUpdating: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update profile',
            });
        }
    },

    uploadAvatar: async (file: File) => {
        set({ isUploadingAvatar: true, error: null });

        try {
            // Simulate avatar upload
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Create a temporary URL for the uploaded file
            const avatarUrl = URL.createObjectURL(file);

            const { profile } = get();
            if (profile) {
                set({
                    profile: { ...profile, avatarUrl },
                    isUploadingAvatar: false,
                    isDirty: true,
                });
            }
        } catch (error) {
            set({
                isUploadingAvatar: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to upload avatar',
            });
        }
    },

    removeAvatar: async () => {
        const { profile } = get();
        if (!profile) return;

        set({ isUpdating: true, error: null });

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            set({
                profile: { ...profile, avatarUrl: undefined },
                isUpdating: false,
                isDirty: true,
            });
        } catch (error) {
            set({
                isUpdating: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to remove avatar',
            });
        }
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setUpdating: (updating: boolean) => {
        set({ isUpdating: updating });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    setValidationErrors: (errors: Record<string, string>) => {
        set({ validationErrors: errors });
    },

    setDirty: (dirty: boolean) => {
        set({ isDirty: dirty });
    },

    reset: () => {
        set({
            profile: null,
            isLoading: false,
            isUpdating: false,
            isUploadingAvatar: false,
            error: null,
            validationErrors: {},
            isDirty: false,
        });
    },
}));

import React, { useEffect } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import {
    SettingsCard,
    SettingsSection,
    LoadingSpinner,
    ErrorMessage,
} from '../../shared/components';
import { ProfileForm } from './ProfileForm';
import { PersonalDetails } from './PersonalDetails';
import { ContactInformation } from './ContactInformation';
import { AvatarUpload } from './AvatarUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface ProfileSettingsProps {
    className?: string;
}

/**
 * ProfileSettings - Main container for profile management
 *
 * Provides a comprehensive interface for users to manage their profile information,
 * including personal details, contact information, and avatar.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
const ProfileSettings: React.FC<ProfileSettingsProps> = ({
    className,
}) => {
    const {
        profile,
        isLoading,
        isUpdating,
        error,
        isDirty,
        setProfile,
        setLoading,
        reset,
    } = useProfileStore();

    // Initialize profile data on mount
    useEffect(() => {
        const initializeProfile = async () => {
            setLoading(true);
            try {
                // Simulate fetching user profile from API
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Mock profile data - in real implementation, this would come from API
                const mockProfile = {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    phoneNumber: '+1234567890',
                    bio: 'Event organizer passionate about creating memorable experiences.',
                    organization: 'Event Masters Inc.',
                    website: 'https://eventmasters.com',
                    avatarUrl: undefined,
                    emailVerified: true,
                    createdAt: new Date('2023-01-15'),
                    lastLoginAt: new Date(),
                };

                setProfile(mockProfile);
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };

        // Only initialize if profile is null and not already loading
        if (!profile && !isLoading) {
            initializeProfile();
        }

        // Cleanup on unmount
        return () => {
            if (!isDirty) {
                reset();
            }
        };
    }, []); // Remove dependencies to prevent re-initialization

    if (isLoading) {
        return (
            <div className='flex items-center justify-center p-8'>
                <LoadingSpinner size='lg' />
            </div>
        );
    }

    if (!profile) {
        return (
            <ErrorMessage
                message='Profile Not Found: Unable to load your profile information. Please try refreshing the page.'
            />
        );
    }

    return (
        <div className={className}>
            {/* Success message for updates */}
            {!isUpdating && !error && isDirty && (
                <Alert className='mb-6 border-green-200 bg-green-50'>
                    <CheckCircle className='size-4 text-green-600' />
                    <AlertDescription className='text-green-800'>
                        Your profile has been updated successfully.
                    </AlertDescription>
                </Alert>
            )}

            {/* Error message */}
            {error && (
                <ErrorMessage
                    message={`Update Failed: ${error}`}
                    className='mb-6'
                />
            )}

            <div className='space-y-6'>
                {/* Avatar Section */}
                <SettingsCard
                    title='Profile Picture'
                    description='Upload a profile picture to help others recognize you'
                >
                    <AvatarUpload
                        currentAvatar={profile.avatarUrl}
                        userName={`${profile.firstName} ${profile.lastName}`}
                    />
                </SettingsCard>

                {/* Personal Information */}
                <SettingsCard
                    title='Personal Information'
                    description='Update your personal details and bio'
                >
                    <SettingsSection>
                        <PersonalDetails
                            data={{
                                firstName: profile.firstName || '',
                                lastName: profile.lastName || '',
                                bio: profile.bio || '',
                            }}
                        />
                    </SettingsSection>
                </SettingsCard>

                {/* Contact Information */}
                <SettingsCard
                    title='Contact Information'
                    description='Manage your contact details'
                >
                    <SettingsSection>
                        <ContactInformation
                            data={{
                                email: profile.email,
                                phoneNumber: profile.phoneNumber || '',
                            }}
                        />
                    </SettingsSection>
                </SettingsCard>

                {/* Organization Information */}
                <SettingsCard
                    title='Organization Details'
                    description='Information about your organization or business'
                >
                    <SettingsSection>
                        <ProfileForm
                            organizationData={{
                                organizationName: profile.organization || '',
                                organizationWebsite: profile.website || '',
                            }}
                        />
                    </SettingsSection>
                </SettingsCard>
            </div>
        </div>
    );
};

// Default export for lazy loading
export default ProfileSettings;

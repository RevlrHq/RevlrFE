import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProfileStore } from '../../stores/profileStore';
import { SaveButton } from '../../shared/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PersonalDetailsData {
    firstName: string;
    lastName: string;
    bio?: string;
}

interface PersonalDetailsProps {
    data: PersonalDetailsData;
    className?: string;
}

interface FormData {
    firstName: string;
    lastName: string;
    bio: string;
}

/**
 * PersonalDetails - Component for managing personal information
 *
 * Handles first name, last name, and bio updates with real-time validation.
 * Provides auto-save functionality and proper error handling.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export const PersonalDetails: React.FC<PersonalDetailsProps> = ({
    data,
    className,
}) => {
    const { updateProfile, isUpdating, validationErrors, setDirty } =
        useProfileStore();
    const [hasChanges, setHasChanges] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
        reset,
        setValue,
    } = useForm<FormData>({
        defaultValues: {
            firstName: data.firstName,
            lastName: data.lastName,
            bio: data.bio || '',
        },
    });

    const watchedValues = watch();

    // Track form changes
    useEffect(() => {
        const hasFormChanges = isDirty;
        setHasChanges(hasFormChanges);
        setDirty(hasFormChanges);
    }, [isDirty, setDirty]);

    // Reset form when data changes
    useEffect(() => {
        reset({
            firstName: data.firstName,
            lastName: data.lastName,
            bio: data.bio || '',
        });
    }, [data, reset]);

    const onSubmit = async (formData: FormData) => {
        try {
            await updateProfile({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                bio: formData.bio.trim() || undefined,
            });
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to update personal details:', error);
        }
    };

    const validateName = (value: string, fieldName: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return `${fieldName} is required`;
        }
        if (trimmed.length < 2) {
            return `${fieldName} must be at least 2 characters`;
        }
        if (trimmed.length > 50) {
            return `${fieldName} must be less than 50 characters`;
        }
        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
            return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
        }
        return true;
    };

    return (
        <div className={className}>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                {/* First Name */}
                <div className='space-y-2'>
                    <Label htmlFor='firstName' className='text-sm font-medium'>
                        First Name *
                    </Label>
                    <Input
                        id='firstName'
                        type='text'
                        placeholder='Enter your first name'
                        {...register('firstName', {
                            required: 'First name is required',
                            validate: (value) =>
                                validateName(value, 'First name'),
                        })}
                        className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {errors.firstName.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    {validationErrors.firstName && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {validationErrors.firstName}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Last Name */}
                <div className='space-y-2'>
                    <Label htmlFor='lastName' className='text-sm font-medium'>
                        Last Name *
                    </Label>
                    <Input
                        id='lastName'
                        type='text'
                        placeholder='Enter your last name'
                        {...register('lastName', {
                            required: 'Last name is required',
                            validate: (value) =>
                                validateName(value, 'Last name'),
                        })}
                        className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {errors.lastName.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    {validationErrors.lastName && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {validationErrors.lastName}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Bio */}
                <div className='space-y-2'>
                    <Label htmlFor='bio' className='text-sm font-medium'>
                        Bio
                    </Label>
                    <Textarea
                        id='bio'
                        placeholder='Tell us about yourself and your experience with event organizing...'
                        rows={4}
                        {...register('bio', {
                            maxLength: {
                                value: 500,
                                message: 'Bio must be less than 500 characters',
                            },
                        })}
                        className={
                            errors.bio
                                ? 'resize-none border-red-500'
                                : 'resize-none'
                        }
                    />
                    <div className='flex items-center justify-between'>
                        <p className='text-sm text-gray-500'>
                            Optional - Share your background and experience
                        </p>
                        <p className='text-sm text-gray-400'>
                            {watchedValues.bio?.length || 0}/500
                        </p>
                    </div>
                    {errors.bio && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {errors.bio.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    {validationErrors.bio && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {validationErrors.bio}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Save Button */}
                {hasChanges && (
                    <div className='pt-4'>
                        <SaveButton
                            type='submit'
                            isLoading={isUpdating}
                            disabled={
                                isUpdating || Object.keys(errors).length > 0
                            }
                        >
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </SaveButton>
                    </div>
                )}
            </form>
        </div>
    );
};

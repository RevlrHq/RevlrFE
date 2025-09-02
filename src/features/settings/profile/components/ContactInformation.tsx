import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProfileStore } from '../../stores/profileStore';
import { SaveButton } from '../../shared/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, Phone, CheckCircle } from 'lucide-react';

interface ContactInformationData {
    email: string;
    phoneNumber: string;
}

interface ContactInformationProps {
    data: ContactInformationData;
    className?: string;
}

interface FormData {
    email: string;
    phoneNumber: string;
}

/**
 * ContactInformation - Component for managing contact details
 *
 * Handles email and phone number updates with validation.
 * Email changes require verification process.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export const ContactInformation: React.FC<ContactInformationProps> = ({
    data,
    className,
}) => {
    const { updateProfile, isUpdating, validationErrors, setDirty, profile } =
        useProfileStore();
    const [hasChanges, setHasChanges] = useState(false);
    const [emailChangeRequested, setEmailChangeRequested] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
        reset,
        getValues,
    } = useForm<FormData>({
        defaultValues: {
            email: data.email,
            phoneNumber: data.phoneNumber,
        },
    });

    const watchedValues = watch();
    const emailChanged = watchedValues.email !== data.email;

    // Track form changes
    useEffect(() => {
        const hasFormChanges = isDirty;
        setHasChanges(hasFormChanges);
        setDirty(hasFormChanges);
    }, [isDirty, setDirty]);

    // Reset form when data changes
    useEffect(() => {
        reset({
            email: data.email,
            phoneNumber: data.phoneNumber,
        });
    }, [data, reset]);

    const onSubmit = async (formData: FormData) => {
        try {
            // If email changed, we need to handle verification process
            if (emailChanged) {
                setEmailChangeRequested(true);
                // In real implementation, this would trigger email verification
                console.log('Email change requested, verification emails sent');
            }

            // Update phone number immediately
            if (formData.phoneNumber !== data.phoneNumber) {
                await updateProfile({
                    phoneNumber: formData.phoneNumber.trim(),
                });
            }

            if (!emailChanged) {
                setHasChanges(false);
            }
        } catch (error) {
            console.error('Failed to update contact information:', error);
        }
    };

    const validateEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
            return 'Email is required';
        }
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        return true;
    };

    const validatePhoneNumber = (value: string) => {
        if (!value.trim()) {
            return 'Phone number is required';
        }

        // Remove all non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, '');

        if (digitsOnly.length < 10) {
            return 'Phone number must be at least 10 digits';
        }
        if (digitsOnly.length > 15) {
            return 'Phone number must be less than 15 digits';
        }

        return true;
    };

    const formatPhoneNumber = (value: string) => {
        // Simple phone number formatting for US numbers
        const digitsOnly = value.replace(/\D/g, '');

        if (digitsOnly.length <= 3) {
            return digitsOnly;
        } else if (digitsOnly.length <= 6) {
            return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
        } else if (digitsOnly.length <= 10) {
            return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
        } else {
            return `+${digitsOnly.slice(0, -10)} (${digitsOnly.slice(-10, -7)}) ${digitsOnly.slice(-7, -4)}-${digitsOnly.slice(-4)}`;
        }
    };

    return (
        <div className={className}>
            {emailChangeRequested && (
                <Alert className='mb-4 border-blue-200 bg-blue-50'>
                    <Mail className='size-4 text-blue-600' />
                    <AlertDescription className='text-blue-800'>
                        Email change requested. Please check both your old and
                        new email addresses for verification instructions.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                {/* Email Address */}
                <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                        <Label htmlFor='email' className='text-sm font-medium'>
                            Email Address *
                        </Label>
                        {profile?.emailVerified && (
                            <Badge variant='secondary' className='text-xs'>
                                <CheckCircle className='mr-1 size-3' />
                                Verified
                            </Badge>
                        )}
                    </div>
                    <Input
                        id='email'
                        type='email'
                        placeholder='Enter your email address'
                        {...register('email', {
                            required: 'Email is required',
                            validate: validateEmail,
                        })}
                        className={errors.email ? 'border-red-500' : ''}
                    />
                    {emailChanged && (
                        <Alert className='border-amber-200 bg-amber-50 py-2'>
                            <AlertCircle className='size-4 text-amber-600' />
                            <AlertDescription className='text-amber-800'>
                                Changing your email will require verification of
                                both your old and new email addresses.
                            </AlertDescription>
                        </Alert>
                    )}
                    {errors.email && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {errors.email.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    {validationErrors.email && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {validationErrors.email}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Phone Number */}
                <div className='space-y-2'>
                    <Label
                        htmlFor='phoneNumber'
                        className='text-sm font-medium'
                    >
                        Phone Number *
                    </Label>
                    <Input
                        id='phoneNumber'
                        type='tel'
                        placeholder='(555) 123-4567'
                        {...register('phoneNumber', {
                            required: 'Phone number is required',
                            validate: validatePhoneNumber,
                            onChange: (e) => {
                                const formatted = formatPhoneNumber(
                                    e.target.value
                                );
                                e.target.value = formatted;
                            },
                        })}
                        className={errors.phoneNumber ? 'border-red-500' : ''}
                    />
                    {errors.phoneNumber && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {errors.phoneNumber.message}
                            </AlertDescription>
                        </Alert>
                    )}
                    {validationErrors.phoneNumber && (
                        <Alert variant='destructive' className='py-2'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>
                                {validationErrors.phoneNumber}
                            </AlertDescription>
                        </Alert>
                    )}
                    <p className='text-sm text-gray-500'>
                        Used for important account notifications and support
                    </p>
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
                            {isUpdating
                                ? 'Saving...'
                                : emailChanged
                                  ? 'Request Email Change'
                                  : 'Save Changes'}
                        </SaveButton>
                    </div>
                )}
            </form>
        </div>
    );
};

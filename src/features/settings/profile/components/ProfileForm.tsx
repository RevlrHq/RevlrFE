import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProfileStore } from '../../stores/profileStore';
import { SaveButton } from '../../shared/components';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface OrganizationData {
    organizationName?: string;
    organizationWebsite?: string;
}

interface ProfileFormProps {
    organizationData: OrganizationData;
    className?: string;
}

interface FormData {
    organizationName: string;
    organizationWebsite: string;
}

/**
 * ProfileForm - Form component for organization information
 *
 * Handles organization name and website updates with validation.
 * Part of the profile management feature.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
    organizationData,
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
    } = useForm<FormData>({
        defaultValues: {
            organizationName: organizationData.organizationName || '',
            organizationWebsite: organizationData.organizationWebsite || '',
        },
    });

    const watchedValues = watch();

    // Track form changes
    useEffect(() => {
        const hasFormChanges = isDirty;
        setHasChanges(hasFormChanges);
        setDirty(hasFormChanges);
    }, [isDirty, setDirty]);

    // Reset form when organizationData changes
    useEffect(() => {
        reset({
            organizationName: organizationData.organizationName || '',
            organizationWebsite: organizationData.organizationWebsite || '',
        });
    }, [organizationData, reset]);

    const onSubmit = async (data: FormData) => {
        try {
            await updateProfile({
                organization: data.organizationName,
                website: data.organizationWebsite,
            });
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to update organization info:', error);
        }
    };

    const validateWebsite = (value: string) => {
        if (!value) return true; // Optional field

        try {
            const url = new URL(
                value.startsWith('http') ? value : `https://${value}`
            );
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return 'Please enter a valid website URL';
        }
    };

    return (
        <Card className={className}>
            <CardContent className='pt-6'>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    {/* Organization Name */}
                    <div className='space-y-2'>
                        <Label htmlFor='organizationName'>
                            Organization Name
                        </Label>
                        <Input
                            id='organizationName'
                            type='text'
                            placeholder='Enter your organization name'
                            {...register('organizationName', {
                                maxLength: {
                                    value: 100,
                                    message:
                                        'Organization name must be less than 100 characters',
                                },
                            })}
                            className={
                                errors.organizationName ? 'border-red-500' : ''
                            }
                        />
                        {errors.organizationName && (
                            <Alert variant='destructive' className='py-2'>
                                <AlertCircle className='size-4' />
                                <AlertDescription>
                                    {errors.organizationName.message}
                                </AlertDescription>
                            </Alert>
                        )}
                        {validationErrors.organizationName && (
                            <Alert variant='destructive' className='py-2'>
                                <AlertCircle className='size-4' />
                                <AlertDescription>
                                    {validationErrors.organizationName}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Organization Website */}
                    <div className='space-y-2'>
                        <Label htmlFor='organizationWebsite'>
                            Organization Website
                        </Label>
                        <Input
                            id='organizationWebsite'
                            type='url'
                            placeholder='https://example.com'
                            {...register('organizationWebsite', {
                                validate: validateWebsite,
                            })}
                            className={
                                errors.organizationWebsite
                                    ? 'border-red-500'
                                    : ''
                            }
                        />
                        {errors.organizationWebsite && (
                            <Alert variant='destructive' className='py-2'>
                                <AlertCircle className='size-4' />
                                <AlertDescription>
                                    {errors.organizationWebsite.message}
                                </AlertDescription>
                            </Alert>
                        )}
                        {validationErrors.organizationWebsite && (
                            <Alert variant='destructive' className='py-2'>
                                <AlertCircle className='size-4' />
                                <AlertDescription>
                                    {validationErrors.organizationWebsite}
                                </AlertDescription>
                            </Alert>
                        )}
                        <p className='text-sm text-gray-500'>
                            Include http:// or https:// for external links
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
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </SaveButton>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    );
};

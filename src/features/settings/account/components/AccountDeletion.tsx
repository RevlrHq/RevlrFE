'use client';

import React, { useState } from 'react';
import { SettingsCard } from '../../shared/components/SettingsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Calendar, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type {
    AccountDeletionProps,
    DeletionReason,
    AccountDeletionConfirmation,
    DataRetentionChoice,
} from '../types';

const DELETION_REASONS: { value: DeletionReason; label: string }[] = [
    { value: 'no_longer_needed', label: 'No longer need the service' },
    { value: 'privacy_concerns', label: 'Privacy concerns' },
    { value: 'switching_platforms', label: 'Switching to another platform' },
    { value: 'cost_concerns', label: 'Cost concerns' },
    { value: 'technical_issues', label: 'Technical issues' },
    { value: 'other', label: 'Other (please specify)' },
];

const DATA_TYPES = [
    {
        id: 'events',
        label: 'Event Data',
        description: 'Event details, descriptions, and metadata',
    },
    {
        id: 'registrations',
        label: 'Registration Data',
        description: 'Attendee registrations and ticket sales',
    },
    {
        id: 'analytics',
        label: 'Analytics Data',
        description: 'Performance metrics and insights',
    },
    {
        id: 'media',
        label: 'Media Files',
        description: 'Uploaded images and media assets',
    },
];

export function AccountDeletion({
    onRequestDeletion,
    onCancelDeletion,
    existingRequest,
    isLoading,
}: AccountDeletionProps) {
    const { toast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<AccountDeletionConfirmation>({
        password: '',
        confirmationText: '',
        dataRetention: [],
        reason: 'no_longer_needed',
        customReason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.confirmationText !== 'DELETE MY ACCOUNT') {
            toast({
                title: 'Confirmation required',
                description: 'Please type "DELETE MY ACCOUNT" to confirm.',
                variant: 'destructive',
            });
            return;
        }

        if (!formData.password) {
            toast({
                title: 'Password required',
                description: 'Please enter your password to confirm deletion.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await onRequestDeletion(formData);
            setShowForm(false);
            toast({
                title: 'Deletion requested',
                description:
                    'Your account deletion has been scheduled. Check your email for confirmation.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    'Failed to request account deletion. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleCancel = async () => {
        try {
            await onCancelDeletion();
            toast({
                title: 'Deletion cancelled',
                description:
                    'Your account deletion request has been cancelled.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    'Failed to cancel deletion request. Please contact support.',
                variant: 'destructive',
            });
        }
    };

    const updateDataRetention = (dataType: string, retain: boolean) => {
        setFormData((prev) => ({
            ...prev,
            dataRetention: retain
                ? [
                      ...prev.dataRetention.filter(
                          (d) => d.dataType !== dataType
                      ),
                      { dataType, retain },
                  ]
                : prev.dataRetention.filter((d) => d.dataType !== dataType),
        }));
    };

    if (existingRequest) {
        return (
            <SettingsCard
                title='Account Deletion Scheduled'
                description='Your account deletion is currently scheduled'
                className='border-yellow-200 dark:border-yellow-800'
            >
                <div className='space-y-4'>
                    <div className='rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20'>
                        <div className='flex items-start space-x-2'>
                            <Clock className='mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                            <div className='text-sm text-yellow-800 dark:text-yellow-200'>
                                <p className='mb-1 font-medium'>
                                    Deletion Scheduled
                                </p>
                                <p>
                                    Your account is scheduled for deletion on{' '}
                                    <span className='font-medium'>
                                        {formatDistanceToNow(
                                            existingRequest.scheduledAt,
                                            { addSuffix: true }
                                        )}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            <strong>Reason:</strong>{' '}
                            {existingRequest.reason.replace('_', ' ')}
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            <strong>Status:</strong> {existingRequest.status}
                        </p>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                            <strong>Requested:</strong>{' '}
                            {formatDistanceToNow(existingRequest.requestedAt, {
                                addSuffix: true,
                            })}
                        </p>
                    </div>

                    <div className='flex justify-end'>
                        <Button
                            variant='outline'
                            onClick={handleCancel}
                            disabled={isLoading}
                            className='flex items-center space-x-2'
                        >
                            <X className='h-4 w-4' />
                            <span>Cancel Deletion</span>
                        </Button>
                    </div>
                </div>
            </SettingsCard>
        );
    }

    if (!showForm) {
        return (
            <SettingsCard
                title='Delete Account'
                description='Permanently delete your account and all data'
                className='border-red-200 dark:border-red-800'
            >
                <div className='space-y-4'>
                    <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
                        <div className='flex items-start space-x-2'>
                            <AlertTriangle className='mt-0.5 h-5 w-5 text-red-600 dark:text-red-400' />
                            <div className='text-sm text-red-800 dark:text-red-200'>
                                <p className='mb-1 font-medium'>
                                    This action cannot be undone
                                </p>
                                <p>
                                    Deleting your account will permanently
                                    remove all your data, including events,
                                    registrations, and analytics.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='flex justify-end'>
                        <Button
                            variant='destructive'
                            onClick={() => setShowForm(true)}
                            className='flex items-center space-x-2'
                        >
                            <AlertTriangle className='h-4 w-4' />
                            <span>Delete Account</span>
                        </Button>
                    </div>
                </div>
            </SettingsCard>
        );
    }

    return (
        <SettingsCard
            title='Delete Account'
            description='Complete the form below to delete your account'
            className='border-red-200 dark:border-red-800'
        >
            <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-4'>
                    <div>
                        <Label htmlFor='reason'>Reason for deletion</Label>
                        <RadioGroup
                            value={formData.reason}
                            onValueChange={(value: DeletionReason) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    reason: value,
                                }))
                            }
                            className='mt-2'
                        >
                            {DELETION_REASONS.map((reason) => (
                                <div
                                    key={reason.value}
                                    className='flex items-center space-x-2'
                                >
                                    <RadioGroupItem
                                        value={reason.value}
                                        id={reason.value}
                                    />
                                    <Label
                                        htmlFor={reason.value}
                                        className='text-sm'
                                    >
                                        {reason.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {formData.reason === 'other' && (
                        <div>
                            <Label htmlFor='custom-reason'>
                                Please specify
                            </Label>
                            <Textarea
                                id='custom-reason'
                                value={formData.customReason}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        customReason: e.target.value,
                                    }))
                                }
                                placeholder='Please tell us more about your reason for leaving'
                                className='mt-1'
                            />
                        </div>
                    )}

                    <div>
                        <Label>Data to retain (optional)</Label>
                        <p className='mb-3 text-sm text-gray-600 dark:text-gray-400'>
                            Select any data you'd like us to keep for business
                            purposes
                        </p>
                        <div className='space-y-3'>
                            {DATA_TYPES.map((dataType) => (
                                <div
                                    key={dataType.id}
                                    className='flex items-start space-x-3'
                                >
                                    <Checkbox
                                        id={dataType.id}
                                        checked={formData.dataRetention.some(
                                            (d) => d.dataType === dataType.id
                                        )}
                                        onCheckedChange={(checked) =>
                                            updateDataRetention(
                                                dataType.id,
                                                !!checked
                                            )
                                        }
                                    />
                                    <div className='space-y-1'>
                                        <Label
                                            htmlFor={dataType.id}
                                            className='text-sm font-medium'
                                        >
                                            {dataType.label}
                                        </Label>
                                        <p className='text-xs text-gray-600 dark:text-gray-400'>
                                            {dataType.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor='password'>Confirm with password</Label>
                        <Input
                            id='password'
                            type='password'
                            value={formData.password}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                }))
                            }
                            placeholder='Enter your password'
                            className='mt-1'
                        />
                    </div>

                    <div>
                        <Label htmlFor='confirmation'>
                            Type "DELETE MY ACCOUNT" to confirm
                        </Label>
                        <Input
                            id='confirmation'
                            value={formData.confirmationText}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    confirmationText: e.target.value,
                                }))
                            }
                            placeholder='DELETE MY ACCOUNT'
                            className='mt-1'
                        />
                    </div>
                </div>

                <div className='flex justify-between'>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type='submit'
                        variant='destructive'
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Delete Account'}
                    </Button>
                </div>
            </form>
        </SettingsCard>
    );
}

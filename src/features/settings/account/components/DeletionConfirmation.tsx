'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
    DeletionConfirmationProps,
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
        description: 'Event details and metadata',
    },
    {
        id: 'registrations',
        label: 'Registration Data',
        description: 'Attendee information',
    },
    {
        id: 'analytics',
        label: 'Analytics Data',
        description: 'Performance metrics',
    },
    {
        id: 'media',
        label: 'Media Files',
        description: 'Uploaded images and assets',
    },
];

export function DeletionConfirmation({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: DeletionConfirmationProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<AccountDeletionConfirmation>({
        password: '',
        confirmationText: '',
        dataRetention: [],
        reason: 'no_longer_needed',
        customReason: '',
    });

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
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
            await onConfirm(formData);
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    'Failed to process deletion request. Please try again.',
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

    const canProceedStep1 =
        formData.reason !== 'other' || formData.customReason.trim().length > 0;
    const canProceedStep3 =
        formData.password && formData.confirmationText === 'DELETE MY ACCOUNT';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                    <DialogTitle className='flex items-center space-x-2'>
                        <AlertTriangle className='h-5 w-5 text-red-600' />
                        <span>Delete Account - Step {step} of 3</span>
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Tell us why you're leaving (optional)"}
                        {step === 2 && 'Choose what data to retain (optional)'}
                        {step === 3 && 'Final confirmation required'}
                    </DialogDescription>
                </DialogHeader>

                <div className='py-4'>
                    {step === 1 && (
                        <div className='space-y-4'>
                            <div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
                                <p className='text-sm text-blue-800 dark:text-blue-200'>
                                    Your feedback helps us improve our service
                                    for other users.
                                </p>
                            </div>

                            <div>
                                <Label>
                                    Why are you deleting your account?
                                </Label>
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
                                        placeholder='Please tell us more...'
                                        className='mt-1'
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className='space-y-4'>
                            <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                                    Some data may be retained for legal or
                                    business purposes regardless of your
                                    selection.
                                </p>
                            </div>

                            <div>
                                <Label>Data to retain (optional)</Label>
                                <p className='mb-3 text-sm text-gray-600 dark:text-gray-400'>
                                    Select any data you'd like us to keep for
                                    business purposes
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
                                                    (d) =>
                                                        d.dataType ===
                                                        dataType.id
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
                        </div>
                    )}

                    {step === 3 && (
                        <div className='space-y-4'>
                            <div className='rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
                                <div className='flex items-start space-x-2'>
                                    <Shield className='mt-0.5 h-4 w-4 text-red-600 dark:text-red-400' />
                                    <div className='text-sm text-red-800 dark:text-red-200'>
                                        <p className='font-medium'>
                                            Final confirmation required
                                        </p>
                                        <p>
                                            This action cannot be undone. All
                                            your data will be permanently
                                            deleted.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor='password'>
                                    Enter your password
                                </Label>
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
                                    placeholder='Your account password'
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
                    )}
                </div>

                <DialogFooter>
                    <div className='flex w-full justify-between'>
                        <div>
                            {step > 1 && (
                                <Button variant='outline' onClick={handleBack}>
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className='flex space-x-2'>
                            <Button variant='outline' onClick={onClose}>
                                Cancel
                            </Button>
                            {step < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={step === 1 && !canProceedStep1}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    variant='destructive'
                                    onClick={handleSubmit}
                                    disabled={!canProceedStep3 || isLoading}
                                >
                                    {isLoading
                                        ? 'Processing...'
                                        : 'Delete Account'}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

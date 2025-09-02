'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SaveButton } from '../../shared/components/SaveButton';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Mail, AlertTriangle } from 'lucide-react';
import type { EmailChangeFormProps, EmailChangeRequest } from '../types';

export function EmailChangeForm({
    currentEmail,
    onSubmit,
    isLoading = false,
}: EmailChangeFormProps) {
    const [newEmail, setNewEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!newEmail.trim()) {
            newErrors.newEmail = 'New email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            newErrors.newEmail = 'Please enter a valid email address';
        } else if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
            newErrors.newEmail =
                'New email must be different from current email';
        }

        if (!currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setConfirmationOpen(true);
    };

    const handleConfirmChange = async () => {
        const request: EmailChangeRequest = {
            newEmail: newEmail.trim(),
            currentPassword,
        };

        try {
            await onSubmit(request);
            setConfirmationOpen(false);
            setNewEmail('');
            setCurrentPassword('');
            setErrors({});
        } catch {
            setConfirmationOpen(false);
            // Error handling is done by the parent component
        }
    };

    const handleCancel = () => {
        setConfirmationOpen(false);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label
                        htmlFor='current-email'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                        Current Email
                    </label>
                    <div className='mt-1 flex items-center'>
                        <Mail className='mr-2 size-4 text-gray-400' />
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                            {currentEmail}
                        </span>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor='new-email'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                        New Email Address
                    </label>
                    <Input
                        id='new-email'
                        type='email'
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder='Enter new email address'
                        className='mt-1'
                        disabled={isLoading}
                        aria-describedby={
                            errors.newEmail ? 'new-email-error' : undefined
                        }
                    />
                    {errors.newEmail && (
                        <p
                            id='new-email-error'
                            className='mt-1 text-sm text-red-600'
                        >
                            {errors.newEmail}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor='current-password'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                        Current Password
                    </label>
                    <Input
                        id='current-password'
                        type='password'
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder='Enter your current password'
                        className='mt-1'
                        disabled={isLoading}
                        aria-describedby={
                            errors.currentPassword
                                ? 'current-password-error'
                                : undefined
                        }
                    />
                    {errors.currentPassword && (
                        <p
                            id='current-password-error'
                            className='mt-1 text-sm text-red-600'
                        >
                            {errors.currentPassword}
                        </p>
                    )}
                </div>

                <SaveButton
                    type='submit'
                    isLoading={isLoading}
                    disabled={!newEmail.trim() || !currentPassword.trim()}
                >
                    Change Email
                </SaveButton>
            </form>

            {/* Confirmation Dialog */}
            <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='flex items-center'>
                            <AlertTriangle className='mr-2 size-5 text-amber-500' />
                            Confirm Email Change
                        </DialogTitle>
                        <DialogDescription>
                            You are about to change your email address from{' '}
                            <strong>{currentEmail}</strong> to{' '}
                            <strong>{newEmail}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-3 text-sm text-gray-600 dark:text-gray-400'>
                        <p>After confirming:</p>
                        <ul className='ml-4 list-inside list-disc space-y-1'>
                            <li>
                                We'll send verification emails to both addresses
                            </li>
                            <li>
                                You must verify both emails to complete the
                                change
                            </li>
                            <li>
                                Your current email will remain active until
                                verification
                            </li>
                            <li>This process may take a few minutes</li>
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmChange}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Confirm Change'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

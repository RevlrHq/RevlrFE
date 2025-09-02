'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { SaveButton } from '../../shared/components/SaveButton';
import { Key, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PasswordSettingsProps, PasswordChangeRequest } from '../types';

interface PasswordStrength {
    score: number;
    feedback: string[];
    isValid: boolean;
}

export function PasswordSettings({
    lastPasswordChange,
    onChangePassword,
    isLoading = false,
}: PasswordSettingsProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const calculatePasswordStrength = (password: string): PasswordStrength => {
        const feedback: string[] = [];
        let score = 0;

        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('At least 8 characters');
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('One uppercase letter');
        }

        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('One lowercase letter');
        }

        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('One number');
        }

        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
        } else {
            feedback.push('One special character');
        }

        return {
            score,
            feedback,
            isValid: score >= 4,
        };
    };

    const passwordStrength = calculatePasswordStrength(newPassword);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!currentPassword.trim()) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!newPassword.trim()) {
            newErrors.newPassword = 'New password is required';
        } else if (!passwordStrength.isValid) {
            newErrors.newPassword =
                'Password does not meet security requirements';
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (currentPassword === newPassword && currentPassword.trim()) {
            newErrors.newPassword =
                'New password must be different from current password';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const request: PasswordChangeRequest = {
            currentPassword,
            newPassword,
            confirmPassword,
        };

        try {
            await onChangePassword(request);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setErrors({});
        } catch {
            // Error handling is done by the parent component
        }
    };

    const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const getStrengthColor = (score: number) => {
        if (score < 2) return 'bg-red-500';
        if (score < 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (score: number) => {
        if (score < 2) return 'Weak';
        if (score < 4) return 'Medium';
        return 'Strong';
    };

    return (
        <div className='space-y-6'>
            {/* Last Password Change Info */}
            {lastPasswordChange && (
                <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <Key className='mr-2 size-4' />
                    <span>
                        Last changed: {lastPasswordChange.toLocaleDateString()}
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Current Password */}
                <div>
                    <label
                        htmlFor='current-password'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                        Current Password
                    </label>
                    <div className='relative mt-1'>
                        <Input
                            id='current-password'
                            type={showPasswords.current ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder='Enter your current password'
                            disabled={isLoading}
                            aria-describedby={
                                errors.currentPassword
                                    ? 'current-password-error'
                                    : undefined
                            }
                        />
                        <button
                            type='button'
                            onClick={() => togglePasswordVisibility('current')}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            aria-label={
                                showPasswords.current
                                    ? 'Hide password'
                                    : 'Show password'
                            }
                        >
                            {showPasswords.current ? (
                                <EyeOff className='size-4' />
                            ) : (
                                <Eye className='size-4' />
                            )}
                        </button>
                    </div>
                    {errors.currentPassword && (
                        <p
                            id='current-password-error'
                            className='mt-1 text-sm text-red-600'
                        >
                            {errors.currentPassword}
                        </p>
                    )}
                </div>

                {/* New Password */}
                <div>
                    <label
                        htmlFor='new-password'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                        New Password
                    </label>
                    <div className='relative mt-1'>
                        <Input
                            id='new-password'
                            type={showPasswords.new ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder='Enter your new password'
                            disabled={isLoading}
                            aria-describedby={
                                errors.newPassword
                                    ? 'new-password-error'
                                    : undefined
                            }
                        />
                        <button
                            type='button'
                            onClick={() => togglePasswordVisibility('new')}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            aria-label={
                                showPasswords.new
                                    ? 'Hide password'
                                    : 'Show password'
                            }
                        >
                            {showPasswords.new ? (
                                <EyeOff className='size-4' />
                            ) : (
                                <Eye className='size-4' />
                            )}
                        </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                        <div className='mt-2 space-y-2'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs text-gray-600 dark:text-gray-400'>
                                    Password strength:{' '}
                                    {getStrengthText(passwordStrength.score)}
                                </span>
                                <div className='flex space-x-1'>
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={cn(
                                                'h-1 w-4 rounded-full',
                                                level <= passwordStrength.score
                                                    ? getStrengthColor(
                                                          passwordStrength.score
                                                      )
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>

                            {passwordStrength.feedback.length > 0 && (
                                <div className='text-xs text-gray-600 dark:text-gray-400'>
                                    <span>Missing: </span>
                                    {passwordStrength.feedback.join(', ')}
                                </div>
                            )}
                        </div>
                    )}

                    {errors.newPassword && (
                        <p
                            id='new-password-error'
                            className='mt-1 text-sm text-red-600'
                        >
                            {errors.newPassword}
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label
                        htmlFor='confirm-password'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300'
                    >
                        Confirm New Password
                    </label>
                    <div className='relative mt-1'>
                        <Input
                            id='confirm-password'
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder='Confirm your new password'
                            disabled={isLoading}
                            aria-describedby={
                                errors.confirmPassword
                                    ? 'confirm-password-error'
                                    : undefined
                            }
                        />
                        <button
                            type='button'
                            onClick={() => togglePasswordVisibility('confirm')}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                            aria-label={
                                showPasswords.confirm
                                    ? 'Hide password'
                                    : 'Show password'
                            }
                        >
                            {showPasswords.confirm ? (
                                <EyeOff className='size-4' />
                            ) : (
                                <Eye className='size-4' />
                            )}
                        </button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                        <div className='mt-1 flex items-center text-xs'>
                            {newPassword === confirmPassword ? (
                                <>
                                    <CheckCircle className='mr-1 size-3 text-green-500' />
                                    <span className='text-green-600'>
                                        Passwords match
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle className='mr-1 size-3 text-red-500' />
                                    <span className='text-red-600'>
                                        Passwords do not match
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                    {errors.confirmPassword && (
                        <p
                            id='confirm-password-error'
                            className='mt-1 text-sm text-red-600'
                        >
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                <SaveButton
                    type='submit'
                    isLoading={isLoading}
                    disabled={
                        !currentPassword.trim() ||
                        !newPassword.trim() ||
                        !confirmPassword.trim() ||
                        !passwordStrength.isValid ||
                        newPassword !== confirmPassword
                    }
                >
                    Change Password
                </SaveButton>
            </form>
        </div>
    );
}

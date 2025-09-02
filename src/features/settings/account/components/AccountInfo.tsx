'use client';

import React from 'react';
import { SettingsCard } from '../../shared/components/SettingsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Mail, Calendar, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AccountInfoProps } from '../types';

export function AccountInfo({
    accountInfo,
    onRefresh,
    isLoading,
}: AccountInfoProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'suspended':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'pending_deletion':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getVerificationColor = (status: string) => {
        switch (status) {
            case 'verified':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <SettingsCard
            title='Account Information'
            description='View your account details and status'
        >
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                        <User className='h-4 w-4 text-gray-500' />
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Account ID:
                        </span>
                        <span className='font-mono text-sm text-gray-900 dark:text-gray-100'>
                            {accountInfo.userId}
                        </span>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <Mail className='h-4 w-4 text-gray-500' />
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Email:
                        </span>
                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                            {accountInfo.email}
                        </span>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <Calendar className='h-4 w-4 text-gray-500' />
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Member since:
                        </span>
                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                            {formatDistanceToNow(accountInfo.createdAt, {
                                addSuffix: true,
                            })}
                        </span>
                    </div>
                </div>

                <div className='space-y-3'>
                    <div className='flex items-center space-x-2'>
                        <Shield className='h-4 w-4 text-gray-500' />
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Status:
                        </span>
                        <Badge className={getStatusColor(accountInfo.status)}>
                            {accountInfo.status.replace('_', ' ')}
                        </Badge>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <Shield className='h-4 w-4 text-gray-500' />
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Verification:
                        </span>
                        <Badge
                            className={getVerificationColor(
                                accountInfo.verificationStatus
                            )}
                        >
                            {accountInfo.verificationStatus}
                        </Badge>
                    </div>

                    <div className='flex items-center space-x-2'>
                        <Calendar className='h-4 w-4 text-gray-500' />
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                            Last login:
                        </span>
                        <span className='text-sm text-gray-900 dark:text-gray-100'>
                            {formatDistanceToNow(accountInfo.lastLoginAt, {
                                addSuffix: true,
                            })}
                        </span>
                    </div>
                </div>
            </div>

            <div className='flex justify-end pt-4'>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={onRefresh}
                    disabled={isLoading}
                    className='flex items-center space-x-2'
                >
                    <RefreshCw
                        className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh</span>
                </Button>
            </div>
        </SettingsCard>
    );
}

'use client';

import React from 'react';
import { SettingsCard } from '../../shared/components/SettingsCard';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import type { DangerZoneProps } from '../types';

export function DangerZone({
    onRequestDeletion,
    onExportData,
    hasActiveSubscription,
    hasPendingDeletion,
}: DangerZoneProps) {
    return (
        <SettingsCard
            title='Danger Zone'
            description='Irreversible and destructive actions'
            className='border-red-200 dark:border-red-800'
        >
            <div className='space-y-4'>
                <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
                    <div className='flex items-start space-x-2'>
                        <AlertTriangle className='mt-0.5 h-5 w-5 text-red-600 dark:text-red-400' />
                        <div className='text-sm text-red-800 dark:text-red-200'>
                            <p className='mb-1 font-medium'>Warning</p>
                            <p>
                                Actions in this section are permanent and cannot
                                be undone. Please proceed with caution.
                            </p>
                        </div>
                    </div>
                </div>

                <div className='space-y-4'>
                    <div className='flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700'>
                        <div className='space-y-1'>
                            <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                                Export Account Data
                            </h4>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Download a copy of all your account data before
                                deletion
                            </p>
                        </div>
                        <Button
                            variant='outline'
                            onClick={onExportData}
                            className='flex items-center space-x-2'
                        >
                            <Download className='h-4 w-4' />
                            <span>Export Data</span>
                        </Button>
                    </div>

                    <div className='flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-700 dark:bg-red-900/10'>
                        <div className='space-y-1'>
                            <h4 className='font-medium text-red-900 dark:text-red-100'>
                                Delete Account
                            </h4>
                            <p className='text-sm text-red-700 dark:text-red-300'>
                                Permanently delete your account and all
                                associated data
                            </p>
                            {hasActiveSubscription && (
                                <p className='text-xs font-medium text-red-600 dark:text-red-400'>
                                    ⚠️ You have an active subscription that must
                                    be cancelled first
                                </p>
                            )}
                            {hasPendingDeletion && (
                                <p className='text-xs font-medium text-yellow-600 dark:text-yellow-400'>
                                    ⏳ Account deletion is already scheduled
                                </p>
                            )}
                        </div>
                        <Button
                            variant='destructive'
                            onClick={onRequestDeletion}
                            disabled={
                                hasActiveSubscription || hasPendingDeletion
                            }
                            className='flex items-center space-x-2'
                        >
                            <Trash2 className='h-4 w-4' />
                            <span>
                                {hasPendingDeletion
                                    ? 'Deletion Pending'
                                    : 'Delete Account'}
                            </span>
                        </Button>
                    </div>
                </div>

                {(hasActiveSubscription || hasPendingDeletion) && (
                    <div className='space-y-1 text-xs text-gray-600 dark:text-gray-400'>
                        {hasActiveSubscription && (
                            <p>
                                • Cancel your subscription in the Billing
                                section before deleting your account
                            </p>
                        )}
                        {hasPendingDeletion && (
                            <p>
                                • Contact support if you need to cancel the
                                pending deletion request
                            </p>
                        )}
                    </div>
                )}
            </div>
        </SettingsCard>
    );
}

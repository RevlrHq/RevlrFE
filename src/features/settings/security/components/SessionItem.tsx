'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Monitor,
    Smartphone,
    Tablet,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionItemProps } from '../types';

export function SessionItem({
    session,
    onTerminate,
    isTerminating = false,
}: SessionItemProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const getDeviceIcon = () => {
        switch (session.deviceType) {
            case 'mobile':
                return <Smartphone className='size-4' />;
            case 'tablet':
                return <Tablet className='size-4' />;
            default:
                return <Monitor className='size-4' />;
        }
    };

    const formatLastActive = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) {
            return 'Active now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    };

    const handleTerminate = async () => {
        setShowConfirmDialog(false);
        await onTerminate(session.id);
    };

    return (
        <>
            <div
                className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    'bg-white dark:bg-gray-800',
                    session.isCurrent
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                )}
            >
                <div className='flex items-start space-x-3'>
                    <div
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            session.isCurrent
                                ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        )}
                    >
                        {getDeviceIcon()}
                    </div>

                    <div className='min-w-0 flex-1'>
                        <div className='flex items-center space-x-2'>
                            <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                {session.deviceName}
                            </h4>
                            {session.isCurrent && (
                                <div className='flex items-center text-xs text-green-600 dark:text-green-400'>
                                    <CheckCircle className='mr-1 size-3' />
                                    Current
                                </div>
                            )}
                        </div>

                        <div className='mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400'>
                            <div className='flex items-center'>
                                <span className='font-medium'>
                                    {session.browser}
                                </span>
                            </div>

                            {session.location && (
                                <div className='flex items-center'>
                                    <MapPin className='mr-1 size-3' />
                                    <span>{session.location}</span>
                                </div>
                            )}

                            <div className='flex items-center'>
                                <Clock className='mr-1 size-3' />
                                <span>
                                    {formatLastActive(session.lastActive)}
                                </span>
                            </div>

                            <div className='text-gray-500 dark:text-gray-500'>
                                IP: {session.ipAddress}
                            </div>
                        </div>
                    </div>
                </div>

                {!session.isCurrent && (
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setShowConfirmDialog(true)}
                        disabled={isTerminating}
                        className='ml-4 text-red-600 hover:border-red-300 hover:text-red-700'
                    >
                        {isTerminating ? 'Terminating...' : 'Terminate'}
                    </Button>
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog
                open={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='flex items-center'>
                            <AlertTriangle className='mr-2 size-5 text-amber-500' />
                            Terminate Session
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to terminate this session?
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-3 text-sm text-gray-600 dark:text-gray-400'>
                        <div className='rounded-lg border border-gray-200 p-3 dark:border-gray-700'>
                            <div className='font-medium text-gray-900 dark:text-gray-100'>
                                {session.deviceName}
                            </div>
                            <div className='mt-1 space-y-1 text-xs'>
                                <div>{session.browser}</div>
                                {session.location && (
                                    <div>{session.location}</div>
                                )}
                                <div>
                                    Last active:{' '}
                                    {formatLastActive(session.lastActive)}
                                </div>
                            </div>
                        </div>

                        <p className='text-xs text-gray-500 dark:text-gray-500'>
                            This will immediately log out this device. You'll
                            need to log in again to access your account from
                            this device.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={isTerminating}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={handleTerminate}
                            disabled={isTerminating}
                        >
                            {isTerminating
                                ? 'Terminating...'
                                : 'Terminate Session'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

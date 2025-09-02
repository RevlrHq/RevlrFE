'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SessionItem } from './SessionItem';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Shield } from 'lucide-react';
import type { SessionManagerProps } from '../types';

export function SessionManager({
    sessions,
    onTerminateSession,
    onTerminateAll,
    isLoading = false,
}: SessionManagerProps) {
    const [terminatingSessionId, setTerminatingSessionId] = useState<
        string | null
    >(null);
    const [showTerminateAllDialog, setShowTerminateAllDialog] = useState(false);
    const [isTerminatingAll, setIsTerminatingAll] = useState(false);

    const currentSession = sessions.find((session) => session.isCurrent);
    const otherSessions = sessions.filter((session) => !session.isCurrent);

    const handleTerminateSession = async (sessionId: string) => {
        setTerminatingSessionId(sessionId);
        try {
            await onTerminateSession(sessionId);
        } finally {
            setTerminatingSessionId(null);
        }
    };

    const handleTerminateAll = async () => {
        setIsTerminatingAll(true);
        try {
            await onTerminateAll();
            setShowTerminateAllDialog(false);
        } finally {
            setIsTerminatingAll(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner text='Loading sessions...' />;
    }

    return (
        <div className='space-y-6'>
            {/* Session Summary */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
                    <Shield className='mr-2 size-4' />
                    <span>
                        {sessions.length} active session
                        {sessions.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {otherSessions.length > 0 && (
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setShowTerminateAllDialog(true)}
                        disabled={isLoading}
                    >
                        Terminate All Other Sessions
                    </Button>
                )}
            </div>

            {/* Current Session */}
            {currentSession && (
                <div>
                    <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                        Current Session
                    </h4>
                    <SessionItem
                        session={currentSession}
                        onTerminate={handleTerminateSession}
                        isTerminating={
                            terminatingSessionId === currentSession.id
                        }
                    />
                </div>
            )}

            {/* Other Sessions */}
            {otherSessions.length > 0 && (
                <div>
                    <h4 className='mb-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                        Other Sessions ({otherSessions.length})
                    </h4>
                    <div className='space-y-3'>
                        {otherSessions.map((session) => (
                            <SessionItem
                                key={session.id}
                                session={session}
                                onTerminate={handleTerminateSession}
                                isTerminating={
                                    terminatingSessionId === session.id
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* No Other Sessions */}
            {otherSessions.length === 0 && currentSession && (
                <div className='py-6 text-center'>
                    <Shield className='mx-auto mb-2 size-8 text-gray-400' />
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                        No other active sessions found.
                    </p>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-500'>
                        You're only logged in on this device.
                    </p>
                </div>
            )}

            {/* Terminate All Confirmation Dialog */}
            <Dialog
                open={showTerminateAllDialog}
                onOpenChange={setShowTerminateAllDialog}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='flex items-center'>
                            <AlertTriangle className='mr-2 size-5 text-amber-500' />
                            Terminate All Other Sessions
                        </DialogTitle>
                        <DialogDescription>
                            This will log you out of all other devices and
                            browsers. Your current session will remain active.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-3 text-sm text-gray-600 dark:text-gray-400'>
                        <p>You are about to terminate:</p>
                        <ul className='ml-4 list-inside list-disc space-y-1'>
                            {otherSessions.map((session) => (
                                <li key={session.id}>
                                    {session.deviceName} - {session.browser}
                                </li>
                            ))}
                        </ul>
                        <p className='text-xs text-gray-500 dark:text-gray-500'>
                            This action cannot be undone. You'll need to log in
                            again on those devices.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setShowTerminateAllDialog(false)}
                            disabled={isTerminatingAll}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={handleTerminateAll}
                            disabled={isTerminatingAll}
                        >
                            {isTerminatingAll
                                ? 'Terminating...'
                                : 'Terminate All'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

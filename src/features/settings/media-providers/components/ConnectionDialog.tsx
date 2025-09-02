'use client';

import React, { useState } from 'react';
import { ExternalLink, Shield, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ConnectionDialogProps, MediaProviderConnection } from '../types';

/**
 * Dialog component for handling OAuth connection flow to media providers
 * Shows permissions, terms, and initiates connection process
 */
export function ConnectionDialog({
    provider,
    isOpen,
    onClose,
    onConnect,
}: ConnectionDialogProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        provider.permissions.filter((p) => p.required).map((p) => p.id)
    );
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        setSelectedPermissions((prev) =>
            checked
                ? [...prev, permissionId]
                : prev.filter((id) => id !== permissionId)
        );
    };

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            const connection: MediaProviderConnection = {
                providerId: provider.id,
                permissions: selectedPermissions,
                config: {},
            };

            await onConnect(connection);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
        } finally {
            setIsConnecting(false);
        }
    };

    const requiredPermissions = provider.permissions.filter((p) => p.required);
    const optionalPermissions = provider.permissions.filter((p) => !p.required);
    const canConnect = requiredPermissions.every((p) =>
        selectedPermissions.includes(p.id)
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className='flex items-center space-x-2'>
                        <span>Connect to {provider.name}</span>
                        <ExternalLink className='size-4 text-gray-400' />
                    </DialogTitle>
                    <DialogDescription>
                        Grant permissions to connect your {provider.name}{' '}
                        account and access media content.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4'>
                    {/* Provider Info */}
                    <div className='flex items-center space-x-3 rounded-lg bg-gray-50 p-3'>
                        <div className='flex size-10 items-center justify-center rounded-lg border bg-white'>
                            <span className='text-sm font-medium text-gray-600'>
                                {provider.icon ||
                                    provider.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <div className='font-medium text-gray-900'>
                                {provider.name}
                            </div>
                            <div className='text-sm text-gray-500'>
                                {provider.description}
                            </div>
                        </div>
                    </div>

                    {/* Required Permissions */}
                    {requiredPermissions.length > 0 && (
                        <div>
                            <h4 className='mb-2 flex items-center text-sm font-medium text-gray-900'>
                                <Shield className='mr-1 size-4' />
                                Required Permissions
                            </h4>
                            <div className='space-y-2'>
                                {requiredPermissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className='flex items-start space-x-2'
                                    >
                                        <Checkbox
                                            id={permission.id}
                                            checked={true}
                                            disabled={true}
                                            className='mt-0.5'
                                        />
                                        <div className='flex-1'>
                                            <label
                                                htmlFor={permission.id}
                                                className='text-sm font-medium text-gray-700'
                                            >
                                                {permission.name}
                                            </label>
                                            <p className='text-xs text-gray-500'>
                                                {permission.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Optional Permissions */}
                    {optionalPermissions.length > 0 && (
                        <div>
                            <h4 className='mb-2 text-sm font-medium text-gray-900'>
                                Optional Permissions
                            </h4>
                            <div className='space-y-2'>
                                {optionalPermissions.map((permission) => (
                                    <div
                                        key={permission.id}
                                        className='flex items-start space-x-2'
                                    >
                                        <Checkbox
                                            id={permission.id}
                                            checked={selectedPermissions.includes(
                                                permission.id
                                            )}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(
                                                    permission.id,
                                                    checked as boolean
                                                )
                                            }
                                            className='mt-0.5'
                                        />
                                        <div className='flex-1'>
                                            <label
                                                htmlFor={permission.id}
                                                className='cursor-pointer text-sm font-medium text-gray-700'
                                            >
                                                {permission.name}
                                            </label>
                                            <p className='text-xs text-gray-500'>
                                                {permission.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <Alert variant='destructive'>
                            <AlertCircle className='size-4' />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Security Notice */}
                    <Alert>
                        <Shield className='size-4' />
                        <AlertDescription className='text-xs'>
                            Your credentials are securely stored and encrypted.
                            You can revoke access at any time.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={onClose}
                        disabled={isConnecting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConnect}
                        disabled={!canConnect || isConnecting}
                        className='min-w-[100px]'
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

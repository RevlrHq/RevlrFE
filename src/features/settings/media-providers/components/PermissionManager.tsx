'use client';

import React, { useState } from 'react';
import { Shield, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PermissionManagerProps } from '../types';

/**
 * Component for managing permissions granted to a media provider
 * Allows users to view and modify granted permissions
 */
export function PermissionManager({
    provider,
    onUpdatePermissions,
    isLoading = false,
}: PermissionManagerProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        provider.permissions.filter((p) => p.granted).map((p) => p.id)
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePermissionChange = (permissionId: string, checked: boolean) => {
        const permission = provider.permissions.find(
            (p) => p.id === permissionId
        );

        // Prevent unchecking required permissions
        if (permission?.required && !checked) {
            return;
        }

        setSelectedPermissions((prev) =>
            checked
                ? [...prev, permissionId]
                : prev.filter((id) => id !== permissionId)
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            await onUpdatePermissions(selectedPermissions);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update permissions'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges =
        JSON.stringify(selectedPermissions.sort()) !==
        JSON.stringify(
            provider.permissions
                .filter((p) => p.granted)
                .map((p) => p.id)
                .sort()
        );

    const requiredPermissions = provider.permissions.filter((p) => p.required);
    const optionalPermissions = provider.permissions.filter((p) => !p.required);

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                    <Shield className='size-5' />
                    <span>Permissions for {provider.name}</span>
                </CardTitle>
            </CardHeader>

            <CardContent className='space-y-4'>
                {/* Connection Status */}
                <div className='flex items-center justify-between rounded-lg bg-gray-50 p-3'>
                    <div className='flex items-center space-x-2'>
                        <div
                            className={`size-2 rounded-full ${
                                provider.connectionStatus === 'connected'
                                    ? 'bg-green-500'
                                    : provider.connectionStatus === 'error'
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                            }`}
                        />
                        <span className='text-sm font-medium capitalize'>
                            {provider.connectionStatus}
                        </span>
                    </div>
                    {provider.lastSync && (
                        <span className='text-xs text-gray-500'>
                            Last sync:{' '}
                            {new Date(provider.lastSync).toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Required Permissions */}
                {requiredPermissions.length > 0 && (
                    <div>
                        <h4 className='mb-3 flex items-center text-sm font-medium text-gray-900'>
                            <Check className='mr-1 size-4 text-green-600' />
                            Required Permissions
                        </h4>
                        <div className='space-y-3'>
                            {requiredPermissions.map((permission) => (
                                <div
                                    key={permission.id}
                                    className='flex items-start space-x-3'
                                >
                                    <Checkbox
                                        id={`required-${permission.id}`}
                                        checked={true}
                                        disabled={true}
                                        className='mt-0.5'
                                    />
                                    <div className='flex-1'>
                                        <label
                                            htmlFor={`required-${permission.id}`}
                                            className='text-sm font-medium text-gray-700'
                                        >
                                            {permission.name}
                                        </label>
                                        <p className='mt-1 text-xs text-gray-500'>
                                            {permission.description}
                                        </p>
                                        <div className='mt-1 flex items-center'>
                                            <span className='inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'>
                                                Required
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Optional Permissions */}
                {optionalPermissions.length > 0 && (
                    <div>
                        <h4 className='mb-3 text-sm font-medium text-gray-900'>
                            Optional Permissions
                        </h4>
                        <div className='space-y-3'>
                            {optionalPermissions.map((permission) => {
                                const isSelected = selectedPermissions.includes(
                                    permission.id
                                );
                                return (
                                    <div
                                        key={permission.id}
                                        className='flex items-start space-x-3'
                                    >
                                        <Checkbox
                                            id={`optional-${permission.id}`}
                                            checked={isSelected}
                                            onCheckedChange={(checked) =>
                                                handlePermissionChange(
                                                    permission.id,
                                                    checked as boolean
                                                )
                                            }
                                            disabled={isLoading || isSaving}
                                            className='mt-0.5'
                                        />
                                        <div className='flex-1'>
                                            <label
                                                htmlFor={`optional-${permission.id}`}
                                                className='cursor-pointer text-sm font-medium text-gray-700'
                                            >
                                                {permission.name}
                                            </label>
                                            <p className='mt-1 text-xs text-gray-500'>
                                                {permission.description}
                                            </p>
                                            <div className='mt-1 flex items-center'>
                                                <span
                                                    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                                                        isSelected
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {isSelected
                                                        ? 'Granted'
                                                        : 'Not granted'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <Alert variant='destructive'>
                        <AlertTriangle className='size-4' />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Security Notice */}
                <Alert>
                    <Shield className='size-4' />
                    <AlertDescription className='text-xs'>
                        Changes to permissions may require re-authentication
                        with the provider. Required permissions cannot be
                        disabled.
                    </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                {hasChanges && (
                    <div className='flex justify-end space-x-2 border-t pt-4'>
                        <Button
                            variant='outline'
                            onClick={() =>
                                setSelectedPermissions(
                                    provider.permissions
                                        .filter((p) => p.granted)
                                        .map((p) => p.id)
                                )
                            }
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className='min-w-[80px]'
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

'use client';

import React from 'react';
import { Settings, Unlink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ProviderStatus } from './ProviderStatus';
import type { ProviderCardProps } from '../types';

/**
 * Card component for displaying individual media provider information
 * Shows connection status, actions, and provider details
 */
export function ProviderCard({
    provider,
    onConnect,
    onDisconnect,
    onConfigure,
    isLoading = false,
}: ProviderCardProps) {
    const isConnected = provider.isConnected;
    const hasError = provider.connectionStatus === 'error';
    const isExpired = provider.connectionStatus === 'expired';

    return (
        <Card
            className={`transition-colors ${hasError ? 'border-red-200 bg-red-50' : ''}`}
        >
            <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                        <div className='flex size-8 items-center justify-center rounded-lg bg-gray-100'>
                            <span className='text-sm font-medium text-gray-600'>
                                {provider.icon ||
                                    provider.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h4 className='font-medium text-gray-900'>
                                {provider.name}
                            </h4>
                            <p className='text-sm text-gray-500'>
                                {provider.description}
                            </p>
                        </div>
                    </div>
                    <ProviderStatus
                        status={provider.connectionStatus}
                        lastSync={provider.lastSync}
                    />
                </div>
            </CardHeader>

            <CardContent className='pt-0'>
                <div className='flex items-center justify-between'>
                    <div className='text-sm text-gray-600'>
                        {isConnected && provider.connectedAt && (
                            <span>
                                Connected{' '}
                                {new Date(
                                    provider.connectedAt
                                ).toLocaleDateString()}
                            </span>
                        )}
                        {!isConnected && <span>Not connected</span>}
                    </div>

                    <div className='flex items-center space-x-2'>
                        {isConnected ? (
                            <>
                                {(hasError || isExpired) && (
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={onConfigure}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className='mr-1 size-4' />
                                        Reconnect
                                    </Button>
                                )}

                                {!hasError && !isExpired && (
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={onConfigure}
                                        disabled={isLoading}
                                    >
                                        <Settings className='mr-1 size-4' />
                                        Configure
                                    </Button>
                                )}

                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={onDisconnect}
                                    disabled={isLoading}
                                    className='text-red-600 hover:bg-red-50 hover:text-red-700'
                                >
                                    <Unlink className='mr-1 size-4' />
                                    Disconnect
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant='default'
                                size='sm'
                                onClick={onConnect}
                                disabled={isLoading}
                            >
                                Connect
                            </Button>
                        )}
                    </div>
                </div>

                {/* Permissions Summary */}
                {isConnected && provider.permissions.length > 0 && (
                    <div className='mt-3 border-t border-gray-100 pt-3'>
                        <div className='text-xs text-gray-500'>
                            Permissions:{' '}
                            {
                                provider.permissions.filter((p) => p.granted)
                                    .length
                            }{' '}
                            of {provider.permissions.length} granted
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

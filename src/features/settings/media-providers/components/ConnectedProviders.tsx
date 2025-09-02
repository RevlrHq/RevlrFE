'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProviderCard } from './ProviderCard';
import { ConnectionDialog } from './ConnectionDialog';
import type {
    ConnectedProvidersProps,
    MediaProvider,
    MediaProviderConnection,
} from '../types';

/**
 * Component that displays list of connected and available media providers
 * Handles provider connection/disconnection workflows
 */
export function ConnectedProviders({
    providers,
    onConnect,
    onDisconnect,
    onRefresh,
    isLoading = false,
}: ConnectedProvidersProps) {
    const [selectedProvider, setSelectedProvider] =
        useState<MediaProvider | null>(null);
    const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);

    const connectedProviders = providers.filter((p) => p.isConnected);
    const availableProviders = providers.filter((p) => !p.isConnected);

    const handleConnect = (provider: MediaProvider) => {
        setSelectedProvider(provider);
        setIsConnectionDialogOpen(true);
    };

    const handleConnectionComplete = async (
        connection: MediaProviderConnection
    ) => {
        try {
            await onConnect(connection);
            setIsConnectionDialogOpen(false);
            setSelectedProvider(null);
        } catch (error) {
            // Error handling is managed by the parent component
            console.error('Connection failed:', error);
        }
    };

    const handleDisconnect = async (provider: MediaProvider) => {
        try {
            await onDisconnect({
                providerId: provider.id,
                revokeAccess: true,
            });
        } catch (error) {
            console.error('Disconnection failed:', error);
        }
    };

    const handleRefresh = async (provider: MediaProvider) => {
        try {
            await onRefresh(provider.id);
        } catch (error) {
            console.error('Refresh failed:', error);
        }
    };

    return (
        <div className='space-y-6'>
            {/* Connected Providers */}
            {connectedProviders.length > 0 && (
                <div>
                    <h3 className='mb-3 text-sm font-medium text-gray-900'>
                        Connected Services ({connectedProviders.length})
                    </h3>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        {connectedProviders.map((provider) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onConnect={() => handleConnect(provider)}
                                onDisconnect={() => handleDisconnect(provider)}
                                onConfigure={() => handleRefresh(provider)}
                                isLoading={isLoading}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Available Providers */}
            {availableProviders.length > 0 && (
                <div>
                    <div className='mb-3 flex items-center justify-between'>
                        <h3 className='text-sm font-medium text-gray-900'>
                            Available Services
                        </h3>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                                if (availableProviders.length > 0) {
                                    handleConnect(availableProviders[0]);
                                }
                            }}
                            disabled={
                                isLoading || availableProviders.length === 0
                            }
                        >
                            <Plus className='mr-2 size-4' />
                            Connect Service
                        </Button>
                    </div>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        {availableProviders.map((provider) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onConnect={() => handleConnect(provider)}
                                onDisconnect={() => handleDisconnect(provider)}
                                onConfigure={() => handleRefresh(provider)}
                                isLoading={isLoading}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {providers.length === 0 && !isLoading && (
                <div className='py-8 text-center'>
                    <div className='mb-2 text-gray-500'>
                        No media providers available
                    </div>
                    <p className='text-sm text-gray-400'>
                        Media providers will appear here when they become
                        available
                    </p>
                </div>
            )}

            {/* Connection Dialog */}
            {selectedProvider && (
                <ConnectionDialog
                    provider={selectedProvider}
                    isOpen={isConnectionDialogOpen}
                    onClose={() => {
                        setIsConnectionDialogOpen(false);
                        setSelectedProvider(null);
                    }}
                    onConnect={handleConnectionComplete}
                />
            )}
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useMediaSearch } from '@/hooks/useMediaSearch';
import type { MediaItem } from '@/types/media-search';

/**
 * Simple test component to verify media search functionality
 */
export function MediaSearchTestComponent() {
    const [query, setQuery] = useState('');

    const { state, actions, service } = useMediaSearch({
        initialQuery: '',
        maxSelectedItems: 5,
        debounceDelay: 1000,
    });

    const handleSearch = () => {
        if (query.trim()) {
            actions.search(query);
        }
    };

    const handleSelectItem = (item: MediaItem) => {
        actions.selectItem(item);
    };

    return (
        <div className='mx-auto max-w-4xl p-6'>
            <h2 className='mb-4 text-2xl font-bold'>Media Search Test</h2>

            {/* Initialization Status */}
            <div className='mb-4 rounded bg-gray-100 p-4'>
                <h3 className='mb-2 font-semibold'>Service Status:</h3>
                <div className='space-y-1 text-sm'>
                    <div>
                        Initializing: {state.isInitializing ? 'Yes' : 'No'}
                    </div>
                    <div>Initialized: {state.isInitialized ? 'Yes' : 'No'}</div>
                    <div>Service Ready: {service ? 'Yes' : 'No'}</div>
                    <div>
                        Available Providers: {state.availableProviders.length}
                    </div>
                    <div>
                        Active Providers:{' '}
                        {state.activeProviders.join(', ') || 'None'}
                    </div>
                    {state.initializationError && (
                        <div className='text-red-600'>
                            Error: {state.initializationError}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Interface */}
            <div className='mb-4'>
                <div className='mb-2 flex gap-2'>
                    <input
                        type='text'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Search for images...'
                        className='flex-1 rounded border border-gray-300 px-3 py-2'
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={state.isLoading || !state.isInitialized}
                        className='rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400'
                    >
                        {state.isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {!state.isInitialized && (
                    <button
                        onClick={actions.retryInitialization}
                        className='rounded bg-green-500 px-4 py-2 text-white'
                    >
                        Retry Initialization
                    </button>
                )}
            </div>

            {/* Error Display */}
            {state.error && (
                <div className='mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700'>
                    Error: {state.error}
                </div>
            )}

            {/* Results */}
            {state.results && (
                <div className='mb-4'>
                    <h3 className='mb-2 font-semibold'>
                        Results: {state.results.items.length} items
                        {state.results.totalResults &&
                            ` (${state.results.totalResults} total)`}
                    </h3>

                    <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                        {state.results.items.slice(0, 12).map((item) => (
                            <div
                                key={`${item.providerId}-${item.id}`}
                                className='rounded border p-2'
                            >
                                <Image
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    width={200}
                                    height={128}
                                    className='mb-2 h-32 w-full rounded object-cover'
                                />
                                <div className='text-xs'>
                                    <div className='truncate font-medium'>
                                        {item.title}
                                    </div>
                                    <div className='text-gray-500'>
                                        {item.providerId}
                                    </div>
                                    <div className='text-gray-500'>
                                        {item.width}x{item.height}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSelectItem(item)}
                                    className='mt-2 w-full rounded bg-blue-500 px-2 py-1 text-xs text-white'
                                >
                                    Select
                                </button>
                            </div>
                        ))}
                    </div>

                    {state.hasMore && (
                        <button
                            onClick={actions.loadMore}
                            disabled={state.isLoading}
                            className='mt-4 rounded bg-gray-500 px-4 py-2 text-white disabled:bg-gray-400'
                        >
                            {state.isLoading ? 'Loading...' : 'Load More'}
                        </button>
                    )}
                </div>
            )}

            {/* Selected Items */}
            {state.selectedItems.length > 0 && (
                <div className='mb-4'>
                    <h3 className='mb-2 font-semibold'>
                        Selected Items: {state.selectedItems.length}
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                        {state.selectedItems.map((item) => (
                            <div
                                key={`selected-${item.providerId}-${item.id}`}
                                className='relative'
                            >
                                <Image
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    width={64}
                                    height={64}
                                    className='size-16 rounded object-cover'
                                />
                                <button
                                    onClick={() =>
                                        actions.deselectItem(item.id)
                                    }
                                    className='absolute -right-1 -top-1 size-5 rounded-full bg-red-500 text-xs text-white'
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={actions.clearSelection}
                        className='mt-2 rounded bg-red-500 px-3 py-1 text-sm text-white'
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {/* Debug Info */}
            <details className='mt-6'>
                <summary className='cursor-pointer font-semibold'>
                    Debug Information
                </summary>
                <pre className='mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs'>
                    {JSON.stringify(
                        {
                            isInitializing: state.isInitializing,
                            isInitialized: state.isInitialized,
                            availableProviders: state.availableProviders.map(
                                (p) => ({
                                    id: p.id,
                                    name: p.name,
                                    isAvailable: p.isAvailable,
                                })
                            ),
                            activeProviders: state.activeProviders,
                            hasService: !!service,
                            resultsCount: state.results?.items.length || 0,
                            selectedCount: state.selectedItems.length,
                            error: state.error,
                            initializationError: state.initializationError,
                        },
                        null,
                        2
                    )}
                </pre>
            </details>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useMediaSearch } from '@src/hooks/useMediaSearch';
import {
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Info,
    RefreshCw,
    Search,
    Filter,
    Eye,
    EyeOff,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { MediaItem, ProviderStatus } from '@src/types/media-search';
import { MediaCard } from './MediaCard';
import { MediaGridSkeleton } from './MediaGridSkeleton';
import { EmptyState } from './EmptyState';
import MediaSearchErrorDisplay from './MediaSearchErrorDisplay';
import ProviderStatusPanel from './ProviderStatusPanel';

interface MediaSearchWithGracefulDegradationProps {
    onSelectMedia: (items: MediaItem[]) => void;
    eventCategory?: string;
    maxImages?: number;
    className?: string;
}

interface ProviderGroup {
    healthy: ProviderStatus[];
    degraded: ProviderStatus[];
    unavailable: ProviderStatus[];
}

export const MediaSearchWithGracefulDegradation: React.FC<
    MediaSearchWithGracefulDegradationProps
> = ({ onSelectMedia, eventCategory, maxImages = 5, className = '' }) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [showProviderDetails, setShowProviderDetails] = useState(false);
    const [degradationMode, setDegradationMode] = useState<
        'full' | 'partial' | 'minimal'
    >('full');

    const { state, actions } = useMediaSearch({
        eventCategory: eventCategory as any,
        maxSelectedItems: maxImages,
        enableAutoSuggestions: true,
        preloadPopular: true,
    });

    // Categorize providers by health status
    const categorizeProviders = useCallback(
        (providers: ProviderStatus[]): ProviderGroup => {
            return providers.reduce(
                (groups, provider) => {
                    if (!provider.isAvailable) {
                        groups.unavailable.push(provider);
                    } else if (provider.healthScore < 70) {
                        groups.degraded.push(provider);
                    } else {
                        groups.healthy.push(provider);
                    }
                    return groups;
                },
                { healthy: [], degraded: [], unavailable: [] } as ProviderGroup
            );
        },
        []
    );

    const providerGroups = categorizeProviders(state.availableProviders);

    // Determine degradation mode based on provider availability
    useEffect(() => {
        const totalProviders = state.availableProviders.length;
        const healthyProviders = providerGroups.healthy.length;
        const availableProviders =
            healthyProviders + providerGroups.degraded.length;

        if (availableProviders === 0) {
            setDegradationMode('minimal');
        } else if (healthyProviders < totalProviders * 0.5) {
            setDegradationMode('partial');
        } else {
            setDegradationMode('full');
        }
    }, [state.availableProviders, providerGroups]);

    // Handle search with graceful degradation
    const handleSearch = useCallback(
        async (query: string) => {
            if (!query.trim()) return;

            setSearchQuery(query);

            // If no providers available, show fallback immediately
            if (
                providerGroups.healthy.length === 0 &&
                providerGroups.degraded.length === 0
            ) {
                return;
            }

            // Prioritize healthy providers, fallback to degraded ones
            const preferredProviders = [
                ...providerGroups.healthy.map((p) => p.id),
                ...providerGroups.degraded.map((p) => p.id),
            ];

            // Update active providers to use only available ones
            preferredProviders.forEach((providerId) => {
                if (!state.activeProviders.includes(providerId)) {
                    actions.toggleProvider(providerId);
                }
            });

            try {
                await actions.search(query);
            } catch (error) {
                console.error(
                    'Search failed with graceful degradation:',
                    error
                );
            }
        },
        [actions, providerGroups, state.activeProviders]
    );

    // Get degradation status message
    const getDegradationStatus = () => {
        const totalProviders = state.availableProviders.length;
        const healthyCount = providerGroups.healthy.length;
        const degradedCount = providerGroups.degraded.length;
        const unavailableCount = providerGroups.unavailable.length;

        switch (degradationMode) {
            case 'minimal':
                return {
                    icon: <AlertCircle className='h-4 w-4 text-red-500' />,
                    message:
                        'All media providers are unavailable. Using fallback options.',
                    severity: 'error' as const,
                    details: `${unavailableCount}/${totalProviders} providers unavailable`,
                };
            case 'partial':
                return {
                    icon: <AlertTriangle className='h-4 w-4 text-yellow-500' />,
                    message:
                        'Some media providers are experiencing issues. Search results may be limited.',
                    severity: 'warning' as const,
                    details: `${healthyCount} healthy, ${degradedCount} degraded, ${unavailableCount} unavailable`,
                };
            case 'full':
                return {
                    icon: <CheckCircle className='h-4 w-4 text-green-500' />,
                    message: 'All media providers are operating normally.',
                    severity: 'success' as const,
                    details: `${healthyCount}/${totalProviders} providers healthy`,
                };
            default:
                return null;
        }
    };

    const degradationStatus = getDegradationStatus();

    // Render search results with degradation awareness
    const renderSearchResults = () => {
        if (state.isLoading) {
            return <MediaGridSkeleton count={12} />;
        }

        if (state.error) {
            return (
                <MediaSearchErrorDisplay
                    error={state.error}
                    providerErrors={state.providerErrors}
                    isInitializing={state.isInitializing}
                    isInitialized={state.isInitialized}
                    initializationError={state.initializationError}
                    availableProviders={state.activeProviders.length}
                    totalProviders={state.availableProviders.length}
                    onRetry={() => {
                        if (searchQuery.trim()) {
                            handleSearch(searchQuery);
                        } else if (actions.retryInitialization) {
                            actions.retryInitialization();
                        }
                    }}
                />
            );
        }

        if (state.results && state.results.items.length > 0) {
            return (
                <div className='space-y-4'>
                    {/* Results with provider attribution */}
                    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                        {state.results.items.map((item) => {
                            const isSelected = state.selectedItems.some(
                                (selected) =>
                                    selected.id === item.id &&
                                    selected.providerId === item.providerId
                            );

                            return (
                                <div
                                    key={`${item.providerId}-${item.id}`}
                                    className='relative'
                                >
                                    <MediaCard
                                        item={item}
                                        isSelected={isSelected}
                                        onSelect={() =>
                                            actions.toggleItemSelection(item)
                                        }
                                        onPreview={() =>
                                            actions.previewItem(item)
                                        }
                                        disabled={false}
                                    />
                                    {/* Provider indicator */}
                                    <div
                                        className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-xs font-medium ${
                                            theme === 'dark'
                                                ? 'bg-gray-800/80 text-gray-300'
                                                : 'bg-white/80 text-gray-700'
                                        }`}
                                    >
                                        {item.providerId}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Provider performance notice */}
                    {degradationMode === 'partial' && (
                        <div
                            className={`rounded-lg p-3 ${theme === 'dark' ? 'border-yellow-700 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'} border`}
                        >
                            <div className='flex items-center space-x-2'>
                                <AlertTriangle className='h-4 w-4 text-yellow-500' />
                                <span
                                    className={`text-sm ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}
                                >
                                    Results may be limited due to provider
                                    issues. Some images might load slowly.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (
            state.results &&
            state.results.items.length === 0 &&
            searchQuery.trim()
        ) {
            return (
                <EmptyState
                    title='No results found'
                    description={
                        degradationMode === 'partial'
                            ? 'No results found. Some providers are experiencing issues - try a different search term.'
                            : 'No results found. Try a different search term or check your spelling.'
                    }
                    action={
                        degradationMode === 'partial'
                            ? {
                                  label: 'Retry with all providers',
                                  onClick: () => {
                                      // Enable all available providers
                                      [
                                          ...providerGroups.healthy,
                                          ...providerGroups.degraded,
                                      ].forEach((provider) => {
                                          if (
                                              !state.activeProviders.includes(
                                                  provider.id
                                              )
                                          ) {
                                              actions.toggleProvider(
                                                  provider.id
                                              );
                                          }
                                      });
                                      if (searchQuery.trim()) {
                                          handleSearch(searchQuery);
                                      }
                                  },
                              }
                            : undefined
                    }
                />
            );
        }

        return null;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Degradation Status Bar */}
            {degradationStatus && (
                <div
                    className={`rounded-lg border p-3 ${
                        degradationStatus.severity === 'error'
                            ? theme === 'dark'
                                ? 'border-red-700 bg-red-900/20'
                                : 'border-red-200 bg-red-50'
                            : degradationStatus.severity === 'warning'
                              ? theme === 'dark'
                                  ? 'border-yellow-700 bg-yellow-900/20'
                                  : 'border-yellow-200 bg-yellow-50'
                              : theme === 'dark'
                                ? 'border-green-700 bg-green-900/20'
                                : 'border-green-200 bg-green-50'
                    }`}
                >
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                            {degradationStatus.icon}
                            <span
                                className={`text-sm font-medium ${
                                    degradationStatus.severity === 'error'
                                        ? theme === 'dark'
                                            ? 'text-red-200'
                                            : 'text-red-800'
                                        : degradationStatus.severity ===
                                            'warning'
                                          ? theme === 'dark'
                                              ? 'text-yellow-200'
                                              : 'text-yellow-800'
                                          : theme === 'dark'
                                            ? 'text-green-200'
                                            : 'text-green-800'
                                }`}
                            >
                                {degradationStatus.message}
                            </span>
                        </div>
                        <button
                            onClick={() =>
                                setShowProviderDetails(!showProviderDetails)
                            }
                            className={`rounded px-2 py-1 text-xs transition-colors ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:bg-gray-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {showProviderDetails ? 'Hide' : 'Show'} Details
                        </button>
                    </div>
                    {showProviderDetails && (
                        <div
                            className={`mt-2 text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {degradationStatus.details}
                        </div>
                    )}
                </div>
            )}

            {/* Search Bar */}
            <div className='relative'>
                <div className='relative'>
                    <Search
                        className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    />
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch(searchQuery);
                            }
                        }}
                        placeholder='Search for images...'
                        className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            theme === 'dark'
                                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                        }`}
                        disabled={degradationMode === 'minimal'}
                    />
                </div>

                {degradationMode === 'minimal' && (
                    <div className='absolute inset-0 flex items-center justify-center rounded-lg bg-black/10'>
                        <span
                            className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            Search unavailable - no providers active
                        </span>
                    </div>
                )}
            </div>

            {/* Provider Status Panel (Compact) */}
            {showProviderDetails && (
                <ProviderStatusPanel
                    providers={state.availableProviders}
                    activeProviders={state.activeProviders}
                    onToggleProvider={actions.toggleProvider}
                    onRetryProvider={(providerId) => {
                        console.log('Retrying provider:', providerId);
                        if (actions.retryInitialization) {
                            actions.retryInitialization();
                        }
                    }}
                    compact={true}
                    showInactive={true}
                />
            )}

            {/* Search Results */}
            <div className='min-h-[200px]'>{renderSearchResults()}</div>

            {/* Selected Items Summary */}
            {state.selectedItems.length > 0 && (
                <div
                    className={`rounded-lg border p-4 ${
                        theme === 'dark'
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                            <CheckCircle className='h-4 w-4 text-green-500' />
                            <span
                                className={`text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-200'
                                        : 'text-gray-900'
                                }`}
                            >
                                {state.selectedItems.length} image
                                {state.selectedItems.length !== 1
                                    ? 's'
                                    : ''}{' '}
                                selected
                            </span>
                        </div>
                        <button
                            onClick={() => onSelectMedia(state.selectedItems)}
                            className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
                        >
                            Use Selected
                        </button>
                    </div>

                    {/* Provider diversity indicator */}
                    {state.selectedItems.length > 1 && (
                        <div
                            className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            From{' '}
                            {
                                new Set(
                                    state.selectedItems.map(
                                        (item) => item.providerId
                                    )
                                ).size
                            }{' '}
                            provider
                            {new Set(
                                state.selectedItems.map(
                                    (item) => item.providerId
                                )
                            ).size !== 1
                                ? 's'
                                : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Fallback Options for Minimal Mode */}
            {degradationMode === 'minimal' && (
                <div
                    className={`rounded-lg border p-6 text-center ${
                        theme === 'dark'
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <WifiOff
                        className={`mx-auto mb-4 h-8 w-8 ${
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                    />
                    <h3
                        className={`mb-2 text-lg font-medium ${
                            theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                        }`}
                    >
                        Media Search Unavailable
                    </h3>
                    <p
                        className={`mb-4 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        All media providers are currently unavailable. You can
                        still add images using these options:
                    </p>

                    <div className='grid gap-3 sm:grid-cols-2'>
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (e) => {
                                    const files = (e.target as HTMLInputElement)
                                        .files;
                                    if (files) {
                                        console.log(
                                            'Files selected for upload:',
                                            files
                                        );
                                        // Handle file upload
                                    }
                                };
                                input.click();
                            }}
                            className={`rounded-lg border p-3 transition-colors ${
                                theme === 'dark'
                                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Upload Your Images
                        </button>

                        <button
                            onClick={() => {
                                if (actions.retryInitialization) {
                                    actions.retryInitialization();
                                }
                            }}
                            className='rounded-lg bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700'
                        >
                            <RefreshCw className='mr-2 inline h-4 w-4' />
                            Retry Connection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaSearchWithGracefulDegradation;

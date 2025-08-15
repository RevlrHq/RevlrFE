import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaSearch, UseMediaSearchOptions } from './useMediaSearch';
import { ProviderStatus } from '@src/types/media-search';

export interface DegradationLevel {
    level: 'full' | 'partial' | 'minimal' | 'offline';
    healthyProviders: number;
    degradedProviders: number;
    unavailableProviders: number;
    totalProviders: number;
    canSearch: boolean;
    recommendedActions: string[];
}

export interface GracefulDegradationOptions extends UseMediaSearchOptions {
    minHealthyProviders?: number;
    allowDegradedProviders?: boolean;
    fallbackToCache?: boolean;
    retryFailedProviders?: boolean;
    retryInterval?: number;
}

export interface UseMediaSearchGracefulDegradationReturn {
    // Original media search state and actions
    state: ReturnType<typeof useMediaSearch>['state'];
    actions: ReturnType<typeof useMediaSearch>['actions'] & {
        searchWithDegradation: (query: string) => Promise<void>;
        retryFailedProviders: () => Promise<void>;
        optimizeProviderSelection: () => void;
    };

    // Degradation-specific state
    degradationLevel: DegradationLevel;
    isGracefullyDegraded: boolean;
    providerGroups: {
        healthy: ProviderStatus[];
        degraded: ProviderStatus[];
        unavailable: ProviderStatus[];
    };

    // Fallback options
    fallbackOptions: {
        canUpload: boolean;
        canUseCache: boolean;
        canUsePlaceholders: boolean;
        externalProviders: Array<{
            name: string;
            url: string;
            description: string;
        }>;
    };
}

export function useMediaSearchGracefulDegradation(
    options: GracefulDegradationOptions = {}
): UseMediaSearchGracefulDegradationReturn {
    const {
        minHealthyProviders = 1,
        allowDegradedProviders = true,
        fallbackToCache = true,
        retryFailedProviders = true,
        retryInterval = 30000, // 30 seconds
        ...mediaSearchOptions
    } = options;

    const mediaSearch = useMediaSearch(mediaSearchOptions);
    const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>(
        {}
    );
    const [lastRetryTime, setLastRetryTime] = useState<Record<string, number>>(
        {}
    );

    // Categorize providers by health status
    const providerGroups = useMemo(() => {
        return mediaSearch.state.availableProviders.reduce(
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
            {
                healthy: [] as ProviderStatus[],
                degraded: [] as ProviderStatus[],
                unavailable: [] as ProviderStatus[],
            }
        );
    }, [mediaSearch.state.availableProviders]);

    // Calculate degradation level
    const degradationLevel = useMemo((): DegradationLevel => {
        const { healthy, degraded, unavailable } = providerGroups;
        const totalProviders =
            healthy.length + degraded.length + unavailable.length;
        // const availableProviders =
        //     healthy.length + (allowDegradedProviders ? degraded.length : 0);

        let level: DegradationLevel['level'];
        let canSearch: boolean;
        let recommendedActions: string[] = [];

        if (totalProviders === 0) {
            level = 'offline';
            canSearch = false;
            recommendedActions = [
                'Check internet connection',
                'Verify API configuration',
                'Contact support if issue persists',
            ];
        } else if (healthy.length === 0 && degraded.length === 0) {
            level = 'minimal';
            canSearch = false;
            recommendedActions = [
                'Retry provider initialization',
                'Use upload functionality',
                'Try again later',
            ];
        } else if (healthy.length < minHealthyProviders) {
            level = 'partial';
            canSearch = allowDegradedProviders && degraded.length > 0;
            recommendedActions = [
                'Search results may be limited',
                'Consider using multiple search terms',
                'Some providers may respond slowly',
            ];
        } else {
            level = 'full';
            canSearch = true;
            recommendedActions = [];
        }

        return {
            level,
            healthyProviders: healthy.length,
            degradedProviders: degraded.length,
            unavailableProviders: unavailable.length,
            totalProviders,
            canSearch,
            recommendedActions,
        };
    }, [providerGroups, minHealthyProviders, allowDegradedProviders]);

    // Determine if we're in a degraded state
    const isGracefullyDegraded = degradationLevel.level !== 'full';

    // Optimize provider selection based on health
    const optimizeProviderSelection = useCallback(() => {
        const { healthy, degraded } = providerGroups;

        // Prioritize healthy providers
        const optimalProviders = [
            ...healthy.map((p) => p.id),
            ...(allowDegradedProviders ? degraded.map((p) => p.id) : []),
        ];

        // Update active providers to use only optimal ones
        const currentActive = mediaSearch.state.activeProviders;
        const toActivate = optimalProviders.filter(
            (id) => !currentActive.includes(id)
        );
        const toDeactivate = currentActive.filter(
            (id) => !optimalProviders.includes(id)
        );

        // Activate optimal providers
        toActivate.forEach((providerId) => {
            mediaSearch.actions.toggleProvider(providerId);
        });

        // Deactivate suboptimal providers
        toDeactivate.forEach((providerId) => {
            mediaSearch.actions.toggleProvider(providerId);
        });
    }, [
        providerGroups,
        allowDegradedProviders,
        mediaSearch.actions,
        mediaSearch.state.activeProviders,
    ]);

    // Enhanced search with degradation handling
    const searchWithDegradation = useCallback(
        async (query: string) => {
            if (!degradationLevel.canSearch) {
                throw new Error('Search unavailable - no healthy providers');
            }

            // Optimize provider selection before searching
            optimizeProviderSelection();

            try {
                await mediaSearch.actions.search(query);
            } catch (error) {
                // If search fails and we have degraded providers, try with them
                if (
                    degradationLevel.level === 'partial' &&
                    providerGroups.degraded.length > 0
                ) {
                    console.warn(
                        'Search failed with healthy providers, trying degraded providers'
                    );

                    // Temporarily enable degraded providers
                    providerGroups.degraded.forEach((provider) => {
                        if (
                            !mediaSearch.state.activeProviders.includes(
                                provider.id
                            )
                        ) {
                            mediaSearch.actions.toggleProvider(provider.id);
                        }
                    });

                    try {
                        await mediaSearch.actions.search(query);
                    } catch (degradedError) {
                        console.error(
                            'Search failed even with degraded providers:',
                            degradedError
                        );
                        throw degradedError;
                    }
                } else {
                    throw error;
                }
            }
        },
        [
            degradationLevel,
            optimizeProviderSelection,
            mediaSearch.actions,
            providerGroups.degraded,
            mediaSearch.state.activeProviders,
        ]
    );

    // Retry failed providers
    const retryFailedProviders = useCallback(async () => {
        const now = Date.now();
        const providersToRetry = providerGroups.unavailable.filter(
            (provider) => {
                const lastRetry = lastRetryTime[provider.id] || 0;
                const attempts = retryAttempts[provider.id] || 0;

                // Don't retry if we've tried too many times recently
                return attempts < 3 && now - lastRetry > retryInterval;
            }
        );

        if (providersToRetry.length === 0) {
            return;
        }

        console.log(`Retrying ${providersToRetry.length} failed providers`);

        // Update retry tracking
        const newRetryAttempts = { ...retryAttempts };
        const newLastRetryTime = { ...lastRetryTime };

        providersToRetry.forEach((provider) => {
            newRetryAttempts[provider.id] =
                (newRetryAttempts[provider.id] || 0) + 1;
            newLastRetryTime[provider.id] = now;
        });

        setRetryAttempts(newRetryAttempts);
        setLastRetryTime(newLastRetryTime);

        // Attempt to reinitialize
        if (mediaSearch.actions.retryInitialization) {
            try {
                await mediaSearch.actions.retryInitialization();
            } catch (error) {
                console.error(
                    'Failed to retry provider initialization:',
                    error
                );
            }
        }
    }, [
        providerGroups.unavailable,
        retryAttempts,
        lastRetryTime,
        retryInterval,
        mediaSearch.actions,
    ]);

    // Auto-retry failed providers
    useEffect(() => {
        if (!retryFailedProviders || providerGroups.unavailable.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            retryFailedProviders();
        }, retryInterval);

        return () => clearInterval(interval);
    }, [
        retryFailedProviders,
        providerGroups.unavailable.length,
        retryInterval,
    ]);

    // Auto-optimize provider selection when providers change
    useEffect(() => {
        if (
            degradationLevel.level === 'partial' ||
            degradationLevel.level === 'full'
        ) {
            optimizeProviderSelection();
        }
    }, [degradationLevel.level, optimizeProviderSelection]);

    // Define fallback options
    const fallbackOptions = useMemo(() => {
        return {
            canUpload: true, // Always available
            canUseCache:
                fallbackToCache && degradationLevel.level !== 'offline',
            canUsePlaceholders: true, // Always available
            externalProviders: [
                {
                    name: 'Unsplash',
                    url: 'https://unsplash.com',
                    description: 'Free high-quality photos',
                },
                {
                    name: 'Pexels',
                    url: 'https://pexels.com',
                    description: 'Free stock photos and videos',
                },
                {
                    name: 'Pixabay',
                    url: 'https://pixabay.com',
                    description: 'Free images, vectors, and illustrations',
                },
            ],
        };
    }, [fallbackToCache, degradationLevel.level]);

    return {
        state: mediaSearch.state,
        actions: {
            ...mediaSearch.actions,
            searchWithDegradation,
            retryFailedProviders,
            optimizeProviderSelection,
        },
        degradationLevel,
        isGracefullyDegraded,
        providerGroups,
        fallbackOptions,
    };
}

export default useMediaSearchGracefulDegradation;

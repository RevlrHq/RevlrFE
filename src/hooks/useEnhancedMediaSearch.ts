import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebouncedValue } from './useDebounce';
import { EnhancedMediaSearchService } from '@/lib/services/media/EnhancedMediaSearchService';
import { ErrorNotification } from '@/lib/services/media/ErrorNotificationService';
import {
    MediaSearchQuery,
    MediaSearchResult,
    MediaItem,
    MediaFilters,
    ProviderStatus,
} from '@/types/media-search';

// Define proper types for service health and error logs
interface ServiceHealth {
    isHealthy: boolean;
    totalProviders: number;
    healthyProviders: number;
    disabledProviders: number;
    circuitBreakerStatus: Record<string, string>;
    errorRate: number;
    networkStatus: 'online' | 'offline' | 'slow';
    cacheStats: {
        size: number;
        hitRate: number;
        missRate: number;
    };
}

// Type for the actual service health response
interface ServiceHealthResponse {
    isHealthy: boolean;
    totalProviders: number;
    healthyProviders: number;
    disabledProviders: number;
    circuitBreakerStatus: Record<string, string>;
    errorRate: number;
    networkStatus: string;
    cacheStats: unknown;
}

interface ErrorLogFilters {
    providerId?: string;
    errorType?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorLogEntry {
    id: string;
    timestamp: number;
    providerId: string;
    errorType: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, unknown>;
}

interface LastOperation {
    type: 'search' | 'loadMore' | 'getPopular';
    params: {
        query?: string;
        filters?: MediaFilters;
        page?: number;
        category?: string;
    };
}

export interface EnhancedMediaSearchState {
    // Search state
    query: string;
    filters: MediaFilters;
    results: MediaSearchResult | null;
    isLoading: boolean;
    error: string | null;

    // UI state
    selectedItems: MediaItem[];
    previewItem: MediaItem | null;
    currentPage: number;
    hasMore: boolean;

    // Error handling state
    notifications: ErrorNotification[];
    serviceHealth: ServiceHealth | null;
    isOffline: boolean;
    networkStatus: 'online' | 'offline' | 'slow';

    // Provider state
    availableProviders: ProviderStatus[];
    activeProviders: string[];
    providerErrors: Record<string, string>;
}

export interface EnhancedMediaSearchActions {
    // Search actions
    search: (query: string, filters?: MediaFilters) => Promise<void>;
    loadMore: () => Promise<void>;
    clearSearch: () => void;

    // Item selection
    selectItem: (item: MediaItem) => void;
    deselectItem: (itemId: string) => void;
    clearSelection: () => void;

    // Preview
    previewItem: (item: MediaItem) => void;
    closePreview: () => void;

    // Filters
    applyFilters: (filters: MediaFilters) => Promise<void>;
    clearFilters: () => void;

    // Error handling
    dismissNotification: (id: string) => void;
    retryLastOperation: () => Promise<void>;
    resetErrorState: () => void;

    // Service management
    getServiceHealth: () => ServiceHealth;
    getErrorLogs: (filters?: ErrorLogFilters) => ErrorLogEntry[];
}

export interface UseEnhancedMediaSearchOptions {
    initialQuery?: string;
    initialFilters?: MediaFilters;
    enableErrorHandling?: boolean;
    enableLogging?: boolean;
    enableNotifications?: boolean;
    debounceDelay?: number;
}

export interface UseEnhancedMediaSearchReturn {
    state: EnhancedMediaSearchState;
    actions: EnhancedMediaSearchActions;
    service: EnhancedMediaSearchService;
}

/**
 * Enhanced media search hook with comprehensive error handling
 */
export function useEnhancedMediaSearch(
    options: UseEnhancedMediaSearchOptions = {}
): UseEnhancedMediaSearchReturn {
    const {
        initialQuery = '',
        initialFilters = {},
        enableErrorHandling = true,
        enableLogging = true,
        enableNotifications = true,
        debounceDelay = 500,
    } = options;

    // Initialize service
    const serviceRef = useRef<EnhancedMediaSearchService | null>(null);
    if (!serviceRef.current) {
        serviceRef.current = new EnhancedMediaSearchService(1000, 30, {
            enableErrorHandling,
            enableLogging,
            enableNotifications,
            retryConfig: {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                backoffMultiplier: 2,
                jitter: true,
            },
            offlineMode: false,
            gracefulDegradation: true,
        });
    }

    const service = serviceRef.current;

    // State management
    const [state, setState] = useState<EnhancedMediaSearchState>({
        query: initialQuery,
        filters: initialFilters,
        results: null,
        isLoading: false,
        error: null,
        selectedItems: [],
        previewItem: null,
        currentPage: 1,
        hasMore: false,
        notifications: [],
        serviceHealth: null,
        isOffline: false,
        networkStatus: 'online',
        availableProviders: [],
        activeProviders: [],
        providerErrors: {},
    });

    // Store last operation for retry functionality
    const lastOperationRef = useRef<LastOperation | null>(null);

    // Debounced search query
    const debouncedQuery = useDebouncedValue(state.query, debounceDelay);

    // Search function with enhanced error handling
    const search = useCallback(
        async (query: string, filters: MediaFilters = {}) => {
            if (!query.trim()) {
                setState((prev) => ({ ...prev, results: null, error: null }));
                return;
            }

            // Store operation for retry
            lastOperationRef.current = {
                type: 'search',
                params: { query, filters },
            };

            setState((prev) => ({
                ...prev,
                isLoading: true,
                error: null,
                currentPage: 1,
            }));

            try {
                const searchQuery: MediaSearchQuery = {
                    query: query.trim(),
                    filters,
                    page: 1,
                    perPage: 30,
                    sortBy: 'relevance',
                    sortOrder: 'desc',
                };

                const result = await service.searchMedia(searchQuery);

                setState((prev) => ({
                    ...prev,
                    results: result,
                    hasMore: result.hasMore,
                    isLoading: false,
                    error: null,
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Search failed';
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                    results: null,
                }));
            }
        },
        [service]
    );

    // Initialize service and set up error handling
    useEffect(() => {
        const initializeService = async () => {
            try {
                // Subscribe to notifications
                const unsubscribe = service.subscribeToNotifications(
                    (notifications: ErrorNotification[]) => {
                        setState((prev) => ({ ...prev, notifications }));
                    }
                );

                // Get initial service health
                const healthResponse =
                    service.getServiceHealth() as ServiceHealthResponse;
                const health: ServiceHealth = {
                    ...healthResponse,
                    networkStatus: healthResponse.networkStatus as
                        | 'online'
                        | 'offline'
                        | 'slow',
                    cacheStats: {
                        size: 0,
                        hitRate: 0,
                        missRate: 0,
                    },
                };
                setState((prev) => ({
                    ...prev,
                    serviceHealth: health,
                    isOffline: health.networkStatus === 'offline',
                    networkStatus: health.networkStatus,
                }));

                // Set up periodic health checks
                const healthCheckInterval = setInterval(() => {
                    const currentHealthResponse =
                        service.getServiceHealth() as ServiceHealthResponse;
                    const currentHealth: ServiceHealth = {
                        ...currentHealthResponse,
                        networkStatus: currentHealthResponse.networkStatus as
                            | 'online'
                            | 'offline'
                            | 'slow',
                        cacheStats: {
                            size: 0,
                            hitRate: 0,
                            missRate: 0,
                        },
                    };
                    setState((prev) => ({
                        ...prev,
                        serviceHealth: currentHealth,
                        isOffline: currentHealth.networkStatus === 'offline',
                        networkStatus: currentHealth.networkStatus,
                    }));
                }, 30000); // Check every 30 seconds

                // Cleanup function
                return () => {
                    unsubscribe();
                    clearInterval(healthCheckInterval);
                };
            } catch (error) {
                console.error(
                    'Failed to initialize enhanced media search service:',
                    error
                );
                setState((prev) => ({
                    ...prev,
                    error: 'Failed to initialize media search service',
                }));
            }
        };

        initializeService();
    }, [service]);

    // Auto-search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim() && debouncedQuery !== initialQuery) {
            search(debouncedQuery, state.filters);
        }
    }, [debouncedQuery, initialQuery, search, state.filters]);

    // Load more results with error handling
    const loadMore = useCallback(async () => {
        if (!state.results || !state.hasMore || state.isLoading) {
            return;
        }

        // Store operation for retry
        lastOperationRef.current = {
            type: 'loadMore',
            params: {
                query: state.query,
                filters: state.filters,
                page: state.currentPage + 1,
            },
        };

        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const searchQuery: MediaSearchQuery = {
                query: state.query,
                filters: state.filters,
                page: state.currentPage + 1,
                perPage: 30,
            };

            const result = await service.searchMedia(searchQuery);

            setState((prev) => ({
                ...prev,
                results: prev.results
                    ? {
                          ...result,
                          items: [...prev.results.items, ...result.items],
                      }
                    : result,
                currentPage: prev.currentPage + 1,
                hasMore: result.hasMore,
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load more results';
            setState((prev) => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, [
        service,
        state.query,
        state.filters,
        state.results,
        state.hasMore,
        state.isLoading,
        state.currentPage,
    ]);

    // Clear search
    const clearSearch = useCallback(() => {
        setState((prev) => ({
            ...prev,
            query: '',
            results: null,
            error: null,
            currentPage: 1,
            hasMore: false,
        }));
        lastOperationRef.current = null;
    }, []);

    // Item selection
    const selectItem = useCallback((item: MediaItem) => {
        setState((prev) => {
            const isAlreadySelected = prev.selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );

            if (isAlreadySelected) {
                return prev;
            }

            return {
                ...prev,
                selectedItems: [...prev.selectedItems, item],
            };
        });
    }, []);

    const deselectItem = useCallback((itemId: string) => {
        setState((prev) => ({
            ...prev,
            selectedItems: prev.selectedItems.filter(
                (item) =>
                    !(
                        item.id === itemId ||
                        `${item.providerId}-${item.id}` === itemId
                    )
            ),
        }));
    }, []);

    const clearSelection = useCallback(() => {
        setState((prev) => ({ ...prev, selectedItems: [] }));
    }, []);

    // Preview
    const previewItem = useCallback((item: MediaItem) => {
        setState((prev) => ({ ...prev, previewItem: item }));
    }, []);

    const closePreview = useCallback(() => {
        setState((prev) => ({ ...prev, previewItem: null }));
    }, []);

    // Filters
    const applyFilters = useCallback(
        async (filters: MediaFilters) => {
            setState((prev) => ({ ...prev, filters }));

            if (state.query.trim()) {
                await search(state.query, filters);
            }
        },
        [state.query, search]
    );

    const clearFilters = useCallback(() => {
        setState((prev) => ({ ...prev, filters: {} }));

        if (state.query.trim()) {
            search(state.query, {});
        }
    }, [state.query, search]);

    // Error handling actions
    const dismissNotification = useCallback((id: string) => {
        // This would be handled by the notification service
        // The service will update the notifications and trigger the subscription callback
        console.log('Dismissing notification:', id);
    }, []);

    const retryLastOperation = useCallback(async () => {
        if (!lastOperationRef.current) {
            return;
        }

        const { type, params } = lastOperationRef.current;

        try {
            switch (type) {
                case 'search':
                    if (params.query) {
                        await search(params.query, params.filters);
                    }
                    break;
                case 'loadMore':
                    await loadMore();
                    break;
                case 'getPopular':
                    // Implement if needed
                    break;
            }
        } catch (error) {
            console.error('Retry operation failed:', error);
        }
    }, [search, loadMore]);

    const resetErrorState = useCallback(() => {
        service.resetErrorState();
        setState((prev) => ({
            ...prev,
            error: null,
            notifications: [],
            providerErrors: {},
        }));
    }, [service]);

    // Service management
    const getServiceHealth = useCallback((): ServiceHealth => {
        const healthResponse =
            service.getServiceHealth() as ServiceHealthResponse;
        return {
            ...healthResponse,
            networkStatus: healthResponse.networkStatus as
                | 'online'
                | 'offline'
                | 'slow',
            cacheStats: {
                size: 0,
                hitRate: 0,
                missRate: 0,
            },
        };
    }, [service]);

    const getErrorLogs = useCallback(
        (filters?: ErrorLogFilters): ErrorLogEntry[] => {
            return service.getErrorLogs(filters);
        },
        [service]
    );

    // Actions object
    const actions: EnhancedMediaSearchActions = {
        search,
        loadMore,
        clearSearch,
        selectItem,
        deselectItem,
        clearSelection,
        previewItem,
        closePreview,
        applyFilters,
        clearFilters,
        dismissNotification,
        retryLastOperation,
        resetErrorState,
        getServiceHealth,
        getErrorLogs,
    };

    return {
        state,
        actions,
        service,
    };
}

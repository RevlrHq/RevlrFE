import {
    MediaSearchQuery,
    MediaSearchResult,
    MediaItem,
    ProviderResult,
    ProviderStatus,
    MediaProviderError,
    MediaProviderErrorType,
} from '@/types/media-search';
import { MediaProvider } from './MediaProvider';
import { MediaSearchCache } from './MediaSearchCache';
import { MediaProviderFactory } from './MediaProviderFactory';
import {
    ErrorHandlingService,
    ErrorContext,
    RetryConfig,
} from './ErrorHandlingService';
import { ErrorLoggingService } from './ErrorLoggingService';
import { ErrorNotificationService } from './ErrorNotificationService';

export interface EnhancedSearchConfig {
    enableErrorHandling: boolean;
    enableLogging: boolean;
    enableNotifications: boolean;
    retryConfig: RetryConfig;
    offlineMode: boolean;
    gracefulDegradation: boolean;
}

/**
 * Enhanced MediaSearchService with comprehensive error handling and recovery
 */
export class EnhancedMediaSearchService {
    private cache: MediaSearchCache;
    private providerFactory: MediaProviderFactory;
    private errorHandler: ErrorHandlingService;
    private logger: ErrorLoggingService;
    private notificationService: ErrorNotificationService;
    private config: EnhancedSearchConfig;
    private disabledProviders: Map<string, { until: number; reason: string }> =
        new Map();
    private circuitBreakers: Map<string, CircuitBreaker> = new Map();

    constructor(
        cacheSize: number = 1000,
        cacheExpiryMinutes: number = 30,
        config: Partial<EnhancedSearchConfig> = {}
    ) {
        this.cache = new MediaSearchCache(cacheSize, cacheExpiryMinutes);
        this.providerFactory = MediaProviderFactory.getInstance();
        this.errorHandler = new ErrorHandlingService();
        this.logger = new ErrorLoggingService();
        this.notificationService = new ErrorNotificationService();

        this.config = {
            enableErrorHandling: true,
            enableLogging: true,
            enableNotifications: true,
            retryConfig: {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                backoffMultiplier: 2,
                jitter: true,
            },
            offlineMode: false,
            gracefulDegradation: true,
            ...config,
        };

        this.initializeErrorHandling();
        this.initializeCircuitBreakers();
    }

    /**
     * Search for media with comprehensive error handling
     */
    async searchMedia(query: MediaSearchQuery): Promise<MediaSearchResult> {
        const context: ErrorContext = {
            operation: 'search',
            query: query.query,
            timestamp: Date.now(),
            networkStatus: this.errorHandler.getNetworkStatus(),
        };

        // Check if offline
        if (this.errorHandler.isOffline()) {
            if (this.config.offlineMode) {
                return this.handleOfflineSearch(query);
            } else {
                throw new Error('Cannot search while offline');
            }
        }

        // Check cache first
        const cachedResult = this.cache.get(
            query.query,
            query.filters,
            query.providers
        );
        if (cachedResult) {
            return cachedResult;
        }

        // Get healthy providers
        const providersToSearch = this.getHealthyProvidersForQuery(query);

        if (providersToSearch.length === 0) {
            const error: MediaProviderError = {
                type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                providerId: 'all',
                message: 'No healthy providers available for search',
            };

            if (this.config.enableLogging) {
                this.logger.logError(error, context);
            }

            if (this.config.gracefulDegradation) {
                return this.handleNoProvidersAvailable(query);
            }

            throw new Error('No healthy providers available for search');
        }

        // Execute search with error handling
        try {
            const result = await this.executeSearchWithErrorHandling(
                query,
                providersToSearch,
                context
            );

            // Cache successful results
            if (result.items.length > 0) {
                this.cache.set(
                    query.query,
                    result,
                    query.filters,
                    query.providers
                );
            }

            return result;
        } catch (error) {
            const providerError = this.errorHandler.handleProviderError(
                error,
                context
            );

            if (this.config.enableLogging) {
                this.logger.logError(providerError, context);
            }

            if (this.config.enableNotifications) {
                const recoveryAction = this.errorHandler.handleProviderError(
                    error,
                    context
                );
                const notification =
                    this.notificationService.createErrorNotification(
                        providerError,
                        recoveryAction,
                        {
                            canRetry: true,
                            onRetry: () => this.searchMedia(query),
                        }
                    );
                this.notificationService.showNotification(notification);
            }

            throw providerError;
        }
    }

    /**
     * Get popular media with error handling
     */
    async getPopularMedia(category?: string): Promise<MediaSearchResult> {
        const context: ErrorContext = {
            operation: 'getPopular',
            timestamp: Date.now(),
            networkStatus: this.errorHandler.getNetworkStatus(),
        };

        const cacheKey = `popular_${category || 'all'}`;
        const cachedResult = this.cache.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const healthyProviders = this.getHealthyProviders();

        if (healthyProviders.length === 0) {
            if (this.config.gracefulDegradation) {
                return this.getEmptyResult();
            }
            throw new Error('No healthy providers available');
        }

        try {
            const result = await this.executePopularMediaSearch(
                healthyProviders,
                category,
                context
            );

            if (result.items.length > 0) {
                this.cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            const providerError = this.errorHandler.handleProviderError(
                error,
                context
            );

            if (this.config.enableLogging) {
                this.logger.logError(providerError, context);
            }

            throw providerError;
        }
    }

    /**
     * Get search suggestions with error handling
     */
    async getSuggestions(query: string): Promise<string[]> {
        try {
            const normalizedQuery = query.toLowerCase().trim();
            const popularEntries = this.cache.getPopularEntries(20);

            return popularEntries
                .filter((entry) => entry.query.includes(normalizedQuery))
                .map((entry) => entry.query)
                .slice(0, 5);
        } catch (error) {
            if (this.config.enableLogging) {
                const context: ErrorContext = {
                    operation: 'getSuggestions',
                    query,
                    timestamp: Date.now(),
                };

                const providerError = this.errorHandler.handleProviderError(
                    error,
                    context
                );
                this.logger.logWarning(providerError, context);
            }

            // Return empty suggestions on error
            return [];
        }
    }

    /**
     * Get service health status
     */
    getServiceHealth(): {
        isHealthy: boolean;
        totalProviders: number;
        healthyProviders: number;
        disabledProviders: number;
        circuitBreakerStatus: Record<string, string>;
        errorRate: number;
        networkStatus: string;
        cacheStats: any;
    } {
        const healthyProviders = this.getHealthyProviders();
        const errorMetrics = this.logger.getMetrics();

        return {
            isHealthy:
                healthyProviders.length > 0 && !this.errorHandler.isOffline(),
            totalProviders: this.providerFactory.getAllProviders().length,
            healthyProviders: healthyProviders.length,
            disabledProviders: this.disabledProviders.size,
            circuitBreakerStatus: this.getCircuitBreakerStatus(),
            errorRate: errorMetrics.errorRate,
            networkStatus: this.errorHandler.getNetworkStatus(),
            cacheStats: this.cache.getStats(),
        };
    }

    /**
     * Subscribe to error notifications
     */
    subscribeToNotifications(
        callback: (notifications: any[]) => void
    ): () => void {
        return this.notificationService.subscribe(callback);
    }

    /**
     * Get error logs for debugging
     */
    getErrorLogs(filters?: any): any[] {
        return this.logger.getLogs(filters);
    }

    /**
     * Clear error history and reset providers
     */
    resetErrorState(): void {
        this.disabledProviders.clear();
        this.circuitBreakers.forEach((cb) => cb.reset());
        this.errorHandler.clearErrorHistory();
        this.notificationService.clearAllNotifications();
    }

    // Private methods

    private initializeErrorHandling(): void {
        // Monitor network status
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.notificationService.showOnlineNotification();
                this.resetErrorState();
            });

            window.addEventListener('offline', () => {
                this.notificationService.showOfflineNotification();
            });
        }

        // Set up error alerts
        this.logger.onAlert((alert) => {
            console.warn('Error alert:', alert);

            if (alert.severity === 'critical') {
                // Handle critical alerts
                this.handleCriticalAlert(alert);
            }
        });
    }

    private initializeCircuitBreakers(): void {
        const providers = this.providerFactory.getAllProviders();

        providers.forEach((provider) => {
            this.circuitBreakers.set(
                provider.id,
                new CircuitBreaker({
                    failureThreshold: 5,
                    recoveryTimeout: 60000, // 1 minute
                    monitoringPeriod: 300000, // 5 minutes
                })
            );
        });
    }

    private async executeSearchWithErrorHandling(
        query: MediaSearchQuery,
        providers: MediaProvider[],
        context: ErrorContext
    ): Promise<MediaSearchResult> {
        const providerPromises = providers.map(async (provider) => {
            const circuitBreaker = this.circuitBreakers.get(provider.id);

            if (circuitBreaker?.isOpen()) {
                return null; // Skip providers with open circuit breakers
            }

            const providerContext = { ...context, providerId: provider.id };

            try {
                const result = await this.errorHandler.executeWithRetry(
                    () => provider.search(query),
                    this.config.retryConfig,
                    providerContext
                );

                circuitBreaker?.recordSuccess();
                return result;
            } catch (error) {
                circuitBreaker?.recordFailure();

                const recoveryAction = this.errorHandler.handleProviderError(
                    error,
                    providerContext
                );

                this.applyRecoveryAction(provider.id, recoveryAction);

                if (this.config.enableLogging) {
                    const providerError = this.errorHandler.handleProviderError(
                        error,
                        providerContext
                    );
                    this.logger.logError(providerError, providerContext);
                }

                return null;
            }
        });

        const providerResults = await Promise.allSettled(providerPromises);
        const successfulResults: ProviderResult[] = [];

        providerResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                successfulResults.push(result.value);
            }
        });

        if (successfulResults.length === 0) {
            throw new Error('All providers failed to return results');
        }

        return this.combineProviderResults(successfulResults);
    }

    private async executePopularMediaSearch(
        providers: MediaProvider[],
        category: string | undefined,
        context: ErrorContext
    ): Promise<MediaSearchResult> {
        const providerPromises = providers.map(async (provider) => {
            try {
                return await provider.getPopular(category);
            } catch (error) {
                const providerContext = { ...context, providerId: provider.id };
                const recoveryAction = this.errorHandler.handleProviderError(
                    error,
                    providerContext
                );
                this.applyRecoveryAction(provider.id, recoveryAction);
                return null;
            }
        });

        const providerResults = await Promise.allSettled(providerPromises);
        const successfulResults: ProviderResult[] = [];

        providerResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                successfulResults.push(result.value);
            }
        });

        return this.combineProviderResults(successfulResults);
    }

    private getHealthyProvidersForQuery(
        query: MediaSearchQuery
    ): MediaProvider[] {
        let providers = this.getHealthyProviders();

        if (query.providers && query.providers.length > 0) {
            providers = providers.filter((provider) =>
                query.providers!.includes(provider.id)
            );
        }

        return providers;
    }

    private getHealthyProviders(): MediaProvider[] {
        const now = Date.now();

        return this.providerFactory.getHealthyProviders().filter((provider) => {
            // Check if provider is temporarily disabled
            const disabled = this.disabledProviders.get(provider.id);
            if (disabled && disabled.until > now) {
                return false;
            }

            // Remove expired disabled status
            if (disabled && disabled.until <= now) {
                this.disabledProviders.delete(provider.id);
            }

            // Check circuit breaker
            const circuitBreaker = this.circuitBreakers.get(provider.id);
            if (circuitBreaker?.isOpen()) {
                return false;
            }

            return true;
        });
    }

    private applyRecoveryAction(providerId: string, action: any): void {
        switch (action.action) {
            case 'disable_temporarily':
                if (action.duration) {
                    this.disabledProviders.set(providerId, {
                        until: Date.now() + action.duration * 1000,
                        reason: action.message,
                    });
                }
                break;

            case 'fallback_provider':
                // Circuit breaker will handle this
                break;

            case 'offline_mode':
                this.config.offlineMode = true;
                break;
        }
    }

    private handleOfflineSearch(query: MediaSearchQuery): MediaSearchResult {
        // Return cached results if available
        const cachedResult = this.cache.get(
            query.query,
            query.filters,
            query.providers
        );

        if (cachedResult) {
            return cachedResult;
        }

        // Return empty result with offline message
        return {
            items: [],
            totalResults: 0,
            hasMore: false,
            providers: [],
        };
    }

    private handleNoProvidersAvailable(
        query: MediaSearchQuery
    ): MediaSearchResult {
        // Try to return cached results
        const cachedResult = this.cache.get(
            query.query,
            query.filters,
            query.providers
        );

        if (cachedResult) {
            return cachedResult;
        }

        return this.getEmptyResult();
    }

    private getEmptyResult(): MediaSearchResult {
        return {
            items: [],
            totalResults: 0,
            hasMore: false,
            providers: [],
        };
    }

    private combineProviderResults(
        results: ProviderResult[]
    ): MediaSearchResult {
        const allItems: MediaItem[] = [];
        let totalResults = 0;
        let hasMore = false;

        results.forEach((result) => {
            allItems.push(...result.items);
            totalResults += result.totalResults;
            hasMore = hasMore || result.hasMore;
        });

        const uniqueItems = this.deduplicateItems(allItems);
        const sortedItems = this.sortItemsByRelevance(uniqueItems);

        return {
            items: sortedItems,
            totalResults,
            hasMore,
            providers: results,
        };
    }

    private deduplicateItems(items: MediaItem[]): MediaItem[] {
        const seen = new Set<string>();
        return items.filter((item) => {
            const key = `${item.downloadUrl}_${item.width}x${item.height}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    private sortItemsByRelevance(items: MediaItem[]): MediaItem[] {
        return items.sort((a, b) => {
            const aPixels = a.width * a.height;
            const bPixels = b.width * b.height;

            if (Math.abs(aPixels - bPixels) > 100000) {
                return bPixels - aPixels;
            }

            const providerPriority = { unsplash: 3, pexels: 2, pixabay: 1 };
            const aPriority =
                providerPriority[
                    a.providerId as keyof typeof providerPriority
                ] || 0;
            const bPriority =
                providerPriority[
                    b.providerId as keyof typeof providerPriority
                ] || 0;

            return bPriority - aPriority;
        });
    }

    private getCircuitBreakerStatus(): Record<string, string> {
        const status: Record<string, string> = {};

        this.circuitBreakers.forEach((cb, providerId) => {
            status[providerId] = cb.getState();
        });

        return status;
    }

    private handleCriticalAlert(alert: any): void {
        // Implement critical alert handling
        console.error('Critical alert received:', alert);

        // Could trigger emergency fallback modes, notifications to admins, etc.
    }
}

/**
 * Circuit breaker implementation for provider fault tolerance
 */
class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime = 0;
    private state: 'closed' | 'open' | 'half-open' = 'closed';
    private config: {
        failureThreshold: number;
        recoveryTimeout: number;
        monitoringPeriod: number;
    };

    constructor(config: {
        failureThreshold: number;
        recoveryTimeout: number;
        monitoringPeriod: number;
    }) {
        this.config = config;
    }

    isOpen(): boolean {
        if (this.state === 'open') {
            if (
                Date.now() - this.lastFailureTime >
                this.config.recoveryTimeout
            ) {
                this.state = 'half-open';
                return false;
            }
            return true;
        }
        return false;
    }

    recordSuccess(): void {
        this.failureCount = 0;
        this.state = 'closed';
    }

    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.config.failureThreshold) {
            this.state = 'open';
        }
    }

    getState(): string {
        return this.state;
    }

    reset(): void {
        this.failureCount = 0;
        this.state = 'closed';
        this.lastFailureTime = 0;
    }
}

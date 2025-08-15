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
import { ErrorHandlingService, ErrorContext } from './ErrorHandlingService';
import { ErrorLoggingService } from './ErrorLoggingService';
import { ErrorNotificationService } from './ErrorNotificationService';

export interface ErrorRecoveryAction {
    action: 'disable_temporarily' | 'retry_with_backoff' | 'show_error';
    duration?: number;
    maxRetries?: number;
    message: string;
}

export class MediaSearchService {
    private cache: MediaSearchCache;
    private providerFactory: MediaProviderFactory;
    private errorHandler: ErrorHandlingService;
    private logger: ErrorLoggingService;
    private notificationService: ErrorNotificationService;
    private disabledProviders: Map<string, { until: number; reason: string }> =
        new Map();

    constructor(
        cacheSize: number = 1000,
        cacheExpiryMinutes: number = 30,
        enableErrorHandling: boolean = true
    ) {
        this.cache = new MediaSearchCache(cacheSize, cacheExpiryMinutes);
        this.providerFactory = MediaProviderFactory.getInstance();

        if (enableErrorHandling) {
            this.errorHandler = new ErrorHandlingService();
            this.logger = new ErrorLoggingService();
            this.notificationService = new ErrorNotificationService();
        }
    }

    /**
     * Check if the service is ready for searches
     */
    isReady(): boolean {
        return (
            this.providerFactory.isFactoryInitialized() &&
            this.getHealthyProviders().length > 0
        );
    }

    /**
     * Get readiness error message if service is not ready
     */
    getReadinessError(): string | null {
        if (!this.providerFactory.isFactoryInitialized()) {
            return 'Media provider factory is not initialized';
        }

        if (this.getHealthyProviders().length === 0) {
            const errors = this.providerFactory.getInitializationErrors();
            if (errors.length > 0) {
                return `No healthy providers available. Errors: ${errors.map((e) => `${e.providerId}: ${e.error}`).join(', ')}`;
            }
            return 'No healthy providers available for search';
        }

        return null;
    }

    /**
     * Get all registered providers
     */
    getAvailableProviders(): MediaProvider[] {
        if (!this.providerFactory.isFactoryInitialized()) {
            return [];
        }
        return this.providerFactory.getAllProviders();
    }

    /**
     * Get healthy providers (available and not rate-limited)
     */
    getHealthyProviders(): MediaProvider[] {
        const now = Date.now();

        return this.providerFactory.getHealthyProviders().filter((provider) => {
            // Check if provider is temporarily disabled by service
            const disabled = this.disabledProviders.get(provider.id);
            if (disabled && disabled.until > now) {
                return false;
            }

            // Remove expired disabled status
            if (disabled && disabled.until <= now) {
                this.disabledProviders.delete(provider.id);
            }

            return true;
        });
    }

    /**
     * Get provider status
     */
    getProviderStatus(providerId: string): ProviderStatus | null {
        const provider = this.providerFactory.getProvider(providerId);
        if (!provider) {
            return null;
        }

        const status = provider.getStatus();
        const disabled = this.disabledProviders.get(providerId);

        if (disabled) {
            status.isAvailable = false;
            status.lastError = {
                type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                providerId,
                message: disabled.reason,
                retryAfter: Math.ceil((disabled.until - Date.now()) / 1000),
            };
        }

        return status;
    }

    /**
     * Search for media across all healthy providers
     */
    async searchMedia(query: MediaSearchQuery): Promise<MediaSearchResult> {
        // Check if service is ready
        if (!this.isReady()) {
            const error = this.getReadinessError();
            throw new Error(error || 'Media search service is not ready');
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

        // Get providers to search
        const providersToSearch = this.getProvidersForQuery(query);

        if (providersToSearch.length === 0) {
            const error = this.getReadinessError();
            throw new Error(
                error || 'No healthy providers available for search'
            );
        }

        // Search providers in parallel
        const result = await this.searchWithFallback(query, providersToSearch);

        // Cache successful results
        if (result.items.length > 0) {
            this.cache.set(query.query, result, query.filters, query.providers);
        }

        return result;
    }

    /**
     * Get popular media from providers
     */
    async getPopularMedia(category?: string): Promise<MediaSearchResult> {
        // Check if service is ready
        if (!this.isReady()) {
            const error = this.getReadinessError();
            throw new Error(error || 'Media search service is not ready');
        }

        const cacheKey = `popular_${category || 'all'}`;
        const cachedResult = this.cache.get(cacheKey);

        if (cachedResult) {
            return cachedResult;
        }

        const healthyProviders = this.getHealthyProviders();

        if (healthyProviders.length === 0) {
            const error = this.getReadinessError();
            throw new Error(error || 'No healthy providers available');
        }

        const providerPromises = healthyProviders.map(async (provider) => {
            try {
                return await provider.getPopular(category);
            } catch (error) {
                const recovery = this.handleProviderError(provider.id, error);
                this.applyErrorRecovery(provider.id, recovery);
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

        const combinedResult = this.combineProviderResults(successfulResults);

        // Cache popular results for shorter time
        if (combinedResult.items.length > 0) {
            this.cache.set(cacheKey, combinedResult);
        }

        return combinedResult;
    }

    /**
     * Get search suggestions based on query
     */
    async getSuggestions(query: string): Promise<string[]> {
        const normalizedQuery = query.toLowerCase().trim();

        // Get suggestions from cache statistics
        const popularEntries = this.cache.getPopularEntries(20);
        const suggestions = popularEntries
            .filter((entry) => entry.query.includes(normalizedQuery))
            .map((entry) => entry.query)
            .slice(0, 5);

        // Add common event-related suggestions
        const commonSuggestions = [
            'conference',
            'business meeting',
            'technology event',
            'music concert',
            'food festival',
            'sports event',
            'workshop',
            'networking',
            'celebration',
            'corporate event',
        ]
            .filter(
                (suggestion) =>
                    suggestion.includes(normalizedQuery) &&
                    !suggestions.includes(suggestion)
            )
            .slice(0, 5 - suggestions.length);

        return [...suggestions, ...commonSuggestions];
    }

    /**
     * Clear search cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Preload popular searches
     */
    async preloadPopularSearches(): Promise<void> {
        await this.cache.preloadPopularSearches(async (query) => {
            return this.searchMedia({ query, page: 1, perPage: 20 });
        });
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Search with fallback handling
     */
    private async searchWithFallback(
        query: MediaSearchQuery,
        providers: MediaProvider[]
    ): Promise<MediaSearchResult> {
        const providerPromises = providers.map(async (provider) => {
            try {
                return await provider.search(query);
            } catch (error) {
                const recovery = this.handleProviderError(provider.id, error);
                this.applyErrorRecovery(provider.id, recovery);
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

    /**
     * Get providers to use for a query
     */
    private getProvidersForQuery(query: MediaSearchQuery): MediaProvider[] {
        let providers = this.getHealthyProviders();

        // Filter by specified providers if requested
        if (query.providers && query.providers.length > 0) {
            providers = providers.filter((provider) =>
                query.providers!.includes(provider.id)
            );
        }

        return providers;
    }

    /**
     * Combine results from multiple providers
     */
    private combineProviderResults(
        results: ProviderResult[]
    ): MediaSearchResult {
        const allItems: MediaItem[] = [];
        let totalResults = 0;
        let hasMore = false;

        // Combine items from all providers
        results.forEach((result) => {
            allItems.push(...result.items);
            totalResults += result.totalResults;
            hasMore = hasMore || result.hasMore;
        });

        // Remove duplicates based on download URL
        const uniqueItems = this.deduplicateItems(allItems);

        // Sort by relevance (could be enhanced with more sophisticated scoring)
        const sortedItems = this.sortItemsByRelevance(uniqueItems);

        return {
            items: sortedItems,
            totalResults,
            hasMore,
            providers: results,
        };
    }

    /**
     * Remove duplicate items
     */
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

    /**
     * Sort items by relevance using provider health scores
     */
    private sortItemsByRelevance(items: MediaItem[]): MediaItem[] {
        const providerHealthScores =
            this.providerFactory.getProvidersByHealthScore();
        const healthScoreMap = new Map(
            providerHealthScores.map(({ provider, score }) => [
                provider.id,
                score,
            ])
        );

        return items.sort((a, b) => {
            // Prioritize higher resolution images
            const aPixels = a.width * a.height;
            const bPixels = b.width * b.height;

            if (Math.abs(aPixels - bPixels) > 100000) {
                // Significant resolution difference
                return bPixels - aPixels;
            }

            // Then by provider health score
            const aHealthScore = healthScoreMap.get(a.providerId) || 0;
            const bHealthScore = healthScoreMap.get(b.providerId) || 0;

            if (aHealthScore !== bHealthScore) {
                return bHealthScore - aHealthScore;
            }

            // Finally by provider preference (fallback)
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

    /**
     * Handle provider errors and determine recovery action
     */
    private handleProviderError(
        providerId: string,
        error: unknown
    ): ErrorRecoveryAction {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();

            if (message.includes('rate limit') || message.includes('429')) {
                return {
                    action: 'disable_temporarily',
                    duration: 3600, // 1 hour
                    message: `${providerId} rate limit reached. Trying other providers.`,
                };
            }

            if (
                message.includes('unauthorized') ||
                message.includes('401') ||
                message.includes('403')
            ) {
                return {
                    action: 'disable_temporarily',
                    duration: 86400, // 24 hours
                    message: `${providerId} API key issue. Please check configuration.`,
                };
            }

            if (message.includes('5') && message.includes('0')) {
                // 5xx errors
                return {
                    action: 'disable_temporarily',
                    duration: 300, // 5 minutes
                    message: `${providerId} is temporarily unavailable.`,
                };
            }

            if (message.includes('network') || message.includes('fetch')) {
                return {
                    action: 'retry_with_backoff',
                    maxRetries: 3,
                    message: 'Network error occurred. Retrying...',
                };
            }
        }

        return {
            action: 'show_error',
            message: `Error with ${providerId}: ${error}`,
        };
    }

    /**
     * Apply error recovery action
     */
    private applyErrorRecovery(
        providerId: string,
        recovery: ErrorRecoveryAction
    ): void {
        switch (recovery.action) {
            case 'disable_temporarily':
                if (recovery.duration) {
                    this.disabledProviders.set(providerId, {
                        until: Date.now() + recovery.duration * 1000,
                        reason: recovery.message,
                    });
                }
                break;

            case 'retry_with_backoff':
                // Retry logic would be handled by the calling code
                console.warn(
                    `Retry recommended for ${providerId}: ${recovery.message}`
                );
                break;

            case 'show_error':
                console.error(
                    `Provider error for ${providerId}: ${recovery.message}`
                );
                break;
        }
    }

    /**
     * Clean up expired disabled providers
     */
    private cleanupDisabledProviders(): void {
        const now = Date.now();
        for (const [providerId, disabled] of this.disabledProviders.entries()) {
            if (disabled.until <= now) {
                this.disabledProviders.delete(providerId);
            }
        }
    }

    /**
     * Get service health status
     */
    getServiceHealth(): {
        totalProviders: number;
        healthyProviders: number;
        disabledProviders: number;
        cacheStats: any;
        providerMetrics: any[];
        failoverRecommendations: any;
    } {
        this.cleanupDisabledProviders();

        return {
            totalProviders: this.providerFactory.getAllProviders().length,
            healthyProviders: this.getHealthyProviders().length,
            disabledProviders: this.disabledProviders.size,
            cacheStats: this.cache.getStats(),
            providerMetrics: this.providerFactory.getAllProviderHealthMetrics(),
            failoverRecommendations:
                this.providerFactory.getFailoverRecommendations(),
        };
    }

    /**
     * Get provider factory instance
     */
    getProviderFactory(): MediaProviderFactory {
        return this.providerFactory;
    }

    /**
     * Perform health check on all providers
     */
    async performHealthCheck() {
        return this.providerFactory.performHealthCheck();
    }
}

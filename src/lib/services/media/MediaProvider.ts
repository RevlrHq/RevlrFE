import {
    MediaSearchQuery,
    MediaItem,
    ProviderResult,
    RateLimit,
    MediaProviderError,
    MediaProviderErrorType,
    ProviderStatus,
    MediaProviderConfig,
} from '@/types/media-search';

export abstract class MediaProvider {
    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly baseUrl: string;
    abstract readonly rateLimit: RateLimit;

    protected config: MediaProviderConfig;
    protected rateLimitTracker: Map<
        string,
        { count: number; resetTime: number }
    > = new Map();
    protected healthScore: number = 100;
    protected lastError?: MediaProviderError;

    constructor(config: MediaProviderConfig) {
        this.config = config;
    }

    /**
     * Search for media items
     */
    abstract search(query: MediaSearchQuery): Promise<ProviderResult>;

    /**
     * Get popular/featured media for a category
     */
    abstract getPopular(category?: string): Promise<ProviderResult>;

    /**
     * Download media item as blob
     */
    abstract downloadMedia(item: MediaItem): Promise<Blob>;

    /**
     * Check if provider is within rate limits
     */
    protected checkRateLimit(): boolean {
        const now = Date.now();
        const windowKey = Math.floor(
            now / (this.rateLimit.window * 1000)
        ).toString();
        const tracker = this.rateLimitTracker.get(windowKey);

        if (!tracker) {
            this.rateLimitTracker.set(windowKey, {
                count: 0,
                resetTime: now + this.rateLimit.window * 1000,
            });
            return true;
        }

        if (tracker.count >= this.rateLimit.requests) {
            return false;
        }

        return true;
    }

    /**
     * Increment rate limit counter
     */
    protected incrementRateLimit(): void {
        const now = Date.now();
        const windowKey = Math.floor(
            now / (this.rateLimit.window * 1000)
        ).toString();
        const tracker = this.rateLimitTracker.get(windowKey);

        if (tracker) {
            tracker.count++;
        } else {
            this.rateLimitTracker.set(windowKey, {
                count: 1,
                resetTime: now + this.rateLimit.window * 1000,
            });
        }

        // Clean up old tracking entries
        this.cleanupRateLimitTracker();
    }

    /**
     * Clean up old rate limit tracking entries
     */
    private cleanupRateLimitTracker(): void {
        const now = Date.now();
        for (const [key, tracker] of this.rateLimitTracker.entries()) {
            if (tracker.resetTime < now) {
                this.rateLimitTracker.delete(key);
            }
        }
    }

    /**
     * Handle and categorize errors
     */
    protected handleError(
        error: unknown,
        context?: string
    ): MediaProviderError {
        let providerError: MediaProviderError;

        if (error instanceof Error) {
            // Network errors
            if (
                error.message.includes('fetch') ||
                error.message.includes('network')
            ) {
                providerError = {
                    type: MediaProviderErrorType.NETWORK_ERROR,
                    providerId: this.id,
                    message: `Network error: ${error.message}`,
                    details: { context, originalError: error.message },
                };
            }
            // Rate limit errors (typically HTTP 429)
            else if (
                error.message.includes('429') ||
                error.message.includes('rate limit')
            ) {
                providerError = {
                    type: MediaProviderErrorType.RATE_LIMIT_EXCEEDED,
                    providerId: this.id,
                    message: `Rate limit exceeded for ${this.name}`,
                    retryAfter: this.rateLimit.window,
                    details: { context },
                };
            }
            // API key errors (typically HTTP 401/403)
            else if (
                error.message.includes('401') ||
                error.message.includes('403') ||
                error.message.includes('unauthorized')
            ) {
                providerError = {
                    type: MediaProviderErrorType.API_KEY_INVALID,
                    providerId: this.id,
                    message: `Invalid API key for ${this.name}`,
                    details: { context },
                };
            }
            // Provider unavailable (HTTP 5xx)
            else if (
                error.message.includes('5') &&
                error.message.includes('0')
            ) {
                providerError = {
                    type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                    providerId: this.id,
                    message: `${this.name} is temporarily unavailable`,
                    retryAfter: 300, // 5 minutes
                    details: { context },
                };
            }
            // Generic search failure
            else {
                providerError = {
                    type: MediaProviderErrorType.SEARCH_FAILED,
                    providerId: this.id,
                    message: `Search failed: ${error.message}`,
                    details: { context, originalError: error.message },
                };
            }
        } else {
            providerError = {
                type: MediaProviderErrorType.SEARCH_FAILED,
                providerId: this.id,
                message: 'Unknown error occurred',
                details: { context, error },
            };
        }

        this.lastError = providerError;
        this.updateHealthScore(providerError);

        return providerError;
    }

    /**
     * Update health score based on error type
     */
    private updateHealthScore(error: MediaProviderError): void {
        switch (error.type) {
            case MediaProviderErrorType.NETWORK_ERROR:
                this.healthScore = Math.max(0, this.healthScore - 10);
                break;
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                this.healthScore = Math.max(0, this.healthScore - 5);
                break;
            case MediaProviderErrorType.API_KEY_INVALID:
                this.healthScore = 0; // Critical error
                break;
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                this.healthScore = Math.max(0, this.healthScore - 20);
                break;
            case MediaProviderErrorType.SEARCH_FAILED:
                this.healthScore = Math.max(0, this.healthScore - 15);
                break;
        }
    }

    /**
     * Get current provider status
     */
    getStatus(): ProviderStatus {
        const now = Date.now();
        const windowKey = Math.floor(
            now / (this.rateLimit.window * 1000)
        ).toString();
        const tracker = this.rateLimitTracker.get(windowKey);

        return {
            id: this.id,
            name: this.name,
            isAvailable: this.config.enabled && this.healthScore > 0,
            rateLimit: {
                ...this.rateLimit,
                remaining: tracker
                    ? Math.max(0, this.rateLimit.requests - tracker.count)
                    : this.rateLimit.requests,
                resetTime: tracker?.resetTime,
            },
            lastError: this.lastError,
            healthScore: this.healthScore,
        };
    }

    /**
     * Reset health score (called on successful operations)
     */
    protected resetHealthScore(): void {
        this.healthScore = Math.min(100, this.healthScore + 5);
        if (this.healthScore > 80) {
            this.lastError = undefined;
        }
    }

    /**
     * Check if provider is healthy and available
     */
    isHealthy(): boolean {
        return (
            this.config.enabled &&
            this.healthScore > 20 &&
            this.checkRateLimit()
        );
    }

    /**
     * Make HTTP request with error handling and rate limiting
     */
    protected async makeRequest<T>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded');
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'User-Agent': 'REVLR-Event-Platform/1.0',
                    ...options.headers,
                },
            });

            this.incrementRateLimit();

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            this.resetHealthScore(); // Successful request
            return data;
        } catch (error) {
            throw this.handleError(error, `Request to ${url}`);
        }
    }
}

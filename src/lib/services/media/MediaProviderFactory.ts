import { MediaProvider } from './MediaProvider';
import { UnsplashProvider } from './providers/UnsplashProvider';
import { PexelsProvider } from './providers/PexelsProvider';
import { PixabayProvider } from './providers/PixabayProvider';
import { MediaProviderConfig, RateLimit } from '@/types/media-search';
import { ProviderHealthMonitor } from './ProviderHealthMonitor';

export interface ProviderConfiguration {
    unsplash?: {
        apiKey: string;
        secretKey?: string;
        enabled: boolean;
        rateLimit?: Partial<RateLimit>;
        oauth?: {
            clientId: string;
            clientSecret: string;
            redirectUri: string;
            scopes?: string[];
        };
    };
    pexels?: {
        apiKey: string;
        enabled: boolean;
        rateLimit?: Partial<RateLimit>;
    };
    pixabay?: {
        apiKey: string;
        enabled: boolean;
        rateLimit?: Partial<RateLimit>;
    };
}

export interface ProviderCapabilities {
    providerId: string;
    name: string;
    supportedMediaTypes: ('image' | 'video')[];
    supportedFilters: {
        orientation: boolean;
        color: boolean;
        size: boolean;
        category: boolean;
    };
    availableColors?: string[];
    availableCategories?: string[];
    requiresAttribution: boolean;
    commercialUse: boolean;
    rateLimit: RateLimit;
}

export interface InitializationError {
    providerId: string;
    error: string;
    type: 'configuration' | 'network' | 'authentication' | 'unknown';
    canRetry: boolean;
}

export interface InitializationResult {
    success: boolean;
    initializedProviders: string[];
    failedProviders: InitializationError[];
    warnings: string[];
}

/**
 * Factory for creating and managing media providers with unified configuration
 */
export class MediaProviderFactory {
    private static instance: MediaProviderFactory;
    private providers: Map<string, MediaProvider> = new Map();
    private healthMonitor: ProviderHealthMonitor;
    private configuration: ProviderConfiguration = {};
    private isInitialized: boolean = false;
    private initializationErrors: InitializationError[] = [];
    private lastInitialized: Date | null = null;

    // Default rate limits for each provider
    private static readonly DEFAULT_RATE_LIMITS: Record<string, RateLimit> = {
        unsplash: { requests: 50, window: 3600 }, // 50 per hour
        pexels: { requests: 200, window: 3600 }, // 200 per hour
        pixabay: { requests: 100, window: 3600 }, // 100 per hour
    };

    private constructor() {
        this.healthMonitor = new ProviderHealthMonitor();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): MediaProviderFactory {
        if (!MediaProviderFactory.instance) {
            MediaProviderFactory.instance = new MediaProviderFactory();
        }
        return MediaProviderFactory.instance;
    }

    /**
     * Initialize providers with configuration
     */
    async initialize(
        config: ProviderConfiguration
    ): Promise<InitializationResult> {
        this.configuration = config;
        this.initializationErrors = [];
        const initializedProviders: string[] = [];
        const failedProviders: InitializationError[] = [];
        const warnings: string[] = [];

        // Clear existing providers
        this.providers.clear();
        this.isInitialized = false;

        // Initialize each configured provider
        if (config.unsplash?.enabled) {
            if (config.unsplash.apiKey) {
                try {
                    await this.createUnsplashProvider(config.unsplash);
                    initializedProviders.push('unsplash');
                } catch (error) {
                    const initError = this.createInitializationError(
                        'unsplash',
                        error
                    );
                    failedProviders.push(initError);
                    this.initializationErrors.push(initError);
                }
            } else {
                const initError: InitializationError = {
                    providerId: 'unsplash',
                    error: 'API key is required but not provided',
                    type: 'configuration',
                    canRetry: false,
                };
                failedProviders.push(initError);
                this.initializationErrors.push(initError);
            }
        }

        if (config.pexels?.enabled) {
            if (config.pexels.apiKey) {
                try {
                    await this.createPexelsProvider(config.pexels);
                    initializedProviders.push('pexels');
                } catch (error) {
                    const initError = this.createInitializationError(
                        'pexels',
                        error
                    );
                    failedProviders.push(initError);
                    this.initializationErrors.push(initError);
                }
            } else {
                const initError: InitializationError = {
                    providerId: 'pexels',
                    error: 'API key is required but not provided',
                    type: 'configuration',
                    canRetry: false,
                };
                failedProviders.push(initError);
                this.initializationErrors.push(initError);
            }
        }

        if (config.pixabay?.enabled) {
            if (config.pixabay.apiKey) {
                try {
                    await this.createPixabayProvider(config.pixabay);
                    initializedProviders.push('pixabay');
                } catch (error) {
                    const initError = this.createInitializationError(
                        'pixabay',
                        error
                    );
                    failedProviders.push(initError);
                    this.initializationErrors.push(initError);
                }
            } else {
                const initError: InitializationError = {
                    providerId: 'pixabay',
                    error: 'API key is required but not provided',
                    type: 'configuration',
                    canRetry: false,
                };
                failedProviders.push(initError);
                this.initializationErrors.push(initError);
            }
        }

        // Check if at least one provider was initialized successfully
        if (initializedProviders.length === 0) {
            warnings.push('No providers were successfully initialized');
        }

        // Start health monitoring if we have providers
        if (initializedProviders.length > 0) {
            try {
                this.healthMonitor.startMonitoring();
            } catch (error) {
                warnings.push(`Failed to start health monitoring: ${error}`);
            }
        }

        this.isInitialized = initializedProviders.length > 0;
        this.lastInitialized = new Date();

        return {
            success: initializedProviders.length > 0,
            initializedProviders,
            failedProviders,
            warnings,
        };
    }

    /**
     * Check if the factory has been initialized
     */
    isFactoryInitialized(): boolean {
        return this.isInitialized;
    }

    /**
     * Get initialization errors
     */
    getInitializationErrors(): InitializationError[] {
        return [...this.initializationErrors];
    }

    /**
     * Get last initialization date
     */
    getLastInitialized(): Date | null {
        return this.lastInitialized;
    }

    /**
     * Create initialization error from caught error
     */
    private createInitializationError(
        providerId: string,
        error: unknown
    ): InitializationError {
        let errorMessage = 'Unknown error occurred';
        let errorType: InitializationError['type'] = 'unknown';
        let canRetry = true;

        if (error instanceof Error) {
            errorMessage = error.message;

            // Categorize error based on message content
            const message = error.message.toLowerCase();
            if (
                message.includes('api key') ||
                message.includes('unauthorized') ||
                message.includes('401') ||
                message.includes('403')
            ) {
                errorType = 'authentication';
                canRetry = false;
            } else if (
                message.includes('network') ||
                message.includes('fetch') ||
                message.includes('timeout')
            ) {
                errorType = 'network';
                canRetry = true;
            } else if (
                message.includes('config') ||
                message.includes('invalid')
            ) {
                errorType = 'configuration';
                canRetry = false;
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            providerId,
            error: errorMessage,
            type: errorType,
            canRetry,
        };
    }

    /**
     * Create Unsplash provider
     */
    private async createUnsplashProvider(
        config: ProviderConfiguration['unsplash']
    ): Promise<void> {
        if (!config) {
            throw new Error('Unsplash configuration is required');
        }

        if (!config.apiKey) {
            throw new Error('Unsplash API key is required');
        }

        try {
            const providerConfig: MediaProviderConfig = {
                apiKey: config.apiKey,
                secretKey: config.secretKey,
                baseUrl: 'https://api.unsplash.com',
                rateLimit: {
                    ...MediaProviderFactory.DEFAULT_RATE_LIMITS.unsplash,
                    ...config.rateLimit,
                },
                enabled: config.enabled,
                oauth: config.oauth,
            };

            const provider = new UnsplashProvider(providerConfig);

            // Test the provider by checking its status
            const status = provider.getStatus();
            if (!status.isAvailable) {
                throw new Error(
                    `Unsplash provider is not available: ${status.lastError?.message || 'Unknown error'}`
                );
            }

            this.providers.set('unsplash', provider);
            this.healthMonitor.registerProvider(provider);
        } catch (error) {
            throw new Error(
                `Failed to create Unsplash provider: ${error instanceof Error ? error.message : error}`
            );
        }
    }

    /**
     * Create Pexels provider
     */
    private async createPexelsProvider(
        config: ProviderConfiguration['pexels']
    ): Promise<void> {
        if (!config) {
            throw new Error('Pexels configuration is required');
        }

        if (!config.apiKey) {
            throw new Error('Pexels API key is required');
        }

        try {
            const providerConfig: MediaProviderConfig = {
                apiKey: config.apiKey,
                baseUrl: 'https://api.pexels.com/v1',
                rateLimit: {
                    ...MediaProviderFactory.DEFAULT_RATE_LIMITS.pexels,
                    ...config.rateLimit,
                },
                enabled: config.enabled,
            };

            const provider = new PexelsProvider(providerConfig);

            // Test the provider by checking its status
            const status = provider.getStatus();
            if (!status.isAvailable) {
                throw new Error(
                    `Pexels provider is not available: ${status.lastError?.message || 'Unknown error'}`
                );
            }

            this.providers.set('pexels', provider);
            this.healthMonitor.registerProvider(provider);
        } catch (error) {
            throw new Error(
                `Failed to create Pexels provider: ${error instanceof Error ? error.message : error}`
            );
        }
    }

    /**
     * Create Pixabay provider
     */
    private async createPixabayProvider(
        config: ProviderConfiguration['pixabay']
    ): Promise<void> {
        if (!config) {
            throw new Error('Pixabay configuration is required');
        }

        if (!config.apiKey) {
            throw new Error('Pixabay API key is required');
        }

        try {
            const providerConfig: MediaProviderConfig = {
                apiKey: config.apiKey,
                baseUrl: 'https://pixabay.com/api',
                rateLimit: {
                    ...MediaProviderFactory.DEFAULT_RATE_LIMITS.pixabay,
                    ...config.rateLimit,
                },
                enabled: config.enabled,
            };

            const provider = new PixabayProvider(providerConfig);

            // Test the provider by checking its status
            const status = provider.getStatus();
            if (!status.isAvailable) {
                throw new Error(
                    `Pixabay provider is not available: ${status.lastError?.message || 'Unknown error'}`
                );
            }

            this.providers.set('pixabay', provider);
            this.healthMonitor.registerProvider(provider);
        } catch (error) {
            throw new Error(
                `Failed to create Pixabay provider: ${error instanceof Error ? error.message : error}`
            );
        }
    }

    /**
     * Get a provider by ID
     */
    getProvider(providerId: string): MediaProvider | null {
        return this.providers.get(providerId) || null;
    }

    /**
     * Get all registered providers
     */
    getAllProviders(): MediaProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * Get healthy providers
     */
    getHealthyProviders(): MediaProvider[] {
        return this.healthMonitor.getHealthyProviders();
    }

    /**
     * Get providers sorted by health score
     */
    getProvidersByHealthScore(): { provider: MediaProvider; score: number }[] {
        return this.healthMonitor.getProvidersByHealthScore();
    }

    /**
     * Get provider capabilities
     */
    getProviderCapabilities(providerId: string): ProviderCapabilities | null {
        const provider = this.providers.get(providerId);
        if (!provider) return null;

        // Get capabilities from provider if available
        const getSupportedMediaTypes = (
            provider as any
        ).getSupportedMediaTypes?.() || ['image'];
        const getSupportedFilters = (
            provider as any
        ).getSupportedFilters?.() || {
            orientation: true,
            color: true,
            size: true,
            category: true,
        };
        const getAvailableColors =
            (provider as any).getAvailableColors?.() || [];
        const getAvailableCategories =
            (provider as any).getAvailableCategories?.() || [];

        return {
            providerId: provider.id,
            name: provider.name,
            supportedMediaTypes: getSupportedMediaTypes,
            supportedFilters: getSupportedFilters,
            availableColors: getAvailableColors,
            availableCategories: getAvailableCategories,
            requiresAttribution: this.getAttributionRequirement(providerId),
            commercialUse: this.getCommercialUsePermission(providerId),
            rateLimit: provider.rateLimit,
        };
    }

    /**
     * Get all provider capabilities
     */
    getAllProviderCapabilities(): ProviderCapabilities[] {
        return Array.from(this.providers.keys())
            .map((providerId) => this.getProviderCapabilities(providerId))
            .filter((cap): cap is ProviderCapabilities => cap !== null);
    }

    /**
     * Get provider health metrics
     */
    getProviderHealthMetrics(providerId: string) {
        return this.healthMonitor.getProviderMetrics(providerId);
    }

    /**
     * Get all provider health metrics
     */
    getAllProviderHealthMetrics() {
        return this.healthMonitor.getAllProviderMetrics();
    }

    /**
     * Get failover recommendations
     */
    getFailoverRecommendations() {
        return this.healthMonitor.getFailoverRecommendations();
    }

    /**
     * Perform health check on all providers
     */
    async performHealthCheck() {
        return this.healthMonitor.performHealthChecks();
    }

    /**
     * Get health monitor instance
     */
    getHealthMonitor(): ProviderHealthMonitor {
        return this.healthMonitor;
    }

    /**
     * Enable/disable a provider
     */
    async setProviderEnabled(
        providerId: string,
        enabled: boolean
    ): Promise<boolean> {
        const provider = this.providers.get(providerId);
        if (!provider) return false;

        // Update configuration
        const providerConfig =
            this.configuration[providerId as keyof ProviderConfiguration];
        if (providerConfig) {
            providerConfig.enabled = enabled;
        }

        // If disabling, unregister from health monitor
        if (!enabled) {
            this.healthMonitor.unregisterProvider(providerId);
        } else {
            // If enabling, register with health monitor
            this.healthMonitor.registerProvider(provider);
        }

        return true;
    }

    /**
     * Update provider rate limits
     */
    async updateProviderRateLimit(
        providerId: string,
        rateLimit: Partial<RateLimit>
    ): Promise<boolean> {
        const provider = this.providers.get(providerId);
        if (!provider) return false;

        // Update the provider's rate limit
        Object.assign(provider.rateLimit, rateLimit);

        // Update configuration
        const providerConfig =
            this.configuration[providerId as keyof ProviderConfiguration];
        if (providerConfig) {
            providerConfig.rateLimit = {
                ...providerConfig.rateLimit,
                ...rateLimit,
            };
        }

        return true;
    }

    /**
     * Get provider search optimizations
     */
    getProviderSearchOptimizations(
        providerId: string,
        query: string
    ): {
        optimizedQuery: string;
        suggestions: string[];
    } | null {
        const provider = this.providers.get(providerId);
        if (!provider) return null;

        // Use provider-specific optimization if available
        if (typeof (provider as any).getSearchOptimizations === 'function') {
            return (provider as any).getSearchOptimizations(query);
        }

        // Default optimization
        return {
            optimizedQuery: query.trim(),
            suggestions: [],
        };
    }

    /**
     * Get unified search suggestions from all providers
     */
    async getUnifiedSearchSuggestions(query: string): Promise<string[]> {
        const allSuggestions: string[] = [];

        for (const provider of this.providers.values()) {
            try {
                if (
                    typeof (provider as any).getSearchSuggestions === 'function'
                ) {
                    const suggestions = await (
                        provider as any
                    ).getSearchSuggestions(query);
                    allSuggestions.push(...suggestions);
                }
            } catch (error) {
                console.warn(
                    `Failed to get suggestions from ${provider.id}:`,
                    error
                );
            }
        }

        // Remove duplicates and limit results
        return [...new Set(allSuggestions)].slice(0, 15);
    }

    /**
     * Validate provider configuration
     */
    validateConfiguration(config: ProviderConfiguration): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check if at least one provider is enabled
        const enabledProviders = Object.entries(config).filter(
            ([_, providerConfig]) => providerConfig?.enabled
        );

        if (enabledProviders.length === 0) {
            errors.push('At least one provider must be enabled');
        }

        // Validate each provider configuration
        for (const [providerId, providerConfig] of Object.entries(config)) {
            if (!providerConfig?.enabled) continue;

            if (!providerConfig.apiKey) {
                errors.push(`${providerId}: API key is required`);
            }

            if (providerConfig.rateLimit) {
                if (
                    providerConfig.rateLimit.requests !== undefined &&
                    providerConfig.rateLimit.requests <= 0
                ) {
                    errors.push(
                        `${providerId}: Rate limit requests must be positive`
                    );
                }
                if (
                    providerConfig.rateLimit.window !== undefined &&
                    providerConfig.rateLimit.window <= 0
                ) {
                    errors.push(
                        `${providerId}: Rate limit window must be positive`
                    );
                }
            }

            // Provider-specific validations
            if (providerId === 'unsplash' && providerConfig.oauth) {
                const oauth = (providerConfig as any).oauth;
                if (
                    !oauth.clientId ||
                    !oauth.clientSecret ||
                    !oauth.redirectUri
                ) {
                    warnings.push(
                        `${providerId}: OAuth configuration is incomplete`
                    );
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Get current configuration
     */
    getConfiguration(): ProviderConfiguration {
        return { ...this.configuration };
    }

    /**
     * Shutdown the factory and clean up resources
     */
    shutdown(): void {
        this.healthMonitor.stopMonitoring();
        this.providers.clear();
    }

    /**
     * Get attribution requirement for a provider
     */
    private getAttributionRequirement(providerId: string): boolean {
        switch (providerId) {
            case 'unsplash':
            case 'pexels':
                return true;
            case 'pixabay':
                return false;
            default:
                return true; // Safe default
        }
    }

    /**
     * Get commercial use permission for a provider
     */
    private getCommercialUsePermission(providerId: string): boolean {
        // All currently supported providers allow commercial use
        return true;
    }
}

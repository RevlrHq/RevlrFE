import {
    MediaProviderFactory,
    ProviderConfiguration,
} from './MediaProviderFactory';
import { MediaProviderConfig, RateLimit } from '@/types/media-search';

/**
 * Status of the provider initialization process
 */
export interface InitializationStatus {
    isInitialized: boolean;
    availableProviders: string[];
    failedProviders: string[];
    errors: string[];
    warnings: string[];
    lastInitialized: Date | null;
    configurationValid: boolean;
}

/**
 * Result of a provider initialization attempt
 */
export interface ProviderInitializationError {
    providerId: string;
    error: string;
    reason: 'missing_api_key' | 'invalid_config' | 'network_error' | 'unknown';
    canRetry: boolean;
}

/**
 * Result of the initialization process
 */
export interface InitializationResult {
    success: boolean;
    initializedProviders: string[];
    failedProviders: ProviderInitializationError[];
    warnings: string[];
    healthMonitorStarted: boolean;
}

/**
 * Environment configuration for media search providers
 */
export interface MediaSearchEnvironmentConfig {
    unsplash: {
        accessKey?: string;
        secretKey?: string;
        redirectUri?: string;
        enabled: boolean;
    };
    pexels: {
        apiKey?: string;
        enabled: boolean;
    };
    pixabay: {
        apiKey?: string;
        enabled: boolean;
    };
    cache: {
        size: number;
        expiryMinutes: number;
    };
    features: {
        preloadPopular: boolean;
        enableVideoSearch: boolean;
        enableAdvancedFilters: boolean;
    };
}

/**
 * Service responsible for initializing media providers at application startup
 * Handles environment configuration parsing, validation, and provider registration
 */
export class MediaProviderInitializer {
    private static instance: MediaProviderInitializer;
    private initializationStatus: InitializationStatus;
    private providerFactory: MediaProviderFactory;
    private environmentConfig: MediaSearchEnvironmentConfig | null = null;

    private constructor() {
        this.initializationStatus = {
            isInitialized: false,
            availableProviders: [],
            failedProviders: [],
            errors: [],
            warnings: [],
            lastInitialized: null,
            configurationValid: false,
        };
        this.providerFactory = MediaProviderFactory.getInstance();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): MediaProviderInitializer {
        if (!MediaProviderInitializer.instance) {
            MediaProviderInitializer.instance = new MediaProviderInitializer();
        }
        return MediaProviderInitializer.instance;
    }

    /**
     * Initialize the media provider system
     */
    async initialize(): Promise<InitializationResult> {
        try {
            // Parse environment configuration
            this.environmentConfig = this.parseEnvironmentConfiguration();

            // Validate configuration
            const validationResult = this.validateConfiguration(
                this.environmentConfig
            );

            if (!validationResult.isValid) {
                this.initializationStatus = {
                    ...this.initializationStatus,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    configurationValid: false,
                };

                return {
                    success: false,
                    initializedProviders: [],
                    failedProviders: [
                        {
                            providerId: 'configuration',
                            error:
                                validationResult.errors[0] ||
                                'Configuration validation failed',
                            reason: 'invalid_config',
                            canRetry: false,
                        },
                    ],
                    warnings: validationResult.warnings,
                    healthMonitorStarted: false,
                };
            }

            // Convert to provider configuration format
            const providerConfig = this.convertToProviderConfiguration(
                this.environmentConfig
            );

            // Initialize the provider factory
            await this.providerFactory.initialize(providerConfig);

            // Track initialization results
            const initializedProviders: string[] = [];
            const failedProviders: ProviderInitializationError[] = [];
            const warnings: string[] = [...validationResult.warnings];

            // Check which providers were successfully initialized
            for (const [providerId, config] of Object.entries(providerConfig)) {
                if (config.enabled) {
                    const provider =
                        this.providerFactory.getProvider(providerId);
                    if (provider) {
                        initializedProviders.push(providerId);
                    } else {
                        failedProviders.push({
                            providerId,
                            error: `Failed to initialize ${providerId} provider`,
                            reason: 'unknown',
                            canRetry: true,
                        });
                    }
                }
            }

            // Update initialization status
            this.initializationStatus = {
                isInitialized: true,
                availableProviders: initializedProviders,
                failedProviders: failedProviders.map((f) => f.providerId),
                errors: failedProviders.map((f) => f.error),
                warnings,
                lastInitialized: new Date(),
                configurationValid: true,
            };

            return {
                success: initializedProviders.length > 0,
                initializedProviders,
                failedProviders,
                warnings,
                healthMonitorStarted: true,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : typeof error === 'string'
                      ? error
                      : 'Unknown initialization error';

            this.initializationStatus = {
                ...this.initializationStatus,
                errors: [errorMessage],
                configurationValid: false,
            };

            return {
                success: false,
                initializedProviders: [],
                failedProviders: [
                    {
                        providerId: 'system',
                        error: errorMessage,
                        reason: 'unknown',
                        canRetry: true,
                    },
                ],
                warnings: [],
                healthMonitorStarted: false,
            };
        }
    }

    /**
     * Get current initialization status
     */
    getInitializationStatus(): InitializationStatus {
        return { ...this.initializationStatus };
    }

    /**
     * Reinitialize the provider system
     */
    async reinitialize(): Promise<InitializationResult> {
        // Reset status
        this.initializationStatus = {
            isInitialized: false,
            availableProviders: [],
            failedProviders: [],
            errors: [],
            warnings: [],
            lastInitialized: null,
            configurationValid: false,
        };

        // Shutdown existing providers
        this.providerFactory.shutdown();

        // Reinitialize
        return this.initialize();
    }

    /**
     * Parse environment variables into configuration
     */
    private parseEnvironmentConfiguration(): MediaSearchEnvironmentConfig {
        // Helper function to safely get environment variable
        const getEnvVar = (key: string): string | undefined => {
            return (
                process.env[key] ||
                (typeof window !== 'undefined'
                    ? (window as any).env?.[key]
                    : undefined)
            );
        };

        // Helper function to parse boolean environment variable
        const parseBooleanEnv = (
            key: string,
            defaultValue: boolean = false
        ): boolean => {
            const value = getEnvVar(key);
            if (value === undefined) return defaultValue;
            return value.toLowerCase() === 'true' || value === '1';
        };

        // Helper function to parse integer environment variable
        const parseIntEnv = (key: string, defaultValue: number): number => {
            const value = getEnvVar(key);
            if (value === undefined) return defaultValue;
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : parsed;
        };

        return {
            unsplash: {
                accessKey:
                    getEnvVar('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY') ||
                    getEnvVar('UNSPLASH_ACCESS_KEY'),
                secretKey: getEnvVar('NEXT_PUBLIC_UNSPLASH_SECRET_KEY'),
                redirectUri:
                    getEnvVar('NEXT_PUBLIC_UNSPLASH_REDIRECT_URI') ||
                    `${getEnvVar('NEXT_PUBLIC_API_URL') || 'http://localhost:3000'}/api/auth/unsplash/callback`,
                enabled: !!(
                    getEnvVar('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY') ||
                    getEnvVar('UNSPLASH_ACCESS_KEY')
                ),
            },
            pexels: {
                apiKey:
                    getEnvVar('NEXT_PUBLIC_PEXELS_API_KEY') ||
                    getEnvVar('PEXELS_API_KEY'),
                enabled: !!(
                    getEnvVar('NEXT_PUBLIC_PEXELS_API_KEY') ||
                    getEnvVar('PEXELS_API_KEY')
                ),
            },
            pixabay: {
                apiKey:
                    getEnvVar('NEXT_PUBLIC_PIXABAY_API_KEY') ||
                    getEnvVar('PIXABAY_API_KEY'),
                enabled: !!(
                    getEnvVar('NEXT_PUBLIC_PIXABAY_API_KEY') ||
                    getEnvVar('PIXABAY_API_KEY')
                ),
            },
            cache: {
                size: parseIntEnv('NEXT_PUBLIC_MEDIA_CACHE_SIZE', 1000),
                expiryMinutes: parseIntEnv('NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES', 30),
            },
            features: {
                preloadPopular: parseBooleanEnv('NEXT_PUBLIC_MEDIA_PRELOAD_POPULAR', true),
                enableVideoSearch: parseBooleanEnv(
                    'NEXT_PUBLIC_ENABLE_VIDEO_SEARCH',
                    false
                ),
                enableAdvancedFilters: parseBooleanEnv(
                    'NEXT_PUBLIC_ENABLE_ADVANCED_FILTERS',
                    true
                ),
            },
        };
    }

    /**
     * Validate the parsed configuration
     */
    private validateConfiguration(config: MediaSearchEnvironmentConfig): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check if at least one provider is enabled
        const enabledProviders = [
            config.unsplash.enabled,
            config.pexels.enabled,
            config.pixabay.enabled,
        ].filter(Boolean);

        if (enabledProviders.length === 0) {
            errors.push(
                'No media providers are configured. Please set API keys for at least one provider (Unsplash, Pexels, or Pixabay).'
            );
        }

        // Validate individual provider configurations
        if (config.unsplash.enabled && !config.unsplash.accessKey) {
            errors.push(
                'Unsplash is enabled but NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is missing'
            );
        }

        if (config.pexels.enabled && !config.pexels.apiKey) {
            errors.push(
                'Pexels is enabled but NEXT_PUBLIC_PEXELS_API_KEY is missing'
            );
        }

        if (config.pixabay.enabled && !config.pixabay.apiKey) {
            errors.push(
                'Pixabay is enabled but NEXT_PUBLIC_PIXABAY_API_KEY is missing'
            );
        }

        // Validate cache configuration
        if (config.cache.size < 100) {
            warnings.push(
                'Cache size is very small (< 100). Consider increasing NEXT_PUBLIC_MEDIA_CACHE_SIZE for better performance.'
            );
        }

        if (config.cache.expiryMinutes < 5) {
            warnings.push(
                'Cache expiry is very short (< 5 minutes). Consider increasing NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES.'
            );
        }

        // Validate OAuth configuration for Unsplash if secret key is provided
        if (
            config.unsplash.enabled &&
            config.unsplash.secretKey &&
            (!config.unsplash.redirectUri ||
                config.unsplash.redirectUri.includes('localhost'))
        ) {
            warnings.push(
                'Unsplash OAuth is partially configured but redirect URI is missing. OAuth features may not work properly.'
            );
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Convert environment configuration to provider configuration format
     */
    private convertToProviderConfiguration(
        envConfig: MediaSearchEnvironmentConfig
    ): ProviderConfiguration {
        const config: ProviderConfiguration = {};

        // Default rate limits for each provider
        const defaultRateLimits: Record<string, RateLimit> = {
            unsplash: { requests: 50, window: 3600 }, // 50 per hour for demo apps
            pexels: { requests: 200, window: 3600 }, // 200 per hour
            pixabay: { requests: 100, window: 3600 }, // 100 per hour
        };

        // Configure Unsplash
        if (envConfig.unsplash.enabled && envConfig.unsplash.accessKey) {
            config.unsplash = {
                apiKey: envConfig.unsplash.accessKey,
                secretKey: envConfig.unsplash.secretKey,
                enabled: true,
                rateLimit: defaultRateLimits.unsplash,
            };

            // Add OAuth configuration if secret key is available
            if (
                envConfig.unsplash.secretKey &&
                envConfig.unsplash.redirectUri
            ) {
                config.unsplash.oauth = {
                    clientId: envConfig.unsplash.accessKey,
                    clientSecret: envConfig.unsplash.secretKey,
                    redirectUri: envConfig.unsplash.redirectUri,
                    scopes: [
                        'public',
                        'read_user',
                        'write_likes',
                        'read_collections',
                    ],
                };
            }
        }

        // Configure Pexels
        if (envConfig.pexels.enabled && envConfig.pexels.apiKey) {
            config.pexels = {
                apiKey: envConfig.pexels.apiKey,
                enabled: true,
                rateLimit: defaultRateLimits.pexels,
            };
        }

        // Configure Pixabay
        if (envConfig.pixabay.enabled && envConfig.pixabay.apiKey) {
            config.pixabay = {
                apiKey: envConfig.pixabay.apiKey,
                enabled: true,
                rateLimit: defaultRateLimits.pixabay,
            };
        }

        return config;
    }

    /**
     * Get the parsed environment configuration
     */
    getEnvironmentConfiguration(): MediaSearchEnvironmentConfig | null {
        return this.environmentConfig ? { ...this.environmentConfig } : null;
    }

    /**
     * Get provider factory instance
     */
    getProviderFactory(): MediaProviderFactory {
        return this.providerFactory;
    }

    /**
     * Check if initialization is required
     */
    isInitializationRequired(): boolean {
        return !this.initializationStatus.isInitialized;
    }

    /**
     * Get configuration summary for debugging
     */
    getConfigurationSummary(): {
        environmentConfig: MediaSearchEnvironmentConfig | null;
        initializationStatus: InitializationStatus;
        enabledProviders: string[];
        disabledProviders: string[];
        hasValidConfiguration: boolean;
    } {
        const enabledProviders: string[] = [];
        const disabledProviders: string[] = [];

        if (this.environmentConfig) {
            if (this.environmentConfig.unsplash.enabled) {
                enabledProviders.push('unsplash');
            } else {
                disabledProviders.push('unsplash');
            }

            if (this.environmentConfig.pexels.enabled) {
                enabledProviders.push('pexels');
            } else {
                disabledProviders.push('pexels');
            }

            if (this.environmentConfig.pixabay.enabled) {
                enabledProviders.push('pixabay');
            } else {
                disabledProviders.push('pixabay');
            }
        }

        return {
            environmentConfig: this.environmentConfig,
            initializationStatus: this.getInitializationStatus(),
            enabledProviders,
            disabledProviders,
            hasValidConfiguration: this.initializationStatus.configurationValid,
        };
    }

    /**
     * Generate user-friendly error messages for common configuration issues
     */
    generateUserFriendlyErrorMessages(): {
        title: string;
        message: string;
        actions: Array<{
            label: string;
            action: 'retry' | 'configure' | 'contact_support' | 'dismiss';
            url?: string;
        }>;
        severity: 'error' | 'warning' | 'info';
    }[] {
        const messages: Array<{
            title: string;
            message: string;
            actions: Array<{
                label: string;
                action: 'retry' | 'configure' | 'contact_support' | 'dismiss';
                url?: string;
            }>;
            severity: 'error' | 'warning' | 'info';
        }> = [];

        if (!this.initializationStatus.isInitialized) {
            if (
                this.initializationStatus.errors.some((error) =>
                    error.includes('No media providers')
                )
            ) {
                messages.push({
                    title: 'Media Search Unavailable',
                    message:
                        'No media providers are configured. To use media search, you need to set up API keys for at least one provider (Unsplash, Pexels, or Pixabay).',
                    actions: [
                        {
                            label: 'Configuration Guide',
                            action: 'configure',
                            url: '/docs/media-providers-setup',
                        },
                        {
                            label: 'Retry',
                            action: 'retry',
                        },
                    ],
                    severity: 'error',
                });
            }

            if (
                this.initializationStatus.errors.some((error) =>
                    error.includes('API key')
                )
            ) {
                messages.push({
                    title: 'API Key Configuration Issue',
                    message:
                        'One or more media provider API keys are missing or invalid. Please check your environment configuration.',
                    actions: [
                        {
                            label: 'Check Configuration',
                            action: 'configure',
                        },
                        {
                            label: 'Retry',
                            action: 'retry',
                        },
                    ],
                    severity: 'error',
                });
            }
        }

        if (this.initializationStatus.warnings.length > 0) {
            messages.push({
                title: 'Configuration Warnings',
                message: `There are ${this.initializationStatus.warnings.length} configuration warnings that may affect performance.`,
                actions: [
                    {
                        label: 'View Details',
                        action: 'configure',
                    },
                    {
                        label: 'Dismiss',
                        action: 'dismiss',
                    },
                ],
                severity: 'warning',
            });
        }

        return messages;
    }
}

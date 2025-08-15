import { MediaProviderConfig } from '@/types/media-search';

// Environment variable validation
const requiredEnvVars = {
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
};

// Validate environment variables
function validateEnvVar(name: string, value: string | undefined): string {
    if (!value) {
        console.warn(
            `Warning: ${name} is not set. ${name.split('_')[0]} provider will be disabled.`
        );
        return '';
    }
    return value;
}

// Media provider configurations
export const MEDIA_PROVIDER_CONFIGS: Record<string, MediaProviderConfig> = {
    unsplash: {
        apiKey: validateEnvVar(
            'UNSPLASH_ACCESS_KEY',
            requiredEnvVars.UNSPLASH_ACCESS_KEY
        ),
        secretKey: process.env.UNSPLASH_SECRET_KEY,
        baseUrl: 'https://api.unsplash.com',
        rateLimit: {
            requests: 50, // 50 requests per hour for demo apps
            window: 3600, // 1 hour in seconds
        },
        enabled: !!requiredEnvVars.UNSPLASH_ACCESS_KEY,
    },

    pexels: {
        apiKey: validateEnvVar(
            'PEXELS_API_KEY',
            requiredEnvVars.PEXELS_API_KEY
        ),
        baseUrl: 'https://api.pexels.com/v1',
        rateLimit: {
            requests: 200, // 200 requests per hour
            window: 3600, // 1 hour in seconds
        },
        enabled: !!requiredEnvVars.PEXELS_API_KEY,
    },

    pixabay: {
        apiKey: validateEnvVar(
            'PIXABAY_API_KEY',
            requiredEnvVars.PIXABAY_API_KEY
        ),
        baseUrl: 'https://pixabay.com/api',
        rateLimit: {
            requests: 100, // 100 requests per hour for free accounts
            window: 3600, // 1 hour in seconds
        },
        enabled: !!requiredEnvVars.PIXABAY_API_KEY,
    },
};

// Cache configuration
export const CACHE_CONFIG = {
    maxSize: parseInt(process.env.MEDIA_CACHE_SIZE || '1000'),
    expiryMinutes: parseInt(process.env.MEDIA_CACHE_EXPIRY_MINUTES || '30'),
    preloadPopularSearches: process.env.MEDIA_PRELOAD_POPULAR !== 'false',
};

// Feature flags
export const MEDIA_SEARCH_FEATURES = {
    enableVideoSearch: process.env.ENABLE_VIDEO_SEARCH === 'true',
    enableAdvancedFilters: process.env.ENABLE_ADVANCED_FILTERS !== 'false',
    enableAttributionTracking:
        process.env.ENABLE_ATTRIBUTION_TRACKING !== 'false',
    enableUsageAnalytics: process.env.ENABLE_USAGE_ANALYTICS !== 'false',
    maxImagesPerSearch: parseInt(process.env.MAX_IMAGES_PER_SEARCH || '100'),
    maxSelectedImages: parseInt(process.env.MAX_SELECTED_IMAGES || '10'),
};

// Default search parameters
export const DEFAULT_SEARCH_PARAMS = {
    perPage: 20,
    orientation: undefined,
    category: undefined,
    minWidth: 800,
    minHeight: 600,
};

// Provider priority order (higher number = higher priority)
export const PROVIDER_PRIORITY = {
    unsplash: 3,
    pexels: 2,
    pixabay: 1,
};

// Error retry configuration
export const ERROR_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
};

// Health check configuration
export const HEALTH_CHECK_CONFIG = {
    checkInterval: 300000, // 5 minutes
    unhealthyThreshold: 20, // Health score below this is considered unhealthy
    recoveryThreshold: 80, // Health score above this clears errors
};

/**
 * Get enabled provider configurations
 */
export function getEnabledProviderConfigs(): Record<
    string,
    MediaProviderConfig
> {
    return Object.fromEntries(
        Object.entries(MEDIA_PROVIDER_CONFIGS).filter(
            ([, config]) => config.enabled
        )
    );
}

/**
 * Get provider configuration by ID
 */
export function getProviderConfig(
    providerId: string
): MediaProviderConfig | null {
    return MEDIA_PROVIDER_CONFIGS[providerId] || null;
}

/**
 * Check if any providers are configured
 */
export function hasConfiguredProviders(): boolean {
    return Object.values(MEDIA_PROVIDER_CONFIGS).some(
        (config) => config.enabled
    );
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): {
    enabledProviders: string[];
    disabledProviders: string[];
    cacheConfig: typeof CACHE_CONFIG;
    features: typeof MEDIA_SEARCH_FEATURES;
} {
    const enabled: string[] = [];
    const disabled: string[] = [];

    Object.entries(MEDIA_PROVIDER_CONFIGS).forEach(([id, config]) => {
        if (config.enabled) {
            enabled.push(id);
        } else {
            disabled.push(id);
        }
    });

    return {
        enabledProviders: enabled,
        disabledProviders: disabled,
        cacheConfig: CACHE_CONFIG,
        features: MEDIA_SEARCH_FEATURES,
    };
}

/**
 * Validate configuration on startup
 */
export function validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if at least one provider is enabled
    if (!hasConfiguredProviders()) {
        errors.push(
            'No media providers are configured. Please set API keys for at least one provider.'
        );
    }

    // Validate cache configuration
    if (CACHE_CONFIG.maxSize < 100) {
        warnings.push(
            'Cache size is very small, consider increasing MEDIA_CACHE_SIZE'
        );
    }

    if (CACHE_CONFIG.expiryMinutes < 5) {
        warnings.push(
            'Cache expiry is very short, consider increasing MEDIA_CACHE_EXPIRY_MINUTES'
        );
    }

    // Validate feature configuration
    if (MEDIA_SEARCH_FEATURES.maxSelectedImages > 20) {
        warnings.push(
            'MAX_SELECTED_IMAGES is quite high, this may impact performance'
        );
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

// Export configuration validation result for startup checks
export const CONFIG_VALIDATION = validateConfiguration();

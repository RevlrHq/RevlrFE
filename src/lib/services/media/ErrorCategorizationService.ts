import {
    MediaProviderError,
    MediaProviderErrorType,
} from '@/types/media-search';

export interface ErrorCategory {
    type: MediaProviderErrorType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    isRetryable: boolean;
    defaultRetryDelay: number;
    maxRetries: number;
    userMessage: string;
    technicalMessage: string;
    recoveryActions: string[];
    preventionTips: string[];
}

export interface ErrorRecoveryStrategy {
    strategy:
        | 'immediate_retry'
        | 'exponential_backoff'
        | 'circuit_breaker'
        | 'fallback_provider'
        | 'disable_temporarily'
        | 'manual_intervention';
    retryConfig?: {
        maxRetries: number;
        baseDelay: number;
        maxDelay: number;
        backoffMultiplier: number;
        jitter: boolean;
    };
    fallbackOptions?: string[];
    disableDuration?: number;
    userNotification: {
        title: string;
        message: string;
        actions: Array<{
            label: string;
            action: 'retry' | 'configure' | 'contact_support' | 'dismiss';
            url?: string;
        }>;
    };
}

export interface ErrorPattern {
    id: string;
    name: string;
    description: string;
    conditions: Array<{
        errorType: MediaProviderErrorType;
        frequency: number;
        timeWindow: number; // minutes
        providers?: string[];
    }>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoActions: string[];
    alertThreshold: number;
}

/**
 * Enhanced error categorization service with comprehensive recovery strategies
 */
export class ErrorCategorizationService {
    private errorCategories: Map<MediaProviderErrorType, ErrorCategory> =
        new Map();
    private recoveryStrategies: Map<
        MediaProviderErrorType,
        ErrorRecoveryStrategy
    > = new Map();
    private errorPatterns: Map<string, ErrorPattern> = new Map();

    constructor() {
        this.initializeErrorCategories();
        this.initializeRecoveryStrategies();
        this.initializeErrorPatterns();
    }

    /**
     * Categorize an error and determine appropriate recovery strategy
     */
    categorizeError(
        error: unknown,
        context: {
            providerId: string;
            operation: string;
            retryAttempt?: number;
            previousErrors?: MediaProviderError[];
        }
    ): {
        category: ErrorCategory;
        strategy: ErrorRecoveryStrategy;
        enhancedError: MediaProviderError;
    } {
        const enhancedError = this.enhanceError(error, context);
        const category = this.getErrorCategory(enhancedError.type);
        const strategy = this.getRecoveryStrategy(enhancedError, context);

        return {
            category,
            strategy,
            enhancedError,
        };
    }

    /**
     * Get user-friendly error message with actionable steps
     */
    getUserFriendlyMessage(
        errorType: MediaProviderErrorType,
        providerId: string
    ): {
        title: string;
        message: string;
        actions: string[];
        severity: 'low' | 'medium' | 'high' | 'critical';
    } {
        const category = this.errorCategories.get(errorType);
        if (!category) {
            return {
                title: 'Unexpected Error',
                message: 'An unexpected error occurred. Please try again.',
                actions: [
                    'Try refreshing the page',
                    'Contact support if this persists',
                ],
                severity: 'medium',
            };
        }

        return {
            title: this.getErrorTitle(errorType),
            message: category.userMessage.replace('{provider}', providerId),
            actions: category.recoveryActions,
            severity: category.severity,
        };
    }

    /**
     * Determine if error should trigger circuit breaker
     */
    shouldTriggerCircuitBreaker(
        errorType: MediaProviderErrorType,
        recentErrors: MediaProviderError[],
        timeWindow: number = 300000 // 5 minutes
    ): boolean {
        const category = this.errorCategories.get(errorType);
        if (!category || category.severity === 'low') {
            return false;
        }

        const recentSimilarErrors = recentErrors.filter(
            (error) =>
                error.type === errorType &&
                Date.now() - (error.details?.timestamp || 0) < timeWindow
        );

        // Trigger circuit breaker for critical errors or high frequency of severe errors
        if (
            category.severity === 'critical' &&
            recentSimilarErrors.length >= 1
        ) {
            return true;
        }

        if (category.severity === 'high' && recentSimilarErrors.length >= 3) {
            return true;
        }

        if (category.severity === 'medium' && recentSimilarErrors.length >= 5) {
            return true;
        }

        return false;
    }

    /**
     * Get recommended retry configuration for error type
     */
    getRetryConfig(errorType: MediaProviderErrorType): {
        maxRetries: number;
        baseDelay: number;
        maxDelay: number;
        backoffMultiplier: number;
        jitter: boolean;
    } {
        const strategy = this.recoveryStrategies.get(errorType);
        return (
            strategy?.retryConfig || {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 30000,
                backoffMultiplier: 2,
                jitter: true,
            }
        );
    }

    /**
     * Check if error matches any known patterns
     */
    detectErrorPatterns(errors: MediaProviderError[]): ErrorPattern[] {
        const detectedPatterns: ErrorPattern[] = [];

        for (const pattern of this.errorPatterns.values()) {
            if (this.matchesPattern(errors, pattern)) {
                detectedPatterns.push(pattern);
            }
        }

        return detectedPatterns.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    // Private methods

    private initializeErrorCategories(): void {
        // Network errors
        this.errorCategories.set(MediaProviderErrorType.NETWORK_ERROR, {
            type: MediaProviderErrorType.NETWORK_ERROR,
            severity: 'medium',
            isRetryable: true,
            defaultRetryDelay: 2000,
            maxRetries: 3,
            userMessage:
                'Connection issue with {provider}. Retrying automatically...',
            technicalMessage: 'Network connectivity issue detected',
            recoveryActions: [
                'Check your internet connection',
                'Try refreshing the page',
                'Switch to a different network if available',
            ],
            preventionTips: [
                'Ensure stable internet connection',
                'Consider using a VPN if experiencing regional issues',
            ],
        });

        // Rate limit errors
        this.errorCategories.set(MediaProviderErrorType.RATE_LIMIT_EXCEEDED, {
            type: MediaProviderErrorType.RATE_LIMIT_EXCEEDED,
            severity: 'medium',
            isRetryable: true,
            defaultRetryDelay: 3600000, // 1 hour
            maxRetries: 1,
            userMessage:
                '{provider} usage limit reached. Using other sources...',
            technicalMessage: 'API rate limit exceeded',
            recoveryActions: [
                'Results will continue from other providers',
                'Service will be available again shortly',
            ],
            preventionTips: [
                'Distribute searches across multiple providers',
                'Implement request caching to reduce API calls',
            ],
        });

        // Authentication errors
        this.errorCategories.set(MediaProviderErrorType.API_KEY_INVALID, {
            type: MediaProviderErrorType.API_KEY_INVALID,
            severity: 'critical',
            isRetryable: false,
            defaultRetryDelay: 0,
            maxRetries: 0,
            userMessage:
                '{provider} configuration issue. Using other sources...',
            technicalMessage: 'API key invalid or expired',
            recoveryActions: [
                'Results will continue from other providers',
                'Contact administrator to check API configuration',
            ],
            preventionTips: [
                'Regularly verify API key validity',
                'Set up monitoring for API key expiration',
                'Use environment-specific API keys',
            ],
        });

        // Provider unavailable
        this.errorCategories.set(MediaProviderErrorType.PROVIDER_UNAVAILABLE, {
            type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
            severity: 'high',
            isRetryable: true,
            defaultRetryDelay: 300000, // 5 minutes
            maxRetries: 2,
            userMessage:
                '{provider} is temporarily unavailable. Using other sources...',
            technicalMessage: 'Provider service is down or unreachable',
            recoveryActions: [
                'Results will continue from other providers',
                'Service will be restored automatically',
            ],
            preventionTips: [
                'Monitor provider status pages',
                'Implement health checks for early detection',
            ],
        });

        // Search failures
        this.errorCategories.set(MediaProviderErrorType.SEARCH_FAILED, {
            type: MediaProviderErrorType.SEARCH_FAILED,
            severity: 'medium',
            isRetryable: true,
            defaultRetryDelay: 5000,
            maxRetries: 2,
            userMessage: 'Search encountered an issue. Retrying...',
            technicalMessage: 'Search operation failed',
            recoveryActions: [
                'Try different search terms',
                'Simplify your search query',
                'Try again in a few moments',
            ],
            preventionTips: [
                'Validate search queries before sending',
                'Implement query sanitization',
            ],
        });

        // Download failures
        this.errorCategories.set(MediaProviderErrorType.DOWNLOAD_FAILED, {
            type: MediaProviderErrorType.DOWNLOAD_FAILED,
            severity: 'high',
            isRetryable: true,
            defaultRetryDelay: 3000,
            maxRetries: 2,
            userMessage:
                'Failed to download selected media. Please try different images.',
            technicalMessage: 'Media download operation failed',
            recoveryActions: [
                'Try selecting different images',
                'Check your internet connection',
                'Try again in a few minutes',
            ],
            preventionTips: [
                'Verify download URLs before attempting download',
                'Implement download progress monitoring',
            ],
        });
    }

    private initializeRecoveryStrategies(): void {
        // Network error strategy
        this.recoveryStrategies.set(MediaProviderErrorType.NETWORK_ERROR, {
            strategy: 'exponential_backoff',
            retryConfig: {
                maxRetries: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                backoffMultiplier: 2,
                jitter: true,
            },
            userNotification: {
                title: 'Connection Issue',
                message:
                    'Experiencing network connectivity issues. Retrying automatically...',
                actions: [
                    { label: 'Retry Now', action: 'retry' },
                    { label: 'Dismiss', action: 'dismiss' },
                ],
            },
        });

        // Rate limit strategy
        this.recoveryStrategies.set(
            MediaProviderErrorType.RATE_LIMIT_EXCEEDED,
            {
                strategy: 'disable_temporarily',
                disableDuration: 3600000, // 1 hour
                fallbackOptions: ['other_providers'],
                userNotification: {
                    title: 'Usage Limit Reached',
                    message:
                        'Service temporarily unavailable due to usage limits. Using other sources...',
                    actions: [{ label: 'OK', action: 'dismiss' }],
                },
            }
        );

        // API key invalid strategy
        this.recoveryStrategies.set(MediaProviderErrorType.API_KEY_INVALID, {
            strategy: 'manual_intervention',
            fallbackOptions: ['other_providers'],
            userNotification: {
                title: 'Configuration Issue',
                message:
                    'Service configuration needs attention. Using other sources...',
                actions: [
                    {
                        label: 'Help',
                        action: 'contact_support',
                        url: '/help/api-configuration',
                    },
                    { label: 'Dismiss', action: 'dismiss' },
                ],
            },
        });

        // Provider unavailable strategy
        this.recoveryStrategies.set(
            MediaProviderErrorType.PROVIDER_UNAVAILABLE,
            {
                strategy: 'circuit_breaker',
                retryConfig: {
                    maxRetries: 2,
                    baseDelay: 300000, // 5 minutes
                    maxDelay: 1800000, // 30 minutes
                    backoffMultiplier: 2,
                    jitter: false,
                },
                fallbackOptions: ['other_providers'],
                userNotification: {
                    title: 'Service Unavailable',
                    message:
                        'Service is temporarily down. Using other sources...',
                    actions: [{ label: 'OK', action: 'dismiss' }],
                },
            }
        );

        // Search failed strategy
        this.recoveryStrategies.set(MediaProviderErrorType.SEARCH_FAILED, {
            strategy: 'immediate_retry',
            retryConfig: {
                maxRetries: 2,
                baseDelay: 2000,
                maxDelay: 8000,
                backoffMultiplier: 2,
                jitter: true,
            },
            userNotification: {
                title: 'Search Issue',
                message: 'Search encountered an issue. Retrying...',
                actions: [
                    { label: 'Try Different Terms', action: 'dismiss' },
                    { label: 'Retry', action: 'retry' },
                ],
            },
        });

        // Download failed strategy
        this.recoveryStrategies.set(MediaProviderErrorType.DOWNLOAD_FAILED, {
            strategy: 'exponential_backoff',
            retryConfig: {
                maxRetries: 2,
                baseDelay: 3000,
                maxDelay: 12000,
                backoffMultiplier: 2,
                jitter: true,
            },
            userNotification: {
                title: 'Download Failed',
                message:
                    'Failed to download selected media. Please try different images.',
                actions: [
                    { label: 'Try Different Image', action: 'dismiss' },
                    { label: 'Retry Download', action: 'retry' },
                ],
            },
        });
    }

    private initializeErrorPatterns(): void {
        // Multiple provider failure pattern
        this.errorPatterns.set('multi-provider-failure', {
            id: 'multi-provider-failure',
            name: 'Multiple Provider Failure',
            description:
                'Multiple providers experiencing similar issues simultaneously',
            conditions: [
                {
                    errorType: MediaProviderErrorType.NETWORK_ERROR,
                    frequency: 3,
                    timeWindow: 10,
                    providers: undefined, // Any providers
                },
            ],
            severity: 'critical',
            autoActions: ['enable_offline_mode', 'notify_admin'],
            alertThreshold: 3,
        });

        // Cascading authentication failures
        this.errorPatterns.set('auth-cascade', {
            id: 'auth-cascade',
            name: 'Authentication Cascade Failure',
            description: 'Multiple authentication failures across providers',
            conditions: [
                {
                    errorType: MediaProviderErrorType.API_KEY_INVALID,
                    frequency: 2,
                    timeWindow: 5,
                    providers: undefined,
                },
            ],
            severity: 'critical',
            autoActions: ['disable_affected_providers', 'notify_admin'],
            alertThreshold: 2,
        });

        // Rate limit storm
        this.errorPatterns.set('rate-limit-storm', {
            id: 'rate-limit-storm',
            name: 'Rate Limit Storm',
            description: 'Rapid rate limit hits across multiple providers',
            conditions: [
                {
                    errorType: MediaProviderErrorType.RATE_LIMIT_EXCEEDED,
                    frequency: 3,
                    timeWindow: 15,
                    providers: undefined,
                },
            ],
            severity: 'high',
            autoActions: ['throttle_requests', 'enable_caching'],
            alertThreshold: 3,
        });

        // Provider instability
        this.errorPatterns.set('provider-instability', {
            id: 'provider-instability',
            name: 'Provider Instability',
            description:
                'Single provider experiencing frequent intermittent issues',
            conditions: [
                {
                    errorType: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                    frequency: 5,
                    timeWindow: 30,
                    providers: undefined,
                },
            ],
            severity: 'medium',
            autoActions: [
                'reduce_provider_priority',
                'increase_health_check_frequency',
            ],
            alertThreshold: 5,
        });
    }

    private enhanceError(
        error: unknown,
        context: {
            providerId: string;
            operation: string;
            retryAttempt?: number;
            previousErrors?: MediaProviderError[];
        }
    ): MediaProviderError {
        if (error instanceof Error) {
            const errorType = this.detectErrorType(error);
            return {
                type: errorType,
                providerId: context.providerId,
                message: this.enhanceErrorMessage(
                    error.message,
                    errorType,
                    context
                ),
                details: {
                    originalError: error.message,
                    stack: error.stack?.split('\n').slice(0, 5),
                    context,
                    timestamp: Date.now(),
                    userAgent:
                        typeof window !== 'undefined'
                            ? navigator.userAgent
                            : undefined,
                },
            };
        }

        return {
            type: MediaProviderErrorType.SEARCH_FAILED,
            providerId: context.providerId,
            message: 'Unknown error occurred',
            details: {
                error: String(error),
                context,
                timestamp: Date.now(),
            },
        };
    }

    private detectErrorType(error: Error): MediaProviderErrorType {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';

        // Network errors
        if (this.isNetworkError(message, stack)) {
            return MediaProviderErrorType.NETWORK_ERROR;
        }

        // Rate limit errors
        if (this.isRateLimitError(message)) {
            return MediaProviderErrorType.RATE_LIMIT_EXCEEDED;
        }

        // Authentication errors
        if (this.isAuthError(message)) {
            return MediaProviderErrorType.API_KEY_INVALID;
        }

        // Server errors
        if (this.isServerError(message)) {
            return MediaProviderErrorType.PROVIDER_UNAVAILABLE;
        }

        // Download errors
        if (this.isDownloadError(message)) {
            return MediaProviderErrorType.DOWNLOAD_FAILED;
        }

        return MediaProviderErrorType.SEARCH_FAILED;
    }

    private isNetworkError(message: string, stack: string): boolean {
        const networkKeywords = [
            'fetch',
            'network',
            'connection',
            'timeout',
            'cors',
            'net::',
            'enotfound',
            'econnrefused',
            'etimedout',
        ];
        return networkKeywords.some(
            (keyword) => message.includes(keyword) || stack.includes(keyword)
        );
    }

    private isRateLimitError(message: string): boolean {
        return (
            message.includes('429') ||
            message.includes('rate limit') ||
            message.includes('too many requests')
        );
    }

    private isAuthError(message: string): boolean {
        return (
            message.includes('401') ||
            message.includes('403') ||
            message.includes('unauthorized') ||
            message.includes('forbidden') ||
            message.includes('invalid api key')
        );
    }

    private isServerError(message: string): boolean {
        return (
            /5\d\d/.test(message) ||
            message.includes('server error') ||
            message.includes('internal error') ||
            message.includes('service unavailable')
        );
    }

    private isDownloadError(message: string): boolean {
        return (
            message.includes('download') &&
            (message.includes('failed') || message.includes('error'))
        );
    }

    private enhanceErrorMessage(
        originalMessage: string,
        errorType: MediaProviderErrorType,
        context: {
            providerId: string;
            operation: string;
            retryAttempt?: number;
        }
    ): string {
        const category = this.errorCategories.get(errorType);
        if (!category) {
            return originalMessage;
        }

        let enhancedMessage = category.technicalMessage;

        if (context.retryAttempt && context.retryAttempt > 0) {
            enhancedMessage += ` (Retry attempt ${context.retryAttempt})`;
        }

        return enhancedMessage;
    }

    private getErrorCategory(errorType: MediaProviderErrorType): ErrorCategory {
        return (
            this.errorCategories.get(errorType) || {
                type: errorType,
                severity: 'medium',
                isRetryable: true,
                defaultRetryDelay: 5000,
                maxRetries: 2,
                userMessage: 'An error occurred. Please try again.',
                technicalMessage: 'Unknown error',
                recoveryActions: [
                    'Try again',
                    'Contact support if this persists',
                ],
                preventionTips: [],
            }
        );
    }

    private getRecoveryStrategy(
        error: MediaProviderError,
        context: {
            retryAttempt?: number;
            previousErrors?: MediaProviderError[];
        }
    ): ErrorRecoveryStrategy {
        const baseStrategy = this.recoveryStrategies.get(error.type);
        if (!baseStrategy) {
            return {
                strategy: 'immediate_retry',
                retryConfig: {
                    maxRetries: 2,
                    baseDelay: 2000,
                    maxDelay: 8000,
                    backoffMultiplier: 2,
                    jitter: true,
                },
                userNotification: {
                    title: 'Error',
                    message: 'An error occurred. Please try again.',
                    actions: [{ label: 'Retry', action: 'retry' }],
                },
            };
        }

        // Adjust strategy based on context
        if (
            context.retryAttempt &&
            context.retryAttempt >= (baseStrategy.retryConfig?.maxRetries || 0)
        ) {
            return {
                ...baseStrategy,
                strategy: 'manual_intervention',
                userNotification: {
                    ...baseStrategy.userNotification,
                    message:
                        'Multiple retry attempts failed. Manual intervention may be required.',
                },
            };
        }

        return baseStrategy;
    }

    private getErrorTitle(errorType: MediaProviderErrorType): string {
        switch (errorType) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'Connection Issue';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 'Usage Limit Reached';
            case MediaProviderErrorType.API_KEY_INVALID:
                return 'Configuration Issue';
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 'Service Unavailable';
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'Download Failed';
            case MediaProviderErrorType.SEARCH_FAILED:
                return 'Search Issue';
            default:
                return 'Error';
        }
    }

    private matchesPattern(
        errors: MediaProviderError[],
        pattern: ErrorPattern
    ): boolean {
        const now = Date.now();

        for (const condition of pattern.conditions) {
            const timeWindowMs = condition.timeWindow * 60 * 1000;
            const relevantErrors = errors.filter((error) => {
                const isCorrectType = error.type === condition.errorType;
                const isWithinTimeWindow =
                    now - (error.details?.timestamp || 0) < timeWindowMs;
                const isCorrectProvider =
                    !condition.providers ||
                    condition.providers.includes(error.providerId);

                return isCorrectType && isWithinTimeWindow && isCorrectProvider;
            });

            if (relevantErrors.length < condition.frequency) {
                return false;
            }
        }

        return true;
    }
}

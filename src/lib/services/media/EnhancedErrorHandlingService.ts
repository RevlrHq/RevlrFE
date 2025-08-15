import {
    MediaProviderError,
    MediaProviderErrorType,
} from '@/types/media-search';
import {
    ErrorCategorizationService,
    ErrorRecoveryStrategy,
} from './ErrorCategorizationService';
import { ProviderHealthStatusService } from './ProviderHealthStatusService';
import { ErrorLoggingService } from './ErrorLoggingService';
import { ErrorNotificationService } from './ErrorNotificationService';

export interface EnhancedErrorContext {
    operation: string;
    providerId: string;
    query?: string;
    timestamp: number;
    userAgent?: string;
    networkStatus?: 'online' | 'offline' | 'slow';
    retryAttempt?: number;
    previousErrors?: MediaProviderError[];
    sessionId?: string;
    userId?: string;
}

export interface ErrorHandlingResult {
    shouldRetry: boolean;
    retryDelay?: number;
    fallbackProviders?: string[];
    userNotification?: {
        title: string;
        message: string;
        actions: Array<{
            label: string;
            action: 'retry' | 'configure' | 'contact_support' | 'dismiss';
            url?: string;
        }>;
    };
    providerAction:
        | 'continue'
        | 'disable_temporarily'
        | 'disable_permanently'
        | 'circuit_break';
    disableDuration?: number;
    metadata?: Record<string, any>;
}

export interface CircuitBreakerState {
    providerId: string;
    state: 'closed' | 'open' | 'half_open';
    failureCount: number;
    lastFailureTime: number;
    nextRetryTime: number;
    successCount: number;
}

/**
 * Enhanced error handling service with comprehensive categorization and recovery
 */
export class EnhancedErrorHandlingService {
    private categorizationService: ErrorCategorizationService;
    private healthStatusService: ProviderHealthStatusService;
    private loggingService: ErrorLoggingService;
    private notificationService: ErrorNotificationService;
    private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
    private retryAttempts: Map<string, number> = new Map();

    constructor(
        categorizationService?: ErrorCategorizationService,
        healthStatusService?: ProviderHealthStatusService,
        loggingService?: ErrorLoggingService,
        notificationService?: ErrorNotificationService
    ) {
        this.categorizationService =
            categorizationService || new ErrorCategorizationService();
        this.healthStatusService =
            healthStatusService || new ProviderHealthStatusService();
        this.loggingService = loggingService || new ErrorLoggingService();
        this.notificationService =
            notificationService || new ErrorNotificationService();
    }

    /**
     * Handle error with comprehensive categorization and recovery
     */
    async handleError(
        error: unknown,
        context: EnhancedErrorContext
    ): Promise<ErrorHandlingResult> {
        // Categorize the error
        const { category, strategy, enhancedError } =
            this.categorizationService.categorizeError(error, context);

        // Log the error
        this.loggingService.logError(
            enhancedError,
            context,
            category.severity === 'critical' ? 'error' : 'warn',
            {
                category: category.type,
                strategy: strategy.strategy,
                retryAttempt: context.retryAttempt || 0,
            }
        );

        // Update provider health
        this.healthStatusService.recordFailure(
            context.providerId,
            enhancedError
        );

        // Check circuit breaker
        const circuitBreakerResult = this.checkCircuitBreaker(
            context.providerId,
            enhancedError
        );
        if (circuitBreakerResult.shouldBreak) {
            return this.handleCircuitBreakerOpen(
                context.providerId,
                enhancedError,
                strategy
            );
        }

        // Determine recovery action
        const result = await this.determineRecoveryAction(
            enhancedError,
            context,
            category,
            strategy
        );

        // Create user notification if needed
        if (result.userNotification) {
            const notification =
                this.notificationService.createErrorNotification(
                    enhancedError,
                    {
                        action: result.providerAction,
                        message: result.userNotification.message,
                        userMessage: result.userNotification.message,
                        severity: category.severity,
                        actionableSteps: result.userNotification.actions.map(
                            (a) => a.label
                        ),
                    },
                    {
                        canRetry: result.shouldRetry,
                        onRetry: () => this.handleRetry(context),
                    }
                );
            this.notificationService.showNotification(notification);
        }

        return result;
    }

    /**
     * Execute operation with retry logic and error handling
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        context: EnhancedErrorContext,
        maxRetries: number = 3
    ): Promise<T> {
        let lastError: Error;
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                const result = await operation();

                // Record success
                this.healthStatusService.recordSuccess(
                    context.providerId,
                    Date.now() - context.timestamp
                );
                this.resetCircuitBreaker(context.providerId);

                return result;
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));
                attempt++;

                if (attempt > maxRetries) {
                    break;
                }

                // Handle the error and determine if we should retry
                const errorContext = { ...context, retryAttempt: attempt };
                const result = await this.handleError(error, errorContext);

                if (!result.shouldRetry) {
                    throw lastError;
                }

                // Wait before retrying
                if (result.retryDelay) {
                    await this.sleep(result.retryDelay);
                }
            }
        }

        throw lastError!;
    }

    /**
     * Get current circuit breaker states
     */
    getCircuitBreakerStates(): CircuitBreakerState[] {
        return Array.from(this.circuitBreakers.values());
    }

    /**
     * Get provider health summary
     */
    getProviderHealthSummary() {
        return this.healthStatusService.getHealthSummary();
    }

    /**
     * Get current error patterns
     */
    getErrorPatterns() {
        const recentErrors = this.loggingService
            .getLogs({
                startTime: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
                limit: 1000,
            })
            .map((log) => log.error);

        return this.categorizationService.detectErrorPatterns(recentErrors);
    }

    /**
     * Get recommendations for improving system health
     */
    getRecommendations() {
        return this.healthStatusService.getRecommendations();
    }

    /**
     * Reset circuit breaker for a provider
     */
    resetCircuitBreaker(providerId: string): void {
        const breaker = this.circuitBreakers.get(providerId);
        if (breaker) {
            breaker.state = 'closed';
            breaker.failureCount = 0;
            breaker.successCount++;
        }
    }

    /**
     * Manually disable a provider
     */
    disableProvider(
        providerId: string,
        reason: string,
        duration?: number
    ): void {
        this.healthStatusService.disableProvider(providerId, reason, duration);

        // Set circuit breaker to open
        this.circuitBreakers.set(providerId, {
            providerId,
            state: 'open',
            failureCount: 0,
            lastFailureTime: Date.now(),
            nextRetryTime: Date.now() + (duration || 3600000), // Default 1 hour
            successCount: 0,
        });
    }

    /**
     * Manually enable a provider
     */
    enableProvider(providerId: string): void {
        this.healthStatusService.enableProvider(providerId);
        this.resetCircuitBreaker(providerId);
    }

    // Private methods

    private async determineRecoveryAction(
        error: MediaProviderError,
        context: EnhancedErrorContext,
        category: any,
        strategy: ErrorRecoveryStrategy
    ): Promise<ErrorHandlingResult> {
        const result: ErrorHandlingResult = {
            shouldRetry: false,
            providerAction: 'continue',
        };

        switch (strategy.strategy) {
            case 'immediate_retry':
                result.shouldRetry =
                    (context.retryAttempt || 0) <
                    (strategy.retryConfig?.maxRetries || 2);
                result.retryDelay = strategy.retryConfig?.baseDelay || 1000;
                break;

            case 'exponential_backoff':
                const maxRetries = strategy.retryConfig?.maxRetries || 3;
                const shouldRetry = (context.retryAttempt || 0) < maxRetries;

                if (shouldRetry) {
                    const baseDelay = strategy.retryConfig?.baseDelay || 1000;
                    const backoffMultiplier =
                        strategy.retryConfig?.backoffMultiplier || 2;
                    const attempt = context.retryAttempt || 0;

                    result.shouldRetry = true;
                    result.retryDelay = Math.min(
                        baseDelay * Math.pow(backoffMultiplier, attempt),
                        strategy.retryConfig?.maxDelay || 30000
                    );

                    // Add jitter if enabled
                    if (strategy.retryConfig?.jitter) {
                        result.retryDelay *= 0.5 + Math.random() * 0.5;
                    }
                }
                break;

            case 'circuit_breaker':
                result.providerAction = 'circuit_break';
                result.fallbackProviders = strategy.fallbackOptions;
                break;

            case 'fallback_provider':
                result.fallbackProviders = strategy.fallbackOptions;
                break;

            case 'disable_temporarily':
                result.providerAction = 'disable_temporarily';
                result.disableDuration = strategy.disableDuration || 3600000; // 1 hour default
                result.fallbackProviders = strategy.fallbackOptions;
                break;

            case 'manual_intervention':
                result.providerAction = 'disable_permanently';
                result.fallbackProviders = strategy.fallbackOptions;
                break;
        }

        // Add user notification
        result.userNotification = strategy.userNotification;

        // Add metadata
        result.metadata = {
            errorType: error.type,
            category: category.type,
            strategy: strategy.strategy,
            severity: category.severity,
            timestamp: Date.now(),
        };

        return result;
    }

    private checkCircuitBreaker(
        providerId: string,
        error: MediaProviderError
    ): {
        shouldBreak: boolean;
        state: 'closed' | 'open' | 'half_open';
    } {
        let breaker = this.circuitBreakers.get(providerId);

        if (!breaker) {
            breaker = {
                providerId,
                state: 'closed',
                failureCount: 0,
                lastFailureTime: 0,
                nextRetryTime: 0,
                successCount: 0,
            };
            this.circuitBreakers.set(providerId, breaker);
        }

        const now = Date.now();

        // Check if we should transition from open to half-open
        if (breaker.state === 'open' && now >= breaker.nextRetryTime) {
            breaker.state = 'half_open';
            breaker.successCount = 0;
        }

        // Record failure
        breaker.failureCount++;
        breaker.lastFailureTime = now;

        // Determine if circuit should break
        const shouldTriggerBreaker =
            this.categorizationService.shouldTriggerCircuitBreaker(
                error.type,
                this.getRecentErrors(providerId)
            );

        if (shouldTriggerBreaker && breaker.state === 'closed') {
            breaker.state = 'open';
            breaker.nextRetryTime =
                now + this.getCircuitBreakerTimeout(error.type);
            return { shouldBreak: true, state: 'open' };
        }

        if (breaker.state === 'half_open') {
            // If we're in half-open and get another failure, go back to open
            breaker.state = 'open';
            breaker.nextRetryTime =
                now + this.getCircuitBreakerTimeout(error.type);
            return { shouldBreak: true, state: 'open' };
        }

        return { shouldBreak: breaker.state === 'open', state: breaker.state };
    }

    private handleCircuitBreakerOpen(
        providerId: string,
        error: MediaProviderError,
        strategy: ErrorRecoveryStrategy
    ): ErrorHandlingResult {
        return {
            shouldRetry: false,
            providerAction: 'circuit_break',
            fallbackProviders: strategy.fallbackOptions,
            userNotification: {
                title: 'Service Temporarily Unavailable',
                message: `${providerId} is temporarily disabled due to repeated failures. Using alternative sources...`,
                actions: [{ label: 'OK', action: 'dismiss' }],
            },
            metadata: {
                circuitBreakerState: 'open',
                errorType: error.type,
                timestamp: Date.now(),
            },
        };
    }

    private getRecentErrors(providerId: string): MediaProviderError[] {
        const recentLogs = this.loggingService.getLogs({
            providerId,
            startTime: Date.now() - 5 * 60 * 1000, // Last 5 minutes
            limit: 50,
        });

        return recentLogs.map((log) => log.error);
    }

    private getCircuitBreakerTimeout(
        errorType: MediaProviderErrorType
    ): number {
        switch (errorType) {
            case MediaProviderErrorType.API_KEY_INVALID:
                return 24 * 60 * 60 * 1000; // 24 hours
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 60 * 60 * 1000; // 1 hour
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 30 * 60 * 1000; // 30 minutes
            case MediaProviderErrorType.NETWORK_ERROR:
                return 5 * 60 * 1000; // 5 minutes
            default:
                return 10 * 60 * 1000; // 10 minutes
        }
    }

    private handleRetry(context: EnhancedErrorContext): void {
        // This would trigger a retry of the original operation
        // Implementation depends on the specific use case
        console.log('Retry requested for:', context);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

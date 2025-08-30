import {
    InitializationResult,
    ProviderInitializationError,
} from './MediaProviderInitializer';

/**
 * Categories of initialization errors
 */
export enum InitializationErrorCategory {
    CONFIGURATION = 'configuration',
    NETWORK = 'network',
    AUTHENTICATION = 'authentication',
    SYSTEM = 'system',
    UNKNOWN = 'unknown',
}

/**
 * Severity levels for initialization errors
 */
export enum InitializationErrorSeverity {
    CRITICAL = 'critical', // Application cannot function
    HIGH = 'high', // Major functionality impacted
    MEDIUM = 'medium', // Some functionality impacted
    LOW = 'low', // Minor issues, warnings
}

/**
 * Detailed error information with context and recommendations
 */
export interface DetailedInitializationError {
    providerId: string;
    category: InitializationErrorCategory;
    severity: InitializationErrorSeverity;
    error: string;
    originalError?: Error;
    context: Record<string, any>;
    recommendations: string[];
    canRetry: boolean;
    retryDelay?: number;
    timestamp: number;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableDetailedLogging: boolean;
    enableUserFriendlyMessages: boolean;
    continueOnPartialFailure: boolean;
    maxRetryAttempts: number;
    retryDelayMs: number;
}

/**
 * Service for handling media provider initialization errors
 */
export class InitializationErrorHandler {
    private static instance: InitializationErrorHandler;
    private config: ErrorHandlingConfig;
    private errorHistory: DetailedInitializationError[] = [];
    private readonly maxHistorySize = 100;

    private constructor(config?: Partial<ErrorHandlingConfig>) {
        this.config = {
            logLevel: 'info',
            enableDetailedLogging: true,
            enableUserFriendlyMessages: true,
            continueOnPartialFailure: true,
            maxRetryAttempts: 3,
            retryDelayMs: 5000,
            ...config,
        };
    }

    static getInstance(
        config?: Partial<ErrorHandlingConfig>
    ): InitializationErrorHandler {
        if (!InitializationErrorHandler.instance) {
            InitializationErrorHandler.instance =
                new InitializationErrorHandler(config);
        }
        return InitializationErrorHandler.instance;
    }

    /**
     * Process and categorize initialization errors
     */
    processInitializationResult(result: InitializationResult): {
        processedErrors: DetailedInitializationError[];
        shouldContinue: boolean;
        recommendations: string[];
    } {
        const processedErrors: DetailedInitializationError[] = [];
        const recommendations: string[] = [];

        // Process failed providers
        for (const error of result.failedProviders) {
            const detailedError = this.categorizeError(error);
            processedErrors.push(detailedError);
            this.recordError(detailedError);

            // Log the error
            this.logError(detailedError);

            // Add recommendations
            recommendations.push(...detailedError.recommendations);
        }

        // Determine if application should continue
        const shouldContinue = this.shouldContinueAfterErrors(
            processedErrors,
            result
        );

        // Add general recommendations
        if (result.initializedProviders.length === 0) {
            recommendations.push(
                'No media providers are available. Check your API key configuration.',
                'Verify network connectivity to provider APIs.',
                'Consider using a different provider as a fallback.'
            );
        } else if (
            result.initializedProviders.length < result.failedProviders.length
        ) {
            recommendations.push(
                'Some providers failed to initialize. The application will continue with available providers.',
                'Monitor provider health and consider fixing failed providers for better reliability.'
            );
        }

        return {
            processedErrors,
            shouldContinue,
            recommendations: Array.from(new Set(recommendations)), // Remove duplicates
        };
    }

    /**
     * Categorize and enrich error information
     */
    private categorizeError(
        error: ProviderInitializationError
    ): DetailedInitializationError {
        const category = this.determineErrorCategory(error);
        const severity = this.determineErrorSeverity(error, category);
        const context = this.buildErrorContext(error);
        const recommendations = this.generateRecommendations(error, category);

        return {
            providerId: error.providerId,
            category,
            severity,
            error: error.error,
            context,
            recommendations,
            canRetry: error.canRetry,
            retryDelay: this.calculateRetryDelay(category),
            timestamp: Date.now(),
        };
    }

    /**
     * Determine error category based on error details
     */
    private determineErrorCategory(
        error: ProviderInitializationError
    ): InitializationErrorCategory {
        const errorMessage = error.error.toLowerCase();
        const reason = error.reason;

        if (
            reason === 'missing_api_key' ||
            errorMessage.includes('api key') ||
            errorMessage.includes('authentication')
        ) {
            return InitializationErrorCategory.AUTHENTICATION;
        }

        if (
            reason === 'invalid_config' ||
            errorMessage.includes('configuration') ||
            errorMessage.includes('config')
        ) {
            return InitializationErrorCategory.CONFIGURATION;
        }

        if (
            reason === 'network_error' ||
            errorMessage.includes('network') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('timeout')
        ) {
            return InitializationErrorCategory.NETWORK;
        }

        if (
            errorMessage.includes('system') ||
            errorMessage.includes('internal')
        ) {
            return InitializationErrorCategory.SYSTEM;
        }

        return InitializationErrorCategory.UNKNOWN;
    }

    /**
     * Determine error severity
     */
    private determineErrorSeverity(
        error: ProviderInitializationError,
        category: InitializationErrorCategory
    ): InitializationErrorSeverity {
        // System errors are always critical
        if (category === InitializationErrorCategory.SYSTEM) {
            return InitializationErrorSeverity.CRITICAL;
        }

        // Configuration errors are high severity
        if (category === InitializationErrorCategory.CONFIGURATION) {
            return InitializationErrorSeverity.HIGH;
        }

        // Authentication errors are high severity
        if (category === InitializationErrorCategory.AUTHENTICATION) {
            return InitializationErrorSeverity.HIGH;
        }

        // Network errors are medium severity (might be temporary)
        if (category === InitializationErrorCategory.NETWORK) {
            return InitializationErrorSeverity.MEDIUM;
        }

        // Unknown errors are medium severity
        return InitializationErrorSeverity.MEDIUM;
    }

    /**
     * Build error context for debugging
     */
    private buildErrorContext(
        error: ProviderInitializationError
    ): Record<string, any> {
        return {
            providerId: error.providerId,
            reason: error.reason,
            canRetry: error.canRetry,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown',
            userAgent:
                typeof window !== 'undefined'
                    ? window.navigator?.userAgent
                    : 'server',
        };
    }

    /**
     * Generate specific recommendations based on error type
     */
    private generateRecommendations(
        error: ProviderInitializationError,
        category: InitializationErrorCategory
    ): string[] {
        const recommendations: string[] = [];

        switch (category) {
            case InitializationErrorCategory.AUTHENTICATION:
                recommendations.push(
                    `Verify that the API key for ${error.providerId} is correct and active`,
                    `Check if the API key has the required permissions`,
                    `Ensure the API key is properly set in environment variables`
                );
                if (error.providerId === 'unsplash') {
                    recommendations.push(
                        'For Unsplash, verify both access key and secret key are configured',
                        'Check that the redirect URI matches your application URL'
                    );
                }
                break;

            case InitializationErrorCategory.CONFIGURATION:
                recommendations.push(
                    `Review the configuration for ${error.providerId}`,
                    'Check environment variable names and values',
                    'Verify that all required configuration fields are provided'
                );
                break;

            case InitializationErrorCategory.NETWORK:
                recommendations.push(
                    'Check internet connectivity',
                    `Verify that ${error.providerId} API endpoints are accessible`,
                    'Check for firewall or proxy issues',
                    'Consider retrying the initialization'
                );
                break;

            case InitializationErrorCategory.SYSTEM:
                recommendations.push(
                    'Check application logs for more details',
                    'Verify system resources and permissions',
                    'Contact support if the issue persists'
                );
                break;

            default:
                recommendations.push(
                    'Check the error message for specific details',
                    'Review the provider documentation',
                    'Consider retrying the initialization'
                );
        }

        return recommendations;
    }

    /**
     * Calculate retry delay based on error category
     */
    private calculateRetryDelay(category: InitializationErrorCategory): number {
        switch (category) {
            case InitializationErrorCategory.NETWORK:
                return 10000; // 10 seconds for network issues
            case InitializationErrorCategory.AUTHENTICATION:
                return 0; // No automatic retry for auth issues
            case InitializationErrorCategory.CONFIGURATION:
                return 0; // No automatic retry for config issues
            case InitializationErrorCategory.SYSTEM:
                return 30000; // 30 seconds for system issues
            default:
                return this.config.retryDelayMs;
        }
    }

    /**
     * Determine if application should continue after errors
     */
    private shouldContinueAfterErrors(
        errors: DetailedInitializationError[],
        result: InitializationResult
    ): boolean {
        // If configured to not continue on partial failure
        if (!this.config.continueOnPartialFailure) {
            return errors.length === 0;
        }

        // Continue if at least one provider is available
        if (result.initializedProviders.length > 0) {
            return true;
        }

        // Don't continue if all errors are critical
        const criticalErrors = errors.filter(
            (e) => e.severity === InitializationErrorSeverity.CRITICAL
        );
        if (criticalErrors.length === errors.length && errors.length > 0) {
            return false;
        }

        // Continue if errors might be temporary (network issues)
        const temporaryErrors = errors.filter(
            (e) =>
                e.category === InitializationErrorCategory.NETWORK && e.canRetry
        );

        return temporaryErrors.length > 0;
    }

    /**
     * Log error with appropriate level
     */
    private logError(error: DetailedInitializationError): void {
        const logMessage = this.formatLogMessage(error);

        switch (error.severity) {
            case InitializationErrorSeverity.CRITICAL:
                console.debug(logMessage);
                break;
            case InitializationErrorSeverity.HIGH:
                console.debug(logMessage);
                break;
            case InitializationErrorSeverity.MEDIUM:
                console.warn(logMessage);
                break;
            case InitializationErrorSeverity.LOW:
                console.info(logMessage);
                break;
        }

        // Log detailed context if enabled
        if (this.config.enableDetailedLogging) {
            console.debug('Error context:', error.context);
            console.debug('Recommendations:', error.recommendations);
        }
    }

    /**
     * Format log message
     */
    private formatLogMessage(error: DetailedInitializationError): string {
        const timestamp = new Date(error.timestamp).toISOString();
        const prefix = `[${timestamp}] [${error.severity.toUpperCase()}] [${error.category.toUpperCase()}]`;

        return `${prefix} Provider ${error.providerId}: ${error.error}`;
    }

    /**
     * Record error in history
     */
    private recordError(error: DetailedInitializationError): void {
        this.errorHistory.push(error);

        // Keep history size manageable
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.splice(
                0,
                this.errorHistory.length - this.maxHistorySize
            );
        }
    }

    /**
     * Get error history
     */
    getErrorHistory(): DetailedInitializationError[] {
        return [...this.errorHistory];
    }

    /**
     * Get errors by category
     */
    getErrorsByCategory(
        category: InitializationErrorCategory
    ): DetailedInitializationError[] {
        return this.errorHistory.filter((error) => error.category === category);
    }

    /**
     * Get errors by severity
     */
    getErrorsBySeverity(
        severity: InitializationErrorSeverity
    ): DetailedInitializationError[] {
        return this.errorHistory.filter((error) => error.severity === severity);
    }

    /**
     * Get errors for a specific provider
     */
    getErrorsForProvider(providerId: string): DetailedInitializationError[] {
        return this.errorHistory.filter(
            (error) => error.providerId === providerId
        );
    }

    /**
     * Clear error history
     */
    clearErrorHistory(): void {
        this.errorHistory = [];
    }

    /**
     * Generate developer-friendly error summary
     */
    generateDeveloperErrorSummary(): {
        totalErrors: number;
        errorsByCategory: Record<string, number>;
        errorsBySeverity: Record<string, number>;
        topRecommendations: string[];
        recentErrors: DetailedInitializationError[];
    } {
        const errorsByCategory: Record<string, number> = {};
        const errorsBySeverity: Record<string, number> = {};
        const allRecommendations: string[] = [];

        for (const error of this.errorHistory) {
            errorsByCategory[error.category] =
                (errorsByCategory[error.category] || 0) + 1;
            errorsBySeverity[error.severity] =
                (errorsBySeverity[error.severity] || 0) + 1;
            allRecommendations.push(...error.recommendations);
        }

        // Get top recommendations (most frequent)
        const recommendationCounts: Record<string, number> = {};
        for (const rec of allRecommendations) {
            recommendationCounts[rec] = (recommendationCounts[rec] || 0) + 1;
        }

        const topRecommendations = Object.entries(recommendationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([rec]) => rec);

        // Get recent errors (last 10)
        const recentErrors = this.errorHistory.slice(-10);

        return {
            totalErrors: this.errorHistory.length,
            errorsByCategory,
            errorsBySeverity,
            topRecommendations,
            recentErrors,
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Get current configuration
     */
    getConfig(): ErrorHandlingConfig {
        return { ...this.config };
    }
}

import {
    MediaProviderError,
    MediaProviderErrorType,
    ProviderStatus,
} from '@/types/media-search';
import { MediaProvider } from './MediaProvider';

export interface ErrorRecoveryAction {
    action:
        | 'disable_temporarily'
        | 'retry_with_backoff'
        | 'show_error'
        | 'fallback_provider'
        | 'offline_mode';
    duration?: number;
    maxRetries?: number;
    backoffMultiplier?: number;
    message: string;
    userMessage: string;
    actionableSteps?: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}

export interface ErrorContext {
    operation: string;
    providerId?: string;
    query?: string;
    timestamp: number;
    userAgent?: string;
    networkStatus?: 'online' | 'offline' | 'slow';
    retryAttempt?: number;
    previousErrors?: MediaProviderError[];
}

export interface ErrorMetrics {
    errorType: MediaProviderErrorType;
    count: number;
    firstOccurrence: number;
    lastOccurrence: number;
    affectedProviders: string[];
    averageRecoveryTime: number;
    userImpact: 'none' | 'low' | 'medium' | 'high';
}

/**
 * Comprehensive error handling and recovery service for media search operations
 */
export class ErrorHandlingService {
    private errorHistory: Map<string, MediaProviderError[]> = new Map();
    private recoveryActions: Map<string, ErrorRecoveryAction> = new Map();
    private retryAttempts: Map<string, number> = new Map();
    private errorMetrics: Map<MediaProviderErrorType, ErrorMetrics> = new Map();
    private offlineDetector: OfflineDetector;
    private readonly maxErrorHistory = 100;

    constructor() {
        this.offlineDetector = new OfflineDetector();
        this.initializeErrorMetrics();
    }

    /**
     * Handle provider-specific errors with appropriate recovery actions
     */
    handleProviderError(
        error: unknown,
        context: ErrorContext
    ): ErrorRecoveryAction {
        const providerError = this.categorizeError(error, context);
        this.recordError(providerError, context);

        const recoveryAction = this.determineRecoveryAction(
            providerError,
            context
        );
        this.recordRecoveryAction(providerError, recoveryAction);

        // Update error metrics
        this.updateErrorMetrics(providerError);

        return recoveryAction;
    }

    /**
     * Categorize and enhance error information
     */
    private categorizeError(
        error: unknown,
        context: ErrorContext
    ): MediaProviderError {
        let providerError: MediaProviderError;

        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            const stack = error.stack;

            // Network connectivity errors
            if (this.isNetworkError(message, stack)) {
                providerError = {
                    type: MediaProviderErrorType.NETWORK_ERROR,
                    providerId: context.providerId || 'unknown',
                    message: this.getNetworkErrorMessage(message),
                    details: {
                        originalError: error.message,
                        networkStatus: this.offlineDetector.getNetworkStatus(),
                        context,
                        stack: stack?.split('\n').slice(0, 5), // First 5 lines only
                    },
                };
            }
            // Rate limiting errors
            else if (this.isRateLimitError(message)) {
                const retryAfter = this.extractRetryAfter(error.message);
                providerError = {
                    type: MediaProviderErrorType.RATE_LIMIT_EXCEEDED,
                    providerId: context.providerId || 'unknown',
                    message: `Rate limit exceeded for ${context.providerId}`,
                    retryAfter,
                    details: {
                        originalError: error.message,
                        context,
                        estimatedResetTime: Date.now() + retryAfter * 1000,
                    },
                };
            }
            // Authentication/Authorization errors
            else if (this.isAuthError(message)) {
                providerError = {
                    type: MediaProviderErrorType.API_KEY_INVALID,
                    providerId: context.providerId || 'unknown',
                    message: `Authentication failed for ${context.providerId}`,
                    details: {
                        originalError: error.message,
                        context,
                        possibleCauses: [
                            'Invalid API key',
                            'Expired API key',
                            'Insufficient permissions',
                            'API key not configured',
                        ],
                    },
                };
            }
            // Server/Provider unavailable
            else if (this.isServerError(message)) {
                providerError = {
                    type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                    providerId: context.providerId || 'unknown',
                    message: `${context.providerId} is temporarily unavailable`,
                    retryAfter: this.calculateServerErrorRetryDelay(message),
                    details: {
                        originalError: error.message,
                        context,
                        serverStatus: this.extractServerStatus(message),
                    },
                };
            }
            // Download specific errors
            else if (context.operation === 'download') {
                providerError = {
                    type: MediaProviderErrorType.DOWNLOAD_FAILED,
                    providerId: context.providerId || 'unknown',
                    message: `Failed to download media from ${context.providerId}`,
                    details: {
                        originalError: error.message,
                        context,
                        downloadUrl: (error as any).url,
                    },
                };
            }
            // Generic search failures
            else {
                providerError = {
                    type: MediaProviderErrorType.SEARCH_FAILED,
                    providerId: context.providerId || 'unknown',
                    message: `Search failed: ${error.message}`,
                    details: {
                        originalError: error.message,
                        context,
                        stack: stack?.split('\n').slice(0, 3),
                    },
                };
            }
        } else {
            // Non-Error objects
            providerError = {
                type: MediaProviderErrorType.SEARCH_FAILED,
                providerId: context.providerId || 'unknown',
                message: 'Unknown error occurred',
                details: {
                    error: String(error),
                    context,
                    type: typeof error,
                },
            };
        }

        return providerError;
    }

    /**
     * Determine appropriate recovery action based on error type and context
     */
    private determineRecoveryAction(
        error: MediaProviderError,
        context: ErrorContext
    ): ErrorRecoveryAction {
        const errorHistory = this.getProviderErrorHistory(error.providerId);
        const recentErrors = errorHistory.filter(
            (e) => Date.now() - (e.details?.timestamp || 0) < 300000 // Last 5 minutes
        );

        switch (error.type) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return this.handleNetworkError(error, context, recentErrors);

            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return this.handleRateLimitError(error, context);

            case MediaProviderErrorType.API_KEY_INVALID:
                return this.handleAuthError(error, context);

            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return this.handleProviderUnavailableError(
                    error,
                    context,
                    recentErrors
                );

            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return this.handleDownloadError(error, context, recentErrors);

            case MediaProviderErrorType.SEARCH_FAILED:
                return this.handleSearchError(error, context, recentErrors);

            default:
                return this.handleGenericError(error, context);
        }
    }

    /**
     * Handle network-related errors
     */
    private handleNetworkError(
        error: MediaProviderError,
        context: ErrorContext,
        recentErrors: MediaProviderError[]
    ): ErrorRecoveryAction {
        const networkStatus = this.offlineDetector.getNetworkStatus();

        if (networkStatus === 'offline') {
            return {
                action: 'offline_mode',
                message: 'Network connection lost',
                userMessage:
                    'You appear to be offline. Please check your internet connection.',
                actionableSteps: [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Switch to a different network if available',
                ],
                severity: 'high',
            };
        }

        if (networkStatus === 'slow' || recentErrors.length >= 3) {
            return {
                action: 'fallback_provider',
                message: 'Network issues detected, using fallback providers',
                userMessage:
                    'Experiencing slow connection. Trying alternative sources...',
                actionableSteps: [
                    'Results may load slower than usual',
                    'Consider switching to a faster network',
                ],
                severity: 'medium',
            };
        }

        return {
            action: 'retry_with_backoff',
            maxRetries: 3,
            backoffMultiplier: 2,
            message: 'Network error, retrying with backoff',
            userMessage: 'Connection issue detected. Retrying...',
            actionableSteps: ['Please wait while we retry the connection'],
            severity: 'low',
        };
    }

    /**
     * Handle rate limiting errors
     */
    private handleRateLimitError(
        error: MediaProviderError,
        context: ErrorContext
    ): ErrorRecoveryAction {
        const retryAfter = error.retryAfter || 3600; // Default 1 hour

        return {
            action: 'disable_temporarily',
            duration: retryAfter,
            message: `${error.providerId} rate limit exceeded`,
            userMessage: `${error.providerId} is temporarily unavailable due to usage limits. Using other sources...`,
            actionableSteps: [
                'Results will continue from other providers',
                `${error.providerId} will be available again in ${this.formatDuration(retryAfter)}`,
            ],
            severity: 'medium',
        };
    }

    /**
     * Handle authentication errors
     */
    private handleAuthError(
        error: MediaProviderError,
        context: ErrorContext
    ): ErrorRecoveryAction {
        return {
            action: 'disable_temporarily',
            duration: 86400, // 24 hours
            message: `Authentication failed for ${error.providerId}`,
            userMessage: `${error.providerId} is temporarily unavailable due to configuration issues.`,
            actionableSteps: [
                'Results will continue from other providers',
                'Contact support if this persists',
            ],
            severity: 'high',
        };
    }

    /**
     * Handle provider unavailable errors
     */
    private handleProviderUnavailableError(
        error: MediaProviderError,
        context: ErrorContext,
        recentErrors: MediaProviderError[]
    ): ErrorRecoveryAction {
        const consecutiveFailures = recentErrors.filter(
            (e) => e.type === MediaProviderErrorType.PROVIDER_UNAVAILABLE
        ).length;

        let duration = error.retryAfter || 300; // Default 5 minutes

        // Increase duration for repeated failures
        if (consecutiveFailures >= 3) {
            duration = Math.min(
                duration * Math.pow(2, consecutiveFailures - 2),
                3600
            ); // Max 1 hour
        }

        return {
            action: 'disable_temporarily',
            duration,
            message: `${error.providerId} is temporarily unavailable`,
            userMessage: `${error.providerId} is experiencing issues. Using other sources...`,
            actionableSteps: [
                'Results will continue from other providers',
                `Will retry ${error.providerId} in ${this.formatDuration(duration)}`,
            ],
            severity: consecutiveFailures >= 3 ? 'high' : 'medium',
        };
    }

    /**
     * Handle download errors
     */
    private handleDownloadError(
        error: MediaProviderError,
        context: ErrorContext,
        recentErrors: MediaProviderError[]
    ): ErrorRecoveryAction {
        const downloadFailures = recentErrors.filter(
            (e) => e.type === MediaProviderErrorType.DOWNLOAD_FAILED
        ).length;

        if (downloadFailures >= 2) {
            return {
                action: 'show_error',
                message: 'Multiple download failures detected',
                userMessage:
                    'Unable to download selected media. Please try different images.',
                actionableSteps: [
                    'Try selecting different images',
                    'Check your internet connection',
                    'Try again in a few minutes',
                ],
                severity: 'high',
            };
        }

        return {
            action: 'retry_with_backoff',
            maxRetries: 2,
            backoffMultiplier: 1.5,
            message: 'Download failed, retrying',
            userMessage: 'Download failed. Retrying...',
            actionableSteps: ['Please wait while we retry the download'],
            severity: 'medium',
        };
    }

    /**
     * Handle search errors
     */
    private handleSearchError(
        error: MediaProviderError,
        context: ErrorContext,
        recentErrors: MediaProviderError[]
    ): ErrorRecoveryAction {
        const searchFailures = recentErrors.filter(
            (e) => e.type === MediaProviderErrorType.SEARCH_FAILED
        ).length;

        if (searchFailures >= 3) {
            return {
                action: 'disable_temporarily',
                duration: 600, // 10 minutes
                message: `Multiple search failures for ${error.providerId}`,
                userMessage: `${error.providerId} is experiencing issues. Using other sources...`,
                actionableSteps: [
                    'Results will continue from other providers',
                    'Try different search terms',
                ],
                severity: 'medium',
            };
        }

        return {
            action: 'retry_with_backoff',
            maxRetries: 2,
            backoffMultiplier: 1.5,
            message: 'Search failed, retrying',
            userMessage: 'Search encountered an issue. Retrying...',
            actionableSteps: ['Please wait while we retry the search'],
            severity: 'low',
        };
    }

    /**
     * Handle generic errors
     */
    private handleGenericError(
        error: MediaProviderError,
        context: ErrorContext
    ): ErrorRecoveryAction {
        return {
            action: 'show_error',
            message: `Unexpected error: ${error.message}`,
            userMessage: 'An unexpected error occurred. Please try again.',
            actionableSteps: [
                'Try refreshing the page',
                'Try different search terms',
                'Contact support if this persists',
            ],
            severity: 'medium',
        };
    }

    /**
     * Execute retry with exponential backoff
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        config: RetryConfig,
        context: ErrorContext
    ): Promise<T> {
        let lastError: Error;
        let delay = config.baseDelay;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                const result = await operation();

                // Reset retry count on success
                if (context.providerId) {
                    this.retryAttempts.delete(context.providerId);
                }

                return result;
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                // Don't retry on the last attempt
                if (attempt === config.maxRetries) {
                    break;
                }

                // Calculate delay with jitter if enabled
                let actualDelay = delay;
                if (config.jitter) {
                    actualDelay = delay * (0.5 + Math.random() * 0.5);
                }

                // Wait before retrying
                await this.sleep(actualDelay);

                // Increase delay for next attempt
                delay = Math.min(
                    delay * config.backoffMultiplier,
                    config.maxDelay
                );

                // Update retry attempt count
                if (context.providerId) {
                    const currentAttempts =
                        this.retryAttempts.get(context.providerId) || 0;
                    this.retryAttempts.set(
                        context.providerId,
                        currentAttempts + 1
                    );
                }
            }
        }

        throw lastError!;
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(error: MediaProviderError): string {
        const recoveryAction = this.recoveryActions.get(
            `${error.providerId}-${error.type}`
        );

        return (
            recoveryAction?.userMessage ||
            this.getDefaultUserMessage(error.type)
        );
    }

    /**
     * Get actionable recovery steps for users
     */
    getRecoverySteps(error: MediaProviderError): string[] {
        const recoveryAction = this.recoveryActions.get(
            `${error.providerId}-${error.type}`
        );

        return (
            recoveryAction?.actionableSteps ||
            this.getDefaultRecoverySteps(error.type)
        );
    }

    /**
     * Check if system is in offline mode
     */
    isOffline(): boolean {
        return this.offlineDetector.getNetworkStatus() === 'offline';
    }

    /**
     * Get network status
     */
    getNetworkStatus(): 'online' | 'offline' | 'slow' {
        return this.offlineDetector.getNetworkStatus();
    }

    /**
     * Get error statistics
     */
    getErrorStatistics(): {
        totalErrors: number;
        errorsByType: Record<MediaProviderErrorType, number>;
        errorsByProvider: Record<string, number>;
        averageRecoveryTime: number;
        mostCommonErrors: Array<{
            type: MediaProviderErrorType;
            count: number;
        }>;
    } {
        const totalErrors = Array.from(this.errorHistory.values()).flat()
            .length;

        const errorsByType: Record<MediaProviderErrorType, number> = {} as any;
        const errorsByProvider: Record<string, number> = {};

        let totalRecoveryTime = 0;
        let recoveryCount = 0;

        for (const [providerId, errors] of this.errorHistory) {
            errorsByProvider[providerId] = errors.length;

            for (const error of errors) {
                errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;

                if (error.retryAfter) {
                    totalRecoveryTime += error.retryAfter;
                    recoveryCount++;
                }
            }
        }

        const mostCommonErrors = Object.entries(errorsByType)
            .map(([type, count]) => ({
                type: type as MediaProviderErrorType,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalErrors,
            errorsByType,
            errorsByProvider,
            averageRecoveryTime:
                recoveryCount > 0 ? totalRecoveryTime / recoveryCount : 0,
            mostCommonErrors,
        };
    }

    /**
     * Clear error history
     */
    clearErrorHistory(providerId?: string): void {
        if (providerId) {
            this.errorHistory.delete(providerId);
        } else {
            this.errorHistory.clear();
        }
    }

    // Private helper methods

    private recordError(
        error: MediaProviderError,
        context: ErrorContext
    ): void {
        const providerId = error.providerId;
        const errors = this.errorHistory.get(providerId) || [];

        // Add timestamp to error details
        error.details = {
            ...error.details,
            timestamp: Date.now(),
            context,
        };

        errors.push(error);

        // Keep only recent errors
        if (errors.length > this.maxErrorHistory) {
            errors.splice(0, errors.length - this.maxErrorHistory);
        }

        this.errorHistory.set(providerId, errors);
    }

    private recordRecoveryAction(
        error: MediaProviderError,
        action: ErrorRecoveryAction
    ): void {
        const key = `${error.providerId}-${error.type}`;
        this.recoveryActions.set(key, action);
    }

    private getProviderErrorHistory(providerId: string): MediaProviderError[] {
        return this.errorHistory.get(providerId) || [];
    }

    private initializeErrorMetrics(): void {
        for (const errorType of Object.values(MediaProviderErrorType)) {
            this.errorMetrics.set(errorType, {
                errorType,
                count: 0,
                firstOccurrence: 0,
                lastOccurrence: 0,
                affectedProviders: [],
                averageRecoveryTime: 0,
                userImpact: 'none',
            });
        }
    }

    private updateErrorMetrics(error: MediaProviderError): void {
        const metrics = this.errorMetrics.get(error.type);
        if (!metrics) return;

        metrics.count++;
        metrics.lastOccurrence = Date.now();

        if (metrics.firstOccurrence === 0) {
            metrics.firstOccurrence = Date.now();
        }

        if (!metrics.affectedProviders.includes(error.providerId)) {
            metrics.affectedProviders.push(error.providerId);
        }

        // Update user impact based on error frequency and type
        if (metrics.count > 10) {
            metrics.userImpact = 'high';
        } else if (metrics.count > 5) {
            metrics.userImpact = 'medium';
        } else if (metrics.count > 1) {
            metrics.userImpact = 'low';
        }
    }

    private isNetworkError(message: string, stack?: string): boolean {
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
            (keyword) =>
                message.includes(keyword) ||
                (stack && stack.toLowerCase().includes(keyword))
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

    private getNetworkErrorMessage(message: string): string {
        if (message.includes('cors')) {
            return 'Cross-origin request blocked';
        }
        if (message.includes('timeout')) {
            return 'Request timed out';
        }
        if (message.includes('enotfound')) {
            return 'Server not found';
        }
        return 'Network connection error';
    }

    private extractRetryAfter(message: string): number {
        const match = message.match(/retry[- ]after[:\s]*(\d+)/i);
        return match ? parseInt(match[1]) : 3600; // Default 1 hour
    }

    private calculateServerErrorRetryDelay(message: string): number {
        if (message.includes('502') || message.includes('503')) {
            return 300; // 5 minutes for temporary issues
        }
        if (message.includes('500')) {
            return 600; // 10 minutes for server errors
        }
        return 300; // Default 5 minutes
    }

    private extractServerStatus(message: string): string {
        const statusMatch = message.match(/(\d{3})/);
        return statusMatch ? `HTTP ${statusMatch[1]}` : 'Unknown';
    }

    private getDefaultUserMessage(errorType: MediaProviderErrorType): string {
        switch (errorType) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'Connection issue detected. Please check your internet connection.';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 'Service temporarily unavailable due to high usage. Using other sources...';
            case MediaProviderErrorType.API_KEY_INVALID:
                return 'Service configuration issue. Using other sources...';
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 'Service temporarily unavailable. Using other sources...';
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'Failed to download selected media. Please try different images.';
            case MediaProviderErrorType.SEARCH_FAILED:
                return 'Search encountered an issue. Please try again.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }

    private getDefaultRecoverySteps(
        errorType: MediaProviderErrorType
    ): string[] {
        switch (errorType) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return [
                    'Check your internet connection',
                    'Try refreshing the page',
                    'Switch to a different network if available',
                ];
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return [
                    'Results will continue from other providers',
                    'Service will be available again shortly',
                ];
            case MediaProviderErrorType.API_KEY_INVALID:
                return [
                    'Results will continue from other providers',
                    'Contact support if this persists',
                ];
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return [
                    'Results will continue from other providers',
                    'Service will be restored automatically',
                ];
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return [
                    'Try selecting different images',
                    'Check your internet connection',
                    'Try again in a few minutes',
                ];
            case MediaProviderErrorType.SEARCH_FAILED:
                return [
                    'Try different search terms',
                    'Try refreshing the page',
                    'Contact support if this persists',
                ];
            default:
                return [
                    'Try refreshing the page',
                    'Contact support if this persists',
                ];
        }
    }

    private formatDuration(seconds: number): string {
        if (seconds < 60) {
            return `${seconds} seconds`;
        }
        if (seconds < 3600) {
            return `${Math.round(seconds / 60)} minutes`;
        }
        return `${Math.round(seconds / 3600)} hours`;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Offline detection and network status monitoring
 */
class OfflineDetector {
    private networkStatus: 'online' | 'offline' | 'slow' = 'online';
    private connectionSpeed: number = 0;
    private lastSpeedTest: number = 0;
    private readonly speedTestInterval = 30000; // 30 seconds

    constructor() {
        this.initializeNetworkMonitoring();
    }

    private initializeNetworkMonitoring(): void {
        // Browser online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.networkStatus = 'online';
                this.testConnectionSpeed();
            });

            window.addEventListener('offline', () => {
                this.networkStatus = 'offline';
            });

            // Initial status
            this.networkStatus = navigator.onLine ? 'online' : 'offline';

            if (this.networkStatus === 'online') {
                this.testConnectionSpeed();
            }
        }
    }

    getNetworkStatus(): 'online' | 'offline' | 'slow' {
        // Test connection speed periodically
        if (
            this.networkStatus === 'online' &&
            Date.now() - this.lastSpeedTest > this.speedTestInterval
        ) {
            this.testConnectionSpeed();
        }

        return this.networkStatus;
    }

    private async testConnectionSpeed(): Promise<void> {
        if (typeof window === 'undefined' || !navigator.onLine) {
            return;
        }

        try {
            const startTime = Date.now();

            // Test with a small image from a reliable CDN
            const response = await fetch('https://httpbin.org/bytes/1024', {
                method: 'GET',
                cache: 'no-cache',
            });

            if (response.ok) {
                const endTime = Date.now();
                const duration = endTime - startTime;
                const bytes = 1024;

                // Calculate speed in KB/s
                this.connectionSpeed = bytes / (duration / 1000) / 1024;
                this.lastSpeedTest = Date.now();

                // Consider connection slow if < 50 KB/s
                if (this.connectionSpeed < 50) {
                    this.networkStatus = 'slow';
                } else {
                    this.networkStatus = 'online';
                }
            }
        } catch (error) {
            // If speed test fails, assume slow connection
            this.networkStatus = 'slow';
            this.lastSpeedTest = Date.now();
        }
    }

    getConnectionSpeed(): number {
        return this.connectionSpeed;
    }
}

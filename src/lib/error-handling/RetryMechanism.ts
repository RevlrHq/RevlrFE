/**
 * Retry mechanism for failed API calls with exponential backoff
 */

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    exponentialBase: number;
    jitter: boolean;
}

export interface RetryResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    attempts: number;
    totalTime: number;
}

export class RetryMechanism {
    private static defaultConfig: RetryConfig = {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        exponentialBase: 2,
        jitter: true,
    };

    /**
     * Retry an async operation with exponential backoff
     */
    static async retry<T>(
        operation: () => Promise<T>,
        config: Partial<RetryConfig> = {},
        shouldRetry?: (error: Error, attempt: number) => boolean
    ): Promise<RetryResult<T>> {
        const finalConfig = { ...this.defaultConfig, ...config };
        const startTime = Date.now();
        let lastError: Error;

        for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
            try {
                const result = await operation();
                return {
                    success: true,
                    data: result,
                    attempts: attempt,
                    totalTime: Date.now() - startTime,
                };
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error(String(error));

                // Check if we should retry this error
                if (shouldRetry && !shouldRetry(lastError, attempt)) {
                    break;
                }

                // Don't wait after the last attempt
                if (attempt < finalConfig.maxAttempts) {
                    const delay = this.calculateDelay(attempt, finalConfig);
                    await this.sleep(delay);
                }
            }
        }

        return {
            success: false,
            error: lastError!,
            attempts: finalConfig.maxAttempts,
            totalTime: Date.now() - startTime,
        };
    }

    /**
     * Retry specifically for API calls with network-aware logic
     */
    static async retryApiCall<T>(
        apiCall: () => Promise<T>,
        config: Partial<RetryConfig> = {}
    ): Promise<RetryResult<T>> {
        return this.retry(apiCall, config, (error) => {
            // Don't retry on client errors (4xx)
            if (this.isClientError(error)) {
                return false;
            }

            // Don't retry if offline
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                return false;
            }

            // Retry on network errors and server errors (5xx)
            return this.isRetryableError(error);
        });
    }

    /**
     * Create a retry wrapper for a function
     */
    static createRetryWrapper<T extends unknown[], R>(
        fn: (...args: T) => Promise<R>,
        config: Partial<RetryConfig> = {}
    ): (...args: T) => Promise<R> {
        return async (...args: T): Promise<R> => {
            const result = await this.retry(() => fn(...args), config);
            if (result.success) {
                return result.data!;
            }
            throw result.error;
        };
    }

    private static calculateDelay(
        attempt: number,
        config: RetryConfig
    ): number {
        const exponentialDelay =
            config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
        let delay = Math.min(exponentialDelay, config.maxDelay);

        // Add jitter to prevent thundering herd
        if (config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return Math.floor(delay);
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private static isClientError(error: Error): boolean {
        // Check if error message contains HTTP status codes 400-499
        const statusMatch = error.message.match(/(\d{3})/);
        if (statusMatch) {
            const status = parseInt(statusMatch[1]);
            return status >= 400 && status < 500;
        }

        // Check for common client error patterns
        const clientErrorPatterns = [
            /unauthorized/i,
            /forbidden/i,
            /not found/i,
            /bad request/i,
            /validation/i,
        ];

        return clientErrorPatterns.some((pattern) =>
            pattern.test(error.message)
        );
    }

    private static isRetryableError(error: Error): boolean {
        // Network errors
        const networkErrorPatterns = [
            /network/i,
            /timeout/i,
            /connection/i,
            /fetch/i,
            /ECONNREFUSED/i,
            /ENOTFOUND/i,
            /ETIMEDOUT/i,
        ];

        // Server errors (5xx)
        const serverErrorPatterns = [
            /internal server error/i,
            /service unavailable/i,
            /bad gateway/i,
            /gateway timeout/i,
            /5\d{2}/,
        ];

        const allRetryablePatterns = [
            ...networkErrorPatterns,
            ...serverErrorPatterns,
        ];
        return allRetryablePatterns.some((pattern) =>
            pattern.test(error.message)
        );
    }
}

/**
 * Utility function for quick retries
 */
export const withRetry = RetryMechanism.retry;

/**
 * Utility function for API call retries
 */
export const withApiRetry = RetryMechanism.retryApiCall;

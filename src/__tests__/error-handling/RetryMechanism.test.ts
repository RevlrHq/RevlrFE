/**
 * Tests for RetryMechanism functionality
 */

import { RetryMechanism } from '@/lib/error-handling/RetryMechanism';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
});

describe('RetryMechanism', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        navigator.onLine = true;
    });

    describe('Basic Retry Functionality', () => {
        it('should succeed on first attempt', async () => {
            const operation = jest.fn().mockResolvedValue('success');

            const result = await RetryMechanism.retry(operation);

            expect(result.success).toBe(true);
            expect(result.data).toBe('success');
            expect(result.attempts).toBe(1);
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and eventually succeed', async () => {
            const operation = jest
                .fn()
                .mockRejectedValueOnce(new Error('First failure'))
                .mockResolvedValue('success');

            const result = await RetryMechanism.retry(operation, {
                maxAttempts: 3,
            });

            expect(result.success).toBe(true);
            expect(result.data).toBe('success');
            expect(result.attempts).toBe(2);
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should fail after max attempts', async () => {
            const error = new Error('Persistent failure');
            const operation = jest.fn().mockRejectedValue(error);

            const result = await RetryMechanism.retry(operation, {
                maxAttempts: 2,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe(error);
            expect(result.attempts).toBe(2);
            expect(operation).toHaveBeenCalledTimes(2);
        });
    });

    describe('Retry Configuration', () => {
        it('should respect custom retry configuration', async () => {
            const operation = jest.fn().mockRejectedValue(new Error('Failure'));
            const config = {
                maxAttempts: 5,
                baseDelay: 100,
                maxDelay: 1000,
                exponentialBase: 3,
                jitter: false,
            };

            const result = await RetryMechanism.retry(operation, config);

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(5);
            expect(operation).toHaveBeenCalledTimes(5);
        });

        it('should apply exponential backoff delays', async () => {
            const operation = jest.fn().mockRejectedValue(new Error('Failure'));
            const startTime = Date.now();

            await RetryMechanism.retry(operation, {
                maxAttempts: 3,
                baseDelay: 100,
                exponentialBase: 2,
                jitter: false,
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should have delays of ~100ms and ~200ms between attempts
            expect(totalTime).toBeGreaterThan(250); // Allow for some variance
        });
    });

    describe('Custom Retry Logic', () => {
        it('should use custom shouldRetry function', async () => {
            const operation = jest
                .fn()
                .mockRejectedValue(new Error('Client error'));
            const shouldRetry = jest.fn().mockReturnValue(false);

            const result = await RetryMechanism.retry(
                operation,
                { maxAttempts: 3 },
                shouldRetry
            );

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(1);
            expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1);
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should continue retrying when shouldRetry returns true', async () => {
            const operation = jest
                .fn()
                .mockRejectedValue(new Error('Retryable error'));
            const shouldRetry = jest.fn().mockReturnValue(true);

            const result = await RetryMechanism.retry(
                operation,
                { maxAttempts: 3 },
                shouldRetry
            );

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(3);
            expect(shouldRetry).toHaveBeenCalledTimes(3);
            expect(operation).toHaveBeenCalledTimes(3);
        });
    });

    describe('API Call Retries', () => {
        it('should not retry client errors (4xx)', async () => {
            const operation = jest
                .fn()
                .mockRejectedValue(new Error('400 Bad Request'));

            const result = await RetryMechanism.retryApiCall(operation);

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(1);
            expect(operation).toHaveBeenCalledTimes(1);
        });

        it('should retry server errors (5xx)', async () => {
            const operation = jest
                .fn()
                .mockRejectedValue(new Error('500 Internal Server Error'));

            const result = await RetryMechanism.retryApiCall(operation, {
                maxAttempts: 2,
            });

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(2);
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should retry network errors', async () => {
            const operation = jest
                .fn()
                .mockRejectedValue(new Error('Network error'));

            const result = await RetryMechanism.retryApiCall(operation, {
                maxAttempts: 2,
            });

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(2);
            expect(operation).toHaveBeenCalledTimes(2);
        });

        it('should not retry when offline', async () => {
            navigator.onLine = false;
            const operation = jest
                .fn()
                .mockRejectedValue(new Error('Network error'));

            const result = await RetryMechanism.retryApiCall(operation);

            expect(result.success).toBe(false);
            expect(result.attempts).toBe(1);
            expect(operation).toHaveBeenCalledTimes(1);
        });
    });

    describe('Retry Wrapper', () => {
        it('should create a retry wrapper function', async () => {
            const originalFn = jest
                .fn()
                .mockRejectedValueOnce(new Error('First failure'))
                .mockResolvedValue('success');

            const wrappedFn = RetryMechanism.createRetryWrapper(originalFn, {
                maxAttempts: 3,
            });

            const result = await wrappedFn('arg1', 'arg2');

            expect(result).toBe('success');
            expect(originalFn).toHaveBeenCalledTimes(2);
            expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should throw error when all retries fail', async () => {
            const error = new Error('Persistent failure');
            const originalFn = jest.fn().mockRejectedValue(error);

            const wrappedFn = RetryMechanism.createRetryWrapper(originalFn, {
                maxAttempts: 2,
            });

            await expect(wrappedFn()).rejects.toThrow('Persistent failure');
            expect(originalFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error Classification', () => {
        const testCases = [
            // Client errors (should not retry)
            { error: new Error('400 Bad Request'), shouldRetry: false },
            { error: new Error('401 Unauthorized'), shouldRetry: false },
            { error: new Error('403 Forbidden'), shouldRetry: false },
            { error: new Error('404 Not Found'), shouldRetry: false },
            { error: new Error('Validation error'), shouldRetry: false },

            // Server errors (should retry)
            {
                error: new Error('500 Internal Server Error'),
                shouldRetry: true,
            },
            { error: new Error('502 Bad Gateway'), shouldRetry: true },
            { error: new Error('503 Service Unavailable'), shouldRetry: true },

            // Network errors (should retry)
            { error: new Error('Network timeout'), shouldRetry: true },
            { error: new Error('Connection refused'), shouldRetry: true },
            { error: new Error('ECONNREFUSED'), shouldRetry: true },
            { error: new Error('ETIMEDOUT'), shouldRetry: true },
        ];

        testCases.forEach(({ error, shouldRetry }) => {
            it(`should ${shouldRetry ? 'retry' : 'not retry'} for error: ${error.message}`, async () => {
                const operation = jest.fn().mockRejectedValue(error);

                const result = await RetryMechanism.retryApiCall(operation, {
                    maxAttempts: 2,
                });

                expect(result.success).toBe(false);
                expect(result.attempts).toBe(shouldRetry ? 2 : 1);
                expect(operation).toHaveBeenCalledTimes(shouldRetry ? 2 : 1);
            });
        });
    });

    describe('Timing and Performance', () => {
        it('should track total time taken', async () => {
            const operation = jest
                .fn()
                .mockRejectedValueOnce(new Error('First failure'))
                .mockResolvedValue('success');

            const result = await RetryMechanism.retry(operation, {
                maxAttempts: 3,
                baseDelay: 50,
                jitter: false,
            });

            expect(result.success).toBe(true);
            expect(result.totalTime).toBeGreaterThan(40); // Should include delay time
            expect(typeof result.totalTime).toBe('number');
        });

        it('should apply jitter to delays', async () => {
            const operation = jest.fn().mockRejectedValue(new Error('Failure'));

            // Run multiple times to test jitter randomness
            const times = [];
            for (let i = 0; i < 3; i++) {
                const startTime = Date.now();
                await RetryMechanism.retry(operation, {
                    maxAttempts: 2,
                    baseDelay: 100,
                    jitter: true,
                });
                times.push(Date.now() - startTime);
            }

            // With jitter, times should vary
            const uniqueTimes = new Set(times.map((t) => Math.floor(t / 10))); // Group by 10ms
            expect(uniqueTimes.size).toBeGreaterThan(1);
        });
    });
});

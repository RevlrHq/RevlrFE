/**
 * Simplified unit tests for rate limiting utilities
 * Tests core functionality without fake timers
 */

import {
    ClientRateLimiter,
    generateRateLimitKey,
    generateSignalRKey,
    generateNotificationKey,
    formatRateLimitError,
    type RateLimitConfig,
    type RateLimitResult,
} from '../rate-limiting';

describe('ClientRateLimiter - Core Functionality', () => {
    let limiter: ClientRateLimiter;
    const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
        blockDurationMs: 30000, // 30 seconds
    };

    beforeEach(() => {
        limiter = new ClientRateLimiter(config);
    });

    describe('basic rate limiting', () => {
        it('should allow requests within limit', () => {
            const result = limiter.checkLimit('test-key');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4); // maxRequests - 1
            expect(result.resetTime).toBeGreaterThan(Date.now());
        });

        it('should track request counts correctly', () => {
            const result1 = limiter.recordRequest('test-key');
            const result2 = limiter.recordRequest('test-key');

            expect(result1.remaining).toBe(4);
            expect(result2.remaining).toBe(3);
        });

        it('should block requests when limit exceeded', () => {
            // Use up all requests
            for (let i = 0; i < 5; i++) {
                limiter.recordRequest('test-key');
            }

            const result = limiter.recordRequest('test-key');

            expect(result.allowed).toBe(false);
            expect(result.remaining).toBe(0);
            expect(result.retryAfter).toBeDefined();
        });

        it('should track separate limits for different keys', () => {
            // Use up limit for key1
            for (let i = 0; i < 5; i++) {
                limiter.recordRequest('key1');
            }

            const result1 = limiter.checkLimit('key1');
            const result2 = limiter.checkLimit('key2');

            expect(result1.allowed).toBe(false);
            expect(result2.allowed).toBe(true);
        });
    });

    describe('configuration options', () => {
        it('should respect skipSuccessfulRequests option', () => {
            const skipSuccessLimiter = new ClientRateLimiter({
                ...config,
                skipSuccessfulRequests: true,
            });

            const result1 = skipSuccessLimiter.recordRequest('test-key', true);
            const result2 = skipSuccessLimiter.recordRequest('test-key', false);

            expect(result1.remaining).toBe(4); // Success not counted
            expect(result2.remaining).toBe(4); // Only failure counted, so remaining is still 4
        });

        it('should respect skipFailedRequests option', () => {
            const skipFailLimiter = new ClientRateLimiter({
                ...config,
                skipFailedRequests: true,
            });

            const result1 = skipFailLimiter.recordRequest('test-key', false);
            const result2 = skipFailLimiter.recordRequest('test-key', true);

            expect(result1.remaining).toBe(4); // Failure not counted
            expect(result2.remaining).toBe(4); // Only success counted, so remaining is still 4
        });
    });

    describe('reset functionality', () => {
        it('should reset limits for specific key', () => {
            // Use up requests
            for (let i = 0; i < 5; i++) {
                limiter.recordRequest('test-key');
            }

            expect(limiter.checkLimit('test-key').allowed).toBe(false);

            limiter.reset('test-key');

            expect(limiter.checkLimit('test-key').allowed).toBe(true);
        });

        it('should reset all limits', () => {
            limiter.recordRequest('key1');
            limiter.recordRequest('key2');

            limiter.resetAll();

            const result1 = limiter.checkLimit('key1');
            const result2 = limiter.checkLimit('key2');

            expect(result1.remaining).toBe(4);
            expect(result2.remaining).toBe(4);
        });
    });
});

describe('Utility Functions', () => {
    describe('key generation', () => {
        it('should generate rate limit keys correctly', () => {
            const key = generateRateLimitKey('user123', 'action', 'resource');
            expect(key).toBe('user123:action:resource');
        });

        it('should handle anonymous users', () => {
            const key = generateRateLimitKey(undefined, 'action');
            expect(key).toBe('anonymous:action');
        });

        it('should generate SignalR keys', () => {
            const key = generateSignalRKey('user123', 'JoinGroup');
            expect(key).toBe('user123:signalr:JoinGroup');
        });

        it('should generate notification keys', () => {
            const key = generateNotificationKey(
                'user123',
                'dismiss',
                'notif-456'
            );
            expect(key).toBe('user123:notification:dismiss:notif-456');
        });
    });

    describe('error formatting', () => {
        it('should format rate limit errors with retry time', () => {
            const result: RateLimitResult = {
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 60000,
                retryAfter: 30000,
            };

            const message = formatRateLimitError(result, 'test action');
            expect(message).toContain('Too many test action attempts');
            expect(message).toContain('30 seconds');
        });

        it('should format rate limit errors with reset time', () => {
            const resetTime = Date.now() + 60000;
            const result: RateLimitResult = {
                allowed: false,
                remaining: 0,
                resetTime,
            };

            const message = formatRateLimitError(result, 'test action');
            expect(message).toContain('Rate limit exceeded');
            expect(message).toContain('test action');
        });
    });
});

describe('Edge Cases and Error Handling', () => {
    let limiter: ClientRateLimiter;

    beforeEach(() => {
        limiter = new ClientRateLimiter({
            maxRequests: 5,
            windowMs: 60000,
        });
    });

    it('should handle null/undefined keys gracefully', () => {
        const result1 = limiter.checkLimit('');
        const result2 = limiter.checkLimit(null as unknown as string);

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
    });

    it('should handle concurrent requests for same key', () => {
        const results = [];

        // Simulate concurrent requests
        for (let i = 0; i < 10; i++) {
            results.push(limiter.recordRequest('test-key'));
        }

        const allowedCount = results.filter((r) => r.allowed).length;
        const blockedCount = results.filter((r) => !r.allowed).length;

        expect(allowedCount).toBe(5); // Should allow exactly 5
        expect(blockedCount).toBe(5); // Should block the rest
    });

    it('should maintain state consistency', () => {
        // Record some requests
        limiter.recordRequest('key1');
        limiter.recordRequest('key2');

        // Check status
        const status1 = limiter.getStatus('key1');
        const status2 = limiter.getStatus('key2');

        expect(status1.remaining).toBe(3);
        expect(status2.remaining).toBe(3);
        expect(status1.allowed).toBe(true);
        expect(status2.allowed).toBe(true);
    });
});

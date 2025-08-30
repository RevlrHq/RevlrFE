/**
 * Unit tests for rate limiting utilities
 * Tests client-side rate limiting, request tracking, and abuse prevention
 */

import {
    ClientRateLimiter,
    generateRateLimitKey,
    generateSignalRKey,
    generateNotificationKey,
    checkSignalRMethodLimit,
    recordSignalRMethod,
    checkNotificationActionLimit,
    recordNotificationAction,
    checkConnectionLimit,
    recordConnectionAttempt,
    formatRateLimitError,
    type RateLimitConfig,
    type RateLimitResult,
} from '../rate-limiting';

describe('ClientRateLimiter', () => {
    let limiter: ClientRateLimiter;
    const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000, // 1 minute
        blockDurationMs: 30000, // 30 seconds
    };

    beforeEach(() => {
        jest.useFakeTimers('legacy');
        limiter = new ClientRateLimiter(config);
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe('checkLimit', () => {
        it('should allow requests within limit', () => {
            const result = limiter.checkLimit('test-key');

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4); // maxRequests - 1
            expect(result.resetTime).toBeGreaterThan(Date.now());
        });

        it('should initialize new entries correctly', () => {
            const result1 = limiter.checkLimit('key1');
            const result2 = limiter.checkLimit('key2');

            expect(result1.allowed).toBe(true);
            expect(result2.allowed).toBe(true);
            expect(result1.remaining).toBe(4);
            expect(result2.remaining).toBe(4);
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

    describe('recordRequest', () => {
        it('should increment request count', () => {
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

        it('should respect skipSuccessfulRequests option', () => {
            const skipSuccessLimiter = new ClientRateLimiter({
                ...config,
                skipSuccessfulRequests: true,
            });

            const result1 = skipSuccessLimiter.recordRequest('test-key', true);
            const result2 = skipSuccessLimiter.recordRequest('test-key', false);

            expect(result1.remaining).toBe(4); // Success not counted
            expect(result2.remaining).toBe(3); // Failure counted
        });

        it('should respect skipFailedRequests option', () => {
            const skipFailLimiter = new ClientRateLimiter({
                ...config,
                skipFailedRequests: true,
            });

            const result1 = skipFailLimiter.recordRequest('test-key', false);
            const result2 = skipFailLimiter.recordRequest('test-key', true);

            expect(result1.remaining).toBe(4); // Failure not counted
            expect(result2.remaining).toBe(3); // Success counted
        });
    });

    describe('reset and cleanup', () => {
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

        it('should clean up expired entries', () => {
            limiter.recordRequest('test-key');

            // Fast-forward past window
            jest.advanceTimersByTime(config.windowMs + 1000);

            const result = limiter.checkLimit('test-key');
            expect(result.remaining).toBe(4); // Reset to new window
        });
    });

    describe('blocking behavior', () => {
        it('should block requests during block period', () => {
            // Exceed limit
            for (let i = 0; i < 6; i++) {
                limiter.recordRequest('test-key');
            }

            const blockedResult = limiter.checkLimit('test-key');
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.retryAfter).toBeDefined();

            // Fast-forward but not past block duration
            jest.advanceTimersByTime(config.blockDurationMs! / 2);

            const stillBlockedResult = limiter.checkLimit('test-key');
            expect(stillBlockedResult.allowed).toBe(false);
        });

        it('should unblock after block duration', () => {
            // Exceed limit
            for (let i = 0; i < 6; i++) {
                limiter.recordRequest('test-key');
            }

            // Fast-forward past block duration
            jest.advanceTimersByTime(config.blockDurationMs! + 1000);

            const result = limiter.checkLimit('test-key');
            expect(result.allowed).toBe(true);
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

    describe('pre-configured limiters', () => {
        it('should check SignalR method limits', () => {
            const result = checkSignalRMethodLimit('user123', 'JoinGroup');
            expect(result.allowed).toBe(true);
        });

        it('should record SignalR method calls', () => {
            const result = recordSignalRMethod('user123', 'JoinGroup', true);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeLessThan(30); // Default max is 30
        });

        it('should check notification action limits', () => {
            const result = checkNotificationActionLimit(
                'user123',
                'dismiss',
                'notif-456'
            );
            expect(result.allowed).toBe(true);
        });

        it('should record notification actions', () => {
            const result = recordNotificationAction(
                'user123',
                'dismiss',
                'notif-456',
                true
            );
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeLessThan(100); // Default max is 100
        });

        it('should check connection limits', () => {
            const result = checkConnectionLimit('user123');
            expect(result.allowed).toBe(true);
        });

        it('should record connection attempts', () => {
            const result = recordConnectionAttempt('user123', true);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBeLessThan(10); // Default max is 10
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

describe('Rate Limiting Integration', () => {
    beforeEach(() => {
        jest.clearAllTimers();
    });

    it('should prevent SignalR method abuse', () => {
        const userId = 'user123';
        const method = 'JoinGroup';

        // Make requests up to limit
        for (let i = 0; i < 30; i++) {
            const result = recordSignalRMethod(userId, method, true);
            expect(result.allowed).toBe(true);
        }

        // Next request should be blocked
        const blockedResult = recordSignalRMethod(userId, method, true);
        expect(blockedResult.allowed).toBe(false);
    });

    it('should prevent notification action spam', () => {
        const userId = 'user123';
        const action = 'dismiss';

        // Make requests up to limit
        for (let i = 0; i < 100; i++) {
            const result = recordNotificationAction(
                userId,
                action,
                `notif-${i}`,
                true
            );
            expect(result.allowed).toBe(true);
        }

        // Next request should be blocked
        const blockedResult = recordNotificationAction(
            userId,
            action,
            'notif-101',
            true
        );
        expect(blockedResult.allowed).toBe(false);
    });

    it('should prevent connection flooding', () => {
        const userId = 'user123';

        // Make connection attempts up to limit
        for (let i = 0; i < 10; i++) {
            const result = recordConnectionAttempt(userId, false);
            expect(result.allowed).toBe(true);
        }

        // Next attempt should be blocked
        const blockedResult = recordConnectionAttempt(userId, false);
        expect(blockedResult.allowed).toBe(false);
    });

    it('should handle different users independently', () => {
        const method = 'JoinGroup';

        // User1 uses up their limit
        for (let i = 0; i < 30; i++) {
            recordSignalRMethod('user1', method, true);
        }

        const user1Result = checkSignalRMethodLimit('user1', method);
        const user2Result = checkSignalRMethodLimit('user2', method);

        expect(user1Result.allowed).toBe(false);
        expect(user2Result.allowed).toBe(true);
    });

    it('should reset limits after time window', () => {
        const userId = 'user123';
        const method = 'JoinGroup';

        // Use up limit
        for (let i = 0; i < 30; i++) {
            recordSignalRMethod(userId, method, true);
        }

        expect(checkSignalRMethodLimit(userId, method).allowed).toBe(false);

        // Fast-forward past window (5 minutes for connection limiter)
        jest.advanceTimersByTime(300000 + 1000);

        expect(checkSignalRMethodLimit(userId, method).allowed).toBe(true);
    });
});

describe('Edge Cases and Error Handling', () => {
    it('should handle invalid user IDs gracefully', () => {
        const result1 = checkSignalRMethodLimit('', 'JoinGroup');
        const result2 = checkSignalRMethodLimit(null as unknown as string, 'JoinGroup');
        const result3 = checkSignalRMethodLimit(undefined, 'JoinGroup');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
        expect(result3.allowed).toBe(true);
    });

    it('should handle empty or invalid actions', () => {
        const result1 = recordNotificationAction(
            'user123',
            '',
            undefined,
            true
        );
        const result2 = recordNotificationAction(
            'user123',
            null as unknown as string,
            undefined,
            true
        );

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
    });

    it('should handle concurrent requests correctly', () => {
        const userId = 'user123';
        const method = 'JoinGroup';

        // Simulate concurrent requests
        const results = [];
        for (let i = 0; i < 35; i++) {
            results.push(recordSignalRMethod(userId, method, true));
        }

        const allowedCount = results.filter((r) => r.allowed).length;
        const blockedCount = results.filter((r) => !r.allowed).length;

        expect(allowedCount).toBe(30); // Should allow exactly 30
        expect(blockedCount).toBe(5); // Should block the rest
    });

    it('should handle timer cleanup properly', () => {
        const limiter = new ClientRateLimiter({
            maxRequests: 5,
            windowMs: 1000,
        });

        // Make some requests
        limiter.recordRequest('test-key');

        // Fast-forward to trigger cleanup
        jest.advanceTimersByTime(60000);

        // Should not throw errors
        expect(() => limiter.checkLimit('test-key')).not.toThrow();
    });
});

/**
 * Client-side rate limiting utilities for SignalR actions and user interactions
 * Prevents abuse and excessive API calls
 */

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    blockDurationMs?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}

export interface RateLimitEntry {
    count: number;
    windowStart: number;
    blockedUntil?: number;
}

// ============================================================================
// Rate Limiter Class
// ============================================================================

export class ClientRateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            blockDurationMs: config.windowMs,
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            ...config,
        };

        // Clean up expired entries periodically
        setInterval(
            () => this.cleanup(),
            Math.min(this.config.windowMs, 60000)
        );
    }

    /**
     * Check if a request is allowed for the given key
     */
    checkLimit(key: string): RateLimitResult {
        const now = Date.now();
        const entry = this.limits.get(key);

        // Check if currently blocked
        if (entry?.blockedUntil && now < entry.blockedUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.blockedUntil,
                retryAfter: entry.blockedUntil - now,
            };
        }

        // Initialize or reset window if expired
        if (!entry || now - entry.windowStart >= this.config.windowMs) {
            this.limits.set(key, {
                count: 0,
                windowStart: now,
            });

            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime: now + this.config.windowMs,
            };
        }

        // Check if limit exceeded
        if (entry.count >= this.config.maxRequests) {
            const blockedUntil =
                now + (this.config.blockDurationMs || this.config.windowMs);

            this.limits.set(key, {
                ...entry,
                blockedUntil,
            });

            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.windowStart + this.config.windowMs,
                retryAfter: blockedUntil - now,
            };
        }

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count - 1,
            resetTime: entry.windowStart + this.config.windowMs,
        };
    }

    /**
     * Record a request attempt
     */
    recordRequest(key: string, success?: boolean): RateLimitResult {
        const result = this.checkLimit(key);

        if (!result.allowed) {
            return result;
        }

        // Skip counting based on configuration
        if (success === true && this.config.skipSuccessfulRequests) {
            return result;
        }

        if (success === false && this.config.skipFailedRequests) {
            return result;
        }

        const entry = this.limits.get(key)!;
        entry.count++;

        return {
            ...result,
            remaining: this.config.maxRequests - entry.count,
        };
    }

    /**
     * Reset limits for a specific key
     */
    reset(key: string): void {
        this.limits.delete(key);
    }

    /**
     * Reset all limits
     */
    resetAll(): void {
        this.limits.clear();
    }

    /**
     * Get current status for a key
     */
    getStatus(key: string): RateLimitResult {
        return this.checkLimit(key);
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();

        for (const [key, entry] of this.limits.entries()) {
            // Remove entries that are past their window and not blocked
            if (
                now - entry.windowStart >= this.config.windowMs &&
                (!entry.blockedUntil || now >= entry.blockedUntil)
            ) {
                this.limits.delete(key);
            }
        }
    }
}

// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================

/**
 * Rate limiter for SignalR hub method calls
 */
export const signalRMethodLimiter = new ClientRateLimiter({
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    blockDurationMs: 30000, // 30 seconds
});

/**
 * Rate limiter for notification actions (dismiss, mark as read, etc.)
 */
export const notificationActionLimiter = new ClientRateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    blockDurationMs: 10000, // 10 seconds
});

/**
 * Rate limiter for connection attempts
 */
export const connectionLimiter = new ClientRateLimiter({
    maxRequests: 10,
    windowMs: 300000, // 5 minutes
    blockDurationMs: 60000, // 1 minute
});

/**
 * Rate limiter for user input validation
 */
export const inputValidationLimiter = new ClientRateLimiter({
    maxRequests: 200,
    windowMs: 60000, // 1 minute
    skipSuccessfulRequests: true,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a rate limit key for a user action
 */
export function generateRateLimitKey(
    userId: string | undefined,
    action: string,
    resource?: string
): string {
    const userPart = userId || 'anonymous';
    const resourcePart = resource ? `:${resource}` : '';
    return `${userPart}:${action}${resourcePart}`;
}

/**
 * Generate a rate limit key for SignalR methods
 */
export function generateSignalRKey(
    userId: string | undefined,
    method: string
): string {
    return generateRateLimitKey(userId, `signalr:${method}`);
}

/**
 * Generate a rate limit key for notification actions
 */
export function generateNotificationKey(
    userId: string | undefined,
    action: string,
    notificationId?: string
): string {
    return generateRateLimitKey(
        userId,
        `notification:${action}`,
        notificationId
    );
}

/**
 * Check if a SignalR method call is allowed
 */
export function checkSignalRMethodLimit(
    userId: string | undefined,
    method: string
): RateLimitResult {
    const key = generateSignalRKey(userId, method);
    return signalRMethodLimiter.checkLimit(key);
}

/**
 * Record a SignalR method call
 */
export function recordSignalRMethod(
    userId: string | undefined,
    method: string,
    success?: boolean
): RateLimitResult {
    const key = generateSignalRKey(userId, method);
    return signalRMethodLimiter.recordRequest(key, success);
}

/**
 * Check if a notification action is allowed
 */
export function checkNotificationActionLimit(
    userId: string | undefined,
    action: string,
    notificationId?: string
): RateLimitResult {
    const key = generateNotificationKey(userId, action, notificationId);
    return notificationActionLimiter.checkLimit(key);
}

/**
 * Record a notification action
 */
export function recordNotificationAction(
    userId: string | undefined,
    action: string,
    notificationId?: string,
    success?: boolean
): RateLimitResult {
    const key = generateNotificationKey(userId, action, notificationId);
    return notificationActionLimiter.recordRequest(key, success);
}

/**
 * Check if a connection attempt is allowed
 */
export function checkConnectionLimit(
    userId: string | undefined
): RateLimitResult {
    const key = generateRateLimitKey(userId, 'connection');
    return connectionLimiter.checkLimit(key);
}

/**
 * Record a connection attempt
 */
export function recordConnectionAttempt(
    userId: string | undefined,
    success?: boolean
): RateLimitResult {
    const key = generateRateLimitKey(userId, 'connection');
    return connectionLimiter.recordRequest(key, success);
}

/**
 * Format rate limit error message
 */
export function formatRateLimitError(
    result: RateLimitResult,
    action: string
): string {
    if (result.retryAfter) {
        const seconds = Math.ceil(result.retryAfter / 1000);
        return `Too many ${action} attempts. Please wait ${seconds} seconds before trying again.`;
    }

    const resetTime = new Date(result.resetTime);
    return `Rate limit exceeded for ${action}. Limit resets at ${resetTime.toLocaleTimeString()}.`;
}

// ============================================================================
// React Hook for Rate Limiting
// ============================================================================

/**
 * React hook for managing rate limits in components
 */
export function useRateLimit(limiter: ClientRateLimiter, key: string) {
    const checkLimit = (): RateLimitResult => {
        return limiter.checkLimit(key);
    };

    const recordRequest = (success?: boolean): RateLimitResult => {
        return limiter.recordRequest(key, success);
    };

    const reset = (): void => {
        limiter.reset(key);
    };

    const getStatus = (): RateLimitResult => {
        return limiter.getStatus(key);
    };

    return {
        checkLimit,
        recordRequest,
        reset,
        getStatus,
    };
}

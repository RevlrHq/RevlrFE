/**
 * Security utilities for input sanitization, CSRF protection, and rate limiting
 */

import DOMPurify from 'isomorphic-dompurify';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Input sanitization utilities
 */
export const sanitizeInput = {
    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    html: (input: string): string => {
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
        });
    },

    /**
     * Sanitize text input by removing potentially dangerous characters
     */
    text: (input: string): string => {
        return input
            .replace(/[<>]/g, '') // Remove angle brackets
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    },

    /**
     * Sanitize email input
     */
    email: (input: string): string => {
        return input
            .toLowerCase()
            .replace(/[^\w@.+-]/g, '') // Only allow word chars, @, ., +, -
            .trim();
    },

    /**
     * Sanitize phone number input
     */
    phone: (input: string): string => {
        return input.replace(/[^\d+()-\s]/g, '').trim();
    },

    /**
     * Sanitize URL input
     */
    url: (input: string): string => {
        try {
            const url = new URL(input);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid protocol');
            }
            return url.toString();
        } catch {
            return '';
        }
    },
};

/**
 * CSRF token management
 */
export class CSRFProtection {
    private static tokenCache: string | null = null;
    private static tokenExpiry: number = 0;

    /**
     * Get CSRF token from server or cache
     */
    static async getToken(): Promise<string> {
        const now = Date.now();

        // Return cached token if still valid
        if (this.tokenCache && now < this.tokenExpiry) {
            return this.tokenCache;
        }

        try {
            const response = await fetch('/api/csrf-token', {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch CSRF token');
            }

            const data = await response.json();
            this.tokenCache = data.token;
            this.tokenExpiry = now + (data.expiresIn || 3600) * 1000; // Default 1 hour

            return this.tokenCache;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            throw new Error('Failed to get CSRF protection token');
        }
    }

    /**
     * Add CSRF token to request headers
     */
    static async addToHeaders(
        headers: Record<string, string> = {}
    ): Promise<Record<string, string>> {
        const token = await this.getToken();
        return {
            ...headers,
            'X-CSRF-Token': token,
        };
    }

    /**
     * Clear cached token (e.g., on logout)
     */
    static clearToken(): void {
        this.tokenCache = null;
        this.tokenExpiry = 0;
    }
}

/**
 * Rate limiting for sensitive operations
 */
export class RateLimiter {
    /**
     * Check if operation is rate limited
     */
    static isRateLimited(
        key: string,
        maxAttempts: number = 5,
        windowMs: number = 15 * 60 * 1000 // 15 minutes
    ): boolean {
        const now = Date.now();
        const entry = rateLimitStore.get(key);

        // Clean up expired entries
        if (entry && now > entry.resetTime) {
            rateLimitStore.delete(key);
            return false;
        }

        // Check if rate limited
        if (entry && entry.count >= maxAttempts) {
            return true;
        }

        return false;
    }

    /**
     * Record an attempt for rate limiting
     */
    static recordAttempt(
        key: string,
        windowMs: number = 15 * 60 * 1000 // 15 minutes
    ): void {
        const now = Date.now();
        const entry = rateLimitStore.get(key);

        if (!entry || now > entry.resetTime) {
            rateLimitStore.set(key, {
                count: 1,
                resetTime: now + windowMs,
            });
        } else {
            entry.count++;
        }
    }

    /**
     * Get remaining attempts before rate limit
     */
    static getRemainingAttempts(key: string, maxAttempts: number = 5): number {
        const entry = rateLimitStore.get(key);
        if (!entry) return maxAttempts;

        return Math.max(0, maxAttempts - entry.count);
    }

    /**
     * Get time until rate limit resets
     */
    static getResetTime(key: string): number {
        const entry = rateLimitStore.get(key);
        if (!entry) return 0;

        return Math.max(0, entry.resetTime - Date.now());
    }

    /**
     * Clear rate limit for a key
     */
    static clearRateLimit(key: string): void {
        rateLimitStore.delete(key);
    }
}

/**
 * Security validation utilities
 */
export const securityValidation = {
    /**
     * Validate that input doesn't contain malicious patterns
     */
    isSafeInput: (input: string): boolean => {
        const maliciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i,
            /eval\(/i,
            /expression\(/i,
        ];

        return !maliciousPatterns.some((pattern) => pattern.test(input));
    },

    /**
     * Validate password strength
     */
    isStrongPassword: (password: string): boolean => {
        if (password.length < 8) return false;

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    },

    /**
     * Check if email is from a suspicious domain
     */
    isSuspiciousEmail: (email: string): boolean => {
        const suspiciousDomains = [
            '10minutemail.com',
            'tempmail.org',
            'guerrillamail.com',
            'mailinator.com',
        ];

        const domain = email.split('@')[1]?.toLowerCase();
        return suspiciousDomains.includes(domain);
    },
};

/**
 * Generate secure random strings
 */
export const generateSecureToken = (length: number = 32): string => {
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
};

/**
 * Secure fetch wrapper with CSRF protection and rate limiting
 */
export const secureFetch = async (
    url: string,
    options: RequestInit = {},
    rateLimitKey?: string,
    maxAttempts?: number
): Promise<Response> => {
    // Check rate limiting if key provided
    if (rateLimitKey && RateLimiter.isRateLimited(rateLimitKey, maxAttempts)) {
        const resetTime = RateLimiter.getResetTime(rateLimitKey);
        throw new Error(
            `Rate limited. Try again in ${Math.ceil(resetTime / 1000)} seconds.`
        );
    }

    // Add CSRF protection for state-changing operations
    const method = options.method?.toUpperCase() || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const headers = await CSRFProtection.addToHeaders(
            options.headers as Record<string, string>
        );
        options.headers = headers;
    }

    // Record rate limit attempt
    if (rateLimitKey) {
        RateLimiter.recordAttempt(rateLimitKey);
    }

    // Make the request
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // Always include credentials for security
    });

    return response;
};

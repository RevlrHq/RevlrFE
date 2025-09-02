/**
 * Tests for security utilities
 */

import {
    sanitizeInput,
    CSRFProtection,
    RateLimiter,
    securityValidation,
    secureFetch,
} from '../security';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('sanitizeInput', () => {
    describe('html', () => {
        it('should remove all HTML tags', () => {
            const input = '<script>alert("xss")</script>Hello World';
            const result = sanitizeInput.html(input);
            expect(result).toBe('Hello World');
        });

        it('should handle empty input', () => {
            expect(sanitizeInput.html('')).toBe('');
        });
    });

    describe('text', () => {
        it('should remove dangerous characters', () => {
            const input = '<script>alert("xss")</script>';
            const result = sanitizeInput.text(input);
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('javascript:');
        });

        it('should remove event handlers', () => {
            const input = 'onclick=alert("xss")';
            const result = sanitizeInput.text(input);
            expect(result).not.toContain('onclick=');
        });

        it('should trim whitespace', () => {
            const input = '  hello world  ';
            const result = sanitizeInput.text(input);
            expect(result).toBe('hello world');
        });
    });

    describe('email', () => {
        it('should convert to lowercase and remove invalid characters', () => {
            const input = 'Test.Email+123@EXAMPLE.COM';
            const result = sanitizeInput.email(input);
            expect(result).toBe('test.email+123@example.com');
        });

        it('should remove invalid characters', () => {
            const input = 'test<script>@example.com';
            const result = sanitizeInput.email(input);
            expect(result).toBe('testscript@example.com'); // < and > are removed, but script remains
        });
    });

    describe('phone', () => {
        it('should keep only valid phone characters', () => {
            const input = '+1 (555) 123-4567 ext 123';
            const result = sanitizeInput.phone(input);
            expect(result).toBe('+1 (555) 123-4567  123');
        });

        it('should remove invalid characters', () => {
            const input = '555<script>123</script>4567';
            const result = sanitizeInput.phone(input);
            expect(result).toBe('5551234567'); // Only digits and allowed chars remain
        });
    });

    describe('url', () => {
        it('should return valid HTTPS URL', () => {
            const input = 'https://example.com/path';
            const result = sanitizeInput.url(input);
            expect(result).toBe('https://example.com/path');
        });

        it('should return valid HTTP URL', () => {
            const input = 'http://example.com';
            const result = sanitizeInput.url(input);
            expect(result).toBe('http://example.com/');
        });

        it('should reject invalid protocols', () => {
            const input = 'javascript:alert("xss")';
            const result = sanitizeInput.url(input);
            expect(result).toBe('');
        });

        it('should handle invalid URLs', () => {
            const input = 'not-a-url';
            const result = sanitizeInput.url(input);
            expect(result).toBe('');
        });
    });
});

describe('CSRFProtection', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        CSRFProtection.clearToken();
    });

    describe('getToken', () => {
        it('should fetch token from server', async () => {
            const mockToken = 'csrf-token-123';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: mockToken, expiresIn: 3600 }),
            } as Response);

            const token = await CSRFProtection.getToken();
            expect(token).toBe(mockToken);
            expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token', {
                method: 'GET',
                credentials: 'include',
            });
        });

        it('should return cached token if still valid', async () => {
            const mockToken = 'csrf-token-123';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: mockToken, expiresIn: 3600 }),
            } as Response);

            // First call
            const token1 = await CSRFProtection.getToken();
            // Second call should use cache
            const token2 = await CSRFProtection.getToken();

            expect(token1).toBe(mockToken);
            expect(token2).toBe(mockToken);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should handle fetch errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(CSRFProtection.getToken()).rejects.toThrow(
                'Failed to get CSRF protection token'
            );
        });
    });

    describe('addToHeaders', () => {
        it('should add CSRF token to headers', async () => {
            const mockToken = 'csrf-token-123';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: mockToken, expiresIn: 3600 }),
            } as Response);

            const headers = await CSRFProtection.addToHeaders({
                'Content-Type': 'application/json',
            });
            expect(headers).toEqual({
                'Content-Type': 'application/json',
                'X-CSRF-Token': mockToken,
            });
        });
    });
});

describe('RateLimiter', () => {
    beforeEach(() => {
        // Clear all rate limits
        RateLimiter.clearRateLimit('test-key');
    });

    describe('isRateLimited', () => {
        it('should not be rate limited initially', () => {
            expect(RateLimiter.isRateLimited('test-key', 5)).toBe(false);
        });

        it('should be rate limited after max attempts', () => {
            const key = 'test-key';
            const maxAttempts = 3;

            // Record attempts up to limit
            for (let i = 0; i < maxAttempts; i++) {
                RateLimiter.recordAttempt(key);
            }

            expect(RateLimiter.isRateLimited(key, maxAttempts)).toBe(true);
        });

        it('should reset after window expires', () => {
            const key = 'test-key';
            const maxAttempts = 3;
            const windowMs = 100; // 100ms window

            // Record attempts up to limit
            for (let i = 0; i < maxAttempts; i++) {
                RateLimiter.recordAttempt(key, windowMs);
            }

            expect(RateLimiter.isRateLimited(key, maxAttempts, windowMs)).toBe(
                true
            );

            // Wait for window to expire
            return new Promise((resolve) => {
                setTimeout(() => {
                    expect(
                        RateLimiter.isRateLimited(key, maxAttempts, windowMs)
                    ).toBe(false);
                    resolve(undefined);
                }, 150);
            });
        });
    });

    describe('getRemainingAttempts', () => {
        it('should return max attempts initially', () => {
            expect(RateLimiter.getRemainingAttempts('test-key', 5)).toBe(5);
        });

        it('should decrease with each attempt', () => {
            const key = 'test-key';
            const maxAttempts = 5;

            RateLimiter.recordAttempt(key);
            expect(RateLimiter.getRemainingAttempts(key, maxAttempts)).toBe(4);

            RateLimiter.recordAttempt(key);
            expect(RateLimiter.getRemainingAttempts(key, maxAttempts)).toBe(3);
        });
    });

    describe('getResetTime', () => {
        it('should return 0 for non-existent key', () => {
            expect(RateLimiter.getResetTime('non-existent')).toBe(0);
        });

        it('should return positive time for active rate limit', () => {
            const key = 'test-key';
            RateLimiter.recordAttempt(key, 60000); // 1 minute window

            const resetTime = RateLimiter.getResetTime(key);
            expect(resetTime).toBeGreaterThan(0);
            expect(resetTime).toBeLessThanOrEqual(60000);
        });
    });
});

describe('securityValidation', () => {
    describe('isSafeInput', () => {
        it('should return true for safe input', () => {
            expect(securityValidation.isSafeInput('Hello World')).toBe(true);
            expect(securityValidation.isSafeInput('user@example.com')).toBe(
                true
            );
        });

        it('should return false for malicious input', () => {
            expect(
                securityValidation.isSafeInput('<script>alert("xss")</script>')
            ).toBe(false);
            expect(
                securityValidation.isSafeInput('javascript:alert("xss")')
            ).toBe(false);
            expect(securityValidation.isSafeInput('onclick=alert("xss")')).toBe(
                false
            );
            expect(
                securityValidation.isSafeInput(
                    '<iframe src="evil.com"></iframe>'
                )
            ).toBe(false);
        });
    });

    describe('isStrongPassword', () => {
        it('should return true for strong passwords', () => {
            expect(securityValidation.isStrongPassword('StrongP@ssw0rd')).toBe(
                true
            );
            expect(securityValidation.isStrongPassword('MySecure123!')).toBe(
                true
            );
        });

        it('should return false for weak passwords', () => {
            expect(securityValidation.isStrongPassword('weak')).toBe(false);
            expect(securityValidation.isStrongPassword('password')).toBe(false);
            expect(securityValidation.isStrongPassword('12345678')).toBe(false);
            expect(securityValidation.isStrongPassword('NoNumbers!')).toBe(
                false
            );
        });
    });

    describe('isSuspiciousEmail', () => {
        it('should return false for legitimate emails', () => {
            expect(securityValidation.isSuspiciousEmail('user@gmail.com')).toBe(
                false
            );
            expect(
                securityValidation.isSuspiciousEmail('test@company.com')
            ).toBe(false);
        });

        it('should return true for suspicious domains', () => {
            expect(
                securityValidation.isSuspiciousEmail('user@10minutemail.com')
            ).toBe(true);
            expect(
                securityValidation.isSuspiciousEmail('test@tempmail.org')
            ).toBe(true);
            expect(
                securityValidation.isSuspiciousEmail('spam@mailinator.com')
            ).toBe(true);
        });
    });
});

describe('secureFetch', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        CSRFProtection.clearToken();
        RateLimiter.clearRateLimit('test-rate-limit');
    });

    it('should add CSRF token for POST requests', async () => {
        const mockToken = 'csrf-token-123';
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ token: mockToken, expiresIn: 3600 }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            } as Response);

        await secureFetch('/api/test', { method: 'POST' });

        expect(mockFetch).toHaveBeenCalledWith('/api/test', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'X-CSRF-Token': mockToken,
            },
        });
    });

    it('should not add CSRF token for GET requests', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        } as Response);

        await secureFetch('/api/test', { method: 'GET' });

        expect(mockFetch).toHaveBeenCalledWith('/api/test', {
            method: 'GET',
            credentials: 'include',
        });
    });

    it('should handle rate limiting', async () => {
        const rateLimitKey = 'test-rate-limit';

        // Exhaust rate limit
        for (let i = 0; i < 5; i++) {
            RateLimiter.recordAttempt(rateLimitKey, 60000);
        }

        await expect(
            secureFetch('/api/test', { method: 'POST' }, rateLimitKey, 5)
        ).rejects.toThrow('Rate limited');
    });
});

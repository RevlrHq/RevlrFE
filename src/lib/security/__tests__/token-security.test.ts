/**
 * Unit tests for token security utilities
 * Tests token validation, secure storage, and refresh management
 */

import {
    validateTokenFormat,
    extractTokenClaims,
    shouldRefreshToken,
    SecureTokenStorage,
    TokenRefreshManager,
    extractUserIdFromToken,
    tokenHasScope,
    getTokenExpirationTime,
    type TokenClaims,
} from '../token-security';

// Mock localStorage and sessionStorage
const mockStorage = {
    data: new Map<string, string>(),
    getItem: jest.fn((key: string) => mockStorage.data.get(key) || null),
    setItem: jest.fn((key: string, value: string) =>
        mockStorage.data.set(key, value)
    ),
    removeItem: jest.fn((key: string) => mockStorage.data.delete(key)),
    clear: jest.fn(() => mockStorage.data.clear()),
    key: jest.fn(),
    length: 0,
};

Object.defineProperty(window, 'localStorage', { value: mockStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockStorage });

// Helper function to create test JWT tokens
function createTestToken(
    claims: Partial<TokenClaims> = {},
    expireInSeconds: number = 3600
): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);

    const payload: TokenClaims = {
        sub: 'user123',
        iat: now,
        exp: now + expireInSeconds,
        aud: 'test-audience',
        iss: 'test-issuer',
        ...claims,
    };

    // Use Buffer for proper base64 encoding in Node.js
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
        'base64'
    );
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
        'base64'
    );
    const signature = Buffer.from(
        'mock-signature-' + Math.random().toString(36)
    ).toString('base64');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

describe('Token Validation', () => {
    describe('validateTokenFormat', () => {
        it('should validate a correct JWT token', () => {
            const token = createTestToken();
            const result = validateTokenFormat(token);

            expect(result.isValid).toBe(true);
            expect(result.isExpired).toBe(false);
            expect(result.errors).toHaveLength(0);
            expect(result.expiresAt).toBeInstanceOf(Date);
        });

        it('should reject invalid token formats', () => {
            const invalidTokens = [
                '',
                'invalid',
                'invalid.token',
                'invalid.token.signature.extra',
                null,
                undefined,
            ];

            invalidTokens.forEach((token) => {
                const result = validateTokenFormat(token as string);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });

        it('should detect expired tokens', () => {
            const expiredToken = createTestToken({}, -3600); // Expired 1 hour ago
            const result = validateTokenFormat(expiredToken);

            expect(result.isValid).toBe(false);
            expect(result.isExpired).toBe(true);
            expect(result.errors).toContain('Token has expired');
        });

        it('should warn about tokens expiring soon', () => {
            const soonToExpireToken = createTestToken({}, 240); // Expires in 4 minutes
            const result = validateTokenFormat(soonToExpireToken);

            expect(result.isValid).toBe(true);
            expect(result.isExpired).toBe(false);
            expect(result.warnings).toContain('Token expires within 5 minutes');
        });

        it('should validate required claims', () => {
            const tokenWithoutExp = createTestToken({ exp: undefined });
            const result = validateTokenFormat(tokenWithoutExp);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Token missing expiration (exp) claim'
            );
        });

        it('should warn about missing optional claims', () => {
            const tokenWithoutSub = createTestToken({ sub: undefined });
            const result = validateTokenFormat(tokenWithoutSub);

            expect(result.warnings).toContain(
                'Token missing subject (sub) claim'
            );
        });

        it('should handle malformed JSON in token', () => {
            const malformedToken =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-json.signature';
            const result = validateTokenFormat(malformedToken);

            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Failed to parse token');
        });
    });

    describe('extractTokenClaims', () => {
        it('should extract claims from valid token', () => {
            const expectedClaims = { sub: 'user123', role: 'admin' };
            const token = createTestToken(expectedClaims);
            const claims = extractTokenClaims(token);

            expect(claims).toBeTruthy();
            expect(claims?.sub).toBe('user123');
            expect(claims?.role).toBe('admin');
        });

        it('should return null for invalid tokens', () => {
            const invalidTokens = ['invalid', '', null, undefined];

            invalidTokens.forEach((token) => {
                const claims = extractTokenClaims(token as string);
                expect(claims).toBeNull();
            });
        });
    });

    describe('shouldRefreshToken', () => {
        it('should recommend refresh for tokens expiring soon', () => {
            const soonToExpireToken = createTestToken({}, 300); // 5 minutes
            const shouldRefresh = shouldRefreshToken(soonToExpireToken, 10);

            expect(shouldRefresh).toBe(true);
        });

        it('should not recommend refresh for fresh tokens', () => {
            const freshToken = createTestToken({}, 3600); // 1 hour
            const shouldRefresh = shouldRefreshToken(freshToken, 10);

            expect(shouldRefresh).toBe(false);
        });

        it('should recommend refresh for tokens without expiration', () => {
            const tokenWithoutExp = createTestToken({ exp: undefined });
            const shouldRefresh = shouldRefreshToken(tokenWithoutExp);

            expect(shouldRefresh).toBe(true);
        });
    });
});

describe('SecureTokenStorage', () => {
    let storage: SecureTokenStorage;

    beforeEach(() => {
        mockStorage.data.clear();
        jest.clearAllMocks();
        storage = new SecureTokenStorage({ keyPrefix: 'test_' });
    });

    describe('token storage operations', () => {
        it('should store and retrieve tokens', () => {
            const token = createTestToken();

            storage.setToken('access', token);
            const retrieved = storage.getToken('access');

            expect(retrieved).toBe(token);
            expect(mockStorage.setItem).toHaveBeenCalledWith(
                'test_access',
                expect.any(String)
            );
        });

        it('should obfuscate stored tokens', () => {
            const token = createTestToken();

            storage.setToken('access', token);

            const storedValue = mockStorage.data.get('test_access');
            expect(storedValue).toBeDefined();
            expect(storedValue).not.toBe(token); // Should be obfuscated
        });

        it('should remove tokens', () => {
            const token = createTestToken();

            storage.setToken('access', token);
            expect(storage.hasToken('access')).toBe(true);

            storage.removeToken('access');
            expect(storage.hasToken('access')).toBe(false);
            expect(mockStorage.removeItem).toHaveBeenCalledWith('test_access');
        });

        it('should clear all tokens', () => {
            storage.setToken('access', createTestToken());
            storage.setToken('refresh', createTestToken());

            storage.clearAllTokens();

            expect(storage.hasToken('access')).toBe(false);
            expect(storage.hasToken('refresh')).toBe(false);
        });

        it('should handle storage errors gracefully', () => {
            mockStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() =>
                storage.setToken('access', createTestToken())
            ).toThrow();
        });

        it('should return null for non-existent tokens', () => {
            const token = storage.getToken('nonexistent');
            expect(token).toBeNull();
        });
    });

    describe('storage options', () => {
        it('should use session storage when configured', () => {
            const sessionStorage = new SecureTokenStorage({
                useSessionStorage: true,
            });
            const token = createTestToken();

            sessionStorage.setToken('access', token);

            // Should use sessionStorage instead of localStorage
            expect(mockStorage.setItem).toHaveBeenCalled();
        });

        it('should use custom key prefix', () => {
            const customStorage = new SecureTokenStorage({
                keyPrefix: 'custom_',
            });
            const token = createTestToken();

            customStorage.setToken('access', token);

            expect(mockStorage.setItem).toHaveBeenCalledWith(
                'custom_access',
                expect.any(String)
            );
        });
    });
});

describe('TokenRefreshManager', () => {
    let refreshManager: TokenRefreshManager;
    let mockRefreshFunction: jest.Mock;

    beforeEach(() => {
        jest.clearAllTimers();
        jest.useFakeTimers();

        mockRefreshFunction = jest.fn();
        refreshManager = new TokenRefreshManager({
            refreshThresholdMinutes: 10,
            maxRetryAttempts: 3,
            retryDelayMs: 1000,
        });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('ensureValidToken', () => {
        it('should return current token if valid and fresh', async () => {
            const freshToken = createTestToken({}, 3600); // 1 hour
            mockRefreshFunction.mockResolvedValue('new-token');

            const result = await refreshManager.ensureValidToken(
                freshToken,
                mockRefreshFunction
            );

            expect(result).toBe(freshToken);
            expect(mockRefreshFunction).not.toHaveBeenCalled();
        });

        it('should refresh expired tokens', async () => {
            const expiredToken = createTestToken({}, -3600); // Expired
            const newToken = createTestToken({}, 3600);
            mockRefreshFunction.mockResolvedValue(newToken);

            const result = await refreshManager.ensureValidToken(
                expiredToken,
                mockRefreshFunction
            );

            expect(result).toBe(newToken);
            expect(mockRefreshFunction).toHaveBeenCalledTimes(1);
        });

        it('should refresh tokens expiring soon', async () => {
            const soonToExpireToken = createTestToken({}, 300); // 5 minutes
            const newToken = createTestToken({}, 3600);
            mockRefreshFunction.mockResolvedValue(newToken);

            // This should trigger background refresh but return current token
            const result = await refreshManager.ensureValidToken(
                soonToExpireToken,
                mockRefreshFunction
            );

            expect(result).toBe(soonToExpireToken);

            // Allow background refresh to complete
            await jest.runAllTimersAsync();

            expect(mockRefreshFunction).toHaveBeenCalled();
        });
    });

    describe('refreshToken', () => {
        it('should successfully refresh token', async () => {
            const newToken = createTestToken({}, 3600);
            mockRefreshFunction.mockResolvedValue(newToken);

            const result =
                await refreshManager.refreshToken(mockRefreshFunction);

            expect(result).toBe(newToken);
            expect(mockRefreshFunction).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure', async () => {
            const newToken = createTestToken({}, 3600);
            mockRefreshFunction
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Server error'))
                .mockResolvedValue(newToken);

            const resultPromise =
                refreshManager.refreshToken(mockRefreshFunction);

            // Fast-forward through retry delays
            await jest.runAllTimersAsync();

            const result = await resultPromise;

            expect(result).toBe(newToken);
            expect(mockRefreshFunction).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retry attempts', async () => {
            mockRefreshFunction.mockRejectedValue(
                new Error('Persistent error')
            );

            const refreshPromise =
                refreshManager.refreshToken(mockRefreshFunction);

            // Fast-forward through all retry attempts
            await jest.runAllTimersAsync();

            await expect(refreshPromise).rejects.toThrow(
                'Token refresh failed after 4 attempts'
            );
            expect(mockRefreshFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
        });

        it('should validate refreshed token', async () => {
            const invalidToken = 'invalid-token';
            mockRefreshFunction.mockResolvedValue(invalidToken);

            await expect(
                refreshManager.refreshToken(mockRefreshFunction)
            ).rejects.toThrow('Invalid token received');
        });

        it('should reuse ongoing refresh promise', async () => {
            const newToken = createTestToken({}, 3600);
            mockRefreshFunction.mockResolvedValue(newToken);

            const promise1 = refreshManager.refreshToken(mockRefreshFunction);
            const promise2 = refreshManager.refreshToken(mockRefreshFunction);

            const [result1, result2] = await Promise.all([promise1, promise2]);

            expect(result1).toBe(newToken);
            expect(result2).toBe(newToken);
            expect(mockRefreshFunction).toHaveBeenCalledTimes(1); // Only called once
        });
    });

    describe('cancelRefresh', () => {
        it('should cancel ongoing refresh', () => {
            mockRefreshFunction.mockImplementation(() => new Promise(() => {})); // Never resolves

            refreshManager.refreshToken(mockRefreshFunction);
            refreshManager.cancelRefresh();

            // Should not throw when cancelled
            expect(() => refreshManager.cancelRefresh()).not.toThrow();
        });
    });
});

describe('Utility Functions', () => {
    describe('extractUserIdFromToken', () => {
        it('should extract user ID from sub claim', () => {
            const token = createTestToken({ sub: 'user123' });
            const userId = extractUserIdFromToken(token);
            expect(userId).toBe('user123');
        });

        it('should extract user ID from alternative claims', () => {
            const tokenWithUserId = createTestToken({
                sub: undefined,
                userId: 'user456',
            });
            const tokenWithId = createTestToken({
                sub: undefined,
                id: 'user789',
            });

            expect(extractUserIdFromToken(tokenWithUserId)).toBe('user456');
            expect(extractUserIdFromToken(tokenWithId)).toBe('user789');
        });

        it('should return null for tokens without user ID', () => {
            const token = createTestToken({ sub: undefined });
            const userId = extractUserIdFromToken(token);
            expect(userId).toBeNull();
        });
    });

    describe('tokenHasScope', () => {
        it('should check scopes from scope claim', () => {
            const token = createTestToken({ scope: 'read write admin' });

            expect(tokenHasScope(token, 'read')).toBe(true);
            expect(tokenHasScope(token, 'admin')).toBe(true);
            expect(tokenHasScope(token, 'delete')).toBe(false);
        });

        it('should check scopes from array claims', () => {
            const token = createTestToken({
                scopes: ['read', 'write', 'admin'],
            });

            expect(tokenHasScope(token, 'read')).toBe(true);
            expect(tokenHasScope(token, 'admin')).toBe(true);
            expect(tokenHasScope(token, 'delete')).toBe(false);
        });

        it('should return false for tokens without scopes', () => {
            const token = createTestToken({});
            expect(tokenHasScope(token, 'read')).toBe(false);
        });
    });

    describe('getTokenExpirationTime', () => {
        it('should return expiration time in milliseconds', () => {
            const exp = Math.floor(Date.now() / 1000) + 3600;
            const token = createTestToken({ exp });
            const expirationTime = getTokenExpirationTime(token);

            expect(expirationTime).toBe(exp * 1000);
        });

        it('should return null for tokens without expiration', () => {
            const token = createTestToken({ exp: undefined });
            const expirationTime = getTokenExpirationTime(token);

            expect(expirationTime).toBeNull();
        });
    });
});

describe('Integration Tests', () => {
    it('should handle complete token lifecycle', async () => {
        const storage = new SecureTokenStorage();
        const refreshManager = new TokenRefreshManager({
            refreshThresholdMinutes: 10,
            maxRetryAttempts: 2,
            retryDelayMs: 100,
        });

        // Store initial token
        const initialToken = createTestToken({}, 300); // Expires in 5 minutes
        storage.setToken('access', initialToken);

        // Mock refresh function
        const newToken = createTestToken({}, 3600);
        const mockRefresh = jest.fn().mockResolvedValue(newToken);

        // Ensure valid token (should trigger refresh)
        const retrievedToken = storage.getToken('access')!;
        const validToken = await refreshManager.ensureValidToken(
            retrievedToken,
            mockRefresh
        );

        // Should return current token but trigger background refresh
        expect(validToken).toBe(initialToken);

        // Store the new token
        storage.setToken('access', newToken);
        const finalToken = storage.getToken('access');

        expect(finalToken).toBe(newToken);
    });

    it('should handle storage and refresh errors gracefully', async () => {
        const storage = new SecureTokenStorage();
        const refreshManager = new TokenRefreshManager({
            refreshThresholdMinutes: 10,
            maxRetryAttempts: 1,
            retryDelayMs: 100,
        });

        // Mock storage error
        mockStorage.setItem.mockImplementation(() => {
            throw new Error('Storage error');
        });

        expect(() => storage.setToken('access', createTestToken())).toThrow();

        // Mock refresh error
        const expiredToken = createTestToken({}, -3600);
        const mockRefresh = jest
            .fn()
            .mockRejectedValue(new Error('Refresh failed'));

        await expect(
            refreshManager.ensureValidToken(expiredToken, mockRefresh)
        ).rejects.toThrow();
    });
});

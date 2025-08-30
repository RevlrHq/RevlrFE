/**
 * Unit tests for useSignalRSecurity hook
 * Tests security hook functionality and integration
 */

import { renderHook, act } from '@testing-library/react';
import { useSignalRSecurity } from '../useSignalRSecurity';
import * as authStore from '@/stores/authStore';
import * as sanitization from '@/lib/security/sanitization';
import * as rateLimiting from '@/lib/security/rate-limiting';
import * as tokenSecurity from '@/lib/security/token-security';

// Mock the auth store
jest.mock('@/stores/authStore', () => ({
    useAuthStore: jest.fn(),
}));

// Mock security modules
jest.mock('@/lib/security/sanitization');
jest.mock('@/lib/security/rate-limiting');
jest.mock('@/lib/security/token-security');

const mockUseAuthStore = authStore.useAuthStore as jest.MockedFunction<
    typeof authStore.useAuthStore
>;
const mockSanitization = sanitization as jest.Mocked<typeof sanitization>;
const mockRateLimiting = rateLimiting as jest.Mocked<typeof rateLimiting>;
const mockTokenSecurity = tokenSecurity as jest.Mocked<typeof tokenSecurity>;

// Helper to create mock token
const createMockToken = (userId: string = 'user123'): string => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.mock-signature`;
};

describe('useSignalRSecurity', () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockToken = createMockToken();
    const mockRefreshToken = 'refresh-token';

    beforeEach(() => {
        jest.clearAllMocks();

        // Default auth store mock
        mockUseAuthStore.mockReturnValue({
            user: mockUser,
            token: mockToken,
            refreshToken: mockRefreshToken,
            isAuthenticated: true,
            login: jest.fn(),
            logout: jest.fn(),
            refreshTokens: jest.fn(),
        });

        // Default security module mocks
        mockTokenSecurity.validateTokenFormat.mockReturnValue({
            isValid: true,
            isExpired: false,
            errors: [],
            warnings: [],
        });

        mockTokenSecurity.extractUserIdFromToken.mockReturnValue('user123');
        mockTokenSecurity.shouldRefreshToken.mockReturnValue(false);

        mockRateLimiting.checkSignalRMethodLimit.mockReturnValue({
            allowed: true,
            remaining: 29,
            resetTime: Date.now() + 60000,
        });

        mockRateLimiting.recordSignalRMethod.mockReturnValue({
            allowed: true,
            remaining: 28,
            resetTime: Date.now() + 60000,
        });

        mockSanitization.validateNotificationMessage.mockReturnValue({
            isValid: true,
            errors: [],
            warnings: [],
        });

        mockSanitization.sanitizeNotificationMessage.mockImplementation(
            (msg) => msg
        );
        mockSanitization.validateUserAction.mockReturnValue({
            isValid: true,
            errors: [],
            warnings: [],
        });
    });

    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const { result } = renderHook(() => useSignalRSecurity());

            expect(result.current).toHaveProperty('validateCurrentToken');
            expect(result.current).toHaveProperty('refreshTokenIfNeeded');
            expect(result.current).toHaveProperty('checkMethodLimit');
            expect(result.current).toHaveProperty('recordMethodCall');
            expect(result.current).toHaveProperty(
                'validateAndSanitizeNotification'
            );
            expect(result.current).toHaveProperty('getSecurityStatus');
        });

        it('should initialize with custom configuration', () => {
            const config = {
                enableRateLimiting: false,
                enableTokenValidation: false,
                logSecurityEvents: true,
            };

            const { result } = renderHook(() => useSignalRSecurity(config));

            expect(result.current).toBeDefined();
        });
    });

    describe('token validation', () => {
        it('should validate current token successfully', async () => {
            const { result } = renderHook(() => useSignalRSecurity());

            await act(async () => {
                const validation = await result.current.validateCurrentToken();
                expect(validation.isValid).toBe(true);
                expect(validation.errors).toHaveLength(0);
            });

            expect(mockTokenSecurity.validateTokenFormat).toHaveBeenCalledWith(
                mockToken
            );
        });

        it('should handle missing token', async () => {
            mockUseAuthStore.mockReturnValue({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                login: jest.fn(),
                logout: jest.fn(),
                refreshTokens: jest.fn(),
            });

            const { result } = renderHook(() => useSignalRSecurity());

            await act(async () => {
                const validation = await result.current.validateCurrentToken();
                expect(validation.isValid).toBe(false);
                expect(validation.errors).toContain('No token available');
            });
        });

        it('should handle token validation errors', async () => {
            mockTokenSecurity.validateTokenFormat.mockImplementation(() => {
                throw new Error('Token validation failed');
            });

            const { result } = renderHook(() => useSignalRSecurity());

            await act(async () => {
                const validation = await result.current.validateCurrentToken();
                expect(validation.isValid).toBe(false);
                expect(validation.errors[0]).toContain(
                    'Token validation failed'
                );
            });
        });

        it('should skip validation when disabled', async () => {
            const { result } = renderHook(() =>
                useSignalRSecurity({ enableTokenValidation: false })
            );

            await act(async () => {
                const validation = await result.current.validateCurrentToken();
                expect(validation.isValid).toBe(false);
                expect(validation.errors).toContain('No token available');
            });

            expect(
                mockTokenSecurity.validateTokenFormat
            ).not.toHaveBeenCalled();
        });
    });

    describe('token refresh', () => {
        it('should attempt token refresh', async () => {
            const { result } = renderHook(() => useSignalRSecurity());

            await act(async () => {
                await expect(
                    result.current.refreshTokenIfNeeded()
                ).rejects.toThrow('Token refresh function not implemented');
            });
        });

        it('should handle missing refresh token', async () => {
            mockUseAuthStore.mockReturnValue({
                user: mockUser,
                token: mockToken,
                refreshToken: null,
                isAuthenticated: true,
                login: jest.fn(),
                logout: jest.fn(),
                refreshTokens: jest.fn(),
            });

            const { result } = renderHook(() => useSignalRSecurity());

            await act(async () => {
                await expect(
                    result.current.refreshTokenIfNeeded()
                ).rejects.toThrow();
            });
        });

        it('should skip refresh when token validation disabled', async () => {
            const { result } = renderHook(() =>
                useSignalRSecurity({ enableTokenValidation: false })
            );

            await act(async () => {
                await expect(
                    result.current.refreshTokenIfNeeded()
                ).rejects.toThrow('Token validation disabled');
            });
        });
    });

    describe('rate limiting', () => {
        it('should check method limits', () => {
            const { result } = renderHook(() => useSignalRSecurity());

            const limitResult = result.current.checkMethodLimit('JoinGroup');

            expect(limitResult.allowed).toBe(true);
            expect(limitResult.remaining).toBe(29);
            expect(
                mockRateLimiting.checkSignalRMethodLimit
            ).toHaveBeenCalledWith('user123', 'JoinGroup');
        });

        it('should record method calls', () => {
            const { result } = renderHook(() => useSignalRSecurity());

            const recordResult = result.current.recordMethodCall(
                'JoinGroup',
                true
            );

            expect(recordResult.allowed).toBe(true);
            expect(recordResult.remaining).toBe(28);
            expect(mockRateLimiting.recordSignalRMethod).toHaveBeenCalledWith(
                'user123',
                'JoinGroup',
                true
            );
        });

        it('should handle rate limit exceeded', () => {
            mockRateLimiting.checkSignalRMethodLimit.mockReturnValue({
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 60000,
                retryAfter: 30000,
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const limitResult = result.current.checkMethodLimit('JoinGroup');

            expect(limitResult.allowed).toBe(false);
            expect(limitResult.retryAfter).toBe(30000);
        });

        it('should skip rate limiting when disabled', () => {
            const { result } = renderHook(() =>
                useSignalRSecurity({ enableRateLimiting: false })
            );

            const limitResult = result.current.checkMethodLimit('JoinGroup');

            expect(limitResult.allowed).toBe(true);
            expect(limitResult.remaining).toBe(Infinity);
            expect(
                mockRateLimiting.checkSignalRMethodLimit
            ).not.toHaveBeenCalled();
        });

        it('should handle rate limiting errors gracefully', () => {
            mockRateLimiting.checkSignalRMethodLimit.mockImplementation(() => {
                throw new Error('Rate limiting error');
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const limitResult = result.current.checkMethodLimit('JoinGroup');

            expect(limitResult.allowed).toBe(true); // Fail safe
            expect(limitResult.remaining).toBe(0);
        });
    });

    describe('notification validation and sanitization', () => {
        const mockNotification = {
            id: 'notif-123',
            type: 'Event',
            title: 'Test Title',
            message: 'Test message',
            timestamp: '2024-01-01T00:00:00Z',
            priority: 'Medium',
        };

        it('should validate and sanitize notifications', () => {
            const { result } = renderHook(() => useSignalRSecurity());

            const securityResult =
                result.current.validateAndSanitizeNotification(
                    mockNotification
                );

            expect(securityResult.allowed).toBe(true);
            expect(securityResult.sanitizedData).toBeDefined();
            expect(
                mockSanitization.validateNotificationMessage
            ).toHaveBeenCalledWith(mockNotification);
            expect(
                mockSanitization.sanitizeNotificationMessage
            ).toHaveBeenCalledWith(mockNotification);
        });

        it('should reject invalid notifications', () => {
            mockSanitization.validateNotificationMessage.mockReturnValue({
                isValid: false,
                errors: ['Missing required field: id'],
                warnings: [],
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const securityResult =
                result.current.validateAndSanitizeNotification({});

            expect(securityResult.allowed).toBe(false);
            expect(securityResult.reason).toContain('Invalid notification');
            expect(securityResult.reason).toContain(
                'Missing required field: id'
            );
        });

        it('should include validation warnings', () => {
            mockSanitization.validateNotificationMessage.mockReturnValue({
                isValid: true,
                errors: [],
                warnings: ['Potentially dangerous content detected'],
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const securityResult =
                result.current.validateAndSanitizeNotification(
                    mockNotification
                );

            expect(securityResult.allowed).toBe(true);
            expect(securityResult.warnings).toContain(
                'Potentially dangerous content detected'
            );
        });

        it('should skip sanitization when disabled', () => {
            const { result } = renderHook(() =>
                useSignalRSecurity({
                    enableDataSanitization: false,
                    enableXSSPrevention: false,
                })
            );

            const securityResult =
                result.current.validateAndSanitizeNotification(
                    mockNotification
                );

            expect(securityResult.allowed).toBe(true);
            expect(securityResult.sanitizedData).toBe(mockNotification);
            expect(
                mockSanitization.sanitizeNotificationMessage
            ).not.toHaveBeenCalled();
        });

        it('should handle validation errors gracefully', () => {
            mockSanitization.validateNotificationMessage.mockImplementation(
                () => {
                    throw new Error('Validation error');
                }
            );

            const { result } = renderHook(() => useSignalRSecurity());

            const securityResult =
                result.current.validateAndSanitizeNotification(
                    mockNotification
                );

            expect(securityResult.allowed).toBe(false);
            expect(securityResult.reason).toContain('Security check failed');
        });
    });

    describe('user action validation', () => {
        it('should validate user actions', () => {
            const { result } = renderHook(() => useSignalRSecurity());

            const validationResult = result.current.validateUserAction(
                'dismissNotification',
                { id: 'notif-123' }
            );

            expect(validationResult.allowed).toBe(true);
            expect(mockSanitization.validateUserAction).toHaveBeenCalledWith(
                'dismissNotification',
                { id: 'notif-123' }
            );
        });

        it('should reject invalid actions', () => {
            mockSanitization.validateUserAction.mockReturnValue({
                isValid: false,
                errors: ['Invalid action name format'],
                warnings: [],
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const validationResult =
                result.current.validateUserAction('123invalid');

            expect(validationResult.allowed).toBe(false);
            expect(validationResult.reason).toContain('Invalid action');
        });

        it('should handle validation errors', () => {
            mockSanitization.validateUserAction.mockImplementation(() => {
                throw new Error('Action validation error');
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const validationResult =
                result.current.validateUserAction('validAction');

            expect(validationResult.allowed).toBe(false);
            expect(validationResult.reason).toContain(
                'Action validation failed'
            );
        });
    });

    describe('security status', () => {
        it('should return security status', () => {
            const { result } = renderHook(() => useSignalRSecurity());

            const status = result.current.getSecurityStatus();

            expect(status.tokenValid).toBe(true);
            expect(status.rateLimitStatus).toBe('ok');
            expect(status.lastSecurityCheck).toBeNull();
        });

        it('should handle invalid token in status', () => {
            mockTokenSecurity.validateTokenFormat.mockReturnValue({
                isValid: false,
                isExpired: true,
                errors: ['Token expired'],
                warnings: [],
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const status = result.current.getSecurityStatus();

            expect(status.tokenValid).toBe(false);
        });

        it('should handle missing token in status', () => {
            mockUseAuthStore.mockReturnValue({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                login: jest.fn(),
                logout: jest.fn(),
                refreshTokens: jest.fn(),
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const status = result.current.getSecurityStatus();

            expect(status.tokenValid).toBe(false);
        });
    });

    describe('notification actions', () => {
        it('should check notification action limits', () => {
            mockRateLimiting.checkNotificationActionLimit.mockReturnValue({
                allowed: true,
                remaining: 99,
                resetTime: Date.now() + 60000,
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const limitResult = result.current.checkNotificationLimit(
                'dismiss',
                'notif-123'
            );

            expect(limitResult.allowed).toBe(true);
            expect(limitResult.remaining).toBe(99);
            expect(
                mockRateLimiting.checkNotificationActionLimit
            ).toHaveBeenCalledWith('user123', 'dismiss', 'notif-123');
        });

        it('should record notification actions', () => {
            mockRateLimiting.recordNotificationAction.mockReturnValue({
                allowed: true,
                remaining: 98,
                resetTime: Date.now() + 60000,
            });

            const { result } = renderHook(() => useSignalRSecurity());

            const recordResult = result.current.recordNotificationAction(
                'dismiss',
                'notif-123',
                true
            );

            expect(recordResult.allowed).toBe(true);
            expect(recordResult.remaining).toBe(98);
            expect(
                mockRateLimiting.recordNotificationAction
            ).toHaveBeenCalledWith('user123', 'dismiss', 'notif-123', true);
        });
    });

    describe('token refresh monitoring', () => {
        it('should trigger background refresh for expiring tokens', () => {
            mockTokenSecurity.shouldRefreshToken.mockReturnValue(true);

            renderHook(() => useSignalRSecurity());

            // The effect should trigger automatically
            expect(mockTokenSecurity.shouldRefreshToken).toHaveBeenCalledWith(
                mockToken,
                10
            );
        });

        it('should not trigger refresh for fresh tokens', () => {
            mockTokenSecurity.shouldRefreshToken.mockReturnValue(false);

            renderHook(() => useSignalRSecurity());

            expect(mockTokenSecurity.shouldRefreshToken).toHaveBeenCalledWith(
                mockToken,
                10
            );
        });
    });

    describe('error handling and logging', () => {
        it('should log security events in development', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const { result } = renderHook(() =>
                useSignalRSecurity({ logSecurityEvents: true })
            );

            result.current.recordMethodCall('JoinGroup', true);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should not log in production by default', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const { result } = renderHook(() =>
                useSignalRSecurity({ logSecurityEvents: false })
            );

            result.current.recordMethodCall('JoinGroup', true);

            expect(consoleSpy).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});

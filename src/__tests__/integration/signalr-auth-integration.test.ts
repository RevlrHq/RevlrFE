import { renderHook, act } from '@testing-library/react';
import { AuthService } from '@/lib/services/AuthService';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import { useAuthStore } from '@/stores/authStore';
import type { UserView } from '@/lib/api';

// Mock the API service
jest.mock('@/lib/api/services/PasswordlessAuthService', () => ({
    PasswordlessAuthService: {
        postApiPasswordlessAuthRefresh: jest.fn(),
        postApiPasswordlessAuthRevoke: jest.fn(),
    },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SIGNALR_HUB_URL = 'http://localhost:5000/hub';

describe('SignalR Authentication Integration', () => {
    const mockUser: UserView = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'organizer',
        refreshToken: 'refresh-token-123',
    };

    const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJvcmdhbml6ZXIiLCJleHAiOjk5OTk5OTk5OTl9.signature';

    beforeEach(() => {
        // Clear auth store
        useAuthStore.getState().logout();

        // Clear any cached promises
        SignalRAuthService.clearRefreshPromise();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('Authentication State Integration', () => {
        it('should provide user context for SignalR', () => {
            // Initially not authenticated
            let context = AuthService.getUserContext();
            expect(context).toEqual({
                userId: null,
                role: null,
                isAuthenticated: false,
                email: null,
            });

            // Set user
            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            context = AuthService.getUserContext();
            expect(context).toEqual({
                userId: 'user-123',
                role: 'organizer',
                isAuthenticated: true,
                email: 'test@example.com',
            });
        });

        it('should validate token format correctly', () => {
            expect(AuthService.validateTokenFormat()).toBe(false);
            expect(AuthService.validateTokenFormat('invalid-token')).toBe(
                false
            );
            expect(AuthService.validateTokenFormat(mockToken)).toBe(true);

            // Set token in store
            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            expect(AuthService.validateTokenFormat()).toBe(true);
        });

        it('should check token expiration correctly', () => {
            // Token with far future expiration
            expect(AuthService.isTokenExpired(mockToken)).toBe(false);
            expect(AuthService.isTokenNearExpiration(mockToken)).toBe(false);

            // No token
            expect(AuthService.isTokenExpired()).toBe(true);
            expect(AuthService.isTokenNearExpiration()).toBe(true);
        });

        it('should get token expiration date', () => {
            const expiration = AuthService.getTokenExpiration(mockToken);
            expect(expiration).toBeInstanceOf(Date);
            expect(expiration!.getTime()).toBeGreaterThan(Date.now());

            // No token
            expect(AuthService.getTokenExpiration()).toBe(null);
        });
    });

    describe('SignalR Auth Service Integration', () => {
        it('should check authentication status correctly', () => {
            expect(SignalRAuthService.isAuthenticated()).toBe(false);

            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            expect(SignalRAuthService.isAuthenticated()).toBe(true);
        });

        it('should get current user ID', () => {
            expect(SignalRAuthService.getCurrentUserId()).toBe(null);

            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            expect(SignalRAuthService.getCurrentUserId()).toBe('user-123');
        });

        it('should get current user role', () => {
            expect(SignalRAuthService.getCurrentUserRole()).toBe(null);

            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            expect(SignalRAuthService.getCurrentUserRole()).toBe('organizer');
        });

        it('should get user context', () => {
            let context = SignalRAuthService.getUserContext();
            expect(context).toEqual({
                userId: null,
                role: null,
                isAuthenticated: false,
            });

            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            context = SignalRAuthService.getUserContext();
            expect(context).toEqual({
                userId: 'user-123',
                role: 'organizer',
                isAuthenticated: true,
            });
        });

        it('should validate token format', () => {
            expect(SignalRAuthService.validateTokenFormat('invalid')).toBe(
                false
            );
            expect(SignalRAuthService.validateTokenFormat(mockToken)).toBe(
                true
            );
        });

        it('should check token expiration', () => {
            expect(SignalRAuthService.isTokenExpired(mockToken)).toBe(false);
            expect(
                SignalRAuthService.getTokenExpiration(mockToken)
            ).toBeInstanceOf(Date);
        });
    });

    describe('Token Factory Integration', () => {
        it('should create token factory that returns current token', async () => {
            const tokenFactory = SignalRAuthService.createTokenFactory();

            // Should throw when not authenticated
            await expect(tokenFactory()).rejects.toThrow(
                'User is not authenticated'
            );

            // Set user and token
            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            // Should return token when authenticated
            const token = await tokenFactory();
            expect(token).toBe(mockToken);
        });

        it('should handle token refresh in token factory', async () => {
            // Mock a token that's near expiration
            const nearExpiryToken =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTYwMDAwMDAwMH0.signature';

            act(() => {
                useAuthStore.getState().setUser(mockUser, nearExpiryToken);
            });

            const tokenFactory = SignalRAuthService.createTokenFactory();

            // Should still return the token (refresh logic is handled internally)
            const token = await tokenFactory();
            expect(typeof token).toBe('string');
        });
    });

    describe('Auth State Change Subscription', () => {
        it('should notify on authentication state changes', () => {
            const mockCallback = jest.fn();
            const unsubscribe =
                SignalRAuthService.subscribeToAuthChanges(mockCallback);

            // Login
            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            expect(mockCallback).toHaveBeenCalledWith(true, 'user-123');

            // Logout
            act(() => {
                useAuthStore.getState().logout();
            });

            expect(mockCallback).toHaveBeenCalledWith(false, null);

            unsubscribe();
        });

        it('should notify on user changes', () => {
            const mockCallback = jest.fn();
            const unsubscribe =
                SignalRAuthService.subscribeToAuthChanges(mockCallback);

            // Login with first user
            act(() => {
                useAuthStore.getState().setUser(mockUser, mockToken);
            });

            expect(mockCallback).toHaveBeenCalledWith(true, 'user-123');

            // Switch to different user
            const differentUser: UserView = {
                ...mockUser,
                id: 'user-456',
                email: 'different@example.com',
            };

            act(() => {
                useAuthStore.getState().setUser(differentUser, mockToken);
            });

            expect(mockCallback).toHaveBeenCalledWith(true, 'user-456');

            unsubscribe();
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle authentication failures', async () => {
            const mockError = new Error('Unauthorized');
            const result =
                await SignalRAuthService.handleAuthenticationFailure(mockError);

            expect(result.type).toBe('authentication');
            expect(result.message).toContain('Authentication failed');
            expect(result.originalError).toBe(mockError);
            expect(result.retryable).toBe(false);
        });

        it('should clear refresh promise on demand', () => {
            // This is mainly for testing - ensures clean state
            expect(() =>
                SignalRAuthService.clearRefreshPromise()
            ).not.toThrow();
        });
    });
});

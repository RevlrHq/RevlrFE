import { SignalRAuthService } from '../SignalRAuthService';
import { useAuthStore } from '@/stores/authStore';
import { AuthService } from '../AuthService';
import type { UserView } from '@/lib/api';

// Mock dependencies
jest.mock('@/stores/authStore', () => ({
    useAuthStore: {
        getState: jest.fn(),
        subscribe: jest.fn(),
    },
}));
jest.mock('../AuthService');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

// Mock user data
const mockUser: UserView = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'organizer',
    refreshToken: 'refresh-token-123',
};

// Mock JWT token (base64 encoded payload with exp claim)
const createMockToken = (expirationInSeconds: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
        JSON.stringify({
            sub: 'user-123',
            exp: Math.floor(Date.now() / 1000) + expirationInSeconds,
            iat: Math.floor(Date.now() / 1000),
        })
    );
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
};

// Get the mocked auth store
const mockAuthStore = useAuthStore as jest.Mocked<typeof useAuthStore>;

describe('SignalRAuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SignalRAuthService.clearRefreshPromise();

        // Mock window object
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/dashboard',
                href: '',
            },
            writable: true,
        });

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
        });
    });

    describe('createTokenFactory', () => {
        it('should return a function that provides valid token', async () => {
            const validToken = createMockToken(3600); // 1 hour from now

            mockAuthStore.getState.mockReturnValue({
                user: mockUser,
                token: validToken,
                refreshToken: 'refresh-token',
                isAuthenticated: true,
            });

            const tokenFactory = SignalRAuthService.createTokenFactory();
            const token = await tokenFactory();

            expect(token).toBe(validToken);
        });

        it('should throw error when user is not authenticated', async () => {
            mockAuthStore.getState.mockReturnValue({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
            });

            const tokenFactory = SignalRAuthService.createTokenFactory();

            await expect(tokenFactory()).rejects.toThrow(
                'User is not authenticated'
            );
        });

        it('should refresh token when near expiration', async () => {
            const expiredToken = createMockToken(60); // 1 minute from now (should trigger refresh)
            const newToken = createMockToken(3600); // 1 hour from now

            mockAuthStore.getState
                .mockReturnValueOnce({
                    user: mockUser,
                    token: expiredToken,
                    refreshToken: 'refresh-token',
                    isAuthenticated: true,
                })
                .mockReturnValueOnce({
                    user: mockUser,
                    token: newToken,
                    refreshToken: 'refresh-token',
                    isAuthenticated: true,
                });

            // Mock successful token refresh
            mockAuthService.refreshToken.mockResolvedValue(true);

            const tokenFactory = SignalRAuthService.createTokenFactory();
            const token = await tokenFactory();

            expect(mockAuthService.refreshToken).toHaveBeenCalled();
            expect(token).toBe(newToken);
        });

        it('should return current token if refresh fails', async () => {
            const expiredToken = createMockToken(60); // 1 minute from now

            mockAuthStore.getState.mockReturnValue({
                user: mockUser,
                token: expiredToken,
                refreshToken: 'refresh-token',
                isAuthenticated: true,
            });

            // Mock failed token refresh
            mockAuthService.refreshToken.mockResolvedValue(false);

            const tokenFactory = SignalRAuthService.createTokenFactory();
            const token = await tokenFactory();

            expect(mockAuthService.refreshToken).toHaveBeenCalled();
            expect(token).toBe(expiredToken); // Should return current token as fallback
        });
    });

    describe('handleAuthenticationFailure', () => {
        it('should attempt token refresh on authentication failure', async () => {
            const error = new Error('Unauthorized');

            mockAuthService.refreshTokenIfNeeded.mockResolvedValue(true);

            const result =
                await SignalRAuthService.handleAuthenticationFailure(error);

            expect(mockAuthService.refreshTokenIfNeeded).toHaveBeenCalled();
            expect(result.type).toBe('authentication');
            expect(result.retryable).toBe(true);
            expect(result.message).toContain('token refreshed');
        });

        it('should handle unrecoverable auth error when refresh fails', async () => {
            const error = new Error('Unauthorized');

            mockAuthService.refreshTokenIfNeeded.mockResolvedValue(false);
            mockAuthService.logout.mockResolvedValue();

            const result =
                await SignalRAuthService.handleAuthenticationFailure(error);

            expect(mockAuthService.refreshTokenIfNeeded).toHaveBeenCalled();
            expect(mockAuthService.logout).toHaveBeenCalled();
            expect(result.type).toBe('authentication');
            expect(result.retryable).toBe(false);
            expect(result.message).toContain('unsuccessful');
        });
    });

    describe('user context methods', () => {
        it('should return correct user context when authenticated', () => {
            mockAuthStore.getState.mockReturnValue({
                user: mockUser,
                token: 'valid-token',
                refreshToken: 'refresh-token',
                isAuthenticated: true,
            });

            const context = SignalRAuthService.getUserContext();

            expect(context).toEqual({
                userId: 'user-123',
                role: 'organizer',
                isAuthenticated: true,
            });
        });

        it('should return null values when not authenticated', () => {
            mockAuthStore.getState.mockReturnValue({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
            });

            const context = SignalRAuthService.getUserContext();

            expect(context).toEqual({
                userId: null,
                role: null,
                isAuthenticated: false,
            });
        });

        it('should check authentication status correctly', () => {
            mockAuthStore.getState.mockReturnValue({
                user: mockUser,
                token: 'valid-token',
                refreshToken: 'refresh-token',
                isAuthenticated: true,
            });

            expect(SignalRAuthService.isAuthenticated()).toBe(true);

            mockAuthStore.getState.mockReturnValue({
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
            });

            expect(SignalRAuthService.isAuthenticated()).toBe(false);
        });
    });

    describe('token validation', () => {
        it('should validate correct token format', () => {
            const validToken = createMockToken(3600);
            expect(SignalRAuthService.validateTokenFormat(validToken)).toBe(
                true
            );
        });

        it('should reject invalid token format', () => {
            expect(
                SignalRAuthService.validateTokenFormat('invalid-token')
            ).toBe(false);
            expect(
                SignalRAuthService.validateTokenFormat('header.payload')
            ).toBe(false);
            expect(SignalRAuthService.validateTokenFormat('')).toBe(false);
        });

        it('should check token expiration correctly', () => {
            const validToken = createMockToken(3600); // 1 hour from now
            const expiredToken = createMockToken(-3600); // 1 hour ago

            expect(SignalRAuthService.isTokenExpired(validToken)).toBe(false);
            expect(SignalRAuthService.isTokenExpired(expiredToken)).toBe(true);
        });

        it('should get token expiration date', () => {
            const expirationTime = Math.floor(Date.now() / 1000) + 3600;
            const token = createMockToken(3600);

            const expiration = SignalRAuthService.getTokenExpiration(token);

            expect(expiration).toBeInstanceOf(Date);
            expect(Math.floor(expiration!.getTime() / 1000)).toBe(
                expirationTime
            );
        });
    });

    describe('auth state subscription', () => {
        it('should call callback on authentication status change', () => {
            const callback = jest.fn();

            mockAuthStore.subscribe.mockImplementation((subscribeCallback) => {
                // Simulate auth state change
                const newState = {
                    isAuthenticated: true,
                    user: { id: 'user-123' },
                };
                const prevState = { isAuthenticated: false, user: null };
                subscribeCallback(newState, prevState);
                return () => {};
            });

            SignalRAuthService.subscribeToAuthChanges(callback);

            expect(mockAuthStore.subscribe).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(true, 'user-123');
        });

        it('should call callback on user change', () => {
            const callback = jest.fn();

            mockAuthStore.subscribe.mockImplementation((subscribeCallback) => {
                // Simulate user change
                const newState = {
                    isAuthenticated: true,
                    user: { id: 'user-456' },
                };
                const prevState = {
                    isAuthenticated: true,
                    user: { id: 'user-123' },
                };
                subscribeCallback(newState, prevState);
                return () => {};
            });

            SignalRAuthService.subscribeToAuthChanges(callback);

            expect(callback).toHaveBeenCalledWith(true, 'user-456');
        });
    });
});

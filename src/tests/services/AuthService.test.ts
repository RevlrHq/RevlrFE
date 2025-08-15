import { AuthService } from '../../lib/services/AuthService';
import { useAuthStore } from '../../stores/authStore';
import { OpenAPI } from '../../lib/api/core/OpenAPI';

// Mock the auth store
jest.mock('../../stores/authStore', () => ({
    useAuthStore: {
        getState: jest.fn(),
        subscribe: jest.fn(),
    },
}));

// Mock window object
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/test',
        href: '',
    },
    writable: true,
});

// Mock localStorage
const mockLocalStorage = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
});

describe('AuthService', () => {
    const mockAuthStore = useAuthStore as jest.Mocked<typeof useAuthStore>;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset OpenAPI token
        OpenAPI.TOKEN = undefined;
        // Reset AuthService initialization state
        (AuthService as unknown as { initialized?: boolean }).initialized =
            false;
        // Clear localStorage mock
        mockLocalStorage.setItem.mockClear();
        mockLocalStorage.getItem.mockClear();
        mockLocalStorage.removeItem.mockClear();
        mockLocalStorage.clear.mockClear();
    });

    describe('initialize', () => {
        it('should set up token resolver in OpenAPI config', () => {
            const mockToken = 'test-token-123';
            mockAuthStore.getState.mockReturnValue({
                token: mockToken,
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            AuthService.initialize();

            expect(OpenAPI.TOKEN).toBeDefined();
            expect(typeof OpenAPI.TOKEN).toBe('function');
        });

        it('should return token from auth store when resolver is called', async () => {
            const mockToken = 'test-token-456';
            mockAuthStore.getState.mockReturnValue({
                token: mockToken,
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            AuthService.initialize();

            const tokenResolver = OpenAPI.TOKEN as () => Promise<string>;
            const resolvedToken = await tokenResolver();

            expect(resolvedToken).toBe(mockToken);
        });

        it('should return empty string when no token is available', async () => {
            mockAuthStore.getState.mockReturnValue({
                token: null,
                isAuthenticated: false,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            AuthService.initialize();

            const tokenResolver = OpenAPI.TOKEN as () => Promise<string>;
            const resolvedToken = await tokenResolver();

            expect(resolvedToken).toBe('');
        });
    });

    describe('setToken', () => {
        it('should update OpenAPI token resolver with new token', async () => {
            const newToken = 'new-token-789';

            AuthService.setToken(newToken);

            const tokenResolver = OpenAPI.TOKEN as () => Promise<string>;
            const resolvedToken = await tokenResolver();

            expect(resolvedToken).toBe(newToken);
        });

        it('should handle null token by returning empty string', async () => {
            AuthService.setToken(null);

            const tokenResolver = OpenAPI.TOKEN as () => Promise<string>;
            const resolvedToken = await tokenResolver();

            expect(resolvedToken).toBe('');
        });
    });

    describe('clearToken', () => {
        it('should clear OpenAPI token', () => {
            AuthService.setToken('some-token');
            expect(OpenAPI.TOKEN).toBeDefined();

            AuthService.clearToken();
            expect(OpenAPI.TOKEN).toBeUndefined();
        });
    });

    describe('getCurrentToken', () => {
        it('should return current token from auth store', () => {
            const mockToken = 'current-token';
            mockAuthStore.getState.mockReturnValue({
                token: mockToken,
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            const token = AuthService.getCurrentToken();
            expect(token).toBe(mockToken);
        });
    });

    describe('isAuthenticated', () => {
        it('should return authentication status from auth store', () => {
            mockAuthStore.getState.mockReturnValue({
                token: 'token',
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            const isAuth = AuthService.isAuthenticated();
            expect(isAuth).toBe(true);
        });

        it('should return false when not authenticated', () => {
            mockAuthStore.getState.mockReturnValue({
                token: null,
                isAuthenticated: false,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            const isAuth = AuthService.isAuthenticated();
            expect(isAuth).toBe(false);
        });
    });

    describe('syncToken', () => {
        it('should set token when user is authenticated', () => {
            const mockToken = 'sync-token';
            mockAuthStore.getState.mockReturnValue({
                token: mockToken,
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            AuthService.syncToken();

            expect(OpenAPI.TOKEN).toBeDefined();
        });

        it('should clear token when user is not authenticated', () => {
            mockAuthStore.getState.mockReturnValue({
                token: null,
                isAuthenticated: false,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            AuthService.syncToken();

            expect(OpenAPI.TOKEN).toBeUndefined();
        });
    });

    describe('handleAuthError', () => {
        it('should clear token and logout user', () => {
            const mockLogout = jest.fn();
            mockAuthStore.getState.mockReturnValue({
                token: 'token',
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: mockLogout,
                setHasHydrated: jest.fn(),
            });

            AuthService.handleAuthError();

            expect(OpenAPI.TOKEN).toBeUndefined();
            expect(mockLogout).toHaveBeenCalled();
        });

        it('should save current path and redirect to login', () => {
            const mockLogout = jest.fn();
            mockAuthStore.getState.mockReturnValue({
                token: 'token',
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: mockLogout,
                setHasHydrated: jest.fn(),
            });

            window.location.pathname = '/dashboard/create-event';

            AuthService.handleAuthError();

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'redirectAfterLogin',
                '/dashboard/create-event'
            );
            expect(window.location.href).toBe('/auth/login');
        });
    });

    describe('refreshTokenIfNeeded', () => {
        it('should return true when user is authenticated', async () => {
            mockAuthStore.getState.mockReturnValue({
                token: 'valid-token',
                isAuthenticated: true,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            const result = await AuthService.refreshTokenIfNeeded();
            expect(result).toBe(true);
        });

        it('should return false when user is not authenticated', async () => {
            mockAuthStore.getState.mockReturnValue({
                token: null,
                isAuthenticated: false,
                user: null,
                _hasHydrated: true,
                setUser: jest.fn(),
                logout: jest.fn(),
                setHasHydrated: jest.fn(),
            });

            const result = await AuthService.refreshTokenIfNeeded();
            expect(result).toBe(false);
        });
    });
});

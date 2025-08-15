import { UserView } from '@lib/api';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// type TUser = { id: string; name: string; email: string };

interface AuthState {
    user: UserView | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setUser: (user: UserView, token: string, refreshToken?: string) => void;
    updateTokens: (token: string, refreshToken?: string) => void;
    logout: () => void;
    setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            _hasHydrated: false,
            setUser: (user: UserView, token: string, refreshToken?: string) => {
                const finalRefreshToken =
                    refreshToken || user.refreshToken || null;
                set({
                    user,
                    token,
                    refreshToken: finalRefreshToken,
                    isAuthenticated: true,
                });

                // Sync token with AuthService if available
                if (typeof window !== 'undefined') {
                    import('../lib/services/AuthService')
                        .then(({ AuthService }) => {
                            AuthService.setToken(token);
                        })
                        .catch(console.warn);
                }
            },
            updateTokens: (token: string, refreshToken?: string) => {
                set((state) => ({
                    ...state,
                    token,
                    refreshToken: refreshToken || state.refreshToken,
                }));

                // Sync token with AuthService if available
                if (typeof window !== 'undefined') {
                    import('../lib/services/AuthService')
                        .then(({ AuthService }) => {
                            AuthService.setToken(token);
                        })
                        .catch(console.warn);
                }
            },
            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });

                // Clear token from AuthService if available
                if (typeof window !== 'undefined') {
                    import('../lib/services/AuthService')
                        .then(({ AuthService }) => {
                            AuthService.clearToken();
                        })
                        .catch(console.warn);
                }
            },
            setHasHydrated: (hasHydrated: boolean) =>
                set({ _hasHydrated: hasHydrated }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// example usage
// import { useAuthStore } from '~/stores/authStore';
// const { user, isAuthenticated, setUser, logout } = useAuthStore();

import { UserView } from '@lib/services';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// type TUser = { id: string; name: string; email: string };

interface AuthState {
    user: UserView | null;
    token: string | null;
    isAuthenticated: boolean;
    _hasHydrated: boolean;
    setUser: (user: UserView, token: string) => void;
    logout: () => void;
    setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            _hasHydrated: false,
            setUser: (user: UserView, token: string) =>
                set({ user, token, isAuthenticated: true }),
            logout: () =>
                set({ user: null, token: null, isAuthenticated: false }),
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

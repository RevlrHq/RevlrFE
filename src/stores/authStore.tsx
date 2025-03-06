import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TUser = { id: string; name: string; email: string };

interface AuthState {
    user: TUser | null;
    token: string | null;
    isAuthenticated: boolean;
    setUser: (user: TUser, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setUser: (user: TUser, token: string) =>
                set({ user, token, isAuthenticated: true }),
            logout: () =>
                set({ user: null, token: null, isAuthenticated: false }),
        }),
        { name: 'auth-storage' }
    )
);

// example usage
// import { useAuthStore } from '~/stores/authStore';
// const { user, isAuthenticated, setUser, logout } = useAuthStore();

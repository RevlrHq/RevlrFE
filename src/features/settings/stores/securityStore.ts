import { create } from 'zustand';

/**
 * Security Store
 *
 * Manages security-related state including sessions, email changes, and security settings.
 */
interface UserSession {
    id: string;
    deviceInfo: string;
    location?: string;
    lastActivity: Date;
    isCurrentSession: boolean;
}

interface EmailChangeRequest {
    newEmail: string;
    status: 'pending' | 'verifying' | 'completed' | 'failed';
    verificationSent: boolean;
    expiresAt?: Date;
}

interface SecurityState {
    // Session management
    sessions: UserSession[];

    // Email change
    emailChangeRequest: EmailChangeRequest | null;

    // Loading states
    isLoading: boolean;
    isRevokingSession: boolean;
    isChangingEmail: boolean;

    // Error handling
    error: string | null;

    // Actions
    setSessions: (sessions: UserSession[]) => void;
    refreshSessions: () => Promise<void>;
    revokeSession: (sessionId: string) => Promise<void>;
    revokeAllSessions: () => Promise<void>;
    changeEmail: (newEmail: string) => Promise<void>;
    verifyEmailChange: (code: string) => Promise<void>;
    cancelEmailChange: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
    // Initial state
    sessions: [],
    emailChangeRequest: null,
    isLoading: false,
    isRevokingSession: false,
    isChangingEmail: false,
    error: null,

    // Actions
    setSessions: (sessions: UserSession[]) => {
        set({ sessions, error: null });
    },

    refreshSessions: async () => {
        set({ isLoading: true, error: null });

        try {
            // Simulate API call to fetch sessions
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Mock session data
            const mockSessions: UserSession[] = [
                {
                    id: 'current',
                    deviceInfo: 'Chrome on macOS',
                    location: 'San Francisco, CA',
                    lastActivity: new Date(),
                    isCurrentSession: true,
                },
                {
                    id: 'session-2',
                    deviceInfo: 'Safari on iPhone',
                    location: 'San Francisco, CA',
                    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    isCurrentSession: false,
                },
            ];

            set({
                sessions: mockSessions,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to fetch sessions',
            });
        }
    },

    revokeSession: async (sessionId: string) => {
        set({ isRevokingSession: true, error: null });

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            const { sessions } = get();
            const updatedSessions = sessions.filter(
                (session) => session.id !== sessionId
            );

            set({
                sessions: updatedSessions,
                isRevokingSession: false,
                error: null,
            });
        } catch (error) {
            set({
                isRevokingSession: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to revoke session',
            });
        }
    },

    revokeAllSessions: async () => {
        set({ isRevokingSession: true, error: null });

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const { sessions } = get();
            // Keep only the current session
            const currentSession = sessions.find(
                (session) => session.isCurrentSession
            );

            set({
                sessions: currentSession ? [currentSession] : [],
                isRevokingSession: false,
                error: null,
            });
        } catch (error) {
            set({
                isRevokingSession: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to revoke sessions',
            });
        }
    },

    changeEmail: async (newEmail: string) => {
        set({ isChangingEmail: true, error: null });

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const emailChangeRequest: EmailChangeRequest = {
                newEmail,
                status: 'verifying',
                verificationSent: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            };

            set({
                emailChangeRequest,
                isChangingEmail: false,
                error: null,
            });
        } catch (error) {
            set({
                isChangingEmail: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to initiate email change',
            });
        }
    },

    verifyEmailChange: async (code: string) => {
        const { emailChangeRequest } = get();
        if (!emailChangeRequest) return;

        set({ isChangingEmail: true, error: null });

        try {
            // Simulate verification
            await new Promise((resolve) => setTimeout(resolve, 1000));

            set({
                emailChangeRequest: {
                    ...emailChangeRequest,
                    status: 'completed',
                },
                isChangingEmail: false,
                error: null,
            });
        } catch (error) {
            set({
                emailChangeRequest: {
                    ...emailChangeRequest,
                    status: 'failed',
                },
                isChangingEmail: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to verify email change',
            });
        }
    },

    cancelEmailChange: () => {
        set({ emailChangeRequest: null });
    },

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },

    setError: (error: string | null) => {
        set({ error });
    },

    reset: () => {
        set({
            sessions: [],
            emailChangeRequest: null,
            isLoading: false,
            isRevokingSession: false,
            isChangingEmail: false,
            error: null,
        });
    },
}));

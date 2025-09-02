import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Preferences Store
 *
 * Manages user preferences including notifications and interface settings.
 */
interface NotificationPreferences {
    email: {
        eventUpdates: boolean;
        registrationAlerts: boolean;
        paymentNotifications: boolean;
        marketingEmails: boolean;
        securityAlerts: boolean;
    };
    push: {
        enabled: boolean;
        eventReminders: boolean;
        registrationAlerts: boolean;
        paymentNotifications: boolean;
    };
    inApp: {
        enabled: boolean;
        eventUpdates: boolean;
        systemNotifications: boolean;
    };
    frequency: 'immediate' | 'daily' | 'weekly';
}

interface InterfacePreferences {
    theme: 'light' | 'dark' | 'system';
    dashboardLayout: 'compact' | 'comfortable' | 'spacious';
    defaultEventView: 'grid' | 'list' | 'table';
    defaultAnalyticsView: 'overview' | 'detailed' | 'custom';
    sidebarCollapsed: boolean;
    showWelcomeMessages: boolean;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    currency: string;
    language: string;
}

interface PreferencesState {
    // Preferences data
    notifications: NotificationPreferences | null;
    interface: InterfacePreferences | null;

    // Loading states
    isLoading: boolean;
    isUpdating: boolean;

    // Error handling
    error: string | null;

    // Actions
    setNotifications: (preferences: NotificationPreferences) => void;
    setInterface: (preferences: InterfacePreferences) => void;
    updateNotifications: (
        updates: Partial<NotificationPreferences>
    ) => Promise<void>;
    updateInterface: (updates: Partial<InterfacePreferences>) => Promise<void>;
    loadPreferences: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const defaultNotificationPreferences: NotificationPreferences = {
    email: {
        eventUpdates: true,
        registrationAlerts: true,
        paymentNotifications: true,
        marketingEmails: false,
        securityAlerts: true,
    },
    push: {
        enabled: true,
        eventReminders: true,
        registrationAlerts: true,
        paymentNotifications: true,
    },
    inApp: {
        enabled: true,
        eventUpdates: true,
        systemNotifications: true,
    },
    frequency: 'immediate',
};

const defaultInterfacePreferences: InterfacePreferences = {
    theme: 'system',
    dashboardLayout: 'comfortable',
    defaultEventView: 'table',
    defaultAnalyticsView: 'overview',
    sidebarCollapsed: false,
    showWelcomeMessages: true,
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    language: 'en',
};

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set, get) => ({
            // Initial state
            notifications: null,
            interface: null,
            isLoading: false,
            isUpdating: false,
            error: null,

            // Actions
            setNotifications: (preferences: NotificationPreferences) => {
                set({ notifications: preferences });
            },

            setInterface: (preferences: InterfacePreferences) => {
                set({ interface: preferences });
            },

            updateNotifications: async (
                updates: Partial<NotificationPreferences>
            ) => {
                const { notifications } = get();
                const currentPrefs =
                    notifications || defaultNotificationPreferences;

                set({ isUpdating: true, error: null });

                try {
                    // Simulate API call
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    const updatedPreferences = {
                        ...currentPrefs,
                        ...updates,
                        // Deep merge for nested objects
                        email: { ...currentPrefs.email, ...updates.email },
                        push: { ...currentPrefs.push, ...updates.push },
                        inApp: { ...currentPrefs.inApp, ...updates.inApp },
                    };

                    set({
                        notifications: updatedPreferences,
                        isUpdating: false,
                        error: null,
                    });
                } catch (error) {
                    set({
                        isUpdating: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Failed to update notification preferences',
                    });
                }
            },

            updateInterface: async (updates: Partial<InterfacePreferences>) => {
                const { interface: currentInterface } = get();
                const currentPrefs =
                    currentInterface || defaultInterfacePreferences;

                set({ isUpdating: true, error: null });

                try {
                    // Simulate API call
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    const updatedPreferences = {
                        ...currentPrefs,
                        ...updates,
                    };

                    set({
                        interface: updatedPreferences,
                        isUpdating: false,
                        error: null,
                    });
                } catch (error) {
                    set({
                        isUpdating: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Failed to update interface preferences',
                    });
                }
            },

            loadPreferences: async () => {
                set({ isLoading: true, error: null });

                try {
                    // Simulate API call to load preferences
                    await new Promise((resolve) => setTimeout(resolve, 1000));

                    set({
                        notifications: defaultNotificationPreferences,
                        interface: defaultInterfacePreferences,
                        isLoading: false,
                        error: null,
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Failed to load preferences',
                    });
                }
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },

            setError: (error: string | null) => {
                set({ error });
            },

            reset: () => {
                set({
                    notifications: null,
                    interface: null,
                    isLoading: false,
                    isUpdating: false,
                    error: null,
                });
            },
        }),
        {
            name: 'preferences-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                notifications: state.notifications,
                interface: state.interface,
                // Don't persist loading states or errors
            }),
        }
    )
);

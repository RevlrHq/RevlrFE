import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SettingsSectionId, SettingsNavigation } from '../types';

/**
 * Main Settings Store
 *
 * Central coordination store for settings navigation and shared state.
 * Handles tab management, initialization, and cross-section coordination.
 */
interface SettingsState {
    // Navigation state
    activeTab: SettingsSectionId;
    isInitialized: boolean;

    // Loading states
    isLoading: boolean;

    // Error handling
    error: string | null;

    // Unsaved changes tracking
    hasUnsavedChanges: boolean;
    unsavedSections: Set<SettingsSectionId>;

    // Actions
    setActiveTab: (tab: SettingsSectionId) => void;
    initialize: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    markSectionDirty: (section: SettingsSectionId) => void;
    markSectionClean: (section: SettingsSectionId) => void;
    clearAllUnsavedChanges: () => void;
    reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            // Initial state
            activeTab: 'profile',
            isInitialized: false,
            isLoading: false,
            error: null,
            hasUnsavedChanges: false,
            unsavedSections: new Set(),

            // Actions
            setActiveTab: (tab: SettingsSectionId) => {
                set({ activeTab: tab, error: null });
            },

            initialize: async () => {
                const { isInitialized } = get();
                if (isInitialized) return;

                set({ isLoading: true, error: null });

                try {
                    // Initialize any required data
                    // This could include fetching user preferences, checking permissions, etc.
                    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation

                    set({
                        isInitialized: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error) {
                    set({
                        isLoading: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Failed to initialize settings',
                    });
                }
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },

            setError: (error: string | null) => {
                set({ error });
            },

            markSectionDirty: (section: SettingsSectionId) => {
                const { unsavedSections } = get();
                const newUnsavedSections = new Set(unsavedSections);
                newUnsavedSections.add(section);

                set({
                    unsavedSections: newUnsavedSections,
                    hasUnsavedChanges: newUnsavedSections.size > 0,
                });
            },

            markSectionClean: (section: SettingsSectionId) => {
                const { unsavedSections } = get();
                const newUnsavedSections = new Set(unsavedSections);
                newUnsavedSections.delete(section);

                set({
                    unsavedSections: newUnsavedSections,
                    hasUnsavedChanges: newUnsavedSections.size > 0,
                });
            },

            clearAllUnsavedChanges: () => {
                set({
                    unsavedSections: new Set(),
                    hasUnsavedChanges: false,
                });
            },

            reset: () => {
                set({
                    activeTab: 'profile',
                    isInitialized: false,
                    isLoading: false,
                    error: null,
                    hasUnsavedChanges: false,
                    unsavedSections: new Set(),
                });
            },
        }),
        {
            name: 'settings-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                activeTab: state.activeTab,
                // Don't persist loading states, errors, or unsaved changes
            }),
        }
    )
);

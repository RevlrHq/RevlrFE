import { useState, useEffect, useCallback } from 'react';
import {
    DashboardPreferences,
    DashboardLayout,
    DashboardWidget,
} from '@/types/dashboard-customization';
import { DashboardStorage } from '@/lib/utils/dashboard-storage';

export interface UseDashboardCustomizationReturn {
    preferences: DashboardPreferences;
    currentLayout: DashboardLayout | null;
    layouts: DashboardLayout[];
    isCustomizing: boolean;

    // Layout management
    setCurrentLayout: (layoutId: string) => void;
    createLayout: (name: string, description?: string) => string;
    updateLayout: (layout: DashboardLayout) => void;
    deleteLayout: (layoutId: string) => boolean;
    duplicateLayout: (layoutId: string, newName: string) => string | null;

    // Widget management
    updateWidgetVisibility: (widgetId: string, isVisible: boolean) => void;
    updateWidgetPosition: (
        widgetId: string,
        position: DashboardWidget['position']
    ) => void;
    updateWidgetConfig: (
        widgetId: string,
        config: Record<string, unknown>
    ) => void;
    resetWidgetPositions: () => void;

    // Preferences
    updatePreferences: (updates: Partial<DashboardPreferences>) => void;

    // Customization mode
    toggleCustomization: () => void;
    exitCustomization: () => void;

    // Import/Export
    exportLayout: (layoutId: string) => string | null;
    importLayout: (layoutData: string) => boolean;

    // Reset
    resetToDefault: () => void;

    // Loading state
    isLoading: boolean;
}

export const useDashboardCustomization =
    (): UseDashboardCustomizationReturn => {
        const [preferences, setPreferences] = useState<DashboardPreferences>(
            () => DashboardStorage.getPreferences()
        );
        const [isCustomizing, setIsCustomizing] = useState(false);
        const [isLoading, setIsLoading] = useState(true);

        // Initialize preferences on mount
        useEffect(() => {
            const loadPreferences = () => {
                try {
                    const loadedPreferences = DashboardStorage.getPreferences();
                    setPreferences(loadedPreferences);
                } catch (error) {
                    console.debug(
                        'Failed to load dashboard preferences:',
                        error
                    );
                } finally {
                    setIsLoading(false);
                }
            };

            loadPreferences();
        }, []);

        // Save preferences whenever they change
        useEffect(() => {
            if (!isLoading) {
                DashboardStorage.savePreferences(preferences);
            }
        }, [preferences, isLoading]);

        const currentLayout =
            preferences.layouts.find(
                (layout) => layout.id === preferences.currentLayoutId
            ) || null;

        const setCurrentLayout = useCallback((layoutId: string) => {
            setPreferences((prev) => ({
                ...prev,
                currentLayoutId: layoutId,
            }));
        }, []);

        const createLayout = useCallback(
            (name: string, description?: string): string => {
                const newLayoutId = `layout_${Date.now()}`;
                const newLayout: DashboardLayout = {
                    id: newLayoutId,
                    name,
                    description,
                    isDefault: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    widgets: currentLayout ? [...currentLayout.widgets] : [],
                };

                setPreferences((prev) => ({
                    ...prev,
                    layouts: [...prev.layouts, newLayout],
                }));

                return newLayoutId;
            },
            [currentLayout]
        );

        const updateLayout = useCallback((layout: DashboardLayout) => {
            setPreferences((prev) => ({
                ...prev,
                layouts: prev.layouts.map((l) =>
                    l.id === layout.id
                        ? { ...layout, updatedAt: new Date().toISOString() }
                        : l
                ),
            }));
        }, []);

        const deleteLayout = useCallback((layoutId: string): boolean => {
            if (layoutId === 'default') return false;

            setPreferences((prev) => {
                const newLayouts = prev.layouts.filter(
                    (l) => l.id !== layoutId
                );
                const newCurrentLayoutId =
                    prev.currentLayoutId === layoutId
                        ? 'default'
                        : prev.currentLayoutId;

                return {
                    ...prev,
                    layouts: newLayouts,
                    currentLayoutId: newCurrentLayoutId,
                };
            });

            return true;
        }, []);

        const duplicateLayout = useCallback(
            (layoutId: string, newName: string): string | null => {
                const layoutToDuplicate = preferences.layouts.find(
                    (l) => l.id === layoutId
                );
                if (!layoutToDuplicate) return null;

                const newLayoutId = `layout_${Date.now()}`;
                const duplicatedLayout: DashboardLayout = {
                    ...layoutToDuplicate,
                    id: newLayoutId,
                    name: newName,
                    isDefault: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                setPreferences((prev) => ({
                    ...prev,
                    layouts: [...prev.layouts, duplicatedLayout],
                }));

                return newLayoutId;
            },
            [preferences.layouts]
        );

        const updateWidgetVisibility = useCallback(
            (widgetId: string, isVisible: boolean) => {
                if (!currentLayout) return;

                const updatedLayout = {
                    ...currentLayout,
                    widgets: currentLayout.widgets.map((widget) =>
                        widget.id === widgetId
                            ? { ...widget, isVisible }
                            : widget
                    ),
                };

                updateLayout(updatedLayout);
            },
            [currentLayout, updateLayout]
        );

        const updateWidgetPosition = useCallback(
            (widgetId: string, position: DashboardWidget['position']) => {
                if (!currentLayout) return;

                const updatedLayout = {
                    ...currentLayout,
                    widgets: currentLayout.widgets.map((widget) =>
                        widget.id === widgetId
                            ? { ...widget, position }
                            : widget
                    ),
                };

                updateLayout(updatedLayout);
            },
            [currentLayout, updateLayout]
        );

        const updateWidgetConfig = useCallback(
            (widgetId: string, config: Record<string, unknown>) => {
                if (!currentLayout) return;

                const updatedLayout = {
                    ...currentLayout,
                    widgets: currentLayout.widgets.map((widget) =>
                        widget.id === widgetId
                            ? {
                                  ...widget,
                                  config: { ...widget.config, ...config },
                              }
                            : widget
                    ),
                };

                updateLayout(updatedLayout);
            },
            [currentLayout, updateLayout]
        );

        const resetWidgetPositions = useCallback(() => {
            if (!currentLayout) return;

            // Reset to default positions
            const defaultLayout = preferences.layouts.find(
                (l) => l.id === 'default'
            );
            if (!defaultLayout) return;

            const updatedLayout = {
                ...currentLayout,
                widgets: currentLayout.widgets.map((widget) => {
                    const defaultWidget = defaultLayout.widgets.find(
                        (w) => w.id === widget.id
                    );
                    return defaultWidget
                        ? { ...widget, position: defaultWidget.position }
                        : widget;
                }),
            };

            updateLayout(updatedLayout);
        }, [currentLayout, preferences.layouts, updateLayout]);

        const updatePreferences = useCallback(
            (updates: Partial<DashboardPreferences>) => {
                setPreferences((prev) => ({ ...prev, ...updates }));
            },
            []
        );

        const toggleCustomization = useCallback(() => {
            setIsCustomizing((prev) => !prev);
        }, []);

        const exitCustomization = useCallback(() => {
            setIsCustomizing(false);
        }, []);

        const exportLayout = useCallback((layoutId: string): string | null => {
            return DashboardStorage.exportLayout(layoutId);
        }, []);

        const importLayout = useCallback((layoutData: string): boolean => {
            const success = DashboardStorage.importLayout(layoutData);
            if (success) {
                // Reload preferences to include the imported layout
                setPreferences(DashboardStorage.getPreferences());
            }
            return success;
        }, []);

        const resetToDefault = useCallback(() => {
            DashboardStorage.resetToDefault();
            setPreferences(DashboardStorage.getPreferences());
            setIsCustomizing(false);
        }, []);

        return {
            preferences,
            currentLayout,
            layouts: preferences.layouts,
            isCustomizing,

            // Layout management
            setCurrentLayout,
            createLayout,
            updateLayout,
            deleteLayout,
            duplicateLayout,

            // Widget management
            updateWidgetVisibility,
            updateWidgetPosition,
            updateWidgetConfig,
            resetWidgetPositions,

            // Preferences
            updatePreferences,

            // Customization mode
            toggleCustomization,
            exitCustomization,

            // Import/Export
            exportLayout,
            importLayout,

            // Reset
            resetToDefault,

            // Loading state
            isLoading,
        };
    };

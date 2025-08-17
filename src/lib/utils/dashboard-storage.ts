import {
    DashboardPreferences,
    DashboardLayout,
    DashboardWidget,
} from '@/types/dashboard-customization';

const STORAGE_KEYS = {
    DASHBOARD_PREFERENCES: 'revlr_dashboard_preferences',
    DASHBOARD_LAYOUTS: 'revlr_dashboard_layouts',
    CURRENT_LAYOUT: 'revlr_current_layout',
} as const;

// Default dashboard layout
const createDefaultLayout = (): DashboardLayout => ({
    id: 'default',
    name: 'Default Layout',
    description: 'The standard dashboard layout',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    widgets: [
        {
            id: 'statistics',
            title: 'Statistics Overview',
            type: 'statistics',
            isVisible: true,
            position: { x: 0, y: 0, width: 12, height: 4 },
            config: {
                showGrowthIndicators: true,
                showComparisons: true,
                animateCounters: true,
            },
        },
        {
            id: 'analytics',
            title: 'Performance Analytics',
            type: 'analytics',
            isVisible: true,
            position: { x: 0, y: 4, width: 8, height: 6 },
            config: {
                chartType: 'line',
                showLegend: true,
                showDataLabels: false,
            },
        },
        {
            id: 'quick-actions',
            title: 'Quick Actions',
            type: 'quick-actions',
            isVisible: true,
            position: { x: 8, y: 4, width: 4, height: 6 },
        },
        {
            id: 'recent-events',
            title: 'Recent Events',
            type: 'events',
            isVisible: true,
            position: { x: 0, y: 10, width: 8, height: 6 },
            config: {
                maxItems: 5,
                showStatus: true,
                showThumbnails: true,
            },
        },
        {
            id: 'revenue',
            title: 'Revenue Overview',
            type: 'revenue',
            isVisible: true,
            position: { x: 8, y: 10, width: 4, height: 6 },
            config: {
                currency: 'NGN',
                showProjections: true,
                showBreakdown: false,
            },
        },
    ],
});

// Default preferences
const createDefaultPreferences = (): DashboardPreferences => ({
    currentLayoutId: 'default',
    layouts: [createDefaultLayout()],
    theme: 'auto',
    compactMode: false,
    showAnimations: true,
    autoRefresh: true,
    refreshInterval: 300, // 5 minutes
    defaultTimeRange: '30d',
});

// Storage utilities
export class DashboardStorage {
    private static isClient = typeof window !== 'undefined';

    static getPreferences(): DashboardPreferences {
        if (!this.isClient) return createDefaultPreferences();

        try {
            const stored = localStorage.getItem(
                STORAGE_KEYS.DASHBOARD_PREFERENCES
            );
            if (stored) {
                const preferences = JSON.parse(stored) as DashboardPreferences;
                // Ensure we have at least the default layout
                if (preferences.layouts.length === 0) {
                    preferences.layouts = [createDefaultLayout()];
                }
                return preferences;
            }
        } catch (error) {
            console.warn('Failed to load dashboard preferences:', error);
        }

        return createDefaultPreferences();
    }

    static savePreferences(preferences: DashboardPreferences): void {
        if (!this.isClient) return;

        try {
            localStorage.setItem(
                STORAGE_KEYS.DASHBOARD_PREFERENCES,
                JSON.stringify(preferences)
            );
        } catch (error) {
            console.error('Failed to save dashboard preferences:', error);
        }
    }

    static getCurrentLayout(): DashboardLayout | null {
        const preferences = this.getPreferences();
        return (
            preferences.layouts.find(
                (layout) => layout.id === preferences.currentLayoutId
            ) || null
        );
    }

    static saveLayout(layout: DashboardLayout): void {
        const preferences = this.getPreferences();
        const existingIndex = preferences.layouts.findIndex(
            (l) => l.id === layout.id
        );

        const updatedLayout = {
            ...layout,
            updatedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            preferences.layouts[existingIndex] = updatedLayout;
        } else {
            preferences.layouts.push(updatedLayout);
        }

        this.savePreferences(preferences);
    }

    static deleteLayout(layoutId: string): boolean {
        if (layoutId === 'default') return false; // Cannot delete default layout

        const preferences = this.getPreferences();
        const layoutIndex = preferences.layouts.findIndex(
            (l) => l.id === layoutId
        );

        if (layoutIndex >= 0) {
            preferences.layouts.splice(layoutIndex, 1);

            // If we deleted the current layout, switch to default
            if (preferences.currentLayoutId === layoutId) {
                preferences.currentLayoutId = 'default';
            }

            this.savePreferences(preferences);
            return true;
        }

        return false;
    }

    static setCurrentLayout(layoutId: string): void {
        const preferences = this.getPreferences();
        const layoutExists = preferences.layouts.some((l) => l.id === layoutId);

        if (layoutExists) {
            preferences.currentLayoutId = layoutId;
            this.savePreferences(preferences);
        }
    }

    static updateWidgetVisibility(widgetId: string, isVisible: boolean): void {
        const preferences = this.getPreferences();
        const currentLayout = preferences.layouts.find(
            (l) => l.id === preferences.currentLayoutId
        );

        if (currentLayout) {
            const widget = currentLayout.widgets.find((w) => w.id === widgetId);
            if (widget) {
                widget.isVisible = isVisible;
                this.saveLayout(currentLayout);
            }
        }
    }

    static updateWidgetPosition(
        widgetId: string,
        position: DashboardWidget['position']
    ): void {
        const preferences = this.getPreferences();
        const currentLayout = preferences.layouts.find(
            (l) => l.id === preferences.currentLayoutId
        );

        if (currentLayout) {
            const widget = currentLayout.widgets.find((w) => w.id === widgetId);
            if (widget) {
                widget.position = position;
                this.saveLayout(currentLayout);
            }
        }
    }

    static updateWidgetConfig(
        widgetId: string,
        config: Record<string, unknown>
    ): void {
        const preferences = this.getPreferences();
        const currentLayout = preferences.layouts.find(
            (l) => l.id === preferences.currentLayoutId
        );

        if (currentLayout) {
            const widget = currentLayout.widgets.find((w) => w.id === widgetId);
            if (widget) {
                widget.config = { ...widget.config, ...config };
                this.saveLayout(currentLayout);
            }
        }
    }

    static exportLayout(layoutId: string): string | null {
        const preferences = this.getPreferences();
        const layout = preferences.layouts.find((l) => l.id === layoutId);

        if (layout) {
            return JSON.stringify(layout, null, 2);
        }

        return null;
    }

    static importLayout(layoutData: string): boolean {
        try {
            const layout = JSON.parse(layoutData) as DashboardLayout;

            // Validate layout structure
            if (!layout.id || !layout.name || !Array.isArray(layout.widgets)) {
                return false;
            }

            // Generate new ID if layout already exists
            const preferences = this.getPreferences();
            if (preferences.layouts.some((l) => l.id === layout.id)) {
                layout.id = `${layout.id}_${Date.now()}`;
                layout.name = `${layout.name} (Imported)`;
            }

            layout.createdAt = new Date().toISOString();
            layout.updatedAt = new Date().toISOString();
            layout.isDefault = false;

            this.saveLayout(layout);
            return true;
        } catch (error) {
            console.error('Failed to import layout:', error);
            return false;
        }
    }

    static resetToDefault(): void {
        if (!this.isClient) return;

        try {
            localStorage.removeItem(STORAGE_KEYS.DASHBOARD_PREFERENCES);
        } catch (error) {
            console.error('Failed to reset dashboard preferences:', error);
        }
    }
}

export interface DashboardWidget {
    id: string;
    title: string;
    type:
        | 'statistics'
        | 'analytics'
        | 'events'
        | 'revenue'
        | 'quick-actions'
        | 'notifications';
    isVisible: boolean;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config?: Record<string, unknown>;
}

export interface DashboardLayout {
    id: string;
    name: string;
    description?: string;
    widgets: DashboardWidget[];
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardPreferences {
    currentLayoutId: string;
    layouts: DashboardLayout[];
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showAnimations: boolean;
    autoRefresh: boolean;
    refreshInterval: number; // in seconds
    defaultTimeRange: '7d' | '30d' | '90d' | '1y';
}

export interface WidgetConfig {
    statistics?: {
        showGrowthIndicators: boolean;
        showComparisons: boolean;
        animateCounters: boolean;
    };
    analytics?: {
        chartType: 'line' | 'bar' | 'area';
        showLegend: boolean;
        showDataLabels: boolean;
    };
    events?: {
        maxItems: number;
        showStatus: boolean;
        showThumbnails: boolean;
    };
    revenue?: {
        currency: string;
        showProjections: boolean;
        showBreakdown: boolean;
    };
}

export interface DragItem {
    id: string;
    type: string;
    position: { x: number; y: number };
}

export interface DropResult {
    draggedId: string;
    targetId?: string;
    position: { x: number; y: number };
}

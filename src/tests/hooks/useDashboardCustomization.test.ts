import { renderHook, act } from '@testing-library/react';
import { useDashboardCustomization } from '@/hooks/useDashboardCustomization';
import { DashboardStorage } from '@/lib/utils/dashboard-storage';

// Mock the storage utilities
jest.mock('@/lib/utils/dashboard-storage');
const mockDashboardStorage = DashboardStorage as jest.Mocked<
    typeof DashboardStorage
>;

const mockLayout = {
    id: 'test-layout',
    name: 'Test Layout',
    description: 'A test layout',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    widgets: [
        {
            id: 'statistics',
            title: 'Statistics Overview',
            type: 'statistics' as const,
            isVisible: true,
            position: { x: 0, y: 0, width: 12, height: 4 },
            config: { showGrowthIndicators: true },
        },
    ],
};

const defaultLayout = {
    id: 'default',
    name: 'Default Layout',
    description: 'Default layout',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    widgets: [
        {
            id: 'statistics',
            title: 'Statistics Overview',
            type: 'statistics' as const,
            isVisible: true,
            position: { x: 0, y: 0, width: 12, height: 4 },
            config: { showGrowthIndicators: true },
        },
    ],
};

const mockPreferences = {
    currentLayoutId: 'test-layout',
    layouts: [defaultLayout, mockLayout],
    theme: 'light' as const,
    compactMode: false,
    showAnimations: true,
    autoRefresh: true,
    refreshInterval: 300,
    defaultTimeRange: '30d' as const,
};

describe('useDashboardCustomization', () => {
    beforeEach(() => {
        mockDashboardStorage.getPreferences.mockReturnValue(mockPreferences);
        mockDashboardStorage.savePreferences.mockImplementation(() => {});
        mockDashboardStorage.saveLayout.mockImplementation(() => {});
        mockDashboardStorage.deleteLayout.mockReturnValue(true);
        mockDashboardStorage.exportLayout.mockReturnValue(
            JSON.stringify(mockLayout)
        );
        mockDashboardStorage.importLayout.mockReturnValue(true);
        mockDashboardStorage.resetToDefault.mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with preferences from storage', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        expect(result.current.preferences).toEqual(mockPreferences);
        expect(result.current.currentLayout).toEqual(mockLayout);
        expect(result.current.layouts).toEqual([mockLayout]);
        expect(result.current.isCustomizing).toBe(false);
    });

    it('toggles customization mode', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            result.current.toggleCustomization();
        });

        expect(result.current.isCustomizing).toBe(true);

        act(() => {
            result.current.toggleCustomization();
        });

        expect(result.current.isCustomizing).toBe(false);
    });

    it('exits customization mode', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            result.current.toggleCustomization();
        });

        expect(result.current.isCustomizing).toBe(true);

        act(() => {
            result.current.exitCustomization();
        });

        expect(result.current.isCustomizing).toBe(false);
    });

    it('creates new layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        let newLayoutId: string;

        act(() => {
            newLayoutId = result.current.createLayout(
                'New Layout',
                'A new layout'
            );
        });

        expect(newLayoutId!).toBeDefined();
        expect(result.current.layouts).toHaveLength(2);

        const newLayout = result.current.layouts.find(
            (l) => l.id === newLayoutId
        );
        expect(newLayout).toBeDefined();
        expect(newLayout!.name).toBe('New Layout');
        expect(newLayout!.description).toBe('A new layout');
        expect(newLayout!.isDefault).toBe(false);
    });

    it('sets current layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            const newLayoutId = result.current.createLayout('New Layout');
            result.current.setCurrentLayout(newLayoutId);
        });

        expect(result.current.preferences.currentLayoutId).not.toBe(
            'test-layout'
        );
    });

    it('updates layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        const updatedLayout = {
            ...mockLayout,
            name: 'Updated Layout',
        };

        act(() => {
            result.current.updateLayout(updatedLayout);
        });

        expect(result.current.currentLayout!.name).toBe('Updated Layout');
    });

    it('deletes layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            const newLayoutId = result.current.createLayout('Layout to Delete');
            const success = result.current.deleteLayout(newLayoutId);
            expect(success).toBe(true);
        });

        expect(result.current.layouts).toHaveLength(1);
    });

    it('cannot delete default layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            const success = result.current.deleteLayout('default');
            expect(success).toBe(false);
        });
    });

    it('duplicates layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        let duplicatedLayoutId: string | null;

        act(() => {
            duplicatedLayoutId = result.current.duplicateLayout(
                'test-layout',
                'Duplicated Layout'
            );
        });

        expect(duplicatedLayoutId).toBeDefined();
        expect(result.current.layouts).toHaveLength(2);

        const duplicatedLayout = result.current.layouts.find(
            (l) => l.id === duplicatedLayoutId
        );
        expect(duplicatedLayout).toBeDefined();
        expect(duplicatedLayout!.name).toBe('Duplicated Layout');
        expect(duplicatedLayout!.widgets).toHaveLength(
            mockLayout.widgets.length
        );
    });

    it('updates widget visibility', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            result.current.updateWidgetVisibility('statistics', false);
        });

        const statisticsWidget = result.current.currentLayout!.widgets.find(
            (w) => w.id === 'statistics'
        );
        expect(statisticsWidget!.isVisible).toBe(false);
    });

    it('updates widget position', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        const newPosition = { x: 2, y: 2, width: 6, height: 4 };

        act(() => {
            result.current.updateWidgetPosition('statistics', newPosition);
        });

        const statisticsWidget = result.current.currentLayout!.widgets.find(
            (w) => w.id === 'statistics'
        );
        expect(statisticsWidget!.position).toEqual(newPosition);
    });

    it('updates widget config', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        const newConfig = {
            showGrowthIndicators: false,
            animateCounters: true,
        };

        act(() => {
            result.current.updateWidgetConfig('statistics', newConfig);
        });

        const statisticsWidget = result.current.currentLayout!.widgets.find(
            (w) => w.id === 'statistics'
        );
        expect(statisticsWidget!.config).toEqual({
            showGrowthIndicators: false,
            animateCounters: true,
        });
    });

    it('updates preferences', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            result.current.updatePreferences({
                compactMode: true,
                showAnimations: false,
            });
        });

        expect(result.current.preferences.compactMode).toBe(true);
        expect(result.current.preferences.showAnimations).toBe(false);
    });

    it('exports layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        const exportedData = result.current.exportLayout('test-layout');

        expect(exportedData).toBe(JSON.stringify(mockLayout));
        expect(mockDashboardStorage.exportLayout).toHaveBeenCalledWith(
            'test-layout'
        );
    });

    it('imports layout', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        const layoutData = JSON.stringify({
            id: 'imported-layout',
            name: 'Imported Layout',
            widgets: [],
            isDefault: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        });

        act(() => {
            const success = result.current.importLayout(layoutData);
            expect(success).toBe(true);
        });

        expect(mockDashboardStorage.importLayout).toHaveBeenCalledWith(
            layoutData
        );
    });

    it('resets to default', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        act(() => {
            result.current.resetToDefault();
        });

        expect(mockDashboardStorage.resetToDefault).toHaveBeenCalled();
        expect(result.current.isCustomizing).toBe(false);
    });

    it('resets widget positions', () => {
        const { result } = renderHook(() => useDashboardCustomization());

        // First, modify a widget position
        act(() => {
            result.current.updateWidgetPosition('statistics', {
                x: 5,
                y: 5,
                width: 6,
                height: 3,
            });
        });

        // Then reset positions
        act(() => {
            result.current.resetWidgetPositions();
        });

        // The position should be reset to default (assuming default layout exists)
        const statisticsWidget = result.current.currentLayout!.widgets.find(
            (w) => w.id === 'statistics'
        );
        expect(statisticsWidget!.position).toEqual({
            x: 0,
            y: 0,
            width: 12,
            height: 4,
        });
    });
});

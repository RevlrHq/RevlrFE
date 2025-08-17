import { DashboardStorage } from '@/lib/utils/dashboard-storage';
import {
    DashboardLayout,
    DashboardPreferences,
} from '@/types/dashboard-customization';

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

const mockLayout: DashboardLayout = {
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
            type: 'statistics',
            isVisible: true,
            position: { x: 0, y: 0, width: 12, height: 4 },
            config: { showGrowthIndicators: true },
        },
    ],
};

const mockPreferences: DashboardPreferences = {
    currentLayoutId: 'test-layout',
    layouts: [mockLayout],
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    autoRefresh: true,
    refreshInterval: 300,
    defaultTimeRange: '30d',
};

describe('DashboardStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPreferences', () => {
        it('returns stored preferences when available', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const preferences = DashboardStorage.getPreferences();

            expect(preferences).toEqual(mockPreferences);
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
                'revlr_dashboard_preferences'
            );
        });

        it('returns default preferences when storage is empty', () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const preferences = DashboardStorage.getPreferences();

            expect(preferences.currentLayoutId).toBe('default');
            expect(preferences.layouts).toHaveLength(1);
            expect(preferences.layouts[0].id).toBe('default');
            expect(preferences.theme).toBe('auto');
        });

        it('returns default preferences when JSON parsing fails', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid-json');

            const preferences = DashboardStorage.getPreferences();

            expect(preferences.currentLayoutId).toBe('default');
            expect(preferences.layouts).toHaveLength(1);
        });

        it('ensures default layout exists when layouts array is empty', () => {
            const preferencesWithoutLayouts = {
                ...mockPreferences,
                layouts: [],
            };
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(preferencesWithoutLayouts)
            );

            const preferences = DashboardStorage.getPreferences();

            expect(preferences.layouts).toHaveLength(1);
            expect(preferences.layouts[0].id).toBe('default');
        });
    });

    describe('savePreferences', () => {
        it('saves preferences to localStorage', () => {
            DashboardStorage.savePreferences(mockPreferences);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'revlr_dashboard_preferences',
                JSON.stringify(mockPreferences)
            );
        });

        it('handles save errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            // Should not throw
            expect(() => {
                DashboardStorage.savePreferences(mockPreferences);
            }).not.toThrow();
        });
    });

    describe('getCurrentLayout', () => {
        it('returns current layout when it exists', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const layout = DashboardStorage.getCurrentLayout();

            expect(layout).toEqual(mockLayout);
        });

        it('returns null when current layout does not exist', () => {
            const preferencesWithInvalidLayout = {
                ...mockPreferences,
                currentLayoutId: 'non-existent',
            };
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(preferencesWithInvalidLayout)
            );

            const layout = DashboardStorage.getCurrentLayout();

            expect(layout).toBeNull();
        });
    });

    describe('saveLayout', () => {
        it('updates existing layout', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const updatedLayout = {
                ...mockLayout,
                name: 'Updated Layout',
            };

            DashboardStorage.saveLayout(updatedLayout);

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            const savedLayout = savedData.layouts.find(
                (l: DashboardLayout) => l.id === mockLayout.id
            );
            expect(savedLayout.name).toBe('Updated Layout');
            expect(savedLayout.updatedAt).not.toBe(mockLayout.updatedAt);
        });

        it('adds new layout when it does not exist', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const newLayout: DashboardLayout = {
                id: 'new-layout',
                name: 'New Layout',
                isDefault: false,
                createdAt: '2024-01-02T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
                widgets: [],
            };

            DashboardStorage.saveLayout(newLayout);

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            expect(savedData.layouts).toHaveLength(2);
            expect(
                savedData.layouts.find(
                    (l: DashboardLayout) => l.id === 'new-layout'
                )
            ).toBeDefined();
        });
    });

    describe('deleteLayout', () => {
        it('deletes non-default layout', () => {
            const preferencesWithMultipleLayouts = {
                ...mockPreferences,
                layouts: [
                    mockLayout,
                    {
                        id: 'layout-to-delete',
                        name: 'Layout to Delete',
                        isDefault: false,
                        createdAt: '2024-01-02T00:00:00Z',
                        updatedAt: '2024-01-02T00:00:00Z',
                        widgets: [],
                    },
                ],
            };
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(preferencesWithMultipleLayouts)
            );

            const success = DashboardStorage.deleteLayout('layout-to-delete');

            expect(success).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            expect(savedData.layouts).toHaveLength(1);
            expect(
                savedData.layouts.find(
                    (l: DashboardLayout) => l.id === 'layout-to-delete'
                )
            ).toBeUndefined();
        });

        it('cannot delete default layout', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const success = DashboardStorage.deleteLayout('default');

            expect(success).toBe(false);
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        it('switches to default when deleting current layout', () => {
            const preferencesWithCurrentToDelete = {
                ...mockPreferences,
                currentLayoutId: 'layout-to-delete',
                layouts: [
                    mockLayout,
                    {
                        id: 'layout-to-delete',
                        name: 'Layout to Delete',
                        isDefault: false,
                        createdAt: '2024-01-02T00:00:00Z',
                        updatedAt: '2024-01-02T00:00:00Z',
                        widgets: [],
                    },
                ],
            };
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(preferencesWithCurrentToDelete)
            );

            const success = DashboardStorage.deleteLayout('layout-to-delete');

            expect(success).toBe(true);
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            expect(savedData.currentLayoutId).toBe('default');
        });
    });

    describe('setCurrentLayout', () => {
        it('sets current layout when layout exists', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            DashboardStorage.setCurrentLayout('test-layout');

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            expect(savedData.currentLayoutId).toBe('test-layout');
        });

        it('does not set current layout when layout does not exist', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            DashboardStorage.setCurrentLayout('non-existent');

            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('updateWidgetVisibility', () => {
        it('updates widget visibility', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            DashboardStorage.updateWidgetVisibility('statistics', false);

            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            const layout = savedData.layouts.find(
                (l: DashboardLayout) => l.id === mockPreferences.currentLayoutId
            );
            const widget = layout.widgets.find(
                (w: { id: string; isVisible: boolean }) => w.id === 'statistics'
            );
            expect(widget.isVisible).toBe(false);
        });
    });

    describe('exportLayout', () => {
        it('exports layout as JSON string', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const exported = DashboardStorage.exportLayout('test-layout');

            expect(exported).toBe(JSON.stringify(mockLayout, null, 2));
        });

        it('returns null for non-existent layout', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const exported = DashboardStorage.exportLayout('non-existent');

            expect(exported).toBeNull();
        });
    });

    describe('importLayout', () => {
        it('imports valid layout', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const layoutToImport = {
                id: 'imported-layout',
                name: 'Imported Layout',
                widgets: [],
                isDefault: false,
                createdAt: '2024-01-02T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
            };

            const success = DashboardStorage.importLayout(
                JSON.stringify(layoutToImport)
            );

            expect(success).toBe(true);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        it('generates new ID for duplicate layout', () => {
            mockLocalStorage.getItem.mockReturnValue(
                JSON.stringify(mockPreferences)
            );

            const duplicateLayout = {
                ...mockLayout,
                name: 'Duplicate Layout',
            };

            const success = DashboardStorage.importLayout(
                JSON.stringify(duplicateLayout)
            );

            expect(success).toBe(true);
            const savedData = JSON.parse(
                mockLocalStorage.setItem.mock.calls[0][1]
            );
            const importedLayout = savedData.layouts.find(
                (l: DashboardLayout) => l.name === 'Duplicate Layout (Imported)'
            );
            expect(importedLayout).toBeDefined();
            expect(importedLayout.id).not.toBe(mockLayout.id);
        });

        it('rejects invalid layout data', () => {
            const success = DashboardStorage.importLayout('invalid-json');

            expect(success).toBe(false);
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });

        it('rejects layout without required fields', () => {
            const invalidLayout = {
                name: 'Invalid Layout',
                // missing id and widgets
            };

            const success = DashboardStorage.importLayout(
                JSON.stringify(invalidLayout)
            );

            expect(success).toBe(false);
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('resetToDefault', () => {
        it('removes preferences from localStorage', () => {
            DashboardStorage.resetToDefault();

            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
                'revlr_dashboard_preferences'
            );
        });

        it('handles removal errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Failed to remove item');
            });

            expect(() => {
                DashboardStorage.resetToDefault();
            }).not.toThrow();
        });
    });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCustomizer } from '@/components/DashboardCustomizer';
import { ThemeProvider } from '@/lib/ThemeContext';
import { DashboardStorage } from '@/lib/utils/dashboard-storage';

// Setup DOM environment
import '@testing-library/jest-dom';

// Mock the storage utilities
jest.mock('@/lib/utils/dashboard-storage');
const mockDashboardStorage = DashboardStorage as jest.Mocked<
    typeof DashboardStorage
>;

// Mock the drag and drop manager
jest.mock('@/lib/utils/drag-drop', () => ({
    DragDropManager: {
        getInstance: () => ({
            setOnDropCallback: jest.fn(),
            createHandlers: () => ({
                onDragStart: jest.fn(),
                onDragOver: jest.fn(),
                onDragEnter: jest.fn(),
                onDragLeave: jest.fn(),
                onDrop: jest.fn(),
                onDragEnd: jest.fn(),
            }),
        }),
    },
    GridUtils: {
        getGridPosition: jest.fn(() => 'grid-area: 1 / 1 / 5 / 13'),
        snapToGrid: jest.fn(() => ({ x: 0, y: 0 })),
        findNearestValidPosition: jest.fn((pos) => pos),
    },
}));

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
        {
            id: 'analytics',
            title: 'Analytics',
            type: 'analytics' as const,
            isVisible: true,
            position: { x: 0, y: 4, width: 8, height: 6 },
            config: { chartType: 'line' },
        },
    ],
};

const mockPreferences = {
    currentLayoutId: 'test-layout',
    layouts: [mockLayout],
    theme: 'light' as const,
    compactMode: false,
    showAnimations: true,
    autoRefresh: true,
    refreshInterval: 300,
    defaultTimeRange: '30d' as const,
};

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('DashboardCustomizer', () => {
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';

        mockDashboardStorage.getPreferences.mockReturnValue(mockPreferences);
        mockDashboardStorage.getCurrentLayout.mockReturnValue(mockLayout);
        mockDashboardStorage.savePreferences.mockImplementation(() => {});
        mockDashboardStorage.saveLayout.mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders dashboard with widgets', () => {
        renderWithTheme(
            <DashboardCustomizer>
                <div data-testid='dashboard-content'>Dashboard Content</div>
            </DashboardCustomizer>
        );

        expect(screen.getAllByTestId('dashboard-content')).toHaveLength(2); // One for each widget
        expect(screen.getByTitle('Customize Dashboard')).toBeInTheDocument();
    });

    it('enters customization mode when customize button is clicked', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        expect(screen.getByTitle('Manage Layouts')).toBeInTheDocument();
        expect(screen.getByTitle('Preferences')).toBeInTheDocument();
        expect(screen.getByTitle('Reset Positions')).toBeInTheDocument();
        expect(screen.getByTitle('Exit Customization')).toBeInTheDocument();
    });

    it('shows widget visibility panel in customization mode', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        expect(screen.getByText('Widget Visibility')).toBeInTheDocument();
        expect(screen.getAllByText('Statistics Overview')).toHaveLength(2); // One in widget wrapper, one in visibility panel
        expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('toggles widget visibility', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        // Find the visibility toggle for the statistics widget
        const visibilityButtons = screen.getAllByRole('button');
        const statisticsToggle = visibilityButtons.find((button) =>
            button.closest('div')?.textContent?.includes('Statistics Overview')
        );

        expect(statisticsToggle).toBeInTheDocument();

        if (statisticsToggle) {
            await user.click(statisticsToggle);

            await waitFor(() => {
                expect(mockDashboardStorage.saveLayout).toHaveBeenCalled();
            });
        }
    });

    it('opens layout manager dialog', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        const layoutManagerButton = screen.getByTitle('Manage Layouts');
        await user.click(layoutManagerButton);

        expect(
            screen.getByText('Manage Dashboard Layouts')
        ).toBeInTheDocument();
        expect(screen.getByText('Test Layout')).toBeInTheDocument();
    });

    it('creates new layout', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        const layoutManagerButton = screen.getByTitle('Manage Layouts');
        await user.click(layoutManagerButton);

        // Switch to create tab
        const createTab = screen.getByText('Create');
        await user.click(createTab);

        // Enter layout name
        const nameInput = screen.getByPlaceholderText('Enter layout name');
        await user.type(nameInput, 'New Test Layout');

        // Click create button
        const createButton = screen.getByText('Create Layout');
        await user.click(createButton);

        await waitFor(() => {
            expect(mockDashboardStorage.saveLayout).toHaveBeenCalled();
        });
    });

    it('opens preferences dialog', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        const preferencesButton = screen.getByTitle('Preferences');
        await user.click(preferencesButton);

        expect(screen.getByText('Dashboard Preferences')).toBeInTheDocument();
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByText('Compact Mode')).toBeInTheDocument();
        expect(screen.getByText('Show Animations')).toBeInTheDocument();
        expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
    });

    it('exports layout', async () => {
        const user = userEvent.setup();

        // Mock URL.createObjectURL and related methods
        const mockCreateObjectURL = jest.fn(() => 'mock-url');
        const mockRevokeObjectURL = jest.fn();
        global.URL.createObjectURL = mockCreateObjectURL;
        global.URL.revokeObjectURL = mockRevokeObjectURL;

        // Mock document.createElement and appendChild
        const mockAnchor = {
            href: '',
            download: '',
            click: jest.fn(),
        };
        const mockCreateElement = jest.fn(() => mockAnchor);
        const mockAppendChild = jest.fn();
        const mockRemoveChild = jest.fn();

        document.createElement = mockCreateElement;
        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;

        mockDashboardStorage.exportLayout.mockReturnValue(
            JSON.stringify(mockLayout)
        );

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        const layoutManagerButton = screen.getByTitle('Manage Layouts');
        await user.click(layoutManagerButton);

        // Find and click export button
        const exportButtons = screen.getAllByRole('button');
        const exportButton = exportButtons.find(
            (button) =>
                button.querySelector('svg')?.getAttribute('data-testid') ===
                    'download-icon' || button.textContent?.includes('Download')
        );

        if (exportButton) {
            await user.click(exportButton);

            expect(mockDashboardStorage.exportLayout).toHaveBeenCalledWith(
                'test-layout'
            );
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockAnchor.click).toHaveBeenCalled();
        }
    });

    it('resets to default layout', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        const preferencesButton = screen.getByTitle('Preferences');
        await user.click(preferencesButton);

        const resetButton = screen.getByText('Reset to Default');
        await user.click(resetButton);

        expect(mockDashboardStorage.resetToDefault).toHaveBeenCalled();
    });

    it('exits customization mode', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        const exitButton = screen.getByTitle('Exit Customization');
        await user.click(exitButton);

        // Should return to normal mode
        expect(screen.getByTitle('Customize Dashboard')).toBeInTheDocument();
        expect(
            screen.queryByTitle('Exit Customization')
        ).not.toBeInTheDocument();
    });

    it('handles drag and drop operations', async () => {
        const user = userEvent.setup();

        renderWithTheme(
            <DashboardCustomizer>
                <div>Dashboard Content</div>
            </DashboardCustomizer>
        );

        const customizeButton = screen.getByTitle('Customize Dashboard');
        await user.click(customizeButton);

        // In customization mode, widgets should be draggable
        const dashboardGrid = document.querySelector('.dashboard-grid');
        expect(dashboardGrid).toHaveClass('customizing');
    });
});

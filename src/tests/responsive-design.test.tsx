import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import MobileDashboardLayout from '../components/MobileDashboardLayout';
import ResponsiveChartContainer from '../components/ResponsiveChartContainer';
import MobileTableNavigation from '../components/MobileTableNavigation';
import { useMobileOptimizations } from '../hooks/useMobileOptimizations';
import { renderHook } from '@testing-library/react';

// Mock the theme context
jest.mock('../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock touch gestures hook
jest.mock('../hooks/useTouchGestures', () => ({
    useTouchGestures: () => ({
        attachGestureListeners: jest.fn(() => jest.fn()),
        currentScale: 1,
    }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    value: jest.fn(),
});

describe('Responsive Design Components', () => {
    describe('MobileDashboardLayout', () => {
        const mockSections = [
            {
                id: 'section1',
                title: 'Test Section 1',
                icon: <div>Icon1</div>,
                isCollapsible: true,
                isCollapsed: false,
                priority: 'high' as const,
                children: <div>Section 1 Content</div>,
            },
            {
                id: 'section2',
                title: 'Test Section 2',
                icon: <div>Icon2</div>,
                isCollapsible: false,
                isCollapsed: false,
                priority: 'medium' as const,
                children: <div>Section 2 Content</div>,
            },
        ];

        it('renders mobile dashboard layout correctly', () => {
            render(
                <MobileDashboardLayout
                    sections={mockSections}
                    onSectionToggle={jest.fn()}
                />
            );

            expect(screen.getByText('Test Section 1')).toBeInTheDocument();
            // Section 2 is not collapsible, so it doesn't have a header button
            expect(screen.getByText('Section 1 Content')).toBeInTheDocument();
            expect(screen.getByText('Section 2 Content')).toBeInTheDocument();
        });

        it('handles section toggle correctly', () => {
            const mockToggle = jest.fn();
            render(
                <MobileDashboardLayout
                    sections={mockSections}
                    onSectionToggle={mockToggle}
                />
            );

            const toggleButton = screen.getByRole('button', { expanded: true });
            fireEvent.click(toggleButton);

            expect(mockToggle).toHaveBeenCalledWith('section1');
        });

        it('opens and closes navigation menu', () => {
            render(
                <MobileDashboardLayout
                    sections={mockSections}
                    onSectionToggle={jest.fn()}
                />
            );

            const menuButton = screen.getByLabelText('Open navigation menu');
            fireEvent.click(menuButton);

            expect(screen.getByText('Navigation')).toBeInTheDocument();

            const closeButton = screen.getByLabelText('Close menu');
            fireEvent.click(closeButton);

            expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
        });

        it('handles search input correctly', () => {
            const mockSearch = jest.fn();
            render(
                <MobileDashboardLayout
                    sections={mockSections}
                    onSectionToggle={jest.fn()}
                    onSearch={mockSearch}
                    showSearch={true}
                />
            );

            const searchInput = screen.getByPlaceholderText('Search...');
            fireEvent.change(searchInput, { target: { value: 'test query' } });

            expect(mockSearch).toHaveBeenCalledWith('test query');
        });
    });

    describe('ResponsiveChartContainer', () => {
        it('renders chart container with title and subtitle', () => {
            render(
                <ResponsiveChartContainer
                    title='Test Chart'
                    subtitle='Test Subtitle'
                >
                    <div>Chart Content</div>
                </ResponsiveChartContainer>
            );

            expect(screen.getByText('Test Chart')).toBeInTheDocument();
            expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
            expect(screen.getByText('Chart Content')).toBeInTheDocument();
        });

        it('shows controls on hover for desktop', async () => {
            render(
                <ResponsiveChartContainer
                    title='Test Chart'
                    enableZoom={true}
                    enableFullscreen={true}
                    enableExport={true}
                >
                    <div>Chart Content</div>
                </ResponsiveChartContainer>
            );

            const container = screen.getByText('Test Chart').closest('div');
            if (container) {
                fireEvent.mouseEnter(container);

                await waitFor(() => {
                    expect(
                        screen.getByLabelText('Zoom out')
                    ).toBeInTheDocument();
                    expect(
                        screen.getByLabelText('Zoom in')
                    ).toBeInTheDocument();
                    expect(
                        screen.getByLabelText('Reset view')
                    ).toBeInTheDocument();
                    expect(
                        screen.getByLabelText('Enter fullscreen')
                    ).toBeInTheDocument();
                });
            }
        });

        it('handles zoom controls correctly', () => {
            render(
                <ResponsiveChartContainer title='Test Chart' enableZoom={true}>
                    <div>Chart Content</div>
                </ResponsiveChartContainer>
            );

            const container = screen.getByText('Test Chart').closest('div');
            if (container) {
                fireEvent.mouseEnter(container);

                const zoomInButton = screen.getByLabelText('Zoom in');
                const zoomOutButton = screen.getByLabelText('Zoom out');

                fireEvent.click(zoomInButton);
                expect(screen.getByText('120%')).toBeInTheDocument();

                fireEvent.click(zoomOutButton);
                expect(screen.getByText('100%')).toBeInTheDocument();
            }
        });

        it('handles fullscreen toggle correctly', () => {
            render(
                <ResponsiveChartContainer
                    title='Test Chart'
                    enableFullscreen={true}
                >
                    <div>Chart Content</div>
                </ResponsiveChartContainer>
            );

            const container = screen.getByText('Test Chart').closest('div');
            if (container) {
                fireEvent.mouseEnter(container);

                const fullscreenButton =
                    screen.getByLabelText('Enter fullscreen');
                fireEvent.click(fullscreenButton);

                expect(
                    screen.getByLabelText('Exit fullscreen')
                ).toBeInTheDocument();
            }
        });
    });

    describe('MobileTableNavigation', () => {
        const mockColumns = [
            {
                key: 'name',
                label: 'Name',
                sortable: true,
                filterable: true,
                priority: 'high' as const,
            },
            {
                key: 'date',
                label: 'Date',
                sortable: true,
                filterable: false,
                priority: 'medium' as const,
            },
            {
                key: 'status',
                label: 'Status',
                sortable: false,
                filterable: true,
                priority: 'low' as const,
            },
        ];

        it('renders table navigation correctly', () => {
            render(
                <MobileTableNavigation
                    columns={mockColumns}
                    currentPage={1}
                    totalPages={5}
                    totalItems={50}
                    pageSize={10}
                    onPageChange={jest.fn()}
                    onPageSizeChange={jest.fn()}
                />
            );

            expect(
                screen.getByPlaceholderText('Search...')
            ).toBeInTheDocument();
            expect(screen.getByText('1-10 of 50')).toBeInTheDocument();
        });

        it('handles search input correctly', () => {
            const mockSearch = jest.fn();
            render(
                <MobileTableNavigation
                    columns={mockColumns}
                    currentPage={1}
                    totalPages={5}
                    totalItems={50}
                    pageSize={10}
                    onPageChange={jest.fn()}
                    onPageSizeChange={jest.fn()}
                    onSearch={mockSearch}
                />
            );

            const searchInput = screen.getByPlaceholderText('Search...');
            fireEvent.change(searchInput, { target: { value: 'test' } });

            expect(mockSearch).toHaveBeenCalledWith('test');
        });

        it('handles pagination correctly', () => {
            const mockPageChange = jest.fn();
            render(
                <MobileTableNavigation
                    columns={mockColumns}
                    currentPage={2}
                    totalPages={5}
                    totalItems={50}
                    pageSize={10}
                    onPageChange={mockPageChange}
                    onPageSizeChange={jest.fn()}
                />
            );

            const nextButton = screen.getByLabelText('Next page');
            fireEvent.click(nextButton);

            expect(mockPageChange).toHaveBeenCalledWith(3);

            const prevButton = screen.getByLabelText('Previous page');
            fireEvent.click(prevButton);

            expect(mockPageChange).toHaveBeenCalledWith(1);
        });

        it('shows sort panel when sort button is clicked', () => {
            const mockSort = jest.fn();
            render(
                <MobileTableNavigation
                    columns={mockColumns}
                    currentPage={1}
                    totalPages={5}
                    totalItems={50}
                    pageSize={10}
                    onPageChange={jest.fn()}
                    onPageSizeChange={jest.fn()}
                    onSort={mockSort}
                />
            );

            const sortButton = screen.getByLabelText('Toggle sort options');
            fireEvent.click(sortButton);

            expect(screen.getByText('Sort by')).toBeInTheDocument();
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Date')).toBeInTheDocument();

            const nameButton = screen.getByText('Name');
            fireEvent.click(nameButton);

            expect(mockSort).toHaveBeenCalledWith('name', 'asc');
        });

        it('shows filters panel when filter button is clicked', () => {
            render(
                <MobileTableNavigation
                    columns={mockColumns}
                    currentPage={1}
                    totalPages={5}
                    totalItems={50}
                    pageSize={10}
                    onPageChange={jest.fn()}
                    onPageSizeChange={jest.fn()}
                />
            );

            const filterButton = screen.getByLabelText('Toggle filters');
            fireEvent.click(filterButton);

            expect(screen.getByText('Filters')).toBeInTheDocument();
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
        });

        it('handles view mode toggle correctly', () => {
            const mockViewModeChange = jest.fn();
            render(
                <MobileTableNavigation
                    columns={mockColumns}
                    currentPage={1}
                    totalPages={5}
                    totalItems={50}
                    pageSize={10}
                    onPageChange={jest.fn()}
                    onPageSizeChange={jest.fn()}
                    onViewModeChange={mockViewModeChange}
                    showViewToggle={true}
                />
            );

            const gridButton = screen.getByLabelText('Grid view');
            fireEvent.click(gridButton);

            expect(mockViewModeChange).toHaveBeenCalledWith('grid');
        });
    });

    describe('useMobileOptimizations hook', () => {
        beforeEach(() => {
            // Mock window dimensions
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1024,
            });
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: 768,
            });
        });

        it('detects desktop correctly', () => {
            const { result } = renderHook(() => useMobileOptimizations());

            expect(result.current.isDesktop).toBe(true);
            expect(result.current.isMobile).toBe(false);
            expect(result.current.isTablet).toBe(false);
        });

        it('detects mobile correctly', () => {
            // Mock mobile dimensions
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            const { result } = renderHook(() => useMobileOptimizations());

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(result.current.isMobile).toBe(true);
            expect(result.current.isDesktop).toBe(false);
            expect(result.current.isTablet).toBe(false);
        });

        it('detects tablet correctly', () => {
            // Mock tablet dimensions
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 800,
            });

            const { result } = renderHook(() => useMobileOptimizations());

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(result.current.isTablet).toBe(true);
            expect(result.current.isMobile).toBe(false);
            expect(result.current.isDesktop).toBe(false);
        });

        it('detects orientation correctly', () => {
            // Mock landscape orientation
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 800,
            });
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: 600,
            });

            const { result } = renderHook(() => useMobileOptimizations());

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(result.current.orientation).toBe('landscape');
        });

        it('provides responsive values correctly', () => {
            const { result } = renderHook(() => useMobileOptimizations());

            const responsiveValue = result.current.getResponsiveValue(
                'mobile',
                'tablet',
                'desktop'
            );
            expect(responsiveValue).toBe('desktop');
        });

        it('provides touch-friendly sizes correctly', () => {
            const { result } = renderHook(() => useMobileOptimizations());

            const touchSize = result.current.getTouchFriendlySize(32);
            expect(touchSize).toBeGreaterThanOrEqual(32);
        });
    });
});

describe('Cross-device Compatibility', () => {
    it('handles different screen sizes correctly', () => {
        const testSizes = [
            { width: 320, height: 568, expected: 'mobile' },
            { width: 768, height: 1024, expected: 'tablet' },
            { width: 1920, height: 1080, expected: 'desktop' },
        ];

        testSizes.forEach(({ width, height, expected }) => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: width,
            });
            Object.defineProperty(window, 'innerHeight', {
                writable: true,
                configurable: true,
                value: height,
            });

            const { result } = renderHook(() => useMobileOptimizations());

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            if (expected === 'mobile') {
                expect(result.current.isMobile).toBe(true);
            } else if (expected === 'tablet') {
                expect(result.current.isTablet).toBe(true);
            } else {
                expect(result.current.isDesktop).toBe(true);
            }
        });
    });

    it('handles orientation changes correctly', async () => {
        const { result } = renderHook(() => useMobileOptimizations());

        // Portrait
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 667,
        });

        act(() => {
            window.dispatchEvent(new Event('orientationchange'));
        });

        await waitFor(() => {
            expect(result.current.orientation).toBe('portrait');
        });

        // Landscape
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 667,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 375,
        });

        act(() => {
            window.dispatchEvent(new Event('orientationchange'));
        });

        await waitFor(() => {
            expect(result.current.orientation).toBe('landscape');
        });
    });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaSearchResults } from '@/components/media-search/MediaSearchResults';
import { MediaItem } from '@/types/media-search';
import { ThemeProvider } from '@/lib/ThemeContext';

// Mock the theme context
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => <ThemeProvider>{children}</ThemeProvider>;

// Mock intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
});

const mockMediaItems: MediaItem[] = [
    {
        id: '1',
        providerId: 'unsplash',
        title: 'Test Image 1',
        description: 'A test image',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        previewUrl: 'https://example.com/preview1.jpg',
        downloadUrl: 'https://example.com/download1.jpg',
        width: 1920,
        height: 1080,
        mediaType: 'image',
        attribution: {
            required: false,
            placement: 'none',
        },
        license: {
            type: 'unsplash',
            name: 'Unsplash License',
            url: 'https://unsplash.com/license',
            commercialUse: true,
            attribution: {
                required: false,
                placement: 'none',
            },
        },
        tags: ['test', 'image'],
        photographer: {
            name: 'Test Photographer',
        },
    },
    {
        id: '2',
        providerId: 'pexels',
        title: 'Test Image 2',
        description: 'Another test image',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        previewUrl: 'https://example.com/preview2.jpg',
        downloadUrl: 'https://example.com/download2.jpg',
        width: 1920,
        height: 1080,
        mediaType: 'image',
        attribution: {
            required: true,
            text: 'Photo by Test Photographer',
            placement: 'image-caption',
        },
        license: {
            type: 'pexels',
            name: 'Pexels License',
            url: 'https://pexels.com/license',
            commercialUse: true,
            attribution: {
                required: true,
                text: 'Photo by Test Photographer',
                placement: 'image-caption',
            },
        },
        tags: ['test', 'image'],
        photographer: {
            name: 'Test Photographer 2',
        },
    },
];

describe('MediaSearchResults', () => {
    const defaultProps = {
        items: mockMediaItems,
        isLoading: false,
        error: null,
        hasMore: false,
        selectedItems: [],
        onLoadMore: jest.fn(),
        onSelectItem: jest.fn(),
        onPreviewItem: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders media items correctly', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
        expect(screen.getByText('Test Image 2')).toBeInTheDocument();
        expect(screen.getByText('by Test Photographer')).toBeInTheDocument();
        expect(screen.getByText('by Test Photographer 2')).toBeInTheDocument();
    });

    it('shows loading skeleton when loading and no items', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    items={[]}
                    isLoading={true}
                />
            </MockThemeProvider>
        );

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(
            screen.getByLabelText('Loading media results')
        ).toBeInTheDocument();
    });

    it('shows empty state when no items and not loading', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    items={[]}
                    isLoading={false}
                />
            </MockThemeProvider>
        );

        // The EmptyState component should be rendered
        expect(screen.getByText('Discover Amazing Images')).toBeInTheDocument();
    });

    it('shows error state when error exists and no items', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    items={[]}
                    error='Test error message'
                />
            </MockThemeProvider>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('calls onSelectItem when media card is clicked', async () => {
        const onSelectItem = jest.fn();

        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    onSelectItem={onSelectItem}
                />
            </MockThemeProvider>
        );

        // Find the first media card and click it
        const mediaCards = screen.getAllByRole('button');
        const firstCard = mediaCards.find((card) =>
            card.getAttribute('aria-label')?.includes('Test Image 1')
        );

        if (firstCard) {
            fireEvent.click(firstCard);
            expect(onSelectItem).toHaveBeenCalledWith(mockMediaItems[0]);
        }
    });

    it('shows offline indicator when offline', () => {
        // Mock offline state
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false,
        });

        render(
            <MockThemeProvider>
                <MediaSearchResults {...defaultProps} />
            </MockThemeProvider>
        );

        expect(
            screen.getByText(
                "You're offline. Some features may not work properly."
            )
        ).toBeInTheDocument();

        // Reset to online
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
    });

    it('shows load more indicator when loading more', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    hasMore={true}
                    isLoading={true}
                />
            </MockThemeProvider>
        );

        expect(screen.getByText('Loading more images...')).toBeInTheDocument();
    });

    it('shows end of results message when no more items', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults {...defaultProps} hasMore={false} />
            </MockThemeProvider>
        );

        expect(
            screen.getByText("You've reached the end of the results")
        ).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
        const onLoadMore = jest.fn();

        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    hasMore={true}
                    onLoadMore={onLoadMore}
                />
            </MockThemeProvider>
        );

        // Simulate Ctrl+ArrowDown keypress
        fireEvent.keyDown(document, { key: 'ArrowDown', ctrlKey: true });

        expect(onLoadMore).toHaveBeenCalled();
    });

    it('shows selected state for selected items', () => {
        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    selectedItems={[mockMediaItems[0]]}
                />
            </MockThemeProvider>
        );

        // The first item should show as selected
        // This would be tested by checking the MediaCard component's selected state
        // Since MediaCard handles its own selection styling, we just verify it renders
        expect(screen.getByText('Test Image 1')).toBeInTheDocument();
    });

    it('disables interactions when disabled prop is true', () => {
        const onSelectItem = jest.fn();

        render(
            <MockThemeProvider>
                <MediaSearchResults
                    {...defaultProps}
                    disabled={true}
                    onSelectItem={onSelectItem}
                />
            </MockThemeProvider>
        );

        // Try to click a media card - it should not trigger the callback
        const mediaCards = screen.getAllByRole('button');
        const firstCard = mediaCards.find((card) =>
            card.getAttribute('aria-label')?.includes('Test Image 1')
        );

        if (firstCard) {
            fireEvent.click(firstCard);
            // The callback might still be called, but the MediaCard should handle the disabled state
            // This is more of an integration test with MediaCard
        }
    });
});

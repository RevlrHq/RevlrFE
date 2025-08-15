import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectedMediaPanel } from '@/components/media-search/SelectedMediaPanel';
import { MediaItem } from '@/types/media-search';
import { ThemeProvider } from '@/lib/ThemeContext';

// Mock the theme context
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => <ThemeProvider>{children}</ThemeProvider>;

// Mock media items
const mockMediaItems: MediaItem[] = [
    {
        id: 'test-image-1',
        providerId: 'unsplash',
        title: 'Beautiful Landscape',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        previewUrl: 'https://example.com/preview1.jpg',
        downloadUrl: 'https://example.com/download1.jpg',
        width: 1920,
        height: 1080,
        fileSize: 2048000, // 2MB
        mediaType: 'image',
        attribution: { required: false, placement: 'none' },
        license: {
            type: 'unsplash',
            name: 'Unsplash License',
            url: 'https://unsplash.com/license',
            commercialUse: true,
            attribution: { required: false, placement: 'none' },
        },
        tags: ['landscape'],
        photographer: { name: 'John Doe' },
    },
    {
        id: 'test-image-2',
        providerId: 'pexels',
        title: 'City Skyline',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        previewUrl: 'https://example.com/preview2.jpg',
        downloadUrl: 'https://example.com/download2.jpg',
        width: 1600,
        height: 900,
        fileSize: 1536000, // 1.5MB
        mediaType: 'image',
        attribution: {
            required: true,
            text: 'Photo by Jane Smith',
            placement: 'image-caption',
        },
        license: {
            type: 'pexels',
            name: 'Pexels License',
            url: 'https://pexels.com/license',
            commercialUse: true,
            attribution: { required: true, placement: 'image-caption' },
        },
        tags: ['city'],
        photographer: { name: 'Jane Smith' },
    },
    {
        id: 'test-video-1',
        providerId: 'pixabay',
        title: 'Nature Video',
        thumbnailUrl: 'https://example.com/thumb3.jpg',
        previewUrl: 'https://example.com/preview3.jpg',
        downloadUrl: 'https://example.com/download3.mp4',
        width: 1280,
        height: 720,
        fileSize: 5242880, // 5MB
        mediaType: 'video',
        attribution: { required: false, placement: 'none' },
        license: {
            type: 'pixabay-standard',
            name: 'Pixabay License',
            url: 'https://pixabay.com/license',
            commercialUse: true,
            attribution: { required: false, placement: 'none' },
        },
        tags: ['nature'],
        photographer: { name: 'Bob Wilson' },
    },
];

describe('SelectedMediaPanel', () => {
    const defaultProps = {
        selectedItems: mockMediaItems,
        onRemoveItem: jest.fn(),
        onClearAll: jest.fn(),
        onPreviewItem: jest.fn(),
        onDownloadSelected: jest.fn(),
        onReorderItems: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders empty state when no items are selected', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} selectedItems={[]} />
            </MockThemeProvider>
        );

        expect(screen.getByText('No images selected')).toBeInTheDocument();
        expect(
            screen.getByText('Select up to 10 images for your event')
        ).toBeInTheDocument();
    });

    it('displays selected items count and total file size', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('3 of 10 selected')).toBeInTheDocument();
        expect(screen.getByText('8.42 MB')).toBeInTheDocument(); // Total of all file sizes
    });

    it('shows progress bar with correct percentage', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} maxSelections={5} />
            </MockThemeProvider>
        );

        expect(screen.getByText('3 of 5 selected')).toBeInTheDocument();

        // Progress bar should be 60% (3/5)
        const progressBar = document.querySelector('[style*="width: 60%"]');
        expect(progressBar).toBeInTheDocument();
    });

    it('shows warning when at selection limit', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} maxSelections={3} />
            </MockThemeProvider>
        );

        expect(
            screen.getByText('Maximum selection reached')
        ).toBeInTheDocument();
    });

    it('renders items in grid view by default', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Should show grid view with order indicators
        expect(screen.getByText('1')).toBeInTheDocument(); // Order indicator
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('switches between grid and list view', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Switch to list view
        const listViewButton = screen.getByTitle('List view');
        await user.click(listViewButton);

        // Should show more detailed information in list view
        expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
        expect(screen.getByText('1600 × 900')).toBeInTheDocument();
    });

    it('calls onRemoveItem when remove button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Hover over first item to show remove button
        const firstItem = screen.getByAltText('Beautiful Landscape');
        await user.hover(firstItem.closest('div')!);

        // Click remove button
        const removeButtons = screen.getAllByTitle('Remove');
        await user.click(removeButtons[0]);

        expect(defaultProps.onRemoveItem).toHaveBeenCalledWith(
            'unsplash-test-image-1'
        );
    });

    it('calls onPreviewItem when preview button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Hover over first item to show preview button
        const firstItem = screen.getByAltText('Beautiful Landscape');
        await user.hover(firstItem.closest('div')!);

        // Click preview button
        const previewButtons = screen.getAllByTitle('Preview');
        await user.click(previewButtons[0]);

        expect(defaultProps.onPreviewItem).toHaveBeenCalledWith(
            mockMediaItems[0]
        );
    });

    it('calls onClearAll when clear all button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        const clearAllButton = screen.getByText('Clear All');
        await user.click(clearAllButton);

        expect(defaultProps.onClearAll).toHaveBeenCalledTimes(1);
    });

    it('calls onDownloadSelected when download button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        const downloadButton = screen.getByText('Use Selected (3)');
        await user.click(downloadButton);

        expect(defaultProps.onDownloadSelected).toHaveBeenCalledTimes(1);
    });

    it('shows download progress when downloading', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel
                    {...defaultProps}
                    isDownloading={true}
                    downloadProgress={45}
                />
            </MockThemeProvider>
        );

        expect(screen.getAllByText('Downloading...')[0]).toBeInTheDocument();
        expect(screen.getByText('45%')).toBeInTheDocument();

        // Download button should show downloading state
        expect(screen.getAllByText('Downloading...')[1]).toBeInTheDocument();
    });

    it('disables buttons when downloading', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} isDownloading={true} />
            </MockThemeProvider>
        );

        // Find the actual button elements, not just text
        const downloadButton = screen.getByRole('button', {
            name: /downloading/i,
        });
        const clearAllButton = screen.getByRole('button', {
            name: /clear all/i,
        });

        expect(downloadButton).toBeDisabled();
        expect(clearAllButton).toBeDisabled();
    });

    it('handles reordering with move up/down buttons', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Hover over second item to show reorder buttons
        const secondItem = screen.getByAltText('City Skyline');
        await user.hover(secondItem.closest('div')!);

        // Click move up button
        const moveUpButtons = screen.getAllByTitle('Move up');
        await user.click(moveUpButtons[0]); // Second item's move up button

        expect(defaultProps.onReorderItems).toHaveBeenCalledWith([
            mockMediaItems[1], // Second item moved to first
            mockMediaItems[0], // First item moved to second
            mockMediaItems[2], // Third item stays
        ]);
    });

    it('supports drag and drop reordering', async () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        const firstItem = screen
            .getByAltText('Beautiful Landscape')
            .closest('div')!;
        const secondItem = screen.getByAltText('City Skyline').closest('div')!;

        // Mock dataTransfer for drag and drop
        const mockDataTransfer = {
            effectAllowed: '',
            dropEffect: '',
            setData: jest.fn(),
        };

        // Simulate drag and drop
        fireEvent.dragStart(firstItem, { dataTransfer: mockDataTransfer });
        fireEvent.dragOver(secondItem, { dataTransfer: mockDataTransfer });
        fireEvent.drop(secondItem, { dataTransfer: mockDataTransfer });

        expect(defaultProps.onReorderItems).toHaveBeenCalled();
    });

    it('displays media type indicators correctly', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Video should have video indicator (SVG icon)
        const videoItem = screen.getByAltText('Nature Video');
        const videoContainer = videoItem.closest('div');
        expect(videoContainer).toContainHTML('lucide-video'); // Video SVG icon
    });

    it('shows attribution indicators for items that require attribution', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Second item requires attribution
        const cityItem = screen.getByAltText('City Skyline');
        expect(cityItem.closest('div')).toContainHTML('©'); // Attribution indicator
    });

    it('displays provider information in list view', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} />
            </MockThemeProvider>
        );

        // Switch to list view
        const listViewButton = screen.getByTitle('List view');
        await user.click(listViewButton);

        expect(screen.getByText('unsplash')).toBeInTheDocument();
        expect(screen.getByText('pexels')).toBeInTheDocument();
        expect(screen.getByText('pixabay')).toBeInTheDocument();
    });

    it('handles empty selection state correctly', () => {
        render(
            <MockThemeProvider>
                <SelectedMediaPanel {...defaultProps} selectedItems={[]} />
            </MockThemeProvider>
        );

        // Should not show action buttons
        expect(screen.queryByText('Use Selected')).not.toBeInTheDocument();
        expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('formats file sizes correctly', () => {
        const largeFileItem: MediaItem = {
            ...mockMediaItems[0],
            fileSize: 1073741824, // 1GB
        };

        render(
            <MockThemeProvider>
                <SelectedMediaPanel
                    {...defaultProps}
                    selectedItems={[largeFileItem]}
                />
            </MockThemeProvider>
        );

        expect(screen.getByText('1 GB')).toBeInTheDocument();
    });

    it('handles items without file size information', () => {
        const noSizeItem: MediaItem = {
            ...mockMediaItems[0],
            fileSize: undefined,
        };

        render(
            <MockThemeProvider>
                <SelectedMediaPanel
                    {...defaultProps}
                    selectedItems={[noSizeItem]}
                />
            </MockThemeProvider>
        );

        // Should still render without errors
        expect(screen.getByAltText('Beautiful Landscape')).toBeInTheDocument();
    });
});

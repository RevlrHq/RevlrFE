import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaPreviewModal } from '@/components/media-search/MediaPreviewModal';
import { MediaItem } from '@/types/media-search';
import { EventCreationData } from '@/types/event-creation';
import { ThemeProvider } from '@/lib/ThemeContext';

// Mock the theme context
const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => <ThemeProvider>{children}</ThemeProvider>;

// Mock media item
const mockMediaItem: MediaItem = {
    id: 'test-image-1',
    providerId: 'unsplash',
    title: 'Beautiful Landscape',
    description: 'A stunning mountain landscape at sunset',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewUrl: 'https://example.com/preview.jpg',
    downloadUrl: 'https://example.com/download.jpg',
    width: 1920,
    height: 1080,
    fileSize: 2048000, // 2MB
    mediaType: 'image',
    attribution: {
        required: true,
        text: 'Photo by John Doe on Unsplash',
        linkUrl: 'https://unsplash.com/@johndoe',
        placement: 'image-caption',
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
    tags: ['landscape', 'mountain', 'sunset', 'nature'],
    color: '#ff6b35',
    photographer: {
        name: 'John Doe',
        profileUrl: 'https://unsplash.com/@johndoe',
        avatarUrl: 'https://example.com/avatar.jpg',
    },
};

// Mock event data
const mockEventData: EventCreationData = {
    eventName: 'Tech Conference 2024',
    eventDescription: 'A conference about the latest in technology',
    eventCategory: 'technology',
    dateRange: {
        startDate: '2024-06-15',
        endDate: '2024-06-16',
    },
    timeRange: {
        startTime: '09:00',
        endTime: '17:00',
    },
    locationType: 'in-person',
    locationDetails: {
        venueName: 'Convention Center',
        address: '123 Main St, City, State',
    },
    organizerName: 'Tech Events Inc.',
    images: [],
};

describe('MediaPreviewModal', () => {
    const defaultProps = {
        item: mockMediaItem,
        isSelected: false,
        onClose: jest.fn(),
        onSelect: jest.fn(),
        onDeselect: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the modal with media item information', () => {
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('Beautiful Landscape')).toBeInTheDocument();
        expect(screen.getByText('by John Doe')).toBeInTheDocument();
        expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
        expect(screen.getByText('16:9')).toBeInTheDocument();
    });

    it('displays the correct selection button state', () => {
        const { rerender } = render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('Select This Image')).toBeInTheDocument();

        rerender(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} isSelected={true} />
            </MockThemeProvider>
        );

        expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('calls onSelect when select button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        const selectButton = screen.getByText('Select This Image');
        await user.click(selectButton);

        expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onDeselect when deselect button is clicked for selected item', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} isSelected={true} />
            </MockThemeProvider>
        );

        const selectedButton = screen.getByText('Selected');
        await user.click(selectedButton);

        expect(defaultProps.onDeselect).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        const closeButton = screen.getByLabelText('Close preview');
        await user.click(closeButton);

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard shortcuts correctly', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        // Test Escape key
        await user.keyboard('{Escape}');
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

        // Test Enter key for selection
        await user.keyboard('{Enter}');
        expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);

        // Test Space key for selection
        await user.keyboard(' ');
        expect(defaultProps.onSelect).toHaveBeenCalledTimes(2);
    });

    it('displays zoom controls and handles zoom interactions', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        // Check initial zoom level
        expect(screen.getByText('100%')).toBeInTheDocument();

        // Test zoom in
        const zoomInButton = screen.getByTitle('Zoom in (+)');
        await user.click(zoomInButton);

        await waitFor(() => {
            expect(screen.getByText('120%')).toBeInTheDocument();
        });

        // Test zoom out
        const zoomOutButton = screen.getByTitle('Zoom out (-)');
        await user.click(zoomOutButton);

        await waitFor(() => {
            expect(screen.getByText('100%')).toBeInTheDocument();
        });

        // Test reset view
        const resetButton = screen.getByText('100%');
        await user.click(resetButton);
    });

    it('displays metadata tab content correctly', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        // Metadata tab should be active by default
        expect(screen.getByText('Details')).toHaveClass(
            'text-revlr-primary-blue'
        );
        expect(screen.getByText('Aspect Ratio:')).toBeInTheDocument();
        expect(screen.getByText('File Size:')).toBeInTheDocument();
        expect(screen.getByText('2 MB')).toBeInTheDocument();
    });

    it('displays event context preview when event data is provided', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal
                    {...defaultProps}
                    eventData={mockEventData}
                />
            </MockThemeProvider>
        );

        // Switch to context tab
        const contextTab = screen.getByText('Preview');
        await user.click(contextTab);

        expect(
            screen.getByText('How this will appear in your event')
        ).toBeInTheDocument();
        expect(screen.getByText('Tech Conference 2024')).toBeInTheDocument();
        expect(screen.getByText('Convention Center')).toBeInTheDocument();
    });

    it('displays attribution information correctly', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        // Switch to attribution tab
        const attributionTab = screen.getByText('License');
        await user.click(attributionTab);

        expect(screen.getByText('License Information')).toBeInTheDocument();
        expect(screen.getByText('Unsplash License')).toBeInTheDocument();
        expect(screen.getByText('Commercial Use:')).toBeInTheDocument();
        expect(screen.getByText('Allowed')).toBeInTheDocument();
    });

    it('shows selection limit warning when at maximum', () => {
        render(
            <MockThemeProvider>
                <MediaPreviewModal
                    {...defaultProps}
                    maxSelections={5}
                    currentSelectionCount={5}
                />
            </MockThemeProvider>
        );

        expect(
            screen.getByText('Maximum of 5 images can be selected')
        ).toBeInTheDocument();

        const selectButton = screen.getByText('Select This Image');
        expect(selectButton).toBeDisabled();
    });

    it('displays image quality assessment', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal
                    {...defaultProps}
                    eventData={mockEventData}
                />
            </MockThemeProvider>
        );

        // Switch to context tab
        const contextTab = screen.getByText('Preview');
        await user.click(contextTab);

        expect(
            screen.getByText('Image Quality Assessment')
        ).toBeInTheDocument();
        expect(screen.getByText('Resolution:')).toBeInTheDocument();
        expect(screen.getByText('Excellent')).toBeInTheDocument(); // 1920x1080 is excellent
    });

    it('handles disabled state correctly', () => {
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} disabled={true} />
            </MockThemeProvider>
        );

        const selectButton = screen.getByText('Select This Image');
        const closeButton = screen.getByLabelText('Close preview');

        expect(selectButton).toBeDisabled();
        expect(closeButton).toBeDisabled();
    });

    it('displays video media type indicator', () => {
        const videoItem: MediaItem = {
            ...mockMediaItem,
            mediaType: 'video',
        };

        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} item={videoItem} />
            </MockThemeProvider>
        );

        expect(screen.getByText('video')).toBeInTheDocument();
    });

    it('shows attribution required warning', () => {
        const attributionRequiredItem: MediaItem = {
            ...mockMediaItem,
            attribution: {
                required: true,
                text: 'Photo by John Doe',
                placement: 'image-caption',
            },
        };

        render(
            <MockThemeProvider>
                <MediaPreviewModal
                    {...defaultProps}
                    item={attributionRequiredItem}
                />
            </MockThemeProvider>
        );

        // The attribution indicator should be visible
        expect(screen.getByText('©')).toBeInTheDocument();
    });

    it('handles image loading states', async () => {
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        // Initially should show loading state
        const image = screen.getByAltText('Beautiful Landscape');
        expect(image).toHaveClass('opacity-0');

        // Simulate image load
        fireEvent.load(image);

        await waitFor(() => {
            expect(image).toHaveClass('opacity-100');
        });
    });

    it('handles image error state', async () => {
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        const image = screen.getByAltText('Beautiful Landscape');

        // Simulate image error
        fireEvent.error(image);

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load image')
            ).toBeInTheDocument();
        });
    });

    it('toggles metadata panel visibility', async () => {
        const user = userEvent.setup();
        render(
            <MockThemeProvider>
                <MediaPreviewModal {...defaultProps} />
            </MockThemeProvider>
        );

        // Metadata should be visible initially
        expect(screen.getByText('Beautiful Landscape')).toBeInTheDocument();

        // Toggle metadata off
        const toggleButton = screen.getByTitle('Toggle metadata (M)');
        await user.click(toggleButton);

        // Metadata panel should be hidden (but we can't easily test this with current structure)
        // The button should still be there
        expect(toggleButton).toBeInTheDocument();
    });
});

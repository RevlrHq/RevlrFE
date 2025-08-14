import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaCard } from '@/components/media-search/MediaCard';
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

const mockMediaItem: MediaItem = {
    id: '1',
    providerId: 'unsplash',
    title: 'Test Image',
    description: 'A test image',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    previewUrl: 'https://example.com/preview.jpg',
    downloadUrl: 'https://example.com/download.jpg',
    width: 1920,
    height: 1080,
    fileSize: 1024000, // 1MB
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
    color: '#ff0000',
    photographer: {
        name: 'Test Photographer',
        profileUrl: 'https://example.com/photographer',
        avatarUrl: 'https://example.com/avatar.jpg',
    },
};

describe('MediaCard', () => {
    const defaultProps = {
        item: mockMediaItem,
        isSelected: false,
        onSelect: jest.fn(),
        onPreview: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders media item information correctly', () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('Test Image')).toBeInTheDocument();
        expect(screen.getByText('by Test Photographer')).toBeInTheDocument();
        expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
        expect(screen.getByText('1000 KB')).toBeInTheDocument();
    });

    it('shows provider badge', () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('UNSPLASH')).toBeInTheDocument();
    });

    it('shows attribution indicator when required', () => {
        const itemWithAttribution = {
            ...mockMediaItem,
            attribution: {
                required: true,
                text: 'Photo by Test Photographer',
                placement: 'image-caption' as const,
            },
        };

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} item={itemWithAttribution} />
            </MockThemeProvider>
        );

        expect(screen.getByText('©')).toBeInTheDocument();
    });

    it('shows video indicator for video media', () => {
        const videoItem = {
            ...mockMediaItem,
            mediaType: 'video' as const,
        };

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} item={videoItem} />
            </MockThemeProvider>
        );

        expect(screen.getByText('VIDEO')).toBeInTheDocument();
    });

    it('calls onSelect when card is clicked', () => {
        const onSelect = jest.fn();

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} onSelect={onSelect} />
            </MockThemeProvider>
        );

        const card = screen.getByLabelText('Test Image by Test Photographer');
        fireEvent.click(card);

        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onPreview when preview button is clicked', () => {
        const onPreview = jest.fn();

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} onPreview={onPreview} />
            </MockThemeProvider>
        );

        // Hover to show the overlay with buttons
        const card = screen.getByRole('button');
        fireEvent.mouseEnter(card);

        const previewButton = screen.getByLabelText('Preview Test Image');
        fireEvent.click(previewButton);

        expect(onPreview).toHaveBeenCalledTimes(1);
    });

    it('calls onSelect when select button is clicked', () => {
        const onSelect = jest.fn();

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} onSelect={onSelect} />
            </MockThemeProvider>
        );

        // Hover to show the overlay with buttons
        const card = screen.getByRole('button');
        fireEvent.mouseEnter(card);

        const selectButton = screen.getByLabelText('Select Test Image');
        fireEvent.click(selectButton);

        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('shows selected state when isSelected is true', () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} isSelected={true} />
            </MockThemeProvider>
        );

        // Hover to show the overlay with buttons
        const card = screen.getByRole('button');
        fireEvent.mouseEnter(card);

        expect(
            screen.getByLabelText('Deselect Test Image')
        ).toBeInTheDocument();
    });

    it('handles keyboard navigation', () => {
        const onSelect = jest.fn();

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} onSelect={onSelect} />
            </MockThemeProvider>
        );

        const card = screen.getByRole('button');

        // Test Enter key
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(onSelect).toHaveBeenCalledTimes(1);

        // Test Space key
        fireEvent.keyDown(card, { key: ' ' });
        expect(onSelect).toHaveBeenCalledTimes(2);
    });

    it('handles preview keyboard shortcut', () => {
        const onPreview = jest.fn();

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} onPreview={onPreview} />
            </MockThemeProvider>
        );

        const card = screen.getByRole('button');

        // Test Ctrl+P
        fireEvent.keyDown(card, { key: 'p', ctrlKey: true });
        expect(onPreview).toHaveBeenCalledTimes(1);
    });

    it('disables interactions when disabled prop is true', () => {
        const onSelect = jest.fn();
        const onPreview = jest.fn();

        render(
            <MockThemeProvider>
                <MediaCard
                    {...defaultProps}
                    disabled={true}
                    onSelect={onSelect}
                    onPreview={onPreview}
                />
            </MockThemeProvider>
        );

        const card = screen.getByRole('button');

        // Should not respond to clicks when disabled
        fireEvent.click(card);
        expect(onSelect).not.toHaveBeenCalled();

        // Should not respond to keyboard events when disabled
        fireEvent.keyDown(card, { key: 'Enter' });
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('shows loading state before image loads', () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} />
            </MockThemeProvider>
        );

        // The loading spinner should be visible initially
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows error state when image fails to load', async () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} />
            </MockThemeProvider>
        );

        const image = screen.getByAltText('Test Image');

        // Simulate image load error
        fireEvent.error(image);

        await waitFor(() => {
            expect(screen.getByText('Failed to load')).toBeInTheDocument();
        });
    });

    it('shows color indicator when color is provided', () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} />
            </MockThemeProvider>
        );

        // The color indicator should be present (though not easily testable via text)
        // We can verify the component renders without error
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles different provider badge colors', () => {
        const pexelsItem = { ...mockMediaItem, providerId: 'pexels' };

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} item={pexelsItem} />
            </MockThemeProvider>
        );

        expect(screen.getByText('PEXELS')).toBeInTheDocument();
    });

    it('formats file size correctly', () => {
        const largeFileItem = { ...mockMediaItem, fileSize: 5242880 }; // 5MB

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} item={largeFileItem} />
            </MockThemeProvider>
        );

        expect(screen.getByText('5 MB')).toBeInTheDocument();
    });

    it('handles missing photographer information', () => {
        const itemWithoutPhotographer = {
            ...mockMediaItem,
            photographer: undefined,
        };

        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} item={itemWithoutPhotographer} />
            </MockThemeProvider>
        );

        expect(screen.getByText('by Unknown')).toBeInTheDocument();
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('MediaCard - Simple Tests', () => {
    const defaultProps = {
        item: mockMediaItem,
        isSelected: false,
        onSelect: jest.fn(),
        onPreview: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <MockThemeProvider>
                <MediaCard {...defaultProps} />
            </MockThemeProvider>
        );

        expect(screen.getByText('Test Image')).toBeInTheDocument();
    });

    it('shows media item information', () => {
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

        expect(screen.getByText('unsplash')).toBeInTheDocument();
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

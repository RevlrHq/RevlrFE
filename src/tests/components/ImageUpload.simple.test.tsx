import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageUpload } from '../../components/ImageUpload';
import type { EventImage } from '../../types/event-creation';

// Mock the ImageUploadService
jest.mock('../../lib/services/ImageUploadService');

// Mock the theme context
jest.mock('../../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock the icons
jest.mock('../../icons', () => ({
    CameraIcon: () => <div data-testid='camera-icon'>Camera</div>,
    AddIcon: () => <div data-testid='add-icon'>Add</div>,
}));

// Mock environment variable
process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY = 'test-public-key';

describe('ImageUpload Component - Basic Tests', () => {
    const mockOnImagesChange = jest.fn();

    const mockEventImage: EventImage = {
        id: 'test-image-1',
        url: 'https://ucarecdn.com/test-image-1/',
        cdnUrl: 'https://ucarecdn.com/test-image-1/',
        name: 'test-image.jpg',
        size: 1024000,
        mimeType: 'image/jpeg',
        order: 0,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render empty upload area when no images', () => {
        render(<ImageUpload images={[]} onImagesChange={mockOnImagesChange} />);

        expect(screen.getByText('Add Event Images')).toBeInTheDocument();
        expect(
            screen.getByText('Drag and drop images here, or click to select')
        ).toBeInTheDocument();
        expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('should render uploaded images', () => {
        render(
            <ImageUpload
                images={[mockEventImage]}
                onImagesChange={mockOnImagesChange}
            />
        );

        expect(screen.getByText('Images (1/5)')).toBeInTheDocument();
        expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument();
    });

    it('should show error message when error prop is provided', () => {
        render(
            <ImageUpload
                images={[]}
                onImagesChange={mockOnImagesChange}
                error='At least one image is required'
            />
        );

        expect(
            screen.getByText('At least one image is required')
        ).toBeInTheDocument();
    });

    it('should show maximum images reached message', () => {
        const maxImages = Array.from({ length: 5 }, (_, i) => ({
            ...mockEventImage,
            id: `image-${i}`,
            order: i,
        }));

        render(
            <ImageUpload
                images={maxImages}
                onImagesChange={mockOnImagesChange}
                maxImages={5}
            />
        );

        expect(
            screen.getByText('Maximum images reached (5)')
        ).toBeInTheDocument();
    });

    it('should disable upload when disabled prop is true', () => {
        render(
            <ImageUpload
                images={[]}
                onImagesChange={mockOnImagesChange}
                disabled={true}
            />
        );

        const input = document.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        expect(input).toBeDisabled();
    });

    it('should show file input with correct attributes', () => {
        render(<ImageUpload images={[]} onImagesChange={mockOnImagesChange} />);

        const input = document.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        expect(input).toHaveAttribute('type', 'file');
        expect(input).toHaveAttribute(
            'accept',
            'image/jpeg,image/png,image/webp'
        );
        expect(input).toHaveAttribute('multiple');
    });
});

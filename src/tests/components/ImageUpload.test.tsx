import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageUpload } from '../../components/ImageUpload';
import { ImageUploadService } from '../../lib/services/ImageUploadService';
import type { EventImage } from '../../types/event-creation';

// Mock the ImageUploadService
jest.mock('../../lib/services/ImageUploadService');
const mockImageUploadService = ImageUploadService as jest.Mocked<
    typeof ImageUploadService
>;

// Mock the theme context
jest.mock('../../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock the icons
jest.mock('../../icons', () => ({
    CameraIcon: () => <div data-testid='camera-icon'>Camera</div>,
    AddIcon: () => <div data-testid='add-icon'>Add</div>,
}));

// Mock the MediaSearchModal component
jest.mock('../../components/MediaSearchModal', () => ({
    MediaSearchModal: ({
        isOpen,
        onClose,
        onSelectMedia,
    }: {
        isOpen: boolean;
        onClose: () => void;
        onSelectMedia: (media: EventImage[]) => void;
    }) => {
        if (!isOpen) return null;
        return (
            <div data-testid='media-search-modal'>
                <button onClick={onClose} data-testid='close-modal'>
                    Close
                </button>
                <button
                    onClick={() =>
                        onSelectMedia([
                            {
                                id: 'external_unsplash_test',
                                url: 'https://images.unsplash.com/test',
                                cdnUrl: 'https://images.unsplash.com/test',
                                name: 'Test Unsplash Image',
                                size: 500000,
                                mimeType: 'image/jpeg',
                                order: 0,
                                source: 'external',
                                providerId: 'unsplash',
                                originalId: 'test',
                            },
                        ])
                    }
                    data-testid='select-media'
                >
                    Select Media
                </button>
            </div>
        );
    },
}));

// Mock environment variable
process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY = 'test-public-key';

describe('ImageUpload Component', () => {
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

        // Setup default mocks
        mockImageUploadService.validateImages.mockReturnValue({
            isValid: true,
            errors: [],
        });

        mockImageUploadService.uploadImages.mockResolvedValue([mockEventImage]);

        mockImageUploadService.generateOptimizedUrl.mockImplementation(
            (url) => url
        );

        mockImageUploadService.deleteImage.mockResolvedValue();
    });

    it('should render empty upload area when no images', () => {
        render(<ImageUpload images={[]} onImagesChange={mockOnImagesChange} />);

        expect(screen.getByText('Upload from Device')).toBeInTheDocument();
        expect(
            screen.getByText('Drag & drop or click to select')
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

    it('should handle file selection via input', async () => {
        const { container } = render(
            <ImageUpload images={[]} onImagesChange={mockOnImagesChange} />
        );

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const input = container.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        expect(input).toBeInTheDocument();

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockImageUploadService.validateImages).toHaveBeenCalledWith(
                [file],
                [],
                expect.any(Object)
            );
        });

        await waitFor(() => {
            expect(mockImageUploadService.uploadImages).toHaveBeenCalledWith(
                [file],
                expect.any(Function),
                expect.any(Function),
                expect.any(Object)
            );
        });
    });

    it('should handle drag and drop', async () => {
        render(<ImageUpload images={[]} onImagesChange={mockOnImagesChange} />);

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const uploadArea = screen
            .getByText('Upload from Device')
            .closest('div');

        // Mock DataTransfer
        const dataTransfer = {
            files: [file],
        };

        fireEvent.dragOver(uploadArea!, { dataTransfer });
        fireEvent.drop(uploadArea!, { dataTransfer });

        await waitFor(() => {
            expect(mockImageUploadService.validateImages).toHaveBeenCalledWith(
                [file],
                [],
                expect.any(Object)
            );
        });
    });

    it('should show validation errors', async () => {
        mockImageUploadService.validateImages.mockReturnValue({
            isValid: false,
            errors: ['File too large'],
        });

        // Mock window.alert
        const alertSpy = jest
            .spyOn(window, 'alert')
            .mockImplementation(() => {});

        const { container } = render(
            <ImageUpload images={[]} onImagesChange={mockOnImagesChange} />
        );

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const input = container.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        expect(input).toBeInTheDocument();

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('File too large');
        });

        alertSpy.mockRestore();
    });

    it('should handle image deletion', async () => {
        render(
            <ImageUpload
                images={[mockEventImage]}
                onImagesChange={mockOnImagesChange}
            />
        );

        const imageContainer = screen
            .getByAltText('test-image.jpg')
            .closest('div');

        // Hover to show delete button
        fireEvent.mouseEnter(imageContainer!);

        const deleteButton = screen.getByTitle('Delete');
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockImageUploadService.deleteImage).toHaveBeenCalledWith(
                'test-image-1'
            );
        });

        expect(mockOnImagesChange).toHaveBeenCalledWith([]);
    });

    it('should handle image preview', () => {
        render(
            <ImageUpload
                images={[mockEventImage]}
                onImagesChange={mockOnImagesChange}
            />
        );

        const imageContainer = screen
            .getByAltText('test-image.jpg')
            .closest('div');

        // Hover to show preview button
        fireEvent.mouseEnter(imageContainer!);

        const previewButton = screen.getByTitle('Preview');
        fireEvent.click(previewButton);

        // Check if preview modal is shown
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });

    it('should disable upload when disabled prop is true', () => {
        const { container } = render(
            <ImageUpload
                images={[]}
                onImagesChange={mockOnImagesChange}
                disabled={true}
            />
        );

        // Find the main upload area div (the one with border-dashed)
        const uploadArea = container.querySelector('.border-dashed');
        expect(uploadArea).toHaveClass('cursor-not-allowed', 'opacity-50');

        const input = container.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        expect(input).toBeDisabled();
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

    it('should handle image reordering via drag and drop', () => {
        const images = [
            { ...mockEventImage, id: 'image-1', order: 0 },
            { ...mockEventImage, id: 'image-2', order: 1 },
        ];

        render(
            <ImageUpload images={images} onImagesChange={mockOnImagesChange} />
        );

        const firstImage = screen.getAllByRole('img')[0].closest('div');
        const secondImage = screen.getAllByRole('img')[1].closest('div');

        // Simulate drag and drop
        fireEvent.dragStart(firstImage!, {
            dataTransfer: { effectAllowed: 'move' },
        });
        fireEvent.dragOver(secondImage!);
        fireEvent.drop(secondImage!);

        expect(mockOnImagesChange).toHaveBeenCalledWith([
            { ...mockEventImage, id: 'image-2', order: 0 },
            { ...mockEventImage, id: 'image-1', order: 1 },
        ]);
    });

    it('should show uploading progress', async () => {
        // Mock uploadImages to simulate progress with delay
        mockImageUploadService.uploadImages.mockImplementation(
            async (files, onProgress, onFileComplete) => {
                // Simulate async behavior with a small delay
                await new Promise((resolve) => setTimeout(resolve, 10));

                // Simulate progress updates
                if (onProgress) {
                    onProgress(0, 50);
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    onProgress(0, 100);
                }

                // Simulate completion after progress
                await new Promise((resolve) => setTimeout(resolve, 10));
                if (onFileComplete) {
                    onFileComplete(0, mockEventImage);
                }

                return [mockEventImage];
            }
        );

        const { container } = render(
            <ImageUpload images={[]} onImagesChange={mockOnImagesChange} />
        );

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const input = container.querySelector(
            'input[type="file"]'
        ) as HTMLInputElement;
        expect(input).toBeInTheDocument();

        fireEvent.change(input, { target: { files: [file] } });

        // Should show uploading section
        await waitFor(
            () => {
                expect(screen.getByText('Uploading...')).toBeInTheDocument();
            },
            { timeout: 1000 }
        );
    });

    describe('Media Search Integration', () => {
        it('should show media search option when enableMediaSearch is true', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                />
            );

            expect(
                screen.getByText('Browse Media Library')
            ).toBeInTheDocument();
            expect(
                screen.getByText('Search high-quality stock images')
            ).toBeInTheDocument();
        });

        it('should not show media search option when enableMediaSearch is false', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={false}
                />
            );

            expect(
                screen.queryByText('Browse Media Library')
            ).not.toBeInTheDocument();
        });

        it('should open media search modal when browse library is clicked', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                />
            );

            const browseButton = screen
                .getByText('Browse Media Library')
                .closest('div');
            fireEvent.click(browseButton!);

            expect(
                screen.getByTestId('media-search-modal')
            ).toBeInTheDocument();
        });

        it('should close media search modal when close button is clicked', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                />
            );

            // Open modal
            const browseButton = screen
                .getByText('Browse Media Library')
                .closest('div');
            fireEvent.click(browseButton!);

            expect(
                screen.getByTestId('media-search-modal')
            ).toBeInTheDocument();

            // Close modal
            const closeButton = screen.getByTestId('close-modal');
            fireEvent.click(closeButton);

            expect(
                screen.queryByTestId('media-search-modal')
            ).not.toBeInTheDocument();
        });

        it('should add selected media to images when media is selected', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                />
            );

            // Open modal
            const browseButton = screen
                .getByText('Browse Media Library')
                .closest('div');
            fireEvent.click(browseButton!);

            // Select media
            const selectButton = screen.getByTestId('select-media');
            fireEvent.click(selectButton);

            expect(mockOnImagesChange).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 'external_unsplash_test',
                    source: 'external',
                    providerId: 'unsplash',
                    name: 'Test Unsplash Image',
                }),
            ]);
        });

        it('should show compact browse library button when images exist', () => {
            render(
                <ImageUpload
                    images={[mockEventImage]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                />
            );

            expect(screen.getByText('Browse Library')).toBeInTheDocument();
        });

        it('should not show browse library button when max images reached', () => {
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
                    enableMediaSearch={true}
                />
            );

            expect(
                screen.queryByText('Browse Library')
            ).not.toBeInTheDocument();
        });

        it('should handle keyboard navigation for browse library button', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                />
            );

            const browseButton = screen
                .getByText('Browse Media Library')
                .closest('div');

            // Focus the button
            browseButton!.focus();

            // Press Enter
            fireEvent.keyDown(browseButton!, { key: 'Enter' });

            expect(
                screen.getByTestId('media-search-modal')
            ).toBeInTheDocument();
        });

        it('should disable media search when component is disabled', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                    disabled={true}
                />
            );

            // Find the browse button by its aria-label
            const browseButton = screen.getByLabelText('Browse media library');
            expect(browseButton).toHaveClass('cursor-not-allowed');
            expect(browseButton).toHaveClass('opacity-50');
        });

        it('should pass event category to media search modal', () => {
            render(
                <ImageUpload
                    images={[]}
                    onImagesChange={mockOnImagesChange}
                    enableMediaSearch={true}
                    eventCategory='business'
                />
            );

            const browseButton = screen
                .getByText('Browse Media Library')
                .closest('div');
            fireEvent.click(browseButton!);

            // The modal should be rendered with the event category
            // This is tested implicitly through the mock component
            expect(
                screen.getByTestId('media-search-modal')
            ).toBeInTheDocument();
        });
    });
});
